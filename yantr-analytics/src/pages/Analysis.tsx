import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import mermaid from 'mermaid'
import { useAnalysis } from '../hooks/useAnalysis'
import { testTitles, generateCalendar, exportPdf } from '../api/client'
import type { FullAnalysis, TitleVariation, CalendarEntry } from '../types'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import Plotly from 'react-plotly.js'

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#7c3aed',
    primaryTextColor: '#f1f5f9',
    primaryBorderColor: '#8b5cf6',
    lineColor: '#334155',
    background: '#080b14',
  },
})

type Tab = 'overview' | 'competitors' | 'trends' | 'report' | 'tools'
const PlotComponent = ((Plotly as unknown as { default?: typeof Plotly }).default ?? Plotly)

const LOADING_STEPS = [
  { label: 'Harvesting channel data in parallel', sub: 'videos · shorts · community · subscribers', icon: '📡' },
  { label: 'Scanning top competitors', sub: 'searching your niche via YouTube', icon: '🔍' },
  { label: 'Detecting trend signals', sub: 'pytrends + YouTube search', icon: '📈' },
  { label: 'Gemini AI synthesis', sub: 'master analysis + competitive report', icon: '🧠' },
  { label: 'Building dashboard', sub: 'charts · radar · action plan', icon: '⚡' },
] as const

// ── Shared Plot Layout ─────────────────────────────────────────────────────────
const sharedLayout = {
  paper_bgcolor: 'transparent',
  plot_bgcolor: 'transparent',
  font: { family: 'DM Sans, sans-serif', color: '#94a3b8' },
  xaxis: { gridcolor: '#1e293b', color: '#475569', zeroline: false },
  yaxis: { gridcolor: '#1e293b', color: '#475569', zeroline: false },
}

// ── Score Ring ─────────────────────────────────────────────────────────────────
function ScoreRing({
  score,
  label,
  color = '#7c3aed',
  size = 100,
}: {
  score: number
  label: string
  color?: string
  size?: number
}) {
  const r = size * 0.38
  const circ = 2 * Math.PI * r
  const safe = Math.min(100, Math.max(0, score || 0))
  const fill = (safe / 100) * circ
  const qual = safe >= 70 ? '#34d399' : safe >= 45 ? '#fbbf24' : '#f87171'
  const qualLabel = safe >= 70 ? 'STRONG' : safe >= 45 ? 'AVERAGE' : 'WEAK'
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <linearGradient id={`ring-${label.replace(/\s/g, '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor={color + 'aa'} />
            </linearGradient>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#0f172a" strokeWidth="8" />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={`url(#ring-${label.replace(/\s/g, '')})`}
            strokeWidth="8"
            strokeDasharray={`${fill} ${circ}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dasharray 1.6s cubic-bezier(0.4,0,0.2,1)' }}
          />
          <text x={size / 2} y={size / 2 - 4} textAnchor="middle" fill="white" fontSize={size * 0.2} fontWeight="800" fontFamily="DM Sans">{safe}</text>
          <text x={size / 2} y={size / 2 + 12} textAnchor="middle" fill={qual} fontSize={size * 0.08} fontWeight="700" fontFamily="DM Sans">{qualLabel}</text>
        </svg>
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ boxShadow: `0 0 28px ${color}22` }}
        />
      </div>
      <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: '#64748b', letterSpacing: '0.1em' }}>{label}</span>
    </div>
  )
}

// ── Stat Bar ───────────────────────────────────────────────────────────────────
function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="group">
      <div className="flex justify-between items-center text-xs mb-2">
        <span className="text-slate-400 font-medium">{label}</span>
        <span
          className="font-black text-sm tabular-nums px-2 py-0.5 rounded-md"
          style={{ color, background: color + '18' }}
        >
          {value}<span className="text-slate-600">/10</span>
        </span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(value / 10) * 100}%` }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}cc, ${color})` }}
        />
      </div>
    </div>
  )
}

// ── Metric Card ────────────────────────────────────────────────────────────────
function MetricCard({
  label,
  value,
  sub,
  accent = '#7c3aed',
  icon,
}: {
  label: string
  value: string | number
  sub?: string
  accent?: string
  icon: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl p-4 sm:p-5 overflow-hidden border border-slate-800 bg-slate-900/60 backdrop-blur-sm group hover:border-slate-700 transition-all duration-300"
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `radial-gradient(circle at 0% 0%, ${accent}10, transparent 60%)` }}
      />
      <div className="flex items-start justify-between mb-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
        <span className="text-lg opacity-60">{icon}</span>
      </div>
      <p className="text-2xl sm:text-3xl font-black text-white leading-none mb-1 tabular-nums">{value}</p>
      {sub && <p className="text-[11px] text-slate-500 font-medium mt-1">{sub}</p>}
      <div
        className="absolute bottom-0 left-0 h-0.5 w-full opacity-40"
        style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
      />
    </motion.div>
  )
}

// ── Mermaid ────────────────────────────────────────────────────────────────────
function MermaidChart({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current || !code) return
    const id = `mmd-${Date.now()}`
    mermaid
      .render(id, code)
      .then(({ svg }) => {
        if (ref.current) ref.current.innerHTML = svg
      })
      .catch(() => {
        if (ref.current)
          ref.current.innerHTML = `<pre class="text-xs text-slate-600 p-4">${code}</pre>`
      })
  }, [code])
  return <div ref={ref} className="w-full overflow-auto" />
}

// ── Loading ────────────────────────────────────────────────────────────────────
function LoadingWarRoom({ handle }: { handle: string }) {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1)), 13000)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="min-h-screen bg-[#080b14] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Spinner */}
        <div className="flex justify-center mb-12">
          <div className="relative w-20 h-20">
            <div
              className="absolute inset-0 rounded-full animate-spin"
              style={{
                background: 'conic-gradient(from 0deg, transparent 0%, #7c3aed 100%)',
                WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), white calc(100% - 3px))',
                mask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), white calc(100% - 3px))',
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-2xl">⚡</div>
          </div>
        </div>

        <h2 className="text-2xl font-black text-white text-center mb-1 tracking-tight">War Room Active</h2>
        <p className="text-slate-500 text-sm text-center mb-8">
          Analyzing{' '}
          <span className="text-violet-400 font-semibold">{handle}</span>
          {' '}· 30–90 seconds
        </p>

        <div className="space-y-2.5">
          {LOADING_STEPS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
                i < step
                  ? 'border-emerald-800/30 bg-emerald-950/20'
                  : i === step
                  ? 'border-violet-700/60 bg-violet-950/20'
                  : 'border-slate-800 opacity-30'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 font-bold ${
                  i < step
                    ? 'bg-emerald-800 text-emerald-200'
                    : i === step
                    ? 'bg-violet-700 text-white'
                    : 'bg-slate-800 text-slate-600'
                }`}
              >
                {i < step ? '✓' : s.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${i === step ? 'text-white' : i < step ? 'text-emerald-400' : 'text-slate-600'}`}>
                  {s.label}
                </p>
                <p className="text-[10px] text-slate-600 truncate">{s.sub}</p>
              </div>
              {i === step && (
                <div className="flex gap-1">
                  {[0, 1, 2].map((dot) => (
                    <div
                      key={dot}
                      className="w-1 h-1 bg-violet-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${dot * 0.15}s` }}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Error State ────────────────────────────────────────────────────────────────
function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[#080b14] flex items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative rounded-2xl p-10 max-w-md text-center overflow-hidden border border-red-800/30 bg-red-950/10 backdrop-blur-sm"
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, #7f1d1d40, transparent 70%)' }}
        />
        <div className="relative">
          <div className="text-5xl mb-5">⚠️</div>
          <h2 className="text-xl font-black text-red-400 mb-3 tracking-tight">Analysis Failed</h2>
          <p className="text-slate-400 text-sm mb-2 leading-relaxed">{message}</p>
          <p className="text-slate-600 text-xs mb-8">Channel may be private or the handle is incorrect.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-violet-700 hover:bg-violet-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:shadow-[0_0_24px_rgba(124,58,237,0.4)]"
          >
            ← Try Another Handle
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

// ── Section Wrapper ────────────────────────────────────────────────────────────
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
    <div
      className={`rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm overflow-hidden ${className}`}
    >
      {title && (
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-800/60">
          <h2 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  )
}

// ── Badge ──────────────────────────────────────────────────────────────────────
function Badge({ children, color = '#7c3aed' }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
      style={{ color, background: color + '15', borderColor: color + '40' }}
    >
      {children}
    </span>
  )
}

type Props = { data: FullAnalysis }

// ── Overview Tab ───────────────────────────────────────────────────────────────
function OverviewTab({ data }: Props) {
  const profile = data?.profile ?? {}
  const analysis = data?.analysis ?? {}

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
  const COLORS = ['#7c3aed', '#3b82f6', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e']
  const radarAvg = Math.round((radarValues.reduce((a, b) => a + b, 0) / radarValues.length) * 10)

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

      {/* Scores + Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="AI Intelligence Scores">
          <div className="flex justify-around items-center py-2">
            <ScoreRing score={analysis?.viral_probability_score ?? 0} label="Viral Score" color="#7c3aed" />
            <ScoreRing score={analysis?.hook_score ?? 0} label="Hook Score" color="#f59e0b" />
            <ScoreRing score={radarAvg} label="Overall" color="#10b981" />
          </div>
        </Section>

        <Section title="Performance Breakdown">
          <div className="space-y-4">
            {categories.map((cat, i) => (
              <StatBar key={cat} label={cat} value={radarValues[i]} color={COLORS[i]} />
            ))}
          </div>
        </Section>
      </div>

      {/* View Velocity */}
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
                line: { color: '#7c3aed', width: 2, shape: 'spline' },
                fillcolor: 'rgba(124,58,237,0.07)',
                text: allContent.map((v) => (v?.title ?? '').slice(0, 45) + '…'),
                marker: {
                  color: allContent.map((v) => (v?.type === 'Short' ? '#f59e0b' : '#7c3aed')),
                  size: 6,
                },
                hovertemplate: '<b>%{text}</b><br>%{y:,.0f} views<extra></extra>',
              },
            ]}
            layout={{
              ...sharedLayout,
              height: 220,
              margin: { t: 8, r: 10, b: 36, l: 60 },
              showlegend: false,
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
          />
        </Section>
      )}

      {/* Top Content + Mix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-800/60 transition-colors group"
                >
                  <span className="text-xs font-black text-slate-700 w-5 text-center">#{i + 1}</span>
                  {v?.thumbnail && (
                    <img
                      src={v.thumbnail}
                      className="w-14 h-9 object-cover rounded-lg flex-shrink-0 group-hover:opacity-90 transition"
                      onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-200 truncate font-medium">{v?.title}</p>
                    <p className="text-[10px] text-slate-600 mt-0.5 font-semibold tabular-nums">
                      {(v?.views ?? 0).toLocaleString()} views
                    </p>
                  </div>
                  <span className="text-slate-700 group-hover:text-slate-400 transition text-xs">↗</span>
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
                marker: { colors: ['#7c3aed', '#f59e0b', '#10b981'] },
                textinfo: 'label+percent',
                textfont: { color: '#94a3b8', size: 11 },
                hovertemplate: '<b>%{label}</b><br>%{value} videos<extra></extra>',
              },
            ]}
            layout={{
              ...sharedLayout,
              height: 210,
              showlegend: false,
              margin: { t: 8, r: 8, b: 8, l: 8 },
            }}
            config={{ displayModeBar: false }}
          />
        </Section>
      </div>

      {/* Keywords */}
      {analysis?.top_keywords?.length > 0 && (
        <Section title="SEO Keywords">
          <div className="flex flex-wrap gap-2">
            {analysis.top_keywords.map((kw: string) => (
              <span
                key={kw}
                className="px-3 py-1.5 text-xs font-semibold rounded-full border border-violet-800/40 bg-violet-950/30 text-violet-300 hover:bg-violet-900/30 transition-colors cursor-default"
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

// ── Competitors Tab ────────────────────────────────────────────────────────────
function CompetitorsTab({ data }: { data: FullAnalysis }) {
  const { competitors } = data
  if (!competitors?.competitors?.length)
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-5xl mb-4 opacity-30">⚔️</div>
        <p className="text-slate-400 text-sm font-semibold">No competitor data this time.</p>
        <p className="text-slate-600 text-xs mt-1">Competitor scan timed out. Try clearing cache and reanalyzing.</p>
      </div>
    )

  const compViews = competitors.competitors.map(
    (c) =>
      (c.recent_videos || []).reduce((s, v) => s + (v.views || 0), 0) /
      Math.max((c.recent_videos || []).length, 1),
  )

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
      <Section title="Avg. Views per Video">
        <PlotComponent
          data={[
            {
              x: compViews,
              y: competitors.competitors.map((c) => c.name),
              type: 'bar',
              orientation: 'h',
              marker: {
                color: compViews.map((_, i) =>
                  i === 0 ? '#7c3aed' : `rgba(124,58,237,${Math.max(0.25, 1 - i * 0.15)})`,
                ),
                opacity: 0.9,
              },
              hovertemplate: '<b>%{y}</b><br>%{x:,.0f} avg views<extra></extra>',
            },
          ]}
          layout={{
            ...sharedLayout,
            margin: { t: 8, r: 20, b: 36, l: 160 },
            height: 260,
            xaxis: { ...sharedLayout.xaxis, tickformat: ',.0f' },
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%' }}
        />
      </Section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {competitors.competitors.map((comp, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 hover:border-violet-700/40 transition-all duration-300 group"
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                style={{ background: `linear-gradient(135deg, #7c3aed, #3b82f6)` }}
              >
                #{i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white truncate">{comp.name}</h3>
                <a
                  href={comp.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-violet-400 hover:text-violet-300 transition-colors font-semibold"
                >
                  Visit Channel →
                </a>
              </div>
            </div>
            <div className="space-y-1.5 border-t border-slate-800 pt-3">
              {(comp.recent_videos || []).slice(0, 3).map((v, j) => (
                <div key={j} className="flex justify-between gap-2 text-[11px]">
                  <span className="text-slate-500 truncate">{(v.title || '').slice(0, 32)}…</span>
                  <span className="text-slate-600 flex-shrink-0 font-mono tabular-nums">
                    {(v.views || 0).toLocaleString()}
                  </span>
                </div>
              ))}
              {!comp.recent_videos?.length && (
                <p className="text-slate-700 text-[11px]">No recent videos</p>
              )}
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

// ── Trends Tab ─────────────────────────────────────────────────────────────────
function TrendsTab({ data }: { data: FullAnalysis }) {
  const trends = Array.isArray(data.trends) ? data.trends : []
  if (!trends.length)
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-5xl mb-4 opacity-30">📊</div>
        <p className="text-slate-400 text-sm font-semibold">No trend data for this niche right now.</p>
        <p className="text-slate-600 text-xs mt-1">PyTrends may have rate-limited. Try again in a few minutes.</p>
      </div>
    )

  const rising = trends.filter((t) => t.type === 'rising').slice(0, 10)
  const top = trends.filter((t) => t.type === 'top').slice(0, 10)
  const display = rising.length ? rising : top

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
      <Section
        title="Rising Queries"
        action={
          <Badge color="#10b981">YouTube · Last 7 Days</Badge>
        }
      >
        <PlotComponent
          data={[
            {
              x: display.map((t) => t.query),
              y: display.map((t) => (t.value === 9999 ? 500 : t.value)),
              type: 'bar',
              marker: {
                color: display.map((t) =>
                  t.value >= 500 ? '#10b981' : '#7c3aed',
                ),
                opacity: 0.85,
              },
              hovertemplate: '<b>%{x}</b><br>Score: %{y}<extra></extra>',
            },
          ]}
          layout={{
            ...sharedLayout,
            margin: { t: 8, r: 10, b: 80, l: 50 },
            height: 260,
            xaxis: { ...sharedLayout.xaxis, tickangle: -40, tickfont: { size: 10 } },
            yaxis: { ...sharedLayout.yaxis, title: { text: 'Score', font: { size: 10 } } },
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%' }}
        />
      </Section>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {display.slice(0, 8).map((t, i) => {
          const hot = t.value >= 500 || t.value === 9999
          return (
            <motion.div
              key={`${t.query}-${i}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-2xl p-4 border text-center ${
                hot
                  ? 'border-emerald-800/40 bg-emerald-950/20'
                  : 'border-violet-800/20 bg-violet-950/10'
              }`}
            >
              <div
                className={`text-2xl font-black mb-1 ${hot ? 'text-emerald-400' : 'text-violet-400'}`}
              >
                {t.value === 9999 ? '🔥' : `+${t.value}`}
              </div>
              <div className="text-[11px] text-slate-400 truncate font-semibold">{t.query}</div>
              <div className={`text-[9px] mt-1 font-bold uppercase tracking-wider ${hot ? 'text-emerald-600' : 'text-violet-600'}`}>
                {hot ? 'Breakout' : 'Rising'}
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ── Report Tab ─────────────────────────────────────────────────────────────────
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
      a.download = `reachradar_${handle.replace('@', '')}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('PDF downloaded!')
    } catch {
      toast.error('PDF export failed. Install: pip install reportlab')
    } finally {
      setDl(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">AI Intelligence Report</h2>
        <button
          onClick={doExport}
          disabled={dl}
          className="flex items-center gap-2 bg-violet-700 hover:bg-violet-600 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all hover:shadow-[0_0_24px_rgba(124,58,237,0.4)] active:scale-95"
        >
          {dl ? '⏳' : '📥'} {dl ? 'Generating…' : 'Export PDF'}
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

// ── Tools Tab ──────────────────────────────────────────────────────────────────
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
      const r = await generateCalendar(
        handle,
        analysis.niche,
        analysis.content_pillars || [],
        analysis.top_keywords || [],
      )
      setCalendar(r.data.calendar || [])
      toast.success('30-day calendar ready!')
    } catch {
      toast.error('Calendar generation failed')
    } finally {
      setCLoading(false)
    }
  }

  const HOOKS: Record<string, string> = {
    'Curiosity Gap': 'text-purple-300 bg-purple-950/40 border-purple-800/40',
    'Numbered List': 'text-blue-300 bg-blue-950/40 border-blue-800/40',
    'How-To': 'text-teal-300 bg-teal-950/40 border-teal-800/40',
    Controversy: 'text-red-300 bg-red-950/40 border-red-800/40',
    Story: 'text-amber-300 bg-amber-950/40 border-amber-800/40',
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
      {/* A/B Title Tester */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-5 sm:p-6">
        <div className="mb-4">
          <h2 className="text-sm font-black text-white mb-1">🔤 A/B Title Tester</h2>
          <p className="text-xs text-slate-500">5 AI-ranked titles with CTR scores and hook analysis</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doTitles()}
            placeholder={`e.g. Top mistakes beginner ${analysis.niche} creators make`}
            className="flex-1 bg-slate-950 border border-slate-700 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-700 outline-none transition-colors"
          />
          <button
            onClick={doTitles}
            disabled={tLoading || !idea.trim()}
            className="flex-shrink-0 bg-violet-700 hover:bg-violet-600 disabled:opacity-40 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all hover:shadow-[0_0_20px_rgba(124,58,237,0.3)] active:scale-95 whitespace-nowrap"
          >
            {tLoading ? '⏳ Working…' : 'Generate Titles'}
          </button>
        </div>

        {titles.length > 0 && (
          <div className="mt-5 space-y-3">
            {titles.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className={`rounded-xl p-4 border ${
                  i === 0
                    ? 'border-violet-600/50 bg-violet-950/20'
                    : 'border-slate-800 bg-slate-950/60'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="font-bold text-white text-sm flex-1 leading-snug">{t.title}</p>
                  <div className="text-center flex-shrink-0 w-12">
                    <div
                      className={`text-xl font-black tabular-nums ${
                        t.ctr_score >= 70
                          ? 'text-emerald-400'
                          : t.ctr_score >= 50
                          ? 'text-amber-400'
                          : 'text-slate-500'
                      }`}
                    >
                      {t.ctr_score}
                    </div>
                    <div className="text-[9px] text-slate-600 font-bold uppercase">CTR</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${
                      HOOKS[t.hook_type] || 'text-slate-400 bg-slate-800 border-slate-700'
                    }`}
                  >
                    {t.hook_type}
                  </span>
                  {(t.seo_keywords_used || []).map((kw) => (
                    <span
                      key={kw}
                      className="text-[10px] px-2 py-0.5 bg-slate-800/60 text-slate-500 rounded-full border border-slate-700"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-500 italic leading-relaxed">"{t.why_it_works}"</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Content Calendar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-sm font-black text-white">📅 30-Day Content Calendar</h2>
            <p className="text-xs text-slate-500 mt-0.5">AI schedule built from competitor patterns and niche trends</p>
          </div>
          <button
            onClick={doCalendar}
            disabled={cLoading}
            className="flex-shrink-0 bg-emerald-700/70 hover:bg-emerald-600 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 whitespace-nowrap"
          >
            {cLoading ? '⏳ Building…' : '✨ Generate Calendar'}
          </button>
        </div>

        {calendar.length > 0 && (
          <div className="max-h-[560px] overflow-y-auto space-y-2 pr-1">
            {calendar.map((e) => {
              const isS = e.format?.includes('Short')
              const isC = e.format?.includes('Community')
              const accent = isS ? '#f59e0b' : isC ? '#10b981' : '#7c3aed'
              return (
                <div
                  key={e.day}
                  className="flex gap-3 rounded-xl p-3.5 border border-slate-800 bg-slate-950/40 hover:bg-slate-900/60 transition-colors"
                >
                  <div className="flex-shrink-0 w-12 text-center">
                    <div className="text-xl font-black text-white leading-none tabular-nums">{e.day}</div>
                    <div className="text-[9px] text-slate-600 font-bold uppercase">Day</div>
                  </div>
                  <div
                    className="w-px flex-shrink-0 rounded-full"
                    style={{ background: accent + '40' }}
                  />
                  <div className="flex-1 min-w-0">
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider inline-block mb-1"
                      style={{ color: accent, background: accent + '18' }}
                    >
                      {e.format}
                    </span>
                    <p className="text-sm font-bold text-white leading-snug">{e.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 italic">"{e.hook}"</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">{e.rationale}</p>
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

// ── Markdown Styles ────────────────────────────────────────────────────────────
const mdComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-2xl font-black text-white mb-5 mt-8 first:mt-0 tracking-tight">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-sm font-black text-violet-300 mt-8 mb-3 pb-2 border-b border-slate-800 uppercase tracking-wider">
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-sm font-bold text-cyan-300 mt-5 mb-2">{children}</h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-slate-300 text-sm leading-7 mb-4">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="space-y-2 mb-4">{children}</ul>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="flex items-start gap-2.5 text-slate-400 text-sm">
      <span className="text-violet-500 mt-1.5 flex-shrink-0 text-[8px]">◆</span>
      <span>{children}</span>
    </li>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="text-white font-bold">{children}</strong>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-emerald-400 text-xs font-mono">
      {children}
    </code>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-2 border-violet-600 pl-4 my-4 italic text-slate-500 bg-violet-950/10 py-2 rounded-r-lg">
      {children}
    </blockquote>
  ),
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="overflow-x-auto my-5 rounded-xl border border-slate-800">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="text-left p-3 bg-slate-800/60 text-slate-200 font-bold text-[10px] uppercase tracking-widest border-b border-slate-800">
      {children}
    </th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="p-3 border-b border-slate-800/40 text-slate-400 text-xs">{children}</td>
  ),
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function Analysis() {
  const { handle } = useParams<{ handle: string }>()
  const fullHandle = `@${(handle || '').replace('@', '')}`
  const { data, phase, error, run } = useAnalysis()
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  useEffect(() => {
    if (handle) run(fullHandle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle])

  if (phase === 'loading') return <LoadingWarRoom handle={fullHandle} />
  if (phase === 'error') return <ErrorState message={error || 'Unknown error'} />
  if (!data) return <LoadingWarRoom handle={fullHandle} />

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

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'competitors', label: 'Competitors', icon: '⚔️' },
    { id: 'trends', label: 'Trends', icon: '📈' },
    { id: 'report', label: 'AI Report', icon: '📋' },
    { id: 'tools', label: 'Tools', icon: '🛠️' },
  ]

  const growthColor =
    analysis.growth_potential === 'Explosive'
      ? '#f43f5e'
      : analysis.growth_potential === 'High'
      ? '#34d399'
      : '#fbbf24'

  return (
    <div className="min-h-screen bg-[#080b14] text-white">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }}
        />
      </div>

      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#080b14]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Top row */}
          <div className="flex items-center justify-between py-3 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                to="/"
                className="text-slate-600 hover:text-white text-sm flex-shrink-0 transition-colors font-medium"
              >
                ← Back
              </Link>
              <div className="w-px h-4 bg-slate-800 flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-sm font-black text-white truncate tracking-tight">{fullHandle}</h1>
                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                  <span className="text-[10px] text-slate-500 font-medium">{analysis.niche}</span>
                  <span className="text-slate-700">·</span>
                  <span className="text-[10px] text-violet-400 font-semibold">{analysis.authority_type}</span>
                  <span className="text-slate-700">·</span>
                  <span
                    className="text-[10px] font-bold"
                    style={{ color: growthColor }}
                  >
                    {analysis.growth_potential} Growth
                  </span>
                </div>
              </div>
            </div>

            {profile.subscribers && (
              <div className="hidden sm:flex flex-col items-end flex-shrink-0">
                <div className="text-base font-black text-white tabular-nums leading-none">
                  {profile.subscribers.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider mt-0.5">
                  subscribers
                </div>
              </div>
            )}
          </div>

          {/* Tab Bar */}
          <div className="flex overflow-x-auto scrollbar-none -mx-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-1.5 px-3 sm:px-4 py-3 text-xs font-bold whitespace-nowrap transition-colors flex-shrink-0 ${
                  activeTab === tab.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <span className="hidden sm:inline">{tab.icon}</span>
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                    style={{ background: 'linear-gradient(90deg, #7c3aed, #3b82f6)' }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-20">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <MetricCard
            label="Viral Score"
            value={`${analysis.viral_probability_score ?? 0}/100`}
            icon="🎯"
            accent="#7c3aed"
          />
          <MetricCard
            label="Hook Score"
            value={`${analysis.hook_score ?? 0}/100`}
            icon="🪝"
            accent="#f59e0b"
          />
          <MetricCard
            label="Avg Views"
            value={(stats.avg_views_videos || 0).toLocaleString()}
            sub="per video"
            icon="👁️"
            accent="#0ea5e9"
          />
          <MetricCard
            label="Engagement"
            value={`${stats.engagement_rate ?? 0}%`}
            sub={stats.dominant_format || ''}
            icon="💬"
            accent="#10b981"
          />
        </div>

        {/* Tab Content */}
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