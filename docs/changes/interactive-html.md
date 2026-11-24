---
bump: minor
---
**Changed**
- **Publish interactive HTML…** replaces Publish standalone HTML…: the published file is now an **interactive offline dashboard** — the page's KPI cards and charts drawn by the app's own chart code (tooltips, Table view, Data labels, drill-down to the rows behind a bar), its own filter row to narrow further, a Rows tab with sort, Columns, search and Export, Light / Dark, on a phone too — instead of a static snapshot (OND-90, OND-93, OND-95, OND-97).
- **Only the filtered data is published**: a table page's file holds only the rows that pass the publisher's Insights filter row, a dashboard's only the rows its blocks count with the publisher's period and filters; hidden rows never; the file's header says "Data published: {filters} · {n} of {m} rows" and the pop-up "This file contains the {n} rows of {page} that pass your filters." (OND-91, OND-93, OND-99).
- A **schedule** keeps the filters it was saved with; Publish now uses the current filters (OND-96, OND-78).
- The file allows only its own script and styles by their SHA-256 hashes and makes no request; the data is an escaped JSON block, rows without their update log (OND-94).

**Added**
- **On-Demand Dashboards** can be published as an interactive HTML file too — tabs, KPI tiles, blocks, filter row and the rows of each data source; blocks over the Time Writing hours are not published (OND-73, OND-92).
- The file's viewer is built with the app (`vite build`, `dist/standalone-viewer.js` / `.css`, about 540 KB) and loaded only when publishing (OND-98).

OND-73, OND-75, OND-78…OND-80 changed or retired (OND-74, OND-77, OND-80 retired); DF-220, DF-221, DF-250…DF-253; SM-120, SM-121, SM-140…SM-142; LIM-44, LIM-60; TC-OND-60 and TC-OND-63 retired, TC-OND-90…TC-OND-97.
