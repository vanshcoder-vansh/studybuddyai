import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { toast } from "sonner";
import { CalendarDays, Plus, Sparkles, Loader2, Check, Trash2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

function ymd(d) { return d.toISOString().slice(0,10); }

export default function Planner() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [date, setDate] = useState(ymd(new Date()));
  const [showAdd, setShowAdd] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [form, setForm] = useState({ title: "", subject: "", duration_min: 30, notes: "" });
  const [ai, setAi] = useState({ exam_date: ymd(new Date(Date.now()+14*86400000)), weak: "", hours: 2 });
  const [aiLoading, setAiLoading] = useState(false);

  const load = async () => {
    const { data } = await api.get("/planner/tasks");
    setTasks(data);
  };
  useEffect(() => { load(); }, []);

  const byDate = useMemo(() => {
    const m = {};
    for (const t of tasks) { (m[t.date] ||= []).push(t); }
    return m;
  }, [tasks]);

  const days = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today); d.setDate(today.getDate()+i); return d;
    });
  }, []);

  const toggleDone = async (t) => {
    await api.patch(`/planner/tasks/${t.task_id}`, { completed: !t.completed });
    setTasks((ts) => ts.map(x => x.task_id === t.task_id ? { ...x, completed: !t.completed } : x));
    if (!t.completed) toast.success("Nice! +10 XP");
  };
  const del = async (t) => {
    await api.delete(`/planner/tasks/${t.task_id}`);
    setTasks((ts) => ts.filter(x => x.task_id !== t.task_id));
  };
  const add = async () => {
    if (!form.title.trim()) return toast.error("Add a task title");
    const { data } = await api.post("/planner/tasks", { ...form, date });
    setTasks((ts) => [data, ...ts]);
    setForm({ title: "", subject: "", duration_min: 30, notes: "" });
    setShowAdd(false);
  };
  const generateAI = async () => {
    setAiLoading(true);
    try {
      const weak = ai.weak.split(",").map(s=>s.trim()).filter(Boolean);
      const { data } = await api.post("/planner/generate", { exam_date: ai.exam_date, weak_subjects: weak, hours_per_day: +ai.hours });
      setTasks((ts) => [...data.tasks, ...ts]);
      toast.success(`Plan created — ${data.tasks.length} tasks added`);
      setShowAI(false);
    } catch (e) { toast.error("Couldn't build plan"); }
    finally { setAiLoading(false); }
  };

  const todays = byDate[date] || [];

  return (
    <div className="space-y-4 animate-fade-up">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300 grid place-items-center"><CalendarDays size={20} strokeWidth={2.5}/></span>
            Study Planner
          </h1>
          <p className="text-ink-muted dark:text-slate-400 text-sm mt-1">Plan your days. Let AI build the perfect schedule.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>setShowAI(true)} data-testid="ai-plan" className="btn-outline"><Sparkles size={14}/>AI plan</button>
          <button onClick={()=>setShowAdd(true)} data-testid="add-task" className="btn-primary"><Plus size={16}/>Add task</button>
        </div>
      </header>

      {/* Date strip */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {days.map((d, i) => {
          const key = ymd(d);
          const isActive = date === key;
          const count = (byDate[key] || []).length;
          return (
            <button key={i} onClick={()=>setDate(key)} data-testid={`day-${key}`}
              className={`shrink-0 w-16 sm:w-20 p-3 rounded-2xl border transition text-center ${isActive?"bg-primary text-white border-primary":"border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900"}`}>
              <p className="text-[10px] uppercase font-bold opacity-70">{d.toLocaleDateString(undefined,{weekday:"short"})}</p>
              <p className="font-display font-extrabold text-xl mt-0.5">{d.getDate()}</p>
              {count>0 && <p className="text-[10px] mt-1 opacity-80">{count} task{count>1?"s":""}</p>}
            </button>
          );
        })}
      </div>

      {showAdd && (
        <div className="card-surface p-5 space-y-3">
          <p className="font-display font-bold text-lg">New task on {date}</p>
          <input value={form.title} onChange={(e)=>setForm({...form, title:e.target.value})} placeholder="Task title" className="input-field" data-testid="task-title"/>
          <div className="grid sm:grid-cols-2 gap-3">
            <input value={form.subject} onChange={(e)=>setForm({...form, subject:e.target.value})} placeholder="Subject" className="input-field" data-testid="task-subject"/>
            <input type="number" min={5} value={form.duration_min} onChange={(e)=>setForm({...form, duration_min:+e.target.value})} placeholder="Duration (min)" className="input-field" data-testid="task-duration"/>
          </div>
          <textarea value={form.notes} onChange={(e)=>setForm({...form, notes:e.target.value})} placeholder="Notes (optional)" rows={2} className="input-field" data-testid="task-notes"/>
          <div className="flex justify-end gap-2">
            <button onClick={()=>setShowAdd(false)} className="btn-ghost" data-testid="task-cancel">Cancel</button>
            <button onClick={add} className="btn-primary" data-testid="task-save">Save</button>
          </div>
        </div>
      )}

      {showAI && (
        <div className="card-surface p-5 space-y-3">
          <p className="font-display font-bold text-lg flex items-center gap-2"><Sparkles size={18} className="text-primary"/>Build my AI study plan</p>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-ink-muted">Exam date</label>
              <input type="date" value={ai.exam_date} onChange={(e)=>setAi({...ai, exam_date:e.target.value})} className="input-field mt-1" data-testid="ai-date"/>
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-muted">Hours / day</label>
              <input type="number" min={1} max={10} value={ai.hours} onChange={(e)=>setAi({...ai, hours:e.target.value})} className="input-field mt-1" data-testid="ai-hours"/>
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-muted">Weak subjects (comma)</label>
              <input value={ai.weak} onChange={(e)=>setAi({...ai, weak:e.target.value})} placeholder="Math, Physics" className="input-field mt-1" data-testid="ai-weak"/>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={()=>setShowAI(false)} className="btn-ghost">Cancel</button>
            <button onClick={generateAI} disabled={aiLoading} className="btn-primary disabled:opacity-50" data-testid="ai-go">
              {aiLoading ? <><Loader2 size={16} className="animate-spin"/> Building…</> : <><Sparkles size={16}/>Generate plan</>}
            </button>
          </div>
        </div>
      )}

      {/* Tasks list */}
      <div className="card-surface p-5">
        <p className="font-display font-bold text-lg mb-3">{new Date(date).toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"})}</p>
        {todays.length === 0 ? (
          <div className="py-10 text-center text-sm text-ink-muted dark:text-slate-400">
            No tasks for this day. Add one or generate an AI plan.
          </div>
        ) : (
          <ul className="space-y-2">
            {todays.map((t) => (
              <li key={t.task_id} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 dark:border-zinc-800">
                <button onClick={()=>toggleDone(t)} data-testid={`task-toggle-${t.task_id}`}
                  className={`w-7 h-7 rounded-full grid place-items-center transition ${t.completed?"bg-accent-green text-white":"bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500"}`}>
                  {t.completed && <Check size={14}/>}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${t.completed?"line-through text-ink-muted":""}`}>{t.title}</p>
                  <p className="text-xs text-ink-muted dark:text-slate-400">{t.subject || "—"} • {t.duration_min} min{t.ai_generated ? " • AI" : ""}</p>
                </div>
                <button onClick={()=>del(t)} data-testid={`task-delete-${t.task_id}`} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 w-8 h-8 rounded-full grid place-items-center"><Trash2 size={14}/></button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
