import type * as Phaser from 'phaser';
import { Blip } from '../audio/Blip';
import { ChoiceMenu } from '../ui/ChoiceMenu';
import { SpeechBubble } from '../ui/SpeechBubble';

export interface DialogData {
  speaker: string;
  menuTitle: string;
  greeting: string;
  /** said when coming back to the menu after an answer */
  again: string;
  questions: { q: string; a: string[]; action?: string; links?: { label: string; url: string }[] }[];
  goodbyeOption: string;
  goodbye: string;
  style: { charsPerSecond: number; blipEvery: number; maxWidth: number; fontSize: number };
}

/**
 * Talk to an NPC: greeting → question menu → answer lines (OK = back to menu, Next = next line)
 * → menu again … until "goodbye" or Esc. Resolves with an action to run afterwards (e.g. "cv"), if any.
 */
export class DialogRunner {
  private readonly bubble: SpeechBubble;
  private readonly menu: ChoiceMenu;
  private readonly blip: Blip;
  private letters = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    speaker: Phaser.GameObjects.Sprite,
    private readonly data: DialogData,
  ) {
    this.bubble = new SpeechBubble(scene, speaker);
    this.menu = new ChoiceMenu(scene, data.style.fontSize * 0.9);
    this.blip = new Blip(scene);
  }

  async run(): Promise<string | undefined> {
    const d = this.data;
    const asked = new Set<number>();
    let action: string | undefined;

    await this.type(d.greeting);
    for (;;) {
      const options = [...d.questions.map((q, i) => ({ label: q.q, done: asked.has(i) })), { label: d.goodbyeOption }];
      const pick = await this.menu.open(d.menuTitle, options);
      if (pick === null) break; // Esc: just close

      if (pick === d.questions.length) {
        await this.type(d.goodbye);
        await this.bubble.choose();
        break;
      }

      const q = d.questions[pick];
      asked.add(pick);
      for (let i = 0; i < q.a.length; i++) {
        await this.type(q.a[i]);
        if (q.links && i === q.a.length - 1) this.bubble.addLinks(q.links);
        const choice = await this.bubble.choose();
        if (choice === 'ok') break;
      }
      if (q.action) {
        action = q.action;
        break;
      }
      await this.type(d.again);
    }

    this.menu.close();
    await this.bubble.hide(200);
    return action;
  }

  /** Type a line with blips. Enter / Space / click on the bubble shows the rest at once. */
  private async type(text: string): Promise<void> {
    const s = this.data.style;
    const skip = (e: KeyboardEvent) => {
      if (e.repeat || (e.key !== 'Enter' && e.key !== ' ')) return;
      e.preventDefault();
      this.bubble.finish();
    };
    const click = () => this.bubble.finish();
    window.addEventListener('keydown', skip, true);
    this.bubble.element.addEventListener('click', click);
    try {
      await this.bubble.say(text, {
        charsPerSecond: s.charsPerSecond,
        maxWidth: s.maxWidth,
        fontSize: s.fontSize,
        onChar: (ch) => {
          if (/[\p{L}\p{N}]/u.test(ch) && this.letters++ % Math.max(1, s.blipEvery) === 0) this.blip.play();
        },
      });
    } finally {
      window.removeEventListener('keydown', skip, true);
      this.bubble.element.removeEventListener('click', click);
    }
  }
}
