---
bump: patch
---
**Fixed**
- **Other views no longer change the shared stream mapping without the Tool Owner right** — Use as Time Writing and Keep "…", remove the others are disabled with the reason for everyone but a Tool Owner, and Git storage itself refuses to write the shared setup or delete its data files without “Change the stream mapping” (CON-133; review AR-001, KB-120).
- **Role rights no longer saves an old draft over a newer access.json** — the draft is written over the version it was made from; when someone else saved meanwhile the page says so, Save is refused with a clear message and your draft is kept (CON-132; AR-002, KB-121).
- **One rule on every save of access.json** — the People drawer and the bulk Set access role… now refuse what Role rights refuses: only a Tool Owner changes who holds the stream mapping, one must remain, and you keep “Manage access” (CON-131; AR-003, KB-122).
- **A Deny counts for the Tool Owner** — who holds the stream mapping is worked out from each person's effective rights, so a Deny can no longer leave nobody able to change it (CON-130; AR-004, KB-123).
- **Bulk Set region… / Set role… / Set access role… start with nothing chosen** — Save waits for a value; clearing is its own choice that asks to confirm (CON-135; AR-010, KB-124).
- **Access for emails not in Azure DevOps** — Role rights lists the app access of emails no one in Azure DevOps has, with Remove… (confirmed) and Give access by email… (CON-134; AR-011, KB-125, LIM-15).

DF-420…DF-424, SM-250; TC-CON-90…TC-CON-95.
