import React, { useEffect } from 'react';
import { Minimize2, Bell, ShieldCheck, Square, Volume2, Calendar } from 'lucide-react';
import { useBell } from '../context/BellContext';
import { formatCountdown } from '../services/timeUtils';

interface FullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FullscreenModal: React.FC<FullscreenModalProps> = ({ isOpen, onClose }) => {
  const {
    currentTimeString,
    currentDateDisplayEN,
    currentDateDisplayID,
    currentDayNameEN,
    settings,
    currentActivityName,
    currentActivityTimeRange,
    nextBell,
    countdownSeconds,
    currentPlaying,
    stopAudio,
    toggleSystemActive,
  } = useBell();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0a192f] text-slate-100 flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden font-sans">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-blue-900/40 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center">
            <Bell className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">Institutional Broadcast Terminal</div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5">
              PRADITYA ADHIGANA GLOBAL SCHOOL
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold ${
              settings.isSystemActive
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                : 'bg-amber-950/60 border-amber-500/50 text-amber-300'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${settings.isSystemActive ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
            <span className="tracking-wide">{settings.isSystemActive ? 'AUTOMATIC BELL ACTIVE' : 'BELL SCHEDULER PAUSED'}</span>
          </div>

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#112240] hover:bg-blue-900/40 text-slate-200 rounded-xl text-xs font-bold border border-blue-900/40 transition-all cursor-pointer"
          >
            <Minimize2 className="w-4 h-4" />
            <span>Close (ESC)</span>
          </button>
        </div>
      </div>

      {/* Main Center Clock */}
      <div className="flex-1 flex flex-col items-center justify-center my-4 text-center">
        <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-blue-400 mb-2">Hardware Synchronized WIB Time</div>
        {/* Massive Digital Clock */}
        <div className="font-mono text-7xl sm:text-9xl md:text-[12rem] font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-blue-300 leading-none drop-shadow-[0_10px_35px_rgba(37,99,235,0.25)]">
          {currentTimeString}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-base sm:text-xl font-bold tracking-wider text-slate-300 uppercase">
          <span className="text-blue-400">{currentDayNameEN}</span>
          <span className="text-slate-600">&bull;</span>
          <span>{currentDateDisplayEN}</span>
          <span className="text-slate-600">&bull;</span>
          <span className="bg-[#112240] text-blue-300 text-xs px-2.5 py-1 rounded-lg border border-blue-800/60 font-mono font-bold">
            WIB (UTC+7)
          </span>
        </div>
      </div>

      {/* Info Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto w-full mb-3">
        {/* Current Activity */}
        <div className="bg-[#112240] border border-blue-900/40 rounded-2xl p-4 shadow-lg relative overflow-hidden">
          <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1">
            CURRENT RUNNING PERIOD
          </div>
          <div className="text-xl font-bold text-white truncate">
            {currentActivityName}
          </div>
          <div className="text-xs font-mono font-semibold text-blue-400 mt-1">
            {currentActivityTimeRange}
          </div>
        </div>

        {/* Next Bell */}
        <div className="bg-[#112240] border border-blue-900/40 rounded-2xl p-4 shadow-lg relative overflow-hidden">
          <div className="text-[10px] font-bold tracking-widest text-blue-400 uppercase mb-1">
            NEXT UPCOMING BELL
          </div>
          <div className="text-xl font-bold text-white truncate">
            {nextBell ? nextBell.name : 'No more bells today'}
          </div>
          <div className="text-xs font-mono font-semibold text-slate-300 mt-1">
            {nextBell ? `${nextBell.time} WIB` : '-- : --'}
          </div>
        </div>

        {/* Live Countdown */}
        <div className="bg-[#112240] border border-blue-500/40 rounded-2xl p-4 shadow-lg relative overflow-hidden">
          <div className="text-[10px] font-bold tracking-widest text-amber-400 uppercase mb-1">
            EXACT COUNTDOWN TO STRIKE
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-bold text-amber-300 tracking-wider">
            {nextBell ? formatCountdown(countdownSeconds) : '00 : 00 : 00'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {nextBell ? `Target scheduled strike: ${nextBell.time} WIB` : 'All scheduled timetable slots concluded'}
          </div>
        </div>
      </div>

      {/* Playing or Control Bar Footer */}
      <div className="flex items-center justify-between border-t border-blue-900/40 pt-3">
        {currentPlaying.isPlaying ? (
          <div className="flex items-center gap-3 bg-[#112240] border border-blue-500/60 px-4 py-2 rounded-xl animate-pulse">
            <Volume2 className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">BROADCASTING:</span>{' '}
              <span className="text-xs font-bold text-white">{currentPlaying.eventName}</span>
            </div>
            <button
              onClick={stopAudio}
              className="flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold border border-rose-400/20 cursor-pointer"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Stop</span>
            </button>
          </div>
        ) : (
          <div className="text-xs text-slate-400 font-medium">
            Praditya Adhigana Global School Automatic School Bell Terminal &bull; Fullscreen Display Mode
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={toggleSystemActive}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              settings.isSystemActive
                ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40 hover:bg-amber-600/30'
                : 'bg-emerald-600 text-white hover:bg-emerald-500 border border-emerald-400/30'
            }`}
          >
            {settings.isSystemActive ? 'PAUSE AUTOMATIC SCHEDULER' : 'ACTIVATE AUTOMATIC SCHEDULER'}
          </button>
        </div>
      </div>
    </div>
  );
};
