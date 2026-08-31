import { DayOfWeek } from '../types';

export const DAY_NAMES_ID: Record<number, DayOfWeek> = {
  0: 'minggu',
  1: 'senin',
  2: 'selasa',
  3: 'rabu',
  4: 'kamis',
  5: 'jumat',
  6: 'sabtu',
};

export const DAY_LABELS_ID: Record<DayOfWeek, string> = {
  senin: 'Senin',
  selasa: 'Selasa',
  rabu: 'Rabu',
  kamis: 'Kamis',
  jumat: 'Jumat',
  sabtu: 'Sabtu',
  minggu: 'Minggu',
};

export const DAY_LABELS_EN: Record<DayOfWeek, string> = {
  senin: 'MONDAY',
  selasa: 'TUESDAY',
  rabu: 'WEDNESDAY',
  kamis: 'THURSDAY',
  jumat: 'FRIDAY',
  sabtu: 'SATURDAY',
  minggu: 'SUNDAY',
};

export const MONTH_NAMES_EN = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

export const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Returns a Date object adjusted to Asia/Jakarta timezone (WIB, UTC+7).
 */
export function getJakartaDate(): Date {
  const now = new Date();
  // Format to Asia/Jakarta string then reconstruct Date
  const jakartaTimeString = now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
  return new Date(jakartaTimeString);
}

/**
 * Get current day of week key in lowercase ('senin', 'selasa', etc.) in WIB.
 */
export function getCurrentDayOfWeekJakarta(): DayOfWeek {
  const jakartaDate = getJakartaDate();
  const dayIndex = jakartaDate.getDay();
  return DAY_NAMES_ID[dayIndex];
}

/**
 * Format Jakarta time to HH:mm:ss
 */
export function formatTimeHHMMSS(date: Date = getJakartaDate()): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Format Jakarta time to HH:mm
 */
export function formatTimeHHMM(date: Date = getJakartaDate()): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Format Jakarta date to "31 AUGUST 2026"
 */
export function formatDateDisplayEN(date: Date = getJakartaDate()): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = MONTH_NAMES_EN[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Format Jakarta date to "31 Agustus 2026"
 */
export function formatDateDisplayID(date: Date = getJakartaDate()): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = MONTH_NAMES_ID[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Format to standard log date "31/08/2026"
 */
export function formatDateLog(date: Date = getJakartaDate()): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Generates an execution key for safety against duplicate runs in a single minute:
 * e.g. "2026-08-31-07-30-event_1"
 */
export function getExecutionKey(eventId: string, date: Date = getJakartaDate()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}-${hours}-${minutes}-${eventId}`;
}

/**
 * Parse time string "HH:mm" into minutes since start of day.
 */
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

/**
 * Parse time string "HH:mm" into total seconds since midnight.
 */
export function timeStringToSeconds(timeStr: string): number {
  return timeStringToMinutes(timeStr) * 60;
}

/**
 * Calculate difference in seconds from now (WIB) to target "HH:mm".
 * If target is later today, returns positive seconds.
 * If target has already passed today, returns negative seconds.
 */
export function getSecondsUntilTargetToday(targetTimeHHMM: string, now: Date = getJakartaDate()): number {
  const currentSecondsToday = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const targetSeconds = timeStringToSeconds(targetTimeHHMM);
  return targetSeconds - currentSecondsToday;
}

/**
 * Format seconds (e.g. 1054) into "00 : 17 : 34" format.
 */
export function formatCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return '00 : 00 : 00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hStr = String(hours).padStart(2, '0');
  const mStr = String(minutes).padStart(2, '0');
  const sStr = String(seconds).padStart(2, '0');

  return `${hStr} : ${mStr} : ${sStr}`;
}
