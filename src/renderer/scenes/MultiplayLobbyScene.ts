import Phaser from 'phaser';
import { TitleText } from '@/ui/TitleText';
import { mouseClickEffect } from '@/utils/helper';
import { Player } from '@/objects/Player';

export interface CustomWebSocket extends WebSocket {
  uuid?: string;
  sendJson: (data: Record<string, unknown>) => void;
}

export class MultiplayLobbyScene extends Phaser.Scene {
  isHost: boolean;
  players: { uuid: string; nick: string; frameNo: number }[] = [];
  inputFields: Record<string, string> = {};
  elements: Record<string, HTMLElement> = {};
  uuid: string;
  nick: string;
  frameNo: number;
  playersContainers: Player[] = [];
  alreadyStarted: boolean;
  ws: CustomWebSocket;
  wsMessageListener: (event: any) => void;

  // TODO: 이미 시작된 게임이면, ingamescene으로 바로 이동시켜야함. 그리고 players broadcast를 해야함
  async create() {
    // if (this.isHost) {
    //   const command = Command.sidecar("server_epsilon");
    //   await command.spawn();
    // }
    const title = new TitleText(this, 'Lobby');
    const element = this.add
      .dom(title.x, title.y + 300)
      .createFromCache('multiplay_lobby_form');
    this.elements.playerInfoText = element.getChildByID(
      'playerInfoText',
    ) as HTMLInputElement;
    const startButton = element.getChildByID('start');
    startButton.addEventListener('click', () => {
      this.ws.sendJson({ type: 'start' });
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
        this.ws = (await new WebSocket(
          `ws://${this.inputFields.ipAddrInput}:20058`,
        )) as CustomWebSocket;
      } catch (e) {
        this.elements.playerInfoText.innerText = `ws connection failed ${e}`;
      }
    };
    await tryConnect();
    this.ws.sendJson = (data) => this.ws.send(JSON.stringify(data));

    this.elements.playerInfoText.innerText = 'waiting for players';

    this.wsMessageListener = (event) => {
      console.log('message', event.data);
      if (event.type !== 'message') {
        return;
      }
      const data = JSON.parse(event.data as any);
      const dataManager = {
        uuid: () => {
          this.uuid = data.uuid;
          this.ws.sendJson({
            type: 'joinInLobby',
            uuid: this.uuid,
            nick: this.nick,
            frameNo: this.frameNo,
          });
          this.alreadyStarted = data.started;
          console.log('uuid', this.uuid, data.started);
        },
        start: () => {
          this.startGame();
        },
        players: () => {
          this.createPlayers(data.players);
          if (this.alreadyStarted) {
            this.startGame();
          }
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
        console.log('unknown type', data);
      }
    };
    this.ws.addEventListener('message', this.wsMessageListener);
  }

  manageInputElement(
    element: Phaser.GameObjects.DOMElement,
    { name, defaultValue },
  ) {
    const inputEl = element.getChildByName(name) as HTMLInputElement;
    inputEl.addEventListener('change', (e) => {
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
          spriteKey: 'pixel_animals',
          uuid: player.uuid,
          isMyPlayer: player.uuid === this.uuid,
          inLobby: true,
        }).setScale(2);
        this.playersContainers.push(newPlayer);
      });
    this.players = players;
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      mouseClickEffect(this, pointer);
      this.ws.sendJson({
        uuid: this.uuid,
        type: 'move',
        x: pointer.worldX.toFixed(0),
        y: pointer.worldY.toFixed(0),
      });
    });
  }

  startGame() {
    this.ws.removeEventListener('message', this.wsMessageListener);
    this.scene.start('InGameScene', {
      multi: true,
      players: this.players,
      uuid: this.uuid,
      ws: this.ws,
      stage: 1,
    });
  }

  constructor() {
    super('MultiplayLobbyScene');
  }

  init() {
    this.isHost = localStorage.getItem('isHost') === 'true';
    this.nick = localStorage.getItem('nick');
    this.frameNo = parseInt(localStorage.getItem('frameNo'), 10);
    this.inputFields.ipAddrInput = localStorage.getItem('ipAddrInput');
  }
}
