import test from 'node:test'
import assert from 'node:assert/strict'
import { conqPage, mergeOnDemandText, parseInsightFilterSetup, parseOnDemandPage, serializeOnDemandPage } from '../src/onDemand.ts'
import { aggregate, blankInsight, chartData, drillRows } from '../src/onDemandInsights.ts'
import { cleanSetup, emptyChoice, fieldText, filterRowColumns, insightsViewerKey, isFiltered, narrowInsightRows, offeredYears, passesField, readChoice, resolveFilterSetup, scopeText } from '../src/insightFilters.ts'

// OND-50…OND-56: the filter row of the Insights tab (tests/insight-filters.test.mjs).
const columns = [
  { id: 'c1', name: 'Topic', type: 'text', options: [], required: false },
  { id: 'c2', name: 'Cost', type: 'number', options: [], required: false },
  { id: 'c3', name: 'Found on', type: 'date', options: [], required: false },
  { id: 'c4', name: 'Category', type: 'dropdown', options: ['Scrap', 'Rework', 'Complaint'], required: false },
  { id: 'c5', name: 'Sites', type: 'multi', options: ['Berlin', 'Leeds', 'Lyon'], required: false },
  { id: 'c6', name: 'Notes', type: 'longtext', options: [], required: false },
  { id: 'c7', name: 'Shipped', type: 'date', options: [], required: false },
]
const rows = [
  { id: 'r1', key: 'CONQ-260101-AAA2', seq: 1, cells: { c1: 'Label wrong', c2: '100', c3: '2026-01-10', c4: 'Rework', c5: ['Berlin', 'Lyon'], c7: '2026-02-01' } },
  { id: 'r2', key: 'CONQ-260101-AAA3', seq: 2, cells: { c1: 'Late', c2: '50', c3: '2026-02-20', c4: 'Scrap', c5: ['Leeds'], c7: '2026-05-01' } },
  { id: 'r3', key: 'CONQ-260101-AAA4', seq: 3, cells: { c1: 'Seal LABEL', c2: '30', c3: '2026-05-05', c4: 'Rework', c5: ['Berlin'] } },
  { id: 'r4', key: 'CONQ-260101-AAA5', seq: 4, cells: { c1: 'Odd', c3: 'soon', c4: 'Retired option' } },
  { id: 'r5', key: 'CONQ-260101-AAA6', seq: 5, cells: { c2: '20', c3: '2025-11-03', c4: 'Complaint', c5: ['Lyon'] } },
  { id: 'r6', key: 'CONQ-260101-AAA7', seq: 6, cells: { c2: '400', c3: '2026-03-30', c4: 'Scrap' } },
]
const page = (extra = {}) => ({ ...conqPage(), columns: structuredClone(columns), rows: structuredClone(rows), ...extra })
const ids = (list) => list.map((row) => row.id)
const choose = (period = {}, fields = {}) => ({ period: { years: [], quarters: [], months: [], ...period }, fields })

test('OND-52, OND-56: insightFilters in the page file — optional, written only when set, validated on read (shape, repeats, max 6), merged as one entry; a page without it is unchanged (TC-OND-41)', () => {
  // A page without the field is written exactly as before and reads back without it.
  const plain = page({ insights: [{ ...blankInsight(page(), 'i1'), title: 'Cost by category', category: 'c4' }] })
  const text = serializeOnDemandPage(plain)
  assert.equal(text.includes('insightFilters'), false)
  assert.equal('insightFilters' in parseOnDemandPage(text), false)
  // Written when set, read back the same.
  const set = { ...plain, insightFilters: { period: 'c3', fields: ['c4', 'c1'] } }
  const written = serializeOnDemandPage(set)
  assert.deepEqual(JSON.parse(written).insightFilters, { period: 'c3', fields: ['c4', 'c1'] })
  assert.deepEqual(parseOnDemandPage(written).insightFilters, { period: 'c3', fields: ['c4', 'c1'] })
  // Validated: bad ids, repeats, the period again as a field and more than 6 dropped; nothing left = no field.
  assert.deepEqual(parseInsightFilterSetup({ period: 'c3', fields: ['c4', 'c4', 'c3', 'bad id', 7, 'a', 'b', 'c', 'd', 'e', 'f'] }), { period: 'c3', fields: ['c4', 'a', 'b', 'c', 'd', 'e'] })
  assert.deepEqual(parseInsightFilterSetup({ fields: 'c4' }), undefined)
  assert.equal(parseInsightFilterSetup([]), undefined)
  assert.equal(parseInsightFilterSetup({ period: '../x', fields: [] }), undefined)
  assert.deepEqual(parseInsightFilterSetup({ period: 'c3' }), { period: 'c3', fields: [] })
  // An unknown column is kept in the file (a merge cannot lose it) and left out of the row with a note.
  const odd = parseOnDemandPage(JSON.stringify({ ...JSON.parse(text), insightFilters: { period: 'c1', fields: ['gone', 'c6', 'c4'] } }))
  const resolved = resolveFilterSetup(odd)
  assert.equal(resolved.period, undefined)
  assert.deepEqual(resolved.fields.map((column) => column.id), ['c4'])
  assert.equal(resolved.dropped.length, 3)
  assert.match(resolved.dropped[0], /“Topic” is now a Text column: the period needs a Date column/)
  assert.match(resolved.dropped[1], /no longer on the page \(removed\)/)
  assert.match(resolved.dropped[2], /“Notes” is now a Long text column, which cannot filter/)
  // GIT-17: one entry, the later save wins where both changed it; a change on one side only is kept.
  const base = serializeOnDemandPage(plain)
  const mine = serializeOnDemandPage({ ...plain, insightFilters: { period: 'c3', fields: ['c4'] } })
  const theirs = serializeOnDemandPage({ ...plain, insightFilters: { fields: ['c5'] } })
  assert.deepEqual(JSON.parse(mergeOnDemandText(base, mine, theirs, true)).insightFilters, { period: 'c3', fields: ['c4'] })
  assert.deepEqual(JSON.parse(mergeOnDemandText(base, mine, theirs, false)).insightFilters, { fields: ['c5'] })
  assert.deepEqual(JSON.parse(mergeOnDemandText(base, mine, base, false)).insightFilters, { period: 'c3', fields: ['c4'] })
  const theirsRow = serializeOnDemandPage({ ...plain, rows: [...plain.rows, { id: 'r9', cells: { c1: 'New' } }] })
  const merged = JSON.parse(mergeOnDemandText(base, mine, theirsRow, true))
  assert.deepEqual(merged.insightFilters, { period: 'c3', fields: ['c4'] }, 'a row saved by someone else keeps the filter row')
  assert.equal(merged.rows.length, 7)
  // Removing the setup removes the field.
  assert.equal(JSON.parse(mergeOnDemandText(mine, base, mine, true)).insightFilters, undefined)
  // The pop-up's save: no repeats, not the period again, at most 6, nothing = no filter row.
  assert.deepEqual(cleanSetup('c3', ['c4', 'c3', 'c4', 'c1']), { period: 'c3', fields: ['c4', 'c1'] })
  assert.equal(cleanSetup('', []), undefined)
  assert.deepEqual(filterRowColumns(page()).map((column) => column.id), ['c1', 'c2', 'c3', 'c4', 'c5', 'c7'], 'Long text cannot filter')
})

test('OND-54, OND-56: the filter row narrows the rows — period (current year by default, rows without a date left out) and field filters together; no setup changes nothing (TC-OND-42)', () => {
  // No setup: the very same page, every chart exactly as before.
  const none = page()
  const untouched = narrowInsightRows(none, resolveFilterSetup(none), choose({ years: [2026] }, { c4: { values: ['Scrap'] } }), 2026)
  assert.equal(untouched.page, none)
  assert.equal(untouched.active, false)
  const insight = { ...blankInsight(none, 'i1'), title: 'T', category: 'c4', measure: 'sum', value: 'c2' }
  assert.deepEqual(aggregate(untouched.page, insight), aggregate(page(), insight))

  const p = page({ insightFilters: { period: 'c3', fields: ['c4', 'c5', 'c1', 'c2', 'c7'] } })
  const setup = resolveFilterSetup(p)
  // Nothing chosen: the current year — r4 has no date (left out and counted), r5 is in 2025.
  let narrowed = narrowInsightRows(p, setup, emptyChoice(), 2026)
  assert.deepEqual(ids(narrowed.page.rows), ['r1', 'r2', 'r3', 'r6'])
  assert.equal(narrowed.noDate, 1)
  assert.equal(scopeText(setup, emptyChoice(), narrowed, 2026), 'Period on Found on: 2026 (whole year) · 4 of 6 rows counted (1 without a date in Found on left out).')
  // A quarter and a value: Q1 2026 and Scrap.
  const q1Scrap = choose({ quarters: ['2026-Q1'] }, { c4: { values: ['Scrap'] } })
  narrowed = narrowInsightRows(p, setup, q1Scrap, 2026)
  assert.deepEqual(ids(narrowed.page.rows), ['r2', 'r6'])
  assert.equal(scopeText(setup, q1Scrap, narrowed, 2026), 'Period on Found on: Q1 2026 · Category: Scrap · 2 of 6 rows counted (1 without a date in Found on left out).')
  // Two years; "(none)" of a Dropdown (empty or not in the list); a Multi-select by any of its values.
  assert.deepEqual(ids(narrowInsightRows(p, setup, choose({ years: [2025, 2026] }, { c5: { values: ['Lyon'] } }), 2026).page.rows), ['r1', 'r5'])
  assert.deepEqual(ids(narrowInsightRows({ ...p, insightFilters: { fields: ['c4'] } }, resolveFilterSetup({ ...p, insightFilters: { fields: ['c4'] } }), choose({}, { c4: { values: [''] } }), 2026).page.rows), ['r4'])
  // Text contains (any case), Number from / to (rows without a number fail), a Date from / to month.
  assert.deepEqual(ids(narrowInsightRows(p, setup, choose({}, { c1: { text: 'label' } }), 2026).page.rows), ['r1', 'r3'])
  assert.deepEqual(ids(narrowInsightRows(p, setup, choose({}, { c2: { min: 50, max: 150 } }), 2026).page.rows), ['r1', 'r2'])
  assert.deepEqual(ids(narrowInsightRows(p, setup, choose({}, { c2: { min: 200 } }), 2026).page.rows), ['r6'])
  assert.deepEqual(ids(narrowInsightRows(p, setup, choose({}, { c7: { from: '2026-04' } }), 2026).page.rows), ['r2'])
  // A choice for a column that is not in the row is ignored.
  assert.deepEqual(ids(narrowInsightRows(p, setup, choose({}, { c6: { text: 'x' } }), 2026).page.rows), ['r1', 'r2', 'r3', 'r6'])
  // Field filters without a period: every date counts.
  const noPeriod = { ...p, insightFilters: { fields: ['c4'] } }
  assert.deepEqual(ids(narrowInsightRows(noPeriod, resolveFilterSetup(noPeriod), emptyChoice(), 2026).page.rows), ['r1', 'r2', 'r3', 'r4', 'r5', 'r6'])
  assert.equal(scopeText(resolveFilterSetup(noPeriod), emptyChoice(), narrowInsightRows(noPeriod, resolveFilterSetup(noPeriod), emptyChoice(), 2026), 2026), 'No filter · 6 of 6 rows counted.')
  // Words of each kind; the years offered.
  assert.equal(fieldText(columns[1], { min: 10, max: 20 }), 'Cost: 10 – 20')
  assert.equal(fieldText(columns[6], { to: '2026-06' }), 'Shipped: up to Jun 2026')
  assert.equal(fieldText(columns[0], { text: ' seal ' }), 'Topic contains “seal”')
  assert.equal(fieldText(columns[3], { values: ['', 'Scrap'] }), 'Category: (none), Scrap')
  assert.deepEqual(offeredYears(p, setup, choose({ years: [2024] }), 2026), [2024, 2025, 2026])
  assert.equal(passesField(columns[3], undefined, rows[0]), true)
})

test('OND-54: the row works on top of each chart’s own filters; the drill-down and the Table view count the same rows (TC-OND-43)', () => {
  const p = page({ insightFilters: { period: 'c3', fields: ['c4'] } })
  const setup = resolveFilterSetup(p)
  const narrowed = narrowInsightRows(p, setup, choose({ quarters: ['2026-Q1'] }), 2026)
  // A chart filtered on its own to Rework and Complaint, by Category: Q1 2026 keeps r1, r2, r6, of which only r1 is Rework.
  const insight = { ...blankInsight(p, 'i1'), title: 'T', category: 'c4', measure: 'sum', value: 'c2', filters: [{ column: 'c4', values: ['Rework', 'Complaint'] }] }
  const data = chartData(narrowed.page, insight)
  assert.deepEqual(data.categories.map((bucket) => bucket.label), ['Rework'])
  assert.deepEqual(data.values.map((row) => row[0]), [100])
  assert.equal(data.rows.all, 3, 'the rows the filter row keeps')
  assert.equal(data.rows.matched, 1, 'of which the chart’s own filter keeps one')
  assert.deepEqual(ids(drillRows(narrowed.page, insight, data, 0)), ['r1'])
  // Without the row the chart counts every year as before.
  const all = chartData(p, insight)
  assert.deepEqual(all.categories.map((bucket) => bucket.label), ['Rework', 'Complaint'])
  assert.deepEqual(all.values.map((row) => row[0]), [130, 20])
  assert.deepEqual(ids(drillRows(p, insight, all, 0)), ['r1', 'r3'])
})

test('OND-55: the viewer’s choice read back — per page key, unknown shapes dropped, an older period kept; Reset clears it (TC-OND-44)', () => {
  assert.equal(insightsViewerKey('conq'), 'insights-page:conq')
  assert.deepEqual(readChoice(null), emptyChoice())
  assert.deepEqual(readChoice('x'), emptyChoice())
  const read = readChoice({ period: { years: [2026], quarters: ['2026-Q1', 'bad'], months: [] }, fields: { c4: { values: ['Scrap', 3, 'Scrap'] }, c3: { from: '2026-13', to: '2026-06' }, c2: { min: 5, max: 'x' }, c1: { text: 'seal' }, 'bad id': { values: ['x'] }, c9: {} } })
  assert.deepEqual(read, { period: { years: [2026], quarters: ['2026-Q1'], months: [] }, fields: { c4: { values: ['Scrap'] }, c3: { to: '2026-06' }, c2: { min: 5 }, c1: { text: 'seal' } } })
  assert.equal(isFiltered(read), true)
  assert.equal(isFiltered(emptyChoice()), false)
  assert.equal(isFiltered(choose({}, { c1: { text: '  ' } })), false)
})
