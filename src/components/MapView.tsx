import { useState, useEffect } from 'react';
import { spots, getCategoryColor, type Spot } from '@/data/spots';
import FilterBar from './FilterBar';
import SpotDetailsModal from './SpotDetailsModal';
import LeafletMap from './LeafletMap';

interface MapViewProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  mapMode: 'campus' | 'nationwide' | 'global';
  helpButton?: React.ReactNode;
}

const MapView = ({ selectedCategory, onCategoryChange, mapMode, helpButton }: MapViewProps) => {
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [userLocationSpots, setUserLocationSpots] = useState<Spot[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Calculate distance between two coordinates in kilometers
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Get user location and generate spots for nationwide/global modes
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          
          // Only generate nearby spots for nationwide/global modes
          if (mapMode === 'nationwide' || mapMode === 'global') {
            
            // Generate 6 nearby spots (2 per category) with realistic outdoor location names
            const generatedSpots: Spot[] = [
              // Peaceful locations
              {
                id: 'nearby-peaceful-1',
                name: 'Botanical Garden',
                description: 'A serene botanical sanctuary with carefully curated plant collections, ideal for meditation and quiet contemplation.',
                category: 'peaceful',
                latitude: latitude + 0.003,
                longitude: longitude + 0.003,
                image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&auto=format&fit=crop',
                playlists: [
                  {
                    id: 'p1',
                    name: 'Garden Serenity',
                    spotifyUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX4PP3DA4J0N8',
                    category: 'peaceful'
                  },
                  {
                    id: 'p2',
                    name: 'Nature Sounds',
                    spotifyUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DWZd79rJ6a7lp',
                    category: 'peaceful'
                  }
                ]
              },
              {
                id: 'nearby-peaceful-2',
                name: 'Memorial Park',
                description: 'A tranquil memorial park with reflective pathways and peaceful garden spaces, perfect for mindful walks.',
                category: 'peaceful',
                latitude: latitude + 0.0015,
                longitude: longitude - 0.002,
                image: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800&auto=format&fit=crop',
                playlists: [
                  {
                    id: 'p3',
                    name: 'Classical Focus',
                    spotifyUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DWWEJlAGA9gs0',
                    category: 'peaceful'
                  },
                  {
                    id: 'p4',
                    name: 'Museum Ambience',
                    spotifyUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX0XUfTFmNBRM',
                    category: 'peaceful'
                  }
                ]
              },
              // Social locations
              {
                id: 'nearby-social-1',
                name: 'Market Square',
                description: 'A lively public square with outdoor cafés and bustling market stalls, ideal for people-watching and socializing.',
                category: 'social',
                latitude: latitude - 0.002,
                longitude: longitude + 0.0025,
                image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop',
                playlists: [
                  {
                    id: 'p5',
                    name: 'Coffee Shop Vibes',
                    spotifyUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX4pUKG1kS0Ac',
                    category: 'social'
                  },
                  {
                    id: 'p6',
                    name: 'Social Gathering',
                    spotifyUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DWSf2RDTDayIx',
                    category: 'social'
                  }
                ]
              },
              {
                id: 'nearby-social-2',
                name: 'Riverside Promenade',
                description: 'A vibrant waterfront walkway with street performers and outdoor seating areas, great for connecting with others.',
                category: 'social',
                latitude: latitude - 0.001,
                longitude: longitude - 0.0015,
                image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&auto=format&fit=crop',
                playlists: [
                  {
                    id: 'p7',
                    name: 'Shopping Beats',
                    spotifyUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DWZeKCadgRdKQ',
                    category: 'social'
                  },
                  {
                    id: 'p8',
                    name: 'Urban Energy',
                    spotifyUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX4pUKG1kS0Ac',
                    category: 'social'
                  }
                ]
              },
              // Scenic locations
              {
                id: 'nearby-scenic-1',
                name: 'Hilltop Viewpoint',
                description: 'An elevated scenic overlook offering breathtaking panoramic views of the surrounding landscape and city skyline.',
                category: 'scenic',
                latitude: latitude - 0.0025,
                longitude: longitude - 0.003,
                image: 'https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?w=800&auto=format&fit=crop',
                playlists: [
                  {
                    id: 'p9',
                    name: 'Epic Views',
                    spotifyUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX4sWSpwq3LiO',
                    category: 'scenic'
                  },
                  {
                    id: 'p10',
                    name: 'Adventure Time',
                    spotifyUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DWZeKCadgRdKQ',
                    category: 'scenic'
                  }
                ]
              },
              {
                id: 'nearby-scenic-2',
                name: 'Lakeside Trail',
                description: "A picturesque nature trail winding along the water's edge, offering stunning lake views and natural beauty.",
                category: 'scenic',
                latitude: latitude + 0.002,
                longitude: longitude - 0.0025,
                image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&auto=format&fit=crop',
                playlists: [
                  {
                    id: 'p11',
                    name: 'Sunset Chill',
                    spotifyUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX4pUKG1kS0Ac',
                    category: 'scenic'
                  },
                  {
                    id: 'p12',
                    name: 'Lakeside Lounge',
                    spotifyUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DWSf2RDTDayIx',
                    category: 'scenic'
                  }
                ]
              }
            ];
            
            setUserLocationSpots(generatedSpots);
          }
        },
        (error) => {
          console.warn('Geolocation error:', error);
          // Keep empty array if geolocation fails
          setUserLocationSpots([]);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      // Clear user location spots when switching back to campus mode
      setUserLocationSpots([]);
    }
  }, [mapMode]);

  const displaySpots = (mapMode === 'nationwide' || mapMode === 'global') ? userLocationSpots : spots;
  
  // Sort spots by distance from user location (walking distance first)
  const sortedSpots = userLocation ? [...displaySpots].sort((a, b) => {
    const distanceA = calculateDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude);
    const distanceB = calculateDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude);
    return distanceA - distanceB;
  }) : displaySpots;
  
  const filteredSpots = selectedCategory
    ? sortedSpots.filter(spot => spot.category === selectedCategory)
    : sortedSpots;

  // Calculate map center based on spots
  const mapCenter: [number, number] = filteredSpots.length > 0
    ? [
        filteredSpots.reduce((sum, spot) => sum + spot.latitude, 0) / filteredSpots.length,
        filteredSpots.reduce((sum, spot) => sum + spot.longitude, 0) / filteredSpots.length,
      ]
    : mapMode === 'campus'
    ? [53.201370, 5.799130] // NHL Stenden Leeuwarden
    : [52.3676, 4.9041]; // Amsterdam default

  const mapZoom = mapMode === 'campus' ? 15 : mapMode === 'nationwide' ? 13 : 11;

  // Convert spots to markers for the map
  const markers = filteredSpots.map(spot => ({
    id: spot.id,
    position: [spot.latitude, spot.longitude] as [number, number],
    name: spot.name,
    color: getCategoryColor(spot.category),
    onClick: () => {
      setSelectedSpot(spot);
      window.dispatchEvent(new CustomEvent('tutorial-pin-click'));
    },
  }));

  return (
    <div className="relative h-full w-full">
      {/* Filter Bar with integrated help button */}
      <div className="absolute top-0 left-0 right-0 z-20">
        <FilterBar 
          selectedCategory={selectedCategory} 
          onCategoryChange={onCategoryChange}
          helpButton={helpButton}
        />
      </div>

      {/* Map Container */}
      <div className="absolute inset-0">
        <LeafletMap
          center={mapCenter}
          zoom={mapZoom}
          markers={markers}
        />
      </div>

      {/* Spot Details Modal */}
      {selectedSpot && (
        <SpotDetailsModal
          spot={selectedSpot}
          onClose={() => setSelectedSpot(null)}
        />
      )}
    </div>
  );
};

export default MapView;
