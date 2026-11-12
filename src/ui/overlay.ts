import type * as Phaser from 'phaser';

/** The fixed HTML layer above the canvas (see #ui in index.html). */
export const uiRoot = (): HTMLElement => document.getElementById('ui')!;

/** Where the canvas sits on the page and how much it is scaled up from native pixels. */
export function canvasBox(game: Phaser.Game): { left: number; top: number; width: number; height: number; scale: number } {
  const r = game.canvas.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height, scale: r.width / game.scale.width };
}

/** Convert a point in game (native) pixels to page pixels. */
export function toPage(game: Phaser.Game, x: number, y: number): { x: number; y: number } {
  const b = canvasBox(game);
  return { x: b.left + x * b.scale, y: b.top + y * b.scale };
}
