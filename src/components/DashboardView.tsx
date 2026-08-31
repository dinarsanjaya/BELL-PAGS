import React from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  Play,
  Volume2,
  VolumeX,
  Radio,
  Square,
  AlertTriangle,
  Calendar,
  Layers,
  ChevronRight,
  Music,
  ShieldCheck,
  Zap,
  History,
  Volume1,
  Sparkles,
} from 'lucide-react';
import { useBell } from '../context/BellContext';
import { formatCountdown, DAY_LABELS_EN, DAY_LABELS_ID } from '../services/timeUtils';

interface DashboardViewProps {
  onNavigateToTab: (tab: string) => void;
  onOpenManualModal?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateToTab }) => {
  const {
    currentTimeString,
    currentDayNameEN,
    currentDayNameID,
    currentDateDisplayEN,
    currentDayKey,
    settings,
    isAudioUnlocked,
    activateBellSystem,
    toggleSystemActive,
    setMasterVolume,
    setMuted,
    stopAudio,
    testBell,
    playManualBell,
    currentPlaying,
    currentActivityName,
    currentActivityTimeRange,
    nextBell,
    countdownSeconds,
    todayScheduleItems,
    todayMorningActivity,
    schedules,
    audioLibrary,
    logs,
  } = useBell();

  const unassignedCount = schedules.filter((s) => s.enabled && !s.audioId).length;
  const isWeekend = currentDayKey === 'sabtu' || currentDayKey === 'minggu';
  const recentLogs = logs.slice(0, 5);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* 1. Audio Unlock Notice Banner */}
      {!isAudioUnlocked && (
        <div className="bg-[#112240] border-2 border-blue-500 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3 text-white">
            <div className="p-2.5 bg-blue-600 rounded-xl border border-blue-400">
              <Zap className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Browser Audio Autoplay Permission Required</h3>
              <p className="text-xs text-blue-200">
                Click once to grant browser audio authorization for automated school bell playback.
              </p>
            </div>
          </div>
          <button
            onClick={activateBellSystem}
            className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          >
            ACTIVATE AUDIO ENGINE
          </button>
        </div>
      )}

      {/* 2. Weekend Notice */}
      {isWeekend && !settings.weekendEnabled && (
        <div className="bg-[#112240] border border-blue-900/40 rounded-xl p-3.5 flex items-center justify-between text-slate-300 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Today is <strong>{DAY_LABELS_EN[currentDayKey]} (Weekend)</strong>. Automated bell scheduler is paused by default.</span>
          </div>
          <button
            onClick={() => onNavigateToTab('settings')}
            className="text-blue-400 hover:text-blue-300 font-semibold text-xs ml-4 whitespace-nowrap cursor-pointer"
          >
            Weekend Settings &rarr;
          </button>
        </div>
      )}

      {/* 3. Top Quick Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#112240] border border-blue-900/30 rounded-xl p-3 shadow-md flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Current Time</div>
            <div className="text-base font-mono font-bold text-white mt-0.5">{currentTimeString} WIB</div>
          </div>
          <Clock className="w-5 h-5 text-blue-400 opacity-80" />
        </div>

        <div className="bg-[#112240] border border-blue-900/30 rounded-xl p-3 shadow-md flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Current Day</div>
            <div className="text-base font-bold text-white mt-0.5 truncate">{DAY_LABELS_EN[currentDayKey]}</div>
          </div>
          <Calendar className="w-5 h-5 text-indigo-400 opacity-80" />
        </div>

        <div className="bg-[#112240] border border-blue-900/30 rounded-xl p-3 shadow-md flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Events Today</div>
            <div className="text-base font-bold text-white mt-0.5">{todayScheduleItems.length} Bells</div>
          </div>
          <Bell className="w-5 h-5 text-amber-400 opacity-80" />
        </div>

        <div className="bg-[#112240] border border-blue-900/30 rounded-xl p-3 shadow-md flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">System Status</div>
            <div className={`text-base font-bold mt-0.5 ${settings.isSystemActive ? 'text-emerald-400' : 'text-amber-400'}`}>
              {settings.isSystemActive ? 'OPERATIONAL' : 'PAUSED'}
            </div>
          </div>
          <ShieldCheck className={`w-5 h-5 opacity-80 ${settings.isSystemActive ? 'text-emerald-400' : 'text-amber-400'}`} />
        </div>
      </div>

      {/* 4. High-Density Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (4 Cols): Countdown & Master Controls */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card: Next Bell & Live Countdown */}
          <div className="bg-[#112240] border border-blue-900/30 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">
                  NEXT BELL
                </span>
                <span className="font-mono text-xs font-bold text-blue-300 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                  {nextBell ? `${nextBell.time} WIB` : '--:--'}
                </span>
              </div>

              <h2 className="text-xl font-extrabold text-white tracking-tight leading-snug line-clamp-2">
                {nextBell ? nextBell.name : 'No more bells scheduled today'}
              </h2>
              {nextBell?.description && (
                <p className="text-xs text-slate-400 mt-1 line-clamp-1">{nextBell.description}</p>
              )}
            </div>

            {/* Huge Countdown Display */}
            <div className="my-4 py-3 bg-[#0a192f] rounded-xl border border-blue-900/40 text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-1">
                COUNTDOWN
              </div>
              <div className="text-4xl sm:text-5xl font-mono font-black text-white tracking-tight">
                {nextBell ? formatCountdown(countdownSeconds) : '00:00:00'}
              </div>
            </div>

            {/* Current Activity Box */}
            <div className="pt-3 border-t border-blue-900/40 flex items-center justify-between text-xs">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Current Activity</div>
                <div className="font-bold text-white truncate max-w-[180px]">{currentActivityName}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Time Range</div>
                <div className="font-mono font-semibold text-blue-300 text-[11px]">{currentActivityTimeRange}</div>
              </div>
            </div>
          </div>

          {/* Card: Master Controls */}
          <div className="bg-[#112240] border border-blue-900/30 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                MASTER CONTROL
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                settings.isSystemActive
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                  : 'bg-amber-950/80 border-amber-500/50 text-amber-300'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${settings.isSystemActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                {settings.isSystemActive ? 'AUTOMATIC ACTIVE' : 'PAUSED'}
              </span>
            </div>

            {/* Volume Control */}
            <div className="bg-[#0a192f] p-3 rounded-xl border border-blue-900/40 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold text-[11px]">Master Volume</span>
                <span className="font-mono text-slate-200 font-bold text-xs">
                  {settings.isMuted ? 'MUTED' : `${Math.round(settings.masterVolume * 100)}%`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMuted(!settings.isMuted)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  {settings.isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-blue-400" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.masterVolume}
                  onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>

            {/* Action Buttons Grid */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={toggleSystemActive}
                className={`py-2.5 px-3 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                  settings.isSystemActive
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/30'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{settings.isSystemActive ? 'PAUSE' : 'ACTIVATE'}</span>
              </button>

              <button
                onClick={() => testBell()}
                className="py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer border border-blue-400/20"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>TEST BELL</span>
              </button>

              <button
                onClick={stopAudio}
                className={`py-2.5 px-3 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                  currentPlaying.isPlaying
                    ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse border-rose-500'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>STOP AUDIO</span>
              </button>

              <button
                onClick={() => onNavigateToTab('manual-bell')}
                className="py-2.5 px-3 bg-[#0a192f] hover:bg-blue-900/40 text-blue-300 border border-blue-900/60 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Radio className="w-3.5 h-3.5 text-blue-400" />
                <span>MANUAL BELL</span>
              </button>
            </div>
          </div>
        </div>

        {/* Center Column (5 Cols): Today's Schedule List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#112240] border border-blue-900/30 rounded-2xl p-5 shadow-lg flex flex-col h-full">
            <div className="flex items-center justify-between pb-3 border-b border-blue-900/40 mb-3">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span>TODAY'S SCHEDULE ({DAY_LABELS_EN[currentDayKey].toUpperCase()})</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Real-time timeline and automated bell queue
                </p>
              </div>

              <button
                onClick={() => onNavigateToTab('schedule')}
                className="text-[11px] font-bold text-blue-400 hover:text-blue-300 bg-[#0a192f] px-2.5 py-1 rounded-lg border border-blue-900/50 transition-colors cursor-pointer"
              >
                All Schedules &rarr;
              </button>
            </div>

            {/* Scrollable list */}
            <div className="space-y-2 overflow-y-auto max-h-[580px] pr-1 scrollbar-thin">
              {todayScheduleItems.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No active bell events scheduled for today ({DAY_LABELS_EN[currentDayKey]}).
                </div>
              ) : (
                todayScheduleItems.map(({ event, status }) => {
                  const isNext = status === 'next';
                  const isActive = status === 'active';
                  const isCompleted = status === 'completed';

                  return (
                    <div
                      key={event.id}
                      className={`p-3 rounded-xl flex items-center justify-between transition-all border ${
                        isNext
                          ? 'bg-blue-600/20 border-2 border-blue-500 shadow-lg shadow-blue-900/40'
                          : isActive
                          ? 'bg-blue-950/60 border-blue-700/60'
                          : isCompleted
                          ? 'bg-[#0a192f]/40 border-slate-800/60 opacity-60'
                          : 'bg-[#0a192f]/80 border-blue-900/30 hover:border-blue-700/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Status Icon */}
                        <div className="w-6 flex justify-center shrink-0">
                          {isCompleted && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          )}
                          {isActive && (
                            <span className="flex h-3 w-3 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
                            </span>
                          )}
                          {isNext && (
                            <span className="text-amber-400 font-extrabold text-sm animate-pulse">
                              &rarr;
                            </span>
                          )}
                          {status === 'upcoming' && (
                            <span className="w-2 h-2 rounded-full bg-slate-600" />
                          )}
                        </div>

                        {/* Time */}
                        <div className="font-mono text-sm font-bold text-white shrink-0 w-12">
                          {event.time}
                        </div>

                        {/* Name & Tag */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-xs font-bold truncate ${isNext ? 'text-white' : 'text-slate-200'}`}>
                              {event.name}
                            </span>
                            {isNext && (
                              <span className="text-[9px] font-extrabold bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded uppercase">
                                NEXT
                              </span>
                            )}
                          </div>
                          {event.jpCount && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              {event.jpCount} JP ({event.jpCount * 40} min)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right Play Test */}
                      <div className="flex items-center gap-2 shrink-0">
                        {event.audioId ? (
                          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                            <Music className="w-2.5 h-2.5 text-blue-400" />
                            <span className="truncate max-w-[80px]">{event.audioName || 'MP3'}</span>
                          </span>
                        ) : (
                          <span className="text-[9px] bg-amber-950/80 text-amber-300 px-1.5 py-0.5 rounded border border-amber-800">
                            Default
                          </span>
                        )}

                        <button
                          onClick={() => testBell(event)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title={`Test ${event.name}`}
                        >
                          <Play className="w-3 h-3 fill-current" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column (3 Cols): Morning Activity, Quick Trigger & Recent Logs */}
        <div className="lg:col-span-3 space-y-4">
          {/* Morning Activity Box */}
          <div className="bg-[#112240] border border-blue-900/30 rounded-2xl p-4 shadow-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">
                MORNING ACTIVITY
              </span>
              <span className="text-[10px] font-mono text-slate-400">06:45 - 07:30</span>
            </div>
            <div className="text-sm font-bold text-white">
              {todayMorningActivity?.title || 'MORNING ACTIVITY'}
            </div>
            <div className="space-y-1 text-xs text-slate-300 pt-1 border-t border-blue-900/40">
              {todayMorningActivity?.smpTitle && (
                <div className="flex justify-between">
                  <span className="text-blue-400 font-bold">SMP:</span>
                  <span className="text-slate-300">{todayMorningActivity.smpTitle}</span>
                </div>
              )}
              {todayMorningActivity?.smaTitle && (
                <div className="flex justify-between">
                  <span className="text-amber-400 font-bold">SMA:</span>
                  <span className="text-slate-300">{todayMorningActivity.smaTitle}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Manual Bells */}
          <div className="bg-[#112240] border border-blue-900/30 rounded-2xl p-4 shadow-lg space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                QUICK MANUAL BELL
              </span>
              <Radio className="w-3.5 h-3.5 text-blue-400" />
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => playManualBell('builtin-school-classic', 'Bell Ring (Ding-Dong)', 1.0)}
                className="p-2 bg-[#0a192f] hover:bg-blue-600 hover:text-white text-slate-300 rounded-lg text-xs font-bold border border-blue-900/40 transition-all text-center cursor-pointer"
              >
                1x Ring
              </button>
              <button
                onClick={() => playManualBell('builtin-westminster', 'Westminster Chime', 1.0)}
                className="p-2 bg-[#0a192f] hover:bg-blue-600 hover:text-white text-slate-300 rounded-lg text-xs font-bold border border-blue-900/40 transition-all text-center cursor-pointer"
              >
                Full Chime
              </button>
              <button
                onClick={() => playManualBell('builtin-digital-chime', 'Digital Notice Chime', 1.0)}
                className="p-2 bg-[#0a192f] hover:bg-blue-600 hover:text-white text-slate-300 rounded-lg text-xs font-bold border border-blue-900/40 transition-all text-center cursor-pointer"
              >
                Digital Chime
              </button>
              <button
                onClick={() => playManualBell('builtin-pleasant-gong', 'Special Alert / Gong', 1.0)}
                className="p-2 bg-rose-950/60 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg text-xs font-bold border border-rose-800/60 transition-all text-center cursor-pointer"
              >
                Special Gong
              </button>
            </div>
          </div>

          {/* Recent Logs Preview */}
          <div className="bg-[#112240] border border-blue-900/30 rounded-2xl p-4 shadow-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                RECENT LOGS
              </span>
              <button
                onClick={() => onNavigateToTab('history')}
                className="text-[10px] text-blue-400 hover:underline cursor-pointer"
              >
                View all &rarr;
              </button>
            </div>

            <div className="space-y-1.5">
              {recentLogs.length === 0 ? (
                <div className="text-[11px] text-slate-400 text-center py-4">No bell logs recorded yet.</div>
              ) : (
                recentLogs.map((log) => (
                  <div key={log.id} className="p-2 rounded-lg bg-[#0a192f] border border-blue-900/30 flex items-center justify-between text-xs">
                    <div className="truncate mr-2">
                      <div className="font-bold text-white text-[11px] truncate">{log.eventName}</div>
                      <div className="text-[9px] text-slate-400">{log.wibTime} WIB &bull; {log.audioName}</div>
                    </div>
                    <span className="text-[9px] font-bold font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40 shrink-0">
                      {log.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
