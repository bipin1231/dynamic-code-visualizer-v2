"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import type { Variable, ExecutionStep } from "@/types/execution"

interface VisualizationPanelProps {
  variables: Variable[]
  callStack: string[]
  output: string
  error: string
  currentStep: number
  executionSteps: ExecutionStep[]
}

export default function VisualizationPanel({
  variables,
  callStack,
  output,
  error,
  currentStep,
  executionSteps,
}: VisualizationPanelProps) {
  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle>Execution Visualization</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="variables" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="variables">Variables</TabsTrigger>
            <TabsTrigger value="callstack">Call Stack</TabsTrigger>
            <TabsTrigger value="output">Output</TabsTrigger>
            <TabsTrigger value="errors">Errors</TabsTrigger>
          </TabsList>

          <TabsContent value="variables" className="space-y-2">
            <div className="h-80 overflow-auto">
              {variables.length > 0 ? (
                variables.map((variable, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <span className="font-mono text-sm font-medium">{variable.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{variable.type}</Badge>
                      <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                        {JSON.stringify(variable.value)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground text-center py-8">
                  No variables to display. Start debugging to see variable states.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="callstack" className="space-y-2">
            <div className="h-80 overflow-auto">
              {callStack.length > 0 ? (
                callStack.map((frame, index) => (
                  <div key={index} className="p-3 border rounded-lg bg-muted/30">
                    <span className="font-mono text-sm">{frame}</span>
                    <Badge variant="outline" className="ml-2">
                      Frame {index + 1}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground text-center py-8">
                  No call stack to display. Start debugging to see function calls.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="output" className="space-y-2">
            <div className="h-80 overflow-auto">
              <div className="p-4 bg-muted rounded-lg font-mono text-sm whitespace-pre-wrap border">
                {output || "No output yet. Run your code to see results."}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="errors" className="space-y-2">
            <div className="h-80 overflow-auto">
              {error ? (
                <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="destructive">Error</Badge>
                  </div>
                  <p className="text-destructive font-mono text-sm">{error}</p>
                </div>
              ) : (
                <div className="text-muted-foreground text-center py-8">
                  No errors. Your code is running smoothly! ✅
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
