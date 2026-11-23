# Release notes

Version history of the I&D Quality Demand Planning app, newest first. Every merged change gets a version and its entry here (CI-09; [CONFIGURATION-MANAGEMENT.md](CONFIGURATION-MANAGEMENT.md) §4). Since v7.43.0 the pull request adds a change note in [`docs/changes/`](changes/README.md) instead, and after the merge CI writes the version into `package.json` and the entry (with the PR number) at the top of this file in a release commit (CI-11): **major** for a change that breaks existing data, shared setup files or the way users work; **minor** for a new or changed feature; **patch** for a fix, a dependency update or documentation only. `pnpm test` fails when the newest version here is not the version in `package.json`. CI tags each version `vX.Y.Z` on its merge commit and publishes its GitHub release with the installers and this entry (CI-10); the build number of a version is the CI build of that merge (shown in the app under Force Update, and in `latest.json`). Open bugs and accepted limitations of every version are in [KNOWN-ISSUES.md](KNOWN-ISSUES.md); the third-party components of every version are in [SWBOM.md](SWBOM.md).

## v10.3.0 — 2026-11-23

**Added**
- **Grouped bars** — a bar chart (horizontal bars or vertical columns) with a second field can now show its series **grouped side by side** (Excel's clustered bars) instead of stacked: Display → Series "Grouped (side by side)". Grouped bars take every measure, also Average, Minimum, Maximum and Distinct count; their data labels sit at Center, Inside End, Inside Base or Outside End of each bar, and the trendline is drawn per series. Stacked stays the default (CHT-40).
- **Any colour per value** — besides Colour 1…5, a value's colour can be an own colour, chosen with a colour picker or typed as #rrggbb, on the Insights tab and in the Dashboard block pop-up. Existing pins keep working and charts without pins look as before. A colour with low contrast against the chart background in the light or dark theme is kept with a warning, and data labels on it are drawn in dark text or white, whichever reads better (CHT-41, CHT-42).

DF-214, SM-116, LIM-40; TC-CHT-32, TC-CHT-33.

PR #379.

**Added**
- **Chart grid: resize and drag to move** — charts on the Insights tab, On-Demand Dashboards and Team overview → Streams now sit on a 12-column grid with rows of about 40 px instead of the ⅓ / ½ / ⅔ / Full snapping: a chart is 2…12 columns wide and any number of rows high (at least 3 × 5; a summary table 4 × 4), its size shown as "8 × 6"; the others move out of the way and gaps close upward. The page's owners (a dashboard's builders) click **Arrange charts** (Dashboard: ⋯ → **Arrange on the page**): the grid's lines show and they drag a chart by ⠿ to another place or by its corner to another size — or use the keyboard (arrows on ⠿ move, arrows on the corner resize, Shift + arrows on the corner move) — and the layout is saved to Git for everyone. Everyone can still resize a chart for themselves (now by columns and rows) but not move it; on a phone every chart is full width. The sizes of before map exactly onto the grid, so nothing changes until someone arranges (CHT-43…CHT-50).

**Changed**
- The resize handle snaps to columns and rows instead of the four widths and three heights; "Arrange sizes" is now "Arrange charts" (Dashboard: "Arrange on the page") (CHT-49, CHT-47). Older app versions show the nearest size and ignore the places (LIM-41).

DF-215, SM-117, LIM-41; TC-CHT-34…TC-CHT-37.

PR #379.

**Added**
- **Export PDF… of the Insights and of On-Demand Dashboards** — in the ⋯ of the Insights heading and in a dashboard's page ⋯ (OND-68). The pop-up picks the charts (all, or a selection, KPI cards included), whether the active filters apply (stated under the title), A4 or Letter, portrait or landscape, and the footer's date and / or time of the export; the footer always shows the page name and "Page n of m" (OND-69, OND-71). The charts are the ones on screen, as vector graphics at their size, on white paper and never split over two pages; the date and time are in your own time zone, e.g. "24 Nov 2026, 14:32 CET"; "Sample data" in Sample (OND-70, OND-71, OND-67).
- The **desktop app** saves the PDF where you choose (Chromium's printToPDF and a save dialog); a **browser** opens a print view and its print dialog — choose "Save as PDF" (page numbers in Chrome and Edge; Firefox and Safari print the footer without them) (OND-72).

DF-218, DF-219, SM-119, LIM-43; TC-OND-55…TC-OND-59.

PR #379.

**Added**
- **Live | Sample on table pages** — every table page (Table and Table + Insights, CoNQ included) has **Data: Live | Sample** first in its page actions, per person and remembered (personal views, else this browser), Live by default. **Sample** shows 50 made-up rows generated from the page's own columns (Dropdown / Multi-select options, realistic numbers, amounts in the column's currency, dates of the last 12 months, short phrases; IDs SAMPLE-0001…), the same for the same column setup and new when a column or its options change (OND-63, OND-64).
- In Sample the Data tab, the Insights (filter row, drill-down) and every On-Demand Dashboard reading the page show the sample rows — for that viewer only — under the banner **"Sample data — nothing is saved."** (OND-65). Nothing is written to Git: every change of the page is disabled with the reason, and the save path and the file writer both refuse a sample page (OND-66). Excel / CSV exports of sample rows are named "Sample-…" and start with a "Sample data" line (OND-67).

DF-216, DF-217, SM-118, LIM-42; TC-OND-51…TC-OND-54.

PR #379.

**Added**
- **Publish standalone HTML…** — the Tool Owner and a page's co-owners can publish any table page (CoNQ included) as one self-contained, offline `.html` file: "Published by {name} on {date, time, zone}", the filters of the charts, the Insights charts and KPI cards, and every row that is not hidden with sort and search (OND-73, OND-74, OND-80). A pop-up first warns that the file contains every row of the page. Never from Sample (OND-75).
- The file goes **where you choose** (default "{page}.html") and each publish overwrites it: the desktop app asks once with its save dialog and remembers the file per page on that computer; Chrome and Edge remember it in the browser (File System Access, the permission asked again at most once per session); Firefox and Safari download it instead (OND-76). Every value is escaped and a Content-Security-Policy in the file blocks every request; it holds no token (OND-77).
- **Scheduled publish** — Off / Daily / Weekly at a time, per page, saved on your computer only (never in Git); it runs while the app is open, a missed run runs at the next start, results go to Background jobs and a failure (permission lost, folder missing) also shows on the page (OND-78, OND-79).

DF-220…DF-223, SM-120…SM-123, LIM-44; TC-OND-60…TC-OND-65.

PR #379.

## v10.2.0 — 2026-11-23

**Added**
- **Chart elements** — like Excel's Chart Elements, the owners of an Insights tab (and a dashboard's builders) can set for everyone, in the chart's Display options: chart heading, axes and axis names on or off; data labels on or off for everyone, their position (bars: Center, Inside End, Inside Base, Outside End; lines: Center, Left, Right, Above, Below; pies: Center, Inside End, Outside End, Best Fit with leader lines), their contents (series name, category name, value, percentage) and number format (0–2 decimals, currency code); a data table under the chart; major and minor gridlines; the legend at the top, bottom, left, right or none; a linear trendline per series. Each viewer can still switch data labels on or off for themselves. Labels never overlap or leave the chart. Charts nobody changed look exactly as before (CHT-26…CHT-35).
- **KPI cards** — KPI (one number) charts on an Insights tab are now shown together as a row of compact cards above the other charts, like the Dashboard's KPI tiles, with ⓘ, "Filtered" and the owners' ⋯ menu. Existing KPI charts (added since v9.14) become cards; Show as: Panel keeps the old panel (CHT-36, CHT-37).

**Changed**
- Chart and table headers on the Insights tab and On-Demand Dashboards no longer show the chart type above the title; the type is the first line of ⓘ (CHT-39). UI-STANDARDS records the approved v10.1 chart wording (size, resize handle, chart header, ⋯ menus).

**Fixed**
- The KPI preview in the chart pop-up was about 90 px wide and cut the number; KPI cards are now at least 180 px and never cut the number (KB-84, CHT-37).
- The chart pop-up's preview overlapped the Display fieldset and clipped the field labels; the form and the preview now sit side by side or one under the other (KB-85, CHT-38).
- The preview repeated the measure, filters and rows counted under its title; it now shows the chart's own header (KB-86, CHT-38).

DF-207…DF-210, SM-114, LIM-38, KB-84…KB-86; TC-CHT-22…TC-CHT-31.

PR #378.

**Added**
- **Build On-Demand Dashboards** — a permission of its own in Role rights (On-Demand group; Allow, Deny or Not set; Tool Owner by default) that builds every On-Demand Dashboard: blocks, tabs and filters. "Set up On-Demand pages" no longer builds dashboards (it keeps the table pages); the page's and its group's co-owners still build theirs. The roles file is now permissions 6: an older file gives the new right to a listed Tool Owner only (CON-107, DSH-09).
- **Copy to…** in a dashboard block's ⋯ menu and in Arrange blocks…: duplicate a block here or copy it to another dashboard you may build — a new block with the same settings and data source, on the tab of the same name or else the first tab (Background jobs says so), saved to that dashboard's file at once (DSH-15, DSH-13).
- **Time Writing hours as a data source** of the On-Demand Dashboard blocks: planned and booked hours exactly as Team overview counts them, by team member, region, role, stream, Feature and month — Sum or Average, the period by month; "Not available for your role." for anyone who may not see Team overview. Team overview is unchanged (DSH-16, DSH-03, DSH-04).

**Changed**
- **A summary table's Export** (Excel and CSV) on an On-Demand Dashboard now ends with its **Total** row (DSH-14, DSH-06).

DF-211, DF-212, DF-213, SM-115, LIM-39; TC-DSH-13, TC-DSH-14, TC-DSH-15, TC-DSH-16.

PR #378.

**Changed**
- **Co-owners from the Azure DevOps team** — the page and group co-owner lists also offer the members of the Time Writing team, read once when the app starts (after the start fetch) and kept for the session, so a colleague without fetched work can be picked without opening People & roles first; a refused read offers the others silently (PGB-21, PGB-18, CAP-30).
- **"Newer data in Git" names the colleague** — every commit the app writes ends with `[by {name} <{work email}>]` (after the `[saved …]` stamp; never a token), and the notice names that person instead of the GitHub account; a change made outside the app still shows its GitHub author (GIT-22, GIT-18, GIT-17).
- **Access roles load quietly** — a newer access.json is loaded on every page without a notice and the rights change in place; when your own rights changed, a short line on the page says who changed what ("Your access was changed by …: you can now edit On-Demand data (rows)."). Only Admin → People & roles shows the notice (GIT-23, CON-101).
- **Convert suggestion for large pages** — a Tool Owner sees a line on a table page still in one file with more than 500 rows (or over 600 KB) suggesting **Convert to row files…**, dismissible per page; new pages stay one file (OND-62, OND-32).

DF-203…DF-206, SM-113, LIM-37; TC-GIT-14, TC-GIT-15, TC-PGB-16, TC-OND-50.

PR #378.

## v10.1.0 — 2026-11-23

**Added**
- **Chart sizes** — every chart of the Insights tab, of On-Demand Dashboard pages and of Team overview → Streams takes a width of ⅓, ½, ⅔ or Full of a 6-column grid and a height of Small, Medium or Large. The owners set the size for everyone (the chart's Edit… or Size…, Arrange sizes; on a Dashboard also Arrange blocks…; on Team overview a Tool Owner's Save size for everyone); anyone resizes a chart for themselves with the handle on its bottom-right corner — dragging snaps to the sizes with an outline, or the arrow keys — remembered for them with Reset to default. Charts nobody resized look as before; on a phone every chart is full width (CHT-15…CHT-22).
- **Axis names** — the owners can name a chart's X and Y axes in its pop-up; empty keeps the automatic name (CHT-24).
- **Compact pages** — the page actions are one main action and a ⋯ menu; the Insights heading, filter row and chart headers take one line each; what a chart measures, its filters and the rows counted moved into its ⓘ, with a "Filtered" tag when it is narrowed; each chart's Move, Edit…, Size… and Remove… are in its ⋯ menu for the people who may set charts up (CHT-25, OND-61, DSH-13).

**Fixed**
- Long chart labels no longer run out of the chart: they wrap onto two lines and end in "…" with the full text as tooltip; long axis names likewise (CHT-23, KB-83).

DF-196…DF-202, SM-112, LIM-36, KB-83; TC-CHT-13…TC-CHT-21, TC-OND-49, TC-DSH-12.

PR #377.

## v10.0.0 — 2026-11-23

**Added**
- **Currency filters in the Insights filter row** — the owners of a Table + Insights page can now add a Currency column to the Insights filter row with Filters…. Each viewer chooses **one currency** (those found in the column's rows, the one of most rows first; Any currency when there are several) and an amount from / to in it: only the rows in that currency within the range are counted — amounts are never converted, added or compared across currencies — and the line under the row names it ("Cost: EUR 100–500"). From above To is shown as an error and not applied. The charts summing, averaging or taking the minimum / maximum of that column show the chosen currency to match (another can still be chosen above a chart). Remembered per viewer like the other filters (OND-57…OND-60; LIM-35 narrowed).

DF-193, DF-194, DF-195, SM-111, LIM-35; TC-OND-46…48.

PR #376.

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

PR #376.

## v9.16.0 — 2026-11-23

**Added**
- **Insights filter row** — the owners of a Table + Insights page (CoNQ included) can give its Insights tab a filter row with **Filters…**, next to ＋ Add chart / table: a period on one Date column (Year → Quarter → Month as on the On-Demand Dashboard, the current year to start with) and up to 6 filters (Dropdown / Multi-select values, a Date's from / to month, a Text's "contains", a Number's from / to), saved to Git at once in the page's file as the optional field `insightFilters` (validated when read; a removed column left out with a note; merged as one entry). Each viewer narrows every chart and table of the tab with it — the Table views and the rows behind a bar too — on top of each chart's own filters, with a line naming the choice and "n of m rows counted" and **Reset filters**; the choice is remembered per viewer and page (personal views). Without the right Filters… is disabled with the reason. Pages without a filter row and the On-Demand Dashboard pages are unchanged (OND-50…OND-56).

DF-190, DF-191, DF-192, SM-110, LIM-35, OI-18; TC-OND-40…45.

PR #375.

## v9.15.0 — 2026-11-23

**Changed**
- **Newer data in Git is shown per page** — when someone else saves a shared file while the app is open, a warning appears only on the page in use whose data changed (e.g. a new CoNQ row on CoNQ, a dashboard charting CoNQ and Admin → Pages & menu — not on Home), naming what changed, who saved it and when; **Load the newer data** reads only that page's data again without reloading the app, and asks first when it would drop a row being edited, a pop-up, a draft or unsaved planning changes. Changes to other pages wait until they are opened; the menu layout and the views are refreshed quietly; the notice is never a Background jobs entry (GIT-18, GIT-20, KPT-05; GIT-15 retired).
- **Unique page names** — a page name cannot be one another page in the menu already has (any group, a built-in or Admin page, a release stream), ignoring case, spaces and full-width forms; Add page, Edit and Rename page show the clash at the name field with Save disabled. Pages that got the same name at the same moment are kept, shown with their group in the menu and listed on Pages & menu (PGB-15, PGB-16, PGB-17).
- **Co-owners from a list** — page and group co-owners are picked from a searchable list of the people the app knows instead of typing emails; co-owners not in the list stay, marked "not in Azure DevOps"; the Add page pop-up points to custom streams for a Release page (PGB-18).
- **UI standards §4a Drawers** approved by the product owner; LIM-24 accepted.

**Fixed**
- **"Newer data in Git" for your own saves** — the banner no longer appears after your own saves (a read or listing that still had the version before your save, or a check during the save, counted it as someone else's), and a save in another window of your browser says so (GIT-19, KB-82).

DF-173…DF-177, SM-105, LIM-25, LIM-26; TC-GIT-11, TC-GIT-12, TC-PGB-12, TC-PGB-13, TC-PGB-14.

PR #374.

## v9.14.0 — 2026-11-23

**Added**
- **Chart options** — for the Insights tab of table pages and for On-Demand Dashboard blocks alike, under **Display** in the chart pop-up: vertical columns as well as horizontal bars (stacked by the second field), dates grouped by day, ISO week, month, quarter or year, **Top 5 / 10 / 15 / 20 + Other**, **running total**, **percent of total**, a **target line**, colours pinned per value, half or full width (CHT-01, CHT-03…CHT-06, CHT-08, CHT-09, CHT-11, CHT-14).
- **Pareto** chart (columns largest first, cumulative share on a 0–100% axis, 80% line) and a **KPI (one number)** on the Insights tab; measures **Minimum**, **Maximum** and **Distinct count** (CHT-02, CHT-07, CHT-12).
- **Rows behind a chart** — click a bar, stack, slice or point (or Enter on the highlighted one) to list the rows counted there, read only, with Export (CHT-10).
- Charts saved before look and count exactly as before; the new fields are optional and validated when read (CHT-13).

DF-163, DF-164, DF-165, SM-102, LIM-23; TC-CHT-01…12.

PR #373.

**Changed — how you work on the On-Demand pages: every save now goes straight to Git**
- **A row opens in a drawer** — on CoNQ and every Table / Table + Insights page, a click on a row (or Enter / Space on it) opens the row on the right: its ID, key, who added it and when, every value with its column's description, and its History; ‹ › move to the previous / next row in the table's order; Escape, × or a click beside it close it and the focus goes back to the row. On a phone it takes the full width (OND-27).
- **Edit in the drawer, Save to Git at once** — Edit turns the values into fields in place (the same fields and checks as before); **Save to Git** writes the row to Git at once as its own commit ("CoNQ: update row CONQ-0012", "CoNQ: add row CONQ-0013 (…)"), merged with what others saved meanwhile; a new row gets its ID in that save. ＋ Add row opens the drawer empty; leaving with unsaved edits asks first; a failed save keeps the edit with the reason and Retry. Without the right, Edit and Remove row are disabled with the reason (OND-28, OND-29; OND-04 retired).
- **No more unsaved-changes bar** — Set up columns…, Rename page… and every chart change on the Insights tab are saved to Git when you save them; Remove row asks first and removes the row from Git at once. The page shows waiting and failed saves with Retry; a chart change that could not be saved is kept with Retry and Discard (OND-30; OND-09 retired).

**Fixed**
- A queued, merged save waiting behind another save of the same browser, or retried later, could be written over that save instead of being merged; it is now merged from the version it was made from (KB-80, GIT-17).

DF-166, DF-167, DF-168; KB-80, KB-81, LIM-24; TC-OND-21…25. UI-STANDARDS: the Drawer is a new component type (deliberate exception, to be added to the standard).

PR #373.

## v9.13.0 — 2026-11-23

**Added**
- **On-Demand Dashboard pages** — a third page type of the page builder: ＋ Add page… → **On-Demand Dashboard** in any group that accepts added pages. A read-only page of **KPI tiles**, **bar, line and pie charts** and **summary tables** over the rows of any table page (On-Demand, Table, Table + Insights, as saved in Git), with Count, Sum or Average (one currency at a time) (DSH-01…DSH-05).
- **Filter row** — Year / Quarter / Month as on Team overview (the current year when nothing is ticked), filters the owners add and Reset filters; tiles open their tab; charts with data labels and Table view, summary tables largest first with the first 10 rows, Show all and Export; "No data for this selection." when empty. Your tab, period and filters are remembered for you (DSH-06, DSH-07, DSH-10, DSH-11).
- **Building an On-Demand Dashboard** — whoever may set the page up (Tool Owner, page and group co-owners, “Set up On-Demand pages”) adds, edits, reorders and removes blocks, tabs and filters, each saved to Git at once as `dashboards/<page>.json`, merged block by block with a change saved at the same time, the result in Background jobs; for everyone else the buttons are disabled with the reason (DSH-08, DSH-09, DSH-12).

DF-160, DF-161, DF-162, SM-101, LIM-22; TC-DSH-01…11.

**Backlog**
- Six follow-ups for custom streams are recorded as OI-17 (parked by the product owner).

PR #372.

**Changed**
- **Space between charts** — the charts and tables on an On-Demand page's Insights tab, and the blocks of an On-Demand Dashboard, now have the same 18 px gap above and below as beside each other, instead of touching (OND-11).

PR #372.

## v9.12.0 — 2026-11-23

**Added**
- **Page builder: Pages & menu** — a Tool Owner adds pages of their own without a release of the app: **＋ Add page** (from Admin → Pages & menu, ⋯ on a menu group or a page) asks for the page type (**Table** or **Table + Insights**), name, description, icon and menu group — any group that accepts added pages, or a **new group** — and creates the page in Git at once. Pages are edited (name, type, icon, group, co-owners), reordered and removed (asking first); groups of your own are added, renamed, reordered and removed when empty; built-in groups are configured (accepts added pages, co-owners). The menu, Home and the top bar follow the layout, saved in Git as `menu-layout.json` with queued, merged saves; Customize menu pins and hides added pages (PGB-01…PGB-07, PGB-12, PGB-14).
- **Co-owners of groups and pages** — a group co-owner runs the pages of their group (add, rename, reorder, remove, name page co-owners, set up, edit rows) but not the group; a page co-owner sets up the page and edits its rows. Everything else is disabled with the reason (PGB-08…PGB-11).
- **Permission "Manage pages and menu groups (Tool Owner)"** (permissions 5): Tool Owner only by default and for an access.json saved before (CON-106).

**Changed**
- CoNQ and the On-Demand pages from before are **Table + Insights** pages in On-Demand, unchanged in Git (PGB-13); ＋ Add page… on a page opens the new Add page pop-up (OND-10).

DF-158, DF-159, SM-100, LIM-21; TC-PGB-01…11.

PR #371.

## v9.11.0 — 2026-11-23

**Added**
- **Custom streams** — the Tool Owner adds a Release page for a new stream without a new version of the app: Admin → Streams → Stream mapping → Custom streams → **＋ Add stream…** with a name, a source (Azure DevOps query connection or Windchill export) and one of the app's release rules by plain name with an example (Like DP, Like IOCC, Like Content, Like Tool Validations, Like S&S IT, Like ECP), fuzzy Feature matching, earlier names and the Epics to match Features in. Saved at once to the shared setup in Git (`custom-streams.json`); Edit renames (the old name kept as an earlier name), Remove asks first and keeps the connection and its data (STR-01, STR-03, STR-04, STR-06).
- Every list of streams follows the built-in and custom streams: the Stream mapping rows, the Release Details menu and Home tile, the stream's Release page with the UI-STANDARDS §10 parts (source bar, counts, Releases | Source data, Time Writing Feature, Planned / Booked hours, Create Feature and bulk create where the rule has it), Pulse Check, the Dashboard delivery counts, the Monthly pack setup, My dashboard and Release naming patterns; a connection belongs to the stream with the longest matching name (STR-02).
- The file read from Git is validated: an unknown rule, CP's tree rule or a built-in stream's name is refused with a clear message, the other streams are used; without “Change the stream mapping” Add stream, Edit and Remove are disabled with the reason (STR-05, STR-07).

DF-155, DF-156, DF-157, SM-99, LIM-20; TC-STR-01…07.

PR #370.

## v9.10.1 — 2026-11-23

**Changed**
- **Hours and moving greyed out inside the forms** — in the Edit form the Task hours need "Enter planned and actual hours" and moving a Feature's open User Stories needs "Move to another Sprint or PI"; in ＋ Time Writing Task the hours fields need "Enter planned and actual hours" (the Tasks can still be created, without hours). Without the right they are disabled with the reason, instead of being refused only when saving (CON-105).

TC-CON-66.

PR #369.

## v9.10.0 — 2026-11-23

**Added**
- **On-Demand row IDs** — every row gets a readable ID such as `CONQ-0001` when it is first saved to Git: the next free number, never changed, unique also when several people save at the same time (OND-19).
- **Who added a row and when, and its History** — each row records the work email of the person who added it and the time (Added by / Added on); every saved change is logged automatically with who, when and what changed (old → new), shown as History in the row pop-up; Last updated by / on can be added as columns; two saves of the same row keep both log entries (OND-20, OND-21).
- **Long text and Currency columns** — a paragraph of up to 10,000 characters; an amount with its currency (a default per column, another per row), shown as "1,200.00 EUR". Insights add up a Currency column one currency at a time, never converting (OND-22, OND-23, OND-24).
- **Column descriptions** — how or what to fill, shown under the field in the row pop-up and behind ⓘ on the column heading (OND-25).

**Changed**
- The page file keeps schema 1 with optional new fields; an older app version saving a page drops them (LIM-19). Changing the columns now keeps each row's key, ID and History (OND-26).

DF-152, DF-153, DF-154, SM-98, LIM-19; TC-OND-16…20.

PR #368.

## v9.9.0 — 2026-11-23

**Changed**
- **Several roles per person** — in People & roles → People, **App access roles** is now a multi-select: a person can hold several roles, and their rights are the union of them. Before, choosing a role there replaced all of the person's roles (KB-77) (CON-104).

TC-CON-65.

PR #367.

## v9.8.0 — 2026-11-23

**Added**
- **Row keys on On-Demand pages** — every row gets a key the moment it is added, e.g. `CONQ-261123-K7Q2` (the page's key prefix, the date, 4 random characters). It is unique even when several people add rows at the same time and save on their own, and it never changes. The key is the first column, searchable and exported; the prefix is set per page in Set up columns… and fixed once rows have keys; existing rows get keys on the next Save to Git (OND-18).

DF-151; TC-OND-15.

PR #366.

## v9.7.0 — 2026-11-23

**Added**
- **Insights on the On-Demand pages** — every On-Demand page (CoNQ first) has two tabs, **Data** and **Insights**; the Insights tab holds charts and summary tables of the page's rows that the team defines itself and everyone sees (OND-11).
- **Your own charts and tables** — **＋ Add chart / table** opens a pop-up with a live preview: **Bar / column** (optionally stacked), **Line over time** (by month of a Date column), **Pie / donut** (at most 6 slices, the rest as "Other") or **Summary table** (a pivot with totals); **Count of rows**, **Sum** or **Average** of a Number column; filters on Dropdown / Multi-select values and a from / to month, stated under the title; legend, Data labels and Table view on every chart; **Edit**, **↑ ↓** and **Remove** (asks first) (OND-12…OND-15).
- **Clear counting rules** — a Multi-select row counts once in each of its values and once in every total; empty values and values "not in the list" go to "(none)"; rows without a number or date are left out and counted in the line under the title (OND-13).
- **Saved with the page** — the insights are an `insights` list in the page's own file `on-demand/<page>.json`, saved with Save to Git and merged by chart like rows and columns; validated when read; a chart whose column was removed or changed says so instead of failing (OND-16, OND-17). Only people with *Set up On-Demand pages* change them (CON-103).

DF-148, DF-149, DF-150; LIM-18; TC-OND-09…14.

PR #365.

## v9.6.0 — 2026-11-23

**Added**
- **On-Demand pages** — a new menu group **On-Demand** of blank pages the team sets up itself; **CoNQ** (*Cost of Non-Quality*) is there from the start, and people allowed to set up the pages add, rename and remove more (OND-01, OND-02, OND-10).
- **Columns of your own** — **Set up columns…** adds, renames, reorders and removes columns, each of type Text, Number, Date, Dropdown (one value) or Multi-select with an option list you define; a change that touches values already in the rows says what happens and asks first: values are kept and marked "not in the list" / "not a number" / "not a date" until changed, a renamed option follows in every row (OND-05, OND-06).
- **Rows in a pop-up** — the page is one shared table (search, sort, row count, Export); ＋ Add row and Edit open the row with a field per column (OND-03, OND-04).
- **Saved to Git** — each page is `on-demand/<page>.json` in the Git data repository, saved with **Save to Git** from the unsaved-changes bar; two saves at the same time are merged by row and column, the later one winning where both changed the same; everything read back is validated (OND-07…OND-09, GIT-17).
- **Two new rights** in Role rights, group *On-Demand*: *Set up On-Demand pages (pages, columns, options)* and *Edit On-Demand data (rows)* — by default every role sees the pages and Tool Owner and Admin may change them, also for an `access.json` saved before (CON-103).

DF-145, DF-146, DF-147, SM-96, SM-97; TC-OND-01…08.

PR #364.

## v9.5.0 — 2026-11-23

**Added**
- **Counts on every Release page** — Content shows Releases in {Month}; Tool Validations, S&S IT and ECP show Releases in {Month} and Supported (the same releases, as Pulse Check counts them). Completed is left out where the stream's data has no completion event (Content: Supported too); ⓘ What was counted says why (QV-64).
- **Time Writing Feature and hours on DP, CP, S&S IT and ECP** — the Feature of the release's QMS-0025 match with its match %, and the Planned (h) / Booked (h) of its Time Writing Tasks, as IOCC, Content and Tool Validations already show them (QV-65).

**Changed**
- **Release page results in Background jobs** — Refresh / Fetch, Load from Git, imports of Windchill exports and results, Fetch via Windchill tab, Save locations to Git and Load all exports from Git are listed in the top-bar Background jobs, named after the item ("Import Windchill export · S&S IT"), instead of notices on the page; the page keeps the warnings about its data, e.g. "Not refreshed: … The data shown is from …" (QV-63, NAV-36, CON-36).
- **Release pages tidied** (UI-STANDARDS §10) — KPI tile numbers 24px on every page with tiles; IOCC group rows indented by a CSS class; the Windchill Releases controls wrap at 390 px; CP Shared activity's Signed documents right-aligned, its evidence opening with ▸ (QV-62, QV-45). UI-STANDARDS §10 records the owner's accepted points: DP's counting rules behind ⓘ, the stream's own name for the date column, at most three tiles.

**Fixed**
- **Background jobs panel in dark mode** — it was white with almost unreadable text; it now uses the theme's colours (KB-76).

DF-142, DF-143, DF-144; TC-QV-43, TC-QV-44, TC-QV-45, TC-QV-46.

PR #363.

## v9.4.0 — 2026-11-23

**Fixed**
- **"Add Epics" drop-downs no longer overflow** — in the User Story template pop-up and the Monthly pack setup, a long Epic title no longer pushes the drop-down (and the table) past its box (KB-75, STT-03, PCK-02).

PR #362.

**Changed**
- **User Story templates as a list** — Admin → Epic & Feature setup → User Story templates shows the templates as a table (Title, Description, Epics, Release Classification, Linked in, Actions) instead of cards; **Edit** and **＋ New template** open a template in a pop-up (STT-03).

TC-STT-03.

PR #362.

## v9.3.0 — 2026-11-23

**Changed**
- **Every Release page looks the same** — DP, CP, IOCC, Content, Tool Validations, S&S IT and ECP follow UI-STANDARDS §10 (approved by the product owner on 2026-11-23): the source bar (name · source · when fetched, ⓘ, **Show: {month} / All months**, ↻, ⋯), the counts, the tabs **Releases | Source data (n)** and the Releases table with the common columns in one order (Select, Release name ▸, Release, approval or latest date, Documents, the stream's own columns, Time Writing Feature, Planned (h), Booked (h), QMS-0025 match). Nothing counted, matched, written or exported changes except column names and order (QV-62, QV-01, QV-16, QV-24, QV-26, QV-37, QV-45, QV-47, QV-48, QV-52, CON-73, CNB-01).
- **All pages:** the second tab is **Source data (n)** (was Query output / Raw data); the month filter is one **Show** select ({month} / All months) in the source bar (was an "All months" check box on Azure pages and a select inside the Windchill releases panel); the item count moved behind the source bar's ⓘ.
- **DP:** the counts moved above the tabs as three tiles — Releases in {Month}, Completed, Supported — with ⓘ What was counted; the separate "DP releases · {month}" panel is gone; the folded list is now "Supported releases counted"; the bulk toolbar sits in the table's toolbar.
- **CP:** the counts moved above the tabs (Releases in {Month}, Completed, Supported; the QA/QE-signed document count is in the table's count line); one **Releases** panel instead of two panels titled "CP releases · {month}"; the main tab is **Releases** (was CP report); columns Release name ▸, Release (was Version), Release Notes signed, Documents (was Signed documents), Container, Completed, QMS-0025 match; a name's warnings are shown as text instead of a ⓘ tooltip; no Show select.
- **IOCC:** the counts are tiles above the tabs (was a "IOCC releases · {month}" table panel); Type of Release moved after Documents; the name column is **Release name**.
- **Content:** the Title column is named **Release name**; "Select all" reads **Select all shown**.
- **Tool Validations:** the name column is **Release name**.
- **S&S IT / ECP:** the page has the standard page frame; Show moved to the source bar; **Release name ▸** opens the documents (was "▸ n documents" in the Documents column, now a right-aligned count); Latest {date} sits before Documents; Import newer export is **↻** (was ⤒); **ECP:** the main tab is **Releases** (was Projects) and its columns read **Release name / Release** (were Project Name / Project No; CON-86 retired).

TC-QV-43, TC-QV-10, TC-QV-11, TC-QV-25, TC-QV-27, TC-QV-28, TC-QV-33, TC-CNB-01; TC-CON-54 retired.

PR #361.

## v9.2.1 — 2026-11-23

**Fixed**
- **QMS-0025 board: no extra page scrolling on Windows** — the board table no longer stops at 240 px (now 120 px, about three rows), and any page overflow the measurement misses is taken off the table, so the page does not scroll by a few pixels (BKL-45, KB-74).

TC-BKL-34.

PR #360.

## v9.2.0 — 2026-11-23

**Changed**
- **Write buttons greyed out with the reason** — before the access roles are loaded (read-only, CON-101), or when your role lacks the action, every button that changes Azure DevOps is disabled instead of opening a form whose send is refused at the end: ＋ New Feature, ＋ Feature, ＋ User Story, ＋ Task, ＋ Time Writing Task, Complete children and Edit on the QMS-0025 board and My Tasks [Board]; Close and Set … to Active; Save, Close and ＋ Add a new activity on Time Writing; Move and the state buttons on Sprint check; Add comment in the Edit form; Create Feature and bulk Create Features on the release pages. A visible line next to the button (once above a table of row buttons) says why — "Read only: the access roles are not loaded yet …" or which permission the role lacks. Nothing changes for people who hold the action; the check before sending stays (CON-102).

DF-139, SM-93; TC-CON-64.

PR #359.

## v9.1.0 — 2026-11-23

**Changed**
- **Team overview: Year → Quarter → Month as one hierarchy** — quarters belong to their year and months to their quarter (with several years: "Q1 2026", "Jan 2026"); nothing ticked in Year now means the **current year** (it meant every year offered) (OV-16, OV-15).
- **UI standard §8** — the top-bar panel keeps its name **Background jobs**; warnings about the data shown stay on the page (owner decision).

TC-OV-15.

PR #358.

## v9.0.0 — 2026-11-23

**Changed**
- **Read-only until the access roles are loaded** — access now fails closed: until a roles file (`access.json` from Git storage, or the copy kept in this browser from an earlier read) is loaded, everyone is read-only: every page is in the menu, but nothing can be changed and changes to Azure DevOps are refused before they are sent. A notice at the top of every page says so and what to do (connect Git storage). Before, without `access.json` (or while it was loading, or when it could not be read) everyone could do everything. When Git storage is connected and has no `access.json` yet, the viewer may only set up the first roles file (Set up roles), keeping Manage access for themselves (CON-101, CON-43; design defaults review, decision 2).

**Fixed**
- Access no longer fails open on a new browser while `access.json` loads or when it cannot be read; the Azure DevOps write guard starts closed (KB-71).

DF-139, SM-93; TC-CON-63.

PR #357.

## v8.0.0 — 2026-11-23

**Added**
- **QMS-0025 Column Options: Save for everyone** — a Tool Owner (the right "Table, chart and page defaults") can save the column choice and order as everyone's default, in the shared views defaults in Git; a person's own Apply still wins, and **Reset to the team default** goes back to it (BKL-47).

TC-BKL-36.

PR #356.

**Changed**
- **Two people saving the same shared file both keep their change** — saves to the historical hours, the default views, the KPI tracker copy, the connection backups and the Monthly pack template are queued in the order of their time (to the second) and saved as their own commits (`[saved <time>]` in the message). Before each save the file is read again from Git and the change is merged into the latest version by row, page, sheet or connection; where both changed the same entry, the later save wins. "Saved to Git — merged with a change by someone else" and "Waiting to save (N in queue)" show where the save happens; after 3 conflicting tries the change stays in the queue with Retry. The PowerPoint template cannot be merged: the later save wins and an older one is never written. Access, Epic / Feature setup, QE Mapping, the Monthly pack setup and the planning data still refuse a conflict (GIT-17, HIS-04, MYD-09, KPT-03, CON-88, PCK-08; design defaults review, decision 8).

KB-73, DF-141, SM-95; TC-GIT-10.

PR #356.

**Changed**
- **Team overview period** — Year, Quarter and Month are now multi-select drop-downs at the start of the one filter row, before Region, Role, Team member and Stream; the second period row with its chips and Whole year is gone. Several years can be chosen (none ticked = every year offered). Month depends on Quarter: it offers only the months of the chosen quarters and drops months that are no longer offered; the period is, for each year, the chosen months, else the chosen quarters, else the whole year. Reset filters also returns the period to the header month's year and quarter. A period saved earlier still opens with the same months (OV-11, OV-15, MYD-08).

TC-OV-11, TC-OV-15.

PR #356.

**Changed**
- **Business time is UTC** (owner decision 1 of the design defaults review) — UTC now decides, for everyone wherever
  they are, which **month** a date belongs to (the header month's default, the month filters and counts of the
  release pages, Pulse Check, the Dashboard, Capacity, Insights, Windchill exports and closures in a month), the
  **month of new month Time Writing Tasks**, which **Sprint / PI is current**, and the **moment a month's plan or
  actuals lock** (the lock day ends at midnight UTC). Before, the app mixed India time, the viewer's own zone and UTC.
  Dates and times shown to you (fetched at, saved at, history) stay in your own time zone (NAV-51, NAV-11, NAV-12,
  QV-18, QV-16, QV-24, QV-53, OV-10, MON-06, MON-07, ATM-08, BKL-31, BKL-43, SET-06).
- **What you will notice outside UTC:** a new month (and a new Sprint day) now starts at your local time of midnight
  UTC — for example at 19:00 / 20:00 on the last day of the month in New York, and at 05:30 on the 1st in India
  instead of midnight. **Existing data near a month end can move to a different month:** an item approved, closed or
  dated in the last or first hours of a month (in your local time) is now counted in its UTC month, so a release,
  document or closure counted in November before may now be counted in October (or the reverse), and the month
  locks a few hours earlier or later than before.

**Fixed**
- The header month, a new month Task's title, the current Sprint and the lock could disagree near a month end (a US
  user saw November while a new Task was titled December; a plan was locked for one person and open for another)
  (KB-72).

DF-140; TC-NAV-51.

PR #356.

## v7.62.0 — 2026-11-23

**Changed**
- **QMS-0025: State and Assigned to filters** — both are multi-select drop-downs: State (default New + Active) and Assigned to (default Me; any people, or Unassigned); **Reset filters** goes back to the defaults. The **Assigned to me ✕** button is replaced by Me in the Assigned to filter (BKL-46, BKL-21).

TC-BKL-12, TC-BKL-35.

PR #355.

**Documentation**
- **UI standard, Messages (§8)** — owner decision: the results of actions go to the top-bar **Notifications** panel, next to the running and finished background jobs, instead of into the page; warnings about the data shown, help, empty and loading states stay on the page.

PR #355.

## v7.61.0 — 2026-11-23

**Changed**
- **QMS-0025: one scroll bar** — the board table fills the screen down to the footer and scrolls on its own; the page no longer scrolls as well (on a phone the page scrolls) (BKL-45).
- **QMS-0025: Source details tab** — the "Source details and dates" table moved from the collapsible section under the board to its own **Source details (n)** tab next to the **QMS-0025** tab (BKL-12).

TC-BKL-01, TC-BKL-34.

PR #354.

## v7.60.0 — 2026-11-23

**Changed** (owner decision 11)
- **LTE and PI Review snapshots hold all the data** — a snapshot now freezes all the app data present at the moment: the work items with their hours, the release data (release source, release views, Windchill exports, plans), capacity settings, people, baselines and settings (format version 2); earlier snapshots and My views stay out (SNP-05; OI-04 closed).

TC-SNP-02.

PR #353.

## v7.59.0 — 2026-11-23

**Changed** (owner decision 10)
- **One list of finished states** — Closed, Resolved, Completed and Done count as finished on every page (Pulse Check, the Monthly pack, Planning Overview, Insights, My Tasks, query views); Removed and Cut are not finished (FET-23, KB-70).
- **The close date from the item's history** — a finished item without a Closed Date now counts in the month it was finished: its State Change Date, else its Resolved Date, else its history (read once and kept), and only then its last change (FET-24; DSK-04 adds the read-only history request; CR-PB-08).

DF-138; SM-92; TC-FET-11.

PR #352.

## v7.58.0 — 2026-11-23

**Changed** (owner decisions on the design defaults review)
- **Monthly pack status "Not set"** — with no status chosen, the pack shows "Not set" with a grey circle instead of a green "On Track" nobody judged (PCK-08).
- **Overloaded means strictly above the limit** — everywhere (Dashboard, Team overview, Settings, Capacity vs Actual): exactly at the limit is no longer Overloaded (CAP-07, OV-14, SET-02; KB-69).
- **A connection without a role is read-only** — a role-less connection (older or hand-edited, also from Git) is Reference, never the writing role; an older Time Writing setup saved before roles existed keeps working (CON-100).
- **"Joined on" is now "Time tracking started"** — the date time tracking started for a person (not the real joining date); "Left on" is unchanged; saved dates are kept (CAP-14, CAP-15).

TC-CON-62, TC-PCK-06.

PR #351.

## v7.57.0 — 2026-11-23

**Added**
- **Pages fill the width** — every page now fills the width beside the menu, also when the menu is folded, inside a thin border with a margin on each side (top, right, bottom, left; default 10 / 20 / 10 / 20 px), set in Look & feel → Page layout (NAV-50, KB-68).
- **Look & feel** — one page (profile menu) with a tab each: Page layout, Theme and zoom (in step with the top-bar button), Start view and menu, and Table and chart defaults (moved from Admin → Reports; for the roles allowed to change them) (SET-18).

TC-NAV-50, TC-SET-08.

PR #350.

## v7.56.3 — 2026-11-23

**Fixed**
- **Edit form: Assigned to starts blank** — saving an unassigned item no longer assigns it to you; it stays unassigned unless you pick someone (without the right to assign others: an unticked "Assign to me") (BKL-44, KB-66; design defaults review DEF-05).

**Documentation**
- The owner's answers to the design defaults decisions 5, 7 and 10 are recorded; baseline rules and text dates in imports are in the backlog.

PR #349.

**Fixed**
- **Person list hidden behind the Time Writing cards** — the list of the top-bar Person picker now opens over the page's sticky KPI cards instead of behind them (KB-67; NAV-48, ACT-22).

PR #349.

## v7.56.2 — 2026-11-23

**Documentation**
- **UI uniformity agent** — a new change-team agent, `ui-uniformity`, brings pages and components in line with the UI standards (`docs/UI-STANDARDS.md`), one area at a time, without changing what they do; the read-only `review-uiux` checks the result.
- **Design defaults review** — the product owner's answers to the review's decisions are recorded in the report (UTC throughout, access fails closed, Monthly pack status "Not set", Edit form assignee starts blank, Overloaded strictly above, read-only for a connection without a role, …); each is built as its own change.

PR #348.

## v7.56.1 — 2026-11-23

**Documentation**
- **UI standards (draft, for approval)** — `docs/UI-STANDARDS.md` sets one way for each component type: page layout, panels, forms, pop-ups, tables, buttons, tabs and filters, messages, KPI tiles and charts, the Release pages of every stream, colours and type, and the UI defaults. Each section lists where the app differs today. Nothing in the app changes yet.
- **UI/UX reviewer** — the independent UI/UX review now also lists every UI default (pre-ticked, pre-filled, pre-selected, first tab, default sort and filters) and checks each page against the UI standards.

PR #347.

## v7.56.0 — 2026-11-23

**Changed**
- **SharePoint storage moved to the backlog** — SharePoint is not functional, so the SharePoint central storage (connection, initialize, pull, autosave) and the Microsoft sign-in are removed from the app (SNP-01…03, IF-04 retired; PROJECT-PLAN.md → Backlog). Shared data already lives in the private Git data repository (Git storage). The KPI tracker still reads its workbook from SharePoint in the desktop app.
- **Snapshots are saved to Git** — LTE and PI Review snapshots are saved as JSON files in `lte-snapshots/` of the Git data repository (`ponkritz/DemandPlanningStorage`), one commit each, as new files only, read back before success, at most 50 MB; the history lists them from Git with links to GitHub (SNP-04, SNP-06…08). Saving needs a Git token that can write and is off with the synthetic sample.
- **Security** — the Content-Security-Policy no longer allows framing the Microsoft sign-in (`frame-src 'none'`); the `@azure/msal-browser` package is removed.

LIM-16; SM-19; DF-22; PT-13 closed; CR-P1-05, CR-P1-06 no longer apply; TC-SNP-01…03.

PR #346.

## v7.55.1 — 2026-11-23

**Documentation**
- **Independent design defaults review** — the second report of the independent review team (`docs/reviews/2026-11-23-design-defaults-review.md`): every default value and default behaviour in the code, scripts, CI and build settings, judged for safety and against the documents — 85 findings (2 Critical, 6 High, 24 Medium, 53 Low), a full defaults register and the decisions the product owner must make. OI-11 is closed (fixed by GIT-16). Nothing in the app changes.

PR #345.

## v7.55.0 — 2026-11-23

**Added**
- **Close Task** — on Time Writing a **Close Tasks** mode next to Close Features (tick this month's Tasks, then Close N Tasks), and Close on a month Time Writing Task on My Tasks [Board]; both open the Close pop-up with the hours question (BKL-42).
- **Hours make work Active** — entering hours on a month Time Writing Task sets the Task and its Time Writing story to Active; a Closed one is reopened to Active, and the message names each change (BKL-41).
- **Closing a Feature early** — the Close pop-up also lists the later months' Time Writing Tasks of everyone (ticked, "→ Removed, 0 h"); on Close they are set to 0 h Original Estimate and Removed before anything closes; Tasks with Completed Work are left alone (BKL-43).

DF-136, DF-137; SM-91; TC-BKL-30, TC-BKL-31, TC-BKL-32.

PR #344.

## v7.54.4 — 2026-11-23

**Fixed** (independent UI/UX review findings 1, 3, 4 and 7)
- **Pop-ups work with the keyboard** — the first field takes the focus, Tab and Shift+Tab stay inside, Escape closes the topmost pop-up (an open list inside it closes first) and the focus returns to the button that opened it (UI-18).
- **A click beside a pop-up no longer loses what was typed** — every Azure DevOps write pop-up and settings editor stays open; pop-ups without input still close on such a click (UI-19).
- **Loading from Git asks before replacing unsaved changes** — Load latest, Update & load, Load latest from Git and Load everything name what would be replaced, also after a save conflict (GIT-16).
- **Edit without a saved PAT** — the PAT field no longer disappears after the first character (BKL-40).

KB-62…65; DF-134, DF-135; TC-UI-11, TC-UI-12, TC-GIT-09, TC-BKL-29.

PR #343.

## v7.54.3 — 2026-11-23

**Documentation**
- **Independent UI/UX review** — the first report of the independent review team (`docs/reviews/2026-11-23-ui-ux-review.md`): the UI/UX role read every component, page and style sheet in four slices, checked them in the running app (sample data, light and dark mode, 1440px and 390px) and listed 106 findings (3 High, 43 Medium, 60 Low), ranked, with the code locations. KB-53 is reopened: some texts still point to settings pages that do not exist. Nothing in the app changes; the findings are planned as later changes.

PR #342.

## v7.54.2 — 2026-11-22

**Process**
- **Independent review team** — seven read-only Claude Code agents for an unbiased, line-by-line review of the code: `review-lead` (plans module slices, merges and ranks the findings) and six discrete reviewers — Developer, Tester, Peer review, Code review, UI/UX and Design defaults. Every finding is a Bug, Open Item, Future Item, Improvement or Weak Design with its location and evidence; the report goes to `docs/reviews/`. Method and rules: `docs/reviews/README.md`; DEVELOPMENT-PROCESS §4.

PR #341.

## v7.54.1 — 2026-11-22

**Documentation**
- **Code Review Backlog** — imported from `ponkritz/DemandPlanning` (`docs/CODE-REVIEW-BACKLOG.md`): 8 P1 fixes (CR-P1-01…08) and 13 Potential Bugs (CR-PB-01…13), linked from the Project Plan's Backlog; each to be confirmed against this repository before it is fixed or closed.

PR #340.

## v7.54.0 — 2026-11-22

**Changed**
- **The Close pop-up** — Close Features on Time Writing, and Close on a Feature or User Story row of My Tasks [Board] and Sprint check, list everything that would close with a tick box and its #ID (opens it in Azure DevOps): the Feature with its User Stories and Tasks; for a User Story the story alone, or — when it is the last open one — with the Feature, its Time Writing story and Tasks. Your items start ticked, other people's do not; a parent closes only with everything below it; closing a Time Writing Task first asks you to confirm its hours (BKL-39, ACT-18; replaces the follow-up questions of ATM-20).

DF-133, SM-90; TC-BKL-28.

## v7.53.1 — 2026-11-22

**Changed**
- **Footer** — shows only the desktop app download and the version and build, “v{x.y.z} (Build n)”, with Force Update; the build ID, build time and where data is saved are in the Force Update window (NAV-49, NAV-15).

TC-NAV-48, TC-UPD-02.

PR #338.

## v7.53.0 — 2026-11-22

**Changed**
- **Time Writing cards stay at the top** — Capacity, Planned and Actual hours, Tasks, Monthly update and the last day stay under the top bar however far you scroll (ACT-22).
- **＋ Add a new activity** — now a button in the heading row of Your activities, next to Close Features and Save; the “Add activities” line that looked like a page heading is gone (ACT-20).

TC-ACT-17.

PR #337.

## v7.52.1 — 2026-11-22

**Fixed**
- **My settings and other short pages** — since v7.52.0 a page with little content shrank to it and sat in the middle of the window; every page now keeps the full width and starts at the top, so all My settings sections have the same width and the tabs no longer move (KB-61, NAV-49).

TC-NAV-48.

PR #336.

## v7.52.0 — 2026-11-22

**Added**
- **Profile** at the top right — My settings, Classic / Tile view, View as…, Search settings and Customize menu, moved from the menu (NAV-48, SET-15, NAV-46).
- **Footer** on every page — where data is saved, the desktop app, zoom (desktop app), the version and build with Check for updates / Force Update; sticky at the bottom and never covering the page: content ends where the footer starts and the Unsaved changes bar sits above it (NAV-49, NAV-15).
- **⟳ Time Writing** in the top bar — fetches only the Time Writing connection now, as Fetch in Admin → Streams does (FET-22).

**Changed**
- **Person** — one picker in the top bar on Time Writing, My Tasks [Board] and Sprint check, in place of Show work for / Activities of; My dashboard always shows you (NAV-47, ACT-14, MYD-01).
- ↻ Refresh fetches the Time Writing connection first, so a slow on-prem view no longer holds it up (FET-22, KB-60).

**Future plan**
- Hiding the side menu in the tile view is recorded as OI-16.

TC-NAV-47, TC-NAV-48, TC-FET-10; KB-60, OI-16.

PR #335.

## v7.51.0 — 2026-11-22

**Changed**
- **Complete children per Epic** — Admin → Epic & Feature setup → Setup per Epic has “Offer ‘Complete children’ on the Features of this Epic”, a team setting in the shared setup, on by default; where it is off, the Epic's Features do not offer Complete children (BKL-38, BKL-10).
- **You choose the User Stories** — the Complete children pop-up lists the Epic's User Stories with none ticked, so you decide which to add, and lets you add one of your own (BKL-38, CON-53).

DF-132; TC-BKL-27.

PR #334.

## v7.50.0 — 2026-11-22

**Added**
- **Home** — the app now opens on Home, first in the menu: a soft-coloured tile per area (My Work, My dashboard, Team Insights, I&D Board, Release Details, Planning & Baselines, QE Mapping, Snapshots & Documents, Admin, My settings), each opening its area and with links straight to its pages; Release Details links each stream; a search filters tiles and pages; only what the person's roles may open is shown (NAV-42, NAV-43, NAV-44).
- **Tile view or classic view** — a button at the top of the menu switches between the tile view (opens on Home) and the classic view (opens on My dashboard, without Home, as before); each person's choice is kept in their browser (NAV-46).

**Changed**
- In the tile view My dashboard is no longer the page the app opens on; it is a tile on Home and stays in the menu; the classic view still opens on it (MYD-01, NAV-46).

DF-122; TC-NAV-42, TC-NAV-46.

PR #318.

## v7.49.0 — 2026-11-21

**Changed**
- **＋ Time Writing Task runs in the background** — Add n months closes the pop-up at once; the top bar shows the job's progress and result like the other long writes; one job per Feature and person; when it fails part-way it says what failed and which Tasks were made (BKL-37, NAV-36).

TC-BKL-26; DF-125.

PR #333.

## v7.48.0 — 2026-11-21

**Changed**
- **Time Writing in order of Feature number** — Your activities, the suggestions and Leave and training are listed by the Feature's #ID, lowest first (a Task or story by the Feature above it) (ACT-21).

TC-ACT-16.

PR #332.

## v7.47.0 — 2026-11-21

**Added**
- **Time Writing titles follow the Feature name** — when a Feature is renamed, its “… - Time Writing” User Story and “{Month} | …” Tasks (everyone's) take the new name automatically and silently the next time the Feature, a story or Task is saved in Edit, or a month Task's hours are saved; only sets made from the old name are renamed — leave, holidays and stories people titled themselves are left alone; no scheduled run (the PAT stays in the browser) (BKL-36).

DF-131, SM-89; TC-BKL-25.

PR #331.

## v7.46.0 — 2026-11-21

**Changed**
- **＋ Time Writing Task: Assigned to** — the pop-up asks who the Tasks are assigned to, starting at the person creating (anyone in the backlog with the right “Assign new work to other people”); that person is the Assigned To of each Task and of its Time Writing User Story (a new story, or an existing one with no Assigned To; another person's story is never reassigned) (BKL-35).
- **A month that already has a Time Writing Task** — its row says so with the Task's hours; no second Task is created, the hours typed override its hours, and Add asks to confirm first (BKL-35).

DF-130, SM-88; TC-BKL-24.

PR #330.

## v7.45.1 — 2026-11-21

**Tests**
- **End-to-end tests on a slow machine** — CI also runs every end-to-end scenario with the page on a CPU four times slower (Chromium's throttling), in its own job, so a step that only works because the app is fast fails in CI before users meet it (CI-12).

TC-CI-08.

PR #329.

## v7.45.0 — 2026-11-21

**Added**
- **My page usage** (My settings) — off unless you turn it on: counts how often you open each page, in this browser only, and lists them most used first; never sent, shared or backed up; turning it off deletes the counts (NAV-45).

DF-129, SM-87; TC-NAV-45.

PR #328.

## v7.44.1 — 2026-11-21

**Changed (code structure)**
- `src/azureDevOps.ts` (1,037 lines) is split in three: `azureClient.ts` (connection settings, the transport, api-version negotiation, the write guards and the request bodies), `azureRead.ts` (iterations, the backlog fetch and its mapping, field names, team members) and `azureDevOps.ts` (the writes), which re-exports the other two so every import stays as it was. No behaviour changes; the same unit and end-to-end tests pass.

PR #327.

## v7.44.0 — 2026-11-21

**Added**
- **Admin → Overview warns about Feature setup gaps** — a DP or IOCC bulk creation Epic without a shared Feature setup (its Create Features would skip every row), and shared Feature setups whose Feature DoD is empty, each with a link to Feature setup (ADM-05).

TC-ADM-03.

PR #326.

## v7.43.0 — 2026-11-21

**Changed (development process)**
- **CI writes the version, release notes and generated documents** — each pull request adds its own change note in `docs/changes/` (bump type and text) instead of editing `package.json` and the top of RELEASE-NOTES.md; after the merge, the new job *Write release commit* sets the version, writes the entry (with the PR number), regenerates the SWBOM and the traceability matrix and pushes one release commit, which the run then builds, tags and publishes. Open pull requests no longer conflict on these files. A run on main is no longer cancelled by the next merge, so every version is tagged (CI-07, CI-09, CI-11; LIM-13 closed).

DF-128, SM-86; TC-CI-05, TC-CI-07.

PR #325.

## v7.42.4 — 2026-11-21

**Dependencies**
- Daily package update: `source-map-js` 1.2.3 → 1.2.4 (build-time, through Vite). `pnpm audit`: no known vulnerabilities before and after. Majors not taken: Electron 45, TypeScript 7, @types/node 26; Playwright stays at 1.56.1.

PR #324.

## v7.42.3 — 2026-11-20

**Security**
- **Content-Security-Policy** on the built app: scripts only from the app itself, no inline or evaluated scripts, no plugins or foreign form posts, frames only for the Microsoft sign-in, requests only to https hosts. It narrows script injection as a way to the PATs and Git token kept in the browser. Checked on every menu page in the browser; the desktop app is still to be opened once with it (NFR-09, KB-59).

DF-127, SM-85, KB-59; TC-CSP-01. PR #323.

## v7.42.2 — 2026-11-20

**Fixed**
- **Sample mode writes nothing** — with the synthetic sample loaded, every write to Azure DevOps is refused before anything is sent, from any page (before, only My Tasks [Board] blocked it) (SMP-05, OI-10).
- **Reset synthetic MVP data** asks first, names what is replaced, is recorded in History and is not offered while the planning data is stored in SharePoint (SMP-06, OI-09).

DF-126, SM-84; TC-SMP-02. PR #322.

## v7.42.1 — 2026-11-20

**Changed**
- **Faster start** — pages now load when first opened instead of all at start, and the project documents only with the Documentation page: the first download is 814 KB (237 KB compressed) instead of 2.85 MB (830 KB), about 70 % less; a page shows "Loading the page…" for a moment the first time (NFR-08).

TC-PERF-01. PR #321.

## v7.42.0 — 2026-11-20

**Changed**
- **＋ Time Writing Task asks for the months and hours** — on a Feature or User Story row (Backlogs, My Tasks [Board]) it opens a pop-up: the month in the header first, **＋ Add month** for the next one, any month changeable or removed, and the Original Estimate (and, except for a future month, Completed Work) of each; **Add n months** creates one Task per month by the usual Task rule. A month you already have a Task for is shown and kept; only the hours you type change it (BKL-34).


**Tests**
- E2E: a page reload with the synthetic sample now loads the sample again when the reload beat its background save (slow CI runners left New Feature disabled in TC-EPS-01).

DF-125; TC-BKL-23. PR #320.

## v7.41.0 — 2026-11-20

**Removed**
- **Built-in Release Classification on New Feature** — the Major / Minor / MLD / Platform Update / Service Pack drop-down is gone from New Feature, and no "Release Classification :" line is written any more; the Parent Epic takes the full width. An Epic's own Release Classification field (Epic setup) is still asked for and still picks its DoD and User Stories (BKL-33, retires BKL-17).
- **Built-in Release Classification and Release / PU (MLD) lists everywhere** — the DP / IOCC Create Features pop-ups offer only the Epic's own Release Classification list (none without one); Release Details → DP has no Release type column; there are no built-in Release (PRD, SFV, DT, IQ/OQ) or PU sets — a bulk Epic without a Feature setup skips its releases; old Release / PU sets in a setup are no longer read; New Feature for an Epic without a setup offers no milestone stories and no PU / Full Release DoD (type the DoD); Content bulk writes no "Release Classification : NA" line (DPF-09; retires DPF-01, BKL-06, QV-61).


**Fixed**
- **Shared connections no longer lost** — saving the stream mapping or the connections to Git merges with the shared setup instead of overwriting it with one computer's list, which had dropped connections other computers added (e.g. a second CP query) for everyone (CON-98, KB-58).
- **Removed connections** — Settings → Streams finds connections dropped from the shared setup in the Git history and restores them, here and for everyone (CON-99).

DF-123, DF-124, SM-83, KB-58; TC-BKL-22, TC-DPF-08, TC-CON-61. PR #319.

## v7.40.1 — 2026-11-20

**Documentation**
- **AGENTS.md** — instructions for coding agents other than Claude Code (e.g. Codex): follow CLAUDE.md, the checks before every push, the constraints, the roles in `.claude/agents/` as checklists, and one agent per branch and pull request (DEVELOPMENT-PROCESS.md §4, CONFIGURATION-MANAGEMENT.md).

PR #317.

## v7.40.0 — 2026-11-20

**Added**
- **User Story templates** — Admin → Epic & Feature setup → User Story templates: a shared library of User Stories (title and description) tagged with Epics and Release Classification values (STT-01).
- **Pick templates per Epic** — Setup per Epic offers **＋ Add from templates** (matching ones first) and **Save as template** on a story; picked stories stay linked, so a template change reaches every Epic that uses it in New Feature (ticked) and bulk creation; **Unlink** keeps a copy. A story's description can now be edited in the setup (STT-02).

**Changed**
- The role right *Edit Epic setup value lists* is now *Edit Epic setup value lists and User Story templates*.

DF-121, SM-82; TC-STT-01, TC-STT-02. PR #316.

## v7.39.0 — 2026-11-20

**Added**
- **DoD and User Stories by Release Classification** — Setup per Epic shows a tab per Release Classification value (the Epic's own list, else the built-in values) after *Epic default*; each value can have its own Definition of Done and User Stories. The value chosen in New Feature picks its set (DPF-07).
- **Release Classification per row in bulk** — DP and IOCC Create Features have a drop-down per release, prefilled from the release number, that picks the row's DoD and User Stories and is written as the Feature's Release Classification (DPF-08).

**Changed**
- The fixed *Release (Major, Minor)* / *PU (MLD, Platform Update)* tabs are replaced by the value tabs; sets saved there still apply to Major / Minor and MLD / Platform Update / Service Pack until a value gets its own.
- DP and IOCC bulk creation use the Epic's own DoD and User Stories when it has a setup; DP's built-in Release / PU sets only when it has none (KB-56).

**Fixed**
- Setup per Epic: the Epic list is at most 600px (or the window) tall with its own scroll bar, its search box stays on top and the list stays in view while the setup scrolls; on a narrow screen it is at most 320px (CON-97, KB-57).

DF-120, SM-81, KB-56, KB-57; TC-DPF-06, TC-DPF-07. PR #315.

## v7.38.0 — 2026-11-20

**Added**
- **Start date on New Feature** — next to the Target date, empty = today, saved in the Feature's Start Date field. The Feature's Time Writing Tasks start in the Start date's month, never before the current month: a release starting in December gets no November Task (BKL-31).
- **Time Writing up to the Target date** — a new Feature gets one Time Writing Task for every month from its first month up to the Target date's month, and section 4 asks for the Original Estimate (and, for the current month, Completed Work) of each month in a table with totals; the months are shown under the dates and in the summary (BKL-32).


**Fixed**
- **Continue** in New Feature now moves the keyboard focus to the next section only after it is shown; before, the focus could be lost when the page was slow, and section 4 could not take the focus at all (BKL-30, KB-55).

DF-119, SM-80, KB-54, KB-55; TC-BKL-20, TC-BKL-21. PR #314.

## v7.37.0 — 2026-11-20

**Changed**
- **Setup per Epic** — the Feature setup is redesigned as one screen per Epic (Admin → Epic & Feature setup): the Epic list with *All Epics (defaults)* first and each Epic marked *Uses defaults* or *n of 4 customized*; a preview of a new Feature; and four sections — Fields & title, Definition of Done, User Stories (Release / PU tabs for DP and IOCC), Month Task — each with one **Customize for this Epic** switch. *Use my own version* edits your own copy; one **Save to Git** saves everything. The pop-up editor, the Feature fields and Feature setup tabs and All Epic setups are replaced; old links open the new screen (CON-97; CON-96, EPS-08 retired).
- An Epic without a setup of its own now uses **All Epics** when All Epics has anything set; with All Epics empty, New Feature still offers the built-in PU / Full Release choice (CON-95).

DF-118; TC-CON-60. PR #313.

## v7.36.2 — 2026-11-20

**Fixed**
- **Feature setup** — the "All shared setups" table is removed: it showed only what each Epic set itself (an inherited DoD read as Missing) and repeated **All Epic setups** (CON-61, CON-62 retired; KB-53).
- **Page names** — texts across the app now name the current pages: My settings, Admin → Streams, Stream options, Epic & Feature setup, People & roles, Capacity & time, Reports, Data & sharing (KB-53).

PR #312.

## v7.36.1 — 2026-11-20

**Dependencies**
- Daily package update: @azure/msal-browser 5.29.1 → 5.30.0, electron 44.11.4 → 44.11.5. `pnpm audit`: no known vulnerabilities before or after; the minimatch overrides are still needed (without them the audit reports a moderate finding in electron-builder's dependencies). Skipped majors: Electron 45, TypeScript 7, @types/node 26; Playwright stays at 1.56.1.

PR #311.

## v7.36.0 — 2026-11-19

**Fixed**
- **IOCC bulk Create Features uses the IOCC Feature setup** — without Release / PU sets of its own, the IOCC bulk Epic's Feature setup (its DoD and User Stories) is used, no longer DP's built-in sets; the pop-up says which it uses (QV-61, KB-52).
- **New Feature sections** — the next section no longer waits for a click outside the box: the Definition of Done and User Stories sections end with a **Continue** button that shows the next section and moves the focus to it, as stepped forms usually do (BKL-30, KB-51).

TC-BKL-19, TC-QV-42. PR #310.

## v7.35.0 — 2026-11-19

**Added**
- **Choose the QE in the bulk pop-up** — in every bulk Create Features (DP, IOCC, Content) each release has a person drop-down, prefilled from the QE Mapping (Content: from Assign all), changeable per row; a release without a QE in the mapping is created once you pick one (DPF-06).

TC-DPF-05. PR #309.

## v7.34.0 — 2026-11-19

**Changed**
- **Epic & Feature setup** — Epic setup and Feature setup are one Admin page, starting with **All Epic setups**: every Epic with Feature fields or a Feature setup, its fields, title pattern and Feature setup at a glance, searchable, with Fields and Feature setup buttons opening that Epic. Old links open the right section (EPS-08).

TC-EPS-06. PR #308.

## v7.33.0 — 2026-11-19

**Changed**
- **On-prem fields are drop-downs** — an Epic setup field that names an on-prem field (e.g. Custom.Program) offers, in New Feature, the values of that field found in the fetched on-prem data (EPS-06).
- **The old title fields are gone** — Feature fields are set only in Admin → Epic setup; the Feature setup no longer reads, shows or saves its title fields, and **Remove the old title fields from Git** cleans the stored files. With a Release Classification field in the Epic setup, the built-in Release Classification picker is hidden so it is not asked twice (EPS-07; CON-75, BKL-18 retired).

TC-EPS-05. PR #307.

## v7.32.0 — 2026-11-19

**Added**
- **Admin → Overview** — setup health in one list: the open Get started steps and the shared-setup checks (unsaved shared changes, no access roles or Tool Owner, no IOCC bulk Epic, no Epic or Feature setup…), each with a link straight to the setting (ADM-01).
- **Unsaved shared changes** — shown on the Overview with Save to Git, and as a count next to ADMIN in the menu (ADM-02).
- **Search settings** — Ctrl K (⌘ K) or Search settings in the sidebar finds any setting by name or topic and opens it (ADM-03).
- **History** — filter the changes by area and text (ADM-04). Undo is not there yet (OI-15).

DF-117; OI-15; TC-ADM-01, TC-ADM-02. PR #306.

## v7.31.0 — 2026-11-19

**Added**
- **My naming patterns** (My settings) — your own release naming patterns for IOCC, Content and Tool Validations (never DP or CP), kept on this computer. Where you set them they replace the shared ones for you — release names, counts and figures — and **Use the shared patterns** goes back (QV-60).

DF-116; SM-79; TC-QV-41. PR #305.

## v7.30.0 — 2026-11-19

**Added**
- **Feature setup in layers** — Built in → **All Epics** → the Epic's shared setup → Mine, field by field: the Feature DoD, the optional User Stories and the default estimate of the month Task can each be set on an Epic's setup or inherited from the layer above. **All Epics** (Admin → Feature setup) holds the defaults. The editor shows each field as *Set here* or *Inherited from …*, with **Override here** and **Revert to inherited**. Existing setups are unchanged (every field set) (CON-95, CON-96).

DF-115; TC-CON-59, TC-CON-60. PR #304.

## v7.29.0 — 2026-11-19

**Added**
- **Epic setup** (Admin → Epic setup, replacing Master data) — per Epic, the extra fields its new Features carry (e.g. Program for DP, Platform for CP): Text, List (from shared value lists), Number or Date; each into the Description, the Title or both; If empty Optional, Warn or Block; an optional on-prem field and a title pattern, with a preview. **Copy to Epics** gives other Epics the same fields (e.g. the ECP Epics). Saved to Git (epic-setup.json) for everyone (EPS-01, EPS-05; SET-10 retired, OI-06 closed).
- **New Feature** asks for the Epic setup's fields (drop-downs for lists, required ones marked): the Title follows the pattern, the Description gets the field lines, an empty Block field stops creation and an empty Warn field is shown (EPS-02).
- **Bulk creation** (DP, IOCC, Content) applies the bulk Epic's setup: an empty Block field skips the release, an empty Warn field creates it and is listed (EPS-03).
- Two new permissions in Role rights: **Edit the Epic setup** (Tool Owner, Admin, Scrum Master) and **Edit Epic setup value lists** (Tool Owner, Admin); an access file saved by v7.27–7.28 gets them as by default (EPS-04).

DF-114; SM-78; OI-06; TC-EPS-01…04. PR #303.

## v7.28.0 — 2026-11-19

**Changed**
- **My settings and Admin** — your work email, servers and PATs and your own views move to **My settings**, opened from your name at the bottom of the sidebar. The Settings menu group becomes **Admin**, holding the shared setup: Streams, Stream options (Epics to match Features in, Bulk creation Epics, Release counts), Feature setup, People & roles, Capacity & time (now with Historical hours), Reports (Monthly pack, Table and chart defaults), Data & sharing (Git, SharePoint, Other views, Read-only sources, Synthetic sample), Master data and History. Old links open the new place (SET-15; SET-14 retired).
- **Scope chips** — every settings section says whom a change affects: only you, this computer, everyone, or the Tool Owner only (SET-16).

**Added**
- **My views** — your own read-only views on a server you already have a PAT for, under Other views in your menu; kept on this computer only (never in Git, backups or SharePoint) and never a stream, so the release figures do not change (SET-17).

DF-113; SM-77; TC-SET-06, TC-SET-07. PR #302.

## v7.27.0 — 2026-11-19

**Changed**
- **Role rights as a permission matrix** — every menu area and every action is now a permission of its own, in groups (Work items in Azure DevOps, Release data, Streams, Setup, Capacity and time, People and access, Reports and sharing), and each cell is **Allow**, **Deny** or **Not set** per role. A denial wins over any other role's allow. "Change work items" is split into create, edit fields, change state / close Features, move to a Sprint or PI, enter hours, comment and bulk create, each checked before anything is sent to Azure DevOps; "Manage shared settings" is split per Settings section (capacity, rules, holidays, period control, historical hours, people, capacity roles, Monthly pack setup, table defaults, shared setup, release counts, stream options). New permissions for QE Mapping edits, table export, Monthly pack text, the shared Feature setup and View as. The matrix can be searched, and **Check access** shows for a person and a permission whether it is allowed and which roles allow or deny it. An access.json saved before this version keeps every person's rights (CON-94).

DF-112; SM-76; TC-CON-58. PR #301.

## v7.26.0 — 2026-11-19

**Changed**
- **Stream mapping locked to the Tool Owner** — a new app access role, Tool Owner (Role rights), alone changes the stream mapping and its query logic: servers, projects and queries of DP, CP, IOCC, Content and Tool Validations, their data sets and the shared release naming patterns. Admins no longer hold it by default; while nobody holds it, those who manage access can, so nobody is locked out; only a Tool Owner changes who holds it, and one must remain (CON-93, CON-42).

**Fixed**
- Monthly pack: a new bullet always takes the focus, so the first letters typed are no longer lost (KB-50).

DF-111; SM-75; KB-49, KB-50; TC-CON-57. PR #300.

## v7.25.0 — 2026-11-19

**Added**
- **IOCC bulk Feature creation** — Select and Create Features on the IOCC release table, by the DP rules: release type from the release number, DoD and User Stories from the Feature setup of the IOCC bulk Epic, assigned to the QE from the QE Mapping by the release name; 100% matches cannot be selected (QV-59).
- **Bulk creation Epics** (Settings → Stream mapping) — for DP, IOCC and Content, a shared default Epic (saved to Git) and each person's own choice (this browser), which wins; built in DP #13946, Content #22919 (QV-59).

DF-110; SM-74; TC-QV-40. PR #299.

## v7.24.0 — 2026-11-19

**Added**
- **Release counts for CP, DP and IOCC** — Completed and Supported releases of the month on My dashboard, the CP / DP / IOCC pages, Pulse Check and the Monthly pack; a stream without data for the month uses the counts an Admin entered (Settings → Stream mapping → Release counts), marked as entered, else a placeholder with the reason (QV-58).

DF-109; TC-QV-39. PR #298.

## v7.23.0 — 2026-11-19

**Added**
- **Epics to match Features in** (Settings → Azure DevOps → Stream mapping): for DP, CP, IOCC and Content, the QMS-0025 Epics whose Features and User Stories their releases are matched to — the Board column, the DP view, the CP report and the existing-Feature check of Create Feature / bulk create; none chosen = the whole board; shared in Git (QV-57).

DF-108; TC-QV-38. PR #297.

## v7.22.0 — 2026-11-19

**Added**
- **Sprint check → State checks: PI check** — an Active Feature still in an older PI than its Active User Stories is flagged with both PIs and **Move Feature to <PI>** (Iteration Path only, after a confirmation) (ATM-30).

**Changed**
- **Time Writing: ＋ Add a new activity** is a button at the top next to Activities of and opens the form as a pop-up; the activities list keeps the full width (ACT-20; ACT-19 retired).
- **My dashboard → My hours** says why you are not counted in the month (removed, team role not counted, Joined on / Left on, or no month Task yet) instead of showing 0h (CAP-56).

DF-103, DF-107; SM-73; TC-ATM-23, TC-ACT-15, TC-CAP-28. PR #296.

## v7.21.1 — 2026-11-19

**Fixed**
- **Capacity by team Role only**: whether a person counts for capacity is decided only by their team Role in People & access (Lead and Manager not counted by default) — no longer by their app access role (Admin, People Manager, …) or the People manager tick. Capacity roles shows the team roles only (CAP-57, KB-48).

TC-CAP-29. PR #295.

## v7.21.0 — 2026-11-19

**Added**
- **My dashboard → Signed by me**: the releases and documents you signed as Author, Reviewer or Approver, per stream (DP, CP, IOCC, Content, Tool Validations, S&S IT, ECP) and in total, for a from–to period you choose (this month, this quarter, this year, last 12 months); your own signature date where the field has one, else the document's approval date; a release counts once you signed any one of its documents; streams without such fields are named; the documents behind the figures are listed (MYD-13).

DF-106; TC-MYD-06. PR #294.

## v7.20.2 — 2026-11-19

**Fixed**
- **Time Writing: Capacity 0h for yourself** — your capacity (and My dashboard's hours) is now found under every name your work email carries on the board, not one display name; when you are not counted, the Capacity tile says why (removed, role not counted, Joined on / Left on, or no month Task yet) instead of 0h (CAP-56, KB-47).

TC-CAP-28. PR #293.

## v7.20.1 — 2026-11-19

**Updated**
- Daily package update: electron 44.11.3 → 44.11.4 (desktop app runtime), csstype 3.2.3 → 3.2.4 (types, development only).

**Security**
- `pnpm audit`: no known vulnerabilities (the picomatch ≤ 4.0.7 advisory open in v7.15.1 is no longer reported; picomatch stays 4.0.7, reached only through the build tools).
- This release also carries v7.20.0, whose versioned release was not published because its macOS packaging job got no runner.

PR #292.

## v7.20.0 — 2026-11-18

**Changed**
- **Sprint check**: the Move to current PI + Sprint panel spans the page; **State checks** look like the backlog tree — each row expands to its User Stories or Tasks, and your own New User Stories can be set **Active** there (their New Feature follows) (ATM-29).

DF-105; SM-72; TC-ATM-22. PR #291.

## v7.19.0 — 2026-11-18

**Added**
- **Charts: axis names and Data labels** — every chart names its X and Y axes; a Data labels box beside each chart writes the values on it (kept per chart on this computer); Settings → Table defaults → Charts turns them on for all charts (UI-17).

DF-104; TC-UI-10. PR #290.

## v7.18.0 — 2026-11-18

**Added**
- **Close Features on Time Writing**: a check box next to Save; tick Features and close your own open Tasks, User Stories and the Feature (when nothing of others is open below it) in Azure DevOps after one confirmation; closed month Tasks are read-only (ACT-18).
- **Add a new activity folds** to its heading, folded until opened; the activities list then takes the full width (ACT-19).
- **The side menu folds to icons** with « / » in its header; names on hover; kept per computer (UI-16).

DF-102, DF-103; SM-71; KB-46; TC-ACT-14, TC-ACT-15, TC-UI-09. PR #289.

## v7.17.0 — 2026-11-18

**Changed**
- **My Activities is now Time Writing and Assigned to Me is now My Tasks [Board]** — in the menu, the page headings, links, help texts, access rights and documents; the pages work as before and saved settings are kept (UI-15).

TC-UI-08. PR #288.

## v7.16.0 — 2026-11-18

**Added**
- **Zoom in the desktop app**: − / % / + in the sidebar and Ctrl − / Ctrl + / Ctrl 0 / Ctrl + wheel; **Auto** (on by default) fits the page into the window and follows resizing; a hand-set zoom turns Auto off; kept per computer (UI-14).

DF-101; SM-70; TC-UI-07. PR #287.

## v7.15.1 — 2026-11-18

**Updated**
- Daily package update: oxlint 1.93.0 → 1.94.0 (lint, development only).

**Open**
- picomatch ≤ 4.0.7 (high, ReDoS, GHSA-fc5q-39xc-vjpf), reached only through the build tools (Vite, tinyglobby): the patched 4.0.8 is not published yet, so no override can pin it; not part of the app at run time. Checked daily.

PR #286.

## v7.15.0 — 2026-11-17

**Added**
- **Release naming patterns**, editable in Settings → Azure DevOps → Stream mapping (`*` any text, `{…}` the release name; Try a Title; shared in Git): Content groups its documents under the Title up to and including _RELEASE; IOCC names releases after "Conformance Verification" and "Test Tools", grouped by those labels; other Titles keep the stream rule (QV-55).

**Fixed**
- **DP Supported Releases** counts only the releases listed for the month (each once), so it is never more than the list (QV-56).

DF-99, DF-100; SM-69; TC-QV-36, TC-QV-37. PR #285.

## v7.14.0 — 2026-11-17

**Added**
- **Content Create Features**: tick Content releases and create their Features in one go under Epic 22919 — Release Classification NA, DoD "All Documents are approved", one "Review of Deliverables - <title>" story in the current Sprint, the Time Writing story and a 4 h month Task — all assigned to one person chosen in a pop-up (CNB-01, CNB-02, UR-30, SR-34).
- **No duplicates in bulk creation**: in DP and Content Create Features, a release whose QMS-0025 Feature matches it 100 % cannot be selected; a similar Feature below 100 % is named in the pop-up and the release is still created (DPF-05).

DF-98; SM-68; TC-CNB-01, TC-CNB-02. PR #284.

## v7.13.0 — 2026-11-17

**Added**
- **Type the formula (fx)** in the calculation-profile editor: the utilization formula typed as in Excel (figures in [brackets], + − * / ( ), MAX, MIN, ROUND, IF), starting from the ticks, with insert buttons and a check as you type. It drives Utilization and Planned utilization for each person, and the team figure as the formula on everyone's figures added up (CAP-55).

DF-97; SM-67; TC-CAP-27. PR #283.

## v7.12.0 — 2026-11-17

**Added**
- **DP QE and bulk Features**: the DP table shows the Release type (Major, Minor, MLD, PU from x.y.z.a), the QE from the QE Mapping and the Possible QEs from the earlier releases of the product; tick releases and Create Features makes each Feature under Epic 13946 with its type’s DoD and User Stories, the Time Writing story and Task, assigned to the QE. The Release and PU sets and the QE Mapping columns are set in Feature setup → Epic 13946 (DPF-01…04, UR-29, SR-33).

DF-95, DF-96; SM-66; TC-DPF-01…04. PR #282.

## v7.11.0 — 2026-11-17

**Changed**
- **KPI tracker hidden**: the KPI tracker page is no longer in the menu or Customize menu; it stays in the build (the copy in Git is kept) until it is shown again (KPT-01).

TC-KPT-01. PR #281.

## v7.10.0 — 2026-11-17

**Changed**
- **DP planned releases**: a DP release without a DDT Date is now listed in the months of its Planned / ToBePlanned milestones (SFV, PRD, RPE with a date), marked "planned, not counted" in Month & Year; it is not counted as a Supported or Completed Release (QV-54).

TC-QV-35. PR #280.

## v7.9.0 — 2026-11-17

**Added**
- **DP Month & Year**: the DP table (Release Details → DP) shows **Month & Year** — the month of each release's DDT Date, which the list filters on, or "No DDT Date" (listed only with All months) — and **Milestones** — each milestone's month and status, ✓ when Done with a date and so counted as Supported in that month — to trace releases missing from a month or a count (QV-53).

TC-QV-34. PR #279.

## v7.8.0 — 2026-11-17

**Added**
- **KPI tracker** page (Data Insights): the team's KPI tracker Excel from SharePoint, read only, sheet by sheet. The desktop app reads it live with the company sign-in (a sign-in window; no tenant or client ID; GET only, nothing written to SharePoint); an admin's read is saved to Git as kpi-tracker.json, which everyone sees — in the browser and when SharePoint cannot be reached (KPT-01…05, IF-05, UR-28, SR-32).

DF-93, DF-94; SM-65; TC-KPT-01…03. PR #278.

## v7.7.0 — 2026-11-16

**Fixed**
- **Changes saved to Git now reach everyone while the app is open**: the app checks Git every 5 minutes and when you come back to its window. Newer planning data (capacity, calculation profiles, resources, table defaults …) loads by itself unless you have unsaved changes; any other newer shared file (Monthly pack, QE Mapping, Access, Feature setup, connection setup …) is named in a "Newer data in Git" banner with Reload. Before, others saw your changes only after a reload or restart (GIT-15, KB-45).
- **Table defaults and the fuzzy match threshold are shared**: they are now saved in the planning file in Git; before, they stayed in the browser where they were changed (GIT-14, UI-12, KB-45).

DF-91, DF-92; SM-64; TC-GIT-07, TC-GIT-08. PR #276.

## v7.6.0 — 2026-11-16

**Added**
- **Key takeaways** in the Monthly pack shows the Capabilities count in its Supported line: "Supported: … ; Capabilities (Projects & Services) = n" — the number of Features in the Capabilities bullet (PCK-12).

DF-90; SM-63; TC-PCK-10. PR #275.

## v7.5.0 — 2026-11-16

**Changed**
- **Utilization formula builder** in the calculation-profile editor: the formula is shown as Top ÷ Bottom in the profile's own names and changed by ticking terms — Top (counts as utilized, with the planned-hours source) and Bottom (taken off Funded Hours, and Standard Hours); a figure is never in both. The profiles table shows the sentence (CAP-54).

DF-89; SM-62; TC-CAP-26. PR #274.

## v7.4.0 — 2026-11-16

**Added**
- **Capabilities (Projects & Services)** bullet in the Monthly pack (Actions/Deliverables Realized): "Capabilities (Projects & Services) [n]: Feature, …" — the unique Features under the Epics chosen in Settings → Monthly pack (new Capabilities bullet: label and Epics) with actual hours (Completed Work on a month Time Writing Task) in the month, from anyone (PCK-11).

DF-88; TC-PCK-09. PR #273.

## v7.3.0 — 2026-11-16

**Changed**
- **Content releases are named by the Title**: the Content page, Pulse Check (Releases, the Content quadrant, period totals), the Monthly pack and every other count use the document Title instead of a release name and number from the paths — one release per unique Title. The Content Releases table shows a Title column and no Release column; a Feature whose title holds the Title is its Time Writing Feature (QV-52).

DF-87; TC-QV-33. PR #272.

## v7.2.1 — 2026-11-16

**Fixed**
- Monthly pack: a long typed bullet now wraps, and its field grows to show all of it; Enter still adds the next bullet (KB-44, PCK-10).

TC-PCK-08. PR #271.

## v7.2.0 — 2026-11-16

**Changed**
- **Calculation profiles are all editable**: the built-in Current (v4) and Old Calculation get **Edit** like custom profiles (buckets, capacity base, Absence kinds, NPRA parts, …). A changed built-in profile keeps its place and stays the default, shows "Built-in, changed", and has **Reset to built-in** (CAP-53).

DF-86; SM-60; TC-CAP-25. PR #270.

## v7.1.1 — 2026-11-15

**Changed**
- Daily package update within the current ranges (transitive, dev): @rolldown/pluginutils 1.1.0 → 1.1.1, postcss 8.5.32 → 8.5.33; graceful-fs 4.2.11 dropped (4.2.12 only). `pnpm audit`: no known vulnerabilities before or after; the minimatch overrides stay. Not updated (new majors): Electron 45, TypeScript 7, @types/node 26; Playwright stays pinned at 1.56.1 (the pre-installed browser).

PR #269.

## v7.1.0 — 2026-11-14

**Changed**
- **Clean capacity cards**: Pulse Check → Last month shows four cards — Utilization, Funded Hours, Absence, NPRA Hours — each with only its formula in brackets; Overloaded and Has capacity are counted in the Who has capacity table (CAP-52).
- **Terms per calculation profile**: a profile now also chooses which leave kinds make up its **Absence** (unticked leave is ignored, not deducted) and whether its **NPRA Hours** include NPRA-tagged hours and/or Training; **Names** gives every profile, built-in ones included, its own names for Utilization, Funded Hours, Absence, NPRA Hours, Available hours and Project work, used by the cards, columns, charts and formula. Built-in profiles include everything: no figure changes (CAP-52, CAP-45).
- "Contractual hours" is now **Funded Hours** and the setting "Working hours per day" is **Funded hours per day** (CAP-45).

DF-85; SM-59; TC-CAP-24. PR #268.

## v7.0.0 — 2026-11-14

**Changed**
- **People & access takes names and work emails from Azure DevOps**: the members of the Time Writing connection's team (read automatically when the page opens and after every refresh; ↻ Read the team again) and everyone Assigned To a fetched work item. Names and emails are shown read-only and are no longer typed; **Add a person** and **Add team members from Azure DevOps** are gone — add someone to the team in Azure DevOps and refresh. A person without an email in Azure DevOps is flagged; an email saved before is used until Azure has one. The app access role and the capacity roles link people by the Azure email (CAP-51, CAP-30, CAP-29, CAP-49; CAP-31 retired).
- The People table shows only setup (name, email, app access role, region, role, reports to, employment, Remove); the month figures (status, utilization, hours, available, streams) are on the Team overview and Pulse Check. People with settings who are not in Azure DevOps (historical hours, added by name earlier) are listed apart under "Not in Azure DevOps", their settings kept.

Major version: adding people moves from the app to Azure DevOps (the way users work changes); no data is changed. DF-84; SM-58; LIM-15; TC-CAP-22, TC-CAP-23 (UAT day 9). PR #267.

## v6.3.1 — 2026-11-14

**Changed**
- Daily package update within the current ranges: @azure/msal-browser 5.29.0 → 5.29.1 (runtime, with @azure/msal-common 16.16.1 → 16.16.2), electron 44.11.1 → 44.11.3 (dev; it brings graceful-fs 4.2.12 next to 4.2.11). `pnpm audit`: no known vulnerabilities before or after; the minimatch overrides stay. Not updated (new majors): Electron 45, TypeScript 7, @types/node 26; Playwright stays pinned at 1.56.1 (the pre-installed browser).

**Fixed**
- Monthly pack: the new bullet now takes the focus without an extra render (a lint warning from v6.3.0, react set-state-in-effect; no change in behaviour, TC-PCK-08).

PR #266.

## v6.3.0 — 2026-11-13

**Changed**
- **Monthly pack bullets with +**: the text boxes of the 2x2 and the Performance Pulse are replaced by bullets. Every bullet has a **+** that adds a new bullet right below it, and **+ Add bullet** adds one at the end of the box — Actions/Deliverables Realized now takes typed bullets too. Type in place, Enter adds the next one, ✕ removes one. The slides (.pptx, Copy) show each bullet where it was added. Save to Git saves the month's bullets and their place (`anchors` in monthly-pack/<month>.json); files saved before keep their typed lines at the end of each box (PCK-10).

DF-83; SM-57; KB-43; TC-PCK-08. PR #265.

## v6.2.1 — 2026-11-13

**Changed**
- Daily package update within the current ranges: rolldown 1.2.18 → 1.2.19 (transitive, the bundler of vite; dev). Its WebAssembly fallback binding now resolves @napi-rs/wasm-runtime 1.2.6 with @emnapi 2.0.0-beta.2 (installed only on platforms without a native binding; not on Windows, macOS or Linux x64/arm64). `pnpm audit`: no known vulnerabilities before or after; the minimatch overrides stay. Not updated (new majors): Electron 45, TypeScript 7, @types/node 26; Playwright stays pinned at 1.56.1 (the pre-installed browser). SWBOM regenerated; the new platform-specific rolldown 1.2.19 bindings, @napi-rs/wasm-runtime 1.2.6, @emnapi 2.0.0-beta.2 / 2.2.0 and @tybys/wasm-util 0.10.4 are MIT (read with `npm view`).

PR #264.

## v6.2.0 — 2026-11-12

**Changed**
- **New Feature on one page, section by section** instead of Next / Back pages: only section 1 (Feature) shows at first, and each section appears when the one before it is done: Definition of Done once section 1 is filled, User Stories once the DoD was checked (clicked into and left), Estimates for the month once the User Stories were chosen and left. The section to fill now is highlighted with what is missing or how to go on; done sections are ticked. Save is at the bottom; Enter in a field no longer creates the Feature (BKL-29).

DF-82; TC-BKL-19. PR #263.

## v6.1.0 — 2026-11-12

**Changed**
- **New Feature in four steps**: 1 Feature (Parent Epic, title, Assigned to, PI → Sprint, Release Classification, Target date), 2 Definition of Done, 3 User Stories, 4 Estimates for the month (Original Estimate, Completed Work, and a summary). Next opens the following step only when this one is filled and names what is missing; Back and the step buttons keep what was entered; Save is only on the last step, and Enter on an earlier step moves on instead of creating the Feature. Complete Feature children is unchanged (BKL-29).

DF-82; TC-BKL-19. PR #262.

## v6.0.1 — 2026-11-12

**Changed**
- Daily package update within the current ranges: electron 44.11.0 → 44.11.1, vite 8.3.7 → 8.3.8 (both dev). `pnpm audit`: no known vulnerabilities before or after; the minimatch overrides stay. Not updated (new majors): Electron 45, TypeScript 7, @types/node 26; Playwright stays pinned at 1.56.1 (the pre-installed browser).

PR #261.

## v6.0.0 — 2026-11-11

**Changed**
- **Settings → People & access** replaces Resources and Access. **People**: one row per person with their Azure DevOps name, **work email**, **app access role**, region, team role, reports to and dates; **Add a person** needs all of them; anyone missing a mapping is flagged, and app access given to an email with no person is listed with *Add as person*. **Role rights**: what each app access role sees and may do. (CAP-49)
- **Remove** asks whether the person **left the team** (on a date; earlier months unchanged) or is **not part of the team** (left out of every month, restorable), and offers to remove their app access too (CAP-48).
- **Capacity roles**: which team roles and app access roles count for capacity. **Lead, Manager and People Manager are no longer counted by default** — they get no capacity and their hours leave the utilization figures; Pulse Check and People & access name them. Everyone else employed in the month and not removed counts (CAP-50).

Major version: who counts for capacity changes on install (team figures of past months change too unless they are locked — lock presented months before updating) and the Settings pages change. DF-80, DF-81; SM-56; TC-CAP-22 (UAT day 9). PR #260.

## v5.3.2 — 2026-11-11

**Changed**
- Daily package update within the current ranges: @vitejs/plugin-react 6.2.1 → 6.3.0, electron 44.10.2 → 44.11.0, fake-indexeddb 6.2.7 → 6.2.8, oxlint 1.92.0 → 1.93.0, vite 8.3.6 → 8.3.7 (all dev). `pnpm audit`: no known vulnerabilities before or after; the minimatch overrides stay. Not updated (new majors): Electron 45, TypeScript 7, @types/node 26; Playwright stays pinned at 1.56.1 (the pre-installed browser). SWBOM regenerated; the new platform-specific oxlint 1.93.0 and rolldown 1.2.18 bindings are MIT (read with `npm view`).

PR #259.

## v5.3.1 — 2026-11-09

**Fixed**
- Settings → Capacity & periods → Insight thresholds: each insight is named once (no longer repeated on every threshold row) and the separate Built-in column, which repeated the values, is gone; the built-in value shows under a value only while editing or where it differs (CAP-47).

PR #258.

## v5.3.0 — 2026-11-09

**Added**
- **Insight thresholds** (Settings → Capacity & periods → Insight thresholds): the limits behind the Team overview insights — month-end forecast (±10%), plan accuracy (15% error, ±20% bias), stream momentum (3-month windows, ±20%, 8 h), resilience (80% / 90%), unusual months (±50%, 8 h, 3 months), plan health colours (75 / 50), persistent overload (3 months) and concentration (top 20%) — are set by roles that manage shared settings, shared in Git and audited, with ranges and the built-in value beside each. The insight texts and Definitions show the values in use. The built-in values are the ones used so far, so nothing changes until they are edited (CAP-47).

DF-79; SM-55; TC-CAP-21 (UAT day 9). PR #257.

## v5.2.0 — 2026-11-09

**Added**
- **Bucket rules** (Settings → Capacity & periods → Bucket rules): the title words for Unplanned Leave, Sick Leave and PTO, the title words for Training under the absence Epic, and the Training and Other NPRA tags are now set by roles that manage shared settings, shared in Git and audited. A draft shows its effect on the month (Absence hours, Training, Other NPRA, Project work: saved vs draft) before saving; *Use built-in words* restores the defaults. The built-in rules are the words used so far, so no figure changes until the rules are edited. Locked months keep their figures (CAP-46).

KB-42 (accepted): My Activities still recognises a person's leave and training stories by the built-in words. DF-78; SM-54; TC-CAP-20 (UAT day 9). PR #255.

## v5.1.1 — 2026-11-09

**Changed**
- Clearer names for the utilization figures on every page (Pulse Check, Team overview, Settings → Resources, the profile editor and the formulas): Contractual hours, Absence hours, Available hours, **Project work** (was Work), **Training** (was Trainings), Other NPRA, Common activities, **Total planned** (was Planned / Plan h), **Total actual** (was Utilized), **Actual utilization** (was Utilization) and Planned utilization. "Actual" always means Completed Work, "planned" Original Estimate. No figure changes; the Old Calculation tab keeps its names (CAP-45, CAP-38, CAP-39).

TC-CAP-19. PR #254.

## v5.1.0 — 2026-11-09

**Added**
- **Profile picker** for Admins on Team overview and Pulse Check → Last month: view the page with another calculation profile (for example with or without absence deducted from capacity). Only that page and only for that Admin; nothing is saved and everyone else keeps the default. The page says which profile is viewed; locked months keep their figures; Lock figures locks the figures of the profile viewed (CAP-44).

**Changed**
- Settings → Capacity & periods: *Funded hours per day* is now called **Working hours per day**; the formulas say "working days employed × Working hours per day (8h)" (CAP-02).

DF-77; SM-53; TC-CAP-18 (UAT day 9). PR #253.

## v5.0.0 — 2026-11-09

**Added**
- **Calculation profiles** (Settings → Capacity & periods → Calculation profiles): for each bucket — Work, Absence, Trainings, Other NPRA, Common activities — count as utilized, deduct from capacity or ignore; the planned hours (Original Estimate, Original Estimate else Completed Work, or Completed Work); the capacity base (working days × hours per day, or fixed hours a month pro rata), with or without Standard Hours; the shared-time groups counted; status from the recorded or planned utilization. Built-in *Current (v4)* (today's formula, the default) and *Old Calculation*; custom profiles are copied, edited, deleted and made the default by roles that manage shared settings, shared in Git and audited (CAP-41).
- The **default profile** produces every utilization figure (Pulse Check, Team overview, My dashboard, Resources, Monthly pack); its formula is shown with the figures (CAP-42). With *Current (v4)* as the default nothing changes.
- **Lock figures** on Team overview → Utilization (Admins): the month's person figures are kept with the profile used, who locked them and when; every page shows the locked figures with a note until an Admin unlocks the month with a reason (kept as history, audited) (CAP-43).

**Fixed**
- Saving *Edit capacity settings* no longer drops the period control's lock days and month locks (KB-41).

Major version: the capacity settings shared in Git gain the profiles and locked figures. An older version ignores them and drops them if it saves the capacity settings, so everyone who changes shared settings should update first. DF-75, DF-76; SM-52; TC-CAP-16, TC-CAP-17 (UAT day 9). PR #252.

## v4.2.1 — 2026-11-09

**Changed**
- Daily package update within the current ranges: concurrently 10.0.6 → 10.0.7 (dev). `pnpm audit`: no known vulnerabilities before or after; the minimatch overrides stay. Not updated (new majors): Electron 45, TypeScript 7, @types/node 26; Playwright stays pinned at 1.56.1 (the pre-installed browser).

## v4.2.0 — 2026-11-08

**Changed**
- **Team overview → Old Calculation**: absence booked without an Original Estimate (PTO, sick, unplanned leave, holidays, other absence) now counts its Completed Work in Planned Hours (CAP-40).

## v4.1.1 — 2026-11-08

**Changed**
- Daily package update within the current ranges: @azure/msal-browser 5.28.0 → 5.29.0, oxlint 1.91.0 → 1.92.0. `pnpm audit`: no known vulnerabilities before or after. The pnpm overrides for http-cache-semantics, undici@6 and fast-uri are removed (electron-builder's dependencies now ship the fixed versions); the minimatch overrides stay. Not updated (new majors): Electron 45, TypeScript 7, @types/node 26; Playwright stays pinned at 1.56.1 (the pre-installed browser).

## v4.1.0 — 2026-11-07

**Added**
- **Team overview → Capacity and workload → Workload by person** shows the utilization split per person over the period: Contractual, Absence, Available, Work, Trainings, Other NPRA, Common activities, Plan, Utilized and both utilizations (CAP-39).
- **Team overview → Utilization** (new tab): for one month of the period, the same per-person table as Pulse Check → Last month and the team figure Σ utilized ÷ Σ available, with the region, role and team member filters (CAP-39).

## v4.0.0 — 2026-11-07

**Changed** (utilization figures change on every page)
- **Utilization = Utilized hours ÷ (Contractual hours − Absence hours)**: Contractual = working days employed × hours per day; Absence = PTO + Sick Leave + Unplanned Leave + public holidays + other absence; Utilized = Work + **Trainings** + **Other NPRA** + **Common activities**. Trainings, other NPRA and common activities are no longer deducted from the available hours — they count as utilized hours. Planned utilization uses the same formula with Original Estimate. The team figure is the sum over the people, so Team overview and Pulse Check now agree. Pulse Check shows the split per person; Settings → Resources shows "X h available = C h contractual − A h absence" (CAP-38; CAP-05 and CAP-06 retired; CAP-11, CAP-13, CAP-16, CAP-34 updated). The Old Calculation tab is unchanged.

## v3.6.0 — 2026-11-07

**Added**
- **Team overview → Old Calculation → Count in this calculation**: tick boxes for the shared-time groups **All**, **All-India**, **All-Netherlands** and **All-US** (with each group's hours). An unticked group is left out of everyone's Planned and Actual Hours there; set by Admins, shared in Git; other pages unchanged (CAP-37).

## v3.5.0 — 2026-11-07

**Changed**
- **Team overview → Old Calculation → Standard Hours**: 32 h of Standard Hours now come off every person's Net Capacity (working days × funded hours − Standard Hours). Admins edit them on the tab with a **breakup** (lines of label and hours; the total is their sum), shared with everyone through Git (CAP-36).

## v3.4.0 — 2026-11-07

**Added**
- **Team overview → Old Calculation**: for a chosen month, per person — Net Capacity (working days employed × funded hours per day), Planned Hours (every planned hour, absence, holidays and NPRA included), Planned Utilisation, Available Hours (capacity − planned), Status (from the Planned Utilisation), Actual Hours (every hour recorded) and Actual Utilisation, with a total row (CAP-35).

## v3.3.0 — 2026-11-07

**Added**
- **Settings → Resources → Remove**: a person can be removed (and restored under Removed people). Removed people are left out of every capacity figure — capacity, utilization and team totals, their hours too — on every page; Pulse Check names them (CAP-33).
- **Who counts in capacity**: Settings → Resources shows "Capacity in <Month>: n people, X h available = funded − absence − common activities − NPRA", the people in its Info and an Available column; the Team overview Utilization tile and Workload by person show the number of people and their capacity (CAP-34).
- **My Activities → Add a new activity → Task**: adds a work Task (not Time Writing) under one of the Feature's User Stories with the same fields and rules as a User Story — Title, Description, Sprint (current preselected), Comment, the story's Area Path, assigned to the person shown (ACT-17).
- **Get started opens when the fetch fails**: a missing, wrong or expired token or a broken connection opens Get started with the reason, the token step and Fetch now — also after "Don't show again" (NAV-41).

## v3.2.0 — 2026-11-07

**Changed**
- **Get started**: the work email is now the third step, after the Time Writing connection and your token (PAT). **Detect from my token** reads your email from a work item assigned to, created or changed by you in Azure DevOps (read-only, with your own token); you check it and press Save email. Typing it still works (NAV-39).
- **Get started is short**: each step shows its title, status, field and buttons only; why and how are in its **Info**. Step 2 is **Azure DevOps token (PAT) [QMS-0025]**; step 6 is renamed **TFS APAC settings [DP/CP/IOCC/Content]**. Each token step links to where the token is created (GitHub, Azure DevOps, TFS APAC); an Admin can set those links in the pop-up under Token links (admin), shared in Git with the planning data (NAV-40).

## v3.1.1 — 2026-11-07

**Changed**
- **Get started → Your work email**: the browser now offers the email address it has saved (as Settings → Your work email already did); one click fills it. Nothing is read without the user choosing it (NAV-38).

## v3.1.0 — 2026-11-07

**Added**
- **Get started** (first-time setup) feedback: the pop-up now has a field for each value a step needs — the GitHub token (Connect & load), your work email (Save email) and your Azure DevOps PAT (Save PAT) — next to the button that opens the settings. Each is saved in this browser exactly as its Settings page saves it, never in Git (NAV-38).

## v3.0.0 — 2026-11-07

**Changed** (shared setup and the way people work)
- **One Time Writing Task rule on every page**: New Feature and Complete children, My Activities and ＋ Time Writing Task all create the month Task the same way — "<Month> | <Feature>" under "<Feature> - Time Writing" (the person's own story first), assigned to the person, in the Feature's Area Path and the project root; any month Task of the person for that month under the Feature is reused (New Feature used to match only the exact setup title) (BKL-28, BKL-14).
- **Feature setup**: the Time Writing story and Task templates (titles, descriptions, assignees, Area and Iteration Paths) are removed and no longer used; only the **default hours** of a new month Task remain, now applied on every page unless hours are typed. Existing setup files still load (CON-52, CON-53, CON-61, CON-62; CON-66 retired).
- **＋ Time Writing Task** (Backlogs, Assigned to Me) creates the Task for the **month selected in the header** (BKL-22).

## v2.3.0 — 2026-11-07

**Changed**
- **One way to add a User Story**: the New User Story form, My Activities (short form) and Your own User Story on New Feature use the same rules — the Feature's Area Path; a current or future Sprint, the current one preselected and changeable, checked before anything is written; an optional comment added to the Discussion on every form (BKL-27, ACT-08).
- My Activities → User Story now offers the Sprint (it used the current Sprint only); the New User Story form and New Feature's own story get the Comment field.

## v2.2.0 — 2026-11-07

**Changed**
- **Feature state follows its User Stories**: a Feature becomes Active only when one of its User Stories is Active. Creating a Feature or adding a month Task no longer sets it Active (ACT-10 retired). Setting a User Story to Active (Assigned to Me, Edit) makes its New Feature Active; Assigned to Me and Edit refuse Active for a Feature without an Active User Story; Sprint check → State checks flag a New Feature with an Active User Story (ATM-28).
- **Feature title is free text** on the New Feature form; the Epic's Feature setup overrides it with its title fields when set. Without a setup, the milestone stories take the service and release of a "Program | Service | Release" title, else the whole title (BKL-04).

## v2.1.0 — 2026-11-07

**Changed**
- **One way to create a Feature**: every page — Backlogs, Assigned to Me, Release Details and My Activities — uses the same New Feature form and rules. The Epic's Feature setup applies everywhere (else the built-in rules); the Feature and its User Stories take the Epic's Area Path; the Feature goes to the PI and its stories to the Sprint chosen (current one preselected, changeable); the Time Writing story and Task take the setup's Area and Iteration Paths, else the Feature's area and the project root (BKL-26, BKL-14; KB-39).
- **My Activities → Add a new activity → Feature** opens that New Feature form for the person and month shown, instead of its own short form; the Time Writing Task is for the month shown (ACT-16; ACT-12, ACT-13 retired).

## v2.0.1 — 2026-11-07

**Changed** (dependencies)
- Daily package update within the current ranges: vite 8.3.5 → 8.3.6, @azure/msal-browser 5.27.0 → 5.28.0. `pnpm audit`: no known vulnerabilities before or after; the electron-builder overrides stay. Not updated (new majors): Electron 45, TypeScript 7, @types/node 26; Playwright stays pinned to 1.56.1 (the pre-installed browser).

## v2.0.0 — 2026-11-06

**Changed** (the way people work)
- **My Activities** moves from Testing to **My Work**, first, for everyone with the My Activities area (formerly *Monthly Time Writing* in access.json) (ACT-15, ACT-01).
- **Monthly Time Writing** is removed: the month's tasks and hours are entered on My Activities. Its Team view of every person's month Tasks goes with it (ACT-15; MON-01…05, MON-08…13, MON-16…19 retired).
- **Bulk actions** becomes **Sprint check**: Move to current PI + Sprint and the State checks stay; the month tasks are on My Activities. Creating month Tasks ahead up to a Feature's Target date is removed (ATM-07; ATM-10…12, ATM-18, ATM-21 retired).
- Links to the removed pages (My dashboard, Assigned to Me, Settings hints) open My Activities or Sprint check.

## v1.35.0 — 2026-11-06

**Changed**
- **My Activities**: the **Save** button sits at the top, in the heading row of "Your activities for <Month>" (ACT-02).

**Added**
- **My Activities → Activities of** (top right, beside the page title): show another person's month. Work saved for them is assigned to them and needs the right to create work for others; otherwise saving is refused with the reason (ACT-14).

## v1.34.1 — 2026-11-06

**Changed**
- **My Activities**: the header is one row of tiles of the same size — Capacity, Planned hours, Actual hours, Tasks, Monthly update (a small ring) and the last day to update — instead of a tall Monthly update card beside shorter tiles (ACT-02, ACT-05, ACT-11).

## v1.34.0 — 2026-11-06

**Added**
- **New Feature**: an optional **Your own User Story** (title, description), created under the new Feature in the Sprint chosen (BKL-25).
- **My Activities → Add a new activity → Feature**: **Add a User Story under it** — title, description and an optional comment, in the current Sprint (ACT-13).

**Changed**
- **My Activities layout**: KPI cards on top in the order Capacity, Planned hours, Actual hours, Tasks, with a small **% of capacity** badge on Planned and Actual (Actual also as % of plan); **Unsaved changes** only while you edit; **Your monthly update** with the progress ring and last day beside them; **Suggested missing items** below Your activities; columns **Epic, Activity, Planned, Actual** (ACT-02, ACT-05, ACT-11).
- **My Activities → Feature** is one drop-down you can type into to search (ID, title, Epic) (ACT-04).

**Fixed**
- **Fetch at start**: the Time Writing data was often not fetched when the app opened. The fetch now waits only for the connection setup from Git (at most 10 seconds) and shows in the top bar with its result or why it was skipped (FET-21; KB-38).

## v1.33.0 — 2026-11-06

**Added**
- **My Activities → KPI cards on top**: Tasks, Planned hours and Actual hours (the same figures as Monthly Time Writing for you), your Capacity (as on My dashboard), the Monthly update (% of activities updated, which replaces the ring) and Unsaved changes (ACT-11).
- **My Activities → Add a new activity → Feature**: create a Feature under an Active Epic — title, the mandatory Feature DoD and a description — assigned to you in the current PI, with your month Time Writing task and its hours when ticked; the Feature is then Active (ACT-12, ACT-10).

**Changed**
- **My Activities → Add a new activity**: the Feature list shows only **your** Features (assigned to you, or holding a story or task of yours), with a **search box** — type an ID, a title or an Epic to narrow it (ACT-04).

## v1.32.0 — 2026-11-06

**New**
- **My Activities**: the suggested missing items can be filtered by the Feature's state — **Active**, **New** or **Both** — and **Add all** moves the shown ones into Your activities (saved only with Save) (ACT-09).
- **Add a new activity**: the Feature can be chosen first — all Active and New Features are listed with their Epic, and choosing one fills in the Epic (ACT-04).
- Creating your month task under a Feature that is still **New** sets the Feature to **Active** in Azure DevOps (ACT-10).

**Fixed**
- **My Activities** (under Testing): Features without a task this month are no longer pre-selected in Your activities — they are only **suggestions** (with Epic and ID) in Your monthly update; **Add** puts one in your list, unticking returns it, and nothing is created until Save. This prevents saving tasks by accident (ACT-03, ACT-05; KB-37).

## v1.31.0 — 2026-11-06

**New**
- **Capacity vs Actual** (under Testing, Admin role only): capacity after leave and holidays against the hours booked — tiles for **capacity**, **actual**, **actual utilization** and **headroom / over capacity** against the month before; **12 months** of actual against capacity (bars in red when over); **by person** with % used and Over / On track / Under; **where the hours went** per Epic; Region, Epic and Owner filters (CVA-01…CVA-06).

## v1.30.0 — 2026-11-06

**New**
- **Planning Overview** (under Testing, Admin role only): the team's month on one page — Region, Epic and Owner filters; tiles for **planned utilization**, **delivery** (Features due this month done), **baseline exceptions** (more than 25% over) and **capacity risk**, against the month before where it applies; **workload and capacity** over 12 months (planned and actual hours against capacity, with a table view); an **exception queue** (over 25% baseline, missing baseline, capacity risk) linking to the items; **delivery health** per Epic for the next six months; and **Generate Monthly Pack** (OVW-01…OVW-08). Data completeness waits for its definition.

## v1.29.0 — 2026-11-06

**New**
- **Add a new activity** can add a **User Story** too: choose User Story, then the Epic and Feature, a title, a description and an optional comment; the story is created under the Feature, assigned to you, in the team's current Sprint, and the comment goes to its Discussion (ACT-08).

**Changed**
- **My Activities** (under Testing): two columns — your activities on the left, **Your monthly update** with **Add a new activity** below it on the right (ACT-02, ACT-07).
- **Add a new activity**: the fields are named **Epic** and **Feature**; only Features in state **Active** or **New** are offered; Epics and Features are listed with their ID, and the chosen ones open in Azure DevOps from their ID. The activities list shows each activity's ID as a link too (ACT-04).

## v1.28.1 — 2026-11-06

**Changed** (My Activities, under Testing)
- **Add a new activity** says what it adds: your month's Time Writing task under the Feature (in your Time Writing story there, created when you have none). Streams are the **Active** Epics only. When you already have the task, its current hours are shown and what you save replaces them — never added up, no second task (ACT-04).
- **Your recent updates** removed from Your monthly update: it ran outside its box (ACT-05).

## v1.28.0 — 2026-11-06

**New**
- **Testing** menu heading, for the Admin role only: pages being tried out before they replace others (ACT-01).
- **My Activities** (under Testing): a person's month on one page, in three cards — **Your activities** (month tasks with planned and actual hours; Features still without a task ticked to add; leave and training in a fold-out list), **Add a new activity** (stream, Feature, hours) and **Your monthly update** (progress ring, next last day to update, suggested missing items, recent updates). Same month-task rules as Bulk actions and Monthly Time Writing (ACT-02…ACT-07).

## v1.27.0 — 2026-11-06

**Changed**
- **Training versus leave**: under the Team Holidays and Training Epic a month Task is training (NPRA) when it or its User Story says "Training" — each person's "<Name> | Training | Time Writing" story — or carries a **Training** or **NPRA** tag; the Feature's title is no longer read, because leave and training share one Feature per person. A Training tag counts as NPRA anywhere (CAP-16, CAP-32; KB-35).
- **Historical hours**: an optional **Tag** column marks training / NPRA rows, so leave and training in the same Feature are told apart (HIS-16).
- **Bulk actions → Create month tasks**: the Leave list becomes **Leave and training** — your leave and training stories, each marked, unticked; training is no longer counted as missing work. A type you have no story for (PTO, Training, Sick Leave, Unplanned Leave) shows "Story + task missing" and creates **<Name> | <Type> | Time Writing** with the month's Task, like a Time Writing story (ATM-24, ATM-27).
- **Month locks**: Settings now says **Last day to update the plan / actuals** — the day entered is still open, the month locks from the next day (behaviour unchanged; MON-21, MON-23).

**Fixed**
- **Customize menu and View as** look tidy: full-width sidebar buttons, the menu listed by group with Pinned / In menu boxes, a stacked View as form, and the banner no longer repeats the role (MYD-07, CON-89; KB-36).

## v1.26.3 — 2026-11-06

**Security / dependencies** (daily check)
- `minimatch` 9.0.9 → 11.0.3 (override `minimatch@9`, used by electron-builder → @electron/universal): fixes the moderate advisory GHSA-g3hv-75wg-m249 (denial of service via globparts amplification). `pnpm audit` is clean.
- Updated within the current ranges: `joi` 18.3.1 → 18.3.2.
- Majors not taken: Electron 45, TypeScript 7, @types/node 26; Playwright stays pinned at 1.56.1.

## v1.26.2 — 2026-11-05

**Fixed**
- **Month locks**: every month now has its own planning and actuals lock dates — by default planning locks after the 5th of the month and actuals after the 4th of the next month (both days set in Settings → Capacity & periods → Period control), and any month can get dates of its own or be locked early, with a reason. The locks are kept with the capacity settings in **Git**, so every computer applies the same ones, and are worked out from the current time (checked every minute), so a new month starts open when the month rolls over. Before, locks were kept only in each browser, a month's actuals lock sat on the next month and the Monthly page checked the time only when opened (MON-06, MON-07, MON-21…MON-24, TC-MON-09, TC-MON-10, KB-34).

## v1.26.1 — 2026-11-05

**Fixed**
- **Historical hours**: changing the cut-off month on the import check now applies at once — moving it from October to November brings the October rows in without uploading again. Before, the later months were dropped while the file was read (HIS-15, TC-HIS-10, KB-33).

## v1.26.0 — 2026-11-05

**Added**
- **View as** (Admins only, sidebar footer → View as…): see the app as a chosen **person** — the menu and pages of their roles, their own My dashboard, Assigned to Me, Monthly Time Writing and personal views — or as a **role** alone. Read only: while it is on, nothing is saved to Azure DevOps or Git (refused before anything is sent); a banner names who you view as, with Change and Exit; it is never stored and a reload ends it (CON-89…CON-92, TC-ACC-04, TC-ACC-05, DF-51, SM-30).
- **Settings → Resources lists everyone**: besides the people with Time Writing Tasks, everyone else Assigned To fetched work, the people of the historical hours (leavers included), the Azure DevOps team members (**Add team members from Azure DevOps**, read only; the PAT needs Project and Team, Read) and people added by name — so region, role and dates can be set for all of them (CAP-29…CAP-31, TC-CAP-07, SM-31).

## v1.25.3 — 2026-11-05

**Fixed**
- **Historical hours**: Epic No and Feature No cells are read as Excel writes them ("37753.0", "#37753", several IDs — the first counts); any other text is listed with its row instead of being ignored, and each stream still needing an Epic says why (Feature No not in the fetched data, or neither column filled) (HIS-14, TC-HIS-09, KB-32).

## v1.25.2 — 2026-11-05

**Fixed**
- **Historical hours**: rows whose person is a group now apply to everyone in it, like a regional holiday Feature — **All** for everyone, **All-BLR**, **All-NL** and **All-US** for everyone in that region (Settings → Resources). Holidays under the Team Holidays and Training Epic count as public holidays, other group rows as reserved common time. Before, "All" rows were dropped and "All-BLR" counted as a person (HIS-13, TC-HIS-08, KB-31).
- **Historical hours** import check: rows left out by design (months from the cut-off on, months without hours) are counted apart from the **rows to check** (no person, no month, an unknown group), which are listed open (HIS-03).

## v1.25.1 — 2026-11-05

**Fixed**
- **Historical hours**: holiday rows of the workbook placed under a regional holiday Feature (by their Feature ID) now count for their own person only. Before, they were added up and the total given to everyone in the region, as a single Azure DevOps holiday booking is. Leave counts as absence and trainings as NPRA under the Team Holidays and Training Epic, as in Azure DevOps (HIS-12, TC-HIS-07, KB-30).

## v1.25.0 — 2026-11-05

**Added**
- **Historical hours** (Settings → Historical hours, roles with Manage shared settings): upload the team's planning workbook once and its **TransformedData** sheet brings the planned (Expected) and recorded (Actual) hours of the months before Time Writing in Azure DevOps into My dashboard, the Team overview, Pulse Check and the Monthly pack — people who have left included, by name. Before the cut-off month (default October 2026) only the history counts and the Azure DevOps Time Writing Tasks of those months are left out (they stay in Azure DevOps, the page shows how many); from the cut-off on, only Azure DevOps. The workbook is uploaded from your computer or read straight from the Git data repository (**From Git storage…**). A **Feature ID** column, when present, places the hours under that Azure DevOps Feature and its Epic (HIS-10, HIS-11). Names are matched to Azure DevOps names (checked and changeable before saving), streams without an Epic No are assigned an Epic, and every row not imported is listed with its reason. Kept in the Git data repository (`history-hours.json`), never in the app's source; nothing is written to Azure DevOps (HIS-01…HIS-11, UR-24, SR-28, UC-27, TC-HIS-01…06, DF-50, SM-29, KB-29).

## v1.24.2 — 2026-11-05

**Fixed**
- **S&S IT Supported releases**: a release now counts in every month in which one of its documents was signed (Last Modified), not only in the month of its newest document. The same applies to the month filter of every Windchill export page, the Quarter / Half-year / Year Pulse Check and the Monthly pack (CON-73, QV-33, KB-28).
- **Pulse Check over a Quarter, Half-year or Year** opens much faster the first time (it works out 24 months): DP and CP figures are read once per data set and picked per month (QV-51, KB-27).

## v1.24.1 — 2026-11-05

**Fixed**
- **Pulse Check** no longer freezes the app when opened: it never fetched, but it rebuilt the CP release tree and re-read the Windchill exports for every month shown on every open. The slow steps are now much faster, and the results are kept per data set and reused until the data changes (QV-51, TC-QV-32, KB-27, DF-49).

## v1.24.0 — 2026-11-05

**Added**
- **Expand all** / **Collapse all** above the sidebar menu: open or close every heading and both Release Details lists at once, remembered in this browser (NAV-37, TC-NAV-37).

**Changed**
- **Customize menu**: the **Pinned** box now sits on the left of each page name (MYD-07, TC-MYD-04).

## v1.23.0 — 2026-11-05

**Changed**
- **Team overview** replaces the Dashboard (Phase 3 of the insights plan): six headline tiles — Utilization, Overload and headroom, Plan accuracy, Plan health, Delivery, Forecast — each opening the tab that explains it; the 21 sections now sit in **Capacity and workload**, **Streams** and **Plan quality**, with a trail back. Same calculations; release counts per stream only on Pulse Check (MYD-10, MYD-11, TC-MYD-05; OV-11 updated, OV-13 retired).
- The tiles and the demand chart can be customized like My dashboard (MYD-06).

**Removed**
- The hidden **Insights workspace** and its code (MYD-12; WSP-01…07, SR-26, UR-22, DF-33 retired; LIM-09 closed).

## v1.22.0 — 2026-11-05

**Added**
- **Your own views** (Phase 2 of the insights plan): **Customize** on My dashboard shows, hides and reorders its sections; **Customize menu** pins pages to the top of the menu and hides others; the Dashboard and Pulse Check remember your period and filters. Kept in Git per person (`personal-views/<email>.json`) so they follow you to every computer; admins can save their layout as the default for everyone (MYD-06…MYD-09, TC-MYD-03, TC-MYD-04, DF-48, SM-28).

## v1.21.0 — 2026-11-05

**Added**
- **My dashboard** for everyone, the page the app opens on: your hours against your capacity, your open work and your streams and releases for the month, each count linking to its detail (MYD-01…MYD-04, TC-MYD-01).
- **Pulse Check periods**: Month, or a calendar Quarter, Half-year or Year compared with the period before — releases per stream (each once), change and work opened and closed (QV-50, TC-QV-31).

**Changed**
- **Team insights** access area: the Dashboard, Pulse Check, PI Review and the Insights workspace are shown by default only to Admin and People Manager; every role keeps My dashboard. Existing access files are updated the same way at the next start; change it per role in Settings → Access (MYD-05, TC-MYD-02, SM-27, DF-47).
- First step of the insights consolidation plan (Phase 1 of 3).

## v1.20.0 — 2026-11-05

**Changed**
- **No "v" before the release number** in the Feature titles the app builds (Create Feature on Release Details and the New Feature form): "DP | RSGMS | 3.0.0.2", CP "Care Pathways | 26.6". Features made earlier with "v" still match their release (BKL-24, TC-BKL-14).

**Added**
- **CP Platform releases**: a CP release container titled "PF1.0 <Name>-<Number>" or "PF2.0 <Name>-<Number>" is read straight from its title — the name with its variant ("PF2.0 Carpo") and the number after the last hyphen, letters allowed ("A12") (QV-49, TC-QV-30).

**Dependencies** (daily check 2026-11-05)
- `oxlint` 1.90.0 → 1.91.0 (build-time). Audit unchanged: one moderate advisory in the desktop packager (KB-16, no patched release).

## v1.19.3 — 2026-11-04

**Changed**
- Daily package update: `@vitejs/plugin-react` 6.1.2 → 6.2.1 (build-time; adds `semver` 7.8.6). No new advisories; the open one is unchanged (KB-16, minimatch in the desktop packager, no patched release).

## v1.19.2 — 2026-11-02

**Changed**
- Git history rewritten to remove work email addresses (KB-26): the addresses in old source files are now `name@company.com` and the commit author is ponkritz. Every commit ID changed; the files of every version are unchanged. Re-clone the repository. The version tags are re-pointed separately by the owner.

## v1.19.1 — 2026-11-02

**Security** (security scan: SM-26)
- Links of work items loaded from backups or Git are kept only when they are https (or empty), never `javascript:` or `data:` (KB-06, TC-STO-04).
- Rich-text fields (Description, Acceptance Criteria, …) are turned into text in one linear pass: a crafted 1 MB field no longer freezes the page (KB-03, TC-QV-12).
- The Excel reader refuses a sheet with cells beyond Excel's limits and caps cells and unpacked bytes, so a crafted upload cannot exhaust the tab (KB-04, TC-QEM-01).
- CI: the GitHub Actions are pinned to commit SHAs, and Dependabot opens weekly update pull requests (KB-08, R-07).
- Back up and clean up: a reset marker is applied once whatever its time, so a wrong clock cannot block a later clean-up (KB-25, TC-CON-56).
- Reported, not changed: two work email addresses in early commit history and one as a commit author (KB-26); the dependency advisory in the desktop packager is unchanged (KB-16); no Content-Security-Policy yet (R-08).

## v1.19.0 — 2026-11-02

**Added**
- **Back up and clean up the connections** (Settings → Storage → Shared setup in Git): download a backup of every connection and its query (no PATs), or back up and remove all of them — the backup is also saved to Git, the shared setup and the on-prem data in Git are emptied, and every other computer removes its old connections at its next start. PATs stay per server; the correct connections are then added again (CON-88, TC-CON-56, DF-46, SM-25).

**Changed**
- **New Feature: the Parent Epic starts blank** every time the form opens (QMS-0025, Assigned to Me, Create Feature on Release Details); choose the Epic from the list (BKL-23, TC-BKL-13).

## v1.18.1 — 2026-11-02

**Fixed**
- Settings → Azure DevOps → Stream mapping: **Edit**, **Set up** and **Add query** open the connection pop-up again. It was rendered only with the Other views section, so it showed there but not on Stream mapping (SET-14, KB-24, TC-SET-06).

## v1.18.0 — 2026-11-02

**Changed**
- More tables on the table design default (Columns, move by drag or ↑ ↓, Wrap text, Comfortable / Compact, one Export with Excel or CSV and real dates): Pulse Check's lists (Ongoing activities, Windchill exports, Supported Releases), the CP report, Baselines, Snapshots, Assigned to Me (its tree kept), Bulk actions' state checks, Monthly Time Writing (fields still editable) and Backlog Health (its own Columns dialog and Export CSV replaced) (UI-13, TC-UI-06).
- Summary tables stay plain, without the table toolbar: the Dashboard, Pulse Check's count tables, the capacity summaries, Insights, the Monthly pack KPI table and Documentation (UI-13).
- Still to come: the QMS-0025 backlog, Settings tables and QE Mapping (LIM-14).

## v1.17.0 — 2026-11-02

**Added**
- **One design default for tables** (Settings → Table defaults, shared, audited): every table built on it can resize columns, move them (drag a heading, or ↑ ↓ in the Columns list), show or hide columns, wrap text, switch Compact / Comfortable, and has **one Export** that offers Excel or CSV. Changing the default changes every such table (UI-07…UI-12, TC-UI-04).
- **Dates in exports are real date-times**: Excel gets dates it can show as a long date and time; CSV gets "yyyy-mm-dd hh:mm:ss" (UI-11, TC-UI-05).

**Changed**
- On the default now: every Release Details query output, the Azure release tables and the Windchill releases / projects, unique locations and raw data. Their old buttons (Export CSV, Export releases CSV, Export locations CSV, Columns, Reset widths) are replaced by the table's own controls. The other tables follow in the next versions (LIM-14).

## v1.16.1 — 2026-11-02

**Changed**
- Release Details pages take less room at the top: Refresh from Azure / Windchill and Import newer export are small icon buttons (↻, ⤒; hover for the name), and Load from Git, Connection settings and Remove are in a ⋯ menu (QV-48, TC-QV-28).

## v1.16.0 — 2026-11-02

**Added**
- **QE Mapping → ＋ Add row** opens a pop-up with a field per column; **Save** adds the row and saves the QE Mapping to Git straight away. The **QE Name** is chosen from the Resources list (Settings → Resources), in the pop-up and when editing a QE Name cell (QEM-12, TC-QEM-09).

**Changed**
- **Release Details pages show the consolidation and the raw data as two tabs** instead of the raw rows at the bottom: DP, CP, IOCC, Content and Tool Validations (Releases / CP report | Query output) and every Windchill export (Releases / Projects | Raw data) (QV-47, TC-QV-27).

## v1.15.0 — 2026-11-02

**Added**
- **Several ECP exports, each with its own setup:** the Windchill import has a **Logic** dropdown (Standard / ECP setup); for ECP, **Project details at** chooses the Location folder holding "Project number Project name" (2nd, 3rd… — type 1 is the 2nd), then you name the export (e.g. "ECP - Type 1"). Each ECP export has its own menu entry (with "＋ ECP export" to add another) and its own line in Pulse Check and the Monthly pack; the logic and folder are saved with the export and can be changed on its page (CON-87, TC-CON-55, DF-44).

## v1.14.1 — 2026-11-02

**Changed**
- ECP's release table and its CSV name the columns **Project No** and **Project Name** instead of Release and Release name (CON-86, TC-CON-54).

## v1.14.0 — 2026-11-02

**Changed**
- **QRE is renamed ECP** (menu, Pulse Check, Monthly pack, Create Feature "ECP | …"); an export imported earlier as "QRE" shows as ECP (CON-83, CON-85).
- ECP reads a Location as "Parent folder/Project number Project name/Phase/…": the release is the **second folder**, shown as "<number> <name>" (e.g. "123456 Patient Monitor"), with every document under it; a leading "/" does not count, and a number that is not "PJ-…" is kept as written, never "v<number>" (CON-83, TC-CON-51).

## v1.13.1 — 2026-11-02

**Fixed**
- The QRE export did not reach the QRE page when its file was not called "QRE…": "＋ QRE" (and "＋ S&S IT") now import the file named after the stream, so it becomes that stream's page, Pulse Check and Monthly pack source (CON-85, TC-CON-53, KB-23).

## v1.13.0 — 2026-11-02

**Changed**
- **QRE**: a release is now the Location folder at index 2 whatever its name, and every document anywhere under it counts to it; a "PJ-<number> <name>" folder is still split into number and name. Folders deeper down are no longer read as projects of their own (CON-83, TC-CON-51).

## v1.12.1 — 2026-11-02

**Fixed**
- Leave in Bulk actions still showed "Choose story" when your leave Feature holds one story of yours per leave type (PTO, Sick Leave, Unplanned Leave): each open story of yours is now its own Leave row ("Your name › PTO"), and ticking it creates that month's Task under that story, never duplicated (ATM-26, TC-ATM-18, KB-22).

## v1.12.0 — 2026-11-02

**Added**
- **QRE** joins the default streams under Release Details → Windchill exports: each release is a project "PJ-<number> <name>" read from the Location path at index 2, otherwise read like S&S IT (month, Pulse Check, Monthly pack, QMS-0025 match, Create Feature "QRE | PJ-1234 Name") (CON-83, TC-CON-51).
- **BRITE** has a place at the root of Release Details, not set up yet (CON-84, TC-CON-52).

**Fixed**
- Leave in Bulk actions showed "Choose story" on a shared leave Feature where everyone keeps a story of the same title: your month Task now goes under your own story there (any title), else a new one of yours — never under a colleague's (ATM-25, TC-ATM-17, KB-21).

## v1.11.0 — 2026-11-02

**Added**
- Bulk actions lists your leave Features (PTO, Sick Leave, Unplanned Leave) in a separate **Leave** list, unticked and never counted as missing; tick the leave you take that month (ATM-24, TC-ATM-16).
- **＋ Time Writing Task** on every Feature and User Story row of the QMS-0025 backlog and of Assigned to Me adds this month's Task for you under that Feature, by the Bulk actions rules (BKL-22, TC-BKL-12).

**Changed**
- The QMS-0025 backlog opens filtered to you (Assigned to me ✕), with the items above and below yours; clear it to see everyone's until the next start (BKL-21, TC-BKL-12).

## v1.10.0 — 2026-11-02

**Changed**
- The Absence Epic is now **Team Holidays and Training** (same ID). Training under it — a Task, Story or Feature titled with "Training", such as each person's *Training - Time Writing* story — counts as NPRA, not absence; PTO, Sick Leave, Unplanned Leave and the common holidays stay absence. Bulk actions and Assigned to Me offer the month Task for your own Training story. Settings names the Epic accordingly (CAP-16, TC-CAP-06).

## v1.9.0 — 2026-11-02

**Fixed**
- The work email was lost after an app update (Force Update): the app read it from the first saved connection instead of the Time Writing one and then saved the empty value back (KB-20).

**Changed**
- Your work email is now a setting of its own: Settings → Azure DevOps → **Your work email**, the first section. It is not part of the Time Writing connection or the stream mapping, and updates, Git syncs and connection edits do not change it; the Time Writing connection form no longer asks for it. On the first start the email already on your Time Writing connection is taken over (CON-82, TC-CON-50; DFMEA DF-43; SECURITY-ASSESSMENT SM-22).

## v1.8.0 — 2026-11-02

**Changed**
- Time Writing prompts in Bulk actions and Assigned to Me now cover every Feature where you have a User Story in your name — in any state but Removed, your own Time Writing story included — as well as the Features assigned to you; before, only open stories that were not Time Writing stories counted, so Features shared with a colleague could be missed. On a shared Feature, each person's month Task goes under their own Time Writing story, never under the other person's (ATM-23, TC-ATM-15).

## v1.7.0 — 2026-11-02

**Changed**
- Settings is now its own menu group with one page per area (Azure DevOps, Storage, Access, Feature setup, and for shared roles Capacity & periods, Resources, Master data, Monthly pack, Audit) instead of tabs on one page; the header names the page. Long pages are split into sections shown one at a time — Azure DevOps: Servers and PATs, Stream mapping, Other views, Read-only sources, Synthetic sample; Storage: Git storage, Load from Git, Shared setup in Git, SharePoint; Capacity & periods: Capacity and absence, Holidays and common activities, Period control. The last page and section are remembered, and Get started and the menu's ＋ entries open the section they are about (SET-14, NAV-17, TC-SET-06; NAV-04 retired).

## v1.6.0 — 2026-11-02

**Added**
- Successor and Predecessor IDs: work items read from Azure DevOps keep the IDs of their Successor and Predecessor links (Dependency link type). A view of its own — a connection that is not a stream or a stream's data set, such as an on-prem release query — shows them as **Successor ID** and **Predecessor ID** columns, sortable, searchable and in the CSV. Stream views are unchanged (CON-81, TC-CON-49).

## v1.5.1 — 2026-11-02

**Fixed**
- New users got the admin's work email pre-filled on their Time Writing connection, and with it the admin's access role and "my" work (KB-19). The work email is now personal: it is never written to the shared connection setup in Git, an email in an older file is ignored, a sync keeps the email entered on the computer, and an email inherited from the file is cleared once so each user enters their own (CON-80, TC-CON-48; DFMEA DF-43; SECURITY-ASSESSMENT SM-22).

## v1.5.0 — 2026-11-02

**Added**
- Create Feature on every stream: the IOCC, Content and Tool Validations release tables now end with the same **QMS-0025 match** column as DP, CP and S&S IT — the matched Feature / User Story, else the closest item and **Create Feature** on every release without a Feature, titled "{stream} | {release name} | v{release}" (QV-46, TC-QV-26). Before, these streams offered it only on releases that were not tracked or matched below the threshold.

**Changed**
- The Time Writing Feature column of those tables keeps its match and hours but no longer has its own Create Feature button (one per release, in the new column).

## v1.4.2 — 2026-11-02

**Changed**
- Daily package update: Electron 44.10.0 → 44.10.1 (desktop runtime, patch release); tslib no longer needed in the lockfile. SWBOM regenerated (CI-08).

**Security**
- `pnpm audit`: 1 moderate finding before and after — GHSA-g3hv-75wg-m249 in the build-time minimatch 3.x, 5.x and 9.x copies of electron-builder, which have no patched release in their lines (accepted, KB-16); not shipped. Secret scan of tracked files and history: clean.

## v1.4.1 — 2026-11-01

**Changed**
- Pulse Check: the DP **Supported Releases** list under the release quadrants is folded by default, showing only its title and count; **Show list** opens it when needed and the app remembers the choice per viewer (QV-32, TC-QV-17).

## v1.4.0 — 2026-11-01

**Added**
- Automatic tagging: every merge to main that passes the Windows, macOS and end-to-end builds is tagged `vX.Y.Z` by CI and gets its own GitHub release with both installers, their checksums and its entry from these release notes; nobody tags by hand (CI-10, `scripts/release-entry.mjs`).

**Changed**
- CONFIGURATION-MANAGEMENT.md §2, §4, §5 and §7, README and CLAUDE.md: tagging is done by CI, not after the merge by hand.

**Known issues**
- v1.3.0 (commit `503232d`) has no tag: it was merged before tagging was automatic, and the tag could not be pushed from the development session (LIM-13).

## v1.3.0 — 2026-11-01

**Added**
- Release notes with a version history, and a configuration management plan ([CONFIGURATION-MANAGEMENT.md](CONFIGURATION-MANAGEMENT.md)); every merged change now bumps the version and adds its entry here (CI-09).
- The stream mapping set by an admin in the shared setup in Git (DP, CP, IOCC, Content, Tool Validations and DP's data sets) is enforced for every user at their next start; an admin's change is saved to Git on every Save or Set up, with **Save stream mapping to Git** to write it again (CON-79, #178).

**Changed**
- DEVELOPMENT-PROCESS.md §8 (configuration management) now points to the configuration management plan; CLAUDE.md asks for the version bump and the release-notes entry in every pull request.

## Before v1.3.0 — 17 October to 1 November 2026

Versions 1.0.0 (17 October 2026) to 1.2.2 were released without individual notes; their changes are in the Git history and the merged pull requests up to #177. The main features of that period:

- **Planning and time writing:** Monthly Time Writing with planning and actuals locks, ad-hoc tagging after the planning lock, Assigned to Me, Bulk actions (month Tasks up to the Target date, move to the current Sprint, state checks), shared-activity month Tasks, New Feature / New User Story / Edit work item forms with Discussion, background jobs.
- **Capacity and insights:** capacity model with joining and leaving dates, Dashboard, Pulse Check, Monthly pack (.pptx in the team template), Backlog Health.
- **Release details:** DP from its own query with DDT month counts and the QMS-0025 match; IOCC, Tool Validations and Windchill (S&S IT) release counting; CP release reporting from QA/QE signatures in the release-folder tree query; tree and direct-links queries; Create Feature from every release view.
- **Settings and sharing:** servers with one PAT each, stream mapping, access roles, Feature setup per Epic, shared setup in Git, QE Mapping.
- **Validation Package:** three-level requirements, generated traceability matrix, test, UAT and verification plans, DFMEA, security assessment, known issues, software components and SWBOM, development process, E2E suite, daily dependency and secret check.
