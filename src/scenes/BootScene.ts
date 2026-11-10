import * as Phaser from 'phaser';
import { ASSETS, TILE } from '../config';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    this.drawLoadingBar();

    this.load.image('interiors', ASSETS.interiors);
    this.load.spritesheet('roomBuilder', ASSETS.roomBuilder, { frameWidth: TILE, frameHeight: TILE });
    this.load.spritesheet('adam_idle', ASSETS.adam_idle, { frameWidth: TILE, frameHeight: TILE * 2 });
    this.load.spritesheet('amelia_idle', ASSETS.amelia_idle, { frameWidth: TILE, frameHeight: TILE * 2 });

    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      console.error(`[Boot] Missing asset: ${file.url} — did you copy the LimeZu files into public/assets/limezu?`);
    });
  }

  create(): void {
    this.scene.start('InterviewRoom');
  }

  private drawLoadingBar(): void {
    const { width, height } = this.scale;
    const box = this.add.rectangle(width / 2, height / 2, 120, 8).setStrokeStyle(1, 0xffffff);
    const bar = this.add.rectangle(width / 2 - 59, height / 2, 0, 6, 0xffffff).setOrigin(0, 0.5);
    this.load.on(Phaser.Loader.Events.PROGRESS, (p: number) => (bar.width = 118 * p));
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      box.destroy();
      bar.destroy();
    });
  }
}
