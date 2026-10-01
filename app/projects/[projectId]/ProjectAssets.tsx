"use client";

import { ChangeEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ProjectAssetsProps = {
    projectId: string;
};

export default function ProjectAssets({
    projectId,
}: ProjectAssetsProps) {
    const supabase = createClient();

    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState("");

    async function handleUpload(
        event: ChangeEvent<HTMLInputElement>
    ) {
        const file = event.target.files?.[0];

        if (!file) return;

        setUploading(true);
        setMessage("");

        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                setMessage("You must be logged in.");
                return;
            }

            const filePath = `${user.id}/${projectId}/${crypto.randomUUID()}-${file.name}`;

            // 1. Upload file to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from("project-assets")
                .upload(filePath, file, {
                    contentType: file.type,
                    upsert: false,
                });

            if (uploadError) {
                console.error(uploadError);
                setMessage(uploadError.message);
                return;
            }

            // 2. Save file metadata in database
            const { data: asset, error: assetError } = await supabase
                .from("project_assets")
                .insert({
                    project_id: projectId,
                    user_id: user.id,
                    name: file.name,
                    file_type: file.type.split("/")[0] || "unknown",
                    mime_type: file.type,
                    storage_path: filePath,
                    file_size: file.size,
                    metadata: {
                        original_name: file.name,
                    },
                })
                .select()
                .single();
            if (assetError) {
                console.error(assetError);
                setMessage(
                    "File uploaded, but metadata could not be saved."
                );
                return;
            }

            const ingestResponse = await fetch(
                `/api/projects/${projectId}/ingest`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        assetId: asset.id,
                    }),
                }
            );

            const ingestData = await ingestResponse.json();

            if (!ingestResponse.ok) {
                console.error(ingestData);
                setMessage("File uploaded, but content processing failed.");
                return;
            }

            setMessage(
                ingestData.processed
                    ? "File uploaded and added to project context."
                    : "File uploaded successfully."
            );

            setMessage("File uploaded successfully.");
        } catch (error) {
            console.error(error);
            setMessage("Upload failed.");
        } finally {
            setUploading(false);
            event.target.value = "";
        }
    }

    return (
        <div className="mt-8 rounded-xl border border-zinc-200 p-6">
            <h3 className="text-lg font-semibold">
                Project Assets
            </h3>

            <p className="mt-2 text-sm text-zinc-500">
                Upload images, documents, screenshots and other project files.
            </p>

            <div className="mt-5">
                <label className="inline-flex cursor-pointer rounded-lg bg-zinc-900 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-700">
                    {uploading ? "Uploading..." : "Upload File"}

                    <input
                        type="file"
                        className="hidden"
                        onChange={handleUpload}
                        disabled={uploading}
                        accept="image/*,.pdf,.txt,.md,.json,.js,.jsx,.ts,.tsx,.css,.html"
                    />
                </label>
            </div>

            {message && (
                <p className="mt-4 text-sm text-zinc-600">
                    {message}
                </p>
            )}
        </div>
    );
}