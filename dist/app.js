var Cs="lift";var vt=["exercises","workouts","sets","stateOfMind","medications"],De=null;function U(){return De?Promise.resolve(De):new Promise((e,t)=>{let s=indexedDB.open(Cs,6);s.onerror=()=>t(s.error),s.onsuccess=()=>{De=s.result,e(De)},s.onupgradeneeded=()=>{let n=s.result;if(!n.objectStoreNames.contains("exercises")){let o=n.createObjectStore("exercises",{keyPath:"id"});o.createIndex("name","name",{unique:!1}),o.createIndex("category","category",{unique:!1})}if(n.objectStoreNames.contains("workouts")||n.createObjectStore("workouts",{keyPath:"id"}).createIndex("startedAt","startedAt",{unique:!1}),!n.objectStoreNames.contains("sets")){let o=n.createObjectStore("sets",{keyPath:"id"});o.createIndex("workoutId","workoutId",{unique:!1}),o.createIndex("exerciseId","exerciseId",{unique:!1})}n.objectStoreNames.contains("stateOfMind")||n.createObjectStore("stateOfMind",{keyPath:"id"}).createIndex("date","date",{unique:!1}),n.objectStoreNames.contains("medications")||n.createObjectStore("medications",{keyPath:"id"}),n.objectStoreNames.contains("appMeta")||n.createObjectStore("appMeta",{keyPath:"key"}),n.objectStoreNames.contains("doseEvents")&&n.deleteObjectStore("doseEvents")}})}function ve(e){return new Promise((t,s)=>{e.onsuccess=()=>t(e.result),e.onerror=()=>s(e.error)})}async function he(e,t="readonly"){return(await U()).transaction(e,t).objectStore(e)}function ne(e,t,s){return new Promise((n,o)=>{let i=e.transaction(t,"readwrite"),r;try{r=s(i)}catch(a){try{i.abort()}catch{}o(a);return}i.oncomplete=()=>n(r),i.onerror=()=>o(i.error),i.onabort=()=>o(i.error)})}async function I(e){return ve((await he(e)).getAll())}async function J(e,t){return ve((await he(e)).get(t))}async function R(e,t){return await ve((await he(e,"readwrite")).put(t)),t}async function oe(e,t){let s=await U();return ne(s,e,n=>{let o=n.objectStore(e);for(let i of t)o.put(i)})}async function le(e,t){return ve((await he(e,"readwrite")).delete(t))}async function _e(e,t){if(t.length===0)return;let s=await U();return ne(s,e,n=>{let o=n.objectStore(e);for(let i of t)o.delete(i)})}async function ht(e){let t=await J("appMeta",e);return t?t.value:null}async function Ae(e,t){return await R("appMeta",{key:e,value:t}),t}async function Be(e,t,s){let n=await he(e);return ve(n.index(t).getAll(s))}async function gt(e){let t=await U();return ne(t,vt,s=>{for(let n of vt){let o=s.objectStore(n);o.clear();for(let i of e[n]??[])o.put(i)}})}function Z(e){let t=new Set;for(let s of e)s.completed&&t.add(s.workoutId);return e.filter(s=>s.completed||!t.has(s.workoutId))}async function de(){return(await I("workouts")).find(t=>!t.endedAt)??null}async function ee(){return(await I("workouts")).filter(t=>t.endedAt).sort((t,s)=>s.startedAt-t.startedAt)}async function wt(e){return(await Be("sets","workoutId",e)).sort((s,n)=>s.order-n.order)}async function Is(e){return await Be("sets","exerciseId",e)}async function yt(e,t=null){let s=await Is(e),n=new Map;for(let r of s)t&&r.workoutId===t||(n.has(r.workoutId)||n.set(r.workoutId,[]),n.get(r.workoutId).push(r));if(n.size===0)return[];let i=(await Promise.all(Array.from(n.keys()).map(r=>J("workouts",r)))).filter(Boolean).sort((r,a)=>(a.startedAt??0)-(r.startedAt??0));return i.length===0?[]:n.get(i[0].id).sort((r,a)=>r.order-a.order)}function bt(e,t,s=null){let n=new Map(t.map(r=>[r.id,r.startedAt??0])),o=new Map;for(let r of e){if(r.workoutId===s||!n.has(r.workoutId)||(r.weight||0)<=0||(r.reps||0)<=0)continue;let a=o.get(r.exerciseId);a||o.set(r.exerciseId,a=new Map);let c=a.get(r.workoutId);c||a.set(r.workoutId,c=[]),c.push(r)}let i=new Map;for(let[r,a]of o){let c=[...a.keys()].sort((x,E)=>n.get(E)-n.get(x)),u=new Map;for(let x of c){let E=a.get(x).sort((v,g)=>v.order-g.order),l=E.every(v=>v.setType==null),d=0,A=0;E.forEach((v,g)=>{if(l){let k=`any#${g+1}`;u.has(k)||u.set(k,v);return}let f=v.setType||"working",h=f==="warmup"?A+=1:d+=1,y=`${f}#${h}`;u.has(y)||u.set(y,v)})}i.set(r,u)}return i}var qs={barbell:"Barbell",dumbbell:"Dumbbell",machine:"Machine",cable:"Cable",bodyweight:"Bodyweight",kettlebell:"Kettlebell",band:"Bands",bands:"Bands"},Ps=/\s*\((barbell|dumbbell|machine|cable|bodyweight|kettlebell|bands?)\)$|\s+(Machine|Barbell|Dumbbell|Cable|Kettlebell)$/i;async function Hs(e,t){let s=await U(),n=await Be("sets","exerciseId",e);return ne(s,["sets","exercises"],o=>{let i=o.objectStore("sets");for(let r of n)i.put({...r,exerciseId:t});return o.objectStore("exercises").delete(e),n.length})}async function xt(){let e=await I("exercises"),t=e.filter(i=>/butterfly/i.test(i.name||""));if(t.length===0)return 0;let s=e.filter(i=>/chest fly/i.test(i.name||"")&&!t.some(r=>r.id===i.id)),n=s.find(i=>(i.equipment||"")==="Machine")||s[0],o=0;for(let i of t)n?o+=await Hs(i.id,n.id):await R("exercises",{...i,name:"Chest Fly",equipment:"Machine"});return o}async function kt(){let e=await I("exercises"),t=[];for(let s of e){let n=(s.name||"").match(Ps);if(!n)continue;let o=s.name.slice(0,n.index).trim();if(!o||/smith$/i.test(o))continue;let i=(n[1]||n[2]).toLowerCase();t.push({...s,name:o,equipment:qs[i]||s.equipment})}return t.length>0&&await oe("exercises",t),t.length}async function St(){let[e,t,s]=await Promise.all([I("exercises"),I("sets"),I("workouts")]),n=new Set(e.filter(u=>u.category==="Cardio").map(u=>u.id));if(n.size===0)return{exercises:0,sets:0,workouts:0};let o=t.filter(u=>n.has(u.exerciseId)),i=new Map;for(let u of t)n.has(u.exerciseId)||i.set(u.workoutId,(i.get(u.workoutId)||0)+1);let r=new Set(o.map(u=>u.workoutId)),a=s.filter(u=>r.has(u.id)&&!i.get(u.id)),c=await U();return await ne(c,["exercises","sets","workouts"],u=>{let x=u.objectStore("exercises"),E=u.objectStore("sets"),l=u.objectStore("workouts");for(let d of n)x.delete(d);for(let d of o)E.delete(d.id);for(let d of a)l.delete(d.id)}),{exercises:n.size,sets:o.length,workouts:a.length}}async function $t(e){let[t,s,n]=await Promise.all([I("exercises"),I("sets"),I("workouts")]),o=t.filter(l=>l.category==="Other");if(o.length===0)return{recategorized:0,deleted:0,workouts:0};let i=[],r=new Set;for(let l of o){let d=e(l.name);d==="Cardio"?r.add(l.id):i.push({...l,category:d&&d!=="Other"?d:"Full Body"})}let a=s.filter(l=>r.has(l.exerciseId)),c=new Map;for(let l of s)r.has(l.exerciseId)||c.set(l.workoutId,(c.get(l.workoutId)||0)+1);let u=new Set(a.map(l=>l.workoutId)),x=n.filter(l=>u.has(l.id)&&!c.get(l.id)),E=await U();return await ne(E,["exercises","sets","workouts"],l=>{let d=l.objectStore("exercises"),A=l.objectStore("sets"),v=l.objectStore("workouts");for(let g of i)d.put(g);for(let g of r)d.delete(g);for(let g of a)A.delete(g.id);for(let g of x)v.delete(g.id)}),{recategorized:i.length,deleted:r.size,workouts:x.length}}async function Mt(){let e=await I("medications"),t=[];for(let s of e){if(s.doseAmount!=null)continue;let n=s.nickname||s.concept?.displayText||"";if(!/creatine/i.test(n))continue;let o=(s.concept?.form||"").replace(/\s*\(4\s*[×x]\s*\/?\s*day\)\s*/i,"").trim();t.push({...s,doseAmount:4,doseUnit:"capsule",concept:{...s.concept,form:o}})}return t.length>0&&await oe("medications",t),t.length}var Ws=[[/\b(barbell|landmine|ez[- ]?bar|smith)\b/i,"Barbell"],[/\b(dumbbell|db)\b/i,"Dumbbell"],[/\b(cable|pulley|rope)\b/i,"Cable"],[/\b(plate[- ]?loaded|hammer strength)\b/i,"Machine Plates"],[/\b(machine|sled|press)\b/i,"Machine"]];async function Lt(){let t=(await I("exercises")).filter(n=>(n.equipment||"")==="Other");if(t.length===0)return[];let s=t.map(n=>{let o=Ws.find(([i])=>i.test(n.name||""));return{...n,equipment:o?o[1]:"Bodyweight"}});return await oe("exercises",s),s.map(n=>`${n.name} \u2192 ${n.equipment}`)}async function Te(e){let t=await U(),s=await Be("sets","workoutId",e);return ne(t,["workouts","sets"],n=>{n.objectStore("workouts").delete(e);let o=n.objectStore("sets");for(let i of s)o.delete(i.id)})}var Y=()=>crypto&&crypto.randomUUID?crypto.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,e=>{let t=Math.random()*16|0;return(e==="x"?t:t&3|8).toString(16)});function ge(e){return e==null?"0":Math.abs(e-Math.round(e))<.001?String(Math.round(e)):e.toFixed(1)}function we(e){return`${ge(e)} lbs`}function Et(e){let t=Math.max(0,Math.floor(e)),s=Math.floor(t/3600),n=Math.floor(t%3600/60),o=t%60;return s>0?`${s}:${String(n).padStart(2,"0")}:${String(o).padStart(2,"0")}`:`${n}:${String(o).padStart(2,"0")}`}function Ge(e){let t=Math.max(0,Math.floor(e)),s=Math.floor(t/3600),n=Math.floor(t%3600/60);return s>0?`${s}h ${n}m`:`${n}m`}function _(e){return Math.round(e).toLocaleString()}function ue(e){return`${_(e)} lbs`}function K(e){return(e instanceof Date?e:new Date(e)).toLocaleDateString(void 0,{month:"numeric",day:"numeric",year:"2-digit"})}function Dt(e){return(e instanceof Date?e:new Date(e)).toLocaleDateString(void 0,{weekday:"short",month:"short",day:"numeric",year:"numeric"})}function Xe(e,t=200){let s=null;return(...n)=>{clearTimeout(s),s=setTimeout(()=>e(...n),t)}}function S(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function O(e,t=1800,s={}){let n=document.querySelector(".toast");n&&n.remove();let o=document.createElement("div");o.className="toast",o.textContent=e,s.persistUntilClick?(o.classList.add("toast-clickable"),o.addEventListener("click",()=>o.remove())):setTimeout(()=>o.remove(),t),document.body.appendChild(o)}var Ke=new EventTarget;function F(e,t){Ke.dispatchEvent(new CustomEvent(e,{detail:t}))}function Qe(e,t){return Ke.addEventListener(e,t),()=>Ke.removeEventListener(e,t)}function N({html:e,onMount:t}){let s=document.createElement("div");s.className="sheet-backdrop",s.innerHTML='<div class="sheet"></div>';let n=s.querySelector(".sheet");n.innerHTML=e;let o=Os();document.body.appendChild(s);function i(){let c=window.visualViewport;if(!c){n.style.maxHeight=`${window.innerHeight-o-10}px`;return}let u=Math.max(window.innerHeight,document.documentElement.clientHeight),x=Math.max(0,u-c.height-c.offsetTop);x>0?(n.style.paddingBottom=`${x}px`,n.style.maxHeight=`${c.height-o-10+x}px`):(n.style.paddingBottom="",n.style.maxHeight=`${c.height-o-10}px`)}i();let r=window.visualViewport;r?.addEventListener("resize",i),r?.addEventListener("scroll",i);function a(){s.remove(),r?.removeEventListener("resize",i),r?.removeEventListener("scroll",i)}return s.dismissSheet=a,s.addEventListener("click",c=>{c.target===s&&a()}),t?.(n,a),a}function Os(){let e=document.createElement("div");e.style.cssText="position:fixed;top:0;left:0;width:0;height:env(safe-area-inset-top);",document.body.appendChild(e);let t=e.offsetHeight||0;return e.remove(),t}function Ce(){return'<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" style="color: var(--red);"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>'}function At(){return'<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M16 5l-1.42 1.42-1.59-1.59V16h-2V4.83L9.41 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z"/></svg>'}function te(e){return`<div class="empty-state"><div class="empty-icon">!</div><h2>Couldn't load</h2><p>${S(e.message||String(e))}</p></div>`}var ye=["Pectorals","Anterior Deltoid","Lateral Deltoid","Posterior Deltoid","Triceps","Biceps","Forearms","Lats","Upper Back","Lower Back","Traps","Quadriceps","Hamstrings","Glutes","Adductors","Abductors","Calves","Abs","Obliques"];function Rs(e){let t=new Map(ye.map((s,n)=>[s,n]));return[...e].sort((s,n)=>(t.get(s)??999)-(t.get(n)??999)||s.localeCompare(n))}var Ie=["Barbell","Dumbbell","Machine","Machine Plates","Cable","Bodyweight"];function G(e){let t=e?.equipment,s=e?.name??"";return t&&t!=="Other"?`${s} (${t})`:s}function ie(e){let t=e?[e.equipment,j(e)].filter(Boolean).join(" \xB7 "):"";return`
    <div class="row-main">
      <div class="row-title">${S(e?.name??"Unknown exercise")}</div>
      ${t?`<div class="row-subtitle">${S(t)}</div>`:""}
    </div>
  `}function re(e){return e?`<div class="exercise-count">${e} ${e===1?"set":"sets"}</div>`:""}function qe(e,t){return["All",...Rs(new Set(e.map(n=>j(n))))].map(n=>`<button class="chip${n==="All"&&!t||n===t?" active":""}" data-cat="${S(n)}">${S(n)}</button>`).join("")}var Fs=[["Bench Press (Barbell)","Chest","Barbell"],["Bench Press (Dumbbell)","Chest","Dumbbell"],["Incline Bench Press (Barbell)","Chest","Barbell"],["Incline Bench Press (Dumbbell)","Chest","Dumbbell"],["Decline Bench Press (Barbell)","Chest","Barbell"],["Chest Fly (Dumbbell)","Chest","Dumbbell"],["Chest Fly (Machine)","Chest","Machine"],["Cable Crossover","Chest","Cable"],["Push-Up","Chest","Bodyweight"],["Dip (Chest)","Chest","Bodyweight"],["Deadlift (Conventional)","Back","Barbell"],["Deadlift (Sumo)","Back","Barbell"],["Romanian Deadlift","Back","Barbell"],["Bent-Over Row (Barbell)","Back","Barbell"],["Pendlay Row","Back","Barbell"],["Row (Dumbbell)","Back","Dumbbell"],["T-Bar Row","Back","Barbell"],["Seated Cable Row","Back","Cable"],["Lat Pulldown","Back","Cable"],["Pull-Up","Back","Bodyweight"],["Chin-Up","Back","Bodyweight"],["Face Pull","Back","Cable"],["Shrug (Barbell)","Back","Barbell"],["Shrug (Dumbbell)","Back","Dumbbell"],["Overhead Press (Barbell)","Shoulders","Barbell"],["Overhead Press (Dumbbell)","Shoulders","Dumbbell"],["Seated Shoulder Press (Machine)","Shoulders","Machine"],["Arnold Press","Shoulders","Dumbbell"],["Lateral Raise (Dumbbell)","Shoulders","Dumbbell"],["Lateral Raise (Cable)","Shoulders","Cable"],["Front Raise (Dumbbell)","Shoulders","Dumbbell"],["Rear Delt Fly (Dumbbell)","Shoulders","Dumbbell"],["Reverse Pec Deck","Shoulders","Machine"],["Upright Row","Shoulders","Barbell"],["Barbell Curl","Biceps","Barbell"],["Dumbbell Curl","Biceps","Dumbbell"],["Hammer Curl","Biceps","Dumbbell"],["Preacher Curl","Biceps","Barbell"],["Incline Dumbbell Curl","Biceps","Dumbbell"],["Cable Curl","Biceps","Cable"],["Concentration Curl","Biceps","Dumbbell"],["Close-Grip Bench Press","Triceps","Barbell"],["Tricep Pushdown (Cable)","Triceps","Cable"],["Overhead Tricep Extension (Dumbbell)","Triceps","Dumbbell"],["Overhead Tricep Extension (Cable)","Triceps","Cable"],["Skull Crusher","Triceps","Barbell"],["Dip (Tricep)","Triceps","Bodyweight"],["Tricep Kickback","Triceps","Dumbbell"],["Back Squat","Legs","Barbell"],["Front Squat","Legs","Barbell"],["Goblet Squat","Legs","Dumbbell"],["Bulgarian Split Squat","Legs","Dumbbell"],["Lunge","Legs","Dumbbell"],["Leg Press","Legs","Machine"],["Leg Extension","Legs","Machine"],["Leg Curl (Seated)","Legs","Machine"],["Leg Curl (Lying)","Legs","Machine"],["Hip Thrust (Barbell)","Glutes","Barbell"],["Glute Bridge","Glutes","Bodyweight"],["Cable Kickback","Glutes","Cable"],["Hip Abduction (Machine)","Glutes","Machine"],["Standing Calf Raise","Calves","Machine"],["Seated Calf Raise","Calves","Machine"],["Plank","Core","Bodyweight"],["Hanging Leg Raise","Core","Bodyweight"],["Cable Crunch","Core","Cable"],["Russian Twist","Core","Bodyweight"],["Ab Wheel Rollout","Core","Bodyweight"],["Wrist Curl","Forearms","Dumbbell"],["Reverse Wrist Curl","Forearms","Dumbbell"],["Farmer's Carry","Forearms","Dumbbell"]];function j(e){if(e?.muscle)return e.muscle;let t=(e?.name||"").toLowerCase();return t?/romanian deadlift|\brdl\b|stiff.?leg|good morning|nordic|hamstring/.test(t)||/leg curl/.test(t)?"Hamstrings":/leg extension|sissy squat/.test(t)?"Quadriceps":/calf|tib raise|tibialis/.test(t)?"Calves":/hip adduction|adductor|inner thigh|copenhagen/.test(t)?"Adductors":/hip abduction|abductor|outer thigh|clamshell/.test(t)?"Abductors":/hip thrust|glute|cable kickback|donkey kick|rear kick|frog pump/.test(t)?"Glutes":/squat|leg press|lunge|step.?up/.test(t)?"Quadriceps":/back extension|hyperextension|superman/.test(t)||/deadlift|rack pull/.test(t)?"Lower Back":/lateral raise|side raise|side delt|\blat raise\b|upright row/.test(t)?"Lateral Deltoid":/rear delt|reverse fly|reverse flye|face pull|reverse pec deck/.test(t)?"Posterior Deltoid":/front raise|shoulder press|overhead press|arnold|military press|landmine press|push press|viking press/.test(t)?"Anterior Deltoid":/pulldown|pull.?down|pull.?up|chin.?up|pullover|straight.?arm/.test(t)?"Lats":/shrug/.test(t)?"Traps":/tricep|pushdown|skull ?crusher|close.?grip bench|jm press|french press|bench dip/.test(t)?"Triceps":/wrist curl|reverse curl|forearm|farmer|gripper|dead hang/.test(t)?"Forearms":/bicep|\bcurl\b/.test(t)?"Biceps":/\brow\b|rear pull|high pull/.test(t)?"Upper Back":/bench|chest|\bpec\b|pec deck|crossover|butterfly|push.?up|floor press|squeeze press|\bfly\b|\bflye\b/.test(t)?"Pectorals":/russian twist|woodchop|wood chop|side plank|side bend|oblique|pallof|rotation/.test(t)?"Obliques":/crunch|sit.?up|plank|leg raise|knee raise|ab wheel|ab roll|hanging|toes.?to.?bar|v.?up|dead bug|mountain climber/.test(t)?"Abs":/\bdip\b/.test(t)?"Triceps":e.category||"Other":e?.category||"Other"}var Ns=/\b(bike|biking|treadmill|run|running|cardio|step.?mill|elliptical|stair.?master|stair.?climber|jog|jogging|cycling|spinning|spin class|rowing machine|row machine|\berg\b|sprints?|jump.?rope|skipping rope|swim|swimming|hike|hiking)\b/,js={Quadriceps:"Legs",Hamstrings:"Legs",Adductors:"Legs",Abductors:"Legs",Glutes:"Glutes",Calves:"Calves",Pectorals:"Chest","Anterior Deltoid":"Shoulders","Lateral Deltoid":"Shoulders","Posterior Deltoid":"Shoulders",Lats:"Back","Upper Back":"Back",Traps:"Back","Lower Back":"Back",Biceps:"Biceps",Triceps:"Triceps",Forearms:"Forearms",Abs:"Core",Obliques:"Core"};function Bt(e){let t=(e||"").toLowerCase().trim();if(!t)return"Full Body";if(Ns.test(t))return"Cardio";let s=j({name:t,category:""});return js[s]||"Full Body"}async function Tt(){if((await I("exercises")).length>0)return 0;let t=Date.now(),s=Fs.map(([n,o,i])=>({id:Y(),name:n,category:o,equipment:i,notes:"",isCustom:!1,createdAt:t}));return await oe("exercises",s),s.length}var Ct="workout";function It(e){Ct!==e&&(Ct=e,F("tab:changed",e))}var V=["Chest Day","Leg Day","Back/Bi Day"],Pe={"Chest Day":{key:"chest",short:"Chest",cssVar:"--day-chest"},"Leg Day":{key:"leg",short:"Legs",cssVar:"--day-leg"},"Back/Bi Day":{key:"back",short:"Back/Bi",cssVar:"--day-back"}};function He(e){let t=Pe[e];return t?`var(${t.cssVar})`:"var(--text-tertiary)"}function Je(e){if(!e)return null;let t=e.toLowerCase();return t.includes("chest")?"Chest Day":t.includes("leg")&&!t.includes("curl")&&!t.includes("extension")?"Leg Day":t.includes("back")||t.includes("pull")?"Back/Bi Day":t.includes("push")?"Chest Day":null}function Ze(e){for(let t of e){let s=Je(t.name);if(s)return{name:t.name,normalized:s,startedAt:t.startedAt}}return null}function We(e){let t=V.indexOf(e);return t===-1?V[0]:V[(t+1)%V.length]}var zs={Pectorals:"#ec4899",Triceps:"#be185d","Anterior Deltoid":"#831843","Lateral Deltoid":"#f9a8d4",Quadriceps:"#facc15",Hamstrings:"#b45309",Glutes:"#f59e0b",Calves:"#fde68a",Adductors:"#bdb76b",Abductors:"#78350f",Lats:"#2563eb","Upper Back":"#38bdf8",Biceps:"#1e40af","Posterior Deltoid":"#bfdbfe",Traps:"#0891b2","Lower Back":"#475569",Forearms:"#22c55e",Abs:"#ef4444",Obliques:"#14b8a6",Other:"#6b7280"};function qt(e){return zs[e]??"#6b7280"}var Vs={Pectorals:"Chest Day",Triceps:"Chest Day","Anterior Deltoid":"Chest Day","Lateral Deltoid":"Chest Day",Quadriceps:"Leg Day",Hamstrings:"Leg Day",Glutes:"Leg Day",Calves:"Leg Day",Adductors:"Leg Day",Abductors:"Leg Day",Lats:"Back/Bi Day","Upper Back":"Back/Bi Day",Biceps:"Back/Bi Day","Posterior Deltoid":"Back/Bi Day",Traps:"Back/Bi Day","Lower Back":"Back/Bi Day",Forearms:"Back/Bi Day"};function Us(e){return Vs[e]??null}function Ys(e,t,s){let n=Je(e);if(n)return n;let o=new Map;for(let a of t){let c=s.get(a.exerciseId);if(!c)continue;let u=Us(j(c));if(!u)continue;let x=(a.weight||0)*(a.reps||0);x<=0||o.set(u,(o.get(u)??0)+x)}let i=null,r=0;for(let[a,c]of o)c>r&&(i=a,r=c);return i}function Pt(e,t,s){let n=[...e].sort((r,a)=>r.startedAt-a.startedAt),o=new Map,i=null;for(let r of n){let a=Ys(r.name,t.get(r.id)??[],s);a||(i?Wt(i.startedAt,r.startedAt)?a=i.day:a=We(i.day):a=V[0]),o.set(r.id,a),i={day:a,startedAt:r.startedAt}}return o}function Ht(e){let t=parseInt(e.slice(1),16);return((t>>16&255)*299+(t>>8&255)*587+(t&255)*114)/1e3>=150?"#1c1c1e":"#ffffff"}function Wt(e,t){let s=new Date(e),n=new Date(t);return s.getFullYear()===n.getFullYear()&&s.getMonth()===n.getMonth()&&s.getDate()===n.getDate()}function _s(e,t){let s=Je(t?.name);if(s)return s;let n=Ze(e);return n?Wt(n.startedAt,Date.now())?n.normalized:We(n.normalized):V[0]}var Ks="lift-today-day";async function ae(){try{let[e,t]=await Promise.all([ee(),de()]),s=_s(e,t),n=Pe[s].key;document.documentElement.dataset.day!==n&&(document.documentElement.dataset.day=n);try{localStorage.setItem(Ks,n)}catch{}return s}catch{return null}}var Ot="lift-migrations-done-v3";async function et(){let e=await St();e.exercises>0&&console.info(`Removed ${e.exercises} cardio exercise(s), ${e.sets} set(s), ${e.workouts} cardio-only workout(s).`);let t=await $t(Bt);if(t.recategorized>0||t.deleted>0){console.info(`Reorganized "Other": recategorized ${t.recategorized}, removed ${t.deleted} cardio, dropped ${t.workouts} empty workout(s).`);let r=[];t.recategorized>0&&r.push(`sorted ${t.recategorized} exercise${t.recategorized===1?"":"s"}`),t.deleted>0&&r.push(`removed ${t.deleted} cardio`),O(`Cleaned up \u201COther\u201D: ${r.join(", ")}.`)}let s=await kt();s>0&&console.info(`Stripped equipment from ${s} exercise name(s).`);let n=await xt();n>0&&O(`Merged Butterfly into Chest Fly (${n} sets moved).`);let o=await Mt();o>0&&console.info(`Set a per-dose amount on ${o} medication(s).`);let i=await Lt();i.length>0&&(console.info(`Moved ${i.length} exercise(s) off "Other" equipment:
  ${i.join(`
  `)}`),O(`Sorted ${i.length} exercise${i.length===1?"":"s"} out of \u201COther\u201D equipment.`))}async function Rt(){try{if(localStorage.getItem(Ot))return}catch{}await et();try{localStorage.setItem(Ot,String(Date.now()))}catch{}}var pe="lift-backup-passphrase",Nt=25e4,Ft="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";function tt(e){let t=new Uint8Array(e),s="",n=32768;for(let o=0;o<t.length;o+=n)s+=String.fromCharCode.apply(null,t.subarray(o,o+n));return btoa(s)}var st=e=>Uint8Array.from(atob(e),t=>t.charCodeAt(0));function jt(){let t=[...crypto.getRandomValues(new Uint8Array(20))].map(s=>Ft[s%Ft.length]);return[0,5,10,15].map(s=>t.slice(s,s+5).join("")).join("-")}var z=null,nt=()=>{try{return localStorage.getItem(pe)}catch{return null}},ot=e=>{try{localStorage.setItem(pe,e)}catch{}};async function zt(){if(z)return z;let e=nt(),t=null;try{t=await ht(pe)}catch{}if(z=e||t||jt(),z!==e&&ot(z),z!==t)try{await Ae(pe,z)}catch{}return z}function it(){if(z)return z;let e=nt();return e||(e=jt(),ot(e)),z=e,Ae(pe,e).catch(()=>{}),e}function Vt(){return z||nt()}function Ut(e){z=e,ot(e),Ae(pe,e).catch(()=>{})}async function Yt(e,t){let s=await crypto.subtle.importKey("raw",new TextEncoder().encode(e),"PBKDF2",!1,["deriveKey"]);return crypto.subtle.deriveKey({name:"PBKDF2",hash:"SHA-256",salt:t,iterations:Nt},s,{name:"AES-GCM",length:256},!1,["encrypt","decrypt"])}function _t(e){return!!e&&e.lift==="encrypted-backup"&&typeof e.data=="string"}async function Kt(e,t){let s=crypto.getRandomValues(new Uint8Array(16)),n=crypto.getRandomValues(new Uint8Array(12)),o=await Yt(t,s),i=new TextEncoder().encode(JSON.stringify(e)),r=await crypto.subtle.encrypt({name:"AES-GCM",iv:n},o,i);return{lift:"encrypted-backup",v:1,exportedAt:new Date().toISOString(),kdf:{name:"PBKDF2",hash:"SHA-256",iterations:Nt,salt:tt(s)},cipher:"AES-GCM",iv:tt(n),data:tt(r)}}async function rt(e,t){let s=st(e.kdf.salt),n=st(e.iv),o=await Yt(t,s),i;try{i=await crypto.subtle.decrypt({name:"AES-GCM",iv:n},o,st(e.data))}catch{throw new Error("Wrong backup password (or the file is damaged).")}return JSON.parse(new TextDecoder().decode(i))}async function Gs(){let[e,t,s,n,o]=await Promise.all([I("exercises"),I("workouts"),I("sets"),I("stateOfMind"),I("medications")]);return{version:3,exportedAt:new Date().toISOString(),exercises:e,workouts:t,sets:s,stateOfMind:n,medications:o}}function Xs(){let e=new Date,t=s=>String(s).padStart(2,"0");return`lift-backup-${e.getFullYear()}${t(e.getMonth()+1)}${t(e.getDate())}-${t(e.getHours())}${t(e.getMinutes())}${t(e.getSeconds())}.json`}async function at(){let e=await Gs(),t=it(),s=await Kt(e,t),n=JSON.stringify(s),o=new Blob([n],{type:"application/json"}),i=URL.createObjectURL(o),r=Xs(),a=document.createElement("a");return a.href=i,a.download=r,a.style.display="none",document.body.appendChild(a),a.click(),setTimeout(()=>{document.body.removeChild(a),URL.revokeObjectURL(i)},1e3),{filename:r,bytes:o.size,snapshot:e}}async function Qs(e){let t=Vt();if(t)try{return await rt(e,t)}catch{}for(let s=0;s<3;s++){let n=prompt("Enter your backup password (saved in your Passwords app):");if(n==null)throw new Error("Restore cancelled.");try{let o=await rt(e,n.trim());return Ut(n.trim()),o}catch(o){if(s===2)throw o;alert("Wrong password \u2014 try again.")}}}async function Js(e){let t=JSON.parse(await e.text()),s=_t(t)?await Qs(t):t;if(!s||!Array.isArray(s.exercises)||!Array.isArray(s.workouts)||!Array.isArray(s.sets))throw new Error("File doesn't look like a Lift backup.");return await gt({exercises:s.exercises,workouts:s.workouts,sets:s.sets,stateOfMind:s.stateOfMind??[],medications:s.medications??[]}),await et(),{exercises:s.exercises.length,workouts:s.workouts.length,sets:s.sets.length,stateOfMind:(s.stateOfMind??[]).length}}function Gt(){let e=it();N({html:`
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
    `,onMount(t,s){t.querySelector("#bk-close").addEventListener("click",()=>s()),t.querySelector("#bk-copy").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(e),O("Password copied \u2014 save it in your Passwords app")}catch{O("Copy failed \u2014 long-press the password to select it")}}),t.querySelector("#bk-export").addEventListener("click",async()=>{try{let{filename:o,bytes:i}=await at();O(`Exported ${o} (${Zs(i)})`)}catch(o){O(`Export failed: ${o.message}`)}});let n=t.querySelector("#bk-file");t.querySelector("#bk-import").addEventListener("click",()=>{n.value="",n.click()}),n.addEventListener("change",async o=>{let i=o.target.files?.[0];if(i&&confirm("Replace all current data with this backup? This cannot be undone."))try{let r=await Js(i);s(),O(`Restored ${r.workouts} workouts, ${r.exercises} exercises`),F("data:changed")}catch(r){O(`Restore failed: ${r.message}`)}})}})}function Zs(e){return e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/(1024*1024)).toFixed(1)} MB`}var Jt=["Amazed","Excited","Happy","Joyful","Content","Calm","Relieved","Grateful","Hopeful","Confident","Proud","Surprised","Indifferent","Anxious","Stressed","Overwhelmed","Frustrated","Angry","Irritated","Sad","Lonely","Discouraged","Drained","Worried","Embarrassed"],Zt=["Health","Fitness","Self-Care","Hobbies","Identity","Community","Family","Friends","Partner","Work","Education","Money","Weather","Tasks"];function en(e){let t=Number(e);return isFinite(t)?Math.max(-1,Math.min(1,t)):0}async function es({id:e,kind:t,valence:s,labels:n,associations:o,date:i}){let r={id:e||Y(),kind:t==="dailyMood"?"dailyMood":"momentaryEmotion",date:i||Date.now(),valence:en(s),labels:n||[],associations:o||[]};return await R("stateOfMind",r),r}async function ts({id:e,nickname:t,form:s,hasSchedule:n,doseAmount:o,doseUnit:i}){let r=(t||"").trim()||"Medication",a=e?await J("medications",e):null,c=Number(o),u={id:e||Y(),nickname:r,isArchived:a?!!a.isArchived:!1,hasSchedule:!!n,doseAmount:c>0?c:1,doseUnit:(i||"").trim(),concept:{identifier:a?.concept?.identifier||"",displayText:a?.concept?.displayText||r,form:(s||"").trim(),rxnorm:a?.concept?.rxnorm||[]}};return await R("medications",u),u}async function ct(e,t){await le(e,t)}async function lt(){let[e,t]=await Promise.all([I("stateOfMind"),I("medications")]);return e.sort((s,n)=>s.date-n.date),t.sort((s,n)=>(s.nickname||"").localeCompare(n.nickname||"")),{stateOfMind:e,medications:t}}var Xt=e=>{let t=new Date(e);return`${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`},Qt=e=>e.length?e.reduce((t,s)=>t+s,0)/e.length:null;function ss(e,t){let s=new Set(t.map(a=>Xt(a.startedAt))),n=[],o=[];for(let a of e)(s.has(Xt(a.date))?n:o).push(a.valence);let i=Qt(n),r=Qt(o);return{onWorkout:i,offWorkout:r,delta:i!=null&&r!=null?i-r:null,onCount:n.length,offCount:o.length}}var tn=e=>new Date(e).toLocaleTimeString(void 0,{hour:"numeric",minute:"2-digit"}),as='<span style="font-size: 24px;">+</span>';async function dt(e,t){let s=()=>dt(e,t);e.setTitle("State of Mind"),e.setBack(t),e.setAction({html:as,onClick:()=>is(s)});let[{stateOfMind:n},o]=await Promise.all([lt(),ee()]),i=ss(n,o);e.container.innerHTML=`
    ${n.length?`
      <div class="section">Summary</div>
      <div class="form-section">
        <div class="stat-row"><div class="stat-label">Entries</div><div class="stat-value">${n.length.toLocaleString()}</div></div>
        <div class="stat-row"><div class="stat-label">Range</div><div class="stat-value">${K(n[0].date)} \u2013 ${K(n[n.length-1].date)}</div></div>
        <div class="stat-row"><div class="stat-label">Average mood</div><div class="stat-value">${Oe(an(n))}</div></div>
      </div>

      <div class="section">Mood vs. training</div>
      <div class="form-section">
        <div class="stat-row"><div class="stat-label">On workout days</div><div class="stat-value">${i.onWorkout!=null?Oe(i.onWorkout)+` (${i.onCount})`:"\u2014"}</div></div>
        <div class="stat-row"><div class="stat-label">On rest days</div><div class="stat-value">${i.offWorkout!=null?Oe(i.offWorkout)+` (${i.offCount})`:"\u2014"}</div></div>
        <div class="stat-row"><div class="stat-label">Difference</div><div class="stat-value">${i.delta!=null?(i.delta>=0?"+":"")+i.delta.toFixed(2):"\u2014"}</div></div>
      </div>

      <div class="section">Recent entries</div>
      <div class="list">${n.slice(-30).reverse().map(sn).join("")}</div>
    `:ls("","No mood entries","Tap \uFF0B to log how you're feeling.")}
  `,e.container.scrollTop=0;for(let r of e.container.querySelectorAll("[data-edit-som]")){let a=n.find(c=>c.id===r.dataset.editSom);a&&r.addEventListener("click",()=>is(s,a))}}function sn(e){let t=e.kind==="dailyMood",s=e.labels.length?e.labels.join(", "):t?"Daily mood":"Momentary emotion",n=[...e.labels.length?[t?"Daily mood":"Moment"]:[],K(e.date),tn(e.date),...e.associations.length?[e.associations.join(", ")]:[]].join(" \xB7 ");return`
    <button class="list-row" data-edit-som="${S(e.id)}">
      <div class="row-main">
        <div class="row-title">${S(s)}</div>
        <div class="row-subtitle">${S(n)}</div>
      </div>
      <div class="row-trailing">${Oe(e.valence)}</div>
      <div class="chevron">\u203A</div>
    </button>`}async function ut(e,t){let s=()=>ut(e,t);e.setTitle("Medications"),e.setBack(t),e.setAction({html:as,onClick:()=>rs(s)});let{medications:n}=await lt();e.container.innerHTML=n.length?`
    <div class="section">Daily</div>
    ${ns(n.filter(i=>i.hasSchedule))}
    ${ns(n.filter(i=>!i.hasSchedule),"As needed")}
    <div class="section-footer">Tap a medication to edit its name, form, or amount.</div>
  `:ls("\u{1F48A}","No medications","Tap \uFF0B to add the medications you take."),e.container.scrollTop=0;let o=new Map(n.map(i=>[i.id,i]));for(let i of e.container.querySelectorAll("[data-edit-med]")){let r=o.get(i.dataset.editMed);r&&i.addEventListener("click",()=>rs(s,r))}}function ns(e,t){return e.length===0?"":`
    ${t?`<div class="section">${S(t)}</div>`:""}
    <div class="list">${e.map(nn).join("")}</div>`}function nn(e){let t=on(e);return`
    <button class="list-row" data-edit-med="${S(e.id)}">
      <div class="row-main">
        <div class="row-title">${S(e.nickname||e.concept.displayText)}</div>
        ${t?`<div class="row-subtitle">${S(t)}</div>`:""}
      </div>
      <div class="chevron">\u203A</div>
    </button>`}function on(e){let t=cs(e),s=(e.concept?.form||"").trim(),n=(e.doseUnit||"").trim();if(s&&t>1&&n&&s.toLowerCase().includes(n.toLowerCase()))return`${ds(t)} \xD7 ${s}`;if(s&&t===1)return s;let o=rn(t,n);return s?`${o} \xB7 ${s}`:o}var cs=e=>Number(e?.doseAmount)>0?Number(e.doseAmount):1;function rn(e,t){let s=(t||"").trim()||"dose",n=e===1||/^(mg|mcg|ml|cc|g|kg|l|oz|iu)$/i.test(s)||s.endsWith("s")?s:`${s}s`;return`${ds(e)} ${n}`}function ls(e,t,s){return`
    <div class="empty-state" style="padding: 48px 24px; min-height: auto;">
      ${e?`<div class="empty-icon">${e}</div>`:""}
      <h2>${S(t)}</h2>
      <p>${S(s)}</p>
    </div>`}function an(e){return e.reduce((t,s)=>t+s.valence,0)/e.length}var ds=e=>Number.isInteger(e)?String(e):String(Number(e.toFixed(3)));function us(e){return e>=.7?["Very pleasant","#2ba758"]:e>=.4?["Pleasant","#54a85a"]:e>=.1?["Slightly pleasant","#9cad46"]:e>-.1?["Neutral","#8a8a8e"]:e>-.4?["Slightly unpleasant","#d99a3c"]:e>-.7?["Unpleasant","#e07a4e"]:["Very unpleasant","#e0574f"]}function Oe(e){let[t,s]=us(e);return`<span class="hz-pill" style="--pc: ${s};">${S(t)}</span>`}function ps(e){let t=new Date(e),s=n=>String(n).padStart(2,"0");return`${t.getFullYear()}-${s(t.getMonth()+1)}-${s(t.getDate())}T${s(t.getHours())}:${s(t.getMinutes())}`}var cn=()=>ps(Date.now());function ln(e){let t=e?new Date(e).getTime():NaN;return isFinite(t)?t:Date.now()}var dn=e=>Math.max(-3,Math.min(3,Math.round(e*3)));function os(e,t=[]){return e.map(s=>`<button type="button" class="chip${t.includes(s)?" active":""}" data-chip="${S(s)}">${S(s)}</button>`).join("")}function Re(e,t,s={}){for(let n of e.querySelectorAll(`${t} .chip`))n.addEventListener("click",()=>{s.single&&e.querySelectorAll(`${t} .chip`).forEach(o=>o.classList.remove("active")),n.classList.toggle("active",s.single?!0:!n.classList.contains("active"))})}var Fe=(e,t)=>[...e.querySelectorAll(`${t} .chip.active`)].map(s=>s.dataset.chip);function is(e,t=null){let s=!!t,n=s&&t.kind==="dailyMood",o=s?dn(t.valence):1,i=s?t.valence:o/3,r=N({html:`
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
          <input type="range" class="mood-slider" id="som-val" min="-3" max="3" step="1" value="${o}" />
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
    `,onMount(a){let c=a.querySelector("#som-val"),u=a.querySelector("#som-val-label"),x=()=>{u.textContent=us(Number(c.value)/3)[0]};x(),c.addEventListener("input",()=>{i=Number(c.value)/3,x()}),Re(a,"#som-kind",{single:!0}),Re(a,"#som-emotions"),Re(a,"#som-assoc"),a.querySelector("#som-cancel").addEventListener("click",()=>r()),a.querySelector("#som-save").addEventListener("click",async()=>{await es({id:t?.id,kind:Fe(a,"#som-kind")[0]||"momentaryEmotion",valence:i,labels:Fe(a,"#som-emotions"),associations:Fe(a,"#som-assoc"),date:ln(a.querySelector("#som-date").value)}),r(),O(s?"Entry updated":"Logged State of Mind"),e?.()}),a.querySelector("#som-delete")?.addEventListener("click",async()=>{confirm("Delete this entry?")&&(await ct("stateOfMind",t.id),r(),O("Entry deleted"),e?.())})}})}function rs(e,t=null){let s=!!t,n=s?!!t.hasSchedule:!0,o=N({html:`
      <div class="sheet-header">
        <button class="btn-text" id="med-cancel">Cancel</button>
        <div class="title">${s?"Edit Medication":"Add Medication"}</div>
        <button class="btn-text primary" id="med-save"${s?"":" disabled"}>Save</button>
      </div>
      <div class="sheet-content">
        <div class="section">Name</div>
        <div class="form-section">
          <div class="form-row"><input id="med-name" placeholder="e.g. Sertraline" value="${s?S(t.nickname||t.concept.displayText):""}" style="text-align: left;" /></div>
        </div>
        <div class="section">Form (optional)</div>
        <div class="form-section">
          <div class="form-row"><input id="med-form" placeholder="e.g. tablet, 50 mg" value="${s?S(t.concept?.form||""):""}" style="text-align: left;" /></div>
        </div>
        <div class="section">Amount per dose</div>
        <div class="form-section">
          <div class="form-row"><input type="number" id="med-amount" inputmode="decimal" min="0" step="0.25" value="${s?S(String(cs(t))):"1"}" style="text-align: left;" /></div>
          <div class="form-row"><input id="med-unit" placeholder="unit \u2014 e.g. capsule, tablet, mg" value="${s?S(t.doseUnit||""):""}" style="text-align: left;" /></div>
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
    `,onMount(i){let r=i.querySelector("#med-name"),a=i.querySelector("#med-save");r.addEventListener("input",()=>{a.disabled=r.value.trim().length===0}),Re(i,"#med-type",{single:!0}),i.querySelector("#med-cancel").addEventListener("click",()=>o()),a.addEventListener("click",async()=>{r.value.trim()&&(await ts({id:t?.id,nickname:r.value,form:i.querySelector("#med-form").value,hasSchedule:(Fe(i,"#med-type")[0]||"daily")==="daily",doseAmount:i.querySelector("#med-amount").value,doseUnit:i.querySelector("#med-unit").value}),o(),O(s?"Medication updated":"Medication added"),e?.())}),i.querySelector("#med-delete")?.addEventListener("click",async()=>{confirm("Delete this medication?")&&(await ct("medications",t.id),o(),O("Medication deleted"),e?.())}),s||setTimeout(()=>r.focus(),50)}})}var Ne=[{key:"1W",tick:"1W",days:7},{key:"1M",tick:"1M",days:30},{key:"3M",tick:"3M",days:90},{key:"1Y",tick:"1Y",days:365},{key:"All",tick:"All",all:!0}];function un(e){let t=new Map;for(let s of e){let n=new Date(s.date),o=`${n.getFullYear()}-${n.getMonth()}-${n.getDate()}`,i=t.get(o)||{date:s.date,total:0,count:0};i.total+=s.value,i.count+=1,i.date=Math.min(i.date,s.date),t.set(o,i)}return[...t.values()].map(s=>({date:s.date,value:s.total/s.count})).sort((s,n)=>s.date-n.date)}function be(e,t,s={}){let n=t.length>0&&t[0].points!==void 0,o=(n?t:[{points:t}]).map(m=>({label:m.label??"",color:m.color||"var(--accent)",dashed:!!m.dashed,points:un(m.points)})).filter(m=>m.points.length>0),i=s.defaultPeriod||"All",r=Math.max(0,Ne.findIndex(m=>m.key===i)),a=Ne.length-1,c=null;function u(){let m=Ne[r],w=o.map(($,L)=>c===null||L===c?$.points:[]);if(m.all)return w;let T=Date.now()-m.days*864e5,b=w.map($=>$.filter(L=>L.date>=T));return b.every($=>$.length===0)?w.map($=>$.slice(-1)):b}let x=n&&o.some(m=>m.label)?`<div class="chart-legend">${o.map((m,w)=>`<button class="legend-item${m.dashed?" legend-dashed":""}" data-i="${w}" style="--dcolor: ${m.color};" aria-pressed="false">${m.label}</button>`).join("")}</div>`:"";e.innerHTML=`
    <div class="chart-scrub-readout" data-role="scrub"></div>
    ${x}
    <div class="chart-container" data-role="chart"></div>
    <div class="chart-daterange" data-role="range"></div>
    <div class="chart-slider">
      <input type="range" class="chart-range" min="0" max="${a}" step="1"
             value="${r}" aria-label="Time range" />
      <div class="chart-slider-ticks">
        ${Ne.map((m,w)=>`<span data-i="${w}">${m.tick}</span>`).join("")}
      </div>
    </div>
  `;let E=e.querySelector('[data-role="scrub"]'),l=e.querySelector('[data-role="chart"]'),d=e.querySelector('[data-role="range"]'),A=e.querySelector(".chart-range"),v=[...e.querySelectorAll(".chart-slider-ticks span")],g=s.unit||"lbs",f=null;function h(){let m=u(),w=pn(m,o,g,c!==null);l.innerHTML=w.html,f=w.geom;let T=m.flat();if(T.length>=2){let b=Math.min(...T.map(L=>L.date)),$=Math.max(...T.map(L=>L.date));d.innerHTML=`<span>${pt(b)}</span><span>${pt($)}</span>`}else d.innerHTML="";v.forEach((b,$)=>b.classList.toggle("active",$===r))}A.addEventListener("input",()=>{r=Number(A.value),C(),h()});let y=[...e.querySelectorAll(".chart-legend .legend-item")];for(let m of y)m.addEventListener("click",()=>{let w=Number(m.dataset.i);c=c===w?null:w,y.forEach((T,b)=>{T.classList.toggle("dimmed",c!==null&&b!==c),T.setAttribute("aria-pressed",String(c===b))}),C(),h()});function k(m){if(!f||f.pts.length<2)return;let w=l.querySelector("svg"),T=w?.getScreenCTM();if(!T)return;let b=new DOMPoint(m,0).matrixTransform(T.inverse()).x,$=0,L=1/0;f.pts.forEach((D,H)=>{let W=Math.abs(D.x-b);W<L&&(L=W,$=H)});let B=f.pts[$],q=w.querySelector(".chart-scrub-line"),p=w.querySelector(".chart-scrub-dot");q&&(q.setAttribute("x1",B.x),q.setAttribute("x2",B.x),q.removeAttribute("visibility")),p&&(p.setAttribute("cx",B.x),p.setAttribute("cy",B.y),p.style.fill=B.color,p.removeAttribute("visibility"));let M=B.label?` \xB7 ${B.label}`:"";E.textContent=`${pt(B.date)}${M} \xB7 ${Math.round(B.value).toLocaleString()} ${g}`}function C(){E.textContent="";let m=l.querySelector("svg");m?.querySelector(".chart-scrub-line")?.setAttribute("visibility","hidden"),m?.querySelector(".chart-scrub-dot")?.setAttribute("visibility","hidden")}let P=!1;l.addEventListener("pointerdown",m=>{P=!0,l.setPointerCapture?.(m.pointerId),k(m.clientX)}),l.addEventListener("pointermove",m=>{P&&k(m.clientX)});for(let m of["pointerup","pointercancel"])l.addEventListener(m,()=>{P=!1,C()});h()}function pt(e){return new Date(e).toLocaleDateString(void 0,{month:"short",day:"numeric",year:"numeric"})}function pn(e,t,s,n){let r={top:16,right:14,bottom:14,left:52},a=400-r.left-r.right,c=200-r.top-r.bottom,u=e.flat();if(u.length===0)return{html:`<svg viewBox="0 0 400 200"><text x="${400/2}" y="${200/2}" text-anchor="middle" class="chart-axis-label">No data in range</text></svg>`,geom:null};if(u.length===1){let L=u[0],B=t[e.findIndex(M=>M.length>0)]?.color||"var(--accent)",q=r.left+a/2,p=r.top+c/2;return{html:`<svg viewBox="0 0 400 200"><circle cx="${q}" cy="${p}" r="4" class="chart-point" style="fill: ${B};"/><text x="${q}" y="${p-10}" text-anchor="middle" class="chart-axis-label">${Math.round(L.value).toLocaleString()} ${s}</text></svg>`,geom:null}}let x=u.map(L=>L.date),E=u.map(L=>L.value),l=Math.min(...x),d=Math.max(...x),A=Math.max(...E),v=Math.min(...E),g=Math.max(A-v,1),f=Math.max(0,v-g*.12),h=A+g*.12,y=L=>r.left+(L-l)/Math.max(d-l,1)*a,k=L=>r.top+c-(L-f)/(h-f)*c,C=4,P=L=>Math.round(L).toLocaleString(),m=Array.from({length:C+1},(L,B)=>{let q=f+(h-f)*B/C,p=k(q);return`<text x="${r.left-6}" y="${p+3}" text-anchor="end" class="chart-axis-label">${P(q)}</text>`}).join(""),w=Array.from({length:C+1},(L,B)=>{let q=r.top+c*B/C;return`<line x1="${r.left}" x2="${400-r.right}" y1="${q}" y2="${q}" class="chart-axis-line"/>`}).join(""),T=[],b=e.map((L,B)=>{let q=t[B],p=L.map(D=>({x:y(D.date),y:k(D.value)}));if(L.forEach((D,H)=>T.push({...p[H],date:D.date,value:D.value,label:q.label,color:q.color})),p.length===0)return"";if(p.length===1)return`<circle cx="${p[0].x}" cy="${p[0].y}" r="3.5" class="chart-point" style="fill: ${q.color};"/>`;let M=q.dashed&&!n?" chart-line-dashed":"";return`<path d="${fn(p)}" class="chart-line${M}" style="stroke: ${q.color};"/>`}).join("");return{html:`
    <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet">
      ${w}
      ${m}
      ${b}
      <line class="chart-scrub-line" y1="${r.top}" y2="${r.top+c}" x1="0" x2="0" visibility="hidden"/>
      <circle class="chart-scrub-dot" r="4.5" visibility="hidden"/>
    </svg>
  `,geom:{pts:T}}}function fn(e){if(e.length<2)return"";let t=`M ${e[0].x.toFixed(1)} ${e[0].y.toFixed(1)}`;for(let s=0;s<e.length-1;s++){let n=e[s===0?0:s-1],o=e[s],i=e[s+1],r=e[s+2]||i,a=o.x+(i.x-n.x)/6,c=o.y+(i.y-n.y)/6,u=i.x-(r.x-o.x)/6,x=i.y-(r.y-o.y)/6;t+=` C ${a.toFixed(1)} ${c.toFixed(1)}, ${u.toFixed(1)} ${x.toFixed(1)}, ${i.x.toFixed(1)} ${i.y.toFixed(1)}`}return t}var se=null;function ms(e){let t=!0;return vs().then(s=>{t&&(se=s,xe(e))}).catch(s=>{t&&(e.container.innerHTML=te(s))}),()=>{t=!1}}async function vs(){let[e,t,s]=await Promise.all([ee(),I("sets"),I("exercises")]),n=new Map(s.map(v=>[v.id,v])),o=new Map;for(let v of Z(t))o.has(v.workoutId)||o.set(v.workoutId,[]),o.get(v.workoutId).push(v);let i=0,r=0,a=new Map,c=[],u=new Map,x=new Map,E=Pt(e,o,n);for(let v of e){let g=o.get(v.id)||[],f=g.reduce((h,y)=>h+y.weight*y.reps,0);if(i+=f,r+=g.length,f>0){let h=E.get(v.id);a.has(h)||a.set(h,[]),a.get(h).push({date:v.startedAt,value:f}),c.push({date:v.startedAt,value:f})}for(let h of g){let y=n.get(h.exerciseId);if(!y)continue;let k=u.get(h.exerciseId)||{id:h.exerciseId,exercise:y,count:0};if(k.count+=1,u.set(h.exerciseId,k),h.weight>0&&h.reps>0){let C=x.get(h.exerciseId);(!C||h.weight>C.weight||h.weight===C.weight&&h.reps>C.reps)&&x.set(h.exerciseId,{id:h.exerciseId,weight:h.weight,reps:h.reps,date:v.startedAt,name:G(y)})}}}let l=Array.from(u.entries()).sort((v,g)=>g[1].count-v[1].count).map(([,v])=>v),d=Array.from(x.values()).sort((v,g)=>g.weight-v.weight),A=V.filter(v=>a.has(v)).map(v=>({label:Pe[v].short,color:He(v),points:a.get(v)}));if(A.length>0){let v=c.sort((f,h)=>f.date-h.date),g=Math.min(V.length,v.length);A.push({label:"Avg",color:"var(--day-avg)",dashed:!0,points:v.slice(g-1).map((f,h)=>{let y=v.slice(h,h+g);return{date:f.date,value:y.reduce((k,C)=>k+C.value,0)/g}})})}return{workouts:e,allSets:t,allExercises:s,exMap:n,setsByWorkout:o,totalVolume:i,totalSets:r,volumeSeries:A,topExercises:l,prs:d}}function xe(e){e.setTitle("Progress"),e.setBack(null),e.setAction({label:"Backup and restore",html:At(),onClick:()=>Gt()}),e.container.scrollTop=0;let t=`
    <button class="list-row" data-page="meds">
      <div class="row-main"><div class="row-title">Medications</div></div>
      <div class="chevron">\u203A</div>
    </button>`;if(!se||se.workouts.length===0){e.container.innerHTML=`
      <div class="empty-state" style="padding: 48px 24px; min-height: auto;">
        <h2>No data yet</h2>
        <p>Finish a workout and your stats and trends will show up here.</p>
      </div>
      <div class="list">${t}</div>
    `,fs(e);return}let{workouts:s,totalVolume:n,totalSets:o,volumeSeries:i,topExercises:r,prs:a}=se;e.container.innerHTML=`
    <div class="section">Totals</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Total Volume</div><div class="stat-value">${ue(n)}</div></div>
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
  `;let c=e.container.querySelector(".volume-chart-mount");c&&i.length>0&&be(c,i,{unit:"lbs"}),fs(e)}function fs(e){for(let t of e.container.querySelectorAll("[data-page]"))t.addEventListener("click",()=>{let s=t.dataset.page;s==="trained"?mn(e):s==="prs"?vn(e):s==="history"?hs(e):s==="meds"&&ut(e,()=>xe(e))})}function mn(e){e.setTitle("Most-Trained"),e.setBack(()=>xe(e)),e.setAction(null);let{topExercises:t}=se;e.container.innerHTML=`
    <div class="list" style="margin-top: 16px;">
      ${t.map(s=>`
        <button class="list-row" data-exercise-id="${S(s.id)}">
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
        <button class="list-row" data-exercise-id="${S(s.id)}" style="align-items: flex-start;">
          <div class="row-main">
            <div class="row-title">${S(s.name)}</div>
            <div class="row-subtitle">${K(s.date)}</div>
          </div>
          <div class="row-trailing" style="text-align: right;">
            <div style="font-weight: 600; color: var(--text);">${we(s.weight)} lbs</div>
            <div style="font-size: 12px; color: var(--text-tertiary);">${s.reps} rep${s.reps===1?"":"s"}</div>
          </div>
          <div class="chevron">\u203A</div>
        </button>
      `).join("")}
    </div>
  `,e.container.scrollTop=0,ft(e)}function ft(e){for(let t of e.container.querySelectorAll("[data-exercise-id]"))t.addEventListener("click",()=>{je(t.dataset.exerciseId)})}function hs(e){e.setTitle("Workout History"),e.setBack(()=>xe(e)),e.setAction(null);let{workouts:t,setsByWorkout:s,exMap:n}=se;e.container.innerHTML=`
    <div class="list" style="margin-top: 16px;">
      ${t.map(o=>hn(o,s.get(o.id)||[],n)).join("")}
    </div>
  `,e.container.scrollTop=0;for(let o of e.container.querySelectorAll("[data-workout-id]"))o.addEventListener("click",()=>{let i=o.dataset.workoutId;gn(e,i).catch(r=>{e.container.innerHTML=te(r)})})}function hn(e,t,s){let n=t,o=n.reduce((c,u)=>c+u.weight*u.reps,0),i=(e.endedAt-e.startedAt)/1e3,r=[],a=new Set;for(let c of t){if(a.has(c.exerciseId))continue;a.add(c.exerciseId);let u=s.get(c.exerciseId);if(u&&r.push(u.name),r.length>=3)break}return`
    <button class="list-row" data-workout-id="${e.id}">
      <div class="row-main">
        <div class="row-title" style="font-weight: 600;">${S(e.name)}</div>
        <div class="row-subtitle" style="margin-top: 4px;">
          ${K(e.startedAt)} \xB7 ${Ge(i)} \xB7 ${n.length} sets \xB7 ${ue(o)}
        </div>
        ${r.length>0?`<div class="row-subtitle" style="margin-top: 4px;">${S(r.join(" \xB7 "))}${a.size>3?" \u2026":""}</div>`:""}
      </div>
      <div class="chevron">\u203A</div>
    </button>
  `}async function gs(e){let[t,s,n]=await Promise.all([J("workouts",e),I("exercises"),wt(e)]);if(!t)return null;let o=new Map(s.map(l=>[l.id,l])),i=new Map,r=[];for(let l of n)i.has(l.exerciseId)||(i.set(l.exerciseId,[]),r.push(l.exerciseId)),i.get(l.exerciseId).push(l);let a=Z(n),c=a.reduce((l,d)=>l+d.weight*d.reps,0),u=a.length,x=(t.endedAt-t.startedAt)/1e3,E=`
    <div class="section">Summary</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Date</div><div class="stat-value">${Dt(t.startedAt)}</div></div>
      <div class="stat-row"><div class="stat-label">Duration</div><div class="stat-value">${Ge(x)}</div></div>
      <div class="stat-row"><div class="stat-label">Total Volume</div><div class="stat-value">${ue(c)}</div></div>
      <div class="stat-row"><div class="stat-label">Completed Sets</div><div class="stat-value">${u}</div></div>
    </div>

    ${r.map(l=>{let d=o.get(l),A=i.get(l),v=0,g=0;return`
        ${d?`<button class="section section-link" data-exercise-id="${S(l)}">${S(G(d))}<span class="name-chevron">\u203A</span></button>`:'<div class="section">Unknown exercise</div>'}
        <div class="form-section">
          ${A.map(h=>{let k=(h.setType||"working")==="warmup"?`W${++g}`:String(++v);return`
              <div class="stat-row">
                <div class="stat-label">Set ${k}</div>
                <div class="stat-value hist-edit">
                  <input class="hist-input" type="number" inputmode="decimal" step="0.5" aria-label="Weight in pounds for set ${k}"
                         data-set-id="${h.id}" data-field="weight" value="${h.weight>0?h.weight:""}" placeholder="0" />
                  <span>lbs \xD7</span>
                  <input class="hist-input" type="number" inputmode="numeric" step="1" aria-label="Repetitions for set ${k}"
                         data-set-id="${h.id}" data-field="reps" value="${h.reps>0?h.reps:""}" placeholder="0" />
                </div>
              </div>
            `}).join("")}
        </div>
      `}).join("")}
  `;return{workout:t,html:E,sets:n}}function ws(e,t){for(let s of e.querySelectorAll("input.hist-input[data-set-id]"))s.addEventListener("input",async()=>{let n=t.find(o=>o.id===s.dataset.setId);n&&(s.dataset.field==="weight"?n.weight=parseFloat(s.value)||0:n.reps=parseInt(s.value,10)||0,await R("sets",{...n}))})}async function gn(e,t){e.setBack(async()=>{se=await vs(),hs(e)}),e.setAction({label:"Delete workout",html:Ce(),onClick:async()=>{confirm("Delete this workout?")&&(await Te(t),F("data:changed"))}});let s=await gs(t);if(!s){e.container.innerHTML=te({message:"Workout not found."});return}e.setTitle(s.workout.name),e.container.innerHTML=s.html,e.container.scrollTop=0,ft(e),ws(e.container,s.sets)}async function ys(e){let t=await gs(e);if(!t)return;let s=N({html:`
      <div class="sheet-header">
        <button class="btn-text" id="wd-close">Done</button>
        <div class="title">${S(t.workout.name)}</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">${t.html}</div>
    `,onMount(n){n.querySelector("#wd-close").addEventListener("click",()=>s());for(let o of n.querySelectorAll("[data-exercise-id]"))o.addEventListener("click",()=>je(o.dataset.exerciseId));ws(n,t.sets)}})}function bs(e){let t=!0;return xs(e).catch(s=>{t&&(e.container.innerHTML=te(s))}),()=>{t=!1}}async function xs(e){e.setTitle("Exercises"),e.setBack(null),e.setAction({label:"Add exercise",html:'<span style="font-size: 24px;">+</span>',onClick:()=>{ke(null)}});let[t,s]=await Promise.all([I("exercises"),I("sets")]),n=t.sort((l,d)=>l.name.localeCompare(d.name)),o=new Map;for(let l of s)o.set(l.exerciseId,(o.get(l.exerciseId)??0)+1);let i="",r=null;e.container.innerHTML=`
    <div class="search-bar">
      <input class="search-input" id="ex-search" placeholder="Search exercises" />
    </div>
    <div class="chip-row" id="ex-chips"></div>
    <div class="list" id="ex-list"></div>
  `,e.container.scrollTop=0;let a=e.container.querySelector("#ex-list"),c=e.container.querySelector("#ex-chips"),u=e.container.querySelector("#ex-search");function x(){c.innerHTML=qe(n,r);for(let l of c.querySelectorAll(".chip"))l.addEventListener("click",()=>{let d=l.dataset.cat;r=d==="All"?null:d,x(),E()})}function E(){let l=n.filter(d=>!r||j(d)===r).filter(d=>!i||d.name.toLowerCase().includes(i.toLowerCase()));if(l.length===0){a.innerHTML='<div class="list-row"><div class="row-main" style="color: var(--text-secondary);">No matches</div></div>';return}a.innerHTML=l.map(d=>`
        <button class="list-row" data-id="${d.id}">
          ${ie(d)}
          <div class="row-trailing trailing-stack">${re(o.get(d.id)??0)}</div>
          <div class="chevron">\u203A</div>
        </button>
      `).join("");for(let d of a.querySelectorAll("[data-id]"))d.addEventListener("click",()=>{wn(e,d.dataset.id).catch(A=>{e.container.innerHTML=te(A)})})}u.addEventListener("input",()=>{i=u.value,E()}),x(),E()}function wn(e,t){return ze(e,t,()=>xs(e))}async function ze(e,t,s){e.setBack(s);let n=await Ss(t);if(!n){e.container.innerHTML=te({message:"Exercise not found."});return}e.setTitle(G(n.exercise)),e.setAction(n.exercise.isCustom?{label:"Delete exercise",html:Ce(),onClick:async()=>{if(n.completed.length>0){alert(`Can't delete \u2014 this exercise has ${n.completed.length} logged set${n.completed.length===1?"":"s"}.`);return}confirm("Delete this custom exercise?")&&(await le("exercises",t),F("data:changed"))}}:null),e.container.innerHTML=n.html,e.container.scrollTop=0,e.container.querySelector("#exd-edit")?.addEventListener("click",()=>{ke(n.exercise,()=>ze(e,t,s))}),ks(e.container);let o=e.container.querySelector(".exercise-chart-mount");o&&n.chartData.length>0&&be(o,n.chartData,{unit:"lbs"})}function ks(e){for(let t of e.querySelectorAll(".recent-set[data-workout-id]"))t.addEventListener("click",()=>ys(t.dataset.workoutId))}async function je(e){let t=await Ss(e);if(!t)return;let s=N({html:`
      <div class="sheet-header">
        <button class="btn-text" id="exd-close">Done</button>
        <div class="title">${S(G(t.exercise))}</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">${t.html}</div>
    `,onMount(n){n.querySelector("#exd-close").addEventListener("click",()=>s()),n.querySelector("#exd-edit")?.addEventListener("click",()=>{ke(t.exercise,()=>{s(),F("data:changed"),je(e)})}),ks(n);let o=n.querySelector(".exercise-chart-mount");o&&t.chartData.length>0&&be(o,t.chartData,{unit:"lbs"})}})}async function Ss(e){let[t,s,n,o]=await Promise.all([J("exercises",e),I("sets"),I("workouts"),de()]);if(!t)return null;let i=new Map(n.map(l=>[l.id,l])),r=Z(s).filter(l=>l.exerciseId===e&&l.workoutId!==o?.id&&i.has(l.workoutId)).map(l=>({...l,workout:i.get(l.workoutId)})).sort((l,d)=>l.workout.startedAt-d.workout.startedAt),a=r.reduce((l,d)=>l+d.weight*d.reps,0),c=r.reduce((l,d)=>!l||d.weight>l.weight||d.weight===l.weight&&d.reps>l.reps?d:l,null),u=new Map;for(let l of r){if(l.weight<=0||l.reps<=0||(l.setType||"working")==="warmup")continue;let d=u.get(l.workoutId)||{date:l.workout.startedAt,total:0,count:0};d.total+=l.weight*l.reps,d.count+=1,u.set(l.workoutId,d)}let x=Array.from(u.values()).map(({date:l,total:d,count:A})=>({date:l,value:d/A})).sort((l,d)=>l.date-d.date),E=`
    <div class="section">Details</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Equipment</div><div class="stat-value">${S(t.equipment)}</div></div>
      <div class="stat-row"><div class="stat-label">Muscle</div><div class="stat-value">${S(j(t))}</div></div>
      <button class="list-row button" id="exd-edit">
        <div class="row-main"><div class="row-title" style="color: var(--accent);">Edit Name, Muscle & Equipment</div></div>
      </button>
    </div>

    ${r.length>0?`
      <div class="section">Stats</div>
      <div class="form-section">
        <div class="stat-row"><div class="stat-label">Total Sets</div><div class="stat-value">${r.length.toLocaleString()}</div></div>
        <div class="stat-row"><div class="stat-label">Total Volume</div><div class="stat-value">${ue(a)}</div></div>
        ${c?`<div class="stat-row"><div class="stat-label">Best Set</div><div class="stat-value">${we(c.weight)} \xD7 ${c.reps}</div></div>`:""}
      </div>
    `:""}

    ${x.length>0?`
      <div class="section">Avg working-set volume per workout</div>
      <div class="exercise-chart-mount"></div>
    `:""}

    ${r.length>0?`
      <div class="section">Recent Sets \xB7 tap to view that workout</div>
      <div class="form-section">
        ${r.slice(-30).reverse().map(l=>`
          <button class="stat-row recent-set" data-workout-id="${S(l.workoutId)}">
            <div class="stat-label" style="font-size: 13px; color: var(--text-secondary);">${K(l.workout.startedAt)}</div>
            <div class="stat-value" style="color: var(--text);">${we(l.weight)} \xD7 ${l.reps} <span class="name-chevron">\u203A</span></div>
          </button>
        `).join("")}
      </div>
    `:`
      <div class="empty-state" style="padding: 32px 24px;">
        <p style="color: var(--text-secondary);">No completed sets yet.</p>
      </div>
    `}
  `;return{exercise:t,completed:r,chartData:x,html:E}}function Es(e){let t=!0,s=null;return e.container.innerHTML="",de().then(n=>{t&&(n?s=kn(e,n):yn(e))}).catch(n=>{t&&(e.container.innerHTML=`<div class="empty-state"><div class="empty-icon">!</div><h2>Couldn't load</h2><p>${S(n.message)}</p></div>`)}),()=>{t=!1,typeof s=="function"&&s()}}async function yn(e){e.setTitle("Workout");let t=await ee(),s=t[0],n=Ze(t),o=n?We(n.normalized):V[0],r=n&&$s(n.startedAt)==="today"?"Tomorrow":"Today",a=s?`<div class="last-workout-hint">Last: <strong>${S(s.name)}</strong> \xB7 ${$s(s.startedAt)}</div>`:"",c=`<div class="next-workout-hint">${r}: <strong>${S(o)}</strong></div>`;e.container.innerHTML=`
    <div class="workout-start">
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
  `,e.container.querySelector("#start-btn").addEventListener("click",()=>bn(o,r));for(let u of e.container.querySelectorAll("[data-nav]"))u.addEventListener("click",()=>dt(e,()=>e.refresh()))}function $s(e){let t=new Date,s=new Date(e),n=i=>new Date(i.getFullYear(),i.getMonth(),i.getDate()).getTime(),o=Math.round((n(t)-n(s))/(1440*60*1e3));return o===0?"today":o===1?"yesterday":o<7?`${o} days ago`:o<14?"a week ago":`${Math.round(o/7)} weeks ago`}function bn(e,t="Today"){xn(e,async s=>{let n={id:Y(),name:s,startedAt:Date.now(),endedAt:null,notes:""};await R("workouts",n),F("workout:changed")},t)}function xn(e,t,s="Today"){let o=N({html:`
      <div class="sheet-header">
        <button class="btn-text" id="wt-cancel">Cancel</button>
        <div class="title">New Workout</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">
        <div class="section">Pick a type</div>
        <div class="form-section">
          ${V.map(i=>{let a=i===e?` <span class="badge">${S(s)}</span>`:"";return`
              <button class="list-row button" data-name="${S(i)}">
                <div class="row-main"><div class="row-title" style="color: ${He(i)}; font-weight: 600;">${S(i)}${a}</div></div>
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
    `,onMount(i){i.querySelector("#wt-cancel").addEventListener("click",()=>o());for(let c of i.querySelectorAll(".list-row.button[data-name]"))c.addEventListener("click",()=>{let u=c.dataset.name;o(),t(u)});let r=i.querySelector("#wt-custom"),a=i.querySelector("#wt-go");r.addEventListener("input",()=>{a.disabled=r.value.trim().length===0}),a.addEventListener("click",()=>{let c=r.value.trim();c&&(o(),t(c))}),setTimeout(()=>r.focus(),50)}})}function kn(e,t){let s=[],n=[],o=new Map,i=new Map,r=null;e.container.innerHTML=`
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
  `,e.container.querySelector("#calc-fab").addEventListener("click",Tn);let a=()=>{e.setTitle(Et((Date.now()-t.startedAt)/1e3))};a(),r=setInterval(a,1e3);let c=e.container.querySelector("#wname");c.addEventListener("input",async()=>{t.name=c.value,await R("workouts",{...t}),ae()});let u=new Map;e.container.querySelector("#add-exercise-btn").addEventListener("click",()=>{An(s,i,async g=>{await Ln(t,n,g),await x()})}),e.container.querySelector("#finish-btn").addEventListener("click",async()=>{if(confirm("Finish this workout?")){await Dn(t,n);try{let{filename:g}=await at();O(`Saved \xB7 backup: ${g}`)}catch(g){O(`Saved \xB7 backup failed: ${g.message}`)}F("workout:changed")}}),e.container.querySelector("#discard-btn").addEventListener("click",async()=>{confirm("Discard this workout? This cannot be undone.")&&(await Te(t.id),F("workout:changed"))});async function x(){let[g,f,h]=await Promise.all([I("sets"),I("workouts"),I("exercises")]);s=h,n=g.filter(y=>y.workoutId===t.id).sort((y,k)=>y.order-k.order),o=bt(g,f,t.id),u=d(g,h,t.id),i=new Map;for(let y of g)i.set(y.exerciseId,(i.get(y.exerciseId)??0)+1);v(),E()}function E(){let g=new Map(s.map($=>[$.id,$])),f=[],h=new Map;for(let $ of n){let L=g.get($.exerciseId);if(!L)continue;let B=j(L);if(f.includes(B)||f.push(B),!$.completed)continue;let q=($.weight||0)*($.reps||0);q<=0||h.set(B,(h.get(B)??0)+q)}let y=[...h.values()].reduce(($,L)=>$+L,0),k=e.container.querySelector("#workout-progress");if(!k)return;if(f.length===0){k.innerHTML="";return}let C=f.map($=>{let L=u.get($)??0,B=h.get($)??0;return{muscle:$,record:L,cur:B,span:Math.max(L,B)}}),P=Math.max(...C.map($=>$.span)),m=P>0?P*.12:1;C=C.map($=>({...$,span:Math.max($.span,m)}));let w=Math.max(...C.map($=>$.span)),T=C.map(({muscle:$,record:L,cur:B,span:q})=>{let p=q/w*100,M=B>0?Math.min(100,B/q*100):0,D=L>0?`${Math.round(B/L*100)}%`:"new",H=L>0?`${_(B)} / ${_(L)} \xB7 ${D}`:`${_(B)} \xB7 ${D}`,W=qt($);return`
        <div class="vol-muscle" style="width: ${p.toFixed(2)}%; --mcolor: ${W}; --mtext: ${Ht(W)};" title="${S($)}: ${_(B)} / record ${_(L)} lbs">
          <div class="vol-fill" style="width: ${M.toFixed(2)}%;"></div>
          <div class="vol-info${M>55?" on-fill":""}">
            <span class="seg-name">${S($)}</span>
            <span class="seg-vol">${H}</span>
          </div>
        </div>
      `}).join(""),b=`<strong>${_(y)} lbs</strong> total`;k.innerHTML=`
      <div class="vol-bars">${T}</div>
      <div class="vol-label">${b}</div>
    `,requestAnimationFrame(()=>{for(let $ of k.querySelectorAll(".vol-muscle"))l($)})}function l(g){let f=g.querySelector(".seg-name"),h=g.querySelector(".seg-vol"),y=g.clientWidth-4;if(y<=0)return;if(h){let C=10;for(h.style.fontSize=`${C}px`;h.scrollWidth>y&&C>6;)C-=.5,h.style.fontSize=`${C}px`}if(!f)return;f.style.display="";let k=11;for(f.style.fontSize=`${k}px`;f.scrollWidth>y&&k>5;)k-=.5,f.style.fontSize=`${k}px`}function d(g,f,h){let y=new Map(f.map(P=>[P.id,P])),k=new Map,C=new Map;for(let P of Z(g)){if(P.workoutId===h)continue;let m=y.get(P.exerciseId);if(!m)continue;let w=(P.weight||0)*(P.reps||0);if(w<=0)continue;let T=j(m),b=C.get(P.workoutId);b||C.set(P.workoutId,b=new Map),b.set(T,(b.get(T)??0)+w)}for(let P of C.values())for(let[m,w]of P)w>(k.get(m)??0)&&k.set(m,w);return k}async function A(g){if(!g.completed||(g.setType||"working")==="warmup"||!(g.weight>0)||!(g.reps>0))return;let f=s.find(w=>w.id===g.exerciseId);if(!f)return;let h=await I("sets"),y=Z(h).filter(w=>w.exerciseId===g.exerciseId&&w.id!==g.id&&(w.setType||"working")!=="warmup"&&w.weight>0&&w.reps>0);if(y.length===0)return;let k=[],C=y.reduce((w,T)=>Math.max(w,T.weight),0);g.weight>C&&k.push(`Heaviest weight ever: ${ge(g.weight)} lbs`);let P=g.weight*g.reps,m=y.reduce((w,T)=>Math.max(w,T.weight*T.reps),0);if(P>m&&k.push(`Most volume in a set: ${ge(g.weight)}\xD7${g.reps} = ${_(P)} lbs`),k.length>0){let w=k.length>1?"New records":"New record";O(`${G(f)} \u2014 ${w}!
${k.join(`
`)}`,0,{persistUntilClick:!0})}}function v(){let g=new Map(s.map(m=>[m.id,m])),f=[],h=new Map;for(let m of n)h.has(m.exerciseId)||(h.set(m.exerciseId,[]),f.push(m.exerciseId)),h.get(m.exerciseId).push(m);for(let[,m]of h)m.sort((w,T)=>w.order-T.order);let y=e.container.querySelector("#exercise-sections");if(f.length===0){y.innerHTML=`
        <div class="empty-state" style="padding: 40px 24px; min-height: auto;">
          <p style="color: var(--text-secondary);">Add an exercise to start logging sets.</p>
        </div>`;return}y.innerHTML=f.map(m=>{let w=g.get(m),T=h.get(m),b=o.get(m)??new Map;return Sn(w,T,b,i.get(m)??0)}).join("");function k(m){delete m.bumpedBy,delete m.preBumpWeight,delete m.preBumpReps}function C(m){let w=n.filter(B=>B.exerciseId===m.exerciseId).sort((B,q)=>B.order-q.order),T=m.setType||"working",b=0,$=0;for(let B of w)if($+=1,(B.setType||"working")===T&&(b+=1),B.id===m.id)break;let L=Se(T,b,o.get(m.exerciseId),$);return L&&L.weight>0&&L.reps>0?{weight:L.weight,reps:L.reps}:null}async function P(m){await Ls(m.id,n),m.completed&&await Ms(m,n,C);for(let w of n){if(w.exerciseId!==m.exerciseId)continue;let T=y.querySelector(`.set-row[data-set-id="${w.id}"]`);if(!T)continue;let b=T.querySelector(".weight-input"),$=T.querySelector(".reps-input");b&&document.activeElement!==b&&(b.value=w.weight>0?String(w.weight):""),$&&document.activeElement!==$&&($.value=w.reps>0?String(w.reps):"")}}for(let m of y.querySelectorAll(".set-row-wrap")){let w=m.querySelector(".set-row"),T=w.dataset.setId,b=n.find(D=>D.id===T);if(!b)continue;let $=w.querySelector(".weight-input"),L=w.querySelector(".reps-input"),B=w.querySelector(".complete-btn");Mn(m,async()=>{await le("sets",b.id),await x()});let q=Xe(async()=>{await P(b),b.completed&&E()},200);$.addEventListener("input",()=>{b.weight=parseFloat($.value)||0,k(b),R("sets",{...b}).catch(D=>console.error("Set save failed",D)),q()});let p=Xe(async()=>{await P(b),b.completed&&E()},200);L.addEventListener("input",()=>{b.reps=parseInt(L.value,10)||0,k(b),R("sets",{...b}).catch(D=>console.error("Set save failed",D)),p()}),B.addEventListener("click",async()=>{let D=b.completed;b.completed=!b.completed,b.completed&&k(b),await R("sets",b),w.classList.toggle("completed",b.completed),B.innerHTML=Ds(b.completed);let H=w.querySelector(".set-number")?.textContent?.trim()||"";B.setAttribute("aria-label",`${b.completed?"Mark incomplete":"Mark complete"} set ${H}`),E(),!D&&b.completed?(await Ms(b,n,C)&&v(),await A(b)):D&&!b.completed&&await Ls(b.id,n)&&v()});let M=w.querySelector(".set-number");M&&M.addEventListener("click",async()=>{let H=(b.setType||"working")==="warmup"?"working":"warmup";if(b.setType=H,!b.completed){let W=n.filter(ce=>ce.exerciseId===b.exerciseId).sort((ce,Ts)=>ce.order-Ts.order),Q=0,fe=0;for(let ce of W)if(fe+=1,(ce.setType||"working")===H&&(Q+=1),ce.id===b.id)break;let me=Se(H,Q,o.get(b.exerciseId),fe);me&&me.weight>0&&me.reps>0&&(b.weight=me.weight,b.reps=me.reps)}await R("sets",b),v()})}for(let m of y.querySelectorAll(".add-set-btn"))m.addEventListener("click",async()=>{let w=m.dataset.exerciseId;await En(t,n,w,o.get(w)??new Map),await x()});for(let m of y.querySelectorAll(".exercise-menu"))m.addEventListener("click",async()=>{let w=m.dataset.exerciseId;confirm("Remove this exercise from the workout?")&&(await _e("sets",n.filter(T=>T.exerciseId===w).map(T=>T.id)),await x())});for(let m of y.querySelectorAll(".exercise-name-btn"))m.addEventListener("click",()=>{r&&(clearInterval(r),r=null),ze(e,m.dataset.exerciseId,()=>e.refresh())})}return x(),()=>{r&&clearInterval(r)}}function Sn(e,t,s=new Map,n=0){let o=0,i=0,r=t.map((a,c)=>{let u=a.setType||"working",x,E;u==="warmup"?(i+=1,E=i,x=`W${i}`):(o+=1,E=o,x=String(o));let l=Se(u,E,s,c+1);return $n(a,x,l)}).join("");return`
    <div class="exercise-section">
      <div class="exercise-section-header">
        <button class="exercise-name-btn" data-exercise-id="${e?.id}">${ie(e)}</button>
        <div class="row-trailing trailing-stack">${re(n)}</div>
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
  `}function Se(e,t,s,n=null){if(!s||typeof s.get!="function")return null;let o=s.get(`${e}#${t}`);return o||(n!=null?s.get(`any#${n}`)??null:null)}function $n(e,t,s){let n=e.setType||"working",o=s&&s.weight>0&&s.reps>0?`${ge(s.weight)} \xD7 ${s.reps}`:"\u2014";return`
    <div class="set-row-wrap" data-set-id="${e.id}">
      <button class="set-swipe-delete" data-set-id="${e.id}" aria-label="Delete set ${t}">Delete</button>
      <div class="set-row type-${n}${e.completed?" completed":""}" data-set-id="${e.id}">
        <button class="set-number" aria-label="Set ${t}, tap to mark as ${n==="warmup"?"working":"warmup"}">${t}</button>
        <div class="prev" aria-label="Previous">${o}</div>
        <input class="weight-input" type="number" inputmode="decimal" step="0.5" aria-label="Weight in pounds for set ${t}"
               placeholder="0" value="${e.weight>0?e.weight:""}" />
        <input class="reps-input" type="number" inputmode="numeric" step="1" aria-label="Repetitions for set ${t}"
               placeholder="0" value="${e.reps>0?e.reps:""}" />
        <button class="complete-btn" aria-label="${e.completed?"Mark incomplete":"Mark complete"} set ${t}">${Ds(e.completed)}</button>
      </div>
    </div>
  `}function Mn(e,t){let s=e.querySelector(".set-row"),n=e.querySelector(".set-swipe-delete");if(!s||!n)return;let o=88,i=0,r=0,a=0,c=0,u=!1,x=!1,E=!1,l=!1,d=()=>Math.max(140,i*.5);function A(y,k){s.style.transition=k?"transform 0.18s ease":"none",s.style.transform=`translateX(${y}px)`,n.style.width=`${Math.max(o,-y)}px`,e.classList.toggle("will-delete",y<=-d())}function v(y=!0){E=!1,A(0,y),e.classList.remove("swiped-open")}function g(y=!0){document.querySelectorAll(".set-row-wrap.swiped-open").forEach(k=>{if(k!==e){let C=k.querySelector(".set-row");C&&(C.style.transition="transform 0.18s ease",C.style.transform="translateX(0)");let P=k.querySelector(".set-swipe-delete");P&&(P.style.width=""),k.classList.remove("swiped-open","will-delete")}}),E=!0,A(-o,y),e.classList.add("swiped-open")}function f(){s.style.transition="transform 0.16s ease-out",s.style.transform=`translateX(${-i}px)`,n.style.width=`${i}px`,setTimeout(t,150)}s.addEventListener("touchstart",y=>{i=e.clientWidth||s.clientWidth,r=y.touches[0].clientX,a=y.touches[0].clientY,c=E?-o:0,u=!0,x=!1,l=!!y.target.closest("input, button, select, textarea")},{passive:!0}),s.addEventListener("touchmove",y=>{if(!u)return;let k=y.touches[0].clientX-r,C=y.touches[0].clientY-a;if(!x){if(Math.abs(C)>Math.abs(k)+4){u=!1;return}Math.abs(k)>8&&(x=!0,l&&document.activeElement?.blur&&document.activeElement.blur())}if(!x)return;y.cancelable&&y.preventDefault();let P=E?-o:0;c=Math.min(0,Math.max(-i,P+k)),A(c,!1)},{passive:!1});function h(){u&&(u=!1,x&&(c<=-d()?f():c<-o/2?g():v()))}s.addEventListener("touchend",h),s.addEventListener("touchcancel",h),n.addEventListener("click",y=>{y.stopPropagation(),t()})}function Ds(e){return e?'<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>':'<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>'}async function Ln(e,t,s){let n=t.reduce((o,i)=>Math.max(o,i.order),-1)+1;for(let o of s){let i=(await yt(o,e.id)).filter(c=>(c.weight||0)>0&&(c.reps||0)>0),a=(i.length>0?i:[{weight:0,reps:0,setType:"working"}]).map(c=>({id:Y(),workoutId:e.id,exerciseId:o,weight:c.weight??0,reps:c.reps??0,setType:c.setType||"working",completed:!1,order:n++,createdAt:Date.now()}));await oe("sets",a)}}async function Ms(e,t,s){let n=e.weight||0,o=n*(e.reps||0);if(o<=0)return!1;let i=!1;for(let r of t){if(r.exerciseId!==e.exerciseId||r.id===e.id||(r.order??0)<=(e.order??0)||r.completed)continue;if((r.weight||0)*(r.reps||0)<o||(r.weight||0)<n){if(r.bumpedBy==null){let c=s?.(r);r.preBumpWeight=c?c.weight:r.weight,r.preBumpReps=c?c.reps:r.reps}r.bumpedBy=e.id,r.weight=e.weight,r.reps=e.reps,await R("sets",r),i=!0}}return i}async function Ls(e,t){let s=!1;for(let n of t)n.bumpedBy===e&&(n.completed||(n.preBumpWeight!=null&&(n.weight=n.preBumpWeight),n.preBumpReps!=null&&(n.reps=n.preBumpReps)),delete n.bumpedBy,delete n.preBumpWeight,delete n.preBumpReps,await R("sets",n),s=!0);return s}async function En(e,t,s,n=new Map){let o=t.filter(v=>v.exerciseId===s),i=o[o.length-1],r=v=>(v?.weight||0)*(v?.reps||0),a=o.filter(v=>(v.setType||"working")!=="warmup"),c=a.length+1,u=Se("working",c,n,o.length+1),x=a.filter(v=>v.weight>0&&v.reps>0).reduce((v,g)=>!v||r(g)>r(v)?g:v,null),E=a.some((v,g)=>{let f=Se("working",g+1,n);return f&&f.weight>0&&f.reps>0&&r(v)>r(f)}),l=i?.weight??0,d=i?.reps??0;x&&(!u||E)&&(l=x.weight,d=x.reps);let A={id:Y(),workoutId:e.id,exerciseId:s,weight:l,reps:d,completed:!1,order:(i?.order??-1)+1,createdAt:Date.now()};await R("sets",A)}async function Dn(e,t){await _e("sets",t.filter(s=>!s.completed&&((s.weight||0)===0||(s.reps||0)===0)).map(s=>s.id)),e.endedAt=Date.now(),await R("workouts",e)}function An(e,t,s){let n=new Set,o="",i=null,r=N({html:`
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
    `,onMount(a){let c=a.querySelector("#picker-list"),u=a.querySelector("#picker-add"),x=a.querySelector("#picker-cancel"),E=a.querySelector("#picker-custom"),l=a.querySelector("#picker-search"),d=a.querySelector("#picker-chips");function A(){d.innerHTML=qe(e,i);for(let g of d.querySelectorAll(".chip"))g.addEventListener("click",()=>{let f=g.dataset.cat;i=f==="All"?null:f,A(),v()})}function v(){let g=e.filter(f=>!i||j(f)===i).filter(f=>!o||f.name.toLowerCase().includes(o.toLowerCase())).sort((f,h)=>{let y=t.get(f.id)??0,k=t.get(h.id)??0;return y!==k?k-y:f.name.localeCompare(h.name)});c.innerHTML=g.length===0?'<div class="list-row"><div class="row-main" style="color:var(--text-secondary)">No matches</div></div>':g.map(f=>`
                <button class="list-row" data-id="${f.id}">
                  ${ie(f)}
                  <div class="row-trailing trailing-stack">
                    ${re(t.get(f.id)??0)}
                    ${n.has(f.id)?Bn():""}
                  </div>
                </button>
              `).join("");for(let f of c.querySelectorAll(".list-row[data-id]"))f.addEventListener("click",()=>{let h=f.dataset.id;n.has(h)?n.delete(h):n.add(h),u.disabled=n.size===0,u.textContent=n.size===0?"Add":`Add (${n.size})`,v()})}l.addEventListener("input",()=>{o=l.value,v()}),x.addEventListener("click",()=>r()),u.addEventListener("click",()=>{s(Array.from(n)),r()}),E.addEventListener("click",()=>{ke(null,async g=>{e.push(g),n.add(g.id),A(),v(),u.disabled=!1,u.textContent=`Add (${n.size})`})}),A(),v()}})}function Bn(){return'<svg viewBox="0 0 24 24" width="22" height="22" fill="var(--green)"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'}function ke(e,t){let s=!!e,n=s?j(e):null,o=!n||ye.includes(n)?ye:[n,...ye],i=e?.equipment,r=!i||Ie.includes(i)?Ie:[i,...Ie],a=N({html:`
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
            <select id="ce-cat">${o.map(c=>`<option${c===n?" selected":""}>${S(c)}</option>`).join("")}</select>
          </div>
        </div>
        <div class="section">Equipment</div>
        <div class="form-section">
          <div class="form-row">
            <label for="ce-eq">Equipment</label>
            <select id="ce-eq">${r.map(c=>`<option${c===i?" selected":""}>${S(c)}</option>`).join("")}</select>
          </div>
        </div>
      </div>
    `,onMount(c){let u=c.querySelector("#ce-name"),x=c.querySelector("#ce-save");u.addEventListener("input",()=>{x.disabled=u.value.trim().length===0}),c.querySelector("#ce-cancel").addEventListener("click",()=>a()),x.addEventListener("click",async()=>{let E=u.value.trim();if(!E)return;let l=c.querySelector("#ce-cat").value,d=c.querySelector("#ce-eq").value,A=s?{...e,name:E,muscle:l,equipment:d}:{id:Y(),name:E,muscle:l,category:l,equipment:d,notes:"",isCustom:!0,createdAt:Date.now()};await R("exercises",A),a(),t?.(A),s||F("data:changed")}),s||setTimeout(()=>u.focus(),50)}})}function Tn(){let t=[["(","open","paren"],[")","close","paren"],["AC","clear","fn"],["\xB1","sign","fn"],["\u232B","back","fn"],["\xF7","op","op"],["7","digit"],["8","digit"],["9","digit"],["\xD7","op","op"],["4","digit"],["5","digit"],["6","digit"],["\u2212","op","op"],["1","digit"],["2","digit"],["3","digit"],["+","op","op"],["0","digit","zero"],[".","dot"],["=","equals","op"]].map(([s,n,o])=>`<button class="calc-key${o?` calc-${o}`:""}" data-action="${n}" data-key="${S(s)}">${S(s)}</button>`).join("");N({html:`
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
    `,onMount(s,n){let o=s.querySelector("#calc-expr"),i=s.querySelector("#calc-result"),r={"+":(p,M)=>p+M,"\u2212":(p,M)=>p-M,"\xD7":(p,M)=>p*M,"\xF7":(p,M)=>M===0?NaN:p/M},a={"+":1,"\u2212":1,"\xD7":2,"\xF7":2},c=p=>p==="+"||p==="\u2212"||p==="\xD7"||p==="\xF7",u=p=>p!=null&&!c(p)&&p!=="(";function x(p){let M=[],D=[];for(let W of p)if(W==="(")D.push(W);else if(W===")"){for(;D.length&&D[D.length-1]!=="(";)M.push(D.pop());if(!D.length)return NaN;D.pop()}else if(c(W)){for(;D.length&&c(D[D.length-1])&&a[D[D.length-1]]>=a[W];)M.push(D.pop());D.push(W)}else{let Q=parseFloat(W);if(!isFinite(Q))return NaN;M.push(Q)}for(;D.length;){let W=D.pop();if(W==="(")return NaN;M.push(W)}let H=[];for(let W of M){if(typeof W=="number"){H.push(W);continue}let Q=H.pop(),fe=H.pop();if(fe===void 0||Q===void 0)return NaN;H.push(r[W](fe,Q))}return H.length===1?H[0]:NaN}let E=p=>p.reduce((M,D,H)=>H===0?D:M+(p[H-1]==="("||D===")"?"":" ")+D,""),l=p=>{if(!isFinite(p))return"Error";let M=parseFloat(p.toFixed(8)).toString();return M.replace("-","").replace(".","").length>12&&(M=p.toPrecision(10).replace(/\.?0+$/,"")),M},d=["0"],A=!1,v=!1,g="",f=()=>d[d.length-1];function h(){o.textContent=v?"":g,i.textContent=v?"Error":E(d);let p=!v&&c(f())?f():null;for(let M of s.querySelectorAll(".calc-op"))M.classList.toggle("selected",M.dataset.key===p)}function y(p){if(v&&(d=["0"],v=!1),A)return d=[p],A=!1,h();f()===")"?d.push("\xD7",p):c(f())||f()==="("?d.push(p):d[d.length-1]=f()==="0"?p:f()+p,h()}function k(){if(v&&(d=["0"],v=!1),A)return d=["0."],A=!1,h();f()===")"?d.push("\xD7","0."):c(f())||f()==="("?d.push("0."):f().includes(".")||(d[d.length-1]=f()+"."),h()}function C(p){v||(A=!1,f()!=="("&&(c(f())?d[d.length-1]=p:d.push(p),h()))}let P=()=>d.filter(p=>p==="(").length-d.filter(p=>p===")").length;function m(){if(v&&(d=["0"],v=!1),A)return d=["("],A=!1,h();d.length===1&&f()==="0"?d=["("]:u(f())?d.push("\xD7","("):d.push("("),h()}function w(){v||A||P()<=0||!u(f())||(d.push(")"),h())}function T(){d=["0"],A=!1,v=!1,h()}function b(){if(v||c(f())||f()==="("||f()===")")return;let p=f();d[d.length-1]=p.startsWith("-")?p.slice(1):p==="0"?"0":"-"+p,h()}function $(){if(v)return T();if(A=!1,c(f())||f()==="("||f()===")")return d.pop(),d.length===0&&(d=["0"]),h();let p=f().slice(0,-1);p===""||p==="-"?d.length>1?d.pop():d=["0"]:d[d.length-1]=p,h()}function L(){if(v)return;let p=d.slice();for(;p.length&&(c(p[p.length-1])||p[p.length-1]==="(");)p.pop();if(!p.some(c))return;for(let D=p.filter(H=>H==="(").length-p.filter(H=>H===")").length;D>0;D--)p.push(")");let M=x(p);if(!isFinite(M))return v=!0,h();g=`${E(p)} =`,d=[l(M)],A=!0,h()}function B(p){let{action:M,key:D}=p.dataset;M!=="equals"&&(g=""),M==="digit"?y(D):M==="open"?m():M==="close"?w():M==="dot"?k():M==="clear"?T():M==="sign"?b():M==="back"?$():M==="op"?C(D):M==="equals"&&L()}let q=null;for(let p of s.querySelectorAll(".calc-key"))p.addEventListener("pointerdown",M=>{M.preventDefault(),q=p,p.classList.add("pressed")}),p.addEventListener("pointerup",M=>{M.preventDefault(),p.classList.remove("pressed"),q===p&&B(p),q=null}),p.addEventListener("pointercancel",()=>{p.classList.remove("pressed"),q=null}),p.addEventListener("pointerleave",()=>p.classList.remove("pressed"));s.querySelector("#calc-done").addEventListener("click",()=>n())}})}function Le(){let e=window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===!0,t;e?t=Math.max(window.innerHeight||0,window.visualViewport?.height||0,window.screen?.height||0):t=window.visualViewport?.height||window.innerHeight,document.documentElement.style.setProperty("--app-height",`${t}px`)}Le();window.addEventListener("resize",Le);window.addEventListener("orientationchange",Le);window.addEventListener("pageshow",Le);window.visualViewport?.addEventListener("resize",Le);var As={workout:{title:"Workout",render:Es},exercises:{title:"Exercises",render:bs},progress:{title:"Progress",render:ms}},$e=document.getElementById("view-content"),Cn=document.getElementById("nav-title"),Bs=document.getElementById("nav-back"),X=document.getElementById("nav-action"),Me="workout",mt=null,Ye=null,Ue=null,Ve={container:$e,setTitle(e){Cn.textContent=e},setAction(e){if(!e){X.hidden=!0,X.innerHTML="",X.removeAttribute("aria-label"),Ye=null;return}X.hidden=!1,e.label?X.setAttribute("aria-label",e.label):X.removeAttribute("aria-label"),e.html?X.innerHTML=e.html:X.textContent=e.label??"",Ye=e.onClick},setBack(e){mt=e,Bs.hidden=!e},refresh(){Ee(Me)},toast(e){O(e)}};function In(){if(typeof Ue=="function")try{Ue()}catch(e){console.error(e)}Ue=null}function Ee(e){Me=e,It(e),document.querySelectorAll(".tab").forEach(t=>{t.setAttribute("aria-selected",String(t.dataset.tab===e))}),In(),Ve.setTitle(As[e].title),Ve.setAction(null),Ve.setBack(null),$e.innerHTML="",$e.scrollTop=0;try{Ue=As[e].render(Ve)}catch(t){console.error("Render failed",t),$e.innerHTML=`<div class="empty-state"><div class="empty-icon">!</div><h2>Render error</h2><p>${S(t.message)}</p></div>`}}document.querySelectorAll(".tab").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll(".sheet-backdrop").forEach(t=>t.dismissSheet?.()),Ee(e.dataset.tab)})});Bs.addEventListener("click",()=>{mt&&mt()});X.addEventListener("click",()=>{Ye&&Ye()});(function(){let t='button, [role="button"], a[href]',s=null,n=0,o=0,i=()=>{s&&(s.classList.remove("pressed"),s=null)};document.addEventListener("pointerdown",r=>{let a=r.target.closest?.(t);s&&s!==a&&i(),!(!a||a.disabled||a.classList.contains("calc-key"))&&(s=a,n=r.clientX,o=r.clientY,a.classList.add("pressed"))},{passive:!0}),document.addEventListener("pointermove",r=>{s&&(Math.abs(r.clientX-n)>8||Math.abs(r.clientY-o)>8)&&i()},{passive:!0}),document.addEventListener("pointerup",i,{passive:!0}),document.addEventListener("pointercancel",i,{passive:!0}),window.addEventListener("scroll",i,{passive:!0,capture:!0})})();Qe("data:changed",()=>{ae(),Ee(Me)});Qe("workout:changed",()=>{ae(),Me==="workout"&&Ee(Me)});document.addEventListener("visibilitychange",()=>{document.visibilityState==="visible"&&ae()});async function qn(){try{await U(),await zt().catch(t=>console.warn("Passphrase check failed:",t));let e=await Tt();e>0&&console.info(`Seeded ${e} exercises.`),await Rt(),Ee("workout"),ae()}catch(e){console.error("Init failed:",e),$e.innerHTML=`
      <div class="empty-state">
        <div class="empty-icon">!</div>
        <h2>Storage unavailable</h2>
        <p>${S(e.message??String(e))}</p>
        <p>If you are running this from a <code>file://</code> URL, serve it through a local web server instead.</p>
      </div>`}}qn();
