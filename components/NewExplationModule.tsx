// components/NewExplanationModule.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button"

export default function NewExplanationModule({ initialCode }: { initialCode: string }) {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"timeComplexity" | "explanation" | "chat" | "hint" | "quiz">("timeComplexity");
  const [question, setQuestion] = useState("");
  
const [showHint, setShowHint] = useState(false);

  async function invokeBot() {
    setLoading(true);

    const payload: any = {
      mode,
      codeContext: code,
    };
    if (mode === "chat") payload.question = question;
try{

    const res = await fetch("/api/chatbot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });


    const json = await res.json();
    setOutput(json.reply || json.error);
    setLoading(false);
}catch(e){
  console.log(e);
  setLoading(false)
  
}
  }
  console.log(mode);
  

  return (
    <div>
  
      <div className="my-4 space-x-2">
        <Button onClick={() => setMode("timeComplexity")} className={mode === "timeComplexity" ? "font-bold" : ""}>Time Complexity</Button>
        <Button onClick={() => setMode("explanation")} className={mode === "explanation" ? "font-bold" : ""}>Explanation</Button>
        <Button onClick={() => setMode("chat")} className={mode === "chat" ? "font-bold" : ""}>Chat</Button>
  
        <Button onClick={() => setMode("quiz")} className={mode === "quiz" ? "font-bold" : ""}>Quiz</Button>
      </div>

      {mode === "chat" && (
        <input
          className="border p-1 w-full mb-2"
          placeholder="Ask a question about the code…"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
      )}

      <button
        onClick={invokeBot}
        disabled={loading || (mode === "chat" && !question.trim())}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading
          ? "Wait a Minute...."
          : mode === "timeComplexity"
          ? "Analyze"
          : mode === "explanation"
          ? "Explain"
          : mode === "chat"
          ? "Ask"
          : "Play Quiz"}
      </button>

      {output && mode!=="quiz"  && (
        <pre className="mt-4 p-3 bg-gray-100 rounded whitespace-pre-wrap">{output}</pre>
      )}


{mode === "quiz" && output && (() => {
  try {
      const cleaned = output
      .replace(/^```json\s*/, '')  // Remove starting ```json
      .replace(/```$/, '')         // Remove ending ```
      .trim();

    const parsed = JSON.parse(cleaned); // ✅ Now valid JSON
 

    return (
      <div className="mt-4 space-y-4">
        <div className="font-semibold">{parsed.question}</div>
        <ul className="space-y-2">
          {parsed.options.map((option: string, idx: number) => (
            <li key={idx}>
              <button
                onClick={() => {
                  if (idx === parsed.correctIndex) {
                    alert("✅ Correct!");
                  } else {
                    alert("❌ Try again.");
                  }
                }}
                className="w-full text-left border p-2 rounded hover:bg-gray-200"
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
    );
  } catch {
    return <pre className="mt-4 bg-gray-100 p-3 rounded whitespace-pre-wrap">{output}</pre>;
  }
})()}




    </div>
  );
}
