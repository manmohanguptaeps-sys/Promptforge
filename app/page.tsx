import Link from "next/link";
export default function Home() {
  return (
    <main className="min-h-screen bg-white text-zinc-900">
      {/* Header */}
      <header className="border-b border-zinc-200">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="text-xl font-semibold tracking-tight">
            PromptForge
          </div>

          <button className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium transition hover:bg-zinc-100">
            Sign In
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-1.5 text-sm text-zinc-600">
          AI Project Context Engine
        </div>

        <h1 className="max-w-4xl text-5xl font-semibold tracking-tight sm:text-6xl">
          Turn your project context into
          <span className="block text-zinc-500">
            precise AI coding prompts.
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600">
          Give your AI coding agent the right context, constraints, and
          project knowledge without repeatedly explaining everything.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/projects/new"
            className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-700"
          >
            Create New Project
          </Link>
          <button className="rounded-lg border border-zinc-300 px-6 py-3 text-sm font-medium transition hover:bg-zinc-100">
            See How It Works
          </button>
        </div>
      </section>
    </main>
  );
}