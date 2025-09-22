"use client"

import { useEffect, useRef } from "react"
import { monaco } from "../hooks/monaco-setup"; 

interface MonacoEditorProps {
  value: string
  onChange: (value: string) => void
  language: string
  theme?: string
  height?: string
  currentLine?: number
  readOnly?: boolean
}

export default function MonacoEditor({
  value,
  onChange,
  language,
  theme = "vs-dark",
  height = "400px",
  currentLine = -1,
  readOnly = false,
}: MonacoEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const modelRef = useRef<monaco.editor.ITextModel | null>(null)
  const isInternalChangeRef = useRef(false)
  const decorationsRef = useRef<string[]>([])

  useEffect(() => {
    if (!containerRef.current) return

    // Create model only once
    if (!modelRef.current) {
      modelRef.current = monaco.editor.createModel(value, language)
    }

    // Create editor only once
    if (!editorRef.current) {
      editorRef.current = monaco.editor.create(containerRef.current, {
        model: modelRef.current,
        theme,
        automaticLayout: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: 14,
        lineNumbers: "on",
        readOnly,
        wordWrap: "on",
      })

      // Set up change listener
      editorRef.current.onDidChangeModelContent(() => {
        if (!isInternalChangeRef.current && editorRef.current && modelRef.current) {
          const newValue = modelRef.current.getValue()
          onChange(newValue)
        }
      })
    }

    return () => {
      // Cleanup on unmount
      if (editorRef.current) {
        editorRef.current.dispose()
        editorRef.current = null
      }
      if (modelRef.current) {
        modelRef.current.dispose()
        modelRef.current = null
      }
    }
  }, [])

  // Update value when prop changes
  useEffect(() => {
    if (modelRef.current && editorRef.current) {
      const currentValue = modelRef.current.getValue()
      if (currentValue !== value) {
        isInternalChangeRef.current = true
        modelRef.current.setValue(value)
        isInternalChangeRef.current = false
      }
    }
  }, [value])

  // Update language when prop changes
  useEffect(() => {
    if (modelRef.current) {
      monaco.editor.setModelLanguage(modelRef.current, language)
    }
  }, [language])

  // Update theme when prop changes
  useEffect(() => {
    if (editorRef.current) {
      monaco.editor.setTheme(theme)
    }
  }, [theme])

  // Update read-only state
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({ readOnly })
    }
  }, [readOnly])

  // Highlight current line
  useEffect(() => {
    if (editorRef.current && currentLine > 0) {
      // Clear previous decorations
      decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, [])

      // Add new decoration for current line
      decorationsRef.current = editorRef.current.deltaDecorations(
        [],
        [
          {
            range: new monaco.Range(currentLine, 1, currentLine, 1),
            options: {
              isWholeLine: true,
              className: "current-line-highlight",
              glyphMarginClassName: "current-line-glyph",
            },
          },
        ],
      )

      // Scroll to current line
      editorRef.current.revealLineInCenter(currentLine)
    } else if (editorRef.current && currentLine === -1) {
      // Clear decorations when no line is highlighted
      decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, [])
    }
  }, [currentLine])

  return (
    <div className="relative">
      <div ref={containerRef} style={{ height }} />
      <style jsx global>{`
        .current-line-highlight {
          background-color: rgba(255, 255, 0, 0.2) !important;
        }
        .current-line-glyph {
          background-color: #ffff00 !important;
          width: 4px !important;
        }
      `}</style>
    </div>
  )
}
