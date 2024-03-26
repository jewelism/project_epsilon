import { Player } from "@/objects/Player";
import { InGameUIScene } from "@/scenes/InGameUIScene";
import { CustomWebSocket } from "@/scenes/MultiplayLobbyScene";
import { makeZone } from "@/utils/helper";

const GAME = {
  ZOOM: 2,
};
export class InGameScene extends Phaser.Scene {
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  player: Player;
  obstacles: Phaser.Physics.Arcade.Group;
  safeZone: Phaser.Geom.Rectangle[];
  socket: any;
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
    this.cursors = this.input.keyboard.createCursorKeys();
    this.obstacles = this.physics.add.group();

    const {
      map,
      playerSpawnPoints,
      aliveZonePoints,
      zonePoints,
      obstacleSpawnPoints,
    } = this.createMap(this);
    this.map = map;
    this.playerSpawnPoints = playerSpawnPoints;

    this.safeZone = makeZone(this, aliveZonePoints, 0x00ff00);
    this.nonstopZone = makeZone(this, zonePoints.nonstop, 0x00ffff);
    this.straightZone = makeZone(this, zonePoints.straight, 0x00ffff);
    this.invertZone = makeZone(this, zonePoints.invert, 0xffffff);

    await this.createSocketConnection();
    this.createPlayers();
    this.time.addEvent({
      delay: 100,
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
    if (!this.player.isPlayerInSafeZone()) {
      if (this.player.disabled) {
        return;
      }
      this.player.disabled = true;
      this.ws.sendJson({
        uuid: this.player.uuid,
        hostUuid: this.playersInfo[0].uuid,
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
      this.ws.sendJson({
        hostUuid: this.playersInfo[0].uuid,
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
        player.playerDead(Number(data.x), Number(data.y));
      },
      resurrection: () => {
        player.playerResurrection(Number(data.x), Number(data.y));
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
        hostUuid: this.playersInfo[0].uuid,
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
    serverData.players.forEach((player) => {
      const foundPlayer = this.players.find(({ uuid }) => uuid === player.uuid);
      if (
        [
          Math.abs(foundPlayer.x - player.x),
          Math.abs(foundPlayer.y - player.y),
        ].some((p) => p > 16)
      ) {
        foundPlayer.setPosition(player.x, player.y);
        console.log(
          "위치보정:",
          player.x,
          player.y,
          ", 원래위치:",
          foundPlayer.x,
          foundPlayer.y
        );
      }
    });
  }
  createMap(scene: Phaser.Scene) {
    const map = scene.make.tilemap({
      key: "map",
    });

    // const bgTiles = map.addTilesetImage("16tiles", "16tiles");
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

    scene.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    return {
      map,
      playerSpawnPoints,
      aliveZonePoints,
      zonePoints,
      obstacleSpawnPoints,
    };
  }
  // createObstacle(obstacleSpawnPoints: Phaser.Types.Tilemaps.TiledObject[]) {
  //   // obstacleSpawnPoints.forEach(({ x, y }) => {});
  // }

  constructor() {
    super("InGameScene");
  }
  preload() {
    // this.load.tilemapTiledJSON("map", "phaser/tiled/map.json");
    // this.load.image("16tiles", "phaser/tiled/16tiles.png");
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
