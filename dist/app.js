var xs="lift";var dt=["exercises","workouts","sets","stateOfMind","medications","doseEvents"],Me=null;function j(){return Me?Promise.resolve(Me):new Promise((e,t)=>{let s=indexedDB.open(xs,4);s.onerror=()=>t(s.error),s.onsuccess=()=>{Me=s.result,e(Me)},s.onupgradeneeded=()=>{let o=s.result;if(!o.objectStoreNames.contains("exercises")){let n=o.createObjectStore("exercises",{keyPath:"id"});n.createIndex("name","name",{unique:!1}),n.createIndex("category","category",{unique:!1})}if(o.objectStoreNames.contains("workouts")||o.createObjectStore("workouts",{keyPath:"id"}).createIndex("startedAt","startedAt",{unique:!1}),!o.objectStoreNames.contains("sets")){let n=o.createObjectStore("sets",{keyPath:"id"});n.createIndex("workoutId","workoutId",{unique:!1}),n.createIndex("exerciseId","exerciseId",{unique:!1})}if(o.objectStoreNames.contains("stateOfMind")||o.createObjectStore("stateOfMind",{keyPath:"id"}).createIndex("date","date",{unique:!1}),o.objectStoreNames.contains("medications")||o.createObjectStore("medications",{keyPath:"id"}),!o.objectStoreNames.contains("doseEvents")){let n=o.createObjectStore("doseEvents",{keyPath:"id"});n.createIndex("medicationId","medicationId",{unique:!1}),n.createIndex("date","date",{unique:!1})}}})}function ue(e){return new Promise((t,s)=>{e.onsuccess=()=>t(e.result),e.onerror=()=>s(e.error)})}async function pe(e,t="readonly"){return(await j()).transaction(e,t).objectStore(e)}function te(e,t,s){return new Promise((o,n)=>{let i=e.transaction(t,"readwrite"),r;try{r=s(i)}catch(a){try{i.abort()}catch{}n(a);return}i.oncomplete=()=>o(r),i.onerror=()=>n(i.error),i.onabort=()=>n(i.error)})}async function A(e){return ue((await pe(e)).getAll())}async function me(e,t){return ue((await pe(e)).get(t))}async function P(e,t){return await ue((await pe(e,"readwrite")).put(t)),t}async function Y(e,t){let s=await j();return te(s,e,o=>{let n=o.objectStore(e);for(let i of t)n.put(i)})}async function re(e,t){return ue((await pe(e,"readwrite")).delete(t))}async function Ve(e,t){if(t.length===0)return;let s=await j();return te(s,e,o=>{let n=o.objectStore(e);for(let i of t)n.delete(i)})}async function Ee(e,t,s){let o=await pe(e);return ue(o.index(t).getAll(s))}async function ut(e){let t=await j();return te(t,dt,s=>{for(let o of dt){let n=s.objectStore(o);n.clear();for(let i of e[o]??[])n.put(i)}})}function J(e){let t=new Set;for(let s of e)s.completed&&t.add(s.workoutId);return e.filter(s=>s.completed||!t.has(s.workoutId))}async function ae(){return(await A("workouts")).find(t=>!t.endedAt)??null}async function Z(){return(await A("workouts")).filter(t=>t.endedAt).sort((t,s)=>s.startedAt-t.startedAt)}async function pt(e){return(await Ee("sets","workoutId",e)).sort((s,o)=>s.order-o.order)}async function ks(e){return await Ee("sets","exerciseId",e)}async function mt(e,t=null){let s=await ks(e),o=new Map;for(let r of s)t&&r.workoutId===t||(o.has(r.workoutId)||o.set(r.workoutId,[]),o.get(r.workoutId).push(r));if(o.size===0)return[];let i=(await Promise.all(Array.from(o.keys()).map(r=>me("workouts",r)))).filter(Boolean).sort((r,a)=>(a.startedAt??0)-(r.startedAt??0));return i.length===0?[]:o.get(i[0].id).sort((r,a)=>r.order-a.order)}function ft(e,t,s=null){let o=new Map(t.map(r=>[r.id,r.startedAt??0])),n=new Map;for(let r of e){if(r.workoutId===s||!o.has(r.workoutId)||(r.weight||0)<=0||(r.reps||0)<=0)continue;let a=n.get(r.exerciseId);a||n.set(r.exerciseId,a=new Map);let u=a.get(r.workoutId);u||a.set(r.workoutId,u=[]),u.push(r)}let i=new Map;for(let[r,a]of n){let u=[...a.keys()].sort((m,x)=>o.get(x)-o.get(m)),l=new Map;for(let m of u){let x=a.get(m).sort((M,h)=>M.order-h.order),d=x.every(M=>M.setType==null),f=0,b=0;x.forEach((M,h)=>{if(d){let S=`any#${h+1}`;l.has(S)||l.set(S,M);return}let v=M.setType||"working",$=v==="warmup"?b+=1:f+=1,k=`${v}#${$}`;l.has(k)||l.set(k,M)})}i.set(r,l)}return i}var Ss={barbell:"Barbell",dumbbell:"Dumbbell",machine:"Machine",cable:"Cable",bodyweight:"Bodyweight",kettlebell:"Kettlebell",band:"Bands",bands:"Bands"},$s=/\s*\((barbell|dumbbell|machine|cable|bodyweight|kettlebell|bands?)\)$|\s+(Machine|Barbell|Dumbbell|Cable|Kettlebell)$/i;async function Ms(e,t){let s=await j(),o=await Ee("sets","exerciseId",e);return te(s,["sets","exercises"],n=>{let i=n.objectStore("sets");for(let r of o)i.put({...r,exerciseId:t});return n.objectStore("exercises").delete(e),o.length})}async function vt(){let e=await A("exercises"),t=e.filter(i=>/butterfly/i.test(i.name||""));if(t.length===0)return 0;let s=e.filter(i=>/chest fly/i.test(i.name||"")&&!t.some(r=>r.id===i.id)),o=s.find(i=>(i.equipment||"")==="Machine")||s[0],n=0;for(let i of t)o?n+=await Ms(i.id,o.id):await P("exercises",{...i,name:"Chest Fly",equipment:"Machine"});return n}async function ht(){let e=await A("exercises"),t=[];for(let s of e){let o=(s.name||"").match($s);if(!o)continue;let n=s.name.slice(0,o.index).trim();if(!n||/smith$/i.test(n))continue;let i=(o[1]||o[2]).toLowerCase();t.push({...s,name:n,equipment:Ss[i]||s.equipment})}return t.length>0&&await Y("exercises",t),t.length}async function yt(){let[e,t,s]=await Promise.all([A("exercises"),A("sets"),A("workouts")]),o=new Set(e.filter(l=>l.category==="Cardio").map(l=>l.id));if(o.size===0)return{exercises:0,sets:0,workouts:0};let n=t.filter(l=>o.has(l.exerciseId)),i=new Map;for(let l of t)o.has(l.exerciseId)||i.set(l.workoutId,(i.get(l.workoutId)||0)+1);let r=new Set(n.map(l=>l.workoutId)),a=s.filter(l=>r.has(l.id)&&!i.get(l.id)),u=await j();return await te(u,["exercises","sets","workouts"],l=>{let m=l.objectStore("exercises"),x=l.objectStore("sets"),d=l.objectStore("workouts");for(let f of o)m.delete(f);for(let f of n)x.delete(f.id);for(let f of a)d.delete(f.id)}),{exercises:o.size,sets:n.length,workouts:a.length}}async function gt(e){let[t,s,o]=await Promise.all([A("exercises"),A("sets"),A("workouts")]),n=t.filter(d=>d.category==="Other");if(n.length===0)return{recategorized:0,deleted:0,workouts:0};let i=[],r=new Set;for(let d of n){let f=e(d.name);f==="Cardio"?r.add(d.id):i.push({...d,category:f&&f!=="Other"?f:"Full Body"})}let a=s.filter(d=>r.has(d.exerciseId)),u=new Map;for(let d of s)r.has(d.exerciseId)||u.set(d.workoutId,(u.get(d.workoutId)||0)+1);let l=new Set(a.map(d=>d.workoutId)),m=o.filter(d=>l.has(d.id)&&!u.get(d.id)),x=await j();return await te(x,["exercises","sets","workouts"],d=>{let f=d.objectStore("exercises"),b=d.objectStore("sets"),M=d.objectStore("workouts");for(let h of i)f.put(h);for(let h of r)f.delete(h);for(let h of a)b.delete(h.id);for(let h of m)M.delete(h.id)}),{recategorized:i.length,deleted:r.size,workouts:m.length}}async function Le(e){let t=await j(),s=await Ee("sets","workoutId",e);return te(t,["workouts","sets"],o=>{o.objectStore("workouts").delete(e);let n=o.objectStore("sets");for(let i of s)n.delete(i.id)})}var F=()=>crypto&&crypto.randomUUID?crypto.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,e=>{let t=Math.random()*16|0;return(e==="x"?t:t&3|8).toString(16)});function fe(e){return e==null?"0":Math.abs(e-Math.round(e))<.001?String(Math.round(e)):e.toFixed(1)}function ve(e){return`${fe(e)} lbs`}function wt(e){let t=Math.max(0,Math.floor(e)),s=Math.floor(t/3600),o=Math.floor(t%3600/60),n=t%60;return s>0?`${s}:${String(o).padStart(2,"0")}:${String(n).padStart(2,"0")}`:`${o}:${String(n).padStart(2,"0")}`}function _e(e){let t=Math.max(0,Math.floor(e)),s=Math.floor(t/3600),o=Math.floor(t%3600/60);return s>0?`${s}h ${o}m`:`${o}m`}function K(e){return Math.round(e).toLocaleString()}function ce(e){return`${K(e)} lbs`}function z(e){return(e instanceof Date?e:new Date(e)).toLocaleDateString(void 0,{month:"numeric",day:"numeric",year:"2-digit"})}function bt(e){return(e instanceof Date?e:new Date(e)).toLocaleDateString(void 0,{weekday:"short",month:"short",day:"numeric",year:"numeric"})}function Ye(e,t=200){let s=null;return(...o)=>{clearTimeout(s),s=setTimeout(()=>e(...o),t)}}function E(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function I(e,t=1800,s={}){let o=document.querySelector(".toast");o&&o.remove();let n=document.createElement("div");n.className="toast",n.textContent=e,s.persistUntilClick?(n.classList.add("toast-clickable"),n.addEventListener("click",()=>n.remove())):setTimeout(()=>n.remove(),t),document.body.appendChild(n)}var Ue=new EventTarget;function q(e,t){Ue.dispatchEvent(new CustomEvent(e,{detail:t}))}function Ke(e,t){return Ue.addEventListener(e,t),()=>Ue.removeEventListener(e,t)}function W({html:e,onMount:t}){let s=document.createElement("div");s.className="sheet-backdrop",s.innerHTML='<div class="sheet"></div>';let o=s.querySelector(".sheet");o.innerHTML=e;let n=Es();document.body.appendChild(s);function i(){let u=window.visualViewport;if(!u){o.style.maxHeight=`${window.innerHeight-n-10}px`;return}let l=Math.max(window.innerHeight,document.documentElement.clientHeight),m=Math.max(0,l-u.height-u.offsetTop);m>0?(o.style.paddingBottom=`${m}px`,o.style.maxHeight=`${u.height-n-10+m}px`):(o.style.paddingBottom="",o.style.maxHeight=`${u.height-n-10}px`)}i();let r=window.visualViewport;r?.addEventListener("resize",i),r?.addEventListener("scroll",i);function a(){s.remove(),r?.removeEventListener("resize",i),r?.removeEventListener("scroll",i)}return s.dismissSheet=a,s.addEventListener("click",u=>{u.target===s&&a()}),t?.(o,a),a}function Es(){let e=document.createElement("div");e.style.cssText="position:fixed;top:0;left:0;width:0;height:env(safe-area-inset-top);",document.body.appendChild(e);let t=e.offsetHeight||0;return e.remove(),t}function De(){return'<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" style="color: var(--red);"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>'}function xt(){return'<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M16 5l-1.42 1.42-1.59-1.59V16h-2V4.83L9.41 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z"/></svg>'}function G(e){return`<div class="empty-state"><div class="empty-icon">!</div><h2>Couldn't load</h2><p>${E(e.message||String(e))}</p></div>`}var he=["Pectorals","Anterior Deltoid","Lateral Deltoid","Posterior Deltoid","Triceps","Biceps","Forearms","Lats","Upper Back","Lower Back","Traps","Quadriceps","Hamstrings","Glutes","Adductors","Abductors","Calves","Abs","Obliques"];function Ls(e){let t=new Map(he.map((s,o)=>[s,o]));return[...e].sort((s,o)=>(t.get(s)??999)-(t.get(o)??999)||s.localeCompare(o))}var Ae=["Barbell","Dumbbell","Machine","Cable","Bodyweight","Other"];function Q(e){let t=e?.equipment,s=e?.name??"";return t&&t!=="Other"?`${s} (${t})`:s}function se(e){let t=e?[e.equipment,R(e)].filter(Boolean).join(" \xB7 "):"";return`
    <div class="row-main">
      <div class="row-title">${E(e?.name??"Unknown exercise")}</div>
      ${t?`<div class="row-subtitle">${E(t)}</div>`:""}
    </div>
  `}function oe(e){return e?`<div class="exercise-count">${e} ${e===1?"set":"sets"}</div>`:""}function Be(e,t){return["All",...Ls(new Set(e.map(o=>R(o))))].map(o=>`<button class="chip${o==="All"&&!t||o===t?" active":""}" data-cat="${E(o)}">${E(o)}</button>`).join("")}var Ds=[["Bench Press (Barbell)","Chest","Barbell"],["Bench Press (Dumbbell)","Chest","Dumbbell"],["Incline Bench Press (Barbell)","Chest","Barbell"],["Incline Bench Press (Dumbbell)","Chest","Dumbbell"],["Decline Bench Press (Barbell)","Chest","Barbell"],["Chest Fly (Dumbbell)","Chest","Dumbbell"],["Chest Fly (Machine)","Chest","Machine"],["Cable Crossover","Chest","Cable"],["Push-Up","Chest","Bodyweight"],["Dip (Chest)","Chest","Bodyweight"],["Deadlift (Conventional)","Back","Barbell"],["Deadlift (Sumo)","Back","Barbell"],["Romanian Deadlift","Back","Barbell"],["Bent-Over Row (Barbell)","Back","Barbell"],["Pendlay Row","Back","Barbell"],["Row (Dumbbell)","Back","Dumbbell"],["T-Bar Row","Back","Barbell"],["Seated Cable Row","Back","Cable"],["Lat Pulldown","Back","Cable"],["Pull-Up","Back","Bodyweight"],["Chin-Up","Back","Bodyweight"],["Face Pull","Back","Cable"],["Shrug (Barbell)","Back","Barbell"],["Shrug (Dumbbell)","Back","Dumbbell"],["Overhead Press (Barbell)","Shoulders","Barbell"],["Overhead Press (Dumbbell)","Shoulders","Dumbbell"],["Seated Shoulder Press (Machine)","Shoulders","Machine"],["Arnold Press","Shoulders","Dumbbell"],["Lateral Raise (Dumbbell)","Shoulders","Dumbbell"],["Lateral Raise (Cable)","Shoulders","Cable"],["Front Raise (Dumbbell)","Shoulders","Dumbbell"],["Rear Delt Fly (Dumbbell)","Shoulders","Dumbbell"],["Reverse Pec Deck","Shoulders","Machine"],["Upright Row","Shoulders","Barbell"],["Barbell Curl","Biceps","Barbell"],["Dumbbell Curl","Biceps","Dumbbell"],["Hammer Curl","Biceps","Dumbbell"],["Preacher Curl","Biceps","Barbell"],["Incline Dumbbell Curl","Biceps","Dumbbell"],["Cable Curl","Biceps","Cable"],["Concentration Curl","Biceps","Dumbbell"],["Close-Grip Bench Press","Triceps","Barbell"],["Tricep Pushdown (Cable)","Triceps","Cable"],["Overhead Tricep Extension (Dumbbell)","Triceps","Dumbbell"],["Overhead Tricep Extension (Cable)","Triceps","Cable"],["Skull Crusher","Triceps","Barbell"],["Dip (Tricep)","Triceps","Bodyweight"],["Tricep Kickback","Triceps","Dumbbell"],["Back Squat","Legs","Barbell"],["Front Squat","Legs","Barbell"],["Goblet Squat","Legs","Dumbbell"],["Bulgarian Split Squat","Legs","Dumbbell"],["Lunge","Legs","Dumbbell"],["Leg Press","Legs","Machine"],["Leg Extension","Legs","Machine"],["Leg Curl (Seated)","Legs","Machine"],["Leg Curl (Lying)","Legs","Machine"],["Hip Thrust (Barbell)","Glutes","Barbell"],["Glute Bridge","Glutes","Bodyweight"],["Cable Kickback","Glutes","Cable"],["Hip Abduction (Machine)","Glutes","Machine"],["Standing Calf Raise","Calves","Machine"],["Seated Calf Raise","Calves","Machine"],["Plank","Core","Bodyweight"],["Hanging Leg Raise","Core","Bodyweight"],["Cable Crunch","Core","Cable"],["Russian Twist","Core","Bodyweight"],["Ab Wheel Rollout","Core","Other"],["Wrist Curl","Forearms","Dumbbell"],["Reverse Wrist Curl","Forearms","Dumbbell"],["Farmer's Carry","Forearms","Dumbbell"]];function R(e){if(e?.muscle)return e.muscle;let t=(e?.name||"").toLowerCase();return t?/romanian deadlift|\brdl\b|stiff.?leg|good morning|nordic|hamstring/.test(t)||/leg curl/.test(t)?"Hamstrings":/leg extension|sissy squat/.test(t)?"Quadriceps":/calf|tib raise|tibialis/.test(t)?"Calves":/hip adduction|adductor|inner thigh|copenhagen/.test(t)?"Adductors":/hip abduction|abductor|outer thigh|clamshell/.test(t)?"Abductors":/hip thrust|glute|cable kickback|donkey kick|rear kick|frog pump/.test(t)?"Glutes":/squat|leg press|lunge|step.?up/.test(t)?"Quadriceps":/back extension|hyperextension|superman/.test(t)||/deadlift|rack pull/.test(t)?"Lower Back":/lateral raise|side raise|side delt|\blat raise\b|upright row/.test(t)?"Lateral Deltoid":/rear delt|reverse fly|reverse flye|face pull|reverse pec deck/.test(t)?"Posterior Deltoid":/front raise|shoulder press|overhead press|arnold|military press|landmine press|push press|viking press/.test(t)?"Anterior Deltoid":/pulldown|pull.?down|pull.?up|chin.?up|pullover|straight.?arm/.test(t)?"Lats":/shrug/.test(t)?"Traps":/tricep|pushdown|skull ?crusher|close.?grip bench|jm press|french press|bench dip/.test(t)?"Triceps":/wrist curl|reverse curl|forearm|farmer|gripper|dead hang/.test(t)?"Forearms":/bicep|\bcurl\b/.test(t)?"Biceps":/\brow\b|rear pull|high pull/.test(t)?"Upper Back":/bench|chest|\bpec\b|pec deck|crossover|butterfly|push.?up|floor press|squeeze press|\bfly\b|\bflye\b/.test(t)?"Pectorals":/russian twist|woodchop|wood chop|side plank|side bend|oblique|pallof|rotation/.test(t)?"Obliques":/crunch|sit.?up|plank|leg raise|knee raise|ab wheel|ab roll|hanging|toes.?to.?bar|v.?up|dead bug|mountain climber/.test(t)?"Abs":/\bdip\b/.test(t)?"Triceps":e.category||"Other":e?.category||"Other"}var As=/\b(bike|biking|treadmill|run|running|cardio|step.?mill|elliptical|stair.?master|stair.?climber|jog|jogging|cycling|spinning|spin class|rowing machine|row machine|\berg\b|sprints?|jump.?rope|skipping rope|swim|swimming|hike|hiking)\b/,Bs={Quadriceps:"Legs",Hamstrings:"Legs",Adductors:"Legs",Abductors:"Legs",Glutes:"Glutes",Calves:"Calves",Pectorals:"Chest","Anterior Deltoid":"Shoulders","Lateral Deltoid":"Shoulders","Posterior Deltoid":"Shoulders",Lats:"Back","Upper Back":"Back",Traps:"Back","Lower Back":"Back",Biceps:"Biceps",Triceps:"Triceps",Forearms:"Forearms",Abs:"Core",Obliques:"Core"};function kt(e){let t=(e||"").toLowerCase().trim();if(!t)return"Full Body";if(As.test(t))return"Cardio";let s=R({name:t,category:""});return Bs[s]||"Full Body"}async function St(){if((await A("exercises")).length>0)return 0;let t=Date.now(),s=Ds.map(([o,n,i])=>({id:F(),name:o,category:n,equipment:i,notes:"",isCustom:!1,createdAt:t}));return await Y("exercises",s),s.length}var $t="workout";function Mt(e){$t!==e&&($t=e,q("tab:changed",e))}var N=["Chest Day","Leg Day","Back/Bi Day"],Te={"Chest Day":{key:"chest",short:"Chest",cssVar:"--day-chest"},"Leg Day":{key:"leg",short:"Legs",cssVar:"--day-leg"},"Back/Bi Day":{key:"back",short:"Back/Bi",cssVar:"--day-back"}};function Ce(e){let t=Te[e];return t?`var(${t.cssVar})`:"var(--text-tertiary)"}function Ge(e){if(!e)return null;let t=e.toLowerCase();return t.includes("chest")?"Chest Day":t.includes("leg")&&!t.includes("curl")&&!t.includes("extension")?"Leg Day":t.includes("back")||t.includes("pull")?"Back/Bi Day":t.includes("push")?"Chest Day":null}function Qe(e){for(let t of e){let s=Ge(t.name);if(s)return{name:t.name,normalized:s,startedAt:t.startedAt}}return null}function Ie(e){let t=N.indexOf(e);return t===-1?N[0]:N[(t+1)%N.length]}var Ts={Pectorals:"#ec4899",Triceps:"#be185d","Anterior Deltoid":"#831843","Lateral Deltoid":"#f9a8d4",Quadriceps:"#facc15",Hamstrings:"#b45309",Glutes:"#f59e0b",Calves:"#fde68a",Adductors:"#bdb76b",Abductors:"#78350f",Lats:"#2563eb","Upper Back":"#38bdf8",Biceps:"#1e40af","Posterior Deltoid":"#bfdbfe",Traps:"#0891b2","Lower Back":"#475569",Forearms:"#22c55e",Abs:"#ef4444",Obliques:"#14b8a6",Other:"#6b7280"};function Et(e){return Ts[e]??"#6b7280"}var Cs={Pectorals:"Chest Day",Triceps:"Chest Day","Anterior Deltoid":"Chest Day","Lateral Deltoid":"Chest Day",Quadriceps:"Leg Day",Hamstrings:"Leg Day",Glutes:"Leg Day",Calves:"Leg Day",Adductors:"Leg Day",Abductors:"Leg Day",Lats:"Back/Bi Day","Upper Back":"Back/Bi Day",Biceps:"Back/Bi Day","Posterior Deltoid":"Back/Bi Day",Traps:"Back/Bi Day","Lower Back":"Back/Bi Day",Forearms:"Back/Bi Day"};function Is(e){return Cs[e]??null}function qs(e,t,s){let o=Ge(e);if(o)return o;let n=new Map;for(let a of t){let u=s.get(a.exerciseId);if(!u)continue;let l=Is(R(u));if(!l)continue;let m=(a.weight||0)*(a.reps||0);m<=0||n.set(l,(n.get(l)??0)+m)}let i=null,r=0;for(let[a,u]of n)u>r&&(i=a,r=u);return i}function Lt(e,t,s){let o=[...e].sort((r,a)=>r.startedAt-a.startedAt),n=new Map,i=null;for(let r of o){let a=qs(r.name,t.get(r.id)??[],s);a||(i?At(i.startedAt,r.startedAt)?a=i.day:a=Ie(i.day):a=N[0]),n.set(r.id,a),i={day:a,startedAt:r.startedAt}}return n}function Dt(e){let t=parseInt(e.slice(1),16);return((t>>16&255)*299+(t>>8&255)*587+(t&255)*114)/1e3>=150?"#1c1c1e":"#ffffff"}function At(e,t){let s=new Date(e),o=new Date(t);return s.getFullYear()===o.getFullYear()&&s.getMonth()===o.getMonth()&&s.getDate()===o.getDate()}function Ps(e,t){let s=Ge(t?.name);if(s)return s;let o=Qe(e);return o?At(o.startedAt,Date.now())?o.normalized:Ie(o.normalized):N[0]}var Hs="lift-today-day";async function ne(){try{let[e,t]=await Promise.all([Z(),ae()]),s=Ps(e,t),o=Te[s].key;document.documentElement.dataset.day!==o&&(document.documentElement.dataset.day=o);try{localStorage.setItem(Hs,o)}catch{}return s}catch{return null}}var Bt="lift-migrations-done-v1";async function Xe(){let e=await yt();e.exercises>0&&console.info(`Removed ${e.exercises} cardio exercise(s), ${e.sets} set(s), ${e.workouts} cardio-only workout(s).`);let t=await gt(kt);if(t.recategorized>0||t.deleted>0){console.info(`Reorganized "Other": recategorized ${t.recategorized}, removed ${t.deleted} cardio, dropped ${t.workouts} empty workout(s).`);let n=[];t.recategorized>0&&n.push(`sorted ${t.recategorized} exercise${t.recategorized===1?"":"s"}`),t.deleted>0&&n.push(`removed ${t.deleted} cardio`),I(`Cleaned up \u201COther\u201D: ${n.join(", ")}.`)}let s=await ht();s>0&&console.info(`Stripped equipment from ${s} exercise name(s).`);let o=await vt();o>0&&I(`Merged Butterfly into Chest Fly (${o} sets moved).`)}async function Tt(){try{if(localStorage.getItem(Bt))return}catch{}await Xe();try{localStorage.setItem(Bt,String(Date.now()))}catch{}}var qe="lift-backup-passphrase";var Ct="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";function Je(e){let t=new Uint8Array(e),s="",o=32768;for(let n=0;n<t.length;n+=o)s+=String.fromCharCode.apply(null,t.subarray(n,n+o));return btoa(s)}var Ze=e=>Uint8Array.from(atob(e),t=>t.charCodeAt(0));function Os(){let t=[...crypto.getRandomValues(new Uint8Array(20))].map(s=>Ct[s%Ct.length]);return[0,5,10,15].map(s=>t.slice(s,s+5).join("")).join("-")}function et(){let e=null;try{e=localStorage.getItem(qe)}catch{}if(!e){e=Os();try{localStorage.setItem(qe,e)}catch{}}return e}function It(){try{return localStorage.getItem(qe)}catch{return null}}function qt(e){try{localStorage.setItem(qe,e)}catch{}}async function Pt(e,t){let s=await crypto.subtle.importKey("raw",new TextEncoder().encode(e),"PBKDF2",!1,["deriveKey"]);return crypto.subtle.deriveKey({name:"PBKDF2",hash:"SHA-256",salt:t,iterations:25e4},s,{name:"AES-GCM",length:256},!1,["encrypt","decrypt"])}function Ht(e){return!!e&&e.lift==="encrypted-backup"&&typeof e.data=="string"}async function Ot(e,t){let s=crypto.getRandomValues(new Uint8Array(16)),o=crypto.getRandomValues(new Uint8Array(12)),n=await Pt(t,s),i=new TextEncoder().encode(JSON.stringify(e)),r=await crypto.subtle.encrypt({name:"AES-GCM",iv:o},n,i);return{lift:"encrypted-backup",v:1,exportedAt:new Date().toISOString(),kdf:{name:"PBKDF2",hash:"SHA-256",iterations:25e4,salt:Je(s)},cipher:"AES-GCM",iv:Je(o),data:Je(r)}}async function tt(e,t){let s=Ze(e.kdf.salt),o=Ze(e.iv),n=await Pt(t,s),i;try{i=await crypto.subtle.decrypt({name:"AES-GCM",iv:o},n,Ze(e.data))}catch{throw new Error("Wrong backup password (or the file is damaged).")}return JSON.parse(new TextDecoder().decode(i))}async function Ws(){let[e,t,s,o,n,i]=await Promise.all([A("exercises"),A("workouts"),A("sets"),A("stateOfMind"),A("medications"),A("doseEvents")]);return{version:2,exportedAt:new Date().toISOString(),exercises:e,workouts:t,sets:s,stateOfMind:o,medications:n,doseEvents:i}}function Rs(){let e=new Date,t=s=>String(s).padStart(2,"0");return`lift-backup-${e.getFullYear()}${t(e.getMonth()+1)}${t(e.getDate())}-${t(e.getHours())}${t(e.getMinutes())}${t(e.getSeconds())}.json`}async function st(){let e=await Ws(),t=et(),s=await Ot(e,t),o=JSON.stringify(s),n=new Blob([o],{type:"application/json"}),i=URL.createObjectURL(n),r=Rs(),a=document.createElement("a");return a.href=i,a.download=r,a.style.display="none",document.body.appendChild(a),a.click(),setTimeout(()=>{document.body.removeChild(a),URL.revokeObjectURL(i)},1e3),{filename:r,bytes:n.size,snapshot:e}}async function Fs(e){let t=It();if(t)try{return await tt(e,t)}catch{}for(let s=0;s<3;s++){let o=prompt("Enter your backup password (saved in your Passwords app):");if(o==null)throw new Error("Restore cancelled.");try{let n=await tt(e,o.trim());return qt(o.trim()),n}catch(n){if(s===2)throw n;alert("Wrong password \u2014 try again.")}}}async function Ns(e){let t=JSON.parse(await e.text()),s=Ht(t)?await Fs(t):t;if(!s||!Array.isArray(s.exercises)||!Array.isArray(s.workouts)||!Array.isArray(s.sets))throw new Error("File doesn't look like a Lift backup.");return await ut({exercises:s.exercises,workouts:s.workouts,sets:s.sets,stateOfMind:s.stateOfMind??[],medications:s.medications??[],doseEvents:s.doseEvents??[]}),await Xe(),{exercises:s.exercises.length,workouts:s.workouts.length,sets:s.sets.length,stateOfMind:(s.stateOfMind??[]).length}}function Wt(){let e=et();W({html:`
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
            <div class="stat-value" id="bk-pass" style="font-variant-numeric: tabular-nums; letter-spacing: 0.5px; color: var(--text); -webkit-user-select: all; user-select: all;">${E(e)}</div>
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
    `,onMount(t,s){t.querySelector("#bk-close").addEventListener("click",()=>s()),t.querySelector("#bk-copy").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(e),I("Password copied \u2014 save it in your Passwords app")}catch{I("Copy failed \u2014 long-press the password to select it")}}),t.querySelector("#bk-export").addEventListener("click",async()=>{try{let{filename:n,bytes:i}=await st();I(`Exported ${n} (${js(i)})`)}catch(n){I(`Export failed: ${n.message}`)}});let o=t.querySelector("#bk-file");t.querySelector("#bk-import").addEventListener("click",()=>{o.value="",o.click()}),o.addEventListener("change",async n=>{let i=n.target.files?.[0];if(i&&confirm("Replace all current data with this backup? This cannot be undone."))try{let r=await Ns(i);s(),I(`Restored ${r.workouts} workouts, ${r.exercises} exercises`),q("data:changed")}catch(r){I(`Restore failed: ${r.message}`)}})}})}function js(e){return e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/(1024*1024)).toFixed(1)} MB`}var Pe=[{key:"1W",tick:"1W",days:7},{key:"1M",tick:"1M",days:30},{key:"3M",tick:"3M",days:90},{key:"1Y",tick:"1Y",days:365},{key:"All",tick:"All",all:!0}];function zs(e){let t=new Map;for(let s of e){let o=new Date(s.date),n=`${o.getFullYear()}-${o.getMonth()}-${o.getDate()}`,i=t.get(n)||{date:s.date,total:0,count:0};i.total+=s.value,i.count+=1,i.date=Math.min(i.date,s.date),t.set(n,i)}return[...t.values()].map(s=>({date:s.date,value:s.total/s.count})).sort((s,o)=>s.date-o.date)}function ye(e,t,s={}){let o=t.length>0&&t[0].points!==void 0,n=(o?t:[{points:t}]).map(p=>({label:p.label??"",color:p.color||"var(--accent)",points:zs(p.points)})).filter(p=>p.points.length>0),i=s.defaultPeriod||"All",r=Math.max(0,Pe.findIndex(p=>p.key===i)),a=Pe.length-1,u=null;function l(){let p=Pe[r],c=n.map((w,D)=>u===null||D===u?w.points:[]);if(p.all)return c;let y=Date.now()-p.days*864e5,g=c.map(w=>w.filter(D=>D.date>=y));return g.every(w=>w.length===0)?c.map(w=>w.slice(-1)):g}let m=o&&n.some(p=>p.label)?`<div class="chart-legend">${n.map((p,c)=>`<button class="legend-item" data-i="${c}" style="--dcolor: ${p.color};" aria-pressed="false">${p.label}</button>`).join("")}</div>`:"";e.innerHTML=`
    <div class="chart-scrub-readout" data-role="scrub"></div>
    ${m}
    <div class="chart-container" data-role="chart"></div>
    <div class="chart-daterange" data-role="range"></div>
    <div class="chart-slider">
      <input type="range" class="chart-range" min="0" max="${a}" step="1"
             value="${r}" aria-label="Time range" />
      <div class="chart-slider-ticks">
        ${Pe.map((p,c)=>`<span data-i="${c}">${p.tick}</span>`).join("")}
      </div>
    </div>
  `;let x=e.querySelector('[data-role="scrub"]'),d=e.querySelector('[data-role="chart"]'),f=e.querySelector('[data-role="range"]'),b=e.querySelector(".chart-range"),M=[...e.querySelectorAll(".chart-slider-ticks span")],h=s.unit||"lbs",v=null;function $(){let p=l(),c=Vs(p,n,h);d.innerHTML=c.html,v=c.geom;let y=p.flat();if(y.length>=2){let g=Math.min(...y.map(D=>D.date)),w=Math.max(...y.map(D=>D.date));f.innerHTML=`<span>${ot(g)}</span><span>${ot(w)}</span>`}else f.innerHTML="";M.forEach((g,w)=>g.classList.toggle("active",w===r))}b.addEventListener("input",()=>{r=Number(b.value),B(),$()});let k=[...e.querySelectorAll(".chart-legend .legend-item")];for(let p of k)p.addEventListener("click",()=>{let c=Number(p.dataset.i);u=u===c?null:c,k.forEach((y,g)=>{y.classList.toggle("dimmed",u!==null&&g!==u),y.setAttribute("aria-pressed",String(u===g))}),B(),$()});function S(p){if(!v||v.pts.length<2)return;let c=d.querySelector("svg"),y=c?.getScreenCTM();if(!y)return;let g=new DOMPoint(p,0).matrixTransform(y.inverse()).x,w=0,D=1/0;v.pts.forEach((O,U)=>{let _=Math.abs(O.x-g);_<D&&(D=_,w=U)});let L=v.pts[w],C=c.querySelector(".chart-scrub-line"),H=c.querySelector(".chart-scrub-dot");C&&(C.setAttribute("x1",L.x),C.setAttribute("x2",L.x),C.removeAttribute("visibility")),H&&(H.setAttribute("cx",L.x),H.setAttribute("cy",L.y),H.style.fill=L.color,H.removeAttribute("visibility"));let V=L.label?` \xB7 ${L.label}`:"";x.textContent=`${ot(L.date)}${V} \xB7 ${Math.round(L.value).toLocaleString()} ${h}`}function B(){x.textContent="";let p=d.querySelector("svg");p?.querySelector(".chart-scrub-line")?.setAttribute("visibility","hidden"),p?.querySelector(".chart-scrub-dot")?.setAttribute("visibility","hidden")}let T=!1;d.addEventListener("pointerdown",p=>{T=!0,d.setPointerCapture?.(p.pointerId),S(p.clientX)}),d.addEventListener("pointermove",p=>{T&&S(p.clientX)});for(let p of["pointerup","pointercancel"])d.addEventListener(p,()=>{T=!1,B()});$()}function ot(e){return new Date(e).toLocaleDateString(void 0,{month:"short",day:"numeric",year:"numeric"})}function Vs(e,t,s){let i={top:16,right:14,bottom:14,left:52},r=400-i.left-i.right,a=200-i.top-i.bottom,u=e.flat();if(u.length===0)return{html:`<svg viewBox="0 0 400 200"><text x="${400/2}" y="${200/2}" text-anchor="middle" class="chart-axis-label">No data in range</text></svg>`,geom:null};if(u.length===1){let w=u[0],D=t[e.findIndex(H=>H.length>0)]?.color||"var(--accent)",L=i.left+r/2,C=i.top+a/2;return{html:`<svg viewBox="0 0 400 200"><circle cx="${L}" cy="${C}" r="4" class="chart-point" style="fill: ${D};"/><text x="${L}" y="${C-10}" text-anchor="middle" class="chart-axis-label">${Math.round(w.value).toLocaleString()} ${s}</text></svg>`,geom:null}}let l=u.map(w=>w.date),m=u.map(w=>w.value),x=Math.min(...l),d=Math.max(...l),f=Math.max(...m),b=Math.min(...m),M=Math.max(f-b,1),h=Math.max(0,b-M*.12),v=f+M*.12,$=w=>i.left+(w-x)/Math.max(d-x,1)*r,k=w=>i.top+a-(w-h)/(v-h)*a,S=4,B=w=>Math.round(w).toLocaleString(),T=Array.from({length:S+1},(w,D)=>{let L=h+(v-h)*D/S,C=k(L);return`<text x="${i.left-6}" y="${C+3}" text-anchor="end" class="chart-axis-label">${B(L)}</text>`}).join(""),p=Array.from({length:S+1},(w,D)=>{let L=i.top+a*D/S;return`<line x1="${i.left}" x2="${400-i.right}" y1="${L}" y2="${L}" class="chart-axis-line"/>`}).join(""),c=[],y=e.map((w,D)=>{let L=t[D],C=w.map(H=>({x:$(H.date),y:k(H.value)}));return w.forEach((H,V)=>c.push({...C[V],date:H.date,value:H.value,label:L.label,color:L.color})),C.length===0?"":C.length===1?`<circle cx="${C[0].x}" cy="${C[0].y}" r="3.5" class="chart-point" style="fill: ${L.color};"/>`:`<path d="${Us(C)}" class="chart-line" style="stroke: ${L.color};"/>`}).join("");return{html:`
    <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet">
      ${p}
      ${T}
      ${y}
      <line class="chart-scrub-line" y1="${i.top}" y2="${i.top+a}" x1="0" x2="0" visibility="hidden"/>
      <circle class="chart-scrub-dot" r="4.5" visibility="hidden"/>
    </svg>
  `,geom:{pts:c}}}function Us(e){if(e.length<2)return"";let t=`M ${e[0].x.toFixed(1)} ${e[0].y.toFixed(1)}`;for(let s=0;s<e.length-1;s++){let o=e[s===0?0:s-1],n=e[s],i=e[s+1],r=e[s+2]||i,a=n.x+(i.x-o.x)/6,u=n.y+(i.y-o.y)/6,l=i.x-(r.x-n.x)/6,m=i.y-(r.y-n.y)/6;t+=` C ${a.toFixed(1)} ${u.toFixed(1)}, ${l.toFixed(1)} ${m.toFixed(1)}, ${i.x.toFixed(1)} ${i.y.toFixed(1)}`}return t}var Nt=e=>typeof e=="number"?e:Date.parse(e),jt=["Amazed","Excited","Happy","Joyful","Content","Calm","Grateful","Hopeful","Confident","Proud","Surprised","Indifferent","Anxious","Stressed","Overwhelmed","Frustrated","Angry","Irritated","Sad","Lonely","Discouraged","Drained","Worried","Embarrassed"],zt=["Health","Fitness","Self-Care","Hobbies","Identity","Community","Family","Friends","Partner","Work","Education","Money","Weather","Tasks"],nt=[["taken","Taken"],["skipped","Skipped"],["snoozed","Snoozed"],["notInteracted","Not interacted"]];async function Vt(e){let t=JSON.parse(await e.text());if(!t||t.lift!=="health-import")throw new Error("Not a Lift health-import file.");let s=_s(t.stateOfMind),o=Ys(t.medications),n=Ks(t.doseEvents);return s.length&&await Y("stateOfMind",s),o.length&&await Y("medications",o),n.length&&await Y("doseEvents",n),{stateOfMind:s.length,medications:o.length,doseEvents:n.length}}function _s(e){return(e??[]).filter(t=>t&&t.id!=null).map(t=>({id:String(t.id),kind:t.kind==="dailyMood"?"dailyMood":"momentaryEmotion",date:Nt(t.date)||0,valence:_t(t.valence),labels:Array.isArray(t.labels)?t.labels:[],associations:Array.isArray(t.associations)?t.associations:[]}))}function Ys(e){return(e??[]).filter(t=>t&&t.id!=null).map(t=>({id:String(t.id),nickname:t.nickname??"",isArchived:!!t.isArchived,hasSchedule:!!t.hasSchedule,concept:{identifier:t.concept?.identifier??"",displayText:t.concept?.displayText??t.nickname??"Medication",form:t.concept?.form??"",rxnorm:Array.isArray(t.concept?.rxnorm)?t.concept.rxnorm:[]}}))}var Ut=new Set(["taken","skipped","snoozed","notInteracted"]);function Ks(e){return(e??[]).filter(t=>t&&t.id!=null).map(t=>({id:String(t.id),medicationId:t.medicationId!=null?String(t.medicationId):"",status:Ut.has(t.status)?t.status:"notInteracted",date:Nt(t.date)||0,scheduledQuantity:Number(t.scheduledQuantity)||0,doseQuantity:Number(t.doseQuantity)||0}))}function _t(e){let t=Number(e);return isFinite(t)?Math.max(-1,Math.min(1,t)):0}async function Yt({kind:e,valence:t,labels:s,associations:o,date:n}){let i={id:F(),kind:e==="dailyMood"?"dailyMood":"momentaryEmotion",date:n||Date.now(),valence:_t(t),labels:s||[],associations:o||[]};return await P("stateOfMind",i),i}async function Kt({nickname:e,form:t,hasSchedule:s}){let o=(e||"").trim()||"Medication",n={id:F(),nickname:o,isArchived:!1,hasSchedule:!!s,concept:{identifier:"",displayText:o,form:(t||"").trim(),rxnorm:[]}};return await P("medications",n),n}async function Gt({medicationId:e,status:t,date:s,doseQuantity:o}){let n={id:F(),medicationId:String(e),status:Ut.has(t)?t:"taken",date:s||Date.now(),scheduledQuantity:0,doseQuantity:Number(o)||0};return await P("doseEvents",n),n}async function Qt(e,t){await re(e,t)}async function Xt(){let[e,t,s]=await Promise.all([A("stateOfMind"),A("medications"),A("doseEvents")]);return e.sort((o,n)=>o.date-n.date),s.sort((o,n)=>o.date-n.date),{stateOfMind:e,medications:t,doseEvents:s}}var Rt=e=>{let t=new Date(e);return`${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`},Ft=e=>e.length?e.reduce((t,s)=>t+s,0)/e.length:null;function Jt(e,t){let s=new Set(t.map(a=>Rt(a.startedAt))),o=[],n=[];for(let a of e)(s.has(Rt(a.date))?o:n).push(a.valence);let i=Ft(o),r=Ft(n);return{onWorkout:i,offWorkout:r,delta:i!=null&&r!=null?i-r:null,onCount:o.length,offCount:n.length}}function Zt(e,t){let s=new Map;for(let o of t){if(o.status!=="taken"&&o.status!=="skipped")continue;let n=s.get(o.medicationId)??{taken:0,total:0};n.total+=1,o.status==="taken"&&(n.taken+=1),s.set(o.medicationId,n)}return e.map(o=>{let n=s.get(o.id)??{taken:0,total:0};return{medication:o,taken:n.taken,total:n.total,pct:n.total?n.taken/n.total:null}})}var Gs=Object.fromEntries(nt);async function rt(e,t){e.setTitle("Mental Health"),e.setBack(t),e.setAction(null);let[{stateOfMind:s,medications:o,doseEvents:n},i]=await Promise.all([Xt(),Z()]),r=()=>rt(e,t),a=s.length||o.length;e.container.innerHTML=`
    <div class="section">Log</div>
    <div class="form-section">
      <button class="list-row button" id="hz-log-mood">
        <div class="row-main"><div class="row-title" style="color: var(--accent);">\uFF0B Log State of Mind</div></div>
      </button>
      <button class="list-row button" id="hz-add-med">
        <div class="row-main"><div class="row-title" style="color: var(--accent);">\uFF0B Add Medication</div></div>
      </button>
      ${o.length?`
      <button class="list-row button" id="hz-log-dose">
        <div class="row-main"><div class="row-title" style="color: var(--accent);">\uFF0B Log a Dose</div></div>
      </button>`:""}
    </div>

    ${a?Xs(s,o,n,i):Qs()}

    <div class="section">Apple Health</div>
    <div class="form-section">
      <button class="list-row button" id="hz-import">
        <div class="row-main"><div class="row-title" style="color: var(--text-secondary);">Import Health data\u2026</div></div>
      </button>
    </div>
    <div class="section-footer">
      Optional: import a <b>health-import</b> JSON file exported from Apple Health
      (Lift can't read Health directly). Re-importing updates existing entries.
    </div>
    <input type="file" id="hz-file" accept=".json,application/json" style="display: none;" />
  `,e.container.scrollTop=0,e.container.querySelector("#hz-log-mood").addEventListener("click",()=>to(r)),e.container.querySelector("#hz-add-med").addEventListener("click",()=>so(r)),e.container.querySelector("#hz-log-dose")?.addEventListener("click",()=>oo(o,r));let u=e.container.querySelector("#hz-file");e.container.querySelector("#hz-import").addEventListener("click",()=>{u.value="",u.click()}),u.addEventListener("change",async l=>{let m=l.target.files?.[0];if(m)try{let x=await Vt(m);I(`Imported ${x.stateOfMind} moods, ${x.medications} meds, ${x.doseEvents} doses`),q("data:changed"),r()}catch(x){I(`Import failed: ${x.message}`)}});for(let l of e.container.querySelectorAll("[data-del-id]"))l.addEventListener("click",async()=>{confirm("Delete this entry?")&&(await Qt(l.dataset.delStore,l.dataset.delId),q("data:changed"),r())})}function Qs(){return`
    <div class="empty-state" style="padding: 32px 24px; min-height: auto;">
      <div class="empty-icon">\u{1F9E0}</div>
      <p style="color: var(--text-secondary); max-width: 300px;">
        No entries yet. Tap <b>Log State of Mind</b> or <b>Add Medication</b> above to start.
      </p>
    </div>`}function Xs(e,t,s,o){let n=Jt(e,o),i=Zt(t,s),r=s.slice(-15).reverse(),a=new Map(t.map(m=>[m.id,m.nickname||m.concept.displayText])),u=e.length?`
    <div class="section">State of Mind</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Entries</div><div class="stat-value">${e.length.toLocaleString()}</div></div>
      <div class="stat-row"><div class="stat-label">Range</div><div class="stat-value">${z(e[0].date)} \u2013 ${z(e[e.length-1].date)}</div></div>
      <div class="stat-row"><div class="stat-label">Average mood</div><div class="stat-value">${He(Zs(e))}</div></div>
    </div>

    <div class="section">Mood vs. training</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">On workout days</div><div class="stat-value">${n.onWorkout!=null?He(n.onWorkout)+` <span style="color:var(--text-tertiary)">(${n.onCount})</span>`:"\u2014"}</div></div>
      <div class="stat-row"><div class="stat-label">On rest days</div><div class="stat-value">${n.offWorkout!=null?He(n.offWorkout)+` <span style="color:var(--text-tertiary)">(${n.offCount})</span>`:"\u2014"}</div></div>
      <div class="stat-row"><div class="stat-label">Difference</div><div class="stat-value">${n.delta!=null?(n.delta>=0?"+":"")+n.delta.toFixed(2):"\u2014"}</div></div>
    </div>

    <div class="section">Recent entries</div>
    <div class="list">
      ${e.slice(-20).reverse().map(Js).join("")}
    </div>
  `:"",l=t.length?`
    <div class="section">Medications</div>
    <div class="list">
      ${i.map(m=>`
        <div class="list-row">
          <div class="row-main">
            <div class="row-title">${E(m.medication.nickname||m.medication.concept.displayText)}${m.medication.isArchived?' <span style="color:var(--text-tertiary)">(archived)</span>':""}</div>
            <div class="row-subtitle">${E([m.medication.concept.form].filter(Boolean).join(" \xB7 "))||"No form set"}</div>
          </div>
          <div class="row-trailing">${m.pct!=null?Math.round(m.pct*100)+"%":"\u2014"}<br><span style="font-size:12px;color:var(--text-tertiary)">${m.taken}/${m.total} taken</span></div>
          ${it("medications",m.medication.id)}
        </div>
      `).join("")}
    </div>
    <div class="section-footer">Adherence = taken \xF7 (taken + skipped).</div>

    ${r.length?`
    <div class="section">Recent doses</div>
    <div class="list">
      ${r.map(m=>`
        <div class="list-row">
          <div class="row-main">
            <div class="row-title">${E(a.get(m.medicationId)||"Medication")}</div>
            <div class="row-subtitle">${z(m.date)}</div>
          </div>
          <div class="row-trailing">${E(Gs[m.status]||m.status)}</div>
          ${it("doseEvents",m.id)}
        </div>
      `).join("")}
    </div>`:""}
  `:"";return u+l}function it(e,t){return`<button data-del-store="${e}" data-del-id="${E(t)}" aria-label="Delete" style="color: var(--text-tertiary); font-size: 18px; padding: 4px 8px; flex-shrink: 0;">\u2715</button>`}function Js(e){let t=e.labels.length?e.labels.join(", "):e.kind==="dailyMood"?"Daily mood":"Momentary";return`
    <div class="list-row">
      <div class="row-main">
        <div class="row-title">${E(t)}</div>
        <div class="row-subtitle">${z(e.date)}${e.associations.length?" \xB7 "+E(e.associations.join(", ")):""}</div>
      </div>
      <div class="row-trailing">${He(e.valence)}</div>
      ${it("stateOfMind",e.id)}
    </div>`}function Zs(e){return e.reduce((t,s)=>t+s.valence,0)/e.length}function He(e){let t=e>=.5?"Very pleasant":e>=.15?"Pleasant":e>-.15?"Neutral":e>-.5?"Unpleasant":"Very unpleasant";return`<span style="color: hsl(${Math.round((e+1)/2*140)} 65% 42%); font-weight: 600;">${t}</span>`}var eo=["Very Unpleasant","Unpleasant","Slightly Unpleasant","Neutral","Slightly Pleasant","Pleasant","Very Pleasant"];function ts(){let e=new Date,t=s=>String(s).padStart(2,"0");return`${e.getFullYear()}-${t(e.getMonth()+1)}-${t(e.getDate())}T${t(e.getHours())}:${t(e.getMinutes())}`}function ss(e){let t=e?new Date(e).getTime():NaN;return isFinite(t)?t:Date.now()}function es(e,t=[]){return e.map(s=>`<button type="button" class="chip${t.includes(s)?" active":""}" data-chip="${E(s)}">${E(s)}</button>`).join("")}function Oe(e,t,s={}){for(let o of e.querySelectorAll(`${t} .chip`))o.addEventListener("click",()=>{s.single&&e.querySelectorAll(`${t} .chip`).forEach(n=>n.classList.remove("active")),o.classList.toggle("active",s.single?!0:!o.classList.contains("active"))})}var We=(e,t)=>[...e.querySelectorAll(`${t} .chip.active`)].map(s=>s.dataset.chip);function to(e){let t=W({html:`
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
        <div class="form-section">
          <div class="form-row" style="flex-direction: column; align-items: stretch; gap: 8px;">
            <div id="som-val-label" style="text-align: center; font-weight: 600;"></div>
            <input type="range" class="chart-range" id="som-val" min="-3" max="3" step="1" value="1" />
          </div>
        </div>
        <div class="section">Emotions (optional)</div>
        <div class="chip-row" id="som-emotions" style="flex-wrap: wrap;">${es(jt)}</div>
        <div class="section">What's affecting you? (optional)</div>
        <div class="chip-row" id="som-assoc" style="flex-wrap: wrap;">${es(zt)}</div>
        <div class="section">When</div>
        <div class="form-section">
          <div class="form-row"><input type="datetime-local" id="som-date" value="${ts()}" style="text-align: left;" /></div>
        </div>
        <div style="height: 16px;"></div>
      </div>
    `,onMount(s){let o=s.querySelector("#som-val"),n=s.querySelector("#som-val-label"),i=()=>{let r=Number(o.value)+3,a=Number(o.value)/3,u=Math.round((a+1)/2*140);n.innerHTML=`<span style="color: hsl(${u} 65% 42%)">${eo[r]}</span>`};i(),o.addEventListener("input",i),Oe(s,"#som-kind",{single:!0}),Oe(s,"#som-emotions"),Oe(s,"#som-assoc"),s.querySelector("#som-cancel").addEventListener("click",()=>t()),s.querySelector("#som-save").addEventListener("click",async()=>{await Yt({kind:We(s,"#som-kind")[0]||"momentaryEmotion",valence:Number(o.value)/3,labels:We(s,"#som-emotions"),associations:We(s,"#som-assoc"),date:ss(s.querySelector("#som-date").value)}),t(),q("data:changed"),I("Logged State of Mind"),e?.()})}})}function so(e){let t=W({html:`
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
    `,onMount(s){let o=s.querySelector("#med-name"),n=s.querySelector("#med-save");o.addEventListener("input",()=>{n.disabled=o.value.trim().length===0}),s.querySelector("#med-cancel").addEventListener("click",()=>t()),n.addEventListener("click",async()=>{o.value.trim()&&(await Kt({nickname:o.value,form:s.querySelector("#med-form").value}),t(),q("data:changed"),I("Medication added"),e?.())}),setTimeout(()=>o.focus(),50)}})}function oo(e,t){let s=e.filter(i=>!i.isArchived),o=s.length?s:e,n=W({html:`
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
              ${o.map(i=>`<option value="${E(i.id)}">${E(i.nickname||i.concept.displayText)}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="section">Status</div>
        <div class="chip-row" id="dose-status">
          ${nt.map(([i,r],a)=>`<button type="button" class="chip${a===0?" active":""}" data-chip="${i}">${E(r)}</button>`).join("")}
        </div>
        <div class="section">When</div>
        <div class="form-section">
          <div class="form-row"><input type="datetime-local" id="dose-date" value="${ts()}" style="text-align: left;" /></div>
        </div>
      </div>
    `,onMount(i){Oe(i,"#dose-status",{single:!0}),i.querySelector("#dose-cancel").addEventListener("click",()=>n()),i.querySelector("#dose-save").addEventListener("click",async()=>{await Gt({medicationId:i.querySelector("#dose-med").value,status:We(i,"#dose-status")[0]||"taken",date:ss(i.querySelector("#dose-date").value),doseQuantity:1}),n(),q("data:changed"),I("Dose logged"),t?.()})}})}var ee=null;function os(e){let t=!0;return ns().then(s=>{t&&(ee=s,ge(e))}).catch(s=>{t&&(e.container.innerHTML=G(s))}),()=>{t=!1}}async function ns(){let[e,t,s]=await Promise.all([Z(),A("sets"),A("exercises")]),o=new Map(s.map(b=>[b.id,b])),n=new Map;for(let b of J(t))n.has(b.workoutId)||n.set(b.workoutId,[]),n.get(b.workoutId).push(b);let i=0,r=0,a=new Map,u=new Map,l=new Map,m=Lt(e,n,o);for(let b of e){let M=n.get(b.id)||[],h=M.reduce((v,$)=>v+$.weight*$.reps,0);if(i+=h,r+=M.length,h>0){let v=m.get(b.id);a.has(v)||a.set(v,[]),a.get(v).push({date:b.startedAt,value:h})}for(let v of M){let $=o.get(v.exerciseId);if(!$)continue;let k=u.get(v.exerciseId)||{id:v.exerciseId,exercise:$,count:0};if(k.count+=1,u.set(v.exerciseId,k),v.weight>0&&v.reps>0){let S=l.get(v.exerciseId);(!S||v.weight>S.weight||v.weight===S.weight&&v.reps>S.reps)&&l.set(v.exerciseId,{id:v.exerciseId,weight:v.weight,reps:v.reps,date:b.startedAt,name:Q($)})}}}let x=Array.from(u.entries()).sort((b,M)=>M[1].count-b[1].count).map(([,b])=>b),d=Array.from(l.values()).sort((b,M)=>M.weight-b.weight),f=N.filter(b=>a.has(b)).map(b=>({label:Te[b].short,color:Ce(b),points:a.get(b)}));return{workouts:e,allSets:t,allExercises:s,exMap:o,setsByWorkout:n,totalVolume:i,totalSets:r,volumeSeries:f,topExercises:x,prs:d}}function ge(e){if(e.setTitle("Progress"),e.setBack(null),e.setAction({label:"Backup and restore",html:xt(),onClick:()=>Wt()}),e.container.scrollTop=0,!ee||ee.workouts.length===0){e.container.innerHTML=`
      <div class="empty-state">
        <div class="empty-icon">\u{1F4C8}</div>
        <h2>No data yet</h2>
        <p>Finish a workout and your stats and trends will show up here.</p>
      </div>
    `;return}let{workouts:t,totalVolume:s,totalSets:o,volumeSeries:n,topExercises:i,prs:r}=ee;e.container.innerHTML=`
    <div class="section">Totals</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Total Volume</div><div class="stat-value">${ce(s)}</div></div>
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
      <button class="list-row" data-page="health">
        <div class="row-main">
          <div class="row-title">Mental Health</div>
          <div class="row-subtitle">Mood &amp; medications from Apple Health</div>
        </div>
        <div class="chevron">\u203A</div>
      </button>
    </div>
  `;let a=e.container.querySelector(".volume-chart-mount");a&&n.length>0&&ye(a,n,{unit:"lbs"});for(let u of e.container.querySelectorAll("[data-page]"))u.addEventListener("click",()=>{let l=u.dataset.page;l==="trained"?no(e):l==="prs"?io(e):l==="history"?is(e):l==="health"&&rt(e,()=>ge(e)).catch(m=>{e.container.innerHTML=G(m)})})}function no(e){e.setTitle("Most-Trained"),e.setBack(()=>ge(e)),e.setAction(null);let{topExercises:t}=ee;e.container.innerHTML=`
    <div class="list" style="margin-top: 16px;">
      ${t.map(s=>`
        <button class="list-row" data-exercise-id="${E(s.id)}">
          ${se(s.exercise)}
          <div class="row-trailing trailing-stack">${oe(s.count)}</div>
          <div class="chevron">\u203A</div>
        </button>
      `).join("")}
    </div>
  `,e.container.scrollTop=0,at(e)}function io(e){e.setTitle("Personal Records"),e.setBack(()=>ge(e)),e.setAction(null);let{prs:t}=ee;e.container.innerHTML=`
    <div class="section-footer" style="margin-top: 16px;">Heaviest set ever recorded per exercise.</div>
    <div class="list">
      ${t.map(s=>`
        <button class="list-row" data-exercise-id="${E(s.id)}" style="align-items: flex-start;">
          <div class="row-main">
            <div class="row-title">${E(s.name)}</div>
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
  `,e.container.scrollTop=0,at(e)}function at(e){for(let t of e.container.querySelectorAll("[data-exercise-id]"))t.addEventListener("click",()=>{Re(t.dataset.exerciseId)})}function is(e){e.setTitle("Workout History"),e.setBack(()=>ge(e)),e.setAction(null);let{workouts:t,setsByWorkout:s,exMap:o}=ee;e.container.innerHTML=`
    <div class="list" style="margin-top: 16px;">
      ${t.map(n=>ro(n,s.get(n.id)||[],o)).join("")}
    </div>
  `,e.container.scrollTop=0;for(let n of e.container.querySelectorAll("[data-workout-id]"))n.addEventListener("click",()=>{let i=n.dataset.workoutId;ao(e,i).catch(r=>{e.container.innerHTML=G(r)})})}function ro(e,t,s){let o=t,n=o.reduce((u,l)=>u+l.weight*l.reps,0),i=(e.endedAt-e.startedAt)/1e3,r=[],a=new Set;for(let u of t){if(a.has(u.exerciseId))continue;a.add(u.exerciseId);let l=s.get(u.exerciseId);if(l&&r.push(l.name),r.length>=3)break}return`
    <button class="list-row" data-workout-id="${e.id}">
      <div class="row-main">
        <div class="row-title" style="font-weight: 600;">${E(e.name)}</div>
        <div class="row-subtitle" style="margin-top: 4px;">
          ${z(e.startedAt)} \xB7 ${_e(i)} \xB7 ${o.length} sets \xB7 ${ce(n)}
        </div>
        ${r.length>0?`<div class="row-subtitle" style="margin-top: 4px;">${E(r.join(" \xB7 "))}${a.size>3?" \u2026":""}</div>`:""}
      </div>
      <div class="chevron">\u203A</div>
    </button>
  `}async function rs(e){let[t,s,o]=await Promise.all([me("workouts",e),A("exercises"),pt(e)]);if(!t)return null;let n=new Map(s.map(d=>[d.id,d])),i=new Map,r=[];for(let d of o)i.has(d.exerciseId)||(i.set(d.exerciseId,[]),r.push(d.exerciseId)),i.get(d.exerciseId).push(d);let a=J(o),u=a.reduce((d,f)=>d+f.weight*f.reps,0),l=a.length,m=(t.endedAt-t.startedAt)/1e3,x=`
    <div class="section">Summary</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Date</div><div class="stat-value">${bt(t.startedAt)}</div></div>
      <div class="stat-row"><div class="stat-label">Duration</div><div class="stat-value">${_e(m)}</div></div>
      <div class="stat-row"><div class="stat-label">Total Volume</div><div class="stat-value">${ce(u)}</div></div>
      <div class="stat-row"><div class="stat-label">Completed Sets</div><div class="stat-value">${l}</div></div>
    </div>

    ${r.map(d=>{let f=n.get(d),b=i.get(d),M=0,h=0;return`
        ${f?`<button class="section section-link" data-exercise-id="${E(d)}">${E(Q(f))}<span class="name-chevron">\u203A</span></button>`:'<div class="section">Unknown exercise</div>'}
        <div class="form-section">
          ${b.map($=>{let S=($.setType||"working")==="warmup"?`W${++h}`:String(++M);return`
              <div class="stat-row">
                <div class="stat-label">Set ${S}</div>
                <div class="stat-value hist-edit">
                  <input class="hist-input" type="number" inputmode="decimal" step="0.5" aria-label="Weight in pounds for set ${S}"
                         data-set-id="${$.id}" data-field="weight" value="${$.weight>0?$.weight:""}" placeholder="0" />
                  <span>lbs \xD7</span>
                  <input class="hist-input" type="number" inputmode="numeric" step="1" aria-label="Repetitions for set ${S}"
                         data-set-id="${$.id}" data-field="reps" value="${$.reps>0?$.reps:""}" placeholder="0" />
                </div>
              </div>
            `}).join("")}
        </div>
      `}).join("")}
  `;return{workout:t,html:x,sets:o}}function as(e,t){for(let s of e.querySelectorAll("input.hist-input[data-set-id]"))s.addEventListener("input",async()=>{let o=t.find(n=>n.id===s.dataset.setId);o&&(s.dataset.field==="weight"?o.weight=parseFloat(s.value)||0:o.reps=parseInt(s.value,10)||0,await P("sets",{...o}))})}async function ao(e,t){e.setBack(async()=>{ee=await ns(),is(e)}),e.setAction({label:"Delete workout",html:De(),onClick:async()=>{confirm("Delete this workout?")&&(await Le(t),q("data:changed"))}});let s=await rs(t);if(!s){e.container.innerHTML=G({message:"Workout not found."});return}e.setTitle(s.workout.name),e.container.innerHTML=s.html,e.container.scrollTop=0,at(e),as(e.container,s.sets)}async function cs(e){let t=await rs(e);if(!t)return;let s=W({html:`
      <div class="sheet-header">
        <button class="btn-text" id="wd-close">Done</button>
        <div class="title">${E(t.workout.name)}</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">${t.html}</div>
    `,onMount(o){o.querySelector("#wd-close").addEventListener("click",()=>s());for(let n of o.querySelectorAll("[data-exercise-id]"))n.addEventListener("click",()=>Re(n.dataset.exerciseId));as(o,t.sets)}})}function ls(e){let t=!0;return ds(e).catch(s=>{t&&(e.container.innerHTML=G(s))}),()=>{t=!1}}async function ds(e){e.setTitle("Exercises"),e.setBack(null),e.setAction({label:"Add exercise",html:'<span style="font-size: 24px;">+</span>',onClick:()=>{we(null)}});let[t,s]=await Promise.all([A("exercises"),A("sets")]),o=t.sort((d,f)=>d.name.localeCompare(f.name)),n=new Map;for(let d of s)n.set(d.exerciseId,(n.get(d.exerciseId)??0)+1);let i="",r=null;e.container.innerHTML=`
    <div class="search-bar">
      <input class="search-input" id="ex-search" placeholder="Search exercises" />
    </div>
    <div class="chip-row" id="ex-chips"></div>
    <div class="list" id="ex-list"></div>
  `,e.container.scrollTop=0;let a=e.container.querySelector("#ex-list"),u=e.container.querySelector("#ex-chips"),l=e.container.querySelector("#ex-search");function m(){u.innerHTML=Be(o,r);for(let d of u.querySelectorAll(".chip"))d.addEventListener("click",()=>{let f=d.dataset.cat;r=f==="All"?null:f,m(),x()})}function x(){let d=o.filter(f=>!r||R(f)===r).filter(f=>!i||f.name.toLowerCase().includes(i.toLowerCase()));if(d.length===0){a.innerHTML='<div class="list-row"><div class="row-main" style="color: var(--text-secondary);">No matches</div></div>';return}a.innerHTML=d.map(f=>`
        <button class="list-row" data-id="${f.id}">
          ${se(f)}
          <div class="row-trailing trailing-stack">${oe(n.get(f.id)??0)}</div>
          <div class="chevron">\u203A</div>
        </button>
      `).join("");for(let f of a.querySelectorAll("[data-id]"))f.addEventListener("click",()=>{co(e,f.dataset.id).catch(b=>{e.container.innerHTML=G(b)})})}l.addEventListener("input",()=>{i=l.value,x()}),m(),x()}function co(e,t){return Fe(e,t,()=>ds(e))}async function Fe(e,t,s){e.setBack(s);let o=await ps(t);if(!o){e.container.innerHTML=G({message:"Exercise not found."});return}e.setTitle(Q(o.exercise)),e.setAction(o.exercise.isCustom?{label:"Delete exercise",html:De(),onClick:async()=>{if(o.completed.length>0){alert(`Can't delete \u2014 this exercise has ${o.completed.length} logged set${o.completed.length===1?"":"s"}.`);return}confirm("Delete this custom exercise?")&&(await re("exercises",t),q("data:changed"))}}:null),e.container.innerHTML=o.html,e.container.scrollTop=0,e.container.querySelector("#exd-edit")?.addEventListener("click",()=>{we(o.exercise,()=>Fe(e,t,s))}),us(e.container);let n=e.container.querySelector(".exercise-chart-mount");n&&o.chartData.length>0&&ye(n,o.chartData,{unit:"lbs"})}function us(e){for(let t of e.querySelectorAll(".recent-set[data-workout-id]"))t.addEventListener("click",()=>cs(t.dataset.workoutId))}async function Re(e){let t=await ps(e);if(!t)return;let s=W({html:`
      <div class="sheet-header">
        <button class="btn-text" id="exd-close">Done</button>
        <div class="title">${E(Q(t.exercise))}</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">${t.html}</div>
    `,onMount(o){o.querySelector("#exd-close").addEventListener("click",()=>s()),o.querySelector("#exd-edit")?.addEventListener("click",()=>{we(t.exercise,()=>{s(),q("data:changed"),Re(e)})}),us(o);let n=o.querySelector(".exercise-chart-mount");n&&t.chartData.length>0&&ye(n,t.chartData,{unit:"lbs"})}})}async function ps(e){let[t,s,o,n]=await Promise.all([me("exercises",e),A("sets"),A("workouts"),ae()]);if(!t)return null;let i=new Map(o.map(d=>[d.id,d])),r=J(s).filter(d=>d.exerciseId===e&&d.workoutId!==n?.id&&i.has(d.workoutId)).map(d=>({...d,workout:i.get(d.workoutId)})).sort((d,f)=>d.workout.startedAt-f.workout.startedAt),a=r.reduce((d,f)=>d+f.weight*f.reps,0),u=r.reduce((d,f)=>!d||f.weight>d.weight||f.weight===d.weight&&f.reps>d.reps?f:d,null),l=new Map;for(let d of r){if(d.weight<=0||d.reps<=0||(d.setType||"working")==="warmup")continue;let f=l.get(d.workoutId)||{date:d.workout.startedAt,total:0,count:0};f.total+=d.weight*d.reps,f.count+=1,l.set(d.workoutId,f)}let m=Array.from(l.values()).map(({date:d,total:f,count:b})=>({date:d,value:f/b})).sort((d,f)=>d.date-f.date),x=`
    <div class="section">Details</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Equipment</div><div class="stat-value">${E(t.equipment)}</div></div>
      <div class="stat-row"><div class="stat-label">Muscle</div><div class="stat-value">${E(R(t))}</div></div>
      <button class="list-row button" id="exd-edit">
        <div class="row-main"><div class="row-title" style="color: var(--accent);">Edit Name, Muscle & Equipment</div></div>
      </button>
    </div>

    ${r.length>0?`
      <div class="section">Stats</div>
      <div class="form-section">
        <div class="stat-row"><div class="stat-label">Total Sets</div><div class="stat-value">${r.length.toLocaleString()}</div></div>
        <div class="stat-row"><div class="stat-label">Total Volume</div><div class="stat-value">${ce(a)}</div></div>
        ${u?`<div class="stat-row"><div class="stat-label">Best Set</div><div class="stat-value">${ve(u.weight)} \xD7 ${u.reps}</div></div>`:""}
      </div>
    `:""}

    ${m.length>0?`
      <div class="section">Avg working-set volume per workout</div>
      <div class="exercise-chart-mount"></div>
    `:""}

    ${r.length>0?`
      <div class="section">Recent Sets \xB7 tap to view that workout</div>
      <div class="form-section">
        ${r.slice(-30).reverse().map(d=>`
          <button class="stat-row recent-set" data-workout-id="${E(d.workoutId)}">
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
  `;return{exercise:t,completed:r,chartData:m,html:x}}function hs(e){let t=!0,s=null;return e.container.innerHTML="",ae().then(o=>{t&&(o?s=mo(e,o):lo(e))}).catch(o=>{t&&(e.container.innerHTML=`<div class="empty-state"><div class="empty-icon">!</div><h2>Couldn't load</h2><p>${E(o.message)}</p></div>`)}),()=>{t=!1,typeof s=="function"&&s()}}async function lo(e){e.setTitle("Workout");let t=await Z(),s=t[0],o=Qe(t),n=o?Ie(o.normalized):N[0],r=o&&ms(o.startedAt)==="today"?"Tomorrow":"Today",a=s?`<div class="last-workout-hint">Last: <strong>${E(s.name)}</strong> \xB7 ${ms(s.startedAt)}</div>`:"",u=`<div class="next-workout-hint">${r}: <strong>${E(n)}</strong></div>`;e.container.innerHTML=`
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
  `,e.container.querySelector("#start-btn").addEventListener("click",()=>uo(n,r))}function ms(e){let t=new Date,s=new Date(e),o=i=>new Date(i.getFullYear(),i.getMonth(),i.getDate()).getTime(),n=Math.round((o(t)-o(s))/(1440*60*1e3));return n===0?"today":n===1?"yesterday":n<7?`${n} days ago`:n<14?"a week ago":`${Math.round(n/7)} weeks ago`}function uo(e,t="Today"){po(e,async s=>{let o={id:F(),name:s,startedAt:Date.now(),endedAt:null,notes:""};await P("workouts",o),q("workout:changed")},t)}function po(e,t,s="Today"){let n=W({html:`
      <div class="sheet-header">
        <button class="btn-text" id="wt-cancel">Cancel</button>
        <div class="title">New Workout</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">
        <div class="section">Pick a type</div>
        <div class="form-section">
          ${N.map(i=>{let a=i===e?` <span class="badge">${E(s)}</span>`:"";return`
              <button class="list-row button" data-name="${E(i)}">
                <div class="row-main"><div class="row-title" style="color: ${Ce(i)}; font-weight: 600;">${E(i)}${a}</div></div>
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
    `,onMount(i){i.querySelector("#wt-cancel").addEventListener("click",()=>n());for(let u of i.querySelectorAll(".list-row.button[data-name]"))u.addEventListener("click",()=>{let l=u.dataset.name;n(),t(l)});let r=i.querySelector("#wt-custom"),a=i.querySelector("#wt-go");r.addEventListener("input",()=>{a.disabled=r.value.trim().length===0}),a.addEventListener("click",()=>{let u=r.value.trim();u&&(n(),t(u))}),setTimeout(()=>r.focus(),50)}})}function mo(e,t){let s=[],o=[],n=new Map,i=new Map,r=null;e.container.innerHTML=`
    <div class="active-workout">
      <div class="workout-header">
        <input class="workout-name-input" id="wname" value="${E(t.name)}" placeholder="Workout name" />
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
  `,e.container.querySelector("#calc-fab").addEventListener("click",ko);let a=()=>{e.setTitle(wt((Date.now()-t.startedAt)/1e3))};a(),r=setInterval(a,1e3);let u=e.container.querySelector("#wname");u.addEventListener("input",async()=>{t.name=u.value,await P("workouts",{...t}),ne()});let l=new Map;e.container.querySelector("#add-exercise-btn").addEventListener("click",()=>{bo(s,i,async h=>{await yo(t,o,h),await m()})}),e.container.querySelector("#finish-btn").addEventListener("click",async()=>{if(confirm("Finish this workout?")){await wo(t,o);try{let{filename:h}=await st();I(`Saved \xB7 backup: ${h}`)}catch(h){I(`Saved \xB7 backup failed: ${h.message}`)}q("workout:changed")}}),e.container.querySelector("#discard-btn").addEventListener("click",async()=>{confirm("Discard this workout? This cannot be undone.")&&(await Le(t.id),q("workout:changed"))});async function m(){let[h,v,$]=await Promise.all([A("sets"),A("workouts"),A("exercises")]);s=$,o=h.filter(k=>k.workoutId===t.id).sort((k,S)=>k.order-S.order),n=ft(h,v,t.id),l=f(h,$,t.id),i=new Map;for(let k of h)i.set(k.exerciseId,(i.get(k.exerciseId)??0)+1);M(),x()}function x(){let h=new Map(s.map(w=>[w.id,w])),v=[],$=new Map;for(let w of o){let D=h.get(w.exerciseId);if(!D)continue;let L=R(D);if(v.includes(L)||v.push(L),!w.completed)continue;let C=(w.weight||0)*(w.reps||0);C<=0||$.set(L,($.get(L)??0)+C)}let k=[...$.values()].reduce((w,D)=>w+D,0),S=e.container.querySelector("#workout-progress");if(!S)return;if(v.length===0){S.innerHTML="";return}let B=v.map(w=>{let D=l.get(w)??0,L=$.get(w)??0;return{muscle:w,record:D,cur:L,span:Math.max(D,L)}}),T=Math.max(...B.map(w=>w.span)),p=T>0?T*.12:1;B=B.map(w=>({...w,span:Math.max(w.span,p)}));let c=Math.max(...B.map(w=>w.span)),y=B.map(({muscle:w,record:D,cur:L,span:C})=>{let H=C/c*100,V=L>0?Math.min(100,L/C*100):0,O;if(D>0){let le=Math.round(L/D*100);O=L>D?`${le}% \u{1F525}`:`${le}%`}else O=L>0?"new \u{1F525}":"new";let U=D>0?`${K(L)} / ${K(D)} \xB7 ${O}`:`${K(L)} \xB7 ${O}`,_=Et(w);return`
        <div class="vol-muscle" style="width: ${H.toFixed(2)}%; --mcolor: ${_}; --mtext: ${Dt(_)};" title="${E(w)}: ${K(L)} / record ${K(D)} lbs">
          <div class="vol-fill" style="width: ${V.toFixed(2)}%;"></div>
          <div class="vol-info${V>55?" on-fill":""}">
            <span class="seg-name">${E(w)}</span>
            <span class="seg-vol">${U}</span>
          </div>
        </div>
      `}).join(""),g=`<strong>${K(k)} lbs</strong> total`;S.innerHTML=`
      <div class="vol-bars">${y}</div>
      <div class="vol-label">${g}</div>
    `,requestAnimationFrame(()=>{for(let w of S.querySelectorAll(".vol-muscle"))d(w)})}function d(h){let v=h.querySelector(".seg-name"),$=h.querySelector(".seg-vol"),k=h.clientWidth-4;if(k<=0)return;if($){let B=10;for($.style.fontSize=`${B}px`;$.scrollWidth>k&&B>6;)B-=.5,$.style.fontSize=`${B}px`}if(!v)return;v.style.display="";let S=11;for(v.style.fontSize=`${S}px`;v.scrollWidth>k&&S>5;)S-=.5,v.style.fontSize=`${S}px`}function f(h,v,$){let k=new Map(v.map(T=>[T.id,T])),S=new Map,B=new Map;for(let T of J(h)){if(T.workoutId===$)continue;let p=k.get(T.exerciseId);if(!p)continue;let c=(T.weight||0)*(T.reps||0);if(c<=0)continue;let y=R(p),g=B.get(T.workoutId);g||B.set(T.workoutId,g=new Map),g.set(y,(g.get(y)??0)+c)}for(let T of B.values())for(let[p,c]of T)c>(S.get(p)??0)&&S.set(p,c);return S}async function b(h){if(!h.completed||(h.setType||"working")==="warmup"||!(h.weight>0)||!(h.reps>0))return;let v=s.find(c=>c.id===h.exerciseId);if(!v)return;let $=await A("sets"),k=J($).filter(c=>c.exerciseId===h.exerciseId&&c.id!==h.id&&(c.setType||"working")!=="warmup"&&c.weight>0&&c.reps>0);if(k.length===0)return;let S=[],B=k.reduce((c,y)=>Math.max(c,y.weight),0);h.weight>B&&S.push(`Heaviest weight ever: ${fe(h.weight)} lbs`);let T=h.weight*h.reps,p=k.reduce((c,y)=>Math.max(c,y.weight*y.reps),0);if(T>p&&S.push(`Most volume in a set: ${fe(h.weight)}\xD7${h.reps} = ${K(T)} lbs`),S.length>0){let c=S.length>1?"New records":"New record";I(`\u{1F3C6} ${Q(v)} \u2014 ${c}!
${S.join(`
`)}`,0,{persistUntilClick:!0})}}function M(){let h=new Map(s.map(p=>[p.id,p])),v=[],$=new Map;for(let p of o)$.has(p.exerciseId)||($.set(p.exerciseId,[]),v.push(p.exerciseId)),$.get(p.exerciseId).push(p);for(let[,p]of $)p.sort((c,y)=>c.order-y.order);let k=e.container.querySelector("#exercise-sections");if(v.length===0){k.innerHTML=`
        <div class="empty-state" style="padding: 40px 24px; min-height: auto;">
          <p style="color: var(--text-secondary);">Add an exercise to start logging sets.</p>
        </div>`;return}k.innerHTML=v.map(p=>{let c=h.get(p),y=$.get(p),g=n.get(p)??new Map;return fo(c,y,g,i.get(p)??0)}).join("");function S(p){delete p.bumpedBy,delete p.preBumpWeight,delete p.preBumpReps}function B(p){let c=o.filter(L=>L.exerciseId===p.exerciseId).sort((L,C)=>L.order-C.order),y=p.setType||"working",g=0,w=0;for(let L of c)if(w+=1,(L.setType||"working")===y&&(g+=1),L.id===p.id)break;let D=be(y,g,n.get(p.exerciseId),w);return D&&D.weight>0&&D.reps>0?{weight:D.weight,reps:D.reps}:null}async function T(p){await vs(p.id,o),p.completed&&await fs(p,o,B);for(let c of o){if(c.exerciseId!==p.exerciseId)continue;let y=k.querySelector(`.set-row[data-set-id="${c.id}"]`);if(!y)continue;let g=y.querySelector(".weight-input"),w=y.querySelector(".reps-input");g&&document.activeElement!==g&&(g.value=c.weight>0?String(c.weight):""),w&&document.activeElement!==w&&(w.value=c.reps>0?String(c.reps):"")}}for(let p of k.querySelectorAll(".set-row-wrap")){let c=p.querySelector(".set-row"),y=c.dataset.setId,g=o.find(O=>O.id===y);if(!g)continue;let w=c.querySelector(".weight-input"),D=c.querySelector(".reps-input"),L=c.querySelector(".complete-btn");ho(p,async()=>{await re("sets",g.id),await m()});let C=Ye(async()=>{await T(g),g.completed&&x()},200);w.addEventListener("input",()=>{g.weight=parseFloat(w.value)||0,S(g),P("sets",{...g}).catch(O=>console.error("Set save failed",O)),C()});let H=Ye(async()=>{await T(g),g.completed&&x()},200);D.addEventListener("input",()=>{g.reps=parseInt(D.value,10)||0,S(g),P("sets",{...g}).catch(O=>console.error("Set save failed",O)),H()}),L.addEventListener("click",async()=>{let O=g.completed;g.completed=!g.completed,g.completed&&S(g),await P("sets",g),c.classList.toggle("completed",g.completed),L.innerHTML=ys(g.completed);let U=c.querySelector(".set-number")?.textContent?.trim()||"";L.setAttribute("aria-label",`${g.completed?"Mark incomplete":"Mark complete"} set ${U}`),x(),!O&&g.completed?(await fs(g,o,B)&&M(),await b(g)):O&&!g.completed&&await vs(g.id,o)&&M()});let V=c.querySelector(".set-number");V&&V.addEventListener("click",async()=>{let U=(g.setType||"working")==="warmup"?"working":"warmup";if(g.setType=U,!g.completed){let _=o.filter(ie=>ie.exerciseId===g.exerciseId).sort((ie,bs)=>ie.order-bs.order),le=0,lt=0;for(let ie of _)if(lt+=1,(ie.setType||"working")===U&&(le+=1),ie.id===g.id)break;let de=be(U,le,n.get(g.exerciseId),lt);de&&de.weight>0&&de.reps>0&&(g.weight=de.weight,g.reps=de.reps)}await P("sets",g),M()})}for(let p of k.querySelectorAll(".add-set-btn"))p.addEventListener("click",async()=>{let c=p.dataset.exerciseId;await go(t,o,c,n.get(c)??new Map),await m()});for(let p of k.querySelectorAll(".exercise-menu"))p.addEventListener("click",async()=>{let c=p.dataset.exerciseId;confirm("Remove this exercise from the workout?")&&(await Ve("sets",o.filter(y=>y.exerciseId===c).map(y=>y.id)),await m())});for(let p of k.querySelectorAll(".exercise-name-btn"))p.addEventListener("click",()=>{r&&(clearInterval(r),r=null),Fe(e,p.dataset.exerciseId,()=>e.refresh())})}return m(),()=>{r&&clearInterval(r)}}function fo(e,t,s=new Map,o=0){let n=0,i=0,r=t.map((a,u)=>{let l=a.setType||"working",m,x;l==="warmup"?(i+=1,x=i,m=`W${i}`):(n+=1,x=n,m=String(n));let d=be(l,x,s,u+1);return vo(a,m,d)}).join("");return`
    <div class="exercise-section">
      <div class="exercise-section-header">
        <button class="exercise-name-btn" data-exercise-id="${e?.id}">${se(e)}</button>
        <div class="row-trailing trailing-stack">${oe(o)}</div>
        <button class="menu exercise-menu" data-exercise-id="${e?.id}" aria-label="Remove ${E(Q(e))} from workout">\xD7</button>
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
  `}function be(e,t,s,o=null){if(!s||typeof s.get!="function")return null;let n=s.get(`${e}#${t}`);return n||(o!=null?s.get(`any#${o}`)??null:null)}function vo(e,t,s){let o=e.setType||"working",n=s&&s.weight>0&&s.reps>0?`${fe(s.weight)} \xD7 ${s.reps}`:"\u2014";return`
    <div class="set-row-wrap" data-set-id="${e.id}">
      <button class="set-swipe-delete" data-set-id="${e.id}" aria-label="Delete set ${t}">Delete</button>
      <div class="set-row type-${o}${e.completed?" completed":""}" data-set-id="${e.id}">
        <button class="set-number" aria-label="Set ${t}, tap to mark as ${o==="warmup"?"working":"warmup"}">${t}</button>
        <div class="prev" aria-label="Previous">${n}</div>
        <input class="weight-input" type="number" inputmode="decimal" step="0.5" aria-label="Weight in pounds for set ${t}"
               placeholder="0" value="${e.weight>0?e.weight:""}" />
        <input class="reps-input" type="number" inputmode="numeric" step="1" aria-label="Repetitions for set ${t}"
               placeholder="0" value="${e.reps>0?e.reps:""}" />
        <button class="complete-btn" aria-label="${e.completed?"Mark incomplete":"Mark complete"} set ${t}">${ys(e.completed)}</button>
      </div>
    </div>
  `}function ho(e,t){let s=e.querySelector(".set-row"),o=e.querySelector(".set-swipe-delete");if(!s||!o)return;let n=88,i=0,r=0,a=0,u=0,l=!1,m=!1,x=!1,d=!1,f=()=>Math.max(140,i*.5);function b(k,S){s.style.transition=S?"transform 0.18s ease":"none",s.style.transform=`translateX(${k}px)`,o.style.width=`${Math.max(n,-k)}px`,e.classList.toggle("will-delete",k<=-f())}function M(k=!0){x=!1,b(0,k),e.classList.remove("swiped-open")}function h(k=!0){document.querySelectorAll(".set-row-wrap.swiped-open").forEach(S=>{if(S!==e){let B=S.querySelector(".set-row");B&&(B.style.transition="transform 0.18s ease",B.style.transform="translateX(0)");let T=S.querySelector(".set-swipe-delete");T&&(T.style.width=""),S.classList.remove("swiped-open","will-delete")}}),x=!0,b(-n,k),e.classList.add("swiped-open")}function v(){s.style.transition="transform 0.16s ease-out",s.style.transform=`translateX(${-i}px)`,o.style.width=`${i}px`,setTimeout(t,150)}s.addEventListener("touchstart",k=>{i=e.clientWidth||s.clientWidth,r=k.touches[0].clientX,a=k.touches[0].clientY,u=x?-n:0,l=!0,m=!1,d=!!k.target.closest("input, button, select, textarea")},{passive:!0}),s.addEventListener("touchmove",k=>{if(!l)return;let S=k.touches[0].clientX-r,B=k.touches[0].clientY-a;if(!m){if(Math.abs(B)>Math.abs(S)+4){l=!1;return}Math.abs(S)>8&&(m=!0,d&&document.activeElement?.blur&&document.activeElement.blur())}if(!m)return;k.cancelable&&k.preventDefault();let T=x?-n:0;u=Math.min(0,Math.max(-i,T+S)),b(u,!1)},{passive:!1});function $(){l&&(l=!1,m&&(u<=-f()?v():u<-n/2?h():M()))}s.addEventListener("touchend",$),s.addEventListener("touchcancel",$),o.addEventListener("click",k=>{k.stopPropagation(),t()})}function ys(e){return e?'<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>':'<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>'}async function yo(e,t,s){let o=t.reduce((n,i)=>Math.max(n,i.order),-1)+1;for(let n of s){let i=(await mt(n,e.id)).filter(u=>(u.weight||0)>0&&(u.reps||0)>0),a=(i.length>0?i:[{weight:0,reps:0,setType:"working"}]).map(u=>({id:F(),workoutId:e.id,exerciseId:n,weight:u.weight??0,reps:u.reps??0,setType:u.setType||"working",completed:!1,order:o++,createdAt:Date.now()}));await Y("sets",a)}}async function fs(e,t,s){let o=(e.weight||0)*(e.reps||0);if(o<=0)return!1;let n=!1;for(let i of t)if(i.exerciseId===e.exerciseId&&i.id!==e.id&&!((i.order??0)<=(e.order??0))&&!i.completed&&(i.weight||0)*(i.reps||0)<o){if(i.bumpedBy==null){let r=s?.(i);i.preBumpWeight=r?r.weight:i.weight,i.preBumpReps=r?r.reps:i.reps}i.bumpedBy=e.id,i.weight=e.weight,i.reps=e.reps,await P("sets",i),n=!0}return n}async function vs(e,t){let s=!1;for(let o of t)o.bumpedBy===e&&(o.completed||(o.preBumpWeight!=null&&(o.weight=o.preBumpWeight),o.preBumpReps!=null&&(o.reps=o.preBumpReps)),delete o.bumpedBy,delete o.preBumpWeight,delete o.preBumpReps,await P("sets",o),s=!0);return s}async function go(e,t,s,o=new Map){let n=t.filter(M=>M.exerciseId===s),i=n[n.length-1],r=M=>(M?.weight||0)*(M?.reps||0),a=n.filter(M=>(M.setType||"working")!=="warmup"),u=a.length+1,l=be("working",u,o,n.length+1),m=a.filter(M=>M.weight>0&&M.reps>0).reduce((M,h)=>!M||r(h)>r(M)?h:M,null),x=a.some((M,h)=>{let v=be("working",h+1,o);return v&&v.weight>0&&v.reps>0&&r(M)>r(v)}),d=i?.weight??0,f=i?.reps??0;m&&(!l||x)&&(d=m.weight,f=m.reps);let b={id:F(),workoutId:e.id,exerciseId:s,weight:d,reps:f,completed:!1,order:(i?.order??-1)+1,createdAt:Date.now()};await P("sets",b)}async function wo(e,t){await Ve("sets",t.filter(s=>!s.completed&&((s.weight||0)===0||(s.reps||0)===0)).map(s=>s.id)),e.endedAt=Date.now(),await P("workouts",e)}function bo(e,t,s){let o=new Set,n="",i=null,r=W({html:`
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
    `,onMount(a){let u=a.querySelector("#picker-list"),l=a.querySelector("#picker-add"),m=a.querySelector("#picker-cancel"),x=a.querySelector("#picker-custom"),d=a.querySelector("#picker-search"),f=a.querySelector("#picker-chips");function b(){f.innerHTML=Be(e,i);for(let h of f.querySelectorAll(".chip"))h.addEventListener("click",()=>{let v=h.dataset.cat;i=v==="All"?null:v,b(),M()})}function M(){let h=e.filter(v=>!i||R(v)===i).filter(v=>!n||v.name.toLowerCase().includes(n.toLowerCase())).sort((v,$)=>{let k=t.get(v.id)??0,S=t.get($.id)??0;return k!==S?S-k:v.name.localeCompare($.name)});u.innerHTML=h.length===0?'<div class="list-row"><div class="row-main" style="color:var(--text-secondary)">No matches</div></div>':h.map(v=>`
                <button class="list-row" data-id="${v.id}">
                  ${se(v)}
                  <div class="row-trailing trailing-stack">
                    ${oe(t.get(v.id)??0)}
                    ${o.has(v.id)?xo():""}
                  </div>
                </button>
              `).join("");for(let v of u.querySelectorAll(".list-row[data-id]"))v.addEventListener("click",()=>{let $=v.dataset.id;o.has($)?o.delete($):o.add($),l.disabled=o.size===0,l.textContent=o.size===0?"Add":`Add (${o.size})`,M()})}d.addEventListener("input",()=>{n=d.value,M()}),m.addEventListener("click",()=>r()),l.addEventListener("click",()=>{s(Array.from(o)),r()}),x.addEventListener("click",()=>{we(null,async h=>{e.push(h),o.add(h.id),b(),M(),l.disabled=!1,l.textContent=`Add (${o.size})`})}),b(),M()}})}function xo(){return'<svg viewBox="0 0 24 24" width="22" height="22" fill="var(--green)"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'}function we(e,t){let s=!!e,o=s?R(e):null,n=!o||he.includes(o)?he:[o,...he],i=e?.equipment,r=!i||Ae.includes(i)?Ae:[i,...Ae],a=W({html:`
      <div class="sheet-header">
        <button class="btn-text" id="ce-cancel">Cancel</button>
        <div class="title">${s?"Edit Exercise":"New Exercise"}</div>
        <button class="btn-text primary" id="ce-save" ${s?"":"disabled"}>Save</button>
      </div>
      <div class="sheet-content">
        <div class="section">Name</div>
        <div class="form-section">
          <div class="form-row">
            <input id="ce-name" placeholder="e.g. Cable Lateral Raise" style="text-align: left;" value="${E(e?.name??"")}" />
          </div>
        </div>
        <div class="section">Muscle</div>
        <div class="form-section">
          <div class="form-row">
            <label for="ce-cat">Muscle</label>
            <select id="ce-cat">${n.map(u=>`<option${u===o?" selected":""}>${E(u)}</option>`).join("")}</select>
          </div>
        </div>
        <div class="section">Equipment</div>
        <div class="form-section">
          <div class="form-row">
            <label for="ce-eq">Equipment</label>
            <select id="ce-eq">${r.map(u=>`<option${u===i?" selected":""}>${E(u)}</option>`).join("")}</select>
          </div>
        </div>
      </div>
    `,onMount(u){let l=u.querySelector("#ce-name"),m=u.querySelector("#ce-save");l.addEventListener("input",()=>{m.disabled=l.value.trim().length===0}),u.querySelector("#ce-cancel").addEventListener("click",()=>a()),m.addEventListener("click",async()=>{let x=l.value.trim();if(!x)return;let d=u.querySelector("#ce-cat").value,f=u.querySelector("#ce-eq").value,b=s?{...e,name:x,muscle:d,equipment:f}:{id:F(),name:x,muscle:d,category:d,equipment:f,notes:"",isCustom:!0,createdAt:Date.now()};await P("exercises",b),a(),t?.(b),s||q("data:changed")}),s||setTimeout(()=>l.focus(),50)}})}function ko(){let t=[["AC","clear","fn"],["\xB1","sign","fn"],["\u232B","back","fn"],["\xF7","op","op"],["7","digit"],["8","digit"],["9","digit"],["\xD7","op","op"],["4","digit"],["5","digit"],["6","digit"],["\u2212","op","op"],["1","digit"],["2","digit"],["3","digit"],["+","op","op"],["0","digit","zero"],[".","dot"],["=","equals","op"]].map(([s,o,n])=>`<button class="calc-key${n?` calc-${n}`:""}" data-action="${o}" data-key="${E(s)}">${E(s)}</button>`).join("");W({html:`
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
    `,onMount(s,o){let n=s.querySelector("#calc-expr"),i=s.querySelector("#calc-result"),r={"+":(c,y)=>c+y,"\u2212":(c,y)=>c-y,"\xD7":(c,y)=>c*y,"\xF7":(c,y)=>y===0?NaN:c/y},a=c=>c==="+"||c==="\u2212"||c==="\xD7"||c==="\xF7",u=c=>{if(!isFinite(c))return"Error";let y=parseFloat(c.toFixed(8)).toString();return y.replace("-","").replace(".","").length>12&&(y=c.toPrecision(10).replace(/\.?0+$/,"")),y},l=["0"],m=!1,x=!1,d="",f=()=>l[l.length-1];function b(){n.textContent=x?"":d,i.textContent=x?"Error":l.join(" ");let c=!x&&a(f())?f():null;for(let y of s.querySelectorAll(".calc-op"))y.classList.toggle("selected",y.dataset.key===c)}function M(c){if(x&&(l=["0"],x=!1),m)return l=[c],m=!1,b();a(f())?l.push(c):l[l.length-1]=f()==="0"?c:f()+c,b()}function h(){if(x&&(l=["0"],x=!1),m)return l=["0."],m=!1,b();a(f())?l.push("0."):f().includes(".")||(l[l.length-1]=f()+"."),b()}function v(c){x||(m=!1,a(f())?l[l.length-1]=c:l.push(c),b())}function $(){l=["0"],m=!1,x=!1,b()}function k(){if(x||a(f()))return;let c=f();l[l.length-1]=c.startsWith("-")?c.slice(1):c==="0"?"0":"-"+c,b()}function S(){if(x)return $();if(m=!1,a(f()))return l.pop(),b();let c=f().slice(0,-1);c===""||c==="-"?l.length>1?l.pop():l=["0"]:l[l.length-1]=c,b()}function B(){if(x)return;let c=l.slice();if(a(c[c.length-1])&&c.pop(),c.length<3)return;let y=parseFloat(c[0]);for(let g=1;g<c.length;g+=2)if(y=r[c[g]](y,parseFloat(c[g+1])),!isFinite(y))return x=!0,b();d=`${c.join(" ")} =`,l=[u(y)],m=!0,b()}function T(c){let{action:y,key:g}=c.dataset;y!=="equals"&&(d=""),y==="digit"?M(g):y==="dot"?h():y==="clear"?$():y==="sign"?k():y==="back"?S():y==="op"?v(g):y==="equals"&&B()}let p=null;for(let c of s.querySelectorAll(".calc-key"))c.addEventListener("pointerdown",y=>{y.preventDefault(),p=c,c.classList.add("pressed")}),c.addEventListener("pointerup",y=>{y.preventDefault(),c.classList.remove("pressed"),p===c&&T(c),p=null}),c.addEventListener("pointercancel",()=>{c.classList.remove("pressed"),p=null}),c.addEventListener("pointerleave",()=>c.classList.remove("pressed"));s.querySelector("#calc-done").addEventListener("click",()=>o())}})}function Se(){let e=window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===!0,t;e?t=Math.max(window.innerHeight||0,window.visualViewport?.height||0,window.screen?.height||0):t=window.visualViewport?.height||window.innerHeight,document.documentElement.style.setProperty("--app-height",`${t}px`)}Se();window.addEventListener("resize",Se);window.addEventListener("orientationchange",Se);window.addEventListener("pageshow",Se);window.visualViewport?.addEventListener("resize",Se);var gs={workout:{title:"Workout",render:hs},exercises:{title:"Exercises",render:ls},progress:{title:"Progress",render:os}},xe=document.getElementById("view-content"),So=document.getElementById("nav-title"),ws=document.getElementById("nav-back"),X=document.getElementById("nav-action"),ke="workout",ct=null,ze=null,je=null,Ne={container:xe,setTitle(e){So.textContent=e},setAction(e){if(!e){X.hidden=!0,X.innerHTML="",X.removeAttribute("aria-label"),ze=null;return}X.hidden=!1,e.label?X.setAttribute("aria-label",e.label):X.removeAttribute("aria-label"),e.html?X.innerHTML=e.html:X.textContent=e.label??"",ze=e.onClick},setBack(e){ct=e,ws.hidden=!e},refresh(){$e(ke)},toast(e){I(e)}};function $o(){if(typeof je=="function")try{je()}catch(e){console.error(e)}je=null}function $e(e){ke=e,Mt(e),document.querySelectorAll(".tab").forEach(t=>{t.setAttribute("aria-selected",String(t.dataset.tab===e))}),$o(),Ne.setTitle(gs[e].title),Ne.setAction(null),Ne.setBack(null),xe.innerHTML="",xe.scrollTop=0;try{je=gs[e].render(Ne)}catch(t){console.error("Render failed",t),xe.innerHTML=`<div class="empty-state"><div class="empty-icon">!</div><h2>Render error</h2><p>${E(t.message)}</p></div>`}}document.querySelectorAll(".tab").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll(".sheet-backdrop").forEach(t=>t.dismissSheet?.()),$e(e.dataset.tab)})});ws.addEventListener("click",()=>{ct&&ct()});X.addEventListener("click",()=>{ze&&ze()});Ke("data:changed",()=>{ne(),$e(ke)});Ke("workout:changed",()=>{ne(),ke==="workout"&&$e(ke)});document.addEventListener("visibilitychange",()=>{document.visibilityState==="visible"&&ne()});async function Mo(){try{await j();let e=await St();e>0&&console.info(`Seeded ${e} exercises.`),await Tt(),$e("workout"),ne()}catch(e){console.error("Init failed:",e),xe.innerHTML=`
      <div class="empty-state">
        <div class="empty-icon">!</div>
        <h2>Storage unavailable</h2>
        <p>${E(e.message??String(e))}</p>
        <p>If you are running this from a <code>file://</code> URL, serve it through a local web server instead.</p>
      </div>`}}Mo();
