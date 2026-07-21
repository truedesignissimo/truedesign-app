"use client";

import { createClient } from "@/lib/supabase-browser";

export default function HomeAppLink({ appId, name, url }: { appId: string; name: string; url: string }) {
  async function openApp(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from("usage_log").insert({ user_id: user.id, app_id: appId });
    window.location.assign(url);
  }

  return (
    <a className="home-workspace-app" href={url} onClick={openApp}>
      <strong>{name}</strong>
    </a>
  );
}
