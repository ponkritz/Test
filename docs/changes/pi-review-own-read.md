---
bump: minor
---
**Changed**
- **PI Review reads your own Features' Discussions when it opens** (product owner, 25 Nov 2026: "Should the PI Review page read your own Features' Discussions when it opens, so Edit review… shows straight away?" — "Yes") — when PI Review opens, and when you choose another PI, the Discussions of the Features assigned to you in that PI (by your work email, else your name, as My PI Review) are read the same way My PI Review reads them (3 at a time, slowing down when Azure DevOps asks, only comments from "PI Review starts from"), so **Edit review…** shows on your reviewed Features without opening them; the table's status line says "Reading your n Features’ Discussions…" meanwhile. Other people's Features are still read only in the drawer or with ↻ Read all Discussions; nothing is read by itself with the synthetic sample, without a PAT or in View as. A Discussion is read once per page load: the drawer, Read all Discussions and Write review… reuse a read done or in progress (PIR-35, PIR-34, PIR-17).

DF-337; SM-194; LIM-113; TC-PIR-37.
