import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const processedRef = useRef(false);

  useEffect(() => {
    // Synchronous double-fire guard (StrictMode + React 18 safe via useRef + sessionStorage)
    if (processedRef.current) return;
    processedRef.current = true;

    const hash = window.location.hash || "";
    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const sessionId = params.get("session_id");

    // Clear hash from URL IMMEDIATELY so a re-render of AppRouter does not re-mount AuthCallback
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }

    if (!sessionId) {
      navigate("/", { replace: true });
      return;
    }

    // sessionStorage guard so even across mounts the same session_id is not POSTed twice
    const alreadyProcessed = sessionStorage.getItem("sb_oauth_processed");
    if (alreadyProcessed === sessionId) {
      // Already exchanged — verify session and redirect
      (async () => {
        try {
          const { data: me } = await api.get("/auth/me");
          setUser(me);
          navigate(me.onboarded ? "/dashboard" : "/onboarding", { replace: true });
        } catch {
          navigate("/", { replace: true });
        }
      })();
      return;
    }
    sessionStorage.setItem("sb_oauth_processed", sessionId);

    (async () => {
      try {
        const { data } = await api.post("/auth/google/session", { session_id: sessionId });
        if (data.session_token) localStorage.setItem("sb_session_token", data.session_token);
        setUser(data.user);
        navigate(data.user?.onboarded ? "/dashboard" : "/onboarding", {
          replace: true,
          state: { user: data.user },
        });
      } catch (e) {
        // Fallback: maybe cookie was already set (double-fire / retry). Check /auth/me.
        try {
          const { data: me } = await api.get("/auth/me");
          setUser(me);
          navigate(me.onboarded ? "/dashboard" : "/onboarding", { replace: true });
        } catch {
          sessionStorage.removeItem("sb_oauth_processed");
          navigate("/", { replace: true });
        }
      }
    })();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg dark:bg-bg-dark">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="font-display text-lg">Signing you in…</p>
      </div>
    </div>
  );
}
