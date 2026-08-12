var Cs="lift";var vt=["exercises","workouts","sets","stateOfMind","medications"],De=null;function Y(){return De?Promise.resolve(De):new Promise((e,t)=>{let s=indexedDB.open(Cs,6);s.onerror=()=>t(s.error),s.onsuccess=()=>{De=s.result,e(De)},s.onupgradeneeded=()=>{let n=s.result;if(!n.objectStoreNames.contains("exercises")){let i=n.createObjectStore("exercises",{keyPath:"id"});i.createIndex("name","name",{unique:!1}),i.createIndex("category","category",{unique:!1})}if(n.objectStoreNames.contains("workouts")||n.createObjectStore("workouts",{keyPath:"id"}).createIndex("startedAt","startedAt",{unique:!1}),!n.objectStoreNames.contains("sets")){let i=n.createObjectStore("sets",{keyPath:"id"});i.createIndex("workoutId","workoutId",{unique:!1}),i.createIndex("exerciseId","exerciseId",{unique:!1})}n.objectStoreNames.contains("stateOfMind")||n.createObjectStore("stateOfMind",{keyPath:"id"}).createIndex("date","date",{unique:!1}),n.objectStoreNames.contains("medications")||n.createObjectStore("medications",{keyPath:"id"}),n.objectStoreNames.contains("appMeta")||n.createObjectStore("appMeta",{keyPath:"key"}),n.objectStoreNames.contains("doseEvents")&&n.deleteObjectStore("doseEvents")}})}function ve(e){return new Promise((t,s)=>{e.onsuccess=()=>t(e.result),e.onerror=()=>s(e.error)})}async function he(e,t="readonly"){return(await Y()).transaction(e,t).objectStore(e)}function ne(e,t,s){return new Promise((n,i)=>{let o=e.transaction(t,"readwrite"),r;try{r=s(o)}catch(a){try{o.abort()}catch{}i(a);return}o.oncomplete=()=>n(r),o.onerror=()=>i(o.error),o.onabort=()=>i(o.error)})}async function C(e){return ve((await he(e)).getAll())}async function J(e,t){return ve((await he(e)).get(t))}async function R(e,t){return await ve((await he(e,"readwrite")).put(t)),t}async function oe(e,t){let s=await Y();return ne(s,e,n=>{let i=n.objectStore(e);for(let o of t)i.put(o)})}async function le(e,t){return ve((await he(e,"readwrite")).delete(t))}async function _e(e,t){if(t.length===0)return;let s=await Y();return ne(s,e,n=>{let i=n.objectStore(e);for(let o of t)i.delete(o)})}async function ht(e){let t=await J("appMeta",e);return t?t.value:null}async function Ae(e,t){return await R("appMeta",{key:e,value:t}),t}async function Be(e,t,s){let n=await he(e);return ve(n.index(t).getAll(s))}async function gt(e){let t=await Y();return ne(t,vt,s=>{for(let n of vt){let i=s.objectStore(n);i.clear();for(let o of e[n]??[])i.put(o)}})}function Z(e){let t=new Set;for(let s of e)s.completed&&t.add(s.workoutId);return e.filter(s=>s.completed||!t.has(s.workoutId))}async function de(){return(await C("workouts")).find(t=>!t.endedAt)??null}async function ee(){return(await C("workouts")).filter(t=>t.endedAt).sort((t,s)=>s.startedAt-t.startedAt)}async function yt(e){return(await Be("sets","workoutId",e)).sort((s,n)=>s.order-n.order)}async function Is(e){return await Be("sets","exerciseId",e)}async function wt(e,t=null){let s=await Is(e),n=new Map;for(let r of s)t&&r.workoutId===t||(n.has(r.workoutId)||n.set(r.workoutId,[]),n.get(r.workoutId).push(r));if(n.size===0)return[];let o=(await Promise.all(Array.from(n.keys()).map(r=>J("workouts",r)))).filter(Boolean).sort((r,a)=>(a.startedAt??0)-(r.startedAt??0));return o.length===0?[]:n.get(o[0].id).sort((r,a)=>r.order-a.order)}function bt(e,t,s=null){let n=new Map(t.map(r=>[r.id,r.startedAt??0])),i=new Map;for(let r of e){if(r.workoutId===s||!n.has(r.workoutId)||(r.weight||0)<=0||(r.reps||0)<=0)continue;let a=i.get(r.exerciseId);a||i.set(r.exerciseId,a=new Map);let c=a.get(r.workoutId);c||a.set(r.workoutId,c=[]),c.push(r)}let o=new Map;for(let[r,a]of i){let c=[...a.keys()].sort((S,D)=>n.get(D)-n.get(S)),p=new Map;for(let S of c){let D=a.get(S).sort((h,v)=>h.order-v.order),l=D.every(h=>h.setType==null),d=0,b=0;D.forEach((h,v)=>{if(l){let $=`any#${v+1}`;p.has($)||p.set($,h);return}let u=h.setType||"working",g=u==="warmup"?b+=1:d+=1,k=`${u}#${g}`;p.has(k)||p.set(k,h)})}o.set(r,p)}return o}var qs={barbell:"Barbell",dumbbell:"Dumbbell",machine:"Machine",cable:"Cable",bodyweight:"Bodyweight",kettlebell:"Kettlebell",band:"Bands",bands:"Bands"},Ps=/\s*\((barbell|dumbbell|machine|cable|bodyweight|kettlebell|bands?)\)$|\s+(Machine|Barbell|Dumbbell|Cable|Kettlebell)$/i;async function Hs(e,t){let s=await Y(),n=await Be("sets","exerciseId",e);return ne(s,["sets","exercises"],i=>{let o=i.objectStore("sets");for(let r of n)o.put({...r,exerciseId:t});return i.objectStore("exercises").delete(e),n.length})}async function xt(){let e=await C("exercises"),t=e.filter(o=>/butterfly/i.test(o.name||""));if(t.length===0)return 0;let s=e.filter(o=>/chest fly/i.test(o.name||"")&&!t.some(r=>r.id===o.id)),n=s.find(o=>(o.equipment||"")==="Machine")||s[0],i=0;for(let o of t)n?i+=await Hs(o.id,n.id):await R("exercises",{...o,name:"Chest Fly",equipment:"Machine"});return i}async function kt(){let e=await C("exercises"),t=[];for(let s of e){let n=(s.name||"").match(Ps);if(!n)continue;let i=s.name.slice(0,n.index).trim();if(!i||/smith$/i.test(i))continue;let o=(n[1]||n[2]).toLowerCase();t.push({...s,name:i,equipment:qs[o]||s.equipment})}return t.length>0&&await oe("exercises",t),t.length}async function St(){let[e,t,s]=await Promise.all([C("exercises"),C("sets"),C("workouts")]),n=new Set(e.filter(p=>p.category==="Cardio").map(p=>p.id));if(n.size===0)return{exercises:0,sets:0,workouts:0};let i=t.filter(p=>n.has(p.exerciseId)),o=new Map;for(let p of t)n.has(p.exerciseId)||o.set(p.workoutId,(o.get(p.workoutId)||0)+1);let r=new Set(i.map(p=>p.workoutId)),a=s.filter(p=>r.has(p.id)&&!o.get(p.id)),c=await Y();return await ne(c,["exercises","sets","workouts"],p=>{let S=p.objectStore("exercises"),D=p.objectStore("sets"),l=p.objectStore("workouts");for(let d of n)S.delete(d);for(let d of i)D.delete(d.id);for(let d of a)l.delete(d.id)}),{exercises:n.size,sets:i.length,workouts:a.length}}async function $t(e){let[t,s,n]=await Promise.all([C("exercises"),C("sets"),C("workouts")]),i=t.filter(l=>l.category==="Other");if(i.length===0)return{recategorized:0,deleted:0,workouts:0};let o=[],r=new Set;for(let l of i){let d=e(l.name);d==="Cardio"?r.add(l.id):o.push({...l,category:d&&d!=="Other"?d:"Full Body"})}let a=s.filter(l=>r.has(l.exerciseId)),c=new Map;for(let l of s)r.has(l.exerciseId)||c.set(l.workoutId,(c.get(l.workoutId)||0)+1);let p=new Set(a.map(l=>l.workoutId)),S=n.filter(l=>p.has(l.id)&&!c.get(l.id)),D=await Y();return await ne(D,["exercises","sets","workouts"],l=>{let d=l.objectStore("exercises"),b=l.objectStore("sets"),h=l.objectStore("workouts");for(let v of o)d.put(v);for(let v of r)d.delete(v);for(let v of a)b.delete(v.id);for(let v of S)h.delete(v.id)}),{recategorized:o.length,deleted:r.size,workouts:S.length}}async function Mt(){let e=await C("medications"),t=[];for(let s of e){if(s.doseAmount!=null)continue;let n=s.nickname||s.concept?.displayText||"";if(!/creatine/i.test(n))continue;let i=(s.concept?.form||"").replace(/\s*\(4\s*[×x]\s*\/?\s*day\)\s*/i,"").trim();t.push({...s,doseAmount:4,doseUnit:"capsule",concept:{...s.concept,form:i}})}return t.length>0&&await oe("medications",t),t.length}var Os=[[/\b(barbell|landmine|ez[- ]?bar|smith)\b/i,"Barbell"],[/\b(dumbbell|db)\b/i,"Dumbbell"],[/\b(cable|pulley|rope)\b/i,"Cable"],[/\b(plate[- ]?loaded|hammer strength)\b/i,"Machine Plates"],[/\b(machine|sled|press)\b/i,"Machine"]];async function Lt(){let t=(await C("exercises")).filter(n=>(n.equipment||"")==="Other");if(t.length===0)return[];let s=t.map(n=>{let i=Os.find(([o])=>o.test(n.name||""));return{...n,equipment:i?i[1]:"Bodyweight"}});return await oe("exercises",s),s.map(n=>`${n.name} \u2192 ${n.equipment}`)}async function Te(e){let t=await Y(),s=await Be("sets","workoutId",e);return ne(t,["workouts","sets"],n=>{n.objectStore("workouts").delete(e);let i=n.objectStore("sets");for(let o of s)i.delete(o.id)})}var _=()=>crypto&&crypto.randomUUID?crypto.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,e=>{let t=Math.random()*16|0;return(e==="x"?t:t&3|8).toString(16)});function ge(e){return e==null?"0":Math.abs(e-Math.round(e))<.001?String(Math.round(e)):e.toFixed(1)}function ye(e){return`${ge(e)} lbs`}function Et(e){let t=Math.max(0,Math.floor(e)),s=Math.floor(t/3600),n=Math.floor(t%3600/60),i=t%60;return s>0?`${s}:${String(n).padStart(2,"0")}:${String(i).padStart(2,"0")}`:`${n}:${String(i).padStart(2,"0")}`}function Ge(e){let t=Math.max(0,Math.floor(e)),s=Math.floor(t/3600),n=Math.floor(t%3600/60);return s>0?`${s}h ${n}m`:`${n}m`}function K(e){return Math.round(e).toLocaleString()}function ue(e){return`${K(e)} lbs`}function G(e){return(e instanceof Date?e:new Date(e)).toLocaleDateString(void 0,{month:"numeric",day:"numeric",year:"2-digit"})}function Dt(e){return(e instanceof Date?e:new Date(e)).toLocaleDateString(void 0,{weekday:"short",month:"short",day:"numeric",year:"numeric"})}function Xe(e,t=200){let s=null;return(...n)=>{clearTimeout(s),s=setTimeout(()=>e(...n),t)}}function M(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function W(e,t=1800,s={}){let n=document.querySelector(".toast");n&&n.remove();let i=document.createElement("div");i.className="toast",i.textContent=e,s.persistUntilClick?(i.classList.add("toast-clickable"),i.addEventListener("click",()=>i.remove())):setTimeout(()=>i.remove(),t),document.body.appendChild(i)}var Ke=new EventTarget;function F(e,t){Ke.dispatchEvent(new CustomEvent(e,{detail:t}))}function Qe(e,t){return Ke.addEventListener(e,t),()=>Ke.removeEventListener(e,t)}function N({html:e,onMount:t}){let s=document.createElement("div");s.className="sheet-backdrop",s.innerHTML='<div class="sheet"></div>';let n=s.querySelector(".sheet");n.innerHTML=e;let i=Ws();document.body.appendChild(s);function o(){let c=window.visualViewport;if(!c){n.style.maxHeight=`${window.innerHeight-i-10}px`;return}let p=Math.max(window.innerHeight,document.documentElement.clientHeight),S=Math.max(0,p-c.height-c.offsetTop);S>0?(n.style.paddingBottom=`${S}px`,n.style.maxHeight=`${c.height-i-10+S}px`):(n.style.paddingBottom="",n.style.maxHeight=`${c.height-i-10}px`)}o();let r=window.visualViewport;r?.addEventListener("resize",o),r?.addEventListener("scroll",o);function a(){s.remove(),r?.removeEventListener("resize",o),r?.removeEventListener("scroll",o)}return s.dismissSheet=a,s.addEventListener("click",c=>{c.target===s&&a()}),t?.(n,a),a}function Ws(){let e=document.createElement("div");e.style.cssText="position:fixed;top:0;left:0;width:0;height:env(safe-area-inset-top);",document.body.appendChild(e);let t=e.offsetHeight||0;return e.remove(),t}function Ce(){return'<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" style="color: var(--red);"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>'}function At(){return'<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M16 5l-1.42 1.42-1.59-1.59V16h-2V4.83L9.41 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z"/></svg>'}function te(e){return`<div class="empty-state"><div class="empty-icon">!</div><h2>Couldn't load</h2><p>${M(e.message||String(e))}</p></div>`}var we=["Pectorals","Anterior Deltoid","Lateral Deltoid","Posterior Deltoid","Triceps","Biceps","Forearms","Lats","Upper Back","Lower Back","Traps","Quadriceps","Hamstrings","Glutes","Adductors","Abductors","Calves","Abs","Obliques"];function Rs(e){let t=new Map(we.map((s,n)=>[s,n]));return[...e].sort((s,n)=>(t.get(s)??999)-(t.get(n)??999)||s.localeCompare(n))}var Ie=["Barbell","Dumbbell","Machine","Machine Plates","Cable","Bodyweight"];function X(e){let t=e?.equipment,s=e?.name??"";return t&&t!=="Other"?`${s} (${t})`:s}function ie(e){let t=e?[e.equipment,j(e)].filter(Boolean).join(" \xB7 "):"";return`
    <div class="row-main">
      <div class="row-title">${M(e?.name??"Unknown exercise")}</div>
      ${t?`<div class="row-subtitle">${M(t)}</div>`:""}
    </div>
  `}function re(e){return e?`<div class="exercise-count">${e} ${e===1?"set":"sets"}</div>`:""}function qe(e,t){return["All",...Rs(new Set(e.map(n=>j(n))))].map(n=>`<button class="chip${n==="All"&&!t||n===t?" active":""}" data-cat="${M(n)}">${M(n)}</button>`).join("")}var Fs=[["Bench Press (Barbell)","Chest","Barbell"],["Bench Press (Dumbbell)","Chest","Dumbbell"],["Incline Bench Press (Barbell)","Chest","Barbell"],["Incline Bench Press (Dumbbell)","Chest","Dumbbell"],["Decline Bench Press (Barbell)","Chest","Barbell"],["Chest Fly (Dumbbell)","Chest","Dumbbell"],["Chest Fly (Machine)","Chest","Machine"],["Cable Crossover","Chest","Cable"],["Push-Up","Chest","Bodyweight"],["Dip (Chest)","Chest","Bodyweight"],["Deadlift (Conventional)","Back","Barbell"],["Deadlift (Sumo)","Back","Barbell"],["Romanian Deadlift","Back","Barbell"],["Bent-Over Row (Barbell)","Back","Barbell"],["Pendlay Row","Back","Barbell"],["Row (Dumbbell)","Back","Dumbbell"],["T-Bar Row","Back","Barbell"],["Seated Cable Row","Back","Cable"],["Lat Pulldown","Back","Cable"],["Pull-Up","Back","Bodyweight"],["Chin-Up","Back","Bodyweight"],["Face Pull","Back","Cable"],["Shrug (Barbell)","Back","Barbell"],["Shrug (Dumbbell)","Back","Dumbbell"],["Overhead Press (Barbell)","Shoulders","Barbell"],["Overhead Press (Dumbbell)","Shoulders","Dumbbell"],["Seated Shoulder Press (Machine)","Shoulders","Machine"],["Arnold Press","Shoulders","Dumbbell"],["Lateral Raise (Dumbbell)","Shoulders","Dumbbell"],["Lateral Raise (Cable)","Shoulders","Cable"],["Front Raise (Dumbbell)","Shoulders","Dumbbell"],["Rear Delt Fly (Dumbbell)","Shoulders","Dumbbell"],["Reverse Pec Deck","Shoulders","Machine"],["Upright Row","Shoulders","Barbell"],["Barbell Curl","Biceps","Barbell"],["Dumbbell Curl","Biceps","Dumbbell"],["Hammer Curl","Biceps","Dumbbell"],["Preacher Curl","Biceps","Barbell"],["Incline Dumbbell Curl","Biceps","Dumbbell"],["Cable Curl","Biceps","Cable"],["Concentration Curl","Biceps","Dumbbell"],["Close-Grip Bench Press","Triceps","Barbell"],["Tricep Pushdown (Cable)","Triceps","Cable"],["Overhead Tricep Extension (Dumbbell)","Triceps","Dumbbell"],["Overhead Tricep Extension (Cable)","Triceps","Cable"],["Skull Crusher","Triceps","Barbell"],["Dip (Tricep)","Triceps","Bodyweight"],["Tricep Kickback","Triceps","Dumbbell"],["Back Squat","Legs","Barbell"],["Front Squat","Legs","Barbell"],["Goblet Squat","Legs","Dumbbell"],["Bulgarian Split Squat","Legs","Dumbbell"],["Lunge","Legs","Dumbbell"],["Leg Press","Legs","Machine"],["Leg Extension","Legs","Machine"],["Leg Curl (Seated)","Legs","Machine"],["Leg Curl (Lying)","Legs","Machine"],["Hip Thrust (Barbell)","Glutes","Barbell"],["Glute Bridge","Glutes","Bodyweight"],["Cable Kickback","Glutes","Cable"],["Hip Abduction (Machine)","Glutes","Machine"],["Standing Calf Raise","Calves","Machine"],["Seated Calf Raise","Calves","Machine"],["Plank","Core","Bodyweight"],["Hanging Leg Raise","Core","Bodyweight"],["Cable Crunch","Core","Cable"],["Russian Twist","Core","Bodyweight"],["Ab Wheel Rollout","Core","Bodyweight"],["Wrist Curl","Forearms","Dumbbell"],["Reverse Wrist Curl","Forearms","Dumbbell"],["Farmer's Carry","Forearms","Dumbbell"]];function j(e){if(e?.muscle)return e.muscle;let t=(e?.name||"").toLowerCase();return t?/romanian deadlift|\brdl\b|stiff.?leg|good morning|nordic|hamstring/.test(t)||/leg curl/.test(t)?"Hamstrings":/leg extension|sissy squat/.test(t)?"Quadriceps":/calf|tib raise|tibialis/.test(t)?"Calves":/hip adduction|adductor|inner thigh|copenhagen/.test(t)?"Adductors":/hip abduction|abductor|outer thigh|clamshell/.test(t)?"Abductors":/hip thrust|glute|cable kickback|donkey kick|rear kick|frog pump/.test(t)?"Glutes":/squat|leg press|lunge|step.?up/.test(t)?"Quadriceps":/back extension|hyperextension|superman/.test(t)||/deadlift|rack pull/.test(t)?"Lower Back":/lateral raise|side raise|side delt|\blat raise\b|upright row/.test(t)?"Lateral Deltoid":/rear delt|reverse fly|reverse flye|face pull|reverse pec deck/.test(t)?"Posterior Deltoid":/front raise|shoulder press|overhead press|arnold|military press|landmine press|push press|viking press/.test(t)?"Anterior Deltoid":/pulldown|pull.?down|pull.?up|chin.?up|pullover|straight.?arm/.test(t)?"Lats":/shrug/.test(t)?"Traps":/tricep|pushdown|skull ?crusher|close.?grip bench|jm press|french press|bench dip/.test(t)?"Triceps":/wrist curl|reverse curl|forearm|farmer|gripper|dead hang/.test(t)?"Forearms":/bicep|\bcurl\b/.test(t)?"Biceps":/\brow\b|rear pull|high pull/.test(t)?"Upper Back":/bench|chest|\bpec\b|pec deck|crossover|butterfly|push.?up|floor press|squeeze press|\bfly\b|\bflye\b/.test(t)?"Pectorals":/russian twist|woodchop|wood chop|side plank|side bend|oblique|pallof|rotation/.test(t)?"Obliques":/crunch|sit.?up|plank|leg raise|knee raise|ab wheel|ab roll|hanging|toes.?to.?bar|v.?up|dead bug|mountain climber/.test(t)?"Abs":/\bdip\b/.test(t)?"Triceps":e.category||"Other":e?.category||"Other"}var Ns=/\b(bike|biking|treadmill|run|running|cardio|step.?mill|elliptical|stair.?master|stair.?climber|jog|jogging|cycling|spinning|spin class|rowing machine|row machine|\berg\b|sprints?|jump.?rope|skipping rope|swim|swimming|hike|hiking)\b/,js={Quadriceps:"Legs",Hamstrings:"Legs",Adductors:"Legs",Abductors:"Legs",Glutes:"Glutes",Calves:"Calves",Pectorals:"Chest","Anterior Deltoid":"Shoulders","Lateral Deltoid":"Shoulders","Posterior Deltoid":"Shoulders",Lats:"Back","Upper Back":"Back",Traps:"Back","Lower Back":"Back",Biceps:"Biceps",Triceps:"Triceps",Forearms:"Forearms",Abs:"Core",Obliques:"Core"};function Bt(e){let t=(e||"").toLowerCase().trim();if(!t)return"Full Body";if(Ns.test(t))return"Cardio";let s=j({name:t,category:""});return js[s]||"Full Body"}async function Tt(){if((await C("exercises")).length>0)return 0;let t=Date.now(),s=Fs.map(([n,i,o])=>({id:_(),name:n,category:i,equipment:o,notes:"",isCustom:!1,createdAt:t}));return await oe("exercises",s),s.length}var Ct="workout";function It(e){Ct!==e&&(Ct=e,F("tab:changed",e))}var U=["Chest Day","Leg Day","Back/Bi Day"],Pe={"Chest Day":{key:"chest",short:"Chest",cssVar:"--day-chest"},"Leg Day":{key:"leg",short:"Legs",cssVar:"--day-leg"},"Back/Bi Day":{key:"back",short:"Back/Bi",cssVar:"--day-back"}};function He(e){let t=Pe[e];return t?`var(${t.cssVar})`:"var(--text-tertiary)"}function Je(e){if(!e)return null;let t=e.toLowerCase();return t.includes("chest")?"Chest Day":t.includes("leg")&&!t.includes("curl")&&!t.includes("extension")?"Leg Day":t.includes("back")||t.includes("pull")?"Back/Bi Day":t.includes("push")?"Chest Day":null}function Ze(e){for(let t of e){let s=Je(t.name);if(s)return{name:t.name,normalized:s,startedAt:t.startedAt}}return null}function Oe(e){let t=U.indexOf(e);return t===-1?U[0]:U[(t+1)%U.length]}var zs={Pectorals:"#ec4899",Triceps:"#be185d","Anterior Deltoid":"#831843","Lateral Deltoid":"#f9a8d4",Quadriceps:"#facc15",Hamstrings:"#b45309",Glutes:"#f59e0b",Calves:"#fde68a",Adductors:"#bdb76b",Abductors:"#78350f",Lats:"#2563eb","Upper Back":"#38bdf8",Biceps:"#1e40af","Posterior Deltoid":"#bfdbfe",Traps:"#0891b2","Lower Back":"#475569",Forearms:"#22c55e",Abs:"#ef4444",Obliques:"#14b8a6",Other:"#6b7280"};function qt(e){return zs[e]??"#6b7280"}var Vs={Pectorals:"Chest Day",Triceps:"Chest Day","Anterior Deltoid":"Chest Day","Lateral Deltoid":"Chest Day",Quadriceps:"Leg Day",Hamstrings:"Leg Day",Glutes:"Leg Day",Calves:"Leg Day",Adductors:"Leg Day",Abductors:"Leg Day",Lats:"Back/Bi Day","Upper Back":"Back/Bi Day",Biceps:"Back/Bi Day","Posterior Deltoid":"Back/Bi Day",Traps:"Back/Bi Day","Lower Back":"Back/Bi Day",Forearms:"Back/Bi Day"};function Us(e){return Vs[e]??null}function Ys(e,t,s){let n=Je(e);if(n)return n;let i=new Map;for(let a of t){let c=s.get(a.exerciseId);if(!c)continue;let p=Us(j(c));if(!p)continue;let S=(a.weight||0)*(a.reps||0);S<=0||i.set(p,(i.get(p)??0)+S)}let o=null,r=0;for(let[a,c]of i)c>r&&(o=a,r=c);return o}function Pt(e,t,s){let n=[...e].sort((r,a)=>r.startedAt-a.startedAt),i=new Map,o=null;for(let r of n){let a=Ys(r.name,t.get(r.id)??[],s);a||(o?Ot(o.startedAt,r.startedAt)?a=o.day:a=Oe(o.day):a=U[0]),i.set(r.id,a),o={day:a,startedAt:r.startedAt}}return i}function Ht(e){let t=parseInt(e.slice(1),16);return((t>>16&255)*299+(t>>8&255)*587+(t&255)*114)/1e3>=150?"#1c1c1e":"#ffffff"}function Ot(e,t){let s=new Date(e),n=new Date(t);return s.getFullYear()===n.getFullYear()&&s.getMonth()===n.getMonth()&&s.getDate()===n.getDate()}function _s(e,t){let s=Je(t?.name);if(s)return s;let n=Ze(e);return n?Ot(n.startedAt,Date.now())?n.normalized:Oe(n.normalized):U[0]}var Ks="lift-today-day";async function ae(){try{let[e,t]=await Promise.all([ee(),de()]),s=_s(e,t),n=Pe[s].key;document.documentElement.dataset.day!==n&&(document.documentElement.dataset.day=n);try{localStorage.setItem(Ks,n)}catch{}return s}catch{return null}}var Wt="lift-migrations-done-v3";async function et(){let e=await St();e.exercises>0&&console.info(`Removed ${e.exercises} cardio exercise(s), ${e.sets} set(s), ${e.workouts} cardio-only workout(s).`);let t=await $t(Bt);if(t.recategorized>0||t.deleted>0){console.info(`Reorganized "Other": recategorized ${t.recategorized}, removed ${t.deleted} cardio, dropped ${t.workouts} empty workout(s).`);let r=[];t.recategorized>0&&r.push(`sorted ${t.recategorized} exercise${t.recategorized===1?"":"s"}`),t.deleted>0&&r.push(`removed ${t.deleted} cardio`),W(`Cleaned up \u201COther\u201D: ${r.join(", ")}.`)}let s=await kt();s>0&&console.info(`Stripped equipment from ${s} exercise name(s).`);let n=await xt();n>0&&W(`Merged Butterfly into Chest Fly (${n} sets moved).`);let i=await Mt();i>0&&console.info(`Set a per-dose amount on ${i} medication(s).`);let o=await Lt();o.length>0&&(console.info(`Moved ${o.length} exercise(s) off "Other" equipment:
  ${o.join(`
  `)}`),W(`Sorted ${o.length} exercise${o.length===1?"":"s"} out of \u201COther\u201D equipment.`))}async function Rt(){try{if(localStorage.getItem(Wt))return}catch{}await et();try{localStorage.setItem(Wt,String(Date.now()))}catch{}}var pe="lift-backup-passphrase",Nt=25e4,Ft="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";function tt(e){let t=new Uint8Array(e),s="",n=32768;for(let i=0;i<t.length;i+=n)s+=String.fromCharCode.apply(null,t.subarray(i,i+n));return btoa(s)}var st=e=>Uint8Array.from(atob(e),t=>t.charCodeAt(0));function jt(){let t=[...crypto.getRandomValues(new Uint8Array(20))].map(s=>Ft[s%Ft.length]);return[0,5,10,15].map(s=>t.slice(s,s+5).join("")).join("-")}var z=null,nt=()=>{try{return localStorage.getItem(pe)}catch{return null}},ot=e=>{try{localStorage.setItem(pe,e)}catch{}};async function zt(){if(z)return z;let e=nt(),t=null;try{t=await ht(pe)}catch{}if(z=e||t||jt(),z!==e&&ot(z),z!==t)try{await Ae(pe,z)}catch{}return z}function it(){if(z)return z;let e=nt();return e||(e=jt(),ot(e)),z=e,Ae(pe,e).catch(()=>{}),e}function Vt(){return z||nt()}function Ut(e){z=e,ot(e),Ae(pe,e).catch(()=>{})}async function Yt(e,t){let s=await crypto.subtle.importKey("raw",new TextEncoder().encode(e),"PBKDF2",!1,["deriveKey"]);return crypto.subtle.deriveKey({name:"PBKDF2",hash:"SHA-256",salt:t,iterations:Nt},s,{name:"AES-GCM",length:256},!1,["encrypt","decrypt"])}function _t(e){return!!e&&e.lift==="encrypted-backup"&&typeof e.data=="string"}async function Kt(e,t){let s=crypto.getRandomValues(new Uint8Array(16)),n=crypto.getRandomValues(new Uint8Array(12)),i=await Yt(t,s),o=new TextEncoder().encode(JSON.stringify(e)),r=await crypto.subtle.encrypt({name:"AES-GCM",iv:n},i,o);return{lift:"encrypted-backup",v:1,exportedAt:new Date().toISOString(),kdf:{name:"PBKDF2",hash:"SHA-256",iterations:Nt,salt:tt(s)},cipher:"AES-GCM",iv:tt(n),data:tt(r)}}async function rt(e,t){let s=st(e.kdf.salt),n=st(e.iv),i=await Yt(t,s),o;try{o=await crypto.subtle.decrypt({name:"AES-GCM",iv:n},i,st(e.data))}catch{throw new Error("Wrong backup password (or the file is damaged).")}return JSON.parse(new TextDecoder().decode(o))}async function Gs(){let[e,t,s,n,i]=await Promise.all([C("exercises"),C("workouts"),C("sets"),C("stateOfMind"),C("medications")]);return{version:3,exportedAt:new Date().toISOString(),exercises:e,workouts:t,sets:s,stateOfMind:n,medications:i}}function Xs(){let e=new Date,t=s=>String(s).padStart(2,"0");return`lift-backup-${e.getFullYear()}${t(e.getMonth()+1)}${t(e.getDate())}-${t(e.getHours())}${t(e.getMinutes())}${t(e.getSeconds())}.json`}async function at(){let e=await Gs(),t=it(),s=await Kt(e,t),n=JSON.stringify(s),i=new Blob([n],{type:"application/json"}),o=URL.createObjectURL(i),r=Xs(),a=document.createElement("a");return a.href=o,a.download=r,a.style.display="none",document.body.appendChild(a),a.click(),setTimeout(()=>{document.body.removeChild(a),URL.revokeObjectURL(o)},1e3),{filename:r,bytes:i.size,snapshot:e}}async function Qs(e){let t=Vt();if(t)try{return await rt(e,t)}catch{}for(let s=0;s<3;s++){let n=prompt("Enter your backup password (saved in your Passwords app):");if(n==null)throw new Error("Restore cancelled.");try{let i=await rt(e,n.trim());return Ut(n.trim()),i}catch(i){if(s===2)throw i;alert("Wrong password \u2014 try again.")}}}async function Js(e){let t=JSON.parse(await e.text()),s=_t(t)?await Qs(t):t;if(!s||!Array.isArray(s.exercises)||!Array.isArray(s.workouts)||!Array.isArray(s.sets))throw new Error("File doesn't look like a Lift backup.");return await gt({exercises:s.exercises,workouts:s.workouts,sets:s.sets,stateOfMind:s.stateOfMind??[],medications:s.medications??[]}),await et(),{exercises:s.exercises.length,workouts:s.workouts.length,sets:s.sets.length,stateOfMind:(s.stateOfMind??[]).length}}function Gt(){let e=it();N({html:`
      <div class="sheet-header">
        <button class="btn-text" id="bk-close">Done</button>
        <div class="title">Backup & Restore</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">
        <div class="section">Export</div>
        <div class="form-section">
          <button class="list-row button" id="bk-export">
            <div class="row-main"><div class="row-title" style="color: var(--accent);">Download Backup</div></div>
          </button>
        </div>
        <div class="section-footer">
          Saves an <b>encrypted</b> JSON file. In Safari on iPhone, after the download finishes tap the Downloads button \u2192 long-press the file \u2192 <b>Share \u2192 Save to Files</b> \u2192 pick <b>iCloud Drive</b>.
        </div>

        <div class="section">Backup password</div>
        <div class="form-section">
          <div class="stat-row">
            <div class="stat-value" id="bk-pass" style="font-variant-numeric: tabular-nums; letter-spacing: 0.5px; color: var(--text); -webkit-user-select: all; user-select: all;">${M(e)}</div>
            <button class="btn-text primary" id="bk-copy">Copy</button>
          </div>
        </div>
        <div class="section-footer">
          Your backups are encrypted with this password. <b>Save it in your Passwords app</b> \u2014 you need it to restore on another device or after reinstalling. Without it, encrypted backups can't be recovered.
        </div>

        <div class="section">Restore</div>
        <div class="form-section">
          <button class="list-row button destructive" id="bk-import">
            <div class="row-main"><div class="row-title" style="color: var(--red);">Restore from Backup\u2026</div></div>
          </button>
        </div>
        <div class="section-footer">
          <b>Replaces</b> all current data with the chosen backup. Encrypted files prompt for the password (unless this device already has it).
        </div>

        <input type="file" id="bk-file" accept=".json,application/json" style="display: none;" />
      </div>
    `,onMount(t,s){t.querySelector("#bk-close").addEventListener("click",()=>s()),t.querySelector("#bk-copy").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(e),W("Password copied \u2014 save it in your Passwords app")}catch{W("Copy failed \u2014 long-press the password to select it")}}),t.querySelector("#bk-export").addEventListener("click",async()=>{try{let{filename:i,bytes:o}=await at();W(`Exported ${i} (${Zs(o)})`)}catch(i){W(`Export failed: ${i.message}`)}});let n=t.querySelector("#bk-file");t.querySelector("#bk-import").addEventListener("click",()=>{n.value="",n.click()}),n.addEventListener("change",async i=>{let o=i.target.files?.[0];if(o&&confirm("Replace all current data with this backup? This cannot be undone."))try{let r=await Js(o);s(),W(`Restored ${r.workouts} workouts, ${r.exercises} exercises`),F("data:changed")}catch(r){W(`Restore failed: ${r.message}`)}})}})}function Zs(e){return e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/(1024*1024)).toFixed(1)} MB`}var Jt=["Amazed","Excited","Happy","Joyful","Content","Calm","Relieved","Grateful","Hopeful","Confident","Proud","Surprised","Indifferent","Anxious","Stressed","Overwhelmed","Frustrated","Angry","Irritated","Sad","Lonely","Discouraged","Drained","Worried","Embarrassed"],Zt=["Health","Fitness","Self-Care","Hobbies","Identity","Community","Family","Friends","Partner","Work","Education","Money","Weather","Tasks"];function en(e){let t=Number(e);return isFinite(t)?Math.max(-1,Math.min(1,t)):0}async function es({id:e,kind:t,valence:s,labels:n,associations:i,date:o}){let r={id:e||_(),kind:t==="dailyMood"?"dailyMood":"momentaryEmotion",date:o||Date.now(),valence:en(s),labels:n||[],associations:i||[]};return await R("stateOfMind",r),r}async function ts({id:e,nickname:t,form:s,hasSchedule:n,doseAmount:i,doseUnit:o}){let r=(t||"").trim()||"Medication",a=e?await J("medications",e):null,c=Number(i),p={id:e||_(),nickname:r,isArchived:a?!!a.isArchived:!1,hasSchedule:!!n,doseAmount:c>0?c:1,doseUnit:(o||"").trim(),concept:{identifier:a?.concept?.identifier||"",displayText:a?.concept?.displayText||r,form:(s||"").trim(),rxnorm:a?.concept?.rxnorm||[]}};return await R("medications",p),p}async function ct(e,t){await le(e,t)}async function lt(){let[e,t]=await Promise.all([C("stateOfMind"),C("medications")]);return e.sort((s,n)=>s.date-n.date),t.sort((s,n)=>(s.nickname||"").localeCompare(n.nickname||"")),{stateOfMind:e,medications:t}}var Xt=e=>{let t=new Date(e);return`${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`},Qt=e=>e.length?e.reduce((t,s)=>t+s,0)/e.length:null;function ss(e,t){let s=new Set(t.map(a=>Xt(a.startedAt))),n=[],i=[];for(let a of e)(s.has(Xt(a.date))?n:i).push(a.valence);let o=Qt(n),r=Qt(i);return{onWorkout:o,offWorkout:r,delta:o!=null&&r!=null?o-r:null,onCount:n.length,offCount:i.length}}var tn=e=>new Date(e).toLocaleTimeString(void 0,{hour:"numeric",minute:"2-digit"}),as='<span style="font-size: 24px;">+</span>';async function dt(e,t){let s=()=>dt(e,t);e.setTitle("State of Mind"),e.setBack(t),e.setAction({html:as,onClick:()=>is(s)});let[{stateOfMind:n},i]=await Promise.all([lt(),ee()]),o=ss(n,i);e.container.innerHTML=`
    ${n.length?`
      <div class="section">Summary</div>
      <div class="form-section">
        <div class="stat-row"><div class="stat-label">Entries</div><div class="stat-value">${n.length.toLocaleString()}</div></div>
        <div class="stat-row"><div class="stat-label">Range</div><div class="stat-value">${G(n[0].date)} \u2013 ${G(n[n.length-1].date)}</div></div>
        <div class="stat-row"><div class="stat-label">Average mood</div><div class="stat-value">${We(an(n))}</div></div>
      </div>

      <div class="section">Mood vs. training</div>
      <div class="form-section">
        <div class="stat-row"><div class="stat-label">On workout days</div><div class="stat-value">${o.onWorkout!=null?We(o.onWorkout)+` (${o.onCount})`:"\u2014"}</div></div>
        <div class="stat-row"><div class="stat-label">On rest days</div><div class="stat-value">${o.offWorkout!=null?We(o.offWorkout)+` (${o.offCount})`:"\u2014"}</div></div>
        <div class="stat-row"><div class="stat-label">Difference</div><div class="stat-value">${o.delta!=null?(o.delta>=0?"+":"")+o.delta.toFixed(2):"\u2014"}</div></div>
      </div>

      <div class="section">Recent entries</div>
      <div class="list">${n.slice(-30).reverse().map(sn).join("")}</div>
    `:ls("\u{1F9E0}","No mood entries","Tap \uFF0B to log how you're feeling.")}
  `,e.container.scrollTop=0;for(let r of e.container.querySelectorAll("[data-edit-som]")){let a=n.find(c=>c.id===r.dataset.editSom);a&&r.addEventListener("click",()=>is(s,a))}}function sn(e){let t=e.kind==="dailyMood",s=e.labels.length?e.labels.join(", "):t?"Daily mood":"Momentary emotion",n=[...e.labels.length?[t?"Daily mood":"Moment"]:[],G(e.date),tn(e.date),...e.associations.length?[e.associations.join(", ")]:[]].join(" \xB7 ");return`
    <button class="list-row" data-edit-som="${M(e.id)}">
      <div class="row-main">
        <div class="row-title">${M(s)}</div>
        <div class="row-subtitle">${M(n)}</div>
      </div>
      <div class="row-trailing">${We(e.valence)}</div>
      <div class="chevron">\u203A</div>
    </button>`}async function ut(e,t){let s=()=>ut(e,t);e.setTitle("Medications"),e.setBack(t),e.setAction({html:as,onClick:()=>rs(s)});let{medications:n}=await lt();e.container.innerHTML=n.length?`
    <div class="section">Daily</div>
    ${ns(n.filter(o=>o.hasSchedule))}
    ${ns(n.filter(o=>!o.hasSchedule),"As needed")}
    <div class="section-footer">Tap a medication to edit its name, form, or amount.</div>
  `:ls("\u{1F48A}","No medications","Tap \uFF0B to add the medications you take."),e.container.scrollTop=0;let i=new Map(n.map(o=>[o.id,o]));for(let o of e.container.querySelectorAll("[data-edit-med]")){let r=i.get(o.dataset.editMed);r&&o.addEventListener("click",()=>rs(s,r))}}function ns(e,t){return e.length===0?"":`
    ${t?`<div class="section">${M(t)}</div>`:""}
    <div class="list">${e.map(nn).join("")}</div>`}function nn(e){let t=on(e);return`
    <button class="list-row" data-edit-med="${M(e.id)}">
      <div class="row-main">
        <div class="row-title">${M(e.nickname||e.concept.displayText)}</div>
        ${t?`<div class="row-subtitle">${M(t)}</div>`:""}
      </div>
      <div class="chevron">\u203A</div>
    </button>`}function on(e){let t=cs(e),s=(e.concept?.form||"").trim(),n=(e.doseUnit||"").trim();if(s&&t>1&&n&&s.toLowerCase().includes(n.toLowerCase()))return`${ds(t)} \xD7 ${s}`;if(s&&t===1)return s;let i=rn(t,n);return s?`${i} \xB7 ${s}`:i}var cs=e=>Number(e?.doseAmount)>0?Number(e.doseAmount):1;function rn(e,t){let s=(t||"").trim()||"dose",n=e===1||/^(mg|mcg|ml|cc|g|kg|l|oz|iu)$/i.test(s)||s.endsWith("s")?s:`${s}s`;return`${ds(e)} ${n}`}function ls(e,t,s){return`
    <div class="empty-state" style="padding: 48px 24px; min-height: auto;">
      <div class="empty-icon">${e}</div>
      <h2>${M(t)}</h2>
      <p>${M(s)}</p>
    </div>`}function an(e){return e.reduce((t,s)=>t+s.valence,0)/e.length}var ds=e=>Number.isInteger(e)?String(e):String(Number(e.toFixed(3)));function us(e){return e>=.7?["Very pleasant","#2ba758"]:e>=.4?["Pleasant","#54a85a"]:e>=.1?["Slightly pleasant","#9cad46"]:e>-.1?["Neutral","#8a8a8e"]:e>-.4?["Slightly unpleasant","#d99a3c"]:e>-.7?["Unpleasant","#e07a4e"]:["Very unpleasant","#e0574f"]}function We(e){let[t,s]=us(e);return`<span class="hz-pill" style="--pc: ${s};">${M(t)}</span>`}function ps(e){let t=new Date(e),s=n=>String(n).padStart(2,"0");return`${t.getFullYear()}-${s(t.getMonth()+1)}-${s(t.getDate())}T${s(t.getHours())}:${s(t.getMinutes())}`}var cn=()=>ps(Date.now());function ln(e){let t=e?new Date(e).getTime():NaN;return isFinite(t)?t:Date.now()}var dn=e=>Math.max(-3,Math.min(3,Math.round(e*3)));function os(e,t=[]){return e.map(s=>`<button type="button" class="chip${t.includes(s)?" active":""}" data-chip="${M(s)}">${M(s)}</button>`).join("")}function Re(e,t,s={}){for(let n of e.querySelectorAll(`${t} .chip`))n.addEventListener("click",()=>{s.single&&e.querySelectorAll(`${t} .chip`).forEach(i=>i.classList.remove("active")),n.classList.toggle("active",s.single?!0:!n.classList.contains("active"))})}var Fe=(e,t)=>[...e.querySelectorAll(`${t} .chip.active`)].map(s=>s.dataset.chip);function is(e,t=null){let s=!!t,n=s&&t.kind==="dailyMood",i=s?dn(t.valence):1,o=s?t.valence:i/3,r=N({html:`
      <div class="sheet-header">
        <button class="btn-text" id="som-cancel">Cancel</button>
        <div class="title">${s?"Edit Entry":"State of Mind"}</div>
        <button class="btn-text primary" id="som-save">Save</button>
      </div>
      <div class="sheet-content">
        <div class="section">Kind</div>
        <div class="chip-row" id="som-kind">
          <button type="button" class="chip${n?"":" active"}" data-chip="momentaryEmotion">Momentary emotion</button>
          <button type="button" class="chip${n?" active":""}" data-chip="dailyMood">Daily mood</button>
        </div>
        <div class="section">How pleasant?</div>
        <div class="form-section" style="padding: 6px 18px 18px;">
          <div id="som-val-label" style="text-align: center; font-weight: 600; padding: 10px 0;"></div>
          <input type="range" class="mood-slider" id="som-val" min="-3" max="3" step="1" value="${i}" />
        </div>
        <div class="section">Emotions (optional)</div>
        <div class="chip-row" id="som-emotions" style="flex-wrap: wrap;">${os(Jt,s?t.labels:[])}</div>
        <div class="section">What's affecting you? (optional)</div>
        <div class="chip-row" id="som-assoc" style="flex-wrap: wrap;">${os(Zt,s?t.associations:[])}</div>
        <div class="section">When</div>
        <div class="form-section">
          <div class="form-row"><input type="datetime-local" id="som-date" value="${s?ps(t.date):cn()}" style="text-align: left;" /></div>
        </div>
        ${s?`
        <div style="height: 8px;"></div>
        <div class="form-section">
          <button class="list-row button destructive" id="som-delete"><div class="row-main"><div class="row-title" style="color: var(--red);">Delete Entry</div></div></button>
        </div>`:""}
        <div style="height: 16px;"></div>
      </div>
    `,onMount(a){let c=a.querySelector("#som-val"),p=a.querySelector("#som-val-label"),S=()=>{p.textContent=us(Number(c.value)/3)[0]};S(),c.addEventListener("input",()=>{o=Number(c.value)/3,S()}),Re(a,"#som-kind",{single:!0}),Re(a,"#som-emotions"),Re(a,"#som-assoc"),a.querySelector("#som-cancel").addEventListener("click",()=>r()),a.querySelector("#som-save").addEventListener("click",async()=>{await es({id:t?.id,kind:Fe(a,"#som-kind")[0]||"momentaryEmotion",valence:o,labels:Fe(a,"#som-emotions"),associations:Fe(a,"#som-assoc"),date:ln(a.querySelector("#som-date").value)}),r(),W(s?"Entry updated":"Logged State of Mind"),e?.()}),a.querySelector("#som-delete")?.addEventListener("click",async()=>{confirm("Delete this entry?")&&(await ct("stateOfMind",t.id),r(),W("Entry deleted"),e?.())})}})}function rs(e,t=null){let s=!!t,n=s?!!t.hasSchedule:!0,i=N({html:`
      <div class="sheet-header">
        <button class="btn-text" id="med-cancel">Cancel</button>
        <div class="title">${s?"Edit Medication":"Add Medication"}</div>
        <button class="btn-text primary" id="med-save"${s?"":" disabled"}>Save</button>
      </div>
      <div class="sheet-content">
        <div class="section">Name</div>
        <div class="form-section">
          <div class="form-row"><input id="med-name" placeholder="e.g. Sertraline" value="${s?M(t.nickname||t.concept.displayText):""}" style="text-align: left;" /></div>
        </div>
        <div class="section">Form (optional)</div>
        <div class="form-section">
          <div class="form-row"><input id="med-form" placeholder="e.g. tablet, 50 mg" value="${s?M(t.concept?.form||""):""}" style="text-align: left;" /></div>
        </div>
        <div class="section">Amount per dose</div>
        <div class="form-section">
          <div class="form-row"><input type="number" id="med-amount" inputmode="decimal" min="0" step="0.25" value="${s?M(String(cs(t))):"1"}" style="text-align: left;" /></div>
          <div class="form-row"><input id="med-unit" placeholder="unit \u2014 e.g. capsule, tablet, mg" value="${s?M(t.doseUnit||""):""}" style="text-align: left;" /></div>
        </div>
        <div class="section-footer">How many you take at once \u2014 4 capsules, 1 tablet, 10 mg.</div>
        <div class="section">Type</div>
        <div class="chip-row" id="med-type">
          <button type="button" class="chip${n?" active":""}" data-chip="daily">Daily</button>
          <button type="button" class="chip${n?"":" active"}" data-chip="asneeded">As needed</button>
        </div>
        <div class="section-footer">Daily medications are listed first; as-needed ones are grouped separately.</div>
        ${s?`
        <div class="form-section">
          <button class="list-row button destructive" id="med-delete"><div class="row-main"><div class="row-title" style="color: var(--red);">Delete Medication</div></div></button>
        </div>`:""}
        <div style="height: 16px;"></div>
      </div>
    `,onMount(o){let r=o.querySelector("#med-name"),a=o.querySelector("#med-save");r.addEventListener("input",()=>{a.disabled=r.value.trim().length===0}),Re(o,"#med-type",{single:!0}),o.querySelector("#med-cancel").addEventListener("click",()=>i()),a.addEventListener("click",async()=>{r.value.trim()&&(await ts({id:t?.id,nickname:r.value,form:o.querySelector("#med-form").value,hasSchedule:(Fe(o,"#med-type")[0]||"daily")==="daily",doseAmount:o.querySelector("#med-amount").value,doseUnit:o.querySelector("#med-unit").value}),i(),W(s?"Medication updated":"Medication added"),e?.())}),o.querySelector("#med-delete")?.addEventListener("click",async()=>{confirm("Delete this medication?")&&(await ct("medications",t.id),i(),W("Medication deleted"),e?.())}),s||setTimeout(()=>r.focus(),50)}})}var Ne=[{key:"1W",tick:"1W",days:7},{key:"1M",tick:"1M",days:30},{key:"3M",tick:"3M",days:90},{key:"1Y",tick:"1Y",days:365},{key:"All",tick:"All",all:!0}];function un(e){let t=new Map;for(let s of e){let n=new Date(s.date),i=`${n.getFullYear()}-${n.getMonth()}-${n.getDate()}`,o=t.get(i)||{date:s.date,total:0,count:0};o.total+=s.value,o.count+=1,o.date=Math.min(o.date,s.date),t.set(i,o)}return[...t.values()].map(s=>({date:s.date,value:s.total/s.count})).sort((s,n)=>s.date-n.date)}function be(e,t,s={}){let n=t.length>0&&t[0].points!==void 0,i=(n?t:[{points:t}]).map(m=>({label:m.label??"",color:m.color||"var(--accent)",points:un(m.points)})).filter(m=>m.points.length>0),o=s.defaultPeriod||"All",r=Math.max(0,Ne.findIndex(m=>m.key===o)),a=Ne.length-1,c=null;function p(){let m=Ne[r],y=i.map((w,A)=>c===null||A===c?w.points:[]);if(m.all)return y;let B=Date.now()-m.days*864e5,x=y.map(w=>w.filter(A=>A.date>=B));return x.every(w=>w.length===0)?y.map(w=>w.slice(-1)):x}let S=n&&i.some(m=>m.label)?`<div class="chart-legend">${i.map((m,y)=>`<button class="legend-item" data-i="${y}" style="--dcolor: ${m.color};" aria-pressed="false">${m.label}</button>`).join("")}</div>`:"";e.innerHTML=`
    <div class="chart-scrub-readout" data-role="scrub"></div>
    ${S}
    <div class="chart-container" data-role="chart"></div>
    <div class="chart-daterange" data-role="range"></div>
    <div class="chart-slider">
      <input type="range" class="chart-range" min="0" max="${a}" step="1"
             value="${r}" aria-label="Time range" />
      <div class="chart-slider-ticks">
        ${Ne.map((m,y)=>`<span data-i="${y}">${m.tick}</span>`).join("")}
      </div>
    </div>
  `;let D=e.querySelector('[data-role="scrub"]'),l=e.querySelector('[data-role="chart"]'),d=e.querySelector('[data-role="range"]'),b=e.querySelector(".chart-range"),h=[...e.querySelectorAll(".chart-slider-ticks span")],v=s.unit||"lbs",u=null;function g(){let m=p(),y=pn(m,i,v);l.innerHTML=y.html,u=y.geom;let B=m.flat();if(B.length>=2){let x=Math.min(...B.map(A=>A.date)),w=Math.max(...B.map(A=>A.date));d.innerHTML=`<span>${pt(x)}</span><span>${pt(w)}</span>`}else d.innerHTML="";h.forEach((x,w)=>x.classList.toggle("active",w===r))}b.addEventListener("input",()=>{r=Number(b.value),I(),g()});let k=[...e.querySelectorAll(".chart-legend .legend-item")];for(let m of k)m.addEventListener("click",()=>{let y=Number(m.dataset.i);c=c===y?null:y,k.forEach((B,x)=>{B.classList.toggle("dimmed",c!==null&&x!==c),B.setAttribute("aria-pressed",String(c===x))}),I(),g()});function $(m){if(!u||u.pts.length<2)return;let y=l.querySelector("svg"),B=y?.getScreenCTM();if(!B)return;let x=new DOMPoint(m,0).matrixTransform(B.inverse()).x,w=0,A=1/0;u.pts.forEach((T,O)=>{let H=Math.abs(T.x-x);H<A&&(A=H,w=O)});let L=u.pts[w],P=y.querySelector(".chart-scrub-line"),f=y.querySelector(".chart-scrub-dot");P&&(P.setAttribute("x1",L.x),P.setAttribute("x2",L.x),P.removeAttribute("visibility")),f&&(f.setAttribute("cx",L.x),f.setAttribute("cy",L.y),f.style.fill=L.color,f.removeAttribute("visibility"));let E=L.label?` \xB7 ${L.label}`:"";D.textContent=`${pt(L.date)}${E} \xB7 ${Math.round(L.value).toLocaleString()} ${v}`}function I(){D.textContent="";let m=l.querySelector("svg");m?.querySelector(".chart-scrub-line")?.setAttribute("visibility","hidden"),m?.querySelector(".chart-scrub-dot")?.setAttribute("visibility","hidden")}let q=!1;l.addEventListener("pointerdown",m=>{q=!0,l.setPointerCapture?.(m.pointerId),$(m.clientX)}),l.addEventListener("pointermove",m=>{q&&$(m.clientX)});for(let m of["pointerup","pointercancel"])l.addEventListener(m,()=>{q=!1,I()});g()}function pt(e){return new Date(e).toLocaleDateString(void 0,{month:"short",day:"numeric",year:"numeric"})}function pn(e,t,s){let o={top:16,right:14,bottom:14,left:52},r=400-o.left-o.right,a=200-o.top-o.bottom,c=e.flat();if(c.length===0)return{html:`<svg viewBox="0 0 400 200"><text x="${400/2}" y="${200/2}" text-anchor="middle" class="chart-axis-label">No data in range</text></svg>`,geom:null};if(c.length===1){let w=c[0],A=t[e.findIndex(f=>f.length>0)]?.color||"var(--accent)",L=o.left+r/2,P=o.top+a/2;return{html:`<svg viewBox="0 0 400 200"><circle cx="${L}" cy="${P}" r="4" class="chart-point" style="fill: ${A};"/><text x="${L}" y="${P-10}" text-anchor="middle" class="chart-axis-label">${Math.round(w.value).toLocaleString()} ${s}</text></svg>`,geom:null}}let p=c.map(w=>w.date),S=c.map(w=>w.value),D=Math.min(...p),l=Math.max(...p),d=Math.max(...S),b=Math.min(...S),h=Math.max(d-b,1),v=Math.max(0,b-h*.12),u=d+h*.12,g=w=>o.left+(w-D)/Math.max(l-D,1)*r,k=w=>o.top+a-(w-v)/(u-v)*a,$=4,I=w=>Math.round(w).toLocaleString(),q=Array.from({length:$+1},(w,A)=>{let L=v+(u-v)*A/$,P=k(L);return`<text x="${o.left-6}" y="${P+3}" text-anchor="end" class="chart-axis-label">${I(L)}</text>`}).join(""),m=Array.from({length:$+1},(w,A)=>{let L=o.top+a*A/$;return`<line x1="${o.left}" x2="${400-o.right}" y1="${L}" y2="${L}" class="chart-axis-line"/>`}).join(""),y=[],B=e.map((w,A)=>{let L=t[A],P=w.map(f=>({x:g(f.date),y:k(f.value)}));return w.forEach((f,E)=>y.push({...P[E],date:f.date,value:f.value,label:L.label,color:L.color})),P.length===0?"":P.length===1?`<circle cx="${P[0].x}" cy="${P[0].y}" r="3.5" class="chart-point" style="fill: ${L.color};"/>`:`<path d="${fn(P)}" class="chart-line" style="stroke: ${L.color};"/>`}).join("");return{html:`
    <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet">
      ${m}
      ${q}
      ${B}
      <line class="chart-scrub-line" y1="${o.top}" y2="${o.top+a}" x1="0" x2="0" visibility="hidden"/>
      <circle class="chart-scrub-dot" r="4.5" visibility="hidden"/>
    </svg>
  `,geom:{pts:y}}}function fn(e){if(e.length<2)return"";let t=`M ${e[0].x.toFixed(1)} ${e[0].y.toFixed(1)}`;for(let s=0;s<e.length-1;s++){let n=e[s===0?0:s-1],i=e[s],o=e[s+1],r=e[s+2]||o,a=i.x+(o.x-n.x)/6,c=i.y+(o.y-n.y)/6,p=o.x-(r.x-i.x)/6,S=o.y-(r.y-i.y)/6;t+=` C ${a.toFixed(1)} ${c.toFixed(1)}, ${p.toFixed(1)} ${S.toFixed(1)}, ${o.x.toFixed(1)} ${o.y.toFixed(1)}`}return t}var se=null;function ms(e){let t=!0;return vs().then(s=>{t&&(se=s,xe(e))}).catch(s=>{t&&(e.container.innerHTML=te(s))}),()=>{t=!1}}async function vs(){let[e,t,s]=await Promise.all([ee(),C("sets"),C("exercises")]),n=new Map(s.map(b=>[b.id,b])),i=new Map;for(let b of Z(t))i.has(b.workoutId)||i.set(b.workoutId,[]),i.get(b.workoutId).push(b);let o=0,r=0,a=new Map,c=new Map,p=new Map,S=Pt(e,i,n);for(let b of e){let h=i.get(b.id)||[],v=h.reduce((u,g)=>u+g.weight*g.reps,0);if(o+=v,r+=h.length,v>0){let u=S.get(b.id);a.has(u)||a.set(u,[]),a.get(u).push({date:b.startedAt,value:v})}for(let u of h){let g=n.get(u.exerciseId);if(!g)continue;let k=c.get(u.exerciseId)||{id:u.exerciseId,exercise:g,count:0};if(k.count+=1,c.set(u.exerciseId,k),u.weight>0&&u.reps>0){let $=p.get(u.exerciseId);(!$||u.weight>$.weight||u.weight===$.weight&&u.reps>$.reps)&&p.set(u.exerciseId,{id:u.exerciseId,weight:u.weight,reps:u.reps,date:b.startedAt,name:X(g)})}}}let D=Array.from(c.entries()).sort((b,h)=>h[1].count-b[1].count).map(([,b])=>b),l=Array.from(p.values()).sort((b,h)=>h.weight-b.weight),d=U.filter(b=>a.has(b)).map(b=>({label:Pe[b].short,color:He(b),points:a.get(b)}));return{workouts:e,allSets:t,allExercises:s,exMap:n,setsByWorkout:i,totalVolume:o,totalSets:r,volumeSeries:d,topExercises:D,prs:l}}function xe(e){e.setTitle("Progress"),e.setBack(null),e.setAction({label:"Backup and restore",html:At(),onClick:()=>Gt()}),e.container.scrollTop=0;let t=`
    <button class="list-row" data-page="meds">
      <div class="row-main"><div class="row-title">Medications</div></div>
      <div class="chevron">\u203A</div>
    </button>`;if(!se||se.workouts.length===0){e.container.innerHTML=`
      <div class="empty-state" style="padding: 48px 24px; min-height: auto;">
        <div class="empty-icon">\u{1F4C8}</div>
        <h2>No data yet</h2>
        <p>Finish a workout and your stats and trends will show up here.</p>
      </div>
      <div class="list">${t}</div>
    `,fs(e);return}let{workouts:s,totalVolume:n,totalSets:i,volumeSeries:o,topExercises:r,prs:a}=se;e.container.innerHTML=`
    <div class="section">Totals</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Total Volume</div><div class="stat-value">${ue(n)}</div></div>
      <div class="stat-row"><div class="stat-label">Total Sets</div><div class="stat-value">${i.toLocaleString()}</div></div>
    </div>

    ${o.length>0?`
      <div class="section">Workout Volume</div>
      <div class="volume-chart-mount"></div>
    `:""}

    <div class="list" style="margin-top: 16px;">
      <button class="list-row" data-page="trained">
        <div class="row-main">
          <div class="row-title">Most-Trained Exercises</div>
          <div class="row-subtitle">${r.length} tracked</div>
        </div>
        <div class="chevron">\u203A</div>
      </button>
      <button class="list-row" data-page="prs">
        <div class="row-main">
          <div class="row-title">Personal Records</div>
          <div class="row-subtitle">${a.length} exercises</div>
        </div>
        <div class="chevron">\u203A</div>
      </button>
      <button class="list-row" data-page="history">
        <div class="row-main">
          <div class="row-title">Workout History</div>
          <div class="row-subtitle">${s.length} workout${s.length===1?"":"s"}</div>
        </div>
        <div class="chevron">\u203A</div>
      </button>
      ${t}
    </div>
  `;let c=e.container.querySelector(".volume-chart-mount");c&&o.length>0&&be(c,o,{unit:"lbs"}),fs(e)}function fs(e){for(let t of e.container.querySelectorAll("[data-page]"))t.addEventListener("click",()=>{let s=t.dataset.page;s==="trained"?mn(e):s==="prs"?vn(e):s==="history"?hs(e):s==="meds"&&ut(e,()=>xe(e))})}function mn(e){e.setTitle("Most-Trained"),e.setBack(()=>xe(e)),e.setAction(null);let{topExercises:t}=se;e.container.innerHTML=`
    <div class="list" style="margin-top: 16px;">
      ${t.map(s=>`
        <button class="list-row" data-exercise-id="${M(s.id)}">
          ${ie(s.exercise)}
          <div class="row-trailing trailing-stack">${re(s.count)}</div>
          <div class="chevron">\u203A</div>
        </button>
      `).join("")}
    </div>
  `,e.container.scrollTop=0,ft(e)}function vn(e){e.setTitle("Personal Records"),e.setBack(()=>xe(e)),e.setAction(null);let{prs:t}=se;e.container.innerHTML=`
    <div class="section-footer" style="margin-top: 16px;">Heaviest set ever recorded per exercise.</div>
    <div class="list">
      ${t.map(s=>`
        <button class="list-row" data-exercise-id="${M(s.id)}" style="align-items: flex-start;">
          <div class="row-main">
            <div class="row-title">${M(s.name)}</div>
            <div class="row-subtitle">${G(s.date)}</div>
          </div>
          <div class="row-trailing" style="text-align: right;">
            <div style="font-weight: 600; color: var(--text);">${ye(s.weight)} lbs</div>
            <div style="font-size: 12px; color: var(--text-tertiary);">${s.reps} rep${s.reps===1?"":"s"}</div>
          </div>
          <div class="chevron">\u203A</div>
        </button>
      `).join("")}
    </div>
  `,e.container.scrollTop=0,ft(e)}function ft(e){for(let t of e.container.querySelectorAll("[data-exercise-id]"))t.addEventListener("click",()=>{je(t.dataset.exerciseId)})}function hs(e){e.setTitle("Workout History"),e.setBack(()=>xe(e)),e.setAction(null);let{workouts:t,setsByWorkout:s,exMap:n}=se;e.container.innerHTML=`
    <div class="list" style="margin-top: 16px;">
      ${t.map(i=>hn(i,s.get(i.id)||[],n)).join("")}
    </div>
  `,e.container.scrollTop=0;for(let i of e.container.querySelectorAll("[data-workout-id]"))i.addEventListener("click",()=>{let o=i.dataset.workoutId;gn(e,o).catch(r=>{e.container.innerHTML=te(r)})})}function hn(e,t,s){let n=t,i=n.reduce((c,p)=>c+p.weight*p.reps,0),o=(e.endedAt-e.startedAt)/1e3,r=[],a=new Set;for(let c of t){if(a.has(c.exerciseId))continue;a.add(c.exerciseId);let p=s.get(c.exerciseId);if(p&&r.push(p.name),r.length>=3)break}return`
    <button class="list-row" data-workout-id="${e.id}">
      <div class="row-main">
        <div class="row-title" style="font-weight: 600;">${M(e.name)}</div>
        <div class="row-subtitle" style="margin-top: 4px;">
          ${G(e.startedAt)} \xB7 ${Ge(o)} \xB7 ${n.length} sets \xB7 ${ue(i)}
        </div>
        ${r.length>0?`<div class="row-subtitle" style="margin-top: 4px;">${M(r.join(" \xB7 "))}${a.size>3?" \u2026":""}</div>`:""}
      </div>
      <div class="chevron">\u203A</div>
    </button>
  `}async function gs(e){let[t,s,n]=await Promise.all([J("workouts",e),C("exercises"),yt(e)]);if(!t)return null;let i=new Map(s.map(l=>[l.id,l])),o=new Map,r=[];for(let l of n)o.has(l.exerciseId)||(o.set(l.exerciseId,[]),r.push(l.exerciseId)),o.get(l.exerciseId).push(l);let a=Z(n),c=a.reduce((l,d)=>l+d.weight*d.reps,0),p=a.length,S=(t.endedAt-t.startedAt)/1e3,D=`
    <div class="section">Summary</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Date</div><div class="stat-value">${Dt(t.startedAt)}</div></div>
      <div class="stat-row"><div class="stat-label">Duration</div><div class="stat-value">${Ge(S)}</div></div>
      <div class="stat-row"><div class="stat-label">Total Volume</div><div class="stat-value">${ue(c)}</div></div>
      <div class="stat-row"><div class="stat-label">Completed Sets</div><div class="stat-value">${p}</div></div>
    </div>

    ${r.map(l=>{let d=i.get(l),b=o.get(l),h=0,v=0;return`
        ${d?`<button class="section section-link" data-exercise-id="${M(l)}">${M(X(d))}<span class="name-chevron">\u203A</span></button>`:'<div class="section">Unknown exercise</div>'}
        <div class="form-section">
          ${b.map(g=>{let $=(g.setType||"working")==="warmup"?`W${++v}`:String(++h);return`
              <div class="stat-row">
                <div class="stat-label">Set ${$}</div>
                <div class="stat-value hist-edit">
                  <input class="hist-input" type="number" inputmode="decimal" step="0.5" aria-label="Weight in pounds for set ${$}"
                         data-set-id="${g.id}" data-field="weight" value="${g.weight>0?g.weight:""}" placeholder="0" />
                  <span>lbs \xD7</span>
                  <input class="hist-input" type="number" inputmode="numeric" step="1" aria-label="Repetitions for set ${$}"
                         data-set-id="${g.id}" data-field="reps" value="${g.reps>0?g.reps:""}" placeholder="0" />
                </div>
              </div>
            `}).join("")}
        </div>
      `}).join("")}
  `;return{workout:t,html:D,sets:n}}function ys(e,t){for(let s of e.querySelectorAll("input.hist-input[data-set-id]"))s.addEventListener("input",async()=>{let n=t.find(i=>i.id===s.dataset.setId);n&&(s.dataset.field==="weight"?n.weight=parseFloat(s.value)||0:n.reps=parseInt(s.value,10)||0,await R("sets",{...n}))})}async function gn(e,t){e.setBack(async()=>{se=await vs(),hs(e)}),e.setAction({label:"Delete workout",html:Ce(),onClick:async()=>{confirm("Delete this workout?")&&(await Te(t),F("data:changed"))}});let s=await gs(t);if(!s){e.container.innerHTML=te({message:"Workout not found."});return}e.setTitle(s.workout.name),e.container.innerHTML=s.html,e.container.scrollTop=0,ft(e),ys(e.container,s.sets)}async function ws(e){let t=await gs(e);if(!t)return;let s=N({html:`
      <div class="sheet-header">
        <button class="btn-text" id="wd-close">Done</button>
        <div class="title">${M(t.workout.name)}</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">${t.html}</div>
    `,onMount(n){n.querySelector("#wd-close").addEventListener("click",()=>s());for(let i of n.querySelectorAll("[data-exercise-id]"))i.addEventListener("click",()=>je(i.dataset.exerciseId));ys(n,t.sets)}})}function bs(e){let t=!0;return xs(e).catch(s=>{t&&(e.container.innerHTML=te(s))}),()=>{t=!1}}async function xs(e){e.setTitle("Exercises"),e.setBack(null),e.setAction({label:"Add exercise",html:'<span style="font-size: 24px;">+</span>',onClick:()=>{ke(null)}});let[t,s]=await Promise.all([C("exercises"),C("sets")]),n=t.sort((l,d)=>l.name.localeCompare(d.name)),i=new Map;for(let l of s)i.set(l.exerciseId,(i.get(l.exerciseId)??0)+1);let o="",r=null;e.container.innerHTML=`
    <div class="search-bar">
      <input class="search-input" id="ex-search" placeholder="Search exercises" />
    </div>
    <div class="chip-row" id="ex-chips"></div>
    <div class="list" id="ex-list"></div>
  `,e.container.scrollTop=0;let a=e.container.querySelector("#ex-list"),c=e.container.querySelector("#ex-chips"),p=e.container.querySelector("#ex-search");function S(){c.innerHTML=qe(n,r);for(let l of c.querySelectorAll(".chip"))l.addEventListener("click",()=>{let d=l.dataset.cat;r=d==="All"?null:d,S(),D()})}function D(){let l=n.filter(d=>!r||j(d)===r).filter(d=>!o||d.name.toLowerCase().includes(o.toLowerCase()));if(l.length===0){a.innerHTML='<div class="list-row"><div class="row-main" style="color: var(--text-secondary);">No matches</div></div>';return}a.innerHTML=l.map(d=>`
        <button class="list-row" data-id="${d.id}">
          ${ie(d)}
          <div class="row-trailing trailing-stack">${re(i.get(d.id)??0)}</div>
          <div class="chevron">\u203A</div>
        </button>
      `).join("");for(let d of a.querySelectorAll("[data-id]"))d.addEventListener("click",()=>{yn(e,d.dataset.id).catch(b=>{e.container.innerHTML=te(b)})})}p.addEventListener("input",()=>{o=p.value,D()}),S(),D()}function yn(e,t){return ze(e,t,()=>xs(e))}async function ze(e,t,s){e.setBack(s);let n=await Ss(t);if(!n){e.container.innerHTML=te({message:"Exercise not found."});return}e.setTitle(X(n.exercise)),e.setAction(n.exercise.isCustom?{label:"Delete exercise",html:Ce(),onClick:async()=>{if(n.completed.length>0){alert(`Can't delete \u2014 this exercise has ${n.completed.length} logged set${n.completed.length===1?"":"s"}.`);return}confirm("Delete this custom exercise?")&&(await le("exercises",t),F("data:changed"))}}:null),e.container.innerHTML=n.html,e.container.scrollTop=0,e.container.querySelector("#exd-edit")?.addEventListener("click",()=>{ke(n.exercise,()=>ze(e,t,s))}),ks(e.container);let i=e.container.querySelector(".exercise-chart-mount");i&&n.chartData.length>0&&be(i,n.chartData,{unit:"lbs"})}function ks(e){for(let t of e.querySelectorAll(".recent-set[data-workout-id]"))t.addEventListener("click",()=>ws(t.dataset.workoutId))}async function je(e){let t=await Ss(e);if(!t)return;let s=N({html:`
      <div class="sheet-header">
        <button class="btn-text" id="exd-close">Done</button>
        <div class="title">${M(X(t.exercise))}</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">${t.html}</div>
    `,onMount(n){n.querySelector("#exd-close").addEventListener("click",()=>s()),n.querySelector("#exd-edit")?.addEventListener("click",()=>{ke(t.exercise,()=>{s(),F("data:changed"),je(e)})}),ks(n);let i=n.querySelector(".exercise-chart-mount");i&&t.chartData.length>0&&be(i,t.chartData,{unit:"lbs"})}})}async function Ss(e){let[t,s,n,i]=await Promise.all([J("exercises",e),C("sets"),C("workouts"),de()]);if(!t)return null;let o=new Map(n.map(l=>[l.id,l])),r=Z(s).filter(l=>l.exerciseId===e&&l.workoutId!==i?.id&&o.has(l.workoutId)).map(l=>({...l,workout:o.get(l.workoutId)})).sort((l,d)=>l.workout.startedAt-d.workout.startedAt),a=r.reduce((l,d)=>l+d.weight*d.reps,0),c=r.reduce((l,d)=>!l||d.weight>l.weight||d.weight===l.weight&&d.reps>l.reps?d:l,null),p=new Map;for(let l of r){if(l.weight<=0||l.reps<=0||(l.setType||"working")==="warmup")continue;let d=p.get(l.workoutId)||{date:l.workout.startedAt,total:0,count:0};d.total+=l.weight*l.reps,d.count+=1,p.set(l.workoutId,d)}let S=Array.from(p.values()).map(({date:l,total:d,count:b})=>({date:l,value:d/b})).sort((l,d)=>l.date-d.date),D=`
    <div class="section">Details</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Equipment</div><div class="stat-value">${M(t.equipment)}</div></div>
      <div class="stat-row"><div class="stat-label">Muscle</div><div class="stat-value">${M(j(t))}</div></div>
      <button class="list-row button" id="exd-edit">
        <div class="row-main"><div class="row-title" style="color: var(--accent);">Edit Name, Muscle & Equipment</div></div>
      </button>
    </div>

    ${r.length>0?`
      <div class="section">Stats</div>
      <div class="form-section">
        <div class="stat-row"><div class="stat-label">Total Sets</div><div class="stat-value">${r.length.toLocaleString()}</div></div>
        <div class="stat-row"><div class="stat-label">Total Volume</div><div class="stat-value">${ue(a)}</div></div>
        ${c?`<div class="stat-row"><div class="stat-label">Best Set</div><div class="stat-value">${ye(c.weight)} \xD7 ${c.reps}</div></div>`:""}
      </div>
    `:""}

    ${S.length>0?`
      <div class="section">Avg working-set volume per workout</div>
      <div class="exercise-chart-mount"></div>
    `:""}

    ${r.length>0?`
      <div class="section">Recent Sets \xB7 tap to view that workout</div>
      <div class="form-section">
        ${r.slice(-30).reverse().map(l=>`
          <button class="stat-row recent-set" data-workout-id="${M(l.workoutId)}">
            <div class="stat-label" style="font-size: 13px; color: var(--text-secondary);">${G(l.workout.startedAt)}</div>
            <div class="stat-value" style="color: var(--text);">${ye(l.weight)} \xD7 ${l.reps} <span class="name-chevron">\u203A</span></div>
          </button>
        `).join("")}
      </div>
    `:`
      <div class="empty-state" style="padding: 32px 24px;">
        <p style="color: var(--text-secondary);">No completed sets yet.</p>
      </div>
    `}
  `;return{exercise:t,completed:r,chartData:S,html:D}}function Es(e){let t=!0,s=null;return e.container.innerHTML="",de().then(n=>{t&&(n?s=kn(e,n):wn(e))}).catch(n=>{t&&(e.container.innerHTML=`<div class="empty-state"><div class="empty-icon">!</div><h2>Couldn't load</h2><p>${M(n.message)}</p></div>`)}),()=>{t=!1,typeof s=="function"&&s()}}async function wn(e){e.setTitle("Workout");let t=await ee(),s=t[0],n=Ze(t),i=n?Oe(n.normalized):U[0],r=n&&$s(n.startedAt)==="today"?"Tomorrow":"Today",a=s?`<div class="last-workout-hint">Last: <strong>${M(s.name)}</strong> \xB7 ${$s(s.startedAt)}</div>`:"",c=`<div class="next-workout-hint">${r}: <strong>${M(i)}</strong></div>`;e.container.innerHTML=`
    <div class="workout-start">
      <div class="icon">\u{1F3CB}\uFE0F</div>
      <h2>No active workout</h2>
      <p>Start one to begin logging sets.</p>
      ${a}
      ${c}
    </div>
    <div class="action-section">
      <button id="start-btn" class="btn-primary">Start Empty Workout</button>
    </div>
    <div class="list">
      <button class="list-row" data-nav="mind">
        <div class="row-main"><div class="row-title">State of Mind</div></div>
        <div class="chevron">\u203A</div>
      </button>
    </div>
  `,e.container.querySelector("#start-btn").addEventListener("click",()=>bn(i,r));for(let p of e.container.querySelectorAll("[data-nav]"))p.addEventListener("click",()=>dt(e,()=>e.refresh()))}function $s(e){let t=new Date,s=new Date(e),n=o=>new Date(o.getFullYear(),o.getMonth(),o.getDate()).getTime(),i=Math.round((n(t)-n(s))/(1440*60*1e3));return i===0?"today":i===1?"yesterday":i<7?`${i} days ago`:i<14?"a week ago":`${Math.round(i/7)} weeks ago`}function bn(e,t="Today"){xn(e,async s=>{let n={id:_(),name:s,startedAt:Date.now(),endedAt:null,notes:""};await R("workouts",n),F("workout:changed")},t)}function xn(e,t,s="Today"){let i=N({html:`
      <div class="sheet-header">
        <button class="btn-text" id="wt-cancel">Cancel</button>
        <div class="title">New Workout</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">
        <div class="section">Pick a type</div>
        <div class="form-section">
          ${U.map(o=>{let a=o===e?` <span class="badge">${M(s)}</span>`:"";return`
              <button class="list-row button" data-name="${M(o)}">
                <div class="row-main"><div class="row-title" style="color: ${He(o)}; font-weight: 600;">${M(o)}${a}</div></div>
              </button>
            `}).join("")}
        </div>
        <div class="section">Other</div>
        <div class="form-section">
          <div class="form-row">
            <input id="wt-custom" placeholder="e.g. Push Day, Arms" style="text-align: left;" />
          </div>
        </div>
        <div class="action-section">
          <button class="btn-primary" id="wt-go" disabled>Start with custom name</button>
        </div>
      </div>
    `,onMount(o){o.querySelector("#wt-cancel").addEventListener("click",()=>i());for(let c of o.querySelectorAll(".list-row.button[data-name]"))c.addEventListener("click",()=>{let p=c.dataset.name;i(),t(p)});let r=o.querySelector("#wt-custom"),a=o.querySelector("#wt-go");r.addEventListener("input",()=>{a.disabled=r.value.trim().length===0}),a.addEventListener("click",()=>{let c=r.value.trim();c&&(i(),t(c))}),setTimeout(()=>r.focus(),50)}})}function kn(e,t){let s=[],n=[],i=new Map,o=new Map,r=null;e.container.innerHTML=`
    <div class="active-workout">
      <div class="workout-header">
        <input class="workout-name-input" id="wname" value="${M(t.name)}" placeholder="Workout name" />
      </div>
      <div class="workout-progress" id="workout-progress"></div>
      <div id="exercise-sections"></div>
      <div class="action-section">
        <button id="add-exercise-btn" class="btn-secondary">+ Add Exercise</button>
      </div>
      <div class="action-section">
        <button id="finish-btn" class="btn-primary green">Finish Workout</button>
        <button id="discard-btn" class="btn-secondary" style="color: var(--red);">Discard Workout</button>
      </div>
    </div>
    <button id="calc-fab" class="calc-fab" aria-label="Calculator">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2"/>
        <line x1="8" y1="6" x2="16" y2="6"/>
        <line x1="8" y1="11" x2="8" y2="11"/><line x1="12" y1="11" x2="12" y2="11"/><line x1="16" y1="11" x2="16" y2="11"/>
        <line x1="8" y1="15" x2="8" y2="15"/><line x1="12" y1="15" x2="12" y2="15"/><line x1="16" y1="15" x2="16" y2="18"/>
        <line x1="8" y1="18" x2="12" y2="18"/>
      </svg>
    </button>
  `,e.container.querySelector("#calc-fab").addEventListener("click",Tn);let a=()=>{e.setTitle(Et((Date.now()-t.startedAt)/1e3))};a(),r=setInterval(a,1e3);let c=e.container.querySelector("#wname");c.addEventListener("input",async()=>{t.name=c.value,await R("workouts",{...t}),ae()});let p=new Map;e.container.querySelector("#add-exercise-btn").addEventListener("click",()=>{An(s,o,async v=>{await Ln(t,n,v),await S()})}),e.container.querySelector("#finish-btn").addEventListener("click",async()=>{if(confirm("Finish this workout?")){await Dn(t,n);try{let{filename:v}=await at();W(`Saved \xB7 backup: ${v}`)}catch(v){W(`Saved \xB7 backup failed: ${v.message}`)}F("workout:changed")}}),e.container.querySelector("#discard-btn").addEventListener("click",async()=>{confirm("Discard this workout? This cannot be undone.")&&(await Te(t.id),F("workout:changed"))});async function S(){let[v,u,g]=await Promise.all([C("sets"),C("workouts"),C("exercises")]);s=g,n=v.filter(k=>k.workoutId===t.id).sort((k,$)=>k.order-$.order),i=bt(v,u,t.id),p=d(v,g,t.id),o=new Map;for(let k of v)o.set(k.exerciseId,(o.get(k.exerciseId)??0)+1);h(),D()}function D(){let v=new Map(s.map(w=>[w.id,w])),u=[],g=new Map;for(let w of n){let A=v.get(w.exerciseId);if(!A)continue;let L=j(A);if(u.includes(L)||u.push(L),!w.completed)continue;let P=(w.weight||0)*(w.reps||0);P<=0||g.set(L,(g.get(L)??0)+P)}let k=[...g.values()].reduce((w,A)=>w+A,0),$=e.container.querySelector("#workout-progress");if(!$)return;if(u.length===0){$.innerHTML="";return}let I=u.map(w=>{let A=p.get(w)??0,L=g.get(w)??0;return{muscle:w,record:A,cur:L,span:Math.max(A,L)}}),q=Math.max(...I.map(w=>w.span)),m=q>0?q*.12:1;I=I.map(w=>({...w,span:Math.max(w.span,m)}));let y=Math.max(...I.map(w=>w.span)),B=I.map(({muscle:w,record:A,cur:L,span:P})=>{let f=P/y*100,E=L>0?Math.min(100,L/P*100):0,T;if(A>0){let V=Math.round(L/A*100);T=L>A?`${V}% \u{1F525}`:`${V}%`}else T=L>0?"new \u{1F525}":"new";let O=A>0?`${K(L)} / ${K(A)} \xB7 ${T}`:`${K(L)} \xB7 ${T}`,H=qt(w);return`
        <div class="vol-muscle" style="width: ${f.toFixed(2)}%; --mcolor: ${H}; --mtext: ${Ht(H)};" title="${M(w)}: ${K(L)} / record ${K(A)} lbs">
          <div class="vol-fill" style="width: ${E.toFixed(2)}%;"></div>
          <div class="vol-info${E>55?" on-fill":""}">
            <span class="seg-name">${M(w)}</span>
            <span class="seg-vol">${O}</span>
          </div>
        </div>
      `}).join(""),x=`<strong>${K(k)} lbs</strong> total`;$.innerHTML=`
      <div class="vol-bars">${B}</div>
      <div class="vol-label">${x}</div>
    `,requestAnimationFrame(()=>{for(let w of $.querySelectorAll(".vol-muscle"))l(w)})}function l(v){let u=v.querySelector(".seg-name"),g=v.querySelector(".seg-vol"),k=v.clientWidth-4;if(k<=0)return;if(g){let I=10;for(g.style.fontSize=`${I}px`;g.scrollWidth>k&&I>6;)I-=.5,g.style.fontSize=`${I}px`}if(!u)return;u.style.display="";let $=11;for(u.style.fontSize=`${$}px`;u.scrollWidth>k&&$>5;)$-=.5,u.style.fontSize=`${$}px`}function d(v,u,g){let k=new Map(u.map(q=>[q.id,q])),$=new Map,I=new Map;for(let q of Z(v)){if(q.workoutId===g)continue;let m=k.get(q.exerciseId);if(!m)continue;let y=(q.weight||0)*(q.reps||0);if(y<=0)continue;let B=j(m),x=I.get(q.workoutId);x||I.set(q.workoutId,x=new Map),x.set(B,(x.get(B)??0)+y)}for(let q of I.values())for(let[m,y]of q)y>($.get(m)??0)&&$.set(m,y);return $}async function b(v){if(!v.completed||(v.setType||"working")==="warmup"||!(v.weight>0)||!(v.reps>0))return;let u=s.find(y=>y.id===v.exerciseId);if(!u)return;let g=await C("sets"),k=Z(g).filter(y=>y.exerciseId===v.exerciseId&&y.id!==v.id&&(y.setType||"working")!=="warmup"&&y.weight>0&&y.reps>0);if(k.length===0)return;let $=[],I=k.reduce((y,B)=>Math.max(y,B.weight),0);v.weight>I&&$.push(`Heaviest weight ever: ${ge(v.weight)} lbs`);let q=v.weight*v.reps,m=k.reduce((y,B)=>Math.max(y,B.weight*B.reps),0);if(q>m&&$.push(`Most volume in a set: ${ge(v.weight)}\xD7${v.reps} = ${K(q)} lbs`),$.length>0){let y=$.length>1?"New records":"New record";W(`\u{1F3C6} ${X(u)} \u2014 ${y}!
${$.join(`
`)}`,0,{persistUntilClick:!0})}}function h(){let v=new Map(s.map(m=>[m.id,m])),u=[],g=new Map;for(let m of n)g.has(m.exerciseId)||(g.set(m.exerciseId,[]),u.push(m.exerciseId)),g.get(m.exerciseId).push(m);for(let[,m]of g)m.sort((y,B)=>y.order-B.order);let k=e.container.querySelector("#exercise-sections");if(u.length===0){k.innerHTML=`
        <div class="empty-state" style="padding: 40px 24px; min-height: auto;">
          <p style="color: var(--text-secondary);">Add an exercise to start logging sets.</p>
        </div>`;return}k.innerHTML=u.map(m=>{let y=v.get(m),B=g.get(m),x=i.get(m)??new Map;return Sn(y,B,x,o.get(m)??0)}).join("");function $(m){delete m.bumpedBy,delete m.preBumpWeight,delete m.preBumpReps}function I(m){let y=n.filter(L=>L.exerciseId===m.exerciseId).sort((L,P)=>L.order-P.order),B=m.setType||"working",x=0,w=0;for(let L of y)if(w+=1,(L.setType||"working")===B&&(x+=1),L.id===m.id)break;let A=Se(B,x,i.get(m.exerciseId),w);return A&&A.weight>0&&A.reps>0?{weight:A.weight,reps:A.reps}:null}async function q(m){await Ls(m.id,n),m.completed&&await Ms(m,n,I);for(let y of n){if(y.exerciseId!==m.exerciseId)continue;let B=k.querySelector(`.set-row[data-set-id="${y.id}"]`);if(!B)continue;let x=B.querySelector(".weight-input"),w=B.querySelector(".reps-input");x&&document.activeElement!==x&&(x.value=y.weight>0?String(y.weight):""),w&&document.activeElement!==w&&(w.value=y.reps>0?String(y.reps):"")}}for(let m of k.querySelectorAll(".set-row-wrap")){let y=m.querySelector(".set-row"),B=y.dataset.setId,x=n.find(T=>T.id===B);if(!x)continue;let w=y.querySelector(".weight-input"),A=y.querySelector(".reps-input"),L=y.querySelector(".complete-btn");Mn(m,async()=>{await le("sets",x.id),await S()});let P=Xe(async()=>{await q(x),x.completed&&D()},200);w.addEventListener("input",()=>{x.weight=parseFloat(w.value)||0,$(x),R("sets",{...x}).catch(T=>console.error("Set save failed",T)),P()});let f=Xe(async()=>{await q(x),x.completed&&D()},200);A.addEventListener("input",()=>{x.reps=parseInt(A.value,10)||0,$(x),R("sets",{...x}).catch(T=>console.error("Set save failed",T)),f()}),L.addEventListener("click",async()=>{let T=x.completed;x.completed=!x.completed,x.completed&&$(x),await R("sets",x),y.classList.toggle("completed",x.completed),L.innerHTML=Ds(x.completed);let O=y.querySelector(".set-number")?.textContent?.trim()||"";L.setAttribute("aria-label",`${x.completed?"Mark incomplete":"Mark complete"} set ${O}`),D(),!T&&x.completed?(await Ms(x,n,I)&&h(),await b(x)):T&&!x.completed&&await Ls(x.id,n)&&h()});let E=y.querySelector(".set-number");E&&E.addEventListener("click",async()=>{let O=(x.setType||"working")==="warmup"?"working":"warmup";if(x.setType=O,!x.completed){let H=n.filter(ce=>ce.exerciseId===x.exerciseId).sort((ce,Ts)=>ce.order-Ts.order),V=0,fe=0;for(let ce of H)if(fe+=1,(ce.setType||"working")===O&&(V+=1),ce.id===x.id)break;let me=Se(O,V,i.get(x.exerciseId),fe);me&&me.weight>0&&me.reps>0&&(x.weight=me.weight,x.reps=me.reps)}await R("sets",x),h()})}for(let m of k.querySelectorAll(".add-set-btn"))m.addEventListener("click",async()=>{let y=m.dataset.exerciseId;await En(t,n,y,i.get(y)??new Map),await S()});for(let m of k.querySelectorAll(".exercise-menu"))m.addEventListener("click",async()=>{let y=m.dataset.exerciseId;confirm("Remove this exercise from the workout?")&&(await _e("sets",n.filter(B=>B.exerciseId===y).map(B=>B.id)),await S())});for(let m of k.querySelectorAll(".exercise-name-btn"))m.addEventListener("click",()=>{r&&(clearInterval(r),r=null),ze(e,m.dataset.exerciseId,()=>e.refresh())})}return S(),()=>{r&&clearInterval(r)}}function Sn(e,t,s=new Map,n=0){let i=0,o=0,r=t.map((a,c)=>{let p=a.setType||"working",S,D;p==="warmup"?(o+=1,D=o,S=`W${o}`):(i+=1,D=i,S=String(i));let l=Se(p,D,s,c+1);return $n(a,S,l)}).join("");return`
    <div class="exercise-section">
      <div class="exercise-section-header">
        <button class="exercise-name-btn" data-exercise-id="${e?.id}">${ie(e)}</button>
        <div class="row-trailing trailing-stack">${re(n)}</div>
        <button class="menu exercise-menu" data-exercise-id="${e?.id}" aria-label="Remove ${M(X(e))} from workout">\xD7</button>
      </div>
      <div class="set-table-header">
        <div class="col-set">SET</div>
        <div>PREV</div>
        <div>LBS</div>
        <div>REPS</div>
        <div></div>
      </div>
      ${r}
      <button class="add-set-btn" data-exercise-id="${e?.id}">+ Add Set</button>
    </div>
  `}function Se(e,t,s,n=null){if(!s||typeof s.get!="function")return null;let i=s.get(`${e}#${t}`);return i||(n!=null?s.get(`any#${n}`)??null:null)}function $n(e,t,s){let n=e.setType||"working",i=s&&s.weight>0&&s.reps>0?`${ge(s.weight)} \xD7 ${s.reps}`:"\u2014";return`
    <div class="set-row-wrap" data-set-id="${e.id}">
      <button class="set-swipe-delete" data-set-id="${e.id}" aria-label="Delete set ${t}">Delete</button>
      <div class="set-row type-${n}${e.completed?" completed":""}" data-set-id="${e.id}">
        <button class="set-number" aria-label="Set ${t}, tap to mark as ${n==="warmup"?"working":"warmup"}">${t}</button>
        <div class="prev" aria-label="Previous">${i}</div>
        <input class="weight-input" type="number" inputmode="decimal" step="0.5" aria-label="Weight in pounds for set ${t}"
               placeholder="0" value="${e.weight>0?e.weight:""}" />
        <input class="reps-input" type="number" inputmode="numeric" step="1" aria-label="Repetitions for set ${t}"
               placeholder="0" value="${e.reps>0?e.reps:""}" />
        <button class="complete-btn" aria-label="${e.completed?"Mark incomplete":"Mark complete"} set ${t}">${Ds(e.completed)}</button>
      </div>
    </div>
  `}function Mn(e,t){let s=e.querySelector(".set-row"),n=e.querySelector(".set-swipe-delete");if(!s||!n)return;let i=88,o=0,r=0,a=0,c=0,p=!1,S=!1,D=!1,l=!1,d=()=>Math.max(140,o*.5);function b(k,$){s.style.transition=$?"transform 0.18s ease":"none",s.style.transform=`translateX(${k}px)`,n.style.width=`${Math.max(i,-k)}px`,e.classList.toggle("will-delete",k<=-d())}function h(k=!0){D=!1,b(0,k),e.classList.remove("swiped-open")}function v(k=!0){document.querySelectorAll(".set-row-wrap.swiped-open").forEach($=>{if($!==e){let I=$.querySelector(".set-row");I&&(I.style.transition="transform 0.18s ease",I.style.transform="translateX(0)");let q=$.querySelector(".set-swipe-delete");q&&(q.style.width=""),$.classList.remove("swiped-open","will-delete")}}),D=!0,b(-i,k),e.classList.add("swiped-open")}function u(){s.style.transition="transform 0.16s ease-out",s.style.transform=`translateX(${-o}px)`,n.style.width=`${o}px`,setTimeout(t,150)}s.addEventListener("touchstart",k=>{o=e.clientWidth||s.clientWidth,r=k.touches[0].clientX,a=k.touches[0].clientY,c=D?-i:0,p=!0,S=!1,l=!!k.target.closest("input, button, select, textarea")},{passive:!0}),s.addEventListener("touchmove",k=>{if(!p)return;let $=k.touches[0].clientX-r,I=k.touches[0].clientY-a;if(!S){if(Math.abs(I)>Math.abs($)+4){p=!1;return}Math.abs($)>8&&(S=!0,l&&document.activeElement?.blur&&document.activeElement.blur())}if(!S)return;k.cancelable&&k.preventDefault();let q=D?-i:0;c=Math.min(0,Math.max(-o,q+$)),b(c,!1)},{passive:!1});function g(){p&&(p=!1,S&&(c<=-d()?u():c<-i/2?v():h()))}s.addEventListener("touchend",g),s.addEventListener("touchcancel",g),n.addEventListener("click",k=>{k.stopPropagation(),t()})}function Ds(e){return e?'<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>':'<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>'}async function Ln(e,t,s){let n=t.reduce((i,o)=>Math.max(i,o.order),-1)+1;for(let i of s){let o=(await wt(i,e.id)).filter(c=>(c.weight||0)>0&&(c.reps||0)>0),a=(o.length>0?o:[{weight:0,reps:0,setType:"working"}]).map(c=>({id:_(),workoutId:e.id,exerciseId:i,weight:c.weight??0,reps:c.reps??0,setType:c.setType||"working",completed:!1,order:n++,createdAt:Date.now()}));await oe("sets",a)}}async function Ms(e,t,s){let n=(e.weight||0)*(e.reps||0);if(n<=0)return!1;let i=!1;for(let o of t)if(o.exerciseId===e.exerciseId&&o.id!==e.id&&!((o.order??0)<=(e.order??0))&&!o.completed&&(o.weight||0)*(o.reps||0)<n){if(o.bumpedBy==null){let r=s?.(o);o.preBumpWeight=r?r.weight:o.weight,o.preBumpReps=r?r.reps:o.reps}o.bumpedBy=e.id,o.weight=e.weight,o.reps=e.reps,await R("sets",o),i=!0}return i}async function Ls(e,t){let s=!1;for(let n of t)n.bumpedBy===e&&(n.completed||(n.preBumpWeight!=null&&(n.weight=n.preBumpWeight),n.preBumpReps!=null&&(n.reps=n.preBumpReps)),delete n.bumpedBy,delete n.preBumpWeight,delete n.preBumpReps,await R("sets",n),s=!0);return s}async function En(e,t,s,n=new Map){let i=t.filter(h=>h.exerciseId===s),o=i[i.length-1],r=h=>(h?.weight||0)*(h?.reps||0),a=i.filter(h=>(h.setType||"working")!=="warmup"),c=a.length+1,p=Se("working",c,n,i.length+1),S=a.filter(h=>h.weight>0&&h.reps>0).reduce((h,v)=>!h||r(v)>r(h)?v:h,null),D=a.some((h,v)=>{let u=Se("working",v+1,n);return u&&u.weight>0&&u.reps>0&&r(h)>r(u)}),l=o?.weight??0,d=o?.reps??0;S&&(!p||D)&&(l=S.weight,d=S.reps);let b={id:_(),workoutId:e.id,exerciseId:s,weight:l,reps:d,completed:!1,order:(o?.order??-1)+1,createdAt:Date.now()};await R("sets",b)}async function Dn(e,t){await _e("sets",t.filter(s=>!s.completed&&((s.weight||0)===0||(s.reps||0)===0)).map(s=>s.id)),e.endedAt=Date.now(),await R("workouts",e)}function An(e,t,s){let n=new Set,i="",o=null,r=N({html:`
      <div class="sheet-header">
        <button class="btn-text" id="picker-cancel">Cancel</button>
        <div class="title">Add Exercises</div>
        <button class="btn-text primary" id="picker-add" disabled>Add</button>
      </div>
      <div class="search-bar">
        <input class="search-input" id="picker-search" placeholder="Search exercises" />
      </div>
      <div class="chip-row" id="picker-chips"></div>
      <div class="sheet-content">
        <div class="list" id="picker-list"></div>
        <div class="action-section">
          <button class="btn-secondary" id="picker-custom">+ Create Custom Exercise</button>
        </div>
      </div>
    `,onMount(a){let c=a.querySelector("#picker-list"),p=a.querySelector("#picker-add"),S=a.querySelector("#picker-cancel"),D=a.querySelector("#picker-custom"),l=a.querySelector("#picker-search"),d=a.querySelector("#picker-chips");function b(){d.innerHTML=qe(e,o);for(let v of d.querySelectorAll(".chip"))v.addEventListener("click",()=>{let u=v.dataset.cat;o=u==="All"?null:u,b(),h()})}function h(){let v=e.filter(u=>!o||j(u)===o).filter(u=>!i||u.name.toLowerCase().includes(i.toLowerCase())).sort((u,g)=>{let k=t.get(u.id)??0,$=t.get(g.id)??0;return k!==$?$-k:u.name.localeCompare(g.name)});c.innerHTML=v.length===0?'<div class="list-row"><div class="row-main" style="color:var(--text-secondary)">No matches</div></div>':v.map(u=>`
                <button class="list-row" data-id="${u.id}">
                  ${ie(u)}
                  <div class="row-trailing trailing-stack">
                    ${re(t.get(u.id)??0)}
                    ${n.has(u.id)?Bn():""}
                  </div>
                </button>
              `).join("");for(let u of c.querySelectorAll(".list-row[data-id]"))u.addEventListener("click",()=>{let g=u.dataset.id;n.has(g)?n.delete(g):n.add(g),p.disabled=n.size===0,p.textContent=n.size===0?"Add":`Add (${n.size})`,h()})}l.addEventListener("input",()=>{i=l.value,h()}),S.addEventListener("click",()=>r()),p.addEventListener("click",()=>{s(Array.from(n)),r()}),D.addEventListener("click",()=>{ke(null,async v=>{e.push(v),n.add(v.id),b(),h(),p.disabled=!1,p.textContent=`Add (${n.size})`})}),b(),h()}})}function Bn(){return'<svg viewBox="0 0 24 24" width="22" height="22" fill="var(--green)"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'}function ke(e,t){let s=!!e,n=s?j(e):null,i=!n||we.includes(n)?we:[n,...we],o=e?.equipment,r=!o||Ie.includes(o)?Ie:[o,...Ie],a=N({html:`
      <div class="sheet-header">
        <button class="btn-text" id="ce-cancel">Cancel</button>
        <div class="title">${s?"Edit Exercise":"New Exercise"}</div>
        <button class="btn-text primary" id="ce-save" ${s?"":"disabled"}>Save</button>
      </div>
      <div class="sheet-content">
        <div class="section">Name</div>
        <div class="form-section">
          <div class="form-row">
            <input id="ce-name" placeholder="e.g. Cable Lateral Raise" style="text-align: left;" value="${M(e?.name??"")}" />
          </div>
        </div>
        <div class="section">Muscle</div>
        <div class="form-section">
          <div class="form-row">
            <label for="ce-cat">Muscle</label>
            <select id="ce-cat">${i.map(c=>`<option${c===n?" selected":""}>${M(c)}</option>`).join("")}</select>
          </div>
        </div>
        <div class="section">Equipment</div>
        <div class="form-section">
          <div class="form-row">
            <label for="ce-eq">Equipment</label>
            <select id="ce-eq">${r.map(c=>`<option${c===o?" selected":""}>${M(c)}</option>`).join("")}</select>
          </div>
        </div>
      </div>
    `,onMount(c){let p=c.querySelector("#ce-name"),S=c.querySelector("#ce-save");p.addEventListener("input",()=>{S.disabled=p.value.trim().length===0}),c.querySelector("#ce-cancel").addEventListener("click",()=>a()),S.addEventListener("click",async()=>{let D=p.value.trim();if(!D)return;let l=c.querySelector("#ce-cat").value,d=c.querySelector("#ce-eq").value,b=s?{...e,name:D,muscle:l,equipment:d}:{id:_(),name:D,muscle:l,category:l,equipment:d,notes:"",isCustom:!0,createdAt:Date.now()};await R("exercises",b),a(),t?.(b),s||F("data:changed")}),s||setTimeout(()=>p.focus(),50)}})}function Tn(){let t=[["(","open","paren"],[")","close","paren"],["AC","clear","fn"],["\xB1","sign","fn"],["\u232B","back","fn"],["\xF7","op","op"],["7","digit"],["8","digit"],["9","digit"],["\xD7","op","op"],["4","digit"],["5","digit"],["6","digit"],["\u2212","op","op"],["1","digit"],["2","digit"],["3","digit"],["+","op","op"],["0","digit","zero"],[".","dot"],["=","equals","op"]].map(([s,n,i])=>`<button class="calc-key${i?` calc-${i}`:""}" data-action="${n}" data-key="${M(s)}">${M(s)}</button>`).join("");N({html:`
      <div class="sheet-header">
        <span style="width: 60px;"></span>
        <div class="title">Calculator</div>
        <button class="btn-text primary" id="calc-done">Done</button>
      </div>
      <div class="sheet-content">
        <div class="calc-screen">
          <div class="calc-expr" id="calc-expr"></div>
          <div class="calc-result" id="calc-result">0</div>
        </div>
        <div class="calc-grid">${t}</div>
      </div>
    `,onMount(s,n){let i=s.querySelector("#calc-expr"),o=s.querySelector("#calc-result"),r={"+":(f,E)=>f+E,"\u2212":(f,E)=>f-E,"\xD7":(f,E)=>f*E,"\xF7":(f,E)=>E===0?NaN:f/E},a={"+":1,"\u2212":1,"\xD7":2,"\xF7":2},c=f=>f==="+"||f==="\u2212"||f==="\xD7"||f==="\xF7",p=f=>f!=null&&!c(f)&&f!=="(";function S(f){let E=[],T=[];for(let H of f)if(H==="(")T.push(H);else if(H===")"){for(;T.length&&T[T.length-1]!=="(";)E.push(T.pop());if(!T.length)return NaN;T.pop()}else if(c(H)){for(;T.length&&c(T[T.length-1])&&a[T[T.length-1]]>=a[H];)E.push(T.pop());T.push(H)}else{let V=parseFloat(H);if(!isFinite(V))return NaN;E.push(V)}for(;T.length;){let H=T.pop();if(H==="(")return NaN;E.push(H)}let O=[];for(let H of E){if(typeof H=="number"){O.push(H);continue}let V=O.pop(),fe=O.pop();if(fe===void 0||V===void 0)return NaN;O.push(r[H](fe,V))}return O.length===1?O[0]:NaN}let D=f=>f.reduce((E,T,O)=>O===0?T:E+(f[O-1]==="("||T===")"?"":" ")+T,""),l=f=>{if(!isFinite(f))return"Error";let E=parseFloat(f.toFixed(8)).toString();return E.replace("-","").replace(".","").length>12&&(E=f.toPrecision(10).replace(/\.?0+$/,"")),E},d=["0"],b=!1,h=!1,v="",u=()=>d[d.length-1];function g(){i.textContent=h?"":v,o.textContent=h?"Error":D(d);let f=!h&&c(u())?u():null;for(let E of s.querySelectorAll(".calc-op"))E.classList.toggle("selected",E.dataset.key===f)}function k(f){if(h&&(d=["0"],h=!1),b)return d=[f],b=!1,g();u()===")"?d.push("\xD7",f):c(u())||u()==="("?d.push(f):d[d.length-1]=u()==="0"?f:u()+f,g()}function $(){if(h&&(d=["0"],h=!1),b)return d=["0."],b=!1,g();u()===")"?d.push("\xD7","0."):c(u())||u()==="("?d.push("0."):u().includes(".")||(d[d.length-1]=u()+"."),g()}function I(f){h||(b=!1,u()!=="("&&(c(u())?d[d.length-1]=f:d.push(f),g()))}let q=()=>d.filter(f=>f==="(").length-d.filter(f=>f===")").length;function m(){if(h&&(d=["0"],h=!1),b)return d=["("],b=!1,g();d.length===1&&u()==="0"?d=["("]:p(u())?d.push("\xD7","("):d.push("("),g()}function y(){h||b||q()<=0||!p(u())||(d.push(")"),g())}function B(){d=["0"],b=!1,h=!1,g()}function x(){if(h||c(u())||u()==="("||u()===")")return;let f=u();d[d.length-1]=f.startsWith("-")?f.slice(1):f==="0"?"0":"-"+f,g()}function w(){if(h)return B();if(b=!1,c(u())||u()==="("||u()===")")return d.pop(),d.length===0&&(d=["0"]),g();let f=u().slice(0,-1);f===""||f==="-"?d.length>1?d.pop():d=["0"]:d[d.length-1]=f,g()}function A(){if(h)return;let f=d.slice();for(;f.length&&(c(f[f.length-1])||f[f.length-1]==="(");)f.pop();if(!f.some(c))return;for(let T=f.filter(O=>O==="(").length-f.filter(O=>O===")").length;T>0;T--)f.push(")");let E=S(f);if(!isFinite(E))return h=!0,g();v=`${D(f)} =`,d=[l(E)],b=!0,g()}function L(f){let{action:E,key:T}=f.dataset;E!=="equals"&&(v=""),E==="digit"?k(T):E==="open"?m():E==="close"?y():E==="dot"?$():E==="clear"?B():E==="sign"?x():E==="back"?w():E==="op"?I(T):E==="equals"&&A()}let P=null;for(let f of s.querySelectorAll(".calc-key"))f.addEventListener("pointerdown",E=>{E.preventDefault(),P=f,f.classList.add("pressed")}),f.addEventListener("pointerup",E=>{E.preventDefault(),f.classList.remove("pressed"),P===f&&L(f),P=null}),f.addEventListener("pointercancel",()=>{f.classList.remove("pressed"),P=null}),f.addEventListener("pointerleave",()=>f.classList.remove("pressed"));s.querySelector("#calc-done").addEventListener("click",()=>n())}})}function Le(){let e=window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===!0,t;e?t=Math.max(window.innerHeight||0,window.visualViewport?.height||0,window.screen?.height||0):t=window.visualViewport?.height||window.innerHeight,document.documentElement.style.setProperty("--app-height",`${t}px`)}Le();window.addEventListener("resize",Le);window.addEventListener("orientationchange",Le);window.addEventListener("pageshow",Le);window.visualViewport?.addEventListener("resize",Le);var As={workout:{title:"Workout",render:Es},exercises:{title:"Exercises",render:bs},progress:{title:"Progress",render:ms}},$e=document.getElementById("view-content"),Cn=document.getElementById("nav-title"),Bs=document.getElementById("nav-back"),Q=document.getElementById("nav-action"),Me="workout",mt=null,Ye=null,Ue=null,Ve={container:$e,setTitle(e){Cn.textContent=e},setAction(e){if(!e){Q.hidden=!0,Q.innerHTML="",Q.removeAttribute("aria-label"),Ye=null;return}Q.hidden=!1,e.label?Q.setAttribute("aria-label",e.label):Q.removeAttribute("aria-label"),e.html?Q.innerHTML=e.html:Q.textContent=e.label??"",Ye=e.onClick},setBack(e){mt=e,Bs.hidden=!e},refresh(){Ee(Me)},toast(e){W(e)}};function In(){if(typeof Ue=="function")try{Ue()}catch(e){console.error(e)}Ue=null}function Ee(e){Me=e,It(e),document.querySelectorAll(".tab").forEach(t=>{t.setAttribute("aria-selected",String(t.dataset.tab===e))}),In(),Ve.setTitle(As[e].title),Ve.setAction(null),Ve.setBack(null),$e.innerHTML="",$e.scrollTop=0;try{Ue=As[e].render(Ve)}catch(t){console.error("Render failed",t),$e.innerHTML=`<div class="empty-state"><div class="empty-icon">!</div><h2>Render error</h2><p>${M(t.message)}</p></div>`}}document.querySelectorAll(".tab").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll(".sheet-backdrop").forEach(t=>t.dismissSheet?.()),Ee(e.dataset.tab)})});Bs.addEventListener("click",()=>{mt&&mt()});Q.addEventListener("click",()=>{Ye&&Ye()});(function(){let t='button, [role="button"], a[href]',s=null,n=0,i=0,o=()=>{s&&(s.classList.remove("pressed"),s=null)};document.addEventListener("pointerdown",r=>{let a=r.target.closest?.(t);s&&s!==a&&o(),!(!a||a.disabled||a.classList.contains("calc-key"))&&(s=a,n=r.clientX,i=r.clientY,a.classList.add("pressed"))},{passive:!0}),document.addEventListener("pointermove",r=>{s&&(Math.abs(r.clientX-n)>8||Math.abs(r.clientY-i)>8)&&o()},{passive:!0}),document.addEventListener("pointerup",o,{passive:!0}),document.addEventListener("pointercancel",o,{passive:!0}),window.addEventListener("scroll",o,{passive:!0,capture:!0})})();Qe("data:changed",()=>{ae(),Ee(Me)});Qe("workout:changed",()=>{ae(),Me==="workout"&&Ee(Me)});document.addEventListener("visibilitychange",()=>{document.visibilityState==="visible"&&ae()});async function qn(){try{await Y(),await zt().catch(t=>console.warn("Passphrase check failed:",t));let e=await Tt();e>0&&console.info(`Seeded ${e} exercises.`),await Rt(),Ee("workout"),ae()}catch(e){console.error("Init failed:",e),$e.innerHTML=`
      <div class="empty-state">
        <div class="empty-icon">!</div>
        <h2>Storage unavailable</h2>
        <p>${M(e.message??String(e))}</p>
        <p>If you are running this from a <code>file://</code> URL, serve it through a local web server instead.</p>
      </div>`}}qn();
