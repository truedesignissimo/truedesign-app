"use client";

import { createClient } from "@/lib/supabase-browser";

export default function AppLink({
  appId,
  name,
  url,
}: {
  appId: string;
  name: string;
  url: string | null;
}) {
  const supabase = createClient();

  async function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (!url) return;
    event.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("usage_log").insert({ user_id: user.id, app_id: appId });
    }
    window.location.assign(url);
  }

  if (!url) {
    return (
      <div className="app-title-card app-title-card-disabled" aria-disabled="true">
        <h2>{name}</h2>
      </div>
    );
  }

  return (
    <a className="app-title-card" href={url} onClick={handleClick}>
      <h2>{name}</h2>
    </a>
  );
}
