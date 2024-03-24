import WebSocket from "tauri-plugin-websocket-api";
import { TitleText } from "@/ui/TitleText";

export interface CustomWebSocket extends WebSocket {
  uuid?: string;
  sendJson: (data: Record<string, unknown>) => void;
}

type Room = {
  type: string;
  hostUuid: string;
  roomName: string;
  nick: string;
};

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
    this.cursors = this.input.keyboard.createCursorKeys();

    const title = new TitleText(this, "Lobby");
    const element = this.add
      .dom(title.x, title.y + 200)
      .createFromCache("multiplay_lobby_form");
    this.elements.playerInfoText = element.getChildByID(
      "status"
    ) as HTMLInputElement;
    this.elements.roomsContainer = element.getChildByID("rooms") as HTMLElement;
    const { inputEl: roomNameInputEl } = this.manageInputElement(element, {
      name: "roomNameInput",
      defaultValue: "test room12",
    });
    const startButton = element.getChildByID("start");
    startButton.addEventListener("click", () => {
      this.ws.sendJson({ type: "start", hostUuid: this.uuid });
    });
    // element.getChildByID("req_total_players").addEventListener("click", () => {
    //   this.ws.send(JSON.stringify({ type: "reqTotalPlayers" }));
    // });
    if (!this.isHost) {
      startButton.remove();
      roomNameInputEl.remove();
    }
    await this.getSocketConnection(element);
  }
  startGame() {
    this.scene.start("InGameScene", {
      multi: true,
      players: this.players,
      uuid: this.uuid,
      ws: this.ws,
    });
  }
  async getSocketConnection(element: Phaser.GameObjects.DOMElement) {
    try {
      this.elements.playerInfoText.innerText = `try to connect...`;
      this.ws = (await WebSocket.connect(
        `ws://${this.inputFields.ipAddrInput}:20058`
      )) as CustomWebSocket;
      this.ws.sendJson = (data) => this.ws.send(JSON.stringify(data));
      element.getChildByID("first_connection").remove();
      this.elements.playerInfoText.innerText = this.isHost
        ? "waiting for players"
        : "select room";
    } catch (e) {
      this.elements.playerInfoText.innerText = `ws connection failed ${e}`;
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
      console.log("data", data);
      const dataManager = {
        uuid: () => {
          this.uuid = data.uuid;
          if (this.isHost) {
            this.players = [{ uuid: this.uuid, nick: this.nick }];
            const room: Room = {
              type: "createRoom",
              hostUuid: this.uuid,
              roomName: this.inputFields.roomNameInput,
              nick: this.nick,
            };
            this.ws.sendJson(room);
          } else {
            this.ws.sendJson({
              type: "reqRooms",
              uuid: this.uuid,
            });
          }
        },
        start: () => {
          this.startGame();
          removedListener = true;
        },
        rooms: () => {
          if (!this.isHost) {
            this.createRoomsButton(data);
          }
        },
        players: () => {
          this.players = data.players;
          this.elements.playerInfoText.innerText = `${
            this.players.length
          } players: ${JSON.stringify(this.players)}`;
        },
        totalPlayers: () => {
          element.getChildByID(
            "total_players"
          ).innerHTML = `total players: ${data.totalPlayers}`;
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
  createRoomsButton(data) {
    this.elements.roomsContainer.innerHTML = Object.values(data.rooms)
      .map(
        (room: Room) =>
          `<button id="${room.hostUuid}">${room.roomName}</button>`
      )
      .join("");
    Array.from(this.elements.roomsContainer.children).forEach((button) => {
      button.addEventListener("click", ({ target }) => {
        this.inputFields.seletedRoomhostUuid = (target as HTMLElement).id;
        this.ws.sendJson({
          type: "joinRoom",
          uuid: this.uuid,
          hostUuid: this.inputFields.seletedRoomhostUuid,
          nick: this.nick,
        });
        this.elements.roomsContainer.innerHTML = "";
      });
    });
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
