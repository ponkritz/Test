import type { AzureWorkItem } from './domain'
import type { NamingPattern } from './namingPatterns.ts'
import { approverSlotReader, defaultCpReportingSettings, fieldReader, qualifyingRoles, qualifyingSlots, signatureDate, type FieldColumns } from './cpReporting.ts'
import { releaseFor } from './releasePath.ts'
import { approvalMonthOf, defaultCompletionField } from './releaseSource.ts'
import { requestAzure, type AzureConfig, type AzureRequest } from './azureDevOps.ts'
import { columnName, queryLayout, type QueryColumn } from './queryView.ts'

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
export interface ToolQueryIndex { completionField: string; tools: Map<number, ToolRow>; completedByMonth: Map<string, ToolRow[]>; signaturesByMonth: Map<string, Map<number, ToolSignature[]>>; unlinked: UnlinkedDocument[]; unlinkedByMonth: Map<string, UnlinkedDocument[]>; documents: number; noCompletionDate: number; parentOf: Map<number, number | undefined> }

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
  const seen = new Set<number>(), parentOf = new Map<number, number | undefined>()
  for (const item of documents) {
    if (seen.has(item.id)) continue
    seen.add(item.id)
    const written = item.parentId ?? Number(field(item, 'Parent'))
    const parentId = Number.isSafeInteger(written) && written > 0 ? written : undefined
    parentOf.set(item.id, parentId)
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
  return { completionField, tools: byId, completedByMonth, signaturesByMonth, unlinked, unlinkedByMonth, documents: seen.size, noCompletionDate, parentOf }
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
  return { month, completionField: index.completionField, completed, supported, listed: [...listed.values()].sort(byLabel), signedDocuments, unlinked: index.unlinked, unlinkedSigned: index.unlinkedByMonth.get(month) ?? [], documents: index.documents, tools: index.tools.size, noCompletionDate: index.noCompletionDate, toolsById: index.tools, parentOf: index.parentOf }
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

// TVL-31: the Validation Documents table of the Azure tab — every document of the Signed documents query, the
// documents whose Parent is no tool of the Tools query (e.g. a retired tool) included and marked "Not in Tool List
// (Azure)". Its Tool column is the Parent's name: the tool's label from the Tools query (its name and version, as the
// Releases table names it), else the Parent's System.Title read from Azure DevOps by its ID (read only, at ↻, kept
// with the fetched documents), else "#<id>" with the reason. The names never change a count (TVL-21) and never add
// a tool to the master list.
export type ParentTitle = { title: string } | { error: string }
export type ParentTitles = Record<string, ParentTitle>
export interface DocumentTool { parentId?: number; name: string; listed: boolean; note?: string }
export const notInToolList = 'Not in Tool List (Azure)'
const cleanTitle = (value: string) => value.replace(/\s+/g, ' ').trim().slice(0, 255)
const titleOf = (entry: unknown) => { const title = entry && typeof entry === 'object' ? (entry as { title?: unknown }).title : undefined; return typeof title === 'string' && title.trim() ? cleanTitle(title) : undefined }
const errorOf = (entry: unknown) => { const error = entry && typeof entry === 'object' ? (entry as { error?: unknown }).error : undefined; return typeof error === 'string' ? error.slice(0, 300) : undefined }
export function documentToolOf(report: Pick<ToolMonthReport, 'toolsById' | 'parentOf'>, documentId: number, titles: ParentTitles | undefined = {}): DocumentTool {
  const parentId = report.parentOf.get(documentId)
  if (parentId == null) return { name: 'No Parent', listed: false, note: 'The document has no Parent: listed, never counted.' }
  return parentToolOf(report, parentId, titles)
}
export function parentToolOf(report: Pick<ToolMonthReport, 'toolsById'>, parentId: number, titles: ParentTitles | undefined = {}): DocumentTool {
  const tool = report.toolsById.get(parentId)
  if (tool) return { parentId, name: tool.label, listed: true }
  const entry = titles?.[String(parentId)], title = titleOf(entry)
  if (title) return { parentId, name: title, listed: false, note: `${notInToolList}: the Parent’s title read from Azure DevOps by its ID (e.g. a retired tool). Listed, never counted.` }
  const error = errorOf(entry)
  return { parentId, name: `#${parentId}`, listed: false, note: error ? `Name not read: ${error}` : 'Name not read yet: ↻ reads it from Azure DevOps with the two queries.' }
}
// The Parents to read by ID: those of the documents whose Parent is no tool of the Tools query, each once, in order.
export const parentIdsToRead = (report: Pick<ToolMonthReport, 'unlinked'>) => [...new Set(report.unlinked.flatMap((entry) => entry.parentId != null ? [entry.parentId] : []))].sort((a, b) => a - b)

// Reads the System.Title of work items by ID — read only, through the app's batch read (the 'items' operation:
// workitemsbatch, as every query's rows are read; on-premises servers stay read only, the PAT is the server's) — in
// batches of 200. A batch that fails is read one by one, so one deleted or hidden work item does not hide the other
// names; a rejected PAT, refused access or an unreachable server stops at once. Never throws: a name not read says why.
const stopsAll = /PAT was rejected|Access denied|could not (be )?reach|sign-in|Synthetic|CORS/i
const readableError = (failure: unknown) => { const text = failure instanceof Error ? failure.message : String(failure); return /^Not found/i.test(text) ? 'The work item was not found (deleted, or not readable with this PAT).' : text.slice(0, 300) }
export async function fetchParentTitles(config: AzureConfig, pat: string, ids: number[], transport: (request: AzureRequest) => Promise<unknown> = requestAzure): Promise<ParentTitles> {
  const wanted = [...new Set(ids.filter((id) => Number.isSafeInteger(id) && id > 0))]
  const titles: ParentTitles = {}
  if (!wanted.length) return titles
  if (!pat.trim()) { for (const id of wanted) titles[id] = { error: 'No PAT in this browser for this server.' }; return titles }
  const scoped = { ...config, team: config.team || config.project }
  const read = async (batch: number[]) => {
    const result = await transport({ ...scoped, pat: pat.trim(), operation: 'items', ids: batch }) as { value?: unknown } | null
    const found = new Map<number, string>()
    for (const item of Array.isArray(result?.value) ? result.value as unknown[] : []) {
      const entry = item as { id?: unknown; fields?: Record<string, unknown> } | null
      const title = entry?.fields?.['System.Title']
      if (entry && typeof entry.id === 'number' && typeof title === 'string' && title.trim()) found.set(entry.id, cleanTitle(title))
    }
    for (const id of batch) titles[id] = found.has(id) ? { title: found.get(id)! } : { error: 'Not returned by Azure DevOps (deleted, or not readable with this PAT).' }
  }
  const stop = (from: number, reason: string) => { for (const id of wanted.slice(from)) titles[id] = { error: reason }; return titles }
  for (let index = 0; index < wanted.length; index += 200) {
    const batch = wanted.slice(index, index + 200)
    try { await read(batch); continue } catch (failure) {
      const reason = readableError(failure)
      if (stopsAll.test(reason)) return stop(index, reason)
      if (batch.length === 1) { titles[batch[0]] = { error: reason }; continue }
    }
    for (const [at, id] of batch.entries()) {
      try { await read([id]) } catch (failure) {
        const reason = readableError(failure)
        if (stopsAll.test(reason)) return stop(index + at, reason)
        titles[id] = { error: reason }
      }
    }
  }
  return titles
}

// TVL-31: a query table's columns — every column the query selects, in its SELECT order, named as at the fetch (else
// a readable form of the reference name); a field the query does not select is left out.
export function selectColumns(wiql: string | undefined, saved?: QueryColumn[]): QueryColumn[] | undefined {
  if (!wiql?.trim()) return saved
  const names = Object.fromEntries((saved ?? []).map((column) => [column.ref, column.name]))
  return queryLayout(wiql, names).columns.map((ref) => ({ ref, name: names[ref] ?? columnName(ref) }))
}
