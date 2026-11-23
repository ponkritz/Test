---
bump: minor
---
**Changed**
- **Newer data in Git is shown per page** — when someone else saves a shared file while the app is open, a warning appears only on the page in use whose data changed (e.g. a new CoNQ row on CoNQ, a dashboard charting CoNQ and Admin → Pages & menu — not on Home), naming what changed, who saved it and when; **Load the newer data** reads only that page's data again without reloading the app, and asks first when it would drop a row being edited, a pop-up, a draft or unsaved planning changes. Changes to other pages wait until they are opened; the menu layout and the views are refreshed quietly; the notice is never a Background jobs entry (GIT-18, GIT-20, KPT-05; GIT-15 retired).
- **Unique page names** — a page name cannot be one another page in the menu already has (any group, a built-in or Admin page, a release stream), ignoring case, spaces and full-width forms; Add page, Edit and Rename page show the clash at the name field with Save disabled. Pages that got the same name at the same moment are kept, shown with their group in the menu and listed on Pages & menu (PGB-15, PGB-16, PGB-17).
- **Co-owners from a list** — page and group co-owners are picked from a searchable list of the people the app knows instead of typing emails; co-owners not in the list stay, marked "not in Azure DevOps"; the Add page pop-up points to custom streams for a Release page (PGB-18).
- **UI standards §4a Drawers** approved by the product owner; LIM-24 accepted.

**Fixed**
- **"Newer data in Git" for your own saves** — the banner no longer appears after your own saves (a read or listing that still had the version before your save, or a check during the save, counted it as someone else's), and a save in another window of your browser says so (GIT-19, KB-82).

DF-173…DF-177, SM-105, LIM-25, LIM-26; TC-GIT-11, TC-GIT-12, TC-PGB-12, TC-PGB-13, TC-PGB-14.
