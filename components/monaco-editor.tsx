"use client"

import { useEffect, useRef, useState } from "react"
import * as monaco from "monaco-editor"

// Configure Monaco Editor workers
if (typeof window !== "undefined") {
  // Configure workers for Monaco Editor
  window.MonacoEnvironment = {
    getWorker: (workerId, label) => {
      const getWorkerModule = (moduleUrl: string, fallbackUrl: string) => {
        return new Worker(new URL(moduleUrl, import.meta.url), {
          name: label,
          type: "module",
        })
      }

      switch (label) {
        case "json":
          return getWorkerModule(
            "monaco-editor/esm/vs/language/json/json.worker",
            "monaco-editor/esm/vs/language/json/json.worker.js",
          )
        case "css":
        case "scss":
        case "less":
          return getWorkerModule(
            "monaco-editor/esm/vs/language/css/css.worker",
            "monaco-editor/esm/vs/language/css/css.worker.js",
          )
        case "html":
        case "handlebars":
        case "razor":
          return getWorkerModule(
            "monaco-editor/esm/vs/language/html/html.worker",
            "monaco-editor/esm/vs/language/html/html.worker.js",
          )
        case "typescript":
        case "javascript":
          return getWorkerModule(
            "monaco-editor/esm/vs/language/typescript/ts.worker",
            "monaco-editor/esm/vs/language/typescript/ts.worker.js",
          )
        default:
          return getWorkerModule(
            "monaco-editor/esm/vs/editor/editor.worker",
            "monaco-editor/esm/vs/editor/editor.worker.js",
          )
      }
    },
  }
}

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
  const editorRef = useRef<HTMLDivElement>(null)
  const monacoRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const [isEditorReady, setIsEditorReady] = useState(false)

  useEffect(() => {
    if (!editorRef.current) return

    // Create Monaco Editor
    const editor = monaco.editor.create(editorRef.current, {
      value: value,
      language: language,
      theme: "vs-dark",
      fontSize: 14,
      lineHeight: 20,
      fontFamily: "Consolas, Monaco, 'Courier New', monospace",
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      lineNumbers: "on",
      glyphMargin: true,
      folding: false,
      lineDecorationsWidth: 10,
      lineNumbersMinChars: 3,
      renderLineHighlight: "line",
      selectOnLineNumbers: true,
      roundedSelection: false,
      readOnly: disabled,
      cursorStyle: "line",
      wordWrap: "off",
      contextmenu: true,
      mouseWheelZoom: false,
      smoothScrolling: true,
      cursorBlinking: "blink",
      cursorSmoothCaretAnimation: "on",
      renderWhitespace: "none",
      renderControlCharacters: false,
      fontLigatures: false,
      disableLayerHinting: false,
      hideCursorInOverviewRuler: false,
    })

    monacoRef.current = editor
    setIsEditorReady(true)

    // Handle content changes
    const disposable = editor.onDidChangeModelContent(() => {
      onChange(editor.getValue())
    })

    // Handle gutter clicks for breakpoints
    const gutterClickDisposable = editor.onMouseDown((e) => {
      if (e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
        const lineNumber = e.target.position?.lineNumber
        if (lineNumber && onBreakpointToggle) {
          onBreakpointToggle(lineNumber)
        }
      }
    })

    return () => {
      disposable.dispose()
      gutterClickDisposable.dispose()
      editor.dispose()
    }
  }, [language, disabled])

  // Update editor value when prop changes
  useEffect(() => {
    if (monacoRef.current && isEditorReady) {
      const currentValue = monacoRef.current.getValue()
      if (currentValue !== value) {
        monacoRef.current.setValue(value)
      }
    }
  }, [value, isEditorReady])

  // Update language
  useEffect(() => {
    if (monacoRef.current && isEditorReady) {
      const model = monacoRef.current.getModel()
      if (model) {
        monaco.editor.setModelLanguage(model, language)
      }
    }
  }, [language, isEditorReady])

  // Update current line highlighting
  useEffect(() => {
    if (monacoRef.current && isEditorReady && currentLine > 0) {
      const decorations = monacoRef.current.deltaDecorations(
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

      return () => {
        if (monacoRef.current) {
          monacoRef.current.deltaDecorations(decorations, [])
        }
      }
    }
  }, [currentLine, isEditorReady])

  // Update breakpoints
  useEffect(() => {
    if (monacoRef.current && isEditorReady) {
      const decorations = breakpoints.map((lineNumber) => ({
        range: new monaco.Range(lineNumber, 1, lineNumber, 1),
        options: {
          isWholeLine: false,
          glyphMarginClassName: "breakpoint-glyph",
        },
      }))

      monacoRef.current.deltaDecorations([], decorations)
    }
  }, [breakpoints, isEditorReady])

  return (
    <div className="w-full h-96 border rounded-md overflow-hidden">
      <style jsx global>{`
        .current-line-highlight {
          background-color: rgba(255, 215, 0, 0.2) !important;
          border-left: 4px solid #ffd700 !important;
        }
        .current-line-glyph {
          background-color: rgba(255, 215, 0, 0.3) !important;
        }
        .breakpoint-glyph {
          background-color: #e51400 !important;
          border-radius: 50% !important;
          width: 12px !important;
          height: 12px !important;
          margin-left: 2px !important;
          margin-top: 4px !important;
          border: 1px solid #f14c4c !important;
          animation: pulse 2s infinite !important;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
      <div ref={editorRef} className="w-full h-full" />
    </div>
  )
}
