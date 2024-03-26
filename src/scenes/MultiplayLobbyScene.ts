import { Command } from "@tauri-apps/api/shell";
import WebSocket from "tauri-plugin-websocket-api";
import { TitleText } from "@/ui/TitleText";

export interface CustomWebSocket extends WebSocket {
  uuid?: string;
  sendJson: (data: Record<string, unknown>) => void;
}

let removedListener = false;
export class MultiplayLobbyScene extends Phaser.Scene {
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  ws: CustomWebSocket;
  isHost: boolean;
  players: { uuid: string; nick: string }[] = [];

  inputFields: Record<string, string> = {};
  elements: Record<string, HTMLElement> = {};
  uuid: string;
  nick: string;

  async create() {
    if (this.isHost) {
      const command = Command.sidecar("server_epsilon");
      await command.spawn();
    }

    this.cursors = this.input.keyboard.createCursorKeys();

    const title = new TitleText(this, "Lobby");
    const element = this.add
      .dom(title.x, title.y + 200)
      .createFromCache("multiplay_lobby_form");
    this.elements.playerInfoText = element.getChildByID(
      "playerInfoText"
    ) as HTMLInputElement;
    const startButton = element.getChildByID("start");
    startButton.addEventListener("click", () => {
      this.ws.sendJson({ type: "start", hostUuid: this.uuid });
    });
    if (!this.isHost) {
      startButton.remove();
    }
    await this.getSocketConnection();
  }
  startGame() {
    this.scene.start("InGameScene", {
      multi: true,
      players: this.players,
      uuid: this.uuid,
      ws: this.ws,
    });
  }
  async getSocketConnection() {
    const tryConnect = async () => {
      this.elements.playerInfoText.innerText = `try to connect...`;
      try {
        this.ws = (await WebSocket.connect(
          `ws://${this.inputFields.ipAddrInput}:20058`
        )) as CustomWebSocket;
      } catch (e) {
        this.elements.playerInfoText.innerText = `ws connection failed ${e}`;
      }
    };
    while (true) {
      await tryConnect();
      if (this.ws) {
        break;
      }
    }
    console.log("connected");
    this.ws.sendJson = (data) => this.ws.send(JSON.stringify(data));

    this.elements.playerInfoText.innerText = "waiting for players";

    this.ws.addListener((value) => {
      if (removedListener) {
        return;
      }
      if (value.type !== "Text") {
        // console.log("another type incoming: ", value);
        return;
      }
      const data = JSON.parse(value.data as any);
      console.log("data", data);
      const dataManager = {
        uuid: () => {
          this.uuid = data.uuid;
          this.ws.sendJson({
            type: "joinInLobby",
            uuid: this.uuid,
            nick: this.nick,
          });
        },
        start: () => {
          this.startGame();
          removedListener = true;
        },
        players: () => {
          this.players = data.players;
          this.elements.playerInfoText.innerText = `${
            this.players.length
          } players: ${JSON.stringify(
            this.players.map((p) => ({ nick: p.nick }))
          )}`;
        },
      };
      if (data.type in dataManager) {
        dataManager[data.type]();
      } else {
        console.log("unknown type", data);
      }
    });
  }
  manageInputElement(
    element: Phaser.GameObjects.DOMElement,
    { name, defaultValue }
  ) {
    const inputEl = element.getChildByName(name) as HTMLInputElement;
    inputEl.addEventListener("change", (e) => {
      this.inputFields[name] = (e.target as HTMLInputElement).value;
    });
    const setInputValue = (value) => {
      inputEl.value = value;
      this.inputFields[name] = value;
    };
    setInputValue(defaultValue);
    return { setInputValue, inputEl };
  }
  constructor() {
    super("MultiplayLobbyScene");
  }
  init(data) {
    this.isHost = data.host;
    this.nick = data.nick;
    this.inputFields.ipAddrInput = data.ipAddrInput;
  }
  preload() {
    this.load.html("multiplay_lobby_form", "phaser/multiplay_lobby_form.html");
    // this.load.image('icon', 'phaser/icon.png');
  }
}
