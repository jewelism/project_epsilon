export class EaseText extends Phaser.GameObjects.Text {
  constructor(
    scene: Phaser.Scene,
    { x, y, text, color }: { x: number; y: number; text: string; color: string },
  ) {
    super(scene, x, y, text, {
      fontSize: '13px',
      fontStyle: 'bold',
      color,
      stroke: '#ffffff',
      strokeThickness: 2,
    });

    scene.add.existing(this);
    this.easeOut();
  }
  easeOut() {
    this.scene.tweens.add({
      targets: this,
      y: this.y - 50,
      alpha: 0,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => {
        this.destroy();
      },
    });
  }
}
