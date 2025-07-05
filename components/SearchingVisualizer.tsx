"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

interface SearchingVisualizerProps {
  algorithm: "linearSearch" | "binarySearch"
  onClose: () => void
}

interface Step {
  description: string
  highlight: number[]
  found?: boolean
}

export default function SearchingVisualizer({ algorithm, onClose }: SearchingVisualizerProps) {
  // Base arrays
  const baseArray = algorithm === "binarySearch"
    ? [1, 3, 5, 7, 9]
    : [5, 3, 8, 4, 2]

  const [array, setArray] = useState<number[]>(baseArray)
  const [target, setTarget] = useState<number>(baseArray[0]) // default target from array
  const [steps, setSteps] = useState<Step[]>([])
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    const generatedSteps: Step[] = []

    if (!array.includes(target)) {
      generatedSteps.push({
        description: `❌ Target value ${target} not found in the array.`,
        highlight: [],
        found: false,
      })
      setSteps(generatedSteps)
      setCurrentStep(0)
      return
    }

    if (algorithm === "linearSearch") {
      for (let i = 0; i < array.length; i++) {
        const isMatch = array[i] === target
        generatedSteps.push({
          description: `Checking index ${i}: ${array[i]} ${isMatch ? "✅ Found!" : ""}`,
          highlight: [i],
          found: isMatch,
        })
        if (isMatch) break
      }
    } else {
      const sortedArray = [...baseArray].sort((a, b) => a - b)
      setArray(sortedArray)

      let left = 0
      let right = sortedArray.length - 1

      while (left <= right) {
        const mid = Math.floor((left + right) / 2)
        const midVal = sortedArray[mid]
        const found = midVal === target

        generatedSteps.push({
          description: `Checking middle index ${mid}: ${midVal} ${found ? "✅ Found!" : ""}`,
          highlight: [mid],
          found,
        })

        if (found) break
        if (midVal < target) left = mid + 1
        else right = mid - 1
      }

      if (generatedSteps.length === 0) {
        generatedSteps.push({
          description: `❌ Target value ${target} not found in the array.`,
          highlight: [],
        })
      }
    }

    setSteps(generatedSteps)
    setCurrentStep(0)
  }, [algorithm, target])

  const step = steps[currentStep]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-2">
        <label htmlFor="target" className="text-sm font-medium">
          Searching for:
        </label>
        <select
          id="target"
          value={target}
          onChange={(e) => setTarget(Number(e.target.value))}
          className="border rounded px-2 py-1"
        >
          {array.map((val, idx) => (
            <option key={idx} value={val}>
              {val}
            </option>
          ))}
        </select>
      </div>

      {/* Array indices */}
      <div className="flex justify-center space-x-2 text-xs font-mono text-muted-foreground">
        {array.map((_, index) => (
          <div key={index} className="w-10 text-center">{index}</div>
        ))}
      </div>

      {/* Array values */}
      <div className="flex justify-center space-x-2">
        {array.map((value, index) => (
          <div
            key={index}
            className={`w-10 h-10 flex items-center justify-center rounded border text-sm font-medium ${
              step?.highlight.includes(index) ? "bg-blue-200 border-blue-500" : "bg-muted"
            }`}
          >
            {value}
          </div>
        ))}
      </div>

      {/* Step description */}
      <div className="bg-muted p-3 rounded text-sm text-center">
        <strong>Step {currentStep + 1} / {steps.length}:</strong> {step?.description || "Done!"}
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-2">
        <Button
          variant="outline"
          onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
          disabled={currentStep === 0}
        >
          Prev
        </Button>
        <Button
          onClick={() => setCurrentStep((s) => Math.min(steps.length - 1, s + 1))}
          disabled={currentStep >= steps.length - 1}
        >
          Next
        </Button>
        <Button variant="destructive" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  )
}
