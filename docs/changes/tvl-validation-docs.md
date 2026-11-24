---
bump: minor
---
**Changed**
- **Tool Validations, Azure tab: Validation Documents** (TVL-31, TVL-22, TVL-21) — the Signed documents query's table is now **Validation Documents**: one row per document, **including the documents whose Parent is not a tool of the Tools query** (e.g. a retired tool), which used to sit in a separate "Not linked to a tool" table (removed). It starts with **Tool** — the Parent's name: the tool's name and version from the Tools query, else the Parent's title read from Azure DevOps by its ID —, **Parent ID** and **Tool List (Azure)** (*Listed* or **Not in Tool List (Azure)**). Those documents are listed, **not counted** and not added to the master list; ⓘ What was counted and the table's ⓘ say so. Read from the product owner's "Name it as Validation Documents. And it should take the name of the parent Name" and "keep them in the Validation Docs, but don't do anything to the master list".
- **Parent names read by ID, read only** (TVL-31) — when **↻** on the Tool Validations page fetches the two queries, the titles of those Parents are read with the same batch read as the queries' rows, on the Signed documents connection (its server and PAT; on-premises servers stay read only), and kept with the fetched documents, so they survive a reload and the fetch at start. A name that cannot be read shows as **#ID** with the reason in the cell's tooltip and the table's ⓘ; the table never waits for it.
- **Tool List (Azure)** (TVL-31) — the Tools query's table (formerly "Source data · Tools query") — and Validation Documents show **every column the query selects, in the query's SELECT order**, none hidden by default (hide some with Columns). The month's table keeps its title **Releases**.

DF-294, SM-172, LIM-79; TC-TVL-28, TC-TVL-18 (UAT).
