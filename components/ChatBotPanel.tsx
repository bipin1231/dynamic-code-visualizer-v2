"use client";

import { useState } from "react";

export default function ChatBotPanel() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();
      setResponse(data.reply || "No response");
    } catch (err) {
      setResponse("Error contacting API");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 max-w-xl mx-auto mt-8 border rounded">
      <h2 className="mb-2 text-lg font-bold">Ask me anything about the code</h2>
      <textarea
        rows={4}
        className="w-full p-2 border mb-2"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your question here..."
      />
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        onClick={sendMessage}
        disabled={loading}
      >
        {loading ? "Loading..." : "Send"}
      </button>

      {response && (
        <pre className="mt-4 p-3 bg-gray-100 rounded whitespace-pre-wrap">{response}</pre>
      )}
    </div>
  );
}
