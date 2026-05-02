"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { sanitizeNextPath } from "@/lib/auth/next-path";
import { readBookingDraft } from "@/lib/bookings/draft";
import { supabase } from "@/lib/supabase/client";
import type { AppRole } from "@/lib/auth/roles";
import { getDefaultDashboardForRole, normalizeRole } from "@/lib/auth/roles";
import styles from "./login.module.css";

type AuthMode = "login" | "create";

function getFriendlyErrorMessage(errorCode: string | null) {
  switch (errorCode) {
    case "missing-role":
      return "Your account is authenticated, but no supported role is assigned yet. Please contact Only Bangers support."
    case "role-lookup-failed":
      return "We could not verify your role right now. Please try again."
    case "auth-failed":
    case "session-missing":
    case "missing-code":
      return "We could not complete sign-in. Please try again."
    default:
      return ""
  }
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const nextPath = sanitizeNextPath(searchParams.get("next"));

  const getCallbackUrl = () => {
    const url = new URL("/auth/callback", window.location.origin);

    if (nextPath) {
      url.searchParams.set("next", nextPath);
    }

    return url.toString();
  };

  const getPostLoginPath = async (role: AppRole) => {
    const defaultDashboard = getDefaultDashboardForRole(role)
    const resumePath =
      role === "customer"
        ? nextPath ||
          (readBookingDraft() ? "/services?resumeBooking=1" : null) ||
          defaultDashboard
        : defaultDashboard

    const response = await fetch("/api/profile");
    const payload = await response.json();

    if (!response.ok) {
      console.error("[login] Failed to resolve profile completeness:", payload?.error);
      return resumePath;
    }

    const isComplete = Boolean(payload?.data?.completionState?.isComplete);

    if (!isComplete) {
      return `/portal/profile/complete?next=${encodeURIComponent(resumePath)}&setup=1`;
    }

    return resumePath;
  };

  useEffect(() => {
    let isMounted = true;

    const syncExistingSession = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("[login] Failed to resolve existing session role:", error);
        if (isMounted) {
          setAuthMessage("We found your session, but your role could not be verified.");
        }
        return;
      }

      const role = normalizeRole(data?.role);

      if (!role) {
        if (isMounted) {
          setAuthMessage(
            "Your account is signed in, but no supported role is assigned yet. Please contact Only Bangers support."
          );
        }
        return;
      }

      router.replace(await getPostLoginPath(role));
    };

    const errorCode = searchParams.get("error");
    const message = getFriendlyErrorMessage(errorCode);

    if (message) {
      setAuthMessage(message);
    }

    syncExistingSession();

    return () => {
      isMounted = false;
    };
  }, [router, searchParams]);

  const resetFeedback = () => {
    setAuthMessage("");
    setSuccessMessage("");
  };

  const signInWithGoogle = async () => {
    resetFeedback();
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: getCallbackUrl() },
    });
    setLoading(false);
  };

  const signInWithFacebook = async () => {
    resetFeedback();
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: { redirectTo: getCallbackUrl() },
    });
    setLoading(false);
  };

  const signInWithPassword = async () => {
    if (!email || !password) {
      setAuthMessage("Enter your email address and password to continue.");
      return;
    }

    resetFeedback();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthMessage(error.message || "We could not sign you in. Please check your details.");
      setLoading(false);
      return;
    }

    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      setAuthMessage("We could not finish sign-in. Please try again.");
      setLoading(false);
      return;
    }

    const roleResponse = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .maybeSingle();

    const role = normalizeRole(roleResponse.data?.role);

    if (!role) {
      setAuthMessage("Your account is signed in, but no supported role is assigned yet.");
      setLoading(false);
      return;
    }

    const destination = await getPostLoginPath(role);
    setLoading(false);
    router.replace(destination);
    router.refresh();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await signInWithPassword();
  };

  return (
    <div className="page-background">
      <div className={styles.loginShell}>
        <div className={styles.loginCard}>
          <div className={styles.heroBlock}>
            <p className={styles.eyebrow}>Only Bangers Access</p>
            <h1 className={styles.loginTitle}>
              {mode === "create" ? "Create your account" : "Sign in"}
            </h1>
            <p className={styles.loginSubtitle}>
              {mode === "create"
                ? "Use Google or Facebook to create your account. Email and password is only for logging in."
                : "Use your email and password to get back to your role-based dashboard and active bookings."}
            </p>
          </div>

          <div className={styles.modeBar} role="tablist" aria-label="Authentication options">
            <button
              type="button"
              className={styles.modeButton}
              data-active={mode === "login"}
              onClick={() => {
                setMode("login");
                resetFeedback();
              }}
            >
              Login
            </button>
            <button
              type="button"
              className={styles.modeButton}
              data-active={mode === "create"}
              onClick={() => {
                setMode("create");
                resetFeedback();
              }}
            >
              Create account
            </button>
          </div>

          {authMessage ? (
            <div className={styles.errorMessage} role="alert">
              <p>{authMessage}</p>
            </div>
          ) : null}

          {successMessage ? (
            <div className={styles.successMessage} role="status">
              <p>{successMessage}</p>
            </div>
          ) : null}

          {mode === "login" ? (
            <form className={styles.formStack} onSubmit={handleSubmit}>
              <label className={styles.field}>
                <span>Email</span>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={styles.input}
                  required
                />
              </label>

              <label className={styles.field}>
                <span>Password</span>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={styles.input}
                  required
                />
              </label>

              <div className={styles.actionRow}>
                <button type="submit" disabled={loading} className={styles.primaryButton}>
                  {loading ? "Logging in..." : "Login"}
                </button>
              </div>
            </form>
          ) : (
            <div className={styles.createAccountPanel}>
              <p className={styles.createAccountText}>
                Use Google or Facebook to create your account. Once you sign in for the first time,
                Only Bangers will create your default customer role and profile automatically.
              </p>
            </div>
          )}

          <div className={styles.divider}>
            <span>{mode === "create" ? "Create with" : "Or continue with"}</span>
          </div>

          <div className={styles.oauthSection}>
            <button
              onClick={signInWithGoogle}
              disabled={loading}
              aria-label="Sign in with Google"
              className={styles.oauthButton}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {mode === "create" ? "Create with Google" : "Continue with Google"}
            </button>
            <button
              onClick={signInWithFacebook}
              disabled={loading}
              aria-label="Sign in with Facebook"
              className={styles.oauthButton}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              {mode === "create" ? "Create with Facebook" : "Continue with Facebook"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="page-background" />}>
      <LoginPageContent />
    </Suspense>
  );
}
