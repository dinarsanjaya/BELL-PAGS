import { AudioItem, BellEvent } from '../types';

export type AudioManifestItem = Pick<
  AudioItem,
  'id' | 'name' | 'fileName' | 'size' | 'type' | 'duration' | 'contentHash'
>;

export interface AudioRelinkResult {
  schedules: BellEvent[];
  relinkedAudioCount: number;
  unresolvedAudioCount: number;
}

function normalizeAudioKey(value?: string): string {
  return (value || '')
    .trim()
    .toLocaleLowerCase('id-ID')
    .replace(/\.(mp3|wav|ogg|m4a|aac|flac)$/i, '')
    .replace(/[\s_-]+/g, ' ');
}

function getAudioKeys(audio: Pick<AudioItem, 'name' | 'fileName'>): Set<string> {
  return new Set([normalizeAudioKey(audio.name), normalizeAudioKey(audio.fileName)].filter(Boolean));
}

/**
 * Reconnect imported schedule references to audio files already stored in this
 * browser. Exported IDs are browser-local, so filename/name matching is needed
 * after the same files are uploaded on another browser or device.
 */
export function relinkImportedScheduleAudio(
  schedules: BellEvent[],
  availableAudios: AudioItem[],
  manifest: AudioManifestItem[] = [],
): AudioRelinkResult {
  const availableById = new Map(availableAudios.map((audio) => [audio.id, audio]));
  const manifestById = new Map(manifest.map((audio) => [audio.id, audio]));
  let relinkedAudioCount = 0;
  let unresolvedAudioCount = 0;

  const relinkedSchedules = schedules.map((schedule) => {
    if (schedule.audioId?.startsWith('builtin-')) return schedule;

    if (schedule.audioId) {
      const existingAudio = availableById.get(schedule.audioId);
      if (existingAudio) {
        return { ...schedule, audioName: existingAudio.name };
      }
    }

    const exportedAudio = schedule.audioId ? manifestById.get(schedule.audioId) : undefined;
    const targetKeys = new Set(
      [
        normalizeAudioKey(exportedAudio?.fileName),
        normalizeAudioKey(exportedAudio?.name),
        normalizeAudioKey(schedule.audioName),
      ].filter(Boolean),
    );

    if (targetKeys.size === 0) {
      if (schedule.audioId) unresolvedAudioCount += 1;
      return schedule;
    }

    let matches = exportedAudio?.contentHash
      ? availableAudios.filter((audio) => audio.contentHash === exportedAudio.contentHash)
      : [];

    if (matches.length === 0) {
      matches = availableAudios.filter((audio) => {
        const audioKeys = getAudioKeys(audio);
        return [...targetKeys].some((key) => audioKeys.has(key));
      });
    }

    if (matches.length > 1 && exportedAudio?.size) {
      const sameSizeMatches = matches.filter((audio) => audio.size === exportedAudio.size);
      if (sameSizeMatches.length > 0) matches = sameSizeMatches;
    }

    if (matches.length === 1) {
      relinkedAudioCount += 1;
      return {
        ...schedule,
        audioId: matches[0].id,
        audioName: matches[0].name,
      };
    }

    unresolvedAudioCount += 1;
    return schedule;
  });

  return { schedules: relinkedSchedules, relinkedAudioCount, unresolvedAudioCount };
}
