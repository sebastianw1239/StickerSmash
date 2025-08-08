import { Platform } from 'react-native';

// Environment detection
export const isDevelopment = __DEV__;
export const isProduction = !__DEV__;
export const isTest = process.env.NODE_ENV === 'test';

// Debug configuration based on environment
export const DEBUG_CONFIG = {
  // General debugging
  enabled: isDevelopment,
  logLevel: isDevelopment ? 'debug' : 'error',
  
  // Logging options
  showTimestamps: true,
  showPlatform: true,
  maxLogLength: isDevelopment ? 2000 : 500,
  
  // Performance monitoring
  enablePerformanceMonitoring: isDevelopment,
  performanceThreshold: 1000, // ms
  
  // Network debugging
  enableNetworkDebugging: isDevelopment,
  logNetworkRequests: isDevelopment,
  logNetworkResponses: isDevelopment,
  logNetworkErrors: true,
  maxResponseSize: isDevelopment ? 2000 : 500,
  
  // Component debugging
  enableComponentDebugging: isDevelopment,
  logStateChanges: isDevelopment,
  logPropChanges: isDevelopment,
  logLifecycle: isDevelopment,
  
  // Error handling
  enableErrorBoundaries: true,
  showErrorDetails: isDevelopment,
  logErrorsToConsole: true,
  
  // Platform-specific settings
  platform: Platform.OS,
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',
  isWeb: Platform.OS === 'web',
};

// Feature flags for debugging
export const DEBUG_FEATURES = {
  // Enable/disable specific debugging features
  networkDebugging: DEBUG_CONFIG.enableNetworkDebugging,
  performanceDebugging: DEBUG_CONFIG.enablePerformanceMonitoring,
  componentDebugging: DEBUG_CONFIG.enableComponentDebugging,
  errorDebugging: DEBUG_CONFIG.enableErrorBoundaries,
  
  // Development-only features
  development: {
    showDebugMenu: isDevelopment,
    enableHotReload: isDevelopment,
    showPerformanceOverlay: isDevelopment,
    enableReactDevTools: isDevelopment,
  },
  
  // Production features (minimal debugging)
  production: {
    logErrorsOnly: isProduction,
    disableVerboseLogging: isProduction,
    optimizePerformance: isProduction,
  },
};

// Debug utilities
export const getDebugConfig = () => DEBUG_CONFIG;
export const getDebugFeatures = () => DEBUG_FEATURES;

// Environment-specific debug helpers
export const debugHelpers = {
  isDevelopment,
  isProduction,
  isTest,
  getEnvironment: () => isDevelopment ? 'development' : 'production',
  
  // Conditional logging
  logIfDev: (message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`[DEV] ${message}`, data);
    }
  },
  
  // Performance helpers
  measureTime: (name: string, fn: () => void) => {
    if (isDevelopment) {
      const start = Date.now();
      fn();
      const end = Date.now();
      console.log(`⏱️ ${name}: ${end - start}ms`);
    } else {
      fn();
    }
  },
  
  // Error helpers
  logError: (error: Error, context?: string) => {
    if (DEBUG_CONFIG.logErrorsToConsole) {
      console.error(`[ERROR]${context ? ` [${context}]` : ''}:`, error);
    }
  },
  
  // Network helpers
  logNetwork: (url: string, method: string, status?: number) => {
    if (DEBUG_CONFIG.logNetworkRequests) {
      const emoji = status && status >= 200 && status < 300 ? '✅' : '🌐';
      console.log(`${emoji} ${method} ${url}${status ? ` (${status})` : ''}`);
    }
  },
};

// Debug configuration validation
export const validateDebugConfig = () => {
  const issues: string[] = [];
  
  if (isProduction && DEBUG_CONFIG.logLevel === 'debug') {
    issues.push('Production should not use debug log level');
  }
  
  if (isProduction && DEBUG_CONFIG.enablePerformanceMonitoring) {
    issues.push('Performance monitoring should be disabled in production');
  }
  
  if (isProduction && DEBUG_CONFIG.enableNetworkDebugging) {
    issues.push('Network debugging should be disabled in production');
  }
  
  if (issues.length > 0) {
    console.warn('Debug configuration issues:', issues);
  }
  
  return issues.length === 0;
};

// Initialize debug configuration
export const initializeDebug = () => {
  if (isDevelopment) {
    console.log('🔧 Debug mode enabled');
    console.log('📱 Platform:', Platform.OS);
    console.log('🌍 Environment:', isDevelopment ? 'development' : 'production');
    
    // Validate configuration
    validateDebugConfig();
  }
};

export default {
  DEBUG_CONFIG,
  DEBUG_FEATURES,
  debugHelpers,
  validateDebugConfig,
  initializeDebug,
}; 