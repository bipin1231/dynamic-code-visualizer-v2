"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

interface SortingStep {
  array: number[]
  i?: number
  j?: number
  key?: number
  description: string
}

interface SortingVisualizerProps {
  algorithm: string
  onClose: () => void
}

export default function SortingVisualizer({ algorithm, onClose }: SortingVisualizerProps) {
  const initialArray = [64, 34, 25, 12, 22, 11, 90]
  const [steps, setSteps] = useState<SortingStep[]>([])
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    const sortSteps: SortingStep[] = []

    const record = (
      array: number[],
      description: string,
      i?: number,
      j?: number,
      key?: number
    ) => {
      sortSteps.push({ array: [...array], i, j, key, description })
    }

    const bubbleSort = (arr: number[]) => {
      const a = [...arr]
      const n = a.length
      record(a, "Initial array")
      for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
          record(a, `Comparing a[${j}] (${a[j]}) and a[${j + 1}] (${a[j + 1]})`, i, j)
          if (a[j] > a[j + 1]) {
            [a[j], a[j + 1]] = [a[j + 1], a[j]]
            record(a, `Swapped a[${j}] and a[${j + 1}]`, i, j)
          }
        }
      }
    }

    const insertionSort = (arr: number[]) => {
      const a = [...arr]
      record(a, "Initial array")
      for (let i = 1; i < a.length; i++) {
        let key = a[i]
        let j = i - 1
        record(a, `Picked key = a[${i}] (${key})`, i, j, key)
        while (j >= 0 && a[j] > key) {
          record(a, `a[${j}] (${a[j]}) > key (${key}) → shifting`, i, j, key)
          a[j + 1] = a[j]
          j--
          record(a, `Shifted a[${j + 1}] to a[${j + 2}]`, i, j, key)
        }
        a[j + 1] = key
        record(a, `Placed key at position ${j + 1}`, i, j + 1, key)
      }
    }

    if (algorithm === "bubbleSort") bubbleSort(initialArray)
    else insertionSort(initialArray)

    setSteps(sortSteps)
    setCurrentStep(0)
  }, [algorithm])

  const step = steps[currentStep] ?? null
if (!step) {
  return <p className="text-center text-muted-foreground">Loading visualization...</p>
}
  return (
    <div className="space-y-4">
      {/* Control buttons */}
      <div className="flex gap-2">
        <Button onClick={() => setCurrentStep((s) => Math.max(0, s - 1))} disabled={currentStep === 0}>
          Prev
        </Button>
        <Button onClick={() => setCurrentStep((s) => Math.min(steps.length - 1, s + 1))} disabled={currentStep === steps.length - 1}>
          Next
        </Button>
        <Button variant="destructive" onClick={onClose}>
          Close
        </Button>
      </div>

      {/* Current Info */}
      <div className="bg-muted p-4 rounded shadow text-sm space-y-1">
        <p>
          <strong>Step {currentStep + 1} / {steps.length}</strong>: {step.description}
        </p>
        {step.i !== undefined && <p><strong>i:</strong> {step.i}</p>}
        {step.j !== undefined && <p><strong>j:</strong> {step.j}</p>}
        {step.key !== undefined && <p><strong>key:</strong> {step.key}</p>}
        <p><strong>Current Array:</strong> [{step.array.join(", ")}]</p>
      </div>

      {/* Bar visualization */}
      <div className="flex justify-center gap-2 items-end h-48 mt-4">
        {step.array.map((num, idx) => {
          const isActive = idx === step.j || idx === step.j! + 1 || idx === step.i
          return (
            <div
              key={idx}
              className={`w-6 rounded text-center text-white ${
                isActive ? "bg-yellow-500" : "bg-primary"
              }`}
              style={{
                height: `${num * 3}px`,
                transition: "height 0.3s ease",
              }}
            >
              {num}
            </div>
          )
        })}
      </div>
    </div>
  )
}
