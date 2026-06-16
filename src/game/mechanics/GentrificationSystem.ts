/**
 * GentrificationSystem - districts change as your scene succeeds.
 *
 * The core tension: a thriving scene makes a neighborhood desirable, which
 * draws developers, which raises rents and drains the scene's soul. You
 * gentrify the very places you make cool. Each turn districts drift upward
 * (faster where shows happened), and that level has real bite:
 *   - rent creep: a venue's rent scales with its district's gentrification
 *   - thinning crowds: gentrified areas lose authentic turnout
 *   - soul decay: past a threshold, scene strength erodes
 */

import { useGameStore } from '@stores/gameStore';
import { difficultySystem } from './DifficultySystem';

// Tuning (all per-turn unless noted)
const BASE_CREEP = 0.4; // every district drifts up slowly
const ACTIVITY_CREEP = 2.5; // a show in a district accelerates it
const SOUL_THRESHOLD = 60; // above this, scene strength decays
const SCENE_DECAY = 1.5; // scene strength lost per turn above the threshold
const SCENE_GROWTH = 2.2; // scene strength a DIY show builds in its district
const REFERENCE_RATE = 0.05; // difficulty rate that maps to "normal" creep
const MAX_RENT_CREEP = 0.6; // up to +60% rent at full gentrification
const MAX_ATTENDANCE_PENALTY = 0.25; // up to -25% turnout at full gentrification
const ATTENDANCE_FREE_BELOW = 40; // no turnout penalty below this level

export interface GentrificationUpdate {
  notices: string[]; // threshold-crossing flavor for the turn summary
}

class GentrificationSystem {
  private getDistrict(districtId: string) {
    return useGameStore.getState().districts.find((d) => d.id === districtId);
  }

  /** Rent multiplier for a venue's district (looked up live, not the snapshot). */
  getRentMultiplier(districtId: string): number {
    const district = this.getDistrict(districtId);
    if (!district) return 1;
    return 1 + (district.gentrificationLevel / 100) * MAX_RENT_CREEP;
  }

  /** Turnout multiplier — gentrified neighborhoods lose authentic crowds. */
  getAttendanceMultiplier(districtId: string): number {
    const district = this.getDistrict(districtId);
    if (!district) return 1;
    const over =
      Math.max(0, district.gentrificationLevel - ATTENDANCE_FREE_BELOW) /
      (100 - ATTENDANCE_FREE_BELOW);
    return 1 - over * MAX_ATTENDANCE_PENALTY;
  }

  /**
   * Advance gentrification one turn. Districts that hosted shows gentrify
   * fastest; desirable (high scene-strength) districts attract developers
   * faster too. Persists changes to the store and returns threshold notices.
   */
  applyTurnGentrification(activeDistrictIds: Set<string>, diyPoints = 0): GentrificationUpdate {
    const store = useGameStore.getState();
    const rate = difficultySystem.getCurrentDifficulty().gentrificationRate;
    const rateScale = rate / REFERENCE_RATE;
    const notices: string[] = [];

    store.districts.forEach((district) => {
      const active = activeDistrictIds.has(district.id);
      const desirability = district.sceneStrength / 100;
      const activityBonus = active ? ACTIVITY_CREEP : 0;
      const rise =
        (BASE_CREEP + activityBonus) * (1 + desirability) * rateScale;

      const newGent = Math.min(100, district.gentrificationLevel + rise);

      // A DIY show *builds* the local scene (stronger the more genuine you are);
      // selling out doesn't grow it. Past the soul threshold, gentrification
      // erodes it regardless — you can out-gentrify your own scene.
      let nextSceneRaw = district.sceneStrength;
      if (active && diyPoints >= 0) {
        nextSceneRaw += SCENE_GROWTH * (0.5 + Math.min(100, diyPoints) / 200);
      }
      if (newGent >= SOUL_THRESHOLD) nextSceneRaw -= SCENE_DECAY;
      const newScene = Math.max(0, Math.min(100, nextSceneRaw));

      // Keep one decimal of precision — the base creep is < 1/turn, so
      // rounding to whole numbers would floor it away and gentrification
      // would never move without a show in the district.
      const nextGent = Math.round(newGent * 10) / 10;
      const nextScene = Math.round(newScene * 10) / 10;

      if (
        nextGent !== district.gentrificationLevel ||
        nextScene !== district.sceneStrength
      ) {
        store.updateDistrictGentrification(district.id, {
          gentrificationLevel: nextGent,
          sceneStrength: nextScene,
        });
      }

      // Notices only on the turn a threshold is first crossed. These align to
      // the *mechanical* inflection points, not round numbers:
      //   - ATTENDANCE_FREE_BELOW (40): the first real bite — turnout starts
      //     to thin as the crowd changes.
      //   - SOUL_THRESHOLD (60): scene strength begins to erode.
      const crossed = (t: number) =>
        district.gentrificationLevel < t && newGent >= t;
      if (crossed(ATTENDANCE_FREE_BELOW)) {
        notices.push(
          `${district.name} is starting to draw a different crowd — turnout's getting thinner.`,
        );
      }
      if (crossed(SOUL_THRESHOLD)) {
        notices.push(
          `The soul is leaving ${district.name} — its scene strength is eroding.`,
        );
      }
    });

    return { notices };
  }
}

export const gentrificationSystem = new GentrificationSystem();
