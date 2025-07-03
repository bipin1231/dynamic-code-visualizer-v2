// pages/visualizer.tsx
"use client";

import MonacoVisualizer from "../../src/New Components/MonacoVisualizer"
import Link from "next/link";

export default function VisualizerPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow p-4 mb-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Code Visualizer</h1>
          <Link href="/" className="text-blue-600 hover:underline">
            Home
          </Link>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-4">
       <MonacoVisualizer/>
      </main>
    </div>
  );
}
