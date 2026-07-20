import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtected = isProtectedPath(pathname);

  if (isProtected && !user) {
    const redirectUrl = new URL("/login", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  if (pathname.startsWith("/apps/")) {
    const appPath = getCatalogAppPath(pathname);
    const admin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data: app } = await admin
      .from("apps")
      .select("id, visibility, is_active")
      .eq("url", appPath)
      .maybeSingle();

    if (app?.is_active && app.visibility === "pubblica") {
      return response;
    }

    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("is_admin, approval_status")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.approval_status === "pending" || profile?.approval_status === "rejected") {
      return NextResponse.redirect(new URL("/in-attesa", request.url));
    }

    if (profile?.is_admin && app?.is_active) {
      return response;
    }

    if (!app?.is_active) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    const { data: assignment } = await admin
      .from("user_apps")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("app_id", app.id)
      .maybeSingle();

    if (!assignment) {
      return NextResponse.redirect(new URL("/accesso-negato?motivo=app", request.url));
    }
  }

  return response;
}

export function isProtectedPath(pathname: string) {
  return pathname.startsWith("/dashboard") || pathname.startsWith("/admin");
}

export function getCatalogAppPath(pathname: string) {
  return `/${pathname.split("/").filter(Boolean).slice(0, 2).join("/")}`;
}

export const config = { matcher: ["/dashboard/:path*", "/admin/:path*", "/apps/:path*"] };
