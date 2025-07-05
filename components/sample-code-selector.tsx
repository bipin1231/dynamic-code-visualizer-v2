"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Settings } from "lucide-react"
import { sampleCodes } from "@/data/sample-codes"
import { useState } from "react"

interface SampleCodeSelectorProps {
  onCodeSelect: (code: string) => void
  isDebugging: boolean
  executionSpeed: number
  onSpeedChange: (speed: number) => void
  language: string
  onVisualizeClick: (algorithm: string) => void
}

export default function SampleCodeSelector({
  onCodeSelect,
  isDebugging,
  executionSpeed,
  onSpeedChange,
  language,
  onVisualizeClick,
}: SampleCodeSelectorProps) {
  const [selectedKey, setSelectedKey] = useState("")

const loadSampleCode = (sample: string) => {
  setSelectedKey(sample)
  const code = sampleCodes[sample as keyof typeof sampleCodes]
  if (code) {
    onCodeSelect(code)
  }
}

  const getLanguageSamples = () => {
    switch (language) {
      case "javascript":
        return [
          { key: "fibonacci", label: "Fibonacci" },
          { key: "bubbleSort", label: "Bubble Sort" },
          { key: "insertionSort", label: "Insertion Sort" },
          { key: "factorial", label: "Factorial" },
          { key: "binarySearch", label: "Binary Search" },
        ]
      case "python":
        return [
          { key: "pythonFibonacci", label: "Fibonacci" },
          { key: "pythonBubbleSort", label: "Bubble Sort" },
          { key: "pythonFactorial", label: "Factorial" },
        ]
      case "c":
        return [
          { key: "cHelloWorld", label: "Hello World" },
          { key: "cFibonacci", label: "Fibonacci" },
          { key: "cBubbleSort", label: "Bubble Sort" },
        ]
      case "cpp":
        return [
          { key: "cppHelloWorld", label: "Hello World" },
          { key: "cppFibonacci", label: "Fibonacci" },
          { key: "cppBubbleSort", label: "Bubble Sort" },
        ]
      case "java":
        return [
          { key: "javaHelloWorld", label: "Hello World" },
          { key: "javaFibonacci", label: "Fibonacci" },
          { key: "javaBubbleSort", label: "Bubble Sort" },
        ]
      default:
        return []
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Sample Code
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            {getLanguageSamples().map((sample) => (
              <Button key={sample.key} variant="outline" onClick={() => loadSampleCode(sample.key)}>
                {sample.label}
              </Button>
            ))}
          </div>
          {["bubbleSort", "insertionSort"].includes(selectedKey) && language === "javascript" && (
  <Button onClick={() => onVisualizeClick(selectedKey)}>
    Visualize
  </Button>
)}

          {isDebugging && (
            <>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2">
                <span className="text-sm">Speed:</span>
                <Select value={executionSpeed.toString()} onValueChange={(value) => onSpeedChange(Number(value))}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="500">Fast</SelectItem>
                    <SelectItem value="1000">Normal</SelectItem>
                    <SelectItem value="2000">Slow</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
