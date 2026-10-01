import React, { useRef, useState } from 'react';
import { useProjectStore } from '../../state/projectStore';
import { AudioTrack } from '../../types/project';
import { audioEngine } from '../../services/audioEngine';
import {
  Sliders,
  Shuffle,
  Upload,
  ArrowUp,
  ArrowDown,
  Trash2,
  Play,
  Pause,
  Clock,
  Music,
  FolderUp,
  FileUp,
  Library,
} from 'lucide-react';

interface AudioPanelProps {
  onOpenSettings: (track: AudioTrack) => void;
}

export const AudioPanel: React.FC<AudioPanelProps> = ({ onOpenSettings }) => {
  const [project, setProject] = useProjectStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const multiFileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  // Format seconds to MM:SS or HH:MM:SS
  const formatDuration = (totalSecs: number) => {
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = Math.floor(totalSecs % 60);
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Add files with real duration detection
  const handleAudioFilesAdded = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file, i) => {
      const audioUrl = URL.createObjectURL(file);
      const tempAudio = new Audio();
      tempAudio.src = audioUrl;

      tempAudio.onloadedmetadata = () => {
        const dur = Math.round(tempAudio.duration) || 180;
        const newTrack: AudioTrack = {
          id: `audio-${Date.now()}-${i}`,
          name: file.name,
          info: `${formatDuration(dur)} • 44.1kHz / 24-bit`,
          duration: dur,
          sampleRate: '44.1 kHz',
          bitrate: '24-bit',
          url: audioUrl,
          gainDb: 0,
          pan: 0,
          eqLowDb: 0,
          eqMidDb: 0,
          eqHighDb: 0,
          isMuted: false,
          isSolo: false,
        };

        setProject((prev) => ({
          audioTracks: [...prev.audioTracks, newTrack],
        }));
      };
    });
  };

  // Reorder
  const moveTrack = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= project.audioTracks.length) return;

    setProject((prev) => {
      const list = [...prev.audioTracks];
      const temp = list[index];
      list[index] = list[targetIdx];
      list[targetIdx] = temp;
      return { audioTracks: list };
    });
  };

  const deleteTrack = (id: string) => {
    setProject((prev) => ({
      audioTracks: prev.audioTracks.filter((t) => t.id !== id),
    }));
  };

  const shuffleTracks = () => {
    setProject((prev) => {
      const shuffled = [...prev.audioTracks];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return { audioTracks: shuffled };
    });
  };

  // Play test single track
  const togglePlayTrack = (track: AudioTrack) => {
    if (playingTrackId === track.id) {
      audioEngine.pausePlayback();
      setPlayingTrackId(null);
    } else {
      audioEngine.startPlayback(track.url);
      setPlayingTrackId(track.id);
    }
  };

  const totalDurationSeconds = project.audioTracks.reduce((acc, t) => acc + (t.duration || 0), 0);

  return (
    <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg flex flex-col overflow-hidden shadow-xs h-full">
      {/* Panel Header */}
      <div className="relative flex items-center justify-between px-3 py-1.5 border-b border-[#E5E7EB] bg-[#F4F3F8]/70 shrink-0 h-9">
        <div className="flex items-center gap-1.5 font-semibold text-[12px] text-[#1D1D1F]">
          <Music size={14} className="text-[#5856D6]" />
          <span>Audio</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={shuffleTracks}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#EEEDF3] text-[#717786] hover:text-[#1D1D1F] transition-colors"
            title="Acak urutan / Shuffle"
          >
            <Shuffle size={13} />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowUploadMenu(!showUploadMenu)}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#EEEDF3] text-[#717786] hover:text-[#1D1D1F] transition-colors"
              title="Upload audio file atau folder"
            >
              <Upload size={13} />
            </button>

            {showUploadMenu && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg shadow-lg py-1 z-50 text-[11px] font-medium">
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                    setShowUploadMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#F4F3F8] text-left text-[#1D1D1F]"
                >
                  <FileUp size={13} className="text-[#5856D6]" />
                  <span>Upload File</span>
                </button>
                <button
                  onClick={() => {
                    multiFileInputRef.current?.click();
                    setShowUploadMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#F4F3F8] text-left text-[#1D1D1F]"
                >
                  <Library size={13} className="text-[#5856D6]" />
                  <span>Upload Multiple Files</span>
                </button>
                <button
                  onClick={() => {
                    folderInputRef.current?.click();
                    setShowUploadMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#F4F3F8] text-left text-[#1D1D1F]"
                >
                  <FolderUp size={13} className="text-[#5856D6]" />
                  <span>Upload Folder</span>
                </button>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => handleAudioFilesAdded(e.target.files)}
          />
          <input
            ref={multiFileInputRef}
            type="file"
            multiple
            accept="audio/*"
            className="hidden"
            onChange={(e) => handleAudioFilesAdded(e.target.files)}
          />
          <input
            ref={folderInputRef}
            type="file"
            multiple
            // @ts-expect-error webkitdirectory
            webkitdirectory="true"
            className="hidden"
            onChange={(e) => handleAudioFilesAdded(e.target.files)}
          />
        </div>
      </div>

      {/* Panel Body */}
      <div className="p-2 flex-1 flex flex-col gap-2 overflow-hidden">
        {/* Dropzone */}
        <div
          onClick={() => multiFileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleAudioFilesAdded(e.dataTransfer.files);
          }}
          className="border border-dashed border-[#E5E7EB] hover:border-[#5856D6] rounded p-1.5 flex flex-col items-center justify-center bg-[#FAF9FE] text-center cursor-pointer transition-colors group shrink-0"
        >
          <Upload size={16} className="text-[#717786] group-hover:text-[#5856D6] transition-colors" />
          <span className="text-[10.5px] font-medium text-[#1D1D1F] mt-0.5">Drop audio files here</span>
          <span className="text-[9px] text-[#6E6E73]">WAV, MP3, FLAC, AIFF up to 24-bit</span>
        </div>

        {/* Audio Track List */}
        <div className="flex-1 flex flex-col gap-1 overflow-y-auto pr-0.5">
          {project.audioTracks.map((track, index) => {
            const isFirst = index === 0;
            const isLast = index === project.audioTracks.length - 1;
            const isPlaying = playingTrackId === track.id;

            return (
              <div
                key={track.id}
                draggable
                onDragStart={() => setDraggedIdx(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggedIdx === null || draggedIdx === index) return;
                  const list = [...project.audioTracks];
                  const item = list.splice(draggedIdx, 1)[0];
                  list.splice(index, 0, item);
                  setProject({ audioTracks: list });
                  setDraggedIdx(null);
                }}
                className={`p-1.5 rounded bg-[#FFFFFF] border transition-all flex items-center justify-between gap-1 group ${
                  isPlaying ? 'border-[#5856D6] shadow-xs' : 'border-[#E5E7EB]'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  {/* Order badge */}
                  <span
                    className={`w-4 h-4 rounded text-[10px] font-mono-data font-bold flex items-center justify-center shrink-0 ${
                      index === 0
                        ? 'bg-[#E2DFFF] text-[#0C006A]'
                        : 'bg-[#EEEDF3] text-[#414755]'
                    }`}
                  >
                    {index + 1}.
                  </span>

                  {/* Play / Pause button */}
                  <button
                    onClick={() => togglePlayTrack(track)}
                    className="relative w-7 h-7 rounded bg-[#5856D6]/10 border border-[#5856D6]/20 flex items-center justify-center text-[#5856D6] shrink-0 hover:bg-[#5856D6] hover:text-white transition-all"
                    title={isPlaying ? 'Pause track' : 'Play track'}
                  >
                    {isPlaying ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
                  </button>

                  <div className="truncate cursor-pointer flex-1" onClick={() => onOpenSettings(track)}>
                    <div className="text-[11px] font-medium text-[#1D1D1F] truncate flex items-center gap-1.5">
                      <span>{track.name}</span>
                      {isPlaying && (
                        <div className="flex items-end gap-0.5 h-3 shrink-0">
                          <span className="w-0.5 bg-[#5856D6] h-full animate-pulse rounded-full"></span>
                          <span className="w-0.5 bg-[#5856D6] h-2/3 animate-pulse rounded-full" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-0.5 bg-[#5856D6] h-3/4 animate-pulse rounded-full" style={{ animationDelay: '300ms' }}></span>
                        </div>
                      )}
                    </div>
                    <div className="text-[9px] text-[#6E6E73] font-mono-data">{track.info}</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    disabled={isFirst}
                    onClick={() => moveTrack(index, 'up')}
                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#EEEDF3] text-[#717786] hover:text-[#5856D6] disabled:opacity-20 disabled:pointer-events-none transition-colors"
                    title="Pindah ke atas"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    disabled={isLast}
                    onClick={() => moveTrack(index, 'down')}
                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#EEEDF3] text-[#717786] hover:text-[#5856D6] disabled:opacity-20 disabled:pointer-events-none transition-colors"
                    title="Pindah ke bawah"
                  >
                    <ArrowDown size={12} />
                  </button>
                  <button
                    onClick={() => deleteTrack(track.id)}
                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#FFDAD6] text-[#717786] hover:text-[#BA1A1A] transition-colors"
                    title="Hapus track"
                  >
                    <Trash2 size={12} />
                  </button>
                  <button
                    onClick={() => onOpenSettings(track)}
                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#EEEDF3] text-[#717786] hover:text-[#5856D6] transition-colors"
                    title="Pengaturan Audio & EQ"
                  >
                    <Sliders size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-1.5 border-t border-[#E5E7EB] flex items-center justify-between text-[10px] text-[#6E6E73] shrink-0">
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-[#5856D6]" />
            <span className="font-mono-data text-[10px]">
              Total: {formatDuration(totalDurationSeconds)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium text-[#1D1D1F]">Total:</span>
            <span className="px-2 py-0.5 rounded-full bg-[#E2DFFF] text-[#0C006A] font-mono-data font-bold text-[10px] flex items-center gap-1">
              <Music size={10} />
              <span>{project.audioTracks.length} Tracks</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
