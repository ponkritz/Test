import test from 'node:test'
import assert from 'node:assert/strict'
import { blockChartId, builtInCharts, chartSizeKey, insightChartId, needsGrid, pairFactory, parseChartSize, resolveChartSize, sizeFromOptions, sizeText, snapHeight, snapWidth, spanWidth, stackFactory, stepSize, withSizeOptions } from '../src/chartSize.ts'
import { cleanOptions, parseInsights, serializeOnDemandPage, parseOnDemandPage } from '../src/onDemand.ts'
import { emptyViews, parseViews, serializeViews, withDefaultEntry, withDefaults } from '../src/personalViews.ts'
import { autoAxisTitles } from '../src/onDemandInsights.ts'
import { fitLabel } from '../src/chartUtils.ts'

// CHT-15…CHT-24 Chart sizes (presets, the v10 values, precedence, validation, grid placement, the handle's keyboard and
// snapping), the label fitting behind KB-83 and the owner's axis titles.

test('CHT-15, CHT-16: the presets — ⅓ / ½ / ⅔ / Full of a 6-column grid and Small / Medium / Large; v10 half and full read as before (TC-CHT-13)', () => {
  assert.deepEqual(sizeFromOptions({ size: 'half' }), { width: 'half' })
  assert.deepEqual(sizeFromOptions({ size: 'full' }), { width: 'full' })
  assert.deepEqual(sizeFromOptions({ size: 'twothirds', height: 'large' }), { width: 'twothirds', height: 'large' })
  assert.equal(sizeFromOptions(undefined), undefined, 'nothing set: the factory size')
  assert.equal(sizeText({ width: 'twothirds', height: 'large' }), 'width ⅔, height Large')
  // The grid: 6 columns of a 1200 px grid with 18 px gaps; each preset's width.
  assert.equal(Math.round(spanWidth(3, 1200, 18)), 591)
  assert.equal(Math.round(spanWidth(6, 1200, 18)), 1200)
  // The options: a factory value is left out, so a chart nobody resized is written as before.
  assert.equal(withSizeOptions(undefined, { width: 'half', height: 'medium' }), undefined)
  assert.deepEqual(withSizeOptions({ top: 5 }, { width: 'third', height: 'small' }), { top: 5, size: 'third', height: 'small' })
  assert.deepEqual(withSizeOptions({ top: 5, size: 'full', height: 'large' }, { width: 'half', height: 'medium' }), { top: 5 })
  assert.deepEqual(withSizeOptions(undefined, { width: 'half', height: 'medium' }, pairFactory, true), { size: 'half' }, 'a width picked in the pop-up is written as chosen (as v10)')
})

test('CHT-22, CHT-15, CHT-16: the size options are validated when read — unknown widths and heights dropped, no height for a KPI or a summary table (TC-CHT-14)', () => {
  assert.deepEqual(cleanOptions('bar', 'count', { size: 'third', height: 'large' }), { size: 'third', height: 'large' })
  assert.deepEqual(cleanOptions('bar', 'count', { size: 'huge', height: 'medium' }), undefined, 'unknown width, medium is the default')
  assert.deepEqual(cleanOptions('table', 'count', { size: 'twothirds', height: 'small' }), { size: 'twothirds' })
  assert.deepEqual(cleanOptions('kpi', 'count', { size: 'third', height: 'large' }), { size: 'third' })
  // A page with sizes keeps them through a save; one without is written byte for byte as before.
  const page = { schema: 1, kind: 'on-demand-page', id: 'p', name: 'P', description: '', keyPrefix: 'P', columns: [{ id: 'c1', name: 'Topic', type: 'text', options: [], required: false }], rows: [],
    insights: [{ id: 'i1', title: 'T', type: 'bar', category: 'c1', second: '', measure: 'count', value: '', filters: [], sort: 'value', options: { size: 'third', height: 'small' } }] }
  const again = parseOnDemandPage(serializeOnDemandPage(page), 'p')
  assert.deepEqual(again.insights[0].options, { size: 'third', height: 'small' })
  const [plain] = parseInsights([{ id: 'i2', title: 'U', type: 'bar', category: 'c1', measure: 'count', sort: 'value' }], page.columns)
  assert.equal(plain.options, undefined)
  // v10's own reading (its cleanOptions kept only 'half' and 'full'): ⅓ and ⅔ are dropped there — LIM-36.
  const v10 = (raw) => raw.size === 'half' || raw.size === 'full' ? { size: raw.size } : undefined
  assert.equal(v10({ size: 'third', height: 'large' }), undefined, 'an older app shows the chart at the default size')
})

test('CHT-18, CHT-19: precedence — the viewer’s own size, then the owner’s (or shared) default, then the factory size; stored sizes validated (TC-CHT-15)', () => {
  assert.deepEqual(resolveChartSize({ factory: pairFactory }), { size: pairFactory, source: 'factory', base: pairFactory })
  const owner = resolveChartSize({ owner: { width: 'twothirds' }, factory: pairFactory })
  assert.deepEqual([owner.size, owner.source], [{ width: 'twothirds', height: 'medium' }, 'owner'])
  const mine = resolveChartSize({ viewer: { width: 'full', height: 'large' }, owner: { width: 'twothirds' }, factory: pairFactory })
  assert.deepEqual([mine.size, mine.source, mine.base], [{ width: 'full', height: 'large' }, 'viewer', { width: 'twothirds', height: 'medium' }])
  assert.deepEqual(resolveChartSize({ viewer: { height: 'small' }, factory: stackFactory }).size, { width: 'full', height: 'small' }, 'field by field')
  assert.deepEqual(parseChartSize({ width: 'third', height: 'giant', extra: 1 }), { width: 'third' })
  assert.equal(parseChartSize('full'), undefined); assert.equal(parseChartSize([]), undefined); assert.equal(parseChartSize({ width: 3 }), undefined)
  // Ids and their personal-views keys (the key pattern of personal views, at most 80 characters).
  assert.equal(chartSizeKey(insightChartId('conq', 'i1')), 'chart-size:ondemand:conq:i1')
  assert.equal(chartSizeKey(blockChartId('cost-dashboard', 'b1')), 'chart-size:dashboard:cost-dashboard:b1')
  assert.equal(chartSizeKey(builtInCharts.epicMix), 'chart-size:overview:epic-mix-by-month')
  assert.equal(chartSizeKey(insightChartId('a'.repeat(40), 'i'.repeat(14))).length <= 80, true)
  assert.equal(chartSizeKey('bad id!'), '')
  // The shared default of a built-in chart (Save size for everyone) is one entry of the views defaults; my own wins.
  const key = chartSizeKey(builtInCharts.overrun)
  const defaults = parseViews(serializeViews(withDefaultEntry(emptyViews(), key, { width: 'half', height: 'medium' })))
  assert.deepEqual(parseChartSize(defaults.filters[key]), { width: 'half', height: 'medium' })
  const merged = withDefaults({ ...emptyViews(), filters: { [key]: { width: 'third' } } }, defaults)
  assert.deepEqual(merged.filters[key], { width: 'third' })
  assert.equal(parseChartSize(parseViews(serializeViews(withDefaultEntry(defaults, key, null))).filters[key]), undefined, 'null: the factory size again')
})

test('CHT-20: grid placement — the 6-column grid only once a chart takes a width the old layout did not have (TC-CHT-15)', () => {
  assert.equal(needsGrid(['half', 'full', 'half']), false, 'half and full: the layout of v10')
  assert.equal(needsGrid(['half', 'third']), true)
  assert.equal(needsGrid(['full', 'full'], stackFactory), false, 'built-in charts: full width as before')
  assert.equal(needsGrid(['full', 'half'], stackFactory), true)
})

test('CHT-21: the handle — arrow keys step the presets (clamped), a drag snaps to the nearest preset (TC-CHT-16)', () => {
  const at = { width: 'half', height: 'medium' }
  assert.deepEqual(stepSize(at, 'ArrowRight'), { width: 'twothirds', height: 'medium' })
  assert.deepEqual(stepSize(at, 'ArrowLeft'), { width: 'third', height: 'medium' })
  assert.deepEqual(stepSize(at, 'ArrowDown'), { width: 'half', height: 'large' })
  assert.deepEqual(stepSize(at, 'ArrowUp'), { width: 'half', height: 'small' })
  assert.deepEqual(stepSize({ width: 'full', height: 'large' }, 'ArrowRight'), { width: 'full', height: 'large' }, 'clamped')
  assert.deepEqual(stepSize({ width: 'third', height: 'small' }, 'ArrowUp'), { width: 'third', height: 'small' })
  assert.equal(stepSize(at, 'Tab'), null)
  // Snapping in a 1200 px grid: ⅓ ≈ 388, ½ ≈ 591, ⅔ ≈ 794, Full 1200.
  assert.equal(snapWidth(380, 1200, 18), 'third')
  assert.equal(snapWidth(650, 1200, 18), 'half')
  assert.equal(snapWidth(820, 1200, 18), 'twothirds')
  assert.equal(snapWidth(1100, 1200, 18), 'full')
  assert.equal(snapWidth(5000, 1200, 18), 'full')
  // Heights: a 300 px Medium chart dragged 160 px down is Large (450), 70 px up Small (225).
  assert.equal(snapHeight('medium', 300, 160), 'large')
  assert.equal(snapHeight('medium', 300, -70), 'small')
  assert.equal(snapHeight('medium', 300, 20), 'medium')
  assert.equal(snapHeight('large', 450, -130), 'medium')
})

test('CHT-23 (KB-83): a label is wrapped by words into its space, cut with "…" only when it does not fit (TC-CHT-17)', () => {
  assert.deepEqual(fitLabel('Scrap', 14), { lines: ['Scrap'], cut: false }, 'a short label is as before')
  assert.deepEqual(fitLabel('Supplier delivered the wrong seal', 14), { lines: ['Supplier', 'delivered the…'], cut: true })
  assert.deepEqual(fitLabel('Supplier delivered the wrong seal', 14, 3), { lines: ['Supplier', 'delivered the', 'wrong seal'], cut: false })
  assert.deepEqual(fitLabel('Antidisestablishmentarianism', 10), { lines: ['Antidises…'], cut: true }, 'a word longer than the line is cut')
  assert.deepEqual(fitLabel('Sum of Cost (EUR)', 40, 1), { lines: ['Sum of Cost (EUR)'], cut: false })
  assert.deepEqual(fitLabel('A very long axis title that runs past the plot', 20, 1), { lines: ['A very long axis…'], cut: true })
  assert.deepEqual(fitLabel('  ', 10), { lines: [''], cut: false })
  for (const [text, chars, lines] of [['Rework at the Berlin site after a complaint', 12, 2], ['x'.repeat(80), 9, 3], ['a b c d e f g h', 3, 2]]) {
    const fit = fitLabel(text, chars, lines)
    assert.ok(fit.lines.length <= lines && fit.lines.every((line) => line.length <= chars), `${text}: ${JSON.stringify(fit)}`)
  }
})

test('CHT-24: the owner’s axis titles — validated, written only when set, only for charts with axes; the automatic ones as before (TC-CHT-18)', () => {
  assert.deepEqual(cleanOptions('bar', 'count', { xTitle: '  Cost   in EUR ', yTitle: '' }), { xTitle: 'Cost in EUR' })
  assert.deepEqual(cleanOptions('line', 'sum', { xTitle: 'x'.repeat(90), yTitle: 7 }), { xTitle: 'x'.repeat(60) })
  assert.equal(cleanOptions('pie', 'count', { xTitle: 'X', yTitle: 'Y' }), undefined, 'a pie has no axes')
  assert.equal(cleanOptions('kpi', 'count', { xTitle: 'X' }), undefined)
  assert.equal(cleanOptions('table', 'count', { yTitle: 'Y' }), undefined)
  const page = { columns: [{ id: 'c1', name: 'Category', type: 'dropdown', options: [] }, { id: 'c3', name: 'Cost (EUR)', type: 'number', options: [] }, { id: 'c4', name: 'Found on', type: 'date', options: [] }] }
  const base = { id: 'i', title: 'T', category: 'c1', second: '', measure: 'sum', value: 'c3', filters: [], sort: 'value' }
  assert.deepEqual(autoAxisTitles(page, { ...base, type: 'bar' }), { x: 'Sum of Cost (EUR)', y: 'Category' })
  assert.deepEqual(autoAxisTitles(page, { ...base, type: 'bar', options: { orientation: 'vertical' } }), { x: 'Category', y: 'Sum of Cost (EUR)' })
  assert.deepEqual(autoAxisTitles(page, { ...base, type: 'line', category: 'c4' }), { x: 'Month of Found on', y: 'Sum of Cost (EUR)' })
})
