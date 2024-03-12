import { createPhaser } from '@/phaser';

function init(): void {
  window.addEventListener('DOMContentLoaded', () => {
    createPhaser();
  });
}

init();
