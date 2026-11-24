---
bump: minor
---
**Added**
- **Pulse Check → Year: Completed releases, cumulative** — with Period = Year, a panel after the period table with one chart: a line per stream adding up its Completed releases from January, an All streams line and a column per month with the month's sum, switched with Per stream, All streams and Month sum (kept per person in the personal views, entry `pulse-cumulative`). Each month counts exactly as its Month tab does (DP's Completed Releases, IOCC's and CP's Completed, Content's releases, Tool Validations' tools, custom streams, the Windchill exports' releases dated in the month and the counts an Admin entered), so December's running total of a stream is the sum of its Month tabs; the Year row counts each release once, and ⓘ says why December can be higher. Months after the current one are empty. Below the chart, each month's count per stream with the Month total and the Cumulative total, with Export; streams not counted (QV-66) have no line and are not in the sums (QV-68, QV-69).
- **My dashboard → Completed releases per stream per month** — a data source with Stream, Month, Completed releases and Counted in Pulse Check, counted as the Month tabs count them; a line chart by Month split by Stream with Running total is Pulse Check's Year chart (MYD-25).
- Not in scope: the On-Demand Dashboard pages do not offer the new source; the chart is in the Year view only (LIM-66).

DF-268, DF-269, SM-150, LIM-66; TC-QV-49 (UAT), TC-MYD-10.
