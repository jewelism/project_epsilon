export class StartScene extends Phaser.Scene {
  nick: string;
  ipAddrInput: string = "localhost";
  element: Phaser.GameObjects.DOMElement;

  create() {
    this.nick = localStorage.getItem("nick");
    if (!this.nick) {
      this.scene.start("EditPlayerScene");
      return;
    }
    this.element = this.createDomElements();
  }
  createDomElements() {
    const element = this.add
      .dom(this.cameras.main.centerX, 400)
      .createFromCache("main_form");
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
    element.getChildByID("edit_player").addEventListener("click", () => {
      this.scene.start("EditPlayerScene");
    });
    element.addListener("click");
    element.on("click", ({ target: { name } }) => {
      if (name === "singleplayButton") {
        this.scene.start("InGameScene");
      }
      if (["createMulti", "joinMulti"].includes(name)) {
        this.scene.start("MultiplayLobbyScene", {
          host: name === "createMulti" ? true : false,
          nick: this.nick,
          frameNo: Number(localStorage.getItem("frameNo")) || 0,
          ipAddrInput: this.ipAddrInput,
        });
      }
    });
    return element;
  }
  constructor() {
    super("StartScene");
  }
  preload() {
    this.load.html("main_form", "phaser/main_form.html");
    // this.load.image('icon', 'phaser/icon.png');
  }
}
