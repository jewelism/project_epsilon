import WebSocket from "tauri-plugin-websocket-api";
import { TitleText } from "@/ui/TitleText";
import { defaultTextStyle } from "@/constants";

let removedListener = false;
export class MultiplayLobbyScene extends Phaser.Scene {
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  ws: WebSocket;
  isHost: boolean;
  players: any[] = [];
  ipAddrInput: string = "";
  playerInfoText: HTMLInputElement;
  roomNameInput: string;
  inputFields: Record<string, string> = {};

  async create() {
    this.cursors = this.input.keyboard.createCursorKeys();

    const title = new TitleText(this, "Lobby");
    const element = this.add
      .dom(title.x, title.y + 100)
      .createFromCache("multiplay_lobby_form");

    const setIpAddrInput = this.createInputElement(element, {
      name: "ipAddrInput",
      defaultValue: "localhost",
    });
    this.createInputElement(element, {
      name: "roomNameInput",
      defaultValue: "test room12",
    });
    element.getChildByID("tplink").addEventListener("click", () => {
      setIpAddrInput("jewelry.tplinkdns.com");
    });
    element.getChildByID("localhost").addEventListener("click", () => {
      setIpAddrInput("localhost");
    });

    element.getChildByID("connect").addEventListener("click", () => {
      this.getSocketConnection();
    });
    const startButton = element.getChildByID("start");
    startButton.addEventListener("click", () => {
      this.ws.send(JSON.stringify({ type: "start" }));
      this.startGame();
    });
    if (!this.isHost) {
      startButton.remove();
    }
    this.playerInfoText = element.getChildByID("status") as HTMLInputElement;
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
      this.playerInfoText.innerText = `try to connect...`;
      this.ws = await WebSocket.connect(
        `ws://${this.inputFields.ipAddrInput}:20058`
      );
      this.playerInfoText.innerText = `waiting for players`;
    } catch (e) {
      this.playerInfoText.innerText = `ws connection failed ${e}`;
    }
    if (this.isHost) {
      this.players = [{ id: this.ws.id }];
      this.ws.send(
        JSON.stringify({
          type: "room",
          id: this.ws.id,
          roomName: this.inputFields.roomNameInput,
        })
      );
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
      this.playerInfoText.innerText = `${
        this.players.length
      } players: ${JSON.stringify(this.players)}`;
    });
  }
  createInputElement(
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
    return setInputValue;
  }
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
}
