import './cards.css';

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

/** Build the HTML for one card block. Used by the in-game card overlay and the plain page. */
export function renderBlock(b: CardBlock): HTMLElement {
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

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
