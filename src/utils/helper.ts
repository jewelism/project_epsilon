export function makeSafeZone(
  scene: Phaser.Scene,
  safeZonePoints: Phaser.Types.Tilemaps.TiledObject[]
): Phaser.Geom.Rectangle[] {
  return safeZonePoints.map(({ x, y, width, height }) => {
    const safeZone = scene.add
      .rectangle(x - 1, y - 1, width + 2, height + 2)
      .setOrigin(0, 0);
    safeZone.setFillStyle(0x00ff00, 0.5);

    return new Phaser.Geom.Rectangle(
      safeZone.x,
      safeZone.y,
      safeZone.width,
      safeZone.height
    );
  });
}
export function makeNonstopZone(
  scene: Phaser.Scene,
  nonstopZonePoints: Phaser.Types.Tilemaps.TiledObject[]
): Phaser.Geom.Rectangle[] {
  return nonstopZonePoints.map(({ x, y, width, height }) => {
    const nonstopZone = scene.add
      .rectangle(x - 1, y - 1, width + 2, height + 2)
      .setOrigin(0, 0);
    nonstopZone.setFillStyle(0x00ffff, 0.5);

    return new Phaser.Geom.Rectangle(
      nonstopZone.x,
      nonstopZone.y,
      nonstopZone.width,
      nonstopZone.height
    );
  });
}

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
