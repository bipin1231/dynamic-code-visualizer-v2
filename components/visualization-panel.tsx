"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Clock } from "lucide-react"
import type { Variable, ExecutionStep } from "@/types/execution"
import { Button } from "@/components/ui/button"

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
  const [mode, setMode] = useState<"timeComplexity" | "explanation" | "chat" | "quiz">("timeComplexity")
  const [botOutput, setBotOutput] = useState("")
  const [loading, setLoading] = useState(false)
  const [question, setQuestion] = useState("")
  const [showHint, setShowHint] = useState(false)

  async function invokeBot() {
    setLoading(true)
    const payload: any = {
      mode,
      codeContext: code,
    }
    if (mode === "chat") payload.question = question
    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      setBotOutput(json.reply || json.error)
    } catch (e) {
      console.error(e)
      setBotOutput("Error communicating with bot.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle>Result</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="output" onValueChange={(val) => setMode(val as any)} className="w-full">
          <TabsList className="flex flex-wrap gap-2 justify-start">
            <TabsTrigger value="output">Output</TabsTrigger>
            <TabsTrigger value="timeComplexity">Time Complexity</TabsTrigger>
            <TabsTrigger value="explanation">Explanation</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="quiz">Quiz</TabsTrigger>
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

          {(["timeComplexity", "explanation", "chat", "quiz"] as const).map((tabKey) => (
            <TabsContent key={tabKey} value={tabKey}>
              {tabKey === "chat" && (
                <input
                  className="border p-2 w-full mb-2"
                  placeholder="Ask a question about the code…"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
              )}

              <Button
                onClick={invokeBot}
                disabled={loading || (tabKey === "chat" && !question.trim())}
              >
                {loading ? "Processing..." :
                  tabKey === "timeComplexity" ? "Analyze" :
                  tabKey === "explanation" ? "Explain" :
                  tabKey === "chat" ? "Ask" :
                  "Play Quiz"}
              </Button>

              {tabKey !== "quiz" && botOutput && (
                <pre className="mt-4 bg-muted p-4 rounded whitespace-pre-wrap">{botOutput}</pre>
              )}

              {tabKey === "quiz" && botOutput && (() => {
                try {
                  const cleaned = botOutput
                    .replace(/^```json\s*/, '')
                    .replace(/```$/, '')
                    .trim()
                  const parsed = JSON.parse(cleaned)

                  return (
                    <div className="space-y-4 mt-4">
                      <div className="font-semibold">{parsed.question}</div>
                      <ul className="space-y-2">
                        {parsed.options.map((option: string, idx: number) => (
                          <li key={idx}>
                            <button
                              onClick={() => alert(idx === parsed.correctIndex ? "✅ Correct!" : "❌ Try again.")}
                              className="w-full text-left border p-2 rounded hover:bg-gray-100"
                            >
                              {String.fromCharCode(65 + idx)}) {option}
                            </button>
                          </li>
                        ))}
                      </ul>
                      {parsed.hint && (
                        <div className="pt-2">
                          <button
                            className="text-blue-600 underline"
                            onClick={() => setShowHint((prev) => !prev)}
                          >
                            {showHint ? "Hide Hint" : "Show Hint"}
                          </button>
                          {showHint && (
                            <div className="mt-2 bg-yellow-100 border-l-4 border-yellow-500 p-3 rounded text-sm">
                              💡 <strong>Hint:</strong> {parsed.hint}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                } catch {
                  return <pre className="mt-4 bg-muted p-4 rounded whitespace-pre-wrap">{botOutput}</pre>
                }
              })()}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
