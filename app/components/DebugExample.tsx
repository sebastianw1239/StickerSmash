import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { logger, performanceMonitor, handleError, withErrorHandling } from '../utils/debugUtils';
import { useDebugState, useDebugValue, useDebugProps } from '../hooks/useDebugState';
import { debugAxios } from '../utils/networkDebugger';
import ErrorBoundary from './ErrorBoundary';
import DebugButton from './DebugButton';

interface DebugExampleProps {
  title: string;
  userId?: string;
}

export const DebugExample: React.FC<DebugExampleProps> = ({ title, userId = '123' }) => {
  const [count, setCount] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Debug state changes
  useDebugState(count, {
    componentName: 'DebugExample',
    logStateChanges: true,
    logStateDiffs: true,
  });

  // Debug user state
  useDebugState(user, {
    componentName: 'DebugExample',
    logStateChanges: true,
  });

  // Debug specific prop
  useDebugValue(userId, 'userId', { componentName: 'DebugExample' });

  // Debug all props
  useDebugProps({ title, userId }, 'DebugExample');

  // Example of performance monitoring
  const handleIncrement = () => {
    performanceMonitor.startTimer('increment-operation');
    
    try {
      setCount(prev => prev + 1);
      logger.debug('Count incremented', { newCount: count + 1 });
    } catch (error) {
      handleError(error as Error, 'DebugExample.handleIncrement');
    } finally {
      performanceMonitor.endTimer('increment-operation');
    }
  };

  // Example of async error handling
  const fetchUser = withErrorHandling(async (id: string) => {
    performanceMonitor.startTimer('user-fetch');
    
    try {
      logger.info('Fetching user data', { userId: id });
      
      // Simulate API call with debugAxios
      const response = await debugAxios.get(`https://jsonplaceholder.typicode.com/users/${id}`);
      
      logger.info('User data fetched successfully', { user: response.data });
      setUser(response.data);
      
      return response.data;
    } finally {
      performanceMonitor.endTimer('user-fetch');
    }
  }, 'DebugExample.fetchUser');

  // Example of error boundary test
  const triggerError = () => {
    throw new Error('This is a test error for debugging purposes');
  };

  // Example of performance stats
  const showPerformanceStats = () => {
    const stats = performanceMonitor.getPerformanceStats();
    const statsText = Object.entries(stats)
      .map(([key, value]) => `${key}: ${value?.toFixed(2)}ms`)
      .join('\n');
    
    Alert.alert('Performance Statistics', statsText || 'No performance data available');
  };

  // Example of test logs
  const logTestMessages = () => {
    logger.debug('Debug message from DebugExample');
    logger.info('Info message from DebugExample');
    logger.warn('Warning message from DebugExample');
    logger.error('Error message from DebugExample');
    
    Alert.alert('Test Logs', 'Test messages have been logged to the console');
  };

  // Example of network request
  const loadUser = async () => {
    setLoading(true);
    try {
      await fetchUser(userId);
    } catch (error) {
      Alert.alert('Error', 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    logger.debug('DebugExample component mounted', { title, userId });
    
    return () => {
      logger.debug('DebugExample component unmounted');
    };
  }, [title, userId]);

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>State Debugging</Text>
          <Text style={styles.counter}>Count: {count}</Text>
          <TouchableOpacity style={styles.button} onPress={handleIncrement}>
            <Text style={styles.buttonText}>Increment</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Network Debugging</Text>
          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={loadUser}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Loading...' : 'Load User Data'}
            </Text>
          </TouchableOpacity>
          
          {user && (
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Debug Tools</Text>
          <TouchableOpacity style={styles.button} onPress={logTestMessages}>
            <Text style={styles.buttonText}>Test Logs</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button} onPress={showPerformanceStats}>
            <Text style={styles.buttonText}>Performance Stats</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button} onPress={triggerError}>
            <Text style={styles.buttonText}>Trigger Error</Text>
          </TouchableOpacity>
        </View>

        {/* Debug button for quick access to debug menu */}
        <DebugButton position="bottom-right" size={50} showLabel={true} />
      </View>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 15,
  },
  counter: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  userInfo: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#e9ecef',
    borderRadius: 5,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
  },
  userEmail: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 5,
  },
});

export default DebugExample; 