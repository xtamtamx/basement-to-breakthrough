/**
 * venueEquipmentEffects — the ONE place that sums a venue's installed/rented gear
 * into show effects, shared by the resolver (TurnResolutionEngine.executeShow)
 * AND the booking/promotion attendance projection (attendanceProjection).
 *
 * Before this existed, executeShow folded owned-gear capacity + acoustics/
 * atmosphere bonuses into the crowd but the preview helper ignored equipment
 * entirely, so a kitted-out room drew a bigger crowd than the booking screen
 * promised (preview < resolution). One summation, two callers, no divergence.
 *
 * Each piece scales with condition (gear under 20% is broken → contributes
 * nothing); owned OR rented-for-this-show gear both count.
 */
import { Venue } from '@game/types';

export interface EquipmentEffects {
  /** Multiply venue.capacity by this (starts at 1, capped 1.4). */
  capacityMult: number;
  /** Flat points added to venue.atmosphere before the /100 quality term. */
  qualityBonus: number;
  /** Show reputation multiplier (starts at 1, capped 1.4). */
  reputationMult: number;
  /** Flat stress points shaved off the show. */
  stressReduction: number;
  /** Flat percentage points off the incident chance. */
  incidentReduction: number;
}

export function computeEquipmentEffects(venue: Venue): EquipmentEffects {
  let capacityMult = 1;
  let qualityBonus = 0;
  let reputationMult = 1;
  let stressReduction = 0;
  let incidentReduction = 0;

  (venue.equipment ?? []).forEach((equipment) => {
    if ((equipment.owned || equipment.rentedForShow) && equipment.condition > 20) {
      const m = equipment.condition / 100;
      const fx = equipment.effects;
      if (fx.capacityBonus) capacityMult += (fx.capacityBonus / 100) * m;
      if (fx.reputationMultiplier) reputationMult *= 1 + (fx.reputationMultiplier - 1) * m;
      if (fx.acousticsBonus) qualityBonus += fx.acousticsBonus * m;
      if (fx.atmosphereBonus) qualityBonus += fx.atmosphereBonus * m;
      if (fx.stressReduction) stressReduction += fx.stressReduction * m;
      if (fx.incidentReduction) incidentReduction += fx.incidentReduction * m;
    }
  });

  // Capacity + reputation gear stack across pieces (PA + lasers + riser…), so
  // cap both at 1.4x rather than letting a fully-kitted room balloon.
  capacityMult = Math.min(1.4, capacityMult);
  reputationMult = Math.min(1.4, reputationMult);
  return { capacityMult, qualityBonus, reputationMult, stressReduction, incidentReduction };
}
