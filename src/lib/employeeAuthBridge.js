// src/lib/employeeAuthBridge.js
import { supabase } from "./supabaseClient";

/**
 * Ensure Supabase Auth session exists (needed for Storage + RLS).
 * This does NOT change your app login logic (SQL/RPC).
 *
 * Mapping rules:
 * - HR / Manager: identifier is email (usually)
 * - Admin: no email in UI → uses fixed internal email
 * - Employee: if preferredEmail / identifier is an email, use it
 *            else fallback internal pattern using employee id
 */

/* ---------------------- helpers ---------------------- */
const normalizeSupabasePassword = (rawPassword) => {
  const raw = String(rawPassword ?? "");
  if (raw.length >= 6) return raw;
  // Supabase Auth requires >= 6 chars; keep deterministic for repeat logins.
  return `docs-${raw || "000000"}`;
};

// trims, lowercases, removes ALL whitespace (including newlines) inside
const normalizeEmail = (v) =>
  String(v || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");

// simple validator (enough to catch whitespace/garbage)
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const looksLikeEmail = (v) => String(v || "").includes("@");

const safeIdForEmail = (v) =>
  String(v || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^\w.\-]+/g, ""); // keep a-z0-9 _ . -

/* ---------------------- main ---------------------- */
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
  const idRaw = String(identifier || "").trim();

  // 1) start from preferredEmail if exists
  let email = preferredEmail ? normalizeEmail(preferredEmail) : "";

  // 2) if identifier itself is email (employee/hr/manager sometimes), use it
  if (!email && looksLikeEmail(idRaw)) {
    email = normalizeEmail(idRaw);
  }

  // 3) Role → email mapping fallback
  if (!email) {
    if (r === "hr" || r === "manager") {
      // typically they login by email, but if not email then fallback local
      const idMaybe = normalizeEmail(idRaw);
      email = isValidEmail(idMaybe) ? idMaybe : `${safeIdForEmail(idRaw)}@hrmss.local`;
    } else if (r === "admin") {
      // admin has username/admin_id only, so map to internal email for Supabase Auth
      email = "admin@twite.local";
    } else if (r === "employee") {
      // employee id login, map to internal email pattern if no official email
      const safeEmp = safeIdForEmail(idRaw) || "employee";
      email = `${safeEmp}@employee.twite.local`;
    } else {
      // unknown role fallback
      const safe = safeIdForEmail(idRaw) || "user";
      email = `${safe}@hrmss.local`;
    }
  }

  // ✅ final validate
  if (!email) {
    throw new Error("Supabase Auth email mapping missing for this role.");
  }
  if (!isValidEmail(email)) {
    throw new Error(`Supabase Auth email is invalid after normalize: "${email}"`);
  }
  if (!password) {
    throw new Error("Supabase Auth password missing.");
  }

  const supabasePassword = normalizeSupabasePassword(password);

  // Try login
  const { data: auth, error } = await supabase.auth.signInWithPassword({
    email,
    password: supabasePassword,
  });

  if (error) {
    const msg = String(error.message || "").toLowerCase();
    const canSignup =
      msg.includes("invalid login credentials") ||
      msg.includes("user not found") ||
      msg.includes("no user");

    if (canSignup) {
      // Create user
      const { data: signUp, error: signUpErr } = await supabase.auth.signUp({
        email,
        password: supabasePassword,
      });

      if (signUpErr) {
        throw new Error(
          `Supabase Auth sign-up failed for ${r} (${email}). Details: ${signUpErr.message}`
        );
      }

      // If session returned directly
      if (signUp?.session?.user) return signUp.session.user;

      // Else try login again
      const { data: auth2, error: auth2Err } = await supabase.auth.signInWithPassword({
        email,
        password: supabasePassword,
      });

      if (auth2Err) {
        const msg2 = String(auth2Err.message || "");
        if (msg2.toLowerCase().includes("email not confirmed")) {
          throw new Error(
            `Supabase Auth user created for ${r} (${email}) but email is not confirmed. Disable email confirmation or confirm the user in Supabase Auth.`
          );
        }
        throw new Error(
          `Supabase Auth login failed for ${r} (${email}). Details: ${auth2Err.message}`
        );
      }

      return auth2.user;
    }

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
