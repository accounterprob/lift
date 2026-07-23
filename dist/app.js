var is="lift";var it=["exercises","workouts","sets","stateOfMind","medications","doseEvents"],$e=null;function j(){return $e?Promise.resolve($e):new Promise((e,t)=>{let s=indexedDB.open(is,4);s.onerror=()=>t(s.error),s.onsuccess=()=>{$e=s.result,e($e)},s.onupgradeneeded=()=>{let o=s.result;if(!o.objectStoreNames.contains("exercises")){let n=o.createObjectStore("exercises",{keyPath:"id"});n.createIndex("name","name",{unique:!1}),n.createIndex("category","category",{unique:!1})}if(o.objectStoreNames.contains("workouts")||o.createObjectStore("workouts",{keyPath:"id"}).createIndex("startedAt","startedAt",{unique:!1}),!o.objectStoreNames.contains("sets")){let n=o.createObjectStore("sets",{keyPath:"id"});n.createIndex("workoutId","workoutId",{unique:!1}),n.createIndex("exerciseId","exerciseId",{unique:!1})}if(o.objectStoreNames.contains("stateOfMind")||o.createObjectStore("stateOfMind",{keyPath:"id"}).createIndex("date","date",{unique:!1}),o.objectStoreNames.contains("medications")||o.createObjectStore("medications",{keyPath:"id"}),!o.objectStoreNames.contains("doseEvents")){let n=o.createObjectStore("doseEvents",{keyPath:"id"});n.createIndex("medicationId","medicationId",{unique:!1}),n.createIndex("date","date",{unique:!1})}}})}function de(e){return new Promise((t,s)=>{e.onsuccess=()=>t(e.result),e.onerror=()=>s(e.error)})}async function ue(e,t="readonly"){return(await j()).transaction(e,t).objectStore(e)}function ee(e,t,s){return new Promise((o,n)=>{let r=e.transaction(t,"readwrite"),i;try{i=s(r)}catch(a){try{r.abort()}catch{}n(a);return}r.oncomplete=()=>o(i),r.onerror=()=>n(r.error),r.onabort=()=>n(r.error)})}async function B(e){return de((await ue(e)).getAll())}async function pe(e,t){return de((await ue(e)).get(t))}async function R(e,t){return await de((await ue(e,"readwrite")).put(t)),t}async function U(e,t){let s=await j();return ee(s,e,o=>{let n=o.objectStore(e);for(let r of t)n.put(r)})}async function Me(e,t){return de((await ue(e,"readwrite")).delete(t))}async function Ne(e,t){if(t.length===0)return;let s=await j();return ee(s,e,o=>{let n=o.objectStore(e);for(let r of t)n.delete(r)})}async function Ee(e,t,s){let o=await ue(e);return de(o.index(t).getAll(s))}async function at(e){let t=await j();return ee(t,it,s=>{for(let o of it){let n=s.objectStore(o);n.clear();for(let r of e[o]??[])n.put(r)}})}function X(e){let t=new Set;for(let s of e)s.completed&&t.add(s.workoutId);return e.filter(s=>s.completed||!t.has(s.workoutId))}async function ie(){return(await B("workouts")).find(t=>!t.endedAt)??null}async function J(){return(await B("workouts")).filter(t=>t.endedAt).sort((t,s)=>s.startedAt-t.startedAt)}async function ct(e){return(await Ee("sets","workoutId",e)).sort((s,o)=>s.order-o.order)}async function as(e){return await Ee("sets","exerciseId",e)}async function lt(e,t=null){let s=await as(e),o=new Map;for(let i of s)t&&i.workoutId===t||(o.has(i.workoutId)||o.set(i.workoutId,[]),o.get(i.workoutId).push(i));if(o.size===0)return[];let r=(await Promise.all(Array.from(o.keys()).map(i=>pe("workouts",i)))).filter(Boolean).sort((i,a)=>(a.startedAt??0)-(i.startedAt??0));return r.length===0?[]:o.get(r[0].id).sort((i,a)=>i.order-a.order)}function dt(e,t,s=null){let o=new Map(t.map(i=>[i.id,i.startedAt??0])),n=new Map;for(let i of e){if(i.workoutId===s||!o.has(i.workoutId)||(i.weight||0)<=0||(i.reps||0)<=0)continue;let a=n.get(i.exerciseId);a||n.set(i.exerciseId,a=new Map);let u=a.get(i.workoutId);u||a.set(i.workoutId,u=[]),u.push(i)}let r=new Map;for(let[i,a]of n){let u=[...a.keys()].sort((v,S)=>o.get(S)-o.get(v)),l=new Map;for(let v of u){let S=a.get(v).sort((M,h)=>M.order-h.order),d=S.every(M=>M.setType==null),f=0,b=0;S.forEach((M,h)=>{if(d){let k=`any#${h+1}`;l.has(k)||l.set(k,M);return}let m=M.setType||"working",$=m==="warmup"?b+=1:f+=1,x=`${m}#${$}`;l.has(x)||l.set(x,M)})}r.set(i,l)}return r}var cs={barbell:"Barbell",dumbbell:"Dumbbell",machine:"Machine",cable:"Cable",bodyweight:"Bodyweight",kettlebell:"Kettlebell",band:"Bands",bands:"Bands"},ls=/\s*\((barbell|dumbbell|machine|cable|bodyweight|kettlebell|bands?)\)$|\s+(Machine|Barbell|Dumbbell|Cable|Kettlebell)$/i;async function ds(e,t){let s=await j(),o=await Ee("sets","exerciseId",e);return ee(s,["sets","exercises"],n=>{let r=n.objectStore("sets");for(let i of o)r.put({...i,exerciseId:t});return n.objectStore("exercises").delete(e),o.length})}async function ut(){let e=await B("exercises"),t=e.filter(r=>/butterfly/i.test(r.name||""));if(t.length===0)return 0;let s=e.filter(r=>/chest fly/i.test(r.name||"")&&!t.some(i=>i.id===r.id)),o=s.find(r=>(r.equipment||"")==="Machine")||s[0],n=0;for(let r of t)o?n+=await ds(r.id,o.id):await R("exercises",{...r,name:"Chest Fly",equipment:"Machine"});return n}async function pt(){let e=await B("exercises"),t=[];for(let s of e){let o=(s.name||"").match(ls);if(!o)continue;let n=s.name.slice(0,o.index).trim();if(!n||/smith$/i.test(n))continue;let r=(o[1]||o[2]).toLowerCase();t.push({...s,name:n,equipment:cs[r]||s.equipment})}return t.length>0&&await U("exercises",t),t.length}async function ft(){let[e,t,s]=await Promise.all([B("exercises"),B("sets"),B("workouts")]),o=new Set(e.filter(l=>l.category==="Cardio").map(l=>l.id));if(o.size===0)return{exercises:0,sets:0,workouts:0};let n=t.filter(l=>o.has(l.exerciseId)),r=new Map;for(let l of t)o.has(l.exerciseId)||r.set(l.workoutId,(r.get(l.workoutId)||0)+1);let i=new Set(n.map(l=>l.workoutId)),a=s.filter(l=>i.has(l.id)&&!r.get(l.id)),u=await j();return await ee(u,["exercises","sets","workouts"],l=>{let v=l.objectStore("exercises"),S=l.objectStore("sets"),d=l.objectStore("workouts");for(let f of o)v.delete(f);for(let f of n)S.delete(f.id);for(let f of a)d.delete(f.id)}),{exercises:o.size,sets:n.length,workouts:a.length}}async function mt(e){let[t,s,o]=await Promise.all([B("exercises"),B("sets"),B("workouts")]),n=t.filter(d=>d.category==="Other");if(n.length===0)return{recategorized:0,deleted:0,workouts:0};let r=[],i=new Set;for(let d of n){let f=e(d.name);f==="Cardio"?i.add(d.id):r.push({...d,category:f&&f!=="Other"?f:"Full Body"})}let a=s.filter(d=>i.has(d.exerciseId)),u=new Map;for(let d of s)i.has(d.exerciseId)||u.set(d.workoutId,(u.get(d.workoutId)||0)+1);let l=new Set(a.map(d=>d.workoutId)),v=o.filter(d=>l.has(d.id)&&!u.get(d.id)),S=await j();return await ee(S,["exercises","sets","workouts"],d=>{let f=d.objectStore("exercises"),b=d.objectStore("sets"),M=d.objectStore("workouts");for(let h of r)f.put(h);for(let h of i)f.delete(h);for(let h of a)b.delete(h.id);for(let h of v)M.delete(h.id)}),{recategorized:r.length,deleted:i.size,workouts:v.length}}async function Le(e){let t=await j(),s=await Ee("sets","workoutId",e);return ee(t,["workouts","sets"],o=>{o.objectStore("workouts").delete(e);let n=o.objectStore("sets");for(let r of s)n.delete(r.id)})}var te=()=>crypto&&crypto.randomUUID?crypto.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,e=>{let t=Math.random()*16|0;return(e==="x"?t:t&3|8).toString(16)});function fe(e){return e==null?"0":Math.abs(e-Math.round(e))<.001?String(Math.round(e)):e.toFixed(1)}function me(e){return`${fe(e)} lbs`}function ht(e){let t=Math.max(0,Math.floor(e)),s=Math.floor(t/3600),o=Math.floor(t%3600/60),n=t%60;return s>0?`${s}:${String(o).padStart(2,"0")}:${String(n).padStart(2,"0")}`:`${o}:${String(n).padStart(2,"0")}`}function Ve(e){let t=Math.max(0,Math.floor(e)),s=Math.floor(t/3600),o=Math.floor(t%3600/60);return s>0?`${s}h ${o}m`:`${o}m`}function Y(e){return Math.round(e).toLocaleString()}function ae(e){return`${Y(e)} lbs`}function K(e){return(e instanceof Date?e:new Date(e)).toLocaleDateString(void 0,{month:"numeric",day:"numeric",year:"2-digit"})}function vt(e){return(e instanceof Date?e:new Date(e)).toLocaleDateString(void 0,{weekday:"short",month:"short",day:"numeric",year:"numeric"})}function Ue(e,t=200){let s=null;return(...o)=>{clearTimeout(s),s=setTimeout(()=>e(...o),t)}}function L(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function I(e,t=1800,s={}){let o=document.querySelector(".toast");o&&o.remove();let n=document.createElement("div");n.className="toast",n.textContent=e,s.persistUntilClick?(n.classList.add("toast-clickable"),n.addEventListener("click",()=>n.remove())):setTimeout(()=>n.remove(),t),document.body.appendChild(n)}var ze=new EventTarget;function H(e,t){ze.dispatchEvent(new CustomEvent(e,{detail:t}))}function Ye(e,t){return ze.addEventListener(e,t),()=>ze.removeEventListener(e,t)}function F({html:e,onMount:t}){let s=document.createElement("div");s.className="sheet-backdrop",s.innerHTML='<div class="sheet"></div>';let o=s.querySelector(".sheet");o.innerHTML=e;let n=us();document.body.appendChild(s);function r(){let u=window.visualViewport;if(!u){o.style.maxHeight=`${window.innerHeight-n-10}px`;return}let l=Math.max(window.innerHeight,document.documentElement.clientHeight),v=Math.max(0,l-u.height-u.offsetTop);v>0?(o.style.paddingBottom=`${v}px`,o.style.maxHeight=`${u.height-n-10+v}px`):(o.style.paddingBottom="",o.style.maxHeight=`${u.height-n-10}px`)}r();let i=window.visualViewport;i?.addEventListener("resize",r),i?.addEventListener("scroll",r);function a(){s.remove(),i?.removeEventListener("resize",r),i?.removeEventListener("scroll",r)}return s.dismissSheet=a,s.addEventListener("click",u=>{u.target===s&&a()}),t?.(o,a),a}function us(){let e=document.createElement("div");e.style.cssText="position:fixed;top:0;left:0;width:0;height:env(safe-area-inset-top);",document.body.appendChild(e);let t=e.offsetHeight||0;return e.remove(),t}function De(){return'<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" style="color: var(--red);"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>'}function wt(){return'<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M16 5l-1.42 1.42-1.59-1.59V16h-2V4.83L9.41 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z"/></svg>'}function _(e){return`<div class="empty-state"><div class="empty-icon">!</div><h2>Couldn't load</h2><p>${L(e.message||String(e))}</p></div>`}var he=["Pectorals","Anterior Deltoid","Lateral Deltoid","Posterior Deltoid","Triceps","Biceps","Forearms","Lats","Upper Back","Lower Back","Traps","Quadriceps","Hamstrings","Glutes","Adductors","Abductors","Calves","Abs","Obliques"];function ps(e){let t=new Map(he.map((s,o)=>[s,o]));return[...e].sort((s,o)=>(t.get(s)??999)-(t.get(o)??999)||s.localeCompare(o))}var Be=["Barbell","Dumbbell","Machine","Cable","Bodyweight","Other"];function G(e){let t=e?.equipment,s=e?.name??"";return t&&t!=="Other"?`${s} (${t})`:s}function se(e){let t=e?[e.equipment,W(e)].filter(Boolean).join(" \xB7 "):"";return`
    <div class="row-main">
      <div class="row-title">${L(e?.name??"Unknown exercise")}</div>
      ${t?`<div class="row-subtitle">${L(t)}</div>`:""}
    </div>
  `}function oe(e){return e?`<div class="exercise-count">${e} ${e===1?"set":"sets"}</div>`:""}function Ae(e,t){return["All",...ps(new Set(e.map(o=>W(o))))].map(o=>`<button class="chip${o==="All"&&!t||o===t?" active":""}" data-cat="${L(o)}">${L(o)}</button>`).join("")}var fs=[["Bench Press (Barbell)","Chest","Barbell"],["Bench Press (Dumbbell)","Chest","Dumbbell"],["Incline Bench Press (Barbell)","Chest","Barbell"],["Incline Bench Press (Dumbbell)","Chest","Dumbbell"],["Decline Bench Press (Barbell)","Chest","Barbell"],["Chest Fly (Dumbbell)","Chest","Dumbbell"],["Chest Fly (Machine)","Chest","Machine"],["Cable Crossover","Chest","Cable"],["Push-Up","Chest","Bodyweight"],["Dip (Chest)","Chest","Bodyweight"],["Deadlift (Conventional)","Back","Barbell"],["Deadlift (Sumo)","Back","Barbell"],["Romanian Deadlift","Back","Barbell"],["Bent-Over Row (Barbell)","Back","Barbell"],["Pendlay Row","Back","Barbell"],["Row (Dumbbell)","Back","Dumbbell"],["T-Bar Row","Back","Barbell"],["Seated Cable Row","Back","Cable"],["Lat Pulldown","Back","Cable"],["Pull-Up","Back","Bodyweight"],["Chin-Up","Back","Bodyweight"],["Face Pull","Back","Cable"],["Shrug (Barbell)","Back","Barbell"],["Shrug (Dumbbell)","Back","Dumbbell"],["Overhead Press (Barbell)","Shoulders","Barbell"],["Overhead Press (Dumbbell)","Shoulders","Dumbbell"],["Seated Shoulder Press (Machine)","Shoulders","Machine"],["Arnold Press","Shoulders","Dumbbell"],["Lateral Raise (Dumbbell)","Shoulders","Dumbbell"],["Lateral Raise (Cable)","Shoulders","Cable"],["Front Raise (Dumbbell)","Shoulders","Dumbbell"],["Rear Delt Fly (Dumbbell)","Shoulders","Dumbbell"],["Reverse Pec Deck","Shoulders","Machine"],["Upright Row","Shoulders","Barbell"],["Barbell Curl","Biceps","Barbell"],["Dumbbell Curl","Biceps","Dumbbell"],["Hammer Curl","Biceps","Dumbbell"],["Preacher Curl","Biceps","Barbell"],["Incline Dumbbell Curl","Biceps","Dumbbell"],["Cable Curl","Biceps","Cable"],["Concentration Curl","Biceps","Dumbbell"],["Close-Grip Bench Press","Triceps","Barbell"],["Tricep Pushdown (Cable)","Triceps","Cable"],["Overhead Tricep Extension (Dumbbell)","Triceps","Dumbbell"],["Overhead Tricep Extension (Cable)","Triceps","Cable"],["Skull Crusher","Triceps","Barbell"],["Dip (Tricep)","Triceps","Bodyweight"],["Tricep Kickback","Triceps","Dumbbell"],["Back Squat","Legs","Barbell"],["Front Squat","Legs","Barbell"],["Goblet Squat","Legs","Dumbbell"],["Bulgarian Split Squat","Legs","Dumbbell"],["Lunge","Legs","Dumbbell"],["Leg Press","Legs","Machine"],["Leg Extension","Legs","Machine"],["Leg Curl (Seated)","Legs","Machine"],["Leg Curl (Lying)","Legs","Machine"],["Hip Thrust (Barbell)","Glutes","Barbell"],["Glute Bridge","Glutes","Bodyweight"],["Cable Kickback","Glutes","Cable"],["Hip Abduction (Machine)","Glutes","Machine"],["Standing Calf Raise","Calves","Machine"],["Seated Calf Raise","Calves","Machine"],["Plank","Core","Bodyweight"],["Hanging Leg Raise","Core","Bodyweight"],["Cable Crunch","Core","Cable"],["Russian Twist","Core","Bodyweight"],["Ab Wheel Rollout","Core","Other"],["Wrist Curl","Forearms","Dumbbell"],["Reverse Wrist Curl","Forearms","Dumbbell"],["Farmer's Carry","Forearms","Dumbbell"]];function W(e){if(e?.muscle)return e.muscle;let t=(e?.name||"").toLowerCase();return t?/romanian deadlift|\brdl\b|stiff.?leg|good morning|nordic|hamstring/.test(t)||/leg curl/.test(t)?"Hamstrings":/leg extension|sissy squat/.test(t)?"Quadriceps":/calf|tib raise|tibialis/.test(t)?"Calves":/hip adduction|adductor|inner thigh|copenhagen/.test(t)?"Adductors":/hip abduction|abductor|outer thigh|clamshell/.test(t)?"Abductors":/hip thrust|glute|cable kickback|donkey kick|rear kick|frog pump/.test(t)?"Glutes":/squat|leg press|lunge|step.?up/.test(t)?"Quadriceps":/back extension|hyperextension|superman/.test(t)||/deadlift|rack pull/.test(t)?"Lower Back":/lateral raise|side raise|side delt|\blat raise\b|upright row/.test(t)?"Lateral Deltoid":/rear delt|reverse fly|reverse flye|face pull|reverse pec deck/.test(t)?"Posterior Deltoid":/front raise|shoulder press|overhead press|arnold|military press|landmine press|push press|viking press/.test(t)?"Anterior Deltoid":/pulldown|pull.?down|pull.?up|chin.?up|pullover|straight.?arm/.test(t)?"Lats":/shrug/.test(t)?"Traps":/tricep|pushdown|skull ?crusher|close.?grip bench|jm press|french press|bench dip/.test(t)?"Triceps":/wrist curl|reverse curl|forearm|farmer|gripper|dead hang/.test(t)?"Forearms":/bicep|\bcurl\b/.test(t)?"Biceps":/\brow\b|rear pull|high pull/.test(t)?"Upper Back":/bench|chest|\bpec\b|pec deck|crossover|butterfly|push.?up|floor press|squeeze press|\bfly\b|\bflye\b/.test(t)?"Pectorals":/russian twist|woodchop|wood chop|side plank|side bend|oblique|pallof|rotation/.test(t)?"Obliques":/crunch|sit.?up|plank|leg raise|knee raise|ab wheel|ab roll|hanging|toes.?to.?bar|v.?up|dead bug|mountain climber/.test(t)?"Abs":/\bdip\b/.test(t)?"Triceps":e.category||"Other":e?.category||"Other"}var ms=/\b(bike|biking|treadmill|run|running|cardio|step.?mill|elliptical|stair.?master|stair.?climber|jog|jogging|cycling|spinning|spin class|rowing machine|row machine|\berg\b|sprints?|jump.?rope|skipping rope|swim|swimming|hike|hiking)\b/,hs={Quadriceps:"Legs",Hamstrings:"Legs",Adductors:"Legs",Abductors:"Legs",Glutes:"Glutes",Calves:"Calves",Pectorals:"Chest","Anterior Deltoid":"Shoulders","Lateral Deltoid":"Shoulders","Posterior Deltoid":"Shoulders",Lats:"Back","Upper Back":"Back",Traps:"Back","Lower Back":"Back",Biceps:"Biceps",Triceps:"Triceps",Forearms:"Forearms",Abs:"Core",Obliques:"Core"};function gt(e){let t=(e||"").toLowerCase().trim();if(!t)return"Full Body";if(ms.test(t))return"Cardio";let s=W({name:t,category:""});return hs[s]||"Full Body"}async function yt(){if((await B("exercises")).length>0)return 0;let t=Date.now(),s=fs.map(([o,n,r])=>({id:te(),name:o,category:n,equipment:r,notes:"",isCustom:!1,createdAt:t}));return await U("exercises",s),s.length}var bt="workout";function xt(e){bt!==e&&(bt=e,H("tab:changed",e))}var O=["Chest Day","Leg Day","Back/Bi Day"],Te={"Chest Day":{key:"chest",short:"Chest",cssVar:"--day-chest"},"Leg Day":{key:"leg",short:"Legs",cssVar:"--day-leg"},"Back/Bi Day":{key:"back",short:"Back/Bi",cssVar:"--day-back"}};function Ce(e){let t=Te[e];return t?`var(${t.cssVar})`:"var(--text-tertiary)"}function Ke(e){if(!e)return null;let t=e.toLowerCase();return t.includes("chest")?"Chest Day":t.includes("leg")&&!t.includes("curl")&&!t.includes("extension")?"Leg Day":t.includes("back")||t.includes("pull")?"Back/Bi Day":t.includes("push")?"Chest Day":null}function _e(e){for(let t of e){let s=Ke(t.name);if(s)return{name:t.name,normalized:s,startedAt:t.startedAt}}return null}function Ie(e){let t=O.indexOf(e);return t===-1?O[0]:O[(t+1)%O.length]}var vs={Pectorals:"#ec4899",Triceps:"#be185d","Anterior Deltoid":"#831843","Lateral Deltoid":"#f9a8d4",Quadriceps:"#facc15",Hamstrings:"#b45309",Glutes:"#f59e0b",Calves:"#fde68a",Adductors:"#bdb76b",Abductors:"#78350f",Lats:"#2563eb","Upper Back":"#38bdf8",Biceps:"#1e40af","Posterior Deltoid":"#bfdbfe",Traps:"#0891b2","Lower Back":"#475569",Forearms:"#22c55e",Abs:"#ef4444",Obliques:"#14b8a6",Other:"#6b7280"};function kt(e){return vs[e]??"#6b7280"}var ws={Pectorals:"Chest Day",Triceps:"Chest Day","Anterior Deltoid":"Chest Day","Lateral Deltoid":"Chest Day",Quadriceps:"Leg Day",Hamstrings:"Leg Day",Glutes:"Leg Day",Calves:"Leg Day",Adductors:"Leg Day",Abductors:"Leg Day",Lats:"Back/Bi Day","Upper Back":"Back/Bi Day",Biceps:"Back/Bi Day","Posterior Deltoid":"Back/Bi Day",Traps:"Back/Bi Day","Lower Back":"Back/Bi Day",Forearms:"Back/Bi Day"};function gs(e){return ws[e]??null}function ys(e,t,s){let o=Ke(e);if(o)return o;let n=new Map;for(let a of t){let u=s.get(a.exerciseId);if(!u)continue;let l=gs(W(u));if(!l)continue;let v=(a.weight||0)*(a.reps||0);v<=0||n.set(l,(n.get(l)??0)+v)}let r=null,i=0;for(let[a,u]of n)u>i&&(r=a,i=u);return r}function St(e,t,s){let o=[...e].sort((i,a)=>i.startedAt-a.startedAt),n=new Map,r=null;for(let i of o){let a=ys(i.name,t.get(i.id)??[],s);a||(r?Mt(r.startedAt,i.startedAt)?a=r.day:a=Ie(r.day):a=O[0]),n.set(i.id,a),r={day:a,startedAt:i.startedAt}}return n}function $t(e){let t=parseInt(e.slice(1),16);return((t>>16&255)*299+(t>>8&255)*587+(t&255)*114)/1e3>=150?"#1c1c1e":"#ffffff"}function Mt(e,t){let s=new Date(e),o=new Date(t);return s.getFullYear()===o.getFullYear()&&s.getMonth()===o.getMonth()&&s.getDate()===o.getDate()}function bs(e,t){let s=Ke(t?.name);if(s)return s;let o=_e(e);return o?Mt(o.startedAt,Date.now())?o.normalized:Ie(o.normalized):O[0]}var xs="lift-today-day";async function ne(){try{let[e,t]=await Promise.all([J(),ie()]),s=bs(e,t),o=Te[s].key;document.documentElement.dataset.day!==o&&(document.documentElement.dataset.day=o);try{localStorage.setItem(xs,o)}catch{}return s}catch{return null}}var Et="lift-migrations-done-v1";async function Ge(){let e=await ft();e.exercises>0&&console.info(`Removed ${e.exercises} cardio exercise(s), ${e.sets} set(s), ${e.workouts} cardio-only workout(s).`);let t=await mt(gt);if(t.recategorized>0||t.deleted>0){console.info(`Reorganized "Other": recategorized ${t.recategorized}, removed ${t.deleted} cardio, dropped ${t.workouts} empty workout(s).`);let n=[];t.recategorized>0&&n.push(`sorted ${t.recategorized} exercise${t.recategorized===1?"":"s"}`),t.deleted>0&&n.push(`removed ${t.deleted} cardio`),I(`Cleaned up \u201COther\u201D: ${n.join(", ")}.`)}let s=await pt();s>0&&console.info(`Stripped equipment from ${s} exercise name(s).`);let o=await ut();o>0&&I(`Merged Butterfly into Chest Fly (${o} sets moved).`)}async function Lt(){try{if(localStorage.getItem(Et))return}catch{}await Ge();try{localStorage.setItem(Et,String(Date.now()))}catch{}}var qe="lift-backup-passphrase";var Dt="ABCDEFGHJKLMNPQRSTUVWXYZ23456789",Qe=e=>btoa(String.fromCharCode(...new Uint8Array(e))),Xe=e=>Uint8Array.from(atob(e),t=>t.charCodeAt(0));function ks(){let t=[...crypto.getRandomValues(new Uint8Array(20))].map(s=>Dt[s%Dt.length]);return[0,5,10,15].map(s=>t.slice(s,s+5).join("")).join("-")}function Je(){let e=null;try{e=localStorage.getItem(qe)}catch{}if(!e){e=ks();try{localStorage.setItem(qe,e)}catch{}}return e}function Bt(){try{return localStorage.getItem(qe)}catch{return null}}function At(e){try{localStorage.setItem(qe,e)}catch{}}async function Tt(e,t){let s=await crypto.subtle.importKey("raw",new TextEncoder().encode(e),"PBKDF2",!1,["deriveKey"]);return crypto.subtle.deriveKey({name:"PBKDF2",hash:"SHA-256",salt:t,iterations:25e4},s,{name:"AES-GCM",length:256},!1,["encrypt","decrypt"])}function Ct(e){return!!e&&e.lift==="encrypted-backup"&&typeof e.data=="string"}async function It(e,t){let s=crypto.getRandomValues(new Uint8Array(16)),o=crypto.getRandomValues(new Uint8Array(12)),n=await Tt(t,s),r=new TextEncoder().encode(JSON.stringify(e)),i=await crypto.subtle.encrypt({name:"AES-GCM",iv:o},n,r);return{lift:"encrypted-backup",v:1,exportedAt:new Date().toISOString(),kdf:{name:"PBKDF2",hash:"SHA-256",iterations:25e4,salt:Qe(s)},cipher:"AES-GCM",iv:Qe(o),data:Qe(i)}}async function Ze(e,t){let s=Xe(e.kdf.salt),o=Xe(e.iv),n=await Tt(t,s),r;try{r=await crypto.subtle.decrypt({name:"AES-GCM",iv:o},n,Xe(e.data))}catch{throw new Error("Wrong backup password (or the file is damaged).")}return JSON.parse(new TextDecoder().decode(r))}async function Ss(){let[e,t,s,o,n,r]=await Promise.all([B("exercises"),B("workouts"),B("sets"),B("stateOfMind"),B("medications"),B("doseEvents")]);return{version:2,exportedAt:new Date().toISOString(),exercises:e,workouts:t,sets:s,stateOfMind:o,medications:n,doseEvents:r}}function $s(){let e=new Date,t=s=>String(s).padStart(2,"0");return`lift-backup-${e.getFullYear()}${t(e.getMonth()+1)}${t(e.getDate())}-${t(e.getHours())}${t(e.getMinutes())}${t(e.getSeconds())}.json`}async function et(){let e=await Ss(),t=Je(),s=await It(e,t),o=JSON.stringify(s),n=new Blob([o],{type:"application/json"}),r=URL.createObjectURL(n),i=$s(),a=document.createElement("a");return a.href=r,a.download=i,a.style.display="none",document.body.appendChild(a),a.click(),setTimeout(()=>{document.body.removeChild(a),URL.revokeObjectURL(r)},1e3),{filename:i,bytes:n.size,snapshot:e}}async function Ms(e){let t=Bt();if(t)try{return await Ze(e,t)}catch{}for(let s=0;s<3;s++){let o=prompt("Enter your backup password (saved in your Passwords app):");if(o==null)throw new Error("Restore cancelled.");try{let n=await Ze(e,o.trim());return At(o.trim()),n}catch(n){if(s===2)throw n;alert("Wrong password \u2014 try again.")}}}async function Es(e){let t=JSON.parse(await e.text()),s=Ct(t)?await Ms(t):t;if(!s||!Array.isArray(s.exercises)||!Array.isArray(s.workouts)||!Array.isArray(s.sets))throw new Error("File doesn't look like a Lift backup.");return await at({exercises:s.exercises,workouts:s.workouts,sets:s.sets,stateOfMind:s.stateOfMind??[],medications:s.medications??[],doseEvents:s.doseEvents??[]}),await Ge(),{exercises:s.exercises.length,workouts:s.workouts.length,sets:s.sets.length,stateOfMind:(s.stateOfMind??[]).length}}function qt(){let e=Je();F({html:`
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
            <div class="stat-value" id="bk-pass" style="font-variant-numeric: tabular-nums; letter-spacing: 0.5px; color: var(--text); -webkit-user-select: all; user-select: all;">${L(e)}</div>
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
    `,onMount(t,s){t.querySelector("#bk-close").addEventListener("click",()=>s()),t.querySelector("#bk-copy").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(e),I("Password copied \u2014 save it in your Passwords app")}catch{I("Copy failed \u2014 long-press the password to select it")}}),t.querySelector("#bk-export").addEventListener("click",async()=>{try{let{filename:n,bytes:r}=await et();I(`Exported ${n} (${Ls(r)})`)}catch(n){I(`Export failed: ${n.message}`)}});let o=t.querySelector("#bk-file");t.querySelector("#bk-import").addEventListener("click",()=>{o.value="",o.click()}),o.addEventListener("change",async n=>{let r=n.target.files?.[0];if(r&&confirm("Replace all current data with this backup? This cannot be undone."))try{let i=await Es(r);s(),I(`Restored ${i.workouts} workouts, ${i.exercises} exercises`),H("data:changed")}catch(i){I(`Restore failed: ${i.message}`)}})}})}function Ls(e){return e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/(1024*1024)).toFixed(1)} MB`}var Pe=[{key:"1W",tick:"1W",days:7},{key:"1M",tick:"1M",days:30},{key:"3M",tick:"3M",days:90},{key:"1Y",tick:"1Y",days:365},{key:"All",tick:"All",all:!0}];function Ds(e){let t=new Map;for(let s of e){let o=new Date(s.date),n=`${o.getFullYear()}-${o.getMonth()}-${o.getDate()}`,r=t.get(n)||{date:s.date,total:0,count:0};r.total+=s.value,r.count+=1,r.date=Math.min(r.date,s.date),t.set(n,r)}return[...t.values()].map(s=>({date:s.date,value:s.total/s.count})).sort((s,o)=>s.date-o.date)}function ve(e,t,s={}){let o=t.length>0&&t[0].points!==void 0,n=(o?t:[{points:t}]).map(p=>({label:p.label??"",color:p.color||"var(--accent)",points:Ds(p.points)})).filter(p=>p.points.length>0),r=s.defaultPeriod||"All",i=Math.max(0,Pe.findIndex(p=>p.key===r)),a=Pe.length-1,u=null;function l(){let p=Pe[i],c=n.map((y,D)=>u===null||D===u?y.points:[]);if(p.all)return c;let w=Date.now()-p.days*864e5,g=c.map(y=>y.filter(D=>D.date>=w));return g.every(y=>y.length===0)?c.map(y=>y.slice(-1)):g}let v=o&&n.some(p=>p.label)?`<div class="chart-legend">${n.map((p,c)=>`<button class="legend-item" data-i="${c}" style="--dcolor: ${p.color};" aria-pressed="false">${p.label}</button>`).join("")}</div>`:"";e.innerHTML=`
    <div class="chart-scrub-readout" data-role="scrub"></div>
    ${v}
    <div class="chart-container" data-role="chart"></div>
    <div class="chart-daterange" data-role="range"></div>
    <div class="chart-slider">
      <input type="range" class="chart-range" min="0" max="${a}" step="1"
             value="${i}" aria-label="Time range" />
      <div class="chart-slider-ticks">
        ${Pe.map((p,c)=>`<span data-i="${c}">${p.tick}</span>`).join("")}
      </div>
    </div>
  `;let S=e.querySelector('[data-role="scrub"]'),d=e.querySelector('[data-role="chart"]'),f=e.querySelector('[data-role="range"]'),b=e.querySelector(".chart-range"),M=[...e.querySelectorAll(".chart-slider-ticks span")],h=s.unit||"lbs",m=null;function $(){let p=l(),c=Bs(p,n,h);d.innerHTML=c.html,m=c.geom;let w=p.flat();if(w.length>=2){let g=Math.min(...w.map(D=>D.date)),y=Math.max(...w.map(D=>D.date));f.innerHTML=`<span>${tt(g)}</span><span>${tt(y)}</span>`}else f.innerHTML="";M.forEach((g,y)=>g.classList.toggle("active",y===i))}b.addEventListener("input",()=>{i=Number(b.value),A(),$()});let x=[...e.querySelectorAll(".chart-legend .legend-item")];for(let p of x)p.addEventListener("click",()=>{let c=Number(p.dataset.i);u=u===c?null:c,x.forEach((w,g)=>{w.classList.toggle("dimmed",u!==null&&g!==u),w.setAttribute("aria-pressed",String(u===g))}),A(),$()});function k(p){if(!m||m.pts.length<2)return;let c=d.querySelector("svg"),w=c?.getScreenCTM();if(!w)return;let g=new DOMPoint(p,0).matrixTransform(w.inverse()).x,y=0,D=1/0;m.pts.forEach((P,z)=>{let V=Math.abs(P.x-g);V<D&&(D=V,y=z)});let E=m.pts[y],C=c.querySelector(".chart-scrub-line"),q=c.querySelector(".chart-scrub-dot");C&&(C.setAttribute("x1",E.x),C.setAttribute("x2",E.x),C.removeAttribute("visibility")),q&&(q.setAttribute("cx",E.x),q.setAttribute("cy",E.y),q.style.fill=E.color,q.removeAttribute("visibility"));let N=E.label?` \xB7 ${E.label}`:"";S.textContent=`${tt(E.date)}${N} \xB7 ${Math.round(E.value).toLocaleString()} ${h}`}function A(){S.textContent="";let p=d.querySelector("svg");p?.querySelector(".chart-scrub-line")?.setAttribute("visibility","hidden"),p?.querySelector(".chart-scrub-dot")?.setAttribute("visibility","hidden")}let T=!1;d.addEventListener("pointerdown",p=>{T=!0,d.setPointerCapture?.(p.pointerId),k(p.clientX)}),d.addEventListener("pointermove",p=>{T&&k(p.clientX)});for(let p of["pointerup","pointercancel"])d.addEventListener(p,()=>{T=!1,A()});$()}function tt(e){return new Date(e).toLocaleDateString(void 0,{month:"short",day:"numeric",year:"numeric"})}function Bs(e,t,s){let r={top:16,right:14,bottom:14,left:52},i=400-r.left-r.right,a=200-r.top-r.bottom,u=e.flat();if(u.length===0)return{html:`<svg viewBox="0 0 400 200"><text x="${400/2}" y="${200/2}" text-anchor="middle" class="chart-axis-label">No data in range</text></svg>`,geom:null};if(u.length===1){let y=u[0],D=t[e.findIndex(q=>q.length>0)]?.color||"var(--accent)",E=r.left+i/2,C=r.top+a/2;return{html:`<svg viewBox="0 0 400 200"><circle cx="${E}" cy="${C}" r="4" class="chart-point" style="fill: ${D};"/><text x="${E}" y="${C-10}" text-anchor="middle" class="chart-axis-label">${Math.round(y.value).toLocaleString()} ${s}</text></svg>`,geom:null}}let l=u.map(y=>y.date),v=u.map(y=>y.value),S=Math.min(...l),d=Math.max(...l),f=Math.max(...v),b=Math.min(...v),M=Math.max(f-b,1),h=Math.max(0,b-M*.12),m=f+M*.12,$=y=>r.left+(y-S)/Math.max(d-S,1)*i,x=y=>r.top+a-(y-h)/(m-h)*a,k=4,A=y=>Math.round(y).toLocaleString(),T=Array.from({length:k+1},(y,D)=>{let E=h+(m-h)*D/k,C=x(E);return`<text x="${r.left-6}" y="${C+3}" text-anchor="end" class="chart-axis-label">${A(E)}</text>`}).join(""),p=Array.from({length:k+1},(y,D)=>{let E=r.top+a*D/k;return`<line x1="${r.left}" x2="${400-r.right}" y1="${E}" y2="${E}" class="chart-axis-line"/>`}).join(""),c=[],w=e.map((y,D)=>{let E=t[D],C=y.map(q=>({x:$(q.date),y:x(q.value)}));return y.forEach((q,N)=>c.push({...C[N],date:q.date,value:q.value,label:E.label,color:E.color})),C.length===0?"":C.length===1?`<circle cx="${C[0].x}" cy="${C[0].y}" r="3.5" class="chart-point" style="fill: ${E.color};"/>`:`<path d="${As(C)}" class="chart-line" style="stroke: ${E.color};"/>`}).join("");return{html:`
    <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet">
      ${p}
      ${T}
      ${w}
      <line class="chart-scrub-line" y1="${r.top}" y2="${r.top+a}" x1="0" x2="0" visibility="hidden"/>
      <circle class="chart-scrub-dot" r="4.5" visibility="hidden"/>
    </svg>
  `,geom:{pts:c}}}function As(e){if(e.length<2)return"";let t=`M ${e[0].x.toFixed(1)} ${e[0].y.toFixed(1)}`;for(let s=0;s<e.length-1;s++){let o=e[s===0?0:s-1],n=e[s],r=e[s+1],i=e[s+2]||r,a=n.x+(r.x-o.x)/6,u=n.y+(r.y-o.y)/6,l=r.x-(i.x-n.x)/6,v=r.y-(i.y-n.y)/6;t+=` C ${a.toFixed(1)} ${u.toFixed(1)}, ${l.toFixed(1)} ${v.toFixed(1)}, ${r.x.toFixed(1)} ${r.y.toFixed(1)}`}return t}var Rt=e=>typeof e=="number"?e:Date.parse(e);async function Wt(e){let t=JSON.parse(await e.text());if(!t||t.lift!=="health-import")throw new Error("Not a Lift health-import file.");let s=Ts(t.stateOfMind),o=Cs(t.medications),n=qs(t.doseEvents);return s.length&&await U("stateOfMind",s),o.length&&await U("medications",o),n.length&&await U("doseEvents",n),{stateOfMind:s.length,medications:o.length,doseEvents:n.length}}function Ts(e){return(e??[]).filter(t=>t&&t.id!=null).map(t=>({id:String(t.id),kind:t.kind==="dailyMood"?"dailyMood":"momentaryEmotion",date:Rt(t.date)||0,valence:Ps(t.valence),labels:Array.isArray(t.labels)?t.labels:[],associations:Array.isArray(t.associations)?t.associations:[]}))}function Cs(e){return(e??[]).filter(t=>t&&t.id!=null).map(t=>({id:String(t.id),nickname:t.nickname??"",isArchived:!!t.isArchived,hasSchedule:!!t.hasSchedule,concept:{identifier:t.concept?.identifier??"",displayText:t.concept?.displayText??t.nickname??"Medication",form:t.concept?.form??"",rxnorm:Array.isArray(t.concept?.rxnorm)?t.concept.rxnorm:[]}}))}var Is=new Set(["taken","skipped","snoozed","notInteracted"]);function qs(e){return(e??[]).filter(t=>t&&t.id!=null).map(t=>({id:String(t.id),medicationId:t.medicationId!=null?String(t.medicationId):"",status:Is.has(t.status)?t.status:"notInteracted",date:Rt(t.date)||0,scheduledQuantity:Number(t.scheduledQuantity)||0,doseQuantity:Number(t.doseQuantity)||0}))}function Ps(e){let t=Number(e);return isFinite(t)?Math.max(-1,Math.min(1,t)):0}async function Ft(){let[e,t,s]=await Promise.all([B("stateOfMind"),B("medications"),B("doseEvents")]);return e.sort((o,n)=>o.date-n.date),s.sort((o,n)=>o.date-n.date),{stateOfMind:e,medications:t,doseEvents:s}}var Pt=e=>{let t=new Date(e);return`${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`},Ht=e=>e.length?e.reduce((t,s)=>t+s,0)/e.length:null;function Ot(e,t){let s=new Set(t.map(a=>Pt(a.startedAt))),o=[],n=[];for(let a of e)(s.has(Pt(a.date))?o:n).push(a.valence);let r=Ht(o),i=Ht(n);return{onWorkout:r,offWorkout:i,delta:r!=null&&i!=null?r-i:null,onCount:o.length,offCount:n.length}}function jt(e,t){let s=new Map;for(let o of t){if(o.status!=="taken"&&o.status!=="skipped")continue;let n=s.get(o.medicationId)??{taken:0,total:0};n.total+=1,o.status==="taken"&&(n.taken+=1),s.set(o.medicationId,n)}return e.map(o=>{let n=s.get(o.id)??{taken:0,total:0};return{medication:o,taken:n.taken,total:n.total,pct:n.total?n.taken/n.total:null}})}async function st(e,t){e.setTitle("Mental Health"),e.setBack(t),e.setAction(null);let[{stateOfMind:s,medications:o,doseEvents:n},r]=await Promise.all([Ft(),J()]),i=s.length||o.length;e.container.innerHTML=`
    <div class="section">Apple Health</div>
    <div class="form-section">
      <button class="list-row button" id="hz-import">
        <div class="row-main"><div class="row-title" style="color: var(--accent);">Import Health data\u2026</div></div>
      </button>
    </div>
    <div class="section-footer">
      Reads a <b>health-import</b> JSON file exported from Apple Health (Lift can't
      read Health directly). Re-importing updates existing entries.
    </div>
    ${i?Rs(s,o,n,r):Hs()}
    <input type="file" id="hz-file" accept=".json,application/json" style="display: none;" />
  `,e.container.scrollTop=0;let a=e.container.querySelector("#hz-file");e.container.querySelector("#hz-import").addEventListener("click",()=>{a.value="",a.click()}),a.addEventListener("change",async u=>{let l=u.target.files?.[0];if(l)try{let v=await Wt(l);I(`Imported ${v.stateOfMind} moods, ${v.medications} meds, ${v.doseEvents} doses`),H("data:changed"),st(e,t)}catch(v){I(`Import failed: ${v.message}`)}})}function Hs(){return`
    <div class="empty-state" style="padding: 40px 24px; min-height: auto;">
      <div class="empty-icon">\u{1F9E0}</div>
      <p style="color: var(--text-secondary); max-width: 300px;">
        No mood or medication data yet. Export it from Apple Health into a
        health-import file, then tap <b>Import Health data</b> above.
      </p>
    </div>`}function Rs(e,t,s,o){let n=Ot(e,o),r=jt(t,s),i=e.length?`
    <div class="section">State of Mind</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Entries</div><div class="stat-value">${e.length.toLocaleString()}</div></div>
      <div class="stat-row"><div class="stat-label">Range</div><div class="stat-value">${K(e[0].date)} \u2013 ${K(e[e.length-1].date)}</div></div>
      <div class="stat-row"><div class="stat-label">Average mood</div><div class="stat-value">${He(Fs(e))}</div></div>
    </div>

    <div class="section">Mood vs. training</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">On workout days</div><div class="stat-value">${n.onWorkout!=null?He(n.onWorkout)+` <span style="color:var(--text-tertiary)">(${n.onCount})</span>`:"\u2014"}</div></div>
      <div class="stat-row"><div class="stat-label">On rest days</div><div class="stat-value">${n.offWorkout!=null?He(n.offWorkout)+` <span style="color:var(--text-tertiary)">(${n.offCount})</span>`:"\u2014"}</div></div>
      <div class="stat-row"><div class="stat-label">Difference</div><div class="stat-value">${n.delta!=null?(n.delta>=0?"+":"")+n.delta.toFixed(2):"\u2014"}</div></div>
    </div>
    <div class="section-footer">A first look. Sleep &amp; daylight correlations come next once the import includes them.</div>

    <div class="section">Recent entries</div>
    <div class="list">
      ${e.slice(-20).reverse().map(Ws).join("")}
    </div>
  `:"",a=t.length?`
    <div class="section">Medications</div>
    <div class="list">
      ${r.map(u=>`
        <div class="list-row">
          <div class="row-main">
            <div class="row-title">${L(u.medication.nickname||u.medication.concept.displayText)}${u.medication.isArchived?' <span style="color:var(--text-tertiary)">(archived)</span>':""}</div>
            <div class="row-subtitle">${L([u.medication.concept.displayText,u.medication.concept.form].filter(Boolean).join(" \xB7 "))}</div>
          </div>
          <div class="row-trailing">${u.pct!=null?Math.round(u.pct*100)+"%":"\u2014"}<br><span style="font-size:12px;color:var(--text-tertiary)">${u.taken}/${u.total} taken</span></div>
        </div>
      `).join("")}
    </div>
    <div class="section-footer">Adherence = taken \xF7 (taken + skipped). Next: dose adherence vs. mood.</div>
  `:"";return i+a}function Ws(e){let t=e.labels.length?e.labels.join(", "):e.kind==="dailyMood"?"Daily mood":"Momentary";return`
    <div class="list-row">
      <div class="row-main">
        <div class="row-title">${L(t)}</div>
        <div class="row-subtitle">${K(e.date)}${e.associations.length?" \xB7 "+L(e.associations.join(", ")):""}</div>
      </div>
      <div class="row-trailing">${He(e.valence)}</div>
    </div>`}function Fs(e){return e.reduce((t,s)=>t+s.valence,0)/e.length}function He(e){let t=e>=.5?"Very pleasant":e>=.15?"Pleasant":e>-.15?"Neutral":e>-.5?"Unpleasant":"Very unpleasant";return`<span style="color: hsl(${Math.round((e+1)/2*140)} 65% 42%); font-weight: 600;">${t}</span>`}var Z=null;function Nt(e){let t=!0;return zt().then(s=>{t&&(Z=s,we(e))}).catch(s=>{t&&(e.container.innerHTML=_(s))}),()=>{t=!1}}async function zt(){let[e,t,s]=await Promise.all([J(),B("sets"),B("exercises")]),o=new Map(s.map(b=>[b.id,b])),n=new Map;for(let b of X(t))n.has(b.workoutId)||n.set(b.workoutId,[]),n.get(b.workoutId).push(b);let r=0,i=0,a=new Map,u=new Map,l=new Map,v=St(e,n,o);for(let b of e){let M=n.get(b.id)||[],h=M.reduce((m,$)=>m+$.weight*$.reps,0);if(r+=h,i+=M.length,h>0){let m=v.get(b.id);a.has(m)||a.set(m,[]),a.get(m).push({date:b.startedAt,value:h})}for(let m of M){let $=o.get(m.exerciseId);if(!$)continue;let x=u.get(m.exerciseId)||{id:m.exerciseId,exercise:$,count:0};if(x.count+=1,u.set(m.exerciseId,x),m.weight>0&&m.reps>0){let k=l.get(m.exerciseId);(!k||m.weight>k.weight||m.weight===k.weight&&m.reps>k.reps)&&l.set(m.exerciseId,{id:m.exerciseId,weight:m.weight,reps:m.reps,date:b.startedAt,name:G($)})}}}let S=Array.from(u.entries()).sort((b,M)=>M[1].count-b[1].count).map(([,b])=>b),d=Array.from(l.values()).sort((b,M)=>M.weight-b.weight),f=O.filter(b=>a.has(b)).map(b=>({label:Te[b].short,color:Ce(b),points:a.get(b)}));return{workouts:e,allSets:t,allExercises:s,exMap:o,setsByWorkout:n,totalVolume:r,totalSets:i,volumeSeries:f,topExercises:S,prs:d}}function we(e){if(e.setTitle("Progress"),e.setBack(null),e.setAction({label:"Backup and restore",html:wt(),onClick:()=>qt()}),e.container.scrollTop=0,!Z||Z.workouts.length===0){e.container.innerHTML=`
      <div class="empty-state">
        <div class="empty-icon">\u{1F4C8}</div>
        <h2>No data yet</h2>
        <p>Finish a workout and your stats and trends will show up here.</p>
      </div>
    `;return}let{workouts:t,totalVolume:s,totalSets:o,volumeSeries:n,topExercises:r,prs:i}=Z;e.container.innerHTML=`
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
          <div class="row-subtitle">${r.length} tracked</div>
        </div>
        <div class="chevron">\u203A</div>
      </button>
      <button class="list-row" data-page="prs">
        <div class="row-main">
          <div class="row-title">Personal Records</div>
          <div class="row-subtitle">${i.length} exercises</div>
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
      <button class="list-row" data-page="health">
        <div class="row-main">
          <div class="row-title">Mental Health</div>
          <div class="row-subtitle">Mood &amp; medications from Apple Health</div>
        </div>
        <div class="chevron">\u203A</div>
      </button>
    </div>
  `;let a=e.container.querySelector(".volume-chart-mount");a&&n.length>0&&ve(a,n,{unit:"lbs"});for(let u of e.container.querySelectorAll("[data-page]"))u.addEventListener("click",()=>{let l=u.dataset.page;l==="trained"?Os(e):l==="prs"?js(e):l==="history"?Vt(e):l==="health"&&st(e,()=>we(e)).catch(v=>{e.container.innerHTML=_(v)})})}function Os(e){e.setTitle("Most-Trained"),e.setBack(()=>we(e)),e.setAction(null);let{topExercises:t}=Z;e.container.innerHTML=`
    <div class="list" style="margin-top: 16px;">
      ${t.map(s=>`
        <button class="list-row" data-exercise-id="${L(s.id)}">
          ${se(s.exercise)}
          <div class="row-trailing trailing-stack">${oe(s.count)}</div>
          <div class="chevron">\u203A</div>
        </button>
      `).join("")}
    </div>
  `,e.container.scrollTop=0,ot(e)}function js(e){e.setTitle("Personal Records"),e.setBack(()=>we(e)),e.setAction(null);let{prs:t}=Z;e.container.innerHTML=`
    <div class="section-footer" style="margin-top: 16px;">Heaviest set ever recorded per exercise.</div>
    <div class="list">
      ${t.map(s=>`
        <button class="list-row" data-exercise-id="${L(s.id)}" style="align-items: flex-start;">
          <div class="row-main">
            <div class="row-title">${L(s.name)}</div>
            <div class="row-subtitle">${K(s.date)}</div>
          </div>
          <div class="row-trailing" style="text-align: right;">
            <div style="font-weight: 600; color: var(--text);">${me(s.weight)} lbs</div>
            <div style="font-size: 12px; color: var(--text-tertiary);">${s.reps} rep${s.reps===1?"":"s"}</div>
          </div>
          <div class="chevron">\u203A</div>
        </button>
      `).join("")}
    </div>
  `,e.container.scrollTop=0,ot(e)}function ot(e){for(let t of e.container.querySelectorAll("[data-exercise-id]"))t.addEventListener("click",()=>{Re(t.dataset.exerciseId)})}function Vt(e){e.setTitle("Workout History"),e.setBack(()=>we(e)),e.setAction(null);let{workouts:t,setsByWorkout:s,exMap:o}=Z;e.container.innerHTML=`
    <div class="list" style="margin-top: 16px;">
      ${t.map(n=>Ns(n,s.get(n.id)||[],o)).join("")}
    </div>
  `,e.container.scrollTop=0;for(let n of e.container.querySelectorAll("[data-workout-id]"))n.addEventListener("click",()=>{let r=n.dataset.workoutId;zs(e,r).catch(i=>{e.container.innerHTML=_(i)})})}function Ns(e,t,s){let o=t,n=o.reduce((u,l)=>u+l.weight*l.reps,0),r=(e.endedAt-e.startedAt)/1e3,i=[],a=new Set;for(let u of t){if(a.has(u.exerciseId))continue;a.add(u.exerciseId);let l=s.get(u.exerciseId);if(l&&i.push(l.name),i.length>=3)break}return`
    <button class="list-row" data-workout-id="${e.id}">
      <div class="row-main">
        <div class="row-title" style="font-weight: 600;">${L(e.name)}</div>
        <div class="row-subtitle" style="margin-top: 4px;">
          ${K(e.startedAt)} \xB7 ${Ve(r)} \xB7 ${o.length} sets \xB7 ${ae(n)}
        </div>
        ${i.length>0?`<div class="row-subtitle" style="margin-top: 4px;">${L(i.join(" \xB7 "))}${a.size>3?" \u2026":""}</div>`:""}
      </div>
      <div class="chevron">\u203A</div>
    </button>
  `}async function Ut(e){let[t,s,o]=await Promise.all([pe("workouts",e),B("exercises"),ct(e)]);if(!t)return null;let n=new Map(s.map(d=>[d.id,d])),r=new Map,i=[];for(let d of o)r.has(d.exerciseId)||(r.set(d.exerciseId,[]),i.push(d.exerciseId)),r.get(d.exerciseId).push(d);let a=X(o),u=a.reduce((d,f)=>d+f.weight*f.reps,0),l=a.length,v=(t.endedAt-t.startedAt)/1e3,S=`
    <div class="section">Summary</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Date</div><div class="stat-value">${vt(t.startedAt)}</div></div>
      <div class="stat-row"><div class="stat-label">Duration</div><div class="stat-value">${Ve(v)}</div></div>
      <div class="stat-row"><div class="stat-label">Total Volume</div><div class="stat-value">${ae(u)}</div></div>
      <div class="stat-row"><div class="stat-label">Completed Sets</div><div class="stat-value">${l}</div></div>
    </div>

    ${i.map(d=>{let f=n.get(d),b=r.get(d),M=0,h=0;return`
        ${f?`<button class="section section-link" data-exercise-id="${L(d)}">${L(G(f))}<span class="name-chevron">\u203A</span></button>`:'<div class="section">Unknown exercise</div>'}
        <div class="form-section">
          ${b.map($=>{let k=($.setType||"working")==="warmup"?`W${++h}`:String(++M);return`
              <div class="stat-row">
                <div class="stat-label">Set ${k}</div>
                <div class="stat-value hist-edit">
                  <input class="hist-input" type="number" inputmode="decimal" step="0.5" aria-label="Weight in pounds for set ${k}"
                         data-set-id="${$.id}" data-field="weight" value="${$.weight>0?$.weight:""}" placeholder="0" />
                  <span>lbs \xD7</span>
                  <input class="hist-input" type="number" inputmode="numeric" step="1" aria-label="Repetitions for set ${k}"
                         data-set-id="${$.id}" data-field="reps" value="${$.reps>0?$.reps:""}" placeholder="0" />
                </div>
              </div>
            `}).join("")}
        </div>
      `}).join("")}
  `;return{workout:t,html:S,sets:o}}function Yt(e,t){for(let s of e.querySelectorAll("input.hist-input[data-set-id]"))s.addEventListener("input",async()=>{let o=t.find(n=>n.id===s.dataset.setId);o&&(s.dataset.field==="weight"?o.weight=parseFloat(s.value)||0:o.reps=parseInt(s.value,10)||0,await R("sets",{...o}))})}async function zs(e,t){e.setBack(async()=>{Z=await zt(),Vt(e)}),e.setAction({label:"Delete workout",html:De(),onClick:async()=>{confirm("Delete this workout?")&&(await Le(t),H("data:changed"))}});let s=await Ut(t);if(!s){e.container.innerHTML=_({message:"Workout not found."});return}e.setTitle(s.workout.name),e.container.innerHTML=s.html,e.container.scrollTop=0,ot(e),Yt(e.container,s.sets)}async function Kt(e){let t=await Ut(e);if(!t)return;let s=F({html:`
      <div class="sheet-header">
        <button class="btn-text" id="wd-close">Done</button>
        <div class="title">${L(t.workout.name)}</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">${t.html}</div>
    `,onMount(o){o.querySelector("#wd-close").addEventListener("click",()=>s());for(let n of o.querySelectorAll("[data-exercise-id]"))n.addEventListener("click",()=>Re(n.dataset.exerciseId));Yt(o,t.sets)}})}function _t(e){let t=!0;return Gt(e).catch(s=>{t&&(e.container.innerHTML=_(s))}),()=>{t=!1}}async function Gt(e){e.setTitle("Exercises"),e.setBack(null),e.setAction({label:"Add exercise",html:'<span style="font-size: 24px;">+</span>',onClick:()=>{ge(null)}});let[t,s]=await Promise.all([B("exercises"),B("sets")]),o=t.sort((d,f)=>d.name.localeCompare(f.name)),n=new Map;for(let d of s)n.set(d.exerciseId,(n.get(d.exerciseId)??0)+1);let r="",i=null;e.container.innerHTML=`
    <div class="search-bar">
      <input class="search-input" id="ex-search" placeholder="Search exercises" />
    </div>
    <div class="chip-row" id="ex-chips"></div>
    <div class="list" id="ex-list"></div>
  `,e.container.scrollTop=0;let a=e.container.querySelector("#ex-list"),u=e.container.querySelector("#ex-chips"),l=e.container.querySelector("#ex-search");function v(){u.innerHTML=Ae(o,i);for(let d of u.querySelectorAll(".chip"))d.addEventListener("click",()=>{let f=d.dataset.cat;i=f==="All"?null:f,v(),S()})}function S(){let d=o.filter(f=>!i||W(f)===i).filter(f=>!r||f.name.toLowerCase().includes(r.toLowerCase()));if(d.length===0){a.innerHTML='<div class="list-row"><div class="row-main" style="color: var(--text-secondary);">No matches</div></div>';return}a.innerHTML=d.map(f=>`
        <button class="list-row" data-id="${f.id}">
          ${se(f)}
          <div class="row-trailing trailing-stack">${oe(n.get(f.id)??0)}</div>
          <div class="chevron">\u203A</div>
        </button>
      `).join("");for(let f of a.querySelectorAll("[data-id]"))f.addEventListener("click",()=>{Vs(e,f.dataset.id).catch(b=>{e.container.innerHTML=_(b)})})}l.addEventListener("input",()=>{r=l.value,S()}),v(),S()}function Vs(e,t){return We(e,t,()=>Gt(e))}async function We(e,t,s){e.setBack(s);let o=await Xt(t);if(!o){e.container.innerHTML=_({message:"Exercise not found."});return}e.setTitle(G(o.exercise)),e.setAction(o.exercise.isCustom?{label:"Delete exercise",html:De(),onClick:async()=>{if(o.completed.length>0){alert(`Can't delete \u2014 this exercise has ${o.completed.length} logged set${o.completed.length===1?"":"s"}.`);return}confirm("Delete this custom exercise?")&&(await Me("exercises",t),H("data:changed"))}}:null),e.container.innerHTML=o.html,e.container.scrollTop=0,e.container.querySelector("#exd-edit")?.addEventListener("click",()=>{ge(o.exercise,()=>We(e,t,s))}),Qt(e.container);let n=e.container.querySelector(".exercise-chart-mount");n&&o.chartData.length>0&&ve(n,o.chartData,{unit:"lbs"})}function Qt(e){for(let t of e.querySelectorAll(".recent-set[data-workout-id]"))t.addEventListener("click",()=>Kt(t.dataset.workoutId))}async function Re(e){let t=await Xt(e);if(!t)return;let s=F({html:`
      <div class="sheet-header">
        <button class="btn-text" id="exd-close">Done</button>
        <div class="title">${L(G(t.exercise))}</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">${t.html}</div>
    `,onMount(o){o.querySelector("#exd-close").addEventListener("click",()=>s()),o.querySelector("#exd-edit")?.addEventListener("click",()=>{ge(t.exercise,()=>{s(),H("data:changed"),Re(e)})}),Qt(o);let n=o.querySelector(".exercise-chart-mount");n&&t.chartData.length>0&&ve(n,t.chartData,{unit:"lbs"})}})}async function Xt(e){let[t,s,o,n]=await Promise.all([pe("exercises",e),B("sets"),B("workouts"),ie()]);if(!t)return null;let r=new Map(o.map(d=>[d.id,d])),i=X(s).filter(d=>d.exerciseId===e&&d.workoutId!==n?.id&&r.has(d.workoutId)).map(d=>({...d,workout:r.get(d.workoutId)})).sort((d,f)=>d.workout.startedAt-f.workout.startedAt),a=i.reduce((d,f)=>d+f.weight*f.reps,0),u=i.reduce((d,f)=>!d||f.weight>d.weight||f.weight===d.weight&&f.reps>d.reps?f:d,null),l=new Map;for(let d of i){if(d.weight<=0||d.reps<=0||(d.setType||"working")==="warmup")continue;let f=l.get(d.workoutId)||{date:d.workout.startedAt,total:0,count:0};f.total+=d.weight*d.reps,f.count+=1,l.set(d.workoutId,f)}let v=Array.from(l.values()).map(({date:d,total:f,count:b})=>({date:d,value:f/b})).sort((d,f)=>d.date-f.date),S=`
    <div class="section">Details</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Equipment</div><div class="stat-value">${L(t.equipment)}</div></div>
      <div class="stat-row"><div class="stat-label">Muscle</div><div class="stat-value">${L(W(t))}</div></div>
      <button class="list-row button" id="exd-edit">
        <div class="row-main"><div class="row-title" style="color: var(--accent);">Edit Name, Muscle & Equipment</div></div>
      </button>
    </div>

    ${i.length>0?`
      <div class="section">Stats</div>
      <div class="form-section">
        <div class="stat-row"><div class="stat-label">Total Sets</div><div class="stat-value">${i.length.toLocaleString()}</div></div>
        <div class="stat-row"><div class="stat-label">Total Volume</div><div class="stat-value">${ae(a)}</div></div>
        ${u?`<div class="stat-row"><div class="stat-label">Best Set</div><div class="stat-value">${me(u.weight)} \xD7 ${u.reps}</div></div>`:""}
      </div>
    `:""}

    ${v.length>0?`
      <div class="section">Avg working-set volume per workout</div>
      <div class="exercise-chart-mount"></div>
    `:""}

    ${i.length>0?`
      <div class="section">Recent Sets \xB7 tap to view that workout</div>
      <div class="form-section">
        ${i.slice(-30).reverse().map(d=>`
          <button class="stat-row recent-set" data-workout-id="${L(d.workoutId)}">
            <div class="stat-label" style="font-size: 13px; color: var(--text-secondary);">${K(d.workout.startedAt)}</div>
            <div class="stat-value" style="color: var(--text);">${me(d.weight)} \xD7 ${d.reps} <span class="name-chevron">\u203A</span></div>
          </button>
        `).join("")}
      </div>
    `:`
      <div class="empty-state" style="padding: 32px 24px;">
        <p style="color: var(--text-secondary);">No completed sets yet.</p>
      </div>
    `}
  `;return{exercise:t,completed:i,chartData:v,html:S}}function ts(e){let t=!0,s=null;return e.container.innerHTML="",ie().then(o=>{t&&(o?s=_s(e,o):Us(e))}).catch(o=>{t&&(e.container.innerHTML=`<div class="empty-state"><div class="empty-icon">!</div><h2>Couldn't load</h2><p>${L(o.message)}</p></div>`)}),()=>{t=!1,typeof s=="function"&&s()}}async function Us(e){e.setTitle("Workout");let t=await J(),s=t[0],o=_e(t),n=o?Ie(o.normalized):O[0],i=o&&Jt(o.startedAt)==="today"?"Tomorrow":"Today",a=s?`<div class="last-workout-hint">Last: <strong>${L(s.name)}</strong> \xB7 ${Jt(s.startedAt)}</div>`:"",u=`<div class="next-workout-hint">${i}: <strong>${L(n)}</strong></div>`;e.container.innerHTML=`
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
  `,e.container.querySelector("#start-btn").addEventListener("click",()=>Ys(n,i))}function Jt(e){let t=new Date,s=new Date(e),o=r=>new Date(r.getFullYear(),r.getMonth(),r.getDate()).getTime(),n=Math.round((o(t)-o(s))/(1440*60*1e3));return n===0?"today":n===1?"yesterday":n<7?`${n} days ago`:n<14?"a week ago":`${Math.round(n/7)} weeks ago`}function Ys(e,t="Today"){Ks(e,async s=>{let o={id:te(),name:s,startedAt:Date.now(),endedAt:null,notes:""};await R("workouts",o),H("workout:changed")},t)}function Ks(e,t,s="Today"){let n=F({html:`
      <div class="sheet-header">
        <button class="btn-text" id="wt-cancel">Cancel</button>
        <div class="title">New Workout</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">
        <div class="section">Pick a type</div>
        <div class="form-section">
          ${O.map(r=>{let a=r===e?` <span class="badge">${L(s)}</span>`:"";return`
              <button class="list-row button" data-name="${L(r)}">
                <div class="row-main"><div class="row-title" style="color: ${Ce(r)}; font-weight: 600;">${L(r)}${a}</div></div>
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
    `,onMount(r){r.querySelector("#wt-cancel").addEventListener("click",()=>n());for(let u of r.querySelectorAll(".list-row.button[data-name]"))u.addEventListener("click",()=>{let l=u.dataset.name;n(),t(l)});let i=r.querySelector("#wt-custom"),a=r.querySelector("#wt-go");i.addEventListener("input",()=>{a.disabled=i.value.trim().length===0}),a.addEventListener("click",()=>{let u=i.value.trim();u&&(n(),t(u))}),setTimeout(()=>i.focus(),50)}})}function _s(e,t){let s=[],o=[],n=new Map,r=new Map,i=null;e.container.innerHTML=`
    <div class="active-workout">
      <div class="workout-header">
        <input class="workout-name-input" id="wname" value="${L(t.name)}" placeholder="Workout name" />
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
  `,e.container.querySelector("#calc-fab").addEventListener("click",oo);let a=()=>{e.setTitle(ht((Date.now()-t.startedAt)/1e3))};a(),i=setInterval(a,1e3);let u=e.container.querySelector("#wname");u.addEventListener("input",async()=>{t.name=u.value,await R("workouts",{...t}),ne()});let l=new Map;e.container.querySelector("#add-exercise-btn").addEventListener("click",()=>{to(s,r,async h=>{await Js(t,o,h),await v()})}),e.container.querySelector("#finish-btn").addEventListener("click",async()=>{if(confirm("Finish this workout?")){await eo(t,o);try{let{filename:h}=await et();I(`Saved \xB7 backup: ${h}`)}catch(h){I(`Saved \xB7 backup failed: ${h.message}`)}H("workout:changed")}}),e.container.querySelector("#discard-btn").addEventListener("click",async()=>{confirm("Discard this workout? This cannot be undone.")&&(await Le(t.id),H("workout:changed"))});async function v(){let[h,m,$]=await Promise.all([B("sets"),B("workouts"),B("exercises")]);s=$,o=h.filter(x=>x.workoutId===t.id).sort((x,k)=>x.order-k.order),n=dt(h,m,t.id),l=f(h,$,t.id),r=new Map;for(let x of h)r.set(x.exerciseId,(r.get(x.exerciseId)??0)+1);M(),S()}function S(){let h=new Map(s.map(y=>[y.id,y])),m=[],$=new Map;for(let y of o){let D=h.get(y.exerciseId);if(!D)continue;let E=W(D);if(m.includes(E)||m.push(E),!y.completed)continue;let C=(y.weight||0)*(y.reps||0);C<=0||$.set(E,($.get(E)??0)+C)}let x=[...$.values()].reduce((y,D)=>y+D,0),k=e.container.querySelector("#workout-progress");if(!k)return;if(m.length===0){k.innerHTML="";return}let A=m.map(y=>{let D=l.get(y)??0,E=$.get(y)??0;return{muscle:y,record:D,cur:E,span:Math.max(D,E)}}),T=Math.max(...A.map(y=>y.span)),p=T>0?T*.12:1;A=A.map(y=>({...y,span:Math.max(y.span,p)}));let c=Math.max(...A.map(y=>y.span)),w=A.map(({muscle:y,record:D,cur:E,span:C})=>{let q=C/c*100,N=E>0?Math.min(100,E/C*100):0,P;if(D>0){let ce=Math.round(E/D*100);P=E>D?`${ce}% \u{1F525}`:`${ce}%`}else P=E>0?"new \u{1F525}":"new";let z=D>0?`${Y(E)} / ${Y(D)} \xB7 ${P}`:`${Y(E)} \xB7 ${P}`,V=kt(y);return`
        <div class="vol-muscle" style="width: ${q.toFixed(2)}%; --mcolor: ${V}; --mtext: ${$t(V)};" title="${L(y)}: ${Y(E)} / record ${Y(D)} lbs">
          <div class="vol-fill" style="width: ${N.toFixed(2)}%;"></div>
          <div class="vol-info${N>55?" on-fill":""}">
            <span class="seg-name">${L(y)}</span>
            <span class="seg-vol">${z}</span>
          </div>
        </div>
      `}).join(""),g=`<strong>${Y(x)} lbs</strong> total`;k.innerHTML=`
      <div class="vol-bars">${w}</div>
      <div class="vol-label">${g}</div>
    `,requestAnimationFrame(()=>{for(let y of k.querySelectorAll(".vol-muscle"))d(y)})}function d(h){let m=h.querySelector(".seg-name"),$=h.querySelector(".seg-vol"),x=h.clientWidth-4;if(x<=0)return;if($){let A=10;for($.style.fontSize=`${A}px`;$.scrollWidth>x&&A>6;)A-=.5,$.style.fontSize=`${A}px`}if(!m)return;m.style.display="";let k=11;for(m.style.fontSize=`${k}px`;m.scrollWidth>x&&k>5;)k-=.5,m.style.fontSize=`${k}px`}function f(h,m,$){let x=new Map(m.map(T=>[T.id,T])),k=new Map,A=new Map;for(let T of X(h)){if(T.workoutId===$)continue;let p=x.get(T.exerciseId);if(!p)continue;let c=(T.weight||0)*(T.reps||0);if(c<=0)continue;let w=W(p),g=A.get(T.workoutId);g||A.set(T.workoutId,g=new Map),g.set(w,(g.get(w)??0)+c)}for(let T of A.values())for(let[p,c]of T)c>(k.get(p)??0)&&k.set(p,c);return k}async function b(h){if(!h.completed||(h.setType||"working")==="warmup"||!(h.weight>0)||!(h.reps>0))return;let m=s.find(c=>c.id===h.exerciseId);if(!m)return;let $=await B("sets"),x=X($).filter(c=>c.exerciseId===h.exerciseId&&c.id!==h.id&&(c.setType||"working")!=="warmup"&&c.weight>0&&c.reps>0);if(x.length===0)return;let k=[],A=x.reduce((c,w)=>Math.max(c,w.weight),0);h.weight>A&&k.push(`Heaviest weight ever: ${fe(h.weight)} lbs`);let T=h.weight*h.reps,p=x.reduce((c,w)=>Math.max(c,w.weight*w.reps),0);if(T>p&&k.push(`Most volume in a set: ${fe(h.weight)}\xD7${h.reps} = ${Y(T)} lbs`),k.length>0){let c=k.length>1?"New records":"New record";I(`\u{1F3C6} ${G(m)} \u2014 ${c}!
${k.join(`
`)}`,0,{persistUntilClick:!0})}}function M(){let h=new Map(s.map(p=>[p.id,p])),m=[],$=new Map;for(let p of o)$.has(p.exerciseId)||($.set(p.exerciseId,[]),m.push(p.exerciseId)),$.get(p.exerciseId).push(p);for(let[,p]of $)p.sort((c,w)=>c.order-w.order);let x=e.container.querySelector("#exercise-sections");if(m.length===0){x.innerHTML=`
        <div class="empty-state" style="padding: 40px 24px; min-height: auto;">
          <p style="color: var(--text-secondary);">Add an exercise to start logging sets.</p>
        </div>`;return}x.innerHTML=m.map(p=>{let c=h.get(p),w=$.get(p),g=n.get(p)??new Map;return Gs(c,w,g,r.get(p)??0)}).join("");function k(p){delete p.bumpedBy,delete p.preBumpWeight,delete p.preBumpReps}function A(p){let c=o.filter(E=>E.exerciseId===p.exerciseId).sort((E,C)=>E.order-C.order),w=p.setType||"working",g=0,y=0;for(let E of c)if(y+=1,(E.setType||"working")===w&&(g+=1),E.id===p.id)break;let D=ye(w,g,n.get(p.exerciseId),y);return D&&D.weight>0&&D.reps>0?{weight:D.weight,reps:D.reps}:null}async function T(p){await es(p.id,o),p.completed&&await Zt(p,o,A);for(let c of o){if(c.exerciseId!==p.exerciseId)continue;let w=x.querySelector(`.set-row[data-set-id="${c.id}"]`);if(!w)continue;let g=w.querySelector(".weight-input"),y=w.querySelector(".reps-input");g&&document.activeElement!==g&&(g.value=c.weight>0?String(c.weight):""),y&&document.activeElement!==y&&(y.value=c.reps>0?String(c.reps):"")}}for(let p of x.querySelectorAll(".set-row-wrap")){let c=p.querySelector(".set-row"),w=c.dataset.setId,g=o.find(P=>P.id===w);if(!g)continue;let y=c.querySelector(".weight-input"),D=c.querySelector(".reps-input"),E=c.querySelector(".complete-btn");Xs(p,async()=>{await Me("sets",g.id),await v()});let C=Ue(async()=>{await T(g),g.completed&&S()},200);y.addEventListener("input",()=>{g.weight=parseFloat(y.value)||0,k(g),R("sets",{...g}).catch(P=>console.error("Set save failed",P)),C()});let q=Ue(async()=>{await T(g),g.completed&&S()},200);D.addEventListener("input",()=>{g.reps=parseInt(D.value,10)||0,k(g),R("sets",{...g}).catch(P=>console.error("Set save failed",P)),q()}),E.addEventListener("click",async()=>{let P=g.completed;g.completed=!g.completed,g.completed&&k(g),await R("sets",g),c.classList.toggle("completed",g.completed),E.innerHTML=ss(g.completed);let z=c.querySelector(".set-number")?.textContent?.trim()||"";E.setAttribute("aria-label",`${g.completed?"Mark incomplete":"Mark complete"} set ${z}`),S(),!P&&g.completed?(await Zt(g,o,A)&&M(),await b(g)):P&&!g.completed&&await es(g.id,o)&&M()});let N=c.querySelector(".set-number");N&&N.addEventListener("click",async()=>{let z=(g.setType||"working")==="warmup"?"working":"warmup";if(g.setType=z,!g.completed){let V=o.filter(re=>re.exerciseId===g.exerciseId).sort((re,rs)=>re.order-rs.order),ce=0,rt=0;for(let re of V)if(rt+=1,(re.setType||"working")===z&&(ce+=1),re.id===g.id)break;let le=ye(z,ce,n.get(g.exerciseId),rt);le&&le.weight>0&&le.reps>0&&(g.weight=le.weight,g.reps=le.reps)}await R("sets",g),M()})}for(let p of x.querySelectorAll(".add-set-btn"))p.addEventListener("click",async()=>{let c=p.dataset.exerciseId;await Zs(t,o,c,n.get(c)??new Map),await v()});for(let p of x.querySelectorAll(".exercise-menu"))p.addEventListener("click",async()=>{let c=p.dataset.exerciseId;confirm("Remove this exercise from the workout?")&&(await Ne("sets",o.filter(w=>w.exerciseId===c).map(w=>w.id)),await v())});for(let p of x.querySelectorAll(".exercise-name-btn"))p.addEventListener("click",()=>{i&&(clearInterval(i),i=null),We(e,p.dataset.exerciseId,()=>e.refresh())})}return v(),()=>{i&&clearInterval(i)}}function Gs(e,t,s=new Map,o=0){let n=0,r=0,i=t.map((a,u)=>{let l=a.setType||"working",v,S;l==="warmup"?(r+=1,S=r,v=`W${r}`):(n+=1,S=n,v=String(n));let d=ye(l,S,s,u+1);return Qs(a,v,d)}).join("");return`
    <div class="exercise-section">
      <div class="exercise-section-header">
        <button class="exercise-name-btn" data-exercise-id="${e?.id}">${se(e)}</button>
        <div class="row-trailing trailing-stack">${oe(o)}</div>
        <button class="menu exercise-menu" data-exercise-id="${e?.id}" aria-label="Remove ${L(G(e))} from workout">\xD7</button>
      </div>
      <div class="set-table-header">
        <div class="col-set">SET</div>
        <div>PREV</div>
        <div>LBS</div>
        <div>REPS</div>
        <div></div>
      </div>
      ${i}
      <button class="add-set-btn" data-exercise-id="${e?.id}">+ Add Set</button>
    </div>
  `}function ye(e,t,s,o=null){if(!s||typeof s.get!="function")return null;let n=s.get(`${e}#${t}`);return n||(o!=null?s.get(`any#${o}`)??null:null)}function Qs(e,t,s){let o=e.setType||"working",n=s&&s.weight>0&&s.reps>0?`${fe(s.weight)} \xD7 ${s.reps}`:"\u2014";return`
    <div class="set-row-wrap" data-set-id="${e.id}">
      <button class="set-swipe-delete" data-set-id="${e.id}" aria-label="Delete set ${t}">Delete</button>
      <div class="set-row type-${o}${e.completed?" completed":""}" data-set-id="${e.id}">
        <button class="set-number" aria-label="Set ${t}, tap to mark as ${o==="warmup"?"working":"warmup"}">${t}</button>
        <div class="prev" aria-label="Previous">${n}</div>
        <input class="weight-input" type="number" inputmode="decimal" step="0.5" aria-label="Weight in pounds for set ${t}"
               placeholder="0" value="${e.weight>0?e.weight:""}" />
        <input class="reps-input" type="number" inputmode="numeric" step="1" aria-label="Repetitions for set ${t}"
               placeholder="0" value="${e.reps>0?e.reps:""}" />
        <button class="complete-btn" aria-label="${e.completed?"Mark incomplete":"Mark complete"} set ${t}">${ss(e.completed)}</button>
      </div>
    </div>
  `}function Xs(e,t){let s=e.querySelector(".set-row"),o=e.querySelector(".set-swipe-delete");if(!s||!o)return;let n=88,r=0,i=0,a=0,u=0,l=!1,v=!1,S=!1,d=!1,f=()=>Math.max(140,r*.5);function b(x,k){s.style.transition=k?"transform 0.18s ease":"none",s.style.transform=`translateX(${x}px)`,o.style.width=`${Math.max(n,-x)}px`,e.classList.toggle("will-delete",x<=-f())}function M(x=!0){S=!1,b(0,x),e.classList.remove("swiped-open")}function h(x=!0){document.querySelectorAll(".set-row-wrap.swiped-open").forEach(k=>{if(k!==e){let A=k.querySelector(".set-row");A&&(A.style.transition="transform 0.18s ease",A.style.transform="translateX(0)");let T=k.querySelector(".set-swipe-delete");T&&(T.style.width=""),k.classList.remove("swiped-open","will-delete")}}),S=!0,b(-n,x),e.classList.add("swiped-open")}function m(){s.style.transition="transform 0.16s ease-out",s.style.transform=`translateX(${-r}px)`,o.style.width=`${r}px`,setTimeout(t,150)}s.addEventListener("touchstart",x=>{r=e.clientWidth||s.clientWidth,i=x.touches[0].clientX,a=x.touches[0].clientY,u=S?-n:0,l=!0,v=!1,d=!!x.target.closest("input, button, select, textarea")},{passive:!0}),s.addEventListener("touchmove",x=>{if(!l)return;let k=x.touches[0].clientX-i,A=x.touches[0].clientY-a;if(!v){if(Math.abs(A)>Math.abs(k)+4){l=!1;return}Math.abs(k)>8&&(v=!0,d&&document.activeElement?.blur&&document.activeElement.blur())}if(!v)return;x.cancelable&&x.preventDefault();let T=S?-n:0;u=Math.min(0,Math.max(-r,T+k)),b(u,!1)},{passive:!1});function $(){l&&(l=!1,v&&(u<=-f()?m():u<-n/2?h():M()))}s.addEventListener("touchend",$),s.addEventListener("touchcancel",$),o.addEventListener("click",x=>{x.stopPropagation(),t()})}function ss(e){return e?'<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>':'<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>'}async function Js(e,t,s){let o=t.reduce((n,r)=>Math.max(n,r.order),-1)+1;for(let n of s){let r=(await lt(n,e.id)).filter(u=>(u.weight||0)>0&&(u.reps||0)>0),a=(r.length>0?r:[{weight:0,reps:0,setType:"working"}]).map(u=>({id:te(),workoutId:e.id,exerciseId:n,weight:u.weight??0,reps:u.reps??0,setType:u.setType||"working",completed:!1,order:o++,createdAt:Date.now()}));await U("sets",a)}}async function Zt(e,t,s){let o=(e.weight||0)*(e.reps||0);if(o<=0)return!1;let n=!1;for(let r of t)if(r.exerciseId===e.exerciseId&&r.id!==e.id&&!((r.order??0)<=(e.order??0))&&!r.completed&&(r.weight||0)*(r.reps||0)<o){if(r.bumpedBy==null){let i=s?.(r);r.preBumpWeight=i?i.weight:r.weight,r.preBumpReps=i?i.reps:r.reps}r.bumpedBy=e.id,r.weight=e.weight,r.reps=e.reps,await R("sets",r),n=!0}return n}async function es(e,t){let s=!1;for(let o of t)o.bumpedBy===e&&(o.completed||(o.preBumpWeight!=null&&(o.weight=o.preBumpWeight),o.preBumpReps!=null&&(o.reps=o.preBumpReps)),delete o.bumpedBy,delete o.preBumpWeight,delete o.preBumpReps,await R("sets",o),s=!0);return s}async function Zs(e,t,s,o=new Map){let n=t.filter(M=>M.exerciseId===s),r=n[n.length-1],i=M=>(M?.weight||0)*(M?.reps||0),a=n.filter(M=>(M.setType||"working")!=="warmup"),u=a.length+1,l=ye("working",u,o,n.length+1),v=a.filter(M=>M.weight>0&&M.reps>0).reduce((M,h)=>!M||i(h)>i(M)?h:M,null),S=a.some((M,h)=>{let m=ye("working",h+1,o);return m&&m.weight>0&&m.reps>0&&i(M)>i(m)}),d=r?.weight??0,f=r?.reps??0;v&&(!l||S)&&(d=v.weight,f=v.reps);let b={id:te(),workoutId:e.id,exerciseId:s,weight:d,reps:f,completed:!1,order:(r?.order??-1)+1,createdAt:Date.now()};await R("sets",b)}async function eo(e,t){await Ne("sets",t.filter(s=>!s.completed&&((s.weight||0)===0||(s.reps||0)===0)).map(s=>s.id)),e.endedAt=Date.now(),await R("workouts",e)}function to(e,t,s){let o=new Set,n="",r=null,i=F({html:`
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
    `,onMount(a){let u=a.querySelector("#picker-list"),l=a.querySelector("#picker-add"),v=a.querySelector("#picker-cancel"),S=a.querySelector("#picker-custom"),d=a.querySelector("#picker-search"),f=a.querySelector("#picker-chips");function b(){f.innerHTML=Ae(e,r);for(let h of f.querySelectorAll(".chip"))h.addEventListener("click",()=>{let m=h.dataset.cat;r=m==="All"?null:m,b(),M()})}function M(){let h=e.filter(m=>!r||W(m)===r).filter(m=>!n||m.name.toLowerCase().includes(n.toLowerCase())).sort((m,$)=>{let x=t.get(m.id)??0,k=t.get($.id)??0;return x!==k?k-x:m.name.localeCompare($.name)});u.innerHTML=h.length===0?'<div class="list-row"><div class="row-main" style="color:var(--text-secondary)">No matches</div></div>':h.map(m=>`
                <button class="list-row" data-id="${m.id}">
                  ${se(m)}
                  <div class="row-trailing trailing-stack">
                    ${oe(t.get(m.id)??0)}
                    ${o.has(m.id)?so():""}
                  </div>
                </button>
              `).join("");for(let m of u.querySelectorAll(".list-row[data-id]"))m.addEventListener("click",()=>{let $=m.dataset.id;o.has($)?o.delete($):o.add($),l.disabled=o.size===0,l.textContent=o.size===0?"Add":`Add (${o.size})`,M()})}d.addEventListener("input",()=>{n=d.value,M()}),v.addEventListener("click",()=>i()),l.addEventListener("click",()=>{s(Array.from(o)),i()}),S.addEventListener("click",()=>{ge(null,async h=>{e.push(h),o.add(h.id),b(),M(),l.disabled=!1,l.textContent=`Add (${o.size})`})}),b(),M()}})}function so(){return'<svg viewBox="0 0 24 24" width="22" height="22" fill="var(--green)"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'}function ge(e,t){let s=!!e,o=s?W(e):null,n=!o||he.includes(o)?he:[o,...he],r=e?.equipment,i=!r||Be.includes(r)?Be:[r,...Be],a=F({html:`
      <div class="sheet-header">
        <button class="btn-text" id="ce-cancel">Cancel</button>
        <div class="title">${s?"Edit Exercise":"New Exercise"}</div>
        <button class="btn-text primary" id="ce-save" ${s?"":"disabled"}>Save</button>
      </div>
      <div class="sheet-content">
        <div class="section">Name</div>
        <div class="form-section">
          <div class="form-row">
            <input id="ce-name" placeholder="e.g. Cable Lateral Raise" style="text-align: left;" value="${L(e?.name??"")}" />
          </div>
        </div>
        <div class="section">Muscle</div>
        <div class="form-section">
          <div class="form-row">
            <label for="ce-cat">Muscle</label>
            <select id="ce-cat">${n.map(u=>`<option${u===o?" selected":""}>${L(u)}</option>`).join("")}</select>
          </div>
        </div>
        <div class="section">Equipment</div>
        <div class="form-section">
          <div class="form-row">
            <label for="ce-eq">Equipment</label>
            <select id="ce-eq">${i.map(u=>`<option${u===r?" selected":""}>${L(u)}</option>`).join("")}</select>
          </div>
        </div>
      </div>
    `,onMount(u){let l=u.querySelector("#ce-name"),v=u.querySelector("#ce-save");l.addEventListener("input",()=>{v.disabled=l.value.trim().length===0}),u.querySelector("#ce-cancel").addEventListener("click",()=>a()),v.addEventListener("click",async()=>{let S=l.value.trim();if(!S)return;let d=u.querySelector("#ce-cat").value,f=u.querySelector("#ce-eq").value,b=s?{...e,name:S,muscle:d,equipment:f}:{id:te(),name:S,muscle:d,category:d,equipment:f,notes:"",isCustom:!0,createdAt:Date.now()};await R("exercises",b),a(),t?.(b),s||H("data:changed")}),s||setTimeout(()=>l.focus(),50)}})}function oo(){let t=[["AC","clear","fn"],["\xB1","sign","fn"],["\u232B","back","fn"],["\xF7","op","op"],["7","digit"],["8","digit"],["9","digit"],["\xD7","op","op"],["4","digit"],["5","digit"],["6","digit"],["\u2212","op","op"],["1","digit"],["2","digit"],["3","digit"],["+","op","op"],["0","digit","zero"],[".","dot"],["=","equals","op"]].map(([s,o,n])=>`<button class="calc-key${n?` calc-${n}`:""}" data-action="${o}" data-key="${L(s)}">${L(s)}</button>`).join("");F({html:`
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
    `,onMount(s,o){let n=s.querySelector("#calc-expr"),r=s.querySelector("#calc-result"),i={"+":(c,w)=>c+w,"\u2212":(c,w)=>c-w,"\xD7":(c,w)=>c*w,"\xF7":(c,w)=>w===0?NaN:c/w},a=c=>c==="+"||c==="\u2212"||c==="\xD7"||c==="\xF7",u=c=>{if(!isFinite(c))return"Error";let w=parseFloat(c.toFixed(8)).toString();return w.replace("-","").replace(".","").length>12&&(w=c.toPrecision(10).replace(/\.?0+$/,"")),w},l=["0"],v=!1,S=!1,d="",f=()=>l[l.length-1];function b(){n.textContent=S?"":d,r.textContent=S?"Error":l.join(" ");let c=!S&&a(f())?f():null;for(let w of s.querySelectorAll(".calc-op"))w.classList.toggle("selected",w.dataset.key===c)}function M(c){if(S&&(l=["0"],S=!1),v)return l=[c],v=!1,b();a(f())?l.push(c):l[l.length-1]=f()==="0"?c:f()+c,b()}function h(){if(S&&(l=["0"],S=!1),v)return l=["0."],v=!1,b();a(f())?l.push("0."):f().includes(".")||(l[l.length-1]=f()+"."),b()}function m(c){S||(v=!1,a(f())?l[l.length-1]=c:l.push(c),b())}function $(){l=["0"],v=!1,S=!1,b()}function x(){if(S||a(f()))return;let c=f();l[l.length-1]=c.startsWith("-")?c.slice(1):c==="0"?"0":"-"+c,b()}function k(){if(S)return $();if(v=!1,a(f()))return l.pop(),b();let c=f().slice(0,-1);c===""||c==="-"?l.length>1?l.pop():l=["0"]:l[l.length-1]=c,b()}function A(){if(S)return;let c=l.slice();if(a(c[c.length-1])&&c.pop(),c.length<3)return;let w=parseFloat(c[0]);for(let g=1;g<c.length;g+=2)if(w=i[c[g]](w,parseFloat(c[g+1])),!isFinite(w))return S=!0,b();d=`${c.join(" ")} =`,l=[u(w)],v=!0,b()}function T(c){let{action:w,key:g}=c.dataset;w!=="equals"&&(d=""),w==="digit"?M(g):w==="dot"?h():w==="clear"?$():w==="sign"?x():w==="back"?k():w==="op"?m(g):w==="equals"&&A()}let p=null;for(let c of s.querySelectorAll(".calc-key"))c.addEventListener("pointerdown",w=>{w.preventDefault(),p=c,c.classList.add("pressed")}),c.addEventListener("pointerup",w=>{w.preventDefault(),c.classList.remove("pressed"),p===c&&T(c),p=null}),c.addEventListener("pointercancel",()=>{c.classList.remove("pressed"),p=null}),c.addEventListener("pointerleave",()=>c.classList.remove("pressed"));s.querySelector("#calc-done").addEventListener("click",()=>o())}})}function ke(){let e=window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===!0,t;e?t=Math.max(window.innerHeight||0,window.visualViewport?.height||0,window.screen?.height||0):t=window.visualViewport?.height||window.innerHeight,document.documentElement.style.setProperty("--app-height",`${t}px`)}ke();window.addEventListener("resize",ke);window.addEventListener("orientationchange",ke);window.addEventListener("pageshow",ke);window.visualViewport?.addEventListener("resize",ke);var os={workout:{title:"Workout",render:ts},exercises:{title:"Exercises",render:_t},progress:{title:"Progress",render:Nt}},be=document.getElementById("view-content"),no=document.getElementById("nav-title"),ns=document.getElementById("nav-back"),Q=document.getElementById("nav-action"),xe="workout",nt=null,je=null,Oe=null,Fe={container:be,setTitle(e){no.textContent=e},setAction(e){if(!e){Q.hidden=!0,Q.innerHTML="",Q.removeAttribute("aria-label"),je=null;return}Q.hidden=!1,e.label?Q.setAttribute("aria-label",e.label):Q.removeAttribute("aria-label"),e.html?Q.innerHTML=e.html:Q.textContent=e.label??"",je=e.onClick},setBack(e){nt=e,ns.hidden=!e},refresh(){Se(xe)},toast(e){I(e)}};function ro(){if(typeof Oe=="function")try{Oe()}catch(e){console.error(e)}Oe=null}function Se(e){xe=e,xt(e),document.querySelectorAll(".tab").forEach(t=>{t.setAttribute("aria-selected",String(t.dataset.tab===e))}),ro(),Fe.setTitle(os[e].title),Fe.setAction(null),Fe.setBack(null),be.innerHTML="",be.scrollTop=0;try{Oe=os[e].render(Fe)}catch(t){console.error("Render failed",t),be.innerHTML=`<div class="empty-state"><div class="empty-icon">!</div><h2>Render error</h2><p>${L(t.message)}</p></div>`}}document.querySelectorAll(".tab").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll(".sheet-backdrop").forEach(t=>t.dismissSheet?.()),Se(e.dataset.tab)})});ns.addEventListener("click",()=>{nt&&nt()});Q.addEventListener("click",()=>{je&&je()});Ye("data:changed",()=>{ne(),Se(xe)});Ye("workout:changed",()=>{ne(),xe==="workout"&&Se(xe)});document.addEventListener("visibilitychange",()=>{document.visibilityState==="visible"&&ne()});async function io(){try{await j();let e=await yt();e>0&&console.info(`Seeded ${e} exercises.`),await Lt(),Se("workout"),ne()}catch(e){console.error("Init failed:",e),be.innerHTML=`
      <div class="empty-state">
        <div class="empty-icon">!</div>
        <h2>Storage unavailable</h2>
        <p>${L(e.message??String(e))}</p>
        <p>If you are running this from a <code>file://</code> URL, serve it through a local web server instead.</p>
      </div>`}}io();
