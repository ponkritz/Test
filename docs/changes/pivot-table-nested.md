---
bump: minor
---
**Added**
- **Pivot table with nested rows and columns** — the chart type Summary table is now called **Pivot table** (on the Insights tab and On-Demand Dashboard pages): **Rows** by up to 3 fields and **Columns** by up to 2, each added with **＋ then by** and moved with ↑ ↓ or removed with ✕ on the Data tab (e.g. Epic → Feature → State down, Stream → Month across). Every group has a **subtotal** on its own line and every outer column a **Subtotal** column, with the Total row and column; every measure works at every level — an Average or a Distinct count of a group is worked out from its rows, never by adding up its cells; a Multi-select counts in each of its values; Date fields follow Group dates by (CHT-74, CHT-75, CHT-76, CHT-78).
- **Open and close groups** with ▸ / ▾, **Collapse all** and **Expand all** — for you and this visit only; the first 10 outer rows with **Show all**; at most 2,000 numbers drawn at once, said under the table (CHT-77, CHT-81, CHT-82).
- **Rows behind any number** — a cell, a subtotal or a total — with every group filter applied, and **Export** (Excel / CSV) of a flat table: one column per row field, a Line column marking Subtotal and Total, one column per column combination (CHT-80).
- Stored additively (`rows2`, `rows3`, `second2`): a one-level table and every older file stay as they are; an older app version shows a nested table as its outer row and column field and drops the inner ones if it saves the page (CHT-79, LIM-104).
- **Value name** on the Data tab: the chart's value is named by it, else by the title typed on the value axis, else by the measure — the same in the legend, Table view, data table, tooltips, data labels, table headings, Rows behind and Export (CHT-83, KB-101).

**Fixed**
- **A Git save that got no answer or a server error** ("Failed to fetch", HTTP 500) is tried once more by itself and then said in plain words — "GitHub could not be reached (network, VPN or proxy) …" or "GitHub had a problem saving … press Retry in a minute", with the file's size and, for a large page, Convert to row files; the change is kept and Retry saves it (GIT-27, KB-100).

DF-325, DF-326, DF-327, DF-328, SM-187; TC-CHT-60…TC-CHT-72, TC-GIT-21, TC-GIT-22.
