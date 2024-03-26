import { StartScene } from "@/scenes/StartScene";
import { effect, signal } from "@preact/signals-core";

export class EditPlayerScene extends Phaser.Scene {
  container: Phaser.GameObjects.Container;
  selectedCharframeNo = 0;
  selectedCharImage: Phaser.GameObjects.Image;

  create() {
    const totalChars = 24;
    const row = 6;
    const charSize = 16;
    const scale = 2;
    const charSizeScaled = charSize * scale;
    this.container = this.add.container(this.cameras.main.centerX, 200);
    const charButtons = Array.from({ length: totalChars }, (_, i) => i * 2).map(
      (frameNo, i) => {
        const x = (i % row) * charSizeScaled - (row * charSizeScaled) / 2;
        const y =
          Math.floor(i / row) * charSizeScaled -
          ((totalChars / row) * charSizeScaled) / 2;
        const charButton = this.add
          .image(x, y, "pixel_animals", frameNo)
          .setScale(scale)
          .setOrigin(0)
          .setInteractive();
        charButton.on("pointerdown", () => {
          this.onSelectChar(frameNo);
        });
        return charButton;
      }
    );
    this.selectedCharImage = this.add
      .image(0, 100, "pixel_animals", this.selectedCharframeNo)
      .setScale(scale * 2);

    const element = this.add.dom(0, 175).createFromCache("edit_player");
    const nickEl = element.getChildByName("nick") as HTMLInputElement;
    nickEl.focus();
    const okEl = element.getChildByID("ok") as HTMLButtonElement;
    okEl.addEventListener("click", () => {
      localStorage.setItem("nick", nickEl.value);
      localStorage.setItem("frameNo", this.selectedCharframeNo.toString());
      this.scene.start("StartScene");
    });
    // const savedNick = localStorage.getItem("nick");
    // if (savedNick) {
    //   nickEl.value = savedNick;
    // }
    this.container.add([
      this.add.rectangle(
        0,
        0,
        charSizeScaled * row,
        (charSizeScaled * totalChars) / row + element.height
        // 0xfff,
        // 0.5
      ),
      ...charButtons,
      this.selectedCharImage,
      element,
    ]);
    const savedNick = localStorage.getItem("nick");
    if (savedNick) {
      nickEl.value = savedNick;
    }
    const savedFrameNo = localStorage.getItem("frameNo");
    if (savedFrameNo) {
      this.onSelectChar(Number(savedFrameNo));
    }
  }
  onSelectChar(frameNo: number) {
    this.selectedCharframeNo = frameNo;
    this.selectedCharImage.setFrame(frameNo);
  }
  constructor() {
    super("EditPlayerScene");
  }
  preload() {
    this.load.html("edit_player", "phaser/edit_player.html");
    this.load.spritesheet("pixel_animals", "phaser/pixel_animals.png", {
      frameWidth: 16,
      frameHeight: 16,
    });
  }
  shutdown() {
    (this.scene.get("StartScene") as StartScene).createDomElements();
  }
}
