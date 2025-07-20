// Re-export simple audio to maintain compatibility
export { audio, useAudio } from './simpleAudio';

// Original audio manager (keeping for reference but not using)
class AudioManager {
  private context: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private enabled = true;
  private volume = 0.7;

  // Sound effect definitions
  private soundUrls = {
    // UI sounds
    tap: '/sounds/tap.mp3',
    swipe: '/sounds/swipe.mp3',
    success: '/sounds/success.mp3',
    error: '/sounds/error.mp3',
    coin: '/sounds/coin.mp3',
    
    // Game sounds
    cardPickup: '/sounds/card-pickup.mp3',
    cardDrop: '/sounds/card-drop.mp3',
    cardStack: '/sounds/card-stack.mp3',
    showSuccess: '/sounds/show-success.mp3',
    showFail: '/sounds/show-fail.mp3',
    crowdCheer: '/sounds/crowd-cheer.mp3',
    
    // Music/ambient
    backgroundPunk: '/sounds/bg-punk.mp3',
    backgroundMetal: '/sounds/bg-metal.mp3',
  };

  constructor() {
    this.init();
  }

  private async init() {
    try {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume context on user interaction (required for mobile)
      document.addEventListener('click', () => {
        if (this.context?.state === 'suspended') {
          this.context.resume();
        }
      }, { once: true });
      
      // Preload essential sounds
      await this.preloadSounds(['tap', 'success', 'error', 'cardPickup', 'cardDrop']);
    } catch (error) {
      console.warn('Audio initialization failed:', error);
      this.enabled = false;
    }
  }

  async preloadSounds(soundNames: string[]) {
    if (!this.context || !this.enabled) return;

    const loadPromises = soundNames.map(async (name) => {
      if (this.sounds.has(name)) return;
      
      const url = this.soundUrls[name as keyof typeof this.soundUrls];
      if (!url) return;

      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.context!.decodeAudioData(arrayBuffer);
        this.sounds.set(name, audioBuffer);
      } catch (error) {
        console.warn(`Failed to load sound: ${name}`, error);
      }
    });

    await Promise.all(loadPromises);
  }

  play(soundName: keyof typeof this.soundUrls, options: {
    volume?: number;
    pitch?: number;
    delay?: number;
  } = {}) {
    if (!this.enabled || !this.context) return;

    const buffer = this.sounds.get(soundName);
    if (!buffer) {
      // Try to load and play
      this.preloadSounds([soundName]).then(() => {
        const newBuffer = this.sounds.get(soundName);
        if (newBuffer) {
          this.playBuffer(newBuffer, options);
        }
      });
      return;
    }

    this.playBuffer(buffer, options);
  }

  private playBuffer(buffer: AudioBuffer, options: {
    volume?: number;
    pitch?: number;
    delay?: number;
  } = {}) {
    if (!this.context) return;

    const source = this.context.createBufferSource();
    const gainNode = this.context.createGain();

    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(this.context.destination);

    // Apply volume
    gainNode.gain.value = (options.volume ?? 1) * this.volume;

    // Apply pitch
    if (options.pitch) {
      source.playbackRate.value = options.pitch;
    }

    // Start playback
    const startTime = this.context.currentTime + (options.delay ?? 0);
    source.start(startTime);
  }

  // Convenience methods for common sounds
  tap() {
    this.play('tap', { volume: 0.5 });
  }

  success() {
    this.play('success', { volume: 0.7 });
  }

  error() {
    this.play('error', { volume: 0.6 });
  }

  cardPickup() {
    this.play('cardPickup', { volume: 0.4 });
  }

  cardDrop() {
    this.play('cardDrop', { volume: 0.4 });
  }

  showResult(success: boolean) {
    this.play(success ? 'showSuccess' : 'showFail', { volume: 0.8 });
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
}

// Singleton instance
// export const audio = new AudioManager();

// React hook for audio settings
// import { useState, useEffect } from 'react';

/* export const useAudio = () => {
  const [enabled, setEnabled] = useState(audio.isEnabled());
  const [volume, setVolume] = useState(0.7);

  useEffect(() => {
    const savedEnabled = localStorage.getItem('audioEnabled');
    const savedVolume = localStorage.getItem('audioVolume');

    if (savedEnabled !== null) {
      const isEnabled = savedEnabled === 'true';
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
    localStorage.setItem('audioEnabled', String(newEnabled));
  };

  const updateVolume = (newVolume: number) => {
    setVolume(newVolume);
    audio.setVolume(newVolume);
    localStorage.setItem('audioVolume', String(newVolume));
  };

  return {
    enabled,
    volume,
    setEnabled: updateEnabled,
    setVolume: updateVolume,
  };
}; */