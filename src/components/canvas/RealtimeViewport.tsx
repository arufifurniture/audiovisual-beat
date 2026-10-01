import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useProjectStore, togglePlayback, seekTime } from '../../state/projectStore';
import { audioEngine } from '../../services/audioEngine';
import { mediaAssetService } from '../../services/mediaAssetService';
import { VisualSequenceEngine } from '../../services/visualSequenceEngine';
import { VisualTrack } from '../../types/project';
import { Maximize2, Download, Play, Pause, SkipBack, SkipForward, Repeat, Volume2 } from 'lucide-react';

interface RealtimeViewportProps {
  onOpenExport: () => void;
  onOpenFullscreen: () => void;
}

export const RealtimeViewport: React.FC<RealtimeViewportProps> = ({
  onOpenExport,
  onOpenFullscreen,
}) => {
  const [project, setProject] = useProjectStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [fps, setFps] = useState<number>(60);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [isDraggingIntro, setIsDraggingIntro] = useState(false);
  const dragStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Format seconds to MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Keep a stable ref to project state for the animation loop
  const projectRef = useRef(project);
  projectRef.current = project;

  // Particles state for canvas
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; size: number; alpha: number; life: number }>>([]);

  // Initialize deterministic particles
  useEffect(() => {
    const count = project.effects[0]?.count ? Math.min(project.effects[0].count, 180) : 100;
    const particles = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.002,
        vy: -0.001 - Math.random() * 0.002,
        size: 1.5 + Math.random() * 3,
        alpha: 0.2 + Math.random() * 0.7,
        life: Math.random(),
      });
    }
    particlesRef.current = particles;
  }, [project.effects]);

  // High performance single-frame draw routine
  const drawFrame = useCallback((now: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentProject = projectRef.current;
    const isPlaying = currentProject.isPlaying;
    const audioData = isPlaying ? audioEngine.getAudioAnalysis() : { frequencies: new Uint8Array(256), beatPulse: 0 };
    const { frequencies, beatPulse } = audioData;

    const w = canvas.width;
    const h = canvas.height;

    // Base background with deep radial glow
    const grad = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w * 0.6);
    const beatColorBoost = isPlaying && currentProject.beatSync.active ? beatPulse * 0.35 : 0;
    grad.addColorStop(0, `rgba(0, 88, 188, ${0.45 + beatColorBoost})`);
    grad.addColorStop(0.5, 'rgba(15, 23, 42, 0.95)');
    grad.addColorStop(1, '#05070D');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle background grid batched in one stroke
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const gridSize = 24;
    ctx.beginPath();
    for (let x = 0; x < w; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();

    // 0. REAL VISUAL MEDIA ASSET LAYER (Render original image or video from project data via VisualSequenceEngine)
    const activeFrame = VisualSequenceEngine.getActiveFrame(
      currentProject.visualTracks,
      currentProject.currentTime,
      currentProject.activeSelectionType === 'visual' ? currentProject.activeSelectionId : null
    );
    const activeTrack = activeFrame?.track || null;
    const trackLocalTime = activeFrame?.localTime || 0;
    const visibleTracks = currentProject.visualTracks.filter((t) => t.isVisible);

    if (activeTrack && activeTrack.url) {
      ctx.save();

      // Blend Mode
      if (activeTrack.blendMode === 'Screen') ctx.globalCompositeOperation = 'screen';
      else if (activeTrack.blendMode === 'Multiply') ctx.globalCompositeOperation = 'multiply';
      else if (activeTrack.blendMode === 'Add') ctx.globalCompositeOperation = 'lighter';
      else if (activeTrack.blendMode === 'Overlay') ctx.globalCompositeOperation = 'overlay';
      else ctx.globalCompositeOperation = 'source-over';

      // Opacity
      ctx.globalAlpha = Math.max(0, Math.min(1, activeTrack.opacity / 100));

      // Transform (Scale & Rotation)
      if (activeTrack.scale !== 1.0 || activeTrack.rotation !== 0) {
        ctx.translate(w / 2, h / 2);
        if (activeTrack.rotation !== 0) {
          ctx.rotate((activeTrack.rotation * Math.PI) / 180);
        }
        if (activeTrack.scale !== 1.0) {
          ctx.scale(activeTrack.scale, activeTrack.scale);
        }
        ctx.translate(-w / 2, -h / 2);
      }

      if (activeTrack.type === 'image') {
        const img = mediaAssetService.getImageElement(activeTrack.url);
        if (img.complete && img.naturalWidth > 0) {
          const imgAspect = img.naturalWidth / img.naturalHeight;
          const canvasAspect = w / h;
          let dw = w;
          let dh = h;
          let dx = 0;
          let dy = 0;
          if (imgAspect > canvasAspect) {
            dw = h * imgAspect;
            dx = (w - dw) / 2;
          } else {
            dh = w / imgAspect;
            dy = (h - dh) / 2;
          }
          ctx.drawImage(img, dx, dy, dw, dh);
        }
      } else if (activeTrack.type === 'video') {
        const video = mediaAssetService.getVideoElement(activeTrack.url);

        // Synchronize native video playback
        if (isPlaying) {
          if (video.paused) {
            video.play().catch(() => {});
          }
        } else {
          if (!video.paused) {
            video.pause();
          }
          if (video.duration && Math.abs(video.currentTime - (trackLocalTime % video.duration)) > 0.4) {
            video.currentTime = trackLocalTime % video.duration;
          }
        }

        if (video.readyState >= 2) {
          const vidAspect = (video.videoWidth || 16) / (video.videoHeight || 9);
          const canvasAspect = w / h;
          let dw = w;
          let dh = h;
          let dx = 0;
          let dy = 0;
          if (vidAspect > canvasAspect) {
            dw = h * vidAspect;
            dx = (w - dw) / 2;
          } else {
            dh = w / vidAspect;
            dy = (h - dh) / 2;
          }
          ctx.drawImage(video, dx, dy, dw, dh);
        }
      }

      ctx.restore();

      // Pause any other inactive videos to save CPU & GPU
      visibleTracks.forEach((t) => {
        if (t.type === 'video' && t.url && t.id !== activeTrack?.id) {
          const otherVid = mediaAssetService.getVideoElement(t.url);
          if (!otherVid.paused) {
            otherVid.pause();
          }
        }
      });
    } else if (visibleTracks.length === 0) {
      // Clean Standby Indicator when no visual asset is loaded
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.font = `600 11px 'JetBrains Mono', monospace`;
      ctx.textAlign = 'center';
      if (currentProject.audioTracks.length > 0) {
        ctx.fillText('AUDIO AKTIF • BELUM ADA VISUAL BACKGROUND', w / 2, h / 2 - 40);
        ctx.font = `400 9.5px 'Inter', sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.fillText('Upload file MP4/MOV/PNG/JPG di panel Visual untuk melengkapi komposisi', w / 2, h / 2 - 24);
      } else {
        ctx.fillText('STUDIO STANDBY • BELUM ADA MEDIA USER', w / 2, h / 2 - 40);
        ctx.font = `400 9.5px 'Inter', sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.fillText('Import file Audio (MP3/WAV) dan Visual (MP4/PNG) untuk memulai', w / 2, h / 2 - 24);
      }
      ctx.restore();
    }

    // Camera Beat-Punch / Zoom
    const vizSettings = currentProject.visualizers[0];
    const zoomMultiplier = isPlaying && currentProject.beatSync.active && vizSettings ? 1 + (beatPulse * (vizSettings.beatPunch / 100) * 0.08) : 1;
    ctx.save();
    if (zoomMultiplier !== 1) {
      ctx.translate(w / 2, h / 2);
      ctx.scale(zoomMultiplier, zoomMultiplier);
      ctx.translate(-w / 2, -h / 2);
    }

    // 1. Render Cinematic Particle Layer
    const activeEffect = currentProject.effects.find((e) => e.isVisible) || currentProject.effects[0];
    if (activeEffect) {
      ctx.fillStyle = activeEffect.color || '#6664E4';
      const pSpeed = (activeEffect.speed / 10) * 0.001;
      const particles = particlesRef.current;

      ctx.beginPath();
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (isPlaying) {
          p.y += p.vy * (1 + pSpeed * 5);
          p.x += p.vx;
          if (p.y < 0) p.y = 1;
          if (p.x < 0) p.x = 1;
          if (p.x > 1) p.x = 0;
        }
        ctx.rect(p.x * w, p.y * h, p.size, p.size);
      }
      ctx.globalAlpha = (activeEffect.opacity / 100) * 0.65;
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    // 2. Central Audio Reactive Core
    const coreX = w / 2;
    const coreY = h / 2 - 25;
    const coreRadius = 55 + (isPlaying ? beatPulse * 15 : 0);

    // Outer glow ring
    ctx.strokeStyle = `rgba(0, 88, 188, ${0.4 + (isPlaying ? beatPulse * 0.5 : 0)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(coreX, coreY, coreRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Spinning dashed orbit ring
    ctx.strokeStyle = 'rgba(102, 100, 228, 0.55)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    const rot = isPlaying ? (now * 0.0008) % (Math.PI * 2) : 0;
    ctx.arc(coreX, coreY, coreRadius - 10, rot, rot + Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Inner central sphere
    const sphereGrad = ctx.createLinearGradient(coreX - 25, coreY - 25, coreX + 25, coreY + 25);
    sphereGrad.addColorStop(0, '#0058bc');
    sphereGrad.addColorStop(1, '#4c4aca');
    ctx.fillStyle = sphereGrad;
    ctx.beginPath();
    ctx.arc(coreX, coreY, 28, 0, Math.PI * 2);
    ctx.fill();

    // Sound wave icon in sphere
    ctx.fillStyle = '#FFFFFF';
    for (let bar = -2; bar <= 2; bar++) {
      const bh = (10 + Math.abs(bar) * -2) * (1 + (frequencies[Math.abs(bar) * 6] / 255) * 1.5);
      ctx.fillRect(coreX + bar * 5 - 1.5, coreY - bh / 2, 3, bh);
    }

    // 3. Main Kinetic Typography (Intro Overlay)
    const activeIntro = currentProject.intros.find((i) => i.isVisible) || currentProject.intros[0];
    if (activeIntro && activeIntro.text) {
      ctx.save();
      const introX = (w * activeIntro.posX) / 100;
      const introY = (h * activeIntro.posY) / 100 + 40;

      ctx.textAlign = 'center';
      ctx.fillStyle = activeIntro.color || '#FFFFFF';
      ctx.font = `700 ${activeIntro.fontSize * 0.55}px 'Inter', sans-serif`;
      ctx.fillText(activeIntro.text.toUpperCase(), introX, introY);

      // Subtitle
      ctx.font = `500 10px 'JetBrains Mono', monospace`;
      ctx.fillStyle = '#ADC6FF';
      ctx.fillText('AUDIO VISUALIZER ENGINE 4.2', introX, introY + 16);

      // Bounding box if selected
      if (currentProject.activeSelectionType === 'intro') {
        ctx.strokeStyle = '#007AFF';
        ctx.lineWidth = 1;
        ctx.strokeRect(introX - 120, introY - 25, 240, 50);
      }
      ctx.restore();
    }

    // 4. Equalizer Bars Spectrum Visualizer (Ultra-fast batch fill)
    if (vizSettings && vizSettings.isVisible) {
      const bars = Math.min(vizSettings.barsCount, 64);
      const barSpacing = 4;
      const totalWidth = w - 80;
      const singleBarW = Math.max(2, (totalWidth - (bars - 1) * barSpacing) / bars);
      const bottomY = h - 18;
      const maxH = 65;

      ctx.fillStyle = vizSettings.color1 || '#00e5ff';
      for (let i = 0; i < bars; i++) {
        const freqIdx = Math.floor((i / bars) * (frequencies.length * 0.6));
        const val = isPlaying ? frequencies[freqIdx] / 255 : (Math.sin(i * 0.35) * 0.12 + 0.18);
        const barH = Math.max(4, val * maxH * (vizSettings.sensitivity / 50));
        const bx = 40 + i * (singleBarW + barSpacing);

        ctx.fillRect(bx, bottomY - barH, singleBarW, barH);
      }
    }

    // 5. Logo / Watermark Layer
    const activeLogo = currentProject.logos.find((l) => l.isVisible) || currentProject.logos[0];
    if (activeLogo) {
      ctx.save();
      const lx = (w * activeLogo.posX) / 100;
      const ly = (h * activeLogo.posY) / 100;
      const lScale = (activeLogo.scale / 100) * 28;

      ctx.globalAlpha = activeLogo.opacity / 100;
      ctx.fillStyle = '#0058bc';
      ctx.beginPath();
      ctx.arc(lx, ly, lScale, 0, Math.PI * 2);
      ctx.fill();

      // Watermark symbol
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `700 ${lScale}px 'Inter', sans-serif`;
      ctx.fillText('AV', lx, ly);

      if (currentProject.activeSelectionType === 'logo') {
        ctx.strokeStyle = '#007AFF';
        ctx.lineWidth = 1;
        ctx.strokeRect(lx - lScale - 4, ly - lScale - 4, (lScale + 4) * 2, (lScale + 4) * 2);
      }
      ctx.restore();
    }

    // 6. Beat Reactive Post-Processing Effects
    if (isPlaying && currentProject.beatSync.active) {
      if (currentProject.beatSync.effects.blitz && beatPulse > 0.75) {
        ctx.fillStyle = `rgba(255, 255, 255, ${(beatPulse - 0.75) * 0.4})`;
        ctx.fillRect(0, 0, w, h);
      }

      if (currentProject.beatSync.effects.vignette) {
        const vigGrad = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.7);
        vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
        vigGrad.addColorStop(1, 'rgba(0,0,0,0.65)');
        ctx.fillStyle = vigGrad;
        ctx.fillRect(0, 0, w, h);
      }
    }

    ctx.restore();
  }, []);

  // Static draw when project state changes or when paused
  useEffect(() => {
    drawFrame(performance.now());
  }, [project, drawFrame]);

  // Pause all cached video elements and audio when project is not playing
  useEffect(() => {
    if (!project.isPlaying) {
      audioEngine.pausePlayback();
      project.visualTracks.forEach((t) => {
        if (t.type === 'video' && t.url) {
          const v = mediaAssetService.getVideoElement(t.url);
          if (!v.paused) v.pause();
        }
      });
    }
  }, [project.isPlaying, project.visualTracks]);

  // Continuous animation loop only active when playing
  useEffect(() => {
    if (!project.isPlaying) return;

    let animId: number;
    let lastFpsTime = performance.now();
    let frameCount = 0;
    let lastTickTime = performance.now();
    let localCurrentTime = projectRef.current.currentTime;
    let lastStoreSync = performance.now();

    const renderLoop = (now: number) => {
      frameCount++;
      if (now - lastFpsTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastFpsTime)));
        frameCount = 0;
        lastFpsTime = now;
      }

      // Progress timeline in real-time
      const deltaSec = (now - lastTickTime) / 1000;
      lastTickTime = now;
      localCurrentTime += deltaSec;

      const totalDur = projectRef.current.totalDuration;
      if (totalDur > 0 && localCurrentTime >= totalDur) {
        if (projectRef.current.isLooping) {
          localCurrentTime = 0;
        } else {
          localCurrentTime = totalDur;
          togglePlayback();
          return;
        }
      }

      // Synchronize audio playback & sequence tracking
      audioEngine.syncSequence(localCurrentTime, projectRef.current.audioTracks, true);

      // Sync time back to store periodically for timeline scrubber and UI
      if (now - lastStoreSync >= 150) {
        setProject({ currentTime: Math.round(localCurrentTime * 10) / 10 });
        lastStoreSync = now;
      }

      drawFrame(now);
      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => {
      cancelAnimationFrame(animId);
      projectRef.current.visualTracks.forEach((t) => {
        if (t.type === 'video' && t.url) {
          const v = mediaAssetService.getVideoElement(t.url);
          if (!v.paused) v.pause();
        }
      });
    };
  }, [project.isPlaying, drawFrame, setProject]);

  // Canvas Mouse Interaction for Dragging Logo / Intro
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Check hit on logo
    const logo = project.logos[0];
    if (logo && Math.abs(x - logo.posX) < 8 && Math.abs(y - logo.posY) < 8) {
      setIsDraggingLogo(true);
      dragStartPos.current = { x, y };
      setProject({ activeSelectionType: 'logo', activeSelectionId: logo.id });
      return;
    }

    // Check hit on intro text
    const intro = project.intros[0];
    if (intro && Math.abs(x - intro.posX) < 25 && Math.abs(y - intro.posY) < 15) {
      setIsDraggingIntro(true);
      dragStartPos.current = { x, y };
      setProject({ activeSelectionType: 'intro', activeSelectionId: intro.id });
      return;
    }

    setProject({ activeSelectionType: null, activeSelectionId: null });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100));

    if (isDraggingLogo) {
      setProject((prev) => ({
        logos: prev.logos.map((l, i) => (i === 0 ? { ...l, posX: Math.round(x), posY: Math.round(y) } : l)),
      }));
    } else if (isDraggingIntro) {
      setProject((prev) => ({
        intros: prev.intros.map((intro, i) => (i === 0 ? { ...intro, posX: Math.round(x), posY: Math.round(y) } : intro)),
      }));
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingLogo(false);
    setIsDraggingIntro(false);
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg flex flex-col overflow-hidden shadow-xs h-full">
      {/* Viewport Header Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#E5E7EB] bg-[#F4F3F8]/70 shrink-0 h-9">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 font-semibold text-[12px] text-[#1D1D1F]">
            <span className="w-2 h-2 rounded-full bg-[#007AFF]"></span>
            Real-time Viewport
          </span>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#34C759]/15 text-[#006B27] font-mono-data text-[9.5px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse"></span>
            LIVE RENDER
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono-data text-[#6E6E73]">
            {project.outputSettings.resolution} • ProRes 422 • Metal
          </span>
          <button
            onClick={onOpenFullscreen}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#EEEDF3] text-[#717786] hover:text-[#1D1D1F] transition-colors"
            title="Toggle Fullscreen"
          >
            <Maximize2 size={13} />
          </button>
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#007AFF] text-white font-medium text-[11px] shadow-xs hover:bg-[#0062CC] transition-colors"
          >
            <Download size={13} />
            Export Video
          </button>
        </div>
      </div>

      {/* Main 16:9 Canvas Viewport */}
      <div
        className="flex-1 bg-black relative flex items-center justify-center overflow-hidden cursor-crosshair group select-none"
        onDoubleClick={onOpenFullscreen}
      >
        <canvas
          ref={canvasRef}
          width={640}
          height={360}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          className="w-full h-full object-contain"
        />

        {/* Real-time FPS badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[9.5px] text-white/90 font-mono-data border border-white/10 pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]"></span>
          {fps.toFixed(1)} FPS
        </div>

        {/* Double-click hint */}
        <div className="absolute top-2 right-2 text-white/70 text-[9.5px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-black/70 px-2 py-0.5 rounded pointer-events-none border border-white/10">
          <Maximize2 size={10} /> Double-click Fullscreen
        </div>
      </div>

      {/* Transport Controls & Timeline Scrubber */}
      <div className="px-3 py-1.5 bg-[#FFFFFF] border-t border-[#E5E7EB] flex flex-col gap-1 shrink-0">
        {/* Scrubber Bar */}
        <div className="flex items-center gap-2">
          <span className="font-mono-data text-[10px] text-[#1D1D1F] font-semibold w-8">
            {formatTime(project.currentTime)}
          </span>
          <div
            className="flex-1 relative flex items-center cursor-pointer group h-3"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              seekTime(pct * project.totalDuration);
            }}
          >
            <div className="w-full h-1 bg-[#E5E7EB] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#007AFF] rounded-full transition-all"
                style={{ width: `${(project.currentTime / (project.totalDuration || 1)) * 100}%` }}
              />
            </div>
            <div
              className="absolute w-2.5 h-2.5 rounded-full bg-[#007AFF] border-2 border-white shadow-xs -ml-1 transition-transform group-hover:scale-125 pointer-events-none"
              style={{ left: `${(project.currentTime / (project.totalDuration || 1)) * 100}%` }}
            />
          </div>
          <span className="font-mono-data text-[10px] text-[#6E6E73] w-8 text-right">
            {formatTime(project.totalDuration)}
          </span>
        </div>

        {/* Transport button row */}
        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-center gap-1">
            <button
              onClick={() => seekTime(Math.max(0, project.currentTime - 10))}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#EEEDF3] text-[#717786] hover:text-[#1D1D1F]"
              title="Skip Back 10s"
            >
              <SkipBack size={13} />
            </button>
            <button
              onClick={togglePlayback}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-[#007AFF] text-white shadow-xs hover:bg-[#0062CC] transition-colors"
              title={project.isPlaying ? 'Pause' : 'Play'}
            >
              {project.isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
            </button>
            <button
              onClick={() => seekTime(Math.min(project.totalDuration, project.currentTime + 10))}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#EEEDF3] text-[#717786] hover:text-[#1D1D1F]"
              title="Skip Forward 10s"
            >
              <SkipForward size={13} />
            </button>
            <button
              onClick={() => setProject({ isLooping: !project.isLooping })}
              className={`w-6 h-6 flex items-center justify-center rounded hover:bg-[#EEEDF3] ml-1 transition-colors ${
                project.isLooping ? 'text-[#007AFF]' : 'text-[#717786]'
              }`}
              title="Loop Mode"
            >
              <Repeat size={13} />
            </button>
          </div>

          <div className="flex items-center gap-3 font-mono-data text-[10px] text-[#6E6E73]">
            <span>
              FRAME: <strong className="text-[#1D1D1F]">004720</strong>
            </span>
            <span>
              BPM: <strong className="text-[#1D1D1F]">128.0</strong>
            </span>
            <span>
              KEY: <strong className="text-[#1D1D1F]">F# Min</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Volume2 size={13} className="text-[#717786]" />
            <input
              type="range"
              min="0"
              max="100"
              value={project.volume}
              onChange={(e) => {
                const vol = Number(e.target.value);
                setProject({ volume: vol });
                audioEngine.setVolume(vol / 100);
              }}
              className="w-16 accent-[#007AFF] h-1 bg-[#E5E7EB] rounded cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
