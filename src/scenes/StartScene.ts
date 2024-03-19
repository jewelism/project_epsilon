import { TitleText } from "@/ui/TitleText";

export class StartScene extends Phaser.Scene {
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  nick: string;
  ipAddrInput: string = "localhost";

  create() {
    this.cursors = this.input.keyboard.createCursorKeys();

    const title = new TitleText(this, "Escape from Zoo");

    // const icon = this.add.image(400, 300, 'icon');
    const element = this.add.dom(title.x, 400).createFromCache("main_form");
    const ipAddrInputEl = element.getChildByName(
      "ipAddrInput"
    ) as HTMLInputElement;
    ipAddrInputEl.addEventListener("change", ({ target }) => {
      this.ipAddrInput = (target as HTMLInputElement).value;
    });
    element.getChildByID("tplink").addEventListener("click", () => {
      this.ipAddrInput = "jewelry.tplinkdns.com";
      ipAddrInputEl.value = this.ipAddrInput;
    });
    element.getChildByID("localhost").addEventListener("click", () => {
      this.ipAddrInput = "localhost";
      ipAddrInputEl.value = this.ipAddrInput;
    });
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
          ipAddrInput: this.ipAddrInput,
        });
      }
    });
    const nickEl = element.getChildByName("nick") as HTMLInputElement;
    nickEl.addEventListener("change", ({ target }) => {
      this.nick = (target as HTMLInputElement).value;
    });
    nickEl.focus();
  }
  constructor() {
    super("StartScene");
  }
  preload() {
    this.load.html("main_form", "phaser/main_form.html");
    // this.load.image('icon', 'phaser/icon.png');
  }
}
