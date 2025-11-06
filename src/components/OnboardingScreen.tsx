import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Music, Sparkles, Navigation, ChevronRight } from 'lucide-react';
import { createPortal } from 'react-dom';

const ONBOARDING_KEY = 'onboarding-completed';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const OnboardingScreen = ({ onComplete }: OnboardingScreenProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem(ONBOARDING_KEY);
    if (!hasCompletedOnboarding) {
      setShow(true);
    }
  }, []);

  const slides = [
    {
      icon: MapPin,
      title: 'Discover Outdoor Spots',
      description: 'Find peaceful, social, and scenic locations near you - perfect for music and mood tracking.',
      color: 'hsl(var(--peaceful))'
    },
    {
      icon: Music,
      title: 'Curated Spotify Playlists',
      description: 'Each location offers tailored playlists to match the vibe - from serene parks to vibrant social hubs.',
      color: 'hsl(var(--social))'
    },
    {
      icon: Sparkles,
      title: 'Track Your Mood',
      description: 'Record how each place and playlist makes you feel with our interactive mood visualizer.',
      color: 'hsl(var(--scenic))'
    },
    {
      icon: Navigation,
      title: 'Navigate with Ease',
      description: 'Get walking, transit, or driving directions to any spot using your preferred GPS app.',
      color: 'hsl(var(--primary))'
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShow(false);
    onComplete();
  };

  if (!show) return null;

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  const content = (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-background/95 backdrop-blur-lg animate-fade-in">
      <div className="relative max-w-md w-full">
        {/* Skip button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkip}
          className="absolute -top-12 right-0 text-muted-foreground hover:text-foreground"
        >
          Skip
        </Button>

        {/* Slide content */}
        <div className="flex flex-col items-center text-center space-y-8 animate-scale-in">
          {/* Icon */}
          <div 
            className="w-24 h-24 rounded-full flex items-center justify-center shadow-2xl animate-pulse"
            style={{ backgroundColor: slide.color + '/20', borderColor: slide.color, borderWidth: '3px' }}
          >
            <Icon className="w-12 h-12" style={{ color: slide.color }} />
          </div>

          {/* Text */}
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-foreground">
              {slide.title}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {slide.description}
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex gap-2">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'w-8 bg-primary' 
                    : 'w-2 bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Action button */}
          <Button
            onClick={handleNext}
            size="lg"
            className="w-full gap-2 shadow-lg hover:shadow-xl transition-shadow"
          >
            {currentSlide < slides.length - 1 ? (
              <>
                Next
                <ChevronRight className="w-5 h-5" />
              </>
            ) : (
              'Get Started'
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default OnboardingScreen;
