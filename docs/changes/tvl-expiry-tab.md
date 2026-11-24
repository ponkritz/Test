---
bump: minor
---
**Changed**
- **Tool Validations: the Expiry list tab first, the Master list on its own** — the page's tabs are now Expiry list · Master list · Azure · one tab per source · Setup. **Expiry list** (opens first) shows the Overdue / Due in the next N days / No due date tiles on top, then the window "Expiring in the next N days" and the expiry table; **Master list** shows only the master list with ＋ Add tool…, its filters and Export. A remembered Validation expiry tab, an unknown one or a removed source's tab opens the Expiry list (TVL-08, TVL-10, TVL-14).

**Added**
- **Set the team default on the Expiry list** — next to "Use the team default", **Set {N} days as team default** saves the window shown as the team default to Git, as Setup → Team settings does; only the Tool Owner and the list's co-owners, for everyone else disabled with the reason (TVL-09, TVL-11).

DF-275; TC-TVL-03, TC-TVL-05, TC-TVL-07, TC-TVL-09, TC-QV-43.
