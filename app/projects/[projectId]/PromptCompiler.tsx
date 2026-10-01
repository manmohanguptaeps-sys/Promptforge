"use client";

import { useState } from "react";

type PromptCompilerProps = {
  projectId: string;
};

export default function PromptCompiler({
  projectId,
}: PromptCompilerProps) {
  const [request, setRequest] = useState("");
  const [prompt, setPrompt] = useState("");
  const [contextUsed, setContextUsed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCompile() {
    const trimmedRequest = request.trim();

    if (!trimmedRequest || loading) {
      return;
    }

    setLoading(true);
    setError("");
    setPrompt("");

    try {
      const response = await fetch("/api/prompt/compile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          request: trimmedRequest,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to compile prompt."
        );
      }

      setPrompt(data.prompt);
      setContextUsed(data.contextUsed ?? 0);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!prompt) return;

    await navigator.clipboard.writeText(prompt);
  }

  return (
    <div className="mt-8 rounded-xl border border-zinc-200">
      {/* Header */}
      <div className="border-b border-zinc-200 p-5">
        <h3 className="text-lg font-semibold">
          Prompt Compiler
        </h3>

        <p className="mt-1 text-sm text-zinc-500">
          Turn a simple request into an implementation-ready
          prompt using your project context.
        </p>
      </div>

      <div className="space-y-6 p-5">
        {/* Request */}
        <div>
          <label className="text-sm font-medium">
            What do you want to build or change?
          </label>

          <textarea
            value={request}
            onChange={(event) =>
              setRequest(event.target.value)
            }
            placeholder="Example: Improve the login page without breaking authentication."
            rows={5}
            className="mt-2 w-full resize-none rounded-lg border border-zinc-300 p-4 text-sm outline-none focus:border-zinc-500"
          />
        </div>

        {/* Compile */}
        <button
          type="button"
          onClick={handleCompile}
          disabled={loading || !request.trim()}
          className="rounded-lg bg-zinc-900 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Compiling..." : "Compile Prompt"}
        </button>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Result */}
        {prompt && (
          <div className="rounded-lg border border-zinc-200">
            <div className="flex items-center justify-between border-b border-zinc-200 p-4">
              <div>
                <h4 className="font-medium">
                  Optimized Prompt
                </h4>

                <p className="mt-1 text-xs text-zinc-500">
                  Context used: {contextUsed}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50"
              >
                Copy
              </button>
            </div>

            <pre className="whitespace-pre-wrap p-5 text-sm leading-6 text-zinc-800">
              {prompt}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}