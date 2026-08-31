import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  AudioItem,
  BellEvent,
  BellLog,
  CurrentPlayingState,
  DayOfWeek,
  MorningActivity,
  SystemSettings,
} from '../types';
import { audioEngine, BUILT_IN_CHIMES } from '../services/audioEngine';
import {
  clearAllLogsFromDB,
  deleteAudioFromDB,
  getAllAudiosFromDB,
  getAllLogsFromDB,
  getMorningActivitiesFromDB,
  getSchedulesFromDB,
  getSettingsFromDB,
  renameAudioInDB,
  saveAudioToDB,
  saveLogToDB,
  saveMorningActivitiesToDB,
  saveSchedulesToDB,
  saveSettingsToDB,
} from '../services/db';
import {
  CURRENT_SCHEDULE_REVISION,
  DEFAULT_MORNING_ACTIVITIES,
  DEFAULT_SCHEDULES,
  DEFAULT_SETTINGS,
  migrateSchedulesToCurrentRevision,
} from '../services/defaultData';
import {
  formatDateDisplayEN,
  formatDateDisplayID,
  formatDateLog,
  formatTimeHHMM,
  formatTimeHHMMSS,
  getCurrentDayOfWeekJakarta,
  getExecutionKey,
  getJakartaDate,
  getSecondsUntilTargetToday,
  timeStringToMinutes,
} from '../services/timeUtils';
import { AudioManifestItem, relinkImportedScheduleAudio } from '../services/scheduleImport';

export interface SettingsImportResult {
  success: boolean;
  relinkedAudioCount: number;
  unresolvedAudioCount: number;
}

export interface BellContextType {
  // Clock state
  currentTimeString: string;
  currentDayNameID: string;
  currentDayNameEN: string;
  currentDateDisplayEN: string;
  currentDateDisplayID: string;
  currentDayKey: DayOfWeek;

  // System & Audio state
  settings: SystemSettings;
  isAudioUnlocked: boolean;
  currentPlaying: CurrentPlayingState;
  audioLibrary: AudioItem[];
  schedules: BellEvent[];
  morningActivities: Record<DayOfWeek, MorningActivity>;
  todayMorningActivity: MorningActivity;
  logs: BellLog[];

  // Scheduler Dynamic States
  currentActivityName: string;
  currentActivityTimeRange: string;
  nextBell: BellEvent | null;
  countdownSeconds: number;
  todayScheduleItems: Array<{
    event: BellEvent;
    status: 'completed' | 'active' | 'next' | 'upcoming';
  }>;

  // Actions
  activateBellSystem: () => Promise<void>;
  toggleSystemActive: () => void;
  setMasterVolume: (vol: number) => void;
  setMuted: (muted: boolean) => void;
  stopAudio: () => void;
  testBell: (schedule?: BellEvent) => Promise<void>;
  playManualBell: (audioId: string | null, customTitle?: string, volume?: number) => Promise<boolean>;

  // Schedule Management
  saveScheduleItem: (event: BellEvent) => Promise<void>;
  addScheduleItem: (eventData: Omit<BellEvent, 'id'>) => Promise<void>;
  deleteScheduleItem: (id: string) => Promise<void>;
  duplicateScheduleItem: (id: string) => Promise<void>;
  toggleScheduleItem: (id: string) => Promise<void>;

  // Audio Library
  uploadAudioFile: (file: File, customName?: string) => Promise<AudioItem>;
  deleteAudioFile: (id: string) => Promise<void>;
  renameAudioFile: (id: string, newName: string) => Promise<void>;
  previewAudioBlob: (blob: Blob, name: string) => Promise<void>;

  // Morning Activities
  updateMorningActivity: (day: DayOfWeek, activity: MorningActivity) => Promise<void>;

  // Logs & Settings
  clearLogs: () => Promise<void>;
  exportSettingsJSON: () => string;
  importSettingsJSON: (jsonStr: string) => Promise<SettingsImportResult>;
  resetToDefaults: () => Promise<void>;
  toggleWeekendEnabled: () => void;
}

const BellContext = createContext<BellContextType | null>(null);

export const BellProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Clock state
  const [nowDate, setNowDate] = useState<Date>(getJakartaDate());
  const [currentDayKey, setCurrentDayKey] = useState<DayOfWeek>(getCurrentDayOfWeekJakarta());

  // Data states
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState<boolean>(false);
  const [currentPlaying, setCurrentPlaying] = useState<CurrentPlayingState>(audioEngine.currentPlaying);
  const [audioLibrary, setAudioLibrary] = useState<AudioItem[]>([]);
  const [schedules, setSchedules] = useState<BellEvent[]>([]);
  const [morningActivities, setMorningActivities] = useState<Record<DayOfWeek, MorningActivity>>(DEFAULT_MORNING_ACTIVITIES);
  const [logs, setLogs] = useState<BellLog[]>([]);

  // Execution tracking for safety (prevents double-play in 1 minute)
  const executedKeysRef = useRef<Set<string>>(new Set());
  const lastDateKeyRef = useRef<string>('');

  // 1. Initial Data Loading
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [loadedSettings, loadedSchedules, loadedAudios, loadedMorning, loadedLogs] = await Promise.all([
          getSettingsFromDB(),
          getSchedulesFromDB(),
          getAllAudiosFromDB(),
          getMorningActivitiesFromDB(),
          getAllLogsFromDB(),
        ]);

        let resolvedSettings = loadedSettings;
        let resolvedSchedules = [...loadedSchedules];

        // Existing browsers retain IndexedDB data, so upgrade the old 2-3 JP
        // blocks once and preserve user audio assignments and custom events.
        if (loadedSettings.scheduleRevision < CURRENT_SCHEDULE_REVISION) {
          resolvedSchedules = migrateSchedulesToCurrentRevision(loadedSchedules);
          resolvedSettings = {
            ...loadedSettings,
            scheduleRevision: CURRENT_SCHEDULE_REVISION,
          };
          await Promise.all([
            saveSchedulesToDB(resolvedSchedules),
            saveSettingsToDB(resolvedSettings),
          ]);
        }

        // Ensure 10:00 AM Indonesia Raya & Mars PAGS event exists in loaded schedules
        const has10AmEvent = resolvedSchedules.some(
          (s) => s.id === 'pags-event-indonesia-raya-mars' || s.time === '10:00'
        );

        if (!has10AmEvent) {
          const default10Am = DEFAULT_SCHEDULES.find((ds) => ds.id === 'pags-event-indonesia-raya-mars');
          if (default10Am) {
            resolvedSchedules.push({ ...default10Am });
            resolvedSchedules.sort((a, b) => a.time.localeCompare(b.time));
            await saveSchedulesToDB(resolvedSchedules);
          }
        }

        setSettings(resolvedSettings);
        setSchedules(resolvedSchedules);
        setAudioLibrary(loadedAudios);
        setMorningActivities(loadedMorning);
        setLogs(loadedLogs);

        audioEngine.setMasterVolume(resolvedSettings.masterVolume);
        audioEngine.setMuted(resolvedSettings.isMuted);
      } catch (err) {
        console.error('Failed to load initial data from IndexedDB:', err);
      }
    }
    loadInitialData();
  }, []);

  // 2. Audio Engine playback subscriber
  useEffect(() => {
    const unsubscribe = audioEngine.subscribe((state) => {
      setCurrentPlaying(state);
    });
    return () => unsubscribe();
  }, []);

  // 3. Heartbeat Clock & Scheduler Loop (Optimized 1000ms tick)
  useEffect(() => {
    const timer = setInterval(() => {
      const currentJakarta = getJakartaDate();
      setNowDate(currentJakarta);

      const dayOfWeek = getCurrentDayOfWeekJakarta();
      setCurrentDayKey((prev) => (prev !== dayOfWeek ? dayOfWeek : prev));

      // Clean execution keys at date boundary (midnight)
      const dateTodayKey = formatDateLog(currentJakarta);
      if (lastDateKeyRef.current && lastDateKeyRef.current !== dateTodayKey) {
        executedKeysRef.current.clear();
      }
      lastDateKeyRef.current = dateTodayKey;

      // Check automated scheduler triggers
      checkAndTriggerScheduler(currentJakarta, dayOfWeek);
    }, 1000);

    return () => clearInterval(timer);
  }, [settings, schedules, audioLibrary]);

  // Scheduler Trigger Checker
  const checkAndTriggerScheduler = useCallback(
    async (currentJakartaDate: Date, dayOfWeek: DayOfWeek) => {
      // If master system is disabled, do not fire automated bells
      if (!settings.isSystemActive) return;

      // Check weekend rule
      if ((dayOfWeek === 'sabtu' || dayOfWeek === 'minggu') && !settings.weekendEnabled) {
        return;
      }

      const currentHHMM = formatTimeHHMM(currentJakartaDate);
      const currentSeconds = currentJakartaDate.getSeconds();

      for (const event of schedules) {
        if (!event.enabled) continue;
        if (!event.days.includes(dayOfWeek)) continue;

        const eventKey = getExecutionKey(event.id, currentJakartaDate);

        // Check if event time matches current minute
        if (event.time === currentHHMM) {
          // Safety 1: prevent double execution
          if (executedKeysRef.current.has(eventKey)) {
            continue;
          }

          // Safety 2: if event is overdue by > 55 seconds (e.g. computer woke up from sleep mid-minute or late),
          // skip audio playback and log as SKIPPED
          if (currentSeconds > 55) {
            executedKeysRef.current.add(eventKey);
            const skipLog: BellLog = {
              id: 'log-' + Date.now(),
              timestamp: new Date().toISOString(),
              wibTime: formatTimeHHMMSS(currentJakartaDate),
              dateFormatted: formatDateLog(currentJakartaDate),
              eventId: event.id,
              eventName: event.name,
              audioName: event.audioName || 'Default Bell',
              status: 'SKIPPED',
              reason: 'Event timing exceeded 55 seconds window on schedule check',
            };
            await saveLogToDB(skipLog);
            setLogs((prev) => [skipLog, ...prev.slice(0, 99)]);
            continue;
          }

          // Trigger Bell!
          executedKeysRef.current.add(eventKey);

          // Find assigned audio name for logging
          let resolvedAudioName = event.audioName || 'Built-in Chime';
          if (event.audioId) {
            const foundAudio = audioLibrary.find((a) => a.id === event.audioId);
            if (foundAudio) resolvedAudioName = foundAudio.name;
          }

          try {
            const success = await audioEngine.playAudio({
              audioId: event.audioId,
              eventName: event.name,
              eventVolume: event.volume,
              isManual: false,
            });

            const newLog: BellLog = {
              id: 'log-' + Date.now(),
              timestamp: new Date().toISOString(),
              wibTime: formatTimeHHMMSS(currentJakartaDate),
              dateFormatted: formatDateLog(currentJakartaDate),
              eventId: event.id,
              eventName: event.name,
              audioName: resolvedAudioName,
              status: success ? 'SUCCESS' : 'FAILED',
              reason: success ? undefined : 'Audio playback encountered an issue',
            };

            await saveLogToDB(newLog);
            setLogs((prev) => [newLog, ...prev.slice(0, 99)]);
          } catch (error) {
            console.error('Failed to trigger scheduled bell:', error);
            const failLog: BellLog = {
              id: 'log-' + Date.now(),
              timestamp: new Date().toISOString(),
              wibTime: formatTimeHHMMSS(currentJakartaDate),
              dateFormatted: formatDateLog(currentJakartaDate),
              eventId: event.id,
              eventName: event.name,
              audioName: resolvedAudioName,
              status: 'FAILED',
              reason: String(error),
            };
            await saveLogToDB(failLog);
            setLogs((prev) => [failLog, ...prev.slice(0, 99)]);
          }
        }
      }
    },
    [settings, schedules, audioLibrary]
  );

  // 4. Compute Dynamic Timeline & Activities for Today (Optimized with useMemo)
  const todayEvents = useMemo(() => {
    return schedules
      .filter((event) => event.enabled && event.days.includes(currentDayKey))
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [schedules, currentDayKey]);

  const {
    currentActivityName,
    currentActivityTimeRange,
    nextBell,
    todayScheduleItems,
    countdownSeconds,
  } = useMemo(() => {
    const currentMinutesToday = nowDate.getHours() * 60 + nowDate.getMinutes();
    let actName = 'Tidak Ada Kegiatan Aktif';
    let actTimeRange = '-- : --';
    let closestNext: BellEvent | null = null;
    let minPositiveDiff = Infinity;

    const items = todayEvents.map((event) => {
      const eventStartMinutes = timeStringToMinutes(event.time);
      let eventEndMinutes = event.endTime ? timeStringToMinutes(event.endTime) : eventStartMinutes + 40;

      if (eventEndMinutes < eventStartMinutes) {
        eventEndMinutes = eventStartMinutes + 40;
      }

      const diffSeconds = getSecondsUntilTargetToday(event.time, nowDate);
      let status: 'completed' | 'active' | 'next' | 'upcoming' = 'upcoming';

      if (currentMinutesToday >= eventStartMinutes && currentMinutesToday < eventEndMinutes) {
        status = 'active';
        actName = event.name;
        actTimeRange = `${event.time} - ${event.endTime || 'Selesai'}`;
      } else if (currentMinutesToday >= eventEndMinutes) {
        status = 'completed';
      }

      if (diffSeconds > 0 && diffSeconds < minPositiveDiff) {
        minPositiveDiff = diffSeconds;
        closestNext = event;
      }

      return { event, status };
    });

    if (closestNext) {
      const nextItem = items.find((item) => item.event.id === (closestNext as BellEvent).id);
      if (nextItem && nextItem.status === 'upcoming') {
        nextItem.status = 'next';
      }
    }

    const countdown = closestNext ? Math.max(0, getSecondsUntilTargetToday((closestNext as BellEvent).time, nowDate)) : 0;

    return {
      currentActivityName: actName,
      currentActivityTimeRange: actTimeRange,
      nextBell: closestNext,
      todayScheduleItems: items,
      countdownSeconds: countdown,
    };
  }, [todayEvents, nowDate]);

  const todayMorningActivity = useMemo(() => {
    return morningActivities[currentDayKey] || DEFAULT_MORNING_ACTIVITIES[currentDayKey];
  }, [morningActivities, currentDayKey]);

  // ---------------- ACTIONS ----------------

  const activateBellSystem = async () => {
    const unlocked = await audioEngine.unlockAudio();
    setIsAudioUnlocked(unlocked);
    const updated = { ...settings, isSystemActive: true };
    setSettings(updated);
    await saveSettingsToDB(updated);
  };

  const toggleSystemActive = async () => {
    if (!settings.isSystemActive && !isAudioUnlocked) {
      await activateBellSystem();
    } else {
      const updated = { ...settings, isSystemActive: !settings.isSystemActive };
      setSettings(updated);
      await saveSettingsToDB(updated);
    }
  };

  const setMasterVolume = async (vol: number) => {
    audioEngine.setMasterVolume(vol);
    const updated = { ...settings, masterVolume: vol };
    setSettings(updated);
    await saveSettingsToDB(updated);
  };

  const setMuted = async (muted: boolean) => {
    audioEngine.setMuted(muted);
    const updated = { ...settings, isMuted: muted };
    setSettings(updated);
    await saveSettingsToDB(updated);
  };

  const stopAudio = () => {
    audioEngine.stopCurrentAudio();
  };

  const testBell = async (schedule?: BellEvent) => {
    await audioEngine.unlockAudio();
    setIsAudioUnlocked(true);

    if (schedule) {
      await audioEngine.playAudio({
        audioId: schedule.audioId,
        eventName: `[TEST] ${schedule.name}`,
        eventVolume: schedule.volume,
        isManual: true,
      });
    } else {
      // Test default chime
      await audioEngine.playSynthesizedChime('westminster', '[TEST] Bel Sekolah PAGS', settings.masterVolume, true);
    }
  };

  const playManualBell = async (audioId: string | null, customTitle?: string, volume: number = 1.0): Promise<boolean> => {
    await audioEngine.unlockAudio();
    setIsAudioUnlocked(true);

    let resolvedName = customTitle || 'Bel Manual';
    if (audioId) {
      const found = audioLibrary.find((a) => a.id === audioId);
      if (found) resolvedName = `${resolvedName} (${found.name})`;
    }

    const success = await audioEngine.playAudio({
      audioId,
      eventName: resolvedName,
      eventVolume: volume,
      isManual: true,
    });

    const manualLog: BellLog = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      wibTime: formatTimeHHMMSS(getJakartaDate()),
      dateFormatted: formatDateLog(getJakartaDate()),
      eventName: resolvedName,
      audioName: audioId ? resolvedName : 'Manual Chime',
      status: 'MANUAL',
    };

    await saveLogToDB(manualLog);
    setLogs((prev) => [manualLog, ...prev]);

    return success;
  };

  const saveScheduleItem = async (event: BellEvent) => {
    const updated = schedules.map((s) => (s.id === event.id ? event : s));
    setSchedules(updated);
    await saveSchedulesToDB(updated);
  };

  const addScheduleItem = async (eventData: Omit<BellEvent, 'id'>) => {
    const newEvent: BellEvent = {
      ...eventData,
      id: 'pags-event-' + Date.now(),
    };
    const updated = [...schedules, newEvent].sort((a, b) => a.time.localeCompare(b.time));
    setSchedules(updated);
    await saveSchedulesToDB(updated);
  };

  const deleteScheduleItem = async (id: string) => {
    const updated = schedules.filter((s) => s.id !== id);
    setSchedules(updated);
    await saveSchedulesToDB(updated);
  };

  const duplicateScheduleItem = async (id: string) => {
    const item = schedules.find((s) => s.id === id);
    if (!item) return;
    const duplicated: BellEvent = {
      ...item,
      id: 'pags-event-' + Date.now(),
      name: `${item.name} (Copy)`,
    };
    const updated = [...schedules, duplicated].sort((a, b) => a.time.localeCompare(b.time));
    setSchedules(updated);
    await saveSchedulesToDB(updated);
  };

  const toggleScheduleItem = async (id: string) => {
    const updated = schedules.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s));
    setSchedules(updated);
    await saveSchedulesToDB(updated);
  };

  const uploadAudioFile = async (file: File, customName?: string): Promise<AudioItem> => {
    // Determine audio duration by loading into temporary audio element
    const tempUrl = URL.createObjectURL(file);
    const tempAudio = new Audio(tempUrl);

    const duration: number = await new Promise((resolve) => {
      tempAudio.onloadedmetadata = () => {
        resolve(tempAudio.duration || 0);
        URL.revokeObjectURL(tempUrl);
      };
      tempAudio.onerror = () => {
        resolve(0);
        URL.revokeObjectURL(tempUrl);
      };
    });

    const newAudio: AudioItem = {
      id: 'audio-' + Date.now(),
      name: customName || file.name.replace(/\.[^/.]+$/, ''),
      fileName: file.name,
      size: file.size,
      type: file.type || 'audio/mpeg',
      duration: Math.round(duration),
      blob: file,
      uploadDate: new Date().toISOString(),
      isBuiltIn: false,
    };

    await saveAudioToDB(newAudio);
    setAudioLibrary((previousAudios) => [newAudio, ...previousAudios]);

    // Also support the reverse order: import a configuration first, then
    // upload its referenced audio file afterward.
    const availableAudios = await getAllAudiosFromDB();
    const relinkResult = relinkImportedScheduleAudio(schedules, availableAudios);
    if (relinkResult.relinkedAudioCount > 0) {
      setSchedules(relinkResult.schedules);
      await saveSchedulesToDB(relinkResult.schedules);
    }

    return newAudio;
  };

  const deleteAudioFile = async (id: string) => {
    await deleteAudioFromDB(id);
    setAudioLibrary((prev) => prev.filter((a) => a.id !== id));

    // Update schedules referencing this audio
    const updatedSchedules = schedules.map((s) => (s.audioId === id ? { ...s, audioId: null, audioName: '' } : s));
    setSchedules(updatedSchedules);
    await saveSchedulesToDB(updatedSchedules);
  };

  const renameAudioFile = async (id: string, newName: string) => {
    await renameAudioInDB(id, newName);
    setAudioLibrary((prev) => prev.map((a) => (a.id === id ? { ...a, name: newName } : a)));

    // Update schedules
    const updatedSchedules = schedules.map((s) => (s.audioId === id ? { ...s, audioName: newName } : s));
    setSchedules(updatedSchedules);
    await saveSchedulesToDB(updatedSchedules);
  };

  const previewAudioBlob = async (blob: Blob, name: string) => {
    await audioEngine.previewBlob(blob, name);
  };

  const updateMorningActivity = async (day: DayOfWeek, activity: MorningActivity) => {
    const updated = { ...morningActivities, [day]: activity };
    setMorningActivities(updated);
    await saveMorningActivitiesToDB(updated);
  };

  const clearLogs = async () => {
    await clearAllLogsFromDB();
    setLogs([]);
  };

  const exportSettingsJSON = (): string => {
    const exportData = {
      schoolName: settings.schoolName,
      exportDate: new Date().toISOString(),
      version: '2.0.0',
      settings,
      schedules,
      audioManifest: audioLibrary.map(({ id, name, fileName, size, type, duration }) => ({
        id,
        name,
        fileName,
        size,
        type,
        duration,
      })),
      morningActivities,
      logs: logs.slice(0, 100),
    };
    return JSON.stringify(exportData, null, 2);
  };

  const importSettingsJSON = async (jsonStr: string): Promise<SettingsImportResult> => {
    try {
      const parsed = JSON.parse(jsonStr);
      let importedSettings: SystemSettings | null = null;
      let importedSchedules: BellEvent[] | null = null;
      let relinkedAudioCount = 0;
      let unresolvedAudioCount = 0;

      if (parsed.settings) {
        importedSettings = {
          ...DEFAULT_SETTINGS,
          ...parsed.settings,
          scheduleRevision: parsed.settings.scheduleRevision ?? 1,
        };
      }

      if (parsed.schedules && Array.isArray(parsed.schedules)) {
        importedSchedules = parsed.schedules;

        const availableAudios = await getAllAudiosFromDB();
        const relinkResult = relinkImportedScheduleAudio(
          importedSchedules,
          availableAudios,
          Array.isArray(parsed.audioManifest) ? parsed.audioManifest as AudioManifestItem[] : [],
        );
        importedSchedules = relinkResult.schedules;
        relinkedAudioCount = relinkResult.relinkedAudioCount;
        unresolvedAudioCount = relinkResult.unresolvedAudioCount;

        if (importedSettings && importedSettings.scheduleRevision < CURRENT_SCHEDULE_REVISION) {
          importedSchedules = migrateSchedulesToCurrentRevision(importedSchedules);
          importedSettings.scheduleRevision = CURRENT_SCHEDULE_REVISION;
        }

        await saveSchedulesToDB(importedSchedules);
        setSchedules(importedSchedules);
      }
      if (parsed.morningActivities) {
        await saveMorningActivitiesToDB(parsed.morningActivities);
        setMorningActivities(parsed.morningActivities);
      }
      if (importedSettings) {
        await saveSettingsToDB(importedSettings);
        setSettings(importedSettings);
      }
      return { success: true, relinkedAudioCount, unresolvedAudioCount };
    } catch (e) {
      console.error('Invalid JSON import:', e);
      return { success: false, relinkedAudioCount: 0, unresolvedAudioCount: 0 };
    }
  };

  const resetToDefaults = async () => {
    await saveSchedulesToDB(DEFAULT_SCHEDULES);
    await saveMorningActivitiesToDB(DEFAULT_MORNING_ACTIVITIES);
    await saveSettingsToDB(DEFAULT_SETTINGS);
    setSchedules(DEFAULT_SCHEDULES);
    setMorningActivities(DEFAULT_MORNING_ACTIVITIES);
    setSettings(DEFAULT_SETTINGS);
  };

  const toggleWeekendEnabled = async () => {
    const updated = { ...settings, weekendEnabled: !settings.weekendEnabled };
    setSettings(updated);
    await saveSettingsToDB(updated);
  };

  return (
    <BellContext.Provider
      value={{
        currentTimeString: formatTimeHHMMSS(nowDate),
        currentDayNameID: formatDateDisplayID(nowDate),
        currentDayNameEN: formatDateDisplayEN(nowDate),
        currentDateDisplayEN: formatDateDisplayEN(nowDate),
        currentDateDisplayID: formatDateDisplayID(nowDate),
        currentDayKey,
        settings,
        isAudioUnlocked,
        currentPlaying,
        audioLibrary,
        schedules,
        morningActivities,
        todayMorningActivity,
        logs,
        currentActivityName,
        currentActivityTimeRange,
        nextBell,
        countdownSeconds,
        todayScheduleItems,
        activateBellSystem,
        toggleSystemActive,
        setMasterVolume,
        setMuted,
        stopAudio,
        testBell,
        playManualBell,
        saveScheduleItem,
        addScheduleItem,
        deleteScheduleItem,
        duplicateScheduleItem,
        toggleScheduleItem,
        uploadAudioFile,
        deleteAudioFile,
        renameAudioFile,
        previewAudioBlob,
        updateMorningActivity,
        clearLogs,
        exportSettingsJSON,
        importSettingsJSON,
        resetToDefaults,
        toggleWeekendEnabled,
      }}
    >
      {children}
    </BellContext.Provider>
  );
};

export const useBell = (): BellContextType => {
  const context = useContext(BellContext);
  if (!context) {
    throw new Error('useBell must be used within a BellProvider');
  }
  return context;
};
