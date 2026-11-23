import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import { navigate, openPage, rolesFile, startApp, text } from './helpers.mjs'

// On-Demand pages (OND-01…10, CON-103): CoNQ set up with a Dropdown and a Multi-select column, a row added and saved
// to Git as on-demand/conq.json (TC-OND-01, UAT), and a viewer without the rights (TC-OND-07), against a mocked GitHub.
let app
before(async () => { app = await startApp() })
after(async () => { await app.stop() })

const gitStorage = () => {
  localStorage.setItem('demand-planning-git-storage-v1', JSON.stringify({ owner: 'example', repo: 'storage', branch: 'main', path: 'planning-data.json' }))
  localStorage.setItem('demand-planning-git-token-v1', 'test-token')
}
// The data repository: files by path (text), the roles of `role`, every write recorded.
async function mockGitHub(context, files, role = 'Tool Owner') {
  const writes = []
  await context.route('https://dev.azure.com/**', (route) => route.fulfill({ status: 401, contentType: 'application/json', body: '{}' }))
  await context.route('https://api.github.com/**', (route) => {
    const request = route.request(), url = new URL(request.url())
    const json = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
    if (url.pathname === '/repos/example/storage') return json({ permissions: { push: true } })
    if (url.pathname === '/repos/example/storage/commits') return json([])
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
    const folder = Object.keys(files).filter((file) => file.startsWith(`${path}/`))
    if (folder.length) return json(folder.map((file) => ({ type: 'file', name: file.slice(path.length + 1), path: file, sha: `s${files[file].length}` })))
    if (files[path] != null) return json({ type: 'file', encoding: 'base64', content: Buffer.from(files[path]).toString('base64'), sha: `s${files[path].length}` })
    return json({ message: 'Not Found' }, 404)
  })
  return writes
}

test('TC-OND-01: On-Demand → CoNQ — add a Dropdown and a Multi-select column with options, add a row, Save to Git writes on-demand/conq.json, and a reload shows it from Git', async () => {
  const files = {}
  const { page, context, errors } = await openPage(app, { init: gitStorage })
  const writes = await mockGitHub(context, files)
  await page.reload()
  await page.locator('.sidebar nav').waitFor()
  // The On-Demand menu group lists CoNQ from the start (not in Git yet).
  const group = page.locator('.sidebar nav .nav-section', { hasText: 'ON-DEMAND' })
  assert.match(await text(group), /CoNQ/)
  await navigate(page, 'CoNQ')
  assert.equal(await text(page.locator('header.topbar h1')), 'CoNQ')
  assert.equal(await page.locator('header.topbar h1').getAttribute('title'), 'Cost of Non-Quality')
  await page.getByText('CoNQ is not in Git yet: it is created with its first Save to Git.').waitFor()

  // Set up columns…: a Dropdown (one value) and a Multi-select, each with its options.
  await page.getByRole('button', { name: 'Set up columns…' }).click()
  const columns = page.getByRole('dialog', { name: 'Set up columns' })
  await columns.getByRole('button', { name: '＋ Add column' }).click()
  await columns.getByLabel('Column 1 name').fill('Category')
  await columns.getByLabel('Column 1 type').selectOption('dropdown')
  for (const [index, option] of ['Scrap', 'Rework'].entries()) { await columns.getByRole('button', { name: '＋ Add option' }).click(); await columns.getByLabel(`Category option ${index + 1}`).fill(option) }
  await columns.getByRole('button', { name: '＋ Add column' }).click()
  await columns.getByLabel('Column 2 name').fill('Sites')
  await columns.getByLabel('Column 2 type').selectOption('multi')
  for (const [index, option] of ['Berlin', 'Leeds', 'Lyon'].entries()) { await columns.getByRole('button', { name: '＋ Add option' }).nth(1).click(); await columns.getByLabel(`Sites option ${index + 1}`).fill(option) }
  await columns.getByRole('button', { name: 'Save', exact: true }).click()
  await columns.waitFor({ state: 'detached' })

  // ＋ Add row: one value of the Dropdown, two of the Multi-select.
  await page.getByRole('button', { name: '＋ Add row' }).click()
  const row = page.getByRole('dialog', { name: 'Add a row' })
  await row.getByLabel('Category').selectOption('Rework')
  await row.getByRole('checkbox', { name: 'Berlin' }).check()
  await row.getByRole('checkbox', { name: 'Lyon' }).check()
  await row.getByRole('button', { name: 'Add row' }).click()
  await row.waitFor({ state: 'detached' })
  const table = page.locator('.od-panel table')
  assert.match(await text(table.locator('thead')), /Category.*Sites.*Actions/i)
  assert.match(await text(table.locator('tbody tr').first()), /Rework Berlin, Lyon/)
  assert.match(await text(page.locator('.od-panel')), /1 of 1 row/)

  // Save to Git: one commit of on-demand/conq.json with the columns, their options and the row's values.
  const bar = page.locator('.git-bar-dirty')
  assert.match(await text(bar), /Unsaved changes to CoNQ — not yet in Git/)
  await bar.getByRole('button', { name: 'Save to Git' }).click()
  await bar.waitFor({ state: 'detached' })
  const saved = writes.filter((write) => write.path === 'on-demand/conq.json')
  assert.equal(saved.length, 1)
  const file = saved[0].data
  assert.deepEqual([file.kind, file.id, file.name, file.description], ['on-demand-page', 'conq', 'CoNQ', 'Cost of Non-Quality'])
  assert.deepEqual(file.columns.map((column) => [column.name, column.type, column.options]), [['Category', 'dropdown', ['Scrap', 'Rework']], ['Sites', 'multi', ['Berlin', 'Leeds', 'Lyon']]])
  assert.deepEqual(file.rows.map((entry) => entry.cells), [{ [file.columns[0].id]: 'Rework', [file.columns[1].id]: ['Berlin', 'Lyon'] }])
  assert.match(saved[0].message, /\[saved \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z\]$/, 'a queued save carries its time (GIT-17)')
  assert.equal(JSON.stringify(writes).includes('test-token'), false, 'no token in the data repository')
  // §8: the result is a Background jobs entry.
  await page.locator('.jobs-button').click()
  assert.match(await text(page.getByRole('dialog', { name: 'Background jobs' }).locator('li.job', { hasText: 'Save to Git · CoNQ' })), /Saved to Git\. on-demand\/conq\.json/)
  await page.getByRole('dialog', { name: 'Background jobs' }).getByRole('button', { name: 'Close', exact: true }).click()

  // Reload without the copy kept in this browser: the page is read back from Git.
  await page.evaluate(() => localStorage.removeItem('demand-planning-on-demand-v1'))
  await page.reload()
  await page.locator('.sidebar nav').waitFor()
  await navigate(page, 'CoNQ')
  await page.locator('.od-panel table tbody tr').first().waitFor()
  assert.match(await text(page.locator('.od-panel table tbody tr').first()), /Rework Berlin, Lyon/)
  assert.equal(await page.getByText('CoNQ is not in Git yet').count(), 0)
  assert.deepEqual(errors.filter((entry) => !/401|Unauthorized/.test(entry)), [])
  await context.close()
})

test('TC-OND-07: a viewer without the On-Demand rights sees the page read only — rows shown, Add row, Edit, Remove and Set up columns… disabled with the reason', async () => {
  const conq = { schema: 1, kind: 'on-demand-page', id: 'conq', name: 'CoNQ', description: 'Cost of Non-Quality', columns: [{ id: 'c1', name: 'Category', type: 'dropdown', options: ['Scrap'] }], rows: [{ id: 'r1', cells: { c1: 'Rework' } }] }
  const files = { 'on-demand/conq.json': JSON.stringify(conq) }
  const { page, context, errors } = await openPage(app, { init: gitStorage })
  const writes = await mockGitHub(context, files, 'Team Member')
  await page.reload()
  await page.locator('.sidebar nav').waitFor()
  await navigate(page, 'CoNQ')
  const first = page.locator('.od-panel table tbody tr').first()
  await first.waitFor()
  // The value no longer in the options is kept and marked.
  assert.match(await text(first), /Rework not in the list/)
  for (const name of ['＋ Add row', 'Set up columns…', '＋ Add page…', 'Rename page…', 'Remove page…']) assert.equal(await page.getByRole('button', { name }).isDisabled(), true, `${name} is disabled`)
  assert.equal(await first.getByRole('button', { name: /^Edit row/ }).isDisabled(), true)
  assert.equal(await first.getByRole('button', { name: /^Remove row/ }).isDisabled(), true)
  assert.equal(await text(page.locator('.od-panel .write-blocked')), 'Your role does not allow “Edit On-Demand data (rows)”, “Set up On-Demand pages (pages, columns, options)”. An Admin can change this in Admin → People & roles → Role rights.')
  assert.match(await first.getByRole('button', { name: /^Edit row/ }).getAttribute('title'), /Your role does not allow “Edit On-Demand data \(rows\)”/)
  assert.equal(writes.length, 0, 'nothing is written')
  assert.deepEqual(errors.filter((entry) => !/401|Unauthorized/.test(entry)), [])
  await context.close()
})
