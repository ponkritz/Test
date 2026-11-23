---
bump: minor
---
**Added**
- **Insights on the On-Demand pages** — every On-Demand page (CoNQ first) has two tabs, **Data** and **Insights**; the Insights tab holds charts and summary tables of the page's rows that the team defines itself and everyone sees (OND-11).
- **Your own charts and tables** — **＋ Add chart / table** opens a pop-up with a live preview: **Bar / column** (optionally stacked), **Line over time** (by month of a Date column), **Pie / donut** (at most 6 slices, the rest as "Other") or **Summary table** (a pivot with totals); **Count of rows**, **Sum** or **Average** of a Number column; filters on Dropdown / Multi-select values and a from / to month, stated under the title; legend, Data labels and Table view on every chart; **Edit**, **↑ ↓** and **Remove** (asks first) (OND-12…OND-15).
- **Clear counting rules** — a Multi-select row counts once in each of its values and once in every total; empty values and values "not in the list" go to "(none)"; rows without a number or date are left out and counted in the line under the title (OND-13).
- **Saved with the page** — the insights are an `insights` list in the page's own file `on-demand/<page>.json`, saved with Save to Git and merged by chart like rows and columns; validated when read; a chart whose column was removed or changed says so instead of failing (OND-16, OND-17). Only people with *Set up On-Demand pages* change them (CON-103).

DF-148, DF-149, DF-150; LIM-18; TC-OND-09…14.
