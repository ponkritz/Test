---
bump: minor
---
**Added**
- **Tool Validations: highlight tools by due date** — the **Master list** and the **Expiry list** tint each tool's row in the colour of its due date band, with the band named in the Due date cell ("≤ 30 days", "Overdue / today") and a legend above the table, so it is not shown by colour alone; an overdue tool is in the band with the fewest days, the narrowest band wins, a tool whose due date is the 24-month default (validation date + 24 months) is highlighted by that date, a tool without a due date is not (TVL-28, TVL-06).
- **Setup → Due date highlights** — the Tool Owner and the list's co-owners set the team's bands, as many as needed (up to 10): each a number of days (0 = overdue or due today) and a colour from a fixed palette of eight named tints for light and dark mode, with ＋ Add band, Remove and the tools in each band, saved to Git in `tool-validations.json` (`highlights`, validated strictly, merged as one value); until saved the defaults apply — overdue red, 30 days amber, 90 days yellow — and removing every band turns the highlighting off; read only with the reason for everyone else (TVL-27, TVL-02, TVL-14).

DF-291, SM-169, LIM-76; TC-TVL-24, TC-TVL-25.
