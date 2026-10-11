# Music, Focus & Memory — v10 fixes

## Student questions
- Consent: parent permission, student assent, physical-keyboard confirmation (same page).
- Demographics: age, grade, sex, country, sleep hours, sleep condition, years of music training, weekly training hours, study music frequency.
- PHQ-8: eight items; GAD-7: seven items.
- **Music-listening reasons: ONE multiple-choice question only** (plus free text if Other). No eight-item motives scale.
- Selected music: **THREE questions only**: lyrics, genre, familiarity 1–5. No song title, liking, energy, valence, or usual-study-music similarity.
- Post-task: seven items.

## N-back
- Fixed practice: 8 letters, 2 targets.
- Fixed scored forms A and B: 25 letters each, 6 targets each; condition order and form order randomized independently.
- Music block always routes through a separate start-music page, a full 20-second countdown, and then an explicit start button. Silence block explicitly requires pausing music.
- SPACE is the response key; + is a fixation marker, not a letter.

## Deployment
1. Upload index.html, app.js, styles.css, config.js to GitHub Pages.
2. Keep your own web app URL in config.js.
3. Replace Google Apps Script with google_apps_script.gs, keep your spreadsheet ID, run setupStudySheets and redeploy a new version.
4. **Existing spreadsheet columns are not deleted** by setupStudySheets. For a clean data dictionary, start with a new empty Responses/NBackTrials spreadsheet, or carefully migrate headers before recruitment.
5. Test practice, music-first and silence-first, both forms, 50 scored trial rows, consent and all survey fields, and a full submission.

## Limitations
- This package has static/syntax checks, not a completed browser-to-Google-Sheets end-to-end test.
- With only six targets per 25-trial block, d-prime estimates can be noisy. Review with mentor.
- A checkbox alone does not verify the identity of the parent who checks it; confirm that the permission procedure is approved.
