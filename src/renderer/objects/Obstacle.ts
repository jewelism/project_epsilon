import Phaser from 'phaser';

export class Obstacle extends Phaser.GameObjects.Container {
  sprite: Phaser.GameObjects.Sprite;
  constructor(
    scene: Phaser.Scene,
    { x, y, width, height, spriteKey, frameNo },
  ) {
    super(scene, x, y);
    this.sprite = new Phaser.GameObjects.Sprite(
      scene,
      0,
      0,
      spriteKey,
      frameNo,
    );
    this.add(this.sprite);
    this.setSize(width, height);
    scene.add.existing(this);
  }
}
