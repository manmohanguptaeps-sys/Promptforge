import { createClient } from "@/lib/supabase/server";

export default async function TestSupabasePage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen p-10">
      <h1 className="text-2xl font-semibold">
        Supabase Connection Test
      </h1>

      <pre className="mt-6 rounded-lg bg-zinc-100 p-4">
        {JSON.stringify(
          {
            connected: !error,
            user: data.user,
            error: error?.message,
          },
          null,
          2
        )}
      </pre>
    </main>
  );
}