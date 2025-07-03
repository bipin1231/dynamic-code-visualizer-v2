"use client"
import React, { useCallback } from "react"
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  type Node,
  type Edge,
} from "react-flow-renderer"

interface Props {
  nodes: Node[]
  edges: Edge[]
}

export const FlowchartView: React.FC<Props> = ({ nodes, edges }) => {
  const [flowNodes, setNodes, onNodesChange] = useNodesState(nodes)
  const [flowEdges, setEdges, onEdgesChange] = useEdgesState(edges)

  // Update nodes and edges when props change
  React.useEffect(() => {
    setNodes(nodes)
    setEdges(edges)
  }, [nodes, edges, setNodes, setEdges])

  const onConnect = useCallback(() => {
    // Prevent manual connections
  }, [])

  return (
    <div style={{ height: 600, border: "1px solid #ddd", borderRadius: "8px", overflow: "hidden" }}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        connectionMode={ConnectionMode.Strict}
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false,
        }}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        minZoom={0.2}
        maxZoom={2}
        attributionPosition="bottom-left"
      >
        <Background variant="dots" gap={20} size={1} color="#e0e0e0" />
        <Controls position="top-right" showZoom={true} showFitView={true} showInteractive={false} />
        <MiniMap
          nodeColor={(node) => {
            switch (node.type) {
              case "input":
                return "#4caf50"
              case "output":
                return "#f44336"
              case "diamond":
                return "#ff9800"
              default:
                return "#2196f3"
            }
          }}
          nodeStrokeWidth={3}
          position="bottom-right"
          style={{
            height: 120,
            width: 200,
            backgroundColor: "#f5f5f5",
            border: "1px solid #ddd",
          }}
        />
      </ReactFlow>
    </div>
  )
}
