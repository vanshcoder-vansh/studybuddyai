import React, { useRef, useState } from "react";
import { api } from "../lib/api";
import { toast } from "sonner";
import { speak, stopSpeak } from "../lib/utils";
import { ScanLine, Upload, ImageIcon, Sparkles, Volume2, VolumeX, Loader2, Languages, Zap, Lightbulb, ListChecks } from "lucide-react";

const MODES = [
  { id: "explain", label: "Step-by-step", icon: ListChecks },
  { id: "simpler", label: "Simpler words", icon: Lightbulb },
  { id: "hinglish", label: "Explain in Hinglish", icon: Languages },
  { id: "practice", label: "Practice questions", icon: Zap },
];

export default function HomeworkScanner() {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mode, setMode] = useState("explain");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [speaking, setSpeaking] = useState(false);

  const pick = (f) => {
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) { toast.error("Image must be under 8 MB"); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setAnswer(null);
  };

  const scan = async () => {
    if (!file) return toast.error("Please upload an image first");
    setLoading(true); setAnswer(null);
    const fd = new FormData();
    fd.append("image", file);
    fd.append("mode", mode);
    try {
      const { data } = await api.post("/scan", fd, { headers: { "Content-Type": "multipart/form-data" }, timeout: 90000 });
      setAnswer(data.answer);
      toast.success("Done! +10 XP earned");
    } catch (e) {
      toast.error("Scan failed. Try a clearer image.");
    } finally { setLoading(false); }
  };

  const toggleSpeak = () => {
    if (!answer) return;
    if (speaking) { stopSpeak(); setSpeaking(false); return; }
    setSpeaking(true);
    speak(answer);
    setTimeout(() => setSpeaking(false), Math.max(4000, answer.length * 35));
  };

  return (
    <div className="space-y-4 animate-fade-up">
      <header>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl bg-primary/15 text-primary grid place-items-center"><ScanLine size={20} strokeWidth={2.5}/></span>
          Homework Scanner
        </h1>
        <p className="text-ink-muted dark:text-slate-400 text-sm mt-1">Snap a photo of your homework. Get a step-by-step explanation.</p>
      </header>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card-surface p-5">
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e)=>pick(e.target.files[0])} data-testid="scan-file-input"/>
          {preview ? (
            <div className="space-y-3">
              <img src={preview} alt="preview" className="w-full max-h-[40vh] object-contain rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900"/>
              <div className="flex gap-2">
                <button onClick={()=>fileRef.current.click()} data-testid="scan-replace" className="btn-outline flex-1"><Upload size={14}/>Replace</button>
                <button onClick={()=>{setFile(null);setPreview(null);setAnswer(null);}} data-testid="scan-clear" className="btn-outline">Clear</button>
              </div>
            </div>
          ) : (
            <button onClick={()=>fileRef.current.click()} data-testid="scan-upload"
              className="w-full border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl p-10 flex flex-col items-center gap-3 hover:bg-slate-50 dark:hover:bg-zinc-900 transition">
              <ImageIcon size={36} className="text-primary" strokeWidth={1.8}/>
              <p className="font-semibold">Tap to upload an image</p>
              <p className="text-xs text-ink-muted dark:text-slate-400">JPG / PNG • Up to 8 MB • Try natural light</p>
            </button>
          )}

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted dark:text-slate-400 mb-2">Explanation style</p>
            <div className="grid grid-cols-2 gap-2">
              {MODES.map((m) => (
                <button key={m.id} onClick={()=>setMode(m.id)} data-testid={`scan-mode-${m.id}`}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-2 text-sm transition ${
                    mode===m.id ? "bg-primary text-white border-primary":"border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900"
                  }`}>
                  <m.icon size={16}/>{m.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={scan} disabled={loading || !file} data-testid="scan-go" className="btn-primary w-full mt-5 disabled:opacity-50">
            {loading ? <><Loader2 size={16} className="animate-spin"/> Scanning…</> : <><Sparkles size={16}/> Explain it</>}
          </button>
        </div>

        <div className="card-surface p-5 min-h-[60vh]">
          {!answer && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-center text-ink-muted dark:text-slate-400">
              <Sparkles size={28} className="text-primary mb-3"/>
              <p className="font-semibold text-ink dark:text-slate-200">Ready when you are</p>
              <p className="text-xs mt-1 max-w-sm">Your AI explanation will appear here with steps, formulas highlighted, and a memory tip.</p>
            </div>
          )}
          {loading && (
            <div className="h-full flex flex-col items-center justify-center text-ink-muted">
              <Loader2 className="animate-spin text-primary mb-3" size={28}/>
              <p>Reading your homework…</p>
            </div>
          )}
          {answer && (
            <article className="prose prose-sm max-w-none">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-bold text-xl">Solution</h3>
                <button onClick={toggleSpeak} data-testid="scan-speak" className="btn-outline !py-2 !px-3 text-xs">
                  {speaking ? <><VolumeX size={14}/>Stop</> : <><Volume2 size={14}/>Read aloud</>}
                </button>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink dark:text-slate-100" data-testid="scan-answer">{answer}</pre>
            </article>
          )}
        </div>
      </div>
    </div>
  );
}
