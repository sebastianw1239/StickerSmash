/**
 * LocationTracker.ts
 * Phase 2: Core location tracking with foreground/background support
 * TypeScript-only, Managed Expo
 */

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { enqueue } from './UploadQueue';

// Constants
const BG_TASK = 'sametime-bg-location';
const BATCH_SIZE = 4;
const BATCH_TIME_MS = 60000; // 60 seconds

// Types
export interface LocPoint {
  lat: number;
  lng: number;
  timestamp: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
}

export interface PermissionStatus {
  fg: boolean;
  bg: boolean;
}

// State
let foregroundSubscription: Location.LocationSubscription | null = null;
let batchTimer: NodeJS.Timeout | null = null;
let currentBatch: LocPoint[] = [];
let lastFlushTime = Date.now();
let currentTripId: string | null = null;

// HMR-safe task definition guard
const g = global as any;
if (!g.__BG_TASK_DEFINED__) {
  TaskManager.defineTask(BG_TASK, async ({ data, error }) => {
    if (error) {
      console.error('[BG_TASK] Error:', error);
      return;
    }
    
    if (!data) return;
    
    const { locations } = data as any;
    if (!locations || !Array.isArray(locations)) return;
    
    // Convert to LocPoint format and enqueue
    const points: LocPoint[] = locations.map((loc: any) => ({
      lat: loc.coords.latitude,
      lng: loc.coords.longitude,
      timestamp: loc.timestamp,
      accuracy: loc.coords.accuracy,
      altitude: loc.coords.altitude,
      speed: loc.coords.speed,
      heading: loc.coords.heading,
    }));
    
    if (points.length > 0 && currentTripId) {
      enqueue({ tripId: currentTripId, points });
    }
  });
  g.__BG_TASK_DEFINED__ = true;
}

/**
 * Ensure location permissions (foreground and background)
 * Resolves with permission status, never throws on denial
 */
export async function ensureLocationPermissions(): Promise<PermissionStatus> {
  try {
    // Request foreground permission
    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    const fg = fgStatus === 'granted';
    
    // Request background permission if foreground granted
    let bg = false;
    if (fg) {
      const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
      bg = bgStatus === 'granted';
    }
    
    return { fg, bg };
  } catch (error) {
    console.error('[LocationTracker] Permission error:', error);
    return { fg: false, bg: false };
  }
}

/**
 * Flush current batch if conditions met
 */
function flushBatchIfNeeded(force = false): void {
  const now = Date.now();
  const timeSinceLastFlush = now - lastFlushTime;
  
  if (
    currentBatch.length > 0 &&
    currentTripId &&
    (force || currentBatch.length >= BATCH_SIZE || timeSinceLastFlush >= BATCH_TIME_MS)
  ) {
    // Enqueue batch for upload
    enqueue({ tripId: currentTripId, points: [...currentBatch] });
    
    // Clear batch and reset timer
    currentBatch = [];
    lastFlushTime = now;
  }
}

/**
 * Handle location update from foreground tracking
 */
function handleLocationUpdate(location: Location.LocationObject): void {
  const point: LocPoint = {
    lat: location.coords.latitude,
    lng: location.coords.longitude,
    timestamp: location.timestamp,
    accuracy: location.coords.accuracy,
    altitude: location.coords.altitude || undefined,
    speed: location.coords.speed || undefined,
    heading: location.coords.heading || undefined,
  };
  
  currentBatch.push(point);
  flushBatchIfNeeded();
}

/**
 * Start foreground location tracking
 * Returns subscription handle with remove() method
 */
export async function startForegroundTracking(tripId: string): Promise<{ remove(): void }> {
  // Stop any existing tracking
  if (foregroundSubscription) {
    foregroundSubscription.remove();
    foregroundSubscription = null;
  }
  
  // Clear any existing timer
  if (batchTimer) {
    clearInterval(batchTimer);
    batchTimer = null;
  }
  
  // Set trip ID
  currentTripId = tripId;
  
  // Reset batch state
  currentBatch = [];
  lastFlushTime = Date.now();
  
  // Start location updates
  foregroundSubscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      distanceInterval: 500, // meters
      timeInterval: 30000, // 30 seconds
    },
    handleLocationUpdate
  );
  
  // Start batch timer
  batchTimer = setInterval(() => {
    flushBatchIfNeeded();
  }, 10000); // Check every 10 seconds
  
  // Return handle for cleanup
  return {
    remove: () => {
      // Flush any remaining points
      flushBatchIfNeeded(true);
      
      // Clean up subscription
      if (foregroundSubscription) {
        foregroundSubscription.remove();
        foregroundSubscription = null;
      }
      
      // Clean up timer
      if (batchTimer) {
        clearInterval(batchTimer);
        batchTimer = null;
      }
      
      // Clear trip ID
      currentTripId = null;
    }
  };
}

/**
 * Start background location tracking
 * Note: Requires dev client/EAS build, won't work in Expo Go
 */
export async function startBackgroundTracking(tripId: string): Promise<void> {
  try {
    // Check if already running
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BG_TASK);
    if (isRegistered) {
      console.log('[LocationTracker] Background task already registered');
      return;
    }
    
    // Set trip ID for background handler
    currentTripId = tripId;
    
    // Start background location updates
    await Location.startLocationUpdatesAsync(BG_TASK, {
      accuracy: Location.Accuracy.Balanced,
      distanceInterval: 500, // meters
      timeInterval: 30000, // 30 seconds
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'SameTime',
        notificationBody: 'Tracking your location for meetup',
        notificationColor: '#5CB3FF',
      },
      pausesUpdatesAutomatically: false,
      deferredUpdatesInterval: 0,
      deferredUpdatesDistance: 0,
    });
    
    console.log('[LocationTracker] Background tracking started');
  } catch (error) {
    console.error('[LocationTracker] Failed to start background tracking:', error);
    throw error;
  }
}

/**
 * Stop background location tracking
 * Idempotent - safe to call multiple times
 */
export async function stopBackgroundTracking(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BG_TASK);
    if (!isRegistered) {
      console.log('[LocationTracker] Background task not registered');
      return;
    }
    
    await Location.stopLocationUpdatesAsync(BG_TASK);
    currentTripId = null;
    console.log('[LocationTracker] Background tracking stopped');
  } catch (error) {
    console.error('[LocationTracker] Failed to stop background tracking:', error);
    // Don't throw - make it idempotent
  }
}

/**
 * Get current location once
 */
export async function getCurrentLocation(): Promise<LocPoint | null> {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    
    return {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
      timestamp: location.timestamp,
      accuracy: location.coords.accuracy,
      altitude: location.coords.altitude || undefined,
      speed: location.coords.speed || undefined,
      heading: location.coords.heading || undefined,
    };
  } catch (error) {
    console.error('[LocationTracker] Failed to get current location:', error);
    return null;
  }
}

// Export types
export type { Location };