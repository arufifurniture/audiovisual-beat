import React, { useRef, useState } from 'react';
import { useProjectStore } from '../../state/projectStore';
import { VisualTrack } from '../../types/project';
import {
  Layers,
  Shuffle,
  Upload,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Trash2,
  Sliders,
  PlayCircle,
  Image as ImageIcon,
  FolderUp,
  FileUp,
} from 'lucide-react';

interface VisualPanelProps {
  onOpenSettings: (track: VisualTrack) => void;
  onOpenPreview: (track: VisualTrack) => void;
}

export const VisualPanel: React.FC<VisualPanelProps> = ({ onOpenSettings, onOpenPreview }) => {
  const [project, setProject] = useProjectStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  // Add files
  const handleFilesAdded = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newTracks: VisualTrack[] = Array.from(files).map((file, i) => {
      const isVideo = file.type.includes('video') || file.name.endsWith('.mp4') || file.name.endsWith('.mov');
      return {
        id: `visual-${Date.now()}-${i}`,
        name: file.name,
        type: isVideo ? 'video' : 'image',
        info: isVideo ? '1080p • 60fps • 00:20' : 'PNG/JPG Overlay • 1080p',
        duration: isVideo ? 20 : 10,
        resolution: '1920x1080',
        fps: 60,
        opacity: 100,
        scale: 1.0,
        rotation: 0,
        blendMode: 'Normal',
        anchor: 'CTR',
        isVisible: true,
        isMuted: true,
        chromaKey: false,
      };
    });

    setProject((prev) => ({
      visualTracks: [...prev.visualTracks, ...newTracks],
    }));
  };

  // Reorder actions
  const moveTrack = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= project.visualTracks.length) return;

    setProject((prev) => {
      const list = [...prev.visualTracks];
      const temp = list[index];
      list[index] = list[targetIdx];
      list[targetIdx] = temp;
      return { visualTracks: list };
    });
  };

  const deleteTrack = (id: string) => {
    setProject((prev) => ({
      visualTracks: prev.visualTracks.filter((t) => t.id !== id),
    }));
  };

  const toggleVisibility = (id: string) => {
    setProject((prev) => ({
      visualTracks: prev.visualTracks.map((t) => (t.id === id ? { ...t, isVisible: !t.isVisible } : t)),
    }));
  };

  const shuffleTracks = () => {
    setProject((prev) => {
      const shuffled = [...prev.visualTracks];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return { visualTracks: shuffled };
    });
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg flex flex-col overflow-hidden shadow-xs h-full">
      {/* Panel Header */}
      <div className="relative flex items-center justify-between px-3 py-1.5 border-b border-[#E5E7EB] bg-[#F4F3F8]/70 shrink-0 h-9">
        <div className="flex items-center gap-1.5 font-semibold text-[12px] text-[#1D1D1F]">
          <Layers size={14} className="text-[#007AFF]" />
          <span>Visual</span>
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
              title="Upload file atau folder"
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
                  <FileUp size={13} className="text-[#007AFF]" />
                  <span>Upload File (Satuan / Banyak)</span>
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
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => handleFilesAdded(e.target.files)}
          />
          <input
            ref={folderInputRef}
            type="file"
            multiple
            // @ts-expect-error directory attributes
            webkitdirectory="true"
            className="hidden"
            onChange={(e) => handleFilesAdded(e.target.files)}
          />
        </div>
      </div>

      {/* Panel Body */}
      <div className="p-2 flex-1 flex flex-col gap-2 overflow-hidden">
        {/* Dropzone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFilesAdded(e.dataTransfer.files);
          }}
          className="border border-dashed border-[#E5E7EB] hover:border-[#007AFF] rounded p-1.5 flex flex-col items-center justify-center bg-[#FAF9FE] text-center cursor-pointer transition-colors group shrink-0"
        >
          <Upload size={16} className="text-[#717786] group-hover:text-[#007AFF] transition-colors" />
          <span className="text-[10.5px] font-medium text-[#1D1D1F] mt-0.5">Drop video or image loops</span>
          <span className="text-[9px] text-[#6E6E73]">MP4, MOV, PNG up to 4K</span>
        </div>

        {/* Visual Item List */}
        <div className="flex-1 flex flex-col gap-1 overflow-y-auto pr-0.5">
          {project.visualTracks.map((track, index) => {
            const isFirst = index === 0;
            const isLast = index === project.visualTracks.length - 1;

            return (
              <div
                key={track.id}
                draggable
                onDragStart={() => setDraggedIdx(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggedIdx === null || draggedIdx === index) return;
                  const list = [...project.visualTracks];
                  const item = list.splice(draggedIdx, 1)[0];
                  list.splice(index, 0, item);
                  setProject({ visualTracks: list });
                  setDraggedIdx(null);
                }}
                className={`p-1.5 rounded bg-[#FFFFFF] border transition-all flex items-center justify-between gap-1 group ${
                  track.isVisible ? 'border-[#E5E7EB]' : 'border-[#E5E7EB] opacity-50'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  {/* Order badge */}
                  <span
                    className={`w-4 h-4 rounded text-[10px] font-mono-data font-bold flex items-center justify-center shrink-0 ${
                      index === 0
                        ? 'bg-[#D8E2FF] text-[#001A41]'
                        : 'bg-[#EEEDF3] text-[#414755]'
                    }`}
                  >
                    {index + 1}.
                  </span>

                  {/* Thumbnail / Play Preview Button */}
                  <button
                    onClick={() => onOpenPreview(track)}
                    className="relative w-7 h-7 rounded bg-[#007AFF]/10 border border-[#007AFF]/20 flex items-center justify-center text-[#007AFF] shrink-0 hover:bg-[#007AFF] hover:text-white transition-all group/btn"
                    title="Preview playback looping"
                  >
                    {track.type === 'video' ? <PlayCircle size={15} /> : <ImageIcon size={15} />}
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#34C759] ring-1 ring-white"></span>
                  </button>

                  <div className="truncate cursor-pointer" onClick={() => onOpenSettings(track)}>
                    <div className="text-[11px] font-medium text-[#1D1D1F] truncate">
                      {track.name}
                    </div>
                    <div className="text-[9px] text-[#6E6E73] font-mono-data">{track.info}</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    disabled={isFirst}
                    onClick={() => moveTrack(index, 'up')}
                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#EEEDF3] text-[#717786] hover:text-[#007AFF] disabled:opacity-20 disabled:pointer-events-none transition-colors"
                    title="Pindah ke atas"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    disabled={isLast}
                    onClick={() => moveTrack(index, 'down')}
                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#EEEDF3] text-[#717786] hover:text-[#007AFF] disabled:opacity-20 disabled:pointer-events-none transition-colors"
                    title="Pindah ke bawah"
                  >
                    <ArrowDown size={12} />
                  </button>
                  <button
                    onClick={() => toggleVisibility(track.id)}
                    className={`w-5 h-5 flex items-center justify-center rounded hover:bg-[#EEEDF3] transition-colors ${
                      track.isVisible ? 'text-[#007AFF]' : 'text-[#717786]'
                    }`}
                    title={track.isVisible ? 'Visible' : 'Hidden'}
                  >
                    {track.isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                  </button>
                  <button
                    onClick={() => deleteTrack(track.id)}
                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#FFDAD6] text-[#717786] hover:text-[#BA1A1A] transition-colors"
                    title="Hapus clip"
                  >
                    <Trash2 size={12} />
                  </button>
                  <button
                    onClick={() => onOpenSettings(track)}
                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#EEEDF3] text-[#717786] hover:text-[#007AFF] transition-colors"
                    title="Pengaturan Visual"
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
          <div className="flex items-center gap-1">
            <span className="font-mono-data text-[10px]">Drag or use arrows</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium text-[#1D1D1F]">Total:</span>
            <span className="px-2 py-0.5 rounded-full bg-[#D8E2FF] text-[#001A41] font-mono-data font-bold text-[10px]">
              {project.visualTracks.length} clips
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
