// PIR-43 Safe text for the PI Review Meeting file, shared by the slide makers (piMeeting.ts, piMeetingExec.ts): every
// value goes through `text()` — e-mail addresses and identity ids are taken out and the rest HTML-escaped — so comment
// text from Azure DevOps can never become markup or script; people by their display name only.
import { escapeHtml } from './standaloneHtml.ts'

// PIR-43: no e-mail address and no identity id (a GUID, also as "@<GUID>") reaches the file; then HTML-escaped.
const emailPattern = /[^\s@<>()[\]"',;:]+@[^\s@<>()[\]"',;:]+\.[A-Za-z]{2,}/g
const identityPattern = /@?<?\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b>?/gi
export const scrub = (value: unknown) => String(value ?? '').replace(identityPattern, '[id]').replace(emailPattern, '[email]')
export const text = (value: unknown) => escapeHtml(scrub(value))
// A person: the display name only ("Rita Gomez <rita@…>" → "Rita Gomez"); "Unknown" when nothing is left.
export const displayName = (value: unknown) => { const name = scrub(String(value ?? '').replace(/<[^>]*>/g, ' ')).replace(/\[email\]|\[id\]/g, ' ').replace(/\s+/g, ' ').trim(); return name || 'Unknown' }
export const lines = (value: string) => value.split(/\r?\n/).map((line) => line.trim().replace(/^(?:[-*•+–◦▪]|\d{1,2}[.)])[ \t]+(?=\S)/, '')).filter(Boolean)
export const plural = (count: number, word: string, many = `${word}s`) => `${count.toLocaleString('en')} ${count === 1 ? word : many}`
export const part = (title: string, at: number, of: number) => of > 1 ? `${title} (${at + 1} of ${of})` : title
export const listMax = 12, themeMax = 8, themeBudget = 1100
// Long lists run over several slides: at most `max` entries and about `budget` characters a slide.
export function chunks<T>(items: readonly T[], max: number, budget = Infinity, size: (item: T) => number = () => 0): T[][] {
  const out: T[][] = []
  let current: T[] = [], used = 0
  for (const item of items) {
    const length = size(item)
    if (current.length && (current.length >= max || used + length > budget)) { out.push(current); current = []; used = 0 }
    current.push(item); used += length
  }
  if (current.length) out.push(current)
  return out
}
// PIR-61: "—" with the reason, for a value that cannot be worked out (never an invented figure).
export const missing = (why: string) => `<p class="missing"><strong>—</strong> <span>${text(why)}</span></p>`
// PIR-62: a table whose column headers re-sort it while presenting (the file's script; keyboard: the header buttons;
// aria-sort on the header). A cell's sort value: data-value (numbers), else its text.
export interface SortCell { html: string; value?: number | string; num?: boolean }
export function sortableTable(label: string, headers: { label: string; num?: boolean }[], rows: SortCell[][], foot = ''): string {
  const head = headers.map((header, at) => `<th scope="col"${header.num ? ' class="num"' : ''} aria-sort="none"><button type="button" class="sort" data-col="${at}">${text(header.label)}<span class="arrow" aria-hidden="true"></span></button></th>`).join('')
  const body = rows.map((cells) => `<tr>${cells.map((cell, at) => `<td${headers[at]?.num || cell.num ? ' class="num"' : ''}${cell.value != null ? ` data-value="${text(cell.value)}"` : ''}>${cell.html}</td>`).join('')}</tr>`).join('\n')
  return `<table class="sortable" aria-label="${text(label)}"><thead><tr>${head}</tr></thead><tbody>\n${body}\n</tbody>${foot ? `<tfoot>${foot}</tfoot>` : ''}</table>`
}
export const cell = (value: string | number, sort?: number | string): SortCell => ({ html: text(value), ...(sort != null ? { value: sort } : typeof value === 'number' ? { value } : {}) })
