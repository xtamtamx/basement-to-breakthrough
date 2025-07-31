// Tutorial system to guide new players

import { safeStorage } from '@utils/safeStorage';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for highlighting
  action?: string; // Action to complete the step
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  showArrow?: boolean;
  condition?: () => boolean; // Optional condition to show this step
}

export interface TutorialProgress {
  currentStep: number;
  completedSteps: string[];
  isActive: boolean;
  skipTutorial: boolean;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to DIY Indie Empire!',
    description: 'You\'re about to build the underground music scene from the ground up. Let\'s start with the basics.',
    position: 'center',
    showArrow: false
  },
  {
    id: 'city_view',
    title: 'The City Map',
    description: 'This is your city. Different districts have different vibes - warehouses are authentic but risky, downtown is profitable but soulless.',
    target: '.city-map',
    position: 'bottom',
    showArrow: true
  },
  {
    id: 'venues',
    title: 'Venues',
    description: 'Click on any venue to see its details. Unlocked venues can host shows. Each venue has unique traits that affect your shows.',
    target: '.venue-building',
    position: 'top',
    showArrow: true,
    action: 'CLICK_VENUE'
  },
  {
    id: 'venue_info',
    title: 'Venue Information',
    description: 'Here you can see the venue\'s capacity, rent cost, and special traits. Districts affect how shows perform!',
    target: '.building-info-modal',
    position: 'right',
    showArrow: true,
    condition: () => document.querySelector('.building-info-modal') !== null
  },
  {
    id: 'book_show',
    title: 'Book Your First Show',
    description: 'Time to book your first show! Go to the booking view to match bands with venues.',
    target: '[data-view="booking"]',
    position: 'bottom',
    showArrow: true,
    action: 'OPEN_BOOKING'
  },
  {
    id: 'band_selection',
    title: 'Choose a Band',
    description: 'Each band has a genre, popularity, and special traits. Match them wisely with venues for better results!',
    target: '.band-card',
    position: 'right',
    showArrow: true,
    condition: () => document.querySelector('.band-card') !== null
  },
  {
    id: 'synergies',
    title: 'Discover Synergies',
    description: 'Some band-venue combinations work amazingly well together. Experiment to discover powerful synergies!',
    target: '.synergy-indicator',
    position: 'top',
    showArrow: true,
    condition: () => document.querySelector('.synergy-indicator') !== null
  },
  {
    id: 'show_results',
    title: 'Show Results',
    description: 'After booking, you\'ll see how your show went. Success depends on many factors - band-venue match, ticket price, and luck!',
    position: 'center',
    showArrow: false,
    action: 'COMPLETE_SHOW'
  },
  {
    id: 'resources',
    title: 'Manage Your Resources',
    description: 'Keep an eye on your money, reputation, and stress. Running out of money or maxing stress ends your run!',
    target: '.resource-bar',
    position: 'bottom',
    showArrow: true
  },
  {
    id: 'districts_matter',
    title: 'Districts Matter',
    description: 'Warehouse shows are authentic but risky. Downtown pays well but hurts your cred. Choose wisely!',
    position: 'center',
    showArrow: false
  },
  {
    id: 'gentrification',
    title: 'Watch for Gentrification',
    description: 'Success attracts attention. Too many big shows will gentrify districts, raising rents and killing the scene.',
    target: '.district-warning',
    position: 'top',
    showArrow: true,
    condition: () => document.querySelector('.district-warning') !== null
  },
  {
    id: 'path_choice',
    title: 'Choose Your Path',
    description: 'Will you stay DIY and authentic, or sell out for success? Your choices shape the scene\'s future.',
    position: 'center',
    showArrow: false
  },
  {
    id: 'tutorial_complete',
    title: 'You\'re Ready!',
    description: 'Build your scene, discover synergies, and decide the future of underground music. Good luck!',
    position: 'center',
    showArrow: false
  }
];

export class TutorialManager {
  private progress: TutorialProgress;
  private onStepChange?: (step: TutorialStep | null) => void;
  
  constructor() {
    this.progress = {
      currentStep: 0,
      completedSteps: [],
      isActive: false,
      skipTutorial: false
    };
    
    // Load saved progress
    this.loadProgress();
  }
  
  private loadProgress() {
    const saved = safeStorage.getItem('tutorialProgress');
    if (saved) {
      try {
        this.progress = JSON.parse(saved);
      } catch {
        prodLog.error('Failed to load tutorial progress');
      }
    }
  }
  
  private saveProgress() {
    safeStorage.setItem('tutorialProgress', JSON.stringify(this.progress));
  }
  
  startTutorial() {
    if (this.progress.skipTutorial) return;
    
    this.progress.isActive = true;
    this.progress.currentStep = 0;
    this.saveProgress();
    this.showCurrentStep();
  }
  
  skipTutorial() {
    this.progress.skipTutorial = true;
    this.progress.isActive = false;
    this.saveProgress();
    this.onStepChange?.(null);
  }
  
  resetTutorial() {
    this.progress = {
      currentStep: 0,
      completedSteps: [],
      isActive: false,
      skipTutorial: false
    };
    this.saveProgress();
  }
  
  private getCurrentStep(): TutorialStep | null {
    if (!this.progress.isActive || this.progress.currentStep >= TUTORIAL_STEPS.length) {
      return null;
    }
    
    const step = TUTORIAL_STEPS[this.progress.currentStep];
    
    // Check if step has a condition
    if (step.condition && !step.condition()) {
      return null;
    }
    
    return step;
  }
  
  private showCurrentStep() {
    const step = this.getCurrentStep();
    this.onStepChange?.(step);
  }
  
  completeAction(action: string) {
    const currentStep = this.getCurrentStep();
    if (!currentStep || currentStep.action !== action) return;
    
    this.nextStep();
  }
  
  nextStep() {
    if (!this.progress.isActive) return;
    
    const currentStep = this.getCurrentStep();
    if (currentStep) {
      this.progress.completedSteps.push(currentStep.id);
    }
    
    this.progress.currentStep++;
    
    if (this.progress.currentStep >= TUTORIAL_STEPS.length) {
      this.completeTutorial();
    } else {
      this.saveProgress();
      this.showCurrentStep();
    }
  }
  
  previousStep() {
    if (!this.progress.isActive || this.progress.currentStep <= 0) return;
    
    this.progress.currentStep--;
    this.saveProgress();
    this.showCurrentStep();
  }
  
  private completeTutorial() {
    this.progress.isActive = false;
    this.progress.skipTutorial = true;
    this.saveProgress();
    this.onStepChange?.(null);
  }
  
  isStepCompleted(stepId: string): boolean {
    return this.progress.completedSteps.includes(stepId);
  }
  
  isTutorialComplete(): boolean {
    return this.progress.skipTutorial || 
           this.progress.completedSteps.length >= TUTORIAL_STEPS.length;
  }
  
  onStepChangeHandler(handler: (step: TutorialStep | null) => void) {
    this.onStepChange = handler;
  }
  
  // Check if we should show tutorial for new players
  shouldShowTutorial(): boolean {
    return !this.progress.skipTutorial && this.progress.completedSteps.length === 0;
  }
}

// Singleton instance
export const tutorialManager = new TutorialManager();