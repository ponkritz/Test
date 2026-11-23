import { useState } from 'react'
import { additive, cleanOptions, hasOptions, maxAxisTitle, paletteSize, type ChartOptions, type DateGroup, type Insight, type OnDemandPage } from '../onDemand'
import { autoAxisTitles, dateGroupLabels, limitsFor } from '../onDemandInsights'
import { Info } from './ui'
import { SizeFields } from './ChartSize'
import { pairFactory, withSizeOptions } from '../chartSize'

// CHT-01…CHT-11, CHT-15, CHT-16 The Display options of a chart, the same in the Insights pop-up and the Dashboard block pop-up: only the
// options the chosen type takes are shown, each change validated as the file is (cleanOptions); an option that does not
// fit the measure is shown disabled with the reason (CON-102 style). Colour pins (CHT-09) are the page's or dashboard's,
// for the values of the coloured Dropdown / Multi-select column.

const tops: { value: string; label: string }[] = [{ value: '5', label: 'Top 5 + Other' }, { value: '10', label: 'Top 10 + Other' }, { value: '15', label: 'Top 15 + Other' }, { value: '20', label: 'Top 20 + Other' }, { value: 'all', label: 'All categories' }]
const notAdditive = 'Only for Count of rows or Sum: an average, minimum, maximum or distinct count does not add up.'

export function ChartOptionsFields({ page, insight, pins, onOptions, onPins, scope = 'page' }: { page: OnDemandPage; insight: Insight; pins: Record<string, number> | undefined; onOptions: (options: ChartOptions | undefined) => void; onPins: (pins: Record<string, number> | undefined) => void; scope?: 'page' | 'dashboard' }) {
  const options = insight.options ?? {}
  const [targetText, setTargetText] = useState(options.target ? String(options.target.value) : '')
  const type = insight.type
  const set = (change: Partial<ChartOptions>) => onOptions(cleanOptions(type, insight.measure, { ...options, ...change }))
  const column = (id: string) => page.columns.find((entry) => entry.id === id)
  const dated = type !== 'kpi' && [insight.category, insight.second].some((id) => column(id)?.type === 'date')
  const adds = additive(insight.measure)
  const axes = autoAxisTitles(page, insight)
  // The typed text is kept as typed (spaces between words); the option is the cleaned one.
  const [xText, setXText] = useState(options.xTitle ?? '')
  const [yText, setYText] = useState(options.yTitle ?? '')
  const usual = limitsFor({ ...insight, options: undefined }).maxCategories
  // The column whose values have colours: the stacks or lines, a pie's slices.
  const colored = type === 'pie' ? column(insight.category) : type === 'bar' || type === 'line' ? column(insight.second) : undefined
  const values = colored && hasOptions(colored.type) ? colored.options : []
  const pin = (value: string, slot: number) => { const next = { ...(pins ?? {}) }; if (slot) next[value] = slot; else delete next[value]; onPins(Object.keys(next).length ? next : undefined) }
  const setTarget = (text: string, label = options.target?.label ?? '') => {
    setTargetText(text)
    const value = Number(text)
    if (text.trim() === '' || !Number.isFinite(value)) { const rest = { ...options }; delete rest.target; onOptions(cleanOptions(type, insight.measure, rest)); return }
    set({ target: { value, label } })
  }
  // A dashboard's KPI tile sits in the tile row: nothing to choose.
  if (type === 'kpi' && scope === 'dashboard') return null
  return <fieldset className="od-display"><legend>Display <Info label="Display">How the chart is drawn — nothing here changes which rows are counted. Without a choice the chart looks as before: horizontal bars, dates by month, {usual ? `the ${usual} largest categories and “Other”` : 'every category'}, the values as measured, half width and medium height. The width and height set here are everyone’s; each viewer may still resize a chart for themselves.</Info></legend>
    {type === 'bar' && <label>Orientation
      <select aria-label="Orientation" value={options.orientation ?? 'horizontal'} onChange={(event) => set({ orientation: event.target.value === 'vertical' ? 'vertical' : undefined })}>
        <option value="horizontal">Horizontal bars{insight.second ? ' (stacked)' : ''}</option>
        <option value="vertical">Vertical columns{insight.second ? ' (stacked)' : ''}</option>
      </select>
    </label>}
    {dated && <label>Group dates by
      <select aria-label="Group dates by" value={options.dateGroup ?? 'month'} onChange={(event) => set({ dateGroup: event.target.value === 'month' ? undefined : event.target.value as DateGroup })}>
        {(Object.keys(dateGroupLabels) as DateGroup[]).map((grain) => <option key={grain} value={grain}>{dateGroupLabels[grain].label}</option>)}
      </select>
    </label>}
    {(type === 'bar' || type === 'pie' || type === 'pareto' || type === 'table') && <label>Show
      <select aria-label="Show" value={options.top ? String(options.top) : ''} onChange={(event) => set({ top: event.target.value === '' ? undefined : event.target.value === 'all' ? 'all' : Number(event.target.value) })}>
        <option value="">{usual ? `As usual (top ${usual} + Other)` : 'As usual (all categories)'}</option>
        {tops.map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}
      </select>
      <small>The largest categories by the measure; the rest (with “(none)”) summed as “Other”, last.</small>
    </label>}
    {(type === 'bar' || type === 'line') && <label className="check" title={adds ? undefined : notAdditive}><input type="checkbox" disabled={!adds} checked={Boolean(options.cumulative)} onChange={(event) => set({ cumulative: event.target.checked || undefined })} />Running total</label>}
    {(type === 'bar' || type === 'line' || type === 'table') && <label className="check" title={adds ? undefined : notAdditive}><input type="checkbox" disabled={!adds} checked={Boolean(options.percent)} onChange={(event) => set({ percent: event.target.checked || undefined })} />Percent of total</label>}
    {(type === 'bar' || type === 'line' || type === 'table') && !adds && <small>{notAdditive}</small>}
    {(type === 'bar' || type === 'line' || type === 'pareto') && <div className="form-row">
      <label>Target line (optional)<input aria-label="Target line value" type="number" inputMode="decimal" value={targetText} placeholder="e.g. 1000" onChange={(event) => setTarget(event.target.value)} /></label>
      <label>Its label (optional)<input aria-label="Target line label" maxLength={40} value={options.target?.label ?? ''} disabled={!options.target} title={options.target ? undefined : 'Give the target a value first.'} placeholder="e.g. Budget" onChange={(event) => setTarget(targetText, event.target.value)} /></label>
    </div>}
    {/* CHT-24: the axis titles (charts with axes only); empty = the automatic title, shown as the placeholder. */}
    {(type === 'bar' || type === 'line' || type === 'pareto') && <div className="form-row">
      <label>X axis name (optional)<input aria-label="X axis name" maxLength={maxAxisTitle} value={xText} placeholder={axes.x} onChange={(event) => { setXText(event.target.value); set({ xTitle: event.target.value || undefined }) }} /></label>
      <label>Y axis name (optional)<input aria-label="Y axis name" maxLength={maxAxisTitle} value={yText} placeholder={axes.y} onChange={(event) => { setYText(event.target.value); set({ yTitle: event.target.value || undefined }) }} /></label>
    </div>}
    {/* CHT-15, CHT-16: the owner's size for everyone (each viewer may still resize the chart for themselves). */}
    <SizeFields size={{ width: options.size ?? 'half', height: options.height ?? 'medium' }} heightReason={type === 'kpi' || type === 'table' ? 'A KPI or a summary table takes the height of its content.' : ''}
      onChange={(size) => onOptions(cleanOptions(type, insight.measure, withSizeOptions(options, size, pairFactory, Boolean(options.size) || size.height === (options.height ?? 'medium'))))} />
    {values.length > 0 && <div className="od-colors" role="group" aria-label={`Colours of ${colored!.name}`}>
      <small>Colours of “{colored!.name}” — the same in every chart of this {scope}; “Default” keeps the palette order.</small>
      {values.slice(0, 40).map((value) => { const slot = pins?.[value] ?? 0; return <label key={value} className="od-color"><i style={{ background: slot ? `var(--viz-series-${slot})` : 'transparent' }} aria-hidden="true" /><span>{value}</span>
        <select aria-label={`Colour of ${value}`} value={slot} onChange={(event) => pin(value, Number(event.target.value))}>
          <option value={0}>Default</option>
          {Array.from({ length: paletteSize }, (_, index) => <option key={index} value={index + 1}>Colour {index + 1}</option>)}
        </select>
      </label> })}
    </div>}
  </fieldset>
}
