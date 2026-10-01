import React, { useState } from 'react';
import { VisualTrack } from '../../types/project';
import { PlayCircle, Pause, Play, RotateCcw, Repeat } from 'lucide-react';

interface FilePreviewModalProps {
  track: VisualTrack | null;
  isOpen: boolean;
  onClose: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ track, isOpen, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(true);

  if (!isOpen || !track) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md select-none">
      <div className="w-[520px] bg-[#FFFFFF] rounded-xl shadow-2xl border border-[#E5E7EB] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#F4F3F8] border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2">
            <PlayCircle size={18} className="text-[#007AFF]" />
            <div>
              <h3 className="font-semibold text-[12px] text-[#1D1D1F]">{track.name}</h3>
              <p className="text-[9.5px] font-mono-data text-[#6E6E73]">{track.info}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#34C759]/15 text-[#006B27] font-mono-data text-[9px] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-ping" />
              LOOP PLAYING
            </span>
            <button
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#EEEDF3] text-[#717786] hover:text-[#1D1D1F]"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Cinematic Preview Canvas Visualizer Area */}
        <div className="relative w-full h-64 bg-black flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-700 via-indigo-950 to-black opacity-90 flex items-center justify-center">
            {/* Film sprocket holes */}
            <div className="absolute top-1 left-2 right-2 h-2.5 flex justify-between opacity-30">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="w-2 h-1.5 bg-white/60 rounded-xs" />
              ))}
            </div>
            <div className="absolute bottom-1 left-2 right-2 h-2.5 flex justify-between opacity-30">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="w-2 h-1.5 bg-white/60 rounded-xs" />
              ))}
            </div>

            {/* Rotating / Looping Kinetic Orb */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <div
                className={`absolute inset-0 rounded-full border-2 border-dashed border-[#007AFF]/60 ${
                  isPlaying ? 'animate-spin' : ''
                }`}
                style={{ animationDuration: '8s' }}
              />
              <div
                className={`absolute inset-3 rounded-full border border-[#5856D6]/50 ${
                  isPlaying ? 'animate-spin' : ''
                }`}
                style={{ animationDuration: '14s', animationDirection: 'reverse' }}
              />
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#007AFF] to-[#5856D6] flex items-center justify-center shadow-[0_0_35px_rgba(0,122,255,0.7)]">
                <PlayCircle size={32} className="text-white animate-pulse" />
              </div>
            </div>
          </div>

          {/* Timecode Overlay */}
          <div className="absolute bottom-3 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded text-[10px] text-white/90 font-mono-data border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span>PLAY / 00:01:24.08</span>
          </div>
          <div className="absolute bottom-3 right-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] text-white/80 font-mono-data border border-white/10">
            <Repeat size={12} className="text-[#007AFF]" />
            <span>Seamless Loop (Endless)</span>
          </div>
        </div>

        {/* Controls */}
        <div className="p-3 bg-[#FFFFFF] border-t border-[#E5E7EB] flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono-data text-[10px] text-[#1D1D1F] font-semibold">00:04</span>
            <div className="flex-1 relative flex items-center cursor-pointer group h-2.5">
              <div className="w-full h-1 bg-[#EEEDF3] rounded-full overflow-hidden">
                <div className="h-full bg-[#007AFF] rounded-full animate-pulse" style={{ width: '45%' }} />
              </div>
              <div className="absolute w-2.5 h-2.5 rounded-full bg-[#007AFF] border-2 border-white shadow-xs left-[45%] -ml-1" />
            </div>
            <span className="font-mono-data text-[10px] text-[#6E6E73]">00:24</span>
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-2.5 py-1 rounded bg-[#EEEDF3] text-[#1D1D1F] font-medium text-[11px] flex items-center gap-1 hover:bg-[#E3E2E7] transition-colors"
              >
                {isPlaying ? <Pause size={13} /> : <Play size={13} />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPlaying(true)}
                className="px-2.5 py-1 rounded bg-[#EEEDF3] text-[#1D1D1F] font-medium text-[11px] flex items-center gap-1 hover:bg-[#E3E2E7] transition-colors"
              >
                <RotateCcw size={13} />
                <span>Restart</span>
              </button>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-1 rounded bg-[#007AFF] text-white font-medium text-[11px] shadow-xs hover:bg-[#0062CC]"
            >
              Selesai Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
