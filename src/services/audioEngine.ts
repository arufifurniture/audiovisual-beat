/**
 * Real-time Web Audio Engine with FFT Spectral Analysis and Beat Detector
 */

class AudioEngineService {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private masterGain: GainNode | null = null;
  private synthInterval: number | null = null;
  private isSynthesizing = false;
  private audioElement: HTMLAudioElement | null = null;
  private audioSourceNode: MediaElementAudioSourceNode | null = null;

  // Analysis data caches
  private freqData = new Uint8Array(new ArrayBuffer(256));
  private timeData = new Uint8Array(new ArrayBuffer(256));
  private bassEnergy = 0;
  private midEnergy = 0;
  private trebleEnergy = 0;
  private beatPulse = 0;

  constructor() {
    // Audio context will be lazy-initialized on first user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.82;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.8;

      this.analyser.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.freqData = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));
      this.timeData = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(val: number) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, val));
    }
  }

  public startPlayback(audioUrl?: string) {
    this.initContext();
    if (!this.ctx || !this.analyser) return;

    if (audioUrl) {
      if (!this.audioElement) {
        this.audioElement = new Audio();
        this.audioElement.crossOrigin = 'anonymous';
        this.audioSourceNode = this.ctx.createMediaElementSource(this.audioElement);
        this.audioSourceNode.connect(this.analyser);
      }
      this.audioElement.src = audioUrl;
      this.audioElement.play().catch(() => {
        this.startSyntheticBeat();
      });
    } else {
      this.startSyntheticBeat();
    }
  }

  public pausePlayback() {
    if (this.audioElement) {
      this.audioElement.pause();
    }
    this.stopSyntheticBeat();
  }

  private startSyntheticBeat() {
    if (this.isSynthesizing || !this.ctx || !this.analyser) return;
    this.isSynthesizing = true;

    // 128 BPM synthetic rhythmic engine (Kick, Bass, Synth chords, Hats)
    const bpm = 128;
    const intervalMs = (60 / bpm / 4) * 1000; // 16th notes
    let step = 0;

    this.synthInterval = window.setInterval(() => {
      if (!this.ctx || !this.analyser || this.ctx.state !== 'running') return;
      const now = this.ctx.currentTime;

      // 4-on-the-floor kick
      if (step % 4 === 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(38, now + 0.12);
        gain.gain.setValueAtTime(0.9, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(this.analyser);
        osc.start(now);
        osc.stop(now + 0.22);
        this.beatPulse = 1.0;
      }

      // Snare / Clap on beats 2 & 4 (steps 4 & 12)
      if (step % 8 === 4) {
        const bufferSize = this.ctx.sampleRate * 0.08;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.02));
        }
        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1000;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        whiteNoise.connect(filter);
        filter.connect(gain);
        gain.connect(this.analyser);
        whiteNoise.start(now);
      }

      // Synth Arp Pad note
      if (step % 2 === 0) {
        const notes = [220, 261.63, 293.66, 329.63, 392, 440];
        const freq = notes[Math.floor(Math.random() * notes.length)];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(this.analyser);
        osc.start(now);
        osc.stop(now + 0.35);
      }

      step = (step + 1) % 16;
    }, intervalMs);
  }

  private stopSyntheticBeat() {
    this.isSynthesizing = false;
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }

  public getAudioAnalysis() {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(this.freqData);
      this.analyser.getByteTimeDomainData(this.timeData);

      // Compute multi-band spectral energy
      let bassSum = 0;
      let midSum = 0;
      let trebleSum = 0;

      const len = this.freqData.length;
      const bassCutoff = Math.floor(len * 0.12);
      const midCutoff = Math.floor(len * 0.5);

      for (let i = 0; i < len; i++) {
        const val = this.freqData[i] / 255;
        if (i < bassCutoff) {
          bassSum += val;
        } else if (i < midCutoff) {
          midSum += val;
        } else {
          trebleSum += val;
        }
      }

      this.bassEnergy = bassSum / (bassCutoff || 1);
      this.midEnergy = midSum / ((midCutoff - bassCutoff) || 1);
      this.trebleEnergy = trebleSum / ((len - midCutoff) || 1);
    } else {
      // Fallback ambient motion when paused
      this.bassEnergy = 0.05 + Math.sin(Date.now() * 0.002) * 0.03;
      this.midEnergy = 0.08 + Math.cos(Date.now() * 0.003) * 0.04;
      this.trebleEnergy = 0.04 + Math.sin(Date.now() * 0.005) * 0.02;
    }

    // Beat pulse decay
    this.beatPulse *= 0.88;
    if (this.bassEnergy > 0.65 && this.beatPulse < 0.3) {
      this.beatPulse = Math.min(1.0, this.bassEnergy * 1.2);
    }

    return {
      frequencies: this.freqData,
      timeDomain: this.timeData,
      bass: this.bassEnergy,
      mid: this.midEnergy,
      treble: this.trebleEnergy,
      beatPulse: this.beatPulse,
      isSynthesizing: this.isSynthesizing,
    };
  }
}

export const audioEngine = new AudioEngineService();
