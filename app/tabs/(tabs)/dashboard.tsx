import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { brandMessages, theme } from '../../constants/theme';
import { firebaseService, UserLocation } from '../../utils/firebaseService';
import { EventData, locationService } from '../../utils/locationService';

import MapView, { Marker } from 'react-native-maps';

// Mock attendee data with coordinates
const initialAttendees = [
  { id: '1', name: 'Alice', latitude: 40.785091, longitude: -73.968285, color: '#3B2ED0' },
  { id: '2', name: 'Bob', latitude: 40.758896, longitude: -73.985130, color: '#E4572E' },
  { id: '3', name: 'Charlie', latitude: 40.748817, longitude: -73.985428, color: '#17B978' },
  { id: '4', name: 'You', latitude: 40.706086, longitude: -74.008584, color: '#FFC914' },
];

const DESTINATION = {
  latitude: 40.7614327, // Example: Central Park
  longitude: -73.9776216,
};

export default function Dashboard() {
  const [attendees, setAttendees] = useState(initialAttendees);
  const [realTimeLocations, setRealTimeLocations] = useState<UserLocation[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<EventData | null>(null);

  useEffect(() => {
    // Initialize Firebase service
    const initializeServices = async () => {
      try {
        await firebaseService.initialize();
        console.log('Firebase service initialized');
      } catch (error) {
        console.error('Failed to initialize Firebase:', error);
        // Continue without Firebase - the app can still work with mock data
      }
    };

    initializeServices();

    // Cleanup on unmount
    return () => {
      try {
        firebaseService.cleanup();
      } catch (error) {
        console.error('Firebase cleanup failed:', error);
      }
    };
  }, []);

  // Start tracking for an event
  const startEventTracking = async (eventData: EventData) => {
    try {
      await locationService.startPolling(eventData);
      setCurrentEvent(eventData);
      setIsTracking(true);
      
      // Subscribe to real-time location updates
      try {
        firebaseService.subscribeToEventLocations(eventData.id, (locations) => {
          setRealTimeLocations(locations);
        });
      } catch (firebaseError) {
        console.warn('Firebase subscription failed, continuing with mock data:', firebaseError);
        // Continue with mock data if Firebase fails
      }
      
      console.log('Started tracking event:', eventData.id);
    } catch (error) {
      console.error('Failed to start tracking:', error);
      Alert.alert('Error', 'Failed to start location tracking');
    }
  };

  // Stop tracking
  const stopEventTracking = async () => {
    if (currentEvent) {
      await firebaseService.stopEventTracking(currentEvent.id);
      setCurrentEvent(null);
      setIsTracking(false);
      setRealTimeLocations([]);
    }
  };

  const handleMarkerPress = (location: UserLocation) => {
    const etaText = location.eta ? `${location.eta.eta} min` : '...';
    Alert.alert('Attendee', `User ${location.userId}\nETA: ${etaText} to destination`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Real-Time Sync</Text>
      <Text style={styles.subtitle}>{brandMessages.voice.together}</Text>
      
      {/* Tracking Controls */}
      <View style={styles.controls}>
        {!isTracking ? (
          <TouchableOpacity 
            style={styles.startButton}
            onPress={() => {
              // Create a sample event for testing
              const sampleEvent: EventData = {
                id: 'test-event-' + Date.now(),
                destination: {
                  latitude: 40.7614327,
                  longitude: -73.9776216,
                  name: 'Central Park'
                },
                eventTime: Date.now() + 2 * 60 * 60 * 1000, // 2 hours from now
                participants: ['user1', 'user2', 'user3']
              };
              startEventTracking(sampleEvent);
            }}
          >
            <Text style={styles.buttonText}>Start Sync</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.stopButton}
            onPress={stopEventTracking}
          >
            <Text style={styles.buttonText}>Stop Sync</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Status */}
      <Text style={styles.status}>
        {isTracking ? `${brandMessages.copy.tracking}: ${realTimeLocations.length} participants` : 'Ready to sync'}
      </Text>
      
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 40.758896,
          longitude: -73.985130,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        {/* Destination marker */}
        <Marker
          coordinate={DESTINATION}
          pinColor={theme.colors.primary}
          title="Destination"
        />
        {/* Real-time attendee markers */}
        {realTimeLocations.map((location) => (
          <Marker
            key={location.userId}
            coordinate={{ 
              latitude: location.location.latitude, 
              longitude: location.location.longitude 
            }}
            pinColor={theme.colors.accent}
            title={`User ${location.userId}`}
            description={`ETA: ${location.eta?.eta || '...'} min to destination`}
            onPress={() => handleMarkerPress(location)}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.secondary,
    alignItems: 'center',
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginBottom: 24,
  },
  map: {
    width: 320,
    height: 320,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
  },

  controls: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  startButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  stopButton: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: theme.colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  status: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 16,
    textAlign: 'center',
  },
});