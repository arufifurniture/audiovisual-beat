import React, { useState, useRef, useEffect } from 'react';
import { VisualTrack } from '../../types/project';
import { formatTimecode } from '../../services/mediaAssetService';
import {
  PlayCircle,
  Pause,
  Play,
  RotateCcw,
  Repeat,
  Volume2,
  VolumeX,
  Maximize2,
  Image as ImageIcon,
  Film,
} from 'lucide-react';

interface FilePreviewModalProps {
  track: VisualTrack | null;
  isOpen: boolean;
  onClose: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ track, isOpen, onClose }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(track?.duration || 0);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(true);

  // Sync state whenever track opens or changes
  useEffect(() => {
    if (!isOpen || !track) return;
    setCurrentTime(0);
    setDuration(track.duration || 0);
    setIsPlaying(true);

    if (track.type === 'video' && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {
        setIsPlaying(false);
      });
    }
  }, [isOpen, track]);

  if (!isOpen || !track) return null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const restartPlayback = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      setCurrentTime(0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md select-none p-4">
      <div className="w-[580px] max-w-full bg-[#FFFFFF] rounded-xl shadow-2xl border border-[#E5E7EB] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#F4F3F8] border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2 min-w-0">
            {track.type === 'video' ? (
              <Film size={18} className="text-[#007AFF] shrink-0" />
            ) : (
              <ImageIcon size={18} className="text-[#007AFF] shrink-0" />
            )}
            <div className="truncate">
              <h3 className="font-semibold text-[12px] text-[#1D1D1F] truncate">{track.name}</h3>
              <p className="text-[9.5px] font-mono-data text-[#6E6E73] truncate">{track.info}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2 py-0.5 rounded bg-[#34C759]/15 text-[#006B27] font-mono-data text-[9px] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse" />
              {track.type === 'video' ? 'VIDEO SOURCE' : 'IMAGE SOURCE'}
            </span>
            <button
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#EEEDF3] text-[#717786] hover:text-[#1D1D1F] transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Real Media Preview Canvas / Viewport */}
        <div className="relative w-full h-72 bg-[#0B0F19] flex items-center justify-center overflow-hidden">
          {track.type === 'video' ? (
            <video
              ref={videoRef}
              src={track.url}
              loop={isLooping}
              muted={isMuted}
              playsInline
              autoPlay
              onTimeUpdate={() => {
                if (videoRef.current) {
                  setCurrentTime(videoRef.current.currentTime);
                }
              }}
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  setDuration(videoRef.current.duration || track.duration || 1);
                }
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="w-full h-full object-contain"
            />
          ) : (
            <img
              src={track.url}
              alt={track.name}
              className="w-full h-full object-contain"
            />
          )}

          {/* Real Timecode Overlay */}
          <div className="absolute bottom-3 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded text-[10px] text-white/90 font-mono-data border border-white/10">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                track.type === 'video' && isPlaying ? 'bg-red-500 animate-pulse' : 'bg-[#34C759]'
              }`}
            />
            <span>
              {track.type === 'video'
                ? `${isPlaying ? 'PLAY' : 'PAUSED'} • ${formatTimecode(currentTime)} / ${formatTimecode(duration)}`
                : `STATIC IMAGE • ${track.resolution}`}
            </span>
          </div>

          {track.type === 'video' && (
            <div className="absolute bottom-3 right-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] text-white/80 font-mono-data border border-white/10">
              <Repeat size={12} className={isLooping ? 'text-[#007AFF]' : 'text-white/40'} />
              <span>{isLooping ? 'Loop Active' : 'Single Play'}</span>
            </div>
          )}
        </div>

        {/* Real Interactive Controls for Video / Metadata for Image */}
        {track.type === 'video' ? (
          <div className="p-3 bg-[#FFFFFF] border-t border-[#E5E7EB] flex flex-col gap-2">
            {/* Real Seek Track */}
            <div className="flex items-center gap-2">
              <span className="font-mono-data text-[10px] text-[#1D1D1F] font-semibold w-10 text-right">
                {formatTimecode(currentTime)}
              </span>
              <input
                type="range"
                min="0"
                max={duration > 0 ? duration : 100}
                step="0.05"
                value={currentTime}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="flex-1 accent-[#007AFF] h-1.5 bg-[#EEEDF3] rounded cursor-pointer"
              />
              <span className="font-mono-data text-[10px] text-[#6E6E73] w-10">
                {formatTimecode(duration)}
              </span>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-between pt-0.5">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="px-3 py-1 rounded bg-[#007AFF] text-white font-medium text-[11px] flex items-center gap-1 hover:bg-[#0062CC] transition-colors shadow-2xs"
                >
                  {isPlaying ? <Pause size={13} /> : <Play size={13} />}
                  <span>{isPlaying ? 'Pause' : 'Play'}</span>
                </button>

                <button
                  type="button"
                  onClick={restartPlayback}
                  className="px-2.5 py-1 rounded bg-[#EEEDF3] text-[#1D1D1F] font-medium text-[11px] flex items-center gap-1 hover:bg-[#E3E2E7] transition-colors"
                  title="Mulai dari awal"
                >
                  <RotateCcw size={13} />
                  <span>Restart</span>
                </button>

                <button
                  type="button"
                  onClick={toggleMute}
                  className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
                    isMuted
                      ? 'bg-[#FFDAD6] text-[#BA1A1A]'
                      : 'bg-[#EEEDF3] text-[#1D1D1F] hover:bg-[#E3E2E7]'
                  }`}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                </button>

                <button
                  type="button"
                  onClick={() => setIsLooping(!isLooping)}
                  className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
                    isLooping
                      ? 'bg-[#D8E2FF] text-[#001A41]'
                      : 'bg-[#EEEDF3] text-[#717786]'
                  }`}
                  title="Toggle loop"
                >
                  <Repeat size={12} />
                  <span>Loop</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1 rounded bg-[#EEEDF3] text-[#1D1D1F] font-medium text-[11px] hover:bg-[#E3E2E7] transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-[#FFFFFF] border-t border-[#E5E7EB] flex items-center justify-between">
            <div className="text-[11px] text-[#6E6E73] flex items-center gap-3">
              <span>Resolusi: <b className="text-[#1D1D1F] font-mono-data">{track.resolution}</b></span>
              <span>Skala: <b className="text-[#1D1D1F] font-mono-data">{track.scale}x</b></span>
              <span>Blend: <b className="text-[#1D1D1F] font-mono-data">{track.blendMode}</b></span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1 rounded bg-[#007AFF] text-white font-medium text-[11px] hover:bg-[#0062CC] transition-colors shadow-2xs"
            >
              Tutup Preview
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
