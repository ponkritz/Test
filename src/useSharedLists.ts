import { createContext, useCallback, useEffect, useState } from 'react'
import { recordJob } from './backgroundJobs'
import { outcomeText } from './gitSaveQueue'
import { parseSharedLists, serializeSharedLists, sharedListsFile, type CatalogEntry, type SharedListsFile } from './sharedLists'
import type { GitStorage } from './useGitStorage'

// LST-02: the built-in lists from Git (shared-lists.json), read when Git storage is connected; the last good file read is
// kept in this browser so the columns keep their lists while Git cannot be reached. A file that cannot be used as a whole
// is refused with the reason and the lists in use stay as they were (the strict reader). Saved queued and merged (GIT-17)
// by the holders of "Manage built-in lists" and page co-owners (CON-115, LST-12); the result goes to Background jobs.
const cacheKey = 'demand-planning-shared-lists-v1'
function cached(): SharedListsFile | null { try { const text = localStorage.getItem(cacheKey); return text ? parseSharedLists(text) : null } catch { return null } }
function remember(text: string | null) { try { if (text) localStorage.setItem(cacheKey, text); else localStorage.removeItem(cacheKey) } catch { /* this visit only */ } }

export function useSharedLists(git: GitStorage) {
  const scope = git.accessScope
  const { readSharedLists } = git
  const [state, setState] = useState<{ scope: string; file: SharedListsFile | null; error: string; loaded: boolean }>(() => ({ scope: '', file: cached(), error: '', loaded: false }))
  const load = useCallback(async () => {
    if (!scope) return
    try {
      const read = await readSharedLists()
      const file = read.text == null ? null : parseSharedLists(read.text)
      remember(read.text)
      setState({ scope, file, error: '', loaded: true })
    } catch (failure) { setState((current) => ({ ...current, scope, loaded: true, error: failure instanceof Error ? failure.message : String(failure) })) }
  }, [scope, readSharedLists])
  const gitLoading = git.status === 'loading'
  useEffect(() => { if (scope && !gitLoading) void Promise.resolve().then(load) }, [scope, gitLoading, load])
  const fresh = state.scope === scope && Boolean(scope)

  // LST-06, LST-07: a change saved to Git — the version written (merged with a save by someone else meanwhile) is used.
  const save = useCallback(async (next: SharedListsFile, message: string) => {
    const label = 'Built-in lists · Save to Git'
    try {
      const result = await git.writeSharedLists(serializeSharedLists(next), message)
      const file = parseSharedLists(result.text)
      remember(result.text)
      setState((current) => ({ ...current, file, error: '' }))
      recordJob('shared-lists', label, { text: `${outcomeText(result)} ${message}.` })
      return file
    } catch (failure) {
      recordJob('shared-lists', label, { text: failure instanceof Error ? failure.message : String(failure), failed: true })
      throw failure
    }
  }, [git])

  return {
    file: state.file, error: fresh ? state.error : '', loaded: fresh && state.loaded, connected: Boolean(scope),
    save, reload: load, history: git.sharedListsHistory, queue: git.queueState(sharedListsFile), retry: () => git.retryQueued(sharedListsFile),
  }
}
export type SharedListsStore = ReturnType<typeof useSharedLists>
// LST-08: the lists a column can use (team lists and the Epic setup's Value lists), for the column editor.
export const ListCatalogContext = createContext<CatalogEntry[]>([])
