import React from 'react';
import { Lock, Plus, Zap, User, Sliders, Activity, Share2, Layers } from 'lucide-react';

interface TopToolbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenDiagnostics: () => void;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenDiagnostics,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-12 bg-[#FAF9FE]/85 backdrop-blur-xl border-b border-[#E5E7EB] px-3 flex items-center justify-between select-none">
      {/* Left: macOS Window Controls & App Title */}
      <div className="flex items-center gap-3">
        {/* macOS Traffic Light Buttons */}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-black/10 cursor-pointer flex items-center justify-center group" title="Close">
            <span className="text-[8px] text-black/60 opacity-0 group-hover:opacity-100 font-bold leading-none">✕</span>
          </div>
          <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-black/10 cursor-pointer flex items-center justify-center group" title="Minimize">
            <span className="text-[8px] text-black/60 opacity-0 group-hover:opacity-100 font-bold leading-none">−</span>
          </div>
          <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-black/10 cursor-pointer flex items-center justify-center group" title="Fullscreen">
            <span className="text-[7px] text-black/60 opacity-0 group-hover:opacity-100 font-bold leading-none">⤢</span>
          </div>
        </div>

        <div className="h-4 w-px bg-[#E5E7EB] ml-0.5" />

        {/* Brand identity */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-[#007AFF]/10 border border-[#007AFF]/20 flex items-center justify-center text-[#007AFF]">
            <Activity size={16} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[13px] font-bold tracking-tight text-[#1D1D1F] flex items-center gap-1">
              AudioVisual Beat
              <Lock size={10} className="text-[#6E6E73]" />
            </span>
            <span className="text-[10px] text-[#6E6E73] font-medium">by: Ridwan Johari</span>
          </div>
        </div>
      </div>

      {/* Center: Segmented Workspaces */}
      <nav className="flex items-center gap-1 bg-[#EEEDF3]/80 p-0.5 rounded-lg border border-[#E5E7EB] shadow-inner text-[11px]">
        <button
          onClick={() => onSelectTab('timeline')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded transition-all font-medium ${
            currentTab === 'timeline'
              ? 'bg-[#FFFFFF] text-[#007AFF] shadow-xs border border-[#E5E7EB]'
              : 'text-[#6E6E73] hover:text-[#1D1D1F]'
          }`}
        >
          <Layers size={13} className={currentTab === 'timeline' ? 'text-[#007AFF]' : 'text-[#717786]'} />
          <span>Timeline & Canvas</span>
        </button>

        <button
          onClick={() => onSelectTab('audio_rack')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded transition-all font-medium ${
            currentTab === 'audio_rack'
              ? 'bg-[#FFFFFF] text-[#007AFF] shadow-xs border border-[#E5E7EB]'
              : 'text-[#6E6E73] hover:text-[#1D1D1F]'
          }`}
        >
          <Sliders size={13} className="text-[#5856D6]" />
          <span>Audio & Spectral Rack</span>
        </button>

        <button
          onClick={() => onSelectTab('nodes')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded transition-all font-medium ${
            currentTab === 'nodes'
              ? 'bg-[#FFFFFF] text-[#007AFF] shadow-xs border border-[#E5E7EB]'
              : 'text-[#6E6E73] hover:text-[#1D1D1F]'
          }`}
        >
          <Share2 size={13} className="text-[#34C759]" />
          <span>Node Compositor</span>
        </button>

        <button
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#E3E2E7] transition-colors text-[#717786] hover:text-[#1D1D1F]"
          title="New Workspace"
        >
          <Plus size={13} />
        </button>
      </nav>

      {/* Right: Engine status, FPS, Hardware button & Profile */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={onOpenDiagnostics}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#EEEDF3] border border-[#E5E7EB] hover:border-[#007AFF]/40 transition-colors font-mono-data text-[10px]"
          title="Click to view Hardware Diagnostics"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse"></div>
          <span className="text-[#6E6E73]">Engine:</span>
          <span className="font-semibold text-[#006B27]">Ready</span>
        </button>

        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#EEEDF3] border border-[#E5E7EB] font-mono-data text-[10px] text-[#6E6E73]">
          <span className="font-medium text-[#1D1D1F]">60</span>
          <span className="text-[#8E8E93]">FPS</span>
        </div>

        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#E2DFFF] text-[#0C006A] font-medium text-[10px]">
          <Zap size={11} />
          <span>Fast Export</span>
        </div>

        <div className="w-7 h-7 rounded-full bg-[#007AFF] flex items-center justify-center shadow-xs ml-1 text-white cursor-pointer" title="Project Owner: Ridwan Johari">
          <User size={14} />
        </div>
      </div>
    </header>
  );
};
