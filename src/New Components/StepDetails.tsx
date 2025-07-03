import React from "react";
import { ExecutionStep } from "../types";

interface StepDetailsProps {
  step: ExecutionStep;
}

const StepDetails: React.FC<StepDetailsProps> = ({ step }) => {
  return (
    <div>
      <h3>Step Details</h3>
      <p>{step.description}</p>
      <p>Line: {step.line}</p>
      <h4>Variables:</h4>
      <pre>{JSON.stringify(step.variables || {}, null, 2)}</pre>
      {step.output && (
        <>
          <h4>Output:</h4>
          <pre>{step.output}</pre>
        </>
      )}
    </div>
  );
};

export default StepDetails;
