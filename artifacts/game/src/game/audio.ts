// ─── Audio Manager — Web Audio API synthesis (no MP3 files needed) ───────────
// All sounds are synthesized in-browser. Call audio.play('sound_name').
// audio.init() is called on first user gesture to avoid autoplay policy blocks.

class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private gurgleOsc: OscillatorNode | null = null;
  private gurgleGain: GainNode | null = null;
  private gurgleLFO: OscillatorNode | null = null;

  init(): void {
    if (this.ctx) return;
    try {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.55;
      this.masterGain.connect(this.ctx.destination);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.8;
      this.sfxGain.connect(this.masterGain);
    } catch {
      // AudioContext not available (SSR/test env)
    }
  }

  private get c(): AudioContext | null { return this.ctx; }
  private get dest(): AudioNode | null { return this.sfxGain; }

  // ── Trigger a named sound ─────────────────────────────────────────────────

  play(name: SoundName): void {
    this.init();
    if (!this.c || !this.dest) return;
    try {
      switch (name) {
        case 'task_complete':   this._taskComplete(); break;
        case 'meeting_horn':    this._meetingHorn(); break;
        case 'vote_cast':       this._voteCast(); break;
        case 'ejection':        this._ejection(); break;
        case 'body_found':      this._bodyFound(); break;
        case 'ambush':          this._ambush(); break;
        case 'siphon_complete': this._siphonComplete(); break;
        case 'canister_drop':   this._canisterDrop(); break;
        case 'win_owners':      this._winOwners(); break;
        case 'win_slivshchiki': this._winSlivshchiki(); break;
        case 'ui_click':        this._uiClick(); break;
        case 'alarm_button':    this._alarmButton(); break;
      }
    } catch { /* ignore synthesis errors */ }
  }

  // ── Looping gurgle for active siphon ──────────────────────────────────────

  startGurgle(): void {
    this.init();
    if (!this.c || this.gurgleOsc) return;
    try {
      const ctx = this.c;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.value = 90;
      lfo.type = 'sine';
      lfo.frequency.value = 4;
      lfoGain.gain.value = 30;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 600;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.dest!);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.5);

      osc.start();
      lfo.start();

      this.gurgleOsc = osc;
      this.gurgleGain = gain;
      this.gurgleLFO = lfo;
    } catch { /* ignore */ }
  }

  stopGurgle(): void {
    if (!this.c || !this.gurgleGain || !this.gurgleOsc) return;
    try {
      const t = this.c.currentTime;
      this.gurgleGain.gain.linearRampToValueAtTime(0, t + 0.3);
      this.gurgleOsc.stop(t + 0.3);
      this.gurgleLFO?.stop(t + 0.3);
      this.gurgleOsc = null;
      this.gurgleGain = null;
      this.gurgleLFO = null;
    } catch { /* ignore */ }
  }

  // ── Synthesized sounds ────────────────────────────────────────────────────

  private _taskComplete(): void {
    const ctx = this.c!; const dest = this.dest!;
    const t = ctx.currentTime;
    [523, 659, 784].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g); g.connect(dest);
      osc.type = 'sine'; osc.frequency.value = freq;
      g.gain.setValueAtTime(0.25, t + i * 0.09);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.09 + 0.22);
      osc.start(t + i * 0.09); osc.stop(t + i * 0.09 + 0.25);
    });
  }

  private _meetingHorn(): void {
    const ctx = this.c!; const dest = this.dest!;
    const t = ctx.currentTime;
    const freqs = [130, 160, 110];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g); g.connect(dest);
      osc.type = 'sawtooth'; osc.frequency.value = freq;
      const start = t + i * 0.4;
      g.gain.setValueAtTime(0.35, start);
      g.gain.exponentialRampToValueAtTime(0.001, start + 0.38);
      osc.start(start); osc.stop(start + 0.4);
    });
  }

  private _alarmButton(): void {
    const ctx = this.c!; const dest = this.dest!;
    const t = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g); g.connect(dest);
      osc.type = 'square'; osc.frequency.value = i % 2 === 0 ? 880 : 660;
      g.gain.setValueAtTime(0.15, t + i * 0.15);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.15 + 0.13);
      osc.start(t + i * 0.15); osc.stop(t + i * 0.15 + 0.15);
    }
  }

  private _voteCast(): void {
    const ctx = this.c!; const dest = this.dest!;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g); g.connect(dest);
    osc.type = 'sine'; osc.frequency.value = 440;
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.start(t); osc.stop(t + 0.15);
  }

  private _ejection(): void {
    const ctx = this.c!; const dest = this.dest!;
    const t = ctx.currentTime;
    // Sad trombone: B4 → A4 → G4 → F4
    [494, 440, 392, 349].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g); g.connect(dest);
      osc.type = 'sawtooth'; osc.frequency.value = freq;
      const start = t + i * 0.28;
      g.gain.setValueAtTime(0.3, start);
      g.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
      osc.start(start); osc.stop(start + 0.32);
    });
  }

  private _bodyFound(): void {
    const ctx = this.c!; const dest = this.dest!;
    const t = ctx.currentTime;
    [147, 175, 185].forEach(freq => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g); g.connect(dest);
      osc.type = 'sine'; osc.frequency.value = freq;
      g.gain.setValueAtTime(0.2, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
      osc.start(t); osc.stop(t + 0.85);
    });
  }

  private _ambush(): void {
    const ctx = this.c!; const dest = this.dest!;
    const t = ctx.currentTime;
    // Low thud
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g); g.connect(dest);
    osc.type = 'sine'; osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
    g.gain.setValueAtTime(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.start(t); osc.stop(t + 0.25);
    // Noise burst
    const bufSize = ctx.sampleRate * 0.1;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
    const noise = ctx.createBufferSource();
    const ng = ctx.createGain();
    noise.buffer = buf;
    noise.connect(ng); ng.connect(dest);
    ng.gain.setValueAtTime(0.3, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    noise.start(t); noise.stop(t + 0.15);
  }

  private _siphonComplete(): void {
    const ctx = this.c!; const dest = this.dest!;
    const t = ctx.currentTime;
    [400, 500, 650, 800].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g); g.connect(dest);
      osc.type = 'sine'; osc.frequency.value = freq;
      g.gain.setValueAtTime(0.2, t + i * 0.06);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.15);
      osc.start(t + i * 0.06); osc.stop(t + i * 0.06 + 0.18);
    });
  }

  private _canisterDrop(): void {
    const ctx = this.c!; const dest = this.dest!;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g); g.connect(dest);
    osc.type = 'sine'; osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.18);
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.start(t); osc.stop(t + 0.22);
  }

  private _winOwners(): void {
    const ctx = this.c!; const dest = this.dest!;
    const t = ctx.currentTime;
    [523, 659, 784, 1047].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g); g.connect(dest);
      osc.type = 'sine'; osc.frequency.value = freq;
      g.gain.setValueAtTime(0.3, t + i * 0.18);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.18 + 0.35);
      osc.start(t + i * 0.18); osc.stop(t + i * 0.18 + 0.4);
    });
  }

  private _winSlivshchiki(): void {
    const ctx = this.c!; const dest = this.dest!;
    const t = ctx.currentTime;
    [220, 261, 311].forEach(freq => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g); g.connect(dest);
      osc.type = 'sawtooth'; osc.frequency.value = freq;
      g.gain.setValueAtTime(0.2, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
      osc.start(t); osc.stop(t + 1.25);
    });
  }

  private _uiClick(): void {
    const ctx = this.c!; const dest = this.dest!;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g); g.connect(dest);
    osc.type = 'sine'; osc.frequency.value = 600;
    g.gain.setValueAtTime(0.1, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    osc.start(t); osc.stop(t + 0.08);
  }
}

export type SoundName =
  | 'task_complete' | 'meeting_horn' | 'vote_cast' | 'ejection'
  | 'body_found' | 'ambush' | 'siphon_complete' | 'canister_drop'
  | 'win_owners' | 'win_slivshchiki' | 'ui_click' | 'alarm_button';

export const audio = new AudioManager();
