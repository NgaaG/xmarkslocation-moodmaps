import { Button } from '@/components/ui/button';
import { getCategoryLabel, type SpotCategory } from '@/data/spots';

interface FilterBarProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  helpButton?: React.ReactNode;
}

const categories: SpotCategory[] = ['peaceful', 'social', 'scenic'];

const FilterBar = ({ selectedCategory, onCategoryChange, helpButton }: FilterBarProps) => {
  const handleCategoryChange = (category: string | null) => {
    onCategoryChange(category);
    window.dispatchEvent(new CustomEvent('tutorial-category-change'));
  };

  return (
    <div className="bg-background/90 dark:bg-background/90 backdrop-blur-md border-b border-border min-h-[64px] sm:h-16 flex items-center justify-between px-3 sm:px-4 gap-2 sm:gap-3">
      <div className="flex items-center gap-2 sm:gap-3 flex-1 overflow-x-auto scrollbar-hide">
        <span className="text-xs sm:text-sm font-medium text-muted-foreground shrink-0">
          Filter:
        </span>
        <div className="flex gap-2 pb-2 sm:pb-0">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleCategoryChange(null)}
            className="rounded-full min-h-[40px] sm:min-h-[44px] text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap"
          >
            All Spots
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCategoryChange(category)}
              className="rounded-full min-h-[40px] sm:min-h-[44px] capitalize text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap"
            >
              {getCategoryLabel(category)}
            </Button>
          ))}
        </div>
      </div>
      {helpButton && (
        <div className="flex-shrink-0">
          {helpButton}
        </div>
      )}
    </div>
  );
};

export default FilterBar;
