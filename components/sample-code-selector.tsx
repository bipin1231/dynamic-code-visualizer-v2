"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Settings } from "lucide-react"
import { sampleCodes } from "@/data/sample-codes"

interface SampleCodeSelectorProps {
  onCodeSelect: (code: string) => void
  isDebugging: boolean
  executionSpeed: number
  onSpeedChange: (speed: number) => void
}

export default function SampleCodeSelector({
  onCodeSelect,
  isDebugging,
  executionSpeed,
  onSpeedChange,
}: SampleCodeSelectorProps) {
  const loadSampleCode = (sample: string) => {
    const code = sampleCodes[sample as keyof typeof sampleCodes]
    if (code) {
      onCodeSelect(code)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Sample Code & Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => loadSampleCode("fibonacci")}>
              Fibonacci
            </Button>
            <Button variant="outline" onClick={() => loadSampleCode("bubbleSort")}>
              Bubble Sort
            </Button>
            <Button variant="outline" onClick={() => loadSampleCode("factorial")}>
              Factorial
            </Button>
            <Button variant="outline" onClick={() => loadSampleCode("binarySearch")}>
              Binary Search
            </Button>
          </div>
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
