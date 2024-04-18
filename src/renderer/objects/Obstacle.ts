import Phaser from 'phaser';

export class Obstacle extends Phaser.Physics.Matter.Sprite {
  moveSpeed: number;
  targetToMoveForVelocity: Phaser.Math.Vector2;
  isRoundTrip: boolean = false;
  basicVector: Phaser.Math.Vector2;
  targetVector: Phaser.Math.Vector2;

  constructor(
    scene: Phaser.Scene,
    { x, y, width, height, spriteKey, frameNo, moveSpeed = 1 },
  ) {
    super(
      scene.matter.world,
      x + width / 2,
      y + height / 2,
      spriteKey,
      frameNo,
      {
        shape: {
          type: 'rectangle',
          width,
          height,
        },
      },
    );
    this.basicVector = new Phaser.Math.Vector2(x, y);
    this.moveSpeed = moveSpeed;
    this.setSensor(true).setDepth(8).setFrictionAir(0).setFriction(0);
    scene.add.existing(this);
  }
  preUpdate() {
    this.stopWhenGetToTarget();
  }
  roundTrip(targetVector: Phaser.Math.Vector2) {
    this.targetVector = targetVector;
    this.isRoundTrip = true;
    this.moveToXY(targetVector.x, targetVector.y);
  }
  moveToXY(x: number, y: number) {
    this.targetToMoveForVelocity = new Phaser.Math.Vector2(x, y);
    const direction = new Phaser.Math.Vector2(x - this.x, y - this.y);
    direction.normalize();
    this.setVelocity(
      direction.x * this.moveSpeed,
      direction.y * this.moveSpeed,
    );
    this.flipSpriteByDirection();
    // this.updateAngle();
  }
  stopWhenGetToTarget() {
    if (!this.targetToMoveForVelocity) {
      return;
    }
    if (
      !(
        Phaser.Math.Distance.Between(
          this.x,
          this.y,
          this.targetToMoveForVelocity.x,
          this.targetToMoveForVelocity.y,
        ) < 1
      )
    ) {
      return;
    }
    this.stopMove();
  }
  stopMove() {
    this.targetToMoveForVelocity = null;
    this.setVelocity(0);
    if (this.isRoundTrip) {
      if (
        Phaser.Math.Distance.Between(
          this.x,
          this.y,
          this.targetVector.x,
          this.targetVector.y,
        ) < 1
      ) {
        this.moveToXY(this.basicVector.x, this.basicVector.y);
        return;
      }
      this.moveToXY(this.targetVector.x, this.targetVector.y);
    }
  }
  flipSpriteByDirection() {
    if (this.getVelocity().x > 0) {
      this.setFlipX(true);
      return;
    }
    this.setFlipX(false);
  }
}
