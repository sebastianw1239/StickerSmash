import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    onAuthStateChanged,
    signInAnonymously,
    User
} from 'firebase/auth';
import {
    collection,
    doc,
    getDoc,
    getFirestore,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    where
} from 'firebase/firestore';
import {
    getMessaging,
    getToken,
    isSupported,
    onMessage
} from 'firebase/messaging';
import { Alert, Platform } from 'react-native';
import { ETAData, EventData, LocationData, locationService } from './locationService';

import { firebaseConfig, vapidKey } from '../config/firebase';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
let messaging: any = null;

// Initialize messaging if supported
try {
  if (isSupported()) {
    messaging = getMessaging(app);
  }
} catch (error) {
  console.warn('Firebase messaging initialization failed:', error);
  messaging = null;
}

export interface UserLocation {
  userId: string;
  eventId: string;
  location: LocationData;
  eta: ETAData;
  lastUpdated: any;
  isActive: boolean;
}

export interface EventParticipant {
  userId: string;
  displayName: string;
  eta: ETAData | null;
  isActive: boolean;
  lastSeen: any;
}

export interface NotificationData {
  eventId: string;
  userId: string;
  message: string;
  type: 'eta_update' | 'arrival' | 'delay' | 'group_alert';
  data?: any;
}

class FirebaseService {
  private currentUser: User | null = null;
  private fcmToken: string | null = null;
  private locationSubscriptions: { [eventId: string]: () => void } = {};

  // Initialize Firebase service
  async initialize(): Promise<void> {
    try {
      // Sign in anonymously
      await signInAnonymously(auth);
      
      // Set up auth state listener
      onAuthStateChanged(auth, (user) => {
        this.currentUser = user;
        if (user) {
          console.log('User authenticated:', user.uid);
          this.setupMessaging();
        }
      });

      // Load FCM token from storage
      this.fcmToken = await AsyncStorage.getItem('fcmToken');
      
    } catch (error) {
      console.error('Firebase initialization failed:', error);
      // Don't throw error, just log it so the app can continue without Firebase
      // This allows the app to work even if Firebase isn't properly configured
    }
  }

  // Setup Firebase Cloud Messaging
  private async setupMessaging(): Promise<void> {
    if (!messaging || !this.currentUser) {
      console.log('Messaging setup skipped: messaging not available or user not authenticated');
      return;
    }

    try {
      // Request notification permission
      const permission = await Notifications.requestPermissionsAsync();
      
      if (permission.status === 'granted') {
        // Get FCM token
        const token = await getToken(messaging, {
          vapidKey: vapidKey
        });

        if (token) {
          this.fcmToken = token;
          await AsyncStorage.setItem('fcmToken', token);
          
          // Save token to Firestore
          await this.saveFCMToken(token);
          
          console.log('FCM Token:', token);
        }

        // Handle foreground messages
        onMessage(messaging, (payload) => {
          console.log('Foreground message received:', payload);
          this.handleNotification(payload);
        });
      }
    } catch (error) {
      console.error('Messaging setup failed:', error);
      // Don't throw error, just log it so the app can continue
    }
  }

  // Save FCM token to Firestore
  private async saveFCMToken(token: string): Promise<void> {
    if (!this.currentUser) return;

    try {
      await setDoc(doc(db, 'users', this.currentUser.uid), {
        fcmToken: token,
        lastUpdated: serverTimestamp(),
        platform: Platform.OS
      }, { merge: true });
    } catch (error) {
      console.error('Failed to save FCM token:', error);
    }
  }

  // Handle incoming notifications
  private handleNotification(payload: any): void {
    const { data, notification } = payload;
    
    if (data?.type === 'eta_update') {
      // Handle ETA update notification
      this.handleETAUpdate(data);
    } else if (data?.type === 'group_alert') {
      // Handle group alert notification
      this.handleGroupAlert(data);
    }
  }

  // Handle ETA update notifications
  private handleETAUpdate(data: any): void {
    const { eventId, userId, eta } = data;
    console.log(`ETA update for user ${userId} in event ${eventId}: ${eta} minutes`);
    
    // Update local state or trigger UI refresh
    // This could trigger a re-render of the dashboard
  }

  // Handle group alert notifications
  private handleGroupAlert(data: any): void {
    const { eventId, message, participants } = data;
    console.log(`Group alert for event ${eventId}: ${message}`);
    
    // Show alert to user
    Alert.alert('Group Update', message);
  }

  // Upload location and ETA data to Firestore
  async uploadLocationData(eventId: string, location: LocationData, eta: ETAData): Promise<void> {
    if (!this.currentUser) return;

    try {
      const userLocation: UserLocation = {
        userId: this.currentUser.uid,
        eventId,
        location,
        eta,
        lastUpdated: serverTimestamp(),
        isActive: true
      };

      await setDoc(doc(db, 'userLocations', `${eventId}_${this.currentUser.uid}`), userLocation);
      
      console.log(`Location data uploaded for event ${eventId}`);
    } catch (error) {
      console.error('Failed to upload location data:', error);
    }
  }

  // Subscribe to real-time location updates for an event
  subscribeToEventLocations(eventId: string, callback: (locations: UserLocation[]) => void): () => void {
    const q = query(
      collection(db, 'userLocations'),
      where('eventId', '==', eventId),
      where('isActive', '==', true),
      orderBy('lastUpdated', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const locations: UserLocation[] = [];
      snapshot.forEach((doc) => {
        locations.push(doc.data() as UserLocation);
      });
      
      callback(locations);
    }, (error) => {
      console.error('Location subscription error:', error);
    });

    this.locationSubscriptions[eventId] = unsubscribe;
    return unsubscribe;
  }

  // Create or update an event
  async createEvent(eventData: EventData): Promise<void> {
    try {
      const eventDoc = {
        ...eventData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'active'
      };

      await setDoc(doc(db, 'events', eventData.id), eventDoc);
      console.log(`Event created: ${eventData.id}`);
    } catch (error) {
      console.error('Failed to create event:', error);
      throw error;
    }
  }

  // Get event data
  async getEvent(eventId: string): Promise<EventData | null> {
    try {
      const docRef = doc(db, 'events', eventId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as EventData;
      }
      return null;
    } catch (error) {
      console.error('Failed to get event:', error);
      return null;
    }
  }

  // Send notification to event participants
  async sendNotification(notificationData: NotificationData): Promise<void> {
    try {
      // Save notification to Firestore
      await setDoc(doc(db, 'notifications', `${notificationData.eventId}_${Date.now()}`), {
        ...notificationData,
        timestamp: serverTimestamp(),
        sent: true
      });

      // In a real implementation, you would send this via Firebase Cloud Functions
      // which would handle the actual FCM sending
      console.log('Notification queued:', notificationData);
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  // Update user's ETA and trigger notifications if needed
  async updateUserETA(eventId: string, eta: ETAData): Promise<void> {
    if (!this.currentUser) return;

    try {
      // Update user's ETA
      await setDoc(doc(db, 'eventParticipants', `${eventId}_${this.currentUser.uid}`), {
        userId: this.currentUser.uid,
        eventId,
        eta,
        lastUpdated: serverTimestamp(),
        isActive: true
      }, { merge: true });

      // Check if notification should be sent
      if (eta.eta <= 10) { // Arriving within 10 minutes
        await this.sendNotification({
          eventId,
          userId: this.currentUser.uid,
          message: `You're arriving in ${eta.eta} minutes!`,
          type: 'arrival'
        });
      }

      console.log(`ETA updated for event ${eventId}: ${eta.eta} minutes`);
    } catch (error) {
      console.error('Failed to update ETA:', error);
    }
  }

  // Stop location tracking for an event
  async stopEventTracking(eventId: string): Promise<void> {
    if (!this.currentUser) return;

    try {
      // Mark user as inactive
      await setDoc(doc(db, 'userLocations', `${eventId}_${this.currentUser.uid}`), {
        isActive: false,
        lastUpdated: serverTimestamp()
      }, { merge: true });

      // Unsubscribe from location updates
      if (this.locationSubscriptions[eventId]) {
        this.locationSubscriptions[eventId]();
        delete this.locationSubscriptions[eventId];
      }

      // Stop local polling
      locationService.stopPolling(eventId);

      console.log(`Stopped tracking for event ${eventId}`);
    } catch (error) {
      console.error('Failed to stop event tracking:', error);
    }
  }

  // Clean up Firebase service
  cleanup(): void {
    // Unsubscribe from all location updates
    Object.values(this.locationSubscriptions).forEach(unsubscribe => unsubscribe());
    this.locationSubscriptions = {};
    
    // Stop all location polling
    locationService.cleanup();
  }
}

export const firebaseService = new FirebaseService(); 