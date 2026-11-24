---
bump: minor
---
**Changed**
- **Tool Validations: 24 months by default** — a tool with a validation date but no validity period and no due date is now taken as valid for **24 months** (2 years): its due date is the validation date + 24 months, shown as "validation date + 24 months (default)", and its period as **"24 (default)"** on the Expiry list, the Master list and each source's tab; such a tool is now **Overdue**, **Due soon** or later instead of "No due date" (TVL-06, TVL-08, TVL-10). An explicit validity period or due date, from a source or entered by hand, still wins; the default is applied when the list is read and never written to `tool-validations.json`. The Add / Edit tool pop-up says "Leave empty for 24 months (default)" and previews the due date with it.
- **Source tabs** — the Due date column of a source's tab now shows the due date the master list works out (with where it comes from), as the Expiry list and the Master list do (TVL-06).
- **Dashboard sources** — `tools:master` and `tools:expiry` follow the new due date (Due date, Due date from, Status, Days left); Validity (months) gives 24 for a tool whose due date uses the default, and stays empty for a tool with no period and an explicit due date or no dates (TVL-18).

DF-264; TC-TVL-03, TC-TVL-20.
- **Tool Validations two queries: every signed document counts** (TVL-21, LIM-72). Confirmed by the product owner: every document the Signed documents query returns is counted, whatever its work item type. Unlike CP, which counts only Artifacts and Documents.
