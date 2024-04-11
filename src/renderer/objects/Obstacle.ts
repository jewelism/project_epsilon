import Phaser from 'phaser';

export class Obstacle extends Phaser.Physics.Matter.Sprite {
  constructor(
    scene: Phaser.Scene,
    { x, y, width, height, spriteKey, frameNo },
  ) {
    super(scene.matter.world, x, y, spriteKey, frameNo, {
      shape: {
        type: 'rectangle',
        width,
        height,
      },
      isStatic: true,
    });
    scene.add.existing(this);
  }
}
