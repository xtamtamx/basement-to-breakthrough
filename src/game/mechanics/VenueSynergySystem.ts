import { Band, Venue, VenueTrait, ShowResult } from '@game/types';

export interface VenueSynergy {
  venueTraitId: string;
  bandTraitId?: string;
  synergyTag?: string;
  name: string;
  description: string;
  effects: {
    attendanceMultiplier?: number;
    revenueMultiplier?: number;
    reputationBonus?: number;
    fanConversionRate?: number;
    atmosphereBonus?: number;
  };
}

class VenueSynergySystem {
  private synergies: VenueSynergy[] = [
    // Atmosphere Synergies
    {
      venueTraitId: 'GRIMY_FLOORS',
      synergyTag: 'punk',
      name: 'Authentic Punk Experience',
      description: 'Punk bands thrive in grimy venues',
      effects: {
        attendanceMultiplier: 1.3,
        fanConversionRate: 1.2,
        atmosphereBonus: 20,
      },
    },
    {
      venueTraitId: 'INTIMATE_SETTING',
      synergyTag: 'emotional',
      name: 'Emotional Connection',
      description: 'Intimate venues amplify emotional performances',
      effects: {
        fanConversionRate: 1.4,
        reputationBonus: 15,
        atmosphereBonus: 25,
      },
    },
    {
      venueTraitId: 'SMOKE_MACHINE',
      synergyTag: 'metal',
      name: 'Metal Atmosphere',
      description: 'Metal bands need that smoky atmosphere',
      effects: {
        attendanceMultiplier: 1.2,
        atmosphereBonus: 30,
      },
    },
    
    // Technical Synergies
    {
      venueTraitId: 'PROFESSIONAL_PA',
      synergyTag: 'technical',
      name: 'Technical Excellence',
      description: 'Technical bands shine with professional equipment',
      effects: {
        reputationBonus: 25,
        revenueMultiplier: 1.3,
      },
    },
    {
      venueTraitId: 'BLOWN_SPEAKERS',
      synergyTag: 'noise',
      name: 'Noise Perfection',
      description: 'Noise bands actually prefer blown speakers',
      effects: {
        attendanceMultiplier: 1.4,
        atmosphereBonus: 35,
      },
    },
    {
      venueTraitId: 'RECORDING_CAPABILITY',
      synergyTag: 'professional',
      name: 'Live Album Potential',
      description: 'Professional bands can record live albums',
      effects: {
        revenueMultiplier: 1.5,
        reputationBonus: 30,
      },
    },
    
    // Social Synergies
    {
      venueTraitId: 'SCENE_HANGOUT',
      synergyTag: 'scene',
      name: 'Scene Credibility',
      description: 'Scene bands draw bigger crowds at scene venues',
      effects: {
        attendanceMultiplier: 1.4,
        fanConversionRate: 1.3,
      },
    },
    {
      venueTraitId: 'ARTIST_FRIENDLY',
      synergyTag: 'diy',
      name: 'DIY Ethics Match',
      description: 'DIY bands appreciate artist-friendly venues',
      effects: {
        reputationBonus: 20,
        fanConversionRate: 1.2,
      },
    },
    {
      venueTraitId: 'POLICE_MAGNET',
      synergyTag: 'dangerous',
      name: 'Danger Appeal',
      description: 'Some bands thrive on the danger',
      effects: {
        attendanceMultiplier: 1.5,
        atmosphereBonus: 40,
        reputationBonus: 25,
      },
    },
    
    // Legendary Synergies
    {
      venueTraitId: 'HALLOWED_GROUND',
      synergyTag: 'legendary',
      name: 'Legendary Performance',
      description: 'Legendary venues elevate any performance',
      effects: {
        attendanceMultiplier: 1.6,
        revenueMultiplier: 1.4,
        reputationBonus: 40,
        fanConversionRate: 1.5,
      },
    },
    {
      venueTraitId: 'CURSED_STAGE',
      synergyTag: 'doom',
      name: 'Doom Ritual',
      description: 'Doom bands channel the curse',
      effects: {
        atmosphereBonus: 50,
        fanConversionRate: 1.6,
        reputationBonus: 35,
      },
    },
    {
      venueTraitId: 'RIOT_HISTORY',
      synergyTag: 'hardcore',
      name: 'Riot Energy',
      description: 'Hardcore bands feed off the riot history',
      effects: {
        attendanceMultiplier: 1.7,
        atmosphereBonus: 45,
        reputationBonus: 30,
      },
    },
  ];

  public calculateVenueSynergies(venue: Venue, bands: Band[]): VenueSynergy[] {
    const activeSynergies: VenueSynergy[] = [];
    
    // Check each venue trait
    venue.traits.forEach(trait => {
      // Find synergies for this trait
      const traitSynergies = this.synergies.filter(s => s.venueTraitId === trait.id);
      
      traitSynergies.forEach(synergy => {
        // Check if any band has matching synergy tags
        const matchingBand = bands.find(band => {
          // Check band traits for synergy tags
          const bandHasTag = band.traits.some(bandTrait => 
            bandTrait.name.toLowerCase().includes(synergy.synergyTag || '') ||
            bandTrait.description.toLowerCase().includes(synergy.synergyTag || '')
          );
          
          // Check band genre/subgenres
          const genreMatch = synergy.synergyTag && (
            band.genre.toLowerCase().includes(synergy.synergyTag) ||
            band.subgenres.some(sg => sg.toLowerCase().includes(synergy.synergyTag))
          );
          
          return bandHasTag || genreMatch;
        });
        
        if (matchingBand) {
          activeSynergies.push(synergy);
        }
      });
    });
    
    return activeSynergies;
  }

  public applyVenueSynergies(
    baseResult: ShowResult,
    venue: Venue,
    bands: Band[]
  ): ShowResult {
    const synergies = this.calculateVenueSynergies(venue, bands);
    
    if (synergies.length === 0) {
      return baseResult;
    }
    
    // Apply all synergy effects
    let modifiedResult = { ...baseResult };
    let totalAttendanceMultiplier = 1;
    let totalRevenueMultiplier = 1;
    let totalReputationBonus = 0;
    let totalFanConversionRate = 1;
    let totalAtmosphereBonus = 0;
    
    synergies.forEach(synergy => {
      if (synergy.effects.attendanceMultiplier) {
        totalAttendanceMultiplier *= synergy.effects.attendanceMultiplier;
      }
      if (synergy.effects.revenueMultiplier) {
        totalRevenueMultiplier *= synergy.effects.revenueMultiplier;
      }
      if (synergy.effects.reputationBonus) {
        totalReputationBonus += synergy.effects.reputationBonus;
      }
      if (synergy.effects.fanConversionRate) {
        totalFanConversionRate *= synergy.effects.fanConversionRate;
      }
      if (synergy.effects.atmosphereBonus) {
        totalAtmosphereBonus += synergy.effects.atmosphereBonus;
      }
    });
    
    // Apply multipliers
    modifiedResult.attendance = Math.floor(baseResult.attendance * totalAttendanceMultiplier);
    modifiedResult.revenue = Math.floor(baseResult.revenue * totalRevenueMultiplier);
    modifiedResult.reputationChange += totalReputationBonus;
    modifiedResult.fansGained = Math.floor(baseResult.fansGained * totalFanConversionRate);
    
    // Add synergy info to result
    modifiedResult.venueSynergies = synergies.map(s => ({
      name: s.name,
      description: s.description,
    }));
    
    return modifiedResult;
  }

  public getVenueTraitValue(venue: Venue): number {
    // Calculate total value of venue based on traits and upgrades
    let value = 0;
    
    // Base value from stats
    value += venue.capacity * 0.5;
    value += venue.acoustics * 2;
    value += venue.authenticity * 1.5;
    value += venue.atmosphere * 1.5;
    
    // Value from traits
    venue.traits.forEach(trait => {
      if (trait.type === 'LEGENDARY') value += 500;
      else if (trait.type === 'TECHNICAL') value += 200;
      else if (trait.type === 'SOCIAL') value += 150;
      else value += 100;
    });
    
    // Value from upgrades
    if (venue.upgrades) {
      venue.upgrades.forEach(upgrade => {
        value += upgrade.cost * 0.8; // Upgrades retain 80% of their cost as value
      });
    }
    
    return Math.floor(value);
  }
}

export const venueSynergySystem = new VenueSynergySystem();