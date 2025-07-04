import React from "react";
import { ExecutionStep } from "../hooks/useTracer";

interface StepDetailsProps {
  step: ExecutionStep;
}

const basicInfoMap: Record<string, string> = {
  variable_declaration:
    "What is happening? A new variable is being declared and possibly initialized with a value. This allocates memory for the variable.",
  variable_assignment:
    "What is happening? An existing variable is being updated with a new value.",
  function_call:
    "What is happening? A function is being called, executing its code block with provided arguments.",
  loop_start:
    "What is happening? A loop is starting to repeatedly execute the block of code until the condition fails.",
  loop_iteration:
    "What is happening? The loop is performing an iteration, executing the loop body once more.",
  condition:
    "What is happening? A conditional check is performed to decide the flow of execution.",
  return:
    "What is happening? The function is returning a value and exiting its execution.",
  log:
    "What is happening? Output is being logged to the console.",
};

const generateDetailedDescription = (step: ExecutionStep) => {
  const allVars = step.variables || {};
  const currentLine = step.line;

  // Assume each variable was declared/assigned on its own line (best-effort)
  const variableNames = Object.keys(allVars);

  // Simplify: show only first variable if multiple exist
  if (step.type === "variable_declaration" || step.type === "variable_assignment") {
    const firstVar = variableNames[0];
    const val = allVars[firstVar];

    if (step.type === "variable_declaration") {
      return `Declared variable '${firstVar}' with initial value: ${JSON.stringify(
        val
      )}. This reserves memory and stores the value.`;
    }

    if (step.type === "variable_assignment") {
      return `Updated variable '${firstVar}' to: ${JSON.stringify(
        val
      )}. This changes the stored value in memory.`;
    }
  }

  if (step.type === "function_call") {
    return `A function was called at line ${currentLine}. ${step.description}`;
  }

  if (step.type === "loop_start") {
    return `Loop starting at line ${currentLine}. ${step.description}`;
  }

  if (step.type === "loop_iteration") {
    return `Loop iteration at line ${currentLine}. Executes the loop body again.`;
  }

  if (step.type === "condition") {
    return `Conditional check at line ${currentLine}. Directs the flow based on the evaluated expression.`;
  }

  if (step.type === "return") {
    return `Return statement at line ${currentLine}. Function exits and returns a value.`;
  }

  if (step.type === "log") {
    return `Console output at line ${currentLine}: ${step.output || step.description}`;
  }

  return step.description;
};


const StepDetails: React.FC<StepDetailsProps> = ({ step }) => {
  const basicInfo = basicInfoMap[step.type] || "No basic info available.";
  const detailedDescription = generateDetailedDescription(step);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Step Details</h3>

      <div className="mb-4">
        <strong>Basic Info:</strong>
        <p className="mt-1 text-gray-300">{basicInfo}</p>
      </div>

      <div className="mb-4">
        <strong>What’s happening on this line?</strong>
        <p className="mt-1">{detailedDescription}</p>
      </div>

      <div className="mb-4">
        <strong>Type:</strong> {step.type}
      </div>
      <div className="mb-4">
        <strong>Line:</strong> {step.line}
      </div>

      {step.variables && Object.keys(step.variables).length > 0 && (
        <>
          <h4 className="font-semibold mb-1">Variables:</h4>
          <table className="w-full table-auto text-sm border border-gray-600 rounded">
            <thead>
              <tr className="bg-gray-700">
                <th className="border border-gray-600 px-2 py-1 text-left">Variable</th>
                <th className="border border-gray-600 px-2 py-1 text-left">Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(step.variables).map(([key, val]) => (
                <tr key={key} className="odd:bg-gray-800 even:bg-gray-700">
                  <td className="border border-gray-600 px-2 py-1">{key}</td>
                  <td className="border border-gray-600 px-2 py-1">{JSON.stringify(val)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {step.output && (
        <>
          <h4 className="font-semibold mt-3 mb-1">Output:</h4>
          <pre className="bg-gray-800 p-2 rounded">{step.output}</pre>
        </>
      )}
    </div>
  );
};

export default StepDetails;
