---
bump: major
---
**Removed**
- **QE Mapping page and its data** — at the product owner's request ("Remove QE Mapping. Re-map it to Resource Mapping.") the QE Mapping page is gone: no menu entry under Data & governance, no Home tile, nothing in the search, no Replace… on it and no area in Role rights. A pin or page count kept from an earlier version is left out (NAV-54). An older `access.json` that lists the QE Mapping area or its action is still read; the keys are ignored (CON-117). A My dashboard block over the QE Mapping stays, says "This block’s data source (QE Mapping) was removed." and offers **Remove block…** (MYD-30). QEM-01…QEM-13, MYD-19, UC-23, UR-18 and SR-22 are retired.

**Changed**
- **The QE comes from an On-Demand page** — DP and IOCC bulk **Create Features** and the DP table's **QE** column take each release's QE from an On-Demand Table page with the same matching as before. In Setup per Epic the DP and IOCC bulk Epics have **QE from page** (the page named Resource Mapping is preselected as the default), **Column with the Platform / Product** and **Column with the QE** (Text, Dropdown or a built-in list's display name), saved by column id. A setup that still names the old QE Mapping columns is kept for older versions and says to choose them again on the page; nothing is guessed (DPF-02, DPF-04, DPF-06, EPS-09).

**Added**
- **Delete qe-mapping.json from Git (Tool Owner, once)** — while the file is in the Git data repository, Admin → Data & sharing → Shared setup in Git shows "qe-mapping.json is no longer used by the app — Delete it from Git": **Download a copy**, then **Delete it from Git…** and a confirmation pop-up (which names any bulk Epic still on the old QE Mapping columns) make one commit that deletes only that file, at the version downloaded. Only the Tool Owner; not in View as, with the synthetic sample or with a read-only token. Its history stays in GitHub (GIT-28).

**Note:** older app versions keep their QE prefill from the old QE Mapping columns until the file is deleted; then they find no file and offer an empty mapping (LIM-130).

DF-360, DF-361, DF-362 (DF-25, DF-95, DF-96, DF-110, DF-260, DF-301 updated); R-40, SM-210, SM-211; LIM-130; TC-NAV-54, TC-CON-73, TC-GIT-23, TC-MYD-15, TC-DPF-02, TC-EPS-07.
