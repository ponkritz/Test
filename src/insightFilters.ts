import { hasOptions, maxInsightFilters, valuesOf, type InsightFilterSetup, type OnDemandColumn, type OnDemandPage, type OnDemandType } from './onDemand.ts'
import { bucketsOf, monthLabel, noneKey, noneLabel, numberOf, passesFilter } from './onDemandInsights.ts'
import { periodMonths, periodOf, periodYears, type Period } from './dashboard.ts'

// OND-50…OND-56 The filter row of a table page's Insights tab: set up by the page's owners (the period's Date column and
// up to 6 filter columns, saved in the page file as `insightFilters`, onDemand.ts), chosen by each viewer (remembered
// per person), and applied to every chart and summary table of the tab on top of each chart's own filters. Kept free of
// React so that every rule is tested on its own (tests/insight-filters.test.mjs). The period works as the On-Demand
// Dashboard's (DSH-07: Year → Quarter → Month, nothing ticked = the current year), with the same helpers.

export { maxInsightFilters }
// OND-51: the column types a filter of the row can take, and what the viewer chooses for each.
export const filterRowTypes: OnDemandType[] = ['dropdown', 'multi', 'date', 'text', 'number']
export const filterRowColumns = (page: OnDemandPage) => page.columns.filter((column) => filterRowTypes.includes(column.type))
export const periodColumns = (page: OnDemandPage) => page.columns.filter((column) => column.type === 'date')
const typeName: Record<OnDemandType, string> = { text: 'Text', longtext: 'Long text', number: 'Number', currency: 'Currency', date: 'Date', dropdown: 'Dropdown', multi: 'Multi-select' }
export const filterKind = (column: OnDemandColumn) => hasOptions(column.type) ? 'values' : column.type === 'date' ? 'months' : column.type === 'number' ? 'range' : 'contains'

// OND-52: the setup as it can be drawn with the page's columns as they are now. A column removed, or changed to a type
// that cannot filter (the period's to anything but Date), is left out with a note; a renamed column is followed.
export interface ResolvedSetup { period?: OnDemandColumn; fields: OnDemandColumn[]; dropped: string[] }
export function resolveFilterSetup(page: OnDemandPage, setup: InsightFilterSetup | undefined = page.insightFilters): ResolvedSetup {
  const dropped: string[] = []
  if (!setup) return { fields: [], dropped }
  const columnOf = (id: string) => page.columns.find((column) => column.id === id)
  let period: OnDemandColumn | undefined
  if (setup.period) {
    const column = columnOf(setup.period)
    if (!column) dropped.push('The Date column of the period is no longer on the page (removed): the filter row has no period.')
    else if (column.type !== 'date') dropped.push(`“${column.name}” is now a ${typeName[column.type]} column: the period needs a Date column, so the filter row has no period.`)
    else period = column
  }
  const fields: OnDemandColumn[] = []
  for (const id of setup.fields.slice(0, maxInsightFilters)) {
    const column = columnOf(id)
    if (!column) dropped.push('A filter’s column is no longer on the page (removed): the filter is left out.')
    else if (!filterRowTypes.includes(column.type)) dropped.push(`“${column.name}” is now a ${typeName[column.type]} column, which cannot filter: the filter is left out.`)
    else if (column.id !== period?.id && !fields.includes(column)) fields.push(column)
  }
  return { period, fields, dropped }
}
// The setup the Filters… pop-up saves: the period column (or none) and the filter columns in order, without repeats,
// the period column not again as a field, at most 6; nothing chosen = no filter row (the field is removed).
export function cleanSetup(period: string, fields: string[]): InsightFilterSetup | undefined {
  const kept = [...new Set(fields.filter((id) => id && id !== period))].slice(0, maxInsightFilters)
  return period || kept.length ? { ...(period ? { period } : {}), fields: kept } : undefined
}

// ---- the viewer's choice (OND-53, OND-55) ----
export interface FieldChoice { values?: string[]; from?: string; to?: string; text?: string; min?: number; max?: number }
export interface ViewerChoice { period: Period; fields: Record<string, FieldChoice> }
export const noPeriod = (): Period => ({ years: [], quarters: [], months: [] })
export const emptyChoice = (): ViewerChoice => ({ period: noPeriod(), fields: {} })
// OND-55: remembered per person (personal views, key insights-page:<page-id>), else in this browser.
export const insightsViewerKey = (pageId: string) => `insights-page:${pageId}`
export const insightsLocalKey = (pageId: string) => `demand-planning-insights-view-v1:${pageId}`
const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/
const finite = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= 1e15 ? value : undefined
// A remembered choice read back: anything that is not of the shape is dropped (it is free JSON in the person's file).
export function readChoice(raw: unknown): ViewerChoice {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return emptyChoice()
  const saved = raw as { period?: unknown; fields?: unknown }
  const fields: Record<string, FieldChoice> = {}
  if (saved.fields && typeof saved.fields === 'object' && !Array.isArray(saved.fields)) {
    for (const [id, value] of Object.entries(saved.fields as Record<string, unknown>).slice(0, 60)) {
      if (!/^[A-Za-z0-9][\w-]{0,39}$/.test(id) || !value || typeof value !== 'object') continue
      const item = value as Record<string, unknown>
      const values = Array.isArray(item.values) ? [...new Set(item.values.filter((entry): entry is string => typeof entry === 'string').map((entry) => entry.slice(0, 120)))].slice(0, 200) : []
      const from = typeof item.from === 'string' && monthPattern.test(item.from) ? item.from : undefined
      const to = typeof item.to === 'string' && monthPattern.test(item.to) ? item.to : undefined
      const text = typeof item.text === 'string' ? item.text.slice(0, 120) : ''
      const min = finite(item.min), max = finite(item.max)
      const choice: FieldChoice = { ...(values.length ? { values } : {}), ...(from ? { from } : {}), ...(to ? { to } : {}), ...(text.trim() ? { text } : {}), ...(min != null ? { min } : {}), ...(max != null ? { max } : {}) }
      if (Object.keys(choice).length) fields[id] = choice
    }
  }
  return { period: periodOf(saved.period, noPeriod()), fields }
}
const chosen = (choice: FieldChoice | undefined) => Boolean(choice && (choice.values?.length || choice.from || choice.to || choice.text?.trim() || choice.min != null || choice.max != null))
// Reset filters is offered when anything differs from the start: the current year, no filter.
export const isFiltered = (choice: ViewerChoice) => Boolean(choice.period.years.length || choice.period.quarters.length || choice.period.months.length || Object.values(choice.fields).some(chosen))

// ---- applying the row (OND-54) ----
// Does a row pass the viewer's choice for one column: values (any of them, "(none)" for empty or not in the list, as
// the charts' own filters, OND-14), months from / to (a row without a valid date fails), a text it contains (any case),
// a number from / to (a row without a number fails).
export function passesField(column: OnDemandColumn, choice: FieldChoice | undefined, row: OnDemandPage['rows'][number]) {
  if (!chosen(choice)) return true
  const kind = filterKind(column)
  if (kind === 'values') return !choice!.values?.length || passesFilter(column, { column: column.id, values: choice!.values }, row)
  if (kind === 'months') return !choice!.from && !choice!.to || passesFilter(column, { column: column.id, from: choice!.from, to: choice!.to }, row)
  if (kind === 'range') {
    if (choice!.min == null && choice!.max == null) return true
    const value = numberOf(row.cells[column.id])
    return value != null && (choice!.min == null || value >= choice!.min) && (choice!.max == null || value <= choice!.max)
  }
  const words = choice!.text?.trim().toLowerCase()
  return !words || valuesOf(row.cells[column.id]).join(', ').toLowerCase().includes(words)
}
export interface InsightNarrowed { page: OnDemandPage; all: number; shown: number; noDate: number; months: string[] | null; active: boolean }
// The rows every chart of the tab counts. Without a setup the page itself (the charts exactly as before, OND-56).
export function narrowInsightRows(page: OnDemandPage, setup: ResolvedSetup, choice: ViewerChoice, currentYear: number): InsightNarrowed {
  if (!setup.period && !setup.fields.length) return { page, all: page.rows.length, shown: page.rows.length, noDate: 0, months: null, active: false }
  const months = setup.period ? periodMonths(choice.period, currentYear) : null
  const wanted = months ? new Set(months) : null
  let noDate = 0
  const rows = page.rows.filter((row) => {
    if (setup.period && wanted) {
      const [bucket] = bucketsOf(setup.period, row.cells[setup.period.id])
      if (!bucket || bucket.key === noneKey) { noDate++; return false }
      if (!wanted.has(bucket.key)) return false
    }
    return setup.fields.every((column) => passesField(column, choice.fields[column.id], row))
  })
  return { page: { ...page, rows }, all: page.rows.length, shown: rows.length, noDate, months, active: true }
}

// ---- words (OND-53) ----
const quarterNames = (months: string[]) => {
  // Whole years as "2026", whole quarters as "Q1 2026", other months by name.
  const parts: string[] = []
  const set = new Set(months)
  const years = [...new Set(months.map((month) => month.slice(0, 4)))].sort()
  for (const year of years) {
    const all = Array.from({ length: 12 }, (_, index) => `${year}-${String(index + 1).padStart(2, '0')}`)
    if (all.every((month) => set.has(month))) { parts.push(year); continue }
    for (let quarter = 0; quarter < 4; quarter++) {
      const three = all.slice(quarter * 3, quarter * 3 + 3)
      if (three.every((month) => set.has(month))) parts.push(`Q${quarter + 1} ${year}`)
      else for (const month of three) if (set.has(month)) parts.push(monthLabel(month))
    }
  }
  return parts.join(', ')
}
export function periodText(months: string[], currentYear: number, period: Period) {
  const years = periodYears(period, currentYear)
  return months.length === years.length * 12 ? `${years.join(', ')} (whole ${years.length > 1 ? 'years' : 'year'})` : quarterNames(months)
}
export function fieldText(column: OnDemandColumn, choice: FieldChoice | undefined) {
  if (!chosen(choice)) return ''
  const kind = filterKind(column)
  const c = choice!
  if (kind === 'values') return c.values?.length ? `${column.name}: ${c.values.map((entry) => entry === noneKey ? noneLabel : entry).join(', ')}` : ''
  if (kind === 'months') return c.from || c.to ? `${column.name}: ${c.from && c.to ? `${monthLabel(c.from)} – ${monthLabel(c.to)}` : c.from ? `from ${monthLabel(c.from)}` : `up to ${monthLabel(c.to!)}`}` : ''
  if (kind === 'range') return c.min != null || c.max != null ? `${column.name}: ${c.min != null && c.max != null ? `${c.min} – ${c.max}` : c.min != null ? `at least ${c.min}` : `at most ${c.max}`}` : ''
  return c.text?.trim() ? `${column.name} contains “${c.text.trim()}”` : ''
}
// The line under the filter row: "Period on Found on: Q1 2026 · Category: Scrap · 3 of 11 rows counted (2 without a
// date in Found on left out)."
export function scopeText(setup: ResolvedSetup, choice: ViewerChoice, narrowed: InsightNarrowed, currentYear: number) {
  const parts = [
    setup.period && narrowed.months ? `Period on ${setup.period.name}: ${periodText(narrowed.months, currentYear, choice.period)}` : '',
    ...setup.fields.map((column) => fieldText(column, choice.fields[column.id])),
  ].filter(Boolean)
  const rows = `${narrowed.shown} of ${narrowed.all} row${narrowed.all === 1 ? '' : 's'} counted${narrowed.noDate && setup.period ? ` (${narrowed.noDate} without a date in ${setup.period.name} left out)` : ''}`
  return `${parts.length ? `${parts.join(' · ')} · ` : 'No filter · '}${rows}.`
}
// The years the Year list offers: the current year, those in the period column's dates and any chosen.
export function offeredYears(page: OnDemandPage, setup: ResolvedSetup, choice: ViewerChoice, currentYear: number) {
  const found = new Set<number>([currentYear, ...choice.period.years])
  if (setup.period) for (const row of page.rows) { const value = row.cells[setup.period.id]; const year = typeof value === 'string' ? Number(value.slice(0, 4)) : NaN; if (year > 2000 && year < 2100) found.add(year) }
  return [...found].sort((a, b) => a - b)
}
