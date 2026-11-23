---
bump: minor
---
**Added**
- **On-Demand pages** — a new menu group **On-Demand** of blank pages the team sets up itself; **CoNQ** (*Cost of Non-Quality*) is there from the start, and people allowed to set up the pages add, rename and remove more (OND-01, OND-02, OND-10).
- **Columns of your own** — **Set up columns…** adds, renames, reorders and removes columns, each of type Text, Number, Date, Dropdown (one value) or Multi-select with an option list you define; a change that touches values already in the rows says what happens and asks first: values are kept and marked "not in the list" / "not a number" / "not a date" until changed, a renamed option follows in every row (OND-05, OND-06).
- **Rows in a pop-up** — the page is one shared table (search, sort, row count, Export); ＋ Add row and Edit open the row with a field per column (OND-03, OND-04).
- **Saved to Git** — each page is `on-demand/<page>.json` in the Git data repository, saved with **Save to Git** from the unsaved-changes bar; two saves at the same time are merged by row and column, the later one winning where both changed the same; everything read back is validated (OND-07…OND-09, GIT-17).
- **Two new rights** in Role rights, group *On-Demand*: *Set up On-Demand pages (pages, columns, options)* and *Edit On-Demand data (rows)* — by default every role sees the pages and Tool Owner and Admin may change them, also for an `access.json` saved before (CON-103).

DF-145, DF-146, DF-147, SM-96, SM-97; TC-OND-01…08.
