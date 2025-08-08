import { Platform } from 'react-native';

// Debug configuration
export const DEBUG_CONFIG = {
  enabled: __DEV__,
  logLevel: 'debug' as 'error' | 'warn' | 'info' | 'debug',
  showTimestamps: true,
  showPlatform: true,
  maxLogLength: 1000,
};

// Log levels
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Performance monitoring
class PerformanceMonitor {
  private timers: Map<string, number> = new Map();
  private measurements: Map<string, number[]> = new Map();

  startTimer(name: string): void {
    if (!DEBUG_CONFIG.enabled) return;
    this.timers.set(name, Date.now());
  }

  endTimer(name: string): number | null {
    if (!DEBUG_CONFIG.enabled) return null;
    const startTime = this.timers.get(name);
    if (!startTime) return null;

    const duration = Date.now() - startTime;
    this.timers.delete(name);

    // Store measurement for statistics
    if (!this.measurements.has(name)) {
      this.measurements.set(name, []);
    }
    this.measurements.get(name)!.push(duration);

    return duration;
  }

  getAverageTime(name: string): number | null {
    const measurements = this.measurements.get(name);
    if (!measurements || measurements.length === 0) return null;
    return measurements.reduce((sum, time) => sum + time, 0) / measurements.length;
  }

  clearMeasurements(): void {
    this.measurements.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Enhanced logging
class Logger {
  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = DEBUG_CONFIG.showTimestamps ? `[${new Date().toISOString()}]` : '';
    const platform = DEBUG_CONFIG.showPlatform ? `[${Platform.OS}]` : '';
    const prefix = `${timestamp}${platform} [${level.toUpperCase()}]`;
    
    let formattedMessage = `${prefix} ${message}`;
    
    if (data !== undefined) {
      const dataStr = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);
      if (dataStr.length > DEBUG_CONFIG.maxLogLength) {
        formattedMessage += `\n${dataStr.substring(0, DEBUG_CONFIG.maxLogLength)}...`;
      } else {
        formattedMessage += `\n${dataStr}`;
      }
    }
    
    return formattedMessage;
  }

  private shouldLog(level: string): boolean {
    if (!DEBUG_CONFIG.enabled) return false;
    return LOG_LEVELS[level as keyof typeof LOG_LEVELS] <= LOG_LEVELS[DEBUG_CONFIG.logLevel];
  }

  error(message: string, data?: any): void {
    if (!this.shouldLog('error')) return;
    console.error(this.formatMessage('ERROR', message, data));
  }

  warn(message: string, data?: any): void {
    if (!this.shouldLog('warn')) return;
    console.warn(this.formatMessage('WARN', message, data));
  }

  info(message: string, data?: any): void {
    if (!this.shouldLog('info')) return;
    console.info(this.formatMessage('INFO', message, data));
  }

  debug(message: string, data?: any): void {
    if (!this.shouldLog('debug')) return;
    console.log(this.formatMessage('DEBUG', message, data));
  }

  // Network request logging
  logRequest(url: string, method: string, headers?: any, body?: any): void {
    this.debug(`🌐 ${method.toUpperCase()} ${url}`, {
      headers,
      body: body ? JSON.stringify(body, null, 2) : undefined,
    });
  }

  logResponse(url: string, status: number, responseTime: number, data?: any): void {
    const emoji = status >= 200 && status < 300 ? '✅' : '❌';
    this.debug(`${emoji} ${status} ${url} (${responseTime}ms)`, data);
  }

  // State debugging
  logState(componentName: string, state: any, action?: string): void {
    this.debug(`🔍 [${componentName}] State ${action ? `(${action})` : ''}`, state);
  }

  // Component lifecycle
  logLifecycle(componentName: string, lifecycle: string, props?: any): void {
    this.debug(`🔄 [${componentName}] ${lifecycle}`, props);
  }
}

export const logger = new Logger();

// Error handling utilities
export const handleError = (error: Error, context?: string): void => {
  logger.error(`Error${context ? ` in ${context}` : ''}: ${error.message}`, {
    stack: error.stack,
    name: error.name,
  });
};

// Async error wrapper
export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => R | Promise<R>,
  context?: string
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error as Error, context);
      throw error;
    }
  };
};

// Debug helpers
export const debugObject = (obj: any, name?: string): void => {
  if (!DEBUG_CONFIG.enabled) return;
  const objName = name || 'Object';
  logger.debug(`🔍 ${objName}:`, obj);
};

export const debugArray = (arr: any[], name?: string): void => {
  if (!DEBUG_CONFIG.enabled) return;
  const arrName = name || 'Array';
  logger.debug(`📋 ${arrName} (${arr.length} items):`, arr);
};

// Memory usage (approximate)
export const logMemoryUsage = (): void => {
  if (!DEBUG_CONFIG.enabled) return;
  // Note: React Native doesn't provide direct memory access
  // This is a placeholder for when memory APIs become available
  logger.debug('💾 Memory usage not available in React Native');
};

// Network debugging
export const debugNetworkRequest = (config: any): void => {
  if (!DEBUG_CONFIG.enabled) return;
  logger.logRequest(config.url, config.method, config.headers, config.data);
};

export const debugNetworkResponse = (response: any, responseTime: number): void => {
  if (!DEBUG_CONFIG.enabled) return;
  logger.logResponse(
    response.config?.url || 'unknown',
    response.status,
    responseTime,
    response.data
  );
};

// Development utilities
export const isDevelopment = (): boolean => __DEV__;

export const isProduction = (): boolean => !__DEV__;

export const getEnvironment = (): string => __DEV__ ? 'development' : 'production';

// Debug mode toggle
let debugMode = DEBUG_CONFIG.enabled;

export const setDebugMode = (enabled: boolean): void => {
  debugMode = enabled;
  logger.info(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
};

export const getDebugMode = (): boolean => debugMode;

// Export all utilities
export default {
  logger,
  performanceMonitor,
  handleError,
  withErrorHandling,
  debugObject,
  debugArray,
  logMemoryUsage,
  debugNetworkRequest,
  debugNetworkResponse,
  isDevelopment,
  isProduction,
  getEnvironment,
  setDebugMode,
  getDebugMode,
}; 