import React, { useMemo, useEffect } from "react";
import ReactFlow, {
  ReactFlowProvider,
  Controls,
  Background,
  MiniMap,
  Node,
  Edge,
  MarkerType,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import { ExecutionStep } from "../hooks/useTracer";
import {
  BeakerIcon,
  ArrowPathIcon,
  CodeBracketIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/solid";

interface ExecutionDiagramProps {
  steps: ExecutionStep[];
  currentStep: number;
  onStepSelect: (index: number) => void;
}

const typeIconMap: Record<string, React.ReactNode> = {
  loop: <ArrowPathIcon className="w-4 h-4 mr-1" />,
  condition: <QuestionMarkCircleIcon className="w-4 h-4 mr-1" />,
  function: <CodeBracketIcon className="w-4 h-4 mr-1" />,
  default: <BeakerIcon className="w-4 h-4 mr-1" />,
};

const getTypeIcon = (type: string) => {
  if (type.includes("loop")) return typeIconMap.loop;
  if (type.includes("condition")) return typeIconMap.condition;
  if (type.includes("function")) return typeIconMap.function;
  return typeIconMap.default;
};

export default function ExecutionDiagram({
  steps,
  currentStep,
  onStepSelect,
}: ExecutionDiagramProps) {
  const { fitView } = useReactFlow();

  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = steps.map((step, index) => {
      const y = index % 2 === 0 ? 100 : 250; // Zigzag layout
      const type = step.type;
      const color =
        type.includes("loop")
          ? "bg-purple-600"
          : type.includes("condition")
          ? "bg-blue-600"
          : type.includes("function")
          ? "bg-yellow-600"
          : "bg-gray-700";

      return {
        id: step.id,
        type: "default",
        position: { x: index * 230, y },
        data: {
          label: (
            <div
              className={`relative group p-3 rounded-lg shadow-xl text-white w-48 font-mono text-xs transition-transform duration-200 ${
                currentStep === index ? "scale-105 ring-2 ring-green-400" : "hover:scale-105"
              } ${color}`}
            >
              <div className="flex items-center font-semibold text-sm mb-1">
                {getTypeIcon(type)}
                Step #{index + 1} | Line {step.line}
              </div>
              <div className="truncate">{step.description}</div>

              <div className="absolute opacity-0 group-hover:opacity-100 transition bg-black text-white text-xs rounded px-2 py-1 z-10 top-full left-1/2 -translate-x-1/2 mt-2 shadow-xl max-w-[200px]">
                {step.description}
              </div>
            </div>
          ),
        },
      };
    });

    const edges: Edge[] = steps.slice(0, -1).map((step, i) => ({
      id: `e-${i}`,
      source: step.id,
      target: steps[i + 1].id,
      markerEnd: { type: MarkerType.ArrowClosed },
      animated: true,
      style: {
        stroke: currentStep === i + 1 ? "#22c55e" : "#888",
        strokeWidth: currentStep === i + 1 ? 3 : 1.5,
      },
    }));

    return { nodes, edges };
  }, [steps, currentStep]);

  // Zoom to fit on first mount or when steps change
  useEffect(() => {
    setTimeout(() => {
      fitView({ padding: 0.4 });
    }, 100);
  }, [steps]);

  return (
    <div className="h-full w-full bg-gray-900 rounded-lg">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodeClick={(_, node) =>
            onStepSelect(steps.findIndex((s) => s.id === node.id))
          }
          fitView
          minZoom={0.25}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
      
          <Controls />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
