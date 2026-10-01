import { createClient } from "@/lib/supabase/server";
import { rankMemories } from "@/lib/context/rankMemories";

type ContextEngineInput = {
  projectId: string;
  query: string;
  limit?: number;
};

export async function getProjectContext({
  projectId,
  query,
  limit = 8,
}: ContextEngineInput) {
  const supabase = await createClient();

  const { data: memories, error } = await supabase
    .from("project_memories")
    .select(
      "id, content, memory_type, importance, created_at"
    )
    .eq("project_id", projectId)
    .order("importance", {
      ascending: false,
    })
    .limit(100);

  if (error) {
    console.error("Context retrieval error:", error);
    throw new Error("Failed to load project context.");
  }

  const rankedMemories = rankMemories(
    query,
    memories ?? [],
    limit
  );

  const context =
    rankedMemories.length > 0
      ? rankedMemories
          .map(
            (memory, index) =>
              `CONTEXT ${index + 1}
Type: ${memory.memory_type}
Importance: ${memory.importance}

${memory.content}`
          )
          .join("\n\n---\n\n")
      : "No relevant project context found.";

  return {
    memories: rankedMemories,
    context,
  };
}