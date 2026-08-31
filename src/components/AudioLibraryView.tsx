import React, { useRef, useState } from 'react';
import {
  Music,
  Upload,
  Play,
  Square,
  Trash2,
  Edit2,
  FileAudio,
  Check,
  X,
  Volume2,
  Radio,
  Clock,
  HardDrive,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { useBell } from '../context/BellContext';
import { AudioItem } from '../types';

export const AudioLibraryView: React.FC = () => {
  const {
    audioLibrary,
    uploadAudioFile,
    deleteAudioFile,
    renameAudioFile,
    previewAudioBlob,
    currentPlaying,
    stopAudio,
    schedules,
  } = useBell();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [renamingAudio, setRenamingAudio] = useState<AudioItem | null>(null);
  const [renameInput, setRenameInput] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a)$/i.test(file.name)) {
          await uploadAudioFile(file);
        }
      }
    } catch (err) {
      console.error('Error uploading audio files:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const getUsageCount = (audioId: string) => {
    return schedules.filter((s) => s.audioId === audioId).length;
  };

  const openRenameModal = (audio: AudioItem) => {
    setRenamingAudio(audio);
    setRenameInput(audio.name || audio.fileName);
  };

  const handleSaveRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (renamingAudio && renameInput.trim()) {
      await renameAudioFile(renamingAudio.id, renameInput.trim());
      setRenamingAudio(null);
    }
  };

  const filteredLibrary = audioLibrary.filter((audio) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      audio.name.toLowerCase().includes(q) ||
      audio.fileName.toLowerCase().includes(q)
    );
  });

  const totalStorageBytes = audioLibrary.reduce((acc, curr) => acc + (curr.size || 0), 0);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#112240] p-5 rounded-2xl border border-blue-900/30 shadow-lg">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">Penyimpanan Audio Lokal</div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2 mt-0.5">
            <Radio className="w-5 h-5 text-blue-400" />
            <span>AUDIO LIBRARY (Koleksi MP3)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Upload dan kelola rekaman file audio MP3/WAV milik sekolah Anda sendiri untuk diputar sesuai jadwal bel.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border border-blue-400/20"
          >
            <Upload className="w-4 h-4" />
            <span>{isUploading ? 'Sedang Mengunggah...' : 'Upload File MP3'}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,.wav,.ogg,.m4a,audio/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      </div>

      {/* Upload Drag-and-Drop Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-blue-400 bg-blue-950/50 scale-[1.005]'
            : 'border-blue-900/50 bg-[#0a192f]/90 hover:border-blue-700 hover:bg-[#0a192f]'
        }`}
      >
        <div className="max-w-md mx-auto space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-950/90 border border-blue-800 flex items-center justify-center mx-auto text-blue-400 shadow-inner">
            <Upload className="w-6 h-6 animate-bounce" />
          </div>
          <h4 className="text-sm font-bold text-white">
            Klik atau Tarik (Drag & Drop) File Audio MP3 ke Sini
          </h4>
          <p className="text-xs text-slate-400">
            Mendukung format <strong>.MP3, .WAV, .OGG, .M4A</strong>. File tersimpan aman di IndexedDB peramban Anda.
          </p>
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#112240] p-3.5 rounded-xl border border-blue-900/30">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Cari file audio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 bg-[#0a192f] border border-blue-900/60 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-mono">
            <FileAudio className="w-4 h-4 text-blue-400" />
            <strong className="text-white">{audioLibrary.length}</strong> Total File
          </span>
          <span className="flex items-center gap-1.5 font-mono">
            <HardDrive className="w-4 h-4 text-blue-400" />
            <strong className="text-white">{formatFileSize(totalStorageBytes)}</strong> Digunakan
          </span>
        </div>
      </div>

      {/* Uploaded Audio Files List */}
      <div className="space-y-3">
        {filteredLibrary.length === 0 ? (
          <div className="bg-[#112240] border border-blue-900/30 rounded-2xl p-12 text-center text-slate-400 space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-950/60 border border-blue-900/60 flex items-center justify-center mx-auto text-blue-400">
              <FileAudio className="w-6 h-6 text-slate-500" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-bold text-slate-300">
                {searchQuery ? 'Tidak ada file yang cocok dengan pencarian' : 'Belum ada file audio yang diupload'}
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Silakan upload file MP3 rekaman bel sekolah Anda menggunakan tombol upload di atas, lalu hubungkan ke jadwal bel pada menu Jadwal.
              </p>
            </div>
            {!searchQuery && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Pilih File MP3 Sekarang</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredLibrary.map((audio) => {
              const isPlayingThis = currentPlaying.isPlaying && currentPlaying.audioId === audio.id;
              const usage = getUsageCount(audio.id);

              return (
                <div
                  key={audio.id}
                  className={`bg-[#0a192f] border rounded-xl p-4 flex flex-col justify-between transition-all ${
                    isPlayingThis
                      ? 'border-blue-500 shadow-lg shadow-blue-950/60 bg-blue-950/40'
                      : 'border-blue-900/40 hover:border-blue-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-blue-950 border border-blue-800/80 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                        <FileAudio className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-white truncate">{audio.name}</h4>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{audio.fileName}</p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-mono">
                          <span>{formatDuration(audio.duration)}</span>
                          <span>•</span>
                          <span>{formatFileSize(audio.size)}</span>
                          {usage > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-blue-300 font-semibold">
                                Dipakai di {usage} Jadwal
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        title="Ubah Nama"
                        onClick={() => openRenameModal(audio)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-blue-900/40 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        title="Hapus File"
                        onClick={() => {
                          if (confirm(`Hapus file audio "${audio.name}" dari koleksi?`)) {
                            deleteAudioFile(audio.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Playback Control Bar */}
                  <div className="mt-3 pt-2.5 border-t border-blue-900/30 flex items-center justify-between">
                    <div className="text-[10px] text-slate-400 font-mono">
                      {isPlayingThis ? (
                        <span className="text-blue-400 font-bold animate-pulse">Sedang Memutar...</span>
                      ) : (
                        <span>ID: {audio.id.slice(0, 8)}</span>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        if (isPlayingThis) {
                          stopAudio();
                        } else {
                          previewAudioBlob(audio.blob, audio.name);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isPlayingThis
                          ? 'bg-rose-600 text-white hover:bg-rose-500'
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md border border-blue-400/20'
                      }`}
                    >
                      {isPlayingThis ? (
                        <>
                          <Square className="w-3 h-3 fill-current" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current" />
                          <span>Putar Audio</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rename Modal */}
      {renamingAudio && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#112240] border border-blue-800 rounded-2xl max-w-md w-full p-6 text-white animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
            <h3 className="text-base font-bold mb-4">Ubah Nama Audio</h3>
            <form onSubmit={handleSaveRename} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Nama Tampilan Baru
                </label>
                <input
                  type="text"
                  required
                  value={renameInput}
                  onChange={(e) => setRenameInput(e.target.value)}
                  className="w-full bg-[#0a192f] border border-blue-900/60 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRenamingAudio(null)}
                  className="px-4 py-2 bg-[#0a192f] hover:bg-blue-900/40 text-slate-300 font-bold text-xs rounded-xl border border-blue-900/40 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md border border-blue-400/20 cursor-pointer"
                >
                  Simpan Nama
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
