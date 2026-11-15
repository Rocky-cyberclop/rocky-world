import type * as Phaser from 'phaser';
import { uiRoot } from './overlay';

/** Event the game scene listens for to open the CV viewer. */
export const OPEN_CV_EVENT = 'ui:open-cv';

const ICON =
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/></svg>';

/** Top-right "Open CV" button, left of the mute button. The scene decides whether it can open now. */
export function mountCvButton(game: Phaser.Game): void {
  if (document.querySelector('.cv-icon-btn')) return;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'mute-btn cv-icon-btn';
  btn.innerHTML = ICON;
  btn.setAttribute('aria-label', 'Open CV');
  btn.title = 'Open CV';
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    btn.blur(); // keep keyboard focus on the game
    game.events.emit(OPEN_CV_EVENT);
  });
  uiRoot().append(btn);
}
