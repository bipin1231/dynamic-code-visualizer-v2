// hooks/useEnhancedExecution.ts
"use client"

import { useState, useRef, useEffect } from "react"
import type { ExecutionStep, Variable } from "@/types/execution"
import { LanguageExecutor } from "@/lib/language-executors"

export function useEnhancedExecution(code: string, language = "javascript") {
  // === State ===
  const [isRunning, setIsRunning] = useState(false)
  const [isDebugging, setIsDebugging] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([])
  const [output, setOutput] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [currentLine, setCurrentLine] = useState<number>(-1)
  const [variables, setVariables] = useState<Variable[]>([])
  const [callStack, setCallStack] = useState<string[]>([])
  const [executionSpeed, setExecutionSpeed] = useState<number>(1000)
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)

  // refs
  const autoPlayRef = useRef<NodeJS.Timeout>()
  const executorRef = useRef(new LanguageExecutor())

  // === Public API ===

  async function runCode() {
    setIsRunning(true)
    setError(""); setOutput(""); setCurrentLine(-1)

    try {
      let result
      if (language === "javascript") {
        result = executorRef.current.executeJavaScript(code)
      } else {
        result = await executorRef.current.executePistonAPI(code, language)
      }

      if (result.success) {
        setOutput(
          result.output +
            (result.executionTime ? `\n\nExecution time: ${result.executionTime}ms` : "")
        )
      } else {
        setError(result.error)
      }
    } catch (err: any) {
      setError(err.message || "Execution failed")
    } finally {
      setIsRunning(false)
    }
  }

  function startDebug() {
    setIsDebugging(true)
    setCurrentStep(0)
    setError(""); setOutput("")

    const steps = parseCodeForExecution(code, language)
    setExecutionSteps(steps)

    if (steps.length) {
      const s = steps[0]
      setCurrentLine(s.line)
      setVariables(s.variables)
      setCallStack(s.callStack)
      if (s.output) setOutput(s.output)
    }
  }

  function stepForward() {
    if (currentStep + 1 < executionSteps.length) {
      goToStep(currentStep + 1)
    }
  }

  function stepBackward() {
    if (currentStep > 0) {
      goToStep(currentStep - 1)
    }
  }

  function toggleAutoPlay() {
    if (isAutoPlaying) {
      clearInterval(autoPlayRef.current!)
      setIsAutoPlaying(false)
    } else {
      setIsAutoPlaying(true)
      autoPlayRef.current = setInterval(stepForward, executionSpeed)
    }
  }

  function stopExecution() {
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
    clearInterval(autoPlayRef.current!)
  }

  function reset() {
    stopExecution()
    setExecutionSpeed(1000)
  }

  // go to arbitrary step
  function goToStep(idx: number) {
    const s = executionSteps[idx]
    setCurrentStep(idx)
    setCurrentLine(s.line)
    setVariables(s.variables)
    setCallStack(s.callStack)
    setOutput(s.output || "")
  }

  useEffect(() => {
    return () => clearInterval(autoPlayRef.current!)
  }, [])

  return {
    // state
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

    // actions
    runCode,
    startDebug,
    stepForward,
    stepBackward,
    toggleAutoPlay,
    stopExecution,
    reset,
    goToStep,
    setExecutionSpeed,
  }
}

// === New parseCodeForExecution with detailed for‑loop handling ===

function parseCodeForExecution(code: string, language: string): ExecutionStep[] {
  const lines = code.split("\n")
  const steps: ExecutionStep[] = []
  let id = 1, ts = 0

  const push = (step: Omit<ExecutionStep, "id" | "timestamp">) =>
    steps.push({ id: `step-${id++}`, timestamp: ts += 100, ...step })

  // Program start
  push({
    line: 1,
    description: "Program start",
    variables: [],
    callStack: ["main"],
    output: "",
    type: "function_call",
  })

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim()
    const ln = i + 1
    if (!raw || raw.startsWith("//") || raw.startsWith("#")) continue

    // FOR loop parsing: init; cond; incr
    const forMatch = raw.match(
      /for\s*\(\s*(?:let|var|const)?\s*(\w+)\s*=\s*([^;]+);\s*([^;]+);\s*([^)]+)\)/
    )
    if (forMatch) {
      const [_, varName, initExpr, condExpr, incrExpr] = forMatch

      // init
      push({
        line: ln,
        description: `Initialize ${varName} = ${initExpr}`,
        variables: [{ name: varName, value: initExpr }],
        callStack: ["main"],
        output: "",
        type: "variable_assignment",
      })

      // simulate iterations (up to 50)
      for (let iter = 1; iter <= 50; iter++) {
        // condition
        push({
          line: ln,
          description: `Check ${condExpr}`,
          variables: [],
          callStack: ["main"],
          output: "",
          type: "condition",
        })
        // body
        push({
          line: ln,
          description: `Loop body, iteration ${iter}`,
          variables: [],
          callStack: ["main"],
          output: "",
          type: "loop_body",
        })
        // increment
        push({
          line: ln,
          description: `Increment ${varName} by ${incrExpr}`,
          variables: [{ name: varName, value: `(${varName} => ${incrExpr})` }],
          callStack: ["main"],
          output: "",
          type: "variable_assignment",
        })
      }
      continue
    }

    // function definition (JS example)
    if (language === "javascript" && raw.startsWith("function ")) {
      const fn = raw.match(/function\s+(\w+)/)![1]
      push({
        line: ln,
        description: `Define function ${fn}()`,
        variables: [],
        callStack: ["main"],
        output: "",
        type: "function_call",
      })
      continue
    }

    // variable declaration
    const varMatch = raw.match(/^(?:let|var|const)\s+(\w+)\s*=\s*(.+);?$/)
    if (varMatch) {
      const [_, name, val] = varMatch
      push({
        line: ln,
        description: `Declare ${name} = ${val}`,
        variables: [{ name, value: val }],
        callStack: ["main"],
        output: "",
        type: "variable_assignment",
      })
      continue
    }

    // assignment
    const assignMatch = raw.match(/^(\w+)\s*=\s*(.+);?$/)
    if (assignMatch) {
      const [_, name, val] = assignMatch
      push({
        line: ln,
        description: `Assign ${name} = ${val}`,
        variables: [{ name, value: val }],
        callStack: ["main"],
        output: "",
        type: "variable_assignment",
      })
      continue
    }

    // console.log
    const logMatch = raw.match(/console\.log\((.+)\)/)
    if (logMatch) {
      push({
        line: ln,
        description: `Print ${logMatch[1]}`,
        variables: [],
        callStack: ["main"],
        output: logMatch[1],
        type: "output",
      })
      continue
    }

    // fallback
    push({
      line: ln,
      description: `Execute line ${ln}`,
      variables: [],
      callStack: ["main"],
      output: "",
      type: "statement",
    })
  }

  // Program end
  push({
    line: lines.length,
    description: "Program end",
    variables: [],
    callStack: [],
    output: "",
    type: "return",
  })

  return steps
}
