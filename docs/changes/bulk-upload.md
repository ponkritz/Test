---
bump: minor
---
**Added**
- **Download Excel template… on On-Demand table pages** — the page's ⋯ menu on CoNQ and every Table and Table + Insights page gives an Excel file of the page, with the rows shown (their Row IDs, to change them) or empty (to add rows): one sheet named after the page, Row ID first, the columns in order, required columns highlighted (OND-103), with Excel data validation — drop-down lists for Dropdown and Multi-select columns (long lists on a hidden "Lists" sheet), date and number checks, text lengths and an input message per column; in a Multi-select several values are typed separated by ";" (OND-104).
- **Upload Excel… — add and update rows in one go** — the filled template (.xlsx or CSV) is read in the browser and matched by column name; rows with a Row ID update that row, rows without one are added, a Row ID not on the page is an error "Row not found". The preview shows "N added · N updated · N unchanged · N with errors", the ignored and missing columns and the first rows with their changes or errors, with an error report (CSV) (OND-105).
- **Save to Git** saves only the valid rows as one change (one commit on a page of row files), each added or updated row with a History entry "Bulk upload from {file}"; rows someone else is editing are skipped and counted, hidden rows can be updated by their ID; the result is in Background jobs (OND-106, OND-21).
- **Rights and limits** — Upload Excel… needs the right to edit the page's rows and is greyed out with the reason without Git storage that can save, in Sample, with View as or without the right; at most 10 MB, 5,000 rows read and 2,000 rows added or updated per upload (OND-107). Text starting with = + - @ is stored with an apostrophe first, so it never runs as a formula (OND-108).

DF-307, DF-308; SM-179; LIM-92; TC-OND-99, TC-OND-100, TC-OND-101, TC-OND-102.
