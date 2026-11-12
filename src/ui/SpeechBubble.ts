import * as Phaser from 'phaser';
import { canvasBox, toPage, uiRoot } from './overlay';

export interface BubbleOptions {
  /** letters per second */
  charsPerSecond: number;
  /** max bubble width, in game (native) pixels */
  maxWidth: number;
  /** font size, in game (native) pixels */
  fontSize: number;
  /** called for every letter that appears (used for the blip sound) */
  onChar?: (ch: string, index: number) => void;
}

/**
 * A speech bubble drawn as HTML above the canvas so the text stays crisp.
 * It types its text letter by letter and grows: wider first, then taller as lines wrap.
 */
export class SpeechBubble {
  private readonly el: HTMLDivElement;
  private readonly textEl: HTMLSpanElement;
  private timer?: Phaser.Time.TimerEvent;
  private full = '';
  private shown = 0;
  private done?: () => void;
  private readonly onResize = () => this.layout();

  constructor(
    private readonly scene: Phaser.Scene,
    /** the character this bubble points at */
    private readonly speaker: { x: number; y: number; width: number },
  ) {
    this.el = document.createElement('div');
    this.el.className = 'bubble';
    this.el.setAttribute('role', 'status'); // screen readers announce the line
    this.textEl = document.createElement('span');
    this.el.append(this.textEl);
    uiRoot().append(this.el);

    scene.scale.on(Phaser.Scale.Events.RESIZE, this.onResize);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  /** Types `text`; resolves when every letter is shown (or `finish()` is called). */
  say(text: string, opts: BubbleOptions): Promise<void> {
    this.full = text;
    this.shown = 0;
    this.textEl.textContent = '';
    this.el.style.opacity = '1';
    this.applyScale(opts);

    return new Promise((resolve) => {
      this.done = resolve;
      this.timer = this.scene.time.addEvent({
        delay: 1000 / opts.charsPerSecond,
        repeat: text.length - 1,
        callback: () => {
          const ch = text[this.shown];
          this.shown++;
          this.textEl.textContent = text.slice(0, this.shown);
          this.layout();
          opts.onChar?.(ch, this.shown - 1);
          if (this.shown >= text.length) this.complete();
        },
      });
      this.layout();
    });
  }

  /** Skip: show the whole text at once. */
  finish(): void {
    if (!this.done) return;
    this.shown = this.full.length;
    this.textEl.textContent = this.full;
    this.layout();
    this.complete();
  }

  /**
   * After a line is fully typed: show "OK" (bottom-left) and "Next" (bottom-right).
   * Resolves with the visitor's choice. Keyboard: Enter = Next, Esc = OK.
   */
  choose(): Promise<'ok' | 'next'> {
    const bar = document.createElement('div');
    bar.className = 'bubble-actions';
    const make = (label: string, cls: string) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `bubble-btn ${cls}`;
      b.textContent = label;
      return b;
    };
    const ok = make('OK', 'bubble-ok');
    const next = make('Next', 'bubble-next');
    bar.append(ok, next);
    this.el.append(bar);
    this.layout();

    return new Promise((resolve) => {
      const done = (choice: 'ok' | 'next') => {
        window.removeEventListener('keydown', onKey, true);
        this.endChoice = undefined;
        bar.remove();
        this.layout();
        resolve(choice);
      };
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          done('next');
        } else if (e.key === 'Escape') {
          done('ok');
        }
      };
      const click = (choice: 'ok' | 'next') => (e: MouseEvent) => {
        e.stopPropagation();
        (e.currentTarget as HTMLElement).blur(); // keep WASD going to the game
        done(choice);
      };
      ok.addEventListener('click', click('ok'));
      next.addEventListener('click', click('next'));
      window.addEventListener('keydown', onKey, true);
      this.endChoice = () => window.removeEventListener('keydown', onKey, true);
    });
  }

  /** Fade out, then remove. */
  hide(fadeMs = 400): Promise<void> {
    this.el.style.transition = `opacity ${fadeMs}ms ease`;
    this.el.style.opacity = '0';
    return new Promise((r) => setTimeout(() => (this.destroy(), r()), fadeMs));
  }

  destroy(): void {
    this.timer?.remove();
    this.endChoice?.();
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.onResize);
    this.el.remove();
  }

  // ---------- internals ----------

  private opts?: BubbleOptions;
  private endChoice?: () => void;

  private complete(): void {
    this.timer?.remove();
    const d = this.done;
    this.done = undefined;
    d?.();
  }

  private applyScale(opts: BubbleOptions): void {
    this.opts = opts;
    this.layout();
  }

  /** Size the font for the current canvas scale and keep the bubble above the speaker's head. */
  private layout(): void {
    if (!this.opts) return;
    const game = this.scene.game;
    const box = canvasBox(game);
    const s = box.scale;

    this.el.style.fontSize = `${this.opts.fontSize * s}px`;
    this.el.style.padding = `${2.5 * s}px ${4 * s}px`;
    this.el.style.setProperty('--btn-font', `${Math.max(13, this.opts.fontSize * 0.85 * s)}px`);
    this.el.style.maxWidth = `${this.opts.maxWidth * s}px`;
    this.el.style.visibility = this.shown === 0 ? 'hidden' : 'visible';

    // anchor = just above the top-centre of the speaker's head
    const head = toPage(game, this.speaker.x + this.speaker.width / 2, this.speaker.y + 2);
    const w = this.el.offsetWidth;
    const h = this.el.offsetHeight;
    const tail = 16; // px reserved for the tail

    const minX = box.left + 4;
    const maxX = box.left + box.width - 4 - w;
    const left = Phaser.Math.Clamp(head.x - w / 2, minX, Math.max(minX, maxX));
    const top = Math.max(box.top + 2, head.y - h - tail);

    this.el.style.left = `${left}px`;
    this.el.style.top = `${top}px`;
    // keep the tail pointing at the head even when the bubble is pushed sideways
    this.el.style.setProperty('--tail-x', `${Phaser.Math.Clamp(head.x - left, 18, w - 18)}px`);
  }
}
