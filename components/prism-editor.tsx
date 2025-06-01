"use client"

import { useEffect, useRef, useState } from "react"
import Editor from "react-simple-code-editor"

interface PrismEditorProps {
  value: string
  onChange: (value: string) => void
  language: string
  currentLine?: number
  breakpoints?: number[]
  onBreakpointToggle?: (lineNumber: number) => void
  disabled?: boolean
}

export default function PrismEditor({
  value,
  onChange,
  language,
  currentLine = -1,
  breakpoints = [],
  onBreakpointToggle,
  disabled = false,
}: PrismEditorProps) {
  const [lines, setLines] = useState<string[]>([])
  const lineNumbersRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLines(value.split("\n"))
  }, [value])

  const highlight = (code: string) => {
    // Simple syntax highlighting using regex
    let highlighted = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

    if (language === "javascript" || language === "typescript") {
      // Keywords
      highlighted = highlighted.replace(
        /\b(function|const|let|var|if|else|for|while|return|class|import|export|default|async|await|try|catch|finally|throw|new|this|super|extends|typeof|instanceof)\b/g,
        '<span style="color: #569cd6; font-weight: 500;">$1</span>',
      )

      // Strings
      highlighted = highlighted.replace(
        /(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g,
        '<span style="color: #ce9178;">$1$2$1</span>',
      )

      // Numbers
      highlighted = highlighted.replace(/\b\d+\.?\d*\b/g, '<span style="color: #b5cea8;">$&</span>')

      // Comments
      highlighted = highlighted.replace(/\/\/.*$/gm, '<span style="color: #6a9955; font-style: italic;">$&</span>')

      // Function names
      highlighted = highlighted.replace(/\b(\w+)(?=\s*\()/g, '<span style="color: #dcdcaa;">$1</span>')

      // Console
      highlighted = highlighted.replace(/\bconsole\b/g, '<span style="color: #4ec9b0;">console</span>')
    }

    return highlighted
  }

  const handleScroll = (e: any) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.target.scrollTop
    }
  }

  return (
    <div className="w-full h-96 border rounded-md overflow-hidden bg-[#1e1e1e] flex">
      {/* Line Numbers */}
      <div
        ref={lineNumbersRef}
        className="flex-shrink-0 w-16 bg-[#252526] border-r border-[#3e3e42] overflow-hidden select-none"
        style={{ fontSize: "14px", lineHeight: "20px" }}
      >
        <div className="py-2">
          {lines.map((_, index) => {
            const lineNumber = index + 1
            const isCurrentLine = lineNumber === currentLine
            const hasBreakpoint = breakpoints.includes(lineNumber)

            return (
              <div
                key={lineNumber}
                className={`
                  relative h-5 flex items-center justify-end pr-2 cursor-pointer transition-all duration-200
                  ${isCurrentLine ? "bg-yellow-500/30 border-l-4 border-yellow-500" : "hover:bg-[#2a2d2e]"}
                  ${hasBreakpoint ? "bg-red-500/30" : ""}
                `}
                onClick={() => onBreakpointToggle && onBreakpointToggle(lineNumber)}
                style={{ minHeight: "20px" }}
              >
                {hasBreakpoint && (
                  <div className="absolute left-1 w-3 h-3 bg-red-500 rounded-full border border-red-400 animate-pulse"></div>
                )}
                <span
                  className={`text-sm font-mono transition-all duration-200 ${
                    isCurrentLine ? "text-white font-bold" : "text-[#858585]"
                  }`}
                >
                  {lineNumber}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Code Editor */}
      <div className="flex-1 relative overflow-hidden">
        {/* Current Line Highlight */}
        {currentLine > 0 && (
          <div
            className="absolute left-0 right-0 bg-yellow-500/20 pointer-events-none z-10 border-l-4 border-yellow-500"
            style={{
              top: `${(currentLine - 1) * 20 + 8}px`,
              height: "20px",
            }}
          />
        )}

        <div
          ref={editorRef}
          className="h-full overflow-auto"
          onScroll={handleScroll}
          style={{
            fontSize: "14px",
            lineHeight: "20px",
            fontFamily: "Consolas, Monaco, 'Courier New', monospace",
          }}
        >
          <Editor
            value={value}
            onValueChange={onChange}
            highlight={highlight}
            padding={8}
            disabled={disabled}
            style={{
              fontFamily: "Consolas, Monaco, 'Courier New', monospace",
              fontSize: "14px",
              lineHeight: "20px",
              backgroundColor: "#1e1e1e",
              color: "#d4d4d4",
              outline: "none",
              border: "none",
              minHeight: "100%",
            }}
            textareaProps={{
              style: {
                outline: "none",
                border: "none",
                resize: "none",
              },
            }}
          />
        </div>
      </div>
    </div>
  )
}
