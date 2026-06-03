/**
 * Number / string formatting helpers shared across the dashboard.
 */

/** Compact human-readable count: 1234 → "1.2K", 4_500_000 → "4.5M". */
export function compact(n: number | null | undefined): string {
  const v = Number(n ?? 0)
  if (!isFinite(v)) return '0'
  const abs = Math.abs(v)
  if (abs >= 1_000_000_000) return trim(v / 1_000_000_000) + 'B'
  if (abs >= 1_000_000) return trim(v / 1_000_000) + 'M'
  if (abs >= 1_000) return trim(v / 1_000) + 'K'
  return String(Math.round(v))
}

function trim(n: number): string {
  // 1.20 → "1.2", 4.00 → "4"
  return n.toFixed(1).replace(/\.0$/, '')
}

/** Full grouped number: 1234567 → "1,234,567". */
export function grouped(n: number | null | undefined): string {
  return Number(n ?? 0).toLocaleString('en-US')
}

/** Clamp a value into [min, max]. */
export function clamp(v: number, min: number, max: number): string | number {
  return Math.min(max, Math.max(min, v))
}

/** Normalise a raw handle to the "@name" form, stripping leading @ and slashes. */
export function normalizeHandle(raw: string): string {
  return '@' + raw.trim().replace(/^@+/, '').replace(/^\/+/, '')
}

/** Bare handle (no @) for use in URLs / filenames. */
export function bareHandle(raw: string): string {
  return raw.trim().replace(/^@+/, '').replace(/^\/+/, '')
}
