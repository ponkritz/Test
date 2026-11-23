---
bump: minor
---
**Added**
- **Insights filter row** — the owners of a Table + Insights page (CoNQ included) can give its Insights tab a filter row with **Filters…**, next to ＋ Add chart / table: a period on one Date column (Year → Quarter → Month as on the On-Demand Dashboard, the current year to start with) and up to 6 filters (Dropdown / Multi-select values, a Date's from / to month, a Text's "contains", a Number's from / to), saved to Git at once in the page's file as the optional field `insightFilters` (validated when read; a removed column left out with a note; merged as one entry). Each viewer narrows every chart and table of the tab with it — the Table views and the rows behind a bar too — on top of each chart's own filters, with a line naming the choice and "n of m rows counted" and **Reset filters**; the choice is remembered per viewer and page (personal views). Without the right Filters… is disabled with the reason. Pages without a filter row and the On-Demand Dashboard pages are unchanged (OND-50…OND-56).

DF-190, DF-191, DF-192, SM-110, LIM-35, OI-18; TC-OND-40…45.
