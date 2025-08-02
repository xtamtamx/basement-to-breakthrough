import { GameState } from '@stores/gameStore';

export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  target?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'click' | 'hover' | 'wait' | 'custom';
  nextTrigger?: 'click' | 'action' | 'auto';
  highlightPadding?: number;
  onShow?: () => void;
  onComplete?: () => void;
  isComplete?: (state: GameState) => boolean;
}

export interface TutorialSection {
  id: string;
  name: string;
  description: string;
  steps: TutorialStep[];
  unlockCondition?: (state: GameState) => boolean;
}

export class TutorialManager {
  private currentSection: TutorialSection | null = null;
  private currentStepIndex: number = 0;
  private completedSteps: Set<string> = new Set();
  private skipped: boolean = false;
  private onUpdateCallbacks: Array<() => void> = [];
  
  constructor() {
    this.loadProgress();
  }
  
  // Tutorial sections
  private sections: TutorialSection[] = [
    {
      id: 'welcome',
      name: 'Welcome to the Underground',
      description: 'Learn the basics of running DIY shows',
      steps: [
        {
          id: 'welcome-intro',
          title: 'Welcome to Basement to Breakthrough! 🎸',
          content: `You're about to embark on a journey through the underground music scene. 
          
          Starting from basement shows, you'll book bands, manage venues, and build a thriving scene while navigating the challenges of gentrification, scene politics, and keeping it authentic.
          
          Let's start with the basics!`,
          position: 'center',
          nextTrigger: 'click'
        },
        {
          id: 'resources-overview',
          title: 'Your Resources 💰',
          content: 'Keep an eye on your resources at the top of the screen:\n\n• **Money**: Book shows, upgrade venues, pay rent\n• **Reputation**: Attract better bands and bigger crowds\n• **Fans**: Your scene\'s following',
          target: '.resources',
          position: 'bottom',
          highlightPadding: 10,
          nextTrigger: 'click'
        },
        {
          id: 'navigation-tabs',
          title: 'Navigate Your Empire 🗺️',
          content: 'Use these tabs to manage different aspects of your scene:\n\n• **City**: Place and manage venues\n• **Bands**: View and recruit bands\n• **Shows**: Book and schedule shows\n• **Synergies**: Discover powerful combinations',
          target: '.nav-tabs',
          position: 'bottom',
          highlightPadding: 5,
          nextTrigger: 'click'
        }
      ]
    },
    {
      id: 'first-show',
      name: 'Book Your First Show',
      description: 'Learn how to book bands and make money',
      steps: [
        {
          id: 'go-to-shows',
          title: 'Let\'s Book a Show! 🎤',
          content: 'Click on the **Shows** tab to start booking your first show.',
          target: '.nav-item:nth-child(3)',
          position: 'bottom',
          action: 'click',
          nextTrigger: 'action',
          onComplete: () => {
            // Switch to shows view
            const navButton = document.querySelector('.nav-item:nth-child(3)') as HTMLButtonElement;
            navButton?.click();
          }
        },
        {
          id: 'select-venue',
          title: 'Choose a Venue 🏠',
          content: 'Start by selecting a venue for your show. Different venues have different capacities and vibes.',
          target: '.venue-select',
          position: 'right',
          nextTrigger: 'action'
        },
        {
          id: 'select-band',
          title: 'Book a Band 🎸',
          content: 'Now select a band to play. Pay attention to:\n\n• **Popularity**: How many fans they draw\n• **Genre**: Different genres appeal to different crowds\n• **Cost**: How much they charge to play',
          target: '.band-card',
          position: 'right',
          nextTrigger: 'action'
        },
        {
          id: 'set-ticket-price',
          title: 'Set Ticket Price 🎫',
          content: 'Balance ticket prices carefully:\n\n• **Too High**: Fewer people will come\n• **Too Low**: Less profit\n• **Just Right**: Maximum revenue!',
          target: '.ticket-price-input',
          position: 'left',
          nextTrigger: 'click'
        },
        {
          id: 'book-show',
          title: 'Book the Show! 🚀',
          content: 'Click "Book Show" to schedule it. Shows happen at the end of each turn.',
          target: '.book-show-button',
          position: 'top',
          action: 'click',
          nextTrigger: 'action'
        }
      ]
    },
    {
      id: 'end-turn',
      name: 'Your First Turn',
      description: 'Process your first turn and see the results',
      steps: [
        {
          id: 'next-turn-intro',
          title: 'Time Passes... ⏰',
          content: 'Click "Next Turn" to advance time and see your show results!',
          target: '.next-turn-btn',
          position: 'left',
          action: 'click',
          nextTrigger: 'action'
        },
        {
          id: 'turn-results',
          title: 'Show Results 📊',
          content: 'Here\'s how your show did! You\'ll see:\n\n• **Attendance**: How many people came\n• **Revenue**: Money earned\n• **Reputation**: Scene cred gained\n• **New Fans**: Growing your following',
          target: '.turn-results-modal',
          position: 'center',
          nextTrigger: 'click'
        }
      ]
    },
    {
      id: 'venue-management',
      name: 'Venue Management',
      description: 'Learn to place venues and manage your city',
      unlockCondition: (state) => state.turn >= 2,
      steps: [
        {
          id: 'city-view',
          title: 'Build Your Scene 🏗️',
          content: 'Click on the **City** tab to manage your venues and expand your empire.',
          target: '.nav-item:nth-child(1)',
          position: 'bottom',
          action: 'click',
          nextTrigger: 'action'
        },
        {
          id: 'venue-placement',
          title: 'Place New Venues 📍',
          content: 'Click on empty spaces in the city to place new venues. Different areas have different vibes:\n\n• **Industrial**: Authentic but risky\n• **Downtown**: Expensive but profitable\n• **Residential**: Balanced option',
          target: '.city-grid',
          position: 'right',
          nextTrigger: 'click'
        },
        {
          id: 'venue-upgrades',
          title: 'Upgrade Your Venues 🔧',
          content: 'Click on a venue and select "Manage Upgrades" to:\n\n• **Buy Equipment**: Better sound = happier crowds\n• **Expand Capacity**: More tickets to sell\n• **Add Features**: Bars, security, etc.',
          target: '.venue-sprite',
          position: 'top',
          nextTrigger: 'click'
        }
      ]
    },
    {
      id: 'advanced-strategies',
      name: 'Advanced Strategies',
      description: 'Master synergies and scene politics',
      unlockCondition: (state) => state.turn >= 5,
      steps: [
        {
          id: 'synergies-intro',
          title: 'Discover Synergies 🔮',
          content: 'Some band and venue combinations create powerful synergies! Check the **Synergies** tab to see what you\'ve discovered.',
          target: '.nav-item:nth-child(4)',
          position: 'bottom',
          nextTrigger: 'click'
        },
        {
          id: 'scene-politics',
          title: 'Navigate Scene Politics 🤝',
          content: 'As your scene grows, you\'ll face:\n\n• **Band Drama**: Rivalries and friendships\n• **Gentrification**: Rising rents and changing neighborhoods\n• **Police Attention**: Too much noise brings heat\n\nBalance growth with authenticity!',
          position: 'center',
          nextTrigger: 'click'
        },
        {
          id: 'save-progress',
          title: 'Save Your Progress 💾',
          content: 'Don\'t forget to save! Click the save icon to manage your saves. The game also auto-saves every 5 minutes.',
          target: '.settings-btn:first-child',
          position: 'left',
          nextTrigger: 'click'
        }
      ]
    }
  ];
  
  // Get current tutorial state
  getCurrentSection(): TutorialSection | null {
    return this.currentSection;
  }
  
  getCurrentStep(): TutorialStep | null {
    if (!this.currentSection || this.currentStepIndex >= this.currentSection.steps.length) {
      return null;
    }
    return this.currentSection.steps[this.currentStepIndex];
  }
  
  getCurrentProgress(): { current: number; total: number } {
    if (!this.currentSection) {
      return { current: 0, total: 0 };
    }
    return {
      current: this.currentStepIndex + 1,
      total: this.currentSection.steps.length
    };
  }
  
  // Start a tutorial section
  startSection(sectionId: string): boolean {
    const section = this.sections.find(s => s.id === sectionId);
    if (!section) return false;
    
    this.currentSection = section;
    this.currentStepIndex = 0;
    this.skipped = false;
    
    const firstStep = this.getCurrentStep();
    if (firstStep?.onShow) {
      firstStep.onShow();
    }
    
    this.notifyUpdate();
    this.saveProgress();
    return true;
  }
  
  // Start the tutorial from the beginning
  startTutorial(): void {
    this.completedSteps.clear();
    this.startSection('welcome');
  }
  
  // Check if tutorial should start for new players
  shouldShowTutorial(state: GameState): boolean {
    // Show tutorial if it's the first turn and hasn't been completed
    return state.turn === 1 && !this.hasCompletedTutorial() && !this.skipped;
  }
  
  // Move to next step
  nextStep(): void {
    if (!this.currentSection) return;
    
    const currentStep = this.getCurrentStep();
    if (currentStep) {
      this.completedSteps.add(currentStep.id);
      if (currentStep.onComplete) {
        currentStep.onComplete();
      }
    }
    
    this.currentStepIndex++;
    
    // Check if section is complete
    if (this.currentStepIndex >= this.currentSection.steps.length) {
      this.completeSection();
      return;
    }
    
    const nextStep = this.getCurrentStep();
    if (nextStep?.onShow) {
      nextStep.onShow();
    }
    
    this.notifyUpdate();
    this.saveProgress();
  }
  
  // Complete current section
  private completeSection(): void {
    if (!this.currentSection) return;
    
    // Find next available section
    const currentIndex = this.sections.findIndex(s => s.id === this.currentSection!.id);
    const nextSection = this.sections[currentIndex + 1];
    
    if (nextSection) {
      // Check if next section is unlocked
      const state = this.getGameState();
      if (!nextSection.unlockCondition || nextSection.unlockCondition(state)) {
        this.startSection(nextSection.id);
      } else {
        // Tutorial paused until conditions are met
        this.currentSection = null;
        this.currentStepIndex = 0;
      }
    } else {
      // Tutorial complete!
      this.currentSection = null;
      this.currentStepIndex = 0;
    }
    
    this.notifyUpdate();
    this.saveProgress();
  }
  
  // Skip tutorial
  skipTutorial(): void {
    this.skipped = true;
    this.currentSection = null;
    this.currentStepIndex = 0;
    this.notifyUpdate();
    this.saveProgress();
  }
  
  // Resume tutorial
  resumeTutorial(): void {
    this.skipped = false;
    
    // Find the next uncompleted section
    for (const section of this.sections) {
      const hasIncompleteSteps = section.steps.some(step => !this.completedSteps.has(step.id));
      if (hasIncompleteSteps) {
        const state = this.getGameState();
        if (!section.unlockCondition || section.unlockCondition(state)) {
          this.startSection(section.id);
          
          // Skip to first incomplete step
          while (this.currentStepIndex < section.steps.length && 
                 this.completedSteps.has(section.steps[this.currentStepIndex].id)) {
            this.currentStepIndex++;
          }
          
          break;
        }
      }
    }
    
    this.notifyUpdate();
    this.saveProgress();
  }
  
  // Check if specific step is complete
  isStepComplete(stepId: string): boolean {
    return this.completedSteps.has(stepId);
  }
  
  // Check if tutorial is fully complete
  hasCompletedTutorial(): boolean {
    const totalSteps = this.sections.reduce((sum, section) => sum + section.steps.length, 0);
    return this.completedSteps.size >= totalSteps;
  }
  
  // Get available sections based on game state
  getAvailableSections(state: GameState): TutorialSection[] {
    return this.sections.filter(section => 
      !section.unlockCondition || section.unlockCondition(state)
    );
  }
  
  // Subscribe to updates
  onUpdate(callback: () => void): () => void {
    this.onUpdateCallbacks.push(callback);
    return () => {
      this.onUpdateCallbacks = this.onUpdateCallbacks.filter(cb => cb !== callback);
    };
  }
  
  private notifyUpdate(): void {
    this.onUpdateCallbacks.forEach(cb => cb());
  }
  
  // Persistence
  private saveProgress(): void {
    const progress = {
      currentSectionId: this.currentSection?.id || null,
      currentStepIndex: this.currentStepIndex,
      completedSteps: Array.from(this.completedSteps),
      skipped: this.skipped
    };
    
    localStorage.setItem('tutorial-progress', JSON.stringify(progress));
  }
  
  private loadProgress(): void {
    try {
      const saved = localStorage.getItem('tutorial-progress');
      if (!saved) return;
      
      const progress = JSON.parse(saved);
      this.completedSteps = new Set(progress.completedSteps || []);
      this.skipped = progress.skipped || false;
      
      if (progress.currentSectionId && !this.skipped) {
        const section = this.sections.find(s => s.id === progress.currentSectionId);
        if (section) {
          this.currentSection = section;
          this.currentStepIndex = progress.currentStepIndex || 0;
        }
      }
    } catch (error) {
      console.error('Failed to load tutorial progress:', error);
    }
  }
  
  // Reset tutorial progress
  resetProgress(): void {
    this.completedSteps.clear();
    this.currentSection = null;
    this.currentStepIndex = 0;
    this.skipped = false;
    localStorage.removeItem('tutorial-progress');
    this.notifyUpdate();
  }
  
  // Get current game state (for checking conditions)
  private getGameState(): GameState {
    // This will be injected or imported
    const { useGameStore } = require('@stores/gameStore');
    return useGameStore.getState();
  }
}

// Singleton instance
export const tutorialManager = new TutorialManager();