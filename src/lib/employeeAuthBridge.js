// src/lib/employeeAuthBridge.js
import { supabase } from "./supabaseClient";

/**
 * Ensure Supabase Auth session exists (needed for Storage + RLS).
 * This does NOT change your app login logic (SQL/RPC).
 *
 * Mapping rules:
 * - HR / Manager: identifier is email
 * - Admin: no email in UI → uses fixed internal email
 * - Employee: uses employee officialEmail if available, else fallback internal pattern
 */
export async function ensureAdminSupabaseSession({
  role,
  identifier,
  password,
  adminId = null, // optional, kept for future
  preferredEmail = undefined,
}) {
  // If already logged in to Supabase Auth, return it
  const { data: sess, error: sessErr } = await supabase.auth.getSession();
  if (sessErr) throw sessErr;
  if (sess?.session?.user) return sess.session.user;

  const r = String(role || "").trim().toLowerCase();
  const id = String(identifier || "").trim();

  let email = preferredEmail ? String(preferredEmail).trim().toLowerCase() : "";

  // Role → email mapping
  if (!email) {
    if (r === "hr" || r === "manager") {
      email = id.toLowerCase(); // they login by email
    } else if (r === "admin") {
      // admin has username/admin_id only, so map to internal email for Supabase Auth
      email = "admin@twite.local";
    } else if (r === "employee") {
      // employee id login, map to internal email pattern if no official email
      // (Better: store official email in employee table and pass it as preferredEmail)
      const safeEmp = id.toLowerCase().replace(/\s+/g, "");
      email = `${safeEmp}@employee.twite.local`;
    }
  }

  if (!email) {
    throw new Error("Supabase Auth email mapping missing for this role.");
  }
  if (!password) {
    throw new Error("Supabase Auth password missing.");
  }

  const { data: auth, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Make error clearer for demo
    throw new Error(
      `Supabase Auth login failed for ${r} (${email}). Create this user in Supabase Auth OR use correct password. Details: ${error.message}`
    );
  }

  return auth.user;
}

/**
 * Backward/forward compatible helper used by Document pages.
 * - If a Supabase Auth session already exists, returns the user.
 * - If no session and a `password` is provided, falls back to `ensureAdminSupabaseSession`.
 * - Otherwise returns null (caller can show "please login").
 */
export async function ensureRoleAuthSession({ role, identifier, password, preferredEmail } = {}) {
  const { data: sess, error: sessErr } = await supabase.auth.getSession();
  if (sessErr) throw sessErr;
  if (sess?.session?.user) return sess.session.user;

  if (!password) return null;

  return ensureAdminSupabaseSession({
    role,
    identifier,
    password,
    preferredEmail,
  });
}
