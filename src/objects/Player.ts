import { signal } from "@preact/signals-core";
import { defaultTextStyle } from "@/constants";
import { InGameScene } from "@/scenes/InGameScene";

export class Player extends Phaser.GameObjects.Container {
  moveSpeed = signal(80);
  sprite: Phaser.Physics.Arcade.Sprite;
  frameNo: number;
  spriteKey: string;
  direction: string;

  targetToMove: Phaser.Math.Vector2 | null = null;
  disabled = false;
  oldPosition: undefined | { x: number; y: number };
  uuid: string;
  isMyPlayer: boolean;
  deadTweens: Phaser.Tweens.Tween;
  isPlayerInNonstopZone: boolean;

  constructor(
    scene: Phaser.Scene,
    { x, y, spriteKey, frameNo, nick, uuid, isMyPlayer }
  ) {
    super(scene, x, y);
    this.uuid = uuid;
    this.isMyPlayer = isMyPlayer;
    this.frameNo = frameNo;
    this.spriteKey = spriteKey;

    this.sprite = new Phaser.Physics.Arcade.Sprite(
      scene,
      0,
      0,
      spriteKey,
      frameNo
    );
    this.setSize(this.sprite.width - 6, this.sprite.height - 8);

    this.sprite.anims.create({
      key: `${spriteKey}_move${frameNo}`,
      frames: this.sprite.anims.generateFrameNames(spriteKey, {
        frames: [frameNo, frameNo + 1],
      }),
      frameRate: this.moveSpeed.value / 20,
    });
    scene.physics.world.enable(this);

    this.add([this.sprite]);
    scene.add.existing(this);
    this.setDepth(9).add(
      new Phaser.GameObjects.Text(scene, 0, 0, nick, defaultTextStyle)
        .setOrigin(0.5, 1.5)
        .setAlpha(0.75)
    );
  }
  preUpdate() {
    // TODO: straightZone만들기;
    const isPlayerInNonstopZone = (
      this.scene as InGameScene
    ).isPlayerInNonstopZone();
    console.log("isPlayerInNonstopZone", isPlayerInNonstopZone);

    const scene = this.scene as InGameScene;
    if (scene.isPlayerInNonstopZone()) {
      this.isPlayerInNonstopZone = true;
    } else if (scene.isPlayerInSafeZone()) {
      this.stopWhenMouseTarget();
      if (this.isPlayerInNonstopZone) {
        this.isPlayerInNonstopZone = false;
        this.stopMove();
      }
    }
    // TODO: straightZone만들기;
    // TODO: invertZone만들기;
  }
  moveToXY(x: number, y: number) {
    this.targetToMove = new Phaser.Math.Vector2(x, y);
    const isPlayerInNonstopZone = (
      this.scene as InGameScene
    ).isPlayerInNonstopZone();
    console.log("isPlayerInNonstopZone", isPlayerInNonstopZone);
    // if (isPlayerInNonstopZone) {
    //   this.scene.physics.moveTo(this, x, y, this.moveSpeed.value);
    // } else {
    this.scene.physics.moveToObject(
      this,
      this.targetToMove,
      this.moveSpeed.value
    );
    // }
    this.flipSpriteByDirection();
    this.sprite.anims.play(`${this.spriteKey}_move${this.frameNo}`, true);
  }
  flipSpriteByDirection() {
    if (this.body.velocity.x > 0) {
      this.sprite.setFlipX(true);
      return;
    }
    this.sprite.setFlipX(false);
  }
  stopWhenMouseTarget() {
    if (!this.targetToMove) {
      return;
    }
    if (
      !(
        Phaser.Math.Distance.Between(
          this.x,
          this.y,
          this.targetToMove.x,
          this.targetToMove.y
        ) < 1
      )
    ) {
      return;
    }
    this.stopMove();
  }
  stopMove() {
    this.targetToMove = null;
    (this.body as any).setVelocity(0, 0);
  }
  playerDead(x: number, y: number) {
    console.log("playerDead", this.body);
    this.disabled = true;
    this.setPosition(x, y);
    this.stopMove();
    this.sprite.setTint(0xff0000);

    this.deadTweens = this.scene.tweens.add({
      targets: this.sprite,
      angle: 360,
      duration: 1000,
      repeat: -1,
    });
  }
  playerResurrection(x: number, y: number) {
    this.setPosition(x, y);
    this.sprite.clearTint();
    this.deadTweens?.stop();
    this.sprite.angle = 0;
    this.disabled = false;
  }
}
