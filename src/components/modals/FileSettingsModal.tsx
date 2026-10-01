import React from 'react';
import { VisualTrack, BlendMode } from '../../types/project';
import { Sliders } from 'lucide-react';

interface FileSettingsModalProps {
  track: VisualTrack | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updates: Partial<VisualTrack>) => void;
}

export const FileSettingsModal: React.FC<FileSettingsModalProps> = ({
  track,
  isOpen,
  onClose,
  onUpdate,
}) => {
  if (!isOpen || !track) return null;

  const blendModes: BlendMode[] = ['Normal', 'Screen', 'Multiply', 'Add', 'Overlay'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm select-none">
      <div className="w-[460px] bg-[#FFFFFF] rounded-xl shadow-2xl border border-[#E5E7EB] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#F4F3F8] border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center">
              <Sliders size={14} />
            </span>
            <div>
              <h3 className="font-semibold text-[13px] text-[#1D1D1F]">Visual Asset Settings</h3>
              <p className="text-[10px] font-mono-data text-[#6E6E73] truncate max-w-[280px]">
                {track.name} ({track.info})
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

        {/* Body Controls */}
        <div className="p-4 flex flex-col gap-3 text-[12px] max-h-[75vh] overflow-y-auto">
          {/* Opacity */}
          <div className="flex flex-col gap-1 p-2 rounded bg-[#FFFFFF] border border-[#E5E7EB]">
            <div className="flex justify-between text-[11px]">
              <span className="text-[#6E6E73] font-medium">Layer Opacity</span>
              <span className="font-mono-data text-[#007AFF] font-semibold">{track.opacity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={track.opacity}
              onChange={(e) => onUpdate({ opacity: Number(e.target.value) })}
              className="w-full accent-[#007AFF] h-1.5 bg-[#EEEDF3] rounded cursor-pointer"
            />
          </div>

          {/* Scale */}
          <div className="flex flex-col gap-1 p-2 rounded bg-[#FFFFFF] border border-[#E5E7EB]">
            <div className="flex justify-between text-[11px]">
              <span className="text-[#6E6E73] font-medium">Canvas Scale Multiplier</span>
              <span className="font-mono-data text-[#007AFF] font-semibold">{track.scale.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="10"
              max="300"
              value={Math.round(track.scale * 100)}
              onChange={(e) => onUpdate({ scale: Number(e.target.value) / 100 })}
              className="w-full accent-[#007AFF] h-1.5 bg-[#EEEDF3] rounded cursor-pointer"
            />
          </div>

          {/* Blend Mode */}
          <div className="flex flex-col gap-1">
            <label className="text-[10.5px] font-semibold text-[#6E6E73]">BLEND COMPOSITING MODE</label>
            <div className="grid grid-cols-5 gap-1 text-[10px]">
              {blendModes.map((bm) => (
                <button
                  key={bm}
                  type="button"
                  onClick={() => onUpdate({ blendMode: bm })}
                  className={`py-1 px-1 text-center rounded border transition-colors ${
                    track.blendMode === bm
                      ? 'bg-[#007AFF] text-white font-medium border-[#007AFF]'
                      : 'bg-[#FFFFFF] border-[#E5E7EB] text-[#1D1D1F] hover:border-[#007AFF]'
                  }`}
                >
                  {bm}
                </button>
              ))}
            </div>
          </div>

          {/* Rotation */}
          <div className="flex flex-col gap-1 p-2 rounded bg-[#FFFFFF] border border-[#E5E7EB]">
            <div className="flex justify-between text-[11px]">
              <span className="text-[#6E6E73] font-medium">Rotation Angle</span>
              <span className="font-mono-data text-[#5856D6] font-semibold">{track.rotation}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              value={track.rotation}
              onChange={(e) => onUpdate({ rotation: Number(e.target.value) })}
              className="w-full accent-[#5856D6] h-1.5 bg-[#EEEDF3] rounded cursor-pointer"
            />
          </div>

          {/* Chroma Key / Alpha Mask Toggle */}
          <div className="flex items-center justify-between p-2.5 rounded bg-[#FFFFFF] border border-[#E5E7EB]">
            <div className="flex flex-col">
              <span className="font-semibold text-[#1D1D1F] text-[11px]">Chroma Key / Alpha Mask</span>
              <span className="text-[#6E6E73] text-[9.5px]">Extract transparent backgrounds or key greenscreen</span>
            </div>
            <input
              type="checkbox"
              checked={track.chromaKey}
              onChange={(e) => onUpdate({ chromaKey: e.target.checked })}
              className="accent-[#007AFF] w-4 h-4 cursor-pointer"
            />
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
            className="px-4 py-1.5 rounded bg-[#007AFF] text-white font-medium text-[11px] shadow-xs hover:bg-[#0062CC]"
          >
            Terapkan Perubahan
          </button>
        </div>
      </div>
    </div>
  );
};
