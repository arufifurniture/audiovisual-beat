export type VisualType = 'video' | 'image';
export type BlendMode = 'Normal' | 'Screen' | 'Multiply' | 'Add' | 'Overlay';
export type AnchorPosition = 'TL' | 'TC' | 'TR' | 'ML' | 'CTR' | 'MR' | 'BL' | 'BC' | 'BR';
export type VisualizerStyle = 'Silk Pulse' | 'Velvet Rise' | 'Neon Drops' | 'Ember Grid' | 'Obsidian Grid' | 'Spectrum Circle' | 'Linear Wave';
export type ColorMode = 'Solid' | 'Gradient' | 'Rainbow';
export type EffectStyle = 'Debu' | 'Hujan' | 'Salju' | 'Percikan' | 'Bara' | 'Bokeh' | 'Bintang' | 'Garis Neon' | 'Asap' | 'Ledakan Radial';
export type EffectDirection = 'Rand' | 'Rad' | 'Atas' | 'Bwh' | 'Kiri' | 'Knn';
export type EffectShape = 'Bulat' | 'Kotak' | 'Bintang' | 'Garis' | 'Cincin';
export type BeatLevel = 'Nonaktif' | 'Ringan' | 'Sedang' | 'Berat';
export type BeatBand = 'All' | 'Bass' | 'Mid' | 'Treble';

export interface VisualTrack {
  id: string;
  name: string;
  type: VisualType;
  info: string;
  duration: number; // in seconds
  url?: string;
  thumbnailUrl?: string;
  resolution: string;
  fps: number;
  opacity: number; // 0 - 100
  scale: number; // 0.1 - 3.0
  rotation: number; // 0 - 360
  blendMode: BlendMode;
  anchor: AnchorPosition;
  isVisible: boolean;
  isMuted: boolean;
  chromaKey: boolean;
}

export interface AudioTrack {
  id: string;
  name: string;
  info: string;
  duration: number; // in seconds
  sampleRate: string;
  bitrate: string;
  url?: string;
  gainDb: number;
  pan: number; // -100 to 100 (0 = center)
  eqLowDb: number;
  eqMidDb: number;
  eqHighDb: number;
  isMuted: boolean;
  isSolo: boolean;
}

export interface IntroLayer {
  id: string;
  name: string;
  text: string;
  font: string;
  fontSize: number;
  color: string;
  dropShadow: number;
  glow: number;
  stroke: number;
  animation: 'Typewriter' | 'Fade In/Out' | 'Slide Up' | 'Bounce In';
  opacity: number;
  startTime: number;
  duration: number;
  bgDim: number;
  posX: number; // percentage 0 - 100
  posY: number; // percentage 0 - 100
  isVisible: boolean;
}

export interface LogoLayer {
  id: string;
  name: string;
  url?: string;
  scale: number;
  opacity: number;
  isLoop: boolean;
  startTime: number;
  duration: number;
  anchor: AnchorPosition;
  posX: number;
  posY: number;
  isVisible: boolean;
}

export interface VisualizerLayer {
  id: string;
  name: string;
  style: VisualizerStyle;
  sensitivity: number;
  attackMs: number;
  decayMs: number;
  barsCount: number;
  barWidth: number;
  colorMode: ColorMode;
  color1: string;
  color2: string;
  opacity: number;
  glow: number;
  beatPunch: number;
  beatZoom: number;
  mirrorMode: boolean;
  isVisible: boolean;
}

export interface EffectLayer {
  id: string;
  name: string;
  style: EffectStyle;
  direction: EffectDirection;
  speed: number;
  spread: number;
  count: number;
  size: number;
  life: number;
  shape: EffectShape;
  color: string;
  opacity: number;
  glow: number;
  audioTrigger: BeatBand;
  sensitivity: number;
  isVisible: boolean;
}

export interface BeatSyncSettings {
  active: boolean;
  level: BeatLevel;
  band: BeatBand;
  sensitivity: number;
  attackMs: number;
  decayMs: number;
  thresholdDb: number;
  effects: {
    neonRgb: boolean;
    grain: boolean;
    pan: boolean;
    blitz: boolean;
    flash: boolean;
    vignette: boolean;
    dark: boolean;
    blur: boolean;
  };
}

export interface OutputSettings {
  filename: string;
  destination: string;
  resolution: '1280x720' | '1920x1080' | '3840x2160';
  fps: 24 | 30 | 60;
  codec: 'Apple ProRes 422 (Master Quality)' | 'H.264 / MP4 (Hardware Fast)' | 'HEVC / H.265 (Ultra HD)' | 'WebM (Transparent Alpha)';
  quality: 'Standard' | 'High' | 'Maximum';
  hardwareAcceleration: 'VideoToolbox (Apple Silicon)' | 'NVENC (Nvidia)' | 'QSV (Intel)' | 'CPU Software (x264)';
  autoIncrement: boolean;
}

export interface ProjectState {
  projectName: string;
  author: string;
  visualTracks: VisualTrack[];
  audioTracks: AudioTrack[];
  intros: IntroLayer[];
  logos: LogoLayer[];
  visualizers: VisualizerLayer[];
  effects: EffectLayer[];
  beatSync: BeatSyncSettings;
  outputSettings: OutputSettings;
  
  // Playback & Viewport state
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  volume: number;
  isLooping: boolean;
  currentFps: number;
  activeSelectionId: string | null;
  activeSelectionType: 'visual' | 'logo' | 'intro' | 'visualizer' | null;
}
