import { Obstacle } from "@/objects/Obstacle";
import { Player } from "@/objects/Player";
import { InGameUIScene } from "@/scenes/InGameUIScene";
import { CustomWebSocket } from "@/scenes/MultiplayLobbyScene";
import { makeZone } from "@/utils/helper";

const GAME = {
  ZOOM: 2,
  RTT: 100,
};
export class InGameScene extends Phaser.Scene {
  player: Player;
  obstacles: Phaser.Physics.Arcade.Group;
  safeZone: Phaser.Geom.Rectangle[];
  ws: CustomWebSocket;
  players: Player[] = [];
  playerSpawnPoints: Phaser.Types.Tilemaps.TiledObject;
  map: Phaser.Tilemaps.Tilemap;
  isMultiplay: boolean;
  playersInfo: { uuid: string; nick: string; frameNo: number }[];
  uuid: string;
  nonstopZone: Phaser.Geom.Rectangle[];
  straightZone: Phaser.Geom.Rectangle[];
  invertZone: Phaser.Geom.Rectangle[];

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

    await this.createSocketConnection();
    this.createPlayers();
    this.time.addEvent({
      delay: GAME.RTT,
      callback: () => {
        this.ws.sendJson({
          type: "rtt",
          uuid: this.uuid,
          timestamp: Date.now(),
          x: Number(this.player.x.toFixed(0)),
          y: Number(this.player.y.toFixed(0)),
        });
      },
      loop: true,
    });
    // this.createObstacle(obstacleSpawnPoints);
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
      this.ws.sendJson({
        uuid: this.player.uuid,
        type: "dead",
        x: this.player.x.toFixed(0),
        y: this.player.y.toFixed(0),
      });
    }
  }
  onMyPlayerCreated() {
    this.cameras.main
      .setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels)
      .startFollow(this.player, false)
      .setZoom(GAME.ZOOM);

    this.physics.add.overlap(this.obstacles, this.player, () => {
      if (this.player.disabled) {
        return;
      }
      this.ws.sendJson({
        uuid: this.player.uuid,
        type: "dead",
        x: this.player.x.toFixed(0),
        y: this.player.y.toFixed(0),
      });
    });
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.mouseClickEffect(this, pointer);
      if (this.player.disabled) {
        return;
      }
      if (this.player.zone.straight) {
        return;
      }
      this.ws.sendJson({
        uuid: this.player.uuid,
        hostUuid: this.playersInfo[0].uuid,
        type: "move",
        x: pointer.worldX.toFixed(0),
        y: pointer.worldY.toFixed(0),
        invert: this.player.zone.invert,
      });
    });
  }
  mouseClickEffect(scene: Phaser.Scene, pointer: Phaser.Input.Pointer) {
    let circle = scene.add.circle(pointer.worldX, pointer.worldY, 7, 0x00ffff);
    scene.tweens.add({
      targets: circle,
      scaleX: 0.1,
      scaleY: 0.1,
      alpha: 0,
      duration: 750,
      ease: "Power2",
      onComplete: () => circle.destroy(),
    });
  }
  _updateResponse(value) {
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
    this.playersInfo.forEach((player) => {
      const isMyPlayer = player.uuid === this.uuid;
      const newPlayer = new Player(this, {
        x: this.playerSpawnPoints.x,
        y: this.playerSpawnPoints.y,
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
    const playersGroup = this.add.group(this.players.map((player) => player));
    this.physics.add.overlap(this.player, playersGroup, (player1) => {
      const player = player1 as Player;
      if (!player.disabled) {
        return;
      }
      this.ws.sendJson({
        uuid: player.uuid,
        type: "resurrection",
        x: this.playerSpawnPoints.x,
        y: this.playerSpawnPoints.y,
      });
    });
  }
  async createSocketConnection() {
    try {
      this.ws.addListener(this._updateResponse.bind(this));
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
      key: "map",
    });
    const bgTiles = map.addTilesetImage("ski", "ski_tiled_image");
    map.createLayer("bg", bgTiles);
    map.createLayer("bg_items", bgTiles);

    const playerSpawnPoints = map.findObject("PlayerSpawn", () => true);
    const areaKeys = ["safe", "nonstop", "straight", "invert"] as const;
    const zonePoints = Object.fromEntries(
      areaKeys.map((zone) => [
        zone,
        map.filterObjects(`${zone}Zone`, () => true) ?? [],
      ])
    ) as Record<(typeof areaKeys)[number], Phaser.Types.Tilemaps.TiledObject[]>;
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
  onGameOver() {
    console.log("game over");
    this.scene.pause();
    const inGameUIScene = this.scene.get("InGameUIScene");
    // TODO: inGameUIScene에서 메소드만들고 game over text 띄우기.
    // inGameUIScene.gameover
    inGameUIScene.time.delayedCall(2000, () => {
      this.shutdown();
      this.scene.restart();
    });
  }
  shutdown() {
    this.players = [];
  }

  constructor() {
    super("InGameScene");
  }
  preload() {
    this.load.tilemapTiledJSON("map", "phaser/tiled/map_ex.json");
    this.load.image("ski_tiled_image", "phaser/tiled/ski_tiled_image.png");

    this.load.spritesheet("pixel_animals", "phaser/pixel_animals.png", {
      frameWidth: 16,
      frameHeight: 16,
    });
  }
  init(data: {
    multi: boolean;
    players: { uuid: string; nick: string; frameNo: number }[];
    uuid: string;
    ws: CustomWebSocket;
  }) {
    this.playersInfo = data.players;
    this.isMultiplay = data.multi;
    this.uuid = data.uuid;
    this.ws = data.ws;
  }
}
