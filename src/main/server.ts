/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-use-before-define */
/* eslint-disable consistent-return */
import WebSocket, { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

interface CustomWebSocket extends WebSocket {
  isAlive?: boolean;
  uuid?: string;
  sendJson: (data: Record<string, unknown>) => void;
}

let started = false;
let players: {
  ws: CustomWebSocket;
  uuid: string;
  nick: string;
  frameNo: number;
  x?: number;
  y?: number;
}[] = [];
const getPlayersForClient = () => players.map(({ ws: _ws, ...rest }) => rest);

const wss = new WebSocketServer({ port: 20058 });
wss.on('connection', function connection(ws: CustomWebSocket) {
  ws.uuid = uuidv4();

  ws.sendJson = (data: Record<string, any>) =>
    ws.send(JSON.stringify(data), {
      binary: false,
    });

  ws.sendJson({ type: 'uuid', uuid: ws.uuid, timestamp: Date.now(), started });
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });
  ws.on('error', console.error);
  ws.on('close', () => {
    players = players.filter(({ ws: { uuid } }) => uuid !== ws.uuid);
    if (players.length === 0) {
      started = false;
      return;
    }
    broadcastPlayers();
  });
  ws.sendJson({ type: 'players', players: getPlayersForClient() });
  ws.on('message', function (data) {
    const message = JSON.parse(data.toString());
    const messageManager = {
      joinInLobby: () => {
        players.push({
          ws,
          uuid: message.uuid,
          nick: message.nick,
          frameNo: message.frameNo,
        });
        broadcastPlayers();
      },
      start: () => {
        started = true;
        broadcast(message);
      },
      rtt: () => {
        const player = findPlayerByUuid(message.uuid);
        player.x = message.x;
        player.y = message.y;

        ws.sendJson({
          type: 'rtt',
          uuid: ws.uuid,
          timestamp: message.timestamp,
          players,
        });
      },
    };
    if (message.type in messageManager) {
      messageManager[message.type]();
    } else {
      console.log('Unknown message type', message.type, players.length);

      broadcast(message);
    }
  });
});

setInterval(() => {
  wss.clients.forEach((ws: CustomWebSocket) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping(null, false, (err: Error) => {
      if (err) {
        console.error(err);
        return ws.terminate();
      }
    });
  });
}, 10000);
console.log('Server is running on port 20058');

const findPlayerWsByUuid = (uuid: string) => {
  let playerWs: CustomWebSocket | null = null;
  wss.clients.forEach((client: CustomWebSocket) => {
    if (client.uuid === uuid) {
      playerWs = client;
    }
  });
  return playerWs;
};
function findPlayerByUuid(uuid: string) {
  return players.find((player) => player.uuid === uuid);
}
function broadcast(data: Record<string, any>) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data), { binary: false });
    }
  });
}
const broadcastPlayers = () => {
  broadcast({
    type: 'players',
    players: getPlayersForClient(),
  });
};
