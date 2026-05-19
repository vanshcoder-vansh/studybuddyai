import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import {
  GraduationCap, BookOpen, Languages, Target, ArrowRight, Check,
} from "lucide-react";

const CLASSES = ["6","7","8","9","10","11","12"];
const BOARDS = ["CBSE","ICSE","State","Other"];
const SUBJECT_OPTIONS = ["Math","Science","Physics","Chemistry","Biology","English","Hindi","Social Science","Computer","Sanskrit","Economics","Business","Accountancy"];
const LANGS = ["English","Hindi","Hinglish"];
const GOALS = ["Score 95%+","Top of class","Just pass with confidence","Olympiad / Boards prep","Concept clarity"];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    class_grade: "",
    board: "",
    subjects: [],
    language: "English",
    exam_goal: "",
  });
  const [saving, setSaving] = useState(false);

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => Math.max(0, s - 1));
  const toggleSubject = (s) =>
    setForm((f) => ({ ...f, subjects: f.subjects.includes(s) ? f.subjects.filter((x) => x !== s) : [...f.subjects, s] }));

  const finish = async () => {
    setSaving(true);
    try {
      const { data } = await api.put("/profile", { ...form, onboarded: true });
      setUser(data);
      toast.success("Welcome aboard! Let's get studying.");
      navigate("/dashboard", { replace: true });
    } catch (e) {
      toast.error("Couldn't save profile. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    {
      icon: GraduationCap, title: "Which class are you in?", subtitle: "We'll tune everything to your level.",
      content: (
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mt-6">
          {CLASSES.map((c) => (
            <button key={c} onClick={() => setForm({ ...form, class_grade: c })} data-testid={`onb-class-${c}`}
              className={`py-4 rounded-2xl border font-display font-bold text-xl transition ${form.class_grade===c?"bg-primary text-white border-primary":"border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900"}`}>{c}</button>
          ))}
        </div>
      ),
      canNext: !!form.class_grade,
    },
    {
      icon: BookOpen, title: "Which board do you follow?", subtitle: "We support CBSE & ICSE first-class.",
      content: (
        <div className="grid grid-cols-2 gap-2 mt-6">
          {BOARDS.map((b) => (
            <button key={b} onClick={() => setForm({ ...form, board: b })} data-testid={`onb-board-${b}`}
              className={`py-5 rounded-2xl border font-semibold transition ${form.board===b?"bg-primary text-white border-primary":"border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900"}`}>{b}</button>
          ))}
        </div>
      ),
      canNext: !!form.board,
    },
    {
      icon: BookOpen, title: "Pick your subjects", subtitle: "Choose at least 2 to start.",
      content: (
        <div className="flex flex-wrap gap-2 mt-6">
          {SUBJECT_OPTIONS.map((s) => (
            <button key={s} onClick={() => toggleSubject(s)} data-testid={`onb-subject-${s}`}
              className={`px-4 py-2 rounded-full border text-sm font-medium transition ${form.subjects.includes(s)?"bg-primary text-white border-primary":"border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900"}`}>
              {form.subjects.includes(s) && <Check size={14} className="inline mr-1"/>}{s}
            </button>
          ))}
        </div>
      ),
      canNext: form.subjects.length >= 2,
    },
    {
      icon: Languages, title: "How should we talk to you?", subtitle: "Pick a default language for explanations.",
      content: (
        <div className="grid grid-cols-3 gap-2 mt-6">
          {LANGS.map((l) => (
            <button key={l} onClick={() => setForm({ ...form, language: l })} data-testid={`onb-lang-${l}`}
              className={`py-4 rounded-2xl border font-semibold transition ${form.language===l?"bg-primary text-white border-primary":"border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900"}`}>{l}</button>
          ))}
        </div>
      ),
      canNext: !!form.language,
    },
    {
      icon: Target, title: "What's your big goal?", subtitle: "We'll keep nudging you toward it.",
      content: (
        <div className="grid grid-cols-1 gap-2 mt-6">
          {GOALS.map((g) => (
            <button key={g} onClick={() => setForm({ ...form, exam_goal: g })} data-testid={`onb-goal-${g.replace(/\s+/g,'-')}`}
              className={`py-4 px-5 rounded-2xl border font-medium text-left transition ${form.exam_goal===g?"bg-primary text-white border-primary":"border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900"}`}>{g}</button>
          ))}
        </div>
      ),
      canNext: !!form.exam_goal,
    },
  ];

  const cur = steps[step];
  const Icon = cur.icon;
  const isLast = step === steps.length - 1;

  return (
    <div className="min-h-screen bg-bg dark:bg-bg-dark text-ink dark:text-slate-100 mesh-bg flex items-center justify-center p-5">
      <div className="w-full max-w-xl card-surface p-7 sm:p-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-primary text-white grid place-items-center font-display font-extrabold shadow-md shadow-primary/30">S</div>
            <span className="font-display font-bold text-lg">StudyBuddy</span>
          </div>
          <span className="text-xs text-ink-muted dark:text-slate-400">Step {step+1} of {steps.length}</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 mb-8">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${((step+1)/steps.length)*100}%` }}/>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary grid place-items-center mb-4">
          <Icon size={22} strokeWidth={2.5}/>
        </div>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight">{cur.title}</h1>
        <p className="text-sm text-ink-muted dark:text-slate-400 mt-1">{cur.subtitle}</p>
        {cur.content}
        <div className="mt-8 flex justify-between gap-3">
          <button onClick={back} disabled={step===0} data-testid="onb-back" className="btn-ghost disabled:opacity-40">Back</button>
          {!isLast ? (
            <button onClick={next} disabled={!cur.canNext} data-testid="onb-next" className="btn-primary disabled:opacity-50">
              Continue <ArrowRight size={16}/>
            </button>
          ) : (
            <button onClick={finish} disabled={!cur.canNext || saving} data-testid="onb-finish" className="btn-primary disabled:opacity-50">
              {saving ? "Saving…" : "Let's go"} <ArrowRight size={16}/>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
