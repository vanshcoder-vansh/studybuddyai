import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { toast } from "sonner";
import { GraduationCap, Sparkles, Loader2, Timer, Check, X, Trophy, ArrowRight } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const DIFFS = [
  { id: "easy", label: "Easy" }, { id: "medium", label: "Medium" }, { id: "hard", label: "Hard" },
];

export default function TestGenerator() {
  const { user } = useAuth();
  const [phase, setPhase] = useState("setup"); // setup | taking | result
  const [form, setForm] = useState({
    subject: user?.subjects?.[0] || "Math",
    chapter: "",
    difficulty: "medium",
    num_questions: 5,
    duration_min: 10,
  });
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [idx, setIdx] = useState(0);
  const [creating, setCreating] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState(null);
  const [startedAt, setStartedAt] = useState(0);

  useEffect(() => {
    if (phase !== "taking") return;
    if (timeLeft <= 0) { submit(); return; }
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [phase, timeLeft]);

  const generate = async () => {
    setCreating(true);
    try {
      const { data } = await api.post("/tests/generate", {
        ...form,
        class_grade: user?.class_grade || "10",
        board: user?.board || "CBSE",
      });
      setTest(data);
      setAnswers(new Array(data.questions.length).fill(""));
      setIdx(0);
      setTimeLeft(form.duration_min * 60);
      setStartedAt(Date.now());
      setPhase("taking");
    } catch (e) { toast.error("Couldn't generate test. Try again."); }
    finally { setCreating(false); }
  };

  const pick = (option) => {
    setAnswers((a) => { const c = [...a]; c[idx] = option; return c; });
  };

  const submit = async () => {
    try {
      const { data } = await api.post(`/tests/${test.test_id}/submit`, {
        answers,
        time_taken_sec: Math.floor((Date.now() - startedAt) / 1000),
      });
      setResult(data);
      setPhase("result");
      toast.success(`Scored ${data.score}% — well done!`);
    } catch (e) { toast.error("Submit failed"); }
  };

  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  return (
    <div className="space-y-4 animate-fade-up">
      <header>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300 grid place-items-center"><GraduationCap size={20} strokeWidth={2.5}/></span>
          Test Generator
        </h1>
        <p className="text-ink-muted dark:text-slate-400 text-sm mt-1">AI builds a fresh mock test in seconds.</p>
      </header>

      {phase === "setup" && (
        <div className="card-surface p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-ink-muted dark:text-slate-400">Subject</label>
              <input value={form.subject} onChange={(e)=>setForm({...form, subject: e.target.value})} className="input-field mt-1" data-testid="test-subject"/>
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-muted dark:text-slate-400">Chapter (optional)</label>
              <input value={form.chapter} onChange={(e)=>setForm({...form, chapter: e.target.value})} className="input-field mt-1" placeholder="e.g. Quadratic Equations" data-testid="test-chapter"/>
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-muted dark:text-slate-400">Questions</label>
              <input type="number" min={3} max={20} value={form.num_questions} onChange={(e)=>setForm({...form, num_questions: +e.target.value})} className="input-field mt-1" data-testid="test-num"/>
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-muted dark:text-slate-400">Duration (min)</label>
              <input type="number" min={3} max={60} value={form.duration_min} onChange={(e)=>setForm({...form, duration_min: +e.target.value})} className="input-field mt-1" data-testid="test-duration"/>
            </div>
          </div>
          <div className="flex bg-slate-100 dark:bg-zinc-900 rounded-full p-1 w-fit">
            {DIFFS.map((d)=>(
              <button key={d.id} onClick={()=>setForm({...form, difficulty: d.id})} data-testid={`test-diff-${d.id}`}
                className={`px-4 py-1.5 text-xs font-semibold rounded-full ${form.difficulty===d.id?"bg-primary text-white":"text-slate-600 dark:text-slate-300"}`}>{d.label}</button>
            ))}
          </div>
          <button onClick={generate} disabled={creating} data-testid="test-generate" className="btn-primary disabled:opacity-50">
            {creating ? <><Loader2 size={16} className="animate-spin"/> Building test…</> : <><Sparkles size={16}/> Start mock test</>}
          </button>
        </div>
      )}

      {phase === "taking" && test && (
        <div className="space-y-4">
          <div className="card-surface p-4 flex items-center justify-between">
            <span className="text-sm font-semibold">Question {idx+1} of {test.questions.length}</span>
            <span className="inline-flex items-center gap-1.5 chip" data-testid="test-timer"><Timer size={14} className="text-primary"/><span className="font-mono">{fmt(timeLeft)}</span></span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${((idx+1)/test.questions.length)*100}%` }}/>
          </div>
          <div className="card-surface p-6">
            <p className="font-display font-semibold text-lg mb-4" data-testid="test-question">{test.questions[idx].q}</p>
            <div className="space-y-2">
              {test.questions[idx].options.map((opt, i) => {
                const letter = String.fromCharCode(65+i);
                const selected = answers[idx] === opt;
                return (
                  <button key={i} onClick={()=>pick(opt)} data-testid={`test-opt-${letter}`}
                    className={`w-full text-left p-4 rounded-2xl border flex items-center gap-3 transition ${selected?"bg-primary/10 border-primary":"border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900"}`}>
                    <span className={`w-8 h-8 rounded-full grid place-items-center text-xs font-bold ${selected?"bg-primary text-white":"bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300"}`}>{letter}</span>
                    <span className="text-sm">{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex justify-between gap-2">
            <button onClick={()=>setIdx(Math.max(0, idx-1))} disabled={idx===0} data-testid="test-prev" className="btn-outline disabled:opacity-40">Previous</button>
            {idx < test.questions.length-1 ? (
              <button onClick={()=>setIdx(idx+1)} data-testid="test-next" className="btn-primary">Next <ArrowRight size={16}/></button>
            ) : (
              <button onClick={submit} data-testid="test-submit" className="btn-primary">Submit test</button>
            )}
          </div>
        </div>
      )}

      {phase === "result" && result && (
        <div className="space-y-4">
          <div className="card-surface p-6 text-center mesh-bg">
            <Trophy size={40} className="mx-auto text-accent-gold mb-2"/>
            <p className="font-display font-extrabold text-5xl tracking-tight" data-testid="test-score">{result.score}%</p>
            <p className="text-sm text-ink-muted dark:text-slate-400 mt-1">{result.correct} of {result.total} correct • +{20 + result.correct*5} XP</p>
            <button onClick={()=>{setPhase("setup"); setTest(null); setResult(null);}} data-testid="test-again" className="btn-primary mt-5">Take another test</button>
          </div>
          <div className="space-y-2">
            {result.detail.map((d, i) => (
              <div key={i} className="card-surface p-4">
                <div className="flex items-start gap-3">
                  <span className={`w-8 h-8 shrink-0 rounded-full grid place-items-center ${d.is_correct?"bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300":"bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300"}`}>
                    {d.is_correct ? <Check size={16}/> : <X size={16}/>}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{i+1}. {d.q}</p>
                    <p className="text-xs mt-1"><span className="text-ink-muted">Your answer:</span> <span className="font-medium">{d.your || "—"}</span></p>
                    {!d.is_correct && <p className="text-xs"><span className="text-ink-muted">Correct:</span> <span className="font-medium text-accent-green">{d.correct}</span></p>}
                    {d.explanation && <p className="text-xs text-ink-muted dark:text-slate-400 mt-1 italic">"{d.explanation}"</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
