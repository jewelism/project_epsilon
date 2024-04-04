import { CustomWebSocket, closeMenuApp, createGame } from '@/index';
import { useCallback, useEffect, useState } from 'react';
import { Sprite } from '@/views/Sprite';

type MultiplayLobbyProps = {
  isHost: boolean;
  nickInput: string;
  frameNo: number;
  ipAddrInput: string;
  portInput: number;
};
export function MultiplayLobby({
  isHost,
  nickInput,
  frameNo,
  ipAddrInput,
  portInput,
}: MultiplayLobbyProps) {
  const [infoText, setInfoText] = useState('');
  const [gameStartLoading, setGameStartLoading] = useState(false);
  const [players, setPlayers] = useState([] as any[]);
  // let players = [];
  let alreadyStarted = false;

  const onClickMultiplayStart = () => {
    window.ws.sendJson({ type: 'gameStart', players });
  };

  const gameStart = (players) => {
    setGameStartLoading(true);
    console.log('gameStart', players);

    localStorage.setItem('players', JSON.stringify(players));
    localStorage.setItem('stage', '1');
    createGame();
    setGameStartLoading(false);
    closeMenuApp();
    window.ws.removeEventListener('message', wsMessageListener);
  };

  const dataManager = {
    uuid: (data) => {
      localStorage.setItem('uuid', data.uuid);
      window.ws.sendJson({
        type: 'joinInLobby',
        uuid: data.uuid,
        nick: nickInput,
        frameNo,
      });
      alreadyStarted = data.started;
      console.log('receive uuid', data.uuid, data.started);
    },
    gameStart: (data) => {
      gameStart(data.players);
    },
    players: (data) => {
      console.log('receive players', data.players);
      setPlayers(data.players);
      // players = data.players;
      // TODO: 재접하면 이미 시작된 게임에 참여할 수 있게 하기.
      // 재접시 2명이어야하는데 players.length가 1이다. 그다음에 players가 한번 더 호출되면서 2명이 된다. 왜 2번호출?

      if (alreadyStarted) {
        gameStart(data.players);
      }
    },
  };

  const wsMessageListener = (event) => {
    console.log('message', event.data);
    if (event.type !== 'message') {
      return;
    }
    const data = JSON.parse(event.data as any);

    if (data.type in dataManager) {
      dataManager[data.type](data);
    } else {
      console.error('unknown data type', data);
    }
  };

  const getSocketConnection = async () => {
    setInfoText('try to connect...');
    window.ws = (await new WebSocket(
      `ws://${ipAddrInput}:${portInput}`,
    )) as CustomWebSocket;
    window.ws.addEventListener('error', (error: any) => {
      setInfoText(`ws connection failed: ${error?.message}`);
      setTimeout(getSocketConnection, 3000);
    });
    window.ws.addEventListener('open', () => {
      window.ws.sendJson = (data) => window.ws.send(JSON.stringify(data));
      window.ws.addEventListener('message', wsMessageListener);
      setInfoText('waiting for players...');
    });
  };

  useEffect(() => {
    getSocketConnection();
  }, []);

  return (
    <div>
      <h1>MultiplayLobby</h1>
      <p>server: {ipAddrInput}</p>
      <p>{infoText}</p>
      <div className="char_boxes_wrap">
        {players.map((player) => (
          <div key={player.uuid} className="flex-center" style={{ padding: 5 }}>
            <Sprite frameNo={player.frameNo} />
            {player.nick}
          </div>
        ))}
      </div>
      {!gameStartLoading && isHost && (
        <button type="button" onClick={onClickMultiplayStart}>
          Start Game
        </button>
      )}
      <p>{gameStartLoading ? '로오오오딩' : ''}</p>
    </div>
  );
}
