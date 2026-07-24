var Ss="lift";var mt=["exercises","workouts","sets","stateOfMind","medications","doseEvents"],Ee=null;function j(){return Ee?Promise.resolve(Ee):new Promise((e,t)=>{let s=indexedDB.open(Ss,4);s.onerror=()=>t(s.error),s.onsuccess=()=>{Ee=s.result,e(Ee)},s.onupgradeneeded=()=>{let o=s.result;if(!o.objectStoreNames.contains("exercises")){let n=o.createObjectStore("exercises",{keyPath:"id"});n.createIndex("name","name",{unique:!1}),n.createIndex("category","category",{unique:!1})}if(o.objectStoreNames.contains("workouts")||o.createObjectStore("workouts",{keyPath:"id"}).createIndex("startedAt","startedAt",{unique:!1}),!o.objectStoreNames.contains("sets")){let n=o.createObjectStore("sets",{keyPath:"id"});n.createIndex("workoutId","workoutId",{unique:!1}),n.createIndex("exerciseId","exerciseId",{unique:!1})}if(o.objectStoreNames.contains("stateOfMind")||o.createObjectStore("stateOfMind",{keyPath:"id"}).createIndex("date","date",{unique:!1}),o.objectStoreNames.contains("medications")||o.createObjectStore("medications",{keyPath:"id"}),!o.objectStoreNames.contains("doseEvents")){let n=o.createObjectStore("doseEvents",{keyPath:"id"});n.createIndex("medicationId","medicationId",{unique:!1}),n.createIndex("date","date",{unique:!1})}}})}function de(e){return new Promise((t,s)=>{e.onsuccess=()=>t(e.result),e.onerror=()=>s(e.error)})}async function ue(e,t="readonly"){return(await j()).transaction(e,t).objectStore(e)}function ee(e,t,s){return new Promise((o,n)=>{let i=e.transaction(t,"readwrite"),r;try{r=s(i)}catch(a){try{i.abort()}catch{}n(a);return}i.oncomplete=()=>o(r),i.onerror=()=>n(i.error),i.onabort=()=>n(i.error)})}async function T(e){return de((await ue(e)).getAll())}async function pe(e,t){return de((await ue(e)).get(t))}async function q(e,t){return await de((await ue(e,"readwrite")).put(t)),t}async function fe(e,t){let s=await j();return ee(s,e,o=>{let n=o.objectStore(e);for(let i of t)n.put(i)})}async function ie(e,t){return de((await ue(e,"readwrite")).delete(t))}async function Ue(e,t){if(t.length===0)return;let s=await j();return ee(s,e,o=>{let n=o.objectStore(e);for(let i of t)n.delete(i)})}async function Le(e,t,s){let o=await ue(e);return de(o.index(t).getAll(s))}async function vt(e){let t=await j();return ee(t,mt,s=>{for(let o of mt){let n=s.objectStore(o);n.clear();for(let i of e[o]??[])n.put(i)}})}function Q(e){let t=new Set;for(let s of e)s.completed&&t.add(s.workoutId);return e.filter(s=>s.completed||!t.has(s.workoutId))}async function re(){return(await T("workouts")).find(t=>!t.endedAt)??null}async function X(){return(await T("workouts")).filter(t=>t.endedAt).sort((t,s)=>s.startedAt-t.startedAt)}async function ht(e){return(await Le("sets","workoutId",e)).sort((s,o)=>s.order-o.order)}async function $s(e){return await Le("sets","exerciseId",e)}async function yt(e,t=null){let s=await $s(e),o=new Map;for(let r of s)t&&r.workoutId===t||(o.has(r.workoutId)||o.set(r.workoutId,[]),o.get(r.workoutId).push(r));if(o.size===0)return[];let i=(await Promise.all(Array.from(o.keys()).map(r=>pe("workouts",r)))).filter(Boolean).sort((r,a)=>(a.startedAt??0)-(r.startedAt??0));return i.length===0?[]:o.get(i[0].id).sort((r,a)=>r.order-a.order)}function wt(e,t,s=null){let o=new Map(t.map(r=>[r.id,r.startedAt??0])),n=new Map;for(let r of e){if(r.workoutId===s||!o.has(r.workoutId)||(r.weight||0)<=0||(r.reps||0)<=0)continue;let a=n.get(r.exerciseId);a||n.set(r.exerciseId,a=new Map);let u=a.get(r.workoutId);u||a.set(r.workoutId,u=[]),u.push(r)}let i=new Map;for(let[r,a]of n){let u=[...a.keys()].sort((p,v)=>o.get(v)-o.get(p)),c=new Map;for(let p of u){let v=a.get(p).sort((E,y)=>E.order-y.order),d=v.every(E=>E.setType==null),m=0,k=0;v.forEach((E,y)=>{if(d){let $=`any#${y+1}`;c.has($)||c.set($,E);return}let h=E.setType||"working",M=h==="warmup"?k+=1:m+=1,x=`${h}#${M}`;c.has(x)||c.set(x,E)})}i.set(r,c)}return i}var Ms={barbell:"Barbell",dumbbell:"Dumbbell",machine:"Machine",cable:"Cable",bodyweight:"Bodyweight",kettlebell:"Kettlebell",band:"Bands",bands:"Bands"},Es=/\s*\((barbell|dumbbell|machine|cable|bodyweight|kettlebell|bands?)\)$|\s+(Machine|Barbell|Dumbbell|Cable|Kettlebell)$/i;async function Ls(e,t){let s=await j(),o=await Le("sets","exerciseId",e);return ee(s,["sets","exercises"],n=>{let i=n.objectStore("sets");for(let r of o)i.put({...r,exerciseId:t});return n.objectStore("exercises").delete(e),o.length})}async function gt(){let e=await T("exercises"),t=e.filter(i=>/butterfly/i.test(i.name||""));if(t.length===0)return 0;let s=e.filter(i=>/chest fly/i.test(i.name||"")&&!t.some(r=>r.id===i.id)),o=s.find(i=>(i.equipment||"")==="Machine")||s[0],n=0;for(let i of t)o?n+=await Ls(i.id,o.id):await q("exercises",{...i,name:"Chest Fly",equipment:"Machine"});return n}async function bt(){let e=await T("exercises"),t=[];for(let s of e){let o=(s.name||"").match(Es);if(!o)continue;let n=s.name.slice(0,o.index).trim();if(!n||/smith$/i.test(n))continue;let i=(o[1]||o[2]).toLowerCase();t.push({...s,name:n,equipment:Ms[i]||s.equipment})}return t.length>0&&await fe("exercises",t),t.length}async function kt(){let[e,t,s]=await Promise.all([T("exercises"),T("sets"),T("workouts")]),o=new Set(e.filter(c=>c.category==="Cardio").map(c=>c.id));if(o.size===0)return{exercises:0,sets:0,workouts:0};let n=t.filter(c=>o.has(c.exerciseId)),i=new Map;for(let c of t)o.has(c.exerciseId)||i.set(c.workoutId,(i.get(c.workoutId)||0)+1);let r=new Set(n.map(c=>c.workoutId)),a=s.filter(c=>r.has(c.id)&&!i.get(c.id)),u=await j();return await ee(u,["exercises","sets","workouts"],c=>{let p=c.objectStore("exercises"),v=c.objectStore("sets"),d=c.objectStore("workouts");for(let m of o)p.delete(m);for(let m of n)v.delete(m.id);for(let m of a)d.delete(m.id)}),{exercises:o.size,sets:n.length,workouts:a.length}}async function xt(e){let[t,s,o]=await Promise.all([T("exercises"),T("sets"),T("workouts")]),n=t.filter(d=>d.category==="Other");if(n.length===0)return{recategorized:0,deleted:0,workouts:0};let i=[],r=new Set;for(let d of n){let m=e(d.name);m==="Cardio"?r.add(d.id):i.push({...d,category:m&&m!=="Other"?m:"Full Body"})}let a=s.filter(d=>r.has(d.exerciseId)),u=new Map;for(let d of s)r.has(d.exerciseId)||u.set(d.workoutId,(u.get(d.workoutId)||0)+1);let c=new Set(a.map(d=>d.workoutId)),p=o.filter(d=>c.has(d.id)&&!u.get(d.id)),v=await j();return await ee(v,["exercises","sets","workouts"],d=>{let m=d.objectStore("exercises"),k=d.objectStore("sets"),E=d.objectStore("workouts");for(let y of i)m.put(y);for(let y of r)m.delete(y);for(let y of a)k.delete(y.id);for(let y of p)E.delete(y.id)}),{recategorized:i.length,deleted:r.size,workouts:p.length}}async function De(e){let t=await j(),s=await Le("sets","workoutId",e);return ee(t,["workouts","sets"],o=>{o.objectStore("workouts").delete(e);let n=o.objectStore("sets");for(let i of s)n.delete(i.id)})}var F=()=>crypto&&crypto.randomUUID?crypto.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,e=>{let t=Math.random()*16|0;return(e==="x"?t:t&3|8).toString(16)});function me(e){return e==null?"0":Math.abs(e-Math.round(e))<.001?String(Math.round(e)):e.toFixed(1)}function ve(e){return`${me(e)} lbs`}function St(e){let t=Math.max(0,Math.floor(e)),s=Math.floor(t/3600),o=Math.floor(t%3600/60),n=t%60;return s>0?`${s}:${String(o).padStart(2,"0")}:${String(n).padStart(2,"0")}`:`${o}:${String(n).padStart(2,"0")}`}function Ye(e){let t=Math.max(0,Math.floor(e)),s=Math.floor(t/3600),o=Math.floor(t%3600/60);return s>0?`${s}h ${o}m`:`${o}m`}function Y(e){return Math.round(e).toLocaleString()}function ae(e){return`${Y(e)} lbs`}function z(e){return(e instanceof Date?e:new Date(e)).toLocaleDateString(void 0,{month:"numeric",day:"numeric",year:"2-digit"})}function $t(e){return(e instanceof Date?e:new Date(e)).toLocaleDateString(void 0,{weekday:"short",month:"short",day:"numeric",year:"numeric"})}function Ke(e,t=200){let s=null;return(...o)=>{clearTimeout(s),s=setTimeout(()=>e(...o),t)}}function S(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function I(e,t=1800,s={}){let o=document.querySelector(".toast");o&&o.remove();let n=document.createElement("div");n.className="toast",n.textContent=e,s.persistUntilClick?(n.classList.add("toast-clickable"),n.addEventListener("click",()=>n.remove())):setTimeout(()=>n.remove(),t),document.body.appendChild(n)}var _e=new EventTarget;function H(e,t){_e.dispatchEvent(new CustomEvent(e,{detail:t}))}function Ge(e,t){return _e.addEventListener(e,t),()=>_e.removeEventListener(e,t)}function W({html:e,onMount:t}){let s=document.createElement("div");s.className="sheet-backdrop",s.innerHTML='<div class="sheet"></div>';let o=s.querySelector(".sheet");o.innerHTML=e;let n=Ds();document.body.appendChild(s);function i(){let u=window.visualViewport;if(!u){o.style.maxHeight=`${window.innerHeight-n-10}px`;return}let c=Math.max(window.innerHeight,document.documentElement.clientHeight),p=Math.max(0,c-u.height-u.offsetTop);p>0?(o.style.paddingBottom=`${p}px`,o.style.maxHeight=`${u.height-n-10+p}px`):(o.style.paddingBottom="",o.style.maxHeight=`${u.height-n-10}px`)}i();let r=window.visualViewport;r?.addEventListener("resize",i),r?.addEventListener("scroll",i);function a(){s.remove(),r?.removeEventListener("resize",i),r?.removeEventListener("scroll",i)}return s.dismissSheet=a,s.addEventListener("click",u=>{u.target===s&&a()}),t?.(o,a),a}function Ds(){let e=document.createElement("div");e.style.cssText="position:fixed;top:0;left:0;width:0;height:env(safe-area-inset-top);",document.body.appendChild(e);let t=e.offsetHeight||0;return e.remove(),t}function Te(){return'<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" style="color: var(--red);"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>'}function Mt(){return'<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M16 5l-1.42 1.42-1.59-1.59V16h-2V4.83L9.41 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z"/></svg>'}function J(e){return`<div class="empty-state"><div class="empty-icon">!</div><h2>Couldn't load</h2><p>${S(e.message||String(e))}</p></div>`}var he=["Pectorals","Anterior Deltoid","Lateral Deltoid","Posterior Deltoid","Triceps","Biceps","Forearms","Lats","Upper Back","Lower Back","Traps","Quadriceps","Hamstrings","Glutes","Adductors","Abductors","Calves","Abs","Obliques"];function Ts(e){let t=new Map(he.map((s,o)=>[s,o]));return[...e].sort((s,o)=>(t.get(s)??999)-(t.get(o)??999)||s.localeCompare(o))}var Ae=["Barbell","Dumbbell","Machine","Cable","Bodyweight","Other"];function K(e){let t=e?.equipment,s=e?.name??"";return t&&t!=="Other"?`${s} (${t})`:s}function te(e){let t=e?[e.equipment,R(e)].filter(Boolean).join(" \xB7 "):"";return`
    <div class="row-main">
      <div class="row-title">${S(e?.name??"Unknown exercise")}</div>
      ${t?`<div class="row-subtitle">${S(t)}</div>`:""}
    </div>
  `}function se(e){return e?`<div class="exercise-count">${e} ${e===1?"set":"sets"}</div>`:""}function Be(e,t){return["All",...Ts(new Set(e.map(o=>R(o))))].map(o=>`<button class="chip${o==="All"&&!t||o===t?" active":""}" data-cat="${S(o)}">${S(o)}</button>`).join("")}var As=[["Bench Press (Barbell)","Chest","Barbell"],["Bench Press (Dumbbell)","Chest","Dumbbell"],["Incline Bench Press (Barbell)","Chest","Barbell"],["Incline Bench Press (Dumbbell)","Chest","Dumbbell"],["Decline Bench Press (Barbell)","Chest","Barbell"],["Chest Fly (Dumbbell)","Chest","Dumbbell"],["Chest Fly (Machine)","Chest","Machine"],["Cable Crossover","Chest","Cable"],["Push-Up","Chest","Bodyweight"],["Dip (Chest)","Chest","Bodyweight"],["Deadlift (Conventional)","Back","Barbell"],["Deadlift (Sumo)","Back","Barbell"],["Romanian Deadlift","Back","Barbell"],["Bent-Over Row (Barbell)","Back","Barbell"],["Pendlay Row","Back","Barbell"],["Row (Dumbbell)","Back","Dumbbell"],["T-Bar Row","Back","Barbell"],["Seated Cable Row","Back","Cable"],["Lat Pulldown","Back","Cable"],["Pull-Up","Back","Bodyweight"],["Chin-Up","Back","Bodyweight"],["Face Pull","Back","Cable"],["Shrug (Barbell)","Back","Barbell"],["Shrug (Dumbbell)","Back","Dumbbell"],["Overhead Press (Barbell)","Shoulders","Barbell"],["Overhead Press (Dumbbell)","Shoulders","Dumbbell"],["Seated Shoulder Press (Machine)","Shoulders","Machine"],["Arnold Press","Shoulders","Dumbbell"],["Lateral Raise (Dumbbell)","Shoulders","Dumbbell"],["Lateral Raise (Cable)","Shoulders","Cable"],["Front Raise (Dumbbell)","Shoulders","Dumbbell"],["Rear Delt Fly (Dumbbell)","Shoulders","Dumbbell"],["Reverse Pec Deck","Shoulders","Machine"],["Upright Row","Shoulders","Barbell"],["Barbell Curl","Biceps","Barbell"],["Dumbbell Curl","Biceps","Dumbbell"],["Hammer Curl","Biceps","Dumbbell"],["Preacher Curl","Biceps","Barbell"],["Incline Dumbbell Curl","Biceps","Dumbbell"],["Cable Curl","Biceps","Cable"],["Concentration Curl","Biceps","Dumbbell"],["Close-Grip Bench Press","Triceps","Barbell"],["Tricep Pushdown (Cable)","Triceps","Cable"],["Overhead Tricep Extension (Dumbbell)","Triceps","Dumbbell"],["Overhead Tricep Extension (Cable)","Triceps","Cable"],["Skull Crusher","Triceps","Barbell"],["Dip (Tricep)","Triceps","Bodyweight"],["Tricep Kickback","Triceps","Dumbbell"],["Back Squat","Legs","Barbell"],["Front Squat","Legs","Barbell"],["Goblet Squat","Legs","Dumbbell"],["Bulgarian Split Squat","Legs","Dumbbell"],["Lunge","Legs","Dumbbell"],["Leg Press","Legs","Machine"],["Leg Extension","Legs","Machine"],["Leg Curl (Seated)","Legs","Machine"],["Leg Curl (Lying)","Legs","Machine"],["Hip Thrust (Barbell)","Glutes","Barbell"],["Glute Bridge","Glutes","Bodyweight"],["Cable Kickback","Glutes","Cable"],["Hip Abduction (Machine)","Glutes","Machine"],["Standing Calf Raise","Calves","Machine"],["Seated Calf Raise","Calves","Machine"],["Plank","Core","Bodyweight"],["Hanging Leg Raise","Core","Bodyweight"],["Cable Crunch","Core","Cable"],["Russian Twist","Core","Bodyweight"],["Ab Wheel Rollout","Core","Other"],["Wrist Curl","Forearms","Dumbbell"],["Reverse Wrist Curl","Forearms","Dumbbell"],["Farmer's Carry","Forearms","Dumbbell"]];function R(e){if(e?.muscle)return e.muscle;let t=(e?.name||"").toLowerCase();return t?/romanian deadlift|\brdl\b|stiff.?leg|good morning|nordic|hamstring/.test(t)||/leg curl/.test(t)?"Hamstrings":/leg extension|sissy squat/.test(t)?"Quadriceps":/calf|tib raise|tibialis/.test(t)?"Calves":/hip adduction|adductor|inner thigh|copenhagen/.test(t)?"Adductors":/hip abduction|abductor|outer thigh|clamshell/.test(t)?"Abductors":/hip thrust|glute|cable kickback|donkey kick|rear kick|frog pump/.test(t)?"Glutes":/squat|leg press|lunge|step.?up/.test(t)?"Quadriceps":/back extension|hyperextension|superman/.test(t)||/deadlift|rack pull/.test(t)?"Lower Back":/lateral raise|side raise|side delt|\blat raise\b|upright row/.test(t)?"Lateral Deltoid":/rear delt|reverse fly|reverse flye|face pull|reverse pec deck/.test(t)?"Posterior Deltoid":/front raise|shoulder press|overhead press|arnold|military press|landmine press|push press|viking press/.test(t)?"Anterior Deltoid":/pulldown|pull.?down|pull.?up|chin.?up|pullover|straight.?arm/.test(t)?"Lats":/shrug/.test(t)?"Traps":/tricep|pushdown|skull ?crusher|close.?grip bench|jm press|french press|bench dip/.test(t)?"Triceps":/wrist curl|reverse curl|forearm|farmer|gripper|dead hang/.test(t)?"Forearms":/bicep|\bcurl\b/.test(t)?"Biceps":/\brow\b|rear pull|high pull/.test(t)?"Upper Back":/bench|chest|\bpec\b|pec deck|crossover|butterfly|push.?up|floor press|squeeze press|\bfly\b|\bflye\b/.test(t)?"Pectorals":/russian twist|woodchop|wood chop|side plank|side bend|oblique|pallof|rotation/.test(t)?"Obliques":/crunch|sit.?up|plank|leg raise|knee raise|ab wheel|ab roll|hanging|toes.?to.?bar|v.?up|dead bug|mountain climber/.test(t)?"Abs":/\bdip\b/.test(t)?"Triceps":e.category||"Other":e?.category||"Other"}var Bs=/\b(bike|biking|treadmill|run|running|cardio|step.?mill|elliptical|stair.?master|stair.?climber|jog|jogging|cycling|spinning|spin class|rowing machine|row machine|\berg\b|sprints?|jump.?rope|skipping rope|swim|swimming|hike|hiking)\b/,Cs={Quadriceps:"Legs",Hamstrings:"Legs",Adductors:"Legs",Abductors:"Legs",Glutes:"Glutes",Calves:"Calves",Pectorals:"Chest","Anterior Deltoid":"Shoulders","Lateral Deltoid":"Shoulders","Posterior Deltoid":"Shoulders",Lats:"Back","Upper Back":"Back",Traps:"Back","Lower Back":"Back",Biceps:"Biceps",Triceps:"Triceps",Forearms:"Forearms",Abs:"Core",Obliques:"Core"};function Et(e){let t=(e||"").toLowerCase().trim();if(!t)return"Full Body";if(Bs.test(t))return"Cardio";let s=R({name:t,category:""});return Cs[s]||"Full Body"}async function Lt(){if((await T("exercises")).length>0)return 0;let t=Date.now(),s=As.map(([o,n,i])=>({id:F(),name:o,category:n,equipment:i,notes:"",isCustom:!1,createdAt:t}));return await fe("exercises",s),s.length}var Dt="workout";function Tt(e){Dt!==e&&(Dt=e,H("tab:changed",e))}var N=["Chest Day","Leg Day","Back/Bi Day"],Ce={"Chest Day":{key:"chest",short:"Chest",cssVar:"--day-chest"},"Leg Day":{key:"leg",short:"Legs",cssVar:"--day-leg"},"Back/Bi Day":{key:"back",short:"Back/Bi",cssVar:"--day-back"}};function Ie(e){let t=Ce[e];return t?`var(${t.cssVar})`:"var(--text-tertiary)"}function Qe(e){if(!e)return null;let t=e.toLowerCase();return t.includes("chest")?"Chest Day":t.includes("leg")&&!t.includes("curl")&&!t.includes("extension")?"Leg Day":t.includes("back")||t.includes("pull")?"Back/Bi Day":t.includes("push")?"Chest Day":null}function Xe(e){for(let t of e){let s=Qe(t.name);if(s)return{name:t.name,normalized:s,startedAt:t.startedAt}}return null}function qe(e){let t=N.indexOf(e);return t===-1?N[0]:N[(t+1)%N.length]}var Is={Pectorals:"#ec4899",Triceps:"#be185d","Anterior Deltoid":"#831843","Lateral Deltoid":"#f9a8d4",Quadriceps:"#facc15",Hamstrings:"#b45309",Glutes:"#f59e0b",Calves:"#fde68a",Adductors:"#bdb76b",Abductors:"#78350f",Lats:"#2563eb","Upper Back":"#38bdf8",Biceps:"#1e40af","Posterior Deltoid":"#bfdbfe",Traps:"#0891b2","Lower Back":"#475569",Forearms:"#22c55e",Abs:"#ef4444",Obliques:"#14b8a6",Other:"#6b7280"};function At(e){return Is[e]??"#6b7280"}var qs={Pectorals:"Chest Day",Triceps:"Chest Day","Anterior Deltoid":"Chest Day","Lateral Deltoid":"Chest Day",Quadriceps:"Leg Day",Hamstrings:"Leg Day",Glutes:"Leg Day",Calves:"Leg Day",Adductors:"Leg Day",Abductors:"Leg Day",Lats:"Back/Bi Day","Upper Back":"Back/Bi Day",Biceps:"Back/Bi Day","Posterior Deltoid":"Back/Bi Day",Traps:"Back/Bi Day","Lower Back":"Back/Bi Day",Forearms:"Back/Bi Day"};function Ps(e){return qs[e]??null}function Os(e,t,s){let o=Qe(e);if(o)return o;let n=new Map;for(let a of t){let u=s.get(a.exerciseId);if(!u)continue;let c=Ps(R(u));if(!c)continue;let p=(a.weight||0)*(a.reps||0);p<=0||n.set(c,(n.get(c)??0)+p)}let i=null,r=0;for(let[a,u]of n)u>r&&(i=a,r=u);return i}function Bt(e,t,s){let o=[...e].sort((r,a)=>r.startedAt-a.startedAt),n=new Map,i=null;for(let r of o){let a=Os(r.name,t.get(r.id)??[],s);a||(i?It(i.startedAt,r.startedAt)?a=i.day:a=qe(i.day):a=N[0]),n.set(r.id,a),i={day:a,startedAt:r.startedAt}}return n}function Ct(e){let t=parseInt(e.slice(1),16);return((t>>16&255)*299+(t>>8&255)*587+(t&255)*114)/1e3>=150?"#1c1c1e":"#ffffff"}function It(e,t){let s=new Date(e),o=new Date(t);return s.getFullYear()===o.getFullYear()&&s.getMonth()===o.getMonth()&&s.getDate()===o.getDate()}function Ws(e,t){let s=Qe(t?.name);if(s)return s;let o=Xe(e);return o?It(o.startedAt,Date.now())?o.normalized:qe(o.normalized):N[0]}var Hs="lift-today-day";async function oe(){try{let[e,t]=await Promise.all([X(),re()]),s=Ws(e,t),o=Ce[s].key;document.documentElement.dataset.day!==o&&(document.documentElement.dataset.day=o);try{localStorage.setItem(Hs,o)}catch{}return s}catch{return null}}var qt="lift-migrations-done-v1";async function Je(){let e=await kt();e.exercises>0&&console.info(`Removed ${e.exercises} cardio exercise(s), ${e.sets} set(s), ${e.workouts} cardio-only workout(s).`);let t=await xt(Et);if(t.recategorized>0||t.deleted>0){console.info(`Reorganized "Other": recategorized ${t.recategorized}, removed ${t.deleted} cardio, dropped ${t.workouts} empty workout(s).`);let n=[];t.recategorized>0&&n.push(`sorted ${t.recategorized} exercise${t.recategorized===1?"":"s"}`),t.deleted>0&&n.push(`removed ${t.deleted} cardio`),I(`Cleaned up \u201COther\u201D: ${n.join(", ")}.`)}let s=await bt();s>0&&console.info(`Stripped equipment from ${s} exercise name(s).`);let o=await gt();o>0&&I(`Merged Butterfly into Chest Fly (${o} sets moved).`)}async function Pt(){try{if(localStorage.getItem(qt))return}catch{}await Je();try{localStorage.setItem(qt,String(Date.now()))}catch{}}var Pe="lift-backup-passphrase";var Ot="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";function Ze(e){let t=new Uint8Array(e),s="",o=32768;for(let n=0;n<t.length;n+=o)s+=String.fromCharCode.apply(null,t.subarray(n,n+o));return btoa(s)}var et=e=>Uint8Array.from(atob(e),t=>t.charCodeAt(0));function Rs(){let t=[...crypto.getRandomValues(new Uint8Array(20))].map(s=>Ot[s%Ot.length]);return[0,5,10,15].map(s=>t.slice(s,s+5).join("")).join("-")}function tt(){let e=null;try{e=localStorage.getItem(Pe)}catch{}if(!e){e=Rs();try{localStorage.setItem(Pe,e)}catch{}}return e}function Wt(){try{return localStorage.getItem(Pe)}catch{return null}}function Ht(e){try{localStorage.setItem(Pe,e)}catch{}}async function Rt(e,t){let s=await crypto.subtle.importKey("raw",new TextEncoder().encode(e),"PBKDF2",!1,["deriveKey"]);return crypto.subtle.deriveKey({name:"PBKDF2",hash:"SHA-256",salt:t,iterations:25e4},s,{name:"AES-GCM",length:256},!1,["encrypt","decrypt"])}function Ft(e){return!!e&&e.lift==="encrypted-backup"&&typeof e.data=="string"}async function Nt(e,t){let s=crypto.getRandomValues(new Uint8Array(16)),o=crypto.getRandomValues(new Uint8Array(12)),n=await Rt(t,s),i=new TextEncoder().encode(JSON.stringify(e)),r=await crypto.subtle.encrypt({name:"AES-GCM",iv:o},n,i);return{lift:"encrypted-backup",v:1,exportedAt:new Date().toISOString(),kdf:{name:"PBKDF2",hash:"SHA-256",iterations:25e4,salt:Ze(s)},cipher:"AES-GCM",iv:Ze(o),data:Ze(r)}}async function st(e,t){let s=et(e.kdf.salt),o=et(e.iv),n=await Rt(t,s),i;try{i=await crypto.subtle.decrypt({name:"AES-GCM",iv:o},n,et(e.data))}catch{throw new Error("Wrong backup password (or the file is damaged).")}return JSON.parse(new TextDecoder().decode(i))}async function Fs(){let[e,t,s,o,n,i]=await Promise.all([T("exercises"),T("workouts"),T("sets"),T("stateOfMind"),T("medications"),T("doseEvents")]);return{version:2,exportedAt:new Date().toISOString(),exercises:e,workouts:t,sets:s,stateOfMind:o,medications:n,doseEvents:i}}function Ns(){let e=new Date,t=s=>String(s).padStart(2,"0");return`lift-backup-${e.getFullYear()}${t(e.getMonth()+1)}${t(e.getDate())}-${t(e.getHours())}${t(e.getMinutes())}${t(e.getSeconds())}.json`}async function ot(){let e=await Fs(),t=tt(),s=await Nt(e,t),o=JSON.stringify(s),n=new Blob([o],{type:"application/json"}),i=URL.createObjectURL(n),r=Ns(),a=document.createElement("a");return a.href=i,a.download=r,a.style.display="none",document.body.appendChild(a),a.click(),setTimeout(()=>{document.body.removeChild(a),URL.revokeObjectURL(i)},1e3),{filename:r,bytes:n.size,snapshot:e}}async function js(e){let t=Wt();if(t)try{return await st(e,t)}catch{}for(let s=0;s<3;s++){let o=prompt("Enter your backup password (saved in your Passwords app):");if(o==null)throw new Error("Restore cancelled.");try{let n=await st(e,o.trim());return Ht(o.trim()),n}catch(n){if(s===2)throw n;alert("Wrong password \u2014 try again.")}}}async function zs(e){let t=JSON.parse(await e.text()),s=Ft(t)?await js(t):t;if(!s||!Array.isArray(s.exercises)||!Array.isArray(s.workouts)||!Array.isArray(s.sets))throw new Error("File doesn't look like a Lift backup.");return await vt({exercises:s.exercises,workouts:s.workouts,sets:s.sets,stateOfMind:s.stateOfMind??[],medications:s.medications??[],doseEvents:s.doseEvents??[]}),await Je(),{exercises:s.exercises.length,workouts:s.workouts.length,sets:s.sets.length,stateOfMind:(s.stateOfMind??[]).length}}function jt(){let e=tt();W({html:`
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
    `,onMount(t,s){t.querySelector("#bk-close").addEventListener("click",()=>s()),t.querySelector("#bk-copy").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(e),I("Password copied \u2014 save it in your Passwords app")}catch{I("Copy failed \u2014 long-press the password to select it")}}),t.querySelector("#bk-export").addEventListener("click",async()=>{try{let{filename:n,bytes:i}=await ot();I(`Exported ${n} (${Vs(i)})`)}catch(n){I(`Export failed: ${n.message}`)}});let o=t.querySelector("#bk-file");t.querySelector("#bk-import").addEventListener("click",()=>{o.value="",o.click()}),o.addEventListener("change",async n=>{let i=n.target.files?.[0];if(i&&confirm("Replace all current data with this backup? This cannot be undone."))try{let r=await zs(i);s(),I(`Restored ${r.workouts} workouts, ${r.exercises} exercises`),H("data:changed")}catch(r){I(`Restore failed: ${r.message}`)}})}})}function Vs(e){return e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/(1024*1024)).toFixed(1)} MB`}var Oe=[{key:"1W",tick:"1W",days:7},{key:"1M",tick:"1M",days:30},{key:"3M",tick:"3M",days:90},{key:"1Y",tick:"1Y",days:365},{key:"All",tick:"All",all:!0}];function Us(e){let t=new Map;for(let s of e){let o=new Date(s.date),n=`${o.getFullYear()}-${o.getMonth()}-${o.getDate()}`,i=t.get(n)||{date:s.date,total:0,count:0};i.total+=s.value,i.count+=1,i.date=Math.min(i.date,s.date),t.set(n,i)}return[...t.values()].map(s=>({date:s.date,value:s.total/s.count})).sort((s,o)=>s.date-o.date)}function ye(e,t,s={}){let o=t.length>0&&t[0].points!==void 0,n=(o?t:[{points:t}]).map(f=>({label:f.label??"",color:f.color||"var(--accent)",points:Us(f.points)})).filter(f=>f.points.length>0),i=s.defaultPeriod||"All",r=Math.max(0,Oe.findIndex(f=>f.key===i)),a=Oe.length-1,u=null;function c(){let f=Oe[r],l=n.map((b,D)=>u===null||D===u?b.points:[]);if(f.all)return l;let w=Date.now()-f.days*864e5,g=l.map(b=>b.filter(D=>D.date>=w));return g.every(b=>b.length===0)?l.map(b=>b.slice(-1)):g}let p=o&&n.some(f=>f.label)?`<div class="chart-legend">${n.map((f,l)=>`<button class="legend-item" data-i="${l}" style="--dcolor: ${f.color};" aria-pressed="false">${f.label}</button>`).join("")}</div>`:"";e.innerHTML=`
    <div class="chart-scrub-readout" data-role="scrub"></div>
    ${p}
    <div class="chart-container" data-role="chart"></div>
    <div class="chart-daterange" data-role="range"></div>
    <div class="chart-slider">
      <input type="range" class="chart-range" min="0" max="${a}" step="1"
             value="${r}" aria-label="Time range" />
      <div class="chart-slider-ticks">
        ${Oe.map((f,l)=>`<span data-i="${l}">${f.tick}</span>`).join("")}
      </div>
    </div>
  `;let v=e.querySelector('[data-role="scrub"]'),d=e.querySelector('[data-role="chart"]'),m=e.querySelector('[data-role="range"]'),k=e.querySelector(".chart-range"),E=[...e.querySelectorAll(".chart-slider-ticks span")],y=s.unit||"lbs",h=null;function M(){let f=c(),l=_s(f,n,y);d.innerHTML=l.html,h=l.geom;let w=f.flat();if(w.length>=2){let g=Math.min(...w.map(D=>D.date)),b=Math.max(...w.map(D=>D.date));m.innerHTML=`<span>${nt(g)}</span><span>${nt(b)}</span>`}else m.innerHTML="";E.forEach((g,b)=>g.classList.toggle("active",b===r))}k.addEventListener("input",()=>{r=Number(k.value),A(),M()});let x=[...e.querySelectorAll(".chart-legend .legend-item")];for(let f of x)f.addEventListener("click",()=>{let l=Number(f.dataset.i);u=u===l?null:l,x.forEach((w,g)=>{w.classList.toggle("dimmed",u!==null&&g!==u),w.setAttribute("aria-pressed",String(u===g))}),A(),M()});function $(f){if(!h||h.pts.length<2)return;let l=d.querySelector("svg"),w=l?.getScreenCTM();if(!w)return;let g=new DOMPoint(f,0).matrixTransform(w.inverse()).x,b=0,D=1/0;h.pts.forEach((O,U)=>{let _=Math.abs(O.x-g);_<D&&(D=_,b=U)});let L=h.pts[b],C=l.querySelector(".chart-scrub-line"),P=l.querySelector(".chart-scrub-dot");C&&(C.setAttribute("x1",L.x),C.setAttribute("x2",L.x),C.removeAttribute("visibility")),P&&(P.setAttribute("cx",L.x),P.setAttribute("cy",L.y),P.style.fill=L.color,P.removeAttribute("visibility"));let V=L.label?` \xB7 ${L.label}`:"";v.textContent=`${nt(L.date)}${V} \xB7 ${Math.round(L.value).toLocaleString()} ${y}`}function A(){v.textContent="";let f=d.querySelector("svg");f?.querySelector(".chart-scrub-line")?.setAttribute("visibility","hidden"),f?.querySelector(".chart-scrub-dot")?.setAttribute("visibility","hidden")}let B=!1;d.addEventListener("pointerdown",f=>{B=!0,d.setPointerCapture?.(f.pointerId),$(f.clientX)}),d.addEventListener("pointermove",f=>{B&&$(f.clientX)});for(let f of["pointerup","pointercancel"])d.addEventListener(f,()=>{B=!1,A()});M()}function nt(e){return new Date(e).toLocaleDateString(void 0,{month:"short",day:"numeric",year:"numeric"})}function _s(e,t,s){let i={top:16,right:14,bottom:14,left:52},r=400-i.left-i.right,a=200-i.top-i.bottom,u=e.flat();if(u.length===0)return{html:`<svg viewBox="0 0 400 200"><text x="${400/2}" y="${200/2}" text-anchor="middle" class="chart-axis-label">No data in range</text></svg>`,geom:null};if(u.length===1){let b=u[0],D=t[e.findIndex(P=>P.length>0)]?.color||"var(--accent)",L=i.left+r/2,C=i.top+a/2;return{html:`<svg viewBox="0 0 400 200"><circle cx="${L}" cy="${C}" r="4" class="chart-point" style="fill: ${D};"/><text x="${L}" y="${C-10}" text-anchor="middle" class="chart-axis-label">${Math.round(b.value).toLocaleString()} ${s}</text></svg>`,geom:null}}let c=u.map(b=>b.date),p=u.map(b=>b.value),v=Math.min(...c),d=Math.max(...c),m=Math.max(...p),k=Math.min(...p),E=Math.max(m-k,1),y=Math.max(0,k-E*.12),h=m+E*.12,M=b=>i.left+(b-v)/Math.max(d-v,1)*r,x=b=>i.top+a-(b-y)/(h-y)*a,$=4,A=b=>Math.round(b).toLocaleString(),B=Array.from({length:$+1},(b,D)=>{let L=y+(h-y)*D/$,C=x(L);return`<text x="${i.left-6}" y="${C+3}" text-anchor="end" class="chart-axis-label">${A(L)}</text>`}).join(""),f=Array.from({length:$+1},(b,D)=>{let L=i.top+a*D/$;return`<line x1="${i.left}" x2="${400-i.right}" y1="${L}" y2="${L}" class="chart-axis-line"/>`}).join(""),l=[],w=e.map((b,D)=>{let L=t[D],C=b.map(P=>({x:M(P.date),y:x(P.value)}));return b.forEach((P,V)=>l.push({...C[V],date:P.date,value:P.value,label:L.label,color:L.color})),C.length===0?"":C.length===1?`<circle cx="${C[0].x}" cy="${C[0].y}" r="3.5" class="chart-point" style="fill: ${L.color};"/>`:`<path d="${Ys(C)}" class="chart-line" style="stroke: ${L.color};"/>`}).join("");return{html:`
    <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet">
      ${f}
      ${B}
      ${w}
      <line class="chart-scrub-line" y1="${i.top}" y2="${i.top+a}" x1="0" x2="0" visibility="hidden"/>
      <circle class="chart-scrub-dot" r="4.5" visibility="hidden"/>
    </svg>
  `,geom:{pts:l}}}function Ys(e){if(e.length<2)return"";let t=`M ${e[0].x.toFixed(1)} ${e[0].y.toFixed(1)}`;for(let s=0;s<e.length-1;s++){let o=e[s===0?0:s-1],n=e[s],i=e[s+1],r=e[s+2]||i,a=n.x+(i.x-o.x)/6,u=n.y+(i.y-o.y)/6,c=i.x-(r.x-n.x)/6,p=i.y-(r.y-n.y)/6;t+=` C ${a.toFixed(1)} ${u.toFixed(1)}, ${c.toFixed(1)} ${p.toFixed(1)}, ${i.x.toFixed(1)} ${i.y.toFixed(1)}`}return t}var Z=null;function zt(e){let t=!0;return Vt().then(s=>{t&&(Z=s,We(e))}).catch(s=>{t&&(e.container.innerHTML=J(s))}),()=>{t=!1}}async function Vt(){let[e,t,s]=await Promise.all([X(),T("sets"),T("exercises")]),o=new Map(s.map(k=>[k.id,k])),n=new Map;for(let k of Q(t))n.has(k.workoutId)||n.set(k.workoutId,[]),n.get(k.workoutId).push(k);let i=0,r=0,a=new Map,u=new Map,c=new Map,p=Bt(e,n,o);for(let k of e){let E=n.get(k.id)||[],y=E.reduce((h,M)=>h+M.weight*M.reps,0);if(i+=y,r+=E.length,y>0){let h=p.get(k.id);a.has(h)||a.set(h,[]),a.get(h).push({date:k.startedAt,value:y})}for(let h of E){let M=o.get(h.exerciseId);if(!M)continue;let x=u.get(h.exerciseId)||{id:h.exerciseId,exercise:M,count:0};if(x.count+=1,u.set(h.exerciseId,x),h.weight>0&&h.reps>0){let $=c.get(h.exerciseId);(!$||h.weight>$.weight||h.weight===$.weight&&h.reps>$.reps)&&c.set(h.exerciseId,{id:h.exerciseId,weight:h.weight,reps:h.reps,date:k.startedAt,name:K(M)})}}}let v=Array.from(u.entries()).sort((k,E)=>E[1].count-k[1].count).map(([,k])=>k),d=Array.from(c.values()).sort((k,E)=>E.weight-k.weight),m=N.filter(k=>a.has(k)).map(k=>({label:Ce[k].short,color:Ie(k),points:a.get(k)}));return{workouts:e,allSets:t,allExercises:s,exMap:o,setsByWorkout:n,totalVolume:i,totalSets:r,volumeSeries:m,topExercises:v,prs:d}}function We(e){if(e.setTitle("Progress"),e.setBack(null),e.setAction({label:"Backup and restore",html:Mt(),onClick:()=>jt()}),e.container.scrollTop=0,!Z||Z.workouts.length===0){e.container.innerHTML=`
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
  `;let a=e.container.querySelector(".volume-chart-mount");a&&n.length>0&&ye(a,n,{unit:"lbs"});for(let u of e.container.querySelectorAll("[data-page]"))u.addEventListener("click",()=>{let c=u.dataset.page;c==="trained"?Ks(e):c==="prs"?Gs(e):c==="history"&&Ut(e)})}function Ks(e){e.setTitle("Most-Trained"),e.setBack(()=>We(e)),e.setAction(null);let{topExercises:t}=Z;e.container.innerHTML=`
    <div class="list" style="margin-top: 16px;">
      ${t.map(s=>`
        <button class="list-row" data-exercise-id="${S(s.id)}">
          ${te(s.exercise)}
          <div class="row-trailing trailing-stack">${se(s.count)}</div>
          <div class="chevron">\u203A</div>
        </button>
      `).join("")}
    </div>
  `,e.container.scrollTop=0,it(e)}function Gs(e){e.setTitle("Personal Records"),e.setBack(()=>We(e)),e.setAction(null);let{prs:t}=Z;e.container.innerHTML=`
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
  `,e.container.scrollTop=0,it(e)}function it(e){for(let t of e.container.querySelectorAll("[data-exercise-id]"))t.addEventListener("click",()=>{He(t.dataset.exerciseId)})}function Ut(e){e.setTitle("Workout History"),e.setBack(()=>We(e)),e.setAction(null);let{workouts:t,setsByWorkout:s,exMap:o}=Z;e.container.innerHTML=`
    <div class="list" style="margin-top: 16px;">
      ${t.map(n=>Qs(n,s.get(n.id)||[],o)).join("")}
    </div>
  `,e.container.scrollTop=0;for(let n of e.container.querySelectorAll("[data-workout-id]"))n.addEventListener("click",()=>{let i=n.dataset.workoutId;Xs(e,i).catch(r=>{e.container.innerHTML=J(r)})})}function Qs(e,t,s){let o=t,n=o.reduce((u,c)=>u+c.weight*c.reps,0),i=(e.endedAt-e.startedAt)/1e3,r=[],a=new Set;for(let u of t){if(a.has(u.exerciseId))continue;a.add(u.exerciseId);let c=s.get(u.exerciseId);if(c&&r.push(c.name),r.length>=3)break}return`
    <button class="list-row" data-workout-id="${e.id}">
      <div class="row-main">
        <div class="row-title" style="font-weight: 600;">${S(e.name)}</div>
        <div class="row-subtitle" style="margin-top: 4px;">
          ${z(e.startedAt)} \xB7 ${Ye(i)} \xB7 ${o.length} sets \xB7 ${ae(n)}
        </div>
        ${r.length>0?`<div class="row-subtitle" style="margin-top: 4px;">${S(r.join(" \xB7 "))}${a.size>3?" \u2026":""}</div>`:""}
      </div>
      <div class="chevron">\u203A</div>
    </button>
  `}async function _t(e){let[t,s,o]=await Promise.all([pe("workouts",e),T("exercises"),ht(e)]);if(!t)return null;let n=new Map(s.map(d=>[d.id,d])),i=new Map,r=[];for(let d of o)i.has(d.exerciseId)||(i.set(d.exerciseId,[]),r.push(d.exerciseId)),i.get(d.exerciseId).push(d);let a=Q(o),u=a.reduce((d,m)=>d+m.weight*m.reps,0),c=a.length,p=(t.endedAt-t.startedAt)/1e3,v=`
    <div class="section">Summary</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Date</div><div class="stat-value">${$t(t.startedAt)}</div></div>
      <div class="stat-row"><div class="stat-label">Duration</div><div class="stat-value">${Ye(p)}</div></div>
      <div class="stat-row"><div class="stat-label">Total Volume</div><div class="stat-value">${ae(u)}</div></div>
      <div class="stat-row"><div class="stat-label">Completed Sets</div><div class="stat-value">${c}</div></div>
    </div>

    ${r.map(d=>{let m=n.get(d),k=i.get(d),E=0,y=0;return`
        ${m?`<button class="section section-link" data-exercise-id="${S(d)}">${S(K(m))}<span class="name-chevron">\u203A</span></button>`:'<div class="section">Unknown exercise</div>'}
        <div class="form-section">
          ${k.map(M=>{let $=(M.setType||"working")==="warmup"?`W${++y}`:String(++E);return`
              <div class="stat-row">
                <div class="stat-label">Set ${$}</div>
                <div class="stat-value hist-edit">
                  <input class="hist-input" type="number" inputmode="decimal" step="0.5" aria-label="Weight in pounds for set ${$}"
                         data-set-id="${M.id}" data-field="weight" value="${M.weight>0?M.weight:""}" placeholder="0" />
                  <span>lbs \xD7</span>
                  <input class="hist-input" type="number" inputmode="numeric" step="1" aria-label="Repetitions for set ${$}"
                         data-set-id="${M.id}" data-field="reps" value="${M.reps>0?M.reps:""}" placeholder="0" />
                </div>
              </div>
            `}).join("")}
        </div>
      `}).join("")}
  `;return{workout:t,html:v,sets:o}}function Yt(e,t){for(let s of e.querySelectorAll("input.hist-input[data-set-id]"))s.addEventListener("input",async()=>{let o=t.find(n=>n.id===s.dataset.setId);o&&(s.dataset.field==="weight"?o.weight=parseFloat(s.value)||0:o.reps=parseInt(s.value,10)||0,await q("sets",{...o}))})}async function Xs(e,t){e.setBack(async()=>{Z=await Vt(),Ut(e)}),e.setAction({label:"Delete workout",html:Te(),onClick:async()=>{confirm("Delete this workout?")&&(await De(t),H("data:changed"))}});let s=await _t(t);if(!s){e.container.innerHTML=J({message:"Workout not found."});return}e.setTitle(s.workout.name),e.container.innerHTML=s.html,e.container.scrollTop=0,it(e),Yt(e.container,s.sets)}async function Kt(e){let t=await _t(e);if(!t)return;let s=W({html:`
      <div class="sheet-header">
        <button class="btn-text" id="wd-close">Done</button>
        <div class="title">${S(t.workout.name)}</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">${t.html}</div>
    `,onMount(o){o.querySelector("#wd-close").addEventListener("click",()=>s());for(let n of o.querySelectorAll("[data-exercise-id]"))n.addEventListener("click",()=>He(n.dataset.exerciseId));Yt(o,t.sets)}})}function Gt(e){let t=!0;return Qt(e).catch(s=>{t&&(e.container.innerHTML=J(s))}),()=>{t=!1}}async function Qt(e){e.setTitle("Exercises"),e.setBack(null),e.setAction({label:"Add exercise",html:'<span style="font-size: 24px;">+</span>',onClick:()=>{we(null)}});let[t,s]=await Promise.all([T("exercises"),T("sets")]),o=t.sort((d,m)=>d.name.localeCompare(m.name)),n=new Map;for(let d of s)n.set(d.exerciseId,(n.get(d.exerciseId)??0)+1);let i="",r=null;e.container.innerHTML=`
    <div class="search-bar">
      <input class="search-input" id="ex-search" placeholder="Search exercises" />
    </div>
    <div class="chip-row" id="ex-chips"></div>
    <div class="list" id="ex-list"></div>
  `,e.container.scrollTop=0;let a=e.container.querySelector("#ex-list"),u=e.container.querySelector("#ex-chips"),c=e.container.querySelector("#ex-search");function p(){u.innerHTML=Be(o,r);for(let d of u.querySelectorAll(".chip"))d.addEventListener("click",()=>{let m=d.dataset.cat;r=m==="All"?null:m,p(),v()})}function v(){let d=o.filter(m=>!r||R(m)===r).filter(m=>!i||m.name.toLowerCase().includes(i.toLowerCase()));if(d.length===0){a.innerHTML='<div class="list-row"><div class="row-main" style="color: var(--text-secondary);">No matches</div></div>';return}a.innerHTML=d.map(m=>`
        <button class="list-row" data-id="${m.id}">
          ${te(m)}
          <div class="row-trailing trailing-stack">${se(n.get(m.id)??0)}</div>
          <div class="chevron">\u203A</div>
        </button>
      `).join("");for(let m of a.querySelectorAll("[data-id]"))m.addEventListener("click",()=>{Js(e,m.dataset.id).catch(k=>{e.container.innerHTML=J(k)})})}c.addEventListener("input",()=>{i=c.value,v()}),p(),v()}function Js(e,t){return Re(e,t,()=>Qt(e))}async function Re(e,t,s){e.setBack(s);let o=await Jt(t);if(!o){e.container.innerHTML=J({message:"Exercise not found."});return}e.setTitle(K(o.exercise)),e.setAction(o.exercise.isCustom?{label:"Delete exercise",html:Te(),onClick:async()=>{if(o.completed.length>0){alert(`Can't delete \u2014 this exercise has ${o.completed.length} logged set${o.completed.length===1?"":"s"}.`);return}confirm("Delete this custom exercise?")&&(await ie("exercises",t),H("data:changed"))}}:null),e.container.innerHTML=o.html,e.container.scrollTop=0,e.container.querySelector("#exd-edit")?.addEventListener("click",()=>{we(o.exercise,()=>Re(e,t,s))}),Xt(e.container);let n=e.container.querySelector(".exercise-chart-mount");n&&o.chartData.length>0&&ye(n,o.chartData,{unit:"lbs"})}function Xt(e){for(let t of e.querySelectorAll(".recent-set[data-workout-id]"))t.addEventListener("click",()=>Kt(t.dataset.workoutId))}async function He(e){let t=await Jt(e);if(!t)return;let s=W({html:`
      <div class="sheet-header">
        <button class="btn-text" id="exd-close">Done</button>
        <div class="title">${S(K(t.exercise))}</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">${t.html}</div>
    `,onMount(o){o.querySelector("#exd-close").addEventListener("click",()=>s()),o.querySelector("#exd-edit")?.addEventListener("click",()=>{we(t.exercise,()=>{s(),H("data:changed"),He(e)})}),Xt(o);let n=o.querySelector(".exercise-chart-mount");n&&t.chartData.length>0&&ye(n,t.chartData,{unit:"lbs"})}})}async function Jt(e){let[t,s,o,n]=await Promise.all([pe("exercises",e),T("sets"),T("workouts"),re()]);if(!t)return null;let i=new Map(o.map(d=>[d.id,d])),r=Q(s).filter(d=>d.exerciseId===e&&d.workoutId!==n?.id&&i.has(d.workoutId)).map(d=>({...d,workout:i.get(d.workoutId)})).sort((d,m)=>d.workout.startedAt-m.workout.startedAt),a=r.reduce((d,m)=>d+m.weight*m.reps,0),u=r.reduce((d,m)=>!d||m.weight>d.weight||m.weight===d.weight&&m.reps>d.reps?m:d,null),c=new Map;for(let d of r){if(d.weight<=0||d.reps<=0||(d.setType||"working")==="warmup")continue;let m=c.get(d.workoutId)||{date:d.workout.startedAt,total:0,count:0};m.total+=d.weight*d.reps,m.count+=1,c.set(d.workoutId,m)}let p=Array.from(c.values()).map(({date:d,total:m,count:k})=>({date:d,value:m/k})).sort((d,m)=>d.date-m.date),v=`
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
        ${u?`<div class="stat-row"><div class="stat-label">Best Set</div><div class="stat-value">${ve(u.weight)} \xD7 ${u.reps}</div></div>`:""}
      </div>
    `:""}

    ${p.length>0?`
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
  `;return{exercise:t,completed:r,chartData:p,html:v}}var ts=["Amazed","Excited","Happy","Joyful","Content","Calm","Relieved","Grateful","Hopeful","Confident","Proud","Surprised","Indifferent","Anxious","Stressed","Overwhelmed","Frustrated","Angry","Irritated","Sad","Lonely","Discouraged","Drained","Worried","Embarrassed"],ss=["Health","Fitness","Self-Care","Hobbies","Identity","Community","Family","Friends","Partner","Work","Education","Money","Weather","Tasks"],rt=[["taken","Taken"],["skipped","Skipped"],["snoozed","Snoozed"],["notInteracted","Not interacted"]],Zs=new Set(["taken","skipped","snoozed","notInteracted"]);function eo(e){let t=Number(e);return isFinite(t)?Math.max(-1,Math.min(1,t)):0}async function os({id:e,kind:t,valence:s,labels:o,associations:n,date:i}){let r={id:e||F(),kind:t==="dailyMood"?"dailyMood":"momentaryEmotion",date:i||Date.now(),valence:eo(s),labels:o||[],associations:n||[]};return await q("stateOfMind",r),r}async function ns({nickname:e,form:t,hasSchedule:s}){let o=(e||"").trim()||"Medication",n={id:F(),nickname:o,isArchived:!1,hasSchedule:!!s,concept:{identifier:"",displayText:o,form:(t||"").trim(),rxnorm:[]}};return await q("medications",n),n}async function at({id:e,medicationId:t,status:s,date:o,doseQuantity:n}){let i={id:e||F(),medicationId:String(t),status:Zs.has(s)?s:"taken",date:o||Date.now(),scheduledQuantity:0,doseQuantity:Number(n)||0};return await q("doseEvents",i),i}async function Fe(e,t){await ie(e,t)}async function ct(){let[e,t,s]=await Promise.all([T("stateOfMind"),T("medications"),T("doseEvents")]);return e.sort((o,n)=>o.date-n.date),s.sort((o,n)=>o.date-n.date),{stateOfMind:e,medications:t,doseEvents:s}}var Zt=e=>{let t=new Date(e);return`${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`},es=e=>e.length?e.reduce((t,s)=>t+s,0)/e.length:null;function is(e,t){let s=new Set(t.map(a=>Zt(a.startedAt))),o=[],n=[];for(let a of e)(s.has(Zt(a.date))?o:n).push(a.valence);let i=es(o),r=es(n);return{onWorkout:i,offWorkout:r,delta:i!=null&&r!=null?i-r:null,onCount:o.length,offCount:n.length}}function rs(e,t){let s=new Map;for(let o of t){if(o.status!=="taken"&&o.status!=="skipped")continue;let n=s.get(o.medicationId)??{taken:0,total:0};n.total+=1,o.status==="taken"&&(n.taken+=1),s.set(o.medicationId,n)}return e.map(o=>{let n=s.get(o.id)??{taken:0,total:0};return{medication:o,taken:n.taken,total:n.total,pct:n.total?n.taken/n.total:null}})}var to=Object.fromEntries(rt),ds=e=>new Date(e).toLocaleTimeString(void 0,{hour:"numeric",minute:"2-digit"}),us='<span style="font-size: 24px;">+</span>';async function lt(e,t){let s=()=>lt(e,t);e.setTitle("State of Mind"),e.setBack(t),e.setAction({html:us,onClick:()=>cs(s)});let[{stateOfMind:o},n]=await Promise.all([ct(),X()]),i=is(o,n);e.container.innerHTML=`
    ${o.length?`
      <div class="section">Summary</div>
      <div class="form-section">
        <div class="stat-row"><div class="stat-label">Entries</div><div class="stat-value">${o.length.toLocaleString()}</div></div>
        <div class="stat-row"><div class="stat-label">Range</div><div class="stat-value">${z(o[0].date)} \u2013 ${z(o[o.length-1].date)}</div></div>
        <div class="stat-row"><div class="stat-label">Average mood</div><div class="stat-value">${Ne(ro(o))}</div></div>
      </div>

      <div class="section">Mood vs. training</div>
      <div class="form-section">
        <div class="stat-row"><div class="stat-label">On workout days</div><div class="stat-value">${i.onWorkout!=null?Ne(i.onWorkout)+` (${i.onCount})`:"\u2014"}</div></div>
        <div class="stat-row"><div class="stat-label">On rest days</div><div class="stat-value">${i.offWorkout!=null?Ne(i.offWorkout)+` (${i.offCount})`:"\u2014"}</div></div>
        <div class="stat-row"><div class="stat-label">Difference</div><div class="stat-value">${i.delta!=null?(i.delta>=0?"+":"")+i.delta.toFixed(2):"\u2014"}</div></div>
      </div>

      <div class="section">Recent entries</div>
      <div class="list">${o.slice(-30).reverse().map(so).join("")}</div>
    `:ps("\u{1F9E0}","No mood entries","Tap \uFF0B to log how you're feeling.")}
  `,e.container.scrollTop=0;for(let r of e.container.querySelectorAll("[data-edit-som]")){let a=o.find(u=>u.id===r.dataset.editSom);a&&r.addEventListener("click",()=>cs(s,a))}}function so(e){let t=e.kind==="dailyMood",s=e.labels.length?e.labels.join(", "):t?"Daily mood":"Momentary emotion",o=[...e.labels.length?[t?"Daily mood":"Moment"]:[],z(e.date),ds(e.date),...e.associations.length?[e.associations.join(", ")]:[]].join(" \xB7 ");return`
    <button class="list-row" data-edit-som="${S(e.id)}">
      <div class="row-main">
        <div class="row-title">${S(s)}</div>
        <div class="row-subtitle">${S(o)}</div>
      </div>
      <div class="row-trailing">${Ne(e.valence)}</div>
      <div class="chevron">\u203A</div>
    </button>`}async function dt(e,t){let s=()=>dt(e,t);e.setTitle("Medications"),e.setBack(t),e.setAction({html:us,onClick:()=>po(s)});let{medications:o,doseEvents:n}=await ct(),i=rs(o,n),r=new Map(o.map(p=>[p.id,p.nickname||p.concept.displayText])),a=n.slice(-20).reverse(),u=new Date;u.setHours(0,0,0,0);let c=new Map;for(let p of n)p.status==="taken"&&p.date>=u.getTime()&&c.set(p.medicationId,(c.get(p.medicationId)||0)+1);e.container.innerHTML=`
    ${o.length?`
      <div class="section">Your medications</div>
      ${i.map(p=>oo(p,c.get(p.medication.id)||0)).join("")}
      ${a.length?`
        <div class="section">Recent doses</div>
        <div class="list">${a.map(p=>no(p,r)).join("")}</div>
      `:""}
    `:ps("\u{1F48A}","No medications","Tap \uFF0B to add one, then log each dose as you take it.")}
  `,e.container.scrollTop=0;for(let p of e.container.querySelectorAll("[data-take]"))p.addEventListener("click",async()=>{await at({medicationId:p.dataset.take,status:p.dataset.status,date:Date.now(),doseQuantity:1}),I(p.dataset.status==="taken"?"Logged as taken":"Logged as skipped"),s()});for(let p of e.container.querySelectorAll("[data-logat]"))p.addEventListener("click",()=>ls(o,s,p.dataset.logat));for(let p of e.container.querySelectorAll("[data-edit-dose]")){let v=n.find(d=>d.id===p.dataset.editDose);v&&p.addEventListener("click",()=>ls(o,s,null,v))}io(e,s)}function oo(e,t){let s=e.medication,o=[s.concept.form||"No form set",e.pct!=null?`${Math.round(e.pct*100)}% taken (${e.taken}/${e.total})`:"no doses yet"].join(" \xB7 "),n=s.hasSchedule?t>0?'<span class="hz-pill" style="--pc: #2ba758;">\u2713 Taken today</span>':'<span class="hz-pill muted">Not taken today</span>':"";return`
    <div class="exercise-section">
      <div class="exercise-section-header">
        <div class="row-main">
          <div class="row-title" style="font-weight:600">${S(s.nickname||s.concept.displayText)}</div>
          <div class="row-subtitle">${S(o)}</div>
          ${n?`<div style="margin-top: 8px;">${n}</div>`:""}
        </div>
        <button class="menu" data-del-store="medications" data-del-id="${S(s.id)}" aria-label="Delete">\u2715</button>
      </div>
      <div class="med-actions">
        <button class="btn-secondary" data-take="${S(s.id)}" data-status="taken">Taken now</button>
        <button class="btn-secondary" data-take="${S(s.id)}" data-status="skipped">Skip</button>
        <button class="btn-secondary" data-logat="${S(s.id)}">Log at time\u2026</button>
      </div>
    </div>`}function no(e,t){let s=Number(e.doseQuantity)||0,o=[z(e.date),ds(e.date),...s>0?[`${ao(s)} ${s===1?"dose":"doses"}`]:[]].join(" \xB7 ");return`
    <button class="list-row" data-edit-dose="${S(e.id)}">
      <div class="row-main">
        <div class="row-title">${S(t.get(e.medicationId)||"Medication")}</div>
        <div class="row-subtitle">${S(o)}</div>
      </div>
      <div class="row-trailing">${S(to[e.status]||e.status)}</div>
      <div class="chevron">\u203A</div>
    </button>`}function ps(e,t,s){return`
    <div class="empty-state" style="padding: 48px 24px; min-height: auto;">
      <div class="empty-icon">${e}</div>
      <h2>${S(t)}</h2>
      <p>${S(s)}</p>
    </div>`}function io(e,t){for(let s of e.container.querySelectorAll("[data-del-id]"))s.addEventListener("click",async()=>{confirm("Delete this entry?")&&(await Fe(s.dataset.delStore,s.dataset.delId),t())})}function ro(e){return e.reduce((t,s)=>t+s.valence,0)/e.length}var ao=e=>Number.isInteger(e)?String(e):String(Number(e.toFixed(3)));function co(e){return e>=.7?["Very pleasant","#2ba758"]:e>=.4?["Pleasant","#54a85a"]:e>=.1?["Slightly pleasant","#9cad46"]:e>-.1?["Neutral","#8a8a8e"]:e>-.4?["Slightly unpleasant","#d99a3c"]:e>-.7?["Unpleasant","#e07a4e"]:["Very unpleasant","#e0574f"]}function Ne(e){let[t,s]=co(e);return`<span class="hz-pill" style="--pc: ${s};">${S(t)}</span>`}var lo=["Very Unpleasant","Unpleasant","Slightly Unpleasant","Neutral","Slightly Pleasant","Pleasant","Very Pleasant"];function ut(e){let t=new Date(e),s=o=>String(o).padStart(2,"0");return`${t.getFullYear()}-${s(t.getMonth()+1)}-${s(t.getDate())}T${s(t.getHours())}:${s(t.getMinutes())}`}var fs=()=>ut(Date.now());function ms(e){let t=e?new Date(e).getTime():NaN;return isFinite(t)?t:Date.now()}var uo=e=>Math.max(-3,Math.min(3,Math.round(e*3)));function as(e,t=[]){return e.map(s=>`<button type="button" class="chip${t.includes(s)?" active":""}" data-chip="${S(s)}">${S(s)}</button>`).join("")}function ge(e,t,s={}){for(let o of e.querySelectorAll(`${t} .chip`))o.addEventListener("click",()=>{s.single&&e.querySelectorAll(`${t} .chip`).forEach(n=>n.classList.remove("active")),o.classList.toggle("active",s.single?!0:!o.classList.contains("active"))})}var be=(e,t)=>[...e.querySelectorAll(`${t} .chip.active`)].map(s=>s.dataset.chip);function cs(e,t=null){let s=!!t,o=s&&t.kind==="dailyMood",n=s?uo(t.valence):1,i=s?t.valence:n/3,r=W({html:`
      <div class="sheet-header">
        <button class="btn-text" id="som-cancel">Cancel</button>
        <div class="title">${s?"Edit Entry":"State of Mind"}</div>
        <button class="btn-text primary" id="som-save">Save</button>
      </div>
      <div class="sheet-content">
        <div class="section">Kind</div>
        <div class="chip-row" id="som-kind">
          <button type="button" class="chip${o?"":" active"}" data-chip="momentaryEmotion">Momentary emotion</button>
          <button type="button" class="chip${o?" active":""}" data-chip="dailyMood">Daily mood</button>
        </div>
        <div class="section">How pleasant?</div>
        <div class="form-section" style="padding: 6px 18px 18px;">
          <div id="som-val-label" style="text-align: center; font-weight: 600; padding: 10px 0;"></div>
          <input type="range" class="mood-slider" id="som-val" min="-3" max="3" step="1" value="${n}" />
        </div>
        <div class="section">Emotions (optional)</div>
        <div class="chip-row" id="som-emotions" style="flex-wrap: wrap;">${as(ts,s?t.labels:[])}</div>
        <div class="section">What's affecting you? (optional)</div>
        <div class="chip-row" id="som-assoc" style="flex-wrap: wrap;">${as(ss,s?t.associations:[])}</div>
        <div class="section">When</div>
        <div class="form-section">
          <div class="form-row"><input type="datetime-local" id="som-date" value="${s?ut(t.date):fs()}" style="text-align: left;" /></div>
        </div>
        ${s?`
        <div style="height: 8px;"></div>
        <div class="form-section">
          <button class="list-row button destructive" id="som-delete"><div class="row-main"><div class="row-title" style="color: var(--red);">Delete Entry</div></div></button>
        </div>`:""}
        <div style="height: 16px;"></div>
      </div>
    `,onMount(a){let u=a.querySelector("#som-val"),c=a.querySelector("#som-val-label"),p=()=>{c.textContent=lo[Number(u.value)+3]};p(),u.addEventListener("input",()=>{i=Number(u.value)/3,p()}),ge(a,"#som-kind",{single:!0}),ge(a,"#som-emotions"),ge(a,"#som-assoc"),a.querySelector("#som-cancel").addEventListener("click",()=>r()),a.querySelector("#som-save").addEventListener("click",async()=>{await os({id:t?.id,kind:be(a,"#som-kind")[0]||"momentaryEmotion",valence:i,labels:be(a,"#som-emotions"),associations:be(a,"#som-assoc"),date:ms(a.querySelector("#som-date").value)}),r(),I(s?"Entry updated":"Logged State of Mind"),e?.()}),a.querySelector("#som-delete")?.addEventListener("click",async()=>{confirm("Delete this entry?")&&(await Fe("stateOfMind",t.id),r(),I("Entry deleted"),e?.())})}})}function po(e){let t=W({html:`
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
        <div class="section">Type</div>
        <div class="chip-row" id="med-type">
          <button type="button" class="chip active" data-chip="daily">Daily</button>
          <button type="button" class="chip" data-chip="asneeded">As needed</button>
        </div>
        <div class="section-footer">Daily medications show whether you've taken them today.</div>
      </div>
    `,onMount(s){let o=s.querySelector("#med-name"),n=s.querySelector("#med-save");o.addEventListener("input",()=>{n.disabled=o.value.trim().length===0}),ge(s,"#med-type",{single:!0}),s.querySelector("#med-cancel").addEventListener("click",()=>t()),n.addEventListener("click",async()=>{o.value.trim()&&(await ns({nickname:o.value,form:s.querySelector("#med-form").value,hasSchedule:(be(s,"#med-type")[0]||"daily")==="daily"}),t(),I("Medication added"),e?.())}),setTimeout(()=>o.focus(),50)}})}function ls(e,t,s,o=null){let n=!!o,i=e.filter(v=>!v.isArchived),r=i.length?i:e,a=n?o.medicationId:s,u=n?o.status:"taken",c=n&&Number(o.doseQuantity)||1,p=W({html:`
      <div class="sheet-header">
        <button class="btn-text" id="dose-cancel">Cancel</button>
        <div class="title">${n?"Edit Dose":"Log a Dose"}</div>
        <button class="btn-text primary" id="dose-save">Save</button>
      </div>
      <div class="sheet-content">
        <div class="section">Medication</div>
        <div class="form-section">
          <div class="form-row">
            <select id="dose-med" style="text-align: left;">
              ${r.map(v=>`<option value="${S(v.id)}"${v.id===a?" selected":""}>${S(v.nickname||v.concept.displayText)}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="section">Status</div>
        <div class="chip-row" id="dose-status">
          ${rt.map(([v,d])=>`<button type="button" class="chip${v===u?" active":""}" data-chip="${v}">${S(d)}</button>`).join("")}
        </div>
        <div class="section">Amount</div>
        <div class="form-section">
          <div class="form-row"><input type="number" id="dose-qty" inputmode="decimal" min="0" step="0.25" value="${c}" style="text-align: left;" /></div>
        </div>
        <div class="section">When</div>
        <div class="form-section">
          <div class="form-row"><input type="datetime-local" id="dose-date" value="${n?ut(o.date):fs()}" style="text-align: left;" /></div>
        </div>
        ${n?`
        <div style="height: 8px;"></div>
        <div class="form-section">
          <button class="list-row button destructive" id="dose-delete"><div class="row-main"><div class="row-title" style="color: var(--red);">Delete Dose</div></div></button>
        </div>`:""}
        <div style="height: 16px;"></div>
      </div>
    `,onMount(v){ge(v,"#dose-status",{single:!0}),v.querySelector("#dose-cancel").addEventListener("click",()=>p()),v.querySelector("#dose-save").addEventListener("click",async()=>{await at({id:o?.id,medicationId:v.querySelector("#dose-med").value,status:be(v,"#dose-status")[0]||"taken",date:ms(v.querySelector("#dose-date").value),doseQuantity:Number(v.querySelector("#dose-qty").value)||0}),p(),I(n?"Dose updated":"Dose logged"),t?.()}),v.querySelector("#dose-delete")?.addEventListener("click",async()=>{confirm("Delete this dose?")&&(await Fe("doseEvents",o.id),p(),I("Dose deleted"),t?.())})}})}function ws(e){let t=!0,s=null;return e.container.innerHTML="",re().then(o=>{t&&(o?s=ho(e,o):fo(e))}).catch(o=>{t&&(e.container.innerHTML=`<div class="empty-state"><div class="empty-icon">!</div><h2>Couldn't load</h2><p>${S(o.message)}</p></div>`)}),()=>{t=!1,typeof s=="function"&&s()}}async function fo(e){e.setTitle("Workout");let t=await X(),s=t[0],o=Xe(t),n=o?qe(o.normalized):N[0],r=o&&vs(o.startedAt)==="today"?"Tomorrow":"Today",a=s?`<div class="last-workout-hint">Last: <strong>${S(s.name)}</strong> \xB7 ${vs(s.startedAt)}</div>`:"",u=`<div class="next-workout-hint">${r}: <strong>${S(n)}</strong></div>`;e.container.innerHTML=`
    <div class="workout-start">
      <div class="icon">\u{1F3CB}\uFE0F</div>
      <h2>No active workout</h2>
      <p>Start one to begin logging sets.</p>
      ${a}
      ${u}
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
  `,e.container.querySelector("#start-btn").addEventListener("click",()=>mo(n,r));for(let c of e.container.querySelectorAll("[data-nav]"))c.addEventListener("click",()=>{c.dataset.nav==="mind"?lt(e,()=>e.refresh()):dt(e,()=>e.refresh())})}function vs(e){let t=new Date,s=new Date(e),o=i=>new Date(i.getFullYear(),i.getMonth(),i.getDate()).getTime(),n=Math.round((o(t)-o(s))/(1440*60*1e3));return n===0?"today":n===1?"yesterday":n<7?`${n} days ago`:n<14?"a week ago":`${Math.round(n/7)} weeks ago`}function mo(e,t="Today"){vo(e,async s=>{let o={id:F(),name:s,startedAt:Date.now(),endedAt:null,notes:""};await q("workouts",o),H("workout:changed")},t)}function vo(e,t,s="Today"){let n=W({html:`
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
                <div class="row-main"><div class="row-title" style="color: ${Ie(i)}; font-weight: 600;">${S(i)}${a}</div></div>
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
    `,onMount(i){i.querySelector("#wt-cancel").addEventListener("click",()=>n());for(let u of i.querySelectorAll(".list-row.button[data-name]"))u.addEventListener("click",()=>{let c=u.dataset.name;n(),t(c)});let r=i.querySelector("#wt-custom"),a=i.querySelector("#wt-go");r.addEventListener("input",()=>{a.disabled=r.value.trim().length===0}),a.addEventListener("click",()=>{let u=r.value.trim();u&&(n(),t(u))}),setTimeout(()=>r.focus(),50)}})}function ho(e,t){let s=[],o=[],n=new Map,i=new Map,r=null;e.container.innerHTML=`
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
  `,e.container.querySelector("#calc-fab").addEventListener("click",Mo);let a=()=>{e.setTitle(St((Date.now()-t.startedAt)/1e3))};a(),r=setInterval(a,1e3);let u=e.container.querySelector("#wname");u.addEventListener("input",async()=>{t.name=u.value,await q("workouts",{...t}),oe()});let c=new Map;e.container.querySelector("#add-exercise-btn").addEventListener("click",()=>{So(s,i,async y=>{await bo(t,o,y),await p()})}),e.container.querySelector("#finish-btn").addEventListener("click",async()=>{if(confirm("Finish this workout?")){await xo(t,o);try{let{filename:y}=await ot();I(`Saved \xB7 backup: ${y}`)}catch(y){I(`Saved \xB7 backup failed: ${y.message}`)}H("workout:changed")}}),e.container.querySelector("#discard-btn").addEventListener("click",async()=>{confirm("Discard this workout? This cannot be undone.")&&(await De(t.id),H("workout:changed"))});async function p(){let[y,h,M]=await Promise.all([T("sets"),T("workouts"),T("exercises")]);s=M,o=y.filter(x=>x.workoutId===t.id).sort((x,$)=>x.order-$.order),n=wt(y,h,t.id),c=m(y,M,t.id),i=new Map;for(let x of y)i.set(x.exerciseId,(i.get(x.exerciseId)??0)+1);E(),v()}function v(){let y=new Map(s.map(b=>[b.id,b])),h=[],M=new Map;for(let b of o){let D=y.get(b.exerciseId);if(!D)continue;let L=R(D);if(h.includes(L)||h.push(L),!b.completed)continue;let C=(b.weight||0)*(b.reps||0);C<=0||M.set(L,(M.get(L)??0)+C)}let x=[...M.values()].reduce((b,D)=>b+D,0),$=e.container.querySelector("#workout-progress");if(!$)return;if(h.length===0){$.innerHTML="";return}let A=h.map(b=>{let D=c.get(b)??0,L=M.get(b)??0;return{muscle:b,record:D,cur:L,span:Math.max(D,L)}}),B=Math.max(...A.map(b=>b.span)),f=B>0?B*.12:1;A=A.map(b=>({...b,span:Math.max(b.span,f)}));let l=Math.max(...A.map(b=>b.span)),w=A.map(({muscle:b,record:D,cur:L,span:C})=>{let P=C/l*100,V=L>0?Math.min(100,L/C*100):0,O;if(D>0){let ce=Math.round(L/D*100);O=L>D?`${ce}% \u{1F525}`:`${ce}%`}else O=L>0?"new \u{1F525}":"new";let U=D>0?`${Y(L)} / ${Y(D)} \xB7 ${O}`:`${Y(L)} \xB7 ${O}`,_=At(b);return`
        <div class="vol-muscle" style="width: ${P.toFixed(2)}%; --mcolor: ${_}; --mtext: ${Ct(_)};" title="${S(b)}: ${Y(L)} / record ${Y(D)} lbs">
          <div class="vol-fill" style="width: ${V.toFixed(2)}%;"></div>
          <div class="vol-info${V>55?" on-fill":""}">
            <span class="seg-name">${S(b)}</span>
            <span class="seg-vol">${U}</span>
          </div>
        </div>
      `}).join(""),g=`<strong>${Y(x)} lbs</strong> total`;$.innerHTML=`
      <div class="vol-bars">${w}</div>
      <div class="vol-label">${g}</div>
    `,requestAnimationFrame(()=>{for(let b of $.querySelectorAll(".vol-muscle"))d(b)})}function d(y){let h=y.querySelector(".seg-name"),M=y.querySelector(".seg-vol"),x=y.clientWidth-4;if(x<=0)return;if(M){let A=10;for(M.style.fontSize=`${A}px`;M.scrollWidth>x&&A>6;)A-=.5,M.style.fontSize=`${A}px`}if(!h)return;h.style.display="";let $=11;for(h.style.fontSize=`${$}px`;h.scrollWidth>x&&$>5;)$-=.5,h.style.fontSize=`${$}px`}function m(y,h,M){let x=new Map(h.map(B=>[B.id,B])),$=new Map,A=new Map;for(let B of Q(y)){if(B.workoutId===M)continue;let f=x.get(B.exerciseId);if(!f)continue;let l=(B.weight||0)*(B.reps||0);if(l<=0)continue;let w=R(f),g=A.get(B.workoutId);g||A.set(B.workoutId,g=new Map),g.set(w,(g.get(w)??0)+l)}for(let B of A.values())for(let[f,l]of B)l>($.get(f)??0)&&$.set(f,l);return $}async function k(y){if(!y.completed||(y.setType||"working")==="warmup"||!(y.weight>0)||!(y.reps>0))return;let h=s.find(l=>l.id===y.exerciseId);if(!h)return;let M=await T("sets"),x=Q(M).filter(l=>l.exerciseId===y.exerciseId&&l.id!==y.id&&(l.setType||"working")!=="warmup"&&l.weight>0&&l.reps>0);if(x.length===0)return;let $=[],A=x.reduce((l,w)=>Math.max(l,w.weight),0);y.weight>A&&$.push(`Heaviest weight ever: ${me(y.weight)} lbs`);let B=y.weight*y.reps,f=x.reduce((l,w)=>Math.max(l,w.weight*w.reps),0);if(B>f&&$.push(`Most volume in a set: ${me(y.weight)}\xD7${y.reps} = ${Y(B)} lbs`),$.length>0){let l=$.length>1?"New records":"New record";I(`\u{1F3C6} ${K(h)} \u2014 ${l}!
${$.join(`
`)}`,0,{persistUntilClick:!0})}}function E(){let y=new Map(s.map(f=>[f.id,f])),h=[],M=new Map;for(let f of o)M.has(f.exerciseId)||(M.set(f.exerciseId,[]),h.push(f.exerciseId)),M.get(f.exerciseId).push(f);for(let[,f]of M)f.sort((l,w)=>l.order-w.order);let x=e.container.querySelector("#exercise-sections");if(h.length===0){x.innerHTML=`
        <div class="empty-state" style="padding: 40px 24px; min-height: auto;">
          <p style="color: var(--text-secondary);">Add an exercise to start logging sets.</p>
        </div>`;return}x.innerHTML=h.map(f=>{let l=y.get(f),w=M.get(f),g=n.get(f)??new Map;return yo(l,w,g,i.get(f)??0)}).join("");function $(f){delete f.bumpedBy,delete f.preBumpWeight,delete f.preBumpReps}function A(f){let l=o.filter(L=>L.exerciseId===f.exerciseId).sort((L,C)=>L.order-C.order),w=f.setType||"working",g=0,b=0;for(let L of l)if(b+=1,(L.setType||"working")===w&&(g+=1),L.id===f.id)break;let D=ke(w,g,n.get(f.exerciseId),b);return D&&D.weight>0&&D.reps>0?{weight:D.weight,reps:D.reps}:null}async function B(f){await ys(f.id,o),f.completed&&await hs(f,o,A);for(let l of o){if(l.exerciseId!==f.exerciseId)continue;let w=x.querySelector(`.set-row[data-set-id="${l.id}"]`);if(!w)continue;let g=w.querySelector(".weight-input"),b=w.querySelector(".reps-input");g&&document.activeElement!==g&&(g.value=l.weight>0?String(l.weight):""),b&&document.activeElement!==b&&(b.value=l.reps>0?String(l.reps):"")}}for(let f of x.querySelectorAll(".set-row-wrap")){let l=f.querySelector(".set-row"),w=l.dataset.setId,g=o.find(O=>O.id===w);if(!g)continue;let b=l.querySelector(".weight-input"),D=l.querySelector(".reps-input"),L=l.querySelector(".complete-btn");go(f,async()=>{await ie("sets",g.id),await p()});let C=Ke(async()=>{await B(g),g.completed&&v()},200);b.addEventListener("input",()=>{g.weight=parseFloat(b.value)||0,$(g),q("sets",{...g}).catch(O=>console.error("Set save failed",O)),C()});let P=Ke(async()=>{await B(g),g.completed&&v()},200);D.addEventListener("input",()=>{g.reps=parseInt(D.value,10)||0,$(g),q("sets",{...g}).catch(O=>console.error("Set save failed",O)),P()}),L.addEventListener("click",async()=>{let O=g.completed;g.completed=!g.completed,g.completed&&$(g),await q("sets",g),l.classList.toggle("completed",g.completed),L.innerHTML=gs(g.completed);let U=l.querySelector(".set-number")?.textContent?.trim()||"";L.setAttribute("aria-label",`${g.completed?"Mark incomplete":"Mark complete"} set ${U}`),v(),!O&&g.completed?(await hs(g,o,A)&&E(),await k(g)):O&&!g.completed&&await ys(g.id,o)&&E()});let V=l.querySelector(".set-number");V&&V.addEventListener("click",async()=>{let U=(g.setType||"working")==="warmup"?"working":"warmup";if(g.setType=U,!g.completed){let _=o.filter(ne=>ne.exerciseId===g.exerciseId).sort((ne,xs)=>ne.order-xs.order),ce=0,ft=0;for(let ne of _)if(ft+=1,(ne.setType||"working")===U&&(ce+=1),ne.id===g.id)break;let le=ke(U,ce,n.get(g.exerciseId),ft);le&&le.weight>0&&le.reps>0&&(g.weight=le.weight,g.reps=le.reps)}await q("sets",g),E()})}for(let f of x.querySelectorAll(".add-set-btn"))f.addEventListener("click",async()=>{let l=f.dataset.exerciseId;await ko(t,o,l,n.get(l)??new Map),await p()});for(let f of x.querySelectorAll(".exercise-menu"))f.addEventListener("click",async()=>{let l=f.dataset.exerciseId;confirm("Remove this exercise from the workout?")&&(await Ue("sets",o.filter(w=>w.exerciseId===l).map(w=>w.id)),await p())});for(let f of x.querySelectorAll(".exercise-name-btn"))f.addEventListener("click",()=>{r&&(clearInterval(r),r=null),Re(e,f.dataset.exerciseId,()=>e.refresh())})}return p(),()=>{r&&clearInterval(r)}}function yo(e,t,s=new Map,o=0){let n=0,i=0,r=t.map((a,u)=>{let c=a.setType||"working",p,v;c==="warmup"?(i+=1,v=i,p=`W${i}`):(n+=1,v=n,p=String(n));let d=ke(c,v,s,u+1);return wo(a,p,d)}).join("");return`
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
  `}function ke(e,t,s,o=null){if(!s||typeof s.get!="function")return null;let n=s.get(`${e}#${t}`);return n||(o!=null?s.get(`any#${o}`)??null:null)}function wo(e,t,s){let o=e.setType||"working",n=s&&s.weight>0&&s.reps>0?`${me(s.weight)} \xD7 ${s.reps}`:"\u2014";return`
    <div class="set-row-wrap" data-set-id="${e.id}">
      <button class="set-swipe-delete" data-set-id="${e.id}" aria-label="Delete set ${t}">Delete</button>
      <div class="set-row type-${o}${e.completed?" completed":""}" data-set-id="${e.id}">
        <button class="set-number" aria-label="Set ${t}, tap to mark as ${o==="warmup"?"working":"warmup"}">${t}</button>
        <div class="prev" aria-label="Previous">${n}</div>
        <input class="weight-input" type="number" inputmode="decimal" step="0.5" aria-label="Weight in pounds for set ${t}"
               placeholder="0" value="${e.weight>0?e.weight:""}" />
        <input class="reps-input" type="number" inputmode="numeric" step="1" aria-label="Repetitions for set ${t}"
               placeholder="0" value="${e.reps>0?e.reps:""}" />
        <button class="complete-btn" aria-label="${e.completed?"Mark incomplete":"Mark complete"} set ${t}">${gs(e.completed)}</button>
      </div>
    </div>
  `}function go(e,t){let s=e.querySelector(".set-row"),o=e.querySelector(".set-swipe-delete");if(!s||!o)return;let n=88,i=0,r=0,a=0,u=0,c=!1,p=!1,v=!1,d=!1,m=()=>Math.max(140,i*.5);function k(x,$){s.style.transition=$?"transform 0.18s ease":"none",s.style.transform=`translateX(${x}px)`,o.style.width=`${Math.max(n,-x)}px`,e.classList.toggle("will-delete",x<=-m())}function E(x=!0){v=!1,k(0,x),e.classList.remove("swiped-open")}function y(x=!0){document.querySelectorAll(".set-row-wrap.swiped-open").forEach($=>{if($!==e){let A=$.querySelector(".set-row");A&&(A.style.transition="transform 0.18s ease",A.style.transform="translateX(0)");let B=$.querySelector(".set-swipe-delete");B&&(B.style.width=""),$.classList.remove("swiped-open","will-delete")}}),v=!0,k(-n,x),e.classList.add("swiped-open")}function h(){s.style.transition="transform 0.16s ease-out",s.style.transform=`translateX(${-i}px)`,o.style.width=`${i}px`,setTimeout(t,150)}s.addEventListener("touchstart",x=>{i=e.clientWidth||s.clientWidth,r=x.touches[0].clientX,a=x.touches[0].clientY,u=v?-n:0,c=!0,p=!1,d=!!x.target.closest("input, button, select, textarea")},{passive:!0}),s.addEventListener("touchmove",x=>{if(!c)return;let $=x.touches[0].clientX-r,A=x.touches[0].clientY-a;if(!p){if(Math.abs(A)>Math.abs($)+4){c=!1;return}Math.abs($)>8&&(p=!0,d&&document.activeElement?.blur&&document.activeElement.blur())}if(!p)return;x.cancelable&&x.preventDefault();let B=v?-n:0;u=Math.min(0,Math.max(-i,B+$)),k(u,!1)},{passive:!1});function M(){c&&(c=!1,p&&(u<=-m()?h():u<-n/2?y():E()))}s.addEventListener("touchend",M),s.addEventListener("touchcancel",M),o.addEventListener("click",x=>{x.stopPropagation(),t()})}function gs(e){return e?'<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>':'<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>'}async function bo(e,t,s){let o=t.reduce((n,i)=>Math.max(n,i.order),-1)+1;for(let n of s){let i=(await yt(n,e.id)).filter(u=>(u.weight||0)>0&&(u.reps||0)>0),a=(i.length>0?i:[{weight:0,reps:0,setType:"working"}]).map(u=>({id:F(),workoutId:e.id,exerciseId:n,weight:u.weight??0,reps:u.reps??0,setType:u.setType||"working",completed:!1,order:o++,createdAt:Date.now()}));await fe("sets",a)}}async function hs(e,t,s){let o=(e.weight||0)*(e.reps||0);if(o<=0)return!1;let n=!1;for(let i of t)if(i.exerciseId===e.exerciseId&&i.id!==e.id&&!((i.order??0)<=(e.order??0))&&!i.completed&&(i.weight||0)*(i.reps||0)<o){if(i.bumpedBy==null){let r=s?.(i);i.preBumpWeight=r?r.weight:i.weight,i.preBumpReps=r?r.reps:i.reps}i.bumpedBy=e.id,i.weight=e.weight,i.reps=e.reps,await q("sets",i),n=!0}return n}async function ys(e,t){let s=!1;for(let o of t)o.bumpedBy===e&&(o.completed||(o.preBumpWeight!=null&&(o.weight=o.preBumpWeight),o.preBumpReps!=null&&(o.reps=o.preBumpReps)),delete o.bumpedBy,delete o.preBumpWeight,delete o.preBumpReps,await q("sets",o),s=!0);return s}async function ko(e,t,s,o=new Map){let n=t.filter(E=>E.exerciseId===s),i=n[n.length-1],r=E=>(E?.weight||0)*(E?.reps||0),a=n.filter(E=>(E.setType||"working")!=="warmup"),u=a.length+1,c=ke("working",u,o,n.length+1),p=a.filter(E=>E.weight>0&&E.reps>0).reduce((E,y)=>!E||r(y)>r(E)?y:E,null),v=a.some((E,y)=>{let h=ke("working",y+1,o);return h&&h.weight>0&&h.reps>0&&r(E)>r(h)}),d=i?.weight??0,m=i?.reps??0;p&&(!c||v)&&(d=p.weight,m=p.reps);let k={id:F(),workoutId:e.id,exerciseId:s,weight:d,reps:m,completed:!1,order:(i?.order??-1)+1,createdAt:Date.now()};await q("sets",k)}async function xo(e,t){await Ue("sets",t.filter(s=>!s.completed&&((s.weight||0)===0||(s.reps||0)===0)).map(s=>s.id)),e.endedAt=Date.now(),await q("workouts",e)}function So(e,t,s){let o=new Set,n="",i=null,r=W({html:`
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
    `,onMount(a){let u=a.querySelector("#picker-list"),c=a.querySelector("#picker-add"),p=a.querySelector("#picker-cancel"),v=a.querySelector("#picker-custom"),d=a.querySelector("#picker-search"),m=a.querySelector("#picker-chips");function k(){m.innerHTML=Be(e,i);for(let y of m.querySelectorAll(".chip"))y.addEventListener("click",()=>{let h=y.dataset.cat;i=h==="All"?null:h,k(),E()})}function E(){let y=e.filter(h=>!i||R(h)===i).filter(h=>!n||h.name.toLowerCase().includes(n.toLowerCase())).sort((h,M)=>{let x=t.get(h.id)??0,$=t.get(M.id)??0;return x!==$?$-x:h.name.localeCompare(M.name)});u.innerHTML=y.length===0?'<div class="list-row"><div class="row-main" style="color:var(--text-secondary)">No matches</div></div>':y.map(h=>`
                <button class="list-row" data-id="${h.id}">
                  ${te(h)}
                  <div class="row-trailing trailing-stack">
                    ${se(t.get(h.id)??0)}
                    ${o.has(h.id)?$o():""}
                  </div>
                </button>
              `).join("");for(let h of u.querySelectorAll(".list-row[data-id]"))h.addEventListener("click",()=>{let M=h.dataset.id;o.has(M)?o.delete(M):o.add(M),c.disabled=o.size===0,c.textContent=o.size===0?"Add":`Add (${o.size})`,E()})}d.addEventListener("input",()=>{n=d.value,E()}),p.addEventListener("click",()=>r()),c.addEventListener("click",()=>{s(Array.from(o)),r()}),v.addEventListener("click",()=>{we(null,async y=>{e.push(y),o.add(y.id),k(),E(),c.disabled=!1,c.textContent=`Add (${o.size})`})}),k(),E()}})}function $o(){return'<svg viewBox="0 0 24 24" width="22" height="22" fill="var(--green)"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'}function we(e,t){let s=!!e,o=s?R(e):null,n=!o||he.includes(o)?he:[o,...he],i=e?.equipment,r=!i||Ae.includes(i)?Ae:[i,...Ae],a=W({html:`
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
            <select id="ce-cat">${n.map(u=>`<option${u===o?" selected":""}>${S(u)}</option>`).join("")}</select>
          </div>
        </div>
        <div class="section">Equipment</div>
        <div class="form-section">
          <div class="form-row">
            <label for="ce-eq">Equipment</label>
            <select id="ce-eq">${r.map(u=>`<option${u===i?" selected":""}>${S(u)}</option>`).join("")}</select>
          </div>
        </div>
      </div>
    `,onMount(u){let c=u.querySelector("#ce-name"),p=u.querySelector("#ce-save");c.addEventListener("input",()=>{p.disabled=c.value.trim().length===0}),u.querySelector("#ce-cancel").addEventListener("click",()=>a()),p.addEventListener("click",async()=>{let v=c.value.trim();if(!v)return;let d=u.querySelector("#ce-cat").value,m=u.querySelector("#ce-eq").value,k=s?{...e,name:v,muscle:d,equipment:m}:{id:F(),name:v,muscle:d,category:d,equipment:m,notes:"",isCustom:!0,createdAt:Date.now()};await q("exercises",k),a(),t?.(k),s||H("data:changed")}),s||setTimeout(()=>c.focus(),50)}})}function Mo(){let t=[["AC","clear","fn"],["\xB1","sign","fn"],["\u232B","back","fn"],["\xF7","op","op"],["7","digit"],["8","digit"],["9","digit"],["\xD7","op","op"],["4","digit"],["5","digit"],["6","digit"],["\u2212","op","op"],["1","digit"],["2","digit"],["3","digit"],["+","op","op"],["0","digit","zero"],[".","dot"],["=","equals","op"]].map(([s,o,n])=>`<button class="calc-key${n?` calc-${n}`:""}" data-action="${o}" data-key="${S(s)}">${S(s)}</button>`).join("");W({html:`
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
    `,onMount(s,o){let n=s.querySelector("#calc-expr"),i=s.querySelector("#calc-result"),r={"+":(l,w)=>l+w,"\u2212":(l,w)=>l-w,"\xD7":(l,w)=>l*w,"\xF7":(l,w)=>w===0?NaN:l/w},a=l=>l==="+"||l==="\u2212"||l==="\xD7"||l==="\xF7",u=l=>{if(!isFinite(l))return"Error";let w=parseFloat(l.toFixed(8)).toString();return w.replace("-","").replace(".","").length>12&&(w=l.toPrecision(10).replace(/\.?0+$/,"")),w},c=["0"],p=!1,v=!1,d="",m=()=>c[c.length-1];function k(){n.textContent=v?"":d,i.textContent=v?"Error":c.join(" ");let l=!v&&a(m())?m():null;for(let w of s.querySelectorAll(".calc-op"))w.classList.toggle("selected",w.dataset.key===l)}function E(l){if(v&&(c=["0"],v=!1),p)return c=[l],p=!1,k();a(m())?c.push(l):c[c.length-1]=m()==="0"?l:m()+l,k()}function y(){if(v&&(c=["0"],v=!1),p)return c=["0."],p=!1,k();a(m())?c.push("0."):m().includes(".")||(c[c.length-1]=m()+"."),k()}function h(l){v||(p=!1,a(m())?c[c.length-1]=l:c.push(l),k())}function M(){c=["0"],p=!1,v=!1,k()}function x(){if(v||a(m()))return;let l=m();c[c.length-1]=l.startsWith("-")?l.slice(1):l==="0"?"0":"-"+l,k()}function $(){if(v)return M();if(p=!1,a(m()))return c.pop(),k();let l=m().slice(0,-1);l===""||l==="-"?c.length>1?c.pop():c=["0"]:c[c.length-1]=l,k()}function A(){if(v)return;let l=c.slice();if(a(l[l.length-1])&&l.pop(),l.length<3)return;let w=parseFloat(l[0]);for(let g=1;g<l.length;g+=2)if(w=r[l[g]](w,parseFloat(l[g+1])),!isFinite(w))return v=!0,k();d=`${l.join(" ")} =`,c=[u(w)],p=!0,k()}function B(l){let{action:w,key:g}=l.dataset;w!=="equals"&&(d=""),w==="digit"?E(g):w==="dot"?y():w==="clear"?M():w==="sign"?x():w==="back"?$():w==="op"?h(g):w==="equals"&&A()}let f=null;for(let l of s.querySelectorAll(".calc-key"))l.addEventListener("pointerdown",w=>{w.preventDefault(),f=l,l.classList.add("pressed")}),l.addEventListener("pointerup",w=>{w.preventDefault(),l.classList.remove("pressed"),f===l&&B(l),f=null}),l.addEventListener("pointercancel",()=>{l.classList.remove("pressed"),f=null}),l.addEventListener("pointerleave",()=>l.classList.remove("pressed"));s.querySelector("#calc-done").addEventListener("click",()=>o())}})}function $e(){let e=window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===!0,t;e?t=Math.max(window.innerHeight||0,window.visualViewport?.height||0,window.screen?.height||0):t=window.visualViewport?.height||window.innerHeight,document.documentElement.style.setProperty("--app-height",`${t}px`)}$e();window.addEventListener("resize",$e);window.addEventListener("orientationchange",$e);window.addEventListener("pageshow",$e);window.visualViewport?.addEventListener("resize",$e);var bs={workout:{title:"Workout",render:ws},exercises:{title:"Exercises",render:Gt},progress:{title:"Progress",render:zt}},xe=document.getElementById("view-content"),Eo=document.getElementById("nav-title"),ks=document.getElementById("nav-back"),G=document.getElementById("nav-action"),Se="workout",pt=null,Ve=null,ze=null,je={container:xe,setTitle(e){Eo.textContent=e},setAction(e){if(!e){G.hidden=!0,G.innerHTML="",G.removeAttribute("aria-label"),Ve=null;return}G.hidden=!1,e.label?G.setAttribute("aria-label",e.label):G.removeAttribute("aria-label"),e.html?G.innerHTML=e.html:G.textContent=e.label??"",Ve=e.onClick},setBack(e){pt=e,ks.hidden=!e},refresh(){Me(Se)},toast(e){I(e)}};function Lo(){if(typeof ze=="function")try{ze()}catch(e){console.error(e)}ze=null}function Me(e){Se=e,Tt(e),document.querySelectorAll(".tab").forEach(t=>{t.setAttribute("aria-selected",String(t.dataset.tab===e))}),Lo(),je.setTitle(bs[e].title),je.setAction(null),je.setBack(null),xe.innerHTML="",xe.scrollTop=0;try{ze=bs[e].render(je)}catch(t){console.error("Render failed",t),xe.innerHTML=`<div class="empty-state"><div class="empty-icon">!</div><h2>Render error</h2><p>${S(t.message)}</p></div>`}}document.querySelectorAll(".tab").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll(".sheet-backdrop").forEach(t=>t.dismissSheet?.()),Me(e.dataset.tab)})});ks.addEventListener("click",()=>{pt&&pt()});G.addEventListener("click",()=>{Ve&&Ve()});Ge("data:changed",()=>{oe(),Me(Se)});Ge("workout:changed",()=>{oe(),Se==="workout"&&Me(Se)});document.addEventListener("visibilitychange",()=>{document.visibilityState==="visible"&&oe()});async function Do(){try{await j();let e=await Lt();e>0&&console.info(`Seeded ${e} exercises.`),await Pt(),Me("workout"),oe()}catch(e){console.error("Init failed:",e),xe.innerHTML=`
      <div class="empty-state">
        <div class="empty-icon">!</div>
        <h2>Storage unavailable</h2>
        <p>${S(e.message??String(e))}</p>
        <p>If you are running this from a <code>file://</code> URL, serve it through a local web server instead.</p>
      </div>`}}Do();
