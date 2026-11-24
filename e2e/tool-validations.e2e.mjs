import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'
import { navigate, openPage, rolesFile, startApp, text } from './helpers.mjs'

// Tool Validations master list (TVL-01…TVL-14): the Tool Owner maps the Tool Validations query; its tools are added to
// the master list in Git when it is fetched; the page opens on its Expiry list tab, which lists what is overdue, due within
// the viewer's window and without a due date (the owners set the team default there too); the Master list tab next to
// it holds only the master list; the Azure tab holds the query's releases and rows; the Setup tab, last, holds the
// sources and the team settings; a tool is added by hand, the team default is changed (Expiry list, then Setup) and a manual list (a Table page) is added as a source (Setup → Sources) — its own tab — merged in from
// that tab and removed again, with its tab (TC-TVL-07, UAT; TC-TVL-09). A Team Member reads it all, Setup included, with
// the buttons disabled and the reason shown, and keeps a window of their own (TC-TVL-05, TC-TVL-06).
// GitHub and Azure DevOps are mocked; nothing leaves the machine.
let app
before(async () => { app = await startApp() })
after(async () => { await app.stop() })

// Optional screenshots (E2E_SHOTS=<folder>); the assertions never depend on them.
const shots = process.env.E2E_SHOTS
const shot = async (page, name) => { if (!shots) return; mkdirSync(shots, { recursive: true }); await page.screenshot({ path: `${shots}/${name}.png`, fullPage: false }) }

const day = (offset) => { const at = new Date(); at.setUTCHours(0, 0, 0, 0); at.setUTCDate(at.getUTCDate() + offset); return at.toISOString().slice(0, 10) }
const yearsBack = (date, years) => `${Number(date.slice(0, 4)) - years}${date.slice(4)}`
const setup = () => {
  localStorage.setItem('demand-planning-git-storage-v1', JSON.stringify({ owner: 'example', repo: 'storage', branch: 'main', path: 'planning-data.json' }))
  localStorage.setItem('demand-planning-git-token-v1', 'test-token')
  localStorage.setItem('demand-planning-servers-v1', JSON.stringify([{ serverUrl: '', organization: 'example' }]))
  localStorage.setItem('demand-planning-server-pats-v1', JSON.stringify({ 'https://dev.azure.com/example': 'test-pat' }))
}
// The viewer of the second scenario has no PAT: nothing is fetched, the master list is shown as Git has it. This browser
// tab remembers the Master list tab ("tool-master"): it opens the Master list (TVL-14).
const setupReader = () => {
  localStorage.setItem('demand-planning-git-storage-v1', JSON.stringify({ owner: 'example', repo: 'storage', branch: 'main', path: 'planning-data.json' }))
  localStorage.setItem('demand-planning-git-token-v1', 'test-token')
  sessionStorage.setItem('demand-planning-result-tab-v1', JSON.stringify({ 'azure:Tool Validations': 'tool-master' }))
}
// Synthetic validation documents: Minitab 21 (two documents, approved two years before 30 days from now, valid 24 months:
// due in 30 days), LabVIEW 2020 (due date 10 days ago: overdue), Python 3.11 (no dates), JMP 17 (valid 36 months from a
// month ago: due later).
const documents = () => [
  { id: 201, title: 'Minitab 21 Validation Plan', area: 'DHP\\Tool Validations\\Minitab', iteration: 'DHP\\Release 21', approved: `${yearsBack(day(28), 2)}T09:00:00Z`, period: '24' },
  { id: 202, title: 'Minitab 21 Validation Report', area: 'DHP\\Tool Validations\\Minitab', iteration: 'DHP\\Release 21', approved: `${yearsBack(day(30), 2)}T09:00:00Z`, period: '24' },
  { id: 203, title: 'LabVIEW 2020 Validation Report', area: 'DHP\\Tool Validations\\LabVIEW', iteration: 'DHP\\Release 2020', due: `${day(-10)}T00:00:00Z` },
  { id: 204, title: 'Python 3.11 Validation Report', area: 'DHP\\Tool Validations', iteration: 'DHP' },
  { id: 205, title: 'JMP 17 Validation Report', area: 'DHP\\Tool Validations\\JMP', iteration: 'DHP\\Release 17', approved: `${day(-30)}T09:00:00Z`, period: '3 years' },
].map((entry) => ({ id: entry.id, rev: 1, fields: { 'System.Id': entry.id, 'System.Title': entry.title, 'System.WorkItemType': 'Document', 'System.State': 'Approved', 'System.AreaPath': entry.area, 'System.IterationPath': entry.iteration, 'System.TeamProject': 'DHP', ...(entry.approved ? { 'Custom.AuthorApprovalDate': entry.approved } : {}), ...(entry.period ? { 'Custom.ValidityPeriod': entry.period } : {}), ...(entry.due ? { 'Microsoft.VSTS.Scheduling.DueDate': entry.due } : {}) } }))
// A manual list kept as a Table page of the app (On-Demand): LabVIEW (also in the query) and Polyspace (only here).
const toolRegister = () => JSON.stringify({ schema: 1, kind: 'on-demand-page', id: 'tool-register', name: 'Tool register', description: '', keyPrefix: 'TR', insights: [],
  columns: [{ id: 'c-tool', name: 'Tool', type: 'text', options: [], required: true }, { id: 'c-version', name: 'Version', type: 'text', options: [], required: false }, { id: 'c-due', name: 'Due date', type: 'date', options: [], required: false }],
  rows: [{ id: 'r-1', cells: { 'c-tool': 'LabVIEW', 'c-version': '2020' } }, { id: 'r-2', cells: { 'c-tool': 'Polyspace', 'c-version': 'R2024a', 'c-due': day(20) } }] })

async function mock(context, files, role = 'Tool Owner') {
  const writes = []
  await context.route('https://dev.azure.com/**', (route) => {
    const request = route.request(), url = new URL(request.url())
    const json = (body) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
    const all = documents()
    if (url.pathname.endsWith('/_apis/wit/wiql')) { const query = JSON.parse(request.postData() ?? '{}').query ?? ''; return json({ workItems: /\[System\.Id\] > 0\b/.test(query) ? all.map(({ id }) => ({ id })) : [] }) }
    if (url.pathname.endsWith('/_apis/wit/workitemsbatch')) { const ids = JSON.parse(request.postData() ?? '{}').ids ?? []; return json({ value: all.filter((entry) => ids.includes(entry.id)) }) }
    if (url.pathname.endsWith('/_apis/wit/fields')) return json({ value: [{ referenceName: 'Custom.AuthorApprovalDate', name: 'Author Approval Date' }, { referenceName: 'Custom.ValidityPeriod', name: 'Validity Period' }, { referenceName: 'Microsoft.VSTS.Scheduling.DueDate', name: 'Due Date' }] })
    return json({ value: [] })
  })
  await context.route('https://api.github.com/**', (route) => {
    const request = route.request(), url = new URL(request.url())
    const json = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
    if (url.pathname === '/repos/example/storage') return json({ permissions: { push: true } })
    if (url.pathname === '/repos/example/storage/commits') return json([])
    // GIT-25: the branch exists (as in a real repository), so a 404 of a file means it is missing.
    if (url.pathname === '/repos/example/storage/branches/main') return json({ name: 'main' })
    const match = /^\/repos\/example\/storage\/contents\/(.*)$/.exec(url.pathname)
    if (!match) return json({ message: 'Not Found' }, 404)
    const path = decodeURIComponent(match[1])
    if (request.method() === 'PUT') {
      if (path === '.demand-planning-write-check') return json({ message: 'Invalid request' }, 422)
      const body = JSON.parse(request.postData())
      files[path] = Buffer.from(body.content, 'base64').toString()
      writes.push({ path, message: body.message, data: JSON.parse(files[path]) })
      return json({ content: { sha: `v${writes.length}` }, commit: { html_url: `https://github.com/example/storage/commit/v${writes.length}` } })
    }
    if (path === 'access.json') return json(rolesFile(role))
    const folder = Object.keys(files).filter((name) => name.startsWith(`${path}/`))
    if (files[path] == null && folder.length) return json(folder.map((name) => ({ type: 'file', name: name.slice(path.length + 1), path: name, sha: `s${files[name].length}` })))
    if (files[path] != null) return json({ type: 'file', encoding: 'base64', content: Buffer.from(files[path]).toString('base64'), sha: `s${files[path].length}` })
    return json({ message: 'Not Found' }, 404)
  })
  return writes
}
const releaseDetails = (page) => page.locator('.sidebar nav .nav-section', { hasText: 'RELEASE DETAILS' })
const panelTitled = (page, title) => page.locator('.panel').filter({ has: page.locator('h2', { hasText: new RegExp(`^${title}`) }) })
const until = async (check, what) => { for (const end = Date.now() + 30000; Date.now() < end;) { const value = check(); if (value) return value; await new Promise((resolve) => setTimeout(resolve, 50)) } throw new Error(`Timed out waiting for ${what}`) }
const savedList = (writes, test = () => true) => [...writes].reverse().find((entry) => entry.path === 'tool-validations.json' && test(entry))
const tabLabels = async (tabs) => (await tabs.getByRole('tab').allInnerTexts()).map((label) => label.trim())
const selectedTab = async (tabs) => (await tabs.locator('[role=tab][aria-selected=true]').innerText()).trim()
const rowsOf = async (panel) => (await panel.locator('tbody tr').allInnerTexts()).map((row) => row.replace(/\s+/g, ' ').trim())
// The azure-views.json the first scenario shares, so the second one opens with the same Tool Validations connection.
let sharedViews = null

test('TC-TVL-07: the Tool Owner maps the Tool Validations query — its tools land in the master list in Git, Validation expiry lists overdue, due soon and no due date; a tool added by hand, the team default changed and a manual list merged in', async () => {
  const files = { 'on-demand/tool-register.json': toolRegister() }
  const { page, context, errors } = await openPage(app, { init: setup })
  page.addLocatorHandler(page.getByRole('dialog', { name: /Could not fetch from Azure DevOps/ }), async (dialog) => { await dialog.getByRole('button', { name: /Close|Not now|Dismiss/ }).first().click() })
  const writes = await mock(context, files)
  await page.reload()
  await page.locator('.sidebar nav').waitFor()

  // Stream mapping → Tool Validations → Add query: the connection, fetched at once.
  await navigate(page, /Streams$/)
  const mapping = page.locator('.connection-panel', { hasText: 'STEP 2' })
  const row = mapping.locator('tbody tr', { hasText: 'Tool Validations' })
  await row.getByRole('button', { name: 'Add query' }).click()
  const form = page.getByRole('dialog', { name: 'New connection' })
  assert.equal(await form.getByLabel('Name', { exact: true }).inputValue(), 'Tool Validations')
  await form.locator('label', { hasText: /^Server/ }).locator('select').selectOption('https://dev.azure.com/example')
  await form.locator('label', { hasText: /^Project/ }).locator('input').fill('DHP')
  await form.locator('label.query-field textarea').fill("SELECT [System.Id], [System.Title], [System.AreaPath], [System.IterationPath], [Custom.AuthorApprovalDate], [Custom.ValidityPeriod], [Microsoft.VSTS.Scheduling.DueDate] FROM WorkItems WHERE [System.WorkItemType] = 'Document'")
  await form.getByRole('button', { name: 'Save and refresh data' }).click()
  await form.waitFor({ state: 'detached' })
  sharedViews = await until(() => files['azure-views.json'], 'the shared connection setup')

  // TVL-04: the fetch adds its tools to the master list in Git (the Tool Owner may edit it), with the guessed mapping.
  const first = await until(() => savedList(writes), 'the master list saved to Git')
  assert.match(first.message, /^Tool Validations: 4 new, 0 updated, 0 no longer in the source from the Tool Validations query \[saved \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z\]/)
  assert.deepEqual(first.data.tools.map((entry) => `${entry.name} ${entry.version}`), ['JMP 17', 'LabVIEW 2020', 'Minitab 21', 'Python 3.11'])
  const minitab = first.data.tools.find((entry) => entry.name === 'Minitab')
  assert.deepEqual([minitab.validationDate, minitab.validityMonths, minitab.sources], [yearsBack(day(30), 2), 24, { stream: { inSource: true } }], 'the latest approval of its two documents and the period')
  assert.equal(first.data.tools.find((entry) => entry.name === 'LabVIEW').dueDate, day(-10))
  assert.deepEqual([first.data.schema, first.data.kind, first.data.defaultDays, first.data.sources[0].mapping.confirmed], [1, 'tool-validations', 60, false])

  // Release Details → Tool Validations: TVL-14 the tabs Expiry list | Master list | Azure | Setup; the Expiry list opens
  // first — the tiles on top (the team default of 60 days), then the expiry table; no master list, no Sources or Team
  // settings there.
  await releaseDetails(page).locator('button:not(.nav-missing)', { hasText: 'Tool Validations' }).click()
  await page.locator('.page-loading').waitFor({ state: 'detached' })
  const tabs = page.getByRole('tablist', { name: 'Result' })
  await tabs.waitFor()
  assert.deepEqual(await tabLabels(tabs), ['Expiry list', 'Master list', 'Azure', 'Setup'])
  assert.equal(await selectedTab(tabs), 'Expiry list', 'the Expiry list opens first')
  const expiry = panelTitled(page, 'Validation expiry')
  const master = panelTitled(page, 'Master list')
  await expiry.locator('tbody tr').first().waitFor()
  assert.equal(await page.getByRole('tabpanel').locator('.panel').count(), 1, 'only the expiry table on the Expiry list tab')
  assert.equal(await master.count(), 0, 'the master list is not on this tab')
  assert.deepEqual([await panelTitled(page, 'Sources').count(), await panelTitled(page, 'Team settings').count()], [0, 0], 'Sources and Team settings are on Setup')
  assert.equal(await page.getByLabel('Days ahead').count(), 1, 'the window N on the Expiry list tab')
  assert.ok((await page.locator('.tool-expiry-counts').boundingBox()).y < (await expiry.boundingBox()).y, 'the tiles on top')
  assert.match(await text(page.locator('.tool-expiry-counts')), /Overdue 1 .*Due in the next 60 days 1 .*No due date 1/)
  const listed = await rowsOf(expiry)
  assert.equal(listed.length, 3, 'JMP is due later: not listed')
  assert.match(listed[0], /^Overdue LabVIEW 2020 .* 10 days overdue/)
  assert.match(listed[1], /^Due soon Minitab 21 .* 30 days left/)
  assert.match(listed[2], /^No due date Python 3\.11 No due date/)
  await shot(page, 'expiry')
  // KB-93: the window, the filter row and the table's first column line up with the panel's title.
  const left = (locator) => locator.first().evaluate((element) => Math.round(element.getBoundingClientRect().left))
  const lineUp = async (panel) => {
    const title = await left(panel.locator('.panel-heading h2'))
    const edges = [await left(panel.locator('.data-table-toolbar > *')), await left(panel.locator('.segmented')), await left(panel.locator('thead th').first().locator('span, button').first())]
    assert.deepEqual(edges, edges.map(() => title), `the left edges line up with the title at ${title}px`)
  }
  await lineUp(expiry)
  assert.equal(await left(page.locator('.tool-expiry-window')), await left(expiry.locator('.panel-heading h2')), 'the window N lines up with the title')

  // TVL-09: my own window — 10 days drops Minitab; Use the team default brings it back.
  const window = page.getByLabel('Days ahead')
  await window.fill('10')
  await page.locator('.tool-expiry-counts').getByText('Due in the next 10 days').waitFor()
  assert.equal((await rowsOf(expiry)).length, 2)
  assert.match(await text(expiry), /Your own window \(10 days\), kept for you; the team default is 60 days\./)
  await page.getByRole('button', { name: 'Use the team default (60)' }).click()
  await page.locator('.tool-expiry-counts').getByText('Due in the next 60 days').waitFor()
  assert.equal((await rowsOf(expiry)).length, 3)
  assert.ok(await page.getByRole('button', { name: 'Set 60 days as team default' }).isDisabled(), 'already the team default')
  // TVL-09: the Tool Owner makes the window shown the team default right here — saved to Git as Team settings saves it.
  await window.fill('45')
  await page.getByRole('button', { name: 'Set 45 days as team default' }).click()
  const fromExpiry = await until(() => savedList(writes, (entry) => entry.data.defaultDays === 45), 'the team default set on the Expiry list')
  assert.match(fromExpiry.message, /^Tool Validations: team default 45 days, 0 co-owners/)
  await expiry.getByText('The team default: 45 days.').waitFor()
  assert.ok(await page.getByRole('button', { name: 'Use the team default (45)' }).isDisabled(), 'the window is the team default now, not my own')

  // TVL-10, TVL-14: the Master list tab — only the master list: no tiles, no expiry table, no window N.
  await tabs.getByRole('tab', { name: 'Master list' }).click()
  await master.locator('tbody tr').first().waitFor()
  assert.equal(await page.getByRole('tabpanel').locator('.panel').count(), 1, 'only the master list on the Master list tab')
  assert.deepEqual([await expiry.count(), await page.locator('.tool-expiry-counts').count(), await page.getByLabel('Days ahead').count()], [0, 0, 0], 'no expiry table, no tiles, no window N on the Master list tab')
  await lineUp(master)

  // TVL-14: the Azure tab — the query's releases of the month and its rows (Source data), no expiry view.
  await tabs.getByRole('tab', { name: 'Azure' }).click()
  await panelTitled(page, 'Source data').locator('tbody tr').first().waitFor()
  assert.equal(await text(panelTitled(page, 'Source data').locator('.record-count').first()), '5 rows')
  assert.equal(await panelTitled(page, 'Releases').count(), 1, 'the Releases table on the Azure tab')
  assert.equal(await page.getByLabel('Days ahead').count(), 0)
  await shot(page, 'azure')

  // TVL-10: ＋ Add tool… by hand, due in 5 days.
  await tabs.getByRole('tab', { name: 'Master list' }).click()
  await master.locator('tbody tr').first().waitFor()
  assert.equal((await rowsOf(master)).length, 4)
  assert.equal(await master.locator('.write-blocked').count(), 0, 'nothing blocked for the Tool Owner')
  await master.getByRole('button', { name: '＋ Add tool…' }).click()
  const add = page.getByRole('dialog', { name: 'Add a tool' })
  await add.getByLabel('Tool name').fill('Excel Validator')
  await add.getByLabel('Version (optional)').fill('2.0')
  await add.getByLabel('Due date (optional)').fill(day(5))
  await add.getByRole('button', { name: 'Add tool' }).click()
  await add.waitFor({ state: 'detached' })
  const byHand = await until(() => savedList(writes, (entry) => entry.data.tools.some((tool) => tool.name === 'Excel Validator')), 'the tool added by hand')
  assert.deepEqual(byHand.data.tools.find((entry) => entry.name === 'Excel Validator'), { ...byHand.data.tools.find((entry) => entry.name === 'Excel Validator'), version: '2.0', dueDate: day(5), manual: ['dueDate'], sources: {} })
  await master.locator('tbody tr', { hasText: 'Excel Validator' }).getByText('Added by hand').waitFor()

  // TVL-09, TVL-14: the team default on the Setup tab (Sources and Team settings; no expiry view, no master list), saved in Git.
  await tabs.getByRole('tab', { name: 'Setup' }).click()
  await panelTitled(page, 'Team settings').waitFor()
  assert.equal(await panelTitled(page, 'Sources').count(), 1, 'Sources on Setup')
  assert.deepEqual([await panelTitled(page, 'Master list').count(), await page.getByLabel('Days ahead').count()], [0, 0])
  assert.ok((await panelTitled(page, 'Sources').boundingBox()).y < (await panelTitled(page, 'Team settings').boundingBox()).y, 'Sources, then Team settings')
  await shot(page, 'setup')
  await panelTitled(page, 'Team settings').getByRole('button', { name: 'Edit…' }).click()
  const team = page.getByRole('dialog', { name: 'Team settings' })
  // KB-91: the co-owners list closes — with Escape (the pop-up stays open), with its own button, and with a click elsewhere in the pop-up.
  const ownersButton = team.getByRole('button', { name: /^Co-owners of the list/ })
  const ownersList = team.getByRole('listbox', { name: /^Co-owners of the list/ })
  await ownersButton.click()
  await ownersList.waitFor()
  await page.keyboard.press('Escape')
  await ownersList.waitFor({ state: 'detached' })
  assert.equal(await team.isVisible(), true, 'Escape closes only the list, not the pop-up')
  assert.equal(await ownersButton.evaluate((element) => element === document.activeElement), true, 'the focus is back on the list button')
  await ownersButton.click()
  await ownersList.waitFor()
  await ownersButton.click()
  await ownersList.waitFor({ state: 'detached' })
  await ownersButton.click()
  await ownersList.waitFor()
  await team.getByLabel('Expiry window, team default (days)').click()
  await ownersList.waitFor({ state: 'detached' })
  await team.getByLabel('Expiry window, team default (days)').fill('30')
  await team.getByRole('button', { name: 'Save to Git' }).click()
  await team.waitFor({ state: 'detached' })
  assert.equal((await until(() => savedList(writes, (entry) => entry.data.defaultDays === 30), 'the team default')).data.defaultDays, 30)

  // TVL-05: a manual list (Table page) as a source (Setup → Sources), merged into the master list after a preview.
  const sources = panelTitled(page, 'Sources')
  await sources.getByRole('button', { name: '＋ Add source…' }).click()
  const addSource = page.getByRole('dialog', { name: 'Add a source' })
  await addSource.locator('label', { hasText: /^Kind/ }).locator('select').selectOption('ondemand')
  await addSource.locator('label', { hasText: /^Table page/ }).locator('select').selectOption('tool-register')
  assert.equal(await addSource.locator('label', { hasText: /^Name/ }).locator('input').inputValue(), 'Tool register')
  await addSource.getByRole('button', { name: 'Add source' }).click()
  await addSource.waitFor({ state: 'detached' })
  const register = sources.locator('tbody tr', { hasText: 'Tool register' })
  await register.waitFor()
  assert.match(await text(register), /Guessed Tool name: Tool · Version: Version · Due date: Due date/)
  // TVL-14: the source has its own tab, after Azure and before Setup — its rows as mapped, with Edit mapping… and Merge
  // into master list….
  await tabs.getByRole('tab', { name: 'Tool register' }).waitFor()
  assert.deepEqual(await tabLabels(tabs), ['Expiry list', 'Master list', 'Azure', 'Tool register', 'Setup'])
  assert.equal(await selectedTab(tabs), 'Setup', 'Setup stays open after adding the source')
  await tabs.getByRole('tab', { name: 'Tool register' }).click()
  const own = panelTitled(page, 'Tool register')
  await own.locator('tbody tr').first().waitFor()
  const ownRows = await rowsOf(own)
  assert.equal(ownRows.length, 2)
  assert.match(ownRows[0], /^LabVIEW 2020 .*Not merged yet$/)
  assert.match(ownRows[1], /^Polyspace R2024a .*\d{4} Not merged yet$/, 'its due date read')
  assert.equal(await own.getByRole('button', { name: 'Edit mapping…' }).isDisabled(), false)
  await shot(page, 'source-tab')
  await own.getByRole('button', { name: 'Merge into master list…' }).click()
  const merge = page.getByRole('dialog', { name: 'Merge Tool register into the master list' })
  assert.match(await text(merge), /2 rows of Tool register read with its field mapping: 1 new, 1 updated, 0 no longer in the source\. New: Polyspace/)
  await shot(page, 'merge')
  await merge.getByRole('button', { name: 'Merge into master list' }).click()
  await merge.waitFor({ state: 'detached' })
  const merged = await until(() => savedList(writes, (entry) => entry.data.tools.some((tool) => tool.name === 'Polyspace')), 'the merge')
  assert.deepEqual(merged.data.tools.find((entry) => entry.name === 'LabVIEW').sources, { stream: { inSource: true }, 'tool-register': { inSource: true } }, 'one entry, both sources')
  assert.ok(merged.data.sources.find((source) => source.id === 'tool-register').mergedAt)
  await own.locator('tbody tr', { hasText: 'Polyspace' }).getByText('Merged', { exact: true }).waitFor()

  // TVL-14: removing the source (Setup → Sources) removes its tab; its tools stay.
  await tabs.getByRole('tab', { name: 'Master list' }).click()
  await master.locator('tbody tr', { hasText: 'Polyspace' }).waitFor()
  await shot(page, 'master-list')
  await tabs.getByRole('tab', { name: 'Setup' }).click()
  await sources.locator('tbody tr', { hasText: 'Tool register' }).getByRole('button', { name: 'Remove' }).click()
  const removeSource = page.getByRole('dialog', { name: 'Remove the source Tool register' })
  await removeSource.getByRole('button', { name: 'Remove Tool register' }).click()
  await removeSource.waitFor({ state: 'detached' })
  await tabs.getByRole('tab', { name: 'Tool register' }).waitFor({ state: 'detached' })
  assert.deepEqual(await tabLabels(tabs), ['Expiry list', 'Master list', 'Azure', 'Setup'])
  assert.equal(await sources.locator('tbody tr', { hasText: 'Tool register' }).count(), 0)
  const removed = await until(() => savedList(writes, (entry) => !entry.data.sources.some((source) => source.id === 'tool-register')), 'the source removed')
  assert.ok(removed.data.tools.some((tool) => tool.name === 'Polyspace'), 'its tools stay')
  assert.deepEqual(errors, [])
  await context.close()
})

test('TC-TVL-06: a Team Member reads the master list and the expiry view — every change disabled with the reason — and keeps a window of their own', async () => {
  assert.ok(sharedViews, 'the first scenario shared the connection setup')
  const list = { schema: 1, kind: 'tool-validations', defaultDays: 45, owners: ['co.owner@example.com'], sources: [{ id: 'stream', kind: 'stream', name: 'Tool Validations', mapping: { periodUnit: 'months', confirmed: true, name: '@tool-name', version: '@tool-version', dueDate: 'Microsoft.VSTS.Scheduling.DueDate' } }, { id: 'windchill-tools', kind: 'windchill', name: 'Windchill tools', ref: 'wc-tools', mapping: { periodUnit: 'months', confirmed: true, name: 'Name' } }],
    tools: [{ name: 'LabVIEW', version: '2020', dueDate: day(-3), sources: { stream: { inSource: false } }, addedAt: '2026-01-05T10:00:00Z' }, { name: 'Excel Validator', version: '2.0', dueDate: day(40), manual: ['dueDate'], sources: {}, addedAt: '2026-01-05T10:00:00Z' }] }
  const files = { 'azure-views.json': sharedViews, 'tool-validations.json': JSON.stringify(list) }
  const { page, context, errors } = await openPage(app, { init: setupReader })
  page.addLocatorHandler(page.getByRole('dialog', { name: /Could not fetch from Azure DevOps/ }), async (dialog) => { await dialog.getByRole('button', { name: /Close|Not now|Dismiss/ }).first().click() })
  const writes = await mock(context, files, 'Team Member')
  await page.reload()
  const entry = releaseDetails(page).locator('button:not(.nav-missing)', { hasText: 'Tool Validations' })
  await entry.waitFor()
  await entry.click()
  await page.locator('.page-loading').waitFor({ state: 'detached' })
  const tabs = page.getByRole('tablist', { name: 'Result' })
  await tabs.waitFor()
  // TVL-14: the remembered Master list tab ("tool-master") opens the Master list, not the Expiry list; the Windchill
  // source has its tab; Setup is last and shown to everyone.
  assert.deepEqual(await tabLabels(tabs), ['Expiry list', 'Master list', 'Azure', 'Windchill tools', 'Setup'])
  assert.equal(await selectedTab(tabs), 'Master list', 'the remembered tab')
  await panelTitled(page, 'Master list').locator('tbody tr', { hasText: 'LabVIEW' }).waitFor()
  await tabs.getByRole('tab', { name: 'Expiry list' }).click()
  const expiry = panelTitled(page, 'Validation expiry')
  await expiry.locator('tbody tr', { hasText: 'LabVIEW' }).waitFor()
  assert.equal(await panelTitled(page, 'Master list').count(), 0, 'the master list is on its own tab')
  assert.match(await text(page.locator('.tool-expiry-counts')), /Overdue 1 .*Due in the next 45 days 1 .*No due date 0/, 'the team default from Git: 45 days')
  // TVL-09: anyone keeps a window of their own.
  await page.getByLabel('Days ahead').fill('20')
  await page.locator('.tool-expiry-counts').getByText('Due in the next 20 days').waitFor()
  assert.equal((await rowsOf(expiry)).length, 1)
  assert.equal(await page.getByRole('button', { name: 'Use the team default (45)' }).isDisabled(), false)
  const reason = 'Only a Tool Owner (“Manage pages and menu groups”) or a co-owner of the Tool Validations list can change it. A Tool Owner names the co-owners in Team settings.'
  // TVL-09, TVL-11: only the owners set the team default here — disabled with the reason.
  const setDefault = page.getByRole('button', { name: 'Set 20 days as team default' })
  assert.ok(await setDefault.isDisabled())
  assert.equal(await setDefault.getAttribute('title'), reason)
  assert.equal(await text(page.locator('.tool-expiry-window .write-blocked')), reason)

  // TVL-11: the master list read only (its own tab, without the tiles and the window) — the reason visible next to the
  // disabled buttons.
  await tabs.getByRole('tab', { name: 'Master list' }).click()
  const master = panelTitled(page, 'Master list')
  await master.locator('tbody tr', { hasText: 'LabVIEW' }).waitFor()
  assert.match(await text(master.locator('tbody tr', { hasText: 'LabVIEW' })), /Not in source now/)
  assert.equal(await text(master.locator('.write-blocked')), reason)
  const add = master.getByRole('button', { name: '＋ Add tool…' })
  assert.ok(await add.isDisabled())
  assert.equal(await add.getAttribute('title'), reason)
  assert.ok(await master.getByRole('button', { name: 'Edit' }).first().isDisabled())
  assert.ok(await master.getByRole('button', { name: 'Remove' }).first().isDisabled())
  assert.deepEqual([await panelTitled(page, 'Sources').count(), await panelTitled(page, 'Team settings').count(), await panelTitled(page, 'Validation expiry').count(), await page.locator('.tool-expiry-counts').count()], [0, 0, 0, 0], 'only the master list on the Master list tab')
  await shot(page, 'read-only')
  // TVL-11, TVL-14: Setup read only — Sources and Team settings shown, every button disabled with the reason.
  await tabs.getByRole('tab', { name: 'Setup' }).click()
  const sources = panelTitled(page, 'Sources')
  await sources.locator('tbody tr', { hasText: 'Windchill tools' }).waitFor()
  assert.equal(await text(sources.locator('.write-blocked')), reason)
  const addSource = sources.getByRole('button', { name: '＋ Add source…' })
  assert.ok(await addSource.isDisabled())
  assert.equal(await addSource.getAttribute('title'), reason)
  for (const name of ['Edit mapping…', 'Merge into master list…', 'Remove']) assert.ok(await sources.locator('tbody tr', { hasText: 'Windchill tools' }).getByRole('button', { name }).isDisabled(), name)
  const team = panelTitled(page, 'Team settings')
  assert.ok(await team.getByRole('button', { name: 'Edit…' }).isDisabled())
  assert.equal(await text(team.locator('.write-blocked')), reason)
  assert.match(await text(team), /Expiry window \(team default\) 45 days Co-owners co\.owner@example\.com/i)
  await shot(page, 'setup-read-only')
  // TVL-14: the source's tab says how to load its data; its buttons are disabled with the reason too.
  await tabs.getByRole('tab', { name: 'Windchill tools' }).click()
  const own = panelTitled(page, 'Windchill tools')
  await own.getByText('That Windchill export is not in this browser.').waitFor()
  assert.match(await text(own), /Import the Windchill export \(Import Windchill export\)/)
  assert.equal(await text(own.locator('.write-blocked')), reason)
  assert.ok(await own.getByRole('button', { name: 'Edit mapping…' }).isDisabled())
  assert.ok(await own.getByRole('button', { name: 'Merge into master list…' }).isDisabled())
  // The Azure tab before a fetch: the usual fetch empty state.
  await tabs.getByRole('tab', { name: 'Azure' }).click()
  await page.getByText('“Tool Validations” has not been fetched yet.').waitFor()
  assert.equal(writes.filter((write) => write.path === 'tool-validations.json').length, 0, 'nothing written to the master list')
  assert.deepEqual(errors, [])
  await context.close()
})
