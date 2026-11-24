import type { AzureWorkItem } from './domain'
import type { NamingPattern } from './namingPatterns.ts'
import { approverSlotReader, defaultCpReportingSettings, fieldReader, qualifyingRoles, qualifyingSlots, signatureDate, type FieldColumns } from './cpReporting.ts'
import { releaseFor } from './releasePath.ts'
import { approvalMonthOf, defaultCompletionField } from './releaseSource.ts'

// TVL-19…TVL-22: Tool Validations from two queries (streams.ts toolQueries tells the two connections apart).
// - Tools query: one row per tool (its work item) — the master list's source (TVL-04) and Completed: a tool is a
//   Completed tool validation in month M when its completion date falls in M (UTC). The completion date is a field of
//   the query chosen in Stream mapping (TVL-20), by default System.ChangedDate ("Changed Date", the last update — it
//   moves on any edit of the tool).
// - Signed documents query: one row per document, its Parent the tool's work item ID, with approver slots. A tool is a
//   Supported tool validation in month M when any document whose Parent is that tool has a qualifying Quality-role
//   signature dated in M — CP's logic (cpReporting): a role on the CP reporting allowlist (trimmed, case ignored), a
//   name and a valid date in the same slot, the month in UTC. A document whose Parent is no tool of the Tools query is
//   "Not linked to a tool": listed, never counted.
// Both data sets are read once into maps by work item ID and month (KB-27): a month is a lookup, never a scan of the
// rows; 20,000 documents are read once per fetch.

export interface ToolRow { id: number; title: string; url: string; label: string; completionDate?: string; completionMonth?: string }
export interface ToolSignature { documentId: number; documentTitle: string; url: string; toolId: number; slot: number; name: string; role: string; date: string; month: string }
export interface UnlinkedDocument { id: number; title: string; url: string; parentId?: number; months: string[] }
export interface ToolQueryOptions { completionField?: string; roles?: string[]; patterns?: NamingPattern[]; timeZone?: string }
export interface ToolQueryIndex { completionField: string; tools: Map<number, ToolRow>; completedByMonth: Map<string, ToolRow[]>; signaturesByMonth: Map<string, Map<number, ToolSignature[]>>; unlinked: UnlinkedDocument[]; unlinkedByMonth: Map<string, UnlinkedDocument[]>; documents: number; noCompletionDate: number }

const validDay = (value: unknown) => { const text = value == null ? '' : String(value).trim(); return /^\d{4}-\d{2}-\d{2}/.test(text) && Number.isFinite(Date.parse(text)) ? text : undefined }
// A tool's completion date from the chosen field: the work item's own Changed / Created / Closed Date where the field
// is one of those, else the query's column (by reference name, any letter case; or by its display name).
export function completionDateOf(item: Pick<AzureWorkItem, 'changedDate' | 'createdDate' | 'closedDate' | 'fields'>, field: string = defaultCompletionField, read?: (item: Pick<AzureWorkItem, 'fields'>, name: string) => string | undefined) {
  const ref = field.toLowerCase()
  const own = ref === 'system.changeddate' ? item.changedDate : ref === 'system.createddate' ? item.createdDate : ref === 'microsoft.vsts.common.closeddate' ? item.closedDate : undefined
  if (own) return validDay(own)
  const fields = item.fields ?? {}
  const key = field in fields ? field : Object.keys(fields).find((name) => name.toLowerCase() === ref)
  const value = key ? fields[key] : read?.(item, field)
  return validDay(value)
}
// The tool's label: its name by the Tool Validations rule (QV-34, the stream's naming patterns QV-55) with its
// version, else its Title.
export const toolLabel = (item: AzureWorkItem, patterns: NamingPattern[] = []) => { const found = releaseFor(item, 'tool', patterns); return (found ? [found.name, found.release].filter(Boolean).join(' ') : '') || item.title.replace(/\s+/g, ' ').trim() || `#${item.id}` }

export function toolQueryIndex(tools: AzureWorkItem[], toolColumns: FieldColumns, documents: AzureWorkItem[], documentColumns: FieldColumns, options: ToolQueryOptions = {}): ToolQueryIndex {
  const completionField = options.completionField || defaultCompletionField
  const readTool = fieldReader(toolColumns)
  const byId = new Map<number, ToolRow>(), completedByMonth = new Map<string, ToolRow[]>()
  let noCompletionDate = 0
  for (const item of tools) {
    if (byId.has(item.id)) continue
    const completionDate = completionDateOf(item, completionField, readTool)
    const completionMonth = completionDate ? approvalMonthOf(completionDate, options.timeZone) : undefined
    const row: ToolRow = { id: item.id, title: item.title, url: item.url, label: toolLabel(item, options.patterns), ...(completionDate ? { completionDate } : {}), ...(completionMonth ? { completionMonth } : {}) }
    byId.set(item.id, row)
    if (!completionMonth) { noCompletionDate += 1; continue }
    const list = completedByMonth.get(completionMonth) ?? []
    list.push(row); completedByMonth.set(completionMonth, list)
  }
  const field = fieldReader(documentColumns), slotsOf = approverSlotReader(documentColumns, field)
  const roles = qualifyingRoles(options.roles ?? defaultCpReportingSettings.roles)
  const signaturesByMonth = new Map<string, Map<number, ToolSignature[]>>(), unlinked: UnlinkedDocument[] = [], unlinkedByMonth = new Map<string, UnlinkedDocument[]>()
  const seen = new Set<number>()
  for (const item of documents) {
    if (seen.has(item.id)) continue
    seen.add(item.id)
    const written = item.parentId ?? Number(field(item, 'Parent'))
    const parentId = Number.isSafeInteger(written) && written > 0 ? written : undefined
    const tool = parentId != null ? byId.get(parentId) : undefined
    const qualifying = qualifyingSlots(slotsOf(item), roles).map((entry) => { const date = signatureDate(entry)!; return { entry, date, month: approvalMonthOf(date, options.timeZone) ?? date.slice(0, 7) } })
    if (!tool) {
      const months = [...new Set(qualifying.map((found) => found.month))].sort()
      const document: UnlinkedDocument = { id: item.id, title: item.title, url: item.url, ...(parentId != null ? { parentId } : {}), months }
      unlinked.push(document)
      for (const month of months) { const list = unlinkedByMonth.get(month) ?? []; list.push(document); unlinkedByMonth.set(month, list) }
      continue
    }
    for (const { entry, date, month } of qualifying) {
      let byTool = signaturesByMonth.get(month)
      if (!byTool) { byTool = new Map(); signaturesByMonth.set(month, byTool) }
      const list = byTool.get(tool.id) ?? []
      list.push({ documentId: item.id, documentTitle: item.title, url: item.url, toolId: tool.id, slot: entry.slot, name: entry.name, role: entry.role, date, month })
      byTool.set(tool.id, list)
    }
  }
  return { completionField, tools: byId, completedByMonth, signaturesByMonth, unlinked, unlinkedByMonth, documents: seen.size, noCompletionDate }
}

export interface SupportedTool { tool: ToolRow; signatures: ToolSignature[]; documents: number; date: string }
// The month's report: the tools Completed in it, the tools Supported in it (each once, with its signatures), the tools
// listed (either), the documents not linked to a tool (all, and those with a qualifying signature in the month).
export function toolMonthReport(index: ToolQueryIndex, month: string) {
  const byLabel = (a: ToolRow, b: ToolRow) => a.label.localeCompare(b.label, 'en', { sensitivity: 'base' }) || a.id - b.id
  const completed = [...(index.completedByMonth.get(month) ?? [])].sort(byLabel)
  const supported: SupportedTool[] = [...(index.signaturesByMonth.get(month) ?? new Map<number, ToolSignature[]>())].map(([id, signatures]) => ({ tool: index.tools.get(id)!, signatures: [...signatures].sort((a, b) => a.date.localeCompare(b.date) || a.documentId - b.documentId || a.slot - b.slot), documents: new Set(signatures.map((entry) => entry.documentId)).size, date: signatures.map((entry) => entry.date).sort()[0] }))
    .sort((a, b) => byLabel(a.tool, b.tool))
  const listed = new Map<number, ToolRow>()
  for (const row of completed) listed.set(row.id, row)
  for (const entry of supported) listed.set(entry.tool.id, entry.tool)
  const signedDocuments = new Set(supported.flatMap((entry) => entry.signatures.map((signature) => signature.documentId))).size
  return { month, completionField: index.completionField, completed, supported, listed: [...listed.values()].sort(byLabel), signedDocuments, unlinked: index.unlinked, unlinkedSigned: index.unlinkedByMonth.get(month) ?? [], documents: index.documents, tools: index.tools.size, noCompletionDate: index.noCompletionDate }
}
export type ToolMonthReport = ReturnType<typeof toolMonthReport>

// TVL-20: the Tools query's date columns offered as the completion date — Changed Date first (the default), then each
// column of the query whose reference name says Date or whose first value is a date, by name.
export function completionFieldOptions(columns: { ref: string; name: string }[] | undefined, items: AzureWorkItem[] = []): { ref: string; name: string }[] {
  const options = new Map<string, string>([[defaultCompletionField, 'Changed Date']])
  for (const column of columns ?? []) {
    if (options.has(column.ref)) continue
    const first = items.find((item) => item.fields?.[column.ref] != null && item.fields[column.ref] !== '')?.fields?.[column.ref]
    if (/date/i.test(column.ref) || /date/i.test(column.name) || (typeof first === 'string' && validDay(first))) options.set(column.ref, column.name || column.ref)
  }
  const [head, ...rest] = [...options]
  return [head, ...rest.sort((a, b) => a[1].localeCompare(b[1]))].map(([ref, name]) => ({ ref, name }))
}
