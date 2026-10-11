(() => {
  const C = window.STUDY_CONFIG;
  let page = 0;
  const participantId = `A${cryptoRandom(10)}`;
  const order = Math.random() < .5 ? ["music","silence"] : ["silence","music"];
  const forms = Math.random() < .5 ? ["A","B"] : ["B","A"];
  const state = { participantId, order, forms, startedAt: new Date().toISOString(), responses:{}, nback:{music:null,silence:null}, trials:[] };

  const phq = [
    "Little interest or pleasure in doing things",
    "Feeling down, depressed, irritable or hopeless",
    "Trouble falling or staying asleep, or sleeping too much",
    "Feeling tired or having little energy",
    "Poor appetite or overeating",
    "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
    "Trouble concentrating on things, such as school work, reading or watching television",
    "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual"
  ];
  const gad = [
    "Feeling nervous, anxious, or on edge",
    "Not being able to stop or control worrying",
    "Worrying too much about different things",
    "Trouble relaxing",
    "Being so restless that it is hard to sit still",
    "Becoming easily annoyed or irritable",
    "Feeling afraid as if something awful might happen"
  ];

  const frequency4 = ["Not at all","Several days","More than half the days","Nearly every day"];

  renderScale("phqItems","phq",phq,frequency4);
  renderScale("gadItems","gad",gad,frequency4);
  updateProgress();

  document.addEventListener("click", async e => {
    const b = e.target.closest("button"); if(!b) return;
    if(b.hasAttribute("data-prev")) { if(taskRunning)return; return go(page-1); }
    if(b.hasAttribute("data-next")) {
      const id=b.dataset.require; if(id && !document.getElementById(id).checked) return alert("Please confirm before continuing.");
      if(id==="assent") state.responses.student_assent = true;
      return go(page+1);
    }
    const a=b.dataset.action;
    if(a==="begin-study") return beginStudy();
    if(a==="demo-next") return demographicsNext();
    if(a==="scale-next") return scaleNext(b.dataset.scale);
    if(a==="motive-next") return motiveNext();
    if(a==="music-next") return musicNext();
    if(a==="practice") return runPractice();
    if(a==="music-leadin") return beginMusicLeadIn();

    if(a==="second-condition") return prepareCondition(1);
    if(a==="submit-study") return submitStudy();
  });

  function go(n){ if(n<0||n>11)return; document.querySelector(`.page[data-page="${page}"]`)?.classList.remove("active"); page=n; document.querySelector(`.page[data-page="${page}"]`)?.classList.add("active"); updateProgress(); window.scrollTo({top:0,behavior:"smooth"}); }
  function updateProgress(){ document.getElementById("progressText").textContent=`Step ${Math.min(page+1,12)} of 12`; document.getElementById("progressBar").style.width=`${((page+1)/12)*100}%`; }

  function beginStudy(){
    const s=document.getElementById("accessStatus");
    if(!document.getElementById("parentPermission").checked){ s.textContent="A parent or legal guardian must read the information and give permission before the student begins."; s.className="status error"; return; }
    if(!document.getElementById("assent").checked){ s.textContent="Student assent is required to continue."; s.className="status error"; return; }
    if(!document.getElementById("deviceConfirm").checked){ s.textContent="Please confirm that the student is using a laptop or desktop with a physical keyboard."; s.className="status error"; return; }
    state.responses.student_assent = true;
    state.responses.parent_permission_confirmed = true;
    state.responses.parent_permission_method = "parent_guardian_checkbox";
    state.responses.parent_permission_at = new Date().toISOString();
    s.textContent=""; go(1);
  }

  function demographicsNext(){
    const req=["age","grade","gender","country","sleepHours","musicTraining","musicHours","studyMusicFreq"]; if(req.some(id=>!val(id))) return alert("Please answer the required questions before continuing.");
    if(Number(val("sleepHours"))<2 || Number(val("sleepHours"))>12) return alert("Sleep hours must be between 2 and 12.");
    Object.assign(state.responses,{age:val("age"),grade:val("grade"),gender:val("gender"),country:val("country").trim(),sleep_hours:Number(val("sleepHours")),sleep_condition:val("sleepCondition"),music_training:val("musicTraining"),music_training_hours:Number(val("musicHours")),study_music_frequency:Number(val("studyMusicFreq"))}); go(2);
  }

  function scaleNext(which){
    const prefix=which==="phq"?"phq":"gad"; const count=which==="phq"?8:7; const arr=[];
    for(let i=0;i<count;i++){ const q=document.querySelector(`input[name="${prefix}_${i}"]:checked`); if(!q) return alert("Please answer each item before continuing."); arr.push(Number(q.value)); }
    if(which==="phq"){state.responses.phq8_items=arr;state.responses.phq8_total=sum(arr);go(3)}
    else if(which==="gad"){state.responses.gad7_items=arr;state.responses.gad7_total=sum(arr);go(4)}

  }

  function motiveNext(){
    if(!val("topReason")) return alert("Please select your main reason for listening to music.");
    if(val("topReason")==="other" && !val("topReasonOther").trim()) return alert("Please specify your other reason.");
    state.responses.music_top_reason=val("topReason"); state.responses.music_top_reason_other=val("topReason")==="other"?val("topReasonOther").trim():""; go(5);
  }

  function musicNext(){
    const req=["lyrics","genre","familiarity"]; if(req.some(id=>!val(id))) return alert("Please answer the required music questions.");

    Object.assign(state.responses,{music_lyrics:val("lyrics"),music_genre:val("genre"),music_familiarity:Number(val("familiarity"))});go(6);
  }

  let taskRunning=false;
  async function runPractice(){
    if(taskRunning) return;
    taskRunning=true;
    go(8); showTask();
    try {
      const seq=FIXED_SEQUENCES.P;
      const result=await runNback(seq,{practice:true,condition:"practice",form:"P"});
      hideTask();
      document.getElementById("conditionTitle").textContent="Practice complete";
      document.getElementById("conditionInstructions").innerHTML=`<p>Practice accuracy: <strong>${Math.round(result.accuracy*100)}%</strong>.</p><p>Next: two separate scored blocks. The order is randomized. Follow the music/silence instructions for each block. There is no feedback during scored trials.</p>`;
      setBlockButton("Continue to block 1",()=>prepareCondition(0));
    } finally {taskRunning=false;}
  }
  function showTask(){document.getElementById("taskIntro").classList.add("hidden");document.getElementById("taskArea").classList.remove("hidden");document.getElementById("taskArea").focus();}
  function hideTask(){document.getElementById("taskArea").classList.add("hidden");document.getElementById("taskIntro").classList.remove("hidden");}
  function setBlockButton(label,callback){
    const b=document.getElementById("blockStartButton");
    b.textContent=label;
    b.onclick=callback;
  }
  function prepareCondition(index){
    if(taskRunning) return;
    state.currentIndex=index;
    const condition=order[index];
    if(condition==="music") {
      // Music can only begin after the separate lead-in screen.
      go(7);
      return;
    }
    go(8);hideTask();
    document.getElementById("conditionTitle").textContent=`Block ${index+1} of 2 — Silence`;
    document.getElementById("conditionInstructions").innerHTML=`<p><strong>PAUSE ALL MUSIC BEFORE STARTING.</strong> Keep your music paused throughout this block. Press SPACE only when a letter matches the letter TWO positions earlier. The + is not a letter.</p>`;
    setBlockButton("My music is paused — start 25 letters",()=>runCurrentCondition());
  }
  async function beginMusicLeadIn(){
    if(taskRunning || order[state.currentIndex]!=="music")return;taskRunning=true;
    const button=document.querySelector('[data-action="music-leadin"]');button.disabled=true;
    try { for(let remaining=20;remaining>0;remaining--){button.textContent=`Listen to your music… ${remaining}s`;await sleep(1000);} }
    finally {taskRunning=false;button.disabled=false;button.textContent="My music is playing — continue";}
    go(8);hideTask();
    document.getElementById("conditionTitle").textContent=`Block ${state.currentIndex+1} of 2 — Music`;
    document.getElementById("conditionInstructions").innerHTML=`<p><strong>Keep your music playing.</strong> Press SPACE for a match with the letter TWO positions back. Click below to begin the 25-letter block.</p>`;
    setBlockButton("My music is still playing — start letters",()=>runCurrentCondition());
  }

  async function runCurrentCondition(){
    if(taskRunning || state.currentIndex===undefined || state.nback[order[state.currentIndex]]!==null)return;taskRunning=true;
    const index=state.currentIndex,condition=order[index],form=forms[index];showTask();
    try {
      document.getElementById("stimulus").textContent="+";
      document.getElementById("taskStatus").textContent="Get ready for the letters…";
      await sleep(1500);
      const seq=FIXED_SEQUENCES[form];
      state.nback[condition]=await runNback(seq,{practice:false,condition,form});
      hideTask();
      if(index===0){
        go(9);const next=order[1];
        document.getElementById("secondConditionPreview").innerHTML=`<p><strong>Block 1 finished.</strong> ${condition==="music"?"Pause your music now.":"Remain in silence for the break."}</p><p>Block 2 will be <strong>${next==="music"?"with your selected music":"in silence"}</strong>. The next screen will tell you when to start or pause playback.</p>`;
      } else {go(10);}
    } finally {taskRunning=false;}
  }
  // Fixed, prechecked sequences: every participant receives identical practice.
  // A and B are two fixed 25-trial forms, each with exactly 6 targets.
  // Form assignment and music/silence order are independently counterbalanced.
  // Do not use the same scored sequence twice for a participant: repetition can create learning effects.
  const FIXED_SEQUENCES = Object.freeze({
    P: makeFixedSequence("NGNSCDCZ"),
    A: makeFixedSequence("VLXLPGSGBRWRLVKVZBGBVRHRP"),
    B: makeFixedSequence("CWGXGJSRSXMGMMFLFTPLPFNNN")
  });
  function makeFixedSequence(letters) {
    return Object.freeze([...letters].map((letter,i,arr)=>Object.freeze({letter,target:i>=2&&letter===arr[i-2]})));
  }
  async function runNback(seq,{practice,condition,form}){
    const stim=document.getElementById("stimulus"), status=document.getElementById("taskStatus"); const rows=[]; let pressed=false, pressAt=null, accept=false, trialStart=0;
    const keyHandler=e=>{ if(!accept||pressed||e.repeat||e.code!=="Space")return; e.preventDefault(); pressed=true;pressAt=performance.now(); };
    window.addEventListener("keydown",keyHandler);
    status.textContent=practice?"Practice — press SPACE for a match":"Press SPACE for a 2-back match"; stim.textContent="+"; await sleep(1200);
    for(let i=0;i<seq.length;i++){
      pressed=false;pressAt=null;accept=true;trialStart=performance.now(); stim.textContent=seq[i].letter; document.getElementById("trialProgress").textContent=`${practice?"Practice":condition==="music"?"Music block":"Silence block"}: letter ${i+1} of ${seq.length}`;
      await sleep(C.stimulusMs); stim.textContent="+"; await sleep(Math.max(0,C.trialMs-C.stimulusMs)); accept=false;
      const target=seq[i].target, hit=target&&pressed, miss=target&&!pressed, fa=!target&&pressed, correct=hit||(!target&&!pressed), rt=pressed?Math.round(pressAt-trialStart):null;
      const row={participant_id:participantId,condition,form,trial:i+1,letter:seq[i].letter,target:Number(target),pressed:Number(pressed),correct:Number(correct),hit:Number(hit),miss:Number(miss),false_alarm:Number(fa),rt_ms:rt}; rows.push(row); if(!practice)state.trials.push(row);
      if(practice){status.textContent=correct?"Correct":"Not quite";status.className=`task-status ${correct?"flash-good":"flash-bad"}`;await sleep(250);status.className="task-status";status.textContent="Practice — press SPACE for a match";}
    }
    window.removeEventListener("keydown",keyHandler); stim.textContent="✓"; await sleep(500); return summarize(rows);
  }

  function summarize(rows){
    const targets=rows.filter(r=>r.target===1).length, nontargets=rows.length-targets, hits=rows.filter(r=>r.hit===1).length, misses=rows.filter(r=>r.miss===1).length, fas=rows.filter(r=>r.false_alarm===1).length, correct=rows.filter(r=>r.correct===1).length, hitRts=rows.filter(r=>r.hit===1&&r.rt_ms>0).map(r=>r.rt_ms).sort((a,b)=>a-b);
    const h=(hits+.5)/(targets+1), fa=(fas+.5)/(nontargets+1), dprime=invNorm(h)-invNorm(fa);
    return {n_trials:rows.length,targets,nontargets,hits,misses,false_alarms:fas,accuracy:correct/rows.length,hit_rate:hits/Math.max(1,targets),false_alarm_rate:fas/Math.max(1,nontargets),median_hit_rt_ms:median(hitRts),dprime};
  }

  let submitting=false;
  async function submitStudy(){
    if(submitting)return;
    const required=["interruptions","headphones","technicalIssue"]; if(required.some(id=>!val(id))) return alert("Please answer the required post-task questions.");
    Object.assign(state.responses,{music_distraction:Number(val("musicDistract")),music_help_concentration:Number(val("musicHelp")),music_volume:Number(val("volume")),interruptions:val("interruptions"),environment_distraction:Number(val("envDistract")),headphones:val("headphones"),technical_issue:val("technicalIssue")});
    state.completedAt=new Date().toISOString(); state.studyVersion=C.STUDY_VERSION; state.condition_order=order.join("_then_"); state.form_order=forms.join("_then_"); state.music_minus_silence_dprime=state.nback.music.dprime-state.nback.silence.dprime; state.music_minus_silence_accuracy=state.nback.music.accuracy-state.nback.silence.accuracy; state.music_minus_silence_rt=nullableSubtract(state.nback.music.median_hit_rt_ms,state.nback.silence.median_hit_rt_ms);
    const s=document.getElementById("submitStatus"); if(!apiConfigured()){s.textContent="Researcher setup is incomplete: the Google Apps Script URL has not been configured.";s.className="status error";return;}
    s.textContent="Submitting… please keep this tab open.";s.className="status";submitting=true;
    try{const r=await post({action:"submitStudy",payload:state});if(!r.ok)throw new Error(r.message||"Submission failed");s.textContent="Submitted.";s.className="status ok";setTimeout(()=>go(11),300)}catch(err){s.textContent="Your data were not submitted. Please check your connection and try again. No research responses have been saved in your browser.";s.className="status error";}
  }

  function renderScale(container,prefix,items,labels){ const el=document.getElementById(container); items.forEach((text,i)=>{const d=document.createElement("div");d.className="scale-item";d.innerHTML=`<div class="q">${i+1}. ${escapeHtml(text)}</div><div class="choices">${labels.map((lab,j)=>`<div class="choice"><input id="${prefix}_${i}_${j}" type="radio" name="${prefix}_${i}" value="${j}"><label for="${prefix}_${i}_${j}">${escapeHtml(lab)}</label></div>`).join("")}</div>`;el.appendChild(d)}) }
  function val(id){return document.getElementById(id)?.value??""} function sum(a){return a.reduce((x,y)=>x+y,0)} function mean(a){return sum(a)/a.length} function median(a){if(!a.length)return null;const m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2} function nullableSubtract(a,b){return a==null||b==null?null:a-b} function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
  function cryptoRandom(n){const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789",buf=new Uint8Array(n);crypto.getRandomValues(buf);return [...buf].map(x=>chars[x%chars.length]).join("")}
  function apiConfigured(){return C.API_URL && !C.API_URL.includes("PASTE_")}
  async function post(data){const r=await fetch(C.API_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(data),redirect:"follow"});const text=await r.text();try{return JSON.parse(text)}catch{return {ok:false,message:"Unexpected server response"}}}
  function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]))}
  // Acklam-style inverse normal approximation, adequate for d-prime scoring after log-linear correction.
  function invNorm(p){if(p<=0||p>=1)return NaN;const a=[-39.69683028665376,220.9460984245205,-275.9285104469687,138.357751867269,-30.66479806614716,2.506628277459239],b=[-54.47609879822406,161.5858368580409,-155.6989798598866,66.80131188771972,-13.28068155288572],c=[-.007784894002430293,-.3223964580411365,-2.400758277161838,-2.549732539343734,4.374664141464968,2.938163982698783],d=[.007784695709041462,.3224671290700398,2.445134137142996,3.754408661907416],pl=.02425,ph=1-pl;let q,r;if(p<pl){q=Math.sqrt(-2*Math.log(p));return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)}if(p>ph){q=Math.sqrt(-2*Math.log(1-p));return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)}q=p-.5;r=q*q;return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1)}
})();
