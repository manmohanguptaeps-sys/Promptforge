import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateAIResponse } from "@/lib/ai/gemini";
import { getProjectContext } from "@/lib/context/contextEngine";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const projectId = body.projectId;
    const conversationId = body.conversationId || null;
    const requestText = body.request?.trim();

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required." },
        { status: 400 }
      );
    }

    if (!requestText) {
      return NextResponse.json(
        { error: "Request is required." },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 1. Load project
    // --------------------------------------------------

    const { data: project, error: projectError } =
      await supabase
        .from("projects")
        .select("id, name, description")
        .eq("id", projectId)
        .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found." },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // 2. Retrieve relevant project context
    // --------------------------------------------------

    const projectContext = await getProjectContext({
      projectId,
      query: requestText,
      limit: 6,
    });

    // --------------------------------------------------
    // 3. Generate concise implementation prompt
    // --------------------------------------------------

    const compilerPrompt = `
You are PromptForge's Prompt Compiler.

Your job is to convert the user's request into a concise,
implementation-ready prompt for another AI coding agent.

PROJECT
Name: ${project.name}

Description:
${project.description ?? "No description provided."}

RELEVANT PROJECT CONTEXT
${projectContext.context}

USER REQUEST
${requestText}

GOAL

Create the minimum sufficient prompt needed for another AI
coding agent to correctly understand and execute the request.

IMPORTANT RULES

1. Preserve the user's exact intent.
2. Do not invent project details.
3. Use project context only when relevant.
4. Do not include irrelevant context.
5. Do not make the prompt unnecessarily long.
6. Do not repeat the same information.
7. Do not solve the task yourself.
8. Give instructions to the coding agent.
9. Tell the agent to inspect the existing implementation before
   changing code when existing code may affect the task.
10. Preserve existing functionality unless the user explicitly
    requests a change.
11. Mention missing information only when it is actually important.
12. Use concise bullet points where useful.

PROMPT STRUCTURE

Do NOT force a fixed structure.

Choose only the sections that are useful for this particular request.

Possible sections include:

- Task
- Context
- Requirements
- Constraints
- Implementation Notes
- Expected Output

Small/simple requests should produce short prompts.

Complex requests may contain more detail.

The final prompt should be directly usable by an AI coding agent.

Return ONLY the final prompt.
Do not add explanations before or after it.
`;

    const compiledPrompt =
      await generateAIResponse(compilerPrompt);

    // --------------------------------------------------
    // 4. Save generated prompt
    // --------------------------------------------------

    const { data: generatedPrompt, error: saveError } =
      await supabase
        .from("generated_prompts")
        .insert({
          project_id: projectId,
          conversation_id: conversationId,
          user_id: user.id,
          user_request: requestText,
          generated_prompt: compiledPrompt,
          model: "gemini",
        })
        .select()
        .single();

    if (saveError) {
      console.error(
        "Generated prompt save error:",
        saveError
      );

      return NextResponse.json(
        { error: "Failed to save generated prompt." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      prompt: compiledPrompt,
      promptId: generatedPrompt.id,
      contextUsed: projectContext.memories.length,
    });
  } catch (error) {
    console.error("Prompt compiler error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Prompt compilation failed.",
      },
      { status: 500 }
    );
  }
}