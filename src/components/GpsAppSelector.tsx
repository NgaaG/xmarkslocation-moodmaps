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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <Navigation className="w-5 h-5 text-primary" />
              Choose Navigation App
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
          <p className="text-sm text-muted-foreground mt-2">
            Navigate to <span className="font-medium text-foreground">{locationName}</span>
          </p>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {isIOS && (
            <Button
              onClick={handleAppleMaps}
              variant="outline"
              className="w-full justify-start gap-3 h-auto py-4 hover:bg-accent"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                🗺️
              </div>
              <div className="text-left">
                <div className="font-medium">Apple Maps</div>
                <div className="text-xs text-muted-foreground">Built-in iOS navigation</div>
              </div>
            </Button>
          )}

          <Button
            onClick={handleGoogleMaps}
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-4 hover:bg-accent"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              🌍
            </div>
            <div className="text-left">
              <div className="font-medium">Google Maps</div>
              <div className="text-xs text-muted-foreground">Walking, transit & driving directions</div>
            </div>
          </Button>

          <Button
            onClick={handleWaze}
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-4 hover:bg-accent"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              🚗
            </div>
            <div className="text-left">
              <div className="font-medium">Waze</div>
              <div className="text-xs text-muted-foreground">Real-time traffic & alerts</div>
            </div>
          </Button>

          {!isIOS && !isAndroid && (
            <Button
              onClick={handleWebMaps}
              variant="outline"
              className="w-full justify-start gap-3 h-auto py-4 hover:bg-accent"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                💻
              </div>
              <div className="text-left">
                <div className="font-medium">Open in Browser</div>
                <div className="text-xs text-muted-foreground">Web-based navigation</div>
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
