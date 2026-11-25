import test from 'node:test'
import assert from 'node:assert/strict'
import { buildReviewComment, emptyReviewForm, myReviewOf, nextPi, piText, postReview, readBackReview, reviewFormFrom, reviewFormProblems, reviewLines, reviewPageBlock, reviewPostBlock } from '../src/piReviewPost.ts'
import { reviewModeOf, reviewSplit, splitReviewComment, reviewFooter } from '../src/piReview.ts'
import { commentHtml, guardAzureWrites, requestAzure, reviewPostAllowed } from '../src/azureDevOps.ts'
import { commentText } from '../src/workItemEdit.ts'
import { defaultPolicy, parseAccess, rightsFor, serializeAccess } from '../src/access.ts'

// PI Review, the review form (PIR-13…PIR-18, CON-113). Synthetic data only.
const config = { organization: 'org', project: 'Quality', team: 'T' }
const form = { learnings: 'Book the rig early\n* share <the> calendar & more\n2) plan the docs', struggles: 'Vendor late', move: 'Yes', moveReason: 'two stories left\n- docs pending', movePi: 'PI 26.5', mode: 'Discuss during Meeting', remarks: 'Thanks <b>team</b>' }

test('PIR-14: the comment in the standard format — paragraph lines kept, bullets as "- ", numbers kept, the Move question with the PI, the footer (TC-PIR-13)', () => {
  assert.equal(buildReviewComment(form), [
    'Learnings :', 'Book the rig early', '- share <the> calendar & more', '2) plan the docs',
    'Struggles :', 'Vendor late',
    'Whether the feature needs to be shifted to PI 26.5 : Yes - two stories left', '- docs pending',
    'Advise to discuss the Feature during the Review meeting : Discuss during Meeting',
    'Additional Remarks :', 'Thanks <b>team</b>',
    reviewFooter,
  ].join('\n'))
  assert.deepEqual(reviewLines('  a  \n\n• b\n+ c\n– d\n3. e'), ['a', '- b', '- c', '- d', '3. e'])
  // Escaped as it is sent (commentHtml): no markup from the user ever reaches Azure DevOps.
  const sent = commentHtml(buildReviewComment(form))
  assert.ok(!sent.includes('<b>') && !sent.includes('<the>'))
  assert.match(sent, /share &lt;the&gt; calendar &amp; more<br>/)
  assert.match(sent, /Thanks &lt;b&gt;team&lt;\/b&gt;<br>/)
  // Optional parts left out: no remarks, no reason; empty texts (the Close flow) leave their heading out.
  const short = buildReviewComment({ ...emptyReviewForm('PI 26.5'), mode: 'Offline Review' })
  assert.equal(short, `Whether the feature needs to be shifted to PI 26.5 : No\nAdvise to discuss the Feature during the Review meeting : Offline Review\n${reviewFooter}`)
})

test('PIR-14: round trip — build → sent as HTML → commentText → splitReviewComment gives back every field; the footer lands nowhere (TC-PIR-13)', () => {
  const back = splitReviewComment(commentText(commentHtml(buildReviewComment(form))))
  assert.deepEqual(back, {
    learnings: 'Book the rig early\nshare <the> calendar & more\nplan the docs', struggles: 'Vendor late',
    move: 'Yes - two stories left\ndocs pending', moveValue: 'Yes', moveRest: 'two stories left\ndocs pending', movePi: 'PI 26.5',
    review: 'Discuss during Meeting', reviewMode: 'Discuss during Meeting', remarks: 'Thanks <b>team</b>',
  })
  assert.deepEqual(readBackReview(buildReviewComment(form)).from, 'Headings')
  assert.deepEqual(reviewFormProblems(form), [])
  const no = readBackReview(buildReviewComment({ ...form, move: 'No', moveReason: '', mode: 'Offline Review', remarks: '' }))
  assert.deepEqual([no.moveValue, no.moveRest, no.reviewMode, no.remarks], ['No', '', 'Offline Review', undefined])
})

test('PIR-13: the form checks — required fields, the PI, and a line PI Review would read back differently (TC-PIR-14)', () => {
  assert.deepEqual(reviewFormProblems({ ...emptyReviewForm('PI 26.5') }).length, 3, 'Learnings, Struggles and the Review meeting advice')
  assert.equal(emptyReviewForm().move, 'No', 'Move to next PI pre-selected No (UI-STANDARDS §12 exception)')
  assert.match(reviewFormProblems({ ...form, move: '' }).join(' '), /Yes or No/)
  assert.match(reviewFormProblems({ ...form, move: 'Partly' }).join(' '), /Yes or No/, 'Partly is never offered')
  assert.match(reviewFormProblems({ ...form, movePi: '26.5' }).join(' '), /PI 26\.5/)
  assert.match(reviewFormProblems({ ...form, mode: '' }).join(' '), /Review meeting/)
  assert.match(reviewFormProblems({ ...form, learnings: 'No issues: all fine' }).join(' '), /read Learnings, Struggles back differently/)
  assert.match(reviewFormProblems({ ...form, remarks: 'Next PI: maybe' }).join(' '), /back differently/)
  // PIR-18: in the Close flow the texts are optional; Move and the advice are not.
  assert.deepEqual(reviewFormProblems({ ...emptyReviewForm('PI 26.5'), mode: 'Offline Review' }, { optionalTexts: true }), [])
  assert.equal(reviewFormProblems({ ...emptyReviewForm('PI 26.5') }, { optionalTexts: true }).length, 1)
})

test('PIR-13: the next PI after the reviewed one — the next later PI in the list, else the last number plus one (TC-PIR-13)', () => {
  assert.equal(nextPi('Q\\PI 26.4', ['Q\\PI 27.1', 'Q\\PI 26.4', 'Q\\PI 26.3', 'Q\\PI 26.10']), 'PI 26.10')
  assert.equal(nextPi('Q\\PI 26.4', ['Q\\PI 26.4', 'Q\\PI 26.3']), 'PI 26.5')
  assert.equal(nextPi('Q\\PI 2026.9', []), 'PI 2026.10')
  assert.equal(nextPi('Q\\Program Increment', []), '')
  assert.deepEqual([piText('pi26.5'), piText('PI 26.5 '), piText('26.5')], ['PI 26.5', 'PI 26.5', ''])
})

test('PIR-13: the form starts from the latest review split by headings; Partly starts at No (TC-PIR-14)', () => {
  const split = reviewSplit(buildReviewComment(form))
  assert.deepEqual(reviewFormFrom(split, 'PI 99.1'), { ...form, learnings: 'Book the rig early\nshare <the> calendar & more\nplan the docs', moveReason: 'two stories left\ndocs pending' })
  assert.equal(reviewFormFrom(reviewSplit('Move to next PI: Partly - docs'), 'PI 26.5').move, 'No')
  assert.deepEqual(reviewFormFrom(reviewSplit('We were blocked by the vendor.'), 'PI 26.5'), emptyReviewForm('PI 26.5'), 'keywords only: not prefilled')
})

test('PIR-15: the Review meeting and Additional Remarks headings and their short forms (TC-PIR-15)', () => {
  const full = splitReviewComment('Struggles: rig\nAdvise to discuss the Feature during the Review meeting?\nOffline\nAdditional Remarks (If Any): none really')
  assert.deepEqual([full.review, full.reviewMode, full.remarks], ['Offline', 'Offline Review', 'none really'])
  assert.equal(splitReviewComment('Review meeting: yes').reviewMode, 'Discuss during Meeting')
  assert.equal(splitReviewComment('Discuss in meeting - Discuss during Meeting').reviewMode, 'Discuss during Meeting')
  assert.equal(splitReviewComment('Remarks:\nthanks').remarks, 'thanks')
  assert.equal(splitReviewComment('Learnings: a. Additional comments: b').remarks, 'b')
  assert.deepEqual([reviewModeOf('in the meeting please'), reviewModeOf('no'), reviewModeOf('maybe')], ['Discuss during Meeting', 'Offline Review', undefined])
  assert.deepEqual(splitReviewComment('We will discuss in the review meeting tomorrow.'), {}, 'in a sentence: no heading')
  assert.equal(splitReviewComment(`Learnings: a\n${reviewFooter}`).learnings, 'a', 'the footer is dropped')
})

const viewer = (actions, extra = {}) => ({ can: (key) => actions.includes(key), readOnly: false, viewingAs: '', email: 'ana@example.com', isSample: false, config, pat: 'p', ...extra })
const feature = (email) => ({ id: 7, key: 'org/quality/7', assignedTo: email ? 'Ana' : 'Ben', ...(email ? { assignedToEmail: email } : {}) })
test('CON-113: who may post — the assignee (with Add a comment), a lead (PI Review: post), nobody else; the page reasons (TC-CON-70)', async () => {
  assert.equal(reviewPostBlock(viewer(['work.comment']), feature('ana@example.com')), '', 'the assignee')
  assert.equal(reviewPostBlock(viewer(['pireview.post']), feature('ben@example.com')), '', 'a lead, on any Feature')
  assert.match(reviewPostBlock(viewer(['work.comment']), feature('ben@example.com')), /Only the Feature’s assignee \(Ana\) or a lead/)
  assert.match(reviewPostBlock(viewer([]), feature('ana@example.com')), /does not allow “Add a comment”/)
  assert.match(reviewPostBlock(viewer(['work.comment'], { email: '' }), feature('ana@example.com')), /enter your work email/)
  assert.match(reviewPageBlock(viewer(['pireview.post'], { readOnly: true })), /access roles are not loaded/)
  assert.match(reviewPageBlock(viewer(['pireview.post'], { viewingAs: 'the role Team Member' })), /Read only while viewing as the role Team Member/)
  assert.match(reviewPageBlock(viewer(['pireview.post'], { isSample: true })), /Synthetic sample data/)
  assert.match(reviewPageBlock(viewer(['pireview.post'], { pat: '' })), /with its PAT/)
  assert.match(reviewPageBlock(viewer(['pireview.post'], { config: { ...config, baseUrl: 'https://tfs.example.com/tfs/Coll' } })), /dev\.azure\.com\) only/)
  // The guard every write passes: refused before sending unless the rights allow it (the writer's email from useAccess).
  const can = (list) => (key) => list.includes(key)
  assert.equal(reviewPostAllowed('Ana@Example.com', can(['work.comment']), 'ana@example.com'), true)
  assert.equal(reviewPostAllowed('', can(['work.comment']), ''), false, 'no email on either side: not the assignee')
  assert.equal(reviewPostAllowed('ben@example.com', can(['work.comment']), 'ana@example.com'), false)
  assert.equal(reviewPostAllowed('ben@example.com', can(['pireview.post']), 'ana@example.com'), true)
  const original = globalThis.fetch, sent = []
  globalThis.window = {}
  try {
    globalThis.fetch = async (url, init) => { sent.push({ url, body: init.body }); return new Response('{"id":91}', { status: 200, headers: { 'content-type': 'application/json' } }) }
    guardAzureWrites(can(['work.comment']), undefined, 'ana@example.com')
    await assert.rejects(postReview(config, 'p', { id: 7, assignedToEmail: 'ben@example.com' }, 'Learnings :\nA'), /Only the Feature’s assignee or a lead/)
    assert.equal(sent.length, 0, 'nothing sent')
    assert.equal(await postReview(config, 'p', { id: 7, assignedToEmail: 'ana@example.com' }, 'Learnings :\n<b>A</b>'), 91)
    assert.equal(sent[0].url, 'https://dev.azure.com/org/Quality/_apis/wit/workItems/7/comments?api-version=7.1-preview.4')
    assert.deepEqual(JSON.parse(sent[0].body), { text: 'Learnings :<br>&lt;b&gt;A&lt;/b&gt;' })
    await assert.rejects(requestAzure({ ...config, pat: 'p', operation: 'comments', workItemId: 7, reviewOf: 'x' }), /Invalid PI Review post/)
    guardAzureWrites(can([]), 'read only', '')
    await assert.rejects(postReview(config, 'p', { id: 7, assignedToEmail: 'ana@example.com' }, 'x'), /read only/)
    // 401 / 403 / 429 on the post say why.
    guardAzureWrites(can(['pireview.post']))
    for (const [status, reason] of [[401, /PAT was rejected/], [403, /Access denied.*Read & Write/], [429, /\(429\)\. Retry after 5 s\. The comment was not added/]]) {
      globalThis.fetch = async () => new Response('{}', { status, headers: { 'content-type': 'application/json', 'Retry-After': '5' } })
      await assert.rejects(postReview(config, 'p', { id: 7 }, 'x'), reason)
    }
  } finally { delete globalThis.window; globalThis.fetch = original; guardAzureWrites(() => true) }
})

test('CON-113: “PI Review: post the review of a Feature” (permissions 7) — Tool Owner, Admin and People Manager in the starting matrix and for an older file (TC-CON-70)', () => {
  const policy = defaultPolicy()
  for (const role of ['Tool Owner', 'Admin', 'People Manager']) assert.ok(policy.roles[role].actions.includes('pireview.post'), role)
  for (const role of ['Product Owner', 'Scrum Master', 'Team Member']) assert.ok(!policy.roles[role].actions.includes('pireview.post'), role)
  assert.match(serializeAccess(policy), /"permissions": 7/)
  const v6 = JSON.parse(serializeAccess(policy)); v6.permissions = 6
  for (const rights of Object.values(v6.roles)) rights.actions = rights.actions.filter((key) => key !== 'pireview.post')
  const read = parseAccess(JSON.stringify(v6))
  assert.ok(read.roles['People Manager'].actions.includes('pireview.post') && read.roles.Admin.actions.includes('pireview.post'))
  assert.ok(!read.roles['Team Member'].actions.includes('pireview.post'))
  read.roles['People Manager'].actions = read.roles['People Manager'].actions.filter((key) => key !== 'pireview.post')
  assert.ok(!parseAccess(serializeAccess(read)).roles['People Manager'].actions.includes('pireview.post'), 'saved again: Not set stays')
  assert.equal(rightsFor(null, 'x@example.com').actions.has('pireview.post'), false)
})

test('PIR-17: my latest review — the newest comment I wrote with the review headings (TC-PIR-17)', () => {
  const comments = [
    { id: 3, author: 'Ben Okafor', text: 'Learnings: theirs', date: '2026-11-23T10:00:00Z' },
    { id: 2, author: 'ana costa', text: 'Thanks all', date: '2026-11-22T10:00:00Z' },
    { id: 1, author: 'Ana Costa', text: buildReviewComment(form), date: '2026-11-21T10:00:00Z' },
  ]
  assert.equal(myReviewOf(comments, 'Ana Costa')?.comment.id, 1)
  assert.equal(myReviewOf(comments, 'Ana Costa')?.split.moveValue, 'Yes')
  assert.equal(myReviewOf(comments, 'Cleo'), undefined)
  assert.equal(myReviewOf(comments, undefined), undefined)
})
