import React, { useState, useRef, useEffect } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import * as Babel from "babel-standalone";
import { useTracer, ExecutionStep } from "../hooks/useTracer";
import { RuntimeExecutor } from "../executor/RuntimeExecutor";
import ExecutionDiagram from "./ExecutionDiagram";
import DiagramControls from "./DiagramControls";
const emitSteps = require("../babel-plugins/emit-steps");

export default function MonacoVisualizer() {
  const { reset, getSteps } = useTracer();
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [index, setIndex] = useState(0);
  const [transformedCode, setTransformedCode] = useState<string>("");
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
 const executor = useRef(new RuntimeExecutor()).current;

  const editorRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const playbackRef = useRef<any>();

  // Patch console.log to capture output
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

  // Playback animation of steps
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

  // Run code with instrumentation and collect steps
const run = () => {
  try {
    executor.reset();          // reset internal state
    setIndex(0);
    setConsoleOutput([]);

    const code = editorRef.current?.getValue() || "";
    const result = Babel.transform(code, {
      plugins: [emitSteps],
    });

    const transformed = result.code as string;
    setTransformedCode(transformed);

    executor.execute(transformed); // run instrumented code

    const collectedSteps = executor.getSteps();
setSteps(executor.getSteps() as unknown as ExecutionStep[]);

    const terminalLines = executor.getTerminalOutput();
    setConsoleOutput(terminalLines);
  } catch (error) {
    console.error("Run error:", error);
  }
};


  const currentStep = steps[index];

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Top half: Editor and controls */}
      <div className="flex flex-1 border-b border-gray-700">
        <div className="flex-1 flex flex-col border-r border-gray-700">
          <div className="bg-gray-800 p-4 border-b border-gray-700">
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            >
              Run & Visualize
            </button>
          </div>
        </div>

        {/* Visualization panel */}
        <div className="flex-1 flex flex-col">
          <div className="bg-gray-800 p-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold">Execution Flow</h2>
          </div>

          <div className="flex-1 min-h-[60%]">
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

          {/* Step details & variables */}
          <div className="border-t border-gray-700 bg-gray-800 p-4 min-h-[30%] overflow-auto">
            <h2 className="text-lg font-semibold mb-2">Step Details</h2>
            {currentStep ? (
              <>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-400">Type</div>
                    <div>{currentStep.type}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Line</div>
                    <div>{currentStep.line}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Description</div>
                    <div>{currentStep.description}</div>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-400 mb-1">Variables</div>
                  {currentStep.variables && Object.keys(currentStep.variables).length > 0 ? (
                    <table className="w-full table-auto text-sm border border-gray-700 rounded">
                      <thead>
                        <tr className="bg-gray-700">
                          <th className="border border-gray-600 px-2 py-1 text-left">Variable</th>
                          <th className="border border-gray-600 px-2 py-1 text-left">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(currentStep.variables).map(([key, val]) => (
                          <tr key={key} className="odd:bg-gray-800 even:bg-gray-700">
                            <td className="border border-gray-600 px-2 py-1">{key}</td>
                            <td className="border border-gray-600 px-2 py-1">{JSON.stringify(val)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-gray-500 italic">No variables</div>
                  )}
                </div>
              </>
            ) : (
              <div>Something went wrong</div>
            )}
          </div>
        </div>
      </div>

      {/* Terminal output panel */}
      <div className="h-48 bg-black text-green-400 font-mono p-4 overflow-y-auto border-t border-gray-700">
        <h3 className="font-semibold mb-2">Terminal Output (console.log)</h3>
        {consoleOutput.length > 0 ? (
          <div className="whitespace-pre-wrap">
            {consoleOutput.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        ) : (
          <div className="text-gray-600 italic">No output yet</div>
        )}
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
