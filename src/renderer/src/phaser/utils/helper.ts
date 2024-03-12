import { Resource } from '@/phaser/objects/Resource';
import { resourceGapCheck } from '@/phaser/utils';

const getRandomResource = (scene: Phaser.Scene, { x, y }) => {
  const hp = Phaser.Math.RND.pick(Array.from({ length: 10 }, (_, i) => (i + 10) * 100));
  return Phaser.Math.RND.pick([
    () => new Resource(scene, { x, y, name: 'rock', hp }).setScale(0.6),
    () => new Resource(scene, { x, y, name: 'tree', hp }).setScale(0.5),
  ])();
};

export const generateResource = ({
  scene,
  resourceSpawnPoints,
  bgLayer,
  resources,
}: {
  scene: Phaser.Scene;
  resourceSpawnPoints: Phaser.Types.Tilemaps.TiledObject[];
  bgLayer: Phaser.Tilemaps.TilemapLayer;
  resources: Phaser.Physics.Arcade.Group;
}) => {
  resourceSpawnPoints.forEach(({ x, y, width, height }) => {
    const tiles = bgLayer.getTilesWithinWorldXY(x, y, width, height);
    tiles.forEach((tile) => {
      const tileGap = Phaser.Math.RND.pick(
        Array.from({ length: 20 }, (_, i) => tile.width * (i + 5)),
      );
      if (!resourceGapCheck(tile, resources.getChildren(), tileGap)) {
        return;
      }
      const resource = getRandomResource(scene, { x: tile.pixelX, y: tile.pixelY });
      scene.physics.add.existing(resource, true);
      resources.add(resource);
    });
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

export const getUpgradeMax = (id: string): number => {
  const max = {
    attackDamage: 500,
    attackSpeed: 200,
    defence: 1000,
    moveSpeed: 300,
    hp: 10000,
  };
  return max[id];
};

export const updateUpgradeUIText = (
  element: Phaser.GameObjects.DOMElement,
  { spriteKey, shortcutText, desc, tree, rock, gold },
) => {
  element.getChildByID('upgrade-icon').classList.add(spriteKey);
  element.getChildByID('shortcutText').textContent = shortcutText;
  element.getChildByID('desc').textContent = desc;
  element.getChildByID('tree').textContent = String(tree);
  element.getChildByID('rock').textContent = String(rock);
  element.getChildByID('gold').textContent = String(gold);
};

export const getDirectionAngleBySpeed = (xSpeed: number, ySpeed: number) => {
  return Math.atan2(ySpeed, xSpeed) * (180 / Math.PI);
};

export const createThrottleFn = () => {
  let canPress = true;
  return (scene: Phaser.Scene, callback, delay: number) => {
    if (!canPress) {
      return;
    }
    callback();
    canPress = false;
    scene.time.delayedCall(delay, () => {
      canPress = true;
    });
  };
};

export const createFlashFn = () => {
  return (char, tintColor = 0xff0000) => {
    char.setTint(tintColor);
    char.scene.time.delayedCall(150, () => {
      char.clearTint();
    });
  };
};
