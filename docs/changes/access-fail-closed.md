---
bump: major
---
**Changed**
- **Read-only until the access roles are loaded** — access now fails closed: until a roles file (`access.json` from Git storage, or the copy kept in this browser from an earlier read) is loaded, everyone is read-only: every page is in the menu, but nothing can be changed and changes to Azure DevOps are refused before they are sent. A notice at the top of every page says so and what to do (connect Git storage). Before, without `access.json` (or while it was loading, or when it could not be read) everyone could do everything. When Git storage is connected and has no `access.json` yet, the viewer may only set up the first roles file (Set up roles), keeping Manage access for themselves (CON-101, CON-43; design defaults review, decision 2).

**Fixed**
- Access no longer fails open on a new browser while `access.json` loads or when it cannot be read; the Azure DevOps write guard starts closed (KB-71).

DF-139, SM-93; TC-CON-63.
