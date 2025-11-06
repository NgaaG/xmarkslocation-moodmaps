import { X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { createPortal } from 'react-dom';
import { useTutorial } from '@/hooks/useTutorial';

export type TutorialStep = 
  | 'mode-toggle' 
  | 'location-filter' 
  | 'location-pins' 
  | 'playlist-tab' 
  | 'spotify-open' 
  | 'mood-visualizer' 
  | 'mood-summary' 
  | 'journal-tab';

interface TutorialGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const tutorialContent: Record<TutorialStep, { title: string; description: string; tab: string }> = {
  'mode-toggle': {
    title: 'Navigate to Your Mode',
    description: 'Navigate to the mode of your current location (campus: NHL Stenden Leeuwarden, Netherlands, Global) to show outdoor spots in your area.',
    tab: 'Map View'
  },
  'location-filter': {
    title: 'Select Location Category',
    description: 'Select a location category to display location pins that match your preference (optional).',
    tab: 'Map View'
  },
  'location-pins': {
    title: 'Tap Location Pins',
    description: 'Tap an outdoor location pin to view spot details.',
    tab: 'Map View'
  },
  'playlist-tab': {
    title: 'Preview Playlists',
    description: 'Preview Spotify recommended playlists by pressing the play button or selecting a track.',
    tab: 'Playlists Tab'
  },
  'spotify-open': {
    title: 'Open in Spotify',
    description: 'Tap the Spotify logo or +Open in Spotify to open your playlist. Then return here to continue.',
    tab: 'Playlists Tab'
  },
  'mood-visualizer': {
    title: 'Record Your Mood',
    description: 'Select the playlist category you\'re playing, then tap the animated mood interface to start recording your mood.',
    tab: 'Mood Visualizer Tab'
  },
  'mood-summary': {
    title: 'Save Your Journey',
    description: 'Click Save Journey to add your entry to your journal.',
    tab: 'Mood Visualizer Tab'
  },
  'journal-tab': {
    title: 'Manage Your Entries',
    description: 'Press Edit to adjust details like playlist name or location; use the Photo button to download your summary as an image.',
    tab: 'Journal Mode'
  }
};

const tutorialSteps: { step: TutorialStep; content: typeof tutorialContent[TutorialStep] }[] = [
  { step: 'mode-toggle', content: tutorialContent['mode-toggle'] },
  { step: 'location-filter', content: tutorialContent['location-filter'] },
  { step: 'location-pins', content: tutorialContent['location-pins'] },
  { step: 'playlist-tab', content: tutorialContent['playlist-tab'] },
  { step: 'spotify-open', content: tutorialContent['spotify-open'] },
  { step: 'mood-visualizer', content: tutorialContent['mood-visualizer'] },
  { step: 'mood-summary', content: tutorialContent['mood-summary'] },
  { step: 'journal-tab', content: tutorialContent['journal-tab'] },
];

const TutorialGuide = ({ isOpen, onClose }: TutorialGuideProps) => {
  const { completedSteps } = useTutorial();
  
  if (!isOpen) return null;

  // Calculate progress
  const completedCount = tutorialSteps.filter(({ step }) => completedSteps.includes(step)).length;
  const progressPercentage = (completedCount / tutorialSteps.length) * 100;

  const tutorialElement = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      {/* Backdrop - no pointer events to prevent accidental close */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm pointer-events-none" 
      />
      
      {/* Tutorial list dialog */}
      <div className="relative max-w-2xl w-full max-h-[90vh] sm:max-h-[80vh] flex flex-col bg-card/95 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-2xl border border-border animate-scale-in pointer-events-auto">
        {/* Progress Bar */}
        <div className="px-4 sm:px-6 pt-3 sm:pt-4 pb-2 flex-shrink-0">
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
            How to Use This App
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

        {/* Content */}
        <ScrollArea className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
            {tutorialSteps.map(({ step, content }, index) => {
              const isCompleted = completedSteps.includes(step);
              return (
                <div
                  key={index}
                  className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-accent/50 hover:bg-accent/70 transition-colors border-2 border-accent/30"
                >
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-xs sm:text-sm shadow-lg">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-base sm:text-lg font-semibold text-foreground">
                        {content.title}
                      </h3>
                      <Badge variant="outline" className="text-xs whitespace-nowrap">
                        {content.tab}
                      </Badge>
                      {isCompleted && (
                        <Badge className="text-xs bg-green-600 text-white whitespace-nowrap">
                          ✓ Done
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                      {content.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-border flex-shrink-0">
          <Button onClick={onClose} className="w-full text-sm sm:text-base">
            Got it, let's start!
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(tutorialElement, document.body);
};

export default TutorialGuide;
