---
bump: minor
---
**Changed**
- **The chart editor in tabs** (product owner: "group it by category or setting — it is too long") — the chart pop-up of the Insights tab and the On-Demand Dashboard block pop-up hold their fields in tabs instead of one long form: **Data** (title, type, the fields, the measure, Group dates by, Show, Sort; on a block also the data source, the period's Date column and the dashboard tab), **Filters**, **Format** (orientation, series, running total, percent, target line, Show as, width and height, colours) and **Elements** (the chart elements with the axis names), or **Narrative** for a narrative. Only the tabs the type takes are shown; the pop-up opens on Data; the arrow keys, Home and End move between the tabs (CHT-70, CHT-14, CHT-66).
- **A tab says what it holds** — "Filters (2)", "Elements (1)": the settings changed from the defaults (CHT-71). After Save a tab with an invalid field shows a red marker with the reason, and Save opens and focuses the first one (CHT-72).
- **The preview beside the tabs, the buttons always in view** — the preview stays beside the tabs in a wide pop-up (under them in a narrow one), Cancel and Save never scroll away, the pop-up keeps its height from tab to tab; on a phone the tabs scroll sideways (CHT-73, CHT-38).
- Nothing is saved differently: the same fields, labels and defaults.

**Fixed**
- An automated check of the KPI cards (TC-CHT-31) now waits for the page to finish laying out after a width change before measuring a card, so it no longer fails now and then.

DF-254, LIM-61; TC-CHT-58, TC-CHT-59.
