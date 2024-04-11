export const makeZone = (
  scene: Phaser.Scene,
  zonePoints: Phaser.Types.Tilemaps.TiledObject[],
  color?: number,
) => {
  return zonePoints.map(({ x, y, width, height, rectangle, polygon }) => {
    let zone: MatterJS.BodyType;
    const graphics: Phaser.GameObjects.Graphics = scene.add.graphics({
      fillStyle: { color },
    });
    if (rectangle) {
      zone = scene.matter.add.rectangle(x - 1, y - 1, width + 2, height + 2, {
        isStatic: true,
      });
      console.log('make zone rect', zone);
      graphics.fillRect(x - 1, y - 1, width + 2, height + 2);
    } else if (polygon) {
      const vertices = polygon.map((vertex) => ({
        x: Math.floor(vertex.x + x),
        y: Math.floor(vertex.y + y),
      }));
      console.log('polygon', polygon, JSON.stringify(vertices));
      zone = scene.matter.add.fromVertices(
        x,
        y,
        [
          { x: 28, y: 22 },
          { x: 28, y: 24 },
          { x: 26, y: 24 },
          { x: 24, y: 27 },
          { x: 23, y: 28 },
          // { x: 23, y: 31 },
          // { x: 25, y: 31 },
          // { x: 25, y: 30 },
          // { x: 25, y: 29 },
          // { x: 25, y: 28 },
          // { x: 26, y: 27 },
          // { x: 27, y: 26 },
          // { x: 29, y: 25 },
          // { x: 31, y: 24 },
          // { x: 31, y: 23 },
        ],
        { isStatic: true },
        false,
        0.01,
        1,
      );
      console.log('make zone poly', zone);

      graphics.fillPoints(vertices, true);
    }
    return zone;
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
