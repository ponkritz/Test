---
bump: minor
---
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
