import { create } from 'zustand';
import { GamePhase, Difficulty, FactionEvent } from '@game/types';
import { factionSystem } from '@game/mechanics/FactionSystem';

interface GameStore {
  // Game state
  money: number;
  reputation: number;
  fans: number;
  stress: number;
  connections: number;
  currentRound: number;
  phase: GamePhase;
  difficulty: Difficulty;
  
  // Faction state
  currentFactionEvent: FactionEvent | null;
  
  // Actions
  setPhase: (phase: GamePhase) => void;
  addMoney: (amount: number) => void;
  addFans: (amount: number) => void;
  addReputation: (amount: number) => void;
  addStress: (amount: number) => void;
  addConnections: (amount: number) => void;
  nextRound: () => void;
  resetGame: () => void;
  
  // Faction actions
  setFactionEvent: (event: FactionEvent | null) => void;
  applyFactionChoice: (eventId: string, choiceId: string) => void;
}

const initialState = {
  currentRound: 1,
  reputation: 0,
  money: 200, // Starting money - enough for 1-2 shows
  fans: 0,
  stress: 0,
  connections: 0,
  phase: GamePhase.MENU,
  difficulty: Difficulty.NORMAL,
  currentFactionEvent: null,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,
  
  setPhase: (phase) => set({ phase }),
  
  addMoney: (amount) => 
    set((state) => ({ money: Math.max(0, state.money + amount) })),
  
  addFans: (amount) => 
    set((state) => ({ fans: Math.max(0, state.fans + amount) })),
  
  addReputation: (amount) => 
    set((state) => ({ reputation: Math.max(0, state.reputation + amount) })),
    
  addStress: (amount) =>
    set((state) => ({ stress: Math.max(0, Math.min(100, state.stress + amount)) })),
    
  addConnections: (amount) =>
    set((state) => ({ connections: Math.max(0, state.connections + amount) })),
  
  nextRound: () => 
    set((state) => ({ 
      currentRound: state.currentRound + 1,
      phase: GamePhase.PLANNING 
    })),
  
  resetGame: () => set(initialState),
  
  // Faction actions
  setFactionEvent: (event) => set({ currentFactionEvent: event }),
  
  applyFactionChoice: (eventId, choiceId) => {
    const effects = factionSystem.applyEventChoice(eventId, choiceId);
    if (effects) {
      // Apply resource changes
      if (effects.resourceChanges) {
        const state = get();
        if (effects.resourceChanges.money) {
          state.addMoney(effects.resourceChanges.money);
        }
        if (effects.resourceChanges.reputation) {
          state.addReputation(effects.resourceChanges.reputation);
        }
        if (effects.resourceChanges.stress) {
          state.addStress(effects.resourceChanges.stress);
        }
        if (effects.resourceChanges.connections) {
          state.addConnections(effects.resourceChanges.connections);
        }
      }
    }
    set({ currentFactionEvent: null });
  }
}));