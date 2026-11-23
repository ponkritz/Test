import { useEffect, useState } from 'react'
import { formatDateTime } from '../format'
import { isRowHidden, type OnDemandPage } from '../onDemand'
import { dayNames, nextOccurrence, offSchedule, scheduleText, type PublishSchedule, type ScheduleMode } from '../publishSchedule'
import { chooseTarget, currentTarget, targetKind } from '../publishTarget'
import { runPublish, useSchedules, viewerChoice, writeSchedule } from '../publishRun'
import { publishFileName } from '../standaloneHtml'
import type { PersonalViewsStore } from '../usePersonalViews'
import { Modal, Notice } from './ui'

// OND-74…OND-79 Publish standalone HTML… (UI-STANDARDS §4: a confirmation pop-up naming what is shared). It says that
// the file holds every row of the page, shows the file it overwrites (Choose another file…), and the page's schedule on
// this computer; Publish now asks for the file the first time (or after Choose another file…), then publishes as a
// Background job (§8); Save schedule keeps the schedule on this computer only.
export function PublishDialog({ page, kind, publishedBy, views, onClose }: { page: OnDemandPage; kind: string; publishedBy: string; views?: PersonalViewsStore; onClose: () => void }) {
  const how = targetKind()
  const [target, setTarget] = useState<string | null | undefined>(undefined)
  const [again, setAgain] = useState(false)
  const saved = useSchedules()[page.id]
  const [draft, setDraft] = useState<PublishSchedule>(() => saved ?? offSchedule(new Date()))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  useEffect(() => { let live = true; void currentTarget(page.id).then((value) => { if (live) setTarget(value) }, () => { if (live) setTarget(null) }); return () => { live = false } }, [page.id])
  const rows = page.rows.filter((row) => !isRowHidden(row)).length, hidden = page.rows.length - rows
  const scheduleReason = how === 'download' ? 'This browser cannot write to a chosen file (no File System Access), so it cannot publish on a schedule: use the desktop app, or Chrome or Edge.' : !target ? 'Choose the file first: Publish now asks where to save it.' : ''
  const set = (change: Partial<PublishSchedule>) => { setDraft((current) => ({ ...current, ...change })); setNote('') }
  const publish = async () => {
    setBusy(true); setError('')
    try {
      if (how !== 'download' && (!target || again)) { const chosen = await chooseTarget(page.id, page.name); if (!chosen) { setBusy(false); return } setTarget(chosen) }
      runPublish({ page, kind, publishedBy, choice: viewerChoice(page.id, views), interactive: true })
      onClose()
    } catch (failure) { setError(`The file could not be chosen: ${failure instanceof Error ? failure.message : String(failure)}`); setBusy(false) }
  }
  const saveSchedule = () => {
    const now = new Date()
    writeSchedule(page.id, () => draft.mode === 'off' ? undefined : { mode: draft.mode, day: draft.day, time: draft.time, setAt: now.toISOString() })
    const next = nextOccurrence(draft, now)
    setNote(draft.mode === 'off' ? 'No scheduled publish on this computer.' : `Saved on this computer: ${scheduleText(draft)}${next ? `, next on ${formatDateTime(next.toISOString())}` : ''}.`)
  }
  return <Modal eyebrow={`ON-DEMAND · ${page.name.toUpperCase()}`} title="Publish standalone HTML" onClose={() => { if (!busy) onClose() }}>
    <form className="pgb-form publish-form" noValidate onSubmit={(event) => { event.preventDefault(); void publish() }}>
      <Notice tone="warning" className="publish-warning"><strong>This file contains every row of {page.name}.</strong> Anyone who receives it can read them. ({rows} row{rows === 1 ? '' : 's'}{hidden ? `; ${hidden} hidden row${hidden === 1 ? '' : 's'} left out` : ''}, the Insights charts with your filter row, who published it and when — no token or password.)</Notice>
      <div className="publish-target">
        <strong>File</strong>
        {how === 'download' ? <p>This browser cannot write to a chosen file (or its policy blocks it): Publish now downloads <code>{publishFileName(page.name)}</code> to your Downloads folder instead.</p>
          : target === undefined ? <p className="muted" role="status">Looking for the file…</p>
          : target && !again ? <p><code>{target}</code> — overwritten by each publish.{' '}<button type="button" className="text-button" onClick={() => setAgain(true)}>Choose another file…</button></p>
          : <p>{again ? 'Publish now asks for the file again.' : 'Not chosen yet: Publish now asks where to save it'} (suggested <code>{publishFileName(page.name)}</code>); {how === 'desktop' ? 'the app remembers the folder and name for this page on this computer.' : 'this browser remembers it for this page.'}</p>}
      </div>
      <fieldset className="publish-schedule" disabled={Boolean(scheduleReason)} title={scheduleReason || undefined}><legend>Schedule (on this computer)</legend>
        <div className="publish-modes">{(['off', 'daily', 'weekly'] as ScheduleMode[]).map((mode) => <label key={mode} className="check"><input type="radio" name="publish-mode" checked={draft.mode === mode} onChange={() => set({ mode })} />{mode === 'off' ? 'Off' : mode === 'daily' ? 'Daily' : 'Weekly'}</label>)}</div>
        {draft.mode !== 'off' && <div className="form-row">
          {draft.mode === 'weekly' && <label>Day<select aria-label="Day" value={draft.day} onChange={(event) => set({ day: Number(event.target.value) })}>{dayNames.map((name, index) => <option key={name} value={index}>{name}</option>)}</select></label>}
          <label>At<input type="time" aria-label="Time" required value={draft.time} onChange={(event) => { if (/^\d{2}:\d{2}$/.test(event.target.value)) set({ time: event.target.value }) }} /></label>
        </div>}
        <small>Runs only while the app is open here (the desktop app, or this browser tab while it may still write the file); a run missed while it was closed runs at the next start. Kept on this computer only, never in Git. Results and failures go to Background jobs; a failure also shows on the page.</small>
        {saved?.lastRun && <small role="status">Last scheduled run {formatDateTime(saved.lastRun)}: {saved.lastOk === false ? `failed — ${saved.lastText ?? ''}` : saved.lastText ?? 'done'}.</small>}
        <div><button type="button" className="ghost" onClick={saveSchedule}>Save schedule</button>{note && <small role="status"> {note}</small>}</div>
      </fieldset>
      {scheduleReason && <small>{scheduleReason}</small>}
      {error && <Notice tone="error">{error}</Notice>}
      <div className="modal-actions"><button type="button" className="ghost" disabled={busy} onClick={onClose}>Cancel</button><button className="primary" disabled={busy}>{busy ? 'Publishing…' : 'Publish now'}</button></div>
    </form>
  </Modal>
}
