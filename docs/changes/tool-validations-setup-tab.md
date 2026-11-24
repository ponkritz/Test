---
bump: patch
---
**Changed**
- **Tool Validations: Setup tab** — the Master list tab keeps the expiry tiles, the window "Expiring in the next N days", the Validation expiry table and the master list (＋ Add tool…); **Sources** (＋ Add source…, Edit mapping…, Merge into master list…, Remove) and **Team settings** (Edit…) move to a new **Setup** tab, the last one, after Azure and the source tabs. Everyone sees Setup; those who may not change it see the buttons disabled with the reason, as before. A source added there gets its tab at once; texts now point to Setup → Sources. Remembered tabs open as before (TVL-14, TVL-01, TVL-09, TVL-11).

**Fixed**
- **Table panels: controls lined up with the title** — the window of days, the filter rows, the Columns / Wrap text / density / Export row and the table's first column started at the panel's left border; inside every table panel they now line up with the panel's title, 32 px inside the panel (24 px on a phone), with more room between the rows of controls, above the table, and between the panels and the tiles above them (KB-93; UI-07).

DF-275; TC-TVL-09, TC-TVL-07, TC-TVL-06, TC-TVL-05, TC-QV-43.
