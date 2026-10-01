import React from 'react';
import { useProjectStore } from '../../state/projectStore';
import { VisualizerStyle, ColorMode } from '../../types/project';
import { Activity, Plus, Waves, BarChart2, Palette, Zap, FlipHorizontal } from 'lucide-react';

export const VisualizerPanel: React.FC = () => {
  const [project, setProject] = useProjectStore();

  const activeViz = project.visualizers[0] || {
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
  };

  const updateActiveViz = (updates: Partial<typeof activeViz>) => {
    setProject((prev) => ({
      visualizers: prev.visualizers.map((v) => (v.id === activeViz.id ? { ...v, ...updates } : v)),
    }));
  };

  const addVisualizer = () => {
    const newCount = project.visualizers.length + 1;
    const newViz = {
      id: `viz-layer-${Date.now()}`,
      name: `Visualizer ${newCount}`,
      style: 'Velvet Rise' as VisualizerStyle,
      sensitivity: 70,
      attackMs: 20,
      decayMs: 150,
      barsCount: 48,
      barWidth: 10,
      colorMode: 'Gradient' as ColorMode,
      color1: '#53E16F',
      color2: '#006B27',
      opacity: 80,
      glow: 50,
      beatPunch: 20,
      beatZoom: 120,
      mirrorMode: true,
      isVisible: true,
    };
    setProject((prev) => ({ visualizers: [...prev.visualizers, newViz] }));
  };

  const removeVisualizer = (id: string) => {
    if (project.visualizers.length <= 1) return;
    setProject((prev) => ({ visualizers: prev.visualizers.filter((v) => v.id !== id) }));
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg flex flex-col overflow-hidden shadow-xs h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#E5E7EB] bg-[#F4F3F8]/70 shrink-0 h-8">
        <div className="flex items-center gap-1.5">
          <Activity size={14} className="text-[#006B27]" />
          <span className="font-semibold text-[11px] uppercase tracking-wider text-[#1D1D1F]">
            Visualizer
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded bg-[#34C759]/15 text-[#006B27] font-mono-data font-bold text-[8.5px] border border-[#006B27]/20">
            {project.visualizers.length} LAYER{project.visualizers.length > 1 ? 'S' : ''}
          </span>
          <button
            type="button"
            onClick={addVisualizer}
            className="px-1.5 py-0.5 rounded bg-[#006B27]/10 hover:bg-[#006B27]/20 text-[#006B27] font-mono-data text-[8.5px] font-semibold border border-[#006B27]/20 transition-colors flex items-center gap-0.5"
          >
            <Plus size={9} /> Visualizer
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-1.5 flex-1 flex flex-col justify-between overflow-y-auto text-[10px] gap-1">
        {/* Visualizer Layer Tabs */}
        <div className="flex items-center justify-between px-1 py-0.5 rounded bg-[#F4F3F8]/60 border border-[#E5E7EB] shrink-0">
          <div className="flex items-center gap-1 overflow-x-auto min-w-0 flex-1">
            {project.visualizers.map((viz) => (
              <div
                key={viz.id}
                onClick={() => updateActiveViz({ id: viz.id })}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8.5px] font-semibold cursor-pointer shadow-2xs shrink-0 ${
                  viz.id === activeViz.id
                    ? 'bg-[#006B27] text-white'
                    : 'bg-[#EEEDF3] text-[#414755] hover:text-[#006B27]'
                }`}
              >
                {viz.id === activeViz.id && <span className="w-1 h-1 rounded-full bg-white animate-pulse"></span>}
                <span>{viz.name}</span>
                {project.visualizers.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeVisualizer(viz.id);
                    }}
                    className="hover:text-red-300 ml-0.5 text-[8.5px]"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <span className="text-[7.5px] font-mono-data text-[#6E6E73] pl-1 shrink-0">
            Layer 1/{project.visualizers.length}
          </span>
        </div>

        {/* Settings Panels Card */}
        <div className="p-1.5 rounded bg-[#F4F3F8]/50 border border-[#E5E7EB] flex flex-col gap-1 justify-between flex-1">
          {/* a. BENTUK & GERAK */}
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[8px] font-bold uppercase tracking-wider text-[#006B27] flex items-center gap-0.5 shrink-0">
                <Waves size={10} /> Bentuk & Gerak
              </span>
              <select
                value={activeViz.style}
                onChange={(e) => updateActiveViz({ style: e.target.value as VisualizerStyle })}
                className="flex-1 ml-1 px-2 py-0.5 rounded bg-[#FFFFFF] border border-[#E5E7EB] text-[#1D1D1F] font-semibold text-[10px] focus:outline-[#006B27]"
              >
                <option value="Silk Pulse">Silk Pulse</option>
                <option value="Velvet Rise">Velvet Rise</option>
                <option value="Neon Drops">Neon Drops</option>
                <option value="Ember Grid">Ember Grid</option>
                <option value="Obsidian Grid">Obsidian Grid</option>
                <option value="Spectrum Circle">Spectrum Circle</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-1 pt-0.5">
              <div className="flex flex-col gap-0.2">
                <div className="flex justify-between text-[7px] text-[#6E6E73]">
                  <span>Sensitivitas</span>
                  <span className="font-mono-data text-[#006B27] font-bold">{activeViz.sensitivity}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={activeViz.sensitivity}
                  onChange={(e) => updateActiveViz({ sensitivity: Number(e.target.value) })}
                  className="w-full accent-[#006B27] h-1 bg-[#EEEDF3] rounded cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-0.2">
                <div className="flex justify-between text-[7px] text-[#6E6E73]">
                  <span>Attack</span>
                  <span className="font-mono-data text-[#006B27] font-bold">{activeViz.attackMs}ms</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={activeViz.attackMs}
                  onChange={(e) => updateActiveViz({ attackMs: Number(e.target.value) })}
                  className="w-full accent-[#006B27] h-1 bg-[#EEEDF3] rounded cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-0.2">
                <div className="flex justify-between text-[7px] text-[#6E6E73]">
                  <span>Decay</span>
                  <span className="font-mono-data text-[#006B27] font-bold">{activeViz.decayMs}ms</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="500"
                  value={activeViz.decayMs}
                  onChange={(e) => updateActiveViz({ decayMs: Number(e.target.value) })}
                  className="w-full accent-[#006B27] h-1 bg-[#EEEDF3] rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* b. BAR SETTINGS */}
          <div className="flex flex-col gap-0.5 pt-0.5 border-t border-[#E5E7EB]">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-bold uppercase tracking-wider text-[#006B27] flex items-center gap-0.5">
                <BarChart2 size={10} /> Bar Settings
              </span>
              <span className="font-mono-data text-[7.5px] text-[#6E6E73]">
                {activeViz.barsCount} Bars • {activeViz.barWidth}px
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <div className="flex flex-col gap-0.2">
                <div className="flex justify-between text-[7px] text-[#6E6E73]">
                  <span>Jumlah</span>
                  <span className="font-mono-data text-[#006B27] font-bold">{activeViz.barsCount} Bars</span>
                </div>
                <input
                  type="range"
                  min="16"
                  max="128"
                  step="16"
                  value={activeViz.barsCount}
                  onChange={(e) => updateActiveViz({ barsCount: Number(e.target.value) })}
                  className="w-full accent-[#006B27] h-1 bg-[#EEEDF3] rounded cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-0.2">
                <div className="flex justify-between text-[7px] text-[#6E6E73]">
                  <span>Lebar</span>
                  <span className="font-mono-data text-[#006B27] font-bold">{activeViz.barWidth}px</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="24"
                  value={activeViz.barWidth}
                  onChange={(e) => updateActiveViz({ barWidth: Number(e.target.value) })}
                  className="w-full accent-[#006B27] h-1 bg-[#EEEDF3] rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* c. WARNA & GLOW */}
          <div className="flex flex-col gap-0.5 pt-0.5 border-t border-[#E5E7EB]">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-bold uppercase tracking-wider text-[#006B27] flex items-center gap-0.5">
                <Palette size={10} /> Warna & Glow
              </span>
              <div className="flex items-center gap-0.5">
                {(['Solid', 'Gradient', 'Rainbow'] as ColorMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => updateActiveViz({ colorMode: mode })}
                    className={`px-1 py-0.5 rounded text-[7px] font-medium transition-colors ${
                      activeViz.colorMode === mode
                        ? 'bg-[#006B27] text-white shadow-2xs'
                        : 'bg-[#FFFFFF] border border-[#E5E7EB] text-[#1D1D1F]'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between py-0.5">
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-1 px-1 py-0.5 rounded bg-[#FFFFFF] border border-[#E5E7EB]">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeViz.color1 }} />
                  <input
                    type="text"
                    value={activeViz.color1}
                    onChange={(e) => updateActiveViz({ color1: e.target.value })}
                    className="w-12 bg-transparent text-[7.5px] font-mono-data font-semibold text-[#1D1D1F] border-0 p-0 focus:ring-0"
                  />
                </div>
                <div className="flex items-center gap-1 px-1 py-0.5 rounded bg-[#FFFFFF] border border-[#E5E7EB]">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeViz.color2 }} />
                  <input
                    type="text"
                    value={activeViz.color2}
                    onChange={(e) => updateActiveViz({ color2: e.target.value })}
                    className="w-12 bg-transparent text-[7.5px] font-mono-data font-semibold text-[#1D1D1F] border-0 p-0 focus:ring-0"
                  />
                </div>
              </div>
              <div
                className="w-10 h-2.5 rounded border border-black/10 shadow-2xs"
                style={{ background: `linear-gradient(to right, ${activeViz.color1}, ${activeViz.color2})` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <div className="flex flex-col gap-0.2">
                <div className="flex justify-between text-[7px] text-[#6E6E73]">
                  <span>Opacity</span>
                  <span className="font-mono-data text-[#006B27] font-bold">{activeViz.opacity}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={activeViz.opacity}
                  onChange={(e) => updateActiveViz({ opacity: Number(e.target.value) })}
                  className="w-full accent-[#006B27] h-1 bg-[#EEEDF3] rounded cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-0.2">
                <div className="flex justify-between text-[7px] text-[#6E6E73]">
                  <span>Glow</span>
                  <span className="font-mono-data text-[#006B27] font-bold">{activeViz.glow}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={activeViz.glow}
                  onChange={(e) => updateActiveViz({ glow: Number(e.target.value) })}
                  className="w-full accent-[#006B27] h-1 bg-[#EEEDF3] rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* d. EFEK BEAT */}
          <div className="flex flex-col gap-0.5 pt-0.5 border-t border-[#E5E7EB]">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-bold uppercase tracking-wider text-[#006B27] flex items-center gap-0.5">
                <Zap size={10} /> Efek Beat
              </span>
              <span className="font-mono-data text-[7.5px] text-[#006B27] font-medium">Reactive Boost</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <div className="flex flex-col gap-0.2">
                <div className="flex justify-between text-[7px] text-[#6E6E73]">
                  <span>Punch</span>
                  <span className="font-mono-data text-[#006B27] font-bold">+{activeViz.beatPunch}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={activeViz.beatPunch}
                  onChange={(e) => updateActiveViz({ beatPunch: Number(e.target.value) })}
                  className="w-full accent-[#006B27] h-1 bg-[#EEEDF3] rounded cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-0.2">
                <div className="flex justify-between text-[7px] text-[#6E6E73]">
                  <span>Zoom</span>
                  <span className="font-mono-data text-[#006B27] font-bold">{(activeViz.beatZoom / 100).toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="150"
                  value={activeViz.beatZoom}
                  onChange={(e) => updateActiveViz({ beatZoom: Number(e.target.value) })}
                  className="w-full accent-[#006B27] h-1 bg-[#EEEDF3] rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* e. MIRROR MODE */}
          <div className="flex items-center justify-between p-1 rounded bg-[#FFFFFF] border border-[#E5E7EB]">
            <div className="flex flex-col">
              <span className="text-[8px] font-bold text-[#1D1D1F] flex items-center gap-0.5">
                <FlipHorizontal size={10} className="text-[#006B27]" /> Mirror Mode
              </span>
              <span className="text-[7px] text-[#6E6E73]">Simetri horizontal & vertikal</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={activeViz.mirrorMode}
                onChange={(e) => updateActiveViz({ mirrorMode: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-6 h-3 bg-[#EEEDF3] rounded-full peer peer-checked:bg-[#006B27] after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
