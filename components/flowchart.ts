import type { Node, Edge } from "reactflow"

// Define node types for different code constructs
export type FlowchartNodeType = "start" | "end" | "process" | "decision" | "loop" | "function" | "output" | "merge"

export interface FlowchartNode extends Node {
  type: FlowchartNodeType
  data: {
    label: string
    code?: string
    condition?: string
  }
}

export interface FlowchartEdge extends Edge {
  label?: string
}

class FlowchartGenerator {
  private nodes: FlowchartNode[] = []
  private edges: FlowchartEdge[] = []
  private nodeId = 1
  private yPosition = 0
  private xPosition = 0
  private readonly NODE_HEIGHT = 80
  private readonly NODE_WIDTH = 200
  private readonly HORIZONTAL_SPACING = 300
  private readonly VERTICAL_SPACING = 100

  generateFlowchart(code: string): { nodes: FlowchartNode[]; edges: FlowchartEdge[] } {
    this.reset()

    try {
      // Parse JavaScript code into a simple AST-like structure
      const statements = this.parseCode(code)

      // Add start node
      const startNode = this.createNode("start", "START", 0, 0)
      this.nodes.push(startNode)

      let lastNodeId = startNode.id
      this.yPosition = this.VERTICAL_SPACING

      // Process each statement
      for (const statement of statements) {
        const result = this.processStatement(statement, lastNodeId)
        lastNodeId = result.lastNodeId
      }

      // Add end node
      const endNode = this.createNode("end", "END", 0, this.yPosition)
      this.nodes.push(endNode)
      this.edges.push(this.createEdge(lastNodeId, endNode.id))
    } catch (error) {
      console.error("Error generating flowchart:", error)
      // Create a simple error node
      this.nodes = [
        this.createNode("start", "START", 0, 0),
        this.createNode("process", `Error parsing code: ${error}`, 0, this.VERTICAL_SPACING),
        this.createNode("end", "END", 0, this.VERTICAL_SPACING * 2),
      ]
      this.edges = [
        this.createEdge(this.nodes[0].id, this.nodes[1].id),
        this.createEdge(this.nodes[1].id, this.nodes[2].id),
      ]
    }

    return { nodes: this.nodes, edges: this.edges }
  }

  private reset() {
    this.nodes = []
    this.edges = []
    this.nodeId = 1
    this.yPosition = 0
    this.xPosition = 0
  }

  private parseCode(code: string): ParsedStatement[] {
    const lines = code.split("\n").filter((line) => line.trim() && !line.trim().startsWith("//"))
    const statements: ParsedStatement[] = []

    let i = 0
    while (i < lines.length) {
      const line = lines[i].trim()

      if (line.match(/^for\s*\(/)) {
        const forLoop = this.parseForLoop(lines, i)
        statements.push(forLoop.statement)
        i = forLoop.endIndex
      } else if (line.match(/^while\s*\(/)) {
        const whileLoop = this.parseWhileLoop(lines, i)
        statements.push(whileLoop.statement)
        i = whileLoop.endIndex
      } else if (line.match(/^if\s*\(/)) {
        const ifStatement = this.parseIfStatement(lines, i)
        statements.push(ifStatement.statement)
        i = ifStatement.endIndex
      } else if (line.match(/^function\s+\w+/)) {
        const func = this.parseFunction(lines, i)
        statements.push(func.statement)
        i = func.endIndex
      } else {
        statements.push({
          type: this.getStatementType(line),
          content: line,
          condition: null,
          body: [],
        })
        i++
      }
    }

    return statements
  }

  private parseForLoop(lines: string[], startIndex: number): { statement: ParsedStatement; endIndex: number } {
    const line = lines[startIndex].trim()
    const forMatch = line.match(/for\s*$$\s*(.+?)\s*;\s*(.+?)\s*;\s*(.+?)\s*$$/)

    const condition = forMatch ? `${forMatch[1]}; ${forMatch[2]}; ${forMatch[3]}` : line
    const { body, endIndex } = this.parseBlock(lines, startIndex)

    return {
      statement: {
        type: "loop",
        content: line,
        condition,
        body,
      },
      endIndex,
    }
  }

  private parseWhileLoop(lines: string[], startIndex: number): { statement: ParsedStatement; endIndex: number } {
    const line = lines[startIndex].trim()
    const whileMatch = line.match(/while\s*$$\s*(.+?)\s*$$/)

    const condition = whileMatch ? whileMatch[1] : line
    const { body, endIndex } = this.parseBlock(lines, startIndex)

    return {
      statement: {
        type: "loop",
        content: line,
        condition,
        body,
      },
      endIndex,
    }
  }

  private parseIfStatement(lines: string[], startIndex: number): { statement: ParsedStatement; endIndex: number } {
    const line = lines[startIndex].trim()
    const ifMatch = line.match(/if\s*$$\s*(.+?)\s*$$/)

    const condition = ifMatch ? ifMatch[1] : line
    const { body, endIndex } = this.parseBlock(lines, startIndex)

    return {
      statement: {
        type: "decision",
        content: line,
        condition,
        body,
      },
      endIndex,
    }
  }

  private parseFunction(lines: string[], startIndex: number): { statement: ParsedStatement; endIndex: number } {
    const line = lines[startIndex].trim()
    const { body, endIndex } = this.parseBlock(lines, startIndex)

    return {
      statement: {
        type: "function",
        content: line,
        condition: null,
        body,
      },
      endIndex,
    }
  }

  private parseBlock(lines: string[], startIndex: number): { body: ParsedStatement[]; endIndex: number } {
    const body: ParsedStatement[] = []
    let braceCount = 0
    let i = startIndex
    let foundOpenBrace = false

    // Find opening brace
    while (i < lines.length && !foundOpenBrace) {
      if (lines[i].includes("{")) {
        foundOpenBrace = true
        braceCount = 1
        i++
        break
      }
      i++
    }

    if (!foundOpenBrace) {
      return { body: [], endIndex: startIndex + 1 }
    }

    // Parse block content
    while (i < lines.length && braceCount > 0) {
      const line = lines[i].trim()

      if (line.includes("{")) {
        braceCount += (line.match(/\{/g) || []).length
      }
      if (line.includes("}")) {
        braceCount -= (line.match(/\}/g) || []).length
      }

      if (braceCount > 0 && line && !line.startsWith("//")) {
        body.push({
          type: this.getStatementType(line),
          content: line,
          condition: null,
          body: [],
        })
      }

      i++
    }

    return { body, endIndex: i }
  }

  private getStatementType(line: string): FlowchartNodeType {
    if (line.includes("console.log") || line.includes("print")) {
      return "output"
    } else if (line.includes("return")) {
      return "end"
    } else if (line.match(/^(let|const|var|.*=)/)) {
      return "process"
    } else {
      return "process"
    }
  }

  private processStatement(statement: ParsedStatement, previousNodeId: string): { lastNodeId: string } {
    switch (statement.type) {
      case "loop":
        return this.processLoop(statement, previousNodeId)
      case "decision":
        return this.processDecision(statement, previousNodeId)
      case "function":
        return this.processFunction(statement, previousNodeId)
      default:
        return this.processSimpleStatement(statement, previousNodeId)
    }
  }

  private processLoop(statement: ParsedStatement, previousNodeId: string): { lastNodeId: string } {
    // Create loop condition node
    const conditionNode = this.createNode("decision", `Loop: ${statement.condition}`, 0, this.yPosition)
    this.nodes.push(conditionNode)
    this.edges.push(this.createEdge(previousNodeId, conditionNode.id))

    this.yPosition += this.VERTICAL_SPACING

    // Process loop body
    let lastBodyNodeId = conditionNode.id
    const bodyStartY = this.yPosition

    for (const bodyStatement of statement.body) {
      const result = this.processStatement(bodyStatement, lastBodyNodeId)
      lastBodyNodeId = result.lastNodeId
    }

    // Create loop back edge
    if (lastBodyNodeId !== conditionNode.id) {
      this.edges.push(this.createEdge(lastBodyNodeId, conditionNode.id, "Continue"))
    }

    // Create exit edge
    const exitY = Math.max(this.yPosition, bodyStartY + this.VERTICAL_SPACING)
    this.yPosition = exitY

    return { lastNodeId: conditionNode.id }
  }

  private processDecision(statement: ParsedStatement, previousNodeId: string): { lastNodeId: string } {
    // Create decision node
    const decisionNode = this.createNode("decision", `If: ${statement.condition}`, 0, this.yPosition)
    this.nodes.push(decisionNode)
    this.edges.push(this.createEdge(previousNodeId, decisionNode.id))

    this.yPosition += this.VERTICAL_SPACING

    // Process if body (true branch)
    let lastTrueNodeId = decisionNode.id
    const trueStartY = this.yPosition
    const trueStartX = this.xPosition - this.HORIZONTAL_SPACING / 2

    for (const bodyStatement of statement.body) {
      const result = this.processStatement(bodyStatement, lastTrueNodeId)
      lastTrueNodeId = result.lastNodeId
    }

    // Create merge node
    const mergeY = Math.max(this.yPosition, trueStartY + this.VERTICAL_SPACING)
    this.yPosition = mergeY + this.VERTICAL_SPACING

    const mergeNode = this.createNode("merge", "Merge", 0, mergeY)
    this.nodes.push(mergeNode)

    // Connect branches to merge
    this.edges.push(this.createEdge(decisionNode.id, lastTrueNodeId, "Yes"))
    this.edges.push(this.createEdge(decisionNode.id, mergeNode.id, "No"))

    if (lastTrueNodeId !== decisionNode.id) {
      this.edges.push(this.createEdge(lastTrueNodeId, mergeNode.id))
    }

    return { lastNodeId: mergeNode.id }
  }

  private processFunction(statement: ParsedStatement, previousNodeId: string): { lastNodeId: string } {
    const functionNode = this.createNode("function", statement.content, 0, this.yPosition)
    this.nodes.push(functionNode)
    this.edges.push(this.createEdge(previousNodeId, functionNode.id))

    this.yPosition += this.VERTICAL_SPACING

    // Process function body
    let lastBodyNodeId = functionNode.id
    for (const bodyStatement of statement.body) {
      const result = this.processStatement(bodyStatement, lastBodyNodeId)
      lastBodyNodeId = result.lastNodeId
    }

    return { lastNodeId: lastBodyNodeId }
  }

  private processSimpleStatement(statement: ParsedStatement, previousNodeId: string): { lastNodeId: string } {
    const node = this.createNode(statement.type, statement.content, 0, this.yPosition)
    this.nodes.push(node)
    this.edges.push(this.createEdge(previousNodeId, node.id))

    this.yPosition += this.VERTICAL_SPACING

    return { lastNodeId: node.id }
  }

  private createNode(type: FlowchartNodeType, label: string, x: number, y: number): FlowchartNode {
    const id = `node-${this.nodeId++}`

    return {
      id,
      type,
      position: { x: x + this.xPosition, y },
      data: { label },
      style: {
        width: this.NODE_WIDTH,
        height: this.NODE_HEIGHT,
        backgroundColor: this.getNodeColor(type),
        border: "2px solid #333",
        borderRadius: type === "decision" ? "50%" : "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "12px",
        fontWeight: "bold",
        color: "#333",
        textAlign: "center",
        padding: "8px",
      },
    }
  }

  private createEdge(source: string, target: string, label?: string): FlowchartEdge {
    return {
      id: `edge-${source}-${target}`,
      source,
      target,
      label,
      style: { stroke: "#333", strokeWidth: 2 },
      labelStyle: { fontSize: "10px", fontWeight: "bold" },
      labelBgStyle: { fill: "#fff", fillOpacity: 0.8 },
    }
  }

  private getNodeColor(type: FlowchartNodeType): string {
    switch (type) {
      case "start":
        return "#4ade80" // green
      case "end":
        return "#f87171" // red
      case "decision":
        return "#fbbf24" // yellow
      case "loop":
        return "#a78bfa" // purple
      case "function":
        return "#60a5fa" // blue
      case "output":
        return "#34d399" // emerald
      case "merge":
        return "#d1d5db" // gray
      default:
        return "#e5e7eb" // light gray
    }
  }
}

interface ParsedStatement {
  type: FlowchartNodeType
  content: string
  condition: string | null
  body: ParsedStatement[]
}

export function generateFlowchart(code: string): { nodes: FlowchartNode[]; edges: FlowchartEdge[] } {
  const generator = new FlowchartGenerator()
  return generator.generateFlowchart(code)
}
