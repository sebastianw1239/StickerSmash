# Firebase Setup for StickerSmash Polling System

This guide will help you set up Firebase for the real-time polling and tracking system.

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter your project name (e.g., "stickersmash")
4. Follow the setup wizard

## 2. Enable Services

### Firestore Database
1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (we'll add security rules later)
4. Select a location close to your users

### Authentication
1. Go to "Authentication" in Firebase Console
2. Click "Get started"
3. Enable "Anonymous" authentication
4. This allows users to use the app without signing up

### Cloud Messaging
1. Go to "Project settings" (gear icon)
2. Click "Cloud Messaging" tab
3. Note your "Sender ID" (you'll need this)
4. Generate a VAPID key for web push notifications

## 3. Update Configuration

Edit `app/config/firebase.ts` and replace the placeholder values:

```typescript
export const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

export const vapidKey = "your-actual-vapid-key";
```

## 4. Security Rules

Add these Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Event participants can read/write event data
    match /events/{eventId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.participants;
    }
    
    // Users can only read/write their own location data
    match /userLocations/{docId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Event participants can read/write participant data
    match /eventParticipants/{docId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Notifications (read-only for now)
    match /notifications/{docId} {
      allow read: if request.auth != null;
      allow write: if false; // Only server can write
    }
  }
}
```

## 5. Cloud Functions (Optional)

For production, you'll want Cloud Functions to handle:
- Sending push notifications
- Processing location data
- Managing event lifecycle

## 6. Testing the Setup

1. Start the app: `npm start`
2. Go to the Dashboard tab
3. Click "Start Tracking"
4. Check Firebase Console to see data being written

## 7. Environment Variables (Recommended)

For better security, use environment variables:

1. Create `.env` file:
```
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id
FIREBASE_VAPID_KEY=your-vapid-key
```

2. Install expo-constants: `npx expo install expo-constants`

3. Update `app/config/firebase.ts`:
```typescript
import Constants from 'expo-constants';

export const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey,
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain,
  // ... etc
};
```

## Architecture Overview

The polling system implements your architecture plan:

### Hybrid Polling
- **Local polling**: Every 30 seconds (low cost, battery efficient)
- **API polling**: Adaptive intervals (2-30 minutes based on event proximity)
- **Server sync**: Every 3 minutes or on major deviation

### Adaptive Intervals
- **4+ hours to event**: 30 minutes
- **1-4 hours to event**: 10 minutes  
- **10 minutes to event**: 5 minutes
- **<10 minutes to event**: 2 minutes

### Privacy & Security
- Anonymous authentication
- Location data auto-cleanup
- Encrypted data transmission
- User-controlled permissions

### Real-time Features
- Live location updates via Firestore
- Push notifications via FCM
- ETA deviation alerts
- Group arrival notifications

## Next Steps

1. Replace placeholder Firebase config with real values
2. Test the polling system
3. Add Cloud Functions for production
4. Implement proper error handling
5. Add analytics and monitoring 