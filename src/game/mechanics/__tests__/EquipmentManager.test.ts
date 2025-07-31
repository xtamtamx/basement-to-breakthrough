import { describe, it, expect, beforeEach } from 'vitest';
import { equipmentManagerV2 } from '../EquipmentManagerV2';
import { Band, Venue, VenueType, EquipmentType } from '@game/types';

describe('EquipmentManagerV2', () => {
  beforeEach(() => {
    // Clear all equipment before each test
    equipmentManagerV2.clearAll();
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

  const createTestBand = (overrides: Partial<Band> = {}): Band => ({
    id: 'test-band',
    name: 'Test Band',
    genre: 'PUNK',
    professionalism: 70,
    technicalSkill: 75,
    authenticity: 90,
    energy: 85,
    humor: 60,
    originality: 75,
    crowdConnection: 80,
    modifiers: [],
    traits: [],
    fanbase: 100,
    reputation: 50,
    stress: 20,
    ...overrides
  });

  describe('getAvailableEquipment', () => {
    it('should return all equipment when nothing is owned', () => {
      const available = equipmentManagerV2.getAvailableEquipment();
      expect(available.length).toBeGreaterThan(0);
      expect(available.every(eq => !eq.owned)).toBe(true);
    });

    it('should exclude owned equipment from available list', () => {
      const available = equipmentManagerV2.getAvailableEquipment();
      const firstEquip = available[0];
      
      equipmentManagerV2.purchaseEquipment(firstEquip.id);
      
      const newAvailable = equipmentManagerV2.getAvailableEquipment();
      expect(newAvailable.length).toBe(available.length - 1);
      expect(newAvailable.find(eq => eq.id === firstEquip.id)).toBeUndefined();
    });
  });

  describe('purchaseEquipment', () => {
    it('should successfully purchase equipment', () => {
      const available = equipmentManagerV2.getAvailableEquipment();
      const equipment = available[0];
      
      const result = equipmentManagerV2.purchaseEquipment(equipment.id);
      
      expect(result.success).toBe(true);
      expect(result.cost).toBe(equipment.purchasePrice);
      
      const owned = equipmentManagerV2.getOwnedEquipment();
      expect(owned).toHaveLength(1);
      expect(owned[0].id).toBe(equipment.id);
    });

    it('should prevent purchasing already owned equipment', () => {
      const available = equipmentManagerV2.getAvailableEquipment();
      const equipment = available[0];
      
      equipmentManagerV2.purchaseEquipment(equipment.id);
      const result = equipmentManagerV2.purchaseEquipment(equipment.id);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Already owned');
    });
  });

  describe('rentEquipment', () => {
    it('should successfully rent equipment', () => {
      const available = equipmentManagerV2.getAvailableEquipment();
      const equipment = available[0];
      
      const result = equipmentManagerV2.rentEquipment(equipment.id);
      
      expect(result.success).toBe(true);
      expect(result.cost).toBe(equipment.rentalPrice);
      
      const rented = equipmentManagerV2.getRentedEquipment();
      expect(rented).toHaveLength(1);
      expect(rented[0].id).toBe(equipment.id);
    });

    it('should prevent renting same type of equipment', () => {
      const available = equipmentManagerV2.getAvailableEquipment();
      const paSystem1 = available.find(eq => eq.type === EquipmentType.PA_SYSTEM)!;
      const paSystem2 = available.find(eq => eq.type === EquipmentType.PA_SYSTEM && eq.id !== paSystem1.id);
      
      equipmentManagerV2.rentEquipment(paSystem1.id);
      
      if (paSystem2) {
        const result = equipmentManagerV2.rentEquipment(paSystem2.id);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Already renting equipment of this type');
      }
    });
  });

  describe('installAtVenue', () => {
    it('should install owned equipment at venue', () => {
      const venue = createTestVenue();
      const available = equipmentManagerV2.getAvailableEquipment();
      const equipment = available[0];
      
      equipmentManagerV2.purchaseEquipment(equipment.id);
      const result = equipmentManagerV2.installAtVenue(equipment.id, venue.id, venue);
      
      expect(result.success).toBe(true);
      
      const venueEquipment = equipmentManagerV2.getVenueEquipment(venue.id);
      expect(venueEquipment).toHaveLength(1);
      expect(venueEquipment[0].id).toBe(equipment.id);
    });

    it('should prevent installing non-owned equipment', () => {
      const venue = createTestVenue();
      const available = equipmentManagerV2.getAvailableEquipment();
      const equipment = available[0];
      
      const result = equipmentManagerV2.installAtVenue(equipment.id, venue.id, venue);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Equipment not owned');
    });

    it('should check venue requirements', () => {
      const smallVenue = createTestVenue({ capacity: 50 });
      const largeEquipment = equipmentManagerV2.getCatalogEquipment('pa-line-array');
      
      if (largeEquipment) {
        equipmentManagerV2.purchaseEquipment(largeEquipment.id);
        const result = equipmentManagerV2.installAtVenue(largeEquipment.id, smallVenue.id, smallVenue);
        
        expect(result.success).toBe(false);
        expect(result.error).toContain('Venue too small');
      }
    });
  });

  describe('getVenueEquipmentEffects', () => {
    it('should calculate combined effects from installed equipment', () => {
      const venue = createTestVenue();
      const paSystem = equipmentManagerV2.getCatalogEquipment('pa-basic');
      const lights = equipmentManagerV2.getCatalogEquipment('lights-basic');
      
      if (paSystem && lights) {
        equipmentManagerV2.purchaseEquipment(paSystem.id);
        equipmentManagerV2.purchaseEquipment(lights.id);
        equipmentManagerV2.installAtVenue(paSystem.id, venue.id, venue);
        equipmentManagerV2.installAtVenue(lights.id, venue.id, venue);
        
        const effects = equipmentManagerV2.getVenueEquipmentEffects(venue.id);
        
        expect(effects.capacityBonus).toBeGreaterThan(0);
        expect(effects.acousticsBonus).toBeGreaterThan(0);
        expect(effects.atmosphereBonus).toBeGreaterThan(0);
      }
    });

    it('should include rented equipment in effects', () => {
      const venue = createTestVenue();
      const paSystem = equipmentManagerV2.getCatalogEquipment('pa-basic');
      
      if (paSystem) {
        equipmentManagerV2.rentEquipment(paSystem.id);
        const effects = equipmentManagerV2.getVenueEquipmentEffects(venue.id);
        
        expect(effects.capacityBonus).toBeGreaterThan(0);
        expect(effects.acousticsBonus).toBeGreaterThan(0);
      }
    });

    it('should apply condition degradation to effects', () => {
      const venue = createTestVenue();
      const paSystem = equipmentManagerV2.getCatalogEquipment('pa-basic');
      
      if (paSystem) {
        equipmentManagerV2.purchaseEquipment(paSystem.id);
        equipmentManagerV2.installAtVenue(paSystem.id, venue.id, venue);
        
        const effectsNew = equipmentManagerV2.getVenueEquipmentEffects(venue.id);
        
        // Degrade equipment
        equipmentManagerV2.degradeEquipment(25); // 50% degradation
        
        const effectsDegraded = equipmentManagerV2.getVenueEquipmentEffects(venue.id);
        
        expect(effectsDegraded.capacityBonus!).toBeLessThan(effectsNew.capacityBonus!);
        expect(effectsDegraded.acousticsBonus!).toBeLessThan(effectsNew.acousticsBonus!);
      }
    });
  });

  describe('checkBandRequirements', () => {
    it('should identify missing equipment for technical bands', () => {
      const band = createTestBand({ technicalSkill: 90 });
      const venue = createTestVenue();
      
      const result = equipmentManagerV2.checkBandRequirements(band, venue);
      
      expect(result.met).toBe(false);
      expect(result.missing).toContain(EquipmentType.PA_SYSTEM);
      expect(result.missing).toContain(EquipmentType.LIGHTING);
      expect(result.missing).toContain(EquipmentType.BACKLINE);
    });

    it('should recognize met requirements with installed equipment', () => {
      const band = createTestBand({ technicalSkill: 65 });
      const venue = createTestVenue();
      const paSystem = equipmentManagerV2.getCatalogEquipment('pa-basic');
      
      if (paSystem) {
        equipmentManagerV2.purchaseEquipment(paSystem.id);
        equipmentManagerV2.installAtVenue(paSystem.id, venue.id, venue);
        
        const result = equipmentManagerV2.checkBandRequirements(band, venue);
        
        expect(result.met).toBe(true);
        expect(result.missing).toHaveLength(0);
      }
    });

    it('should check genre-specific requirements', () => {
      const metalBand = createTestBand({ genre: 'METAL', technicalSkill: 50 });
      const venue = createTestVenue();
      
      const result = equipmentManagerV2.checkBandRequirements(metalBand, venue);
      
      expect(result.met).toBe(false);
      expect(result.missing).toContain(EquipmentType.PA_SYSTEM);
      expect(result.missing).toContain(EquipmentType.BACKLINE);
    });
  });

  describe('degradeEquipment', () => {
    it('should degrade all installed equipment', () => {
      const venue = createTestVenue();
      const paSystem = equipmentManagerV2.getCatalogEquipment('pa-basic');
      
      if (paSystem) {
        equipmentManagerV2.purchaseEquipment(paSystem.id);
        equipmentManagerV2.installAtVenue(paSystem.id, venue.id, venue);
        
        const beforeCondition = equipmentManagerV2.getOwnedEquipment()[0].condition;
        equipmentManagerV2.degradeEquipment(5);
        const afterCondition = equipmentManagerV2.getOwnedEquipment()[0].condition;
        
        expect(afterCondition).toBeLessThan(beforeCondition);
        expect(afterCondition).toBe(beforeCondition - 10); // 2% per show * 5 shows
      }
    });

    it('should clear rented equipment after degradation', () => {
      const paSystem = equipmentManagerV2.getCatalogEquipment('pa-basic');
      
      if (paSystem) {
        equipmentManagerV2.rentEquipment(paSystem.id);
        expect(equipmentManagerV2.getRentedEquipment()).toHaveLength(1);
        
        equipmentManagerV2.degradeEquipment();
        
        expect(equipmentManagerV2.getRentedEquipment()).toHaveLength(0);
      }
    });
  });

  describe('repairEquipment', () => {
    it('should restore equipment to full condition', () => {
      const venue = createTestVenue();
      const paSystem = equipmentManagerV2.getCatalogEquipment('pa-basic');
      
      if (paSystem) {
        equipmentManagerV2.purchaseEquipment(paSystem.id);
        equipmentManagerV2.installAtVenue(paSystem.id, venue.id, venue);
        
        // Degrade equipment
        equipmentManagerV2.degradeEquipment(25);
        
        const owned = equipmentManagerV2.getOwnedEquipment()[0];
        expect(owned.condition).toBeLessThan(100);
        
        const result = equipmentManagerV2.repairEquipment(owned.id);
        
        expect(result.success).toBe(true);
        expect(result.cost).toBeGreaterThan(0);
        expect(equipmentManagerV2.getOwnedEquipment()[0].condition).toBe(100);
      }
    });

    it('should calculate repair cost based on damage', () => {
      const venue = createTestVenue();
      const paSystem = equipmentManagerV2.getCatalogEquipment('pa-basic');
      
      if (paSystem) {
        equipmentManagerV2.purchaseEquipment(paSystem.id);
        equipmentManagerV2.installAtVenue(paSystem.id, venue.id, venue);
        
        equipmentManagerV2.degradeEquipment(10); // 20% damage
        const result1 = equipmentManagerV2.repairEquipment(paSystem.id);
        
        equipmentManagerV2.degradeEquipment(25); // 50% damage
        const result2 = equipmentManagerV2.repairEquipment(paSystem.id);
        
        expect(result2.cost).toBeGreaterThan(result1.cost);
      }
    });
  });

  describe('getMaintenanceCosts', () => {
    it('should calculate total maintenance for owned equipment', () => {
      const paSystem = equipmentManagerV2.getCatalogEquipment('pa-basic');
      const lights = equipmentManagerV2.getCatalogEquipment('lights-basic');
      
      if (paSystem && lights) {
        equipmentManagerV2.purchaseEquipment(paSystem.id);
        equipmentManagerV2.purchaseEquipment(lights.id);
        
        const costs = equipmentManagerV2.getMaintenanceCosts();
        
        expect(costs).toBe(paSystem.maintenanceCost + lights.maintenanceCost);
      }
    });

    it('should increase maintenance for damaged equipment', () => {
      const venue = createTestVenue();
      const paSystem = equipmentManagerV2.getCatalogEquipment('pa-basic');
      
      if (paSystem) {
        equipmentManagerV2.purchaseEquipment(paSystem.id);
        equipmentManagerV2.installAtVenue(paSystem.id, venue.id, venue);
        
        const costsNew = equipmentManagerV2.getMaintenanceCosts();
        
        // Degrade below 50% condition (2% per show * 30 shows = 60% degradation, leaving 40% condition)
        equipmentManagerV2.degradeEquipment(30);
        
        const costsDamaged = equipmentManagerV2.getMaintenanceCosts();
        
        expect(costsDamaged).toBeGreaterThan(costsNew);
        expect(costsDamaged).toBe(paSystem.maintenanceCost * 1.5);
      }
    });
  });
});