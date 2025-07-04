import React, { useState, useRef, useEffect } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import * as Babel from "babel-standalone";
import { useTracer, ExecutionStep } from "../hooks/useTracer";
import { RuntimeExecutor } from "../executor/RuntimeExecutor";
import ExecutionDiagram from "./ExecutionDiagram";
import DiagramControls from "./DiagramControls";
import StepDetails from "./StepDetails";

const emitSteps = require("../babel-plugins/emit-steps");

export default function MonacoVisualizer() {
  const { reset, getSteps } = useTracer();
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [index, setIndex] = useState(0);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const executor = useRef(new RuntimeExecutor()).current;

  const editorRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const playbackRef = useRef<any>();

  useEffect(() => {
    const originalLog = console.log;
    console.log = (...args: any[]) => {
      originalLog(...args);
      setConsoleOutput((prev) => [...prev, args.map(String).join(" ")]);
    };
    return () => {
      console.log = originalLog;
    };
  }, []);

  useEffect(() => {
    if (isPlaying && steps.length > 0 && index < steps.length - 1) {
      playbackRef.current = setTimeout(() => {
        setIndex((prev) => prev + 1);
      }, 1000);
    } else if (index >= steps.length - 1) {
      setIsPlaying(false);
    }
    return () => clearTimeout(playbackRef.current);
  }, [isPlaying, index, steps.length]);

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  const run = () => {
    try {
      executor.reset();
      setIndex(0);
      setConsoleOutput([]);
      const code = editorRef.current?.getValue() || "";
      const result = Babel.transform(code, { plugins: [emitSteps] });
      const transformed = result.code as string;
      executor.execute(transformed);
      setSteps(executor.getSteps() as ExecutionStep[]);
      setConsoleOutput(executor.getTerminalOutput());
    } catch (error) {
      console.error("Run error:", error);
    }
  };

  const currentStep = steps[index];

  return (
    <div className="w-screen h-screen flex flex-col bg-gray-900 text-white overflow-hidden">
      {/* Main Content */}
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        {/* Code Editor */}
        <div className="w-full md:w-[35%] flex flex-col border-b md:border-b-0 md:border-r border-gray-700">
          <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
            <h2 className="text-lg font-semibold">Code Editor</h2>
          </div>

          <div className="flex-1 min-h-[200px]">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              defaultValue={`// Write your JS code here\nlet x = 1;\nlet y = 2;\nlet z = x + y;\nconsole.log("Sum:", z);`}
              onMount={handleMount}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
              }}
            />
          </div>

          <div className="p-4 bg-gray-800 border-t border-gray-700 flex justify-start">
            <button
              onClick={run}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors text-sm"
            >
              ▶ Run & Visualize
            </button>
          </div>
        </div>

        {/* Right Panel: Diagram + Step Details + Terminal */}
        <div className="w-full md:w-[65%] flex flex-col overflow-hidden">
          {/* Execution Diagram */}
          <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
            <h2 className="text-lg font-semibold">Execution Diagram</h2>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            {steps.length > 0 ? (
              <ExecutionDiagram
                steps={steps}
                currentStep={index}
                onStepSelect={setIndex}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>Run code to see execution diagram</p>
              </div>
            )}
          </div>

          {/* Bottom Section: Step Details + Terminal */}
          <div className="flex border-t border-gray-700 bg-gray-900 overflow-hidden h-[250px]">
            {/* Step Details */}
            <div className="w-full md:w-2/3 px-4 py-4 overflow-y-auto">
              {currentStep ? (
                <StepDetails step={currentStep} />
              ) : (
                <div className="text-gray-400">Step details will appear here.</div>
              )}
            </div>

            {/* Terminal */}
            <div className="w-full md:w-1/3 border-l border-gray-700 bg-black text-green-400 font-mono px-4 py-3 overflow-y-auto">
              <h3 className="text-sm font-semibold mb-2">🖥 Output</h3>
              {consoleOutput.length > 0 ? (
                <pre className="whitespace-pre-wrap text-xs leading-snug">
                  {consoleOutput.join("\n")}
                </pre>
              ) : (
                <div className="text-gray-500 italic text-xs">No output yet</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      {steps.length > 0 && (
        <DiagramControls
          currentStep={index}
          totalSteps={steps.length}
          onPrev={() => setIndex((i) => Math.max(i - 1, 0))}
          onNext={() => setIndex((i) => Math.min(i + 1, steps.length - 1))}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          isPlaying={isPlaying}
          onSelectStep={setIndex}
        />
      )}
    </div>
  );
}
