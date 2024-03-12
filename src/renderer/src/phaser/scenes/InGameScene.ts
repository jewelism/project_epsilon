import { Player } from '@/phaser/objects/Player';

const GAME = {
  ZOOM: 2,
};
export class InGameScene extends Phaser.Scene {
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  player: Player;
  obstacles: Phaser.Physics.Arcade.Group;

  create() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.obstacles = this.physics.add.group();

    const { map, playerSpawnPoints, obstacleSpawnPoints } = this.createMap(this);

    this.player = new Player(this, {
      x: playerSpawnPoints.x,
      y: playerSpawnPoints.y,
      hp: 1000,
      spriteKey: 'pixel_animals',
      frameNo: 0,
    });
    this.createObstacle(obstacleSpawnPoints);

    this.cameras.main
      .setBounds(0, 0, map.heightInPixels, map.widthInPixels)
      .startFollow(this.player.body, false)
      .setZoom(GAME.ZOOM);

    this.physics.add.overlap(this.obstacles, this.player.body, (player: any) => {
      player.disabled.value = true;
    });
  }
  createMap(scene: Phaser.Scene) {
    const map = scene.make.tilemap({
      key: 'map',
    });
    const bgTiles = map.addTilesetImage('16tiles', '16tiles');
    const bgLayer = map.createLayer('bg', bgTiles);
    map.createLayer('bg_collision', bgTiles).setCollisionByExclusion([-1]);

    map.createLayer('MonsterSpawn', bgTiles);
    const playerSpawnPoints = map.findObject('PlayerSpawn', ({ name }) => {
      return name.includes('PlayerSpawn');
    });
    const obstacleSpawnPoints = map.filterObjects('ObstacleSpawn', ({ name }) => {
      return name.includes('ObstacleSpawn');
    });
    scene.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    return { map, playerSpawnPoints, obstacleSpawnPoints };
  }
  createObstacle(obstacleSpawnPoints: Phaser.Types.Tilemaps.TiledObject[]) {
    // obstacleSpawnPoints.forEach(({ x, y }) => {});
  }

  constructor() {
    super('InGameScene');
  }
  preload() {
    this.load.tilemapTiledJSON('map', 'phaser/tiled/map.json');
    this.load.image('16tiles', 'phaser/tiled/16tiles.png');
    this.load.image('rock', 'phaser/objects/rock31x29.png');

    this.load.spritesheet('tree', 'phaser/objects/tree45x45.png', {
      frameWidth: 45,
      frameHeight: 45,
      startFrame: 0,
    });
    this.load.spritesheet('fire', 'phaser/objects/tree45x45.png', {
      frameWidth: 45,
      frameHeight: 45,
      startFrame: 0,
    });
    this.load.spritesheet('goldMine', 'phaser/objects/Stones_ores_gems_without_grass_x16.png', {
      frameWidth: 16,
      frameHeight: 16,
      startFrame: 23,
    });
    this.load.spritesheet('goldBar', 'phaser/objects/Stones_ores_gems_without_grass_x16.png', {
      frameWidth: 16,
      frameHeight: 16,
      startFrame: 27,
    });
    this.load.spritesheet('pixel_animals', 'phaser/chars/pixel_animals.png', {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.spritesheet('skel', 'phaser/chars/Skel_walk_v2.png', {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.spritesheet('goblin', 'phaser/chars/Goblin_walk_v2.png', {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.spritesheet('beam_green', 'phaser/effect/beams_9x21.png', {
      frameWidth: 9,
      frameHeight: 21,
      startFrame: 0,
    });
  }
}
