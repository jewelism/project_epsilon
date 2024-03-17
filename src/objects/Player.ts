import { signal, effect } from "@preact/signals-core";
import { defaultTextStyle } from "@/constants";
import { Animal } from "@/objects/Animal";
import { InGameScene } from "@/scenes/InGameScene";

export class Player {
  body: Animal;
  targetToMove: Phaser.Math.Vector2 | null = null;
  disabled = signal(false);
  oldPosition: undefined | { x: number; y: number };
  wsId: number;

  constructor(scene: Phaser.Scene, { x, y, spriteKey, frameNo, nick, wsId }) {
    this.wsId = wsId;
    this.body = new Animal(scene, { x, y, spriteKey, frameNo })
      .setDepth(9)
      .add(
        new Phaser.GameObjects.Text(scene, 0, 0, nick, defaultTextStyle)
          .setOrigin(0.5, 1.5)
          .setAlpha(0.75)
      );
    this.body.preUpdate = this.preUpdate.bind(this);

    this.mouseClickMove(scene);
    effect(() => {
      if (!this.disabled.value) {
        return;
      }
      this.playerDead(scene);
    });
  }
  preUpdate() {
    this.stopWhenMouseTarget();
  }
  moveToXY(x: number, y: number) {
    this.targetToMove = new Phaser.Math.Vector2(x, y);
    this.body.scene.physics.moveToObject(
      this.body,
      this.targetToMove,
      this.body.moveSpeed.value
    );
    this.body.flipSpriteByDirection();
    this.body.sprite.anims.play(
      `${this.body.spriteKey}_move${this.body.frameNo}`,
      true
    );
  }
  mouseClickMove(scene: Phaser.Scene) {
    scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.mouseClickEffect(scene, pointer);
      if (this.disabled.value) {
        return;
      }
      const ws = (scene as InGameScene).ws;
      if (this.wsId === ws.id) {
        this.moveToXY(pointer.worldX, pointer.worldY);
      }
      ws.send(
        JSON.stringify({
          id: this.wsId,
          type: "move",
          x: pointer.worldX.toFixed(0),
          y: pointer.worldY.toFixed(0),
        })
      );
    });
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
          this.targetToMove.y
        ) < 1
      )
    ) {
      return;
    }
    this.targetToMove = null;
    this.stopMove();
  }
  mouseClickEffect(scene: Phaser.Scene, pointer: Phaser.Input.Pointer) {
    let circle = scene.add.circle(pointer.worldX, pointer.worldY, 7, 0x00ffff);
    scene.tweens.add({
      targets: circle,
      scaleX: 0.1,
      scaleY: 0.1,
      alpha: 0,
      duration: 750,
      ease: "Power2",
      onComplete: () => circle.destroy(),
    });
  }
  stopMove() {
    (this.body.body as any).setVelocity(0, 0);
  }
  playerDead(scene: Phaser.Scene) {
    this.stopMove();
    this.body.sprite.setTint(0xff0000);

    scene.tweens.add({
      targets: this.body,
      angle: 360,
      duration: 1000,
      repeat: -1,
    });
  }
}
