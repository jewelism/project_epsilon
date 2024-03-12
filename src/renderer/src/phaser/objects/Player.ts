import { Animal } from '@/phaser/objects/Animal';
import { InGameScene } from '@/phaser/scenes/InGameScene';
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
      console.log('pointer', pointer.x, pointer.y);
      scene.physics.moveToObject(this.body, this.targetToMove, this.body.moveSpeed);
      this.body.flipSpriteByDirection();
    });
  }
  preUpdate() {
    if (
      this.targetToMove &&
      Phaser.Math.Distance.Between(
        this.body.x,
        this.body.y,
        this.targetToMove.x,
        this.targetToMove.y,
      ) < 1
    ) {
      (this.body.body as any).setVelocity(0, 0);
      this.targetToMove = null;
    }
  }
  playerVelocityMoveWithKeyboard() {
    const { left, right, up, down } = (this.body.scene as InGameScene).cursors;
    const speed = this.body.moveSpeed;
    const xSpeed = left.isDown ? -speed : right.isDown ? speed : 0;
    const ySpeed = up.isDown ? -speed : down.isDown ? speed : 0;
    (this.body.body as any).setVelocity(xSpeed, ySpeed);
    if (xSpeed === 0 && ySpeed === 0) {
      return;
    }
    this.body.flipSpriteByDirection();
    this.body.sprite.anims.play(`pixel_animals_move${this.body.frameNo}`, true);
  }
}
