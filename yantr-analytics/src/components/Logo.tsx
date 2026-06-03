/**
 * YantrAnalytics brand lockup — the "signal Y" mark + wordmark.
 * `BrandMark` is the standalone glyph; `Logo` is the full horizontal lockup.
 */

export function BrandMark({ size = 36, className = '' }: { size?: number; className?: string }) {
  // Stable per-instance gradient id so multiple marks on a page don't collide.
  const id = `bm-${size}`
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3ce0a0" />
          <stop offset="0.55" stopColor="#34d3ee" />
          <stop offset="1" stopColor="#5b9dff" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="58" height="58" rx="16" fill="#0a0c12" />
      <rect x="3.5" y="3.5" width="57" height="57" rx="15.5" stroke={`url(#${id})`} strokeOpacity="0.45" />
      <path d="M21 39a13 13 0 0 1 22 0" stroke={`url(#${id})`} strokeWidth="2.6" strokeLinecap="round" opacity="0.3" />
      <path d="M26 42a7.5 7.5 0 0 1 12 0" stroke={`url(#${id})`} strokeWidth="2.6" strokeLinecap="round" opacity="0.55" />
      <path d="M22 18l10 13 10-13" stroke={`url(#${id})`} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32 31v10" stroke={`url(#${id})`} strokeWidth="5" strokeLinecap="round" />
      <circle cx="32" cy="45.6" r="3.3" fill="#3ce0a0" />
    </svg>
  )
}

export default function Logo({
  size = 34,
  showWordmark = true,
  badge,
  className = '',
}: {
  size?: number
  showWordmark?: boolean
  badge?: string
  className?: string
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <BrandMark size={size} />
      {showWordmark && (
        <span className="font-display text-lg tracking-tight text-ink leading-none">
          Yantr<span className="gradient-text">Analytics</span>
        </span>
      )}
      {badge && (
        <span className="hidden sm:inline-flex items-center rounded-md border border-signal/25 bg-signal/8 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-signal">
          {badge}
        </span>
      )}
    </div>
  )
}
