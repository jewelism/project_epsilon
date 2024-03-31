import { KEYBOARD_KEYS, ZONE_KEYS } from "@/constants";
import { Obstacle } from "@/objects/Obstacle";
import { Player } from "@/objects/Player";
import { InGameUIScene } from "@/scenes/InGameUIScene";
import { CustomWebSocket } from "@/scenes/MultiplayLobbyScene";
import { makeZone, mouseClickEffect } from "@/utils/helper";
import { signal } from "@preact/signals-core";

type ZonePointsType = Record<
  (typeof ZONE_KEYS)[number],
  Phaser.Types.Tilemaps.TiledObject[]
>;

const GAME = {
  TOTAL_STAGE: 2,
  ZOOM: Number(localStorage.getItem("ZOOM")) || 2,
  RTT: 100,
};
let wsListenerAlreadySet = false;
export class InGameScene extends Phaser.Scene {
  enableInGameListener = signal(true);
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
  obstacles: Phaser.Physics.Arcade.Group;
  safeZone: Phaser.Geom.Rectangle[];
  nonstopZone: Phaser.Geom.Rectangle[];
  straightZone: Phaser.Geom.Rectangle[];
  invertZone: Phaser.Geom.Rectangle[];
  clearZone: Phaser.Physics.Arcade.StaticGroup;

  async create() {
    this.scene.launch("InGameUIScene");
    this.obstacles = this.physics.add.group();

    const { map, playerSpawnPoints, aliveZonePoints, zonePoints } =
      this.createMap(this);
    this.map = map;
    this.playerSpawnPoints = playerSpawnPoints;

    this.safeZone = makeZone(this, aliveZonePoints, 0x00ff00);
    this.nonstopZone = makeZone(this, zonePoints.nonstop, 0x00ffff);
    this.straightZone = makeZone(this, zonePoints.straight, 0x00ffff);
    this.invertZone = makeZone(this, zonePoints.invert, 0xffffff);
    this.clearZone = this.physics.add.staticGroup(
      zonePoints.clear.map((cz) =>
        this.add
          .rectangle(cz.x, cz.y, cz.width, cz.height, 0xffffff, 0.5)
          .setOrigin(0)
      )
    );

    await this.createSocketConnection();
    this.createPlayers();
    this.time.addEvent({
      delay: GAME.RTT,
      callback: () => {
        this.initialData.ws.sendJson({
          type: "rtt",
          uuid: this.initialData.uuid,
          timestamp: Date.now(),
          x: Number(this.player.x.toFixed(0)),
          y: Number(this.player.y.toFixed(0)),
        });
      },
      loop: true,
    });
  }
  update(_time: number, _delta: number): void {
    if (!this.player) {
      return;
    }
    if (this.player.disabled) {
      return;
    }
    if (!this.player.isPlayerInSafeZone()) {
      if (this.player.disabled) {
        return;
      }
      this.initialData.ws.sendJson({
        uuid: this.player.uuid,
        type: "dead",
        x: this.player.x.toFixed(0),
        y: this.player.y.toFixed(0),
      });
    }
  }
  onMyPlayerCreated() {
    this.physics.add.overlap(this.obstacles, this.player, () => {
      if (this.player.disabled) {
        return;
      }
      this.initialData.ws.sendJson({
        uuid: this.player.uuid,
        type: "dead",
        x: this.player.x.toFixed(0),
        y: this.player.y.toFixed(0),
      });
    });
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      mouseClickEffect(this, pointer);
      if (this.player.disabled) {
        return;
      }
      if (this.player.zone.straight) {
        return;
      }
      this.initialData.ws.sendJson({
        uuid: this.player.uuid,
        type: "move",
        x: pointer.worldX.toFixed(0),
        y: pointer.worldY.toFixed(0),
        invert: this.player.zone.invert,
      });
    });
    this.physics.add.overlap(this.clearZone, this.player, () => {
      if (this.player.disabled) {
        return;
      }
      this.player.disabled = true;
      this.initialData.ws.sendJson({
        uuid: this.player.uuid,
        nick: this.player.nick,
        type: "clear",
      });
    });
  }
  _updateResponse(value) {
    if (!this.enableInGameListener.value) {
      return;
    }
    let data;
    try {
      if (value?.type === "Ping") {
        return;
      }
      data = JSON.parse(value?.data ?? "{}");
    } catch (e) {
      console.error("failed to parse json", typeof value, value);
      data = {};
      return;
    }
    const player = this.players.find(({ uuid }) => uuid === data.uuid);
    const dataManager = {
      move: () => {
        player.moveToXY(Number(data.x), Number(data.y), {
          invert: data.invert,
        });
      },
      dead: () => {
        if (player.disabled) {
          return;
        }
        player.playerDead(Number(data.x), Number(data.y));
        if (this.players.every(({ disabled }) => disabled)) {
          this.onGameOver();
        }
      },
      resurrection: () => {
        player.playerResurrection(Number(data.x), Number(data.y));
        player.isResurrecting = true;
        this.time.addEvent({
          delay: GAME.RTT + 10,
          callback: () => {
            player.isResurrecting = false;
          },
        });
      },
      clear: () => {
        this.onStageClear(player.nick);
      },
      rtt: () => {
        (this.scene.get("InGameUIScene") as InGameUIScene).pingText.setText(
          `rtt: ${Date.now() - data.timestamp}`
        );
        this.playerPositionCorrection(data);
      },
    };
    if (data.type in dataManager) {
      dataManager[data.type]();
    } else {
      console.log("another type incoming: ", data);
    }
  }
  createPlayers() {
    this.initialData.players.forEach((player) => {
      const isMyPlayer = player.uuid === this.initialData.uuid;
      const newPlayer = new Player(this, {
        x: Phaser.Math.Between(
          this.playerSpawnPoints.x,
          this.playerSpawnPoints.x + this.playerSpawnPoints.width - 16
        ),
        y: Phaser.Math.Between(
          this.playerSpawnPoints.y,
          this.playerSpawnPoints.y + this.playerSpawnPoints.height - 16
        ),
        spriteKey: "pixel_animals",
        frameNo: player.frameNo,
        nick: player.nick,
        uuid: player.uuid,
        isMyPlayer,
      });
      if (isMyPlayer) {
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
    const playersGroup = this.add.group(this.players.map((player) => player));
    this.physics.add.overlap(this.player, playersGroup, (player1) => {
      const player = player1 as Player;
      if (!player.disabled) {
        return;
      }
      this.initialData.ws.sendJson({
        uuid: player.uuid,
        type: "resurrection",
        x: this.playerSpawnPoints.x,
        y: this.playerSpawnPoints.y,
      });
    });
  }
  async createSocketConnection() {
    try {
      if (wsListenerAlreadySet) {
        return;
      }
      this.initialData.ws.addListener(this._updateResponse.bind(this));
      wsListenerAlreadySet = true;
    } catch (e) {
      console.error("jew ws connection failed");
    }
  }
  isPlayerInZone(zone: Phaser.Geom.Rectangle[]) {
    return zone.some((zone) =>
      Phaser.Geom.Rectangle.ContainsPoint(
        zone,
        new Phaser.Geom.Point(this.player.x, this.player.y)
      )
    );
  }
  playerPositionCorrection(serverData: {
    players: { x: number; y: number; uuid: string }[];
  }) {
    serverData.players.forEach(({ x, y, uuid }) => {
      const foundPlayer = this.players.find((p) => p.uuid === uuid);
      if (!foundPlayer) {
        return;
      }
      if (foundPlayer.isResurrecting) {
        return;
      }
      const { x: foundPlayerX, y: foundPlayerY } = foundPlayer;
      if (
        [Math.abs(foundPlayerX - x), Math.abs(foundPlayerY - y)].some(
          (p) => p > 16
        )
      ) {
        foundPlayer.setPosition(x, y);
        console.log(
          "위치보정(서버):",
          x,
          y,
          ", 원래위치(클라):",
          foundPlayerX,
          foundPlayerY
        );
      }
    });
  }
  createMap(scene: Phaser.Scene) {
    const map = scene.make.tilemap({
      key: `map_${this.initialData.stage}`,
    });
    const bgTiles = map.addTilesetImage("ski", "ski_tiled_image");
    map.createLayer("bg", bgTiles);
    map.createLayer("bg_items", bgTiles);

    const playerSpawnPoints = map.findObject("PlayerSpawn", () => true);
    const zonePoints = Object.fromEntries(
      ZONE_KEYS.map((zone) => [
        zone,
        map.filterObjects(`${zone}Zone`, () => true) ?? [],
      ])
    ) as ZonePointsType;
    const aliveZonePoints = Object.values(zonePoints).flat();
    const obstacleSpawnPoints = map.filterObjects("ObstacleSpawn", () => true);
    const movingObstacles = obstacleSpawnPoints.filter(
      ({ properties }) =>
        properties?.find(({ name }) => name === "isMove").value
    );
    const stopObstacles = obstacleSpawnPoints.filter(
      ({ properties }) =>
        !properties?.find(({ name }) => name === "isMove").value
    );
    this.createMovingObstacles(movingObstacles);
    this.createStopObstacle(stopObstacles);

    scene.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    return {
      map,
      playerSpawnPoints,
      aliveZonePoints,
      zonePoints,
    };
  }
  createMovingObstacles(movingObstacles: Phaser.Types.Tilemaps.TiledObject[]) {
    movingObstacles.forEach(({ x, y, width, height, properties }) => {
      const obstacle = new Obstacle(this, {
        x,
        y,
        width: 10,
        height: 8,
        spriteKey: "pixel_animals",
        frameNo: 2,
      });
      const isHorizontal = properties?.find(
        ({ name }) => name === "isHorizontal"
      )?.value;
      const tweens = {
        targets: obstacle,
        duration:
          properties?.find(({ name }) => name === "duration")?.value ?? 2000,
        yoyo: true,
        repeat: -1,
      };
      if (isHorizontal) {
        this.tweens.add({
          ...tweens,
          x: x + width,
        });
      } else {
        this.tweens.add({
          ...tweens,
          y: y + height,
        });
      }
      this.obstacles.add(obstacle);
    });
  }
  createStopObstacle(stopObstacles: Phaser.Types.Tilemaps.TiledObject[]) {
    stopObstacles.forEach(({ x, y, width, height }) => {
      const obstacle = new Obstacle(this, {
        x,
        y,
        width: width - width / 3,
        height: height - height / 3,
        spriteKey: "pixel_animals",
        frameNo: 0,
      });
      obstacle.sprite.setDisplaySize(width, height);
      this.obstacles.add(obstacle);
    });
  }
  prepareNextStage(afterShutdown) {
    this.scene.stop();
    const inGameUIScene = this.scene.get("InGameUIScene") as InGameUIScene;
    inGameUIScene.time.delayedCall(2500, () => {
      inGameUIScene.centerTextOff();
      this.shutdown();
      afterShutdown();
    });
  }
  onStageClear(clearNick: string) {
    const inGameUIScene = this.scene.get("InGameUIScene") as InGameUIScene;
    if (this.initialData.stage === GAME.TOTAL_STAGE) {
      inGameUIScene.centerTextOn(`Final Stage Clear by ${clearNick}!`);
      this.prepareNextStage(() => {
        inGameUIScene.scene.start("StartScene");
        inGameUIScene.scene.remove();
      });
      return;
    } else {
      inGameUIScene.centerTextOn(`Stage Clear by ${clearNick}!`);
      this.prepareNextStage(() => {
        inGameUIScene.scene.start("InGameScene", {
          ...this.initialData,
          stage: this.initialData.stage + 1,
        });
      });
    }
  }
  onGameOver() {
    const inGameUIScene = this.scene.get("InGameUIScene") as InGameUIScene;
    inGameUIScene.centerTextOn("Game Over!");
    this.prepareNextStage(() => {
      this.scene.start("InGameScene");
    });
  }
  shutdown() {
    this.player?.destroy();
    this.player = null;
    this.players.forEach((player) => player?.destroy());
    this.players = [];
    this.scene.systems.shutdown();
  }

  constructor() {
    super("InGameScene");
  }
  preload() {
    Array.from({ length: GAME.TOTAL_STAGE }, (_, i) => {
      const mapName = `map_${i + 1}`;
      this.load.tilemapTiledJSON(mapName, `phaser/tiled/${mapName}.json`);
    });
    this.load.image("ski_tiled_image", "phaser/tiled/ski_tiled_image.png");

    this.load.spritesheet("pixel_animals", "phaser/pixel_animals.png", {
      frameWidth: 16,
      frameHeight: 16,
    });
  }
  init(data: {
    players: { uuid: string; nick: string; frameNo: number }[];
    uuid: string;
    ws: CustomWebSocket;
    stage?: number;
  }) {
    this.initialData = data;
  }
}
