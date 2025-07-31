import { saveManager } from './src/game/mechanics/SaveManager';
import { Band, Venue, Show, Resources, Genre, VenueType } from './src/game/types';

console.log('🎮 Testing Save/Load Functionality for Mobile Game\n');

// Create test data
const testResources: Resources = {
  money: 1000,
  reputation: 50,
  connections: 10,
  stress: 20,
  fans: 100
};

const testBand: Band = {
  id: 'test-band-1',
  name: 'The Basement Dwellers',
  isRealArtist: false,
  genre: Genre.PUNK,
  subgenres: ['hardcore', 'crust'],
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
  status: 'SCHEDULED',
  ticketsSold: 0,
  revenue: 0,
  reputationGain: 0,
  fansGained: 0,
  stress: 0
};

const bookedShows = new Map<string, Show>([
  ['test-venue-1', testShow]
]);

const bookedBands = new Map<string, Band>([
  ['test-band-1', testBand]
]);

const totalStats = {
  shows: 5,
  revenue: 2500
};

// Test 1: Basic Save
console.log('Test 1: Basic Save');
const saveResult = saveManager.saveGame(
  10, // current turn
  testResources,
  [testBand],
  [testVenue],
  bookedShows,
  bookedBands,
  totalStats
);
console.log(`Save successful: ${saveResult ? '✅' : '❌'}`);

// Test 2: Load saved game
console.log('\nTest 2: Load saved game');
const loadedGame = saveManager.loadGame();
if (loadedGame) {
  console.log('✅ Game loaded successfully');
  console.log(`  Version: ${loadedGame.version}`);
  console.log(`  Turn: ${loadedGame.gameState.currentTurn}`);
  console.log(`  Money: $${loadedGame.gameState.resources.money}`);
  console.log(`  Bands: ${loadedGame.gameState.availableBands.length}`);
  console.log(`  Venues: ${loadedGame.gameState.venues.length}`);
  console.log(`  Booked Shows: ${loadedGame.gameState.bookedShows.length}`);
} else {
  console.log('❌ Failed to load game');
}

// Test 3: Auto-save
console.log('\nTest 3: Auto-save');
const autoSaveResult = saveManager.autoSave(
  11, // next turn
  { ...testResources, money: 1100 }, // slightly different
  [testBand],
  [testVenue],
  bookedShows,
  bookedBands,
  totalStats
);
console.log(`Auto-save successful: ${autoSaveResult ? '✅' : '❌'}`);

// Test 4: Load auto-save
console.log('\nTest 4: Load auto-save');
const autoSavedGame = saveManager.loadAutoSave();
if (autoSavedGame) {
  console.log('✅ Auto-save loaded successfully');
  console.log(`  Turn: ${autoSavedGame.gameState.currentTurn}`);
  console.log(`  Money: $${autoSavedGame.gameState.resources.money}`);
} else {
  console.log('❌ Failed to load auto-save');
}

// Test 5: Check save slots
console.log('\nTest 5: Check save slots');
const hasSave = saveManager.hasSaveGame();
const hasAutoSave = saveManager.hasAutoSave();
console.log(`Has manual save: ${hasSave ? '✅' : '❌'}`);
console.log(`Has auto-save: ${hasAutoSave ? '✅' : '❌'}`);

// Test 6: Export/Import for mobile
console.log('\nTest 6: Export/Import functionality');
const exportData = saveManager.exportSave();
if (exportData) {
  console.log('✅ Export successful');
  console.log(`  Data length: ${exportData.length} characters`);
  
  // Test import
  const importSuccess = saveManager.importSave(exportData);
  console.log(`Import successful: ${importSuccess ? '✅' : '❌'}`);
} else {
  console.log('❌ Export failed');
}

// Test 7: Clear saves (cleanup)
console.log('\nTest 7: Clear saves');
saveManager.clearSave();
saveManager.clearAutoSave();
const hasSaveAfterClear = saveManager.hasSaveGame();
const hasAutoSaveAfterClear = saveManager.hasAutoSave();
console.log(`Manual save cleared: ${!hasSaveAfterClear ? '✅' : '❌'}`);
console.log(`Auto-save cleared: ${!hasAutoSaveAfterClear ? '✅' : '❌'}`);

console.log('\n✨ Save/Load testing complete!');