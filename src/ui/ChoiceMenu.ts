import * as Phaser from 'phaser';
import { canvasBox, uiRoot } from './overlay';

export interface MenuOption {
  label: string;
  /** shown with a tick (e.g. a question already asked) */
  done?: boolean;
}

/**
 * A list of choices in a white box at the right side of the room (the visitor's "question card").
 * Mouse: click. Keyboard: ↑/↓ (or W/S) + Enter/E/Space, 1–9 to pick directly, Esc = close (resolves null).
 */
export class ChoiceMenu {
  private el?: HTMLDivElement;
  private readonly onResize = () => this.layout();

  constructor(private readonly scene: Phaser.Scene, private readonly fontSize: number) {
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.close());
  }

  open(title: string, options: MenuOption[]): Promise<number | null> {
    this.close();
    const el = document.createElement('div');
    el.className = 'choice-menu';
    el.setAttribute('role', 'menu');
    el.setAttribute('aria-label', title);
    const head = document.createElement('div');
    head.className = 'choice-title';
    head.textContent = title;
    el.append(head);

    const buttons = options.map((o, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'choice-btn' + (o.done ? ' done' : '');
      b.setAttribute('role', 'menuitem');
      b.textContent = o.label;
      el.append(b);
      b.addEventListener('mouseenter', () => select(i));
      return b;
    });
    let active = 0;
    const select = (i: number) => {
      active = (i + buttons.length) % buttons.length;
      buttons.forEach((b, j) => b.classList.toggle('active', j === active));
    };
    select(0);

    this.el = el;
    uiRoot().append(el);
    this.layout();
    this.scene.scale.on(Phaser.Scale.Events.RESIZE, this.onResize);

    return new Promise((resolve) => {
      const finish = (v: number | null) => {
        window.removeEventListener('keydown', onKey, true);
        this.close();
        resolve(v);
      };
      const onKey = (e: KeyboardEvent) => {
        if (e.repeat) return;
        const k = e.key;
        const n = Number(k);
        if (k === 'ArrowUp' || k === 'w' || k === 'W') select(active - 1);
        else if (k === 'ArrowDown' || k === 's' || k === 'S') select(active + 1);
        else if (k === 'Enter' || k === ' ' || k === 'e' || k === 'E') finish(active);
        else if (k === 'Escape') finish(null);
        else if (Number.isInteger(n) && n >= 1 && n <= buttons.length) finish(n - 1);
        else return;
        e.preventDefault(); // tell other listeners (interaction prompt) this key is used
      };
      buttons.forEach((b, i) =>
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          finish(i);
        }),
      );
      window.addEventListener('keydown', onKey, true);
      this.cleanup = () => window.removeEventListener('keydown', onKey, true);
    });
  }

  close(): void {
    this.cleanup?.();
    this.cleanup = undefined;
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.onResize);
    this.el?.remove();
    this.el = undefined;
  }

  private cleanup?: () => void;

  /** Right side of the room, vertically around the middle; scales with the canvas. */
  private layout(): void {
    const el = this.el;
    if (!el) return;
    const box = canvasBox(this.scene.game);
    const s = box.scale;
    el.style.fontSize = `${Math.max(13, this.fontSize * s)}px`;
    el.style.padding = `${2.5 * s}px ${3.5 * s}px`;
    el.style.maxWidth = `${Math.min(box.width * 0.6, 78 * s)}px`;
    el.style.right = `${window.innerWidth - (box.left + box.width) + 6 * s}px`;
    el.style.top = `${box.top + 58 * s}px`;
  }
}
