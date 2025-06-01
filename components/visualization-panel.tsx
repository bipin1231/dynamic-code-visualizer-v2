"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Clock, BookOpen } from "lucide-react"
import type { Variable, ExecutionStep } from "@/types/execution"

interface VisualizationPanelProps {
  variables: Variable[]
  callStack: string[]
  output: string
  error: string
  currentStep: number
  executionSteps: ExecutionStep[]
  code: string
}

export default function VisualizationPanel({
  variables,
  callStack,
  output,
  error,
  currentStep,
  executionSteps,
  code,
}: VisualizationPanelProps) {
  // Analyze code to generate dynamic explanation
  const analyzeCode = (code: string) => {
    const lines = code.split("\n").filter((line) => line.trim() && !line.trim().startsWith("//"))
    const analysis = {
      functions: [] as string[],
      variables: [] as string[],
      loops: [] as string[],
      conditions: [] as string[],
      outputs: [] as string[],
      complexity: "O(1)",
      spaceComplexity: "O(1)",
      algorithm: "Unknown",
    }

    // Detect functions
    lines.forEach((line) => {
      const funcMatch =
        line.match(/function\s+(\w+)/) || line.match(/const\s+(\w+)\s*=.*=>/) || line.match(/(\w+)\s*$$[^)]*$$\s*{/)
      if (funcMatch) {
        analysis.functions.push(funcMatch[1])
      }

      // Detect variables
      const varMatch = line.match(/(let|const|var)\s+(\w+)/)
      if (varMatch) {
        analysis.variables.push(varMatch[2])
      }

      // Detect loops
      if (line.includes("for") && line.includes("(")) {
        const forMatch = line.match(/for\s*$$[^)]+$$/)
        if (forMatch) analysis.loops.push("for loop")
      }
      if (line.includes("while") && line.includes("(")) {
        analysis.loops.push("while loop")
      }

      // Detect conditions
      if (line.includes("if") && line.includes("(")) {
        analysis.conditions.push("conditional statement")
      }

      // Detect outputs
      if (line.includes("console.log")) {
        analysis.outputs.push("console output")
      }
    })

    // Determine algorithm type and complexity
    const codeText = code.toLowerCase()

    if (codeText.includes("fibonacci")) {
      analysis.algorithm = "Fibonacci Sequence"
      analysis.complexity = analysis.loops.length > 0 ? "O(n)" : "O(2^n)"
      analysis.spaceComplexity = analysis.loops.length > 0 ? "O(1)" : "O(n)"
    } else if (codeText.includes("factorial")) {
      analysis.algorithm = "Factorial Calculation"
      analysis.complexity = codeText.includes("for") || codeText.includes("while") ? "O(n)" : "O(n)"
      analysis.spaceComplexity = codeText.includes("for") || codeText.includes("while") ? "O(1)" : "O(n)"
    } else if (codeText.includes("sort") || codeText.includes("bubble")) {
      analysis.algorithm = "Bubble Sort"
      analysis.complexity = "O(n²)"
      analysis.spaceComplexity = "O(1)"
    } else if (codeText.includes("binary") && codeText.includes("search")) {
      analysis.algorithm = "Binary Search"
      analysis.complexity = "O(log n)"
      analysis.spaceComplexity = "O(1)"
    } else if (analysis.loops.length >= 2) {
      analysis.algorithm = "Nested Loop Algorithm"
      analysis.complexity = "O(n²)"
    } else if (analysis.loops.length === 1) {
      analysis.algorithm = "Linear Algorithm"
      analysis.complexity = "O(n)"
    } else if (codeText.includes("recursive") || (codeText.includes("return") && analysis.functions.length > 0)) {
      analysis.algorithm = "Recursive Algorithm"
      analysis.complexity = "O(2^n) or O(n)"
      analysis.spaceComplexity = "O(n)"
    }

    return analysis
  }

  // Generate more concise code explanation
  const generateCodeExplanation = () => {
    const analysis = analyzeCode(code)

    if (!code.trim()) {
      return "No code to analyze. Write some code in the editor to see the explanation."
    }

    return `
**${analysis.algorithm}**

**Structure:**
• Functions: ${analysis.functions.length > 0 ? analysis.functions.join(", ") : "None"}
• Variables: ${analysis.variables.length > 0 ? analysis.variables.slice(0, 3).join(", ") + (analysis.variables.length > 3 ? "..." : "") : "None"}
• Loops: ${analysis.loops.length > 0 ? analysis.loops.length + " loop(s)" : "None"}
• Conditions: ${analysis.conditions.length > 0 ? analysis.conditions.length + " condition(s)" : "None"}

**Approach:**
${
  analysis.algorithm === "Fibonacci Sequence"
    ? "Calculates Fibonacci numbers where each number is the sum of the two preceding ones."
    : analysis.algorithm === "Factorial Calculation"
      ? "Computes factorial (n!) which is the product of all positive integers less than or equal to n."
      : analysis.algorithm === "Bubble Sort"
        ? "Repeatedly steps through the list, compares adjacent elements and swaps them if they're in the wrong order."
        : analysis.algorithm === "Binary Search"
          ? "Finds position of a target value by dividing a sorted array in half repeatedly."
          : analysis.loops.length >= 2
            ? "Uses nested loops to process data with multiple iterations."
            : analysis.loops.length === 1
              ? "Processes data in a single pass through the input."
              : "Uses direct computation without iteration."
}

**Implementation:**
• Style: ${analysis.loops.length > 0 ? "Iterative" : analysis.functions.length > 0 && code.includes("return") ? "Recursive" : "Sequential"}
• Complexity: ${analysis.complexity} time, ${analysis.spaceComplexity} space
    `.trim()
  }

  // Generate more concise time complexity analysis
  const generateTimeComplexity = () => {
    const analysis = analyzeCode(code)

    if (!code.trim()) {
      return "No code to analyze. Write some code in the editor to see the complexity analysis."
    }

    return `
**Time Complexity: ${analysis.complexity}**

**Breakdown:**
• Algorithm: ${analysis.algorithm}
• Operations: ${
      analysis.loops.length >= 2
        ? "Nested loops create quadratic complexity"
        : analysis.loops.length === 1
          ? "Single loop creates linear complexity"
          : analysis.algorithm === "Binary Search"
            ? "Halving the search space creates logarithmic complexity"
            : "Simple operations with constant complexity"
    }
• Space: ${analysis.spaceComplexity} (${
      analysis.spaceComplexity === "O(1)"
        ? "constant extra space"
        : analysis.spaceComplexity === "O(n)"
          ? "space grows with input size"
          : "variable space usage"
    })

**Performance:**
• Best case: ${analysis.algorithm === "Bubble Sort" ? "O(n) if already sorted" : analysis.complexity}
• Average: ${analysis.complexity}
• Worst: ${analysis.complexity}

**Scalability:**
${
  analysis.complexity === "O(1)"
    ? "✅ Excellent - handles any input size efficiently"
    : analysis.complexity === "O(log n)"
      ? "✅ Very good - scales well with large inputs"
      : analysis.complexity === "O(n)"
        ? "✅ Good - reasonable for most inputs"
        : analysis.complexity === "O(n²)"
          ? "⚠️ Fair - may be slow for large inputs"
          : "⚠️ Poor - inefficient for large inputs"
}
    `.trim()
  }

  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle>Execution Visualization</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="output" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="output">Output</TabsTrigger>
            <TabsTrigger value="explanation">Code Explanation</TabsTrigger>
            <TabsTrigger value="complexity">Time Complexity</TabsTrigger>
          </TabsList>

          <TabsContent value="output" className="space-y-2">
            <div className="h-80 overflow-auto">
              {error ? (
                <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    <Badge variant="destructive">Error</Badge>
                  </div>
                  <p className="text-destructive font-mono text-sm whitespace-pre-wrap">{error}</p>
                </div>
              ) : output ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <Badge variant="secondary">Success</Badge>
                  </div>
                  <div className="p-4 bg-muted rounded-lg font-mono text-sm whitespace-pre-wrap border">{output}</div>
                </div>
              ) : (
                <div className="text-muted-foreground text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <Clock className="w-6 h-6" />
                    </div>
                    <p>No output yet. Run your code to see results.</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="explanation" className="space-y-2">
            <div className="h-80 overflow-auto">
              <div className="p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  <Badge variant="outline">Code Analysis</Badge>
                </div>
                <div className="prose prose-sm max-w-none text-sm">
                  <div className="whitespace-pre-line text-foreground leading-relaxed">{generateCodeExplanation()}</div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="complexity" className="space-y-2">
            <div className="h-80 overflow-auto">
              <div className="p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-purple-500" />
                  <Badge variant="outline">Performance Analysis</Badge>
                </div>
                <div className="prose prose-sm max-w-none text-sm">
                  <div className="whitespace-pre-line text-foreground leading-relaxed">{generateTimeComplexity()}</div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
