// src/pages/auth/Login.jsx
import { useMemo, useRef, useState, useEffect, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  User,
  IdCard,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";

import { supabase, isSupabaseConfigured } from "../../lib/supabaseClient";
import { MANAGER_SESSION_KEY } from "../manager/managerData";

/* ---------------- Field ---------------- */
const Field = forwardRef(
  (
    { icon: Icon, type = "text", placeholder, right, autoComplete, required },
    ref
  ) => {
    return (
      <div className="flex items-center gap-3 border-b border-gray-300 pb-2 focus-within:border-purple-600 transition">
        <span className="text-purple-600 pointer-events-none">
          <Icon size={18} />
        </span>

        <input
          ref={ref}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className="flex-1 min-w-0 w-full bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400"
        />

        {right}
      </div>
    );
  }
);
Field.displayName = "Field";

/* ---------------- Login ---------------- */
export default function Login() {
  const navigate = useNavigate();

  const [role, setRole] = useState("hr"); // "hr" | "admin" | "employee" | "manager"
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // refs (uncontrolled inputs)
  const hrEmailRef = useRef(null);
  const hrPassRef = useRef(null);

  const managerEmailRef = useRef(null);
  const managerPassRef = useRef(null);

  const adminUserRef = useRef(null);
  const adminIdRef = useRef(null);
  const adminPassRef = useRef(null);

  const empIdRef = useRef(null);
  const empPassRef = useRef(null);

  const roleTitle = useMemo(() => {
    if (role === "admin") return "Admin Login";
    if (role === "manager") return "Manager Login";
    if (role === "employee") return "Employee Login";
    return "HR Login";
  }, [role]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (role === "hr") hrEmailRef.current?.focus();
      if (role === "manager") managerEmailRef.current?.focus();
      if (role === "admin") adminUserRef.current?.focus();
      if (role === "employee") empIdRef.current?.focus();
    }, 0);
    return () => clearTimeout(t);
  }, [role]);

  const clearAllInputs = () => {
    setErr("");

    if (hrEmailRef.current) hrEmailRef.current.value = "";
    if (hrPassRef.current) hrPassRef.current.value = "";

    if (managerEmailRef.current) managerEmailRef.current.value = "";
    if (managerPassRef.current) managerPassRef.current.value = "";

    if (adminUserRef.current) adminUserRef.current.value = "";
    if (adminIdRef.current) adminIdRef.current.value = "";
    if (adminPassRef.current) adminPassRef.current.value = "";

    if (empIdRef.current) empIdRef.current.value = "";
    if (empPassRef.current) empPassRef.current.value = "";
  };

  const resetFields = (nextRole) => {
    setRole(nextRole);
    setShowPassword(false);
    clearAllInputs();
  };

  const roleRedirects = {
    hr: "/hr-dashboard",
    manager: "/manager-dashboard",
    admin: "/dashboard",
    employee: "/employee-dashboard",
  };

  const MANAGER_COMPLETION_KEY = "hrmss.signin.completed.manager";

  // ✅ completion keys for all roles (used by Sign-In + Guard)
  const COMPLETION_KEY = (r) => `hrmss.signin.completed.${r}`;
  const isCompleted = (r) => localStorage.getItem(COMPLETION_KEY(r)) === "true";

  /* ---------- Local manager fallback (optional) ---------- */
  const resolveLocalManagerLogin = (email, password) => {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedPassword = String(password || "").trim();

    const localAccounts = [
      {
        email: "arun.murugappa@twite.ai",
        password: "Twite@arun",
        session: {
          id: "MGR-ARUN",
          name: "Arun Murugappa",
          email: "arun.murugappa@twite.ai",
          access: "approver",
          team: "Approvals",
        },
        route: "/manager-approver-dashboard",
      },
      {
        email: "sunil.reddy@twite.ai",
        password: "Twite@sunil",
        session: {
          id: "MGR-SUNIL",
          name: "Sunil Reddy",
          email: "sunil.reddy@twite.ai",
          access: "viewer",
          team: "Operations",
        },
        route: "/manager-dashboard",
      },
    ];

    const match = localAccounts.find(
      (acct) =>
        acct.email.toLowerCase() === normalizedEmail &&
        acct.password === normalizedPassword
    );
    return match || null;
  };

  /* ---------- Sign-in helper (profile setup flow) ---------- */
  const goToSignIn = (nextRole, extraState = {}) => {
    localStorage.setItem("hrmss.lastRole", nextRole);

    // ✅ redirectTo must be dashboard (finish panna than dashboard varanum)
    const redirectTo = extraState?.redirectTo || roleRedirects[nextRole] || "/login";

    navigate("/sign-in", {
      state: { role: nextRole, redirectTo, ...extraState },
    });
  };

  /* ---------------- RPC HELPERS ---------------- */

  // ✅ HR/Admin login RPC (JSON)
  const rpcVerifyApp = async ({
    p_role,
    p_identifier,
    p_admin_id = null,
    p_secret,
  }) => {
    if (!isSupabaseConfigured) {
      throw new Error(
        "Supabase env missing. Check VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY"
      );
    }

    const { data, error } = await supabase.rpc("verify_login_json", {
      p_role,
      p_identifier,
      p_admin_id,
      p_secret,
    });

    if (error) throw new Error(error.message || "Login failed");
    if (!data) throw new Error("Invalid credentials");
    return data;
  };

  // ✅ Manager login RPC (JSON)
  const rpcManagerLogin = async ({ p_email, p_password }) => {
    if (!isSupabaseConfigured) {
      throw new Error(
        "Supabase env missing. Check VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY"
      );
    }

    const { data, error } = await supabase.rpc("manager_login_js", {
      p_email,
      p_password,
    });

    if (error) throw new Error(error.message || "Manager login failed");
    if (!data) throw new Error("Invalid credentials");
    return data;
  };

  // ✅ EMPLOYEE login RPC (ONLY admin-created id/password works)
  const rpcEmployeeLogin = async ({ p_employee_id, p_password }) => {
    if (!isSupabaseConfigured) {
      throw new Error("Supabase env missing. Employee login cannot be verified.");
    }

    const { data, error } = await supabase.rpc("employee_login_js", {
      p_employee_id,
      p_password,
    });

    if (error) throw new Error(error.message || "Employee login failed");
    if (!data) throw new Error("Invalid Employee ID / Password");

    if (data?.ok === false) {
      throw new Error(data?.error || "Invalid Employee ID / Password");
    }

    if (data?.ok === true && data?.employee) {
      return data.employee;
    }

    return data;
  };

  // ✅ EMPLOYEE: check profile COMPLETED (must be profile_completed=true)
  const employeeProfileExists = async (employeeId) => {
    const emp = String(employeeId || "").trim();
    if (!emp) return false;

    const { data, error } = await supabase
      .from("hrmss_employee_profiles")
      .select("employee_id, profile_completed")
      .eq("employee_id", emp)
      .maybeSingle();

    if (error) throw error;

    // only completed can go dashboard
    return !!data && data.profile_completed === true;
  };

  // ✅ Check HR/Admin/Manager profile exists in hrmss_profiles
  const appProfileExists = async (userId) => {
    const uid = String(userId || "").trim();
    if (!uid) return false;

    const { data, error } = await supabase
      .from("hrmss_profiles")
      .select("user_id")
      .eq("user_id", uid)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  };

  /* ---------------- SUBMIT (LOGIN) ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    const hrEmail = hrEmailRef.current?.value?.trim() || "";
    const hrPassword = hrPassRef.current?.value?.trim() || "";

    const managerEmail = managerEmailRef.current?.value?.trim() || "";
    const managerPassword = managerPassRef.current?.value?.trim() || "";

    const adminUsername = adminUserRef.current?.value?.trim() || "";
    const adminId = adminIdRef.current?.value?.trim() || "";
    const adminPassword = adminPassRef.current?.value?.trim() || "";

    const empId = empIdRef.current?.value?.trim() || "";
    const empPassword = empPassRef.current?.value?.trim() || "";

    try {
      setLoading(true);

      // HR
      if (role === "hr") {
        if (!hrEmail || !hrPassword) {
          setErr("Enter email and password");
          return;
        }

        const session = await rpcVerifyApp({
          p_role: "hr",
          p_identifier: hrEmail,
          p_admin_id: null,
          p_secret: hrPassword,
        });

        localStorage.setItem(
          "HRMSS_AUTH_SESSION",
          JSON.stringify({ ...session, loginRole: "hr" })
        );

        const userId = session?.user_id || session?.id || session?.userId || null;
        const completed =
          isCompleted("hr") || (userId ? await appProfileExists(userId) : false);

        if (!completed) {
          navigate("/sign-in", {
            replace: true,
            state: { role: "hr", redirectTo: roleRedirects.hr },
          });
          return;
        }

        navigate(roleRedirects.hr, { replace: true });
        return;
      }

      // MANAGER
      if (role === "manager") {
        if (!managerEmail || !managerPassword) {
          setErr("Enter email and password");
          return;
        }

        const localLogin = resolveLocalManagerLogin(managerEmail, managerPassword);
        if (localLogin) {
          localStorage.setItem(MANAGER_SESSION_KEY, JSON.stringify(localLogin.session));
          localStorage.setItem(
            "HRMSS_AUTH_SESSION",
            JSON.stringify({
              ...localLogin.session,
              loginRole: "manager",
              role: "manager",
            })
          );

          if (!localStorage.getItem(MANAGER_COMPLETION_KEY)) {
            localStorage.setItem(MANAGER_COMPLETION_KEY, "false");
          }

          const redirectTo = localLogin.route;

          const completed =
            localStorage.getItem(MANAGER_COMPLETION_KEY) === "true" ||
            isCompleted("manager") ||
            (localLogin.session?.id
              ? await appProfileExists(localLogin.session.id)
              : false);

          if (!completed) {
            navigate("/sign-in", {
              replace: true,
              state: { role: "manager", access: localLogin.session.access, redirectTo },
            });
            return;
          }

          navigate(redirectTo, { replace: true });
          return;
        }

        const m = await rpcManagerLogin({
          p_email: managerEmail,
          p_password: managerPassword,
        });

        const access = String(m.access || "viewer").toLowerCase();
        const route =
          access === "approver" ? "/manager-approver-dashboard" : "/manager-dashboard";

        const managerSession = {
          id: m.manager_code || m.id || "MGR",
          name: m.full_name || "Manager",
          email: m.email,
          access,
          team: m.team || "—",
        };

        localStorage.setItem(MANAGER_SESSION_KEY, JSON.stringify(managerSession));
        localStorage.setItem(
          "HRMSS_AUTH_SESSION",
          JSON.stringify({ ...managerSession, loginRole: "manager", role: "manager" })
        );

        if (!localStorage.getItem(MANAGER_COMPLETION_KEY)) {
          localStorage.setItem(MANAGER_COMPLETION_KEY, "false");
        }

        const completed =
          localStorage.getItem(MANAGER_COMPLETION_KEY) === "true" ||
          isCompleted("manager") ||
          (managerSession?.id ? await appProfileExists(managerSession.id) : false);

        if (!completed) {
          navigate("/sign-in", {
            replace: true,
            state: { role: "manager", access, redirectTo: route },
          });
          return;
        }

        navigate(route, { replace: true });
        return;
      }

      // ADMIN
      if (role === "admin") {
        if (!adminUsername || !adminId || !adminPassword) {
          setErr("Enter username, admin id and password");
          return;
        }

        const session = await rpcVerifyApp({
          p_role: "admin",
          p_identifier: adminUsername,
          p_admin_id: adminId,
          p_secret: adminPassword,
        });

        localStorage.setItem(
          "HRMSS_AUTH_SESSION",
          JSON.stringify({ ...session, loginRole: "admin" })
        );

        const userId = session?.user_id || session?.id || session?.userId || null;
        const completed =
  localStorage.getItem(COMPLETION_KEY("admin")) === "true";


        if (!completed) {
  navigate("/sign-in", {
    replace: true,
    state: { role: "admin", redirectTo: roleRedirects.admin },
  });
  return;
}

navigate(roleRedirects.admin, { replace: true });
return;
      }

      // ✅ EMPLOYEE
      if (role === "employee") {
        if (!empId || !empPassword) {
          setErr("Enter employee id and password");
          return;
        }

        const emp = await rpcEmployeeLogin({
          p_employee_id: empId,
          p_password: empPassword,
        });

        const employeeId = String(emp.employee_id || empId).trim();

        // store auth cache
        localStorage.setItem(
          "HRMSS_AUTH_SESSION",
          JSON.stringify({
            id: employeeId,
            identifier: employeeId,
            loginRole: "employee",
            role: "employee",
            employee_id: employeeId,
          })
        );

        // ✅ IMPORTANT: completed only if profile_completed=true
        const completed = await employeeProfileExists(employeeId);

        // ✅ sync localStorage completion
        localStorage.setItem(COMPLETION_KEY("employee"), completed ? "true" : "false");

        if (!completed) {
          localStorage.setItem("hrmss.lastRole", "employee");
          navigate("/sign-in", {
            replace: true,
            state: { role: "employee", empId: employeeId, redirectTo: "/employee-dashboard" },
          });
          return;
        }

        navigate(roleRedirects.employee, { replace: true });
        return;
      }
    } catch (ex) {
      setErr(ex?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- SIGN IN (PROFILE SETUP) ---------------- */
  const handleGoToSignIn = async () => {
    setErr("");

    const hrEmail = hrEmailRef.current?.value?.trim() || "";
    const hrPassword = hrPassRef.current?.value?.trim() || "";

    const managerEmail = managerEmailRef.current?.value?.trim() || "";
    const managerPassword = managerPassRef.current?.value?.trim() || "";

    const adminUsername = adminUserRef.current?.value?.trim() || "";
    const adminId = adminIdRef.current?.value?.trim() || "";
    const adminPassword = adminPassRef.current?.value?.trim() || "";

    const empId = empIdRef.current?.value?.trim() || "";
    const empPassword = empPassRef.current?.value?.trim() || "";

    try {
      setLoading(true);

      if (role === "hr") {
        if (!hrEmail || !hrPassword) {
          setErr("Enter email and password");
          return;
        }
        const session = await rpcVerifyApp({
          p_role: "hr",
          p_identifier: hrEmail,
          p_admin_id: null,
          p_secret: hrPassword,
        });
        localStorage.setItem(
          "HRMSS_AUTH_SESSION",
          JSON.stringify({ ...session, loginRole: "hr" })
        );
        goToSignIn("hr", { redirectTo: roleRedirects.hr });
        return;
      }

      if (role === "manager") {
        if (!managerEmail || !managerPassword) {
          setErr("Enter email and password");
          return;
        }

        const m = await rpcManagerLogin({
          p_email: managerEmail,
          p_password: managerPassword,
        });

        const access = String(m.access || "viewer").toLowerCase();
        const route =
          access === "approver" ? "/manager-approver-dashboard" : "/manager-dashboard";

        const managerSession = {
          id: m.manager_code || m.id || "MGR",
          name: m.full_name || "Manager",
          email: m.email,
          access,
          team: m.team || "—",
        };

        localStorage.setItem(MANAGER_SESSION_KEY, JSON.stringify(managerSession));
        localStorage.setItem(
          "HRMSS_AUTH_SESSION",
          JSON.stringify({ ...managerSession, loginRole: "manager", role: "manager" })
        );

        goToSignIn("manager", { access, redirectTo: route });
        return;
      }

      if (role === "admin") {
        if (!adminUsername || !adminId || !adminPassword) {
          setErr("Enter username, admin id and password");
          return;
        }
        const session = await rpcVerifyApp({
          p_role: "admin",
          p_identifier: adminUsername,
          p_admin_id: adminId,
          p_secret: adminPassword,
        });
        localStorage.setItem(
          "HRMSS_AUTH_SESSION",
          JSON.stringify({ ...session, loginRole: "admin" })
        );
        goToSignIn("admin", { redirectTo: roleRedirects.admin });
        return;
      }

      // ✅ EMPLOYEE sign-in button
      if (role === "employee") {
        if (!empId || !empPassword) {
          setErr("Enter employee id and password");
          return;
        }

        const emp = await rpcEmployeeLogin({
          p_employee_id: empId,
          p_password: empPassword,
        });

        const employeeId = String(emp.employee_id || empId).trim();

        localStorage.setItem(
          "HRMSS_AUTH_SESSION",
          JSON.stringify({
            id: employeeId,
            identifier: employeeId,
            loginRole: "employee",
            role: "employee",
            employee_id: employeeId,
          })
        );

        const completed = await employeeProfileExists(employeeId);
        localStorage.setItem(COMPLETION_KEY("employee"), completed ? "true" : "false");

        if (!completed) {
          localStorage.setItem("hrmss.lastRole", "employee");
          navigate("/sign-in", {
            replace: true,
            state: { role: "employee", empId: employeeId, redirectTo: "/employee-dashboard" },
          });
          return;
        }

        navigate(roleRedirects.employee, { replace: true });
        return;
      }
    } catch (ex) {
      setErr(ex?.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const RoleTab = ({ value, label }) => {
    const active = role === value;
    return (
      <button
        type="button"
        onClick={() => resetFields(value)}
        className={`text-sm font-semibold pb-2 transition ${
          active
            ? "text-purple-700 border-b-2 border-purple-700"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        {label}
      </button>
    );
  };

  const rightImageUrl =
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1400&q=60";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#6D28D9] p-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* LEFT */}
          <div className="p-8 md:p-10">
            <div className="max-w-md">
              <h1 className="text-3xl font-extrabold text-gray-900">Login</h1>
              <div className="mt-2 h-1 w-10 rounded bg-purple-700" />

              <div className="mt-6 flex items-center gap-6 flex-wrap">
                <RoleTab value="admin" label="Admin" />
                <RoleTab value="hr" label="HR" />
                <RoleTab value="manager" label="Manager" />
                <RoleTab value="employee" label="Employee" />
              </div>

              <div className="mt-2 text-xs text-gray-500">{roleTitle}</div>

              {err && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm flex gap-2">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                  <div className="min-w-0">{err}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                {/* HR */}
                {role === "hr" && (
                  <>
                    <Field
                      ref={hrEmailRef}
                      icon={Mail}
                      type="email"
                      placeholder="Enter your email"
                      autoComplete="email"
                      required
                    />
                    <Field
                      ref={hrPassRef}
                      icon={Lock}
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                      right={
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setShowPassword((s) => !s);
                            setTimeout(() => hrPassRef.current?.focus(), 0);
                          }}
                          className="shrink-0 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      }
                    />
                  </>
                )}

                {/* MANAGER */}
                {role === "manager" && (
                  <>
                    <Field
                      ref={managerEmailRef}
                      icon={Mail}
                      type="email"
                      placeholder="Enter manager email"
                      autoComplete="email"
                      required
                    />
                    <Field
                      ref={managerPassRef}
                      icon={Lock}
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter manager password"
                      autoComplete="current-password"
                      required
                      right={
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setShowPassword((s) => !s);
                            setTimeout(() => managerPassRef.current?.focus(), 0);
                          }}
                          className="shrink-0 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      }
                    />
                  </>
                )}

                {/* ADMIN */}
                {role === "admin" && (
                  <>
                    <Field
                      ref={adminUserRef}
                      icon={User}
                      type="text"
                      placeholder="Enter your user name"
                      autoComplete="username"
                      required
                    />
                    <Field
                      ref={adminIdRef}
                      icon={IdCard}
                      type="text"
                      placeholder="Enter your admin id"
                      autoComplete="off"
                      required
                    />
                    <Field
                      ref={adminPassRef}
                      icon={Lock}
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter admin password"
                      autoComplete="current-password"
                      required
                      right={
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setShowPassword((s) => !s);
                            setTimeout(() => adminPassRef.current?.focus(), 0);
                          }}
                          className="shrink-0 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      }
                    />
                  </>
                )}

                {/* EMPLOYEE */}
                {role === "employee" && (
                  <>
                    <Field
                      ref={empIdRef}
                      icon={IdCard}
                      type="text"
                      placeholder="Enter your employee id"
                      autoComplete="off"
                      required
                    />
                    <Field
                      ref={empPassRef}
                      icon={Lock}
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                      right={
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setShowPassword((s) => !s);
                            setTimeout(() => empPassRef.current?.focus(), 0);
                          }}
                          className="shrink-0 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      }
                    />
                  </>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 rounded-md text-white font-semibold transition shadow-md ${
                    loading
                      ? "bg-purple-400 cursor-not-allowed"
                      : "bg-purple-700 hover:bg-purple-800"
                  }`}
                >
                  {loading ? "Logging in..." : "Login"}
                </button>

                <button
                  type="button"
                  onClick={handleGoToSignIn}
                  disabled={loading}
                  className={`w-full py-3 rounded-md font-semibold transition shadow-md border ${
                    loading
                      ? "border-purple-300 text-purple-300 cursor-not-allowed"
                      : "border-purple-700 text-purple-700 hover:bg-purple-50"
                  }`}
                >
                  {loading ? "Please wait..." : "Sign In"}
                </button>

                {!isSupabaseConfigured && (
                  <div className="text-center text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    Supabase env missing. Add <b>VITE_SUPABASE_URL</b> and{" "}
                    <b>VITE_SUPABASE_ANON_KEY</b> in .env
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* RIGHT */}
          <div className="relative hidden md:block">
            <div
              className="absolute inset-0 bg-center bg-cover"
              style={{ backgroundImage: `url(${rightImageUrl})` }}
            />
            <div className="absolute inset-0 bg-purple-800/70" />
            <div className="relative h-full flex items-center justify-center p-10 text-center">
              <div className="text-white">
                <div className="text-3xl font-extrabold leading-snug">
                  HUMAN RESOURCE <br /> MANAGEMENT SYSTEM
                </div>
              </div>
            </div>
          </div>

          {/* MOBILE */}
          <div className="md:hidden bg-purple-800 text-white px-8 py-8 text-center">
            <div className="text-xl font-bold">Welcome</div>
            <div className="text-white/80 text-sm mt-1">Role based login</div>
          </div>
        </div>
      </div>
    </div>
  );
}
