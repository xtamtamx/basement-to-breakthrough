// Enhanced audio manager for game sounds and music
import { audio as baseAudio } from "./simpleAudio";
import { env } from "../config/env";

import { devLog } from "./devLogger";
class GameAudioManager {
  private context: AudioContext | null = null;
  private musicGainNode: GainNode | null = null;
  private currentMusic: OscillatorNode | null = null;
  private musicTimeout: NodeJS.Timeout | null = null;
  private isPlayingMusic = false;
  private musicVolume = env.defaultMusicVolume;
  private enabled = env.enableAudio;

  constructor() {
    this.init();
  }

  private async init() {
    try {
      // Check if audio is disabled in localStorage
      if (window.localStorage?.getItem("audioDisabled") === "true") {
        this.enabled = false;
        return;
      }

      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.context = new AudioContextClass();
      } else {
        throw new Error("AudioContext not supported");
      }
      this.musicGainNode = this.context.createGain();
      this.musicGainNode.connect(this.context.destination);
      this.musicGainNode.gain.value = this.musicVolume;
    } catch (error) {
      devLog.warn("Game audio initialization failed:", error);
      this.enabled = false;
      // Dispatch event for UI to handle
      window.dispatchEvent(
        new CustomEvent("audio-error", {
          detail: { error: "Audio initialization failed" },
        }),
      );
    }
  }

  // Safe wrapper for audio operations
  private safePlay(audioFn: () => void) {
    if (!this.enabled) return;
    try {
      audioFn();
    } catch (error) {
      devLog.warn("Audio playback error:", error);
      // Don't disable audio for individual playback errors
    }
  }

  // Game-specific sound effects
  venueClick() {
    this.safePlay(() => baseAudio.tap());
  }

  bookShow() {
    this.safePlay(() => baseAudio.pickup());
  }

  showSuccess() {
    this.safePlay(() => baseAudio.success());
  }

  showFailure() {
    this.safePlay(() => baseAudio.error());
  }

  moneyGain() {
    this.safePlay(() => baseAudio.coin());
  }

  synergyDiscovered() {
    this.safePlay(() => baseAudio.achievement());
  }

  gentrificationWarning() {
    // Ominous sound
    if (!this.context || !this.enabled) return;

    try {
      const oscillator = this.context.createOscillator();
      const gainNode = this.context.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.context.destination);

      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(100, this.context.currentTime);
      oscillator.frequency.linearRampToValueAtTime(
        50,
        this.context.currentTime + 0.5,
      );

      gainNode.gain.setValueAtTime(0.2, this.context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        this.context.currentTime + 0.5,
      );

      oscillator.start(this.context.currentTime);
      oscillator.stop(this.context.currentTime + 0.5);
    } catch (error) {
      devLog.warn("Gentrification warning sound error:", error);
    }
  }

  pathChoice() {
    // Decision sound - two notes
    if (!this.context || !this.enabled) return;

    const playNote = (freq: number, delay: number) => {
      const oscillator = this.context!.createOscillator();
      const gainNode = this.context!.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.context!.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(
        freq,
        this.context!.currentTime + delay,
      );

      gainNode.gain.setValueAtTime(0, this.context!.currentTime + delay);
      gainNode.gain.linearRampToValueAtTime(
        0.3,
        this.context!.currentTime + delay + 0.01,
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        this.context!.currentTime + delay + 0.2,
      );

      oscillator.start(this.context!.currentTime + delay);
      oscillator.stop(this.context!.currentTime + delay + 0.2);
    };

    playNote(440, 0); // A4
    playNote(554.37, 0.15); // C#5
  }

  // Background music using generated tones
  startBackgroundMusic(type: "chill" | "intense" | "festival" = "chill") {
    if (!this.context || !this.enabled || this.currentMusic) return;

    // Stop any existing music
    this.stopBackgroundMusic();

    // Create a simple bass line based on type
    const patterns = {
      chill: {
        notes: [110, 110, 138.59, 146.83], // A2, A2, C#3, D3
        tempo: 2,
      },
      intense: {
        notes: [82.41, 82.41, 87.31, 92.5], // E2, E2, F2, F#2
        tempo: 0.5,
      },
      festival: {
        notes: [130.81, 164.81, 196, 164.81], // C3, E3, G3, E3
        tempo: 1,
      },
    };

    const pattern = patterns[type];
    let noteIndex = 0;

    const playBassNote = () => {
      if (!this.context || !this.musicGainNode) return;

      const oscillator = this.context.createOscillator();
      const filterNode = this.context.createBiquadFilter();

      oscillator.connect(filterNode);
      filterNode.connect(this.musicGainNode);

      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(
        pattern.notes[noteIndex],
        this.context.currentTime,
      );

      filterNode.type = "lowpass";
      filterNode.frequency.setValueAtTime(200, this.context.currentTime);

      oscillator.start(this.context.currentTime);
      oscillator.stop(this.context.currentTime + pattern.tempo * 0.8);

      // Cycle through notes
      noteIndex = (noteIndex + 1) % pattern.notes.length;

      // Schedule next note only if still playing
      if (this.isPlayingMusic) {
        this.musicTimeout = setTimeout(playBassNote, pattern.tempo * 1000);
      }

      // Store reference to stop later
      this.currentMusic = oscillator;
    };

    // Start the pattern
    this.isPlayingMusic = true;
    playBassNote();
  }

  stopBackgroundMusic() {
    this.isPlayingMusic = false;
    
    // Clear any pending timeouts
    if (this.musicTimeout) {
      clearTimeout(this.musicTimeout);
      this.musicTimeout = null;
    }
    
    if (this.currentMusic) {
      try {
        this.currentMusic.stop();
      } catch {
        // Already stopped
      }
      this.currentMusic = null;
    }
  }

  setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.musicGainNode) {
      this.musicGainNode.gain.value = this.musicVolume;
    }
  }

  // UI feedback sounds
  buttonHover() {
    if (!this.context || !this.enabled) return;

    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(1200, this.context.currentTime);

    gainNode.gain.setValueAtTime(0.05, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.context.currentTime + 0.05,
    );

    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + 0.05);
  }

  modalOpen() {
    if (!this.context || !this.enabled) return;

    // Swoosh sound
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(200, this.context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      800,
      this.context.currentTime + 0.1,
    );

    gainNode.gain.setValueAtTime(0.2, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.context.currentTime + 0.1,
    );

    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + 0.1);
  }

  modalClose() {
    if (!this.context || !this.enabled) return;

    // Reverse swoosh
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(800, this.context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      200,
      this.context.currentTime + 0.1,
    );

    gainNode.gain.setValueAtTime(0.2, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.context.currentTime + 0.1,
    );

    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + 0.1);
  }

  // Festival sounds
  festivalAmbience() {
    if (!this.context || !this.enabled) return;

    // Crowd noise simulation
    const noiseBuffer = this.context.createBuffer(
      1,
      this.context.sampleRate * 2,
      this.context.sampleRate,
    );
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gainNode = this.context.createGain();

    noise.buffer = noiseBuffer;
    noise.loop = true;

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.context.destination);

    filter.type = "bandpass";
    filter.frequency.value = 1000;
    filter.Q.value = 0.5;

    gainNode.gain.setValueAtTime(0, this.context.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, this.context.currentTime + 1);
    gainNode.gain.linearRampToValueAtTime(0, this.context.currentTime + 5);

    noise.start(this.context.currentTime);
    noise.stop(this.context.currentTime + 5);
  }
}

// Export singleton instance
export const gameAudio = new GameAudioManager();
