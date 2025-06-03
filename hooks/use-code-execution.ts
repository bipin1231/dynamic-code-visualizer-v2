"use client"

import { useState, useRef } from "react"
import type { ExecutionStep, Variable } from "@/types/execution"
import { LanguageExecutor } from "@/lib/language-executors"

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

    const steps: ExecutionStep[] = parseCodeForExecution(code, language)
    setExecutionSteps(steps)

    if (steps.length > 0) {
      setCurrentLine(steps[0]?.line || -1)
      setVariables(steps[0]?.variables || [])
      setCallStack(steps[0]?.callStack || [])
    }
  }

  const parseCodeForExecution = (code: string, language: string): ExecutionStep[] => {
    const lines = code.split("\n")
    const steps: ExecutionStep[] = []
    let stepId = 1
    let timestamp = 0

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

      if (!line || line.startsWith("//") || line.startsWith("#")) continue

      if (language === "javascript" && (line.includes("function ") || line.match(/^\s*\w+\s*\(/))) {
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

      if (language === "python" && line.startsWith("def ")) {
        const functionName = line.match(/def\s+(\w+)/)
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

      if (
        (language === "c" || language === "cpp" || language === "java") &&
        line.includes("(") &&
        line.includes(")") &&
        !line.includes("if") &&
        !line.includes("for") &&
        !line.includes("while")
      ) {
        const functionMatch = line.match(/(\w+)\s+(\w+)\s*\(/)
        if (functionMatch) {
          steps.push({
            id: `step-${stepId++}`,
            line: lineNumber,
            variables: [],
            callStack: ["main"],
            output: "",
            timestamp: (timestamp += 100),
            description: `Define function: ${functionMatch[2]}`,
            type: "function_call",
          })
        }
      }

      if (language === "javascript" && (line.includes("let ") || line.includes("const ") || line.includes("var "))) {
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

      if (
        line.includes("=") &&
        !line.includes("==") &&
        !line.includes("!=") &&
        !line.includes("<=") &&
        !line.includes(">=")
      ) {
        const assignMatch = line.match(/(\w+)\s*=\s*(.+)/)
        if (
          assignMatch &&
          !(language === "javascript" && (line.includes("let") || line.includes("const") || line.includes("var")))
        ) {
          const [, varName, value] = assignMatch
          steps.push({
            id: `step-${stepId++}`,
            line: lineNumber,
            variables: [{ name: varName, value: value.replace(";", ""), type: "unknown" }],
            callStack: ["main"],
            output: "",
            timestamp: (timestamp += 100),
            description: `Assign variable: ${varName} = ${value.replace(";", "")}`,
            type: "variable_assignment",
          })
        }
      }

      if (
        (language === "javascript" || language === "c" || language === "cpp" || language === "java") &&
        line.includes("if ") &&
        line.includes("(")
      ) {
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

      if (language === "python" && line.startsWith("if ") && line.endsWith(":")) {
        const condition = line.slice(3, -1).trim()
        steps.push({
          id: `step-${stepId++}`,
          line: lineNumber,
          variables: [],
          callStack: ["main"],
          output: "",
          timestamp: (timestamp += 100),
          description: `Evaluate condition: ${condition}`,
          type: "condition",
        })
      }

      if (
        (language === "javascript" || language === "c" || language === "cpp" || language === "java") &&
        line.includes("for ") &&
        line.includes("(")
      ) {
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

      if (language === "python" && line.startsWith("for ") && line.includes(" in ") && line.endsWith(":")) {
        const forMatch = line.slice(4, -1).trim()
        steps.push({
          id: `step-${stepId++}`,
          line: lineNumber,
          variables: [],
          callStack: ["main"],
          output: "",
          timestamp: (timestamp += 100),
          description: `Start for loop: ${forMatch}`,
          type: "loop",
        })
      }

      if (line.includes("while ")) {
        if (
          (language === "javascript" || language === "c" || language === "cpp" || language === "java") &&
          line.includes("(")
        ) {
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
        } else if (language === "python" && line.endsWith(":")) {
          const whileMatch = line.match(/while\s+(.+):/)
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
      }

      if (language === "javascript" && line.includes("console.log")) {
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

      if (language === "python" && line.includes("print(")) {
        const printMatch = line.match(/print\s*$$([^)]+)$$/)
        if (printMatch) {
          steps.push({
            id: `step-${stepId++}`,
            line: lineNumber,
            variables: [],
            callStack: ["main"],
            output: `Output: ${printMatch[1]}`,
            timestamp: (timestamp += 100),
            description: `Print: ${printMatch[1]}`,
            type: "output",
          })
        }
      }

      if ((language === "c" || language === "cpp") && line.includes("printf(")) {
        const printfMatch = line.match(/printf\s*$$([^)]+)$$/)
        if (printfMatch) {
          steps.push({
            id: `step-${stepId++}`,
            line: lineNumber,
            variables: [],
            callStack: ["main"],
            output: `Output: ${printfMatch[1]}`,
            timestamp: (timestamp += 100),
            description: `Print: ${printfMatch[1]}`,
            type: "output",
          })
        }
      }

      if (language === "java" && line.includes("System.out.println")) {
        const printMatch = line.match(/System\.out\.println\s*$$([^)]+)$$/)
        if (printMatch) {
          steps.push({
            id: `step-${stepId++}`,
            line: lineNumber,
            variables: [],
            callStack: ["main"],
            output: `Output: ${printMatch[1]}`,
            timestamp: (timestamp += 100),
            description: `Print: ${printMatch[1]}`,
            type: "output",
          })
        }
      }

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
    }

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
