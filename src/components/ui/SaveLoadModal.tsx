import React, { useState } from 'react';
import { useSaveGame, SaveGame } from '@game/mechanics/SaveSystem';
import { useGameStore } from '@stores/gameStore';
import { haptics } from '@utils/mobile';
import { audio } from '@utils/audio';

interface SaveLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'save' | 'load';
}

export const SaveLoadModal: React.FC<SaveLoadModalProps> = ({
  isOpen,
  onClose,
  mode,
}) => {
  const [saveName, setSaveName] = useState('');
  const [selectedSave, setSelectedSave] = useState<string | null>(null);
  const { saves, loading, error, save, load, deleteSave } = useSaveGame();
  const gameStore = useGameStore();

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!saveName.trim()) return;

    // Create game state from store
    const gameState = {
      id: 'current',
      turn: 1, // TODO: Get from turn manager
      phase: gameStore.phase,
      resources: {
        money: gameStore.money,
        reputation: gameStore.reputation,
        connections: 0,
        stress: 0,
      },
      bookedShows: [],
      availableBands: [],
      sceneReputation: { overall: gameStore.reputation, factions: [], relationships: [] },
      unlockedContent: [],
      achievements: [],
      settings: {} as any,
    };

    await save(saveName, gameState);
    setSaveName('');
    haptics.success();
    audio.success();
  };

  const handleLoad = async () => {
    if (!selectedSave) return;

    const saveGame = await load(selectedSave);
    if (saveGame) {
      // Apply loaded state to game store
      gameStore.setPhase(saveGame.gameState.phase);
      gameStore.addMoney(saveGame.gameState.resources.money - gameStore.money);
      gameStore.addReputation(saveGame.gameState.resources.reputation - gameStore.reputation);
      // TODO: Load more game state

      haptics.success();
      audio.success();
      onClose();
    }
  };

  const handleDelete = async (saveId: string) => {
    if (confirm('Are you sure you want to delete this save?')) {
      await deleteSave(saveId);
      haptics.success();
      audio.tap();
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-metal-950 rounded-lg max-w-md w-full max-h-[80vh] flex flex-col border-2 border-metal-700">
        {/* Header */}
        <div className="p-4 border-b border-metal-800">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">{mode === 'save' ? 'Save Game' : 'Load Game'}</h2>
            <button
              onClick={onClose}
              className="touch-target text-metal-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-600 rounded text-sm text-red-300">
              {error}
            </div>
          )}

          {mode === 'save' && (
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2">Save Name</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Enter save name..."
                  className="flex-1 bg-metal-800 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-punk-600"
                  maxLength={50}
                />
                <button
                  onClick={handleSave}
                  disabled={!saveName.trim() || loading}
                  className="punk-button px-4 py-2 disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Saves List */}
          <div className="space-y-2">
            <h3 className="font-bold text-sm mb-2">
              {mode === 'save' ? 'Existing Saves' : 'Select a Save to Load'}
            </h3>
            
            {loading && !saves.length ? (
              <p className="text-center text-metal-500 py-8">Loading saves...</p>
            ) : saves.length === 0 ? (
              <p className="text-center text-metal-500 py-8">No saved games found</p>
            ) : (
              saves.map((saveGame) => (
                <div
                  key={saveGame.id}
                  onClick={() => mode === 'load' && setSelectedSave(saveGame.id)}
                  className={`
                    p-3 bg-metal-900 rounded-lg cursor-pointer transition-all
                    ${selectedSave === saveGame.id ? 'ring-2 ring-punk-600' : ''}
                    hover:bg-metal-800
                  `}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-bold">{saveGame.name}</h4>
                      <p className="text-xs text-metal-400 mt-1">
                        {formatDate(saveGame.timestamp)}
                      </p>
                      {saveGame.stats && (
                        <div className="flex gap-3 mt-2 text-xs">
                          <span className="text-metal-500">
                            Turn {saveGame.stats.turnsPlayed}
                          </span>
                          <span className="text-green-400">
                            ${saveGame.stats.totalRevenue}
                          </span>
                          <span className="text-punk-400">
                            {saveGame.stats.highestReputation} Rep
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(saveGame.id);
                      }}
                      className="ml-2 p-1 text-red-400 hover:text-red-300"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-metal-800">
          {mode === 'load' && (
            <button
              onClick={handleLoad}
              disabled={!selectedSave || loading}
              className="punk-button w-full disabled:opacity-50"
            >
              Load Selected Save
            </button>
          )}
          {mode === 'save' && (
            <div className="flex gap-2">
              <button
                onClick={() => handleSave()}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded font-bold disabled:opacity-50"
              >
                Quick Save
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-metal-800 hover:bg-metal-700 py-2 px-4 rounded font-bold"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};