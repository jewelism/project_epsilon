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
  ws: WebSocket;
  players: Player[] = [];
  playerSpawnPoints: Phaser.Types.Tilemaps.TiledObject;
  map: Phaser.Tilemaps.Tilemap;
  isMultiplay: boolean;
  playersInfo: { id: string | number }[];

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
    this.player.disabled.value = !this.isPlayerInsafeZone();
  }
  onMyPlayerCreated() {
    this.cameras.main
      .setBounds(0, 0, this.map.heightInPixels, this.map.widthInPixels)
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
  _updateResponse(value) {
    const data = JSON.parse(value?.data ?? "{}");
    console.log("returnValue", value, data);
    // if (data.type === "join") {
    //   const newPlayer = new Player(this, {
    //     x: this.playerSpawnPoints.x,
    //     y: this.playerSpawnPoints.y,
    //     spriteKey: "pixel_animals",
    //     frameNo: 0,
    //     nick: data.nick,
    //     wsId: data.id,
    //   });
    //   if (data.id === this.ws.id) {
    //     this.player = newPlayer;
    //     this.onMyPlayerCreated();
    //   }
    //   this.players.push(newPlayer);
    // }
    if (data.type === "move") {
      console.log("move", data, this.players);
      const player = this.players.find(({ wsId }) => wsId === data.id);
      console.log("player", player, this.players);

      player.moveToXY(data.x, data.y);
    }
  }
  createPlayers() {
    console.log("createPlayers", this.playersInfo);

    this.playersInfo.forEach((player) => {
      const newPlayer = new Player(this, {
        x: this.playerSpawnPoints.x,
        y: this.playerSpawnPoints.y,
        spriteKey: "pixel_animals",
        frameNo: 0,
        nick: String(player.id),
        wsId: player.id,
      });
      if (player.id === this.ws.id) {
        this.player = newPlayer;
        this.onMyPlayerCreated();
      }
      this.players.push(newPlayer);
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
    players: { id: string | number }[];
    ws: WebSocket;
  }) {
    this.playersInfo = data.players;
    this.isMultiplay = data.multi;
    this.ws = data.ws;
  }
}
