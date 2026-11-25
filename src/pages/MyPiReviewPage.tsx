import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import { DataTable, type DataColumn } from '../components/DataTable'
import { EmptyState, Notice, Page, Pill, TablePanel, WriteBlocked } from '../components/ui'
import { formatDateTime } from '../format'
import { isMine } from '../myWork'
import { discussionOf, discussionsVersion, moveLabel, oneLine, piFeatures, piLabel, readDiscussions, reviewModeLabel, samePi, subscribeDiscussions, type ReviewSplit } from '../piReview'
import { rateLimitWait } from '../azureDevOps'
import { myReviewOf, readDiscussionInto, reviewPageBlock, reviewPostBlock } from '../piReviewPost'
import { ReviewDialog } from './PiReviewForm'
import { formSetupOf, useReviewViewer, useReviewWriter } from '../piReviewWriter'
import type { PiFormSetup } from '../piReviewSetup'
import { usePiChoice } from './usePiChoice'
import type { WorkItemComment } from '../azureDevOps'
import type { AzureWorkItem } from '../domain'
import type { AzureWorkspace } from '../useAzureWorkspace'
import type { MyWork } from '../useMyWork'

// My PI Review (PIR-17, My Work group): the Features assigned to me in a PI (the current PI first, a PI picker), each
// with my review status — my latest review comment (a comment I wrote with the review headings) and its date, its Move
// to next PI and Review mode — and Write review… (the PI Review form, PIR-13). My Features' Discussions are read when the
// page opens (only mine, 3 at a time) and kept for this page load, shared with PI Review.
const piKey = 'demand-planning-my-pi-review-pi-v1'
type Status = { state: 'unread' | 'loading' | 'error' | 'none' | 'reviewed'; comment?: WorkItemComment; split?: ReviewSplit; error?: string }
function statusOf(item: AzureWorkItem, name: string | undefined, setup?: PiFormSetup): Status {
  const entry = discussionOf(item.key)
  if (!entry) return { state: 'unread' }
  if (entry.state === 'loading') return { state: 'loading' }
  if (entry.state === 'error') return { state: 'error', error: entry.error }
  const mine = myReviewOf([...entry.comments].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id), name, setup)
  return mine ? { state: 'reviewed', ...mine } : { state: 'none' }
}
const statusLabel: Record<Status['state'], string> = { unread: 'Not read', loading: 'Reading…', error: 'Not read', none: 'Not reviewed', reviewed: 'Reviewed' }

export function MyPiReviewPage({ azure, my }: { azure: AzureWorkspace; my: MyWork }) {
  const { config, pat, items, isSample } = azure
  const poster = useReviewViewer()
  // PIR-19: my review is found by the headings of the form setup in use (and the built-in ones).
  const setup = formSetupOf(poster.env)
  useSyncExternalStore(subscribeDiscussions, discussionsVersion)
  const { options, current, pi, choose, fallback, remembered, iterations } = usePiChoice(azure, piKey)
  const name = my.me.name
  const rows = useMemo(() => my.known ? piFeatures(items, pi).filter((item) => isMine(item, my.me)) : [], [items, pi, my.known, my.me])
  const readBlocked = isSample ? 'Synthetic sample data is loaded: the Discussions are not read from Azure DevOps.' : !config || !pat.trim() ? 'Connect the Time Writing connection (with its PAT) to read the Discussions.' : ''
  // PIR-17: read my Features' Discussions not read yet (3 at a time), once per Feature list.
  const readKey = useRef('')
  const listKey = rows.map((item) => item.key).join(',')
  useEffect(() => {
    if (readBlocked || !config || !listKey || readKey.current === listKey) return
    readKey.current = listKey
    const targets = rows.filter((item) => !discussionOf(item.key))
    if (targets.length) void readDiscussions(targets.map((item) => item.id), (id) => readDiscussionInto(config, pat, targets.find((item) => item.id === id)!), { rateWait: rateLimitWait })
  }, [listKey, readBlocked, config, pat, rows])
  const writer = useReviewWriter(pi)
  const pageBlock = reviewPageBlock(poster)

  const columns: DataColumn<AzureWorkItem>[] = [
    { id: 'id', label: 'ID', value: (item) => item.id, align: 'right', render: (item) => item.url ? <a href={item.url} target="_blank" rel="noreferrer" title={`Open Feature #${item.id} in Azure DevOps`}>{item.id}</a> : item.id },
    { id: 'title', label: 'Title', value: (item) => item.title },
    { id: 'state', label: 'State', value: (item) => item.state },
    { id: 'status', label: 'My review', hint: 'Reviewed: you wrote a review comment (with the review headings) in the Feature’s Discussion; Not reviewed: none yet. Read from Azure DevOps when the page opens.',
      value: (item) => statusLabel[statusOf(item, name, setup).state], title: (item) => statusOf(item, name, setup).error,
      render: (item) => { const status = statusOf(item, name, setup); return <Pill tone={status.state === 'reviewed' ? 'open' : status.state === 'none' ? 'warning' : status.state === 'error' ? 'danger' : 'neutral'}>{statusLabel[status.state]}</Pill> } },
    { id: 'date', label: 'Date of my review', firstSortDesc: true, value: (item) => statusOf(item, name, setup).comment?.date ?? '', render: (item) => { const status = statusOf(item, name, setup); return status.comment ? formatDateTime(status.comment.date) : <span className="muted">—</span> } },
    { id: 'move', label: 'Move to Next PI', value: (item) => { const split = statusOf(item, name, setup).split; return split ? moveLabel(split) : '' }, render: (item) => { const split = statusOf(item, name, setup).split; return split ? <span className="pir-clip">{oneLine(moveLabel(split))}</span> : <span className="muted">—</span> } },
    { id: 'review-mode', label: 'Review mode', value: (item) => { const split = statusOf(item, name, setup).split; return split ? reviewModeLabel(split) : '' } },
    { id: 'actions', label: 'Actions', export: false, sortable: false,
      render: (item) => { const why = reviewPostBlock(poster, item); return <button type="button" className="ghost" disabled={Boolean(why)} title={why || `Write the PI review of Feature #${item.id}`} aria-label={`Write review of Feature ${item.id}`} onClick={() => void writer.start(item)}>Write review…</button> } },
  ]
  const reviewed = rows.filter((item) => statusOf(item, name, setup).state === 'reviewed').length
  const notice = !iterations.done ? '' : fallback.why === 'overlap' || ((fallback.why === 'fallback' || fallback.why === 'none') && !remembered) ? fallback.note : ''
  const toolbar = <span className="people-filters pir-filters">
    <label className="inline-select">PI<select aria-label="PI" value={pi} onChange={(event) => choose(event.target.value)}>
      {!pi && <option value="">Choose a PI…</option>}
      {options.map((entry) => <option key={entry} value={entry}>{piLabel(entry)}{samePi(entry, current) ? ' (current)' : ''}</option>)}
    </select></label>
    {pi && samePi(pi, current) && <Pill tone="info">Current PI</Pill>}
  </span>
  return <Page intro="The Features assigned to you in a PI and whether you have written their PI review. Write review… posts it as a new comment in the Feature’s Discussion in Azure DevOps.">
    {notice && <Notice tone="warning">{notice}</Notice>}
    {!my.known ? <EmptyState title="Who are you in Azure DevOps?" detail="Enter your work email on the Time Writing connection, or choose your name in My Tasks [Board]." />
      : <TablePanel title="My Features" info="The Features of the chosen PI assigned to you (not Removed, not under the absence Epic). Their Discussions are read from Azure DevOps when the page opens and kept for this page load; My review says whether you wrote a review comment (with the review headings), and when.">
        <WriteBlocked reason={readBlocked || pageBlock} />
        <DataTable id="mypireview:features" className="pir-table" columns={columns} rows={rows} rowKey={(item) => item.key} exportName={`My PI Review ${pi ? piLabel(pi) : ''}`.trim()} toolbar={toolbar}
          status={`${reviewed} of ${rows.length} reviewed`} defaultSort={{ id: 'id' }}
          empty={<EmptyState title={!pi ? 'Choose a PI.' : `No Features assigned to you in ${piLabel(pi)}.`} detail={!pi ? 'Pick the PI in the PI list.' : 'Choose another PI, or fetch the data again.'} />} />
      </TablePanel>}
    {writer.writing && <ReviewDialog key={`review:${writer.writing.item.key}`} writing={writer.writing} blocked={reviewPostBlock(poster, writer.writing.item)} onPost={writer.post} onClose={writer.cancel} />}
  </Page>
}
