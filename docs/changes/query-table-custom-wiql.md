---
bump: minor
---
**Added**
- **Custom query (WIQL) for Table (Query) pages** — ＋ Add page… and Tool Validations ＋ Add tab… offer **Query: Saved query | Custom query (WIQL)** (Saved query first, as before). A custom query is a connection the app knows, the WIQL pasted from Azure DevOps (Edit query → WIQL — a flat list or a tree / direct-links query, checked with the same rules and messages as a stream connection's query) and a name; **Test query** runs it read only with your own PAT and shows the number of work items and the columns in the form (PGB-28, PGB-23, CON-78).
- **Stored as the query only** — the page file keeps `source.wiql` with the name, server, project and WIQL text (exactly one of a saved query and a custom query; the text capped at the stream queries' 50,000 characters), never a PAT or rows; a malformed one shows the page read only with the reason (PGB-29, PGB-27; LIM-266).
- **Read live like the stream queries** — each viewer reads the custom query with their own PAT through the stream queries' read-only WIQL runner; columns and their order come from its SELECT and ORDER BY; search, sort, Columns, Export, Group by / Filter by column and Insights work as for a saved query; without a PAT the page says why (PGB-30, PGB-24; LIM-267, LIM-268).
- **Change query…** — the page's owners change the query of a Table (Query) page from its ⋯ menu (saved ↔ custom, or edit the WIQL); the table's source stays fixed (PGB-31, PGB-26; LIM-269).

DF-600…DF-605, SM-375…SM-379; TC-PGB-21…TC-PGB-23.
