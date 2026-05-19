import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Sigma, Search } from "lucide-react";

export default function FormulaHub() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState("All");

  useEffect(() => { api.get("/formulas").then(r => setItems(r.data)); }, []);
  const subjects = ["All", ...Array.from(new Set(items.map(i => i.subject)))];
  const filtered = items.filter(i => (subject==="All" || i.subject===subject) && (i.title.toLowerCase().includes(q.toLowerCase()) || i.topic.toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="space-y-4 animate-fade-up">
      <header>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300 grid place-items-center"><Sigma size={20} strokeWidth={2.5}/></span>
          Formula Hub
        </h1>
        <p className="text-ink-muted dark:text-slate-400 text-sm mt-1">Quick-revision cards for the most-asked formulas.</p>
      </header>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-2 flex-1 input-field !py-2">
          <Search size={16} className="text-ink-muted"/>
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search formulas..." className="flex-1 bg-transparent outline-none text-sm" data-testid="formula-search"/>
        </div>
        <select value={subject} onChange={(e)=>setSubject(e.target.value)} className="rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3 py-2 text-sm" data-testid="formula-subject">
          {subjects.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((f, i) => (
          <div key={i} className="card-surface p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="chip">{f.subject}</span>
              <span className="text-xs text-ink-muted dark:text-slate-400">{f.topic}</span>
            </div>
            <p className="font-display font-bold text-lg">{f.title}</p>
            <p className="mt-3 font-mono bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl p-3 text-sm leading-relaxed">{f.formula}</p>
            <p className="text-xs text-ink-muted dark:text-slate-400 mt-2">{f.explain}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
