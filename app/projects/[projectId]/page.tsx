import { notFound } from "next/navigation";
import ProjectAssets from "./ProjectAssets";
import ProjectChat from "./ProjectChat";
import { createClient } from "@/lib/supabase/server";
import PromptCompiler from "./PromptCompiler";

type ProjectPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ProjectPage({
  params,
}: ProjectPageProps) {
  const { projectId } = await params;

  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (error || !project) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <header className="border-b border-zinc-200">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-6">
          <h1 className="text-xl font-semibold">
            PromptForge
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="border-b border-zinc-200 pb-8">
          <p className="text-sm font-medium text-zinc-500">
            Project
          </p>

          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            {project.name}
          </h2>

          {project.description && (
            <p className="mt-3 max-w-3xl text-zinc-600">
              {project.description}
            </p>
          )}
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 p-6">
            <h3 className="font-semibold">Project Context</h3>
            <p className="mt-2 text-sm text-zinc-500">
              Files, images, technology stack and project knowledge.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 p-6">
            <h3 className="font-semibold">AI Assistant</h3>
            <p className="mt-2 text-sm text-zinc-500">
              Ask questions and work with your project context.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 p-6">
            <h3 className="font-semibold">Prompt Compiler</h3>
            <p className="mt-2 text-sm text-zinc-500">
              Generate optimized prompts using your project context.
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-dashed border-zinc-300 p-10 text-center">
          <h3 className="text-lg font-semibold">
            Project workspace
          </h3>

          <p className="mt-2 text-sm text-zinc-500">
            Your AI workspace will be built here.
          </p>
        </div>
        <ProjectAssets projectId={project.id} />
        <ProjectChat projectId={project.id} />
        <PromptCompiler projectId={project.id} />
      </div>
    </main>
  );
}