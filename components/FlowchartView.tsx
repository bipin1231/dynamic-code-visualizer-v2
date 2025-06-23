'use client';
import React from 'react';
import ReactFlow, { MiniMap, Controls } from 'react-flow-renderer';
import type { Node, Edge } from 'react-flow-renderer';

interface Props {
  nodes: Node[];
  edges: Edge[];
}

export const FlowchartView: React.FC<Props> = ({ nodes, edges }) => (
  <div style={{ height: 500, border: '1px solid #ddd', marginTop: 16 }}>
    <ReactFlow nodes={nodes} edges={edges}>
      <MiniMap />
      <Controls />
    </ReactFlow>
  </div>
);
