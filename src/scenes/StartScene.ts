import * as Phaser from 'phaser';
import { loadMuted } from '../audio/Blip';
import { mountMuteButton } from '../ui/MuteButton';
import { uiRoot } from '../ui/overlay';

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

    const prompt = document.createElement('div');
    prompt.className = 'start-screen';
    prompt.textContent = 'Click or press any key to enter';
    uiRoot().append(prompt);

    let started = false;
    const start = (e: Event) => {
      // clicking the mute button shouldn't start the game
      if (e.target instanceof Element && e.target.closest('.mute-btn')) return;
      if (started) return;
      started = true;
      window.removeEventListener('keydown', start, true);
      window.removeEventListener('pointerdown', start, true);
      prompt.remove();
      // make sure the audio context is running (needs this user gesture)
      if (this.sound instanceof Phaser.Sound.WebAudioSoundManager) void this.sound.context.resume();
      this.scene.start('InterviewRoom');
    };
    // listen on the whole page (capture phase) so any click or key works at any moment
    window.addEventListener('pointerdown', start, true);
    window.addEventListener('keydown', start, true);
  }
}
