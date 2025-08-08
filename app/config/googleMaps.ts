// Google Maps API Configuration
// 
// To use real map data, you need to:
// 1. Get a Google Maps API key from: https://console.cloud.google.com/
// 2. Enable the following APIs in your Google Cloud Console:
//    - Places API
//    - Directions API
//    - Maps SDK for Android
//    - Maps SDK for iOS
// 3. Replace the API key below with your actual key
// 4. Set up billing (required for API usage)

export const GOOGLE_MAPS_CONFIG = {
  // Replace this with your actual Google Maps API key
  API_KEY: 'AIzaSyAneWiHtU_6VM5iZXIXEetSZr27BKGON7o',
  
  // API endpoints
  PLACES_API_BASE: 'https://places.googleapis.com/v1', // New Places API endpoint
  DIRECTIONS_API_BASE: 'https://maps.googleapis.com/maps/api/directions',
  
  // Default search settings
  DEFAULT_SEARCH_RADIUS: 50000, // 50km
  DEFAULT_SEARCH_TYPE: 'establishment',
  
  // Traffic analysis settings
  TRAFFIC_LOW_THRESHOLD: 1.1,    // 10% increase
  TRAFFIC_MEDIUM_THRESHOLD: 1.3,  // 30% increase
  TRAFFIC_HIGH_THRESHOLD: 1.5,    // 50% increase
};

// Instructions for setting up Google Maps API:
//
// 1. Go to https://console.cloud.google.com/
// 2. Create a new project or select an existing one
// 3. Enable the following APIs:
//    - Places API (for location search)
//    - Directions API (for ETA calculations)
//    - Maps SDK for Android (for Android maps)
//    - Maps SDK for iOS (for iOS maps)
// 4. Create credentials (API key)
// 5. Restrict the API key to your app's bundle ID
// 6. Set up billing (required for API usage)
// 7. Replace 'YOUR_GOOGLE_MAPS_API_KEY' above with your actual key
//
// For development, you can use the same API key for both platforms.
// For production, consider creating separate keys for Android and iOS.
//
// Cost estimates (as of 2024):
// - Places API: $17 per 1000 requests
// - Directions API: $5 per 1000 requests
// - Maps SDK: Free for basic usage
//
// A typical user might generate:
// - 10-20 Places API calls per day (location searches)
// - 5-10 Directions API calls per day (ETA calculations)
// - Total cost: ~$0.50-1.00 per user per month 