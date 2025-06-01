"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"

interface SimpleEditorProps {
  value: string
  onChange: (value: string) => void
  language: string
  currentLine?: number
  breakpoints?: number[]
  onBreakpointToggle?: (lineNumber: number) => void
  disabled?: boolean
}

export default function SimpleEditor({
  value,
  onChange,
  language,
  currentLine = -1,
  breakpoints = [],
  onBreakpointToggle,
  disabled = false,
}: SimpleEditorProps) {
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)
  const [lines, setLines] = useState<string[]>([])
  const [cursorLine, setCursorLine] = useState(1)

  // Update lines when value changes
  useEffect(() => {
    setLines(value.split("\n"))
  }, [value])

  // Track cursor position
  const updateCursorPosition = () => {
    if (editorRef.current) {
      const cursorPosition = editorRef.current.selectionStart
      const textBeforeCursor = value.substring(0, cursorPosition)
      const lineNumber = textBeforeCursor.split("\n").length
      setCursorLine(lineNumber)
    }
  }

  // Handle tab key
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

  // Handle scrolling
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
                relative h-5 flex items-center justify-end pr-2 cursor-pointer
                ${isCurrentLine ? "bg-yellow-500/30 border-l-4 border-yellow-500" : ""}
                ${isCursorLine && !isCurrentLine ? "bg-blue-500/30 border-l-4 border-blue-500" : ""}
                ${hasBreakpoint ? "bg-red-500/30" : "hover:bg-gray-700/30"}
              `}
              onClick={() => onBreakpointToggle && onBreakpointToggle(lineNumber)}
            >
              {hasBreakpoint && (
                <div className="absolute left-2 w-3 h-3 bg-red-500 rounded-full border border-red-400 animate-pulse"></div>
              )}
              <span
                className={`text-sm font-mono ${isCurrentLine || isCursorLine ? "text-white font-bold" : "text-gray-400"}`}
              >
                {lineNumber}
              </span>
            </div>
          )
        })}
      </div>

      {/* Code Editor */}
      <div className="flex-1 relative">
        <textarea
          ref={editorRef}
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
          className="w-full h-full p-2 bg-[#1e1e1e] text-white font-mono text-sm border-none outline-none resize-none"
          style={{
            fontSize: "14px",
            lineHeight: "20px",
            fontFamily: "Consolas, Monaco, 'Courier New', monospace",
            tabSize: 2,
          }}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          placeholder="Write your code here..."
        />
      </div>
    </div>
  )
}
