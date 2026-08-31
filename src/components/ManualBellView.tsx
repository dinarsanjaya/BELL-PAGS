import React, { useState } from 'react';
import {
  Radio,
  Play,
  Square,
  AlertTriangle,
  Volume2,
  Bell,
  Sparkles,
  Music,
  CheckCircle2,
  FileAudio,
} from 'lucide-react';
import { useBell } from '../context/BellContext';
import { BUILT_IN_CHIMES } from '../services/audioEngine';

export const ManualBellView: React.FC = () => {
  const {
    audioLibrary,
    playManualBell,
    stopAudio,
    currentPlaying,
    previewAudioBlob,
  } = useBell();

  const [selectedAudioId, setSelectedAudioId] = useState<string>('');
  const [customTitle, setCustomTitle] = useState<string>('Bel Manual');
  const [volume, setVolume] = useState<number>(1.0);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [confirmPendingAction, setConfirmPendingAction] = useState<{
    audioId: string | null;
    title: string;
    vol: number;
  } | null>(null);

  const handleTriggerClick = (audioId: string | null, title: string, vol: number) => {
    setConfirmPendingAction({ audioId, title, vol });
    setShowConfirmModal(true);
  };

  const handleConfirmPlay = async () => {
    if (confirmPendingAction) {
      await playManualBell(
        confirmPendingAction.audioId,
        confirmPendingAction.title,
        confirmPendingAction.vol
      );
      setConfirmPendingAction(null);
      setShowConfirmModal(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-[#112240] p-5 rounded-2xl border border-blue-900/30 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">Kontrol Langsung</div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2 mt-0.5">
            <Radio className="w-5 h-5 text-blue-400" />
            <span>KONSOL BEL MANUAL</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Bunyikan bel sekolah secara langsung kapan saja menggunakan file MP3 yang Anda upload atau nada chime darurat.
          </p>
        </div>

        {currentPlaying.isPlaying && (
          <button
            onClick={stopAudio}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-900/40 transition-all flex items-center gap-1.5 animate-pulse cursor-pointer border border-rose-400/20"
          >
            <Square className="w-4 h-4 fill-current" />
            <span>HENTIKAN SUARA BEL</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Main Manual Bell Configurator */}
        <div className="lg:col-span-2 bg-[#112240] border border-blue-900/30 rounded-2xl p-6 shadow-lg space-y-4">
          <div className="border-b border-blue-900/40 pb-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pengaturan Pemutaran</div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
              <Bell className="w-4 h-4 text-blue-400" />
              <span>Parameter Bel Manual</span>
            </h3>
          </div>

          <div className="space-y-4">
            {/* Title / Label */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Keterangan / Label Pemutaran
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Contoh: Panggilan Apel Mendadak / Kumpul Guru"
                className="w-full bg-[#0a192f] border border-blue-900/60 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Audio Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Pilih File Audio MP3 / Chime
              </label>
              <select
                value={selectedAudioId}
                onChange={(e) => setSelectedAudioId(e.target.value)}
                className="w-full bg-[#0a192f] border border-blue-900/60 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Chime Westminster (Bawaan) --</option>
                
                {audioLibrary.length > 0 && (
                  <optgroup label="File MP3 yang Anda Upload">
                    {audioLibrary.map((audio) => (
                      <option key={audio.id} value={audio.id}>
                        {audio.name} ({audio.duration} detik)
                      </option>
                    ))}
                  </optgroup>
                )}

                <optgroup label="Nada Chime Standar">
                  {BUILT_IN_CHIMES.map((chime) => (
                    <option key={chime.id} value={chime.id}>
                      {chime.name}
                    </option>
                  ))}
                </optgroup>
              </select>
              {audioLibrary.length === 0 && (
                <p className="text-[11px] text-amber-400/90 mt-1.5">
                  Tips: Upload file MP3 di menu Audio Library agar dapat dipilih di sini.
                </p>
              )}
            </div>

            {/* Volume */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Volume Bel Manual
                </label>
                <span className="font-mono text-xs font-bold text-blue-400">
                  {Math.round(volume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-2 bg-[#0a192f] rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>

          {/* Big PLAY BELL NOW Button */}
          <div className="pt-3">
            <button
              onClick={() => handleTriggerClick(selectedAudioId || null, customTitle || 'Bel Manual', volume)}
              className="w-full py-4 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-base rounded-xl shadow-xl shadow-blue-950/80 transition-all transform active:scale-[0.99] flex items-center justify-center gap-2.5 cursor-pointer border border-blue-400/30"
            >
              <Play className="w-5 h-5 fill-current text-amber-300" />
              <span className="tracking-wide">BUNYIKAN BEL SEKARANG</span>
            </button>
            <p className="text-center text-[11px] text-slate-400 mt-2">
              Akan muncul jendela konfirmasi sebelum suara bel diputar ke pengeras suara.
            </p>
          </div>
        </div>

        {/* Right Col: Quick Triggers */}
        <div className="bg-[#112240] border border-blue-900/30 rounded-2xl p-6 shadow-lg space-y-3.5">
          <div className="border-b border-blue-900/40 pb-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Akses Cepat</div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Pintasan Cepat</span>
            </h3>
          </div>

          <div className="space-y-2.5">
            {audioLibrary.slice(0, 3).map((audio) => (
              <button
                key={audio.id}
                onClick={() => handleTriggerClick(audio.id, audio.name, 1.0)}
                className="w-full p-3 bg-[#0a192f] hover:bg-blue-900/30 border border-blue-900/40 rounded-xl text-left transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-bold text-xs text-white group-hover:text-blue-400 truncate">
                    {audio.name}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                    File Upload • {audio.duration}s
                  </div>
                </div>
                <Play className="w-4 h-4 text-slate-500 group-hover:text-blue-400 shrink-0" />
              </button>
            ))}

            <button
              onClick={() => handleTriggerClick('builtin-school-classic', 'Ding-Dong (2 Nada)', 1.0)}
              className="w-full p-3 bg-[#0a192f] hover:bg-blue-900/30 border border-blue-900/40 rounded-xl text-left transition-all flex items-center justify-between group cursor-pointer"
            >
              <div>
                <div className="font-bold text-xs text-white group-hover:text-blue-400">
                  Ding-Dong (2-Tone)
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Nada pergantian cepat</div>
              </div>
              <Play className="w-4 h-4 text-slate-500 group-hover:text-blue-400 shrink-0" />
            </button>

            <button
              onClick={() => handleTriggerClick('builtin-westminster', 'Full Westminster Chime', 1.0)}
              className="w-full p-3 bg-[#0a192f] hover:bg-blue-900/30 border border-blue-900/40 rounded-xl text-left transition-all flex items-center justify-between group cursor-pointer"
            >
              <div>
                <div className="font-bold text-xs text-white group-hover:text-blue-400">
                  Full Westminster Chime
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Chime 4-nada khas sekolah</div>
              </div>
              <Play className="w-4 h-4 text-slate-500 group-hover:text-blue-400 shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#112240] border-2 border-blue-500/80 rounded-2xl max-w-md w-full p-6 text-white text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-xl bg-blue-950 border border-blue-700 flex items-center justify-center mx-auto mb-3 text-amber-400">
              <Bell className="w-6 h-6 animate-bounce" />
            </div>

            <h3 className="text-lg font-bold text-white">Konfirmasi Pemutaran Bel Manual</h3>
            <p className="text-xs text-slate-300 mt-1">
              Apakah Anda yakin ingin membunyikan bel ini sekarang?
            </p>

            <div className="bg-[#0a192f] border border-blue-900/60 rounded-xl p-3.5 my-4 text-left">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Label Acara:</div>
              <div className="text-sm font-bold text-white mt-0.5">{confirmPendingAction?.title}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-2">Volume:</div>
              <div className="text-xs font-mono font-bold text-blue-400">
                {Math.round((confirmPendingAction?.vol || 1) * 100)}%
              </div>
            </div>

            <div className="flex items-center justify-center gap-2.5 mt-5">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmPendingAction(null);
                }}
                className="flex-1 py-2.5 bg-[#0a192f] hover:bg-blue-900/40 text-slate-300 font-bold text-xs rounded-xl border border-blue-900/40 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmPlay}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-900/50 border border-blue-400/20 cursor-pointer"
              >
                KONFIRMASI & PUTAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
