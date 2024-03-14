import { Player } from "@/objects/Player";
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

  create() {
    this.createSocketConnection();
    this.cursors = this.input.keyboard.createCursorKeys();
    this.obstacles = this.physics.add.group();

    const { map, playerSpawnPoints, safeZonePoints, obstacleSpawnPoints } =
      this.createMap(this);

    this.player = new Player(this, {
      x: playerSpawnPoints.x,
      y: playerSpawnPoints.y,
      spriteKey: "pixel_animals",
      frameNo: 0,
      nick: "쥬얼리1",
    });
    this.safeZone = makesafeZone(this, safeZonePoints);

    // this.createObstacle(obstacleSpawnPoints);

    this.cameras.main
      .setBounds(0, 0, map.heightInPixels, map.widthInPixels)
      .startFollow(this.player.body, false)
      .setZoom(GAME.ZOOM);

    this.physics.add.overlap(
      this.obstacles,
      this.player.body,
      (player: any) => {
        player.disabled.value = true;
      }
    );
  }
  update(_time: number, _delta: number): void {
    this.player.disabled.value = !this.isPlayerInsafeZone();
  }
  isPlayerInsafeZone() {
    const isSafe = this.safeZone.some((safeZone) =>
      Phaser.Geom.Rectangle.ContainsPoint(
        safeZone,
        new Phaser.Geom.Point(this.player.body.x, this.player.body.y)
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
  async createSocketConnection() {
    // TODO: path localStorage로 변경하기
    // this.socket = io("http://localhost:20058");

    const ws = await WebSocket.connect("ws://localhost:20058");

    await ws.send("Hello World");

    // await ws.disconnect();

    this.socket.on("connect", function () {
      console.log("connect");
    });
    this.socket.on?.("playerMoved", function (movementData) {
      console.log("playerMoved", movementData);
      this.player.moveToXY(movementData.x, movementData.y);
    });
  }
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
}
