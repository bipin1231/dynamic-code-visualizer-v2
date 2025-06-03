"use client"

import { useEffect, useRef, useState } from "react"
import type { editor } from "monaco-editor"
import { Loader2 } from "lucide-react"

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
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const monacoRef = useRef<typeof import("monaco-editor")>()
  const editorRef = useRef<editor.IStandaloneCodeEditor>()
  const containerRef = useRef<HTMLDivElement>(null)
  const decorationsRef = useRef<string[]>([])
  const breakpointDecorationIdsRef = useRef<string[]>([])

  // Load Monaco editor
  useEffect(() => {
    if (typeof window !== "undefined" && !isLoaded) {
      setIsLoading(true)
      import("monaco-editor").then((monaco) => {
        monacoRef.current = monaco
        setIsLoaded(true)
        setIsLoading(false)
      })
    }
  }, [isLoaded])

  // Initialize editor
  useEffect(() => {
    if (isLoaded && containerRef.current && monacoRef.current && !editorRef.current) {
      const monaco = monacoRef.current

      // Define editor options
      const options: editor.IStandaloneEditorConstructionOptions = {
        value,
        language: mapLanguage(language),
        theme: "vs-dark",
        automaticLayout: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        lineNumbers: "on",
        glyphMargin: true,
        folding: true,
        readOnly: disabled,
      }

      // Create editor
      const editor = monaco.editor.create(containerRef.current, options)
      editorRef.current = editor

      // Handle changes
      editor.onDidChangeModelContent(() => {
        const value = editor.getValue()
        onChange(value)
      })

      // Handle breakpoint clicks
      editor.onMouseDown((e) => {
        if (e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN && onBreakpointToggle) {
          const lineNumber = e.target.position?.lineNumber
          if (lineNumber) {
            onBreakpointToggle(lineNumber)
          }
        }
      })

      return () => {
        editor.dispose()
        editorRef.current = undefined
      }
    }
  }, [isLoaded, value, language, onChange, disabled, onBreakpointToggle])

  // Update editor value when prop changes
  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      const editor = editorRef.current
      const currentValue = editor.getValue()

      if (value !== currentValue) {
        editor.setValue(value)
      }
    }
  }, [value])

  // Update editor language when prop changes
  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      const monaco = monacoRef.current
      const model = editorRef.current.getModel()

      if (model) {
        monaco.editor.setModelLanguage(model, mapLanguage(language))
      }
    }
  }, [language])

  // Update current line highlight
  useEffect(() => {
    if (editorRef.current && monacoRef.current && currentLine > 0) {
      const monaco = monacoRef.current
      const editor = editorRef.current

      // Remove previous decorations
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [])

      // Add new decoration for current line
      decorationsRef.current = editor.deltaDecorations(
        [],
        [
          {
            range: new monaco.Range(currentLine, 1, currentLine, 1),
            options: {
              isWholeLine: true,
              className: "current-line-highlight",
              linesDecorationsClassName: "current-line-glyph",
            },
          },
        ],
      )

      // Scroll to the line if it's not visible
      editor.revealLineInCenter(currentLine)
    }
  }, [currentLine])

  // Update breakpoints
  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      const monaco = monacoRef.current
      const editor = editorRef.current

      // Remove previous breakpoint decorations
      breakpointDecorationIdsRef.current = editor.deltaDecorations(breakpointDecorationIdsRef.current, [])

      // Add new breakpoint decorations
      const breakpointDecorations = breakpoints.map((lineNumber) => ({
        range: new monaco.Range(lineNumber, 1, lineNumber, 1),
        options: {
          isWholeLine: false,
          glyphMarginClassName: "breakpoint-glyph",
        },
      }))

      breakpointDecorationIdsRef.current = editor.deltaDecorations([], breakpointDecorations)
    }
  }, [breakpoints])

  // Map language names to Monaco language identifiers
  const mapLanguage = (lang: string): string => {
    const languageMap: Record<string, string> = {
      javascript: "javascript",
      python: "python",
      c: "c",
      cpp: "cpp",
      java: "java",
    }

    return languageMap[lang] || "plaintext"
  }

  return (
    <div className="w-full h-96 border rounded-md overflow-hidden relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <style jsx global>{`
        .current-line-highlight {
          background-color: rgba(255, 215, 0, 0.2);
          border-left: 2px solid #ffaa00;
        }
        .current-line-glyph {
          background-color: rgba(255, 215, 0, 0.2);
        }
        .breakpoint-glyph {
          background-color: #e51400;
          border-radius: 50%;
          margin-left: 5px;
          width: 8px !important;
          height: 8px !important;
        }
      `}</style>
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
