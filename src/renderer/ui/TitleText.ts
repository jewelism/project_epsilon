import Phaser from 'phaser';

export class TitleText extends Phaser.GameObjects.Text {
  constructor(
    scene: Phaser.Scene,
    text: string,
    y?: number,
    style?: Phaser.Types.GameObjects.Text.TextStyle,
  ) {
    const rect = scene.add.rectangle(0, 0, 400, 30).setOrigin(0.5, 0.5);
    Phaser.Display.Align.In.TopCenter(
      rect,
      scene.add.zone(0, 0, scene.scale.width, scene.scale.height).setOrigin(0, 0),
    );

    super(
      scene,
      rect.x,
      y ? y : rect.y + 100,
      text,
      style
        ? style
        : {
            fontSize: '32px',
            color: '#fff',
            align: 'center',
          },
    );

    this.setOrigin(0.5, 0.5).setDepth(9999);
    scene.add.existing(this);
  }
}
