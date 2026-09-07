window.STUDY_CONFIG = {
  // Deploy the included Google Apps Script as a Web App, then paste its /exec URL here.
  API_URL: "https://script.google.com/macros/s/AKfycbwGZtKH5zen-QtK6gu59L1j8_X22iz9gTOpYcLI2xj0Inhgf6f6iGaY8P3LK1q-s58/exec",
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
