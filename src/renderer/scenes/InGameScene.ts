/* eslint-disable import/no-cycle */
/* eslint-disable no-underscore-dangle */
import Phaser from 'phaser';
import { KEYBOARD_KEYS, ZONE_KEYS } from '@/constants';
import { Obstacle } from '@/objects/Obstacle';
import { Player } from '@/objects/Player';
import { type InGameUIScene } from '@/scenes/InGameUIScene';
import { openMenuApp, removeGame, type CustomWebSocket } from '@/index';
import {
  makeZone,
  mouseClickEffect,
  moveRandomlyWithinRange,
} from '@/utils/helper';
import PixelAnimals from '@/public/pixel_animals.png';
import TinySki from '@/public/tiled/tiny_ski.png';
import TinyKenny from '@/public/tiled/tiny_kenny.png';
import map1 from '@/public/tiled/map_1.json';
import map2 from '@/public/tiled/map_2.json';
import { getDuration } from '@/utils';

type ZonePointsType = Record<
  (typeof ZONE_KEYS)[number],
  Phaser.Types.Tilemaps.TiledObject[]
>;

export const GAME = {
  TOTAL_STAGE: 2,
  ZOOM: Number(window.electron.store.get('ZOOM')) || 2,
  RTT: 100,
};
export class InGameScene extends Phaser.Scene {
  initialData: {
    players: { uuid: string; nick: string; frameNo: number }[];
    uuid: string;
    ws: CustomWebSocket;
    stage?: number;
  };
  player: Player;
  players: Player[] = [];
  map: Phaser.Tilemaps.Tilemap;
  playerSpawnPoints: Phaser.Types.Tilemaps.TiledObject;

  obstacles: Obstacle[] = [];
  nonstopZone: MatterJS.BodyType[];
  straightZone: MatterJS.BodyType[];
  invertZone: MatterJS.BodyType[];
  speedZone: MatterJS.BodyType[];
  clearZone: MatterJS.BodyType[];
  collisions: MatterJS.BodyType[];

  async create() {
    this.scene.launch('InGameUIScene');

    const { map, playerSpawnPoints, zonePoints } = this.createMap(this);
    this.map = map;
    this.playerSpawnPoints = playerSpawnPoints;

    this.nonstopZone = makeZone(this, zonePoints.nonstop, {
      color: 0x00ffff,
      label: 'nonstop',
    });
    this.straightZone = makeZone(this, zonePoints.straight, {
      color: 0x00ffff,
      label: 'straight',
    });
    this.invertZone = makeZone(this, zonePoints.invert, {
      color: 0xffffff,
      label: 'invert',
    });
    this.speedZone = makeZone(this, zonePoints.speed, {
      color: 0xffffff,
      label: 'speed',
    });
    this.clearZone = makeZone(this, zonePoints.clear, {
      color: 0xffffff,
      label: 'clear',
    });

    await this.createSocketConnection();
    this.createPlayers();
    this.time.addEvent({
      delay: GAME.RTT,
      callback: () => {
        this.initialData.ws.sendJson({
          type: 'rtt',
          uuid: this.initialData.uuid,
          timestamp: Date.now(),
          x: Number(this.player.x.toFixed(0)),
          y: Number(this.player.y.toFixed(0)),
        });
      },
      loop: true,
    });

    this.matter.world.on('collisionstart', (_event, a, b) => {
      const bodyA = a.gameObject;
      const bodyB = b.gameObject;
      const isPlayer = [bodyA, bodyB].includes(this.player);
      if (!isPlayer) {
        return;
      }
      if (
        [a.label, b.label].includes('collision') ||
        [bodyA, bodyB].some((body) => this.obstacles.includes(body))
      ) {
        if (this.player.disabled) {
          return;
        }
        this.initialData.ws.sendJson({
          uuid: this.player.uuid,
          type: 'dead',
          x: this.player.x.toFixed(0),
          y: this.player.y.toFixed(0),
        });
      }
    });
    this.matter.world.on('collisionstart', (_event, a, b) => {
      const bodyA = a.gameObject;
      const bodyB = b.gameObject;
      if (!(bodyA?.spriteKey && bodyB?.spriteKey)) {
        return;
      }
      const deadPlayer = [bodyA, bodyB].find(({ disabled }) => disabled);
      if (!deadPlayer) {
        return;
      }
      this.initialData.ws.sendJson({
        uuid: deadPlayer.uuid,
        type: 'resurrection',
        x: this.playerSpawnPoints.x,
        y: this.playerSpawnPoints.y,
      });
    });
    this.matter.world.on('collisionstart', (_event, a, b) => {
      const bodyA = a.gameObject;
      const bodyB = b.gameObject;
      const isPlayer = [bodyA, bodyB].includes(this.player);
      if (!isPlayer) {
        return;
      }
      if ([a.label, b.label].includes('clear')) {
        if (this.player.disabled) {
          return;
        }
        this.player.disabled = true;
        this.initialData.ws.sendJson({
          uuid: this.player.uuid,
          nick: this.player.nick,
          type: 'clear',
          stage: this.initialData.stage + 1,
        });
      }
    });
  }
  getPlayerByUuid = (uuid: string) => this.players.find((p) => p.uuid === uuid);
  isAllPlayersDisabled = () => this.players.every(({ disabled }) => disabled);
  wsResponse = (value) => {
    let data;
    try {
      if (value?.type === 'Ping') {
        return;
      }
      data = JSON.parse(value?.data ?? '{}');
    } catch (e) {
      console.error('failed to parse json', typeof value, value);
      data = {};
      return;
    }
    const player = this.getPlayerByUuid(data.uuid);
    const dataManager = {
      move: () => {
        if (!player) {
          return;
        }
        if (player.disabled) {
          return;
        }
        player.moveToXY(Number(data.x), Number(data.y));
      },
      dead: () => {
        if (!player) {
          return;
        }
        if (player.disabled) {
          return;
        }
        player.playerDead(Number(data.x), Number(data.y));
        if (this.isAllPlayersDisabled()) {
          this.onGameOver();
        }
      },
      resurrection: () => {
        player.playerResurrection(Number(data.x), Number(data.y));
        this.ignoreRttCorrection(player);
      },
      clear: () => {
        this.onStageClear(player.nick);
      },
      players: () => {
        const playerDisconnectionCheck = () => {
          const dataPlayerUuids = new Set(data.players.map(({ uuid }) => uuid));
          this.players.forEach((p) => {
            if (!dataPlayerUuids.has(p.uuid)) {
              p.destroy();
            }
          });
          this.players = this.players.filter((p) =>
            dataPlayerUuids.has(p.uuid),
          );
          this.initialData.players = this.players.map(
            ({ uuid, nick, frameNo }) => ({
              uuid,
              nick,
              frameNo,
            }),
          );
        };
        playerDisconnectionCheck();
        const newPlayerConnectionCheck = () => {
          const newPlayers = data.players.filter(
            ({ uuid }) => !this.players.some((p) => p.uuid === uuid),
          );
          if (newPlayers.length > 0) {
            this.initialData.players = [
              ...this.initialData.players,
              ...newPlayers,
            ];
          }
        };
        newPlayerConnectionCheck();
        window.electron.store.set('players', this.initialData.players);
      },
      rtt: () => {
        (this.scene.get('InGameUIScene') as InGameUIScene).pingText.setText(
          `rtt: ${Date.now() - data.timestamp}`,
        );
        this.playerPositionCorrection(data);
      },
    };
    if (data.type in dataManager) {
      dataManager[data.type]();
    } else {
      console.log('another type incoming: ', data);
    }
  };
  createPlayer(player) {
    return new Player(this, {
      x: Phaser.Math.Between(
        this.playerSpawnPoints.x,
        this.playerSpawnPoints.x + this.playerSpawnPoints.width - 16,
      ),
      y: Phaser.Math.Between(
        this.playerSpawnPoints.y,
        this.playerSpawnPoints.y + this.playerSpawnPoints.height - 16,
      ),
      spriteKey: 'pixel_animals',
      frameNo: player.frameNo,
      nick: player.nick,
      uuid: player.uuid,
      isMyPlayer: player.uuid === this.initialData.uuid,
    });
  }
  createPlayers() {
    this.initialData.players.forEach((player) => {
      const newPlayer = this.createPlayer(player);
      this.ignoreRttCorrection(newPlayer);
      if (newPlayer.isMyPlayer) {
        this.player = newPlayer;
        this.onMyPlayerCreated();
      }
      this.players.push(newPlayer);
    });

    this.players
      .sort((a) => (a.isMyPlayer ? -1 : 1))
      .forEach((player, i) => {
        this.input.keyboard.on(`keydown-${KEYBOARD_KEYS[i]}`, () => {
          this.cameras.main
            .setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels)
            .startFollow(player, false)
            .setZoom(GAME.ZOOM);
        });
      });
    this.cameras.main
      .setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels)
      .startFollow(this.player, false)
      .setZoom(GAME.ZOOM);
  }
  onMyPlayerCreated() {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      mouseClickEffect(this, pointer);
      if (this.player.disabled) {
        return;
      }
      if (this.player.zone.straight) {
        return;
      }
      this.initialData.ws.sendJson({
        uuid: this.player.uuid,
        type: 'move',
        x: pointer.worldX.toFixed(0),
        y: pointer.worldY.toFixed(0),
        invert: this.player.zone.invert,
      });
    });
  }
  wsClosed = () => {
    this.removeListeners();
    this.initialData.ws.close();
    removeGame();
    openMenuApp();
    window.electron.ipcRenderer.sendMessage('closeServer');
  };
  removeListeners() {
    this.initialData.ws.removeEventListener('message', this.wsResponse);
    this.initialData.ws.addEventListener('close', this.wsClosed);
  }
  async createSocketConnection() {
    try {
      this.initialData.ws.addEventListener('message', this.wsResponse);
      this.initialData.ws.addEventListener('close', this.wsClosed);
    } catch (e) {
      console.error('jew ws connection failed');
    }
  }
  playerPositionCorrection(serverData: {
    players: { x: number; y: number; uuid: string }[];
  }) {
    serverData.players.forEach(({ x, y, uuid }) => {
      const foundPlayer = this.players.find((p) => p.uuid === uuid);
      if (!foundPlayer) {
        return;
      }
      if (foundPlayer.isIgnoreRttCorrection) {
        return;
      }
      const { x: foundPlayerX, y: foundPlayerY } = foundPlayer;
      if (
        [Math.abs(foundPlayerX - x), Math.abs(foundPlayerY - y)].some(
          (p) => p > 16,
        )
      ) {
        foundPlayer.setPosition(x, y);
        console.log(
          '위치보정(서버):',
          x,
          y,
          ', 원래위치(클라):',
          foundPlayerX,
          foundPlayerY,
        );
      }
    });
  }
  ignoreRttCorrection(player: Player) {
    player.isIgnoreRttCorrection = true;
    this.time.addEvent({
      delay: GAME.RTT + 10,
      callback: () => {
        player.isIgnoreRttCorrection = false;
      },
    });
  }
  createMap(scene: Phaser.Scene) {
    const map = scene.make.tilemap({
      key: `map_${this.initialData.stage}`,
    });
    const bgTiles = map.addTilesetImage('tiny_ski', 'tiny_ski');
    const kennyTiles = map.addTilesetImage('tiny_kenny', 'tiny_kenny');
    const bgLayer = map.createLayer('bg', [bgTiles, kennyTiles]);
    map.createLayer('bg_items', [bgTiles, kennyTiles]);

    this.createCollisions(scene, bgLayer);
    const playerSpawnPoints = map.findObject('PlayerSpawn', () => true);
    const zonePoints = Object.fromEntries(
      ZONE_KEYS.map((zone) => [
        zone,
        map.filterObjects(`${zone}Zone`, () => true) ?? [],
      ]),
    ) as ZonePointsType;

    this.createMovingObstacles(map.filterObjects('obstaclesMove', () => true));
    this.createRandomMoveObstacle(
      map.filterObjects('obstaclesRandom', () => true),
    );
    this.createStopObstacle(map.filterObjects('obstacles', () => true));

    scene.matter.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    return { map, playerSpawnPoints, zonePoints };
  }
  createCollisions(scene, bgLayer) {
    this.collisions = [];
    bgLayer.forEachTile((tile) => {
      const zone = makeZone(
        scene,
        (tile.getCollisionGroup() as any)?.objects.map(({ x, y, ...rest }) => ({
          x: tile.pixelX + x,
          y: tile.pixelY + y,
          ...rest,
        })) ?? [],
        { color: 0x050505, label: 'collision' },
      );
      this.collisions = [...this.collisions, ...zone];
    });
  }
  createMovingObstacles(movingObstacles: Phaser.Types.Tilemaps.TiledObject[]) {
    const obstacles = movingObstacles.map(
      ({ x, y, width, height, properties }) => {
        const moveSpeed =
          properties?.find(({ name }) => name === 'moveSpeed')?.value ?? 1;
        const obstacle = new Obstacle(this, {
          x,
          y,
          width: 10,
          height: 8,
          spriteKey: 'pixel_animals',
          frameNo: 2,
          moveSpeed,
        });
        const isHorizontal = properties?.find(
          ({ name }) => name === 'isHorizontal',
        )?.value;
        obstacle.roundTrip(
          new Phaser.Math.Vector2(
            isHorizontal ? { x: x + width, y } : { x, y: y + height },
          ),
        );
        return obstacle;
      },
    );
    this.obstacles = [...this.obstacles, ...obstacles];
  }
  createRandomMoveObstacle(
    randomMovingObstacles: Phaser.Types.Tilemaps.TiledObject[],
  ) {
    const obstacles = randomMovingObstacles.map(
      ({ x, y, width, height, properties }) => {
        const obstacle = new Obstacle(this, {
          x,
          y,
          width: 10,
          height: 8,
          spriteKey: 'pixel_animals',
          frameNo: 3,
        });
        moveRandomlyWithinRange(
          this,
          obstacle,
          x,
          width,
          y,
          height,
          properties.find(({ name }) => name === 'duration').value,
        );
        return obstacle;
      },
    );
    this.obstacles = [...this.obstacles, ...obstacles];
  }
  createStopObstacle(stopObstacles: Phaser.Types.Tilemaps.TiledObject[]) {
    const obstacles = stopObstacles.map(({ x, y, width, height }) => {
      const obstacle = new Obstacle(this, {
        x,
        y,
        width: width - width / 3,
        height: height - height / 3,
        spriteKey: 'pixel_animals',
        frameNo: 0,
      });
      obstacle.setDisplaySize(width, height);
      return obstacle;
    });
    this.obstacles = [...this.obstacles, ...obstacles];
  }
  createFireObstacle(fireObstacles: Phaser.Types.Tilemaps.TiledObject[]) {
  prepareNextStage(afterShutdown) {
    this.scene.stop();
    const inGameUIScene = this.scene.get('InGameUIScene') as InGameUIScene;
    inGameUIScene.time.delayedCall(2500, () => {
      inGameUIScene.centerTextOff();
      this.shutdown();
      afterShutdown();
    });
  }
  onStageClear(clearNick: string) {
    const inGameUIScene = this.scene.get('InGameUIScene') as InGameUIScene;
    if (this.initialData.stage === GAME.TOTAL_STAGE) {
      inGameUIScene.centerTextOn(`Final Stage Clear by ${clearNick}!`);
      this.prepareNextStage(() => {
        inGameUIScene.onExit();
      });
    } else {
      inGameUIScene.centerTextOn(`Stage Clear by ${clearNick}!`);
      this.prepareNextStage(() => {
        inGameUIScene.scene.start('InGameScene', {
          ...this.initialData,
          stage: this.initialData.stage + 1,
        });
      });
    }
  }
  onGameOver() {
    const inGameUIScene = this.scene.get('InGameUIScene') as InGameUIScene;
    inGameUIScene.centerTextOn('Game Over!');
    this.prepareNextStage(() => {
      this.scene.restart();
    });
  }
  shutdown() {
    this.player?.destroy();
    this.player = null;
    this.players.forEach((player) => player?.destroy());
    this.players = [];
    this.obstacles = [];
    this.scene.systems.shutdown();
  }

  constructor() {
    super('InGameScene');
  }
  preload() {
    this.load.tilemapTiledJSON('map_1', map1);
    this.load.tilemapTiledJSON('map_2', map2);
    this.load.image('tiny_ski', TinySki);
    this.load.spritesheet('tiny_kenny', TinyKenny, {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.spritesheet('pixel_animals', PixelAnimals, {
      frameWidth: 16,
      frameHeight: 16,
    });
  }
  init(data) {
    this.initialData = {
      players: (window.electron.store.get('players') || []) as {
        uuid: string;
        nick: string;
        frameNo: number;
      }[],
      ws: window.ws,
      uuid: window.electron.store.get('uuid') || '',
      stage: data.stage || Number(window.electron.store.get('stage')) || 1,
    };
  }
}
// TODO: 게임 중간에 난입하게되면, 움직이는 객체들의 위치가 동기화가 안되는 문제가 있음. 새로운 스테이지 시작시 난입하도록.
// dead 상태의 플레이어도 동기화 안됨.
