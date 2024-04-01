import { defaultTextStyle } from "@/constants";
import { game } from "@/main";
import { InGameScene } from "@/scenes/InGameScene";

export class InGameUIScene extends Phaser.Scene {
  pingText: Phaser.GameObjects.Text;
  fpsText: Phaser.GameObjects.Text;
  centerText: Phaser.GameObjects.Text;
  toMainMenuText: Phaser.GameObjects.Text;

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
    this.input.keyboard.on(`keydown-ESC`, () => {
      this.toggleMenu();
    });
  }
  toggleMenu() {
    if (this.toMainMenuText) {
      this.toMainMenuText.destroy();
      return;
    }
    this.toMainMenuText = this.add
      .text(this.scale.width / 2, this.scale.height / 2, "Go to main", {
        ...defaultTextStyle,
        fontSize: "30px",
      })
      .setOrigin(0.5)
      .setInteractive()
      .on("pointerdown", () => {
        const inGameScene = this.scene.get("InGameScene") as InGameScene;
        inGameScene.initialData.ws.disconnect();
        inGameScene.scene.start("StartScene");
        this.scene.stop();
      });
  }
  centerTextOn(text: string) {
    this.centerText = this.add
      .text(this.scale.width / 2, this.scale.height / 2, text, {
        ...defaultTextStyle,
        fontSize: "30px",
      })
      .setOrigin(0.5);
  }
  centerTextOff() {
    this.centerText.destroy();
  }
  constructor() {
    super("InGameUIScene");
  }
}
