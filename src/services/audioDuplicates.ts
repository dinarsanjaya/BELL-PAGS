import { AudioItem } from '../types';

export interface DuplicateAudioMatch {
  audio: AudioItem;
  reason: 'content' | 'filename';
}

function normalizeFileName(value: string): string {
  return value.trim().toLocaleLowerCase('id-ID').replace(/[\s_-]+/g, ' ');
}

export async function calculateAudioContentHash(blob: Blob): Promise<string | undefined> {
  if (!globalThis.crypto?.subtle) return undefined;

  try {
    const digest = await globalThis.crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
    return [...new Uint8Array(digest)]
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  } catch (error) {
    console.warn('Could not hash audio file; falling back to filename detection.', error);
    return undefined;
  }
}

export async function findDuplicateAudio(
  file: File,
  audioLibrary: AudioItem[],
  contentHash?: string,
): Promise<DuplicateAudioMatch | null> {
  if (contentHash) {
    const hashMatch = audioLibrary.find((audio) => audio.contentHash === contentHash);
    if (hashMatch) return { audio: hashMatch, reason: 'content' };
  }

  const normalizedFileName = normalizeFileName(file.name);
  const fileNameMatch = audioLibrary.find(
    (audio) => normalizeFileName(audio.fileName) === normalizedFileName,
  );
  if (fileNameMatch) return { audio: fileNameMatch, reason: 'filename' };

  // Audio uploaded before hashing was introduced can still be identified by
  // hashing only same-sized candidates, avoiding unnecessary large reads.
  if (contentHash) {
    const sameSizeCandidates = audioLibrary.filter(
      (audio) => !audio.contentHash && audio.size === file.size && audio.blob,
    );

    for (const audio of sameSizeCandidates) {
      const existingHash = await calculateAudioContentHash(audio.blob as Blob);
      if (existingHash === contentHash) return { audio, reason: 'content' };
    }
  }

  return null;
}
