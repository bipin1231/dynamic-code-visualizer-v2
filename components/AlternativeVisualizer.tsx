"use client";

import { useEffect, useState, useRef } from "react";

export interface ExecutionStep {
  line: number;                // the line number being executed
  description: string;         // simple one‑sentence explanation
  variables: { name: string; value: any }[];  // variables *at this step*
  callStack: string[];         // array of function names, top = last
}

interface Props {
  steps: ExecutionStep[];
  codeSnippet: string;
}

export default function FullDiagramVisualizer({ steps, codeSnippet }: Props) {
  const [idx, setIdx] = useState(0);
  const step = steps[idx];
  const lines = codeSnippet.split("\n");

  // Build persistent memory: variable name → last known value
  const memoryRef = useRef<Record<string, any>>({});
  // Track which variables changed this step
  const [changed, setChanged] = useState<Set<string>>(new Set());

  useEffect(() => {
    const newChanged = new Set<string>();
    for (const { name, value } of step.variables) {
      const prev = memoryRef.current[name];
      if (prev === undefined || String(prev) !== String(value)) {
        newChanged.add(name);
      }
      memoryRef.current[name] = value;
    }
    setChanged(newChanged);
  }, [idx, step.variables]);

  // Navigation
  const prev = () => setIdx(i => Math.max(i - 1, 0));
  const next = () => setIdx(i => Math.min(i + 1, steps.length - 1));

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 800, margin: "auto", padding: 16 }}>
      {/* 1. Explanation */}
      <h3>Step {idx + 1} of {steps.length}</h3>
      <p style={{ fontStyle: "italic", color: "#444" }}>{step.description}</p>

      {/* 2. Code Panel */}
      <pre style={{
        background: "#f5f5f5", padding: 12, borderRadius: 4,
        overflowX: "auto", lineHeight: 1.4, marginBottom: 16
      }}>
        {lines.map((l, i) => (
          <div key={i} style={{
            background: step.line === i + 1 ? "#fffae6" : "transparent",
            padding: "2px 4px"
          }}>
            {i + 1}. {l}
          </div>
        ))}
      </pre>

      {/* 3. Call Stack Diagram */}
      <div style={{ marginBottom: 16 }}>
        <strong>Call Stack:</strong>
        <div style={{
          border: "1px solid #ccc", borderRadius: 4,
          padding: 8, background: "#fafafa"
        }}>
          {step.callStack.length === 0 ? (
            <div style={{ color: "#888" }}>(global)</div>
          ) : (
            step.callStack.map((fn, i) => (
              <div key={i} style={{
                padding: "4px 8px", margin: "2px 0",
                background: i === step.callStack.length - 1 ? "#e6f7ff" : "#fff",
                borderLeft: i === step.callStack.length - 1 ? "4px solid #1890ff" : "4px solid transparent"
              }}>
                {fn}()
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. Memory Diagram */}
      <div style={{ marginBottom: 16 }}>
        <strong>Memory:</strong>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
          {Object.entries(memoryRef.current).map(([name, value]) => (
            <div key={name} style={{
              border: `2px solid ${changed.has(name) ? "#52c41a" : "#ccc"}`,
              borderRadius: 4,
              padding: "8px 12px",
              background: changed.has(name) ? "#f6ffed" : "#fafafa",
              minWidth: 80,
              textAlign: "center",
              transition: "background 0.3s, border-color 0.3s"
            }}>
              <div style={{ fontSize: 12, color: "#555" }}>[{name}]</div>
              <div style={{ fontSize: 16, fontWeight: "bold" }}>{String(value)}</div>
            </div>
          ))}
          {Object.keys(memoryRef.current).length === 0 && (
            <div style={{ color: "#888" }}>-- no variables defined --</div>
          )}
        </div>
      </div>

      {/* 5. Controls */}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={prev} disabled={idx === 0}>◀ Prev</button>
        <button onClick={next} disabled={idx === steps.length - 1}>Next ▶</button>
      </div>
    </div>
  );
}
