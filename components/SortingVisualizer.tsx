"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

interface SortingVisualizerProps {
  algorithm: string
  onClose: () => void
}

export default function SortingVisualizer({ algorithm, onClose }: SortingVisualizerProps) {
  const [array, setArray] = useState<number[]>([64, 34, 25, 12, 22, 11, 90])
  const [currentStep, setCurrentStep] = useState(0)
  const [steps, setSteps] = useState<number[][]>([])

  useEffect(() => {
    let resultSteps: number[][] = []

    const record = (arr: number[]) => resultSteps.push([...arr])

    const bubbleSort = (arr: number[]) => {
      const a = [...arr]
      const n = a.length
      record(a)
      for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
          if (a[j] > a[j + 1]) {
            [a[j], a[j + 1]] = [a[j + 1], a[j]]
            record(a)
          }
        }
      }
    }

    const insertionSort = (arr: number[]) => {
      const a = [...arr]
      record(a)
      for (let i = 1; i < a.length; i++) {
        let key = a[i]
        let j = i - 1
        while (j >= 0 && a[j] > key) {
          a[j + 1] = a[j]
          j--
          record(a)
        }
        a[j + 1] = key
        record(a)
      }
    }

    if (algorithm === "bubbleSort") bubbleSort(array)
    else insertionSort(array)

    setSteps(resultSteps)
    setCurrentStep(0)
  }, [algorithm])

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button onClick={() => setCurrentStep((s) => Math.max(0, s - 1))} disabled={currentStep === 0}>
          Prev
        </Button>
        <Button onClick={() => setCurrentStep((s) => Math.min(steps.length - 1, s + 1))} disabled={currentStep === steps.length - 1}>
          Next
        </Button>
        <Button onClick={onClose} variant="destructive">
          Close
        </Button>
      </div>
      <div className="flex gap-2 justify-center mt-4">
        {steps[currentStep]?.map((num, idx) => (
          <div
            key={idx}
            className="w-6 bg-primary text-white rounded text-center"
            style={{ height: `${num * 3}px`, transition: "height 0.3s" }}
          >
            {num}
          </div>
        ))}
      </div>
    </div>
  )
}
