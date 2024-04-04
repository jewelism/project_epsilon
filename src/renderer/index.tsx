/* eslint-disable import/no-mutable-exports */
import { createRoot } from 'react-dom/client';
import Phaser from 'phaser';
import 'normalize.css';
import { InGameScene } from '@/scenes/InGameScene';
import { InGameUIScene } from '@/scenes/InGameUIScene';
import { Start } from '@/views/Start';

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
  title: 'project epsilon',
  url: 'jewelism.github.io',
  type: Phaser.WEBGL,
  scale: {
    mode: Phaser.Scale.FIT,
    // mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight,
    // width: Number(import.meta.env.RENDERER_VITE_WINDOW_WIDTH),
    // height: Number(import.meta.env.RENDERER_VITE_WINDOW_HEIGHT),
    // min: {
    //   width: 480 * 2,
    //   height: 270 * 2,
    // },
    // max: {
    //   width: 1920,
    //   height: 1080,
    // },
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: true,
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
  const root = createRoot(container);
  APP.menu = root;
  APP.menu.render(<Start />);
};
openMenuApp();
export const closeMenuApp = () => APP.menu.unmount();
export const createGame = () => {
  APP.game = new Phaser.Game(config);
};
export const removeGame = () => {
  APP.game.destroy(true);
  APP.game = null;
};
// calling IPC exposed from preload script
// window.electron.ipcRenderer.once('ipc-example', (arg) => {
//   // eslint-disable-next-line no-console
//   console.log(arg);
// });
// window.electron.ipcRenderer.once('ipc-example', (arg) => {
//   // eslint-disable-next-line no-console
//   console.log(arg);
// });
