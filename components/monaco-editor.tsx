"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"

interface MonacoEditorProps {
  value: string
  onChange: (value: string) => void
  language: string
  currentLine?: number
  breakpoints?: number[]
  onBreakpointToggle?: (lineNumber: number) => void
  disabled?: boolean
}

export default function MonacoEditor({
  value,
  onChange,
  language,
  currentLine = -1,
  breakpoints = [],
  onBreakpointToggle,
  disabled = false,
}: MonacoEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)
  const [lines, setLines] = useState<string[]>([])

  useEffect(() => {
    const newLines = value.split("\n")
    setLines(newLines)
  }, [value])

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    onChange(newValue)
  }

  const handleLineNumberClick = (lineNumber: number) => {
    if (onBreakpointToggle) {
      onBreakpointToggle(lineNumber)
    }
  }

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop
    }
  }

  const getLanguageClass = (lang: string) => {
    switch (lang) {
      case "javascript":
      case "typescript":
        return "language-javascript"
      case "python":
        return "language-python"
      case "java":
        return "language-java"
      case "cpp":
        return "language-cpp"
      default:
        return "language-javascript"
    }
  }

  return (
    <div className="relative w-full h-96 border rounded-md overflow-hidden bg-[#1e1e1e] flex">
      {/* Line Numbers */}
      <div
        ref={lineNumbersRef}
        className="flex-shrink-0 w-12 bg-[#1e1e1e] border-r border-gray-600 overflow-hidden"
        style={{ fontSize: "14px", lineHeight: "20px" }}
      >
        {lines.map((_, index) => {
          const lineNumber = index + 1
          const isCurrentLine = lineNumber === currentLine
          const hasBreakpoint = breakpoints.includes(lineNumber)

          return (
            <div
              key={lineNumber}
              className={`
                relative h-5 flex items-center justify-end pr-2 cursor-pointer select-none
                ${isCurrentLine ? "bg-yellow-500/20" : "hover:bg-gray-700/50"}
                ${hasBreakpoint ? "bg-red-500/20" : ""}
              `}
              onClick={() => handleLineNumberClick(lineNumber)}
              style={{ minHeight: "20px" }}
            >
              {hasBreakpoint && <div className="absolute left-1 w-3 h-3 bg-red-500 rounded-full"></div>}
              {isCurrentLine && <div className="absolute left-1 w-1 h-full bg-yellow-400"></div>}
              <span className="text-[#858585] text-sm font-mono">{lineNumber}</span>
            </div>
          )
        })}
      </div>

      {/* Code Editor */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextChange}
          onScroll={handleScroll}
          disabled={disabled}
          className={`
            w-full h-full p-2 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm
            border-none outline-none resize-none leading-5
            ${getLanguageClass(language)}
          `}
          style={{
            fontSize: "14px",
            lineHeight: "20px",
            fontFamily:
              "'Fira Code', 'Cascadia Code', 'JetBrains Mono', 'SF Mono', Monaco, Menlo, 'Ubuntu Mono', monospace",
            tabSize: 2,
          }}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          placeholder="Write your code here..."
        />

        {/* Syntax Highlighting Overlay */}
        <div
          className="absolute top-0 left-0 w-full h-full pointer-events-none p-2 font-mono text-sm leading-5 whitespace-pre-wrap overflow-hidden"
          style={{
            fontSize: "14px",
            lineHeight: "20px",
            fontFamily:
              "'Fira Code', 'Cascadia Code', 'JetBrains Mono', 'SF Mono', Monaco, Menlo, 'Ubuntu Mono', monospace",
            color: "transparent",
            background: "transparent",
          }}
        >
          <SyntaxHighlighter code={value} language={language} />
        </div>
      </div>

      <style jsx global>{`
        .language-javascript .keyword { color: #569CD6; font-weight: bold; }
        .language-javascript .string { color: #CE9178; }
        .language-javascript .number { color: #B5CEA8; }
        .language-javascript .comment { color: #6A9955; font-style: italic; }
        .language-javascript .function { color: #DCDCAA; }
        .language-javascript .operator { color: #D4D4D4; }
        
        .language-python .keyword { color: #569CD6; font-weight: bold; }
        .language-python .string { color: #CE9178; }
        .language-python .number { color: #B5CEA8; }
        .language-python .comment { color: #6A9955; font-style: italic; }
        .language-python .function { color: #DCDCAA; }
        
        .language-java .keyword { color: #569CD6; font-weight: bold; }
        .language-java .string { color: #CE9178; }
        .language-java .number { color: #B5CEA8; }
        .language-java .comment { color: #6A9955; font-style: italic; }
        .language-java .function { color: #DCDCAA; }
        
        .language-cpp .keyword { color: #569CD6; font-weight: bold; }
        .language-cpp .string { color: #CE9178; }
        .language-cpp .number { color: #B5CEA8; }
        .language-cpp .comment { color: #6A9955; font-style: italic; }
        .language-cpp .function { color: #DCDCAA; }
      `}</style>
    </div>
  )
}

// Simple syntax highlighter component
function SyntaxHighlighter({ code, language }: { code: string; language: string }) {
  const highlightCode = (text: string, lang: string) => {
    if (!text) return ""

    let highlighted = text

    // JavaScript/TypeScript keywords
    if (lang === "javascript" || lang === "typescript") {
      const keywords = [
        "function",
        "const",
        "let",
        "var",
        "if",
        "else",
        "for",
        "while",
        "return",
        "class",
        "import",
        "export",
        "default",
        "async",
        "await",
        "try",
        "catch",
        "finally",
        "throw",
        "new",
        "this",
        "super",
        "extends",
        "implements",
        "interface",
        "type",
        "enum",
        "namespace",
        "module",
        "declare",
        "public",
        "private",
        "protected",
        "static",
        "readonly",
        "abstract",
      ]

      keywords.forEach((keyword) => {
        const regex = new RegExp(`\\b${keyword}\\b`, "g")
        highlighted = highlighted.replace(regex, `<span class="keyword">${keyword}</span>`)
      })

      // Strings
      highlighted = highlighted.replace(/(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g, '<span class="string">$1$2$1</span>')

      // Numbers
      highlighted = highlighted.replace(/\b\d+\.?\d*\b/g, '<span class="number">$&</span>')

      // Comments
      highlighted = highlighted.replace(/\/\/.*$/gm, '<span class="comment">$&</span>')
      highlighted = highlighted.replace(/\/\*[\s\S]*?\*\//g, '<span class="comment">$&</span>')

      // Functions
      highlighted = highlighted.replace(/\b(\w+)\s*\(/g, '<span class="function">$1</span>(')
    }

    // Python keywords
    if (lang === "python") {
      const keywords = [
        "def",
        "class",
        "if",
        "elif",
        "else",
        "for",
        "while",
        "try",
        "except",
        "finally",
        "with",
        "as",
        "import",
        "from",
        "return",
        "yield",
        "lambda",
        "and",
        "or",
        "not",
        "in",
        "is",
        "None",
        "True",
        "False",
        "pass",
        "break",
        "continue",
        "global",
        "nonlocal",
        "assert",
        "del",
        "raise",
      ]

      keywords.forEach((keyword) => {
        const regex = new RegExp(`\\b${keyword}\\b`, "g")
        highlighted = highlighted.replace(regex, `<span class="keyword">${keyword}</span>`)
      })

      // Strings
      highlighted = highlighted.replace(/(["'])((?:\\.|(?!\1)[^\\])*?)\1/g, '<span class="string">$1$2$1</span>')

      // Numbers
      highlighted = highlighted.replace(/\b\d+\.?\d*\b/g, '<span class="number">$&</span>')

      // Comments
      highlighted = highlighted.replace(/#.*$/gm, '<span class="comment">$&</span>')

      // Functions
      highlighted = highlighted.replace(/\bdef\s+(\w+)/g, 'def <span class="function">$1</span>')
    }

    return highlighted
  }

  return (
    <div
      dangerouslySetInnerHTML={{
        __html: highlightCode(code, language),
      }}
    />
  )
}
