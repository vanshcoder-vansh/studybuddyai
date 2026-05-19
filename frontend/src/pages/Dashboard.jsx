import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, BarChart, Bar, YAxis } from "recharts";
import {
  Flame, Gem, Trophy, ScanLine, MessagesSquare, NotebookPen,
  GraduationCap, CalendarDays, Sigma, Timer, Sparkles, ArrowRight,
  CheckCircle2, Circle, BookOpen,
} from "lucide-react";

const ACTIONS = [
  { to: "/scan", label: "Scan homework", icon: ScanLine, color: "from-rose-500/90 to-orange-500/90" },
  { to: "/doubt", label: "Ask a doubt", icon: MessagesSquare, color: "from-sky-500/90 to-indigo-500/90" },
  { to: "/notes", label: "Make notes", icon: NotebookPen, color: "from-amber-500/90 to-rose-500/90" },
  { to: "/tests", label: "Mock test", icon: GraduationCap, color: "from-emerald-500/90 to-teal-500/90" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.get("/dashboard")
      .then((r) => { if (!cancelled) setData(r.data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    // Fall back to a minimal dashboard if API takes too long
    const t = setTimeout(() => { if (!cancelled) setLoading(false); }, 4000);
    return () => { cancelled = true; clearTimeout(t); };
  }, []);

  // Build a fallback dataset from the auth user so the page always renders
  const safeData = data || {
    user: {
      name: authUser?.name || "Student",
      picture: authUser?.picture,
      xp: authUser?.xp ?? 0,
      streak: authUser?.streak ?? 0,
      badges: authUser?.badges || [],
      class_grade: authUser?.class_grade || "10",
      board: authUser?.board || "CBSE",
      onboarded: true,
    },
    today_tasks: [],
    recent_chats: [],
    recent_notes: [],
    weekly_xp: Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      return { date: d.toISOString().slice(0, 10), xp: [0, 20, 40, 30, 60, 80, 45][i] };
    }),
    subjects: [],
    weak_subjects: [],
    quote: "Small steps every day beat big leaps once a week.",
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin"/>
      </div>
    );
  }

  const dashboardData = safeData;

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Greeting */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-ink-muted dark:text-slate-400">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight mt-0.5">
            Hey {data.user.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-ink-muted dark:text-slate-400 mt-1">"{data.quote}"</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Flame} color="text-accent-flame" bg="bg-accent-flame/10" label="Streak" value={`${data.user.streak} days`} testid="stat-streak"/>
        <StatCard icon={Gem} color="text-accent-gem" bg="bg-accent-gem/10" label="XP earned" value={data.user.xp} testid="stat-xp"/>
        <StatCard icon={Trophy} color="text-accent-gold" bg="bg-accent-gold/10" label="Badges" value={data.user.badges.length} testid="stat-badges"/>
        <StatCard icon={GraduationCap} color="text-secondary" bg="bg-secondary/10" label="Class" value={`${data.user.class_grade || "-"} ${data.user.board || ""}`} testid="stat-class"/>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger">
        {ACTIONS.map((a) => (
          <button
            key={a.to}
            onClick={() => navigate(a.to)}
            data-testid={`quick-${a.to.slice(1)}`}
            className={`group relative overflow-hidden rounded-3xl p-5 text-white text-left active:scale-95 transition bg-gradient-to-br ${a.color} shadow-lg shadow-black/5`}
          >
            <a.icon size={26} strokeWidth={2.5}/>
            <p className="mt-6 font-display font-bold text-lg leading-tight">{a.label}</p>
            <ArrowRight className="absolute top-5 right-5 opacity-70 group-hover:translate-x-1 transition" size={18}/>
          </button>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card-surface p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-lg">XP this week</h3>
            <Sparkles size={16} className="text-primary"/>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.weekly_xp.map(d => ({ ...d, day: d.date.slice(5) }))}>
                <defs>
                  <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF6B6B" stopOpacity={0.55}/>
                    <stop offset="100%" stopColor="#FF6B6B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11}/>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}/>
                <Area type="monotone" dataKey="xp" stroke="#FF6B6B" strokeWidth={2.5} fill="url(#xpGrad)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-surface p-5">
          <h3 className="font-display font-bold text-lg mb-3">Subjects</h3>
          {data.subjects.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center text-sm text-ink-muted dark:text-slate-400">
              <BookOpen className="mb-2" size={28} strokeWidth={1.7}/>
              Take a mock test to see your strengths.
              <button onClick={()=>navigate("/tests")} data-testid="goto-tests" className="btn-primary mt-3 !py-2 !px-4 text-xs">Generate a test</button>
            </div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.subjects} layout="vertical">
                  <YAxis dataKey="subject" type="category" stroke="#94a3b8" fontSize={11} width={80}/>
                  <XAxis type="number" hide domain={[0,100]}/>
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}/>
                  <Bar dataKey="score" fill="#0EA5E9" radius={[0,8,8,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Today + recent */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card-surface p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-lg flex items-center gap-2"><CalendarDays size={18} className="text-primary"/>Today's plan</h3>
            <button onClick={()=>navigate("/planner")} data-testid="goto-planner" className="text-xs font-semibold text-primary hover:underline">Open planner →</button>
          </div>
          {data.today_tasks.length === 0 ? (
            <div className="py-8 text-center text-sm text-ink-muted dark:text-slate-400">
              <p>No tasks for today.</p>
              <button onClick={()=>navigate("/planner")} data-testid="dash-add-task" className="btn-outline !py-2 !px-4 text-xs mt-3">Build a study plan</button>
            </div>
          ) : (
            <ul className="space-y-2 mt-2">
              {data.today_tasks.slice(0,5).map((t) => (
                <li key={t.task_id} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 dark:border-zinc-800">
                  {t.completed ? <CheckCircle2 className="text-accent-green" size={18}/> : <Circle size={18} className="text-slate-300 dark:text-zinc-600"/>}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${t.completed ? "line-through text-ink-muted dark:text-slate-500" : ""}`}>{t.title}</p>
                    <p className="text-xs text-ink-muted dark:text-slate-400">{t.subject || "—"} • {t.duration_min} min</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card-surface p-5">
          <h3 className="font-display font-bold text-lg mb-3 flex items-center gap-2"><MessagesSquare size={18} className="text-secondary"/>Recent activity</h3>
          {(data.recent_chats.length + data.recent_notes.length) === 0 ? (
            <div className="py-8 text-center text-sm text-ink-muted dark:text-slate-400">Nothing yet. Ask your first doubt or generate notes!</div>
          ) : (
            <ul className="space-y-2.5">
              {data.recent_chats.slice(0,3).map((c, i) => (
                <li key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900">
                  <div className="w-8 h-8 rounded-xl bg-secondary/15 text-secondary grid place-items-center"><MessagesSquare size={14}/></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{c.question}</p>
                    <p className="text-xs text-ink-muted dark:text-slate-400">Doubt • {c.subject}</p>
                  </div>
                </li>
              ))}
              {data.recent_notes.slice(0,3).map((n, i) => (
                <li key={"n"+i} onClick={()=>navigate("/notes")} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800">
                  <div className="w-8 h-8 rounded-xl bg-primary/15 text-primary grid place-items-center"><NotebookPen size={14}/></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{n.chapter}</p>
                    <p className="text-xs text-ink-muted dark:text-slate-400">{n.subject} • {n.style} notes</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Discover */}
      <div className="card-surface p-5">
        <h3 className="font-display font-bold text-lg mb-4">Discover more</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <DiscoverTile to="/formulas" icon={Sigma} label="Formulas hub" testid="disc-formulas" onClick={()=>navigate("/formulas")}/>
          <DiscoverTile to="/focus" icon={Timer} label="Focus timer" testid="disc-focus" onClick={()=>navigate("/focus")}/>
          <DiscoverTile to="/more" icon={Trophy} label="Leaderboard" testid="disc-leaderboard" onClick={()=>navigate("/more")}/>
          <DiscoverTile to="/profile" icon={Sparkles} label="Edit profile" testid="disc-profile" onClick={()=>navigate("/profile")}/>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, color, bg, label, value, testid }) {
  return (
    <div className="card-surface p-4" data-testid={testid}>
      <div className={`w-10 h-10 rounded-2xl ${bg} ${color} grid place-items-center`}>
        <Icon size={18} strokeWidth={2.5}/>
      </div>
      <p className="mt-3 text-xs text-ink-muted dark:text-slate-400 font-medium">{label}</p>
      <p className="font-display font-extrabold text-2xl mt-0.5">{value}</p>
    </div>
  );
}
function DiscoverTile({ icon: Icon, label, testid, onClick }) {
  return (
    <button onClick={onClick} data-testid={testid} className="rounded-2xl border border-slate-200 dark:border-zinc-800 p-4 text-left hover:bg-slate-50 dark:hover:bg-zinc-900 active:scale-95 transition">
      <Icon size={20} className="text-primary" strokeWidth={2.5}/>
      <p className="mt-3 text-sm font-semibold">{label}</p>
    </button>
  );
}
