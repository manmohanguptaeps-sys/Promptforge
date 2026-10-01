type Memory = {
  id: string;
  content: string;
  memory_type: string;
  importance: number;
  created_at: string;
};

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function rankMemories(
  query: string,
  memories: Memory[],
  limit = 8
) {
  const queryWords = new Set(normalize(query));

  const ranked = memories.map((memory) => {
    const memoryWords = normalize(memory.content);

    let matchScore = 0;

    for (const word of memoryWords) {
      if (queryWords.has(word)) {
        matchScore++;
      }
    }

    const importanceScore = memory.importance ?? 0;

    const finalScore =
      matchScore * 3 + importanceScore;

    return {
      ...memory,
      score: finalScore,
    };
  });

  return ranked
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}