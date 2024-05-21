/* eslint-disable import/no-cycle */
import Phaser from 'phaser';
import { defaultTextStyle } from '@/constants';
import { openMenuApp, removeGame } from '@/index';
import { type InGameScene } from '@/scenes/InGameScene';

export class InGameUIScene extends Phaser.Scene {
  pingText: Phaser.GameObjects.Text;
  fpsText: Phaser.GameObjects.Text;
  centerText: Phaser.GameObjects.Text;
  toMainMenuText: Phaser.GameObjects.Text;
  bgm:
    | Phaser.Sound.NoAudioSound
    | Phaser.Sound.HTML5AudioSound
    | Phaser.Sound.WebAudioSound;
  menuBackground: Phaser.GameObjects.Rectangle;

  create() {
    this.bgm = this.sound.add('bgm', { loop: true, volume: 0.1 });
    if (window.electron.store.get('muteBGM')) {
      this.bgm.setMute(true);
    } else {
      this.bgm.play();
    }

    const { width } = this.scale;
    this.pingText = this.add
      .text(width - 10, 30, 'rtt', defaultTextStyle)
      .setFontSize(15)
      .setOrigin(1);
    this.fpsText = this.add
      .text(width - 10, 60, 'fps', defaultTextStyle)
      .setFontSize(15)
      .setOrigin(1);
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.fpsText.setText(`fps: ${this.game.loop.actualFps.toFixed(0)}`);
      },
      loop: true,
    });
    this.input.keyboard.on(`keydown-ESC`, () => {
      this.toggleMenu();
    });
  }

  toggleMenu() {
    if (this.toMainMenuText) {
      this.toMainMenuText.destroy();
      this.toMainMenuText = null;
      this.menuBackground.destroy();
      this.menuBackground = null;
      return;
    }
    this.toMainMenuText = this.add
      .text(this.scale.width / 2, this.scale.height / 2, 'Leave the game', {
        ...defaultTextStyle,
        fontSize: '30px',
      })
      .setOrigin(0.5);

    const textWidth = this.toMainMenuText.width;
    const textHeight = this.toMainMenuText.height;
    this.menuBackground = this.add
      .rectangle(
        this.scale.width / 2,
        this.scale.height / 2,
        textWidth + 20,
        textHeight + 10,
        0x000000,
      )
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => {
        this.onExit();
      });

    this.menuBackground.setDepth(this.toMainMenuText.depth - 1);
  }

  centerTextOn(text: string) {
    this.centerText = this.add
      .text(this.scale.width / 2, this.scale.height / 2, text, {
        ...defaultTextStyle,
        fontSize: '30px',
      })
      .setOrigin(0.5);
  }

  centerTextOff() {
    this.centerText.destroy();
  }

  onExit() {
    this.bgm.stop();
    const inGameScene = this.scene.get('InGameScene') as InGameScene;
    inGameScene.removeListeners();
    inGameScene.initialData.ws.close();
    this.scene.stop();
    removeGame();
    window.electron.ipcRenderer.sendMessage('closeServer');
    openMenuApp();
  }

  constructor() {
    super('InGameUIScene');
  }
}
