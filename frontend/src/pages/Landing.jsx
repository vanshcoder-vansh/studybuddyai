import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import {
  Sparkles, ScanLine, MessagesSquare, NotebookPen, GraduationCap,
  CalendarDays, Trophy, Flame, Gem, ArrowRight, Check, Sun, Moon,
  Star, Brain, Zap, Heart, ChevronDown,
} from "lucide-react";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
function loginWithGoogle() {
  const redirectUrl = window.location.origin + "/dashboard";
  window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
}

const FEATURES = [
  { icon: ScanLine, title: "Homework Scanner", desc: "Snap a photo. Get a clear step-by-step explanation in seconds.", color: "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300" },
  { icon: MessagesSquare, title: "AI Doubt Solver", desc: "Ask anything – Math, Science, English. Choose short, detailed or exam-style answers.", color: "bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300" },
  { icon: NotebookPen, title: "Smart Notes", desc: "Chapter notes, mind maps, flashcards, formulas — generated in one tap.", color: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300" },
  { icon: GraduationCap, title: "AI Test Generator", desc: "Timed mock tests with auto-grading and AI feedback after every quiz.", color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300" },
  { icon: CalendarDays, title: "Smart Planner", desc: "AI builds your day-wise study plan around your exam date and weak topics.", color: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300" },
  { icon: Trophy, title: "Gamified Learning", desc: "Earn XP, build streaks, unlock badges and climb the leaderboard.", color: "bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300" },
];

const TESTIMONIALS = [
  { name: "Aarav S.", grade: "Class 10 CBSE", text: "I used to take 2 hours on Math homework. With StudyBuddy I finish in 30 mins and actually understand it.", rating: 5 },
  { name: "Priya K.", grade: "Class 12 ICSE", text: "The Hinglish explanations are a game changer. Feels like talking to my smart cousin, not a textbook.", rating: 5 },
  { name: "Rohan M.", grade: "Class 9 CBSE", text: "Streaks made me study daily for 47 days straight. My Science marks jumped 18%.", rating: 5 },
];

const PRICING = [
  {
    name: "Free", price: "₹0", period: "forever", desc: "Perfect to try it out",
    features: ["10 AI doubts per day", "5 homework scans per day", "Basic notes & tests", "Streaks & XP", "1 study plan"],
    cta: "Start Free", highlight: false,
  },
  {
    name: "Pro", price: "₹199", period: "/ month", desc: "Most popular for serious students",
    features: ["Unlimited AI doubts", "Unlimited homework scans", "Voice explanations", "Full mock tests + analytics", "Premium chapter notes (PDF)", "AI Voice Tutor", "Priority support"],
    cta: "Go Pro", highlight: true,
  },
];

const FAQ = [
  { q: "Which classes and boards do you support?", a: "Grades 6 to 12, with first-class support for CBSE and ICSE. Other boards work too — just tell us your syllabus." },
  { q: "Is StudyBuddy really free?", a: "Yes. The Free plan gives you generous daily usage of every core feature. Upgrade only when you want unlimited usage and advanced features." },
  { q: "Can I learn in Hindi or Hinglish?", a: "Absolutely. Every explanation, note and chat reply can switch between English, Hindi or Hinglish — one tap." },
  { q: "How does the AI know my syllabus?", a: "When you sign up you tell us your class and board. Our AI is tuned for NCERT, CBSE and ICSE patterns and quotes the right chapters." },
  { q: "Is my data safe?", a: "Yes. We never sell your data. Photos of homework are processed securely and not used to train public models." },
];

export default function Landing() {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = React.useState(0);

  const cta = () => {
    if (user) navigate("/dashboard");
    else loginWithGoogle();
  };

  return (
    <div className="min-h-screen bg-bg dark:bg-bg-dark text-ink dark:text-slate-100">
      {/* Nav */}
      <header className="sticky top-0 z-40 glass">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-primary text-white grid place-items-center font-display font-extrabold text-lg shadow-lg shadow-primary/30">S</div>
            <span className="font-display font-extrabold text-xl tracking-tight">StudyBuddy<span className="text-primary">.</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-700 dark:text-slate-300">
            <a href="#features" className="hover:text-primary transition">Features</a>
            <a href="#pricing" className="hover:text-primary transition">Pricing</a>
            <a href="#testimonials" className="hover:text-primary transition">Loved by students</a>
            <a href="#faq" className="hover:text-primary transition">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={toggle} data-testid="landing-theme-toggle" className="w-10 h-10 rounded-full grid place-items-center hover:bg-slate-100 dark:hover:bg-zinc-800 transition">
              {theme === "dark" ? <Sun size={16}/> : <Moon size={16}/>}
            </button>
            <button onClick={cta} data-testid="hero-cta" className="btn-primary">
              {user ? "Open app" : "Sign in with Google"} <ArrowRight size={16}/>
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden mesh-bg">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-14 pb-20 lg:pt-20 lg:pb-28 grid lg:grid-cols-12 gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="lg:col-span-7"
          >
            <span className="chip mb-5"><Sparkles size={12} className="text-primary"/> Built for CBSE & ICSE • Grades 6–12</span>
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05]">
              Your AI study buddy.<br/>
              <span className="text-primary">Score higher,</span> stress less.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-ink-muted dark:text-slate-400 max-w-xl leading-relaxed">
              Snap homework, ask doubts in Hinglish, generate notes & mock tests — all in one premium app made for Indian students.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <button onClick={cta} data-testid="hero-get-started" className="btn-primary !py-3.5 !px-7 text-base">
                {user ? "Open dashboard" : "Get started — it's free"} <ArrowRight size={18}/>
              </button>
              <a href="#features" className="btn-outline !py-3.5 !px-7 text-base">See features</a>
            </div>
            <div className="mt-7 flex flex-wrap gap-4 text-xs text-ink-muted dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-accent-green"/> No credit card</span>
              <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-accent-green"/> English • Hindi • Hinglish</span>
              <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-accent-green"/> Used by 12,000+ students</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.1 }}
            className="lg:col-span-5 relative"
          >
            <div className="absolute -inset-8 bg-gradient-to-tr from-primary/20 via-accent-yellow/10 to-secondary/20 blur-3xl rounded-full" />
            <div className="relative card-surface p-5 rounded-3xl">
              <img
                src="https://static.prod-images.emergentagent.com/jobs/d3b249f1-897a-4782-a58b-b8a4cfaf5386/images/b65acc2192133249bb27ae0678df59cd6f70c966478846c91c19faa2e7fc700f.png"
                alt="Lightbulb over open book"
                className="w-full rounded-2xl object-cover"
              />
              <div className="absolute -bottom-4 -right-4 flex flex-col gap-2">
                <div className="card-surface !rounded-2xl px-3 py-2 flex items-center gap-2">
                  <Flame size={16} className="text-accent-flame"/>
                  <span className="text-sm font-semibold">47-day streak</span>
                </div>
                <div className="card-surface !rounded-2xl px-3 py-2 flex items-center gap-2">
                  <Gem size={16} className="text-accent-gem"/>
                  <span className="text-sm font-semibold">+520 XP today</span>
                </div>
              </div>
              <div className="absolute -top-3 -left-3 card-surface !rounded-2xl px-3 py-2 flex items-center gap-2">
                <Trophy size={16} className="text-accent-gold"/>
                <span className="text-sm font-semibold">Topper Mode</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-slate-200 dark:border-zinc-800 bg-surface dark:bg-zinc-950">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { v: "12K+", l: "Active students" },
            { v: "850K+", l: "Doubts solved" },
            { v: "4.9★", l: "App rating" },
            { v: "+18%", l: "Avg marks lift" },
          ].map((s, i) => (
            <div key={i} data-testid={`stat-${i}`}>
              <p className="font-display font-extrabold text-2xl sm:text-3xl">{s.v}</p>
              <p className="text-xs text-ink-muted dark:text-slate-400 mt-1">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="max-w-2xl">
            <span className="overline text-primary text-xs font-bold uppercase tracking-[0.2em]">Everything you need</span>
            <h2 className="mt-2 font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight">One app. Every subject. Every exam.</h2>
            <p className="mt-3 text-ink-muted dark:text-slate-400">From last-minute revision to year-long planning — StudyBuddy adapts to your style.</p>
          </div>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
            {FEATURES.map((f) => (
              <div key={f.title} data-testid={`feature-${f.title.toLowerCase().replace(/\s+/g,'-')}`} className="card-surface p-6">
                <div className={`w-12 h-12 rounded-2xl ${f.color} grid place-items-center mb-4`}>
                  <f.icon size={22} strokeWidth={2.5}/>
                </div>
                <h3 className="font-display font-bold text-xl">{f.title}</h3>
                <p className="mt-2 text-sm text-ink-muted dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase */}
      <section className="py-20 bg-surface dark:bg-zinc-950 border-y border-slate-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 order-2 lg:order-1">
            <img
              src="https://static.prod-images.emergentagent.com/jobs/d3b249f1-897a-4782-a58b-b8a4cfaf5386/images/8aa3102fa4781d3963eefd3b83bd29ea267fd0bbcf8ae22426993c712cba2b07.png"
              alt="Study desk"
              className="w-full rounded-3xl object-cover"
            />
          </div>
          <div className="lg:col-span-6 order-1 lg:order-2">
            <span className="overline text-primary text-xs font-bold uppercase tracking-[0.2em]">Smart Planner</span>
            <h2 className="mt-2 font-display font-extrabold text-3xl sm:text-4xl tracking-tight">Built to fit <span className="text-primary">your life</span>, not a textbook.</h2>
            <p className="mt-4 text-ink-muted dark:text-slate-400">Tell StudyBuddy when your exam is and how much you can study daily. Get a smart, day-by-day plan that focuses on your weak topics first.</p>
            <ul className="mt-6 space-y-3">
              {["Day-wise schedule auto-generated by AI", "Reminders for daily goals", "Adapts when you fall behind", "Tracks completion and rewards you with XP"].map((t, i) => (
                <li key={i} className="flex items-start gap-3 text-sm"><Check className="text-accent-green mt-0.5" size={18}/><span>{t}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="max-w-2xl">
            <span className="overline text-primary text-xs font-bold uppercase tracking-[0.2em]">Loved by students</span>
            <h2 className="mt-2 font-display font-extrabold text-3xl sm:text-4xl tracking-tight">Stories from real toppers in the making.</h2>
          </div>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="card-surface p-6">
                <div className="flex items-center gap-1 mb-3 text-accent-gold">
                  {Array.from({ length: t.rating }).map((_, j) => (<Star key={j} size={14} fill="currentColor"/>))}
                </div>
                <p className="text-sm leading-relaxed">"{t.text}"</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-secondary/15 text-secondary grid place-items-center font-bold">{t.name.charAt(0)}</div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-ink-muted dark:text-slate-400">{t.grade}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-surface dark:bg-zinc-950 border-y border-slate-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <span className="overline text-primary text-xs font-bold uppercase tracking-[0.2em]">Pricing</span>
            <h2 className="mt-2 font-display font-extrabold text-3xl sm:text-4xl tracking-tight">Start free. Go Pro when you're ready.</h2>
            <p className="mt-3 text-ink-muted dark:text-slate-400">No hidden fees. Cancel anytime.</p>
          </div>
          <div className="mt-12 grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {PRICING.map((p) => (
              <div key={p.name} data-testid={`price-${p.name.toLowerCase()}`} className={`relative rounded-3xl p-7 ${p.highlight ? "bg-ink text-white dark:bg-primary" : "card-surface"}`}>
                {p.highlight && (<span className="absolute -top-3 right-6 chip bg-accent-yellow text-ink !text-[10px]">MOST POPULAR</span>)}
                <p className={`text-sm font-semibold ${p.highlight ? "text-white/80" : "text-ink-muted dark:text-slate-400"}`}>{p.name}</p>
                <p className="mt-3"><span className="font-display font-extrabold text-4xl">{p.price}</span><span className={`text-sm ${p.highlight ? "text-white/70" : "text-ink-muted"}`}> {p.period}</span></p>
                <p className={`mt-1 text-sm ${p.highlight ? "text-white/80" : "text-ink-muted dark:text-slate-400"}`}>{p.desc}</p>
                <ul className="mt-6 space-y-2.5">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check size={16} className={p.highlight ? "text-accent-yellow" : "text-accent-green"} />
                      <span className={p.highlight ? "text-white/95" : ""}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={cta} data-testid={`cta-${p.name.toLowerCase()}`} className={`mt-7 w-full ${p.highlight ? "bg-white text-ink hover:bg-white/95" : "btn-primary"} rounded-full font-semibold py-3 transition active:scale-95`}>
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <span className="overline text-primary text-xs font-bold uppercase tracking-[0.2em]">FAQ</span>
          <h2 className="mt-2 font-display font-extrabold text-3xl sm:text-4xl tracking-tight">Questions, answered.</h2>
          <div className="mt-8 space-y-3">
            {FAQ.map((f, i) => (
              <button
                key={i}
                onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                data-testid={`faq-${i}`}
                className="w-full text-left card-surface p-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="font-semibold">{f.q}</p>
                  <ChevronDown size={18} className={`transition-transform ${openFaq === i ? "rotate-180" : ""}`}/>
                </div>
                {openFaq === i && (
                  <p className="mt-3 text-sm text-ink-muted dark:text-slate-400 leading-relaxed">{f.a}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center card-surface !rounded-[2rem] p-10 mesh-bg">
          <div className="inline-flex items-center gap-1 chip mb-4"><Heart size={12} className="text-primary"/> Made in India</div>
          <h2 className="font-display font-extrabold text-3xl sm:text-5xl tracking-tight">Ready to study smarter?</h2>
          <p className="mt-3 text-ink-muted dark:text-slate-300">Join thousands of students who finally enjoy learning.</p>
          <button onClick={cta} data-testid="final-cta" className="btn-primary !py-3.5 !px-7 text-base mt-6">
            {user ? "Open dashboard" : "Start free with Google"} <ArrowRight size={18}/>
          </button>
        </div>
      </section>

      <footer className="py-10 border-t border-slate-200 dark:border-zinc-800 text-center text-sm text-ink-muted dark:text-slate-400">
        © {new Date().getFullYear()} StudyBuddy AI — Built with <Heart size={12} className="inline text-primary"/> for students.
      </footer>
    </div>
  );
}
