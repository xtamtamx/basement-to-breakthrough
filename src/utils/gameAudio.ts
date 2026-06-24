// Enhanced audio manager for game sounds and music
import { audio as baseAudio } from "./simpleAudio";
import { env } from "../config/env";

import { devLog } from "./devLogger";

interface MusicTrack {
  bpm: number;
  lead: OscillatorType; // arp/melody waveform
  leadGain: number;
  bright: number; // arp low-pass cutoff (Hz)
  hatGain: number;
  chords: number[][]; // [root, third, fifth] (Hz) per bar, looped; arp plays these an octave up
}

// Tiny looping chiptune beds — bass + octave-up arp + kick/hat over a 4-bar
// chord loop, synthesized live (no audio files). Roots voiced low (~A2–C3).
const MUSIC_TRACKS: Record<"chill" | "intense" | "festival", MusicTrack> = {
  // Am–F–C–G: wistful, easy basement vibe
  chill: {
    bpm: 96, lead: "triangle", leadGain: 0.12, bright: 2600, hatGain: 0.05,
    chords: [
      [110.0, 130.81, 164.81], // Am
      [87.31, 110.0, 130.81], // F
      [130.81, 164.81, 196.0], // C
      [98.0, 123.47, 146.83], // G
    ],
  },
  // Em–C–G–D: driving punk
  intense: {
    bpm: 142, lead: "square", leadGain: 0.1, bright: 3400, hatGain: 0.06,
    chords: [
      [82.41, 98.0, 123.47], // Em
      [130.81, 164.81, 196.0], // C
      [98.0, 123.47, 146.83], // G
      [73.42, 92.5, 110.0], // D
    ],
  },
  // C–G–Am–F: bright festival singalong
  festival: {
    bpm: 124, lead: "square", leadGain: 0.13, bright: 3200, hatGain: 0.06,
    chords: [
      [130.81, 164.81, 196.0], // C
      [98.0, 123.47, 146.83], // G
      [110.0, 130.81, 164.81], // Am
      [87.31, 110.0, 130.81], // F
    ],
  },
};

class GameAudioManager {
  private context: AudioContext | null = null;
  private musicGainNode: GainNode | null = null;
  private musicScheduler: NodeJS.Timeout | null = null;
  private musicVoices = new Set<AudioScheduledSourceNode>();
  private nextStepTime = 0;
  private stepIndex = 0;
  private isPlayingMusic = false;
  private currentTrackType: "chill" | "intense" | "festival" | null = null;
  private musicVolume = env.defaultMusicVolume;
  private enabled = env.enableAudio;

  constructor() {
    this.init();
  }

  private async init() {
    try {
      // Respect the player's saved audio settings (shared with simpleAudio):
      // 'audioDisabled' is the AudioErrorBoundary's hard kill (no context at all);
      // 'audioEnabled' is the Settings toggle (default on); 'audioVolume' drives
      // the music bed. We still build the context when soft-disabled so re-enabling
      // from Settings works without a reload.
      if (window.localStorage?.getItem("audioDisabled") === "true") {
        this.enabled = false;
        return;
      }
      if (window.localStorage?.getItem("audioEnabled") === "false") this.enabled = false;
      const savedVol = window.localStorage?.getItem("audioVolume");
      if (savedVol != null) {
        const v = parseFloat(savedVol);
        if (!Number.isNaN(v)) this.musicVolume = Math.max(0, Math.min(1, v));
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

      // iOS/Capacitor start every AudioContext 'suspended' until a user gesture.
      // This is a SEPARATE context from simpleAudio's, so it needs its OWN resume
      // on first interaction — otherwise the music bed + gameAudio SFX stay silent
      // for the whole session.
      const resumeOnGesture = () => {
        this.resume();
        document.removeEventListener("pointerdown", resumeOnGesture);
        document.removeEventListener("keydown", resumeOnGesture);
      };
      document.addEventListener("pointerdown", resumeOnGesture);
      document.addEventListener("keydown", resumeOnGesture);
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

  // Background music: a small looping chiptune (bass + octave-up arp + kick/hat
  // over a 4-bar chord progression), synthesized live and scheduled on the
  // audio clock with a look-ahead so loops stay tight and seamless.
  startBackgroundMusic(type: "chill" | "intense" | "festival" = "chill") {
    if (!this.context || !this.enabled || this.isPlayingMusic) return;

    const track = MUSIC_TRACKS[type];
    this.isPlayingMusic = true;
    this.currentTrackType = type;
    this.stepIndex = 0;
    this.nextStepTime = this.context.currentTime + 0.12;
    const secPerStep = 60 / track.bpm / 4; // 16th notes
    const LOOKAHEAD = 0.25; // seconds of notes to queue ahead each tick

    const tick = () => {
      if (!this.isPlayingMusic || !this.context) return;
      while (this.nextStepTime < this.context.currentTime + LOOKAHEAD) {
        this.scheduleStep(track, this.stepIndex, this.nextStepTime, secPerStep);
        this.nextStepTime += secPerStep;
        this.stepIndex = (this.stepIndex + 1) % (track.chords.length * 16);
      }
      this.musicScheduler = setTimeout(tick, 25);
    };
    tick();
  }

  // One 16th-note step: bass on the quarter notes, an octave-up arp on the even
  // subdivisions, a kick on beats 1 & 3, and a hat on the off-beats.
  private scheduleStep(track: MusicTrack, step: number, time: number, dur: number) {
    const inBar = step % 16;
    const chord = track.chords[Math.floor(step / 16) % track.chords.length];

    if (inBar % 4 === 0) this.musicTone(chord[0], time, dur * 3.4, "square", 0.22, 700);
    if (inBar % 2 === 0) {
      const arp = [chord[0] * 2, chord[1] * 2, chord[2] * 2, chord[1] * 2];
      this.musicTone(arp[(inBar / 2) % 4], time, dur * 1.5, track.lead, track.leadGain, track.bright);
    }
    if (inBar === 0 || inBar === 8) this.musicKick(time);
    if (inBar % 4 === 2) this.musicHat(time, track.hatGain);
  }

  private musicTone(freq: number, time: number, dur: number, type: OscillatorType, gain: number, cutoff: number) {
    if (!this.context || !this.musicGainNode) return;
    const osc = this.context.createOscillator();
    const env = this.context.createGain();
    const filter = this.context.createBiquadFilter();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(cutoff, time);
    env.gain.setValueAtTime(0.0001, time);
    env.gain.linearRampToValueAtTime(gain, time + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0008, time + dur);
    osc.connect(filter);
    filter.connect(env);
    env.connect(this.musicGainNode);
    osc.start(time);
    osc.stop(time + dur + 0.03);
    this.trackVoice(osc);
  }

  private musicKick(time: number) {
    if (!this.context || !this.musicGainNode) return;
    const osc = this.context.createOscillator();
    const env = this.context.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);
    env.gain.setValueAtTime(0.5, time);
    env.gain.exponentialRampToValueAtTime(0.001, time + 0.16);
    osc.connect(env);
    env.connect(this.musicGainNode);
    osc.start(time);
    osc.stop(time + 0.18);
    this.trackVoice(osc);
  }

  private musicHat(time: number, gain: number) {
    if (!this.context || !this.musicGainNode) return;
    const buffer = this.context.createBuffer(1, Math.floor(this.context.sampleRate * 0.05), this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = this.context.createBufferSource();
    const env = this.context.createGain();
    const filter = this.context.createBiquadFilter();
    src.buffer = buffer;
    filter.type = "highpass";
    filter.frequency.value = 7000;
    env.gain.setValueAtTime(gain, time);
    env.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
    src.connect(filter);
    filter.connect(env);
    env.connect(this.musicGainNode);
    src.start(time);
    src.stop(time + 0.05);
    this.trackVoice(src);
  }

  // Track live voices so stopBackgroundMusic can kill them; auto-prune on end.
  private trackVoice(node: AudioScheduledSourceNode) {
    this.musicVoices.add(node);
    node.onended = () => this.musicVoices.delete(node);
  }

  /** Switch the looping bed to a different track as the run heats up (chill →
   *  intense → festival). No-op if already on that track; otherwise restarts the
   *  scheduler on the new chord loop (a brief seam, fine for an infrequent swap). */
  setMusicTrack(type: "chill" | "intense" | "festival") {
    if (!this.enabled) return;
    if (this.isPlayingMusic && this.currentTrackType === type) return;
    const wasPlaying = this.isPlayingMusic;
    if (wasPlaying) this.stopBackgroundMusic();
    this.startBackgroundMusic(type);
  }

  stopBackgroundMusic() {
    this.isPlayingMusic = false;
    if (this.musicScheduler) {
      clearTimeout(this.musicScheduler);
      this.musicScheduler = null;
    }
    this.musicVoices.forEach((v) => {
      try {
        v.stop();
      } catch {
        // already stopped
      }
    });
    this.musicVoices.clear();
  }

  setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.musicGainNode) {
      this.musicGainNode.gain.value = this.musicVolume;
    }
  }

  /** Resume the (autoplay-policy-)suspended context. Safe to call repeatedly. */
  resume() {
    if (this.context && this.context.state === "suspended") {
      this.context.resume().catch(() => {});
    }
  }

  /** Settings toggle. Mutes the music bed immediately when turned off, and
   *  restarts it (resuming the context) when turned back on if a track was active
   *  this session — so the Sound switch actually controls the music + gameAudio SFX. */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.stopBackgroundMusic();
    } else {
      this.resume();
      if (this.currentTrackType) this.startBackgroundMusic(this.currentTrackType);
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
