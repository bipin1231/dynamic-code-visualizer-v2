import { ExecutionStep } from "../types";
import { v4 as uuid } from "uuid";

export class RuntimeExecutor {
  private steps: ExecutionStep[] = [];
  private terminalOutput: string[] = [];

  getSteps() {
    return this.steps;
  }

  getTerminalOutput() {
    return this.terminalOutput;
  }

  reset() {
    this.steps = [];
    this.terminalOutput = [];
    (window as any).__variables__ = {}; // reset
  }

  execute(code: string) {
    this.reset();

    const emitStep = (step: Partial<ExecutionStep>) => {
      this.steps.push({
        id: uuid(),
        type: step.type || "unknown",
        description: step.description || "",
        line: step.line || 0,
        variables: { ...(step.variables || {}) }
      });
    };

    const originalConsoleLog = console.log;

    const customLog = (...args: any[]) => {
      const message = args.map((arg) => String(arg)).join(" ");
      this.terminalOutput.push(message);
      emitStep({
        type: "log",
        description: `console.log: ${message}`,
        line: 0,
        variables: { ...(window as any).__variables__ }
      });
      originalConsoleLog(...args);
    };

    (window as any).emitStep = emitStep;
    (console as any).log = customLog;

    // Initialize __variables__ on window
    (window as any).__variables__ = {};

    const instrumentedCode = `
      with(window.__variables__) {
        ${code}
      }
    `;
    const func = new Function(instrumentedCode);
    func();
  }
}
