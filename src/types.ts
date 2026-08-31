export type DayOfWeek = 'senin' | 'selasa' | 'rabu' | 'kamis' | 'jumat' | 'sabtu' | 'minggu';

export interface BellEvent {
  id: string;
  name: string;
  time: string; // HH:mm format (e.g. "07:30")
  endTime?: string; // HH:mm format (e.g. "08:50")
  days: DayOfWeek[]; // active days
  audioId: string | null; // ID of audio in IndexedDB or built-in sound ID
  audioName?: string; // Cache of audio name for display
  volume: number; // 0.0 to 1.0
  enabled: boolean;
  category?: 'morning' | 'class' | 'recess' | 'ishoma' | 'prayer' | 'study' | 'extracurricular' | 'dismissal' | 'other';
  jpCount?: number; // 1, 2, or 3 JP
  description?: string;
  notes?: string;
}

export interface AudioItem {
  id: string;
  name: string;
  fileName: string;
  size: number; // in bytes
  type: string; // mime type (e.g. "audio/mpeg")
  duration: number; // in seconds
  blob?: Blob; // stored in IndexedDB
  contentHash?: string; // SHA-256 used to prevent duplicate uploads
  uploadDate: string; // ISO date string
  isBuiltIn?: boolean;
  builtInType?: 'westminster' | 'school-classic' | 'pleasant-gong' | 'digital-chime';
}

export interface MorningActivity {
  day: DayOfWeek;
  title: string;
  smpTitle?: string;
  smaTitle?: string;
  timeRange: string; // "06:45 - 07:30"
  description?: string;
}

export interface BellLog {
  id: string;
  timestamp: string; // ISO string
  wibTime: string; // e.g. "08:50:00"
  dateFormatted: string; // e.g. "31/08/2026"
  eventId?: string;
  eventName: string;
  audioName: string;
  status: 'SUCCESS' | 'MANUAL' | 'FAILED' | 'SKIPPED';
  reason?: string;
}

export interface CurrentPlayingState {
  isPlaying: boolean;
  eventId?: string;
  eventName: string;
  audioName: string;
  audioId?: string;
  currentTime: number;
  duration: number;
  progress: number; // 0 to 100
  isManual?: boolean;
}

export interface SystemSettings {
  isSystemActive: boolean;
  masterVolume: number; // 0 to 1
  isMuted: boolean;
  weekendEnabled: boolean; // whether Saturday & Sunday bell can run
  autoDismissFloatingPlayerSeconds: number;
  schoolName: string;
  subTitle: string;
  scheduleRevision: number; // internal revision for one-time default timetable migrations
}
