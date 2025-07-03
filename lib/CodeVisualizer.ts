import Interpreter from "js-interpreter"

export class CodeVisualizer {
  interpreter: any
  onStepCallback: (info: { line: number; scopeVars: Record<string, any> }) => void

  constructor(code: string, onStepCallback: (info: { line: number; scopeVars: Record<string, any> }) => void) {
    this.onStepCallback = onStepCallback
    this.interpreter = new Interpreter(code, this.initFunc)
  }

  initFunc(interpreter: any, globalObject: any) {
    // You can expose APIs here if needed
  }

  step() {
    if (this.interpreter.step()) {
      const line = this.interpreter.stateStack?.at(-1)?.node?.loc?.start?.line ?? -1
      const scopeVars: Record<string, any> = {}

      try {
        const scope = this.interpreter.getScope()
        for (const name in scope.properties) {
          scopeVars[name] = scope.properties[name]?.toString()
        }
      } catch {}

      this.onStepCallback({ line, scopeVars })
    }
  }
}
