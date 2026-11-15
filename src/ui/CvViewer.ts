import { CV_URL } from '../config';
import { uiRoot } from './overlay';

let openNow: Promise<void> | undefined;

/**
 * Shows Rocky's CV as a big "paper" over the game: the PDF inline (browser's own viewer) plus
 * Download / Open in new tab / Close. Phones without an inline PDF viewer get the buttons only.
 * Resolves when closed (Close button, Esc, or a click on the dark backdrop).
 */
export function openCvViewer(): Promise<void> {
  openNow ??= show().finally(() => (openNow = undefined));
  return openNow;
}

async function show(): Promise<void> {
  const exists = await fetch(CV_URL, { method: 'HEAD' })
    .then((r) => r.ok && !(r.headers.get('content-type') ?? '').includes('text/html'))
    .catch(() => false);
  const inline = exists && navigator.pdfViewerEnabled !== false && !matchMedia('(pointer: coarse)').matches;

  const overlay = document.createElement('div');
  overlay.className = 'cv-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', "Rocky's CV");

  const paper = document.createElement('div');
  paper.className = 'cv-paper' + (inline ? '' : ' cv-compact');

  const bar = document.createElement('div');
  bar.className = 'cv-bar';
  const title = document.createElement('div');
  title.className = 'cv-title';
  title.textContent = "Rocky's CV";
  const actions = document.createElement('div');
  actions.className = 'cv-actions';
  if (exists) {
    const dl = link('Download PDF', CV_URL);
    dl.download = 'Tran-Anh-Hao-Rocky-CV.pdf';
    const open = link('Open in new tab', CV_URL);
    open.target = '_blank';
    open.rel = 'noopener';
    actions.append(dl, open);
  }
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'cv-btn cv-close';
  close.textContent = 'Close';
  actions.append(close);
  bar.append(title, actions);
  paper.append(bar);

  if (inline) {
    const frame = document.createElement('iframe');
    frame.className = 'cv-frame';
    frame.title = "Rocky's CV (PDF)";
    frame.src = `${CV_URL}#view=FitH`;
    paper.append(frame);
  } else {
    const note = document.createElement('p');
    note.className = 'cv-note';
    note.textContent = exists
      ? 'Tap "Open in new tab" to read the CV, or download it.'
      : 'The CV is being updated. Please check back soon, or ask Rocky how to contact him.';
    paper.append(note);
  }

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
      }
    };
    close.addEventListener('click', (e) => (e.stopPropagation(), done()));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) done(); // click outside the paper
    });
    window.addEventListener('keydown', onKey, true);
  });
}

function link(label: string, href: string): HTMLAnchorElement {
  const a = document.createElement('a');
  a.className = 'cv-btn';
  a.href = href;
  a.textContent = label;
  a.addEventListener('click', (e) => e.stopPropagation());
  return a;
}
