import React, { useState } from 'react';
import { BellProvider } from './context/BellContext';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { ScheduleView } from './components/ScheduleView';
import { AudioLibraryView } from './components/AudioLibraryView';
import { ManualBellView } from './components/ManualBellView';
import { BellHistoryView } from './components/BellHistoryView';
import { SettingsView } from './components/SettingsView';
import { FloatingAudioPlayer } from './components/FloatingAudioPlayer';
import { FullscreenModal } from './components/FullscreenModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isFullscreenOpen, setIsFullscreenOpen] = useState<boolean>(false);

  return (
    <BellProvider>
      <div className="min-h-screen bg-[#0a192f] text-slate-100 font-sans flex flex-col selection:bg-blue-600 selection:text-white">
        {/* Navigation & Header */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenFullscreen={() => setIsFullscreenOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
          {activeTab === 'dashboard' && (
            <DashboardView onNavigateToTab={(tab) => setActiveTab(tab)} />
          )}
          {activeTab === 'schedule' && <ScheduleView />}
          {activeTab === 'audio-library' && <AudioLibraryView />}
          {activeTab === 'manual-bell' && <ManualBellView />}
          {activeTab === 'history' && <BellHistoryView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>

        {/* Floating Bell Player (appears whenever audio is playing) */}
        <FloatingAudioPlayer />

        {/* Fullscreen Operator Kiosk Mode */}
        <FullscreenModal
          isOpen={isFullscreenOpen}
          onClose={() => setIsFullscreenOpen(false)}
        />
      </div>
    </BellProvider>
  );
}
