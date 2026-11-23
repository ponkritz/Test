---
bump: minor
---
**Added**
- **Page builder: Pages & menu** — a Tool Owner adds pages of their own without a release of the app: **＋ Add page** (from Admin → Pages & menu, ⋯ on a menu group or a page) asks for the page type (**Table** or **Table + Insights**), name, description, icon and menu group — any group that accepts added pages, or a **new group** — and creates the page in Git at once. Pages are edited (name, type, icon, group, co-owners), reordered and removed (asking first); groups of your own are added, renamed, reordered and removed when empty; built-in groups are configured (accepts added pages, co-owners). The menu, Home and the top bar follow the layout, saved in Git as `menu-layout.json` with queued, merged saves; Customize menu pins and hides added pages (PGB-01…PGB-07, PGB-12, PGB-14).
- **Co-owners of groups and pages** — a group co-owner runs the pages of their group (add, rename, reorder, remove, name page co-owners, set up, edit rows) but not the group; a page co-owner sets up the page and edits its rows. Everything else is disabled with the reason (PGB-08…PGB-11).
- **Permission "Manage pages and menu groups (Tool Owner)"** (permissions 5): Tool Owner only by default and for an access.json saved before (CON-106).

**Changed**
- CoNQ and the On-Demand pages from before are **Table + Insights** pages in On-Demand, unchanged in Git (PGB-13); ＋ Add page… on a page opens the new Add page pop-up (OND-10).

DF-158, DF-159, SM-100, LIM-21; TC-PGB-01…11.
