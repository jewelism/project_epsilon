import { defaultTextStyle } from "@/constants";
import { game } from "@/main";

export class InGameUIScene extends Phaser.Scene {
  pingText: Phaser.GameObjects.Text;
  fpsText: Phaser.GameObjects.Text;
  constructor() {
    super("InGameUIScene");
  }
  create() {
    const { width } = this.scale;
    this.pingText = this.add
      .text(width - 10, 30, "rtt", {
        fontSize: "24px",
        color: "#000",
      })
      .setOrigin(1);
    this.fpsText = this.add
      .text(width - 10, 60, "fps", defaultTextStyle)
      .setOrigin(1);
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.fpsText.setText(`fps: ${game.loop.actualFps}`);
      },
      loop: true,
    });
  }
}
