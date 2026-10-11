# v12 — readable participant IDs

Participant IDs in both `Responses` and `NBackTrials` now look like `P-0001`, `P-0002`, etc. They are assigned by Google Apps Script when the participant submits, under a script lock, not generated on the website. Existing v11 IDs are not changed. The next ID starts after the existing response count (or the highest prior P-number), and a persistent counter prevents reusing an ID after a row is deleted. The hidden/internal `submission_token` column stores the browser-generated random token so duplicate submissions can be detected without affecting readable participant IDs.

## Update steps
1. Replace the Apps Script source with `google_apps_script.gs` from this ZIP. **Preserve your actual `SPREADSHEET_ID`** when pasting it.
2. Run `setupStudySheets` once to add the `submission_token` column to your existing `Responses` tab. Do not delete or recreate your existing sheet.
3. Deploy > Manage deployments > Edit > New version > Deploy. Your existing web-app URL can remain unchanged.
4. Replace GitHub Pages files with the ZIP files, keeping your real Apps Script `/exec` URL in `config.js`.
5. Complete one test submission and verify its `P-####` ID appears identically in both tabs. Existing long IDs remain intact.

**Note:** The readable IDs are not personally identifying. Avoid sharing the spreadsheet publicly: it contains sensitive questionnaire responses. If a spreadsheet has previously had manual row deletions, the first ID may not be perfectly consecutive with older rows. IDs are identifiers, not a count of participants.
