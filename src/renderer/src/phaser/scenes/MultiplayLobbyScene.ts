import { TitleText } from '@/phaser/ui/TitleText';

export class MultiplayLobbyScene extends Phaser.Scene {
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  socket: any;

  constructor() {
    super('MultiplayLobbyScene');
  }
  preload() {
    this.load.html('multiplay_form', 'phaser/multiplay_form.html');
    // this.load.image('icon', 'phaser/icon.png');
  }
  create() {
    this.socket = this.getSocketConnection();
    this.cursors = this.input.keyboard.createCursorKeys();

    new TitleText(this, 'Lobby');

    // const icon = this.add.image(400, 300, 'icon');

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
    const onKeydown = () => {
      this.socket.emit('test', 'test msg1');
      // this.scene.start('SelectLevelScene');
    };
    this.input.keyboard.on('keydown', onKeydown);
    this.input.on('pointerdown', onKeydown);
  }
  getSocketConnection() {
    const socket = window.io(`http://localhost:20058`);
    socket.on('error', (e) => {
      console.log(e); // not displayed
    });
    socket.on('connect', () => {
      console.log('connected renderer', localStorage.getItem('token')); // displayed
    });
    return socket;
  }
}
