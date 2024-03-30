import { defaultTextStyle } from "@/constants";
import { game } from "@/main";

export class InGameUIScene extends Phaser.Scene {
  pingText: Phaser.GameObjects.Text;
  fpsText: Phaser.GameObjects.Text;
  gameoverText: Phaser.GameObjects.Text;

  create() {
    const { width } = this.scale;
    this.pingText = this.add
      .text(width - 10, 30, "rtt", defaultTextStyle)
      .setFontSize(15)
      .setOrigin(1);
    this.fpsText = this.add
      .text(width - 10, 60, "fps", defaultTextStyle)
      .setFontSize(15)
      .setOrigin(1);
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.fpsText.setText(`fps: ${game.loop.actualFps.toFixed(0)}`);
      },
      loop: true,
    });
  }
  gameoverTextOn() {
    this.gameoverText = this.add
      .text(this.scale.width / 2, this.scale.height / 2, "Game Over", {
        ...defaultTextStyle,
        fontSize: "40px",
      })
      .setOrigin(0.5);
  }
  gameoverTextOff() {
    this.gameoverText.destroy();
  }
  constructor() {
    super("InGameUIScene");
  }
}
