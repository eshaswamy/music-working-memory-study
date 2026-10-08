/**
 * Google Apps Script backend for the Music, Mood & Working Memory study.
 * Bind this script to a NEW Google Spreadsheet used only for this project.
 * Deploy as Web App: execute as yourself; access per your approved recruitment plan.
 *
 * Sheets created automatically:
 *   Responses         (anonymous one-row-per-participant)
 *   NBackTrials       (anonymous trial-level)
 */

const RESPONSE_SHEET = 'Responses';
const TRIAL_SHEET = 'NBackTrials';
const SPREADSHEET_ID = 'PASTE_GOOGLE_SHEET_ID_HERE';

function studySpreadsheet(){
  if (SPREADSHEET_ID.indexOf('PASTE_') === 0) throw new Error('Set SPREADSHEET_ID before deployment.');
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    if (body.action === 'submitStudy') return json(submitStudy(body.payload));
    return json({ok:false,message:'Unknown action'});
  } catch (err) {
    return json({ok:false,message:String(err && err.message ? err.message : err)});
  }
}

function setupStudySheets() {
  const ss = studySpreadsheet();
  ensureSheet(ss,RESPONSE_SHEET,responseHeaders());
  ensureSheet(ss,TRIAL_SHEET,['participant_id','study_version','condition_order','condition','form','trial','letter','target','pressed','correct','hit','miss','false_alarm','rt_ms']);
  return 'Study sheets ready.';
}

function submitStudy(p) {
  if(!p || !p.participantId || !p.nback || !p.responses) return {ok:false,message:'Incomplete payload'};
  if(p.responses.parent_permission_confirmed !== true) return {ok:false,message:'Parent/guardian permission was not confirmed.'};
  if(p.responses.student_assent !== true) return {ok:false,message:'Student assent was not confirmed.'};
  setupStudySheets(); const ss=studySpreadsheet(); const lock=LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const sh=ss.getSheetByName(RESPONSE_SHEET); const existing=sh.getRange(2,1,Math.max(sh.getLastRow()-1,0),1).getValues().flat();
    if(existing.includes(p.participantId)) return {ok:false,message:'This anonymous submission has already been recorded.'};
    sh.appendRow(flattenResponse(p));
    const tsh=ss.getSheetByName(TRIAL_SHEET); const rows=(p.trials||[]).map(t=>[p.participantId,safe(p.studyVersion),safe(p.condition_order),safe(t.condition),safe(t.form),num(t.trial),safe(t.letter),num(t.target),num(t.pressed),num(t.correct),num(t.hit),num(t.miss),num(t.false_alarm),numOrBlank(t.rt_ms)]);
    if(rows.length) tsh.getRange(tsh.getLastRow()+1,1,rows.length,rows[0].length).setValues(rows);
    return {ok:true};
  } finally { lock.releaseLock(); }
}

function responseHeaders(){
  const h=['participant_id','study_version','started_at','completed_at','condition_order','form_order','age','grade','gender','sleep_hours','music_training','study_music_frequency'];
  for(let i=1;i<=8;i++)h.push('phq8_'+i);h.push('phq8_total');for(let i=1;i<=7;i++)h.push('gad7_'+i);h.push('gad7_total');for(let i=1;i<=8;i++)h.push('music_motive_'+i);h.push('music_motive_mean','music_top_reason','music_lyrics','music_genre','music_familiarity','music_liking','music_energy','music_valence','typical_study_music');
  ['music','silence'].forEach(c=>h.push(c+'_n_trials',c+'_targets',c+'_hits',c+'_misses',c+'_false_alarms',c+'_accuracy',c+'_hit_rate',c+'_false_alarm_rate',c+'_median_hit_rt_ms',c+'_dprime'));
  h.push('music_minus_silence_dprime','music_minus_silence_accuracy','music_minus_silence_rt_ms','perceived_music_distraction','perceived_music_help','music_volume','interruptions','environment_distraction','headphones','technical_issue','parent_permission_confirmed','parent_permission_method','parent_permission_at','student_assent');return h;
}

function flattenResponse(p){
  const r=p.responses||{},row=[safe(p.participantId),safe(p.studyVersion),safe(p.startedAt),safe(p.completedAt),safe(p.condition_order),safe(p.form_order),safe(r.age),safe(r.grade),safe(r.gender),numOrBlank(r.sleep_hours),safe(r.music_training),numOrBlank(r.study_music_frequency)];
  (r.phq8_items||[]).forEach(x=>row.push(num(x)));row.push(numOrBlank(r.phq8_total));(r.gad7_items||[]).forEach(x=>row.push(num(x)));row.push(numOrBlank(r.gad7_total));(r.music_motive_items||[]).forEach(x=>row.push(num(x)));row.push(numOrBlank(r.music_motive_mean),safe(r.music_top_reason),safe(r.music_lyrics),safe(r.music_genre),numOrBlank(r.music_familiarity),numOrBlank(r.music_liking),numOrBlank(r.music_energy),numOrBlank(r.music_valence),safe(r.typical_study_music));
  ['music','silence'].forEach(c=>{const n=p.nback[c]||{};row.push(numOrBlank(n.n_trials),numOrBlank(n.targets),numOrBlank(n.hits),numOrBlank(n.misses),numOrBlank(n.false_alarms),numOrBlank(n.accuracy),numOrBlank(n.hit_rate),numOrBlank(n.false_alarm_rate),numOrBlank(n.median_hit_rt_ms),numOrBlank(n.dprime));});
  row.push(numOrBlank(p.music_minus_silence_dprime),numOrBlank(p.music_minus_silence_accuracy),numOrBlank(p.music_minus_silence_rt),numOrBlank(r.music_distraction),numOrBlank(r.music_help_concentration),numOrBlank(r.music_volume),safe(r.interruptions),numOrBlank(r.environment_distraction),safe(r.headphones),safe(r.technical_issue),r.parent_permission_confirmed===true,safe(r.parent_permission_method),safe(r.parent_permission_at),r.student_assent===true);return row;
}

function ensureSheet(ss,name,headers){
  let sh=ss.getSheetByName(name); if(!sh) sh=ss.insertSheet(name);
  if(sh.getLastRow()===0){ sh.appendRow(headers); sh.setFrozenRows(1); sh.getRange(1,1,1,headers.length).setFontWeight('bold').setWrap(true); return sh; }
  const existing=sh.getRange(1,1,1,Math.max(1,sh.getLastColumn())).getValues()[0];
  headers.forEach(h=>{ if(!existing.includes(h)){ sh.getRange(1,sh.getLastColumn()+1).setValue(h).setFontWeight('bold').setWrap(true); existing.push(h); } });
  return sh;
}
function safe(x){if(x===null||x===undefined)return '';const s=String(x);return /^[=+\-@]/.test(s)?"'"+s:s;}
function num(x){const n=Number(x);return Number.isFinite(n)?n:0;} function numOrBlank(x){if(x===null||x===undefined||x==='')return '';const n=Number(x);return Number.isFinite(n)?n:'';}
function json(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);}
