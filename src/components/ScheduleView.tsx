import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Play,
  Volume2,
  Music,
  Check,
  X,
  Clock,
  Sparkles,
  Sun,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useBell } from '../context/BellContext';
import { BellEvent, DayOfWeek, MorningActivity } from '../types';
import { ALL_DAYS, DEFAULT_WEEKDAYS } from '../services/defaultData';
import { DAY_LABELS_EN, DAY_LABELS_ID } from '../services/timeUtils';
import { BUILT_IN_CHIMES } from '../services/audioEngine';

export const ScheduleView: React.FC = () => {
  const {
    schedules,
    audioLibrary,
    saveScheduleItem,
    addScheduleItem,
    deleteScheduleItem,
    duplicateScheduleItem,
    toggleScheduleItem,
    testBell,
    morningActivities,
    updateMorningActivity,
    resetToDefaults,
  } = useBell();

  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('all');
  const [editingEvent, setEditingEvent] = useState<BellEvent | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [isMorningModalOpen, setIsMorningModalOpen] = useState<boolean>(false);

  // Form State for Add / Edit Modal
  const [formName, setFormName] = useState<string>('');
  const [formTime, setFormTime] = useState<string>('07:30');
  const [formEndTime, setFormEndTime] = useState<string>('08:50');
  const [formDays, setFormDays] = useState<DayOfWeek[]>([...DEFAULT_WEEKDAYS]);
  const [formAudioId, setFormAudioId] = useState<string>('');
  const [formVolume, setFormVolume] = useState<number>(1.0);
  const [formEnabled, setFormEnabled] = useState<boolean>(true);
  const [formDescription, setFormDescription] = useState<string>('');
  const [formJpCount, setFormJpCount] = useState<number | undefined>(2);

  // Filter schedules
  const filteredSchedules = schedules.filter((event) => {
    if (selectedDayFilter === 'all') return true;
    return event.days.includes(selectedDayFilter as DayOfWeek);
  });

  const openCreateModal = () => {
    setEditingEvent(null);
    setFormName('');
    setFormTime('07:30');
    setFormEndTime('08:50');
    setFormDays([...DEFAULT_WEEKDAYS]);
    setFormAudioId('');
    setFormVolume(1.0);
    setFormEnabled(true);
    setFormDescription('');
    setFormJpCount(2);
    setIsCreatingNew(true);
  };

  const openEditModal = (event: BellEvent) => {
    setEditingEvent(event);
    setFormName(event.name);
    setFormTime(event.time);
    setFormEndTime(event.endTime || '');
    setFormDays([...event.days]);
    setFormAudioId(event.audioId || '');
    setFormVolume(event.volume ?? 1.0);
    setFormEnabled(event.enabled);
    setFormDescription(event.description || '');
    setFormJpCount(event.jpCount);
    setIsCreatingNew(false);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formTime.trim()) return;

    let selectedAudioName = '';
    if (formAudioId) {
      if (formAudioId.startsWith('builtin-')) {
        const found = BUILT_IN_CHIMES.find((c) => c.id === formAudioId);
        if (found) selectedAudioName = found.name;
      } else {
        const found = audioLibrary.find((a) => a.id === formAudioId);
        if (found) selectedAudioName = found.name;
      }
    }

    if (editingEvent) {
      await saveScheduleItem({
        ...editingEvent,
        name: formName.trim(),
        time: formTime,
        endTime: formEndTime.trim() || undefined,
        days: formDays,
        audioId: formAudioId || null,
        audioName: selectedAudioName,
        volume: formVolume,
        enabled: formEnabled,
        description: formDescription.trim(),
        jpCount: formJpCount,
      });
    } else {
      await addScheduleItem({
        name: formName.trim(),
        time: formTime,
        endTime: formEndTime.trim() || undefined,
        days: formDays,
        audioId: formAudioId || null,
        audioName: selectedAudioName,
        volume: formVolume,
        enabled: formEnabled,
        description: formDescription.trim(),
        jpCount: formJpCount,
      });
    }

    setEditingEvent(null);
    setIsCreatingNew(false);
  };

  const toggleDaySelection = (day: DayOfWeek) => {
    if (formDays.includes(day)) {
      if (formDays.length > 1) {
        setFormDays(formDays.filter((d) => d !== day));
      }
    } else {
      setFormDays([...formDays, day]);
    }
  };

  const setJpPreset = (jp: number) => {
    setFormJpCount(jp);
    if (!formTime) return;
    const [h, m] = formTime.split(':').map(Number);
    const startTotal = h * 60 + m;
    const durationMinutes = jp * 40;
    const endTotal = startTotal + durationMinutes;
    const endH = Math.floor(endTotal / 60) % 24;
    const endM = endTotal % 60;
    setFormEndTime(`${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#112240] p-5 rounded-2xl border border-blue-900/30 shadow-lg">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">Timetable Configuration</div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2 mt-0.5">
            <Calendar className="w-5 h-5 text-blue-400" />
            <span>BELL SCHEDULE MANAGEMENT</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure automated bell triggers, day selectors, block periods (2 JP / 3 JP), and audio MP3 attachments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsMorningModalOpen(true)}
            className="px-3.5 py-2 bg-[#0a192f] hover:bg-blue-900/40 text-amber-300 font-bold text-xs rounded-xl border border-blue-900/50 transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Sun className="w-4 h-4 text-amber-400" />
            <span>Morning Activities</span>
          </button>

          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-900/40 transition-all flex items-center gap-1.5 cursor-pointer border border-blue-400/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Bell Schedule</span>
          </button>
        </div>
      </div>

      {/* Filter by Day */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap mr-1">Day Filter:</span>
        <button
          onClick={() => setSelectedDayFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            selectedDayFilter === 'all'
              ? 'bg-blue-600 text-white shadow-md border border-blue-400/20'
              : 'bg-[#112240] text-slate-400 hover:bg-white/5 border border-blue-900/40'
          }`}
        >
          All Days ({schedules.length})
        </button>

        {ALL_DAYS.map((day) => {
          const count = schedules.filter((s) => s.days.includes(day)).length;
          return (
            <button
              key={day}
              onClick={() => setSelectedDayFilter(day)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                selectedDayFilter === day
                  ? 'bg-blue-600 text-white shadow-md border border-blue-400/20'
                  : 'bg-[#112240] text-slate-400 hover:bg-white/5 border border-blue-900/40'
              }`}
            >
              {DAY_LABELS_EN[day]} ({count})
            </button>
          );
        })}
      </div>

      {/* Schedule Table (Section 14) */}
      <div className="bg-[#112240] border border-blue-900/30 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#001b3a] border-b border-blue-900/50 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                <th className="py-3 px-4 sm:px-6">TIME</th>
                <th className="py-3 px-4 sm:px-6">EVENT & DETAIL</th>
                <th className="py-3 px-4">DAYS</th>
                <th className="py-3 px-4">AUDIO ATTACHMENT</th>
                <th className="py-3 px-3 text-center">VOLUME</th>
                <th className="py-3 px-3 text-center">STATUS</th>
                <th className="py-3 px-4 sm:px-6 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-900/20 text-xs">
              {filteredSchedules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No bell schedules match the selected day filter.
                  </td>
                </tr>
              ) : (
                filteredSchedules.map((event) => {
                  const hasAudio = !!event.audioId;

                  return (
                    <tr
                      key={event.id}
                      className={`hover:bg-blue-900/20 transition-colors ${
                        !event.enabled ? 'opacity-50 bg-[#0a192f]/40' : ''
                      }`}
                    >
                      {/* TIME */}
                      <td className="py-3.5 px-4 sm:px-6 align-top">
                        <div className="font-mono text-sm font-bold text-white whitespace-nowrap">
                          {event.time}
                        </div>
                        {event.endTime && (
                          <div className="text-[10px] font-mono text-slate-400 whitespace-nowrap mt-0.5">
                            to {event.endTime}
                          </div>
                        )}
                      </td>

                      {/* EVENT */}
                      <td className="py-3.5 px-4 sm:px-6 align-top">
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{event.name}</span>
                          {event.jpCount && (
                            <span className="text-[9px] font-bold bg-[#0a192f] text-blue-300 px-1.5 py-0.5 rounded border border-blue-900/60">
                              {event.jpCount} JP ({event.jpCount * 40}m)
                            </span>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm">
                            {event.description}
                          </p>
                        )}
                      </td>

                      {/* DAYS */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex flex-wrap gap-1 max-w-[140px]">
                          {event.days.map((day) => (
                            <span
                              key={day}
                              className="text-[9px] font-bold bg-[#0a192f] text-slate-300 px-1.5 py-0.5 rounded border border-blue-900/40 uppercase"
                            >
                              {DAY_LABELS_EN[day].slice(0, 3)}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* AUDIO */}
                      <td className="py-3.5 px-4 align-top">
                        {hasAudio ? (
                          <div className="flex items-center gap-1.5 text-xs text-blue-300 font-medium">
                            <Music className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <span className="truncate max-w-[160px]">
                              {event.audioName || 'Custom MP3'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>Preset Chime</span>
                          </div>
                        )}
                      </td>

                      {/* VOLUME */}
                      <td className="py-3.5 px-3 align-top text-center">
                        <span className="font-mono text-[11px] text-slate-300 bg-[#0a192f] px-2 py-0.5 rounded border border-blue-900/30">
                          {Math.round((event.volume ?? 1) * 100)}%
                        </span>
                      </td>

                      {/* STATUS (ON/OFF) */}
                      <td className="py-3.5 px-3 align-top text-center">
                        <button
                          onClick={() => toggleScheduleItem(event.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer border ${
                            event.enabled
                              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {event.enabled ? 'ON' : 'OFF'}
                        </button>
                      </td>

                      {/* ACTIONS */}
                      <td className="py-3.5 px-4 sm:px-6 align-top text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Test Bell */}
                          <button
                            onClick={() => testBell(event)}
                            className="p-1.5 rounded-lg bg-[#0a192f] hover:bg-blue-600 text-slate-300 hover:text-white transition-colors cursor-pointer border border-blue-900/40"
                            title="Test bell trigger"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => openEditModal(event)}
                            className="p-1.5 rounded-lg bg-[#0a192f] hover:bg-blue-900/60 text-blue-400 transition-colors cursor-pointer border border-blue-900/40"
                            title="Edit schedule"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Duplicate */}
                          <button
                            onClick={() => duplicateScheduleItem(event.id)}
                            className="p-1.5 rounded-lg bg-[#0a192f] hover:bg-blue-900/60 text-slate-300 transition-colors cursor-pointer border border-blue-900/40"
                            title="Duplicate schedule"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => {
                              if (confirm(`Delete bell event "${event.name}"?`)) {
                                deleteScheduleItem(event.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-[#0a192f] hover:bg-rose-600 text-slate-400 hover:text-white transition-colors cursor-pointer border border-blue-900/40"
                            title="Delete schedule"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Schedule Modal */}
      {(isCreatingNew || editingEvent) && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#112240] border border-blue-800 rounded-2xl max-w-xl w-full p-6 sm:p-7 shadow-2xl overflow-y-auto max-h-[90vh] text-white animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-blue-900/50">
              <h3 className="text-base sm:text-lg font-bold">
                {isCreatingNew ? 'Add New Bell Schedule' : `Edit Schedule: ${editingEvent?.name}`}
              </h3>
              <button
                onClick={() => {
                  setIsCreatingNew(false);
                  setEditingEvent(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-blue-900/40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4 mt-5">
              {/* Event Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Event / Activity Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Morning Assembly, Block 1 Start, Recess, Dismissal"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-[#0a192f] border border-blue-900/60 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Time Pickers (Start & End) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Bell Trigger Time (WIB) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full bg-[#0a192f] border border-blue-900/60 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    End Time (Optional)
                  </label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full bg-[#0a192f] border border-blue-900/60 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Quick JP Helpers */}
              <div>
                <span className="block text-xs text-slate-400 mb-1.5 font-semibold">Lesson Block Presets:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setJpPreset(1)}
                    className="px-3 py-1 bg-[#0a192f] hover:bg-blue-900/50 text-xs text-slate-300 rounded-lg border border-blue-900/50 font-medium"
                  >
                    1 JP (40 Min)
                  </button>
                  <button
                    type="button"
                    onClick={() => setJpPreset(2)}
                    className="px-3 py-1 bg-blue-900/60 hover:bg-blue-800 text-xs text-blue-200 rounded-lg border border-blue-600/50 font-bold"
                  >
                    2 JP (80 Min) - Standard
                  </button>
                  <button
                    type="button"
                    onClick={() => setJpPreset(3)}
                    className="px-3 py-1 bg-indigo-900/60 hover:bg-indigo-800 text-xs text-indigo-200 rounded-lg border border-indigo-600/50 font-bold"
                  >
                    3 JP (120 Min)
                  </button>
                </div>
              </div>

              {/* Active Days Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Active Days
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  {ALL_DAYS.map((day) => {
                    const isSelected = formDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDaySelection(day)}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-md border border-blue-400/20'
                            : 'bg-[#0a192f] text-slate-400 border border-blue-900/40 hover:bg-white/5'
                        }`}
                      >
                        {DAY_LABELS_EN[day].slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Audio Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Pilih File Audio MP3 / Bel
                </label>
                <select
                  value={formAudioId}
                  onChange={(e) => setFormAudioId(e.target.value)}
                  className="w-full bg-[#0a192f] border border-blue-900/60 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Chime Westminster (Bel Bawaan) --</option>
                  
                  {audioLibrary.length > 0 ? (
                    <optgroup label="File MP3 yang Diupload">
                      {audioLibrary.map((audio) => (
                        <option key={audio.id} value={audio.id}>
                          {audio.name} ({audio.duration} detik)
                        </option>
                      ))}
                    </optgroup>
                  ) : (
                    <option disabled value="no-audio">
                      (Belum ada MP3 diupload - Masuk ke Audio Library untuk upload)
                    </option>
                  )}

                  <optgroup label="Nada Chime Standar (Synthesizer)">
                    {BUILT_IN_CHIMES.map((chime) => (
                      <option key={chime.id} value={chime.id}>
                        {chime.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Individual Event Volume Slider */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Event Volume
                  </label>
                  <span className="font-mono text-xs font-bold text-blue-400">
                    {Math.round(formVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={formVolume}
                  onChange={(e) => setFormVolume(parseFloat(e.target.value))}
                  className="w-full h-2 bg-[#0a192f] rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Description & Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Event Description / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes for faculty, homeroom, or students..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-[#0a192f] border border-blue-900/60 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Enable / Disable Toggle */}
              <div className="flex items-center space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="formEnabled"
                  checked={formEnabled}
                  onChange={(e) => setFormEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-[#0a192f] border-blue-900"
                />
                <label htmlFor="formEnabled" className="text-xs font-bold text-slate-200">
                  Enable this automated bell schedule
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-blue-900/50">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingNew(false);
                    setEditingEvent(null);
                  }}
                  className="px-5 py-2.5 bg-[#0a192f] hover:bg-blue-900/40 text-slate-300 font-bold text-xs rounded-xl border border-blue-900/40 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-900/40 border border-blue-400/20 cursor-pointer"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Morning Activities Editor Modal */}
      {isMorningModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#112240] border border-blue-800 rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl overflow-y-auto max-h-[90vh] text-white animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-blue-900/50">
              <div>
                <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                  <Sun className="w-5 h-5 text-amber-400" />
                  <span>MORNING ACTIVITY CONFIGURATION (06:45 - 07:30)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure daily morning agendas for SMP and SMA units.
                </p>
              </div>
              <button
                onClick={() => setIsMorningModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-blue-900/40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-5">
              {(['senin', 'selasa', 'rabu', 'kamis', 'jumat'] as DayOfWeek[]).map((day) => {
                const act = morningActivities[day];
                return (
                  <div key={day} className="bg-[#0a192f] border border-blue-900/40 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800 uppercase tracking-wider">
                        {DAY_LABELS_EN[day]} (06:45 - 07:30)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-blue-400 mb-1 uppercase tracking-wider">
                          SMP Unit Activity
                        </label>
                        <input
                          type="text"
                          value={act?.smpTitle || ''}
                          onChange={(e) =>
                            updateMorningActivity(day, {
                              ...act,
                              smpTitle: e.target.value,
                              title: `${e.target.value} / ${act?.smaTitle || ''}`,
                            })
                          }
                          className="w-full bg-[#112240] border border-blue-900/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-amber-400 mb-1 uppercase tracking-wider">
                          SMA Unit Activity
                        </label>
                        <input
                          type="text"
                          value={act?.smaTitle || ''}
                          onChange={(e) =>
                            updateMorningActivity(day, {
                              ...act,
                              smaTitle: e.target.value,
                              title: `${act?.smpTitle || ''} / ${e.target.value}`,
                            })
                          }
                          className="w-full bg-[#112240] border border-blue-900/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-4 border-t border-blue-900/50 mt-5">
              <button
                onClick={() => setIsMorningModalOpen(false)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer border border-blue-400/20"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
