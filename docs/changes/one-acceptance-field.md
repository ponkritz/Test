---
bump: minor
---
**Changed**
- **One acceptance field in New Feature** — the New Feature form (also from My Tasks [Board] and Create Feature on a DP release row) has one acceptance field, **Acceptance Criteria (Feature DoD) — required**, saved at the top of the Description as "Feature DoD: …" as before. The optional **Acceptance criteria** is gone: the fold under the DoD is now **Description (optional)**, and a new Feature no longer writes the Azure DevOps Acceptance Criteria field — the web app and the desktop app refuse it before anything is sent. A new User Story and Edit of an existing work item keep their Acceptance criteria (BKL-53).

DF-500, SM-295, LIM-180, LIM-190; TC-BKL-42.
