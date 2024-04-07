/* eslint-disable no-use-before-define */
/* eslint-disable react-hooks/exhaustive-deps */
// eslint-disable-next-line import/no-cycle
import { type CustomWebSocket, closeMenuApp, createGame } from '@/index';
import { useEffect, useRef, useState } from 'react';
import { Sprite } from '@/views/Sprite';

type MultiplayLobbyProps = {
  isHost: boolean;
  nickInput: string;
  frameNo: number;
  ipAddrInput: string;
  setCurrentView: (view: string) => void;
};
export function MultiplayLobby({
  isHost,
  nickInput,
  frameNo,
  ipAddrInput,
  setCurrentView,
}: MultiplayLobbyProps) {
  const [infoText, setInfoText] = useState('');
  const [gameStartLoading, setGameStartLoading] = useState(false);
  const [players, setPlayers] = useState([] as any[]);
  // eslint-disable-next-line no-undef
  const retryRef = useRef();
  let alreadyStarted = false;

  const onClickMultiplayStart = () => {
    setGameStartLoading(true);
    window.ws.sendJson({ type: 'gameStart', players });
  };

  const onClickExit = () => {
    window.ws.close();
    window.electron.ipcRenderer.sendMessage('closeServer');
    setCurrentView('MainMenu');
  };

  const gameStart = (receivedPlayers) => {
    setGameStartLoading(true);
    window.electron.store.set('players', JSON.stringify(receivedPlayers));
    window.electron.store.set('stage', '1');
    createGame();
    setGameStartLoading(false);
    closeMenuApp();
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
  const wsOnClose = () => {
    setCurrentView('MainMenu');
    alert('connection closed');
  };
  const wsOnError = () => {
    setInfoText(`connection failed`);
    clearTimeout(retryRef.current);
    // @ts-ignore
    retryRef.current = setTimeout(getSocketConnection, 3000);
  };

  const getSocketConnection = async () => {
    setInfoText('try to connect...');
    const address = `ws://${ipAddrInput}`;
    window.ws = (await new WebSocket(address)) as CustomWebSocket;
    window.ws.addEventListener('error', wsOnError);
    window.ws.addEventListener('open', wsOnOpen);
    window.ws.addEventListener('close', wsOnClose);
  };

  useEffect(() => {
    getSocketConnection();
  }, []);

  useEffect(() => {
    return () => {
      console.log('cleanup');

      clearTimeout(retryRef.current);
      window.ws.removeEventListener('message', wsMessageListener);
      window.ws.removeEventListener('error', wsOnError);
      window.ws.removeEventListener('open', wsOnOpen);
      window.ws.removeEventListener('close', wsOnClose);
    };
  }, []);

  return (
    <div className="flex-center">
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
      <br />
      <div className="flex-center row">
        {!gameStartLoading && isHost && (
          <button
            type="button"
            onClick={onClickMultiplayStart}
            style={{ marginRight: 10 }}
          >
            Start Game
          </button>
        )}
        <button type="button" onClick={onClickExit}>
          Exit
        </button>
      </div>
      <p>{gameStartLoading ? '로오오오딩' : ''}</p>
    </div>
  );
}
