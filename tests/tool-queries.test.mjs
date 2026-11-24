import test from 'node:test'
import assert from 'node:assert/strict'
import { completionDateOf, completionFieldOptions, toolMonthReport, toolQueryIndex } from '../src/toolQueries.ts'
import { completedCount, defaultStreamReleases, streamCounts, supportedCount, toolReportFor } from '../src/releaseOverview.ts'
import { releaseComparison } from '../src/pulseCheck.ts'
import { packStreamsOf } from '../src/packInputs.ts'
import { completedOf } from '../src/cumulativeReleases.ts'
import { defaultStreams, noToolDocumentsQuery, profileForStream, setToolDocumentsQuery, toolQueries } from '../src/streams.ts'
import { normalizeReleaseSourceSettings, normalizeToolValidationsSettings } from '../src/releaseSource.ts'
import { planningData, parsePlanning, serializePlanning } from '../src/gitStorage.ts'

// TVL-19…TVL-22: Tool Validations from two queries — Tools (one row per tool: Completed by its completion date) and
// Signed documents (one row per document, Parent = the tool: Supported by a qualifying Quality signature, CP's rule).
// Synthetic data only.
const tool = (id, title, changed, fields = {}) => ({ key: `o/p/${id}`, id, title, workItemType: 'Tool', state: 'Active', assignedTo: '', areaPath: 'DHP', iterationPath: 'DHP', tags: '', url: `https://example.invalid/${id}`, organization: 'o', project: 'p', syncedAt: '', changedDate: changed, fields })
const slot = (n, name, role, date) => ({ [`Custom.ApproverName${n}`]: name, [`Custom.ApproverFunction${n}`]: role, [`Custom.ApproverApprovalDate${n}`]: date })
const doc = (id, parentId, title, ...slots) => ({ key: `o/p/${id}`, id, title, workItemType: 'Document', state: 'Approved', assignedTo: '', areaPath: 'DHP', iterationPath: 'DHP', tags: '', url: `https://example.invalid/${id}`, organization: 'o', project: 'p', syncedAt: '', ...(parentId != null ? { parentId } : {}), fields: Object.assign({}, ...slots) })
const docColumns = [1, 2].flatMap((n) => [{ ref: `Custom.ApproverName${n}`, name: `ApproverName${n}` }, { ref: `Custom.ApproverFunction${n}`, name: `ApproverFunction${n}` }, { ref: `Custom.ApproverApprovalDate${n}`, name: `ApproverApprovalDate${n}` }])
const toolColumns = [{ ref: 'System.Title', name: 'Title' }, { ref: 'Custom.ValidationCompleted', name: 'Validation Completed' }, { ref: 'Custom.Owner', name: 'Owner' }]

const tools = () => [
  tool(10, 'Minitab 21', '2026-10-05T10:00:00Z', { 'Custom.ValidationCompleted': '2026-09-28T00:00:00Z' }),
  tool(11, 'LabVIEW 2020', '2026-10-31T23:30:00Z', { 'Custom.ValidationCompleted': '2026-10-10T00:00:00Z' }),
  tool(12, 'JMP 17', '2026-09-15T08:00:00Z'),
  tool(13, 'Python 3.11', '2026-11-01T00:30:00Z'),
]
const documents = () => [
  // Minitab: a QA signature in October (role with spaces and other case), one by a non-Quality role in October.
  doc(100, 10, 'Minitab 21 Validation Plan', slot(1, 'Ana Costa', '  qaqe FOR software ', '2026-10-12T09:00:00Z'), slot(2, 'Bo Li', 'Author', '2026-10-01T09:00:00Z')),
  doc(101, 10, 'Minitab 21 Validation Report', slot(1, 'Ana Costa', 'QE', '2026-10-20T09:00:00Z')),
  // JMP: a Quality role but no name in the slot (not qualifying), and a QA signature in September.
  doc(102, 12, 'JMP 17 Validation Report', slot(1, '', 'QA', '2026-10-03T09:00:00Z'), slot(2, 'Cy Dahl', 'QA', '2026-09-30T23:00:00Z')),
  // LabVIEW: a QA signature with an unreadable date (not qualifying); a Quality Engineer signature in November.
  doc(103, 11, 'LabVIEW 2020 Report', slot(1, 'Ana Costa', 'QA', 'soon'), slot(2, 'Di Eng', 'Quality Engineer', '2026-11-02T09:00:00Z')),
  // Not linked: a Parent that is no tool of the Tools query (signed in October), and one without a Parent.
  doc(104, 999, 'Orphan Test Report', slot(1, 'Ana Costa', 'QA', '2026-10-15T09:00:00Z')),
  doc(105, undefined, 'Loose Plan'),
]

test('TVL-21: Completed by the default completion date, Changed Date (last updated date), in UTC (TC-TVL-14)', () => {
  const index = toolQueryIndex(tools(), toolColumns, documents(), docColumns)
  const october = toolMonthReport(index, '2026-10')
  assert.equal(october.completionField, 'System.ChangedDate')
  assert.deepEqual(october.completed.map((row) => row.label), ['LabVIEW 2020', 'Minitab 21'], 'changed in October (UTC; 31 Oct 23:30 is still October)')
  assert.deepEqual(toolMonthReport(index, '2026-11').completed.map((row) => row.label), ['Python 3.11'])
  assert.deepEqual(toolMonthReport(index, '2026-09').completed.map((row) => row.label), ['JMP 17'])
  assert.equal(completionDateOf(tools()[0]), '2026-10-05T10:00:00Z')
})

test('TVL-20, TVL-21: Completed by a chosen completion field; a tool without it is never Completed (TC-TVL-14)', () => {
  const index = toolQueryIndex(tools(), toolColumns, documents(), docColumns, { completionField: 'Custom.ValidationCompleted' })
  assert.deepEqual(toolMonthReport(index, '2026-10').completed.map((row) => row.label), ['LabVIEW 2020'])
  assert.deepEqual(toolMonthReport(index, '2026-09').completed.map((row) => row.label), ['Minitab 21'])
  assert.equal(index.noCompletionDate, 2, 'JMP and Python have no Validation Completed')
  assert.equal(completionDateOf(tools()[1], 'custom.validationcompleted'), '2026-10-10T00:00:00Z', 'the field in any letter case')
  // The date columns offered: Changed Date first (the default), then the query's date columns by name.
  assert.deepEqual(completionFieldOptions(toolColumns, tools()).map((option) => option.ref), ['System.ChangedDate', 'Custom.ValidationCompleted'])
})

test('TVL-21: Supported via Parent and a qualifying Quality signature — roles trimmed and case ignored, empty slots and other months not counted (TC-TVL-15)', () => {
  const index = toolQueryIndex(tools(), toolColumns, documents(), docColumns)
  const october = toolMonthReport(index, '2026-10')
  assert.deepEqual(october.supported.map((entry) => [entry.tool.label, entry.documents, entry.signatures.map((found) => `${found.documentId}/${found.slot}`)]), [['Minitab 21', 2, ['100/1', '101/1']]], 'the Author signature, the slot without a name and the unreadable date do not qualify')
  assert.equal(october.signedDocuments, 2)
  assert.deepEqual(toolMonthReport(index, '2026-09').supported.map((entry) => entry.tool.label), ['JMP 17'], '30 Sep 23:00 UTC is September')
  assert.deepEqual(toolMonthReport(index, '2026-11').supported.map((entry) => entry.tool.label), ['LabVIEW 2020'])
  assert.deepEqual(october.listed.map((row) => row.label), ['LabVIEW 2020', 'Minitab 21'], 'listed: completed or supported, each once')
  // A role list of one's own (the CP reporting settings' roles) is the allowlist.
  assert.deepEqual(toolMonthReport(toolQueryIndex(tools(), toolColumns, documents(), docColumns, { roles: ['Author'] }), '2026-10').supported.map((entry) => entry.tool.label), ['Minitab 21'])
})

test('TVL-21: documents whose Parent is no tool are “Not linked to a tool”: listed, never counted (TC-TVL-15)', () => {
  const report = toolMonthReport(toolQueryIndex(tools(), toolColumns, documents(), docColumns), '2026-10')
  assert.deepEqual(report.unlinked.map((entry) => [entry.id, entry.parentId ?? null, entry.months]), [[104, 999, ['2026-10']], [105, null, []]])
  assert.deepEqual(report.unlinkedSigned.map((entry) => entry.id), [104])
  assert.ok(!report.supported.some((entry) => entry.tool.id === 999))
  // A Parent read from the query's Parent column when the item has none of its own.
  const viaColumn = toolQueryIndex(tools(), toolColumns, [{ ...doc(106, undefined, 'Column parent', slot(1, 'Ana Costa', 'QA', '2026-10-02T00:00:00Z')), fields: { 'System.Parent': 12, ...slot(1, 'Ana Costa', 'QA', '2026-10-02T00:00:00Z') } }], docColumns)
  assert.deepEqual(toolMonthReport(viaColumn, '2026-10').supported.map((entry) => entry.tool.id), [12])
})

test('TVL-21: 20,000 documents are read once into maps — linear, a month is a lookup (TC-TVL-15)', () => {
  const many = Array.from({ length: 2000 }, (_, index) => tool(1000 + index, `Tool ${index}`, '2026-10-01T00:00:00Z'))
  const docs = Array.from({ length: 20000 }, (_, index) => doc(100000 + index, 1000 + (index % 2000), `Doc ${index}`, slot(1, 'Ana Costa', 'QA', `2026-${index % 2 ? '10' : '09'}-15T00:00:00Z`)))
  const started = performance.now()
  const index = toolQueryIndex(many, toolColumns, docs, docColumns)
  const report = toolMonthReport(index, '2026-10')
  assert.equal(report.supported.length, 1000)
  assert.equal(report.completed.length, 2000)
  assert.ok(performance.now() - started < 5000, 'well under a few seconds')
})

// Two connections of the Tool Validations stream, told apart by name, by the setting or by the query's columns.
const toolsProfile = { id: 'tv', reason: 'Tool Validations', role: 'release-source', query: "SELECT [System.Id] FROM WorkItems WHERE [System.WorkItemType] = 'Tool'" }
const docsProfile = { id: 'tvd', reason: 'Tool Validations Signed documents', role: 'release-source', query: "SELECT [System.Id], [System.Parent], [Custom.ApproverName1] FROM WorkItems WHERE [System.WorkItemType] = 'Document'" }
const source = (connectionId, items, columns) => ({ connectionId, name: connectionId, role: 'release-source', organization: 'o', project: 'p', query: 'q', fetchedAt: '2026-11-20T00:00:00Z', items, columns })
const twoState = (settings) => ({ azureSources: [source('tv', tools(), toolColumns), source('tvd', documents(), docColumns)], ...(settings ? { releaseSourceSettings: settings } : {}) })
const toolStream = defaultStreams.find((stream) => stream.rule === 'tool')

test('TVL-19: the two connections — Signed documents by the setting, by its name or by its columns; with one connection none (TC-TVL-16)', () => {
  assert.deepEqual(Object.entries(toolQueries(toolStream, [docsProfile, toolsProfile], undefined)).filter(([key]) => key !== 'all').map(([key, value]) => [key, value?.id ?? value]), [['tools', 'tv'], ['documents', 'tvd'], ['how', 'name']], 'by name, whatever the order')
  const plain = { ...docsProfile, reason: 'Tool Validations B' }
  assert.equal(toolQueries(toolStream, [toolsProfile, plain], undefined).how, 'columns', 'by its Parent and ApproverName columns')
  const chosen = toolQueries(toolStream, [toolsProfile, { ...plain, query: 'SELECT [System.Id] FROM WorkItems' }], 'tool validations b')
  assert.deepEqual([chosen.tools.id, chosen.documents.id, chosen.how], ['tv', 'tvd', 'setting'], 'the connection chosen in Stream mapping (case and punctuation ignored)')
  assert.deepEqual([toolQueries(toolStream, [toolsProfile, docsProfile], noToolDocumentsQuery).documents, toolQueries(toolStream, [toolsProfile, docsProfile], noToolDocumentsQuery).how], [undefined, 'off'])
  assert.deepEqual([toolQueries(toolStream, [toolsProfile], undefined).tools.id, toolQueries(toolStream, [toolsProfile], undefined).how], ['tv', 'single'])
  assert.equal(profileForStream(toolStream, [docsProfile, toolsProfile]).id, 'tv', 'the stream’s connection (menu, master list) is the Tools query')
})

test('TVL-22: Pulse Check, the Release page, the Monthly pack and the cumulative chart count the same with two queries (TC-TVL-16)', () => {
  const profiles = [toolsProfile, docsProfile]
  for (const [settings, completed, supported] of [[undefined, 2, 1], [{ toolValidations: { completionField: 'Custom.ValidationCompleted' } }, 1, 1]]) {
    const state = twoState(settings)
    const page = toolReportFor(state, profiles, '2026-10', 'UTC').report
    const pulse = releaseComparison(defaultStreamReleases(state, profiles, '2026-10', 'UTC'), defaultStreamReleases(state, profiles, '2026-09', 'UTC')).find((row) => row.name === 'Tool Validations')
    assert.deepEqual([pulse.releases, pulse.supported], [page.completed.length, page.supported.length], 'Pulse Check month = the Release page')
    assert.deepEqual([pulse.releases, pulse.supported], [completed, supported])
    const stream = defaultStreamReleases(state, profiles, '2026-10', 'UTC').find((entry) => entry.name === 'Tool Validations')
    assert.deepEqual([completedCount(stream), supportedCount(stream)], [completed, supported])
    assert.deepEqual(stream.supportedEntries.map((entry) => entry.label), ['Minitab 21'])
    const pack = packStreamsOf(state, profiles, { views: [], sources: [] }, '2026-10').find((entry) => entry.name === 'Tool Validations')
    assert.deepEqual([pack.releases.length, pack.supported], [completed, supported], 'the Monthly pack')
    assert.equal(completedOf(state, profiles, { views: [], sources: [] }, '2026-10').find((entry) => entry.name === 'Tool Validations').completed, completed, 'the cumulative chart')
  }
  // The period (Quarter): a tool supported in two months counts once.
  const counts = streamCounts(twoState(), profiles, ['2026-09', '2026-10', '2026-11'], 'UTC').find((entry) => entry.name === 'Tool Validations')
  assert.equal(counts.supported, 3)
})

test('TVL-19, QV-64: with one connection Tool Validations counts as before — each tool with a document in the month (TC-TVL-16)', () => {
  const single = { azureSources: [source('tv', [
    { ...doc(1, undefined, 'Minitab 21 Validation Report'), areaPath: 'DHP\\Tool Validations\\Minitab', approvalDate: '2026-10-05T10:00:00Z' },
    { ...doc(2, undefined, 'Minitab 21 Validation Plan'), areaPath: 'DHP\\Tool Validations\\Minitab', approvalDate: '2026-10-06T10:00:00Z' },
  ])] }
  const stream = defaultStreamReleases(single, [toolsProfile], '2026-10', 'UTC').find((entry) => entry.name === 'Tool Validations')
  assert.deepEqual([completedCount(stream), supportedCount(stream), stream.supportedEntries], [1, undefined, undefined])
  assert.equal(toolReportFor(single, [toolsProfile], '2026-10', 'UTC'), undefined)
  // Set to none: two connections, one query, counted as before.
  setToolDocumentsQuery(noToolDocumentsQuery)
  try { assert.equal(toolReportFor(twoState(), [toolsProfile, docsProfile], '2026-10', 'UTC'), undefined) } finally { setToolDocumentsQuery(undefined) }
})

test('TVL-20: the setting is kept in the shared settings and survives the Git round trip; bad values are dropped (TC-TVL-17)', () => {
  const settings = { toolValidations: { documentsQuery: '  Tool Validations  Signed documents ', completionField: 'Custom.ValidationCompleted' } }
  assert.deepEqual(normalizeReleaseSourceSettings(settings).toolValidations, { documentsQuery: 'Tool Validations Signed documents', completionField: 'Custom.ValidationCompleted' })
  const data = planningData({ baselineRules: [], releaseScopes: [], resourceProfiles: {}, releaseSourceSettings: settings })
  assert.deepEqual(parsePlanning(serializePlanning(data)).releaseSourceSettings.toolValidations, { documentsQuery: 'Tool Validations Signed documents', completionField: 'Custom.ValidationCompleted' })
  assert.equal(normalizeToolValidationsSettings({ completionField: 'System.ChangedDate; DROP', documentsQuery: 'x'.repeat(121) }), undefined)
  assert.equal(normalizeToolValidationsSettings('nope'), undefined)
  assert.deepEqual(normalizeToolValidationsSettings({ documentsQuery: '@none' }), { documentsQuery: '@none' })
})
