---
bump: minor
---
**Changed**
- **Acceptance Criteria (Feature DoD)** — the Feature's Definition of Done is now labelled *Acceptance Criteria (Feature DoD)* in the New Feature form (section 2 and its required field), the Edit form of a Feature, Setup per Epic, Admin → Overview and the messages. Only the label changed: the Description in Azure DevOps still starts "Feature DoD: …", and the Feature setup files are unchanged (BKL-51).

**Added**
- **Priority in New Feature** — section 1 of the New Feature form has a Priority drop-down (1–4, default 2). The value is sent as the Feature's Azure DevOps Priority field (Microsoft.VSTS.Common.Priority) and checked after the Feature is created. Bulk Create Features does not set it (BKL-52).

DF-490, DF-491, SM-285, LIM-180, LIM-181; TC-BKL-40, TC-BKL-41.
