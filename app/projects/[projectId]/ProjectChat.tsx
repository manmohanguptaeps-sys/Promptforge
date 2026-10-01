"use client";

import { FormEvent, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type ProjectChatProps = {
  projectId: string;
};

export default function ProjectChat({
  projectId,
}: ProjectChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(
    null
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const message = input.trim();

    if (!message || loading) return;

    setInput("");

    setMessages((current) => [
      ...current,
      {
        role: "user",
        content: message,
      },
    ]);

    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          conversationId,
          message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Request failed.");
      }

      setConversationId(data.conversationId);

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: data.response,
        },
      ]);
    } catch (error) {
      console.error(error);

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 rounded-xl border border-zinc-200">
      <div className="border-b border-zinc-200 p-5">
        <h3 className="font-semibold">
          AI Assistant
        </h3>

        <p className="mt-1 text-sm text-zinc-500">
          Ask questions about your project.
        </p>
      </div>

      <div className="min-h-[350px] space-y-4 p-5">
        {messages.length === 0 && (
          <div className="py-20 text-center text-sm text-zinc-400">
            Ask your first question about this project.
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={
              message.role === "user"
                ? "ml-auto max-w-[80%] rounded-xl bg-zinc-900 p-4 text-sm text-white"
                : "max-w-[80%] rounded-xl bg-zinc-100 p-4 text-sm text-zinc-900"
            }
          >
            <div className="mb-1 text-xs font-medium opacity-60">
              {message.role === "user" ? "You" : "PromptForge"}
            </div>

            <div className="whitespace-pre-wrap">
              {message.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="max-w-[80%] rounded-xl bg-zinc-100 p-4 text-sm text-zinc-500">
            Thinking...
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-zinc-200 p-4"
      >
        <div className="flex gap-3">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask something about your project..."
            className="flex-1 rounded-lg border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-500"
          />

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-lg bg-zinc-900 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}