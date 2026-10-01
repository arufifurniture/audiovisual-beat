import React from 'react';
import { useProjectStore } from '../../state/projectStore';
import { BeatLevel, BeatBand } from '../../types/project';
import { Heart, Activity, Sliders, Zap, Sparkles } from 'lucide-react';

export const BeatSyncPanel: React.FC = () => {
  const [project, setProject] = useProjectStore();
  const beat = project.beatSync;

  const updateBeat = (updates: Partial<typeof beat>) => {
    setProject((prev) => ({
      beatSync: { ...prev.beatSync, ...updates },
    }));
  };

  const toggleEffect = (key: keyof typeof beat.effects) => {
    setProject((prev) => ({
      beatSync: {
        ...prev.beatSync,
        effects: {
          ...prev.beatSync.effects,
          [key]: !prev.beatSync.effects[key],
        },
      },
    }));
  };

  const levels: BeatLevel[] = ['Nonaktif', 'Ringan', 'Sedang', 'Berat'];
  const bands: BeatBand[] = ['All', 'Bass', 'Mid', 'Treble'];

  const activeEffectsCount = Object.values(beat.effects).filter(Boolean).length;

  return (
    <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg flex flex-col overflow-hidden shadow-xs h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-2.5 py-1 border-b border-[#E5E7EB] bg-[#F4F3F8]/70 shrink-0 h-8">
        <div className="flex items-center gap-1.5">
          <Heart size={14} className="text-[#BA1A1A]" />
          <span className="font-semibold text-[11px] uppercase tracking-wider text-[#1D1D1F]">
            Beat & Sync
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => updateBeat({ active: !beat.active })}
            className={`px-1.5 py-0.5 rounded font-mono-data font-bold text-[8.5px] border transition-all ${
              beat.active
                ? 'bg-[#FFDAD6] text-[#93000A] border-[#BA1A1A]/20'
                : 'bg-[#EEEDF3] text-[#717786] border-[#E5E7EB]'
            }`}
          >
            {beat.active ? 'AKTIF' : 'NONAKTIF'}
          </button>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={beat.active}
              onChange={(e) => updateBeat({ active: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-6 h-3 bg-[#EEEDF3] rounded-full peer peer-checked:bg-[#BA1A1A] after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3"></div>
          </label>
        </div>
      </div>

      {/* Body Content */}
      <div
        className={`p-1.5 flex-1 flex flex-col justify-between overflow-y-auto text-[9px] gap-1 transition-opacity ${
          beat.active ? 'opacity-100' : 'opacity-40 pointer-events-none'
        }`}
      >
        {/* Parameter Dasar */}
        <div className="p-1.5 rounded bg-[#F4F3F8]/60 border border-[#E5E7EB] flex flex-col gap-0.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-bold uppercase tracking-wider text-[#BA1A1A] flex items-center gap-0.5">
              <Activity size={9} /> Parameter Dasar
            </span>
            <span className="font-mono-data text-[7px] text-[#6E6E73]">Level Denyut</span>
          </div>

          <div className="grid grid-cols-4 gap-1 mt-0.5">
            {levels.map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => updateBeat({ level: lvl })}
                className={`py-1 text-center rounded text-[7.5px] transition-colors ${
                  beat.level === lvl
                    ? 'bg-[#BA1A1A] text-white font-medium shadow-2xs'
                    : 'bg-[#FFFFFF] border border-[#E5E7EB] text-[#1D1D1F] hover:border-[#BA1A1A]'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Sync Band & Sensitivitas */}
        <div className="p-1.5 rounded bg-[#F4F3F8]/60 border border-[#E5E7EB] flex flex-col gap-0.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-bold uppercase tracking-wider text-[#BA1A1A] flex items-center gap-0.5">
              <Zap size={9} /> Sync
            </span>
            <span className="text-[6.5px] text-[#BA1A1A] font-semibold">{beat.band} Active</span>
          </div>

          <div className="grid grid-cols-4 gap-1 my-0.5">
            {bands.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => updateBeat({ band: b })}
                className={`py-0.5 rounded text-[7.5px] text-center transition-colors ${
                  beat.band === b
                    ? 'bg-[#BA1A1A] text-white font-medium shadow-2xs'
                    : 'bg-[#FFFFFF] border border-[#E5E7EB] text-[#1D1D1F] hover:border-[#BA1A1A]'
                }`}
              >
                {b}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-0.2 pt-0.5 border-t border-[#E5E7EB]">
            <div className="flex justify-between text-[7px] text-[#6E6E73]">
              <span>Sensitivitas</span>
              <span className="font-mono-data text-[#BA1A1A] font-bold">{beat.sensitivity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={beat.sensitivity}
              onChange={(e) => updateBeat({ sensitivity: Number(e.target.value) })}
              className="w-full accent-[#BA1A1A] h-1 bg-[#EEEDF3] rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Timing & Threshold with ADSR visualizer */}
        <div className="p-1.5 rounded bg-[#F4F3F8]/60 border border-[#E5E7EB] flex flex-col gap-1 shadow-2xs">
          <div className="flex items-center justify-between pb-0.5 border-b border-[#E5E7EB]">
            <span className="text-[8px] font-bold uppercase tracking-wider text-[#BA1A1A] flex items-center gap-0.5">
              <Sliders size={9} /> Timing & Threshold
            </span>
            <div className="flex items-center gap-1">
              <span className="font-mono-data text-[6.5px] text-[#6E6E73]">ADSR CURVE</span>
              <svg className="w-8 h-2 overflow-visible shrink-0" viewBox="0 0 40 10">
                <path d="M 0 9 L 8 1 L 18 4 L 32 4 L 40 9" fill="none" stroke="#ba1a1a" strokeWidth="1.2" />
                <circle cx="8" cy="1" r="1.5" fill="#ba1a1a" />
              </svg>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1">
            <div className="flex flex-col gap-0.2">
              <div className="flex justify-between text-[6.5px] text-[#6E6E73]">
                <span>Attack</span>
                <span className="font-mono-data text-[#BA1A1A] font-bold">{beat.attackMs}ms</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                value={beat.attackMs}
                onChange={(e) => updateBeat({ attackMs: Number(e.target.value) })}
                className="w-full accent-[#BA1A1A] h-1 bg-[#EEEDF3] rounded cursor-pointer"
              />
            </div>
            <div className="flex flex-col gap-0.2">
              <div className="flex justify-between text-[6.5px] text-[#6E6E73]">
                <span>Decay</span>
                <span className="font-mono-data text-[#BA1A1A] font-bold">{beat.decayMs}ms</span>
              </div>
              <input
                type="range"
                min="20"
                max="500"
                value={beat.decayMs}
                onChange={(e) => updateBeat({ decayMs: Number(e.target.value) })}
                className="w-full accent-[#BA1A1A] h-1 bg-[#EEEDF3] rounded cursor-pointer"
              />
            </div>
            <div className="flex flex-col gap-0.2">
              <div className="flex justify-between text-[6.5px] text-[#6E6E73]">
                <span>Thresh</span>
                <span className="font-mono-data text-[#BA1A1A] font-bold">{beat.thresholdDb}dB</span>
              </div>
              <input
                type="range"
                min="-30"
                max="0"
                value={beat.thresholdDb}
                onChange={(e) => updateBeat({ thresholdDb: Number(e.target.value) })}
                className="w-full accent-[#BA1A1A] h-1 bg-[#EEEDF3] rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Efek Tambahan */}
        <div className="p-1 rounded bg-[#F4F3F8]/60 border border-[#E5E7EB] flex flex-col gap-0.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-bold uppercase tracking-wider text-[#BA1A1A] flex items-center gap-0.5">
              <Sparkles size={9} /> Efek Tambahan
            </span>
            <span className="text-[7px] font-mono-data text-[#BA1A1A] font-semibold">
              {activeEffectsCount} Aktif
            </span>
          </div>

          <div className="grid grid-cols-4 gap-0.5">
            {[
              { key: 'neonRgb', label: 'Neon RGB' },
              { key: 'grain', label: 'Grain' },
              { key: 'pan', label: 'Pan' },
              { key: 'blitz', label: 'Blitz' },
              { key: 'flash', label: 'Flash' },
              { key: 'vignette', label: 'Vignette' },
              { key: 'dark', label: 'Gelap' },
              { key: 'blur', label: 'Blur' },
            ].map(({ key, label }) => {
              const isActive = beat.effects[key as keyof typeof beat.effects];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleEffect(key as keyof typeof beat.effects)}
                  className={`py-0.5 px-0.5 rounded text-center text-[7.5px] flex items-center justify-center gap-0.5 transition-colors ${
                    isActive
                      ? 'bg-[#BA1A1A] text-white font-medium shadow-2xs'
                      : 'bg-[#FFFFFF] border border-[#E5E7EB] text-[#1D1D1F] hover:border-[#BA1A1A]'
                  }`}
                >
                  {isActive && <span className="w-1 h-1 rounded-full bg-white animate-pulse"></span>}
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
