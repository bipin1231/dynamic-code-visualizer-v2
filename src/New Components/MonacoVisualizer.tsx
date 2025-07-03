import React, { useState, useRef, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import * as Babel from 'babel-standalone';
import { useTracer, ExecutionStep } from '../hooks/useTracer';
import { LanguageExecutor } from '../executors';
import ExecutionDiagram from './ExecutionDiagram';
import DiagramControls from './DiagramControls';
const emitSteps = require('../babel-plugins/emit-steps');

export default function MonacoVisualizer() {
  const { reset, getSteps } = useTracer();
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [index, setIndex] = useState(0);
  const [transformedCode, setTransformedCode] = useState<string>('');
  const executor = useRef(new LanguageExecutor()).current;
  const editorRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const playbackRef = useRef<any>();

  useEffect(() => {
    if (isPlaying && steps.length > 0 && index < steps.length - 1) {
      playbackRef.current = setTimeout(() => {
        setIndex(prev => prev + 1);
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
      reset();
      setIndex(0);
      
      const code = editorRef.current?.getValue() || '';
      const result = Babel.transform(code, { 
        plugins: [emitSteps] 
      });
      
      const transformed = result.code as string;
      setTransformedCode(transformed);
      executor.executeJavaScript(transformed);
      
      const collectedSteps = getSteps();
      setSteps(collectedSteps);
    } catch (error) {
      console.error('Run error:', error);
    }
  };

  const currentStep = steps[index];

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Editor Panel */}
      <div className="flex-1 flex flex-col border-r border-gray-700">
        <div className="bg-gray-800 p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold">Code Editor</h2>
        </div>
        
        <div className="flex-1 h-200px">
          <Editor
            height="200px"
            defaultLanguage="javascript"
            defaultValue="let x = 5;\nlet y = 10;\nx = x + y;\nconsole.log('Result:', x);"
            onMount={handleMount}
            theme="vs-dark"
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
            }}
          />
        </div>
        
        <div className="p-4 bg-gray-800 border-t border-gray-700">
          <button
            onClick={run}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
          >
            Run & Visualize
          </button>
        </div>
      </div>

      {/* Visualization Panel */}
      <div className="flex-1 flex flex-col">
        <div className="bg-gray-800 p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold">Execution Flow</h2>
        </div>
        
        {/* Diagram Visualization */}
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
        
        {/* Step Details */}
        <div className="flex-1 border-t border-gray-700 min-h-[40%] flex flex-col">
          <div className="bg-gray-800 p-4">
            <h2 className="text-lg font-semibold">Step Details</h2>
          </div>
          
          <div className="flex-1 p-4 overflow-auto">
          // In the step details section:
{currentStep ? (
  <div className="space-y-3">
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-gray-800 p-3 rounded">
        <div className="text-sm text-gray-400">Type</div>
        <div>{currentStep.type}</div>
      </div>
      <div className="bg-gray-800 p-3 rounded">
        <div className="text-sm text-gray-400">Line</div>
        <div>{currentStep.line}</div>
      </div>
    </div>
    
    <div className="bg-gray-800 p-3 rounded">
      <div className="text-sm text-gray-400">Description</div>
      <div>{currentStep.description}</div>
    </div>
  </div>
) : (
  <>something went wrong</>
)}
          </div>
        </div>
        
        {/* Controls */}
        {steps.length > 0 && (
          <DiagramControls
            currentStep={index}
            totalSteps={steps.length}
            onPrev={() => setIndex(i => Math.max(i - 1, 0))}
            onNext={() => setIndex(i => Math.min(i + 1, steps.length - 1))}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            isPlaying={isPlaying}
            onStepSelect={setIndex}
          />
        )}
      </div>
    </div>
  );
}