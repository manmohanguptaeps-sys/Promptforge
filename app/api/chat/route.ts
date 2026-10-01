import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateAIResponse } from "@/lib/ai/gemini";
import { getProjectContext } from "@/lib/context/contextEngine";
import { analyzeIntentFast } from "@/lib/ai/analyzeIntent";

export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        // 1. Authenticate user
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

        // 2. Read request
        const body = await request.json();

        const message = body.message?.trim();
        const projectId = body.projectId;
        const conversationId = body.conversationId || null;

        if (!message) {
            return NextResponse.json(
                { error: "Message is required." },
                { status: 400 }
            );
        }

        if (!projectId) {
            return NextResponse.json(
                { error: "Project ID is required." },
                { status: 400 }
            );
        }

        // 3. Get project
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

        // 4. Analyze user intent
        const intentResult = analyzeIntentFast(message);

        if (!intentResult) {
            return NextResponse.json(
                { error: "Unable to understand request." },
                { status: 400 }
            );
        }

        console.log("Intent result:", intentResult);

        // 5. Get project context only when required
        let memoryContext = "No project context required.";
        let contextUsed = 0;

        if (intentResult.needsContext) {
            const projectContext = await getProjectContext({
                projectId,
                query: message,
                limit: 8,
            });

            memoryContext = projectContext.context;
            contextUsed = projectContext.memories.length;
        }

        // 6. Create conversation if needed
        let activeConversationId = conversationId;

        if (!activeConversationId) {
            const { data: conversation, error: conversationError } =
                await supabase
                    .from("conversations")
                    .insert({
                        project_id: projectId,
                        user_id: user.id,
                        title: message.slice(0, 80),
                    })
                    .select()
                    .single();

            if (conversationError || !conversation) {
                console.error(conversationError);

                return NextResponse.json(
                    { error: "Failed to create conversation." },
                    { status: 500 }
                );
            }

            activeConversationId = conversation.id;
        }

        // 7. Save user message
        const { error: userMessageError } =
            await supabase
                .from("messages")
                .insert({
                    conversation_id: activeConversationId,
                    user_id: user.id,
                    role: "user",
                    content: message,
                });

        if (userMessageError) {
            console.error(userMessageError);

            return NextResponse.json(
                { error: "Failed to save user message." },
                { status: 500 }
            );
        }

        // 8. Build AI prompt
        const prompt = `
You are the AI assistant inside PromptForge.

PromptForge is a general AI assistant that can answer normal questions
and also understand the user's project using project-specific context.


INTENT ANALYSIS

Intent:
${intentResult.intent}

Task Type:
${intentResult.taskType}

Project Related:
${intentResult.projectRelated}

Needs Project Context:
${intentResult.needsContext}


PROJECT

Name:
${project.name}

Description:
${project.description ?? "No description provided."}


PROJECT CONTEXT

${memoryContext}


USER REQUEST

${message}


INSTRUCTIONS

1. If the request is project-related:
   - Use the provided project context.
   - Use relevant project memories and uploaded file information.
   - Do not invent project-specific details.
   - If important project information is missing, clearly mention what is missing.

2. If the request is NOT project-related:
   - Answer the question normally using your general knowledge.
   - Do not depend on the project context.
   - Do not say that information is unavailable simply because it is not present
     in the project context.

3. If the request is a coding request:
   - Give practical implementation-oriented guidance.
   - Use project context when relevant.
   - Preserve existing project functionality unless the user asks to change it.

4. If the request is a general knowledge question:
   - Answer directly and clearly.

5. If the request is about the project:
   - Prefer facts from the provided project context over assumptions.

6. Never invent project-specific files, technologies, APIs, database structures,
   or existing functionality that are not present in the provided context.

7. Keep the response clear, useful, and reasonably concise.
`;

        // 9. Generate AI response
        const aiResponse = await generateAIResponse(prompt);

        // 10. Save AI response
        const { error: assistantMessageError } =
            await supabase
                .from("messages")
                .insert({
                    conversation_id: activeConversationId,
                    user_id: user.id,
                    role: "assistant",
                    content: aiResponse,
                });

        if (assistantMessageError) {
            console.error(assistantMessageError);

            return NextResponse.json(
                { error: "Failed to save AI response." },
                { status: 500 }
            );
        }

        // 11. Return response
        return NextResponse.json({
            conversationId: activeConversationId,
            response: aiResponse,
            contextUsed,
            intent: intentResult,
        });
    } catch (error) {
        console.error("Chat API error:", error);

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "AI request failed.",
            },
            { status: 500 }
        );
    }
}