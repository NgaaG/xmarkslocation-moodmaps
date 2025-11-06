import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { Progress } from '@/components/ui/progress';
import { createPortal } from 'react-dom';
import { useTutorial, type TutorialStep } from '@/hooks/useTutorial';

interface SpotDetailsTutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

// Steps 4-8 from the main map view tutorial
const tutorialSteps: Array<{ step: TutorialStep; title: string; description: string; tab: string }> = [
  {
    step: 'playlist-tab' as TutorialStep,
    title: 'Preview Playlists',
    description: 'Preview Spotify recommended playlists by pressing the play button or selecting a track.',
    tab: 'Playlists Tab'
  },
  {
    step: 'spotify-open' as TutorialStep,
    title: 'Open in Spotify',
    description: 'Tap the Spotify logo or +Open in Spotify to open your playlist. Then return here to continue.',
    tab: 'Playlists Tab'
  },
  {
    step: 'mood-visualizer' as TutorialStep,
    title: 'Record Your Mood',
    description: 'Select the playlist category you\'re playing, then tap the animated mood interface to start recording your mood.',
    tab: 'Mood Visualizer Tab'
  },
  {
    step: 'mood-summary' as TutorialStep,
    title: 'Save Your Journey',
    description: 'Click Save Journey to add your entry to your journal.',
    tab: 'Mood Visualizer Tab'
  },
  {
    step: 'journal-tab' as TutorialStep,
    title: 'Manage Your Entries',
    description: 'Press Edit to adjust details like playlist name or location; use the Photo button to download your summary as an image.',
    tab: 'Journal Mode'
  }
];

const SpotDetailsTutorial = ({ isOpen, onClose }: SpotDetailsTutorialProps) => {
  const { completedSteps } = useTutorial();
  
  if (!isOpen) return null;

  // Calculate progress based on completed steps (steps 4-8)
  const relevantSteps = tutorialSteps.map(s => s.step);
  const completedCount = relevantSteps.filter(step => completedSteps.includes(step)).length;
  const progressPercentage = (completedCount / tutorialSteps.length) * 100;

  const tutorialContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      {/* Backdrop - cannot close by clicking */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm" 
      />
      
      {/* Tutorial dialog */}
      <div className="relative max-w-2xl w-full max-h-[90vh] sm:max-h-[85vh] flex flex-col bg-card/95 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-2xl border border-border animate-scale-in pointer-events-auto">
        {/* Progress Bar */}
        <div className="px-6 pt-4 pb-2 flex-shrink-0">
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{completedCount} of {tutorialSteps.length} completed</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border flex-shrink-0">
          <h2 className="text-lg sm:text-2xl font-semibold text-foreground">
            Spot Details Guide
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
            aria-label="Close tutorial"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 space-y-3 sm:space-y-4">
          {tutorialSteps.map((step, index) => {
            const isCompleted = completedSteps.includes(step.step);
            return (
              <div
                key={index}
                className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-orange-500/10 border-2 border-orange-500/30 hover:bg-orange-500/20 transition-colors"
              >
                <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-semibold text-xs sm:text-sm shadow-lg">
                  {index + 4}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-base sm:text-lg font-semibold text-foreground">
                      {step.title}
                    </h3>
                    <Badge variant="outline" className="text-xs border-orange-500/50 text-orange-700 dark:text-orange-400 whitespace-nowrap">
                      {step.tab}
                    </Badge>
                    {isCompleted && (
                      <Badge className="text-xs bg-green-600 text-white whitespace-nowrap">
                        ✓ Done
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-border flex-shrink-0">
          <Button onClick={onClose} className="w-full text-sm sm:text-base">
            Got it!
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(tutorialContent, document.body);
};

export default SpotDetailsTutorial;
