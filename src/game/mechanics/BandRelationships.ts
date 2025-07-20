import { Band } from '@game/types';

interface BandRelationship {
  band1Id: string;
  band2Id: string;
  relationship: number; // -100 to 100
  history: RelationshipEvent[];
}

interface RelationshipEvent {
  type: 'show_together' | 'conflict' | 'collaboration' | 'drama';
  description: string;
  impact: number;
  turn: number;
}

class BandRelationshipSystem {
  private relationships: Map<string, BandRelationship> = new Map();

  getRelationshipKey(band1Id: string, band2Id: string): string {
    return [band1Id, band2Id].sort().join('-');
  }

  getRelationship(band1Id: string, band2Id: string): number {
    const key = this.getRelationshipKey(band1Id, band2Id);
    return this.relationships.get(key)?.relationship || 0;
  }

  updateRelationship(
    band1Id: string, 
    band2Id: string, 
    change: number, 
    event: Omit<RelationshipEvent, 'turn'>,
    turn: number = 0
  ) {
    const key = this.getRelationshipKey(band1Id, band2Id);
    let relationship = this.relationships.get(key);

    if (!relationship) {
      relationship = {
        band1Id: band1Id < band2Id ? band1Id : band2Id,
        band2Id: band1Id < band2Id ? band2Id : band1Id,
        relationship: 0,
        history: []
      };
      this.relationships.set(key, relationship);
    }

    relationship.relationship = Math.max(-100, Math.min(100, relationship.relationship + change));
    relationship.history.push({
      ...event,
      turn
    });
  }

  checkLineupConflicts(bandIds: string[]): string[] {
    const conflicts: string[] = [];

    for (let i = 0; i < bandIds.length; i++) {
      for (let j = i + 1; j < bandIds.length; j++) {
        const relationship = this.getRelationship(bandIds[i], bandIds[j]);
        
        if (relationship < -50) {
          conflicts.push(`Bands won't play together due to bad blood`);
        } else if (relationship < -30) {
          conflicts.push(`Tension between bands may cause problems`);
        }
      }
    }

    return conflicts;
  }

  calculateLineupSynergy(bandIds: string[]): number {
    if (bandIds.length < 2) return 1;

    let totalSynergy = 0;
    let pairCount = 0;

    for (let i = 0; i < bandIds.length; i++) {
      for (let j = i + 1; j < bandIds.length; j++) {
        const relationship = this.getRelationship(bandIds[i], bandIds[j]);
        totalSynergy += relationship;
        pairCount++;
      }
    }

    const avgRelationship = totalSynergy / pairCount;
    
    // Convert to multiplier (0.5 to 1.5)
    return 1 + (avgRelationship / 200);
  }

  generateDramaEvent(band1: Band, band2: Band): string | null {
    const relationship = this.getRelationship(band1.id, band2.id);
    
    if (relationship < -70) {
      const events = [
        `${band1.name} refuses to share equipment with ${band2.name}`,
        `Members of ${band1.name} and ${band2.name} get into a backstage argument`,
        `${band1.name} starts their set late to spite ${band2.name}`
      ];
      return events[Math.floor(Math.random() * events.length)];
    } else if (relationship > 70) {
      const events = [
        `${band1.name} brings out ${band2.name} for an epic collaboration`,
        `${band1.name} and ${band2.name} share gear to save costs`,
        `Fans love seeing ${band1.name} and ${band2.name} support each other`
      ];
      return events[Math.floor(Math.random() * events.length)];
    }
    
    return null;
  }

  // Update relationships after shows
  updateRelationshipsFromShow(bandIds: string[], showSuccess: boolean, turn: number) {
    // All bands that play together affect each other
    for (let i = 0; i < bandIds.length; i++) {
      for (let j = i + 1; j < bandIds.length; j++) {
        const change = showSuccess ? 10 : -5;
        const eventType = showSuccess ? 'show_together' : 'conflict';
        const description = showSuccess ? 
          'Successful show together' : 
          'Show didn\'t go well, tensions rose';
        
        this.updateRelationship(
          bandIds[i], 
          bandIds[j], 
          change,
          { type: eventType, description, impact: change },
          turn
        );
      }
    }
  }

  // Get all relationships for a specific band
  getBandRelationships(bandId: string): Array<{ bandId: string; relationship: number }> {
    const results: Array<{ bandId: string; relationship: number }> = [];
    
    this.relationships.forEach((rel, key) => {
      if (rel.band1Id === bandId) {
        results.push({ bandId: rel.band2Id, relationship: rel.relationship });
      } else if (rel.band2Id === bandId) {
        results.push({ bandId: rel.band1Id, relationship: rel.relationship });
      }
    });
    
    return results;
  }

  // Generate relationship-based synergies
  generateRelationshipSynergies(band1: Band, band2: Band): Array<{
    name: string;
    description: string;
    modifier: number;
  }> {
    const relationship = this.getRelationship(band1.id, band2.id);
    const synergies: Array<{ name: string; description: string; modifier: number }> = [];
    
    if (relationship > 80) {
      synergies.push({
        name: 'Perfect Harmony',
        description: `${band1.name} and ${band2.name} are in perfect sync`,
        modifier: 1.5
      });
    } else if (relationship > 50) {
      synergies.push({
        name: 'Good Chemistry',
        description: 'Bands work well together',
        modifier: 1.2
      });
    } else if (relationship < -80) {
      synergies.push({
        name: 'Bitter Rivals',
        description: 'The tension is palpable but draws a crowd',
        modifier: 1.3 // Drama sells tickets!
      });
    } else if (relationship < -50) {
      synergies.push({
        name: 'Bad Blood',
        description: 'Bands clearly don\'t get along',
        modifier: 0.8
      });
    }
    
    return synergies;
  }

  // Clear all relationships (for new game)
  clearRelationships() {
    this.relationships.clear();
  }
}

export const bandRelationships = new BandRelationshipSystem();