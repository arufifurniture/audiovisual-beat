import React, { useState, useEffect } from 'react';
import {
  Folder,
  FolderOpen,
  Monitor,
  Download,
  Film,
  FileText,
  ChevronRight,
  ArrowUp,
  Check,
  AlertCircle,
  HardDrive,
} from 'lucide-react';

interface FolderPickerModalProps {
  isOpen: boolean;
  currentPath: string;
  onSelect: (folderPath: string) => void;
  onClose: () => void;
}

interface FolderItem {
  name: string;
  path: string;
  isWritable: boolean;
}

export const FolderPickerModal: React.FC<FolderPickerModalProps> = ({
  isOpen,
  currentPath: initialPath,
  onSelect,
  onClose,
}) => {
  const [activePath, setActivePath] = useState<string>(initialPath || 'Downloads');
  const [subfolders, setSubfolders] = useState<FolderItem[]>([]);
  const [parentPath, setParentPath] = useState<string>('');
  const [isWritable, setIsWritable] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [quickFolders, setQuickFolders] = useState<{ name: string; path: string }[]>([]);

  // Fetch system defaults and current directory
  useEffect(() => {
    if (!isOpen) return;

    fetch('/api/filesystem/system-info')
      .then((r) => r.json())
      .then((data) => {
        if (data.defaultFolders) {
          setQuickFolders(data.defaultFolders);
        }
      })
      .catch(() => {});

    loadFolder(initialPath || 'Downloads');
  }, [isOpen, initialPath]);

  const loadFolder = async (folderPath: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/filesystem/list-folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPath: folderPath }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal membaca direktori');
      }
      setActivePath(data.currentPath);
      setParentPath(data.parentPath || '');
      setIsWritable(data.isWritable ?? true);
      setSubfolders(data.subfolders || []);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleConfirm = () => {
    onSelect(activePath);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none animate-in fade-in">
      <div className="w-[580px] max-w-full bg-[#FFFFFF] rounded-xl shadow-2xl border border-[#E5E7EB] overflow-hidden flex flex-col h-[460px]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#F4F3F8] border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center">
              <FolderOpen size={14} />
            </div>
            <div>
              <h3 className="font-semibold text-[13px] text-[#1D1D1F]">Pilih Folder Tujuan Export</h3>
              <p className="text-[10px] text-[#6E6E73] font-mono-data">Desktop Native Filesystem Dialog</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#EEEDF3] text-[#717786] hover:text-[#1D1D1F]"
          >
            ✕
          </button>
        </div>

        {/* Path Bar & Navigation */}
        <div className="px-3 py-1.5 bg-[#FAF9FE] border-b border-[#E5E7EB] flex items-center gap-2 text-[11px]">
          <button
            type="button"
            disabled={!parentPath || parentPath === activePath}
            onClick={() => loadFolder(parentPath)}
            className="p-1 rounded hover:bg-[#EEEDF3] text-[#1D1D1F] disabled:opacity-30 disabled:pointer-events-none"
            title="Ke Folder Induk (Parent)"
          >
            <ArrowUp size={14} />
          </button>

          <div className="flex-1 px-2.5 py-1 bg-[#FFFFFF] border border-[#E5E7EB] rounded font-mono-data text-[11px] text-[#1D1D1F] truncate flex items-center gap-1">
            <HardDrive size={12} className="text-[#007AFF] shrink-0" />
            <span className="truncate">{activePath}</span>
          </div>

          {isWritable ? (
            <span className="px-1.5 py-0.5 rounded bg-[#34C759]/15 text-[#006B27] font-mono-data text-[9.5px] font-semibold shrink-0 flex items-center gap-0.5">
              <Check size={10} /> Writable
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded bg-[#FF3B30]/15 text-[#D70015] font-mono-data text-[9.5px] font-semibold shrink-0 flex items-center gap-0.5">
              <AlertCircle size={10} /> Read Only
            </span>
          )}
        </div>

        {/* Content Layout: Quick Sidebar + Folder List */}
        <div className="flex-1 flex overflow-hidden">
          {/* Quick Shortcuts Sidebar */}
          <div className="w-40 bg-[#F4F3F8]/70 border-r border-[#E5E7EB] p-2 flex flex-col gap-1 shrink-0 text-[11px]">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#6E6E73] px-1.5 py-1">
              Lokasi Cepat
            </span>
            <button
              type="button"
              onClick={() => loadFolder('Downloads')}
              className={`flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors ${
                activePath.includes('Downloads')
                  ? 'bg-[#007AFF] text-white font-medium'
                  : 'hover:bg-[#E3E2E7] text-[#1D1D1F]'
              }`}
            >
              <Download size={13} />
              <span>Downloads</span>
            </button>
            <button
              type="button"
              onClick={() => loadFolder('Movies')}
              className={`flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors ${
                activePath.includes('Movies') || activePath.includes('Videos')
                  ? 'bg-[#007AFF] text-white font-medium'
                  : 'hover:bg-[#E3E2E7] text-[#1D1D1F]'
              }`}
            >
              <Film size={13} />
              <span>Movies</span>
            </button>
            <button
              type="button"
              onClick={() => loadFolder('Desktop')}
              className={`flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors ${
                activePath.includes('Desktop')
                  ? 'bg-[#007AFF] text-white font-medium'
                  : 'hover:bg-[#E3E2E7] text-[#1D1D1F]'
              }`}
            >
              <Monitor size={13} />
              <span>Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => loadFolder('Documents')}
              className={`flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors ${
                activePath.includes('Documents')
                  ? 'bg-[#007AFF] text-white font-medium'
                  : 'hover:bg-[#E3E2E7] text-[#1D1D1F]'
              }`}
            >
              <FileText size={13} />
              <span>Documents</span>
            </button>

            {quickFolders.length > 0 && (
              <div className="pt-2 border-t border-[#E5E7EB] mt-1 flex flex-col gap-0.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#6E6E73] px-1.5">
                  System Paths
                </span>
                {quickFolders.map((q) => (
                  <button
                    key={q.name}
                    type="button"
                    onClick={() => loadFolder(q.path)}
                    className="text-[10px] px-1.5 py-1 text-left text-[#6E6E73] hover:text-[#1D1D1F] truncate"
                    title={q.path}
                  >
                    {q.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Folder List Main View */}
          <div className="flex-1 p-2 overflow-y-auto flex flex-col gap-1">
            {error && (
              <div className="p-2.5 rounded bg-[#FF3B30]/10 text-[#D70015] text-[11px] flex items-center gap-1.5">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            {isLoading ? (
              <div className="flex-1 flex items-center justify-center text-[11px] text-[#6E6E73]">
                Memuat direktori...
              </div>
            ) : subfolders.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-[#8E8E93]">
                <Folder size={28} className="text-[#D1D5DB] mb-1" />
                <p className="text-[11px] font-medium text-[#1D1D1F]">Tidak ada subfolder</p>
                <p className="text-[10px] text-[#6E6E73]">
                  Folder ini dapat langsung dipilih sebagai tujuan export.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-0.5">
                {subfolders.map((folder) => (
                  <div
                    key={folder.path}
                    onClick={() => loadFolder(folder.path)}
                    className="flex items-center justify-between p-2 rounded hover:bg-[#F4F3F8] cursor-pointer text-[11.5px] group transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Folder size={16} className="text-[#007AFF] group-hover:scale-105 transition-transform" />
                      <span className="font-medium text-[#1D1D1F] truncate">{folder.name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[#8E8E93]">
                      <ChevronRight size={14} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-[#F4F3F8] border-t border-[#E5E7EB] flex items-center justify-between">
          <div className="text-[10.5px] font-mono-data text-[#6E6E73] truncate max-w-[280px]">
            Dipilih: {activePath}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded hover:bg-[#E3E2E7] text-[#1D1D1F] font-medium text-[11px]"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={!isWritable}
              onClick={handleConfirm}
              className="px-4 py-1.5 rounded bg-[#007AFF] text-white font-medium text-[11px] shadow-xs hover:bg-[#0062CC] disabled:opacity-50 flex items-center gap-1.5"
            >
              <Check size={13} />
              <span>Pilih Folder Ini</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
