---
bump: minor
---
**Added**
- **Save view for everyone** — the Tool Owner (the right "Table, chart and page defaults") saves a table's column order, shown and hidden columns, widths, Wrap text, density and sort in its **Columns** panel as the view everyone starts with, kept once per table in the shared views defaults in Git with who saved it and when, queued and listed under Background jobs; **Clear the view for everyone** removes it (UI-20). A viewer's own changes win, then the view for everyone, then the table's built-in view; the Columns panel says which view is shown and offers **Use the view for everyone** (UI-21). Columns that no longer exist are ignored and new ones come at the end, shown (UI-22).
- **Page filters for everyone** — the Team overview, On-Demand Dashboard pages, an Insights page's filter row and the People filters offer the same Save / Clear beside the filters, with the same order (UI-23); the People filters are now remembered per person (MYD-08).

**Changed**
- A table's sort is remembered per table like its widths and order; Reset layout goes back to the view for everyone when one is saved (UI-08).
- QMS-0025 **Column Options**: "Save for everyone" now reads **Save view for everyone**, with **Clear the view for everyone** and who / when kept beside the order (BKL-47).

DF-255, DF-256, SM-143, LIM-62; TC-UI-13…TC-UI-17, TC-BKL-36.
