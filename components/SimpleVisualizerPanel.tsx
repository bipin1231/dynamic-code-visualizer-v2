"use client";

import { useEffect, useState, useRef } from "react";
import type { ExecutionStep } from "@/types/execution";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  steps: ExecutionStep[];
  codeSnippet: string;
}

// Function to clean and extract meaningful values from variable declarations
const cleanValue = (value: any) => {
  if (typeof value === 'string') {
    // Remove code syntax from variable declarations
    const simplified = value
      .replace(/^declare variable:/i, '')
      .replace(/(.*?)=/, '')
      .replace(/[;{}()]/g, '')
      .trim();
    
    return simplified || value;
  }
  return value;
};

// Function to extract just the value part from declarations
const extractValue = (value: any): any => {
  if (typeof value === 'string') {
    // Handle assignment patterns: "x = 5", "let y = 10", etc.
    const assignmentMatch = value.match(/=\s*([^;]+)/);
    if (assignmentMatch) return cleanValue(assignmentMatch[1]);
    
    // Handle declaration patterns: "int z = 20"
    const declarationMatch = value.match(/(\w+)\s*=\s*([^;]+)/);
    if (declarationMatch) return cleanValue(declarationMatch[2]);
    
    // Try to parse numeric values
    if (!isNaN(Number(value))) return Number(value);
    
    // Try to parse boolean values
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    
    // Return cleaned string
    return cleanValue(value);
  }
  return value;
};

// Function to get value type as text
const getValueType = (value: any) => {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
};

export default function BeginnerFriendlyVisualizer({ steps, codeSnippet }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1500);
  const [showExplanations, setShowExplanations] = useState(true);
  const [outputHistory, setOutputHistory] = useState<string[]>([]);
  const consoleOutputRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean steps data on load
  const cleanedSteps = useRef(steps.map(step => ({
    ...step,
    variables: step.variables.map(v => ({
      ...v,
      value: extractValue(v.value)
    }))
  }))).current;

  const step = cleanedSteps[currentStep];
  const prevStep = currentStep > 0 ? cleanedSteps[currentStep - 1] : null;

  // Update output history when step changes
  useEffect(() => {
    if (step?.output) {
      setOutputHistory(prev => [...prev, step.output]);
    }
  }, [step]);

  // Scroll console to bottom when new output is added
  useEffect(() => {
    if (consoleOutputRef.current) {
      consoleOutputRef.current.scrollTop = consoleOutputRef.current.scrollHeight;
    }
  }, [outputHistory]);

  const next = () => {
    setCurrentStep((prev) => Math.min(prev + 1, cleanedSteps.length - 1));
  };

  const prev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    } else {
      setIsPlaying(true);
      intervalRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= cleanedSteps.length - 1) {
            setIsPlaying(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    }
  };

  const jumpToStep = (index: number) => {
    setCurrentStep(index);
  };

  // Reset visualizer
  const reset = () => {
    setCurrentStep(0);
    setOutputHistory([]);
    setIsPlaying(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  // Calculate variable changes between steps
  const getVariableChanges = () => {
    if (!prevStep) return {};
    
    const changes: Record<string, {oldValue: any, newValue: any}> = {};
    
    step.variables.forEach(v => {
      const prevVar = prevStep.variables.find(pv => pv.name === v.name);
      if (prevVar && String(prevVar.value) !== String(v.value)) {
        changes[v.name] = {
          oldValue: prevVar.value,
          newValue: v.value
        };
      }
    });
    
    return changes;
  };

  const variableChanges = getVariableChanges();

  // Parse code snippet into lines
  const codeLines = codeSnippet.split("\n");

  // Get step explanation
  const getStepExplanation = () => {
    if (!step) return "";
    
    if (step.variables.length > 0 && Object.keys(variableChanges).length > 0) {
      const changedVars = Object.keys(variableChanges);
      if (changedVars.length === 1) {
        return `We're updating the value of ${changedVars[0]}. It changes from ${variableChanges[changedVars[0]].oldValue} to ${variableChanges[changedVars[0]].newValue}.`;
      } else {
        return "We're updating multiple variables: " + 
          changedVars.map(v => `${v} (${variableChanges[v].oldValue} → ${variableChanges[v].newValue})`).join(", ");
      }
    }
    
    if (step.output) {
      return `This line prints to the console: "${step.output}". Output is displayed below in the console panel.`;
    }
    
    return step.description || "The code is executing this line, but no variables are changing yet.";
  };

  // Render value with type indicator
  const renderValue = (value: any) => {
    const type = typeof value;
    let displayValue = String(value);
    let className = "text-indigo-600";
    
    if (type === "number") {
      className = "text-blue-600";
    } else if (type === "string") {
      displayValue = `"${value}"`;
      className = "text-green-600";
    } else if (type === "boolean") {
      className = "text-purple-600";
    } else if (value === null) {
      displayValue = "null";
      className = "text-gray-600";
    } else if (Array.isArray(value)) {
      displayValue = `[${value.map(v => renderValue(v)).join(", ")}]`;
      className = "text-yellow-600";
    } else if (typeof value === "object") {
      displayValue = `{${Object.entries(value).map(([k, v]) => `${k}: ${renderValue(v)}`).join(", ")}}`;
      className = "text-orange-600";
    }
    
    return <span className={className}>{displayValue}</span>;
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl shadow-xl max-w-6xl mx-auto space-y-6">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-indigo-800 mb-2 flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14.6 16.6l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4zm-5.2 0L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4z"/>
          </svg>
          Interactive Code Visualizer
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Visualize how your code executes step-by-step. See variables change in real-time and understand how values are assigned and updated.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Code Display */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-gray-900 to-indigo-900 text-gray-100 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14.6 16.6l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4zm-5.2 0L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4z"/>
                  </svg>
                  Code Execution
                </div>
                <span className="text-sm font-normal bg-indigo-700 px-2 py-1 rounded">
                  Line {step?.line ?? "-"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-mono text-sm bg-gray-800 rounded-lg p-4 max-h-96 overflow-auto">
                {codeLines.map((line, index) => (
                  <div 
                    key={index} 
                    className={`flex transition-all ${
                      step?.line === index + 1 
                        ? 'bg-indigo-900 border-l-4 border-indigo-400' 
                        : 'opacity-80 hover:opacity-100'
                    }`}
                  >
                    <span className="text-gray-500 w-8 text-right pr-3 block">{index + 1}</span>
                    <pre className={`${step?.line === index + 1 ? 'text-indigo-200' : 'text-gray-300'}`}>
                      {line}
                    </pre>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Console Output */}
          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 text-gray-100 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 17v-6c0-1.1-.9-2-2-2H7V7l-3 3 3 3v-2h4v3H4v3c0 1.1.9 2 2 2h2c0 1.7 1.3 3 3 3s3-1.3 3-3h8v-2h-2zm-9 3c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm7-6h-4v-3h4v3zM13 4h-2v8h2V4z"/>
                </svg>
                Console Output
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                ref={consoleOutputRef}
                className="font-mono text-sm bg-black/80 rounded-lg p-4 max-h-64 overflow-auto"
              >
                {outputHistory.length === 0 ? (
                  <div className="text-gray-500 italic">No output yet. Program output will appear here.</div>
                ) : (
                  outputHistory.map((output, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="py-1 border-b border-gray-700 last:border-b-0"
                    >
                      <span className="text-green-400">$ </span>
                      {output}
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Step Explanation */}
          <Card className="bg-gradient-to-br from-white to-blue-50 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11 9h2V7h-2m1 13c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8m0-18A10 10 0 002 12a10 10 0 0010 10 10 10 0 0010-10A10 10 0 0012 2m-1 15h2v-6h-2v6z"/>
                  </svg>
                  Step Explanation
                </div>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => setShowExplanations(!showExplanations)}
                >
                  {showExplanations ? "Hide" : "Show"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatePresence>
                {showExplanations && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-100 p-2 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-medium text-blue-800 mb-1">What's happening now?</h3>
                          <p className="text-gray-700">{getStepExplanation()}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="p-3 bg-white rounded-lg border border-blue-100">
                          <h4 className="font-medium text-sm text-blue-700 mb-1">Current Line</h4>
                          <p className="text-lg font-bold text-indigo-700">{step?.line ?? "-"}</p>
                        </div>
                        
                        <div className="p-3 bg-white rounded-lg border border-blue-100">
                          <h4 className="font-medium text-sm text-blue-700 mb-1">Total Steps</h4>
                          <p className="text-lg font-bold text-indigo-700">{cleanedSteps.length}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Variables Visualization */}
          <Card className="bg-gradient-to-br from-white to-indigo-50 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 4a2 2 0 00-2 2v4a2 2 0 012 2 2 2 0 01-2 2v4a2 2 0 002 2h16a2 2 0 002-2v-4a2 2 0 01-2-2 2 2 0 012-2V6a2 2 0 00-2-2H4zm14 7.5V12a1 1 0 001 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2a1 1 0 001-1v-.5a1.5 1.5 0 113 0zM7 8h3v8H7V8z"/>
                </svg>
                Variables State
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AnimatePresence mode="popLayout">
                  {(step?.variables || []).map((v) => {
                    const prevValue = prevStep?.variables.find(pv => pv.name === v.name)?.value;
                    const changed = prevValue !== undefined && String(prevValue) !== String(v.value);
                    
                    return (
                      <motion.div
                        key={v.name}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.4 }}
                        className={`p-4 rounded-xl shadow-sm relative overflow-hidden ${
                          changed 
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200' 
                            : 'bg-white border border-gray-100'
                        }`}
                      >
                        {/* Variable header */}
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-indigo-700">{v.name}</span>
                            {changed && (
                              <motion.span 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center gap-1"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                                </svg>
                                Changed
                              </motion.span>
                            )}
                          </div>
                          <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                            {getValueType(v.value)}
                          </span>
                        </div>
                        
                        {/* Value display */}
                        <motion.div
                          key={v.value}
                          initial={{ y: -5, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          className={`text-xl font-bold mt-2 mb-1 ${
                            changed ? 'text-green-600' : 'text-gray-800'
                          }`}
                        >
                          {renderValue(v.value)}
                        </motion.div>
                        
                        {/* Previous value (if changed) */}
                        {changed && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            className="text-xs text-gray-500 mt-1 flex items-center gap-1 border-t border-gray-100 pt-2"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M20 9H4v2h16V9z"/>
                            </svg>
                            <span className="font-medium">Was:</span> 
                            {renderValue(prevValue)}
                          </motion.div>
                        )}
                        
                        {/* Variable visualization */}
                        <div className="mt-3 flex items-center justify-between">
                          <div className="text-xs text-gray-500">Memory Slot:</div>
                          <div className="relative">
                            <div className="w-24 h-8 bg-indigo-100 border border-indigo-200 rounded flex items-center justify-center">
                              <span className="text-indigo-700 font-mono text-sm">{v.name}</span>
                            </div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                              </svg>
                            </div>
                          </div>
                          <div className="text-gray-400">→</div>
                          <div className="w-24 h-8 bg-green-100 border border-green-200 rounded flex items-center justify-center overflow-hidden">
                            <div className="truncate px-2 text-green-700">
                              {String(v.value).slice(0, 12)}{String(v.value).length > 12 ? "..." : ""}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                
                {(step?.variables.length ?? 0) === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    No variables defined at this step
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Timeline */}
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 26c6.1 0 11-4.9 11-11S19.1 4 13 4 2 8.9 2 15s4.9 11 11 11zm0-20c5 0 9 4 9 9s-4 9-9 9-9-4-9-9 4-9 9-9z"/>
              <path d="M13 8v7l5 3"/>
            </svg>
            Execution Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex overflow-x-auto pb-4 -mx-2 px-2 snap-x">
            {cleanedSteps.map((s, index) => (
              <div 
                key={index}
                className="flex-shrink-0 w-64 mx-2 snap-start"
              >
                <div 
                  onClick={() => jumpToStep(index)}
                  className={`cursor-pointer rounded-lg border p-4 h-full transition-all ${
                    currentStep === index 
                      ? "bg-indigo-50 border-indigo-300 shadow-inner" 
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      currentStep === index 
                        ? "bg-indigo-500 text-white" 
                        : "bg-gray-200 text-gray-700"
                    }`}>
                      {index + 1}
                    </div>
                    <div className="font-medium">Line {s.line}</div>
                  </div>
                  <div className="text-sm text-gray-600 mt-2 truncate">
                    {s.description}
                  </div>
                  {s.variables.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {s.variables.slice(0, 3).map((v, idx) => (
                        <span 
                          key={idx} 
                          className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full"
                        >
                          {v.name} = {String(v.value).slice(0, 8)}{String(v.value).length > 8 ? "..." : ""}
                        </span>
                      ))}
                      {s.variables.length > 3 && (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                          +{s.variables.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button 
            onClick={prev} 
            disabled={currentStep === 0}
            variant="outline"
            className="gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/>
            </svg>
            Previous Step
          </Button>
          
          <Button 
            onClick={togglePlay} 
            variant={isPlaying ? "destructive" : "default"}
            className="gap-2"
          >
            {isPlaying ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
                Pause
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Play Execution
              </>
            )}
          </Button>
          
          <Button 
            onClick={next} 
            disabled={currentStep === cleanedSteps.length - 1}
            variant="outline"
            className="gap-2"
          >
            Next Step
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
            </svg>
          </Button>
          
          <Button 
            onClick={reset} 
            variant="outline"
            className="gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
            Reset
          </Button>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Speed:</span>
            <select 
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="bg-white border border-gray-300 rounded-md px-2 py-1 text-sm"
            >
              <option value={2500}>Slow</option>
              <option value={1500}>Medium</option>
              <option value={800}>Fast</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
              Current step
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              Changed variable
            </div>
          </div>
        </div>
      </div>
      
      {/* Learning Tips */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mt-6">
        <h3 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
          Learning Tips for Beginners
        </h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs mt-0.5">1</span>
            <strong>Variables are memory boxes</strong> that store values. Each has a name and a value
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs mt-0.5">2</span>
            <strong>Console output</strong> shows what your program prints using print() or console.log()
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs mt-0.5">3</span>
            <strong>Green highlights</strong> show when a variable's value changes
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs mt-0.5">4</span>
            Different <strong>value types</strong> have different colors (strings, numbers, etc.)
          </li>
        </ul>
      </div>
    </div>
  );
}