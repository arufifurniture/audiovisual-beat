import React, { useState, useEffect } from 'react';
import { useProjectStore, togglePlayback, undo, redo } from './state/projectStore';
import { VisualTrack, AudioTrack } from './types/project';

// Panels
import { TopToolbar } from './components/panels/TopToolbar';
import { VisualPanel } from './components/panels/VisualPanel';
import { AudioPanel } from './components/panels/AudioPanel';
import { IntroLogoPanel } from './components/panels/IntroLogoPanel';
import { VisualizerPanel } from './components/panels/VisualizerPanel';
import { EffectPanel } from './components/panels/EffectPanel';
import { BeatSyncPanel } from './components/panels/BeatSyncPanel';
import { BottomStatusBar } from './components/panels/BottomStatusBar';

// Canvas
import { RealtimeViewport } from './components/canvas/RealtimeViewport';

// Modals
import { ExportModal } from './components/modals/ExportModal';
import { FileSettingsModal } from './components/modals/FileSettingsModal';
import { AudioSettingsModal } from './components/modals/AudioSettingsModal';
import { FilePreviewModal } from './components/modals/FilePreviewModal';
import { FullscreenModal } from './components/modals/FullscreenModal';
import { DiagnosticsModal } from './components/modals/DiagnosticsModal';

export default function App() {
  const [project, setProject] = useProjectStore();
  const [currentTab, setCurrentTab] = useState('timeline');

  // Modal visibility states
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [selectedVisualTrack, setSelectedVisualTrack] = useState<VisualTrack | null>(null);
  const [previewVisualTrack, setPreviewVisualTrack] = useState<VisualTrack | null>(null);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<AudioTrack | null>(null);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focus is in an input or select
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayback();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setIsExportOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#FAF9FE] text-[#1D1D1F] select-none font-sans">
      {/* Top 48px macOS Toolbar */}
      <TopToolbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
      />

      {/* Main Workstation 2-Row Layout: fits 100% viewport without vertical page scroll */}
      <main className="flex-1 pt-12 pb-8 px-3 py-2 flex flex-col gap-2 overflow-hidden h-[calc(100vh-5rem)]">
        {/* TOP ROW: Visual (col 3), Viewport (col 6), Audio (col 3) */}
        <div className="grid grid-cols-12 gap-2 h-1/2 min-h-0">
          {/* Visual Shelf (Left ~25%) */}
          <div className="col-span-3 min-h-0 h-full">
            <VisualPanel
              onOpenSettings={(track) => setSelectedVisualTrack(track)}
              onOpenPreview={(track) => setPreviewVisualTrack(track)}
            />
          </div>

          {/* Real-time Viewport & Transport (Center ~50%) */}
          <div className="col-span-6 min-h-0 h-full">
            <RealtimeViewport
              onOpenExport={() => setIsExportOpen(true)}
              onOpenFullscreen={() => setIsFullscreenOpen(true)}
            />
          </div>

          {/* Audio Shelf (Right ~25%) */}
          <div className="col-span-3 min-h-0 h-full">
            <AudioPanel
              onOpenSettings={(track) => setSelectedAudioTrack(track)}
            />
          </div>
        </div>

        {/* BOTTOM ROW: 4 Compact Inspector Blocks (Intro & Logo, Visualizer, Effect, Beat & Sync) */}
        <div className="grid grid-cols-4 gap-2 h-1/2 min-h-0">
          {/* Block 1: Intro & Logo */}
          <div className="min-h-0 h-full">
            <IntroLogoPanel />
          </div>

          {/* Block 2: Visualizer */}
          <div className="min-h-0 h-full">
            <VisualizerPanel />
          </div>

          {/* Block 3: Effect */}
          <div className="min-h-0 h-full">
            <EffectPanel />
          </div>

          {/* Block 4: Beat & Sync */}
          <div className="min-h-0 h-full">
            <BeatSyncPanel />
          </div>
        </div>
      </main>

      {/* Fixed 32px Bottom Status Bar */}
      <BottomStatusBar
        onOpenPipeline={() => setIsExportOpen(true)}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
      />

      {/* Modals & Overlays */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />

      <FullscreenModal
        isOpen={isFullscreenOpen}
        onClose={() => setIsFullscreenOpen(false)}
      />

      <DiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
      />

      <FileSettingsModal
        track={selectedVisualTrack}
        isOpen={selectedVisualTrack !== null}
        onClose={() => setSelectedVisualTrack(null)}
        onUpdate={(updates) => {
          if (!selectedVisualTrack) return;
          setProject((prev) => ({
            visualTracks: prev.visualTracks.map((t) =>
              t.id === selectedVisualTrack.id ? { ...t, ...updates } : t
            ),
          }));
          setSelectedVisualTrack((prev) => (prev ? { ...prev, ...updates } : null));
        }}
      />

      <AudioSettingsModal
        track={selectedAudioTrack}
        isOpen={selectedAudioTrack !== null}
        onClose={() => setSelectedAudioTrack(null)}
        onUpdate={(updates) => {
          if (!selectedAudioTrack) return;
          setProject((prev) => ({
            audioTracks: prev.audioTracks.map((t) =>
              t.id === selectedAudioTrack.id ? { ...t, ...updates } : t
            ),
          }));
          setSelectedAudioTrack((prev) => (prev ? { ...prev, ...updates } : null));
        }}
      />

      <FilePreviewModal
        track={previewVisualTrack}
        isOpen={previewVisualTrack !== null}
        onClose={() => setPreviewVisualTrack(null)}
      />
    </div>
  );
}
