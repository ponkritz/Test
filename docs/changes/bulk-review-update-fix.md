---
bump: patch
---
**Fixed**
- **Update review for N… with a comment already in place** — My PI Review's Update review for N… now reads the ticked Features' Discussions again before the pop-up opens ("Reading N Discussions…"), so a review written or deleted in Azure DevOps after the page read them is replaced or posted as Azure DevOps holds it, instead of failing with "It has your review of this PI now" or "no longer in its Discussion". One comparison finds my review of the PI for the pop-up and the job ("PI 26.4" and "PI 2026.4" alike; an older comment without the heading still gets a new headed comment). A review changed while the pop-up is open still fails safely, and its reason says what to do: tick it again and use Update review… (PIR-80, KB-155).

KB-155; DF-555; TC-PIR-80.
