// Firebase configuration
// Replace these values with your actual Firebase project configuration
export const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

// VAPID key for Firebase Cloud Messaging
// Get this from your Firebase project settings
export const vapidKey = "your-vapid-key";

// Firebase project settings
export const firebaseSettings = {
  // Collection names
  collections: {
    users: 'users',
    events: 'events',
    userLocations: 'userLocations',
    eventParticipants: 'eventParticipants',
    notifications: 'notifications'
  },
  
  // Security rules (for reference)
  securityRules: {
    users: "auth != null && request.auth.uid == resource.data.userId",
    events: "auth != null && request.auth.uid in resource.data.participants",
    userLocations: "auth != null && request.auth.uid == resource.data.userId",
    eventParticipants: "auth != null && request.auth.uid == resource.data.userId"
  }
}; 