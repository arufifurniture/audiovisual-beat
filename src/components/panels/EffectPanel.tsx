import React, { useState } from 'react';
import { useProjectStore } from '../../state/projectStore';
import { EffectStyle, EffectDirection, EffectShape, BeatBand } from '../../types/project';
import { Sparkles, Plus, Compass, Move, CircleDot, Palette, Sliders } from 'lucide-react';

export const EffectPanel: React.FC = () => {
  const [project, setProject] = useProjectStore();
  const [activeEffectId, setActiveEffectId] = useState<string>(project.effects[0]?.id || 'effect-tab-1');

  const activeEffect =
    project.effects.find((e) => e.id === activeEffectId) ||
    project.effects[0] || {
      id: 'effect-tab-1',
      name: 'Effect 1',
      style: 'Debu',
      direction: 'Rad',
      speed: 24,
      spread: 65,
      count: 850,
      size: 6,
      life: 22,
      shape: 'Bulat',
      color: '#6664E4',
      opacity: 75,
      glow: 55,
      audioTrigger: 'All',
      sensitivity: 80,
      isVisible: true,
    };

  const updateActiveEffect = (updates: Partial<typeof activeEffect>) => {
    setProject((prev) => ({
      effects: prev.effects.map((e) => (e.id === activeEffect.id ? { ...e, ...updates } : e)),
    }));
  };

  const addEffect = () => {
    const newIdx = project.effects.length + 1;
    const newId = `effect-tab-${Date.now()}`;
    const newEff = {
      id: newId,
      name: `Effect ${newIdx}`,
      style: 'Bokeh' as EffectStyle,
      direction: 'Rand' as EffectDirection,
      speed: 15,
      spread: 50,
      count: 300,
      size: 8,
      life: 25,
      shape: 'Bulat' as EffectShape,
      color: '#FF2D55',
      opacity: 70,
      glow: 60,
      audioTrigger: 'Bass' as BeatBand,
      sensitivity: 75,
      isVisible: true,
    };
    setProject((prev) => ({ effects: [...prev.effects, newEff] }));
    setActiveEffectId(newId);
  };

  const removeEffect = (id: string) => {
    if (project.effects.length <= 1) return;
    const remaining = project.effects.filter((e) => e.id !== id);
    setProject({ effects: remaining });
    if (activeEffectId === id) {
      setActiveEffectId(remaining[0]?.id || '');
    }
  };

  const styles: EffectStyle[] = ['Debu', 'Hujan', 'Salju', 'Percikan', 'Bara', 'Bokeh', 'Bintang', 'Garis Neon', 'Asap', 'Ledakan Radial'];
  const directions: EffectDirection[] = ['Rand', 'Rad', 'Atas', 'Bwh', 'Kiri', 'Knn'];
  const shapes: EffectShape[] = ['Bulat', 'Kotak', 'Bintang', 'Garis', 'Cincin'];

  return (
    <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg flex flex-col overflow-hidden shadow-xs h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#E5E7EB] bg-[#F4F3F8]/70 shrink-0 h-8">
        <div className="flex items-center gap-1.5">
          <Sparkles size={14} className="text-[#5856D6]" />
          <span className="font-semibold text-[11px] uppercase tracking-wider text-[#1D1D1F]">
            Effect
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded bg-[#E2DFFF] text-[#0C006A] font-mono-data font-bold text-[8.5px] border border-[#5856D6]/20">
            {project.effects.length} AKTIF
          </span>
          <button
            type="button"
            onClick={addEffect}
            className="px-1.5 py-0.5 rounded bg-[#5856D6]/10 hover:bg-[#5856D6]/20 text-[#5856D6] font-mono-data text-[8.5px] font-semibold border border-[#5856D6]/20 transition-colors flex items-center gap-0.5"
          >
            <Plus size={9} /> Effect
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-1.5 flex-1 flex flex-col justify-between overflow-y-auto text-[9px] gap-1">
        {/* Effect Tabs */}
        <div className="flex items-center justify-between px-1 py-0.5 rounded bg-[#F4F3F8]/60 border border-[#E5E7EB] shrink-0">
          <div className="flex items-center gap-1 overflow-x-auto min-w-0 flex-1">
            {project.effects.map((eff) => (
              <div
                key={eff.id}
                onClick={() => setActiveEffectId(eff.id)}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8.5px] font-semibold cursor-pointer shadow-2xs shrink-0 ${
                  eff.id === activeEffect.id
                    ? 'bg-[#5856D6] text-white'
                    : 'bg-[#EEEDF3] text-[#414755] hover:text-[#5856D6]'
                }`}
              >
                {eff.id === activeEffect.id && <span className="w-1 h-1 rounded-full bg-white animate-pulse"></span>}
                <span>{eff.name}</span>
                {project.effects.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeEffect(eff.id);
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
            Layer 1/{project.effects.length}
          </span>
        </div>

        {/* 2. GAYA & GERAK */}
        <div className="p-1 rounded bg-[#F4F3F8]/50 border border-[#E5E7EB] flex flex-col gap-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-bold uppercase tracking-wider text-[#5856D6] flex items-center gap-0.5">
              <Move size={9} /> Gaya & Gerak
            </span>
            <div className="flex items-center gap-1 text-[7.5px] font-mono-data text-[#5856D6]">
              <span className="font-semibold">{activeEffect.style}</span>
              <span className="text-[#6E6E73]">• Spread {activeEffect.spread}%</span>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-0.5 my-0.5">
            {styles.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => updateActiveEffect({ style: st })}
                className={`py-1 px-0.5 rounded text-center text-[7.5px] truncate transition-colors ${
                  activeEffect.style === st
                    ? 'bg-[#5856D6] text-white font-medium shadow-2xs'
                    : 'bg-[#FFFFFF] border border-[#E5E7EB] text-[#1D1D1F] hover:border-[#5856D6]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Direction */}
          <div className="flex items-center justify-between p-1 my-0.5 rounded bg-[#FFFFFF] border border-[#E5E7EB]">
            <span className="flex items-center gap-0.5 text-[7.5px] text-[#6E6E73] font-medium">
              <Compass size={9} className="text-[#5856D6]" /> Arah:
            </span>
            <div className="grid grid-cols-6 gap-0.5">
              {directions.map((dir) => (
                <button
                  key={dir}
                  type="button"
                  onClick={() => updateActiveEffect({ direction: dir })}
                  className={`px-1 py-0.5 rounded text-[7px] font-mono text-center transition-colors ${
                    activeEffect.direction === dir
                      ? 'bg-[#5856D6] text-white font-bold shadow-2xs'
                      : 'bg-[#EEEDF3] text-[#1D1D1F] hover:border-[#5856D6]'
                  }`}
                >
                  {dir}
                </button>
              ))}
            </div>
          </div>

          {/* Speed & Spread */}
          <div className="grid grid-cols-2 gap-1 pt-0.5">
            <div className="flex flex-col gap-0.2">
              <div className="flex justify-between text-[7px] text-[#6E6E73]">
                <span>Speed</span>
                <span className="font-mono-data text-[#5856D6] font-bold">{(activeEffect.speed / 10).toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="60"
                value={activeEffect.speed}
                onChange={(e) => updateActiveEffect({ speed: Number(e.target.value) })}
                className="w-full accent-[#5856D6] h-1 bg-[#EEEDF3] rounded cursor-pointer"
              />
            </div>
            <div className="flex flex-col gap-0.2">
              <div className="flex justify-between text-[7px] text-[#6E6E73]">
                <span>Spread</span>
                <span className="font-mono-data text-[#5856D6] font-bold">{activeEffect.spread}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={activeEffect.spread}
                onChange={(e) => updateActiveEffect({ spread: Number(e.target.value) })}
                className="w-full accent-[#5856D6] h-1 bg-[#EEEDF3] rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 3. PARTIKEL */}
        <div className="p-1 rounded bg-[#F4F3F8]/50 border border-[#E5E7EB] flex flex-col gap-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-bold uppercase tracking-wider text-[#5856D6] flex items-center gap-0.5">
              <CircleDot size={9} /> Partikel
            </span>
            <span className="font-mono-data text-[7px] text-[#6E6E73]">
              {activeEffect.count} Butir • {activeEffect.size}px
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1">
            <div className="flex flex-col gap-0.2">
              <div className="flex justify-between text-[7px] text-[#6E6E73]">
                <span>Jumlah</span>
                <span className="font-mono-data text-[#5856D6] font-bold">{activeEffect.count}</span>
              </div>
              <input
                type="range"
                min="50"
                max="2000"
                step="25"
                value={activeEffect.count}
                onChange={(e) => updateActiveEffect({ count: Number(e.target.value) })}
                className="w-full accent-[#5856D6] h-1 bg-[#EEEDF3] rounded cursor-pointer"
              />
            </div>
            <div className="flex flex-col gap-0.2">
              <div className="flex justify-between text-[7px] text-[#6E6E73]">
                <span>Size</span>
                <span className="font-mono-data text-[#5856D6] font-bold">{activeEffect.size}px</span>
              </div>
              <input
                type="range"
                min="1"
                max="24"
                value={activeEffect.size}
                onChange={(e) => updateActiveEffect({ size: Number(e.target.value) })}
                className="w-full accent-[#5856D6] h-1 bg-[#EEEDF3] rounded cursor-pointer"
              />
            </div>
            <div className="flex flex-col gap-0.2">
              <div className="flex justify-between text-[7px] text-[#6E6E73]">
                <span>Life</span>
                <span className="font-mono-data text-[#5856D6] font-bold">{(activeEffect.life / 10).toFixed(1)}s</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                value={activeEffect.life}
                onChange={(e) => updateActiveEffect({ life: Number(e.target.value) })}
                className="w-full accent-[#5856D6] h-1 bg-[#EEEDF3] rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 4. VISUAL & AUDIO TRIGGER */}
        <div className="p-1 rounded bg-[#F4F3F8]/50 border border-[#E5E7EB] flex flex-col gap-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-bold uppercase tracking-wider text-[#5856D6] flex items-center gap-0.5">
              <Palette size={9} /> Visual & Audio Trigger
            </span>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeEffect.color }} />
              <span className="text-[7.5px] font-mono-data text-[#5856D6] font-bold">{activeEffect.color}</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-0.5">
              {shapes.map((shp) => (
                <button
                  key={shp}
                  type="button"
                  onClick={() => updateActiveEffect({ shape: shp })}
                  className={`px-1 py-0.5 rounded text-[7px] transition-colors ${
                    activeEffect.shape === shp
                      ? 'bg-[#5856D6] text-white font-medium shadow-2xs'
                      : 'bg-[#FFFFFF] border border-[#E5E7EB] text-[#1D1D1F]'
                  }`}
                >
                  {shp}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-0.5">
              {(['All', 'Bass', 'Treble'] as BeatBand[]).map((trig) => (
                <button
                  key={trig}
                  type="button"
                  onClick={() => updateActiveEffect({ audioTrigger: trig })}
                  className={`px-1 py-0.5 rounded text-[7.5px] transition-colors ${
                    activeEffect.audioTrigger === trig
                      ? 'bg-[#5856D6] text-white font-medium shadow-2xs'
                      : 'bg-[#FFFFFF] border border-[#E5E7EB] text-[#1D1D1F]'
                  }`}
                >
                  {trig}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
