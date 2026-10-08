# GitHub-ready v4 — single-link parent permission + student assent

This version removes the separate parent page, access-code system, ParentPermission backend action, and PermissionTokens backend action.

## Participant flow
1. Open the main GitHub Pages URL.
2. Parent/legal guardian reads the first-page information and checks the permission box.
3. Parent confirms the student is using a laptop/desktop with a physical keyboard.
4. Student completes the separate assent page.
5. Student completes the survey, randomized 2-back blocks, post-task questions, and final submission.

No parent/student names or emails are collected by the website.

## IMPORTANT: keep your existing URLs/IDs
This ZIP intentionally contains placeholders because it does not know your private deployment values. Before uploading:
- In `config.js`, paste your current Google Apps Script Web App `/exec` URL into `API_URL`.
- In `google_apps_script.gs`, paste your current Google Sheet ID into `SPREADSHEET_ID`.

## Update the Google Apps Script deployment
1. Open the Apps Script project attached to your study spreadsheet.
2. Replace its code with `google_apps_script.gs` from this ZIP.
3. Put your Sheet ID into `SPREADSHEET_ID`.
4. Save.
5. Run `setupStudySheets()` once. This adds the four new permission/assent columns to an existing Responses sheet without deleting existing test data.
6. Deploy > Manage deployments > edit your existing Web App deployment > choose New version > Deploy. Keep using the `/exec` URL from that deployment.

The old `ParentPermission` and `PermissionTokens` tabs are no longer used. Leave them in place until the new version passes testing. After that, you may archive/delete the old test-only tabs if your supervisor approves.

## Update GitHub
Upload/replace these files in the repository root:
- index.html
- student.html
- parent_permission.html
- app.js
- config.js
- styles.css

`student.html` and `parent_permission.html` now simply redirect to `index.html`, so old links do not break.

Do not upload participant data or spreadsheet exports to GitHub.

## Test before real recruitment
Use fake data and confirm:
- the site cannot advance without the parent/legal-guardian checkbox;
- the student cannot advance without assent;
- a completed submission creates one Responses row;
- the row contains `parent_permission_confirmed = TRUE` and `student_assent = TRUE`;
- trial data appear in NBackTrials;
- no name/email is present in Responses.

Have the final permission/assent procedure and wording approved by the adult/mentor supervising the project before recruiting minors.
