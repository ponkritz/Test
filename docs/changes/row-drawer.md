---
bump: minor
---
**Changed — how you work on the On-Demand pages: every save now goes straight to Git**
- **A row opens in a drawer** — on CoNQ and every Table / Table + Insights page, a click on a row (or Enter / Space on it) opens the row on the right: its ID, key, who added it and when, every value with its column's description, and its History; ‹ › move to the previous / next row in the table's order; Escape, × or a click beside it close it and the focus goes back to the row. On a phone it takes the full width (OND-27).
- **Edit in the drawer, Save to Git at once** — Edit turns the values into fields in place (the same fields and checks as before); **Save to Git** writes the row to Git at once as its own commit ("CoNQ: update row CONQ-0012", "CoNQ: add row CONQ-0013 (…)"), merged with what others saved meanwhile; a new row gets its ID in that save. ＋ Add row opens the drawer empty; leaving with unsaved edits asks first; a failed save keeps the edit with the reason and Retry. Without the right, Edit and Remove row are disabled with the reason (OND-28, OND-29; OND-04 retired).
- **No more unsaved-changes bar** — Set up columns…, Rename page… and every chart change on the Insights tab are saved to Git when you save them; Remove row asks first and removes the row from Git at once. The page shows waiting and failed saves with Retry; a chart change that could not be saved is kept with Retry and Discard (OND-30; OND-09 retired).

**Fixed**
- A queued, merged save waiting behind another save of the same browser, or retried later, could be written over that save instead of being merged; it is now merged from the version it was made from (KB-80, GIT-17).

DF-166, DF-167, DF-168; KB-80, KB-81, LIM-24; TC-OND-21…25. UI-STANDARDS: the Drawer is a new component type (deliberate exception, to be added to the standard).
