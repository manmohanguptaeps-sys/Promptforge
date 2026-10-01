"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewProjectPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create project.");
        return;
      }

      // Project successfully created
      router.push(`/projects/${data.project.id}`);
    } catch (error) {
      console.error(error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-10">
          <p className="text-sm font-medium text-zinc-500">
            New Project
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Create a project
          </h1>

          <p className="mt-2 text-zinc-600">
            Give your project a name and describe what you are building.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Name */}
          <div>
            <label
              htmlFor="project-name"
              className="mb-2 block text-sm font-medium"
            >
              Project name
            </label>

            <input
              id="project-name"
              name="projectName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. E-commerce Dashboard"
              className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
            />
          </div>

          {/* Project Description */}
          <div>
            <label
              htmlFor="project-description"
              className="mb-2 block text-sm font-medium"
            >
              Project description
            </label>

            <textarea
              id="project-description"
              name="projectDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              placeholder="Describe your project, its purpose, technology stack, or anything the AI should know..."
              className="w-full resize-none rounded-lg border border-zinc-300 px-4 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-zinc-200 pt-6">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium transition hover:bg-zinc-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}