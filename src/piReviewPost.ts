// PI Review, the review form (PIR-13…PIR-15, CON-113): who may post a Feature's review, the next PI, the form's checks,
// the comment built from it in the standard format PI Review reads back (splitReviewComment), and the post itself — a
// new comment in the Feature's Discussion, written with the person's own PAT to dev.azure.com only.
import { commentHtml, isCloudBase, collectionUrl, requestAzure, type AzureConfig, type AzureTransport } from './azureClient.ts'
import { writeBlockedReason, type Action } from './access.ts'
import { laterPi, piName } from './myWork.ts'
import { commentText } from './workItemEdit.ts'
import { readDiscussion } from './azureDevOps.ts'
import { reviewFooter, reviewSplit, setDiscussion, tidyReviewText, type ReviewMode, type ReviewSplit } from './piReview.ts'
import type { AzureWorkItem } from './domain'
import type { WorkItemComment } from './azureDevOps.ts'

// PIR-13: the form. move: Yes or No only (an older comment's Partly is read, never offered), **No** pre-selected (the
// product owner's choice, UI-STANDARDS §12 exception of 2026-11-25); movePi: the PI it moves to. mode: no default.
export type ReviewMove = 'Yes' | 'No'
export interface ReviewForm { learnings: string; struggles: string; move: ReviewMove | ''; moveReason: string; movePi: string; mode: ReviewMode | ''; remarks: string }
export const emptyReviewForm = (movePi = ''): ReviewForm => ({ learnings: '', struggles: '', move: 'No', moveReason: '', movePi, mode: '', remarks: '' })

// PIR-13: the PI written in the Move question — "PI" and its number ("PI 26.5", "PI 2026.5").
const piPattern = /^pi[ \t]*(\d+(?:\.\d+)*)$/i
export const piText = (name: string) => { const match = piPattern.exec(name.trim()); return match ? `PI ${match[1]}` : '' }
// PIR-13: the PI after the reviewed one — the next later PI in the PI list (by laterPi), else the reviewed PI's last
// number increased by one ("PI 26.4" → "PI 26.5"); as "PI <number>", '' when the reviewed PI has no number.
export function nextPi(reviewed: string, options: readonly string[]): string {
  const later = options.filter((pi) => laterPi(pi, reviewed) && piText(piName(pi))).reduce<string | undefined>((next, pi) => !next || laterPi(next, pi) ? pi : next, undefined)
  if (later) return piText(piName(later))
  const name = piText(piName(reviewed))
  return name ? name.replace(/(\d+)$/, (last) => String(Number(last) + 1)) : ''
}

// CON-113, PIR-13: who may post the review of a Feature — a lead ("PI Review: post the review of a Feature") on every
// Feature; the Feature's assignee (their work email is the Feature's Assigned To email) with "Add a comment".
export interface ReviewViewer { can: (action: Action) => boolean; readOnly: boolean; viewingAs: string; email: string; isSample: boolean; config: AzureConfig | null; pat: string }
const sameEmail = (a: string | undefined, b: string | undefined) => Boolean(a?.trim() && b?.trim() && a.trim().toLowerCase() === b.trim().toLowerCase())
export const isReviewLead = (viewer: Pick<ReviewViewer, 'can'>) => viewer.can('pireview.post')
export const isFeatureAssignee = (viewer: Pick<ReviewViewer, 'email'>, feature: Pick<AzureWorkItem, 'assignedToEmail'>) => sameEmail(viewer.email, feature.assignedToEmail)
// PIR-13: why nothing can be posted on this page ('' when posting may be possible): the roles not loaded, View as,
// sample data, no Time Writing connection or PAT, an on-premises server.
export function reviewPageBlock(viewer: ReviewViewer): string {
  if (viewer.readOnly) return writeBlockedReason(true, ['pireview.post'])
  if (viewer.viewingAs) return `Read only while viewing as ${viewer.viewingAs}: nothing is posted to Azure DevOps. Exit View as to post a review.`
  if (viewer.isSample) return 'Synthetic sample data is loaded: nothing is posted to Azure DevOps. Fetch your data first.'
  if (!viewer.config || !viewer.pat.trim()) return 'Connect the Time Writing connection (with its PAT) to post a review.'
  let cloud = false
  try { cloud = isCloudBase(collectionUrl(viewer.config)) } catch { cloud = false }
  if (!cloud) return 'Reviews are posted to Azure DevOps Services (dev.azure.com) only: this connection is on premises and read only.'
  return ''
}
// PIR-13: why this Feature's review cannot be posted ('' when it can): the page's reason, else the right.
export function reviewPostBlock(viewer: ReviewViewer, feature: Pick<AzureWorkItem, 'assignedTo' | 'assignedToEmail'>): string {
  const page = reviewPageBlock(viewer)
  if (page) return page
  if (isReviewLead(viewer)) return ''
  if (!isFeatureAssignee(viewer, feature)) return `Only the Feature’s assignee (${feature.assignedTo.trim() || 'nobody'}) or a lead with “PI Review: post the review of a Feature” can post its review${viewer.email ? '' : ' (enter your work email on the Time Writing connection: the assignee is matched by it)'}. An Admin can change this in Admin → People & roles → Role rights.`
  return viewer.can('work.comment') ? '' : writeBlockedReason(false, ['work.comment'])
}

// PIR-14: a paragraph as comment lines — each non-empty line trimmed; a line starting with a bullet (- * • + –) kept as a
// list item "- …", a numbered line (1. or 1)) kept as it is, any other line kept as a paragraph line.
export function reviewLines(text: string): string[] {
  return text.split(/\r?\n/).map((line) => line.trim().replace(/\s+/g, ' ')).filter(Boolean).map((line) => line.replace(/^[-*•+–][ \t]*(?=\S)/, '- '))
}
// PIR-14: the Move question names the PI it moves to ("Whether the feature needs to be shifted to PI 26.5").
export const moveQuestion = (pi: string) => `Whether the feature needs to be shifted to ${piText(pi) || 'the next PI'}`
export const reviewQuestion = 'Advise to discuss the Feature during the Review meeting'
// PIR-14: the comment posted — plain lines (sent as text: & < > escaped, line breaks kept, commentHtml), in the standard
// format: "Learnings :", "Struggles :" (each when given), the Move question with its answer and reason, the Review meeting advice,
// "Additional Remarks :" (when given) and the footer line, which the split ignores.
export function buildReviewComment(form: ReviewForm): string {
  const reason = reviewLines(form.moveReason)
  const first = reason[0]?.replace(/^- /, '')
  return [
    ...(reviewLines(form.learnings).length ? ['Learnings :', ...reviewLines(form.learnings)] : []),
    ...(reviewLines(form.struggles).length ? ['Struggles :', ...reviewLines(form.struggles)] : []),
    `${moveQuestion(form.movePi)} : ${form.move}${first ? ` - ${first}` : ''}`, ...reason.slice(1),
    `${reviewQuestion} : ${form.mode}`,
    ...(reviewLines(form.remarks).length ? ['Additional Remarks :', ...reviewLines(form.remarks)] : []),
    reviewFooter,
  ].join('\n')
}

// PIR-14: the comment as PI Review will read it back — sent as Azure DevOps stores it (commentHtml), read as plain text
// (commentText) and split (reviewSplit).
export const readBackReview = (text: string): ReviewSplit => reviewSplit(commentText(commentHtml(text)))
// PIR-13: the form's problems, each naming its field — the required fields, the PI, the length, and any field PI Review
// would read back differently (a line that looks like a heading, e.g. "Issues: …").
export const maxReviewLength = 30_000
// optionalTexts (PIR-18, the Close flow): Learnings and Struggles may stay empty.
export function reviewFormProblems(form: ReviewForm, { optionalTexts = false }: { optionalTexts?: boolean } = {}): string[] {
  const problems: string[] = []
  if (!optionalTexts && !reviewLines(form.learnings).length) problems.push('Enter the Learnings (write “None” when there are none).')
  if (!optionalTexts && !reviewLines(form.struggles).length) problems.push('Enter the Struggles (write “None” when there are none).')
  if (form.move !== 'Yes' && form.move !== 'No') problems.push('Choose whether the Feature moves to the next PI: Yes or No.')
  if (!piText(form.movePi)) problems.push('Enter the PI it moves to as “PI” and its number, e.g. PI 26.5.')
  if (form.mode !== 'Discuss during Meeting' && form.mode !== 'Offline Review') problems.push('Choose whether to discuss the Feature during the Review meeting or review it offline.')
  if (problems.length) return problems
  const text = buildReviewComment(form)
  if (text.length > maxReviewLength) return [`The review is too long (${text.length.toLocaleString()} characters; at most ${maxReviewLength.toLocaleString()}).`]
  const back = readBackReview(text), expected = (value: string) => tidyReviewText(reviewLines(value).join('\n'))
  const [first = '', ...rest] = reviewLines(form.moveReason)
  const reason = [first.replace(/^- /, ''), tidyReviewText(rest.join('\n'))].filter(Boolean).join('\n')
  const differs = [
    (back.learnings ?? '') !== expected(form.learnings) && 'Learnings',
    (back.struggles ?? '') !== expected(form.struggles) && 'Struggles',
    (back.moveValue !== form.move || (back.moveRest ?? '') !== reason || back.movePi !== piText(form.movePi)) && 'Move to next PI',
    back.reviewMode !== form.mode && 'Review meeting',
    (back.remarks ?? '') !== expected(form.remarks) && 'Additional Remarks',
  ].filter((field): field is string => Boolean(field))
  if (differs.length) problems.push(`PI Review would read ${differs.join(', ')} back differently: a line looks like a heading (e.g. “Issues:”, “Next PI:” or “Remarks”). Reword that line, e.g. without the colon.`)
  return problems
}

// PIR-13: the form prefilled from the Feature's latest review comment split by its headings (a correction starts from
// what was posted); Partly (from an older comment) is not offered, so Move starts at No (the caller says so). Otherwise
// the empty form (Move No).
export function reviewFormFrom(split: ReviewSplit | undefined, movePi: string): ReviewForm {
  if (!split || split.from !== 'Headings') return emptyReviewForm(movePi)
  return {
    learnings: split.learnings ?? '', struggles: split.struggles ?? '',
    move: split.moveValue === 'Yes' ? 'Yes' : 'No',
    moveReason: split.moveValue ? split.moveRest ?? '' : split.move ?? '',
    movePi: split.movePi ?? movePi, mode: split.reviewMode ?? '', remarks: split.remarks ?? '',
  }
}

// PIR-13: post the review as a new comment on the Feature (the add-comment write, with the Feature's Assigned To email
// for the rights check, CON-113). Returns the new comment's ID.
export async function postReview(config: AzureConfig, pat: string, feature: Pick<AzureWorkItem, 'id' | 'assignedToEmail'>, text: string, transport: AzureTransport = requestAzure): Promise<number> {
  if (!text.trim() || text.length > maxReviewLength) throw new Error('The review is empty or too long. Nothing was posted.')
  const response = await transport({ ...config, pat, operation: 'add-comment', workItemId: feature.id, comment: text, reviewOf: feature.assignedToEmail ?? '' }) as { id?: unknown }
  if (typeof response?.id !== 'number') throw new Error(`The review on #${feature.id} could not be confirmed. Check the Discussion in Azure DevOps before posting again.`)
  return response.id
}

// PIR-05, PIR-13: read one Feature's Discussion into PI Review's memory (the error kept for the drawer and the table).
export async function readDiscussionInto(config: AzureConfig, pat: string, item: Pick<AzureWorkItem, 'key' | 'id'>) {
  setDiscussion(item.key, { state: 'loading' })
  try { const { comments, capped } = await readDiscussion(config, pat, item.id); setDiscussion(item.key, { state: 'done', comments, capped, readAt: new Date().toISOString() }) }
  catch (failure) { setDiscussion(item.key, { state: 'error', error: failure instanceof Error ? failure.message : 'Could not read the Discussion.' }); throw failure }
}
// PIR-17: the PI of a Feature (its Iteration Path's PI part), for the Move question's next PI.
export { piPathOf as featurePi } from './myWork.ts'

// PIR-17: my latest review — the newest comment written by me (author = my name, ignoring case) split by headings.
export function myReviewOf(comments: WorkItemComment[], name: string | undefined): { comment: WorkItemComment; split: ReviewSplit } | undefined {
  const me = name?.trim().toLowerCase()
  if (!me) return undefined
  for (const comment of comments) { // newest first
    if (comment.author.trim().toLowerCase() !== me) continue
    const split = reviewSplit(comment.text)
    if (split.from === 'Headings') return { comment, split }
  }
  return undefined
}
