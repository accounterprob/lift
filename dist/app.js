var xs="lift";var pt=["exercises","workouts","sets","stateOfMind","medications","doseEvents"],$e=null;function j(){return $e?Promise.resolve($e):new Promise((e,t)=>{let s=indexedDB.open(xs,4);s.onerror=()=>t(s.error),s.onsuccess=()=>{$e=s.result,e($e)},s.onupgradeneeded=()=>{let o=s.result;if(!o.objectStoreNames.contains("exercises")){let n=o.createObjectStore("exercises",{keyPath:"id"});n.createIndex("name","name",{unique:!1}),n.createIndex("category","category",{unique:!1})}if(o.objectStoreNames.contains("workouts")||o.createObjectStore("workouts",{keyPath:"id"}).createIndex("startedAt","startedAt",{unique:!1}),!o.objectStoreNames.contains("sets")){let n=o.createObjectStore("sets",{keyPath:"id"});n.createIndex("workoutId","workoutId",{unique:!1}),n.createIndex("exerciseId","exerciseId",{unique:!1})}if(o.objectStoreNames.contains("stateOfMind")||o.createObjectStore("stateOfMind",{keyPath:"id"}).createIndex("date","date",{unique:!1}),o.objectStoreNames.contains("medications")||o.createObjectStore("medications",{keyPath:"id"}),!o.objectStoreNames.contains("doseEvents")){let n=o.createObjectStore("doseEvents",{keyPath:"id"});n.createIndex("medicationId","medicationId",{unique:!1}),n.createIndex("date","date",{unique:!1})}}})}function de(e){return new Promise((t,s)=>{e.onsuccess=()=>t(e.result),e.onerror=()=>s(e.error)})}async function ue(e,t="readonly"){return(await j()).transaction(e,t).objectStore(e)}function ee(e,t,s){return new Promise((o,n)=>{let i=e.transaction(t,"readwrite"),r;try{r=s(i)}catch(a){try{i.abort()}catch{}n(a);return}i.oncomplete=()=>o(r),i.onerror=()=>n(i.error),i.onabort=()=>n(i.error)})}async function B(e){return de((await ue(e)).getAll())}async function pe(e,t){return de((await ue(e)).get(t))}async function q(e,t){return await de((await ue(e,"readwrite")).put(t)),t}async function fe(e,t){let s=await j();return ee(s,e,o=>{let n=o.objectStore(e);for(let i of t)n.put(i)})}async function ie(e,t){return de((await ue(e,"readwrite")).delete(t))}async function Ve(e,t){if(t.length===0)return;let s=await j();return ee(s,e,o=>{let n=o.objectStore(e);for(let i of t)n.delete(i)})}async function Me(e,t,s){let o=await ue(e);return de(o.index(t).getAll(s))}async function ft(e){let t=await j();return ee(t,pt,s=>{for(let o of pt){let n=s.objectStore(o);n.clear();for(let i of e[o]??[])n.put(i)}})}function Q(e){let t=new Set;for(let s of e)s.completed&&t.add(s.workoutId);return e.filter(s=>s.completed||!t.has(s.workoutId))}async function re(){return(await B("workouts")).find(t=>!t.endedAt)??null}async function X(){return(await B("workouts")).filter(t=>t.endedAt).sort((t,s)=>s.startedAt-t.startedAt)}async function mt(e){return(await Me("sets","workoutId",e)).sort((s,o)=>s.order-o.order)}async function Ss(e){return await Me("sets","exerciseId",e)}async function vt(e,t=null){let s=await Ss(e),o=new Map;for(let r of s)t&&r.workoutId===t||(o.has(r.workoutId)||o.set(r.workoutId,[]),o.get(r.workoutId).push(r));if(o.size===0)return[];let i=(await Promise.all(Array.from(o.keys()).map(r=>pe("workouts",r)))).filter(Boolean).sort((r,a)=>(a.startedAt??0)-(r.startedAt??0));return i.length===0?[]:o.get(i[0].id).sort((r,a)=>r.order-a.order)}function ht(e,t,s=null){let o=new Map(t.map(r=>[r.id,r.startedAt??0])),n=new Map;for(let r of e){if(r.workoutId===s||!o.has(r.workoutId)||(r.weight||0)<=0||(r.reps||0)<=0)continue;let a=n.get(r.exerciseId);a||n.set(r.exerciseId,a=new Map);let l=a.get(r.workoutId);l||a.set(r.workoutId,l=[]),l.push(r)}let i=new Map;for(let[r,a]of n){let l=[...a.keys()].sort((b,$)=>o.get($)-o.get(b)),u=new Map;for(let b of l){let $=a.get(b).sort((E,v)=>E.order-v.order),d=$.every(E=>E.setType==null),f=0,g=0;$.forEach((E,v)=>{if(d){let x=`any#${v+1}`;u.has(x)||u.set(x,E);return}let m=E.setType||"working",M=m==="warmup"?g+=1:f+=1,k=`${m}#${M}`;u.has(k)||u.set(k,E)})}i.set(r,u)}return i}var $s={barbell:"Barbell",dumbbell:"Dumbbell",machine:"Machine",cable:"Cable",bodyweight:"Bodyweight",kettlebell:"Kettlebell",band:"Bands",bands:"Bands"},Ms=/\s*\((barbell|dumbbell|machine|cable|bodyweight|kettlebell|bands?)\)$|\s+(Machine|Barbell|Dumbbell|Cable|Kettlebell)$/i;async function Es(e,t){let s=await j(),o=await Me("sets","exerciseId",e);return ee(s,["sets","exercises"],n=>{let i=n.objectStore("sets");for(let r of o)i.put({...r,exerciseId:t});return n.objectStore("exercises").delete(e),o.length})}async function yt(){let e=await B("exercises"),t=e.filter(i=>/butterfly/i.test(i.name||""));if(t.length===0)return 0;let s=e.filter(i=>/chest fly/i.test(i.name||"")&&!t.some(r=>r.id===i.id)),o=s.find(i=>(i.equipment||"")==="Machine")||s[0],n=0;for(let i of t)o?n+=await Es(i.id,o.id):await q("exercises",{...i,name:"Chest Fly",equipment:"Machine"});return n}async function wt(){let e=await B("exercises"),t=[];for(let s of e){let o=(s.name||"").match(Ms);if(!o)continue;let n=s.name.slice(0,o.index).trim();if(!n||/smith$/i.test(n))continue;let i=(o[1]||o[2]).toLowerCase();t.push({...s,name:n,equipment:$s[i]||s.equipment})}return t.length>0&&await fe("exercises",t),t.length}async function gt(){let[e,t,s]=await Promise.all([B("exercises"),B("sets"),B("workouts")]),o=new Set(e.filter(u=>u.category==="Cardio").map(u=>u.id));if(o.size===0)return{exercises:0,sets:0,workouts:0};let n=t.filter(u=>o.has(u.exerciseId)),i=new Map;for(let u of t)o.has(u.exerciseId)||i.set(u.workoutId,(i.get(u.workoutId)||0)+1);let r=new Set(n.map(u=>u.workoutId)),a=s.filter(u=>r.has(u.id)&&!i.get(u.id)),l=await j();return await ee(l,["exercises","sets","workouts"],u=>{let b=u.objectStore("exercises"),$=u.objectStore("sets"),d=u.objectStore("workouts");for(let f of o)b.delete(f);for(let f of n)$.delete(f.id);for(let f of a)d.delete(f.id)}),{exercises:o.size,sets:n.length,workouts:a.length}}async function bt(e){let[t,s,o]=await Promise.all([B("exercises"),B("sets"),B("workouts")]),n=t.filter(d=>d.category==="Other");if(n.length===0)return{recategorized:0,deleted:0,workouts:0};let i=[],r=new Set;for(let d of n){let f=e(d.name);f==="Cardio"?r.add(d.id):i.push({...d,category:f&&f!=="Other"?f:"Full Body"})}let a=s.filter(d=>r.has(d.exerciseId)),l=new Map;for(let d of s)r.has(d.exerciseId)||l.set(d.workoutId,(l.get(d.workoutId)||0)+1);let u=new Set(a.map(d=>d.workoutId)),b=o.filter(d=>u.has(d.id)&&!l.get(d.id)),$=await j();return await ee($,["exercises","sets","workouts"],d=>{let f=d.objectStore("exercises"),g=d.objectStore("sets"),E=d.objectStore("workouts");for(let v of i)f.put(v);for(let v of r)f.delete(v);for(let v of a)g.delete(v.id);for(let v of b)E.delete(v.id)}),{recategorized:i.length,deleted:r.size,workouts:b.length}}async function Ee(e){let t=await j(),s=await Me("sets","workoutId",e);return ee(t,["workouts","sets"],o=>{o.objectStore("workouts").delete(e);let n=o.objectStore("sets");for(let i of s)n.delete(i.id)})}var F=()=>crypto&&crypto.randomUUID?crypto.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,e=>{let t=Math.random()*16|0;return(e==="x"?t:t&3|8).toString(16)});function me(e){return e==null?"0":Math.abs(e-Math.round(e))<.001?String(Math.round(e)):e.toFixed(1)}function ve(e){return`${me(e)} lbs`}function kt(e){let t=Math.max(0,Math.floor(e)),s=Math.floor(t/3600),o=Math.floor(t%3600/60),n=t%60;return s>0?`${s}:${String(o).padStart(2,"0")}:${String(n).padStart(2,"0")}`:`${o}:${String(n).padStart(2,"0")}`}function _e(e){let t=Math.max(0,Math.floor(e)),s=Math.floor(t/3600),o=Math.floor(t%3600/60);return s>0?`${s}h ${o}m`:`${o}m`}function Y(e){return Math.round(e).toLocaleString()}function ae(e){return`${Y(e)} lbs`}function z(e){return(e instanceof Date?e:new Date(e)).toLocaleDateString(void 0,{month:"numeric",day:"numeric",year:"2-digit"})}function xt(e){return(e instanceof Date?e:new Date(e)).toLocaleDateString(void 0,{weekday:"short",month:"short",day:"numeric",year:"numeric"})}function Ye(e,t=200){let s=null;return(...o)=>{clearTimeout(s),s=setTimeout(()=>e(...o),t)}}function S(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function I(e,t=1800,s={}){let o=document.querySelector(".toast");o&&o.remove();let n=document.createElement("div");n.className="toast",n.textContent=e,s.persistUntilClick?(n.classList.add("toast-clickable"),n.addEventListener("click",()=>n.remove())):setTimeout(()=>n.remove(),t),document.body.appendChild(n)}var Ue=new EventTarget;function H(e,t){Ue.dispatchEvent(new CustomEvent(e,{detail:t}))}function Ke(e,t){return Ue.addEventListener(e,t),()=>Ue.removeEventListener(e,t)}function W({html:e,onMount:t}){let s=document.createElement("div");s.className="sheet-backdrop",s.innerHTML='<div class="sheet"></div>';let o=s.querySelector(".sheet");o.innerHTML=e;let n=Ls();document.body.appendChild(s);function i(){let l=window.visualViewport;if(!l){o.style.maxHeight=`${window.innerHeight-n-10}px`;return}let u=Math.max(window.innerHeight,document.documentElement.clientHeight),b=Math.max(0,u-l.height-l.offsetTop);b>0?(o.style.paddingBottom=`${b}px`,o.style.maxHeight=`${l.height-n-10+b}px`):(o.style.paddingBottom="",o.style.maxHeight=`${l.height-n-10}px`)}i();let r=window.visualViewport;r?.addEventListener("resize",i),r?.addEventListener("scroll",i);function a(){s.remove(),r?.removeEventListener("resize",i),r?.removeEventListener("scroll",i)}return s.dismissSheet=a,s.addEventListener("click",l=>{l.target===s&&a()}),t?.(o,a),a}function Ls(){let e=document.createElement("div");e.style.cssText="position:fixed;top:0;left:0;width:0;height:env(safe-area-inset-top);",document.body.appendChild(e);let t=e.offsetHeight||0;return e.remove(),t}function Le(){return'<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" style="color: var(--red);"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>'}function St(){return'<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M16 5l-1.42 1.42-1.59-1.59V16h-2V4.83L9.41 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z"/></svg>'}function J(e){return`<div class="empty-state"><div class="empty-icon">!</div><h2>Couldn't load</h2><p>${S(e.message||String(e))}</p></div>`}var he=["Pectorals","Anterior Deltoid","Lateral Deltoid","Posterior Deltoid","Triceps","Biceps","Forearms","Lats","Upper Back","Lower Back","Traps","Quadriceps","Hamstrings","Glutes","Adductors","Abductors","Calves","Abs","Obliques"];function Ds(e){let t=new Map(he.map((s,o)=>[s,o]));return[...e].sort((s,o)=>(t.get(s)??999)-(t.get(o)??999)||s.localeCompare(o))}var De=["Barbell","Dumbbell","Machine","Cable","Bodyweight","Other"];function K(e){let t=e?.equipment,s=e?.name??"";return t&&t!=="Other"?`${s} (${t})`:s}function te(e){let t=e?[e.equipment,R(e)].filter(Boolean).join(" \xB7 "):"";return`
    <div class="row-main">
      <div class="row-title">${S(e?.name??"Unknown exercise")}</div>
      ${t?`<div class="row-subtitle">${S(t)}</div>`:""}
    </div>
  `}function se(e){return e?`<div class="exercise-count">${e} ${e===1?"set":"sets"}</div>`:""}function Be(e,t){return["All",...Ds(new Set(e.map(o=>R(o))))].map(o=>`<button class="chip${o==="All"&&!t||o===t?" active":""}" data-cat="${S(o)}">${S(o)}</button>`).join("")}var Bs=[["Bench Press (Barbell)","Chest","Barbell"],["Bench Press (Dumbbell)","Chest","Dumbbell"],["Incline Bench Press (Barbell)","Chest","Barbell"],["Incline Bench Press (Dumbbell)","Chest","Dumbbell"],["Decline Bench Press (Barbell)","Chest","Barbell"],["Chest Fly (Dumbbell)","Chest","Dumbbell"],["Chest Fly (Machine)","Chest","Machine"],["Cable Crossover","Chest","Cable"],["Push-Up","Chest","Bodyweight"],["Dip (Chest)","Chest","Bodyweight"],["Deadlift (Conventional)","Back","Barbell"],["Deadlift (Sumo)","Back","Barbell"],["Romanian Deadlift","Back","Barbell"],["Bent-Over Row (Barbell)","Back","Barbell"],["Pendlay Row","Back","Barbell"],["Row (Dumbbell)","Back","Dumbbell"],["T-Bar Row","Back","Barbell"],["Seated Cable Row","Back","Cable"],["Lat Pulldown","Back","Cable"],["Pull-Up","Back","Bodyweight"],["Chin-Up","Back","Bodyweight"],["Face Pull","Back","Cable"],["Shrug (Barbell)","Back","Barbell"],["Shrug (Dumbbell)","Back","Dumbbell"],["Overhead Press (Barbell)","Shoulders","Barbell"],["Overhead Press (Dumbbell)","Shoulders","Dumbbell"],["Seated Shoulder Press (Machine)","Shoulders","Machine"],["Arnold Press","Shoulders","Dumbbell"],["Lateral Raise (Dumbbell)","Shoulders","Dumbbell"],["Lateral Raise (Cable)","Shoulders","Cable"],["Front Raise (Dumbbell)","Shoulders","Dumbbell"],["Rear Delt Fly (Dumbbell)","Shoulders","Dumbbell"],["Reverse Pec Deck","Shoulders","Machine"],["Upright Row","Shoulders","Barbell"],["Barbell Curl","Biceps","Barbell"],["Dumbbell Curl","Biceps","Dumbbell"],["Hammer Curl","Biceps","Dumbbell"],["Preacher Curl","Biceps","Barbell"],["Incline Dumbbell Curl","Biceps","Dumbbell"],["Cable Curl","Biceps","Cable"],["Concentration Curl","Biceps","Dumbbell"],["Close-Grip Bench Press","Triceps","Barbell"],["Tricep Pushdown (Cable)","Triceps","Cable"],["Overhead Tricep Extension (Dumbbell)","Triceps","Dumbbell"],["Overhead Tricep Extension (Cable)","Triceps","Cable"],["Skull Crusher","Triceps","Barbell"],["Dip (Tricep)","Triceps","Bodyweight"],["Tricep Kickback","Triceps","Dumbbell"],["Back Squat","Legs","Barbell"],["Front Squat","Legs","Barbell"],["Goblet Squat","Legs","Dumbbell"],["Bulgarian Split Squat","Legs","Dumbbell"],["Lunge","Legs","Dumbbell"],["Leg Press","Legs","Machine"],["Leg Extension","Legs","Machine"],["Leg Curl (Seated)","Legs","Machine"],["Leg Curl (Lying)","Legs","Machine"],["Hip Thrust (Barbell)","Glutes","Barbell"],["Glute Bridge","Glutes","Bodyweight"],["Cable Kickback","Glutes","Cable"],["Hip Abduction (Machine)","Glutes","Machine"],["Standing Calf Raise","Calves","Machine"],["Seated Calf Raise","Calves","Machine"],["Plank","Core","Bodyweight"],["Hanging Leg Raise","Core","Bodyweight"],["Cable Crunch","Core","Cable"],["Russian Twist","Core","Bodyweight"],["Ab Wheel Rollout","Core","Other"],["Wrist Curl","Forearms","Dumbbell"],["Reverse Wrist Curl","Forearms","Dumbbell"],["Farmer's Carry","Forearms","Dumbbell"]];function R(e){if(e?.muscle)return e.muscle;let t=(e?.name||"").toLowerCase();return t?/romanian deadlift|\brdl\b|stiff.?leg|good morning|nordic|hamstring/.test(t)||/leg curl/.test(t)?"Hamstrings":/leg extension|sissy squat/.test(t)?"Quadriceps":/calf|tib raise|tibialis/.test(t)?"Calves":/hip adduction|adductor|inner thigh|copenhagen/.test(t)?"Adductors":/hip abduction|abductor|outer thigh|clamshell/.test(t)?"Abductors":/hip thrust|glute|cable kickback|donkey kick|rear kick|frog pump/.test(t)?"Glutes":/squat|leg press|lunge|step.?up/.test(t)?"Quadriceps":/back extension|hyperextension|superman/.test(t)||/deadlift|rack pull/.test(t)?"Lower Back":/lateral raise|side raise|side delt|\blat raise\b|upright row/.test(t)?"Lateral Deltoid":/rear delt|reverse fly|reverse flye|face pull|reverse pec deck/.test(t)?"Posterior Deltoid":/front raise|shoulder press|overhead press|arnold|military press|landmine press|push press|viking press/.test(t)?"Anterior Deltoid":/pulldown|pull.?down|pull.?up|chin.?up|pullover|straight.?arm/.test(t)?"Lats":/shrug/.test(t)?"Traps":/tricep|pushdown|skull ?crusher|close.?grip bench|jm press|french press|bench dip/.test(t)?"Triceps":/wrist curl|reverse curl|forearm|farmer|gripper|dead hang/.test(t)?"Forearms":/bicep|\bcurl\b/.test(t)?"Biceps":/\brow\b|rear pull|high pull/.test(t)?"Upper Back":/bench|chest|\bpec\b|pec deck|crossover|butterfly|push.?up|floor press|squeeze press|\bfly\b|\bflye\b/.test(t)?"Pectorals":/russian twist|woodchop|wood chop|side plank|side bend|oblique|pallof|rotation/.test(t)?"Obliques":/crunch|sit.?up|plank|leg raise|knee raise|ab wheel|ab roll|hanging|toes.?to.?bar|v.?up|dead bug|mountain climber/.test(t)?"Abs":/\bdip\b/.test(t)?"Triceps":e.category||"Other":e?.category||"Other"}var Ts=/\b(bike|biking|treadmill|run|running|cardio|step.?mill|elliptical|stair.?master|stair.?climber|jog|jogging|cycling|spinning|spin class|rowing machine|row machine|\berg\b|sprints?|jump.?rope|skipping rope|swim|swimming|hike|hiking)\b/,As={Quadriceps:"Legs",Hamstrings:"Legs",Adductors:"Legs",Abductors:"Legs",Glutes:"Glutes",Calves:"Calves",Pectorals:"Chest","Anterior Deltoid":"Shoulders","Lateral Deltoid":"Shoulders","Posterior Deltoid":"Shoulders",Lats:"Back","Upper Back":"Back",Traps:"Back","Lower Back":"Back",Biceps:"Biceps",Triceps:"Triceps",Forearms:"Forearms",Abs:"Core",Obliques:"Core"};function $t(e){let t=(e||"").toLowerCase().trim();if(!t)return"Full Body";if(Ts.test(t))return"Cardio";let s=R({name:t,category:""});return As[s]||"Full Body"}async function Mt(){if((await B("exercises")).length>0)return 0;let t=Date.now(),s=Bs.map(([o,n,i])=>({id:F(),name:o,category:n,equipment:i,notes:"",isCustom:!1,createdAt:t}));return await fe("exercises",s),s.length}var Et="workout";function Lt(e){Et!==e&&(Et=e,H("tab:changed",e))}var N=["Chest Day","Leg Day","Back/Bi Day"],Te={"Chest Day":{key:"chest",short:"Chest",cssVar:"--day-chest"},"Leg Day":{key:"leg",short:"Legs",cssVar:"--day-leg"},"Back/Bi Day":{key:"back",short:"Back/Bi",cssVar:"--day-back"}};function Ae(e){let t=Te[e];return t?`var(${t.cssVar})`:"var(--text-tertiary)"}function Ge(e){if(!e)return null;let t=e.toLowerCase();return t.includes("chest")?"Chest Day":t.includes("leg")&&!t.includes("curl")&&!t.includes("extension")?"Leg Day":t.includes("back")||t.includes("pull")?"Back/Bi Day":t.includes("push")?"Chest Day":null}function Qe(e){for(let t of e){let s=Ge(t.name);if(s)return{name:t.name,normalized:s,startedAt:t.startedAt}}return null}function Ce(e){let t=N.indexOf(e);return t===-1?N[0]:N[(t+1)%N.length]}var Cs={Pectorals:"#ec4899",Triceps:"#be185d","Anterior Deltoid":"#831843","Lateral Deltoid":"#f9a8d4",Quadriceps:"#facc15",Hamstrings:"#b45309",Glutes:"#f59e0b",Calves:"#fde68a",Adductors:"#bdb76b",Abductors:"#78350f",Lats:"#2563eb","Upper Back":"#38bdf8",Biceps:"#1e40af","Posterior Deltoid":"#bfdbfe",Traps:"#0891b2","Lower Back":"#475569",Forearms:"#22c55e",Abs:"#ef4444",Obliques:"#14b8a6",Other:"#6b7280"};function Dt(e){return Cs[e]??"#6b7280"}var Is={Pectorals:"Chest Day",Triceps:"Chest Day","Anterior Deltoid":"Chest Day","Lateral Deltoid":"Chest Day",Quadriceps:"Leg Day",Hamstrings:"Leg Day",Glutes:"Leg Day",Calves:"Leg Day",Adductors:"Leg Day",Abductors:"Leg Day",Lats:"Back/Bi Day","Upper Back":"Back/Bi Day",Biceps:"Back/Bi Day","Posterior Deltoid":"Back/Bi Day",Traps:"Back/Bi Day","Lower Back":"Back/Bi Day",Forearms:"Back/Bi Day"};function qs(e){return Is[e]??null}function Ps(e,t,s){let o=Ge(e);if(o)return o;let n=new Map;for(let a of t){let l=s.get(a.exerciseId);if(!l)continue;let u=qs(R(l));if(!u)continue;let b=(a.weight||0)*(a.reps||0);b<=0||n.set(u,(n.get(u)??0)+b)}let i=null,r=0;for(let[a,l]of n)l>r&&(i=a,r=l);return i}function Bt(e,t,s){let o=[...e].sort((r,a)=>r.startedAt-a.startedAt),n=new Map,i=null;for(let r of o){let a=Ps(r.name,t.get(r.id)??[],s);a||(i?At(i.startedAt,r.startedAt)?a=i.day:a=Ce(i.day):a=N[0]),n.set(r.id,a),i={day:a,startedAt:r.startedAt}}return n}function Tt(e){let t=parseInt(e.slice(1),16);return((t>>16&255)*299+(t>>8&255)*587+(t&255)*114)/1e3>=150?"#1c1c1e":"#ffffff"}function At(e,t){let s=new Date(e),o=new Date(t);return s.getFullYear()===o.getFullYear()&&s.getMonth()===o.getMonth()&&s.getDate()===o.getDate()}function Os(e,t){let s=Ge(t?.name);if(s)return s;let o=Qe(e);return o?At(o.startedAt,Date.now())?o.normalized:Ce(o.normalized):N[0]}var Ws="lift-today-day";async function oe(){try{let[e,t]=await Promise.all([X(),re()]),s=Os(e,t),o=Te[s].key;document.documentElement.dataset.day!==o&&(document.documentElement.dataset.day=o);try{localStorage.setItem(Ws,o)}catch{}return s}catch{return null}}var Ct="lift-migrations-done-v1";async function Xe(){let e=await gt();e.exercises>0&&console.info(`Removed ${e.exercises} cardio exercise(s), ${e.sets} set(s), ${e.workouts} cardio-only workout(s).`);let t=await bt($t);if(t.recategorized>0||t.deleted>0){console.info(`Reorganized "Other": recategorized ${t.recategorized}, removed ${t.deleted} cardio, dropped ${t.workouts} empty workout(s).`);let n=[];t.recategorized>0&&n.push(`sorted ${t.recategorized} exercise${t.recategorized===1?"":"s"}`),t.deleted>0&&n.push(`removed ${t.deleted} cardio`),I(`Cleaned up \u201COther\u201D: ${n.join(", ")}.`)}let s=await wt();s>0&&console.info(`Stripped equipment from ${s} exercise name(s).`);let o=await yt();o>0&&I(`Merged Butterfly into Chest Fly (${o} sets moved).`)}async function It(){try{if(localStorage.getItem(Ct))return}catch{}await Xe();try{localStorage.setItem(Ct,String(Date.now()))}catch{}}var Ie="lift-backup-passphrase";var qt="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";function Je(e){let t=new Uint8Array(e),s="",o=32768;for(let n=0;n<t.length;n+=o)s+=String.fromCharCode.apply(null,t.subarray(n,n+o));return btoa(s)}var Ze=e=>Uint8Array.from(atob(e),t=>t.charCodeAt(0));function Hs(){let t=[...crypto.getRandomValues(new Uint8Array(20))].map(s=>qt[s%qt.length]);return[0,5,10,15].map(s=>t.slice(s,s+5).join("")).join("-")}function et(){let e=null;try{e=localStorage.getItem(Ie)}catch{}if(!e){e=Hs();try{localStorage.setItem(Ie,e)}catch{}}return e}function Pt(){try{return localStorage.getItem(Ie)}catch{return null}}function Ot(e){try{localStorage.setItem(Ie,e)}catch{}}async function Wt(e,t){let s=await crypto.subtle.importKey("raw",new TextEncoder().encode(e),"PBKDF2",!1,["deriveKey"]);return crypto.subtle.deriveKey({name:"PBKDF2",hash:"SHA-256",salt:t,iterations:25e4},s,{name:"AES-GCM",length:256},!1,["encrypt","decrypt"])}function Ht(e){return!!e&&e.lift==="encrypted-backup"&&typeof e.data=="string"}async function Rt(e,t){let s=crypto.getRandomValues(new Uint8Array(16)),o=crypto.getRandomValues(new Uint8Array(12)),n=await Wt(t,s),i=new TextEncoder().encode(JSON.stringify(e)),r=await crypto.subtle.encrypt({name:"AES-GCM",iv:o},n,i);return{lift:"encrypted-backup",v:1,exportedAt:new Date().toISOString(),kdf:{name:"PBKDF2",hash:"SHA-256",iterations:25e4,salt:Je(s)},cipher:"AES-GCM",iv:Je(o),data:Je(r)}}async function tt(e,t){let s=Ze(e.kdf.salt),o=Ze(e.iv),n=await Wt(t,s),i;try{i=await crypto.subtle.decrypt({name:"AES-GCM",iv:o},n,Ze(e.data))}catch{throw new Error("Wrong backup password (or the file is damaged).")}return JSON.parse(new TextDecoder().decode(i))}async function Rs(){let[e,t,s,o,n,i]=await Promise.all([B("exercises"),B("workouts"),B("sets"),B("stateOfMind"),B("medications"),B("doseEvents")]);return{version:2,exportedAt:new Date().toISOString(),exercises:e,workouts:t,sets:s,stateOfMind:o,medications:n,doseEvents:i}}function Fs(){let e=new Date,t=s=>String(s).padStart(2,"0");return`lift-backup-${e.getFullYear()}${t(e.getMonth()+1)}${t(e.getDate())}-${t(e.getHours())}${t(e.getMinutes())}${t(e.getSeconds())}.json`}async function st(){let e=await Rs(),t=et(),s=await Rt(e,t),o=JSON.stringify(s),n=new Blob([o],{type:"application/json"}),i=URL.createObjectURL(n),r=Fs(),a=document.createElement("a");return a.href=i,a.download=r,a.style.display="none",document.body.appendChild(a),a.click(),setTimeout(()=>{document.body.removeChild(a),URL.revokeObjectURL(i)},1e3),{filename:r,bytes:n.size,snapshot:e}}async function Ns(e){let t=Pt();if(t)try{return await tt(e,t)}catch{}for(let s=0;s<3;s++){let o=prompt("Enter your backup password (saved in your Passwords app):");if(o==null)throw new Error("Restore cancelled.");try{let n=await tt(e,o.trim());return Ot(o.trim()),n}catch(n){if(s===2)throw n;alert("Wrong password \u2014 try again.")}}}async function js(e){let t=JSON.parse(await e.text()),s=Ht(t)?await Ns(t):t;if(!s||!Array.isArray(s.exercises)||!Array.isArray(s.workouts)||!Array.isArray(s.sets))throw new Error("File doesn't look like a Lift backup.");return await ft({exercises:s.exercises,workouts:s.workouts,sets:s.sets,stateOfMind:s.stateOfMind??[],medications:s.medications??[],doseEvents:s.doseEvents??[]}),await Xe(),{exercises:s.exercises.length,workouts:s.workouts.length,sets:s.sets.length,stateOfMind:(s.stateOfMind??[]).length}}function Ft(){let e=et();W({html:`
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

        <input type="file" id="bk-file" accept=".json,application/json" style="display: none;" />
      </div>
    `,onMount(t,s){t.querySelector("#bk-close").addEventListener("click",()=>s()),t.querySelector("#bk-copy").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(e),I("Password copied \u2014 save it in your Passwords app")}catch{I("Copy failed \u2014 long-press the password to select it")}}),t.querySelector("#bk-export").addEventListener("click",async()=>{try{let{filename:n,bytes:i}=await st();I(`Exported ${n} (${zs(i)})`)}catch(n){I(`Export failed: ${n.message}`)}});let o=t.querySelector("#bk-file");t.querySelector("#bk-import").addEventListener("click",()=>{o.value="",o.click()}),o.addEventListener("change",async n=>{let i=n.target.files?.[0];if(i&&confirm("Replace all current data with this backup? This cannot be undone."))try{let r=await js(i);s(),I(`Restored ${r.workouts} workouts, ${r.exercises} exercises`),H("data:changed")}catch(r){I(`Restore failed: ${r.message}`)}})}})}function zs(e){return e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/(1024*1024)).toFixed(1)} MB`}var qe=[{key:"1W",tick:"1W",days:7},{key:"1M",tick:"1M",days:30},{key:"3M",tick:"3M",days:90},{key:"1Y",tick:"1Y",days:365},{key:"All",tick:"All",all:!0}];function Vs(e){let t=new Map;for(let s of e){let o=new Date(s.date),n=`${o.getFullYear()}-${o.getMonth()}-${o.getDate()}`,i=t.get(n)||{date:s.date,total:0,count:0};i.total+=s.value,i.count+=1,i.date=Math.min(i.date,s.date),t.set(n,i)}return[...t.values()].map(s=>({date:s.date,value:s.total/s.count})).sort((s,o)=>s.date-o.date)}function ye(e,t,s={}){let o=t.length>0&&t[0].points!==void 0,n=(o?t:[{points:t}]).map(p=>({label:p.label??"",color:p.color||"var(--accent)",points:Vs(p.points)})).filter(p=>p.points.length>0),i=s.defaultPeriod||"All",r=Math.max(0,qe.findIndex(p=>p.key===i)),a=qe.length-1,l=null;function u(){let p=qe[r],c=n.map((w,D)=>l===null||D===l?w.points:[]);if(p.all)return c;let h=Date.now()-p.days*864e5,y=c.map(w=>w.filter(D=>D.date>=h));return y.every(w=>w.length===0)?c.map(w=>w.slice(-1)):y}let b=o&&n.some(p=>p.label)?`<div class="chart-legend">${n.map((p,c)=>`<button class="legend-item" data-i="${c}" style="--dcolor: ${p.color};" aria-pressed="false">${p.label}</button>`).join("")}</div>`:"";e.innerHTML=`
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
  `;let $=e.querySelector('[data-role="scrub"]'),d=e.querySelector('[data-role="chart"]'),f=e.querySelector('[data-role="range"]'),g=e.querySelector(".chart-range"),E=[...e.querySelectorAll(".chart-slider-ticks span")],v=s.unit||"lbs",m=null;function M(){let p=u(),c=Us(p,n,v);d.innerHTML=c.html,m=c.geom;let h=p.flat();if(h.length>=2){let y=Math.min(...h.map(D=>D.date)),w=Math.max(...h.map(D=>D.date));f.innerHTML=`<span>${ot(y)}</span><span>${ot(w)}</span>`}else f.innerHTML="";E.forEach((y,w)=>y.classList.toggle("active",w===r))}g.addEventListener("input",()=>{r=Number(g.value),T(),M()});let k=[...e.querySelectorAll(".chart-legend .legend-item")];for(let p of k)p.addEventListener("click",()=>{let c=Number(p.dataset.i);l=l===c?null:c,k.forEach((h,y)=>{h.classList.toggle("dimmed",l!==null&&y!==l),h.setAttribute("aria-pressed",String(l===y))}),T(),M()});function x(p){if(!m||m.pts.length<2)return;let c=d.querySelector("svg"),h=c?.getScreenCTM();if(!h)return;let y=new DOMPoint(p,0).matrixTransform(h.inverse()).x,w=0,D=1/0;m.pts.forEach((O,U)=>{let _=Math.abs(O.x-y);_<D&&(D=_,w=U)});let L=m.pts[w],C=c.querySelector(".chart-scrub-line"),P=c.querySelector(".chart-scrub-dot");C&&(C.setAttribute("x1",L.x),C.setAttribute("x2",L.x),C.removeAttribute("visibility")),P&&(P.setAttribute("cx",L.x),P.setAttribute("cy",L.y),P.style.fill=L.color,P.removeAttribute("visibility"));let V=L.label?` \xB7 ${L.label}`:"";$.textContent=`${ot(L.date)}${V} \xB7 ${Math.round(L.value).toLocaleString()} ${v}`}function T(){$.textContent="";let p=d.querySelector("svg");p?.querySelector(".chart-scrub-line")?.setAttribute("visibility","hidden"),p?.querySelector(".chart-scrub-dot")?.setAttribute("visibility","hidden")}let A=!1;d.addEventListener("pointerdown",p=>{A=!0,d.setPointerCapture?.(p.pointerId),x(p.clientX)}),d.addEventListener("pointermove",p=>{A&&x(p.clientX)});for(let p of["pointerup","pointercancel"])d.addEventListener(p,()=>{A=!1,T()});M()}function ot(e){return new Date(e).toLocaleDateString(void 0,{month:"short",day:"numeric",year:"numeric"})}function Us(e,t,s){let i={top:16,right:14,bottom:14,left:52},r=400-i.left-i.right,a=200-i.top-i.bottom,l=e.flat();if(l.length===0)return{html:`<svg viewBox="0 0 400 200"><text x="${400/2}" y="${200/2}" text-anchor="middle" class="chart-axis-label">No data in range</text></svg>`,geom:null};if(l.length===1){let w=l[0],D=t[e.findIndex(P=>P.length>0)]?.color||"var(--accent)",L=i.left+r/2,C=i.top+a/2;return{html:`<svg viewBox="0 0 400 200"><circle cx="${L}" cy="${C}" r="4" class="chart-point" style="fill: ${D};"/><text x="${L}" y="${C-10}" text-anchor="middle" class="chart-axis-label">${Math.round(w.value).toLocaleString()} ${s}</text></svg>`,geom:null}}let u=l.map(w=>w.date),b=l.map(w=>w.value),$=Math.min(...u),d=Math.max(...u),f=Math.max(...b),g=Math.min(...b),E=Math.max(f-g,1),v=Math.max(0,g-E*.12),m=f+E*.12,M=w=>i.left+(w-$)/Math.max(d-$,1)*r,k=w=>i.top+a-(w-v)/(m-v)*a,x=4,T=w=>Math.round(w).toLocaleString(),A=Array.from({length:x+1},(w,D)=>{let L=v+(m-v)*D/x,C=k(L);return`<text x="${i.left-6}" y="${C+3}" text-anchor="end" class="chart-axis-label">${T(L)}</text>`}).join(""),p=Array.from({length:x+1},(w,D)=>{let L=i.top+a*D/x;return`<line x1="${i.left}" x2="${400-i.right}" y1="${L}" y2="${L}" class="chart-axis-line"/>`}).join(""),c=[],h=e.map((w,D)=>{let L=t[D],C=w.map(P=>({x:M(P.date),y:k(P.value)}));return w.forEach((P,V)=>c.push({...C[V],date:P.date,value:P.value,label:L.label,color:L.color})),C.length===0?"":C.length===1?`<circle cx="${C[0].x}" cy="${C[0].y}" r="3.5" class="chart-point" style="fill: ${L.color};"/>`:`<path d="${_s(C)}" class="chart-line" style="stroke: ${L.color};"/>`}).join("");return{html:`
    <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet">
      ${p}
      ${A}
      ${h}
      <line class="chart-scrub-line" y1="${i.top}" y2="${i.top+a}" x1="0" x2="0" visibility="hidden"/>
      <circle class="chart-scrub-dot" r="4.5" visibility="hidden"/>
    </svg>
  `,geom:{pts:c}}}function _s(e){if(e.length<2)return"";let t=`M ${e[0].x.toFixed(1)} ${e[0].y.toFixed(1)}`;for(let s=0;s<e.length-1;s++){let o=e[s===0?0:s-1],n=e[s],i=e[s+1],r=e[s+2]||i,a=n.x+(i.x-o.x)/6,l=n.y+(i.y-o.y)/6,u=i.x-(r.x-n.x)/6,b=i.y-(r.y-n.y)/6;t+=` C ${a.toFixed(1)} ${l.toFixed(1)}, ${u.toFixed(1)} ${b.toFixed(1)}, ${i.x.toFixed(1)} ${i.y.toFixed(1)}`}return t}var Z=null;function Nt(e){let t=!0;return jt().then(s=>{t&&(Z=s,Pe(e))}).catch(s=>{t&&(e.container.innerHTML=J(s))}),()=>{t=!1}}async function jt(){let[e,t,s]=await Promise.all([X(),B("sets"),B("exercises")]),o=new Map(s.map(g=>[g.id,g])),n=new Map;for(let g of Q(t))n.has(g.workoutId)||n.set(g.workoutId,[]),n.get(g.workoutId).push(g);let i=0,r=0,a=new Map,l=new Map,u=new Map,b=Bt(e,n,o);for(let g of e){let E=n.get(g.id)||[],v=E.reduce((m,M)=>m+M.weight*M.reps,0);if(i+=v,r+=E.length,v>0){let m=b.get(g.id);a.has(m)||a.set(m,[]),a.get(m).push({date:g.startedAt,value:v})}for(let m of E){let M=o.get(m.exerciseId);if(!M)continue;let k=l.get(m.exerciseId)||{id:m.exerciseId,exercise:M,count:0};if(k.count+=1,l.set(m.exerciseId,k),m.weight>0&&m.reps>0){let x=u.get(m.exerciseId);(!x||m.weight>x.weight||m.weight===x.weight&&m.reps>x.reps)&&u.set(m.exerciseId,{id:m.exerciseId,weight:m.weight,reps:m.reps,date:g.startedAt,name:K(M)})}}}let $=Array.from(l.entries()).sort((g,E)=>E[1].count-g[1].count).map(([,g])=>g),d=Array.from(u.values()).sort((g,E)=>E.weight-g.weight),f=N.filter(g=>a.has(g)).map(g=>({label:Te[g].short,color:Ae(g),points:a.get(g)}));return{workouts:e,allSets:t,allExercises:s,exMap:o,setsByWorkout:n,totalVolume:i,totalSets:r,volumeSeries:f,topExercises:$,prs:d}}function Pe(e){if(e.setTitle("Progress"),e.setBack(null),e.setAction({label:"Backup and restore",html:St(),onClick:()=>Ft()}),e.container.scrollTop=0,!Z||Z.workouts.length===0){e.container.innerHTML=`
      <div class="empty-state">
        <div class="empty-icon">\u{1F4C8}</div>
        <h2>No data yet</h2>
        <p>Finish a workout and your stats and trends will show up here.</p>
      </div>
    `;return}let{workouts:t,totalVolume:s,totalSets:o,volumeSeries:n,topExercises:i,prs:r}=Z;e.container.innerHTML=`
    <div class="section">Totals</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Total Volume</div><div class="stat-value">${ae(s)}</div></div>
      <div class="stat-row"><div class="stat-label">Total Sets</div><div class="stat-value">${o.toLocaleString()}</div></div>
    </div>

    ${n.length>0?`
      <div class="section">Workout Volume</div>
      <div class="volume-chart-mount"></div>
    `:""}

    <div class="list" style="margin-top: 16px;">
      <button class="list-row" data-page="trained">
        <div class="row-main">
          <div class="row-title">Most-Trained Exercises</div>
          <div class="row-subtitle">${i.length} tracked</div>
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
  `;let a=e.container.querySelector(".volume-chart-mount");a&&n.length>0&&ye(a,n,{unit:"lbs"});for(let l of e.container.querySelectorAll("[data-page]"))l.addEventListener("click",()=>{let u=l.dataset.page;u==="trained"?Ys(e):u==="prs"?Ks(e):u==="history"&&zt(e)})}function Ys(e){e.setTitle("Most-Trained"),e.setBack(()=>Pe(e)),e.setAction(null);let{topExercises:t}=Z;e.container.innerHTML=`
    <div class="list" style="margin-top: 16px;">
      ${t.map(s=>`
        <button class="list-row" data-exercise-id="${S(s.id)}">
          ${te(s.exercise)}
          <div class="row-trailing trailing-stack">${se(s.count)}</div>
          <div class="chevron">\u203A</div>
        </button>
      `).join("")}
    </div>
  `,e.container.scrollTop=0,nt(e)}function Ks(e){e.setTitle("Personal Records"),e.setBack(()=>Pe(e)),e.setAction(null);let{prs:t}=Z;e.container.innerHTML=`
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
  `,e.container.scrollTop=0,nt(e)}function nt(e){for(let t of e.container.querySelectorAll("[data-exercise-id]"))t.addEventListener("click",()=>{Oe(t.dataset.exerciseId)})}function zt(e){e.setTitle("Workout History"),e.setBack(()=>Pe(e)),e.setAction(null);let{workouts:t,setsByWorkout:s,exMap:o}=Z;e.container.innerHTML=`
    <div class="list" style="margin-top: 16px;">
      ${t.map(n=>Gs(n,s.get(n.id)||[],o)).join("")}
    </div>
  `,e.container.scrollTop=0;for(let n of e.container.querySelectorAll("[data-workout-id]"))n.addEventListener("click",()=>{let i=n.dataset.workoutId;Qs(e,i).catch(r=>{e.container.innerHTML=J(r)})})}function Gs(e,t,s){let o=t,n=o.reduce((l,u)=>l+u.weight*u.reps,0),i=(e.endedAt-e.startedAt)/1e3,r=[],a=new Set;for(let l of t){if(a.has(l.exerciseId))continue;a.add(l.exerciseId);let u=s.get(l.exerciseId);if(u&&r.push(u.name),r.length>=3)break}return`
    <button class="list-row" data-workout-id="${e.id}">
      <div class="row-main">
        <div class="row-title" style="font-weight: 600;">${S(e.name)}</div>
        <div class="row-subtitle" style="margin-top: 4px;">
          ${z(e.startedAt)} \xB7 ${_e(i)} \xB7 ${o.length} sets \xB7 ${ae(n)}
        </div>
        ${r.length>0?`<div class="row-subtitle" style="margin-top: 4px;">${S(r.join(" \xB7 "))}${a.size>3?" \u2026":""}</div>`:""}
      </div>
      <div class="chevron">\u203A</div>
    </button>
  `}async function Vt(e){let[t,s,o]=await Promise.all([pe("workouts",e),B("exercises"),mt(e)]);if(!t)return null;let n=new Map(s.map(d=>[d.id,d])),i=new Map,r=[];for(let d of o)i.has(d.exerciseId)||(i.set(d.exerciseId,[]),r.push(d.exerciseId)),i.get(d.exerciseId).push(d);let a=Q(o),l=a.reduce((d,f)=>d+f.weight*f.reps,0),u=a.length,b=(t.endedAt-t.startedAt)/1e3,$=`
    <div class="section">Summary</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Date</div><div class="stat-value">${xt(t.startedAt)}</div></div>
      <div class="stat-row"><div class="stat-label">Duration</div><div class="stat-value">${_e(b)}</div></div>
      <div class="stat-row"><div class="stat-label">Total Volume</div><div class="stat-value">${ae(l)}</div></div>
      <div class="stat-row"><div class="stat-label">Completed Sets</div><div class="stat-value">${u}</div></div>
    </div>

    ${r.map(d=>{let f=n.get(d),g=i.get(d),E=0,v=0;return`
        ${f?`<button class="section section-link" data-exercise-id="${S(d)}">${S(K(f))}<span class="name-chevron">\u203A</span></button>`:'<div class="section">Unknown exercise</div>'}
        <div class="form-section">
          ${g.map(M=>{let x=(M.setType||"working")==="warmup"?`W${++v}`:String(++E);return`
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
  `;return{workout:t,html:$,sets:o}}function Ut(e,t){for(let s of e.querySelectorAll("input.hist-input[data-set-id]"))s.addEventListener("input",async()=>{let o=t.find(n=>n.id===s.dataset.setId);o&&(s.dataset.field==="weight"?o.weight=parseFloat(s.value)||0:o.reps=parseInt(s.value,10)||0,await q("sets",{...o}))})}async function Qs(e,t){e.setBack(async()=>{Z=await jt(),zt(e)}),e.setAction({label:"Delete workout",html:Le(),onClick:async()=>{confirm("Delete this workout?")&&(await Ee(t),H("data:changed"))}});let s=await Vt(t);if(!s){e.container.innerHTML=J({message:"Workout not found."});return}e.setTitle(s.workout.name),e.container.innerHTML=s.html,e.container.scrollTop=0,nt(e),Ut(e.container,s.sets)}async function _t(e){let t=await Vt(e);if(!t)return;let s=W({html:`
      <div class="sheet-header">
        <button class="btn-text" id="wd-close">Done</button>
        <div class="title">${S(t.workout.name)}</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">${t.html}</div>
    `,onMount(o){o.querySelector("#wd-close").addEventListener("click",()=>s());for(let n of o.querySelectorAll("[data-exercise-id]"))n.addEventListener("click",()=>Oe(n.dataset.exerciseId));Ut(o,t.sets)}})}function Yt(e){let t=!0;return Kt(e).catch(s=>{t&&(e.container.innerHTML=J(s))}),()=>{t=!1}}async function Kt(e){e.setTitle("Exercises"),e.setBack(null),e.setAction({label:"Add exercise",html:'<span style="font-size: 24px;">+</span>',onClick:()=>{we(null)}});let[t,s]=await Promise.all([B("exercises"),B("sets")]),o=t.sort((d,f)=>d.name.localeCompare(f.name)),n=new Map;for(let d of s)n.set(d.exerciseId,(n.get(d.exerciseId)??0)+1);let i="",r=null;e.container.innerHTML=`
    <div class="search-bar">
      <input class="search-input" id="ex-search" placeholder="Search exercises" />
    </div>
    <div class="chip-row" id="ex-chips"></div>
    <div class="list" id="ex-list"></div>
  `,e.container.scrollTop=0;let a=e.container.querySelector("#ex-list"),l=e.container.querySelector("#ex-chips"),u=e.container.querySelector("#ex-search");function b(){l.innerHTML=Be(o,r);for(let d of l.querySelectorAll(".chip"))d.addEventListener("click",()=>{let f=d.dataset.cat;r=f==="All"?null:f,b(),$()})}function $(){let d=o.filter(f=>!r||R(f)===r).filter(f=>!i||f.name.toLowerCase().includes(i.toLowerCase()));if(d.length===0){a.innerHTML='<div class="list-row"><div class="row-main" style="color: var(--text-secondary);">No matches</div></div>';return}a.innerHTML=d.map(f=>`
        <button class="list-row" data-id="${f.id}">
          ${te(f)}
          <div class="row-trailing trailing-stack">${se(n.get(f.id)??0)}</div>
          <div class="chevron">\u203A</div>
        </button>
      `).join("");for(let f of a.querySelectorAll("[data-id]"))f.addEventListener("click",()=>{Xs(e,f.dataset.id).catch(g=>{e.container.innerHTML=J(g)})})}u.addEventListener("input",()=>{i=u.value,$()}),b(),$()}function Xs(e,t){return We(e,t,()=>Kt(e))}async function We(e,t,s){e.setBack(s);let o=await Qt(t);if(!o){e.container.innerHTML=J({message:"Exercise not found."});return}e.setTitle(K(o.exercise)),e.setAction(o.exercise.isCustom?{label:"Delete exercise",html:Le(),onClick:async()=>{if(o.completed.length>0){alert(`Can't delete \u2014 this exercise has ${o.completed.length} logged set${o.completed.length===1?"":"s"}.`);return}confirm("Delete this custom exercise?")&&(await ie("exercises",t),H("data:changed"))}}:null),e.container.innerHTML=o.html,e.container.scrollTop=0,e.container.querySelector("#exd-edit")?.addEventListener("click",()=>{we(o.exercise,()=>We(e,t,s))}),Gt(e.container);let n=e.container.querySelector(".exercise-chart-mount");n&&o.chartData.length>0&&ye(n,o.chartData,{unit:"lbs"})}function Gt(e){for(let t of e.querySelectorAll(".recent-set[data-workout-id]"))t.addEventListener("click",()=>_t(t.dataset.workoutId))}async function Oe(e){let t=await Qt(e);if(!t)return;let s=W({html:`
      <div class="sheet-header">
        <button class="btn-text" id="exd-close">Done</button>
        <div class="title">${S(K(t.exercise))}</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">${t.html}</div>
    `,onMount(o){o.querySelector("#exd-close").addEventListener("click",()=>s()),o.querySelector("#exd-edit")?.addEventListener("click",()=>{we(t.exercise,()=>{s(),H("data:changed"),Oe(e)})}),Gt(o);let n=o.querySelector(".exercise-chart-mount");n&&t.chartData.length>0&&ye(n,t.chartData,{unit:"lbs"})}})}async function Qt(e){let[t,s,o,n]=await Promise.all([pe("exercises",e),B("sets"),B("workouts"),re()]);if(!t)return null;let i=new Map(o.map(d=>[d.id,d])),r=Q(s).filter(d=>d.exerciseId===e&&d.workoutId!==n?.id&&i.has(d.workoutId)).map(d=>({...d,workout:i.get(d.workoutId)})).sort((d,f)=>d.workout.startedAt-f.workout.startedAt),a=r.reduce((d,f)=>d+f.weight*f.reps,0),l=r.reduce((d,f)=>!d||f.weight>d.weight||f.weight===d.weight&&f.reps>d.reps?f:d,null),u=new Map;for(let d of r){if(d.weight<=0||d.reps<=0||(d.setType||"working")==="warmup")continue;let f=u.get(d.workoutId)||{date:d.workout.startedAt,total:0,count:0};f.total+=d.weight*d.reps,f.count+=1,u.set(d.workoutId,f)}let b=Array.from(u.values()).map(({date:d,total:f,count:g})=>({date:d,value:f/g})).sort((d,f)=>d.date-f.date),$=`
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
        <div class="stat-row"><div class="stat-label">Total Volume</div><div class="stat-value">${ae(a)}</div></div>
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
  `;return{exercise:t,completed:r,chartData:b,html:$}}var Zt=["Amazed","Excited","Happy","Joyful","Content","Calm","Grateful","Hopeful","Confident","Proud","Surprised","Indifferent","Anxious","Stressed","Overwhelmed","Frustrated","Angry","Irritated","Sad","Lonely","Discouraged","Drained","Worried","Embarrassed"],es=["Health","Fitness","Self-Care","Hobbies","Identity","Community","Family","Friends","Partner","Work","Education","Money","Weather","Tasks"],it=[["taken","Taken"],["skipped","Skipped"],["snoozed","Snoozed"],["notInteracted","Not interacted"]],Js=new Set(["taken","skipped","snoozed","notInteracted"]);function Zs(e){let t=Number(e);return isFinite(t)?Math.max(-1,Math.min(1,t)):0}async function ts({kind:e,valence:t,labels:s,associations:o,date:n}){let i={id:F(),kind:e==="dailyMood"?"dailyMood":"momentaryEmotion",date:n||Date.now(),valence:Zs(t),labels:s||[],associations:o||[]};return await q("stateOfMind",i),i}async function ss({nickname:e,form:t,hasSchedule:s}){let o=(e||"").trim()||"Medication",n={id:F(),nickname:o,isArchived:!1,hasSchedule:!!s,concept:{identifier:"",displayText:o,form:(t||"").trim(),rxnorm:[]}};return await q("medications",n),n}async function rt({medicationId:e,status:t,date:s,doseQuantity:o}){let n={id:F(),medicationId:String(e),status:Js.has(t)?t:"taken",date:s||Date.now(),scheduledQuantity:0,doseQuantity:Number(o)||0};return await q("doseEvents",n),n}async function os(e,t){await ie(e,t)}async function at(){let[e,t,s]=await Promise.all([B("stateOfMind"),B("medications"),B("doseEvents")]);return e.sort((o,n)=>o.date-n.date),s.sort((o,n)=>o.date-n.date),{stateOfMind:e,medications:t,doseEvents:s}}var Xt=e=>{let t=new Date(e);return`${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`},Jt=e=>e.length?e.reduce((t,s)=>t+s,0)/e.length:null;function ns(e,t){let s=new Set(t.map(a=>Xt(a.startedAt))),o=[],n=[];for(let a of e)(s.has(Xt(a.date))?o:n).push(a.valence);let i=Jt(o),r=Jt(n);return{onWorkout:i,offWorkout:r,delta:i!=null&&r!=null?i-r:null,onCount:o.length,offCount:n.length}}function is(e,t){let s=new Map;for(let o of t){if(o.status!=="taken"&&o.status!=="skipped")continue;let n=s.get(o.medicationId)??{taken:0,total:0};n.total+=1,o.status==="taken"&&(n.taken+=1),s.set(o.medicationId,n)}return e.map(o=>{let n=s.get(o.id)??{taken:0,total:0};return{medication:o,taken:n.taken,total:n.total,pct:n.total?n.taken/n.total:null}})}var eo=Object.fromEntries(it),as=e=>new Date(e).toLocaleTimeString(void 0,{hour:"numeric",minute:"2-digit"}),cs='<span style="font-size: 24px;">+</span>';async function ct(e,t){let s=()=>ct(e,t);e.setTitle("State of Mind"),e.setBack(t),e.setAction({html:cs,onClick:()=>ao(s)});let[{stateOfMind:o},n]=await Promise.all([at(),X()]),i=ns(o,n);e.container.innerHTML=`
    ${o.length?`
      <div class="section">Summary</div>
      <div class="form-section">
        <div class="stat-row"><div class="stat-label">Entries</div><div class="stat-value">${o.length.toLocaleString()}</div></div>
        <div class="stat-row"><div class="stat-label">Range</div><div class="stat-value">${z(o[0].date)} \u2013 ${z(o[o.length-1].date)}</div></div>
        <div class="stat-row"><div class="stat-label">Average mood</div><div class="stat-value">${He(no(o))}</div></div>
      </div>

      <div class="section">Mood vs. training</div>
      <div class="form-section">
        <div class="stat-row"><div class="stat-label">On workout days</div><div class="stat-value">${i.onWorkout!=null?He(i.onWorkout)+` (${i.onCount})`:"\u2014"}</div></div>
        <div class="stat-row"><div class="stat-label">On rest days</div><div class="stat-value">${i.offWorkout!=null?He(i.offWorkout)+` (${i.offCount})`:"\u2014"}</div></div>
        <div class="stat-row"><div class="stat-label">Difference</div><div class="stat-value">${i.delta!=null?(i.delta>=0?"+":"")+i.delta.toFixed(2):"\u2014"}</div></div>
      </div>

      <div class="section">Recent entries</div>
      <div class="list">${o.slice(-30).reverse().map(to).join("")}</div>
    `:ls("\u{1F9E0}","No mood entries","Tap \uFF0B to log how you're feeling.")}
  `,e.container.scrollTop=0,us(e,s)}function to(e){let t=e.labels.length?e.labels.join(", "):e.kind==="dailyMood"?"Daily mood":"Momentary";return`
    <div class="list-row">
      <div class="row-main">
        <div class="row-title">${S(t)}</div>
        <div class="row-subtitle">${z(e.date)} \xB7 ${as(e.date)}${e.associations.length?" \xB7 "+S(e.associations.join(", ")):""}</div>
      </div>
      <div class="row-trailing">${He(e.valence)}</div>
      ${ds("stateOfMind",e.id)}
    </div>`}async function lt(e,t){let s=()=>lt(e,t);e.setTitle("Medications"),e.setBack(t),e.setAction({html:cs,onClick:()=>co(s)});let{medications:o,doseEvents:n}=await at(),i=is(o,n),r=new Map(o.map(l=>[l.id,l.nickname||l.concept.displayText])),a=n.slice(-20).reverse();e.container.innerHTML=`
    ${o.length?`
      <div class="section">Your medications</div>
      ${i.map(so).join("")}
      ${a.length?`
        <div class="section">Recent doses</div>
        <div class="list">${a.map(l=>oo(l,r)).join("")}</div>
      `:""}
    `:ls("\u{1F48A}","No medications","Tap \uFF0B to add one, then log each dose as you take it.")}
  `,e.container.scrollTop=0;for(let l of e.container.querySelectorAll("[data-take]"))l.addEventListener("click",async()=>{await rt({medicationId:l.dataset.take,status:l.dataset.status,date:Date.now(),doseQuantity:1}),I(l.dataset.status==="taken"?"Logged as taken":"Logged as skipped"),s()});for(let l of e.container.querySelectorAll("[data-logat]"))l.addEventListener("click",()=>lo(o,s,l.dataset.logat));us(e,s)}function so(e){let t=e.medication,s=[t.concept.form||"No form set",e.pct!=null?`${Math.round(e.pct*100)}% taken (${e.taken}/${e.total})`:"no doses yet"].join(" \xB7 ");return`
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
    </div>`}function oo(e,t){return`
    <div class="list-row">
      <div class="row-main">
        <div class="row-title">${S(t.get(e.medicationId)||"Medication")}</div>
        <div class="row-subtitle">${z(e.date)} \xB7 ${as(e.date)}</div>
      </div>
      <div class="row-trailing">${S(eo[e.status]||e.status)}</div>
      ${ds("doseEvents",e.id)}
    </div>`}function ls(e,t,s){return`
    <div class="empty-state" style="padding: 48px 24px; min-height: auto;">
      <div class="empty-icon">${e}</div>
      <h2>${S(t)}</h2>
      <p>${S(s)}</p>
    </div>`}function ds(e,t){return`<button class="hz-del" data-del-store="${e}" data-del-id="${S(t)}" aria-label="Delete">\u2715</button>`}function us(e,t){for(let s of e.container.querySelectorAll("[data-del-id]"))s.addEventListener("click",async()=>{confirm("Delete this entry?")&&(await os(s.dataset.delStore,s.dataset.delId),t())})}function no(e){return e.reduce((t,s)=>t+s.valence,0)/e.length}function io(e){return e>=.5?"Very pleasant":e>=.15?"Pleasant":e>-.15?"Neutral":e>-.5?"Unpleasant":"Very unpleasant"}var He=e=>S(io(e)),ro=["Very Unpleasant","Unpleasant","Slightly Unpleasant","Neutral","Slightly Pleasant","Pleasant","Very Pleasant"];function ps(){let e=new Date,t=s=>String(s).padStart(2,"0");return`${e.getFullYear()}-${t(e.getMonth()+1)}-${t(e.getDate())}T${t(e.getHours())}:${t(e.getMinutes())}`}function fs(e){let t=e?new Date(e).getTime():NaN;return isFinite(t)?t:Date.now()}function rs(e,t=[]){return e.map(s=>`<button type="button" class="chip${t.includes(s)?" active":""}" data-chip="${S(s)}">${S(s)}</button>`).join("")}function Re(e,t,s={}){for(let o of e.querySelectorAll(`${t} .chip`))o.addEventListener("click",()=>{s.single&&e.querySelectorAll(`${t} .chip`).forEach(n=>n.classList.remove("active")),o.classList.toggle("active",s.single?!0:!o.classList.contains("active"))})}var Fe=(e,t)=>[...e.querySelectorAll(`${t} .chip.active`)].map(s=>s.dataset.chip);function ao(e){let t=W({html:`
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
        <div class="chip-row" id="som-emotions" style="flex-wrap: wrap;">${rs(Zt)}</div>
        <div class="section">What's affecting you? (optional)</div>
        <div class="chip-row" id="som-assoc" style="flex-wrap: wrap;">${rs(es)}</div>
        <div class="section">When</div>
        <div class="form-section">
          <div class="form-row"><input type="datetime-local" id="som-date" value="${ps()}" style="text-align: left;" /></div>
        </div>
        <div style="height: 16px;"></div>
      </div>
    `,onMount(s){let o=s.querySelector("#som-val"),n=s.querySelector("#som-val-label"),i=()=>{n.textContent=ro[Number(o.value)+3]};i(),o.addEventListener("input",i),Re(s,"#som-kind",{single:!0}),Re(s,"#som-emotions"),Re(s,"#som-assoc"),s.querySelector("#som-cancel").addEventListener("click",()=>t()),s.querySelector("#som-save").addEventListener("click",async()=>{await ts({kind:Fe(s,"#som-kind")[0]||"momentaryEmotion",valence:Number(o.value)/3,labels:Fe(s,"#som-emotions"),associations:Fe(s,"#som-assoc"),date:fs(s.querySelector("#som-date").value)}),t(),I("Logged State of Mind"),e?.()})}})}function co(e){let t=W({html:`
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
    `,onMount(s){let o=s.querySelector("#med-name"),n=s.querySelector("#med-save");o.addEventListener("input",()=>{n.disabled=o.value.trim().length===0}),s.querySelector("#med-cancel").addEventListener("click",()=>t()),n.addEventListener("click",async()=>{o.value.trim()&&(await ss({nickname:o.value,form:s.querySelector("#med-form").value}),t(),I("Medication added"),e?.())}),setTimeout(()=>o.focus(),50)}})}function lo(e,t,s){let o=e.filter(r=>!r.isArchived),n=o.length?o:e,i=W({html:`
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
              ${n.map(r=>`<option value="${S(r.id)}"${r.id===s?" selected":""}>${S(r.nickname||r.concept.displayText)}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="section">Status</div>
        <div class="chip-row" id="dose-status">
          ${it.map(([r,a],l)=>`<button type="button" class="chip${l===0?" active":""}" data-chip="${r}">${S(a)}</button>`).join("")}
        </div>
        <div class="section">When</div>
        <div class="form-section">
          <div class="form-row"><input type="datetime-local" id="dose-date" value="${ps()}" style="text-align: left;" /></div>
        </div>
      </div>
    `,onMount(r){Re(r,"#dose-status",{single:!0}),r.querySelector("#dose-cancel").addEventListener("click",()=>i()),r.querySelector("#dose-save").addEventListener("click",async()=>{await rt({medicationId:r.querySelector("#dose-med").value,status:Fe(r,"#dose-status")[0]||"taken",date:fs(r.querySelector("#dose-date").value),doseQuantity:1}),i(),I("Dose logged"),t?.()})}})}function ys(e){let t=!0,s=null;return e.container.innerHTML="",re().then(o=>{t&&(o?s=mo(e,o):uo(e))}).catch(o=>{t&&(e.container.innerHTML=`<div class="empty-state"><div class="empty-icon">!</div><h2>Couldn't load</h2><p>${S(o.message)}</p></div>`)}),()=>{t=!1,typeof s=="function"&&s()}}async function uo(e){e.setTitle("Workout");let t=await X(),s=t[0],o=Qe(t),n=o?Ce(o.normalized):N[0],r=o&&ms(o.startedAt)==="today"?"Tomorrow":"Today",a=s?`<div class="last-workout-hint">Last: <strong>${S(s.name)}</strong> \xB7 ${ms(s.startedAt)}</div>`:"",l=`<div class="next-workout-hint">${r}: <strong>${S(n)}</strong></div>`;e.container.innerHTML=`
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
  `,e.container.querySelector("#start-btn").addEventListener("click",()=>po(n,r));for(let u of e.container.querySelectorAll("[data-nav]"))u.addEventListener("click",()=>{u.dataset.nav==="mind"?ct(e,()=>e.refresh()):lt(e,()=>e.refresh())})}function ms(e){let t=new Date,s=new Date(e),o=i=>new Date(i.getFullYear(),i.getMonth(),i.getDate()).getTime(),n=Math.round((o(t)-o(s))/(1440*60*1e3));return n===0?"today":n===1?"yesterday":n<7?`${n} days ago`:n<14?"a week ago":`${Math.round(n/7)} weeks ago`}function po(e,t="Today"){fo(e,async s=>{let o={id:F(),name:s,startedAt:Date.now(),endedAt:null,notes:""};await q("workouts",o),H("workout:changed")},t)}function fo(e,t,s="Today"){let n=W({html:`
      <div class="sheet-header">
        <button class="btn-text" id="wt-cancel">Cancel</button>
        <div class="title">New Workout</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">
        <div class="section">Pick a type</div>
        <div class="form-section">
          ${N.map(i=>{let a=i===e?` <span class="badge">${S(s)}</span>`:"";return`
              <button class="list-row button" data-name="${S(i)}">
                <div class="row-main"><div class="row-title" style="color: ${Ae(i)}; font-weight: 600;">${S(i)}${a}</div></div>
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
    `,onMount(i){i.querySelector("#wt-cancel").addEventListener("click",()=>n());for(let l of i.querySelectorAll(".list-row.button[data-name]"))l.addEventListener("click",()=>{let u=l.dataset.name;n(),t(u)});let r=i.querySelector("#wt-custom"),a=i.querySelector("#wt-go");r.addEventListener("input",()=>{a.disabled=r.value.trim().length===0}),a.addEventListener("click",()=>{let l=r.value.trim();l&&(n(),t(l))}),setTimeout(()=>r.focus(),50)}})}function mo(e,t){let s=[],o=[],n=new Map,i=new Map,r=null;e.container.innerHTML=`
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
  `,e.container.querySelector("#calc-fab").addEventListener("click",So);let a=()=>{e.setTitle(kt((Date.now()-t.startedAt)/1e3))};a(),r=setInterval(a,1e3);let l=e.container.querySelector("#wname");l.addEventListener("input",async()=>{t.name=l.value,await q("workouts",{...t}),oe()});let u=new Map;e.container.querySelector("#add-exercise-btn").addEventListener("click",()=>{ko(s,i,async v=>{await wo(t,o,v),await b()})}),e.container.querySelector("#finish-btn").addEventListener("click",async()=>{if(confirm("Finish this workout?")){await bo(t,o);try{let{filename:v}=await st();I(`Saved \xB7 backup: ${v}`)}catch(v){I(`Saved \xB7 backup failed: ${v.message}`)}H("workout:changed")}}),e.container.querySelector("#discard-btn").addEventListener("click",async()=>{confirm("Discard this workout? This cannot be undone.")&&(await Ee(t.id),H("workout:changed"))});async function b(){let[v,m,M]=await Promise.all([B("sets"),B("workouts"),B("exercises")]);s=M,o=v.filter(k=>k.workoutId===t.id).sort((k,x)=>k.order-x.order),n=ht(v,m,t.id),u=f(v,M,t.id),i=new Map;for(let k of v)i.set(k.exerciseId,(i.get(k.exerciseId)??0)+1);E(),$()}function $(){let v=new Map(s.map(w=>[w.id,w])),m=[],M=new Map;for(let w of o){let D=v.get(w.exerciseId);if(!D)continue;let L=R(D);if(m.includes(L)||m.push(L),!w.completed)continue;let C=(w.weight||0)*(w.reps||0);C<=0||M.set(L,(M.get(L)??0)+C)}let k=[...M.values()].reduce((w,D)=>w+D,0),x=e.container.querySelector("#workout-progress");if(!x)return;if(m.length===0){x.innerHTML="";return}let T=m.map(w=>{let D=u.get(w)??0,L=M.get(w)??0;return{muscle:w,record:D,cur:L,span:Math.max(D,L)}}),A=Math.max(...T.map(w=>w.span)),p=A>0?A*.12:1;T=T.map(w=>({...w,span:Math.max(w.span,p)}));let c=Math.max(...T.map(w=>w.span)),h=T.map(({muscle:w,record:D,cur:L,span:C})=>{let P=C/c*100,V=L>0?Math.min(100,L/C*100):0,O;if(D>0){let ce=Math.round(L/D*100);O=L>D?`${ce}% \u{1F525}`:`${ce}%`}else O=L>0?"new \u{1F525}":"new";let U=D>0?`${Y(L)} / ${Y(D)} \xB7 ${O}`:`${Y(L)} \xB7 ${O}`,_=Dt(w);return`
        <div class="vol-muscle" style="width: ${P.toFixed(2)}%; --mcolor: ${_}; --mtext: ${Tt(_)};" title="${S(w)}: ${Y(L)} / record ${Y(D)} lbs">
          <div class="vol-fill" style="width: ${V.toFixed(2)}%;"></div>
          <div class="vol-info${V>55?" on-fill":""}">
            <span class="seg-name">${S(w)}</span>
            <span class="seg-vol">${U}</span>
          </div>
        </div>
      `}).join(""),y=`<strong>${Y(k)} lbs</strong> total`;x.innerHTML=`
      <div class="vol-bars">${h}</div>
      <div class="vol-label">${y}</div>
    `,requestAnimationFrame(()=>{for(let w of x.querySelectorAll(".vol-muscle"))d(w)})}function d(v){let m=v.querySelector(".seg-name"),M=v.querySelector(".seg-vol"),k=v.clientWidth-4;if(k<=0)return;if(M){let T=10;for(M.style.fontSize=`${T}px`;M.scrollWidth>k&&T>6;)T-=.5,M.style.fontSize=`${T}px`}if(!m)return;m.style.display="";let x=11;for(m.style.fontSize=`${x}px`;m.scrollWidth>k&&x>5;)x-=.5,m.style.fontSize=`${x}px`}function f(v,m,M){let k=new Map(m.map(A=>[A.id,A])),x=new Map,T=new Map;for(let A of Q(v)){if(A.workoutId===M)continue;let p=k.get(A.exerciseId);if(!p)continue;let c=(A.weight||0)*(A.reps||0);if(c<=0)continue;let h=R(p),y=T.get(A.workoutId);y||T.set(A.workoutId,y=new Map),y.set(h,(y.get(h)??0)+c)}for(let A of T.values())for(let[p,c]of A)c>(x.get(p)??0)&&x.set(p,c);return x}async function g(v){if(!v.completed||(v.setType||"working")==="warmup"||!(v.weight>0)||!(v.reps>0))return;let m=s.find(c=>c.id===v.exerciseId);if(!m)return;let M=await B("sets"),k=Q(M).filter(c=>c.exerciseId===v.exerciseId&&c.id!==v.id&&(c.setType||"working")!=="warmup"&&c.weight>0&&c.reps>0);if(k.length===0)return;let x=[],T=k.reduce((c,h)=>Math.max(c,h.weight),0);v.weight>T&&x.push(`Heaviest weight ever: ${me(v.weight)} lbs`);let A=v.weight*v.reps,p=k.reduce((c,h)=>Math.max(c,h.weight*h.reps),0);if(A>p&&x.push(`Most volume in a set: ${me(v.weight)}\xD7${v.reps} = ${Y(A)} lbs`),x.length>0){let c=x.length>1?"New records":"New record";I(`\u{1F3C6} ${K(m)} \u2014 ${c}!
${x.join(`
`)}`,0,{persistUntilClick:!0})}}function E(){let v=new Map(s.map(p=>[p.id,p])),m=[],M=new Map;for(let p of o)M.has(p.exerciseId)||(M.set(p.exerciseId,[]),m.push(p.exerciseId)),M.get(p.exerciseId).push(p);for(let[,p]of M)p.sort((c,h)=>c.order-h.order);let k=e.container.querySelector("#exercise-sections");if(m.length===0){k.innerHTML=`
        <div class="empty-state" style="padding: 40px 24px; min-height: auto;">
          <p style="color: var(--text-secondary);">Add an exercise to start logging sets.</p>
        </div>`;return}k.innerHTML=m.map(p=>{let c=v.get(p),h=M.get(p),y=n.get(p)??new Map;return vo(c,h,y,i.get(p)??0)}).join("");function x(p){delete p.bumpedBy,delete p.preBumpWeight,delete p.preBumpReps}function T(p){let c=o.filter(L=>L.exerciseId===p.exerciseId).sort((L,C)=>L.order-C.order),h=p.setType||"working",y=0,w=0;for(let L of c)if(w+=1,(L.setType||"working")===h&&(y+=1),L.id===p.id)break;let D=ge(h,y,n.get(p.exerciseId),w);return D&&D.weight>0&&D.reps>0?{weight:D.weight,reps:D.reps}:null}async function A(p){await hs(p.id,o),p.completed&&await vs(p,o,T);for(let c of o){if(c.exerciseId!==p.exerciseId)continue;let h=k.querySelector(`.set-row[data-set-id="${c.id}"]`);if(!h)continue;let y=h.querySelector(".weight-input"),w=h.querySelector(".reps-input");y&&document.activeElement!==y&&(y.value=c.weight>0?String(c.weight):""),w&&document.activeElement!==w&&(w.value=c.reps>0?String(c.reps):"")}}for(let p of k.querySelectorAll(".set-row-wrap")){let c=p.querySelector(".set-row"),h=c.dataset.setId,y=o.find(O=>O.id===h);if(!y)continue;let w=c.querySelector(".weight-input"),D=c.querySelector(".reps-input"),L=c.querySelector(".complete-btn");yo(p,async()=>{await ie("sets",y.id),await b()});let C=Ye(async()=>{await A(y),y.completed&&$()},200);w.addEventListener("input",()=>{y.weight=parseFloat(w.value)||0,x(y),q("sets",{...y}).catch(O=>console.error("Set save failed",O)),C()});let P=Ye(async()=>{await A(y),y.completed&&$()},200);D.addEventListener("input",()=>{y.reps=parseInt(D.value,10)||0,x(y),q("sets",{...y}).catch(O=>console.error("Set save failed",O)),P()}),L.addEventListener("click",async()=>{let O=y.completed;y.completed=!y.completed,y.completed&&x(y),await q("sets",y),c.classList.toggle("completed",y.completed),L.innerHTML=ws(y.completed);let U=c.querySelector(".set-number")?.textContent?.trim()||"";L.setAttribute("aria-label",`${y.completed?"Mark incomplete":"Mark complete"} set ${U}`),$(),!O&&y.completed?(await vs(y,o,T)&&E(),await g(y)):O&&!y.completed&&await hs(y.id,o)&&E()});let V=c.querySelector(".set-number");V&&V.addEventListener("click",async()=>{let U=(y.setType||"working")==="warmup"?"working":"warmup";if(y.setType=U,!y.completed){let _=o.filter(ne=>ne.exerciseId===y.exerciseId).sort((ne,ks)=>ne.order-ks.order),ce=0,ut=0;for(let ne of _)if(ut+=1,(ne.setType||"working")===U&&(ce+=1),ne.id===y.id)break;let le=ge(U,ce,n.get(y.exerciseId),ut);le&&le.weight>0&&le.reps>0&&(y.weight=le.weight,y.reps=le.reps)}await q("sets",y),E()})}for(let p of k.querySelectorAll(".add-set-btn"))p.addEventListener("click",async()=>{let c=p.dataset.exerciseId;await go(t,o,c,n.get(c)??new Map),await b()});for(let p of k.querySelectorAll(".exercise-menu"))p.addEventListener("click",async()=>{let c=p.dataset.exerciseId;confirm("Remove this exercise from the workout?")&&(await Ve("sets",o.filter(h=>h.exerciseId===c).map(h=>h.id)),await b())});for(let p of k.querySelectorAll(".exercise-name-btn"))p.addEventListener("click",()=>{r&&(clearInterval(r),r=null),We(e,p.dataset.exerciseId,()=>e.refresh())})}return b(),()=>{r&&clearInterval(r)}}function vo(e,t,s=new Map,o=0){let n=0,i=0,r=t.map((a,l)=>{let u=a.setType||"working",b,$;u==="warmup"?(i+=1,$=i,b=`W${i}`):(n+=1,$=n,b=String(n));let d=ge(u,$,s,l+1);return ho(a,b,d)}).join("");return`
    <div class="exercise-section">
      <div class="exercise-section-header">
        <button class="exercise-name-btn" data-exercise-id="${e?.id}">${te(e)}</button>
        <div class="row-trailing trailing-stack">${se(o)}</div>
        <button class="menu exercise-menu" data-exercise-id="${e?.id}" aria-label="Remove ${S(K(e))} from workout">\xD7</button>
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
  `}function ge(e,t,s,o=null){if(!s||typeof s.get!="function")return null;let n=s.get(`${e}#${t}`);return n||(o!=null?s.get(`any#${o}`)??null:null)}function ho(e,t,s){let o=e.setType||"working",n=s&&s.weight>0&&s.reps>0?`${me(s.weight)} \xD7 ${s.reps}`:"\u2014";return`
    <div class="set-row-wrap" data-set-id="${e.id}">
      <button class="set-swipe-delete" data-set-id="${e.id}" aria-label="Delete set ${t}">Delete</button>
      <div class="set-row type-${o}${e.completed?" completed":""}" data-set-id="${e.id}">
        <button class="set-number" aria-label="Set ${t}, tap to mark as ${o==="warmup"?"working":"warmup"}">${t}</button>
        <div class="prev" aria-label="Previous">${n}</div>
        <input class="weight-input" type="number" inputmode="decimal" step="0.5" aria-label="Weight in pounds for set ${t}"
               placeholder="0" value="${e.weight>0?e.weight:""}" />
        <input class="reps-input" type="number" inputmode="numeric" step="1" aria-label="Repetitions for set ${t}"
               placeholder="0" value="${e.reps>0?e.reps:""}" />
        <button class="complete-btn" aria-label="${e.completed?"Mark incomplete":"Mark complete"} set ${t}">${ws(e.completed)}</button>
      </div>
    </div>
  `}function yo(e,t){let s=e.querySelector(".set-row"),o=e.querySelector(".set-swipe-delete");if(!s||!o)return;let n=88,i=0,r=0,a=0,l=0,u=!1,b=!1,$=!1,d=!1,f=()=>Math.max(140,i*.5);function g(k,x){s.style.transition=x?"transform 0.18s ease":"none",s.style.transform=`translateX(${k}px)`,o.style.width=`${Math.max(n,-k)}px`,e.classList.toggle("will-delete",k<=-f())}function E(k=!0){$=!1,g(0,k),e.classList.remove("swiped-open")}function v(k=!0){document.querySelectorAll(".set-row-wrap.swiped-open").forEach(x=>{if(x!==e){let T=x.querySelector(".set-row");T&&(T.style.transition="transform 0.18s ease",T.style.transform="translateX(0)");let A=x.querySelector(".set-swipe-delete");A&&(A.style.width=""),x.classList.remove("swiped-open","will-delete")}}),$=!0,g(-n,k),e.classList.add("swiped-open")}function m(){s.style.transition="transform 0.16s ease-out",s.style.transform=`translateX(${-i}px)`,o.style.width=`${i}px`,setTimeout(t,150)}s.addEventListener("touchstart",k=>{i=e.clientWidth||s.clientWidth,r=k.touches[0].clientX,a=k.touches[0].clientY,l=$?-n:0,u=!0,b=!1,d=!!k.target.closest("input, button, select, textarea")},{passive:!0}),s.addEventListener("touchmove",k=>{if(!u)return;let x=k.touches[0].clientX-r,T=k.touches[0].clientY-a;if(!b){if(Math.abs(T)>Math.abs(x)+4){u=!1;return}Math.abs(x)>8&&(b=!0,d&&document.activeElement?.blur&&document.activeElement.blur())}if(!b)return;k.cancelable&&k.preventDefault();let A=$?-n:0;l=Math.min(0,Math.max(-i,A+x)),g(l,!1)},{passive:!1});function M(){u&&(u=!1,b&&(l<=-f()?m():l<-n/2?v():E()))}s.addEventListener("touchend",M),s.addEventListener("touchcancel",M),o.addEventListener("click",k=>{k.stopPropagation(),t()})}function ws(e){return e?'<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>':'<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>'}async function wo(e,t,s){let o=t.reduce((n,i)=>Math.max(n,i.order),-1)+1;for(let n of s){let i=(await vt(n,e.id)).filter(l=>(l.weight||0)>0&&(l.reps||0)>0),a=(i.length>0?i:[{weight:0,reps:0,setType:"working"}]).map(l=>({id:F(),workoutId:e.id,exerciseId:n,weight:l.weight??0,reps:l.reps??0,setType:l.setType||"working",completed:!1,order:o++,createdAt:Date.now()}));await fe("sets",a)}}async function vs(e,t,s){let o=(e.weight||0)*(e.reps||0);if(o<=0)return!1;let n=!1;for(let i of t)if(i.exerciseId===e.exerciseId&&i.id!==e.id&&!((i.order??0)<=(e.order??0))&&!i.completed&&(i.weight||0)*(i.reps||0)<o){if(i.bumpedBy==null){let r=s?.(i);i.preBumpWeight=r?r.weight:i.weight,i.preBumpReps=r?r.reps:i.reps}i.bumpedBy=e.id,i.weight=e.weight,i.reps=e.reps,await q("sets",i),n=!0}return n}async function hs(e,t){let s=!1;for(let o of t)o.bumpedBy===e&&(o.completed||(o.preBumpWeight!=null&&(o.weight=o.preBumpWeight),o.preBumpReps!=null&&(o.reps=o.preBumpReps)),delete o.bumpedBy,delete o.preBumpWeight,delete o.preBumpReps,await q("sets",o),s=!0);return s}async function go(e,t,s,o=new Map){let n=t.filter(E=>E.exerciseId===s),i=n[n.length-1],r=E=>(E?.weight||0)*(E?.reps||0),a=n.filter(E=>(E.setType||"working")!=="warmup"),l=a.length+1,u=ge("working",l,o,n.length+1),b=a.filter(E=>E.weight>0&&E.reps>0).reduce((E,v)=>!E||r(v)>r(E)?v:E,null),$=a.some((E,v)=>{let m=ge("working",v+1,o);return m&&m.weight>0&&m.reps>0&&r(E)>r(m)}),d=i?.weight??0,f=i?.reps??0;b&&(!u||$)&&(d=b.weight,f=b.reps);let g={id:F(),workoutId:e.id,exerciseId:s,weight:d,reps:f,completed:!1,order:(i?.order??-1)+1,createdAt:Date.now()};await q("sets",g)}async function bo(e,t){await Ve("sets",t.filter(s=>!s.completed&&((s.weight||0)===0||(s.reps||0)===0)).map(s=>s.id)),e.endedAt=Date.now(),await q("workouts",e)}function ko(e,t,s){let o=new Set,n="",i=null,r=W({html:`
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
    `,onMount(a){let l=a.querySelector("#picker-list"),u=a.querySelector("#picker-add"),b=a.querySelector("#picker-cancel"),$=a.querySelector("#picker-custom"),d=a.querySelector("#picker-search"),f=a.querySelector("#picker-chips");function g(){f.innerHTML=Be(e,i);for(let v of f.querySelectorAll(".chip"))v.addEventListener("click",()=>{let m=v.dataset.cat;i=m==="All"?null:m,g(),E()})}function E(){let v=e.filter(m=>!i||R(m)===i).filter(m=>!n||m.name.toLowerCase().includes(n.toLowerCase())).sort((m,M)=>{let k=t.get(m.id)??0,x=t.get(M.id)??0;return k!==x?x-k:m.name.localeCompare(M.name)});l.innerHTML=v.length===0?'<div class="list-row"><div class="row-main" style="color:var(--text-secondary)">No matches</div></div>':v.map(m=>`
                <button class="list-row" data-id="${m.id}">
                  ${te(m)}
                  <div class="row-trailing trailing-stack">
                    ${se(t.get(m.id)??0)}
                    ${o.has(m.id)?xo():""}
                  </div>
                </button>
              `).join("");for(let m of l.querySelectorAll(".list-row[data-id]"))m.addEventListener("click",()=>{let M=m.dataset.id;o.has(M)?o.delete(M):o.add(M),u.disabled=o.size===0,u.textContent=o.size===0?"Add":`Add (${o.size})`,E()})}d.addEventListener("input",()=>{n=d.value,E()}),b.addEventListener("click",()=>r()),u.addEventListener("click",()=>{s(Array.from(o)),r()}),$.addEventListener("click",()=>{we(null,async v=>{e.push(v),o.add(v.id),g(),E(),u.disabled=!1,u.textContent=`Add (${o.size})`})}),g(),E()}})}function xo(){return'<svg viewBox="0 0 24 24" width="22" height="22" fill="var(--green)"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'}function we(e,t){let s=!!e,o=s?R(e):null,n=!o||he.includes(o)?he:[o,...he],i=e?.equipment,r=!i||De.includes(i)?De:[i,...De],a=W({html:`
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
            <select id="ce-cat">${n.map(l=>`<option${l===o?" selected":""}>${S(l)}</option>`).join("")}</select>
          </div>
        </div>
        <div class="section">Equipment</div>
        <div class="form-section">
          <div class="form-row">
            <label for="ce-eq">Equipment</label>
            <select id="ce-eq">${r.map(l=>`<option${l===i?" selected":""}>${S(l)}</option>`).join("")}</select>
          </div>
        </div>
      </div>
    `,onMount(l){let u=l.querySelector("#ce-name"),b=l.querySelector("#ce-save");u.addEventListener("input",()=>{b.disabled=u.value.trim().length===0}),l.querySelector("#ce-cancel").addEventListener("click",()=>a()),b.addEventListener("click",async()=>{let $=u.value.trim();if(!$)return;let d=l.querySelector("#ce-cat").value,f=l.querySelector("#ce-eq").value,g=s?{...e,name:$,muscle:d,equipment:f}:{id:F(),name:$,muscle:d,category:d,equipment:f,notes:"",isCustom:!0,createdAt:Date.now()};await q("exercises",g),a(),t?.(g),s||H("data:changed")}),s||setTimeout(()=>u.focus(),50)}})}function So(){let t=[["AC","clear","fn"],["\xB1","sign","fn"],["\u232B","back","fn"],["\xF7","op","op"],["7","digit"],["8","digit"],["9","digit"],["\xD7","op","op"],["4","digit"],["5","digit"],["6","digit"],["\u2212","op","op"],["1","digit"],["2","digit"],["3","digit"],["+","op","op"],["0","digit","zero"],[".","dot"],["=","equals","op"]].map(([s,o,n])=>`<button class="calc-key${n?` calc-${n}`:""}" data-action="${o}" data-key="${S(s)}">${S(s)}</button>`).join("");W({html:`
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
    `,onMount(s,o){let n=s.querySelector("#calc-expr"),i=s.querySelector("#calc-result"),r={"+":(c,h)=>c+h,"\u2212":(c,h)=>c-h,"\xD7":(c,h)=>c*h,"\xF7":(c,h)=>h===0?NaN:c/h},a=c=>c==="+"||c==="\u2212"||c==="\xD7"||c==="\xF7",l=c=>{if(!isFinite(c))return"Error";let h=parseFloat(c.toFixed(8)).toString();return h.replace("-","").replace(".","").length>12&&(h=c.toPrecision(10).replace(/\.?0+$/,"")),h},u=["0"],b=!1,$=!1,d="",f=()=>u[u.length-1];function g(){n.textContent=$?"":d,i.textContent=$?"Error":u.join(" ");let c=!$&&a(f())?f():null;for(let h of s.querySelectorAll(".calc-op"))h.classList.toggle("selected",h.dataset.key===c)}function E(c){if($&&(u=["0"],$=!1),b)return u=[c],b=!1,g();a(f())?u.push(c):u[u.length-1]=f()==="0"?c:f()+c,g()}function v(){if($&&(u=["0"],$=!1),b)return u=["0."],b=!1,g();a(f())?u.push("0."):f().includes(".")||(u[u.length-1]=f()+"."),g()}function m(c){$||(b=!1,a(f())?u[u.length-1]=c:u.push(c),g())}function M(){u=["0"],b=!1,$=!1,g()}function k(){if($||a(f()))return;let c=f();u[u.length-1]=c.startsWith("-")?c.slice(1):c==="0"?"0":"-"+c,g()}function x(){if($)return M();if(b=!1,a(f()))return u.pop(),g();let c=f().slice(0,-1);c===""||c==="-"?u.length>1?u.pop():u=["0"]:u[u.length-1]=c,g()}function T(){if($)return;let c=u.slice();if(a(c[c.length-1])&&c.pop(),c.length<3)return;let h=parseFloat(c[0]);for(let y=1;y<c.length;y+=2)if(h=r[c[y]](h,parseFloat(c[y+1])),!isFinite(h))return $=!0,g();d=`${c.join(" ")} =`,u=[l(h)],b=!0,g()}function A(c){let{action:h,key:y}=c.dataset;h!=="equals"&&(d=""),h==="digit"?E(y):h==="dot"?v():h==="clear"?M():h==="sign"?k():h==="back"?x():h==="op"?m(y):h==="equals"&&T()}let p=null;for(let c of s.querySelectorAll(".calc-key"))c.addEventListener("pointerdown",h=>{h.preventDefault(),p=c,c.classList.add("pressed")}),c.addEventListener("pointerup",h=>{h.preventDefault(),c.classList.remove("pressed"),p===c&&A(c),p=null}),c.addEventListener("pointercancel",()=>{c.classList.remove("pressed"),p=null}),c.addEventListener("pointerleave",()=>c.classList.remove("pressed"));s.querySelector("#calc-done").addEventListener("click",()=>o())}})}function xe(){let e=window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===!0,t;e?t=Math.max(window.innerHeight||0,window.visualViewport?.height||0,window.screen?.height||0):t=window.visualViewport?.height||window.innerHeight,document.documentElement.style.setProperty("--app-height",`${t}px`)}xe();window.addEventListener("resize",xe);window.addEventListener("orientationchange",xe);window.addEventListener("pageshow",xe);window.visualViewport?.addEventListener("resize",xe);var gs={workout:{title:"Workout",render:ys},exercises:{title:"Exercises",render:Yt},progress:{title:"Progress",render:Nt}},be=document.getElementById("view-content"),$o=document.getElementById("nav-title"),bs=document.getElementById("nav-back"),G=document.getElementById("nav-action"),ke="workout",dt=null,ze=null,je=null,Ne={container:be,setTitle(e){$o.textContent=e},setAction(e){if(!e){G.hidden=!0,G.innerHTML="",G.removeAttribute("aria-label"),ze=null;return}G.hidden=!1,e.label?G.setAttribute("aria-label",e.label):G.removeAttribute("aria-label"),e.html?G.innerHTML=e.html:G.textContent=e.label??"",ze=e.onClick},setBack(e){dt=e,bs.hidden=!e},refresh(){Se(ke)},toast(e){I(e)}};function Mo(){if(typeof je=="function")try{je()}catch(e){console.error(e)}je=null}function Se(e){ke=e,Lt(e),document.querySelectorAll(".tab").forEach(t=>{t.setAttribute("aria-selected",String(t.dataset.tab===e))}),Mo(),Ne.setTitle(gs[e].title),Ne.setAction(null),Ne.setBack(null),be.innerHTML="",be.scrollTop=0;try{je=gs[e].render(Ne)}catch(t){console.error("Render failed",t),be.innerHTML=`<div class="empty-state"><div class="empty-icon">!</div><h2>Render error</h2><p>${S(t.message)}</p></div>`}}document.querySelectorAll(".tab").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll(".sheet-backdrop").forEach(t=>t.dismissSheet?.()),Se(e.dataset.tab)})});bs.addEventListener("click",()=>{dt&&dt()});G.addEventListener("click",()=>{ze&&ze()});Ke("data:changed",()=>{oe(),Se(ke)});Ke("workout:changed",()=>{oe(),ke==="workout"&&Se(ke)});document.addEventListener("visibilitychange",()=>{document.visibilityState==="visible"&&oe()});async function Eo(){try{await j();let e=await Mt();e>0&&console.info(`Seeded ${e} exercises.`),await It(),Se("workout"),oe()}catch(e){console.error("Init failed:",e),be.innerHTML=`
      <div class="empty-state">
        <div class="empty-icon">!</div>
        <h2>Storage unavailable</h2>
        <p>${S(e.message??String(e))}</p>
        <p>If you are running this from a <code>file://</code> URL, serve it through a local web server instead.</p>
      </div>`}}Eo();
