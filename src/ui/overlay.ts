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

/** true on phones / tablets (set by detectTouch() in main.ts as `body.touch`). */
export const isTouch = (): boolean => document.body.classList.contains('touch');

/**
 * Phone held upright: the room is small at the top of the screen, so the speech bubble docks
 * under it and the question menu becomes a bottom sheet. (Tablets keep the floating bubble.)
 */
export const isDocked = (): boolean =>
  isTouch() && window.innerHeight >= window.innerWidth && window.innerWidth < 600;

/**
 * Turn on touch mode for coarse pointers (phones, tablets), or as soon as the screen is touched.
 * Fires a resize so the game re-fits into its new (portrait) box.
 */
export function detectTouch(): void {
  const on = () => {
    if (isTouch()) return;
    document.body.classList.add('touch');
    window.dispatchEvent(new Event('resize'));
  };
  if (matchMedia('(pointer: coarse)').matches) on();
  window.addEventListener('touchstart', on, { once: true, passive: true });
}
