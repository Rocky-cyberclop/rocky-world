export const TILE = 16;

/** Near-black "game background" used by both the page and the Phaser canvas. */
export const BG_COLOR = '#141219';

/** Texture keys → files under public/assets (LimeZu free pack + our own sounds). */
export const ASSETS = {
  interiors: 'assets/limezu/Interiors_free_16x16.png',
  roomBuilder: 'assets/limezu/Room_Builder_free_16x16.png',
  adam_idle: 'assets/limezu/Adam_idle_anim_16x16.png',
  amelia_idle: 'assets/limezu/Amelia_idle_anim_16x16.png',
  /** optional: made on sfxr.me; if missing, a beep is generated in code */
  blip: 'assets/sfx/blip.wav',
} as const;

/** Columns in Room_Builder_free_16x16.png (272px / 16). */
export const ROOM_BUILDER_COLS = 17;
