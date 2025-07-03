"use client"

import { useState, useRef } from "react"
import type { ExecutionStep, Variable } from "@/types/execution"
import { LanguageExecutor } from "@/lib/language-executors"

const MAX_ITERATIONS = 10 // Prevent infinite loops in visualization

interface ExecutionState {
  variables: Map<string, any>
  output: string[]
  currentLine: number
  stepId: number
  timestamp: number
}

class CodeExecutionSimulator {
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

    if (this.language === "javascript") {
      this.simulateJavaScript(code)
    } else {
      // For other languages, fall back to simple line-by-line parsing
      this.simulateGeneric(code)
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
    const lines = code.split("\n")
    let lineIndex = 0

    while (lineIndex < lines.length) {
      const line = lines[lineIndex].trim()
      this.state.currentLine = lineIndex + 1

      if (!line || line.startsWith("//")) {
        lineIndex++
        continue
      }

      try {
        lineIndex = this.processJavaScriptLine(line, lines, lineIndex)
      } catch (error) {
        this.addStep({
          line: this.state.currentLine,
          description: `Error: ${error}`,
          type: "error",
          variables: this.getVariablesArray(),
          callStack: ["main"],
          output: this.state.output.join("\n"),
        })
        break
      }

      lineIndex++
    }
  }

  private processJavaScriptLine(line: string, lines: string[], currentIndex: number): number {
    // Variable declarations and assignments
    if (line.match(/(let|const|var)\s+(\w+)\s*=\s*(.+)/)) {
      const match = line.match(/(let|const|var)\s+(\w+)\s*=\s*(.+)/)!
      const varName = match[2]
      const expression = match[3].replace(";", "")
      const value = this.evaluateExpression(expression)

      this.state.variables.set(varName, value)

      this.addStep({
        line: this.state.currentLine,
        description: `Declare variable: ${varName} = ${value}`,
        type: "variable_assignment",
        variables: this.getVariablesArray(),
        callStack: ["main"],
        output: this.state.output.join("\n"),
      })

      return currentIndex
    }

    // Variable assignments (without declaration)
    if (line.match(/^\s*(\w+)\s*=\s*(.+)/)) {
      const match = line.match(/^\s*(\w+)\s*=\s*(.+)/)!
      const varName = match[1]
      const expression = match[2].replace(";", "")
      const value = this.evaluateExpression(expression)

      this.state.variables.set(varName, value)

      this.addStep({
        line: this.state.currentLine,
        description: `Assign: ${varName} = ${value}`,
        type: "variable_assignment",
        variables: this.getVariablesArray(),
        callStack: ["main"],
        output: this.state.output.join("\n"),
      })

      return currentIndex
    }

    // For loops
    if (line.match(/for\s*\(/)) {
      return this.processForLoop(line, lines, currentIndex)
    }

    // While loops
    if (line.match(/while\s*\(/)) {
      return this.processWhileLoop(line, lines, currentIndex)
    }

    // If statements
    if (line.match(/if\s*\(/)) {
      return this.processIfStatement(line, lines, currentIndex)
    }

    // Console.log statements
    if (line.includes("console.log")) {
      const match = line.match(/console\.log\s*$$\s*([^)]+)\s*$$/)
      if (match) {
        const expression = match[1]
        const value = this.evaluateExpression(expression)
        this.state.output.push(String(value))

        this.addStep({
          line: this.state.currentLine,
          description: `Print: ${value}`,
          type: "output",
          variables: this.getVariablesArray(),
          callStack: ["main"],
          output: this.state.output.join("\n"),
        })
      }
      return currentIndex
    }

    // Function calls and other statements
    this.addStep({
      line: this.state.currentLine,
      description: `Execute: ${line}`,
      type: "statement",
      variables: this.getVariablesArray(),
      callStack: ["main"],
      output: this.state.output.join("\n"),
    })

    return currentIndex
  }

  private processForLoop(line: string, lines: string[], startIndex: number): number {
    const forMatch = line.match(/for\s*$$\s*(.+?)\s*;\s*(.+?)\s*;\s*(.+?)\s*$$/)
    if (!forMatch) return startIndex

    const [, init, condition, increment] = forMatch

    // Execute initialization
    if (init.includes("=")) {
      const initMatch = init.match(/(?:let|const|var)?\s*(\w+)\s*=\s*(.+)/)
      if (initMatch) {
        const varName = initMatch[1]
        const value = this.evaluateExpression(initMatch[2])
        this.state.variables.set(varName, value)
      }
    }

    this.addStep({
      line: this.state.currentLine,
      description: `Start for loop: ${init}; ${condition}; ${increment}`,
      type: "loop",
      variables: this.getVariablesArray(),
      callStack: ["main"],
      output: this.state.output.join("\n"),
    })

    // Find loop body
    const loopBody = this.extractBlockContent(lines, startIndex)
    let iterations = 0

    while (iterations < MAX_ITERATIONS && this.evaluateCondition(condition)) {
      iterations++

      this.addStep({
        line: this.state.currentLine,
        description: `Loop iteration ${iterations}`,
        type: "loop_iteration",
        variables: this.getVariablesArray(),
        callStack: ["main"],
        output: this.state.output.join("\n"),
      })

      // Execute loop body
      for (const bodyLine of loopBody) {
        if (bodyLine.trim()) {
          this.processJavaScriptLine(bodyLine.trim(), [bodyLine], 0)
        }
      }

      // Execute increment
      this.executeIncrement(increment)
    }

    this.addStep({
      line: this.state.currentLine,
      description: `End for loop (${iterations} iterations)`,
      type: "loop_end",
      variables: this.getVariablesArray(),
      callStack: ["main"],
      output: this.state.output.join("\n"),
    })

    return this.findBlockEnd(lines, startIndex)
  }

  private processWhileLoop(line: string, lines: string[], startIndex: number): number {
    const whileMatch = line.match(/while\s*$$\s*(.+?)\s*$$/)
    if (!whileMatch) return startIndex

    const condition = whileMatch[1]

    this.addStep({
      line: this.state.currentLine,
      description: `Start while loop: ${condition}`,
      type: "loop",
      variables: this.getVariablesArray(),
      callStack: ["main"],
      output: this.state.output.join("\n"),
    })

    const loopBody = this.extractBlockContent(lines, startIndex)
    let iterations = 0

    while (iterations < MAX_ITERATIONS && this.evaluateCondition(condition)) {
      iterations++

      this.addStep({
        line: this.state.currentLine,
        description: `While iteration ${iterations}: ${condition} is true`,
        type: "loop_iteration",
        variables: this.getVariablesArray(),
        callStack: ["main"],
        output: this.state.output.join("\n"),
      })

      // Execute loop body
      for (const bodyLine of loopBody) {
        if (bodyLine.trim()) {
          this.processJavaScriptLine(bodyLine.trim(), [bodyLine], 0)
        }
      }
    }

    this.addStep({
      line: this.state.currentLine,
      description: `End while loop: ${condition} is false`,
      type: "loop_end",
      variables: this.getVariablesArray(),
      callStack: ["main"],
      output: this.state.output.join("\n"),
    })

    return this.findBlockEnd(lines, startIndex)
  }

  private processIfStatement(line: string, lines: string[], startIndex: number): number {
    const ifMatch = line.match(/if\s*$$\s*(.+?)\s*$$/)
    if (!ifMatch) return startIndex

    const condition = ifMatch[1]
    const conditionResult = this.evaluateCondition(condition)

    this.addStep({
      line: this.state.currentLine,
      description: `If condition: ${condition} is ${conditionResult}`,
      type: "condition",
      variables: this.getVariablesArray(),
      callStack: ["main"],
      output: this.state.output.join("\n"),
    })

    if (conditionResult) {
      const ifBody = this.extractBlockContent(lines, startIndex)
      for (const bodyLine of ifBody) {
        if (bodyLine.trim()) {
          this.processJavaScriptLine(bodyLine.trim(), [bodyLine], 0)
        }
      }
    }

    return this.findBlockEnd(lines, startIndex)
  }

  private extractBlockContent(lines: string[], startIndex: number): string[] {
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

  private findBlockEnd(lines: string[], startIndex: number): number {
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

      if (foundOpenBrace && braceCount === 0) {
        return i
      }
    }

    return startIndex
  }

  private evaluateExpression(expr: string): any {
    try {
      // Replace variables with their values
      let evaluatedExpr = expr
      for (const [varName, value] of this.state.variables) {
        const regex = new RegExp(`\\b${varName}\\b`, "g")
        evaluatedExpr = evaluatedExpr.replace(regex, String(value))
      }

      // Handle simple arithmetic and string literals
      if (evaluatedExpr.match(/^[\d\s+\-*/().]+$/)) {
        return eval(evaluatedExpr)
      } else if (evaluatedExpr.startsWith('"') && evaluatedExpr.endsWith('"')) {
        return evaluatedExpr.slice(1, -1)
      } else if (evaluatedExpr.startsWith("'") && evaluatedExpr.endsWith("'")) {
        return evaluatedExpr.slice(1, -1)
      } else if (!isNaN(Number(evaluatedExpr))) {
        return Number(evaluatedExpr)
      }

      return evaluatedExpr
    } catch {
      return expr
    }
  }

  private evaluateCondition(condition: string): boolean {
    try {
      let evaluatedCondition = condition
      for (const [varName, value] of this.state.variables) {
        const regex = new RegExp(`\\b${varName}\\b`, "g")
        evaluatedCondition = evaluatedCondition.replace(regex, String(value))
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
        type: "statement",
        variables: [],
        callStack: ["main"],
        output: "",
      })
    }
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

    const steps: ExecutionStep[] = simulateExecution(code, language)
    setExecutionSteps(steps)

    if (steps.length > 0) {
      setCurrentLine(steps[0]?.line || -1)
      setVariables(steps[0]?.variables || [])
      setCallStack(steps[0]?.callStack || [])
    }
  }

  const simulateExecution = (code: string, language: string): ExecutionStep[] => {
    const steps: ExecutionStep[] = []
    let stepId = 1
    let timestamp = 0
    const variables: { [key: string]: any } = {}
    const MAX_ITERATIONS = 8

    // Add program start
    steps.push({
      id: `step-${stepId++}`,
      line: 1,
      variables: [],
      callStack: ["main"],
      output: "",
      timestamp: (timestamp += 100),
      description: "Program execution begins",
      type: "function_call",
    })

    if (language === "javascript") {
      const lines = code.split("\n")
      let i = 0

      while (i < lines.length) {
        const line = lines[i].trim()
        const lineNumber = i + 1

        if (!line || line.startsWith("//")) {
          i++
          continue
        }

        // Variable declarations
        if (line.includes("let ") || line.includes("const ") || line.includes("var ")) {
          const varMatch = line.match(/(let|const|var)\s+(\w+)\s*=\s*(.+)/)
          if (varMatch) {
            const [, , varName, valueStr] = varMatch
            const value = evaluateExpression(valueStr.replace(";", "").trim(), variables)
            variables[varName] = value

            steps.push({
              id: `step-${stepId++}`,
              line: lineNumber,
              variables: [{ name: varName, value, type: typeof value }],
              callStack: ["main"],
              output: "",
              timestamp: (timestamp += 100),
              description: `Declare ${varName} = ${value}`,
              type: "variable_assignment",
            })
          }
        }

        // Variable assignments
        else if (
          line.includes("=") &&
          !line.includes("==") &&
          !line.includes("!=") &&
          !line.includes("<=") &&
          !line.includes(">=") &&
          !line.includes("let") &&
          !line.includes("const") &&
          !line.includes("var")
        ) {
          const assignMatch = line.match(/(\w+)\s*=\s*(.+)/)
          if (assignMatch) {
            const [, varName, valueStr] = assignMatch
            const value = evaluateExpression(valueStr.replace(";", "").trim(), variables)
            variables[varName] = value

            steps.push({
              id: `step-${stepId++}`,
              line: lineNumber,
              variables: [{ name: varName, value, type: typeof value }],
              callStack: ["main"],
              output: "",
              timestamp: (timestamp += 100),
              description: `Assign ${varName} = ${value}`,
              type: "variable_assignment",
            })
          }
        }

        // For loops
        else if (line.includes("for ") && line.includes("(")) {
          const forMatch = line.match(
            /for\s*$$\s*(?:let|var|const)?\s*(\w+)\s*=\s*(\d+)\s*;\s*\w+\s*([<>]=?)\s*(\d+)\s*;\s*\w+(\+\+|--|\+=\s*\d+)\s*$$/,
          )
          if (forMatch) {
            const [, varName, startStr, operator, endStr] = forMatch
            const start = Number.parseInt(startStr)
            const end = Number.parseInt(endStr)

            // Determine iteration count and direction
            const iterations = []
            if (operator.includes("<")) {
              for (let val = start; val < end && iterations.length < MAX_ITERATIONS; val++) {
                iterations.push(val)
              }
            } else if (operator.includes(">")) {
              for (let val = start; val > end && iterations.length < MAX_ITERATIONS; val--) {
                iterations.push(val)
              }
            }

            // Loop start
            steps.push({
              id: `step-${stepId++}`,
              line: lineNumber,
              variables: Object.entries(variables).map(([name, value]) => ({ name, value, type: typeof value })),
              callStack: ["main"],
              output: "",
              timestamp: (timestamp += 100),
              description: `Start for loop: ${varName} from ${start} to ${end}`,
              type: "loop",
            })

            // Execute each iteration
            for (let iterIndex = 0; iterIndex < iterations.length; iterIndex++) {
              const currentValue = iterations[iterIndex]
              variables[varName] = currentValue

              // Loop condition check
              steps.push({
                id: `step-${stepId++}`,
                line: lineNumber,
                variables: [{ name: varName, value: currentValue, type: "number" }],
                callStack: ["main"],
                output: "",
                timestamp: (timestamp += 50),
                description: `Loop iteration ${iterIndex + 1}: ${varName} = ${currentValue}`,
                type: "condition",
              })

              // Execute loop body
              let bodyLineIndex = i + 1
              while (bodyLineIndex < lines.length) {
                const bodyLine = lines[bodyLineIndex].trim()
                const bodyLineNumber = bodyLineIndex + 1

                if (!bodyLine) {
                  bodyLineIndex++
                  continue
                }

                // Check for loop end (closing brace)
                if (bodyLine === "}") {
                  break
                }

                // Handle console.log in loop body
                if (bodyLine.includes("console.log")) {
                  const logMatch = bodyLine.match(/console\.log\s*$$\s*([^)]+)\s*$$/)
                  if (logMatch) {
                    const logValue = evaluateExpression(logMatch[1], variables)

                    steps.push({
                      id: `step-${stepId++}`,
                      line: bodyLineNumber,
                      variables: Object.entries(variables).map(([name, value]) => ({
                        name,
                        value,
                        type: typeof value,
                      })),
                      callStack: ["main"],
                      output: `Output: ${logValue}`,
                      timestamp: (timestamp += 50),
                      description: `Print: ${logValue}`,
                      type: "output",
                    })
                  }
                }

                // Handle variable assignments in loop body
                else if (bodyLine.includes("=") && !bodyLine.includes("==")) {
                  const assignMatch = bodyLine.match(/(\w+)\s*([+\-*/]?=)\s*(.+)/)
                  if (assignMatch) {
                    const [, varName, operator, valueStr] = assignMatch
                    const value = evaluateExpression(valueStr.replace(";", "").trim(), variables)

                    if (operator === "+=") {
                      variables[varName] = (variables[varName] || 0) + value
                    } else if (operator === "-=") {
                      variables[varName] = (variables[varName] || 0) - value
                    } else if (operator === "*=") {
                      variables[varName] = (variables[varName] || 0) * value
                    } else if (operator === "/=") {
                      variables[varName] = (variables[varName] || 0) / value
                    } else {
                      variables[varName] = value
                    }

                    steps.push({
                      id: `step-${stepId++}`,
                      line: bodyLineNumber,
                      variables: [{ name: varName, value: variables[varName], type: typeof variables[varName] }],
                      callStack: ["main"],
                      output: "",
                      timestamp: (timestamp += 50),
                      description: `${varName} ${operator} ${value} → ${variables[varName]}`,
                      type: "variable_assignment",
                    })
                  }
                }

                bodyLineIndex++
              }
            }

            // Loop end
            steps.push({
              id: `step-${stepId++}`,
              line: lineNumber,
              variables: Object.entries(variables).map(([name, value]) => ({ name, value, type: typeof value })),
              callStack: ["main"],
              output: "",
              timestamp: (timestamp += 100),
              description: `End for loop`,
              type: "loop",
            })

            // Skip to after the loop body
            let braceCount = 0
            let skipIndex = i + 1
            while (skipIndex < lines.length) {
              const skipLine = lines[skipIndex].trim()
              if (skipLine.includes("{")) braceCount++
              if (skipLine.includes("}")) {
                braceCount--
                if (braceCount <= 0) break
              }
              skipIndex++
            }
            i = skipIndex
          }
        }

        // While loops
        else if (line.includes("while ") && line.includes("(")) {
          const whileMatch = line.match(/while\s*$$\s*(\w+)\s*([<>]=?|[!=]=?)\s*(\w+|\d+)\s*$$/)
          if (whileMatch) {
            const [, leftVar, operator, rightVal] = whileMatch

            steps.push({
              id: `step-${stepId++}`,
              line: lineNumber,
              variables: Object.entries(variables).map(([name, value]) => ({ name, value, type: typeof value })),
              callStack: ["main"],
              output: "",
              timestamp: (timestamp += 100),
              description: `Start while loop: ${leftVar} ${operator} ${rightVal}`,
              type: "loop",
            })

            let iterations = 0
            while (iterations < MAX_ITERATIONS) {
              const leftValue = variables[leftVar] || 0
              const rightValue = isNaN(Number(rightVal)) ? variables[rightVal] || 0 : Number(rightVal)

              let conditionResult = false
              switch (operator) {
                case "<":
                  conditionResult = leftValue < rightValue
                  break
                case "<=":
                  conditionResult = leftValue <= rightValue
                  break
                case ">":
                  conditionResult = leftValue > rightValue
                  break
                case ">=":
                  conditionResult = leftValue >= rightValue
                  break
                case "==":
                  conditionResult = leftValue == rightValue
                  break
                case "!=":
                  conditionResult = leftValue != rightValue
                  break
              }

              if (!conditionResult) break

              steps.push({
                id: `step-${stepId++}`,
                line: lineNumber,
                variables: [{ name: leftVar, value: leftValue, type: typeof leftValue }],
                callStack: ["main"],
                output: "",
                timestamp: (timestamp += 50),
                description: `While condition true: ${leftVar} = ${leftValue}`,
                type: "condition",
              })

              // Execute loop body (simplified - just increment)
              variables[leftVar] = leftValue + 1
              iterations++

              steps.push({
                id: `step-${stepId++}`,
                line: lineNumber + 1,
                variables: [{ name: leftVar, value: variables[leftVar], type: typeof variables[leftVar] }],
                callStack: ["main"],
                output: "",
                timestamp: (timestamp += 50),
                description: `Increment ${leftVar} to ${variables[leftVar]}`,
                type: "variable_assignment",
              })
            }

            steps.push({
              id: `step-${stepId++}`,
              line: lineNumber,
              variables: Object.entries(variables).map(([name, value]) => ({ name, value, type: typeof value })),
              callStack: ["main"],
              output: "",
              timestamp: (timestamp += 100),
              description: `End while loop`,
              type: "loop",
            })
          }
        }

        // If statements
        else if (line.includes("if ") && line.includes("(")) {
          const condMatch = line.match(/if\s*$$\s*([^)]+)\s*$$/)
          if (condMatch) {
            const condition = condMatch[1]
            const result = evaluateCondition(condition, variables)

            steps.push({
              id: `step-${stepId++}`,
              line: lineNumber,
              variables: Object.entries(variables).map(([name, value]) => ({ name, value, type: typeof value })),
              callStack: ["main"],
              output: "",
              timestamp: (timestamp += 100),
              description: `Evaluate condition: ${condition} → ${result}`,
              type: "condition",
            })
          }
        }

        // Console.log
        else if (line.includes("console.log")) {
          const logMatch = line.match(/console\.log\s*$$\s*([^)]+)\s*$$/)
          if (logMatch) {
            const logValue = evaluateExpression(logMatch[1], variables)

            steps.push({
              id: `step-${stepId++}`,
              line: lineNumber,
              variables: Object.entries(variables).map(([name, value]) => ({ name, value, type: typeof value })),
              callStack: ["main"],
              output: `Output: ${logValue}`,
              timestamp: (timestamp += 100),
              description: `Print: ${logValue}`,
              type: "output",
            })
          }
        }

        i++
      }
    }

    // Add program end
    steps.push({
      id: `step-${stepId++}`,
      line: code.split("\n").length,
      variables: Object.entries(variables).map(([name, value]) => ({ name, value, type: typeof value })),
      callStack: [],
      output: "",
      timestamp: timestamp + 100,
      description: "Program execution completed",
      type: "return",
    })

    return steps
  }

  const evaluateExpression = (expr: string, variables: { [key: string]: any }): any => {
    expr = expr.trim().replace(/['"]/g, "")

    // Handle numbers
    if (/^\d+$/.test(expr)) return Number.parseInt(expr)
    if (/^\d+\.\d+$/.test(expr)) return Number.parseFloat(expr)

    // Handle variables
    if (variables[expr] !== undefined) return variables[expr]

    // Handle simple arithmetic
    const arithMatch = expr.match(/(\w+|\d+)\s*([+\-*/])\s*(\w+|\d+)/)
    if (arithMatch) {
      const [, left, op, right] = arithMatch
      const leftVal = variables[left] !== undefined ? variables[left] : isNaN(Number(left)) ? 0 : Number(left)
      const rightVal = variables[right] !== undefined ? variables[right] : isNaN(Number(right)) ? 0 : Number(right)

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
  }

  const evaluateCondition = (condition: string, variables: { [key: string]: any }): boolean => {
    const condMatch = condition.match(/(\w+|\d+)\s*([<>=!]+)\s*(\w+|\d+)/)
    if (condMatch) {
      const [, left, op, right] = condMatch
      const leftVal = variables[left] !== undefined ? variables[left] : isNaN(Number(left)) ? 0 : Number(left)
      const rightVal = variables[right] !== undefined ? variables[right] : isNaN(Number(right)) ? 0 : Number(right)

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
    return false
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
