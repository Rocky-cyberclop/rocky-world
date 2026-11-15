import { uiRoot } from './overlay';

/** URL of the plain "skip the game" page. Relative, so it works on GitHub Pages too. */
export const PLAIN_URL = `${import.meta.env.BASE_URL}about.html`;

/** Top-left "Plain version" link, always available in the game. */
export function mountPlainLink(): void {
  if (document.querySelector('.plain-link')) return;
  const a = document.createElement('a');
  a.className = 'plain-link';
  a.href = PLAIN_URL;
  a.textContent = 'Plain version';
  a.title = 'Read the portfolio as a normal page';
  // don't let this click/key count as "start the game" or reach the game
  a.addEventListener('pointerdown', (e) => e.stopPropagation());
  a.addEventListener('keydown', (e) => e.stopPropagation());
  uiRoot().append(a);
}
