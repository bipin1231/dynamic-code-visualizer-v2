"use client"

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
  const editorRef = useRef<HTMLDivElement>(null)
  const monacoRef = useRef<any>(null)
  const [isEditorReady, setIsEditorReady] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [monaco, setMonaco] = useState<any>(null)

  useEffect(() => {
    // Only load Monaco in the browser
    if (typeof window === "undefined") return

    const loadMonaco = async () => {
      try {
        // Configure workers before importing Monaco
        window.MonacoEnvironment = {
          getWorker: (workerId: string, label: string) => {
            const getWorkerModule = (moduleUrl: string) => {
              return new Worker(new URL(moduleUrl, import.meta.url), {
                name: label,
                type: "module",
              })
            }

            switch (label) {
              case "json":
                return getWorkerModule("monaco-editor/esm/vs/language/json/json.worker")
              case "css":
              case "scss":
              case "less":
                return getWorkerModule("monaco-editor/esm/vs/language/css/css.worker")
              case "html":
              case "handlebars":
              case "razor":
                return getWorkerModule("monaco-editor/esm/vs/language/html/html.worker")
              case "typescript":
              case "javascript":
                return getWorkerModule("monaco-editor/esm/vs/language/typescript/ts.worker")
              default:
                return getWorkerModule("monaco-editor/esm/vs/editor/editor.worker")
            }
          },
        }

        // Dynamically import Monaco Editor
        const monacoModule = await import("monaco-editor")
        setMonaco(monacoModule)
        setIsLoading(false)
      } catch (error) {
        console.error("Failed to load Monaco Editor:", error)
        setIsLoading(false)
      }
    }

    loadMonaco()
  }, [])

  useEffect(() => {
    if (!editorRef.current || !monaco || isLoading) return

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
    const gutterClickDisposable = editor.onMouseDown((e: any) => {
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
  }, [monaco, isLoading, language, disabled])

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
    if (monacoRef.current && isEditorReady && monaco) {
      const model = monacoRef.current.getModel()
      if (model) {
        monaco.editor.setModelLanguage(model, language)
      }
    }
  }, [language, isEditorReady, monaco])

  // Update current line highlighting
  useEffect(() => {
    if (monacoRef.current && isEditorReady && currentLine > 0 && monaco) {
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
  }, [currentLine, isEditorReady, monaco])

  // Update breakpoints
  useEffect(() => {
    if (monacoRef.current && isEditorReady && monaco) {
      const decorations = breakpoints.map((lineNumber) => ({
        range: new monaco.Range(lineNumber, 1, lineNumber, 1),
        options: {
          isWholeLine: false,
          glyphMarginClassName: "breakpoint-glyph",
        },
      }))

      monacoRef.current.deltaDecorations([], decorations)
    }
  }, [breakpoints, isEditorReady, monaco])

  // Show loading state
  if (isLoading) {
    return (
      <div className="w-full h-96 border rounded-md overflow-hidden bg-[#1e1e1e] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
          <p>Loading Monaco Editor...</p>
        </div>
      </div>
    )
  }

  // Show error state if Monaco failed to load
  if (!monaco) {
    return (
      <div className="w-full h-96 border rounded-md overflow-hidden bg-[#1e1e1e] flex items-center justify-center">
        <div className="text-red-400 text-center">
          <p>Failed to load Monaco Editor</p>
          <p className="text-sm mt-2">Please refresh the page</p>
        </div>
      </div>
    )
  }

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
