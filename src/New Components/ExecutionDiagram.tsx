import React, { useMemo } from "react";
import ReactFlow, {
  ReactFlowProvider,
  Controls,
  Background,
  Node,
  Edge,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { ExecutionStep } from "../hooks/useTracer";

interface ExecutionDiagramProps {
  steps: ExecutionStep[];
  currentStep: number;
  onStepSelect: (index: number) => void;
}

// 🎨 Custom node components
const StepNode = ({ data }: any) => (
  <div
    className={`p-3 rounded-lg shadow text-white ${
      data.isCurrent
        ? "bg-green-600 animate-pulse"
        : "bg-gray-700 hover:bg-gray-600"
    }`}
  >
    <div className="font-mono text-sm">{data.label}</div>
    <div className="text-xs text-gray-300 mt-1">{data.description}</div>
  </div>
);

const ConditionNode = ({ data }: any) => (
  <div
    className={`w-24 h-24 transform rotate-45 flex items-center justify-center text-white shadow ${
      data.isCurrent ? "bg-blue-600 animate-pulse" : "bg-blue-500"
    }`}
  >
    <div className="transform -rotate-45 text-center">
      <div className="font-mono text-sm">{data.label}</div>
      <div className="text-xs text-gray-200 mt-1">{data.description}</div>
    </div>
  </div>
);

const LoopNode = ({ data }: any) => (
  <div
    className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow ${
      data.isCurrent ? "bg-purple-600 animate-pulse" : "bg-purple-500"
    }`}
  >
    <div className="text-center">
      <div className="font-mono text-sm">{data.label}</div>
      <div className="text-xs text-gray-200 mt-1">{data.description}</div>
    </div>
  </div>
);

const FunctionNode = ({ data }: any) => (
  <div
    className={`p-3 rounded-lg shadow text-white ${
      data.isCurrent
        ? "bg-yellow-600 animate-pulse"
        : "bg-yellow-500 hover:bg-yellow-400"
    }`}
  >
    <div className="font-mono text-sm">{data.label}</div>
    <div className="text-xs text-gray-300 mt-1">{data.description}</div>
  </div>
);

// 🗺️ Node type mapping
const nodeTypes = {
  step: StepNode,
  condition: ConditionNode,
  loop: LoopNode,
  function: FunctionNode,
};

export default function ExecutionDiagram({
  steps,
  currentStep,
  onStepSelect,
}: ExecutionDiagramProps) {
  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = steps.map((step, index) => {
      let nodeType = "step";
      if (step.type.includes("condition")) nodeType = "condition";
      if (step.type.includes("loop")) nodeType = "loop";
      if (step.type.includes("function")) nodeType = "function";

      const verticalPos = (index % 3) * 120;

      return {
        id: step.id,
        type: nodeType,
        position: { x: index * 250, y: verticalPos },
        data: {
          label: `Line ${step.line}`,
          description: step.description,
          isCurrent: index === currentStep,
        },
      };
    });

    const edges: Edge[] = steps.slice(0, -1).map((step, index) => ({
      id: `edge-${step.id}-${steps[index + 1].id}`,
      source: step.id,
      target: steps[index + 1].id,
      markerEnd: { type: MarkerType.ArrowClosed },
      animated: true,
      style: {
        stroke: index === currentStep - 1 ? "#22c55e" : "#6b7280",
        strokeWidth: 2,
      },
    }));

    return { nodes, edges };
  }, [steps, currentStep]);

  return (
    <div className="h-full w-full bg-gray-900 rounded-lg">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={(_, node) =>
            onStepSelect(steps.findIndex((s) => s.id === node.id))
          }
          fitView
          minZoom={0.2}
          maxZoom={2}
        >
          <Background color="#444" gap={16} />
          <Controls />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
