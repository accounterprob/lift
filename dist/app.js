var Ls="lift";var vt=["exercises","workouts","sets","stateOfMind","medications","doseEvents"],Ee=null;function j(){return Ee?Promise.resolve(Ee):new Promise((e,t)=>{let s=indexedDB.open(Ls,4);s.onerror=()=>t(s.error),s.onsuccess=()=>{Ee=s.result,e(Ee)},s.onupgradeneeded=()=>{let o=s.result;if(!o.objectStoreNames.contains("exercises")){let n=o.createObjectStore("exercises",{keyPath:"id"});n.createIndex("name","name",{unique:!1}),n.createIndex("category","category",{unique:!1})}if(o.objectStoreNames.contains("workouts")||o.createObjectStore("workouts",{keyPath:"id"}).createIndex("startedAt","startedAt",{unique:!1}),!o.objectStoreNames.contains("sets")){let n=o.createObjectStore("sets",{keyPath:"id"});n.createIndex("workoutId","workoutId",{unique:!1}),n.createIndex("exerciseId","exerciseId",{unique:!1})}if(o.objectStoreNames.contains("stateOfMind")||o.createObjectStore("stateOfMind",{keyPath:"id"}).createIndex("date","date",{unique:!1}),o.objectStoreNames.contains("medications")||o.createObjectStore("medications",{keyPath:"id"}),!o.objectStoreNames.contains("doseEvents")){let n=o.createObjectStore("doseEvents",{keyPath:"id"});n.createIndex("medicationId","medicationId",{unique:!1}),n.createIndex("date","date",{unique:!1})}}})}function pe(e){return new Promise((t,s)=>{e.onsuccess=()=>t(e.result),e.onerror=()=>s(e.error)})}async function fe(e,t="readonly"){return(await j()).transaction(e,t).objectStore(e)}function ee(e,t,s){return new Promise((o,n)=>{let i=e.transaction(t,"readwrite"),r;try{r=s(i)}catch(a){try{i.abort()}catch{}n(a);return}i.oncomplete=()=>o(r),i.onerror=()=>n(i.error),i.onabort=()=>n(i.error)})}async function A(e){return pe((await fe(e)).getAll())}async function te(e,t){return pe((await fe(e)).get(t))}async function q(e,t){return await pe((await fe(e,"readwrite")).put(t)),t}async function re(e,t){let s=await j();return ee(s,e,o=>{let n=o.objectStore(e);for(let i of t)n.put(i)})}async function ae(e,t){return pe((await fe(e,"readwrite")).delete(t))}async function _e(e,t){if(t.length===0)return;let s=await j();return ee(s,e,o=>{let n=o.objectStore(e);for(let i of t)n.delete(i)})}async function Le(e,t,s){let o=await fe(e);return pe(o.index(t).getAll(s))}async function ht(e){let t=await j();return ee(t,vt,s=>{for(let o of vt){let n=s.objectStore(o);n.clear();for(let i of e[o]??[])n.put(i)}})}function Q(e){let t=new Set;for(let s of e)s.completed&&t.add(s.workoutId);return e.filter(s=>s.completed||!t.has(s.workoutId))}async function ce(){return(await A("workouts")).find(t=>!t.endedAt)??null}async function X(){return(await A("workouts")).filter(t=>t.endedAt).sort((t,s)=>s.startedAt-t.startedAt)}async function yt(e){return(await Le("sets","workoutId",e)).sort((s,o)=>s.order-o.order)}async function Ds(e){return await Le("sets","exerciseId",e)}async function gt(e,t=null){let s=await Ds(e),o=new Map;for(let r of s)t&&r.workoutId===t||(o.has(r.workoutId)||o.set(r.workoutId,[]),o.get(r.workoutId).push(r));if(o.size===0)return[];let i=(await Promise.all(Array.from(o.keys()).map(r=>te("workouts",r)))).filter(Boolean).sort((r,a)=>(a.startedAt??0)-(r.startedAt??0));return i.length===0?[]:o.get(i[0].id).sort((r,a)=>r.order-a.order)}function wt(e,t,s=null){let o=new Map(t.map(r=>[r.id,r.startedAt??0])),n=new Map;for(let r of e){if(r.workoutId===s||!o.has(r.workoutId)||(r.weight||0)<=0||(r.reps||0)<=0)continue;let a=n.get(r.exerciseId);a||n.set(r.exerciseId,a=new Map);let u=a.get(r.workoutId);u||a.set(r.workoutId,u=[]),u.push(r)}let i=new Map;for(let[r,a]of n){let u=[...a.keys()].sort((p,v)=>o.get(v)-o.get(p)),c=new Map;for(let p of u){let v=a.get(p).sort((E,y)=>E.order-y.order),l=v.every(E=>E.setType==null),m=0,b=0;v.forEach((E,y)=>{if(l){let $=`any#${y+1}`;c.has($)||c.set($,E);return}let h=E.setType||"working",M=h==="warmup"?b+=1:m+=1,S=`${h}#${M}`;c.has(S)||c.set(S,E)})}i.set(r,c)}return i}var As={barbell:"Barbell",dumbbell:"Dumbbell",machine:"Machine",cable:"Cable",bodyweight:"Bodyweight",kettlebell:"Kettlebell",band:"Bands",bands:"Bands"},Ts=/\s*\((barbell|dumbbell|machine|cable|bodyweight|kettlebell|bands?)\)$|\s+(Machine|Barbell|Dumbbell|Cable|Kettlebell)$/i;async function Bs(e,t){let s=await j(),o=await Le("sets","exerciseId",e);return ee(s,["sets","exercises"],n=>{let i=n.objectStore("sets");for(let r of o)i.put({...r,exerciseId:t});return n.objectStore("exercises").delete(e),o.length})}async function bt(){let e=await A("exercises"),t=e.filter(i=>/butterfly/i.test(i.name||""));if(t.length===0)return 0;let s=e.filter(i=>/chest fly/i.test(i.name||"")&&!t.some(r=>r.id===i.id)),o=s.find(i=>(i.equipment||"")==="Machine")||s[0],n=0;for(let i of t)o?n+=await Bs(i.id,o.id):await q("exercises",{...i,name:"Chest Fly",equipment:"Machine"});return n}async function kt(){let e=await A("exercises"),t=[];for(let s of e){let o=(s.name||"").match(Ts);if(!o)continue;let n=s.name.slice(0,o.index).trim();if(!n||/smith$/i.test(n))continue;let i=(o[1]||o[2]).toLowerCase();t.push({...s,name:n,equipment:As[i]||s.equipment})}return t.length>0&&await re("exercises",t),t.length}async function xt(){let[e,t,s]=await Promise.all([A("exercises"),A("sets"),A("workouts")]),o=new Set(e.filter(c=>c.category==="Cardio").map(c=>c.id));if(o.size===0)return{exercises:0,sets:0,workouts:0};let n=t.filter(c=>o.has(c.exerciseId)),i=new Map;for(let c of t)o.has(c.exerciseId)||i.set(c.workoutId,(i.get(c.workoutId)||0)+1);let r=new Set(n.map(c=>c.workoutId)),a=s.filter(c=>r.has(c.id)&&!i.get(c.id)),u=await j();return await ee(u,["exercises","sets","workouts"],c=>{let p=c.objectStore("exercises"),v=c.objectStore("sets"),l=c.objectStore("workouts");for(let m of o)p.delete(m);for(let m of n)v.delete(m.id);for(let m of a)l.delete(m.id)}),{exercises:o.size,sets:n.length,workouts:a.length}}async function St(e){let[t,s,o]=await Promise.all([A("exercises"),A("sets"),A("workouts")]),n=t.filter(l=>l.category==="Other");if(n.length===0)return{recategorized:0,deleted:0,workouts:0};let i=[],r=new Set;for(let l of n){let m=e(l.name);m==="Cardio"?r.add(l.id):i.push({...l,category:m&&m!=="Other"?m:"Full Body"})}let a=s.filter(l=>r.has(l.exerciseId)),u=new Map;for(let l of s)r.has(l.exerciseId)||u.set(l.workoutId,(u.get(l.workoutId)||0)+1);let c=new Set(a.map(l=>l.workoutId)),p=o.filter(l=>c.has(l.id)&&!u.get(l.id)),v=await j();return await ee(v,["exercises","sets","workouts"],l=>{let m=l.objectStore("exercises"),b=l.objectStore("sets"),E=l.objectStore("workouts");for(let y of i)m.put(y);for(let y of r)m.delete(y);for(let y of a)b.delete(y.id);for(let y of p)E.delete(y.id)}),{recategorized:i.length,deleted:r.size,workouts:p.length}}async function $t(){let e=await A("medications"),t=[];for(let s of e){if(s.doseAmount!=null)continue;let o=s.nickname||s.concept?.displayText||"";if(!/creatine/i.test(o))continue;let n=(s.concept?.form||"").replace(/\s*\(4\s*[×x]\s*\/?\s*day\)\s*/i,"").trim();t.push({...s,doseAmount:4,doseUnit:"capsule",concept:{...s.concept,form:n}})}return t.length>0&&await re("medications",t),t.length}async function De(e){let t=await j(),s=await Le("sets","workoutId",e);return ee(t,["workouts","sets"],o=>{o.objectStore("workouts").delete(e);let n=o.objectStore("sets");for(let i of s)n.delete(i.id)})}var F=()=>crypto&&crypto.randomUUID?crypto.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,e=>{let t=Math.random()*16|0;return(e==="x"?t:t&3|8).toString(16)});function me(e){return e==null?"0":Math.abs(e-Math.round(e))<.001?String(Math.round(e)):e.toFixed(1)}function ve(e){return`${me(e)} lbs`}function Mt(e){let t=Math.max(0,Math.floor(e)),s=Math.floor(t/3600),o=Math.floor(t%3600/60),n=t%60;return s>0?`${s}:${String(o).padStart(2,"0")}:${String(n).padStart(2,"0")}`:`${o}:${String(n).padStart(2,"0")}`}function Ke(e){let t=Math.max(0,Math.floor(e)),s=Math.floor(t/3600),o=Math.floor(t%3600/60);return s>0?`${s}h ${o}m`:`${o}m`}function Y(e){return Math.round(e).toLocaleString()}function le(e){return`${Y(e)} lbs`}function z(e){return(e instanceof Date?e:new Date(e)).toLocaleDateString(void 0,{month:"numeric",day:"numeric",year:"2-digit"})}function Et(e){return(e instanceof Date?e:new Date(e)).toLocaleDateString(void 0,{weekday:"short",month:"short",day:"numeric",year:"numeric"})}function Ge(e,t=200){let s=null;return(...o)=>{clearTimeout(s),s=setTimeout(()=>e(...o),t)}}function x(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function I(e,t=1800,s={}){let o=document.querySelector(".toast");o&&o.remove();let n=document.createElement("div");n.className="toast",n.textContent=e,s.persistUntilClick?(n.classList.add("toast-clickable"),n.addEventListener("click",()=>n.remove())):setTimeout(()=>n.remove(),t),document.body.appendChild(n)}var Ye=new EventTarget;function H(e,t){Ye.dispatchEvent(new CustomEvent(e,{detail:t}))}function Qe(e,t){return Ye.addEventListener(e,t),()=>Ye.removeEventListener(e,t)}function W({html:e,onMount:t}){let s=document.createElement("div");s.className="sheet-backdrop",s.innerHTML='<div class="sheet"></div>';let o=s.querySelector(".sheet");o.innerHTML=e;let n=Cs();document.body.appendChild(s);function i(){let u=window.visualViewport;if(!u){o.style.maxHeight=`${window.innerHeight-n-10}px`;return}let c=Math.max(window.innerHeight,document.documentElement.clientHeight),p=Math.max(0,c-u.height-u.offsetTop);p>0?(o.style.paddingBottom=`${p}px`,o.style.maxHeight=`${u.height-n-10+p}px`):(o.style.paddingBottom="",o.style.maxHeight=`${u.height-n-10}px`)}i();let r=window.visualViewport;r?.addEventListener("resize",i),r?.addEventListener("scroll",i);function a(){s.remove(),r?.removeEventListener("resize",i),r?.removeEventListener("scroll",i)}return s.dismissSheet=a,s.addEventListener("click",u=>{u.target===s&&a()}),t?.(o,a),a}function Cs(){let e=document.createElement("div");e.style.cssText="position:fixed;top:0;left:0;width:0;height:env(safe-area-inset-top);",document.body.appendChild(e);let t=e.offsetHeight||0;return e.remove(),t}function Ae(){return'<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" style="color: var(--red);"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>'}function Lt(){return'<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M16 5l-1.42 1.42-1.59-1.59V16h-2V4.83L9.41 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z"/></svg>'}function J(e){return`<div class="empty-state"><div class="empty-icon">!</div><h2>Couldn't load</h2><p>${x(e.message||String(e))}</p></div>`}var he=["Pectorals","Anterior Deltoid","Lateral Deltoid","Posterior Deltoid","Triceps","Biceps","Forearms","Lats","Upper Back","Lower Back","Traps","Quadriceps","Hamstrings","Glutes","Adductors","Abductors","Calves","Abs","Obliques"];function Is(e){let t=new Map(he.map((s,o)=>[s,o]));return[...e].sort((s,o)=>(t.get(s)??999)-(t.get(o)??999)||s.localeCompare(o))}var Te=["Barbell","Dumbbell","Machine","Cable","Bodyweight","Other"];function K(e){let t=e?.equipment,s=e?.name??"";return t&&t!=="Other"?`${s} (${t})`:s}function se(e){let t=e?[e.equipment,R(e)].filter(Boolean).join(" \xB7 "):"";return`
    <div class="row-main">
      <div class="row-title">${x(e?.name??"Unknown exercise")}</div>
      ${t?`<div class="row-subtitle">${x(t)}</div>`:""}
    </div>
  `}function oe(e){return e?`<div class="exercise-count">${e} ${e===1?"set":"sets"}</div>`:""}function Be(e,t){return["All",...Is(new Set(e.map(o=>R(o))))].map(o=>`<button class="chip${o==="All"&&!t||o===t?" active":""}" data-cat="${x(o)}">${x(o)}</button>`).join("")}var qs=[["Bench Press (Barbell)","Chest","Barbell"],["Bench Press (Dumbbell)","Chest","Dumbbell"],["Incline Bench Press (Barbell)","Chest","Barbell"],["Incline Bench Press (Dumbbell)","Chest","Dumbbell"],["Decline Bench Press (Barbell)","Chest","Barbell"],["Chest Fly (Dumbbell)","Chest","Dumbbell"],["Chest Fly (Machine)","Chest","Machine"],["Cable Crossover","Chest","Cable"],["Push-Up","Chest","Bodyweight"],["Dip (Chest)","Chest","Bodyweight"],["Deadlift (Conventional)","Back","Barbell"],["Deadlift (Sumo)","Back","Barbell"],["Romanian Deadlift","Back","Barbell"],["Bent-Over Row (Barbell)","Back","Barbell"],["Pendlay Row","Back","Barbell"],["Row (Dumbbell)","Back","Dumbbell"],["T-Bar Row","Back","Barbell"],["Seated Cable Row","Back","Cable"],["Lat Pulldown","Back","Cable"],["Pull-Up","Back","Bodyweight"],["Chin-Up","Back","Bodyweight"],["Face Pull","Back","Cable"],["Shrug (Barbell)","Back","Barbell"],["Shrug (Dumbbell)","Back","Dumbbell"],["Overhead Press (Barbell)","Shoulders","Barbell"],["Overhead Press (Dumbbell)","Shoulders","Dumbbell"],["Seated Shoulder Press (Machine)","Shoulders","Machine"],["Arnold Press","Shoulders","Dumbbell"],["Lateral Raise (Dumbbell)","Shoulders","Dumbbell"],["Lateral Raise (Cable)","Shoulders","Cable"],["Front Raise (Dumbbell)","Shoulders","Dumbbell"],["Rear Delt Fly (Dumbbell)","Shoulders","Dumbbell"],["Reverse Pec Deck","Shoulders","Machine"],["Upright Row","Shoulders","Barbell"],["Barbell Curl","Biceps","Barbell"],["Dumbbell Curl","Biceps","Dumbbell"],["Hammer Curl","Biceps","Dumbbell"],["Preacher Curl","Biceps","Barbell"],["Incline Dumbbell Curl","Biceps","Dumbbell"],["Cable Curl","Biceps","Cable"],["Concentration Curl","Biceps","Dumbbell"],["Close-Grip Bench Press","Triceps","Barbell"],["Tricep Pushdown (Cable)","Triceps","Cable"],["Overhead Tricep Extension (Dumbbell)","Triceps","Dumbbell"],["Overhead Tricep Extension (Cable)","Triceps","Cable"],["Skull Crusher","Triceps","Barbell"],["Dip (Tricep)","Triceps","Bodyweight"],["Tricep Kickback","Triceps","Dumbbell"],["Back Squat","Legs","Barbell"],["Front Squat","Legs","Barbell"],["Goblet Squat","Legs","Dumbbell"],["Bulgarian Split Squat","Legs","Dumbbell"],["Lunge","Legs","Dumbbell"],["Leg Press","Legs","Machine"],["Leg Extension","Legs","Machine"],["Leg Curl (Seated)","Legs","Machine"],["Leg Curl (Lying)","Legs","Machine"],["Hip Thrust (Barbell)","Glutes","Barbell"],["Glute Bridge","Glutes","Bodyweight"],["Cable Kickback","Glutes","Cable"],["Hip Abduction (Machine)","Glutes","Machine"],["Standing Calf Raise","Calves","Machine"],["Seated Calf Raise","Calves","Machine"],["Plank","Core","Bodyweight"],["Hanging Leg Raise","Core","Bodyweight"],["Cable Crunch","Core","Cable"],["Russian Twist","Core","Bodyweight"],["Ab Wheel Rollout","Core","Other"],["Wrist Curl","Forearms","Dumbbell"],["Reverse Wrist Curl","Forearms","Dumbbell"],["Farmer's Carry","Forearms","Dumbbell"]];function R(e){if(e?.muscle)return e.muscle;let t=(e?.name||"").toLowerCase();return t?/romanian deadlift|\brdl\b|stiff.?leg|good morning|nordic|hamstring/.test(t)||/leg curl/.test(t)?"Hamstrings":/leg extension|sissy squat/.test(t)?"Quadriceps":/calf|tib raise|tibialis/.test(t)?"Calves":/hip adduction|adductor|inner thigh|copenhagen/.test(t)?"Adductors":/hip abduction|abductor|outer thigh|clamshell/.test(t)?"Abductors":/hip thrust|glute|cable kickback|donkey kick|rear kick|frog pump/.test(t)?"Glutes":/squat|leg press|lunge|step.?up/.test(t)?"Quadriceps":/back extension|hyperextension|superman/.test(t)||/deadlift|rack pull/.test(t)?"Lower Back":/lateral raise|side raise|side delt|\blat raise\b|upright row/.test(t)?"Lateral Deltoid":/rear delt|reverse fly|reverse flye|face pull|reverse pec deck/.test(t)?"Posterior Deltoid":/front raise|shoulder press|overhead press|arnold|military press|landmine press|push press|viking press/.test(t)?"Anterior Deltoid":/pulldown|pull.?down|pull.?up|chin.?up|pullover|straight.?arm/.test(t)?"Lats":/shrug/.test(t)?"Traps":/tricep|pushdown|skull ?crusher|close.?grip bench|jm press|french press|bench dip/.test(t)?"Triceps":/wrist curl|reverse curl|forearm|farmer|gripper|dead hang/.test(t)?"Forearms":/bicep|\bcurl\b/.test(t)?"Biceps":/\brow\b|rear pull|high pull/.test(t)?"Upper Back":/bench|chest|\bpec\b|pec deck|crossover|butterfly|push.?up|floor press|squeeze press|\bfly\b|\bflye\b/.test(t)?"Pectorals":/russian twist|woodchop|wood chop|side plank|side bend|oblique|pallof|rotation/.test(t)?"Obliques":/crunch|sit.?up|plank|leg raise|knee raise|ab wheel|ab roll|hanging|toes.?to.?bar|v.?up|dead bug|mountain climber/.test(t)?"Abs":/\bdip\b/.test(t)?"Triceps":e.category||"Other":e?.category||"Other"}var Ps=/\b(bike|biking|treadmill|run|running|cardio|step.?mill|elliptical|stair.?master|stair.?climber|jog|jogging|cycling|spinning|spin class|rowing machine|row machine|\berg\b|sprints?|jump.?rope|skipping rope|swim|swimming|hike|hiking)\b/,Os={Quadriceps:"Legs",Hamstrings:"Legs",Adductors:"Legs",Abductors:"Legs",Glutes:"Glutes",Calves:"Calves",Pectorals:"Chest","Anterior Deltoid":"Shoulders","Lateral Deltoid":"Shoulders","Posterior Deltoid":"Shoulders",Lats:"Back","Upper Back":"Back",Traps:"Back","Lower Back":"Back",Biceps:"Biceps",Triceps:"Triceps",Forearms:"Forearms",Abs:"Core",Obliques:"Core"};function Dt(e){let t=(e||"").toLowerCase().trim();if(!t)return"Full Body";if(Ps.test(t))return"Cardio";let s=R({name:t,category:""});return Os[s]||"Full Body"}async function At(){if((await A("exercises")).length>0)return 0;let t=Date.now(),s=qs.map(([o,n,i])=>({id:F(),name:o,category:n,equipment:i,notes:"",isCustom:!1,createdAt:t}));return await re("exercises",s),s.length}var Tt="workout";function Bt(e){Tt!==e&&(Tt=e,H("tab:changed",e))}var N=["Chest Day","Leg Day","Back/Bi Day"],Ce={"Chest Day":{key:"chest",short:"Chest",cssVar:"--day-chest"},"Leg Day":{key:"leg",short:"Legs",cssVar:"--day-leg"},"Back/Bi Day":{key:"back",short:"Back/Bi",cssVar:"--day-back"}};function Ie(e){let t=Ce[e];return t?`var(${t.cssVar})`:"var(--text-tertiary)"}function Xe(e){if(!e)return null;let t=e.toLowerCase();return t.includes("chest")?"Chest Day":t.includes("leg")&&!t.includes("curl")&&!t.includes("extension")?"Leg Day":t.includes("back")||t.includes("pull")?"Back/Bi Day":t.includes("push")?"Chest Day":null}function Je(e){for(let t of e){let s=Xe(t.name);if(s)return{name:t.name,normalized:s,startedAt:t.startedAt}}return null}function qe(e){let t=N.indexOf(e);return t===-1?N[0]:N[(t+1)%N.length]}var Ws={Pectorals:"#ec4899",Triceps:"#be185d","Anterior Deltoid":"#831843","Lateral Deltoid":"#f9a8d4",Quadriceps:"#facc15",Hamstrings:"#b45309",Glutes:"#f59e0b",Calves:"#fde68a",Adductors:"#bdb76b",Abductors:"#78350f",Lats:"#2563eb","Upper Back":"#38bdf8",Biceps:"#1e40af","Posterior Deltoid":"#bfdbfe",Traps:"#0891b2","Lower Back":"#475569",Forearms:"#22c55e",Abs:"#ef4444",Obliques:"#14b8a6",Other:"#6b7280"};function Ct(e){return Ws[e]??"#6b7280"}var Hs={Pectorals:"Chest Day",Triceps:"Chest Day","Anterior Deltoid":"Chest Day","Lateral Deltoid":"Chest Day",Quadriceps:"Leg Day",Hamstrings:"Leg Day",Glutes:"Leg Day",Calves:"Leg Day",Adductors:"Leg Day",Abductors:"Leg Day",Lats:"Back/Bi Day","Upper Back":"Back/Bi Day",Biceps:"Back/Bi Day","Posterior Deltoid":"Back/Bi Day",Traps:"Back/Bi Day","Lower Back":"Back/Bi Day",Forearms:"Back/Bi Day"};function Rs(e){return Hs[e]??null}function Fs(e,t,s){let o=Xe(e);if(o)return o;let n=new Map;for(let a of t){let u=s.get(a.exerciseId);if(!u)continue;let c=Rs(R(u));if(!c)continue;let p=(a.weight||0)*(a.reps||0);p<=0||n.set(c,(n.get(c)??0)+p)}let i=null,r=0;for(let[a,u]of n)u>r&&(i=a,r=u);return i}function It(e,t,s){let o=[...e].sort((r,a)=>r.startedAt-a.startedAt),n=new Map,i=null;for(let r of o){let a=Fs(r.name,t.get(r.id)??[],s);a||(i?Pt(i.startedAt,r.startedAt)?a=i.day:a=qe(i.day):a=N[0]),n.set(r.id,a),i={day:a,startedAt:r.startedAt}}return n}function qt(e){let t=parseInt(e.slice(1),16);return((t>>16&255)*299+(t>>8&255)*587+(t&255)*114)/1e3>=150?"#1c1c1e":"#ffffff"}function Pt(e,t){let s=new Date(e),o=new Date(t);return s.getFullYear()===o.getFullYear()&&s.getMonth()===o.getMonth()&&s.getDate()===o.getDate()}function Ns(e,t){let s=Xe(t?.name);if(s)return s;let o=Je(e);return o?Pt(o.startedAt,Date.now())?o.normalized:qe(o.normalized):N[0]}var js="lift-today-day";async function ne(){try{let[e,t]=await Promise.all([X(),ce()]),s=Ns(e,t),o=Ce[s].key;document.documentElement.dataset.day!==o&&(document.documentElement.dataset.day=o);try{localStorage.setItem(js,o)}catch{}return s}catch{return null}}var Ot="lift-migrations-done-v2";async function Ze(){let e=await xt();e.exercises>0&&console.info(`Removed ${e.exercises} cardio exercise(s), ${e.sets} set(s), ${e.workouts} cardio-only workout(s).`);let t=await St(Dt);if(t.recategorized>0||t.deleted>0){console.info(`Reorganized "Other": recategorized ${t.recategorized}, removed ${t.deleted} cardio, dropped ${t.workouts} empty workout(s).`);let i=[];t.recategorized>0&&i.push(`sorted ${t.recategorized} exercise${t.recategorized===1?"":"s"}`),t.deleted>0&&i.push(`removed ${t.deleted} cardio`),I(`Cleaned up \u201COther\u201D: ${i.join(", ")}.`)}let s=await kt();s>0&&console.info(`Stripped equipment from ${s} exercise name(s).`);let o=await bt();o>0&&I(`Merged Butterfly into Chest Fly (${o} sets moved).`);let n=await $t();n>0&&console.info(`Set a per-dose amount on ${n} medication(s).`)}async function Wt(){try{if(localStorage.getItem(Ot))return}catch{}await Ze();try{localStorage.setItem(Ot,String(Date.now()))}catch{}}var Pe="lift-backup-passphrase";var Ht="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";function et(e){let t=new Uint8Array(e),s="",o=32768;for(let n=0;n<t.length;n+=o)s+=String.fromCharCode.apply(null,t.subarray(n,n+o));return btoa(s)}var tt=e=>Uint8Array.from(atob(e),t=>t.charCodeAt(0));function zs(){let t=[...crypto.getRandomValues(new Uint8Array(20))].map(s=>Ht[s%Ht.length]);return[0,5,10,15].map(s=>t.slice(s,s+5).join("")).join("-")}function st(){let e=null;try{e=localStorage.getItem(Pe)}catch{}if(!e){e=zs();try{localStorage.setItem(Pe,e)}catch{}}return e}function Rt(){try{return localStorage.getItem(Pe)}catch{return null}}function Ft(e){try{localStorage.setItem(Pe,e)}catch{}}async function Nt(e,t){let s=await crypto.subtle.importKey("raw",new TextEncoder().encode(e),"PBKDF2",!1,["deriveKey"]);return crypto.subtle.deriveKey({name:"PBKDF2",hash:"SHA-256",salt:t,iterations:25e4},s,{name:"AES-GCM",length:256},!1,["encrypt","decrypt"])}function jt(e){return!!e&&e.lift==="encrypted-backup"&&typeof e.data=="string"}async function zt(e,t){let s=crypto.getRandomValues(new Uint8Array(16)),o=crypto.getRandomValues(new Uint8Array(12)),n=await Nt(t,s),i=new TextEncoder().encode(JSON.stringify(e)),r=await crypto.subtle.encrypt({name:"AES-GCM",iv:o},n,i);return{lift:"encrypted-backup",v:1,exportedAt:new Date().toISOString(),kdf:{name:"PBKDF2",hash:"SHA-256",iterations:25e4,salt:et(s)},cipher:"AES-GCM",iv:et(o),data:et(r)}}async function ot(e,t){let s=tt(e.kdf.salt),o=tt(e.iv),n=await Nt(t,s),i;try{i=await crypto.subtle.decrypt({name:"AES-GCM",iv:o},n,tt(e.data))}catch{throw new Error("Wrong backup password (or the file is damaged).")}return JSON.parse(new TextDecoder().decode(i))}async function Us(){let[e,t,s,o,n,i]=await Promise.all([A("exercises"),A("workouts"),A("sets"),A("stateOfMind"),A("medications"),A("doseEvents")]);return{version:2,exportedAt:new Date().toISOString(),exercises:e,workouts:t,sets:s,stateOfMind:o,medications:n,doseEvents:i}}function Vs(){let e=new Date,t=s=>String(s).padStart(2,"0");return`lift-backup-${e.getFullYear()}${t(e.getMonth()+1)}${t(e.getDate())}-${t(e.getHours())}${t(e.getMinutes())}${t(e.getSeconds())}.json`}async function nt(){let e=await Us(),t=st(),s=await zt(e,t),o=JSON.stringify(s),n=new Blob([o],{type:"application/json"}),i=URL.createObjectURL(n),r=Vs(),a=document.createElement("a");return a.href=i,a.download=r,a.style.display="none",document.body.appendChild(a),a.click(),setTimeout(()=>{document.body.removeChild(a),URL.revokeObjectURL(i)},1e3),{filename:r,bytes:n.size,snapshot:e}}async function _s(e){let t=Rt();if(t)try{return await ot(e,t)}catch{}for(let s=0;s<3;s++){let o=prompt("Enter your backup password (saved in your Passwords app):");if(o==null)throw new Error("Restore cancelled.");try{let n=await ot(e,o.trim());return Ft(o.trim()),n}catch(n){if(s===2)throw n;alert("Wrong password \u2014 try again.")}}}async function Ys(e){let t=JSON.parse(await e.text()),s=jt(t)?await _s(t):t;if(!s||!Array.isArray(s.exercises)||!Array.isArray(s.workouts)||!Array.isArray(s.sets))throw new Error("File doesn't look like a Lift backup.");return await ht({exercises:s.exercises,workouts:s.workouts,sets:s.sets,stateOfMind:s.stateOfMind??[],medications:s.medications??[],doseEvents:s.doseEvents??[]}),await Ze(),{exercises:s.exercises.length,workouts:s.workouts.length,sets:s.sets.length,stateOfMind:(s.stateOfMind??[]).length}}function Ut(){let e=st();W({html:`
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
    `,onMount(t,s){t.querySelector("#bk-close").addEventListener("click",()=>s()),t.querySelector("#bk-copy").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(e),I("Password copied \u2014 save it in your Passwords app")}catch{I("Copy failed \u2014 long-press the password to select it")}}),t.querySelector("#bk-export").addEventListener("click",async()=>{try{let{filename:n,bytes:i}=await nt();I(`Exported ${n} (${Ks(i)})`)}catch(n){I(`Export failed: ${n.message}`)}});let o=t.querySelector("#bk-file");t.querySelector("#bk-import").addEventListener("click",()=>{o.value="",o.click()}),o.addEventListener("change",async n=>{let i=n.target.files?.[0];if(i&&confirm("Replace all current data with this backup? This cannot be undone."))try{let r=await Ys(i);s(),I(`Restored ${r.workouts} workouts, ${r.exercises} exercises`),H("data:changed")}catch(r){I(`Restore failed: ${r.message}`)}})}})}function Ks(e){return e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/(1024*1024)).toFixed(1)} MB`}var Oe=[{key:"1W",tick:"1W",days:7},{key:"1M",tick:"1M",days:30},{key:"3M",tick:"3M",days:90},{key:"1Y",tick:"1Y",days:365},{key:"All",tick:"All",all:!0}];function Gs(e){let t=new Map;for(let s of e){let o=new Date(s.date),n=`${o.getFullYear()}-${o.getMonth()}-${o.getDate()}`,i=t.get(n)||{date:s.date,total:0,count:0};i.total+=s.value,i.count+=1,i.date=Math.min(i.date,s.date),t.set(n,i)}return[...t.values()].map(s=>({date:s.date,value:s.total/s.count})).sort((s,o)=>s.date-o.date)}function ye(e,t,s={}){let o=t.length>0&&t[0].points!==void 0,n=(o?t:[{points:t}]).map(f=>({label:f.label??"",color:f.color||"var(--accent)",points:Gs(f.points)})).filter(f=>f.points.length>0),i=s.defaultPeriod||"All",r=Math.max(0,Oe.findIndex(f=>f.key===i)),a=Oe.length-1,u=null;function c(){let f=Oe[r],d=n.map((k,D)=>u===null||D===u?k.points:[]);if(f.all)return d;let g=Date.now()-f.days*864e5,w=d.map(k=>k.filter(D=>D.date>=g));return w.every(k=>k.length===0)?d.map(k=>k.slice(-1)):w}let p=o&&n.some(f=>f.label)?`<div class="chart-legend">${n.map((f,d)=>`<button class="legend-item" data-i="${d}" style="--dcolor: ${f.color};" aria-pressed="false">${f.label}</button>`).join("")}</div>`:"";e.innerHTML=`
    <div class="chart-scrub-readout" data-role="scrub"></div>
    ${p}
    <div class="chart-container" data-role="chart"></div>
    <div class="chart-daterange" data-role="range"></div>
    <div class="chart-slider">
      <input type="range" class="chart-range" min="0" max="${a}" step="1"
             value="${r}" aria-label="Time range" />
      <div class="chart-slider-ticks">
        ${Oe.map((f,d)=>`<span data-i="${d}">${f.tick}</span>`).join("")}
      </div>
    </div>
  `;let v=e.querySelector('[data-role="scrub"]'),l=e.querySelector('[data-role="chart"]'),m=e.querySelector('[data-role="range"]'),b=e.querySelector(".chart-range"),E=[...e.querySelectorAll(".chart-slider-ticks span")],y=s.unit||"lbs",h=null;function M(){let f=c(),d=Qs(f,n,y);l.innerHTML=d.html,h=d.geom;let g=f.flat();if(g.length>=2){let w=Math.min(...g.map(D=>D.date)),k=Math.max(...g.map(D=>D.date));m.innerHTML=`<span>${it(w)}</span><span>${it(k)}</span>`}else m.innerHTML="";E.forEach((w,k)=>w.classList.toggle("active",k===r))}b.addEventListener("input",()=>{r=Number(b.value),T(),M()});let S=[...e.querySelectorAll(".chart-legend .legend-item")];for(let f of S)f.addEventListener("click",()=>{let d=Number(f.dataset.i);u=u===d?null:d,S.forEach((g,w)=>{g.classList.toggle("dimmed",u!==null&&w!==u),g.setAttribute("aria-pressed",String(u===w))}),T(),M()});function $(f){if(!h||h.pts.length<2)return;let d=l.querySelector("svg"),g=d?.getScreenCTM();if(!g)return;let w=new DOMPoint(f,0).matrixTransform(g.inverse()).x,k=0,D=1/0;h.pts.forEach((O,V)=>{let _=Math.abs(O.x-w);_<D&&(D=_,k=V)});let L=h.pts[k],C=d.querySelector(".chart-scrub-line"),P=d.querySelector(".chart-scrub-dot");C&&(C.setAttribute("x1",L.x),C.setAttribute("x2",L.x),C.removeAttribute("visibility")),P&&(P.setAttribute("cx",L.x),P.setAttribute("cy",L.y),P.style.fill=L.color,P.removeAttribute("visibility"));let U=L.label?` \xB7 ${L.label}`:"";v.textContent=`${it(L.date)}${U} \xB7 ${Math.round(L.value).toLocaleString()} ${y}`}function T(){v.textContent="";let f=l.querySelector("svg");f?.querySelector(".chart-scrub-line")?.setAttribute("visibility","hidden"),f?.querySelector(".chart-scrub-dot")?.setAttribute("visibility","hidden")}let B=!1;l.addEventListener("pointerdown",f=>{B=!0,l.setPointerCapture?.(f.pointerId),$(f.clientX)}),l.addEventListener("pointermove",f=>{B&&$(f.clientX)});for(let f of["pointerup","pointercancel"])l.addEventListener(f,()=>{B=!1,T()});M()}function it(e){return new Date(e).toLocaleDateString(void 0,{month:"short",day:"numeric",year:"numeric"})}function Qs(e,t,s){let i={top:16,right:14,bottom:14,left:52},r=400-i.left-i.right,a=200-i.top-i.bottom,u=e.flat();if(u.length===0)return{html:`<svg viewBox="0 0 400 200"><text x="${400/2}" y="${200/2}" text-anchor="middle" class="chart-axis-label">No data in range</text></svg>`,geom:null};if(u.length===1){let k=u[0],D=t[e.findIndex(P=>P.length>0)]?.color||"var(--accent)",L=i.left+r/2,C=i.top+a/2;return{html:`<svg viewBox="0 0 400 200"><circle cx="${L}" cy="${C}" r="4" class="chart-point" style="fill: ${D};"/><text x="${L}" y="${C-10}" text-anchor="middle" class="chart-axis-label">${Math.round(k.value).toLocaleString()} ${s}</text></svg>`,geom:null}}let c=u.map(k=>k.date),p=u.map(k=>k.value),v=Math.min(...c),l=Math.max(...c),m=Math.max(...p),b=Math.min(...p),E=Math.max(m-b,1),y=Math.max(0,b-E*.12),h=m+E*.12,M=k=>i.left+(k-v)/Math.max(l-v,1)*r,S=k=>i.top+a-(k-y)/(h-y)*a,$=4,T=k=>Math.round(k).toLocaleString(),B=Array.from({length:$+1},(k,D)=>{let L=y+(h-y)*D/$,C=S(L);return`<text x="${i.left-6}" y="${C+3}" text-anchor="end" class="chart-axis-label">${T(L)}</text>`}).join(""),f=Array.from({length:$+1},(k,D)=>{let L=i.top+a*D/$;return`<line x1="${i.left}" x2="${400-i.right}" y1="${L}" y2="${L}" class="chart-axis-line"/>`}).join(""),d=[],g=e.map((k,D)=>{let L=t[D],C=k.map(P=>({x:M(P.date),y:S(P.value)}));return k.forEach((P,U)=>d.push({...C[U],date:P.date,value:P.value,label:L.label,color:L.color})),C.length===0?"":C.length===1?`<circle cx="${C[0].x}" cy="${C[0].y}" r="3.5" class="chart-point" style="fill: ${L.color};"/>`:`<path d="${Xs(C)}" class="chart-line" style="stroke: ${L.color};"/>`}).join("");return{html:`
    <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet">
      ${f}
      ${B}
      ${g}
      <line class="chart-scrub-line" y1="${i.top}" y2="${i.top+a}" x1="0" x2="0" visibility="hidden"/>
      <circle class="chart-scrub-dot" r="4.5" visibility="hidden"/>
    </svg>
  `,geom:{pts:d}}}function Xs(e){if(e.length<2)return"";let t=`M ${e[0].x.toFixed(1)} ${e[0].y.toFixed(1)}`;for(let s=0;s<e.length-1;s++){let o=e[s===0?0:s-1],n=e[s],i=e[s+1],r=e[s+2]||i,a=n.x+(i.x-o.x)/6,u=n.y+(i.y-o.y)/6,c=i.x-(r.x-n.x)/6,p=i.y-(r.y-n.y)/6;t+=` C ${a.toFixed(1)} ${u.toFixed(1)}, ${c.toFixed(1)} ${p.toFixed(1)}, ${i.x.toFixed(1)} ${i.y.toFixed(1)}`}return t}var Z=null;function Vt(e){let t=!0;return _t().then(s=>{t&&(Z=s,We(e))}).catch(s=>{t&&(e.container.innerHTML=J(s))}),()=>{t=!1}}async function _t(){let[e,t,s]=await Promise.all([X(),A("sets"),A("exercises")]),o=new Map(s.map(b=>[b.id,b])),n=new Map;for(let b of Q(t))n.has(b.workoutId)||n.set(b.workoutId,[]),n.get(b.workoutId).push(b);let i=0,r=0,a=new Map,u=new Map,c=new Map,p=It(e,n,o);for(let b of e){let E=n.get(b.id)||[],y=E.reduce((h,M)=>h+M.weight*M.reps,0);if(i+=y,r+=E.length,y>0){let h=p.get(b.id);a.has(h)||a.set(h,[]),a.get(h).push({date:b.startedAt,value:y})}for(let h of E){let M=o.get(h.exerciseId);if(!M)continue;let S=u.get(h.exerciseId)||{id:h.exerciseId,exercise:M,count:0};if(S.count+=1,u.set(h.exerciseId,S),h.weight>0&&h.reps>0){let $=c.get(h.exerciseId);(!$||h.weight>$.weight||h.weight===$.weight&&h.reps>$.reps)&&c.set(h.exerciseId,{id:h.exerciseId,weight:h.weight,reps:h.reps,date:b.startedAt,name:K(M)})}}}let v=Array.from(u.entries()).sort((b,E)=>E[1].count-b[1].count).map(([,b])=>b),l=Array.from(c.values()).sort((b,E)=>E.weight-b.weight),m=N.filter(b=>a.has(b)).map(b=>({label:Ce[b].short,color:Ie(b),points:a.get(b)}));return{workouts:e,allSets:t,allExercises:s,exMap:o,setsByWorkout:n,totalVolume:i,totalSets:r,volumeSeries:m,topExercises:v,prs:l}}function We(e){if(e.setTitle("Progress"),e.setBack(null),e.setAction({label:"Backup and restore",html:Lt(),onClick:()=>Ut()}),e.container.scrollTop=0,!Z||Z.workouts.length===0){e.container.innerHTML=`
      <div class="empty-state">
        <div class="empty-icon">\u{1F4C8}</div>
        <h2>No data yet</h2>
        <p>Finish a workout and your stats and trends will show up here.</p>
      </div>
    `;return}let{workouts:t,totalVolume:s,totalSets:o,volumeSeries:n,topExercises:i,prs:r}=Z;e.container.innerHTML=`
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
  `;let a=e.container.querySelector(".volume-chart-mount");a&&n.length>0&&ye(a,n,{unit:"lbs"});for(let u of e.container.querySelectorAll("[data-page]"))u.addEventListener("click",()=>{let c=u.dataset.page;c==="trained"?Js(e):c==="prs"?Zs(e):c==="history"&&Yt(e)})}function Js(e){e.setTitle("Most-Trained"),e.setBack(()=>We(e)),e.setAction(null);let{topExercises:t}=Z;e.container.innerHTML=`
    <div class="list" style="margin-top: 16px;">
      ${t.map(s=>`
        <button class="list-row" data-exercise-id="${x(s.id)}">
          ${se(s.exercise)}
          <div class="row-trailing trailing-stack">${oe(s.count)}</div>
          <div class="chevron">\u203A</div>
        </button>
      `).join("")}
    </div>
  `,e.container.scrollTop=0,rt(e)}function Zs(e){e.setTitle("Personal Records"),e.setBack(()=>We(e)),e.setAction(null);let{prs:t}=Z;e.container.innerHTML=`
    <div class="section-footer" style="margin-top: 16px;">Heaviest set ever recorded per exercise.</div>
    <div class="list">
      ${t.map(s=>`
        <button class="list-row" data-exercise-id="${x(s.id)}" style="align-items: flex-start;">
          <div class="row-main">
            <div class="row-title">${x(s.name)}</div>
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
  `,e.container.scrollTop=0,rt(e)}function rt(e){for(let t of e.container.querySelectorAll("[data-exercise-id]"))t.addEventListener("click",()=>{He(t.dataset.exerciseId)})}function Yt(e){e.setTitle("Workout History"),e.setBack(()=>We(e)),e.setAction(null);let{workouts:t,setsByWorkout:s,exMap:o}=Z;e.container.innerHTML=`
    <div class="list" style="margin-top: 16px;">
      ${t.map(n=>eo(n,s.get(n.id)||[],o)).join("")}
    </div>
  `,e.container.scrollTop=0;for(let n of e.container.querySelectorAll("[data-workout-id]"))n.addEventListener("click",()=>{let i=n.dataset.workoutId;to(e,i).catch(r=>{e.container.innerHTML=J(r)})})}function eo(e,t,s){let o=t,n=o.reduce((u,c)=>u+c.weight*c.reps,0),i=(e.endedAt-e.startedAt)/1e3,r=[],a=new Set;for(let u of t){if(a.has(u.exerciseId))continue;a.add(u.exerciseId);let c=s.get(u.exerciseId);if(c&&r.push(c.name),r.length>=3)break}return`
    <button class="list-row" data-workout-id="${e.id}">
      <div class="row-main">
        <div class="row-title" style="font-weight: 600;">${x(e.name)}</div>
        <div class="row-subtitle" style="margin-top: 4px;">
          ${z(e.startedAt)} \xB7 ${Ke(i)} \xB7 ${o.length} sets \xB7 ${le(n)}
        </div>
        ${r.length>0?`<div class="row-subtitle" style="margin-top: 4px;">${x(r.join(" \xB7 "))}${a.size>3?" \u2026":""}</div>`:""}
      </div>
      <div class="chevron">\u203A</div>
    </button>
  `}async function Kt(e){let[t,s,o]=await Promise.all([te("workouts",e),A("exercises"),yt(e)]);if(!t)return null;let n=new Map(s.map(l=>[l.id,l])),i=new Map,r=[];for(let l of o)i.has(l.exerciseId)||(i.set(l.exerciseId,[]),r.push(l.exerciseId)),i.get(l.exerciseId).push(l);let a=Q(o),u=a.reduce((l,m)=>l+m.weight*m.reps,0),c=a.length,p=(t.endedAt-t.startedAt)/1e3,v=`
    <div class="section">Summary</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Date</div><div class="stat-value">${Et(t.startedAt)}</div></div>
      <div class="stat-row"><div class="stat-label">Duration</div><div class="stat-value">${Ke(p)}</div></div>
      <div class="stat-row"><div class="stat-label">Total Volume</div><div class="stat-value">${le(u)}</div></div>
      <div class="stat-row"><div class="stat-label">Completed Sets</div><div class="stat-value">${c}</div></div>
    </div>

    ${r.map(l=>{let m=n.get(l),b=i.get(l),E=0,y=0;return`
        ${m?`<button class="section section-link" data-exercise-id="${x(l)}">${x(K(m))}<span class="name-chevron">\u203A</span></button>`:'<div class="section">Unknown exercise</div>'}
        <div class="form-section">
          ${b.map(M=>{let $=(M.setType||"working")==="warmup"?`W${++y}`:String(++E);return`
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
  `;return{workout:t,html:v,sets:o}}function Gt(e,t){for(let s of e.querySelectorAll("input.hist-input[data-set-id]"))s.addEventListener("input",async()=>{let o=t.find(n=>n.id===s.dataset.setId);o&&(s.dataset.field==="weight"?o.weight=parseFloat(s.value)||0:o.reps=parseInt(s.value,10)||0,await q("sets",{...o}))})}async function to(e,t){e.setBack(async()=>{Z=await _t(),Yt(e)}),e.setAction({label:"Delete workout",html:Ae(),onClick:async()=>{confirm("Delete this workout?")&&(await De(t),H("data:changed"))}});let s=await Kt(t);if(!s){e.container.innerHTML=J({message:"Workout not found."});return}e.setTitle(s.workout.name),e.container.innerHTML=s.html,e.container.scrollTop=0,rt(e),Gt(e.container,s.sets)}async function Qt(e){let t=await Kt(e);if(!t)return;let s=W({html:`
      <div class="sheet-header">
        <button class="btn-text" id="wd-close">Done</button>
        <div class="title">${x(t.workout.name)}</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">${t.html}</div>
    `,onMount(o){o.querySelector("#wd-close").addEventListener("click",()=>s());for(let n of o.querySelectorAll("[data-exercise-id]"))n.addEventListener("click",()=>He(n.dataset.exerciseId));Gt(o,t.sets)}})}function Xt(e){let t=!0;return Jt(e).catch(s=>{t&&(e.container.innerHTML=J(s))}),()=>{t=!1}}async function Jt(e){e.setTitle("Exercises"),e.setBack(null),e.setAction({label:"Add exercise",html:'<span style="font-size: 24px;">+</span>',onClick:()=>{ge(null)}});let[t,s]=await Promise.all([A("exercises"),A("sets")]),o=t.sort((l,m)=>l.name.localeCompare(m.name)),n=new Map;for(let l of s)n.set(l.exerciseId,(n.get(l.exerciseId)??0)+1);let i="",r=null;e.container.innerHTML=`
    <div class="search-bar">
      <input class="search-input" id="ex-search" placeholder="Search exercises" />
    </div>
    <div class="chip-row" id="ex-chips"></div>
    <div class="list" id="ex-list"></div>
  `,e.container.scrollTop=0;let a=e.container.querySelector("#ex-list"),u=e.container.querySelector("#ex-chips"),c=e.container.querySelector("#ex-search");function p(){u.innerHTML=Be(o,r);for(let l of u.querySelectorAll(".chip"))l.addEventListener("click",()=>{let m=l.dataset.cat;r=m==="All"?null:m,p(),v()})}function v(){let l=o.filter(m=>!r||R(m)===r).filter(m=>!i||m.name.toLowerCase().includes(i.toLowerCase()));if(l.length===0){a.innerHTML='<div class="list-row"><div class="row-main" style="color: var(--text-secondary);">No matches</div></div>';return}a.innerHTML=l.map(m=>`
        <button class="list-row" data-id="${m.id}">
          ${se(m)}
          <div class="row-trailing trailing-stack">${oe(n.get(m.id)??0)}</div>
          <div class="chevron">\u203A</div>
        </button>
      `).join("");for(let m of a.querySelectorAll("[data-id]"))m.addEventListener("click",()=>{so(e,m.dataset.id).catch(b=>{e.container.innerHTML=J(b)})})}c.addEventListener("input",()=>{i=c.value,v()}),p(),v()}function so(e,t){return Re(e,t,()=>Jt(e))}async function Re(e,t,s){e.setBack(s);let o=await es(t);if(!o){e.container.innerHTML=J({message:"Exercise not found."});return}e.setTitle(K(o.exercise)),e.setAction(o.exercise.isCustom?{label:"Delete exercise",html:Ae(),onClick:async()=>{if(o.completed.length>0){alert(`Can't delete \u2014 this exercise has ${o.completed.length} logged set${o.completed.length===1?"":"s"}.`);return}confirm("Delete this custom exercise?")&&(await ae("exercises",t),H("data:changed"))}}:null),e.container.innerHTML=o.html,e.container.scrollTop=0,e.container.querySelector("#exd-edit")?.addEventListener("click",()=>{ge(o.exercise,()=>Re(e,t,s))}),Zt(e.container);let n=e.container.querySelector(".exercise-chart-mount");n&&o.chartData.length>0&&ye(n,o.chartData,{unit:"lbs"})}function Zt(e){for(let t of e.querySelectorAll(".recent-set[data-workout-id]"))t.addEventListener("click",()=>Qt(t.dataset.workoutId))}async function He(e){let t=await es(e);if(!t)return;let s=W({html:`
      <div class="sheet-header">
        <button class="btn-text" id="exd-close">Done</button>
        <div class="title">${x(K(t.exercise))}</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">${t.html}</div>
    `,onMount(o){o.querySelector("#exd-close").addEventListener("click",()=>s()),o.querySelector("#exd-edit")?.addEventListener("click",()=>{ge(t.exercise,()=>{s(),H("data:changed"),He(e)})}),Zt(o);let n=o.querySelector(".exercise-chart-mount");n&&t.chartData.length>0&&ye(n,t.chartData,{unit:"lbs"})}})}async function es(e){let[t,s,o,n]=await Promise.all([te("exercises",e),A("sets"),A("workouts"),ce()]);if(!t)return null;let i=new Map(o.map(l=>[l.id,l])),r=Q(s).filter(l=>l.exerciseId===e&&l.workoutId!==n?.id&&i.has(l.workoutId)).map(l=>({...l,workout:i.get(l.workoutId)})).sort((l,m)=>l.workout.startedAt-m.workout.startedAt),a=r.reduce((l,m)=>l+m.weight*m.reps,0),u=r.reduce((l,m)=>!l||m.weight>l.weight||m.weight===l.weight&&m.reps>l.reps?m:l,null),c=new Map;for(let l of r){if(l.weight<=0||l.reps<=0||(l.setType||"working")==="warmup")continue;let m=c.get(l.workoutId)||{date:l.workout.startedAt,total:0,count:0};m.total+=l.weight*l.reps,m.count+=1,c.set(l.workoutId,m)}let p=Array.from(c.values()).map(({date:l,total:m,count:b})=>({date:l,value:m/b})).sort((l,m)=>l.date-m.date),v=`
    <div class="section">Details</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Equipment</div><div class="stat-value">${x(t.equipment)}</div></div>
      <div class="stat-row"><div class="stat-label">Muscle</div><div class="stat-value">${x(R(t))}</div></div>
      <button class="list-row button" id="exd-edit">
        <div class="row-main"><div class="row-title" style="color: var(--accent);">Edit Name, Muscle & Equipment</div></div>
      </button>
    </div>

    ${r.length>0?`
      <div class="section">Stats</div>
      <div class="form-section">
        <div class="stat-row"><div class="stat-label">Total Sets</div><div class="stat-value">${r.length.toLocaleString()}</div></div>
        <div class="stat-row"><div class="stat-label">Total Volume</div><div class="stat-value">${le(a)}</div></div>
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
        ${r.slice(-30).reverse().map(l=>`
          <button class="stat-row recent-set" data-workout-id="${x(l.workoutId)}">
            <div class="stat-label" style="font-size: 13px; color: var(--text-secondary);">${z(l.workout.startedAt)}</div>
            <div class="stat-value" style="color: var(--text);">${ve(l.weight)} \xD7 ${l.reps} <span class="name-chevron">\u203A</span></div>
          </button>
        `).join("")}
      </div>
    `:`
      <div class="empty-state" style="padding: 32px 24px;">
        <p style="color: var(--text-secondary);">No completed sets yet.</p>
      </div>
    `}
  `;return{exercise:t,completed:r,chartData:p,html:v}}var os=["Amazed","Excited","Happy","Joyful","Content","Calm","Relieved","Grateful","Hopeful","Confident","Proud","Surprised","Indifferent","Anxious","Stressed","Overwhelmed","Frustrated","Angry","Irritated","Sad","Lonely","Discouraged","Drained","Worried","Embarrassed"],ns=["Health","Fitness","Self-Care","Hobbies","Identity","Community","Family","Friends","Partner","Work","Education","Money","Weather","Tasks"],at=[["taken","Taken"],["skipped","Skipped"],["snoozed","Snoozed"],["notInteracted","Not interacted"]],oo=new Set(["taken","skipped","snoozed","notInteracted"]);function no(e){let t=Number(e);return isFinite(t)?Math.max(-1,Math.min(1,t)):0}async function is({id:e,kind:t,valence:s,labels:o,associations:n,date:i}){let r={id:e||F(),kind:t==="dailyMood"?"dailyMood":"momentaryEmotion",date:i||Date.now(),valence:no(s),labels:o||[],associations:n||[]};return await q("stateOfMind",r),r}async function rs({id:e,nickname:t,form:s,hasSchedule:o,doseAmount:n,doseUnit:i}){let r=(t||"").trim()||"Medication",a=e?await te("medications",e):null,u=Number(n),c={id:e||F(),nickname:r,isArchived:a?!!a.isArchived:!1,hasSchedule:!!o,doseAmount:u>0?u:1,doseUnit:(i||"").trim(),concept:{identifier:a?.concept?.identifier||"",displayText:a?.concept?.displayText||r,form:(s||"").trim(),rxnorm:a?.concept?.rxnorm||[]}};return await q("medications",c),c}async function ct({id:e,medicationId:t,status:s,date:o,doseQuantity:n}){let i={id:e||F(),medicationId:String(t),status:oo.has(s)?s:"taken",date:o||Date.now(),scheduledQuantity:0,doseQuantity:Number(n)||0};return await q("doseEvents",i),i}async function Fe(e,t){await ae(e,t)}async function lt(){let[e,t,s]=await Promise.all([A("stateOfMind"),A("medications"),A("doseEvents")]);return e.sort((o,n)=>o.date-n.date),s.sort((o,n)=>o.date-n.date),{stateOfMind:e,medications:t,doseEvents:s}}var ts=e=>{let t=new Date(e);return`${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`},ss=e=>e.length?e.reduce((t,s)=>t+s,0)/e.length:null;function as(e,t){let s=new Set(t.map(a=>ts(a.startedAt))),o=[],n=[];for(let a of e)(s.has(ts(a.date))?o:n).push(a.valence);let i=ss(o),r=ss(n);return{onWorkout:i,offWorkout:r,delta:i!=null&&r!=null?i-r:null,onCount:o.length,offCount:n.length}}function cs(e,t){let s=new Map;for(let o of t){if(o.status!=="taken"&&o.status!=="skipped")continue;let n=s.get(o.medicationId)??{taken:0,total:0};n.total+=1,o.status==="taken"&&(n.taken+=1),s.set(o.medicationId,n)}return e.map(o=>{let n=s.get(o.id)??{taken:0,total:0};return{medication:o,taken:n.taken,total:n.total,pct:n.total?n.taken/n.total:null}})}var io=Object.fromEntries(at),fs=e=>new Date(e).toLocaleTimeString(void 0,{hour:"numeric",minute:"2-digit"}),ms='<span style="font-size: 24px;">+</span>';async function dt(e,t){let s=()=>dt(e,t);e.setTitle("State of Mind"),e.setBack(t),e.setAction({html:ms,onClick:()=>ds(s)});let[{stateOfMind:o},n]=await Promise.all([lt(),X()]),i=as(o,n);e.container.innerHTML=`
    ${o.length?`
      <div class="section">Summary</div>
      <div class="form-section">
        <div class="stat-row"><div class="stat-label">Entries</div><div class="stat-value">${o.length.toLocaleString()}</div></div>
        <div class="stat-row"><div class="stat-label">Range</div><div class="stat-value">${z(o[0].date)} \u2013 ${z(o[o.length-1].date)}</div></div>
        <div class="stat-row"><div class="stat-label">Average mood</div><div class="stat-value">${Ne(uo(o))}</div></div>
      </div>

      <div class="section">Mood vs. training</div>
      <div class="form-section">
        <div class="stat-row"><div class="stat-label">On workout days</div><div class="stat-value">${i.onWorkout!=null?Ne(i.onWorkout)+` (${i.onCount})`:"\u2014"}</div></div>
        <div class="stat-row"><div class="stat-label">On rest days</div><div class="stat-value">${i.offWorkout!=null?Ne(i.offWorkout)+` (${i.offCount})`:"\u2014"}</div></div>
        <div class="stat-row"><div class="stat-label">Difference</div><div class="stat-value">${i.delta!=null?(i.delta>=0?"+":"")+i.delta.toFixed(2):"\u2014"}</div></div>
      </div>

      <div class="section">Recent entries</div>
      <div class="list">${o.slice(-30).reverse().map(ro).join("")}</div>
    `:vs("\u{1F9E0}","No mood entries","Tap \uFF0B to log how you're feeling.")}
  `,e.container.scrollTop=0;for(let r of e.container.querySelectorAll("[data-edit-som]")){let a=o.find(u=>u.id===r.dataset.editSom);a&&r.addEventListener("click",()=>ds(s,a))}}function ro(e){let t=e.kind==="dailyMood",s=e.labels.length?e.labels.join(", "):t?"Daily mood":"Momentary emotion",o=[...e.labels.length?[t?"Daily mood":"Moment"]:[],z(e.date),fs(e.date),...e.associations.length?[e.associations.join(", ")]:[]].join(" \xB7 ");return`
    <button class="list-row" data-edit-som="${x(e.id)}">
      <div class="row-main">
        <div class="row-title">${x(s)}</div>
        <div class="row-subtitle">${x(o)}</div>
      </div>
      <div class="row-trailing">${Ne(e.valence)}</div>
      <div class="chevron">\u203A</div>
    </button>`}async function ut(e,t){let s=()=>ut(e,t);e.setTitle("Medications"),e.setBack(t),e.setAction({html:ms,onClick:()=>us(s)});let{medications:o,doseEvents:n}=await lt(),i=cs(o,n),r=new Map(o.map(p=>[p.id,p])),a=n.slice(-20).reverse(),u=new Date;u.setHours(0,0,0,0);let c=new Map;for(let p of n)p.status==="taken"&&p.date>=u.getTime()&&c.set(p.medicationId,(c.get(p.medicationId)||0)+1);e.container.innerHTML=`
    ${o.length?`
      <div class="section">Your medications</div>
      ${i.map(p=>ao(p,c.get(p.medication.id)||0)).join("")}
      ${a.length?`
        <div class="section">Recent doses</div>
        <div class="list">${a.map(p=>lo(p,r)).join("")}</div>
      `:""}
    `:vs("\u{1F48A}","No medications","Tap \uFF0B to add one, then log each dose as you take it.")}
  `,e.container.scrollTop=0;for(let p of e.container.querySelectorAll("[data-take]"))p.addEventListener("click",async()=>{await ct({medicationId:p.dataset.take,status:p.dataset.status,date:Date.now(),doseQuantity:je(r.get(p.dataset.take))}),I(p.dataset.status==="taken"?"Logged as taken":"Logged as skipped"),s()});for(let p of e.container.querySelectorAll("[data-logat]"))p.addEventListener("click",()=>ps(o,s,p.dataset.logat));for(let p of e.container.querySelectorAll("[data-edit-dose]")){let v=n.find(l=>l.id===p.dataset.editDose);v&&p.addEventListener("click",()=>ps(o,s,null,v))}for(let p of e.container.querySelectorAll("[data-edit-med]")){let v=r.get(p.dataset.editMed);v&&p.addEventListener("click",()=>us(s,v))}}function ao(e,t){let s=e.medication,o=[s.concept.form||"No form set",e.pct!=null?`${Math.round(e.pct*100)}% taken (${e.taken}/${e.total})`:"no doses yet"].join(" \xB7 "),n=s.hasSchedule?t>0?'<span class="hz-pill" style="--pc: #2ba758;">\u2713 Taken today</span>':'<span class="hz-pill muted">Not taken today</span>':"";return`
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
    </div>`}var je=e=>Number(e?.doseAmount)>0?Number(e.doseAmount):1;function co(e,t){let s=(t||"").trim()||"dose",o=e===1||/^(mg|mcg|ml|cc|g|kg|l|oz|iu|puff|puffs)$/i.test(s)||s.endsWith("s")?s:`${s}s`;return`${po(e)} ${o}`}function lo(e,t){let s=t.get(e.medicationId),o=Number(e.doseQuantity)||0,n=[z(e.date),fs(e.date),...o>0?[co(o,s?.doseUnit)]:[]].join(" \xB7 ");return`
    <button class="list-row" data-edit-dose="${x(e.id)}">
      <div class="row-main">
        <div class="row-title">${x(s?s.nickname||s.concept.displayText:"Medication")}</div>
        <div class="row-subtitle">${x(n)}</div>
      </div>
      <div class="row-trailing">${x(io[e.status]||e.status)}</div>
      <div class="chevron">\u203A</div>
    </button>`}function vs(e,t,s){return`
    <div class="empty-state" style="padding: 48px 24px; min-height: auto;">
      <div class="empty-icon">${e}</div>
      <h2>${x(t)}</h2>
      <p>${x(s)}</p>
    </div>`}function uo(e){return e.reduce((t,s)=>t+s.valence,0)/e.length}var po=e=>Number.isInteger(e)?String(e):String(Number(e.toFixed(3)));function hs(e){return e>=.7?["Very pleasant","#2ba758"]:e>=.4?["Pleasant","#54a85a"]:e>=.1?["Slightly pleasant","#9cad46"]:e>-.1?["Neutral","#8a8a8e"]:e>-.4?["Slightly unpleasant","#d99a3c"]:e>-.7?["Unpleasant","#e07a4e"]:["Very unpleasant","#e0574f"]}function Ne(e){let[t,s]=hs(e);return`<span class="hz-pill" style="--pc: ${s};">${x(t)}</span>`}function pt(e){let t=new Date(e),s=o=>String(o).padStart(2,"0");return`${t.getFullYear()}-${s(t.getMonth()+1)}-${s(t.getDate())}T${s(t.getHours())}:${s(t.getMinutes())}`}var ys=()=>pt(Date.now());function gs(e){let t=e?new Date(e).getTime():NaN;return isFinite(t)?t:Date.now()}var fo=e=>Math.max(-3,Math.min(3,Math.round(e*3)));function ls(e,t=[]){return e.map(s=>`<button type="button" class="chip${t.includes(s)?" active":""}" data-chip="${x(s)}">${x(s)}</button>`).join("")}function we(e,t,s={}){for(let o of e.querySelectorAll(`${t} .chip`))o.addEventListener("click",()=>{s.single&&e.querySelectorAll(`${t} .chip`).forEach(n=>n.classList.remove("active")),o.classList.toggle("active",s.single?!0:!o.classList.contains("active"))})}var be=(e,t)=>[...e.querySelectorAll(`${t} .chip.active`)].map(s=>s.dataset.chip);function ds(e,t=null){let s=!!t,o=s&&t.kind==="dailyMood",n=s?fo(t.valence):1,i=s?t.valence:n/3,r=W({html:`
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
        <div class="chip-row" id="som-emotions" style="flex-wrap: wrap;">${ls(os,s?t.labels:[])}</div>
        <div class="section">What's affecting you? (optional)</div>
        <div class="chip-row" id="som-assoc" style="flex-wrap: wrap;">${ls(ns,s?t.associations:[])}</div>
        <div class="section">When</div>
        <div class="form-section">
          <div class="form-row"><input type="datetime-local" id="som-date" value="${s?pt(t.date):ys()}" style="text-align: left;" /></div>
        </div>
        ${s?`
        <div style="height: 8px;"></div>
        <div class="form-section">
          <button class="list-row button destructive" id="som-delete"><div class="row-main"><div class="row-title" style="color: var(--red);">Delete Entry</div></div></button>
        </div>`:""}
        <div style="height: 16px;"></div>
      </div>
    `,onMount(a){let u=a.querySelector("#som-val"),c=a.querySelector("#som-val-label"),p=()=>{c.textContent=hs(Number(u.value)/3)[0]};p(),u.addEventListener("input",()=>{i=Number(u.value)/3,p()}),we(a,"#som-kind",{single:!0}),we(a,"#som-emotions"),we(a,"#som-assoc"),a.querySelector("#som-cancel").addEventListener("click",()=>r()),a.querySelector("#som-save").addEventListener("click",async()=>{await is({id:t?.id,kind:be(a,"#som-kind")[0]||"momentaryEmotion",valence:i,labels:be(a,"#som-emotions"),associations:be(a,"#som-assoc"),date:gs(a.querySelector("#som-date").value)}),r(),I(s?"Entry updated":"Logged State of Mind"),e?.()}),a.querySelector("#som-delete")?.addEventListener("click",async()=>{confirm("Delete this entry?")&&(await Fe("stateOfMind",t.id),r(),I("Entry deleted"),e?.())})}})}function us(e,t=null){let s=!!t,o=s?!!t.hasSchedule:!0,n=W({html:`
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
          <div class="form-row"><input type="number" id="med-amount" inputmode="decimal" min="0" step="0.25" value="${s?x(String(je(t))):"1"}" style="text-align: left;" /></div>
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
    `,onMount(i){let r=i.querySelector("#med-name"),a=i.querySelector("#med-save");r.addEventListener("input",()=>{a.disabled=r.value.trim().length===0}),we(i,"#med-type",{single:!0}),i.querySelector("#med-cancel").addEventListener("click",()=>n()),a.addEventListener("click",async()=>{r.value.trim()&&(await rs({id:t?.id,nickname:r.value,form:i.querySelector("#med-form").value,hasSchedule:(be(i,"#med-type")[0]||"daily")==="daily",doseAmount:i.querySelector("#med-amount").value,doseUnit:i.querySelector("#med-unit").value}),n(),I(s?"Medication updated":"Medication added"),e?.())}),i.querySelector("#med-delete")?.addEventListener("click",async()=>{confirm("Delete this medication? Its logged doses stay in your history.")&&(await Fe("medications",t.id),n(),I("Medication deleted"),e?.())}),s||setTimeout(()=>r.focus(),50)}})}function ps(e,t,s,o=null){let n=!!o,i=e.filter(v=>!v.isArchived),r=i.length?i:e,a=n?o.medicationId:s,u=n?o.status:"taken",c=n?Number(o.doseQuantity)||1:je(r.find(v=>v.id===a)||r[0]),p=W({html:`
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
              ${r.map(v=>`<option value="${x(v.id)}"${v.id===a?" selected":""}>${x(v.nickname||v.concept.displayText)}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="section">Status</div>
        <div class="chip-row" id="dose-status">
          ${at.map(([v,l])=>`<button type="button" class="chip${v===u?" active":""}" data-chip="${v}">${x(l)}</button>`).join("")}
        </div>
        <div class="section">Amount</div>
        <div class="form-section">
          <div class="form-row"><input type="number" id="dose-qty" inputmode="decimal" min="0" step="0.25" value="${c}" style="text-align: left;" /></div>
        </div>
        <div class="section">When</div>
        <div class="form-section">
          <div class="form-row"><input type="datetime-local" id="dose-date" value="${n?pt(o.date):ys()}" style="text-align: left;" /></div>
        </div>
        ${n?`
        <div style="height: 8px;"></div>
        <div class="form-section">
          <button class="list-row button destructive" id="dose-delete"><div class="row-main"><div class="row-title" style="color: var(--red);">Delete Dose</div></div></button>
        </div>`:""}
        <div style="height: 16px;"></div>
      </div>
    `,onMount(v){if(we(v,"#dose-status",{single:!0}),!n){let l=v.querySelector("#dose-med"),m=v.querySelector("#dose-qty");l.addEventListener("change",()=>{m.value=String(je(e.find(b=>b.id===l.value)))})}v.querySelector("#dose-cancel").addEventListener("click",()=>p()),v.querySelector("#dose-save").addEventListener("click",async()=>{await ct({id:o?.id,medicationId:v.querySelector("#dose-med").value,status:be(v,"#dose-status")[0]||"taken",date:gs(v.querySelector("#dose-date").value),doseQuantity:Number(v.querySelector("#dose-qty").value)||0}),p(),I(n?"Dose updated":"Dose logged"),t?.()}),v.querySelector("#dose-delete")?.addEventListener("click",async()=>{confirm("Delete this dose?")&&(await Fe("doseEvents",o.id),p(),I("Dose deleted"),t?.())})}})}function xs(e){let t=!0,s=null;return e.container.innerHTML="",ce().then(o=>{t&&(o?s=yo(e,o):mo(e))}).catch(o=>{t&&(e.container.innerHTML=`<div class="empty-state"><div class="empty-icon">!</div><h2>Couldn't load</h2><p>${x(o.message)}</p></div>`)}),()=>{t=!1,typeof s=="function"&&s()}}async function mo(e){e.setTitle("Workout");let t=await X(),s=t[0],o=Je(t),n=o?qe(o.normalized):N[0],r=o&&ws(o.startedAt)==="today"?"Tomorrow":"Today",a=s?`<div class="last-workout-hint">Last: <strong>${x(s.name)}</strong> \xB7 ${ws(s.startedAt)}</div>`:"",u=`<div class="next-workout-hint">${r}: <strong>${x(n)}</strong></div>`;e.container.innerHTML=`
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
  `,e.container.querySelector("#start-btn").addEventListener("click",()=>vo(n,r));for(let c of e.container.querySelectorAll("[data-nav]"))c.addEventListener("click",()=>{c.dataset.nav==="mind"?dt(e,()=>e.refresh()):ut(e,()=>e.refresh())})}function ws(e){let t=new Date,s=new Date(e),o=i=>new Date(i.getFullYear(),i.getMonth(),i.getDate()).getTime(),n=Math.round((o(t)-o(s))/(1440*60*1e3));return n===0?"today":n===1?"yesterday":n<7?`${n} days ago`:n<14?"a week ago":`${Math.round(n/7)} weeks ago`}function vo(e,t="Today"){ho(e,async s=>{let o={id:F(),name:s,startedAt:Date.now(),endedAt:null,notes:""};await q("workouts",o),H("workout:changed")},t)}function ho(e,t,s="Today"){let n=W({html:`
      <div class="sheet-header">
        <button class="btn-text" id="wt-cancel">Cancel</button>
        <div class="title">New Workout</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">
        <div class="section">Pick a type</div>
        <div class="form-section">
          ${N.map(i=>{let a=i===e?` <span class="badge">${x(s)}</span>`:"";return`
              <button class="list-row button" data-name="${x(i)}">
                <div class="row-main"><div class="row-title" style="color: ${Ie(i)}; font-weight: 600;">${x(i)}${a}</div></div>
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
    `,onMount(i){i.querySelector("#wt-cancel").addEventListener("click",()=>n());for(let u of i.querySelectorAll(".list-row.button[data-name]"))u.addEventListener("click",()=>{let c=u.dataset.name;n(),t(c)});let r=i.querySelector("#wt-custom"),a=i.querySelector("#wt-go");r.addEventListener("input",()=>{a.disabled=r.value.trim().length===0}),a.addEventListener("click",()=>{let u=r.value.trim();u&&(n(),t(u))}),setTimeout(()=>r.focus(),50)}})}function yo(e,t){let s=[],o=[],n=new Map,i=new Map,r=null;e.container.innerHTML=`
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
  `,e.container.querySelector("#calc-fab").addEventListener("click",Eo);let a=()=>{e.setTitle(Mt((Date.now()-t.startedAt)/1e3))};a(),r=setInterval(a,1e3);let u=e.container.querySelector("#wname");u.addEventListener("input",async()=>{t.name=u.value,await q("workouts",{...t}),ne()});let c=new Map;e.container.querySelector("#add-exercise-btn").addEventListener("click",()=>{$o(s,i,async y=>{await ko(t,o,y),await p()})}),e.container.querySelector("#finish-btn").addEventListener("click",async()=>{if(confirm("Finish this workout?")){await So(t,o);try{let{filename:y}=await nt();I(`Saved \xB7 backup: ${y}`)}catch(y){I(`Saved \xB7 backup failed: ${y.message}`)}H("workout:changed")}}),e.container.querySelector("#discard-btn").addEventListener("click",async()=>{confirm("Discard this workout? This cannot be undone.")&&(await De(t.id),H("workout:changed"))});async function p(){let[y,h,M]=await Promise.all([A("sets"),A("workouts"),A("exercises")]);s=M,o=y.filter(S=>S.workoutId===t.id).sort((S,$)=>S.order-$.order),n=wt(y,h,t.id),c=m(y,M,t.id),i=new Map;for(let S of y)i.set(S.exerciseId,(i.get(S.exerciseId)??0)+1);E(),v()}function v(){let y=new Map(s.map(k=>[k.id,k])),h=[],M=new Map;for(let k of o){let D=y.get(k.exerciseId);if(!D)continue;let L=R(D);if(h.includes(L)||h.push(L),!k.completed)continue;let C=(k.weight||0)*(k.reps||0);C<=0||M.set(L,(M.get(L)??0)+C)}let S=[...M.values()].reduce((k,D)=>k+D,0),$=e.container.querySelector("#workout-progress");if(!$)return;if(h.length===0){$.innerHTML="";return}let T=h.map(k=>{let D=c.get(k)??0,L=M.get(k)??0;return{muscle:k,record:D,cur:L,span:Math.max(D,L)}}),B=Math.max(...T.map(k=>k.span)),f=B>0?B*.12:1;T=T.map(k=>({...k,span:Math.max(k.span,f)}));let d=Math.max(...T.map(k=>k.span)),g=T.map(({muscle:k,record:D,cur:L,span:C})=>{let P=C/d*100,U=L>0?Math.min(100,L/C*100):0,O;if(D>0){let de=Math.round(L/D*100);O=L>D?`${de}% \u{1F525}`:`${de}%`}else O=L>0?"new \u{1F525}":"new";let V=D>0?`${Y(L)} / ${Y(D)} \xB7 ${O}`:`${Y(L)} \xB7 ${O}`,_=Ct(k);return`
        <div class="vol-muscle" style="width: ${P.toFixed(2)}%; --mcolor: ${_}; --mtext: ${qt(_)};" title="${x(k)}: ${Y(L)} / record ${Y(D)} lbs">
          <div class="vol-fill" style="width: ${U.toFixed(2)}%;"></div>
          <div class="vol-info${U>55?" on-fill":""}">
            <span class="seg-name">${x(k)}</span>
            <span class="seg-vol">${V}</span>
          </div>
        </div>
      `}).join(""),w=`<strong>${Y(S)} lbs</strong> total`;$.innerHTML=`
      <div class="vol-bars">${g}</div>
      <div class="vol-label">${w}</div>
    `,requestAnimationFrame(()=>{for(let k of $.querySelectorAll(".vol-muscle"))l(k)})}function l(y){let h=y.querySelector(".seg-name"),M=y.querySelector(".seg-vol"),S=y.clientWidth-4;if(S<=0)return;if(M){let T=10;for(M.style.fontSize=`${T}px`;M.scrollWidth>S&&T>6;)T-=.5,M.style.fontSize=`${T}px`}if(!h)return;h.style.display="";let $=11;for(h.style.fontSize=`${$}px`;h.scrollWidth>S&&$>5;)$-=.5,h.style.fontSize=`${$}px`}function m(y,h,M){let S=new Map(h.map(B=>[B.id,B])),$=new Map,T=new Map;for(let B of Q(y)){if(B.workoutId===M)continue;let f=S.get(B.exerciseId);if(!f)continue;let d=(B.weight||0)*(B.reps||0);if(d<=0)continue;let g=R(f),w=T.get(B.workoutId);w||T.set(B.workoutId,w=new Map),w.set(g,(w.get(g)??0)+d)}for(let B of T.values())for(let[f,d]of B)d>($.get(f)??0)&&$.set(f,d);return $}async function b(y){if(!y.completed||(y.setType||"working")==="warmup"||!(y.weight>0)||!(y.reps>0))return;let h=s.find(d=>d.id===y.exerciseId);if(!h)return;let M=await A("sets"),S=Q(M).filter(d=>d.exerciseId===y.exerciseId&&d.id!==y.id&&(d.setType||"working")!=="warmup"&&d.weight>0&&d.reps>0);if(S.length===0)return;let $=[],T=S.reduce((d,g)=>Math.max(d,g.weight),0);y.weight>T&&$.push(`Heaviest weight ever: ${me(y.weight)} lbs`);let B=y.weight*y.reps,f=S.reduce((d,g)=>Math.max(d,g.weight*g.reps),0);if(B>f&&$.push(`Most volume in a set: ${me(y.weight)}\xD7${y.reps} = ${Y(B)} lbs`),$.length>0){let d=$.length>1?"New records":"New record";I(`\u{1F3C6} ${K(h)} \u2014 ${d}!
${$.join(`
`)}`,0,{persistUntilClick:!0})}}function E(){let y=new Map(s.map(f=>[f.id,f])),h=[],M=new Map;for(let f of o)M.has(f.exerciseId)||(M.set(f.exerciseId,[]),h.push(f.exerciseId)),M.get(f.exerciseId).push(f);for(let[,f]of M)f.sort((d,g)=>d.order-g.order);let S=e.container.querySelector("#exercise-sections");if(h.length===0){S.innerHTML=`
        <div class="empty-state" style="padding: 40px 24px; min-height: auto;">
          <p style="color: var(--text-secondary);">Add an exercise to start logging sets.</p>
        </div>`;return}S.innerHTML=h.map(f=>{let d=y.get(f),g=M.get(f),w=n.get(f)??new Map;return go(d,g,w,i.get(f)??0)}).join("");function $(f){delete f.bumpedBy,delete f.preBumpWeight,delete f.preBumpReps}function T(f){let d=o.filter(L=>L.exerciseId===f.exerciseId).sort((L,C)=>L.order-C.order),g=f.setType||"working",w=0,k=0;for(let L of d)if(k+=1,(L.setType||"working")===g&&(w+=1),L.id===f.id)break;let D=ke(g,w,n.get(f.exerciseId),k);return D&&D.weight>0&&D.reps>0?{weight:D.weight,reps:D.reps}:null}async function B(f){await ks(f.id,o),f.completed&&await bs(f,o,T);for(let d of o){if(d.exerciseId!==f.exerciseId)continue;let g=S.querySelector(`.set-row[data-set-id="${d.id}"]`);if(!g)continue;let w=g.querySelector(".weight-input"),k=g.querySelector(".reps-input");w&&document.activeElement!==w&&(w.value=d.weight>0?String(d.weight):""),k&&document.activeElement!==k&&(k.value=d.reps>0?String(d.reps):"")}}for(let f of S.querySelectorAll(".set-row-wrap")){let d=f.querySelector(".set-row"),g=d.dataset.setId,w=o.find(O=>O.id===g);if(!w)continue;let k=d.querySelector(".weight-input"),D=d.querySelector(".reps-input"),L=d.querySelector(".complete-btn");bo(f,async()=>{await ae("sets",w.id),await p()});let C=Ge(async()=>{await B(w),w.completed&&v()},200);k.addEventListener("input",()=>{w.weight=parseFloat(k.value)||0,$(w),q("sets",{...w}).catch(O=>console.error("Set save failed",O)),C()});let P=Ge(async()=>{await B(w),w.completed&&v()},200);D.addEventListener("input",()=>{w.reps=parseInt(D.value,10)||0,$(w),q("sets",{...w}).catch(O=>console.error("Set save failed",O)),P()}),L.addEventListener("click",async()=>{let O=w.completed;w.completed=!w.completed,w.completed&&$(w),await q("sets",w),d.classList.toggle("completed",w.completed),L.innerHTML=Ss(w.completed);let V=d.querySelector(".set-number")?.textContent?.trim()||"";L.setAttribute("aria-label",`${w.completed?"Mark incomplete":"Mark complete"} set ${V}`),v(),!O&&w.completed?(await bs(w,o,T)&&E(),await b(w)):O&&!w.completed&&await ks(w.id,o)&&E()});let U=d.querySelector(".set-number");U&&U.addEventListener("click",async()=>{let V=(w.setType||"working")==="warmup"?"working":"warmup";if(w.setType=V,!w.completed){let _=o.filter(ie=>ie.exerciseId===w.exerciseId).sort((ie,Es)=>ie.order-Es.order),de=0,mt=0;for(let ie of _)if(mt+=1,(ie.setType||"working")===V&&(de+=1),ie.id===w.id)break;let ue=ke(V,de,n.get(w.exerciseId),mt);ue&&ue.weight>0&&ue.reps>0&&(w.weight=ue.weight,w.reps=ue.reps)}await q("sets",w),E()})}for(let f of S.querySelectorAll(".add-set-btn"))f.addEventListener("click",async()=>{let d=f.dataset.exerciseId;await xo(t,o,d,n.get(d)??new Map),await p()});for(let f of S.querySelectorAll(".exercise-menu"))f.addEventListener("click",async()=>{let d=f.dataset.exerciseId;confirm("Remove this exercise from the workout?")&&(await _e("sets",o.filter(g=>g.exerciseId===d).map(g=>g.id)),await p())});for(let f of S.querySelectorAll(".exercise-name-btn"))f.addEventListener("click",()=>{r&&(clearInterval(r),r=null),Re(e,f.dataset.exerciseId,()=>e.refresh())})}return p(),()=>{r&&clearInterval(r)}}function go(e,t,s=new Map,o=0){let n=0,i=0,r=t.map((a,u)=>{let c=a.setType||"working",p,v;c==="warmup"?(i+=1,v=i,p=`W${i}`):(n+=1,v=n,p=String(n));let l=ke(c,v,s,u+1);return wo(a,p,l)}).join("");return`
    <div class="exercise-section">
      <div class="exercise-section-header">
        <button class="exercise-name-btn" data-exercise-id="${e?.id}">${se(e)}</button>
        <div class="row-trailing trailing-stack">${oe(o)}</div>
        <button class="menu exercise-menu" data-exercise-id="${e?.id}" aria-label="Remove ${x(K(e))} from workout">\xD7</button>
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
        <button class="complete-btn" aria-label="${e.completed?"Mark incomplete":"Mark complete"} set ${t}">${Ss(e.completed)}</button>
      </div>
    </div>
  `}function bo(e,t){let s=e.querySelector(".set-row"),o=e.querySelector(".set-swipe-delete");if(!s||!o)return;let n=88,i=0,r=0,a=0,u=0,c=!1,p=!1,v=!1,l=!1,m=()=>Math.max(140,i*.5);function b(S,$){s.style.transition=$?"transform 0.18s ease":"none",s.style.transform=`translateX(${S}px)`,o.style.width=`${Math.max(n,-S)}px`,e.classList.toggle("will-delete",S<=-m())}function E(S=!0){v=!1,b(0,S),e.classList.remove("swiped-open")}function y(S=!0){document.querySelectorAll(".set-row-wrap.swiped-open").forEach($=>{if($!==e){let T=$.querySelector(".set-row");T&&(T.style.transition="transform 0.18s ease",T.style.transform="translateX(0)");let B=$.querySelector(".set-swipe-delete");B&&(B.style.width=""),$.classList.remove("swiped-open","will-delete")}}),v=!0,b(-n,S),e.classList.add("swiped-open")}function h(){s.style.transition="transform 0.16s ease-out",s.style.transform=`translateX(${-i}px)`,o.style.width=`${i}px`,setTimeout(t,150)}s.addEventListener("touchstart",S=>{i=e.clientWidth||s.clientWidth,r=S.touches[0].clientX,a=S.touches[0].clientY,u=v?-n:0,c=!0,p=!1,l=!!S.target.closest("input, button, select, textarea")},{passive:!0}),s.addEventListener("touchmove",S=>{if(!c)return;let $=S.touches[0].clientX-r,T=S.touches[0].clientY-a;if(!p){if(Math.abs(T)>Math.abs($)+4){c=!1;return}Math.abs($)>8&&(p=!0,l&&document.activeElement?.blur&&document.activeElement.blur())}if(!p)return;S.cancelable&&S.preventDefault();let B=v?-n:0;u=Math.min(0,Math.max(-i,B+$)),b(u,!1)},{passive:!1});function M(){c&&(c=!1,p&&(u<=-m()?h():u<-n/2?y():E()))}s.addEventListener("touchend",M),s.addEventListener("touchcancel",M),o.addEventListener("click",S=>{S.stopPropagation(),t()})}function Ss(e){return e?'<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>':'<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>'}async function ko(e,t,s){let o=t.reduce((n,i)=>Math.max(n,i.order),-1)+1;for(let n of s){let i=(await gt(n,e.id)).filter(u=>(u.weight||0)>0&&(u.reps||0)>0),a=(i.length>0?i:[{weight:0,reps:0,setType:"working"}]).map(u=>({id:F(),workoutId:e.id,exerciseId:n,weight:u.weight??0,reps:u.reps??0,setType:u.setType||"working",completed:!1,order:o++,createdAt:Date.now()}));await re("sets",a)}}async function bs(e,t,s){let o=(e.weight||0)*(e.reps||0);if(o<=0)return!1;let n=!1;for(let i of t)if(i.exerciseId===e.exerciseId&&i.id!==e.id&&!((i.order??0)<=(e.order??0))&&!i.completed&&(i.weight||0)*(i.reps||0)<o){if(i.bumpedBy==null){let r=s?.(i);i.preBumpWeight=r?r.weight:i.weight,i.preBumpReps=r?r.reps:i.reps}i.bumpedBy=e.id,i.weight=e.weight,i.reps=e.reps,await q("sets",i),n=!0}return n}async function ks(e,t){let s=!1;for(let o of t)o.bumpedBy===e&&(o.completed||(o.preBumpWeight!=null&&(o.weight=o.preBumpWeight),o.preBumpReps!=null&&(o.reps=o.preBumpReps)),delete o.bumpedBy,delete o.preBumpWeight,delete o.preBumpReps,await q("sets",o),s=!0);return s}async function xo(e,t,s,o=new Map){let n=t.filter(E=>E.exerciseId===s),i=n[n.length-1],r=E=>(E?.weight||0)*(E?.reps||0),a=n.filter(E=>(E.setType||"working")!=="warmup"),u=a.length+1,c=ke("working",u,o,n.length+1),p=a.filter(E=>E.weight>0&&E.reps>0).reduce((E,y)=>!E||r(y)>r(E)?y:E,null),v=a.some((E,y)=>{let h=ke("working",y+1,o);return h&&h.weight>0&&h.reps>0&&r(E)>r(h)}),l=i?.weight??0,m=i?.reps??0;p&&(!c||v)&&(l=p.weight,m=p.reps);let b={id:F(),workoutId:e.id,exerciseId:s,weight:l,reps:m,completed:!1,order:(i?.order??-1)+1,createdAt:Date.now()};await q("sets",b)}async function So(e,t){await _e("sets",t.filter(s=>!s.completed&&((s.weight||0)===0||(s.reps||0)===0)).map(s=>s.id)),e.endedAt=Date.now(),await q("workouts",e)}function $o(e,t,s){let o=new Set,n="",i=null,r=W({html:`
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
    `,onMount(a){let u=a.querySelector("#picker-list"),c=a.querySelector("#picker-add"),p=a.querySelector("#picker-cancel"),v=a.querySelector("#picker-custom"),l=a.querySelector("#picker-search"),m=a.querySelector("#picker-chips");function b(){m.innerHTML=Be(e,i);for(let y of m.querySelectorAll(".chip"))y.addEventListener("click",()=>{let h=y.dataset.cat;i=h==="All"?null:h,b(),E()})}function E(){let y=e.filter(h=>!i||R(h)===i).filter(h=>!n||h.name.toLowerCase().includes(n.toLowerCase())).sort((h,M)=>{let S=t.get(h.id)??0,$=t.get(M.id)??0;return S!==$?$-S:h.name.localeCompare(M.name)});u.innerHTML=y.length===0?'<div class="list-row"><div class="row-main" style="color:var(--text-secondary)">No matches</div></div>':y.map(h=>`
                <button class="list-row" data-id="${h.id}">
                  ${se(h)}
                  <div class="row-trailing trailing-stack">
                    ${oe(t.get(h.id)??0)}
                    ${o.has(h.id)?Mo():""}
                  </div>
                </button>
              `).join("");for(let h of u.querySelectorAll(".list-row[data-id]"))h.addEventListener("click",()=>{let M=h.dataset.id;o.has(M)?o.delete(M):o.add(M),c.disabled=o.size===0,c.textContent=o.size===0?"Add":`Add (${o.size})`,E()})}l.addEventListener("input",()=>{n=l.value,E()}),p.addEventListener("click",()=>r()),c.addEventListener("click",()=>{s(Array.from(o)),r()}),v.addEventListener("click",()=>{ge(null,async y=>{e.push(y),o.add(y.id),b(),E(),c.disabled=!1,c.textContent=`Add (${o.size})`})}),b(),E()}})}function Mo(){return'<svg viewBox="0 0 24 24" width="22" height="22" fill="var(--green)"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'}function ge(e,t){let s=!!e,o=s?R(e):null,n=!o||he.includes(o)?he:[o,...he],i=e?.equipment,r=!i||Te.includes(i)?Te:[i,...Te],a=W({html:`
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
            <select id="ce-cat">${n.map(u=>`<option${u===o?" selected":""}>${x(u)}</option>`).join("")}</select>
          </div>
        </div>
        <div class="section">Equipment</div>
        <div class="form-section">
          <div class="form-row">
            <label for="ce-eq">Equipment</label>
            <select id="ce-eq">${r.map(u=>`<option${u===i?" selected":""}>${x(u)}</option>`).join("")}</select>
          </div>
        </div>
      </div>
    `,onMount(u){let c=u.querySelector("#ce-name"),p=u.querySelector("#ce-save");c.addEventListener("input",()=>{p.disabled=c.value.trim().length===0}),u.querySelector("#ce-cancel").addEventListener("click",()=>a()),p.addEventListener("click",async()=>{let v=c.value.trim();if(!v)return;let l=u.querySelector("#ce-cat").value,m=u.querySelector("#ce-eq").value,b=s?{...e,name:v,muscle:l,equipment:m}:{id:F(),name:v,muscle:l,category:l,equipment:m,notes:"",isCustom:!0,createdAt:Date.now()};await q("exercises",b),a(),t?.(b),s||H("data:changed")}),s||setTimeout(()=>c.focus(),50)}})}function Eo(){let t=[["AC","clear","fn"],["\xB1","sign","fn"],["\u232B","back","fn"],["\xF7","op","op"],["7","digit"],["8","digit"],["9","digit"],["\xD7","op","op"],["4","digit"],["5","digit"],["6","digit"],["\u2212","op","op"],["1","digit"],["2","digit"],["3","digit"],["+","op","op"],["0","digit","zero"],[".","dot"],["=","equals","op"]].map(([s,o,n])=>`<button class="calc-key${n?` calc-${n}`:""}" data-action="${o}" data-key="${x(s)}">${x(s)}</button>`).join("");W({html:`
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
    `,onMount(s,o){let n=s.querySelector("#calc-expr"),i=s.querySelector("#calc-result"),r={"+":(d,g)=>d+g,"\u2212":(d,g)=>d-g,"\xD7":(d,g)=>d*g,"\xF7":(d,g)=>g===0?NaN:d/g},a=d=>d==="+"||d==="\u2212"||d==="\xD7"||d==="\xF7",u=d=>{if(!isFinite(d))return"Error";let g=parseFloat(d.toFixed(8)).toString();return g.replace("-","").replace(".","").length>12&&(g=d.toPrecision(10).replace(/\.?0+$/,"")),g},c=["0"],p=!1,v=!1,l="",m=()=>c[c.length-1];function b(){n.textContent=v?"":l,i.textContent=v?"Error":c.join(" ");let d=!v&&a(m())?m():null;for(let g of s.querySelectorAll(".calc-op"))g.classList.toggle("selected",g.dataset.key===d)}function E(d){if(v&&(c=["0"],v=!1),p)return c=[d],p=!1,b();a(m())?c.push(d):c[c.length-1]=m()==="0"?d:m()+d,b()}function y(){if(v&&(c=["0"],v=!1),p)return c=["0."],p=!1,b();a(m())?c.push("0."):m().includes(".")||(c[c.length-1]=m()+"."),b()}function h(d){v||(p=!1,a(m())?c[c.length-1]=d:c.push(d),b())}function M(){c=["0"],p=!1,v=!1,b()}function S(){if(v||a(m()))return;let d=m();c[c.length-1]=d.startsWith("-")?d.slice(1):d==="0"?"0":"-"+d,b()}function $(){if(v)return M();if(p=!1,a(m()))return c.pop(),b();let d=m().slice(0,-1);d===""||d==="-"?c.length>1?c.pop():c=["0"]:c[c.length-1]=d,b()}function T(){if(v)return;let d=c.slice();if(a(d[d.length-1])&&d.pop(),d.length<3)return;let g=parseFloat(d[0]);for(let w=1;w<d.length;w+=2)if(g=r[d[w]](g,parseFloat(d[w+1])),!isFinite(g))return v=!0,b();l=`${d.join(" ")} =`,c=[u(g)],p=!0,b()}function B(d){let{action:g,key:w}=d.dataset;g!=="equals"&&(l=""),g==="digit"?E(w):g==="dot"?y():g==="clear"?M():g==="sign"?S():g==="back"?$():g==="op"?h(w):g==="equals"&&T()}let f=null;for(let d of s.querySelectorAll(".calc-key"))d.addEventListener("pointerdown",g=>{g.preventDefault(),f=d,d.classList.add("pressed")}),d.addEventListener("pointerup",g=>{g.preventDefault(),d.classList.remove("pressed"),f===d&&B(d),f=null}),d.addEventListener("pointercancel",()=>{d.classList.remove("pressed"),f=null}),d.addEventListener("pointerleave",()=>d.classList.remove("pressed"));s.querySelector("#calc-done").addEventListener("click",()=>o())}})}function $e(){let e=window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===!0,t;e?t=Math.max(window.innerHeight||0,window.visualViewport?.height||0,window.screen?.height||0):t=window.visualViewport?.height||window.innerHeight,document.documentElement.style.setProperty("--app-height",`${t}px`)}$e();window.addEventListener("resize",$e);window.addEventListener("orientationchange",$e);window.addEventListener("pageshow",$e);window.visualViewport?.addEventListener("resize",$e);var $s={workout:{title:"Workout",render:xs},exercises:{title:"Exercises",render:Xt},progress:{title:"Progress",render:Vt}},xe=document.getElementById("view-content"),Lo=document.getElementById("nav-title"),Ms=document.getElementById("nav-back"),G=document.getElementById("nav-action"),Se="workout",ft=null,Ve=null,Ue=null,ze={container:xe,setTitle(e){Lo.textContent=e},setAction(e){if(!e){G.hidden=!0,G.innerHTML="",G.removeAttribute("aria-label"),Ve=null;return}G.hidden=!1,e.label?G.setAttribute("aria-label",e.label):G.removeAttribute("aria-label"),e.html?G.innerHTML=e.html:G.textContent=e.label??"",Ve=e.onClick},setBack(e){ft=e,Ms.hidden=!e},refresh(){Me(Se)},toast(e){I(e)}};function Do(){if(typeof Ue=="function")try{Ue()}catch(e){console.error(e)}Ue=null}function Me(e){Se=e,Bt(e),document.querySelectorAll(".tab").forEach(t=>{t.setAttribute("aria-selected",String(t.dataset.tab===e))}),Do(),ze.setTitle($s[e].title),ze.setAction(null),ze.setBack(null),xe.innerHTML="",xe.scrollTop=0;try{Ue=$s[e].render(ze)}catch(t){console.error("Render failed",t),xe.innerHTML=`<div class="empty-state"><div class="empty-icon">!</div><h2>Render error</h2><p>${x(t.message)}</p></div>`}}document.querySelectorAll(".tab").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll(".sheet-backdrop").forEach(t=>t.dismissSheet?.()),Me(e.dataset.tab)})});Ms.addEventListener("click",()=>{ft&&ft()});G.addEventListener("click",()=>{Ve&&Ve()});(function(){let t='button, [role="button"], a[href]',s=null,o=0,n=0,i=()=>{s&&(s.classList.remove("pressed"),s=null)};document.addEventListener("pointerdown",r=>{let a=r.target.closest?.(t);s&&s!==a&&i(),!(!a||a.disabled||a.classList.contains("calc-key"))&&(s=a,o=r.clientX,n=r.clientY,a.classList.add("pressed"))},{passive:!0}),document.addEventListener("pointermove",r=>{s&&(Math.abs(r.clientX-o)>8||Math.abs(r.clientY-n)>8)&&i()},{passive:!0}),document.addEventListener("pointerup",i,{passive:!0}),document.addEventListener("pointercancel",i,{passive:!0}),window.addEventListener("scroll",i,{passive:!0,capture:!0})})();Qe("data:changed",()=>{ne(),Me(Se)});Qe("workout:changed",()=>{ne(),Se==="workout"&&Me(Se)});document.addEventListener("visibilitychange",()=>{document.visibilityState==="visible"&&ne()});async function Ao(){try{await j();let e=await At();e>0&&console.info(`Seeded ${e} exercises.`),await Wt(),Me("workout"),ne()}catch(e){console.error("Init failed:",e),xe.innerHTML=`
      <div class="empty-state">
        <div class="empty-icon">!</div>
        <h2>Storage unavailable</h2>
        <p>${x(e.message??String(e))}</p>
        <p>If you are running this from a <code>file://</code> URL, serve it through a local web server instead.</p>
      </div>`}}Ao();
