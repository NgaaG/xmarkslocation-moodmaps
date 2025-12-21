import { useState, useEffect } from 'react';
import MapView from '@/components/MapView';
import JournalView from '@/components/JournalView';
import ModeToggle from '@/components/ModeToggle';
import TutorialGuide from '@/components/TutorialGuide';
import OnboardingScreen from '@/components/OnboardingScreen';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';

const HELP_CLICKED_KEY = 'help-icon-clicked';

const Index = () => {
  const [mode, setMode] = useState<'campus' | 'nationwide' | 'global' | 'journal'>('campus');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [showHelpHighlight, setShowHelpHighlight] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  // Check if help icon should be highlighted
  useEffect(() => {
    const hasClicked = localStorage.getItem(HELP_CLICKED_KEY);
    setShowHelpHighlight(!hasClicked);
  }, []);

  // Session management: Clear journal entries on new session
  useEffect(() => {
    const sessionId = sessionStorage.getItem('appSessionId');
    
    if (!sessionId) {
      // New session - clear previous journal entries
      localStorage.removeItem('moodJournalEntries');
      localStorage.removeItem('selectedPlaylistCategory');
      localStorage.removeItem('selectedSpotifyPlaylistName');
      localStorage.removeItem('selectedLocationTitle');
      localStorage.removeItem('spotifyPlaylistActive');
      
      // Set new session ID
      sessionStorage.setItem('appSessionId', Date.now().toString());
    }
  }, []);

  const handleHelpClick = () => {
    setTutorialOpen(true);
    setShowHelpHighlight(false);
    localStorage.setItem(HELP_CLICKED_KEY, 'true');
  };

  return (
    <>
      {/* Onboarding Screen */}
      <OnboardingScreen onComplete={() => setOnboardingComplete(true)} />
      
      <div className="h-screen w-full overflow-hidden">
        {/* Main Content */}
        <div className="h-full w-full">
          {mode === 'journal' ? (
            <JournalView 
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          ) : (
            <MapView 
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              mapMode={mode}
              helpButton={
                <Button
                  onClick={handleHelpClick}
                  size="icon"
                  variant="outline"
                  className={`rounded-full shadow-lg bg-card/95 backdrop-blur-sm hover:bg-card ${
                    showHelpHighlight ? 'help-icon-pulse' : ''
                  }`}
                  aria-label="View tutorial guide"
                >
                  <HelpCircle className="h-5 w-5" />
                </Button>
              }
            />
          )}
        </div>

        {/* Mode Toggle */}
        <ModeToggle mode={mode} onModeChange={setMode} />

        {/* Tutorial Guide */}
        <TutorialGuide
          isOpen={tutorialOpen}
          onClose={() => setTutorialOpen(false)}
        />
      </div>
    </>
  );
};

export default Index;
