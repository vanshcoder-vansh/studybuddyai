import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { toast } from "sonner";
import { downloadText } from "../lib/utils";
import { NotebookPen, Sparkles, Loader2, Download, Trash2, Plus, FileText } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const STYLES = [
  { id: "short", label: "Short" },
  { id: "detailed", label: "Detailed" },
  { id: "bullets", label: "Bullets" },
  { id: "flashcards", label: "Flashcards" },
  { id: "mindmap", label: "Mind map" },
  { id: "formulas", label: "Formulas" },
  { id: "revision", label: "One-shot revision" },
];

export default function Notes() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [active, setActive] = useState(null);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    subject: user?.subjects?.[0] || "Science",
    chapter: "",
    style: "short",
    language: user?.language || "English",
  });

  const load = async () => {
    const { data } = await api.get("/notes");
    setList(data);
    if (data[0] && !active) setActive(data[0]);
  };
  useEffect(() => { load(); }, []);

  const generate = async () => {
    if (!form.chapter.trim()) return toast.error("Enter a chapter or topic");
    setCreating(true);
    try {
      const { data } = await api.post("/notes", {
        ...form,
        class_grade: user?.class_grade || "10",
        board: user?.board || "CBSE",
      });
      setList((l) => [data, ...l]);
      setActive(data);
      setShowForm(false);
      toast.success("Notes ready! +15 XP");
    } catch (e) { toast.error("Couldn't generate notes."); }
    finally { setCreating(false); }
  };

  const del = async (id) => {
    if (!confirm("Delete this note?")) return;
    await api.delete(`/notes/${id}`);
    setList((l) => l.filter(n => n.note_id !== id));
    if (active?.note_id === id) setActive(null);
    toast.success("Note deleted");
  };

  return (
    <div className="space-y-4 animate-fade-up">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300 grid place-items-center"><NotebookPen size={20} strokeWidth={2.5}/></span>
            Smart Notes
          </h1>
          <p className="text-ink-muted dark:text-slate-400 text-sm mt-1">Generate chapter notes, flashcards, mind maps and more.</p>
        </div>
        <button onClick={()=>setShowForm(true)} data-testid="note-new" className="btn-primary"><Plus size={16}/>New notes</button>
      </header>

      {showForm && (
        <div className="card-surface p-5 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-ink-muted dark:text-slate-400">Subject</label>
              <input value={form.subject} onChange={(e)=>setForm({...form, subject: e.target.value})} className="input-field mt-1" placeholder="e.g. Science" data-testid="note-subject"/>
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-muted dark:text-slate-400">Chapter / Topic</label>
              <input value={form.chapter} onChange={(e)=>setForm({...form, chapter: e.target.value})} className="input-field mt-1" placeholder="e.g. Light - Reflection" data-testid="note-chapter"/>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {STYLES.map((s) => (
              <button key={s.id} onClick={()=>setForm({...form, style: s.id})} data-testid={`note-style-${s.id}`}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${form.style===s.id?"bg-primary text-white border-primary":"border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900"}`}>
                {s.label}
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={()=>setShowForm(false)} data-testid="note-cancel" className="btn-ghost">Cancel</button>
            <button onClick={generate} disabled={creating} data-testid="note-generate" className="btn-primary disabled:opacity-50">
              {creating ? <><Loader2 size={16} className="animate-spin"/> Generating…</> : <><Sparkles size={16}/> Generate</>}
            </button>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <aside className="lg:col-span-1 space-y-2 max-h-[70vh] overflow-y-auto pr-1">
          {list.length === 0 && !showForm && (
            <div className="card-surface p-6 text-center">
              <FileText className="mx-auto text-primary mb-2" size={28}/>
              <p className="font-semibold">No notes yet</p>
              <p className="text-xs text-ink-muted dark:text-slate-400 mt-1">Click "New notes" to generate your first one.</p>
            </div>
          )}
          {list.map((n) => (
            <button key={n.note_id} onClick={()=>setActive(n)} data-testid={`note-item-${n.note_id}`}
              className={`w-full text-left p-4 rounded-2xl border transition ${active?.note_id===n.note_id?"bg-primary/10 border-primary":"border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900"}`}>
              <p className="font-semibold text-sm line-clamp-1">{n.chapter}</p>
              <p className="text-xs text-ink-muted dark:text-slate-400 mt-0.5">{n.subject} • {n.style}</p>
              <p className="text-[10px] text-ink-muted dark:text-slate-500 mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
            </button>
          ))}
        </aside>

        <article className="lg:col-span-2 card-surface p-5 min-h-[60vh]">
          {!active ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-ink-muted dark:text-slate-400">
              <NotebookPen size={32} className="text-primary mb-3"/>
              <p>Select a note to read.</p>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h2 className="font-display font-extrabold text-2xl tracking-tight">{active.chapter}</h2>
                  <p className="text-sm text-ink-muted dark:text-slate-400">{active.subject} • {active.style} notes • Class {active.class_grade} {active.board}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>downloadText(active.content, `${active.chapter}.txt`)} data-testid="note-download" className="btn-outline !py-2 !px-3 text-xs"><Download size={14}/>Download</button>
                  <button onClick={()=>del(active.note_id)} data-testid="note-delete" className="btn-outline !py-2 !px-3 text-xs text-red-500"><Trash2 size={14}/></button>
                </div>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink dark:text-slate-100" data-testid="note-content">{active.content}</pre>
            </>
          )}
        </article>
      </div>
    </div>
  );
}
