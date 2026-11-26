// PIR-40…PIR-47 The PI Review Meeting presentation: "Conduct PI Meeting" on PI Review builds ONE self-contained, offline
// HTML file of slides for the chosen PI — a frozen snapshot of the reviews (the latest review of each Feature's
// Discussion for the PI — PIR-49: the newest comment headed "Feature Review for <the PI>" — on or after "PI Review starts
// from", PIR-33) at the moment it is built. Pure: the Features, their
// Discussions, the form setup, the start date, who built it and when are passed in; nothing here touches the DOM, Git or
// the network.
//
// Safe content (PIR-43): every value goes through `text()` — e-mail addresses and identity ids are taken out and the
// rest HTML-escaped — so comment text from Azure DevOps can never become markup or script. The file holds display
// names only (no e-mails, identity ids or PATs: the builder is never given a connection or a token). Its
// Content-Security-Policy is the one of the interactive HTML file (OND-94, `publishCsp`): only its own script and its
// own styles, by their SHA-256 hashes, and no request of any kind.
//
// Easy to change (PIR-41): each slide type is one small function (`slideMakers`) and the order is one list
// (`slideOrder`), so the product owner's later wishes change slides and order cheaply.
import { escapeHtml, inlineScript, inlineStyle, publishCsp, sha256Base64 } from './standaloneHtml.ts'
import { commentsFrom, isNoneText, latestReviewFor, moveLabel, reviewModeLabel, reviewSplit, type Discussion, type MoveValue, type ReviewMode, type SplitFrom } from './piReview.ts'
import { customFields, type PiFormSetup } from './piReviewSetup.ts'
import { piText } from './piReviewPost.ts'
import { piName } from './myWork.ts'
import { formatDate, formatDateTime } from './format.ts'
import { shownDateOf } from './azureDevOps.ts'
import type { AzureWorkItem } from './domain'
export { isMeetingPath, maxMeetingBytes, meetingBuiltOf, meetingBytes, meetingFileName, meetingFolder, meetingPath, meetingsFolder, meetingStamp, piSlug } from './piMeetingFile.ts'

// ---- the snapshot ----
// PIR-42: a Feature as the meeting shows it. status — reviewed: its Discussion was read and has a review for the PI
// (PIR-49: a comment headed "Feature Review for <the PI>") on or after the start date (the latest one is the review);
// none: read, no such comment (a comment without the heading is no review, PIR-50); unread: not read (e.g. sample data, no
// PAT); error: the read failed (error says why).
export type MeetingStatus = 'reviewed' | 'none' | 'unread' | 'error'
export interface MeetingReview {
  author: string; date: string; from: SplitFrom; learnings: string; struggles: string; move: string; moveValue?: MoveValue; movePi: string
  mode: string; reviewMode?: ReviewMode; remarks: string; fields: { label: string; text: string }[]; text: string
}
export interface MeetingFeature { id: number; title: string; epic: string; epicId?: number; assignedTo: string; state: string; status: MeetingStatus; error?: string; review?: MeetingReview }
// pi: "PI 26.4"; builtAt: the build's date and time as shown (the builder's clock and time zone); builtBy: a display name;
// start: "PI Review starts from" (YYYY-MM-DD).
export interface Meeting { pi: string; builtAt: string; builtBy: string; start: string; features: MeetingFeature[] }

export const meetingName = 'PI Review Meeting'
export const meetingPi = (path: string) => piText(piName(path)) || piName(path).trim() || 'PI'
export const meetingTitle = (pi: string) => `${meetingName} — ${pi}`

// PIR-42: the Features of the PI with their review, taken from the Discussions read (only the comments on or after the
// start date count — applied here again, whatever the Discussion was read with). PIR-49: pi — the PI of the meeting
// ("PI 26.4"); only a review headed for it counts.
export function meetingFeatures(rows: readonly { item: AzureWorkItem; epic?: AzureWorkItem }[], discussionOf: (key: string) => Discussion | undefined, setup: PiFormSetup, start: string, pi: string): MeetingFeature[] {
  return rows.map(({ item, epic }) => {
    const base = { id: item.id, title: item.title, epic: epic ? epic.title || `#${epic.id}` : '', ...(epic ? { epicId: epic.id } : {}), assignedTo: item.assignedTo, state: item.state }
    const entry = discussionOf(item.key)
    if (entry?.state === 'error') return { ...base, status: 'error', error: entry.error }
    if (entry?.state !== 'done') return { ...base, status: 'unread' }
    const comment = latestReviewFor(commentsFrom(entry.comments, start).comments, pi)
    if (!comment) return { ...base, status: 'none' }
    const split = reviewSplit(comment.text, setup)
    const review: MeetingReview = {
      author: comment.author, date: formatDateTime(shownDateOf(comment)), from: split.from,
      learnings: split.learnings ?? '', struggles: split.struggles ?? '', move: moveLabel(split), ...(split.moveValue ? { moveValue: split.moveValue } : {}), movePi: split.movePi ?? '',
      mode: reviewModeLabel(split), ...(split.reviewMode ? { reviewMode: split.reviewMode } : {}), remarks: split.remarks ?? '',
      fields: customFields(setup).map((field) => ({ label: field.label, text: split.extra?.[field.id] ?? '' })).filter((field) => field.text), text: comment.text,
    }
    return { ...base, status: 'reviewed', review }
  })
}

// ---- safe text ----
// PIR-43: no e-mail address and no identity id (a GUID, also as "@<GUID>") reaches the file; then HTML-escaped.
const emailPattern = /[^\s@<>()[\]"',;:]+@[^\s@<>()[\]"',;:]+\.[A-Za-z]{2,}/g
const identityPattern = /@?<?\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b>?/gi
export const scrub = (value: unknown) => String(value ?? '').replace(identityPattern, '[id]').replace(emailPattern, '[email]')
export const text = (value: unknown) => escapeHtml(scrub(value))
// A person: the display name only ("Rita Gomez <rita@…>" → "Rita Gomez"); "Unknown" when nothing is left.
export const displayName = (value: unknown) => { const name = scrub(String(value ?? '').replace(/<[^>]*>/g, ' ')).replace(/\[email\]|\[id\]/g, ' ').replace(/\s+/g, ' ').trim(); return name || 'Unknown' }
const lines = (value: string) => value.split(/\r?\n/).map((line) => line.trim().replace(/^(?:[-*•+–◦▪]|\d{1,2}[.)])[ \t]+(?=\S)/, '')).filter(Boolean)
// A paragraph text as HTML: one line a paragraph, more lines a list.
function block(value: string, empty = '—') {
  const all = lines(value)
  if (!all.length) return `<p class="muted">${text(empty)}</p>`
  return all.length === 1 ? `<p>${text(all[0])}</p>` : `<ul>${all.map((line) => `<li>${text(line)}</li>`).join('')}</ul>`
}
const plural = (count: number, word: string, many = `${word}s`) => `${count.toLocaleString('en')} ${count === 1 ? word : many}`

// ---- the slides ----
export type SlideKind = 'title' | 'summary' | 'summary-epics' | 'discuss' | 'reviewed' | 'not-reviewed' | 'learnings' | 'struggles'
export interface Slide { kind: SlideKind; eyebrow: string; title: string; body: string }
// PIR-41: the order of the slides — one list (product owner, 25 Nov 2026: Summary first, then the Features to discuss in
// the meeting, then all other Features, then the Themes).
export const slideOrder: readonly SlideKind[] = ['title', 'summary', 'summary-epics', 'discuss', 'reviewed', 'not-reviewed', 'learnings', 'struggles']
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
const part = (title: string, at: number, of: number) => of > 1 ? `${title} (${at + 1} of ${of})` : title
const isDiscuss = (feature: MeetingFeature) => feature.review?.reviewMode === 'Discuss during Meeting'
const reviewed = (meeting: Meeting) => meeting.features.filter((feature) => feature.status === 'reviewed')
const notReviewed = (meeting: Meeting) => meeting.features.filter((feature) => feature.status !== 'reviewed')
const noEpic = 'No Epic'
const epicName = (feature: MeetingFeature) => feature.epic || noEpic
// By Epic (its name; "No Epic" last), then by ID.
const byEpic = (a: MeetingFeature, b: MeetingFeature) => (a.epic ? 0 : 1) - (b.epic ? 0 : 1) || epicName(a).localeCompare(epicName(b)) || a.id - b.id

interface Counts { features: number; reviewed: number; none: number; unread: number; yes: number; no: number; partly: number; noMove: number; discuss: number; offline: number; noMode: number; nextPis: Map<string, number> }
export function meetingCounts(features: readonly MeetingFeature[]): Counts {
  const counts: Counts = { features: features.length, reviewed: 0, none: 0, unread: 0, yes: 0, no: 0, partly: 0, noMove: 0, discuss: 0, offline: 0, noMode: 0, nextPis: new Map() }
  for (const feature of features) {
    const review = feature.review
    if (feature.status !== 'reviewed' || !review) { if (feature.status === 'none') counts.none += 1; else counts.unread += 1; continue }
    counts.reviewed += 1
    if (review.moveValue === 'Yes') { counts.yes += 1; const next = review.movePi || 'the next PI (not named)'; counts.nextPis.set(next, (counts.nextPis.get(next) ?? 0) + 1) } else if (review.moveValue === 'No') counts.no += 1; else if (review.moveValue === 'Partly') counts.partly += 1; else counts.noMove += 1
    if (review.reviewMode === 'Discuss during Meeting') counts.discuss += 1; else if (review.reviewMode === 'Offline Review') counts.offline += 1; else counts.noMode += 1
  }
  return counts
}

const tile = (label: string, value: string, detail = '') => `<div class="tile"><dt>${text(label)}</dt><dd><strong>${text(value)}</strong>${detail ? `<small>${text(detail)}</small>` : ''}</dd></div>`
const titleSlide = (meeting: Meeting): Slide[] => {
  const unread = meeting.features.filter((feature) => feature.status === 'unread' || feature.status === 'error').length
  return [{ kind: 'title', eyebrow: 'PI REVIEW', title: meetingTitle(meeting.pi), body: `<p class="lead">Built ${text(meeting.builtAt)} by ${text(displayName(meeting.builtBy))}</p>
<p>A snapshot of the PI reviews at that moment: it does not update. Only the comments headed “${text(`Feature Review for ${meeting.pi}`)}” and written on or after ${text(formatDate(meeting.start))} (when PI Review starts) count.</p>${unread ? `<p class="warning">${text(`${plural(unread, 'Discussion was', 'Discussions were')} not read when it was built: ${unread === 1 ? 'that Feature is' : 'those Features are'} listed as not reviewed.`)}</p>` : ''}
<p class="muted">Keys: → or Space next, ← back, Home first, End last, O the slide overview. Print: one slide a page.</p>` }]
}
const summarySlide = (meeting: Meeting): Slide[] => {
  const counts = meetingCounts(meeting.features)
  const next = [...counts.nextPis].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([pi, count]) => `${count} to ${pi}`).join(', ')
  return [{ kind: 'summary', eyebrow: 'SUMMARY', title: 'Summary', body: `<dl class="tiles">
${tile('Features in the PI', String(counts.features))}
${tile('Reviewed', String(counts.reviewed), `${counts.none + counts.unread} not reviewed${counts.unread ? ` (${counts.unread} Discussion${counts.unread === 1 ? '' : 's'} not read)` : ''}`)}
${tile('Move to next PI: Yes', String(counts.yes), next || 'none moves')}
${tile('Move to next PI: No', String(counts.no), `${counts.partly ? `${counts.partly} partly` : ''}${counts.partly && counts.noMove ? ', ' : ''}${counts.noMove ? `${counts.noMove} not given` : ''}`)}
${tile('Discuss during Meeting', String(counts.discuss), `one slide each, next`)}
${tile('Offline Review', String(counts.offline), counts.noMode ? `${counts.noMode} not given` : '')}
</dl>${counts.reviewed ? '' : `<p class="muted">${text(`No Feature has a review on or after ${formatDate(meeting.start)}.`)}</p>`}` }]
}
const epicSlides = (meeting: Meeting): Slide[] => {
  const groups = new Map<string, MeetingFeature[]>()
  for (const feature of [...meeting.features].sort(byEpic)) groups.set(epicName(feature), [...(groups.get(epicName(feature)) ?? []), feature])
  if (groups.size < 2) return []
  const rows = [...groups].map(([epic, features]) => ({ epic, counts: meetingCounts(features) }))
  const pages = chunks(rows, listMax)
  return pages.map((page, at) => ({ kind: 'summary-epics', eyebrow: 'SUMMARY', title: part('Summary by Epic', at, pages.length), body: `<table><thead><tr><th>Epic</th><th class="num">Features</th><th class="num">Reviewed</th><th class="num">Not reviewed</th><th class="num">Move: Yes</th><th class="num">Move: No</th><th class="num">Discuss</th><th class="num">Offline</th></tr></thead><tbody>
${page.map(({ epic, counts }) => `<tr><td>${text(epic)}</td><td class="num">${counts.features}</td><td class="num">${counts.reviewed}</td><td class="num">${counts.none + counts.unread}</td><td class="num">${counts.yes}</td><td class="num">${counts.no}</td><td class="num">${counts.discuss}</td><td class="num">${counts.offline}</td></tr>`).join('\n')}
</tbody></table>` }))
}
// PIR-44: one Feature's review — ID, Title, Epic, Assigned to, State; Learnings and Struggles; Move to next PI with the
// reason; the Review meeting advice, Additional Remarks and the fields added in PI Review Setup; when and by whom.
function featureBody(feature: MeetingFeature) {
  const review = feature.review!
  const suggested = review.from === 'Keywords'
  const fact = (label: string, value: string) => `<div><dt>${text(label)}</dt><dd>${text(value || '—')}</dd></div>`
  const section = (label: string, value: string) => `<section class="part"><h3>${text(label)}</h3>${block(value)}</section>`
  return `<dl class="facts">${fact('Epic', feature.epic || noEpic)}${fact('Assigned to', displayName(feature.assignedTo || 'Unassigned'))}${fact('State', feature.state)}</dl>
${suggested ? '<p class="muted">Suggested from keywords: the comment has no headings.</p>' : ''}${review.from === 'None' ? section('Comment', review.text) : `<div class="columns${suggested ? ' suggested' : ''}">${section('Learnings', review.learnings)}${section('Struggles', review.struggles)}</div>
<dl class="facts wide">${fact('Move to next PI', review.move)}${fact('Review meeting', review.mode)}</dl>
${review.remarks ? section('Additional Remarks', review.remarks) : ''}${review.fields.map((field) => section(field.label, field.text)).join('')}`}
<p class="byline">Review by ${text(displayName(review.author))}, ${text(review.date)}</p>`
}
const featureSlide = (kind: SlideKind, eyebrow: string) => (feature: MeetingFeature): Slide => ({ kind, eyebrow, title: `#${feature.id} ${feature.title}`, body: featureBody(feature) })
const discussSlides = (meeting: Meeting): Slide[] => {
  const features = reviewed(meeting).filter(isDiscuss).sort(byEpic)
  return features.map((feature, at) => featureSlide('discuss', `DISCUSS DURING MEETING · ${at + 1} OF ${features.length}`)(feature))
}
const reviewedSlides = (meeting: Meeting): Slide[] => {
  const features = reviewed(meeting).filter((feature) => !isDiscuss(feature)).sort(byEpic)
  const perEpic = new Map<string, number>()
  for (const feature of features) perEpic.set(epicName(feature), (perEpic.get(epicName(feature)) ?? 0) + 1)
  const seen = new Map<string, number>()
  return features.map((feature) => { const epic = epicName(feature), at = (seen.get(epic) ?? 0) + 1; seen.set(epic, at); return featureSlide('reviewed', `REVIEWED · ${epic.toUpperCase()} · ${at} OF ${perEpic.get(epic)}`)(feature) })
}
const why = (feature: MeetingFeature, start: string) => feature.status === 'none' ? `No review headed for this PI since ${formatDate(start)}` : feature.status === 'error' ? 'The Discussion could not be read' : 'The Discussion was not read'
const notReviewedSlides = (meeting: Meeting): Slide[] => {
  const features = notReviewed(meeting).sort(byEpic)
  if (!features.length) return [{ kind: 'not-reviewed', eyebrow: 'NOT REVIEWED', title: 'Features not reviewed', body: '<p>None: every Feature of the PI has a review.</p>' }]
  const pages = chunks(features, listMax)
  return pages.map((page, at) => ({ kind: 'not-reviewed', eyebrow: `NOT REVIEWED · ${plural(features.length, 'FEATURE')}`, title: part('Features not reviewed', at, pages.length), body: `<table><thead><tr><th class="num">ID</th><th>Title</th><th>Epic</th><th>Assigned to</th><th>Why</th></tr></thead><tbody>
${page.map((feature) => `<tr><td class="num">${feature.id}</td><td>${text(feature.title)}</td><td>${text(epicName(feature))}</td><td>${text(displayName(feature.assignedTo || 'Unassigned'))}</td><td>${text(why(feature, meeting.start))}</td></tr>`).join('\n')}
</tbody></table>` }))
}
// PIR-45: the Themes — every Learning, then every Struggle, each with its Feature ID; a "None" answer is left out.
export function themeItems(meeting: Meeting, which: 'learnings' | 'struggles'): { id: number; text: string; suggested: boolean }[] {
  return reviewed(meeting).sort((a, b) => a.id - b.id).flatMap((feature) => lines(feature.review![which]).filter((line) => !isNoneText(line)).map((line) => ({ id: feature.id, text: line, suggested: feature.review!.from === 'Keywords' })))
}
const themeSlides = (which: 'learnings' | 'struggles', label: string) => (meeting: Meeting): Slide[] => {
  const items = themeItems(meeting, which)
  if (!items.length) return [{ kind: which, eyebrow: 'THEMES', title: label, body: `<p class="muted">${text(`No ${label.toLowerCase()} were written.`)}</p>` }]
  const pages = chunks(items, themeMax, themeBudget, (item) => item.text.length + 20)
  return pages.map((page, at) => ({ kind: which, eyebrow: `THEMES · ${plural(items.length, label.slice(0, -1).toUpperCase(), label.toUpperCase())}`, title: part(label, at, pages.length), body: `<ul class="themes">${page.map((item) => `<li><span class="fid">#${item.id}</span> ${text(item.text)}${item.suggested ? ' <small class="muted">(suggested)</small>' : ''}</li>`).join('')}</ul>` }))
}
export const slideMakers: Record<SlideKind, (meeting: Meeting) => Slide[]> = {
  title: titleSlide, summary: summarySlide, 'summary-epics': epicSlides, discuss: discussSlides, reviewed: reviewedSlides,
  'not-reviewed': notReviewedSlides, learnings: themeSlides('learnings', 'Learnings'), struggles: themeSlides('struggles', 'Struggles'),
}
export const meetingSlides = (meeting: Meeting): Slide[] => slideOrder.flatMap((kind) => slideMakers[kind](meeting))

// ---- the file ----
// PIR-46: the navigation — ← / →, Space, Page Up / Down, Home / End, O (or the button) for the slide overview, Escape
// closes it; printing shows every slide, one a page. Without JavaScript every slide shows, one after another.
export const meetingScript = `(function () {
  var doc = document, root = doc.documentElement
  var slides = Array.prototype.slice.call(doc.querySelectorAll('.slide'))
  var overview = doc.getElementById('overview'), counter = doc.getElementById('counter')
  var prev = doc.getElementById('prev'), next = doc.getElementById('next'), toggle = doc.getElementById('toggle'), print = doc.getElementById('print')
  var at = 0
  root.classList.add('js')
  function show(index) {
    at = Math.max(0, Math.min(slides.length - 1, index))
    for (var i = 0; i < slides.length; i++) { slides[i].classList.toggle('current', i === at); if (i === at) slides[i].removeAttribute('aria-hidden'); else slides[i].setAttribute('aria-hidden', 'true') }
    counter.textContent = (at + 1) + ' / ' + slides.length
    prev.disabled = at === 0
    next.disabled = at === slides.length - 1
    try { history.replaceState(null, '', '#' + (at + 1)) } catch (error) { /* file: without history */ }
  }
  function open(on) {
    overview.hidden = !on
    toggle.setAttribute('aria-expanded', on ? 'true' : 'false')
    var items = overview.querySelectorAll('button[data-slide]')
    if (on && items[at]) items[at].focus()
    if (!on) toggle.focus()
  }
  prev.addEventListener('click', function () { show(at - 1) })
  next.addEventListener('click', function () { show(at + 1) })
  toggle.addEventListener('click', function () { open(overview.hidden) })
  print.addEventListener('click', function () { window.print() })
  overview.addEventListener('click', function (event) { var target = event.target.closest('button[data-slide]'); if (target) { show(Number(target.getAttribute('data-slide'))); open(false) } })
  doc.addEventListener('keydown', function (event) {
    if (event.altKey || event.ctrlKey || event.metaKey) return
    var key = event.key, onButton = event.target && event.target.tagName === 'BUTTON'
    if (key === 'Escape' && !overview.hidden) { event.preventDefault(); open(false); return }
    if (key === 'o' || key === 'O') { event.preventDefault(); open(overview.hidden); return }
    if (!overview.hidden || (onButton && (key === ' ' || key === 'Enter'))) return
    if (key === 'ArrowRight' || key === 'PageDown' || key === ' ') show(at + 1)
    else if (key === 'ArrowLeft' || key === 'PageUp') show(at - 1)
    else if (key === 'Home') show(0)
    else if (key === 'End') show(slides.length - 1)
    else return
    event.preventDefault()
  })
  var first = Number((location.hash || '').slice(1))
  show(first >= 1 ? first - 1 : 0)
})()
`
export const meetingStyle = `*{box-sizing:border-box}
html{color-scheme:light}
body{margin:0;font:16px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:#1b2430;background:#e9edf2}
.slide{display:flex;flex-direction:column;min-height:100vh;padding:40px 56px 24px;background:#fff;border-bottom:1px solid #d5dbe3}
.js .slide{display:none}
.js .slide.current{display:flex}
.slide header{margin-bottom:18px}
.eyebrow{margin:0 0 6px;font-size:12px;letter-spacing:.08em;font-weight:600;color:#56657a;text-transform:uppercase}
h1{margin:18vh 0 18px;font-size:44px;line-height:1.15;color:#0b5394}
h2{margin:0;font-size:30px;line-height:1.2;color:#0b5394}
h3{margin:0 0 6px;font-size:15px;text-transform:uppercase;letter-spacing:.05em;color:#56657a}
.slide .body{flex:1;overflow:auto}
.slide footer{display:flex;justify-content:space-between;margin-top:16px;padding-top:10px;border-top:1px solid #e3e7ec;font-size:12px;color:#6b778a}
.lead{font-size:20px}
.muted{color:#6b778a}
.warning{padding:10px 14px;border-left:4px solid #c27c0e;background:#fff6e5}
.tiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin:0}
.tile{padding:16px 18px;border:1px solid #d5dbe3;border-radius:8px;background:#f7f9fb}
.tile dt{font-size:13px;color:#56657a}
.tile dd{margin:4px 0 0}
.tile strong{display:block;font-size:34px;color:#1b2430}
.tile small{display:block;color:#56657a}
table{width:100%;border-collapse:collapse;font-size:15px}
th,td{padding:7px 10px;border-bottom:1px solid #e3e7ec;text-align:left;vertical-align:top}
th{font-size:13px;color:#56657a;background:#f2f5f8}
.num{text-align:right;font-variant-numeric:tabular-nums}
.facts{display:flex;flex-wrap:wrap;gap:8px 32px;margin:0 0 16px}
.facts dt{font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#56657a}
.facts dd{margin:2px 0 0;font-weight:600}
.facts.wide{margin-top:16px}
.columns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}
.suggested p,.suggested li{font-style:italic}
.part{margin-bottom:12px}
.part p{margin:0 0 6px}
.part ul{margin:0;padding-left:20px}
.byline{margin-top:12px;font-size:14px;color:#56657a}
.themes{margin:0;padding-left:0;list-style:none}
.themes li{padding:8px 0;border-bottom:1px solid #e3e7ec}
.fid{display:inline-block;min-width:64px;font-weight:700;color:#0b5394}
.controls{display:none}
.js .controls{display:flex;position:fixed;right:16px;bottom:16px;gap:6px;align-items:center;padding:6px;border:1px solid #d5dbe3;border-radius:8px;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.12)}
.controls button,#overview button{font:inherit;padding:6px 12px;border:1px solid #c4ccd6;border-radius:6px;background:#fff;color:#1b2430;cursor:pointer}
.controls button:disabled{opacity:.45;cursor:default}
.controls button:focus-visible,#overview button:focus-visible{outline:2px solid #0b5394;outline-offset:2px}
#counter{min-width:64px;text-align:center;font-variant-numeric:tabular-nums}
#overview{position:fixed;inset:0;overflow:auto;padding:32px 40px;background:rgba(233,237,242,.98)}
#overview[hidden]{display:none}
#overview h2{margin-bottom:16px}
#overview ol{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;margin:0;padding:0;list-style:none}
#overview button{display:block;width:100%;height:100%;min-height:72px;text-align:left}
#overview .n{display:block;font-size:12px;color:#56657a}
@media (max-width:700px){.slide{padding:24px 16px}.tiles,.columns{grid-template-columns:1fr}h1{font-size:32px}h2{font-size:24px}}
@page{size:landscape;margin:12mm}
@media print{body{background:#fff}.js .slide,.slide{display:flex;min-height:0;height:auto;padding:0;border:0;break-after:page;page-break-after:always}.slide:last-of-type{break-after:auto;page-break-after:auto}.slide .body{overflow:visible}.controls,.js .controls,#overview{display:none}}
`
// PIR-43: the whole file. One self-contained HTML file: the slides (every value through text()), the navigation script
// and the styles inline, the Content-Security-Policy of the interactive HTML file (no request of any kind).
export async function buildMeetingHtml(meeting: Meeting): Promise<string> {
  const slides = meetingSlides(meeting), title = meetingTitle(meeting.pi), total = slides.length
  const script = inlineScript(meetingScript), style = inlineStyle(meetingStyle)
  const [scriptHash, styleHash] = await Promise.all([sha256Base64(script), sha256Base64(style)])
  const sections = slides.map((slide, at) => `<section class="slide slide-${slide.kind}" id="slide-${at + 1}" aria-roledescription="slide" aria-label="${at + 1} of ${total}: ${text(slide.title)}">
<header><p class="eyebrow">${text(slide.eyebrow)}</p>${slide.kind === 'title' ? `<h1>${text(slide.title)}</h1>` : `<h2>${text(slide.title)}</h2>`}</header>
<div class="body">${slide.body}</div>
<footer><span>${text(title)} · built ${text(meeting.builtAt)}</span><span>${at + 1} / ${total}</span></footer>
</section>`).join('\n')
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${publishCsp(scriptHash, styleHash)}">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer">
<meta name="generator" content="Demand Planning Hub — PI Review Meeting">
<title>${text(title)} · ${text(meeting.builtAt)}</title>
<style>${style}</style>
</head>
<body>
<main>
${sections}
</main>
<nav id="overview" hidden aria-label="Slide overview"><h2>Slides</h2><ol>${slides.map((slide, at) => `<li><button type="button" data-slide="${at}"><span class="n">${at + 1}</span>${text(slide.title)}</button></li>`).join('')}</ol></nav>
<div class="controls" role="toolbar" aria-label="Slides"><button type="button" id="prev" aria-label="Previous slide">‹</button><span id="counter" aria-live="polite">1 / ${total}</span><button type="button" id="next" aria-label="Next slide">›</button><button type="button" id="toggle" aria-expanded="false" aria-controls="overview">Overview</button><button type="button" id="print">Print</button></div>
<script>${script}</script>
</body>
</html>
`
}

// PIR-47: a file of this app version — it starts with exactly the head written above, and its policy allows only this
// version's navigation script (by its hash) — so a file changed in Git cannot run code of its own when it is opened from
// the app. Anything else is only downloaded.
export async function isMeetingHtml(html: string): Promise<boolean> {
  const hash = await sha256Base64(inlineScript(meetingScript))
  const head = `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'sha256-${hash}'; style-src 'sha256-`
  return html.startsWith(head) && /^[A-Za-z0-9+/]{43}='; img-src data:; base-uri 'none'; form-action 'none'">\n/.test(html.slice(head.length))
}

// PIR-47: why the copy cannot be saved to Git ('' when it can): View as, the roles not loaded, sample data, no Git
// storage, a read-only token. The download is never blocked by any of these.
export interface MeetingSaveState { viewingAs: string; rolesMissing: boolean; isSample: boolean; connected: boolean; readOnly: boolean }
export function meetingSaveBlock(state: MeetingSaveState): string {
  if (state.viewingAs) return `Viewing as ${state.viewingAs}: the meeting is downloaded only, not saved to Git.`
  if (state.rolesMissing) return 'The roles file is not loaded yet: the meeting is downloaded only, not saved to Git.'
  if (state.isSample) return 'Synthetic sample data is loaded: the meeting is downloaded only, not saved to Git.'
  if (!state.connected) return 'Git storage is not connected (Admin → Data & history): the meeting is downloaded only.'
  if (state.readOnly) return 'Your Git token can read but not save: the meeting is downloaded only.'
  return ''
}
// PIR-40: who sees Conduct PI Meeting — the PI Review leads and the PI Review Setup holders.
export const canConductMeeting = (can: (action: 'pireview.post' | 'pireview.setup') => boolean) => can('pireview.post') || can('pireview.setup')
