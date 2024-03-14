import { invoke } from "@tauri-apps/api";
import { TitleText } from "@/ui/TitleText";

export class StartScene extends Phaser.Scene {
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super("StartScene");
  }
  preload() {
    this.load.html("main_form", "phaser/main_form.html");
    // this.load.image('icon', 'phaser/icon.png');
  }
  create() {
    this.cursors = this.input.keyboard.createCursorKeys();

    const title = new TitleText(this, "Escape from Zoo");

    // const icon = this.add.image(400, 300, 'icon');
    const element = this.add.dom(title.x, 400).createFromCache("main_form");
    element.addListener("click");
    element.on("click", ({ target: { name } }) => {
      if (name === "singleplayButton") {
        this.scene.start("InGameScene");
      }
      if (name === "createMulti") {
        invoke("serving", { name: "World" });
        this.scene.start("MultiplayLobbyScene", { host: true });
        // this.scene.start("InGameScene");
      }
      if (name === "joinMulti") {
        // this.scene.start("MultiplayLobbyScene");
        this.scene.start("MultiplayLobbyScene", { host: false });
        // this.scene.start("InGameScene");
      }
    });
    // const pressAnyKeyText = this.add
    //   // .text(title.x, title.y + 500, 'press any key', {
    //   .text(50, 50, 'press any key', {
    //     fontSize: '20px',
    //     color: '#fff',
    //     align: 'center',
    //   })
    //   .setOrigin(0, 0);
    // this.tweens.add({
    //   targets: pressAnyKeyText,
    //   alpha: 0,
    //   duration: 600,
    //   ease: 'Power2',
    //   yoyo: true,
    //   repeat: -1,
    // });
  }
}
