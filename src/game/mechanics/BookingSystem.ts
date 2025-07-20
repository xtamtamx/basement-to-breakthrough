import { Band, Venue, Show, GameState, Resources, Incident, IncidentType } from '@game/types';
import { synergyEngine } from './SynergyEngine';

export interface BookingResult {
  success: boolean;
  show?: Show;
  message: string;
  resourceChanges?: Partial<Resources>;
}

export interface ShowResult {
  attendance: number;
  revenue: number;
  reputationGain: number;
  fansGained: number;
  incidents: Incident[];
  synergyBonuses: string[];
}

export class BookingSystem {
  // Check if a booking is valid
  canBook(band: Band, venue: Venue, gameState: GameState): { valid: boolean; reason?: string } {
    // Check if player has enough money for venue rent
    if (gameState.resources.money < venue.rent) {
      return { valid: false, reason: `Need $${venue.rent} to book ${venue.name}` };
    }

    // Check venue requirements
    if (!venue.allowsAllAges && band.traits.some(t => t.name === 'Youth Crew')) {
      return { valid: false, reason: 'This venue doesn\'t allow all-ages shows' };
    }

    // Check technical requirements
    for (const req of band.technicalRequirements) {
      const hasEquipment = venue.equipment.some(
        eq => eq.type === req.type && eq.quality >= req.minimumQuality
      );
      if (!hasEquipment) {
        return { valid: false, reason: `Venue lacks required ${req.type}` };
      }
    }

    // Check scene politics
    const bandAuthenticity = band.authenticity;
    const venueAuthenticity = venue.authenticity;
    if (Math.abs(bandAuthenticity - venueAuthenticity) > 50) {
      return { valid: false, reason: 'Band and venue are too different culturally' };
    }

    return { valid: true };
  }

  // Book a show
  bookShow(
    band: Band, 
    venue: Venue, 
    ticketPrice: number,
    gameState: GameState
  ): BookingResult {
    const canBookResult = this.canBook(band, venue, gameState);
    if (!canBookResult.valid) {
      return { success: false, message: canBookResult.reason! };
    }

    // Calculate expected attendance
    const baseAttendance = this.calculateBaseAttendance(band, venue);
    const synergies = synergyEngine.calculateSynergies([band], venue);
    const synergyMultiplier = synergies.reduce((mult, syn) => mult * syn.multiplier, 1);
    const expectedAttendance = Math.floor(baseAttendance * synergyMultiplier);

    // Create the show
    const show: Show = {
      id: `show-${Date.now()}`,
      date: Date.now() + (24 * 60 * 60 * 1000), // Tomorrow
      venue,
      lineup: [band],
      ticketPrice,
      expectedAttendance: Math.min(expectedAttendance, venue.capacity),
    };

    // Deduct venue rent
    const resourceChanges: Partial<Resources> = {
      money: -venue.rent,
    };

    return {
      success: true,
      show,
      message: `Booked ${band.name} at ${venue.name}!`,
      resourceChanges,
    };
  }

  // Simulate show results
  simulateShow(show: Show, gameState: GameState): ShowResult {
    const band = show.lineup[0]; // For now, single band shows
    const venue = show.venue;

    // Calculate actual attendance (with some randomness)
    const attendanceRate = 0.7 + (Math.random() * 0.4); // 70-110% of expected
    const actualAttendance = Math.floor(show.expectedAttendance * attendanceRate);
    const finalAttendance = Math.min(actualAttendance, venue.capacity);

    // Calculate revenue
    const ticketRevenue = finalAttendance * show.ticketPrice;
    const barRevenue = venue.hasBar ? finalAttendance * 5 * Math.random() : 0; // $0-5 per person
    const totalRevenue = ticketRevenue + barRevenue;

    // Check for incidents
    const incidents = this.checkForIncidents(show, finalAttendance, gameState);

    // Calculate reputation and fan gains
    const synergies = synergyEngine.calculateSynergies(show.lineup, venue);
    const synergyBonus = synergies.reduce((sum, syn) => sum + syn.reputationBonus, 0);
    
    let reputationGain = Math.floor((finalAttendance / venue.capacity) * 10);
    reputationGain += synergyBonus;
    
    // Authenticity bonus
    if (band.authenticity > 80 && venue.authenticity > 80) {
      reputationGain += 5;
    }

    // Apply incident penalties
    for (const incident of incidents) {
      const repLoss = incident.consequences.find(c => c.type === 'REPUTATION_LOSS');
      if (repLoss) {
        reputationGain -= repLoss.value;
      }
    }

    const fansGained = Math.floor(finalAttendance * 0.1 * (band.popularity / 100));

    return {
      attendance: finalAttendance,
      revenue: totalRevenue,
      reputationGain: Math.max(0, reputationGain),
      fansGained,
      incidents,
      synergyBonuses: synergies.map(s => s.description),
    };
  }

  private calculateBaseAttendance(band: Band, venue: Venue): number {
    // Base attendance based on band popularity and venue location
    const popularityFactor = band.popularity / 100;
    const sceneFactor = venue.location.sceneStrength / 100;
    const capacityTarget = venue.capacity * 0.6; // Aim for 60% capacity base
    
    return Math.floor(capacityTarget * popularityFactor * sceneFactor);
  }

  private checkForIncidents(show: Show, attendance: number, gameState: GameState): Incident[] {
    const incidents: Incident[] = [];
    const venue = show.venue;
    const band = show.lineup[0];

    // Noise complaints in residential areas
    if (venue.type === 'BASEMENT' || venue.type === 'HOUSE_SHOW') {
      if (Math.random() < 0.3) {
        incidents.push({
          type: IncidentType.NOISE_COMPLAINT,
          severity: 3,
          description: 'Neighbors called in a noise complaint',
          consequences: [{ type: 'REPUTATION_LOSS', value: 2 }],
        });
      }
    }

    // Police issues in high-surveillance areas
    if (venue.location.policePresence > 70 && venue.type !== 'CONCERT_HALL') {
      if (Math.random() < 0.2) {
        incidents.push({
          type: IncidentType.COPS_CALLED,
          severity: 7,
          description: 'Police shut down the show early',
          consequences: [
            { type: 'REPUTATION_LOSS', value: 5 },
            { type: 'MONEY_LOSS', value: show.ticketPrice * attendance * 0.5 },
          ],
        });
      }
    }

    // Overcrowding can cause issues
    if (attendance >= venue.capacity * 0.95) {
      if (Math.random() < 0.25) {
        incidents.push({
          type: IncidentType.VENUE_DAMAGE,
          severity: 4,
          description: 'Overcrowding caused minor venue damage',
          consequences: [{ type: 'MONEY_LOSS', value: 200 }],
        });
      }
    }

    // High energy bands might cause fights
    if (band.energy > 80 && !venue.hasSecurity) {
      if (Math.random() < 0.15) {
        incidents.push({
          type: IncidentType.FIGHT,
          severity: 5,
          description: 'A fight broke out in the pit',
          consequences: [{ type: 'REPUTATION_LOSS', value: 3 }],
        });
      }
    }

    return incidents;
  }
}

export const bookingSystem = new BookingSystem();