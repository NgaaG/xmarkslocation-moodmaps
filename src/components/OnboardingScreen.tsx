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
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 sm:p-6 bg-background/95 backdrop-blur-lg animate-in fade-in duration-700">
      <div className="relative max-w-md w-full">
        {/* Skip button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkip}
          className="absolute -top-8 sm:-top-12 right-0 text-muted-foreground hover:text-foreground text-sm sm:text-base animate-in fade-in slide-in-from-top-4 duration-500 delay-300"
        >
          Skip
        </Button>

        {/* Slide content */}
        <div className="flex flex-col items-center text-center space-y-6 sm:space-y-8 px-4 sm:px-0">
          {/* Icon */}
          <div 
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center shadow-2xl animate-in zoom-in duration-500 delay-100"
            style={{ backgroundColor: slide.color + '/20', borderColor: slide.color, borderWidth: '3px' }}
          >
            <Icon className="w-10 h-10 sm:w-12 sm:h-12 animate-in fade-in duration-700 delay-300" style={{ color: slide.color }} />
          </div>

          {/* Text */}
          <div className="space-y-3 sm:space-y-4 animate-in slide-in-from-bottom-4 duration-500 delay-200">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {slide.title}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              {slide.description}
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex gap-2 animate-in fade-in duration-500 delay-300">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-500 ease-out ${
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
            className="w-full gap-2 shadow-lg hover:shadow-xl transition-all duration-300 animate-in slide-in-from-bottom-4 fade-in delay-400"
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
