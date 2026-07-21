"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function SignOutButton({
  className = "btn btn-secondary",
  redirectTo = "/login",
  label = "Esci",
}: {
  className?: string;
  redirectTo?: string;
  label?: string;
} = {}) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <button type="button" className={className} onClick={handleSignOut}>
      {label}
    </button>
  );
}
