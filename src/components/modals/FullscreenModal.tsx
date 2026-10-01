import React from 'react';
import { Maximize2, Minimize2, Activity } from 'lucide-react';
import { useProjectStore } from '../../state/projectStore';

interface FullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FullscreenModal: React.FC<FullscreenModalProps> = ({ isOpen, onClose }) => {
  const [project] = useProjectStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col select-none">
      {/* Header */}
      <div className="h-10 bg-black/80 backdrop-blur-md px-4 flex items-center justify-between border-b border-white/10 text-white">
        <div className="flex items-center gap-2">
          <Maximize2 size={16} className="text-[#007AFF]" />
          <span className="font-semibold text-[13px]">
            Fullscreen Cinema Monitor — {project.intros[0]?.text || 'ASTRA SPECTRA'}
          </span>
          <span className="px-2 py-0.5 rounded bg-[#34C759] text-white font-mono-data text-[9px] font-bold">
            PRORES METAL 60FPS
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white/60 font-mono-data text-[11px]">Press ESC or click Exit to return</span>
          <button
            onClick={onClose}
            className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-medium text-[11px] flex items-center gap-1 transition-colors"
          >
            <Minimize2 size={13} />
            <span>Exit Fullscreen</span>
          </button>
        </div>
      </div>

      {/* Main Visualizer Canvas in Fullscreen */}
      <div className="flex-1 relative flex items-center justify-center bg-radial from-slate-900 via-black to-black">
        <div className="relative flex flex-col items-center justify-center gap-6">
          <div className="w-52 h-52 rounded-full border-2 border-[#007AFF]/50 shadow-[0_0_60px_rgba(0,122,255,0.6)] flex items-center justify-center animate-pulse">
            <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-[#007AFF] to-[#5856D6] flex items-center justify-center shadow-2xl">
              <Activity size={48} className="text-white" />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-white font-extrabold tracking-widest text-[32px] uppercase drop-shadow-[0_0_20px_rgba(255,255,255,0.9)]">
              {project.intros[0]?.text || 'ASTRA SPECTRA'}
            </h1>
            <p className="text-[#ADC6FF] font-mono-data text-[13px] tracking-widest mt-1">
              MASTER PREVIEW ENGINE • {project.outputSettings.resolution} @ {project.outputSettings.fps} FPS
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
