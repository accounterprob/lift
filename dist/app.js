var Ft="lift";var Se=null;function j(){return Se?Promise.resolve(Se):new Promise((e,t)=>{let s=indexedDB.open(Ft,3);s.onerror=()=>t(s.error),s.onsuccess=()=>{Se=s.result,e(Se)},s.onupgradeneeded=()=>{let r=s.result;if(!r.objectStoreNames.contains("exercises")){let n=r.createObjectStore("exercises",{keyPath:"id"});n.createIndex("name","name",{unique:!1}),n.createIndex("category","category",{unique:!1})}if(r.objectStoreNames.contains("workouts")||r.createObjectStore("workouts",{keyPath:"id"}).createIndex("startedAt","startedAt",{unique:!1}),!r.objectStoreNames.contains("sets")){let n=r.createObjectStore("sets",{keyPath:"id"});n.createIndex("workoutId","workoutId",{unique:!1}),n.createIndex("exerciseId","exerciseId",{unique:!1})}}})}function ce(e){return new Promise((t,s)=>{e.onsuccess=()=>t(e.result),e.onerror=()=>s(e.error)})}async function le(e,t="readonly"){return(await j()).transaction(e,t).objectStore(e)}function Q(e,t,s){return new Promise((r,n)=>{let o=e.transaction(t,"readwrite"),i;try{i=s(o)}catch(d){try{o.abort()}catch{}n(d);return}o.oncomplete=()=>r(i),o.onerror=()=>n(o.error),o.onabort=()=>n(o.error)})}async function C(e){return ce((await le(e)).getAll())}async function de(e,t){return ce((await le(e)).get(t))}async function P(e,t){return await ce((await le(e,"readwrite")).put(t)),t}async function ue(e,t){let s=await j();return Q(s,e,r=>{let n=r.objectStore(e);for(let o of t)n.put(o)})}async function $e(e,t){return ce((await le(e,"readwrite")).delete(t))}async function Oe(e,t){if(t.length===0)return;let s=await j();return Q(s,e,r=>{let n=r.objectStore(e);for(let o of t)n.delete(o)})}async function Me(e,t,s){let r=await le(e);return ce(r.index(t).getAll(s))}async function Ze({exercises:e,workouts:t,sets:s}){let r=await j(),n={exercises:e,workouts:t,sets:s};return Q(r,["exercises","workouts","sets"],o=>{for(let[i,d]of Object.entries(n)){let u=o.objectStore(i);u.clear();for(let l of d)u.put(l)}})}function G(e){let t=new Set;for(let s of e)s.completed&&t.add(s.workoutId);return e.filter(s=>s.completed||!t.has(s.workoutId))}async function re(){return(await C("workouts")).find(t=>!t.endedAt)??null}async function oe(){return(await C("workouts")).filter(t=>t.endedAt).sort((t,s)=>s.startedAt-t.startedAt)}async function et(e){return(await Me("sets","workoutId",e)).sort((s,r)=>s.order-r.order)}async function Ot(e){return await Me("sets","exerciseId",e)}async function tt(e,t=null){let s=await Ot(e),r=new Map;for(let i of s)t&&i.workoutId===t||(r.has(i.workoutId)||r.set(i.workoutId,[]),r.get(i.workoutId).push(i));if(r.size===0)return[];let o=(await Promise.all(Array.from(r.keys()).map(i=>de("workouts",i)))).filter(Boolean).sort((i,d)=>(d.startedAt??0)-(i.startedAt??0));return o.length===0?[]:r.get(o[0].id).sort((i,d)=>i.order-d.order)}function st(e,t,s=null){let r=new Map(t.map(i=>[i.id,i.startedAt??0])),n=new Map;for(let i of e){if(i.workoutId===s||!r.has(i.workoutId)||(i.weight||0)<=0||(i.reps||0)<=0)continue;let d=n.get(i.exerciseId);d||n.set(i.exerciseId,d=new Map);let u=d.get(i.workoutId);u||d.set(i.workoutId,u=[]),u.push(i)}let o=new Map;for(let[i,d]of n){let u=[...d.keys()].sort((b,S)=>r.get(S)-r.get(b)),l=new Map;for(let b of u){let S=d.get(b).sort((M,h)=>M.order-h.order),c=S.every(M=>M.setType==null),f=0,y=0;S.forEach((M,h)=>{if(c){let k=`any#${h+1}`;l.has(k)||l.set(k,M);return}let m=M.setType||"working",$=m==="warmup"?y+=1:f+=1,x=`${m}#${$}`;l.has(x)||l.set(x,M)})}o.set(i,l)}return o}var jt={barbell:"Barbell",dumbbell:"Dumbbell",machine:"Machine",cable:"Cable",bodyweight:"Bodyweight",kettlebell:"Kettlebell",band:"Bands",bands:"Bands"},zt=/\s*\((barbell|dumbbell|machine|cable|bodyweight|kettlebell|bands?)\)$|\s+(Machine|Barbell|Dumbbell|Cable|Kettlebell)$/i;async function Nt(e,t){let s=await j(),r=await Me("sets","exerciseId",e);return Q(s,["sets","exercises"],n=>{let o=n.objectStore("sets");for(let i of r)o.put({...i,exerciseId:t});return n.objectStore("exercises").delete(e),r.length})}async function rt(){let e=await C("exercises"),t=e.filter(o=>/butterfly/i.test(o.name||""));if(t.length===0)return 0;let s=e.filter(o=>/chest fly/i.test(o.name||"")&&!t.some(i=>i.id===o.id)),r=s.find(o=>(o.equipment||"")==="Machine")||s[0],n=0;for(let o of t)r?n+=await Nt(o.id,r.id):await P("exercises",{...o,name:"Chest Fly",equipment:"Machine"});return n}async function ot(){let e=await C("exercises"),t=[];for(let s of e){let r=(s.name||"").match(zt);if(!r)continue;let n=s.name.slice(0,r.index).trim();if(!n||/smith$/i.test(n))continue;let o=(r[1]||r[2]).toLowerCase();t.push({...s,name:n,equipment:jt[o]||s.equipment})}return t.length>0&&await ue("exercises",t),t.length}async function nt(){let[e,t,s]=await Promise.all([C("exercises"),C("sets"),C("workouts")]),r=new Set(e.filter(l=>l.category==="Cardio").map(l=>l.id));if(r.size===0)return{exercises:0,sets:0,workouts:0};let n=t.filter(l=>r.has(l.exerciseId)),o=new Map;for(let l of t)r.has(l.exerciseId)||o.set(l.workoutId,(o.get(l.workoutId)||0)+1);let i=new Set(n.map(l=>l.workoutId)),d=s.filter(l=>i.has(l.id)&&!o.get(l.id)),u=await j();return await Q(u,["exercises","sets","workouts"],l=>{let b=l.objectStore("exercises"),S=l.objectStore("sets"),c=l.objectStore("workouts");for(let f of r)b.delete(f);for(let f of n)S.delete(f.id);for(let f of d)c.delete(f.id)}),{exercises:r.size,sets:n.length,workouts:d.length}}async function it(e){let[t,s,r]=await Promise.all([C("exercises"),C("sets"),C("workouts")]),n=t.filter(c=>c.category==="Other");if(n.length===0)return{recategorized:0,deleted:0,workouts:0};let o=[],i=new Set;for(let c of n){let f=e(c.name);f==="Cardio"?i.add(c.id):o.push({...c,category:f&&f!=="Other"?f:"Full Body"})}let d=s.filter(c=>i.has(c.exerciseId)),u=new Map;for(let c of s)i.has(c.exerciseId)||u.set(c.workoutId,(u.get(c.workoutId)||0)+1);let l=new Set(d.map(c=>c.workoutId)),b=r.filter(c=>l.has(c.id)&&!u.get(c.id)),S=await j();return await Q(S,["exercises","sets","workouts"],c=>{let f=c.objectStore("exercises"),y=c.objectStore("sets"),M=c.objectStore("workouts");for(let h of o)f.put(h);for(let h of i)f.delete(h);for(let h of d)y.delete(h.id);for(let h of b)M.delete(h.id)}),{recategorized:o.length,deleted:i.size,workouts:b.length}}async function Le(e){let t=await j(),s=await Me("sets","workoutId",e);return Q(t,["workouts","sets"],r=>{r.objectStore("workouts").delete(e);let n=r.objectStore("sets");for(let o of s)n.delete(o.id)})}var J=()=>crypto&&crypto.randomUUID?crypto.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,e=>{let t=Math.random()*16|0;return(e==="x"?t:t&3|8).toString(16)});function pe(e){return e==null?"0":Math.abs(e-Math.round(e))<.001?String(Math.round(e)):e.toFixed(1)}function fe(e){return`${pe(e)} lbs`}function at(e){let t=Math.max(0,Math.floor(e)),s=Math.floor(t/3600),r=Math.floor(t%3600/60),n=t%60;return s>0?`${s}:${String(r).padStart(2,"0")}:${String(n).padStart(2,"0")}`:`${r}:${String(n).padStart(2,"0")}`}function ze(e){let t=Math.max(0,Math.floor(e)),s=Math.floor(t/3600),r=Math.floor(t%3600/60);return s>0?`${s}h ${r}m`:`${r}m`}function U(e){return Math.round(e).toLocaleString()}function ne(e){return`${U(e)} lbs`}function me(e){return(e instanceof Date?e:new Date(e)).toLocaleDateString(void 0,{month:"numeric",day:"numeric",year:"2-digit"})}function ct(e){return(e instanceof Date?e:new Date(e)).toLocaleDateString(void 0,{weekday:"short",month:"short",day:"numeric",year:"numeric"})}function Ne(e,t=200){let s=null;return(...r)=>{clearTimeout(s),s=setTimeout(()=>e(...r),t)}}function D(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function W(e,t=1800,s={}){let r=document.querySelector(".toast");r&&r.remove();let n=document.createElement("div");n.className="toast",n.textContent=e,s.persistUntilClick?(n.classList.add("toast-clickable"),n.addEventListener("click",()=>n.remove())):setTimeout(()=>n.remove(),t),document.body.appendChild(n)}var je=new EventTarget;function H(e,t){je.dispatchEvent(new CustomEvent(e,{detail:t}))}function Ve(e,t){return je.addEventListener(e,t),()=>je.removeEventListener(e,t)}function F({html:e,onMount:t}){let s=document.createElement("div");s.className="sheet-backdrop",s.innerHTML='<div class="sheet"></div>';let r=s.querySelector(".sheet");r.innerHTML=e;let n=Vt();document.body.appendChild(s);function o(){let u=window.visualViewport;if(!u){r.style.maxHeight=`${window.innerHeight-n-10}px`;return}let l=Math.max(window.innerHeight,document.documentElement.clientHeight),b=Math.max(0,l-u.height-u.offsetTop);b>0?(r.style.paddingBottom=`${b}px`,r.style.maxHeight=`${u.height-n-10+b}px`):(r.style.paddingBottom="",r.style.maxHeight=`${u.height-n-10}px`)}o();let i=window.visualViewport;i?.addEventListener("resize",o),i?.addEventListener("scroll",o);function d(){s.remove(),i?.removeEventListener("resize",o),i?.removeEventListener("scroll",o)}return s.dismissSheet=d,s.addEventListener("click",u=>{u.target===s&&d()}),t?.(r,d),d}function Vt(){let e=document.createElement("div");e.style.cssText="position:fixed;top:0;left:0;width:0;height:env(safe-area-inset-top);",document.body.appendChild(e);let t=e.offsetHeight||0;return e.remove(),t}function Be(){return'<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" style="color: var(--red);"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>'}function lt(){return'<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M16 5l-1.42 1.42-1.59-1.59V16h-2V4.83L9.41 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z"/></svg>'}function X(e){return`<div class="empty-state"><div class="empty-icon">!</div><h2>Couldn't load</h2><p>${D(e.message||String(e))}</p></div>`}var he=["Pectorals","Anterior Deltoid","Lateral Deltoid","Posterior Deltoid","Triceps","Biceps","Forearms","Lats","Upper Back","Lower Back","Traps","Quadriceps","Hamstrings","Glutes","Adductors","Abductors","Calves","Abs","Obliques"];function Ut(e){let t=new Map(he.map((s,r)=>[s,r]));return[...e].sort((s,r)=>(t.get(s)??999)-(t.get(r)??999)||s.localeCompare(r))}var De=["Barbell","Dumbbell","Machine","Cable","Bodyweight","Other"];function Y(e){let t=e?.equipment,s=e?.name??"";return t&&t!=="Other"?`${s} (${t})`:s}function Z(e){let t=e?[e.equipment,R(e)].filter(Boolean).join(" \xB7 "):"";return`
    <div class="row-main">
      <div class="row-title">${D(e?.name??"Unknown exercise")}</div>
      ${t?`<div class="row-subtitle">${D(t)}</div>`:""}
    </div>
  `}function ee(e){return e?`<div class="exercise-count">${e} ${e===1?"set":"sets"}</div>`:""}function Ee(e,t){return["All",...Ut(new Set(e.map(r=>R(r))))].map(r=>`<button class="chip${r==="All"&&!t||r===t?" active":""}" data-cat="${D(r)}">${D(r)}</button>`).join("")}var Yt=[["Bench Press (Barbell)","Chest","Barbell"],["Bench Press (Dumbbell)","Chest","Dumbbell"],["Incline Bench Press (Barbell)","Chest","Barbell"],["Incline Bench Press (Dumbbell)","Chest","Dumbbell"],["Decline Bench Press (Barbell)","Chest","Barbell"],["Chest Fly (Dumbbell)","Chest","Dumbbell"],["Chest Fly (Machine)","Chest","Machine"],["Cable Crossover","Chest","Cable"],["Push-Up","Chest","Bodyweight"],["Dip (Chest)","Chest","Bodyweight"],["Deadlift (Conventional)","Back","Barbell"],["Deadlift (Sumo)","Back","Barbell"],["Romanian Deadlift","Back","Barbell"],["Bent-Over Row (Barbell)","Back","Barbell"],["Pendlay Row","Back","Barbell"],["Row (Dumbbell)","Back","Dumbbell"],["T-Bar Row","Back","Barbell"],["Seated Cable Row","Back","Cable"],["Lat Pulldown","Back","Cable"],["Pull-Up","Back","Bodyweight"],["Chin-Up","Back","Bodyweight"],["Face Pull","Back","Cable"],["Shrug (Barbell)","Back","Barbell"],["Shrug (Dumbbell)","Back","Dumbbell"],["Overhead Press (Barbell)","Shoulders","Barbell"],["Overhead Press (Dumbbell)","Shoulders","Dumbbell"],["Seated Shoulder Press (Machine)","Shoulders","Machine"],["Arnold Press","Shoulders","Dumbbell"],["Lateral Raise (Dumbbell)","Shoulders","Dumbbell"],["Lateral Raise (Cable)","Shoulders","Cable"],["Front Raise (Dumbbell)","Shoulders","Dumbbell"],["Rear Delt Fly (Dumbbell)","Shoulders","Dumbbell"],["Reverse Pec Deck","Shoulders","Machine"],["Upright Row","Shoulders","Barbell"],["Barbell Curl","Biceps","Barbell"],["Dumbbell Curl","Biceps","Dumbbell"],["Hammer Curl","Biceps","Dumbbell"],["Preacher Curl","Biceps","Barbell"],["Incline Dumbbell Curl","Biceps","Dumbbell"],["Cable Curl","Biceps","Cable"],["Concentration Curl","Biceps","Dumbbell"],["Close-Grip Bench Press","Triceps","Barbell"],["Tricep Pushdown (Cable)","Triceps","Cable"],["Overhead Tricep Extension (Dumbbell)","Triceps","Dumbbell"],["Overhead Tricep Extension (Cable)","Triceps","Cable"],["Skull Crusher","Triceps","Barbell"],["Dip (Tricep)","Triceps","Bodyweight"],["Tricep Kickback","Triceps","Dumbbell"],["Back Squat","Legs","Barbell"],["Front Squat","Legs","Barbell"],["Goblet Squat","Legs","Dumbbell"],["Bulgarian Split Squat","Legs","Dumbbell"],["Lunge","Legs","Dumbbell"],["Leg Press","Legs","Machine"],["Leg Extension","Legs","Machine"],["Leg Curl (Seated)","Legs","Machine"],["Leg Curl (Lying)","Legs","Machine"],["Hip Thrust (Barbell)","Glutes","Barbell"],["Glute Bridge","Glutes","Bodyweight"],["Cable Kickback","Glutes","Cable"],["Hip Abduction (Machine)","Glutes","Machine"],["Standing Calf Raise","Calves","Machine"],["Seated Calf Raise","Calves","Machine"],["Plank","Core","Bodyweight"],["Hanging Leg Raise","Core","Bodyweight"],["Cable Crunch","Core","Cable"],["Russian Twist","Core","Bodyweight"],["Ab Wheel Rollout","Core","Other"],["Wrist Curl","Forearms","Dumbbell"],["Reverse Wrist Curl","Forearms","Dumbbell"],["Farmer's Carry","Forearms","Dumbbell"]];function R(e){if(e?.muscle)return e.muscle;let t=(e?.name||"").toLowerCase();return t?/romanian deadlift|\brdl\b|stiff.?leg|good morning|nordic|hamstring/.test(t)||/leg curl/.test(t)?"Hamstrings":/leg extension|sissy squat/.test(t)?"Quadriceps":/calf|tib raise|tibialis/.test(t)?"Calves":/hip adduction|adductor|inner thigh|copenhagen/.test(t)?"Adductors":/hip abduction|abductor|outer thigh|clamshell/.test(t)?"Abductors":/hip thrust|glute|cable kickback|donkey kick|rear kick|frog pump/.test(t)?"Glutes":/squat|leg press|lunge|step.?up/.test(t)?"Quadriceps":/back extension|hyperextension|superman/.test(t)||/deadlift|rack pull/.test(t)?"Lower Back":/lateral raise|side raise|side delt|\blat raise\b|upright row/.test(t)?"Lateral Deltoid":/rear delt|reverse fly|reverse flye|face pull|reverse pec deck/.test(t)?"Posterior Deltoid":/front raise|shoulder press|overhead press|arnold|military press|landmine press|push press|viking press/.test(t)?"Anterior Deltoid":/pulldown|pull.?down|pull.?up|chin.?up|pullover|straight.?arm/.test(t)?"Lats":/shrug/.test(t)?"Traps":/tricep|pushdown|skull ?crusher|close.?grip bench|jm press|french press|bench dip/.test(t)?"Triceps":/wrist curl|reverse curl|forearm|farmer|gripper|dead hang/.test(t)?"Forearms":/bicep|\bcurl\b/.test(t)?"Biceps":/\brow\b|rear pull|high pull/.test(t)?"Upper Back":/bench|chest|\bpec\b|pec deck|crossover|butterfly|push.?up|floor press|squeeze press|\bfly\b|\bflye\b/.test(t)?"Pectorals":/russian twist|woodchop|wood chop|side plank|side bend|oblique|pallof|rotation/.test(t)?"Obliques":/crunch|sit.?up|plank|leg raise|knee raise|ab wheel|ab roll|hanging|toes.?to.?bar|v.?up|dead bug|mountain climber/.test(t)?"Abs":/\bdip\b/.test(t)?"Triceps":e.category||"Other":e?.category||"Other"}var _t=/\b(bike|biking|treadmill|run|running|cardio|step.?mill|elliptical|stair.?master|stair.?climber|jog|jogging|cycling|spinning|spin class|rowing machine|row machine|\berg\b|sprints?|jump.?rope|skipping rope|swim|swimming|hike|hiking)\b/,Gt={Quadriceps:"Legs",Hamstrings:"Legs",Adductors:"Legs",Abductors:"Legs",Glutes:"Glutes",Calves:"Calves",Pectorals:"Chest","Anterior Deltoid":"Shoulders","Lateral Deltoid":"Shoulders","Posterior Deltoid":"Shoulders",Lats:"Back","Upper Back":"Back",Traps:"Back","Lower Back":"Back",Biceps:"Biceps",Triceps:"Triceps",Forearms:"Forearms",Abs:"Core",Obliques:"Core"};function dt(e){let t=(e||"").toLowerCase().trim();if(!t)return"Full Body";if(_t.test(t))return"Cardio";let s=R({name:t,category:""});return Gt[s]||"Full Body"}async function ut(){if((await C("exercises")).length>0)return 0;let t=Date.now(),s=Yt.map(([r,n,o])=>({id:J(),name:r,category:n,equipment:o,notes:"",isCustom:!1,createdAt:t}));return await ue("exercises",s),s.length}var pt="workout";function ft(e){pt!==e&&(pt=e,H("tab:changed",e))}var O=["Chest Day","Leg Day","Back/Bi Day"],Te={"Chest Day":{key:"chest",short:"Chest",cssVar:"--day-chest"},"Leg Day":{key:"leg",short:"Legs",cssVar:"--day-leg"},"Back/Bi Day":{key:"back",short:"Back/Bi",cssVar:"--day-back"}};function Ce(e){let t=Te[e];return t?`var(${t.cssVar})`:"var(--text-tertiary)"}function Ue(e){if(!e)return null;let t=e.toLowerCase();return t.includes("chest")?"Chest Day":t.includes("leg")&&!t.includes("curl")&&!t.includes("extension")?"Leg Day":t.includes("back")||t.includes("pull")?"Back/Bi Day":t.includes("push")?"Chest Day":null}function Ye(e){for(let t of e){let s=Ue(t.name);if(s)return{name:t.name,normalized:s,startedAt:t.startedAt}}return null}function Ae(e){let t=O.indexOf(e);return t===-1?O[0]:O[(t+1)%O.length]}var Xt={Pectorals:"#ec4899",Triceps:"#be185d","Anterior Deltoid":"#831843","Lateral Deltoid":"#f9a8d4",Quadriceps:"#facc15",Hamstrings:"#b45309",Glutes:"#f59e0b",Calves:"#fde68a",Adductors:"#bdb76b",Abductors:"#78350f",Lats:"#2563eb","Upper Back":"#38bdf8",Biceps:"#1e40af","Posterior Deltoid":"#bfdbfe",Traps:"#0891b2","Lower Back":"#475569",Forearms:"#22c55e",Abs:"#ef4444",Obliques:"#14b8a6",Other:"#6b7280"};function mt(e){return Xt[e]??"#6b7280"}var Kt={Pectorals:"Chest Day",Triceps:"Chest Day","Anterior Deltoid":"Chest Day","Lateral Deltoid":"Chest Day",Quadriceps:"Leg Day",Hamstrings:"Leg Day",Glutes:"Leg Day",Calves:"Leg Day",Adductors:"Leg Day",Abductors:"Leg Day",Lats:"Back/Bi Day","Upper Back":"Back/Bi Day",Biceps:"Back/Bi Day","Posterior Deltoid":"Back/Bi Day",Traps:"Back/Bi Day","Lower Back":"Back/Bi Day",Forearms:"Back/Bi Day"};function Qt(e){return Kt[e]??null}function Jt(e,t,s){let r=Ue(e);if(r)return r;let n=new Map;for(let d of t){let u=s.get(d.exerciseId);if(!u)continue;let l=Qt(R(u));if(!l)continue;let b=(d.weight||0)*(d.reps||0);b<=0||n.set(l,(n.get(l)??0)+b)}let o=null,i=0;for(let[d,u]of n)u>i&&(o=d,i=u);return o}function ht(e,t,s){let r=[...e].sort((i,d)=>i.startedAt-d.startedAt),n=new Map,o=null;for(let i of r){let d=Jt(i.name,t.get(i.id)??[],s);d||(o?wt(o.startedAt,i.startedAt)?d=o.day:d=Ae(o.day):d=O[0]),n.set(i.id,d),o={day:d,startedAt:i.startedAt}}return n}function vt(e){let t=parseInt(e.slice(1),16);return((t>>16&255)*299+(t>>8&255)*587+(t&255)*114)/1e3>=150?"#1c1c1e":"#ffffff"}function wt(e,t){let s=new Date(e),r=new Date(t);return s.getFullYear()===r.getFullYear()&&s.getMonth()===r.getMonth()&&s.getDate()===r.getDate()}function Zt(e,t){let s=Ue(t?.name);if(s)return s;let r=Ye(e);return r?wt(r.startedAt,Date.now())?r.normalized:Ae(r.normalized):O[0]}var es="lift-today-day";async function te(){try{let[e,t]=await Promise.all([oe(),re()]),s=Zt(e,t),r=Te[s].key;document.documentElement.dataset.day!==r&&(document.documentElement.dataset.day=r);try{localStorage.setItem(es,r)}catch{}return s}catch{return null}}var gt="lift-migrations-done-v1";async function _e(){let e=await nt();e.exercises>0&&console.info(`Removed ${e.exercises} cardio exercise(s), ${e.sets} set(s), ${e.workouts} cardio-only workout(s).`);let t=await it(dt);if(t.recategorized>0||t.deleted>0){console.info(`Reorganized "Other": recategorized ${t.recategorized}, removed ${t.deleted} cardio, dropped ${t.workouts} empty workout(s).`);let n=[];t.recategorized>0&&n.push(`sorted ${t.recategorized} exercise${t.recategorized===1?"":"s"}`),t.deleted>0&&n.push(`removed ${t.deleted} cardio`),W(`Cleaned up \u201COther\u201D: ${n.join(", ")}.`)}let s=await ot();s>0&&console.info(`Stripped equipment from ${s} exercise name(s).`);let r=await rt();r>0&&W(`Merged Butterfly into Chest Fly (${r} sets moved).`)}async function yt(){try{if(localStorage.getItem(gt))return}catch{}await _e();try{localStorage.setItem(gt,String(Date.now()))}catch{}}async function ts(){let[e,t,s]=await Promise.all([C("exercises"),C("workouts"),C("sets")]);return{version:1,exportedAt:new Date().toISOString(),exercises:e,workouts:t,sets:s}}function ss(){let e=new Date,t=s=>String(s).padStart(2,"0");return`lift-backup-${e.getFullYear()}${t(e.getMonth()+1)}${t(e.getDate())}-${t(e.getHours())}${t(e.getMinutes())}${t(e.getSeconds())}.json`}async function Ge(){let e=await ts(),t=JSON.stringify(e,null,2),s=new Blob([t],{type:"application/json"}),r=URL.createObjectURL(s),n=ss(),o=document.createElement("a");return o.href=r,o.download=n,o.style.display="none",document.body.appendChild(o),o.click(),setTimeout(()=>{document.body.removeChild(o),URL.revokeObjectURL(r)},1e3),{filename:n,bytes:s.size,snapshot:e}}async function rs(e){let t=await e.text(),s=JSON.parse(t);if(!s||!Array.isArray(s.exercises)||!Array.isArray(s.workouts)||!Array.isArray(s.sets))throw new Error("File doesn't look like a Lift backup.");return await Ze({exercises:s.exercises,workouts:s.workouts,sets:s.sets}),await _e(),{exercises:s.exercises.length,workouts:s.workouts.length,sets:s.sets.length}}function bt(){F({html:`
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
          Saves a JSON file. In Safari on iPhone, after the download finishes tap the Downloads button \u2192 long-press the file \u2192 <b>Share \u2192 Save to Files</b> \u2192 pick <b>iCloud Drive</b>. On Mac, set Safari's download folder to iCloud Drive in Settings.
        </div>

        <div class="section">Restore</div>
        <div class="form-section">
          <button class="list-row button destructive" id="bk-import">
            <div class="row-main"><div class="row-title" style="color: var(--red);">Restore from Backup\u2026</div></div>
          </button>
        </div>
        <div class="section-footer">
          <b>Replaces</b> all current workouts and exercises with the contents of the chosen JSON file.
        </div>

        <input type="file" id="bk-file" accept=".json,application/json" style="display: none;" />
      </div>
    `,onMount(e,t){e.querySelector("#bk-close").addEventListener("click",()=>t()),e.querySelector("#bk-export").addEventListener("click",async()=>{try{let{filename:r,bytes:n}=await Ge();W(`Exported ${r} (${os(n)})`)}catch(r){W(`Export failed: ${r.message}`)}});let s=e.querySelector("#bk-file");e.querySelector("#bk-import").addEventListener("click",()=>{s.value="",s.click()}),s.addEventListener("change",async r=>{let n=r.target.files?.[0];if(n&&confirm("Replace all current data with this backup? This cannot be undone."))try{let o=await rs(n);t(),W(`Restored ${o.workouts} workouts, ${o.exercises} exercises`),H("data:changed")}catch(o){W(`Restore failed: ${o.message}`)}})}})}function os(e){return e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/(1024*1024)).toFixed(1)} MB`}var Ie=[{key:"1W",tick:"1W",days:7},{key:"1M",tick:"1M",days:30},{key:"3M",tick:"3M",days:90},{key:"1Y",tick:"1Y",days:365},{key:"All",tick:"All",all:!0}];function ns(e){let t=new Map;for(let s of e){let r=new Date(s.date),n=`${r.getFullYear()}-${r.getMonth()}-${r.getDate()}`,o=t.get(n)||{date:s.date,total:0,count:0};o.total+=s.value,o.count+=1,o.date=Math.min(o.date,s.date),t.set(n,o)}return[...t.values()].map(s=>({date:s.date,value:s.total/s.count})).sort((s,r)=>s.date-r.date)}function ve(e,t,s={}){let r=t.length>0&&t[0].points!==void 0,n=(r?t:[{points:t}]).map(p=>({label:p.label??"",color:p.color||"var(--accent)",points:ns(p.points)})).filter(p=>p.points.length>0),o=s.defaultPeriod||"All",i=Math.max(0,Ie.findIndex(p=>p.key===o)),d=Ie.length-1,u=null;function l(){let p=Ie[i],a=n.map((g,B)=>u===null||B===u?g.points:[]);if(p.all)return a;let v=Date.now()-p.days*864e5,w=a.map(g=>g.filter(B=>B.date>=v));return w.every(g=>g.length===0)?a.map(g=>g.slice(-1)):w}let b=r&&n.some(p=>p.label)?`<div class="chart-legend">${n.map((p,a)=>`<button class="legend-item" data-i="${a}" style="--dcolor: ${p.color};" aria-pressed="false">${p.label}</button>`).join("")}</div>`:"";e.innerHTML=`
    <div class="chart-scrub-readout" data-role="scrub"></div>
    ${b}
    <div class="chart-container" data-role="chart"></div>
    <div class="chart-daterange" data-role="range"></div>
    <div class="chart-slider">
      <input type="range" class="chart-range" min="0" max="${d}" step="1"
             value="${i}" aria-label="Time range" />
      <div class="chart-slider-ticks">
        ${Ie.map((p,a)=>`<span data-i="${a}">${p.tick}</span>`).join("")}
      </div>
    </div>
  `;let S=e.querySelector('[data-role="scrub"]'),c=e.querySelector('[data-role="chart"]'),f=e.querySelector('[data-role="range"]'),y=e.querySelector(".chart-range"),M=[...e.querySelectorAll(".chart-slider-ticks span")],h=s.unit||"lbs",m=null;function $(){let p=l(),a=is(p,n,h);c.innerHTML=a.html,m=a.geom;let v=p.flat();if(v.length>=2){let w=Math.min(...v.map(B=>B.date)),g=Math.max(...v.map(B=>B.date));f.innerHTML=`<span>${Xe(w)}</span><span>${Xe(g)}</span>`}else f.innerHTML="";M.forEach((w,g)=>w.classList.toggle("active",g===i))}y.addEventListener("input",()=>{i=Number(y.value),E(),$()});let x=[...e.querySelectorAll(".chart-legend .legend-item")];for(let p of x)p.addEventListener("click",()=>{let a=Number(p.dataset.i);u=u===a?null:a,x.forEach((v,w)=>{v.classList.toggle("dimmed",u!==null&&w!==u),v.setAttribute("aria-pressed",String(u===w))}),E(),$()});function k(p){if(!m||m.pts.length<2)return;let a=c.querySelector("svg"),v=a?.getScreenCTM();if(!v)return;let w=new DOMPoint(p,0).matrixTransform(v.inverse()).x,g=0,B=1/0;m.pts.forEach((q,N)=>{let V=Math.abs(q.x-w);V<B&&(B=V,g=N)});let L=m.pts[g],A=a.querySelector(".chart-scrub-line"),I=a.querySelector(".chart-scrub-dot");A&&(A.setAttribute("x1",L.x),A.setAttribute("x2",L.x),A.removeAttribute("visibility")),I&&(I.setAttribute("cx",L.x),I.setAttribute("cy",L.y),I.style.fill=L.color,I.removeAttribute("visibility"));let z=L.label?` \xB7 ${L.label}`:"";S.textContent=`${Xe(L.date)}${z} \xB7 ${Math.round(L.value).toLocaleString()} ${h}`}function E(){S.textContent="";let p=c.querySelector("svg");p?.querySelector(".chart-scrub-line")?.setAttribute("visibility","hidden"),p?.querySelector(".chart-scrub-dot")?.setAttribute("visibility","hidden")}let T=!1;c.addEventListener("pointerdown",p=>{T=!0,c.setPointerCapture?.(p.pointerId),k(p.clientX)}),c.addEventListener("pointermove",p=>{T&&k(p.clientX)});for(let p of["pointerup","pointercancel"])c.addEventListener(p,()=>{T=!1,E()});$()}function Xe(e){return new Date(e).toLocaleDateString(void 0,{month:"short",day:"numeric",year:"numeric"})}function is(e,t,s){let o={top:16,right:14,bottom:14,left:52},i=400-o.left-o.right,d=200-o.top-o.bottom,u=e.flat();if(u.length===0)return{html:`<svg viewBox="0 0 400 200"><text x="${400/2}" y="${200/2}" text-anchor="middle" class="chart-axis-label">No data in range</text></svg>`,geom:null};if(u.length===1){let g=u[0],B=t[e.findIndex(I=>I.length>0)]?.color||"var(--accent)",L=o.left+i/2,A=o.top+d/2;return{html:`<svg viewBox="0 0 400 200"><circle cx="${L}" cy="${A}" r="4" class="chart-point" style="fill: ${B};"/><text x="${L}" y="${A-10}" text-anchor="middle" class="chart-axis-label">${Math.round(g.value).toLocaleString()} ${s}</text></svg>`,geom:null}}let l=u.map(g=>g.date),b=u.map(g=>g.value),S=Math.min(...l),c=Math.max(...l),f=Math.max(...b),y=Math.min(...b),M=Math.max(f-y,1),h=Math.max(0,y-M*.12),m=f+M*.12,$=g=>o.left+(g-S)/Math.max(c-S,1)*i,x=g=>o.top+d-(g-h)/(m-h)*d,k=4,E=g=>Math.round(g).toLocaleString(),T=Array.from({length:k+1},(g,B)=>{let L=h+(m-h)*B/k,A=x(L);return`<text x="${o.left-6}" y="${A+3}" text-anchor="end" class="chart-axis-label">${E(L)}</text>`}).join(""),p=Array.from({length:k+1},(g,B)=>{let L=o.top+d*B/k;return`<line x1="${o.left}" x2="${400-o.right}" y1="${L}" y2="${L}" class="chart-axis-line"/>`}).join(""),a=[],v=e.map((g,B)=>{let L=t[B],A=g.map(I=>({x:$(I.date),y:x(I.value)}));return g.forEach((I,z)=>a.push({...A[z],date:I.date,value:I.value,label:L.label,color:L.color})),A.length===0?"":A.length===1?`<circle cx="${A[0].x}" cy="${A[0].y}" r="3.5" class="chart-point" style="fill: ${L.color};"/>`:`<path d="${as(A)}" class="chart-line" style="stroke: ${L.color};"/>`}).join("");return{html:`
    <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet">
      ${p}
      ${T}
      ${v}
      <line class="chart-scrub-line" y1="${o.top}" y2="${o.top+d}" x1="0" x2="0" visibility="hidden"/>
      <circle class="chart-scrub-dot" r="4.5" visibility="hidden"/>
    </svg>
  `,geom:{pts:a}}}function as(e){if(e.length<2)return"";let t=`M ${e[0].x.toFixed(1)} ${e[0].y.toFixed(1)}`;for(let s=0;s<e.length-1;s++){let r=e[s===0?0:s-1],n=e[s],o=e[s+1],i=e[s+2]||o,d=n.x+(o.x-r.x)/6,u=n.y+(o.y-r.y)/6,l=o.x-(i.x-n.x)/6,b=o.y-(i.y-n.y)/6;t+=` C ${d.toFixed(1)} ${u.toFixed(1)}, ${l.toFixed(1)} ${b.toFixed(1)}, ${o.x.toFixed(1)} ${o.y.toFixed(1)}`}return t}var K=null;function xt(e){let t=!0;return kt().then(s=>{t&&(K=s,qe(e))}).catch(s=>{t&&(e.container.innerHTML=X(s))}),()=>{t=!1}}async function kt(){let[e,t,s]=await Promise.all([oe(),C("sets"),C("exercises")]),r=new Map(s.map(y=>[y.id,y])),n=new Map;for(let y of G(t))n.has(y.workoutId)||n.set(y.workoutId,[]),n.get(y.workoutId).push(y);let o=0,i=0,d=new Map,u=new Map,l=new Map,b=ht(e,n,r);for(let y of e){let M=n.get(y.id)||[],h=M.reduce((m,$)=>m+$.weight*$.reps,0);if(o+=h,i+=M.length,h>0){let m=b.get(y.id);d.has(m)||d.set(m,[]),d.get(m).push({date:y.startedAt,value:h})}for(let m of M){let $=r.get(m.exerciseId);if(!$)continue;let x=u.get(m.exerciseId)||{id:m.exerciseId,exercise:$,count:0};if(x.count+=1,u.set(m.exerciseId,x),m.weight>0&&m.reps>0){let k=l.get(m.exerciseId);(!k||m.weight>k.weight||m.weight===k.weight&&m.reps>k.reps)&&l.set(m.exerciseId,{id:m.exerciseId,weight:m.weight,reps:m.reps,date:y.startedAt,name:Y($)})}}}let S=Array.from(u.entries()).sort((y,M)=>M[1].count-y[1].count).map(([,y])=>y),c=Array.from(l.values()).sort((y,M)=>M.weight-y.weight),f=O.filter(y=>d.has(y)).map(y=>({label:Te[y].short,color:Ce(y),points:d.get(y)}));return{workouts:e,allSets:t,allExercises:s,exMap:r,setsByWorkout:n,totalVolume:o,totalSets:i,volumeSeries:f,topExercises:S,prs:c}}function qe(e){if(e.setTitle("Progress"),e.setBack(null),e.setAction({label:"Backup and restore",html:lt(),onClick:()=>bt()}),e.container.scrollTop=0,!K||K.workouts.length===0){e.container.innerHTML=`
      <div class="empty-state">
        <div class="empty-icon">\u{1F4C8}</div>
        <h2>No data yet</h2>
        <p>Finish a workout and your stats and trends will show up here.</p>
      </div>
    `;return}let{workouts:t,totalVolume:s,totalSets:r,volumeSeries:n,topExercises:o,prs:i}=K;e.container.innerHTML=`
    <div class="section">Totals</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Total Volume</div><div class="stat-value">${ne(s)}</div></div>
      <div class="stat-row"><div class="stat-label">Total Sets</div><div class="stat-value">${r.toLocaleString()}</div></div>
    </div>

    ${n.length>0?`
      <div class="section">Workout Volume</div>
      <div class="volume-chart-mount"></div>
    `:""}

    <div class="list" style="margin-top: 16px;">
      <button class="list-row" data-page="trained">
        <div class="row-main">
          <div class="row-title">Most-Trained Exercises</div>
          <div class="row-subtitle">${o.length} tracked</div>
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
    </div>
  `;let d=e.container.querySelector(".volume-chart-mount");d&&n.length>0&&ve(d,n,{unit:"lbs"});for(let u of e.container.querySelectorAll("[data-page]"))u.addEventListener("click",()=>{let l=u.dataset.page;l==="trained"?cs(e):l==="prs"?ls(e):l==="history"&&St(e)})}function cs(e){e.setTitle("Most-Trained"),e.setBack(()=>qe(e)),e.setAction(null);let{topExercises:t}=K;e.container.innerHTML=`
    <div class="list" style="margin-top: 16px;">
      ${t.map(s=>`
        <button class="list-row" data-exercise-id="${D(s.id)}">
          ${Z(s.exercise)}
          <div class="row-trailing trailing-stack">${ee(s.count)}</div>
          <div class="chevron">\u203A</div>
        </button>
      `).join("")}
    </div>
  `,e.container.scrollTop=0,Ke(e)}function ls(e){e.setTitle("Personal Records"),e.setBack(()=>qe(e)),e.setAction(null);let{prs:t}=K;e.container.innerHTML=`
    <div class="section-footer" style="margin-top: 16px;">Heaviest set ever recorded per exercise.</div>
    <div class="list">
      ${t.map(s=>`
        <button class="list-row" data-exercise-id="${D(s.id)}" style="align-items: flex-start;">
          <div class="row-main">
            <div class="row-title">${D(s.name)}</div>
            <div class="row-subtitle">${me(s.date)}</div>
          </div>
          <div class="row-trailing" style="text-align: right;">
            <div style="font-weight: 600; color: var(--text);">${fe(s.weight)} lbs</div>
            <div style="font-size: 12px; color: var(--text-tertiary);">${s.reps} rep${s.reps===1?"":"s"}</div>
          </div>
          <div class="chevron">\u203A</div>
        </button>
      `).join("")}
    </div>
  `,e.container.scrollTop=0,Ke(e)}function Ke(e){for(let t of e.container.querySelectorAll("[data-exercise-id]"))t.addEventListener("click",()=>{Pe(t.dataset.exerciseId)})}function St(e){e.setTitle("Workout History"),e.setBack(()=>qe(e)),e.setAction(null);let{workouts:t,setsByWorkout:s,exMap:r}=K;e.container.innerHTML=`
    <div class="list" style="margin-top: 16px;">
      ${t.map(n=>ds(n,s.get(n.id)||[],r)).join("")}
    </div>
  `,e.container.scrollTop=0;for(let n of e.container.querySelectorAll("[data-workout-id]"))n.addEventListener("click",()=>{let o=n.dataset.workoutId;us(e,o).catch(i=>{e.container.innerHTML=X(i)})})}function ds(e,t,s){let r=t,n=r.reduce((u,l)=>u+l.weight*l.reps,0),o=(e.endedAt-e.startedAt)/1e3,i=[],d=new Set;for(let u of t){if(d.has(u.exerciseId))continue;d.add(u.exerciseId);let l=s.get(u.exerciseId);if(l&&i.push(l.name),i.length>=3)break}return`
    <button class="list-row" data-workout-id="${e.id}">
      <div class="row-main">
        <div class="row-title" style="font-weight: 600;">${D(e.name)}</div>
        <div class="row-subtitle" style="margin-top: 4px;">
          ${me(e.startedAt)} \xB7 ${ze(o)} \xB7 ${r.length} sets \xB7 ${ne(n)}
        </div>
        ${i.length>0?`<div class="row-subtitle" style="margin-top: 4px;">${D(i.join(" \xB7 "))}${d.size>3?" \u2026":""}</div>`:""}
      </div>
      <div class="chevron">\u203A</div>
    </button>
  `}async function $t(e){let[t,s,r]=await Promise.all([de("workouts",e),C("exercises"),et(e)]);if(!t)return null;let n=new Map(s.map(c=>[c.id,c])),o=new Map,i=[];for(let c of r)o.has(c.exerciseId)||(o.set(c.exerciseId,[]),i.push(c.exerciseId)),o.get(c.exerciseId).push(c);let d=G(r),u=d.reduce((c,f)=>c+f.weight*f.reps,0),l=d.length,b=(t.endedAt-t.startedAt)/1e3,S=`
    <div class="section">Summary</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Date</div><div class="stat-value">${ct(t.startedAt)}</div></div>
      <div class="stat-row"><div class="stat-label">Duration</div><div class="stat-value">${ze(b)}</div></div>
      <div class="stat-row"><div class="stat-label">Total Volume</div><div class="stat-value">${ne(u)}</div></div>
      <div class="stat-row"><div class="stat-label">Completed Sets</div><div class="stat-value">${l}</div></div>
    </div>

    ${i.map(c=>{let f=n.get(c),y=o.get(c),M=0,h=0;return`
        ${f?`<button class="section section-link" data-exercise-id="${D(c)}">${D(Y(f))}<span class="name-chevron">\u203A</span></button>`:'<div class="section">Unknown exercise</div>'}
        <div class="form-section">
          ${y.map($=>{let k=($.setType||"working")==="warmup"?`W${++h}`:String(++M);return`
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
  `;return{workout:t,html:S,sets:r}}function Mt(e,t){for(let s of e.querySelectorAll("input.hist-input[data-set-id]"))s.addEventListener("input",async()=>{let r=t.find(n=>n.id===s.dataset.setId);r&&(s.dataset.field==="weight"?r.weight=parseFloat(s.value)||0:r.reps=parseInt(s.value,10)||0,await P("sets",{...r}))})}async function us(e,t){e.setBack(async()=>{K=await kt(),St(e)}),e.setAction({label:"Delete workout",html:Be(),onClick:async()=>{confirm("Delete this workout?")&&(await Le(t),H("data:changed"))}});let s=await $t(t);if(!s){e.container.innerHTML=X({message:"Workout not found."});return}e.setTitle(s.workout.name),e.container.innerHTML=s.html,e.container.scrollTop=0,Ke(e),Mt(e.container,s.sets)}async function Lt(e){let t=await $t(e);if(!t)return;let s=F({html:`
      <div class="sheet-header">
        <button class="btn-text" id="wd-close">Done</button>
        <div class="title">${D(t.workout.name)}</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">${t.html}</div>
    `,onMount(r){r.querySelector("#wd-close").addEventListener("click",()=>s());for(let n of r.querySelectorAll("[data-exercise-id]"))n.addEventListener("click",()=>Pe(n.dataset.exerciseId));Mt(r,t.sets)}})}function Bt(e){let t=!0;return Dt(e).catch(s=>{t&&(e.container.innerHTML=X(s))}),()=>{t=!1}}async function Dt(e){e.setTitle("Exercises"),e.setBack(null),e.setAction({label:"Add exercise",html:'<span style="font-size: 24px;">+</span>',onClick:()=>{we(null)}});let[t,s]=await Promise.all([C("exercises"),C("sets")]),r=t.sort((c,f)=>c.name.localeCompare(f.name)),n=new Map;for(let c of s)n.set(c.exerciseId,(n.get(c.exerciseId)??0)+1);let o="",i=null;e.container.innerHTML=`
    <div class="search-bar">
      <input class="search-input" id="ex-search" placeholder="Search exercises" />
    </div>
    <div class="chip-row" id="ex-chips"></div>
    <div class="list" id="ex-list"></div>
  `,e.container.scrollTop=0;let d=e.container.querySelector("#ex-list"),u=e.container.querySelector("#ex-chips"),l=e.container.querySelector("#ex-search");function b(){u.innerHTML=Ee(r,i);for(let c of u.querySelectorAll(".chip"))c.addEventListener("click",()=>{let f=c.dataset.cat;i=f==="All"?null:f,b(),S()})}function S(){let c=r.filter(f=>!i||R(f)===i).filter(f=>!o||f.name.toLowerCase().includes(o.toLowerCase()));if(c.length===0){d.innerHTML='<div class="list-row"><div class="row-main" style="color: var(--text-secondary);">No matches</div></div>';return}d.innerHTML=c.map(f=>`
        <button class="list-row" data-id="${f.id}">
          ${Z(f)}
          <div class="row-trailing trailing-stack">${ee(n.get(f.id)??0)}</div>
          <div class="chevron">\u203A</div>
        </button>
      `).join("");for(let f of d.querySelectorAll("[data-id]"))f.addEventListener("click",()=>{ps(e,f.dataset.id).catch(y=>{e.container.innerHTML=X(y)})})}l.addEventListener("input",()=>{o=l.value,S()}),b(),S()}function ps(e,t){return We(e,t,()=>Dt(e))}async function We(e,t,s){e.setBack(s);let r=await Tt(t);if(!r){e.container.innerHTML=X({message:"Exercise not found."});return}e.setTitle(Y(r.exercise)),e.setAction(r.exercise.isCustom?{label:"Delete exercise",html:Be(),onClick:async()=>{if(r.completed.length>0){alert(`Can't delete \u2014 this exercise has ${r.completed.length} logged set${r.completed.length===1?"":"s"}.`);return}confirm("Delete this custom exercise?")&&(await $e("exercises",t),H("data:changed"))}}:null),e.container.innerHTML=r.html,e.container.scrollTop=0,e.container.querySelector("#exd-edit")?.addEventListener("click",()=>{we(r.exercise,()=>We(e,t,s))}),Et(e.container);let n=e.container.querySelector(".exercise-chart-mount");n&&r.chartData.length>0&&ve(n,r.chartData,{unit:"lbs"})}function Et(e){for(let t of e.querySelectorAll(".recent-set[data-workout-id]"))t.addEventListener("click",()=>Lt(t.dataset.workoutId))}async function Pe(e){let t=await Tt(e);if(!t)return;let s=F({html:`
      <div class="sheet-header">
        <button class="btn-text" id="exd-close">Done</button>
        <div class="title">${D(Y(t.exercise))}</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">${t.html}</div>
    `,onMount(r){r.querySelector("#exd-close").addEventListener("click",()=>s()),r.querySelector("#exd-edit")?.addEventListener("click",()=>{we(t.exercise,()=>{s(),H("data:changed"),Pe(e)})}),Et(r);let n=r.querySelector(".exercise-chart-mount");n&&t.chartData.length>0&&ve(n,t.chartData,{unit:"lbs"})}})}async function Tt(e){let[t,s,r,n]=await Promise.all([de("exercises",e),C("sets"),C("workouts"),re()]);if(!t)return null;let o=new Map(r.map(c=>[c.id,c])),i=G(s).filter(c=>c.exerciseId===e&&c.workoutId!==n?.id&&o.has(c.workoutId)).map(c=>({...c,workout:o.get(c.workoutId)})).sort((c,f)=>c.workout.startedAt-f.workout.startedAt),d=i.reduce((c,f)=>c+f.weight*f.reps,0),u=i.reduce((c,f)=>!c||f.weight>c.weight||f.weight===c.weight&&f.reps>c.reps?f:c,null),l=new Map;for(let c of i){if(c.weight<=0||c.reps<=0||(c.setType||"working")==="warmup")continue;let f=l.get(c.workoutId)||{date:c.workout.startedAt,total:0,count:0};f.total+=c.weight*c.reps,f.count+=1,l.set(c.workoutId,f)}let b=Array.from(l.values()).map(({date:c,total:f,count:y})=>({date:c,value:f/y})).sort((c,f)=>c.date-f.date),S=`
    <div class="section">Details</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Equipment</div><div class="stat-value">${D(t.equipment)}</div></div>
      <div class="stat-row"><div class="stat-label">Muscle</div><div class="stat-value">${D(R(t))}</div></div>
      <button class="list-row button" id="exd-edit">
        <div class="row-main"><div class="row-title" style="color: var(--accent);">Edit Name, Muscle & Equipment</div></div>
      </button>
    </div>

    ${i.length>0?`
      <div class="section">Stats</div>
      <div class="form-section">
        <div class="stat-row"><div class="stat-label">Total Sets</div><div class="stat-value">${i.length.toLocaleString()}</div></div>
        <div class="stat-row"><div class="stat-label">Total Volume</div><div class="stat-value">${ne(d)}</div></div>
        ${u?`<div class="stat-row"><div class="stat-label">Best Set</div><div class="stat-value">${fe(u.weight)} \xD7 ${u.reps}</div></div>`:""}
      </div>
    `:""}

    ${b.length>0?`
      <div class="section">Avg working-set volume per workout</div>
      <div class="exercise-chart-mount"></div>
    `:""}

    ${i.length>0?`
      <div class="section">Recent Sets \xB7 tap to view that workout</div>
      <div class="form-section">
        ${i.slice(-30).reverse().map(c=>`
          <button class="stat-row recent-set" data-workout-id="${D(c.workoutId)}">
            <div class="stat-label" style="font-size: 13px; color: var(--text-secondary);">${me(c.workout.startedAt)}</div>
            <div class="stat-value" style="color: var(--text);">${fe(c.weight)} \xD7 ${c.reps} <span class="name-chevron">\u203A</span></div>
          </button>
        `).join("")}
      </div>
    `:`
      <div class="empty-state" style="padding: 32px 24px;">
        <p style="color: var(--text-secondary);">No completed sets yet.</p>
      </div>
    `}
  `;return{exercise:t,completed:i,chartData:b,html:S}}function qt(e){let t=!0,s=null;return e.container.innerHTML="",re().then(r=>{t&&(r?s=vs(e,r):fs(e))}).catch(r=>{t&&(e.container.innerHTML=`<div class="empty-state"><div class="empty-icon">!</div><h2>Couldn't load</h2><p>${D(r.message)}</p></div>`)}),()=>{t=!1,typeof s=="function"&&s()}}async function fs(e){e.setTitle("Workout");let t=await oe(),s=t[0],r=Ye(t),n=r?Ae(r.normalized):O[0],i=r&&Ct(r.startedAt)==="today"?"Tomorrow":"Today",d=s?`<div class="last-workout-hint">Last: <strong>${D(s.name)}</strong> \xB7 ${Ct(s.startedAt)}</div>`:"",u=`<div class="next-workout-hint">${i}: <strong>${D(n)}</strong></div>`;e.container.innerHTML=`
    <div class="workout-start">
      <div class="icon">\u{1F3CB}\uFE0F</div>
      <h2>No active workout</h2>
      <p>Start one to begin logging sets.</p>
      ${d}
      ${u}
    </div>
    <div class="action-section">
      <button id="start-btn" class="btn-primary">Start Empty Workout</button>
    </div>
  `,e.container.querySelector("#start-btn").addEventListener("click",()=>ms(n,i))}function Ct(e){let t=new Date,s=new Date(e),r=o=>new Date(o.getFullYear(),o.getMonth(),o.getDate()).getTime(),n=Math.round((r(t)-r(s))/(1440*60*1e3));return n===0?"today":n===1?"yesterday":n<7?`${n} days ago`:n<14?"a week ago":`${Math.round(n/7)} weeks ago`}function ms(e,t="Today"){hs(e,async s=>{let r={id:J(),name:s,startedAt:Date.now(),endedAt:null,notes:""};await P("workouts",r),H("workout:changed")},t)}function hs(e,t,s="Today"){let n=F({html:`
      <div class="sheet-header">
        <button class="btn-text" id="wt-cancel">Cancel</button>
        <div class="title">New Workout</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">
        <div class="section">Pick a type</div>
        <div class="form-section">
          ${O.map(o=>{let d=o===e?` <span class="badge">${D(s)}</span>`:"";return`
              <button class="list-row button" data-name="${D(o)}">
                <div class="row-main"><div class="row-title" style="color: ${Ce(o)}; font-weight: 600;">${D(o)}${d}</div></div>
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
    `,onMount(o){o.querySelector("#wt-cancel").addEventListener("click",()=>n());for(let u of o.querySelectorAll(".list-row.button[data-name]"))u.addEventListener("click",()=>{let l=u.dataset.name;n(),t(l)});let i=o.querySelector("#wt-custom"),d=o.querySelector("#wt-go");i.addEventListener("input",()=>{d.disabled=i.value.trim().length===0}),d.addEventListener("click",()=>{let u=i.value.trim();u&&(n(),t(u))}),setTimeout(()=>i.focus(),50)}})}function vs(e,t){let s=[],r=[],n=new Map,o=new Map,i=null;e.container.innerHTML=`
    <div class="active-workout">
      <div class="workout-header">
        <input class="workout-name-input" id="wname" value="${D(t.name)}" placeholder="Workout name" />
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
  `,e.container.querySelector("#calc-fab").addEventListener("click",Ms);let d=()=>{e.setTitle(at((Date.now()-t.startedAt)/1e3))};d(),i=setInterval(d,1e3);let u=e.container.querySelector("#wname");u.addEventListener("input",async()=>{t.name=u.value,await P("workouts",{...t}),te()});let l=new Map;e.container.querySelector("#add-exercise-btn").addEventListener("click",()=>{Ss(s,o,async h=>{await bs(t,r,h),await b()})}),e.container.querySelector("#finish-btn").addEventListener("click",async()=>{if(confirm("Finish this workout?")){await ks(t,r);try{let{filename:h}=await Ge();W(`Saved \xB7 backup: ${h}`)}catch(h){W(`Saved \xB7 backup failed: ${h.message}`)}H("workout:changed")}}),e.container.querySelector("#discard-btn").addEventListener("click",async()=>{confirm("Discard this workout? This cannot be undone.")&&(await Le(t.id),H("workout:changed"))});async function b(){let[h,m,$]=await Promise.all([C("sets"),C("workouts"),C("exercises")]);s=$,r=h.filter(x=>x.workoutId===t.id).sort((x,k)=>x.order-k.order),n=st(h,m,t.id),l=f(h,$,t.id),o=new Map;for(let x of h)o.set(x.exerciseId,(o.get(x.exerciseId)??0)+1);M(),S()}function S(){let h=new Map(s.map(g=>[g.id,g])),m=[],$=new Map;for(let g of r){let B=h.get(g.exerciseId);if(!B)continue;let L=R(B);if(m.includes(L)||m.push(L),!g.completed)continue;let A=(g.weight||0)*(g.reps||0);A<=0||$.set(L,($.get(L)??0)+A)}let x=[...$.values()].reduce((g,B)=>g+B,0),k=e.container.querySelector("#workout-progress");if(!k)return;if(m.length===0){k.innerHTML="";return}let E=m.map(g=>{let B=l.get(g)??0,L=$.get(g)??0;return{muscle:g,record:B,cur:L,span:Math.max(B,L)}}),T=Math.max(...E.map(g=>g.span)),p=T>0?T*.12:1;E=E.map(g=>({...g,span:Math.max(g.span,p)}));let a=Math.max(...E.map(g=>g.span)),v=E.map(({muscle:g,record:B,cur:L,span:A})=>{let I=A/a*100,z=L>0?Math.min(100,L/A*100):0,q;if(B>0){let ie=Math.round(L/B*100);q=L>B?`${ie}% \u{1F525}`:`${ie}%`}else q=L>0?"new \u{1F525}":"new";let N=B>0?`${U(L)} / ${U(B)} \xB7 ${q}`:`${U(L)} \xB7 ${q}`,V=mt(g);return`
        <div class="vol-muscle" style="width: ${I.toFixed(2)}%; --mcolor: ${V}; --mtext: ${vt(V)};" title="${D(g)}: ${U(L)} / record ${U(B)} lbs">
          <div class="vol-fill" style="width: ${z.toFixed(2)}%;"></div>
          <div class="vol-info${z>55?" on-fill":""}">
            <span class="seg-name">${D(g)}</span>
            <span class="seg-vol">${N}</span>
          </div>
        </div>
      `}).join(""),w=`<strong>${U(x)} lbs</strong> total`;k.innerHTML=`
      <div class="vol-bars">${v}</div>
      <div class="vol-label">${w}</div>
    `,requestAnimationFrame(()=>{for(let g of k.querySelectorAll(".vol-muscle"))c(g)})}function c(h){let m=h.querySelector(".seg-name"),$=h.querySelector(".seg-vol"),x=h.clientWidth-4;if(x<=0)return;if($){let E=10;for($.style.fontSize=`${E}px`;$.scrollWidth>x&&E>6;)E-=.5,$.style.fontSize=`${E}px`}if(!m)return;m.style.display="";let k=11;for(m.style.fontSize=`${k}px`;m.scrollWidth>x&&k>5;)k-=.5,m.style.fontSize=`${k}px`}function f(h,m,$){let x=new Map(m.map(T=>[T.id,T])),k=new Map,E=new Map;for(let T of G(h)){if(T.workoutId===$)continue;let p=x.get(T.exerciseId);if(!p)continue;let a=(T.weight||0)*(T.reps||0);if(a<=0)continue;let v=R(p),w=E.get(T.workoutId);w||E.set(T.workoutId,w=new Map),w.set(v,(w.get(v)??0)+a)}for(let T of E.values())for(let[p,a]of T)a>(k.get(p)??0)&&k.set(p,a);return k}async function y(h){if(!h.completed||(h.setType||"working")==="warmup"||!(h.weight>0)||!(h.reps>0))return;let m=s.find(a=>a.id===h.exerciseId);if(!m)return;let $=await C("sets"),x=G($).filter(a=>a.exerciseId===h.exerciseId&&a.id!==h.id&&(a.setType||"working")!=="warmup"&&a.weight>0&&a.reps>0);if(x.length===0)return;let k=[],E=x.reduce((a,v)=>Math.max(a,v.weight),0);h.weight>E&&k.push(`Heaviest weight ever: ${pe(h.weight)} lbs`);let T=h.weight*h.reps,p=x.reduce((a,v)=>Math.max(a,v.weight*v.reps),0);if(T>p&&k.push(`Most volume in a set: ${pe(h.weight)}\xD7${h.reps} = ${U(T)} lbs`),k.length>0){let a=k.length>1?"New records":"New record";W(`\u{1F3C6} ${Y(m)} \u2014 ${a}!
${k.join(`
`)}`,0,{persistUntilClick:!0})}}function M(){let h=new Map(s.map(p=>[p.id,p])),m=[],$=new Map;for(let p of r)$.has(p.exerciseId)||($.set(p.exerciseId,[]),m.push(p.exerciseId)),$.get(p.exerciseId).push(p);for(let[,p]of $)p.sort((a,v)=>a.order-v.order);let x=e.container.querySelector("#exercise-sections");if(m.length===0){x.innerHTML=`
        <div class="empty-state" style="padding: 40px 24px; min-height: auto;">
          <p style="color: var(--text-secondary);">Add an exercise to start logging sets.</p>
        </div>`;return}x.innerHTML=m.map(p=>{let a=h.get(p),v=$.get(p),w=n.get(p)??new Map;return ws(a,v,w,o.get(p)??0)}).join("");function k(p){delete p.bumpedBy,delete p.preBumpWeight,delete p.preBumpReps}function E(p){let a=r.filter(L=>L.exerciseId===p.exerciseId).sort((L,A)=>L.order-A.order),v=p.setType||"working",w=0,g=0;for(let L of a)if(g+=1,(L.setType||"working")===v&&(w+=1),L.id===p.id)break;let B=ge(v,w,n.get(p.exerciseId),g);return B&&B.weight>0&&B.reps>0?{weight:B.weight,reps:B.reps}:null}async function T(p){await It(p.id,r),p.completed&&await At(p,r,E);for(let a of r){if(a.exerciseId!==p.exerciseId)continue;let v=x.querySelector(`.set-row[data-set-id="${a.id}"]`);if(!v)continue;let w=v.querySelector(".weight-input"),g=v.querySelector(".reps-input");w&&document.activeElement!==w&&(w.value=a.weight>0?String(a.weight):""),g&&document.activeElement!==g&&(g.value=a.reps>0?String(a.reps):"")}}for(let p of x.querySelectorAll(".set-row-wrap")){let a=p.querySelector(".set-row"),v=a.dataset.setId,w=r.find(q=>q.id===v);if(!w)continue;let g=a.querySelector(".weight-input"),B=a.querySelector(".reps-input"),L=a.querySelector(".complete-btn");ys(p,async()=>{await $e("sets",w.id),await b()});let A=Ne(async()=>{await T(w),w.completed&&S()},200);g.addEventListener("input",()=>{w.weight=parseFloat(g.value)||0,k(w),P("sets",{...w}).catch(q=>console.error("Set save failed",q)),A()});let I=Ne(async()=>{await T(w),w.completed&&S()},200);B.addEventListener("input",()=>{w.reps=parseInt(B.value,10)||0,k(w),P("sets",{...w}).catch(q=>console.error("Set save failed",q)),I()}),L.addEventListener("click",async()=>{let q=w.completed;w.completed=!w.completed,w.completed&&k(w),await P("sets",w),a.classList.toggle("completed",w.completed),L.innerHTML=Pt(w.completed);let N=a.querySelector(".set-number")?.textContent?.trim()||"";L.setAttribute("aria-label",`${w.completed?"Mark incomplete":"Mark complete"} set ${N}`),S(),!q&&w.completed?(await At(w,r,E)&&M(),await y(w)):q&&!w.completed&&await It(w.id,r)&&M()});let z=a.querySelector(".set-number");z&&z.addEventListener("click",async()=>{let N=(w.setType||"working")==="warmup"?"working":"warmup";if(w.setType=N,!w.completed){let V=r.filter(se=>se.exerciseId===w.exerciseId).sort((se,Rt)=>se.order-Rt.order),ie=0,Je=0;for(let se of V)if(Je+=1,(se.setType||"working")===N&&(ie+=1),se.id===w.id)break;let ae=ge(N,ie,n.get(w.exerciseId),Je);ae&&ae.weight>0&&ae.reps>0&&(w.weight=ae.weight,w.reps=ae.reps)}await P("sets",w),M()})}for(let p of x.querySelectorAll(".add-set-btn"))p.addEventListener("click",async()=>{let a=p.dataset.exerciseId;await xs(t,r,a,n.get(a)??new Map),await b()});for(let p of x.querySelectorAll(".exercise-menu"))p.addEventListener("click",async()=>{let a=p.dataset.exerciseId;confirm("Remove this exercise from the workout?")&&(await Oe("sets",r.filter(v=>v.exerciseId===a).map(v=>v.id)),await b())});for(let p of x.querySelectorAll(".exercise-name-btn"))p.addEventListener("click",()=>{i&&(clearInterval(i),i=null),We(e,p.dataset.exerciseId,()=>e.refresh())})}return b(),()=>{i&&clearInterval(i)}}function ws(e,t,s=new Map,r=0){let n=0,o=0,i=t.map((d,u)=>{let l=d.setType||"working",b,S;l==="warmup"?(o+=1,S=o,b=`W${o}`):(n+=1,S=n,b=String(n));let c=ge(l,S,s,u+1);return gs(d,b,c)}).join("");return`
    <div class="exercise-section">
      <div class="exercise-section-header">
        <button class="exercise-name-btn" data-exercise-id="${e?.id}">${Z(e)}</button>
        <div class="row-trailing trailing-stack">${ee(r)}</div>
        <button class="menu exercise-menu" data-exercise-id="${e?.id}" aria-label="Remove ${D(Y(e))} from workout">\xD7</button>
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
  `}function ge(e,t,s,r=null){if(!s||typeof s.get!="function")return null;let n=s.get(`${e}#${t}`);return n||(r!=null?s.get(`any#${r}`)??null:null)}function gs(e,t,s){let r=e.setType||"working",n=s&&s.weight>0&&s.reps>0?`${pe(s.weight)} \xD7 ${s.reps}`:"\u2014";return`
    <div class="set-row-wrap" data-set-id="${e.id}">
      <button class="set-swipe-delete" data-set-id="${e.id}" aria-label="Delete set ${t}">Delete</button>
      <div class="set-row type-${r}${e.completed?" completed":""}" data-set-id="${e.id}">
        <button class="set-number" aria-label="Set ${t}, tap to mark as ${r==="warmup"?"working":"warmup"}">${t}</button>
        <div class="prev" aria-label="Previous">${n}</div>
        <input class="weight-input" type="number" inputmode="decimal" step="0.5" aria-label="Weight in pounds for set ${t}"
               placeholder="0" value="${e.weight>0?e.weight:""}" />
        <input class="reps-input" type="number" inputmode="numeric" step="1" aria-label="Repetitions for set ${t}"
               placeholder="0" value="${e.reps>0?e.reps:""}" />
        <button class="complete-btn" aria-label="${e.completed?"Mark incomplete":"Mark complete"} set ${t}">${Pt(e.completed)}</button>
      </div>
    </div>
  `}function ys(e,t){let s=e.querySelector(".set-row"),r=e.querySelector(".set-swipe-delete");if(!s||!r)return;let n=88,o=0,i=0,d=0,u=0,l=!1,b=!1,S=!1,c=!1,f=()=>Math.max(140,o*.5);function y(x,k){s.style.transition=k?"transform 0.18s ease":"none",s.style.transform=`translateX(${x}px)`,r.style.width=`${Math.max(n,-x)}px`,e.classList.toggle("will-delete",x<=-f())}function M(x=!0){S=!1,y(0,x),e.classList.remove("swiped-open")}function h(x=!0){document.querySelectorAll(".set-row-wrap.swiped-open").forEach(k=>{if(k!==e){let E=k.querySelector(".set-row");E&&(E.style.transition="transform 0.18s ease",E.style.transform="translateX(0)");let T=k.querySelector(".set-swipe-delete");T&&(T.style.width=""),k.classList.remove("swiped-open","will-delete")}}),S=!0,y(-n,x),e.classList.add("swiped-open")}function m(){s.style.transition="transform 0.16s ease-out",s.style.transform=`translateX(${-o}px)`,r.style.width=`${o}px`,setTimeout(t,150)}s.addEventListener("touchstart",x=>{o=e.clientWidth||s.clientWidth,i=x.touches[0].clientX,d=x.touches[0].clientY,u=S?-n:0,l=!0,b=!1,c=!!x.target.closest("input, button, select, textarea")},{passive:!0}),s.addEventListener("touchmove",x=>{if(!l)return;let k=x.touches[0].clientX-i,E=x.touches[0].clientY-d;if(!b){if(Math.abs(E)>Math.abs(k)+4){l=!1;return}Math.abs(k)>8&&(b=!0,c&&document.activeElement?.blur&&document.activeElement.blur())}if(!b)return;x.cancelable&&x.preventDefault();let T=S?-n:0;u=Math.min(0,Math.max(-o,T+k)),y(u,!1)},{passive:!1});function $(){l&&(l=!1,b&&(u<=-f()?m():u<-n/2?h():M()))}s.addEventListener("touchend",$),s.addEventListener("touchcancel",$),r.addEventListener("click",x=>{x.stopPropagation(),t()})}function Pt(e){return e?'<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>':'<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>'}async function bs(e,t,s){let r=t.reduce((n,o)=>Math.max(n,o.order),-1)+1;for(let n of s){let o=(await tt(n,e.id)).filter(u=>(u.weight||0)>0&&(u.reps||0)>0),d=(o.length>0?o:[{weight:0,reps:0,setType:"working"}]).map(u=>({id:J(),workoutId:e.id,exerciseId:n,weight:u.weight??0,reps:u.reps??0,setType:u.setType||"working",completed:!1,order:r++,createdAt:Date.now()}));await ue("sets",d)}}async function At(e,t,s){let r=(e.weight||0)*(e.reps||0);if(r<=0)return!1;let n=!1;for(let o of t)if(o.exerciseId===e.exerciseId&&o.id!==e.id&&!((o.order??0)<=(e.order??0))&&!o.completed&&(o.weight||0)*(o.reps||0)<r){if(o.bumpedBy==null){let i=s?.(o);o.preBumpWeight=i?i.weight:o.weight,o.preBumpReps=i?i.reps:o.reps}o.bumpedBy=e.id,o.weight=e.weight,o.reps=e.reps,await P("sets",o),n=!0}return n}async function It(e,t){let s=!1;for(let r of t)r.bumpedBy===e&&(r.completed||(r.preBumpWeight!=null&&(r.weight=r.preBumpWeight),r.preBumpReps!=null&&(r.reps=r.preBumpReps)),delete r.bumpedBy,delete r.preBumpWeight,delete r.preBumpReps,await P("sets",r),s=!0);return s}async function xs(e,t,s,r=new Map){let n=t.filter(M=>M.exerciseId===s),o=n[n.length-1],i=M=>(M?.weight||0)*(M?.reps||0),d=n.filter(M=>(M.setType||"working")!=="warmup"),u=d.length+1,l=ge("working",u,r,n.length+1),b=d.filter(M=>M.weight>0&&M.reps>0).reduce((M,h)=>!M||i(h)>i(M)?h:M,null),S=d.some((M,h)=>{let m=ge("working",h+1,r);return m&&m.weight>0&&m.reps>0&&i(M)>i(m)}),c=o?.weight??0,f=o?.reps??0;b&&(!l||S)&&(c=b.weight,f=b.reps);let y={id:J(),workoutId:e.id,exerciseId:s,weight:c,reps:f,completed:!1,order:(o?.order??-1)+1,createdAt:Date.now()};await P("sets",y)}async function ks(e,t){await Oe("sets",t.filter(s=>!s.completed&&((s.weight||0)===0||(s.reps||0)===0)).map(s=>s.id)),e.endedAt=Date.now(),await P("workouts",e)}function Ss(e,t,s){let r=new Set,n="",o=null,i=F({html:`
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
    `,onMount(d){let u=d.querySelector("#picker-list"),l=d.querySelector("#picker-add"),b=d.querySelector("#picker-cancel"),S=d.querySelector("#picker-custom"),c=d.querySelector("#picker-search"),f=d.querySelector("#picker-chips");function y(){f.innerHTML=Ee(e,o);for(let h of f.querySelectorAll(".chip"))h.addEventListener("click",()=>{let m=h.dataset.cat;o=m==="All"?null:m,y(),M()})}function M(){let h=e.filter(m=>!o||R(m)===o).filter(m=>!n||m.name.toLowerCase().includes(n.toLowerCase())).sort((m,$)=>{let x=t.get(m.id)??0,k=t.get($.id)??0;return x!==k?k-x:m.name.localeCompare($.name)});u.innerHTML=h.length===0?'<div class="list-row"><div class="row-main" style="color:var(--text-secondary)">No matches</div></div>':h.map(m=>`
                <button class="list-row" data-id="${m.id}">
                  ${Z(m)}
                  <div class="row-trailing trailing-stack">
                    ${ee(t.get(m.id)??0)}
                    ${r.has(m.id)?$s():""}
                  </div>
                </button>
              `).join("");for(let m of u.querySelectorAll(".list-row[data-id]"))m.addEventListener("click",()=>{let $=m.dataset.id;r.has($)?r.delete($):r.add($),l.disabled=r.size===0,l.textContent=r.size===0?"Add":`Add (${r.size})`,M()})}c.addEventListener("input",()=>{n=c.value,M()}),b.addEventListener("click",()=>i()),l.addEventListener("click",()=>{s(Array.from(r)),i()}),S.addEventListener("click",()=>{we(null,async h=>{e.push(h),r.add(h.id),y(),M(),l.disabled=!1,l.textContent=`Add (${r.size})`})}),y(),M()}})}function $s(){return'<svg viewBox="0 0 24 24" width="22" height="22" fill="var(--green)"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'}function we(e,t){let s=!!e,r=s?R(e):null,n=!r||he.includes(r)?he:[r,...he],o=e?.equipment,i=!o||De.includes(o)?De:[o,...De],d=F({html:`
      <div class="sheet-header">
        <button class="btn-text" id="ce-cancel">Cancel</button>
        <div class="title">${s?"Edit Exercise":"New Exercise"}</div>
        <button class="btn-text primary" id="ce-save" ${s?"":"disabled"}>Save</button>
      </div>
      <div class="sheet-content">
        <div class="section">Name</div>
        <div class="form-section">
          <div class="form-row">
            <input id="ce-name" placeholder="e.g. Cable Lateral Raise" style="text-align: left;" value="${D(e?.name??"")}" />
          </div>
        </div>
        <div class="section">Muscle</div>
        <div class="form-section">
          <div class="form-row">
            <label for="ce-cat">Muscle</label>
            <select id="ce-cat">${n.map(u=>`<option${u===r?" selected":""}>${D(u)}</option>`).join("")}</select>
          </div>
        </div>
        <div class="section">Equipment</div>
        <div class="form-section">
          <div class="form-row">
            <label for="ce-eq">Equipment</label>
            <select id="ce-eq">${i.map(u=>`<option${u===o?" selected":""}>${D(u)}</option>`).join("")}</select>
          </div>
        </div>
      </div>
    `,onMount(u){let l=u.querySelector("#ce-name"),b=u.querySelector("#ce-save");l.addEventListener("input",()=>{b.disabled=l.value.trim().length===0}),u.querySelector("#ce-cancel").addEventListener("click",()=>d()),b.addEventListener("click",async()=>{let S=l.value.trim();if(!S)return;let c=u.querySelector("#ce-cat").value,f=u.querySelector("#ce-eq").value,y=s?{...e,name:S,muscle:c,equipment:f}:{id:J(),name:S,muscle:c,category:c,equipment:f,notes:"",isCustom:!0,createdAt:Date.now()};await P("exercises",y),d(),t?.(y),s||H("data:changed")}),s||setTimeout(()=>l.focus(),50)}})}function Ms(){let t=[["AC","clear","fn"],["\xB1","sign","fn"],["\u232B","back","fn"],["\xF7","op","op"],["7","digit"],["8","digit"],["9","digit"],["\xD7","op","op"],["4","digit"],["5","digit"],["6","digit"],["\u2212","op","op"],["1","digit"],["2","digit"],["3","digit"],["+","op","op"],["0","digit","zero"],[".","dot"],["=","equals","op"]].map(([s,r,n])=>`<button class="calc-key${n?` calc-${n}`:""}" data-action="${r}" data-key="${D(s)}">${D(s)}</button>`).join("");F({html:`
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
    `,onMount(s,r){let n=s.querySelector("#calc-expr"),o=s.querySelector("#calc-result"),i={"+":(a,v)=>a+v,"\u2212":(a,v)=>a-v,"\xD7":(a,v)=>a*v,"\xF7":(a,v)=>v===0?NaN:a/v},d=a=>a==="+"||a==="\u2212"||a==="\xD7"||a==="\xF7",u=a=>{if(!isFinite(a))return"Error";let v=parseFloat(a.toFixed(8)).toString();return v.replace("-","").replace(".","").length>12&&(v=a.toPrecision(10).replace(/\.?0+$/,"")),v},l=["0"],b=!1,S=!1,c="",f=()=>l[l.length-1];function y(){n.textContent=S?"":c,o.textContent=S?"Error":l.join(" ");let a=!S&&d(f())?f():null;for(let v of s.querySelectorAll(".calc-op"))v.classList.toggle("selected",v.dataset.key===a)}function M(a){if(S&&(l=["0"],S=!1),b)return l=[a],b=!1,y();d(f())?l.push(a):l[l.length-1]=f()==="0"?a:f()+a,y()}function h(){if(S&&(l=["0"],S=!1),b)return l=["0."],b=!1,y();d(f())?l.push("0."):f().includes(".")||(l[l.length-1]=f()+"."),y()}function m(a){S||(b=!1,d(f())?l[l.length-1]=a:l.push(a),y())}function $(){l=["0"],b=!1,S=!1,y()}function x(){if(S||d(f()))return;let a=f();l[l.length-1]=a.startsWith("-")?a.slice(1):a==="0"?"0":"-"+a,y()}function k(){if(S)return $();if(b=!1,d(f()))return l.pop(),y();let a=f().slice(0,-1);a===""||a==="-"?l.length>1?l.pop():l=["0"]:l[l.length-1]=a,y()}function E(){if(S)return;let a=l.slice();if(d(a[a.length-1])&&a.pop(),a.length<3)return;let v=parseFloat(a[0]);for(let w=1;w<a.length;w+=2)if(v=i[a[w]](v,parseFloat(a[w+1])),!isFinite(v))return S=!0,y();c=`${a.join(" ")} =`,l=[u(v)],b=!0,y()}function T(a){let{action:v,key:w}=a.dataset;v!=="equals"&&(c=""),v==="digit"?M(w):v==="dot"?h():v==="clear"?$():v==="sign"?x():v==="back"?k():v==="op"?m(w):v==="equals"&&E()}let p=null;for(let a of s.querySelectorAll(".calc-key"))a.addEventListener("pointerdown",v=>{v.preventDefault(),p=a,a.classList.add("pressed")}),a.addEventListener("pointerup",v=>{v.preventDefault(),a.classList.remove("pressed"),p===a&&T(a),p=null}),a.addEventListener("pointercancel",()=>{a.classList.remove("pressed"),p=null}),a.addEventListener("pointerleave",()=>a.classList.remove("pressed"));s.querySelector("#calc-done").addEventListener("click",()=>r())}})}function xe(){let e=window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===!0,t;e?t=Math.max(window.innerHeight||0,window.visualViewport?.height||0,window.screen?.height||0):t=window.visualViewport?.height||window.innerHeight,document.documentElement.style.setProperty("--app-height",`${t}px`)}xe();window.addEventListener("resize",xe);window.addEventListener("orientationchange",xe);window.addEventListener("pageshow",xe);window.visualViewport?.addEventListener("resize",xe);var Wt={workout:{title:"Workout",render:qt},exercises:{title:"Exercises",render:Bt},progress:{title:"Progress",render:xt}},ye=document.getElementById("view-content"),Ls=document.getElementById("nav-title"),Ht=document.getElementById("nav-back"),_=document.getElementById("nav-action"),be="workout",Qe=null,Fe=null,Re=null,He={container:ye,setTitle(e){Ls.textContent=e},setAction(e){if(!e){_.hidden=!0,_.innerHTML="",_.removeAttribute("aria-label"),Fe=null;return}_.hidden=!1,e.label?_.setAttribute("aria-label",e.label):_.removeAttribute("aria-label"),e.html?_.innerHTML=e.html:_.textContent=e.label??"",Fe=e.onClick},setBack(e){Qe=e,Ht.hidden=!e},refresh(){ke(be)},toast(e){W(e)}};function Bs(){if(typeof Re=="function")try{Re()}catch(e){console.error(e)}Re=null}function ke(e){be=e,ft(e),document.querySelectorAll(".tab").forEach(t=>{t.setAttribute("aria-selected",String(t.dataset.tab===e))}),Bs(),He.setTitle(Wt[e].title),He.setAction(null),He.setBack(null),ye.innerHTML="",ye.scrollTop=0;try{Re=Wt[e].render(He)}catch(t){console.error("Render failed",t),ye.innerHTML=`<div class="empty-state"><div class="empty-icon">!</div><h2>Render error</h2><p>${D(t.message)}</p></div>`}}document.querySelectorAll(".tab").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll(".sheet-backdrop").forEach(t=>t.dismissSheet?.()),ke(e.dataset.tab)})});Ht.addEventListener("click",()=>{Qe&&Qe()});_.addEventListener("click",()=>{Fe&&Fe()});Ve("data:changed",()=>{te(),ke(be)});Ve("workout:changed",()=>{te(),be==="workout"&&ke(be)});document.addEventListener("visibilitychange",()=>{document.visibilityState==="visible"&&te()});async function Ds(){try{await j();let e=await ut();e>0&&console.info(`Seeded ${e} exercises.`),await yt(),ke("workout"),te()}catch(e){console.error("Init failed:",e),ye.innerHTML=`
      <div class="empty-state">
        <div class="empty-icon">!</div>
        <h2>Storage unavailable</h2>
        <p>${D(e.message??String(e))}</p>
        <p>If you are running this from a <code>file://</code> URL, serve it through a local web server instead.</p>
      </div>`}}Ds();
