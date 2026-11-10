export const TILE = 16;

/** Texture keys → files under public/assets/limezu (copied from the LimeZu free pack). */
export const ASSETS = {
  interiors: 'assets/limezu/Interiors_free_16x16.png',
  roomBuilder: 'assets/limezu/Room_Builder_free_16x16.png',
  adam_idle: 'assets/limezu/Adam_idle_anim_16x16.png',
  amelia_idle: 'assets/limezu/Amelia_idle_anim_16x16.png',
} as const;

/** Columns in Room_Builder_free_16x16.png (272px / 16). */
export const ROOM_BUILDER_COLS = 17;
