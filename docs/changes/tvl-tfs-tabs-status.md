---
bump: minor
---
**Changed**
- **Tool Validations: Tool List [TFS] and Validation Documents [TFS] tabs** — the Azure tab gives way to two tabs after Master list, each with one table of its query's rows and every column in SELECT order: **Tool List [TFS]** (the Tools query) and **Validation Documents [TFS]** (with two queries: every document with Tool, Parent ID and Tool List (Azure), retired Parents read by ID). The **Releases** table is removed, and with it Show: {month} / All months on this page; with one query only Tool List [TFS] is shown. A tab remembered as Azure opens Tool List [TFS] (TVL-14, TVL-31).
- **Tool Validations counts from the master list** — the Master list cards (Validations in {Month}, Completed validations, Supported validations), Pulse Check, the Monthly pack and the cumulative chart count the master list's tools by their Current Month Status, with one shared rule; Pulse Check's Tool Validations quadrant lists those tools with name, version, ID and status (TVL-22, TVL-36).

**Added**
- **Master list: ID, Used by, Validated and Type** — from the Tool List [TFS] query: the work item ID and its Source, State and Type columns, guessed by column name and editable in Setup → Edit mapping…, kept in tool-validations.json and locked like the other Azure DevOps values (TVL-34).
- **Master list: Current Month Status** — Completed (completion date in the header month), Supported (a document with a Quality signature in the month) or Completed, Supported as two pills, else blank; also on the Expiry list, sortable, filterable and exported (TVL-35).

DF-296, DF-297, SM-174, LIM-81, LIM-82; TC-TVL-32, TC-TVL-33, TC-TVL-09, TC-TVL-18, TC-TVL-28, TC-QV-43. A deliberate exception to UI-STANDARDS §10 (1) and (3): the Tool Validations page has no Releases table and no Show.
