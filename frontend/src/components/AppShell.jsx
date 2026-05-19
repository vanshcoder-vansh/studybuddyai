import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import {
  LayoutDashboard, MessagesSquare, ScanLine, NotebookPen,
  GraduationCap, CalendarDays, Sigma, Timer, MoreHorizontal,
  Sun, Moon, LogOut, Flame, Gem,
} from "lucide-react";

const NAV = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { to: "/doubt", icon: MessagesSquare, label: "Doubts" },
  { to: "/scan", icon: ScanLine, label: "Scan" },
  { to: "/notes", icon: NotebookPen, label: "Notes" },
  { to: "/tests", icon: GraduationCap, label: "Tests" },
  { to: "/planner", icon: CalendarDays, label: "Planner" },
  { to: "/formulas", icon: Sigma, label: "Formulas" },
  { to: "/focus", icon: Timer, label: "Focus" },
];

const MOBILE_NAV = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { to: "/doubt", icon: MessagesSquare, label: "Doubts" },
  { to: "/scan", icon: ScanLine, label: "Scan" },
  { to: "/planner", icon: CalendarDays, label: "Plan" },
  { to: "/more", icon: MoreHorizontal, label: "More" },
];

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg dark:bg-bg-dark text-ink dark:text-slate-100 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-slate-200 dark:border-zinc-800 bg-surface dark:bg-zinc-950 p-4">
        <button
          onClick={() => navigate("/dashboard")}
          data-testid="brand-link"
          className="flex items-center gap-2 mb-8 px-2 active:scale-95 transition"
        >
          <div className="w-9 h-9 rounded-2xl bg-primary text-white grid place-items-center font-display font-extrabold text-lg shadow-lg shadow-primary/30">S</div>
          <span className="font-display font-extrabold text-xl tracking-tight">StudyBuddy</span>
        </button>

        <nav className="flex-1 flex flex-col gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              data-testid={`nav-${item.label.toLowerCase()}`}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary text-white shadow-md shadow-primary/30"
                    : "hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-700 dark:text-slate-300"
                }`
              }
            >
              <item.icon size={18} strokeWidth={2.5} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
          <button onClick={() => navigate("/profile")} data-testid="sidebar-profile" className="w-full flex items-center gap-3 text-left active:scale-95 transition">
            {user?.picture ? (
              <img src={user.picture} alt="" className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-secondary text-white grid place-items-center font-bold">
                {(user?.name || "?").charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <div className="flex items-center gap-2 text-xs text-ink-muted dark:text-slate-400">
                <span className="inline-flex items-center gap-1"><Flame size={11} className="text-accent-flame" /> {user?.streak ?? 0}</span>
                <span className="inline-flex items-center gap-1"><Gem size={11} className="text-accent-gem" /> {user?.xp ?? 0}</span>
              </div>
            </div>
          </button>
          <div className="flex gap-2 mt-3">
            <button onClick={toggle} data-testid="theme-toggle" className="flex-1 btn-outline !py-1.5 !px-3 text-xs">
              {theme === "dark" ? <Sun size={14}/> : <Moon size={14}/>} {theme === "dark" ? "Light" : "Dark"}
            </button>
            <button onClick={logout} data-testid="logout-button" className="btn-outline !py-1.5 !px-3 text-xs">
              <LogOut size={14}/>
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 glass px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2" data-testid="mobile-brand">
            <div className="w-8 h-8 rounded-xl bg-primary text-white grid place-items-center font-display font-extrabold shadow-md shadow-primary/30">S</div>
            <span className="font-display font-bold text-base">StudyBuddy</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="chip" data-testid="mobile-streak"><Flame size={12} className="text-accent-flame" />{user?.streak ?? 0}</span>
            <span className="chip" data-testid="mobile-xp"><Gem size={12} className="text-accent-gem" />{user?.xp ?? 0}</span>
            <button onClick={toggle} data-testid="mobile-theme-toggle" className="w-9 h-9 rounded-full grid place-items-center hover:bg-slate-100 dark:hover:bg-zinc-800">
              {theme === "dark" ? <Sun size={16}/> : <Moon size={16}/>}
            </button>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 glass border-t border-slate-200/60 dark:border-zinc-800/60">
        <div className="flex items-center justify-around py-2">
          {MOBILE_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              data-testid={`mnav-${item.label.toLowerCase()}`}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl text-[11px] font-medium ${
                  isActive ? "text-primary" : "text-slate-500 dark:text-slate-400"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={20} strokeWidth={isActive ? 2.8 : 2.2} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
