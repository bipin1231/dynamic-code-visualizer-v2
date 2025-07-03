import { useRef, useEffect } from 'react';
import { v4 as uuid } from 'uuid';

export interface ExecutionStep {
  id: string;
  line: number;
  description: string;
  output?: string;
  timestamp: number;
  type: string;
  variables?: Record<string, any>;
  [key: string]: any; // For additional properties
}

// Global steps array with maximum limit
const MAX_STEPS = 1000;
const globalSteps: ExecutionStep[] = [];

// Only define in browser environment
if (typeof window !== 'undefined') {
  // Global function that executed code will call
  (window as any).emitStep = function emitStep(step: Partial<ExecutionStep>) {
    // Prevent infinite step collection
    if (globalSteps.length >= MAX_STEPS) {
      console.error('Maximum step limit reached');
      return;
    }
    
    // Capture current variables state
    const context = (window as any).__executionContext;
    const variables = context ? { ...context.__variables__ } : {};
    
    // Calculate nest level for visualization
    const nestLevel = globalSteps.filter(s => 
      s.type.includes('loop_start') || s.type.includes('condition_start')
    ).length;
    
    globalSteps.push({
      id: uuid(),
      timestamp: Date.now(),
      variables,
      nestLevel,
      ...step
    } as ExecutionStep);
  };
}

export function useTracer() {
  const stepsRef = useRef(globalSteps);
  
  const reset = () => {
    globalSteps.length = 0;
  };
  
  const getSteps = () => {
    return [...globalSteps];
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      reset();
    };
  }, []);
  
  return { 
    stepsRef, 
    reset, 
    getSteps 
  };
}