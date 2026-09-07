(() => {
  const C = window.STUDY_CONFIG;
  let page = 0;
  let permissionValidated = false;
  let redeemedPermissionCode = "";
  const participantId = `A${cryptoRandom(10)}`;
  const order = Math.random() < .5 ? ["music","silence"] : ["silence","music"];
  const forms = Math.random() < .5 ? ["A","B"] : ["B","A"];
  const state = { participantId, order, forms, startedAt: new Date().toISOString(), responses:{}, nback:{music:null,silence:null}, trials:[] };

  const phq = [
    "Little interest or pleasure in doing things",
    "Feeling down, depressed, or hopeless",
    "Trouble falling or staying asleep, or sleeping too much",
    "Feeling tired or having little energy",
    "Poor appetite or overeating",
    "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
    "Trouble concentrating on things, such as reading or watching television",
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
  const motives = [
    "To relax or calm down",
    "To improve or maintain my mood",
    "To distract myself from stress or difficult feelings",
    "To help me focus on schoolwork or another task",
    "To feel understood or emotionally supported",
    "To connect with friends or other people",
    "To increase my energy or motivation",
    "To think through or express my feelings"
  ];

  const frequency4 = ["Not at all","Several days","More than half the days","Nearly every day"];
  const motive5 = ["Never","Rarely","Sometimes","Often","Very often"];

  renderScale("phqItems","phq",phq,frequency4);
  renderScale("gadItems","gad",gad,frequency4);
  renderScale("motiveItems","mot",motives,motive5);
  updateProgress();

  document.addEventListener("click", async e => {
    const b = e.target.closest("button"); if(!b) return;
    if(b.hasAttribute("data-prev")) return go(page-1);
    if(b.hasAttribute("data-next")) {
      const id=b.dataset.require; if(id && !document.getElementById(id).checked) return alert("Please confirm before continuing.");
      return go(page+1);
    }
    const a=b.dataset.action;
    if(a==="validate-access") return validateAccess();
    if(a==="demo-next") return demographicsNext();
    if(a==="scale-next") return scaleNext(b.dataset.scale);
    if(a==="music-next") return musicNext();
    if(a==="practice") return runPractice();
    if(a==="start-condition") return runCurrentCondition();
    if(a==="second-condition") return prepareCondition(1);
    if(a==="submit-study") return submitStudy();
  });

  function go(n){ if(n<0||n>11)return; document.querySelector(`.page[data-page="${page}"]`)?.classList.remove("active"); page=n; document.querySelector(`.page[data-page="${page}"]`)?.classList.add("active"); updateProgress(); window.scrollTo({top:0,behavior:"smooth"}); }
  function updateProgress(){ document.getElementById("progressText").textContent=`Step ${Math.min(page+1,12)} of 12`; document.getElementById("progressBar").style.width=`${((page+1)/12)*100}%`; }

  async function validateAccess(){
    const s=document.getElementById("accessStatus"), code=document.getElementById("permissionCode").value.trim();
    if(!document.getElementById("deviceConfirm").checked){ s.textContent="Please confirm that you are using a laptop or desktop with a physical keyboard."; s.className="status error"; return; }
    if(!C.REQUIRE_PERMISSION_CODE){ permissionValidated=true; return go(1); }
    if(!code){ s.textContent="Enter the permission code first."; s.className="status error"; return; }
    if(!apiConfigured()){ s.textContent="Researcher setup is incomplete: the Google Apps Script URL has not been configured."; s.className="status error"; return; }
    s.textContent="Checking permission…"; s.className="status";
    try{ const r=await post({action:"validatePermission",code}); if(!r.ok) throw new Error(r.message||"Code not accepted"); permissionValidated=true; redeemedPermissionCode=code; document.getElementById("permissionCode").value=""; s.textContent="Permission confirmed."; s.className="status ok"; setTimeout(()=>go(1),350); }
    catch(err){ s.textContent=err.message||"Unable to verify the code."; s.className="status error"; }
  }

  function demographicsNext(){
    const req=["age","grade","sleepHours","musicTraining","studyMusicFreq"]; if(req.some(id=>!val(id))) return alert("Please answer the required questions before continuing.");
    Object.assign(state.responses,{age:val("age"),grade:val("grade"),gender:val("gender"),sleep_hours:Number(val("sleepHours")),music_training:val("musicTraining"),study_music_frequency:Number(val("studyMusicFreq"))}); go(3);
  }

  function scaleNext(which){
    const prefix=which==="phq"?"phq":which==="gad"?"gad":"mot"; const count=which==="phq"?8:which==="gad"?7:8; const arr=[];
    for(let i=0;i<count;i++){ const q=document.querySelector(`input[name="${prefix}_${i}"]:checked`); if(!q) return alert("Please answer each item before continuing."); arr.push(Number(q.value)); }
    if(which==="phq"){state.responses.phq8_items=arr;state.responses.phq8_total=sum(arr);go(4)}
    else if(which==="gad"){state.responses.gad7_items=arr;state.responses.gad7_total=sum(arr);go(5)}
    else {state.responses.music_motive_items=arr;state.responses.music_motive_mean=mean(arr);state.responses.music_top_reason=val("topReason");go(6)}
  }

  function musicNext(){
    const req=["lyrics","genre","typicalStudyMusic"]; if(req.some(id=>!val(id))) return alert("Please answer the required music questions.");
    Object.assign(state.responses,{music_lyrics:val("lyrics"),music_genre:val("genre"),music_familiarity:Number(val("familiarity")),music_liking:Number(val("liking")),music_energy:Number(val("energy")),music_valence:Number(val("valence")),typical_study_music:val("typicalStudyMusic")});go(7);
  }

  async function runPractice(){
    go(8); document.getElementById("taskIntro").classList.add("hidden"); document.getElementById("taskArea").classList.remove("hidden"); document.getElementById("taskStatus").textContent="Practice: feedback will appear briefly.";
    const seq=generateSequence(C.practiceTrials,.28,"P"); const result=await runNback(seq,{practice:true,condition:"practice",form:"P"});
    document.getElementById("taskArea").classList.add("hidden"); document.getElementById("taskIntro").classList.remove("hidden");
    const acc=Math.round(result.accuracy*100); document.getElementById("conditionTitle").textContent="Practice complete";
    document.getElementById("conditionInstructions").innerHTML=`<p>You were correct on <strong>${acc}%</strong> of practice trials.</p><p>The scored study blocks begin next. No feedback will be shown during them.</p>`;
    const b=document.querySelector('[data-action="start-condition"]'); b.textContent="Continue"; b.onclick=null; b.dataset.action=""; b.addEventListener("click",()=>prepareCondition(0),{once:true});
  }

  function prepareCondition(index){
    state.currentIndex=index; const condition=order[index]; go(8); document.getElementById("taskArea").classList.add("hidden"); document.getElementById("taskIntro").classList.remove("hidden");
    document.getElementById("conditionTitle").textContent=`Block ${index+1} of 2`;
    document.getElementById("conditionInstructions").innerHTML= condition==="music" ? `<strong>Music condition</strong><p>Put on your headphones/earbuds and start the music you selected. Keep the volume at a comfortable level similar to what you would normally use. Do not change tracks or switch windows during the memory task.</p><p>After you click “Start 30-second music lead-in,” listen for 30 seconds. The 2-back will then begin automatically.</p>` : `<strong>Silence condition</strong><p>Keep your headphones/earbuds on, but pause all audio. Make sure no music, videos, or other audio is playing.</p><p>The task will begin after a short countdown.</p>`;
    const b=document.querySelector('[data-action="start-condition"]'); b.dataset.action="start-condition"; b.textContent=condition==="music"?"Start 30-second music lead-in":"Start silence block";
  }

  async function runCurrentCondition(){
    const index=state.currentIndex, condition=order[index], form=forms[index]; document.getElementById("taskIntro").classList.add("hidden"); document.getElementById("taskArea").classList.remove("hidden");
    if(condition==="music"){ for(let s=30;s>0;s--){document.getElementById("taskStatus").textContent=`Music lead-in: ${s} seconds`; await sleep(1000);} }
    else {document.getElementById("taskStatus").textContent="Get ready…"; await sleep(2500);}
    const seq=generateSequence(C.testTrials,C.targetRate,form); const result=await runNback(seq,{practice:false,condition,form}); state.nback[condition]=result;
    document.getElementById("taskArea").classList.add("hidden");
    if(index===0){ go(9); const next=order[1]; document.getElementById("secondConditionPreview").innerHTML=next==="music"?"Your next block will be completed <strong>with your selected music</strong>. Keep it ready.":"Your next block will be completed <strong>in silence</strong>."; }
    else go(10);
  }

  function generateSequence(n,targetRate,form){
    const letters=(form==="B"?["F","H","J","K","L","N","P","R","T","V","X","Z"]:["B","C","D","G","M","Q","S","W","Y","F","K","R"]);
    const eligible=Array.from({length:Math.max(0,n-2)},(_,i)=>i+2);
    const exactTargets=Math.max(1,Math.round(eligible.length*targetRate));
    for(let i=eligible.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[eligible[i],eligible[j]]=[eligible[j],eligible[i]];}
    const targetSet=new Set(eligible.slice(0,exactTargets));
    const seq=[];
    for(let i=0;i<n;i++){
      const isTarget=targetSet.has(i); let letter;
      if(isTarget) letter=seq[i-2].letter;
      else { do{letter=letters[Math.floor(Math.random()*letters.length)]}while(i>=2 && letter===seq[i-2].letter); }
      seq.push({letter,target:isTarget});
    }
    return seq;
  }

  async function runNback(seq,{practice,condition,form}){
    const stim=document.getElementById("stimulus"), status=document.getElementById("taskStatus"); const rows=[]; let pressed=false, pressAt=null, accept=false, trialStart=0;
    const keyHandler=e=>{ if(!accept||pressed||e.repeat)return; if(e.key.toLowerCase()==="m"){pressed=true;pressAt=performance.now();} };
    window.addEventListener("keydown",keyHandler);
    status.textContent=practice?"Practice":"Respond to 2-back matches"; stim.textContent="+"; await sleep(1200);
    for(let i=0;i<seq.length;i++){
      pressed=false;pressAt=null;accept=true;trialStart=performance.now(); stim.textContent=seq[i].letter;
      await sleep(C.stimulusMs); stim.textContent="+"; await sleep(Math.max(0,C.trialMs-C.stimulusMs)); accept=false;
      const target=seq[i].target, hit=target&&pressed, miss=target&&!pressed, fa=!target&&pressed, correct=hit||(!target&&!pressed), rt=pressed?Math.round(pressAt-trialStart):null;
      const row={participant_id:participantId,condition,form,trial:i+1,letter:seq[i].letter,target:Number(target),pressed:Number(pressed),correct:Number(correct),hit:Number(hit),miss:Number(miss),false_alarm:Number(fa),rt_ms:rt}; rows.push(row); if(!practice)state.trials.push(row);
      if(practice){status.textContent=correct?"Correct":"Not quite";status.className=`task-status ${correct?"flash-good":"flash-bad"}`;await sleep(250);status.className="task-status";status.textContent="Practice";}
    }
    window.removeEventListener("keydown",keyHandler); stim.textContent="✓"; await sleep(500); return summarize(rows);
  }

  function summarize(rows){
    const targets=rows.filter(r=>r.target===1).length, nontargets=rows.length-targets, hits=rows.filter(r=>r.hit===1).length, misses=rows.filter(r=>r.miss===1).length, fas=rows.filter(r=>r.false_alarm===1).length, correct=rows.filter(r=>r.correct===1).length, hitRts=rows.filter(r=>r.hit===1&&r.rt_ms>0).map(r=>r.rt_ms).sort((a,b)=>a-b);
    const h=(hits+.5)/(targets+1), fa=(fas+.5)/(nontargets+1), dprime=invNorm(h)-invNorm(fa);
    return {n_trials:rows.length,targets,nontargets,hits,misses,false_alarms:fas,accuracy:correct/rows.length,hit_rate:hits/Math.max(1,targets),false_alarm_rate:fas/Math.max(1,nontargets),median_hit_rt_ms:median(hitRts),dprime};
  }

  async function submitStudy(){
    const required=["interruptions","headphones","technicalIssue"]; if(required.some(id=>!val(id))) return alert("Please answer the required post-task questions.");
    Object.assign(state.responses,{music_distraction:Number(val("musicDistract")),music_help_concentration:Number(val("musicHelp")),music_volume:Number(val("volume")),interruptions:val("interruptions"),environment_distraction:Number(val("envDistract")),headphones:val("headphones"),technical_issue:val("technicalIssue")});
    state.completedAt=new Date().toISOString(); state.studyVersion=C.STUDY_VERSION; state.condition_order=order.join("_then_"); state.form_order=forms.join("_then_"); state.music_minus_silence_dprime=state.nback.music.dprime-state.nback.silence.dprime; state.music_minus_silence_accuracy=state.nback.music.accuracy-state.nback.silence.accuracy; state.music_minus_silence_rt=nullableSubtract(state.nback.music.median_hit_rt_ms,state.nback.silence.median_hit_rt_ms);
    const s=document.getElementById("submitStatus"); if(!apiConfigured()){s.textContent="Researcher setup is incomplete: the Google Apps Script URL has not been configured.";s.className="status error";return;}
    s.textContent="Submitting… please keep this tab open.";s.className="status";
    try{const r=await post({action:"submitStudy",payload:state,permissionCode:redeemedPermissionCode});if(!r.ok)throw new Error(r.message||"Submission failed");s.textContent="Submitted.";s.className="status ok";setTimeout(()=>go(11),300)}catch(err){s.textContent="Your data were not submitted. Please check your connection and try again. No research responses have been saved in your browser.";s.className="status error";}
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
