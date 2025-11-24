import { X, Navigation } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { createPortal } from 'react-dom';
import { useToast } from '@/hooks/use-toast';

interface GpsAppSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  locationName: string;
  latitude: number;
  longitude: number;
}

const GpsAppSelector = ({ isOpen, onClose, locationName, latitude, longitude }: GpsAppSelectorProps) => {
  const { toast } = useToast();
  
  if (!isOpen) return null;

  const encodedName = encodeURIComponent(locationName);
  
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  const openExternalUrl = (url: string) => {
    try {
      // Try to break out of iframe for preview environment
      if (window.top && window.top !== window.self) {
        window.top.open(url, '_blank');
      } else {
        window.open(url, '_blank');
      }
    } catch (e) {
      // Fallback if cross-origin restrictions prevent iframe access
      window.open(url, '_blank');
    }
  };

  const handleAppleMaps = () => {
    const mapsUrl = `https://maps.apple.com/?daddr=${latitude},${longitude}&q=${encodedName}`;
    openExternalUrl(mapsUrl);
    toast({
      title: "Opening Apple Maps",
      description: "If the app doesn't open, copy the coordinates manually",
    });
    onClose();
  };

  const handleGoogleMaps = () => {
    const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=walking`;
    openExternalUrl(googleUrl);
    toast({
      title: "Opening Google Maps",
      description: "Your navigation will open in a new tab",
    });
    onClose();
  };

  const handleWaze = () => {
    const wazeUrl = `https://www.waze.com/ul?ll=${latitude},${longitude}&navigate=yes&q=${encodedName}`;
    openExternalUrl(wazeUrl);
    toast({
      title: "Opening Waze",
      description: "If Waze is installed, it will open automatically",
    });
    onClose();
  };

  const handleWebMaps = () => {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    openExternalUrl(mapsUrl);
    toast({
      title: "Opening Maps",
      description: "Your navigation will open in a new tab",
    });
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
