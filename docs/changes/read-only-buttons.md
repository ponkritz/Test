---
bump: minor
---
**Changed**
- **Write buttons greyed out with the reason** — before the access roles are loaded (read-only, CON-101), or when your role lacks the action, every button that changes Azure DevOps is disabled instead of opening a form whose send is refused at the end: ＋ New Feature, ＋ Feature, ＋ User Story, ＋ Task, ＋ Time Writing Task, Complete children and Edit on the QMS-0025 board and My Tasks [Board]; Close and Set … to Active; Save, Close and ＋ Add a new activity on Time Writing; Move and the state buttons on Sprint check; Add comment in the Edit form; Create Feature and bulk Create Features on the release pages. A visible line next to the button (once above a table of row buttons) says why — "Read only: the access roles are not loaded yet …" or which permission the role lacks. Nothing changes for people who hold the action; the check before sending stays (CON-102).

DF-139, SM-93; TC-CON-64.
