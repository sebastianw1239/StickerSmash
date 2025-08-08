import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { initializeDebug } from './config/debug';
import { logger } from './utils/debugUtils';

export default function RootLayout() {
  useEffect(() => {
    // Initialize debug configuration
    initializeDebug();
    
    // Log app startup
    logger.info('App started', {
      environment: __DEV__ ? 'development' : 'production',
      timestamp: new Date().toISOString(),
    });
  }, []);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
