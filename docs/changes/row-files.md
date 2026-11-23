---
bump: major
---
**What to do:** update the app on every computer (web and desktop) first; then a Tool Owner converts each table page that several people fill at the same time with **Convert to row files…** (on the page, or **Convert…** in Admin → Pages & menu). App versions before this one cannot open a converted page.

**Added**
- **Row files** — a Tool Owner converts a table page from its single file to one file per row (`on-demand/<page>/page.json`, `rows/<key>.json`, `counter.json`) in one commit; keys, IDs, values, History, columns and charts stay as they are. Two people can then add rows at the same time (each gets its own ID from a version-checked counter) and edit different rows without merging the whole page; a page opens by reading only the rows that changed, in batches (OND-31…OND-34).
- **Row locks** — on a converted page Edit takes the row's lock: others see ✎ and who is editing in the table and "Being edited by … since …" in the drawer, with Edit disabled and the reason; adding rows, viewing, charts and dashboards never wait. A Tool Owner or the page's co-owners release a stuck lock. Locks are kept on a branch `locks` of the data repository (or its folder `locks/` where the branch is refused) and never raise "Newer data in Git" (OND-35, OND-38).
- **Inactivity timeout and drafts** — an edit holding a lock closes after 15 minutes without activity (Admin → Pages & menu → Row locks, set by an Admin or the Tool Owner), with a warning and **Keep editing** 2 minutes before; the unsaved values are kept as a draft in that browser for one day and offered on the next Edit of the row, naming what changed meanwhile (OND-36, OND-37).
- **New pages appear on their own** — when someone else adds or deletes a page, it appears in (or leaves) the menu and Home at the next check, without ↻ Reload from Git (GIT-21).

**Changed**
- **Hide instead of remove** — rows are hidden (**Hide row** / **Show row**, logged in their History; left out of the table, charts, exports and dashboards; **Show hidden rows (n)** lists them) and pages are hidden (**Hide page** / **Show page**, shared for everyone, their data kept). Only the Tool Owner deletes a hidden row (its ID is never given again) or a page (OND-39, OND-40, PGB-19, PGB-20; OND-03, OND-07, OND-10, OND-27, OND-28, PGB-07, PGB-09, PGB-10, PGB-12 changed).
- Two edits of the same row on a converted page are merged field by field; the later save wins only for the same field when a lock expired (LIM-24 narrowed; GIT-17).

DF-178…DF-183, SM-106…SM-109, LIM-24, LIM-25, LIM-27, LIM-28, LIM-29; TC-OND-26…TC-OND-34, TC-PGB-15, TC-GIT-13.
