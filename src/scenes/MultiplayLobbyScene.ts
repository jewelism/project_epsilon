import WebSocket from "tauri-plugin-websocket-api";
import { TitleText } from "@/ui/TitleText";
import { defaultTextStyle } from "@/constants";

export class MultiplayLobbyScene extends Phaser.Scene {
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  ws: WebSocket;
  isHost: boolean;
  players: any[] = [];
  text2: Phaser.GameObjects.Text;

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
        this.scene.start("InGameScene", { multi: true, players: this.players });
      });
    this.text2 = new Phaser.GameObjects.Text(
      this,
      title.x,
      title.y + 300,
      "start",
      {
        ...defaultTextStyle,
        color: "#fff",
        fontSize: "30px",
      }
    ).setOrigin(0.5);
    this.add.existing(text);
    this.add.existing(this.text2);
    const onKeydown = () => {
      // this.scene.start('SelectLevelScene');
    };
    this.input.keyboard.on("keydown", onKeydown);
    this.input.on("pointerdown", onKeydown);
    await this.getSocketConnection();
  }
  async getSocketConnection() {
    try {
      const ws = await WebSocket.connect("ws://localhost:20058");
      console.log("host", this.isHost, ws.id);

      if (!this.isHost) {
        this.text2.setText(`waiting for host ${ws.id}`);
        ws.send(JSON.stringify({ type: "join", id: ws.id }));
      } else {
        this.players = [{ id: ws.id, nick: `p${ws.id}` }];
        this.text2.setText(`waiting for players ${ws.id}`);
      }
      ws.addListener((value) => {
        console.log("value", value);
        const data = JSON.parse(value.data as any);
        if (data.type === "join") {
          console.log("join", data);
          if (this.isHost) {
            ws.send(
              JSON.stringify({
                type: "players",
                players: [...this.players, data],
              })
            );
          }
        }
        if (data.type === "players") {
          console.log("players", data.players);
          this.players = data.players;
          this.text2.setText(`players: ${JSON.stringify(this.players)}`);
        }
      });
      // ws.send(JSON.stringify({ type: "join", id: ws.id }));
      //
    } catch (e) {
      this.text2.setText(`ws connection failed ${e}`);
    }
  }
}
