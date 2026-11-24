import { normalEmail } from './access.ts'
import { merge3, mergeKeyed, type Merge } from './gitSaveQueue.ts'
import { ownersOf, type Viewer } from './menuLayout.ts'
import { releaseFor } from './releasePath.ts'
import { approvalDateFrom, normalizeVersion } from './releaseSource.ts'
import { parseExportDate } from './windchillReleases.ts'
import type { NamingPattern } from './namingPatterns.ts'
import type { AzureWorkItem } from './domain'

// TVL-01…TVL-14 Tool Validations master list: every tool the team has validated, kept in the Git data repository next to
// the planning data (tool-validations.json), so that a tool stays listed — with its dates, notes and hand corrections —
// after it leaves the source it came from. Tools come from several sources: the Tool Validations stream's own Azure
// DevOps query (appended automatically whenever its data is fetched, TVL-04), another Azure DevOps query, an imported
// Windchill export and a manual list kept as an On-Demand table page (each merged with "Merge into master list", TVL-05).
// The same tool from two sources is one entry: the same name (letter case, spaces and punctuation ignored) and version
// (TVL-03). Each entry has a validation date, a validity period (months) and a due date — the source's own due date when
// it has one, else the validation date plus the period (TVL-06). Pure: the file, its checks, merges and the expiry list.

export const toolValidationsFile = 'tool-validations.json'
const kind = 'tool-validations'
export const defaultExpiryDays = 60
export const maxExpiryDays = 730
export const maxTools = 5000
export const maxSources = 20
export const maxPeriodMonths = 600
export const streamSourceId = 'stream'

export type ToolSourceKind = 'stream' | 'azure' | 'windchill' | 'ondemand'
export const sourceKinds: { key: ToolSourceKind; label: string; detail: string }[] = [
  { key: 'stream', label: 'Tool Validations query (Azure DevOps)', detail: 'The connection named “Tool Validations”: its tools are added to the master list whenever its data is fetched.' },
  { key: 'azure', label: 'Another Azure DevOps query', detail: 'Any other connection (cloud or on-premises) fetched in this app; merged with “Merge into master list”.' },
  { key: 'windchill', label: 'Windchill export', detail: 'An export imported under Release Details or Other views; merged with “Merge into master list”.' },
  { key: 'ondemand', label: 'Manual list (On-Demand table page)', detail: 'A table page of the app (On-Demand or another group) where the team keeps tools by hand; merged with “Merge into master list”.' },
]
export const kindLabel = (key: ToolSourceKind) => sourceKinds.find((entry) => entry.key === key)?.label ?? key

// The fields a source is read with (TVL-07). For Azure DevOps sources a field is a field reference name of the query's
// columns or one of the special values below; for a Windchill export a column name; for an On-Demand page a column id.
export type MappingField = 'name' | 'version' | 'validationDate' | 'validityPeriod' | 'dueDate'
export const mappingFields: { key: MappingField; label: string; required?: boolean; help: string }[] = [
  { key: 'name', label: 'Tool name', required: true, help: 'The tool the row belongs to.' },
  { key: 'version', label: 'Version (optional)', help: 'Different versions of a tool are separate entries.' },
  { key: 'validationDate', label: 'Validation date (optional)', help: 'When the tool was validated; the latest of a tool’s rows is kept.' },
  { key: 'validityPeriod', label: 'Validity period (optional)', help: 'How long a validation stays valid: a number (in the unit below) or a text such as “24 months” or “2 years”.' },
  { key: 'dueDate', label: 'Due date (optional)', help: 'An explicit due date; it wins over validation date + validity period.' },
]
export interface ToolMapping { name?: string; version?: string; validationDate?: string; validityPeriod?: string; dueDate?: string; periodUnit: 'months' | 'years'; confirmed: boolean }
export const specialFields: { key: string; label: string }[] = [
  { key: '@tool-name', label: 'Tool (the Tool Validations rule: Area Path folder, else the Title)' },
  { key: '@tool-version', label: 'Version (the Tool Validations rule: Iteration Path release, else the Title’s version)' },
  { key: '@title', label: 'Title' },
  { key: '@approval', label: 'Author Approval Date (as the Releases table’s Approved)' },
]

export interface ToolSource { id: string; kind: ToolSourceKind; name: string; ref?: string; mapping: ToolMapping; mergedAt?: string; mergedBy?: string }
// The link of an entry to a source: whether the source held the tool when it was last read (TVL-04: "not in source now").
export interface ToolLink { inSource: boolean }
export type ManualField = 'name' | 'validationDate' | 'validityMonths' | 'dueDate'
export interface ToolEntry { key: string; name: string; version: string; validationDate?: string; validityMonths?: number; dueDate?: string; manual: ManualField[]; notes?: string; sources: Record<string, ToolLink>; addedAt: string; addedBy?: string; changedAt?: string; changedBy?: string }
export interface ToolValidationsFile { schema: 1; kind: 'tool-validations'; defaultDays: number; owners: string[]; sources: ToolSource[]; tools: ToolEntry[] }

// ---- matching (TVL-03) ----
// The same tool: the same name, ignoring letter case and every run of spaces and punctuation, and the same version
// (a leading "v" and trailing ".0" ignored: "v2.1.0" = "2.1"); no version is a version of its own.
export const nameKey = (name: string) => name.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')
export const versionKey = (version: string) => normalizeVersion(version.trim())
export const toolKey = (name: string, version: string) => `${nameKey(name)}@${versionKey(version)}`

// ---- dates and periods (TVL-06) ----
const plainDay = /^(\d{4})-(\d{2})-(\d{2})$/
export function isDay(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const match = plainDay.exec(value)
  if (!match) return false
  const at = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
  return at.getUTCDate() === Number(match[3]) && at.getUTCMonth() === Number(match[2]) - 1
}
// A date as a source writes it (ISO with or without a time, 27-Oct-2026, Oct 27, 2026, 27.10.2026, 10/27/2026), as its
// UTC day; undefined when it is not a date.
export function dayOf(value: unknown): string | undefined {
  if (value == null || value === '' || typeof value === 'boolean') return undefined
  const text = String(value).trim()
  if (/^\d{4}-\d{2}-\d{2}T/.test(text)) { const at = Date.parse(text); return Number.isFinite(at) ? new Date(at).toISOString().slice(0, 10) : undefined }
  const at = parseExportDate(text)
  return at === undefined ? undefined : new Date(at).toISOString().slice(0, 10)
}
// A validity period in months: a number in the source's unit, or a text with its unit ("24 months", "2 years", "2y",
// "18 mo"). Whole months, 1 to 600; anything else is not a period.
export function monthsOf(value: unknown, unit: 'months' | 'years' = 'months'): number | undefined {
  if (value == null || value === '' || typeof value === 'boolean') return undefined
  const text = String(value).trim().toLowerCase().replace(',', '.')
  const match = /^(\d+(?:\.\d+)?)\s*(y|yr|yrs|year|years|m|mo|mos|month|months)?$/.exec(text)
  if (!match) return undefined
  const number = Number(match[1]), inYears = match[2] ? match[2].startsWith('y') : unit === 'years'
  const months = Math.round(inYears ? number * 12 : number)
  return months >= 1 && months <= maxPeriodMonths ? months : undefined
}
// The day a number of calendar months after a day; a day the month does not have becomes its last (31 Jan + 1 → 28/29 Feb).
export function addMonths(day: string, months: number): string {
  const [year, month, date] = day.split('-').map(Number)
  const target = new Date(Date.UTC(year, month - 1 + months, 1))
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate()
  return new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), Math.min(date, last))).toISOString().slice(0, 10)
}
export type DueFrom = 'source' | 'entered' | 'calculated' | 'none'
// TVL-06: the due date shown — an explicit one (from a source, or entered by hand) wins; else validation date + period.
export function dueOf(entry: Pick<ToolEntry, 'validationDate' | 'validityMonths' | 'dueDate' | 'manual'>): { due?: string; from: DueFrom } {
  if (entry.dueDate) return { due: entry.dueDate, from: entry.manual.includes('dueDate') ? 'entered' : 'source' }
  if (entry.validationDate && entry.validityMonths) return { due: addMonths(entry.validationDate, entry.validityMonths), from: 'calculated' }
  return { from: 'none' }
}
export const dueFromLabel: Record<DueFrom, string> = { source: 'from the source', entered: 'entered by hand', calculated: 'validation date + validity period', none: 'no due date' }
const dayMs = 86_400_000
export const daysBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / dayMs)

// ---- the expiry view (TVL-08) ----
export type ExpiryStatus = 'overdue' | 'due' | 'none' | 'later'
export interface ExpiryRow { entry: ToolEntry; due?: string; from: DueFrom; days?: number; status: ExpiryStatus }
export const statusLabel: Record<ExpiryStatus, string> = { overdue: 'Overdue', due: 'Due soon', none: 'No due date', later: 'Later' }
const statusOrder: Record<ExpiryStatus, number> = { overdue: 0, due: 1, none: 2, later: 3 }
// Every entry with its due date and days left (negative: overdue) on the UTC day `today`; the list shown is the overdue
// ones first, then those due within `days` days (soonest first), then those without a due date (by name). Entries due
// later are left out (they are on the Master list).
export function expiryRows(tools: ToolEntry[], today: string, days: number): ExpiryRow[] {
  return tools.map((entry): ExpiryRow => {
    const { due, from } = dueOf(entry)
    if (!due) return { entry, from, status: 'none' }
    const left = daysBetween(today, due)
    return { entry, due, from, days: left, status: left < 0 ? 'overdue' : left <= days ? 'due' : 'later' }
  }).filter((row) => row.status !== 'later').sort((a, b) => statusOrder[a.status] - statusOrder[b.status] || (a.days ?? 0) - (b.days ?? 0) || a.entry.name.localeCompare(b.entry.name, 'en', { sensitivity: 'base' }) || a.entry.version.localeCompare(b.entry.version))
}
export const daysLeftText = (row: Pick<ExpiryRow, 'days'>) => row.days == null ? '' : row.days < 0 ? `${-row.days} day${row.days === -1 ? '' : 's'} overdue` : row.days === 0 ? 'Due today' : `${row.days} day${row.days === 1 ? '' : 's'} left`
// TVL-09: the number of days a viewer looks ahead — their own (personal views), else the team default from the file.
export function cleanDays(value: unknown): number | undefined {
  const number = typeof value === 'string' && value.trim() ? Number(value) : value
  return typeof number === 'number' && Number.isInteger(number) && number >= 1 && number <= maxExpiryDays ? number : undefined
}

// ---- the status of an entry (TVL-04) ----
export type EntryState = 'in-source' | 'gone' | 'manual'
export const entryState = (entry: Pick<ToolEntry, 'sources'>): EntryState => { const links = Object.values(entry.sources); return !links.length ? 'manual' : links.some((link) => link.inSource) ? 'in-source' : 'gone' }
export const entryStateLabel: Record<EntryState, string> = { 'in-source': 'In source', gone: 'Not in source now', manual: 'Added by hand' }

// ---- the file: empty, parse (strict), serialize (TVL-02) ----
export const emptyMapping = (): ToolMapping => ({ periodUnit: 'months', confirmed: false })
export const streamSource = (): ToolSource => ({ id: streamSourceId, kind: 'stream', name: 'Tool Validations', mapping: emptyMapping() })
export const emptyFile = (): ToolValidationsFile => ({ schema: 1, kind, defaultDays: defaultExpiryDays, owners: [], sources: [streamSource()], tools: [] })
export interface Refused { name: string; reason: string }
export interface Parsed { file: ToolValidationsFile; refused: Refused[] }

const record = (value: unknown): Record<string, unknown> | null => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
const text = (value: unknown, max: number) => typeof value === 'string' && value.trim() && value.length <= max ? value.trim() : undefined
const stamp = (value: unknown) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?Z$/.test(value) ? value : undefined
const sourceIdPattern = /^[a-z0-9][a-z0-9-]{0,39}$/
const manualFields: ManualField[] = ['name', 'validationDate', 'validityMonths', 'dueDate']
function cleanMapping(value: unknown): ToolMapping {
  const raw = record(value) ?? {}
  const mapping: ToolMapping = { periodUnit: raw.periodUnit === 'years' ? 'years' : 'months', confirmed: raw.confirmed === true }
  for (const field of mappingFields) { const found = text(raw[field.key], 200); if (found) mapping[field.key] = found }
  return mapping
}
function cleanSource(value: unknown): ToolSource | string {
  const raw = record(value)
  if (!raw) return 'not an object'
  const id = typeof raw.id === 'string' && sourceIdPattern.test(raw.id) ? raw.id : ''
  if (!id) return 'its id is missing or not lower-case letters, digits and hyphens'
  const sourceKind = sourceKinds.find((entry) => entry.key === raw.kind)?.key
  if (!sourceKind) return `unknown kind “${String(raw.kind)}”`
  if ((sourceKind === 'stream') !== (id === streamSourceId)) return 'only the source “stream” is the Tool Validations query'
  const name = text(raw.name, 80)
  if (!name) return 'its name is missing or longer than 80 characters'
  const ref = text(raw.ref, 200)
  if (sourceKind !== 'stream' && !ref) return 'it names no connection, export or page'
  const mergedAt = stamp(raw.mergedAt), mergedBy = text(raw.mergedBy, 200)
  return { id, kind: sourceKind, name, ...(ref && sourceKind !== 'stream' ? { ref } : {}), mapping: cleanMapping(raw.mapping), ...(mergedAt ? { mergedAt } : {}), ...(mergedBy ? { mergedBy } : {}) }
}
function cleanTool(value: unknown, sources: Set<string>): ToolEntry | string {
  const raw = record(value)
  if (!raw) return 'not an object'
  const name = text(raw.name, 200)
  if (!name || !nameKey(name)) return 'no tool name (1 to 200 characters with a letter or digit)'
  const version = typeof raw.version === 'string' && raw.version.length <= 60 ? raw.version.trim() : raw.version == null ? '' : null
  if (version == null) return 'its version is not a text of up to 60 characters'
  for (const field of ['validationDate', 'dueDate'] as const) if (raw[field] != null && !isDay(raw[field])) return `${field === 'dueDate' ? 'due date' : 'validation date'} “${String(raw[field])}” is not a date (YYYY-MM-DD)`
  const months = raw.validityMonths
  if (months != null && !(typeof months === 'number' && Number.isInteger(months) && months >= 1 && months <= maxPeriodMonths)) return `validity period “${String(months)}” is not a whole number of months from 1 to ${maxPeriodMonths}`
  const notes = raw.notes == null ? undefined : typeof raw.notes === 'string' && raw.notes.length <= 2000 ? raw.notes : null
  if (notes === null) return 'its notes are not a text of up to 2000 characters'
  const addedAt = stamp(raw.addedAt)
  if (!addedAt) return 'no time it was added (addedAt)'
  const links = record(raw.sources) ?? {}
  const linked: Record<string, ToolLink> = {}
  for (const [id, link] of Object.entries(links)) if (sources.has(id) && record(link)) linked[id] = { inSource: record(link)!.inSource === true }
  const manual = Array.isArray(raw.manual) ? manualFields.filter((field) => (raw.manual as unknown[]).includes(field)) : []
  const changedAt = stamp(raw.changedAt), addedBy = text(raw.addedBy, 200), changedBy = text(raw.changedBy, 200)
  return {
    key: toolKey(name, version), name, version,
    ...(isDay(raw.validationDate) ? { validationDate: raw.validationDate } : {}), ...(typeof months === 'number' ? { validityMonths: months } : {}), ...(isDay(raw.dueDate) ? { dueDate: raw.dueDate } : {}),
    manual, ...(notes ? { notes } : {}), sources: linked, addedAt, ...(addedBy ? { addedBy } : {}), ...(changedAt ? { changedAt } : {}), ...(changedBy ? { changedBy } : {}),
  }
}
// TVL-02: a file that is not JSON or not a tool-validations file of schema 1 is refused whole (an Error: the list last
// read stays in use); each source and tool is checked on its own and a bad one is refused with why, the others used.
// The Tool Validations query (source "stream") is always there.
export function parseToolValidations(input: string | null | undefined): Parsed {
  if (input == null || !input.trim()) return { file: emptyFile(), refused: [] }
  let raw: unknown
  try { raw = JSON.parse(input) } catch { throw new Error(`${toolValidationsFile} is not valid JSON.`) }
  const top = record(raw)
  if (!top || top.schema !== 1 || top.kind !== kind) throw new Error(`${toolValidationsFile} is not a Tool Validations master list (schema 1, kind “${kind}”).`)
  const refused: Refused[] = []
  const sources: ToolSource[] = []
  for (const value of Array.isArray(top.sources) ? top.sources : []) {
    const source = cleanSource(value)
    if (typeof source === 'string') { refused.push({ name: `Source “${String(record(value)?.name ?? record(value)?.id ?? '?')}”`, reason: source }); continue }
    if (sources.some((entry) => entry.id === source.id)) { refused.push({ name: `Source “${source.name}”`, reason: `the id “${source.id}” is used twice` }); continue }
    if (sources.length >= maxSources) { refused.push({ name: `Source “${source.name}”`, reason: `more than ${maxSources} sources` }); continue }
    sources.push(source)
  }
  if (!sources.some((source) => source.id === streamSourceId)) sources.unshift(streamSource())
  const ids = new Set(sources.map((source) => source.id))
  const tools: ToolEntry[] = [], seen = new Set<string>()
  for (const value of Array.isArray(top.tools) ? top.tools : []) {
    const tool = cleanTool(value, ids)
    const label = String(record(value)?.name ?? '?')
    if (typeof tool === 'string') { refused.push({ name: label, reason: tool }); continue }
    if (seen.has(tool.key)) { refused.push({ name: label, reason: 'the same tool and version is listed twice' }); continue }
    if (tools.length >= maxTools) { refused.push({ name: label, reason: `more than ${maxTools} tools` }); continue }
    seen.add(tool.key); tools.push(tool)
  }
  const days = cleanDays(top.defaultDays)
  return { file: { schema: 1, kind, defaultDays: days ?? defaultExpiryDays, owners: ownersOf(top.owners), sources, tools: sortTools(tools) }, refused }
}
const sortTools = (tools: ToolEntry[]) => [...tools].sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }) || a.version.localeCompare(b.version) || a.key.localeCompare(b.key))
// The key is worked out from the name and version, never stored; fields in a fixed order so a change is a small diff.
function toolJson(tool: ToolEntry) {
  return { name: tool.name, version: tool.version, ...(tool.validationDate ? { validationDate: tool.validationDate } : {}), ...(tool.validityMonths ? { validityMonths: tool.validityMonths } : {}), ...(tool.dueDate ? { dueDate: tool.dueDate } : {}), ...(tool.manual.length ? { manual: manualFields.filter((field) => tool.manual.includes(field)) } : {}), ...(tool.notes ? { notes: tool.notes } : {}), sources: Object.fromEntries(Object.keys(tool.sources).sort().map((id) => [id, { inSource: tool.sources[id].inSource }])), addedAt: tool.addedAt, ...(tool.addedBy ? { addedBy: tool.addedBy } : {}), ...(tool.changedAt ? { changedAt: tool.changedAt } : {}), ...(tool.changedBy ? { changedBy: tool.changedBy } : {}) }
}
function sourceJson(source: ToolSource) {
  const mapping = { ...Object.fromEntries(mappingFields.filter((field) => source.mapping[field.key]).map((field) => [field.key, source.mapping[field.key]])), periodUnit: source.mapping.periodUnit, confirmed: source.mapping.confirmed }
  return { id: source.id, kind: source.kind, name: source.name, ...(source.ref ? { ref: source.ref } : {}), mapping, ...(source.mergedAt ? { mergedAt: source.mergedAt } : {}), ...(source.mergedBy ? { mergedBy: source.mergedBy } : {}) }
}
export const serializeToolValidations = (file: ToolValidationsFile) => `${JSON.stringify({ schema: 1, kind, defaultDays: file.defaultDays, owners: file.owners, sources: file.sources.map(sourceJson), tools: sortTools(file.tools).map(toolJson) }, null, 2)}\n`

// ---- reading a source (TVL-07) ----
export interface ToolInput { name: string; version: string; validationDate?: string; validityMonths?: number; dueDate?: string }
const later = (a?: string, b?: string) => !a ? b : !b ? a : a >= b ? a : b
// Rows of one tool (and version) are one entry: the latest validation date and due date; the period of the row with
// the latest validation date, else the first one given.
export function aggregate(inputs: ToolInput[]): Map<string, ToolInput> {
  const byKey = new Map<string, ToolInput>()
  for (const input of inputs) {
    const name = input.name.replace(/\s+/g, ' ').trim(), version = input.version.replace(/\s+/g, ' ').trim()
    if (!nameKey(name) || name.length > 200 || version.length > 60) continue
    const key = toolKey(name, version), known = byKey.get(key)
    if (!known) { byKey.set(key, { ...input, name, version }); continue }
    const newer = Boolean(input.validationDate && (!known.validationDate || input.validationDate > known.validationDate))
    byKey.set(key, { ...known, validationDate: later(known.validationDate, input.validationDate), dueDate: later(known.dueDate, input.dueDate), validityMonths: newer && input.validityMonths ? input.validityMonths : known.validityMonths ?? input.validityMonths })
  }
  return byKey
}
// Azure DevOps (the stream's query or another one): a field reference name of the query's columns, or a special value.
export function azureValue(item: AzureWorkItem, field: string | undefined, patterns: NamingPattern[] = []): string | undefined {
  if (!field) return undefined
  if (field === '@tool-name' || field === '@tool-version') { const release = releaseFor(item, 'tool', patterns); return field === '@tool-name' ? release?.name : release?.release }
  if (field === '@title' || field === 'System.Title') return item.title
  if (field === '@approval') return item.approvalDate ?? approvalDateFrom(item.fields ?? {})
  if (field === 'System.AreaPath') return item.areaPath
  if (field === 'System.IterationPath') return item.iterationPath
  const value = item.fields?.[field]
  return value == null || value === '' ? undefined : String(value)
}
export function inputsFromRows<R>(rows: R[], mapping: ToolMapping, read: (row: R, field: string | undefined) => string | undefined): ToolInput[] {
  return rows.flatMap((row) => {
    const name = read(row, mapping.name)?.trim()
    if (!name) return []
    const validationDate = dayOf(read(row, mapping.validationDate)), dueDate = dayOf(read(row, mapping.dueDate)), validityMonths = monthsOf(read(row, mapping.validityPeriod), mapping.periodUnit)
    return [{ name, version: read(row, mapping.version)?.trim() ?? '', ...(validationDate ? { validationDate } : {}), ...(validityMonths ? { validityMonths } : {}), ...(dueDate ? { dueDate } : {}) }]
  })
}
// What a source offers to map: its fields or columns, as [key, label].
export function azureFieldOptions(items: AzureWorkItem[]): [string, string][] {
  const refs = [...new Set(items.flatMap((item) => Object.keys(item.fields ?? {})))].sort()
  return [...specialFields.map((field): [string, string] => [field.key, field.label]), ...refs.map((ref): [string, string] => [ref, ref])]
}
// TVL-07: the guesses while a source's mapping has not been saved — the Tool Validations rule for the name and version
// of an Azure DevOps source, its Author Approval Date for the validation date, Microsoft.VSTS.Scheduling.DueDate (else
// TargetDate) for the due date when the query has it; for a Windchill export or a page, the column whose name fits.
const guessColumn = (options: [string, string][], pattern: RegExp, not?: RegExp) => options.find(([, label]) => pattern.test(label) && !(not && not.test(label)))?.[0]
export function guessMapping(sourceKind: ToolSourceKind, options: [string, string][]): ToolMapping {
  if (sourceKind === 'stream' || sourceKind === 'azure') {
    const has = (ref: string) => options.some(([key]) => key === ref)
    const due = has('Microsoft.VSTS.Scheduling.DueDate') ? 'Microsoft.VSTS.Scheduling.DueDate' : has('Microsoft.VSTS.Scheduling.TargetDate') ? 'Microsoft.VSTS.Scheduling.TargetDate' : undefined
    const period = guessColumn(options.filter(([key]) => !key.startsWith('@')), /validity|valid\w*\s*period|revalidat\w*\s*(period|interval)/i)
    return { name: '@tool-name', version: '@tool-version', validationDate: '@approval', ...(period ? { validityPeriod: period } : {}), ...(due ? { dueDate: due } : {}), periodUnit: 'months', confirmed: false }
  }
  const name = guessColumn(options, /^(tool(\s*name)?|name|title)$/i) ?? guessColumn(options, /tool|name|title/i)
  const version = guessColumn(options, /version|^rev(ision)?$/i)
  const validationDate = guessColumn(options, /valid\w*\s*date|date\s*of\s*valid|approv\w*\s*date|released?\s*date/i, /due|expir|next/i)
  const validityPeriod = guessColumn(options, /validity|period|interval/i)
  const dueDate = guessColumn(options, /due|expir|revalid|next\s*valid/i)
  return { ...(name ? { name } : {}), ...(version ? { version } : {}), ...(validationDate ? { validationDate } : {}), ...(validityPeriod ? { validityPeriod } : {}), ...(dueDate ? { dueDate } : {}), periodUnit: 'months', confirmed: false }
}
// The mapping a source is read with: the saved one, else the guesses.
export const mappingFor = (source: ToolSource, options: [string, string][]) => source.mapping.confirmed ? source.mapping : guessMapping(source.kind, options)

// ---- merging a source into the master list (TVL-04, TVL-05) ----
// The values of a tool read from a source replace the entry's — except fields corrected by hand (manual), which stay —
// and only when the source gives one (a blank never clears a date). The entry is linked to the source (in source now);
// an entry linked to it that the source no longer holds is marked "not in source now" and stays. A new tool is added.
// `inputs` is the whole of the source as last read. Returns the same file object when nothing changes.
export interface MergeResult { file: ToolValidationsFile; added: string[]; updated: string[]; gone: string[] }
export function mergeSource(file: ToolValidationsFile, sourceId: string, inputs: ToolInput[], at: string, by?: string): MergeResult {
  const incoming = aggregate(inputs)
  const added: string[] = [], updated: string[] = [], gone: string[] = []
  const tools = file.tools.map((entry) => {
    const input = incoming.get(entry.key), link = entry.sources[sourceId]
    if (!input) {
      if (!link?.inSource) return entry
      gone.push(entry.name)
      return { ...entry, sources: { ...entry.sources, [sourceId]: { inSource: false } } }
    }
    incoming.delete(entry.key)
    const next: ToolEntry = { ...entry, sources: { ...entry.sources, [sourceId]: { inSource: true } } }
    if (!entry.manual.includes('validationDate') && input.validationDate) next.validationDate = input.validationDate
    if (!entry.manual.includes('validityMonths') && input.validityMonths) next.validityMonths = input.validityMonths
    if (!entry.manual.includes('dueDate') && input.dueDate) next.dueDate = input.dueDate
    const changed = JSON.stringify(toolJson(next)) !== JSON.stringify(toolJson(entry))
    if (changed) updated.push(entry.name)
    return changed ? next : entry
  })
  for (const [key, input] of incoming) {
    if (tools.length >= maxTools) break
    added.push(input.name)
    tools.push({ key, name: input.name, version: input.version, ...(input.validationDate ? { validationDate: input.validationDate } : {}), ...(input.validityMonths ? { validityMonths: input.validityMonths } : {}), ...(input.dueDate ? { dueDate: input.dueDate } : {}), manual: [], sources: { [sourceId]: { inSource: true } }, addedAt: at, ...(by ? { addedBy: by } : {}) })
  }
  if (!added.length && !updated.length && !gone.length) return { file, added, updated, gone }
  return { file: { ...file, tools: sortTools(tools) }, added, updated, gone }
}
export const markMerged = (file: ToolValidationsFile, sourceId: string, at: string, by?: string): ToolValidationsFile => ({ ...file, sources: file.sources.map((source) => source.id === sourceId ? { ...source, mergedAt: at, ...(by ? { mergedBy: by } : {}) } : source) })
export const mergeSummary = (result: Pick<MergeResult, 'added' | 'updated' | 'gone'>) => `${result.added.length} new, ${result.updated.length} updated, ${result.gone.length} no longer in the source`

// ---- changes by hand (TVL-10) ----
export interface ToolEdit { name: string; version: string; validationDate: string; validityMonths: string; dueDate: string; notes: string }
// The problems of a form (empty: none). A new tool or a renamed one must not be the same tool as another entry.
export function editProblem(file: ToolValidationsFile, edit: ToolEdit, editing?: string): string {
  if (!nameKey(edit.name) || edit.name.trim().length > 200) return 'Enter the tool name (1 to 200 characters with a letter or digit).'
  if (edit.version.trim().length > 60) return 'The version is at most 60 characters.'
  if (edit.validationDate && !isDay(edit.validationDate)) return 'The validation date is not a date.'
  if (edit.dueDate && !isDay(edit.dueDate)) return 'The due date is not a date.'
  if (edit.validityMonths.trim() && !monthsOf(edit.validityMonths.trim())) return `The validity period is a whole number of months from 1 to ${maxPeriodMonths}.`
  if (edit.notes.length > 2000) return 'Notes are at most 2000 characters.'
  const key = toolKey(edit.name, edit.version)
  if (key !== editing && file.tools.some((entry) => entry.key === key)) return 'This tool and version is already in the master list.'
  return ''
}
// A field changed by hand is kept from then on (a later merge does not replace it); emptied, it follows the sources again.
export function saveTool(file: ToolValidationsFile, edit: ToolEdit, at: string, by: string, editing?: string): ToolValidationsFile {
  const current = editing ? file.tools.find((entry) => entry.key === editing) : undefined
  const name = edit.name.replace(/\s+/g, ' ').trim(), version = edit.version.trim()
  const values = { validationDate: edit.validationDate || undefined, validityMonths: monthsOf(edit.validityMonths.trim()), dueDate: edit.dueDate || undefined }
  const manual = new Set<ManualField>(current?.manual ?? [])
  const fields = ['validationDate', 'validityMonths', 'dueDate'] as const
  for (const field of fields) {
    if (!current) { if (values[field] !== undefined) manual.add(field); continue }
    if (values[field] === current[field]) continue
    if (values[field] === undefined) manual.delete(field); else manual.add(field)
  }
  const sourced = current && Object.keys(current.sources).length > 0
  if (current && sourced && name !== current.name) manual.add('name')
  const entry: ToolEntry = {
    key: toolKey(name, version), name, version,
    ...(values.validationDate ? { validationDate: values.validationDate } : {}), ...(values.validityMonths ? { validityMonths: values.validityMonths } : {}), ...(values.dueDate ? { dueDate: values.dueDate } : {}),
    manual: manualFields.filter((field) => manual.has(field)), ...(edit.notes.trim() ? { notes: edit.notes.trim() } : {}),
    sources: current?.sources ?? {}, addedAt: current?.addedAt ?? at, ...(current?.addedBy || !current ? { addedBy: current?.addedBy ?? by } : {}), ...(current ? { changedAt: at, changedBy: by } : {}),
  }
  return { ...file, tools: sortTools([...file.tools.filter((tool) => tool.key !== editing), entry]) }
}
export const editOf = (entry?: ToolEntry): ToolEdit => ({ name: entry?.name ?? '', version: entry?.version ?? '', validationDate: entry?.validationDate ?? '', validityMonths: entry?.validityMonths ? String(entry.validityMonths) : '', dueDate: entry?.dueDate ?? '', notes: entry?.notes ?? '' })
export const removeTool = (file: ToolValidationsFile, key: string): ToolValidationsFile => ({ ...file, tools: file.tools.filter((entry) => entry.key !== key) })
// A tool from a source keeps its name and version as the source gives them (they are how it is matched); a tool added
// by hand can be renamed.
export const nameLocked = (entry?: ToolEntry) => Boolean(entry && Object.keys(entry.sources).length > 0)

// ---- sources (TVL-07) ----
export function addSource(file: ToolValidationsFile, input: { kind: Exclude<ToolSourceKind, 'stream'>; name: string; ref: string; mapping: ToolMapping }): ToolValidationsFile {
  const base = input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30) || input.kind
  let id = base, n = 2
  while (file.sources.some((source) => source.id === id) || id === streamSourceId) id = `${base}-${n++}`
  return { ...file, sources: [...file.sources, { id, kind: input.kind, name: input.name.trim().slice(0, 80), ref: input.ref, mapping: input.mapping }] }
}
export const setMapping = (file: ToolValidationsFile, id: string, mapping: ToolMapping): ToolValidationsFile => ({ ...file, sources: file.sources.map((source) => source.id === id ? { ...source, mapping: { ...mapping, confirmed: true } } : source) })
// A removed source's links go with it; its tools stay (added by hand when no other source has them).
export function removeSource(file: ToolValidationsFile, id: string): ToolValidationsFile {
  if (id === streamSourceId) return file
  return { ...file, sources: file.sources.filter((source) => source.id !== id), tools: file.tools.map((entry) => { if (!entry.sources[id]) return entry; const sources = { ...entry.sources }; delete sources[id]; return { ...entry, sources } }) }
}
// ---- TVL-14: the tabs of the Tool Validations page ----
// Master list (opens first, with the expiry view on top), Azure (the Tool Validations query: its releases of the month
// and its rows), then one tab per other source in the order added — a removed source's tab goes with it — and Setup
// last (the sources and the team settings).
export const toolTabMaster = 'tool-master', toolTabAzure = 'tool-azure', toolTabSetup = 'tool-setup'
export const toolSourceTab = (id: string) => `tool-source:${id}`
export const toolTabs = (file: Pick<ToolValidationsFile, 'sources'>): { key: string; label: string; source?: ToolSource }[] => [
  { key: toolTabMaster, label: 'Master list' }, { key: toolTabAzure, label: 'Azure' },
  ...file.sources.filter((source) => source.id !== streamSourceId).map((source) => ({ key: toolSourceTab(source.id), label: source.name, source })),
  { key: toolTabSetup, label: 'Setup' },
]
// The tabs remembered before v10.13 (Releases "main", Validation expiry, Source data "raw") open where their content is
// now; a tab that no longer exists (a removed source) opens the Master list.
const oldToolTabs: Record<string, string> = { main: toolTabAzure, raw: toolTabAzure, 'tool-expiry': toolTabMaster }
export function openToolTab(chosen: string, keys: string[]): string {
  const key = oldToolTabs[chosen] ?? chosen
  return keys.includes(key) ? key : toolTabMaster
}
export const setTeam = (file: ToolValidationsFile, days: number, owners: string[]): ToolValidationsFile => ({ ...file, defaultDays: cleanDays(days) ?? file.defaultDays, owners: ownersOf(owners) })
export const sourceProblem = (file: ToolValidationsFile, kindKey: ToolSourceKind, ref: string, name: string) => !name.trim() || name.trim().length > 80 ? 'Enter a name of up to 80 characters.' : !ref ? 'Choose what to read.' : file.sources.length >= maxSources ? `At most ${maxSources} sources.` : file.sources.some((source) => source.kind === kindKey && source.ref === ref) ? 'This one is already a source.' : ''

// ---- rights (TVL-11) ----
// The Tool Owner ("Manage pages and menu groups", as for the pages of the page builder) and the list's co-owners edit
// it; everyone else reads. Fail closed: nothing without the roles file (CON-101).
export const readOnlyListReason = 'Read only: the access roles are not loaded yet, so the master list cannot be changed.'
export function listReason(viewer: Pick<Viewer, 'email' | 'readOnly' | 'manager'>, file: Pick<ToolValidationsFile, 'owners'>) {
  if (viewer.readOnly) return readOnlyListReason
  if (viewer.manager || (viewer.email && file.owners.includes(normalEmail(viewer.email)))) return ''
  return 'Only a Tool Owner (“Manage pages and menu groups”) or a co-owner of the Tool Validations list can change it. A Tool Owner names the co-owners in Team settings.'
}
export const ownersReason = (viewer: Pick<Viewer, 'readOnly' | 'manager'>) => viewer.readOnly ? readOnlyListReason : viewer.manager ? '' : 'Only a Tool Owner (“Manage pages and menu groups”) can name the co-owners of the Tool Validations list.'

// ---- merging two saves (GIT-17) ----
// Tools by tool (name + version), sources by id; an entry both saves changed takes the later save's. The co-owners are
// merged as sets (an email either save added stays, one either removed goes); the team default as one value.
const list = (value: unknown): unknown[] => Array.isArray(value) ? value : []
const parse = (input: string | null) => { if (!input) return null; try { return record(JSON.parse(input)) } catch { return null } }
const keyedTools = (value: unknown) => Object.fromEntries(list(value).flatMap((tool) => { const raw = record(tool); return raw && typeof raw.name === 'string' ? [[toolKey(raw.name, typeof raw.version === 'string' ? raw.version : ''), raw]] : [] }))
const keyedSources = (value: unknown) => Object.fromEntries(list(value).flatMap((source) => { const raw = record(source); return raw && typeof raw.id === 'string' ? [[raw.id, raw]] : [] }))
const emails = (value: unknown) => list(value).filter((entry): entry is string => typeof entry === 'string')
export const mergeToolValidationsText: Merge = (baseText, mineText, theirsText, mineLater) => {
  const base = parse(baseText), mine = parse(mineText), theirs = parse(theirsText)
  if (!mine || !theirs || theirs.kind !== kind) return mineText
  const tools = Object.values(mergeKeyed(base ? keyedTools(base.tools) : null, keyedTools(mine.tools), keyedTools(theirs.tools), mineLater))
  const sources = Object.values(mergeKeyed(base ? keyedSources(base.sources) : null, keyedSources(mine.sources), keyedSources(theirs.sources), mineLater))
  const baseOwners = emails(base?.owners), mineOwners = emails(mine.owners), theirOwners = emails(theirs.owners)
  const owners = [...new Set([...theirOwners.filter((email) => mineOwners.includes(email) || !baseOwners.includes(email)), ...mineOwners.filter((email) => !baseOwners.includes(email))])]
  const defaultDays = merge3(base?.defaultDays, mine.defaultDays, theirs.defaultDays, mineLater) ?? mine.defaultDays
  // Written through the parser, so the merged file is as valid as the ones it came from.
  const merged = JSON.stringify({ schema: 1, kind, defaultDays, owners, sources, tools })
  try { return serializeToolValidations(parseToolValidations(merged).file) } catch { return mineText }
}
