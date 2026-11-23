// OND-76 Publish standalone HTML in the desktop app: the file each page publishes to, chosen by the person in the save
// dialog and remembered per page on this computer (a small JSON file in the app's user data folder — never in Git).
// The page can only ask to choose (the dialog) and to write the page's HTML; it never names a path itself, so a
// compromised page cannot write anywhere else. Each publish overwrites that one file (written next to it, then renamed).
const path = require('path')

const pageIdPattern = /^[a-z0-9][a-z0-9-]{0,39}$/
const maxBytes = 50 * 1024 * 1024
// Control characters are removed from file names on purpose (SM-122).
// eslint-disable-next-line no-control-regex
const safeName = (name) => String(name ?? '').replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim().replace(/^[.\s-]+/, '').slice(0, 80) || 'Page'

function checkPageId(pageId) { if (typeof pageId !== 'string' || !pageIdPattern.test(pageId)) throw new Error('Invalid page.'); return pageId }

// storeFile: the JSON of { pageId: absolute path }; fs: fs.promises-like (readFile, writeFile, rename, stat, unlink).
function publishTargets({ storeFile, fs, showSaveDialog, documentsDir }) {
  async function read() {
    try {
      const raw = JSON.parse(await fs.readFile(storeFile, 'utf8'))
      return Object.fromEntries(Object.entries(raw && typeof raw === 'object' ? raw : {}).filter(([id, file]) => pageIdPattern.test(id) && typeof file === 'string' && path.isAbsolute(file) && /\.html?$/i.test(file)))
    } catch { return {} }
  }
  async function remember(pageId, file) { const all = await read(); all[pageId] = file; await fs.writeFile(storeFile, JSON.stringify(all, null, 2)) }
  return {
    // The remembered file of a page, or null.
    async target(pageId) { const file = (await read())[checkPageId(pageId)]; return file ? { path: file } : null },
    // The save dialog, starting at the remembered file (else Documents/{Page}.html); null when cancelled.
    async choose(pageId, defaultName) {
      checkPageId(pageId)
      const known = (await read())[pageId]
      const name = /\.html?$/i.test(String(defaultName ?? '')) ? safeName(defaultName) : `${safeName(defaultName)}.html`
      const choice = await showSaveDialog({ title: 'Publish standalone HTML', defaultPath: known ?? path.join(documentsDir, name), filters: [{ name: 'Web page (HTML)', extensions: ['html'] }] })
      if (choice.canceled || !choice.filePath) return null
      const file = /\.html?$/i.test(choice.filePath) ? choice.filePath : `${choice.filePath}.html`
      await remember(pageId, file)
      return { path: file }
    },
    // Overwrite the page's file with the HTML (a complete document, at most 50 MB).
    async write(pageId, html) {
      const file = (await read())[checkPageId(pageId)]
      if (!file) throw new Error('No file is chosen for this page yet: choose Publish now to pick one.')
      if (typeof html !== 'string' || !/^<!doctype html>/i.test(html) || Buffer.byteLength(html) > maxBytes) throw new Error('Invalid HTML file.')
      try { if (!(await fs.stat(path.dirname(file))).isDirectory()) throw new Error('not a folder') }
      catch { throw new Error(`The folder ${path.dirname(file)} is missing: choose the file again (Publish standalone HTML… → Choose another file…).`) }
      const temporary = `${file}.${process.pid}.tmp`
      await fs.writeFile(temporary, html, 'utf8')
      try { await fs.rename(temporary, file) } catch (error) { await fs.unlink(temporary).catch(() => undefined); throw error }
      return { path: file, bytes: Buffer.byteLength(html) }
    },
  }
}

module.exports = { publishTargets, safeName, maxBytes }
