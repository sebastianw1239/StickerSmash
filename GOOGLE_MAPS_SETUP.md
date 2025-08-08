# Google Maps API Setup Guide

This guide will help you set up real map data for the SameTime app using Google Maps APIs.

## Prerequisites

1. A Google account
2. A credit card for billing (required for API usage)
3. Basic understanding of Google Cloud Console

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter a project name (e.g., "SameTime Maps")
4. Click "Create"

## Step 2: Enable Required APIs

In your Google Cloud project, enable these APIs:

### Places API (New) - RECOMMENDED
- Go to "APIs & Services" → "Library"
- Search for "Places API (New)"
- Click "Enable"
- This provides enhanced place details and features

### Directions API
- Search for "Directions API"
- Click "Enable"

### Maps SDK for Android
- Search for "Maps SDK for Android"
- Click "Enable"

### Maps SDK for iOS
- Search for "Maps SDK for iOS"
- Click "Enable"

## Step 3: Create API Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy the generated API key
4. Click "Restrict Key" to secure it

### Restrict the API Key

1. Under "Application restrictions", select "Android apps" and "iOS apps"
2. Add your app's bundle identifier:
   - Android: `com.yourcompany.sametime`
   - iOS: `com.yourcompany.sametime`
3. Under "API restrictions", select "Restrict key"
4. Select all the APIs you enabled above
5. Click "Save"

## Step 4: Set Up Billing

1. Go to "Billing" in the left sidebar
2. Click "Link a billing account"
3. Add your payment method
4. This is required for API usage

## Step 5: Configure the App

1. Open `app/config/googleMaps.ts`
2. Replace `YOUR_GOOGLE_MAPS_API_KEY` with your actual API key:

```typescript
export const GOOGLE_MAPS_CONFIG = {
  API_KEY: 'AIzaSyYourActualApiKeyHere',
  // ... rest of config
};
```

## Step 6: Test the Integration

1. Run your app: `npm start`
2. Go to the "Create Event" screen
3. Type a venue name in the search box
4. You should see real location suggestions with enhanced details:
   - ⭐ **Ratings** from Google reviews
   - 💰 **Price levels** ($ to $$$$)
   - 🕒 **Opening hours** (Open Now/Closed)
   - 🚨 **Business status** (Temporarily/Permanently Closed)
   - 🎯 **Enhanced place types** and features

## Enhanced Features with Places API (New)

### Rich Place Information
- **Business Status**: Real-time operational status
- **Price Levels**: Cost indicators ($ to $$$$)
- **Opening Hours**: Current open/closed status
- **Ratings**: Google review scores
- **Accessibility**: Wheelchair access, parking
- **Features**: Delivery, takeout, reservations, etc.

### Advanced Search Capabilities
- **Location-based search** with 50km radius
- **Debounced search** to optimize API calls
- **Enhanced place categorization** (restaurant, venue, office, other)
- **Real-time business status** updates

### Smart UI Enhancements
- **Visual indicators** for ratings, prices, and status
- **Color-coded business status** (green for open, red for closed)
- **Price level display** with dollar signs
- **Opening hours** with real-time status

## API Usage and Costs

### Estimated Costs (2024)
- **Places API (New)**: $17 per 1,000 requests
- **Directions API**: $5 per 1,000 requests
- **Maps SDK**: Free for basic usage

### Typical Usage per User
- **Location searches**: 10-20 per day
- **ETA calculations**: 5-10 per day
- **Monthly cost per user**: ~$0.50-1.00

## Troubleshooting

### Common Issues

1. **"API key not valid" error**
   - Check that your API key is correct
   - Ensure the APIs are enabled
   - Verify billing is set up

2. **"Location permission denied"**
   - The app needs location permissions
   - Go to device settings and enable location for the app

3. **"No results found"**
   - Check your search query
   - Ensure you're in a supported region
   - Verify the Places API is enabled

4. **High API usage**
   - Implement caching for repeated searches
   - Use debouncing for search inputs
   - Consider implementing offline fallbacks

## Security Best Practices

1. **Restrict API keys** to your app's bundle ID
2. **Set up API quotas** to prevent abuse
3. **Monitor usage** in Google Cloud Console
4. **Use different keys** for development and production
5. **Implement rate limiting** in your app

## Advanced Features

### Custom Place Types
You can modify the place categorization in `mapService.ts`:

```typescript
private categorizePlaceType(types: string[]): LocationSuggestion['type'] {
  // Add your custom logic here
}
```

### Route Visualization
The Directions API returns route coordinates that can be displayed on the map:

```typescript
const etaData = await mapService.calculateETA(origin, destination);
// etaData.route contains the route coordinates
```

### Traffic Analysis
The service automatically analyzes traffic levels:

```typescript
// Traffic levels: 'low' | 'medium' | 'high'
const trafficLevel = etaData.trafficLevel;
```

### Enhanced Place Details
Access rich place information:

```typescript
const place = await mapService.getPlaceDetails(placeId);
console.log(place.features?.delivery); // true/false
console.log(place.openingHours?.openNow); // true/false
console.log(place.businessStatus); // 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY'
```

## Support

- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [Places API (New) Reference](https://developers.google.com/maps/documentation/places/web-service)
- [Directions API Reference](https://developers.google.com/maps/documentation/directions)

## Next Steps

1. **Implement caching** for better performance
2. **Add offline support** for basic functionality
3. **Optimize API calls** to reduce costs
4. **Add more place types** and categories
5. **Implement route visualization** on maps
6. **Add accessibility features** based on place data
7. **Implement business hours** for event scheduling 