import { uiRoot } from './overlay';

/** One piece of a card. A card is a list of these, so one renderer covers every object. */
export type CardBlock =
  | { type: 'text'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'tags'; label: string; items: string[] }
  | { type: 'timeline'; items: { when: string; title: string; org?: string; points?: string[] }[] }
  | { type: 'links'; items: { label: string; url: string }[] };

export interface CardData {
  title: string;
  /** small line under the title, e.g. "Skills & certifications" */
  subtitle?: string;
  blocks: CardBlock[];
}

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

function renderBlock(b: CardBlock): HTMLElement {
  switch (b.type) {
    case 'text':
      return el('p', 'card-text', b.text);
    case 'heading':
      return el('h3', 'card-heading', b.text);
    case 'list': {
      const ul = el('ul', 'card-list');
      for (const item of b.items) ul.append(el('li', '', item));
      return ul;
    }
    case 'tags': {
      const row = el('div', 'card-tags');
      row.append(el('div', 'card-tags-label', b.label));
      const wrap = el('div', 'card-tags-items');
      for (const item of b.items) wrap.append(el('span', 'card-tag', item));
      row.append(wrap);
      return row;
    }
    case 'timeline': {
      const ol = el('ol', 'card-timeline');
      for (const it of b.items) {
        const li = el('li', 'card-tl-item');
        li.append(el('div', 'card-tl-when', it.when));
        li.append(el('div', 'card-tl-title', it.title));
        if (it.org) li.append(el('div', 'card-tl-org', it.org));
        if (it.points?.length) {
          const ul = el('ul', 'card-list');
          for (const p of it.points) ul.append(el('li', '', p));
          li.append(ul);
        }
        ol.append(li);
      }
      return ol;
    }
    case 'links': {
      const row = el('div', 'card-links');
      for (const l of b.items) {
        const a = el('a', 'cv-btn', l.label);
        a.href = l.url;
        if (!l.url.startsWith('mailto:')) {
          a.target = '_blank';
          a.rel = 'noopener';
        }
        a.addEventListener('click', (e) => e.stopPropagation());
        row.append(a);
      }
      return row;
    }
  }
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
