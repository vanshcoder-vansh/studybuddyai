import React, { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { toast } from "sonner";
import { speak, stopSpeak } from "../lib/utils";
import { Send, MessagesSquare, Sparkles, Volume2, VolumeX, BookOpen, Loader2 } from "lucide-react";

const SUBJECTS = ["Math","Science","Physics","Chemistry","Biology","English","Social Science","Computer","General"];
const STYLES = [
  { id: "short", label: "Short" },
  { id: "detailed", label: "Detailed" },
  { id: "exam", label: "Exam-style" },
];
const LANGS = ["English","Hindi","Hinglish"];

export default function DoubtSolver() {
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hi! I'm StudyBuddy. What's the doubt today? Type a question, or paste a problem." },
  ]);
  const [input, setInput] = useState("");
  const [subject, setSubject] = useState("General");
  const [style, setStyle] = useState("detailed");
  const [language, setLanguage] = useState("English");
  const [sessionId, setSessionId] = useState(null);
  const [sending, setSending] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, sending]);

  const send = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setSending(true);
    try {
      const { data } = await api.post("/chat", { message: text, session_id: sessionId, subject, style, language });
      setSessionId(data.session_id);
      setMessages((m) => [...m, { role: "ai", text: data.answer }]);
    } catch (e) {
      toast.error("Couldn't reach AI right now. Try again.");
    } finally {
      setSending(false);
    }
  };

  const toggleSpeak = (text) => {
    if (speaking) { stopSpeak(); setSpeaking(false); return; }
    setSpeaking(true);
    speak(text, { lang: language === "Hindi" ? "hi-IN" : "en-IN" });
    setTimeout(() => setSpeaking(false), Math.max(4000, text.length * 35));
  };

  return (
    <div className="space-y-4 animate-fade-up">
      <header className="flex flex-col gap-2">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl bg-secondary/15 text-secondary grid place-items-center"><MessagesSquare size={20} strokeWidth={2.5}/></span>
          Doubt Solver
        </h1>
        <p className="text-ink-muted dark:text-slate-400 text-sm">Ask any subject question. Choose how you want the answer.</p>
      </header>

      <div className="card-surface p-3 flex flex-wrap gap-2 items-center sticky top-16 lg:top-3 z-10">
        <select value={subject} onChange={(e)=>setSubject(e.target.value)} data-testid="doubt-subject" className="rounded-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-medium">
          {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <div className="flex bg-slate-100 dark:bg-zinc-900 rounded-full p-1">
          {STYLES.map((s) => (
            <button key={s.id} onClick={()=>setStyle(s.id)} data-testid={`doubt-style-${s.id}`}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition ${style===s.id?"bg-primary text-white":"text-slate-600 dark:text-slate-300"}`}>{s.label}</button>
          ))}
        </div>
        <select value={language} onChange={(e)=>setLanguage(e.target.value)} data-testid="doubt-lang" className="rounded-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-medium">
          {LANGS.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="card-surface p-4 sm:p-6 min-h-[55vh] flex flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role==="user"?"justify-end":"justify-start"}`}>
              {m.role==="ai" && (
                <div className="w-8 h-8 rounded-2xl bg-primary text-white grid place-items-center shrink-0"><Sparkles size={14}/></div>
              )}
              <div className={`max-w-[78%] rounded-3xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role==="user" ? "bg-primary text-white rounded-tr-md" : "bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-tl-md"
              }`}>
                {m.text}
                {m.role==="ai" && i>0 && (
                  <button onClick={()=>toggleSpeak(m.text)} data-testid={`speak-${i}`} className="ml-2 inline-flex items-center text-xs font-medium text-primary mt-2 hover:underline">
                    {speaking ? <VolumeX size={14} className="mr-1"/> : <Volume2 size={14} className="mr-1"/>}
                    {speaking ? "Stop" : "Read aloud"}
                  </button>
                )}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-2xl bg-primary text-white grid place-items-center"><Sparkles size={14}/></div>
              <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl rounded-tl-md px-4 py-3 text-sm flex items-center gap-2 text-ink-muted">
                <Loader2 size={14} className="animate-spin"/> Thinking…
              </div>
            </div>
          )}
          <div ref={endRef}/>
        </div>

        <div className="mt-4 flex gap-2">
          <textarea
            value={input}
            onChange={(e)=>setInput(e.target.value)}
            onKeyDown={(e)=>{ if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Type your doubt… e.g. 'Explain Newton's second law with example'"
            rows={2}
            data-testid="doubt-input"
            className="input-field resize-none"
          />
          <button onClick={send} disabled={sending || !input.trim()} data-testid="doubt-send" className="btn-primary !rounded-2xl !px-5 !py-3 self-stretch disabled:opacity-50">
            <Send size={16}/>
          </button>
        </div>
      </div>
    </div>
  );
}
