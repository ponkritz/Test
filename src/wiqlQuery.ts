import { normalizeBaseUrl } from './azureClient.ts'
import { maxProject, maxQueryName } from './azureQueryRef.ts'
import { checkWorkItemQuery, maxWiqlLength } from './releaseSource.ts'

// PGB-28, PGB-29 A Table (Query) page's custom query: a WIQL text pasted from Azure DevOps (the query → Edit query →
// WIQL), as for a stream connection's query (CON-78) — a flat list or a tree / direct-links query — with the server and
// project of a connection the app knows, and a name. Kept in the page's file in Git as these four keys only: never a PAT,
// never rows. The text is data written by the page's owners: it is only ever sent as the body of the read-only WIQL
// request (the runner of the stream queries, src/releaseSource.ts runWorkItemQuery) and shown as text. Kept free of React
// (tests/page-type.test.mjs).

export interface WiqlQuery { name: string; server: string; project: string; text: string }
// The cap of the WIQL text: the stream connections' own (maxWiqlLength, CON-78), one constant for both.
export const maxWiqlText = maxWiqlLength
export const wiqlKeys = ['name', 'server', 'project', 'text'] as const
const cleanText = (value: unknown, max: number) => typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, max) : ''
const serverOf = (value: unknown) => { try { return typeof value === 'string' && value.length <= 2048 ? normalizeBaseUrl(value) : '' } catch { return '' } }
const projectOk = (project: string) => Boolean(project) && !/[/\\?#]/.test(project)

// Why a pasted WIQL is not a query the app runs ('' when it is): the rules and messages of a stream connection's query
// (CON-78 — SELECT … FROM WorkItems WHERE … or SELECT … FROM WorkItemLinks WHERE … MODE (…); no ASOF, no unknown MODE).
export const pasteWiql = 'Paste the query’s WIQL (in Azure DevOps: the query → Edit query → WIQL).'
export function wiqlProblem(text: string): string {
  const query = text.trim()
  if (!query) return pasteWiql
  if (query.length > maxWiqlText) return 'The query is too long.'
  try { checkWorkItemQuery(query); return '' } catch (failure) { return failure instanceof Error ? failure.message : String(failure) }
}

// One stored custom query, or why it is not one.
export function parseWiqlQuery(raw: unknown): WiqlQuery | string {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return 'The custom query is not readable.'
  const entry = raw as Record<string, unknown>
  const name = cleanText(entry.name, maxQueryName)
  const label = name ? `The custom query “${name}”` : 'The custom query'
  if (!name) return `${label} has no name.`
  const project = cleanText(entry.project, maxProject)
  if (!projectOk(project)) return `${label} has no valid project.`
  const server = serverOf(entry.server)
  if (!server) return `${label} has no valid https server.`
  if (typeof entry.text !== 'string') return `${label} has no WIQL.`
  const problem = wiqlProblem(entry.text)
  if (problem) return `${label} cannot be run: ${problem}`
  return { name, server, project, text: entry.text.trim() }
}
// What is written to Git: these four keys and nothing else.
export const wiqlOut = ({ name, server, project, text }: WiqlQuery): WiqlQuery => ({ name, server, project, text })

// A new custom query from the form, or why the main button is disabled: the connection, the WIQL, the name.
export function newWiqlQuery(input: { name: string; server: string; project: string; text: string }): WiqlQuery | string {
  if (!input.server || !input.project) return 'Choose the connection the query runs on.'
  const problem = wiqlProblem(input.text)
  if (problem) return problem
  const name = input.name.trim().replace(/\s+/g, ' ')
  if (!name) return 'Enter a query name.'
  if (name.length > maxQueryName) return `Use a name of at most ${maxQueryName} characters.`
  const parsed = parseWiqlQuery({ ...input, name })
  return typeof parsed === 'string' ? parsed.replace(/^The custom query “[^”]*” /, 'The query ') : parsed
}
