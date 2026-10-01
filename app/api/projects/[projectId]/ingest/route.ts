import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteProps = {
  params: Promise<{
    projectId: string;
  }>;
};

const TEXT_FILE_TYPES = [
  "text/plain",
  "text/markdown",
  "application/json",
  "text/javascript",
  "application/javascript",
  "text/typescript",
  "text/css",
  "text/html",
];

export async function POST(
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

    // 2. Read request
    const body = await request.json();

    const assetId = body.assetId;

    if (!assetId) {
      return NextResponse.json(
        { error: "Asset ID is required." },
        { status: 400 }
      );
    }

    // 3. Get asset
    const { data: asset, error: assetError } =
      await supabase
        .from("project_assets")
        .select(
          "id, project_id, user_id, name, mime_type, storage_path"
        )
        .eq("id", assetId)
        .eq("project_id", projectId)
        .single();

    if (assetError || !asset) {
      return NextResponse.json(
        { error: "Asset not found." },
        { status: 404 }
      );
    }

    // 4. Make sure asset belongs to current user
    if (asset.user_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 403 }
      );
    }

    // 5. Only process text/code files for now
    if (!TEXT_FILE_TYPES.includes(asset.mime_type)) {
      return NextResponse.json({
        success: true,
        message: "File type will be supported later.",
        processed: false,
      });
    }

    // 6. Download file from Supabase Storage
    const { data: file, error: downloadError } =
      await supabase.storage
        .from("project-assets")
        .download(asset.storage_path);

    if (downloadError || !file) {
      console.error(downloadError);

      return NextResponse.json(
        { error: "Failed to read file from storage." },
        { status: 500 }
      );
    }

    // 7. Convert file to text
    const content = await file.text();

    if (!content.trim()) {
      return NextResponse.json({
        success: true,
        message: "File is empty.",
        processed: false,
      });
    }

    // 8. Save file content as project memory
    const { data: memory, error: memoryError } =
      await supabase
        .from("project_memories")
        .insert({
          project_id: projectId,
          user_id: user.id,
          content: `File: ${asset.name}\n\n${content}`,
          memory_type: "file_content",
          importance: 5,
          source_asset_id: asset.id,
        })
        .select()
        .single();

    if (memoryError) {
      console.error(memoryError);

      return NextResponse.json(
        { error: "Failed to save project memory." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      processed: true,
      memory,
    });
  } catch (error) {
    console.error("Ingestion error:", error);

    return NextResponse.json(
      { error: "Failed to process file." },
      { status: 500 }
    );
  }
}