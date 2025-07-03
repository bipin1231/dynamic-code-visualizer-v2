import React, { useMemo } from 'react';
import ReactFlow, { 
  ReactFlowProvider, 
  Controls, 
  Background, 
  Node, 
  Edge, 
  MarkerType 
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ExecutionStep } from '../hooks/useTracer';

interface ExecutionDiagramProps {
  steps: ExecutionStep[];
  currentStep: number;
  onStepSelect: (index: number) => void;
}

// Custom node components
const StepNode = ({ data }: any) => (
  <div className={`p-3 rounded border-2 ${
    data.isCurrent 
      ? 'border-green-500 bg-green-900/20' 
      : 'border-gray-600'
  }`}>
    <div className="font-mono text-sm">{data.label}</div>
    <div className="text-xs text-gray-400 mt-1">{data.description}</div>
  </div>
);

const ConditionNode = ({ data }: any) => (
  <div className="flex items-center justify-center w-24 h-24 transform rotate-45 border-2 border-blue-500 bg-blue-900/10">
    <div className="transform -rotate-45 text-center">
      <div className="font-mono text-sm">{data.label}</div>
      <div className="text-xs text-gray-400 mt-1">{data.description}</div>
    </div>
  </div>
);

const LoopNode = ({ data }: any) => (
  <div className="flex items-center justify-center w-20 h-20 rounded-full border-2 border-purple-500 bg-purple-900/10">
    <div className="text-center">
      <div className="font-mono text-sm">{data.label}</div>
      <div className="text-xs text-gray-400 mt-1">{data.description}</div>
    </div>
  </div>
);

const FunctionNode = ({ data }: any) => (
  <div className={`p-3 rounded-lg border-2 ${
    data.isCurrent 
      ? 'border-yellow-500 bg-yellow-900/20' 
      : 'border-yellow-300'
  }`}>
    <div className="font-mono text-sm">{data.label}</div>
    <div className="text-xs text-gray-400 mt-1">{data.description}</div>
  </div>
);

// Node type mapping
const nodeTypes = {
  step: StepNode,
  condition: ConditionNode,
  loop: LoopNode,
  function: FunctionNode,
};

export default function ExecutionDiagram({ 
  steps, 
  currentStep,
  onStepSelect 
}: ExecutionDiagramProps) {
  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = steps.map((step, index) => {
      // Determine node type based on step type
      let nodeType = 'step';
      if (step.type.includes('condition')) nodeType = 'condition';
      if (step.type.includes('loop')) nodeType = 'loop';
      if (step.type.includes('function')) nodeType = 'function';
      
      // Stagger vertical position for better visibility
      const verticalPos = (index % 3) * 100;
      
      return {
        id: step.id,
        type: nodeType,
        position: { x: index * 250, y: verticalPos },
        data: {
          label: `Line ${step.line}: ${step.type.replace(/_/g, ' ')}`,
          description: step.description,
          isCurrent: index === currentStep
        }
      };
    });

    const edges: Edge[] = steps.slice(0, -1).map((step, index) => ({
      id: `edge-${step.id}-${steps[index+1].id}`,
      source: step.id,
      target: steps[index+1].id,
      markerEnd: { type: MarkerType.ArrowClosed },
      animated: index === currentStep - 1,
      style: {
        stroke: index === currentStep - 1 ? '#10B981' : '#6B7280',
        strokeWidth: 2
      }
    }));

    return { nodes, edges };
  }, [steps, currentStep]);

  return (
    <div className="h-full w-full bg-gray-800 rounded-lg">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={(_, node) => 
            onStepSelect(steps.findIndex(s => s.id === node.id))
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