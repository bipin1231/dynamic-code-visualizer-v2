"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language: string
  currentLine?: number
  breakpoints?: number[]
  onBreakpointToggle?: (lineNumber: number) => void
  disabled?: boolean
}

export default function CodeEditor({
  value,
  onChange,
  language,
  currentLine = -1,
  breakpoints = [],
  onBreakpointToggle,
  disabled = false,
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)
  const [lines, setLines] = useState<string[]>([])
  const [cursorLine, setCursorLine] = useState(1)

  useEffect(() => {
    setLines(value.split("\n"))
  }, [value])

  // Track cursor position for current line highlighting
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target
    const cursorPosition = textarea.selectionStart
    const textBeforeCursor = value.substring(0, cursorPosition)
    const lineNumber = textBeforeCursor.split("\n").length
    setCursorLine(lineNumber)
    onChange(e.target.value)
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
  }

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current && highlightRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop
      highlightRef.current.scrollTop = e.currentTarget.scrollTop
      highlightRef.current.scrollLeft = e.currentTarget.scrollLeft
    }
  }

  const handleClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget
    const cursorPosition = textarea.selectionStart
    const textBeforeCursor = value.substring(0, cursorPosition)
    const lineNumber = textBeforeCursor.split("\n").length
    setCursorLine(lineNumber)
  }

  // Simple syntax highlighting using CSS and regex
  const renderHighlightedCode = () => {
    if (!value) return ""

    let highlighted = value

    // JavaScript/TypeScript keywords
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
    ]

    // Apply syntax highlighting with spans
    keywords.forEach((keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, "g")
      highlighted = highlighted.replace(regex, `<span style="color: #569cd6; font-weight: 500;">${keyword}</span>`)
    })

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

    return highlighted
  }

  return (
    <div className="w-full h-96 border rounded-md overflow-hidden bg-[#1e1e1e] flex relative">
      {/* Line Numbers */}
      <div
        ref={lineNumbersRef}
        className="flex-shrink-0 w-16 bg-[#252526] border-r border-[#3e3e42] overflow-hidden select-none"
        style={{ fontSize: "14px", lineHeight: "20px" }}
      >
        <div className="py-2">
          {lines.map((_, index) => {
            const lineNumber = index + 1
            const isCurrentLine = lineNumber === currentLine || lineNumber === cursorLine
            const hasBreakpoint = breakpoints.includes(lineNumber)

            return (
              <div
                key={lineNumber}
                className={`
                  relative h-5 flex items-center justify-end pr-2 cursor-pointer transition-all duration-200
                  ${isCurrentLine ? "bg-[#094771] border-l-4 border-[#007acc]" : "hover:bg-[#2a2d2e]"}
                  ${hasBreakpoint ? "bg-[#5a1515]" : ""}
                `}
                onClick={() => onBreakpointToggle && onBreakpointToggle(lineNumber)}
                style={{ minHeight: "20px" }}
              >
                {hasBreakpoint && (
                  <div className="absolute left-1 w-3 h-3 bg-[#e51400] rounded-full border border-[#f14c4c] shadow-lg animate-pulse"></div>
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

      {/* Code Editor Container */}
      <div className="flex-1 relative overflow-hidden">
        {/* Current Line Highlight - Always visible */}
        <div
          className="absolute left-0 right-0 bg-[#094771] pointer-events-none z-10 transition-all duration-200 border-l-4 border-[#007acc]"
          style={{
            top: `${(cursorLine - 1) * 20 + 8}px`,
            height: "20px",
            opacity: 0.3,
          }}
        />

        {/* Debug Current Line Highlight - More prominent during debugging */}
        {currentLine > 0 && (
          <div
            className="absolute left-0 right-0 bg-[#ffd700] pointer-events-none z-20 border-l-4 border-[#ffaa00] animate-pulse"
            style={{
              top: `${(currentLine - 1) * 20 + 8}px`,
              height: "20px",
              opacity: 0.4,
            }}
          />
        )}

        {/* Syntax Highlighting Layer */}
        <div
          ref={highlightRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-30"
          style={{
            padding: "8px 12px",
            fontSize: "14px",
            lineHeight: "20px",
            fontFamily: "Consolas, Monaco, 'Courier New', monospace",
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
            color: "#d4d4d4",
          }}
          dangerouslySetInnerHTML={{
            __html: renderHighlightedCode(),
          }}
        />

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          onClick={handleClick}
          onKeyUp={handleClick}
          disabled={disabled}
          className="absolute top-0 left-0 w-full h-full bg-transparent text-transparent caret-white border-none outline-none resize-none z-40"
          style={{
            padding: "8px 12px",
            fontSize: "14px",
            lineHeight: "20px",
            fontFamily: "Consolas, Monaco, 'Courier New', monospace",
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
            tabSize: 2,
          }}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />

        {/* Placeholder */}
        {!value && (
          <div
            className="absolute top-2 left-3 text-[#6a6a6a] pointer-events-none font-mono text-sm z-10"
            style={{ fontSize: "14px", lineHeight: "20px" }}
          >
            Write your code here...
          </div>
        )}
      </div>
    </div>
  )
}
