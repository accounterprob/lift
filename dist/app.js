var Bs="lift";var vt=["exercises","workouts","sets","stateOfMind","medications","doseEvents"],Ee=null;function j(){return Ee?Promise.resolve(Ee):new Promise((e,t)=>{let s=indexedDB.open(Bs,4);s.onerror=()=>t(s.error),s.onsuccess=()=>{Ee=s.result,e(Ee)},s.onupgradeneeded=()=>{let o=s.result;if(!o.objectStoreNames.contains("exercises")){let n=o.createObjectStore("exercises",{keyPath:"id"});n.createIndex("name","name",{unique:!1}),n.createIndex("category","category",{unique:!1})}if(o.objectStoreNames.contains("workouts")||o.createObjectStore("workouts",{keyPath:"id"}).createIndex("startedAt","startedAt",{unique:!1}),!o.objectStoreNames.contains("sets")){let n=o.createObjectStore("sets",{keyPath:"id"});n.createIndex("workoutId","workoutId",{unique:!1}),n.createIndex("exerciseId","exerciseId",{unique:!1})}if(o.objectStoreNames.contains("stateOfMind")||o.createObjectStore("stateOfMind",{keyPath:"id"}).createIndex("date","date",{unique:!1}),o.objectStoreNames.contains("medications")||o.createObjectStore("medications",{keyPath:"id"}),!o.objectStoreNames.contains("doseEvents")){let n=o.createObjectStore("doseEvents",{keyPath:"id"});n.createIndex("medicationId","medicationId",{unique:!1}),n.createIndex("date","date",{unique:!1})}}})}function pe(e){return new Promise((t,s)=>{e.onsuccess=()=>t(e.result),e.onerror=()=>s(e.error)})}async function me(e,t="readonly"){return(await j()).transaction(e,t).objectStore(e)}function te(e,t,s){return new Promise((o,n)=>{let i=e.transaction(t,"readwrite"),r;try{r=s(i)}catch(a){try{i.abort()}catch{}n(a);return}i.oncomplete=()=>o(r),i.onerror=()=>n(i.error),i.onabort=()=>n(i.error)})}async function A(e){return pe((await me(e)).getAll())}async function se(e,t){return pe((await me(e)).get(t))}async function q(e,t){return await pe((await me(e,"readwrite")).put(t)),t}async function Y(e,t){let s=await j();return te(s,e,o=>{let n=o.objectStore(e);for(let i of t)n.put(i)})}async function ae(e,t){return pe((await me(e,"readwrite")).delete(t))}async function _e(e,t){if(t.length===0)return;let s=await j();return te(s,e,o=>{let n=o.objectStore(e);for(let i of t)n.delete(i)})}async function Le(e,t,s){let o=await me(e);return pe(o.index(t).getAll(s))}async function ht(e){let t=await j();return te(t,vt,s=>{for(let o of vt){let n=s.objectStore(o);n.clear();for(let i of e[o]??[])n.put(i)}})}function X(e){let t=new Set;for(let s of e)s.completed&&t.add(s.workoutId);return e.filter(s=>s.completed||!t.has(s.workoutId))}async function ce(){return(await A("workouts")).find(t=>!t.endedAt)??null}async function J(){return(await A("workouts")).filter(t=>t.endedAt).sort((t,s)=>s.startedAt-t.startedAt)}async function yt(e){return(await Le("sets","workoutId",e)).sort((s,o)=>s.order-o.order)}async function Cs(e){return await Le("sets","exerciseId",e)}async function gt(e,t=null){let s=await Cs(e),o=new Map;for(let r of s)t&&r.workoutId===t||(o.has(r.workoutId)||o.set(r.workoutId,[]),o.get(r.workoutId).push(r));if(o.size===0)return[];let i=(await Promise.all(Array.from(o.keys()).map(r=>se("workouts",r)))).filter(Boolean).sort((r,a)=>(a.startedAt??0)-(r.startedAt??0));return i.length===0?[]:o.get(i[0].id).sort((r,a)=>r.order-a.order)}function wt(e,t,s=null){let o=new Map(t.map(r=>[r.id,r.startedAt??0])),n=new Map;for(let r of e){if(r.workoutId===s||!o.has(r.workoutId)||(r.weight||0)<=0||(r.reps||0)<=0)continue;let a=n.get(r.exerciseId);a||n.set(r.exerciseId,a=new Map);let d=a.get(r.workoutId);d||a.set(r.workoutId,d=[]),d.push(r)}let i=new Map;for(let[r,a]of n){let d=[...a.keys()].sort((p,v)=>o.get(v)-o.get(p)),l=new Map;for(let p of d){let v=a.get(p).sort((M,h)=>M.order-h.order),c=v.every(M=>M.setType==null),m=0,g=0;v.forEach((M,h)=>{if(c){let $=`any#${h+1}`;l.has($)||l.set($,M);return}let y=M.setType||"working",E=y==="warmup"?g+=1:m+=1,S=`${y}#${E}`;l.has(S)||l.set(S,M)})}i.set(r,l)}return i}var Is={barbell:"Barbell",dumbbell:"Dumbbell",machine:"Machine",cable:"Cable",bodyweight:"Bodyweight",kettlebell:"Kettlebell",band:"Bands",bands:"Bands"},qs=/\s*\((barbell|dumbbell|machine|cable|bodyweight|kettlebell|bands?)\)$|\s+(Machine|Barbell|Dumbbell|Cable|Kettlebell)$/i;async function Ps(e,t){let s=await j(),o=await Le("sets","exerciseId",e);return te(s,["sets","exercises"],n=>{let i=n.objectStore("sets");for(let r of o)i.put({...r,exerciseId:t});return n.objectStore("exercises").delete(e),o.length})}async function bt(){let e=await A("exercises"),t=e.filter(i=>/butterfly/i.test(i.name||""));if(t.length===0)return 0;let s=e.filter(i=>/chest fly/i.test(i.name||"")&&!t.some(r=>r.id===i.id)),o=s.find(i=>(i.equipment||"")==="Machine")||s[0],n=0;for(let i of t)o?n+=await Ps(i.id,o.id):await q("exercises",{...i,name:"Chest Fly",equipment:"Machine"});return n}async function xt(){let e=await A("exercises"),t=[];for(let s of e){let o=(s.name||"").match(qs);if(!o)continue;let n=s.name.slice(0,o.index).trim();if(!n||/smith$/i.test(n))continue;let i=(o[1]||o[2]).toLowerCase();t.push({...s,name:n,equipment:Is[i]||s.equipment})}return t.length>0&&await Y("exercises",t),t.length}async function kt(){let[e,t,s]=await Promise.all([A("exercises"),A("sets"),A("workouts")]),o=new Set(e.filter(l=>l.category==="Cardio").map(l=>l.id));if(o.size===0)return{exercises:0,sets:0,workouts:0};let n=t.filter(l=>o.has(l.exerciseId)),i=new Map;for(let l of t)o.has(l.exerciseId)||i.set(l.workoutId,(i.get(l.workoutId)||0)+1);let r=new Set(n.map(l=>l.workoutId)),a=s.filter(l=>r.has(l.id)&&!i.get(l.id)),d=await j();return await te(d,["exercises","sets","workouts"],l=>{let p=l.objectStore("exercises"),v=l.objectStore("sets"),c=l.objectStore("workouts");for(let m of o)p.delete(m);for(let m of n)v.delete(m.id);for(let m of a)c.delete(m.id)}),{exercises:o.size,sets:n.length,workouts:a.length}}async function St(e){let[t,s,o]=await Promise.all([A("exercises"),A("sets"),A("workouts")]),n=t.filter(c=>c.category==="Other");if(n.length===0)return{recategorized:0,deleted:0,workouts:0};let i=[],r=new Set;for(let c of n){let m=e(c.name);m==="Cardio"?r.add(c.id):i.push({...c,category:m&&m!=="Other"?m:"Full Body"})}let a=s.filter(c=>r.has(c.exerciseId)),d=new Map;for(let c of s)r.has(c.exerciseId)||d.set(c.workoutId,(d.get(c.workoutId)||0)+1);let l=new Set(a.map(c=>c.workoutId)),p=o.filter(c=>l.has(c.id)&&!d.get(c.id)),v=await j();return await te(v,["exercises","sets","workouts"],c=>{let m=c.objectStore("exercises"),g=c.objectStore("sets"),M=c.objectStore("workouts");for(let h of i)m.put(h);for(let h of r)m.delete(h);for(let h of a)g.delete(h.id);for(let h of p)M.delete(h.id)}),{recategorized:i.length,deleted:r.size,workouts:p.length}}async function $t(){let e=await A("medications"),t=[];for(let s of e){if(s.doseAmount!=null)continue;let o=s.nickname||s.concept?.displayText||"";if(!/creatine/i.test(o))continue;let n=(s.concept?.form||"").replace(/\s*\(4\s*[×x]\s*\/?\s*day\)\s*/i,"").trim();t.push({...s,doseAmount:4,doseUnit:"capsule",concept:{...s.concept,form:n}})}return t.length>0&&await Y("medications",t),t.length}async function De(e){let t=await j(),s=await Le("sets","workoutId",e);return te(t,["workouts","sets"],o=>{o.objectStore("workouts").delete(e);let n=o.objectStore("sets");for(let i of s)n.delete(i.id)})}var F=()=>crypto&&crypto.randomUUID?crypto.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,e=>{let t=Math.random()*16|0;return(e==="x"?t:t&3|8).toString(16)});function fe(e){return e==null?"0":Math.abs(e-Math.round(e))<.001?String(Math.round(e)):e.toFixed(1)}function ve(e){return`${fe(e)} lbs`}function Mt(e){let t=Math.max(0,Math.floor(e)),s=Math.floor(t/3600),o=Math.floor(t%3600/60),n=t%60;return s>0?`${s}:${String(o).padStart(2,"0")}:${String(n).padStart(2,"0")}`:`${o}:${String(n).padStart(2,"0")}`}function Qe(e){let t=Math.max(0,Math.floor(e)),s=Math.floor(t/3600),o=Math.floor(t%3600/60);return s>0?`${s}h ${o}m`:`${o}m`}function Q(e){return Math.round(e).toLocaleString()}function le(e){return`${Q(e)} lbs`}function z(e){return(e instanceof Date?e:new Date(e)).toLocaleDateString(void 0,{month:"numeric",day:"numeric",year:"2-digit"})}function Et(e){return(e instanceof Date?e:new Date(e)).toLocaleDateString(void 0,{weekday:"short",month:"short",day:"numeric",year:"numeric"})}function Ke(e,t=200){let s=null;return(...o)=>{clearTimeout(s),s=setTimeout(()=>e(...o),t)}}function k(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function I(e,t=1800,s={}){let o=document.querySelector(".toast");o&&o.remove();let n=document.createElement("div");n.className="toast",n.textContent=e,s.persistUntilClick?(n.classList.add("toast-clickable"),n.addEventListener("click",()=>n.remove())):setTimeout(()=>n.remove(),t),document.body.appendChild(n)}var Ye=new EventTarget;function H(e,t){Ye.dispatchEvent(new CustomEvent(e,{detail:t}))}function Ge(e,t){return Ye.addEventListener(e,t),()=>Ye.removeEventListener(e,t)}function W({html:e,onMount:t}){let s=document.createElement("div");s.className="sheet-backdrop",s.innerHTML='<div class="sheet"></div>';let o=s.querySelector(".sheet");o.innerHTML=e;let n=Os();document.body.appendChild(s);function i(){let d=window.visualViewport;if(!d){o.style.maxHeight=`${window.innerHeight-n-10}px`;return}let l=Math.max(window.innerHeight,document.documentElement.clientHeight),p=Math.max(0,l-d.height-d.offsetTop);p>0?(o.style.paddingBottom=`${p}px`,o.style.maxHeight=`${d.height-n-10+p}px`):(o.style.paddingBottom="",o.style.maxHeight=`${d.height-n-10}px`)}i();let r=window.visualViewport;r?.addEventListener("resize",i),r?.addEventListener("scroll",i);function a(){s.remove(),r?.removeEventListener("resize",i),r?.removeEventListener("scroll",i)}return s.dismissSheet=a,s.addEventListener("click",d=>{d.target===s&&a()}),t?.(o,a),a}function Os(){let e=document.createElement("div");e.style.cssText="position:fixed;top:0;left:0;width:0;height:env(safe-area-inset-top);",document.body.appendChild(e);let t=e.offsetHeight||0;return e.remove(),t}function Ae(){return'<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" style="color: var(--red);"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>'}function Lt(){return'<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M16 5l-1.42 1.42-1.59-1.59V16h-2V4.83L9.41 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z"/></svg>'}function Z(e){return`<div class="empty-state"><div class="empty-icon">!</div><h2>Couldn't load</h2><p>${k(e.message||String(e))}</p></div>`}var he=["Pectorals","Anterior Deltoid","Lateral Deltoid","Posterior Deltoid","Triceps","Biceps","Forearms","Lats","Upper Back","Lower Back","Traps","Quadriceps","Hamstrings","Glutes","Adductors","Abductors","Calves","Abs","Obliques"];function Hs(e){let t=new Map(he.map((s,o)=>[s,o]));return[...e].sort((s,o)=>(t.get(s)??999)-(t.get(o)??999)||s.localeCompare(o))}var Te=["Barbell","Dumbbell","Machine","Cable","Bodyweight","Other"];function K(e){let t=e?.equipment,s=e?.name??"";return t&&t!=="Other"?`${s} (${t})`:s}function oe(e){let t=e?[e.equipment,R(e)].filter(Boolean).join(" \xB7 "):"";return`
    <div class="row-main">
      <div class="row-title">${k(e?.name??"Unknown exercise")}</div>
      ${t?`<div class="row-subtitle">${k(t)}</div>`:""}
    </div>
  `}function ne(e){return e?`<div class="exercise-count">${e} ${e===1?"set":"sets"}</div>`:""}function Be(e,t){return["All",...Hs(new Set(e.map(o=>R(o))))].map(o=>`<button class="chip${o==="All"&&!t||o===t?" active":""}" data-cat="${k(o)}">${k(o)}</button>`).join("")}var Ws=[["Bench Press (Barbell)","Chest","Barbell"],["Bench Press (Dumbbell)","Chest","Dumbbell"],["Incline Bench Press (Barbell)","Chest","Barbell"],["Incline Bench Press (Dumbbell)","Chest","Dumbbell"],["Decline Bench Press (Barbell)","Chest","Barbell"],["Chest Fly (Dumbbell)","Chest","Dumbbell"],["Chest Fly (Machine)","Chest","Machine"],["Cable Crossover","Chest","Cable"],["Push-Up","Chest","Bodyweight"],["Dip (Chest)","Chest","Bodyweight"],["Deadlift (Conventional)","Back","Barbell"],["Deadlift (Sumo)","Back","Barbell"],["Romanian Deadlift","Back","Barbell"],["Bent-Over Row (Barbell)","Back","Barbell"],["Pendlay Row","Back","Barbell"],["Row (Dumbbell)","Back","Dumbbell"],["T-Bar Row","Back","Barbell"],["Seated Cable Row","Back","Cable"],["Lat Pulldown","Back","Cable"],["Pull-Up","Back","Bodyweight"],["Chin-Up","Back","Bodyweight"],["Face Pull","Back","Cable"],["Shrug (Barbell)","Back","Barbell"],["Shrug (Dumbbell)","Back","Dumbbell"],["Overhead Press (Barbell)","Shoulders","Barbell"],["Overhead Press (Dumbbell)","Shoulders","Dumbbell"],["Seated Shoulder Press (Machine)","Shoulders","Machine"],["Arnold Press","Shoulders","Dumbbell"],["Lateral Raise (Dumbbell)","Shoulders","Dumbbell"],["Lateral Raise (Cable)","Shoulders","Cable"],["Front Raise (Dumbbell)","Shoulders","Dumbbell"],["Rear Delt Fly (Dumbbell)","Shoulders","Dumbbell"],["Reverse Pec Deck","Shoulders","Machine"],["Upright Row","Shoulders","Barbell"],["Barbell Curl","Biceps","Barbell"],["Dumbbell Curl","Biceps","Dumbbell"],["Hammer Curl","Biceps","Dumbbell"],["Preacher Curl","Biceps","Barbell"],["Incline Dumbbell Curl","Biceps","Dumbbell"],["Cable Curl","Biceps","Cable"],["Concentration Curl","Biceps","Dumbbell"],["Close-Grip Bench Press","Triceps","Barbell"],["Tricep Pushdown (Cable)","Triceps","Cable"],["Overhead Tricep Extension (Dumbbell)","Triceps","Dumbbell"],["Overhead Tricep Extension (Cable)","Triceps","Cable"],["Skull Crusher","Triceps","Barbell"],["Dip (Tricep)","Triceps","Bodyweight"],["Tricep Kickback","Triceps","Dumbbell"],["Back Squat","Legs","Barbell"],["Front Squat","Legs","Barbell"],["Goblet Squat","Legs","Dumbbell"],["Bulgarian Split Squat","Legs","Dumbbell"],["Lunge","Legs","Dumbbell"],["Leg Press","Legs","Machine"],["Leg Extension","Legs","Machine"],["Leg Curl (Seated)","Legs","Machine"],["Leg Curl (Lying)","Legs","Machine"],["Hip Thrust (Barbell)","Glutes","Barbell"],["Glute Bridge","Glutes","Bodyweight"],["Cable Kickback","Glutes","Cable"],["Hip Abduction (Machine)","Glutes","Machine"],["Standing Calf Raise","Calves","Machine"],["Seated Calf Raise","Calves","Machine"],["Plank","Core","Bodyweight"],["Hanging Leg Raise","Core","Bodyweight"],["Cable Crunch","Core","Cable"],["Russian Twist","Core","Bodyweight"],["Ab Wheel Rollout","Core","Other"],["Wrist Curl","Forearms","Dumbbell"],["Reverse Wrist Curl","Forearms","Dumbbell"],["Farmer's Carry","Forearms","Dumbbell"]];function R(e){if(e?.muscle)return e.muscle;let t=(e?.name||"").toLowerCase();return t?/romanian deadlift|\brdl\b|stiff.?leg|good morning|nordic|hamstring/.test(t)||/leg curl/.test(t)?"Hamstrings":/leg extension|sissy squat/.test(t)?"Quadriceps":/calf|tib raise|tibialis/.test(t)?"Calves":/hip adduction|adductor|inner thigh|copenhagen/.test(t)?"Adductors":/hip abduction|abductor|outer thigh|clamshell/.test(t)?"Abductors":/hip thrust|glute|cable kickback|donkey kick|rear kick|frog pump/.test(t)?"Glutes":/squat|leg press|lunge|step.?up/.test(t)?"Quadriceps":/back extension|hyperextension|superman/.test(t)||/deadlift|rack pull/.test(t)?"Lower Back":/lateral raise|side raise|side delt|\blat raise\b|upright row/.test(t)?"Lateral Deltoid":/rear delt|reverse fly|reverse flye|face pull|reverse pec deck/.test(t)?"Posterior Deltoid":/front raise|shoulder press|overhead press|arnold|military press|landmine press|push press|viking press/.test(t)?"Anterior Deltoid":/pulldown|pull.?down|pull.?up|chin.?up|pullover|straight.?arm/.test(t)?"Lats":/shrug/.test(t)?"Traps":/tricep|pushdown|skull ?crusher|close.?grip bench|jm press|french press|bench dip/.test(t)?"Triceps":/wrist curl|reverse curl|forearm|farmer|gripper|dead hang/.test(t)?"Forearms":/bicep|\bcurl\b/.test(t)?"Biceps":/\brow\b|rear pull|high pull/.test(t)?"Upper Back":/bench|chest|\bpec\b|pec deck|crossover|butterfly|push.?up|floor press|squeeze press|\bfly\b|\bflye\b/.test(t)?"Pectorals":/russian twist|woodchop|wood chop|side plank|side bend|oblique|pallof|rotation/.test(t)?"Obliques":/crunch|sit.?up|plank|leg raise|knee raise|ab wheel|ab roll|hanging|toes.?to.?bar|v.?up|dead bug|mountain climber/.test(t)?"Abs":/\bdip\b/.test(t)?"Triceps":e.category||"Other":e?.category||"Other"}var Fs=/\b(bike|biking|treadmill|run|running|cardio|step.?mill|elliptical|stair.?master|stair.?climber|jog|jogging|cycling|spinning|spin class|rowing machine|row machine|\berg\b|sprints?|jump.?rope|skipping rope|swim|swimming|hike|hiking)\b/,Rs={Quadriceps:"Legs",Hamstrings:"Legs",Adductors:"Legs",Abductors:"Legs",Glutes:"Glutes",Calves:"Calves",Pectorals:"Chest","Anterior Deltoid":"Shoulders","Lateral Deltoid":"Shoulders","Posterior Deltoid":"Shoulders",Lats:"Back","Upper Back":"Back",Traps:"Back","Lower Back":"Back",Biceps:"Biceps",Triceps:"Triceps",Forearms:"Forearms",Abs:"Core",Obliques:"Core"};function Dt(e){let t=(e||"").toLowerCase().trim();if(!t)return"Full Body";if(Fs.test(t))return"Cardio";let s=R({name:t,category:""});return Rs[s]||"Full Body"}async function At(){if((await A("exercises")).length>0)return 0;let t=Date.now(),s=Ws.map(([o,n,i])=>({id:F(),name:o,category:n,equipment:i,notes:"",isCustom:!1,createdAt:t}));return await Y("exercises",s),s.length}var Tt="workout";function Bt(e){Tt!==e&&(Tt=e,H("tab:changed",e))}var N=["Chest Day","Leg Day","Back/Bi Day"],Ce={"Chest Day":{key:"chest",short:"Chest",cssVar:"--day-chest"},"Leg Day":{key:"leg",short:"Legs",cssVar:"--day-leg"},"Back/Bi Day":{key:"back",short:"Back/Bi",cssVar:"--day-back"}};function Ie(e){let t=Ce[e];return t?`var(${t.cssVar})`:"var(--text-tertiary)"}function Xe(e){if(!e)return null;let t=e.toLowerCase();return t.includes("chest")?"Chest Day":t.includes("leg")&&!t.includes("curl")&&!t.includes("extension")?"Leg Day":t.includes("back")||t.includes("pull")?"Back/Bi Day":t.includes("push")?"Chest Day":null}function Je(e){for(let t of e){let s=Xe(t.name);if(s)return{name:t.name,normalized:s,startedAt:t.startedAt}}return null}function qe(e){let t=N.indexOf(e);return t===-1?N[0]:N[(t+1)%N.length]}var Ns={Pectorals:"#ec4899",Triceps:"#be185d","Anterior Deltoid":"#831843","Lateral Deltoid":"#f9a8d4",Quadriceps:"#facc15",Hamstrings:"#b45309",Glutes:"#f59e0b",Calves:"#fde68a",Adductors:"#bdb76b",Abductors:"#78350f",Lats:"#2563eb","Upper Back":"#38bdf8",Biceps:"#1e40af","Posterior Deltoid":"#bfdbfe",Traps:"#0891b2","Lower Back":"#475569",Forearms:"#22c55e",Abs:"#ef4444",Obliques:"#14b8a6",Other:"#6b7280"};function Ct(e){return Ns[e]??"#6b7280"}var js={Pectorals:"Chest Day",Triceps:"Chest Day","Anterior Deltoid":"Chest Day","Lateral Deltoid":"Chest Day",Quadriceps:"Leg Day",Hamstrings:"Leg Day",Glutes:"Leg Day",Calves:"Leg Day",Adductors:"Leg Day",Abductors:"Leg Day",Lats:"Back/Bi Day","Upper Back":"Back/Bi Day",Biceps:"Back/Bi Day","Posterior Deltoid":"Back/Bi Day",Traps:"Back/Bi Day","Lower Back":"Back/Bi Day",Forearms:"Back/Bi Day"};function zs(e){return js[e]??null}function Us(e,t,s){let o=Xe(e);if(o)return o;let n=new Map;for(let a of t){let d=s.get(a.exerciseId);if(!d)continue;let l=zs(R(d));if(!l)continue;let p=(a.weight||0)*(a.reps||0);p<=0||n.set(l,(n.get(l)??0)+p)}let i=null,r=0;for(let[a,d]of n)d>r&&(i=a,r=d);return i}function It(e,t,s){let o=[...e].sort((r,a)=>r.startedAt-a.startedAt),n=new Map,i=null;for(let r of o){let a=Us(r.name,t.get(r.id)??[],s);a||(i?Pt(i.startedAt,r.startedAt)?a=i.day:a=qe(i.day):a=N[0]),n.set(r.id,a),i={day:a,startedAt:r.startedAt}}return n}function qt(e){let t=parseInt(e.slice(1),16);return((t>>16&255)*299+(t>>8&255)*587+(t&255)*114)/1e3>=150?"#1c1c1e":"#ffffff"}function Pt(e,t){let s=new Date(e),o=new Date(t);return s.getFullYear()===o.getFullYear()&&s.getMonth()===o.getMonth()&&s.getDate()===o.getDate()}function Vs(e,t){let s=Xe(t?.name);if(s)return s;let o=Je(e);return o?Pt(o.startedAt,Date.now())?o.normalized:qe(o.normalized):N[0]}var _s="lift-today-day";async function ie(){try{let[e,t]=await Promise.all([J(),ce()]),s=Vs(e,t),o=Ce[s].key;document.documentElement.dataset.day!==o&&(document.documentElement.dataset.day=o);try{localStorage.setItem(_s,o)}catch{}return s}catch{return null}}var Ot="lift-migrations-done-v2";async function Ze(){let e=await kt();e.exercises>0&&console.info(`Removed ${e.exercises} cardio exercise(s), ${e.sets} set(s), ${e.workouts} cardio-only workout(s).`);let t=await St(Dt);if(t.recategorized>0||t.deleted>0){console.info(`Reorganized "Other": recategorized ${t.recategorized}, removed ${t.deleted} cardio, dropped ${t.workouts} empty workout(s).`);let i=[];t.recategorized>0&&i.push(`sorted ${t.recategorized} exercise${t.recategorized===1?"":"s"}`),t.deleted>0&&i.push(`removed ${t.deleted} cardio`),I(`Cleaned up \u201COther\u201D: ${i.join(", ")}.`)}let s=await xt();s>0&&console.info(`Stripped equipment from ${s} exercise name(s).`);let o=await bt();o>0&&I(`Merged Butterfly into Chest Fly (${o} sets moved).`);let n=await $t();n>0&&console.info(`Set a per-dose amount on ${n} medication(s).`)}async function Ht(){try{if(localStorage.getItem(Ot))return}catch{}await Ze();try{localStorage.setItem(Ot,String(Date.now()))}catch{}}function Ys(e){let t=String(e||"").match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(?:\.\d+)?\s*([+-])(\d{2}):?(\d{2})$/);if(t){let o=Date.parse(`${t[1]}T${t[2]}${t[3]}${t[4]}:${t[5]}`);if(isFinite(o))return o}let s=Date.parse(e);return isFinite(s)?s:NaN}var Qs={taken:"taken",skipped:"skipped",snoozed:"snoozed",notinteracted:"notInteracted"},Ks=e=>Qs[String(e||"").toLowerCase().replace(/[^a-z]/g,"")]||"taken",Wt=e=>String(e||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();function Gs(e){let t=String(e||"").trim(),s=t.match(/\s\d+(\.\d+)?\s*(mg|mcg|g|ml|iu|%)\b/i);return s?[t.slice(0,s.index).trim()||t,t.slice(s.index).trim()]:[t||"Medication",""]}function Xs(e,t){let s=Wt(e);if(!s)return null;let o=null,n=0;for(let i of t)for(let r of[i.nickname,i.concept?.displayText]){let a=Wt(r);if(!a||a.length<=n)continue;(s===a||s.startsWith(`${a} `)||a.startsWith(`${s} `)||s.includes(` ${a} `))&&(o=i,n=a.length)}return o}var Ft=e=>!!e&&typeof e=="object"&&!Array.isArray(e)&&(e.displayText||e.name)&&(e.start||e.scheduledDate||e.date||e.end);function Rt(e,t=0){if(t===0){for(let s of[e?.data?.medications,e?.medications,e?.data?.medication])if(Array.isArray(s)&&s.some(Ft))return s}if(t>4||!e||typeof e!="object")return null;if(Array.isArray(e))return e.some(Ft)?e:null;for(let s of Object.values(e)){let o=Rt(s,t+1);if(o)return o}return null}function Js(e){if(!e||typeof e!="object")return"not a JSON object";if(Array.isArray(e))return`a list of ${e.length} item(s)`;let t=e.data&&typeof e.data=="object"&&!Array.isArray(e.data)?e.data:null,s=n=>Object.entries(n).map(([i,r])=>Array.isArray(r)?`${i}[${r.length}]`:i).join(", "),o=s(e);return t?`data \u2192 ${s(t)||"empty"}`:o||"empty"}function Zs(e){let t=Rt(e);if(!Array.isArray(t)||t.length===0)throw new Error(`No medication doses found \u2014 this file has ${Js(e)}. In Health Auto Export, pick Medications (not Health Metrics), set the date range, and export as JSON.`);let s=[],o=0;for(let n of t){let i=Ys(n.start||n.scheduledDate||n.date||n.end),r=n.displayText||n.name;if(!isFinite(i)||!r){o+=1;continue}s.push({displayText:String(r),date:i,status:Ks(n.status),doseQuantity:Number(n.dosage)||0,scheduledQuantity:Number(n.scheduledDosage)||0,hasSchedule:!!n.scheduledDate,units:String(n.units||""),rxnorm:(n.codings||[]).map(a=>a?.code).filter(Boolean)})}if(s.length===0)throw new Error(`Found ${t.length} record(s) but none had a readable name and date. The export format may have changed.`);return s.sort((n,i)=>n.date-i.date),{doses:s,skipped:o}}async function Nt(e){let{doses:t,skipped:s}=Zs(JSON.parse(await e.text())),[o,n]=await Promise.all([A("medications"),A("doseEvents")]),i=[...o],r=[],a=new Map;for(let c of t){if(a.has(c.displayText))continue;let m=Xs(c.displayText,i);if(m){a.set(c.displayText,m.id);continue}let[g,M]=Gs(c.displayText),h={id:F(),nickname:g,isArchived:!1,hasSchedule:c.hasSchedule,doseAmount:c.scheduledQuantity||c.doseQuantity||1,doseUnit:c.units&&c.units!=="count"?c.units:"",concept:{identifier:"",displayText:c.displayText,form:M,rxnorm:c.rxnorm}};i.push(h),r.push(h),a.set(c.displayText,h.id)}let d=new Set(n.map(c=>c.id)),l=new Set(n.map(c=>`${c.medicationId}|${Math.floor(c.date/6e4)}`)),p=[],v=0;for(let c of t){let m=a.get(c.displayText),g=`hae-${m}-${c.date}`,M=`${m}|${Math.floor(c.date/6e4)}`;if(d.has(g)||l.has(M)){v+=1;continue}d.add(g),l.add(M),p.push({id:g,medicationId:m,status:c.status,date:c.date,scheduledQuantity:c.scheduledQuantity,doseQuantity:c.doseQuantity})}return r.length&&await Y("medications",r),p.length&&await Y("doseEvents",p),{doses:p.length,medications:r.length,duplicates:v,skipped:s,total:t.length,range:p.length?[p[0].date,p[p.length-1].date]:null}}var Pe="lift-backup-passphrase";var jt="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";function et(e){let t=new Uint8Array(e),s="",o=32768;for(let n=0;n<t.length;n+=o)s+=String.fromCharCode.apply(null,t.subarray(n,n+o));return btoa(s)}var tt=e=>Uint8Array.from(atob(e),t=>t.charCodeAt(0));function eo(){let t=[...crypto.getRandomValues(new Uint8Array(20))].map(s=>jt[s%jt.length]);return[0,5,10,15].map(s=>t.slice(s,s+5).join("")).join("-")}function st(){let e=null;try{e=localStorage.getItem(Pe)}catch{}if(!e){e=eo();try{localStorage.setItem(Pe,e)}catch{}}return e}function zt(){try{return localStorage.getItem(Pe)}catch{return null}}function Ut(e){try{localStorage.setItem(Pe,e)}catch{}}async function Vt(e,t){let s=await crypto.subtle.importKey("raw",new TextEncoder().encode(e),"PBKDF2",!1,["deriveKey"]);return crypto.subtle.deriveKey({name:"PBKDF2",hash:"SHA-256",salt:t,iterations:25e4},s,{name:"AES-GCM",length:256},!1,["encrypt","decrypt"])}function _t(e){return!!e&&e.lift==="encrypted-backup"&&typeof e.data=="string"}async function Yt(e,t){let s=crypto.getRandomValues(new Uint8Array(16)),o=crypto.getRandomValues(new Uint8Array(12)),n=await Vt(t,s),i=new TextEncoder().encode(JSON.stringify(e)),r=await crypto.subtle.encrypt({name:"AES-GCM",iv:o},n,i);return{lift:"encrypted-backup",v:1,exportedAt:new Date().toISOString(),kdf:{name:"PBKDF2",hash:"SHA-256",iterations:25e4,salt:et(s)},cipher:"AES-GCM",iv:et(o),data:et(r)}}async function ot(e,t){let s=tt(e.kdf.salt),o=tt(e.iv),n=await Vt(t,s),i;try{i=await crypto.subtle.decrypt({name:"AES-GCM",iv:o},n,tt(e.data))}catch{throw new Error("Wrong backup password (or the file is damaged).")}return JSON.parse(new TextDecoder().decode(i))}async function to(){let[e,t,s,o,n,i]=await Promise.all([A("exercises"),A("workouts"),A("sets"),A("stateOfMind"),A("medications"),A("doseEvents")]);return{version:2,exportedAt:new Date().toISOString(),exercises:e,workouts:t,sets:s,stateOfMind:o,medications:n,doseEvents:i}}function so(){let e=new Date,t=s=>String(s).padStart(2,"0");return`lift-backup-${e.getFullYear()}${t(e.getMonth()+1)}${t(e.getDate())}-${t(e.getHours())}${t(e.getMinutes())}${t(e.getSeconds())}.json`}async function nt(){let e=await to(),t=st(),s=await Yt(e,t),o=JSON.stringify(s),n=new Blob([o],{type:"application/json"}),i=URL.createObjectURL(n),r=so(),a=document.createElement("a");return a.href=i,a.download=r,a.style.display="none",document.body.appendChild(a),a.click(),setTimeout(()=>{document.body.removeChild(a),URL.revokeObjectURL(i)},1e3),{filename:r,bytes:n.size,snapshot:e}}async function oo(e){let t=zt();if(t)try{return await ot(e,t)}catch{}for(let s=0;s<3;s++){let o=prompt("Enter your backup password (saved in your Passwords app):");if(o==null)throw new Error("Restore cancelled.");try{let n=await ot(e,o.trim());return Ut(o.trim()),n}catch(n){if(s===2)throw n;alert("Wrong password \u2014 try again.")}}}async function no(e){let t=JSON.parse(await e.text()),s=_t(t)?await oo(t):t;if(!s||!Array.isArray(s.exercises)||!Array.isArray(s.workouts)||!Array.isArray(s.sets))throw new Error("File doesn't look like a Lift backup.");return await ht({exercises:s.exercises,workouts:s.workouts,sets:s.sets,stateOfMind:s.stateOfMind??[],medications:s.medications??[],doseEvents:s.doseEvents??[]}),await Ze(),{exercises:s.exercises.length,workouts:s.workouts.length,sets:s.sets.length,stateOfMind:(s.stateOfMind??[]).length}}function Qt(){let e=st();W({html:`
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
            <div class="stat-value" id="bk-pass" style="font-variant-numeric: tabular-nums; letter-spacing: 0.5px; color: var(--text); -webkit-user-select: all; user-select: all;">${k(e)}</div>
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

        <div class="section">Import medication history</div>
        <div class="form-section">
          <button class="list-row button" id="bk-health">
            <div class="row-main"><div class="row-title" style="color: var(--accent);">Import Health Auto Export\u2026</div></div>
          </button>
        </div>
        <div class="section-footer">
          <b>Adds</b> dose history from a Health Auto Export JSON file \u2014 nothing is replaced. Doses attach to your existing medications, and importing the same file twice won't duplicate anything.
        </div>

        <input type="file" id="bk-file" accept=".json,application/json" style="display: none;" />
        <input type="file" id="bk-health-file" accept=".json,application/json" style="display: none;" />
      </div>
    `,onMount(t,s){t.querySelector("#bk-close").addEventListener("click",()=>s()),t.querySelector("#bk-copy").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(e),I("Password copied \u2014 save it in your Passwords app")}catch{I("Copy failed \u2014 long-press the password to select it")}}),t.querySelector("#bk-export").addEventListener("click",async()=>{try{let{filename:i,bytes:r}=await nt();I(`Exported ${i} (${io(r)})`)}catch(i){I(`Export failed: ${i.message}`)}});let o=t.querySelector("#bk-file");t.querySelector("#bk-import").addEventListener("click",()=>{o.value="",o.click()}),o.addEventListener("change",async i=>{let r=i.target.files?.[0];if(r&&confirm("Replace all current data with this backup? This cannot be undone."))try{let a=await no(r);s(),I(`Restored ${a.workouts} workouts, ${a.exercises} exercises`),H("data:changed")}catch(a){I(`Restore failed: ${a.message}`)}});let n=t.querySelector("#bk-health-file");t.querySelector("#bk-health").addEventListener("click",()=>{n.value="",n.click()}),n.addEventListener("change",async i=>{let r=i.target.files?.[0];if(r)try{let a=await Nt(r);s();let d=[`Imported ${a.doses} dose${a.doses===1?"":"s"}`];a.medications&&d.push(`added ${a.medications} medication${a.medications===1?"":"s"}`),a.duplicates&&d.push(`skipped ${a.duplicates} already logged`),I(d.join(", ")),H("data:changed")}catch(a){I(`Import failed: ${a.message}`)}})}})}function io(e){return e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/(1024*1024)).toFixed(1)} MB`}var Oe=[{key:"1W",tick:"1W",days:7},{key:"1M",tick:"1M",days:30},{key:"3M",tick:"3M",days:90},{key:"1Y",tick:"1Y",days:365},{key:"All",tick:"All",all:!0}];function ro(e){let t=new Map;for(let s of e){let o=new Date(s.date),n=`${o.getFullYear()}-${o.getMonth()}-${o.getDate()}`,i=t.get(n)||{date:s.date,total:0,count:0};i.total+=s.value,i.count+=1,i.date=Math.min(i.date,s.date),t.set(n,i)}return[...t.values()].map(s=>({date:s.date,value:s.total/s.count})).sort((s,o)=>s.date-o.date)}function ye(e,t,s={}){let o=t.length>0&&t[0].points!==void 0,n=(o?t:[{points:t}]).map(f=>({label:f.label??"",color:f.color||"var(--accent)",points:ro(f.points)})).filter(f=>f.points.length>0),i=s.defaultPeriod||"All",r=Math.max(0,Oe.findIndex(f=>f.key===i)),a=Oe.length-1,d=null;function l(){let f=Oe[r],u=n.map((x,D)=>d===null||D===d?x.points:[]);if(f.all)return u;let w=Date.now()-f.days*864e5,b=u.map(x=>x.filter(D=>D.date>=w));return b.every(x=>x.length===0)?u.map(x=>x.slice(-1)):b}let p=o&&n.some(f=>f.label)?`<div class="chart-legend">${n.map((f,u)=>`<button class="legend-item" data-i="${u}" style="--dcolor: ${f.color};" aria-pressed="false">${f.label}</button>`).join("")}</div>`:"";e.innerHTML=`
    <div class="chart-scrub-readout" data-role="scrub"></div>
    ${p}
    <div class="chart-container" data-role="chart"></div>
    <div class="chart-daterange" data-role="range"></div>
    <div class="chart-slider">
      <input type="range" class="chart-range" min="0" max="${a}" step="1"
             value="${r}" aria-label="Time range" />
      <div class="chart-slider-ticks">
        ${Oe.map((f,u)=>`<span data-i="${u}">${f.tick}</span>`).join("")}
      </div>
    </div>
  `;let v=e.querySelector('[data-role="scrub"]'),c=e.querySelector('[data-role="chart"]'),m=e.querySelector('[data-role="range"]'),g=e.querySelector(".chart-range"),M=[...e.querySelectorAll(".chart-slider-ticks span")],h=s.unit||"lbs",y=null;function E(){let f=l(),u=ao(f,n,h);c.innerHTML=u.html,y=u.geom;let w=f.flat();if(w.length>=2){let b=Math.min(...w.map(D=>D.date)),x=Math.max(...w.map(D=>D.date));m.innerHTML=`<span>${it(b)}</span><span>${it(x)}</span>`}else m.innerHTML="";M.forEach((b,x)=>b.classList.toggle("active",x===r))}g.addEventListener("input",()=>{r=Number(g.value),T(),E()});let S=[...e.querySelectorAll(".chart-legend .legend-item")];for(let f of S)f.addEventListener("click",()=>{let u=Number(f.dataset.i);d=d===u?null:u,S.forEach((w,b)=>{w.classList.toggle("dimmed",d!==null&&b!==d),w.setAttribute("aria-pressed",String(d===b))}),T(),E()});function $(f){if(!y||y.pts.length<2)return;let u=c.querySelector("svg"),w=u?.getScreenCTM();if(!w)return;let b=new DOMPoint(f,0).matrixTransform(w.inverse()).x,x=0,D=1/0;y.pts.forEach((O,V)=>{let _=Math.abs(O.x-b);_<D&&(D=_,x=V)});let L=y.pts[x],C=u.querySelector(".chart-scrub-line"),P=u.querySelector(".chart-scrub-dot");C&&(C.setAttribute("x1",L.x),C.setAttribute("x2",L.x),C.removeAttribute("visibility")),P&&(P.setAttribute("cx",L.x),P.setAttribute("cy",L.y),P.style.fill=L.color,P.removeAttribute("visibility"));let U=L.label?` \xB7 ${L.label}`:"";v.textContent=`${it(L.date)}${U} \xB7 ${Math.round(L.value).toLocaleString()} ${h}`}function T(){v.textContent="";let f=c.querySelector("svg");f?.querySelector(".chart-scrub-line")?.setAttribute("visibility","hidden"),f?.querySelector(".chart-scrub-dot")?.setAttribute("visibility","hidden")}let B=!1;c.addEventListener("pointerdown",f=>{B=!0,c.setPointerCapture?.(f.pointerId),$(f.clientX)}),c.addEventListener("pointermove",f=>{B&&$(f.clientX)});for(let f of["pointerup","pointercancel"])c.addEventListener(f,()=>{B=!1,T()});E()}function it(e){return new Date(e).toLocaleDateString(void 0,{month:"short",day:"numeric",year:"numeric"})}function ao(e,t,s){let i={top:16,right:14,bottom:14,left:52},r=400-i.left-i.right,a=200-i.top-i.bottom,d=e.flat();if(d.length===0)return{html:`<svg viewBox="0 0 400 200"><text x="${400/2}" y="${200/2}" text-anchor="middle" class="chart-axis-label">No data in range</text></svg>`,geom:null};if(d.length===1){let x=d[0],D=t[e.findIndex(P=>P.length>0)]?.color||"var(--accent)",L=i.left+r/2,C=i.top+a/2;return{html:`<svg viewBox="0 0 400 200"><circle cx="${L}" cy="${C}" r="4" class="chart-point" style="fill: ${D};"/><text x="${L}" y="${C-10}" text-anchor="middle" class="chart-axis-label">${Math.round(x.value).toLocaleString()} ${s}</text></svg>`,geom:null}}let l=d.map(x=>x.date),p=d.map(x=>x.value),v=Math.min(...l),c=Math.max(...l),m=Math.max(...p),g=Math.min(...p),M=Math.max(m-g,1),h=Math.max(0,g-M*.12),y=m+M*.12,E=x=>i.left+(x-v)/Math.max(c-v,1)*r,S=x=>i.top+a-(x-h)/(y-h)*a,$=4,T=x=>Math.round(x).toLocaleString(),B=Array.from({length:$+1},(x,D)=>{let L=h+(y-h)*D/$,C=S(L);return`<text x="${i.left-6}" y="${C+3}" text-anchor="end" class="chart-axis-label">${T(L)}</text>`}).join(""),f=Array.from({length:$+1},(x,D)=>{let L=i.top+a*D/$;return`<line x1="${i.left}" x2="${400-i.right}" y1="${L}" y2="${L}" class="chart-axis-line"/>`}).join(""),u=[],w=e.map((x,D)=>{let L=t[D],C=x.map(P=>({x:E(P.date),y:S(P.value)}));return x.forEach((P,U)=>u.push({...C[U],date:P.date,value:P.value,label:L.label,color:L.color})),C.length===0?"":C.length===1?`<circle cx="${C[0].x}" cy="${C[0].y}" r="3.5" class="chart-point" style="fill: ${L.color};"/>`:`<path d="${co(C)}" class="chart-line" style="stroke: ${L.color};"/>`}).join("");return{html:`
    <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet">
      ${f}
      ${B}
      ${w}
      <line class="chart-scrub-line" y1="${i.top}" y2="${i.top+a}" x1="0" x2="0" visibility="hidden"/>
      <circle class="chart-scrub-dot" r="4.5" visibility="hidden"/>
    </svg>
  `,geom:{pts:u}}}function co(e){if(e.length<2)return"";let t=`M ${e[0].x.toFixed(1)} ${e[0].y.toFixed(1)}`;for(let s=0;s<e.length-1;s++){let o=e[s===0?0:s-1],n=e[s],i=e[s+1],r=e[s+2]||i,a=n.x+(i.x-o.x)/6,d=n.y+(i.y-o.y)/6,l=i.x-(r.x-n.x)/6,p=i.y-(r.y-n.y)/6;t+=` C ${a.toFixed(1)} ${d.toFixed(1)}, ${l.toFixed(1)} ${p.toFixed(1)}, ${i.x.toFixed(1)} ${i.y.toFixed(1)}`}return t}var ee=null;function Kt(e){let t=!0;return Gt().then(s=>{t&&(ee=s,He(e))}).catch(s=>{t&&(e.container.innerHTML=Z(s))}),()=>{t=!1}}async function Gt(){let[e,t,s]=await Promise.all([J(),A("sets"),A("exercises")]),o=new Map(s.map(g=>[g.id,g])),n=new Map;for(let g of X(t))n.has(g.workoutId)||n.set(g.workoutId,[]),n.get(g.workoutId).push(g);let i=0,r=0,a=new Map,d=new Map,l=new Map,p=It(e,n,o);for(let g of e){let M=n.get(g.id)||[],h=M.reduce((y,E)=>y+E.weight*E.reps,0);if(i+=h,r+=M.length,h>0){let y=p.get(g.id);a.has(y)||a.set(y,[]),a.get(y).push({date:g.startedAt,value:h})}for(let y of M){let E=o.get(y.exerciseId);if(!E)continue;let S=d.get(y.exerciseId)||{id:y.exerciseId,exercise:E,count:0};if(S.count+=1,d.set(y.exerciseId,S),y.weight>0&&y.reps>0){let $=l.get(y.exerciseId);(!$||y.weight>$.weight||y.weight===$.weight&&y.reps>$.reps)&&l.set(y.exerciseId,{id:y.exerciseId,weight:y.weight,reps:y.reps,date:g.startedAt,name:K(E)})}}}let v=Array.from(d.entries()).sort((g,M)=>M[1].count-g[1].count).map(([,g])=>g),c=Array.from(l.values()).sort((g,M)=>M.weight-g.weight),m=N.filter(g=>a.has(g)).map(g=>({label:Ce[g].short,color:Ie(g),points:a.get(g)}));return{workouts:e,allSets:t,allExercises:s,exMap:o,setsByWorkout:n,totalVolume:i,totalSets:r,volumeSeries:m,topExercises:v,prs:c}}function He(e){if(e.setTitle("Progress"),e.setBack(null),e.setAction({label:"Backup and restore",html:Lt(),onClick:()=>Qt()}),e.container.scrollTop=0,!ee||ee.workouts.length===0){e.container.innerHTML=`
      <div class="empty-state">
        <div class="empty-icon">\u{1F4C8}</div>
        <h2>No data yet</h2>
        <p>Finish a workout and your stats and trends will show up here.</p>
      </div>
    `;return}let{workouts:t,totalVolume:s,totalSets:o,volumeSeries:n,topExercises:i,prs:r}=ee;e.container.innerHTML=`
    <div class="section">Totals</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Total Volume</div><div class="stat-value">${le(s)}</div></div>
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
  `;let a=e.container.querySelector(".volume-chart-mount");a&&n.length>0&&ye(a,n,{unit:"lbs"});for(let d of e.container.querySelectorAll("[data-page]"))d.addEventListener("click",()=>{let l=d.dataset.page;l==="trained"?lo(e):l==="prs"?uo(e):l==="history"&&Xt(e)})}function lo(e){e.setTitle("Most-Trained"),e.setBack(()=>He(e)),e.setAction(null);let{topExercises:t}=ee;e.container.innerHTML=`
    <div class="list" style="margin-top: 16px;">
      ${t.map(s=>`
        <button class="list-row" data-exercise-id="${k(s.id)}">
          ${oe(s.exercise)}
          <div class="row-trailing trailing-stack">${ne(s.count)}</div>
          <div class="chevron">\u203A</div>
        </button>
      `).join("")}
    </div>
  `,e.container.scrollTop=0,rt(e)}function uo(e){e.setTitle("Personal Records"),e.setBack(()=>He(e)),e.setAction(null);let{prs:t}=ee;e.container.innerHTML=`
    <div class="section-footer" style="margin-top: 16px;">Heaviest set ever recorded per exercise.</div>
    <div class="list">
      ${t.map(s=>`
        <button class="list-row" data-exercise-id="${k(s.id)}" style="align-items: flex-start;">
          <div class="row-main">
            <div class="row-title">${k(s.name)}</div>
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
  `,e.container.scrollTop=0,rt(e)}function rt(e){for(let t of e.container.querySelectorAll("[data-exercise-id]"))t.addEventListener("click",()=>{We(t.dataset.exerciseId)})}function Xt(e){e.setTitle("Workout History"),e.setBack(()=>He(e)),e.setAction(null);let{workouts:t,setsByWorkout:s,exMap:o}=ee;e.container.innerHTML=`
    <div class="list" style="margin-top: 16px;">
      ${t.map(n=>po(n,s.get(n.id)||[],o)).join("")}
    </div>
  `,e.container.scrollTop=0;for(let n of e.container.querySelectorAll("[data-workout-id]"))n.addEventListener("click",()=>{let i=n.dataset.workoutId;mo(e,i).catch(r=>{e.container.innerHTML=Z(r)})})}function po(e,t,s){let o=t,n=o.reduce((d,l)=>d+l.weight*l.reps,0),i=(e.endedAt-e.startedAt)/1e3,r=[],a=new Set;for(let d of t){if(a.has(d.exerciseId))continue;a.add(d.exerciseId);let l=s.get(d.exerciseId);if(l&&r.push(l.name),r.length>=3)break}return`
    <button class="list-row" data-workout-id="${e.id}">
      <div class="row-main">
        <div class="row-title" style="font-weight: 600;">${k(e.name)}</div>
        <div class="row-subtitle" style="margin-top: 4px;">
          ${z(e.startedAt)} \xB7 ${Qe(i)} \xB7 ${o.length} sets \xB7 ${le(n)}
        </div>
        ${r.length>0?`<div class="row-subtitle" style="margin-top: 4px;">${k(r.join(" \xB7 "))}${a.size>3?" \u2026":""}</div>`:""}
      </div>
      <div class="chevron">\u203A</div>
    </button>
  `}async function Jt(e){let[t,s,o]=await Promise.all([se("workouts",e),A("exercises"),yt(e)]);if(!t)return null;let n=new Map(s.map(c=>[c.id,c])),i=new Map,r=[];for(let c of o)i.has(c.exerciseId)||(i.set(c.exerciseId,[]),r.push(c.exerciseId)),i.get(c.exerciseId).push(c);let a=X(o),d=a.reduce((c,m)=>c+m.weight*m.reps,0),l=a.length,p=(t.endedAt-t.startedAt)/1e3,v=`
    <div class="section">Summary</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Date</div><div class="stat-value">${Et(t.startedAt)}</div></div>
      <div class="stat-row"><div class="stat-label">Duration</div><div class="stat-value">${Qe(p)}</div></div>
      <div class="stat-row"><div class="stat-label">Total Volume</div><div class="stat-value">${le(d)}</div></div>
      <div class="stat-row"><div class="stat-label">Completed Sets</div><div class="stat-value">${l}</div></div>
    </div>

    ${r.map(c=>{let m=n.get(c),g=i.get(c),M=0,h=0;return`
        ${m?`<button class="section section-link" data-exercise-id="${k(c)}">${k(K(m))}<span class="name-chevron">\u203A</span></button>`:'<div class="section">Unknown exercise</div>'}
        <div class="form-section">
          ${g.map(E=>{let $=(E.setType||"working")==="warmup"?`W${++h}`:String(++M);return`
              <div class="stat-row">
                <div class="stat-label">Set ${$}</div>
                <div class="stat-value hist-edit">
                  <input class="hist-input" type="number" inputmode="decimal" step="0.5" aria-label="Weight in pounds for set ${$}"
                         data-set-id="${E.id}" data-field="weight" value="${E.weight>0?E.weight:""}" placeholder="0" />
                  <span>lbs \xD7</span>
                  <input class="hist-input" type="number" inputmode="numeric" step="1" aria-label="Repetitions for set ${$}"
                         data-set-id="${E.id}" data-field="reps" value="${E.reps>0?E.reps:""}" placeholder="0" />
                </div>
              </div>
            `}).join("")}
        </div>
      `}).join("")}
  `;return{workout:t,html:v,sets:o}}function Zt(e,t){for(let s of e.querySelectorAll("input.hist-input[data-set-id]"))s.addEventListener("input",async()=>{let o=t.find(n=>n.id===s.dataset.setId);o&&(s.dataset.field==="weight"?o.weight=parseFloat(s.value)||0:o.reps=parseInt(s.value,10)||0,await q("sets",{...o}))})}async function mo(e,t){e.setBack(async()=>{ee=await Gt(),Xt(e)}),e.setAction({label:"Delete workout",html:Ae(),onClick:async()=>{confirm("Delete this workout?")&&(await De(t),H("data:changed"))}});let s=await Jt(t);if(!s){e.container.innerHTML=Z({message:"Workout not found."});return}e.setTitle(s.workout.name),e.container.innerHTML=s.html,e.container.scrollTop=0,rt(e),Zt(e.container,s.sets)}async function es(e){let t=await Jt(e);if(!t)return;let s=W({html:`
      <div class="sheet-header">
        <button class="btn-text" id="wd-close">Done</button>
        <div class="title">${k(t.workout.name)}</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">${t.html}</div>
    `,onMount(o){o.querySelector("#wd-close").addEventListener("click",()=>s());for(let n of o.querySelectorAll("[data-exercise-id]"))n.addEventListener("click",()=>We(n.dataset.exerciseId));Zt(o,t.sets)}})}function ts(e){let t=!0;return ss(e).catch(s=>{t&&(e.container.innerHTML=Z(s))}),()=>{t=!1}}async function ss(e){e.setTitle("Exercises"),e.setBack(null),e.setAction({label:"Add exercise",html:'<span style="font-size: 24px;">+</span>',onClick:()=>{ge(null)}});let[t,s]=await Promise.all([A("exercises"),A("sets")]),o=t.sort((c,m)=>c.name.localeCompare(m.name)),n=new Map;for(let c of s)n.set(c.exerciseId,(n.get(c.exerciseId)??0)+1);let i="",r=null;e.container.innerHTML=`
    <div class="search-bar">
      <input class="search-input" id="ex-search" placeholder="Search exercises" />
    </div>
    <div class="chip-row" id="ex-chips"></div>
    <div class="list" id="ex-list"></div>
  `,e.container.scrollTop=0;let a=e.container.querySelector("#ex-list"),d=e.container.querySelector("#ex-chips"),l=e.container.querySelector("#ex-search");function p(){d.innerHTML=Be(o,r);for(let c of d.querySelectorAll(".chip"))c.addEventListener("click",()=>{let m=c.dataset.cat;r=m==="All"?null:m,p(),v()})}function v(){let c=o.filter(m=>!r||R(m)===r).filter(m=>!i||m.name.toLowerCase().includes(i.toLowerCase()));if(c.length===0){a.innerHTML='<div class="list-row"><div class="row-main" style="color: var(--text-secondary);">No matches</div></div>';return}a.innerHTML=c.map(m=>`
        <button class="list-row" data-id="${m.id}">
          ${oe(m)}
          <div class="row-trailing trailing-stack">${ne(n.get(m.id)??0)}</div>
          <div class="chevron">\u203A</div>
        </button>
      `).join("");for(let m of a.querySelectorAll("[data-id]"))m.addEventListener("click",()=>{fo(e,m.dataset.id).catch(g=>{e.container.innerHTML=Z(g)})})}l.addEventListener("input",()=>{i=l.value,v()}),p(),v()}function fo(e,t){return Fe(e,t,()=>ss(e))}async function Fe(e,t,s){e.setBack(s);let o=await ns(t);if(!o){e.container.innerHTML=Z({message:"Exercise not found."});return}e.setTitle(K(o.exercise)),e.setAction(o.exercise.isCustom?{label:"Delete exercise",html:Ae(),onClick:async()=>{if(o.completed.length>0){alert(`Can't delete \u2014 this exercise has ${o.completed.length} logged set${o.completed.length===1?"":"s"}.`);return}confirm("Delete this custom exercise?")&&(await ae("exercises",t),H("data:changed"))}}:null),e.container.innerHTML=o.html,e.container.scrollTop=0,e.container.querySelector("#exd-edit")?.addEventListener("click",()=>{ge(o.exercise,()=>Fe(e,t,s))}),os(e.container);let n=e.container.querySelector(".exercise-chart-mount");n&&o.chartData.length>0&&ye(n,o.chartData,{unit:"lbs"})}function os(e){for(let t of e.querySelectorAll(".recent-set[data-workout-id]"))t.addEventListener("click",()=>es(t.dataset.workoutId))}async function We(e){let t=await ns(e);if(!t)return;let s=W({html:`
      <div class="sheet-header">
        <button class="btn-text" id="exd-close">Done</button>
        <div class="title">${k(K(t.exercise))}</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">${t.html}</div>
    `,onMount(o){o.querySelector("#exd-close").addEventListener("click",()=>s()),o.querySelector("#exd-edit")?.addEventListener("click",()=>{ge(t.exercise,()=>{s(),H("data:changed"),We(e)})}),os(o);let n=o.querySelector(".exercise-chart-mount");n&&t.chartData.length>0&&ye(n,t.chartData,{unit:"lbs"})}})}async function ns(e){let[t,s,o,n]=await Promise.all([se("exercises",e),A("sets"),A("workouts"),ce()]);if(!t)return null;let i=new Map(o.map(c=>[c.id,c])),r=X(s).filter(c=>c.exerciseId===e&&c.workoutId!==n?.id&&i.has(c.workoutId)).map(c=>({...c,workout:i.get(c.workoutId)})).sort((c,m)=>c.workout.startedAt-m.workout.startedAt),a=r.reduce((c,m)=>c+m.weight*m.reps,0),d=r.reduce((c,m)=>!c||m.weight>c.weight||m.weight===c.weight&&m.reps>c.reps?m:c,null),l=new Map;for(let c of r){if(c.weight<=0||c.reps<=0||(c.setType||"working")==="warmup")continue;let m=l.get(c.workoutId)||{date:c.workout.startedAt,total:0,count:0};m.total+=c.weight*c.reps,m.count+=1,l.set(c.workoutId,m)}let p=Array.from(l.values()).map(({date:c,total:m,count:g})=>({date:c,value:m/g})).sort((c,m)=>c.date-m.date),v=`
    <div class="section">Details</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Equipment</div><div class="stat-value">${k(t.equipment)}</div></div>
      <div class="stat-row"><div class="stat-label">Muscle</div><div class="stat-value">${k(R(t))}</div></div>
      <button class="list-row button" id="exd-edit">
        <div class="row-main"><div class="row-title" style="color: var(--accent);">Edit Name, Muscle & Equipment</div></div>
      </button>
    </div>

    ${r.length>0?`
      <div class="section">Stats</div>
      <div class="form-section">
        <div class="stat-row"><div class="stat-label">Total Sets</div><div class="stat-value">${r.length.toLocaleString()}</div></div>
        <div class="stat-row"><div class="stat-label">Total Volume</div><div class="stat-value">${le(a)}</div></div>
        ${d?`<div class="stat-row"><div class="stat-label">Best Set</div><div class="stat-value">${ve(d.weight)} \xD7 ${d.reps}</div></div>`:""}
      </div>
    `:""}

    ${p.length>0?`
      <div class="section">Avg working-set volume per workout</div>
      <div class="exercise-chart-mount"></div>
    `:""}

    ${r.length>0?`
      <div class="section">Recent Sets \xB7 tap to view that workout</div>
      <div class="form-section">
        ${r.slice(-30).reverse().map(c=>`
          <button class="stat-row recent-set" data-workout-id="${k(c.workoutId)}">
            <div class="stat-label" style="font-size: 13px; color: var(--text-secondary);">${z(c.workout.startedAt)}</div>
            <div class="stat-value" style="color: var(--text);">${ve(c.weight)} \xD7 ${c.reps} <span class="name-chevron">\u203A</span></div>
          </button>
        `).join("")}
      </div>
    `:`
      <div class="empty-state" style="padding: 32px 24px;">
        <p style="color: var(--text-secondary);">No completed sets yet.</p>
      </div>
    `}
  `;return{exercise:t,completed:r,chartData:p,html:v}}var as=["Amazed","Excited","Happy","Joyful","Content","Calm","Relieved","Grateful","Hopeful","Confident","Proud","Surprised","Indifferent","Anxious","Stressed","Overwhelmed","Frustrated","Angry","Irritated","Sad","Lonely","Discouraged","Drained","Worried","Embarrassed"],cs=["Health","Fitness","Self-Care","Hobbies","Identity","Community","Family","Friends","Partner","Work","Education","Money","Weather","Tasks"],at=[["taken","Taken"],["skipped","Skipped"],["snoozed","Snoozed"],["notInteracted","Not interacted"]],vo=new Set(["taken","skipped","snoozed","notInteracted"]);function ho(e){let t=Number(e);return isFinite(t)?Math.max(-1,Math.min(1,t)):0}async function ls({id:e,kind:t,valence:s,labels:o,associations:n,date:i}){let r={id:e||F(),kind:t==="dailyMood"?"dailyMood":"momentaryEmotion",date:i||Date.now(),valence:ho(s),labels:o||[],associations:n||[]};return await q("stateOfMind",r),r}async function ds({id:e,nickname:t,form:s,hasSchedule:o,doseAmount:n,doseUnit:i}){let r=(t||"").trim()||"Medication",a=e?await se("medications",e):null,d=Number(n),l={id:e||F(),nickname:r,isArchived:a?!!a.isArchived:!1,hasSchedule:!!o,doseAmount:d>0?d:1,doseUnit:(i||"").trim(),concept:{identifier:a?.concept?.identifier||"",displayText:a?.concept?.displayText||r,form:(s||"").trim(),rxnorm:a?.concept?.rxnorm||[]}};return await q("medications",l),l}async function ct({id:e,medicationId:t,status:s,date:o,doseQuantity:n}){let i={id:e||F(),medicationId:String(t),status:vo.has(s)?s:"taken",date:o||Date.now(),scheduledQuantity:0,doseQuantity:Number(n)||0};return await q("doseEvents",i),i}async function Re(e,t){await ae(e,t)}async function lt(){let[e,t,s]=await Promise.all([A("stateOfMind"),A("medications"),A("doseEvents")]);return e.sort((o,n)=>o.date-n.date),s.sort((o,n)=>o.date-n.date),{stateOfMind:e,medications:t,doseEvents:s}}var is=e=>{let t=new Date(e);return`${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`},rs=e=>e.length?e.reduce((t,s)=>t+s,0)/e.length:null;function us(e,t){let s=new Set(t.map(a=>is(a.startedAt))),o=[],n=[];for(let a of e)(s.has(is(a.date))?o:n).push(a.valence);let i=rs(o),r=rs(n);return{onWorkout:i,offWorkout:r,delta:i!=null&&r!=null?i-r:null,onCount:o.length,offCount:n.length}}function ps(e,t){let s=new Map;for(let o of t){if(o.status!=="taken"&&o.status!=="skipped")continue;let n=s.get(o.medicationId)??{taken:0,total:0};n.total+=1,o.status==="taken"&&(n.taken+=1),s.set(o.medicationId,n)}return e.map(o=>{let n=s.get(o.id)??{taken:0,total:0};return{medication:o,taken:n.taken,total:n.total,pct:n.total?n.taken/n.total:null}})}var yo=Object.fromEntries(at),ys=e=>new Date(e).toLocaleTimeString(void 0,{hour:"numeric",minute:"2-digit"}),gs='<span style="font-size: 24px;">+</span>';async function dt(e,t){let s=()=>dt(e,t);e.setTitle("State of Mind"),e.setBack(t),e.setAction({html:gs,onClick:()=>fs(s)});let[{stateOfMind:o},n]=await Promise.all([lt(),J()]),i=us(o,n);e.container.innerHTML=`
    ${o.length?`
      <div class="section">Summary</div>
      <div class="form-section">
        <div class="stat-row"><div class="stat-label">Entries</div><div class="stat-value">${o.length.toLocaleString()}</div></div>
        <div class="stat-row"><div class="stat-label">Range</div><div class="stat-value">${z(o[0].date)} \u2013 ${z(o[o.length-1].date)}</div></div>
        <div class="stat-row"><div class="stat-label">Average mood</div><div class="stat-value">${Ne(ko(o))}</div></div>
      </div>

      <div class="section">Mood vs. training</div>
      <div class="form-section">
        <div class="stat-row"><div class="stat-label">On workout days</div><div class="stat-value">${i.onWorkout!=null?Ne(i.onWorkout)+` (${i.onCount})`:"\u2014"}</div></div>
        <div class="stat-row"><div class="stat-label">On rest days</div><div class="stat-value">${i.offWorkout!=null?Ne(i.offWorkout)+` (${i.offCount})`:"\u2014"}</div></div>
        <div class="stat-row"><div class="stat-label">Difference</div><div class="stat-value">${i.delta!=null?(i.delta>=0?"+":"")+i.delta.toFixed(2):"\u2014"}</div></div>
      </div>

      <div class="section">Recent entries</div>
      <div class="list">${o.slice(-30).reverse().map(go).join("")}</div>
    `:ws("\u{1F9E0}","No mood entries","Tap \uFF0B to log how you're feeling.")}
  `,e.container.scrollTop=0;for(let r of e.container.querySelectorAll("[data-edit-som]")){let a=o.find(d=>d.id===r.dataset.editSom);a&&r.addEventListener("click",()=>fs(s,a))}}function go(e){let t=e.kind==="dailyMood",s=e.labels.length?e.labels.join(", "):t?"Daily mood":"Momentary emotion",o=[...e.labels.length?[t?"Daily mood":"Moment"]:[],z(e.date),ys(e.date),...e.associations.length?[e.associations.join(", ")]:[]].join(" \xB7 ");return`
    <button class="list-row" data-edit-som="${k(e.id)}">
      <div class="row-main">
        <div class="row-title">${k(s)}</div>
        <div class="row-subtitle">${k(o)}</div>
      </div>
      <div class="row-trailing">${Ne(e.valence)}</div>
      <div class="chevron">\u203A</div>
    </button>`}async function ut(e,t){let s=()=>ut(e,t);e.setTitle("Medications"),e.setBack(t),e.setAction({html:gs,onClick:()=>vs(s)});let{medications:o,doseEvents:n}=await lt(),i=ps(o,n),r=new Map(o.map(p=>[p.id,p])),a=n.slice(-20).reverse(),d=new Date;d.setHours(0,0,0,0);let l=new Map;for(let p of n)p.status==="taken"&&p.date>=d.getTime()&&l.set(p.medicationId,(l.get(p.medicationId)||0)+1);e.container.innerHTML=`
    ${o.length?`
      <div class="section">Your medications</div>
      ${i.map(p=>wo(p,l.get(p.medication.id)||0)).join("")}
      ${a.length?`
        <div class="section">Recent doses</div>
        <div class="list">${a.map(p=>xo(p,r)).join("")}</div>
      `:""}
    `:ws("\u{1F48A}","No medications","Tap \uFF0B to add one, then log each dose as you take it.")}
  `,e.container.scrollTop=0;for(let p of e.container.querySelectorAll("[data-take]"))p.addEventListener("click",async()=>{await ct({medicationId:p.dataset.take,status:p.dataset.status,date:Date.now(),doseQuantity:je(r.get(p.dataset.take))}),I(p.dataset.status==="taken"?"Logged as taken":"Logged as skipped"),s()});for(let p of e.container.querySelectorAll("[data-logat]"))p.addEventListener("click",()=>hs(o,s,p.dataset.logat));for(let p of e.container.querySelectorAll("[data-edit-dose]")){let v=n.find(c=>c.id===p.dataset.editDose);v&&p.addEventListener("click",()=>hs(o,s,null,v))}for(let p of e.container.querySelectorAll("[data-edit-med]")){let v=r.get(p.dataset.editMed);v&&p.addEventListener("click",()=>vs(s,v))}}function wo(e,t){let s=e.medication,o=[s.concept.form||"No form set",e.pct!=null?`${Math.round(e.pct*100)}% taken (${e.taken}/${e.total})`:"no doses yet"].join(" \xB7 "),n=s.hasSchedule?t>0?'<span class="hz-pill" style="--pc: #2ba758;">\u2713 Taken today</span>':'<span class="hz-pill muted">Not taken today</span>':"";return`
    <div class="exercise-section">
      <button class="exercise-section-header" data-edit-med="${k(s.id)}">
        <div class="row-main">
          <div class="row-title" style="font-weight:600">${k(s.nickname||s.concept.displayText)}</div>
          <div class="row-subtitle">${k(o)}</div>
          ${n?`<div style="margin-top: 8px;">${n}</div>`:""}
        </div>
        <div class="chevron">\u203A</div>
      </button>
      <div class="med-actions">
        <button class="btn-secondary" data-take="${k(s.id)}" data-status="taken">Taken now</button>
        <button class="btn-secondary" data-take="${k(s.id)}" data-status="skipped">Skip</button>
        <button class="btn-secondary" data-logat="${k(s.id)}">Log at time\u2026</button>
      </div>
    </div>`}var je=e=>Number(e?.doseAmount)>0?Number(e.doseAmount):1;function bo(e,t){let s=(t||"").trim()||"dose",o=e===1||/^(mg|mcg|ml|cc|g|kg|l|oz|iu|puff|puffs)$/i.test(s)||s.endsWith("s")?s:`${s}s`;return`${So(e)} ${o}`}function xo(e,t){let s=t.get(e.medicationId),o=Number(e.doseQuantity)||0,n=[z(e.date),ys(e.date),...o>0?[bo(o,s?.doseUnit)]:[]].join(" \xB7 ");return`
    <button class="list-row" data-edit-dose="${k(e.id)}">
      <div class="row-main">
        <div class="row-title">${k(s?s.nickname||s.concept.displayText:"Medication")}</div>
        <div class="row-subtitle">${k(n)}</div>
      </div>
      <div class="row-trailing">${k(yo[e.status]||e.status)}</div>
      <div class="chevron">\u203A</div>
    </button>`}function ws(e,t,s){return`
    <div class="empty-state" style="padding: 48px 24px; min-height: auto;">
      <div class="empty-icon">${e}</div>
      <h2>${k(t)}</h2>
      <p>${k(s)}</p>
    </div>`}function ko(e){return e.reduce((t,s)=>t+s.valence,0)/e.length}var So=e=>Number.isInteger(e)?String(e):String(Number(e.toFixed(3)));function bs(e){return e>=.7?["Very pleasant","#2ba758"]:e>=.4?["Pleasant","#54a85a"]:e>=.1?["Slightly pleasant","#9cad46"]:e>-.1?["Neutral","#8a8a8e"]:e>-.4?["Slightly unpleasant","#d99a3c"]:e>-.7?["Unpleasant","#e07a4e"]:["Very unpleasant","#e0574f"]}function Ne(e){let[t,s]=bs(e);return`<span class="hz-pill" style="--pc: ${s};">${k(t)}</span>`}function pt(e){let t=new Date(e),s=o=>String(o).padStart(2,"0");return`${t.getFullYear()}-${s(t.getMonth()+1)}-${s(t.getDate())}T${s(t.getHours())}:${s(t.getMinutes())}`}var xs=()=>pt(Date.now());function ks(e){let t=e?new Date(e).getTime():NaN;return isFinite(t)?t:Date.now()}var $o=e=>Math.max(-3,Math.min(3,Math.round(e*3)));function ms(e,t=[]){return e.map(s=>`<button type="button" class="chip${t.includes(s)?" active":""}" data-chip="${k(s)}">${k(s)}</button>`).join("")}function we(e,t,s={}){for(let o of e.querySelectorAll(`${t} .chip`))o.addEventListener("click",()=>{s.single&&e.querySelectorAll(`${t} .chip`).forEach(n=>n.classList.remove("active")),o.classList.toggle("active",s.single?!0:!o.classList.contains("active"))})}var be=(e,t)=>[...e.querySelectorAll(`${t} .chip.active`)].map(s=>s.dataset.chip);function fs(e,t=null){let s=!!t,o=s&&t.kind==="dailyMood",n=s?$o(t.valence):1,i=s?t.valence:n/3,r=W({html:`
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
        <div class="chip-row" id="som-emotions" style="flex-wrap: wrap;">${ms(as,s?t.labels:[])}</div>
        <div class="section">What's affecting you? (optional)</div>
        <div class="chip-row" id="som-assoc" style="flex-wrap: wrap;">${ms(cs,s?t.associations:[])}</div>
        <div class="section">When</div>
        <div class="form-section">
          <div class="form-row"><input type="datetime-local" id="som-date" value="${s?pt(t.date):xs()}" style="text-align: left;" /></div>
        </div>
        ${s?`
        <div style="height: 8px;"></div>
        <div class="form-section">
          <button class="list-row button destructive" id="som-delete"><div class="row-main"><div class="row-title" style="color: var(--red);">Delete Entry</div></div></button>
        </div>`:""}
        <div style="height: 16px;"></div>
      </div>
    `,onMount(a){let d=a.querySelector("#som-val"),l=a.querySelector("#som-val-label"),p=()=>{l.textContent=bs(Number(d.value)/3)[0]};p(),d.addEventListener("input",()=>{i=Number(d.value)/3,p()}),we(a,"#som-kind",{single:!0}),we(a,"#som-emotions"),we(a,"#som-assoc"),a.querySelector("#som-cancel").addEventListener("click",()=>r()),a.querySelector("#som-save").addEventListener("click",async()=>{await ls({id:t?.id,kind:be(a,"#som-kind")[0]||"momentaryEmotion",valence:i,labels:be(a,"#som-emotions"),associations:be(a,"#som-assoc"),date:ks(a.querySelector("#som-date").value)}),r(),I(s?"Entry updated":"Logged State of Mind"),e?.()}),a.querySelector("#som-delete")?.addEventListener("click",async()=>{confirm("Delete this entry?")&&(await Re("stateOfMind",t.id),r(),I("Entry deleted"),e?.())})}})}function vs(e,t=null){let s=!!t,o=s?!!t.hasSchedule:!0,n=W({html:`
      <div class="sheet-header">
        <button class="btn-text" id="med-cancel">Cancel</button>
        <div class="title">${s?"Edit Medication":"Add Medication"}</div>
        <button class="btn-text primary" id="med-save"${s?"":" disabled"}>Save</button>
      </div>
      <div class="sheet-content">
        <div class="section">Name</div>
        <div class="form-section">
          <div class="form-row"><input id="med-name" placeholder="e.g. Sertraline" value="${s?k(t.nickname||t.concept.displayText):""}" style="text-align: left;" /></div>
        </div>
        <div class="section">Form (optional)</div>
        <div class="form-section">
          <div class="form-row"><input id="med-form" placeholder="e.g. tablet, 50 mg" value="${s?k(t.concept?.form||""):""}" style="text-align: left;" /></div>
        </div>
        <div class="section">Amount per dose</div>
        <div class="form-section">
          <div class="form-row"><input type="number" id="med-amount" inputmode="decimal" min="0" step="0.25" value="${s?k(String(je(t))):"1"}" style="text-align: left;" /></div>
          <div class="form-row"><input id="med-unit" placeholder="unit \u2014 e.g. capsule, tablet, mg" value="${s?k(t.doseUnit||""):""}" style="text-align: left;" /></div>
        </div>
        <div class="section-footer">How many you take at once. Creatine, for example, is 4 capsules \u2014 one \u201CTaken now\u201D then logs all four.</div>
        <div class="section">Type</div>
        <div class="chip-row" id="med-type">
          <button type="button" class="chip${o?" active":""}" data-chip="daily">Daily</button>
          <button type="button" class="chip${o?"":" active"}" data-chip="asneeded">As needed</button>
        </div>
        <div class="section-footer">Daily medications show whether you've taken them today.</div>
        ${s?`
        <div class="form-section">
          <button class="list-row button destructive" id="med-delete"><div class="row-main"><div class="row-title" style="color: var(--red);">Delete Medication</div></div></button>
        </div>`:""}
        <div style="height: 16px;"></div>
      </div>
    `,onMount(i){let r=i.querySelector("#med-name"),a=i.querySelector("#med-save");r.addEventListener("input",()=>{a.disabled=r.value.trim().length===0}),we(i,"#med-type",{single:!0}),i.querySelector("#med-cancel").addEventListener("click",()=>n()),a.addEventListener("click",async()=>{r.value.trim()&&(await ds({id:t?.id,nickname:r.value,form:i.querySelector("#med-form").value,hasSchedule:(be(i,"#med-type")[0]||"daily")==="daily",doseAmount:i.querySelector("#med-amount").value,doseUnit:i.querySelector("#med-unit").value}),n(),I(s?"Medication updated":"Medication added"),e?.())}),i.querySelector("#med-delete")?.addEventListener("click",async()=>{confirm("Delete this medication? Its logged doses stay in your history.")&&(await Re("medications",t.id),n(),I("Medication deleted"),e?.())}),s||setTimeout(()=>r.focus(),50)}})}function hs(e,t,s,o=null){let n=!!o,i=e.filter(v=>!v.isArchived),r=i.length?i:e,a=n?o.medicationId:s,d=n?o.status:"taken",l=n?Number(o.doseQuantity)||1:je(r.find(v=>v.id===a)||r[0]),p=W({html:`
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
              ${r.map(v=>`<option value="${k(v.id)}"${v.id===a?" selected":""}>${k(v.nickname||v.concept.displayText)}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="section">Status</div>
        <div class="chip-row" id="dose-status">
          ${at.map(([v,c])=>`<button type="button" class="chip${v===d?" active":""}" data-chip="${v}">${k(c)}</button>`).join("")}
        </div>
        <div class="section">Amount</div>
        <div class="form-section">
          <div class="form-row"><input type="number" id="dose-qty" inputmode="decimal" min="0" step="0.25" value="${l}" style="text-align: left;" /></div>
        </div>
        <div class="section">When</div>
        <div class="form-section">
          <div class="form-row"><input type="datetime-local" id="dose-date" value="${n?pt(o.date):xs()}" style="text-align: left;" /></div>
        </div>
        ${n?`
        <div style="height: 8px;"></div>
        <div class="form-section">
          <button class="list-row button destructive" id="dose-delete"><div class="row-main"><div class="row-title" style="color: var(--red);">Delete Dose</div></div></button>
        </div>`:""}
        <div style="height: 16px;"></div>
      </div>
    `,onMount(v){if(we(v,"#dose-status",{single:!0}),!n){let c=v.querySelector("#dose-med"),m=v.querySelector("#dose-qty");c.addEventListener("change",()=>{m.value=String(je(e.find(g=>g.id===c.value)))})}v.querySelector("#dose-cancel").addEventListener("click",()=>p()),v.querySelector("#dose-save").addEventListener("click",async()=>{await ct({id:o?.id,medicationId:v.querySelector("#dose-med").value,status:be(v,"#dose-status")[0]||"taken",date:ks(v.querySelector("#dose-date").value),doseQuantity:Number(v.querySelector("#dose-qty").value)||0}),p(),I(n?"Dose updated":"Dose logged"),t?.()}),v.querySelector("#dose-delete")?.addEventListener("click",async()=>{confirm("Delete this dose?")&&(await Re("doseEvents",o.id),p(),I("Dose deleted"),t?.())})}})}function Es(e){let t=!0,s=null;return e.container.innerHTML="",ce().then(o=>{t&&(o?s=Do(e,o):Mo(e))}).catch(o=>{t&&(e.container.innerHTML=`<div class="empty-state"><div class="empty-icon">!</div><h2>Couldn't load</h2><p>${k(o.message)}</p></div>`)}),()=>{t=!1,typeof s=="function"&&s()}}async function Mo(e){e.setTitle("Workout");let t=await J(),s=t[0],o=Je(t),n=o?qe(o.normalized):N[0],r=o&&Ss(o.startedAt)==="today"?"Tomorrow":"Today",a=s?`<div class="last-workout-hint">Last: <strong>${k(s.name)}</strong> \xB7 ${Ss(s.startedAt)}</div>`:"",d=`<div class="next-workout-hint">${r}: <strong>${k(n)}</strong></div>`;e.container.innerHTML=`
    <div class="workout-start">
      <div class="icon">\u{1F3CB}\uFE0F</div>
      <h2>No active workout</h2>
      <p>Start one to begin logging sets.</p>
      ${a}
      ${d}
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
  `,e.container.querySelector("#start-btn").addEventListener("click",()=>Eo(n,r));for(let l of e.container.querySelectorAll("[data-nav]"))l.addEventListener("click",()=>{l.dataset.nav==="mind"?dt(e,()=>e.refresh()):ut(e,()=>e.refresh())})}function Ss(e){let t=new Date,s=new Date(e),o=i=>new Date(i.getFullYear(),i.getMonth(),i.getDate()).getTime(),n=Math.round((o(t)-o(s))/(1440*60*1e3));return n===0?"today":n===1?"yesterday":n<7?`${n} days ago`:n<14?"a week ago":`${Math.round(n/7)} weeks ago`}function Eo(e,t="Today"){Lo(e,async s=>{let o={id:F(),name:s,startedAt:Date.now(),endedAt:null,notes:""};await q("workouts",o),H("workout:changed")},t)}function Lo(e,t,s="Today"){let n=W({html:`
      <div class="sheet-header">
        <button class="btn-text" id="wt-cancel">Cancel</button>
        <div class="title">New Workout</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">
        <div class="section">Pick a type</div>
        <div class="form-section">
          ${N.map(i=>{let a=i===e?` <span class="badge">${k(s)}</span>`:"";return`
              <button class="list-row button" data-name="${k(i)}">
                <div class="row-main"><div class="row-title" style="color: ${Ie(i)}; font-weight: 600;">${k(i)}${a}</div></div>
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
    `,onMount(i){i.querySelector("#wt-cancel").addEventListener("click",()=>n());for(let d of i.querySelectorAll(".list-row.button[data-name]"))d.addEventListener("click",()=>{let l=d.dataset.name;n(),t(l)});let r=i.querySelector("#wt-custom"),a=i.querySelector("#wt-go");r.addEventListener("input",()=>{a.disabled=r.value.trim().length===0}),a.addEventListener("click",()=>{let d=r.value.trim();d&&(n(),t(d))}),setTimeout(()=>r.focus(),50)}})}function Do(e,t){let s=[],o=[],n=new Map,i=new Map,r=null;e.container.innerHTML=`
    <div class="active-workout">
      <div class="workout-header">
        <input class="workout-name-input" id="wname" value="${k(t.name)}" placeholder="Workout name" />
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
  `,e.container.querySelector("#calc-fab").addEventListener("click",Ho);let a=()=>{e.setTitle(Mt((Date.now()-t.startedAt)/1e3))};a(),r=setInterval(a,1e3);let d=e.container.querySelector("#wname");d.addEventListener("input",async()=>{t.name=d.value,await q("workouts",{...t}),ie()});let l=new Map;e.container.querySelector("#add-exercise-btn").addEventListener("click",()=>{Po(s,i,async h=>{await Co(t,o,h),await p()})}),e.container.querySelector("#finish-btn").addEventListener("click",async()=>{if(confirm("Finish this workout?")){await qo(t,o);try{let{filename:h}=await nt();I(`Saved \xB7 backup: ${h}`)}catch(h){I(`Saved \xB7 backup failed: ${h.message}`)}H("workout:changed")}}),e.container.querySelector("#discard-btn").addEventListener("click",async()=>{confirm("Discard this workout? This cannot be undone.")&&(await De(t.id),H("workout:changed"))});async function p(){let[h,y,E]=await Promise.all([A("sets"),A("workouts"),A("exercises")]);s=E,o=h.filter(S=>S.workoutId===t.id).sort((S,$)=>S.order-$.order),n=wt(h,y,t.id),l=m(h,E,t.id),i=new Map;for(let S of h)i.set(S.exerciseId,(i.get(S.exerciseId)??0)+1);M(),v()}function v(){let h=new Map(s.map(x=>[x.id,x])),y=[],E=new Map;for(let x of o){let D=h.get(x.exerciseId);if(!D)continue;let L=R(D);if(y.includes(L)||y.push(L),!x.completed)continue;let C=(x.weight||0)*(x.reps||0);C<=0||E.set(L,(E.get(L)??0)+C)}let S=[...E.values()].reduce((x,D)=>x+D,0),$=e.container.querySelector("#workout-progress");if(!$)return;if(y.length===0){$.innerHTML="";return}let T=y.map(x=>{let D=l.get(x)??0,L=E.get(x)??0;return{muscle:x,record:D,cur:L,span:Math.max(D,L)}}),B=Math.max(...T.map(x=>x.span)),f=B>0?B*.12:1;T=T.map(x=>({...x,span:Math.max(x.span,f)}));let u=Math.max(...T.map(x=>x.span)),w=T.map(({muscle:x,record:D,cur:L,span:C})=>{let P=C/u*100,U=L>0?Math.min(100,L/C*100):0,O;if(D>0){let de=Math.round(L/D*100);O=L>D?`${de}% \u{1F525}`:`${de}%`}else O=L>0?"new \u{1F525}":"new";let V=D>0?`${Q(L)} / ${Q(D)} \xB7 ${O}`:`${Q(L)} \xB7 ${O}`,_=Ct(x);return`
        <div class="vol-muscle" style="width: ${P.toFixed(2)}%; --mcolor: ${_}; --mtext: ${qt(_)};" title="${k(x)}: ${Q(L)} / record ${Q(D)} lbs">
          <div class="vol-fill" style="width: ${U.toFixed(2)}%;"></div>
          <div class="vol-info${U>55?" on-fill":""}">
            <span class="seg-name">${k(x)}</span>
            <span class="seg-vol">${V}</span>
          </div>
        </div>
      `}).join(""),b=`<strong>${Q(S)} lbs</strong> total`;$.innerHTML=`
      <div class="vol-bars">${w}</div>
      <div class="vol-label">${b}</div>
    `,requestAnimationFrame(()=>{for(let x of $.querySelectorAll(".vol-muscle"))c(x)})}function c(h){let y=h.querySelector(".seg-name"),E=h.querySelector(".seg-vol"),S=h.clientWidth-4;if(S<=0)return;if(E){let T=10;for(E.style.fontSize=`${T}px`;E.scrollWidth>S&&T>6;)T-=.5,E.style.fontSize=`${T}px`}if(!y)return;y.style.display="";let $=11;for(y.style.fontSize=`${$}px`;y.scrollWidth>S&&$>5;)$-=.5,y.style.fontSize=`${$}px`}function m(h,y,E){let S=new Map(y.map(B=>[B.id,B])),$=new Map,T=new Map;for(let B of X(h)){if(B.workoutId===E)continue;let f=S.get(B.exerciseId);if(!f)continue;let u=(B.weight||0)*(B.reps||0);if(u<=0)continue;let w=R(f),b=T.get(B.workoutId);b||T.set(B.workoutId,b=new Map),b.set(w,(b.get(w)??0)+u)}for(let B of T.values())for(let[f,u]of B)u>($.get(f)??0)&&$.set(f,u);return $}async function g(h){if(!h.completed||(h.setType||"working")==="warmup"||!(h.weight>0)||!(h.reps>0))return;let y=s.find(u=>u.id===h.exerciseId);if(!y)return;let E=await A("sets"),S=X(E).filter(u=>u.exerciseId===h.exerciseId&&u.id!==h.id&&(u.setType||"working")!=="warmup"&&u.weight>0&&u.reps>0);if(S.length===0)return;let $=[],T=S.reduce((u,w)=>Math.max(u,w.weight),0);h.weight>T&&$.push(`Heaviest weight ever: ${fe(h.weight)} lbs`);let B=h.weight*h.reps,f=S.reduce((u,w)=>Math.max(u,w.weight*w.reps),0);if(B>f&&$.push(`Most volume in a set: ${fe(h.weight)}\xD7${h.reps} = ${Q(B)} lbs`),$.length>0){let u=$.length>1?"New records":"New record";I(`\u{1F3C6} ${K(y)} \u2014 ${u}!
${$.join(`
`)}`,0,{persistUntilClick:!0})}}function M(){let h=new Map(s.map(f=>[f.id,f])),y=[],E=new Map;for(let f of o)E.has(f.exerciseId)||(E.set(f.exerciseId,[]),y.push(f.exerciseId)),E.get(f.exerciseId).push(f);for(let[,f]of E)f.sort((u,w)=>u.order-w.order);let S=e.container.querySelector("#exercise-sections");if(y.length===0){S.innerHTML=`
        <div class="empty-state" style="padding: 40px 24px; min-height: auto;">
          <p style="color: var(--text-secondary);">Add an exercise to start logging sets.</p>
        </div>`;return}S.innerHTML=y.map(f=>{let u=h.get(f),w=E.get(f),b=n.get(f)??new Map;return Ao(u,w,b,i.get(f)??0)}).join("");function $(f){delete f.bumpedBy,delete f.preBumpWeight,delete f.preBumpReps}function T(f){let u=o.filter(L=>L.exerciseId===f.exerciseId).sort((L,C)=>L.order-C.order),w=f.setType||"working",b=0,x=0;for(let L of u)if(x+=1,(L.setType||"working")===w&&(b+=1),L.id===f.id)break;let D=xe(w,b,n.get(f.exerciseId),x);return D&&D.weight>0&&D.reps>0?{weight:D.weight,reps:D.reps}:null}async function B(f){await Ms(f.id,o),f.completed&&await $s(f,o,T);for(let u of o){if(u.exerciseId!==f.exerciseId)continue;let w=S.querySelector(`.set-row[data-set-id="${u.id}"]`);if(!w)continue;let b=w.querySelector(".weight-input"),x=w.querySelector(".reps-input");b&&document.activeElement!==b&&(b.value=u.weight>0?String(u.weight):""),x&&document.activeElement!==x&&(x.value=u.reps>0?String(u.reps):"")}}for(let f of S.querySelectorAll(".set-row-wrap")){let u=f.querySelector(".set-row"),w=u.dataset.setId,b=o.find(O=>O.id===w);if(!b)continue;let x=u.querySelector(".weight-input"),D=u.querySelector(".reps-input"),L=u.querySelector(".complete-btn");Bo(f,async()=>{await ae("sets",b.id),await p()});let C=Ke(async()=>{await B(b),b.completed&&v()},200);x.addEventListener("input",()=>{b.weight=parseFloat(x.value)||0,$(b),q("sets",{...b}).catch(O=>console.error("Set save failed",O)),C()});let P=Ke(async()=>{await B(b),b.completed&&v()},200);D.addEventListener("input",()=>{b.reps=parseInt(D.value,10)||0,$(b),q("sets",{...b}).catch(O=>console.error("Set save failed",O)),P()}),L.addEventListener("click",async()=>{let O=b.completed;b.completed=!b.completed,b.completed&&$(b),await q("sets",b),u.classList.toggle("completed",b.completed),L.innerHTML=Ls(b.completed);let V=u.querySelector(".set-number")?.textContent?.trim()||"";L.setAttribute("aria-label",`${b.completed?"Mark incomplete":"Mark complete"} set ${V}`),v(),!O&&b.completed?(await $s(b,o,T)&&M(),await g(b)):O&&!b.completed&&await Ms(b.id,o)&&M()});let U=u.querySelector(".set-number");U&&U.addEventListener("click",async()=>{let V=(b.setType||"working")==="warmup"?"working":"warmup";if(b.setType=V,!b.completed){let _=o.filter(re=>re.exerciseId===b.exerciseId).sort((re,Ts)=>re.order-Ts.order),de=0,ft=0;for(let re of _)if(ft+=1,(re.setType||"working")===V&&(de+=1),re.id===b.id)break;let ue=xe(V,de,n.get(b.exerciseId),ft);ue&&ue.weight>0&&ue.reps>0&&(b.weight=ue.weight,b.reps=ue.reps)}await q("sets",b),M()})}for(let f of S.querySelectorAll(".add-set-btn"))f.addEventListener("click",async()=>{let u=f.dataset.exerciseId;await Io(t,o,u,n.get(u)??new Map),await p()});for(let f of S.querySelectorAll(".exercise-menu"))f.addEventListener("click",async()=>{let u=f.dataset.exerciseId;confirm("Remove this exercise from the workout?")&&(await _e("sets",o.filter(w=>w.exerciseId===u).map(w=>w.id)),await p())});for(let f of S.querySelectorAll(".exercise-name-btn"))f.addEventListener("click",()=>{r&&(clearInterval(r),r=null),Fe(e,f.dataset.exerciseId,()=>e.refresh())})}return p(),()=>{r&&clearInterval(r)}}function Ao(e,t,s=new Map,o=0){let n=0,i=0,r=t.map((a,d)=>{let l=a.setType||"working",p,v;l==="warmup"?(i+=1,v=i,p=`W${i}`):(n+=1,v=n,p=String(n));let c=xe(l,v,s,d+1);return To(a,p,c)}).join("");return`
    <div class="exercise-section">
      <div class="exercise-section-header">
        <button class="exercise-name-btn" data-exercise-id="${e?.id}">${oe(e)}</button>
        <div class="row-trailing trailing-stack">${ne(o)}</div>
        <button class="menu exercise-menu" data-exercise-id="${e?.id}" aria-label="Remove ${k(K(e))} from workout">\xD7</button>
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
  `}function xe(e,t,s,o=null){if(!s||typeof s.get!="function")return null;let n=s.get(`${e}#${t}`);return n||(o!=null?s.get(`any#${o}`)??null:null)}function To(e,t,s){let o=e.setType||"working",n=s&&s.weight>0&&s.reps>0?`${fe(s.weight)} \xD7 ${s.reps}`:"\u2014";return`
    <div class="set-row-wrap" data-set-id="${e.id}">
      <button class="set-swipe-delete" data-set-id="${e.id}" aria-label="Delete set ${t}">Delete</button>
      <div class="set-row type-${o}${e.completed?" completed":""}" data-set-id="${e.id}">
        <button class="set-number" aria-label="Set ${t}, tap to mark as ${o==="warmup"?"working":"warmup"}">${t}</button>
        <div class="prev" aria-label="Previous">${n}</div>
        <input class="weight-input" type="number" inputmode="decimal" step="0.5" aria-label="Weight in pounds for set ${t}"
               placeholder="0" value="${e.weight>0?e.weight:""}" />
        <input class="reps-input" type="number" inputmode="numeric" step="1" aria-label="Repetitions for set ${t}"
               placeholder="0" value="${e.reps>0?e.reps:""}" />
        <button class="complete-btn" aria-label="${e.completed?"Mark incomplete":"Mark complete"} set ${t}">${Ls(e.completed)}</button>
      </div>
    </div>
  `}function Bo(e,t){let s=e.querySelector(".set-row"),o=e.querySelector(".set-swipe-delete");if(!s||!o)return;let n=88,i=0,r=0,a=0,d=0,l=!1,p=!1,v=!1,c=!1,m=()=>Math.max(140,i*.5);function g(S,$){s.style.transition=$?"transform 0.18s ease":"none",s.style.transform=`translateX(${S}px)`,o.style.width=`${Math.max(n,-S)}px`,e.classList.toggle("will-delete",S<=-m())}function M(S=!0){v=!1,g(0,S),e.classList.remove("swiped-open")}function h(S=!0){document.querySelectorAll(".set-row-wrap.swiped-open").forEach($=>{if($!==e){let T=$.querySelector(".set-row");T&&(T.style.transition="transform 0.18s ease",T.style.transform="translateX(0)");let B=$.querySelector(".set-swipe-delete");B&&(B.style.width=""),$.classList.remove("swiped-open","will-delete")}}),v=!0,g(-n,S),e.classList.add("swiped-open")}function y(){s.style.transition="transform 0.16s ease-out",s.style.transform=`translateX(${-i}px)`,o.style.width=`${i}px`,setTimeout(t,150)}s.addEventListener("touchstart",S=>{i=e.clientWidth||s.clientWidth,r=S.touches[0].clientX,a=S.touches[0].clientY,d=v?-n:0,l=!0,p=!1,c=!!S.target.closest("input, button, select, textarea")},{passive:!0}),s.addEventListener("touchmove",S=>{if(!l)return;let $=S.touches[0].clientX-r,T=S.touches[0].clientY-a;if(!p){if(Math.abs(T)>Math.abs($)+4){l=!1;return}Math.abs($)>8&&(p=!0,c&&document.activeElement?.blur&&document.activeElement.blur())}if(!p)return;S.cancelable&&S.preventDefault();let B=v?-n:0;d=Math.min(0,Math.max(-i,B+$)),g(d,!1)},{passive:!1});function E(){l&&(l=!1,p&&(d<=-m()?y():d<-n/2?h():M()))}s.addEventListener("touchend",E),s.addEventListener("touchcancel",E),o.addEventListener("click",S=>{S.stopPropagation(),t()})}function Ls(e){return e?'<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>':'<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>'}async function Co(e,t,s){let o=t.reduce((n,i)=>Math.max(n,i.order),-1)+1;for(let n of s){let i=(await gt(n,e.id)).filter(d=>(d.weight||0)>0&&(d.reps||0)>0),a=(i.length>0?i:[{weight:0,reps:0,setType:"working"}]).map(d=>({id:F(),workoutId:e.id,exerciseId:n,weight:d.weight??0,reps:d.reps??0,setType:d.setType||"working",completed:!1,order:o++,createdAt:Date.now()}));await Y("sets",a)}}async function $s(e,t,s){let o=(e.weight||0)*(e.reps||0);if(o<=0)return!1;let n=!1;for(let i of t)if(i.exerciseId===e.exerciseId&&i.id!==e.id&&!((i.order??0)<=(e.order??0))&&!i.completed&&(i.weight||0)*(i.reps||0)<o){if(i.bumpedBy==null){let r=s?.(i);i.preBumpWeight=r?r.weight:i.weight,i.preBumpReps=r?r.reps:i.reps}i.bumpedBy=e.id,i.weight=e.weight,i.reps=e.reps,await q("sets",i),n=!0}return n}async function Ms(e,t){let s=!1;for(let o of t)o.bumpedBy===e&&(o.completed||(o.preBumpWeight!=null&&(o.weight=o.preBumpWeight),o.preBumpReps!=null&&(o.reps=o.preBumpReps)),delete o.bumpedBy,delete o.preBumpWeight,delete o.preBumpReps,await q("sets",o),s=!0);return s}async function Io(e,t,s,o=new Map){let n=t.filter(M=>M.exerciseId===s),i=n[n.length-1],r=M=>(M?.weight||0)*(M?.reps||0),a=n.filter(M=>(M.setType||"working")!=="warmup"),d=a.length+1,l=xe("working",d,o,n.length+1),p=a.filter(M=>M.weight>0&&M.reps>0).reduce((M,h)=>!M||r(h)>r(M)?h:M,null),v=a.some((M,h)=>{let y=xe("working",h+1,o);return y&&y.weight>0&&y.reps>0&&r(M)>r(y)}),c=i?.weight??0,m=i?.reps??0;p&&(!l||v)&&(c=p.weight,m=p.reps);let g={id:F(),workoutId:e.id,exerciseId:s,weight:c,reps:m,completed:!1,order:(i?.order??-1)+1,createdAt:Date.now()};await q("sets",g)}async function qo(e,t){await _e("sets",t.filter(s=>!s.completed&&((s.weight||0)===0||(s.reps||0)===0)).map(s=>s.id)),e.endedAt=Date.now(),await q("workouts",e)}function Po(e,t,s){let o=new Set,n="",i=null,r=W({html:`
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
    `,onMount(a){let d=a.querySelector("#picker-list"),l=a.querySelector("#picker-add"),p=a.querySelector("#picker-cancel"),v=a.querySelector("#picker-custom"),c=a.querySelector("#picker-search"),m=a.querySelector("#picker-chips");function g(){m.innerHTML=Be(e,i);for(let h of m.querySelectorAll(".chip"))h.addEventListener("click",()=>{let y=h.dataset.cat;i=y==="All"?null:y,g(),M()})}function M(){let h=e.filter(y=>!i||R(y)===i).filter(y=>!n||y.name.toLowerCase().includes(n.toLowerCase())).sort((y,E)=>{let S=t.get(y.id)??0,$=t.get(E.id)??0;return S!==$?$-S:y.name.localeCompare(E.name)});d.innerHTML=h.length===0?'<div class="list-row"><div class="row-main" style="color:var(--text-secondary)">No matches</div></div>':h.map(y=>`
                <button class="list-row" data-id="${y.id}">
                  ${oe(y)}
                  <div class="row-trailing trailing-stack">
                    ${ne(t.get(y.id)??0)}
                    ${o.has(y.id)?Oo():""}
                  </div>
                </button>
              `).join("");for(let y of d.querySelectorAll(".list-row[data-id]"))y.addEventListener("click",()=>{let E=y.dataset.id;o.has(E)?o.delete(E):o.add(E),l.disabled=o.size===0,l.textContent=o.size===0?"Add":`Add (${o.size})`,M()})}c.addEventListener("input",()=>{n=c.value,M()}),p.addEventListener("click",()=>r()),l.addEventListener("click",()=>{s(Array.from(o)),r()}),v.addEventListener("click",()=>{ge(null,async h=>{e.push(h),o.add(h.id),g(),M(),l.disabled=!1,l.textContent=`Add (${o.size})`})}),g(),M()}})}function Oo(){return'<svg viewBox="0 0 24 24" width="22" height="22" fill="var(--green)"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'}function ge(e,t){let s=!!e,o=s?R(e):null,n=!o||he.includes(o)?he:[o,...he],i=e?.equipment,r=!i||Te.includes(i)?Te:[i,...Te],a=W({html:`
      <div class="sheet-header">
        <button class="btn-text" id="ce-cancel">Cancel</button>
        <div class="title">${s?"Edit Exercise":"New Exercise"}</div>
        <button class="btn-text primary" id="ce-save" ${s?"":"disabled"}>Save</button>
      </div>
      <div class="sheet-content">
        <div class="section">Name</div>
        <div class="form-section">
          <div class="form-row">
            <input id="ce-name" placeholder="e.g. Cable Lateral Raise" style="text-align: left;" value="${k(e?.name??"")}" />
          </div>
        </div>
        <div class="section">Muscle</div>
        <div class="form-section">
          <div class="form-row">
            <label for="ce-cat">Muscle</label>
            <select id="ce-cat">${n.map(d=>`<option${d===o?" selected":""}>${k(d)}</option>`).join("")}</select>
          </div>
        </div>
        <div class="section">Equipment</div>
        <div class="form-section">
          <div class="form-row">
            <label for="ce-eq">Equipment</label>
            <select id="ce-eq">${r.map(d=>`<option${d===i?" selected":""}>${k(d)}</option>`).join("")}</select>
          </div>
        </div>
      </div>
    `,onMount(d){let l=d.querySelector("#ce-name"),p=d.querySelector("#ce-save");l.addEventListener("input",()=>{p.disabled=l.value.trim().length===0}),d.querySelector("#ce-cancel").addEventListener("click",()=>a()),p.addEventListener("click",async()=>{let v=l.value.trim();if(!v)return;let c=d.querySelector("#ce-cat").value,m=d.querySelector("#ce-eq").value,g=s?{...e,name:v,muscle:c,equipment:m}:{id:F(),name:v,muscle:c,category:c,equipment:m,notes:"",isCustom:!0,createdAt:Date.now()};await q("exercises",g),a(),t?.(g),s||H("data:changed")}),s||setTimeout(()=>l.focus(),50)}})}function Ho(){let t=[["AC","clear","fn"],["\xB1","sign","fn"],["\u232B","back","fn"],["\xF7","op","op"],["7","digit"],["8","digit"],["9","digit"],["\xD7","op","op"],["4","digit"],["5","digit"],["6","digit"],["\u2212","op","op"],["1","digit"],["2","digit"],["3","digit"],["+","op","op"],["0","digit","zero"],[".","dot"],["=","equals","op"]].map(([s,o,n])=>`<button class="calc-key${n?` calc-${n}`:""}" data-action="${o}" data-key="${k(s)}">${k(s)}</button>`).join("");W({html:`
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
    `,onMount(s,o){let n=s.querySelector("#calc-expr"),i=s.querySelector("#calc-result"),r={"+":(u,w)=>u+w,"\u2212":(u,w)=>u-w,"\xD7":(u,w)=>u*w,"\xF7":(u,w)=>w===0?NaN:u/w},a=u=>u==="+"||u==="\u2212"||u==="\xD7"||u==="\xF7",d=u=>{if(!isFinite(u))return"Error";let w=parseFloat(u.toFixed(8)).toString();return w.replace("-","").replace(".","").length>12&&(w=u.toPrecision(10).replace(/\.?0+$/,"")),w},l=["0"],p=!1,v=!1,c="",m=()=>l[l.length-1];function g(){n.textContent=v?"":c,i.textContent=v?"Error":l.join(" ");let u=!v&&a(m())?m():null;for(let w of s.querySelectorAll(".calc-op"))w.classList.toggle("selected",w.dataset.key===u)}function M(u){if(v&&(l=["0"],v=!1),p)return l=[u],p=!1,g();a(m())?l.push(u):l[l.length-1]=m()==="0"?u:m()+u,g()}function h(){if(v&&(l=["0"],v=!1),p)return l=["0."],p=!1,g();a(m())?l.push("0."):m().includes(".")||(l[l.length-1]=m()+"."),g()}function y(u){v||(p=!1,a(m())?l[l.length-1]=u:l.push(u),g())}function E(){l=["0"],p=!1,v=!1,g()}function S(){if(v||a(m()))return;let u=m();l[l.length-1]=u.startsWith("-")?u.slice(1):u==="0"?"0":"-"+u,g()}function $(){if(v)return E();if(p=!1,a(m()))return l.pop(),g();let u=m().slice(0,-1);u===""||u==="-"?l.length>1?l.pop():l=["0"]:l[l.length-1]=u,g()}function T(){if(v)return;let u=l.slice();if(a(u[u.length-1])&&u.pop(),u.length<3)return;let w=parseFloat(u[0]);for(let b=1;b<u.length;b+=2)if(w=r[u[b]](w,parseFloat(u[b+1])),!isFinite(w))return v=!0,g();c=`${u.join(" ")} =`,l=[d(w)],p=!0,g()}function B(u){let{action:w,key:b}=u.dataset;w!=="equals"&&(c=""),w==="digit"?M(b):w==="dot"?h():w==="clear"?E():w==="sign"?S():w==="back"?$():w==="op"?y(b):w==="equals"&&T()}let f=null;for(let u of s.querySelectorAll(".calc-key"))u.addEventListener("pointerdown",w=>{w.preventDefault(),f=u,u.classList.add("pressed")}),u.addEventListener("pointerup",w=>{w.preventDefault(),u.classList.remove("pressed"),f===u&&B(u),f=null}),u.addEventListener("pointercancel",()=>{u.classList.remove("pressed"),f=null}),u.addEventListener("pointerleave",()=>u.classList.remove("pressed"));s.querySelector("#calc-done").addEventListener("click",()=>o())}})}function $e(){let e=window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===!0,t;e?t=Math.max(window.innerHeight||0,window.visualViewport?.height||0,window.screen?.height||0):t=window.visualViewport?.height||window.innerHeight,document.documentElement.style.setProperty("--app-height",`${t}px`)}$e();window.addEventListener("resize",$e);window.addEventListener("orientationchange",$e);window.addEventListener("pageshow",$e);window.visualViewport?.addEventListener("resize",$e);var Ds={workout:{title:"Workout",render:Es},exercises:{title:"Exercises",render:ts},progress:{title:"Progress",render:Kt}},ke=document.getElementById("view-content"),Wo=document.getElementById("nav-title"),As=document.getElementById("nav-back"),G=document.getElementById("nav-action"),Se="workout",mt=null,Ve=null,Ue=null,ze={container:ke,setTitle(e){Wo.textContent=e},setAction(e){if(!e){G.hidden=!0,G.innerHTML="",G.removeAttribute("aria-label"),Ve=null;return}G.hidden=!1,e.label?G.setAttribute("aria-label",e.label):G.removeAttribute("aria-label"),e.html?G.innerHTML=e.html:G.textContent=e.label??"",Ve=e.onClick},setBack(e){mt=e,As.hidden=!e},refresh(){Me(Se)},toast(e){I(e)}};function Fo(){if(typeof Ue=="function")try{Ue()}catch(e){console.error(e)}Ue=null}function Me(e){Se=e,Bt(e),document.querySelectorAll(".tab").forEach(t=>{t.setAttribute("aria-selected",String(t.dataset.tab===e))}),Fo(),ze.setTitle(Ds[e].title),ze.setAction(null),ze.setBack(null),ke.innerHTML="",ke.scrollTop=0;try{Ue=Ds[e].render(ze)}catch(t){console.error("Render failed",t),ke.innerHTML=`<div class="empty-state"><div class="empty-icon">!</div><h2>Render error</h2><p>${k(t.message)}</p></div>`}}document.querySelectorAll(".tab").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll(".sheet-backdrop").forEach(t=>t.dismissSheet?.()),Me(e.dataset.tab)})});As.addEventListener("click",()=>{mt&&mt()});G.addEventListener("click",()=>{Ve&&Ve()});(function(){let t='button, [role="button"], a[href]',s=null,o=0,n=0,i=()=>{s&&(s.classList.remove("pressed"),s=null)};document.addEventListener("pointerdown",r=>{let a=r.target.closest?.(t);s&&s!==a&&i(),!(!a||a.disabled||a.classList.contains("calc-key"))&&(s=a,o=r.clientX,n=r.clientY,a.classList.add("pressed"))},{passive:!0}),document.addEventListener("pointermove",r=>{s&&(Math.abs(r.clientX-o)>8||Math.abs(r.clientY-n)>8)&&i()},{passive:!0}),document.addEventListener("pointerup",i,{passive:!0}),document.addEventListener("pointercancel",i,{passive:!0}),window.addEventListener("scroll",i,{passive:!0,capture:!0})})();Ge("data:changed",()=>{ie(),Me(Se)});Ge("workout:changed",()=>{ie(),Se==="workout"&&Me(Se)});document.addEventListener("visibilitychange",()=>{document.visibilityState==="visible"&&ie()});async function Ro(){try{await j();let e=await At();e>0&&console.info(`Seeded ${e} exercises.`),await Ht(),Me("workout"),ie()}catch(e){console.error("Init failed:",e),ke.innerHTML=`
      <div class="empty-state">
        <div class="empty-icon">!</div>
        <h2>Storage unavailable</h2>
        <p>${k(e.message??String(e))}</p>
        <p>If you are running this from a <code>file://</code> URL, serve it through a local web server instead.</p>
      </div>`}}Ro();
