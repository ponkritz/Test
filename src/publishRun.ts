import { useEffect, useRef, useSyncExternalStore } from 'react'
import { recordJob, runInBackground } from './backgroundJobs'
import { periodOf } from './dashboard'
import { viewerKey, type Dashboard } from './dashboardPages'
import { emptyChoice, insightsLocalKey, insightsViewerKey, readChoice, type ViewerChoice } from './insightFilters'
import { hasTable, type OnDemandPage } from './onDemand'
import { exportStamp } from './printExport'
import { cutDashboard, cutSummary, cutTablePage, readCut, sampleRefusal, type PublishCut, type PublishedFile } from './publishData'
import { isDue, parseSchedules, scheduleKey, type PublishSchedule } from './publishSchedule'
import { downloadHtml, targetKind, writeTarget } from './publishTarget'
import { buildStandaloneHtml } from './standaloneHtml'
import type { OnDemandStore } from './useOnDemand'
import type { PersonalViewsStore } from './usePersonalViews'

// OND-90…OND-99 Publishing a page as an interactive HTML file — now (from the page ⋯) or on its schedule (while the app
// is open, this hook in the app shell): a table page (Table, Table + Insights) or an On-Demand Dashboard, with only the
// rows that pass the publisher's filters (Publish now: the filters on screen; a schedule: the filters saved with it,
// OND-96), the publisher's name and the viewer built with the app (OND-98).

export { sampleRefusal }
// OND-55: the publisher's Insights filter row choice for a table page — their personal views, else this browser.
export function viewerChoice(pageId: string, views?: PersonalViewsStore): ViewerChoice {
  const stored = views?.filter(insightsViewerKey(pageId), (value) => value)
  if (stored && typeof stored === 'object') return readChoice(stored)
  try { return readChoice(JSON.parse(localStorage.getItem(insightsLocalKey(pageId)) ?? 'null')) } catch { return emptyChoice() }
}
// DSH-07: the publisher's period and filter values on a dashboard — their personal views, else this browser (the key
// of CustomDashboardPage).
const dashboardLocalKey = (pageId: string) => `demand-planning-dashboard-page-view-v1:${pageId}`
export function dashboardChoice(pageId: string, views?: PersonalViewsStore): PublishCut {
  let stored: unknown = views?.filter(viewerKey(pageId), (value) => value)
  if (!stored || typeof stored !== 'object') { try { stored = JSON.parse(localStorage.getItem(dashboardLocalKey(pageId)) ?? 'null') } catch { stored = null } }
  const saved = (stored && typeof stored === 'object' ? stored : {}) as { period?: unknown; choices?: unknown }
  return readCut({ kind: 'dashboard', period: periodOf(saved.period, { years: [], quarters: [], months: [] }), choices: saved.choices }) ?? { kind: 'dashboard', period: { years: [], quarters: [], months: [] }, choices: {} }
}
// The cut a publish uses when none is given (a schedule saved before v10.4): the publisher's filters remembered for the page.
export const rememberedCut = (pageId: string, kind: string, views?: PersonalViewsStore): PublishCut => kind === 'dashboard' ? dashboardChoice(pageId, views) : { kind: 'table', choice: viewerChoice(pageId, views) }

// What a publish needs to cut its data at the moment it runs (throws with the reason when it cannot, e.g. Sample).
export type Prepare = (now: Date, scheduled: boolean) => PublishedFile
export function prepareTable(page: OnDemandPage, kind: string, cut: PublishCut, publishedBy: string): Prepare {
  return (now, scheduled) => cutTablePage(page, { kind, choice: cut.kind === 'table' ? cut.choice : emptyChoice(), publishedBy, now, at: exportStamp(now), scheduled })
}
export function prepareDashboard(page: Pick<OnDemandPage, 'name' | 'description'>, dashboard: Dashboard, pageOf: (id: string) => OnDemandPage | null, cut: PublishCut, publishedBy: string): Prepare {
  const { period, choices } = cut.kind === 'dashboard' ? cut : { period: { years: [], quarters: [], months: [] }, choices: {} }
  return (now, scheduled) => cutDashboard({ name: page.name, description: page.description, dashboard, pageOf, period, choices, publishedBy, now, at: exportStamp(now), scheduled })
}

// The file's text: the data and the viewer (loaded with the first publish; it is not part of the app shell).
export async function buildPageHtml(data: PublishedFile) {
  const { viewerJs, viewerCss } = await import('virtual:standalone-viewer')
  return buildStandaloneHtml(data, { js: viewerJs, css: viewerCss })
}

// ---- the schedules of this computer (localStorage), shared by the pages and the scheduler ----
const listeners = new Set<() => void>()
let snapshot: Record<string, PublishSchedule> | null = null
export function readSchedules(): Record<string, PublishSchedule> {
  if (!snapshot) { try { snapshot = parseSchedules(localStorage.getItem(scheduleKey)) } catch { snapshot = {} } }
  return snapshot
}
export function writeSchedule(pageId: string, change: (current: PublishSchedule | undefined) => PublishSchedule | undefined) {
  const next = { ...readSchedules() }
  const value = change(next[pageId])
  if (value) next[pageId] = value; else delete next[pageId]
  snapshot = next
  try { localStorage.setItem(scheduleKey, JSON.stringify(next)) } catch { /* this visit only */ }
  for (const listener of listeners) listener()
}
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }
export const useSchedules = () => useSyncExternalStore(subscribe, readSchedules, readSchedules)

// OND-76, OND-94: one publish of a page as a Background job; interactive — from the person's click (the browser may ask
// for its write permission once per session; without the File System Access API the file is downloaded instead).
export function runPublish({ pageId, name, prepare, interactive, scheduled = false, onDone }: { pageId: string; name: string; prepare: Prepare; interactive: boolean; scheduled?: boolean; onDone?: (ok: boolean, text: string) => void }) {
  return runInBackground(`publish:${pageId}`, `${scheduled ? 'Scheduled publish' : 'Publish HTML'} · ${name}`, async (progress) => {
    const finish = (ok: boolean, text: string) => { if (scheduled) writeSchedule(pageId, (current) => current && { ...current, lastOk: ok, lastText: text }); onDone?.(ok, text) }
    try {
      progress('Cutting the data and building the file…')
      const data = prepare(new Date(), scheduled)
      const html = await buildPageHtml(data)
      const rows = `${data.meta.rows} row${data.meta.rows === 1 ? '' : 's'}`, cut = cutSummary(data)
      if (targetKind() === 'download') {
        if (scheduled) throw new Error('This browser cannot write to a chosen file, so a scheduled publish cannot run here. Use the desktop app, or Chrome or Edge.')
        const file = downloadHtml(html, name)
        const text = `This browser cannot write to a chosen file (or it is blocked): downloaded ${file} (${rows}; ${cut}) instead — move it where it belongs.`
        finish(true, text); return { text }
      }
      progress('Writing the file…')
      const done = await writeTarget(pageId, html, { interactive })
      const text = `Published ${rows} of ${name} (${cut}) to ${done.where} (${Math.max(1, Math.round(done.bytes / 1024))} KB).`
      finish(true, text); return { text }
    } catch (failure) {
      const text = failure instanceof Error ? failure.message : String(failure)
      finish(false, text)
      throw failure
    }
  })
}

// OND-78, OND-79, OND-96: the scheduler — at the start and every minute while the app is open, each due page of this
// computer is published with the filters saved with its schedule (a run missed while the app was closed runs now,
// once). allowed(id): the person may still publish it; dashboardOf(id): the dashboard as in Git (else as last read here).
export function usePublishScheduler({ store, views, publishedBy, kindOf, allowed, dashboardOf }: { store: OnDemandStore; views?: PersonalViewsStore; publishedBy: string; kindOf: (id: string) => string; allowed: (id: string) => string; dashboardOf: (id: string) => Promise<Dashboard | null> }) {
  const latest = useRef({ store, views, publishedBy, kindOf, allowed, dashboardOf })
  useEffect(() => { latest.current = { store, views, publishedBy, kindOf, allowed, dashboardOf } })
  const loaded = store.loaded
  useEffect(() => {
    if (!loaded) return
    const tick = () => {
      const { store: current, views: personal, publishedBy: name, kindOf: kind, allowed: reason, dashboardOf: readDashboard } = latest.current
      const now = new Date()
      for (const [id, schedule] of Object.entries(readSchedules())) {
        if (!isDue(schedule, now)) continue
        const page = current.full(id), type = kind(id)
        writeSchedule(id, (entry) => entry && { ...entry, lastRun: now.toISOString() })
        const why = !page ? 'The page is no longer there.' : !hasTable(type) && type !== 'dashboard' ? 'The page is no longer a table page or a dashboard.' : page.sample && type !== 'dashboard' ? sampleRefusal(page.name) : reason(id)
        const fail = (text: string) => { writeSchedule(id, (entry) => entry && { ...entry, lastOk: false, lastText: text }); recordJob(`publish:${id}`, `Scheduled publish · ${page?.name ?? id}`, { text, failed: true }) }
        if (why || !page) { fail(why); continue }
        const cut = schedule.cut ?? rememberedCut(id, type, personal)
        if (type !== 'dashboard') { runPublish({ pageId: id, name: page.name, prepare: prepareTable(page, type, cut, name), interactive: false, scheduled: true }); continue }
        void readDashboard(id).then((dashboard) => {
          if (!dashboard) { fail('The dashboard could not be read from Git.'); return }
          runPublish({ pageId: id, name: page.name, prepare: prepareDashboard(page, dashboard, (source) => current.stored(source), cut, name), interactive: false, scheduled: true })
        }, (failure: unknown) => fail(failure instanceof Error ? failure.message : String(failure)))
      }
    }
    tick()
    const timer = window.setInterval(tick, 60_000)
    return () => window.clearInterval(timer)
  }, [loaded])
}
