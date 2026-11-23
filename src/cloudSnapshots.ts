import type { AppState, Snapshot } from './domain'
import { listFolder, readRawFile, siblingConfig, writeTextFile, type GitConfig } from './gitStorage.ts'

// SNP-04…08: LTE, PI Review and Monthly Pack snapshots are JSON files in the Git data repository (the private
// repository of Git storage, beside the planning data), in the folder lte-snapshots/ — one commit per snapshot. They
// replaced the SharePoint library (SharePoint is in the backlog). Nothing is kept in the browser.
export const snapshotFolder = 'lte-snapshots'
export const maxSnapshotBytes = 50 * 1024 * 1024
export interface CloudSnapshotFile { id: string; name: string; path: string; webUrl: string; month: string; type: string }
type Fetch = (input: string, init?: RequestInit) => Promise<Response>

const namePattern = /^(\d{4}-\d{2})-(LTE|PI-Review|Monthly-Pack)-[\da-f-]+\.json$/
const fileUrl = (config: GitConfig) => `https://github.com/${config.owner}/${config.repo}/blob/${encodeURIComponent(config.branch)}/${config.path.split('/').map(encodeURIComponent).join('/')}`

export function freezeSnapshot(state: AppState, type: Snapshot['type'], month: string, createdBy: string, build: unknown) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('Choose a valid snapshot month.')
  // Explicit data whitelist: no connection settings, authentication or recursive snapshot history.
  const { schemaVersion, people, activities, efforts, baselines, periods, releases, audits, masters, azureWorkItems, azureBacklogScope } = state
  return structuredClone({ format: 'demand-planning-snapshot', formatVersion: 1, id: crypto.randomUUID(),
    title: `${type} — ${month}`, type, month, createdAt: new Date().toISOString(), createdBy, build,
    data: { schemaVersion, people, activities, efforts, baselines, periods, releases, audits, masters, azureWorkItems, azureBacklogScope } })
}

export const snapshotFileName = (snapshot: Pick<ReturnType<typeof freezeSnapshot>, 'month' | 'type' | 'id'>) => `${snapshot.month}-${snapshot.type.replaceAll(' ', '-')}-${snapshot.id}.json`
const describe = (config: GitConfig, name: string, id: string): CloudSnapshotFile => {
  const target = siblingConfig(config, `${snapshotFolder}/${name}`)
  const match = namePattern.exec(name)
  return { id, name, path: target.path, webUrl: fileUrl(target), month: match?.[1] ?? '', type: (match?.[2] ?? '').replace('-', ' ') }
}

// A new file only (no version id is sent, so an existing file is never replaced); read back and compared before
// success is reported.
export async function uploadSnapshot(config: GitConfig, token: string, snapshot: ReturnType<typeof freezeSnapshot>, fetchImpl: Fetch = fetch): Promise<CloudSnapshotFile> {
  const name = snapshotFileName(snapshot)
  const body = JSON.stringify(snapshot, null, 2)
  if (new Blob([body]).size > maxSnapshotBytes) throw new Error('Snapshot exceeds the 50 MB limit for a file in Git. Nothing was saved.')
  const target = siblingConfig(config, `${snapshotFolder}/${name}`)
  const written = await writeTextFile(target, token, body, null, `${snapshot.title} snapshot`, fetchImpl)
  const check = await readRawFile(target, token, fetchImpl)
  if (check !== body) throw new Error('The snapshot may be in Git, but reading it back did not match. Refresh history before retrying. Nothing was saved in the browser.')
  return describe(config, name, written.sha)
}

// Snapshot history: only snapshot files of the folder, newest month first (then by name).
export async function listSnapshots(config: GitConfig, token: string, fetchImpl: Fetch = fetch): Promise<CloudSnapshotFile[]> {
  const entries = await listFolder(siblingConfig(config, snapshotFolder), token, fetchImpl)
  return entries.filter((entry) => namePattern.test(entry.name)).map((entry) => describe(config, entry.name, entry.sha))
    .sort((a, b) => b.month.localeCompare(a.month) || a.name.localeCompare(b.name))
}
