import * as Phaser from 'phaser';

const MUTE_KEY = 'rocky-world:muted';

/** Remembered mute setting (per browser). Storage can be blocked, so never let it throw. */
export function loadMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}
export function saveMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    /* ignore */
  }
}

/**
 * The "tit tit tit" typing sound. Uses public/assets/sfx/blip.wav when present,
 * otherwise synthesizes a short square-wave beep.
 */
export class Blip {
  private readonly hasFile: boolean;

  constructor(private readonly scene: Phaser.Scene) {
    this.hasFile = scene.cache.audio.exists('blip');
  }

  play(): void {
    const sound = this.scene.sound;
    if (sound.mute) return;
    const detune = Phaser.Math.Between(-120, 120); // a little variation sounds more alive

    if (this.hasFile) {
      sound.play('blip', { volume: 0.5, detune });
      return;
    }
    if (sound instanceof Phaser.Sound.WebAudioSoundManager) this.beep(sound.context, detune);
  }

  private beep(ctx: AudioContext, detune: number): void {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 620;
    osc.detune.value = detune;
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.05);
  }
}
