import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'
import { cachedRoles, navigate, openPage, startApp, text } from './helpers.mjs'
import { fakeGitHub } from './fakeGitHub.mjs'

// Tool Validations from two queries (TVL-19…TVL-22; TC-TVL-18, UAT): the Tool Owner adds the Tools query and the
// Signed documents query as two connections of the stream in Stream mapping, sees which is which in the Tool
// Validations queries panel, keeps Changed Date as the completion date and then picks another date column; the
// Tool Validations page (Azure tab) shows Completed and Supported for the month with the tools, both queries' Source
// data and the document not linked to a tool; Pulse Check counts the same. GitHub (e2e/fakeGitHub.mjs) and Azure DevOps
// are faked with synthetic rows; nothing leaves the machine. Every step waits for what it needs, never for a time.
let app
before(async () => { app = await startApp() })
after(async () => { await app.stop() })

// Optional screenshots (E2E_SHOTS=<folder>); the assertions never depend on them.
const shots = process.env.E2E_SHOTS
const shot = async (page, name, locator) => { if (!shots) return; mkdirSync(shots, { recursive: true }); if (locator) await locator.screenshot({ path: `${shots}/${name}.png` }); else await page.screenshot({ path: `${shots}/${name}.png`, fullPage: false }) }

const setup = () => {
  localStorage.setItem('demand-planning-git-storage-v1', JSON.stringify({ owner: 'example', repo: 'storage', branch: 'main', path: 'planning-data.json' }))
  localStorage.setItem('demand-planning-git-token-v1', 'test-token')
  localStorage.setItem('demand-planning-servers-v1', JSON.stringify([{ serverUrl: '', organization: 'example' }]))
  localStorage.setItem('demand-planning-server-pats-v1', JSON.stringify({ 'https://dev.azure.com/example': 'test-pat' }))
}
const base = (id, type, title, extra) => ({ id, rev: 1, fields: { 'System.Id': id, 'System.Title': title, 'System.WorkItemType': type, 'System.State': 'Active', 'System.AreaPath': 'DHP', 'System.IterationPath': 'DHP', 'System.TeamProject': 'DHP', ...extra } })
// Tools (one row per tool): Changed Date and a Validation Completed date column.
const tools = [
  base(501, 'Tool', 'Minitab 21', { 'System.ChangedDate': '2026-10-05T10:00:00Z', 'Custom.ValidationCompleted': '2026-09-20T00:00:00Z' }),
  base(502, 'Tool', 'LabVIEW 2020', { 'System.ChangedDate': '2026-11-02T10:00:00Z', 'Custom.ValidationCompleted': '2026-10-12T00:00:00Z' }),
  base(503, 'Tool', 'JMP 17', { 'System.ChangedDate': '2026-10-20T10:00:00Z' }),
]
const signed = (name, role, date) => ({ 'Custom.ApproverName1': name, 'Custom.ApproverFunction1': role, 'Custom.ApproverApprovalDate1': date })
// Signed documents (Parent = the tool): Minitab's plan signed by QA in October; JMP's report signed by its author in
// October and by QE in September; a report whose Parent is no tool of the Tools query.
const documents = [
  base(601, 'Document', 'Minitab 21 Validation Plan', { 'System.Parent': 501, 'System.ChangedDate': '2026-10-14T10:00:00Z', ...signed('Ana Costa', 'QA', '2026-10-14T09:00:00Z') }),
  base(602, 'Document', 'JMP 17 Validation Report', { 'System.Parent': 503, 'System.ChangedDate': '2026-10-21T10:00:00Z', ...signed('Bo Li', 'Author', '2026-10-21T09:00:00Z'), 'Custom.ApproverName2': 'Cy Dahl', 'Custom.ApproverFunction2': 'QE', 'Custom.ApproverApprovalDate2': '2026-09-05T09:00:00Z' }),
  base(603, 'Document', 'Orphan Test Report', { 'System.Parent': 999, 'System.ChangedDate': '2026-10-03T10:00:00Z', ...signed('Ana Costa', 'QA', '2026-10-03T09:00:00Z') }),
]
const fieldNames = [['Custom.ValidationCompleted', 'Validation Completed'], ['System.Parent', 'Parent'], ['Custom.ApproverName1', 'ApproverName1'], ['Custom.ApproverFunction1', 'ApproverFunction1'], ['Custom.ApproverApprovalDate1', 'ApproverApprovalDate1'], ['Custom.ApproverName2', 'ApproverName2'], ['Custom.ApproverFunction2', 'ApproverFunction2'], ['Custom.ApproverApprovalDate2', 'ApproverApprovalDate2']]
const toolsQuery = "SELECT [System.Id], [System.Title], [System.ChangedDate], [Custom.ValidationCompleted] FROM WorkItems WHERE [System.WorkItemType] = 'Tool'"
const documentsQuery = "SELECT [System.Id], [System.Title], [System.Parent], [Custom.ApproverName1], [Custom.ApproverFunction1], [Custom.ApproverApprovalDate1], [Custom.ApproverName2], [Custom.ApproverFunction2], [Custom.ApproverApprovalDate2] FROM WorkItems WHERE [System.WorkItemType] = 'Document'"

async function fakeAzure(context) {
  const reads = []
  await context.route('https://dev.azure.com/**', (route) => {
    const request = route.request(), url = new URL(request.url())
    const json = (body) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
    // Read only: only the query, batch and field-list endpoints are answered; nothing is written.
    reads.push(`${request.method()} ${url.pathname}`)
    if (url.pathname.endsWith('/_apis/wit/wiql')) {
      const query = JSON.parse(request.postData() ?? '{}').query ?? ''
      const rows = /'Tool'/.test(query) ? tools : /'Document'/.test(query) ? documents : []
      return json({ workItems: /\[System\.Id\] > 0\b/.test(query) ? rows.map(({ id }) => ({ id })) : [] })
    }
    if (url.pathname.endsWith('/_apis/wit/workitemsbatch')) { const ids = JSON.parse(request.postData() ?? '{}').ids ?? []; return json({ value: [...tools, ...documents].filter((entry) => ids.includes(entry.id)) }) }
    if (url.pathname.endsWith('/_apis/wit/fields')) return json({ value: fieldNames.map(([referenceName, name]) => ({ referenceName, name })) })
    return json({ value: [] })
  })
  return reads
}
const until = async (check, what) => { for (const end = Date.now() + 30000; Date.now() < end;) { const value = check(); if (value) return value; await new Promise((resolve) => setTimeout(resolve, 50)) } throw new Error(`Timed out waiting for ${what}`) }
const panelTitled = (page, title) => page.locator('.panel').filter({ has: page.locator('h2', { hasText: new RegExp(`^${title}`) }) })
const releaseDetails = (page) => page.locator('.sidebar nav .nav-section', { hasText: 'RELEASE DETAILS' })
const tile = (page, label) => page.locator('.release-counts article').filter({ has: page.locator('span', { hasText: new RegExp(`^${label}$`) }) }).locator('strong')

async function addQuery(page, rowName, query) {
  const mapping = page.locator('.connection-panel', { hasText: 'STEP 2' })
  await mapping.locator('tbody tr').filter({ has: page.locator('td:first-child strong', { hasText: new RegExp(`^${rowName}$`) }) }).getByRole('button', { name: 'Add query' }).click()
  const form = page.getByRole('dialog', { name: 'New connection' })
  await form.locator('label', { hasText: /^Server/ }).locator('select').selectOption('https://dev.azure.com/example')
  await form.locator('label', { hasText: /^Project/ }).locator('input').fill('DHP')
  await form.locator('label.query-field textarea').fill(query)
  const name = await form.getByLabel('Name', { exact: true }).inputValue()
  await form.getByRole('button', { name: 'Save and refresh data' }).click()
  await form.waitFor({ state: 'detached' })
  return name
}

test('TC-TVL-18: the Tool Owner sets up the Tools and the Signed documents queries, picks the completion date and sees Completed and Supported on the Tool Validations page and in Pulse Check', async () => {
  const gh = fakeGitHub({ files: { 'access.json': cachedRoles('Tool Owner') } })
  const { page, context, errors } = await openPage(app, { init: setup, width: 1440, height: 1000 })
  page.addLocatorHandler(page.getByRole('dialog', { name: /Could not fetch from Azure DevOps/ }), async (dialog) => { await dialog.getByRole('button', { name: /Close|Not now|Dismiss/ }).first().click() })
  await context.route('https://api.github.com/**', gh.route)
  const reads = await fakeAzure(context)
  await page.reload()
  await page.locator('.sidebar nav').waitFor()

  // TVL-19: Stream mapping — Add query on the Tool Validations row, then on its Signed documents row.
  await navigate(page, /Streams$/)
  assert.equal(await addQuery(page, 'Tool Validations', toolsQuery), 'Tool Validations')
  assert.equal(await addQuery(page, 'Tool Validations · Signed documents', documentsQuery), 'Tool Validations Signed documents')
  const panel = panelTitled(page, 'Tool Validations queries')
  const roleOf = (name) => panel.locator('tbody tr', { hasText: name }).locator('td').nth(1)
  await panel.locator('tbody tr', { hasText: 'Tool Validations Signed documents' }).locator('td').nth(2).getByText('3').waitFor()
  await panel.locator('tbody tr').filter({ has: page.locator('strong', { hasText: /^Tool Validations$/ }) }).locator('td').nth(2).getByText('3').waitFor()
  assert.equal(await text(roleOf('Tool Validations Signed documents')), 'Signed documents')
  assert.equal(await text(panel.locator('tbody tr').filter({ has: page.locator('strong', { hasText: /^Tool Validations$/ }) }).locator('td').nth(1)), 'Tools')
  assert.match(await text(panel), /How they are told apart: found by its name \(documents, signed\)\./)
  // TVL-20: Changed Date (last updated date) by default, with the note that it moves on any edit.
  const field = panel.getByLabel('Completion date field')
  assert.equal(await field.inputValue(), 'System.ChangedDate')
  assert.match(await text(panel), /Changed Date is the last update of the tool’s work item: it moves on any edit/)
  assert.deepEqual(await field.locator('option').allInnerTexts(), ['Changed Date (last updated date) — default', 'Validation Completed (Custom.ValidationCompleted)'])
  const mappingRows = page.locator('.connection-panel', { hasText: 'STEP 2' })
  await shot(page, 'stream-mapping-two-queries', mappingRows)
  await shot(page, 'tool-validations-queries-panel', panel)

  // TVL-21, TVL-22: October 2026 on the Tool Validations page, Azure tab — Completed by Changed Date: Minitab and JMP;
  // Supported: Minitab (a QA signature in October; JMP's October signature is its author's).
  await page.locator('header.topbar input[type=month]').fill('2026-10')
  await releaseDetails(page).locator('button:not(.nav-missing)', { hasText: 'Tool Validations' }).click()
  await page.locator('.page-loading').waitFor({ state: 'detached' })
  const tabs = page.getByRole('tablist', { name: 'Result' })
  // TVL-23: the counts are on the Master list tab only, as Validations.
  await tabs.getByRole('tab', { name: 'Master list' }).click()
  assert.deepEqual([await text(tile(page, 'Validations in October 2026')), await text(tile(page, 'Completed validations')), await text(tile(page, 'Supported validations'))], ['2', '2', '1'])
  await tabs.getByRole('tab', { name: 'Azure' }).click()
  assert.equal(await page.locator('.release-counts').count(), 0, 'TVL-23: no counts on the Azure tab')
  const releases = panelTitled(page, 'Releases')
  await releases.locator('tbody tr').first().waitFor()
  const rows = (await releases.locator('tbody tr').allInnerTexts()).map((row) => row.replace(/\s+/g, ' ').trim())
  assert.equal(rows.length, 2)
  assert.match(rows[0], /^JMP 17 503 Completed .* — 0 —$/)
  assert.match(rows[1], /^Minitab 21 501 Completed .* Supported 1 Ana Costa \(QA\)/)
  assert.match(await text(panelTitled(page, 'Source data · Tools query')), /3 rows/)
  assert.match(await text(panelTitled(page, 'Source data · Signed documents query')), /3 rows/)
  const unlinked = panelTitled(page, 'Not linked to a tool')
  assert.match(await text(unlinked), /1 document · 1 with a Quality signature in October 2026 · not counted/)
  assert.match(await text(unlinked.locator('tbody tr').first()), /#603 Orphan Test Report 999 October 2026/)

  // TVL-20: the Tool Owner picks Validation Completed as the completion date: Completed is LabVIEW only.
  await navigate(page, /Streams$/)
  await panelTitled(page, 'Tool Validations queries').getByLabel('Completion date field').selectOption('Custom.ValidationCompleted')
  await panelTitled(page, 'Tool Validations queries').getByText(/Changed Date is the last update/).waitFor({ state: 'detached' })
  // Saved in the shared settings, with the planning data in the data repository, for everyone (Save on the bar).
  await page.locator('.connection-panel', { hasText: 'STEP 2' }).locator('.git-bar-dirty').getByRole('button', { name: /^Save to/ }).click()
  const saved = await until(() => { const data = gh.read('planning-data.json'); return data && JSON.parse(data).releaseSourceSettings?.toolValidations?.completionField ? JSON.parse(data) : null }, 'the completion field saved to the data repository')
  assert.deepEqual(saved.releaseSourceSettings.toolValidations, { completionField: 'Custom.ValidationCompleted' })
  await releaseDetails(page).locator('button:not(.nav-missing)', { hasText: 'Tool Validations' }).click()
  await page.locator('.page-loading').waitFor({ state: 'detached' })
  await tabs.getByRole('tab', { name: 'Azure' }).click()
  await releases.locator('tbody tr', { hasText: 'LabVIEW 2020' }).waitFor()
  await tabs.getByRole('tab', { name: 'Master list' }).click()
  assert.deepEqual([await text(tile(page, 'Validations in October 2026')), await text(tile(page, 'Completed validations')), await text(tile(page, 'Supported validations'))], ['2', '1', '1'])
  assert.match(await text(page.locator('.release-counts')), /Completed validations 1 Tools whose Validation Completed is in the month/)
  await tabs.getByRole('tab', { name: 'Azure' }).click()
  await shot(page, 'tool-validations-azure-tab')

  // TVL-22: Pulse Check counts the same — Current month releases · October 2026.
  await navigate(page, 'Pulse Check')
  await page.getByRole('tab', { name: /^Current month releases ·/ }).click()
  const quadrant = page.locator('.release-quadrant').filter({ has: page.locator('h2', { hasText: /^Tool Validations$/ }) })
  await quadrant.waitFor()
  assert.match(await text(quadrant.locator('.quadrant-counts')), /^1 completed 1 supported$/)
  assert.match(await text(page.locator('.supported-summary')), /Tool Validations \[1\] : Minitab 21/)
  assert.match(await text(page.locator('.release-summary').first()), /Tool Validations \[1\] : LabVIEW 2020/)
  await shot(page, 'pulse-check-tool-validations')

  // Read only: Azure DevOps was only queried (WIQL, batch reads, field lists).
  assert.ok(reads.every((entry) => /^(POST|GET) .*\/_apis\/wit\/(wiql|workitemsbatch|fields)/.test(entry) || entry.startsWith('GET ')), reads.join('\n'))
  assert.deepEqual(errors, [])
  await context.close()
})
