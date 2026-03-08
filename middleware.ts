import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const supabaseUrl = "https://zxzolpczwjwfgmiqsuko.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4em9scGN6d2p3ZmdtaXFzdWtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NTQzNTEsImV4cCI6MjA4ODUzMDM1MX0.8Bxlx5P-KeSe78ApFPNyrSv7jWBz4hL3OL9Z3V4sSwY";

function metadataSaysAdmin(user: { user_metadata?: unknown; app_metadata?: unknown }) {
  const userMeta = (user.user_metadata || {}) as Record<string, unknown>;
  const appMeta = (user.app_metadata || {}) as Record<string, unknown>;

  const userRole = String(userMeta.role || "").toLowerCase();
  const appRole = String(appMeta.role || "").toLowerCase();
  const userIsAdmin = userMeta.is_admin === true;
  const appIsAdmin = appMeta.is_admin === true;

  return userRole === "admin" || appRole === "admin" || userIsAdmin || appIsAdmin;
}

async function isAdminFromProfile(
  supabase: ReturnType<typeof createServerClient>,
  userId: string
) {
  const { data, error } = await supabase
    .from("profiles")
    .select("role, is_admin")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return false;

  const role = String(data.role || "").toLowerCase();
  return role === "admin" || data.is_admin === true;
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isPatientRoute = pathname === "/book" || pathname === "/appointments";
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isLoginRoute = pathname === "/login";

  if (!user && (isPatientRoute || isAdminRoute)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  if (!user) return response;

  let isAdmin = metadataSaysAdmin(user);
  if (!isAdmin) {
    isAdmin = await isAdminFromProfile(supabase, user.id);
  }

  if (isAdminRoute && !isAdmin) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/appointments";
    return NextResponse.redirect(redirectUrl);
  }

  if (isLoginRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = isAdmin ? "/admin" : "/appointments";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/book", "/appointments", "/admin/:path*", "/login"],
};
