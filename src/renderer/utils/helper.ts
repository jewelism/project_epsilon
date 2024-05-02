/* eslint-disable no-use-before-define */
/* eslint-disable no-underscore-dangle */
import { type Player } from '@/objects/Player';

function calculateCentroid(points: { x: number; y: number }[]): {
  x: number;
  y: number;
} {
  const { x, y } = points.reduce(
    (accumulator, point) => ({
      x: accumulator.x + point.x,
      y: accumulator.y + point.y,
    }),
    { x: 0, y: 0 },
  );
  return {
    x: x / points.length,
    y: y / points.length,
  };
}

export const makeZone = (
  scene: Phaser.Scene,
  zonePoints: Phaser.Types.Tilemaps.TiledObject[],
  { color, label }: { color?: number; label?: string } = {},
) => {
  return zonePoints.map(({ x, y, width, height, rectangle, polygon }) => {
    let zone: MatterJS.BodyType;
    const graphics: Phaser.GameObjects.Graphics = color
      ? scene.add.graphics({
          fillStyle: { color, alpha: 1 },
        })
      : null;
    if (rectangle) {
      zone = scene.matter.add.rectangle(
        x - 1 + width / 2,
        y - 1 + height / 2,
        width + 2,
        height + 2,
        { isSensor: true },
      );
      graphics?.fillRect(x - 1, y - 1, width + 2, height + 2);
    } else if (polygon) {
      const vertices = polygon.map((vertex) => ({
        x: Math.floor(vertex.x + x),
        y: Math.floor(vertex.y + y),
      }));
      const centroid = calculateCentroid(vertices);
      zone = scene.matter.add.fromVertices(
        centroid.x,
        centroid.y,
        vertices, // vertices.length 20 넘기면 오류 발생
        { isSensor: true },
        true,
        0.001,
        0.001,
      );
      graphics?.fillPoints(vertices, true);
    }
    if (!scene.game.config.physics.matter.debug) {
      graphics?.destroy();
    }
    zone.label = label;
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

export function createBreakInPlayers(dataPlayer: Player[]) {
  const newPlayers = dataPlayer.filter(
    ({ uuid }) => !this.players.some((p) => p.uuid === uuid),
  );
  if (newPlayers.length > 0) {
    this.players = [
      ...this.players,
      ...newPlayers.map((p) => this.createPlayer(p)),
    ];
  }
}

export const getValueByProperties = (properties: any[], ...names) => {
  const obj: Record<(typeof names)[number], any> = {};
  names.forEach((n) => {
    obj[n] = properties?.find(({ name }) => name === n)?.value;
  });
  return obj;
};

export function createCollisions(
  scene: Phaser.Scene,
  bgLayer: Phaser.Tilemaps.TilemapLayer,
) {
  bgLayer.forEachTile((tile) => {
    makeZone(
      scene,
      (tile.getCollisionGroup() as any)?.objects.map(({ x, y, ...rest }) => ({
        x: tile.pixelX + x,
        y: tile.pixelY + y,
        ...rest,
      })) ?? [],
      { color: 0x050505, label: 'collision' },
    );
  });
}
