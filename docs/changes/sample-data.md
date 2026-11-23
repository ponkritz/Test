---
bump: minor
---
**Added**
- **Live | Sample on table pages** — every table page (Table and Table + Insights, CoNQ included) has **Data: Live | Sample** first in its page actions, per person and remembered (personal views, else this browser), Live by default. **Sample** shows 50 made-up rows generated from the page's own columns (Dropdown / Multi-select options, realistic numbers, amounts in the column's currency, dates of the last 12 months, short phrases; IDs SAMPLE-0001…), the same for the same column setup and new when a column or its options change (OND-63, OND-64).
- In Sample the Data tab, the Insights (filter row, drill-down) and every On-Demand Dashboard reading the page show the sample rows — for that viewer only — under the banner **"Sample data — nothing is saved."** (OND-65). Nothing is written to Git: every change of the page is disabled with the reason, and the save path and the file writer both refuse a sample page (OND-66). Excel / CSV exports of sample rows are named "Sample-…" and start with a "Sample data" line (OND-67).

DF-216, DF-217, SM-118, LIM-42; TC-OND-51…TC-OND-54.
