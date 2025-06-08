"use client"

import { useEffect, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowRight, Activity, Variable, GitBranch, RotateCcw, ArrowLeft, Terminal } from "lucide-react"

interface ExecutionStep {
  id: string
  line: number
  variables: any[]
  callStack: string[]
  output: string
  timestamp: number
  description: string
  type: "function_call" | "variable_assignment" | "condition" | "loop" | "return" | "output"
}

interface ExecutionTimelineProps {
  steps: ExecutionStep[]
  currentStep: number
  onStepClick: (stepIndex: number) => void
}

const getStepIcon = (type: string) => {
  switch (type) {
    case "function_call":
      return <Activity className="w-4 h-4" />
    case "variable_assignment":
      return <Variable className="w-4 h-4" />
    case "condition":
      return <GitBranch className="w-4 h-4" />
    case "loop":
      return <RotateCcw className="w-4 h-4" />
    case "return":
      return <ArrowLeft className="w-4 h-4" />
    case "output":
      return <Terminal className="w-4 h-4" />
    default:
      return <ArrowRight className="w-4 h-4" />
  }
}

const getStepColor = (type: string) => {
  switch (type) {
    case "function_call":
      return "bg-blue-500"
    case "variable_assignment":
      return "bg-green-500"
    case "condition":
      return "bg-yellow-500"
    case "loop":
      return "bg-purple-500"
    case "return":
      return "bg-red-500"
    case "output":
      return "bg-gray-500"
    default:
      return "bg-gray-400"
  }
}

const getStepBadgeVariant = (type: string) => {
  switch (type) {
    case "function_call":
      return "default"
    case "variable_assignment":
      return "secondary"
    case "condition":
      return "outline"
    case "loop":
      return "destructive"
    case "return":
      return "default"
    case "output":
      return "secondary"
    default:
      return "outline"
  }
}

export default function ExecutionTimeline({ steps, currentStep, onStepClick }: ExecutionTimelineProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const currentStepRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to current step
  useEffect(() => {
    if (currentStepRef.current && scrollAreaRef.current) {
      currentStepRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
    }
  }, [currentStep])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Execution Flow</h3>
          <Badge variant="outline">{steps.length} steps</Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Function</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Variable</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>Condition</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span>Loop</span>
          </div>
        </div>
      </div>

      <ScrollArea ref={scrollAreaRef} className="h-64 w-full border rounded-lg p-4">
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border"></div>

          <div className="space-y-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className="relative flex items-start gap-3"
                ref={index === currentStep ? currentStepRef : null}
              >
                <Button
                  variant={index === currentStep ? "default" : "outline"}
                  size="sm"
                  className={`relative z-10 w-10 h-10 rounded-full p-0 ${
                    index === currentStep ? "ring-2 ring-primary ring-offset-2" : ""
                  } ${index < currentStep ? "opacity-60" : ""}`}
                  onClick={() => onStepClick(index)}
                >
                  <div className={`w-2.5 h-2.5 rounded-full ${getStepColor(step.type)}`}></div>
                </Button>

                <div
                  className={`flex-1 p-2 border rounded-lg cursor-pointer transition-all hover:bg-muted/50 ${
                    index === currentStep ? "bg-primary/10 border-primary" : ""
                  } ${index < currentStep ? "opacity-60" : ""}`}
                  onClick={() => onStepClick(index)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {getStepIcon(step.type)}
                      <Badge variant={getStepBadgeVariant(step.type)} className="text-xs">
                        Line {step.line}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {step.timestamp}ms
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">Step {index + 1}</span>
                  </div>

                  <p className="text-sm font-medium mb-1">{step.description}</p>

                  {step.variables.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {step.variables.slice(0, 3).map((variable, varIndex) => (
                        <Badge key={varIndex} variant="secondary" className="text-xs">
                          {variable.name}: {JSON.stringify(variable.value)}
                        </Badge>
                      ))}
                      {step.variables.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{step.variables.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}

                  {step.output && <div className="mt-1 p-2 bg-muted rounded text-xs font-mono">{step.output}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onStepClick(0)} disabled={currentStep === 0}>
            First
          </Button>
          <Button variant="outline" size="sm" onClick={() => onStepClick(currentStep - 1)} disabled={currentStep === 0}>
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStepClick(currentStep + 1)}
            disabled={currentStep >= steps.length - 1}
          >
            Next
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStepClick(steps.length - 1)}
            disabled={currentStep >= steps.length - 1}
          >
            Last
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">Click on any step to jump to that point in execution</div>
      </div>
    </div>
  )
}
