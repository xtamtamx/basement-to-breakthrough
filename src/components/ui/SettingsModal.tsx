import React from 'react';
import { useAudio } from '@utils/audio';
import { haptics } from '@utils/mobile';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { enabled, volume, setEnabled, setVolume } = useAudio();

  if (!isOpen) return null;

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    haptics.light();
  };

  const toggleSound = () => {
    setEnabled(!enabled);
    haptics.light();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-metal-950 rounded-lg max-w-md w-full p-6 border-2 border-metal-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Settings</h2>
          <button
            onClick={onClose}
            className="touch-target text-metal-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Sound Settings */}
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-metal-300">Audio</h3>
          
          <div className="flex items-center justify-between">
            <span className="text-metal-400">Sound Effects</span>
            <button
              onClick={toggleSound}
              className={`w-12 h-6 rounded-full transition-colors ${
                enabled ? 'bg-punk-600' : 'bg-metal-700'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-metal-400">Volume</span>
              <span className="text-metal-300">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              disabled={!enabled}
              className="w-full h-2 bg-metal-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
              style={{
                background: `linear-gradient(to right, #dc2626 0%, #dc2626 ${volume * 100}%, #4b5563 ${volume * 100}%, #4b5563 100%)`,
              }}
            />
          </div>
        </div>

        {/* Game Info */}
        <div className="mt-6 pt-6 border-t border-metal-800 space-y-2">
          <h3 className="font-bold text-sm text-metal-300">About</h3>
          <p className="text-xs text-metal-500">
            Basement to Breakthrough v0.1.0
          </p>
          <p className="text-xs text-metal-500">
            A roguelike underground music scene builder
          </p>
        </div>

        {/* Controls Guide */}
        <div className="mt-6 pt-6 border-t border-metal-800 space-y-2">
          <h3 className="font-bold text-sm text-metal-300">Controls</h3>
          <div className="space-y-1 text-xs text-metal-400">
            <p>• Drag bands onto venues to book shows</p>
            <p>• Stack cards by dragging them together</p>
            <p>• Tap stacks to expand them</p>
            <p>• Swipe cards for quick actions</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="punk-button w-full mt-6"
        >
          Close
        </button>
      </div>
    </div>
  );
};