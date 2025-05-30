"use client"

import { useEffect, useRef } from "react"

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
  const editorRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const monacoRef = useRef<any>(null)

  useEffect(() => {
    const loadMonaco = async () => {
      if (typeof window !== "undefined") {
        const monaco = await import("monaco-editor")
        monacoRef.current = monaco

        // VS Code-like theme
        monaco.editor.defineTheme("vscode-dark", {
          base: "vs-dark",
          inherit: true,
          rules: [
            { token: "comment", foreground: "6A9955", fontStyle: "italic" },
            { token: "keyword", foreground: "569CD6", fontStyle: "bold" },
            { token: "string", foreground: "CE9178" },
            { token: "number", foreground: "B5CEA8" },
            { token: "regexp", foreground: "D16969" },
            { token: "operator", foreground: "D4D4D4" },
            { token: "namespace", foreground: "4EC9B0" },
            { token: "type", foreground: "4EC9B0" },
            { token: "struct", foreground: "4EC9B0" },
            { token: "class", foreground: "4EC9B0" },
            { token: "interface", foreground: "4EC9B0" },
            { token: "parameter", foreground: "9CDCFE" },
            { token: "variable", foreground: "9CDCFE" },
            { token: "property", foreground: "9CDCFE" },
            { token: "enumMember", foreground: "4FC1FF" },
            { token: "function", foreground: "DCDCAA" },
            { token: "member", foreground: "DCDCAA" },
          ],
          colors: {
            "editor.background": "#1e1e1e",
            "editor.foreground": "#d4d4d4",
            "editorLineNumber.foreground": "#858585",
            "editorLineNumber.activeForeground": "#c6c6c6",
            "editor.lineHighlightBackground": "#2d2d30",
            "editor.selectionBackground": "#264f78",
            "editor.inactiveSelectionBackground": "#3a3d41",
            "editorCursor.foreground": "#aeafad",
            "editor.wordHighlightBackground": "#575757b8",
            "editor.wordHighlightStrongBackground": "#004972b8",
            "editorBracketMatch.background": "#0064001a",
            "editorBracketMatch.border": "#888888",
            "editorGutter.background": "#1e1e1e",
            "editorGutter.modifiedBackground": "#1b81a8",
            "editorGutter.addedBackground": "#487e02",
            "editorGutter.deletedBackground": "#f85149",
          },
        })

        if (containerRef.current) {
          editorRef.current = monaco.editor.create(containerRef.current, {
            value: value,
            language: language,
            theme: "vscode-dark",
            automaticLayout: true,
            fontSize: 14,
            fontFamily:
              "'Fira Code', 'Cascadia Code', 'JetBrains Mono', 'SF Mono', Monaco, Menlo, 'Ubuntu Mono', monospace",
            lineNumbers: "on",
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: disabled,
            minimap: { enabled: false },
            folding: true,
            lineDecorationsWidth: 10,
            lineNumbersMinChars: 3,
            glyphMargin: true,
            contextmenu: true,
            mouseWheelZoom: true,
            formatOnPaste: true,
            formatOnType: true,
            autoIndent: "full",
            tabSize: 2,
            wordWrap: "on",
            bracketPairColorization: { enabled: true },
            guides: {
              bracketPairs: true,
              indentation: true,
            },
            suggest: {
              showKeywords: true,
              showSnippets: true,
              showFunctions: true,
              showVariables: true,
            },
            quickSuggestions: {
              other: true,
              comments: false,
              strings: false,
            },
            parameterHints: { enabled: true },
            hover: { enabled: true },
            smoothScrolling: true,
            cursorBlinking: "blink",
            cursorSmoothCaretAnimation: "on",
            renderLineHighlight: "line",
            renderWhitespace: "selection",
            showFoldingControls: "mouseover",
          })

          editorRef.current.onDidChangeModelContent(() => {
            const newValue = editorRef.current.getValue()
            onChange(newValue)
          })

          editorRef.current.onMouseDown((e: any) => {
            if (e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
              const lineNumber = e.target.position.lineNumber
              if (onBreakpointToggle) {
                onBreakpointToggle(lineNumber)
              }
            }
          })
        }
      }
    }

    loadMonaco()

    return () => {
      if (editorRef.current) {
        editorRef.current.dispose()
      }
    }
  }, [])

  useEffect(() => {
    if (editorRef.current && editorRef.current.getValue() !== value) {
      editorRef.current.setValue(value)
    }
  }, [value])

  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      const model = editorRef.current.getModel()
      if (model) {
        monacoRef.current.editor.setModelLanguage(model, language)
      }
    }
  }, [language])

  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      const decorations =
        currentLine > 0
          ? [
              {
                range: new monacoRef.current.Range(currentLine, 1, currentLine, 1),
                options: {
                  isWholeLine: true,
                  className: "current-line-highlight",
                  glyphMarginClassName: "current-line-glyph",
                  linesDecorationsClassName: "current-line-decoration",
                },
              },
            ]
          : []

      editorRef.current.deltaDecorations([], decorations)

      if (currentLine > 0) {
        editorRef.current.revealLineInCenter(currentLine)
      }
    }
  }, [currentLine])

  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      const decorations = breakpoints.map((lineNumber) => ({
        range: new monacoRef.current.Range(lineNumber, 1, lineNumber, 1),
        options: {
          isWholeLine: false,
          glyphMarginClassName: "breakpoint-glyph",
        },
      }))

      editorRef.current.deltaDecorations([], decorations)
    }
  }, [breakpoints])

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({ readOnly: disabled })
    }
  }, [disabled])

  return (
    <>
      <div ref={containerRef} className="w-full h-96 border rounded-md overflow-hidden" />
      <style jsx global>{`
        .current-line-highlight {
          background-color: rgba(255, 255, 0, 0.1) !important;
        }
        .current-line-glyph {
          background-color: #ffff00 !important;
          width: 4px !important;
        }
        .current-line-decoration {
          background-color: rgba(255, 255, 0, 0.3) !important;
          width: 4px !important;
        }
        .breakpoint-glyph {
          background-color: #ff0000 !important;
          border-radius: 50% !important;
          width: 12px !important;
          height: 12px !important;
          margin-left: 2px !important;
          margin-top: 2px !important;
        }
      `}</style>
    </>
  )
}
