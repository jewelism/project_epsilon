import WebSocket from "tauri-plugin-websocket-api";
import { TitleText } from "@/ui/TitleText";
import { defaultTextStyle } from "@/constants";

let removedListener = false;
export class MultiplayLobbyScene extends Phaser.Scene {
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  ws: WebSocket;
  isHost: boolean;
  players: any[] = [];
  playerInfoText: Phaser.GameObjects.Text;

  constructor() {
    super("MultiplayLobbyScene");
  }
  init(data) {
    this.isHost = data.host;
  }
  preload() {
    this.load.html("multiplay_lobby_form", "phaser/multiplay_lobby_form.html");
    // this.load.image('icon', 'phaser/icon.png');
  }
  async create() {
    this.cursors = this.input.keyboard.createCursorKeys();

    const title = new TitleText(this, "Lobby");
    const element = this.add
      .dom(title.x, title.y + 100)
      .createFromCache("multiplay_lobby_form");
    element.on("change", (e) => {
      console.log("change", e.target.value);
    });
    if (this.isHost) {
      const text = new Phaser.GameObjects.Text(
        this,
        title.x,
        title.y + 200,
        "start",
        {
          ...defaultTextStyle,
          color: "#fff",
          fontSize: "20px",
        }
      )
        .setOrigin(0.5)
        .setInteractive()
        .on("pointerdown", () => {
          this.ws.send(JSON.stringify({ type: "start" }));
          this.startGame();
        });
      this.add.existing(text);
    }

    this.playerInfoText = new Phaser.GameObjects.Text(
      this,
      title.x,
      title.y + 300,
      "-",
      {
        ...defaultTextStyle,
        color: "#fff",
        fontSize: "15px",
      }
    ).setOrigin(0.5);
    this.add.existing(this.playerInfoText);
    const onKeydown = () => {
      // this.scene.start('SelectLevelScene');
    };
    this.input.keyboard.on("keydown", onKeydown);
    this.input.on("pointerdown", onKeydown);
    await this.getSocketConnection();
  }
  startGame() {
    this.scene.start("InGameScene", {
      multi: true,
      players: this.players,
      ws: this.ws,
    });
  }
  async getSocketConnection() {
    try {
      this.ws = await WebSocket.connect("ws://localhost:20058");
      this.playerInfoText.setText(`waiting for players`);
    } catch (e) {
      this.playerInfoText.setText(`ws connection failed ${e}`);
    }
    if (this.isHost) {
      this.players = [{ id: this.ws.id }];
    } else {
      this.ws.send(JSON.stringify({ type: "join", id: this.ws.id }));
    }
    this.ws.addListener((value) => {
      if (removedListener) {
        return;
      }
      if (value.type !== "Text") {
        console.log("another type incoming: ", value);
        return;
      }
      const data = JSON.parse(value.data as any);
      if (data.type === "start") {
        this.startGame();
        removedListener = true;
        return;
      }
      if (data.type === "join") {
        if (this.isHost) {
          console.log("host received join", data);

          this.players = [...this.players, { id: data.id }];
          this.ws.send(
            JSON.stringify({
              type: "players",
              players: this.players,
            })
          );
        }
      }
      if (data.type === "players") {
        this.players = data.players;
      }
      this.playerInfoText.setText(
        `${this.players.length} players: ${JSON.stringify(this.players)}`
      );
    });
  }
}
