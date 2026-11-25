import { useState, type FormEvent } from 'react'
import { Modal, Notice, WriteBlocked } from '../components/ui'
import { formatDateTime } from '../format'
import { buildReviewComment, reviewFormProblems, type ReviewForm, type ReviewMove } from '../piReviewPost'
import { piLabel, reviewModes, type ReviewMode } from '../piReview'
import type { Writing } from '../piReviewWriter'

// PIR-13, PIR-14: the review fields (one column, UI-STANDARDS §3) and the Preview of the exact comment. Move to next PI:
// Yes / No only, No pre-selected; the PI it moves to; an optional reason. The Review meeting advice has no default.
// optionalTexts (PIR-18, the Close pop-up): Learnings and Struggles marked (optional).
export function ReviewFields({ form, onChange, pi, partly, optionalTexts = false, idPrefix = 'review' }: { form: ReviewForm; onChange: (form: ReviewForm) => void; pi: string; partly: boolean; optionalTexts?: boolean; idPrefix?: string }) {
  const set = <K extends keyof ReviewForm>(key: K, value: ReviewForm[K]) => onChange({ ...form, [key]: value })
  const paragraph = (key: 'learnings' | 'struggles' | 'moveReason' | 'remarks', label: string, help: string, required = false) =>
    <label>{label}<textarea rows={key === 'moveReason' || key === 'remarks' ? 2 : 3} required={required} value={form[key]} onChange={(event) => set(key, event.target.value)} /><small>{help}</small></label>
  const choice = <T extends string>(name: string, options: readonly T[], value: T | '', onPick: (value: T) => void) =>
    <div className="segmented" role="radiogroup" aria-label={name}>{options.map((option) => <label key={option} className={value === option ? 'active' : undefined}><input type="radio" name={`${idPrefix}-${name}`} required checked={value === option} onChange={() => onPick(option)} />{option}</label>)}</div>
  const list = 'One point per line; start a line with - or 1. for a list.'
  return <div className="pir-review-columns">
    <div className="pir-review-fields">
      {paragraph('learnings', optionalTexts ? 'Learnings (optional)' : 'Learnings', list, !optionalTexts)}
      {paragraph('struggles', optionalTexts ? 'Struggles (optional)' : 'Struggles', list, !optionalTexts)}
      <fieldset className="plain-fieldset pir-review-move">
        <legend>Move to next PI</legend>
        {choice<ReviewMove>('Move to next PI', ['Yes', 'No'], form.move, (value) => set('move', value))}
        <small className="muted">{partly ? 'The latest review said Partly: choose Yes or No (No is pre-selected).' : 'No is pre-selected.'}</small>
        <label>Moves to<input value={form.movePi} required onChange={(event) => set('movePi', event.target.value)} /><small>The next PI after {pi ? piLabel(pi) : 'the Feature’s PI'}, from the PI list; change it if needed.</small></label>
        {paragraph('moveReason', 'Reason (optional)', 'Why it moves, or what is left.')}
      </fieldset>
      <fieldset className="plain-fieldset">
        <legend>Advise to discuss the Feature during the Review meeting?</legend>
        {choice<ReviewMode>('Review meeting', reviewModes, form.mode, (value) => set('mode', value))}
      </fieldset>
      {paragraph('remarks', 'Additional Remarks (optional)', 'Anything else for the review.')}
    </div>
    <section className="pir-review-preview" aria-label="Preview">
      <h3>Preview</h3>
      <pre>{buildReviewComment(form)}</pre>
      <small className="muted">The exact comment posted, as you, to the Feature’s Discussion in Azure DevOps: sent as text (&lt;, &gt; and &amp; shown as typed, line breaks kept). The last line marks it as posted from this app; PI Review ignores it.</small>
    </section>
  </div>
}

// PIR-13: the "Write review" pop-up (UI-STANDARDS §3, §4): the fields and the Preview; Cancel and **Post to Azure
// DevOps**, disabled with the reason; Post opens the confirmation pop-up naming the Feature, then onPost.
export function ReviewDialog({ writing, blocked, onPost, onClose }: { writing: Writing; blocked: string; onPost: (form: ReviewForm, text: string) => void; onClose: () => void }) {
  const { item: feature, pi, prefilledFrom, partly } = writing
  const [form, setForm] = useState(writing.initial)
  const [tried, setTried] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const problems = reviewFormProblems(form)
  const why = blocked || (tried && problems.length ? 'Fix the fields above first.' : '')
  function submit(event: FormEvent) {
    event.preventDefault()
    setTried(true)
    if (blocked || problems.length) return
    setConfirming(true)
  }
  return <Modal title={`Review of Feature #${feature.id}`} eyebrow="PI REVIEW · AZURE DEVOPS WRITE" wide onClose={onClose}>
    <form className="pir-review-form" onSubmit={submit} noValidate>
      <p className="pir-title"><strong>{feature.title}</strong> <span className="muted">· {pi ? piLabel(pi) : 'no PI'} · Assigned to {feature.assignedTo || 'nobody'}</span></p>
      <p className="muted pir-review-note">{prefilledFrom ? `Prefilled from the latest review comment (${prefilledFrom.author}, ${formatDateTime(prefilledFrom.date)}). ` : ''}Posting adds a new comment to the Feature’s Discussion; PI Review reads the newest, so a correction is posted as a new review.</p>
      <ReviewFields form={form} onChange={setForm} pi={pi} partly={partly} />
      {tried && problems.length > 0 && <Notice tone="error">{problems.join(' ')}</Notice>}
      <div className="modal-actions"><WriteBlocked reason={why} /><button type="button" className="ghost" onClick={onClose}>Cancel</button><button type="submit" className="primary" disabled={Boolean(blocked)} title={blocked || undefined}>Post to Azure DevOps</button></div>
    </form>
    {confirming && <Modal title={`Post the review to Feature #${feature.id}?`} eyebrow="PI REVIEW · AZURE DEVOPS WRITE" onClose={() => setConfirming(false)}>
      <p>A new comment is added to the Discussion of Feature #{feature.id} “{feature.title}” in Azure DevOps, as you (your PAT): Move to next PI <strong>{form.move}</strong> (to {form.movePi.trim()}), <strong>{form.mode}</strong>.</p>
      <p className="muted">It cannot be deleted from this app; to correct it, write the review again — the newest comment counts.</p>
      <div className="modal-actions"><button type="button" className="ghost" onClick={() => setConfirming(false)}>Cancel</button><button type="button" className="primary" onClick={() => { setConfirming(false); onPost(form, buildReviewComment(form)) }}>Post review to #{feature.id}</button></div>
    </Modal>}
  </Modal>
}

