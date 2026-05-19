import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import {
  GraduationCap, Sigma, Timer, Trophy, FileSearch,
  Sun, Moon, LogOut, UserCog, NotebookPen, ChevronRight, Flame, Gem,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

export default function More() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [tab, setTab] = useState("links"); // links | leaderboard | papers
  const [leaderboard, setLeaderboard] = useState([]);
  const [papers, setPapers] = useState([]);

  useEffect(() => {
    api.get("/leaderboard").then(r => setLeaderboard(r.data));
    api.get("/papers").then(r => setPapers(r.data));
  }, []);

  const LINKS = [
    { icon: GraduationCap, label: "Tests", to: "/tests" },
    { icon: NotebookPen, label: "Notes", to: "/notes" },
    { icon: Sigma, label: "Formulas", to: "/formulas" },
    { icon: Timer, label: "Focus Timer", to: "/focus" },
    { icon: UserCog, label: "Profile", to: "/profile" },
  ];

  return (
    <div className="space-y-4 animate-fade-up">
      <header>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight">More</h1>
        <p className="text-ink-muted dark:text-slate-400 text-sm mt-1">Everything else in one place.</p>
      </header>

      <div className="flex gap-2 overflow-x-auto">
        {[
          { id: "links", label: "Menu" },
          { id: "leaderboard", label: "Leaderboard" },
          { id: "papers", label: "Past Papers" },
        ].map((t) => (
          <button key={t.id} onClick={()=>setTab(t.id)} data-testid={`more-tab-${t.id}`}
            className={`px-4 py-2 rounded-full text-xs font-semibold border whitespace-nowrap transition ${tab===t.id?"bg-primary text-white border-primary":"border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "links" && (
        <div className="space-y-3">
          <div className="card-surface p-5">
            <div className="flex items-center gap-3">
              {user?.picture ? <img src={user.picture} alt="" className="w-12 h-12 rounded-2xl object-cover"/> : <div className="w-12 h-12 rounded-2xl bg-primary text-white grid place-items-center font-display font-extrabold text-xl">{user?.name?.charAt(0)}</div>}
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold">{user?.name}</p>
                <div className="flex gap-2 mt-1">
                  <span className="chip"><Flame size={11} className="text-accent-flame"/>{user?.streak}</span>
                  <span className="chip"><Gem size={11} className="text-accent-gem"/>{user?.xp}</span>
                </div>
              </div>
            </div>
          </div>
          <ul className="space-y-1">
            {LINKS.map((l, i) => (
              <li key={i}>
                <button onClick={()=>navigate(l.to)} data-testid={`morelink-${l.label.toLowerCase()}`} className="w-full flex items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 active:scale-[.98] transition">
                  <span className="flex items-center gap-3"><l.icon size={18} className="text-primary"/><span className="font-medium text-sm">{l.label}</span></span>
                  <ChevronRight size={16} className="text-ink-muted"/>
                </button>
              </li>
            ))}
            <li>
              <button onClick={toggle} data-testid="more-theme" className="w-full flex items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 transition">
                <span className="flex items-center gap-3">{theme==="dark"?<Sun size={18}/>:<Moon size={18}/>}<span className="font-medium text-sm">Toggle {theme==="dark"?"light":"dark"} mode</span></span>
                <ChevronRight size={16} className="text-ink-muted"/>
              </button>
            </li>
            <li>
              <button onClick={logout} data-testid="more-logout" className="w-full flex items-center justify-between gap-3 p-4 rounded-2xl border border-red-200 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition">
                <span className="flex items-center gap-3"><LogOut size={18}/><span className="font-medium text-sm">Sign out</span></span>
              </button>
            </li>
          </ul>
        </div>
      )}

      {tab === "leaderboard" && (
        <div className="card-surface p-5">
          <p className="font-display font-bold text-lg flex items-center gap-2 mb-3"><Trophy size={18} className="text-accent-gold"/>Top students this week</p>
          {leaderboard.length === 0 ? (
            <p className="text-sm text-ink-muted text-center py-6">No data yet. Start earning XP!</p>
          ) : (
            <ul className="space-y-2">
              {leaderboard.map((u, i) => (
                <li key={u.user_id} className={`flex items-center gap-3 p-3 rounded-2xl border ${u.user_id===user?.user_id?"border-primary bg-primary/5":"border-slate-100 dark:border-zinc-800"}`}>
                  <span className={`w-8 h-8 grid place-items-center rounded-full font-bold text-sm ${i===0?"bg-amber-100 text-amber-700":i===1?"bg-slate-100 text-slate-700":i===2?"bg-orange-100 text-orange-700":"bg-slate-50 dark:bg-zinc-800 text-slate-500"}`}>{i+1}</span>
                  {u.picture ? <img src={u.picture} alt="" className="w-9 h-9 rounded-full object-cover"/> : <div className="w-9 h-9 rounded-full bg-secondary/15 text-secondary grid place-items-center font-bold">{u.name?.charAt(0)}</div>}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{u.name}</p>
                    <p className="text-xs text-ink-muted dark:text-slate-400"><Flame size={10} className="inline text-accent-flame"/> {u.streak} • <Gem size={10} className="inline text-accent-gem"/> {u.xp} XP</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "papers" && (
        <div className="space-y-3">
          <div className="card-surface p-4">
            <p className="font-display font-bold text-lg flex items-center gap-2"><FileSearch size={18} className="text-secondary"/>Previous year papers</p>
            <p className="text-xs text-ink-muted dark:text-slate-400 mt-1">AI-analysed exam trends for CBSE & ICSE.</p>
          </div>
          {papers.map((p, i) => (
            <div key={i} className="card-surface p-5">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="font-display font-bold text-lg">{p.subject}</p>
                <span className="chip">{p.board} • Class {p.class_grade} • {p.year}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {p.topics.map((t, j) => <span key={j} className="chip bg-primary/10 text-primary">{t}</span>)}
              </div>
              <p className="text-xs text-ink-muted dark:text-slate-400 mt-3 italic">📊 {p.trend}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
