var Es="lift";var pt=["exercises","workouts","sets","stateOfMind","medications","doseEvents"],$e=null;function j(){return $e?Promise.resolve($e):new Promise((e,t)=>{let s=indexedDB.open(Es,4);s.onerror=()=>t(s.error),s.onsuccess=()=>{$e=s.result,e($e)},s.onupgradeneeded=()=>{let o=s.result;if(!o.objectStoreNames.contains("exercises")){let i=o.createObjectStore("exercises",{keyPath:"id"});i.createIndex("name","name",{unique:!1}),i.createIndex("category","category",{unique:!1})}if(o.objectStoreNames.contains("workouts")||o.createObjectStore("workouts",{keyPath:"id"}).createIndex("startedAt","startedAt",{unique:!1}),!o.objectStoreNames.contains("sets")){let i=o.createObjectStore("sets",{keyPath:"id"});i.createIndex("workoutId","workoutId",{unique:!1}),i.createIndex("exerciseId","exerciseId",{unique:!1})}if(o.objectStoreNames.contains("stateOfMind")||o.createObjectStore("stateOfMind",{keyPath:"id"}).createIndex("date","date",{unique:!1}),o.objectStoreNames.contains("medications")||o.createObjectStore("medications",{keyPath:"id"}),!o.objectStoreNames.contains("doseEvents")){let i=o.createObjectStore("doseEvents",{keyPath:"id"});i.createIndex("medicationId","medicationId",{unique:!1}),i.createIndex("date","date",{unique:!1})}}})}function ue(e){return new Promise((t,s)=>{e.onsuccess=()=>t(e.result),e.onerror=()=>s(e.error)})}async function pe(e,t="readonly"){return(await j()).transaction(e,t).objectStore(e)}function te(e,t,s){return new Promise((o,i)=>{let n=e.transaction(t,"readwrite"),r;try{r=s(n)}catch(a){try{n.abort()}catch{}i(a);return}n.oncomplete=()=>o(r),n.onerror=()=>i(n.error),n.onabort=()=>i(n.error)})}async function A(e){return ue((await pe(e)).getAll())}async function fe(e,t){return ue((await pe(e)).get(t))}async function q(e,t){return await ue((await pe(e,"readwrite")).put(t)),t}async function Y(e,t){let s=await j();return te(s,e,o=>{let i=o.objectStore(e);for(let n of t)i.put(n)})}async function re(e,t){return ue((await pe(e,"readwrite")).delete(t))}async function Ve(e,t){if(t.length===0)return;let s=await j();return te(s,e,o=>{let i=o.objectStore(e);for(let n of t)i.delete(n)})}async function Me(e,t,s){let o=await pe(e);return ue(o.index(t).getAll(s))}async function ft(e){let t=await j();return te(t,pt,s=>{for(let o of pt){let i=s.objectStore(o);i.clear();for(let n of e[o]??[])i.put(n)}})}function X(e){let t=new Set;for(let s of e)s.completed&&t.add(s.workoutId);return e.filter(s=>s.completed||!t.has(s.workoutId))}async function ae(){return(await A("workouts")).find(t=>!t.endedAt)??null}async function J(){return(await A("workouts")).filter(t=>t.endedAt).sort((t,s)=>s.startedAt-t.startedAt)}async function mt(e){return(await Me("sets","workoutId",e)).sort((s,o)=>s.order-o.order)}async function Ls(e){return await Me("sets","exerciseId",e)}async function vt(e,t=null){let s=await Ls(e),o=new Map;for(let r of s)t&&r.workoutId===t||(o.has(r.workoutId)||o.set(r.workoutId,[]),o.get(r.workoutId).push(r));if(o.size===0)return[];let n=(await Promise.all(Array.from(o.keys()).map(r=>fe("workouts",r)))).filter(Boolean).sort((r,a)=>(a.startedAt??0)-(r.startedAt??0));return n.length===0?[]:o.get(n[0].id).sort((r,a)=>r.order-a.order)}function ht(e,t,s=null){let o=new Map(t.map(r=>[r.id,r.startedAt??0])),i=new Map;for(let r of e){if(r.workoutId===s||!o.has(r.workoutId)||(r.weight||0)<=0||(r.reps||0)<=0)continue;let a=i.get(r.exerciseId);a||i.set(r.exerciseId,a=new Map);let l=a.get(r.workoutId);l||a.set(r.workoutId,l=[]),l.push(r)}let n=new Map;for(let[r,a]of i){let l=[...a.keys()].sort((b,$)=>o.get($)-o.get(b)),u=new Map;for(let b of l){let $=a.get(b).sort((E,v)=>E.order-v.order),d=$.every(E=>E.setType==null),f=0,w=0;$.forEach((E,v)=>{if(d){let x=`any#${v+1}`;u.has(x)||u.set(x,E);return}let m=E.setType||"working",M=m==="warmup"?w+=1:f+=1,k=`${m}#${M}`;u.has(k)||u.set(k,E)})}n.set(r,u)}return n}var Ds={barbell:"Barbell",dumbbell:"Dumbbell",machine:"Machine",cable:"Cable",bodyweight:"Bodyweight",kettlebell:"Kettlebell",band:"Bands",bands:"Bands"},As=/\s*\((barbell|dumbbell|machine|cable|bodyweight|kettlebell|bands?)\)$|\s+(Machine|Barbell|Dumbbell|Cable|Kettlebell)$/i;async function Ts(e,t){let s=await j(),o=await Me("sets","exerciseId",e);return te(s,["sets","exercises"],i=>{let n=i.objectStore("sets");for(let r of o)n.put({...r,exerciseId:t});return i.objectStore("exercises").delete(e),o.length})}async function yt(){let e=await A("exercises"),t=e.filter(n=>/butterfly/i.test(n.name||""));if(t.length===0)return 0;let s=e.filter(n=>/chest fly/i.test(n.name||"")&&!t.some(r=>r.id===n.id)),o=s.find(n=>(n.equipment||"")==="Machine")||s[0],i=0;for(let n of t)o?i+=await Ts(n.id,o.id):await q("exercises",{...n,name:"Chest Fly",equipment:"Machine"});return i}async function gt(){let e=await A("exercises"),t=[];for(let s of e){let o=(s.name||"").match(As);if(!o)continue;let i=s.name.slice(0,o.index).trim();if(!i||/smith$/i.test(i))continue;let n=(o[1]||o[2]).toLowerCase();t.push({...s,name:i,equipment:Ds[n]||s.equipment})}return t.length>0&&await Y("exercises",t),t.length}async function wt(){let[e,t,s]=await Promise.all([A("exercises"),A("sets"),A("workouts")]),o=new Set(e.filter(u=>u.category==="Cardio").map(u=>u.id));if(o.size===0)return{exercises:0,sets:0,workouts:0};let i=t.filter(u=>o.has(u.exerciseId)),n=new Map;for(let u of t)o.has(u.exerciseId)||n.set(u.workoutId,(n.get(u.workoutId)||0)+1);let r=new Set(i.map(u=>u.workoutId)),a=s.filter(u=>r.has(u.id)&&!n.get(u.id)),l=await j();return await te(l,["exercises","sets","workouts"],u=>{let b=u.objectStore("exercises"),$=u.objectStore("sets"),d=u.objectStore("workouts");for(let f of o)b.delete(f);for(let f of i)$.delete(f.id);for(let f of a)d.delete(f.id)}),{exercises:o.size,sets:i.length,workouts:a.length}}async function bt(e){let[t,s,o]=await Promise.all([A("exercises"),A("sets"),A("workouts")]),i=t.filter(d=>d.category==="Other");if(i.length===0)return{recategorized:0,deleted:0,workouts:0};let n=[],r=new Set;for(let d of i){let f=e(d.name);f==="Cardio"?r.add(d.id):n.push({...d,category:f&&f!=="Other"?f:"Full Body"})}let a=s.filter(d=>r.has(d.exerciseId)),l=new Map;for(let d of s)r.has(d.exerciseId)||l.set(d.workoutId,(l.get(d.workoutId)||0)+1);let u=new Set(a.map(d=>d.workoutId)),b=o.filter(d=>u.has(d.id)&&!l.get(d.id)),$=await j();return await te($,["exercises","sets","workouts"],d=>{let f=d.objectStore("exercises"),w=d.objectStore("sets"),E=d.objectStore("workouts");for(let v of n)f.put(v);for(let v of r)f.delete(v);for(let v of a)w.delete(v.id);for(let v of b)E.delete(v.id)}),{recategorized:n.length,deleted:r.size,workouts:b.length}}async function Ee(e){let t=await j(),s=await Me("sets","workoutId",e);return te(t,["workouts","sets"],o=>{o.objectStore("workouts").delete(e);let i=o.objectStore("sets");for(let n of s)i.delete(n.id)})}var F=()=>crypto&&crypto.randomUUID?crypto.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,e=>{let t=Math.random()*16|0;return(e==="x"?t:t&3|8).toString(16)});function me(e){return e==null?"0":Math.abs(e-Math.round(e))<.001?String(Math.round(e)):e.toFixed(1)}function ve(e){return`${me(e)} lbs`}function kt(e){let t=Math.max(0,Math.floor(e)),s=Math.floor(t/3600),o=Math.floor(t%3600/60),i=t%60;return s>0?`${s}:${String(o).padStart(2,"0")}:${String(i).padStart(2,"0")}`:`${o}:${String(i).padStart(2,"0")}`}function _e(e){let t=Math.max(0,Math.floor(e)),s=Math.floor(t/3600),o=Math.floor(t%3600/60);return s>0?`${s}h ${o}m`:`${o}m`}function K(e){return Math.round(e).toLocaleString()}function ce(e){return`${K(e)} lbs`}function z(e){return(e instanceof Date?e:new Date(e)).toLocaleDateString(void 0,{month:"numeric",day:"numeric",year:"2-digit"})}function xt(e){return(e instanceof Date?e:new Date(e)).toLocaleDateString(void 0,{weekday:"short",month:"short",day:"numeric",year:"numeric"})}function Ye(e,t=200){let s=null;return(...o)=>{clearTimeout(s),s=setTimeout(()=>e(...o),t)}}function S(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function I(e,t=1800,s={}){let o=document.querySelector(".toast");o&&o.remove();let i=document.createElement("div");i.className="toast",i.textContent=e,s.persistUntilClick?(i.classList.add("toast-clickable"),i.addEventListener("click",()=>i.remove())):setTimeout(()=>i.remove(),t),document.body.appendChild(i)}var Ue=new EventTarget;function W(e,t){Ue.dispatchEvent(new CustomEvent(e,{detail:t}))}function Ke(e,t){return Ue.addEventListener(e,t),()=>Ue.removeEventListener(e,t)}function H({html:e,onMount:t}){let s=document.createElement("div");s.className="sheet-backdrop",s.innerHTML='<div class="sheet"></div>';let o=s.querySelector(".sheet");o.innerHTML=e;let i=Bs();document.body.appendChild(s);function n(){let l=window.visualViewport;if(!l){o.style.maxHeight=`${window.innerHeight-i-10}px`;return}let u=Math.max(window.innerHeight,document.documentElement.clientHeight),b=Math.max(0,u-l.height-l.offsetTop);b>0?(o.style.paddingBottom=`${b}px`,o.style.maxHeight=`${l.height-i-10+b}px`):(o.style.paddingBottom="",o.style.maxHeight=`${l.height-i-10}px`)}n();let r=window.visualViewport;r?.addEventListener("resize",n),r?.addEventListener("scroll",n);function a(){s.remove(),r?.removeEventListener("resize",n),r?.removeEventListener("scroll",n)}return s.dismissSheet=a,s.addEventListener("click",l=>{l.target===s&&a()}),t?.(o,a),a}function Bs(){let e=document.createElement("div");e.style.cssText="position:fixed;top:0;left:0;width:0;height:env(safe-area-inset-top);",document.body.appendChild(e);let t=e.offsetHeight||0;return e.remove(),t}function Le(){return'<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" style="color: var(--red);"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>'}function St(){return'<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M16 5l-1.42 1.42-1.59-1.59V16h-2V4.83L9.41 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z"/></svg>'}function Z(e){return`<div class="empty-state"><div class="empty-icon">!</div><h2>Couldn't load</h2><p>${S(e.message||String(e))}</p></div>`}var he=["Pectorals","Anterior Deltoid","Lateral Deltoid","Posterior Deltoid","Triceps","Biceps","Forearms","Lats","Upper Back","Lower Back","Traps","Quadriceps","Hamstrings","Glutes","Adductors","Abductors","Calves","Abs","Obliques"];function Cs(e){let t=new Map(he.map((s,o)=>[s,o]));return[...e].sort((s,o)=>(t.get(s)??999)-(t.get(o)??999)||s.localeCompare(o))}var De=["Barbell","Dumbbell","Machine","Cable","Bodyweight","Other"];function G(e){let t=e?.equipment,s=e?.name??"";return t&&t!=="Other"?`${s} (${t})`:s}function se(e){let t=e?[e.equipment,R(e)].filter(Boolean).join(" \xB7 "):"";return`
    <div class="row-main">
      <div class="row-title">${S(e?.name??"Unknown exercise")}</div>
      ${t?`<div class="row-subtitle">${S(t)}</div>`:""}
    </div>
  `}function oe(e){return e?`<div class="exercise-count">${e} ${e===1?"set":"sets"}</div>`:""}function Ae(e,t){return["All",...Cs(new Set(e.map(o=>R(o))))].map(o=>`<button class="chip${o==="All"&&!t||o===t?" active":""}" data-cat="${S(o)}">${S(o)}</button>`).join("")}var Is=[["Bench Press (Barbell)","Chest","Barbell"],["Bench Press (Dumbbell)","Chest","Dumbbell"],["Incline Bench Press (Barbell)","Chest","Barbell"],["Incline Bench Press (Dumbbell)","Chest","Dumbbell"],["Decline Bench Press (Barbell)","Chest","Barbell"],["Chest Fly (Dumbbell)","Chest","Dumbbell"],["Chest Fly (Machine)","Chest","Machine"],["Cable Crossover","Chest","Cable"],["Push-Up","Chest","Bodyweight"],["Dip (Chest)","Chest","Bodyweight"],["Deadlift (Conventional)","Back","Barbell"],["Deadlift (Sumo)","Back","Barbell"],["Romanian Deadlift","Back","Barbell"],["Bent-Over Row (Barbell)","Back","Barbell"],["Pendlay Row","Back","Barbell"],["Row (Dumbbell)","Back","Dumbbell"],["T-Bar Row","Back","Barbell"],["Seated Cable Row","Back","Cable"],["Lat Pulldown","Back","Cable"],["Pull-Up","Back","Bodyweight"],["Chin-Up","Back","Bodyweight"],["Face Pull","Back","Cable"],["Shrug (Barbell)","Back","Barbell"],["Shrug (Dumbbell)","Back","Dumbbell"],["Overhead Press (Barbell)","Shoulders","Barbell"],["Overhead Press (Dumbbell)","Shoulders","Dumbbell"],["Seated Shoulder Press (Machine)","Shoulders","Machine"],["Arnold Press","Shoulders","Dumbbell"],["Lateral Raise (Dumbbell)","Shoulders","Dumbbell"],["Lateral Raise (Cable)","Shoulders","Cable"],["Front Raise (Dumbbell)","Shoulders","Dumbbell"],["Rear Delt Fly (Dumbbell)","Shoulders","Dumbbell"],["Reverse Pec Deck","Shoulders","Machine"],["Upright Row","Shoulders","Barbell"],["Barbell Curl","Biceps","Barbell"],["Dumbbell Curl","Biceps","Dumbbell"],["Hammer Curl","Biceps","Dumbbell"],["Preacher Curl","Biceps","Barbell"],["Incline Dumbbell Curl","Biceps","Dumbbell"],["Cable Curl","Biceps","Cable"],["Concentration Curl","Biceps","Dumbbell"],["Close-Grip Bench Press","Triceps","Barbell"],["Tricep Pushdown (Cable)","Triceps","Cable"],["Overhead Tricep Extension (Dumbbell)","Triceps","Dumbbell"],["Overhead Tricep Extension (Cable)","Triceps","Cable"],["Skull Crusher","Triceps","Barbell"],["Dip (Tricep)","Triceps","Bodyweight"],["Tricep Kickback","Triceps","Dumbbell"],["Back Squat","Legs","Barbell"],["Front Squat","Legs","Barbell"],["Goblet Squat","Legs","Dumbbell"],["Bulgarian Split Squat","Legs","Dumbbell"],["Lunge","Legs","Dumbbell"],["Leg Press","Legs","Machine"],["Leg Extension","Legs","Machine"],["Leg Curl (Seated)","Legs","Machine"],["Leg Curl (Lying)","Legs","Machine"],["Hip Thrust (Barbell)","Glutes","Barbell"],["Glute Bridge","Glutes","Bodyweight"],["Cable Kickback","Glutes","Cable"],["Hip Abduction (Machine)","Glutes","Machine"],["Standing Calf Raise","Calves","Machine"],["Seated Calf Raise","Calves","Machine"],["Plank","Core","Bodyweight"],["Hanging Leg Raise","Core","Bodyweight"],["Cable Crunch","Core","Cable"],["Russian Twist","Core","Bodyweight"],["Ab Wheel Rollout","Core","Other"],["Wrist Curl","Forearms","Dumbbell"],["Reverse Wrist Curl","Forearms","Dumbbell"],["Farmer's Carry","Forearms","Dumbbell"]];function R(e){if(e?.muscle)return e.muscle;let t=(e?.name||"").toLowerCase();return t?/romanian deadlift|\brdl\b|stiff.?leg|good morning|nordic|hamstring/.test(t)||/leg curl/.test(t)?"Hamstrings":/leg extension|sissy squat/.test(t)?"Quadriceps":/calf|tib raise|tibialis/.test(t)?"Calves":/hip adduction|adductor|inner thigh|copenhagen/.test(t)?"Adductors":/hip abduction|abductor|outer thigh|clamshell/.test(t)?"Abductors":/hip thrust|glute|cable kickback|donkey kick|rear kick|frog pump/.test(t)?"Glutes":/squat|leg press|lunge|step.?up/.test(t)?"Quadriceps":/back extension|hyperextension|superman/.test(t)||/deadlift|rack pull/.test(t)?"Lower Back":/lateral raise|side raise|side delt|\blat raise\b|upright row/.test(t)?"Lateral Deltoid":/rear delt|reverse fly|reverse flye|face pull|reverse pec deck/.test(t)?"Posterior Deltoid":/front raise|shoulder press|overhead press|arnold|military press|landmine press|push press|viking press/.test(t)?"Anterior Deltoid":/pulldown|pull.?down|pull.?up|chin.?up|pullover|straight.?arm/.test(t)?"Lats":/shrug/.test(t)?"Traps":/tricep|pushdown|skull ?crusher|close.?grip bench|jm press|french press|bench dip/.test(t)?"Triceps":/wrist curl|reverse curl|forearm|farmer|gripper|dead hang/.test(t)?"Forearms":/bicep|\bcurl\b/.test(t)?"Biceps":/\brow\b|rear pull|high pull/.test(t)?"Upper Back":/bench|chest|\bpec\b|pec deck|crossover|butterfly|push.?up|floor press|squeeze press|\bfly\b|\bflye\b/.test(t)?"Pectorals":/russian twist|woodchop|wood chop|side plank|side bend|oblique|pallof|rotation/.test(t)?"Obliques":/crunch|sit.?up|plank|leg raise|knee raise|ab wheel|ab roll|hanging|toes.?to.?bar|v.?up|dead bug|mountain climber/.test(t)?"Abs":/\bdip\b/.test(t)?"Triceps":e.category||"Other":e?.category||"Other"}var qs=/\b(bike|biking|treadmill|run|running|cardio|step.?mill|elliptical|stair.?master|stair.?climber|jog|jogging|cycling|spinning|spin class|rowing machine|row machine|\berg\b|sprints?|jump.?rope|skipping rope|swim|swimming|hike|hiking)\b/,Ps={Quadriceps:"Legs",Hamstrings:"Legs",Adductors:"Legs",Abductors:"Legs",Glutes:"Glutes",Calves:"Calves",Pectorals:"Chest","Anterior Deltoid":"Shoulders","Lateral Deltoid":"Shoulders","Posterior Deltoid":"Shoulders",Lats:"Back","Upper Back":"Back",Traps:"Back","Lower Back":"Back",Biceps:"Biceps",Triceps:"Triceps",Forearms:"Forearms",Abs:"Core",Obliques:"Core"};function $t(e){let t=(e||"").toLowerCase().trim();if(!t)return"Full Body";if(qs.test(t))return"Cardio";let s=R({name:t,category:""});return Ps[s]||"Full Body"}async function Mt(){if((await A("exercises")).length>0)return 0;let t=Date.now(),s=Is.map(([o,i,n])=>({id:F(),name:o,category:i,equipment:n,notes:"",isCustom:!1,createdAt:t}));return await Y("exercises",s),s.length}var Et="workout";function Lt(e){Et!==e&&(Et=e,W("tab:changed",e))}var N=["Chest Day","Leg Day","Back/Bi Day"],Te={"Chest Day":{key:"chest",short:"Chest",cssVar:"--day-chest"},"Leg Day":{key:"leg",short:"Legs",cssVar:"--day-leg"},"Back/Bi Day":{key:"back",short:"Back/Bi",cssVar:"--day-back"}};function Be(e){let t=Te[e];return t?`var(${t.cssVar})`:"var(--text-tertiary)"}function Ge(e){if(!e)return null;let t=e.toLowerCase();return t.includes("chest")?"Chest Day":t.includes("leg")&&!t.includes("curl")&&!t.includes("extension")?"Leg Day":t.includes("back")||t.includes("pull")?"Back/Bi Day":t.includes("push")?"Chest Day":null}function Qe(e){for(let t of e){let s=Ge(t.name);if(s)return{name:t.name,normalized:s,startedAt:t.startedAt}}return null}function Ce(e){let t=N.indexOf(e);return t===-1?N[0]:N[(t+1)%N.length]}var Os={Pectorals:"#ec4899",Triceps:"#be185d","Anterior Deltoid":"#831843","Lateral Deltoid":"#f9a8d4",Quadriceps:"#facc15",Hamstrings:"#b45309",Glutes:"#f59e0b",Calves:"#fde68a",Adductors:"#bdb76b",Abductors:"#78350f",Lats:"#2563eb","Upper Back":"#38bdf8",Biceps:"#1e40af","Posterior Deltoid":"#bfdbfe",Traps:"#0891b2","Lower Back":"#475569",Forearms:"#22c55e",Abs:"#ef4444",Obliques:"#14b8a6",Other:"#6b7280"};function Dt(e){return Os[e]??"#6b7280"}var Ws={Pectorals:"Chest Day",Triceps:"Chest Day","Anterior Deltoid":"Chest Day","Lateral Deltoid":"Chest Day",Quadriceps:"Leg Day",Hamstrings:"Leg Day",Glutes:"Leg Day",Calves:"Leg Day",Adductors:"Leg Day",Abductors:"Leg Day",Lats:"Back/Bi Day","Upper Back":"Back/Bi Day",Biceps:"Back/Bi Day","Posterior Deltoid":"Back/Bi Day",Traps:"Back/Bi Day","Lower Back":"Back/Bi Day",Forearms:"Back/Bi Day"};function Hs(e){return Ws[e]??null}function Rs(e,t,s){let o=Ge(e);if(o)return o;let i=new Map;for(let a of t){let l=s.get(a.exerciseId);if(!l)continue;let u=Hs(R(l));if(!u)continue;let b=(a.weight||0)*(a.reps||0);b<=0||i.set(u,(i.get(u)??0)+b)}let n=null,r=0;for(let[a,l]of i)l>r&&(n=a,r=l);return n}function At(e,t,s){let o=[...e].sort((r,a)=>r.startedAt-a.startedAt),i=new Map,n=null;for(let r of o){let a=Rs(r.name,t.get(r.id)??[],s);a||(n?Bt(n.startedAt,r.startedAt)?a=n.day:a=Ce(n.day):a=N[0]),i.set(r.id,a),n={day:a,startedAt:r.startedAt}}return i}function Tt(e){let t=parseInt(e.slice(1),16);return((t>>16&255)*299+(t>>8&255)*587+(t&255)*114)/1e3>=150?"#1c1c1e":"#ffffff"}function Bt(e,t){let s=new Date(e),o=new Date(t);return s.getFullYear()===o.getFullYear()&&s.getMonth()===o.getMonth()&&s.getDate()===o.getDate()}function Fs(e,t){let s=Ge(t?.name);if(s)return s;let o=Qe(e);return o?Bt(o.startedAt,Date.now())?o.normalized:Ce(o.normalized):N[0]}var Ns="lift-today-day";async function ne(){try{let[e,t]=await Promise.all([J(),ae()]),s=Fs(e,t),o=Te[s].key;document.documentElement.dataset.day!==o&&(document.documentElement.dataset.day=o);try{localStorage.setItem(Ns,o)}catch{}return s}catch{return null}}var Ct="lift-migrations-done-v1";async function Xe(){let e=await wt();e.exercises>0&&console.info(`Removed ${e.exercises} cardio exercise(s), ${e.sets} set(s), ${e.workouts} cardio-only workout(s).`);let t=await bt($t);if(t.recategorized>0||t.deleted>0){console.info(`Reorganized "Other": recategorized ${t.recategorized}, removed ${t.deleted} cardio, dropped ${t.workouts} empty workout(s).`);let i=[];t.recategorized>0&&i.push(`sorted ${t.recategorized} exercise${t.recategorized===1?"":"s"}`),t.deleted>0&&i.push(`removed ${t.deleted} cardio`),I(`Cleaned up \u201COther\u201D: ${i.join(", ")}.`)}let s=await gt();s>0&&console.info(`Stripped equipment from ${s} exercise name(s).`);let o=await yt();o>0&&I(`Merged Butterfly into Chest Fly (${o} sets moved).`)}async function It(){try{if(localStorage.getItem(Ct))return}catch{}await Xe();try{localStorage.setItem(Ct,String(Date.now()))}catch{}}var Wt=["Amazed","Excited","Happy","Joyful","Content","Calm","Relieved","Grateful","Hopeful","Confident","Proud","Surprised","Indifferent","Anxious","Stressed","Overwhelmed","Frustrated","Angry","Irritated","Sad","Lonely","Discouraged","Drained","Worried","Embarrassed"],Ht=["Health","Fitness","Self-Care","Hobbies","Identity","Community","Family","Friends","Partner","Work","Education","Money","Weather","Tasks"],Je=[["taken","Taken"],["skipped","Skipped"],["snoozed","Snoozed"],["notInteracted","Not interacted"]],Rt=new Set(["taken","skipped","snoozed","notInteracted"]);function Ft(e){let t=Number(e);return isFinite(t)?Math.max(-1,Math.min(1,t)):0}var qt=e=>typeof e=="number"?e:Date.parse(e);async function Nt(e){let t=JSON.parse(await e.text());if(!t||t.lift!=="health-import")throw new Error("Not a Lift health-import file.");let s=(t.stateOfMind??[]).filter(n=>n&&n.id!=null).map(n=>({id:String(n.id),kind:n.kind==="dailyMood"?"dailyMood":"momentaryEmotion",date:qt(n.date)||Date.now(),valence:Ft(n.valence),labels:Array.isArray(n.labels)?n.labels:[],associations:Array.isArray(n.associations)?n.associations:[]})),o=(t.medications??[]).filter(n=>n&&n.id!=null).map(n=>({id:String(n.id),nickname:n.nickname??"",isArchived:!!n.isArchived,hasSchedule:!!n.hasSchedule,concept:{identifier:n.concept?.identifier??"",displayText:n.concept?.displayText??n.nickname??"Medication",form:n.concept?.form??"",rxnorm:Array.isArray(n.concept?.rxnorm)?n.concept.rxnorm:[]}})),i=(t.doseEvents??[]).filter(n=>n&&n.id!=null).map(n=>({id:String(n.id),medicationId:n.medicationId!=null?String(n.medicationId):"",status:Rt.has(n.status)?n.status:"notInteracted",date:qt(n.date)||Date.now(),scheduledQuantity:Number(n.scheduledQuantity)||0,doseQuantity:Number(n.doseQuantity)||0}));return s.length&&await Y("stateOfMind",s),o.length&&await Y("medications",o),i.length&&await Y("doseEvents",i),{stateOfMind:s.length,medications:o.length,doseEvents:i.length}}async function jt({kind:e,valence:t,labels:s,associations:o,date:i}){let n={id:F(),kind:e==="dailyMood"?"dailyMood":"momentaryEmotion",date:i||Date.now(),valence:Ft(t),labels:s||[],associations:o||[]};return await q("stateOfMind",n),n}async function zt({nickname:e,form:t,hasSchedule:s}){let o=(e||"").trim()||"Medication",i={id:F(),nickname:o,isArchived:!1,hasSchedule:!!s,concept:{identifier:"",displayText:o,form:(t||"").trim(),rxnorm:[]}};return await q("medications",i),i}async function Ze({medicationId:e,status:t,date:s,doseQuantity:o}){let i={id:F(),medicationId:String(e),status:Rt.has(t)?t:"taken",date:s||Date.now(),scheduledQuantity:0,doseQuantity:Number(o)||0};return await q("doseEvents",i),i}async function Vt(e,t){await re(e,t)}async function et(){let[e,t,s]=await Promise.all([A("stateOfMind"),A("medications"),A("doseEvents")]);return e.sort((o,i)=>o.date-i.date),s.sort((o,i)=>o.date-i.date),{stateOfMind:e,medications:t,doseEvents:s}}var Pt=e=>{let t=new Date(e);return`${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`},Ot=e=>e.length?e.reduce((t,s)=>t+s,0)/e.length:null;function Ut(e,t){let s=new Set(t.map(a=>Pt(a.startedAt))),o=[],i=[];for(let a of e)(s.has(Pt(a.date))?o:i).push(a.valence);let n=Ot(o),r=Ot(i);return{onWorkout:n,offWorkout:r,delta:n!=null&&r!=null?n-r:null,onCount:o.length,offCount:i.length}}function _t(e,t){let s=new Map;for(let o of t){if(o.status!=="taken"&&o.status!=="skipped")continue;let i=s.get(o.medicationId)??{taken:0,total:0};i.total+=1,o.status==="taken"&&(i.taken+=1),s.set(o.medicationId,i)}return e.map(o=>{let i=s.get(o.id)??{taken:0,total:0};return{medication:o,taken:i.taken,total:i.total,pct:i.total?i.taken/i.total:null}})}var Ie="lift-backup-passphrase";var Yt="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";function tt(e){let t=new Uint8Array(e),s="",o=32768;for(let i=0;i<t.length;i+=o)s+=String.fromCharCode.apply(null,t.subarray(i,i+o));return btoa(s)}var st=e=>Uint8Array.from(atob(e),t=>t.charCodeAt(0));function js(){let t=[...crypto.getRandomValues(new Uint8Array(20))].map(s=>Yt[s%Yt.length]);return[0,5,10,15].map(s=>t.slice(s,s+5).join("")).join("-")}function ot(){let e=null;try{e=localStorage.getItem(Ie)}catch{}if(!e){e=js();try{localStorage.setItem(Ie,e)}catch{}}return e}function Kt(){try{return localStorage.getItem(Ie)}catch{return null}}function Gt(e){try{localStorage.setItem(Ie,e)}catch{}}async function Qt(e,t){let s=await crypto.subtle.importKey("raw",new TextEncoder().encode(e),"PBKDF2",!1,["deriveKey"]);return crypto.subtle.deriveKey({name:"PBKDF2",hash:"SHA-256",salt:t,iterations:25e4},s,{name:"AES-GCM",length:256},!1,["encrypt","decrypt"])}function Xt(e){return!!e&&e.lift==="encrypted-backup"&&typeof e.data=="string"}async function Jt(e,t){let s=crypto.getRandomValues(new Uint8Array(16)),o=crypto.getRandomValues(new Uint8Array(12)),i=await Qt(t,s),n=new TextEncoder().encode(JSON.stringify(e)),r=await crypto.subtle.encrypt({name:"AES-GCM",iv:o},i,n);return{lift:"encrypted-backup",v:1,exportedAt:new Date().toISOString(),kdf:{name:"PBKDF2",hash:"SHA-256",iterations:25e4,salt:tt(s)},cipher:"AES-GCM",iv:tt(o),data:tt(r)}}async function nt(e,t){let s=st(e.kdf.salt),o=st(e.iv),i=await Qt(t,s),n;try{n=await crypto.subtle.decrypt({name:"AES-GCM",iv:o},i,st(e.data))}catch{throw new Error("Wrong backup password (or the file is damaged).")}return JSON.parse(new TextDecoder().decode(n))}async function zs(){let[e,t,s,o,i,n]=await Promise.all([A("exercises"),A("workouts"),A("sets"),A("stateOfMind"),A("medications"),A("doseEvents")]);return{version:2,exportedAt:new Date().toISOString(),exercises:e,workouts:t,sets:s,stateOfMind:o,medications:i,doseEvents:n}}function Vs(){let e=new Date,t=s=>String(s).padStart(2,"0");return`lift-backup-${e.getFullYear()}${t(e.getMonth()+1)}${t(e.getDate())}-${t(e.getHours())}${t(e.getMinutes())}${t(e.getSeconds())}.json`}async function it(){let e=await zs(),t=ot(),s=await Jt(e,t),o=JSON.stringify(s),i=new Blob([o],{type:"application/json"}),n=URL.createObjectURL(i),r=Vs(),a=document.createElement("a");return a.href=n,a.download=r,a.style.display="none",document.body.appendChild(a),a.click(),setTimeout(()=>{document.body.removeChild(a),URL.revokeObjectURL(n)},1e3),{filename:r,bytes:i.size,snapshot:e}}async function Us(e){let t=Kt();if(t)try{return await nt(e,t)}catch{}for(let s=0;s<3;s++){let o=prompt("Enter your backup password (saved in your Passwords app):");if(o==null)throw new Error("Restore cancelled.");try{let i=await nt(e,o.trim());return Gt(o.trim()),i}catch(i){if(s===2)throw i;alert("Wrong password \u2014 try again.")}}}async function _s(e){let t=JSON.parse(await e.text()),s=Xt(t)?await Us(t):t;if(!s||!Array.isArray(s.exercises)||!Array.isArray(s.workouts)||!Array.isArray(s.sets))throw new Error("File doesn't look like a Lift backup.");return await ft({exercises:s.exercises,workouts:s.workouts,sets:s.sets,stateOfMind:s.stateOfMind??[],medications:s.medications??[],doseEvents:s.doseEvents??[]}),await Xe(),{exercises:s.exercises.length,workouts:s.workouts.length,sets:s.sets.length,stateOfMind:(s.stateOfMind??[]).length}}function Zt(){let e=ot();H({html:`
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
            <div class="stat-value" id="bk-pass" style="font-variant-numeric: tabular-nums; letter-spacing: 0.5px; color: var(--text); -webkit-user-select: all; user-select: all;">${S(e)}</div>
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

        <div class="section">Apple Health</div>
        <div class="form-section">
          <button class="list-row button" id="bk-health">
            <div class="row-main"><div class="row-title" style="color: var(--accent);">Import health data\u2026</div></div>
          </button>
        </div>
        <div class="section-footer">
          <b>Merges</b> a health-import file (moods &amp; medications) into your existing data \u2014 nothing is replaced or removed.
        </div>

        <input type="file" id="bk-file" accept=".json,application/json" style="display: none;" />
        <input type="file" id="bk-health-file" accept=".json,application/json" style="display: none;" />
      </div>
    `,onMount(t,s){t.querySelector("#bk-close").addEventListener("click",()=>s()),t.querySelector("#bk-copy").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(e),I("Password copied \u2014 save it in your Passwords app")}catch{I("Copy failed \u2014 long-press the password to select it")}}),t.querySelector("#bk-export").addEventListener("click",async()=>{try{let{filename:n,bytes:r}=await it();I(`Exported ${n} (${Ys(r)})`)}catch(n){I(`Export failed: ${n.message}`)}});let o=t.querySelector("#bk-file");t.querySelector("#bk-import").addEventListener("click",()=>{o.value="",o.click()}),o.addEventListener("change",async n=>{let r=n.target.files?.[0];if(r&&confirm("Replace all current data with this backup? This cannot be undone."))try{let a=await _s(r);s(),I(`Restored ${a.workouts} workouts, ${a.exercises} exercises`),W("data:changed")}catch(a){I(`Restore failed: ${a.message}`)}});let i=t.querySelector("#bk-health-file");t.querySelector("#bk-health").addEventListener("click",()=>{i.value="",i.click()}),i.addEventListener("change",async n=>{let r=n.target.files?.[0];if(r)try{let a=await Nt(r);s(),I(`Imported ${a.stateOfMind} moods, ${a.medications} meds${a.doseEvents?`, ${a.doseEvents} doses`:""}`),W("data:changed")}catch(a){I(`Import failed: ${a.message}`)}})}})}function Ys(e){return e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/(1024*1024)).toFixed(1)} MB`}var qe=[{key:"1W",tick:"1W",days:7},{key:"1M",tick:"1M",days:30},{key:"3M",tick:"3M",days:90},{key:"1Y",tick:"1Y",days:365},{key:"All",tick:"All",all:!0}];function Ks(e){let t=new Map;for(let s of e){let o=new Date(s.date),i=`${o.getFullYear()}-${o.getMonth()}-${o.getDate()}`,n=t.get(i)||{date:s.date,total:0,count:0};n.total+=s.value,n.count+=1,n.date=Math.min(n.date,s.date),t.set(i,n)}return[...t.values()].map(s=>({date:s.date,value:s.total/s.count})).sort((s,o)=>s.date-o.date)}function ye(e,t,s={}){let o=t.length>0&&t[0].points!==void 0,i=(o?t:[{points:t}]).map(p=>({label:p.label??"",color:p.color||"var(--accent)",points:Ks(p.points)})).filter(p=>p.points.length>0),n=s.defaultPeriod||"All",r=Math.max(0,qe.findIndex(p=>p.key===n)),a=qe.length-1,l=null;function u(){let p=qe[r],c=i.map((g,D)=>l===null||D===l?g.points:[]);if(p.all)return c;let h=Date.now()-p.days*864e5,y=c.map(g=>g.filter(D=>D.date>=h));return y.every(g=>g.length===0)?c.map(g=>g.slice(-1)):y}let b=o&&i.some(p=>p.label)?`<div class="chart-legend">${i.map((p,c)=>`<button class="legend-item" data-i="${c}" style="--dcolor: ${p.color};" aria-pressed="false">${p.label}</button>`).join("")}</div>`:"";e.innerHTML=`
    <div class="chart-scrub-readout" data-role="scrub"></div>
    ${b}
    <div class="chart-container" data-role="chart"></div>
    <div class="chart-daterange" data-role="range"></div>
    <div class="chart-slider">
      <input type="range" class="chart-range" min="0" max="${a}" step="1"
             value="${r}" aria-label="Time range" />
      <div class="chart-slider-ticks">
        ${qe.map((p,c)=>`<span data-i="${c}">${p.tick}</span>`).join("")}
      </div>
    </div>
  `;let $=e.querySelector('[data-role="scrub"]'),d=e.querySelector('[data-role="chart"]'),f=e.querySelector('[data-role="range"]'),w=e.querySelector(".chart-range"),E=[...e.querySelectorAll(".chart-slider-ticks span")],v=s.unit||"lbs",m=null;function M(){let p=u(),c=Gs(p,i,v);d.innerHTML=c.html,m=c.geom;let h=p.flat();if(h.length>=2){let y=Math.min(...h.map(D=>D.date)),g=Math.max(...h.map(D=>D.date));f.innerHTML=`<span>${rt(y)}</span><span>${rt(g)}</span>`}else f.innerHTML="";E.forEach((y,g)=>y.classList.toggle("active",g===r))}w.addEventListener("input",()=>{r=Number(w.value),T(),M()});let k=[...e.querySelectorAll(".chart-legend .legend-item")];for(let p of k)p.addEventListener("click",()=>{let c=Number(p.dataset.i);l=l===c?null:c,k.forEach((h,y)=>{h.classList.toggle("dimmed",l!==null&&y!==l),h.setAttribute("aria-pressed",String(l===y))}),T(),M()});function x(p){if(!m||m.pts.length<2)return;let c=d.querySelector("svg"),h=c?.getScreenCTM();if(!h)return;let y=new DOMPoint(p,0).matrixTransform(h.inverse()).x,g=0,D=1/0;m.pts.forEach((O,U)=>{let _=Math.abs(O.x-y);_<D&&(D=_,g=U)});let L=m.pts[g],C=c.querySelector(".chart-scrub-line"),P=c.querySelector(".chart-scrub-dot");C&&(C.setAttribute("x1",L.x),C.setAttribute("x2",L.x),C.removeAttribute("visibility")),P&&(P.setAttribute("cx",L.x),P.setAttribute("cy",L.y),P.style.fill=L.color,P.removeAttribute("visibility"));let V=L.label?` \xB7 ${L.label}`:"";$.textContent=`${rt(L.date)}${V} \xB7 ${Math.round(L.value).toLocaleString()} ${v}`}function T(){$.textContent="";let p=d.querySelector("svg");p?.querySelector(".chart-scrub-line")?.setAttribute("visibility","hidden"),p?.querySelector(".chart-scrub-dot")?.setAttribute("visibility","hidden")}let B=!1;d.addEventListener("pointerdown",p=>{B=!0,d.setPointerCapture?.(p.pointerId),x(p.clientX)}),d.addEventListener("pointermove",p=>{B&&x(p.clientX)});for(let p of["pointerup","pointercancel"])d.addEventListener(p,()=>{B=!1,T()});M()}function rt(e){return new Date(e).toLocaleDateString(void 0,{month:"short",day:"numeric",year:"numeric"})}function Gs(e,t,s){let n={top:16,right:14,bottom:14,left:52},r=400-n.left-n.right,a=200-n.top-n.bottom,l=e.flat();if(l.length===0)return{html:`<svg viewBox="0 0 400 200"><text x="${400/2}" y="${200/2}" text-anchor="middle" class="chart-axis-label">No data in range</text></svg>`,geom:null};if(l.length===1){let g=l[0],D=t[e.findIndex(P=>P.length>0)]?.color||"var(--accent)",L=n.left+r/2,C=n.top+a/2;return{html:`<svg viewBox="0 0 400 200"><circle cx="${L}" cy="${C}" r="4" class="chart-point" style="fill: ${D};"/><text x="${L}" y="${C-10}" text-anchor="middle" class="chart-axis-label">${Math.round(g.value).toLocaleString()} ${s}</text></svg>`,geom:null}}let u=l.map(g=>g.date),b=l.map(g=>g.value),$=Math.min(...u),d=Math.max(...u),f=Math.max(...b),w=Math.min(...b),E=Math.max(f-w,1),v=Math.max(0,w-E*.12),m=f+E*.12,M=g=>n.left+(g-$)/Math.max(d-$,1)*r,k=g=>n.top+a-(g-v)/(m-v)*a,x=4,T=g=>Math.round(g).toLocaleString(),B=Array.from({length:x+1},(g,D)=>{let L=v+(m-v)*D/x,C=k(L);return`<text x="${n.left-6}" y="${C+3}" text-anchor="end" class="chart-axis-label">${T(L)}</text>`}).join(""),p=Array.from({length:x+1},(g,D)=>{let L=n.top+a*D/x;return`<line x1="${n.left}" x2="${400-n.right}" y1="${L}" y2="${L}" class="chart-axis-line"/>`}).join(""),c=[],h=e.map((g,D)=>{let L=t[D],C=g.map(P=>({x:M(P.date),y:k(P.value)}));return g.forEach((P,V)=>c.push({...C[V],date:P.date,value:P.value,label:L.label,color:L.color})),C.length===0?"":C.length===1?`<circle cx="${C[0].x}" cy="${C[0].y}" r="3.5" class="chart-point" style="fill: ${L.color};"/>`:`<path d="${Qs(C)}" class="chart-line" style="stroke: ${L.color};"/>`}).join("");return{html:`
    <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet">
      ${p}
      ${B}
      ${h}
      <line class="chart-scrub-line" y1="${n.top}" y2="${n.top+a}" x1="0" x2="0" visibility="hidden"/>
      <circle class="chart-scrub-dot" r="4.5" visibility="hidden"/>
    </svg>
  `,geom:{pts:c}}}function Qs(e){if(e.length<2)return"";let t=`M ${e[0].x.toFixed(1)} ${e[0].y.toFixed(1)}`;for(let s=0;s<e.length-1;s++){let o=e[s===0?0:s-1],i=e[s],n=e[s+1],r=e[s+2]||n,a=i.x+(n.x-o.x)/6,l=i.y+(n.y-o.y)/6,u=n.x-(r.x-i.x)/6,b=n.y-(r.y-i.y)/6;t+=` C ${a.toFixed(1)} ${l.toFixed(1)}, ${u.toFixed(1)} ${b.toFixed(1)}, ${n.x.toFixed(1)} ${n.y.toFixed(1)}`}return t}var ee=null;function es(e){let t=!0;return ts().then(s=>{t&&(ee=s,Pe(e))}).catch(s=>{t&&(e.container.innerHTML=Z(s))}),()=>{t=!1}}async function ts(){let[e,t,s]=await Promise.all([J(),A("sets"),A("exercises")]),o=new Map(s.map(w=>[w.id,w])),i=new Map;for(let w of X(t))i.has(w.workoutId)||i.set(w.workoutId,[]),i.get(w.workoutId).push(w);let n=0,r=0,a=new Map,l=new Map,u=new Map,b=At(e,i,o);for(let w of e){let E=i.get(w.id)||[],v=E.reduce((m,M)=>m+M.weight*M.reps,0);if(n+=v,r+=E.length,v>0){let m=b.get(w.id);a.has(m)||a.set(m,[]),a.get(m).push({date:w.startedAt,value:v})}for(let m of E){let M=o.get(m.exerciseId);if(!M)continue;let k=l.get(m.exerciseId)||{id:m.exerciseId,exercise:M,count:0};if(k.count+=1,l.set(m.exerciseId,k),m.weight>0&&m.reps>0){let x=u.get(m.exerciseId);(!x||m.weight>x.weight||m.weight===x.weight&&m.reps>x.reps)&&u.set(m.exerciseId,{id:m.exerciseId,weight:m.weight,reps:m.reps,date:w.startedAt,name:G(M)})}}}let $=Array.from(l.entries()).sort((w,E)=>E[1].count-w[1].count).map(([,w])=>w),d=Array.from(u.values()).sort((w,E)=>E.weight-w.weight),f=N.filter(w=>a.has(w)).map(w=>({label:Te[w].short,color:Be(w),points:a.get(w)}));return{workouts:e,allSets:t,allExercises:s,exMap:o,setsByWorkout:i,totalVolume:n,totalSets:r,volumeSeries:f,topExercises:$,prs:d}}function Pe(e){if(e.setTitle("Progress"),e.setBack(null),e.setAction({label:"Backup and restore",html:St(),onClick:()=>Zt()}),e.container.scrollTop=0,!ee||ee.workouts.length===0){e.container.innerHTML=`
      <div class="empty-state">
        <div class="empty-icon">\u{1F4C8}</div>
        <h2>No data yet</h2>
        <p>Finish a workout and your stats and trends will show up here.</p>
      </div>
    `;return}let{workouts:t,totalVolume:s,totalSets:o,volumeSeries:i,topExercises:n,prs:r}=ee;e.container.innerHTML=`
    <div class="section">Totals</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Total Volume</div><div class="stat-value">${ce(s)}</div></div>
      <div class="stat-row"><div class="stat-label">Total Sets</div><div class="stat-value">${o.toLocaleString()}</div></div>
    </div>

    ${i.length>0?`
      <div class="section">Workout Volume</div>
      <div class="volume-chart-mount"></div>
    `:""}

    <div class="list" style="margin-top: 16px;">
      <button class="list-row" data-page="trained">
        <div class="row-main">
          <div class="row-title">Most-Trained Exercises</div>
          <div class="row-subtitle">${n.length} tracked</div>
        </div>
        <div class="chevron">\u203A</div>
      </button>
      <button class="list-row" data-page="prs">
        <div class="row-main">
          <div class="row-title">Personal Records</div>
          <div class="row-subtitle">${r.length} exercises</div>
        </div>
        <div class="chevron">\u203A</div>
      </button>
      <button class="list-row" data-page="history">
        <div class="row-main">
          <div class="row-title">Workout History</div>
          <div class="row-subtitle">${t.length} workout${t.length===1?"":"s"}</div>
        </div>
        <div class="chevron">\u203A</div>
      </button>
    </div>
  `;let a=e.container.querySelector(".volume-chart-mount");a&&i.length>0&&ye(a,i,{unit:"lbs"});for(let l of e.container.querySelectorAll("[data-page]"))l.addEventListener("click",()=>{let u=l.dataset.page;u==="trained"?Xs(e):u==="prs"?Js(e):u==="history"&&ss(e)})}function Xs(e){e.setTitle("Most-Trained"),e.setBack(()=>Pe(e)),e.setAction(null);let{topExercises:t}=ee;e.container.innerHTML=`
    <div class="list" style="margin-top: 16px;">
      ${t.map(s=>`
        <button class="list-row" data-exercise-id="${S(s.id)}">
          ${se(s.exercise)}
          <div class="row-trailing trailing-stack">${oe(s.count)}</div>
          <div class="chevron">\u203A</div>
        </button>
      `).join("")}
    </div>
  `,e.container.scrollTop=0,at(e)}function Js(e){e.setTitle("Personal Records"),e.setBack(()=>Pe(e)),e.setAction(null);let{prs:t}=ee;e.container.innerHTML=`
    <div class="section-footer" style="margin-top: 16px;">Heaviest set ever recorded per exercise.</div>
    <div class="list">
      ${t.map(s=>`
        <button class="list-row" data-exercise-id="${S(s.id)}" style="align-items: flex-start;">
          <div class="row-main">
            <div class="row-title">${S(s.name)}</div>
            <div class="row-subtitle">${z(s.date)}</div>
          </div>
          <div class="row-trailing" style="text-align: right;">
            <div style="font-weight: 600; color: var(--text);">${ve(s.weight)} lbs</div>
            <div style="font-size: 12px; color: var(--text-tertiary);">${s.reps} rep${s.reps===1?"":"s"}</div>
          </div>
          <div class="chevron">\u203A</div>
        </button>
      `).join("")}
    </div>
  `,e.container.scrollTop=0,at(e)}function at(e){for(let t of e.container.querySelectorAll("[data-exercise-id]"))t.addEventListener("click",()=>{Oe(t.dataset.exerciseId)})}function ss(e){e.setTitle("Workout History"),e.setBack(()=>Pe(e)),e.setAction(null);let{workouts:t,setsByWorkout:s,exMap:o}=ee;e.container.innerHTML=`
    <div class="list" style="margin-top: 16px;">
      ${t.map(i=>Zs(i,s.get(i.id)||[],o)).join("")}
    </div>
  `,e.container.scrollTop=0;for(let i of e.container.querySelectorAll("[data-workout-id]"))i.addEventListener("click",()=>{let n=i.dataset.workoutId;eo(e,n).catch(r=>{e.container.innerHTML=Z(r)})})}function Zs(e,t,s){let o=t,i=o.reduce((l,u)=>l+u.weight*u.reps,0),n=(e.endedAt-e.startedAt)/1e3,r=[],a=new Set;for(let l of t){if(a.has(l.exerciseId))continue;a.add(l.exerciseId);let u=s.get(l.exerciseId);if(u&&r.push(u.name),r.length>=3)break}return`
    <button class="list-row" data-workout-id="${e.id}">
      <div class="row-main">
        <div class="row-title" style="font-weight: 600;">${S(e.name)}</div>
        <div class="row-subtitle" style="margin-top: 4px;">
          ${z(e.startedAt)} \xB7 ${_e(n)} \xB7 ${o.length} sets \xB7 ${ce(i)}
        </div>
        ${r.length>0?`<div class="row-subtitle" style="margin-top: 4px;">${S(r.join(" \xB7 "))}${a.size>3?" \u2026":""}</div>`:""}
      </div>
      <div class="chevron">\u203A</div>
    </button>
  `}async function os(e){let[t,s,o]=await Promise.all([fe("workouts",e),A("exercises"),mt(e)]);if(!t)return null;let i=new Map(s.map(d=>[d.id,d])),n=new Map,r=[];for(let d of o)n.has(d.exerciseId)||(n.set(d.exerciseId,[]),r.push(d.exerciseId)),n.get(d.exerciseId).push(d);let a=X(o),l=a.reduce((d,f)=>d+f.weight*f.reps,0),u=a.length,b=(t.endedAt-t.startedAt)/1e3,$=`
    <div class="section">Summary</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Date</div><div class="stat-value">${xt(t.startedAt)}</div></div>
      <div class="stat-row"><div class="stat-label">Duration</div><div class="stat-value">${_e(b)}</div></div>
      <div class="stat-row"><div class="stat-label">Total Volume</div><div class="stat-value">${ce(l)}</div></div>
      <div class="stat-row"><div class="stat-label">Completed Sets</div><div class="stat-value">${u}</div></div>
    </div>

    ${r.map(d=>{let f=i.get(d),w=n.get(d),E=0,v=0;return`
        ${f?`<button class="section section-link" data-exercise-id="${S(d)}">${S(G(f))}<span class="name-chevron">\u203A</span></button>`:'<div class="section">Unknown exercise</div>'}
        <div class="form-section">
          ${w.map(M=>{let x=(M.setType||"working")==="warmup"?`W${++v}`:String(++E);return`
              <div class="stat-row">
                <div class="stat-label">Set ${x}</div>
                <div class="stat-value hist-edit">
                  <input class="hist-input" type="number" inputmode="decimal" step="0.5" aria-label="Weight in pounds for set ${x}"
                         data-set-id="${M.id}" data-field="weight" value="${M.weight>0?M.weight:""}" placeholder="0" />
                  <span>lbs \xD7</span>
                  <input class="hist-input" type="number" inputmode="numeric" step="1" aria-label="Repetitions for set ${x}"
                         data-set-id="${M.id}" data-field="reps" value="${M.reps>0?M.reps:""}" placeholder="0" />
                </div>
              </div>
            `}).join("")}
        </div>
      `}).join("")}
  `;return{workout:t,html:$,sets:o}}function ns(e,t){for(let s of e.querySelectorAll("input.hist-input[data-set-id]"))s.addEventListener("input",async()=>{let o=t.find(i=>i.id===s.dataset.setId);o&&(s.dataset.field==="weight"?o.weight=parseFloat(s.value)||0:o.reps=parseInt(s.value,10)||0,await q("sets",{...o}))})}async function eo(e,t){e.setBack(async()=>{ee=await ts(),ss(e)}),e.setAction({label:"Delete workout",html:Le(),onClick:async()=>{confirm("Delete this workout?")&&(await Ee(t),W("data:changed"))}});let s=await os(t);if(!s){e.container.innerHTML=Z({message:"Workout not found."});return}e.setTitle(s.workout.name),e.container.innerHTML=s.html,e.container.scrollTop=0,at(e),ns(e.container,s.sets)}async function is(e){let t=await os(e);if(!t)return;let s=H({html:`
      <div class="sheet-header">
        <button class="btn-text" id="wd-close">Done</button>
        <div class="title">${S(t.workout.name)}</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">${t.html}</div>
    `,onMount(o){o.querySelector("#wd-close").addEventListener("click",()=>s());for(let i of o.querySelectorAll("[data-exercise-id]"))i.addEventListener("click",()=>Oe(i.dataset.exerciseId));ns(o,t.sets)}})}function rs(e){let t=!0;return as(e).catch(s=>{t&&(e.container.innerHTML=Z(s))}),()=>{t=!1}}async function as(e){e.setTitle("Exercises"),e.setBack(null),e.setAction({label:"Add exercise",html:'<span style="font-size: 24px;">+</span>',onClick:()=>{ge(null)}});let[t,s]=await Promise.all([A("exercises"),A("sets")]),o=t.sort((d,f)=>d.name.localeCompare(f.name)),i=new Map;for(let d of s)i.set(d.exerciseId,(i.get(d.exerciseId)??0)+1);let n="",r=null;e.container.innerHTML=`
    <div class="search-bar">
      <input class="search-input" id="ex-search" placeholder="Search exercises" />
    </div>
    <div class="chip-row" id="ex-chips"></div>
    <div class="list" id="ex-list"></div>
  `,e.container.scrollTop=0;let a=e.container.querySelector("#ex-list"),l=e.container.querySelector("#ex-chips"),u=e.container.querySelector("#ex-search");function b(){l.innerHTML=Ae(o,r);for(let d of l.querySelectorAll(".chip"))d.addEventListener("click",()=>{let f=d.dataset.cat;r=f==="All"?null:f,b(),$()})}function $(){let d=o.filter(f=>!r||R(f)===r).filter(f=>!n||f.name.toLowerCase().includes(n.toLowerCase()));if(d.length===0){a.innerHTML='<div class="list-row"><div class="row-main" style="color: var(--text-secondary);">No matches</div></div>';return}a.innerHTML=d.map(f=>`
        <button class="list-row" data-id="${f.id}">
          ${se(f)}
          <div class="row-trailing trailing-stack">${oe(i.get(f.id)??0)}</div>
          <div class="chevron">\u203A</div>
        </button>
      `).join("");for(let f of a.querySelectorAll("[data-id]"))f.addEventListener("click",()=>{to(e,f.dataset.id).catch(w=>{e.container.innerHTML=Z(w)})})}u.addEventListener("input",()=>{n=u.value,$()}),b(),$()}function to(e,t){return We(e,t,()=>as(e))}async function We(e,t,s){e.setBack(s);let o=await ls(t);if(!o){e.container.innerHTML=Z({message:"Exercise not found."});return}e.setTitle(G(o.exercise)),e.setAction(o.exercise.isCustom?{label:"Delete exercise",html:Le(),onClick:async()=>{if(o.completed.length>0){alert(`Can't delete \u2014 this exercise has ${o.completed.length} logged set${o.completed.length===1?"":"s"}.`);return}confirm("Delete this custom exercise?")&&(await re("exercises",t),W("data:changed"))}}:null),e.container.innerHTML=o.html,e.container.scrollTop=0,e.container.querySelector("#exd-edit")?.addEventListener("click",()=>{ge(o.exercise,()=>We(e,t,s))}),cs(e.container);let i=e.container.querySelector(".exercise-chart-mount");i&&o.chartData.length>0&&ye(i,o.chartData,{unit:"lbs"})}function cs(e){for(let t of e.querySelectorAll(".recent-set[data-workout-id]"))t.addEventListener("click",()=>is(t.dataset.workoutId))}async function Oe(e){let t=await ls(e);if(!t)return;let s=H({html:`
      <div class="sheet-header">
        <button class="btn-text" id="exd-close">Done</button>
        <div class="title">${S(G(t.exercise))}</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">${t.html}</div>
    `,onMount(o){o.querySelector("#exd-close").addEventListener("click",()=>s()),o.querySelector("#exd-edit")?.addEventListener("click",()=>{ge(t.exercise,()=>{s(),W("data:changed"),Oe(e)})}),cs(o);let i=o.querySelector(".exercise-chart-mount");i&&t.chartData.length>0&&ye(i,t.chartData,{unit:"lbs"})}})}async function ls(e){let[t,s,o,i]=await Promise.all([fe("exercises",e),A("sets"),A("workouts"),ae()]);if(!t)return null;let n=new Map(o.map(d=>[d.id,d])),r=X(s).filter(d=>d.exerciseId===e&&d.workoutId!==i?.id&&n.has(d.workoutId)).map(d=>({...d,workout:n.get(d.workoutId)})).sort((d,f)=>d.workout.startedAt-f.workout.startedAt),a=r.reduce((d,f)=>d+f.weight*f.reps,0),l=r.reduce((d,f)=>!d||f.weight>d.weight||f.weight===d.weight&&f.reps>d.reps?f:d,null),u=new Map;for(let d of r){if(d.weight<=0||d.reps<=0||(d.setType||"working")==="warmup")continue;let f=u.get(d.workoutId)||{date:d.workout.startedAt,total:0,count:0};f.total+=d.weight*d.reps,f.count+=1,u.set(d.workoutId,f)}let b=Array.from(u.values()).map(({date:d,total:f,count:w})=>({date:d,value:f/w})).sort((d,f)=>d.date-f.date),$=`
    <div class="section">Details</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Equipment</div><div class="stat-value">${S(t.equipment)}</div></div>
      <div class="stat-row"><div class="stat-label">Muscle</div><div class="stat-value">${S(R(t))}</div></div>
      <button class="list-row button" id="exd-edit">
        <div class="row-main"><div class="row-title" style="color: var(--accent);">Edit Name, Muscle & Equipment</div></div>
      </button>
    </div>

    ${r.length>0?`
      <div class="section">Stats</div>
      <div class="form-section">
        <div class="stat-row"><div class="stat-label">Total Sets</div><div class="stat-value">${r.length.toLocaleString()}</div></div>
        <div class="stat-row"><div class="stat-label">Total Volume</div><div class="stat-value">${ce(a)}</div></div>
        ${l?`<div class="stat-row"><div class="stat-label">Best Set</div><div class="stat-value">${ve(l.weight)} \xD7 ${l.reps}</div></div>`:""}
      </div>
    `:""}

    ${b.length>0?`
      <div class="section">Avg working-set volume per workout</div>
      <div class="exercise-chart-mount"></div>
    `:""}

    ${r.length>0?`
      <div class="section">Recent Sets \xB7 tap to view that workout</div>
      <div class="form-section">
        ${r.slice(-30).reverse().map(d=>`
          <button class="stat-row recent-set" data-workout-id="${S(d.workoutId)}">
            <div class="stat-label" style="font-size: 13px; color: var(--text-secondary);">${z(d.workout.startedAt)}</div>
            <div class="stat-value" style="color: var(--text);">${ve(d.weight)} \xD7 ${d.reps} <span class="name-chevron">\u203A</span></div>
          </button>
        `).join("")}
      </div>
    `:`
      <div class="empty-state" style="padding: 32px 24px;">
        <p style="color: var(--text-secondary);">No completed sets yet.</p>
      </div>
    `}
  `;return{exercise:t,completed:r,chartData:b,html:$}}var so=Object.fromEntries(Je),us=e=>new Date(e).toLocaleTimeString(void 0,{hour:"numeric",minute:"2-digit"}),ps='<span style="font-size: 24px;">+</span>';async function ct(e,t){let s=()=>ct(e,t);e.setTitle("State of Mind"),e.setBack(t),e.setAction({html:ps,onClick:()=>lo(s)});let[{stateOfMind:o},i]=await Promise.all([et(),J()]),n=Ut(o,i);e.container.innerHTML=`
    ${o.length?`
      <div class="section">Summary</div>
      <div class="form-section">
        <div class="stat-row"><div class="stat-label">Entries</div><div class="stat-value">${o.length.toLocaleString()}</div></div>
        <div class="stat-row"><div class="stat-label">Range</div><div class="stat-value">${z(o[0].date)} \u2013 ${z(o[o.length-1].date)}</div></div>
        <div class="stat-row"><div class="stat-label">Average mood</div><div class="stat-value">${He(ro(o))}</div></div>
      </div>

      <div class="section">Mood vs. training</div>
      <div class="form-section">
        <div class="stat-row"><div class="stat-label">On workout days</div><div class="stat-value">${n.onWorkout!=null?He(n.onWorkout)+` (${n.onCount})`:"\u2014"}</div></div>
        <div class="stat-row"><div class="stat-label">On rest days</div><div class="stat-value">${n.offWorkout!=null?He(n.offWorkout)+` (${n.offCount})`:"\u2014"}</div></div>
        <div class="stat-row"><div class="stat-label">Difference</div><div class="stat-value">${n.delta!=null?(n.delta>=0?"+":"")+n.delta.toFixed(2):"\u2014"}</div></div>
      </div>

      <div class="section">Recent entries</div>
      <div class="list">${o.slice(-30).reverse().map(oo).join("")}</div>
    `:fs("\u{1F9E0}","No mood entries","Tap \uFF0B to log how you're feeling.")}
  `,e.container.scrollTop=0,vs(e,s)}function oo(e){let t=e.labels.length?e.labels.join(", "):e.kind==="dailyMood"?"Daily mood":"Momentary";return`
    <div class="list-row">
      <div class="row-main">
        <div class="row-title">${S(t)}</div>
        <div class="row-subtitle">${z(e.date)} \xB7 ${us(e.date)}${e.associations.length?" \xB7 "+S(e.associations.join(", ")):""}</div>
      </div>
      <div class="row-trailing">${He(e.valence)}</div>
      ${ms("stateOfMind",e.id)}
    </div>`}async function lt(e,t){let s=()=>lt(e,t);e.setTitle("Medications"),e.setBack(t),e.setAction({html:ps,onClick:()=>uo(s)});let{medications:o,doseEvents:i}=await et(),n=_t(o,i),r=new Map(o.map(l=>[l.id,l.nickname||l.concept.displayText])),a=i.slice(-20).reverse();e.container.innerHTML=`
    ${o.length?`
      <div class="section">Your medications</div>
      ${n.map(no).join("")}
      ${a.length?`
        <div class="section">Recent doses</div>
        <div class="list">${a.map(l=>io(l,r)).join("")}</div>
      `:""}
    `:fs("\u{1F48A}","No medications","Tap \uFF0B to add one, then log each dose as you take it.")}
  `,e.container.scrollTop=0;for(let l of e.container.querySelectorAll("[data-take]"))l.addEventListener("click",async()=>{await Ze({medicationId:l.dataset.take,status:l.dataset.status,date:Date.now(),doseQuantity:1}),I(l.dataset.status==="taken"?"Logged as taken":"Logged as skipped"),s()});for(let l of e.container.querySelectorAll("[data-logat]"))l.addEventListener("click",()=>po(o,s,l.dataset.logat));vs(e,s)}function no(e){let t=e.medication,s=[t.concept.form||"No form set",e.pct!=null?`${Math.round(e.pct*100)}% taken (${e.taken}/${e.total})`:"no doses yet"].join(" \xB7 ");return`
    <div class="exercise-section">
      <div class="exercise-section-header">
        <div class="row-main">
          <div class="row-title" style="font-weight:600">${S(t.nickname||t.concept.displayText)}</div>
          <div class="row-subtitle">${S(s)}</div>
        </div>
        <button class="menu" data-del-store="medications" data-del-id="${S(t.id)}" aria-label="Delete">\u2715</button>
      </div>
      <div class="med-actions">
        <button class="btn-secondary" data-take="${S(t.id)}" data-status="taken">Taken now</button>
        <button class="btn-secondary" data-take="${S(t.id)}" data-status="skipped">Skip</button>
        <button class="btn-secondary" data-logat="${S(t.id)}">Log at time\u2026</button>
      </div>
    </div>`}function io(e,t){return`
    <div class="list-row">
      <div class="row-main">
        <div class="row-title">${S(t.get(e.medicationId)||"Medication")}</div>
        <div class="row-subtitle">${z(e.date)} \xB7 ${us(e.date)}</div>
      </div>
      <div class="row-trailing">${S(so[e.status]||e.status)}</div>
      ${ms("doseEvents",e.id)}
    </div>`}function fs(e,t,s){return`
    <div class="empty-state" style="padding: 48px 24px; min-height: auto;">
      <div class="empty-icon">${e}</div>
      <h2>${S(t)}</h2>
      <p>${S(s)}</p>
    </div>`}function ms(e,t){return`<button class="hz-del" data-del-store="${e}" data-del-id="${S(t)}" aria-label="Delete">\u2715</button>`}function vs(e,t){for(let s of e.container.querySelectorAll("[data-del-id]"))s.addEventListener("click",async()=>{confirm("Delete this entry?")&&(await Vt(s.dataset.delStore,s.dataset.delId),t())})}function ro(e){return e.reduce((t,s)=>t+s.valence,0)/e.length}function ao(e){return e>=.7?"Very pleasant":e>=.4?"Pleasant":e>=.1?"Slightly pleasant":e>-.1?"Neutral":e>-.4?"Slightly unpleasant":e>-.7?"Unpleasant":"Very unpleasant"}var He=e=>S(ao(e)),co=["Very Unpleasant","Unpleasant","Slightly Unpleasant","Neutral","Slightly Pleasant","Pleasant","Very Pleasant"];function hs(){let e=new Date,t=s=>String(s).padStart(2,"0");return`${e.getFullYear()}-${t(e.getMonth()+1)}-${t(e.getDate())}T${t(e.getHours())}:${t(e.getMinutes())}`}function ys(e){let t=e?new Date(e).getTime():NaN;return isFinite(t)?t:Date.now()}function ds(e,t=[]){return e.map(s=>`<button type="button" class="chip${t.includes(s)?" active":""}" data-chip="${S(s)}">${S(s)}</button>`).join("")}function Re(e,t,s={}){for(let o of e.querySelectorAll(`${t} .chip`))o.addEventListener("click",()=>{s.single&&e.querySelectorAll(`${t} .chip`).forEach(i=>i.classList.remove("active")),o.classList.toggle("active",s.single?!0:!o.classList.contains("active"))})}var Fe=(e,t)=>[...e.querySelectorAll(`${t} .chip.active`)].map(s=>s.dataset.chip);function lo(e){let t=H({html:`
      <div class="sheet-header">
        <button class="btn-text" id="som-cancel">Cancel</button>
        <div class="title">State of Mind</div>
        <button class="btn-text primary" id="som-save">Save</button>
      </div>
      <div class="sheet-content">
        <div class="section">Kind</div>
        <div class="chip-row" id="som-kind">
          <button type="button" class="chip active" data-chip="momentaryEmotion">Momentary emotion</button>
          <button type="button" class="chip" data-chip="dailyMood">Daily mood</button>
        </div>
        <div class="section">How pleasant?</div>
        <div class="form-section" style="padding: 6px 18px 18px;">
          <div id="som-val-label" style="text-align: center; font-weight: 600; padding: 10px 0;"></div>
          <input type="range" class="mood-slider" id="som-val" min="-3" max="3" step="1" value="1" />
        </div>
        <div class="section">Emotions (optional)</div>
        <div class="chip-row" id="som-emotions" style="flex-wrap: wrap;">${ds(Wt)}</div>
        <div class="section">What's affecting you? (optional)</div>
        <div class="chip-row" id="som-assoc" style="flex-wrap: wrap;">${ds(Ht)}</div>
        <div class="section">When</div>
        <div class="form-section">
          <div class="form-row"><input type="datetime-local" id="som-date" value="${hs()}" style="text-align: left;" /></div>
        </div>
        <div style="height: 16px;"></div>
      </div>
    `,onMount(s){let o=s.querySelector("#som-val"),i=s.querySelector("#som-val-label"),n=()=>{i.textContent=co[Number(o.value)+3]};n(),o.addEventListener("input",n),Re(s,"#som-kind",{single:!0}),Re(s,"#som-emotions"),Re(s,"#som-assoc"),s.querySelector("#som-cancel").addEventListener("click",()=>t()),s.querySelector("#som-save").addEventListener("click",async()=>{await jt({kind:Fe(s,"#som-kind")[0]||"momentaryEmotion",valence:Number(o.value)/3,labels:Fe(s,"#som-emotions"),associations:Fe(s,"#som-assoc"),date:ys(s.querySelector("#som-date").value)}),t(),I("Logged State of Mind"),e?.()})}})}function uo(e){let t=H({html:`
      <div class="sheet-header">
        <button class="btn-text" id="med-cancel">Cancel</button>
        <div class="title">Add Medication</div>
        <button class="btn-text primary" id="med-save" disabled>Save</button>
      </div>
      <div class="sheet-content">
        <div class="section">Name</div>
        <div class="form-section">
          <div class="form-row"><input id="med-name" placeholder="e.g. Sertraline" style="text-align: left;" /></div>
        </div>
        <div class="section">Form (optional)</div>
        <div class="form-section">
          <div class="form-row"><input id="med-form" placeholder="e.g. tablet, 50 mg" style="text-align: left;" /></div>
        </div>
      </div>
    `,onMount(s){let o=s.querySelector("#med-name"),i=s.querySelector("#med-save");o.addEventListener("input",()=>{i.disabled=o.value.trim().length===0}),s.querySelector("#med-cancel").addEventListener("click",()=>t()),i.addEventListener("click",async()=>{o.value.trim()&&(await zt({nickname:o.value,form:s.querySelector("#med-form").value}),t(),I("Medication added"),e?.())}),setTimeout(()=>o.focus(),50)}})}function po(e,t,s){let o=e.filter(r=>!r.isArchived),i=o.length?o:e,n=H({html:`
      <div class="sheet-header">
        <button class="btn-text" id="dose-cancel">Cancel</button>
        <div class="title">Log a Dose</div>
        <button class="btn-text primary" id="dose-save">Save</button>
      </div>
      <div class="sheet-content">
        <div class="section">Medication</div>
        <div class="form-section">
          <div class="form-row">
            <select id="dose-med" style="text-align: left;">
              ${i.map(r=>`<option value="${S(r.id)}"${r.id===s?" selected":""}>${S(r.nickname||r.concept.displayText)}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="section">Status</div>
        <div class="chip-row" id="dose-status">
          ${Je.map(([r,a],l)=>`<button type="button" class="chip${l===0?" active":""}" data-chip="${r}">${S(a)}</button>`).join("")}
        </div>
        <div class="section">When</div>
        <div class="form-section">
          <div class="form-row"><input type="datetime-local" id="dose-date" value="${hs()}" style="text-align: left;" /></div>
        </div>
      </div>
    `,onMount(r){Re(r,"#dose-status",{single:!0}),r.querySelector("#dose-cancel").addEventListener("click",()=>n()),r.querySelector("#dose-save").addEventListener("click",async()=>{await Ze({medicationId:r.querySelector("#dose-med").value,status:Fe(r,"#dose-status")[0]||"taken",date:ys(r.querySelector("#dose-date").value),doseQuantity:1}),n(),I("Dose logged"),t?.()})}})}function ks(e){let t=!0,s=null;return e.container.innerHTML="",ae().then(o=>{t&&(o?s=ho(e,o):fo(e))}).catch(o=>{t&&(e.container.innerHTML=`<div class="empty-state"><div class="empty-icon">!</div><h2>Couldn't load</h2><p>${S(o.message)}</p></div>`)}),()=>{t=!1,typeof s=="function"&&s()}}async function fo(e){e.setTitle("Workout");let t=await J(),s=t[0],o=Qe(t),i=o?Ce(o.normalized):N[0],r=o&&gs(o.startedAt)==="today"?"Tomorrow":"Today",a=s?`<div class="last-workout-hint">Last: <strong>${S(s.name)}</strong> \xB7 ${gs(s.startedAt)}</div>`:"",l=`<div class="next-workout-hint">${r}: <strong>${S(i)}</strong></div>`;e.container.innerHTML=`
    <div class="workout-start">
      <div class="icon">\u{1F3CB}\uFE0F</div>
      <h2>No active workout</h2>
      <p>Start one to begin logging sets.</p>
      ${a}
      ${l}
    </div>
    <div class="action-section">
      <button id="start-btn" class="btn-primary">Start Empty Workout</button>
    </div>
    <div class="list">
      <button class="list-row" data-nav="mind">
        <div class="row-main"><div class="row-title">State of Mind</div></div>
        <div class="chevron">\u203A</div>
      </button>
      <button class="list-row" data-nav="meds">
        <div class="row-main"><div class="row-title">Medications</div></div>
        <div class="chevron">\u203A</div>
      </button>
    </div>
  `,e.container.querySelector("#start-btn").addEventListener("click",()=>mo(i,r));for(let u of e.container.querySelectorAll("[data-nav]"))u.addEventListener("click",()=>{u.dataset.nav==="mind"?ct(e,()=>e.refresh()):lt(e,()=>e.refresh())})}function gs(e){let t=new Date,s=new Date(e),o=n=>new Date(n.getFullYear(),n.getMonth(),n.getDate()).getTime(),i=Math.round((o(t)-o(s))/(1440*60*1e3));return i===0?"today":i===1?"yesterday":i<7?`${i} days ago`:i<14?"a week ago":`${Math.round(i/7)} weeks ago`}function mo(e,t="Today"){vo(e,async s=>{let o={id:F(),name:s,startedAt:Date.now(),endedAt:null,notes:""};await q("workouts",o),W("workout:changed")},t)}function vo(e,t,s="Today"){let i=H({html:`
      <div class="sheet-header">
        <button class="btn-text" id="wt-cancel">Cancel</button>
        <div class="title">New Workout</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">
        <div class="section">Pick a type</div>
        <div class="form-section">
          ${N.map(n=>{let a=n===e?` <span class="badge">${S(s)}</span>`:"";return`
              <button class="list-row button" data-name="${S(n)}">
                <div class="row-main"><div class="row-title" style="color: ${Be(n)}; font-weight: 600;">${S(n)}${a}</div></div>
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
    `,onMount(n){n.querySelector("#wt-cancel").addEventListener("click",()=>i());for(let l of n.querySelectorAll(".list-row.button[data-name]"))l.addEventListener("click",()=>{let u=l.dataset.name;i(),t(u)});let r=n.querySelector("#wt-custom"),a=n.querySelector("#wt-go");r.addEventListener("input",()=>{a.disabled=r.value.trim().length===0}),a.addEventListener("click",()=>{let l=r.value.trim();l&&(i(),t(l))}),setTimeout(()=>r.focus(),50)}})}function ho(e,t){let s=[],o=[],i=new Map,n=new Map,r=null;e.container.innerHTML=`
    <div class="active-workout">
      <div class="workout-header">
        <input class="workout-name-input" id="wname" value="${S(t.name)}" placeholder="Workout name" />
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
  `,e.container.querySelector("#calc-fab").addEventListener("click",Mo);let a=()=>{e.setTitle(kt((Date.now()-t.startedAt)/1e3))};a(),r=setInterval(a,1e3);let l=e.container.querySelector("#wname");l.addEventListener("input",async()=>{t.name=l.value,await q("workouts",{...t}),ne()});let u=new Map;e.container.querySelector("#add-exercise-btn").addEventListener("click",()=>{So(s,n,async v=>{await bo(t,o,v),await b()})}),e.container.querySelector("#finish-btn").addEventListener("click",async()=>{if(confirm("Finish this workout?")){await xo(t,o);try{let{filename:v}=await it();I(`Saved \xB7 backup: ${v}`)}catch(v){I(`Saved \xB7 backup failed: ${v.message}`)}W("workout:changed")}}),e.container.querySelector("#discard-btn").addEventListener("click",async()=>{confirm("Discard this workout? This cannot be undone.")&&(await Ee(t.id),W("workout:changed"))});async function b(){let[v,m,M]=await Promise.all([A("sets"),A("workouts"),A("exercises")]);s=M,o=v.filter(k=>k.workoutId===t.id).sort((k,x)=>k.order-x.order),i=ht(v,m,t.id),u=f(v,M,t.id),n=new Map;for(let k of v)n.set(k.exerciseId,(n.get(k.exerciseId)??0)+1);E(),$()}function $(){let v=new Map(s.map(g=>[g.id,g])),m=[],M=new Map;for(let g of o){let D=v.get(g.exerciseId);if(!D)continue;let L=R(D);if(m.includes(L)||m.push(L),!g.completed)continue;let C=(g.weight||0)*(g.reps||0);C<=0||M.set(L,(M.get(L)??0)+C)}let k=[...M.values()].reduce((g,D)=>g+D,0),x=e.container.querySelector("#workout-progress");if(!x)return;if(m.length===0){x.innerHTML="";return}let T=m.map(g=>{let D=u.get(g)??0,L=M.get(g)??0;return{muscle:g,record:D,cur:L,span:Math.max(D,L)}}),B=Math.max(...T.map(g=>g.span)),p=B>0?B*.12:1;T=T.map(g=>({...g,span:Math.max(g.span,p)}));let c=Math.max(...T.map(g=>g.span)),h=T.map(({muscle:g,record:D,cur:L,span:C})=>{let P=C/c*100,V=L>0?Math.min(100,L/C*100):0,O;if(D>0){let le=Math.round(L/D*100);O=L>D?`${le}% \u{1F525}`:`${le}%`}else O=L>0?"new \u{1F525}":"new";let U=D>0?`${K(L)} / ${K(D)} \xB7 ${O}`:`${K(L)} \xB7 ${O}`,_=Dt(g);return`
        <div class="vol-muscle" style="width: ${P.toFixed(2)}%; --mcolor: ${_}; --mtext: ${Tt(_)};" title="${S(g)}: ${K(L)} / record ${K(D)} lbs">
          <div class="vol-fill" style="width: ${V.toFixed(2)}%;"></div>
          <div class="vol-info${V>55?" on-fill":""}">
            <span class="seg-name">${S(g)}</span>
            <span class="seg-vol">${U}</span>
          </div>
        </div>
      `}).join(""),y=`<strong>${K(k)} lbs</strong> total`;x.innerHTML=`
      <div class="vol-bars">${h}</div>
      <div class="vol-label">${y}</div>
    `,requestAnimationFrame(()=>{for(let g of x.querySelectorAll(".vol-muscle"))d(g)})}function d(v){let m=v.querySelector(".seg-name"),M=v.querySelector(".seg-vol"),k=v.clientWidth-4;if(k<=0)return;if(M){let T=10;for(M.style.fontSize=`${T}px`;M.scrollWidth>k&&T>6;)T-=.5,M.style.fontSize=`${T}px`}if(!m)return;m.style.display="";let x=11;for(m.style.fontSize=`${x}px`;m.scrollWidth>k&&x>5;)x-=.5,m.style.fontSize=`${x}px`}function f(v,m,M){let k=new Map(m.map(B=>[B.id,B])),x=new Map,T=new Map;for(let B of X(v)){if(B.workoutId===M)continue;let p=k.get(B.exerciseId);if(!p)continue;let c=(B.weight||0)*(B.reps||0);if(c<=0)continue;let h=R(p),y=T.get(B.workoutId);y||T.set(B.workoutId,y=new Map),y.set(h,(y.get(h)??0)+c)}for(let B of T.values())for(let[p,c]of B)c>(x.get(p)??0)&&x.set(p,c);return x}async function w(v){if(!v.completed||(v.setType||"working")==="warmup"||!(v.weight>0)||!(v.reps>0))return;let m=s.find(c=>c.id===v.exerciseId);if(!m)return;let M=await A("sets"),k=X(M).filter(c=>c.exerciseId===v.exerciseId&&c.id!==v.id&&(c.setType||"working")!=="warmup"&&c.weight>0&&c.reps>0);if(k.length===0)return;let x=[],T=k.reduce((c,h)=>Math.max(c,h.weight),0);v.weight>T&&x.push(`Heaviest weight ever: ${me(v.weight)} lbs`);let B=v.weight*v.reps,p=k.reduce((c,h)=>Math.max(c,h.weight*h.reps),0);if(B>p&&x.push(`Most volume in a set: ${me(v.weight)}\xD7${v.reps} = ${K(B)} lbs`),x.length>0){let c=x.length>1?"New records":"New record";I(`\u{1F3C6} ${G(m)} \u2014 ${c}!
${x.join(`
`)}`,0,{persistUntilClick:!0})}}function E(){let v=new Map(s.map(p=>[p.id,p])),m=[],M=new Map;for(let p of o)M.has(p.exerciseId)||(M.set(p.exerciseId,[]),m.push(p.exerciseId)),M.get(p.exerciseId).push(p);for(let[,p]of M)p.sort((c,h)=>c.order-h.order);let k=e.container.querySelector("#exercise-sections");if(m.length===0){k.innerHTML=`
        <div class="empty-state" style="padding: 40px 24px; min-height: auto;">
          <p style="color: var(--text-secondary);">Add an exercise to start logging sets.</p>
        </div>`;return}k.innerHTML=m.map(p=>{let c=v.get(p),h=M.get(p),y=i.get(p)??new Map;return yo(c,h,y,n.get(p)??0)}).join("");function x(p){delete p.bumpedBy,delete p.preBumpWeight,delete p.preBumpReps}function T(p){let c=o.filter(L=>L.exerciseId===p.exerciseId).sort((L,C)=>L.order-C.order),h=p.setType||"working",y=0,g=0;for(let L of c)if(g+=1,(L.setType||"working")===h&&(y+=1),L.id===p.id)break;let D=we(h,y,i.get(p.exerciseId),g);return D&&D.weight>0&&D.reps>0?{weight:D.weight,reps:D.reps}:null}async function B(p){await bs(p.id,o),p.completed&&await ws(p,o,T);for(let c of o){if(c.exerciseId!==p.exerciseId)continue;let h=k.querySelector(`.set-row[data-set-id="${c.id}"]`);if(!h)continue;let y=h.querySelector(".weight-input"),g=h.querySelector(".reps-input");y&&document.activeElement!==y&&(y.value=c.weight>0?String(c.weight):""),g&&document.activeElement!==g&&(g.value=c.reps>0?String(c.reps):"")}}for(let p of k.querySelectorAll(".set-row-wrap")){let c=p.querySelector(".set-row"),h=c.dataset.setId,y=o.find(O=>O.id===h);if(!y)continue;let g=c.querySelector(".weight-input"),D=c.querySelector(".reps-input"),L=c.querySelector(".complete-btn");wo(p,async()=>{await re("sets",y.id),await b()});let C=Ye(async()=>{await B(y),y.completed&&$()},200);g.addEventListener("input",()=>{y.weight=parseFloat(g.value)||0,x(y),q("sets",{...y}).catch(O=>console.error("Set save failed",O)),C()});let P=Ye(async()=>{await B(y),y.completed&&$()},200);D.addEventListener("input",()=>{y.reps=parseInt(D.value,10)||0,x(y),q("sets",{...y}).catch(O=>console.error("Set save failed",O)),P()}),L.addEventListener("click",async()=>{let O=y.completed;y.completed=!y.completed,y.completed&&x(y),await q("sets",y),c.classList.toggle("completed",y.completed),L.innerHTML=xs(y.completed);let U=c.querySelector(".set-number")?.textContent?.trim()||"";L.setAttribute("aria-label",`${y.completed?"Mark incomplete":"Mark complete"} set ${U}`),$(),!O&&y.completed?(await ws(y,o,T)&&E(),await w(y)):O&&!y.completed&&await bs(y.id,o)&&E()});let V=c.querySelector(".set-number");V&&V.addEventListener("click",async()=>{let U=(y.setType||"working")==="warmup"?"working":"warmup";if(y.setType=U,!y.completed){let _=o.filter(ie=>ie.exerciseId===y.exerciseId).sort((ie,Ms)=>ie.order-Ms.order),le=0,ut=0;for(let ie of _)if(ut+=1,(ie.setType||"working")===U&&(le+=1),ie.id===y.id)break;let de=we(U,le,i.get(y.exerciseId),ut);de&&de.weight>0&&de.reps>0&&(y.weight=de.weight,y.reps=de.reps)}await q("sets",y),E()})}for(let p of k.querySelectorAll(".add-set-btn"))p.addEventListener("click",async()=>{let c=p.dataset.exerciseId;await ko(t,o,c,i.get(c)??new Map),await b()});for(let p of k.querySelectorAll(".exercise-menu"))p.addEventListener("click",async()=>{let c=p.dataset.exerciseId;confirm("Remove this exercise from the workout?")&&(await Ve("sets",o.filter(h=>h.exerciseId===c).map(h=>h.id)),await b())});for(let p of k.querySelectorAll(".exercise-name-btn"))p.addEventListener("click",()=>{r&&(clearInterval(r),r=null),We(e,p.dataset.exerciseId,()=>e.refresh())})}return b(),()=>{r&&clearInterval(r)}}function yo(e,t,s=new Map,o=0){let i=0,n=0,r=t.map((a,l)=>{let u=a.setType||"working",b,$;u==="warmup"?(n+=1,$=n,b=`W${n}`):(i+=1,$=i,b=String(i));let d=we(u,$,s,l+1);return go(a,b,d)}).join("");return`
    <div class="exercise-section">
      <div class="exercise-section-header">
        <button class="exercise-name-btn" data-exercise-id="${e?.id}">${se(e)}</button>
        <div class="row-trailing trailing-stack">${oe(o)}</div>
        <button class="menu exercise-menu" data-exercise-id="${e?.id}" aria-label="Remove ${S(G(e))} from workout">\xD7</button>
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
  `}function we(e,t,s,o=null){if(!s||typeof s.get!="function")return null;let i=s.get(`${e}#${t}`);return i||(o!=null?s.get(`any#${o}`)??null:null)}function go(e,t,s){let o=e.setType||"working",i=s&&s.weight>0&&s.reps>0?`${me(s.weight)} \xD7 ${s.reps}`:"\u2014";return`
    <div class="set-row-wrap" data-set-id="${e.id}">
      <button class="set-swipe-delete" data-set-id="${e.id}" aria-label="Delete set ${t}">Delete</button>
      <div class="set-row type-${o}${e.completed?" completed":""}" data-set-id="${e.id}">
        <button class="set-number" aria-label="Set ${t}, tap to mark as ${o==="warmup"?"working":"warmup"}">${t}</button>
        <div class="prev" aria-label="Previous">${i}</div>
        <input class="weight-input" type="number" inputmode="decimal" step="0.5" aria-label="Weight in pounds for set ${t}"
               placeholder="0" value="${e.weight>0?e.weight:""}" />
        <input class="reps-input" type="number" inputmode="numeric" step="1" aria-label="Repetitions for set ${t}"
               placeholder="0" value="${e.reps>0?e.reps:""}" />
        <button class="complete-btn" aria-label="${e.completed?"Mark incomplete":"Mark complete"} set ${t}">${xs(e.completed)}</button>
      </div>
    </div>
  `}function wo(e,t){let s=e.querySelector(".set-row"),o=e.querySelector(".set-swipe-delete");if(!s||!o)return;let i=88,n=0,r=0,a=0,l=0,u=!1,b=!1,$=!1,d=!1,f=()=>Math.max(140,n*.5);function w(k,x){s.style.transition=x?"transform 0.18s ease":"none",s.style.transform=`translateX(${k}px)`,o.style.width=`${Math.max(i,-k)}px`,e.classList.toggle("will-delete",k<=-f())}function E(k=!0){$=!1,w(0,k),e.classList.remove("swiped-open")}function v(k=!0){document.querySelectorAll(".set-row-wrap.swiped-open").forEach(x=>{if(x!==e){let T=x.querySelector(".set-row");T&&(T.style.transition="transform 0.18s ease",T.style.transform="translateX(0)");let B=x.querySelector(".set-swipe-delete");B&&(B.style.width=""),x.classList.remove("swiped-open","will-delete")}}),$=!0,w(-i,k),e.classList.add("swiped-open")}function m(){s.style.transition="transform 0.16s ease-out",s.style.transform=`translateX(${-n}px)`,o.style.width=`${n}px`,setTimeout(t,150)}s.addEventListener("touchstart",k=>{n=e.clientWidth||s.clientWidth,r=k.touches[0].clientX,a=k.touches[0].clientY,l=$?-i:0,u=!0,b=!1,d=!!k.target.closest("input, button, select, textarea")},{passive:!0}),s.addEventListener("touchmove",k=>{if(!u)return;let x=k.touches[0].clientX-r,T=k.touches[0].clientY-a;if(!b){if(Math.abs(T)>Math.abs(x)+4){u=!1;return}Math.abs(x)>8&&(b=!0,d&&document.activeElement?.blur&&document.activeElement.blur())}if(!b)return;k.cancelable&&k.preventDefault();let B=$?-i:0;l=Math.min(0,Math.max(-n,B+x)),w(l,!1)},{passive:!1});function M(){u&&(u=!1,b&&(l<=-f()?m():l<-i/2?v():E()))}s.addEventListener("touchend",M),s.addEventListener("touchcancel",M),o.addEventListener("click",k=>{k.stopPropagation(),t()})}function xs(e){return e?'<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>':'<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>'}async function bo(e,t,s){let o=t.reduce((i,n)=>Math.max(i,n.order),-1)+1;for(let i of s){let n=(await vt(i,e.id)).filter(l=>(l.weight||0)>0&&(l.reps||0)>0),a=(n.length>0?n:[{weight:0,reps:0,setType:"working"}]).map(l=>({id:F(),workoutId:e.id,exerciseId:i,weight:l.weight??0,reps:l.reps??0,setType:l.setType||"working",completed:!1,order:o++,createdAt:Date.now()}));await Y("sets",a)}}async function ws(e,t,s){let o=(e.weight||0)*(e.reps||0);if(o<=0)return!1;let i=!1;for(let n of t)if(n.exerciseId===e.exerciseId&&n.id!==e.id&&!((n.order??0)<=(e.order??0))&&!n.completed&&(n.weight||0)*(n.reps||0)<o){if(n.bumpedBy==null){let r=s?.(n);n.preBumpWeight=r?r.weight:n.weight,n.preBumpReps=r?r.reps:n.reps}n.bumpedBy=e.id,n.weight=e.weight,n.reps=e.reps,await q("sets",n),i=!0}return i}async function bs(e,t){let s=!1;for(let o of t)o.bumpedBy===e&&(o.completed||(o.preBumpWeight!=null&&(o.weight=o.preBumpWeight),o.preBumpReps!=null&&(o.reps=o.preBumpReps)),delete o.bumpedBy,delete o.preBumpWeight,delete o.preBumpReps,await q("sets",o),s=!0);return s}async function ko(e,t,s,o=new Map){let i=t.filter(E=>E.exerciseId===s),n=i[i.length-1],r=E=>(E?.weight||0)*(E?.reps||0),a=i.filter(E=>(E.setType||"working")!=="warmup"),l=a.length+1,u=we("working",l,o,i.length+1),b=a.filter(E=>E.weight>0&&E.reps>0).reduce((E,v)=>!E||r(v)>r(E)?v:E,null),$=a.some((E,v)=>{let m=we("working",v+1,o);return m&&m.weight>0&&m.reps>0&&r(E)>r(m)}),d=n?.weight??0,f=n?.reps??0;b&&(!u||$)&&(d=b.weight,f=b.reps);let w={id:F(),workoutId:e.id,exerciseId:s,weight:d,reps:f,completed:!1,order:(n?.order??-1)+1,createdAt:Date.now()};await q("sets",w)}async function xo(e,t){await Ve("sets",t.filter(s=>!s.completed&&((s.weight||0)===0||(s.reps||0)===0)).map(s=>s.id)),e.endedAt=Date.now(),await q("workouts",e)}function So(e,t,s){let o=new Set,i="",n=null,r=H({html:`
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
    `,onMount(a){let l=a.querySelector("#picker-list"),u=a.querySelector("#picker-add"),b=a.querySelector("#picker-cancel"),$=a.querySelector("#picker-custom"),d=a.querySelector("#picker-search"),f=a.querySelector("#picker-chips");function w(){f.innerHTML=Ae(e,n);for(let v of f.querySelectorAll(".chip"))v.addEventListener("click",()=>{let m=v.dataset.cat;n=m==="All"?null:m,w(),E()})}function E(){let v=e.filter(m=>!n||R(m)===n).filter(m=>!i||m.name.toLowerCase().includes(i.toLowerCase())).sort((m,M)=>{let k=t.get(m.id)??0,x=t.get(M.id)??0;return k!==x?x-k:m.name.localeCompare(M.name)});l.innerHTML=v.length===0?'<div class="list-row"><div class="row-main" style="color:var(--text-secondary)">No matches</div></div>':v.map(m=>`
                <button class="list-row" data-id="${m.id}">
                  ${se(m)}
                  <div class="row-trailing trailing-stack">
                    ${oe(t.get(m.id)??0)}
                    ${o.has(m.id)?$o():""}
                  </div>
                </button>
              `).join("");for(let m of l.querySelectorAll(".list-row[data-id]"))m.addEventListener("click",()=>{let M=m.dataset.id;o.has(M)?o.delete(M):o.add(M),u.disabled=o.size===0,u.textContent=o.size===0?"Add":`Add (${o.size})`,E()})}d.addEventListener("input",()=>{i=d.value,E()}),b.addEventListener("click",()=>r()),u.addEventListener("click",()=>{s(Array.from(o)),r()}),$.addEventListener("click",()=>{ge(null,async v=>{e.push(v),o.add(v.id),w(),E(),u.disabled=!1,u.textContent=`Add (${o.size})`})}),w(),E()}})}function $o(){return'<svg viewBox="0 0 24 24" width="22" height="22" fill="var(--green)"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'}function ge(e,t){let s=!!e,o=s?R(e):null,i=!o||he.includes(o)?he:[o,...he],n=e?.equipment,r=!n||De.includes(n)?De:[n,...De],a=H({html:`
      <div class="sheet-header">
        <button class="btn-text" id="ce-cancel">Cancel</button>
        <div class="title">${s?"Edit Exercise":"New Exercise"}</div>
        <button class="btn-text primary" id="ce-save" ${s?"":"disabled"}>Save</button>
      </div>
      <div class="sheet-content">
        <div class="section">Name</div>
        <div class="form-section">
          <div class="form-row">
            <input id="ce-name" placeholder="e.g. Cable Lateral Raise" style="text-align: left;" value="${S(e?.name??"")}" />
          </div>
        </div>
        <div class="section">Muscle</div>
        <div class="form-section">
          <div class="form-row">
            <label for="ce-cat">Muscle</label>
            <select id="ce-cat">${i.map(l=>`<option${l===o?" selected":""}>${S(l)}</option>`).join("")}</select>
          </div>
        </div>
        <div class="section">Equipment</div>
        <div class="form-section">
          <div class="form-row">
            <label for="ce-eq">Equipment</label>
            <select id="ce-eq">${r.map(l=>`<option${l===n?" selected":""}>${S(l)}</option>`).join("")}</select>
          </div>
        </div>
      </div>
    `,onMount(l){let u=l.querySelector("#ce-name"),b=l.querySelector("#ce-save");u.addEventListener("input",()=>{b.disabled=u.value.trim().length===0}),l.querySelector("#ce-cancel").addEventListener("click",()=>a()),b.addEventListener("click",async()=>{let $=u.value.trim();if(!$)return;let d=l.querySelector("#ce-cat").value,f=l.querySelector("#ce-eq").value,w=s?{...e,name:$,muscle:d,equipment:f}:{id:F(),name:$,muscle:d,category:d,equipment:f,notes:"",isCustom:!0,createdAt:Date.now()};await q("exercises",w),a(),t?.(w),s||W("data:changed")}),s||setTimeout(()=>u.focus(),50)}})}function Mo(){let t=[["AC","clear","fn"],["\xB1","sign","fn"],["\u232B","back","fn"],["\xF7","op","op"],["7","digit"],["8","digit"],["9","digit"],["\xD7","op","op"],["4","digit"],["5","digit"],["6","digit"],["\u2212","op","op"],["1","digit"],["2","digit"],["3","digit"],["+","op","op"],["0","digit","zero"],[".","dot"],["=","equals","op"]].map(([s,o,i])=>`<button class="calc-key${i?` calc-${i}`:""}" data-action="${o}" data-key="${S(s)}">${S(s)}</button>`).join("");H({html:`
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
    `,onMount(s,o){let i=s.querySelector("#calc-expr"),n=s.querySelector("#calc-result"),r={"+":(c,h)=>c+h,"\u2212":(c,h)=>c-h,"\xD7":(c,h)=>c*h,"\xF7":(c,h)=>h===0?NaN:c/h},a=c=>c==="+"||c==="\u2212"||c==="\xD7"||c==="\xF7",l=c=>{if(!isFinite(c))return"Error";let h=parseFloat(c.toFixed(8)).toString();return h.replace("-","").replace(".","").length>12&&(h=c.toPrecision(10).replace(/\.?0+$/,"")),h},u=["0"],b=!1,$=!1,d="",f=()=>u[u.length-1];function w(){i.textContent=$?"":d,n.textContent=$?"Error":u.join(" ");let c=!$&&a(f())?f():null;for(let h of s.querySelectorAll(".calc-op"))h.classList.toggle("selected",h.dataset.key===c)}function E(c){if($&&(u=["0"],$=!1),b)return u=[c],b=!1,w();a(f())?u.push(c):u[u.length-1]=f()==="0"?c:f()+c,w()}function v(){if($&&(u=["0"],$=!1),b)return u=["0."],b=!1,w();a(f())?u.push("0."):f().includes(".")||(u[u.length-1]=f()+"."),w()}function m(c){$||(b=!1,a(f())?u[u.length-1]=c:u.push(c),w())}function M(){u=["0"],b=!1,$=!1,w()}function k(){if($||a(f()))return;let c=f();u[u.length-1]=c.startsWith("-")?c.slice(1):c==="0"?"0":"-"+c,w()}function x(){if($)return M();if(b=!1,a(f()))return u.pop(),w();let c=f().slice(0,-1);c===""||c==="-"?u.length>1?u.pop():u=["0"]:u[u.length-1]=c,w()}function T(){if($)return;let c=u.slice();if(a(c[c.length-1])&&c.pop(),c.length<3)return;let h=parseFloat(c[0]);for(let y=1;y<c.length;y+=2)if(h=r[c[y]](h,parseFloat(c[y+1])),!isFinite(h))return $=!0,w();d=`${c.join(" ")} =`,u=[l(h)],b=!0,w()}function B(c){let{action:h,key:y}=c.dataset;h!=="equals"&&(d=""),h==="digit"?E(y):h==="dot"?v():h==="clear"?M():h==="sign"?k():h==="back"?x():h==="op"?m(y):h==="equals"&&T()}let p=null;for(let c of s.querySelectorAll(".calc-key"))c.addEventListener("pointerdown",h=>{h.preventDefault(),p=c,c.classList.add("pressed")}),c.addEventListener("pointerup",h=>{h.preventDefault(),c.classList.remove("pressed"),p===c&&B(c),p=null}),c.addEventListener("pointercancel",()=>{c.classList.remove("pressed"),p=null}),c.addEventListener("pointerleave",()=>c.classList.remove("pressed"));s.querySelector("#calc-done").addEventListener("click",()=>o())}})}function xe(){let e=window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===!0,t;e?t=Math.max(window.innerHeight||0,window.visualViewport?.height||0,window.screen?.height||0):t=window.visualViewport?.height||window.innerHeight,document.documentElement.style.setProperty("--app-height",`${t}px`)}xe();window.addEventListener("resize",xe);window.addEventListener("orientationchange",xe);window.addEventListener("pageshow",xe);window.visualViewport?.addEventListener("resize",xe);var Ss={workout:{title:"Workout",render:ks},exercises:{title:"Exercises",render:rs},progress:{title:"Progress",render:es}},be=document.getElementById("view-content"),Eo=document.getElementById("nav-title"),$s=document.getElementById("nav-back"),Q=document.getElementById("nav-action"),ke="workout",dt=null,ze=null,je=null,Ne={container:be,setTitle(e){Eo.textContent=e},setAction(e){if(!e){Q.hidden=!0,Q.innerHTML="",Q.removeAttribute("aria-label"),ze=null;return}Q.hidden=!1,e.label?Q.setAttribute("aria-label",e.label):Q.removeAttribute("aria-label"),e.html?Q.innerHTML=e.html:Q.textContent=e.label??"",ze=e.onClick},setBack(e){dt=e,$s.hidden=!e},refresh(){Se(ke)},toast(e){I(e)}};function Lo(){if(typeof je=="function")try{je()}catch(e){console.error(e)}je=null}function Se(e){ke=e,Lt(e),document.querySelectorAll(".tab").forEach(t=>{t.setAttribute("aria-selected",String(t.dataset.tab===e))}),Lo(),Ne.setTitle(Ss[e].title),Ne.setAction(null),Ne.setBack(null),be.innerHTML="",be.scrollTop=0;try{je=Ss[e].render(Ne)}catch(t){console.error("Render failed",t),be.innerHTML=`<div class="empty-state"><div class="empty-icon">!</div><h2>Render error</h2><p>${S(t.message)}</p></div>`}}document.querySelectorAll(".tab").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll(".sheet-backdrop").forEach(t=>t.dismissSheet?.()),Se(e.dataset.tab)})});$s.addEventListener("click",()=>{dt&&dt()});Q.addEventListener("click",()=>{ze&&ze()});Ke("data:changed",()=>{ne(),Se(ke)});Ke("workout:changed",()=>{ne(),ke==="workout"&&Se(ke)});document.addEventListener("visibilitychange",()=>{document.visibilityState==="visible"&&ne()});async function Do(){try{await j();let e=await Mt();e>0&&console.info(`Seeded ${e} exercises.`),await It(),Se("workout"),ne()}catch(e){console.error("Init failed:",e),be.innerHTML=`
      <div class="empty-state">
        <div class="empty-icon">!</div>
        <h2>Storage unavailable</h2>
        <p>${S(e.message??String(e))}</p>
        <p>If you are running this from a <code>file://</code> URL, serve it through a local web server instead.</p>
      </div>`}}Do();
