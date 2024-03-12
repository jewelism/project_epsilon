import { Animal } from '@/phaser/objects/Animal';
import { signal } from '@preact/signals-core';

export class Player {
  body: Animal;
  keyboard: Record<string, Phaser.Input.Keyboard.Key> = {};
  targetToMove: Phaser.Math.Vector2 | null = null;
  disabled = signal(false);

  constructor(scene: Phaser.Scene, { x, y, hp, spriteKey, frameNo }) {
    this.body = new Animal(scene, { x, y, hp, spriteKey, frameNo });
    this.body.moveSpeed = 70;
    this.body.setDepth(999);
    this.body.preUpdate = this.preUpdate.bind(this);

    scene.input.on('pointerdown', (pointer) => {
      this.targetToMove = new Phaser.Math.Vector2(pointer.worldX, pointer.worldY);
      scene.physics.moveToObject(this.body, this.targetToMove, this.body.moveSpeed);
      this.body.flipSpriteByDirection();
      this.body.sprite.anims.play(`${spriteKey}_move${frameNo}`, true);
    });
  }
  preUpdate() {
    this.stopWhenMouseTarget();
  }
  stopWhenMouseTarget() {
    if (this.disabled.value) {
      return;
    }
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
    (this.body.body as any).setVelocity(0, 0);
    this.targetToMove = null;
  }
}
