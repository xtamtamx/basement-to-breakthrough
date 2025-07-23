import { useGameStore } from '@stores/gameStore';
import { Show, ShowResult, Incident, IncidentType } from '@game/types';
import { synergySystemV2 } from './SynergySystemV2';
import { walkerSystem } from './WalkerSystem';

export class TurnProcessor {
  processNextTurn(): { showResults: ShowResult[], totalVenueRent: number } {
    const store = useGameStore.getState();
    const { scheduledShows, venues, allBands } = store;
    
    const showResults: ShowResult[] = [];
    
    // Process each scheduled show
    scheduledShows.forEach(show => {
      const result = this.executeShow(show);
      showResults.push(result);
      store.completeShow(show.id, result);
      
      // Create walkers for the show
      const venue = venues.find(v => v.id === show.venueId);
      const band = allBands.find(b => b.id === show.bandId);
      if (venue && band) {
        // Create musician walker
        if (venues[0] && venue) {
          walkerSystem.createMusicianWalker(band, venues[0], venue);
        }
        
        // Create fan walkers based on attendance
        const fanCount = Math.min(result.attendance / 10, 10); // 1 walker per 10 attendees, max 10
        for (let i = 0; i < fanCount; i++) {
          const randomX = Math.floor(Math.random() * 8);
          const randomY = Math.floor(Math.random() * 8);
          walkerSystem.createFanWalker(randomX, randomY, venue);
        }
      }
    });
    
    // Calculate total venue rent
    const totalVenueRent = venues.reduce((sum, venue) => sum + venue.rent, 0);
    
    // Apply venue rent costs
    venues.forEach(venue => {
      store.addMoney(-venue.rent);
    });
    
    // Store the results
    useGameStore.setState({ lastTurnResults: showResults });
    
    // Update round counter
    store.nextRound();
    
    return { showResults, totalVenueRent };
  }
  
  private executeShow(show: Show): ShowResult {
    const store = useGameStore.getState();
    const venue = store.venues.find(v => v.id === show.venueId);
    const mainBand = store.allBands.find(b => b.id === show.bandId);
    
    if (!venue || !mainBand) {
      return this.createFailedShowResult(show.id);
    }
    
    // Get all bands in the show
    const allShowBands = [mainBand];
    if (show.bill) {
      show.bill.openers.forEach(bandId => {
        const band = store.allBands.find(b => b.id === bandId);
        if (band) allShowBands.push(band);
      });
    }
    
    // Check synergies
    const synergies = synergySystemV2.checkSynergies(allShowBands, venue, {
      district: venue.location.id
    });
    
    // Calculate base attendance
    const avgPopularity = allShowBands.reduce((acc, b) => acc + b.popularity, 0) / allShowBands.length;
    const venueBonus = venue.atmosphere / 100;
    const baseAttendance = Math.floor(venue.capacity * (avgPopularity / 100) * venueBonus);
    
    // Apply synergy multipliers
    const synergyMultiplier = synergySystemV2.calculateTotalMultiplier(synergies);
    const finalAttendance = Math.min(Math.floor(baseAttendance * synergyMultiplier), venue.capacity);
    
    // Calculate revenue
    const ticketRevenue = finalAttendance * show.ticketPrice;
    const barRevenue = venue.hasBar ? finalAttendance * 5 : 0;
    const totalRevenue = ticketRevenue + barRevenue;
    
    // Apply revenue multipliers from synergies
    const revenueMultiplier = synergies.reduce((total, synergy) => {
      const revenueEffect = synergy.effects.find(e => e.type === 'multiply_revenue');
      return total * (revenueEffect ? revenueEffect.value as number : 1);
    }, 1);
    
    const finalRevenue = Math.floor(totalRevenue * revenueMultiplier);
    
    // Calculate costs
    const bandCosts = allShowBands.length * 50;
    const venueCost = venue.rent;
    const totalCosts = bandCosts + venueCost;
    
    // Calculate reputation and fan gains
    let reputationGain = Math.floor(finalAttendance / 10);
    let fanGain = Math.floor(finalAttendance / 5);
    
    // Apply synergy effects
    synergies.forEach(synergy => {
      synergy.effects.forEach(effect => {
        if (effect.type === 'multiply_fans') {
          fanGain = Math.floor(fanGain * (effect.value as number));
        }
        if (effect.type === 'multiply_authenticity') {
          reputationGain = Math.floor(reputationGain * (effect.value as number));
        }
      });
    });
    
    // Check for incidents
    const incidents: Incident[] = [];
    if (Math.random() < 0.1) { // 10% chance of incident
      incidents.push({
        type: IncidentType.NOISE_COMPLAINT,
        severity: 3,
        description: 'Neighbors complained about the noise',
        consequences: [
          { type: 'REPUTATION_LOSS', value: 5 }
        ]
      });
      reputationGain -= 5;
    }
    
    return {
      showId: show.id,
      success: true,
      attendance: finalAttendance,
      revenue: finalRevenue,
      reputationChange: reputationGain,
      fansGained: fanGain,
      incidentOccurred: incidents.length > 0,
      financials: {
        revenue: finalRevenue,
        costs: totalCosts,
        profit: finalRevenue - totalCosts
      },
      incidents,
      isSuccess: finalRevenue > totalCosts
    };
  }
  
  private createFailedShowResult(showId: string): ShowResult {
    return {
      showId,
      success: false,
      attendance: 0,
      revenue: 0,
      reputationChange: -10,
      fansGained: 0,
      incidentOccurred: true,
      financials: {
        revenue: 0,
        costs: 0,
        profit: 0
      },
      incidents: [{
        type: IncidentType.BAND_NO_SHOW,
        severity: 8,
        description: 'Show could not be executed',
        consequences: [{ type: 'REPUTATION_LOSS', value: 10 }]
      }],
      isSuccess: false
    };
  }
}

export const turnProcessor = new TurnProcessor();