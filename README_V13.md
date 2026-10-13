# Version 13 — Mentor feedback and navigation fix

## Key corrections
- The music questionnaire now advances to the **music playback setup** (page 7), not the practice page (page 6). This fixes the repeated-practice loop reported during live testing.
- Practice can only run once; participants still receive two scored blocks, one music and one silence.
- The music selection page appears only directly before the music block, whether that block is first or second. No second song is requested for the silence block.
- Removed the music familiarity question at mentor suggestion. The remaining questions are lyrics and genre.
- Uses emotional-well-being framing across the landing page, headings and completion page. Consent still accurately discloses the standardized depression/anxiety research measures.
- The Apps Script remains compatible with existing v12 Google Sheets. The old `music_familiarity` column will be blank for new participants; **do not delete or reorder existing sheet columns**, since that could damage existing responses.
- The study version is `music-mood-memory-v13`.

## Deployment
1. Upload `index.html`, `app.js`, `styles.css`, and `config.js` to GitHub Pages. **Preserve your existing real Apps Script deployment URL in `config.js`**; this ZIP uses a placeholder.
2. The Google Apps Script does not need redeployment for these changes, because the removed field can remain blank.
3. Pilot both condition orders; each should generate 8 practice + 25 music + 25 silence trial rows.
4. Existing participants' v12 data should remain untouched.

## Important
This release passed JavaScript syntax and static navigation checks. It has not been live-tested against your deployed site and spreadsheet.
