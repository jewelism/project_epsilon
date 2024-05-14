/* eslint-disable import/no-cycle */
/* eslint-disable import/no-mutable-exports */
import { createRoot } from 'react-dom/client';
import Phaser from 'phaser';
import 'normalize.css';
import { InGameScene } from '@/scenes/InGameScene';
import { InGameUIScene } from '@/scenes/InGameUIScene';
import { Main } from '@/views/Main';

export interface CustomWebSocket extends WebSocket {
  uuid?: string;
  sendJson: (data: Record<string, unknown>) => void;
}

declare global {
  interface Window {
    ws: CustomWebSocket;
  }
}

const config: Phaser.Types.Core.GameConfig = {
  scene: [InGameScene, InGameUIScene],
  url: 'jewelism.github.io',
  type: Phaser.WEBGL,
  scale: {
    mode: Phaser.Scale.FIT,
    // mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  physics: {
    default: 'matter',
    matter: {
      gravity: { x: 0, y: 0 },
      // debug: {
      //   showBody: true,
      //   showStaticBody: true,
      // },
    },
  },
  parent: 'body',
  render: { pixelArt: true, antialias: false },
  dom: {
    createContainer: true,
  },
  // backgroundColor: '#222',
  // fps: {
  //   target: 10,
  //   forceSetTimeOut: true,
  // },
};
export const APP = {
  menu: null,
  game: null,
};
const container = document.getElementById('root') as HTMLElement;
export const openMenuApp = () => {
  if (!APP.menu) {
    const root = createRoot(container);
    APP.menu = root;
  }
  APP.menu.render(<Main />);
};
openMenuApp();
export const closeMenuApp = () => {
  APP.menu?.unmount();
  APP.menu = null;
};
export const createGame = () => {
  APP.game = new Phaser.Game(config);
};
export const removeGame = () => {
  APP.game?.destroy(true);
  APP.game = null;
};

window.addEventListener('beforeunload', () => {
  window.electron.ipcRenderer.sendMessage('closeServer');
});
