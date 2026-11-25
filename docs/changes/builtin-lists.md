---
bump: minor
---
**Added**
- **Built-in lists: the QE list from Azure DevOps** — a team list holds the members of an Azure DevOps team (display names and Azure DevOps identity ids — no emails), shared in Git as shared-lists.json (queued and merged, read strictly, newer data loaded quietly) and managed in Admin → Epic & Feature setup → Value lists → Team lists from Azure DevOps: ＋ New list… reads the team, ↻ Refresh… reads it again with your own PAT (read only, nothing written to Azure DevOps) and shows who is added, removed and renamed before Save to Git, and every list keeps a log (LST-01…LST-07, LST-13, LST-14).
- **Column types "Dropdown (built-in list)" and "Multi-select (built-in list)"** — an On-Demand column takes its choices from a team list or a Value list; a row keeps the name and, for a person, the Azure DevOps identity id as a stable key, so a renamed person keeps their rows; two people with the same name stay two, shown as "Name (#3f2a)" and a person who left is kept and marked "not in the list". Filters, Insights, Replace… and the bulk upload's Excel template follow the list as it is now (LST-08…LST-11, LST-15, OND-05).
- **New permission "Manage built-in lists"** (permissions 9) for Tool Owner, Admin and Scrum Master; co-owners of On-Demand pages create and refresh lists too; everyone else sees them read only with the reason (CON-115, LST-12).

DF-329, DF-330, DF-331, SM-188, SM-189, R-24, LIM-105, LIM-106; TC-LST-01…TC-LST-11.
