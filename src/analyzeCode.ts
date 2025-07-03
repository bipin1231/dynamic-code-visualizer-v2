import { ExecutionStep } from "./types";

export function analyzeCode(code: string): ExecutionStep[] {
  const lines = code.split("\n");
  const steps: ExecutionStep[] = [];

  lines.forEach((line, idx) => {
    const step: ExecutionStep = {
      id: `${idx}`,
      type: "line",
      description: line.trim(),
      line: idx + 1,
      variables: {},
    };

    if (line.includes("if")) step.type = "condition";
    if (line.includes("for") || line.includes("while")) step.type = "loop";
    if (line.includes("function")) step.type = "function";
    if (line.includes("=")) step.type = "assignment";

    steps.push(step);
  });

  return steps;
}
