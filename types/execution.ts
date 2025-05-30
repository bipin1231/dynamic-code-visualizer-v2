export interface Variable {
  name: string
  value: any
  type: string
}

export interface ExecutionStep {
  id: string
  line: number
  variables: Variable[]
  callStack: string[]
  output: string
  timestamp: number
  description: string
  type: "function_call" | "variable_assignment" | "condition" | "loop" | "return" | "output"
}
