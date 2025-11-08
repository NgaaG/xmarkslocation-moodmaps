import { useState, useEffect, useCallback } from 'react';

export type TutorialStep = 
  | 'mode-toggle' 
  | 'location-filter' 
  | 'location-pins' 
  | 'playlist-tab' 
  | 'spotify-open' 
  | 'mood-visualizer' 
  | 'mood-summary' 
  | 'journal-tab';

const TUTORIAL_STORAGE_KEY = 'tutorial-progress';
const TUTORIAL_COMPLETED_KEY = 'tutorial-completed';

interface TutorialProgress {
  completedSteps: TutorialStep[];
  currentStep: TutorialStep | null;
}

export const useTutorial = () => {
  const [currentStep, setCurrentStep] = useState<TutorialStep | null>(null);
  const [completedSteps, setCompletedSteps] = useState<TutorialStep[]>([]);
  const [tutorialActive, setTutorialActive] = useState(false);

  // Load tutorial progress from localStorage
  useEffect(() => {
    const isCompleted = localStorage.getItem(TUTORIAL_COMPLETED_KEY) === 'true';
    if (isCompleted) {
      setTutorialActive(false);
      return;
    }

    const saved = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    if (saved) {
      try {
        const progress: TutorialProgress = JSON.parse(saved);
        setCompletedSteps(progress.completedSteps || []);
        setCurrentStep(progress.currentStep);
        // Don't auto-start, wait for user to click help
        setTutorialActive(false);
      } catch {
        // Invalid data, don't auto-start
        setTutorialActive(false);
      }
    } else {
      // First time user - don't auto-start
      setTutorialActive(false);
    }
  }, []);

  // Save progress to localStorage
  useEffect(() => {
    if (tutorialActive) {
      const progress: TutorialProgress = {
        completedSteps,
        currentStep
      };
      localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(progress));
    }
  }, [currentStep, completedSteps, tutorialActive]);

  const completeStep = useCallback((step: TutorialStep) => {
    console.log('Completing tutorial step:', step);
    
    // Allow completing steps in any order (users can perform actions freely)
    setCompletedSteps(prev => {
      if (prev.includes(step)) return prev;
      const updated = [...prev, step];
      
      // Save progress immediately to localStorage
      const progress: TutorialProgress = {
        completedSteps: updated,
        currentStep
      };
      localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(progress));
      
      return updated;
    });
  }, [currentStep]);

  // Listen to tutorial events and automatically complete steps
  useEffect(() => {
    const eventHandlers: Record<string, TutorialStep> = {
      'tutorial-mode-toggle': 'mode-toggle',
      'tutorial-category-change': 'location-filter',
      'tutorial-pin-click': 'location-pins',
      'tutorial-playlist-preview': 'playlist-tab',
      'tutorial-spotify-open': 'spotify-open',
      'tutorial-mood-select': 'mood-visualizer',
      'tutorial-journey-save': 'mood-summary',
      'tutorial-journal-edit': 'journal-tab'
    };

    const handlers = Object.entries(eventHandlers).map(([eventName, step]) => {
      const handler = () => {
        console.log('Tutorial event detected:', eventName, '-> completing step:', step);
        completeStep(step);
      };
      window.addEventListener(eventName, handler);
      return { eventName, handler };
    });

    return () => {
      handlers.forEach(({ eventName, handler }) => {
        window.removeEventListener(eventName, handler);
      });
    };
  }, [completeStep]);

  const dismissCurrentStep = useCallback(() => {
    if (currentStep) {
      completeStep(currentStep);
      
      // Advance to next step when user dismisses
      const stepOrder: TutorialStep[] = [
        'mode-toggle',
        'location-filter',
        'location-pins',
        'playlist-tab',
        'spotify-open',
        'mood-visualizer',
        'mood-summary',
        'journal-tab'
      ];

      const currentIndex = stepOrder.indexOf(currentStep);
      
      if (currentIndex < stepOrder.length - 1) {
        const nextStep = stepOrder[currentIndex + 1];
        setCurrentStep(nextStep);
      } else {
        // All steps completed
        setCurrentStep(null);
        setTutorialActive(false);
        localStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
      }
    }
  }, [currentStep, completeStep]);

  const skipAllSteps = useCallback(() => {
    setCurrentStep(null);
    setTutorialActive(false);
    localStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
  }, []);

  const resetTutorial = useCallback(() => {
    localStorage.removeItem(TUTORIAL_STORAGE_KEY);
    localStorage.removeItem(TUTORIAL_COMPLETED_KEY);
    setCompletedSteps([]);
    setCurrentStep('mode-toggle');
    setTutorialActive(true);
  }, []);

  const startTutorial = useCallback(() => {
    setCurrentStep('mode-toggle');
    setTutorialActive(true);
    setCompletedSteps([]);
  }, []);

  const highlightElement = useCallback((step: TutorialStep) => {
    return tutorialActive && currentStep === step;
  }, [tutorialActive, currentStep]);

  return {
    currentStep,
    completedSteps,
    tutorialActive,
    completeStep,
    dismissCurrentStep,
    skipAllSteps,
    resetTutorial,
    startTutorial,
    highlightElement
  };
};
