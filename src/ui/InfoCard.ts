import { el, renderBlock, type CardData } from './cardBlocks';
import { uiRoot } from './overlay';

export type { CardBlock, CardData } from './cardBlocks';

let openNow: Promise<void> | undefined;

/**
 * Shows an info card (bookshelf, world map, globe, ...) over the dimmed game.
 * Resolves when closed: Close button, Esc, or a click on the dark backdrop.
 */
export function openInfoCard(card: CardData): Promise<void> {
  openNow ??= show(card).finally(() => (openNow = undefined));
  return openNow;
}

function show(card: CardData): Promise<void> {
  const overlay = el('div', 'cv-overlay');
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', card.title);

  const paper = el('div', 'card-paper');

  const bar = el('div', 'cv-bar');
  const head = el('div', 'card-head');
  head.append(el('div', 'cv-title', card.title));
  if (card.subtitle) head.append(el('div', 'card-subtitle', card.subtitle));
  const close = el('button', 'cv-btn cv-close', 'Close');
  close.type = 'button';
  bar.append(head, close);

  const body = el('div', 'card-body');
  for (const block of card.blocks) body.append(renderBlock(block));

  paper.append(bar, body);
  overlay.append(paper);
  uiRoot().append(overlay);
  close.focus();

  return new Promise((resolve) => {
    const done = () => {
      window.removeEventListener('keydown', onKey, true);
      overlay.remove();
      resolve();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        done();
      } else if (e.key === 'Tab') {
        // keep focus inside the card
        const focusables = [...paper.querySelectorAll<HTMLElement>('button, a[href]')];
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    close.addEventListener('click', (e) => (e.stopPropagation(), done()));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) done();
    });
    window.addEventListener('keydown', onKey, true);
  });
}
