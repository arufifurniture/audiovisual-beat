import React, { useState, useRef } from 'react';
import { useProjectStore } from '../../state/projectStore';
import { AnchorPosition } from '../../types/project';
import {
  Type,
  Upload,
  Plus,
  PlayCircle,
  Timer,
  Sliders,
  Grid,
  Sparkles,
} from 'lucide-react';

export const IntroLogoPanel: React.FC = () => {
  const [project, setProject] = useProjectStore();
  const [showTypoModal, setShowTypoModal] = useState(false);
  const logoFileInputRef = useRef<HTMLInputElement | null>(null);

  const activeIntro = project.intros[0] || {
    id: 'intro-1',
    name: 'Intro 1',
    text: 'ASTRA SPECTRA',
    font: 'Inter',
    fontSize: 36,
    color: '#FFFFFF',
    dropShadow: 60,
    glow: 40,
    stroke: 2,
    animation: 'Typewriter',
    opacity: 100,
    startTime: 0,
    duration: 3.2,
    bgDim: 40,
    posX: 50,
    posY: 50,
    isVisible: true,
  };

  const activeLogo = project.logos[0] || {
    id: 'logo-1',
    name: 'Logo 1',
    scale: 85,
    opacity: 90,
    isLoop: true,
    startTime: 0.5,
    duration: 4.0,
    anchor: 'BR',
    posX: 88,
    posY: 88,
    isVisible: true,
  };

  // Add new intro layer
  const addIntro = () => {
    const newIdx = project.intros.length + 1;
    const newLayer = {
      id: `intro-${Date.now()}`,
      name: `Intro ${newIdx}`,
      text: `DEEP FOCUS MUSIC`,
      font: 'Inter',
      fontSize: 32,
      color: '#FFFFFF',
      dropShadow: 50,
      glow: 30,
      stroke: 1,
      animation: 'Fade In/Out' as const,
      opacity: 100,
      startTime: 3.5,
      duration: 3.0,
      bgDim: 30,
      posX: 50,
      posY: 50,
      isVisible: true,
    };
    setProject((prev) => ({ intros: [...prev.intros, newLayer] }));
  };

  const removeIntro = (id: string) => {
    if (project.intros.length <= 1) return;
    setProject((prev) => ({ intros: prev.intros.filter((i) => i.id !== id) }));
  };

  const updateActiveIntro = (updates: Partial<typeof activeIntro>) => {
    setProject((prev) => ({
      intros: prev.intros.map((intro) => (intro.id === activeIntro.id ? { ...intro, ...updates } : intro)),
    }));
  };

  const updateActiveLogo = (updates: Partial<typeof activeLogo>) => {
    setProject((prev) => ({
      logos: prev.logos.map((logo) => (logo.id === activeLogo.id ? { ...logo, ...updates } : logo)),
    }));
  };

  const selectAnchor = (anchor: AnchorPosition) => {
    let posX = 50;
    let posY = 50;
    if (anchor.includes('L')) posX = 15;
    if (anchor.includes('R')) posX = 85;
    if (anchor.includes('T')) posY = 15;
    if (anchor.includes('B')) posY = 85;

    updateActiveLogo({ anchor, posX, posY });
  };

  const anchors: AnchorPosition[] = ['TL', 'TC', 'TR', 'ML', 'CTR', 'MR', 'BL', 'BC', 'BR'];

  return (
    <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg flex flex-col overflow-hidden shadow-xs h-full relative">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#E5E7EB] bg-[#F4F3F8]/70 shrink-0 h-8">
        <div className="flex items-center gap-1.5">
          <Type size={14} className="text-[#007AFF]" />
          <span className="font-semibold text-[11px] uppercase tracking-wider text-[#1D1D1F]">
            Intro & Logo
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded bg-[#D8E2FF] text-[#001A41] font-mono-data font-bold text-[8.5px]">
            ACTIVE
          </span>
          <input
            type="checkbox"
            checked={activeIntro.isVisible || activeLogo.isVisible}
            onChange={(e) => {
              const val = e.target.checked;
              updateActiveIntro({ isVisible: val });
              updateActiveLogo({ isVisible: val });
            }}
            className="accent-[#007AFF] w-3.5 h-3.5 cursor-pointer rounded"
          />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col justify-between overflow-y-auto text-[10px] p-1.5 gap-1.5">
        {/* Sub-section 1: INTRO / TITLE OVERLAY */}
        <div className="p-2 rounded bg-[#F4F3F8]/60 border border-[#E5E7EB] flex flex-col gap-1.5 shadow-2xs">
          <div className="flex items-center justify-between pb-1 border-b border-[#E5E7EB]">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#007AFF] flex items-center gap-1">
              Intro Overlay
            </span>
            <div className="flex items-center gap-1">
              {project.intros.map((intro, idx) => (
                <div
                  key={intro.id}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-semibold cursor-pointer ${
                    intro.id === activeIntro.id ? 'bg-[#007AFF] text-white' : 'bg-[#EEEDF3] text-[#1D1D1F]'
                  }`}
                  onClick={() => updateActiveIntro({ id: intro.id })}
                >
                  <span>{intro.name || `Intro ${idx + 1}`}</span>
                  {project.intros.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeIntro(intro.id);
                      }}
                      className="hover:text-red-300 ml-0.5"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addIntro}
                className="px-1.5 py-0.5 rounded border border-dashed border-[#007AFF]/50 text-[#007AFF] hover:bg-[#007AFF]/10 text-[8px] font-medium transition-colors flex items-center gap-0.5"
              >
                <Plus size={9} /> Tambah
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 w-full">
            <input
              type="text"
              value={activeIntro.text}
              onChange={(e) => updateActiveIntro({ text: e.target.value })}
              className="flex-1 px-2 py-0.5 bg-[#FFFFFF] border border-[#E5E7EB] rounded text-[10px] font-semibold text-[#1D1D1F] focus:outline-[#007AFF]"
              placeholder="Teks judul intro..."
            />
            <button
              type="button"
              onClick={() => setShowTypoModal(true)}
              className="w-6 h-6 flex items-center justify-center rounded bg-[#FFFFFF] border border-[#E5E7EB] text-[#717786] hover:text-[#007AFF] transition-colors shadow-2xs shrink-0"
              title="Tipografi & Efek Teks"
            >
              <Sparkles size={12} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1">
            <div className="flex flex-col gap-0.5 p-1 rounded bg-[#FFFFFF] border border-[#E5E7EB]">
              <div className="flex justify-between items-center text-[7.5px] text-[#6E6E73]">
                <span className="flex items-center gap-0.5">
                  <PlayCircle size={8} /> Mulai
                </span>
                <span className="font-mono-data text-[#007AFF] font-bold">
                  {activeIntro.startTime.toFixed(1)}s
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={activeIntro.startTime}
                onChange={(e) => updateActiveIntro({ startTime: Number(e.target.value) })}
                className="w-full accent-[#007AFF] h-1 bg-[#EEEDF3] rounded cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-0.5 p-1 rounded bg-[#FFFFFF] border border-[#E5E7EB]">
              <div className="flex justify-between items-center text-[7.5px] text-[#6E6E73]">
                <span className="flex items-center gap-0.5">
                  <Timer size={8} /> Durasi
                </span>
                <span className="font-mono-data text-[#007AFF] font-bold">
                  {activeIntro.duration.toFixed(1)}s
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.1"
                value={activeIntro.duration}
                onChange={(e) => updateActiveIntro({ duration: Number(e.target.value) })}
                className="w-full accent-[#007AFF] h-1 bg-[#EEEDF3] rounded cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-0.5 p-1 rounded bg-[#FFFFFF] border border-[#E5E7EB]">
              <div className="flex justify-between items-center text-[7.5px] text-[#6E6E73]">
                <span>Dim BG</span>
                <span className="font-mono-data text-[#007AFF] font-bold">{activeIntro.bgDim}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={activeIntro.bgDim}
                onChange={(e) => updateActiveIntro({ bgDim: Number(e.target.value) })}
                className="w-full accent-[#007AFF] h-1 bg-[#EEEDF3] rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Sub-section 2: LOGO / WATERMARK */}
        <div className="p-2 rounded bg-[#F4F3F8]/60 border border-[#E5E7EB] flex flex-col gap-1 shadow-2xs">
          <div className="flex items-center justify-between pb-0.5 border-b border-[#E5E7EB]">
            <span className="text-[8.5px] font-bold uppercase tracking-wider text-[#007AFF] flex items-center gap-0.5">
              Logo / Watermark
            </span>
            <div className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded bg-[#007AFF] text-white text-[8px] font-semibold">
                {activeLogo.name}
              </span>
              <button
                type="button"
                onClick={() => logoFileInputRef.current?.click()}
                className="px-1.5 py-0.5 rounded border border-dashed border-[#007AFF]/50 text-[#007AFF] hover:bg-[#007AFF]/10 text-[8px] font-medium transition-colors flex items-center gap-0.5"
              >
                <Upload size={8} /> Unggah
              </button>
              <input
                ref={logoFileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.mp4"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    updateActiveLogo({ name: file.name, url: URL.createObjectURL(file) });
                  }
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <div className="flex flex-col gap-0.5">
              <div className="flex justify-between items-center text-[7.5px] text-[#6E6E73]">
                <span>Skala</span>
                <span className="font-mono-data text-[#007AFF] font-bold">{activeLogo.scale}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="150"
                value={activeLogo.scale}
                onChange={(e) => updateActiveLogo({ scale: Number(e.target.value) })}
                className="w-full accent-[#007AFF] h-1 bg-[#EEEDF3] rounded cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-0.5">
              <div className="flex justify-between items-center text-[7.5px] text-[#6E6E73]">
                <span>Opasitas</span>
                <span className="font-mono-data text-[#007AFF] font-bold">{activeLogo.opacity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={activeLogo.opacity}
                onChange={(e) => updateActiveLogo({ opacity: Number(e.target.value) })}
                className="w-full accent-[#007AFF] h-1 bg-[#EEEDF3] rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Timing & Anchor Grid */}
          <div className="flex items-center justify-between gap-1 pt-0.5">
            <div className="flex items-center gap-1 text-[7.5px]">
              <div className="flex items-center p-0.5 bg-[#EEEDF3] rounded text-[7px]">
                <button
                  type="button"
                  onClick={() => updateActiveLogo({ isLoop: true })}
                  className={`px-1.5 py-0.5 rounded font-semibold ${
                    activeLogo.isLoop ? 'bg-[#007AFF] text-white shadow-xs' : 'text-[#6E6E73]'
                  }`}
                >
                  Loop
                </button>
                <button
                  type="button"
                  onClick={() => updateActiveLogo({ isLoop: false })}
                  className={`px-1.5 py-0.5 rounded font-semibold ${
                    !activeLogo.isLoop ? 'bg-[#007AFF] text-white shadow-xs' : 'text-[#6E6E73]'
                  }`}
                >
                  1x
                </button>
              </div>

              <div className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-[#FFFFFF] border border-[#E5E7EB]">
                <span className="text-[#6E6E73]">Mulai:</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="30"
                  value={activeLogo.startTime}
                  onChange={(e) => updateActiveLogo({ startTime: Number(e.target.value) })}
                  className="w-7 text-[7.5px] font-mono-data text-[#007AFF] font-bold text-center bg-transparent border-0 p-0 focus:ring-0"
                />
                <span className="text-[#6E6E73]">s</span>
              </div>
            </div>

            {/* 9-Point Anchor Grid */}
            <div className="flex items-center gap-1 bg-[#FFFFFF] border border-[#E5E7EB] rounded p-1">
              <span className="text-[7.5px] font-mono-data text-[#007AFF] font-bold">{activeLogo.anchor}</span>
              <div className="grid grid-cols-3 gap-0.5 w-16 shrink-0">
                {anchors.map((anc) => (
                  <button
                    key={anc}
                    type="button"
                    onClick={() => selectAnchor(anc)}
                    className={`py-0.5 text-[6.5px] font-mono text-center rounded transition-colors ${
                      activeLogo.anchor === anc
                        ? 'bg-[#007AFF] text-white font-bold shadow-2xs'
                        : 'bg-[#EEEDF3] text-[#717786] hover:bg-[#007AFF]/20'
                    }`}
                  >
                    {anc}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Typography & Effects Popover Modal */}
      {showTypoModal && (
        <div className="absolute inset-2 z-50 bg-[#FFFFFF]/95 backdrop-blur-md rounded-lg shadow-xl border border-[#E5E7EB] p-2.5 flex flex-col justify-between select-none">
          <div className="flex items-center justify-between pb-1 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-1 text-[#007AFF] font-semibold text-[10px]">
              <Sliders size={12} />
              <span>Kustomisasi Tipografi & Efek Teks</span>
            </div>
            <button
              type="button"
              onClick={() => setShowTypoModal(false)}
              className="w-4 h-4 flex items-center justify-center rounded hover:bg-[#EEEDF3] text-[#6E6E73] text-[11px]"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-col gap-1.5 py-1 text-[8.5px]">
            <div className="grid grid-cols-2 gap-1.5">
              <div className="flex flex-col gap-0.5">
                <span className="text-[#6E6E73]">Koleksi Font</span>
                <select
                  value={activeIntro.font}
                  onChange={(e) => updateActiveIntro({ font: e.target.value })}
                  className="px-1 py-0.5 bg-[#FFFFFF] border border-[#E5E7EB] rounded text-[#1D1D1F] text-[8.5px] font-semibold"
                >
                  <option value="Inter">Inter</option>
                  <option value="JetBrains Mono">JetBrains Mono</option>
                  <option value="Arial">Arial Black</option>
                  <option value="Impact">Impact</option>
                  <option value="Georgia">Georgia</option>
                </select>
              </div>

              <div className="flex flex-col gap-0.5">
                <div className="flex justify-between text-[#6E6E73]">
                  <span>Ukuran Teks</span>
                  <span className="font-mono-data text-[#007AFF] font-semibold">{activeIntro.fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="18"
                  max="72"
                  value={activeIntro.fontSize}
                  onChange={(e) => updateActiveIntro({ fontSize: Number(e.target.value) })}
                  className="w-full accent-[#007AFF] h-1 bg-[#EEEDF3] rounded cursor-pointer mt-1"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#6E6E73]">Warna Teks</span>
              <div className="flex items-center gap-1.5">
                {['#FFFFFF', '#FFD700', '#00E5FF', '#FF2D55'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    style={{ backgroundColor: color }}
                    onClick={() => updateActiveIntro({ color })}
                    className={`w-3.5 h-3.5 rounded-full border border-black/20 shadow-2xs ${
                      activeIntro.color === color ? 'ring-2 ring-[#007AFF]' : ''
                    }`}
                  />
                ))}
                <input
                  type="text"
                  value={activeIntro.color}
                  onChange={(e) => updateActiveIntro({ color: e.target.value })}
                  className="w-16 px-1 py-0.5 bg-[#FFFFFF] border border-[#E5E7EB] rounded font-mono-data text-[7.5px] text-[#1D1D1F]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <div className="flex flex-col gap-0.5 p-1 rounded bg-[#F4F3F8]/60 border border-[#E5E7EB]">
                <span className="text-[#6E6E73]">Drop Shadow</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={activeIntro.dropShadow}
                  onChange={(e) => updateActiveIntro({ dropShadow: Number(e.target.value) })}
                  className="w-full accent-[#007AFF] h-1 bg-[#EEEDF3] rounded cursor-pointer"
                />
              </div>
              <div className="flex flex-col gap-0.5 p-1 rounded bg-[#F4F3F8]/60 border border-[#E5E7EB]">
                <span className="text-[#6E6E73]">Glow Effect</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={activeIntro.glow}
                  onChange={(e) => updateActiveIntro({ glow: Number(e.target.value) })}
                  className="w-full accent-[#007AFF] h-1 bg-[#EEEDF3] rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="pt-1 border-t border-[#E5E7EB] flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => setShowTypoModal(false)}
              className="px-2.5 py-0.5 rounded bg-[#007AFF] text-white font-medium text-[8.5px] shadow-2xs"
            >
              Terapkan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
