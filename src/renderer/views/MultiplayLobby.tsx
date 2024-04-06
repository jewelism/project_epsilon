/* eslint-disable react-hooks/exhaustive-deps */
// eslint-disable-next-line import/no-cycle
import { type CustomWebSocket, closeMenuApp, createGame } from '@/index';
import { useEffect, useState } from 'react';
import { Sprite } from '@/views/Sprite';

type MultiplayLobbyProps = {
  isHost: boolean;
  nickInput: string;
  frameNo: number;
  ipAddrInput: string;
  servingPortInput: string;
};
export function MultiplayLobby({
  isHost,
  nickInput,
  frameNo,
  ipAddrInput,
  servingPortInput,
}: MultiplayLobbyProps) {
  const [infoText, setInfoText] = useState('');
  const [gameStartLoading, setGameStartLoading] = useState(false);
  const [players, setPlayers] = useState([] as any[]);
  let alreadyStarted = false;

  const onClickMultiplayStart = () => {
    setGameStartLoading(true);
    window.ws.sendJson({ type: 'gameStart', players });
  };

  const gameStart = (receivedPlayers) => {
    setGameStartLoading(true);
    window.electron.store.set('players', JSON.stringify(receivedPlayers));
    window.electron.store.set('stage', '1');
    createGame();
    setGameStartLoading(false);
    closeMenuApp();
    // eslint-disable-next-line no-use-before-define
    window.ws.removeEventListener('message', wsMessageListener);
  };

  const dataManager = {
    uuid: (data) => {
      window.electron.store.set('uuid', data.uuid);
      window.ws.sendJson({
        type: 'joinInLobby',
        uuid: data.uuid,
        nick: nickInput,
        frameNo,
      });
      alreadyStarted = data.started;
    },
    gameStart: (data) => {
      gameStart(data.players);
    },
    players: (data) => {
      setPlayers(data.players);
      if (alreadyStarted) {
        gameStart(data.players);
      }
    },
  };

  const wsMessageListener = (event) => {
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

  const wsOnOpen = () => {
    window.ws.sendJson = (data) => window.ws.send(JSON.stringify(data));
    window.ws.addEventListener('message', wsMessageListener);
    setInfoText(
      isHost ? 'Press start button' : 'Waiting for the host to start',
    );
  };
  const wsOnError = (error) => {
    setInfoText(`ws connection failed: ${error?.message}`);
    // eslint-disable-next-line no-use-before-define
    setTimeout(getSocketConnection, 3000);
  };

  const getSocketConnection = async () => {
    setInfoText('try to connect...');
    const address = isHost
      ? `ws://localhost:${servingPortInput || 20058}`
      : `ws://${ipAddrInput}`;
    window.ws = (await new WebSocket(address)) as CustomWebSocket;
    window.ws.addEventListener('error', wsOnError);
    window.ws.addEventListener('open', wsOnOpen);
  };

  useEffect(() => {
    getSocketConnection();
  }, []);

  useEffect(() => {
    return () => {
      window.ws.removeEventListener('message', wsMessageListener);
      window.ws.removeEventListener('error', wsOnError);
      window.ws.removeEventListener('open', wsOnOpen);
    };
  }, []);

  return (
    <div className="flex-center">
      <h1>MultiplayLobby</h1>
      <p>
        server: {ipAddrInput}
        {isHost ? `:${servingPortInput || 20058}` : ''}
      </p>
      <p>{infoText}</p>
      <div className="char_boxes_wrap">
        {players.map((player) => (
          <div key={player.uuid} className="flex-center" style={{ padding: 5 }}>
            <Sprite frameNo={player.frameNo} />
            {player.nick}
          </div>
        ))}
      </div>
      <br />
      {!gameStartLoading && isHost && (
        <button type="button" onClick={onClickMultiplayStart}>
          Start Game
        </button>
      )}
      <p>{gameStartLoading ? '로오오오딩' : ''}</p>
    </div>
  );
}
