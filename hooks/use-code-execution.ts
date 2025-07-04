"use client"

import { useState, useRef } from "react"
import type { ExecutionStep, Variable } from "@/types/execution"
import { LanguageExecutor } from "@/lib/language-executors"

interface ExecutionState {
  variables: Map<string, any>
  output: string[]
  currentLine: number
  stepId: number
  timestamp: number
}

class AdvancedCodeExecutionSimulator {
  private state: ExecutionState
  private steps: ExecutionStep[]
  private language: string

  constructor(language: string) {
    this.language = language
    this.state = {
      variables: new Map(),
      output: [],
      currentLine: 1,
      stepId: 1,
      timestamp: 0,
    }
    this.steps = []
  }

  simulate(code: string): ExecutionStep[] {
    this.steps = []
    this.state = {
      variables: new Map(),
      output: [],
      currentLine: 1,
      stepId: 1,
      timestamp: 0,
    }

    // Add initial step
    this.addStep({
      line: 1,
      description: "Program execution begins",
      type: "function_call",
      variables: [],
      callStack: ["main"],
      output: "",
    })

    try {
      if (this.language === "javascript") {
        this.simulateJavaScript(code)
      } else if (this.language === "python") {
        this.simulatePython(code)
      } else {
        this.simulateGeneric(code)
      }
    } catch (error) {
      this.addStep({
        line: this.state.currentLine,
        description: `Error: ${error}`,
        type: "output",
        variables: this.getVariablesArray(),
        callStack: ["main"],
        output: `Error: ${error}`,
      })
    }

    // Add final step
    this.addStep({
      line: this.state.currentLine,
      description: "Program execution completed",
      type: "return",
      variables: this.getVariablesArray(),
      callStack: [],
      output: this.state.output.join("\n"),
    })

    return this.steps
  }

  private simulateJavaScript(code: string) {
    const lines = code
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("//"))

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      this.state.currentLine = i + 1

      this.processJavaScriptLine(line, lines, i)
    }
  }

  private simulatePython(code: string) {
    const lines = code
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      this.state.currentLine = i + 1

      this.processPythonLine(line, lines, i)
    }
  }

  private processJavaScriptLine(line: string, lines: string[], index: number) {
    // Variable declarations
    if (line.match(/(let|const|var)\s+(\w+)\s*=\s*(.+)/)) {
      const match = line.match(/(let|const|var)\s+(\w+)\s*=\s*(.+)/)!
      const [, keyword, varName, expression] = match
      const value = this.evaluateExpression(expression.replace(";", ""))

      this.state.variables.set(varName, value)

      this.addStep({
        line: this.state.currentLine,
        description: `Declare variable: ${varName} = ${this.formatValue(value)}`,
        type: "variable_assignment",
        variables: this.getVariablesArray(),
        callStack: ["main"],
        output: this.state.output.join("\n"),
      })
      return
    }

    // Variable assignments
    if (line.match(/^\s*(\w+)\s*=\s*(.+)/) && !line.includes("==")) {
      const match = line.match(/^\s*(\w+)\s*=\s*(.+)/)!
      const [, varName, expression] = match
      const value = this.evaluateExpression(expression.replace(";", ""))

      this.state.variables.set(varName, value)

      this.addStep({
        line: this.state.currentLine,
        description: `Assign: ${varName} = ${this.formatValue(value)}`,
        type: "variable_assignment",
        variables: this.getVariablesArray(),
        callStack: ["main"],
        output: this.state.output.join("\n"),
      })
      return
    }

    // For loops
    if (line.match(/for\s*\(/)) {
      this.processJavaScriptForLoop(line, lines, index)
      return
    }

    // While loops
    if (line.match(/while\s*\(/)) {
      this.processJavaScriptWhileLoop(line, lines, index)
      return
    }

    // If statements
    if (line.match(/if\s*\(/)) {
      this.processJavaScriptIfStatement(line, lines, index)
      return
    }

    // Console.log
    if (line.includes("console.log")) {
      const match = line.match(/console\.log\s*$$\s*([^)]+)\s*$$/)
      if (match) {
        const expression = match[1]
        const value = this.evaluateExpression(expression)
        const output = this.formatValue(value)

        this.state.output.push(output)

        this.addStep({
          line: this.state.currentLine,
          description: `Print: ${output}`,
          type: "output",
          variables: this.getVariablesArray(),
          callStack: ["main"],
          output: this.state.output.join("\n"),
        })
      }
      return
    }

    // Function calls and other statements
    this.addStep({
      line: this.state.currentLine,
      description: `Execute: ${line}`,
      type: "function_call",
      variables: this.getVariablesArray(),
      callStack: ["main"],
      output: this.state.output.join("\n"),
    })
  }

  private processPythonLine(line: string, lines: string[], index: number) {
    // Variable assignments
    if (
      line.includes("=") &&
      !line.includes("==") &&
      !line.includes("!=") &&
      !line.includes("<=") &&
      !line.includes(">=")
    ) {
      const [varName, expression] = line.split("=").map((s) => s.trim())
      const value = this.evaluateExpression(expression)

      this.state.variables.set(varName, value)

      this.addStep({
        line: this.state.currentLine,
        description: `Assign: ${varName} = ${this.formatValue(value)}`,
        type: "variable_assignment",
        variables: this.getVariablesArray(),
        callStack: ["main"],
        output: this.state.output.join("\n"),
      })
      return
    }

    // For loops
    if (line.match(/for\s+\w+\s+in\s+/)) {
      this.processPythonForLoop(line, lines, index)
      return
    }

    // While loops
    if (line.match(/while\s+.+:/)) {
      this.processPythonWhileLoop(line, lines, index)
      return
    }

    // If statements
    if (line.match(/if\s+.+:/)) {
      this.processPythonIfStatement(line, lines, index)
      return
    }

    // Print statements
    if (line.startsWith("print(")) {
      const match = line.match(/print$$\s*([^)]+)\s*$$/)
      if (match) {
        const expression = match[1]
        const value = this.evaluateExpression(expression)
        const output = this.formatValue(value)

        this.state.output.push(output)

        this.addStep({
          line: this.state.currentLine,
          description: `Print: ${output}`,
          type: "output",
          variables: this.getVariablesArray(),
          callStack: ["main"],
          output: this.state.output.join("\n"),
        })
      }
      return
    }

    // Other statements
    this.addStep({
      line: this.state.currentLine,
      description: `Execute: ${line}`,
      type: "function_call",
      variables: this.getVariablesArray(),
      callStack: ["main"],
      output: this.state.output.join("\n"),
    })
  }

  private processJavaScriptForLoop(line: string, lines: string[], startIndex: number) {
    const forMatch = line.match(/for\s*$$\s*(.+?)\s*;\s*(.+?)\s*;\s*(.+?)\s*$$/)
    if (!forMatch) return

    const [, init, condition, increment] = forMatch

    // Execute initialization
    if (init.includes("=")) {
      const initMatch = init.match(/(?:let|const|var)?\s*(\w+)\s*=\s*(.+)/)
      if (initMatch) {
        const [, varName, value] = initMatch
        const evalValue = this.evaluateExpression(value)
        this.state.variables.set(varName, evalValue)

        this.addStep({
          line: this.state.currentLine,
          description: `Initialize loop variable: ${varName} = ${evalValue}`,
          type: "variable_assignment",
          variables: this.getVariablesArray(),
          callStack: ["main"],
          output: this.state.output.join("\n"),
        })
      }
    }

    this.addStep({
      line: this.state.currentLine,
      description: `Start for loop`,
      type: "loop",
      variables: this.getVariablesArray(),
      callStack: ["main"],
      output: this.state.output.join("\n"),
    })

    // Simulate loop iterations
    let iterations = 0
    const MAX_ITERATIONS = 10

    while (iterations < MAX_ITERATIONS && this.evaluateCondition(condition)) {
      iterations++

      this.addStep({
        line: this.state.currentLine,
        description: `Loop iteration ${iterations}: condition ${condition} is true`,
        type: "condition",
        variables: this.getVariablesArray(),
        callStack: ["main"],
        output: this.state.output.join("\n"),
      })

      // Execute loop body (simplified)
      const bodyLines = this.extractLoopBody(lines, startIndex)
      for (const bodyLine of bodyLines) {
        if (bodyLine.trim()) {
          this.processJavaScriptLine(bodyLine.trim(), [bodyLine], 0)
        }
      }

      // Execute increment
      this.executeIncrement(increment)
    }

    this.addStep({
      line: this.state.currentLine,
      description: `End for loop after ${iterations} iterations`,
      type: "loop",
      variables: this.getVariablesArray(),
      callStack: ["main"],
      output: this.state.output.join("\n"),
    })
  }

  private processJavaScriptWhileLoop(line: string, lines: string[], startIndex: number) {
    const whileMatch = line.match(/while\s*$$\s*(.+?)\s*$$/)
    if (!whileMatch) return

    const condition = whileMatch[1]

    this.addStep({
      line: this.state.currentLine,
      description: `Start while loop: ${condition}`,
      type: "loop",
      variables: this.getVariablesArray(),
      callStack: ["main"],
      output: this.state.output.join("\n"),
    })

    let iterations = 0
    const MAX_ITERATIONS = 10

    while (iterations < MAX_ITERATIONS && this.evaluateCondition(condition)) {
      iterations++

      this.addStep({
        line: this.state.currentLine,
        description: `While iteration ${iterations}: ${condition} is true`,
        type: "condition",
        variables: this.getVariablesArray(),
        callStack: ["main"],
        output: this.state.output.join("\n"),
      })

      // Execute loop body
      const bodyLines = this.extractLoopBody(lines, startIndex)
      for (const bodyLine of bodyLines) {
        if (bodyLine.trim()) {
          this.processJavaScriptLine(bodyLine.trim(), [bodyLine], 0)
        }
      }
    }

    this.addStep({
      line: this.state.currentLine,
      description: `End while loop: ${condition} is false`,
      type: "loop",
      variables: this.getVariablesArray(),
      callStack: ["main"],
      output: this.state.output.join("\n"),
    })
  }

  private processJavaScriptIfStatement(line: string, lines: string[], startIndex: number) {
    const ifMatch = line.match(/if\s*$$\s*(.+?)\s*$$/)
    if (!ifMatch) return

    const condition = ifMatch[1]
    const conditionResult = this.evaluateCondition(condition)

    this.addStep({
      line: this.state.currentLine,
      description: `Evaluate condition: ${condition} → ${conditionResult}`,
      type: "condition",
      variables: this.getVariablesArray(),
      callStack: ["main"],
      output: this.state.output.join("\n"),
    })

    if (conditionResult) {
      this.addStep({
        line: this.state.currentLine,
        description: `Condition is true, executing if block`,
        type: "condition",
        variables: this.getVariablesArray(),
        callStack: ["main"],
        output: this.state.output.join("\n"),
      })

      // Execute if body
      const bodyLines = this.extractLoopBody(lines, startIndex)
      for (const bodyLine of bodyLines) {
        if (bodyLine.trim()) {
          this.processJavaScriptLine(bodyLine.trim(), [bodyLine], 0)
        }
      }
    } else {
      this.addStep({
        line: this.state.currentLine,
        description: `Condition is false, skipping if block`,
        type: "condition",
        variables: this.getVariablesArray(),
        callStack: ["main"],
        output: this.state.output.join("\n"),
      })
    }
  }

  private processPythonForLoop(line: string, lines: string[], startIndex: number) {
    const forMatch = line.match(/for\s+(\w+)\s+in\s+(.+):/)
    if (!forMatch) return

    const [, varName, iterableExpr] = forMatch
    const iterable = this.evaluateExpression(iterableExpr)

    this.addStep({
      line: this.state.currentLine,
      description: `Start for loop: ${varName} in ${iterableExpr}`,
      type: "loop",
      variables: this.getVariablesArray(),
      callStack: ["main"],
      output: this.state.output.join("\n"),
    })

    if (Array.isArray(iterable)) {
      for (let i = 0; i < Math.min(iterable.length, 10); i++) {
        const item = iterable[i]
        this.state.variables.set(varName, item)

        this.addStep({
          line: this.state.currentLine,
          description: `Loop iteration ${i + 1}: ${varName} = ${this.formatValue(item)}`,
          type: "variable_assignment",
          variables: this.getVariablesArray(),
          callStack: ["main"],
          output: this.state.output.join("\n"),
        })

        // Execute loop body
        const bodyLines = this.extractPythonBlock(lines, startIndex)
        for (const bodyLine of bodyLines) {
          if (bodyLine.trim()) {
            this.processPythonLine(bodyLine.trim(), [bodyLine], 0)
          }
        }
      }
    }

    this.addStep({
      line: this.state.currentLine,
      description: `End for loop`,
      type: "loop",
      variables: this.getVariablesArray(),
      callStack: ["main"],
      output: this.state.output.join("\n"),
    })
  }

  private processPythonWhileLoop(line: string, lines: string[], startIndex: number) {
    const whileMatch = line.match(/while\s+(.+):/)
    if (!whileMatch) return

    const condition = whileMatch[1]

    this.addStep({
      line: this.state.currentLine,
      description: `Start while loop: ${condition}`,
      type: "loop",
      variables: this.getVariablesArray(),
      callStack: ["main"],
      output: this.state.output.join("\n"),
    })

    let iterations = 0
    const MAX_ITERATIONS = 10

    while (iterations < MAX_ITERATIONS && this.evaluateCondition(condition)) {
      iterations++

      this.addStep({
        line: this.state.currentLine,
        description: `While iteration ${iterations}: ${condition} is true`,
        type: "condition",
        variables: this.getVariablesArray(),
        callStack: ["main"],
        output: this.state.output.join("\n"),
      })

      // Execute loop body
      const bodyLines = this.extractPythonBlock(lines, startIndex)
      for (const bodyLine of bodyLines) {
        if (bodyLine.trim()) {
          this.processPythonLine(bodyLine.trim(), [bodyLine], 0)
        }
      }
    }

    this.addStep({
      line: this.state.currentLine,
      description: `End while loop: ${condition} is false`,
      type: "loop",
      variables: this.getVariablesArray(),
      callStack: ["main"],
      output: this.state.output.join("\n"),
    })
  }

  private processPythonIfStatement(line: string, lines: string[], startIndex: number) {
    const ifMatch = line.match(/if\s+(.+):/)
    if (!ifMatch) return

    const condition = ifMatch[1]
    const conditionResult = this.evaluateCondition(condition)

    this.addStep({
      line: this.state.currentLine,
      description: `Evaluate condition: ${condition} → ${conditionResult}`,
      type: "condition",
      variables: this.getVariablesArray(),
      callStack: ["main"],
      output: this.state.output.join("\n"),
    })

    if (conditionResult) {
      this.addStep({
        line: this.state.currentLine,
        description: `Condition is true, executing if block`,
        type: "condition",
        variables: this.getVariablesArray(),
        callStack: ["main"],
        output: this.state.output.join("\n"),
      })

      // Execute if body
      const bodyLines = this.extractPythonBlock(lines, startIndex)
      for (const bodyLine of bodyLines) {
        if (bodyLine.trim()) {
          this.processPythonLine(bodyLine.trim(), [bodyLine], 0)
        }
      }
    } else {
      this.addStep({
        line: this.state.currentLine,
        description: `Condition is false, skipping if block`,
        type: "condition",
        variables: this.getVariablesArray(),
        callStack: ["main"],
        output: this.state.output.join("\n"),
      })
    }
  }

  private extractLoopBody(lines: string[], startIndex: number): string[] {
    const body: string[] = []
    let braceCount = 0
    let foundOpenBrace = false

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i]

      if (line.includes("{")) {
        foundOpenBrace = true
        braceCount += (line.match(/\{/g) || []).length
      }

      if (line.includes("}")) {
        braceCount -= (line.match(/\}/g) || []).length
      }

      if (foundOpenBrace && braceCount > 0) {
        const cleanLine = line
          .replace(/^\s*\{/, "")
          .replace(/\}\s*$/, "")
          .trim()
        if (cleanLine) {
          body.push(cleanLine)
        }
      }

      if (foundOpenBrace && braceCount === 0) {
        break
      }
    }

    return body
  }

  private extractPythonBlock(lines: string[], startIndex: number): string[] {
    const body: string[] = []
    const baseIndent = this.getIndentation(lines[startIndex])

    for (let i = startIndex + 1; i < lines.length; i++) {
      const line = lines[i]
      const indent = this.getIndentation(line)

      if (line.trim() === "") continue

      if (indent > baseIndent) {
        body.push(line)
      } else {
        break
      }
    }

    return body
  }

  private getIndentation(line: string): number {
    return line.length - line.trimStart().length
  }

  private evaluateExpression(expr: string): any {
    try {
      expr = expr.trim()

      // Handle string literals
      if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
        return expr.slice(1, -1)
      }

      // Handle numbers
      if (/^\d+$/.test(expr)) return Number.parseInt(expr)
      if (/^\d+\.\d+$/.test(expr)) return Number.parseFloat(expr)

      // Handle boolean literals
      if (expr === "true" || expr === "True") return true
      if (expr === "false" || expr === "False") return false

      // Handle variables
      if (this.state.variables.has(expr)) {
        return this.state.variables.get(expr)
      }

      // Handle range function (Python)
      if (expr.startsWith("range(")) {
        const argsStr = expr.slice(6, -1)
        const args = argsStr.split(",").map((arg) => this.evaluateExpression(arg.trim()))

        if (args.length === 1) {
          return Array.from({ length: args[0] }, (_, i) => i)
        } else if (args.length === 2) {
          return Array.from({ length: args[1] - args[0] }, (_, i) => i + args[0])
        }
        return []
      }

      // Handle simple arithmetic
      const arithMatch = expr.match(/(\w+|\d+)\s*([+\-*/])\s*(\w+|\d+)/)
      if (arithMatch) {
        const [, left, op, right] = arithMatch
        const leftVal = this.state.variables.has(left)
          ? this.state.variables.get(left)
          : isNaN(Number(left))
            ? 0
            : Number(left)
        const rightVal = this.state.variables.has(right)
          ? this.state.variables.get(right)
          : isNaN(Number(right))
            ? 0
            : Number(right)

        switch (op) {
          case "+":
            return leftVal + rightVal
          case "-":
            return leftVal - rightVal
          case "*":
            return leftVal * rightVal
          case "/":
            return leftVal / rightVal
        }
      }

      return expr
    } catch {
      return expr
    }
  }

  private evaluateCondition(condition: string): boolean {
    try {
      // Replace variables with their values
      let evaluatedCondition = condition
      for (const [varName, value] of this.state.variables) {
        const regex = new RegExp(`\\b${varName}\\b`, "g")
        evaluatedCondition = evaluatedCondition.replace(regex, String(value))
      }

      // Handle comparison operators
      const compMatch = evaluatedCondition.match(/(.+?)\s*([<>=!]+)\s*(.+)/)
      if (compMatch) {
        const [, left, op, right] = compMatch
        const leftVal = isNaN(Number(left)) ? left : Number(left)
        const rightVal = isNaN(Number(right)) ? right : Number(right)

        switch (op) {
          case "<":
            return leftVal < rightVal
          case "<=":
            return leftVal <= rightVal
          case ">":
            return leftVal > rightVal
          case ">=":
            return leftVal >= rightVal
          case "==":
            return leftVal == rightVal
          case "!=":
            return leftVal != rightVal
        }
      }

      return Boolean(eval(evaluatedCondition))
    } catch {
      return false
    }
  }

  private executeIncrement(increment: string) {
    try {
      if (increment.includes("++")) {
        const varName = increment.replace("++", "").trim()
        const currentValue = this.state.variables.get(varName) || 0
        this.state.variables.set(varName, currentValue + 1)
      } else if (increment.includes("--")) {
        const varName = increment.replace("--", "").trim()
        const currentValue = this.state.variables.get(varName) || 0
        this.state.variables.set(varName, currentValue - 1)
      } else if (increment.includes("+=")) {
        const [varName, value] = increment.split("+=").map((s) => s.trim())
        const currentValue = this.state.variables.get(varName) || 0
        const incrementValue = this.evaluateExpression(value)
        this.state.variables.set(varName, currentValue + incrementValue)
      }
    } catch (error) {
      console.warn("Failed to execute increment:", increment, error)
    }
  }

  private simulateGeneric(code: string) {
    const lines = code.split("\n")

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line || line.startsWith("//") || line.startsWith("#")) continue

      this.addStep({
        line: i + 1,
        description: `Execute: ${line}`,
        type: "function_call",
        variables: [],
        callStack: ["main"],
        output: "",
      })
    }
  }

  private formatValue(value: any): string {
    if (typeof value === "string") {
      return `"${value}"`
    }
    return String(value)
  }

  private addStep(stepData: Omit<ExecutionStep, "id" | "timestamp">) {
    this.steps.push({
      id: `step-${this.state.stepId++}`,
      timestamp: (this.state.timestamp += 100),
      ...stepData,
    })
  }

  private getVariablesArray(): Variable[] {
    return Array.from(this.state.variables.entries()).map(([name, value]) => ({
      name,
      value,
      type: typeof value,
    }))
  }
}

export function useCodeExecution(code: string) {
  const [isRunning, setIsRunning] = useState(false)
  const [isDebugging, setIsDebugging] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([])
  const [output, setOutput] = useState("")
  const [error, setError] = useState("")
  const [currentLine, setCurrentLine] = useState(-1)
  const [variables, setVariables] = useState<Variable[]>([])
  const [callStack, setCallStack] = useState<string[]>([])
  const [executionSpeed, setExecutionSpeed] = useState(1000)
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)

  const autoPlayRef = useRef<NodeJS.Timeout>()
  const executorRef = useRef(new LanguageExecutor())

  const runCode = async (language = "javascript") => {
    setIsRunning(true)
    setError("")
    setOutput("")
    setCurrentLine(-1)

    try {
      let result

      switch (language) {
        case "javascript":
          result = executorRef.current.executeJavaScript(code)
          break
        case "python":
          result = await executorRef.current.executePistonAPI(code, "python")
          break
        case "c":
          result = await executorRef.current.executeC(code)
          break
        case "cpp":
          result = await executorRef.current.executeCpp(code)
          break
        case "java":
          result = await executorRef.current.executeJava(code)
          break
        default:
          result = {
            output: "",
            error: `Language ${language} not supported`,
            success: false,
          }
      }

      if (result.success) {
        setOutput(result.output + (result.executionTime ? `\n\nExecution time: ${result.executionTime}ms` : ""))
      } else {
        setError(result.error)
      }
    } catch (err: any) {
      setError(err.message || "Execution failed")
    }

    setIsRunning(false)
  }

  const startDebug = (language = "javascript") => {
    setIsDebugging(true)
    setCurrentStep(0)
    setError("")
    setOutput("")

    const simulator = new AdvancedCodeExecutionSimulator(language)
    const steps = simulator.simulate(code)
    setExecutionSteps(steps)

    if (steps.length > 0) {
      setCurrentLine(steps[0]?.line || -1)
      setVariables(steps[0]?.variables || [])
      setCallStack(steps[0]?.callStack || [])
    }
  }

  const stepForward = () => {
    if (currentStep < executionSteps.length - 1) {
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)
      const step = executionSteps[nextStep]
      setCurrentLine(step.line)
      setVariables(step.variables)
      setCallStack(step.callStack)
      if (step.output) setOutput(step.output)
    }
  }

  const stepBackward = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1
      setCurrentStep(prevStep)
      const step = executionSteps[prevStep]
      setCurrentLine(step.line)
      setVariables(step.variables)
      setCallStack(step.callStack)
      setOutput(step.output)
    }
  }

  const jumpToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < executionSteps.length) {
      setCurrentStep(stepIndex)
      const step = executionSteps[stepIndex]
      setCurrentLine(step.line)
      setVariables(step.variables)
      setCallStack(step.callStack)
      setOutput(step.output)
    }
  }

  const toggleAutoPlay = () => {
    if (isAutoPlaying) {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
      }
      setIsAutoPlaying(false)
    } else {
      setIsAutoPlaying(true)
      autoPlayRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= executionSteps.length - 1) {
            setIsAutoPlaying(false)
            if (autoPlayRef.current) {
              clearInterval(autoPlayRef.current)
            }
            return prev
          }
          const nextStep = prev + 1
          const step = executionSteps[nextStep]
          setCurrentLine(step.line)
          setVariables(step.variables)
          setCallStack(step.callStack)
          if (step.output) setOutput(step.output)
          return nextStep
        })
      }, executionSpeed)
    }
  }

  const stopExecution = () => {
    setIsRunning(false)
    setIsDebugging(false)
    setCurrentStep(0)
    setCurrentLine(-1)
    setExecutionSteps([])
    setIsAutoPlaying(false)
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current)
    }
  }

  const reset = () => {
    setIsRunning(false)
    setIsDebugging(false)
    setCurrentStep(0)
    setCurrentLine(-1)
    setExecutionSteps([])
    setOutput("")
    setError("")
    setVariables([])
    setCallStack([])
    setIsAutoPlaying(false)
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current)
    }
  }

  return {
    isRunning,
    isDebugging,
    currentStep,
    executionSteps,
    output,
    error,
    currentLine,
    variables,
    callStack,
    executionSpeed,
    isAutoPlaying,
    runCode,
    startDebug,
    stepForward,
    stepBackward,
    jumpToStep,
    toggleAutoPlay,
    stopExecution,
    reset,
    setExecutionSpeed,
  }
}
