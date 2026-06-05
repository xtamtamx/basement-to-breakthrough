export interface SoundDefinition {
  path: string;
  volume?: number;
  preload?: boolean;
}

export class SoundManager {
  private static instance: SoundManager;
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private loadedSounds: Set<string> = new Set();
  private enabled: boolean = true;
  private globalVolume: number = 0.5;

  // Sound definitions
  private soundDefinitions: Record<string, SoundDefinition> = {
    click: { path: "/assets/sounds/click.wav", volume: 0.3, preload: true },
    buildingSelect: { path: "/assets/sounds/building-select.wav", volume: 0.4, preload: true },
    menuOpen: { path: "/assets/sounds/menu-open.wav", volume: 0.3, preload: true },
    cameraMove: { path: "/assets/sounds/camera-move.wav", volume: 0.2, preload: false },
  };

  private constructor() {
    // Check if sounds are enabled in localStorage
    const savedEnabled = localStorage.getItem("soundEnabled");
    if (savedEnabled !== null) {
      this.enabled = savedEnabled === "true";
    }

    const savedVolume = localStorage.getItem("soundVolume");
    if (savedVolume !== null) {
      this.globalVolume = parseFloat(savedVolume);
    }

    // Preload essential sounds
    this.preloadSounds();
  }

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  private async preloadSounds() {
    const preloadPromises = Object.entries(this.soundDefinitions)
      .filter(([_, def]) => def.preload)
      .map(([key, def]) => this.loadSound(key, def));

    await Promise.all(preloadPromises);
  }

  private async loadSound(key: string, definition: SoundDefinition): Promise<void> {
    if (this.loadedSounds.has(key)) return;

    try {
      const audio = new Audio(definition.path);
      audio.volume = (definition.volume || 1) * this.globalVolume;
      
      // Wait for the audio to be ready
      await new Promise((resolve, reject) => {
        audio.addEventListener('canplaythrough', resolve, { once: true });
        audio.addEventListener('error', reject, { once: true });
      });

      this.sounds.set(key, audio);
      this.loadedSounds.add(key);
    } catch (error) {
      console.warn(`Failed to load sound: ${key}`, error);
    }
  }

  async play(soundKey: string, options?: { volume?: number; pitch?: number }) {
    if (!this.enabled) return;

    const definition = this.soundDefinitions[soundKey];
    if (!definition) {
      console.warn(`Sound not found: ${soundKey}`);
      return;
    }

    // Load sound if not already loaded
    if (!this.loadedSounds.has(soundKey)) {
      await this.loadSound(soundKey, definition);
    }

    const audio = this.sounds.get(soundKey);
    if (!audio) return;

    try {
      // Clone the audio element to allow overlapping sounds
      const clone = audio.cloneNode() as HTMLAudioElement;
      clone.volume = (options?.volume || definition.volume || 1) * this.globalVolume;
      
      if (options?.pitch) {
        // Web Audio API would be needed for pitch control
        // For now, we'll skip pitch adjustment
      }

      clone.play().catch(err => {
        // Handle autoplay policy restrictions
        console.warn("Sound playback failed:", err);
      });

      // Clean up after playback
      clone.addEventListener('ended', () => {
        clone.remove();
      });
    } catch (error) {
      console.warn(`Error playing sound: ${soundKey}`, error);
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    localStorage.setItem("soundEnabled", enabled.toString());
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setGlobalVolume(volume: number) {
    this.globalVolume = Math.max(0, Math.min(1, volume));
    localStorage.setItem("soundVolume", this.globalVolume.toString());

    // Update volume for all loaded sounds
    this.sounds.forEach((audio, key) => {
      const definition = this.soundDefinitions[key];
      audio.volume = (definition?.volume || 1) * this.globalVolume;
    });
  }

  getGlobalVolume(): number {
    return this.globalVolume;
  }

  // Convenience methods for common sounds
  playClick() {
    this.play("click");
  }

  playBuildingSelect() {
    this.play("buildingSelect");
  }

  playMenuOpen() {
    this.play("menuOpen");
  }

  playCameraMove() {
    this.play("cameraMove");
  }
}

// Export singleton instance
export const soundManager = SoundManager.getInstance();