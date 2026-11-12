import type * as Phaser from 'phaser';
import { saveMuted } from '../audio/Blip';
import { uiRoot } from './overlay';

const ICON_ON =
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
const ICON_OFF =
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m22 9-6 6"/><path d="m16 9 6 6"/></svg>';

/** Top-right sound on/off toggle; the choice is remembered. */
export function mountMuteButton(game: Phaser.Game): void {
  if (document.querySelector('.mute-btn')) return;
  const btn = document.createElement('button');
  btn.className = 'mute-btn';
  const render = () => {
    const muted = game.sound.mute;
    btn.innerHTML = muted ? ICON_OFF : ICON_ON;
    btn.setAttribute('aria-label', muted ? 'Turn sound on' : 'Turn sound off');
    btn.setAttribute('aria-pressed', String(muted));
  };
  btn.addEventListener('click', (e) => {
    e.stopPropagation(); // don't count as "skip intro"
    game.sound.mute = !game.sound.mute;
    saveMuted(game.sound.mute);
    render();
    btn.blur(); // keep keyboard focus on the game so WASD keeps working
  });
  render();
  uiRoot().append(btn);
}
