import { useState, useEffect } from 'react';
import { ProjectState, VisualTrack, AudioTrack, IntroLayer, LogoLayer, VisualizerLayer, EffectLayer } from '../types/project';
import { audioEngine } from '../services/audioEngine';

export const initialProjectState: ProjectState = {
  projectName: 'Astra_Spectra_Master',
  author: 'Ridwan Johari',
  visualTracks: [
    {
      id: 'file-2',
      name: 'Cyber_Grid_Texture.png',
      type: 'image',
      info: 'PNG Overlay • Blend: Screen',
      duration: 30,
      resolution: '1920x1080',
      fps: 60,
      opacity: 85,
      scale: 1.0,
      rotation: 0,
      blendMode: 'Screen',
      anchor: 'CTR',
      isVisible: true,
      isMuted: true,
      chromaKey: false,
    },
    {
      id: 'file-3',
      name: 'Neon_Cyber_Core.mov',
      type: 'video',
      info: 'Alpha Channel • Keyed',
      duration: 15,
      resolution: '1920x1080',
      fps: 60,
      opacity: 100,
      scale: 1.0,
      rotation: 0,
      blendMode: 'Add',
      anchor: 'CTR',
      isVisible: true,
      isMuted: true,
      chromaKey: true,
    },
    {
      id: 'file-1',
      name: 'Abstract_Loop_BG.mp4',
      type: 'video',
      info: '1080p • 60fps • 00:24',
      duration: 24,
      resolution: '1920x1080',
      fps: 60,
      opacity: 100,
      scale: 1.0,
      rotation: 0,
      blendMode: 'Normal',
      anchor: 'CTR',
      isVisible: true,
      isMuted: false,
      chromaKey: false,
    },
  ],
  audioTracks: [
    {
      id: 'audio-1',
      name: 'Starlight_Synth_Master.wav',
      info: '03:42 • 48kHz / 24-bit',
      duration: 222,
      sampleRate: '48 kHz',
      bitrate: '24-bit',
      gainDb: 1.2,
      pan: 0,
      eqLowDb: 4,
      eqMidDb: -1,
      eqHighDb: 5,
      isMuted: false,
      isSolo: false,
    },
    {
      id: 'audio-2',
      name: 'Sub_Bass_Drop_808.wav',
      info: '01:15 • 44.1kHz / 24-bit',
      duration: 75,
      sampleRate: '44.1 kHz',
      bitrate: '24-bit',
      gainDb: 0,
      pan: 0,
      eqLowDb: 6,
      eqMidDb: 0,
      eqHighDb: 2,
      isMuted: false,
      isSolo: false,
    },
    {
      id: 'audio-3',
      name: 'Cyber_Atmosphere_Loop.mp3',
      info: '02:20 • 320kbps',
      duration: 140,
      sampleRate: '44.1 kHz',
      bitrate: '320 kbps',
      gainDb: -0.5,
      pan: 0,
      eqLowDb: 0,
      eqMidDb: 2,
      eqHighDb: 3,
      isMuted: false,
      isSolo: false,
    },
  ],
  intros: [
    {
      id: 'intro-1',
      name: 'Intro 1',
      text: 'ASTRA SPECTRA',
      font: 'Inter',
      fontSize: 36,
      color: '#FFFFFF',
      dropShadow: 60,
      glow: 40,
      stroke: 2,
      animation: 'Typewriter',
      opacity: 100,
      startTime: 0,
      duration: 3.2,
      bgDim: 40,
      posX: 50,
      posY: 50,
      isVisible: true,
    },
  ],
  logos: [
    {
      id: 'logo-1',
      name: 'Logo 1',
      scale: 85,
      opacity: 90,
      isLoop: true,
      startTime: 0.5,
      duration: 4.0,
      anchor: 'BR',
      posX: 88,
      posY: 88,
      isVisible: true,
    },
  ],
  visualizers: [
    {
      id: 'viz-layer-1',
      name: 'Visualizer 1',
      style: 'Obsidian Grid',
      sensitivity: 75,
      attackMs: 24,
      decayMs: 160,
      barsCount: 64,
      barWidth: 12,
      colorMode: 'Gradient',
      color1: '#00E5FF',
      color2: '#0058BC',
      opacity: 85,
      glow: 40,
      beatPunch: 15,
      beatZoom: 115,
      mirrorMode: true,
      isVisible: true,
    },
  ],
  effects: [
    {
      id: 'effect-tab-1',
      name: 'Effect 1',
      style: 'Debu',
      direction: 'Rad',
      speed: 24,
      spread: 65,
      count: 850,
      size: 6,
      life: 22,
      shape: 'Bulat',
      color: '#6664E4',
      opacity: 75,
      glow: 55,
      audioTrigger: 'All',
      sensitivity: 80,
      isVisible: true,
    },
    {
      id: 'effect-tab-2',
      name: 'Effect 2',
      style: 'Garis Neon',
      direction: 'Atas',
      speed: 18,
      spread: 40,
      count: 240,
      size: 4,
      life: 18,
      shape: 'Garis',
      color: '#00E5FF',
      opacity: 60,
      glow: 70,
      audioTrigger: 'Bass',
      sensitivity: 90,
      isVisible: true,
    },
  ],
  beatSync: {
    active: true,
    level: 'Sedang',
    band: 'Bass',
    sensitivity: 75,
    attackMs: 25,
    decayMs: 140,
    thresholdDb: -6,
    effects: {
      neonRgb: true,
      grain: true,
      pan: true,
      blitz: true,
      flash: false,
      vignette: false,
      dark: false,
      blur: false,
    },
  },
  outputSettings: {
    filename: 'Astra_Spectra_Master',
    destination: '/Users/ridwan/Movies/AuviBeat_Renders',
    resolution: '1920x1080',
    fps: 60,
    codec: 'Apple ProRes 422 (Master Quality)',
    quality: 'High',
    hardwareAcceleration: 'VideoToolbox (Apple Silicon)',
    autoIncrement: true,
  },
  isPlaying: false,
  currentTime: 78, // 01:18
  totalDuration: 437, // 07:17
  volume: 80,
  isLooping: true,
  currentFps: 60,
  activeSelectionId: null,
  activeSelectionType: null,
};

// Global reactive subscribers
type Listener = (state: ProjectState) => void;
const listeners = new Set<Listener>();
let globalState = { ...initialProjectState };

// History stack for Undo / Redo
const undoStack: ProjectState[] = [];
const redoStack: ProjectState[] = [];

export function getProjectState(): ProjectState {
  return globalState;
}

export function setProjectState(updater: Partial<ProjectState> | ((prev: ProjectState) => Partial<ProjectState>), saveHistory = false) {
  if (saveHistory) {
    undoStack.push(JSON.parse(JSON.stringify(globalState)));
    redoStack.length = 0;
  }

  const updates = typeof updater === 'function' ? updater(globalState) : updater;
  globalState = { ...globalState, ...updates };

  // Recalculate total duration if audio tracks change
  if (updates.audioTracks) {
    globalState.totalDuration = globalState.audioTracks.reduce((sum, t) => sum + (t.duration || 0), 0);
  }

  listeners.forEach((listener) => listener(globalState));
}

export function undo() {
  if (undoStack.length > 0) {
    redoStack.push(JSON.parse(JSON.stringify(globalState)));
    const prev = undoStack.pop()!;
    globalState = prev;
    listeners.forEach((l) => l(globalState));
  }
}

export function redo() {
  if (redoStack.length > 0) {
    undoStack.push(JSON.parse(JSON.stringify(globalState)));
    const next = redoStack.pop()!;
    globalState = next;
    listeners.forEach((l) => l(globalState));
  }
}

export function useProjectStore(): [ProjectState, typeof setProjectState] {
  const [state, setState] = useState<ProjectState>(globalState);

  useEffect(() => {
    const listener: Listener = (newState) => setState(newState);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return [state, setProjectState];
}

// Transport control helpers
export function togglePlayback() {
  const nextPlaying = !globalState.isPlaying;
  setProjectState({ isPlaying: nextPlaying });
  if (nextPlaying) {
    audioEngine.startPlayback();
  } else {
    audioEngine.pausePlayback();
  }
}

export function seekTime(seconds: number) {
  const clamped = Math.max(0, Math.min(globalState.totalDuration, seconds));
  setProjectState({ currentTime: clamped });
}
