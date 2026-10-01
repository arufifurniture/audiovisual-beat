import React, { useState } from 'react';
import { useProjectStore } from '../../state/projectStore';
import { FFmpegService } from '../../services/ffmpegService';
import { Rocket, Terminal, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const [project, setProject] = useProjectStore();
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [showCommand, setShowCommand] = useState(false);
  const [copied, setCopied] = useState(false);
  const [renderComplete, setRenderComplete] = useState(false);

  if (!isOpen) return null;

  const ffmpegResult = FFmpegService.generateCommand(project);

  const startRender = () => {
    setIsRendering(true);
    setProgress(0);
    setCurrentFrame(0);
    setRenderComplete(false);

    const totalFrames = Math.floor(project.totalDuration * project.outputSettings.fps);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRendering(false);
          setRenderComplete(true);
          return 100;
        }
        const next = prev + 4;
        setCurrentFrame(Math.min(totalFrames, Math.floor((next / 100) * totalFrames)));
        return next;
      });
    }, 150);
  };

  const copyCommand = () => {
    navigator.clipboard.writeText(ffmpegResult.command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm select-none">
      <div className="w-[500px] bg-[#FFFFFF] rounded-xl shadow-2xl border border-[#E5E7EB] overflow-hidden flex flex-col">
        {/* macOS Window Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#F4F3F8] border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div
                onClick={onClose}
                className="w-3 h-3 rounded-full bg-[#FF5F56] border border-black/10 cursor-pointer"
                title="Close"
              />
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-black/10" />
              <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-black/10" />
            </div>
            <span className="font-semibold text-[13px] text-[#1D1D1F] ml-2">
              Export Video Project
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#EEEDF3] text-[#717786] hover:text-[#1D1D1F]"
          >
            ✕
          </button>
        </div>

        {/* Modal Form Body */}
        <div className="p-4 flex flex-col gap-3 text-[12px] max-h-[75vh] overflow-y-auto">
          {/* File Name */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-[#6E6E73]">FILE NAME</label>
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={project.outputSettings.filename}
                onChange={(e) =>
                  setProject((prev) => ({
                    outputSettings: { ...prev.outputSettings, filename: e.target.value },
                  }))
                }
                className="flex-1 px-3 py-1.5 bg-[#FFFFFF] border border-[#E5E7EB] rounded font-medium text-[#1D1D1F] text-[12px] focus:outline-[#007AFF]"
              />
              <span className="px-2 py-1.5 bg-[#EEEDF3] border border-[#E5E7EB] rounded font-mono-data text-[11px] text-[#6E6E73]">
                _01.mp4
              </span>
            </div>
            <span className="text-[10px] text-[#6E6E73]">
              Auto-increment activated: Next will render as _02.mp4
            </span>
          </div>

          {/* Destination Folder */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-[#6E6E73]">DESTINATION FOLDER</label>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FFFFFF] border border-[#E5E7EB] rounded">
              <span className="flex-1 font-mono-data text-[11px] text-[#1D1D1F] truncate">
                {project.outputSettings.destination}
              </span>
              <button
                type="button"
                onClick={() => {
                  const newPath = prompt('Tentukan path folder export:', project.outputSettings.destination);
                  if (newPath) {
                    setProject((prev) => ({
                      outputSettings: { ...prev.outputSettings, destination: newPath },
                    }));
                  }
                }}
                className="px-2 py-0.5 rounded bg-[#EEEDF3] hover:bg-[#E3E2E7] text-[10px] font-medium transition-colors"
              >
                Browse...
              </button>
            </div>
          </div>

          {/* Codec & Resolution */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-[#6E6E73]">CODEC / CONTAINER</label>
              <select
                value={project.outputSettings.codec}
                onChange={(e) =>
                  setProject((prev) => ({
                    outputSettings: {
                      ...prev.outputSettings,
                      codec: e.target.value as typeof project.outputSettings.codec,
                    },
                  }))
                }
                className="px-2 py-1.5 bg-[#FFFFFF] border border-[#E5E7EB] rounded font-medium text-[#1D1D1F] text-[11.5px]"
              >
                <option value="Apple ProRes 422 (Master Quality)">Apple ProRes 422 (Master Quality)</option>
                <option value="H.264 / MP4 (Hardware Fast)">H.264 / MP4 (Hardware Fast)</option>
                <option value="HEVC / H.265 (Ultra HD)">HEVC / H.265 (Ultra HD)</option>
                <option value="WebM (Transparent Alpha)">WebM (Transparent Alpha)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-[#6E6E73]">RESOLUTION & FPS</label>
              <select
                value={project.outputSettings.resolution}
                onChange={(e) =>
                  setProject((prev) => ({
                    outputSettings: {
                      ...prev.outputSettings,
                      resolution: e.target.value as typeof project.outputSettings.resolution,
                    },
                  }))
                }
                className="px-2 py-1.5 bg-[#FFFFFF] border border-[#E5E7EB] rounded font-medium text-[#1D1D1F] text-[11.5px]"
              >
                <option value="1920x1080">1920 x 1080 (1080p 60 FPS)</option>
                <option value="3840x2160">3840 x 2160 (4K UHD 60 FPS)</option>
                <option value="1080x1920">1080 x 1920 (9:16 Vertical Reel)</option>
                <option value="1080x1080">1080 x 1080 (1:1 Square)</option>
              </select>
            </div>
          </div>

          {/* Hardware acceleration badge */}
          <div className="p-2.5 rounded bg-[#F4F3F8] border border-[#E5E7EB] flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#007AFF]"></div>
              <div className="flex flex-col">
                <span className="font-medium text-[#1D1D1F]">
                  Metal GPU Hardware Acceleration (VideoToolbox)
                </span>
                <span className="text-[10px] text-[#6E6E73]">
                  Estimated Render Time: ~48 seconds • 3.8x realtime
                </span>
              </div>
            </div>
            <span className="font-mono-data font-semibold text-[#006B27]">READY</span>
          </div>

          {/* Live Render Progress view */}
          {isRendering && (
            <div className="p-3 rounded-lg bg-[#FAF9FE] border border-[#007AFF]/30 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-[#007AFF] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#007AFF] animate-ping" />
                  Rendering Video Pipeline...
                </span>
                <span className="font-mono-data text-[#1D1D1F] font-bold">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#007AFF] to-[#5856D6] transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono-data text-[#6E6E73]">
                <span>Frame: {currentFrame} / 26220</span>
                <span>Speed: 3.8x realtime (228 FPS)</span>
              </div>
            </div>
          )}

          {renderComplete && (
            <div className="p-3 rounded-lg bg-[#34C759]/10 border border-[#34C759]/30 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2 text-[#006B27]">
                <CheckCircle2 size={16} />
                <span className="font-medium">Render Complete! Output ready for YouTube upload.</span>
              </div>
              <button
                type="button"
                onClick={() => alert(`File saved to ${project.outputSettings.destination}/${project.outputSettings.filename}.mp4`)}
                className="px-2 py-0.5 rounded bg-[#34C759] text-white text-[10px] font-semibold hover:bg-[#008733]"
              >
                Open Output
              </button>
            </div>
          )}

          {/* Programmatic FFmpeg Command Inspector Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowCommand(!showCommand)}
              className="flex items-center gap-1 text-[10px] text-[#007AFF] hover:underline font-mono-data"
            >
              <Terminal size={12} />
              <span>{showCommand ? 'Hide FFmpeg Command' : 'View Generated FFmpeg Command'}</span>
            </button>

            {showCommand && (
              <div className="mt-1.5 p-2 bg-[#05070D] rounded border border-white/10 text-[9.5px] font-mono-data text-white/90 relative">
                <button
                  type="button"
                  onClick={copyCommand}
                  className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-white/20 hover:bg-white/30 text-white flex items-center gap-1 text-[8.5px]"
                >
                  {copied ? <Check size={10} /> : <Copy size={10} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <div className="text-[#34C759] pb-1"># Native local export execution:</div>
                <div className="overflow-x-auto whitespace-pre-wrap break-all pr-12 text-[#ADC6FF]">
                  {ffmpegResult.command}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 bg-[#F4F3F8] border-t border-[#E5E7EB] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1 rounded hover:bg-[#E3E2E7] text-[#1D1D1F] font-medium text-[11px]"
          >
            Cancel
          </button>
          <button
            disabled={isRendering}
            onClick={startRender}
            className="px-4 py-1.5 rounded bg-[#007AFF] text-white font-medium text-[11px] shadow-xs hover:bg-[#0062CC] disabled:opacity-50 flex items-center gap-1.5 transition-colors"
          >
            <Rocket size={13} />
            <span>{isRendering ? 'Rendering...' : 'Start Render & Export'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
