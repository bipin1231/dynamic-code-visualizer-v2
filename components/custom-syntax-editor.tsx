"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"

interface CustomSyntaxEditorProps {
  value: string
  onChange: (value: string) => void
  language: string
  currentLine?: number
  breakpoints?: number[]
  onBreakpointToggle?: (lineNumber: number) => void
  disabled?: boolean
}

export default function CustomSyntaxEditor({
  value,
  onChange,
  language,
  currentLine = -1,
  breakpoints = [],
  onBreakpointToggle,
  disabled = false,
}: CustomSyntaxEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const highlightRef = useRef<HTMLPreElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)
  const [lines, setLines] = useState<string[]>([])
  const [cursorLine, setCursorLine] = useState(1)

  useEffect(() => {
    setLines(value.split("\n"))
  }, [value])

  const updateCursorPosition = () => {
    if (textareaRef.current) {
      const cursorPosition = textareaRef.current.selectionStart
      const textBeforeCursor = value.substring(0, cursorPosition)
      const lineNumber = textBeforeCursor.split("\n").length
      setCursorLine(lineNumber)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault()
      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newValue = value.substring(0, start) + "  " + value.substring(end)
      onChange(newValue)

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2
      }, 0)
    }
    updateCursorPosition()
  }

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current && highlightRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop
      highlightRef.current.scrollTop = e.currentTarget.scrollTop
      highlightRef.current.scrollLeft = e.currentTarget.scrollLeft
    }
  }

  const highlightCode = (code: string) => {
    if (!code) return ""

    // First escape HTML characters
    let highlighted = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

    if (language === "javascript" || language === "typescript") {
      // Keywords
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
        "typeof",
        "instanceof",
        "break",
        "continue",
        "switch",
        "case",
      ]

      // Apply syntax highlighting with inline styles
      keywords.forEach((keyword) => {
        const regex = new RegExp(`\\b${keyword}\\b`, "g")
        highlighted = highlighted.replace(regex, `<span style="color: #569cd6; font-weight: 500;">${keyword}</span>`)
      })

      // Strings (handle quotes carefully)
      highlighted = highlighted.replace(
        /(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g,
        '<span style="color: #ce9178;">$1$2$1</span>',
      )

      // Numbers
      highlighted = highlighted.replace(/\b\d+\.?\d*\b/g, '<span style="color: #b5cea8;">$&</span>')

      // Comments
      highlighted = highlighted.replace(/\/\/.*$/gm, '<span style="color: #6a9955; font-style: italic;">$&</span>')

      // Function names (before parentheses)
      highlighted = highlighted.replace(/\b(\w+)(?=\s*\()/g, '<span style="color: #dcdcaa;">$1</span>')

      // Console
      highlighted = highlighted.replace(/\bconsole\b/g, '<span style="color: #4ec9b0;">console</span>')
    }

    return highlighted
  }

  return (
    <div className="w-full h-96 border rounded-md overflow-hidden bg-[#1e1e1e] flex">
      {/* CSS for Syntax Highlighting */}

      {/* Line Numbers */}
      <div
        ref={lineNumbersRef}
        className="flex-shrink-0 w-16 bg-[#252526] border-r border-[#3e3e42] overflow-auto select-none"
        style={{
          fontSize: "14px",
          lineHeight: "20px",
          padding: "8px 0",
        }}
      >
        {lines.map((_, index) => {
          const lineNumber = index + 1
          const isCurrentLine = lineNumber === currentLine
          const isCursorLine = lineNumber === cursorLine
          const hasBreakpoint = breakpoints.includes(lineNumber)

          return (
            <div
              key={lineNumber}
              className={`
                relative flex items-center justify-end pr-2 cursor-pointer transition-all duration-200
                ${isCurrentLine ? "bg-yellow-500/40 border-l-4 border-yellow-500 shadow-lg" : ""}
                ${isCursorLine && !isCurrentLine ? "bg-blue-500/30 border-l-2 border-blue-400" : ""}
                ${hasBreakpoint ? "bg-red-500/40" : "hover:bg-gray-700/30"}
              `}
              onClick={() => onBreakpointToggle && onBreakpointToggle(lineNumber)}
              style={{
                height: "20px",
                lineHeight: "20px",
              }}
            >
              {hasBreakpoint && (
                <div className="absolute left-2 w-3 h-3 bg-red-500 rounded-full border-2 border-red-300 animate-pulse shadow-lg"></div>
              )}
              <span
                className={`text-sm font-mono transition-all duration-200 ${
                  isCurrentLine
                    ? "text-yellow-100 font-bold text-shadow"
                    : isCursorLine
                      ? "text-blue-100 font-semibold"
                      : "text-gray-400"
                }`}
              >
                {lineNumber}
              </span>
            </div>
          )
        })}
      </div>

      {/* Code Editor Container */}
      <div className="flex-1 relative">
        {/* Current Line Highlights */}
        {currentLine > 0 && (
          <div
            className="absolute left-0 right-0 bg-yellow-500/20 pointer-events-none z-30 border-l-4 border-yellow-500 animate-pulse"
            style={{
              top: `${(currentLine - 1) * 20 + 8}px`,
              height: "20px",
            }}
          />
        )}

        {cursorLine > 0 && cursorLine !== currentLine && (
          <div
            className="absolute left-0 right-0 bg-blue-500/10 pointer-events-none z-25 border-l-2 border-blue-400"
            style={{
              top: `${(cursorLine - 1) * 20 + 8}px`,
              height: "20px",
            }}
          />
        )}

        {/* Syntax Highlighting Layer */}
        <pre
          ref={highlightRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-auto z-20 m-0"
          style={{
            fontSize: "14px",
            lineHeight: "20px",
            fontFamily: "Consolas, Monaco, 'Courier New', monospace",
            padding: "8px 12px",
            color: "#d4d4d4",
            background: "transparent",
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
          }}
          dangerouslySetInnerHTML={{
            __html: highlightCode(value),
          }}
        />

        {/* Transparent Textarea for Input */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            updateCursorPosition()
          }}
          onKeyDown={handleKeyDown}
          onKeyUp={updateCursorPosition}
          onClick={updateCursorPosition}
          onScroll={handleScroll}
          disabled={disabled}
          className="absolute top-0 left-0 w-full h-full bg-transparent text-transparent border-none outline-none resize-none z-40"
          style={{
            fontSize: "14px",
            lineHeight: "20px",
            fontFamily: "Consolas, Monaco, 'Courier New', monospace",
            tabSize: 2,
            caretColor: "#ffffff",
            padding: "8px 12px",
            margin: 0,
          }}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          placeholder=""
        />

        {/* Placeholder when empty */}
        {!value && (
          <div
            className="absolute top-2 left-3 text-gray-500 pointer-events-none font-mono text-sm z-10"
            style={{ fontSize: "14px", lineHeight: "20px" }}
          >
            Write your code here...
          </div>
        )}
      </div>
    </div>
  )
}
