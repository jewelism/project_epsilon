import { defaultTextStyle } from '@/phaser/constants';
import { Animal } from '@/phaser/objects/Animal';
import { effect, signal } from '@preact/signals-core';

export class Player {
  body: Animal;
  targetToMove: Phaser.Math.Vector2 | null = null;
  disabled = signal(false);

  constructor(scene: Phaser.Scene, { x, y, spriteKey, frameNo, nick }) {
    this.body = new Animal(scene, { x, y, spriteKey, frameNo })
      .setDepth(9)
      .add(
        new Phaser.GameObjects.Text(scene, 0, 0, nick, defaultTextStyle)
          .setOrigin(0.5, 1.5)
          .setAlpha(0.75),
      );
    this.body.preUpdate = this.preUpdate.bind(this);

    scene.input.on('pointerdown', (pointer) => {
      if (this.disabled.value) {
        return;
      }
      this.targetToMove = new Phaser.Math.Vector2(pointer.worldX, pointer.worldY);
      scene.physics.moveToObject(this.body, this.targetToMove, this.body.moveSpeed.value);
      this.body.flipSpriteByDirection();
      this.body.sprite.anims.play(`${spriteKey}_move${frameNo}`, true);
    });
    effect(() => {
      if (!this.disabled.value) {
        return;
      }
      this.stopMove();
      this.body.sprite.setTint(0xff0000);
      scene.tweens.add({
        targets: this.body,
        angle: 360,
        duration: 1000,
        repeat: -1,
      });
    });
  }
  preUpdate() {
    this.stopWhenMouseTarget();
  }
  stopWhenMouseTarget() {
    if (!this.targetToMove) {
      return;
    }
    if (
      !(
        Phaser.Math.Distance.Between(
          this.body.x,
          this.body.y,
          this.targetToMove.x,
          this.targetToMove.y,
        ) < 1
      )
    ) {
      return;
    }
    this.targetToMove = null;
    this.stopMove();
  }
  stopMove() {
    (this.body.body as any).setVelocity(0, 0);
  }
}
