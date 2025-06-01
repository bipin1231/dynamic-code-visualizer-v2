"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"

interface CleanEditorProps {
  value: string
  onChange: (value: string) => void
  language: string
  currentLine?: number
  breakpoints?: number[]
  onBreakpointToggle?: (lineNumber: number) => void
  disabled?: boolean
}

export default function CleanEditor({
  value,
  onChange,
  language,
  currentLine = -1,
  breakpoints = [],
  onBreakpointToggle,
  disabled = false,
}: CleanEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
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
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop
    }
  }

  return (
    <div className="w-full h-96 border rounded-md overflow-hidden bg-[#1e1e1e] flex">
      {/* Line Numbers */}
      <div
        ref={lineNumbersRef}
        className="flex-shrink-0 w-16 bg-[#252526] border-r border-[#3e3e42] overflow-auto select-none"
        style={{
          fontSize: "14px",
          lineHeight: "20px",
          padding: "8px 0", // Match textarea padding
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
                height: "20px", // Exact height to match line height
                lineHeight: "20px", // Ensure text is vertically centered
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

      {/* Code Editor */}
      <div className="flex-1 relative">
        {/* Current Line Highlights */}
        {currentLine > 0 && (
          <div
            className="absolute left-0 right-0 bg-yellow-500/20 pointer-events-none z-10 border-l-4 border-yellow-500 animate-pulse"
            style={{
              top: `${(currentLine - 1) * 20 + 8}px`, // Match the padding offset
              height: "20px",
            }}
          />
        )}

        {cursorLine > 0 && cursorLine !== currentLine && (
          <div
            className="absolute left-0 right-0 bg-blue-500/10 pointer-events-none z-5 border-l-2 border-blue-400"
            style={{
              top: `${(cursorLine - 1) * 20 + 8}px`, // Match the padding offset
              height: "20px",
            }}
          />
        )}

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
          className="w-full h-full bg-transparent text-white font-mono text-sm border-none outline-none resize-none z-20 relative"
          style={{
            fontSize: "14px",
            lineHeight: "20px", // Match line numbers exactly
            fontFamily: "Consolas, Monaco, 'Courier New', monospace",
            tabSize: 2,
            caretColor: "#ffffff",
            padding: "8px 12px", // Consistent padding
            margin: 0, // Remove any default margins
          }}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          placeholder="Write your code here..."
        />
      </div>

      {/* Enhanced Visual Indicators */}
      <style jsx>{`
        .text-shadow {
          text-shadow: 0 0 4px rgba(255, 255, 0, 0.5);
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  )
}
