import * as Phaser from 'phaser';
import { loadMuted } from '../audio/Blip';
import { mountCvButton } from '../ui/CvButton';
import { mountMuteButton } from '../ui/MuteButton';
import { mountPlainLink, PLAIN_URL } from '../ui/PlainLink';
import { isTouch, uiRoot } from '../ui/overlay';

/**
 * "Click or press any key to enter". Browsers block sound until the visitor interacts,
 * so this first click/key unlocks audio for the intro's typing sound.
 */
export class StartScene extends Phaser.Scene {
  constructor() {
    super('Start');
  }

  create(): void {
    this.sound.mute = loadMuted();
    mountMuteButton(this.game);
    mountCvButton(this.game);
    mountPlainLink();

    const prompt = document.createElement('div');
    prompt.className = 'start-screen';
    prompt.textContent = isTouch() ? 'Tap to enter' : 'Click or press any key to enter';
    uiRoot().append(prompt);

    // for visitors who'd rather read than play
    const skip = document.createElement('a');
    skip.className = 'skip-link';
    skip.href = PLAIN_URL;
    skip.textContent = 'Skip the game → plain version';
    uiRoot().append(skip);

    let started = false;
    const start = (e: Event) => {
      // clicking the mute button or a link shouldn't start the game
      if (e.target instanceof Element && e.target.closest('.mute-btn, .skip-link, .plain-link')) return;
      // Tab moves focus to the links; it isn't "press any key"
      if (e instanceof KeyboardEvent && (e.key === 'Tab' || e.key === 'Shift')) return;
      if (started) return;
      started = true;
      window.removeEventListener('keydown', start, true);
      window.removeEventListener('pointerdown', start, true);
      prompt.remove();
      skip.remove();
      // make sure the audio context is running (needs this user gesture)
      if (this.sound instanceof Phaser.Sound.WebAudioSoundManager) void this.sound.context.resume();
      this.scene.start('InterviewRoom');
    };
    // listen on the whole page (capture phase) so any click or key works at any moment
    window.addEventListener('pointerdown', start, true);
    window.addEventListener('keydown', start, true);
  }
}
