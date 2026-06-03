import { useState, useEffect, useRef, useId } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import mermaid from 'mermaid'
import createPlotlyComponentImport from 'react-plotly.js/factory'
import PlotlyBasic from 'plotly.js-basic-dist'
import toast from 'react-hot-toast'
import {
  LayoutDashboard,
  Swords,
  TrendingUp,
  FileText,
  Wrench,
  Target,
  Anchor,
  Eye,
  MessageCircle,
  ArrowLeft,
  Users,
  Satellite,
  Crosshair,
  BrainCircuit,
  AlertTriangle,
  Download,
  CalendarDays,
  Type,
  ExternalLink,
  Flame,
  Loader2,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { useAnalysis } from '../hooks/useAnalysis'
import { testTitles, generateCalendar, exportPdf } from '../api/client'
import type { FullAnalysis, TitleVariation, CalendarEntry } from '../types'
import {
  palette,
  chartColors,
  plotlyLayout as sharedLayout,
  plotlyConfig,
  scoreColor,
  scoreLabel,
} from '../lib/theme'
import { compact, bareHandle, normalizeHandle } from '../lib/format'
import { BrandMark } from '../components/Logo'

mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    primaryColor: '#11141d',
    primaryTextColor: '#f3f6fb',
    primaryBorderColor: palette.signal,
    lineColor: palette.cyan,
    secondaryColor: '#0c0e15',
    tertiaryColor: '#0c0e15',
    fontFamily: 'Hanken Grotesk, sans-serif',
    background: '#07080c',
  },
})

type Tab = 'overview' | 'competitors' | 'trends' | 'report' | 'tools'

// Wire react-plotly.js to the lightweight "basic" distribution (bar/pie/scatter
// only) instead of the ~4 MB full bundle — those are the only trace types used.
// Both modules are CJS/UMD; unwrap the interop `.default` defensively before use.
const createPlotlyComponent =
  (createPlotlyComponentImport as unknown as { default?: typeof createPlotlyComponentImport }).default ??
  createPlotlyComponentImport
const PlotComponent = createPlotlyComponent(
  (PlotlyBasic as unknown as { default?: object }).default ?? PlotlyBasic,
)

const LOADING_STEPS = [
  { icon: Satellite, label: 'Harvesting channel data', sub: 'videos · shorts · community · subscribers' },
  { icon: Crosshair, label: 'Scanning competitors', sub: 'top channels in your niche' },
  { icon: TrendingUp, label: 'Detecting trend signals', sub: 'rising YouTube queries' },
  { icon: BrainCircuit, label: 'AI synthesis', sub: 'master analysis + competitive report' },
  { icon: LayoutDashboard, label: 'Assembling dashboard', sub: 'charts · radar · action plan' },
] as const

// ── Score Ring ──────────────────────────────────────────────────────────────
function ScoreRing({ score, label, size = 104 }: { score: number; label: string; size?: number }) {
  const r = size * 0.38
  const circ = 2 * Math.PI * r
  const safe = Math.min(100, Math.max(0, score || 0))
  const fill = (safe / 100) * circ
  const color = scoreColor(safe)
  const id = `ring-${label.replace(/\s/g, '')}`
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor={color + 'aa'} />
            </linearGradient>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#161a25" strokeWidth="8" />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={`url(#${id})`}
            strokeWidth="8"
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            strokeDasharray={`${circ} ${circ}`}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - fill }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          />
          <text x={size / 2} y={size / 2 - 3} textAnchor="middle" fill="#f3f6fb" fontSize={size * 0.22} fontWeight="800" fontFamily="JetBrains Mono">
            {safe}
          </text>
          <text x={size / 2} y={size / 2 + 14} textAnchor="middle" fill={color} fontSize={size * 0.085} fontWeight="700" letterSpacing="1.5">
            {scoreLabel(safe)}
          </text>
        </svg>
        <div className="pointer-events-none absolute inset-0 rounded-full" style={{ boxShadow: `0 0 32px ${color}22` }} />
      </div>
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-low">{label}</span>
    </div>
  )
}

// ── Stat Bar ──────────────────────────────────────────────────────────────────
function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-medium text-ink-mid">{label}</span>
        <span className="rounded-md px-2 py-0.5 font-mono text-sm font-bold tabular" style={{ color, background: color + '18' }}>
          {value}
          <span className="text-ink-faint">/10</span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#161a25]">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${(value / 10) * 100}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}bb, ${color})` }}
        />
      </div>
    </div>
  )
}

// ── Metric Card ─────────────────────────────────────────────────────────────
function MetricCard({
  label,
  value,
  sub,
  accent = palette.signal,
  icon: Icon,
}: {
  label: string
  value: string | number
  sub?: string
  accent?: string
  icon: LucideIcon
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white/[0.02] p-4 backdrop-blur-sm transition-all duration-300 hover:border-[var(--color-border-strong)] sm:p-5"
    >
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `radial-gradient(circle at 0% 0%, ${accent}12, transparent 60%)` }}
      />
      <div className="relative mb-3 flex items-start justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-low">{label}</p>
        <Icon size={16} style={{ color: accent }} />
      </div>
      <p className="relative font-mono text-2xl font-bold leading-none tabular text-ink sm:text-3xl">{value}</p>
      {sub && <p className="relative mt-1.5 text-[11px] font-medium text-ink-low">{sub}</p>}
      <div className="absolute bottom-0 left-0 h-0.5 w-full opacity-50" style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />
    </motion.div>
  )
}

// ── Mermaid ───────────────────────────────────────────────────────────────────
function MermaidChart({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const reactId = useId()
  const id = `mmd-${reactId.replace(/[^a-zA-Z0-9]/g, '')}`
  useEffect(() => {
    if (!ref.current || !code) return
    let cancelled = false
    mermaid
      .render(id, code)
      .then(({ svg }) => {
        if (!cancelled && ref.current) ref.current.innerHTML = svg
      })
      .catch(() => {
        if (!cancelled && ref.current) ref.current.innerHTML = `<pre class="text-xs text-ink-low p-4 overflow-auto">${code}</pre>`
      })
    return () => {
      cancelled = true
    }
  }, [code, id])
  return <div ref={ref} data-mermaid className="flex w-full justify-center overflow-auto" />
}

// ── Loading ─────────────────────────────────────────────────────────────────
function LoadingWarRoom({ handle }: { handle: string }) {
  const [step, setStep] = useState(0)
  const [secs, setSecs] = useState(0)
  useEffect(() => {
    const stepId = setInterval(() => setStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1)), 9000)
    const tick = setInterval(() => setSecs((s) => s + 1), 1000)
    return () => {
      clearInterval(stepId)
      clearInterval(tick)
    }
  }, [])

  return (
    <div className="grain flex min-h-screen items-center justify-center bg-base p-6">
      <div className="w-full max-w-md">
        <div className="mb-10 flex justify-center">
          <div className="relative h-24 w-24">
            <div
              className="absolute inset-0 animate-spin rounded-full"
              style={{
                background: `conic-gradient(from 0deg, transparent 0%, ${palette.signal} 90%)`,
                WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #fff calc(100% - 2px))',
                mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #fff calc(100% - 2px))',
              }}
            />
            <div className="absolute inset-3 rounded-full border border-cyan/15" />
            <div className="absolute inset-0 grid place-items-center">
              <BrandMark size={36} />
            </div>
          </div>
        </div>

        <h2 className="text-center font-display text-2xl text-ink">War room active</h2>
        <p className="mt-1 text-center text-sm text-ink-mid">
          Scanning <span className="font-semibold text-signal">{handle}</span>
          <span className="mx-2 text-ink-faint">·</span>
          <span className="font-mono tabular text-ink-low">{secs}s</span>
        </p>

        <div className="mt-8 space-y-2.5">
          {LOADING_STEPS.map((s, i) => {
            const done = i < step
            const active = i === step
            const Icon = s.icon
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 rounded-xl border p-3.5 transition-all"
                style={{
                  borderColor: done ? palette.signal + '40' : active ? palette.cyan + '66' : 'var(--color-border)',
                  background: done ? palette.signal + '0e' : active ? palette.cyan + '0e' : 'transparent',
                  opacity: !done && !active ? 0.4 : 1,
                }}
              >
                <div
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full"
                  style={{
                    background: done ? palette.signal + '22' : active ? palette.cyan + '22' : '#161a25',
                    color: done ? palette.signal : active ? palette.cyan : palette.textLow,
                  }}
                >
                  {active ? <Loader2 size={15} className="animate-spin" /> : <Icon size={15} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold" style={{ color: done ? palette.signal : active ? palette.textHi : palette.textLow }}>
                    {s.label}
                  </p>
                  <p className="truncate text-[10px] text-ink-low">{s.sub}</p>
                </div>
                {done && <span className="text-signal">✓</span>}
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Error State ───────────────────────────────────────────────────────────────
function ErrorState({ message }: { message: string }) {
  return (
    <div className="grain flex min-h-screen items-center justify-center bg-base p-6">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-panel relative max-w-md overflow-hidden p-10 text-center"
        style={{ borderColor: palette.rose + '40' }}
      >
        <div className="absolute inset-0 opacity-30" style={{ background: `radial-gradient(ellipse at 50% 0%, ${palette.rose}33, transparent 70%)` }} />
        <div className="relative">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl" style={{ background: palette.rose + '18', color: palette.rose }}>
            <AlertTriangle size={26} />
          </div>
          <h2 className="font-display text-xl text-ink">Analysis failed</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-mid">{message}</p>
          <p className="mt-1 text-xs text-ink-low">The channel may be private, or the handle is incorrect.</p>
          <Link
            to="/"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-signal/90 px-6 py-2.5 text-sm font-bold text-[#06120d] transition-all hover:bg-signal"
          >
            <ArrowLeft size={15} /> Try another handle
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

// ── Section / Badge ─────────────────────────────────────────────────────────
function Section({
  title,
  children,
  action,
  className = '',
}: {
  title?: string
  children: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white/[0.02] backdrop-blur-sm ${className}`}>
      {title && (
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 pb-4 pt-5">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.15em] text-ink-low">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  )
}

function Badge({ children, color = palette.signal }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
      style={{ color, background: color + '15', borderColor: color + '40' }}
    >
      {children}
    </span>
  )
}

const tabFade = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ data }: { data: FullAnalysis }) {
  const profile = data?.profile ?? ({} as FullAnalysis['profile'])
  const analysis = data?.analysis ?? ({} as FullAnalysis['analysis'])
  const allContent = [...(profile?.videos ?? []), ...(profile?.shorts ?? [])].slice(0, 25)

  const radarValues = [
    Number(analysis?.radar_scores?.hook_strength ?? 5),
    Number(analysis?.radar_scores?.visual_quality ?? 5),
    Number(analysis?.radar_scores?.seo ?? 5),
    Number(analysis?.radar_scores?.engagement ?? 5),
    Number(analysis?.radar_scores?.consistency ?? 5),
    Number(analysis?.radar_scores?.community ?? 5),
  ]
  const categories = ['Hook', 'Visual Quality', 'SEO', 'Engagement', 'Consistency', 'Community']
  const radarAvg = Math.round((radarValues.reduce((a, b) => a + b, 0) / radarValues.length) * 10)
  const topKeywords = analysis?.top_keywords ?? []

  return (
    <motion.div {...tabFade} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="AI Intelligence Scores">
          <div className="flex items-center justify-around py-2">
            <ScoreRing score={analysis?.viral_probability_score ?? 0} label="Viral Score" />
            <ScoreRing score={analysis?.hook_score ?? 0} label="Hook Score" />
            <ScoreRing score={radarAvg} label="Overall" />
          </div>
        </Section>

        <Section title="Performance Breakdown">
          <div className="space-y-4">
            {categories.map((cat, i) => (
              <StatBar key={cat} label={cat} value={radarValues[i]} color={chartColors[i % chartColors.length]} />
            ))}
          </div>
        </Section>
      </div>

      {allContent.length > 0 && (
        <Section title="View Velocity">
          <PlotComponent
            data={[
              {
                x: allContent.map((_, i) => i + 1),
                y: allContent.map((v) => v?.views ?? 0),
                type: 'scatter',
                mode: 'lines+markers',
                fill: 'tozeroy',
                line: { color: palette.signal, width: 2, shape: 'spline' },
                fillcolor: 'rgba(60,224,160,0.07)',
                text: allContent.map((v) => (v?.title ?? '').slice(0, 46)),
                marker: {
                  color: allContent.map((v) => (v?.type === 'Short' ? palette.amber : palette.signal)),
                  size: 6,
                },
                hovertemplate: '<b>%{text}</b><br>%{y:,.0f} views<extra></extra>',
              },
            ]}
            layout={{ ...sharedLayout, height: 220, margin: { t: 8, r: 10, b: 36, l: 56 }, showlegend: false }}
            config={plotlyConfig}
            style={{ width: '100%' }}
          />
        </Section>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Section title="Top Performing Content">
          <div className="space-y-1">
            {[...(profile?.videos ?? []), ...(profile?.shorts ?? [])]
              .sort((a, b) => (b?.views ?? 0) - (a?.views ?? 0))
              .slice(0, 5)
              .map((v, i) => (
                <a
                  key={i}
                  href={v?.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-white/[0.04]"
                >
                  <span className="w-5 text-center font-mono text-xs font-bold text-ink-faint">{i + 1}</span>
                  {v?.thumbnail && (
                    <img
                      src={v.thumbnail}
                      alt=""
                      loading="lazy"
                      className="h-9 w-14 shrink-0 rounded-lg object-cover transition group-hover:opacity-90"
                      onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-ink" title={v?.title}>{v?.title}</p>
                    <p className="mt-0.5 font-mono text-[10px] font-semibold tabular text-ink-low">{compact(v?.views)} views</p>
                  </div>
                  <ExternalLink size={13} className="text-ink-faint transition group-hover:text-ink-mid" />
                </a>
              ))}
          </div>
        </Section>

        <Section title="Content Mix">
          <PlotComponent
            data={[
              {
                values: [
                  profile?.stats?.total_videos_scanned ?? 0,
                  profile?.stats?.total_shorts_scanned ?? 0,
                  profile?.stats?.total_posts_scanned ?? 0,
                ],
                labels: ['Long-form', 'Shorts', 'Community'],
                type: 'pie',
                hole: 0.65,
                marker: { colors: [palette.signal, palette.amber, palette.cyan] },
                textinfo: 'label+percent',
                textfont: { color: palette.textMid, size: 11 },
                hovertemplate: '<b>%{label}</b><br>%{value} items<extra></extra>',
              },
            ]}
            layout={{ ...sharedLayout, height: 210, showlegend: false, margin: { t: 8, r: 8, b: 8, l: 8 } }}
            config={plotlyConfig}
            style={{ width: '100%' }}
          />
        </Section>
      </div>

      {topKeywords.length > 0 && (
        <Section title="SEO Keywords">
          <div className="flex flex-wrap gap-2">
            {topKeywords.map((kw: string) => (
              <span
                key={kw}
                className="cursor-default rounded-full border border-signal/30 bg-signal/8 px-3 py-1.5 font-mono text-xs font-semibold text-signal transition-colors hover:bg-signal/15"
              >
                #{kw}
              </span>
            ))}
          </div>
        </Section>
      )}
    </motion.div>
  )
}

// ── Competitors Tab ─────────────────────────────────────────────────────────
function CompetitorsTab({ data }: { data: FullAnalysis }) {
  const { competitors } = data
  if (!competitors?.competitors?.length)
    return <EmptyState icon={Swords} title="No competitor data this time." sub="The competitor scan timed out. Try clearing cache and reanalyzing." />

  const compViews = competitors.competitors.map(
    (c) => (c.recent_videos || []).reduce((s, v) => s + (v.views || 0), 0) / Math.max((c.recent_videos || []).length, 1),
  )

  return (
    <motion.div {...tabFade} className="space-y-4">
      <Section title="Avg. Views per Video">
        <PlotComponent
          data={[
            {
              x: compViews,
              y: competitors.competitors.map((c) => c.name),
              type: 'bar',
              orientation: 'h',
              marker: {
                color: compViews.map((_, i) => (i === 0 ? palette.signal : `rgba(60,224,160,${Math.max(0.25, 1 - i * 0.15)})`)),
              },
              hovertemplate: '<b>%{y}</b><br>%{x:,.0f} avg views<extra></extra>',
            },
          ]}
          layout={{ ...sharedLayout, margin: { t: 8, r: 20, b: 36, l: 150 }, height: 260, xaxis: { ...sharedLayout.xaxis, tickformat: ',.0f' } }}
          config={plotlyConfig}
          style={{ width: '100%' }}
        />
      </Section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {competitors.competitors.map((comp, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-2xl border border-[var(--color-border)] bg-white/[0.02] p-4 transition-all duration-300 hover:border-signal/30"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full font-mono text-xs font-bold text-[#06120d]" style={{ background: `linear-gradient(135deg, ${palette.signal}, ${palette.cyan})` }}>
                {i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-bold text-ink">{comp.name}</h3>
                <a href={comp.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-semibold text-cyan transition-colors hover:text-signal">
                  Visit channel <ExternalLink size={10} />
                </a>
              </div>
            </div>
            <div className="space-y-1.5 border-t border-[var(--color-border)] pt-3">
              {(comp.recent_videos || []).slice(0, 3).map((v, j) => (
                <div key={j} className="flex justify-between gap-2 text-[11px]">
                  <span className="truncate text-ink-mid">{(v.title || '').slice(0, 34)}</span>
                  <span className="shrink-0 font-mono tabular text-ink-low">{compact(v.views)}</span>
                </div>
              ))}
              {!comp.recent_videos?.length && <p className="text-[11px] text-ink-faint">No recent videos</p>}
            </div>
          </motion.div>
        ))}
      </div>

      {competitors.report && (
        <Section title="AI Competitive Intelligence">
          <ReactMarkdown components={mdComponents}>{competitors.report}</ReactMarkdown>
        </Section>
      )}
    </motion.div>
  )
}

// ── Trends Tab ────────────────────────────────────────────────────────────────
function TrendsTab({ data }: { data: FullAnalysis }) {
  const trends = Array.isArray(data.trends) ? data.trends : []
  if (!trends.length)
    return <EmptyState icon={TrendingUp} title="No trend data for this niche right now." sub="PyTrends may have rate-limited. Try again in a few minutes." />

  const rising = trends.filter((t) => t.type === 'rising').slice(0, 10)
  const top = trends.filter((t) => t.type === 'top').slice(0, 10)
  const display = rising.length ? rising : top

  return (
    <motion.div {...tabFade} className="space-y-4">
      <Section title="Rising Queries" action={<Badge color={palette.signal}>YouTube · 7 days</Badge>}>
        <PlotComponent
          data={[
            {
              x: display.map((t) => t.query),
              y: display.map((t) => (t.value === 9999 ? 500 : t.value)),
              type: 'bar',
              marker: { color: display.map((t) => (t.value >= 500 ? palette.signal : palette.cyan)) },
              hovertemplate: '<b>%{x}</b><br>Score: %{y}<extra></extra>',
            },
          ]}
          layout={{
            ...sharedLayout,
            margin: { t: 8, r: 10, b: 80, l: 48 },
            height: 260,
            xaxis: { ...sharedLayout.xaxis, tickangle: -40, tickfont: { size: 10 } },
            yaxis: { ...sharedLayout.yaxis, title: { text: 'Score', font: { size: 10 } } },
          }}
          config={plotlyConfig}
          style={{ width: '100%' }}
        />
      </Section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {display.slice(0, 8).map((t, i) => {
          const hot = t.value >= 500 || t.value === 9999
          const color = hot ? palette.signal : palette.cyan
          return (
            <motion.div
              key={`${t.query}-${i}`}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border p-4 text-center"
              style={{ borderColor: color + '33', background: color + '0c' }}
            >
              <div className="flex items-center justify-center gap-1 font-mono text-2xl font-bold" style={{ color }}>
                {t.value === 9999 ? <Flame size={22} /> : `+${t.value}`}
              </div>
              <div className="mt-1 truncate text-[11px] font-semibold text-ink-mid">{t.query}</div>
              <div className="mt-1 text-[9px] font-bold uppercase tracking-wider" style={{ color }}>
                {hot ? 'Breakout' : 'Rising'}
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ── Report Tab ────────────────────────────────────────────────────────────────
function ReportTab({ data }: { data: FullAnalysis }) {
  const { analysis, mermaid_diagram, handle } = data
  const [dl, setDl] = useState(false)

  const doExport = async () => {
    setDl(true)
    try {
      const res = await exportPdf(handle)
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `yantranalytics_${bareHandle(handle)}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('PDF downloaded')
    } catch {
      toast.error('PDF export failed. Backend needs: pip install reportlab')
    } finally {
      setDl(false)
    }
  }

  return (
    <motion.div {...tabFade} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.15em] text-ink-low">AI Intelligence Report</h2>
        <button
          onClick={doExport}
          disabled={dl}
          className="inline-flex items-center gap-2 rounded-xl bg-signal/90 px-5 py-2.5 text-xs font-bold text-[#06120d] transition-all hover:bg-signal active:scale-95 disabled:opacity-40"
        >
          {dl ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          {dl ? 'Generating…' : 'Export PDF'}
        </button>
      </div>

      <Section>
        <ReactMarkdown components={mdComponents}>
          {analysis.report_markdown || 'No report generated. Try running the analysis again.'}
        </ReactMarkdown>
      </Section>

      {mermaid_diagram && (
        <Section title="Content Architecture">
          <MermaidChart code={mermaid_diagram} />
        </Section>
      )}
    </motion.div>
  )
}

// ── Tools Tab ─────────────────────────────────────────────────────────────────
const HOOK_COLORS: Record<string, string> = {
  'Curiosity Gap': palette.violet,
  'Numbered List': palette.cyan,
  'How-To': palette.signal,
  Controversy: palette.rose,
  Story: palette.amber,
}

function ToolsTab({ data }: { data: FullAnalysis }) {
  const { analysis, handle } = data
  const [idea, setIdea] = useState('')
  const [titles, setTitles] = useState<TitleVariation[]>([])
  const [tLoading, setTLoading] = useState(false)
  const [calendar, setCalendar] = useState<CalendarEntry[]>([])
  const [cLoading, setCLoading] = useState(false)

  const doTitles = async () => {
    if (!idea.trim()) return
    setTLoading(true)
    try {
      const r = await testTitles(idea, analysis.niche, analysis.top_keywords || [])
      setTitles(r.data.titles || [])
    } catch {
      toast.error('Title generation failed')
    } finally {
      setTLoading(false)
    }
  }

  const doCalendar = async () => {
    setCLoading(true)
    try {
      const r = await generateCalendar(handle, analysis.niche, analysis.content_pillars || [], analysis.top_keywords || [])
      setCalendar(r.data.calendar || [])
      toast.success('30-day calendar ready')
    } catch {
      toast.error('Calendar generation failed')
    } finally {
      setCLoading(false)
    }
  }

  return (
    <motion.div {...tabFade} className="space-y-5">
      {/* A/B Title Tester */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-white/[0.02] p-5 backdrop-blur-sm sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <Type size={18} className="text-cyan" />
          <div>
            <h2 className="text-sm font-bold text-ink">A/B Title Tester</h2>
            <p className="text-xs text-ink-low">5 AI-ranked titles with CTR scores and hook analysis</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doTitles()}
            placeholder={`e.g. Top mistakes beginner ${analysis.niche} creators make`}
            aria-label="Video idea"
            className="flex-1 rounded-xl border border-[var(--color-border-strong)] bg-black/30 px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-signal/60"
          />
          <button
            onClick={doTitles}
            disabled={tLoading || !idea.trim()}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-signal/90 px-6 py-3 text-sm font-bold text-[#06120d] transition-all hover:bg-signal active:scale-95 disabled:opacity-40"
          >
            {tLoading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            {tLoading ? 'Working…' : 'Generate'}
          </button>
        </div>

        {titles.length > 0 && (
          <div className="mt-5 space-y-3">
            {titles.map((t, i) => {
              const hookColor = HOOK_COLORS[t.hook_type] || palette.cyan
              const ctr = t.ctr_score >= 70 ? palette.signal : t.ctr_score >= 50 ? palette.amber : palette.textLow
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="rounded-xl border p-4"
                  style={{ borderColor: i === 0 ? palette.signal + '55' : 'var(--color-border)', background: i === 0 ? palette.signal + '0c' : 'rgba(0,0,0,0.2)' }}
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <p className="flex-1 text-sm font-bold leading-snug text-ink">{t.title}</p>
                    <div className="w-12 shrink-0 text-center">
                      <div className="font-mono text-xl font-bold tabular" style={{ color: ctr }}>{t.ctr_score}</div>
                      <div className="text-[9px] font-bold uppercase text-ink-faint">CTR</div>
                    </div>
                  </div>
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    <span className="rounded-full border px-2 py-0.5 text-[10px] font-bold" style={{ color: hookColor, background: hookColor + '18', borderColor: hookColor + '40' }}>
                      {t.hook_type}
                    </span>
                    {(t.seo_keywords_used || []).map((kw) => (
                      <span key={kw} className="rounded-full border border-[var(--color-border)] bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] text-ink-low">
                        {kw}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs italic leading-relaxed text-ink-mid">“{t.why_it_works}”</p>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Content Calendar */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-white/[0.02] p-5 backdrop-blur-sm sm:p-6">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <CalendarDays size={18} className="text-blue" />
            <div>
              <h2 className="text-sm font-bold text-ink">30-Day Content Calendar</h2>
              <p className="mt-0.5 text-xs text-ink-low">AI schedule built from competitor patterns and niche trends</p>
            </div>
          </div>
          <button
            onClick={doCalendar}
            disabled={cLoading}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-signal/40 bg-signal/10 px-5 py-2.5 text-xs font-bold text-signal transition-all hover:bg-signal/20 active:scale-95 disabled:opacity-40"
          >
            {cLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {cLoading ? 'Building…' : 'Generate calendar'}
          </button>
        </div>

        {calendar.length > 0 && (
          <div className="no-scrollbar max-h-[560px] space-y-2 overflow-y-auto pr-1">
            {calendar.map((e) => {
              const isShort = e.format?.includes('Short')
              const isComm = e.format?.includes('Community')
              const accent = isShort ? palette.amber : isComm ? palette.cyan : palette.signal
              return (
                <div key={e.day} className="flex gap-3 rounded-xl border border-[var(--color-border)] bg-black/20 p-3.5 transition-colors hover:bg-white/[0.03]">
                  <div className="w-12 shrink-0 text-center">
                    <div className="font-mono text-xl font-bold leading-none tabular text-ink">{e.day}</div>
                    <div className="text-[9px] font-bold uppercase text-ink-faint">Day</div>
                  </div>
                  <div className="w-px shrink-0 rounded-full" style={{ background: accent + '40' }} />
                  <div className="min-w-0 flex-1">
                    <span className="mb-1 inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider" style={{ color: accent, background: accent + '18' }}>
                      {e.format}
                    </span>
                    <p className="text-sm font-bold leading-snug text-ink">{e.title}</p>
                    <p className="mt-0.5 text-xs italic text-ink-mid">“{e.hook}”</p>
                    <p className="mt-0.5 text-[11px] text-ink-low">{e.rationale}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── Empty State helper ──────────────────────────────────────────────────────
function EmptyState({ icon: Icon, title, sub }: { icon: LucideIcon; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Icon size={40} className="mb-4 text-ink-faint" />
      <p className="text-sm font-semibold text-ink-mid">{title}</p>
      <p className="mt-1 max-w-xs text-xs text-ink-low">{sub}</p>
    </div>
  )
}

// ── Markdown Styles ───────────────────────────────────────────────────────────
const mdComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="mb-5 mt-8 font-display text-2xl text-ink first:mt-0">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="mb-3 mt-8 border-b border-[var(--color-border)] pb-2 text-sm font-bold uppercase tracking-wider text-signal">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => <h3 className="mb-2 mt-5 text-sm font-bold text-cyan">{children}</h3>,
  p: ({ children }: { children?: React.ReactNode }) => <p className="mb-4 text-sm leading-7 text-ink-mid">{children}</p>,
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="mb-4 space-y-2">{children}</ul>,
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="flex items-start gap-2.5 text-sm text-ink-mid">
      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-signal" />
      <span>{children}</span>
    </li>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-bold text-ink">{children}</strong>,
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="rounded border border-[var(--color-border)] bg-black/40 px-1.5 py-0.5 font-mono text-xs text-signal">{children}</code>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="my-4 rounded-r-lg border-l-2 border-signal bg-signal/[0.06] py-2 pl-4 italic text-ink-mid">{children}</blockquote>
  ),
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="my-5 overflow-x-auto rounded-xl border border-[var(--color-border)]">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="border-b border-[var(--color-border)] bg-white/[0.04] p-3 text-left text-[10px] font-bold uppercase tracking-widest text-ink">{children}</th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => <td className="border-b border-[var(--color-border)] p-3 text-xs text-ink-mid">{children}</td>,
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Analysis() {
  const { handle } = useParams<{ handle: string }>()
  const fullHandle = normalizeHandle(handle || '')
  const { data, phase, error, run } = useAnalysis()
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  useEffect(() => {
    if (handle) run(fullHandle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle])

  if (phase === 'error') return <ErrorState message={error || 'Unknown error'} />
  if (phase === 'loading' || !data) return <LoadingWarRoom handle={fullHandle} />

  const { profile, analysis } = data
  const stats = profile?.stats ?? {
    total_videos_scanned: 0,
    total_shorts_scanned: 0,
    total_posts_scanned: 0,
    avg_views_videos: 0,
    avg_views_shorts: 0,
    dominant_format: '',
    engagement_rate: 0,
    upload_frequency_days: undefined,
  }

  const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'competitors', label: 'Competitors', icon: Swords },
    { id: 'trends', label: 'Trends', icon: TrendingUp },
    { id: 'report', label: 'AI Report', icon: FileText },
    { id: 'tools', label: 'Tools', icon: Wrench },
  ]

  const growthColor =
    analysis.growth_potential === 'Explosive'
      ? palette.amber
      : analysis.growth_potential === 'High'
      ? palette.signal
      : analysis.growth_potential === 'Medium'
      ? palette.cyan
      : palette.textLow

  return (
    <div className="grain min-h-screen bg-base text-ink">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full opacity-[0.05]" style={{ background: `radial-gradient(circle, ${palette.signal}, transparent)` }} />
        <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full opacity-[0.05]" style={{ background: `radial-gradient(circle, ${palette.cyan}, transparent)` }} />
      </div>

      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-base/85 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-center justify-between gap-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <Link to="/" className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-ink-low transition-colors hover:text-ink">
                <ArrowLeft size={16} />
                <BrandMark size={26} />
              </Link>
              <div className="h-4 w-px shrink-0 bg-[var(--color-border-strong)]" />
              <div className="min-w-0">
                <h1 className="truncate font-display text-base text-ink">{fullHandle}</h1>
                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-medium text-ink-mid">{analysis.niche}</span>
                  <span className="text-ink-faint">·</span>
                  <span className="text-[10px] font-semibold text-cyan">{analysis.authority_type}</span>
                  <span className="text-ink-faint">·</span>
                  <span className="text-[10px] font-bold" style={{ color: growthColor }}>{analysis.growth_potential} growth</span>
                </div>
              </div>
            </div>

            {profile.subscribers != null && (
              <div className="hidden shrink-0 items-center gap-2 sm:flex">
                <Users size={15} className="text-ink-low" />
                <div className="text-right">
                  <div className="font-mono text-base font-bold leading-none tabular text-ink">{compact(profile.subscribers)}</div>
                  <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-low">subscribers</div>
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="no-scrollbar -mx-1 flex overflow-x-auto" role="tablist">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-3 text-xs font-bold transition-colors sm:px-4 ${
                    active ? 'text-ink' : 'text-ink-low hover:text-ink-mid'
                  }`}
                >
                  <Icon size={15} className="hidden sm:inline" />
                  {tab.label}
                  {active && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute inset-x-0 bottom-0 h-0.5 rounded-t-full"
                      style={{ background: `linear-gradient(90deg, ${palette.signal}, ${palette.cyan})` }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-5 sm:px-6">
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard label="Viral Score" value={`${analysis.viral_probability_score ?? 0}/100`} icon={Target} accent={palette.signal} />
          <MetricCard label="Hook Score" value={`${analysis.hook_score ?? 0}/100`} icon={Anchor} accent={palette.amber} />
          <MetricCard label="Avg Views" value={compact(stats.avg_views_videos)} sub="per video" icon={Eye} accent={palette.cyan} />
          <MetricCard label="Engagement" value={`${stats.engagement_rate ?? 0}%`} sub={stats.dominant_format || ''} icon={MessageCircle} accent={palette.blue} />
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && <OverviewTab key="overview" data={data} />}
          {activeTab === 'competitors' && <CompetitorsTab key="competitors" data={data} />}
          {activeTab === 'trends' && <TrendsTab key="trends" data={data} />}
          {activeTab === 'report' && <ReportTab key="report" data={data} />}
          {activeTab === 'tools' && <ToolsTab key="tools" data={data} />}
        </AnimatePresence>
      </div>
    </div>
  )
}
