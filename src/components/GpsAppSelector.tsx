import { X, Navigation } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { createPortal } from 'react-dom';

interface GpsAppSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  locationName: string;
  latitude: number;
  longitude: number;
}

const GpsAppSelector = ({ isOpen, onClose, locationName, latitude, longitude }: GpsAppSelectorProps) => {
  if (!isOpen) return null;

  const encodedName = encodeURIComponent(locationName);
  
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  const handleAppleMaps = () => {
    window.location.href = `maps://?daddr=${latitude},${longitude}&q=${encodedName}`;
    onClose();
  };

  const handleGoogleMaps = () => {
    if (isAndroid) {
      window.location.href = `geo:${latitude},${longitude}?q=${encodedName}`;
    } else {
      window.location.href = `comgooglemaps://?daddr=${encodedName}&center=${latitude},${longitude}`;
      setTimeout(() => {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${encodedName}`, '_blank');
      }, 500);
    }
    onClose();
  };

  const handleWaze = () => {
    window.location.href = `waze://?ll=${latitude},${longitude}&navigate=yes&q=${encodedName}`;
    setTimeout(() => {
      window.open(`https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes&q=${encodedName}`, '_blank');
    }, 500);
    onClose();
  };

  const handleWebMaps = () => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedName}+${latitude},${longitude}`, '_blank');
    onClose();
  };

  const content = (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-[95vw] sm:w-full">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2">
              <Navigation className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <span className="truncate">Choose Navigation App</span>
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2">
            Navigate to <span className="font-medium text-foreground truncate inline-block max-w-[200px] align-bottom">{locationName}</span>
          </p>
        </DialogHeader>

        <div className="space-y-2 sm:space-y-3 mt-4">
          {isIOS && (
            <Button
              onClick={handleAppleMaps}
              variant="outline"
              className="w-full justify-start gap-2 sm:gap-3 h-auto py-3 sm:py-4 hover:bg-accent"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-lg sm:text-xl">
                🗺️
              </div>
              <div className="text-left min-w-0">
                <div className="font-medium text-sm sm:text-base">Apple Maps</div>
                <div className="text-xs text-muted-foreground hidden sm:block">Built-in iOS navigation</div>
              </div>
            </Button>
          )}

          <Button
            onClick={handleGoogleMaps}
            variant="outline"
            className="w-full justify-start gap-2 sm:gap-3 h-auto py-3 sm:py-4 hover:bg-accent"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-lg sm:text-xl">
              🌍
            </div>
            <div className="text-left min-w-0">
              <div className="font-medium text-sm sm:text-base">Google Maps</div>
              <div className="text-xs text-muted-foreground hidden sm:block">Walking, transit & driving directions</div>
            </div>
          </Button>

          <Button
            onClick={handleWaze}
            variant="outline"
            className="w-full justify-start gap-2 sm:gap-3 h-auto py-3 sm:py-4 hover:bg-accent"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-lg sm:text-xl">
              🚗
            </div>
            <div className="text-left min-w-0">
              <div className="font-medium text-sm sm:text-base">Waze</div>
              <div className="text-xs text-muted-foreground hidden sm:block">Real-time traffic & alerts</div>
            </div>
          </Button>

          {!isIOS && !isAndroid && (
            <Button
              onClick={handleWebMaps}
              variant="outline"
              className="w-full justify-start gap-2 sm:gap-3 h-auto py-3 sm:py-4 hover:bg-accent"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-lg sm:text-xl">
                💻
              </div>
              <div className="text-left min-w-0">
                <div className="font-medium text-sm sm:text-base">Open in Browser</div>
                <div className="text-xs text-muted-foreground hidden sm:block">Web-based navigation</div>
              </div>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  return createPortal(content, document.body);
};

export default GpsAppSelector;
