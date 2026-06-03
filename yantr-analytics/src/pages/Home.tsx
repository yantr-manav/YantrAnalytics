import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  Target,
  Crosshair,
  Radar,
  Anchor,
  CalendarDays,
  FlaskConical,
  Search,
  ArrowRight,
  GitFork,
  Sparkles,
  DollarSign,
  Timer,
  Unlock,
  BrainCircuit,
} from 'lucide-react'
import Logo from '../components/Logo'
import Icon3D from '../components/Icon3D'
import HeroScene from '../components/three/HeroScene'
import { bareHandle } from '../lib/format'

const FEATURES = [
  { icon: Target, color: '#3ce0a0', label: 'Viral Score', desc: 'A 0–100 virality probability modelled from engagement patterns and format mix.' },
  { icon: Crosshair, color: '#34d3ee', label: 'Competitor Intel', desc: 'Benchmark against the top channels in your niche — see exactly where you win and lose.' },
  { icon: Radar, color: '#f6b352', label: 'Trend Radar', desc: 'Catch rising YouTube search queries before they peak and saturate.' },
  { icon: Anchor, color: '#8b7bf0', label: 'Hook Analysis', desc: 'Transcript-level scoring of your opening seconds — the make-or-break retention window.' },
  { icon: CalendarDays, color: '#5b9dff', label: '30-Day Calendar', desc: 'An AI publishing schedule built from competitor cadence and live niche trends.' },
  { icon: FlaskConical, color: '#fb6f7d', label: 'CTR Lab', desc: 'Five title variations, A/B-ranked by psychological hook type and keyword density.' },
]

const STATS = [
  { icon: DollarSign, value: '$0', label: 'Pipeline cost' },
  { icon: Timer, value: '~60s', label: 'Per analysis' },
  { icon: Unlock, value: '100%', label: 'Public data' },
  { icon: BrainCircuit, value: 'Gemini', label: 'AI engine' },
]

const STEPS = [
  { n: '01', title: 'Paste a handle', desc: 'Drop in any public YouTube @handle — no login, no API key.' },
  { n: '02', title: 'We harvest & synthesize', desc: 'Channel data, competitors and trends are gathered in parallel, then read by AI.' },
  { n: '03', title: 'Get the blueprint', desc: 'A full intelligence report: scores, charts, competitor gaps and a 7-day action plan.' },
]

const EXAMPLES = ['MrBeast', 'mkbhd', 'veritasium', 'kurzgesagt', 'lexfridman']
const MIN_LEN = 3

export default function Home() {
  const [handle, setHandle] = useState('')
  const [focused, setFocused] = useState(false)
  const [touched, setTouched] = useState(false)
  const [exampleIdx, setExampleIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 500], [0, -70])
  const heroFade = useTransform(scrollY, [0, 380], [1, 0.35])

  useEffect(() => {
    const id = setInterval(() => setExampleIdx((i) => (i + 1) % EXAMPLES.length), 2600)
    return () => clearInterval(id)
  }, [])

  const bare = bareHandle(handle)
  const isValid = bare.length >= MIN_LEN
  const showError = touched && handle.length > 0 && !isValid

  const submit = () => {
    setTouched(true)
    if (isValid) navigate(`/analyze/${bare}`)
  }

  return (
    <div className="grain relative min-h-screen overflow-x-clip">
      {/* ── Atmosphere ── */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="grid-bg absolute inset-0" />
        <div
          className="absolute -left-[15%] -top-[10%] h-[55vw] w-[55vw] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(60,224,160,0.10), transparent 68%)', animation: 'glow-pulse 9s ease-in-out infinite' }}
        />
        <div
          className="absolute -right-[12%] top-[35%] h-[48vw] w-[48vw] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(52,211,238,0.08), transparent 68%)', animation: 'glow-pulse 12s ease-in-out infinite 3s' }}
        />
      </div>

      {/* ── Nav ── */}
      <motion.nav
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-50 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8"
      >
        <Logo badge="Ultra" />
        <div className="flex items-center gap-1 sm:gap-2">
          <a href="#features" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-ink-mid transition-colors hover:text-ink md:block">
            Features
          </a>
          <a href="#how" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-ink-mid transition-colors hover:text-ink md:block">
            How it works
          </a>
          <button
            onClick={() => inputRef.current?.focus()}
            className="group inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-border-strong)] bg-white/[0.03] px-4 py-2 text-sm font-bold text-ink transition-all hover:border-signal/50 hover:bg-white/[0.06]"
          >
            Get started
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </motion.nav>

      {/* ── Hero ── */}
      <motion.section
        style={{ y: heroY, opacity: heroFade }}
        className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-5 pb-24 pt-10 sm:px-8 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8"
      >
        {/* Left */}
        <div className="min-w-0 max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-signal/20 bg-signal/[0.06] px-3.5 py-1.5"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-signal" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-signal">AI Creator Intelligence</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-balance text-[clamp(2.7rem,6.5vw,4.8rem)] leading-[0.95] text-ink"
          >
            Read the <span className="gradient-text">signal</span> in any YouTube channel.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-6 max-w-lg text-base leading-relaxed text-ink-mid sm:text-lg"
          >
            YantrAnalytics turns any channel into a precision intelligence report — viral scoring,
            competitor benchmarking, trend radar and an AI growth blueprint, in under 60 seconds.
          </motion.p>

          {/* Input */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42, duration: 0.6 }}
            className="mt-9"
          >
            <label htmlFor="handle" className="sr-only">YouTube channel handle</label>
            <div
              className="flex items-center gap-2 rounded-2xl border bg-white/[0.025] p-2 transition-all duration-300"
              style={{
                borderColor: showError ? '#fb6f7d66' : focused ? '#3ce0a080' : 'var(--color-border-strong)',
                boxShadow: focused ? '0 0 0 4px rgba(60,224,160,0.10)' : 'none',
              }}
            >
              <Search size={18} className="ml-2 shrink-0 text-ink-low" />
              <span className="select-none font-mono text-ink-low">@</span>
              <input
                id="handle"
                ref={inputRef}
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => { setFocused(false); setTouched(true) }}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder={EXAMPLES[exampleIdx]}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                aria-invalid={showError}
                className="min-w-0 flex-1 bg-transparent py-2 text-base font-semibold text-ink outline-none placeholder:text-ink-faint"
              />
              <button
                onClick={submit}
                disabled={!isValid}
                className="group inline-flex shrink-0 items-center gap-1.5 rounded-xl px-5 py-3 text-sm font-bold text-[#06120d] transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35 sm:px-6"
                style={{
                  background: 'linear-gradient(135deg, #3ce0a0, #34d3ee)',
                  boxShadow: isValid ? '0 10px 28px -8px rgba(60,224,160,0.55)' : 'none',
                }}
              >
                Analyze
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
            <p className="mt-2 h-4 pl-2 text-xs" aria-live="polite">
              {showError ? (
                <span className="text-rose">Enter at least {MIN_LEN} characters.</span>
              ) : (
                <span className="text-ink-faint">Any public channel — try a handle below.</span>
              )}
            </p>
          </motion.div>

          {/* Example chips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.56 }}
            className="mt-4 flex flex-wrap items-center gap-2"
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-faint">Try</span>
            {EXAMPLES.slice(0, 4).map((h) => (
              <button
                key={h}
                onClick={() => navigate(`/analyze/${h}`)}
                className="rounded-lg border border-[var(--color-border)] bg-white/[0.03] px-3 py-1.5 font-mono text-xs text-ink-mid transition-all hover:border-signal/30 hover:text-ink"
              >
                @{h}
              </button>
            ))}
          </motion.div>
        </div>

        {/* Right: WebGL hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-center"
        >
          <HeroScene />
        </motion.div>
      </motion.section>

      {/* ── Stats ── */}
      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-28 sm:px-8">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white/[0.04] sm:grid-cols-4">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.08 }}
              className="flex flex-col items-center gap-2 bg-base px-4 py-8 text-center"
            >
              <s.icon size={20} className="text-signal" />
              <div className="font-display text-2xl text-ink">{s.value}</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-low">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative z-10 mx-auto max-w-7xl px-5 pb-32 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          className="mb-12 max-w-2xl"
        >
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.25em] text-signal">The instrument</p>
          <h2 className="font-display text-balance text-3xl leading-tight text-ink sm:text-5xl">
            Everything a creator needs.{' '}
            <span className="text-ink-low">Nothing they don't.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: (i % 3) * 0.08, duration: 0.5 }}
              className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white/[0.02] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-border-strong)]"
            >
              <div
                className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: `radial-gradient(circle, ${f.color}22, transparent 70%)` }}
              />
              <Icon3D icon={f.icon} color={f.color} size={48} />
              <h3 className="mt-5 font-display text-lg text-ink">{f.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-mid">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="relative z-10 mx-auto max-w-7xl px-5 pb-32 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          className="mb-12 max-w-2xl"
        >
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.25em] text-cyan">How it works</p>
          <h2 className="font-display text-balance text-3xl leading-tight text-ink sm:text-5xl">
            From handle to blueprint in three steps.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: i * 0.1 }}
              className="relative rounded-2xl border border-[var(--color-border)] bg-white/[0.02] p-7"
            >
              <span className="font-mono text-sm font-bold text-signal/70">{s.n}</span>
              <h3 className="mt-4 font-display text-xl text-ink">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-mid">{s.desc}</p>
              {i < STEPS.length - 1 && (
                <ArrowRight className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-ink-faint md:block" size={20} />
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-3xl border border-signal/15 p-10 text-center sm:p-16"
          style={{ background: 'linear-gradient(135deg, rgba(60,224,160,0.09), rgba(52,211,238,0.05))' }}
        >
          <div
            className="pointer-events-none absolute left-1/2 top-0 h-52 w-[28rem] -translate-x-1/2 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(ellipse, rgba(60,224,160,0.16), transparent)' }}
          />
          <div className="relative">
            <Sparkles className="mx-auto mb-5 text-signal" size={26} />
            <h2 className="font-display text-balance text-3xl leading-tight text-ink sm:text-5xl">
              Run your first audit. It's free.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-ink-mid">
              See any channel through the lens of AI-powered competitive intelligence. No signup, no key.
            </p>
            <button
              onClick={() => { inputRef.current?.focus(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              className="group mx-auto mt-9 inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold text-[#06120d] transition-all active:scale-[0.97]"
              style={{ background: 'linear-gradient(135deg, #3ce0a0, #34d3ee)', boxShadow: '0 12px 32px -8px rgba(60,224,160,0.5)' }}
            >
              Start an analysis
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-[var(--color-border)] px-5 py-8 sm:flex-row sm:px-8">
        <Logo size={28} />
        <p className="text-center text-[11px] text-ink-low">
          Built with FastAPI · Gemini AI · yt-dlp · Public YouTube data only
        </p>
        <div className="flex items-center gap-4 text-ink-low">
          <a href="#features" className="text-xs transition-colors hover:text-ink-mid">Features</a>
          <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub repository" className="transition-colors hover:text-ink-mid">
            <GitFork size={16} />
          </a>
        </div>
      </footer>
    </div>
  )
}
