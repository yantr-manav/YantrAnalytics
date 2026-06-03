import type { LucideIcon } from 'lucide-react'

/**
 * A depth-shaded, glassy "rendered app icon" tile wrapping a Lucide glyph.
 * The hue is driven entirely by `color` via the `--tile` CSS variable, so a row
 * of these reads as a cohesive set of 3D icons. See `.icon-tile` in index.css.
 */
export default function Icon3D({
  icon: Icon,
  color = '#3ce0a0',
  size = 44,
  iconSize,
  className = '',
}: {
  icon: LucideIcon
  color?: string
  size?: number
  iconSize?: number
  className?: string
}) {
  return (
    <span
      className={`icon-tile ${className}`}
      style={{ width: size, height: size, ['--tile' as string]: color }}
    >
      <Icon size={iconSize ?? Math.round(size * 0.46)} strokeWidth={2} aria-hidden="true" />
    </span>
  )
}
