import { defaultTextStyle } from '@/phaser/constants';

export class IconButton extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, { x, y, width, height, shortcutText, spriteKey, onClick }) {
    super(scene, x, y);

    const onKeyDown = () => {
      if (!onClick) {
        return;
      }
      button.setAlpha(0.4);
      icon.setAlpha(0.4);
      onClick();
    };
    const onKeyUp = () => {
      button.setAlpha(1);
      icon.setAlpha(1);
    };
    const button = new Phaser.GameObjects.Rectangle(scene, 0, 0, width, height)
      .setStrokeStyle(2, 0x0000ff, 1)
      .setOrigin(0, 0)
      .setInteractive()
      .on('pointerdown', () => {
        onKeyDown();
      })
      .on('pointerup', onKeyUp)
      .on('pointerout', onKeyUp);
    const icon = new Phaser.GameObjects.Sprite(
      scene,
      button.width / 2,
      button.height / 2,
      spriteKey,
    );
    const shortcut = new Phaser.GameObjects.Text(
      scene,
      button.width - 10,
      10,
      shortcutText,
      defaultTextStyle,
    ).setOrigin(0.5, 0.5);

    const buttonContainer = new Phaser.GameObjects.Container(scene, 0, 0, [button, icon, shortcut]);

    this.add(buttonContainer);
    scene.add.existing(this);

    scene.input.keyboard
      .addKey(Phaser.Input.Keyboard.KeyCodes[shortcutText])
      .on('down', onKeyDown)
      .on('up', onKeyUp);
  }
}
