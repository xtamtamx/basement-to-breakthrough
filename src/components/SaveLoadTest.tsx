import React, { useState } from 'react';
import { saveManager } from '@game/mechanics/SaveManager';
import { Band, Venue, Show, Resources, Genre, VenueType } from '@game/types';
import { haptics } from '@utils/haptics';

export const SaveLoadTest: React.FC = () => {
  const [status, setStatus] = useState<string>('Ready to test save/load');
  const [savedData, setSavedData] = useState<any>(null);
  const [loadedData, setLoadedData] = useState<any>(null);

  // Create test data
  const createTestData = () => {
    const testResources: Resources = {
      money: 1000 + Math.floor(Math.random() * 500),
      reputation: 50 + Math.floor(Math.random() * 20),
      connections: 10,
      stress: 20,
      fans: 100 + Math.floor(Math.random() * 50)
    };

    const testBand: Band = {
      id: 'test-band-1',
      name: 'The Basement Dwellers',
      isRealArtist: false,
      genre: Genre.PUNK,
      subgenres: ['hardcore'],
      traits: [],
      popularity: 30,
      authenticity: 90,
      energy: 80,
      technicalSkill: 40,
      technicalRequirements: [],
      hometown: 'Underground City'
    };

    const testVenue: Venue = {
      id: 'test-venue-1',
      name: 'DIY Basement',
      type: VenueType.BASEMENT,
      capacity: 50,
      acoustics: 40,
      authenticity: 100,
      atmosphere: 90,
      modifiers: [],
      traits: [],
      location: {
        id: 'downtown',
        name: 'Downtown',
        sceneStrength: 80,
        gentrificationLevel: 20,
        policePresence: 30,
        rentMultiplier: 1,
        bounds: { x: 0, y: 0, width: 10, height: 10 },
        color: '#FF0000'
      },
      rent: 100,
      equipment: [],
      allowsAllAges: true,
      hasBar: false,
      hasSecurity: false,
      isPermanent: true,
      bookingDifficulty: 2
    };

    const testShow: Show = {
      id: 'test-show-1',
      bandId: 'test-band-1',
      venueId: 'test-venue-1',
      date: new Date(),
      ticketPrice: 10,
      status: 'SCHEDULED'
    };

    return {
      resources: testResources,
      band: testBand,
      venue: testVenue,
      show: testShow,
      currentTurn: Math.floor(Math.random() * 20) + 1
    };
  };

  const handleSave = () => {
    haptics.medium();
    const data = createTestData();
    
    const bookedShows = new Map<string, Show>([
      ['test-venue-1', data.show]
    ]);

    const bookedBands = new Map<string, Band>([
      ['test-band-1', data.band]
    ]);

    const totalStats = {
      shows: 5,
      revenue: 2500
    };

    const success = saveManager.saveGame(
      data.currentTurn,
      data.resources,
      [data.band],
      [data.venue],
      bookedShows,
      bookedBands,
      totalStats
    );

    if (success) {
      setSavedData(data);
      setStatus(`✅ Saved! Turn ${data.currentTurn}, $${data.resources.money}`);
      haptics.success();
    } else {
      setStatus('❌ Save failed!');
      haptics.error();
    }
  };

  const handleLoad = () => {
    haptics.medium();
    const loaded = saveManager.loadGame();
    
    if (loaded) {
      setLoadedData(loaded);
      setStatus(`✅ Loaded! Turn ${loaded.gameState.currentTurn}, $${loaded.gameState.resources.money}`);
      haptics.success();
    } else {
      setStatus('❌ No save found!');
      haptics.error();
    }
  };

  const handleAutoSave = () => {
    haptics.medium();
    const data = createTestData();
    
    const bookedShows = new Map<string, Show>([
      ['test-venue-1', data.show]
    ]);

    const bookedBands = new Map<string, Band>([
      ['test-band-1', data.band]
    ]);

    const totalStats = {
      shows: 10,
      revenue: 5000
    };

    const success = saveManager.autoSave(
      data.currentTurn,
      data.resources,
      [data.band],
      [data.venue],
      bookedShows,
      bookedBands,
      totalStats
    );

    if (success) {
      setStatus(`✅ Auto-saved! Turn ${data.currentTurn}`);
      haptics.light();
    } else {
      setStatus('❌ Auto-save failed!');
      haptics.error();
    }
  };

  const handleClearSaves = () => {
    haptics.warning();
    saveManager.clearSave();
    saveManager.clearAutoSave();
    setSavedData(null);
    setLoadedData(null);
    setStatus('🗑️ All saves cleared');
  };

  const handleExport = () => {
    haptics.medium();
    const exportData = saveManager.exportSave();
    if (exportData) {
      // In a real app, this would trigger a share sheet on mobile
      navigator.clipboard.writeText(exportData);
      setStatus(`📋 Exported to clipboard (${exportData.length} chars)`);
      haptics.success();
    } else {
      setStatus('❌ No save to export!');
      haptics.error();
    }
  };

  return (
    <div className="p-4 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Save/Load Test</h1>
      
      <div className="mb-6 p-4 bg-gray-800 rounded-lg">
        <p className="text-lg font-semibold">{status}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={handleSave}
          className="bg-green-600 hover:bg-green-700 p-4 rounded-lg font-semibold"
        >
          💾 Save Game
        </button>
        
        <button
          onClick={handleLoad}
          className="bg-blue-600 hover:bg-blue-700 p-4 rounded-lg font-semibold"
        >
          📂 Load Game
        </button>
        
        <button
          onClick={handleAutoSave}
          className="bg-purple-600 hover:bg-purple-700 p-4 rounded-lg font-semibold"
        >
          ⏱️ Auto-Save
        </button>
        
        <button
          onClick={handleClearSaves}
          className="bg-red-600 hover:bg-red-700 p-4 rounded-lg font-semibold"
        >
          🗑️ Clear Saves
        </button>
        
        <button
          onClick={handleExport}
          className="bg-yellow-600 hover:bg-yellow-700 p-4 rounded-lg font-semibold col-span-2"
        >
          📤 Export Save
        </button>
      </div>

      {savedData && (
        <div className="mb-6 p-4 bg-gray-800 rounded-lg">
          <h2 className="text-lg font-bold mb-2">Last Saved:</h2>
          <pre className="text-sm">{JSON.stringify(savedData, null, 2)}</pre>
        </div>
      )}

      {loadedData && (
        <div className="p-4 bg-gray-800 rounded-lg">
          <h2 className="text-lg font-bold mb-2">Loaded Data:</h2>
          <pre className="text-sm">{JSON.stringify(loadedData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};