import React from 'react';
import { Volume2, Square, Bell, Sparkles } from 'lucide-react';
import { useBell } from '../context/BellContext';
import { formatTimeHHMM } from '../services/timeUtils';

export const FloatingAudioPlayer: React.FC = () => {
  const { currentPlaying, stopAudio, setMasterVolume, settings } = useBell();

  if (!currentPlaying.isPlaying) {
    return null;
  }

  const formatSeconds = (sec: number) => {
    const s = Math.floor(sec % 60);
    const m = Math.floor(sec / 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-[460px] z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-[#112240] backdrop-blur-xl border border-blue-500/70 rounded-2xl p-4 shadow-2xl shadow-[#001b3a] text-white relative overflow-hidden">
        {/* Glowing top ambient light */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-20 bg-blue-500/20 blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <div className="flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
              <span className="text-[10px] font-bold tracking-widest text-amber-300 uppercase">
                ACTIVE BROADCAST EMISSION
              </span>
            </div>
          </div>

          <span className="font-mono text-[11px] font-bold bg-[#0a192f] px-2 py-0.5 rounded text-blue-300 border border-blue-900/60">
            {formatTimeHHMM()} WIB
          </span>
        </div>

        {/* Event Name & File Name */}
        <div className="mb-2.5">
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
            {currentPlaying.eventName}
            {currentPlaying.isManual && (
              <span className="text-[9px] bg-blue-900/80 text-blue-200 px-1.5 py-0.5 rounded border border-blue-700 font-bold uppercase tracking-wider">
                Manual
              </span>
            )}
          </h3>
          <div className="text-[11px] text-slate-300 flex items-center gap-1.5 mt-0.5 truncate">
            <span className="text-slate-400 font-medium">Source:</span>
            <span className="font-mono text-blue-300 bg-[#0a192f] px-2 py-0.5 rounded text-[10px] border border-blue-900/40 truncate max-w-[280px]">
              {currentPlaying.audioName || 'Audio Bell Track'}
            </span>
          </div>
        </div>

        {/* Audio Live Progress Bar */}
        <div className="space-y-1 mb-2.5">
          <div className="w-full bg-[#0a192f] h-2 rounded-full overflow-hidden p-0.5 border border-blue-900/40">
            <div
              className="bg-gradient-to-r from-blue-500 via-blue-400 to-amber-400 h-full rounded-full transition-all duration-100 ease-linear shadow-sm"
              style={{ width: `${Math.max(2, Math.min(100, currentPlaying.progress))}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>{formatSeconds(currentPlaying.currentTime)}</span>
            <span>{formatSeconds(currentPlaying.duration)}</span>
          </div>
        </div>

        {/* Controls: Volume and Stop Button */}
        <div className="flex items-center justify-between pt-2 border-t border-blue-900/40">
          <div className="flex items-center gap-2">
            <Volume2 className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.masterVolume}
              onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
              className="w-20 h-1.5 bg-[#0a192f] rounded-lg appearance-none cursor-pointer accent-blue-500"
              title={`Volume: ${Math.round(settings.masterVolume * 100)}%`}
            />
            <span className="text-[11px] font-mono text-slate-300 w-8">
              {Math.round(settings.masterVolume * 100)}%
            </span>
          </div>

          <button
            onClick={stopAudio}
            className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-rose-900/40 active:scale-95 cursor-pointer border border-rose-400/20"
          >
            <Square className="w-3 h-3 fill-current" />
            <span>STOP AUDIO</span>
          </button>
        </div>
      </div>
    </div>
  );
};
