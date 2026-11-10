import * as Phaser from 'phaser';
import { ROOM_BUILDER_COLS, TILE } from '../config';
import type { Facing, RoomScene, SceneObject, TileRef } from '../content/types';

const FACING_ORDER: Facing[] = ['right', 'up', 'left', 'down'];
const DEPTH_FLOOR = -10_000;
const DEPTH_WALL = -5_000;

/** First frame index of a direction in a LimeZu 24-frame sheet. */
export const facingStart = (f: Facing) => FACING_ORDER.indexOf(f) * 6;

/** Builds a room (floor, walls, borders, furniture, NPCs) from a RoomScene data file. */
export class RoomRenderer {
  /** invisible static bodies the player collides with */
  readonly solids: Phaser.Physics.Arcade.StaticGroup;

  constructor(private readonly scene: Phaser.Scene, private readonly data: RoomScene) {
    this.solids = scene.physics.add.staticGroup();
  }

  render(): void {
    this.registerSpriteFrames();
    this.registerCharacterAnims();
    this.drawShell();
    this.data.objects.forEach((o) => this.drawObject(o));
  }

  get size(): { width: number; height: number } {
    return { width: this.data.room.tilesWide * TILE, height: this.data.room.tilesHigh * TILE };
  }

  /** Walkable floor area (where a character's feet may go). */
  get floorBounds(): Phaser.Geom.Rectangle {
    const { tilesWide: W, tilesHigh: H, wall } = this.data.room;
    const top = wall.rows.length * TILE;
    return new Phaser.Geom.Rectangle(TILE, top, (W - 2) * TILE, (H - 1) * TILE - top);
  }

  // ---------- setup ----------

  private registerSpriteFrames(): void {
    const tex = this.scene.textures.get('interiors');
    for (const [name, r] of Object.entries(this.data.sprites)) {
      if (!tex.has(name)) tex.add(name, 0, r.x, r.y, r.w, r.h);
    }
  }

  /** For every character: idle-<dir> and walk-<dir> animations (walk reuses idle frames, faster). */
  private registerCharacterAnims(): void {
    for (const [name, def] of Object.entries(this.data.characters)) {
      for (const dir of FACING_ORDER) {
        const start = facingStart(dir);
        const frames = this.scene.anims.generateFrameNumbers(def.sheet, { start, end: start + 5 });
        const make = (key: string, frameRate: number) => {
          if (!this.scene.anims.exists(key)) this.scene.anims.create({ key, frames, frameRate, repeat: -1 });
        };
        make(`${name}-idle-${dir}`, 6);
        make(`${name}-walk-${dir}`, 12);
      }
    }
  }

  // ---------- drawing ----------

  private tile(ref: TileRef, x: number, y: number, depth: number): void {
    const frame = ref[1] * ROOM_BUILDER_COLS + ref[0];
    this.scene.add.image(x * TILE, y * TILE, 'roomBuilder', frame).setOrigin(0).setDepth(depth);
  }

  private drawShell(): void {
    const { tilesWide: W, tilesHigh: H, wall, floor, border } = this.data.room;
    const wallRows = wall.rows.length;
    const F = DEPTH_FLOOR - 1;

    for (let y = wallRows; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        this.tile([floor.col + (x % floor.w), floor.row + (y % floor.h)], x, y, F);
      }
    }
    for (let x = 1; x < W - 1; x++) {
      const col = x === 1 ? wall.cols[0] : x === W - 2 ? wall.cols[2] : wall.cols[1];
      wall.rows.forEach((row, i) => this.tile([col, row], x, i, F));
    }
    this.tile(border.topLeft, 0, 0, F);
    this.tile(border.topRight, W - 1, 0, F);
    for (let y = 1; y < H - 1; y++) {
      this.tile(border.left, 0, y, F);
      this.tile(border.right, W - 1, y, F);
    }
    this.tile(border.bottomLeft, 0, H - 1, F);
    this.tile(border.bottomRight, W - 1, H - 1, F);
    // bottom border sits in front of everything that walks along the bottom edge
    for (let x = 1; x < W - 1; x++) this.tile(border.bottom, x, H - 1, 10_000);
  }

  private drawObject(obj: SceneObject): void {
    let go: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;
    let w: number;
    let h: number;

    if ('character' in obj) {
      const def = this.data.characters[obj.character];
      if (!def) return console.warn(`[Room] Unknown character "${obj.character}"`);
      go = this.scene.add
        .sprite(obj.x, obj.y, def.sheet, facingStart(def.facing))
        .play(`${obj.character}-idle-${def.facing}`);
      w = TILE;
      h = TILE * 2;
    } else {
      const rect = this.data.sprites[obj.sprite];
      if (!rect) return console.warn(`[Room] Unknown sprite "${obj.sprite}"`);
      go = this.scene.add.image(obj.x, obj.y, 'interiors', obj.sprite);
      w = rect.w;
      h = rect.h;
    }
    go.setOrigin(0);

    // front/back order
    if (obj.layer === 'floor') go.setDepth(DEPTH_FLOOR + obj.y);
    else if (obj.layer === 'wall') go.setDepth(DEPTH_WALL + obj.y);
    else go.setDepth(obj.sortY ?? obj.y + h);

    // collision footprint
    const solid = obj.solid ?? !obj.layer;
    if (solid === false) return;
    const [fx, fy, fw, fh] =
      solid === true ? [0, h - Math.min(12, h / 2), w, Math.min(12, h / 2)] : solid;
    const zone = this.scene.add.zone(obj.x + fx, obj.y + fy, fw, fh).setOrigin(0);
    this.solids.add(zone);
  }
}
