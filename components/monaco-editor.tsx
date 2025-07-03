"use client"

import { useEffect, useRef, useState } from "react"
import type * as monacoTypes from "monaco-editor"
import { Loader2 } from "lucide-react"

interface MonacoEditorProps {
  value: string
  onChange: (code: string) => void
  language: string
  // Optional debug-extras
  currentLine?: number
  breakpoints?: number[]
  onBreakpointToggle?: (line: number) => void
  disabled?: boolean
}

/* --- util ---------------------------------------------------------------- */

const lang2Monaco = (lang: string): string =>
  (
    ({
      javascript: "javascript",
      typescript: "typescript",
      python: "python",
      cpp: "cpp",
      c: "c",
      java: "java",
    }) as Record<string, string>
  )[lang] ?? "plaintext"

/* ------------------------------------------------------------------------- */

export default function MonacoEditor({
  value,
  onChange,
  language,
  currentLine = -1,
  breakpoints = [],
  onBreakpointToggle,
  disabled = false,
}: MonacoEditorProps) {
  /* refs ------------------------------------------------------------------ */
  const containerRef = useRef<HTMLDivElement | null>(null)
  const monacoRef = useRef<typeof monacoTypes>() // the library
  const editorRef = useRef<monacoTypes.editor.IStandaloneCodeEditor | null>(null)
  const decorsRef = useRef<string[]>([]) // current-line decorations
  const bpDecorsRef = useRef<string[]>([]) // breakpoint decorations
  const fromPropUpdate = useRef(false) // recursion guard

  /* load Monaco only on client ------------------------------------------- */
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let mounted = true
    import("monaco-editor").then((m) => {
      if (mounted) {
        monacoRef.current = m
        setLoading(false)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  /* create the editor ONCE ----------------------------------------------- */
  useEffect(() => {
    if (loading || !containerRef.current || !monacoRef.current || editorRef.current) return
    const monaco = monacoRef.current!

    const editor = monaco.editor.create(containerRef.current, {
      value,
      language: lang2Monaco(language),
      theme: "vs-dark",
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      glyphMargin: true,
      readOnly: disabled,
      fontSize: 14,
      wordWrap: "on",
    })

    /* user edits -> lift state up */
    const sub = editor.onDidChangeModelContent(() => {
      if (fromPropUpdate.current) return
      onChange(editor.getValue())
    })

    /* breakpoint clicks */
    const sub2 = editor.onMouseDown((e) => {
      if (
        e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN &&
        onBreakpointToggle &&
        e.target.position?.lineNumber
      ) {
        onBreakpointToggle(e.target.position.lineNumber)
      }
    })

    editorRef.current = editor
    editor.focus()

    /* cleanup only when component truly unmounts */
    return () => {
      try {
        if (!editor.isDisposed()) {
          decorsRef.current = editor.deltaDecorations(decorsRef.current, [])
          bpDecorsRef.current = editor.deltaDecorations(bpDecorsRef.current, [])
          sub.dispose()
          sub2.dispose()
          editor.dispose() // editor takes care of the model
        }
      } catch {
        /* swallow – ensures stray async observers don’t throw */
      }
    }
  }, [loading, disabled, language, onChange, onBreakpointToggle, value])

  /* external value change ------------------------------------------------- */
  useEffect(() => {
    if (!editorRef.current) return
    const current = editorRef.current.getValue()
    if (current !== value) {
      fromPropUpdate.current = true
      editorRef.current.setValue(value)
      fromPropUpdate.current = false
    }
  }, [value])

  /* language change ------------------------------------------------------- */
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return
    const model = editorRef.current.getModel()
    const newLang = lang2Monaco(language)
    if (model && model.getLanguageId() !== newLang) {
      monacoRef.current.editor.setModelLanguage(model, newLang)
    }
  }, [language])

  /* readOnly toggle ------------------------------------------------------- */
  useEffect(() => {
    editorRef.current?.updateOptions({ readOnly: disabled })
  }, [disabled])

  /* current line highlight ------------------------------------------------ */
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return
    const monaco = monacoRef.current
    const editor = editorRef.current

    decorsRef.current = editor.deltaDecorations(decorsRef.current, []) // clear
    if (currentLine > 0) {
      decorsRef.current = editor.deltaDecorations(
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
      editor.revealLineInCenter(currentLine)
    }
  }, [currentLine])

  /* breakpoint decorations ----------------------------------------------- */
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return
    const monaco = monacoRef.current
    const editor = editorRef.current

    bpDecorsRef.current = editor.deltaDecorations(bpDecorsRef.current, []) // clear
    if (breakpoints.length) {
      const decs = breakpoints.map((ln) => ({
        range: new monaco.Range(ln, 1, ln, 1),
        options: { glyphMarginClassName: "breakpoint-glyph" },
      }))
      bpDecorsRef.current = editor.deltaDecorations([], decs)
    }
  }, [breakpoints])

  /* ---------------------------------------------------------------------- */
  return (
    <div className="relative h-96 w-full overflow-hidden rounded-md border">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* styling hooks */}
      <style jsx global>{`
        .current-line-highlight {
          background: rgba(255, 215, 0, 0.15);
          border-left: 2px solid #ffbf00;
        }
        .breakpoint-glyph {
          background: #e53935;
          border-radius: 50%;
          width: 8px !important;
          height: 8px !important;
          margin-left: 5px;
        }
      `}</style>

      <div ref={containerRef} className="h-full w-full" />
    </div>
  )
}
