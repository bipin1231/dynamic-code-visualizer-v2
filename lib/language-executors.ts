// Enhanced language execution engines with Piston API for all languages
export interface ExecutionResult {
  output: string
  error: string
  success: boolean
  executionTime?: number
}

export class LanguageExecutor {
  // Execute JavaScript (client-side)
  executeJavaScript(code: string): ExecutionResult {
    const startTime = Date.now()
    try {
      const originalLog = console.log
      const originalError = console.error
      let capturedOutput = ""

      console.log = (...args) => {
        capturedOutput += args.join(" ") + "\n"
        originalLog(...args)
      }

      console.error = (...args) => {
        capturedOutput += "ERROR: " + args.join(" ") + "\n"
        originalError(...args)
      }

      // Execute the code
      const result = eval(code)

      // If there's a return value, add it to output
      if (result !== undefined) {
        capturedOutput += `Return value: ${result}\n`
      }

      console.log = originalLog
      console.error = originalError

      return {
        output: capturedOutput || "Code executed successfully",
        error: "",
        success: true,
        executionTime: Date.now() - startTime,
      }
    } catch (error: any) {
      console.log = console.log
      console.error = console.error

      return {
        output: "",
        error: error.message,
        success: false,
        executionTime: Date.now() - startTime,
      }
    }
  }

  // Execute code using Piston API
  async executePistonAPI(code: string, language: string): Promise<ExecutionResult> {
    const startTime = Date.now()

    try {
      // Map our language names to Piston language identifiers
      const languageMap: { [key: string]: { language: string; version: string } } = {
        python: { language: "python", version: "3.10.0" },
        c: { language: "c", version: "10.2.0" },
        cpp: { language: "cpp", version: "10.2.0" },
        java: { language: "java", version: "15.0.2" },
        javascript: { language: "javascript", version: "18.15.0" },
      }

      const pistonLang = languageMap[language]
      if (!pistonLang) {
        throw new Error(`Language ${language} not supported by Piston API`)
      }

      const response = await fetch("https://emkc.org/api/v2/piston/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language: pistonLang.language,
          version: pistonLang.version,
          files: [
            {
              name: `main.${this.getFileExtension(language)}`,
              content: code,
            },
          ],
        }),
      })

      if (!response.ok) {
        throw new Error(`Piston API error: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()

      // Handle Piston API response
      const output = result.run?.stdout || ""
      const error = result.run?.stderr || ""
      const compileError = result.compile?.stderr || ""

      const allErrors = [compileError, error].filter(Boolean).join("\n")

      return {
        output: output || "Code executed successfully",
        error: allErrors,
        success: !allErrors,
        executionTime: Date.now() - startTime,
      }
    } catch (error: any) {
      return {
        output: "",
        error: `Online execution failed: ${error.message}. Please check your internet connection.`,
        success: false,
        executionTime: Date.now() - startTime,
      }
    }
  }

  private getFileExtension(language: string): string {
    switch (language) {
      case "python":
        return "py"
      case "c":
        return "c"
      case "cpp":
        return "cpp"
      case "java":
        return "java"
      case "javascript":
        return "js"
      default:
        return "txt"
    }
  }

  // Execute C code using Piston API
  async executeC(code: string): Promise<ExecutionResult> {
    return this.executePistonAPI(code, "c")
  }

  // Execute C++ code using Piston API
  async executeCpp(code: string): Promise<ExecutionResult> {
    return this.executePistonAPI(code, "cpp")
  }

  // Execute Java code using Piston API
  async executeJava(code: string): Promise<ExecutionResult> {
    return this.executePistonAPI(code, "java")
  }

  // Execute Python using Piston API (now the primary method)
  async executePython(code: string): Promise<ExecutionResult> {
    return this.executePistonAPI(code, "python")
  }
}

// Enhanced Python interpreter with better control flow
class EnhancedPythonInterpreter {
  private variables: Map<string, any> = new Map()
  private output: string[] = []
  private executionStack: { type: string; condition?: any; indent: number }[] = []

  execute(code: string): { output: string; error: string; success: boolean } {
    try {
      this.reset()

      // Parse code into structured blocks
      const blocks = this.parseCodeBlocks(code)

      // Execute the blocks
      this.executeBlocks(blocks)

      return {
        output: this.output.join(""),
        error: "",
        success: true,
      }
    } catch (error: any) {
      return {
        output: this.output.join(""),
        error: error.message,
        success: false,
      }
    }
  }

  private reset() {
    this.variables = new Map()
    this.output = []
    this.executionStack = []
  }

  private parseCodeBlocks(code: string) {
    const lines = code.split("\n")
    const blocks: any[] = []
    let currentBlock: any = null

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()
      const indent = line.length - line.trimStart().length

      if (!trimmed || trimmed.startsWith("#")) continue

      if (trimmed.endsWith(":")) {
        // Start of a new block
        if (currentBlock) {
          blocks.push(currentBlock)
        }

        currentBlock = {
          type: this.getBlockType(trimmed),
          condition: this.getBlockCondition(trimmed),
          indent,
          lines: [],
          body: [],
        }
      } else if (currentBlock && indent > currentBlock.indent) {
        // Part of current block body
        currentBlock.body.push({ line: trimmed, indent })
      } else {
        // Regular line or end of block
        if (currentBlock) {
          blocks.push(currentBlock)
          currentBlock = null
        }

        blocks.push({
          type: "statement",
          line: trimmed,
          indent,
        })
      }
    }

    if (currentBlock) {
      blocks.push(currentBlock)
    }

    return blocks
  }

  private getBlockType(line: string): string {
    if (line.startsWith("if ")) return "if"
    if (line.startsWith("elif ")) return "elif"
    if (line.startsWith("else")) return "else"
    if (line.startsWith("while ")) return "while"
    if (line.startsWith("for ")) return "for"
    if (line.startsWith("def ")) return "function"
    return "block"
  }

  private getBlockCondition(line: string): string {
    if (line.startsWith("if ")) return line.slice(3, -1).trim()
    if (line.startsWith("elif ")) return line.slice(5, -1).trim()
    if (line.startsWith("while ")) return line.slice(6, -1).trim()
    if (line.startsWith("for ")) return line.slice(4, -1).trim()
    return ""
  }

  private executeBlocks(blocks: any[]) {
    for (const block of blocks) {
      if (block.type === "statement") {
        this.executeStatement(block.line)
      } else if (block.type === "while") {
        this.executeWhileLoop(block)
      } else if (block.type === "for") {
        this.executeForLoop(block)
      } else if (block.type === "if") {
        this.executeIfBlock(block)
      }
    }
  }

  private executeWhileLoop(block: any) {
    let iterations = 0
    const MAX_ITERATIONS = 1000

    while (this.evaluateCondition(block.condition) && iterations < MAX_ITERATIONS) {
      iterations++

      for (const bodyItem of block.body) {
        if (bodyItem.line === "break") return
        if (bodyItem.line === "continue") break

        this.executeStatement(bodyItem.line)
      }
    }

    if (iterations >= MAX_ITERATIONS) {
      throw new Error("Maximum iteration limit reached (possible infinite loop)")
    }
  }

  private executeForLoop(block: any) {
    const match = block.condition.match(/(\w+)\s+in\s+(.+)/)
    if (!match) return

    const [, varName, iterableExpr] = match
    const iterable = this.evaluateExpression(iterableExpr)

    if (!Array.isArray(iterable)) return

    for (const item of iterable) {
      this.variables.set(varName, item)

      for (const bodyItem of block.body) {
        if (bodyItem.line === "break") return
        if (bodyItem.line === "continue") break

        this.executeStatement(bodyItem.line)
      }
    }
  }

  private executeIfBlock(block: any) {
    if (this.evaluateCondition(block.condition)) {
      for (const bodyItem of block.body) {
        this.executeStatement(bodyItem.line)
      }
    }
  }

  private executeStatement(line: string) {
    // Handle print statements
    if (line.startsWith("print(")) {
      const match = line.match(/print$$([^)]*)$$/)
      if (match) {
        const args = this.parseArguments(match[1])
        const values = args.positional.map((arg) => this.evaluateExpression(arg))

        let end = "\n"
        if (args.keyword.has("end")) {
          end = this.evaluateExpression(args.keyword.get("end")!)
        }

        this.output.push(values.join(" ") + end)
      }
      return
    }

    // Handle assignments
    if (line.includes("=") && !this.isComparison(line)) {
      const parts = line.split("=")
      if (parts.length === 2) {
        const varName = parts[0].trim()
        const expression = parts[1].trim()

        // Handle compound assignments
        if (varName.includes("+=")) {
          const realVar = varName.replace("+=", "").trim()
          const currentValue = this.variables.get(realVar) || 0
          const newValue = currentValue + this.evaluateExpression(expression)
          this.variables.set(realVar, newValue)
        } else {
          const value = this.evaluateExpression(expression)
          this.variables.set(varName, value)
        }
      }
      return
    }

    // Handle increment operations
    if (line.includes("+=")) {
      const [varName, increment] = line.split("+=").map((s) => s.trim())
      const currentValue = this.variables.get(varName) || 0
      const incrementValue = this.evaluateExpression(increment)
      this.variables.set(varName, currentValue + incrementValue)
      return
    }
  }

  private parseArguments(argsStr: string): { positional: string[]; keyword: Map<string, string> } {
    const positional: string[] = []
    const keyword = new Map<string, string>()

    if (!argsStr.trim()) return { positional, keyword }

    const args = this.splitArguments(argsStr)

    for (const arg of args) {
      if (arg.includes("=")) {
        const [key, value] = arg.split("=", 2).map((s) => s.trim())
        keyword.set(key, value)
      } else {
        positional.push(arg.trim())
      }
    }

    return { positional, keyword }
  }

  private splitArguments(argsStr: string): string[] {
    const args: string[] = []
    let current = ""
    let depth = 0
    let inString = false
    let stringChar = ""

    for (const char of argsStr) {
      if (!inString && (char === '"' || char === "'")) {
        inString = true
        stringChar = char
        current += char
      } else if (inString && char === stringChar) {
        inString = false
        current += char
      } else if (!inString && char === "(") {
        depth++
        current += char
      } else if (!inString && char === ")") {
        depth--
        current += char
      } else if (!inString && char === "," && depth === 0) {
        args.push(current.trim())
        current = ""
      } else {
        current += char
      }
    }

    if (current.trim()) {
      args.push(current.trim())
    }

    return args
  }

  private evaluateCondition(condition: string): boolean {
    const result = this.evaluateExpression(condition)
    return Boolean(result)
  }

  private isComparison(line: string): boolean {
    return (
      line.includes("==") ||
      line.includes("!=") ||
      line.includes("<=") ||
      line.includes(">=") ||
      line.includes("<") ||
      line.includes(">")
    )
  }

  private evaluateExpression(expr: string): any {
    expr = expr.trim()

    // Handle string literals
    if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
      return expr.slice(1, -1)
    }

    // Handle numbers
    if (/^\d+(\.\d+)?$/.test(expr)) {
      return Number.parseFloat(expr)
    }

    // Handle boolean literals
    if (expr === "True") return true
    if (expr === "False") return false
    if (expr === "None") return null

    // Handle variables
    if (this.variables.has(expr)) {
      return this.variables.get(expr)
    }

    // Handle range function
    if (expr.startsWith("range(")) {
      const argsStr = expr.slice(6, -1)
      const args = this.splitArguments(argsStr).map((arg) => this.evaluateExpression(arg))

      if (args.length === 1) {
        return Array.from({ length: args[0] }, (_, i) => i)
      } else if (args.length === 2) {
        return Array.from({ length: args[1] - args[0] }, (_, i) => i + args[0])
      } else if (args.length === 3) {
        const [start, stop, step] = args
        const result = []
        for (let i = start; step > 0 ? i < stop : i > stop; i += step) {
          result.push(i)
        }
        return result
      }
      return []
    }

    // Handle comparisons
    if (expr.includes("<=")) {
      const [left, right] = expr.split("<=").map((e) => this.evaluateExpression(e.trim()))
      return left <= right
    }

    if (expr.includes(">=")) {
      const [left, right] = expr.split(">=").map((e) => this.evaluateExpression(e.trim()))
      return left >= right
    }

    if (expr.includes("==")) {
      const [left, right] = expr.split("==").map((e) => this.evaluateExpression(e.trim()))
      return left == right
    }

    if (expr.includes("!=")) {
      const [left, right] = expr.split("!=").map((e) => this.evaluateExpression(e.trim()))
      return left != right
    }

    if (expr.includes("<")) {
      const [left, right] = expr.split("<").map((e) => this.evaluateExpression(e.trim()))
      return left < right
    }

    if (expr.includes(">")) {
      const [left, right] = expr.split(">").map((e) => this.evaluateExpression(e.trim()))
      return left > right
    }

    // Handle modulo
    if (expr.includes("%")) {
      const [left, right] = expr.split("%").map((e) => this.evaluateExpression(e.trim()))
      return left % right
    }

    // Handle arithmetic operations
    if (expr.includes("+") || expr.includes("-") || expr.includes("*") || expr.includes("/")) {
      try {
        // Simple arithmetic evaluation
        const sanitized = expr.replace(/[^0-9+\-*/.() ]/g, "")
        if (sanitized === expr) {
          return eval(sanitized)
        }
      } catch (e) {
        // Fall through to return the expression as-is
      }
    }

    return expr
  }
}
