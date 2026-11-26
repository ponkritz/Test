import test from 'node:test'
import assert from 'node:assert/strict'
import { bulkBlock, bulkSummary, bulkTargets, nextPiFor, ownReviewIn, runBulkReview, samePiProblem, startBulkForm } from '../src/piReviewBulk.ts'
import { buildReviewComment, emptyReviewForm, postReview, updateReview } from '../src/piReviewPost.ts'
import { builtInFormSetup } from '../src/piReviewSetup.ts'

// PIR-36, PIR-37: one PI review for several Features in My PI Review — which rows can be ticked, the form and the comment
// (the same as the single form's), and the job: a new comment or my review replaced per Feature, a failure on one not
// stopping the others. Synthetic data only.
const config = { organization: 'org', project: 'Quality', team: 'T' }
const feature = (id, iterationPath = 'Q\\PI 26.4') => ({ key: `org/quality/${id}`, id, title: `Feature ${id}`, type: 'Feature', state: 'Active', assignedTo: 'Rita Gomez', assignedToEmail: 'rita.gomez@example.com', iterationPath })
const it = (path, start, finish) => ({ name: path.split('\\').at(-1), path, attributes: { startDate: `${start}T00:00:00Z`, finishDate: `${finish}T00:00:00Z` } })
const tree = [it('Q\\PI 26.3', '2026-06-22', '2026-09-20'), it('Q\\PI 26.4', '2026-09-21', '2026-12-20'), it('Q\\PI 27.1', '2026-12-21', '2027-03-21')]
const today = new Date('2026-11-25T12:00:00Z')
const done = { state: 'done', comments: [], capped: false, readAt: '2026-11-25T10:00:00Z' }

test('PIR-36: a row can be ticked only when Write review… could post it and whether my review is there is known — each other row says why (TC-PIR-38)', () => {
  assert.equal(bulkBlock('', { discussion: done }), '')
  // The rights and the page's reasons of Write review… come first, word for word (View as, sample data, not the assignee…).
  assert.equal(bulkBlock('Read only while viewing as Ben Okafor: nothing is posted to Azure DevOps. Exit View as to post a review.', { discussion: done }), 'Read only while viewing as Ben Okafor: nothing is posted to Azure DevOps. Exit View as to post a review.')
  assert.equal(bulkBlock('', { discussion: done, busy: 'Feature #7 is in the running job.' }), 'Feature #7 is in the running job.')
  // PIR-49: which review is mine for the PI goes by its heading — the PI dates are no longer waited for.
  assert.equal(bulkBlock('', { discussion: done }), '')
  assert.match(bulkBlock('', { discussion: undefined }), /Discussion is still being read/)
  assert.match(bulkBlock('', { discussion: { state: 'loading' } }), /Discussion is still being read/)
  assert.equal(bulkBlock('', { discussion: { state: 'error', error: 'Azure DevOps refused the PAT (401).' } }), 'Its Discussion could not be read (Azure DevOps refused the PAT (401)), so whether your review is there is not known.')
})

test('PIR-36: the ticked Features become targets — my review of the chosen PI to replace where I have one; one form for one PI, started as the single form starts (TC-PIR-38)', () => {
  const items = [feature(201), feature(202), feature(205)]
  const targets = bulkTargets(items, (item) => item.id === 202 ? { comment: { id: 41, date: '2026-11-20T10:00:00Z' } } : undefined)
  assert.deepEqual(targets.map((target) => [target.item.id, target.replace?.commentId]), [[201, undefined], [202, 41], [205, undefined]])
  const writing = startBulkForm(targets, 'Q\\PI 26.4', items, builtInFormSetup(), { list: tree }, today)
  assert.equal(writing.problem, '')
  // Moves to by the same rule as the single form (today's PI 26.4 → PI 27.1 from the dates); the form setup's defaults,
  // never prefilled from one Feature's comment; the headings name the reviewed PI.
  assert.deepEqual(writing.next, nextPiFor('Q\\PI 26.4', items, builtInFormSetup(), { list: tree }, today))
  assert.equal(writing.next.pi, 'PI 27.1')
  assert.deepEqual(writing.initial, { ...emptyReviewForm('PI 27.1'), reviewedPi: 'PI 26.4' })
  assert.equal(writing.initial.move, 'No', 'No pre-selected, as the single form')
  // Features of different PIs: one comment cannot name both — the pop-up says so and does not post.
  assert.match(startBulkForm(bulkTargets([feature(1), feature(2, 'Q\\PI 26.3')], () => undefined), '', items, builtInFormSetup(), { list: tree }, today).problem, /^The ticked Features are in different PIs \(PI 26\.4, PI 26\.3\)/)
  assert.equal(samePiProblem([{ id: 1, pi: 'Q\\PI 26.4' }, { id: 2, pi: 'q\\pi 26.4' }]), '')
})

// The writes the review writer gives the job, with a fake Azure DevOps: each Feature's Discussion as it is now (my own
// review comment ID or none), posts and edits through the real postReview / updateReview with a recording transport.
function fakeWrites({ own = {}, failPost = [], failRead = [], failReread = [], busy = [] } = {}) {
  const sent = [], reads = []
  const transport = async (request) => {
    sent.push({ id: request.workItemId, operation: request.operation, commentId: request.commentId, text: request.comment })
    if (request.operation === 'add-comment' && failPost.includes(request.workItemId)) throw new Error('Azure DevOps did not add the comment (500): Service unavailable')
    return { id: request.commentId ?? 900 + sent.length }
  }
  const text = buildReviewComment(form)
  return { sent, reads, writes: {
    busy: (item) => busy.includes(item.id) ? `A review of #${item.id} is being written already.` : '',
    ownNow: async (item) => { reads.push(item.id); if (failRead.includes(item.id)) throw new Error('Network error'); return own[item.id] ? { id: own[item.id] } : undefined },
    post: (item) => postReview({ ...config, baseUrl: 'https://dev.azure.com/org' }, 'p', item, text, transport),
    edit: (item, commentId) => updateReview(config, 'p', item, commentId, text, transport),
    reread: async (item) => { reads.push(item.id); if (failReread.includes(item.id)) throw new Error('Network error') },
  } }
}
const form = { ...emptyReviewForm('PI 27.1'), learnings: 'Book the rig early', struggles: 'Parts late', mode: 'Offline Review', reviewedPi: 'PI 26.4' }

test('PIR-37: per Feature a new comment, or my review replaced — the very comment the single form posts, one Feature after another (TC-PIR-39)', async () => {
  const { sent, reads, writes } = fakeWrites({ own: { 202: 41 } })
  const lines = []
  const outcomes = await runBulkReview([{ item: feature(201) }, { item: feature(202), replace: { commentId: 41, date: '2026-11-20T10:00:00Z' } }, { item: feature(205) }], writes, (line) => lines.push(line))
  assert.deepEqual(outcomes.map((entry) => [entry.item.id, entry.result]), [[201, 'posted'], [202, 'replaced'], [205, 'posted']])
  assert.deepEqual(sent.map((entry) => [entry.id, entry.operation, entry.commentId]), [[201, 'add-comment', undefined], [202, 'update-comment', 41], [205, 'add-comment', undefined]])
  // Identical to the single Write review… comment: the same HTML, built once from the one form.
  for (const entry of sent) assert.equal(entry.text, buildReviewComment(form, builtInFormSetup()))
  // Read before each write (replace only the comment still mine) and again after it (the table's refresh).
  assert.deepEqual(reads, [201, 201, 202, 202, 205, 205])
  assert.ok(lines.includes('2 of 3: replacing your review of #202…'), lines.join(' | '))
  assert.ok(lines.includes('3 of 3: posting the review of #205…'))
  assert.deepEqual(bulkSummary(outcomes), { text: 'Posted 2 (#201, #205) · Replaced 1 (#202) · Failed 0.', failed: false })
})

test('PIR-37: a failure on one Feature does not stop the others; a review changed since the pop-up opened is never overwritten nor posted twice (TC-PIR-39)', async () => {
  const { sent, writes } = fakeWrites({ own: { 203: 77, 204: 55 }, failPost: [201], failRead: [206], failReread: [207], busy: [208] })
  const targets = [
    { item: feature(201) }, // the post fails
    { item: feature(202) }, // posted
    { item: feature(203), replace: { commentId: 41, date: '2026-11-20T10:00:00Z' } }, // my review is another comment now
    { item: feature(204) }, // I have a review now (posted elsewhere meanwhile)
    { item: feature(205), replace: { commentId: 42, date: '2026-11-20T10:00:00Z' } }, // my review is gone
    { item: feature(206) }, // its Discussion cannot be read
    { item: feature(207) }, // posted, but not read back
    { item: feature(208) }, // a single post of it is running
  ]
  const outcomes = await runBulkReview(targets, writes)
  assert.deepEqual(outcomes.map((entry) => [entry.item.id, entry.result]), [[201, 'failed'], [202, 'posted'], [203, 'failed'], [204, 'failed'], [205, 'failed'], [206, 'failed'], [207, 'posted'], [208, 'failed']])
  assert.deepEqual(sent.map((entry) => [entry.id, entry.operation]), [[201, 'add-comment'], [202, 'add-comment'], [207, 'add-comment']], 'nothing sent for 203…206 and 208')
  const why = Object.fromEntries(outcomes.map((entry) => [entry.item.id, entry.reason ?? entry.note]))
  assert.match(why[201], /^Azure DevOps did not add the comment \(500\)/)
  // KB-155: each reason says what happened and what to do.
  assert.equal(why[203], 'Your review of this PI was changed in Azure DevOps after the pop-up opened (it is another comment now). Nothing was changed: tick #203 again and use Update review… to replace it.')
  assert.equal(why[204], 'Your review of this PI was posted in Azure DevOps after the pop-up opened (it has your review of this PI now). Nothing was posted: tick #204 again and use Update review… to replace it.')
  assert.equal(why[205], 'Your review of this PI was deleted in Azure DevOps after the pop-up opened (it is no longer in its Discussion). Nothing was posted: tick #205 again and use Update review… to post it as a new comment.')
  assert.match(why[206], /^Its Discussion could not be read: Network error\. Nothing was posted\.$/)
  assert.match(why[207], /could not be read again/)
  assert.match(why[208], /being written already/)
  const summary = bulkSummary(outcomes)
  assert.equal(summary.failed, true)
  assert.match(summary.text, /^Posted 2 \(#202, #207\) · Replaced 0 · Failed 6 \(#201, #203, #204, #205, #206, #208\)\. #201: Azure DevOps did not add the comment/)
})

// KB-155, PIR-80: the one comparison of the pop-up and of the job's check — my newest comment headed for the reviewed PI.
test('PIR-80: my review of the PI in a Discussion — headed for it in either label form, mine by email else by name; not an old-format comment, another PI or another person’s; none unread or for others (TC-PIR-80)', () => {
  const rita = { email: 'rita.gomez@example.com', name: 'Rita Gomez' }
  const review = (id, pi, date, author = { author: 'Rita Gomez', authorEmail: 'rita.gomez@example.com' }) => ({ id, text: buildReviewComment({ ...emptyReviewForm(), learnings: 'L', struggles: 'S', move: 'No', mode: 'Offline Review', reviewedPi: pi }), date, ...author })
  const read = (comments) => ({ ...done, comments })
  const headed = review(61, 'PI 2026.4', '2026-11-20T10:00:00Z'), short = review(62, 'PI 26.4', '2026-11-19T10:00:00Z')
  assert.equal(ownReviewIn(read([headed]), 'Q\\PI 26.4', rita)?.comment.id, 61)
  assert.equal(ownReviewIn(read([short]), 'Q\\PI 2026.4', rita)?.comment.id, 62, 'PI 26.4 is PI 2026.4')
  assert.equal(ownReviewIn(read([short, headed]), 'Q\\PI 26.4', rita)?.comment.id, 61, 'the newest of mine')
  // Not mine for the PI: an old-format comment without the heading, a review of another PI, someone else's review.
  assert.equal(ownReviewIn(read([{ id: 63, text: 'Struggles: parts late\nLearnings: calibrate first', date: '2026-11-21T10:00:00Z', author: 'Rita Gomez', authorEmail: 'rita.gomez@example.com' }]), 'Q\\PI 26.4', rita), undefined)
  assert.equal(ownReviewIn(read([review(64, 'PI 26.3', '2026-11-21T10:00:00Z')]), 'Q\\PI 26.4', rita), undefined)
  assert.equal(ownReviewIn(read([review(65, 'PI 26.4', '2026-11-21T10:00:00Z', { author: 'Ben Okafor', authorEmail: 'ben.okafor@example.com' })]), 'Q\\PI 26.4', rita), undefined)
  // By email where both are known (a different display name is still mine); by name without an email.
  assert.equal(ownReviewIn(read([review(66, 'PI 26.4', '2026-11-21T10:00:00Z', { author: 'Gomez, Rita', authorEmail: 'Rita.Gomez@example.com' })]), 'Q\\PI 26.4', rita)?.comment.id, 66)
  assert.equal(ownReviewIn(read([review(67, 'PI 26.4', '2026-11-21T10:00:00Z', { author: 'rita  gomez' })]), 'Q\\PI 26.4', { name: 'Rita Gomez' })?.comment.id, 67)
  // Nothing when the Discussion is not read (still reading, failed) or for a lead showing another person.
  assert.equal(ownReviewIn({ state: 'loading' }, 'Q\\PI 26.4', rita), undefined)
  assert.equal(ownReviewIn({ state: 'error', error: 'x' }, 'Q\\PI 26.4', rita), undefined)
  assert.equal(ownReviewIn(undefined, 'Q\\PI 26.4', rita), undefined)
  assert.equal(ownReviewIn(read([headed]), 'Q\\PI 26.4', rita, undefined, true), undefined)
})
