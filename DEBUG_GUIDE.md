# Debugging Best Practices Guide

This guide covers the comprehensive debugging setup implemented in your React Native/Expo project.

## 🚀 Quick Start

### 1. Enable Debug Mode
```typescript
import { setDebugMode } from './app/utils/debugUtils';

// Enable debug mode
setDebugMode(true);
```

### 2. Add Debug Button to Any Screen
```typescript
import DebugButton from './app/components/DebugButton';

// In your component
<DebugButton position="bottom-right" size={50} showLabel={true} />
```

### 3. Wrap Components with Error Boundary
```typescript
import ErrorBoundary from './app/components/ErrorBoundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

## 📋 Debugging Tools Overview

### 1. Enhanced Logging System (`debugUtils.ts`)

#### Basic Usage
```typescript
import { logger } from './app/utils/debugUtils';

// Different log levels
logger.debug('Debug message', { data: 'debug info' });
logger.info('Info message', { data: 'info' });
logger.warn('Warning message', { data: 'warning' });
logger.error('Error message', { data: 'error' });
```

#### Performance Monitoring
```typescript
import { performanceMonitor } from './app/utils/debugUtils';

// Start timing
performanceMonitor.startTimer('api-call');

// End timing and get duration
const duration = performanceMonitor.endTimer('api-call');

// Get average time
const avgTime = performanceMonitor.getAverageTime('api-call');
```

#### Error Handling
```typescript
import { handleError, withErrorHandling } from './app/utils/debugUtils';

// Manual error handling
try {
  // Your code
} catch (error) {
  handleError(error, 'ComponentName');
}

// Automatic error wrapping
const safeFunction = withErrorHandling(async (data) => {
  // Your async function
}, 'FunctionName');
```

### 2. State Debugging Hooks (`useDebugState.ts`)

#### Debug State Changes
```typescript
import { useDebugState } from './app/hooks/useDebugState';

function MyComponent() {
  const [state, setState] = useState({ count: 0 });
  
  // Debug state changes
  useDebugState(state, {
    componentName: 'MyComponent',
    logStateChanges: true,
    logStateDiffs: true,
  });
  
  return <View>...</View>;
}
```

#### Debug Specific Values
```typescript
import { useDebugValue } from './app/hooks/useDebugState';

function MyComponent({ userId }) {
  // Debug specific prop
  useDebugValue(userId, 'userId', { componentName: 'MyComponent' });
  
  return <View>...</View>;
}
```

#### Debug Props Changes
```typescript
import { useDebugProps } from './app/hooks/useDebugState';

function MyComponent(props) {
  // Debug prop changes
  useDebugProps(props, 'MyComponent');
  
  return <View>...</View>;
}
```

### 3. Network Debugging (`networkDebugger.ts`)

#### Automatic Network Debugging
```typescript
import { debugAxios } from './app/utils/networkDebugger';

// Use debugAxios instead of regular axios
const response = await debugAxios.get('/api/users');
```

#### Manual Network Debugging
```typescript
import { logNetworkRequest, logNetworkResponse, logNetworkError } from './app/utils/networkDebugger';

// Log request
logNetworkRequest({
  url: '/api/users',
  method: 'GET',
  headers: { 'Authorization': 'Bearer token' }
});

// Log response
logNetworkResponse(response, responseTime);

// Log error
logNetworkError(error);
```

### 4. Error Boundary Component

#### Basic Usage
```typescript
import ErrorBoundary from './app/components/ErrorBoundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

#### Custom Error UI
```typescript
<ErrorBoundary
  fallback={<CustomErrorComponent />}
  onError={(error, errorInfo) => {
    // Custom error handling
    console.log('Custom error handling:', error);
  }}
  showDetails={true}
>
  <YourComponent />
</ErrorBoundary>
```

## 🔧 Debug Configuration

### Environment-Specific Settings
```typescript
import { DEBUG_CONFIG, DEBUG_FEATURES } from './app/config/debug';

// Check environment
if (DEBUG_CONFIG.enabled) {
  // Development-only code
}

// Check specific features
if (DEBUG_FEATURES.networkDebugging) {
  // Network debugging enabled
}
```

### Custom Debug Configuration
```typescript
import { setDebugMode, getDebugMode } from './app/utils/debugUtils';

// Toggle debug mode
setDebugMode(!getDebugMode());
```

## 📱 Debug Menu

The debug menu provides quick access to debugging tools:

- **Debug Mode Toggle**: Enable/disable debug logging
- **Test Logs**: Log test messages at different levels
- **Performance Stats**: Show performance statistics
- **Clear Performance Data**: Clear all performance measurements
- **Environment Info**: Show current environment information
- **Test Error Boundary**: Trigger a test error

## 🚀 Development Scripts

### Available Commands
```bash
# Start with debugging enabled
npm run debug

# Platform-specific debugging
npm run debug:android
npm run debug:ios
npm run debug:web

# View logs
npm run logs
npm run logs:clear

# Reset and restart
npm run debug:reset
```

## 📊 Performance Monitoring

### Track Performance
```typescript
import { performanceMonitor } from './app/utils/debugUtils';

// Track API calls
performanceMonitor.startTimer('user-fetch');
const users = await fetchUsers();
performanceMonitor.endTimer('user-fetch');

// Track component renders
performanceMonitor.startTimer('component-render');
// Component render logic
performanceMonitor.endTimer('component-render');
```

### Get Performance Statistics
```typescript
const stats = performanceMonitor.getPerformanceStats();
console.log('Performance stats:', stats);
```

## 🐛 Error Handling Best Practices

### 1. Use Error Boundaries
Always wrap critical components with ErrorBoundary to prevent app crashes.

### 2. Log Errors Properly
```typescript
import { handleError } from './app/utils/debugUtils';

try {
  // Risky operation
} catch (error) {
  handleError(error, 'ComponentName');
  // Handle gracefully
}
```

### 3. Async Error Handling
```typescript
import { withErrorHandling } from './app/utils/debugUtils';

const safeApiCall = withErrorHandling(async (userId) => {
  const response = await api.getUser(userId);
  return response.data;
}, 'getUser');
```

## 🔍 Debugging Tips

### 1. Use Descriptive Component Names
```typescript
useDebugState(state, { componentName: 'UserProfile' });
```

### 2. Log Important State Changes
```typescript
useDebugState(userState, {
  logStateChanges: true,
  logStateDiffs: true,
  componentName: 'UserProfile'
});
```

### 3. Monitor Network Requests
```typescript
// Use debugAxios for automatic logging
const response = await debugAxios.get('/api/users');
```

### 4. Performance Monitoring
```typescript
// Track expensive operations
performanceMonitor.startTimer('expensive-operation');
// ... operation
performanceMonitor.endTimer('expensive-operation');
```

## 📝 Log Levels

- **DEBUG**: Detailed information for debugging
- **INFO**: General information about app flow
- **WARN**: Warning messages for potential issues
- **ERROR**: Error messages for actual problems

## 🎯 Production Considerations

### 1. Disable Debug Features
Debug features are automatically disabled in production builds.

### 2. Error Logging Only
In production, only error-level logs are shown.

### 3. Performance Impact
Debug features have minimal impact on production performance.

## 🔧 Customization

### Custom Debug Configuration
```typescript
import { DEBUG_CONFIG } from './app/config/debug';

// Modify debug configuration
DEBUG_CONFIG.logLevel = 'info';
DEBUG_CONFIG.showTimestamps = false;
```

### Custom Network Debugging
```typescript
import { NetworkDebugger } from './app/utils/networkDebugger';

const customAxios = axios.create();
const debugger = new NetworkDebugger(customAxios, {
  enabled: true,
  logRequests: true,
  logResponses: true,
  logErrors: true,
});
```

## 📚 Additional Resources

- [React Native Debugging](https://reactnative.dev/docs/debugging)
- [Expo Debugging](https://docs.expo.dev/guides/debugging/)
- [React DevTools](https://reactnative.dev/docs/debugging#react-developer-tools)

## 🆘 Troubleshooting

### Common Issues

1. **Debug menu not showing**: Ensure `DEBUG_CONFIG.enabled` is true
2. **Logs not appearing**: Check log level configuration
3. **Performance data not tracking**: Verify `enablePerformanceMonitoring` is enabled
4. **Network debugging not working**: Use `debugAxios` instead of regular axios

### Getting Help

1. Check the console for debug messages
2. Use the debug menu to test functionality
3. Verify environment configuration
4. Check network tab for request/response logs 