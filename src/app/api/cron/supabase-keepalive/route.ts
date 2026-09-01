import { createAdminClient } from "@/lib/supabase-admin";
import { executeSupabaseKeepAlive } from "@/lib/supabase-keepalive";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const result = await executeSupabaseKeepAlive({
    authorization: request.headers.get("authorization"),
    secret: process.env.CRON_SECRET,
    async query() {
      const { error } = await createAdminClient()
        .from("apps")
        .select("id")
        .limit(1);
      if (error) throw error;
    },
    logger(error) {
      console.error("[cron/supabase-keepalive] query_failed", error);
    },
  });

  return Response.json(result.body, { status: result.status });
}
