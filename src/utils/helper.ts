export const makeZone = (
  scene: Phaser.Scene,
  zonePoints: Phaser.Types.Tilemaps.TiledObject[],
  color?: number
) => {
  return zonePoints.map(({ x, y, width, height }) => {
    const zone = scene.add
      .rectangle(x - 1, y - 1, width + 2, height + 2)
      .setOrigin(0, 0);
    if (color) {
      zone.setFillStyle(color, 0.5);
    }
    return new Phaser.Geom.Rectangle(zone.x, zone.y, zone.width, zone.height);
  });
};

export const playMoveAnim = (char, spriteKey: string) => {
  if (char.body.velocity.x < 0) {
    char.anims.play(`${spriteKey}-left`, true);
    char.direction = "left";
  } else if (char.body.velocity.x > 0) {
    char.anims.play(`${spriteKey}-right`, true);
    char.direction = "right";
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
  pointer: Phaser.Input.Pointer
) => {
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
};
