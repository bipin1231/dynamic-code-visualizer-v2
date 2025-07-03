import { useRef } from 'react';
import { v4 as uuid } from 'uuid';

export interface ExecutionStep {
  id: string;
  line: number;
  description: string;
  output: string;
  timestamp: number;
  type: string;
}

// Global steps array
const globalSteps: ExecutionStep[] = [];

// Global function that executed code will call
(window as any).emitStep = function emitStep(step: Partial<ExecutionStep>) {
  globalSteps.push({
    id: uuid(),
    timestamp: Date.now(),
    output: '',
    ...step
  } as ExecutionStep);
};

export function useTracer() {
  const stepsRef = useRef(globalSteps);
  
  const reset = () => {
    globalSteps.length = 0;
  };
  
  const getSteps = () => {
    return [...globalSteps];
  };
  
  return { 
    stepsRef, 
    reset, 
    getSteps 
  };
}