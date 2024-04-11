import { type InGameScene } from '@/scenes/InGameScene';
import { defaultTextStyle } from '@/constants';
import Phaser from 'phaser';

export class Player extends Phaser.Physics.Matter.Sprite {
  moveSpeed = 0.5;
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
    super(scene.matter.world, x, y, spriteKey, frameNo);
    this.uuid = uuid;
    this.nick = nick;
    this.isMyPlayer = isMyPlayer;
    this.frameNo = frameNo;
    this.spriteKey = spriteKey;
    this.inLobby = inLobby;

    this.setSize(this.width - 6, this.height - 8).setAngularVelocity(0);

    this.anims.create({
      key: `${spriteKey}_move${frameNo}`,
      frames: this.anims.generateFrameNames(spriteKey, {
        frames: [frameNo, frameNo + 1],
      }),
      frameRate: this.moveSpeed / 20,
    });

    scene.add.existing(this);
    this.setDepth(9);
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
    // if (invert) {
    //   this.scene.physics.velocityFromRotation(
    //     Phaser.Math.Angle.Between(x, y, this.x, this.y),
    //     this.moveSpeed,
    //     this.body.velocity as Phaser.Math.Vector2,
    //   );
    // } else {
    //   // this.scene.physics.moveToObject(this, this.targetToMove, this.moveSpeed);
    // }
    this.targetToMove = new Phaser.Math.Vector2(x, y);
    // const angle = Phaser.Math.Angle.Between(x, y, this.x, this.y);
    // this.scene.matter.body.setVelocity(this.body as MatterJS.BodyType, {
    //   x: x - this.x,
    //   y: y - this.y,
    // });
    const dx = x - this.x;
    const dy = y - this.y;
    const angle = Math.atan2(dy, dx);
    const speedX = this.moveSpeed * Math.cos(angle);
    const speedY = this.moveSpeed * Math.sin(angle);

    // this.scene.matter.body.setVelocity(this.body as MatterJS.BodyType, {
    //   x: speedX,
    //   y: speedY,
    // });
    this.setVelocity(speedX, speedY);
    // this.setAngle(
    //   Phaser.Math.RadToDeg(Phaser.Math.Angle.Between(x, y, this.x, this.y)),
    // );
    // this.setAngle(angle);
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
  isPlayerInZone(
    zone: (Phaser.GameObjects.Rectangle | Phaser.GameObjects.Polygon)[],
  ) {
    return zone.some((z) => {
      if (z.geom.type === Phaser.Geom.POLYGON) {
        const polygon = new Phaser.Geom.Polygon(
          z.geom.points.map(
            (point) => new Phaser.Geom.Point(point.x + z.x, point.y + z.y),
          ),
        );
        const contain = Phaser.Geom.Polygon.ContainsPoint(
          polygon,
          new Phaser.Geom.Point(this.x, this.y),
        );
        return contain;
      }
      if (z.geom.type === Phaser.Geom.RECTANGLE) {
        return Phaser.Geom.Rectangle.ContainsPoint(
          z.geom as Phaser.Geom.Rectangle,
          new Phaser.Geom.Point(this.x, this.y),
        );
      }
      return false;
    });
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
