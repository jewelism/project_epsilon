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
let wssInstance: WebSocketServer | null = null;
export const closeServer = () => {
  wssInstance?.clients.forEach((client: CustomWebSocket) => {
    client.terminate();
  });
  wssInstance?.close();
  wssInstance = null;
};
export const openServer = ({ port }) => {
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

  const wss = new WebSocketServer({ port });
  wssInstance = wss;
  wss.on('connection', function connection(ws: CustomWebSocket) {
    ws.uuid = uuidv4();

    ws.sendJson = (data: Record<string, any>) => {
      try {
        ws.send(JSON.stringify(decycle(data)), {
          binary: false,
        });
      } catch (e) {
        console.error(e);
      }
    };

    ws.sendJson({
      type: 'uuid',
      uuid: ws.uuid,
      timestamp: Date.now(),
      started,
    });
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
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type in messageManager) {
          messageManager[message.type]({ message, ws });
        } else {
          console.log('Unknown message type', message.type, players.length);
          broadcast(message);
        }
      } catch (error) {
        console.error(error);
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
  console.log(`Server is running on port ${port}`);

  const messageManager = {
    uuid: ({ message }) => {
      broadcast({ ...message, started });
    },
    joinInLobby: ({ ws, message }) => {
      players.push({
        ws,
        uuid: message.uuid,
        nick: message.nick,
        frameNo: message.frameNo,
      });
      broadcastPlayers();
    },
    gameStart: ({ message }) => {
      started = true;
      broadcast(message);
    },
    rtt: ({ ws, message }) => {
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
    move: ({ message }) => {
      broadcast(message);
    },
  };

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
    wss.clients.forEach((client: CustomWebSocket) => {
      if (client.readyState === WebSocket.OPEN) {
        client.sendJson(data);
      }
    });
  }
  const broadcastPlayers = () => {
    broadcast({
      type: 'players',
      players: getPlayersForClient(),
    });
  };
};
function decycle(obj, stack = []) {
  if (!obj || typeof obj !== 'object') return obj;

  if (stack.includes(obj)) return null;

  const s = stack.concat([obj]);

  return Array.isArray(obj)
    ? obj.map((x) => decycle(x, s))
    : Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [k, decycle(v, s)]),
      );
}
