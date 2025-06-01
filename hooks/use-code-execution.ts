"use client"

import { useState, useRef } from "react"
import type { ExecutionStep, Variable } from "@/types/execution"

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

  const runCode = async () => {
    setIsRunning(true)
    setError("")
    setOutput("")
    setCurrentLine(-1)

    try {
      const originalLog = console.log
      let capturedOutput = ""

      console.log = (...args) => {
        capturedOutput += args.join(" ") + "\n"
        originalLog(...args)
      }

      eval(code)
      console.log = originalLog
      setOutput(capturedOutput || "Code executed successfully")
    } catch (err: any) {
      setError(err.message)
      console.log = console.log
    }

    setIsRunning(false)
  }

  const parseCodeForExecution = (code: string): ExecutionStep[] => {
    const lines = code.split("\n")
    const steps: ExecutionStep[] = []
    let stepId = 1
    let timestamp = 0

    // Add program start step
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

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      const lineNumber = i + 1

      if (!line || line.startsWith("//")) continue

      // Function declarations
      if (line.includes("function ") || line.match(/^\s*\w+\s*\(/)) {
        const functionName = line.match(/function\s+(\w+)/) || line.match(/(\w+)\s*\(/)
        if (functionName) {
          steps.push({
            id: `step-${stepId++}`,
            line: lineNumber,
            variables: [],
            callStack: ["main"],
            output: "",
            timestamp: (timestamp += 100),
            description: `Define function: ${functionName[1]}`,
            type: "function_call",
          })
        }
      }

      // Variable declarations
      if (line.includes("let ") || line.includes("const ") || line.includes("var ")) {
        const varMatch = line.match(/(let|const|var)\s+(\w+)\s*=\s*(.+)/)
        if (varMatch) {
          const [, type, varName, value] = varMatch
          steps.push({
            id: `step-${stepId++}`,
            line: lineNumber,
            variables: [{ name: varName, value: value.replace(";", ""), type: "unknown" }],
            callStack: ["main"],
            output: "",
            timestamp: (timestamp += 100),
            description: `Declare variable: ${varName} = ${value.replace(";", "")}`,
            type: "variable_assignment",
          })
        }
      }

      // If statements
      if (line.includes("if ") && line.includes("(")) {
        const condition = line.match(/if\s*$$([^)]+)$$/)
        if (condition) {
          steps.push({
            id: `step-${stepId++}`,
            line: lineNumber,
            variables: [],
            callStack: ["main"],
            output: "",
            timestamp: (timestamp += 100),
            description: `Evaluate condition: ${condition[1]}`,
            type: "condition",
          })
        }
      }

      // For loops
      if (line.includes("for ") && line.includes("(")) {
        const forMatch = line.match(/for\s*$$([^)]+)$$/)
        if (forMatch) {
          steps.push({
            id: `step-${stepId++}`,
            line: lineNumber,
            variables: [],
            callStack: ["main"],
            output: "",
            timestamp: (timestamp += 100),
            description: `Start for loop: ${forMatch[1]}`,
            type: "loop",
          })
        }
      }

      // While loops
      if (line.includes("while ") && line.includes("(")) {
        const whileMatch = line.match(/while\s*$$([^)]+)$$/)
        if (whileMatch) {
          steps.push({
            id: `step-${stepId++}`,
            line: lineNumber,
            variables: [],
            callStack: ["main"],
            output: "",
            timestamp: (timestamp += 100),
            description: `Start while loop: ${whileMatch[1]}`,
            type: "loop",
          })
        }
      }

      // Function calls
      if (
        line.includes("(") &&
        line.includes(")") &&
        !line.includes("function") &&
        !line.includes("if") &&
        !line.includes("for") &&
        !line.includes("while")
      ) {
        const funcCall = line.match(/(\w+)\s*$$[^)]*$$/)
        if (funcCall) {
          steps.push({
            id: `step-${stepId++}`,
            line: lineNumber,
            variables: [],
            callStack: ["main", funcCall[1]],
            output: "",
            timestamp: (timestamp += 100),
            description: `Call function: ${funcCall[0]}`,
            type: "function_call",
          })
        }
      }

      // Console.log statements
      if (line.includes("console.log")) {
        const logMatch = line.match(/console\.log\s*$$([^)]+)$$/)
        if (logMatch) {
          steps.push({
            id: `step-${stepId++}`,
            line: lineNumber,
            variables: [],
            callStack: ["main"],
            output: `Output: ${logMatch[1]}`,
            timestamp: (timestamp += 100),
            description: `Print to console: ${logMatch[1]}`,
            type: "output",
          })
        }
      }

      // Return statements
      if (line.includes("return ")) {
        const returnMatch = line.match(/return\s+(.+)/)
        if (returnMatch) {
          steps.push({
            id: `step-${stepId++}`,
            line: lineNumber,
            variables: [],
            callStack: ["main"],
            output: "",
            timestamp: (timestamp += 100),
            description: `Return value: ${returnMatch[1].replace(";", "")}`,
            type: "return",
          })
        }
      }

      // Assignment statements (not declarations)
      if (
        line.includes("=") &&
        !line.includes("let") &&
        !line.includes("const") &&
        !line.includes("var") &&
        !line.includes("==") &&
        !line.includes("===")
      ) {
        const assignMatch = line.match(/(\w+)\s*=\s*(.+)/)
        if (assignMatch) {
          const [, varName, value] = assignMatch
          steps.push({
            id: `step-${stepId++}`,
            line: lineNumber,
            variables: [{ name: varName, value: value.replace(";", ""), type: "unknown" }],
            callStack: ["main"],
            output: "",
            timestamp: (timestamp += 100),
            description: `Update variable: ${varName} = ${value.replace(";", "")}`,
            type: "variable_assignment",
          })
        }
      }
    }

    // Add program end step
    steps.push({
      id: `step-${stepId++}`,
      line: lines.length,
      variables: [],
      callStack: [],
      output: "",
      timestamp: (timestamp += 100),
      description: "Program execution completed",
      type: "return",
    })

    return steps
  }

  const startDebug = () => {
    setIsDebugging(true)
    setCurrentStep(0)
    setError("")
    setOutput("")

    // Generate execution steps based on the actual code
    const steps: ExecutionStep[] = parseCodeForExecution(code)

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
