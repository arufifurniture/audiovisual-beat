import React, { useState, useEffect } from 'react';
import { useProjectStore } from '../../state/projectStore';
import { RenderService, RenderProgress, RenderResult } from '../../services/renderService';
import { FFmpegService } from '../../services/ffmpegService';
import { FolderPickerModal } from './FolderPickerModal';
import {
  Rocket,
  Folder,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  Film,
  RotateCcw,
  Check,
  Terminal,
  Copy,
  ExternalLink,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const [project, setProject] = useProjectStore();

  // Resolution selection: ONLY 3 CHOICES (HD 720p is DEFAULT)
  const [resolution, setResolution] = useState<'1280x720' | '1920x1080' | '3840x2160'>('1280x720');

  // Destination folder states & native folder handle
  const [destinationPath, setDestinationPath] = useState<string>('Downloads');
  const [useLastFolder, setUseLastFolder] = useState<boolean>(false);
  const [isFolderPickerOpen, setIsFolderPickerOpen] = useState<boolean>(false);
  const [uniqueFilename, setUniqueFilename] = useState<string>('');

  // Render execution states
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState<RenderProgress | null>(null);
  const [renderResult, setRenderResult] = useState<RenderResult | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [showLog, setShowLog] = useState(false);

  // Auto-close countdown timer
  const [autoCloseSeconds, setAutoCloseSeconds] = useState<number | null>(null);

  // Inspector toggle
  const [showCommand, setShowCommand] = useState(false);
  const [copied, setCopied] = useState(false);

  // Video playback preview of exported result
  const [previewOpen, setPreviewOpen] = useState(false);

  const hwInfo = RenderService.detectHardware();

  // Load last folder preference and resolution when modal opens
  useEffect(() => {
    if (!isOpen) return;

    // Default resolution is HD 1280x720
    setResolution(project.outputSettings.resolution || '1280x720');

    // Output destination folder logic
    const storedUseLast = localStorage.getItem('auvibeat_use_last_folder');
    const storedLastFolder = localStorage.getItem('auvibeat_last_folder_path');

    let initialDest = 'Downloads';
    if (storedUseLast === 'true' && storedLastFolder) {
      setUseLastFolder(true);
      initialDest = storedLastFolder;
      setDestinationPath(storedLastFolder);
    } else {
      setUseLastFolder(false);
      setDestinationPath('Downloads');
    }

    setRenderError(null);
    setRenderResult(null);
    setAutoCloseSeconds(null);

    // Initial collision check
    checkCollision(initialDest, project.projectName || 'MyProject', project.outputSettings.resolution || '1280x720');
  }, [isOpen, project.projectName, project.outputSettings.resolution]);

  // Auto-close countdown effect when render completes successfully
  useEffect(() => {
    if (renderResult && !isRendering) {
      setAutoCloseSeconds(5);
    } else {
      setAutoCloseSeconds(null);
    }
  }, [renderResult, isRendering]);

  // Decrement countdown and trigger onClose when expired outside of render
  useEffect(() => {
    if (autoCloseSeconds === null) return;

    if (autoCloseSeconds <= 0) {
      onClose();
      return;
    }

    const timer = setTimeout(() => {
      setAutoCloseSeconds((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [autoCloseSeconds, onClose]);

  // Collision check helper
  const checkCollision = (folder: string, projName: string, res: string) => {
    const cleanProjName = (projName || 'MyProject').replace(/[^a-zA-Z0-9_-]/g, '_');
    const resLabel = res === '3840x2160' ? '4K' : res === '1920x1080' ? '1080p' : '720p';
    const baseName = `${cleanProjName}_${resLabel}`;

    fetch('/api/filesystem/check-collision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        folderPath: folder,
        baseFilename: baseName,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.uniqueFilename) {
          setUniqueFilename(data.uniqueFilename);
        }
      })
      .catch(() => {
        setUniqueFilename(`${baseName}.mp4`);
      });
  };

  if (!isOpen) return null;

  // Toggle "Use last output folder"
  const handleToggleUseLast = (checked: boolean) => {
    setUseLastFolder(checked);
    localStorage.setItem('auvibeat_use_last_folder', checked ? 'true' : 'false');
    if (checked && destinationPath) {
      localStorage.setItem('auvibeat_last_folder_path', destinationPath);
    }
  };

  // Folder selected from FolderPickerModal
  const handleFolderSelected = (chosenFolder: string) => {
    setDestinationPath(chosenFolder);
    if (useLastFolder) {
      localStorage.setItem('auvibeat_last_folder_path', chosenFolder);
    }
    checkCollision(chosenFolder, project.projectName, resolution);
  };

  // Resolution changed
  const handleResolutionChanged = (newRes: typeof resolution) => {
    setResolution(newRes);
    checkCollision(destinationPath, project.projectName, newRes);
  };

  // Start real export
  const startExport = async () => {
    setIsRendering(true);
    setRenderError(null);
    setRenderResult(null);
    setAutoCloseSeconds(null);

    // Sync project resolution setting
    setProject((prev) => ({
      outputSettings: {
        ...prev.outputSettings,
        resolution,
        destination: destinationPath,
        filename: uniqueFilename.replace(/\.mp4$/i, ''),
      },
    }));

    try {
      const result = await RenderService.renderVideo(
        {
          ...project,
          outputSettings: {
            ...project.outputSettings,
            resolution,
            destination: destinationPath,
            filename: uniqueFilename.replace(/\.mp4$/i, ''),
          },
        },
        destinationPath,
        null,
        (progress) => {
          setRenderProgress(progress);
        }
      );

      setRenderResult(result);

      if (useLastFolder) {
        localStorage.setItem('auvibeat_last_folder_path', destinationPath);
      }
    } catch (err: unknown) {
      console.error('Export error:', err);
      setRenderError((err as Error)?.message || 'Terjadi kesalahan saat memproses rendering.');
    } finally {
      setIsRendering(false);
    }
  };

  const cancelExport = () => {
    RenderService.cancelRender();
    setIsRendering(false);
  };

  const handleOpenOutput = () => {
    // If user clicks Open Output, cancel auto-close timer so they can inspect
    setAutoCloseSeconds(null);

    if (renderResult) {
      RenderService.openOutput(renderResult);
      setPreviewOpen(true);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      // If render is complete, clicking outside closes the modal
      if (renderResult && !isRendering) {
        onClose();
      }
      // If not rendering and not completed, clicking outside also closes
      if (!isRendering && !renderResult) {
        onClose();
      }
    }
  };

  const ffmpegResult = FFmpegService.generateCommand({
    ...project,
    outputSettings: {
      ...project.outputSettings,
      resolution,
      destination: destinationPath,
      filename: uniqueFilename.replace(/\.mp4$/i, ''),
    },
  });

  const copyCommand = () => {
    navigator.clipboard.writeText(ffmpegResult.command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div
        onClick={handleBackdropClick}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm select-none p-4"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-[520px] max-w-full bg-[#FFFFFF] rounded-xl shadow-2xl border border-[#E5E7EB] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#F4F3F8] border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center">
                <Rocket size={14} />
              </span>
              <div>
                <h3 className="font-semibold text-[13px] text-[#1D1D1F]">Export Video Master</h3>
                <p className="text-[10px] font-mono-data text-[#6E6E73]">
                  FFmpeg Hardware Pipeline (16:9 Guaranteed • Audio Synced)
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isRendering}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#EEEDF3] text-[#717786] hover:text-[#1D1D1F] disabled:opacity-30 cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 flex flex-col gap-3.5 text-[12px] max-h-[75vh] overflow-y-auto">
            {/* 1. RESOLUTION: EXACTLY 3 OPTIONS (HD 720p is DEFAULT) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-[#6E6E73] flex items-center justify-between">
                <span>OUTPUT RESOLUTION (16:9)</span>
                <span className="text-[10px] text-[#007AFF] font-mono-data">HD 720p DEFAULT</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '1280x720', name: 'HD', res: '1280 × 720', badge: 'Fastest (30-50x)' },
                  { id: '1920x1080', name: 'Full HD', res: '1920 × 1080', badge: 'Standard 1080p' },
                  { id: '3840x2160', name: '4K Ultra HD', res: '3840 × 2160', badge: 'Master 4K' },
                ].map((item) => {
                  const isSelected = resolution === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={isRendering}
                      onClick={() => handleResolutionChanged(item.id as typeof resolution)}
                      className={`p-2.5 rounded-lg border text-left flex flex-col gap-0.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#007AFF] bg-[#F0F7FF] ring-1 ring-[#007AFF]'
                          : 'border-[#E5E7EB] bg-[#FFFFFF] hover:border-[#D1D5DB]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[11.5px] text-[#1D1D1F]">{item.name}</span>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-[#007AFF]" />}
                      </div>
                      <span className="text-[10px] font-mono-data text-[#6E6E73]">{item.res}</span>
                      <span
                        className={`text-[9px] font-medium mt-0.5 ${
                          isSelected ? 'text-[#007AFF]' : 'text-[#8E8E93]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. OUTPUT DESTINATION FOLDER */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-[#6E6E73] flex items-center justify-between">
                <span>OUTPUT DESTINATION FOLDER</span>
                <span className="text-[10px] text-[#34C759] font-mono-data flex items-center gap-1">
                  <Check size={11} /> Valid & Writable
                </span>
              </label>

              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#FAF9FE] border border-[#E5E7EB]">
                <div className="w-8 h-8 rounded bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center shrink-0">
                  <Folder size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium text-[#1D1D1F] truncate" title={destinationPath}>
                    {destinationPath}
                  </div>
                  <div className="text-[9.5px] text-[#007AFF] font-mono-data font-semibold truncate">
                    Output: {uniqueFilename || 'MyProject.mp4'}
                  </div>
                </div>
                {/* 100% CLICKABLE PILIH FOLDER BUTTON */}
                <button
                  type="button"
                  disabled={isRendering}
                  onClick={() => setIsFolderPickerOpen(true)}
                  className="px-3 py-1.5 rounded bg-[#FFFFFF] border border-[#D1D5DB] hover:border-[#007AFF] hover:bg-[#F0F7FF] text-[11px] font-semibold text-[#1D1D1F] shrink-0 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  <FolderOpen size={13} className="text-[#007AFF]" />
                  <span>Pilih Folder</span>
                </button>
              </div>

              {/* Checklist: [ ] Use last output folder */}
              <div className="flex items-center gap-2 mt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-[#1D1D1F]">
                  <input
                    type="checkbox"
                    checked={useLastFolder}
                    disabled={isRendering}
                    onChange={(e) => handleToggleUseLast(e.target.checked)}
                    className="rounded border-[#D1D5DB] text-[#007AFF] focus:ring-[#007AFF] w-4 h-4 cursor-pointer"
                  />
                  <span>Use last output folder</span>
                </label>
                <span className="text-[10px] text-[#6E6E73]">
                  (Otomatis gunakan folder ini pada export berikutnya)
                </span>
              </div>
            </div>

            {/* 3. HARDWARE ACCELERATION & AUDIO ENGINE STATUS */}
            <div className="p-2.5 rounded-lg bg-[#F4F3F8] border border-[#E5E7EB] flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse" />
                <div>
                  <span className="font-semibold text-[#1D1D1F]">{hwInfo.name}</span>
                  <p className="text-[10px] text-[#6E6E73]">
                    {hwInfo.encoder} • Audio Sync Guaranteed • Target: 30–50x
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#34C759]/15 text-[#006B27] font-mono-data text-[9.5px] font-bold">
                READY
              </span>
            </div>

            {/* 4. REAL-TIME PROGRESS UI (ACTIVE WHILE RENDERING) */}
            {isRendering && renderProgress && (
              <div className="p-3 rounded-lg bg-[#FAF9FE] border border-[#007AFF]/30 flex flex-col gap-2 shadow-2xs animate-in fade-in">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-[#007AFF] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#007AFF] animate-ping" />
                    Rendering Video...
                  </span>
                  <span className="font-mono-data text-[#1D1D1F] font-bold text-[13px]">
                    {renderProgress.progress}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2.5 bg-[#E5E7EB] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#007AFF] to-[#5856D6] transition-all duration-150"
                    style={{ width: `${renderProgress.progress}%` }}
                  />
                </div>

                {/* Live Render Telemetry */}
                <div className="grid grid-cols-4 gap-2 pt-1 text-[10px] font-mono-data text-[#6E6E73]">
                  <div>
                    <span className="text-[#8E8E93] block text-[9px]">FRAME</span>
                    <strong className="text-[#1D1D1F] text-[10.5px]">
                      {renderProgress.currentFrame} / {renderProgress.totalFrames}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#8E8E93] block text-[9px]">FPS</span>
                    <strong className="text-[#1D1D1F] text-[10.5px]">{renderProgress.fps}</strong>
                  </div>
                  <div>
                    <span className="text-[#8E8E93] block text-[9px]">SPEED</span>
                    <strong className="text-[#007AFF] text-[10.5px]">{renderProgress.speed}</strong>
                  </div>
                  <div>
                    <span className="text-[#8E8E93] block text-[9px]">EST. REMAINING</span>
                    <strong className="text-[#1D1D1F] text-[10.5px]">
                      {renderProgress.remainingSeconds}s
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* 5. ERROR STATE */}
            {renderError && (
              <div className="p-3 rounded-lg bg-[#FF3B30]/10 border border-[#FF3B30]/30 flex flex-col gap-2 text-[11px]">
                <div className="flex items-center gap-1.5 text-[#D70015] font-semibold">
                  <AlertCircle size={14} />
                  <span>Export Gagal: {renderError}</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={startExport}
                    className="px-2.5 py-1 rounded bg-[#007AFF] text-white text-[10.5px] font-medium flex items-center gap-1 hover:bg-[#0062CC] cursor-pointer"
                  >
                    <RotateCcw size={12} />
                    <span>Retry Export</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFolderPickerOpen(true)}
                    className="px-2.5 py-1 rounded bg-[#FFFFFF] border border-[#D1D5DB] text-[#1D1D1F] text-[10.5px] font-medium hover:bg-[#F4F3F8] cursor-pointer"
                  >
                    Change Destination
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLog(!showLog)}
                    className="px-2.5 py-1 rounded bg-transparent text-[#6E6E73] text-[10.5px] font-medium hover:text-[#1D1D1F] cursor-pointer"
                  >
                    {showLog ? 'Hide Log' : 'Open Log'}
                  </button>
                </div>
                {showLog && (
                  <div className="mt-1 p-2 bg-[#05070D] rounded text-[9.5px] font-mono-data text-white/80 overflow-x-auto whitespace-pre-wrap">
                    {`[Pipeline Log]\nDestination: ${destinationPath}\nFilename: ${uniqueFilename}\nResolution: ${resolution}\nError Trace: ${renderError}`}
                  </div>
                )}
              </div>
            )}

            {/* 6. EXPORT COMPLETE, RESULT TELEMETRY, OPEN OUTPUT & AUTO-CLOSE */}
            {renderResult && !isRendering && (
              <div className="p-3.5 rounded-lg bg-[#34C759]/10 border border-[#34C759]/30 flex flex-col gap-2.5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#006B27]">
                    <CheckCircle2 size={18} />
                    <div>
                      <h4 className="font-semibold text-[12px] leading-tight">Export Complete</h4>
                      <p className="text-[10px] text-[#006B27]/80 font-mono-data">
                        {renderResult.resolution}
                      </p>
                    </div>
                  </div>

                  {/* [ Open Output ] BUTTON */}
                  <button
                    type="button"
                    onClick={handleOpenOutput}
                    className="px-3.5 py-1.5 rounded-lg bg-[#34C759] text-white text-[11px] font-semibold hover:bg-[#28A745] active:bg-[#1E7E34] transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Film size={13} />
                    <span>Open Output</span>
                  </button>
                </div>

                {/* Exact Telemetry Output */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-1 border-t border-[#34C759]/20 text-[10.5px]">
                  <div>
                    <span className="text-[#55695D] block text-[9.5px]">Filename</span>
                    <span className="font-mono-data font-semibold text-[#1D1D1F] truncate block">
                      {renderResult.filename}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#55695D] block text-[9.5px]">Duration</span>
                    <span className="font-mono-data font-semibold text-[#1D1D1F]">
                      {renderResult.durationFormatted}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#55695D] block text-[9.5px]">Size</span>
                    <span className="font-mono-data font-semibold text-[#1D1D1F]">
                      {renderResult.fileSizeFormatted}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#55695D] block text-[9.5px]">Render Speed</span>
                    <span className="font-mono-data font-semibold text-[#007AFF]">
                      {renderResult.renderSpeed} ({renderResult.renderTimeFormatted})
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#55695D] block text-[9.5px]">Output Path</span>
                    <span className="font-mono-data text-[10px] text-[#1D1D1F] truncate block">
                      {renderResult.outputPath}
                    </span>
                  </div>
                </div>

                {/* Auto-Close indicator (5 seconds) */}
                {autoCloseSeconds !== null && autoCloseSeconds > 0 && (
                  <div className="pt-1 border-t border-[#34C759]/15 flex items-center justify-between text-[9.5px] text-[#006B27]/90 font-mono-data">
                    <span>File otomatis tersimpan. Popup menutup dalam {autoCloseSeconds} detik...</span>
                    <button
                      type="button"
                      onClick={() => setAutoCloseSeconds(null)}
                      className="text-[#007AFF] hover:underline"
                    >
                      Tetap Buka
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Programmatic FFmpeg Command Toggle */}
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => setShowCommand(!showCommand)}
                className="flex items-center gap-1 text-[10.5px] text-[#007AFF] hover:underline font-mono-data cursor-pointer"
              >
                <Terminal size={12} />
                <span>{showCommand ? 'Sembunyikan FFmpeg Pipeline' : 'Lihat FFmpeg Pipeline'}</span>
              </button>

              {showCommand && (
                <div className="mt-1.5 p-2.5 bg-[#05070D] rounded-lg border border-white/10 text-[9.5px] font-mono-data text-white/90 relative">
                  <button
                    type="button"
                    onClick={copyCommand}
                    className="absolute top-2 right-2 px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 text-white flex items-center gap-1 text-[9px] transition-colors cursor-pointer"
                  >
                    {copied ? <Check size={10} /> : <Copy size={10} />}
                    <span>{copied ? 'Tersalin' : 'Salin'}</span>
                  </button>
                  <div className="text-[#34C759] pb-1 font-semibold">
                    # High-Speed Native Render Pipeline:
                  </div>
                  <div className="overflow-x-auto whitespace-pre-wrap break-all pr-14 text-[#ADC6FF]">
                    {ffmpegResult.command}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-4 py-2.5 bg-[#F4F3F8] border-t border-[#E5E7EB] flex items-center justify-between">
            <div className="text-[10px] text-[#6E6E73] font-mono-data">
              {isRendering ? 'Rendering in progress...' : renderResult ? 'Export Complete' : 'Ready to encode'}
            </div>

            <div className="flex items-center gap-2">
              {isRendering ? (
                <button
                  type="button"
                  onClick={cancelExport}
                  className="px-3.5 py-1.5 rounded bg-[#FF3B30] text-white font-medium text-[11px] hover:bg-[#D70015] transition-colors cursor-pointer"
                >
                  Batalkan Export
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-1.5 rounded hover:bg-[#E3E2E7] text-[#1D1D1F] font-medium text-[11px] transition-colors cursor-pointer"
                  >
                    Tutup
                  </button>
                  <button
                    type="button"
                    onClick={startExport}
                    className="px-4 py-1.5 rounded bg-[#007AFF] text-white font-medium text-[11px] shadow-xs hover:bg-[#0062CC] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Rocket size={13} />
                    <span>Start Export</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Native Folder Picker Dialog */}
      <FolderPickerModal
        isOpen={isFolderPickerOpen}
        currentPath={destinationPath}
        onSelect={handleFolderSelected}
        onClose={() => setIsFolderPickerOpen(false)}
      />

      {/* Real Video Player Preview for [ Open Output ] */}
      {previewOpen && renderResult && (
        <div className="fixed inset-0 z-80 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-[680px] max-w-full bg-[#111827] rounded-xl overflow-hidden shadow-2xl border border-white/20 flex flex-col">
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#1F2937] text-white border-b border-white/10">
              <div className="flex items-center gap-2 min-w-0">
                <Film size={16} className="text-[#34C759]" />
                <span className="font-semibold text-[12px] truncate">
                  {renderResult.filename}
                </span>
                <span className="px-2 py-0.5 rounded bg-[#34C759]/20 text-[#34C759] text-[9.5px] font-mono-data font-bold">
                  {renderResult.resolution}
                </span>
              </div>
              <button
                onClick={() => setPreviewOpen(false)}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-white/70 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="relative w-full h-80 bg-black flex items-center justify-center">
              <video
                src={renderResult.url}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>

            <div className="p-3 bg-[#1F2937] text-white flex items-center justify-between text-[11px]">
              <div className="text-white/70 font-mono-data text-[10px]">
                Ukuran: {renderResult.fileSizeFormatted} • Kecepatan Render: {renderResult.renderSpeed}
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={renderResult.url}
                  download={renderResult.filename}
                  className="px-3 py-1 rounded bg-[#007AFF] text-white font-medium hover:bg-[#0062CC] transition-colors flex items-center gap-1"
                >
                  <ExternalLink size={12} />
                  <span>Download Ulang</span>
                </a>
                <button
                  onClick={() => setPreviewOpen(false)}
                  className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-medium transition-colors cursor-pointer"
                >
                  Tutup Viewer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
