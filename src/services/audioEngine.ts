import { AudioItem, CurrentPlayingState } from '../types';
import { getAudioByIdFromDB } from './db';

type PlaybackListener = (state: CurrentPlayingState) => void;

class AudioEngine {
  private currentAudioElement: HTMLAudioElement | null = null;
  private currentBlobUrl: string | null = null;
  private audioContext: AudioContext | null = null;
  private masterVolume: number = 1.0;
  private isMuted: boolean = false;
  private listeners: Set<PlaybackListener> = new Set();
  private progressInterval: number | null = null;
  private currentSynthStopFn: (() => void) | null = null;

  public currentPlaying: CurrentPlayingState = {
    isPlaying: false,
    eventName: '',
    audioName: '',
    currentTime: 0,
    duration: 0,
    progress: 0,
  };

  constructor() {
    // Lazy AudioContext initialization
  }

  public getAudioContext(): AudioContext {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioCtx();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  /**
   * Unlock Web Audio & Autoplay on user gesture
   */
  public async unlockAudio(): Promise<boolean> {
    try {
      const ctx = this.getAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Create a short, inaudible ping to satisfy browser autoplay requirements
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0.001; // virtually silent
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(0);
      osc.stop(ctx.currentTime + 0.05);

      return true;
    } catch (e) {
      console.warn('Could not unlock audio context automatically:', e);
      return false;
    }
  }

  public subscribe(listener: PlaybackListener): () => void {
    this.listeners.add(listener);
    listener(this.currentPlaying);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      listener({ ...this.currentPlaying });
    }
  }

  public setMasterVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.currentAudioElement) {
      this.currentAudioElement.volume = this.masterVolume;
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.currentAudioElement) {
      this.currentAudioElement.muted = muted;
    }
  }

  public getEffectiveVolume(eventVolume: number = 1.0): number {
    if (this.isMuted) return 0;
    return Math.max(0, Math.min(1, this.masterVolume * eventVolume));
  }

  /**
   * Stop any currently playing audio immediately
   */
  public stopCurrentAudio() {
    if (this.progressInterval) {
      window.clearInterval(this.progressInterval);
      this.progressInterval = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // ignore
      }
    }

    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement.currentTime = 0;
      this.currentAudioElement.src = '';
      this.currentAudioElement = null;
    }

    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = null;
    }

    if (this.currentSynthStopFn) {
      this.currentSynthStopFn();
      this.currentSynthStopFn = null;
    }

    this.currentPlaying = {
      isPlaying: false,
      eventName: '',
      audioName: '',
      currentTime: 0,
      duration: 0,
      progress: 0,
    };
    this.notifyListeners();
  }

  /**
   * Play audio item from DB or fallback chime
   */
  public async playAudio(params: {
    audioId: string | null;
    eventName: string;
    eventVolume?: number;
    isManual?: boolean;
  }): Promise<boolean> {
    const { audioId, eventName, eventVolume = 1.0, isManual = false } = params;

    // Interrupt old audio first
    this.stopCurrentAudio();

    const targetVolume = this.getEffectiveVolume(eventVolume);
    if (targetVolume === 0 && this.isMuted) {
      console.warn('Audio is muted');
    }

    // If no custom audio or procedural chime requested
    if (!audioId || audioId.startsWith('builtin-')) {
      const chimeType = audioId ? audioId.replace('builtin-', '') : 'westminster';
      return this.playSynthesizedChime(chimeType, eventName, targetVolume, isManual);
    }

    // Fetch user-uploaded MP3/WAV from IndexedDB
    try {
      const audioItem = await getAudioByIdFromDB(audioId);
      if (!audioItem || !audioItem.blob) {
        console.warn(`Audio file ${audioId} not found in user uploaded library. Playing chime fallback.`);
        return this.playSynthesizedChime('school-classic', `${eventName} (Bel Fallback)`, targetVolume, isManual);
      }

      this.currentBlobUrl = URL.createObjectURL(audioItem.blob);
      const audio = new Audio(this.currentBlobUrl);
      this.currentAudioElement = audio;
      audio.volume = targetVolume;
      audio.muted = this.isMuted;

      this.currentPlaying = {
        isPlaying: true,
        eventName,
        audioName: audioItem.name || audioItem.fileName,
        audioId: audioItem.id,
        currentTime: 0,
        duration: audioItem.duration || 10,
        progress: 0,
        isManual,
      };
      this.notifyListeners();

      return new Promise<boolean>((resolve) => {
        audio.onloadedmetadata = () => {
          if (audio.duration && isFinite(audio.duration)) {
            this.currentPlaying.duration = audio.duration;
            this.notifyListeners();
          }
        };

        this.progressInterval = window.setInterval(() => {
          if (audio && !audio.paused) {
            const cur = audio.currentTime || 0;
            const dur = audio.duration || this.currentPlaying.duration || 1;
            this.currentPlaying.currentTime = cur;
            this.currentPlaying.duration = dur;
            this.currentPlaying.progress = Math.min(100, (cur / dur) * 100);
            this.notifyListeners();
          }
        }, 250);

        audio.onended = () => {
          this.stopCurrentAudio();
          resolve(true);
        };

        audio.onerror = (err) => {
          console.error('Audio playback error:', err);
          this.stopCurrentAudio();
          resolve(false);
        };

        audio.play().catch((playError) => {
          console.error('Playback failed due to browser restriction or decode error:', playError);
          this.stopCurrentAudio();
          this.playSynthesizedChime('westminster', `${eventName} (Fallback Chime)`, targetVolume, isManual);
          resolve(true);
        });
      });
    } catch (err) {
      console.error('Error retrieving audio from IndexedDB:', err);
      return this.playSynthesizedChime('westminster', eventName, targetVolume, isManual);
    }
  }

  /**
   * Preview a raw Blob before or after upload
   */
  public async previewBlob(blob: Blob, name: string): Promise<void> {
    this.stopCurrentAudio();
    this.currentBlobUrl = URL.createObjectURL(blob);
    const audio = new Audio(this.currentBlobUrl);
    this.currentAudioElement = audio;
    audio.volume = this.getEffectiveVolume(1.0);

    this.currentPlaying = {
      isPlaying: true,
      eventName: 'Audio Preview',
      audioName: name,
      currentTime: 0,
      duration: 10,
      progress: 0,
      isManual: true,
    };
    this.notifyListeners();

    audio.onloadedmetadata = () => {
      this.currentPlaying.duration = audio.duration || 10;
      this.notifyListeners();
    };

    this.progressInterval = window.setInterval(() => {
      if (audio && !audio.paused) {
        const cur = audio.currentTime || 0;
        const dur = audio.duration || 10;
        this.currentPlaying.currentTime = cur;
        this.currentPlaying.duration = dur;
        this.currentPlaying.progress = Math.min(100, (cur / dur) * 100);
        this.notifyListeners();
      }
    }, 250);

    audio.onended = () => {
      this.stopCurrentAudio();
    };

    await audio.play();
  }

  /**
   * High-quality procedural bell synthesis via Web Audio API
   */
  public playSynthesizedChime(
    type: string = 'westminster',
    eventName: string = 'Bell Test',
    volume: number = 1.0,
    isManual: boolean = false
  ): Promise<boolean> {
    this.stopCurrentAudio();
    const ctx = this.getAudioContext();

    const notes: { freq: number; start: number; duration: number }[] = [];
    let totalDuration = 4.0;
    let label = 'Westminster Quarters';

    if (type === 'school-classic' || type === 'classic') {
      // 2-tone Ding-Dong (High-Low)
      label = 'Classic 2-Tone School Bell';
      notes.push({ freq: 659.25, start: 0.0, duration: 1.2 }); // E5
      notes.push({ freq: 523.25, start: 1.0, duration: 2.0 }); // C5
      totalDuration = 3.2;
    } else if (type === 'pleasant-gong' || type === 'gong') {
      // 3-Tone Ascending Gong
      label = '3-Tone Harmonious Bell';
      notes.push({ freq: 440.0, start: 0.0, duration: 1.2 }); // A4
      notes.push({ freq: 554.37, start: 0.9, duration: 1.2 }); // C#5
      notes.push({ freq: 659.25, start: 1.8, duration: 2.5 }); // E5
      totalDuration = 4.5;
    } else if (type === 'digital-chime' || type === 'digital') {
      // 4-note ascending chime
      label = 'Modern Digital School Chime';
      notes.push({ freq: 523.25, start: 0.0, duration: 0.8 }); // C5
      notes.push({ freq: 659.25, start: 0.6, duration: 0.8 }); // E5
      notes.push({ freq: 783.99, start: 1.2, duration: 0.8 }); // G5
      notes.push({ freq: 1046.5, start: 1.8, duration: 2.0 }); // C6
      totalDuration = 4.0;
    } else {
      // Westminster Chimes (G#4, F#4, E4, B3) -> (E4, G#4, F#4, B3)
      label = 'Westminster School Chime';
      notes.push({ freq: 415.3, start: 0.0, duration: 1.2 }); // G#4
      notes.push({ freq: 369.99, start: 1.0, duration: 1.2 }); // F#4
      notes.push({ freq: 329.63, start: 2.0, duration: 1.2 }); // E4
      notes.push({ freq: 246.94, start: 3.0, duration: 2.5 }); // B3
      totalDuration = 5.6;
    }

    const startTime = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume * 0.8, startTime);
    masterGain.connect(ctx.destination);

    const activeOscillators: OscillatorNode[] = [];

    // Synthesize each bell note with rich harmonic overtones & natural exponential decay
    for (const note of notes) {
      const noteStart = startTime + note.start;
      const noteEnd = noteStart + note.duration;

      // Fundamental harmonic
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(note.freq, noteStart);
      gain1.gain.setValueAtTime(0, noteStart);
      gain1.gain.linearRampToValueAtTime(0.7, noteStart + 0.03); // crisp attack
      gain1.gain.exponentialRampToValueAtTime(0.0001, noteEnd); // acoustic decay
      osc1.connect(gain1);
      gain1.connect(masterGain);

      // Overtone 1 (2nd harmonic / chime ring)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(note.freq * 2.76, noteStart); // metallic chime overtone
      gain2.gain.setValueAtTime(0, noteStart);
      gain2.gain.linearRampToValueAtTime(0.2, noteStart + 0.02);
      gain2.gain.exponentialRampToValueAtTime(0.0001, noteStart + note.duration * 0.6);
      osc2.connect(gain2);
      gain2.connect(masterGain);

      osc1.start(noteStart);
      osc1.stop(noteEnd);
      osc2.start(noteStart);
      osc2.stop(noteEnd);

      activeOscillators.push(osc1, osc2);
    }

    this.currentPlaying = {
      isPlaying: true,
      eventName,
      audioName: label,
      currentTime: 0,
      duration: totalDuration,
      progress: 0,
      isManual,
    };
    this.notifyListeners();

    const startTimestamp = Date.now();
    this.progressInterval = window.setInterval(() => {
      const elapsed = (Date.now() - startTimestamp) / 1000;
      this.currentPlaying.currentTime = elapsed;
      this.currentPlaying.progress = Math.min(100, (elapsed / totalDuration) * 100);
      this.notifyListeners();
    }, 250);

    this.currentSynthStopFn = () => {
      try {
        for (const osc of activeOscillators) {
          osc.stop();
        }
      } catch (e) {
        // already stopped
      }
    };

    return new Promise<boolean>((resolve) => {
      window.setTimeout(() => {
        if (this.currentPlaying.isPlaying && this.currentPlaying.eventName === eventName) {
          this.stopCurrentAudio();
        }
        resolve(true);
      }, totalDuration * 1000);
    });
  }
}

export const audioEngine = new AudioEngine();

export interface BuiltInAudioTrack {
  id: string;
  name: string;
  category?: 'chime';
  type: string;
  description: string;
  estimatedDuration?: number;
}

export const BUILT_IN_CHIMES: BuiltInAudioTrack[] = [
  {
    id: 'builtin-westminster',
    name: 'Westminster Chime (Default Procedural Bell)',
    category: 'chime',
    type: 'westminster',
    description: 'Chime klasik 4-nada khas sekolah',
    estimatedDuration: 6,
  },
  {
    id: 'builtin-school-classic',
    name: 'Ding-Dong 2-Tone Chime',
    category: 'chime',
    type: 'school-classic',
    description: 'Dua nada jernih penanda pergantian cepat',
    estimatedDuration: 4,
  },
  {
    id: 'builtin-pleasant-gong',
    name: 'Harmonious Chime (3-Tone)',
    category: 'chime',
    type: 'pleasant-gong',
    description: 'Harmoni 3 nada lembut',
    estimatedDuration: 5,
  },
  {
    id: 'builtin-digital-chime',
    name: 'Digital School Chime',
    category: 'chime',
    type: 'digital-chime',
    description: 'Nada digital 4 ketukan',
    estimatedDuration: 5,
  },
];

