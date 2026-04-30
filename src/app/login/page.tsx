"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { sanitizeNextPath } from "@/lib/auth/next-path";
import { readBookingDraft } from "@/lib/bookings/draft";
import { supabase } from "@/lib/supabase/client";
import type { AppRole } from "@/lib/auth/roles";
import { getDefaultDashboardForRole, normalizeRole } from "@/lib/auth/roles";
import styles from "./login.module.css";

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
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
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
    const resumePath =
      nextPath ||
      (readBookingDraft() ? "/services?resumeBooking=1" : null) ||
      getDefaultDashboardForRole(role);

    if (role === "customer") {
      const response = await fetch('/api/profile');
      const payload = await response.json();

      if (!response.ok) {
        console.error("[login] Failed to resolve profile completeness:", payload?.error);
        return resumePath;
      }

      const isComplete = Boolean(payload?.data?.completionState?.isComplete);

      if (!isComplete) {
        return `/portal/profile/complete?next=${encodeURIComponent(resumePath)}`;
      }
    }

    return resumePath;
  };

  useEffect(() => {
    let isMounted = true

    const syncExistingSession = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        return
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle()

      if (error) {
        console.error("[login] Failed to resolve existing session role:", error)
        if (isMounted) {
          setAuthMessage("We found your session, but your role could not be verified.")
        }
        return
      }

      const role = normalizeRole(data?.role)

      if (!role) {
        if (isMounted) {
          setAuthMessage(
            "Your account is signed in, but no supported role is assigned yet. Please contact Only Bangers support."
          )
        }
        return
      }

      const appRole: AppRole = role
      router.replace(await getPostLoginPath(appRole))
    }

    const errorCode = searchParams.get("error")
    const message = getFriendlyErrorMessage(errorCode)

    if (message) {
      setAuthMessage(message)
    }

    syncExistingSession()

    return () => {
      isMounted = false
    }
  }, [router, searchParams])

  const signInWithGoogle = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: getCallbackUrl() },
    });
    setLoading(false);
  };

  const signInWithFacebook = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: { redirectTo: getCallbackUrl() },
    });
    setLoading(false);
  };

  const sendMagicLink = async () => {
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: getCallbackUrl() },
    });

    if (error) {
      setAuthMessage("We could not send the magic link. Please try again.")
      setSent(false)
      setLoading(false);
      return
    }

    setSent(true);
    setAuthMessage("")
    setLoading(false);
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <h1 className={styles.loginTitle}>Only Bangers Sign In</h1>
        <p className={styles.loginSubtitle}>Access your account, bookings, and role-based dashboard.</p>

        {authMessage ? (
          <div className={styles.successMessage} role="alert">
            <p className={styles.successText}>{authMessage}</p>
          </div>
        ) : null}

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
            Sign in with Google
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
            Sign in with Facebook
          </button>
        </div>

        <div className={styles.divider}>
          <span>Or</span>
        </div>

        <div className={styles.magicLinkSection}>
          <label htmlFor="email" className={styles.magicLinkLabel}>Email Address</label>
          <input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMagicLink()}
            aria-label="Email address"
            className={styles.emailInput}
          />
          <button 
            onClick={sendMagicLink} 
            disabled={loading || !email}
            aria-label="Send magic link"
            className={styles.magicLinkButton}
          >
            {loading ? "Sending..." : "Send Magic Link"}
          </button>
          {sent && (
            <div className={styles.successMessage}>
              <p className={styles.successText}>
                Magic link sent. Check your inbox and click the link to finish signing in.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className={styles.loginContainer} />}>
      <LoginPageContent />
    </Suspense>
  );
}
