import { Player } from "@/objects/Player";
import { TitleText } from "@/ui/TitleText";
import { makesafeZone } from "@/utils/helper";
import WebSocket from "tauri-plugin-websocket-api";

// TODO: 스테이지 구성하기전에 멀티플레이 추가하고 되살리기 추가하기
const GAME = {
  ZOOM: 2,
};
export class InGameScene extends Phaser.Scene {
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  player: Player;
  obstacles: Phaser.Physics.Arcade.Group;
  safeZone: Phaser.Geom.Rectangle[];
  socket: any;
  ws: WebSocket;
  players: Player[] = [];
  playerSpawnPoints: Phaser.Types.Tilemaps.TiledObject;
  map: Phaser.Tilemaps.Tilemap;
  isMultiplay: boolean;
  playersInfo: { wsId: string | number }[];

  async create() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.obstacles = this.physics.add.group();

    const { map, playerSpawnPoints, safeZonePoints, obstacleSpawnPoints } =
      this.createMap(this);
    this.map = map;
    this.playerSpawnPoints = playerSpawnPoints;
    this.safeZone = makesafeZone(this, safeZonePoints);
    await this.createSocketConnection();
    this.createPlayers();
    // this.createObstacle(obstacleSpawnPoints);
  }
  update(_time: number, _delta: number): void {
    if (!this.player) {
      return;
    }
    if (!this.isPlayerInSafeZone()) {
      if (this.player.disabled) {
        return;
      }
      this.player.disabled = true;
      this.ws.send(
        JSON.stringify({
          wsId: this.player.wsId,
          type: "dead",
          x: this.player.x.toFixed(0),
          y: this.player.y.toFixed(0),
        })
      );
    }
  }
  onMyPlayerCreated() {
    this.cameras.main
      .setBounds(0, 0, this.map.heightInPixels, this.map.widthInPixels)
      .startFollow(this.player.body, false)
      .setZoom(GAME.ZOOM);

    this.physics.add.overlap(this.obstacles, this.player, (player: any) => {
      player.disabled = true;
      this.ws.send(
        JSON.stringify({
          wsId: this.player.wsId,
          type: "dead",
          x: this.player.x.toFixed(0),
          y: this.player.y.toFixed(0),
        })
      );
    });
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.mouseClickEffect(this, pointer);
      if (this.player.disabled) {
        return;
      }
      this.ws.send(
        JSON.stringify({
          wsId: this.player.wsId,
          type: "move",
          x: pointer.worldX.toFixed(0),
          y: pointer.worldY.toFixed(0),
        })
      );
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
    const data = JSON.parse(value?.data ?? "{}");
    const player = this.players.find(({ wsId }) => wsId === data.id);
    // if (!player || player.wsId === this.ws.id) {
    //   return;
    // }
    console.log("receive", data);
    if (data.type === "move") {
      player.moveToXY(data.x, data.y);
    }
    if (data.type === "dead") {
      player.playerDead(Number(data.x), Number(data.y));
    }
    if (data.type === "resurrection") {
      player.playerResurrection(Number(data.x), Number(data.y));
    }
  }
  createPlayers() {
    this.playersInfo.forEach((player) => {
      const isMyPlayer = player.wsId === this.ws.id;
      const newPlayer = new Player(this, {
        x: this.playerSpawnPoints.x,
        y: this.playerSpawnPoints.y,
        spriteKey: "pixel_animals",
        frameNo: 0,
        nick: String(player.wsId),
        wsId: player.wsId,
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
      this.ws.send(
        JSON.stringify({
          wsId: player.wsId,
          type: "resurrection",
          x: this.playerSpawnPoints.x,
          y: this.playerSpawnPoints.y,
        })
      );
    });
  }
  async createSocketConnection() {
    // TODO: path localStorage로 변경하기
    try {
      this.ws.addListener(this._updateResponse.bind(this));
    } catch (e) {
      console.error("jew ws connection failed");
    }
  }
  isPlayerInSafeZone() {
    const isSafe = this.safeZone.some((safeZone) =>
      Phaser.Geom.Rectangle.ContainsPoint(
        safeZone,
        new Phaser.Geom.Point(this.player.x, this.player.y)
      )
    );
    return isSafe;
  }
  createMap(scene: Phaser.Scene) {
    const map = scene.make.tilemap({
      key: "map",
    });
    const bgTiles = map.addTilesetImage("16tiles", "16tiles");
    map.createLayer("bg", bgTiles);

    const playerSpawnPoints = map.findObject("PlayerSpawn", ({ name }) => {
      return name.includes("PlayerSpawn");
    });
    const safeZonePoints = map.filterObjects("safeZone", ({ name }) => {
      return name.includes("safeZone");
    });
    const obstacleSpawnPoints = map.filterObjects(
      "ObstacleSpawn",
      ({ name }) => {
        return name.includes("ObstacleSpawn");
      }
    );
    scene.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    return { map, playerSpawnPoints, safeZonePoints, obstacleSpawnPoints };
  }
  // createObstacle(obstacleSpawnPoints: Phaser.Types.Tilemaps.TiledObject[]) {
  //   // obstacleSpawnPoints.forEach(({ x, y }) => {});
  // }
  constructor() {
    super("InGameScene");
  }
  preload() {
    this.load.tilemapTiledJSON("map", "phaser/tiled/map.json");
    this.load.image("16tiles", "phaser/tiled/16tiles.png");

    this.load.spritesheet("pixel_animals", "phaser/pixel_animals.png", {
      frameWidth: 16,
      frameHeight: 16,
    });
  }
  init(data: {
    multi: boolean;
    players: { wsId: string | number }[];
    ws: WebSocket;
  }) {
    this.playersInfo = data.players;
    this.isMultiplay = data.multi;
    this.ws = data.ws;
  }
}
