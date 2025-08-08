import { useEffect, useRef } from 'react';
import { logger } from '../utils/debugUtils';

interface DebugStateOptions {
  enabled?: boolean;
  logInitialState?: boolean;
  logStateChanges?: boolean;
  logStateDiffs?: boolean;
  componentName?: string;
}

export function useDebugState<T>(
  state: T,
  options: DebugStateOptions = {}
): void {
  const {
    enabled = __DEV__,
    logInitialState = true,
    logStateChanges = true,
    logStateDiffs = true,
    componentName = 'Component',
  } = options;

  const previousStateRef = useRef<T>();
  const isInitialRender = useRef(true);

  useEffect(() => {
    if (!enabled) return;

    const currentState = state;
    const previousState = previousStateRef.current;

    // Log initial state
    if (isInitialRender.current && logInitialState) {
      logger.debug(`🔍 [${componentName}] Initial state:`, currentState);
      isInitialRender.current = false;
    }

    // Log state changes
    if (!isInitialRender.current && logStateChanges) {
      if (logStateDiffs && previousState !== undefined) {
        // Create a diff of the state changes
        const diff = createStateDiff(previousState, currentState);
        if (Object.keys(diff).length > 0) {
          logger.debug(`🔄 [${componentName}] State changed:`, {
            previous: previousState,
            current: currentState,
            diff,
          });
        }
      } else {
        logger.debug(`🔄 [${componentName}] State changed:`, {
          previous: previousState,
          current: currentState,
        });
      }
    }

    // Update the previous state reference
    previousStateRef.current = currentState;
  }, [state, enabled, logInitialState, logStateChanges, logStateDiffs, componentName]);
}

// Helper function to create a diff between two states
function createStateDiff<T>(prevState: T, currentState: T): Record<string, any> {
  const diff: Record<string, any> = {};

  if (typeof prevState === 'object' && typeof currentState === 'object' && prevState !== null && currentState !== null) {
    const allKeys = new Set([
      ...Object.keys(prevState as Record<string, any>),
      ...Object.keys(currentState as Record<string, any>),
    ]);

    for (const key of allKeys) {
      const prevValue = (prevState as Record<string, any>)[key];
      const currentValue = (currentState as Record<string, any>)[key];

      if (prevValue !== currentValue) {
        diff[key] = {
          from: prevValue,
          to: currentValue,
        };
      }
    }
  } else if (prevState !== currentState) {
    diff['value'] = {
      from: prevState,
      to: currentState,
    };
  }

  return diff;
}

// Hook for debugging specific state values
export function useDebugValue<T>(
  value: T,
  label?: string,
  options: { enabled?: boolean; componentName?: string } = {}
): void {
  const { enabled = __DEV__, componentName = 'Component' } = options;

  useEffect(() => {
    if (!enabled) return;
    
    const valueLabel = label || 'Value';
    logger.debug(`🔍 [${componentName}] ${valueLabel}:`, value);
  }, [value, label, enabled, componentName]);
}

// Hook for debugging prop changes
export function useDebugProps<T extends Record<string, any>>(
  props: T,
  componentName?: string,
  options: { enabled?: boolean; logInitialProps?: boolean } = {}
): void {
  const { enabled = __DEV__, logInitialProps = true } = options;
  const previousPropsRef = useRef<T>();
  const isInitialRender = useRef(true);

  useEffect(() => {
    if (!enabled) return;

    const currentProps = props;
    const previousProps = previousPropsRef.current;

    // Log initial props
    if (isInitialRender.current && logInitialProps) {
      logger.debug(`🔍 [${componentName || 'Component'}] Initial props:`, currentProps);
      isInitialRender.current = false;
    }

    // Log prop changes
    if (!isInitialRender.current && previousProps !== undefined) {
      const diff = createStateDiff(previousProps, currentProps);
      if (Object.keys(diff).length > 0) {
        logger.debug(`🔄 [${componentName || 'Component'}] Props changed:`, {
          previous: previousProps,
          current: currentProps,
          diff,
        });
      }
    }

    // Update the previous props reference
    previousPropsRef.current = currentProps;
  }, [props, enabled, logInitialProps, componentName]);
}

// Hook for debugging effect dependencies
export function useDebugEffect(
  effectName: string,
  dependencies: any[],
  options: { enabled?: boolean; componentName?: string } = {}
): void {
  const { enabled = __DEV__, componentName = 'Component' } = options;
  const previousDepsRef = useRef<any[]>();

  useEffect(() => {
    if (!enabled) return;

    const currentDeps = dependencies;
    const previousDeps = previousDepsRef.current;

    if (previousDeps !== undefined) {
      const changedDeps = currentDeps.filter((dep, index) => dep !== previousDeps[index]);
      if (changedDeps.length > 0) {
        logger.debug(`⚡ [${componentName}] Effect "${effectName}" dependencies changed:`, {
          previous: previousDeps,
          current: currentDeps,
          changed: changedDeps,
        });
      }
    } else {
      logger.debug(`⚡ [${componentName}] Effect "${effectName}" initialized with dependencies:`, currentDeps);
    }

    previousDepsRef.current = currentDeps;
  }, dependencies);
}

export default {
  useDebugState,
  useDebugValue,
  useDebugProps,
  useDebugEffect,
}; 