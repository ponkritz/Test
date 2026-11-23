import { csvCell } from './csv.ts'
import type { Merge } from './gitSaveQueue.ts'

// OND-01…OND-10 On-Demand pages: blank tables the team sets up itself — CoNQ (Cost of Non-Quality) first, more pages
// added, renamed and removed by the roles allowed "Set up On-Demand pages". Each page is one JSON file in the Git data
// repository (on-demand/<page-id>.json: name, description, columns with their type and options, rows), with stable ids
// for columns and rows so that renaming or moving a column keeps its values and two saves can be merged entry by entry.

export type OnDemandType = 'text' | 'number' | 'date' | 'dropdown' | 'multi'
export const onDemandTypes: { key: OnDemandType; label: string }[] = [
  { key: 'text', label: 'Text' },
  { key: 'number', label: 'Number' },
  { key: 'date', label: 'Date' },
  { key: 'dropdown', label: 'Dropdown (one value)' },
  { key: 'multi', label: 'Multi-select' },
]
export const typeLabel = (type: OnDemandType) => onDemandTypes.find((entry) => entry.key === type)?.label ?? type
export const hasOptions = (type: OnDemandType) => type === 'dropdown' || type === 'multi'
export type OnDemandValue = string | string[]
export interface OnDemandColumn { id: string; name: string; type: OnDemandType; options: string[]; required: boolean }
export interface OnDemandRow { id: string; cells: Record<string, OnDemandValue> }
export interface OnDemandPage { schema: 1; kind: 'on-demand-page'; id: string; name: string; description: string; columns: OnDemandColumn[]; rows: OnDemandRow[]; insights: Insight[] }

// OND-11…OND-17 Insights: charts and summary tables built from the page's rows, kept in the same file (an `insights`
// list, written only when the page has one) so they travel with the page and are merged with it. Columns are referred
// to by id, so a renamed column is followed; a removed one (or one whose type no longer fits) is kept as written and
// the insight says so instead of drawing (OND-17).
export type InsightType = 'bar' | 'line' | 'pie' | 'table'
export type InsightMeasure = 'count' | 'sum' | 'average'
// A filter on a Dropdown / Multi-select column (values: the options kept; '' is "(none)") or on a Date column (from / to
// month, YYYY-MM, either may be open).
export interface InsightFilter { column: string; values?: string[]; from?: string; to?: string }
export interface Insight { id: string; title: string; type: InsightType; category: string; second: string; measure: InsightMeasure; value: string; filters: InsightFilter[]; sort: 'value' | 'label' }
export const insightTypeKeys: InsightType[] = ['bar', 'line', 'pie', 'table']
export const maxInsights = 40, maxFilters = 10

export const onDemandFolder = 'on-demand'
export const onDemandPath = (id: string) => `${onDemandFolder}/${id}.json`
// GitHub's contents API reads files up to 1 MB inline; stay below it (as the QE Mapping does).
export const onDemandMaxBytes = 900_000
export const maxColumns = 60, maxOptions = 200, maxRows = 5000, maxValue = 2000
const idPattern = /^[A-Za-z0-9][\w-]{0,39}$/
export const pageIdPattern = /^[a-z0-9][a-z0-9-]{0,39}$/
// Only files named like a page id are pages: nothing outside the folder, no other file in it.
export const pageIdOfFile = (name: string) => { const match = /^([a-z0-9][a-z0-9-]{0,39})\.json$/.exec(name); return match ? match[1] : null }

// OND-02: CoNQ is there from the start — shown (not yet in Git) while the folder has no page; the first save creates it.
export const conqId = 'conq'
export const conqPage = (): OnDemandPage => ({ schema: 1, kind: 'on-demand-page', id: conqId, name: 'CoNQ', description: 'Cost of Non-Quality', columns: [], rows: [], insights: [] })
export const emptyPage = (id: string, name: string, description = ''): OnDemandPage => ({ schema: 1, kind: 'on-demand-page', id, name: cleanName(name, 80), description: description.trim().slice(0, 300), columns: [], rows: [], insights: [] })

// Ids that two people adding at the same time cannot both get (the merge keeps entries apart by id).
export function newId(prefix: 'c' | 'r' | 'i', random: () => number = Math.random, now: () => number = Date.now) {
  return `${prefix}${now().toString(36)}${Math.floor(random() * 36 ** 5).toString(36).padStart(5, '0')}`
}
// A page id from its name: lower case, letters, digits and hyphens; a taken one gets -2, -3 …
export function pageIdFor(name: string, taken: string[]) {
  const base = name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32) || 'page'
  let id = base
  for (let n = 2; taken.includes(id); n++) id = `${base}-${n}`
  return id
}
const cleanName = (name: string, max = 120) => name.trim().replace(/\s+/g, ' ').slice(0, max)

// ---- values ----
const isDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value
const isNumber = (value: string) => value.trim() !== '' && Number.isFinite(Number(value))
export const valuesOf = (value: OnDemandValue | undefined): string[] => value == null ? [] : Array.isArray(value) ? value : value === '' ? [] : [value]
export const isEmpty = (value: OnDemandValue | undefined) => valuesOf(value).length === 0
// OND-06: a value that does not fit its column is kept, and shown with why: not in the list, not a number, not a date.
export function cellProblem(column: OnDemandColumn, value: OnDemandValue | undefined): string {
  const values = valuesOf(value)
  if (!values.length) return ''
  if (hasOptions(column.type)) return values.some((entry) => !column.options.includes(entry)) ? 'not in the list' : ''
  if (column.type === 'number') return values.every(isNumber) ? '' : 'not a number'
  if (column.type === 'date') return values.every(isDate) ? '' : 'not a date'
  return ''
}
export const cellText = (value: OnDemandValue | undefined) => valuesOf(value).join(', ')
// The value to sort and export by: a number for a Number column, the text otherwise.
export function cellSortValue(column: OnDemandColumn, value: OnDemandValue | undefined): string | number {
  const text = cellText(value)
  return column.type === 'number' && isNumber(text) ? Number(text) : text
}
// A value as its column keeps it: Multi-select a list, the others one text (a list joined with ", ").
export function convertValue(value: OnDemandValue | undefined, to: OnDemandType): OnDemandValue | undefined {
  const values = valuesOf(value)
  if (!values.length) return undefined
  return to === 'multi' ? values : values.join(', ')
}

// ---- rows ----
export function rowError(columns: OnDemandColumn[], cells: Record<string, OnDemandValue>): string {
  const missing = columns.filter((column) => column.required && isEmpty(cells[column.id]))
  if (missing.length) return `Fill in ${missing.map((column) => `“${column.name}”`).join(', ')}: ${missing.length === 1 ? 'it is' : 'they are'} required.`
  const bad = columns.filter((column) => (column.type === 'number' || column.type === 'date') && cellProblem(column, cells[column.id]))
  if (bad.length) return `${bad.map((column) => `“${column.name}” is ${cellProblem(column, cells[column.id])}`).join('; ')}.`
  if (!columns.some((column) => !isEmpty(cells[column.id]))) return 'Fill in at least one field.'
  return ''
}
const cleanCells = (columns: OnDemandColumn[], cells: Record<string, OnDemandValue>) => Object.fromEntries(columns.flatMap((column): [string, OnDemandValue][] => {
  const value = cells[column.id]
  if (column.type === 'multi') { const list = [...new Set(valuesOf(value).map((entry) => entry.trim().slice(0, maxValue)).filter(Boolean))]; return list.length ? [[column.id, list]] : [] }
  const text = cellText(value).trim().slice(0, maxValue)
  return text ? [[column.id, text]] : []
}))
export function upsertRow(page: OnDemandPage, row: OnDemandRow): OnDemandPage {
  const next = { id: row.id, cells: cleanCells(page.columns, row.cells) }
  return page.rows.some((entry) => entry.id === row.id) ? { ...page, rows: page.rows.map((entry) => entry.id === row.id ? next : entry) } : { ...page, rows: [...page.rows, next] }
}
export const removeRow = (page: OnDemandPage, id: string): OnDemandPage => ({ ...page, rows: page.rows.filter((row) => row.id !== id) })
export function filterRows(page: OnDemandPage, search: string) {
  const words = search.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (!words.length) return page.rows
  return page.rows.filter((row) => { const text = page.columns.map((column) => cellText(row.cells[column.id])).join(' ').toLowerCase(); return words.every((word) => text.includes(word)) })
}
export const renamePage = (page: OnDemandPage, name: string, description: string): OnDemandPage => {
  const value = cleanName(name, 80)
  if (!value) throw new Error('Give the page a name.')
  return { ...page, name: value, description: description.trim().slice(0, 300) }
}

// ---- columns (OND-05, OND-06) ----
// The Columns pop-up edits a copy: each option remembers the label it had (was), so a rename is told from a removal.
export interface ColumnDraft { id: string; name: string; type: OnDemandType; required: boolean; options: { label: string; was?: string }[]; isNew?: boolean }
export const columnDrafts = (columns: OnDemandColumn[]): ColumnDraft[] => columns.map((column) => ({ id: column.id, name: column.name, type: column.type, required: column.required, options: column.options.map((label) => ({ label, was: label })) }))
export function columnsError(drafts: ColumnDraft[]): string {
  if (drafts.length > maxColumns) return `At most ${maxColumns} columns.`
  const names = drafts.map((draft) => cleanName(draft.name).toLowerCase())
  if (names.some((name) => !name)) return 'Every column needs a name.'
  const twice = names.find((name, index) => names.indexOf(name) !== index)
  if (twice) return `There are two columns named “${drafts[names.indexOf(twice)].name.trim()}”.`
  for (const draft of drafts.filter((entry) => hasOptions(entry.type))) {
    const labels = draft.options.map((option) => cleanName(option.label).toLowerCase())
    if (!labels.length) return `“${draft.name.trim()}” is a ${typeLabel(draft.type)} column: add at least one option.`
    if (labels.some((label) => !label)) return `“${draft.name.trim()}” has an empty option: type it or remove it.`
    const again = labels.find((label, index) => labels.indexOf(label) !== index)
    if (again) return `“${draft.name.trim()}” has the option “${draft.options[labels.indexOf(again)].label.trim()}” twice.`
    if (labels.length > maxOptions) return `“${draft.name.trim()}” has more than ${maxOptions} options.`
  }
  return ''
}
const count = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`
// What saving the columns does to the values already in the rows — said before it is done (OND-06). Empty: nothing.
export function columnEffects(page: OnDemandPage, drafts: ColumnDraft[]): string[] {
  const lines: string[] = []
  const used = (id: string) => page.rows.filter((row) => !isEmpty(row.cells[id]))
  for (const column of page.columns) {
    const draft = drafts.find((entry) => entry.id === column.id)
    const rows = used(column.id)
    if (!draft) { if (rows.length) lines.push(`“${column.name}” is removed with its ${count(rows.length, 'value')}.`); continue }
    const renames = new Map(draft.options.filter((option) => option.was && option.was !== cleanName(option.label)).map((option) => [option.was!, cleanName(option.label)]))
    const labels = draft.options.map((option) => cleanName(option.label))
    const after: OnDemandColumn = { ...column, type: draft.type, options: labels }
    const moved = (value: OnDemandValue | undefined) => { const converted = convertValue(value, draft.type); return Array.isArray(converted) ? converted.map((entry) => renames.get(entry) ?? entry) : converted == null ? undefined : renames.get(converted) ?? converted }
    if (draft.type !== column.type && rows.length) {
      const problems = rows.map((row) => cellProblem(after, moved(row.cells[column.id]))).filter(Boolean)
      const joined = column.type === 'multi' && draft.type !== 'multi' ? rows.filter((row) => valuesOf(row.cells[column.id]).length > 1).length : 0
      const kept = `its ${count(rows.length, 'value')} ${rows.length === 1 ? 'is' : 'are'} kept`
      const several = joined ? `; ${count(joined, 'row')} with several choices keep${joined === 1 ? 's' : ''} them as one text` : ''
      const misfit = problems.length ? `; ${problems.length} ${problems.length === 1 ? 'does' : 'do'} not fit and ${problems.length === 1 ? 'is' : 'are'} shown as “${problems[0]}” until changed` : ''
      lines.push(`“${column.name}” changes from ${typeLabel(column.type)} to ${typeLabel(draft.type)}: ${kept}${several}${misfit}.`)
    }
    for (const [from, to] of renames) { const n = rows.filter((row) => valuesOf(row.cells[column.id]).includes(from)).length; if (n) lines.push(`Option “${from}” of “${column.name}” is renamed “${to}” in ${count(n, 'row')}.`) }
    if (hasOptions(draft.type)) {
      const kept = new Set(draft.options.map((option) => option.was).filter(Boolean))
      for (const option of column.options.filter((label) => !kept.has(label))) {
        const n = rows.filter((row) => valuesOf(row.cells[column.id]).includes(option)).length
        if (n) lines.push(`Option “${option}” of “${column.name}” is removed: ${count(n, 'row')} keep${n === 1 ? 's' : ''} it, shown as “not in the list” until changed.`)
      }
    }
  }
  return lines
}
// The page with the edited columns: values follow a type change (kept, a list joined or split), a renamed option is
// renamed in every row, a removed option's values stay (shown "not in the list"), a removed column's values go.
export function applyColumns(page: OnDemandPage, drafts: ColumnDraft[], id: () => string = () => newId('c')): OnDemandPage {
  const columns: OnDemandColumn[] = drafts.map((draft) => ({ id: draft.isNew || !draft.id ? id() : draft.id, name: cleanName(draft.name), type: draft.type, required: draft.required, options: hasOptions(draft.type) ? draft.options.map((option) => cleanName(option.label)) : [] }))
  const rows = page.rows.map((row) => ({ id: row.id, cells: Object.fromEntries(drafts.flatMap((draft, index) => {
    if (draft.isNew) return []
    const before = page.columns.find((column) => column.id === draft.id)
    const value = row.cells[draft.id]
    if (!before || isEmpty(value)) return []
    const renames = new Map(draft.options.filter((option) => option.was && option.was !== cleanName(option.label)).map((option) => [option.was!, cleanName(option.label)]))
    const converted = convertValue(value, draft.type)
    const renamed = Array.isArray(converted) ? [...new Set(converted.map((entry) => renames.get(entry) ?? entry))] : converted == null ? undefined : renames.get(converted) ?? converted
    return renamed == null ? [] : [[columns[index].id, renamed]]
  })) }))
  return { ...page, columns, rows }
}

// ---- export ----
export const tableRows = (page: OnDemandPage, rows = page.rows) => [page.columns.map((column) => column.name), ...rows.map((row) => page.columns.map((column) => cellText(row.cells[column.id])))]
export const tableCsv = (page: OnDemandPage, rows = page.rows) => tableRows(page, rows).map((row) => row.map(csvCell).join(',')).join('\r\n')

// ---- the Git file (OND-08) ----
const text = (value: unknown, max: number) => typeof value === 'string' ? value.slice(0, max) : typeof value === 'number' && Number.isFinite(value) || typeof value === 'boolean' ? String(value) : ''
const types = onDemandTypes.map((entry) => entry.key)
// Reads one page file: anything that is not a page is refused; unknown types become Text, bad ids, duplicates, values
// of unknown columns and values that are not text are dropped; sizes are capped. expectedId: the file's name, which
// wins over the id inside (so a file cannot claim another page's place).
export function parseOnDemandPage(raw: string, expectedId?: string): OnDemandPage {
  let data: unknown
  try { data = JSON.parse(raw) } catch { throw new Error(`${expectedId ? onDemandPath(expectedId) : 'The On-Demand page'} is not valid JSON.`) }
  const file = data as Partial<Record<keyof OnDemandPage, unknown>> | null
  if (!file || typeof file !== 'object' || Array.isArray(file) || file.kind !== 'on-demand-page' || !Array.isArray(file.columns) || !Array.isArray(file.rows)) throw new Error(`${expectedId ? onDemandPath(expectedId) : 'The file'} is not an On-Demand page.`)
  const id = expectedId ?? (typeof file.id === 'string' && pageIdPattern.test(file.id) ? file.id : '')
  if (!pageIdPattern.test(id)) throw new Error('The On-Demand page has no valid id.')
  const seen = new Set<string>()
  const columns = (file.columns as unknown[]).flatMap((entry): OnDemandColumn[] => {
    const column = entry as Partial<Record<keyof OnDemandColumn, unknown>> | null
    if (!column || typeof column.id !== 'string' || !idPattern.test(column.id) || seen.has(column.id)) return []
    seen.add(column.id)
    const type = types.includes(column.type as OnDemandType) ? column.type as OnDemandType : 'text'
    const options = hasOptions(type) && Array.isArray(column.options) ? [...new Set(column.options.map((option) => cleanName(text(option, 120))).filter(Boolean))].slice(0, maxOptions) : []
    return [{ id: column.id, name: cleanName(text(column.name, 120)) || column.id, type, options, required: column.required === true }]
  }).slice(0, maxColumns)
  const rowIds = new Set<string>()
  const rows = (file.rows as unknown[]).flatMap((entry): OnDemandRow[] => {
    const row = entry as Partial<Record<keyof OnDemandRow, unknown>> | null
    if (!row || typeof row.id !== 'string' || !idPattern.test(row.id) || rowIds.has(row.id)) return []
    rowIds.add(row.id)
    const cells = row.cells && typeof row.cells === 'object' && !Array.isArray(row.cells) ? row.cells as Record<string, unknown> : {}
    return [{ id: row.id, cells: Object.fromEntries(columns.flatMap((column): [string, OnDemandValue][] => {
      const value = cells[column.id]
      if (column.type === 'multi') { const list = [...new Set((Array.isArray(value) ? value : [value]).map((item) => text(item, maxValue).trim()).filter(Boolean))].slice(0, maxOptions); return list.length ? [[column.id, list]] : [] }
      const single = (Array.isArray(value) ? value.map((item) => text(item, maxValue)).filter(Boolean).join(', ') : text(value, maxValue)).trim().slice(0, maxValue)
      return single ? [[column.id, single]] : []
    })) }]
  }).slice(0, maxRows)
  return { schema: 1, kind: 'on-demand-page', id, name: cleanName(text(file.name, 80)) || id, description: text(file.description, 300).trim(), columns, rows, insights: parseInsights(file.insights) }
}
// OND-16: the insights of a page file — an unknown type, a bad or repeated id is dropped; a reference to a column that
// is not (or no longer) on the page is kept as written and shown as broken (OND-17); sizes are capped.
const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/
const ref = (value: unknown) => typeof value === 'string' && idPattern.test(value) ? value : ''
export function parseInsights(list: unknown): Insight[] {
  if (!Array.isArray(list)) return []
  const seen = new Set<string>()
  return list.flatMap((entry): Insight[] => {
    const item = entry as Partial<Record<keyof Insight, unknown>> | null
    if (!item || typeof item !== 'object' || typeof item.id !== 'string' || !idPattern.test(item.id) || seen.has(item.id) || !insightTypeKeys.includes(item.type as InsightType)) return []
    seen.add(item.id)
    const type = item.type as InsightType
    const measure: InsightMeasure = item.measure === 'sum' || item.measure === 'average' ? item.measure : 'count'
    const filters = (Array.isArray(item.filters) ? item.filters : []).flatMap((raw): InsightFilter[] => {
      const filter = raw as Partial<Record<keyof InsightFilter, unknown>> | null
      const column = ref(filter?.column)
      if (!filter || !column) return []
      const values = Array.isArray(filter.values) ? [...new Set(filter.values.filter((value): value is string => typeof value === 'string').map((value) => cleanName(value, 120)))].slice(0, maxOptions) : undefined
      const from = typeof filter.from === 'string' && monthPattern.test(filter.from) ? filter.from : undefined
      const to = typeof filter.to === 'string' && monthPattern.test(filter.to) ? filter.to : undefined
      if (!values?.length && !from && !to) return []
      return [{ column, ...(values?.length ? { values } : {}), ...(from ? { from } : {}), ...(to ? { to } : {}) }]
    }).slice(0, maxFilters)
    return [{ id: item.id, title: cleanName(text(item.title, 120)) || 'Untitled', type, category: ref(item.category), second: type === 'pie' ? '' : ref(item.second), measure, value: measure === 'count' ? '' : ref(item.value), filters, sort: type === 'line' ? 'label' : item.sort === 'label' ? 'label' : 'value' }]
  }).slice(0, maxInsights)
}
const insightOut = ({ id, title, type, category, second, measure, value, filters, sort }: Insight) => ({ id, title, type, category, ...(second ? { second } : {}), measure, ...(value ? { value } : {}), ...(filters.length ? { filters } : {}), sort })
export function serializeOnDemandPage(page: OnDemandPage) {
  const out = `${JSON.stringify({ schema: 1, kind: 'on-demand-page', id: page.id, name: page.name, description: page.description, columns: page.columns.map(({ id, name, type, options, required }) => ({ id, name, type, ...(hasOptions(type) ? { options } : {}), ...(required ? { required } : {}) })), rows: page.rows, ...(page.insights.length ? { insights: page.insights.map(insightOut) } : {}) }, null, 1)}\n`
  if (new TextEncoder().encode(out).length > onDemandMaxBytes) throw new Error(`The page is too large to save to Git (over ${Math.round(onDemandMaxBytes / 1000)} KB). Remove rows, or split it into two pages.`)
  return out
}
export const sortPages = (pages: OnDemandPage[]) => [...pages].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true }) || a.id.localeCompare(b.id))

// ---- merging two saves (OND-09, GIT-17) ----
// The name and description are one entry; columns and rows are merged by id; where both saves changed the same entry,
// the later save wins — also between a change and a removal, so a removed row stays removed unless it was changed
// later. The column order follows the save that changed it (the later one when both did); new columns go last.
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
function later<T>(base: T | undefined, mine: T | undefined, theirs: T | undefined, mineLater: boolean): T | undefined {
  if (same(mine, base)) return theirs
  if (same(theirs, base)) return mine
  return mineLater ? mine : theirs
}
function mergeById<T extends { id: string }>(base: T[] | null, mine: T[], theirs: T[], mineLater: boolean): T[] {
  const index = (list: T[] | null) => new Map((list ?? []).map((entry) => [entry.id, entry]))
  const b = index(base), m = index(mine), t = index(theirs)
  const ids = [...new Set([...theirs.map((entry) => entry.id), ...mine.map((entry) => entry.id)])]
  // Without a base (never read here), every entry counts as new: both sides' entries stay.
  return ids.flatMap((id) => { const value = base ? later(b.get(id), m.get(id), t.get(id), mineLater) : m.get(id) ?? t.get(id); return value ? [value] : [] })
}
export const mergeOnDemandText: Merge = (baseText, mineText, theirsText, mineLater) => {
  const read = (raw: string | null) => { if (!raw) return null; try { return parseOnDemandPage(raw) } catch { return null } }
  const mine = read(mineText), theirs = read(theirsText), base = read(baseText)
  if (!mine || !theirs) return mineText
  const head = later(base ? { name: base.name, description: base.description } : undefined, { name: mine.name, description: mine.description }, { name: theirs.name, description: theirs.description }, mineLater) ?? { name: mine.name, description: mine.description }
  const columns = mergeById(base?.columns ?? null, mine.columns, theirs.columns, mineLater)
  const order = later(base?.columns.map((column) => column.id), mine.columns.map((column) => column.id), theirs.columns.map((column) => column.id), mineLater) ?? mine.columns.map((column) => column.id)
  const ordered = [...order.flatMap((id) => columns.filter((column) => column.id === id)), ...columns.filter((column) => !order.includes(column.id))]
  const rows = mergeById(base?.rows ?? null, mine.rows, theirs.rows, mineLater)
  // OND-16: insights merged by id like the columns, their order following the save that changed it.
  const insights = mergeById(base?.insights ?? null, mine.insights, theirs.insights, mineLater)
  const insightOrder = later(base?.insights.map((entry) => entry.id), mine.insights.map((entry) => entry.id), theirs.insights.map((entry) => entry.id), mineLater) ?? mine.insights.map((entry) => entry.id)
  const orderedInsights = [...insightOrder.flatMap((id) => insights.filter((entry) => entry.id === id)), ...insights.filter((entry) => !insightOrder.includes(entry.id))]
  // Read back through the parser: values of columns that are gone are dropped, every rule of the file applies.
  return serializeOnDemandPage(parseOnDemandPage(JSON.stringify({ schema: 1, kind: 'on-demand-page', id: mine.id, ...head, columns: ordered, rows, insights: orderedInsights.map(insightOut) }), mine.id))
}
