import { v4 as uuid } from 'uuid';
import { ExecutionStep } from "@/types/execution"
export const executionSteps: ExecutionStep[] = [];

export function emitStep(step: Partial<ExecutionStep>) {
  executionSteps.push({
    id: uuid(),
    timestamp: Date.now(),
    variables: [],    // fill in with a snapshot helper (see next)
    callStack: [],    // you can maintain a manual stack if needed
    output: "",       // JS side, console logs come separately
    ...step
  });
}
