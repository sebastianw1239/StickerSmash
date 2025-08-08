import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { logger, performanceMonitor, debugNetworkRequest, debugNetworkResponse } from './debugUtils';

interface NetworkDebugConfig {
  enabled?: boolean;
  logRequests?: boolean;
  logResponses?: boolean;
  logErrors?: boolean;
  logPerformance?: boolean;
  maxResponseSize?: number;
}

class NetworkDebugger {
  private config: Required<NetworkDebugConfig>;
  private axiosInstance: AxiosInstance;

  constructor(axiosInstance: AxiosInstance, config: NetworkDebugConfig = {}) {
    this.axiosInstance = axiosInstance;
    this.config = {
      enabled: __DEV__,
      logRequests: true,
      logResponses: true,
      logErrors: true,
      logPerformance: true,
      maxResponseSize: 1000,
      ...config,
    };

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        if (this.config.enabled && this.config.logRequests) {
          const startTime = Date.now();
          performanceMonitor.startTimer(`request_${config.url}`);
          
          debugNetworkRequest({
            url: config.url,
            method: config.method || 'GET',
            headers: config.headers,
            data: config.data,
            params: config.params,
          });

          // Store start time for response logging
          (config as any).__startTime = startTime;
        }
        return config;
      },
      (error) => {
        if (this.config.enabled && this.config.logErrors) {
          logger.error('Request interceptor error:', error);
        }
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        if (this.config.enabled) {
          const startTime = (response.config as any).__startTime;
          const responseTime = startTime ? Date.now() - startTime : 0;
          
          if (this.config.logPerformance) {
            performanceMonitor.endTimer(`request_${response.config.url}`);
          }

          if (this.config.logResponses) {
            const responseData = this.truncateResponseData(response.data);
            debugNetworkResponse(response, responseTime);
            
            logger.debug(`✅ Response details:`, {
              status: response.status,
              statusText: response.statusText,
              headers: response.headers,
              data: responseData,
              responseTime,
            });
          }
        }
        return response;
      },
      (error: AxiosError) => {
        if (this.config.enabled) {
          const startTime = (error.config as any)?.__startTime;
          const responseTime = startTime ? Date.now() - startTime : 0;
          
          if (this.config.logPerformance) {
            performanceMonitor.endTimer(`request_${error.config?.url}`);
          }

          if (this.config.logErrors) {
            logger.error('Network request failed:', {
              url: error.config?.url,
              method: error.config?.method,
              status: error.response?.status,
              statusText: error.response?.statusText,
              responseTime,
              error: {
                message: error.message,
                code: error.code,
                response: error.response?.data,
              },
            });
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private truncateResponseData(data: any): any {
    if (!data) return data;
    
    const dataStr = JSON.stringify(data);
    if (dataStr.length <= this.config.maxResponseSize) {
      return data;
    }
    
    return {
      ...data,
      __truncated: true,
      __originalSize: dataStr.length,
      __truncatedSize: this.config.maxResponseSize,
    };
  }

  // Method to get performance statistics
  getPerformanceStats(): Record<string, number | null> {
    const stats: Record<string, number | null> = {};
    
    // Get average times for all tracked requests
    const requestKeys = Array.from(performanceMonitor['timers'].keys());
    requestKeys.forEach(key => {
      const avgTime = performanceMonitor.getAverageTime(key);
      if (avgTime !== null) {
        stats[key] = avgTime;
      }
    });
    
    return stats;
  }

  // Method to clear performance data
  clearPerformanceData(): void {
    performanceMonitor.clearMeasurements();
  }

  // Method to enable/disable debugging
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    logger.info(`Network debugging ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Method to configure logging options
  configureLogging(options: Partial<NetworkDebugConfig>): void {
    this.config = { ...this.config, ...options };
    logger.info('Network debugging configuration updated:', this.config);
  }

  // Get the axios instance with debugging
  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}

// Create a default axios instance with debugging
export const createDebugAxios = (config?: NetworkDebugConfig): AxiosInstance => {
  const axiosInstance = axios.create();
  const debugger = new NetworkDebugger(axiosInstance, config);
  return debugger.getAxiosInstance();
};

// Export the NetworkDebugger class
export { NetworkDebugger };

// Default axios instance with debugging
export const debugAxios = createDebugAxios();

// Utility functions for manual network debugging
export const logNetworkRequest = (config: AxiosRequestConfig): void => {
  if (__DEV__) {
    debugNetworkRequest(config);
  }
};

export const logNetworkResponse = (response: AxiosResponse, responseTime: number): void => {
  if (__DEV__) {
    debugNetworkResponse(response, responseTime);
  }
};

export const logNetworkError = (error: AxiosError): void => {
  if (__DEV__) {
    logger.error('Network error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      response: error.response?.data,
    });
  }
};

export default {
  NetworkDebugger,
  createDebugAxios,
  debugAxios,
  logNetworkRequest,
  logNetworkResponse,
  logNetworkError,
}; 