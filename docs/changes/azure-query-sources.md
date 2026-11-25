---
bump: minor
---
**Added**
- **Azure DevOps queries as data sources** — a dashboard block can read the queries the app already reads, with all their columns as fields: each Release Details stream's query, the Tool Validations Tool List and Validation Documents queries and your own My views, from the fetched data (DSH-17; on My dashboard too, MYD-26). Rights follow their pages: Release Details for the streams and Tool Validations, a My view its owner only (DSH-23).
- **＋ Add Azure query…** — a Dashboard page's builders add any other saved query, picked from a connection's project or by its address on a server the app already reads; only the reference (server, project, query id, name) is saved in the dashboard's file in Git, never a PAT or rows; **Remove Azure query…**, and Copy to… takes it along (DSH-18).
- Each viewer reads a saved query **with their own PAT** when the dashboard opens, reads only (the query by id, the field list, the work items in batches); **↻ Refresh Azure queries** reads it again, no polling; a viewer without a PAT or access sees the reason (DSH-19, DSH-22, DSH-23).
- Azure DevOps field types become chart types — numbers, dates, picklists and people as Dropdown-like fields (people by display name, never an email), Tags as Multi-select (DSH-20); at most 5,000 rows and 30 columns, a capped source marked on the block, in ⓘ and in every export (DSH-21).

DF-350…DF-353, SM-200…SM-202, R-33, LIM-120, LIM-121; TC-DSH-17…TC-DSH-23, TC-MYD-11.
