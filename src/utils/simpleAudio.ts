import { useState, useEffect } from "react";
import { safeStorage } from "./safeStorage";
import { devLog } from "./devLogger";

// Simple audio manager using Web Audio API to generate sounds
class SimpleAudioManager {
  private context: AudioContext | null = null;
  private enabled = true;
  private volume = 0.7;
  // Master analyser tap — every tone routes through it so visuals (e.g. the map
  // mote overlay) can pulse with the audio. getLevel() reads a 0..1 amplitude.
  private analyser: AnalyserNode | null = null;
  private levelBuf: Uint8Array | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    try {
      // Respect the player's saved sound settings at BOOT (parity with gameAudio's
      // init): without this, a saved mute/volume only took effect once Settings
      // mounted useAudio, so every launch played full-volume stingers until the
      // player reopened Settings. 'audioDisabled' is the AudioErrorBoundary's hard
      // kill (skip building a context at all); 'audioEnabled'/'audioVolume' are the
      // Settings toggles.
      if (safeStorage.getItem("audioDisabled") === "true") {
        this.enabled = false;
        return;
      }
      if (safeStorage.getItem("audioEnabled") === "false") this.enabled = false;
      const savedVolume = safeStorage.getItem("audioVolume");
      if (savedVolume != null) {
        const v = parseFloat(savedVolume);
        if (!Number.isNaN(v)) this.volume = Math.max(0, Math.min(1, v));
      }

      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.context = new AudioContextClass();
        // Master analyser → destination; tones connect to the analyser. Optional:
        // isolated so an unsupported createAnalyser never disables core audio.
        try {
          if (typeof this.context.createAnalyser === 'function') {
            this.analyser = this.context.createAnalyser();
            this.analyser.fftSize = 256;
            this.analyser.smoothingTimeConstant = 0.6;
            this.analyser.connect(this.context.destination);
            this.levelBuf = new Uint8Array(this.analyser.fftSize);
          }
        } catch {
          this.analyser = null; // fall back to direct-to-destination
        }
      }

      // Resume context on user interaction (required for mobile)
      document.addEventListener(
        "click",
        () => {
          if (this.context?.state === "suspended") {
            this.context.resume();
          }
        },
        { once: true },
      );
    } catch (error) {
      devLog.warn("Audio initialization failed:", error);
      this.enabled = false;
    }
  }

  // Generate a simple tone
  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = "sine",
  ) {
    if (!this.enabled || !this.context) return;

    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.analyser ?? this.context.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);

    // Envelope
    gainNode.gain.setValueAtTime(0, this.context.currentTime);
    gainNode.gain.linearRampToValueAtTime(
      this.volume * 0.3,
      this.context.currentTime + 0.01,
    );
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.context.currentTime + duration,
    );

    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + duration);
  }

  /** Current output amplitude 0..1 (RMS) — for audio-reactive visuals. */
  getLevel(): number {
    if (!this.analyser || !this.levelBuf) return 0;
    this.analyser.getByteTimeDomainData(this.levelBuf);
    let sum = 0;
    for (let i = 0; i < this.levelBuf.length; i++) {
      const x = (this.levelBuf[i] - 128) / 128;
      sum += x * x;
    }
    return Math.min(1, Math.sqrt(sum / this.levelBuf.length) * 3.2);
  }

  // Sound effects using generated tones
  tap() {
    this.playTone(800, 0.05, "square");
  }

  success() {
    // Play a happy chord
    this.playTone(523.25, 0.2); // C5
    setTimeout(() => this.playTone(659.25, 0.2), 50); // E5
    setTimeout(() => this.playTone(783.99, 0.3), 100); // G5
  }

  error() {
    // Play a sad sound
    this.playTone(200, 0.3, "sawtooth");
  }

  coin() {
    // Coin pickup sound
    this.playTone(1000, 0.05);
    setTimeout(() => this.playTone(1500, 0.1), 50);
  }

  cardPickup() {
    this.playTone(600, 0.05, "triangle");
  }

  cardDrop() {
    this.playTone(400, 0.1, "triangle");
  }

  pickup() {
    this.playTone(800, 0.05, "sine");
  }

  drop() {
    this.playTone(400, 0.08, "sine");
  }

  achievement() {
    // Achievement sound - triumphant arpeggio
    this.playTone(523.25, 0.15); // C5
    setTimeout(() => this.playTone(659.25, 0.15), 50); // E5
    setTimeout(() => this.playTone(783.99, 0.15), 100); // G5
    setTimeout(() => this.playTone(1046.5, 0.3), 150); // C6
  }

  synergy() {
    // Synergy discovered — a bright shimmering sparkle (high triangle arpeggio).
    this.playTone(1046.5, 0.07, "triangle"); // C6
    setTimeout(() => this.playTone(1318.51, 0.07, "triangle"), 60); // E6
    setTimeout(() => this.playTone(1567.98, 0.07, "triangle"), 120); // G6
    setTimeout(() => this.playTone(2093.0, 0.18, "triangle"), 180); // C7
  }

  soldOut() {
    // Sold-out show — a big rising fanfare (square-wave, punchy).
    this.playTone(392.0, 0.1, "square"); // G4
    setTimeout(() => this.playTone(523.25, 0.1, "square"), 80); // C5
    setTimeout(() => this.playTone(659.25, 0.1, "square"), 160); // E5
    setTimeout(() => this.playTone(783.99, 0.28, "square"), 240); // G5
  }

  play(soundName: string) {
    // Map old API to new methods
    switch (soundName) {
      case "tap":
        this.tap();
        break;
      case "success":
        this.success();
        break;
      case "error":
        this.error();
        break;
      case "coin":
        this.coin();
        break;
      case "cardPickup":
        this.cardPickup();
        break;
      case "cardDrop":
        this.cardDrop();
        break;
      case "pickup":
        this.pickup();
        break;
      case "drop":
        this.drop();
        break;
      case "achievement":
        this.achievement();
        break;
      case "synergy":
        this.synergy();
        break;
      case "soldOut":
        this.soldOut();
        break;
      default:
        this.tap(); // Default sound
    }
  }

  // Settings
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  isEnabled() {
    return this.enabled;
  }

  getVolume() {
    return this.volume;
  }
}

// Singleton instance
export const audio = new SimpleAudioManager();

// React hook for audio settings
export const useAudio = () => {
  const [enabled, setEnabled] = useState(audio.isEnabled());
  const [volume, setVolume] = useState(audio.getVolume());

  useEffect(() => {
    const savedEnabled = safeStorage.getItem("audioEnabled");
    const savedVolume = safeStorage.getItem("audioVolume");

    if (savedEnabled !== null) {
      const isEnabled = savedEnabled === "true";
      setEnabled(isEnabled);
      audio.setEnabled(isEnabled);
    }

    if (savedVolume !== null) {
      const vol = parseFloat(savedVolume);
      setVolume(vol);
      audio.setVolume(vol);
    }
  }, []);

  const updateEnabled = (newEnabled: boolean) => {
    setEnabled(newEnabled);
    audio.setEnabled(newEnabled);
    safeStorage.setItem("audioEnabled", String(newEnabled));
  };

  const updateVolume = (newVolume: number) => {
    setVolume(newVolume);
    audio.setVolume(newVolume);
    safeStorage.setItem("audioVolume", String(newVolume));
  };

  return {
    enabled,
    volume,
    setEnabled: updateEnabled,
    setVolume: updateVolume,
  };
};
