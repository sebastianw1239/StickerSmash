import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  Switch,
} from 'react-native';
import { logger, performanceMonitor, setDebugMode, getDebugMode } from '../utils/debugUtils';
import { debugHelpers, DEBUG_CONFIG } from '../config/debug';

interface DebugMenuProps {
  visible: boolean;
  onClose: () => void;
}

interface DebugMenuItem {
  id: string;
  title: string;
  description: string;
  action: () => void;
  type: 'button' | 'toggle' | 'info';
  value?: boolean;
}

export const DebugMenu: React.FC<DebugMenuProps> = ({ visible, onClose }) => {
  const [debugMode, setDebugModeState] = useState(getDebugMode());
  const [showPerformanceStats, setShowPerformanceStats] = useState(false);

  const toggleDebugMode = () => {
    const newMode = !debugMode;
    setDebugMode(newMode);
    setDebugModeState(newMode);
    logger.info(`Debug mode ${newMode ? 'enabled' : 'disabled'}`);
  };

  const logTestMessage = () => {
    logger.debug('Test debug message');
    logger.info('Test info message');
    logger.warn('Test warning message');
    logger.error('Test error message');
    Alert.alert('Test Logs', 'Test messages have been logged to the console');
  };

  const showPerformanceStats = () => {
    const stats = performanceMonitor.getPerformanceStats();
    const statsText = Object.entries(stats)
      .map(([key, value]) => `${key}: ${value?.toFixed(2)}ms`)
      .join('\n');
    
    Alert.alert('Performance Statistics', statsText || 'No performance data available');
  };

  const clearPerformanceData = () => {
    performanceMonitor.clearMeasurements();
    Alert.alert('Performance Data Cleared', 'All performance measurements have been cleared');
  };

  const showEnvironmentInfo = () => {
    const info = {
      environment: debugHelpers.getEnvironment(),
      platform: DEBUG_CONFIG.platform,
      isDevelopment: debugHelpers.isDevelopment,
      isProduction: debugHelpers.isProduction,
      debugMode: getDebugMode(),
      timestamp: new Date().toISOString(),
    };
    
    Alert.alert('Environment Info', JSON.stringify(info, null, 2));
  };

  const testErrorBoundary = () => {
    throw new Error('Test error for debugging purposes');
  };

  const debugMenuItems: DebugMenuItem[] = [
    {
      id: 'debug-mode',
      title: 'Debug Mode',
      description: 'Enable/disable debug logging',
      action: toggleDebugMode,
      type: 'toggle',
      value: debugMode,
    },
    {
      id: 'test-logs',
      title: 'Test Logs',
      description: 'Log test messages at different levels',
      action: logTestMessage,
      type: 'button',
    },
    {
      id: 'performance-stats',
      title: 'Performance Stats',
      description: 'Show performance statistics',
      action: showPerformanceStats,
      type: 'button',
    },
    {
      id: 'clear-performance',
      title: 'Clear Performance Data',
      description: 'Clear all performance measurements',
      action: clearPerformanceData,
      type: 'button',
    },
    {
      id: 'environment-info',
      title: 'Environment Info',
      description: 'Show current environment information',
      action: showEnvironmentInfo,
      type: 'button',
    },
    {
      id: 'test-error',
      title: 'Test Error Boundary',
      description: 'Trigger a test error to test error handling',
      action: testErrorBoundary,
      type: 'button',
    },
  ];

  const renderMenuItem = (item: DebugMenuItem) => {
    switch (item.type) {
      case 'toggle':
        return (
          <View key={item.id} style={styles.menuItem}>
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>{item.title}</Text>
              <Text style={styles.menuItemDescription}>{item.description}</Text>
            </View>
            <Switch
              value={item.value}
              onValueChange={item.action}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={item.value ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>
        );

      case 'button':
        return (
          <TouchableOpacity key={item.id} style={styles.menuItem} onPress={item.action}>
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>{item.title}</Text>
              <Text style={styles.menuItemDescription}>{item.description}</Text>
            </View>
            <Text style={styles.menuItemArrow}>→</Text>
          </TouchableOpacity>
        );

      case 'info':
        return (
          <View key={item.id} style={styles.menuItem}>
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>{item.title}</Text>
              <Text style={styles.menuItemDescription}>{item.description}</Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  if (!DEBUG_CONFIG.enabled) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🔧 Debug Menu</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Debugging Tools</Text>
            {debugMenuItems.map(renderMenuItem)}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Environment</Text>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Environment:</Text>
              <Text style={styles.infoValue}>{debugHelpers.getEnvironment()}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Platform:</Text>
              <Text style={styles.infoValue}>{DEBUG_CONFIG.platform}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Debug Mode:</Text>
              <Text style={styles.infoValue}>{getDebugMode() ? 'Enabled' : 'Disabled'}</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#495057',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#6c757d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 15,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 18,
  },
  menuItemArrow: {
    fontSize: 18,
    color: '#6c757d',
    marginLeft: 10,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6c757d',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
  },
});

export default DebugMenu; 