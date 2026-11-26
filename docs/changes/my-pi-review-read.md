---
bump: patch
---
**Fixed**
- **My PI Review shows the Discussions it read** — when the shared "PI Review starts from" date came from Git while the page was reading (as on every start of the app), an older read answering last overwrote the new one, so a review could show as Not reviewed (Review… instead of Edit review…) until a reload. Only the read with the date in use is kept now, on every PI Review page; a Discussion that could not be read, or whose read has not answered after 90 s, shows **Not read** with **Retry** (PIR-63, PIR-17, PIR-33; KB-140).

DF-535, DF-536, LIM-220; TC-PIR-62, TC-PIR-63.
