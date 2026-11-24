---
bump: minor
---
**Changed**
- **No built-in bulk creation Epics** — the Epic IDs built into the app for bulk Create Features (DP #13946, Content #22919) are gone. DP, IOCC and Content create their Features only under the Epic mapped in **Admin → Stream options → Bulk creation Epics**: your own (this browser) or else the shared one (Git). A stream with neither shows **not set** there; its **Create Features** is disabled with "No DP bulk creation Epic is set: map it in Admin → Stream options → Bulk creation Epics." and an **Open Bulk creation Epics** button; Admin → Overview lists "DP bulk creation Epic is not set" (and IOCC, Content) as it did for IOCC. The Feature setup editor shows the release type sets for the DP and IOCC bulk Epics as mapped (QV-59, DPF-02, DPF-04, CNB-01, ADM-05).
- **What to do** — a shared mapping already saved to Git keeps working; nothing changes for that team. A team that relied on the built-in Epics sees "not set" after the update: the **Tool Owner** (or a role with the right *Stream options*) opens Admin → Stream options → Bulk creation Epics, enters the DP Epic ID (the former built-in was 13946) and the Content Epic ID (the former 22919) under **Shared**, clicks **Save** on each row, then **Save to Git**. Everyone else does nothing (or enters their own Epic under **Mine**); the Feature setups of those Epics are unchanged.

DF-110, DF-280, SM-161; TC-QV-40, TC-ADM-03, TC-DPF-04, TC-CNB-01.
