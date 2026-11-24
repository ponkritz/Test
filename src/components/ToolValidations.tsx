import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { utcToday } from '../businessTime'
import { formatDate, formatDateTime } from '../format'
import { windchillCell } from '../windchillViews'
import { addSource, azureFieldOptions, azureValue, cleanDays, daysLeftText, dueFromLabel, dueOf, editOf, editProblem, entryState, entryStateLabel, expiryRows, guessMapping, inputsFromRows, kindLabel, mappingFields, mappingFor, markMerged, maxExpiryDays, mergeSource, mergeSummary, nameLocked, removeSource, removeTool, saveTool, setMapping, setTeam, sourceKinds, sourceProblem, statusLabel, openToolTab, toolKey, toolTabAzure, toolTabMaster, toolTabSetup, toolTabs, toolValidationsFile, type EntryState, type ExpiryRow, type ExpiryStatus, type ToolEdit, type ToolEntry, type ToolInput, type ToolMapping, type ToolSource, type ToolSourceKind, type ToolValidationsFile } from '../toolValidations'
import { useToolValidationsEnv, type SourceData, type ToolValidationsEnv } from '../useToolValidations'
import { DataTable, type DataColumn } from './DataTable'
import { OwnersField } from './PageDialogs'
import { ResultTabs } from './ResultTabs'
import { EmptyState, Metric, Metrics, Modal, Notice, Panel, Pill, SaveQueueStatus, SettingsSummary, TablePanel, WriteBlocked } from './ui'

// TVL-08…TVL-12, TVL-14: the Tool Validations Release page's tabs — Master list (on top the Validation expiry: what is
// overdue or due soon in the viewer's own window of N days; then every tool kept in Git), Azure (the Tool Validations
// query: the month's releases and its rows), one tab per other source (its rows as mapped, Edit mapping…, Merge into
// master list…) and Setup last (the sources and the team settings). Everyone reads them; the Tool Owner and the list's
// co-owners change them (TVL-11), each change saved to Git (GIT-17) with its result under Background jobs (UI-STANDARDS §8).


const pillTone: Record<ExpiryStatus, 'danger' | 'warning' | 'neutral' | 'info'> = { overdue: 'danger', due: 'warning', none: 'neutral', later: 'info' }
const stateTone: Record<EntryState, 'open' | 'warning' | 'neutral'> = { 'in-source': 'open', gone: 'warning', manual: 'neutral' }
const sourceNames = (file: ToolValidationsFile, entry: ToolEntry) => Object.entries(entry.sources).map(([id, link]) => `${file.sources.find((source) => source.id === id)?.name ?? id}${link.inSource ? '' : ' (not in it now)'}`).join(', ')
const periodText = (months?: number) => months ? `${months}` : ''

// Without the app's provider (never in the app itself) the tabs say so instead of failing.
function Missing() { return <Panel><EmptyState title="The Tool Validations master list is not available here." /></Panel> }

// ---- TVL-14: the tabs — Master list first, Azure (this query), one per other source in the order added, Setup last ----
export function ToolValidationsTabs({ id, azure }: { id: string; azure: ReactNode }) {
  const env = useToolValidationsEnv()
  const extra = toolTabs(env?.store.shown ?? { sources: [] }).filter((tab) => tab.key !== toolTabMaster)
    .map((tab) => ({ key: tab.key, label: tab.label, node: tab.key === toolTabAzure ? azure : tab.key === toolTabSetup ? <ToolSetup /> : env && tab.source ? <SourceTab env={env} source={tab.source} /> : <Missing /> }))
  return <ResultTabs id={id} mainKey={toolTabMaster} mainLabel="Master list" main={<ToolMasterList />} extra={extra} open={openToolTab} />
}

// ---- TVL-08, TVL-09: Validation expiry ----
type StatusFilter = 'all' | 'overdue' | 'due' | 'none'
function ToolExpiry({ env }: { env: ToolValidationsEnv }) {
  const [status, setStatus] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState<string | null>(null)
  const file = env.store.shown
  const teamDays = file.defaultDays, days = env.personalDays ?? teamDays
  const today = utcToday()
  const all = expiryRows(file.tools, today, days)
  const count = (key: ExpiryStatus) => all.filter((row) => row.status === key).length
  const needle = search.trim().toLowerCase()
  const rows = all.filter((row) => (status === 'all' || row.status === status) && (!needle || `${row.entry.name} ${row.entry.version} ${row.entry.notes ?? ''}`.toLowerCase().includes(needle)))
  const typed = draft ?? String(days)
  const typedDays = cleanDays(typed)
  const columns: DataColumn<ExpiryRow>[] = [
    { id: 'status', label: 'Status', value: (row) => statusLabel[row.status], render: (row) => <Pill tone={pillTone[row.status]}>{statusLabel[row.status]}</Pill> },
    { id: 'name', label: 'Tool', value: (row) => row.entry.name },
    { id: 'version', label: 'Version', value: (row) => row.entry.version },
    { id: 'due', label: 'Due date', value: (row) => row.due ?? '', render: (row) => row.due ? formatDate(row.due) : 'No due date', title: (row) => `Due date: ${dueFromLabel[row.from]}`, firstSortDesc: false },
    { id: 'days', label: 'Days left', align: 'right', value: (row) => row.days ?? '', render: (row) => daysLeftText(row) || '—', exportValue: (row) => row.days ?? '' },
    { id: 'from', label: 'Due date from', value: (row) => row.from === 'none' ? '' : dueFromLabel[row.from] },
    { id: 'validated', label: 'Validation date', value: (row) => row.entry.validationDate ?? '', render: (row) => formatDate(row.entry.validationDate, '—') },
    { id: 'period', label: 'Validity (months)', align: 'right', value: (row) => row.entry.validityMonths ?? '' },
    { id: 'sources', label: 'Sources', value: (row) => sourceNames(file, row.entry) || 'Added by hand', defaultHidden: true },
    { id: 'notes', label: 'Notes', value: (row) => row.entry.notes ?? '', defaultHidden: true },
  ]
  const reset = () => { setStatus('all'); setSearch('') }
  const windowField = <div className="tool-expiry-window">
    <label className="inline-field">Expiring in the next<input type="number" aria-label="Days ahead" min={1} max={maxExpiryDays} step={1} value={typed} onChange={(event) => { setDraft(event.target.value); const next = cleanDays(event.target.value); if (next !== undefined) env.setPersonalDays(next === teamDays ? undefined : next) }} onBlur={() => setDraft(null)} />days</label>
    <button type="button" className="ghost" disabled={env.personalDays === undefined} title={env.personalDays === undefined ? `You use the team default (${teamDays} days)` : `Back to the team default (${teamDays} days)`} onClick={() => { setDraft(null); env.setPersonalDays(undefined) }}>Use the team default ({teamDays})</button>
    <small className="muted" role="status">{typedDays === undefined ? `Enter a whole number of days from 1 to ${maxExpiryDays}.` : env.personalDays !== undefined ? `Your own window (${env.personalDays} days), kept for you; the team default is ${teamDays} days.` : `The team default: ${teamDays} days.`}</small>
  </div>
  return <>
    <div className="tool-expiry-counts"><Metrics>
      <Metric label="Overdue" value={count('overdue')} hint="Due date passed" tone={count('overdue') ? 'negative' : undefined} />
      <Metric label={`Due in the next ${days} days`} value={count('due')} hint={`Due by ${formatDate(new Date(Date.parse(`${today}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10))}`} />
      <Metric label="No due date" value={count('none')} hint="No due date and no validation date + validity period" />
    </Metrics></div>
    <TablePanel title="Validation expiry" count={`${rows.length} of ${all.length} tools`}
      info={<ul><li>Every tool of the master list that is <strong>overdue</strong> (its due date has passed), <strong>due</strong> within the next {days} days, or has <strong>no due date</strong> — never hidden. Tools due later are in the master list below.</li><li>The due date is the source's own due date (or one entered by hand) when there is one; else the validation date plus the validity period (months). Days are counted in UTC.</li><li>The window is yours: change it here and it is kept for you on every computer (your views); <strong>Use the team default</strong> goes back to the {teamDays} days the list's owners set.</li><li>Export writes the rows shown (Excel or CSV; a value that could be read as a formula is written as text).</li></ul>}>
      <DataTable id="tool-validations:expiry" rows={rows} rowKey={(row) => row.entry.key} columns={columns} exportName="Tool validation expiry" defaultSort={{ id: 'days' }}
        toolbar={<div className="tool-filter-bar">{windowField}
          <div className="segmented" role="group" aria-label="Status">{([['all', 'All'], ['overdue', `Overdue (${count('overdue')})`], ['due', `Due soon (${count('due')})`], ['none', `No due date (${count('none')})`]] as [StatusFilter, string][]).map(([key, label]) => <button key={key} type="button" aria-pressed={status === key} onClick={() => setStatus(key)}>{label}</button>)}</div>
          <input className="search" type="search" aria-label="Search tools" placeholder="Search tool, version or notes" value={search} onChange={(event) => setSearch(event.target.value)} />
          <button type="button" className="ghost" disabled={status === 'all' && !search} onClick={reset}>Reset filters</button>
        </div>}
        empty={<EmptyState title={all.length ? 'No tools match the filters.' : file.tools.length ? `No tool is overdue, due within ${days} days or without a due date.` : 'The master list has no tools yet.'} detail={all.length ? 'Reset filters to see every tool listed here.' : file.tools.length ? 'Widen the window, or see every tool in the master list below.' : 'Fetch the Tool Validations query (↻), or add a tool to the master list below.'} />} />
    </TablePanel>
  </>
}

// ---- reading a source (TVL-07) ----
interface SourceRead { options: [string, string][]; rows: number; read: (mapping: ToolMapping) => ToolInput[]; missing: string; target: string }
function readSource(source: Pick<ToolSource, 'kind' | 'ref'>, data: SourceData): SourceRead {
  const none = (missing: string, target: string): SourceRead => ({ options: [], rows: 0, read: () => [], missing, target })
  if (source.kind === 'stream' || source.kind === 'azure') {
    const found = source.kind === 'stream' ? { name: 'Tool Validations', items: data.streamItems } : data.azure.find((entry) => entry.id === source.ref)
    if (!found) return none('That connection is not set up in this browser.', source.ref ?? '')
    const items = found.items ?? []
    if (!items.length) return none(`“${found.name}” has not been fetched in this browser yet (or has no items): fetch it first.`, found.name)
    return { options: azureFieldOptions(items), rows: items.length, read: (mapping) => inputsFromRows(items, mapping, (item, field) => azureValue(item, field, data.patterns)), missing: '', target: found.name }
  }
  if (source.kind === 'windchill') {
    const found = data.windchill.find((entry) => entry.id === source.ref)
    if (!found) return none('That Windchill export is not in this browser.', source.ref ?? '')
    if (!found.rows?.length) return none(`“${found.name}” has no rows here yet: import it (or load it from Git) first.`, found.name)
    const rows = found.rows
    return { options: found.columns.map((column): [string, string] => [column, column]), rows: rows.length, read: (mapping) => inputsFromRows(rows, mapping, (row, field) => field ? windchillCell(row, field) || undefined : undefined), missing: '', target: found.name }
  }
  const page = data.pages.find((entry) => entry.id === source.ref)
  if (!page) return none('That table page is not in the menu (removed, or not read from Git yet).', source.ref ?? '')
  const rows = page.rows.filter((row) => !row.hidden)
  return { options: page.columns.map((column): [string, string] => [column.id, column.name]), rows: rows.length, read: (mapping) => inputsFromRows(rows, mapping, (row, field) => { const value = field ? row.cells[field] : undefined; return Array.isArray(value) ? value.join(', ') || undefined : value || undefined }), missing: rows.length ? '' : `“${page.name}” has no rows yet.`, target: page.name }
}
const choicesFor = (kind: Exclude<ToolSourceKind, 'stream'>, data: SourceData): [string, string][] => kind === 'azure' ? data.azure.map((entry) => [entry.id, entry.name]) : kind === 'windchill' ? data.windchill.map((entry) => [entry.id, entry.name]) : data.pages.map((entry) => [entry.id, entry.name])

// ---- TVL-10, TVL-12: the Master list ----
type StateFilter = 'all' | EntryState
type ToolDialogState = { kind: 'tool'; editing?: ToolEntry } | { kind: 'remove'; entry: ToolEntry }
// The notices about the list's file in Git, on the Master list and on Setup: not connected, not readable, its save queue.
function StoreNotices({ env }: { env: ToolValidationsEnv }) {
  const { store } = env
  return <>
    {!store.connected && <Notice tone="info">Connect Git storage (Admin → Data & sharing) to keep the master list for the team. Until then the tools of the Tool Validations query fetched here are shown, not kept.</Notice>}
    {store.error && <Notice tone="warning">{toolValidationsFile} could not be read from Git: {store.error} The master list last read here is shown and cannot be changed.</Notice>}
    {store.refused.length > 0 && <Notice tone="warning">Not used — {toolValidationsFile} in Git: {store.refused.map((entry) => `${entry.name}: ${entry.reason}`).join(' · ')}</Notice>}
    <SaveQueueStatus state={store.queue} onRetry={() => void store.retry()} />
  </>
}
export function ToolMasterList() {
  const env = useToolValidationsEnv()
  const [dialog, setDialog] = useState<ToolDialogState | null>(null)
  const [filter, setFilter] = useState<StateFilter>('all')
  const [search, setSearch] = useState('')
  if (!env) return <Missing />
  const { store } = env, file = store.shown, why = store.reason
  const needle = search.trim().toLowerCase()
  const rows = file.tools.filter((entry) => (filter === 'all' || entryState(entry) === filter) && (!needle || `${entry.name} ${entry.version} ${entry.notes ?? ''}`.toLowerCase().includes(needle)))
  const countOf = (key: EntryState) => file.tools.filter((entry) => entryState(entry) === key).length
  const columns: DataColumn<ToolEntry>[] = [
    { id: 'name', label: 'Tool', value: (entry) => entry.name },
    { id: 'version', label: 'Version', value: (entry) => entry.version },
    { id: 'validated', label: 'Validation date', value: (entry) => entry.validationDate ?? '', render: (entry) => <>{formatDate(entry.validationDate, '—')}{entry.manual.includes('validationDate') && <small> (entered)</small>}</> },
    { id: 'period', label: 'Validity (months)', align: 'right', value: (entry) => entry.validityMonths ?? '', render: (entry) => <>{periodText(entry.validityMonths) || '—'}{entry.manual.includes('validityMonths') && <small> (entered)</small>}</> },
    { id: 'due', label: 'Due date', value: (entry) => dueOf(entry).due ?? '', render: (entry) => { const due = dueOf(entry); return due.due ? <>{formatDate(due.due)} <small>({dueFromLabel[due.from]})</small></> : 'No due date' } },
    { id: 'state', label: 'Status', value: (entry) => entryStateLabel[entryState(entry)], render: (entry) => <Pill tone={stateTone[entryState(entry)]}>{entryStateLabel[entryState(entry)]}</Pill> },
    { id: 'sources', label: 'Sources', value: (entry) => sourceNames(file, entry) || '—' },
    { id: 'notes', label: 'Notes', value: (entry) => entry.notes ?? '' },
    { id: 'added', label: 'Added', value: (entry) => entry.addedAt, render: (entry) => <>{formatDateTime(entry.addedAt)}{entry.addedBy && <small> · {entry.addedBy}</small>}</>, defaultHidden: true },
    { id: 'actions', label: 'Actions', sortable: false, export: false, render: (entry) => <div className="button-row nowrap"><button type="button" className="ghost" disabled={Boolean(why)} title={why || `Edit ${entry.name}`} onClick={() => setDialog({ kind: 'tool', editing: entry })}>Edit</button><button type="button" className="text-button danger-text" disabled={Boolean(why)} title={why || `Remove ${entry.name}`} onClick={() => setDialog({ kind: 'remove', entry })}>Remove</button></div> },
  ]
  const close = () => setDialog(null)
  return <>
    <StoreNotices env={env} />
    {store.pending && why && <Notice tone="info">{mergeSummary(store.pending)} in the latest fetch of the Tool Validations query — shown here, saved to Git by the next Tool Owner or co-owner who opens the app.</Notice>}
    <ToolExpiry env={env} />
    <TablePanel title="Master list" count={`${rows.length} of ${file.tools.length} tools`}
      info={<ul><li>Every tool the team has validated, kept in Git ({toolValidationsFile}). A tool <strong>stays</strong> once it is listed: when it leaves its source it is marked <strong>Not in source now</strong> until someone removes it.</li><li>The tools of the <strong>Tool Validations</strong> query are added whenever its data is fetched; the other sources are merged with <strong>Merge into master list</strong> (on the source's own tab, or Setup → Sources).</li><li>The same tool from two sources is one entry: the same name (letter case, spaces and punctuation ignored) and version. A date or period changed by hand is kept when the sources are read again.</li><li>The Tool Owner and the list's co-owners change it; everyone else reads it.</li></ul>}
      action={<button type="button" className="primary" disabled={Boolean(why)} title={why || 'Add a tool by hand'} onClick={() => setDialog({ kind: 'tool' })}>＋ Add tool…</button>}>
      <WriteBlocked reason={why} />
      <DataTable id="tool-validations:master" rows={rows} rowKey={(entry) => entry.key} columns={columns} exportName="Tool validations master list" defaultSort={{ id: 'name' }}
        toolbar={<div className="tool-filter-bar">
          <div className="segmented" role="group" aria-label="Status">{([['all', 'All'], ['in-source', `In source (${countOf('in-source')})`], ['gone', `Not in source now (${countOf('gone')})`], ['manual', `Added by hand (${countOf('manual')})`]] as [StateFilter, string][]).map(([key, label]) => <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>)}</div>
          <input className="search" type="search" aria-label="Search the master list" placeholder="Search tool, version or notes" value={search} onChange={(event) => setSearch(event.target.value)} />
          <button type="button" className="ghost" disabled={filter === 'all' && !search} onClick={() => { setFilter('all'); setSearch('') }}>Reset filters</button>
        </div>}
        empty={<EmptyState title={file.tools.length ? 'No tools match the filters.' : 'The master list has no tools yet.'} detail={file.tools.length ? 'Reset filters to see every tool.' : 'Fetch the Tool Validations query (↻), merge a source (its tab, or Setup → Sources), or add a tool by hand.'} />} />
    </TablePanel>
    {dialog?.kind === 'tool' && <ToolDialog env={env} editing={dialog.editing} onClose={close} />}
    {dialog?.kind === 'remove' && <RemoveDialog env={env} entry={dialog.entry} onClose={close} />}
  </>
}

// ---- TVL-01, TVL-07, TVL-09, TVL-11, TVL-14: the Setup tab — the sources and the team settings ----
type Dialog = { kind: 'team' } | { kind: 'add-source' } | { kind: 'mapping'; source: ToolSource } | { kind: 'merge'; source: ToolSource } | { kind: 'remove-source'; source: ToolSource }
export function ToolSetup() {
  const env = useToolValidationsEnv()
  const [dialog, setDialog] = useState<Dialog | null>(null)
  if (!env) return <Missing />
  const file = env.store.shown, why = env.store.reason
  const close = () => setDialog(null)
  return <>
    <StoreNotices env={env} />
    <SourcesPanel env={env} why={why} open={setDialog} />
    <Panel title="Team settings" info="The team default of the expiry window and the co-owners of the list, kept in the master list's file in Git. Each person may look at their own window in Validation expiry on the Master list tab."
      action={<button type="button" className="ghost" disabled={Boolean(why)} title={why || 'Change the team default and the co-owners'} onClick={() => setDialog({ kind: 'team' })}>Edit…</button>}>
      <SettingsSummary rows={[['Expiry window (team default)', `${file.defaultDays} days`], ['Co-owners', file.owners.length ? file.owners.join(', ') : 'Nobody yet — only Tool Owners change the list']]} />
      <WriteBlocked reason={why} />
    </Panel>
    {dialog?.kind === 'team' && <TeamDialog env={env} onClose={close} />}
    {dialog?.kind === 'add-source' && <AddSourceDialog env={env} onClose={close} />}
    {dialog?.kind === 'mapping' && <MappingDialog env={env} source={dialog.source} onClose={close} />}
    {dialog?.kind === 'merge' && <MergeDialog env={env} source={dialog.source} onClose={close} />}
    {dialog?.kind === 'remove-source' && <RemoveSourceDialog env={env} source={dialog.source} onClose={close} />}
  </>
}

function SourcesPanel({ env, why, open }: { env: ToolValidationsEnv; why: string; open: (dialog: Dialog) => void }) {
  const file = env.store.shown
  return <Panel title="Sources" info={<ul><li><strong>Tool Validations query</strong>: the connection named “Tool Validations”; its tools are added to the master list whenever its data is fetched.</li><li><strong>Another Azure DevOps query</strong>, a <strong>Windchill export</strong> or a <strong>manual list</strong> (a Table page of the app, e.g. one added under On-Demand): read on its own page, shown on a tab of its own here (its rows as mapped) and merged with <strong>Merge into master list</strong>, which shows what changes before it saves.</li><li>Each source is read with its <strong>field mapping</strong> — which field or column gives the tool name, version, validation date, validity period and due date. Until the mapping is saved, the app's guesses are used (marked “Guessed”).</li></ul>}
    action={<button type="button" className="ghost" disabled={Boolean(why)} title={why || 'Add another source'} onClick={() => open({ kind: 'add-source' })}>＋ Add source…</button>}>
    <WriteBlocked reason={why} />
    <div className="azure-table tool-sources"><table><thead><tr><th>Source</th><th>Reads</th><th>Field mapping</th><th className="num">Tools</th><th>Last merged</th><th>Actions</th></tr></thead><tbody>
      {file.sources.map((source) => {
        const read = readSource(source, env.sources)
        const mapping = mappingFor(source, read.options)
        const tools = file.tools.filter((entry) => entry.sources[source.id]?.inSource).length
        return <tr key={source.id}>
          <td><strong>{source.name}</strong><small>{kindLabel(source.kind)}</small></td>
          <td><small className="plain">{read.target || '—'}{read.missing ? ` — ${read.missing}` : ` · ${read.rows} row${read.rows === 1 ? '' : 's'}`}</small></td>
          <td><small className="plain">{source.mapping.confirmed ? 'Saved' : <Pill tone="warning">Guessed</Pill>} {mappingFields.filter((field) => mapping[field.key]).map((field) => `${field.label.replace(' (optional)', '')}: ${optionLabel(read.options, mapping[field.key]!)}`).join(' · ') || 'Nothing mapped'}</small></td>
          <td className="num">{tools}</td>
          <td><small className="plain">{source.mergedAt ? `${formatDateTime(source.mergedAt)}${source.mergedBy ? ` · ${source.mergedBy}` : ''}` : source.kind === 'stream' ? 'At each fetch' : 'Not yet'}</small></td>
          <td><div className="button-row nowrap">
            <button type="button" className="ghost" disabled={Boolean(why)} title={why || `Set which fields of ${source.name} are read`} onClick={() => open({ kind: 'mapping', source })}>Edit mapping…</button>
            {source.kind !== 'stream' && <button type="button" className="ghost" disabled={Boolean(why || read.missing)} title={why || read.missing || `Merge the tools of ${source.name} into the master list`} onClick={() => open({ kind: 'merge', source })}>Merge into master list…</button>}
            {source.kind !== 'stream' && <button type="button" className="text-button danger-text" disabled={Boolean(why)} title={why || `Remove the source ${source.name}`} onClick={() => open({ kind: 'remove-source', source })}>Remove</button>}
          </div></td>
        </tr>
      })}
    </tbody></table></div>
  </Panel>
}
const optionLabel = (options: [string, string][], key: string) => options.find(([value]) => value === key)?.[1].replace(/ \(.*\)$/, '') ?? key

// ---- TVL-14: the tab of one other source — its rows as read with its field mapping, Edit mapping… and Merge ----
interface SourceRow { index: number; input: ToolInput; listed: boolean }
const howToLoad = (source: ToolSource) => source.kind === 'azure' ? 'Open its page (Release Details or the menu group it is in) and fetch it there with ↻ — read only, nothing is written to Azure DevOps — then come back to this tab.'
  : source.kind === 'windchill' ? 'Import the Windchill export (Import Windchill export), or load it from Git on its page, then come back to this tab.'
  : 'Open the table page in the menu and add its rows (or wait until it is read from Git), then come back to this tab.'
function SourceTab({ env, source }: { env: ToolValidationsEnv; source: ToolSource }) {
  const [dialog, setDialog] = useState<'mapping' | 'merge' | null>(null)
  const why = env.store.reason, file = env.store.shown
  const read = useMemo(() => readSource(source, env.sources), [source, env.sources])
  const mapping = mappingFor(source, read.options)
  const listed = new Set(file.tools.filter((entry) => entry.sources[source.id]?.inSource).map((entry) => entry.key))
  const rows: SourceRow[] = read.missing ? [] : read.read(mapping).map((input, index) => ({ index, input, listed: listed.has(toolKey(input.name, input.version)) }))
  const tools = new Set(rows.map((row) => toolKey(row.input.name, row.input.version))).size
  const columns: DataColumn<SourceRow>[] = [
    { id: 'name', label: 'Tool', value: (row) => row.input.name },
    { id: 'version', label: 'Version', value: (row) => row.input.version },
    { id: 'validated', label: 'Validation date', value: (row) => row.input.validationDate ?? '', render: (row) => formatDate(row.input.validationDate, '—') },
    { id: 'period', label: 'Validity (months)', align: 'right', value: (row) => row.input.validityMonths ?? '', render: (row) => row.input.validityMonths ?? '—' },
    { id: 'due', label: 'Due date', value: (row) => row.input.dueDate ?? '', render: (row) => formatDate(row.input.dueDate, '—') },
    { id: 'listed', label: 'Master list', value: (row) => row.listed ? 'Merged' : 'Not merged yet', render: (row) => <Pill tone={row.listed ? 'open' : 'neutral'}>{row.listed ? 'Merged' : 'Not merged yet'}</Pill> },
  ]
  const close = () => setDialog(null)
  return <>
    {!source.mapping.confirmed && <Notice tone="warning">The field mapping of {source.name} is still the app's guess: check it with Edit mapping… before merging.</Notice>}
    <TablePanel title={source.name} detail={`${kindLabel(source.kind)} · reads ${read.target || '—'}`} count={read.missing ? undefined : `${rows.length} row${rows.length === 1 ? '' : 's'} · ${tools} tool${tools === 1 ? '' : 's'}`}
      info={<ul><li>The rows of this source as they are read in this browser with its <strong>field mapping</strong> (tool, version, validation date, validity period, due date) — the same rows <strong>Merge into master list…</strong> brings in.</li><li><strong>Master list</strong> says whether the tool is in the master list from this source (merged before). A row without a tool name is not read.</li><li>The source is set up under Setup → Sources; removing it there removes this tab, its tools stay in the list.</li></ul>}
      action={<>
        <button type="button" className="ghost" disabled={Boolean(why)} title={why || `Set which fields of ${source.name} are read`} onClick={() => setDialog('mapping')}>Edit mapping…</button>
        <button type="button" className="primary" disabled={Boolean(why || read.missing)} title={why || read.missing || `Merge the tools of ${source.name} into the master list`} onClick={() => setDialog('merge')}>Merge into master list…</button>
      </>}>
      <WriteBlocked reason={why} />
      {read.missing ? <EmptyState title={read.missing} detail={howToLoad(source)} />
        : <DataTable id="tool-validations:source" rows={rows} rowKey={(row) => String(row.index)} columns={columns} exportName={`${source.name} (tool validations source)`} defaultSort={{ id: 'name' }}
          empty={<EmptyState title={`No row of ${read.target} gives a tool name with this mapping.`} detail="Check the field mapping (Edit mapping…)." />} />}
    </TablePanel>
    {dialog === 'mapping' && <MappingDialog env={env} source={source} onClose={close} />}
    {dialog === 'merge' && <MergeDialog env={env} source={source} onClose={close} />}
  </>
}

// A save of the list from a pop-up: the error stays in the pop-up (UI-STANDARDS §3) and in Background jobs.
function useSaving(env: ToolValidationsEnv, onClose: () => void) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const run = async (next: ToolValidationsFile, message: string, label: string) => {
    setBusy(true); setError('')
    try { await env.store.save(next, message, label); onClose() } catch (failure) { setError(failure instanceof Error ? failure.message : String(failure)) } finally { setBusy(false) }
  }
  return { busy, error, setError, run }
}
const stampNow = () => new Date().toISOString().slice(0, 19) + 'Z'
const Actions = ({ busy, onCancel, label, why, danger = false }: { busy: boolean; onCancel: () => void; label: string; why?: string; danger?: boolean }) => <div className="modal-actions">{why && <WriteBlocked reason={why} />}<button type="button" className="ghost" disabled={busy} onClick={onCancel}>Cancel</button><button className={danger ? 'danger-button' : 'primary'} disabled={busy || Boolean(why)}>{busy ? 'Saving to Git…' : label}</button></div>

function ToolDialog({ env, editing, onClose }: { env: ToolValidationsEnv; editing?: ToolEntry; onClose: () => void }) {
  const [form, setForm] = useState<ToolEdit>(() => editOf(editing))
  const { busy, error, setError, run } = useSaving(env, onClose)
  const locked = nameLocked(editing)
  const set = (patch: Partial<ToolEdit>) => setForm((current) => ({ ...current, ...patch }))
  const submit = (event: FormEvent) => {
    event.preventDefault()
    const problem = editProblem(env.store.file, form, editing?.key)
    if (problem) { setError(problem); return }
    const name = form.name.trim()
    void run(saveTool(env.store.file, form, stampNow(), env.who, editing?.key), `Tool Validations: ${editing ? 'change' : 'add'} ${name}${form.version.trim() ? ` ${form.version.trim()}` : ''}`, `Tool Validations · ${editing ? 'change' : 'add'} ${name}`)
  }
  const preview = dueOf({ validationDate: form.validationDate || undefined, validityMonths: Number(form.validityMonths) || undefined, dueDate: form.dueDate || undefined, manual: form.dueDate ? ['dueDate'] : [] })
  return <Modal title={editing ? `Edit ${editing.name}` : 'Add a tool'} eyebrow="TOOL VALIDATIONS · MASTER LIST" onClose={() => { if (!busy) onClose() }}>
    <form onSubmit={submit}>
      <label>Tool name<input required maxLength={200} disabled={locked} value={form.name} onChange={(event) => set({ name: event.target.value })} /><small>{locked ? 'From its source: the name and version are how it is matched, so they are not changed here.' : 'The same tool from a source later is matched by name (letter case, spaces and punctuation ignored) and version.'}</small></label>
      <label>Version (optional)<input maxLength={60} disabled={locked} value={form.version} onChange={(event) => set({ version: event.target.value })} /><small>Different versions are separate entries.</small></label>
      <div className="form-row">
        <label>Validation date (optional)<input type="date" value={form.validationDate} onChange={(event) => set({ validationDate: event.target.value })} /><small>Changed here, it is kept when the sources are read again; emptied, the sources fill it.</small></label>
        <label>Validity period in months (optional)<input type="number" min={1} max={600} step={1} inputMode="numeric" value={form.validityMonths} onChange={(event) => set({ validityMonths: event.target.value })} /><small>E.g. 24 for two years.</small></label>
      </div>
      <label>Due date (optional)<input type="date" value={form.dueDate} onChange={(event) => set({ dueDate: event.target.value })} /><small>Leave empty to use validation date + validity period. An explicit due date wins. {preview.due ? `Due ${formatDate(preview.due)} (${dueFromLabel[preview.from === 'source' ? 'entered' : preview.from]}).` : 'No due date yet.'}</small></label>
      <label>Notes (optional)<textarea maxLength={2000} rows={3} value={form.notes} onChange={(event) => set({ notes: event.target.value })} /></label>
      {error && <Notice tone="error">{error}</Notice>}
      <Actions busy={busy} onCancel={onClose} label={editing ? 'Save to Git' : 'Add tool'} why={env.store.reason} />
    </form>
  </Modal>
}

function RemoveDialog({ env, entry, onClose }: { env: ToolValidationsEnv; entry: ToolEntry; onClose: () => void }) {
  const { busy, error, run } = useSaving(env, onClose)
  const holding = Object.entries(entry.sources).filter(([, link]) => link.inSource).map(([id]) => env.store.file.sources.find((source) => source.id === id)?.name ?? id)
  return <Modal title={`Remove ${entry.name}`} eyebrow="TOOL VALIDATIONS · MASTER LIST" onClose={() => { if (!busy) onClose() }}>
    <form onSubmit={(event) => { event.preventDefault(); void run(removeTool(env.store.file, entry.key), `Tool Validations: remove ${entry.name}${entry.version ? ` ${entry.version}` : ''}`, `Tool Validations · remove ${entry.name}`) }}>
      <p>Remove <strong>{entry.name}{entry.version ? ` ${entry.version}` : ''}</strong> from the master list for everyone, with its dates and notes? {toolValidationsFile} keeps its history in Git.</p>
      {holding.length > 0 && <Notice tone="warning">It is still in {holding.join(', ')}: it comes back the next time {holding.length === 1 ? 'that source is' : 'those sources are'} read (fetched or merged).</Notice>}
      {error && <Notice tone="error">{error}</Notice>}
      <Actions busy={busy} onCancel={onClose} label={`Remove ${entry.name}`} why={env.store.reason} danger />
    </form>
  </Modal>
}

function TeamDialog({ env, onClose }: { env: ToolValidationsEnv; onClose: () => void }) {
  const file = env.store.file
  const [days, setDays] = useState(String(file.defaultDays))
  const [owners, setOwners] = useState(file.owners)
  const { busy, error, setError, run } = useSaving(env, onClose)
  const submit = (event: FormEvent) => {
    event.preventDefault()
    const value = cleanDays(days)
    if (!value) { setError(`The team default is a whole number of days from 1 to ${maxExpiryDays}.`); return }
    void run(setTeam(file, value, env.ownersReason ? file.owners : owners), `Tool Validations: team default ${value} days, ${owners.length} co-owner${owners.length === 1 ? '' : 's'}`, 'Tool Validations · team settings')
  }
  return <Modal title="Team settings" eyebrow="TOOL VALIDATIONS · SETTINGS" onClose={() => { if (!busy) onClose() }}>
    <form onSubmit={submit}>
      <label>Expiry window, team default (days)<input type="number" required min={1} max={maxExpiryDays} step={1} value={days} onChange={(event) => setDays(event.target.value)} /><small>What everyone sees on Validation expiry until they choose their own window. 60 days unless changed.</small></label>
      <OwnersField label="Co-owners of the list (optional)" value={owners} onChange={setOwners} disabled={env.ownersReason} help="They may add, correct and remove tools, set the team default and the sources and their mapping — as the Tool Owner does." />
      {error && <Notice tone="error">{error}</Notice>}
      <Actions busy={busy} onCancel={onClose} label="Save to Git" why={env.store.reason} />
    </form>
  </Modal>
}

function AddSourceDialog({ env, onClose }: { env: ToolValidationsEnv; onClose: () => void }) {
  const [kind, setKind] = useState<Exclude<ToolSourceKind, 'stream'>>('windchill')
  const choices = choicesFor(kind, env.sources)
  const [ref, setRef] = useState('')
  const [name, setName] = useState('')
  const { busy, error, setError, run } = useSaving(env, onClose)
  const chosen = choices.find(([key]) => key === ref)
  const submit = (event: FormEvent) => {
    event.preventDefault()
    const label = name.trim() || chosen?.[1] || ''
    const problem = sourceProblem(env.store.file, kind, ref, label)
    if (problem) { setError(problem); return }
    const read = readSource({ kind, ref }, env.sources)
    void run(addSource(env.store.file, { kind, name: label, ref, mapping: guessMapping(kind, read.options) }), `Tool Validations: add source ${label} (${kindLabel(kind)})`, `Tool Validations · add source ${label}`)
  }
  return <Modal title="Add a source" eyebrow="TOOL VALIDATIONS · SOURCES" onClose={() => { if (!busy) onClose() }}>
    <form onSubmit={submit}>
      <label>Kind<select value={kind} onChange={(event) => { setKind(event.target.value as Exclude<ToolSourceKind, 'stream'>); setRef(''); setName('') }}>{sourceKinds.filter((entry) => entry.key !== 'stream').map((entry) => <option key={entry.key} value={entry.key}>{entry.label}</option>)}</select><small>{sourceKinds.find((entry) => entry.key === kind)?.detail}</small></label>
      <label>{kind === 'azure' ? 'Connection' : kind === 'windchill' ? 'Windchill export' : 'Table page'}<select required value={ref} onChange={(event) => { setRef(event.target.value); setName(choices.find(([key]) => key === event.target.value)?.[1] ?? '') }}><option value="">Choose…</option>{choices.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><small>{choices.length ? 'Its data is read in this browser when it is merged.' : kind === 'azure' ? 'No other connection is set up in this browser.' : kind === 'windchill' ? 'No Windchill export is imported in this browser.' : 'No table page yet: add one (＋ Add page…) with columns such as Tool, Version, Validation date, Validity period and Due date.'}</small></label>
      <label>Name<input required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} /><small>How the source is listed in the master list.</small></label>
      {error && <Notice tone="error">{error}</Notice>}
      <Actions busy={busy} onCancel={onClose} label="Add source" why={env.store.reason} />
    </form>
  </Modal>
}

function MappingDialog({ env, source, onClose }: { env: ToolValidationsEnv; source: ToolSource; onClose: () => void }) {
  const read = useMemo(() => readSource(source, env.sources), [source, env.sources])
  const [mapping, setMappingDraft] = useState<ToolMapping>(() => mappingFor(source, read.options))
  const { busy, error, setError, run } = useSaving(env, onClose)
  const inputs = read.missing ? [] : read.read(mapping)
  const tools = new Set(inputs.map((input) => `${input.name}@${input.version}`)).size
  const options = (current?: string): [string, string][] => current && !read.options.some(([key]) => key === current) ? [...read.options, [current, `${current} (not in the data here)`]] : read.options
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!mapping.name) { setError('Choose the field that gives the tool name.'); return }
    void run(setMapping(env.store.file, source.id, mapping), `Tool Validations: field mapping of ${source.name}`, `Tool Validations · field mapping of ${source.name}`)
  }
  return <Modal title={`Field mapping of ${source.name}`} eyebrow="TOOL VALIDATIONS · SOURCES" wide onClose={() => { if (!busy) onClose() }}>
    <form onSubmit={submit}>
      {!source.mapping.confirmed && <Notice tone="warning">These are the app's guesses — check each field against the data, then save the mapping.</Notice>}
      {read.missing && <Notice tone="info">{read.missing} The fields offered are the saved ones only.</Notice>}
      {mappingFields.map((field) => <label key={field.key}>{field.label}<select required={field.required} value={mapping[field.key] ?? ''} onChange={(event) => setMappingDraft((current) => ({ ...current, [field.key]: event.target.value || undefined }))}><option value="">{field.required ? 'Choose…' : 'None'}</option>{options(mapping[field.key]).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><small>{field.help}</small></label>)}
      <label>Validity period numbers are in<select value={mapping.periodUnit} onChange={(event) => setMappingDraft((current) => ({ ...current, periodUnit: event.target.value === 'years' ? 'years' : 'months' }))}><option value="months">Months</option><option value="years">Years</option></select><small>For a plain number; a text with its unit (“2 years”, “24 months”) is read as written.</small></label>
      <p className="muted" role="status">{read.missing ? '' : `${read.rows} row${read.rows === 1 ? '' : 's'} read here give ${tools} tool${tools === 1 ? '' : 's'} with this mapping.`}</p>
      {error && <Notice tone="error">{error}</Notice>}
      <Actions busy={busy} onCancel={onClose} label="Save to Git" why={env.store.reason} />
    </form>
  </Modal>
}

function MergeDialog({ env, source, onClose }: { env: ToolValidationsEnv; source: ToolSource; onClose: () => void }) {
  const read = useMemo(() => readSource(source, env.sources), [source, env.sources])
  const mapping = mappingFor(source, read.options)
  const { busy, error, run } = useSaving(env, onClose)
  const result = useMemo(() => mergeSource(env.store.file, source.id, read.read(mapping), stampNow(), env.who || undefined), [env.store.file, source.id, read, mapping, env.who])
  const list = (names: string[]) => names.length > 8 ? `${names.slice(0, 8).join(', ')} and ${names.length - 8} more` : names.join(', ')
  const submit = (event: FormEvent) => {
    event.preventDefault()
    const at = stampNow()
    void run(markMerged(result.file, source.id, at, env.who || undefined), `Tool Validations: merge ${source.name} — ${mergeSummary(result)}`, `Tool Validations · merge ${source.name}`)
  }
  return <Modal title={`Merge ${source.name} into the master list`} eyebrow="TOOL VALIDATIONS · SOURCES" onClose={() => { if (!busy) onClose() }}>
    <form onSubmit={submit}>
      {!source.mapping.confirmed && <Notice tone="warning">The field mapping of this source is still the app's guess. Check it (Edit mapping…) before merging.</Notice>}
      <p>{read.rows} row{read.rows === 1 ? '' : 's'} of <strong>{read.target}</strong> read with its field mapping: <strong>{mergeSummary(result)}</strong>.</p>
      <ul>
        {result.added.length > 0 && <li>New: {list(result.added)}</li>}
        {result.updated.length > 0 && <li>Linked or updated (a date changed by hand stays): {list(result.updated)}</li>}
        {result.gone.length > 0 && <li>No longer in this source — kept, marked “Not in source now”: {list(result.gone)}</li>}
      </ul>
      {error && <Notice tone="error">{error}</Notice>}
      <Actions busy={busy} onCancel={onClose} label="Merge into master list" why={env.store.reason} />
    </form>
  </Modal>
}

function RemoveSourceDialog({ env, source, onClose }: { env: ToolValidationsEnv; source: ToolSource; onClose: () => void }) {
  const { busy, error, run } = useSaving(env, onClose)
  const linked = env.store.file.tools.filter((entry) => entry.sources[source.id]).length
  return <Modal title={`Remove the source ${source.name}`} eyebrow="TOOL VALIDATIONS · SOURCES" onClose={() => { if (!busy) onClose() }}>
    <form onSubmit={(event) => { event.preventDefault(); void run(removeSource(env.store.file, source.id), `Tool Validations: remove source ${source.name}`, `Tool Validations · remove source ${source.name}`) }}>
      <p>Remove <strong>{source.name}</strong> and its field mapping from the master list's sources? Its {linked} tool{linked === 1 ? '' : 's'} <strong>stay</strong> in the list (as added by hand when no other source has them). Its own page and data are not changed.</p>
      {error && <Notice tone="error">{error}</Notice>}
      <Actions busy={busy} onCancel={onClose} label={`Remove ${source.name}`} why={env.store.reason} danger />
    </form>
  </Modal>
}
