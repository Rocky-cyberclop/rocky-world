// Shapes of the scene data files in /content/scenes.
// Keeping layout as data means rebuilding the engine later never loses the room design.

export type TileRef = [col: number, row: number];
export type Facing = 'right' | 'up' | 'left' | 'down';

export interface SpriteRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CharacterDef {
  /** texture key of a LimeZu idle sheet (24 frames of 16x32: right, up, left, down × 6) */
  sheet: string;
  /** which way the character faces when standing still */
  facing: Facing;
}

interface PlacedBase {
  x: number;
  y: number;
  /** floor = always under everything (rugs); wall = hung on the back wall. Default: y-sorted. */
  layer?: 'floor' | 'wall';
  /** override the y used for front/back sorting (default: bottom edge of the sprite) */
  sortY?: number;
  /**
   * Blocks the player? Default: true for y-sorted objects (footprint = bottom strip), false for floor/wall.
   * Or give an exact footprint [x, y, w, h] relative to the object's top-left.
   */
  solid?: boolean | [x: number, y: number, w: number, h: number];
}

export type SceneObject = (PlacedBase & { sprite: string }) | (PlacedBase & { character: string });

export interface RoomScene {
  name: string;
  room: {
    tilesWide: number;
    tilesHigh: number;
    wall: { rows: number[]; cols: [left: number, middle: number, right: number] };
    floor: { col: number; row: number; w: number; h: number };
    border: {
      topLeft: TileRef;
      topRight: TileRef;
      left: TileRef;
      right: TileRef;
      bottomLeft: TileRef;
      bottom: TileRef;
      bottomRight: TileRef;
    };
  };
  sprites: Record<string, SpriteRect>;
  characters: Record<string, CharacterDef>;
  /** the character the visitor controls, and where it starts (top-left of its 16x32 sprite) */
  player: { character: string; x: number; y: number };
  objects: SceneObject[];
}
