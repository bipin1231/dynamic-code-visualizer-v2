// This is a simplified version of monaco-editor-webpack-plugin
// Create this file in the root of your project

const path = require("path")
const fs = require("fs")

// Copy Monaco Editor workers to public directory
function copyMonacoWorkers() {
  const monacoPath = path.dirname(require.resolve("monaco-editor/package.json"))
  const workersPath = path.join(monacoPath, "esm", "vs", "editor")

  const publicDir = path.join(process.cwd(), "public", "_next", "static", "chunks", "monaco-editor")

  // Create directory if it doesn't exist
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true })
  }

  // Copy editor.worker.js
  fs.copyFileSync(path.join(workersPath, "editor.worker.js"), path.join(publicDir, "editor.worker.js"))

  // Copy language workers
  const languageWorkers = [
    { name: "json.worker.js", path: ["language", "json", "json.worker.js"] },
    { name: "css.worker.js", path: ["language", "css", "css.worker.js"] },
    { name: "html.worker.js", path: ["language", "html", "html.worker.js"] },
    { name: "ts.worker.js", path: ["language", "typescript", "ts.worker.js"] },
  ]

  languageWorkers.forEach((worker) => {
    const workerPath = path.join(monacoPath, "esm", "vs", ...worker.path)
    if (fs.existsSync(workerPath)) {
      fs.copyFileSync(workerPath, path.join(publicDir, worker.name))
    }
  })
}

// Run this script during build
copyMonacoWorkers()

console.log("Monaco Editor workers copied to public directory")
