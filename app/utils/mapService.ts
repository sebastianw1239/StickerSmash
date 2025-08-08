import axios from 'axios';
import * as Location from 'expo-location';
import { GOOGLE_MAPS_CONFIG } from '../config/googleMaps';

// Google Maps API configuration
const GOOGLE_MAPS_API_KEY = GOOGLE_MAPS_CONFIG.API_KEY;
const GOOGLE_PLACES_API_BASE = GOOGLE_MAPS_CONFIG.PLACES_API_BASE;
const GOOGLE_DIRECTIONS_API_BASE = GOOGLE_MAPS_CONFIG.DIRECTIONS_API_BASE;

export interface LocationSuggestion {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: 'restaurant' | 'venue' | 'office' | 'other';
  placeId: string;
  rating?: number;
  photos?: string[];
  // New Places API features
  businessStatus?: 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY';
  priceLevel?: number; // 0-4 scale
  openingHours?: {
    openNow: boolean;
    periods?: Array<{
      open: { day: number; time: string };
      close: { day: number; time: string };
    }>;
    weekdayText?: string[];
  };
  accessibility?: {
    wheelchairAccessible?: boolean;
    accessibleParking?: boolean;
  };
  features?: {
    delivery?: boolean;
    takeout?: boolean;
    dineIn?: boolean;
    reservable?: boolean;
    servesBreakfast?: boolean;
    servesLunch?: boolean;
    servesDinner?: boolean;
    outdoorSeating?: boolean;
    liveMusic?: boolean;
    parking?: boolean;
  };
  contact?: {
    phone?: string;
    website?: string;
  };
}

export interface ETAData {
  duration: number; // in minutes
  distance: number; // in meters
  trafficLevel: 'low' | 'medium' | 'high';
  route: {
    latitude: number;
    longitude: number;
  }[];
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

class MapService {
  private currentLocation: UserLocation | null = null;

  // Initialize the service and get user's current location
  async initialize(): Promise<UserLocation> {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
      });

      this.currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      };

      return this.currentLocation;
    } catch (error) {
      console.error('Failed to get current location:', error);
      throw error;
    }
  }

  // Search for places using Google Places API (New)
  async searchPlaces(query: string, location?: UserLocation): Promise<LocationSuggestion[]> {
    try {
      const searchLocation = location || this.currentLocation;
      
      if (!searchLocation) {
        throw new Error('No location available for search');
      }

      // Use the new Places API format
      console.log('🔍 Making Places API request:', {
        url: `${GOOGLE_PLACES_API_BASE}/places:searchText`,
        query,
        location: searchLocation,
        apiKey: GOOGLE_MAPS_API_KEY ? '✅ Set' : '❌ Missing'
      });

      const requestBody = {
        textQuery: query,
        maxResultCount: 20
      };

      console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));

      const response = await axios.post(`${GOOGLE_PLACES_API_BASE}/places:searchText`, requestBody, {
        headers: {
          'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.priceLevel,places.businessStatus,places.openingHours,places.photos,places.internationalPhoneNumber,places.websiteUri,places.accessibilityOptions,places.deliveryOptions,places.diningOptions,places.parkingOptions,places.liveMusic',
          'Content-Type': 'application/json',
        },
      });

      if (!response.data.places) {
        console.error('Places API response:', response.data);
        throw new Error(`Places API error: No places found in response`);
      }

      return response.data.places.map((place: any) => ({
        id: place.id || place.name?.text || `place_${Date.now()}`,
        name: place.displayName?.text || place.name?.text || 'Unknown Place',
        address: place.formattedAddress || 'Address not available',
        latitude: place.location?.latitude || 0,
        longitude: place.location?.longitude || 0,
        type: this.categorizePlaceType(place.types || []),
        placeId: place.id || place.name?.text || `place_${Date.now()}`,
        rating: place.rating,
        businessStatus: place.businessStatus,
        priceLevel: place.priceLevel,
        openingHours: place.openingHours ? {
          openNow: place.openingHours.openNow,
          periods: place.openingHours.periods,
          weekdayText: place.openingHours.weekdayText,
        } : undefined,
        accessibility: {
          wheelchairAccessible: place.accessibilityOptions?.wheelchairAccessibleEntrance,
          accessibleParking: place.accessibilityOptions?.accessibleParking,
        },
        features: {
          delivery: place.deliveryOptions?.delivery,
          takeout: place.deliveryOptions?.takeout,
          dineIn: place.deliveryOptions?.dineIn,
          reservable: place.diningOptions?.reservable,
          servesBreakfast: place.diningOptions?.servesBreakfast,
          servesLunch: place.diningOptions?.servesLunch,
          servesDinner: place.diningOptions?.servesDinner,
          outdoorSeating: place.diningOptions?.outdoorSeating,
          liveMusic: place.liveMusic,
          parking: place.parkingOptions?.parking,
        },
        contact: {
          phone: place.internationalPhoneNumber,
          website: place.websiteUri,
        },
        photos: place.photos?.map((photo: any) => 
          photo.name ? `https://places.googleapis.com/v1/${photo.name}/media?key=${GOOGLE_MAPS_API_KEY}&maxWidthPx=400` : null
        ).filter(Boolean),
      }));
    } catch (error) {
      console.error('Failed to search places:', error);
      if (error.response) {
        console.error('API Error Response:', JSON.stringify(error.response.data, null, 2));
        console.error('API Error Status:', error.response.status);
        console.error('API Error Headers:', error.response.headers);
      }
      // Fallback to mock data if API fails
      return this.getMockPlaces(query);
    }
  }

  // Get place details using Google Places API (New)
  async getPlaceDetails(placeId: string): Promise<LocationSuggestion | null> {
    try {
      const response = await axios.get(`${GOOGLE_PLACES_API_BASE}/places/${placeId}`, {
        headers: {
          'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask': 'displayName,formattedAddress,location,types,rating,priceLevel,businessStatus,openingHours,photos,internationalPhoneNumber,websiteUri,accessibilityOptions,deliveryOptions,diningOptions,parkingOptions,liveMusic',
        },
      });

      const place = response.data;
      return {
        id: place.id || place.name?.text || `place_${Date.now()}`,
        name: place.displayName?.text || place.name?.text || 'Unknown Place',
        address: place.formattedAddress || 'Address not available',
        latitude: place.location?.latitude || 0,
        longitude: place.location?.longitude || 0,
        type: this.categorizePlaceType(place.types || []),
        placeId: place.id || place.name?.text || `place_${Date.now()}`,
        rating: place.rating,
        businessStatus: place.businessStatus,
        priceLevel: place.priceLevel,
        openingHours: place.openingHours ? {
          openNow: place.openingHours.openNow,
          periods: place.openingHours.periods,
          weekdayText: place.openingHours.weekdayText,
        } : undefined,
        accessibility: {
          wheelchairAccessible: place.accessibilityOptions?.wheelchairAccessibleEntrance,
          accessibleParking: place.accessibilityOptions?.accessibleParking,
        },
        features: {
          delivery: place.deliveryOptions?.delivery,
          takeout: place.deliveryOptions?.takeout,
          dineIn: place.deliveryOptions?.dineIn,
          reservable: place.diningOptions?.reservable,
          servesBreakfast: place.diningOptions?.servesBreakfast,
          servesLunch: place.diningOptions?.servesLunch,
          servesDinner: place.diningOptions?.servesDinner,
          outdoorSeating: place.diningOptions?.outdoorSeating,
          liveMusic: place.liveMusic,
          parking: place.parkingOptions?.parking,
        },
        contact: {
          phone: place.internationalPhoneNumber,
          website: place.websiteUri,
        },
        photos: place.photos?.map((photo: any) => 
          photo.name ? `https://places.googleapis.com/v1/${photo.name}/media?key=${GOOGLE_MAPS_API_KEY}&maxWidthPx=400` : null
        ).filter(Boolean),
      };
    } catch (error) {
      console.error('Failed to get place details:', error);
      if (error.response) {
        console.error('API Error Response:', error.response.data);
        console.error('API Error Status:', error.response.status);
      }
      return null;
    }
  }

  // Calculate ETA using Google Directions API
  async calculateETA(
    origin: UserLocation,
    destination: { latitude: number; longitude: number }
  ): Promise<ETAData> {
    try {
      const response = await axios.get(`${GOOGLE_DIRECTIONS_API_BASE}/json`, {
        params: {
          origin: `${origin.latitude},${origin.longitude}`,
          destination: `${destination.latitude},${destination.longitude}`,
          mode: 'driving',
          traffic_model: 'best_guess',
          departure_time: 'now',
          key: GOOGLE_MAPS_API_KEY,
        },
      });

      if (response.data.status !== 'OK') {
        console.error('Directions API response:', response.data);
        if (response.data.status === 'REQUEST_DENIED') {
          throw new Error(`Directions API access denied. Please check:
1. APIs are enabled in Google Cloud Console (Places API, Directions API)
2. API key is not restricted too strictly
3. Billing is set up
4. API key is valid`);
        }
        throw new Error(`Directions API error: ${response.data.status} - ${response.data.error_message || 'Unknown error'}`);
      }

      const route = response.data.routes[0];
      const leg = route.legs[0];
      
      // Extract route points for map display
      const routePoints = this.decodePolyline(route.overview_polyline.points);

      return {
        duration: Math.round(leg.duration_in_traffic?.value / 60) || Math.round(leg.duration.value / 60),
        distance: leg.distance.value,
        trafficLevel: this.analyzeTrafficLevel(leg.duration_in_traffic?.value, leg.duration.value),
        route: routePoints,
      };
    } catch (error) {
      console.error('Failed to calculate ETA:', error);
      // Fallback to mock ETA
      return this.getMockETA();
    }
  }

  // Get current user location
  async getCurrentLocation(): Promise<UserLocation> {
    if (this.currentLocation) {
      return this.currentLocation;
    }
    return this.initialize();
  }

  // Update current location
  async updateCurrentLocation(): Promise<UserLocation> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 1000,
      });

      this.currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      };

      return this.currentLocation;
    } catch (error) {
      console.error('Failed to update location:', error);
      throw error;
    }
  }

  // Categorize place types from Google Places API
  private categorizePlaceType(types: string[]): LocationSuggestion['type'] {
    if (types.includes('restaurant') || types.includes('food')) {
      return 'restaurant';
    }
    if (types.includes('movie_theater') || types.includes('amusement_park') || 
        types.includes('stadium') || types.includes('museum')) {
      return 'venue';
    }
    if (types.includes('office') || types.includes('establishment')) {
      return 'office';
    }
    return 'other';
  }

  // Analyze traffic level based on duration differences
  private analyzeTrafficLevel(durationInTraffic?: number, duration?: number): 'low' | 'medium' | 'high' {
    if (!durationInTraffic || !duration) return 'low';
    
    const trafficRatio = durationInTraffic / duration;
    if (trafficRatio <= 1.1) return 'low';
    if (trafficRatio <= 1.3) return 'medium';
    return 'high';
  }

  // Decode Google's polyline format
  private decodePolyline(encoded: string): { latitude: number; longitude: number }[] {
    const points: { latitude: number; longitude: number }[] = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
      let shift = 0, result = 0;

      do {
        let b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (result >= 0x20);

      let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        let b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (result >= 0x20);

      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return points;
  }

  // Mock data fallbacks
  private getMockPlaces(query: string): LocationSuggestion[] {
    const mockPlaces: LocationSuggestion[] = [
      {
        id: '1',
        name: 'Hana Sushi',
        address: '123 Main St, San Francisco, CA',
        latitude: 37.7749,
        longitude: -122.4194,
        type: 'restaurant',
        placeId: 'mock_place_1',
        rating: 4.5,
      },
      {
        id: '2',
        name: 'AMC Metreon',
        address: '456 Cinema Ave, San Francisco, CA',
        latitude: 37.7849,
        longitude: -122.4094,
        type: 'venue',
        placeId: 'mock_place_2',
        rating: 4.2,
      },
      {
        id: '3',
        name: 'Central Park',
        address: '789 Park Ave, New York, NY',
        latitude: 40.7614,
        longitude: -73.9776,
        type: 'venue',
        placeId: 'mock_place_3',
        rating: 4.8,
      },
    ];

    return mockPlaces.filter(place =>
      place.name.toLowerCase().includes(query.toLowerCase()) ||
      place.address.toLowerCase().includes(query.toLowerCase())
    );
  }

  private getMockETA(): ETAData {
    return {
      duration: Math.floor(Math.random() * 30) + 5, // 5-35 minutes
      distance: Math.floor(Math.random() * 10000) + 1000, // 1-11km
      trafficLevel: 'low',
      route: [],
    };
  }

  // Set API key (call this before using the service)
  setApiKey(apiKey: string) {
    (this as any).GOOGLE_MAPS_API_KEY = apiKey;
  }
}

export const mapService = new MapService(); 