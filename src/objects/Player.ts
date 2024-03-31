import { signal } from "@preact/signals-core";
import { defaultTextStyle } from "@/constants";
import { InGameScene } from "@/scenes/InGameScene";

export class Player extends Phaser.GameObjects.Container {
  moveSpeed = signal(80);
  sprite: Phaser.Physics.Arcade.Sprite;
  frameNo: number;
  spriteKey: string;

  targetToMove: Phaser.Math.Vector2 | null = null;
  disabled = false;
  uuid: string;
  isMyPlayer: boolean;
  deadTweens: Phaser.Tweens.Tween;
  zone: Record<"safe" | "nonstop" | "straight" | "invert", boolean> = {
    safe: true,
    nonstop: false,
    straight: false,
    invert: false,
  };
  isResurrecting = false;
  inLobby = false;
  nick: string = "";

  constructor(
    scene: Phaser.Scene,
    { x, y, spriteKey, frameNo, nick, uuid, isMyPlayer, inLobby = false }
  ) {
    super(scene, x, y);
    this.uuid = uuid;
    this.nick = nick;
    this.isMyPlayer = isMyPlayer;
    this.frameNo = frameNo;
    this.spriteKey = spriteKey;
    this.inLobby = inLobby;

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
    if (this.inLobby) {
      this.stopWhenMouseTarget();
      return;
    }
    if (this.disabled) {
      return;
    }
    this.updatePlayerInZone();
  }
  moveToXY(x: number, y: number, { invert = false } = {}) {
    if (invert) {
      this.scene.physics.velocityFromRotation(
        Phaser.Math.Angle.Between(x, y, this.x, this.y),
        this.moveSpeed.value,
        this.body.velocity as Phaser.Math.Vector2
      );
    } else {
      this.targetToMove = new Phaser.Math.Vector2(x, y);
      this.scene.physics.moveToObject(
        this,
        this.targetToMove,
        this.moveSpeed.value
      );
    }
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
  updatePlayerInZone() {
    if (this.isPlayerInInvertZone()) {
      this.zone.nonstop = true;
      this.zone.straight = false;
      this.zone.invert = true;
    } else if (this.isPlayerInNonstopZone()) {
      this.zone.nonstop = true;
      this.zone.straight = false;
      this.zone.invert = false;
    } else if (this.isPlayerInStraightZone()) {
      this.zone.nonstop = true;
      this.zone.straight = true;
      this.zone.invert = false;
    } else if (this.isPlayerInSafeZone()) {
      this.stopWhenMouseTarget();
      if (this.zone.nonstop || this.zone.straight || this.zone.invert) {
        this.zone.nonstop = false;
        this.zone.straight = false;
        this.zone.invert = false;
        this.stopMove();
      }
    }
  }
  isPlayerInZone(zone: Phaser.Geom.Rectangle[]) {
    return zone.some((zone) =>
      Phaser.Geom.Rectangle.ContainsPoint(
        zone,
        new Phaser.Geom.Point(this.x, this.y)
      )
    );
  }
  isPlayerInSafeZone() {
    return this.isPlayerInZone((this.scene as InGameScene).safeZone);
  }
  isPlayerInNonstopZone() {
    return this.isPlayerInZone((this.scene as InGameScene).nonstopZone);
  }
  isPlayerInStraightZone() {
    return this.isPlayerInZone((this.scene as InGameScene).straightZone);
  }
  isPlayerInInvertZone() {
    return this.isPlayerInZone((this.scene as InGameScene).invertZone);
  }
}
