import { parseScript } from "esprima"
import { Program, Statement, Expression } from "estree"
// import { Statement, Expression } from "estree"
import { Node, Edge } from "react-flow-renderer"

function isStatement(node: any): node is Statement {
  return (
    node.type.endsWith("Statement") ||
    node.type === "FunctionDeclaration" ||
    node.type === "VariableDeclaration" ||
    node.type === "ExpressionStatement"
  )
}

interface FlowMeta {
  nodes: Node[]
  edges: Edge[]
}

let nodeCounter = 0
const genId = () => `node_${nodeCounter++}`

export function generateFlowchart(code: string): FlowMeta {
  const ast: Program = parseScript(code, { range: true })
  nodeCounter = 0
  const nodes: Node[] = []
  const edges: Edge[] = []

  const startNode: Node = {
  id: 'start',
  data: { label: 'Start' },
  position: { x: 100, y: 0 },
  type: 'input'
}
nodes.push(startNode)


  function createNode(label: string, y: number): Node {
    const id = genId()
    return {
      id,
      data: { label },
      position: { x: 100, y },
      type: 'default'
    }
  }

  
    function traverseStatements(statements: Statement[], startY = 0, parentId?: string): string | null {
    let lastId: string | null = parentId ?? null
    let yOffset = startY

    for (const stmt of statements) {
      let label = getStatementLabel(stmt, code)

if (stmt.type === "ReturnStatement") {
  label = `Return: ${code.slice(stmt.range![0], stmt.range![1])}`
}
      const currentNode = createNode(label, yOffset)
      nodes.push(currentNode)

      if (lastId) {
        edges.push({ id: `e_${lastId}_${currentNode.id}`, source: lastId, target: currentNode.id })
      }

      lastId = currentNode.id
      yOffset += 100

      if (stmt.type === "FunctionDeclaration") {
  const funcId = currentNode.id
  const bodyStmts = stmt.body.body
  const lastFuncStmtId = traverseStatements(bodyStmts, yOffset + 50, funcId)
  if (lastFuncStmtId) lastId = lastFuncStmtId
  yOffset += 200
}

      // Handle compound statements
      if (stmt.type === "IfStatement") {
  const testLabel = getStatementLabel(stmt.test, code)

  const yesNode = createNode("Yes", yOffset + 50)
  const noNode = createNode("No", yOffset + 50)
  nodes.push(yesNode, noNode)

  edges.push({ id: `e_${currentNode.id}_${yesNode.id}`, source: currentNode.id, target: yesNode.id, label: "Yes" })
  edges.push({ id: `e_${currentNode.id}_${noNode.id}`, source: currentNode.id, target: noNode.id, label: "No" })

  // Consequent (Yes)
  if (stmt.consequent.type === "BlockStatement") {
    traverseStatements(stmt.consequent.body, yOffset + 100, yesNode.id)
  }

  // Alternate (No)
  if (stmt.alternate) {
    if (stmt.alternate.type === "BlockStatement") {
      traverseStatements(stmt.alternate.body, yOffset + 200, noNode.id)
    }
  }

  yOffset += 250
}

      if (stmt.type === "WhileStatement" || stmt.type === "ForStatement") {
  const loopLabel = stmt.type === "WhileStatement" ? "While Loop" : "For Loop"
  const loopId = currentNode.id

  if (stmt.body.type === "BlockStatement") {
    const bodyId = traverseStatements(stmt.body.body, yOffset + 50, loopId)

    if (bodyId) {
      edges.push({ id: `e_loopBack_${bodyId}_${loopId}`, source: bodyId, target: loopId, label: "Repeat" })
    }
  }

  yOffset += 150
}

    }

    return lastId
  }

traverseStatements(ast.body.filter(isStatement), 100, 'start')

  return { nodes, edges }
}

function getStatementLabel(node: Statement | Expression, code: string): string {
  if (!node.range) return node.type
  const snippet = code.slice(node.range[0], node.range[1]).trim()
  if (snippet.length > 80) return snippet.slice(0, 80) + "..."
  return snippet.replace(/\n/g, " ")
}
