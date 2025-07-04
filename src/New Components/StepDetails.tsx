import React from "react";
import { ExecutionStep } from "../hooks/useTracer";

interface StepDetailsProps {
  step: ExecutionStep;
}

const basicInfoMap: Record<string, string> = {
  variable_declaration:
    "What is happening? A new variable is being declared and initialized with a value. This allocates memory for the variable.",
  variable_assignment:
    "What is happening? An existing variable is being updated with a new value.",
  variable_update:
    "What is happening? An existing variable is being modified using an update operator.",
  function_call:
    "What is happening? A function is being called, executing its code block with provided arguments.",
  loop_start:
    "What is happening? A loop is starting to repeatedly execute the block of code until the condition fails.",
  loop_condition:
    "What is happening? The loop condition is being checked to determine if another iteration should run.",
  loop_body_statement:
    "What is happening? A statement inside the loop body is being executed.",
  loop_update:
    "What is happening? The loop update expression is being executed after the loop body.",
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

  // Use the specific variable name from step metadata
  if (step.type === "variable_declaration" || step.type === "variable_assignment" || step.type === "variable_update") {
    const varName = step.variableName;
    if (varName) {
      const val = step.variables?.[varName];
      const expr = step.expressionCode || step.operator ? `${step.variableName}${step.operator}` : "the expression";
      
      if (step.type === "variable_declaration") {
        return `Declared variable '${varName}' and initialized it with: ${step.expressionCode}. 
                This evaluates to ${JSON.stringify(val)} and stores it in memory.`;
      }
      
      if (step.type === "variable_assignment") {
        return `Updated variable '${varName}' with: ${step.expressionCode}. 
                This expression evaluates to ${JSON.stringify(val)}. 
                The new value of ${varName} is now ${JSON.stringify(val)}.`;
      }
      
      if (step.type === "variable_update") {
        return `Updated variable '${varName}' using ${step.operator} operator. 
                The expression '${varName}${step.operator}' evaluates to ${JSON.stringify(val)}. 
                The new value of ${varName} is now ${JSON.stringify(val)}.`;
      }
    }
  }

  if (step.type === "loop_condition") {
    const conditionResult = step.conditionValue ? "true (loop continues)" : "false (loop exits)";
    return `Checking loop condition: ${step.expressionCode}. 
            This condition evaluates to ${conditionResult}.`;
  }

  if (step.type === "loop_start") {
    return `Loop starting at line ${currentLine}. 
            This will repeatedly execute the block of code until the condition becomes false. 
            ${step.description}`;
  }

  if (step.type === "loop_body_statement") {
    return `Executing statement inside loop body at line ${currentLine}. 
            This code runs once per iteration while the loop condition is true.`;
  }

  if (step.type === "loop_update") {
    return `Executing loop update: ${step.expressionCode}. 
            This updates loop variables after each iteration.`;
  }

  if (step.type === "function_call") {
    return `Calling function at line ${currentLine}. 
            ${step.description}. 
            Function arguments: ${step.functionArguments ? JSON.stringify(step.functionArguments) : 'none'}`;
  }

  if (step.type === "condition") {
    const conditionResult = step.conditionValue ? "true" : "false";
    return `Evaluating condition: ${step.expressionCode}. 
            This expression evaluates to ${conditionResult}, 
            so the ${conditionResult === "true" ? "if-block" : "else-block"} will execute.`;
  }

  if (step.type === "return") {
    return `Return statement at line ${currentLine}. 
            Function exits and returns ${step.returnValue ? JSON.stringify(step.returnValue) : 'undefined'}.`;
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
        <strong>What's happening on this line?</strong>
        <p className="mt-1 whitespace-pre-line">{detailedDescription}</p>
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
                <th className="border border-gray-600 px-2 py-1 text-left">Type</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(step.variables).map(([key, val]) => (
                <tr key={key} className="odd:bg-gray-800 even:bg-gray-700">
                  <td className="border border-gray-600 px-2 py-1">{key}</td>
                  <td className="border border-gray-600 px-2 py-1">{JSON.stringify(val)}</td>
                  <td className="border border-gray-600 px-2 py-1">{typeof val}</td>
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