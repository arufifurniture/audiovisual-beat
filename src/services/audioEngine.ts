import { AudioTrack } from '../types/project';

/**
 * Production-grade Real-Time Web Audio Engine
 * Handles real user audio sequence playback, timeline synchronization,
 * spectral FFT analysis, and dynamic beat detection from actual user files.
 * Zero dummy/mock audio.
 */

export interface AudioAnalysisData {
  frequencies: Uint8Array;
  timeDomain: Uint8Array;
  bass: number;
  mid: number;
  treble: number;
  beatPulse: number;
  isPlaying: boolean;
}

class AudioEngineService {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private masterGain: GainNode | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private audioSourceNode: MediaElementAudioSourceNode | null = null;

  // Track playback state
  private activeTrackId: string | null = null;
  private isPreviewingSingleTrack = false;

  // Analysis buffers
  private freqData = new Uint8Array(256);
  private timeData = new Uint8Array(256);
  private bassEnergy = 0;
  private midEnergy = 0;
  private trebleEnergy = 0;
  private beatPulse = 0;
  private bassHistory = 0.1;

  constructor() {
    // Audio context is lazily initialized upon first user action to comply with browser autoplay policies
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.8;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.8;

      this.audioElement = new Audio();
      this.audioElement.crossOrigin = 'anonymous';
      this.audioElement.preload = 'auto';

      this.audioSourceNode = this.ctx.createMediaElementSource(this.audioElement);
      this.audioSourceNode.connect(this.analyser);
      this.analyser.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
      this.timeData = new Uint8Array(this.analyser.frequencyBinCount);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setVolume(val: number) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, val));
    }
    if (this.audioElement) {
      this.audioElement.volume = Math.max(0, Math.min(1, val));
    }
  }

  /**
   * Synchronize audio sequence playback to the master timeline currentTime
   */
  public syncSequence(currentTime: number, audioTracks: AudioTrack[], isPlaying: boolean) {
    if (this.isPreviewingSingleTrack && !isPlaying) {
      return;
    }
    this.isPreviewingSingleTrack = false;

    const activeTracks = audioTracks.filter((t) => !t.isMuted);
    if (activeTracks.length === 0) {
      if (this.audioElement && !this.audioElement.paused) {
        this.audioElement.pause();
      }
      this.activeTrackId = null;
      return;
    }

    this.initContext();
    if (!this.audioElement) return;

    // Find which track is active at currentTime
    let accumulated = 0;
    let targetTrack: AudioTrack | null = null;
    let localTime = 0;

    for (let i = 0; i < activeTracks.length; i++) {
      const track = activeTracks[i];
      const dur = Math.max(0.1, track.duration || 0);
      if (currentTime >= accumulated && (currentTime < accumulated + dur || i === activeTracks.length - 1)) {
        targetTrack = track;
        localTime = Math.max(0, currentTime - accumulated);
        break;
      }
      accumulated += dur;
    }

    if (!targetTrack || !targetTrack.url) {
      if (!this.audioElement.paused) this.audioElement.pause();
      return;
    }

    // If active track changed, switch source
    if (this.activeTrackId !== targetTrack.id) {
      this.activeTrackId = targetTrack.id;
      this.audioElement.src = targetTrack.url;
      this.audioElement.currentTime = localTime;
      if (isPlaying) {
        this.audioElement.play().catch(() => {});
      } else {
        this.audioElement.pause();
      }
      return;
    }

    // Same track: sync play/pause & drift
    if (isPlaying) {
      if (this.audioElement.paused) {
        this.audioElement.play().catch(() => {});
      }
      if (Math.abs(this.audioElement.currentTime - localTime) > 0.4) {
        this.audioElement.currentTime = localTime;
      }
    } else {
      if (!this.audioElement.paused) {
        this.audioElement.pause();
      }
      if (Math.abs(this.audioElement.currentTime - localTime) > 0.1) {
        this.audioElement.currentTime = localTime;
      }
    }
  }

  /**
   * Seek to a specific timestamp on the project timeline
   */
  public seekTo(seconds: number, audioTracks: AudioTrack[], isPlaying: boolean) {
    this.syncSequence(seconds, audioTracks, isPlaying);
  }

  /**
   * Preview a single track directly from the Audio List
   */
  public playSingleTrack(track: AudioTrack): Promise<void> {
    this.initContext();
    if (!this.audioElement || !track.url) return Promise.resolve();

    this.isPreviewingSingleTrack = true;
    this.activeTrackId = track.id;

    if (this.audioElement.src !== track.url) {
      this.audioElement.src = track.url;
    }
    this.audioElement.currentTime = 0;
    return this.audioElement.play();
  }

  /**
   * Pause any currently running audio playback
   */
  public pausePlayback() {
    if (this.audioElement && !this.audioElement.paused) {
      this.audioElement.pause();
    }
    this.isPreviewingSingleTrack = false;
  }

  /**
   * Cleanup resources for a deleted track
   */
  public disposeTrack(track: AudioTrack) {
    if (this.activeTrackId === track.id) {
      this.pausePlayback();
      this.activeTrackId = null;
      if (this.audioElement) {
        this.audioElement.removeAttribute('src');
        this.audioElement.load();
      }
    }
    if (track.url && track.url.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(track.url);
      } catch (_) {}
    }
  }

  public getActiveTrackId(): string | null {
    return this.activeTrackId;
  }

  public isAudioPlaying(): boolean {
    return this.audioElement ? !this.audioElement.paused : false;
  }

  /**
   * Centralized real-time audio analysis and beat detection from the actual audio source
   */
  public getAudioAnalysis(): AudioAnalysisData {
    const isPlaying = this.isAudioPlaying();

    if (this.analyser && isPlaying) {
      this.analyser.getByteFrequencyData(this.freqData);
      this.analyser.getByteTimeDomainData(this.timeData);

      const len = this.freqData.length;
      const bassCutoff = Math.floor(len * 0.12); // ~0 - 250 Hz
      const midCutoff = Math.floor(len * 0.5);   // ~250 - 2500 Hz

      let bSum = 0;
      let mSum = 0;
      let tSum = 0;

      for (let i = 0; i < len; i++) {
        const val = this.freqData[i] / 255;
        if (i < bassCutoff) {
          bSum += val;
        } else if (i < midCutoff) {
          mSum += val;
        } else {
          tSum += val;
        }
      }

      this.bassEnergy = bSum / (bassCutoff || 1);
      this.midEnergy = mSum / ((midCutoff - bassCutoff) || 1);
      this.trebleEnergy = tSum / ((len - midCutoff) || 1);

      // Real dynamic beat detection based on energy rise
      this.bassHistory = this.bassHistory * 0.94 + this.bassEnergy * 0.06;
      if (this.bassEnergy > this.bassHistory * 1.32 + 0.08 && this.beatPulse < 0.35) {
        this.beatPulse = Math.min(1.0, this.bassEnergy * 1.25);
      }
    } else {
      // Clean silence / zero baseline when audio is not playing
      this.freqData.fill(0);
      this.timeData.fill(128); // 128 is center for 8-bit time-domain PCM
      this.bassEnergy = 0;
      this.midEnergy = 0;
      this.trebleEnergy = 0;
    }

    // Decay beat pulse
    this.beatPulse *= 0.88;

    return {
      frequencies: this.freqData,
      timeDomain: this.timeData,
      bass: this.bassEnergy,
      mid: this.midEnergy,
      treble: this.trebleEnergy,
      beatPulse: this.beatPulse,
      isPlaying,
    };
  }
}

export const audioEngine = new AudioEngineService();
