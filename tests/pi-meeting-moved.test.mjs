import test from 'node:test'
import assert from 'node:assert/strict'
import { clearHistories, historyOf, historyPis, isLaterPi, isSamePi, movedCandidates, movedFeatures, movedLabel, movedPi, movedReadNote, readHistories, wasInPi } from '../src/piMeetingMoved.ts'
import { meetingFeatures, meetingSlides } from '../src/piMeeting.ts'
import { carriedForward, carriedTo, carryStreak, meetingExec } from '../src/piMeetingData.ts'
import { executiveLines } from '../src/piMeetingExec.ts'
import { defaultMeetingSettings } from '../src/piMeetingSettings.ts'
import { builtInFormSetup } from '../src/piReviewSetup.ts'
import { piFeatures } from '../src/piReview.ts'

// PIR-91…PIR-95 (TC-PIR-93…TC-PIR-97): a Feature moved to a later PI in Azure DevOps still counts in the PI it was in.
// Synthetic data only: PI 26.3, PI 26.4 (the meeting), PI 27.1 and PI 27.2; the Epics Tools #100 and Audits #110, the
// absence Epic #999.
const base = { organization: 'o', project: 'p', assignedTo: 'Rita Gomez', areaPath: 'p', tags: '', url: '', syncedAt: '' }
const wi = (id, workItemType, title, extra = {}) => ({ ...base, key: `o/p/${id}`, id, workItemType, title, state: 'Active', iterationPath: 'p', ...extra })
const tools = wi(100, 'Epic', 'Tools'), audits = wi(110, 'Epic', 'Audits'), absence = wi(999, 'Epic', 'Absence')
const feature = (id, epic, iterationPath, extra = {}) => wi(id, 'Feature', `Feature ${id}`, { parentId: epic.id, iterationPath, createdDate: '2026-08-01T00:00:00Z', ...extra })
const pi = 'p\\PI 26.4'
const items = [tools, audits, absence,
  feature(201, tools, 'p\\PI 26.4\\Sprint 2'), // in the PI now: not a candidate
  feature(202, tools, 'p\\PI 27.1'), // later
  feature(203, audits, 'p\\PI 27.2\\Sprint 1'), // later, in a Sprint
  feature(204, audits, 'p\\PI 26.3'), // earlier
  feature(205, audits, 'p'), // no PI
  feature(206, audits, 'p\\PI 27.1', { state: 'Removed' }),
  feature(207, absence, 'p\\PI 27.1'),
  wi(208, 'User Story', 'Story', { parentId: 202, iterationPath: 'p\\PI 27.1' }),
  feature(209, tools, 'p\\pi 2027.1'), // later, another spelling
]
const ids = (list) => list.map((item) => item.id)

test('PIR-91, PIR-95: the candidates are the Features now in a later PI — not Removed, not under the absence Epic, not already in the PI (TC-PIR-93)', () => {
  assert.deepEqual(ids(movedCandidates(items, pi, { absenceEpicId: 999 })), [202, 203, 209])
  // Without the absence Epic set, its Feature is a candidate like any other (the rule of piFeatures).
  assert.deepEqual(ids(movedCandidates(items, pi)), [202, 203, 207, 209])
  // A Feature already in the PI's list (e.g. by a User Story with "include User Stories") is not read again.
  assert.deepEqual(ids(movedCandidates(items, pi, { absenceEpicId: 999, known: [202] })), [203, 209])
  // For the previous PI the Features of the meeting's PI are candidates too.
  assert.deepEqual(ids(movedCandidates(items, 'p\\PI 26.3', { absenceEpicId: 999 })), [201, 202, 203, 209])
  assert.deepEqual(movedCandidates(items, ''), [])
  // PI order by number: two-digit and four-digit years are the same PI; 26.10 is after 26.9.
  assert.equal(isLaterPi('p\\PI 2027.1', 'p\\PI 26.4'), true)
  assert.equal(isLaterPi('p\\PI 2026.4', 'p\\PI 26.4'), false)
  assert.equal(isLaterPi('p\\PI 26.10', 'p\\PI 26.9'), true)
  assert.equal(isLaterPi('p\\PI 26.3', 'p\\PI 26.4'), false)
  // PIR-95: the PI Review page's own list is unchanged — a moved Feature is not in piFeatures.
  assert.deepEqual(ids(piFeatures(items, pi, { absenceEpicId: 999 })), [201])
})

const update = (oldValue, newValue, more = {}) => ({ revisedDate: '2026-11-01T00:00:00Z', fields: { 'System.IterationPath': { ...(oldValue ? { oldValue } : {}), newValue }, ...more } })
test('PIR-91: the history shows the Iteration Path in the PI — old or new value, a Sprint, letter case, a renamed parent, another year spelling; no IterationPath change: none (TC-PIR-94)', () => {
  // Created in a Sprint of PI 26.4, moved to PI 27.1.
  assert.deepEqual(historyPis([update('', 'p\\PI 26.4\\Sprint 1'), update('p\\PI 26.4\\Sprint 1', 'p\\PI 26.4\\Sprint 3'), update('p\\PI 26.4\\Sprint 3', 'p\\PI 27.1')]), ['p\\PI 26.4', 'p\\PI 27.1'])
  // Only the old value tells (the first revision was not returned with the path).
  assert.equal(wasInPi(historyPis([update('P\\pi 26.4', 'p\\PI 27.1')]), pi), true)
  // A renamed parent node and a four-digit year: still PI 26.4.
  assert.equal(wasInPi(historyPis([update('Old Project\\PI 26.4', 'p\\PI 27.1')]), pi), true)
  assert.equal(wasInPi(historyPis([update('p\\PI 2026.4\\Sprint 2', 'p\\PI 27.1')]), pi), true)
  assert.equal(isSamePi('Q\\Program Increment 26.4', 'p\\PI 26.4'), true)
  // Moved back and forth: 27.1 → 26.4 → 27.2 — in the PI, once.
  const pis = historyPis([update('', 'p\\PI 27.1'), update('p\\PI 27.1', 'p\\PI 26.4'), update('p\\PI 26.4', 'p\\PI 27.1'), update('p\\PI 27.1', 'p\\PI 27.2')])
  assert.deepEqual(pis, ['p\\PI 27.1', 'p\\PI 26.4', 'p\\PI 27.2'])
  assert.equal(wasInPi(pis, pi), true)
  // Never in PI 26.4: no IterationPath change at all, other fields only, a path without a PI, another PI only.
  assert.deepEqual(historyPis([{ fields: { 'System.State': { oldValue: 'New', newValue: 'Active' } } }, { revisedDate: 'x' }]), [])
  assert.deepEqual(historyPis([update('', 'p'), update('p', 'p\\Backlog')]), [])
  assert.equal(wasInPi(historyPis([update('p\\PI 26.3', 'p\\PI 27.1')]), pi), false)
  assert.equal(wasInPi(historyPis([update('p\\PI 26.41', 'p\\PI 27.1')]), pi), false, 'PI 26.41 is not PI 26.4')
  // The moved Features with the PI they are in now; a candidate without a history left out and counted.
  const candidates = movedCandidates(items, pi, { absenceEpicId: 999 })
  const history = { 202: ['p\\PI 26.4', 'p\\PI 27.1'], 203: ['p\\PI 26.3', 'p\\PI 27.2'] }
  const found = movedFeatures(candidates, pi, (item) => history[item.id])
  assert.deepEqual(found.moved.map((entry) => [entry.item.id, entry.movedTo]), [[202, 'PI 27.1']])
  assert.equal(found.unread, 1, '209: no history known')
  assert.equal(movedPi('p\\pi 2027.1'), 'PI 2027.1')
  assert.equal(movedLabel('PI 27.1'), 'Moved to PI 27.1')
})

test('PIR-93: the histories are read with the existing updates read, a few at a time, once per page load; a failed or blocked read is left out with the count and why (TC-PIR-95)', async () => {
  clearHistories()
  const calls = []
  const pages = { 202: [update('p\\PI 26.4', 'p\\PI 27.1')], 203: [update('', 'p\\PI 27.2')] }
  const read = async (operation, extra) => { calls.push([operation, extra.workItemId]); if (extra.workItemId === 209) throw new Error('Azure DevOps returned 500.'); return { value: pages[extra.workItemId] } }
  const candidates = movedCandidates(items, pi, { absenceEpicId: 999 })
  const progress = []
  const result = await readHistories(candidates, read, { rateWait: () => null, onProgress: (done, total) => progress.push(`${done} of ${total}`) })
  assert.deepEqual(calls.map((call) => call[0]), ['updates', 'updates', 'updates'], 'only the updates read (a GET)')
  assert.deepEqual([result.read, result.failed], [2, 1])
  assert.equal(progress.at(-1), '3 of 3')
  assert.deepEqual(historyOf(candidates[0]), ['p\\PI 26.4', 'p\\PI 27.1'])
  assert.equal(historyOf(candidates[2]), undefined, 'a failed read is not kept')
  const found = movedFeatures(candidates, pi)
  assert.deepEqual([found.moved.map((entry) => entry.item.id), found.unread], [[202], 1])
  // Read again: only the one not known yet.
  calls.length = 0
  await readHistories(candidates, read, { rateWait: () => null })
  assert.deepEqual(calls.map((call) => call[1]), [209])
  // A changed Feature (a new Changed Date) is read again.
  calls.length = 0
  await readHistories([{ ...candidates[0], changedDate: '2026-11-27T08:00:00Z' }], read, { rateWait: () => null })
  assert.deepEqual(calls.map((call) => call[1]), [202])
  // A refused access stops the read; Azure DevOps' "slow down" twice stops it too, the rest left unread.
  clearHistories()
  const refused = await readHistories(candidates, async () => { throw new Error('Access denied. Check project access.') }, { rateWait: () => null })
  assert.equal(refused.stopped, 'access')
  const slow = await readHistories(candidates, async () => { throw new Error('Azure DevOps (429) Retry after 1 s.') }, { rateWait: () => 1, sleep: async () => {} })
  assert.equal(slow.stopped, 'rate-limit')
  assert.equal(movedFeatures(candidates, pi).unread, 3)
  // A reply without updates is a failed read, not an empty history.
  const odd = await readHistories(candidates.slice(0, 1), async () => ({ count: 0 }), { rateWait: () => null })
  assert.equal(odd.failed, 1)
  // The job result: how many and why; nothing when none.
  assert.equal(movedReadNote(0, 'x'), '')
  assert.equal(movedReadNote(2, 'Connect the Time Writing connection (with its PAT) to read the Discussions.'), ' 2 Features now in a later PI were not checked for a move out of this PI or the previous one (Connect the Time Writing connection (with its PAT) to read the Discussions): left out.')
  assert.match(movedReadNote(1, 'the history could not be read'), /^ 1 Feature now in a later PI was not checked/)
  clearHistories()
})

// The meeting of PI 26.4: 201 reviewed Move = Yes (carried by its review), 202 moved to PI 27.1 without a review, 203
// moved to PI 27.2 AND reviewed Move = Yes (counts once), 204 reviewed Move = No.
const setup = builtInFormSetup(), start = '2026-09-01'
const headed = (forPi, move, mode = 'Offline Review') => `Feature Review for ${forPi}\nLearnings of ${forPi}:\n- calibrate first\nStruggles of ${forPi}:\n- vendor late\nWhether the feature needs to be shifted to PI 27.1 : ${move}\nAdvise to discuss the Feature during the Review meeting: ${mode}`
const done = (texts) => ({ state: 'done', comments: texts.map((text, at) => ({ id: at + 1, date: `2026-11-0${at + 1}T09:00:00Z`, text, author: 'Rita Gomez' })), capped: false, readAt: '2026-11-26T10:00:00Z' })
const discussions = {
  'o/p/201': done([headed('PI 26.4', 'Yes')]),
  'o/p/203': done([headed('PI 26.4', 'Yes', 'Discuss during Meeting')]),
  'o/p/204': done([headed('PI 26.4', 'No')]),
}
const meetingRows = [
  { item: feature(201, tools, 'p\\PI 26.4'), epic: tools },
  { item: feature(202, tools, 'p\\PI 27.1'), epic: tools, movedTo: 'PI 27.1', wasIn: ['p\\PI 26.3', 'p\\PI 26.4', 'p\\PI 27.1'] },
  { item: feature(203, audits, 'p\\PI 27.2'), epic: audits, movedTo: 'PI 27.2', wasIn: ['p\\PI 26.4', 'p\\PI 27.2'] },
  { item: feature(204, audits, 'p\\PI 26.4'), epic: audits },
]
const features = meetingFeatures(meetingRows, (key) => discussions[key], setup, start, 'PI 26.4')
const node = (path, from, to) => ({ name: path.split('\\').at(-1), path: `\\p\\Iteration\\${path}`, attributes: { startDate: `${from}T00:00:00Z`, finishDate: `${to}T00:00:00Z` } })
const iterations = [node('PI 26.3', '2026-06-08', '2026-09-06'), node('PI 26.4', '2026-09-07', '2026-11-29')]
const execOf = (extra = {}) => meetingExec({
  pi: 'PI 26.4', features, iterations, items: [tools, audits], today: '2026-11-27', start, setup, settings: defaultMeetingSettings(), pis: ['p\\PI 26.4', 'p\\PI 26.3'],
  previousFeatures: [{ id: 150, title: 'Old', epic: 'Tools', epicId: 100, state: 'Active', status: 'none', movedTo: 'PI 26.4', wasIn: ['p\\PI 26.3', 'p\\PI 26.4'] }, { id: 151, title: 'Older', epic: 'Tools', epicId: 100, state: 'Active', status: 'none' }],
  discussionOf: (entry) => discussions[`o/p/${entry.id}`], releases: [], streamEpics: {}, moveOf: () => '', ...extra,
})
const meetingOf = (extra = {}) => ({ pi: 'PI 26.4', builtAt: '27 Nov 2026, 10:00 CET', builtBy: 'Rita Gomez', start, features, settings: defaultMeetingSettings(), exec: execOf(), ...extra })
const plain = (html) => html.replace(/ class="c l\d+"(?: title="[^"]*")?/g, '').replace(/ class="([^"]*?) c l\d+"(?: title="[^"]*")?/g, ' class="$1"').replace(/<(div|span)>([^<]*)<\/\1>/g, '$2')
const bodyOf = (meeting, kind) => meetingSlides(meeting).filter((slide) => slide.kind === kind).map((slide) => plain(slide.body)).join('\n')

test('PIR-94: a moved Feature counts as carried forward — without a review too, and once with a Move = Yes review; the executive summary, completion, trend, repeat carry-overs and team dividers include it (TC-PIR-96)', () => {
  assert.deepEqual(features.map((entry) => [entry.id, entry.status, entry.movedTo ?? '']), [[201, 'reviewed', ''], [202, 'unread', 'PI 27.1'], [203, 'reviewed', 'PI 27.2'], [204, 'reviewed', '']])
  assert.deepEqual(features.filter(carriedForward).map((entry) => entry.id), [201, 202, 203])
  assert.deepEqual(features.map(carriedTo), ['PI 27.1', 'PI 27.1', 'PI 27.2', 'PI 27.1'])
  // Executive summary: Tools 2 carried (201 by review, 202 moved), Audits 1 (203 both, once).
  assert.deepEqual(executiveLines(meetingOf()).map((line) => [line.group.name, line.features, line.carried]), [['Tools', 2, 2], ['Audits', 2, 1]])
  const executive = bodyOf(meetingOf(), 'executive')
  assert.match(executive, /Carried forward<\/dt><dd><strong>3<\/strong><small>2 to PI 27\.1, 1 to PI 27\.2<\/small>/)
  assert.match(executive, /or the Feature was moved to a later PI in Azure DevOps \(counted once\)/)
  // Review completion: the moved Features are Features of the PI (202 not reviewed).
  assert.match(bodyOf(meetingOf(), 'completion'), /3 of 4 Features have a review headed for PI 26\.4/)
  // PI-over-PI: the previous PI's moved Feature counts; before PI Review started only the moves count.
  const exec = execOf()
  assert.equal(exec.previous.carried, 1)
  const early = execOf({ start: '2026-09-10' })
  assert.equal(early.previous.carried, 1)
  assert.match(early.previous.why.carried, /only the Features moved to a later PI count/)
  assert.equal(execOf({ start: '2026-09-10', previousFeatures: [{ id: 151, title: 'Older', epic: 'Tools', epicId: 100, state: 'Active', status: 'none' }] }).previous.carried, null, 'no move, no reviews: —')
  // Repeat carry-overs: 202 was in PI 26.3 and PI 26.4 and is in PI 27.1 now — moved out of both, two PIs in a row.
  assert.deepEqual(exec.streaks.map((entry) => [entry.id, entry.movedTo ?? '', entry.pis]), [[202, 'PI 27.1', ['PI 26.4', 'PI 26.3']]])
  assert.deepEqual(carryStreak(undefined, setup, start, ['PI 26.4', 'PI 26.3'], ['p\\PI 26.4']), ['PI 26.4'], 'moved out of PI 26.4 only')
  assert.deepEqual(carryStreak(undefined, setup, start, ['PI 26.4']), [], 'unchanged without a history')
  // Team divider: the team's Features in the PI include the moved one, said in the tile.
  const teams = { ...defaultMeetingSettings(), teams: [{ name: 'Quality Tools', short: 'QTL', epics: [100] }, { name: 'Platform Services', short: 'PLS', epics: [110] }] }
  const dividers = meetingSlides(meetingOf({ settings: teams })).filter((slide) => slide.kind === 'team').map((slide) => plain(slide.body))
  assert.match(dividers[0], /Features in the PI<\/dt><dd><strong>2<\/strong><small>1 moved to a later PI<\/small>/)
  assert.match(dividers[1], /Features in the PI<\/dt><dd><strong>2<\/strong><small>1 moved to a later PI<\/small>/)
})

test('PIR-92: "Moved to PI X" on the moved Feature’s slide and in the tables listing Features; escaped; the Releases and Long-running slides unchanged (TC-PIR-97)', () => {
  const meeting = meetingOf()
  const slides = meetingSlides(meeting)
  const own = slides.find((slide) => slide.title === '#203 Feature 203')
  assert.match(plain(own.body), /<p class="moved">Moved to PI 27\.2<\/p>/)
  assert.doesNotMatch(plain(slides.find((slide) => slide.title === '#201 Feature 201').body), /Moved to/)
  // Features not reviewed: 202 with its label.
  assert.match(bodyOf(meeting, 'not-reviewed'), /Feature 202 <span class="moved">Moved to PI 27\.1<\/span>/)
  // Repeat carry-overs and Topics for discussion.
  assert.match(bodyOf(meeting, 'repeat'), /Feature 202 <span class="moved">Moved to PI 27\.1<\/span>/)
  assert.match(bodyOf(meeting, 'topics'), /Feature 203 <span class="moved">Moved to PI 27\.2<\/span>/)
  // A hostile PI name stays text.
  const hostile = meetingFeatures([{ item: feature(202, tools, 'p'), epic: tools, movedTo: '<b>PI 27.1</b>', wasIn: [] }], () => undefined, setup, start, 'PI 26.4')
  assert.match(bodyOf({ ...meeting, features: hostile, exec: undefined }, 'not-reviewed'), /Moved to &lt;b&gt;PI 27\.1&lt;\/b&gt;/)
  // Unchanged: the Releases and Long-running slides do not name the moves.
  assert.doesNotMatch(bodyOf(meeting, 'releases') + bodyOf(meeting, 'long-running'), /Moved to/)
})
