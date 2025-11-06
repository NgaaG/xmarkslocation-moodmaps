import { useState, useEffect } from 'react';
import { X, Music, Sparkles, Navigation, Plus, HelpCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type Spot, getCategoryLabel, type SpotCategory, type Playlist } from '@/data/spots';
import MoodVisualizer from './MoodVisualizer';
import SpotDetailsTutorial from './SpotDetailsTutorial';
import GpsAppSelector from './GpsAppSelector';

interface SpotDetailsModalProps {
  spot: Spot;
  onClose: () => void;
}

const HELP_CLICKED_SPOT_KEY = 'help-spot-details-clicked';

const SpotDetailsModal = ({ spot, onClose }: SpotDetailsModalProps) => {
  const [selectedPlaylistCategory, setSelectedPlaylistCategory] = useState<SpotCategory | null>(null);
  const [playlistOpened, setPlaylistOpened] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [showHelpHighlight, setShowHelpHighlight] = useState(false);
  const [gpsAppSelectorOpen, setGpsAppSelectorOpen] = useState(false);
  
  // Check if help icon should be highlighted
  useEffect(() => {
    const hasClicked = localStorage.getItem(HELP_CLICKED_SPOT_KEY);
    setShowHelpHighlight(!hasClicked);
  }, []);
  
  // Clear previous location data when a new location is selected
  useEffect(() => {
    localStorage.removeItem('selectedPlaylistCategory');
    localStorage.removeItem('selectedSpotifyPlaylistName');
    localStorage.removeItem('selectedLocationTitle');
    localStorage.removeItem('spotifyPlaylistActive');
    
    // Reset playlist opened state
    setPlaylistOpened(false);
    
    // Dispatch event to reset mood visualizer
    window.dispatchEvent(new CustomEvent('locationChanged'));
  }, [spot.id]);

  const filteredPlaylists = selectedPlaylistCategory
    ? spot.playlists.filter(p => p.category === selectedPlaylistCategory)
    : spot.playlists;

  const categories: SpotCategory[] = ['peaceful', 'social', 'scenic'];

  const handleNavigate = () => {
    setGpsAppSelectorOpen(true);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 w-[95vw] sm:w-full">
        {/* Header Image */}
        <div className="relative h-40 sm:h-48 w-full">
          <img 
            src={spot.image} 
            alt={spot.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsTutorialOpen(true);
                setShowHelpHighlight(false);
                localStorage.setItem(HELP_CLICKED_SPOT_KEY, 'true');
              }}
              className={`rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90 ${
                showHelpHighlight ? 'help-icon-pulse' : ''
              }`}
              aria-label="Open help guide"
            >
              <HelpCircle className={`h-5 w-5 ${showHelpHighlight ? 'font-bold' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <DialogTitle className="text-xl sm:text-2xl font-semibold">
                {spot.name}
              </DialogTitle>
              <Badge className="capitalize shrink-0 text-xs sm:text-sm">
                {getCategoryLabel(spot.category)}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm sm:text-base mt-2">
              {spot.description}
            </p>
          </DialogHeader>

          {/* Navigation Button */}
          <Button 
            onClick={handleNavigate}
            disabled={!playlistOpened}
            className="w-full gap-2 transition-opacity duration-250 ease-in-out text-sm sm:text-base"
            size="lg"
          >
            <Navigation className="w-4 h-4 sm:w-5 sm:h-5" />
            Navigate to Location
          </Button>

          {/* Tabs */}
          <Tabs defaultValue="playlists" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="playlists" className="gap-2">
                <Music className="w-4 h-4" />
                Playlists
              </TabsTrigger>
              <TabsTrigger value="visualizer" className="gap-2">
                <Sparkles className="w-4 h-4" />
                Mood Visualizer
              </TabsTrigger>
            </TabsList>

            <TabsContent value="playlists" className="space-y-4 mt-4">
              {/* Playlist Filter */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Filter Playlists:
                </h3>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  <Button
                    variant={selectedPlaylistCategory === null ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedPlaylistCategory(null)}
                    className="rounded-full"
                  >
                    All
                  </Button>
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedPlaylistCategory === category ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedPlaylistCategory(category)}
                      className="rounded-full capitalize"
                    >
                      {getCategoryLabel(category)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Spotify Playlists */}
              <div className="space-y-4">
                {filteredPlaylists.map((playlist) => (
                  <div key={playlist.id} className="space-y-2 relative group">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{playlist.name}</h4>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          // Store exact playlist data for accurate syncing with its specific category
                          localStorage.setItem('selectedPlaylistCategory', playlist.category);
                          localStorage.setItem('selectedSpotifyPlaylistName', playlist.name);
                          localStorage.setItem('selectedLocationTitle', spot.name);
                          localStorage.setItem('spotifyPlaylistActive', 'true');
                          
                          // Enable navigation button
                          setPlaylistOpened(true);
                          
                          // Dispatch custom event with playlist-specific category for instant update
                          window.dispatchEvent(new CustomEvent('spotifyPlaylistSelected', {
                            detail: { 
                              category: playlist.category,
                              playlistName: playlist.name,
                              locationName: spot.name
                            }
                          }));
                          
                          // Dispatch tutorial event when Spotify is opened
                          window.dispatchEvent(new CustomEvent('tutorial-spotify-open'));
                          
                          const spotifyAppUrl = playlist.spotifyUrl.replace('/embed/', '/');
                          window.open(spotifyAppUrl, '_blank');
                        }}
                      >
                        <Plus className="w-4 h-4" />
                        Open in Spotify
                      </Button>
                    </div>
                     <div className="aspect-[16/9] w-full rounded-lg overflow-hidden bg-muted">
                      <iframe
                        src={playlist.spotifyUrl}
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                        title={playlist.name}
                        onLoad={() => {
                          // Dispatch tutorial event when playlist is loaded/previewed
                          window.dispatchEvent(new CustomEvent('tutorial-playlist-preview'));
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="visualizer" className="mt-4">
              <div className="h-[400px]">
                <MoodVisualizer category={spot.category} isPlaying={true} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
      
      <SpotDetailsTutorial isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />
      <GpsAppSelector 
        isOpen={gpsAppSelectorOpen}
        onClose={() => setGpsAppSelectorOpen(false)}
        locationName={spot.name}
        latitude={spot.latitude}
        longitude={spot.longitude}
      />
    </Dialog>
  );
};

export default SpotDetailsModal;
