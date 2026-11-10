import * as Phaser from 'phaser';
import { TILE } from '../config';
import type { CharacterDef, Facing } from '../content/types';
import { facingStart } from '../world/RoomRenderer';

const SPEED = 60; // px per second (native resolution)
type Dir = 'up' | 'down' | 'left' | 'right';

/** The character the visitor controls with WASD / arrow keys. */
export class Player extends Phaser.Physics.Arcade.Sprite {
  private facing: Facing;
  private keys: Record<Dir, Phaser.Input.Keyboard.Key[]>;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly charName: string,
    def: CharacterDef,
  ) {
    super(scene, x, y, def.sheet, facingStart(def.facing));
    this.facing = def.facing;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0);

    // collide with the feet only, so the head can overlap furniture "behind" it
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(10, 6).setOffset(3, TILE * 2 - 6);

    const kb = scene.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = {
      up: [kb.addKey(K.W), kb.addKey(K.UP)],
      down: [kb.addKey(K.S), kb.addKey(K.DOWN)],
      left: [kb.addKey(K.A), kb.addKey(K.LEFT)],
      right: [kb.addKey(K.D), kb.addKey(K.RIGHT)],
    };

    this.play(`${charName}-idle-${this.facing}`);
  }

  /** Keep the walkable area: feet must stay inside `bounds`. */
  clampTo(bounds: Phaser.Geom.Rectangle): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setBoundsRectangle(bounds);
    body.setCollideWorldBounds(true);
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);

    const down = (d: Dir) => this.keys[d].some((k) => k.isDown);
    const vx = (down('right') ? 1 : 0) - (down('left') ? 1 : 0);
    const vy = (down('down') ? 1 : 0) - (down('up') ? 1 : 0);

    const v = new Phaser.Math.Vector2(vx, vy).normalize().scale(SPEED);
    this.setVelocity(v.x, v.y);

    if (vx !== 0 || vy !== 0) {
      // horizontal wins on diagonals, like most top-down games
      this.facing = vx > 0 ? 'right' : vx < 0 ? 'left' : vy < 0 ? 'up' : 'down';
      this.play(`${this.charName}-walk-${this.facing}`, true);
    } else {
      this.play(`${this.charName}-idle-${this.facing}`, true);
    }

    // y-sort: things lower on screen are drawn in front
    this.setDepth(this.y + TILE * 2);
  }
}
