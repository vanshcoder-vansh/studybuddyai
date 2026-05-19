import React, { useEffect, useRef, useState } from "react";
import { Timer, Play, Pause, RotateCcw, Coffee } from "lucide-react";
import { toast } from "sonner";

const MODES = {
  focus: { label: "Focus", mins: 25, color: "bg-primary text-white" },
  short: { label: "Short break", mins: 5, color: "bg-secondary text-white" },
  long: { label: "Long break", mins: 15, color: "bg-accent-yellow text-ink" },
};

export default function Pomodoro() {
  const [mode, setMode] = useState("focus");
  const [secs, setSecs] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [rounds, setRounds] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!running) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setSecs((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          handleDone();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const handleDone = () => {
    toast.success(`${MODES[mode].label} complete!`);
    if (mode === "focus") {
      const newR = rounds + 1;
      setRounds(newR);
      const nextMode = newR % 4 === 0 ? "long" : "short";
      setMode(nextMode); setSecs(MODES[nextMode].mins * 60);
    } else {
      setMode("focus"); setSecs(MODES.focus.mins * 60);
    }
  };

  const choose = (m) => { setMode(m); setSecs(MODES[m].mins * 60); setRunning(false); };
  const reset = () => { setSecs(MODES[mode].mins * 60); setRunning(false); };

  const total = MODES[mode].mins * 60;
  const pct = ((total - secs) / total) * 100;
  const m = String(Math.floor(secs/60)).padStart(2,"0");
  const s = String(secs%60).padStart(2,"0");

  return (
    <div className="space-y-4 animate-fade-up max-w-2xl mx-auto">
      <header>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl bg-accent-yellow/20 text-amber-700 dark:text-amber-300 grid place-items-center"><Timer size={20} strokeWidth={2.5}/></span>
          Focus Timer
        </h1>
        <p className="text-ink-muted dark:text-slate-400 text-sm mt-1">Pomodoro technique — 25 minutes of laser focus, then a short break.</p>
      </header>

      <div className="flex gap-2 justify-center">
        {Object.entries(MODES).map(([k, v]) => (
          <button key={k} onClick={()=>choose(k)} data-testid={`pomo-${k}`}
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${mode===k?v.color+" border-transparent":"border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900"}`}>
            {v.label}
          </button>
        ))}
      </div>

      <div className="card-surface p-10 flex flex-col items-center text-center mesh-bg">
        <div className="relative w-64 h-64">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="6" fill="none" className="text-slate-200 dark:text-zinc-800"/>
            <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="6" fill="none"
              className="text-primary transition-all duration-1000"
              strokeDasharray={2*Math.PI*45}
              strokeDashoffset={2*Math.PI*45 * (1 - pct/100)}
              strokeLinecap="round"/>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="font-display font-extrabold text-6xl tracking-tight tabular-nums" data-testid="pomo-time">{m}:{s}</p>
            <p className="text-xs text-ink-muted dark:text-slate-400 uppercase tracking-widest mt-1">{MODES[mode].label}</p>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={()=>setRunning(r=>!r)} data-testid="pomo-play" className="btn-primary !py-3.5 !px-7 text-base">
            {running ? <><Pause size={18}/>Pause</> : <><Play size={18}/>Start</>}
          </button>
          <button onClick={reset} data-testid="pomo-reset" className="btn-outline"><RotateCcw size={14}/>Reset</button>
        </div>
        <p className="text-xs text-ink-muted dark:text-slate-400 mt-4 inline-flex items-center gap-1.5"><Coffee size={12}/>Rounds completed today: <span className="font-bold text-ink dark:text-slate-100">{rounds}</span></p>
      </div>
    </div>
  );
}
