import test from 'node:test'
import assert from 'node:assert/strict'
import { changedQuery, changeQueryReason, chooseType, defaultTicks, editedKind, fixedSourceReason, fixedSourceText, newPageType, noQueryToChange, noTicks, pageSourceOut, pageTypeOf, parsePageSource, queryOfPage, sourceProblem, tableLockReason, tableSourceOf, dashboardLockReason, tickReason, ticksOf, typeText, typeTicks } from '../src/pageType.ts'
import { maxWiqlText, newWiqlQuery, pasteWiql, wiqlProblem } from '../src/wiqlQuery.ts'
import { checkWorkItemQuery, maxWiqlLength } from '../src/releaseSource.ts'
import { emptyPage, mergeOnDemandText, parseOnDemandPage, serializeOnDemandPage } from '../src/onDemand.ts'
import { dataSources } from '../src/dashboardPages.ts'

const ref = { id: 'q1', name: 'Open defects', server: 'https://dev.azure.com/example', project: 'DHP', queryId: '0f8a3c1e-2b4d-4e6f-8a9b-1c2d3e4f5a6b' }
const keys = ['own', 'query', 'insights', 'dashboard']
const ticks = (...on) => ({ ...noTicks(), ...Object.fromEntries(on.map((key) => [key, true])) })

test('PGB-22: the four tick boxes in order, Table (Build your own) ticked by default', () => {
  assert.deepEqual(typeTicks.map((tick) => tick.label), ['Table (Build your own)', 'Table (Query)', 'Insights', 'Dashboard'])
  assert.deepEqual(defaultTicks(), ticks('own'))
  assert.deepEqual(pageTypeOf(defaultTicks()), { kind: 'table', source: 'own' })
})

test('PGB-22: every one of the 16 combinations of the four ticks is a page type or says why not (TC-PGB-17)', () => {
  const expected = {
    '': chooseType,
    own: { kind: 'table', source: 'own' },
    query: { kind: 'table', source: 'query' },
    'own+query': 'A table has one source: tick Table (Build your own) or Table (Query), not both.',
    insights: 'Insights reads a table’s rows: tick Table (Build your own) or Table (Query) as well.',
    'own+insights': { kind: 'table-insights', source: 'own' },
    'query+insights': { kind: 'table-insights', source: 'query' },
    'own+query+insights': 'A table has one source: tick Table (Build your own) or Table (Query), not both.',
    dashboard: { kind: 'dashboard', source: 'own' },
  }
  let valid = 0
  for (let mask = 0; mask < 16; mask++) {
    const on = keys.filter((_, at) => mask & (1 << at))
    const result = pageTypeOf(ticks(...on))
    const name = on.join('+')
    if (name in expected) assert.deepEqual(result, expected[name], name || 'nothing')
    else assert.equal(result, 'A Dashboard stands alone: untick the other choices, or untick Dashboard.', name)
    if (typeof result !== 'string') valid++
  }
  assert.equal(valid, 5, 'Dashboard; Table of either source; Table + Insights of either source')
  assert.equal(typeText({ kind: 'table-insights', source: 'query' }), 'Table + Insights · rows from an Azure DevOps query')
  assert.equal(typeText({ kind: 'table', source: 'own' }), 'Table · rows the team adds itself')
  assert.match(typeText({ kind: 'dashboard', source: 'own' }), /^On-Demand Dashboard · /)
})

test('PGB-22: a tick that would make a combination that is not a type is disabled with its reason; unticking is free (TC-PGB-17)', () => {
  // From every set that can be reached by ticking only enabled boxes, no tick of an enabled box leads to an invalid
  // combination other than "nothing yet" / "Insights alone" (reached only by unticking).
  for (let mask = 0; mask < 16; mask++) {
    const set = ticks(...keys.filter((_, at) => mask & (1 << at)))
    for (const key of keys) {
      const reason = tickReason(set, key)
      if (set[key]) { assert.equal(reason, '', `unticking ${key} is always allowed`); continue }
      if (typeof pageTypeOf(set) === 'string' && !['', 'insights'].includes(keys.filter((k) => set[k]).join('+'))) continue
      const next = pageTypeOf({ ...set, [key]: true })
      if (reason) assert.equal(typeof next, 'string', `${key} disabled only when it makes an invalid type`)
      else assert.ok(typeof next !== 'string' || next.startsWith('Insights reads'), `${key} enabled → a type (${next})`)
    }
  }
  assert.equal(tickReason(ticks('own'), 'query'), 'A table has one source: untick Table (Build your own) first.')
  assert.equal(tickReason(ticks('query', 'insights'), 'own'), 'A table has one source: untick Table (Query) first.')
  assert.equal(tickReason(ticks('own', 'insights'), 'dashboard'), 'A Dashboard stands alone: untick Table (Build your own) and Insights first.')
  assert.equal(tickReason(ticks('dashboard'), 'insights'), 'A Dashboard stands alone: untick Dashboard first.')
  assert.equal(tickReason(noTicks(), 'insights'), '', 'Insights can be ticked first; the main button then asks for a table source')
})

test('PGB-26: Edit page — the family and the table source are fixed, only Insights switches (TC-PGB-19)', () => {
  const lock = { family: 'table', source: 'query' }
  const set = ticksOf('table', 'query')
  assert.deepEqual(set, ticks('query'))
  assert.equal(tickReason(set, 'own', lock), fixedSourceReason('query'))
  assert.equal(fixedSourceReason('query'), 'The table’s rows come from an Azure DevOps query; add a new page for the other source.')
  assert.equal(tickReason(set, 'query', lock), fixedSourceText, 'the own source cannot be unticked either')
  assert.equal(tickReason(set, 'dashboard', lock), tableLockReason)
  assert.equal(tickReason(set, 'insights', lock), '')
  assert.deepEqual(editedKind({ ...set, insights: true }, lock), { kind: 'table-insights' })
  assert.deepEqual(editedKind({ ...noTicks(), dashboard: true, own: true }, lock), { kind: 'table' }, 'a forged tick changes nothing: the source and family stay')
  const own = { family: 'table', source: 'own' }
  assert.equal(tickReason(ticksOf('table-insights', 'own'), 'query', own), 'The table’s rows come from the team’s own rows (Build your own); add a new page for the other source.')
  assert.deepEqual(editedKind(ticksOf('table-insights', 'own'), own), { kind: 'table-insights' })
  const dash = { family: 'dashboard' }
  for (const key of keys) assert.equal(tickReason(ticksOf('dashboard', 'own'), key, dash), dashboardLockReason)
  assert.deepEqual(editedKind(ticks('own'), dash), { kind: 'dashboard' })
})

test('PGB-22, PGB-23: what Add page creates — a Table (Query) needs its reference; no other combination is created (TC-PGB-17, TC-PGB-18)', () => {
  assert.deepEqual(newPageType(ticks('own', 'insights'), null), { kind: 'table-insights' })
  assert.deepEqual(newPageType(ticks('dashboard'), ref), { kind: 'dashboard' }, 'a Dashboard never gets a source')
  assert.equal(newPageType(ticks('query'), null), 'Choose the saved query of the table.')
  assert.deepEqual(newPageType(ticks('query', 'insights'), { ...ref, pat: 'secret' }), { kind: 'table-insights', source: { kind: 'query', query: ref } })
  assert.equal(newPageType(ticks('query', 'dashboard'), ref), 'A Dashboard stands alone: untick the other choices, or untick Dashboard.')
  assert.match(newPageType(ticks('query'), { ...ref, server: 'http://dev.azure.com/example' }), /no valid https server\.$/)
})

test('PGB-27: the table source is validated when read — absent is Build your own, a bad one is kept read only with its reason (TC-PGB-20)', () => {
  for (const raw of [undefined, null, { kind: 'own' }]) assert.equal(parsePageSource(raw), undefined)
  assert.deepEqual(parsePageSource({ kind: 'query', query: { ...ref, pat: 'secret', rows: [1] }, extra: 'x' }), { kind: 'query', query: ref }, 'only the five keys')
  const bad = parsePageSource({ kind: 'query', query: { ...ref, queryId: 'not-a-guid', token: 'secret' } })
  assert.equal(bad.kind, 'invalid')
  assert.equal(sourceProblem(bad), 'The table’s query reference is not valid — The Azure query “Open defects” has no valid query id.')
  assert.deepEqual(pageSourceOut(bad), { source: { kind: 'query', query: { id: 'q1', name: 'Open defects', server: ref.server, project: 'DHP', queryId: 'not-a-guid' } } }, 'written back without the token')
  assert.equal(sourceProblem(parsePageSource({ kind: 'release' })), 'The table’s source “release” is not known to this version of the app: update the app.')
  assert.equal(sourceProblem(parsePageSource('query')), 'The table’s source in the page file is not readable.')
  assert.equal(sourceProblem(parsePageSource([1])), 'The table’s source in the page file is not readable.')
  assert.deepEqual(pageSourceOut(parsePageSource('query')), { source: { kind: 'invalid' } }, 'still a source: the page never turns into an editable table')
  assert.deepEqual(pageSourceOut(undefined), {})
})

test('PGB-23, PGB-27: page files — without a source unchanged; a query page keeps only its reference and insights, never rows (TC-PGB-18, TC-PGB-20)', () => {
  // Backward compatibility: a page file from before reads and writes exactly as before.
  const old = serializeOnDemandPage(parseOnDemandPage(JSON.stringify({ schema: 1, kind: 'on-demand-page', id: 'audits', name: 'Audits', description: '', keyPrefix: 'AUD', columns: [{ id: 'c1', name: 'Topic', type: 'text' }], rows: [{ id: 'r1', key: 'AUD-261127-K7Q2', seq: 1, cells: { c1: 'Seal' } }] }), 'audits'))
  assert.equal(parseOnDemandPage(old, 'audits').source, undefined)
  assert.equal(old.includes('source'), false)
  assert.equal(serializeOnDemandPage(parseOnDemandPage(old, 'audits')), old)
  // A query page: rows or columns in a crafted file are dropped, never written back.
  const crafted = JSON.stringify({ schema: 1, kind: 'on-demand-page', id: 'defects', name: 'Defects', description: '', keyPrefix: 'DEF', columns: [{ id: 'c1', name: 'Title', type: 'text' }], rows: [{ id: 'r1', cells: { c1: 'Seal leaks' } }], source: { kind: 'query', query: { ...ref, pat: 'test-pat' } }, insights: [{ id: 'i1', title: 'By state', type: 'bar', category: 'q_System_State', second: '', measure: 'count', filters: [], sort: 'value' }] })
  const page = parseOnDemandPage(crafted, 'defects')
  assert.deepEqual([page.columns, page.rows, page.source], [[], [], { kind: 'query', query: ref }])
  const text = serializeOnDemandPage({ ...page, rows: [{ id: 'r9', cells: { q_System_Title: 'Label faded' } }] })
  for (const word of ['test-pat', 'Seal leaks', 'Label faded']) assert.equal(text.includes(word), false, word)
  const written = JSON.parse(text)
  assert.deepEqual([written.columns, written.rows, written.source, written.insights.map((entry) => entry.category)], [[], [], { kind: 'query', query: ref }, ['q_System_State']])
  // Created by Add page with its source; merged, the source stays.
  const created = emptyPage('defects', 'Defects', '', { kind: 'query', query: ref })
  const base = serializeOnDemandPage(created)
  const mine = serializeOnDemandPage({ ...created, insights: page.insights })
  const theirs = serializeOnDemandPage({ ...created, name: 'Open defects' })
  const merged = parseOnDemandPage(mergeOnDemandText(base, mine, theirs, true), 'defects')
  assert.deepEqual([merged.name, merged.insights.length, merged.source], ['Open defects', 1, { kind: 'query', query: ref }])
  // A malformed source does not throw: the page reads, with the reason.
  const broken = parseOnDemandPage(JSON.stringify({ ...JSON.parse(crafted), source: { kind: 'query', query: 'nope' } }), 'defects')
  assert.equal(broken.source.kind, 'invalid')
  assert.equal(broken.rows.length, 0)
})

test('PGB-24: a Table (Query) page is not offered as a dashboard data source (it holds no rows in Git) (TC-PGB-18)', () => {
  const own = emptyPage('audits', 'Audits'), query = emptyPage('defects', 'Defects', '', { kind: 'query', query: ref })
  assert.deepEqual(dataSources([own, query], (id) => [own, query].find((page) => page.id === id), () => false, '').map((entry) => entry.name), ['Audits'])
})

// ---- PGB-28…PGB-31: a Table (Query) page of a custom WIQL query ----
const wiqlText = "SELECT [System.Id], [System.Title], [System.State] FROM WorkItems WHERE [System.TeamProject] = @project AND [System.WorkItemType] = 'Bug' ORDER BY [System.State] DESC"
const treeText = "SELECT [System.Id], [System.Title] FROM WorkItemLinks WHERE ([Source].[System.WorkItemType] = 'Epic') AND ([System.Links.LinkType] = 'System.LinkTypes.Hierarchy-Forward') MODE (Recursive)"
const wiql = { name: 'Open bugs', server: 'https://dev.azure.com/example', project: 'DHP', text: wiqlText }

test('PGB-28: a custom query is checked with the rules and messages of a stream connection’s query (CON-78) (TC-PGB-21)', () => {
  // The same function the connection form uses (checkWorkItemQuery): every message is its own.
  const streamMessage = (text) => { try { checkWorkItemQuery(text); return '' } catch (failure) { return failure.message } }
  for (const text of [wiqlText, treeText, "SELECT [System.Id] FROM WorkItems WHERE [System.Id] > 0 ASOF '2026-01-01'", 'SELECT [System.Id] FROM WorkItemLinks WHERE [System.Id] > 0 MODE (Sideways)', 'DELETE FROM WorkItems', 'SELECT [System.Id] FROM WorkItems']) {
    assert.equal(wiqlProblem(text), streamMessage(text), text)
  }
  assert.equal(wiqlProblem(wiqlText), '')
  assert.equal(wiqlProblem(treeText), '', 'a tree / links query is a query too')
  assert.equal(wiqlProblem('   '), pasteWiql)
  assert.equal(wiqlProblem('DELETE FROM WorkItems'), 'Paste a work-item query: SELECT … FROM WorkItems WHERE … (flat list) or SELECT … FROM WorkItemLinks WHERE … MODE (…) (tree or direct links).')
  assert.equal(wiqlProblem('SELECT [System.Id] FROM WorkItemLinks WHERE [System.Id] > 0 MODE (Sideways)'), 'Unsupported MODE in the tree or links query.')
  // The cap: one constant, the stream connections' own.
  assert.equal(maxWiqlText, maxWiqlLength)
  assert.equal(wiqlProblem(`SELECT [System.Id] FROM WorkItems WHERE [System.Title] = '${'x'.repeat(maxWiqlText)}'`), 'The query is too long.')
  // The form: the connection, then the WIQL, then the name (the main button says the first that is missing).
  assert.equal(newWiqlQuery({ ...wiql, server: '' }), 'Choose the connection the query runs on.')
  assert.equal(newWiqlQuery({ ...wiql, text: '' }), pasteWiql)
  assert.equal(newWiqlQuery({ ...wiql, name: '  ' }), 'Enter a query name.')
  assert.equal(newWiqlQuery({ ...wiql, name: 'x'.repeat(81) }), 'Use a name of at most 80 characters.')
  assert.equal(newWiqlQuery({ ...wiql, server: 'http://dev.azure.com/example' }), 'The query has no valid https server.')
  assert.deepEqual(newWiqlQuery({ ...wiql, name: '  Open   bugs ', text: `\n${wiqlText}\n` }), wiql)
  // What Add page creates.
  assert.deepEqual(newPageType(ticks('query', 'insights'), { ...wiql, pat: 'secret' }), { kind: 'table-insights', source: { kind: 'query', wiql } })
  assert.equal(newPageType(ticks('query'), { ...wiql, text: 'SELECT nothing' }).startsWith('The query cannot be run: Paste a work-item query'), true)
})

test('PGB-29: the page file keeps a saved query or a custom query — exactly one, only their keys, the WIQL capped; a bad one read only with its reason (TC-PGB-22)', () => {
  assert.deepEqual(parsePageSource({ kind: 'query', wiql: { ...wiql, pat: 'secret', rows: [1] } }), { kind: 'query', wiql }, 'only the four keys')
  assert.deepEqual(pageSourceOut(parsePageSource({ kind: 'query', wiql })), { source: { kind: 'query', wiql } })
  assert.deepEqual(parsePageSource({ kind: 'query', query: ref }), { kind: 'query', query: ref }, 'a saved query page unchanged')
  // Exactly one of the two.
  const both = parsePageSource({ kind: 'query', query: ref, wiql: { ...wiql, token: 'secret' } })
  assert.equal(sourceProblem(both), 'The table’s source has both a saved query and a custom query: a Table (Query) page reads one.')
  assert.deepEqual(pageSourceOut(both), { source: { kind: 'query', query: ref, wiql } }, 'kept as written, without the token')
  assert.match(sourceProblem(parsePageSource({ kind: 'query' })), /^The table’s query reference is not valid — /)
  // Malformed custom queries: read only with the reason, nothing run.
  const cases = [
    [{ ...wiql, text: "SELECT [System.Id] FROM WorkItems WHERE [System.Id] > 0 ASOF '2026-01-01'" }, 'The table’s custom query is not valid — The custom query “Open bugs” cannot be run: Historical (ASOF) and link-mode queries are not supported.'],
    [{ ...wiql, text: 'UPDATE WorkItems SET x = 1' }, /cannot be run: Paste a work-item query/],
    [{ ...wiql, text: 42 }, 'The table’s custom query is not valid — The custom query “Open bugs” has no WIQL.'],
    [{ ...wiql, name: '' }, 'The table’s custom query is not valid — The custom query has no name.'],
    [{ ...wiql, project: 'a/b' }, /has no valid project\.$/],
    [{ ...wiql, server: 'javascript:alert(1)' }, /has no valid https server\.$/],
    ['SELECT [System.Id] FROM WorkItems WHERE 1 = 1', 'The table’s custom query is not valid — The custom query is not readable.'],
  ]
  for (const [raw, problem] of cases) {
    const parsed = parsePageSource({ kind: 'query', wiql: raw })
    assert.equal(parsed.kind, 'invalid', JSON.stringify(raw))
    if (typeof problem === 'string') assert.equal(sourceProblem(parsed), problem)
    else assert.match(sourceProblem(parsed), problem)
  }
  // The cap: a text over maxWiqlText is refused and kept back only up to the cap.
  const long = parsePageSource({ kind: 'query', wiql: { ...wiql, text: `${wiqlText} ${'x'.repeat(maxWiqlText + 10)}` } })
  assert.equal(long.kind, 'invalid')
  assert.match(sourceProblem(long), /The query is too long\.$/)
  assert.equal(pageSourceOut(long).source.wiql.text.length, maxWiqlText)
  // The page file: a custom query page holds the query and its insights, never rows, never a PAT.
  const crafted = JSON.stringify({ schema: 1, kind: 'on-demand-page', id: 'bugs', name: 'Bugs', description: '', keyPrefix: 'BUG', columns: [{ id: 'c1', name: 'Title', type: 'text' }], rows: [{ id: 'r1', cells: { c1: 'Seal leaks' } }], source: { kind: 'query', wiql: { ...wiql, pat: 'test-pat' } } })
  const page = parseOnDemandPage(crafted, 'bugs')
  assert.deepEqual([page.columns, page.rows, page.source], [[], [], { kind: 'query', wiql }])
  const text = serializeOnDemandPage({ ...page, rows: [{ id: 'r9', cells: { q_System_Title: 'Label faded' } }] })
  for (const word of ['test-pat', 'Seal leaks', 'Label faded']) assert.equal(text.includes(word), false, word)
  assert.deepEqual(JSON.parse(text).source, { kind: 'query', wiql })
})

test('PGB-31: Change query… — the query of a Table (Query) page changes (saved ↔ custom, or the WIQL edited), the table’s source stays fixed (TC-PGB-23)', () => {
  const saved = { kind: 'query', query: ref }, custom = { kind: 'query', wiql }
  assert.deepEqual(changedQuery(saved, wiql), custom, 'saved → custom')
  assert.deepEqual(changedQuery(custom, ref), saved, 'custom → saved')
  assert.deepEqual(changedQuery(custom, { ...wiql, text: treeText }), { kind: 'query', wiql: { ...wiql, text: treeText } }, 'the WIQL edited')
  assert.equal(changedQuery(custom, { ...wiql, text: 'SELECT 1' }).startsWith('The query cannot be run:'), true, 'a WIQL the stream queries refuse is refused')
  // The source is fixed: a Build your own page has no query to change; an unknown source kind neither.
  assert.equal(changeQueryReason(undefined), noQueryToChange)
  assert.equal(changedQuery(undefined, wiql), noQueryToChange)
  assert.equal(changeQueryReason(parsePageSource({ kind: 'release' })), 'The table’s source is not a query this version of the app knows: update the app.')
  // A query page whose query is not valid gets a valid one again.
  const broken = parsePageSource({ kind: 'query', wiql: { ...wiql, text: 'nope' } })
  assert.equal(changeQueryReason(broken), '')
  assert.deepEqual(changedQuery(broken, wiql), custom)
  // Edit page still keeps the source (PGB-26): the lock of a custom query page is the same as of a saved one.
  assert.equal(tableSourceOf(custom), 'query')
  assert.equal(tickReason(ticksOf('table', tableSourceOf(custom)), 'own', { family: 'table', source: 'query' }), fixedSourceReason('query'))
  assert.deepEqual(queryOfPage(custom), wiql)
  assert.deepEqual(queryOfPage(saved), ref)
  assert.equal(queryOfPage(undefined), null)
  // Two saves: the one that changed the query is kept with the other's new name.
  const created = emptyPage('bugs', 'Bugs', '', saved)
  const base = serializeOnDemandPage(created)
  const mine = serializeOnDemandPage({ ...created, source: custom })
  const theirs = serializeOnDemandPage({ ...created, name: 'Open bugs page' })
  const merged = parseOnDemandPage(mergeOnDemandText(base, mine, theirs, false), 'bugs')
  assert.deepEqual([merged.name, merged.source], ['Open bugs page', custom])
})
