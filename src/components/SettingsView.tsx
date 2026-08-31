import React, { useRef, useState } from 'react';
import {
  Settings,
  Download,
  Upload,
  RefreshCw,
  Calendar,
  Check,
  AlertTriangle,
  Clock,
  Database,
  Volume2,
  Sliders,
} from 'lucide-react';
import { useBell } from '../context/BellContext';

export const SettingsView: React.FC = () => {
  const {
    settings,
    toggleWeekendEnabled,
    setMasterVolume,
    exportSettingsJSON,
    importSettingsJSON,
    resetToDefaults,
    audioLibrary,
    schedules,
  } = useBell();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleExport = () => {
    const jsonString = exportSettingsJSON();
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pags-school-bell-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const success = await importSettingsJSON(text);
      if (success) {
        setImportStatus('Konfigurasi jadwal berhasil diimpor!');
        setTimeout(() => setImportStatus(null), 4000);
      } else {
        alert('File JSON tidak valid atau struktur tidak cocok.');
      }
    } catch (err) {
      alert('Gagal membaca file konfigurasi JSON.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-[#112240] p-5 rounded-2xl border border-blue-900/30 shadow-lg">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">System Preferences</div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2 mt-0.5">
          <Settings className="w-5 h-5 text-blue-400" />
          <span>SYSTEM SETTINGS & TELEMETRY BACKUP</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage snapshot backups, restore configurations, operating day rules, and offline storage health.
        </p>
      </div>

      {importStatus && (
        <div className="bg-emerald-950/80 border border-emerald-500 rounded-xl p-3 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{importStatus}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Backup & Restore */}
        <div className="bg-[#112240] border border-blue-900/30 rounded-2xl p-6 shadow-lg space-y-4">
          <div className="border-b border-blue-900/40 pb-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Data Portability</div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
              <Download className="w-4 h-4 text-blue-400" />
              <span>Backup & Restore Config (JSON)</span>
            </h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Export the complete timetable layout, morning activities, and system preferences to a portable JSON file to duplicate or backup across operator machines.
          </p>

          <div className="space-y-2.5 pt-1">
            <button
              onClick={handleExport}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer border border-blue-400/20"
            >
              <Download className="w-4 h-4" />
              <span>EXPORT CONFIGURATION (JSON)</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 bg-[#0a192f] hover:bg-blue-900/40 text-slate-200 font-bold text-xs rounded-xl border border-blue-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-blue-400" />
              <span>IMPORT CONFIGURATION (JSON)</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* Card 2: Hari Aktif & Weekend Mode */}
        <div className="bg-[#112240] border border-blue-900/30 rounded-2xl p-6 shadow-lg space-y-4">
          <div className="border-b border-blue-900/40 pb-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Operating Schedule</div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Operational Days Rule</span>
            </h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            By default, automatic school bell scheduling operates strictly on <strong>Monday - Friday</strong>. Enable weekend mode when special Saturday / Sunday sessions or exams are scheduled.
          </p>

          <div className="bg-[#0a192f] border border-blue-900/50 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <div className="font-bold text-xs text-white">Weekend Bell Mode (Sat & Sun)</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Current status: {settings.weekendEnabled ? 'ACTIVE' : 'DISABLED (Default)'}
              </div>
            </div>

            <button
              onClick={toggleWeekendEnabled}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                settings.weekendEnabled
                  ? 'bg-emerald-600 text-white border border-emerald-400/30'
                  : 'bg-[#112240] text-slate-400 border border-blue-900/60'
              }`}
            >
              {settings.weekendEnabled ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>

          <div className="text-xs text-slate-400 bg-[#0a192f]/80 p-3 rounded-xl border border-blue-900/40">
            <span className="text-blue-400 font-bold">Timezone:</span> Asia/Jakarta (WIB / UTC+7). Real-time millisecond sync with local hardware clock.
          </div>
        </div>

        {/* Card 3: Storage & System Status */}
        <div className="bg-[#112240] border border-blue-900/30 rounded-2xl p-6 shadow-lg space-y-3.5">
          <div className="border-b border-blue-900/40 pb-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Offline Architecture</div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Local Storage & Engine Status</span>
            </h3>
          </div>

          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="flex justify-between py-1.5 border-b border-blue-900/30">
              <span className="text-slate-400">Audio Persistence Engine:</span>
              <span className="font-bold text-white">IndexedDB (100% Local in Browser)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-blue-900/30">
              <span className="text-slate-400">Stored Custom MP3 Tracks:</span>
              <span className="font-bold font-mono text-blue-400">{audioLibrary.length} Tracks</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-blue-900/30">
              <span className="text-slate-400">Active Scheduled Events:</span>
              <span className="font-bold font-mono text-blue-400">{schedules.length} Timetable Slots</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Cloud / Internet Dependency:</span>
              <span className="font-bold text-emerald-400">Zero (Full Offline Operation)</span>
            </div>
          </div>
        </div>

        {/* Card 4: Reset to Factory Defaults */}
        <div className="bg-[#112240] border border-rose-900/40 rounded-2xl p-6 shadow-lg space-y-3.5">
          <div className="border-b border-rose-900/40 pb-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-rose-400">System Reset</div>
            <h3 className="text-base font-bold text-rose-300 flex items-center gap-2 mt-0.5">
              <RefreshCw className="w-4 h-4 text-rose-400" />
              <span>Restore Factory Defaults</span>
            </h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Revert all 17 standard school bell timetable slots, the 10:00 song event, and PAGS morning activities back to default settings. Uploaded audio files in your library will remain intact.
          </p>

          <div className="pt-2">
            <button
              onClick={() => {
                if (confirm('Revert all schedules and settings to standard PAGS factory defaults?')) {
                  resetToDefaults();
                }
              }}
              className="w-full py-2.5 bg-rose-950/70 hover:bg-rose-900 text-rose-200 border border-rose-900/60 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>RESET TIMETABLE TO FACTORY DEFAULTS</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
