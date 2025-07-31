import { describe, it, expect, beforeEach, vi } from 'vitest';
import { showExecutor } from '../ShowExecutor';
import { Band, Venue, Show, Genre, VenueType, Incident } from '@game/types';
import { synergyEngine } from '../SynergyEngine';
import { incidentSystem } from '../IncidentSystem';

// Mock dependencies
vi.mock('../SynergyEngine');
vi.mock('../IncidentSystem');
vi.mock('../FactionSystem');
vi.mock('../EquipmentManager');
vi.mock('../EquipmentManagerV2');
vi.mock('../BandRelationships');

// Import after mocking
import { factionSystem } from '../FactionSystem';
import { equipmentManager } from '../EquipmentManager';
import { equipmentManagerV2 } from '../EquipmentManagerV2';

describe('ShowExecutor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default faction system mock
    vi.mocked(factionSystem.getShowModifiers).mockReturnValue({
      fanBonus: 1,
      reputationMultiplier: 1,
      moneyModifier: 0,
      capacityBonus: 0,
      dramaChance: 0
    });

    // Setup default equipment manager mock
    vi.mocked(equipmentManager.applyEffectsToShow).mockImplementation(
      (attendance, revenue, reputation, fans) => ({
        attendance,
        revenue,
        reputation,
        fans
      })
    );
    
    // Mock other necessary methods
    vi.mocked(factionSystem.updateStandingsFromShow).mockImplementation(() => {});
    vi.mocked(equipmentManager.getIncidentModifier).mockReturnValue(1);
    vi.mocked(equipmentManager.getStressModifier).mockReturnValue(0);
    
    // Mock equipmentManagerV2 methods
    vi.mocked(equipmentManagerV2.getVenueEquipmentEffects).mockReturnValue({
      capacityBonus: 0,
      reputationMultiplier: 1,
      stressReduction: 0
    });
    vi.mocked(equipmentManagerV2.checkBandRequirements).mockReturnValue({
      met: true,
      missing: []
    });
    vi.mocked(equipmentManagerV2.degradeEquipment).mockImplementation(() => {});
  });

  const createTestBand = (overrides: Partial<Band> = {}): Band => ({
    id: 'test-band',
    name: 'Test Band',
    isRealArtist: false,
    genre: Genre.PUNK,
    subgenres: [],
    traits: [],
    popularity: 50,
    authenticity: 80,
    energy: 70,
    technicalSkill: 60,
    technicalRequirements: [],
    hometown: 'Test City',
    ...overrides
  });

  const createTestVenue = (overrides: Partial<Venue> = {}): Venue => ({
    id: 'test-venue',
    name: 'Test Venue',
    type: VenueType.DIY_SPACE,
    capacity: 100,
    acoustics: 70,
    authenticity: 90,
    atmosphere: 80,
    modifiers: [],
    traits: [],
    location: {
      id: 'test-district',
      name: 'Test District',
      sceneStrength: 75,
      gentrificationLevel: 30,
      policePresence: 20,
      rentMultiplier: 1,
      bounds: { x: 0, y: 0, width: 5, height: 5 },
      color: '#FF0000'
    },
    rent: 100,
    equipment: [],
    allowsAllAges: true,
    hasBar: false,
    hasSecurity: false,
    isPermanent: true,
    bookingDifficulty: 3,
    ...overrides
  });

  const createTestShow = (overrides: Partial<Show> = {}): Show => ({
    id: 'test-show',
    bandId: 'test-band',
    venueId: 'test-venue',
    date: new Date(),
    ticketPrice: 10,
    status: 'SCHEDULED',
    ...overrides
  });

  describe('executeShow', () => {
    it('should execute a successful show', async () => {
      const band = createTestBand({ popularity: 70 });
      const venue = createTestVenue({ capacity: 100 });
      const show = createTestShow({ ticketPrice: 15 });

      // Mock synergy calculation
      vi.mocked(synergyEngine.calculateSynergies).mockReturnValue([
        {
          id: 'test-synergy',
          name: 'Test Synergy',
          description: 'Test',
          multiplier: 1.2,
          reputationBonus: 5
        }
      ]);

      // Mock no incidents
      vi.mocked(incidentSystem.checkForIncidents).mockReturnValue([]);

      const result = await showExecutor.executeShow(
        show,
        band,
        venue,
        { reputation: 50, factionStandings: new Map() }
      );

      expect(result.success).toBe(true);
      expect(result.attendance).toBeGreaterThan(0);
      expect(result.attendance).toBeLessThanOrEqual(venue.capacity);
      expect(result.revenue).toBeGreaterThan(0);
      expect(result.reputationChange).toBeGreaterThan(0);
      expect(result.fansGained).toBeGreaterThan(0);
    });

    it('should handle venue capacity limits', async () => {
      const band = createTestBand({ popularity: 90 }); // Very popular
      const venue = createTestVenue({ capacity: 50 }); // Small venue
      const show = createTestShow();

      vi.mocked(synergyEngine.calculateSynergies).mockReturnValue([]);
      vi.mocked(incidentSystem.checkForIncidents).mockReturnValue([]);

      const result = await showExecutor.executeShow(
        show,
        band,
        venue,
        { reputation: 50, factionStandings: new Map() }
      );

      expect(result.attendance).toBeLessThanOrEqual(venue.capacity);
    });

    it('should apply synergy multipliers correctly', async () => {
      const band = createTestBand();
      const venue = createTestVenue();
      const show = createTestShow({ ticketPrice: 10 });

      // Mock strong synergies
      vi.mocked(synergyEngine.calculateSynergies).mockReturnValue([
        {
          id: 'synergy1',
          name: 'Synergy 1',
          description: 'Test',
          multiplier: 1.5,
          reputationBonus: 10
        },
        {
          id: 'synergy2', 
          name: 'Synergy 2',
          description: 'Test',
          multiplier: 1.2,
          reputationBonus: 5
        }
      ]);

      vi.mocked(incidentSystem.checkForIncidents).mockReturnValue([]);

      const result = await showExecutor.executeShow(
        show,
        band,
        venue,
        { reputation: 50, factionStandings: new Map() }
      );

      // Should have boosted attendance and reputation from synergies
      // Synergies were applied with multipliers 1.5 and 1.2
      expect(result.reputationChange).toBeGreaterThanOrEqual(15); // At least the bonus amount
    });

    it('should handle incidents during shows', async () => {
      const band = createTestBand();
      const venue = createTestVenue();
      const show = createTestShow();

      vi.mocked(synergyEngine.calculateSynergies).mockReturnValue([]);
      
      // Mock an incident
      vi.mocked(incidentSystem.checkForIncidents).mockReturnValue([
        {
          type: 'EQUIPMENT_FAILURE',
          severity: 5,
          description: 'PA system failed',
          consequences: [
            { type: 'REPUTATION_LOSS', value: 10 }
          ],
          effects: {
            attendanceChange: -20
          }
        } as Incident
      ]);

      const result = await showExecutor.executeShow(
        show,
        band,
        venue,
        { reputation: 50, factionStandings: new Map() }
      );

      expect(result.incidentOccurred).toBe(true);
      expect(result.incidents).toHaveLength(1);
      expect(result.incidents[0].type).toBe('EQUIPMENT_FAILURE');
    });

    it('should calculate revenue based on attendance and ticket price', async () => {
      const band = createTestBand({ popularity: 60 });
      const venue = createTestVenue({ capacity: 100 });
      const ticketPrice = 20;
      const show = createTestShow({ ticketPrice });

      vi.mocked(synergyEngine.calculateSynergies).mockReturnValue([]);
      vi.mocked(incidentSystem.checkForIncidents).mockReturnValue([]);

      const result = await showExecutor.executeShow(
        show,
        band,
        venue,
        { reputation: 50, factionStandings: new Map() }
      );

      const expectedRevenue = result.attendance * ticketPrice;
      expect(result.revenue).toBe(expectedRevenue);
      expect(result.financials.revenue).toBe(expectedRevenue);
      expect(result.financials.costs).toBe(venue.rent);
      expect(result.financials.profit).toBe(expectedRevenue - venue.rent);
    });

    it('should handle low attendance for unpopular bands', async () => {
      const band = createTestBand({ 
        popularity: 10,
        authenticity: 95 
      });
      const venue = createTestVenue({ capacity: 200 });
      const show = createTestShow();

      vi.mocked(synergyEngine.calculateSynergies).mockReturnValue([]);
      vi.mocked(incidentSystem.checkForIncidents).mockReturnValue([]);

      const result = await showExecutor.executeShow(
        show,
        band,
        venue,
        { reputation: 20, factionStandings: new Map() }
      );

      // Low popularity but high authenticity match should still get some attendance
      expect(result.attendance).toBeGreaterThan(0);
      expect(result.attendance).toBeLessThan(venue.capacity * 0.7); // Less than 70% capacity
      // 50% capacity is the success threshold, this show might succeed or fail depending on randomness
      expect(result.success).toBe(result.attendance >= venue.capacity * 0.5);
    });

    it('should boost attendance based on venue atmosphere', async () => {
      const band = createTestBand({ popularity: 50 });
      const venueGoodAtmosphere = createTestVenue({ 
        capacity: 100,
        atmosphere: 95 
      });
      const venueBadAtmosphere = createTestVenue({ 
        capacity: 100,
        atmosphere: 30 
      });
      const show = createTestShow();

      vi.mocked(synergyEngine.calculateSynergies).mockReturnValue([]);
      vi.mocked(incidentSystem.checkForIncidents).mockReturnValue([]);

      const resultGood = await showExecutor.executeShow(
        show,
        band,
        venueGoodAtmosphere,
        { reputation: 50, factionStandings: new Map() }
      );

      const resultBad = await showExecutor.executeShow(
        show,
        band,
        venueBadAtmosphere,
        { reputation: 50, factionStandings: new Map() }
      );

      expect(resultGood.attendance).toBeGreaterThan(resultBad.attendance);
    });
  });
});