import test from 'node:test'
import assert from 'node:assert/strict'
import { addMonths, addSource, aggregate, azureFieldOptions, azureValue, cleanDays, dayOf, daysLeftText, dueOf, editOf, editProblem, emptyFile, entryState, expiryRows, guessMapping, inputsFromRows, listReason, mappingFor, markMerged, mergeSource, mergeToolValidationsText, monthsOf, nameKey, openToolTab, toolTabs, ownersReason, parseToolValidations, removeSource, removeTool, saveTool, serializeToolValidations, setMapping, setTeam, sourceProblem, streamSourceId, toolKey, toolValidationsFile } from '../src/toolValidations.ts'
import { pagesOfFile, fileLabel } from '../src/gitWatch.ts'

// TVL-01…TVL-13: the Tool Validations master list (tool-validations.json in Git), its sources, merges and expiry view.
const at = '2026-11-24T10:00:00Z'
const tool = (name, version, extra = {}) => ({ name, version, manual: [], sources: { stream: { inSource: true } }, addedAt: at, ...extra })
const fileWith = (tools, extra = {}) => JSON.stringify({ schema: 1, kind: 'tool-validations', defaultDays: 60, owners: [], sources: [{ id: 'stream', kind: 'stream', name: 'Tool Validations', mapping: { periodUnit: 'months', confirmed: false } }], tools, ...extra })
const doc = (id, areaPath, iterationPath, title, fields = {}, approvalDate) => ({ key: `o/p/${id}`, id, title, workItemType: 'Document', state: 'Approved', assignedTo: '', areaPath, iterationPath, tags: '', url: '', organization: 'o', project: 'p', syncedAt: '', fields, ...(approvalDate ? { approvalDate } : {}) })

test('TVL-02: the master list read from Git — round trip, each source and tool checked on its own, a broken file refused whole (TC-TVL-01)', () => {
  const empty = parseToolValidations(null)
  assert.deepEqual(empty.file, emptyFile(), 'no file yet: an empty list with the Tool Validations query as its source')
  assert.equal(empty.file.defaultDays, 60, 'team default 60 days')
  assert.throws(() => parseToolValidations('{nope'), /not valid JSON/)
  assert.throws(() => parseToolValidations(JSON.stringify({ schema: 2, kind: 'tool-validations' })), /not a Tool Validations master list/)
  assert.throws(() => parseToolValidations(JSON.stringify({ schema: 1, kind: 'custom-streams' })), /not a Tool Validations master list/)
  const text = fileWith([
    tool('Minitab', '21', { validationDate: '2025-01-15', validityMonths: 24, notes: 'Annual check' }),
    tool('minitab', 'v21.0'),
    tool('LabVIEW', '2020', { dueDate: '2026-02-30' }),
    tool('Python', '3.11', { validityMonths: 0 }),
    tool('', '1'),
    tool('JMP', '17', { sources: { stream: { inSource: false }, unknown: { inSource: true } }, addedAt: 'yesterday' }),
    tool('Excel', '', { sources: {}, validationDate: '2026-01-01', manual: ['validationDate', 'nonsense'] }),
  ], { defaultDays: 5000, owners: ['Diya.Sharma@example.com', 'not an email'], sources: [{ id: 'stream', kind: 'stream', name: 'Tool Validations', mapping: { name: '@tool-name', periodUnit: 'years', confirmed: true } }, { id: 'wc', kind: 'windchill', name: 'Tools export', ref: 'view-1', mapping: {} }, { id: 'Bad Id', kind: 'windchill', name: 'x', ref: 'y' }, { id: 'odd', kind: 'formula', name: 'x', ref: 'y' }, { id: 'wc', kind: 'ondemand', name: 'twice', ref: 'p' }] })
  const { file, refused } = parseToolValidations(text)
  assert.deepEqual(file.tools.map((entry) => `${entry.name} ${entry.version}`), ['Excel ', 'Minitab 21'], 'sorted by name; the bad ones refused')
  assert.deepEqual(refused.map((entry) => entry.reason), [
    'its id is missing or not lower-case letters, digits and hyphens', 'unknown kind “formula”', 'the id “wc” is used twice',
    'the same tool and version is listed twice', 'due date “2026-02-30” is not a date (YYYY-MM-DD)', 'validity period “0” is not a whole number of months from 1 to 600', 'no tool name (1 to 200 characters with a letter or digit)', 'no time it was added (addedAt)',
  ])
  assert.equal(file.defaultDays, 60, 'a team default out of range is not used')
  assert.deepEqual(file.owners, ['diya.sharma@example.com'], 'co-owners are work emails, lower case')
  assert.deepEqual(file.sources.map((source) => source.id), ['stream', 'wc'])
  assert.equal(file.sources[0].mapping.periodUnit, 'years')
  assert.deepEqual(file.tools[0].manual, ['validationDate'], 'unknown hand-changed fields are dropped')
  // Round trip: what is written reads back the same, the key is worked out (never stored).
  const again = parseToolValidations(serializeToolValidations(file))
  assert.deepEqual(again.file, file)
  assert.equal(serializeToolValidations(again.file), serializeToolValidations(file))
  assert.ok(!serializeToolValidations(file).includes('"key"'))
  assert.equal(toolValidationsFile, 'tool-validations.json')
})

test('TVL-03: the same tool is the same name (case, spaces and punctuation ignored) and version; other versions are other entries (TC-TVL-02)', () => {
  assert.equal(nameKey('Mini-Tab  Pro'), nameKey('minitab pro'))
  assert.equal(toolKey('LabVIEW', 'v2020.0'), toolKey('lab view', '2020'))
  assert.notEqual(toolKey('LabVIEW', '2020'), toolKey('LabVIEW', '2021'))
  assert.notEqual(toolKey('LabVIEW', ''), toolKey('LabVIEW', '2020'), 'no version is a version of its own')
  const merged = aggregate([{ name: 'Minitab', version: '21', validationDate: '2025-01-15', validityMonths: 12 }, { name: 'MINITAB', version: '21.0', validationDate: '2025-03-01', validityMonths: 24, dueDate: '2027-01-01' }, { name: 'Minitab', version: '22' }])
  assert.equal(merged.size, 2)
  assert.deepEqual(merged.get(toolKey('minitab', '21')), { name: 'Minitab', version: '21', validationDate: '2025-03-01', validityMonths: 24, dueDate: '2027-01-01' }, 'the latest dates; the period of the latest validation')
})

test('TVL-04, TVL-05: a source merged in — new tools appended, values updated (not those changed by hand), a tool gone from its source kept as “not in source now”; nothing changed gives the same file (TC-TVL-02)', () => {
  let file = parseToolValidations(fileWith([])).file
  const first = mergeSource(file, streamSourceId, [{ name: 'Minitab', version: '21', validationDate: '2025-01-15' }, { name: 'LabVIEW', version: '2020', dueDate: '2026-11-14' }], at, 'Diya Sharma')
  assert.deepEqual([first.added, first.updated, first.gone], [['Minitab', 'LabVIEW'], [], []])
  file = first.file
  assert.equal(file.tools.find((entry) => entry.name === 'Minitab').addedBy, 'Diya Sharma')
  assert.equal(mergeSource(file, streamSourceId, [{ name: 'minitab', version: '21.0', validationDate: '2025-01-15' }, { name: 'LabVIEW', version: '2020', dueDate: '2026-11-14' }], at).file, file, 'the same data: the same file, nothing to save')
  // A date corrected by hand stays; LabVIEW leaves the query and stays, marked; a new tool comes.
  file = saveTool(file, { ...editOf(file.tools.find((entry) => entry.name === 'Minitab')), validationDate: '2025-02-01' }, at, 'Diya Sharma', toolKey('Minitab', '21'))
  const second = mergeSource(file, streamSourceId, [{ name: 'Minitab', version: '21', validationDate: '2025-06-01', validityMonths: 24 }, { name: 'Python', version: '3.11' }], at)
  assert.deepEqual([second.added, second.updated, second.gone], [['Python'], ['Minitab'], ['LabVIEW']])
  const minitab = second.file.tools.find((entry) => entry.name === 'Minitab')
  assert.equal(minitab.validationDate, '2025-02-01', 'the date changed by hand is kept')
  assert.equal(minitab.validityMonths, 24, 'a value not changed by hand follows the source')
  const labview = second.file.tools.find((entry) => entry.name === 'LabVIEW')
  assert.equal(entryState(labview), 'gone', 'not in source now — still listed')
  assert.equal(labview.dueDate, '2026-11-14', 'its dates are kept')
  // Another source holding the same tool links the same entry.
  const withSource = addSource(second.file, { kind: 'windchill', name: 'Tools export', ref: 'view-1', mapping: guessMapping('windchill', [['Tool', 'Tool'], ['Version', 'Version']]) })
  const third = mergeSource(withSource, 'tools-export', [{ name: 'lab-view', version: '2020' }], at)
  assert.deepEqual(third.added, [])
  assert.equal(entryState(third.file.tools.find((entry) => entry.name === 'LabVIEW')), 'in-source', 'in a source again')
  assert.deepEqual(Object.keys(third.file.tools.find((entry) => entry.name === 'LabVIEW').sources), ['stream', 'tools-export'])
  const marked = markMerged(third.file, 'tools-export', at, 'Diya Sharma')
  assert.equal(marked.sources.find((source) => source.id === 'tools-export').mergedAt, at)
  // A removed source takes its links, not its tools.
  const removed = removeSource(marked, 'tools-export')
  assert.equal(removed.tools.length, marked.tools.length)
  assert.equal(entryState(removed.tools.find((entry) => entry.name === 'LabVIEW')), 'gone')
  assert.equal(removeSource(marked, streamSourceId), marked, 'the Tool Validations query cannot be removed')
  assert.equal(sourceProblem(marked, 'windchill', 'view-1', 'Again'), 'This one is already a source.')
})

test('TVL-06: validation date, validity period (months) and due date — an explicit due date wins; else validation date + period (TC-TVL-03)', () => {
  assert.equal(addMonths('2025-01-31', 1), '2025-02-28')
  assert.equal(addMonths('2024-01-31', 1), '2024-02-29')
  assert.equal(addMonths('2025-03-15', 24), '2027-03-15')
  assert.deepEqual(dueOf({ validationDate: '2025-03-15', validityMonths: 24, manual: [] }), { due: '2027-03-15', from: 'calculated' })
  assert.deepEqual(dueOf({ validationDate: '2025-03-15', validityMonths: 24, dueDate: '2026-01-01', manual: [] }), { due: '2026-01-01', from: 'source' })
  assert.deepEqual(dueOf({ dueDate: '2026-01-01', manual: ['dueDate'] }), { due: '2026-01-01', from: 'entered' })
  assert.deepEqual(dueOf({ validationDate: '2025-03-15', manual: [] }), { from: 'none' })
  assert.deepEqual(['24', '2 years', '2y', '18 mo', '1.5 years', '0', '700', 'soon', ''].map((value) => monthsOf(value)), [24, 24, 24, 18, 18, undefined, undefined, undefined, undefined])
  assert.equal(monthsOf('2', 'years'), 24, 'a plain number in the source unit')
  assert.deepEqual(['2026-10-05T22:30:00-05:00', '2026-10-05', '27-Oct-2026', 'Oct 27, 2026', '27.10.2026', '10/27/2026', 'next week', 42].map(dayOf), ['2026-10-06', '2026-10-05', '2026-10-27', '2026-10-27', '2026-10-27', '2026-10-27', undefined, undefined])
})

test('TVL-08, TVL-09: the expiry view — overdue first, then due within N days with days left, then no due date; later ones left out; N 1 to 730 (TC-TVL-03)', () => {
  const entry = (name, extra) => ({ key: toolKey(name, ''), name, version: '', manual: [], sources: {}, addedAt: at, ...extra })
  const tools = [entry('Later', { dueDate: '2027-06-01' }), entry('Nothing', {}), entry('Soon', { validationDate: '2025-01-10', validityMonths: 23 }), entry('Late', { dueDate: '2026-11-20' }), entry('Today', { dueDate: '2026-11-24' })]
  const rows = expiryRows(tools, '2026-11-24', 60)
  assert.deepEqual(rows.map((row) => `${row.entry.name}:${row.status}:${row.days ?? '-'}`), ['Late:overdue:-4', 'Today:due:0', 'Soon:due:16', 'Nothing:none:-'])
  assert.deepEqual(rows.map(daysLeftText), ['4 days overdue', 'Due today', '16 days left', ''])
  assert.deepEqual(expiryRows(tools, '2026-11-24', 10).map((row) => row.entry.name), ['Late', 'Today', 'Nothing'], 'a shorter window')
  assert.deepEqual(['60', 1, 730, 0, 731, 2.5, 'x', undefined].map(cleanDays), [60, 1, 730, undefined, undefined, undefined, undefined, undefined])
  const team = setTeam(parseToolValidations(null).file, 30, ['Diya.Sharma@example.com', 'nope'])
  assert.equal(team.defaultDays, 30)
  assert.deepEqual(team.owners, ['diya.sharma@example.com'])
})

test('TVL-07: each source is read with its field mapping — the guesses until it is saved (TC-TVL-04)', () => {
  const items = [
    doc(1, 'DHP\\Tool Validations\\Minitab', 'DHP\\Release 21', 'Minitab 21 Validation Plan', { 'Microsoft.VSTS.Scheduling.DueDate': '2027-01-15T00:00:00Z', 'Custom.ValidityPeriod': '2 years', 'Custom.AuthorApprovalDate': '2025-01-15T09:00:00Z' }),
    doc(2, 'DHP\\Tool Validations\\Minitab', 'DHP\\Release 21', 'Minitab 21 Validation Report', { 'Custom.AuthorApprovalDate': '2025-02-01T09:00:00Z' }),
    doc(3, 'DHP', 'DHP', 'Python 3.11 Validation Report', {}),
  ]
  const options = azureFieldOptions(items)
  assert.deepEqual(options.slice(0, 4).map(([key]) => key), ['@tool-name', '@tool-version', '@title', '@approval'])
  const guessed = guessMapping('stream', options)
  assert.deepEqual(guessed, { name: '@tool-name', version: '@tool-version', validationDate: '@approval', validityPeriod: 'Custom.ValidityPeriod', dueDate: 'Microsoft.VSTS.Scheduling.DueDate', periodUnit: 'months', confirmed: false })
  assert.deepEqual(guessMapping('azure', options.filter(([key]) => key !== 'Microsoft.VSTS.Scheduling.DueDate').concat([['Microsoft.VSTS.Scheduling.TargetDate', 'Microsoft.VSTS.Scheduling.TargetDate']])).dueDate, 'Microsoft.VSTS.Scheduling.TargetDate', 'else the Target Date')
  assert.equal(azureValue(items[0], '@tool-name'), 'Minitab')
  assert.equal(azureValue(items[0], '@tool-version'), '21')
  const inputs = inputsFromRows(items, guessed, (item, field) => azureValue(item, field))
  assert.deepEqual([...aggregate(inputs).values()], [
    { name: 'Minitab', version: '21', validationDate: '2025-02-01', validityMonths: 24, dueDate: '2027-01-15' },
    { name: 'Python', version: '3.11' },
  ])
  // A Windchill export or a page: the columns whose names fit.
  const columns = [['Number', 'Number'], ['Tool Name', 'Tool Name'], ['Version', 'Version'], ['Validation Date', 'Validation Date'], ['Validity (years)', 'Validity (years)'], ['Next Validation Due', 'Next Validation Due']]
  assert.deepEqual(guessMapping('windchill', columns), { name: 'Tool Name', version: 'Version', validationDate: 'Validation Date', validityPeriod: 'Validity (years)', dueDate: 'Next Validation Due', periodUnit: 'months', confirmed: false })
  // Saved: the mapping is used as saved, guesses no longer.
  const file = setMapping(parseToolValidations(null).file, streamSourceId, { name: '@title', periodUnit: 'years', confirmed: false })
  assert.deepEqual(mappingFor(file.sources[0], options), { name: '@title', periodUnit: 'years', confirmed: true })
})

test('TVL-10, TVL-11: tools added, corrected and removed by hand; only the Tool Owner and the co-owners, never without the roles (TC-TVL-06)', () => {
  let file = parseToolValidations(null).file
  const form = { name: 'Excel Validator', version: '2.0', validationDate: '', validityMonths: '', dueDate: '2026-12-01', notes: 'Spreadsheet checks' }
  assert.equal(editProblem(file, { ...form, name: '  ' }), 'Enter the tool name (1 to 200 characters with a letter or digit).')
  assert.equal(editProblem(file, { ...form, validityMonths: '0' }), 'The validity period is a whole number of months from 1 to 600.')
  file = saveTool(file, form, at, 'Diya Sharma')
  assert.equal(editProblem(file, { ...form, name: 'excel-validator', version: 'v2' }), 'This tool and version is already in the master list.')
  const added = file.tools[0]
  assert.deepEqual([added.name, added.version, added.dueDate, added.manual, added.notes, entryState(added), added.addedBy], ['Excel Validator', '2.0', '2026-12-01', ['dueDate'], 'Spreadsheet checks', 'manual', 'Diya Sharma'])
  assert.equal(dueOf(added).from, 'entered')
  // Emptying a field changed by hand gives it back to the sources.
  file = saveTool(file, { ...editOf(added), dueDate: '' }, at, 'Diya Sharma', added.key)
  assert.deepEqual(file.tools[0].manual, [])
  assert.equal(file.tools[0].changedBy, 'Diya Sharma')
  assert.equal(removeTool(file, added.key).tools.length, 0)
  // Rights: fail closed, the Tool Owner, the co-owners.
  const owned = setTeam(file, 60, ['co.owner@example.com'])
  assert.match(listReason({ email: 'co.owner@example.com', readOnly: true, manager: false }, owned), /access roles are not loaded/)
  assert.equal(listReason({ email: 'Co.Owner@example.com', readOnly: false, manager: false }, owned), '')
  assert.equal(listReason({ email: 'boss@example.com', readOnly: false, manager: true }, owned), '')
  assert.match(listReason({ email: 'someone@example.com', readOnly: false, manager: false }, owned), /^Only a Tool Owner .* or a co-owner of the Tool Validations list can change it\./)
  assert.match(ownersReason({ readOnly: false, manager: false }), /^Only a Tool Owner/)
  assert.equal(ownersReason({ readOnly: false, manager: true }), '')
})

test('GIT-17, TVL-02: two saves of the master list are merged — tools by tool, sources by id, co-owners as sets; the file is mapped for “Newer data in Git” (TC-TVL-01)', () => {
  const base = serializeToolValidations(parseToolValidations(fileWith([tool('Minitab', '21')], { owners: ['a@example.com'] })).file)
  const mine = serializeToolValidations(saveTool(setTeam(parseToolValidations(base).file, 45, ['a@example.com', 'b@example.com']), { name: 'JMP', version: '17', validationDate: '', validityMonths: '', dueDate: '', notes: '' }, at, 'me'))
  const theirs = serializeToolValidations(saveTool(setTeam(parseToolValidations(base).file, 60, []), { ...editOf(parseToolValidations(base).file.tools[0]), notes: 'checked' }, at, 'them', toolKey('Minitab', '21')))
  const merged = parseToolValidations(mergeToolValidationsText(base, mine, theirs, true)).file
  assert.deepEqual(merged.tools.map((entry) => `${entry.name}:${entry.notes ?? ''}`), ['JMP:', 'Minitab:checked'], 'both changes kept')
  assert.deepEqual(merged.owners, ['b@example.com'], 'a removed by them, b added by me')
  assert.equal(merged.defaultDays, 45, 'both changed: the later save wins')
  assert.equal(mergeToolValidationsText(base, mine, '{broken', true), mine, 'an unreadable file in Git is not merged into')
  assert.deepEqual(pagesOfFile('tool-validations.json', 'planning-data.json'), { pages: ['board'], loader: 'toolValidations' })
  assert.equal(fileLabel('tool-validations.json', 'planning-data.json'), 'Tool Validations master list')
})

test('TVL-14: the tabs — Master list first, Azure, then one per other source in the order added; a removed source loses its tab; the tabs remembered before open where their content is now (TC-TVL-09)', () => {
  let file = parseToolValidations(null).file
  assert.deepEqual(toolTabs(file).map((tab) => tab.label), ['Master list', 'Azure'], 'the Tool Validations query is the Azure tab, not a tab of its own')
  file = addSource(file, { kind: 'windchill', name: 'Windchill tools', ref: 'wc-1', mapping: guessMapping('windchill', []) })
  file = addSource(file, { kind: 'ondemand', name: 'Tool register', ref: 'tool-register', mapping: guessMapping('ondemand', []) })
  file = addSource(file, { kind: 'azure', name: 'Lab tools', ref: 'lab', mapping: guessMapping('azure', []) })
  const tabs = toolTabs(file)
  assert.deepEqual(tabs.map((tab) => tab.label), ['Master list', 'Azure', 'Windchill tools', 'Tool register', 'Lab tools'], 'in the order added')
  assert.deepEqual(tabs.map((tab) => tab.key), ['tool-master', 'tool-azure', 'tool-source:windchill-tools', 'tool-source:tool-register', 'tool-source:lab-tools'])
  assert.equal(tabs[3].source.ref, 'tool-register')
  const keys = tabs.map((tab) => tab.key)
  assert.equal(openToolTab('', keys), 'tool-master', 'nothing remembered: the Master list')
  assert.equal(openToolTab('tool-source:tool-register', keys), 'tool-source:tool-register', 'the last tab, remembered')
  for (const [old, now] of [['main', 'tool-azure'], ['raw', 'tool-azure'], ['tool-expiry', 'tool-master'], ['tool-master', 'tool-master']]) assert.equal(openToolTab(old, keys), now, `the old tab ${old}`)
  const fewer = toolTabs(removeSource(file, 'tool-register')).map((tab) => tab.key)
  assert.deepEqual(fewer, ['tool-master', 'tool-azure', 'tool-source:windchill-tools', 'tool-source:lab-tools'], 'the removed source loses its tab')
  assert.equal(openToolTab('tool-source:tool-register', fewer), 'tool-master', 'a remembered tab that is gone: the Master list')
  assert.equal(openToolTab('something-else', fewer), 'tool-master')
})
