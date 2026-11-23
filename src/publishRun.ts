import { useEffect, useRef, useSyncExternalStore } from 'react'
import { recordJob, runInBackground } from './backgroundJobs'
import { utcToday } from './businessTime'
import { pairFactory, resolveChartSize, sizeFromOptions } from './chartSize'
import { chartCurrency, emptyChoice, insightsLocalKey, insightsViewerKey, narrowInsightRows, readChoice, resolveFilterSetup, scopeText, type ViewerChoice } from './insightFilters'
import { hasTable, withoutHidden, type Insight, type OnDemandPage } from './onDemand'
import { exportStamp } from './printExport'
import { isDue, parseSchedules, scheduleKey, type PublishSchedule } from './publishSchedule'
import { downloadHtml, targetKind, writeTarget } from './publishTarget'
import { buildStandaloneHtml, publishTable, scriptHash } from './standaloneHtml'
import type { OnDemandStore } from './useOnDemand'
import type { PersonalViewsStore } from './usePersonalViews'

// OND-73…OND-80 Publishing a page's standalone HTML file — now (from the page ⋯) or on its schedule (while the app is
// open, this hook in the app shell) — with the publisher's name, the Insights charts with the publisher's filter row
// (the choice remembered for them, OND-55) at the sizes the owners set, and every row that is not hidden.

export const isCardInsight = (insight: Insight) => insight.type === 'kpi' && insight.options?.view !== 'panel'
// OND-55: the publisher's filter row choice for the page — their personal views, else this browser.
export function viewerChoice(pageId: string, views?: PersonalViewsStore): ViewerChoice {
  const stored = views?.filter(insightsViewerKey(pageId), (value) => value)
  if (stored && typeof stored === 'object') return readChoice(stored)
  try { return readChoice(JSON.parse(localStorage.getItem(insightsLocalKey(pageId)) ?? 'null')) } catch { return emptyChoice() }
}
export const sampleRefusal = (name: string) => `Sample data is shown for ${name}: switch to Live to publish.`

// The file's text. page: the page as the store gives it (in Sample it is refused); charts only on a Table + Insights page.
export async function buildPageHtml(page: OnDemandPage, { publishedBy, choice, kind, now = new Date() }: { publishedBy: string; choice: ViewerChoice; kind: string; now?: Date }) {
  if (page.sample) throw new Error(sampleRefusal(page.name))
  const visible = withoutHidden(page)
  const charts = kind === 'table-insights' && visible.insights.length ? visible.insights : []
  const setup = resolveFilterSetup(visible)
  const narrowed = narrowInsightRows(visible, setup, choice, Number(utcToday(now).slice(0, 4)))
  // The chart drawing loads with the first publish (it is not part of the app shell).
  const { captureCharts } = await import('./chartCapture')
  const captured = await captureCharts(narrowed.page, charts.map((insight) => ({ insight, card: isCardInsight(insight), size: resolveChartSize({ owner: sizeFromOptions(insight.options), factory: pairFactory }).size, currency: narrowed.active ? chartCurrency(insight, narrowed) : '' })), page.colors)
  const filtersLine = !charts.length ? '' : narrowed.active ? `filter row — ${scopeText(setup, choice, narrowed, Number(utcToday(now).slice(0, 4)))}` : `every row of ${page.name} (no filter row)`
  return buildStandaloneHtml({ pageName: page.name, description: page.description, publishedBy, publishedAt: exportStamp(now), filtersLine, charts: captured, table: publishTable(page) }, await scriptHash())
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

// OND-75, OND-76: one publish of a page as a Background job; interactive — from the person's click (the browser may ask
// for its write permission once per session; without the File System Access API the file is downloaded instead).
export function runPublish({ page, kind, publishedBy, choice, interactive, scheduled = false, onDone }: { page: OnDemandPage; kind: string; publishedBy: string; choice: ViewerChoice; interactive: boolean; scheduled?: boolean; onDone?: (ok: boolean, text: string) => void }) {
  return runInBackground(`publish:${page.id}`, `${scheduled ? 'Scheduled publish' : 'Publish HTML'} · ${page.name}`, async (progress) => {
    const finish = (ok: boolean, text: string) => { if (scheduled) writeSchedule(page.id, (current) => current && { ...current, lastOk: ok, lastText: text }); onDone?.(ok, text) }
    try {
      progress('Drawing the charts…')
      const html = await buildPageHtml(page, { publishedBy, choice, kind })
      const rows = withoutHidden(page).rows.length
      if (targetKind() === 'download') {
        if (scheduled) throw new Error('This browser cannot write to a chosen file, so a scheduled publish cannot run here. Use the desktop app, or Chrome or Edge.')
        const name = downloadHtml(html, page.name)
        const text = `This browser cannot write to a chosen file (or it is blocked): downloaded ${name} (${rows} rows) instead — move it where it belongs.`
        finish(true, text); return { text }
      }
      progress('Writing the file…')
      const done = await writeTarget(page.id, html, { interactive })
      const text = `Published ${rows} row${rows === 1 ? '' : 's'} of ${page.name} to ${done.where} (${Math.max(1, Math.round(done.bytes / 1024))} KB).`
      finish(true, text); return { text }
    } catch (failure) {
      const text = failure instanceof Error ? failure.message : String(failure)
      finish(false, text)
      throw failure
    }
  })
}

// OND-78, OND-79: the scheduler — at the start and every minute while the app is open, each due page of this computer
// is published (a run missed while the app was closed runs now, once). allowed(id): the person may still publish it.
export function usePublishScheduler({ store, views, publishedBy, kindOf, allowed }: { store: OnDemandStore; views?: PersonalViewsStore; publishedBy: string; kindOf: (id: string) => string; allowed: (id: string) => string }) {
  const latest = useRef({ store, views, publishedBy, kindOf, allowed })
  useEffect(() => { latest.current = { store, views, publishedBy, kindOf, allowed } })
  const loaded = store.loaded
  useEffect(() => {
    if (!loaded) return
    const tick = () => {
      const { store: current, views: personal, publishedBy: name, kindOf: kind, allowed: reason } = latest.current
      const now = new Date()
      for (const [id, schedule] of Object.entries(readSchedules())) {
        if (!isDue(schedule, now)) continue
        const page = current.full(id)
        writeSchedule(id, (entry) => entry && { ...entry, lastRun: now.toISOString() })
        const why = !page ? 'The page is no longer there.' : !hasTable(kind(id)) ? 'The page is no longer a table page.' : page.sample ? sampleRefusal(page.name) : reason(id)
        if (why || !page) { writeSchedule(id, (entry) => entry && { ...entry, lastOk: false, lastText: why }); recordJob(`publish:${id}`, `Scheduled publish · ${page?.name ?? id}`, { text: why, failed: true }); continue }
        runPublish({ page, kind: kind(id), publishedBy: name, choice: viewerChoice(id, personal), interactive: false, scheduled: true })
      }
    }
    tick()
    const timer = window.setInterval(tick, 60_000)
    return () => window.clearInterval(timer)
  }, [loaded])
}
