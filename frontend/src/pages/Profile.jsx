import React, { useState } from "react";
import { api } from "../lib/api";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { UserCog, Save, LogOut, Crown, Flame, Gem, Trophy } from "lucide-react";

const SUBJECT_OPTIONS = ["Math","Science","Physics","Chemistry","Biology","English","Hindi","Social Science","Computer","Sanskrit","Economics","Business","Accountancy"];
const LANGS = ["English","Hindi","Hinglish"];

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const [f, setF] = useState({
    class_grade: user.class_grade || "10",
    board: user.board || "CBSE",
    subjects: user.subjects || [],
    language: user.language || "English",
    exam_goal: user.exam_goal || "",
  });
  const [saving, setSaving] = useState(false);

  const toggle = (s) => setF({ ...f, subjects: f.subjects.includes(s) ? f.subjects.filter(x=>x!==s) : [...f.subjects, s] });

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.put("/profile", f);
      setUser(data);
      toast.success("Profile saved");
    } catch { toast.error("Couldn't save"); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4 animate-fade-up max-w-3xl">
      <header>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl bg-secondary/15 text-secondary grid place-items-center"><UserCog size={20} strokeWidth={2.5}/></span>
          Profile
        </h1>
      </header>

      <div className="card-surface p-5 flex items-center gap-4">
        {user.picture ? (
          <img src={user.picture} alt="" className="w-16 h-16 rounded-2xl object-cover"/>
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-primary text-white grid place-items-center font-display font-extrabold text-2xl">{user.name?.charAt(0)}</div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-xl">{user.name}</p>
          <p className="text-sm text-ink-muted dark:text-slate-400 truncate">{user.email}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="chip"><Flame size={12} className="text-accent-flame"/>{user.streak} day streak</span>
            <span className="chip"><Gem size={12} className="text-accent-gem"/>{user.xp} XP</span>
            <span className="chip"><Crown size={12} className="text-accent-gold"/>{user.plan === "free" ? "Free plan" : "Pro"}</span>
          </div>
        </div>
      </div>

      {user.badges?.length > 0 && (
        <div className="card-surface p-5">
          <p className="font-display font-bold text-lg flex items-center gap-2 mb-3"><Trophy size={18} className="text-accent-gold"/>Badges earned</p>
          <div className="flex flex-wrap gap-2">
            {user.badges.map((b) => (
              <span key={b} data-testid={`badge-${b}`} className="px-3 py-1.5 rounded-full bg-accent-gold/10 text-amber-700 dark:text-amber-300 text-xs font-semibold">🏆 {b}</span>
            ))}
          </div>
        </div>
      )}

      <div className="card-surface p-5 space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-ink-muted dark:text-slate-400">Class</label>
            <select value={f.class_grade} onChange={(e)=>setF({...f, class_grade:e.target.value})} className="input-field mt-1" data-testid="prof-class">
              {["6","7","8","9","10","11","12"].map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-muted dark:text-slate-400">Board</label>
            <select value={f.board} onChange={(e)=>setF({...f, board:e.target.value})} className="input-field mt-1" data-testid="prof-board">
              {["CBSE","ICSE","State","Other"].map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-muted dark:text-slate-400">Subjects</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {SUBJECT_OPTIONS.map((s) => (
              <button key={s} onClick={()=>toggle(s)} data-testid={`prof-sub-${s}`}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${f.subjects.includes(s)?"bg-primary text-white border-primary":"border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900"}`}>{s}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-muted dark:text-slate-400">Preferred language</label>
          <div className="flex gap-2 mt-2">
            {LANGS.map((l) => (
              <button key={l} onClick={()=>setF({...f, language:l})} data-testid={`prof-lang-${l}`}
                className={`px-4 py-2 rounded-full text-xs font-semibold border transition ${f.language===l?"bg-primary text-white border-primary":"border-slate-200 dark:border-zinc-800"}`}>{l}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-muted dark:text-slate-400">Exam goal</label>
          <input value={f.exam_goal} onChange={(e)=>setF({...f, exam_goal:e.target.value})} className="input-field mt-1" placeholder="Score 95%+, Top of class, ..." data-testid="prof-goal"/>
        </div>
        <div className="flex justify-between gap-2 pt-2">
          <button onClick={logout} data-testid="prof-logout" className="btn-outline text-red-500"><LogOut size={14}/>Sign out</button>
          <button onClick={save} disabled={saving} data-testid="prof-save" className="btn-primary disabled:opacity-50"><Save size={16}/>{saving?"Saving…":"Save changes"}</button>
        </div>
      </div>
    </div>
  );
}
