import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DEBUG_CONFIG } from '../config/debug';
import { logger } from '../utils/debugUtils';
import DebugMenu from './DebugMenu';

interface DebugButtonProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  size?: number;
  showLabel?: boolean;
}

export const DebugButton: React.FC<DebugButtonProps> = ({
  position = 'bottom-right',
  size = 50,
  showLabel = false,
}) => {
  const [menuVisible, setMenuVisible] = useState(false);

  const handlePress = () => {
    logger.debug('Debug button pressed');
    setMenuVisible(true);
  };

  const handleLongPress = () => {
    logger.info('Debug button long pressed - showing quick info');
    // You can add quick debug actions here
  };

  // Only show in development
  if (!DEBUG_CONFIG.enabled) {
    return null;
  }

  const getPositionStyle = () => {
    const margin = 20;
    switch (position) {
      case 'top-right':
        return { top: margin, right: margin };
      case 'top-left':
        return { top: margin, left: margin };
      case 'bottom-right':
        return { bottom: margin, right: margin };
      case 'bottom-left':
        return { bottom: margin, left: margin };
      default:
        return { bottom: margin, right: margin };
    }
  };

  return (
    <>
      <View style={[styles.container, getPositionStyle()]}>
        <TouchableOpacity
          style={[
            styles.button,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
          onPress={handlePress}
          onLongPress={handleLongPress}
          activeOpacity={0.7}
        >
          <Text style={[styles.buttonText, { fontSize: size * 0.4 }]}>🐛</Text>
        </TouchableOpacity>
        
        {showLabel && (
          <View style={styles.labelContainer}>
            <Text style={styles.labelText}>Debug</Text>
          </View>
        )}
      </View>

      <DebugMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 9999,
  },
  button: {
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  labelContainer: {
    position: 'absolute',
    top: '100%',
    left: '50%',
    transform: [{ translateX: -20 }],
    marginTop: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  labelText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default DebugButton; 