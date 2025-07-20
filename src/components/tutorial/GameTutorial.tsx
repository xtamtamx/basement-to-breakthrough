import React, { useState, useEffect } from 'react';
import { TutorialOverlay, TutorialStep } from './TutorialOverlay';
import { useGameStore } from '@stores/gameStore';

interface GameTutorialProps {
  onComplete: () => void;
}

export const GameTutorial: React.FC<GameTutorialProps> = ({ onComplete }) => {
  const [showTutorial, setShowTutorial] = useState(false);
  const { phase } = useGameStore();

  useEffect(() => {
    // Check if tutorial has been completed
    const tutorialCompleted = localStorage.getItem('tutorial_completed');
    if (!tutorialCompleted) {
      setShowTutorial(true);
    }
  }, []);

  const tutorialSteps: TutorialStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to the Underground!',
      content: 'You\'re about to build the next great music scene from the ground up. Start in basements, end in arenas!',
      position: 'center',
      showSkip: true,
    },
    {
      id: 'resources',
      title: 'Your Resources',
      content: 'Keep an eye on your Money, Reputation, and Fans. You\'ll need all three to succeed.',
      target: '[data-tutorial="resources"]',
      position: 'top',
    },
    {
      id: 'bands',
      title: 'Band Cards',
      content: 'These are the bands looking to play shows. Each has unique stats and traits that affect their performance.',
      target: '[data-tutorial="band-area"]',
      position: 'bottom',
    },
    {
      id: 'venues',
      title: 'Venue Cards',
      content: 'Venues are where the magic happens. Match the right band to the right venue for maximum impact!',
      target: '[data-tutorial="venue-area"]',
      position: 'top',
    },
    {
      id: 'drag-drop',
      title: 'Book a Show',
      content: 'Drag a band card onto a venue to book a show. Look for synergies between band and venue traits!',
      position: 'center',
      action: 'Try dragging a band onto a venue',
    },
    {
      id: 'stacking',
      title: 'Stack Cards',
      content: 'Drag cards close together to stack them. Tap a stack to expand it.',
      position: 'center',
      action: 'Stack two band cards together',
    },
    {
      id: 'run-shows',
      title: 'Run Your Shows',
      content: 'Once you\'ve booked shows, hit "Run Shows" to see how they perform!',
      target: '[data-tutorial="run-shows"]',
      position: 'left',
    },
    {
      id: 'factions',
      title: 'Faction Politics',
      content: 'Different factions in the scene will react to your choices. Keep them happy for bonuses, or face their wrath!',
      target: '[data-tutorial="factions"]',
      position: 'right',
    },
    {
      id: 'turns',
      title: 'Turn Progression',
      content: 'Each turn has phases: Planning → Booking → Show Night → Aftermath. Plan wisely!',
      target: '[data-tutorial="turn-display"]',
      position: 'right',
    },
    {
      id: 'equipment',
      title: 'Upgrade Your Gear',
      content: 'Between shows, invest in equipment to improve your capabilities. Better gear means better shows!',
      position: 'center',
    },
    {
      id: 'ready',
      title: 'You\'re Ready!',
      content: 'That\'s the basics! Remember: start small, build your reputation, and never sell out (unless the price is right).',
      position: 'center',
    },
  ];

  const handleComplete = () => {
    localStorage.setItem('tutorial_completed', 'true');
    setShowTutorial(false);
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem('tutorial_completed', 'true');
    setShowTutorial(false);
    onComplete();
  };

  if (!showTutorial) return null;

  return (
    <TutorialOverlay
      steps={tutorialSteps}
      onComplete={handleComplete}
      onSkip={handleSkip}
    />
  );
};

// Quick tutorial for specific features
export const useFeatureTutorial = (feature: string) => {
  const [steps, setSteps] = useState<TutorialStep[]>([]);
  const [show, setShow] = useState(false);

  const featureTutorials: Record<string, TutorialStep[]> = {
    equipment: [
      {
        id: 'equipment-intro',
        title: 'Equipment Shop',
        content: 'Upgrade your gear to improve show outcomes!',
        position: 'center',
      },
      {
        id: 'equipment-types',
        title: 'Equipment Types',
        content: 'Sound, Lighting, Transport, and more. Each type offers different bonuses.',
        position: 'center',
      },
      {
        id: 'equipment-rarity',
        title: 'Rarity Matters',
        content: 'Rarer equipment provides better bonuses but costs more. Save up for the good stuff!',
        position: 'center',
      },
    ],
    factions: [
      {
        id: 'faction-intro',
        title: 'Scene Politics',
        content: 'Every action affects your standing with different factions.',
        position: 'center',
      },
      {
        id: 'faction-benefits',
        title: 'Alliance Benefits',
        content: 'Allied factions provide bonuses like cheaper venues and more fans.',
        position: 'center',
      },
      {
        id: 'faction-conflicts',
        title: 'Choose Wisely',
        content: 'Some factions hate each other. You can\'t please everyone!',
        position: 'center',
      },
    ],
  };

  const startTutorial = () => {
    const tutorialKey = `tutorial_${feature}_completed`;
    if (!localStorage.getItem(tutorialKey)) {
      setSteps(featureTutorials[feature] || []);
      setShow(true);
    }
  };

  const completeTutorial = () => {
    localStorage.setItem(`tutorial_${feature}_completed`, 'true');
    setShow(false);
  };

  return {
    show,
    steps,
    startTutorial,
    completeTutorial,
  };
};