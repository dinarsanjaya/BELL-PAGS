import React from 'react';
import {
  Bell,
  Clock,
  Music,
  Calendar,
  History,
  Settings,
  Volume2,
  VolumeX,
  Radio,
  Maximize,
  ShieldCheck,
} from 'lucide-react';
import { useBell } from '../context/BellContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenFullscreen: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenFullscreen }) => {
  const {
    currentTimeString,
    currentDateDisplayEN,
    settings,
    toggleSystemActive,
    setMuted,
    isAudioUnlocked,
    audioLibrary,
  } = useBell();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Clock },
    { id: 'schedule', label: 'Bell Schedule', icon: Calendar },
    { id: 'audio-library', label: 'Audio Library', icon: Music },
    { id: 'manual-bell', label: 'Manual Bell', icon: Radio },
    { id: 'history', label: 'History & Logs', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="bg-[#001b3a] border-b border-blue-900/50 shadow-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3.5">
          {/* Brand & Crest */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3.5 cursor-pointer group select-none"
          >
            <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center p-1 shadow-inner transition-transform group-hover:scale-105">
              <div className="w-full h-full bg-blue-700 rounded-full flex items-center justify-center text-xs font-black text-white tracking-wider">
                PAGS
              </div>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight">
                PRADITYA ADHIGANA GLOBAL SCHOOL
              </h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-blue-400 font-semibold">
                Automatic School Bell System
              </p>
            </div>
          </div>

          {/* Right Clock & Quick Controls */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Clock */}
            <div className="flex flex-col items-end">
              <div className="text-2xl sm:text-3xl font-mono font-bold text-blue-400 leading-none">
                {currentTimeString} <span className="text-xs sm:text-sm ml-1 opacity-70">WIB</span>
              </div>
              <div className="text-[10px] sm:text-[11px] font-medium text-slate-400 mt-1 uppercase tracking-wider">
                {currentDateDisplayEN}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSystemActive}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all border ${
                  settings.isSystemActive
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/60'
                    : 'bg-amber-950/60 border-amber-500/40 text-amber-300 hover:bg-amber-900/60'
                }`}
                title={settings.isSystemActive ? 'Pause Scheduler' : 'Activate Scheduler'}
              >
                <div className={`w-2 h-2 rounded-full ${settings.isSystemActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span>{settings.isSystemActive ? 'ACTIVE' : 'PAUSED'}</span>
              </button>

              <button
                onClick={() => setMuted(!settings.isMuted)}
                className={`p-2 rounded-lg border text-slate-300 transition-colors ${
                  settings.isMuted
                    ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                    : 'bg-[#112240] border-blue-900/40 hover:bg-blue-900/40'
                }`}
                title={settings.isMuted ? 'Unmute Audio' : 'Mute Audio'}
              >
                {settings.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-blue-400" />}
              </button>

              <button
                onClick={onOpenFullscreen}
                className="p-2 bg-[#112240] hover:bg-blue-900/40 border border-blue-900/40 rounded-lg text-slate-300 transition-colors"
                title="Fullscreen Kiosk Display"
              >
                <Maximize className="w-4 h-4 text-blue-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center justify-between border-t border-blue-900/40 pt-2 pb-2.5">
          <nav className="flex gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg border border-blue-400/20 shadow-blue-900/50'
                      : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Telemetry status indicators */}
          <div className="hidden lg:flex items-center gap-3 text-[10px] text-slate-400 uppercase font-semibold font-mono pl-4">
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${settings.isSystemActive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              Scheduler
            </span>
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isAudioUnlocked ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              Audio Engine
            </span>
            <span className="flex items-center gap-1.5 text-blue-300">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              IndexedDB: {audioLibrary.length} MP3
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
