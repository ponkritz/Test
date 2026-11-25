---
bump: minor
---
**Added**
- **Replace… on QE Mapping** — when a QE leaves and their releases go to one person, **Replace…** in the QE Mapping toolbar replaces one value of a column with another in every row of the tab: pick the Column (the QE column of the Feature setup is chosen for you), Find (the column's values with their row counts, or one typed) and Replace with; the preview says "N rows will change" with the first rows (old → new), and **Replace** saves the QE Mapping to Git at once, the commit naming the change. A cell matches only as a whole, ignoring case and the spaces around it (QEM-13).
- **Replace… on On-Demand table pages** — the same pop-up in the ⋯ menu of CoNQ and every Table and Table + Insights page, for Text, Long text, Dropdown (its options only) and Multi-select columns (OND-100). Saved at once through the queued, merged save (a page of row files: every changed row file in one commit), its result in Background jobs; every changed row gets a History entry "Replaced “X” with “Y” in {column}"; hidden rows are not changed and rows someone else is editing are skipped and counted (OND-101, OND-21).
- **Rights** — Replace… needs the right to edit the page (the QE Mapping, or the page's rows) and is greyed out with the reason without Git storage that can save, with the sample, while viewing as someone else or without the right (OND-102, QEM-13).

DF-301, DF-302; LIM-88; TC-QEM-10, TC-OND-98.
