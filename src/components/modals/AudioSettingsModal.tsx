import React from 'react';
import { AudioTrack } from '../../types/project';
import { Sliders, Music } from 'lucide-react';

interface AudioSettingsModalProps {
  track: AudioTrack | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updates: Partial<AudioTrack>) => void;
}

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({
  track,
  isOpen,
  onClose,
  onUpdate,
}) => {
  if (!isOpen || !track) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm select-none">
      <div className="w-[480px] bg-[#FFFFFF] rounded-xl shadow-2xl border border-[#E5E7EB] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#F4F3F8] border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-[#5856D6]/10 text-[#5856D6] flex items-center justify-center">
              <Sliders size={14} />
            </span>
            <div>
              <h3 className="font-semibold text-[13px] text-[#1D1D1F]">Audio Track Settings</h3>
              <p className="text-[10px] font-mono-data text-[#6E6E73] truncate max-w-[280px]">
                {track.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#EEEDF3] text-[#717786] hover:text-[#1D1D1F]"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col gap-3 text-[12px] max-h-[75vh] overflow-y-auto">
          {/* Gain and Pan */}
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="flex flex-col gap-1 p-2 rounded bg-[#FFFFFF] border border-[#E5E7EB]">
              <div className="flex justify-between text-[#6E6E73]">
                <span className="font-medium text-[11px]">Gain Output</span>
                <span className="font-mono-data text-[#1D1D1F] font-semibold">
                  {track.gainDb >= 0 ? `+${track.gainDb.toFixed(1)}` : track.gainDb.toFixed(1)} dB
                </span>
              </div>
              <input
                type="range"
                min="-12"
                max="12"
                step="0.2"
                value={track.gainDb}
                onChange={(e) => onUpdate({ gainDb: Number(e.target.value) })}
                className="w-full accent-[#5856D6] h-1.5 bg-[#EEEDF3] rounded cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-1 p-2 rounded bg-[#FFFFFF] border border-[#E5E7EB]">
              <div className="flex justify-between text-[#6E6E73]">
                <span className="font-medium text-[11px]">Stereo Pan</span>
                <span className="font-mono-data text-[#1D1D1F] font-semibold">
                  {track.pan === 0 ? 'Center' : track.pan < 0 ? `L ${Math.abs(track.pan)}%` : `R ${track.pan}%`}
                </span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={track.pan}
                onChange={(e) => onUpdate({ pan: Number(e.target.value) })}
                className="w-full accent-[#5856D6] h-1.5 bg-[#EEEDF3] rounded cursor-pointer"
              />
            </div>
          </div>

          {/* 3-Band Parametric EQ */}
          <div className="flex flex-col gap-1 p-2.5 rounded bg-[#FFFFFF] border border-[#E5E7EB]">
            <div className="flex items-center justify-between text-[11px] font-medium text-[#1D1D1F]">
              <span>3-Band Parametric EQ</span>
              <div className="flex items-center gap-1 text-[9px]">
                <button
                  type="button"
                  onClick={() => onUpdate({ isSolo: !track.isSolo })}
                  className={`px-2 py-0.5 rounded border transition-colors font-mono ${
                    track.isSolo ? 'bg-[#5856D6] text-white border-[#5856D6]' : 'bg-[#EEEDF3] text-[#6E6E73]'
                  }`}
                >
                  SOLO
                </button>
                <button
                  type="button"
                  onClick={() => onUpdate({ isMuted: !track.isMuted })}
                  className={`px-2 py-0.5 rounded border transition-colors font-mono ${
                    track.isMuted ? 'bg-[#BA1A1A] text-white border-[#BA1A1A]' : 'bg-[#EEEDF3] text-[#6E6E73]'
                  }`}
                >
                  MUTE
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-[9px] pt-1">
              <div className="flex flex-col items-center gap-1 bg-[#F4F3F8] p-2 rounded">
                <span className="text-[#6E6E73] font-medium">80 Hz (Low)</span>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  value={track.eqLowDb}
                  onChange={(e) => onUpdate({ eqLowDb: Number(e.target.value) })}
                  className="w-16 accent-[#5856D6] h-1.5 my-2 bg-[#EEEDF3] rounded cursor-pointer"
                />
                <span className="font-mono-data text-[#1D1D1F] text-[10px] font-semibold">
                  {track.eqLowDb >= 0 ? `+${track.eqLowDb}` : track.eqLowDb} dB
                </span>
              </div>

              <div className="flex flex-col items-center gap-1 bg-[#F4F3F8] p-2 rounded">
                <span className="text-[#6E6E73] font-medium">1.2 kHz (Mid)</span>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  value={track.eqMidDb}
                  onChange={(e) => onUpdate({ eqMidDb: Number(e.target.value) })}
                  className="w-16 accent-[#5856D6] h-1.5 my-2 bg-[#EEEDF3] rounded cursor-pointer"
                />
                <span className="font-mono-data text-[#1D1D1F] text-[10px] font-semibold">
                  {track.eqMidDb >= 0 ? `+${track.eqMidDb}` : track.eqMidDb} dB
                </span>
              </div>

              <div className="flex flex-col items-center gap-1 bg-[#F4F3F8] p-2 rounded">
                <span className="text-[#6E6E73] font-medium">10 kHz (High)</span>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  value={track.eqHighDb}
                  onChange={(e) => onUpdate({ eqHighDb: Number(e.target.value) })}
                  className="w-16 accent-[#5856D6] h-1.5 my-2 bg-[#EEEDF3] rounded cursor-pointer"
                />
                <span className="font-mono-data text-[#1D1D1F] text-[10px] font-semibold">
                  {track.eqHighDb >= 0 ? `+${track.eqHighDb}` : track.eqHighDb} dB
                </span>
              </div>
            </div>
          </div>

          {/* Normalization & Pitch */}
          <div className="flex items-center justify-between p-2.5 rounded bg-[#FFFFFF] border border-[#E5E7EB] text-[11px]">
            <div className="flex items-center gap-2">
              <Music size={14} className="text-[#5856D6]" />
              <span className="text-[#6E6E73] font-medium">Pitch Adjustment:</span>
              <span className="font-mono-data font-semibold text-[#1D1D1F]">0 st</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#6E6E73] font-medium">Normalization:</span>
              <span className="px-2 py-0.5 rounded bg-[#EEEDF3] font-mono-data text-[10px] text-[#006B27] font-bold">
                -14 LUFS
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-[#F4F3F8] border-t border-[#E5E7EB] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1 rounded hover:bg-[#EEEDF3] text-[#1D1D1F] font-medium text-[11px]"
          >
            Batal
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#5856D6] text-white font-medium text-[11px] shadow-xs hover:bg-[#4C4ACA]"
          >
            Terapkan Perubahan
          </button>
        </div>
      </div>
    </div>
  );
};
