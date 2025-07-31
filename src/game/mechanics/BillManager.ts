import { Band, Bill, BillDynamics } from '@game/types';

export class BillManager {
  // Analyze a bill and determine headliner based on band stats
  analyzeBill(bands: Band[]): Bill {
    if (bands.length === 0) {
      throw new Error('Cannot create bill with no bands');
    }
    
    if (bands.length === 1) {
      // Single band show
      return {
        headliner: bands[0].id,
        openers: [],
        dynamics: {
          chemistryScore: 100,
          dramaRisk: 0,
          crowdAppeal: bands[0].popularity,
          sceneAlignment: bands[0].authenticity,
        }
      };
    }
    
    // Sort bands by headliner potential
    const sortedBands = [...bands].sort((a, b) => {
      const aScore = this.calculateHeadlinerScore(a);
      const bScore = this.calculateHeadlinerScore(b);
      return bScore - aScore;
    });
    
    const headliner = sortedBands[0];
    const openers = sortedBands.slice(1).map(b => b.id);
    
    // Calculate bill dynamics
    const dynamics = this.calculateBillDynamics(bands, headliner.id);
    
    return {
      headliner: headliner.id,
      openers,
      dynamics
    };
  }
  
  private calculateHeadlinerScore(band: Band): number {
    // Factors that make a good headliner
    let score = 0;
    
    // Popularity is most important
    score += band.popularity * 2;
    
    // Energy and stage presence
    score += band.energy * 0.5;
    
    // Technical skill for longer sets
    score += band.technicalSkill * 0.3;
    
    // Established bands make better headliners
    const age = new Date().getFullYear() - (band.formedYear || 2023);
    score += Math.min(age * 5, 50); // Max 50 points for 10+ years
    
    // Scene veterans get bonus
    if (band.traits.some(t => t.name.includes('Veteran') || t.name.includes('Legend'))) {
      score += 30;
    }
    
    return score;
  }
  
  private calculateBillDynamics(bands: Band[], headlinerId: string): BillDynamics {
    const headliner = bands.find(b => b.id === headlinerId)!;
    const openers = bands.filter(b => b.id !== headlinerId);
    
    // Chemistry Score
    let chemistryScore = 100;
    
    // Genre compatibility
    const genres = bands.map(b => b.genre);
    const uniqueGenres = new Set(genres);
    if (uniqueGenres.size === 1) {
      // Same genre - perfect compatibility
      chemistryScore = 100;
    } else if (uniqueGenres.size === bands.length) {
      // All different genres - poor compatibility
      chemistryScore = 40;
    } else {
      // Some overlap
      chemistryScore = 70;
    }
    
    // Subgenre compatibility bonus
    const allSubgenres = bands.flatMap(b => b.subgenres);
    const commonSubgenres = allSubgenres.filter((sg, i) => 
      allSubgenres.indexOf(sg) !== i
    );
    chemistryScore += Math.min(commonSubgenres.length * 5, 20);
    
    // Drama Risk
    let dramaRisk = 0;
    
    // Ego clashes - multiple high-popularity bands
    const highPopBands = bands.filter(b => b.popularity > 70);
    if (highPopBands.length > 1) {
      dramaRisk += highPopBands.length * 15;
    }
    
    // Opener overshadowing headliner
    openers.forEach(opener => {
      const openerBand = bands.find(b => b.id === opener);
      if (!openerBand) return; // Skip if band not found
      
      if (openerBand.popularity > headliner.popularity - 10) {
        dramaRisk += 20; // Opener too popular
      }
      if (openerBand.energy > headliner.energy + 20) {
        dramaRisk += 15; // Opener too energetic
      }
    });
    
    // Scene politics
    const authenticityGap = Math.max(...bands.map(b => b.authenticity)) - 
                           Math.min(...bands.map(b => b.authenticity));
    if (authenticityGap > 50) {
      dramaRisk += 25; // "Sellout" vs "True" bands
    }
    
    // Straight edge vs party bands
    const straightEdge = bands.filter(b => 
      b.traits.some(t => t.name.includes('Straight Edge'))
    );
    const partyBands = bands.filter(b => 
      b.traits.some(t => t.name.includes('Party') || t.name.includes('Wild'))
    );
    if (straightEdge.length > 0 && partyBands.length > 0) {
      dramaRisk += 30;
    }
    
    // Crowd Appeal
    let crowdAppeal = 0;
    
    // Base appeal from all bands
    crowdAppeal = bands.reduce((sum, band) => sum + band.popularity, 0) / bands.length;
    
    // Bonus for good bill flow (ascending energy)
    const energyFlow = bands.map(b => b.energy);
    const isAscending = energyFlow.every((e, i) => 
      i === 0 || e >= energyFlow[i - 1] - 10
    );
    if (isAscending) {
      crowdAppeal += 20;
    }
    
    // Variety bonus
    if (uniqueGenres.size > 1 && uniqueGenres.size < bands.length) {
      crowdAppeal += 10; // Some variety but not too much
    }
    
    // Scene Alignment
    const avgAuthenticity = bands.reduce((sum, band) => sum + band.authenticity, 0) / bands.length;
    const sceneAlignment = avgAuthenticity;
    
    return {
      chemistryScore: Math.max(0, Math.min(100, chemistryScore)),
      dramaRisk: Math.max(0, Math.min(100, dramaRisk)),
      crowdAppeal: Math.max(0, Math.min(100, crowdAppeal)),
      sceneAlignment: Math.max(0, Math.min(100, sceneAlignment)),
    };
  }
  
  // Calculate attendance modifier based on bill quality
  getBillAttendanceModifier(dynamics: BillDynamics): number {
    let modifier = 1.0;
    
    // Chemistry affects turnout
    modifier *= (0.8 + (dynamics.chemistryScore / 100) * 0.4); // 0.8x to 1.2x
    
    // Crowd appeal is direct multiplier
    modifier *= (0.7 + (dynamics.crowdAppeal / 100) * 0.6); // 0.7x to 1.3x
    
    // Scene alignment affects underground crowd
    if (dynamics.sceneAlignment > 80) {
      modifier *= 1.2; // Authentic bills draw hardcore fans
    } else if (dynamics.sceneAlignment < 40) {
      modifier *= 0.8; // Sellout bills lose core audience
    }
    
    return modifier;
  }
  
  // Get reputation modifier based on bill
  getBillReputationModifier(dynamics: BillDynamics): number {
    let modifier = 1.0;
    
    // Good chemistry = good show = better reputation
    modifier *= (0.8 + (dynamics.chemistryScore / 100) * 0.4);
    
    // High scene alignment builds underground cred
    if (dynamics.sceneAlignment > 70) {
      modifier *= 1.3;
    }
    
    return modifier;
  }
  
  // Check if drama occurs
  checkForDrama(dynamics: BillDynamics): { occurred: boolean; description?: string } {
    const roll = Math.random() * 100;
    
    if (roll < dynamics.dramaRisk) {
      // Drama occurred!
      const dramaTypes = [
        'Band members got into a fistfight backstage',
        'Headliner refused to go on after opener upstaged them',
        'Bands argued over set times and sound check',
        'Ego clash led to shortened sets',
        'Political disagreements spilled onto stage',
        'Straight edge band protested other band\'s drinking',
      ];
      
      return {
        occurred: true,
        description: dramaTypes[Math.floor(Math.random() * dramaTypes.length)]
      };
    }
    
    return { occurred: false };
  }
}

export const billManager = new BillManager();