import WebSocket from "tauri-plugin-websocket-api";
import { TitleText } from "@/ui/TitleText";
import { defaultTextStyle } from "@/constants";

type Room = {
  type: string;
  hostWsId: number;
  roomName: string;
};

let removedListener = false;
export class MultiplayLobbyScene extends Phaser.Scene {
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  ws: WebSocket;
  isHost: boolean;
  players: any[] = [];

  inputFields: Record<string, string> = {};
  elements: Record<string, HTMLElement> = {};

  async create() {
    this.cursors = this.input.keyboard.createCursorKeys();

    const title = new TitleText(this, "Lobby");
    const element = this.add
      .dom(title.x, title.y + 100)
      .createFromCache("multiplay_lobby_form");

    const { setInputValue: setIpAddrInput } = this.manageInputElement(element, {
      name: "ipAddrInput",
      defaultValue: "localhost",
    });
    const { inputEl: roomNameInputEl } = this.manageInputElement(element, {
      name: "roomNameInput",
      defaultValue: "test room12",
    });
    element.getChildByID("tplink").addEventListener("click", () => {
      setIpAddrInput("jewelry.tplinkdns.com");
    });
    element.getChildByID("localhost").addEventListener("click", () => {
      setIpAddrInput("localhost");
    });

    this.elements.roomsContainer = element.getChildByID("rooms") as HTMLElement;

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
      roomNameInputEl.remove();
    }
    this.elements.playerInfoText = element.getChildByID(
      "status"
    ) as HTMLInputElement;
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
      this.elements.playerInfoText.innerText = `try to connect...`;
      this.ws = await WebSocket.connect(
        `ws://${this.inputFields.ipAddrInput}:20058`
      );
      this.elements.playerInfoText.innerText = `waiting for players`;
    } catch (e) {
      this.elements.playerInfoText.innerText = `ws connection failed ${e}`;
    }
    if (this.isHost) {
      this.players = [{ wsId: this.ws.id }];
      const room: Room = {
        type: "createRoom",
        hostWsId: this.ws.id,
        roomName: this.inputFields.roomNameInput,
      };
      this.ws.send(JSON.stringify(room));
    } else {
      this.ws.send(
        JSON.stringify({
          type: "reqRooms",
        })
      );
    }
    this.ws.addListener((value) => {
      if (removedListener) {
        return;
      }
      if (value.type !== "Text") {
        // console.log("another type incoming: ", value);
        return;
      }
      const data = JSON.parse(value.data as any);
      if (data.type === "start") {
        this.startGame();
        removedListener = true;
        return;
      }
      if (data.type === "rooms") {
        if (!this.isHost) {
          this.createRoomsButton(data);
        }
      }
      if (data.type === "players") {
        this.players = data.players;
        this.elements.playerInfoText.innerText = `${
          this.players.length
        } players: ${JSON.stringify(this.players)}`;
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
  createRoomsButton(data) {
    this.elements.roomsContainer.innerHTML = Object.values(data.rooms)
      .map(
        (room: Room) =>
          `<button id="${room.hostWsId}">${room.roomName}</button>`
      )
      .join("");
    Array.from(this.elements.roomsContainer.children).forEach((button) => {
      button.addEventListener("click", ({ target }) => {
        this.inputFields.seletedRoomHostWsId = (target as HTMLElement).id;
        this.ws.send(
          JSON.stringify({
            type: "joinRoom",
            wsId: this.ws.id,
            hostWsId: this.inputFields.seletedRoomHostWsId,
          })
        );
        this.elements.roomsContainer.innerHTML = "";
      });
    });
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
