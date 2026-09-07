window.STUDY_CONFIG = {
  // Deploy the included Google Apps Script as a Web App, then paste its /exec URL here.
  API_URL: "PASTE_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE",
  REQUIRE_PERMISSION_CODE: true,

  // Task parameters. Pilot before changing.
  practiceTrials: 12,
  testTrials: 60,
  targetRate: 0.25,
  stimulusMs: 500,
  trialMs: 3000,
  preBlockMusicMs: 30000,

  // Human-readable study version saved with every row.
  STUDY_VERSION: "music-wm-v1.0"
};
