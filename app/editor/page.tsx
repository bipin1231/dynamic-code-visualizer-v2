"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Clock } from "lucide-react"
import MonacoEditor from "../../components/monaco-editor"
import ExecutionTimeline from "../../components/execution-timeline"
import DebugControls from "../../components/debug-controls"
import VisualizationPanel from "../../components/visualization-panel"
import SampleCodeSelector from "../../components/sample-code-selector"

import { useCodeExecution } from "../../hooks/use-code-execution"
import { generateFlowchart } from "../../components/flowchart"
import { FlowchartView } from "../../components/FlowchartView"

import SortingVisualizer from "../../components/SortingVisualizer"
import Link from "next/link"
import SearchingVisualizer from "../../components/SearchingVisualizer"

export default function CodeVisualizer() {
  const [code, setCode] = useState(`function fibonacci(n) {
if (n <= 1) {
  return n;
}
let a = 0;
let b = 1;
for (let i = 2; i <= n; i++) {
  let temp = a + b;
  a = b;
  b = temp;
}
return b;
}

console.log("Fibonacci of 5:", fibonacci(5));`)

  const [language, setLanguage] = useState("javascript")
  const [breakpoints, setBreakpoints] = useState<number[]>([])
  const [flowchartData, setFlowchartData] = useState<{ nodes: any[]; edges: any[] } | null>(null)

  const {
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
  } = useCodeExecution(code)

const [visualizingAlgo, setVisualizingAlgo] = useState<string | null>(null)
const [searchingAlgo, setSearchingAlgo] = useState<"linearSearch" | "binarySearch" | null>(null)


const handleVisualizeClick = (algorithm: string) => {
  if (algorithm === "bubbleSort" || algorithm === "insertionSort") {
    setVisualizingAlgo(algorithm)
    setSearchingAlgo(null)
  } else if (algorithm === "linearSearch" || algorithm === "binarySearch") {
    setSearchingAlgo(algorithm)
    setVisualizingAlgo(null)
  }
}


  const toggleBreakpoint = (lineNumber: number) => {
    setBreakpoints((prev) =>
      prev.includes(lineNumber) ? prev.filter((bp) => bp !== lineNumber) : [...prev, lineNumber],
    )
  }

  useEffect(() => {
  if (isDebugging) {
    const flowchart = generateFlowchart(code)
    setFlowchartData(flowchart)
  } else {
    setFlowchartData(null)
  }
}, [isDebugging, code])

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/" className="hover:opacity-80 transition-opacity cursor-pointer">
            <h1 className="text-3xl font-bold hover:text-primary transition-colors">Dynamic Code Visualizer</h1>
          </Link>
          <DebugControls
            language={language}
            onLanguageChange={setLanguage}
            isRunning={isRunning}
            isDebugging={isDebugging}
            currentStep={currentStep}
            executionSteps={executionSteps}
            isAutoPlaying={isAutoPlaying}
            onRun={runCode}
            onStartDebug={startDebug}
            onStepForward={stepForward}
            onStepBackward={stepBackward}
            onToggleAutoPlay={toggleAutoPlay}
            onStop={stopExecution}
            onReset={reset}
          />
        </div>

        {/* Sample Code Selector */}
        <SampleCodeSelector
          onCodeSelect={setCode}
          isDebugging={isDebugging}
          executionSpeed={executionSpeed}
          onSpeedChange={setExecutionSpeed}
          language={language}
          onVisualizeClick={handleVisualizeClick}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Code Editor */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Code Editor</CardTitle>
            </CardHeader>
            <CardContent>
              <MonacoEditor
                value={code}
                theme="vs"
                onChange={setCode}
                language={language}
                currentLine={currentLine}
 
              />
            </CardContent>
          </Card>

          {/* Execution Timeline or Visualization Panel */}
          {isDebugging && executionSteps.length > 0 ? (
            <Card className="lg:col-span-1 pt-1">
              {/* <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Execution Timeline
                </CardTitle>
              </CardHeader> */}
              <CardContent>
                <ExecutionTimeline steps={executionSteps} currentStep={currentStep} onStepClick={jumpToStep} />
              </CardContent>
            </Card>
          ) : (
            <VisualizationPanel
              variables={variables}
              callStack={callStack}
              output={output}
              error={error}
              currentStep={currentStep}
              executionSteps={executionSteps}
              code={code}
            />
          )}
        </div>

        {/* <div>
          <NewExplationModule
          initialCode={code}
          />
        </div> */}

        {/* Visualization Panel when debugging */}
        {isDebugging && executionSteps.length > 0 && (
          <VisualizationPanel
            variables={variables}
            callStack={callStack}
            output={output}
            error={error}
            currentStep={currentStep}
            executionSteps={executionSteps}
            code={code}
          />
        )}
       


{visualizingAlgo && (
  <Card className="lg:col-span-1">
    <CardHeader>
      <CardTitle>{`Visualizing ${visualizingAlgo === "bubbleSort" ? "Bubble Sort" : "Insertion Sort"}`}</CardTitle>
    </CardHeader>
    <CardContent>
      <SortingVisualizer algorithm={visualizingAlgo} onClose={() => setVisualizingAlgo(null)} />
    </CardContent>
  </Card>
)}

{searchingAlgo && (
  <Card className="lg:col-span-1 mt-4">
    <CardHeader>
      <CardTitle>{`Visualizing ${searchingAlgo === "linearSearch" ? "Linear Search" : "Binary Search"}`}</CardTitle>
    </CardHeader>
    <CardContent>
      <SearchingVisualizer algorithm={searchingAlgo} onClose={() => setSearchingAlgo(null)} />
    </CardContent>
  </Card>
)}

{isDebugging && flowchartData && (
  <Card>
    <CardHeader>
      <CardTitle>Flowchart</CardTitle>
    </CardHeader>
    <CardContent>
      <FlowchartView nodes={flowchartData.nodes} edges={flowchartData.edges} />
    </CardContent>
  </Card>
)}
        {/* Debug Information */}
        {/* {isDebugging && (
          <Card>
            <CardHeader>
              <CardTitle>Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Step:</span>
                  <span className="text-sm">
                    {currentStep + 1} / {executionSteps.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Line:</span>
                  <span className="text-sm">{currentLine}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Breakpoints:</span>
                  <span className="text-sm">{breakpoints.length}</span>
                </div>
                {executionSteps[currentStep] && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Action:</span>
                    <span className="text-sm text-muted-foreground">{executionSteps[currentStep].description}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )} */}
      </div>
    </div>
  )
}
