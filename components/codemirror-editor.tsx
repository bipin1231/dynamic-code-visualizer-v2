"use client"

import { useEffect, useRef } from "react"
import { basicSetup } from "@codemirror/basic-setup"
import { EditorState } from "@codemirror/state"
import { EditorView, lineNumbers, gutter, GutterMarker } from "@codemirror/view"
import { javascript } from "@codemirror/lang-javascript"
import { python } from "@codemirror/lang-python"
import { java } from "@codemirror/lang-java"
import { cpp } from "@codemirror/lang-cpp"
import { oneDark } from "@codemirror/theme-one-dark"
import { RangeSetBuilder } from "@codemirror/state"
import { Decoration, type DecorationSet } from "@codemirror/view"

interface CodeMirrorEditorProps {
  value: string
  onChange: (value: string) => void
  language: string
  currentLine?: number
  breakpoints?: number[]
  onBreakpointToggle?: (lineNumber: number) => void
  disabled?: boolean
}

class BreakpointMarker extends GutterMarker {
  toDOM() {
    const marker = document.createElement("div")
    marker.style.width = "12px"
    marker.style.height = "12px"
    marker.style.backgroundColor = "#e51400"
    marker.style.borderRadius = "50%"
    marker.style.border = "1px solid #f14c4c"
    marker.style.marginLeft = "2px"
    marker.style.animation = "pulse 2s infinite"
    return marker
  }
}

const breakpointMarker = new BreakpointMarker()

export default function CodeMirrorEditor({
  value,
  onChange,
  language,
  currentLine = -1,
  breakpoints = [],
  onBreakpointToggle,
  disabled = false,
}: CodeMirrorEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  const getLanguageExtension = (lang: string) => {
    switch (lang) {
      case "javascript":
      case "typescript":
        return javascript()
      case "python":
        return python()
      case "java":
        return java()
      case "cpp":
        return cpp()
      default:
        return javascript()
    }
  }

  const currentLineDecoration = Decoration.line({
    attributes: { style: "background-color: rgba(255, 215, 0, 0.2); border-left: 4px solid #ffd700;" },
  })

  const createCurrentLineDecorations = (line: number): DecorationSet => {
    if (line <= 0) return Decoration.none
    const builder = new RangeSetBuilder<Decoration>()
    const doc = viewRef.current?.state.doc
    if (doc && line <= doc.lines) {
      const lineStart = doc.line(line).from
      builder.add(lineStart, lineStart, currentLineDecoration)
    }
    return builder.finish()
  }

  const breakpointGutter = gutter({
    class: "cm-breakpoint-gutter",
    markers: (view) => {
      const builder = new RangeSetBuilder<GutterMarker>()
      for (const bp of breakpoints) {
        if (bp <= view.state.doc.lines) {
          const line = view.state.doc.line(bp)
          builder.add(line.from, line.from, breakpointMarker)
        }
      }
      return builder.finish()
    },
    initialSpacer: () => breakpointMarker,
    domEventHandlers: {
      click: (view, line) => {
        const lineNumber = view.state.doc.lineAt(line.from).number
        onBreakpointToggle?.(lineNumber)
        return true
      },
    },
  })

  useEffect(() => {
    if (!editorRef.current) return

    const extensions = [
      basicSetup,
      getLanguageExtension(language),
      oneDark,
      lineNumbers(),
      breakpointGutter,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChange(update.state.doc.toString())
        }
      }),
      EditorState.readOnly.of(disabled),
    ]

    const state = EditorState.create({
      doc: value,
      extensions,
    })

    const view = new EditorView({
      state,
      parent: editorRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
    }
  }, [language, disabled])

  // Update current line highlighting
  useEffect(() => {
    if (viewRef.current && currentLine > 0) {
      const decorations = createCurrentLineDecorations(currentLine)
      viewRef.current.dispatch({
        effects: EditorView.decorations.of(decorations),
      })
    }
  }, [currentLine])

  // Update content when value changes externally
  useEffect(() => {
    if (viewRef.current && viewRef.current.state.doc.toString() !== value) {
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: value,
        },
      })
    }
  }, [value])

  return (
    <div className="w-full h-96 border rounded-md overflow-hidden">
      <style jsx global>{`
        .cm-editor {
          height: 100%;
        }
        .cm-focused {
          outline: none;
        }
        .cm-breakpoint-gutter {
          width: 20px;
          cursor: pointer;
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
      <div ref={editorRef} className="h-full" />
    </div>
  )
}
