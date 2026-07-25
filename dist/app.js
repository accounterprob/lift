var Ws="lift";var xt=["exercises","workouts","sets","stateOfMind","medications","doseEvents"],Te=null;function U(){return Te?Promise.resolve(Te):new Promise((e,t)=>{let s=indexedDB.open(Ws,5);s.onerror=()=>t(s.error),s.onsuccess=()=>{Te=s.result,e(Te)},s.onupgradeneeded=()=>{let o=s.result;if(!o.objectStoreNames.contains("exercises")){let n=o.createObjectStore("exercises",{keyPath:"id"});n.createIndex("name","name",{unique:!1}),n.createIndex("category","category",{unique:!1})}if(o.objectStoreNames.contains("workouts")||o.createObjectStore("workouts",{keyPath:"id"}).createIndex("startedAt","startedAt",{unique:!1}),!o.objectStoreNames.contains("sets")){let n=o.createObjectStore("sets",{keyPath:"id"});n.createIndex("workoutId","workoutId",{unique:!1}),n.createIndex("exerciseId","exerciseId",{unique:!1})}if(o.objectStoreNames.contains("stateOfMind")||o.createObjectStore("stateOfMind",{keyPath:"id"}).createIndex("date","date",{unique:!1}),o.objectStoreNames.contains("medications")||o.createObjectStore("medications",{keyPath:"id"}),!o.objectStoreNames.contains("doseEvents")){let n=o.createObjectStore("doseEvents",{keyPath:"id"});n.createIndex("medicationId","medicationId",{unique:!1}),n.createIndex("date","date",{unique:!1})}o.objectStoreNames.contains("appMeta")||o.createObjectStore("appMeta",{keyPath:"key"})}})}function me(e){return new Promise((t,s)=>{e.onsuccess=()=>t(e.result),e.onerror=()=>s(e.error)})}async function ve(e,t="readonly"){return(await U()).transaction(e,t).objectStore(e)}function se(e,t,s){return new Promise((o,n)=>{let i=e.transaction(t,"readwrite"),r;try{r=s(i)}catch(a){try{i.abort()}catch{}n(a);return}i.oncomplete=()=>o(r),i.onerror=()=>n(i.error),i.onabort=()=>n(i.error)})}async function T(e){return me((await ve(e)).getAll())}async function X(e,t){return me((await ve(e)).get(t))}async function q(e,t){return await me((await ve(e,"readwrite")).put(t)),t}async function ae(e,t){let s=await U();return se(s,e,o=>{let n=o.objectStore(e);for(let i of t)n.put(i)})}async function ce(e,t){return me((await ve(e,"readwrite")).delete(t))}async function Qe(e,t){if(t.length===0)return;let s=await U();return se(s,e,o=>{let n=o.objectStore(e);for(let i of t)n.delete(i)})}async function St(e){let t=await X("appMeta",e);return t?t.value:null}async function Ae(e,t){return await q("appMeta",{key:e,value:t}),t}async function Be(e,t,s){let o=await ve(e);return me(o.index(t).getAll(s))}async function $t(e){let t=await U();return se(t,xt,s=>{for(let o of xt){let n=s.objectStore(o);n.clear();for(let i of e[o]??[])n.put(i)}})}function J(e){let t=new Set;for(let s of e)s.completed&&t.add(s.workoutId);return e.filter(s=>s.completed||!t.has(s.workoutId))}async function le(){return(await T("workouts")).find(t=>!t.endedAt)??null}async function Z(){return(await T("workouts")).filter(t=>t.endedAt).sort((t,s)=>s.startedAt-t.startedAt)}async function Mt(e){return(await Be("sets","workoutId",e)).sort((s,o)=>s.order-o.order)}async function Fs(e){return await Be("sets","exerciseId",e)}async function Lt(e,t=null){let s=await Fs(e),o=new Map;for(let r of s)t&&r.workoutId===t||(o.has(r.workoutId)||o.set(r.workoutId,[]),o.get(r.workoutId).push(r));if(o.size===0)return[];let i=(await Promise.all(Array.from(o.keys()).map(r=>X("workouts",r)))).filter(Boolean).sort((r,a)=>(a.startedAt??0)-(r.startedAt??0));return i.length===0?[]:o.get(i[0].id).sort((r,a)=>r.order-a.order)}function Et(e,t,s=null){let o=new Map(t.map(r=>[r.id,r.startedAt??0])),n=new Map;for(let r of e){if(r.workoutId===s||!o.has(r.workoutId)||(r.weight||0)<=0||(r.reps||0)<=0)continue;let a=n.get(r.exerciseId);a||n.set(r.exerciseId,a=new Map);let d=a.get(r.workoutId);d||a.set(r.workoutId,d=[]),d.push(r)}let i=new Map;for(let[r,a]of n){let d=[...a.keys()].sort((p,f)=>o.get(f)-o.get(p)),c=new Map;for(let p of d){let f=a.get(p).sort((L,y)=>L.order-y.order),l=f.every(L=>L.setType==null),v=0,b=0;f.forEach((L,y)=>{if(l){let $=`any#${y+1}`;c.has($)||c.set($,L);return}let h=L.setType||"working",M=h==="warmup"?b+=1:v+=1,S=`${h}#${M}`;c.has(S)||c.set(S,L)})}i.set(r,c)}return i}var Rs={barbell:"Barbell",dumbbell:"Dumbbell",machine:"Machine",cable:"Cable",bodyweight:"Bodyweight",kettlebell:"Kettlebell",band:"Bands",bands:"Bands"},Ns=/\s*\((barbell|dumbbell|machine|cable|bodyweight|kettlebell|bands?)\)$|\s+(Machine|Barbell|Dumbbell|Cable|Kettlebell)$/i;async function js(e,t){let s=await U(),o=await Be("sets","exerciseId",e);return se(s,["sets","exercises"],n=>{let i=n.objectStore("sets");for(let r of o)i.put({...r,exerciseId:t});return n.objectStore("exercises").delete(e),o.length})}async function Dt(){let e=await T("exercises"),t=e.filter(i=>/butterfly/i.test(i.name||""));if(t.length===0)return 0;let s=e.filter(i=>/chest fly/i.test(i.name||"")&&!t.some(r=>r.id===i.id)),o=s.find(i=>(i.equipment||"")==="Machine")||s[0],n=0;for(let i of t)o?n+=await js(i.id,o.id):await q("exercises",{...i,name:"Chest Fly",equipment:"Machine"});return n}async function Tt(){let e=await T("exercises"),t=[];for(let s of e){let o=(s.name||"").match(Ns);if(!o)continue;let n=s.name.slice(0,o.index).trim();if(!n||/smith$/i.test(n))continue;let i=(o[1]||o[2]).toLowerCase();t.push({...s,name:n,equipment:Rs[i]||s.equipment})}return t.length>0&&await ae("exercises",t),t.length}async function At(){let[e,t,s]=await Promise.all([T("exercises"),T("sets"),T("workouts")]),o=new Set(e.filter(c=>c.category==="Cardio").map(c=>c.id));if(o.size===0)return{exercises:0,sets:0,workouts:0};let n=t.filter(c=>o.has(c.exerciseId)),i=new Map;for(let c of t)o.has(c.exerciseId)||i.set(c.workoutId,(i.get(c.workoutId)||0)+1);let r=new Set(n.map(c=>c.workoutId)),a=s.filter(c=>r.has(c.id)&&!i.get(c.id)),d=await U();return await se(d,["exercises","sets","workouts"],c=>{let p=c.objectStore("exercises"),f=c.objectStore("sets"),l=c.objectStore("workouts");for(let v of o)p.delete(v);for(let v of n)f.delete(v.id);for(let v of a)l.delete(v.id)}),{exercises:o.size,sets:n.length,workouts:a.length}}async function Bt(e){let[t,s,o]=await Promise.all([T("exercises"),T("sets"),T("workouts")]),n=t.filter(l=>l.category==="Other");if(n.length===0)return{recategorized:0,deleted:0,workouts:0};let i=[],r=new Set;for(let l of n){let v=e(l.name);v==="Cardio"?r.add(l.id):i.push({...l,category:v&&v!=="Other"?v:"Full Body"})}let a=s.filter(l=>r.has(l.exerciseId)),d=new Map;for(let l of s)r.has(l.exerciseId)||d.set(l.workoutId,(d.get(l.workoutId)||0)+1);let c=new Set(a.map(l=>l.workoutId)),p=o.filter(l=>c.has(l.id)&&!d.get(l.id)),f=await U();return await se(f,["exercises","sets","workouts"],l=>{let v=l.objectStore("exercises"),b=l.objectStore("sets"),L=l.objectStore("workouts");for(let y of i)v.put(y);for(let y of r)v.delete(y);for(let y of a)b.delete(y.id);for(let y of p)L.delete(y.id)}),{recategorized:i.length,deleted:r.size,workouts:p.length}}async function Ct(){let e=await T("medications"),t=[];for(let s of e){if(s.doseAmount!=null)continue;let o=s.nickname||s.concept?.displayText||"";if(!/creatine/i.test(o))continue;let n=(s.concept?.form||"").replace(/\s*\(4\s*[×x]\s*\/?\s*day\)\s*/i,"").trim();t.push({...s,doseAmount:4,doseUnit:"capsule",concept:{...s.concept,form:n}})}return t.length>0&&await ae("medications",t),t.length}async function Ce(e){let t=await U(),s=await Be("sets","workoutId",e);return se(t,["workouts","sets"],o=>{o.objectStore("workouts").delete(e);let n=o.objectStore("sets");for(let i of s)n.delete(i.id)})}var j=()=>crypto&&crypto.randomUUID?crypto.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,e=>{let t=Math.random()*16|0;return(e==="x"?t:t&3|8).toString(16)});function he(e){return e==null?"0":Math.abs(e-Math.round(e))<.001?String(Math.round(e)):e.toFixed(1)}function ye(e){return`${he(e)} lbs`}function It(e){let t=Math.max(0,Math.floor(e)),s=Math.floor(t/3600),o=Math.floor(t%3600/60),n=t%60;return s>0?`${s}:${String(o).padStart(2,"0")}:${String(n).padStart(2,"0")}`:`${o}:${String(n).padStart(2,"0")}`}function Je(e){let t=Math.max(0,Math.floor(e)),s=Math.floor(t/3600),o=Math.floor(t%3600/60);return s>0?`${s}h ${o}m`:`${o}m`}function K(e){return Math.round(e).toLocaleString()}function de(e){return`${K(e)} lbs`}function N(e){return(e instanceof Date?e:new Date(e)).toLocaleDateString(void 0,{month:"numeric",day:"numeric",year:"2-digit"})}function qt(e){return(e instanceof Date?e:new Date(e)).toLocaleDateString(void 0,{weekday:"short",month:"short",day:"numeric",year:"numeric"})}function Ze(e,t=200){let s=null;return(...o)=>{clearTimeout(s),s=setTimeout(()=>e(...o),t)}}function x(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function I(e,t=1800,s={}){let o=document.querySelector(".toast");o&&o.remove();let n=document.createElement("div");n.className="toast",n.textContent=e,s.persistUntilClick?(n.classList.add("toast-clickable"),n.addEventListener("click",()=>n.remove())):setTimeout(()=>n.remove(),t),document.body.appendChild(n)}var Xe=new EventTarget;function W(e,t){Xe.dispatchEvent(new CustomEvent(e,{detail:t}))}function et(e,t){return Xe.addEventListener(e,t),()=>Xe.removeEventListener(e,t)}function H({html:e,onMount:t}){let s=document.createElement("div");s.className="sheet-backdrop",s.innerHTML='<div class="sheet"></div>';let o=s.querySelector(".sheet");o.innerHTML=e;let n=zs();document.body.appendChild(s);function i(){let d=window.visualViewport;if(!d){o.style.maxHeight=`${window.innerHeight-n-10}px`;return}let c=Math.max(window.innerHeight,document.documentElement.clientHeight),p=Math.max(0,c-d.height-d.offsetTop);p>0?(o.style.paddingBottom=`${p}px`,o.style.maxHeight=`${d.height-n-10+p}px`):(o.style.paddingBottom="",o.style.maxHeight=`${d.height-n-10}px`)}i();let r=window.visualViewport;r?.addEventListener("resize",i),r?.addEventListener("scroll",i);function a(){s.remove(),r?.removeEventListener("resize",i),r?.removeEventListener("scroll",i)}return s.dismissSheet=a,s.addEventListener("click",d=>{d.target===s&&a()}),t?.(o,a),a}function zs(){let e=document.createElement("div");e.style.cssText="position:fixed;top:0;left:0;width:0;height:env(safe-area-inset-top);",document.body.appendChild(e);let t=e.offsetHeight||0;return e.remove(),t}function Ie(){return'<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" style="color: var(--red);"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>'}function Pt(){return'<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M16 5l-1.42 1.42-1.59-1.59V16h-2V4.83L9.41 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z"/></svg>'}function ee(e){return`<div class="empty-state"><div class="empty-icon">!</div><h2>Couldn't load</h2><p>${x(e.message||String(e))}</p></div>`}var ge=["Pectorals","Anterior Deltoid","Lateral Deltoid","Posterior Deltoid","Triceps","Biceps","Forearms","Lats","Upper Back","Lower Back","Traps","Quadriceps","Hamstrings","Glutes","Adductors","Abductors","Calves","Abs","Obliques"];function Us(e){let t=new Map(ge.map((s,o)=>[s,o]));return[...e].sort((s,o)=>(t.get(s)??999)-(t.get(o)??999)||s.localeCompare(o))}var qe=["Barbell","Dumbbell","Machine","Cable","Bodyweight","Other"];function G(e){let t=e?.equipment,s=e?.name??"";return t&&t!=="Other"?`${s} (${t})`:s}function oe(e){let t=e?[e.equipment,F(e)].filter(Boolean).join(" \xB7 "):"";return`
    <div class="row-main">
      <div class="row-title">${x(e?.name??"Unknown exercise")}</div>
      ${t?`<div class="row-subtitle">${x(t)}</div>`:""}
    </div>
  `}function ne(e){return e?`<div class="exercise-count">${e} ${e===1?"set":"sets"}</div>`:""}function Pe(e,t){return["All",...Us(new Set(e.map(o=>F(o))))].map(o=>`<button class="chip${o==="All"&&!t||o===t?" active":""}" data-cat="${x(o)}">${x(o)}</button>`).join("")}var Vs=[["Bench Press (Barbell)","Chest","Barbell"],["Bench Press (Dumbbell)","Chest","Dumbbell"],["Incline Bench Press (Barbell)","Chest","Barbell"],["Incline Bench Press (Dumbbell)","Chest","Dumbbell"],["Decline Bench Press (Barbell)","Chest","Barbell"],["Chest Fly (Dumbbell)","Chest","Dumbbell"],["Chest Fly (Machine)","Chest","Machine"],["Cable Crossover","Chest","Cable"],["Push-Up","Chest","Bodyweight"],["Dip (Chest)","Chest","Bodyweight"],["Deadlift (Conventional)","Back","Barbell"],["Deadlift (Sumo)","Back","Barbell"],["Romanian Deadlift","Back","Barbell"],["Bent-Over Row (Barbell)","Back","Barbell"],["Pendlay Row","Back","Barbell"],["Row (Dumbbell)","Back","Dumbbell"],["T-Bar Row","Back","Barbell"],["Seated Cable Row","Back","Cable"],["Lat Pulldown","Back","Cable"],["Pull-Up","Back","Bodyweight"],["Chin-Up","Back","Bodyweight"],["Face Pull","Back","Cable"],["Shrug (Barbell)","Back","Barbell"],["Shrug (Dumbbell)","Back","Dumbbell"],["Overhead Press (Barbell)","Shoulders","Barbell"],["Overhead Press (Dumbbell)","Shoulders","Dumbbell"],["Seated Shoulder Press (Machine)","Shoulders","Machine"],["Arnold Press","Shoulders","Dumbbell"],["Lateral Raise (Dumbbell)","Shoulders","Dumbbell"],["Lateral Raise (Cable)","Shoulders","Cable"],["Front Raise (Dumbbell)","Shoulders","Dumbbell"],["Rear Delt Fly (Dumbbell)","Shoulders","Dumbbell"],["Reverse Pec Deck","Shoulders","Machine"],["Upright Row","Shoulders","Barbell"],["Barbell Curl","Biceps","Barbell"],["Dumbbell Curl","Biceps","Dumbbell"],["Hammer Curl","Biceps","Dumbbell"],["Preacher Curl","Biceps","Barbell"],["Incline Dumbbell Curl","Biceps","Dumbbell"],["Cable Curl","Biceps","Cable"],["Concentration Curl","Biceps","Dumbbell"],["Close-Grip Bench Press","Triceps","Barbell"],["Tricep Pushdown (Cable)","Triceps","Cable"],["Overhead Tricep Extension (Dumbbell)","Triceps","Dumbbell"],["Overhead Tricep Extension (Cable)","Triceps","Cable"],["Skull Crusher","Triceps","Barbell"],["Dip (Tricep)","Triceps","Bodyweight"],["Tricep Kickback","Triceps","Dumbbell"],["Back Squat","Legs","Barbell"],["Front Squat","Legs","Barbell"],["Goblet Squat","Legs","Dumbbell"],["Bulgarian Split Squat","Legs","Dumbbell"],["Lunge","Legs","Dumbbell"],["Leg Press","Legs","Machine"],["Leg Extension","Legs","Machine"],["Leg Curl (Seated)","Legs","Machine"],["Leg Curl (Lying)","Legs","Machine"],["Hip Thrust (Barbell)","Glutes","Barbell"],["Glute Bridge","Glutes","Bodyweight"],["Cable Kickback","Glutes","Cable"],["Hip Abduction (Machine)","Glutes","Machine"],["Standing Calf Raise","Calves","Machine"],["Seated Calf Raise","Calves","Machine"],["Plank","Core","Bodyweight"],["Hanging Leg Raise","Core","Bodyweight"],["Cable Crunch","Core","Cable"],["Russian Twist","Core","Bodyweight"],["Ab Wheel Rollout","Core","Other"],["Wrist Curl","Forearms","Dumbbell"],["Reverse Wrist Curl","Forearms","Dumbbell"],["Farmer's Carry","Forearms","Dumbbell"]];function F(e){if(e?.muscle)return e.muscle;let t=(e?.name||"").toLowerCase();return t?/romanian deadlift|\brdl\b|stiff.?leg|good morning|nordic|hamstring/.test(t)||/leg curl/.test(t)?"Hamstrings":/leg extension|sissy squat/.test(t)?"Quadriceps":/calf|tib raise|tibialis/.test(t)?"Calves":/hip adduction|adductor|inner thigh|copenhagen/.test(t)?"Adductors":/hip abduction|abductor|outer thigh|clamshell/.test(t)?"Abductors":/hip thrust|glute|cable kickback|donkey kick|rear kick|frog pump/.test(t)?"Glutes":/squat|leg press|lunge|step.?up/.test(t)?"Quadriceps":/back extension|hyperextension|superman/.test(t)||/deadlift|rack pull/.test(t)?"Lower Back":/lateral raise|side raise|side delt|\blat raise\b|upright row/.test(t)?"Lateral Deltoid":/rear delt|reverse fly|reverse flye|face pull|reverse pec deck/.test(t)?"Posterior Deltoid":/front raise|shoulder press|overhead press|arnold|military press|landmine press|push press|viking press/.test(t)?"Anterior Deltoid":/pulldown|pull.?down|pull.?up|chin.?up|pullover|straight.?arm/.test(t)?"Lats":/shrug/.test(t)?"Traps":/tricep|pushdown|skull ?crusher|close.?grip bench|jm press|french press|bench dip/.test(t)?"Triceps":/wrist curl|reverse curl|forearm|farmer|gripper|dead hang/.test(t)?"Forearms":/bicep|\bcurl\b/.test(t)?"Biceps":/\brow\b|rear pull|high pull/.test(t)?"Upper Back":/bench|chest|\bpec\b|pec deck|crossover|butterfly|push.?up|floor press|squeeze press|\bfly\b|\bflye\b/.test(t)?"Pectorals":/russian twist|woodchop|wood chop|side plank|side bend|oblique|pallof|rotation/.test(t)?"Obliques":/crunch|sit.?up|plank|leg raise|knee raise|ab wheel|ab roll|hanging|toes.?to.?bar|v.?up|dead bug|mountain climber/.test(t)?"Abs":/\bdip\b/.test(t)?"Triceps":e.category||"Other":e?.category||"Other"}var Ys=/\b(bike|biking|treadmill|run|running|cardio|step.?mill|elliptical|stair.?master|stair.?climber|jog|jogging|cycling|spinning|spin class|rowing machine|row machine|\berg\b|sprints?|jump.?rope|skipping rope|swim|swimming|hike|hiking)\b/,_s={Quadriceps:"Legs",Hamstrings:"Legs",Adductors:"Legs",Abductors:"Legs",Glutes:"Glutes",Calves:"Calves",Pectorals:"Chest","Anterior Deltoid":"Shoulders","Lateral Deltoid":"Shoulders","Posterior Deltoid":"Shoulders",Lats:"Back","Upper Back":"Back",Traps:"Back","Lower Back":"Back",Biceps:"Biceps",Triceps:"Triceps",Forearms:"Forearms",Abs:"Core",Obliques:"Core"};function Ot(e){let t=(e||"").toLowerCase().trim();if(!t)return"Full Body";if(Ys.test(t))return"Cardio";let s=F({name:t,category:""});return _s[s]||"Full Body"}async function Ht(){if((await T("exercises")).length>0)return 0;let t=Date.now(),s=Vs.map(([o,n,i])=>({id:j(),name:o,category:n,equipment:i,notes:"",isCustom:!1,createdAt:t}));return await ae("exercises",s),s.length}var Wt="workout";function Ft(e){Wt!==e&&(Wt=e,W("tab:changed",e))}var z=["Chest Day","Leg Day","Back/Bi Day"],Oe={"Chest Day":{key:"chest",short:"Chest",cssVar:"--day-chest"},"Leg Day":{key:"leg",short:"Legs",cssVar:"--day-leg"},"Back/Bi Day":{key:"back",short:"Back/Bi",cssVar:"--day-back"}};function He(e){let t=Oe[e];return t?`var(${t.cssVar})`:"var(--text-tertiary)"}function tt(e){if(!e)return null;let t=e.toLowerCase();return t.includes("chest")?"Chest Day":t.includes("leg")&&!t.includes("curl")&&!t.includes("extension")?"Leg Day":t.includes("back")||t.includes("pull")?"Back/Bi Day":t.includes("push")?"Chest Day":null}function st(e){for(let t of e){let s=tt(t.name);if(s)return{name:t.name,normalized:s,startedAt:t.startedAt}}return null}function We(e){let t=z.indexOf(e);return t===-1?z[0]:z[(t+1)%z.length]}var Ks={Pectorals:"#ec4899",Triceps:"#be185d","Anterior Deltoid":"#831843","Lateral Deltoid":"#f9a8d4",Quadriceps:"#facc15",Hamstrings:"#b45309",Glutes:"#f59e0b",Calves:"#fde68a",Adductors:"#bdb76b",Abductors:"#78350f",Lats:"#2563eb","Upper Back":"#38bdf8",Biceps:"#1e40af","Posterior Deltoid":"#bfdbfe",Traps:"#0891b2","Lower Back":"#475569",Forearms:"#22c55e",Abs:"#ef4444",Obliques:"#14b8a6",Other:"#6b7280"};function Rt(e){return Ks[e]??"#6b7280"}var Gs={Pectorals:"Chest Day",Triceps:"Chest Day","Anterior Deltoid":"Chest Day","Lateral Deltoid":"Chest Day",Quadriceps:"Leg Day",Hamstrings:"Leg Day",Glutes:"Leg Day",Calves:"Leg Day",Adductors:"Leg Day",Abductors:"Leg Day",Lats:"Back/Bi Day","Upper Back":"Back/Bi Day",Biceps:"Back/Bi Day","Posterior Deltoid":"Back/Bi Day",Traps:"Back/Bi Day","Lower Back":"Back/Bi Day",Forearms:"Back/Bi Day"};function Qs(e){return Gs[e]??null}function Xs(e,t,s){let o=tt(e);if(o)return o;let n=new Map;for(let a of t){let d=s.get(a.exerciseId);if(!d)continue;let c=Qs(F(d));if(!c)continue;let p=(a.weight||0)*(a.reps||0);p<=0||n.set(c,(n.get(c)??0)+p)}let i=null,r=0;for(let[a,d]of n)d>r&&(i=a,r=d);return i}function Nt(e,t,s){let o=[...e].sort((r,a)=>r.startedAt-a.startedAt),n=new Map,i=null;for(let r of o){let a=Xs(r.name,t.get(r.id)??[],s);a||(i?zt(i.startedAt,r.startedAt)?a=i.day:a=We(i.day):a=z[0]),n.set(r.id,a),i={day:a,startedAt:r.startedAt}}return n}function jt(e){let t=parseInt(e.slice(1),16);return((t>>16&255)*299+(t>>8&255)*587+(t&255)*114)/1e3>=150?"#1c1c1e":"#ffffff"}function zt(e,t){let s=new Date(e),o=new Date(t);return s.getFullYear()===o.getFullYear()&&s.getMonth()===o.getMonth()&&s.getDate()===o.getDate()}function Js(e,t){let s=tt(t?.name);if(s)return s;let o=st(e);return o?zt(o.startedAt,Date.now())?o.normalized:We(o.normalized):z[0]}var Zs="lift-today-day";async function ie(){try{let[e,t]=await Promise.all([Z(),le()]),s=Js(e,t),o=Oe[s].key;document.documentElement.dataset.day!==o&&(document.documentElement.dataset.day=o);try{localStorage.setItem(Zs,o)}catch{}return s}catch{return null}}var Ut="lift-migrations-done-v2";async function ot(){let e=await At();e.exercises>0&&console.info(`Removed ${e.exercises} cardio exercise(s), ${e.sets} set(s), ${e.workouts} cardio-only workout(s).`);let t=await Bt(Ot);if(t.recategorized>0||t.deleted>0){console.info(`Reorganized "Other": recategorized ${t.recategorized}, removed ${t.deleted} cardio, dropped ${t.workouts} empty workout(s).`);let i=[];t.recategorized>0&&i.push(`sorted ${t.recategorized} exercise${t.recategorized===1?"":"s"}`),t.deleted>0&&i.push(`removed ${t.deleted} cardio`),I(`Cleaned up \u201COther\u201D: ${i.join(", ")}.`)}let s=await Tt();s>0&&console.info(`Stripped equipment from ${s} exercise name(s).`);let o=await Dt();o>0&&I(`Merged Butterfly into Chest Fly (${o} sets moved).`);let n=await Ct();n>0&&console.info(`Set a per-dose amount on ${n} medication(s).`)}async function Vt(){try{if(localStorage.getItem(Ut))return}catch{}await ot();try{localStorage.setItem(Ut,String(Date.now()))}catch{}}var ue="lift-backup-passphrase",_t=25e4,Yt="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";function nt(e){let t=new Uint8Array(e),s="",o=32768;for(let n=0;n<t.length;n+=o)s+=String.fromCharCode.apply(null,t.subarray(n,n+o));return btoa(s)}var it=e=>Uint8Array.from(atob(e),t=>t.charCodeAt(0));function Kt(){let t=[...crypto.getRandomValues(new Uint8Array(20))].map(s=>Yt[s%Yt.length]);return[0,5,10,15].map(s=>t.slice(s,s+5).join("")).join("-")}var R=null,rt=()=>{try{return localStorage.getItem(ue)}catch{return null}},at=e=>{try{localStorage.setItem(ue,e)}catch{}};async function Gt(){if(R)return R;let e=rt(),t=null;try{t=await St(ue)}catch{}if(R=e||t||Kt(),R!==e&&at(R),R!==t)try{await Ae(ue,R)}catch{}return R}function ct(){if(R)return R;let e=rt();return e||(e=Kt(),at(e)),R=e,Ae(ue,e).catch(()=>{}),e}function Qt(){return R||rt()}function Xt(e){R=e,at(e),Ae(ue,e).catch(()=>{})}async function Jt(e,t){let s=await crypto.subtle.importKey("raw",new TextEncoder().encode(e),"PBKDF2",!1,["deriveKey"]);return crypto.subtle.deriveKey({name:"PBKDF2",hash:"SHA-256",salt:t,iterations:_t},s,{name:"AES-GCM",length:256},!1,["encrypt","decrypt"])}function Zt(e){return!!e&&e.lift==="encrypted-backup"&&typeof e.data=="string"}async function es(e,t){let s=crypto.getRandomValues(new Uint8Array(16)),o=crypto.getRandomValues(new Uint8Array(12)),n=await Jt(t,s),i=new TextEncoder().encode(JSON.stringify(e)),r=await crypto.subtle.encrypt({name:"AES-GCM",iv:o},n,i);return{lift:"encrypted-backup",v:1,exportedAt:new Date().toISOString(),kdf:{name:"PBKDF2",hash:"SHA-256",iterations:_t,salt:nt(s)},cipher:"AES-GCM",iv:nt(o),data:nt(r)}}async function lt(e,t){let s=it(e.kdf.salt),o=it(e.iv),n=await Jt(t,s),i;try{i=await crypto.subtle.decrypt({name:"AES-GCM",iv:o},n,it(e.data))}catch{throw new Error("Wrong backup password (or the file is damaged).")}return JSON.parse(new TextDecoder().decode(i))}async function eo(){let[e,t,s,o,n,i]=await Promise.all([T("exercises"),T("workouts"),T("sets"),T("stateOfMind"),T("medications"),T("doseEvents")]);return{version:2,exportedAt:new Date().toISOString(),exercises:e,workouts:t,sets:s,stateOfMind:o,medications:n,doseEvents:i}}function to(){let e=new Date,t=s=>String(s).padStart(2,"0");return`lift-backup-${e.getFullYear()}${t(e.getMonth()+1)}${t(e.getDate())}-${t(e.getHours())}${t(e.getMinutes())}${t(e.getSeconds())}.json`}async function dt(){let e=await eo(),t=ct(),s=await es(e,t),o=JSON.stringify(s),n=new Blob([o],{type:"application/json"}),i=URL.createObjectURL(n),r=to(),a=document.createElement("a");return a.href=i,a.download=r,a.style.display="none",document.body.appendChild(a),a.click(),setTimeout(()=>{document.body.removeChild(a),URL.revokeObjectURL(i)},1e3),{filename:r,bytes:n.size,snapshot:e}}async function so(e){let t=Qt();if(t)try{return await lt(e,t)}catch{}for(let s=0;s<3;s++){let o=prompt("Enter your backup password (saved in your Passwords app):");if(o==null)throw new Error("Restore cancelled.");try{let n=await lt(e,o.trim());return Xt(o.trim()),n}catch(n){if(s===2)throw n;alert("Wrong password \u2014 try again.")}}}async function oo(e){let t=JSON.parse(await e.text()),s=Zt(t)?await so(t):t;if(!s||!Array.isArray(s.exercises)||!Array.isArray(s.workouts)||!Array.isArray(s.sets))throw new Error("File doesn't look like a Lift backup.");return await $t({exercises:s.exercises,workouts:s.workouts,sets:s.sets,stateOfMind:s.stateOfMind??[],medications:s.medications??[],doseEvents:s.doseEvents??[]}),await ot(),{exercises:s.exercises.length,workouts:s.workouts.length,sets:s.sets.length,stateOfMind:(s.stateOfMind??[]).length}}function ts(){let e=ct();H({html:`
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
            <div class="stat-value" id="bk-pass" style="font-variant-numeric: tabular-nums; letter-spacing: 0.5px; color: var(--text); -webkit-user-select: all; user-select: all;">${x(e)}</div>
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
    `,onMount(t,s){t.querySelector("#bk-close").addEventListener("click",()=>s()),t.querySelector("#bk-copy").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(e),I("Password copied \u2014 save it in your Passwords app")}catch{I("Copy failed \u2014 long-press the password to select it")}}),t.querySelector("#bk-export").addEventListener("click",async()=>{try{let{filename:n,bytes:i}=await dt();I(`Exported ${n} (${no(i)})`)}catch(n){I(`Export failed: ${n.message}`)}});let o=t.querySelector("#bk-file");t.querySelector("#bk-import").addEventListener("click",()=>{o.value="",o.click()}),o.addEventListener("change",async n=>{let i=n.target.files?.[0];if(i&&confirm("Replace all current data with this backup? This cannot be undone."))try{let r=await oo(i);s(),I(`Restored ${r.workouts} workouts, ${r.exercises} exercises`),W("data:changed")}catch(r){I(`Restore failed: ${r.message}`)}})}})}function no(e){return e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/(1024*1024)).toFixed(1)} MB`}var Fe=[{key:"1W",tick:"1W",days:7},{key:"1M",tick:"1M",days:30},{key:"3M",tick:"3M",days:90},{key:"1Y",tick:"1Y",days:365},{key:"All",tick:"All",all:!0}];function io(e){let t=new Map;for(let s of e){let o=new Date(s.date),n=`${o.getFullYear()}-${o.getMonth()}-${o.getDate()}`,i=t.get(n)||{date:s.date,total:0,count:0};i.total+=s.value,i.count+=1,i.date=Math.min(i.date,s.date),t.set(n,i)}return[...t.values()].map(s=>({date:s.date,value:s.total/s.count})).sort((s,o)=>s.date-o.date)}function we(e,t,s={}){let o=t.length>0&&t[0].points!==void 0,n=(o?t:[{points:t}]).map(m=>({label:m.label??"",color:m.color||"var(--accent)",points:io(m.points)})).filter(m=>m.points.length>0),i=s.defaultPeriod||"All",r=Math.max(0,Fe.findIndex(m=>m.key===i)),a=Fe.length-1,d=null;function c(){let m=Fe[r],u=n.map((k,D)=>d===null||D===d?k.points:[]);if(m.all)return u;let g=Date.now()-m.days*864e5,w=u.map(k=>k.filter(D=>D.date>=g));return w.every(k=>k.length===0)?u.map(k=>k.slice(-1)):w}let p=o&&n.some(m=>m.label)?`<div class="chart-legend">${n.map((m,u)=>`<button class="legend-item" data-i="${u}" style="--dcolor: ${m.color};" aria-pressed="false">${m.label}</button>`).join("")}</div>`:"";e.innerHTML=`
    <div class="chart-scrub-readout" data-role="scrub"></div>
    ${p}
    <div class="chart-container" data-role="chart"></div>
    <div class="chart-daterange" data-role="range"></div>
    <div class="chart-slider">
      <input type="range" class="chart-range" min="0" max="${a}" step="1"
             value="${r}" aria-label="Time range" />
      <div class="chart-slider-ticks">
        ${Fe.map((m,u)=>`<span data-i="${u}">${m.tick}</span>`).join("")}
      </div>
    </div>
  `;let f=e.querySelector('[data-role="scrub"]'),l=e.querySelector('[data-role="chart"]'),v=e.querySelector('[data-role="range"]'),b=e.querySelector(".chart-range"),L=[...e.querySelectorAll(".chart-slider-ticks span")],y=s.unit||"lbs",h=null;function M(){let m=c(),u=ro(m,n,y);l.innerHTML=u.html,h=u.geom;let g=m.flat();if(g.length>=2){let w=Math.min(...g.map(D=>D.date)),k=Math.max(...g.map(D=>D.date));v.innerHTML=`<span>${ut(w)}</span><span>${ut(k)}</span>`}else v.innerHTML="";L.forEach((w,k)=>w.classList.toggle("active",k===r))}b.addEventListener("input",()=>{r=Number(b.value),A(),M()});let S=[...e.querySelectorAll(".chart-legend .legend-item")];for(let m of S)m.addEventListener("click",()=>{let u=Number(m.dataset.i);d=d===u?null:u,S.forEach((g,w)=>{g.classList.toggle("dimmed",d!==null&&w!==d),g.setAttribute("aria-pressed",String(d===w))}),A(),M()});function $(m){if(!h||h.pts.length<2)return;let u=l.querySelector("svg"),g=u?.getScreenCTM();if(!g)return;let w=new DOMPoint(m,0).matrixTransform(g.inverse()).x,k=0,D=1/0;h.pts.forEach((O,Y)=>{let _=Math.abs(O.x-w);_<D&&(D=_,k=Y)});let E=h.pts[k],C=u.querySelector(".chart-scrub-line"),P=u.querySelector(".chart-scrub-dot");C&&(C.setAttribute("x1",E.x),C.setAttribute("x2",E.x),C.removeAttribute("visibility")),P&&(P.setAttribute("cx",E.x),P.setAttribute("cy",E.y),P.style.fill=E.color,P.removeAttribute("visibility"));let V=E.label?` \xB7 ${E.label}`:"";f.textContent=`${ut(E.date)}${V} \xB7 ${Math.round(E.value).toLocaleString()} ${y}`}function A(){f.textContent="";let m=l.querySelector("svg");m?.querySelector(".chart-scrub-line")?.setAttribute("visibility","hidden"),m?.querySelector(".chart-scrub-dot")?.setAttribute("visibility","hidden")}let B=!1;l.addEventListener("pointerdown",m=>{B=!0,l.setPointerCapture?.(m.pointerId),$(m.clientX)}),l.addEventListener("pointermove",m=>{B&&$(m.clientX)});for(let m of["pointerup","pointercancel"])l.addEventListener(m,()=>{B=!1,A()});M()}function ut(e){return new Date(e).toLocaleDateString(void 0,{month:"short",day:"numeric",year:"numeric"})}function ro(e,t,s){let i={top:16,right:14,bottom:14,left:52},r=400-i.left-i.right,a=200-i.top-i.bottom,d=e.flat();if(d.length===0)return{html:`<svg viewBox="0 0 400 200"><text x="${400/2}" y="${200/2}" text-anchor="middle" class="chart-axis-label">No data in range</text></svg>`,geom:null};if(d.length===1){let k=d[0],D=t[e.findIndex(P=>P.length>0)]?.color||"var(--accent)",E=i.left+r/2,C=i.top+a/2;return{html:`<svg viewBox="0 0 400 200"><circle cx="${E}" cy="${C}" r="4" class="chart-point" style="fill: ${D};"/><text x="${E}" y="${C-10}" text-anchor="middle" class="chart-axis-label">${Math.round(k.value).toLocaleString()} ${s}</text></svg>`,geom:null}}let c=d.map(k=>k.date),p=d.map(k=>k.value),f=Math.min(...c),l=Math.max(...c),v=Math.max(...p),b=Math.min(...p),L=Math.max(v-b,1),y=Math.max(0,b-L*.12),h=v+L*.12,M=k=>i.left+(k-f)/Math.max(l-f,1)*r,S=k=>i.top+a-(k-y)/(h-y)*a,$=4,A=k=>Math.round(k).toLocaleString(),B=Array.from({length:$+1},(k,D)=>{let E=y+(h-y)*D/$,C=S(E);return`<text x="${i.left-6}" y="${C+3}" text-anchor="end" class="chart-axis-label">${A(E)}</text>`}).join(""),m=Array.from({length:$+1},(k,D)=>{let E=i.top+a*D/$;return`<line x1="${i.left}" x2="${400-i.right}" y1="${E}" y2="${E}" class="chart-axis-line"/>`}).join(""),u=[],g=e.map((k,D)=>{let E=t[D],C=k.map(P=>({x:M(P.date),y:S(P.value)}));return k.forEach((P,V)=>u.push({...C[V],date:P.date,value:P.value,label:E.label,color:E.color})),C.length===0?"":C.length===1?`<circle cx="${C[0].x}" cy="${C[0].y}" r="3.5" class="chart-point" style="fill: ${E.color};"/>`:`<path d="${ao(C)}" class="chart-line" style="stroke: ${E.color};"/>`}).join("");return{html:`
    <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet">
      ${m}
      ${B}
      ${g}
      <line class="chart-scrub-line" y1="${i.top}" y2="${i.top+a}" x1="0" x2="0" visibility="hidden"/>
      <circle class="chart-scrub-dot" r="4.5" visibility="hidden"/>
    </svg>
  `,geom:{pts:u}}}function ao(e){if(e.length<2)return"";let t=`M ${e[0].x.toFixed(1)} ${e[0].y.toFixed(1)}`;for(let s=0;s<e.length-1;s++){let o=e[s===0?0:s-1],n=e[s],i=e[s+1],r=e[s+2]||i,a=n.x+(i.x-o.x)/6,d=n.y+(i.y-o.y)/6,c=i.x-(r.x-n.x)/6,p=i.y-(r.y-n.y)/6;t+=` C ${a.toFixed(1)} ${d.toFixed(1)}, ${c.toFixed(1)} ${p.toFixed(1)}, ${i.x.toFixed(1)} ${i.y.toFixed(1)}`}return t}var te=null;function ss(e){let t=!0;return os().then(s=>{t&&(te=s,Re(e))}).catch(s=>{t&&(e.container.innerHTML=ee(s))}),()=>{t=!1}}async function os(){let[e,t,s]=await Promise.all([Z(),T("sets"),T("exercises")]),o=new Map(s.map(b=>[b.id,b])),n=new Map;for(let b of J(t))n.has(b.workoutId)||n.set(b.workoutId,[]),n.get(b.workoutId).push(b);let i=0,r=0,a=new Map,d=new Map,c=new Map,p=Nt(e,n,o);for(let b of e){let L=n.get(b.id)||[],y=L.reduce((h,M)=>h+M.weight*M.reps,0);if(i+=y,r+=L.length,y>0){let h=p.get(b.id);a.has(h)||a.set(h,[]),a.get(h).push({date:b.startedAt,value:y})}for(let h of L){let M=o.get(h.exerciseId);if(!M)continue;let S=d.get(h.exerciseId)||{id:h.exerciseId,exercise:M,count:0};if(S.count+=1,d.set(h.exerciseId,S),h.weight>0&&h.reps>0){let $=c.get(h.exerciseId);(!$||h.weight>$.weight||h.weight===$.weight&&h.reps>$.reps)&&c.set(h.exerciseId,{id:h.exerciseId,weight:h.weight,reps:h.reps,date:b.startedAt,name:G(M)})}}}let f=Array.from(d.entries()).sort((b,L)=>L[1].count-b[1].count).map(([,b])=>b),l=Array.from(c.values()).sort((b,L)=>L.weight-b.weight),v=z.filter(b=>a.has(b)).map(b=>({label:Oe[b].short,color:He(b),points:a.get(b)}));return{workouts:e,allSets:t,allExercises:s,exMap:o,setsByWorkout:n,totalVolume:i,totalSets:r,volumeSeries:v,topExercises:f,prs:l}}function Re(e){if(e.setTitle("Progress"),e.setBack(null),e.setAction({label:"Backup and restore",html:Pt(),onClick:()=>ts()}),e.container.scrollTop=0,!te||te.workouts.length===0){e.container.innerHTML=`
      <div class="empty-state">
        <div class="empty-icon">\u{1F4C8}</div>
        <h2>No data yet</h2>
        <p>Finish a workout and your stats and trends will show up here.</p>
      </div>
    `;return}let{workouts:t,totalVolume:s,totalSets:o,volumeSeries:n,topExercises:i,prs:r}=te;e.container.innerHTML=`
    <div class="section">Totals</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Total Volume</div><div class="stat-value">${de(s)}</div></div>
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
  `;let a=e.container.querySelector(".volume-chart-mount");a&&n.length>0&&we(a,n,{unit:"lbs"});for(let d of e.container.querySelectorAll("[data-page]"))d.addEventListener("click",()=>{let c=d.dataset.page;c==="trained"?co(e):c==="prs"?lo(e):c==="history"&&ns(e)})}function co(e){e.setTitle("Most-Trained"),e.setBack(()=>Re(e)),e.setAction(null);let{topExercises:t}=te;e.container.innerHTML=`
    <div class="list" style="margin-top: 16px;">
      ${t.map(s=>`
        <button class="list-row" data-exercise-id="${x(s.id)}">
          ${oe(s.exercise)}
          <div class="row-trailing trailing-stack">${ne(s.count)}</div>
          <div class="chevron">\u203A</div>
        </button>
      `).join("")}
    </div>
  `,e.container.scrollTop=0,pt(e)}function lo(e){e.setTitle("Personal Records"),e.setBack(()=>Re(e)),e.setAction(null);let{prs:t}=te;e.container.innerHTML=`
    <div class="section-footer" style="margin-top: 16px;">Heaviest set ever recorded per exercise.</div>
    <div class="list">
      ${t.map(s=>`
        <button class="list-row" data-exercise-id="${x(s.id)}" style="align-items: flex-start;">
          <div class="row-main">
            <div class="row-title">${x(s.name)}</div>
            <div class="row-subtitle">${N(s.date)}</div>
          </div>
          <div class="row-trailing" style="text-align: right;">
            <div style="font-weight: 600; color: var(--text);">${ye(s.weight)} lbs</div>
            <div style="font-size: 12px; color: var(--text-tertiary);">${s.reps} rep${s.reps===1?"":"s"}</div>
          </div>
          <div class="chevron">\u203A</div>
        </button>
      `).join("")}
    </div>
  `,e.container.scrollTop=0,pt(e)}function pt(e){for(let t of e.container.querySelectorAll("[data-exercise-id]"))t.addEventListener("click",()=>{Ne(t.dataset.exerciseId)})}function ns(e){e.setTitle("Workout History"),e.setBack(()=>Re(e)),e.setAction(null);let{workouts:t,setsByWorkout:s,exMap:o}=te;e.container.innerHTML=`
    <div class="list" style="margin-top: 16px;">
      ${t.map(n=>uo(n,s.get(n.id)||[],o)).join("")}
    </div>
  `,e.container.scrollTop=0;for(let n of e.container.querySelectorAll("[data-workout-id]"))n.addEventListener("click",()=>{let i=n.dataset.workoutId;po(e,i).catch(r=>{e.container.innerHTML=ee(r)})})}function uo(e,t,s){let o=t,n=o.reduce((d,c)=>d+c.weight*c.reps,0),i=(e.endedAt-e.startedAt)/1e3,r=[],a=new Set;for(let d of t){if(a.has(d.exerciseId))continue;a.add(d.exerciseId);let c=s.get(d.exerciseId);if(c&&r.push(c.name),r.length>=3)break}return`
    <button class="list-row" data-workout-id="${e.id}">
      <div class="row-main">
        <div class="row-title" style="font-weight: 600;">${x(e.name)}</div>
        <div class="row-subtitle" style="margin-top: 4px;">
          ${N(e.startedAt)} \xB7 ${Je(i)} \xB7 ${o.length} sets \xB7 ${de(n)}
        </div>
        ${r.length>0?`<div class="row-subtitle" style="margin-top: 4px;">${x(r.join(" \xB7 "))}${a.size>3?" \u2026":""}</div>`:""}
      </div>
      <div class="chevron">\u203A</div>
    </button>
  `}async function is(e){let[t,s,o]=await Promise.all([X("workouts",e),T("exercises"),Mt(e)]);if(!t)return null;let n=new Map(s.map(l=>[l.id,l])),i=new Map,r=[];for(let l of o)i.has(l.exerciseId)||(i.set(l.exerciseId,[]),r.push(l.exerciseId)),i.get(l.exerciseId).push(l);let a=J(o),d=a.reduce((l,v)=>l+v.weight*v.reps,0),c=a.length,p=(t.endedAt-t.startedAt)/1e3,f=`
    <div class="section">Summary</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Date</div><div class="stat-value">${qt(t.startedAt)}</div></div>
      <div class="stat-row"><div class="stat-label">Duration</div><div class="stat-value">${Je(p)}</div></div>
      <div class="stat-row"><div class="stat-label">Total Volume</div><div class="stat-value">${de(d)}</div></div>
      <div class="stat-row"><div class="stat-label">Completed Sets</div><div class="stat-value">${c}</div></div>
    </div>

    ${r.map(l=>{let v=n.get(l),b=i.get(l),L=0,y=0;return`
        ${v?`<button class="section section-link" data-exercise-id="${x(l)}">${x(G(v))}<span class="name-chevron">\u203A</span></button>`:'<div class="section">Unknown exercise</div>'}
        <div class="form-section">
          ${b.map(M=>{let $=(M.setType||"working")==="warmup"?`W${++y}`:String(++L);return`
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
  `;return{workout:t,html:f,sets:o}}function rs(e,t){for(let s of e.querySelectorAll("input.hist-input[data-set-id]"))s.addEventListener("input",async()=>{let o=t.find(n=>n.id===s.dataset.setId);o&&(s.dataset.field==="weight"?o.weight=parseFloat(s.value)||0:o.reps=parseInt(s.value,10)||0,await q("sets",{...o}))})}async function po(e,t){e.setBack(async()=>{te=await os(),ns(e)}),e.setAction({label:"Delete workout",html:Ie(),onClick:async()=>{confirm("Delete this workout?")&&(await Ce(t),W("data:changed"))}});let s=await is(t);if(!s){e.container.innerHTML=ee({message:"Workout not found."});return}e.setTitle(s.workout.name),e.container.innerHTML=s.html,e.container.scrollTop=0,pt(e),rs(e.container,s.sets)}async function as(e){let t=await is(e);if(!t)return;let s=H({html:`
      <div class="sheet-header">
        <button class="btn-text" id="wd-close">Done</button>
        <div class="title">${x(t.workout.name)}</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">${t.html}</div>
    `,onMount(o){o.querySelector("#wd-close").addEventListener("click",()=>s());for(let n of o.querySelectorAll("[data-exercise-id]"))n.addEventListener("click",()=>Ne(n.dataset.exerciseId));rs(o,t.sets)}})}function cs(e){let t=!0;return ls(e).catch(s=>{t&&(e.container.innerHTML=ee(s))}),()=>{t=!1}}async function ls(e){e.setTitle("Exercises"),e.setBack(null),e.setAction({label:"Add exercise",html:'<span style="font-size: 24px;">+</span>',onClick:()=>{be(null)}});let[t,s]=await Promise.all([T("exercises"),T("sets")]),o=t.sort((l,v)=>l.name.localeCompare(v.name)),n=new Map;for(let l of s)n.set(l.exerciseId,(n.get(l.exerciseId)??0)+1);let i="",r=null;e.container.innerHTML=`
    <div class="search-bar">
      <input class="search-input" id="ex-search" placeholder="Search exercises" />
    </div>
    <div class="chip-row" id="ex-chips"></div>
    <div class="list" id="ex-list"></div>
  `,e.container.scrollTop=0;let a=e.container.querySelector("#ex-list"),d=e.container.querySelector("#ex-chips"),c=e.container.querySelector("#ex-search");function p(){d.innerHTML=Pe(o,r);for(let l of d.querySelectorAll(".chip"))l.addEventListener("click",()=>{let v=l.dataset.cat;r=v==="All"?null:v,p(),f()})}function f(){let l=o.filter(v=>!r||F(v)===r).filter(v=>!i||v.name.toLowerCase().includes(i.toLowerCase()));if(l.length===0){a.innerHTML='<div class="list-row"><div class="row-main" style="color: var(--text-secondary);">No matches</div></div>';return}a.innerHTML=l.map(v=>`
        <button class="list-row" data-id="${v.id}">
          ${oe(v)}
          <div class="row-trailing trailing-stack">${ne(n.get(v.id)??0)}</div>
          <div class="chevron">\u203A</div>
        </button>
      `).join("");for(let v of a.querySelectorAll("[data-id]"))v.addEventListener("click",()=>{fo(e,v.dataset.id).catch(b=>{e.container.innerHTML=ee(b)})})}c.addEventListener("input",()=>{i=c.value,f()}),p(),f()}function fo(e,t){return je(e,t,()=>ls(e))}async function je(e,t,s){e.setBack(s);let o=await us(t);if(!o){e.container.innerHTML=ee({message:"Exercise not found."});return}e.setTitle(G(o.exercise)),e.setAction(o.exercise.isCustom?{label:"Delete exercise",html:Ie(),onClick:async()=>{if(o.completed.length>0){alert(`Can't delete \u2014 this exercise has ${o.completed.length} logged set${o.completed.length===1?"":"s"}.`);return}confirm("Delete this custom exercise?")&&(await ce("exercises",t),W("data:changed"))}}:null),e.container.innerHTML=o.html,e.container.scrollTop=0,e.container.querySelector("#exd-edit")?.addEventListener("click",()=>{be(o.exercise,()=>je(e,t,s))}),ds(e.container);let n=e.container.querySelector(".exercise-chart-mount");n&&o.chartData.length>0&&we(n,o.chartData,{unit:"lbs"})}function ds(e){for(let t of e.querySelectorAll(".recent-set[data-workout-id]"))t.addEventListener("click",()=>as(t.dataset.workoutId))}async function Ne(e){let t=await us(e);if(!t)return;let s=H({html:`
      <div class="sheet-header">
        <button class="btn-text" id="exd-close">Done</button>
        <div class="title">${x(G(t.exercise))}</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">${t.html}</div>
    `,onMount(o){o.querySelector("#exd-close").addEventListener("click",()=>s()),o.querySelector("#exd-edit")?.addEventListener("click",()=>{be(t.exercise,()=>{s(),W("data:changed"),Ne(e)})}),ds(o);let n=o.querySelector(".exercise-chart-mount");n&&t.chartData.length>0&&we(n,t.chartData,{unit:"lbs"})}})}async function us(e){let[t,s,o,n]=await Promise.all([X("exercises",e),T("sets"),T("workouts"),le()]);if(!t)return null;let i=new Map(o.map(l=>[l.id,l])),r=J(s).filter(l=>l.exerciseId===e&&l.workoutId!==n?.id&&i.has(l.workoutId)).map(l=>({...l,workout:i.get(l.workoutId)})).sort((l,v)=>l.workout.startedAt-v.workout.startedAt),a=r.reduce((l,v)=>l+v.weight*v.reps,0),d=r.reduce((l,v)=>!l||v.weight>l.weight||v.weight===l.weight&&v.reps>l.reps?v:l,null),c=new Map;for(let l of r){if(l.weight<=0||l.reps<=0||(l.setType||"working")==="warmup")continue;let v=c.get(l.workoutId)||{date:l.workout.startedAt,total:0,count:0};v.total+=l.weight*l.reps,v.count+=1,c.set(l.workoutId,v)}let p=Array.from(c.values()).map(({date:l,total:v,count:b})=>({date:l,value:v/b})).sort((l,v)=>l.date-v.date),f=`
    <div class="section">Details</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Equipment</div><div class="stat-value">${x(t.equipment)}</div></div>
      <div class="stat-row"><div class="stat-label">Muscle</div><div class="stat-value">${x(F(t))}</div></div>
      <button class="list-row button" id="exd-edit">
        <div class="row-main"><div class="row-title" style="color: var(--accent);">Edit Name, Muscle & Equipment</div></div>
      </button>
    </div>

    ${r.length>0?`
      <div class="section">Stats</div>
      <div class="form-section">
        <div class="stat-row"><div class="stat-label">Total Sets</div><div class="stat-value">${r.length.toLocaleString()}</div></div>
        <div class="stat-row"><div class="stat-label">Total Volume</div><div class="stat-value">${de(a)}</div></div>
        ${d?`<div class="stat-row"><div class="stat-label">Best Set</div><div class="stat-value">${ye(d.weight)} \xD7 ${d.reps}</div></div>`:""}
      </div>
    `:""}

    ${p.length>0?`
      <div class="section">Avg working-set volume per workout</div>
      <div class="exercise-chart-mount"></div>
    `:""}

    ${r.length>0?`
      <div class="section">Recent Sets \xB7 tap to view that workout</div>
      <div class="form-section">
        ${r.slice(-30).reverse().map(l=>`
          <button class="stat-row recent-set" data-workout-id="${x(l.workoutId)}">
            <div class="stat-label" style="font-size: 13px; color: var(--text-secondary);">${N(l.workout.startedAt)}</div>
            <div class="stat-value" style="color: var(--text);">${ye(l.weight)} \xD7 ${l.reps} <span class="name-chevron">\u203A</span></div>
          </button>
        `).join("")}
      </div>
    `:`
      <div class="empty-state" style="padding: 32px 24px;">
        <p style="color: var(--text-secondary);">No completed sets yet.</p>
      </div>
    `}
  `;return{exercise:t,completed:r,chartData:p,html:f}}var ms=["Amazed","Excited","Happy","Joyful","Content","Calm","Relieved","Grateful","Hopeful","Confident","Proud","Surprised","Indifferent","Anxious","Stressed","Overwhelmed","Frustrated","Angry","Irritated","Sad","Lonely","Discouraged","Drained","Worried","Embarrassed"],vs=["Health","Fitness","Self-Care","Hobbies","Identity","Community","Family","Friends","Partner","Work","Education","Money","Weather","Tasks"],ft=[["taken","Taken"],["skipped","Skipped"],["snoozed","Snoozed"],["notInteracted","Not interacted"]],mo=new Set(["taken","skipped","snoozed","notInteracted"]);function vo(e){let t=Number(e);return isFinite(t)?Math.max(-1,Math.min(1,t)):0}async function hs({id:e,kind:t,valence:s,labels:o,associations:n,date:i}){let r={id:e||j(),kind:t==="dailyMood"?"dailyMood":"momentaryEmotion",date:i||Date.now(),valence:vo(s),labels:o||[],associations:n||[]};return await q("stateOfMind",r),r}async function ys({id:e,nickname:t,form:s,hasSchedule:o,doseAmount:n,doseUnit:i}){let r=(t||"").trim()||"Medication",a=e?await X("medications",e):null,d=Number(n),c={id:e||j(),nickname:r,isArchived:a?!!a.isArchived:!1,hasSchedule:!!o,doseAmount:d>0?d:1,doseUnit:(i||"").trim(),concept:{identifier:a?.concept?.identifier||"",displayText:a?.concept?.displayText||r,form:(s||"").trim(),rxnorm:a?.concept?.rxnorm||[]}};return await q("medications",c),c}async function mt({id:e,medicationId:t,status:s,date:o,doseQuantity:n}){let i={id:e||j(),medicationId:String(t),status:mo.has(s)?s:"taken",date:o||Date.now(),scheduledQuantity:0,doseQuantity:Number(n)||0};return await q("doseEvents",i),i}async function ze(e,t){await ce(e,t)}async function Ue(){let[e,t,s]=await Promise.all([T("stateOfMind"),T("medications"),T("doseEvents")]);return e.sort((o,n)=>o.date-n.date),s.sort((o,n)=>o.date-n.date),{stateOfMind:e,medications:t,doseEvents:s}}var ps=e=>{let t=new Date(e);return`${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`},fs=e=>e.length?e.reduce((t,s)=>t+s,0)/e.length:null;function gs(e,t){let s=new Set(t.map(a=>ps(a.startedAt))),o=[],n=[];for(let a of e)(s.has(ps(a.date))?o:n).push(a.valence);let i=fs(o),r=fs(n);return{onWorkout:i,offWorkout:r,delta:i!=null&&r!=null?i-r:null,onCount:o.length,offCount:n.length}}function ws(e,t){let s=new Map;for(let o of t){if(o.status!=="taken"&&o.status!=="skipped")continue;let n=s.get(o.medicationId)??{taken:0,total:0};n.total+=1,o.status==="taken"&&(n.taken+=1),s.set(o.medicationId,n)}return e.map(o=>{let n=s.get(o.id)??{taken:0,total:0};return{medication:o,taken:n.taken,total:n.total,pct:n.total?n.taken/n.total:null}})}var ho=Object.fromEntries(ft),Ss=e=>new Date(e).toLocaleTimeString(void 0,{hour:"numeric",minute:"2-digit"}),$s='<span style="font-size: 24px;">+</span>';async function ht(e,t){let s=()=>ht(e,t);e.setTitle("State of Mind"),e.setBack(t),e.setAction({html:$s,onClick:()=>ks(s)});let[{stateOfMind:o},n]=await Promise.all([Ue(),Z()]),i=gs(o,n);e.container.innerHTML=`
    ${o.length?`
      <div class="section">Summary</div>
      <div class="form-section">
        <div class="stat-row"><div class="stat-label">Entries</div><div class="stat-value">${o.length.toLocaleString()}</div></div>
        <div class="stat-row"><div class="stat-label">Range</div><div class="stat-value">${N(o[0].date)} \u2013 ${N(o[o.length-1].date)}</div></div>
        <div class="stat-row"><div class="stat-label">Average mood</div><div class="stat-value">${Ve(ko(o))}</div></div>
      </div>

      <div class="section">Mood vs. training</div>
      <div class="form-section">
        <div class="stat-row"><div class="stat-label">On workout days</div><div class="stat-value">${i.onWorkout!=null?Ve(i.onWorkout)+` (${i.onCount})`:"\u2014"}</div></div>
        <div class="stat-row"><div class="stat-label">On rest days</div><div class="stat-value">${i.offWorkout!=null?Ve(i.offWorkout)+` (${i.offCount})`:"\u2014"}</div></div>
        <div class="stat-row"><div class="stat-label">Difference</div><div class="stat-value">${i.delta!=null?(i.delta>=0?"+":"")+i.delta.toFixed(2):"\u2014"}</div></div>
      </div>

      <div class="section">Recent entries</div>
      <div class="list">${o.slice(-30).reverse().map(yo).join("")}</div>
    `:gt("\u{1F9E0}","No mood entries","Tap \uFF0B to log how you're feeling.")}
  `,e.container.scrollTop=0;for(let r of e.container.querySelectorAll("[data-edit-som]")){let a=o.find(d=>d.id===r.dataset.editSom);a&&r.addEventListener("click",()=>ks(s,a))}}function yo(e){let t=e.kind==="dailyMood",s=e.labels.length?e.labels.join(", "):t?"Daily mood":"Momentary emotion",o=[...e.labels.length?[t?"Daily mood":"Moment"]:[],N(e.date),Ss(e.date),...e.associations.length?[e.associations.join(", ")]:[]].join(" \xB7 ");return`
    <button class="list-row" data-edit-som="${x(e.id)}">
      <div class="row-main">
        <div class="row-title">${x(s)}</div>
        <div class="row-subtitle">${x(o)}</div>
      </div>
      <div class="row-trailing">${Ve(e.valence)}</div>
      <div class="chevron">\u203A</div>
    </button>`}async function yt(e,t){let s=()=>yt(e,t);e.setTitle("Medications"),e.setBack(t),e.setAction({html:$s,onClick:()=>xs(s)});let{medications:o,doseEvents:n}=await Ue(),i=ws(o,n),r=new Map(o.map(p=>[p.id,p])),a=n.slice(-10).reverse(),d=new Date;d.setHours(0,0,0,0);let c=new Map;for(let p of n)p.status==="taken"&&p.date>=d.getTime()&&c.set(p.medicationId,(c.get(p.medicationId)||0)+1);e.container.innerHTML=`
    ${o.length?`
      <div class="section">Your medications</div>
      ${i.map(p=>wo(p,c.get(p.medication.id)||0)).join("")}
      ${a.length?`
        <div class="section">Recent doses</div>
        <div class="list">${a.map(p=>Ls(p,r)).join("")}</div>
        <div class="list">
          <button class="list-row" data-dose-history>
            <div class="row-main">
              <div class="row-title">Dose History</div>
              <div class="row-subtitle">${n.length.toLocaleString()} dose${n.length===1?"":"s"}</div>
            </div>
            <div class="chevron">\u203A</div>
          </button>
        </div>
      `:""}
    `:gt("\u{1F48A}","No medications","Tap \uFF0B to add one, then log each dose as you take it.")}
  `,e.container.scrollTop=0,e.container.querySelector("[data-dose-history]")?.addEventListener("click",()=>{Ms(e,s)});for(let p of e.container.querySelectorAll("[data-take]"))p.addEventListener("click",async()=>{await mt({medicationId:p.dataset.take,status:p.dataset.status,date:Date.now(),doseQuantity:Ye(r.get(p.dataset.take))}),I(p.dataset.status==="taken"?"Logged as taken":"Logged as skipped"),s()});for(let p of e.container.querySelectorAll("[data-logat]"))p.addEventListener("click",()=>vt(o,s,p.dataset.logat));for(let p of e.container.querySelectorAll("[data-edit-dose]")){let f=n.find(l=>l.id===p.dataset.editDose);f&&p.addEventListener("click",()=>vt(o,s,null,f))}for(let p of e.container.querySelectorAll("[data-edit-med]")){let f=r.get(p.dataset.editMed);f&&p.addEventListener("click",()=>xs(s,f))}}async function Ms(e,t){let s=()=>Ms(e,t);e.setTitle("Dose History"),e.setBack(t),e.setAction(null);let{medications:o,doseEvents:n}=await Ue(),i=new Map(o.map(p=>[p.id,p])),r=[...n].reverse(),a=[],d=null;for(let p of r){let f=ke(p.date);(!d||d.key!==f)&&(d={key:f,date:p.date,doses:[]},a.push(d)),d.doses.push(p)}let c=n.filter(p=>p.status==="taken").length;e.container.innerHTML=r.length?`
    <div class="section">Summary</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Doses logged</div><div class="stat-value">${n.length.toLocaleString()}</div></div>
      <div class="stat-row"><div class="stat-label">Taken</div><div class="stat-value">${c.toLocaleString()}</div></div>
      <div class="stat-row"><div class="stat-label">Range</div><div class="stat-value">${N(n[0].date)} \u2013 ${N(n[n.length-1].date)}</div></div>
    </div>
    ${a.map(p=>`
      <div class="section">${x(go(p.date))}</div>
      <div class="list">${p.doses.map(f=>Ls(f,i,{showDate:!1})).join("")}</div>
    `).join("")}
  `:gt("\u{1F48A}","No doses yet","Log a dose from the Medications page and it will show up here."),e.container.scrollTop=0;for(let p of e.container.querySelectorAll("[data-edit-dose]")){let f=n.find(l=>l.id===p.dataset.editDose);f&&p.addEventListener("click",()=>vt(o,s,null,f))}}var ke=e=>{let t=new Date(e);return`${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`};function go(e){let t=new Date,s=new Date(t.getTime()-864e5);return ke(e)===ke(t.getTime())?"Today":ke(e)===ke(s.getTime())?"Yesterday":new Date(e).toLocaleDateString(void 0,{weekday:"short",month:"short",day:"numeric",year:new Date(e).getFullYear()===t.getFullYear()?void 0:"numeric"})}function wo(e,t){let s=e.medication,o=[s.concept.form||"No form set",e.pct!=null?`${Math.round(e.pct*100)}% taken (${e.taken}/${e.total})`:"no doses yet"].join(" \xB7 "),n=s.hasSchedule?t>0?'<span class="hz-pill" style="--pc: #2ba758;">\u2713 Taken today</span>':'<span class="hz-pill muted">Not taken today</span>':"";return`
    <div class="exercise-section">
      <button class="exercise-section-header" data-edit-med="${x(s.id)}">
        <div class="row-main">
          <div class="row-title" style="font-weight:600">${x(s.nickname||s.concept.displayText)}</div>
          <div class="row-subtitle">${x(o)}</div>
          ${n?`<div style="margin-top: 8px;">${n}</div>`:""}
        </div>
        <div class="chevron">\u203A</div>
      </button>
      <div class="med-actions">
        <button class="btn-secondary" data-take="${x(s.id)}" data-status="taken">Taken now</button>
        <button class="btn-secondary" data-take="${x(s.id)}" data-status="skipped">Skip</button>
        <button class="btn-secondary" data-logat="${x(s.id)}">Log at time\u2026</button>
      </div>
    </div>`}var Ye=e=>Number(e?.doseAmount)>0?Number(e.doseAmount):1;function bo(e,t){let s=(t||"").trim()||"dose",o=e===1||/^(mg|mcg|ml|cc|g|kg|l|oz|iu|puff|puffs)$/i.test(s)||s.endsWith("s")?s:`${s}s`;return`${xo(e)} ${o}`}function Ls(e,t,{showDate:s=!0}={}){let o=t.get(e.medicationId),n=Number(e.doseQuantity)||0,i=[...s?[N(e.date)]:[],Ss(e.date),...n>0?[bo(n,o?.doseUnit)]:[]].join(" \xB7 ");return`
    <button class="list-row" data-edit-dose="${x(e.id)}">
      <div class="row-main">
        <div class="row-title">${x(o?o.nickname||o.concept.displayText:"Medication")}</div>
        <div class="row-subtitle">${x(i)}</div>
      </div>
      <div class="row-trailing">${x(ho[e.status]||e.status)}</div>
      <div class="chevron">\u203A</div>
    </button>`}function gt(e,t,s){return`
    <div class="empty-state" style="padding: 48px 24px; min-height: auto;">
      <div class="empty-icon">${e}</div>
      <h2>${x(t)}</h2>
      <p>${x(s)}</p>
    </div>`}function ko(e){return e.reduce((t,s)=>t+s.valence,0)/e.length}var xo=e=>Number.isInteger(e)?String(e):String(Number(e.toFixed(3)));function Es(e){return e>=.7?["Very pleasant","#2ba758"]:e>=.4?["Pleasant","#54a85a"]:e>=.1?["Slightly pleasant","#9cad46"]:e>-.1?["Neutral","#8a8a8e"]:e>-.4?["Slightly unpleasant","#d99a3c"]:e>-.7?["Unpleasant","#e07a4e"]:["Very unpleasant","#e0574f"]}function Ve(e){let[t,s]=Es(e);return`<span class="hz-pill" style="--pc: ${s};">${x(t)}</span>`}function wt(e){let t=new Date(e),s=o=>String(o).padStart(2,"0");return`${t.getFullYear()}-${s(t.getMonth()+1)}-${s(t.getDate())}T${s(t.getHours())}:${s(t.getMinutes())}`}var Ds=()=>wt(Date.now());function Ts(e){let t=e?new Date(e).getTime():NaN;return isFinite(t)?t:Date.now()}var So=e=>Math.max(-3,Math.min(3,Math.round(e*3)));function bs(e,t=[]){return e.map(s=>`<button type="button" class="chip${t.includes(s)?" active":""}" data-chip="${x(s)}">${x(s)}</button>`).join("")}function xe(e,t,s={}){for(let o of e.querySelectorAll(`${t} .chip`))o.addEventListener("click",()=>{s.single&&e.querySelectorAll(`${t} .chip`).forEach(n=>n.classList.remove("active")),o.classList.toggle("active",s.single?!0:!o.classList.contains("active"))})}var Se=(e,t)=>[...e.querySelectorAll(`${t} .chip.active`)].map(s=>s.dataset.chip);function ks(e,t=null){let s=!!t,o=s&&t.kind==="dailyMood",n=s?So(t.valence):1,i=s?t.valence:n/3,r=H({html:`
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
        <div class="chip-row" id="som-emotions" style="flex-wrap: wrap;">${bs(ms,s?t.labels:[])}</div>
        <div class="section">What's affecting you? (optional)</div>
        <div class="chip-row" id="som-assoc" style="flex-wrap: wrap;">${bs(vs,s?t.associations:[])}</div>
        <div class="section">When</div>
        <div class="form-section">
          <div class="form-row"><input type="datetime-local" id="som-date" value="${s?wt(t.date):Ds()}" style="text-align: left;" /></div>
        </div>
        ${s?`
        <div style="height: 8px;"></div>
        <div class="form-section">
          <button class="list-row button destructive" id="som-delete"><div class="row-main"><div class="row-title" style="color: var(--red);">Delete Entry</div></div></button>
        </div>`:""}
        <div style="height: 16px;"></div>
      </div>
    `,onMount(a){let d=a.querySelector("#som-val"),c=a.querySelector("#som-val-label"),p=()=>{c.textContent=Es(Number(d.value)/3)[0]};p(),d.addEventListener("input",()=>{i=Number(d.value)/3,p()}),xe(a,"#som-kind",{single:!0}),xe(a,"#som-emotions"),xe(a,"#som-assoc"),a.querySelector("#som-cancel").addEventListener("click",()=>r()),a.querySelector("#som-save").addEventListener("click",async()=>{await hs({id:t?.id,kind:Se(a,"#som-kind")[0]||"momentaryEmotion",valence:i,labels:Se(a,"#som-emotions"),associations:Se(a,"#som-assoc"),date:Ts(a.querySelector("#som-date").value)}),r(),I(s?"Entry updated":"Logged State of Mind"),e?.()}),a.querySelector("#som-delete")?.addEventListener("click",async()=>{confirm("Delete this entry?")&&(await ze("stateOfMind",t.id),r(),I("Entry deleted"),e?.())})}})}function xs(e,t=null){let s=!!t,o=s?!!t.hasSchedule:!0,n=H({html:`
      <div class="sheet-header">
        <button class="btn-text" id="med-cancel">Cancel</button>
        <div class="title">${s?"Edit Medication":"Add Medication"}</div>
        <button class="btn-text primary" id="med-save"${s?"":" disabled"}>Save</button>
      </div>
      <div class="sheet-content">
        <div class="section">Name</div>
        <div class="form-section">
          <div class="form-row"><input id="med-name" placeholder="e.g. Sertraline" value="${s?x(t.nickname||t.concept.displayText):""}" style="text-align: left;" /></div>
        </div>
        <div class="section">Form (optional)</div>
        <div class="form-section">
          <div class="form-row"><input id="med-form" placeholder="e.g. tablet, 50 mg" value="${s?x(t.concept?.form||""):""}" style="text-align: left;" /></div>
        </div>
        <div class="section">Amount per dose</div>
        <div class="form-section">
          <div class="form-row"><input type="number" id="med-amount" inputmode="decimal" min="0" step="0.25" value="${s?x(String(Ye(t))):"1"}" style="text-align: left;" /></div>
          <div class="form-row"><input id="med-unit" placeholder="unit \u2014 e.g. capsule, tablet, mg" value="${s?x(t.doseUnit||""):""}" style="text-align: left;" /></div>
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
    `,onMount(i){let r=i.querySelector("#med-name"),a=i.querySelector("#med-save");r.addEventListener("input",()=>{a.disabled=r.value.trim().length===0}),xe(i,"#med-type",{single:!0}),i.querySelector("#med-cancel").addEventListener("click",()=>n()),a.addEventListener("click",async()=>{r.value.trim()&&(await ys({id:t?.id,nickname:r.value,form:i.querySelector("#med-form").value,hasSchedule:(Se(i,"#med-type")[0]||"daily")==="daily",doseAmount:i.querySelector("#med-amount").value,doseUnit:i.querySelector("#med-unit").value}),n(),I(s?"Medication updated":"Medication added"),e?.())}),i.querySelector("#med-delete")?.addEventListener("click",async()=>{confirm("Delete this medication? Its logged doses stay in your history.")&&(await ze("medications",t.id),n(),I("Medication deleted"),e?.())}),s||setTimeout(()=>r.focus(),50)}})}function vt(e,t,s,o=null){let n=!!o,i=e.filter(f=>!f.isArchived),r=i.length?i:e,a=n?o.medicationId:s,d=n?o.status:"taken",c=n?Number(o.doseQuantity)||1:Ye(r.find(f=>f.id===a)||r[0]),p=H({html:`
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
              ${r.map(f=>`<option value="${x(f.id)}"${f.id===a?" selected":""}>${x(f.nickname||f.concept.displayText)}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="section">Status</div>
        <div class="chip-row" id="dose-status">
          ${ft.map(([f,l])=>`<button type="button" class="chip${f===d?" active":""}" data-chip="${f}">${x(l)}</button>`).join("")}
        </div>
        <div class="section">Amount</div>
        <div class="form-section">
          <div class="form-row"><input type="number" id="dose-qty" inputmode="decimal" min="0" step="0.25" value="${c}" style="text-align: left;" /></div>
        </div>
        <div class="section">When</div>
        <div class="form-section">
          <div class="form-row"><input type="datetime-local" id="dose-date" value="${n?wt(o.date):Ds()}" style="text-align: left;" /></div>
        </div>
        ${n?`
        <div style="height: 8px;"></div>
        <div class="form-section">
          <button class="list-row button destructive" id="dose-delete"><div class="row-main"><div class="row-title" style="color: var(--red);">Delete Dose</div></div></button>
        </div>`:""}
        <div style="height: 16px;"></div>
      </div>
    `,onMount(f){if(xe(f,"#dose-status",{single:!0}),!n){let l=f.querySelector("#dose-med"),v=f.querySelector("#dose-qty");l.addEventListener("change",()=>{v.value=String(Ye(e.find(b=>b.id===l.value)))})}f.querySelector("#dose-cancel").addEventListener("click",()=>p()),f.querySelector("#dose-save").addEventListener("click",async()=>{await mt({id:o?.id,medicationId:f.querySelector("#dose-med").value,status:Se(f,"#dose-status")[0]||"taken",date:Ts(f.querySelector("#dose-date").value),doseQuantity:Number(f.querySelector("#dose-qty").value)||0}),p(),I(n?"Dose updated":"Dose logged"),t?.()}),f.querySelector("#dose-delete")?.addEventListener("click",async()=>{confirm("Delete this dose?")&&(await ze("doseEvents",o.id),p(),I("Dose deleted"),t?.())})}})}function Is(e){let t=!0,s=null;return e.container.innerHTML="",le().then(o=>{t&&(o?s=Eo(e,o):$o(e))}).catch(o=>{t&&(e.container.innerHTML=`<div class="empty-state"><div class="empty-icon">!</div><h2>Couldn't load</h2><p>${x(o.message)}</p></div>`)}),()=>{t=!1,typeof s=="function"&&s()}}async function $o(e){e.setTitle("Workout");let t=await Z(),s=t[0],o=st(t),n=o?We(o.normalized):z[0],r=o&&As(o.startedAt)==="today"?"Tomorrow":"Today",a=s?`<div class="last-workout-hint">Last: <strong>${x(s.name)}</strong> \xB7 ${As(s.startedAt)}</div>`:"",d=`<div class="next-workout-hint">${r}: <strong>${x(n)}</strong></div>`;e.container.innerHTML=`
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
  `,e.container.querySelector("#start-btn").addEventListener("click",()=>Mo(n,r));for(let c of e.container.querySelectorAll("[data-nav]"))c.addEventListener("click",()=>{c.dataset.nav==="mind"?ht(e,()=>e.refresh()):yt(e,()=>e.refresh())})}function As(e){let t=new Date,s=new Date(e),o=i=>new Date(i.getFullYear(),i.getMonth(),i.getDate()).getTime(),n=Math.round((o(t)-o(s))/(1440*60*1e3));return n===0?"today":n===1?"yesterday":n<7?`${n} days ago`:n<14?"a week ago":`${Math.round(n/7)} weeks ago`}function Mo(e,t="Today"){Lo(e,async s=>{let o={id:j(),name:s,startedAt:Date.now(),endedAt:null,notes:""};await q("workouts",o),W("workout:changed")},t)}function Lo(e,t,s="Today"){let n=H({html:`
      <div class="sheet-header">
        <button class="btn-text" id="wt-cancel">Cancel</button>
        <div class="title">New Workout</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">
        <div class="section">Pick a type</div>
        <div class="form-section">
          ${z.map(i=>{let a=i===e?` <span class="badge">${x(s)}</span>`:"";return`
              <button class="list-row button" data-name="${x(i)}">
                <div class="row-main"><div class="row-title" style="color: ${He(i)}; font-weight: 600;">${x(i)}${a}</div></div>
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
    `,onMount(i){i.querySelector("#wt-cancel").addEventListener("click",()=>n());for(let d of i.querySelectorAll(".list-row.button[data-name]"))d.addEventListener("click",()=>{let c=d.dataset.name;n(),t(c)});let r=i.querySelector("#wt-custom"),a=i.querySelector("#wt-go");r.addEventListener("input",()=>{a.disabled=r.value.trim().length===0}),a.addEventListener("click",()=>{let d=r.value.trim();d&&(n(),t(d))}),setTimeout(()=>r.focus(),50)}})}function Eo(e,t){let s=[],o=[],n=new Map,i=new Map,r=null;e.container.innerHTML=`
    <div class="active-workout">
      <div class="workout-header">
        <input class="workout-name-input" id="wname" value="${x(t.name)}" placeholder="Workout name" />
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
  `,e.container.querySelector("#calc-fab").addEventListener("click",Oo);let a=()=>{e.setTitle(It((Date.now()-t.startedAt)/1e3))};a(),r=setInterval(a,1e3);let d=e.container.querySelector("#wname");d.addEventListener("input",async()=>{t.name=d.value,await q("workouts",{...t}),ie()});let c=new Map;e.container.querySelector("#add-exercise-btn").addEventListener("click",()=>{qo(s,i,async y=>{await Bo(t,o,y),await p()})}),e.container.querySelector("#finish-btn").addEventListener("click",async()=>{if(confirm("Finish this workout?")){await Io(t,o);try{let{filename:y}=await dt();I(`Saved \xB7 backup: ${y}`)}catch(y){I(`Saved \xB7 backup failed: ${y.message}`)}W("workout:changed")}}),e.container.querySelector("#discard-btn").addEventListener("click",async()=>{confirm("Discard this workout? This cannot be undone.")&&(await Ce(t.id),W("workout:changed"))});async function p(){let[y,h,M]=await Promise.all([T("sets"),T("workouts"),T("exercises")]);s=M,o=y.filter(S=>S.workoutId===t.id).sort((S,$)=>S.order-$.order),n=Et(y,h,t.id),c=v(y,M,t.id),i=new Map;for(let S of y)i.set(S.exerciseId,(i.get(S.exerciseId)??0)+1);L(),f()}function f(){let y=new Map(s.map(k=>[k.id,k])),h=[],M=new Map;for(let k of o){let D=y.get(k.exerciseId);if(!D)continue;let E=F(D);if(h.includes(E)||h.push(E),!k.completed)continue;let C=(k.weight||0)*(k.reps||0);C<=0||M.set(E,(M.get(E)??0)+C)}let S=[...M.values()].reduce((k,D)=>k+D,0),$=e.container.querySelector("#workout-progress");if(!$)return;if(h.length===0){$.innerHTML="";return}let A=h.map(k=>{let D=c.get(k)??0,E=M.get(k)??0;return{muscle:k,record:D,cur:E,span:Math.max(D,E)}}),B=Math.max(...A.map(k=>k.span)),m=B>0?B*.12:1;A=A.map(k=>({...k,span:Math.max(k.span,m)}));let u=Math.max(...A.map(k=>k.span)),g=A.map(({muscle:k,record:D,cur:E,span:C})=>{let P=C/u*100,V=E>0?Math.min(100,E/C*100):0,O;if(D>0){let pe=Math.round(E/D*100);O=E>D?`${pe}% \u{1F525}`:`${pe}%`}else O=E>0?"new \u{1F525}":"new";let Y=D>0?`${K(E)} / ${K(D)} \xB7 ${O}`:`${K(E)} \xB7 ${O}`,_=Rt(k);return`
        <div class="vol-muscle" style="width: ${P.toFixed(2)}%; --mcolor: ${_}; --mtext: ${jt(_)};" title="${x(k)}: ${K(E)} / record ${K(D)} lbs">
          <div class="vol-fill" style="width: ${V.toFixed(2)}%;"></div>
          <div class="vol-info${V>55?" on-fill":""}">
            <span class="seg-name">${x(k)}</span>
            <span class="seg-vol">${Y}</span>
          </div>
        </div>
      `}).join(""),w=`<strong>${K(S)} lbs</strong> total`;$.innerHTML=`
      <div class="vol-bars">${g}</div>
      <div class="vol-label">${w}</div>
    `,requestAnimationFrame(()=>{for(let k of $.querySelectorAll(".vol-muscle"))l(k)})}function l(y){let h=y.querySelector(".seg-name"),M=y.querySelector(".seg-vol"),S=y.clientWidth-4;if(S<=0)return;if(M){let A=10;for(M.style.fontSize=`${A}px`;M.scrollWidth>S&&A>6;)A-=.5,M.style.fontSize=`${A}px`}if(!h)return;h.style.display="";let $=11;for(h.style.fontSize=`${$}px`;h.scrollWidth>S&&$>5;)$-=.5,h.style.fontSize=`${$}px`}function v(y,h,M){let S=new Map(h.map(B=>[B.id,B])),$=new Map,A=new Map;for(let B of J(y)){if(B.workoutId===M)continue;let m=S.get(B.exerciseId);if(!m)continue;let u=(B.weight||0)*(B.reps||0);if(u<=0)continue;let g=F(m),w=A.get(B.workoutId);w||A.set(B.workoutId,w=new Map),w.set(g,(w.get(g)??0)+u)}for(let B of A.values())for(let[m,u]of B)u>($.get(m)??0)&&$.set(m,u);return $}async function b(y){if(!y.completed||(y.setType||"working")==="warmup"||!(y.weight>0)||!(y.reps>0))return;let h=s.find(u=>u.id===y.exerciseId);if(!h)return;let M=await T("sets"),S=J(M).filter(u=>u.exerciseId===y.exerciseId&&u.id!==y.id&&(u.setType||"working")!=="warmup"&&u.weight>0&&u.reps>0);if(S.length===0)return;let $=[],A=S.reduce((u,g)=>Math.max(u,g.weight),0);y.weight>A&&$.push(`Heaviest weight ever: ${he(y.weight)} lbs`);let B=y.weight*y.reps,m=S.reduce((u,g)=>Math.max(u,g.weight*g.reps),0);if(B>m&&$.push(`Most volume in a set: ${he(y.weight)}\xD7${y.reps} = ${K(B)} lbs`),$.length>0){let u=$.length>1?"New records":"New record";I(`\u{1F3C6} ${G(h)} \u2014 ${u}!
${$.join(`
`)}`,0,{persistUntilClick:!0})}}function L(){let y=new Map(s.map(m=>[m.id,m])),h=[],M=new Map;for(let m of o)M.has(m.exerciseId)||(M.set(m.exerciseId,[]),h.push(m.exerciseId)),M.get(m.exerciseId).push(m);for(let[,m]of M)m.sort((u,g)=>u.order-g.order);let S=e.container.querySelector("#exercise-sections");if(h.length===0){S.innerHTML=`
        <div class="empty-state" style="padding: 40px 24px; min-height: auto;">
          <p style="color: var(--text-secondary);">Add an exercise to start logging sets.</p>
        </div>`;return}S.innerHTML=h.map(m=>{let u=y.get(m),g=M.get(m),w=n.get(m)??new Map;return Do(u,g,w,i.get(m)??0)}).join("");function $(m){delete m.bumpedBy,delete m.preBumpWeight,delete m.preBumpReps}function A(m){let u=o.filter(E=>E.exerciseId===m.exerciseId).sort((E,C)=>E.order-C.order),g=m.setType||"working",w=0,k=0;for(let E of u)if(k+=1,(E.setType||"working")===g&&(w+=1),E.id===m.id)break;let D=$e(g,w,n.get(m.exerciseId),k);return D&&D.weight>0&&D.reps>0?{weight:D.weight,reps:D.reps}:null}async function B(m){await Cs(m.id,o),m.completed&&await Bs(m,o,A);for(let u of o){if(u.exerciseId!==m.exerciseId)continue;let g=S.querySelector(`.set-row[data-set-id="${u.id}"]`);if(!g)continue;let w=g.querySelector(".weight-input"),k=g.querySelector(".reps-input");w&&document.activeElement!==w&&(w.value=u.weight>0?String(u.weight):""),k&&document.activeElement!==k&&(k.value=u.reps>0?String(u.reps):"")}}for(let m of S.querySelectorAll(".set-row-wrap")){let u=m.querySelector(".set-row"),g=u.dataset.setId,w=o.find(O=>O.id===g);if(!w)continue;let k=u.querySelector(".weight-input"),D=u.querySelector(".reps-input"),E=u.querySelector(".complete-btn");Ao(m,async()=>{await ce("sets",w.id),await p()});let C=Ze(async()=>{await B(w),w.completed&&f()},200);k.addEventListener("input",()=>{w.weight=parseFloat(k.value)||0,$(w),q("sets",{...w}).catch(O=>console.error("Set save failed",O)),C()});let P=Ze(async()=>{await B(w),w.completed&&f()},200);D.addEventListener("input",()=>{w.reps=parseInt(D.value,10)||0,$(w),q("sets",{...w}).catch(O=>console.error("Set save failed",O)),P()}),E.addEventListener("click",async()=>{let O=w.completed;w.completed=!w.completed,w.completed&&$(w),await q("sets",w),u.classList.toggle("completed",w.completed),E.innerHTML=qs(w.completed);let Y=u.querySelector(".set-number")?.textContent?.trim()||"";E.setAttribute("aria-label",`${w.completed?"Mark incomplete":"Mark complete"} set ${Y}`),f(),!O&&w.completed?(await Bs(w,o,A)&&L(),await b(w)):O&&!w.completed&&await Cs(w.id,o)&&L()});let V=u.querySelector(".set-number");V&&V.addEventListener("click",async()=>{let Y=(w.setType||"working")==="warmup"?"working":"warmup";if(w.setType=Y,!w.completed){let _=o.filter(re=>re.exerciseId===w.exerciseId).sort((re,Hs)=>re.order-Hs.order),pe=0,kt=0;for(let re of _)if(kt+=1,(re.setType||"working")===Y&&(pe+=1),re.id===w.id)break;let fe=$e(Y,pe,n.get(w.exerciseId),kt);fe&&fe.weight>0&&fe.reps>0&&(w.weight=fe.weight,w.reps=fe.reps)}await q("sets",w),L()})}for(let m of S.querySelectorAll(".add-set-btn"))m.addEventListener("click",async()=>{let u=m.dataset.exerciseId;await Co(t,o,u,n.get(u)??new Map),await p()});for(let m of S.querySelectorAll(".exercise-menu"))m.addEventListener("click",async()=>{let u=m.dataset.exerciseId;confirm("Remove this exercise from the workout?")&&(await Qe("sets",o.filter(g=>g.exerciseId===u).map(g=>g.id)),await p())});for(let m of S.querySelectorAll(".exercise-name-btn"))m.addEventListener("click",()=>{r&&(clearInterval(r),r=null),je(e,m.dataset.exerciseId,()=>e.refresh())})}return p(),()=>{r&&clearInterval(r)}}function Do(e,t,s=new Map,o=0){let n=0,i=0,r=t.map((a,d)=>{let c=a.setType||"working",p,f;c==="warmup"?(i+=1,f=i,p=`W${i}`):(n+=1,f=n,p=String(n));let l=$e(c,f,s,d+1);return To(a,p,l)}).join("");return`
    <div class="exercise-section">
      <div class="exercise-section-header">
        <button class="exercise-name-btn" data-exercise-id="${e?.id}">${oe(e)}</button>
        <div class="row-trailing trailing-stack">${ne(o)}</div>
        <button class="menu exercise-menu" data-exercise-id="${e?.id}" aria-label="Remove ${x(G(e))} from workout">\xD7</button>
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
  `}function $e(e,t,s,o=null){if(!s||typeof s.get!="function")return null;let n=s.get(`${e}#${t}`);return n||(o!=null?s.get(`any#${o}`)??null:null)}function To(e,t,s){let o=e.setType||"working",n=s&&s.weight>0&&s.reps>0?`${he(s.weight)} \xD7 ${s.reps}`:"\u2014";return`
    <div class="set-row-wrap" data-set-id="${e.id}">
      <button class="set-swipe-delete" data-set-id="${e.id}" aria-label="Delete set ${t}">Delete</button>
      <div class="set-row type-${o}${e.completed?" completed":""}" data-set-id="${e.id}">
        <button class="set-number" aria-label="Set ${t}, tap to mark as ${o==="warmup"?"working":"warmup"}">${t}</button>
        <div class="prev" aria-label="Previous">${n}</div>
        <input class="weight-input" type="number" inputmode="decimal" step="0.5" aria-label="Weight in pounds for set ${t}"
               placeholder="0" value="${e.weight>0?e.weight:""}" />
        <input class="reps-input" type="number" inputmode="numeric" step="1" aria-label="Repetitions for set ${t}"
               placeholder="0" value="${e.reps>0?e.reps:""}" />
        <button class="complete-btn" aria-label="${e.completed?"Mark incomplete":"Mark complete"} set ${t}">${qs(e.completed)}</button>
      </div>
    </div>
  `}function Ao(e,t){let s=e.querySelector(".set-row"),o=e.querySelector(".set-swipe-delete");if(!s||!o)return;let n=88,i=0,r=0,a=0,d=0,c=!1,p=!1,f=!1,l=!1,v=()=>Math.max(140,i*.5);function b(S,$){s.style.transition=$?"transform 0.18s ease":"none",s.style.transform=`translateX(${S}px)`,o.style.width=`${Math.max(n,-S)}px`,e.classList.toggle("will-delete",S<=-v())}function L(S=!0){f=!1,b(0,S),e.classList.remove("swiped-open")}function y(S=!0){document.querySelectorAll(".set-row-wrap.swiped-open").forEach($=>{if($!==e){let A=$.querySelector(".set-row");A&&(A.style.transition="transform 0.18s ease",A.style.transform="translateX(0)");let B=$.querySelector(".set-swipe-delete");B&&(B.style.width=""),$.classList.remove("swiped-open","will-delete")}}),f=!0,b(-n,S),e.classList.add("swiped-open")}function h(){s.style.transition="transform 0.16s ease-out",s.style.transform=`translateX(${-i}px)`,o.style.width=`${i}px`,setTimeout(t,150)}s.addEventListener("touchstart",S=>{i=e.clientWidth||s.clientWidth,r=S.touches[0].clientX,a=S.touches[0].clientY,d=f?-n:0,c=!0,p=!1,l=!!S.target.closest("input, button, select, textarea")},{passive:!0}),s.addEventListener("touchmove",S=>{if(!c)return;let $=S.touches[0].clientX-r,A=S.touches[0].clientY-a;if(!p){if(Math.abs(A)>Math.abs($)+4){c=!1;return}Math.abs($)>8&&(p=!0,l&&document.activeElement?.blur&&document.activeElement.blur())}if(!p)return;S.cancelable&&S.preventDefault();let B=f?-n:0;d=Math.min(0,Math.max(-i,B+$)),b(d,!1)},{passive:!1});function M(){c&&(c=!1,p&&(d<=-v()?h():d<-n/2?y():L()))}s.addEventListener("touchend",M),s.addEventListener("touchcancel",M),o.addEventListener("click",S=>{S.stopPropagation(),t()})}function qs(e){return e?'<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>':'<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>'}async function Bo(e,t,s){let o=t.reduce((n,i)=>Math.max(n,i.order),-1)+1;for(let n of s){let i=(await Lt(n,e.id)).filter(d=>(d.weight||0)>0&&(d.reps||0)>0),a=(i.length>0?i:[{weight:0,reps:0,setType:"working"}]).map(d=>({id:j(),workoutId:e.id,exerciseId:n,weight:d.weight??0,reps:d.reps??0,setType:d.setType||"working",completed:!1,order:o++,createdAt:Date.now()}));await ae("sets",a)}}async function Bs(e,t,s){let o=(e.weight||0)*(e.reps||0);if(o<=0)return!1;let n=!1;for(let i of t)if(i.exerciseId===e.exerciseId&&i.id!==e.id&&!((i.order??0)<=(e.order??0))&&!i.completed&&(i.weight||0)*(i.reps||0)<o){if(i.bumpedBy==null){let r=s?.(i);i.preBumpWeight=r?r.weight:i.weight,i.preBumpReps=r?r.reps:i.reps}i.bumpedBy=e.id,i.weight=e.weight,i.reps=e.reps,await q("sets",i),n=!0}return n}async function Cs(e,t){let s=!1;for(let o of t)o.bumpedBy===e&&(o.completed||(o.preBumpWeight!=null&&(o.weight=o.preBumpWeight),o.preBumpReps!=null&&(o.reps=o.preBumpReps)),delete o.bumpedBy,delete o.preBumpWeight,delete o.preBumpReps,await q("sets",o),s=!0);return s}async function Co(e,t,s,o=new Map){let n=t.filter(L=>L.exerciseId===s),i=n[n.length-1],r=L=>(L?.weight||0)*(L?.reps||0),a=n.filter(L=>(L.setType||"working")!=="warmup"),d=a.length+1,c=$e("working",d,o,n.length+1),p=a.filter(L=>L.weight>0&&L.reps>0).reduce((L,y)=>!L||r(y)>r(L)?y:L,null),f=a.some((L,y)=>{let h=$e("working",y+1,o);return h&&h.weight>0&&h.reps>0&&r(L)>r(h)}),l=i?.weight??0,v=i?.reps??0;p&&(!c||f)&&(l=p.weight,v=p.reps);let b={id:j(),workoutId:e.id,exerciseId:s,weight:l,reps:v,completed:!1,order:(i?.order??-1)+1,createdAt:Date.now()};await q("sets",b)}async function Io(e,t){await Qe("sets",t.filter(s=>!s.completed&&((s.weight||0)===0||(s.reps||0)===0)).map(s=>s.id)),e.endedAt=Date.now(),await q("workouts",e)}function qo(e,t,s){let o=new Set,n="",i=null,r=H({html:`
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
    `,onMount(a){let d=a.querySelector("#picker-list"),c=a.querySelector("#picker-add"),p=a.querySelector("#picker-cancel"),f=a.querySelector("#picker-custom"),l=a.querySelector("#picker-search"),v=a.querySelector("#picker-chips");function b(){v.innerHTML=Pe(e,i);for(let y of v.querySelectorAll(".chip"))y.addEventListener("click",()=>{let h=y.dataset.cat;i=h==="All"?null:h,b(),L()})}function L(){let y=e.filter(h=>!i||F(h)===i).filter(h=>!n||h.name.toLowerCase().includes(n.toLowerCase())).sort((h,M)=>{let S=t.get(h.id)??0,$=t.get(M.id)??0;return S!==$?$-S:h.name.localeCompare(M.name)});d.innerHTML=y.length===0?'<div class="list-row"><div class="row-main" style="color:var(--text-secondary)">No matches</div></div>':y.map(h=>`
                <button class="list-row" data-id="${h.id}">
                  ${oe(h)}
                  <div class="row-trailing trailing-stack">
                    ${ne(t.get(h.id)??0)}
                    ${o.has(h.id)?Po():""}
                  </div>
                </button>
              `).join("");for(let h of d.querySelectorAll(".list-row[data-id]"))h.addEventListener("click",()=>{let M=h.dataset.id;o.has(M)?o.delete(M):o.add(M),c.disabled=o.size===0,c.textContent=o.size===0?"Add":`Add (${o.size})`,L()})}l.addEventListener("input",()=>{n=l.value,L()}),p.addEventListener("click",()=>r()),c.addEventListener("click",()=>{s(Array.from(o)),r()}),f.addEventListener("click",()=>{be(null,async y=>{e.push(y),o.add(y.id),b(),L(),c.disabled=!1,c.textContent=`Add (${o.size})`})}),b(),L()}})}function Po(){return'<svg viewBox="0 0 24 24" width="22" height="22" fill="var(--green)"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'}function be(e,t){let s=!!e,o=s?F(e):null,n=!o||ge.includes(o)?ge:[o,...ge],i=e?.equipment,r=!i||qe.includes(i)?qe:[i,...qe],a=H({html:`
      <div class="sheet-header">
        <button class="btn-text" id="ce-cancel">Cancel</button>
        <div class="title">${s?"Edit Exercise":"New Exercise"}</div>
        <button class="btn-text primary" id="ce-save" ${s?"":"disabled"}>Save</button>
      </div>
      <div class="sheet-content">
        <div class="section">Name</div>
        <div class="form-section">
          <div class="form-row">
            <input id="ce-name" placeholder="e.g. Cable Lateral Raise" style="text-align: left;" value="${x(e?.name??"")}" />
          </div>
        </div>
        <div class="section">Muscle</div>
        <div class="form-section">
          <div class="form-row">
            <label for="ce-cat">Muscle</label>
            <select id="ce-cat">${n.map(d=>`<option${d===o?" selected":""}>${x(d)}</option>`).join("")}</select>
          </div>
        </div>
        <div class="section">Equipment</div>
        <div class="form-section">
          <div class="form-row">
            <label for="ce-eq">Equipment</label>
            <select id="ce-eq">${r.map(d=>`<option${d===i?" selected":""}>${x(d)}</option>`).join("")}</select>
          </div>
        </div>
      </div>
    `,onMount(d){let c=d.querySelector("#ce-name"),p=d.querySelector("#ce-save");c.addEventListener("input",()=>{p.disabled=c.value.trim().length===0}),d.querySelector("#ce-cancel").addEventListener("click",()=>a()),p.addEventListener("click",async()=>{let f=c.value.trim();if(!f)return;let l=d.querySelector("#ce-cat").value,v=d.querySelector("#ce-eq").value,b=s?{...e,name:f,muscle:l,equipment:v}:{id:j(),name:f,muscle:l,category:l,equipment:v,notes:"",isCustom:!0,createdAt:Date.now()};await q("exercises",b),a(),t?.(b),s||W("data:changed")}),s||setTimeout(()=>c.focus(),50)}})}function Oo(){let t=[["AC","clear","fn"],["\xB1","sign","fn"],["\u232B","back","fn"],["\xF7","op","op"],["7","digit"],["8","digit"],["9","digit"],["\xD7","op","op"],["4","digit"],["5","digit"],["6","digit"],["\u2212","op","op"],["1","digit"],["2","digit"],["3","digit"],["+","op","op"],["0","digit","zero"],[".","dot"],["=","equals","op"]].map(([s,o,n])=>`<button class="calc-key${n?` calc-${n}`:""}" data-action="${o}" data-key="${x(s)}">${x(s)}</button>`).join("");H({html:`
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
    `,onMount(s,o){let n=s.querySelector("#calc-expr"),i=s.querySelector("#calc-result"),r={"+":(u,g)=>u+g,"\u2212":(u,g)=>u-g,"\xD7":(u,g)=>u*g,"\xF7":(u,g)=>g===0?NaN:u/g},a=u=>u==="+"||u==="\u2212"||u==="\xD7"||u==="\xF7",d=u=>{if(!isFinite(u))return"Error";let g=parseFloat(u.toFixed(8)).toString();return g.replace("-","").replace(".","").length>12&&(g=u.toPrecision(10).replace(/\.?0+$/,"")),g},c=["0"],p=!1,f=!1,l="",v=()=>c[c.length-1];function b(){n.textContent=f?"":l,i.textContent=f?"Error":c.join(" ");let u=!f&&a(v())?v():null;for(let g of s.querySelectorAll(".calc-op"))g.classList.toggle("selected",g.dataset.key===u)}function L(u){if(f&&(c=["0"],f=!1),p)return c=[u],p=!1,b();a(v())?c.push(u):c[c.length-1]=v()==="0"?u:v()+u,b()}function y(){if(f&&(c=["0"],f=!1),p)return c=["0."],p=!1,b();a(v())?c.push("0."):v().includes(".")||(c[c.length-1]=v()+"."),b()}function h(u){f||(p=!1,a(v())?c[c.length-1]=u:c.push(u),b())}function M(){c=["0"],p=!1,f=!1,b()}function S(){if(f||a(v()))return;let u=v();c[c.length-1]=u.startsWith("-")?u.slice(1):u==="0"?"0":"-"+u,b()}function $(){if(f)return M();if(p=!1,a(v()))return c.pop(),b();let u=v().slice(0,-1);u===""||u==="-"?c.length>1?c.pop():c=["0"]:c[c.length-1]=u,b()}function A(){if(f)return;let u=c.slice();if(a(u[u.length-1])&&u.pop(),u.length<3)return;let g=parseFloat(u[0]);for(let w=1;w<u.length;w+=2)if(g=r[u[w]](g,parseFloat(u[w+1])),!isFinite(g))return f=!0,b();l=`${u.join(" ")} =`,c=[d(g)],p=!0,b()}function B(u){let{action:g,key:w}=u.dataset;g!=="equals"&&(l=""),g==="digit"?L(w):g==="dot"?y():g==="clear"?M():g==="sign"?S():g==="back"?$():g==="op"?h(w):g==="equals"&&A()}let m=null;for(let u of s.querySelectorAll(".calc-key"))u.addEventListener("pointerdown",g=>{g.preventDefault(),m=u,u.classList.add("pressed")}),u.addEventListener("pointerup",g=>{g.preventDefault(),u.classList.remove("pressed"),m===u&&B(u),m=null}),u.addEventListener("pointercancel",()=>{u.classList.remove("pressed"),m=null}),u.addEventListener("pointerleave",()=>u.classList.remove("pressed"));s.querySelector("#calc-done").addEventListener("click",()=>o())}})}function Ee(){let e=window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===!0,t;e?t=Math.max(window.innerHeight||0,window.visualViewport?.height||0,window.screen?.height||0):t=window.visualViewport?.height||window.innerHeight,document.documentElement.style.setProperty("--app-height",`${t}px`)}Ee();window.addEventListener("resize",Ee);window.addEventListener("orientationchange",Ee);window.addEventListener("pageshow",Ee);window.visualViewport?.addEventListener("resize",Ee);var Ps={workout:{title:"Workout",render:Is},exercises:{title:"Exercises",render:cs},progress:{title:"Progress",render:ss}},Me=document.getElementById("view-content"),Ho=document.getElementById("nav-title"),Os=document.getElementById("nav-back"),Q=document.getElementById("nav-action"),Le="workout",bt=null,Ge=null,Ke=null,_e={container:Me,setTitle(e){Ho.textContent=e},setAction(e){if(!e){Q.hidden=!0,Q.innerHTML="",Q.removeAttribute("aria-label"),Ge=null;return}Q.hidden=!1,e.label?Q.setAttribute("aria-label",e.label):Q.removeAttribute("aria-label"),e.html?Q.innerHTML=e.html:Q.textContent=e.label??"",Ge=e.onClick},setBack(e){bt=e,Os.hidden=!e},refresh(){De(Le)},toast(e){I(e)}};function Wo(){if(typeof Ke=="function")try{Ke()}catch(e){console.error(e)}Ke=null}function De(e){Le=e,Ft(e),document.querySelectorAll(".tab").forEach(t=>{t.setAttribute("aria-selected",String(t.dataset.tab===e))}),Wo(),_e.setTitle(Ps[e].title),_e.setAction(null),_e.setBack(null),Me.innerHTML="",Me.scrollTop=0;try{Ke=Ps[e].render(_e)}catch(t){console.error("Render failed",t),Me.innerHTML=`<div class="empty-state"><div class="empty-icon">!</div><h2>Render error</h2><p>${x(t.message)}</p></div>`}}document.querySelectorAll(".tab").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll(".sheet-backdrop").forEach(t=>t.dismissSheet?.()),De(e.dataset.tab)})});Os.addEventListener("click",()=>{bt&&bt()});Q.addEventListener("click",()=>{Ge&&Ge()});(function(){let t='button, [role="button"], a[href]',s=null,o=0,n=0,i=()=>{s&&(s.classList.remove("pressed"),s=null)};document.addEventListener("pointerdown",r=>{let a=r.target.closest?.(t);s&&s!==a&&i(),!(!a||a.disabled||a.classList.contains("calc-key"))&&(s=a,o=r.clientX,n=r.clientY,a.classList.add("pressed"))},{passive:!0}),document.addEventListener("pointermove",r=>{s&&(Math.abs(r.clientX-o)>8||Math.abs(r.clientY-n)>8)&&i()},{passive:!0}),document.addEventListener("pointerup",i,{passive:!0}),document.addEventListener("pointercancel",i,{passive:!0}),window.addEventListener("scroll",i,{passive:!0,capture:!0})})();et("data:changed",()=>{ie(),De(Le)});et("workout:changed",()=>{ie(),Le==="workout"&&De(Le)});document.addEventListener("visibilitychange",()=>{document.visibilityState==="visible"&&ie()});async function Fo(){try{await U(),await Gt().catch(t=>console.warn("Passphrase check failed:",t));let e=await Ht();e>0&&console.info(`Seeded ${e} exercises.`),await Vt(),De("workout"),ie()}catch(e){console.error("Init failed:",e),Me.innerHTML=`
      <div class="empty-state">
        <div class="empty-icon">!</div>
        <h2>Storage unavailable</h2>
        <p>${x(e.message??String(e))}</p>
        <p>If you are running this from a <code>file://</code> URL, serve it through a local web server instead.</p>
      </div>`}}Fo();
