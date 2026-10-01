"use client";

import { useState } from "react";

export default function TestAIPage() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    setResponse("");

    try {
      const result = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: "c97b0b52-e28b-4737-aa23-70a7584b10cc",
          message,
        }),
      });

      const data = await result.json();

      if (!result.ok) {
        setResponse(data.error || "Something went wrong.");
        return;
      }

      setResponse(data.response);
    } catch (error) {
      console.error(error);
      setResponse("Request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-10">
      <h1 className="text-3xl font-semibold">
        AI Test
      </h1>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ask something..."
        className="mt-6 min-h-32 w-full rounded-lg border border-zinc-300 p-4"
      />

      <button
        onClick={handleSubmit}
        disabled={loading || !message.trim()}
        className="mt-4 rounded-lg bg-zinc-900 px-5 py-3 text-white disabled:opacity-50"
      >
        {loading ? "Thinking..." : "Ask AI"}
      </button>

      {response && (
        <div className="mt-8 whitespace-pre-wrap rounded-lg bg-zinc-100 p-5">
          {response}
        </div>
      )}
    </main>
  );
}