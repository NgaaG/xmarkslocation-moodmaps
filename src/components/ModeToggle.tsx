import { BookOpen, Map, Globe, Notebook } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ModeToggleProps {
  mode: 'campus' | 'nationwide' | 'global' | 'journal';
  onModeChange: (mode: 'campus' | 'nationwide' | 'global' | 'journal') => void;
}

const ModeToggle = ({ mode, onModeChange }: ModeToggleProps) => {
  return (
    <div className="fixed bottom-20 sm:bottom-24 left-2 sm:left-4 z-30 bg-background border border-border rounded-full shadow-lg p-0.5 sm:p-1 flex gap-0.5 sm:gap-1">
      <Button
        variant={mode === 'campus' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('campus')}
        className="rounded-full min-h-[40px] sm:min-h-[44px] px-2 sm:px-3"
        aria-label="University campus map view"
      >
        <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="ml-1 sm:ml-2 text-xs sm:text-sm">Campus</span>
      </Button>
      <Button
        variant={mode === 'nationwide' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('nationwide')}
        className="rounded-full min-h-[40px] sm:min-h-[44px] px-2 sm:px-3"
        aria-label="Nationwide map view"
      >
        <Map className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="ml-1 sm:ml-2 text-xs sm:text-sm">NL</span>
      </Button>
      <Button
        variant={mode === 'global' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('global')}
        className="rounded-full min-h-[40px] sm:min-h-[44px] px-2 sm:px-3"
        aria-label="Global map view"
      >
        <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="ml-1 sm:ml-2 text-xs sm:text-sm">Global</span>
      </Button>
      <Button
        variant={mode === 'journal' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('journal')}
        className="rounded-full min-h-[40px] sm:min-h-[44px] px-2 sm:px-3"
        aria-label="Journal view"
      >
        <Notebook className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="ml-1 sm:ml-2 text-xs sm:text-sm">Journal</span>
      </Button>
    </div>
  );
};

export default ModeToggle;
