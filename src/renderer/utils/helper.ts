export const makeZone = (
  scene: Phaser.Scene,
  zonePoints: Phaser.Types.Tilemaps.TiledObject[],
  color?: number,
): (Phaser.GameObjects.Rectangle | Phaser.GameObjects.Polygon)[] => {
  return zonePoints.map(({ x, y, width, height, rectangle, polygon }) => {
    let zone;
    if (rectangle) {
      zone = scene.add.rectangle(x - 1, y - 1, width + 2, height + 2);
    } else if (polygon) {
      zone = scene.add.polygon(x, y, polygon);
    }
    if (color) {
      zone.setFillStyle(color, 0.5);
    }
    return zone.setOrigin(0, 0);
  });
};

export const playMoveAnim = (char, spriteKey: string) => {
  if (char.body.velocity.x < 0) {
    char.anims.play(`${spriteKey}-left`, true);
    char.direction = 'left';
  } else if (char.body.velocity.x > 0) {
    char.anims.play(`${spriteKey}-right`, true);
    char.direction = 'right';
  }
};

export const createFlashFn = () => {
  return (char, tintColor = 0xff0000) => {
    char.setTint(tintColor);
    char.scene.time.delayedCall(150, () => {
      char.clearTint();
    });
  };
};

export const mouseClickEffect = (
  scene: Phaser.Scene,
  pointer: Phaser.Input.Pointer,
) => {
  const circle = scene.add.circle(pointer.worldX, pointer.worldY, 7, 0x00ffff);
  scene.tweens.add({
    targets: circle,
    scaleX: 0.1,
    scaleY: 0.1,
    alpha: 0,
    duration: 750,
    ease: 'Power2',
    onComplete: () => circle.destroy(),
  });
};

export const moveRandomlyWithinRange = (
  scene: Phaser.Scene,
  targets: Phaser.GameObjects.GameObject,
  x: number,
  width: number,
  y: number,
  height: number,
  duration: number,
) => {
  const newX = Phaser.Math.Between(x, x + width);
  const newY = Phaser.Math.Between(y, y + height);

  const tween = scene.tweens.add({
    targets,
    x: newX,
    y: newY,
    duration,
  });

  tween.on('complete', () => {
    moveRandomlyWithinRange(scene, targets, x, width, y, height, duration);
  });
};
