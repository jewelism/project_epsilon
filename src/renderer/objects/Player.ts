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
  zone: Record<'safe' | 'nonstop' | 'straight' | 'invert', boolean> = {
    safe: true,
    nonstop: false,
    straight: false,
    invert: false,
  };
  isIgnoreRttCorrection = false;
  inLobby = false;
  nick: string = '';
  nickText: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    { x, y, spriteKey, frameNo, nick, uuid, isMyPlayer, inLobby = false },
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
    this.inLobby = inLobby;

    scene.add.existing(this);
    this.setStatic(false)
      .setAngularVelocity(0)
      .setFixedRotation()
      .setIgnoreGravity(true)
      .setDepth(9);
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
  }
  update(): void {
    this.nickText.setPosition(this.x, this.y);
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
  moveToXY(x: number, y: number) {
    this.targetToMove = new Phaser.Math.Vector2(x, y);
    const angle = Math.atan2(y - this.y, x - this.x);
    const speedX = this.moveSpeed * Math.cos(angle);
    const speedY = this.moveSpeed * Math.sin(angle);
    this.setVelocity(speedX, speedY);
    this.flipSpriteByDirection();
    this.anims.play(`${this.spriteKey}_move${this.frameNo}`, true);
  }
  flipSpriteByDirection() {
    if (this.body.velocity.x > 0) {
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
    this.setVelocity(0, 0);
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
