import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import React, { useRef, useState } from 'react';
import { Alert, Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { theme } from '../../constants/theme';

interface Event {
  id: string;
  title: string;
  description: string;
  host: string;
  venue: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  date: string;
  time: string;
  attendees: Attendee[];
  status: 'upcoming' | 'past' | 'hosted';
  rsvpStatus: 'accepted' | 'declined' | 'maybe' | 'pending';
}

interface Attendee {
  id: string;
  name: string;
  rsvpStatus: 'accepted' | 'declined' | 'maybe' | 'pending';
  eta?: number;
  avatar?: string;
}

const sampleEvents: Event[] = [
  {
    id: '1',
    title: 'Dinner at Hana Sushi',
    description: 'Celebrating Sarah\'s birthday with some amazing sushi!',
    host: 'Alex Chen',
    venue: {
      name: 'Hana Sushi',
      address: '123 Main St, San Francisco, CA',
      latitude: 37.7749,
      longitude: -122.4194,
    },
    date: 'Wed, Aug 7, 2025',
    time: '7:00 PM',
    status: 'upcoming',
    rsvpStatus: 'accepted',
    attendees: [
      { id: '1', name: 'Alex Chen', rsvpStatus: 'accepted', eta: 12 },
      { id: '2', name: 'Sarah Kim', rsvpStatus: 'accepted', eta: 8 },
      { id: '3', name: 'Mike Johnson', rsvpStatus: 'maybe', eta: 25 },
      { id: '4', name: 'Emma Davis', rsvpStatus: 'pending' },
    ],
  },
  {
    id: '2',
    title: 'Movie Night at AMC',
    description: 'Watching the new Marvel movie together!',
    host: 'You',
    venue: {
      name: 'AMC Metreon',
      address: '456 Cinema Ave, San Francisco, CA',
      latitude: 37.7849,
      longitude: -122.4094,
    },
    date: 'Fri, Aug 9, 2025',
    time: '8:30 PM',
    status: 'upcoming',
    rsvpStatus: 'accepted',
    attendees: [
      { id: '1', name: 'You', rsvpStatus: 'accepted', eta: 15 },
      { id: '2', name: 'David Wilson', rsvpStatus: 'accepted', eta: 5 },
      { id: '3', name: 'Lisa Brown', rsvpStatus: 'accepted', eta: 18 },
    ],
  },
  {
    id: '3',
    title: 'Team Lunch',
    description: 'Weekly team lunch at the office cafeteria',
    host: 'HR Team',
    venue: {
      name: 'Office Cafeteria',
      address: '789 Business Ave, San Francisco, CA',
      latitude: 37.7649,
      longitude: -122.4294,
    },
    date: 'Mon, Aug 5, 2025',
    time: '12:00 PM',
    status: 'past',
    rsvpStatus: 'accepted',
    attendees: [
      { id: '1', name: 'You', rsvpStatus: 'accepted' },
      { id: '2', name: 'John Smith', rsvpStatus: 'accepted' },
      { id: '3', name: 'Maria Garcia', rsvpStatus: 'accepted' },
    ],
  },
];

export default function EventsScreen() {
  const [events, setEvents] = useState<Event[]>(sampleEvents);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'upcoming' | 'past' | 'hosted'>('all');
  const animatedValues = useRef<{ [key: string]: Animated.Value }>({});

  // Initialize animated values for each event
  React.useEffect(() => {
    events.forEach(event => {
      if (!animatedValues.current[event.id]) {
        animatedValues.current[event.id] = new Animated.Value(0);
      }
    });
  }, [events]);

  const handleEventPress = (eventId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (expandedEvent === eventId) {
      // Collapse
      setExpandedEvent(null);
      Animated.spring(animatedValues.current[eventId], {
        toValue: 0,
        useNativeDriver: false,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      // Collapse previous if any
      if (expandedEvent !== null) {
        Animated.spring(animatedValues.current[expandedEvent], {
          toValue: 0,
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }).start();
      }
      
      // Expand new event
      setExpandedEvent(eventId);
      Animated.spring(animatedValues.current[eventId], {
        toValue: 1,
        useNativeDriver: false,
        tension: 100,
        friction: 8,
      }).start();
    }
  };

  const handleRSVP = (eventId: string, status: 'accepted' | 'declined' | 'maybe') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { ...event, rsvpStatus: status }
        : event
    ));
  };

  const handleOpenInMaps = (event: Event) => {
    const url = `https://maps.apple.com/?q=${encodeURIComponent(event.venue.address)}`;
    Linking.openURL(url);
  };

  const handleShareEvent = (event: Event) => {
    const shareText = `You're invited to: ${event.title}\n\n${event.description}\n\nHosted by: ${event.host}\nVenue: ${event.venue.name}\nDate: ${event.date} at ${event.time}\n\nJoin us on SameTime!`;
    
    Alert.alert(
      'Share Event',
      shareText,
      [
        { text: 'Copy Link', onPress: () => console.log('Copy link') },
        { text: 'Share', onPress: () => console.log('Share') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const getRSVPColor = (status: string) => {
    switch (status) {
      case 'accepted': return theme.colors.success;
      case 'maybe': return theme.colors.accent;
      case 'declined': return theme.colors.status.offline;
      default: return theme.colors.text.tertiary;
    }
  };

  const getETAColor = (eta: number) => {
    if (eta <= 10) return theme.colors.success;
    if (eta <= 20) return theme.colors.accent;
    return theme.colors.status.offline;
  };

  const filteredEvents = events.filter(event => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'upcoming') return event.status === 'upcoming';
    if (activeFilter === 'past') return event.status === 'past';
    if (activeFilter === 'hosted') return event.host === 'You';
    return true;
  });

  const renderEventCard = (event: Event) => {
    const isExpanded = expandedEvent === event.id;
    const animatedHeight = animatedValues.current[event.id]?.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 400], // Height when expanded
    }) || new Animated.Value(0);

    return (
      <View key={event.id} style={styles.eventCard}>
        {/* Event Header */}
        <TouchableOpacity
          style={styles.eventHeader}
          onPress={() => handleEventPress(event.id)}
          activeOpacity={0.7}
        >
          <View style={styles.eventHeaderContent}>
            <View style={styles.eventTitleRow}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <View style={[styles.statusIndicator, { backgroundColor: getRSVPColor(event.rsvpStatus) }]} />
            </View>
            <Text style={styles.eventDescription}>{event.description}</Text>
            <Text style={styles.eventHost}>Hosted by {event.host}</Text>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={theme.colors.text.secondary}
          />
        </TouchableOpacity>

        {/* RSVP Buttons */}
        <View style={styles.rsvpContainer}>
          <TouchableOpacity
            style={[styles.rsvpButton, event.rsvpStatus === 'accepted' && styles.rsvpButtonActive]}
            onPress={() => handleRSVP(event.id, 'accepted')}
          >
            <Text style={[styles.rsvpText, event.rsvpStatus === 'accepted' && styles.rsvpTextActive]}>
              Accept
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rsvpButton, event.rsvpStatus === 'maybe' && styles.rsvpButtonActive]}
            onPress={() => handleRSVP(event.id, 'maybe')}
          >
            <Text style={[styles.rsvpText, event.rsvpStatus === 'maybe' && styles.rsvpTextActive]}>
              Maybe
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rsvpButton, event.rsvpStatus === 'declined' && styles.rsvpButtonActive]}
            onPress={() => handleRSVP(event.id, 'declined')}
          >
            <Text style={[styles.rsvpText, event.rsvpStatus === 'declined' && styles.rsvpTextActive]}>
              Decline
            </Text>
          </TouchableOpacity>
        </View>

        {/* Expanded Content */}
        <Animated.View style={[styles.expandedContent, { height: animatedHeight }]}>
          <View style={styles.eventDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={16} color={theme.colors.text.secondary} />
              <Text style={styles.detailText}>{event.date} at {event.time}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={16} color={theme.colors.text.secondary} />
              <Text style={styles.detailText}>{event.venue.name}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Ionicons name="navigate-outline" size={16} color={theme.colors.text.secondary} />
              <Text style={styles.detailText}>{event.venue.address}</Text>
            </View>

            {/* Attendees */}
            <View style={styles.attendeesSection}>
              <Text style={styles.attendeesTitle}>Attendees ({event.attendees.length})</Text>
              {event.attendees.map(attendee => (
                <View key={attendee.id} style={styles.attendeeRow}>
                  <View style={styles.attendeeInfo}>
                    <Text style={styles.attendeeName}>{attendee.name}</Text>
                    <View style={[styles.attendeeStatus, { backgroundColor: getRSVPColor(attendee.rsvpStatus) }]} />
                  </View>
                  {attendee.eta && (
                    <Text style={[styles.attendeeETA, { color: getETAColor(attendee.eta) }]}>
                      {attendee.eta} min
                    </Text>
                  )}
                </View>
              ))}
            </View>

            {/* Map Preview */}
            <View style={styles.mapContainer}>
              <MapView
                style={styles.miniMap}
                initialRegion={{
                  latitude: event.venue.latitude,
                  longitude: event.venue.longitude,
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
                    latitude: event.venue.latitude,
                    longitude: event.venue.longitude,
                  }}
                  pinColor={theme.colors.primary}
                />
              </MapView>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleOpenInMaps(event)}
                activeOpacity={0.7}
              >
                <Ionicons name="map-outline" size={16} color={theme.colors.primary} />
                <Text style={styles.actionButtonText}>Open in Maps</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleShareEvent(event)}
                activeOpacity={0.7}
              >
                <Ionicons name="share-outline" size={16} color={theme.colors.primary} />
                <Text style={styles.actionButtonText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'upcoming', 'past', 'hosted'] as const).map(filter => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterTab, activeFilter === filter && styles.filterTabActive]}
            onPress={() => setActiveFilter(filter)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Events List */}
      <ScrollView style={styles.eventsList} showsVerticalScrollIndicator={false}>
        {filteredEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color={theme.colors.text.tertiary} />
            <Text style={styles.emptyStateTitle}>No events found</Text>
            <Text style={styles.emptyStateSubtitle}>
              {activeFilter === 'upcoming' ? 'No upcoming events' : 
               activeFilter === 'past' ? 'No past events' :
               activeFilter === 'hosted' ? 'You haven\'t hosted any events' :
               'No events to display'}
            </Text>
          </View>
        ) : (
          filteredEvents.map(renderEventCard)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: theme.colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  filterTextActive: {
    color: theme.colors.white,
  },
  eventsList: {
    flex: 1,
    padding: 20,
  },
  eventCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    overflow: 'hidden',
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 20,
  },
  eventHeaderContent: {
    flex: 1,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    flex: 1,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  eventHost: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    fontWeight: '500',
  },
  rsvpContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 8,
  },
  rsvpButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.text.tertiary,
    alignItems: 'center',
  },
  rsvpButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  rsvpText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  rsvpTextActive: {
    color: theme.colors.white,
  },
  expandedContent: {
    overflow: 'hidden',
  },
  eventDetails: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginLeft: 8,
    flex: 1,
  },
  attendeesSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  attendeesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  attendeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  attendeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  attendeeName: {
    fontSize: 14,
    color: theme.colors.text.primary,
    marginRight: 8,
  },
  attendeeStatus: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  attendeeETA: {
    fontSize: 12,
    fontWeight: '600',
  },
  mapContainer: {
    height: 120,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
    marginBottom: 16,
  },
  miniMap: {
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.white,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    marginLeft: 6,
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
    textAlign: 'center',
  },
}); 