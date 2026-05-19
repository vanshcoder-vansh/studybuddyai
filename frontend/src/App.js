import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";

import Landing from "./pages/Landing";
import AuthCallback from "./pages/AuthCallback";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import DoubtSolver from "./pages/DoubtSolver";
import HomeworkScanner from "./pages/HomeworkScanner";
import Notes from "./pages/Notes";
import TestGenerator from "./pages/TestGenerator";
import Planner from "./pages/Planner";
import Profile from "./pages/Profile";
import FormulaHub from "./pages/FormulaHub";
import Pomodoro from "./pages/Pomodoro";
import More from "./pages/More";
import AppShell from "./components/AppShell";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/" replace />;
  if (!user.onboarded) return <Navigate to="/onboarding" replace />;
  return <AppShell>{children}</AppShell>;
}

function OnboardingRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/" replace />;
  if (user.onboarded) return <Navigate to="/dashboard" replace />;
  return children;
}

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg dark:bg-bg-dark">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-ink-muted dark:text-slate-400">Loading StudyBuddy…</p>
      </div>
    </div>
  );
}

function AppRouter() {
  const location = useLocation();
  // Synchronously detect session_id in hash so OAuth callback handles it BEFORE protected routes run
  if (location.hash?.includes("session_id=")) return <AuthCallback />;
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/onboarding" element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/doubt" element={<ProtectedRoute><DoubtSolver /></ProtectedRoute>} />
      <Route path="/scan" element={<ProtectedRoute><HomeworkScanner /></ProtectedRoute>} />
      <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
      <Route path="/tests" element={<ProtectedRoute><TestGenerator /></ProtectedRoute>} />
      <Route path="/planner" element={<ProtectedRoute><Planner /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/formulas" element={<ProtectedRoute><FormulaHub /></ProtectedRoute>} />
      <Route path="/focus" element={<ProtectedRoute><Pomodoro /></ProtectedRoute>} />
      <Route path="/more" element={<ProtectedRoute><More /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRouter />
          <Toaster position="top-center" richColors closeButton theme="system" />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
