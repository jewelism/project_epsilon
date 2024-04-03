import { CustomWebSocket, closeMenuApp, createGame } from '@/index';
import { useEffect, useState } from 'react';
import PixelAnimals from '@/public/pixel_animals.png';
import { Sprite } from '@/views/Sprite';

type MultiplayLobbyProps = {
  isHost: boolean;
  nickInput: string;
  frameNo: number;
  ipAddrInput: string;
};
export function MultiplayLobby({
  isHost,
  nickInput,
  frameNo,
  ipAddrInput,
}: MultiplayLobbyProps) {
  const [infoText, setInfoText] = useState('');
  const [alreadyStarted, setAlreadyStarted] = useState(false);
  const [players, setPlayers] = useState([]);
  const [gameStartLoading, setGameStartLoading] = useState(false);

  const onClickMultiplayStart = () => {
    localStorage.setItem('players', JSON.stringify(players));
    localStorage.setItem('stage', '1');
    window.ws.sendJson({ type: 'gameStart' });
    setGameStartLoading(true);
  };

  const getSocketConnection = async () => {
    try {
      window.ws = (await new WebSocket(
        `ws://${ipAddrInput}:20058`,
      )) as CustomWebSocket;
      window.ws.sendJson = (data) => window.ws.send(JSON.stringify(data));
      setInfoText('waiting for players...');
      const wsMessageListener = (event) => {
        console.log('message', event.data);
        if (event.type !== 'message') {
          return;
        }
        const data = JSON.parse(event.data as any);
        const gameStart = () => {
          createGame();
          setGameStartLoading(false);
          closeMenuApp();
          window.ws.removeEventListener('message', wsMessageListener);
        };
        const dataManager = {
          uuid: () => {
            localStorage.setItem('uuid', data.uuid);
            window.ws.sendJson({
              type: 'joinInLobby',
              uuid: data.uuid,
              nick: nickInput,
              frameNo,
            });
            setAlreadyStarted(data.started);
            console.log('uuid', data.uuid, data.started);
          },
          gameStart,
          players: () => {
            createPlayers(data.players);
            if (alreadyStarted) {
              gameStart();
            }
          },
        };
        if (data.type in dataManager) {
          dataManager[data.type]();
        } else {
          console.error('unknown data type', data);
        }
      };
      window.ws.addEventListener('message', wsMessageListener);
    } catch (e) {
      setInfoText(`ws connection failed ${e}`);
    }
  };

  const createPlayers = (players: any) => {
    setPlayers(players);
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
