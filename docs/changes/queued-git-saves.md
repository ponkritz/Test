---
bump: minor
---
**Changed**
- **Two people saving the same shared file both keep their change** — saves to the historical hours, the default views, the KPI tracker copy, the connection backups and the Monthly pack template are queued in the order of their time (to the second) and saved as their own commits (`[saved <time>]` in the message). Before each save the file is read again from Git and the change is merged into the latest version by row, page, sheet or connection; where both changed the same entry, the later save wins. "Saved to Git — merged with a change by someone else" and "Waiting to save (N in queue)" show where the save happens; after 3 conflicting tries the change stays in the queue with Retry. The PowerPoint template cannot be merged: the later save wins and an older one is never written. Access, Epic / Feature setup, QE Mapping, the Monthly pack setup and the planning data still refuse a conflict (GIT-17, HIS-04, MYD-09, KPT-03, CON-88, PCK-08; design defaults review, decision 8).

KB-73, DF-141, SM-95; TC-GIT-10.
