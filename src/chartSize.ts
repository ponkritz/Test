// CHT-15…CHT-22 The size of a chart panel: a width of a 6-column grid (⅓, ½, ⅔, Full) and a height (Small, Medium,
// Large). Three places set it, the first one found wins: the viewer's own size (personal views, else this browser),
// the owner's default (the Insights chart or Dashboard block in Git; for a built-in chart the shared views defaults
// saved by a Tool Owner) and the chart's factory size (today's size, so nothing changes until someone resizes).
// Pure functions only: the React side is src/components/ChartSize.tsx.

export type ChartWidth = 'third' | 'half' | 'twothirds' | 'full'
export type ChartHeight = 'small' | 'medium' | 'large'
export interface ChartSize { width: ChartWidth; height: ChartHeight }
export type SizeSource = 'viewer' | 'owner' | 'factory'

export const chartWidths: ChartWidth[] = ['third', 'half', 'twothirds', 'full']
export const chartHeights: ChartHeight[] = ['small', 'medium', 'large']
export const widthLabels: Record<ChartWidth, string> = { third: '⅓', half: '½', twothirds: '⅔', full: 'Full' }
export const widthNames: Record<ChartWidth, string> = { third: 'One third (⅓)', half: 'Half (½)', twothirds: 'Two thirds (⅔)', full: 'Full width' }
export const heightLabels: Record<ChartHeight, string> = { small: 'Small', medium: 'Medium', large: 'Large' }
// Columns of the 6-column grid each width takes.
export const widthSpan: Record<ChartWidth, number> = { third: 2, half: 3, twothirds: 4, full: 6 }
// The chart's drawing height against today's (Medium).
export const heightFactor: Record<ChartHeight, number> = { small: 0.75, medium: 1, large: 1.5 }
// Below this width (px) every chart is full width and the drag handle is not shown.
export const narrowScreen = 720
// The Insights tab and the Dashboard: half width when nothing is set (CHT-11); a built-in chart: full width.
export const pairFactory: ChartSize = { width: 'half', height: 'medium' }
export const stackFactory: ChartSize = { width: 'full', height: 'medium' }

export const isWidth = (value: unknown): value is ChartWidth => typeof value === 'string' && (chartWidths as string[]).includes(value)
export const isHeight = (value: unknown): value is ChartHeight => typeof value === 'string' && (chartHeights as string[]).includes(value)

// A stored size (personal views, the shared defaults): only known values are kept; nothing usable → undefined.
export function parseChartSize(raw: unknown): Partial<ChartSize> | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const item = raw as Record<string, unknown>
  const out: Partial<ChartSize> = {}
  if (isWidth(item.width)) out.width = item.width
  if (isHeight(item.height)) out.height = item.height
  return out.width || out.height ? out : undefined
}

// The owner's default of an Insights chart or a Dashboard block, from its display options (`size`, `height`): the
// v10 values 'half' and 'full' read as before.
export function sizeFromOptions(options: { size?: unknown; height?: unknown } | undefined): Partial<ChartSize> | undefined {
  return parseChartSize({ width: options?.size, height: options?.height })
}
// The options with a size written back: a factory value is left out, so a chart nobody resized is written as before
// (keepWidth: a width chosen in the pop-up is written even when it is the factory one, as in v10).
export function withSizeOptions<T extends { size?: ChartWidth; height?: 'small' | 'large' }>(options: T | undefined, size: Partial<ChartSize>, factory: ChartSize = pairFactory, keepWidth = false): T | undefined {
  const out = { ...(options ?? {}) } as T
  delete out.size; delete out.height
  if (size.width && (keepWidth || size.width !== factory.width)) out.size = size.width
  if (size.height && size.height !== 'medium') out.height = size.height
  return Object.keys(out).length ? out : undefined
}

// Precedence: the viewer's own size > the owner's (or shared) default > the factory size, field by field.
export function resolveChartSize({ viewer, owner, factory }: { viewer?: Partial<ChartSize>; owner?: Partial<ChartSize>; factory: ChartSize }): { size: ChartSize; source: SizeSource; base: ChartSize } {
  const base: ChartSize = { ...factory, ...(owner ?? {}) }
  if (viewer && (viewer.width || viewer.height)) return { size: { ...base, ...viewer }, source: 'viewer', base }
  return { size: base, source: owner && (owner.width || owner.height) ? 'owner' : 'factory', base }
}

export const sameSize = (a: ChartSize, b: ChartSize) => a.width === b.width && a.height === b.height
export const sizeText = (size: ChartSize) => `width ${widthLabels[size.width]}, height ${heightLabels[size.height]}`

// The drag handle's keyboard: → / ← one width wider / narrower, ↓ / ↑ one height taller / smaller; other keys null.
export function stepSize(size: ChartSize, key: string): ChartSize | null {
  const w = chartWidths.indexOf(size.width), h = chartHeights.indexOf(size.height)
  if (key === 'ArrowRight') return { ...size, width: chartWidths[Math.min(chartWidths.length - 1, w + 1)] }
  if (key === 'ArrowLeft') return { ...size, width: chartWidths[Math.max(0, w - 1)] }
  if (key === 'ArrowDown') return { ...size, height: chartHeights[Math.min(chartHeights.length - 1, h + 1)] }
  if (key === 'ArrowUp') return { ...size, height: chartHeights[Math.max(0, h - 1)] }
  return null
}

// The width of `span` columns of a grid `gridWidth` wide with `gap` between columns.
export const spanWidth = (span: number, gridWidth: number, gap: number) => span * ((gridWidth - 5 * gap) / 6) + (span - 1) * gap
// A dragged width snapped to the nearest preset.
export function snapWidth(px: number, gridWidth: number, gap: number): ChartWidth {
  let best: ChartWidth = 'full', distance = Infinity
  for (const width of chartWidths) { const off = Math.abs(spanWidth(widthSpan[width], gridWidth, gap) - px); if (off < distance) { distance = off; best = width } }
  return best
}
// A dragged height snapped to the nearest preset: `drawn` is the chart's drawing height now (at `from`), `dy` the drag.
export function snapHeight(from: ChartHeight, drawn: number, dy: number): ChartHeight {
  const medium = drawn / heightFactor[from], target = drawn + dy
  let best: ChartHeight = from, distance = Infinity
  for (const height of chartHeights) { const off = Math.abs(medium * heightFactor[height] - target); if (off < distance) { distance = off; best = height } }
  return best
}

// Whether a grid of charts needs the 6-column layout: only when a chart takes a width the old layout did not have
// (⅓ or ⅔ where half and full are drawn as before; anything but full where every chart is full width).
export function needsGrid(widths: ChartWidth[], factory: ChartSize = pairFactory) {
  return factory.width === 'full' ? widths.some((width) => width !== 'full') : widths.some((width) => width === 'third' || width === 'twothirds')
}

// The key of a chart's size in personal views (and the shared defaults): `chart-size:` and the chart's id.
export const chartSizeKey = (id: string) => { const key = `chart-size:${id}`; return /^[\w:.-]{1,80}$/.test(key) ? key : '' }
export const insightChartId = (pageId: string, insightId: string) => `ondemand:${pageId}:${insightId}`
export const blockChartId = (pageId: string, blockId: string) => `dashboard:${pageId}:${blockId}`
// CHT-19: the built-in charts in the shared chart frame, by stable id.
export const builtInCharts = {
  epicMix: 'overview:epic-mix-by-month',
  overrun: 'overview:overrun-hours',
  adhoc: 'overview:adhoc-hours',
} as const
