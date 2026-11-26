// PIR-51…PIR-57, PIR-62 The executive slides of the PI Review Meeting (product owner, 26 Nov 2026) — each one small slide
// maker in the one slideOrder list of piMeeting.ts: Executive summary, Review completion, PI-over-PI trend, Repeat
// carry-overs, Topics for discussion, Releases in the PI, Hours per Epic, Utilization, Trends / peaks / spikes and
// Long-running Features. The figures come from piMeetingData.ts (worked out when the meeting is built); a figure that
// cannot be worked out shows "—" with the reason. Charts are inline SVG drawn here (no library, no request), in light,
// print-friendly colours, each with a table of the same numbers; every value goes through text().
import { carriedForward, closedInPi, epicGroups, monthLabel, spikeFactor, type EpicGroup, type MeetingExec, type Trend } from './piMeetingData.ts'
import { defaultMeetingSettings, isHexColour, type MeetingSettings } from './piMeetingSettings.ts'
import { cell, chunks, displayName, lines, listMax, missing, part, plural, sortableTable, text, themeBudget, themeMax } from './piMeetingText.ts'
import { isNoneText } from './piReview.ts'
import type { Meeting, MeetingFeature, Slide } from './piMeeting.ts'

// Light, print-friendly series colours (validated categorical slots 1 and 2, a neutral grey for "other").
export const chartColours = { closed: '#257de0', carried: '#f47230', other: '#c4ccd6', bar: '#257de0', line: '#257de0', spike: '#c62828', grid: '#e3e7ec', axis: '#8a96a8' }
const settingsOf = (meeting: Meeting): MeetingSettings => meeting.settings ?? defaultMeetingSettings()
const noData = 'Not worked out: the executive figures were not given to this meeting.'
const execOf = (meeting: Meeting): MeetingExec | undefined => meeting.exec
const number = (value: number, digits = 0) => value.toLocaleString('en', { maximumFractionDigits: digits, minimumFractionDigits: 0 })
const hours = (value: number) => `${number(value, 1)} h`
const percent = (value: number | null) => value == null ? '—' : `${number(value, 1)} %`
const clip = (value: string, max: number) => value.length > max ? `${value.slice(0, max - 1)}…` : value

// ---- inline SVG charts ----
const W = 760
export function legend(series: { name: string; colour: string }[]) {
  return `<ul class="legend">${series.map((entry) => `<li><svg class="key" width="12" height="12" aria-hidden="true"><rect width="12" height="12" rx="2" fill="${entry.colour}"></rect></svg>${text(entry.name)}</li>`).join('')}</ul>`
}
// Horizontal bars, one row a label: stacked parts (series) or one value. 2px gaps between parts; the total at the end.
export function barChart(label: string, rows: { label: string; parts: number[]; total?: string }[], series: { name: string; colour: string }[]) {
  const left = 210, right = 70, area = W - left - right, row = 30, height = rows.length * row + 8
  const max = Math.max(1, ...rows.map((entry) => entry.parts.reduce((sum, value) => sum + value, 0)))
  const bars = rows.map((entry, at) => {
    const y = 4 + at * row
    let x = left
    const parts = entry.parts.map((value, index) => {
      if (value <= 0) return ''
      const width = Math.max(2, value / max * area - 2)
      const rect = `<rect x="${x.toFixed(1)}" y="${y + 5}" width="${width.toFixed(1)}" height="18" rx="3" fill="${series[index]?.colour ?? chartColours.bar}"><title>${text(`${entry.label}: ${series[index]?.name ?? ''} ${number(value, 1)}`)}</title></rect>`
      x += width + 2
      return rect
    }).join('')
    const sum = entry.parts.reduce((total, value) => total + value, 0)
    return `<text x="${left - 8}" y="${y + 19}" text-anchor="end" class="label">${text(clip(entry.label, 30))}</text>${parts}<text x="${(x + 4).toFixed(1)}" y="${y + 19}" class="value">${text(entry.total ?? number(sum, 1))}</text>`
  }).join('')
  return `<figure class="chart">${series.length > 1 ? legend(series) : ''}<svg class="chart" viewBox="0 0 ${W} ${height}" width="100%" role="img" aria-label="${text(label)}"><line x1="${left}" y1="0" x2="${left}" y2="${height}" stroke="${chartColours.axis}" stroke-width="1"></line>${bars}</svg></figure>`
}
// A line chart of a trend: the points, the peak labelled, the spikes marked, and the spike line (spikeFactor × average).
export function lineChart(trend: Trend) {
  const left = 56, right = 64, top = 30, bottom = 44, height = 240, plotW = W - left - right, plotH = height - top - bottom
  const values = trend.points.map((point) => point.value)
  const limit = spikeFactor * trend.average
  const max = Math.max(1, ...values, limit) * 1.1
  const x = (at: number) => left + (trend.points.length === 1 ? plotW / 2 : at / (trend.points.length - 1) * plotW)
  const y = (value: number) => top + plotH - value / max * plotH
  const path = trend.points.map((point, at) => `${x(at).toFixed(1)},${y(point.value).toFixed(1)}`).join(' ')
  const unit = trend.unit ? ` ${trend.unit}` : ''
  const marks = trend.points.map((point, at) => {
    const spike = trend.spikes.includes(at), peak = trend.peak === at
    const dot = spike ? `<circle cx="${x(at).toFixed(1)}" cy="${y(point.value).toFixed(1)}" r="7" fill="${chartColours.spike}" stroke="#ffffff" stroke-width="2"><title>${text(`${point.label}: ${number(point.value, 1)}${unit} — spike`)}</title></circle>` : `<circle cx="${x(at).toFixed(1)}" cy="${y(point.value).toFixed(1)}" r="4" fill="${chartColours.line}" stroke="#ffffff" stroke-width="2"><title>${text(`${point.label}: ${number(point.value, 1)}${unit}`)}</title></circle>`
    const tag = peak ? `<text x="${x(at).toFixed(1)}" y="${(y(point.value) - 12).toFixed(1)}" text-anchor="middle" class="value">${text(`Peak ${number(point.value, 1)}${unit}`)}</text>` : ''
    return `${dot}${tag}<text x="${x(at).toFixed(1)}" y="${height - 22}" text-anchor="middle" class="label">${text(clip(point.label, 14))}</text>`
  }).join('')
  const spikeLine = trend.average > 0 ? `<line x1="${left}" y1="${y(limit).toFixed(1)}" x2="${W - right}" y2="${y(limit).toFixed(1)}" stroke="${chartColours.spike}" stroke-width="1" stroke-dasharray="4 4"></line><text x="${left + 4}" y="${(y(limit) - 4).toFixed(1)}" class="label">${text(`${spikeFactor} × average = ${number(limit, 1)}${unit}`)}</text>` : ''
  return `<figure class="chart"><svg class="chart" viewBox="0 0 ${W} ${height}" width="100%" role="img" aria-label="${text(`${trend.measure}: line chart`)}"><line x1="${left}" y1="${top + plotH}" x2="${W - right}" y2="${top + plotH}" stroke="${chartColours.axis}" stroke-width="1"></line><text x="${left - 8}" y="${top + plotH + 4}" text-anchor="end" class="label">0</text><text x="${left - 8}" y="${top + 4}" text-anchor="end" class="label">${text(number(max, 0))}</text>${spikeLine}<polyline points="${path}" fill="none" stroke="${chartColours.line}" stroke-width="2"></polyline>${marks}</svg></figure>`
}

// ---- the Epics in the chosen order ----
const groupsOf = (meeting: Meeting) => epicGroups(meeting.features, settingsOf(meeting).epicOrder)
const orderNote = (meeting: Meeting) => `Epics by ${settingsOf(meeting).epicOrder === 'features' ? 'number of Features (most first)' : 'Epic ID'}; click a column header to re-sort.`
const pages = <T,>(items: T[], max = 10) => items.length ? chunks(items, max) : [[]]

// PIR-51: Executive summary — per Epic: Features, Closed in the PI, Carried forward, Ad-hoc; a stacked bar per Epic.
interface EpicLine { group: EpicGroup<MeetingFeature>; features: number; closed: number | null; carried: number; adhoc: number }
export function executiveLines(meeting: Meeting): EpicLine[] {
  const span = execOf(meeting)?.span
  return groupsOf(meeting).map((group) => ({ group, features: group.features.length, closed: span ? group.features.filter((feature) => closedInPi(feature, span)).length : null, carried: group.features.filter(carriedForward).length, adhoc: group.features.filter((feature) => feature.adhoc).length }))
}
export function executiveSlides(meeting: Meeting): Slide[] {
  const exec = execOf(meeting), list = executiveLines(meeting)
  const sum = (pick: (line: EpicLine) => number) => list.reduce((total, line) => total + pick(line), 0)
  const closedTotal = exec?.span ? sum((line) => line.closed ?? 0) : null
  const next = new Map<string, number>()
  for (const feature of meeting.features.filter(carriedForward)) { const pi = feature.review?.movePi || 'the next PI (not named)'; next.set(pi, (next.get(pi) ?? 0) + 1) }
  const nextText = [...next].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([pi, count]) => `${count} to ${pi}`).join(', ')
  const why = !exec ? noData : exec.span ? '' : exec.spanWhy
  return pages(list).map((page, at, all) => {
    const tiles = at ? '' : `<dl class="tiles">${tile('Features in the PI', number(meeting.features.length))}${tile('Closed in the PI', closedTotal == null ? '—' : number(closedTotal), closedTotal == null ? why : 'Closed / Done with the Closed Date in the PI')}${tile('Carried forward', number(sum((line) => line.carried)), nextText || 'Move to next PI = Yes: none')}${tile('Ad-hoc Features covered', number(sum((line) => line.adhoc)), 'tagged ad-hoc')}</dl>`
    const chart = barChart('Features per Epic: closed in the PI, carried forward, other', page.map((line) => { const closed = line.closed ?? 0, carried = line.group.features.filter((feature) => carriedForward(feature) && !(line.closed != null && closedInPi(feature, exec?.span))).length; return { label: line.group.name, parts: [closed, carried, Math.max(0, line.features - closed - carried)], total: `${line.features}` } }), [{ name: 'Closed in the PI', colour: chartColours.closed }, { name: 'Carried forward', colour: chartColours.carried }, { name: 'Other', colour: chartColours.other }])
    const table = sortableTable('Executive summary per Epic', [{ label: 'Epic' }, { label: 'Epic ID', num: true }, { label: 'Features', num: true }, { label: 'Closed in the PI', num: true }, { label: 'Carried forward', num: true }, { label: 'Ad-hoc', num: true }],
      page.map((line) => [cell(line.group.name), cell(line.group.epicId != null ? `#${line.group.epicId}` : '—', line.group.epicId ?? Number.MAX_SAFE_INTEGER), cell(line.features), line.closed == null ? cell('—', -1) : cell(line.closed), cell(line.carried), cell(line.adhoc)]),
      at === all.length - 1 ? `<tr><th scope="row">All Epics</th><td></td><td class="num">${list.reduce((total, line) => total + line.features, 0)}</td><td class="num">${closedTotal == null ? '—' : closedTotal}</td><td class="num">${sum((line) => line.carried)}</td><td class="num">${sum((line) => line.adhoc)}</td></tr>` : '')
    return { kind: 'executive', eyebrow: 'EXECUTIVE SUMMARY', title: part('Executive summary', at, all.length), body: `${tiles}${why ? missing(`Closed in the PI: ${why}`) : ''}${list.length ? `${chart}${table}<p class="note">${text(`${orderNote(meeting)} A Feature both closed and carried forward counts as closed in the chart. Carried forward: the latest review headed for ${meeting.pi} says Move to next PI = Yes.`)}</p>` : '<p class="muted">No Features in the PI.</p>'}` }
  })
}
const tile = (label: string, value: string, detail = '') => `<div class="tile"><dt>${text(label)}</dt><dd><strong>${text(value)}</strong>${detail ? `<small>${text(detail)}</small>` : ''}</dd></div>`

// PIR-60: Review completion per Epic — % reviewed (a review headed for the PI), the not reviewed count linking to the
// Features not reviewed slide.
export function completionSlides(meeting: Meeting): Slide[] {
  const groups = groupsOf(meeting)
  const reviewedOf = (group: EpicGroup<MeetingFeature>) => group.features.filter((feature) => feature.status === 'reviewed').length
  const share = (done: number, all: number) => all ? Math.round(done / all * 1000) / 10 : 0
  const total = meeting.features.length, done = meeting.features.filter((feature) => feature.status === 'reviewed').length
  const goto = (count: number) => count ? `<button type="button" class="goto" data-goto="not-reviewed">${text(count)}</button>` : '0'
  return pages(groups).map((page, at, all) => ({ kind: 'completion', eyebrow: 'REVIEW COMPLETION', title: part('Review completion per Epic', at, all.length), body: `${at ? '' : `<dl class="tiles">${tile('Reviewed', `${number(share(done, total), 1)} %`, `${done} of ${total} Features have a review headed for ${meeting.pi}`)}${tile('Not reviewed', number(total - done), 'listed on “Features not reviewed”')}</dl>`}${page.length ? `${barChart('Share of Features reviewed per Epic (%)', page.map((group) => ({ label: group.name, parts: [share(reviewedOf(group), group.features.length)], total: `${number(share(reviewedOf(group), group.features.length), 1)} %` })), [{ name: 'Reviewed %', colour: chartColours.bar }])}${sortableTable('Review completion per Epic', [{ label: 'Epic' }, { label: 'Features', num: true }, { label: 'Reviewed', num: true }, { label: 'Reviewed %', num: true }, { label: 'Not reviewed', num: true }],
    page.map((group) => { const count = reviewedOf(group), left = group.features.length - count; return [cell(group.name), cell(group.features.length), cell(count), cell(`${number(share(count, group.features.length), 1)} %`, share(count, group.features.length)), { html: goto(left), value: left }] }))}<p class="note">${text(`${orderNote(meeting)} A Not reviewed number opens the list of the Features not reviewed.`)}</p>` : '<p class="muted">No Features in the PI.</p>'}` }))
}

// PIR-52: PI-over-PI trend — closed, carried forward, ad-hoc and hours vs the previous PI, worked out the same way.
export function piTrendSlides(meeting: Meeting): Slide[] {
  const exec = execOf(meeting)
  if (!exec) return [{ kind: 'pi-trend', eyebrow: 'PI-OVER-PI TREND', title: 'PI-over-PI trend', body: missing(noData) }]
  const lines = executiveLines(meeting)
  const now = { closed: exec.span ? lines.reduce((sum, line) => sum + (line.closed ?? 0), 0) : null, carried: lines.reduce((sum, line) => sum + line.carried, 0), adhoc: lines.reduce((sum, line) => sum + line.adhoc, 0), hours: exec.hours.why ? null : exec.hours.total }
  const before = exec.previous
  if (!before) return [{ kind: 'pi-trend', eyebrow: 'PI-OVER-PI TREND', title: 'PI-over-PI trend', body: `${missing(`No previous PI to compare with: ${exec.previousWhy}`)}` }]
  const row = (label: string, current: number | null, previous: number | null, why: string, format: (value: number) => string = (value) => number(value)) => {
    const change = current == null || previous == null ? '' : current > previous ? `<span class="up">▲ ${text(format(current - previous))}</span>` : current < previous ? `<span class="down">▼ ${text(format(previous - current))}</span>` : '<span class="same">= no change</span>'
    const spike = current != null && previous != null && previous > 0 && current > spikeFactor * previous ? ' <span class="spike-tag">spike</span>' : ''
    return `<tr><th scope="row">${text(label)}</th><td class="num">${previous == null ? '—' : text(format(previous))}</td><td class="num">${current == null ? '—' : text(format(current))}</td><td>${change}${spike}${why ? ` <small class="muted">${text(why)}</small>` : ''}</td></tr>`
  }
  return [{ kind: 'pi-trend', eyebrow: 'PI-OVER-PI TREND', title: `PI-over-PI trend: ${before.pi} → ${meeting.pi}`, body: `<table><thead><tr><th>Measure</th><th class="num">${text(before.pi)}</th><th class="num">${text(meeting.pi)}</th><th>Change</th></tr></thead><tbody>
${row('Features closed in the PI', now.closed, before.closed, now.closed == null ? exec.spanWhy : before.why.closed)}
${row('Carried forward', now.carried, before.carried, before.why.carried)}
${row('Ad-hoc Features', now.adhoc, before.adhoc, '')}
${row('Actual hours', now.hours, before.hours, now.hours == null ? exec.hours.why : before.why.hours, hours)}
</tbody></table><p class="note">${text(`${before.pi} is worked out the same way from the same data: its Features, its dates, its reviews (headed for ${before.pi}) and its Time Writing months. A spike: this PI above ${spikeFactor} × the previous PI.`)}</p>` }]
}

// PIR-53: Repeat carry-overs — carried forward in two or more PIs in a row: a risk.
export function repeatSlides(meeting: Meeting): Slide[] {
  const exec = execOf(meeting)
  if (!exec) return [{ kind: 'repeat', eyebrow: 'RISK', title: 'Repeat carry-overs', body: missing(noData) }]
  if (!exec.streaks.length) return [{ kind: 'repeat', eyebrow: 'RISK', title: 'Repeat carry-overs', body: exec.streakWhy ? missing(exec.streakWhy) : '<p>None: no Feature was carried forward in two or more PIs in a row.</p>' }]
  const rows = [...exec.streaks].sort((a, b) => b.pis.length - a.pis.length || a.id - b.id)
  return chunks(rows, listMax).map((page, at, all) => ({ kind: 'repeat', eyebrow: `RISK · ${plural(rows.length, 'FEATURE')}`, title: part('Repeat carry-overs', at, all.length), body: `<p class="warning">${text('Risk: these Features were carried forward (Move to next PI = Yes) in two or more PIs in a row.')}</p>${sortableTable('Repeat carry-overs', [{ label: 'ID', num: true }, { label: 'Title' }, { label: 'Epic' }, { label: 'PIs in a row', num: true }, { label: 'Carried forward in' }], page.map((entry) => [cell(entry.id), cell(entry.title), cell(entry.epic), cell(entry.pis.length), cell([...entry.pis].reverse().join(' → '))]))}` }))
}

// PIR-60: Topics for discussion — each point (Learnings, Struggles, Additional Remarks lines) of the Features marked
// "Discuss during Meeting", with who raised it (the review's author, display name only) and when.
export function topicItems(meeting: Meeting) {
  const order = new Map(groupsOf(meeting).map((group, at) => [group.key, at]))
  const keyOf = (feature: MeetingFeature) => feature.epicId != null ? `#${feature.epicId}` : feature.epic ? `name:${feature.epic}` : ''
  return meeting.features.filter((feature) => feature.status === 'reviewed' && feature.review?.reviewMode === 'Discuss during Meeting')
    .sort((a, b) => (order.get(keyOf(a)) ?? 0) - (order.get(keyOf(b)) ?? 0) || a.id - b.id)
    .flatMap((feature) => (['learnings', 'struggles', 'remarks'] as const).flatMap((which) => lines(feature.review![which]).filter((line) => !isNoneText(line)).map((line) => ({ id: feature.id, title: feature.title, point: which === 'learnings' ? 'Learning' : which === 'struggles' ? 'Struggle' : 'Remark', text: line, by: displayName(feature.review!.author), when: feature.review!.date }))))
}
export function topicSlides(meeting: Meeting): Slide[] {
  const items = topicItems(meeting)
  if (!items.length) return [{ kind: 'topics', eyebrow: 'TOPICS FOR DISCUSSION', title: 'Topics for discussion', body: '<p class="muted">No point was raised in a review marked “Discuss during Meeting”.</p>' }]
  return chunks(items, themeMax, themeBudget, (item) => item.text.length + 60).map((page, at, all) => ({ kind: 'topics', eyebrow: `TOPICS FOR DISCUSSION · ${plural(items.length, 'POINT')}`, title: part('Topics for discussion', at, all.length), body: sortableTable('Topics for discussion', [{ label: 'Feature' }, { label: 'Point' }, { label: 'Raised' }, { label: 'By' }, { label: 'When' }], page.map((item) => [{ html: `<span class="fid">#${item.id}</span> ${text(item.title)}`, value: item.id }, cell(item.point), cell(item.text), cell(item.by), cell(item.when)])) }))
}

// PIR-54: Releases in the PI — per ticked stream the releases and their Release Classification counts.
export function releaseSlides(meeting: Meeting): Slide[] {
  const exec = execOf(meeting)
  if (!exec) return [{ kind: 'releases', eyebrow: 'RELEASES', title: 'Releases in the PI', body: missing(noData) }]
  if (!exec.releases.length) return [{ kind: 'releases', eyebrow: 'RELEASES', title: 'Releases in the PI', body: `<p>${text(exec.releasesWhy || 'No release-based streams chosen')}.</p><p class="muted">${text('The streams are ticked in Admin → Feature & PI setup → PI Review form → Meeting presentation.')}</p>` }]
  const known = exec.releases.filter((entry) => entry.releases != null)
  const total = known.reduce((sum, entry) => sum + (entry.releases ?? 0), 0)
  const classes = (entry: MeetingExec['releases'][number]) => entry.releases == null ? '—' : entry.classWhy ? `— (${entry.classWhy})` : [...entry.classes.map(([name, count]) => `${name} ${count}`), ...(entry.unclassified ? [`not classified ${entry.unclassified}`] : [])].join(' · ') || '—'
  return [{ kind: 'releases', eyebrow: 'RELEASES', title: 'Releases in the PI', body: `<dl class="tiles">${tile('Releases in the PI', known.length ? number(total) : '—', exec.span ? `${exec.span.start} – ${exec.span.end}` : exec.spanWhy)}${tile('Streams', number(exec.releases.length), exec.releases.map((entry) => entry.stream).join(', '))}</dl>${known.length ? barChart('Releases per stream', known.map((entry) => ({ label: entry.stream, parts: [entry.releases ?? 0], total: number(entry.releases ?? 0) })), [{ name: 'Releases', colour: chartColours.bar }]) : ''}${sortableTable('Releases per stream', [{ label: 'Stream' }, { label: 'Releases', num: true }, { label: 'Release Classification' }], exec.releases.map((entry) => [cell(entry.stream), entry.releases == null ? { html: `— <small class="muted">${text(entry.why)}</small>`, value: -1 } : cell(entry.releases), cell(classes(entry))]))}<p class="note">${text('Counted from the Release Details data of each stream: a release with its date (approval, else the stream’s own completion date) inside the PI’s dates, each once.')}</p>` }]
}

// PIR-55: Hours per Epic — actual hours (Completed Work of the month Tasks in the PI's months, by the Feature's Epic) and
// the Allocation %; Utilization — actual ÷ available capacity, the Dashboard's formula.
export function hoursSlides(meeting: Meeting): Slide[] {
  const exec = execOf(meeting)
  if (!exec) return [{ kind: 'hours', eyebrow: 'HOURS', title: 'Hours per Epic', body: missing(noData) }]
  const figures = exec.hours
  if (figures.why) return [{ kind: 'hours', eyebrow: 'HOURS', title: 'Hours per Epic', body: missing(figures.why) }]
  const featureCount = new Map(groupsOf(meeting).map((group) => [group.epicId, group.features.length]))
  const order = settingsOf(meeting).epicOrder
  const list = [...figures.byEpic].sort((a, b) => (a.key === 'unmapped' ? 1 : 0) - (b.key === 'unmapped' ? 1 : 0) || (order === 'features' ? (featureCount.get(b.epicId) ?? 0) - (featureCount.get(a.epicId) ?? 0) : 0) || (a.epicId ?? Infinity) - (b.epicId ?? Infinity) || a.title.localeCompare(b.title))
  return pages(list).map((page, at, all) => ({ kind: 'hours', eyebrow: `HOURS · ${figures.months.map(monthLabel).join(', ').toUpperCase()}`, title: part('Hours per Epic', at, all.length), body: `${at ? '' : `<dl class="tiles">${tile('Actual hours', hours(figures.total), 'booked on Epics in the PI’s months')}${tile('Epics', number(list.length), 'with hours')}</dl>`}${barChart('Actual hours per Epic', page.map((entry) => ({ label: entry.title, parts: [entry.hours], total: `${hours(entry.hours)} · ${number(entry.share, 1)} %` })), [{ name: 'Actual hours', colour: chartColours.bar }])}${sortableTable('Hours per Epic', [{ label: 'Epic' }, { label: 'Epic ID', num: true }, { label: 'Actual hours', num: true }, { label: 'Allocation %', num: true }], page.map((entry) => [cell(entry.title), cell(entry.epicId != null ? `#${entry.epicId}` : '—', entry.epicId ?? Number.MAX_SAFE_INTEGER), cell(hours(entry.hours), entry.hours), cell(`${number(entry.share, 1)} %`, entry.share)]), at === all.length - 1 ? `<tr><th scope="row">All Epics</th><td></td><td class="num">${text(hours(figures.total))}</td><td class="num">100 %</td></tr>` : '')}<p class="note">${text('Actuals only: the Completed Work of the Time Writing month Tasks in the PI’s months (a month belongs to the PI that holds its 15th day), by the Feature’s Epic, as Team overview counts them. Allocation % = the Epic’s hours ÷ the hours of all Epics.')}</p>` }))
}
export function utilizationSlides(meeting: Meeting): Slide[] {
  const exec = execOf(meeting)
  if (!exec) return [{ kind: 'utilization', eyebrow: 'UTILIZATION', title: 'Utilization', body: missing(noData) }]
  const figures = exec.utilization
  if (figures.why && !figures.byMonth.length) return [{ kind: 'utilization', eyebrow: 'UTILIZATION', title: 'Utilization', body: missing(figures.why) }]
  return [{ kind: 'utilization', eyebrow: 'UTILIZATION', title: 'Utilization', body: `<dl class="tiles">${tile('Team utilization', percent(figures.percent), figures.why || `${hours(figures.actual)} actual ÷ ${hours(figures.capacity)} available`)}${tile('People', number(figures.people), 'with Time Writing in the PI’s months')}</dl>${barChart('Utilization per month (%)', figures.byMonth.map((entry) => ({ label: monthLabel(entry.month), parts: [entry.percent ?? 0], total: percent(entry.percent) })), [{ name: 'Utilization %', colour: chartColours.bar }])}${sortableTable('Utilization per month', [{ label: 'Month' }, { label: 'Actual hours', num: true }, { label: 'Available capacity', num: true }, { label: 'Utilization', num: true }], figures.byMonth.map((entry) => [cell(monthLabel(entry.month), entry.month), cell(hours(entry.actual), entry.actual), cell(hours(entry.capacity), entry.capacity), cell(percent(entry.percent), entry.percent ?? -1)]))}<p class="note">${text('The Dashboard’s formula: actual (utilized) hours ÷ available capacity (contractual hours less absence) for the PI’s months, the team as a whole.')}</p>` }]
}

// PIR-56: Trends, peaks and spikes — one slide per measure: the line, the peak labelled, the spikes marked and listed.
export function trendSlides(meeting: Meeting): Slide[] {
  const exec = execOf(meeting)
  if (!exec) return [{ kind: 'trends', eyebrow: 'TRENDS, PEAKS AND SPIKES', title: 'Trends, peaks and spikes', body: missing(noData) }]
  return exec.trends.map((trend) => {
    const unit = trend.unit ? ` ${trend.unit}` : ''
    if (trend.why) return { kind: 'trends', eyebrow: 'TRENDS, PEAKS AND SPIKES', title: trend.measure, body: missing(trend.why) }
    const spikes = trend.spikes.map((at) => trend.points[at])
    return { kind: 'trends', eyebrow: 'TRENDS, PEAKS AND SPIKES', title: trend.measure, body: `${lineChart(trend)}<p class="rule">${text(`Rule: a spike is a point above ${spikeFactor} × the PI’s average (average ${number(trend.average, 1)}${unit}; spike above ${number(spikeFactor * trend.average, 1)}${unit}).${trend.peak != null ? ` Peak: ${trend.points[trend.peak].label}, ${number(trend.points[trend.peak].value, 1)}${unit}.` : ''}`)}</p>${spikes.length ? `<table><thead><tr><th>Spike</th><th class="num">Value</th><th>Top contributors</th></tr></thead><tbody>${spikes.map((point) => `<tr><td>${text(point.label)}</td><td class="num">${text(`${number(point.value, 1)}${unit}`)}</td><td>${text(point.detail || '—')}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">No spike in this PI.</p>'}` }
  })
}

// PIR-57: Long-running Features of the ticked streams — oldest first, each with its Epic's threshold.
export function longRunningSlides(meeting: Meeting): Slide[] {
  const exec = execOf(meeting)
  if (!exec) return [{ kind: 'long-running', eyebrow: 'LONG-RUNNING', title: 'Long-running Features', body: missing(noData) }]
  const figures = exec.long
  if (figures.why) return [{ kind: 'long-running', eyebrow: 'LONG-RUNNING', title: 'Long-running Features', body: missing(figures.why) }]
  const counts = sortableTable('Long-running Features by stream', [{ label: 'Stream' }, { label: 'Long-running', num: true }], figures.byStream.map((entry) => [cell(entry.stream), entry.why ? { html: `— <small class="muted">${text(entry.why)}</small>`, value: -1 } : cell(entry.count)]))
  const head = `<p class="note">${text(`Not Closed / Done and created more than N PIs ago (N per Epic, set in PI setup). Age from the Created Date to the build, in months · years · PIs (one PI = ${figures.piDays} days, the length of ${meeting.pi}).`)}</p>`
  if (!figures.rows.length) return [{ kind: 'long-running', eyebrow: 'LONG-RUNNING', title: 'Long-running Features', body: `${counts}${head}<p>None: no open Feature of these streams is older than its threshold.</p>` }]
  return chunks(figures.rows, 10).map((page, at, all) => ({ kind: 'long-running', eyebrow: `LONG-RUNNING · ${plural(figures.rows.length, 'FEATURE')}`, title: part('Long-running Features', at, all.length), body: `${at ? '' : counts}${sortableTable('Long-running Features, oldest first', [{ label: 'ID', num: true }, { label: 'Title' }, { label: 'Epic' }, { label: 'State' }, { label: 'Created' }, { label: 'Age (months · years · PIs)', num: true }, { label: 'Threshold (PIs)', num: true }, { label: 'Move to next PI' }],
    page.map((entry) => [cell(entry.id), cell(entry.title), cell(entry.epic), cell(entry.state), cell(entry.created), cell(`${number(entry.months, 1)} · ${number(entry.years, 1)} · ${entry.pis == null ? '—' : number(entry.pis, 1)}`, entry.days), cell(entry.threshold), cell(entry.move || '—')]))}${at ? '' : head}` }))
}

// The accent colour of the file (validated; the default otherwise).
export const accentOf = (settings: MeetingSettings | undefined) => settings && isHexColour(settings.accent) ? settings.accent.toLowerCase() : defaultMeetingSettings().accent
// Executive slides' styles (the charts, the sortable headers, the dark title slide); `accent` set per build.
export const execStyle = (accent: string) => `/* PIR-58: the footer text and the slide number side by side on the left, clear of the presenting controls. */
.slide footer{justify-content:flex-start;gap:24px}
.slide-title.dark{background:${accent};color:#fff}
.slide-title.dark h1,.slide-title.dark .eyebrow,.slide-title.dark .muted,.slide-title.dark footer{color:#fff}
.slide-title.dark footer{border-top-color:rgba(255,255,255,.4)}
.subtitle{font-size:20px;margin:0 0 12px}
.chart{margin:6px 0 10px}
svg.chart{display:block;max-width:100%;height:auto}
svg.chart .label{font-size:12px;fill:#3b4757}
svg.chart .value{font-size:12px;font-weight:600;fill:#1b2430}
.legend{display:flex;flex-wrap:wrap;gap:6px 18px;margin:0 0 6px;padding:0;list-style:none;font-size:13px;color:#3b4757}
.legend li{display:flex;align-items:center;gap:6px}
.missing{padding:10px 14px;border-left:4px solid #8a96a8;background:#f2f5f8}
.missing strong{font-size:20px;margin-right:6px}
.note,.rule{font-size:13px;color:#56657a}
.rule{font-weight:600}
.up{color:#1b5e20;font-weight:600}.down{color:#b71c1c;font-weight:600}.same{color:#56657a}
.spike-tag{display:inline-block;padding:0 6px;border-radius:8px;background:#fdecea;color:#b71c1c;font-size:12px;font-weight:700}
th button.sort{all:unset;cursor:pointer;display:inline-flex;gap:4px;align-items:center}
th button.sort:focus-visible{outline:2px solid ${accent};outline-offset:2px}
th[aria-sort="ascending"] .arrow::after{content:"▲"}
th[aria-sort="descending"] .arrow::after{content:"▼"}
button.goto{font:inherit;padding:0 8px;border:1px solid #c4ccd6;border-radius:6px;background:#fff;color:${accent};cursor:pointer;text-decoration:underline}
button.goto:focus-visible{outline:2px solid ${accent};outline-offset:2px}
tfoot th,tfoot td{font-weight:700;border-top:2px solid #c4ccd6}
table+table,table+p+table{margin-top:18px}
@media print{th button.sort .arrow{display:none}.slide-title.dark{background:#fff;color:#1b2430}.slide-title.dark h1{color:${accent}}}
`
