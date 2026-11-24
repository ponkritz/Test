---
bump: minor
---
**Changed**
- **People & roles → People is a read-only list** — the shared table (search, sort, columns, Export) with Person, Email, Access (roles as tags), Region, Role (People manager tag), Reports to and **Status** ("Active since …", "Left on …", "Not part of the team", "Not in Azure DevOps"); filters Region, Role, Access role and Status (Active and Left at first). The separate "Not in Azure DevOps" and "Removed people" lists are gone: those people are one Status click away (CAP-58, CAP-29, CAP-33).
- **A drawer to edit a person** — click a row (or Enter): view first, then **Edit** for app access roles, region, role, People manager, reports to (or Other (type a name)…) and the dates; **Save** saves the profile with the planning data and the roles to access.json, each result in Background jobs; unsaved changes ask before closing. **Mark as left…**, **Not part of the team** (both can remove the app access too) and **Restore** replace the Remove row form (CAP-59; CAP-48 retired).
- **Bulk edit** — tick people for "n selected · Set region… · Set role… · Set access role… · Clear selection", each saved in one go; the shared table gained a reusable selection column (CAP-60).
- **Fewer boxes** — the names source and ↻ Read the team again are one line with ⓘ; the warnings are one folded line; Default Time tracking started is in the page's ⋯ menu; the month's capacity and regional holidays notices moved to **Capacity & time → Capacity and absence** (CAP-61, CAP-34, CAP-15). The reporting lines are the **Team tree** tab (CAP-62).

**Fixed**
- Escape in an open multi-select inside a drawer no longer closes the drawer as well (KB-87).

**Decisions recorded**
- Two computers publishing the same standalone HTML file on a schedule overwrite each other — accepted (LIM-44); commit messages keep `[by Name <work email>]` — accepted, email kept (LIM-37, GIT-22, SM-113).

DF-224, DF-225, SM-124, LIM-45, KB-87; TC-CAP-30, TC-CAP-31, TC-CAP-32, TC-CAP-33, TC-CAP-34.
- A person with a leaving date still to come stays **Active** until that date ("Active since … · leaves on …") (CAP-58).
