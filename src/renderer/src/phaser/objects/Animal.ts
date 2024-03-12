export class Animal extends Phaser.GameObjects.Container {
  moveSpeed: number = 50;
  sprite: Phaser.Physics.Arcade.Sprite;
  frameNo: number;
  spriteKey: string;
  direction: string;

  constructor(scene: Phaser.Scene, { x, y, hp, spriteKey, frameNo }) {
    super(scene, x, y);
    this.sprite = new Phaser.Physics.Arcade.Sprite(scene, 0, 0, spriteKey, frameNo);
    this.frameNo = frameNo;
    this.spriteKey = spriteKey;

    this.setSize(this.sprite.width, this.sprite.height);

    this.sprite.anims.create({
      key: `${spriteKey}_move${frameNo}`,
      frames: this.sprite.anims.generateFrameNames(spriteKey, {
        frames: [frameNo, frameNo + 1],
      }),
      frameRate: this.moveSpeed / 20,
    });
    scene.physics.world.enable(this);

    this.add([this.sprite]);
    scene.add.existing(this);
  }
  preUpdate() {}
  flipSpriteByDirection() {
    if (this.body.velocity.x > 0) {
      this.sprite.setFlipX(true);
      return;
    }
    this.sprite.setFlipX(false);
  }
}
