// Simple audio manager using Web Audio API to generate sounds
class SimpleAudioManager {
  private context: AudioContext | null = null;
  private enabled = true;
  private volume = 0.7;

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
    } catch (error) {
      console.warn('Audio initialization failed:', error);
      this.enabled = false;
    }
  }

  // Generate a simple tone
  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine') {
    if (!this.enabled || !this.context) return;

    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
    
    // Envelope
    gainNode.gain.setValueAtTime(0, this.context.currentTime);
    gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, this.context.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + duration);
  }

  // Sound effects using generated tones
  tap() {
    this.playTone(800, 0.05, 'square');
  }

  success() {
    // Play a happy chord
    this.playTone(523.25, 0.2); // C5
    setTimeout(() => this.playTone(659.25, 0.2), 50); // E5
    setTimeout(() => this.playTone(783.99, 0.3), 100); // G5
  }

  error() {
    // Play a sad sound
    this.playTone(200, 0.3, 'sawtooth');
  }

  coin() {
    // Coin pickup sound
    this.playTone(1000, 0.05);
    setTimeout(() => this.playTone(1500, 0.1), 50);
  }

  cardPickup() {
    this.playTone(600, 0.05, 'triangle');
  }

  cardDrop() {
    this.playTone(400, 0.1, 'triangle');
  }

  pickup() {
    this.playTone(800, 0.05, 'sine');
  }

  drop() {
    this.playTone(400, 0.08, 'sine');
  }

  achievement() {
    // Achievement sound - triumphant arpeggio
    this.playTone(523.25, 0.15); // C5
    setTimeout(() => this.playTone(659.25, 0.15), 50); // E5
    setTimeout(() => this.playTone(783.99, 0.15), 100); // G5
    setTimeout(() => this.playTone(1046.50, 0.3), 150); // C6
  }

  play(soundName: string, options?: any) {
    // Map old API to new methods
    switch(soundName) {
      case 'tap': this.tap(); break;
      case 'success': this.success(); break;
      case 'error': this.error(); break;
      case 'coin': this.coin(); break;
      case 'cardPickup': this.cardPickup(); break;
      case 'cardDrop': this.cardDrop(); break;
      case 'pickup': this.pickup(); break;
      case 'drop': this.drop(); break;
      case 'achievement': this.achievement(); break;
      default: this.tap(); // Default sound
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
}

// Singleton instance
export const audio = new SimpleAudioManager();

// React hook for audio settings
import { useState, useEffect } from 'react';

export const useAudio = () => {
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
};