"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Square, SkipForward, RotateCcw, Bug, Clock } from "lucide-react"
import type { ExecutionStep } from "@/types/execution"

interface DebugControlsProps {
  language: string
  onLanguageChange: (language: string) => void
  isRunning: boolean
  isDebugging: boolean
  currentStep: number
  executionSteps: ExecutionStep[]
  isAutoPlaying: boolean
  onRun: (language: string) => void
  onStartDebug: (language: string) => void
  onStepForward: () => void
  onStepBackward: () => void
  onToggleAutoPlay: () => void
  onStop: () => void
  onReset: () => void
}

export default function DebugControls({
  language,
  onLanguageChange,
  isRunning,
  isDebugging,
  currentStep,
  executionSteps,
  isAutoPlaying,
  onRun,
  onStartDebug,
  onStepForward,
  onStepBackward,
  onToggleAutoPlay,
  onStop,
  onReset,
}: DebugControlsProps) {
  // No status indicators needed

  return (
    <div className="flex gap-2">
      <Select value={language} onValueChange={onLanguageChange}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="javascript">JavaScript</SelectItem>
          <SelectItem value="python">Python</SelectItem>
          <SelectItem value="c">C</SelectItem>
          <SelectItem value="cpp">C++</SelectItem>
          <SelectItem value="java">Java</SelectItem>
        </SelectContent>
      </Select>

      <Button onClick={() => onRun(language)} disabled={isRunning || isDebugging} className="gap-2">
        <Play className="w-4 h-4" />
        Run
      </Button>

      <Button
        onClick={() => onStartDebug(language)}
        disabled={isRunning || isDebugging}
        variant="outline"
        className="gap-2"
      >
        <Bug className="w-4 h-4" />
        Debug
      </Button>

      {isDebugging && (
        <>
          <Button onClick={onStepBackward} disabled={currentStep <= 0} variant="outline" className="gap-2">
            ←
          </Button>
          <Button
            onClick={onStepForward}
            disabled={currentStep >= executionSteps.length - 1}
            variant="outline"
            className="gap-2"
          >
            <SkipForward className="w-4 h-4" />
            Step
          </Button>
          <Button onClick={onToggleAutoPlay} variant="outline" className="gap-2">
            <Clock className="w-4 h-4" />
            {isAutoPlaying ? "Pause" : "Auto Play"}
          </Button>
        </>
      )}

      <Button onClick={onStop} disabled={!isRunning && !isDebugging} variant="destructive" className="gap-2">
        <Square className="w-4 h-4" />
        Stop
      </Button>

      <Button onClick={onReset} variant="outline" className="gap-2">
        <RotateCcw className="w-4 h-4" />
        Reset
      </Button>
    </div>
  )
}
