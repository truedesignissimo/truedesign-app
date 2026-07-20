"use client";

import { createClient } from "@/lib/supabase-browser";

export default function AppLink({
  appId,
  url,
  userId,
}: {
  appId: string;
  url: string | null;
  userId: string;
}) {
  const supabase = createClient();

  async function handleClick() {
    await supabase.from("usage_log").insert({ user_id: userId, app_id: appId });
    if (url) {
      window.open(url, "_blank");
    }
  }

  return (
    <button className="btn" onClick={handleClick} disabled={!url}>
      Apri
    </button>
  );
}
