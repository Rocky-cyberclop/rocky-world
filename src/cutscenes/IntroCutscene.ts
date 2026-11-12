import * as Phaser from 'phaser';
import { Blip } from '../audio/Blip';
import { SpeechBubble } from '../ui/SpeechBubble';
import { canvasBox, toPage, uiRoot } from '../ui/overlay';
import type { RoomRenderer } from '../world/RoomRenderer';

export interface IntroData {
  focus: string;
  focusFadeMs: number;
  roomFadeMs: number;
  ease: string;
  speech: {
    speaker: string;
    /** sentences shown one after another (Next button) */
    lines: string[];
    charsPerSecond: number;
    blipEvery: number;
    maxWidth: number;
    fontSize: number;
  };
  hint?: string;
  hintMs?: number;
}

/**
 * Intro: black → Rocky fades in alone → he talks (typewriter + blips) while the room fades in.
 * It cannot be skipped: the player has no control until it resolves.
 */
export class IntroCutscene {
  private bubble?: SpeechBubble;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly room: RoomRenderer,
    private readonly extras: Phaser.GameObjects.Components.Alpha[], // e.g. the player
    private readonly data: IntroData,
  ) {}

  async play(): Promise<void> {
    const focus = this.room.characters.get(this.data.focus);
    const speaker = this.room.characters.get(this.data.speech.speaker) ?? focus;
    const rest = [...this.room.all.filter((o) => o !== focus), ...this.extras];

    // start: everything invisible
    focus?.setAlpha(0);
    rest.forEach((o) => o.setAlpha(0));

    // 1. Rocky alone
    if (focus) await this.fade([focus], this.data.focusFadeMs);

    // 2. speech + room fade, in parallel
    const roomDone = this.fade(rest, this.data.roomFadeMs);
    const speechDone = speaker ? this.speak(speaker) : Promise.resolve();
    await Promise.all([roomDone, speechDone]);

    // safety: whatever happened, end fully visible
    focus?.setAlpha(1);
    rest.forEach((o) => o.setAlpha(1));

    // 3. the bubble stays until the visitor clicks OK / Next (see runDialog), while they can already walk
    this.showHint();
  }

  // ---------- steps ----------

  private fade(targets: Phaser.GameObjects.Components.Alpha[], duration: number): Promise<void> {
    if (targets.length === 0) {
      targets.forEach((t) => t.setAlpha(1));
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets,
        alpha: 1,
        duration,
        ease: this.data.ease,
        onComplete: () => resolve(),
        onStop: () => resolve(),
      });
    });
  }

  /** Types the first line; resolves when it is fully shown. The rest of the dialog continues in the background. */
  private speak(speaker: Phaser.GameObjects.Sprite): Promise<void> {
    const s = this.data.speech;
    const lines = s.lines.filter((l) => l.trim().length > 0);
    if (lines.length === 0) return Promise.resolve();

    const blip = new Blip(this.scene);
    let letters = 0;
    const bubble = new SpeechBubble(this.scene, speaker);
    this.bubble = bubble;
    const type = (text: string) =>
      bubble.say(text, {
        charsPerSecond: s.charsPerSecond,
        maxWidth: s.maxWidth,
        fontSize: s.fontSize,
        onChar: (ch) => {
          if (!/[\p{L}\p{N}]/u.test(ch)) return; // no blip for spaces / punctuation
          if (letters++ % Math.max(1, s.blipEvery) === 0) blip.play();
        },
      });

    const firstLine = type(lines[0]);
    void this.runDialog(bubble, lines, firstLine, type);
    return firstLine;
  }

  /** OK closes the bubble; Next shows the next line, or closes after the last one. */
  private async runDialog(
    bubble: SpeechBubble,
    lines: string[],
    firstLine: Promise<void>,
    type: (text: string) => Promise<void>,
  ): Promise<void> {
    await firstLine;
    for (let i = 0; ; i++) {
      const choice = await bubble.choose();
      const next = lines[i + 1];
      if (choice === 'ok' || next === undefined) break;
      await type(next);
    }
    await bubble.hide();
  }

  private showHint(): void {
    if (!this.data.hint) return;
    const game = this.scene.game;
    const el = document.createElement('div');
    el.className = 'hint';
    el.textContent = this.data.hint;
    el.style.opacity = '0';
    const place = () => {
      const p = toPage(game, game.scale.width / 2, game.scale.height - 14);
      el.style.left = `${p.x}px`;
      el.style.top = `${p.y}px`;
      el.style.fontSize = `${Math.max(14, 4 * canvasBox(game).scale)}px`;
    };
    uiRoot().append(el);
    place();
    requestAnimationFrame(() => (el.style.opacity = '1'));
    this.scene.scale.on(Phaser.Scale.Events.RESIZE, place);
    this.scene.time.delayedCall(this.data.hintMs ?? 3500, () => {
      el.style.opacity = '0';
      setTimeout(() => {
        el.remove();
        this.scene.scale.off(Phaser.Scale.Events.RESIZE, place);
      }, 700);
    });
  }
}
