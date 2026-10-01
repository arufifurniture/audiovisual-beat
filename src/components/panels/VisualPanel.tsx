import React, { useRef, useState } from 'react';
import { useProjectStore } from '../../state/projectStore';
import { VisualTrack } from '../../types/project';
import { mediaAssetService } from '../../services/mediaAssetService';
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
  Loader2,
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
  const [isProcessing, setIsProcessing] = useState(false);

  // Add real files with metadata and thumbnail extraction
  const handleFilesAdded = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    try {
      const validFiles = Array.from(files).filter((file) =>
        file.type.startsWith('image/') ||
        file.type.startsWith('video/') ||
        /\.(mp4|mov|webm|m4v|mkv|avi|png|jpg|jpeg|gif|webp|svg)$/i.test(file.name)
      );

      if (validFiles.length === 0) return;

      const newTracks = await Promise.all(
        validFiles.map((file, i) => mediaAssetService.processVisualFile(file, i))
      );

      setProject((prev) => ({
        visualTracks: [...prev.visualTracks, ...newTracks],
        activeSelectionId: prev.activeSelectionId || newTracks[0]?.id || null,
        activeSelectionType: 'visual',
      }));
    } catch (err) {
      console.error('Error processing media files:', err);
    } finally {
      setIsProcessing(false);
    }
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

  // Revoke object URL on deletion to prevent memory leaks
  const deleteTrack = (id: string) => {
    const trackToDelete = project.visualTracks.find((t) => t.id === id);
    if (trackToDelete) {
      mediaAssetService.revokeTrack(trackToDelete);
    }
    setProject((prev) => {
      const updated = prev.visualTracks.filter((t) => t.id !== id);
      return {
        visualTracks: updated,
        activeSelectionId: prev.activeSelectionId === id ? (updated[0]?.id || null) : prev.activeSelectionId,
      };
    });
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
          {isProcessing && <Loader2 size={13} className="text-[#007AFF] animate-spin ml-1" />}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={shuffleTracks}
            disabled={project.visualTracks.length < 2}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#EEEDF3] text-[#717786] hover:text-[#1D1D1F] disabled:opacity-30 disabled:pointer-events-none transition-colors"
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
            onChange={(e) => {
              handleFilesAdded(e.target.files);
              e.target.value = '';
            }}
          />
          <input
            ref={folderInputRef}
            type="file"
            multiple
            // @ts-expect-error directory attributes
            webkitdirectory="true"
            className="hidden"
            onChange={(e) => {
              handleFilesAdded(e.target.files);
              e.target.value = '';
            }}
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
          className="border border-dashed border-[#E5E7EB] hover:border-[#007AFF] rounded p-2 flex flex-col items-center justify-center bg-[#FAF9FE] text-center cursor-pointer transition-colors group shrink-0"
        >
          {isProcessing ? (
            <div className="flex items-center gap-1.5 py-1">
              <Loader2 size={16} className="text-[#007AFF] animate-spin" />
              <span className="text-[11px] font-medium text-[#007AFF]">Membaca file asli & thumbnail...</span>
            </div>
          ) : (
            <>
              <Upload size={16} className="text-[#717786] group-hover:text-[#007AFF] transition-colors" />
              <span className="text-[10.5px] font-medium text-[#1D1D1F] mt-0.5">Drop video atau gambar asli</span>
              <span className="text-[9px] text-[#6E6E73]">MP4, MOV, WebM, PNG, JPG</span>
            </>
          )}
        </div>

        {/* Visual Item List */}
        <div className="flex-1 flex flex-col gap-1 overflow-y-auto pr-0.5">
          {project.visualTracks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-[#E5E7EB] rounded bg-[#FAF9FE]/50 text-[#717786]">
              <ImageIcon size={22} className="text-[#A0A4AE] mb-1.5" />
              <p className="text-[11px] font-medium text-[#1D1D1F]">Belum ada visual asset</p>
              <p className="text-[9.5px] text-[#6E6E73] mt-0.5 max-w-[200px]">
                Upload file video atau gambar di atas untuk menampilkan media asli di Canvas & Render Engine.
              </p>
            </div>
          ) : (
            project.visualTracks.map((track, index) => {
              const isFirst = index === 0;
              const isLast = index === project.visualTracks.length - 1;
              const isSelected = project.activeSelectionId === track.id;

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
                    isSelected
                      ? 'border-[#007AFF] ring-1 ring-[#007AFF]/20 bg-[#F0F7FF]'
                      : track.isVisible
                      ? 'border-[#E5E7EB] hover:border-[#D1D5DB]'
                      : 'border-[#E5E7EB] opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    {/* Order badge */}
                    <span
                      className={`w-4 h-4 rounded text-[9.5px] font-mono-data font-bold flex items-center justify-center shrink-0 ${
                        index === 0
                          ? 'bg-[#D8E2FF] text-[#001A41]'
                          : 'bg-[#EEEDF3] text-[#414755]'
                      }`}
                    >
                      {index + 1}
                    </span>

                    {/* Real Media Thumbnail & Play Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenPreview(track);
                      }}
                      className="relative w-8 h-8 rounded overflow-hidden bg-[#1E293B] border border-[#E5E7EB] flex items-center justify-center shrink-0 group/btn shadow-2xs hover:ring-1 hover:ring-[#007AFF] transition-all cursor-pointer"
                      title="Klik untuk test playback file asli"
                    >
                      {track.thumbnailUrl ? (
                        <img
                          src={track.thumbnailUrl}
                          alt={track.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/70">
                          {track.type === 'video' ? <PlayCircle size={14} /> : <ImageIcon size={14} />}
                        </div>
                      )}

                      {/* Video indicator badge */}
                      {track.type === 'video' && (
                        <div className="absolute inset-0 bg-black/35 flex items-center justify-center opacity-80 group-hover/btn:opacity-100 transition-opacity">
                          <PlayCircle size={15} className="text-white drop-shadow-sm fill-white/20" />
                        </div>
                      )}
                    </button>

                    {/* Metadata & Click to select for canvas */}
                    <div
                      className="truncate cursor-pointer flex-1"
                      onClick={() =>
                        setProject({
                          activeSelectionId: track.id,
                          activeSelectionType: 'visual',
                        })
                      }
                    >
                      <div className="text-[11px] font-medium text-[#1D1D1F] truncate" title={track.name}>
                        {track.name}
                      </div>
                      <div className="text-[9px] text-[#6E6E73] font-mono-data truncate">
                        {track.info}
                      </div>
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
                      title="Hapus media"
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
            })
          )}
        </div>

        {/* Footer info */}
        <div className="pt-1.5 border-t border-[#E5E7EB] flex items-center justify-between text-[10px] text-[#6E6E73] shrink-0">
          <div className="flex items-center gap-1">
            <span className="font-mono-data text-[10px]">Klik item untuk preview canvas</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium text-[#1D1D1F]">Total:</span>
            <span className="px-2 py-0.5 rounded-full bg-[#D8E2FF] text-[#001A41] font-mono-data font-bold text-[10px]">
              {project.visualTracks.length} media
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

