import { createPhaser } from '@/phaser/index';

function init(): void {
  window.addEventListener('DOMContentLoaded', () => {
    createPhaser();
  });
}

init();

declare global {
  interface Window {
    io: any;
    signal: any;
    effect: any;
    phaser: any;
  }
}
