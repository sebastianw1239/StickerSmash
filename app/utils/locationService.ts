import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
}

export interface ETAData {
  eta: number; // in minutes
  distance: number; // in meters
  timestamp: number;
  source: 'local' | 'api';
}

export interface EventData {
  id: string;
  destination: {
    latitude: number;
    longitude: number;
    name: string;
  };
  eventTime: number; // timestamp
  participants: string[];
}

class LocationService {
  private currentLocation: LocationData | null = null;
  private lastAPIETA: ETAData | null = null;
  private pollingIntervals: { [eventId: string]: NodeJS.Timeout } = {};
  private uploadIntervals: { [eventId: string]: NodeJS.Timeout } = {};
  private isPolling = false;

  // Adaptive polling intervals based on time to event
  private getPollingInterval(eventTime: number): number {
    const now = Date.now();
    const timeToEvent = eventTime - now;
    const hoursToEvent = timeToEvent / (1000 * 60 * 60);

    if (hoursToEvent <= 0.17) { // 10 minutes or less
      return 2 * 60 * 1000; // 2 minutes
    } else if (hoursToEvent <= 1) { // 1 hour or less
      return 5 * 60 * 1000; // 5 minutes
    } else if (hoursToEvent <= 4) { // 4 hours or less
      return 10 * 60 * 1000; // 10 minutes
    } else {
      return 30 * 60 * 1000; // 30 minutes
    }
  }

  // Local ETA calculation using Haversine formula
  private calculateLocalETA(location: LocationData, destination: { latitude: number; longitude: number }): ETAData {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = location.latitude * Math.PI / 180;
    const φ2 = destination.latitude * Math.PI / 180;
    const Δφ = (destination.latitude - location.latitude) * Math.PI / 180;
    const Δλ = (destination.longitude - location.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c; // in meters
    
    // Rough ETA calculation (assume average speed of 30 km/h in city)
    const averageSpeed = 30 * 1000 / 3600; // 30 km/h in m/s
    const etaMinutes = Math.max(1, Math.round(distance / averageSpeed / 60));

    return {
      eta: etaMinutes,
      distance: Math.round(distance),
      timestamp: Date.now(),
      source: 'local'
    };
  }

  // API-based ETA calculation (placeholder for Google Maps/Mapbox integration)
  private async getAPIETA(location: LocationData, destination: { latitude: number; longitude: number }): Promise<ETAData> {
    // TODO: Implement Google Maps Directions API call
    // For now, return a more accurate local calculation
    const localETA = this.calculateLocalETA(location, destination);
    
    // Simulate API response with slight variation
    const apiETA: ETAData = {
      eta: localETA.eta + Math.floor(Math.random() * 5) - 2, // ±2 minutes variation
      distance: localETA.distance,
      timestamp: Date.now(),
      source: 'api'
    };

    return apiETA;
  }

  // Check if API correction is needed
  private shouldUseAPI(localETA: ETAData, eventTime: number): boolean {
    const timeToEvent = eventTime - Date.now();
    const hoursToEvent = timeToEvent / (1000 * 60 * 60);
    
    // Use API if:
    // 1. Event is within 1 hour
    // 2. Local ETA deviates from last API ETA by more than 2 minutes
    if (hoursToEvent <= 1 && this.lastAPIETA) {
      const deviation = Math.abs(localETA.eta - this.lastAPIETA.eta);
      return deviation > 2;
    }
    
    // Use API for adaptive intervals
    return hoursToEvent <= 4;
  }

  // Start polling for an event
  async startPolling(eventData: EventData): Promise<void> {
    if (this.pollingIntervals[eventData.id]) {
      console.log(`Polling already active for event ${eventData.id}`);
      return;
    }

    // Request location permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission denied');
    }

    this.isPolling = true;
    
    // Start local polling every 30 seconds
    this.pollingIntervals[eventData.id] = setInterval(async () => {
      await this.performLocationUpdate(eventData);
    }, 30 * 1000);

    // Start upload interval (every 2-5 minutes)
    this.uploadIntervals[eventData.id] = setInterval(async () => {
      await this.uploadToServer(eventData.id);
    }, 3 * 60 * 1000); // 3 minutes

    console.log(`Started polling for event ${eventData.id}`);
  }

  // Stop polling for an event
  stopPolling(eventId: string): void {
    if (this.pollingIntervals[eventId]) {
      clearInterval(this.pollingIntervals[eventId]);
      delete this.pollingIntervals[eventId];
    }
    
    if (this.uploadIntervals[eventId]) {
      clearInterval(this.uploadIntervals[eventId]);
      delete this.uploadIntervals[eventId];
    }

    console.log(`Stopped polling for event ${eventId}`);
  }

  // Perform location update with hybrid local/API logic
  private async performLocationUpdate(eventData: EventData): Promise<void> {
    try {
      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      this.currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
        accuracy: location.coords.accuracy,
      };

      // Calculate local ETA
      const localETA = this.calculateLocalETA(this.currentLocation, eventData.destination);

      // Determine if we need API correction
      const shouldUseAPI = this.shouldUseAPI(localETA, eventData.eventTime);
      
      let finalETA: ETAData;
      
      if (shouldUseAPI) {
        try {
          finalETA = await this.getAPIETA(this.currentLocation, eventData.destination);
          this.lastAPIETA = finalETA;
          console.log(`API ETA: ${finalETA.eta} minutes`);
        } catch (error) {
          console.warn('API call failed, using local ETA:', error);
          finalETA = localETA;
        }
      } else {
        finalETA = localETA;
        console.log(`Local ETA: ${finalETA.eta} minutes`);
      }

      // Store ETA data for upload
      this.storeETAData(eventData.id, finalETA);

    } catch (error) {
      console.error('Location update failed:', error);
    }
  }

  // Store ETA data for batch upload
  private storeETAData(eventId: string, etaData: ETAData): void {
    // TODO: Implement local storage for batch upload
    // For now, just log the data
    console.log(`Stored ETA for event ${eventId}:`, etaData);
  }

  // Upload data to server
  private async uploadToServer(eventId: string): Promise<void> {
    try {
      const { firebaseService } = await import('./firebaseService');
      
      if (this.currentLocation && this.lastAPIETA) {
        await firebaseService.uploadLocationData(eventId, this.currentLocation, this.lastAPIETA);
        await firebaseService.updateUserETA(eventId, this.lastAPIETA);
      }
    } catch (error) {
      console.error('Failed to upload to server:', error);
    }
  }

  // Get current location
  async getCurrentLocation(): Promise<LocationData | null> {
    return this.currentLocation;
  }

  // Get current ETA for an event
  async getCurrentETA(eventId: string): Promise<ETAData | null> {
    // TODO: Implement retrieval from local storage or server
    return this.lastAPIETA;
  }

  // Check if polling is active
  isPollingActive(eventId: string): boolean {
    return !!this.pollingIntervals[eventId];
  }

  // Clean up all polling
  cleanup(): void {
    Object.keys(this.pollingIntervals).forEach(eventId => {
      this.stopPolling(eventId);
    });
    this.isPolling = false;
  }
}

export const locationService = new LocationService(); 