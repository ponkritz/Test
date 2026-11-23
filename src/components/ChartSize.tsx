import { useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { chartHeights, chartWidths, heightFactor, heightLabels, sameSize, sizeText, snapHeight, snapWidth, spanWidth, stackFactory, stepSize, widthNames, widthSpan, type ChartHeight, type ChartSize, type ChartWidth, type SizeSource } from '../chartSize'
import { recordJob } from '../backgroundJobs'
import { ChartHeightContext, type ChartSizes } from '../useChartSize'
import { Modal, Notice, Panel } from './ui'

// CHT-15…CHT-22 A chart in a panel of the chart grid: its width (⅓ / ½ / ⅔ / Full of a 6-column grid) and height
// (Small / Medium / Large) as resolved by useChartSizes (src/useChartSize.ts), a resize handle on the bottom-right
// corner (drag, snapping to the presets, with an outline of the size it will take; or the keyboard) and, when the
// viewer chose their own size, "Size: yours · Reset to default".

export function ChartPanel({ title, eyebrow, detail, info, action, className = '', size, source, legacyFull = false, onResize, onReset, extra, arranging = false, children }: {
  title: string; eyebrow?: string; detail?: ReactNode; info?: ReactNode; action?: ReactNode; className?: string
  size: ChartSize; source: SizeSource; legacyFull?: boolean
  onResize?: (size: ChartSize) => void; onReset?: () => void; extra?: ReactNode; arranging?: boolean; children: ReactNode
}) {
  const classes = [className, 'chart-panel', `chart-w-${size.width}`, `chart-h-${size.height}`, legacyFull && size.width === 'full' ? 'od-insight-full' : '', arranging ? 'chart-arranging' : ''].filter(Boolean).join(' ')
  return <Panel className={classes} eyebrow={eyebrow} title={title} detail={detail} info={info} action={action}>
    <ChartHeightContext.Provider value={heightFactor[size.height]}>{children}</ChartHeightContext.Provider>
    {(source === 'viewer' && onReset) || extra ? <p className="chart-size-note muted">{source === 'viewer' && onReset && <>Size: yours · <button type="button" className="text-button" aria-label={`Reset ${title} to the default size`} onClick={onReset}>Reset to default</button></>}{extra}</p> : null}
    {onResize && <ResizeHandle title={title} size={size} arranging={arranging} onCommit={onResize} />}
  </Panel>
}

// The handle: pointer drag snaps to the presets (the outline shows the size it will take); focused, → / ← and ↓ / ↑ step
// the width and height, Enter or leaving it keeps the size, Escape cancels. Hidden on a phone (CSS, < 720 px).
export function ResizeHandle({ title, size, arranging, onCommit }: { title: string; size: ChartSize; arranging: boolean; onCommit: (size: ChartSize) => void }) {
  const [preview, setPreview] = useState<{ size: ChartSize; width: number; height: number; left: number } | null>(null)
  const [said, setSaid] = useState('')
  const drag = useRef<{ x: number; y: number; panel: DOMRect; grid: number; gridRight: number; gap: number; drawn: number } | null>(null)
  const self = useRef<HTMLButtonElement>(null)
  const measure = () => {
    const panel = self.current?.closest('.chart-panel') as HTMLElement | null
    const parent = panel?.parentElement
    const rect = panel?.getBoundingClientRect() ?? new DOMRect()
    const style = parent ? getComputedStyle(parent) : null
    const gap = style && style.display === 'grid' ? Number.parseFloat(style.columnGap) || 18 : 18
    const box = parent?.getBoundingClientRect() ?? rect
    const svg = panel?.querySelector('.viz-root svg') as SVGElement | null
    const drawn = svg?.getBoundingClientRect().height || 300
    return { panel: rect, grid: box.width, gridRight: box.right, gap, drawn }
  }
  // The outline starts at the panel's top-left corner; one that would run past the grid's right edge (the chart moves
  // to the next row there) is drawn ending at that edge, so the page never scrolls sideways.
  const outline = (next: ChartSize, m = measure()) => {
    const width = spanWidth(widthSpan[next.width], m.grid, m.gap)
    return { size: next, width, left: Math.min(0, m.gridRight - m.panel.left - width), height: Math.max(80, m.panel.height + m.drawn / heightFactor[size.height] * (heightFactor[next.height] - heightFactor[size.height])) }
  }
  const show = (next: ChartSize) => { setPreview(outline(next)); setSaid(`${title}: ${sizeText(next)}`) }
  const finish = (keep: boolean) => {
    const target = preview?.size
    setPreview(null); drag.current = null
    if (keep && target && !sameSize(target, size)) { onCommit(target); setSaid(`${title}: ${sizeText(target)}${arranging ? ', saved for everyone' : ''}`) }
  }
  const down = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    const m = measure()
    drag.current = { x: event.clientX, y: event.clientY, ...m }
    setPreview(outline(size, m))
  }
  const move = (event: PointerEvent<HTMLButtonElement>) => {
    const start = drag.current
    if (!start) return
    const next: ChartSize = { width: snapWidth(start.panel.width + event.clientX - start.x, start.grid, start.gap), height: snapHeight(size.height, start.drawn, event.clientY - start.y) }
    if (!preview || !sameSize(next, preview.size)) show(next)
  }
  const key = (event: KeyboardEvent<HTMLButtonElement>) => {
    const next = stepSize(preview?.size ?? size, event.key)
    if (next) { event.preventDefault(); show(next); return }
    if (event.key === 'Escape' && preview) { event.preventDefault(); event.stopPropagation(); setPreview(null); setSaid(`${title}: ${sizeText(size)} kept`) }
    else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); finish(true) }
  }
  const shown = preview?.size ?? size
  return <>
    {preview && <div className="chart-resize-outline" aria-hidden="true" style={{ left: Math.round(preview.left), width: Math.round(preview.width), height: Math.round(preview.height) }}><span>{sizeText(preview.size)}</span></div>}
    <button ref={self} type="button" className="chart-resize-handle" aria-label={`Resize ${title}: ${sizeText(shown)}`} title={arranging ? 'Drag (or use the arrow keys) to set the size for everyone' : 'Drag (or use the arrow keys) to resize this chart for yourself'}
      onPointerDown={down} onPointerMove={move} onPointerUp={() => finish(true)} onPointerCancel={() => finish(false)} onLostPointerCapture={() => { if (drag.current) finish(true) }}
      onKeyDown={key} onBlur={() => { if (preview && !drag.current) finish(true) }} />
    <span className="sr-only" aria-live="polite">{said}</span>
  </>
}

// Width and Height as two selects — the chart's Display (Insights and Dashboard pop-ups), Size… and Arrange blocks….
export function SizeFields({ size, onChange, heightReason = '', label = '' }: { size: ChartSize; onChange: (size: ChartSize) => void; heightReason?: string; label?: string }) {
  return <div className="form-row chart-size-fields">
    <label>Width
      <select aria-label={label ? `Width of ${label}` : 'Width'} value={size.width} onChange={(event) => onChange({ ...size, width: event.target.value as ChartWidth })}>
        {chartWidths.map((width) => <option key={width} value={width}>{widthNames[width]}</option>)}
      </select>
    </label>
    <label>Height
      <select aria-label={label ? `Height of ${label}` : 'Height'} value={size.height} disabled={Boolean(heightReason)} title={heightReason || undefined} onChange={(event) => onChange({ ...size, height: event.target.value as ChartHeight })}>
        {chartHeights.map((height) => <option key={height} value={height}>{heightLabels[height]}</option>)}
      </select>
    </label>
  </div>
}

// Size… (the chart's ⋯ menu): the owner's size for everyone, saved to Git.
export function SizeDialog({ eyebrow, title, size, heightReason, onCancel, onSave }: { eyebrow: string; title: string; size: ChartSize; heightReason?: string; onCancel: () => void; onSave: (size: ChartSize) => Promise<void> | void }) {
  const [draft, setDraft] = useState(size)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  return <Modal eyebrow={eyebrow} title={`Size of ${title}`} onClose={() => { if (!busy) onCancel() }}>
    <form onSubmit={(event) => { event.preventDefault(); setBusy(true); setError(''); void Promise.resolve(onSave(draft)).then(() => setBusy(false), (failure: unknown) => { setBusy(false); setError(failure instanceof Error ? failure.message : String(failure)) }) }}>
      <p className="muted">The size everyone sees, unless they resized the chart for themselves. On a narrow screen every chart is full width.</p>
      <SizeFields size={draft} onChange={setDraft} heightReason={heightReason} />
      {error && <Notice tone="error">{error}</Notice>}
      <div className="modal-actions"><button type="button" className="ghost" disabled={busy} onClick={onCancel}>Cancel</button><button className="primary" disabled={busy}>{busy ? 'Saving to Git…' : 'Save to Git'}</button></div>
    </form>
  </Modal>
}

// CHT-19, CHT-20 A built-in chart (Team overview …) by its stable id: no owner per page, so its default is the factory
// size (today's: full width, medium) or the size a Tool Owner (layout.defaults) saved for everyone in the shared views
// defaults; every viewer may resize it for themselves.
export function BuiltInChart({ sizes, id, title, factory = stackFactory, className = 'viz-panel', detail, info, action, children }: { sizes: ChartSizes; id: string; title: string; factory?: ChartSize; className?: string; detail?: ReactNode; info?: ReactNode; action?: ReactNode; children: ReactNode }) {
  const { size, source, base } = sizes.resolve(id, factory, sizes.shared(id))
  const { canSetDefault, viewOnly, views } = sizes.env
  const shared = Boolean(sizes.shared(id))
  const share = (next: ChartSize | null, label: string) => { void sizes.saveShared(id, next && sameSize(next, factory) ? null : next).then(() => { if (next) sizes.setOwn(id, undefined); recordJob(`chart-size:${id}`, `${label} · ${title}`, { text: next ? `Saved ${sizeText(next)} for everyone in the shared views defaults.` : 'Everyone sees the chart at its factory size again.' }) }, (failure: unknown) => recordJob(`chart-size:${id}`, `${label} · ${title}`, { text: failure instanceof Error ? failure.message : String(failure), failed: true })) }
  const owner = canSetDefault && !viewOnly && views
  const extra = owner && source === 'viewer' ? <> · <button type="button" className="text-button" onClick={() => share(size, 'Save size for everyone')}>Save size for everyone</button></>
    : owner && shared ? <>Size: everyone’s (saved by a Tool Owner) · <button type="button" className="text-button" onClick={() => share(null, 'Factory size for everyone')}>Use the factory size for everyone</button></> : undefined
  return <ChartPanel className={className} title={title} detail={detail} info={info} action={action} size={size} source={source} extra={extra}
    onResize={(next) => sizes.setOwn(id, next, base)} onReset={() => sizes.setOwn(id, undefined)}>{children}</ChartPanel>
}
