import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import babel from "@rollup/plugin-babel"
import path from "path"

export default defineConfig({
  plugins: [
    react(),
    babel({
      babelHelpers: 'bundled',
      extensions: ['.js', '.ts', '.tsx'],
      include: ['src/**'],
      plugins: ['./babel-plugins/emit-steps.js'],
    }),
  ],
  server: { open: true },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "@components": path.resolve(__dirname, "components"),
      "@lib": path.resolve(__dirname, "lib"),
      "@hooks": path.resolve(__dirname, "hooks"),
      "@types": path.resolve(__dirname, "types"),
      "@data": path.resolve(__dirname, "data")
    },
  },
})
