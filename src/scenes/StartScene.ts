import { TitleText } from "@/ui/TitleText";

export class StartScene extends Phaser.Scene {
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  nick: string;

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
      if (["createMulti", "joinMulti"].includes(name)) {
        if (!this.nick) {
          element.getChildByID("status").innerHTML = "input nick!!!!!!!!!!!!!";
          (element.getChildByName("nick") as HTMLInputElement).focus();
          return;
        }
        this.scene.start("MultiplayLobbyScene", {
          host: name === "createMulti" ? true : false,
          nick: this.nick,
        });
      }
    });
    element.getChildByName("nick").addEventListener("change", ({ target }) => {
      this.nick = (target as HTMLInputElement).value;
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
  constructor() {
    super("StartScene");
  }
  preload() {
    this.load.html("main_form", "phaser/main_form.html");
    // this.load.image('icon', 'phaser/icon.png');
  }
}
