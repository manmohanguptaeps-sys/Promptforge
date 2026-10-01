import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function GET(
  request: Request,
  { params }: RouteProps
) {
  try {
    const { projectId } = await params;

    const supabase = await createClient();

    // 1. Get logged-in user
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

    // 2. Get project
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

    // 3. Get project assets
    const { data: assets, error: assetsError } =
      await supabase
        .from("project_assets")
        .select(
          "id, name, file_type, mime_type, storage_path, file_size, created_at"
        )
        .eq("project_id", projectId)
        .order("created_at", {
          ascending: false,
        });

    if (assetsError) {
      console.error(assetsError);

      return NextResponse.json(
        { error: "Failed to load project assets." },
        { status: 500 }
      );
    }

    // 4. Get project memories
    const { data: memories, error: memoriesError } =
      await supabase
        .from("project_memories")
        .select(
          "id, project_id, user_id, content, memory_type, importance, created_at, updated_at"
        )
        .eq("project_id", projectId)
        .order("importance", {
          ascending: false,
        });

    if (memoriesError) {
      console.error(memoriesError);

      return NextResponse.json(
        { error: "Failed to load project memories." },
        { status: 500 }
      );
    }

    // 5. Return complete project context
    return NextResponse.json({
      project,
      assets: assets ?? [],
      memories: memories ?? [],
    });
  } catch (error) {
    console.error("Context API error:", error);

    return NextResponse.json(
      { error: "Failed to load project context." },
      { status: 500 }
    );
  }
}