/**
 * YantrAnalytics — Design Tokens (JS source of truth)
 * ---------------------------------------------------------------------------
 * CSS owns layout/visual utilities via index.css `@theme`. This module owns the
 * tokens that JavaScript needs directly: Plotly chart colors, the 3D scene, and
 * any inline-styled gradients. Keep this in sync with the CSS variables.
 *
 * Aesthetic: "Yantra" — a precision instrument / observatory. Deep obsidian
 * canvas, a luminous mint→cyan "signal" accent, warm amber for breakout/heat.
 */

export const palette = {
  // Surfaces
  bg: '#07080c',
  bgElevated: '#0c0e15',
  surface: '#11141d',
  surfaceHover: '#161a25',
  border: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.12)',

  // Text
  textHi: '#f3f6fb',
  textMid: '#9aa4b5',
  textLow: '#5d6678',
  textFaint: '#3a4150',

  // Signal accents
  signal: '#3ce0a0', // primary — luminous mint/spring green
  signalDeep: '#1fb583',
  cyan: '#34d3ee', // secondary — data / links
  amber: '#f6b352', // warm — breakout / heat
  violet: '#8b7bf0', // 4th data series only
  rose: '#fb6f7d', // danger / decline
  blue: '#5b9dff',
} as const

/** Ordered palette for categorical chart series. */
export const chartColors = [
  palette.signal,
  palette.cyan,
  palette.amber,
  palette.violet,
  palette.blue,
  palette.rose,
] as const

/** Brand gradient used for the logo mark and primary actions. */
export const brandGradient = `linear-gradient(135deg, ${palette.signal} 0%, ${palette.cyan} 100%)`

/** Quality color ramp for scores (0–100). */
export function scoreColor(score: number): string {
  if (score >= 70) return palette.signal
  if (score >= 45) return palette.amber
  return palette.rose
}

export function scoreLabel(score: number): string {
  if (score >= 70) return 'STRONG'
  if (score >= 45) return 'AVERAGE'
  return 'WEAK'
}

/**
 * Shared Plotly layout. Left as an inferred object literal (no wide annotation)
 * so it stays structurally assignable to Plotly's `Partial<Layout>` when spread
 * into a chart's `layout` prop. Override per chart at the call site.
 */
export const plotlyLayout = {
  paper_bgcolor: 'transparent',
  plot_bgcolor: 'transparent',
  font: { family: "'Hanken Grotesk', system-ui, sans-serif", color: palette.textMid, size: 12 },
  xaxis: { gridcolor: 'rgba(255,255,255,0.05)', color: palette.textLow, zeroline: false },
  yaxis: { gridcolor: 'rgba(255,255,255,0.05)', color: palette.textLow, zeroline: false },
  hoverlabel: {
    bgcolor: palette.surface,
    bordercolor: palette.borderStrong,
    font: { family: "'Hanken Grotesk', sans-serif", color: palette.textHi, size: 12 },
  },
  colorway: [...chartColors],
}

export const plotlyConfig = { displayModeBar: false, responsive: true }
