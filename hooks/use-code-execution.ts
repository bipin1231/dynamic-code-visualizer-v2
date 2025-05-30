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

  const startDebug = () => {
    setIsDebugging(true)
    setCurrentStep(0)
    setError("")
    setOutput("")

    // Generate execution steps based on code analysis
    const steps: ExecutionStep[] = generateExecutionSteps()

    setExecutionSteps(steps)
    setCurrentLine(steps[0]?.line || -1)
    setVariables(steps[0]?.variables || [])
    setCallStack(steps[0]?.callStack || [])
  }

  const generateExecutionSteps = (): ExecutionStep[] => {
    // This is a simplified simulation - in a real implementation,
    // you would parse and analyze the actual code
    return [
      {
        id: "step-1",
        line: 14,
        variables: [],
        callStack: ["main"],
        output: "",
        timestamp: 0,
        description: "Program starts execution",
        type: "function_call",
      },
      {
        id: "step-2",
        line: 14,
        variables: [],
        callStack: ["main", "fibonacci(5)"],
        output: "",
        timestamp: 100,
        description: "Call fibonacci(5)",
        type: "function_call",
      },
      {
        id: "step-3",
        line: 1,
        variables: [{ name: "n", value: 5, type: "number" }],
        callStack: ["main", "fibonacci(5)"],
        output: "",
        timestamp: 200,
        description: "Enter fibonacci function with n=5",
        type: "variable_assignment",
      },
      {
        id: "step-4",
        line: 2,
        variables: [{ name: "n", value: 5, type: "number" }],
        callStack: ["main", "fibonacci(5)"],
        output: "",
        timestamp: 300,
        description: "Check condition: n <= 1 (5 <= 1 = false)",
        type: "condition",
      },
      {
        id: "step-5",
        line: 5,
        variables: [
          { name: "n", value: 5, type: "number" },
          { name: "a", value: 0, type: "number" },
        ],
        callStack: ["main", "fibonacci(5)"],
        output: "",
        timestamp: 400,
        description: "Initialize variable a = 0",
        type: "variable_assignment",
      },
      {
        id: "step-6",
        line: 6,
        variables: [
          { name: "n", value: 5, type: "number" },
          { name: "a", value: 0, type: "number" },
          { name: "b", value: 1, type: "number" },
        ],
        callStack: ["main", "fibonacci(5)"],
        output: "",
        timestamp: 500,
        description: "Initialize variable b = 1",
        type: "variable_assignment",
      },
      {
        id: "step-7",
        line: 12,
        variables: [
          { name: "n", value: 5, type: "number" },
          { name: "a", value: 3, type: "number" },
          { name: "b", value: 5, type: "number" },
        ],
        callStack: ["main", "fibonacci(5)"],
        output: "",
        timestamp: 1500,
        description: "Return b (5)",
        type: "return",
      },
      {
        id: "step-8",
        line: 14,
        variables: [],
        callStack: ["main"],
        output: "Fibonacci of 5: 5",
        timestamp: 1600,
        description: "Output result to console",
        type: "output",
      },
    ]
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
