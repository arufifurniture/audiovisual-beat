import React from 'react';
import { Sliders, Cpu, Activity } from 'lucide-react';

interface BottomStatusBarProps {
  onOpenPipeline: () => void;
  onOpenDiagnostics: () => void;
}

export const BottomStatusBar: React.FC<BottomStatusBarProps> = ({
  onOpenPipeline,
  onOpenDiagnostics,
}) => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 h-8 bg-[#FAF9FE]/90 backdrop-blur-xl border-t border-[#E5E7EB] px-3 flex items-center justify-between select-none font-mono-data text-[10px]">
      {/* Left: Render Queue & Shortcuts */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="tracking-wider uppercase font-semibold text-[#6E6E73] text-[9.5px]">
            Render Queue
          </span>
          <span className="bg-[#D8E2FF] text-[#001A41] px-1.5 py-0.5 rounded font-bold text-[9px]">
            2 ACTIVE
          </span>
        </div>

        <div className="h-3 w-px bg-[#E5E7EB]" />

        <div className="flex items-center gap-1">
          <button
            onClick={onOpenPipeline}
            className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-[#EEEDF3] transition-colors text-[#414755] hover:text-[#1D1D1F]"
          >
            <Sliders size={12} className="text-[#6E6E73]" />
            <span className="text-[10px] font-sans font-medium">Export Pipeline</span>
          </button>

          <button
            onClick={onOpenDiagnostics}
            className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-[#EEEDF3] transition-colors text-[#414755] hover:text-[#1D1D1F]"
          >
            <Cpu size={12} className="text-[#6E6E73]" />
            <span className="text-[10px] font-sans font-medium">Hardware Diagnostics</span>
          </button>
        </div>
      </div>

      {/* Right: RAM & Engine telemetry */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-[#414755]">
          <Activity size={12} className="text-[#007AFF]" />
          <span>RAM Used</span>
          <span className="text-[#1D1D1F] font-semibold">4.2 / 32 GB</span>
        </div>

        <div className="w-20 h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
          <div className="h-full bg-[#007AFF] rounded-full" style={{ width: '14%' }}></div>
        </div>
      </div>
    </footer>
  );
};
