// PIR-91…PIR-95 (product owner, 27 Nov 2026): a Feature counts in a PI of the PI Review Meeting when its Iteration Path
// WAS in that PI, not only where it is now. A Feature already moved to a later PI in Azure DevOps (PI 26.4 → PI 27.1)
// stays in the PI 26.4 deck, labelled "Moved to PI 27.1", and counts as carried forward there.
//  - Candidates: the Features that can be counted in a PI at all (piFeatures' rules: not Removed, not under the absence
//    Epic) whose current Iteration Path is in a LATER PI than the one built — only those have their history read.
//  - Their change history is the read that already exists (closedHistory.ts: `read('updates', { workItemId })`, a GET of
//    the work item's updates); a candidate whose history shows System.IterationPath in the built PI (any update's old or
//    new value) is a Feature of that PI, moved to the PI it is in now.
//  - Read a few at a time with the rate-limit handling of the Discussions (readDiscussions), kept in this page load's
//    memory only (never stored), so a Feature is read once per page load (and again only after it changed).
//  - Without a PAT, with the read blocked or a failed read, the candidate is left out and the job result says how many
//    and why: nothing is invented.
// Pure apart from the in-memory cache; nothing here touches the DOM or Git.
import { piName, piPathOf } from './myWork.ts'
import { readDiscussions, reviewableFeature, samePi, type BulkReadResult } from './piReview.ts'
import { comparePiNumbers, piParts, piText } from './piReviewPost.ts'
import type { HistoryUpdate } from './closedHistory.ts'
import type { AzureRequest } from './azureClient.ts'
import type { AzureWorkItem } from './domain'

const lower = (value: string) => value.trim().toLowerCase()
// Two PI paths are the same PI: the same path (letter case ignored, samePi), the same PI name under a renamed parent, or
// the same PI number ("PI 26.4", "PI 2026.4", "Program Increment 26.4": piParts, a two-digit year read as 20xx).
export function isSamePi(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false
  if (samePi(a, b) || lower(piName(a)) === lower(piName(b))) return true
  const x = piParts(a), y = piParts(b)
  return Boolean(x && y && comparePiNumbers(x, y) === 0)
}
// Whether PI path a is later than PI path b: by the PI numbers when both have them (two-digit years read as 20xx),
// else by the PI names with their numbers.
export function isLaterPi(a: string, b: string): boolean {
  if (isSamePi(a, b)) return false
  const x = piParts(a), y = piParts(b)
  if (x && y) return comparePiNumbers(x, y) > 0
  return piName(a).localeCompare(piName(b), undefined, { numeric: true, sensitivity: 'base' }) > 0
}

// PIR-91: the candidates for the PI `pi` (a path) — Features that can be counted in a PI whose current Iteration Path is
// in a later PI, without those already in the PI's own list (`known`, e.g. a Feature in the PI by a User Story). By ID.
export function movedCandidates(items: AzureWorkItem[], pi: string, { absenceEpicId, known = [] }: { absenceEpicId?: number; known?: readonly number[] } = {}): AzureWorkItem[] {
  if (!pi) return []
  const counted = reviewableFeature(items, absenceEpicId), skip = new Set(known)
  return items.filter((item) => {
    if (skip.has(item.id) || !counted(item)) return false
    const now = piPathOf(item.iterationPath)
    return Boolean(now && isLaterPi(now, pi))
  }).sort((a, b) => a.id - b.id)
}

// PIR-91: the PIs a work item's Iteration Path was in, from its updates (every System.IterationPath old and new value,
// the PI part only — a Sprint below the PI is the PI), each once, in the order seen.
export function historyPis(updates: readonly HistoryUpdate[]): string[] {
  const found: string[] = []
  for (const update of updates) {
    const change = update.fields?.['System.IterationPath']
    if (!change) continue
    for (const value of [change.oldValue, change.newValue]) {
      const pi = typeof value === 'string' ? piPathOf(value) : undefined
      if (pi && !found.some((seen) => isSamePi(seen, pi))) found.push(pi)
    }
  }
  return found
}
// PIR-91: whether the history shows the Iteration Path in the PI.
export const wasInPi = (pis: readonly string[], pi: string) => pis.some((seen) => isSamePi(seen, pi))

// PIR-92: the label of a moved Feature — "Moved to PI 27.1" (the PI it is in now, as the meeting writes a PI).
export const movedPi = (path: string) => piText(piName(path)) || piName(path).trim()
export const movedLabel = (movedTo: string) => `Moved to ${movedTo}`

// ---- the history, read once per page load ----
// done: the PIs of the Iteration Path's history. Only successful reads are kept (a failed read is tried again next build).
const histories = new Map<string, string[]>()
const historyKey = (item: Pick<AzureWorkItem, 'key' | 'changedDate'>) => `${item.key}@${item.changedDate ?? ''}`
export const historyOf = (item: Pick<AzureWorkItem, 'key' | 'changedDate'>) => histories.get(historyKey(item))
export function clearHistories() { histories.clear() }
export type HistoryRead = (operation: AzureRequest['operation'], extra: Partial<AzureRequest>) => Promise<unknown>
// PIR-93: read the histories not read yet (`concurrency` at a time, the Discussions' rate-limit handling), keeping each
// result in memory. The result counts the reads of this call; the items already known are not read again.
export async function readHistories(items: readonly AzureWorkItem[], read: HistoryRead, options: { rateWait: (failure: unknown) => number | null; onProgress?: (done: number, total: number) => void; sleep?: (ms: number) => Promise<void> }): Promise<BulkReadResult> {
  const byId = new Map(items.filter((item) => !histories.has(historyKey(item))).map((item) => [item.id, item]))
  if (!byId.size) return { read: 0, failed: 0, unread: [], stopped: '' }
  return readDiscussions([...byId.keys()], async (id) => {
    const page = await read('updates', { workItemId: id }) as { value?: HistoryUpdate[] }
    if (!Array.isArray(page?.value)) throw new Error('Azure DevOps did not return the history.')
    return historyPis(page.value)
  }, { ...options, onResult: (id, pis) => { histories.set(historyKey(byId.get(id)!), pis) } })
}

// PIR-91, PIR-93: the moved Features of the PI among the candidates — those whose history shows the PI — with the PI
// they are in now and the PIs they were in; unread: the candidates whose history is not known (left out).
export interface MovedFeature { item: AzureWorkItem; movedTo: string; pis: string[] }
export function movedFeatures(candidates: readonly AzureWorkItem[], pi: string, history: (item: AzureWorkItem) => string[] | undefined = historyOf): { moved: MovedFeature[]; unread: number } {
  const moved: MovedFeature[] = []
  let unread = 0
  for (const item of candidates) {
    const pis = history(item)
    if (!pis) { unread += 1; continue }
    if (wasInPi(pis, pi)) moved.push({ item, movedTo: movedPi(piPathOf(item.iterationPath) ?? item.iterationPath), pis })
  }
  return { moved, unread }
}

// PIR-93: the sentence of the job result about the candidates left out ('' when none): how many, for which PIs, and why.
export function movedReadNote(unread: number, why: string): string {
  if (!unread) return ''
  return ` ${unread} Feature${unread === 1 ? '' : 's'} now in a later PI ${unread === 1 ? 'was' : 'were'} not checked for a move out of this PI or the previous one (${why.replace(/\.$/, '')}): left out.`
}
