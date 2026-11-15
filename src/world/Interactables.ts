import * as Phaser from 'phaser';
import type { Interaction } from '../content/types';
import { canvasBox, isTouch, toPage, uiRoot } from '../ui/overlay';
import { INTERACT_EVENT } from '../ui/TouchControls';

/**
 * Spots in the room the visitor can use (talk to Rocky, read the CV, ...).
 * When the player's feet are inside a zone, a small "E  Talk" prompt appears above it.
 * E / Enter, a click / tap on the prompt, or the touch "A" button runs the zone's action.
 */
export class Interactables {
  private readonly el: HTMLButtonElement;
  private readonly labelEl: HTMLSpanElement;
  private current?: Interaction;
  private readonly onResize = () => this.place();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly zones: Interaction[],
    /** the player's feet (its physics body) */
    private readonly feet: () => Phaser.Geom.Rectangle,
    /** false while a cutscene, dialog or viewer is open */
    private readonly isEnabled: () => boolean,
    private readonly onInteract: (zone: Interaction) => void,
  ) {
    this.el = document.createElement('button');
    this.el.type = 'button';
    this.el.className = 'interact-prompt';
    const key = document.createElement('span');
    key.className = 'interact-key';
    key.textContent = 'E';
    this.labelEl = document.createElement('span');
    this.el.append(key, this.labelEl);
    this.el.style.display = 'none';
    this.el.addEventListener('click', (e) => {
      e.stopPropagation();
      this.el.blur(); // keep WASD going to the game
      this.trigger();
    });
    uiRoot().append(this.el);

    window.addEventListener('keydown', this.onKey);
    window.addEventListener(INTERACT_EVENT, this.onInteractButton);
    scene.scale.on(Phaser.Scale.Events.RESIZE, this.onResize);
    scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKey);
    window.removeEventListener(INTERACT_EVENT, this.onInteractButton);
    document.body.classList.remove('can-interact');
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.onResize);
    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
    this.el.remove();
  }

  // ---------- internals ----------

  private readonly onKey = (e: KeyboardEvent) => {
    if (e.repeat || e.defaultPrevented) return; // defaultPrevented = a speech bubble already used this Enter
    if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') {
      if (!this.current) return;
      e.preventDefault();
      this.trigger();
    }
  };

  private readonly onInteractButton = () => this.trigger();

  private trigger(): void {
    const zone = this.current;
    if (!zone || !this.isEnabled()) return;
    this.setCurrent(undefined);
    this.onInteract(zone);
  }

  /** Each frame: which zone (if any) are the player's feet in? */
  private update(): void {
    this.setCurrent(this.isEnabled() ? this.pick() : undefined);
  }

  /** Zones the feet overlap; when several overlap, the smallest (most specific) wins. */
  private pick(): Interaction | undefined {
    const f = this.feet();
    let best: Interaction | undefined;
    for (const z of this.zones) {
      const r = new Phaser.Geom.Rectangle(z.x, z.y, z.w, z.h);
      if (!Phaser.Geom.Intersects.RectangleToRectangle(f, r)) continue;
      if (!best || z.w * z.h < best.w * best.h) best = z;
    }
    return best;
  }

  private setCurrent(zone: Interaction | undefined): void {
    if (zone === this.current) return;
    this.current = zone;
    document.body.classList.toggle('can-interact', !!zone); // lights up the touch "A" button
    if (!zone) {
      this.el.style.display = 'none';
      return;
    }
    this.labelEl.textContent = zone.prompt;
    this.el.setAttribute('aria-label', isTouch() ? zone.prompt : `Press E to ${zone.prompt}`);
    this.el.style.display = '';
    this.place();
  }

  /** Keep the prompt centred above its anchor (default: top-centre of the zone). */
  private place(): void {
    const z = this.current;
    if (!z) return;
    const game = this.scene.game;
    const [ax, ay] = z.anchor ?? [z.x + z.w / 2, z.y];
    const p = toPage(game, ax, ay);
    this.el.style.fontSize = `${Math.max(isTouch() ? 16 : 13, 3.6 * canvasBox(game).scale)}px`;
    this.el.style.left = `${p.x}px`;
    this.el.style.top = `${p.y}px`;
  }
}
