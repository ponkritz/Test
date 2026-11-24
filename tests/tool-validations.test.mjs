import test from 'node:test'
import assert from 'node:assert/strict'
import { addMonths, addSource, aggregate, azureFieldOptions, azureValue, cleanDays, dayOf, daysLeftText, dueOf, editOf, editProblem, emptyFile, entryState, expiryRows, guessMapping, inputsFromRows, listReason, mappingFor, markMerged, mergeSource, mergeToolValidationsText, monthsOf, nameKey, openToolTab, toolTabs, ownersReason, parseToolValidations, removeSource, removeTool, saveTool, serializeToolValidations, setMapping, setTeam, sourceProblem, streamSourceId, toolKey, toolValidationsFile, addTab, addTabReason, customTabKey, customToolTabs, maxCustomTabs, moveTab, removeTab, renameTab, tabNameProblem } from '../src/toolValidations.ts'
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

test('TVL-14: the tabs — Expiry list first, Master list, Azure, then one per other source in the order added, Setup last; a removed source loses its tab; the tabs remembered before open where their content is now — unknown ones on the Expiry list; room for later tabs before Setup (TC-TVL-09)', () => {
  let file = parseToolValidations(null).file
  assert.deepEqual(toolTabs(file).map((tab) => tab.label), ['Expiry list', 'Master list', 'Azure', 'Setup'], 'the Tool Validations query is the Azure tab, not a tab of its own; Setup is always there')
  file = addSource(file, { kind: 'windchill', name: 'Windchill tools', ref: 'wc-1', mapping: guessMapping('windchill', []) })
  file = addSource(file, { kind: 'ondemand', name: 'Tool register', ref: 'tool-register', mapping: guessMapping('ondemand', []) })
  file = addSource(file, { kind: 'azure', name: 'Lab tools', ref: 'lab', mapping: guessMapping('azure', []) })
  const tabs = toolTabs(file)
  assert.deepEqual(tabs.map((tab) => tab.label), ['Expiry list', 'Master list', 'Azure', 'Windchill tools', 'Tool register', 'Lab tools', 'Setup'], 'in the order added, Setup last')
  assert.deepEqual(tabs.map((tab) => tab.key), ['tool-expiry', 'tool-master', 'tool-azure', 'tool-source:windchill-tools', 'tool-source:tool-register', 'tool-source:lab-tools', 'tool-setup'])
  assert.equal(tabs[4].source.ref, 'tool-register')
  const keys = tabs.map((tab) => tab.key)
  assert.equal(openToolTab('', keys), 'tool-expiry', 'nothing remembered: the Expiry list')
  assert.equal(openToolTab('tool-source:tool-register', keys), 'tool-source:tool-register', 'the last tab, remembered')
  assert.equal(openToolTab('tool-setup', keys), 'tool-setup', 'Setup, remembered')
  for (const [old, now] of [['main', 'tool-azure'], ['raw', 'tool-azure'], ['tool-expiry', 'tool-expiry'], ['tool-master', 'tool-master'], ['tool-setup', 'tool-setup']]) assert.equal(openToolTab(old, keys), now, `the old tab ${old}`)
  const fewer = toolTabs(removeSource(file, 'tool-register')).map((tab) => tab.key)
  assert.deepEqual(fewer, ['tool-expiry', 'tool-master', 'tool-azure', 'tool-source:windchill-tools', 'tool-source:lab-tools', 'tool-setup'], 'the removed source loses its tab')
  assert.equal(openToolTab('tool-source:tool-register', fewer), 'tool-expiry', 'a remembered tab that is gone: the Expiry list')
  assert.equal(openToolTab('something-else', fewer), 'tool-expiry')
  assert.deepEqual(toolTabs(file, [{ key: 'tool-page:checklist', label: 'Checklist' }]).map((tab) => tab.key).slice(-3), ['tool-source:lab-tools', 'tool-page:checklist', 'tool-setup'], 'later tabs go after the sources, before Setup')
  assert.equal(toolTabs(file).filter((tab) => tab.label === 'Setup').length, 1, 'one Setup tab')
})

test('TVL-15, TVL-16: the owners’ tabs in tool-validations.json — validated strictly (page id, name, page type; twice refused), written only when there are some; after the source tabs and before Setup, in their order; add, rename, move ← →, remove (TC-TVL-10)', () => {
  const tab = (pageId, name, kind = 'table') => ({ pageId, name, kind })
  const read = parseToolValidations(fileWith([], { tabs: [tab('checklist', 'Checklist'), tab('tool-dash', 'Tool dashboard', 'dashboard'), tab('Bad Id', 'Bad'), tab('notes', '', 'table'), tab('notes', 'Notes', 'release'), tab('checklist', 'Again'), tab('other', 'checklist', 'table-insights'), 'nope'] }))
  assert.deepEqual(read.file.tabs, [tab('checklist', 'Checklist'), tab('tool-dash', 'Tool dashboard', 'dashboard')])
  assert.deepEqual(read.refused.map((entry) => `${entry.name}: ${entry.reason}`), [
    'Tab “Bad”: its page id is missing or not lower-case letters, digits and hyphens',
    'Tab “”: its name is missing or longer than 40 characters',
    'Tab “Notes”: unknown page type “release”',
    'Tab “Again”: the page “checklist” is a tab twice',
    'Tab “checklist”: another tab has this name',
    'Tab “?”: not an object',
  ])
  assert.ok(!serializeToolValidations(parseToolValidations(fileWith([])).file).includes('"tabs"'), 'a file without tabs is written as before')
  const text = serializeToolValidations(read.file)
  assert.deepEqual(JSON.parse(text).tabs, [tab('checklist', 'Checklist'), tab('tool-dash', 'Tool dashboard', 'dashboard')], 'written in their order')
  assert.deepEqual(parseToolValidations(text).file.tabs, read.file.tabs, 'round trip')
  // TVL-15: the tab row — Expiry list · Master list · Azure · source tabs · the owners' tabs · Setup.
  let file = addSource(read.file, { kind: 'windchill', name: 'Windchill tools', ref: 'wc-1', mapping: guessMapping('windchill', []) })
  assert.deepEqual(toolTabs(file, customToolTabs(file)).map((entry) => entry.label), ['Expiry list', 'Master list', 'Azure', 'Windchill tools', 'Checklist', 'Tool dashboard', 'Setup'])
  assert.equal(customToolTabs(file)[1].key, customTabKey('tool-dash'))
  assert.equal(customToolTabs(file)[1].custom.kind, 'dashboard')
  assert.equal(openToolTab(customTabKey('tool-dash'), toolTabs(file, customToolTabs(file)).map((entry) => entry.key)), 'tool-tab:tool-dash', 'a remembered owners’ tab opens')
  assert.equal(openToolTab(customTabKey('gone'), toolTabs(file, customToolTabs(file)).map((entry) => entry.key)), 'tool-expiry', 'a removed one opens the Expiry list')
  // Names: 1 to 40 characters, not the name of another tab of the page (fixed tabs, sources, owners' tabs; case ignored).
  assert.equal(tabNameProblem(file, 'Open items'), '')
  for (const name of ['expiry list', 'SETUP', 'Azure', 'windchill tools', 'checklist']) assert.match(tabNameProblem(file, name), /already has a tab named/, name)
  assert.equal(tabNameProblem(file, 'Checklist', 'checklist'), '', 'its own name when renamed')
  assert.match(tabNameProblem(file, ' '), /Enter a tab name of up to 40 characters/)
  assert.match(tabNameProblem(file, 'x'.repeat(41)), /up to 40/)
  // Add (last), rename, move, remove.
  file = addTab(file, tab('open-items', '  Open   items '))
  assert.deepEqual(file.tabs.map((entry) => entry.name), ['Checklist', 'Tool dashboard', 'Open items'])
  file = moveTab(file, 'open-items', -1)
  assert.deepEqual(file.tabs.map((entry) => entry.pageId), ['checklist', 'open-items', 'tool-dash'])
  assert.equal(moveTab(file, 'checklist', -1), file, 'the first cannot move left')
  assert.equal(moveTab(file, 'tool-dash', 1), file, 'the last cannot move right')
  file = renameTab(file, 'checklist', 'Release checklist')
  assert.equal(file.tabs[0].name, 'Release checklist')
  file = removeTab(file, 'open-items')
  assert.deepEqual(file.tabs.map((entry) => entry.pageId), ['checklist', 'tool-dash'])
  assert.equal(addTabReason(file), '')
  let full = file
  for (let index = file.tabs.length; index < maxCustomTabs; index++) full = addTab(full, tab(`t${index}`, `Tab ${index}`))
  assert.match(addTabReason(full), /^At most 10 tabs/)
  const eleven = JSON.parse(serializeToolValidations(full)); eleven.tabs.push(tab('t-more', 'One more'))
  assert.match(parseToolValidations(JSON.stringify(eleven)).refused[0].reason, /more than 10 tabs/)
})

test('GIT-17, TVL-16: two saves of the tabs merged — by page id, a rename and an add both kept, a removal kept, the order of the save that moved them (TC-TVL-10)', () => {
  const tab = (pageId, name, kind = 'table') => ({ pageId, name, kind })
  const base = serializeToolValidations(parseToolValidations(fileWith([], { tabs: [tab('a', 'A'), tab('b', 'B'), tab('c', 'C')] })).file)
  const file = parseToolValidations(base).file
  // Mine: B renamed and D added; theirs: C removed and A moved after B.
  const mine = serializeToolValidations(addTab(renameTab(file, 'b', 'Bee'), tab('d', 'D', 'dashboard')))
  const theirs = serializeToolValidations(moveTab(removeTab(file, 'c'), 'a', 1))
  const merged = parseToolValidations(mergeToolValidationsText(base, mine, theirs, false)).file
  assert.deepEqual(merged.tabs.map((entry) => `${entry.pageId}:${entry.name}`), ['b:Bee', 'a:A', 'd:D'], 'theirs is later: their order; my rename and my new tab kept (after the others); their removal kept')
  const mineLater = parseToolValidations(mergeToolValidationsText(base, mine, theirs, true)).file
  assert.deepEqual(mineLater.tabs.map((entry) => entry.pageId), ['a', 'b', 'd'], 'mine is later: my order; C stays removed')
  // Only one side touched the tabs: its change is taken, the other side's tools kept.
  const tools = serializeToolValidations(saveTool(file, { name: 'JMP', version: '17', validationDate: '', validityMonths: '', dueDate: '', notes: '' }, at, 'me'))
  const both = parseToolValidations(mergeToolValidationsText(base, tools, theirs, true)).file
  assert.deepEqual([both.tabs.map((entry) => entry.pageId), both.tools.map((entry) => entry.name)], [['b', 'a'], ['JMP']])
  // A file read without tabs merged with a save that added one: the added tab stays.
  const older = serializeToolValidations(parseToolValidations(fileWith([])).file)
  const added = serializeToolValidations(addTab(parseToolValidations(older).file, tab('x', 'X')))
  assert.deepEqual(parseToolValidations(mergeToolValidationsText(older, older, added, true)).file.tabs.map((entry) => entry.pageId), ['x'])
})
