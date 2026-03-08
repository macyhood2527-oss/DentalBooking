import { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

function metadataSaysAdmin(user: User) {
  const userMeta = (user.user_metadata || {}) as Record<string, unknown>;
  const appMeta = (user.app_metadata || {}) as Record<string, unknown>;

  const userRole = String(userMeta.role || "").toLowerCase();
  const appRole = String(appMeta.role || "").toLowerCase();
  const userIsAdmin = userMeta.is_admin === true;
  const appIsAdmin = appMeta.is_admin === true;

  return userRole === "admin" || appRole === "admin" || userIsAdmin || appIsAdmin;
}

export async function isAdminUser(user: User | null) {
  if (!user) return false;

  if (metadataSaysAdmin(user)) return true;

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  if (error || !data) return false;

  const profile = data as Record<string, unknown>;
  const role = String(profile.role || "").toLowerCase();
  const isAdmin = profile.is_admin === true;

  return role === "admin" || isAdmin;
}
