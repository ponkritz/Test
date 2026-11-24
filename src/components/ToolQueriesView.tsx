import type { ReactNode } from 'react'
import { DataTable, type DataColumn } from './DataTable'
import { QueryView } from './QueryView'
import { Pill, TablePanel } from './ui'
import { formatDate, monthName } from '../format'
import type { AzureWorkItem } from '../domain'
import type { QueryColumn, QueryOrder } from '../queryView'
import { documentToolOf, notInToolList, parentIdsToRead, parentToolOf, type ParentTitles, type ToolMonthReport, type ToolRow, type ToolSignature } from '../toolQueries'

// TVL-22, TVL-31: the Azure tab of Tool Validations with its two queries — the month's Releases (each tool Completed
// or Supported in the month, with the evidence), then Tool List (Azure) (the Tools query) and Validation Documents
// (every document of the Signed documents query, with its tool's name; those whose Parent is no tool of the Tools
// query marked "Not in Tool List (Azure)", never counted).
interface Row { tool: ToolRow; completed: boolean; signatures: ToolSignature[]; documents: number }
type Source = { name: string; items: AzureWorkItem[]; columns?: QueryColumn[]; orderBy?: QueryOrder[]; unresolved?: string[] } | undefined
const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`

export function ToolQueriesReleases({ report, fieldName }: { report: ToolMonthReport; fieldName: string }) {
  const completed = new Set(report.completed.map((row) => row.id))
  const supported = new Map(report.supported.map((entry) => [entry.tool.id, entry]))
  const rows: Row[] = report.listed.map((tool) => ({ tool, completed: completed.has(tool.id), signatures: supported.get(tool.id)?.signatures ?? [], documents: supported.get(tool.id)?.documents ?? 0 }))
  const columns: DataColumn<Row>[] = [
    { id: 'tool', label: 'Tool', value: (row) => row.tool.label, render: (row) => <a href={row.tool.url} target="_blank" rel="noreferrer">{row.tool.label}</a> },
    { id: 'id', label: 'ID', align: 'right', value: (row) => row.tool.id },
    { id: 'completed', label: 'Completed', value: (row) => row.completed ? 'Completed' : '', render: (row) => row.completed ? 'Completed' : '—' },
    { id: 'completion', label: `Completion date (${fieldName})`, value: (row) => row.tool.completionDate ?? '', render: (row) => formatDate(row.tool.completionDate, '—') },
    { id: 'supported', label: 'Supported', value: (row) => row.signatures.length ? 'Supported' : '', render: (row) => row.signatures.length ? 'Supported' : '—' },
    { id: 'documents', label: 'Signed documents', align: 'right', value: (row) => row.documents },
    { id: 'signatures', label: 'Quality signatures', value: (row) => row.signatures.map((entry) => `${entry.name} (${entry.role}) ${entry.date.slice(0, 10)} · #${entry.documentId}`).join('; '), render: (row) => row.signatures.length ? <small className="plain">{row.signatures.map((entry) => `${entry.name} (${entry.role}) ${formatDate(entry.date)} · #${entry.documentId}`).join('; ')}</small> : '—' },
  ]
  return <TablePanel title="Releases" count={`${plural(report.completed.length, 'completed tool')} · ${plural(report.supported.length, 'supported tool')}`} empty={rows.length ? undefined : `No tool was completed or supported in ${monthName(report.month)}.`}>
    {rows.length > 0 && <DataTable id="tool-queries:releases" rows={rows} rowKey={(row) => String(row.tool.id)} exportName={`Tool Validations ${report.month}`} columns={columns} />}
  </TablePanel>
}

// TVL-31: Tool List (Azure) — the Tools query's rows — and Validation Documents — every document of the Signed
// documents query, those whose Parent is no tool of the Tools query (e.g. a retired tool) included and marked — each
// with every column its query selects, in the query's SELECT order (none hidden until someone hides one with Columns).
// Validation Documents starts with Tool (the Parent's name), Parent ID and Tool List (Azure).
export function ToolQueriesSources({ report, tools, documents, documentsMissing, parentTitles }: { report: ToolMonthReport; tools: Source; documents: Source; documentsMissing: ReactNode; parentTitles?: ParentTitles }) {
  const toolOf = (item: AzureWorkItem) => documentToolOf(report, item.id, parentTitles)
  const lead: DataColumn<AzureWorkItem>[] = [
    { id: '@tvl-tool', label: 'Tool', value: (item) => toolOf(item).name, title: (item) => toolOf(item).note, render: (item) => { const tool = toolOf(item), listed = tool.parentId != null ? report.toolsById.get(tool.parentId) : undefined; return listed ? <a href={listed.url} target="_blank" rel="noreferrer">{tool.name}</a> : tool.name } },
    { id: '@tvl-parent', label: 'Parent ID', align: 'right', value: (item) => toolOf(item).parentId ?? '', render: (item) => toolOf(item).parentId ?? '—' },
    { id: '@tvl-listed', label: 'Tool List (Azure)', value: (item) => { const tool = toolOf(item); return tool.listed ? 'Listed' : tool.parentId == null ? 'No Parent' : notInToolList }, render: (item) => { const tool = toolOf(item); return tool.listed ? 'Listed' : <Pill tone="warning">{tool.parentId == null ? 'No Parent' : notInToolList}</Pill> } },
  ]
  const outside = report.unlinked.length
  const notRead = parentIdsToRead(report).flatMap((id) => { const tool = parentToolOf(report, id, parentTitles); return tool.name === `#${id}` ? [{ id, note: tool.note ?? '' }] : [] })
  const reasons = [...new Set(notRead.map((entry) => entry.note))]
  return <>
    {tools && <TablePanel title="Tool List (Azure)" detail={tools.name} count={plural(tools.items.length, 'row')} info={<p>The Tools query's rows (one per tool) with every column the query selects, in its order; hide some with Columns. These tools are the master list's source and the only tools counted as Completed or Supported.</p>}><QueryView name={tools.name} items={tools.items} columns={tools.columns} orderBy={tools.orderBy} unresolved={tools.unresolved} summary={false} queryOnly /></TablePanel>}
    {documents ? <TablePanel title="Validation Documents" detail={documents.name} count={`${plural(documents.items.length, 'document')}${outside ? ` · ${outside} not in Tool List (Azure) · not counted` : ''}`}
      info={<>
        <p>Every document of the Signed documents query, with every column the query selects, in its order (hide some with Columns), after <strong>Tool</strong> — the name of the document's Parent —, <strong>Parent ID</strong> and <strong>Tool List (Azure)</strong>.</p>
        <p><strong>Tool</strong>: for a Parent in the Tools query, the tool's name and version as the Releases table shows it; for a Parent that is not (e.g. a retired tool), its title read from Azure DevOps by its ID when ↻ fetches the two queries — read only, with this server's PAT — and kept with the fetched documents.</p>
        <p><strong>{notInToolList}</strong>: {plural(outside, 'document')} whose Parent is no tool of the Tools query, or that have no Parent ({report.unlinkedSigned.length} with a Quality signature in {monthName(report.month)}). They are listed here, <strong>not counted</strong> as Completed or Supported, and never added to the master list.</p>
        {reasons.length > 0 && <p>{plural(notRead.length, 'Parent name')} not read — shown as #ID: {reasons.join(' ')}</p>}
      </>}>
      <QueryView name={documents.name} items={documents.items} columns={documents.columns} orderBy={documents.orderBy} unresolved={documents.unresolved} summary={false} queryOnly lead={lead} />
    </TablePanel> : documentsMissing}
  </>
}
