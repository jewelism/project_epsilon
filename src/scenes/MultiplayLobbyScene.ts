import { Command } from "@tauri-apps/api/shell";
import WebSocket from "tauri-plugin-websocket-api";
import { TitleText } from "@/ui/TitleText";
import { mouseClickEffect } from "@/utils/helper";
import { Player } from "@/objects/Player";

export interface CustomWebSocket extends WebSocket {
  uuid?: string;
  sendJson: (data: Record<string, unknown>) => void;
}

let removedListener = false;
export class MultiplayLobbyScene extends Phaser.Scene {
  ws: CustomWebSocket;
  isHost: boolean;
  players: { uuid: string; nick: string; frameNo: number }[] = [];

  inputFields: Record<string, string> = {};
  elements: Record<string, HTMLElement> = {};
  uuid: string;
  nick: string;
  frameNo: number;
  playersContainers: Player[] = [];

  async create() {
    // if (this.isHost) {
    //   const command = Command.sidecar("server_epsilon");
    //   await command.spawn();
    // }
    const title = new TitleText(this, "Lobby");
    const element = this.add
      .dom(title.x, title.y + 300)
      .createFromCache("multiplay_lobby_form");
    this.elements.playerInfoText = element.getChildByID(
      "playerInfoText"
    ) as HTMLInputElement;
    const startButton = element.getChildByID("start");
    startButton.addEventListener("click", () => {
      this.ws.sendJson({ type: "start" });
    });
    if (!this.isHost) {
      startButton.remove();
    }
    await this.getSocketConnection();
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
    this.ws.sendJson = (data) => this.ws.send(JSON.stringify(data));

    this.elements.playerInfoText.innerText = "waiting for players";

    this.ws.addListener((value) => {
      if (removedListener) {
        return;
      }
      if (value.type !== "Text") {
        return;
      }
      const data = JSON.parse(value.data as any);
      const dataManager = {
        uuid: () => {
          this.uuid = data.uuid;
          this.ws.sendJson({
            type: "joinInLobby",
            uuid: this.uuid,
            nick: this.nick,
            frameNo: this.frameNo,
          });
        },
        start: () => {
          this.startGame();
          removedListener = true;
        },
        players: () => {
          this.createPlayers(data.players);
        },
        move: () => {
          this.playersContainers
            .find(({ uuid }) => uuid === data.uuid)
            ?.moveToXY(data.x, data.y);
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
  createPlayers(players: { uuid: string; nick: string; frameNo: number }[]) {
    players
      .filter((player) => !this.players.some((p) => p.uuid === player.uuid))
      .forEach((player) => {
        const newPlayer = new Player(this, {
          x: Phaser.Math.Between(100, 400),
          y: Phaser.Math.Between(300, 500),
          nick: player.nick,
          frameNo: player.frameNo,
          spriteKey: "pixel_animals",
          uuid: player.uuid,
          isMyPlayer: player.uuid === this.uuid,
          inLobby: true,
        }).setScale(2);
        this.playersContainers.push(newPlayer);
      });
    this.players = players;
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      mouseClickEffect(this, pointer);
      this.ws.sendJson({
        uuid: this.uuid,
        type: "move",
        x: pointer.worldX.toFixed(0),
        y: pointer.worldY.toFixed(0),
      });
    });
  }
  startGame() {
    this.scene.start("InGameScene", {
      multi: true,
      players: this.players,
      uuid: this.uuid,
      ws: this.ws,
      stage: 1,
    });
  }

  constructor() {
    super("MultiplayLobbyScene");
  }
  init(data) {
    this.isHost = data.host;
    this.nick = data.nick;
    this.frameNo = data.frameNo;
    this.inputFields.ipAddrInput = data.ipAddrInput;
    localStorage.setItem("nick", data.nick);
  }
  preload() {
    this.load.html("multiplay_lobby_form", "phaser/multiplay_lobby_form.html");
    this.load.spritesheet("pixel_animals", "phaser/pixel_animals.png", {
      frameWidth: 16,
      frameHeight: 16,
    });
  }
}
