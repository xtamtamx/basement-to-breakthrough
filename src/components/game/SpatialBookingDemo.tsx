import React from 'react';
import { SpatialBookingInterface } from './SpatialBookingInterface';
import { Band, Venue, Genre, VenueType, TraitType, GamePhase } from '@game/types';
import { useGameStore } from '@stores/gameStore';
import { haptics } from '@utils/mobile';
import { audio } from '@utils/audio';

// Demo data for testing the spatial interface
const demoBands: Band[] = [
  {
    id: 'demo-1',
    name: 'Basement Dwellers',
    isRealArtist: false,
    genre: Genre.PUNK,
    subgenres: ['hardcore punk', 'noise'],
    popularity: 15,
    authenticity: 95,
    energy: 85,
    technicalSkill: 60,
    traits: [
      { id: 't1', name: 'DIY Ethics', description: 'True to the scene', type: TraitType.PERSONALITY, modifier: { authenticity: 10 } },
      { id: 't2', name: 'Chaotic Live Shows', description: 'Unpredictable energy', type: TraitType.PERFORMANCE, modifier: { popularity: 5 } },
    ],
    technicalRequirements: [],
    hometown: 'Portland, OR',
    formedYear: 2021,
  },
  {
    id: 'demo-2',
    name: 'Death Magnetic',
    isRealArtist: true,
    artistId: 'real-1',
    genre: Genre.METAL,
    subgenres: ['doom', 'sludge'],
    popularity: 45,
    authenticity: 75,
    energy: 70,
    technicalSkill: 85,
    traits: [
      { id: 't3', name: 'Technical Masters', description: 'Incredible musicianship', type: TraitType.TECHNICAL, modifier: { popularity: 10 } },
      { id: 't4', name: 'Scene Veterans', description: '10+ years in the game', type: TraitType.SOCIAL, modifier: {} },
    ],
    technicalRequirements: [],
    bio: 'Crushing riffs and existential dread since 2013.',
    hometown: 'Seattle, WA',
    socialMedia: {
      spotify: 'https://spotify.com',
      bandcamp: 'https://bandcamp.com',
    },
  },
  {
    id: 'demo-3',
    name: 'Riot Grrrl Revival',
    isRealArtist: false,
    genre: Genre.PUNK,
    subgenres: ['riot grrrl', 'feminist punk'],
    popularity: 35,
    authenticity: 90,
    energy: 95,
    technicalSkill: 50,
    traits: [
      { id: 't5', name: 'Political Message', description: 'Strong social commentary', type: TraitType.PERSONALITY, modifier: { authenticity: 15 } },
      { id: 't6', name: 'All Ages Champion', description: 'Supports young fans', type: TraitType.SOCIAL, modifier: {} },
    ],
    technicalRequirements: [],
    hometown: 'Olympia, WA',
    formedYear: 2022,
  },
  {
    id: 'demo-4',
    name: 'Blackened Skies',
    isRealArtist: false,
    genre: Genre.METAL,
    subgenres: ['black metal', 'atmospheric'],
    popularity: 25,
    authenticity: 85,
    energy: 60,
    technicalSkill: 90,
    traits: [
      { id: 't7', name: 'Corpse Paint', description: 'Traditional black metal aesthetic', type: TraitType.PERFORMANCE, modifier: { popularity: 10 } },
      { id: 't8', name: 'Underground Legends', description: 'Never sold out', type: TraitType.SOCIAL, modifier: { authenticity: 20 } },
    ],
    technicalRequirements: [],
    hometown: 'Oslo, Norway',
    formedYear: 2019,
  },
];

const demoVenues: Venue[] = [
  {
    id: 'v1',
    name: "Jake's Basement",
    type: VenueType.BASEMENT,
    capacity: 30,
    acoustics: 45,
    authenticity: 100,
    atmosphere: 85,
    modifiers: [],
    location: { id: 'dist1', name: 'Eastside', sceneStrength: 80, gentrificationLevel: 30, policePresence: 20, rentMultiplier: 1, bounds: { x: 0, y: 0, width: 4, height: 4 }, color: '#ec4899' },
    rent: 0,
    equipment: [],
    traits: [],
    allowsAllAges: true,
    hasBar: false,
    hasSecurity: false,
    isPermanent: true,
    bookingDifficulty: 2,
  },
  {
    id: 'v2',
    name: 'The Broken Bottle',
    type: VenueType.DIVE_BAR,
    capacity: 80,
    acoustics: 60,
    authenticity: 75,
    atmosphere: 70,
    modifiers: [],
    location: { id: 'dist2', name: 'Downtown', sceneStrength: 60, gentrificationLevel: 70, policePresence: 50, rentMultiplier: 1.5, bounds: { x: 4, y: 0, width: 4, height: 4 }, color: '#3b82f6' },
    rent: 150,
    equipment: [],
    traits: [],
    allowsAllAges: false,
    hasBar: true,
    hasSecurity: true,
    isPermanent: true,
    bookingDifficulty: 4,
  },
  {
    id: 'v3',
    name: 'Warehouse 23',
    type: VenueType.WAREHOUSE,
    capacity: 150,
    acoustics: 50,
    authenticity: 90,
    atmosphere: 95,
    modifiers: [],
    location: { id: 'dist3', name: 'Industrial', sceneStrength: 70, gentrificationLevel: 20, policePresence: 60, rentMultiplier: 0.8, bounds: { x: 0, y: 4, width: 4, height: 4 }, color: '#10b981' },
    rent: 300,
    equipment: [],
    traits: [],
    allowsAllAges: true,
    hasBar: false,
    hasSecurity: false,
    isPermanent: false,
    bookingDifficulty: 6,
  },
  {
    id: 'v4',
    name: 'The Underground',
    type: VenueType.UNDERGROUND,
    capacity: 200,
    acoustics: 70,
    authenticity: 85,
    atmosphere: 80,
    modifiers: [],
    location: { id: 'dist2', name: 'Downtown', sceneStrength: 60, gentrificationLevel: 70, policePresence: 50, rentMultiplier: 1.5, bounds: { x: 4, y: 0, width: 4, height: 4 }, color: '#3b82f6' },
    rent: 400,
    equipment: [],
    traits: [],
    allowsAllAges: false,
    hasBar: true,
    hasSecurity: true,
    isPermanent: true,
    bookingDifficulty: 8,
  },
  {
    id: 'v5',
    name: 'DIY Haven',
    type: VenueType.DIY_SPACE,
    capacity: 60,
    acoustics: 55,
    authenticity: 95,
    atmosphere: 88,
    modifiers: [],
    location: { id: 'dist1', name: 'Eastside', sceneStrength: 80, gentrificationLevel: 30, policePresence: 20, rentMultiplier: 1, bounds: { x: 0, y: 0, width: 4, height: 4 }, color: '#ec4899' },
    rent: 50,
    equipment: [],
    traits: [],
    allowsAllAges: true,
    hasBar: false,
    hasSecurity: false,
    isPermanent: true,
    bookingDifficulty: 3,
  },
  {
    id: 'v6',
    name: 'The Pit',
    type: VenueType.PUNK_CLUB,
    capacity: 120,
    acoustics: 65,
    authenticity: 80,
    atmosphere: 85,
    modifiers: [],
    location: { id: 'dist3', name: 'Industrial', sceneStrength: 70, gentrificationLevel: 20, policePresence: 60, rentMultiplier: 0.8, bounds: { x: 0, y: 4, width: 4, height: 4 }, color: '#10b981' },
    rent: 250,
    equipment: [],
    traits: [],
    allowsAllAges: false,
    hasBar: true,
    hasSecurity: true,
    isPermanent: true,
    bookingDifficulty: 5,
  },
];

export const SpatialBookingDemo: React.FC = () => {
  const { addMoney, money } = useGameStore();
  
  const handleBookShow = (bands: Band[], venue: Venue) => {
    devLog.log('Booking show:', { bands, venue });
    
    // Check if can afford
    if (money >= venue.rent) {
      addMoney(-venue.rent);
      haptics.success();
      audio.play('success');
      
      // Log the booking for demo purposes
      devLog.log(`Booked ${bands.map(b => b.name).join(', ')} at ${venue.name}`);
      devLog.log(`Paid $${venue.rent} rent`);
    } else {
      haptics.error();
      audio.play('error');
      devLog.log('Not enough money!');
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black">
      <SpatialBookingInterface
        bands={demoBands}
        venues={demoVenues}
        onBookShow={handleBookShow}
        phase={GamePhase.PLANNING}
        turn={1}
      />
      
      {/* Demo Controls */}
      <div className="absolute bottom-4 right-4 glass-panel p-3 z-50">
        <h3 className="pixel-text pixel-text-sm mb-2" style={{ color: 'var(--pixel-yellow)' }}>
          DEMO CONTROLS
        </h3>
        <button
          className="pixel-button w-full mb-2"
          onClick={() => {
            addMoney(500);
            haptics.light();
          }}
        >
          Add $500
        </button>
        <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
          Current: ${money}
        </p>
      </div>
    </div>
  );
};