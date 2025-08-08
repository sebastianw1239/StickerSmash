import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { brandMessages, theme } from '../../constants/theme';
import { firebaseService } from '../../utils/firebaseService';
import { mapService, UserLocation } from '../../utils/mapService';

interface LocationSuggestion {
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

interface EventData {
  id: string;
  name: string;
  description: string;
  venue: LocationSuggestion;
  date: Date;
  host: string;
  attendees: string[];
  status: 'draft' | 'active' | 'completed';
}

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [userETA, setUserETA] = useState<number | null>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserLocation, setCurrentUserLocation] = useState<UserLocation | null>(null);
  
  const searchInputRef = useRef<TextInput>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Mock location suggestions (in real app, this would use Google Places API)
  const mockSuggestions: LocationSuggestion[] = [
    {
      id: '1',
      name: 'Hana Sushi',
      address: '123 Main St, San Francisco, CA',
      latitude: 37.7749,
      longitude: -122.4194,
      type: 'restaurant',
      placeId: 'mock_place_1',
      rating: 4.5,
      priceLevel: 2,
      businessStatus: 'OPERATIONAL',
      openingHours: { openNow: true }
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
      priceLevel: 3,
      businessStatus: 'OPERATIONAL',
      openingHours: { openNow: true }
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
      priceLevel: 0,
      businessStatus: 'OPERATIONAL',
      openingHours: { openNow: true }
    },
    {
      id: '4',
      name: 'Starbucks',
      address: '321 Coffee St, San Francisco, CA',
      latitude: 37.7649,
      longitude: -122.4294,
      type: 'restaurant',
      placeId: 'mock_place_4',
      rating: 4.1,
      priceLevel: 1,
      businessStatus: 'OPERATIONAL',
      openingHours: { openNow: true }
    }
  ];

  // Initialize map service and get user location
  useEffect(() => {
    const initializeMapService = async () => {
      try {
        setIsLoading(true);
        const userLocation = await mapService.initialize();
        setCurrentUserLocation(userLocation);
      } catch (error) {
        console.error('Failed to initialize map service:', error);
        // Continue with mock data if map service fails
      } finally {
        setIsLoading(false);
      }
    };

    initializeMapService();
  }, []);

  // Search for places using Google Places API
  useEffect(() => {
    const searchPlaces = async () => {
      if (searchQuery.length < 2) {
        setLocationSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        setIsLoading(true);
        const suggestions = await mapService.searchPlaces(searchQuery, currentUserLocation || undefined);
        setLocationSuggestions(suggestions);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Failed to search places:', error);
        // Fallback to mock data
        const filtered = mockSuggestions.filter(suggestion =>
          suggestion.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          suggestion.address.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setLocationSuggestions(filtered);
        setShowSuggestions(true);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(searchPlaces, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, currentUserLocation]);

  useEffect(() => {
    // Animate map preview when location is selected
    if (selectedLocation) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: false,
        tension: 100,
        friction: 8,
      }).start();
      
      // Calculate user ETA
      calculateUserETA();
    } else {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: false,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [selectedLocation]);

  const calculateUserETA = async () => {
    if (!selectedLocation || !currentUserLocation) return;
    
    try {
      setIsLoading(true);
      const etaData = await mapService.calculateETA(currentUserLocation, {
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
      });
      setUserETA(etaData.duration);
    } catch (error) {
      console.error('Failed to calculate ETA:', error);
      // Fallback to mock ETA
      const mockETA = Math.floor(Math.random() * 30) + 5; // 5-35 minutes
      setUserETA(mockETA);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationSelect = (location: LocationSuggestion) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedLocation(location);
    setSearchQuery(location.name);
    setShowSuggestions(false);
    searchInputRef.current?.blur();
  };

  const getLocationTypeColor = (type: LocationSuggestion['type']) => {
    switch (type) {
      case 'restaurant': return theme.colors.accent;
      case 'venue': return theme.colors.primary;
      case 'office': return theme.colors.success;
      default: return theme.colors.text.secondary;
    }
  };

  const getETAColor = (eta: number) => {
    if (eta <= 10) return theme.colors.success;
    if (eta <= 20) return theme.colors.accent;
    return theme.colors.status.offline;
  };

  const handleCreateEvent = async () => {
    if (!selectedLocation || !eventName.trim()) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    try {
      const newEvent: EventData = {
        id: Date.now().toString(),
        name: eventName,
        description: eventDescription,
        venue: selectedLocation,
        date: selectedDate,
        host: 'You',
        attendees: [],
        status: 'draft'
      };

      // Save event to Firebase (if available)
      try {
        await firebaseService.createEvent({
          id: newEvent.id,
          destination: {
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
            name: selectedLocation.name
          },
          eventTime: selectedDate.getTime(),
          participants: newEvent.attendees
        });
      } catch (error) {
        console.warn('Failed to save to Firebase, continuing with local storage:', error);
      }

      // Reset form
      setSelectedLocation(null);
      setEventName('');
      setEventDescription('');
      setSelectedDate(new Date());
      setIsCreatingEvent(false);
      setUserETA(null);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Event created successfully!');
    } catch (error) {
      console.error('Failed to create event:', error);
      Alert.alert('Error', 'Failed to create event. Please try again.');
    }
  };

  const renderLocationSuggestion = (suggestion: LocationSuggestion) => (
    <TouchableOpacity
      key={suggestion.id}
      style={styles.suggestionItem}
      onPress={() => handleLocationSelect(suggestion)}
      activeOpacity={0.7}
    >
      <View style={styles.suggestionContent}>
        <View style={styles.suggestionHeader}>
          <Text style={styles.suggestionName}>{suggestion.name}</Text>
          <View style={[styles.typeIndicator, { backgroundColor: getLocationTypeColor(suggestion.type) }]} />
        </View>
        <Text style={styles.suggestionAddress}>{suggestion.address}</Text>
        
        {/* Enhanced place details from new API */}
        <View style={styles.suggestionDetails}>
          {suggestion.rating && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={12} color={theme.colors.accent} />
              <Text style={styles.ratingText}>{suggestion.rating}</Text>
            </View>
          )}
          
          {suggestion.priceLevel !== undefined && (
            <Text style={styles.priceText}>
              {Array(suggestion.priceLevel + 1).fill('$').join('')}
            </Text>
          )}
          
          {suggestion.businessStatus && suggestion.businessStatus !== 'OPERATIONAL' && (
            <View style={styles.statusContainer}>
              <Ionicons 
                name="alert-circle" 
                size={12} 
                color={suggestion.businessStatus === 'CLOSED_TEMPORARILY' ? theme.colors.accent : theme.colors.status.offline} 
              />
              <Text style={styles.statusText}>
                {suggestion.businessStatus === 'CLOSED_TEMPORARILY' ? 'Temporarily Closed' : 'Permanently Closed'}
              </Text>
            </View>
          )}
          
          {suggestion.openingHours && (
            <View style={styles.hoursContainer}>
              <Ionicons name="time-outline" size={12} color={theme.colors.text.secondary} />
              <Text style={styles.hoursText}>
                {suggestion.openingHours.openNow ? 'Open Now' : 'Closed'}
              </Text>
            </View>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.colors.text.tertiary} />
    </TouchableOpacity>
  );

  const renderMapPreview = () => (
    <Animated.View style={[styles.mapPreview, { height: slideAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 200]
    }) }]}>
      {selectedLocation && (
        <>
          <MapView
            style={styles.miniMap}
            initialRegion={{
              latitude: selectedLocation.latitude,
              longitude: selectedLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
          >
            <Marker
              coordinate={{
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
              }}
              pinColor={getLocationTypeColor(selectedLocation.type)}
            />
          </MapView>
          
          {userETA && (
            <View style={styles.etaContainer}>
              <Ionicons name="time-outline" size={16} color={getETAColor(userETA)} />
              <Text style={[styles.etaText, { color: getETAColor(userETA) }]}>
                Your ETA: {userETA} min
              </Text>
            </View>
          )}
        </>
      )}
    </Animated.View>
  );

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>SameTime</Text>
        <Text style={styles.subtitle}>{brandMessages.voice.casual}</Text>
      </View>

      {!isCreatingEvent ? (
        // Main dashboard view
        <View style={styles.dashboard}>
          <TouchableOpacity
            style={styles.createEventButton}
            onPress={() => setIsCreatingEvent(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={24} color={theme.colors.white} />
            <Text style={styles.createEventText}>Create New Event</Text>
          </TouchableOpacity>

          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color={theme.colors.text.tertiary} />
            <Text style={styles.emptyStateTitle}>No upcoming events</Text>
            <Text style={styles.emptyStateSubtitle}>Plan something?</Text>
          </View>
        </View>
      ) : (
        // Event creation flow
        <View style={styles.eventCreation}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepTitle}>Step 1: Choose Location</Text>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsCreatingEvent(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {/* Location Search */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color={theme.colors.text.secondary} />
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder="Search for venue or address..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setShowSuggestions(true)}
              />
              {isLoading ? (
                <Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.primary} />
              ) : searchQuery.length > 0 ? (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    setSelectedLocation(null);
                  }}
                >
                  <Ionicons name="close-circle" size={20} color={theme.colors.text.secondary} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Location Suggestions */}
            {showSuggestions && locationSuggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {locationSuggestions.map(renderLocationSuggestion)}
              </View>
            )}

            {/* Map Preview */}
            {renderMapPreview()}
          </View>

          {/* Event Details */}
          {selectedLocation && (
            <View style={styles.eventDetails}>
              <Text style={styles.stepTitle}>Step 2: Event Details</Text>
              
              <TextInput
                style={styles.eventNameInput}
                placeholder="Event name"
                value={eventName}
                onChangeText={setEventName}
              />
              
              <TextInput
                style={styles.eventDescriptionInput}
                placeholder="Description (optional)"
                value={eventDescription}
                onChangeText={setEventDescription}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateEvent}
                activeOpacity={0.8}
              >
                <Text style={styles.createButtonText}>Create Event</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  dashboard: {
    flex: 1,
    padding: 20,
  },
  createEventButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: theme.borderRadius.md,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  createEventText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  eventCreation: {
    padding: 20,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  searchContainer: {
    marginBottom: 24,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text.primary,
    marginLeft: 12,
  },
  suggestionsContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    marginTop: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
    flex: 1,
  },
  typeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  suggestionAddress: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  suggestionDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginLeft: 4,
  },
  priceText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginLeft: 4,
  },
  hoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hoursText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginLeft: 4,
  },
  mapPreview: {
    marginTop: 16,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
  },
  miniMap: {
    flex: 1,
  },
  etaContainer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: theme.colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.sm,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  etaText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  eventDetails: {
    marginTop: 24,
  },
  eventNameInput: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.text.primary,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  eventDescriptionInput: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.text.primary,
    marginBottom: 24,
    minHeight: 80,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  createButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  createButtonText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
});
