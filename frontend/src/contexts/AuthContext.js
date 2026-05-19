import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";

const AuthContext = createContext(null);

// Hardcoded demo user — no auth required, dashboard accessible immediately
const DEMO_USER = {
  user_id: "user_demo_0a98eee6",
  email: "demo.aarav@studybuddy.ai",
  name: "Aarav Sharma",
  picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav&backgroundColor=ffd6d6",
  class_grade: "10",
  board: "CBSE",
  subjects: ["Math", "Science", "English", "Social Science"],
  language: "English",
  exam_goal: "Score 95%+",
  xp: 1240,
  streak: 12,
  last_active_date: new Date().toISOString().slice(0, 10),
  badges: ["Bronze Scholar", "Silver Scholar", "Week Warrior"],
  plan: "free",
  onboarded: true,
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(DEMO_USER);
  const [loading] = useState(false);

  // Best-effort: hit /auth/demo in the background so backend persists data
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.post("/auth/demo");
        if (cancelled) return;
        if (data?.session_token) localStorage.setItem("sb_session_token", data.session_token);
        if (data?.user) setUser(data.user);
      } catch {
        // ignore — DEMO_USER already loaded
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const logout = async () => {
    localStorage.removeItem("sb_session_token");
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, checkAuth: () => {}, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
