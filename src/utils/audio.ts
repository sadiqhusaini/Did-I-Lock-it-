// High-fidelity Web Audio API synthesizer for tactile mechanical feedback and nagging alarm

class SoundEngine {
  private ctx: AudioContext | null = null;
  private nagIntervalId: number | null = null;

  private getContext(): AudioContext | null {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  // Tactile satisfying deadbolt lock sound: crisp latch click followed by solid mechanical clunk
  playLockSound() {
    triggerHaptic([20, 30]);
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Metallic click
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(800, now);
    osc1.frequency.exponentialRampToValueAtTime(140, now + 0.04);
    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.05);

    // Deep solid bolt slide and latch
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(220, now + 0.04);
    osc2.frequency.exponentialRampToValueAtTime(75, now + 0.14);
    gain2.gain.setValueAtTime(0.5, now + 0.04);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.04);
    osc2.stop(now + 0.16);
  }

  // Soft unlock toggle click
  playUnlockSound() {
    triggerHaptic(12);
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(560, now + 0.06);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Serene harmonic chord for "All clear, safe to leave"
  playAllClearFanfare() {
    triggerHaptic([30, 40, 50, 40, 80]);
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      gain.gain.setValueAtTime(0.18, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.7);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.8);
    });
  }

  // Urgent nagging double-chirp alert when crossing geofence with unlatched items
  playNagChirp() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Beep 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.setValueAtTime(980, now + 0.07);
    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.18);

    // Beep 2
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(880, now + 0.22);
    osc2.frequency.setValueAtTime(1174, now + 0.29);
    gain2.gain.setValueAtTime(0.4, now + 0.22);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.22);
    osc2.stop(now + 0.44);
  }

  // Starts recurring nag alert until stopped
  startNaggingLoop(intervalMs = 4000) {
    this.stopNaggingLoop();
    this.playNagChirp();
    triggerHaptic([100, 50, 100, 50, 200]);
    this.nagIntervalId = window.setInterval(() => {
      this.playNagChirp();
      triggerHaptic([100, 50, 100, 50, 200]);
    }, intervalMs);
  }

  stopNaggingLoop() {
    if (this.nagIntervalId !== null) {
      clearInterval(this.nagIntervalId);
      this.nagIntervalId = null;
    }
  }
}

// Mobile haptic vibration API integration
export const triggerHaptic = (pattern: number | number[] = 15) => {
  try {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // Ignore unsupported devices/permissions
  }
};

export const sound = new SoundEngine();
