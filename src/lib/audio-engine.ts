type GameMode = "neutral" | "estudio" | "busqueda" | "descanso";

interface ModeConfig {
  frequencies: number[];
  gain: number;
  filterFreq: number;
  particleSpeed: number;
  particleDensity: number;
  particleColor: string;
  tint: string;
}

const MODE_CONFIGS: Record<GameMode, ModeConfig> = {
  neutral: {
    frequencies: [60, 120],
    gain: 0.04,
    filterFreq: 200,
    particleSpeed: 0.3,
    particleDensity: 60,
    particleColor: "rgba(251, 191, 36, 0.6)",
    tint: "rgba(251, 191, 36, 0.04)",
  },
  estudio: {
    frequencies: [80, 160],
    gain: 0.03,
    filterFreq: 300,
    particleSpeed: 0.15,
    particleDensity: 30,
    particleColor: "rgba(60, 120, 255, 0.5)",
    tint: "rgba(30, 60, 180, 0.05)",
  },
  busqueda: {
    frequencies: [100, 200],
    gain: 0.05,
    filterFreq: 400,
    particleSpeed: 0.5,
    particleDensity: 80,
    particleColor: "rgba(0, 255, 65, 0.8)",
    tint: "rgba(0, 255, 65, 0.05)",
  },
  descanso: {
    frequencies: [50, 75],
    gain: 0.02,
    filterFreq: 150,
    particleSpeed: 0.1,
    particleDensity: 40,
    particleColor: "rgba(167, 139, 250, 0.5)",
    tint: "rgba(167, 139, 250, 0.05)",
  },
};

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private _muted = false;
  private _volume = 0.5;
  private currentMode: GameMode = "neutral";
  private _initialized = false;

  get initialized() {
    return this._initialized;
  }

  get muted() {
    return this._muted;
  }

  get volume() {
    return this._volume;
  }

  getModeConfig(mode: GameMode) {
    return MODE_CONFIGS[mode];
  }

  async init() {
    if (this._initialized) return;

    try {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this._volume;
      this.masterGain.connect(this.ctx.destination);

      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = "lowpass";
      this.filter.frequency.value = 200;
      this.filter.Q.value = 1;
      this.filter.connect(this.masterGain);

      this.createOscillators();
      this.createNoise();

      this._initialized = true;
    } catch {
      console.warn("Web Audio API no soportado en este navegador");
    }
  }

  private createOscillators() {
    if (!this.ctx || !this.filter) return;

    // Clean up existing
    this.oscillators.forEach((osc) => {
      try { osc.stop(); } catch { /* ignore */ }
    });
    this.oscillators = [];

    const config = MODE_CONFIGS[this.currentMode];

    config.frequencies.forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const oscGain = this.ctx!.createGain();

      osc.type = "sine";
      osc.frequency.value = freq;
      oscGain.gain.value = config.gain;

      osc.connect(oscGain);
      oscGain.connect(this.filter!);
      osc.start();

      this.oscillators.push(osc);
    });
  }

  private createNoise() {
    if (!this.ctx || !this.filter) return;

    // Clean up existing noise
    if (this.noiseSource) {
      try { this.noiseSource.stop(); } catch { /* ignore */ }
    }

    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Brown noise
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.value = 0.01;

    source.connect(this.noiseGain);
    this.noiseGain.connect(this.filter);
    source.start();

    this.noiseSource = source;
  }

  setMode(mode: GameMode) {
    if (!this._initialized || !this.ctx) return;

    const prevMode = this.currentMode;
    this.currentMode = mode;

    const config = MODE_CONFIGS[mode];

    // Update filter frequency with smooth transition
    if (this.filter) {
      this.filter.frequency.linearRampToValueAtTime(
        config.filterFreq,
        this.ctx.currentTime + 1
      );
    }

    // Update oscillator frequencies
    config.frequencies.forEach((freq, i) => {
      if (this.oscillators[i]) {
        this.oscillators[i].frequency.linearRampToValueAtTime(
          freq,
          this.ctx.currentTime + 1
        );
      }
    });

    // Update gain
    if (this.masterGain) {
      this.masterGain.gain.linearRampToValueAtTime(
        this._muted ? 0 : this._volume,
        this.ctx.currentTime + 0.5
      );
    }
  }

  setVolume(vol: number) {
    this._volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && !this._muted) {
      this.masterGain.gain.linearRampToValueAtTime(
        this._volume,
        this.ctx.currentTime + 0.1
      );
    }
  }

  toggleMute() {
    this._muted = !this._muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.linearRampToValueAtTime(
        this._muted ? 0 : this._volume,
        this.ctx.currentTime + 0.3
      );
    }
  }

  setMuted(muted: boolean) {
    this._muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.linearRampToValueAtTime(
        this._muted ? 0 : this._volume,
        this.ctx.currentTime + 0.3
      );
    }
  }

  destroy() {
    this.oscillators.forEach((osc) => {
      try { osc.stop(); } catch { /* ignore */ }
    });
    if (this.noiseSource) {
      try { this.noiseSource.stop(); } catch { /* ignore */ }
    }
    if (this.ctx) {
      this.ctx.close();
    }
    this._initialized = false;
  }
}

// Singleton
let audioEngineInstance: AudioEngine | null = null;

export function getAudioEngine(): AudioEngine {
  if (!audioEngineInstance) {
    audioEngineInstance = new AudioEngine();
  }
  return audioEngineInstance;
}
