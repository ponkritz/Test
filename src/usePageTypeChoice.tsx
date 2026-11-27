import { useState } from 'react'
import type { PageKind } from './menuLayout'
import { defaultTicks, newPageType, pageTypeOf, type TypeTicks } from './pageType'
import type { QueryPickerOptions } from './useAzureQueryPicker'
import { useTableQueryPicker } from './useTableQueryPicker'
import { PageTypeField } from './components/PageTypeField'

// PGB-22, PGB-23, PGB-28: the page type of a new page (Add page, Tool Validations ＋ Add tab…) — the ticks, and with
// Table (Query) its query: a saved query (the dashboards' picker, DSH-18) or a custom WIQL query. result: the type and
// source to create, or why the main button is disabled.
export function usePageTypeChoice(azure: QueryPickerOptions, onEdit: () => void, hideStreamNote = false) {
  const [ticks, setTicks] = useState<TypeTicks>(defaultTicks)
  const picker = useTableQueryPicker(azure, { radioName: 'page-query-how', onEdit })
  const type = pageTypeOf(ticks)
  const query = typeof type !== 'string' && type.kind !== 'dashboard' && type.source === 'query'
  const result = typeof type === 'string' ? type : query && typeof picker.result === 'string' ? picker.result : newPageType(ticks, query && typeof picker.result !== 'string' ? picker.result : null)
  const field = <>
    <PageTypeField ticks={ticks} onChange={(next) => { setTicks(next); onEdit() }} hideStreamNote={hideStreamNote} />
    {query && picker.fields}
  </>
  return { field, result, kind: typeof type === 'string' ? 'table' as PageKind : type.kind, query, queryMode: picker.mode }
}
