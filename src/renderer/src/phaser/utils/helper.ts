export function makeSafeArea(
  scene: Phaser.Scene,
  safeAreaPoints: Phaser.Types.Tilemaps.TiledObject[],
): Phaser.Geom.Rectangle[] {
  return safeAreaPoints.map(({ x, y, width, height }) => {
    const safeArea = scene.add.rectangle(x - 1, y - 1, width + 2, height + 2).setOrigin(0, 0);
    safeArea.setFillStyle(0x00ff00, 0.5);
    return new Phaser.Geom.Rectangle(safeArea.x, safeArea.y, safeArea.width, safeArea.height);
  });
}

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
