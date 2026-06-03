import { Suspense, lazy, useState } from 'react'
import { motion } from 'framer-motion'
import ErrorBoundary from '../ErrorBoundary'

const YantraOrb = lazy(() => import('./YantraOrb'))

const PILLS = [
  { label: 'Viral Score', value: '87', color: '#3ce0a0', style: { top: '6%', right: '-2%' } },
  { label: 'Engagement', value: '4.2%', color: '#34d3ee', style: { bottom: '14%', left: '-6%' } },
  { label: 'Hook', value: '92', color: '#f6b352', style: { top: '52%', right: '-8%' } },
] as const

/** Static, on-brand orbit — shown while the WebGL chunk loads, if it fails, or
 *  when the user prefers reduced motion. */
function CssOrbFallback() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="relative h-40 w-40">
        <div
          className="absolute inset-0 rounded-full blur-2xl"
          style={{ background: 'radial-gradient(circle, rgba(60,224,160,0.35), transparent 70%)' }}
        />
        <div className="absolute inset-6 rounded-full border border-signal/40 animate-spin-slow" />
        <div className="absolute inset-0 rounded-full border border-cyan/20 animate-spin-slow" style={{ animationDuration: '26s' }} />
        <div className="absolute inset-12 rounded-full bg-signal/15 border border-signal/50 grid place-items-center">
          <div className="h-3 w-3 rounded-full bg-signal shadow-[0_0_16px_#3ce0a0]" />
        </div>
      </div>
    </div>
  )
}

export default function HeroScene() {
  const [reduceMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  return (
    <div className="relative w-full" style={{ aspectRatio: '1 / 1', maxWidth: 460 }}>
      {/* Ambient glow behind the orb */}
      <div
        className="absolute inset-0 -z-10 blur-3xl"
        style={{ background: 'radial-gradient(circle at 50% 45%, rgba(60,224,160,0.16), rgba(52,211,238,0.08) 45%, transparent 70%)' }}
      />

      {reduceMotion ? (
        <CssOrbFallback />
      ) : (
        <ErrorBoundary silent fallback={<CssOrbFallback />}>
          <Suspense fallback={<CssOrbFallback />}>
            <YantraOrb />
          </Suspense>
        </ErrorBoundary>
      )}

      {/* Floating signal pills */}
      {PILLS.map((p, i) => (
        <motion.div
          key={p.label}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 + i * 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="absolute flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur-md"
          style={{
            ...p.style,
            background: p.color + '14',
            borderColor: p.color + '38',
            color: p.color,
            boxShadow: `0 0 22px ${p.color}1f`,
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
          {p.label}
          <span className="font-mono font-bold">{p.value}</span>
        </motion.div>
      ))}
    </div>
  )
}
