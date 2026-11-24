import type { ReactNode } from 'react'
import { DataTable, type DataColumn } from './DataTable'
import { QueryView } from './QueryView'
import { TablePanel } from './ui'
import { formatDate, monthName } from '../format'
import type { AzureWorkItem } from '../domain'
import type { QueryColumn, QueryOrder } from '../queryView'
import type { ToolMonthReport, ToolRow, ToolSignature, UnlinkedDocument } from '../toolQueries'

// TVL-22: the Azure tab of Tool Validations with its two queries — the month's Releases (each tool Completed or
// Supported in the month, with the evidence), then Source data of each query, then the signed documents whose Parent
// is no tool of the Tools query ("Not linked to a tool", never counted).
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

export function ToolQueriesSources({ report, tools, documents, documentsMissing }: { report: ToolMonthReport; tools: Source; documents: Source; documentsMissing: ReactNode }) {
  const unlinkedColumns: DataColumn<UnlinkedDocument>[] = [
    { id: 'id', label: 'ID', align: 'right', value: (row) => row.id, render: (row) => <a href={row.url} target="_blank" rel="noreferrer">#{row.id}</a> },
    { id: 'title', label: 'Document', value: (row) => row.title },
    { id: 'parent', label: 'Parent', align: 'right', value: (row) => row.parentId ?? '', render: (row) => row.parentId ?? 'No Parent' },
    { id: 'months', label: 'Quality signatures in', value: (row) => row.months.join(', '), render: (row) => row.months.length ? row.months.map(monthName).join(', ') : '—' },
  ]
  return <>
    {tools && <TablePanel title="Source data · Tools query" detail={tools.name} count={plural(tools.items.length, 'row')}><QueryView name={tools.name} items={tools.items} columns={tools.columns} orderBy={tools.orderBy} unresolved={tools.unresolved} summary={false} /></TablePanel>}
    {documents ? <TablePanel title="Source data · Signed documents query" detail={documents.name} count={plural(documents.items.length, 'row')}><QueryView name={documents.name} items={documents.items} columns={documents.columns} orderBy={documents.orderBy} unresolved={documents.unresolved} summary={false} /></TablePanel> : documentsMissing}
    {report.unlinked.length > 0 && <TablePanel title="Not linked to a tool" count={`${plural(report.unlinked.length, 'document')} · ${report.unlinkedSigned.length} with a Quality signature in ${monthName(report.month)} · not counted`} info={<p>Documents of the Signed documents query whose Parent is not a tool of the Tools query (or that have no Parent). They are not counted as Supported: add the tool to the Tools query, or correct the document's Parent in Azure DevOps.</p>}>
      <DataTable id="tool-queries:unlinked" rows={report.unlinked} rowKey={(row) => String(row.id)} exportName="Tool Validations documents not linked to a tool" columns={unlinkedColumns} />
    </TablePanel>}
  </>
}
