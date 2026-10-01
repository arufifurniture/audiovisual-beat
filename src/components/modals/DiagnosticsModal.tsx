import React from 'react';
import { Cpu, CheckCircle2, Zap, Activity, HardDrive } from 'lucide-react';

interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DiagnosticsModal: React.FC<DiagnosticsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm select-none">
      <div className="w-[460px] bg-[#FFFFFF] rounded-xl shadow-2xl border border-[#E5E7EB] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#F4F3F8] border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-[#007AFF]" />
            <h3 className="font-semibold text-[13px] text-[#1D1D1F]">
              Hardware & Engine Diagnostics
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#EEEDF3] text-[#717786] hover:text-[#1D1D1F]"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col gap-3 text-[11px] font-mono-data">
          <div className="p-2.5 rounded bg-[#F4F3F8] border border-[#E5E7EB] flex flex-col gap-1.5">
            <div className="flex items-center justify-between font-sans">
              <span className="font-semibold text-[#1D1D1F]">HOST HARDWARE ACCELERATION</span>
              <span className="px-1.5 py-0.5 rounded bg-[#34C759]/15 text-[#006B27] font-mono-data font-bold text-[9px]">
                OPTIMIZED
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[10px] text-[#6E6E73] pt-1 border-t border-[#E5E7EB]">
              <div>Architecture: <span className="text-[#1D1D1F] font-semibold">Apple Silicon (arm64)</span></div>
              <div>GPU Driver: <span className="text-[#1D1D1F] font-semibold">Metal 3.0 / WebGL 2.0</span></div>
              <div>Encoder: <span className="text-[#007AFF] font-semibold">VideoToolbox HW</span></div>
              <div>Direct Stream Copy: <span className="text-[#006B27] font-semibold">Enabled</span></div>
            </div>
          </div>

          <div className="p-2.5 rounded bg-[#F4F3F8] border border-[#E5E7EB] flex flex-col gap-1.5">
            <div className="flex items-center justify-between font-sans">
              <span className="font-semibold text-[#1D1D1F]">AUDIO PROCESSING PIPELINE</span>
              <span className="text-[#006B27] font-bold text-[9px]">ACTIVE (48 kHz)</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[10px] text-[#6E6E73] pt-1 border-t border-[#E5E7EB]">
              <div>FFT Resolution: <span className="text-[#1D1D1F] font-semibold">512 bins (Realtime)</span></div>
              <div>Internal Latency: <span className="text-[#1D1D1F] font-semibold">5.3 ms</span></div>
              <div>Frequency Bands: <span className="text-[#1D1D1F] font-semibold">Bass / Mid / Treble</span></div>
              <div>Dynamic Range: <span className="text-[#1D1D1F] font-semibold">-14 LUFS Target</span></div>
            </div>
          </div>

          <div className="p-2.5 rounded bg-[#F4F3F8] border border-[#E5E7EB] flex flex-col gap-1.5">
            <div className="flex items-center justify-between font-sans">
              <span className="font-semibold text-[#1D1D1F]">MEMORY & CACHE METRICS</span>
              <span className="text-[#007AFF] font-bold text-[9px]">HEALTHY</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[10px] text-[#6E6E73] pt-1 border-t border-[#E5E7EB]">
              <div>RAM Allocated: <span className="text-[#1D1D1F] font-semibold">4.2 / 32 GB (14%)</span></div>
              <div>Decoded Buffer Cache: <span className="text-[#1D1D1F] font-semibold">128 MB</span></div>
              <div>FFmpeg Buffer Pool: <span className="text-[#1D1D1F] font-semibold">Zero-Copy Ring</span></div>
              <div>Disk I/O Throughput: <span className="text-[#006B27] font-semibold">2,850 MB/s</span></div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-[#F4F3F8] border-t border-[#E5E7EB] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#007AFF] text-white font-medium text-[11px] shadow-xs hover:bg-[#0062CC]"
          >
            Tutup Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};
