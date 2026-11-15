import bookshelfCard from '../../content/cards/bookshelf.json';
import doorCard from '../../content/cards/door.json';
import fireplaceCard from '../../content/cards/fireplace.json';
import globeCard from '../../content/cards/globe.json';
import worldMapCard from '../../content/cards/world-map.json';
import rockyDialog from '../../content/dialogs/rocky.json';
import page from '../../content/pages/about.json';
import { BG_COLOR, CV_URL } from '../config';
import type { DialogData } from '../dialog/DialogRunner';
import { el, renderBlock, type CardBlock, type CardData } from '../ui/cardBlocks';
import './about.css';

/**
 * "Skip the game": the same story as the game, as one plain, responsive, printable page.
 * Everything comes from the same content files as the game (content/pages/about.json picks the order).
 */
const CARDS: Record<string, CardData> = {
  bookshelf: bookshelfCard as CardData,
  'world-map': worldMapCard as CardData,
  globe: globeCard as CardData,
  fireplace: fireplaceCard as CardData,
  door: doorCard as CardData,
};
const dialog = rockyDialog as DialogData;

interface Section {
  title: string;
  /** a question from content/dialogs/rocky.json: its answers become paragraphs (+ its links) */
  dialog?: string;
  /** a card from content/cards/<name>.json */
  card?: string;
}

document.documentElement.style.setProperty('--bg', BG_COLOR);
const base = import.meta.env.BASE_URL;
const root = document.getElementById('about')!;

// ---------- header ----------
const header = el('header', 'about-header');
const hero = el('img', 'about-hero');
hero.src = `${base}og-image.png`;
hero.alt = "Pixel-art office: Rocky sits at his desk, ready for the interview.";
hero.width = 576;
hero.height = 528;

const intro = el('div', 'about-intro');
intro.append(el('h1', 'about-name', page.name), el('p', 'about-role', page.role), el('p', 'about-loc', page.location));
intro.append(el('p', 'about-lead', page.intro));

const actions = el('div', 'about-actions');
const play = el('a', 'about-btn about-btn-primary', page.playLabel);
play.href = base; // the game (index.html)
const cv = el('a', 'about-btn', page.cvLabel);
cv.href = CV_URL;
cv.target = '_blank';
cv.rel = 'noopener';
actions.append(play, cv);
for (const l of contactLinks()) {
  const a = el('a', 'about-btn', l.label);
  a.href = l.url;
  if (!l.url.startsWith('mailto:')) {
    a.target = '_blank';
    a.rel = 'noopener';
  }
  actions.append(a);
}
intro.append(actions);
header.append(hero, intro);
root.append(header);

// ---------- sections ----------
for (const s of page.sections as Section[]) {
  const blocks = sectionBlocks(s);
  if (!blocks) continue;
  const sec = el('section', 'about-section');
  const h = el('h2', 'about-h2', s.title);
  sec.append(h);
  const body = el('div', 'card-body about-body');
  for (const b of blocks) body.append(renderBlock(b));
  sec.append(body);
  root.append(sec);
}

const footer = el('footer', 'about-footer', page.footer);
root.append(footer);

// ---------- helpers ----------
function sectionBlocks(s: Section): CardBlock[] | undefined {
  if (s.card) {
    const card = CARDS[s.card];
    if (!card) return void console.warn(`[About] Unknown card "${s.card}"`);
    return card.blocks;
  }
  if (s.dialog) {
    const q = dialog.questions.find((x) => x.q === s.dialog);
    if (!q) return void console.warn(`[About] Unknown question "${s.dialog}"`);
    const blocks: CardBlock[] = q.a.map((text) => ({ type: 'text' as const, text }));
    if (q.links?.length) blocks.push({ type: 'links', items: q.links });
    return blocks;
  }
  return undefined;
}

/** Email / LinkedIn: every link the dialog offers, once each. */
function contactLinks(): { label: string; url: string }[] {
  const seen = new Set<string>();
  return dialog.questions.flatMap((q) => q.links ?? []).filter((l) => !seen.has(l.url) && seen.add(l.url));
}
