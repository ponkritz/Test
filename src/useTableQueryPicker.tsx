import { useState } from 'react'
import { newQueryRef, serverKeyOf, serverLabel } from './azureQueryRef'
import { patForServer, queryFailure, queryReadReason, readWiqlQuery, wiqlTestText } from './azureQuerySources'
import { maxWiqlText, newWiqlQuery, wiqlProblem, type WiqlQuery } from './wiqlQuery'
import { useAzureQueryPicker, type QueryPickerOptions } from './useAzureQueryPicker'
import type { TableQuery } from './pageType'
import { Notice } from './components/ui'

// PGB-23, PGB-28: the query of a Table (Query) page, in ＋ Add page, Tool Validations ＋ Add tab… and Change query… —
// Query: Saved query | Custom query (WIQL). Saved query (first, as before) is the dashboards' picker (DSH-18). Custom
// query: a connection the app knows (its server and project), the WIQL pasted from Azure DevOps (Edit query → WIQL, as a
// stream connection's query, CON-78, the same rules and messages) and a name; Test query runs it read only with the
// viewer's own PAT and shows the result in the form (a form check, not a Background job). result: the query, or why
// the main button is disabled. initial: the page's custom query (Change query…), shown for editing.
export type QueryMode = 'saved' | 'wiql'
export const queryModes: [QueryMode, string][] = [['saved', 'Saved query'], ['wiql', 'Custom query (WIQL)']]
export const noConnections = 'The app has no Azure DevOps connection yet: a custom query runs on the server and project of a connection (Admin → Streams, or My settings → My views).'
const chooseConnection = 'Choose the connection the query runs on.'
const wiqlExample = "SELECT [System.Id], [System.Title], [System.State], [System.AssignedTo]\nFROM WorkItems\nWHERE [System.TeamProject] = @project AND [System.WorkItemType] = 'Bug'\nORDER BY [System.Id] DESC"
type TestState = { key: string; running?: true; ok?: string; error?: string }

export function useTableQueryPicker(azure: QueryPickerOptions, { onEdit, initial = null, radioName }: { onEdit: () => void; initial?: WiqlQuery | null; radioName: string }) {
  const [mode, setMode] = useState<QueryMode>(initial ? 'wiql' : 'saved')
  const saved = useAzureQueryPicker(azure, { nameLabel: 'Query name', nameHelp: 'How the query is named on the page (at most 80 characters).', radioName, onEdit })
  // The connections the app knows; the page's own server and project first when it is not one of them (Change query…).
  const same = (entry: { server: string; project: string }) => Boolean(initial) && serverKeyOf(entry.server) === serverKeyOf(initial!.server) && entry.project.toLowerCase() === initial!.project.toLowerCase()
  const options = initial && !azure.connections.some(same) ? [{ server: initial.server, project: initial.project }, ...azure.connections] : azure.connections
  // UI-STANDARDS §12: pre-selected only when there is one sensible value — the page's own (Change query…) or the only
  // connection; with several, nothing is chosen and the owner picks.
  const [connection, setConnection] = useState(() => initial ? Math.max(0, options.findIndex(same)) : options.length === 1 ? 0 : -1)
  const [text, setText] = useState(initial?.text ?? '')
  const [name, setName] = useState(initial?.name ?? '')
  const [test, setTest] = useState<TestState | null>(null)
  const chosen = connection >= 0 ? options[connection] : undefined
  const custom = chosen ? newWiqlQuery({ name, server: chosen.server, project: chosen.project, text }) : options.length ? chooseConnection : noConnections
  // Test query: only for a WIQL the app runs, with the viewer's own PAT for the chosen server; a result for another
  // text or connection is not shown.
  const key = chosen ? `${serverKeyOf(chosen.server)}|${chosen.project}|${text.trim()}` : ''
  const pat = chosen ? patForServer(chosen.server, azure.profiles) : ''
  const testBlocked = !chosen ? (options.length ? chooseConnection : noConnections) : wiqlProblem(text) || queryReadReason(chosen, pat, azure.viewingAs)
  const shown = test?.key === key ? test : null
  const runTest = async () => {
    if (!chosen || testBlocked) return
    setTest({ key, running: true })
    try { setTest({ key, ok: wiqlTestText(await readWiqlQuery({ name: name.trim() || 'Test', server: chosen.server, project: chosen.project, text }, pat)) }) }
    catch (failure) { setTest({ key, error: queryFailure(failure, pat) }) }
  }
  const savedRef = saved.target && !saved.missing ? newQueryRef({ name: saved.name, ...saved.target }, [], 'q1') : null
  const result: TableQuery | string = mode === 'wiql' ? custom : saved.missing || savedRef || 'Choose a saved query.'
  const edited = () => { onEdit() }
  const fields = <>
    <fieldset className="od-filters"><legend>Query</legend>
      <div className="segmented" role="radiogroup" aria-label="Query">
        {queryModes.map(([value, label]) => <button key={value} type="button" role="radio" aria-checked={mode === value} className={mode === value ? 'active' : ''} onClick={() => { setMode(value); edited() }}>{label}</button>)}
      </div>
      <small>{mode === 'saved' ? 'A query saved in Azure DevOps, read by its id.' : 'Any work-item query, pasted as WIQL — as a stream connection’s query.'}</small>
    </fieldset>
    {mode === 'saved' ? saved.fields : <>
      <label>Connection
        <select required value={chosen ? connection : ''} disabled={!options.length} onChange={(event) => { setConnection(event.target.value === '' ? -1 : Number(event.target.value)); edited() }}>
          {!chosen && <option value="" disabled>Choose…</option>}
          {options.map((entry, at) => <option key={`${entry.server}|${entry.project}`} value={at}>{serverLabel(entry.server)} · {entry.project}</option>)}
        </select>
        <small>{options.length ? 'The servers and projects of the app’s connections. The query runs there with each viewer’s own PAT.' : noConnections}</small>
      </label>
      <label className="query-field">WIQL
        <textarea rows={6} spellCheck={false} maxLength={maxWiqlText} value={text} placeholder={wiqlExample} onChange={(event) => { setText(event.target.value); edited() }} />
        <small>Paste the query from Azure DevOps: open the query → Edit query → WIQL, and copy all of it. A flat list (SELECT … FROM WorkItems WHERE …) or a tree or direct-links query (SELECT … FROM WorkItemLinks WHERE … MODE (…)); the table’s columns and their order come from its SELECT and ORDER BY. Read only: nothing is written to Azure DevOps.</small>
      </label>
      <div className="button-row">
        <button type="button" className="ghost" disabled={Boolean(testBlocked) || Boolean(shown?.running)} onClick={() => void runTest()}>{shown?.running ? 'Testing the query…' : 'Test query'}</button>
        {testBlocked ? <span className="muted">{testBlocked}</span> : shown?.ok ? <span className="muted" role="status">{shown.ok}</span> : null}
      </div>
      {shown?.error && <Notice tone="error">{shown.error} Check the WIQL and the connection, then test again.</Notice>}
      <label>Query name
        <input value={name} maxLength={80} onChange={(event) => { setName(event.target.value); edited() }} />
        <small>How the query is named on the page (at most 80 characters).</small>
      </label>
    </>}
  </>
  return { fields, result, mode }
}
