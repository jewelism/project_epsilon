import { type InGameScene } from '@/scenes/InGameScene';
import { defaultTextStyle } from '@/constants';
import Phaser from 'phaser';

export class Player extends Phaser.Physics.Matter.Sprite {
  moveSpeed = 1;
  frameNo: number;
  spriteKey: string;

  targetToMove: Phaser.Math.Vector2 | null = null;
  disabled = false;
  uuid: string;
  isMyPlayer: boolean;
  deadTweens: Phaser.Tweens.Tween;
  zone: Record<'nonstop' | 'straight' | 'invert', boolean> = {
    nonstop: false,
    straight: false,
    invert: false,
  };
  isIgnoreRttCorrection = false;
  nick: string = '';
  nickText: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    { x, y, spriteKey, frameNo, nick, uuid, isMyPlayer },
  ) {
    super(scene.matter.world, x, y, spriteKey, frameNo, {
      shape: {
        type: 'rectangle',
        width: 10,
        height: 8,
      },
    });
    this.uuid = uuid;
    this.nick = nick;
    this.isMyPlayer = isMyPlayer;
    this.frameNo = frameNo;
    this.spriteKey = spriteKey;

    this.setSensor(true).setDepth(9).setFrictionAir(0).setFriction(0);
    this.anims.create({
      key: `${spriteKey}_move${frameNo}`,
      frames: this.anims.generateFrameNames(spriteKey, {
        frames: [frameNo, frameNo + 1],
      }),
      frameRate: this.moveSpeed / 20,
    });
    this.nickText = new Phaser.GameObjects.Text(
      scene,
      0,
      0,
      nick,
      defaultTextStyle,
    )
      .setOrigin(0.5, 1.5)
      .setAlpha(0.75);
    scene.add.existing(this);
    scene.add.existing(this.nickText);
  }
  preUpdate() {
    if (this.disabled) {
      return;
    }
    this.updatePlayerInZone();
    this.nickText.setPosition(this.x, this.y);
  }
  moveToXY(x: number, y: number) {
    this.targetToMove = new Phaser.Math.Vector2(x, y);
    const direction = new Phaser.Math.Vector2(x - this.x, y - this.y);
    if (this.zone.invert) {
      direction.negate();
    }
    direction.normalize();
    this.setVelocity(
      direction.x * this.moveSpeed,
      direction.y * this.moveSpeed,
    );
    this.flipSpriteByDirection();
    this.anims.play(`${this.spriteKey}_move${this.frameNo}`, true);
  }
  flipSpriteByDirection() {
    if (this.getVelocity().x > 0) {
      this.setFlipX(true);
      return;
    }
    this.setFlipX(false);
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
          this.targetToMove.y,
        ) < 1
      )
    ) {
      return;
    }
    this.stopMove();
  }
  stopMove() {
    this.targetToMove = null;
    this.setVelocity(0);
  }
  playerDead(x: number, y: number) {
    this.disabled = true;
    this.setPosition(x, y);
    this.stopMove();
    this.setTint(0xff0000);

    this.deadTweens = this.scene.tweens.add({
      targets: this,
      angle: 360,
      duration: 1000,
      repeat: -1,
    });
  }
  playerResurrection(x: number, y: number) {
    this.setPosition(x, y);
    this.clearTint();
    this.deadTweens?.stop();
    this.angle = 0;
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
    } else {
      this.stopWhenMouseTarget();
      if (this.zone.nonstop || this.zone.straight || this.zone.invert) {
        this.zone.nonstop = false;
        this.zone.straight = false;
        this.zone.invert = false;
        this.stopMove();
      }
    }
  }
  isPlayerInZone(zone: Phaser.Types.Physics.Matter.MatterBody[]) {
    return this.scene.matter.overlap(this, zone);
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
