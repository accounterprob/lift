var Hs="lift";var gt=["exercises","workouts","sets","stateOfMind","medications"],Be=null;function Y(){return Be?Promise.resolve(Be):new Promise((e,t)=>{let s=indexedDB.open(Hs,6);s.onerror=()=>t(s.error),s.onsuccess=()=>{Be=s.result,e(Be)},s.onupgradeneeded=()=>{let n=s.result;if(!n.objectStoreNames.contains("exercises")){let o=n.createObjectStore("exercises",{keyPath:"id"});o.createIndex("name","name",{unique:!1}),o.createIndex("category","category",{unique:!1})}if(n.objectStoreNames.contains("workouts")||n.createObjectStore("workouts",{keyPath:"id"}).createIndex("startedAt","startedAt",{unique:!1}),!n.objectStoreNames.contains("sets")){let o=n.createObjectStore("sets",{keyPath:"id"});o.createIndex("workoutId","workoutId",{unique:!1}),o.createIndex("exerciseId","exerciseId",{unique:!1})}n.objectStoreNames.contains("stateOfMind")||n.createObjectStore("stateOfMind",{keyPath:"id"}).createIndex("date","date",{unique:!1}),n.objectStoreNames.contains("medications")||n.createObjectStore("medications",{keyPath:"id"}),n.objectStoreNames.contains("appMeta")||n.createObjectStore("appMeta",{keyPath:"key"}),n.objectStoreNames.contains("doseEvents")&&n.deleteObjectStore("doseEvents")}})}function he(e){return new Promise((t,s)=>{e.onsuccess=()=>t(e.result),e.onerror=()=>s(e.error)})}async function ge(e,t="readonly"){return(await Y()).transaction(e,t).objectStore(e)}function ie(e,t,s){return new Promise((n,o)=>{let i=e.transaction(t,"readwrite"),r;try{r=s(i)}catch(a){try{i.abort()}catch{}o(a);return}i.oncomplete=()=>n(r),i.onerror=()=>o(i.error),i.onabort=()=>o(i.error)})}async function P(e){return he((await ge(e)).getAll())}async function te(e,t){return he((await ge(e)).get(t))}async function R(e,t){return await he((await ge(e,"readwrite")).put(t)),t}async function re(e,t){let s=await Y();return ie(s,e,n=>{let o=n.objectStore(e);for(let i of t)o.put(i)})}async function ue(e,t){return he((await ge(e,"readwrite")).delete(t))}async function Ke(e,t){if(t.length===0)return;let s=await Y();return ie(s,e,n=>{let o=n.objectStore(e);for(let i of t)o.delete(i)})}async function wt(e){let t=await te("appMeta",e);return t?t.value:null}async function Ce(e,t){return await R("appMeta",{key:e,value:t}),t}async function Te(e,t,s){let n=await ge(e);return he(n.index(t).getAll(s))}async function yt(e){let t=await Y();return ie(t,gt,s=>{for(let n of gt){let o=s.objectStore(n);o.clear();for(let i of e[n]??[])o.put(i)}})}function se(e){let t=new Set;for(let s of e)s.completed&&t.add(s.workoutId);return e.filter(s=>s.completed||!t.has(s.workoutId))}async function pe(){return(await P("workouts")).find(t=>!t.endedAt)??null}async function ne(){return(await P("workouts")).filter(t=>t.endedAt).sort((t,s)=>s.startedAt-t.startedAt)}async function bt(e){return(await Te("sets","workoutId",e)).sort((s,n)=>s.order-n.order)}async function Os(e){return await Te("sets","exerciseId",e)}async function xt(e,t=null){let s=await Os(e),n=new Map;for(let r of s)t&&r.workoutId===t||(n.has(r.workoutId)||n.set(r.workoutId,[]),n.get(r.workoutId).push(r));if(n.size===0)return[];let i=(await Promise.all(Array.from(n.keys()).map(r=>te("workouts",r)))).filter(Boolean).sort((r,a)=>(a.startedAt??0)-(r.startedAt??0));return i.length===0?[]:n.get(i[0].id).sort((r,a)=>r.order-a.order)}function kt(e,t,s=null){let n=new Map(t.map(r=>[r.id,r.startedAt??0])),o=new Map;for(let r of e){if(r.workoutId===s||!n.has(r.workoutId)||(r.weight||0)<=0||(r.reps||0)<=0)continue;let a=o.get(r.exerciseId);a||o.set(r.exerciseId,a=new Map);let c=a.get(r.workoutId);c||a.set(r.workoutId,c=[]),c.push(r)}let i=new Map;for(let[r,a]of o){let c=[...a.keys()].sort((b,D)=>n.get(D)-n.get(b)),p=new Map;for(let b of c){let D=a.get(b).sort((y,v)=>y.order-v.order),d=D.every(y=>y.setType==null),l=0,A=0;D.forEach((y,v)=>{if(d){let m=`any#${v+1}`;p.has(m)||p.set(m,y);return}let u=y.setType||"working",h=u==="warmup"?A+=1:l+=1,k=`${u}#${h}`;p.has(k)||p.set(k,y)})}i.set(r,p)}return i}var Ws={barbell:"Barbell",dumbbell:"Dumbbell",machine:"Machine",cable:"Cable",bodyweight:"Bodyweight",kettlebell:"Kettlebell",band:"Bands",bands:"Bands"},Rs=/\s*\((barbell|dumbbell|machine|cable|bodyweight|kettlebell|bands?)\)$|\s+(Machine|Barbell|Dumbbell|Cable|Kettlebell)$/i;async function Fs(e,t){let s=await Y(),n=await Te("sets","exerciseId",e);return ie(s,["sets","exercises"],o=>{let i=o.objectStore("sets");for(let r of n)i.put({...r,exerciseId:t});return o.objectStore("exercises").delete(e),n.length})}async function St(){let e=await P("exercises"),t=e.filter(i=>/butterfly/i.test(i.name||""));if(t.length===0)return 0;let s=e.filter(i=>/chest fly/i.test(i.name||"")&&!t.some(r=>r.id===i.id)),n=s.find(i=>(i.equipment||"")==="Machine")||s[0],o=0;for(let i of t)n?o+=await Fs(i.id,n.id):await R("exercises",{...i,name:"Chest Fly",equipment:"Machine"});return o}async function $t(){let e=await P("exercises"),t=[];for(let s of e){let n=(s.name||"").match(Rs);if(!n)continue;let o=s.name.slice(0,n.index).trim();if(!o||/smith$/i.test(o))continue;let i=(n[1]||n[2]).toLowerCase();t.push({...s,name:o,equipment:Ws[i]||s.equipment})}return t.length>0&&await re("exercises",t),t.length}async function Mt(){let[e,t,s]=await Promise.all([P("exercises"),P("sets"),P("workouts")]),n=new Set(e.filter(p=>p.category==="Cardio").map(p=>p.id));if(n.size===0)return{exercises:0,sets:0,workouts:0};let o=t.filter(p=>n.has(p.exerciseId)),i=new Map;for(let p of t)n.has(p.exerciseId)||i.set(p.workoutId,(i.get(p.workoutId)||0)+1);let r=new Set(o.map(p=>p.workoutId)),a=s.filter(p=>r.has(p.id)&&!i.get(p.id)),c=await Y();return await ie(c,["exercises","sets","workouts"],p=>{let b=p.objectStore("exercises"),D=p.objectStore("sets"),d=p.objectStore("workouts");for(let l of n)b.delete(l);for(let l of o)D.delete(l.id);for(let l of a)d.delete(l.id)}),{exercises:n.size,sets:o.length,workouts:a.length}}async function Et(e){let[t,s,n]=await Promise.all([P("exercises"),P("sets"),P("workouts")]),o=t.filter(d=>d.category==="Other");if(o.length===0)return{recategorized:0,deleted:0,workouts:0};let i=[],r=new Set;for(let d of o){let l=e(d.name);l==="Cardio"?r.add(d.id):i.push({...d,category:l&&l!=="Other"?l:"Full Body"})}let a=s.filter(d=>r.has(d.exerciseId)),c=new Map;for(let d of s)r.has(d.exerciseId)||c.set(d.workoutId,(c.get(d.workoutId)||0)+1);let p=new Set(a.map(d=>d.workoutId)),b=n.filter(d=>p.has(d.id)&&!c.get(d.id)),D=await Y();return await ie(D,["exercises","sets","workouts"],d=>{let l=d.objectStore("exercises"),A=d.objectStore("sets"),y=d.objectStore("workouts");for(let v of i)l.put(v);for(let v of r)l.delete(v);for(let v of a)A.delete(v.id);for(let v of b)y.delete(v.id)}),{recategorized:i.length,deleted:r.size,workouts:b.length}}async function Lt(){let e=await P("medications"),t=[];for(let s of e){if(s.doseAmount!=null)continue;let n=s.nickname||s.concept?.displayText||"";if(!/creatine/i.test(n))continue;let o=(s.concept?.form||"").replace(/\s*\(4\s*[×x]\s*\/?\s*day\)\s*/i,"").trim();t.push({...s,doseAmount:4,doseUnit:"capsule",concept:{...s.concept,form:o}})}return t.length>0&&await re("medications",t),t.length}var Ns=[[/\b(barbell|landmine|ez[- ]?bar|smith)\b/i,"Barbell"],[/\b(dumbbell|db)\b/i,"Dumbbell"],[/\b(cable|pulley|rope)\b/i,"Cable"],[/\b(plate[- ]?loaded|hammer strength)\b/i,"Machine Plates"],[/\b(machine|sled|press)\b/i,"Machine"]];async function Dt(){let t=(await P("exercises")).filter(n=>(n.equipment||"")==="Other");if(t.length===0)return[];let s=t.map(n=>{let o=Ns.find(([i])=>i.test(n.name||""));return{...n,equipment:o?o[1]:"Bodyweight"}});return await re("exercises",s),s.map(n=>`${n.name} \u2192 ${n.equipment}`)}async function Ie(e){let t=await Y(),s=await Te("sets","workoutId",e);return ie(t,["workouts","sets"],n=>{n.objectStore("workouts").delete(e);let o=n.objectStore("sets");for(let i of s)o.delete(i.id)})}var _=()=>crypto&&crypto.randomUUID?crypto.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,e=>{let t=Math.random()*16|0;return(e==="x"?t:t&3|8).toString(16)});function we(e){return e==null?"0":Math.abs(e-Math.round(e))<.001?String(Math.round(e)):e.toFixed(1)}function ye(e){return`${we(e)} lbs`}function At(e){let t=Math.max(0,Math.floor(e)),s=Math.floor(t/3600),n=Math.floor(t%3600/60),o=t%60;return s>0?`${s}:${String(n).padStart(2,"0")}:${String(o).padStart(2,"0")}`:`${n}:${String(o).padStart(2,"0")}`}function Xe(e){let t=Math.max(0,Math.floor(e)),s=Math.floor(t/3600),n=Math.floor(t%3600/60);return s>0?`${s}h ${n}m`:`${n}m`}function G(e){return Math.round(e).toLocaleString()}function fe(e){return`${G(e)} lbs`}function X(e){return(e instanceof Date?e:new Date(e)).toLocaleDateString(void 0,{month:"numeric",day:"numeric",year:"2-digit"})}function Bt(e){return(e instanceof Date?e:new Date(e)).toLocaleDateString(void 0,{weekday:"short",month:"short",day:"numeric",year:"numeric"})}function Qe(e,t=200){let s=null;return(...n)=>{clearTimeout(s),s=setTimeout(()=>e(...n),t)}}function E(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function W(e,t=1800,s={}){let n=document.querySelector(".toast");n&&n.remove();let o=document.createElement("div");o.className="toast",o.textContent=e,s.persistUntilClick?(o.classList.add("toast-clickable"),o.addEventListener("click",()=>o.remove())):setTimeout(()=>o.remove(),t),document.body.appendChild(o)}var Ge=new EventTarget;function F(e,t){Ge.dispatchEvent(new CustomEvent(e,{detail:t}))}function Je(e,t){return Ge.addEventListener(e,t),()=>Ge.removeEventListener(e,t)}function N({html:e,onMount:t}){let s=document.createElement("div");s.className="sheet-backdrop",s.innerHTML='<div class="sheet"></div>';let n=s.querySelector(".sheet");n.innerHTML=e;let o=js();document.body.appendChild(s);function i(){let c=window.visualViewport;if(!c){n.style.maxHeight=`${window.innerHeight-o-10}px`;return}let p=Math.max(window.innerHeight,document.documentElement.clientHeight),b=Math.max(0,p-c.height-c.offsetTop);b>0?(n.style.paddingBottom=`${b}px`,n.style.maxHeight=`${c.height-o-10+b}px`):(n.style.paddingBottom="",n.style.maxHeight=`${c.height-o-10}px`)}i();let r=window.visualViewport;r?.addEventListener("resize",i),r?.addEventListener("scroll",i);function a(){s.remove(),r?.removeEventListener("resize",i),r?.removeEventListener("scroll",i)}return s.dismissSheet=a,s.addEventListener("click",c=>{c.target===s&&a()}),t?.(n,a),a}function js(){let e=document.createElement("div");e.style.cssText="position:fixed;top:0;left:0;width:0;height:env(safe-area-inset-top);",document.body.appendChild(e);let t=e.offsetHeight||0;return e.remove(),t}function qe(){return'<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" style="color: var(--red);"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>'}function Ct(){return'<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M16 5l-1.42 1.42-1.59-1.59V16h-2V4.83L9.41 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z"/></svg>'}function oe(e){return`<div class="empty-state"><div class="empty-icon">!</div><h2>Couldn't load</h2><p>${E(e.message||String(e))}</p></div>`}var be=["Pectorals","Anterior Deltoid","Lateral Deltoid","Posterior Deltoid","Triceps","Biceps","Forearms","Lats","Upper Back","Lower Back","Traps","Quadriceps","Hamstrings","Glutes","Adductors","Abductors","Calves","Abs","Obliques"];function zs(e){let t=new Map(be.map((s,n)=>[s,n]));return[...e].sort((s,n)=>(t.get(s)??999)-(t.get(n)??999)||s.localeCompare(n))}var Pe=["Barbell","Dumbbell","Machine","Machine Plates","Cable","Bodyweight"];function Q(e){let t=e?.equipment,s=e?.name??"";return t&&t!=="Other"?`${s} (${t})`:s}function ae(e){let t=e?[e.equipment,j(e)].filter(Boolean).join(" \xB7 "):"";return`
    <div class="row-main">
      <div class="row-title">${E(e?.name??"Unknown exercise")}</div>
      ${t?`<div class="row-subtitle">${E(t)}</div>`:""}
    </div>
  `}function ce(e){return e?`<div class="exercise-count">${e} ${e===1?"set":"sets"}</div>`:""}function He(e,t){return["All",...zs(new Set(e.map(n=>j(n))))].map(n=>`<button class="chip${n==="All"&&!t||n===t?" active":""}" data-cat="${E(n)}">${E(n)}</button>`).join("")}var Vs=[["Bench Press (Barbell)","Chest","Barbell"],["Bench Press (Dumbbell)","Chest","Dumbbell"],["Incline Bench Press (Barbell)","Chest","Barbell"],["Incline Bench Press (Dumbbell)","Chest","Dumbbell"],["Decline Bench Press (Barbell)","Chest","Barbell"],["Chest Fly (Dumbbell)","Chest","Dumbbell"],["Chest Fly (Machine)","Chest","Machine"],["Cable Crossover","Chest","Cable"],["Push-Up","Chest","Bodyweight"],["Dip (Chest)","Chest","Bodyweight"],["Deadlift (Conventional)","Back","Barbell"],["Deadlift (Sumo)","Back","Barbell"],["Romanian Deadlift","Back","Barbell"],["Bent-Over Row (Barbell)","Back","Barbell"],["Pendlay Row","Back","Barbell"],["Row (Dumbbell)","Back","Dumbbell"],["T-Bar Row","Back","Barbell"],["Seated Cable Row","Back","Cable"],["Lat Pulldown","Back","Cable"],["Pull-Up","Back","Bodyweight"],["Chin-Up","Back","Bodyweight"],["Face Pull","Back","Cable"],["Shrug (Barbell)","Back","Barbell"],["Shrug (Dumbbell)","Back","Dumbbell"],["Overhead Press (Barbell)","Shoulders","Barbell"],["Overhead Press (Dumbbell)","Shoulders","Dumbbell"],["Seated Shoulder Press (Machine)","Shoulders","Machine"],["Arnold Press","Shoulders","Dumbbell"],["Lateral Raise (Dumbbell)","Shoulders","Dumbbell"],["Lateral Raise (Cable)","Shoulders","Cable"],["Front Raise (Dumbbell)","Shoulders","Dumbbell"],["Rear Delt Fly (Dumbbell)","Shoulders","Dumbbell"],["Reverse Pec Deck","Shoulders","Machine"],["Upright Row","Shoulders","Barbell"],["Barbell Curl","Biceps","Barbell"],["Dumbbell Curl","Biceps","Dumbbell"],["Hammer Curl","Biceps","Dumbbell"],["Preacher Curl","Biceps","Barbell"],["Incline Dumbbell Curl","Biceps","Dumbbell"],["Cable Curl","Biceps","Cable"],["Concentration Curl","Biceps","Dumbbell"],["Close-Grip Bench Press","Triceps","Barbell"],["Tricep Pushdown (Cable)","Triceps","Cable"],["Overhead Tricep Extension (Dumbbell)","Triceps","Dumbbell"],["Overhead Tricep Extension (Cable)","Triceps","Cable"],["Skull Crusher","Triceps","Barbell"],["Dip (Tricep)","Triceps","Bodyweight"],["Tricep Kickback","Triceps","Dumbbell"],["Back Squat","Legs","Barbell"],["Front Squat","Legs","Barbell"],["Goblet Squat","Legs","Dumbbell"],["Bulgarian Split Squat","Legs","Dumbbell"],["Lunge","Legs","Dumbbell"],["Leg Press","Legs","Machine"],["Leg Extension","Legs","Machine"],["Leg Curl (Seated)","Legs","Machine"],["Leg Curl (Lying)","Legs","Machine"],["Hip Thrust (Barbell)","Glutes","Barbell"],["Glute Bridge","Glutes","Bodyweight"],["Cable Kickback","Glutes","Cable"],["Hip Abduction (Machine)","Glutes","Machine"],["Standing Calf Raise","Calves","Machine"],["Seated Calf Raise","Calves","Machine"],["Plank","Core","Bodyweight"],["Hanging Leg Raise","Core","Bodyweight"],["Cable Crunch","Core","Cable"],["Russian Twist","Core","Bodyweight"],["Ab Wheel Rollout","Core","Bodyweight"],["Wrist Curl","Forearms","Dumbbell"],["Reverse Wrist Curl","Forearms","Dumbbell"],["Farmer's Carry","Forearms","Dumbbell"]];function j(e){if(e?.muscle)return e.muscle;let t=(e?.name||"").toLowerCase();return t?/romanian deadlift|\brdl\b|stiff.?leg|good morning|nordic|hamstring/.test(t)||/leg curl/.test(t)?"Hamstrings":/leg extension|sissy squat/.test(t)?"Quadriceps":/calf|tib raise|tibialis/.test(t)?"Calves":/hip adduction|adductor|inner thigh|copenhagen/.test(t)?"Adductors":/hip abduction|abductor|outer thigh|clamshell/.test(t)?"Abductors":/hip thrust|glute|cable kickback|donkey kick|rear kick|frog pump/.test(t)?"Glutes":/squat|leg press|lunge|step.?up/.test(t)?"Quadriceps":/back extension|hyperextension|superman/.test(t)||/deadlift|rack pull/.test(t)?"Lower Back":/lateral raise|side raise|side delt|\blat raise\b|upright row/.test(t)?"Lateral Deltoid":/rear delt|reverse fly|reverse flye|face pull|reverse pec deck/.test(t)?"Posterior Deltoid":/front raise|shoulder press|overhead press|arnold|military press|landmine press|push press|viking press/.test(t)?"Anterior Deltoid":/pulldown|pull.?down|pull.?up|chin.?up|pullover|straight.?arm/.test(t)?"Lats":/shrug/.test(t)?"Traps":/tricep|pushdown|skull ?crusher|close.?grip bench|jm press|french press|bench dip/.test(t)?"Triceps":/wrist curl|reverse curl|forearm|farmer|gripper|dead hang/.test(t)?"Forearms":/bicep|\bcurl\b/.test(t)?"Biceps":/\brow\b|rear pull|high pull/.test(t)?"Upper Back":/bench|chest|\bpec\b|pec deck|crossover|butterfly|push.?up|floor press|squeeze press|\bfly\b|\bflye\b/.test(t)?"Pectorals":/russian twist|woodchop|wood chop|side plank|side bend|oblique|pallof|rotation/.test(t)?"Obliques":/crunch|sit.?up|plank|leg raise|knee raise|ab wheel|ab roll|hanging|toes.?to.?bar|v.?up|dead bug|mountain climber/.test(t)?"Abs":/\bdip\b/.test(t)?"Triceps":e.category||"Other":e?.category||"Other"}var Us=/\b(bike|biking|treadmill|run|running|cardio|step.?mill|elliptical|stair.?master|stair.?climber|jog|jogging|cycling|spinning|spin class|rowing machine|row machine|\berg\b|sprints?|jump.?rope|skipping rope|swim|swimming|hike|hiking)\b/,Ys={Quadriceps:"Legs",Hamstrings:"Legs",Adductors:"Legs",Abductors:"Legs",Glutes:"Glutes",Calves:"Calves",Pectorals:"Chest","Anterior Deltoid":"Shoulders","Lateral Deltoid":"Shoulders","Posterior Deltoid":"Shoulders",Lats:"Back","Upper Back":"Back",Traps:"Back","Lower Back":"Back",Biceps:"Biceps",Triceps:"Triceps",Forearms:"Forearms",Abs:"Core",Obliques:"Core"};function Tt(e){let t=(e||"").toLowerCase().trim();if(!t)return"Full Body";if(Us.test(t))return"Cardio";let s=j({name:t,category:""});return Ys[s]||"Full Body"}async function It(){if((await P("exercises")).length>0)return 0;let t=Date.now(),s=Vs.map(([n,o,i])=>({id:_(),name:n,category:o,equipment:i,notes:"",isCustom:!1,createdAt:t}));return await re("exercises",s),s.length}var qt="workout";function Pt(e){qt!==e&&(qt=e,F("tab:changed",e))}var V=["Chest Day","Leg Day","Back/Bi Day"],Oe={"Chest Day":{key:"chest",short:"Chest",cssVar:"--day-chest"},"Leg Day":{key:"leg",short:"Legs",cssVar:"--day-leg"},"Back/Bi Day":{key:"back",short:"Back/Bi",cssVar:"--day-back"}};function We(e){let t=Oe[e];return t?`var(${t.cssVar})`:"var(--text-tertiary)"}function Ze(e){if(!e)return null;let t=e.toLowerCase();return t.includes("chest")?"Chest Day":t.includes("leg")&&!t.includes("curl")&&!t.includes("extension")?"Leg Day":t.includes("back")||t.includes("pull")?"Back/Bi Day":t.includes("push")?"Chest Day":null}function et(e){for(let t of e){let s=Ze(t.name);if(s)return{name:t.name,normalized:s,startedAt:t.startedAt}}return null}function Re(e){let t=V.indexOf(e);return t===-1?V[0]:V[(t+1)%V.length]}var _s={Pectorals:"#ec4899",Triceps:"#be185d","Anterior Deltoid":"#831843","Lateral Deltoid":"#f9a8d4",Quadriceps:"#facc15",Hamstrings:"#b45309",Glutes:"#f59e0b",Calves:"#fde68a",Adductors:"#bdb76b",Abductors:"#78350f",Lats:"#2563eb","Upper Back":"#38bdf8",Biceps:"#1e40af","Posterior Deltoid":"#bfdbfe",Traps:"#0891b2","Lower Back":"#475569",Forearms:"#22c55e",Abs:"#ef4444",Obliques:"#14b8a6",Other:"#6b7280"};function Ht(e){return _s[e]??"#6b7280"}var Ks={Pectorals:"Chest Day",Triceps:"Chest Day","Anterior Deltoid":"Chest Day","Lateral Deltoid":"Chest Day",Quadriceps:"Leg Day",Hamstrings:"Leg Day",Glutes:"Leg Day",Calves:"Leg Day",Adductors:"Leg Day",Abductors:"Leg Day",Lats:"Back/Bi Day","Upper Back":"Back/Bi Day",Biceps:"Back/Bi Day","Posterior Deltoid":"Back/Bi Day",Traps:"Back/Bi Day","Lower Back":"Back/Bi Day",Forearms:"Back/Bi Day"};function Gs(e){return Ks[e]??null}function Xs(e,t,s){let n=Ze(e);if(n)return n;let o=new Map;for(let a of t){let c=s.get(a.exerciseId);if(!c)continue;let p=Gs(j(c));if(!p)continue;let b=(a.weight||0)*(a.reps||0);b<=0||o.set(p,(o.get(p)??0)+b)}let i=null,r=0;for(let[a,c]of o)c>r&&(i=a,r=c);return i}function Ot(e,t,s){let n=[...e].sort((r,a)=>r.startedAt-a.startedAt),o=new Map,i=null;for(let r of n){let a=Xs(r.name,t.get(r.id)??[],s);a||(i?Rt(i.startedAt,r.startedAt)?a=i.day:a=Re(i.day):a=V[0]),o.set(r.id,a),i={day:a,startedAt:r.startedAt}}return o}function Wt(e){let t=parseInt(e.slice(1),16);return((t>>16&255)*299+(t>>8&255)*587+(t&255)*114)/1e3>=150?"#1c1c1e":"#ffffff"}function Rt(e,t){let s=new Date(e),n=new Date(t);return s.getFullYear()===n.getFullYear()&&s.getMonth()===n.getMonth()&&s.getDate()===n.getDate()}function Qs(e,t){let s=Ze(t?.name);if(s)return s;let n=et(e);return n?Rt(n.startedAt,Date.now())?n.normalized:Re(n.normalized):V[0]}var Js="lift-today-day";async function le(){try{let[e,t]=await Promise.all([ne(),pe()]),s=Qs(e,t),n=Oe[s].key;document.documentElement.dataset.day!==n&&(document.documentElement.dataset.day=n);try{localStorage.setItem(Js,n)}catch{}return s}catch{return null}}var Ft="lift-migrations-done-v3";async function tt(){let e=await Mt();e.exercises>0&&console.info(`Removed ${e.exercises} cardio exercise(s), ${e.sets} set(s), ${e.workouts} cardio-only workout(s).`);let t=await Et(Tt);if(t.recategorized>0||t.deleted>0){console.info(`Reorganized "Other": recategorized ${t.recategorized}, removed ${t.deleted} cardio, dropped ${t.workouts} empty workout(s).`);let r=[];t.recategorized>0&&r.push(`sorted ${t.recategorized} exercise${t.recategorized===1?"":"s"}`),t.deleted>0&&r.push(`removed ${t.deleted} cardio`),W(`Cleaned up \u201COther\u201D: ${r.join(", ")}.`)}let s=await $t();s>0&&console.info(`Stripped equipment from ${s} exercise name(s).`);let n=await St();n>0&&W(`Merged Butterfly into Chest Fly (${n} sets moved).`);let o=await Lt();o>0&&console.info(`Set a per-dose amount on ${o} medication(s).`);let i=await Dt();i.length>0&&(console.info(`Moved ${i.length} exercise(s) off "Other" equipment:
  ${i.join(`
  `)}`),W(`Sorted ${i.length} exercise${i.length===1?"":"s"} out of \u201COther\u201D equipment.`))}async function Nt(){try{if(localStorage.getItem(Ft))return}catch{}await tt();try{localStorage.setItem(Ft,String(Date.now()))}catch{}}var me="lift-backup-passphrase",zt=25e4,jt="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";function st(e){let t=new Uint8Array(e),s="",n=32768;for(let o=0;o<t.length;o+=n)s+=String.fromCharCode.apply(null,t.subarray(o,o+n));return btoa(s)}var nt=e=>Uint8Array.from(atob(e),t=>t.charCodeAt(0));function Vt(){let t=[...crypto.getRandomValues(new Uint8Array(20))].map(s=>jt[s%jt.length]);return[0,5,10,15].map(s=>t.slice(s,s+5).join("")).join("-")}var z=null,ot=()=>{try{return localStorage.getItem(me)}catch{return null}},it=e=>{try{localStorage.setItem(me,e)}catch{}};async function Ut(){if(z)return z;let e=ot(),t=null;try{t=await wt(me)}catch{}if(z=e||t||Vt(),z!==e&&it(z),z!==t)try{await Ce(me,z)}catch{}return z}function rt(){if(z)return z;let e=ot();return e||(e=Vt(),it(e)),z=e,Ce(me,e).catch(()=>{}),e}function Yt(){return z||ot()}function _t(e){z=e,it(e),Ce(me,e).catch(()=>{})}async function Kt(e,t){let s=await crypto.subtle.importKey("raw",new TextEncoder().encode(e),"PBKDF2",!1,["deriveKey"]);return crypto.subtle.deriveKey({name:"PBKDF2",hash:"SHA-256",salt:t,iterations:zt},s,{name:"AES-GCM",length:256},!1,["encrypt","decrypt"])}function Gt(e){return!!e&&e.lift==="encrypted-backup"&&typeof e.data=="string"}async function Xt(e,t){let s=crypto.getRandomValues(new Uint8Array(16)),n=crypto.getRandomValues(new Uint8Array(12)),o=await Kt(t,s),i=new TextEncoder().encode(JSON.stringify(e)),r=await crypto.subtle.encrypt({name:"AES-GCM",iv:n},o,i);return{lift:"encrypted-backup",v:1,exportedAt:new Date().toISOString(),kdf:{name:"PBKDF2",hash:"SHA-256",iterations:zt,salt:st(s)},cipher:"AES-GCM",iv:st(n),data:st(r)}}async function at(e,t){let s=nt(e.kdf.salt),n=nt(e.iv),o=await Kt(t,s),i;try{i=await crypto.subtle.decrypt({name:"AES-GCM",iv:n},o,nt(e.data))}catch{throw new Error("Wrong backup password (or the file is damaged).")}return JSON.parse(new TextDecoder().decode(i))}async function Zs(){let[e,t,s,n,o]=await Promise.all([P("exercises"),P("workouts"),P("sets"),P("stateOfMind"),P("medications")]);return{version:3,exportedAt:new Date().toISOString(),exercises:e,workouts:t,sets:s,stateOfMind:n,medications:o}}function en(){let e=new Date,t=s=>String(s).padStart(2,"0");return`lift-backup-${e.getFullYear()}${t(e.getMonth()+1)}${t(e.getDate())}-${t(e.getHours())}${t(e.getMinutes())}${t(e.getSeconds())}.json`}async function ct(){let e=await Zs(),t=rt(),s=await Xt(e,t),n=JSON.stringify(s),o=new Blob([n],{type:"application/json"}),i=URL.createObjectURL(o),r=en(),a=document.createElement("a");return a.href=i,a.download=r,a.style.display="none",document.body.appendChild(a),a.click(),setTimeout(()=>{document.body.removeChild(a),URL.revokeObjectURL(i)},1e3),{filename:r,bytes:o.size,snapshot:e}}async function tn(e){let t=Yt();if(t)try{return await at(e,t)}catch{}for(let s=0;s<3;s++){let n=prompt("Enter your backup password (saved in your Passwords app):");if(n==null)throw new Error("Restore cancelled.");try{let o=await at(e,n.trim());return _t(n.trim()),o}catch(o){if(s===2)throw o;alert("Wrong password \u2014 try again.")}}}async function sn(e){let t=JSON.parse(await e.text()),s=Gt(t)?await tn(t):t;if(!s||!Array.isArray(s.exercises)||!Array.isArray(s.workouts)||!Array.isArray(s.sets))throw new Error("File doesn't look like a Lift backup.");return await yt({exercises:s.exercises,workouts:s.workouts,sets:s.sets,stateOfMind:s.stateOfMind??[],medications:s.medications??[]}),await tt(),{exercises:s.exercises.length,workouts:s.workouts.length,sets:s.sets.length,stateOfMind:(s.stateOfMind??[]).length}}function Qt(){let e=rt();N({html:`
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
    `,onMount(t,s){t.querySelector("#bk-close").addEventListener("click",()=>s()),t.querySelector("#bk-copy").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(e),W("Password copied \u2014 save it in your Passwords app")}catch{W("Copy failed \u2014 long-press the password to select it")}}),t.querySelector("#bk-export").addEventListener("click",async()=>{try{let{filename:o,bytes:i}=await ct();W(`Exported ${o} (${nn(i)})`)}catch(o){W(`Export failed: ${o.message}`)}});let n=t.querySelector("#bk-file");t.querySelector("#bk-import").addEventListener("click",()=>{n.value="",n.click()}),n.addEventListener("change",async o=>{let i=o.target.files?.[0];if(i&&confirm("Replace all current data with this backup? This cannot be undone."))try{let r=await sn(i);s(),W(`Restored ${r.workouts} workouts, ${r.exercises} exercises`),F("data:changed")}catch(r){W(`Restore failed: ${r.message}`)}})}})}function nn(e){return e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/(1024*1024)).toFixed(1)} MB`}var es=["Amazed","Excited","Happy","Joyful","Content","Calm","Relieved","Grateful","Hopeful","Confident","Proud","Surprised","Indifferent","Anxious","Stressed","Overwhelmed","Frustrated","Angry","Irritated","Sad","Lonely","Discouraged","Drained","Worried","Embarrassed"],ts=["Health","Fitness","Self-Care","Hobbies","Identity","Community","Family","Friends","Partner","Work","Education","Money","Weather","Tasks"];function on(e){let t=Number(e);return isFinite(t)?Math.max(-1,Math.min(1,t)):0}async function ss({id:e,kind:t,valence:s,labels:n,associations:o,date:i}){let r={id:e||_(),kind:t==="dailyMood"?"dailyMood":"momentaryEmotion",date:i||Date.now(),valence:on(s),labels:n||[],associations:o||[]};return await R("stateOfMind",r),r}async function ns({id:e,nickname:t,form:s,hasSchedule:n,doseAmount:o,doseUnit:i}){let r=(t||"").trim()||"Medication",a=e?await te("medications",e):null,c=Number(o),p={id:e||_(),nickname:r,isArchived:a?!!a.isArchived:!1,hasSchedule:!!n,doseAmount:c>0?c:1,doseUnit:(i||"").trim(),concept:{identifier:a?.concept?.identifier||"",displayText:a?.concept?.displayText||r,form:(s||"").trim(),rxnorm:a?.concept?.rxnorm||[]}};return await R("medications",p),p}async function lt(e,t){await ue(e,t)}async function dt(){let[e,t]=await Promise.all([P("stateOfMind"),P("medications")]);return e.sort((s,n)=>s.date-n.date),t.sort((s,n)=>(s.nickname||"").localeCompare(n.nickname||"")),{stateOfMind:e,medications:t}}var Jt=e=>{let t=new Date(e);return`${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`},Zt=e=>e.length?e.reduce((t,s)=>t+s,0)/e.length:null;function os(e,t){let s=new Set(t.map(a=>Jt(a.startedAt))),n=[],o=[];for(let a of e)(s.has(Jt(a.date))?n:o).push(a.valence);let i=Zt(n),r=Zt(o);return{onWorkout:i,offWorkout:r,delta:i!=null&&r!=null?i-r:null,onCount:n.length,offCount:o.length}}var rn=e=>new Date(e).toLocaleTimeString(void 0,{hour:"numeric",minute:"2-digit"}),ls='<span style="font-size: 24px;">+</span>';async function ut(e,t){let s=()=>ut(e,t);e.setTitle("State of Mind"),e.setBack(t),e.setAction({html:ls,onClick:()=>as(s)});let[{stateOfMind:n},o]=await Promise.all([dt(),ne()]),i=os(n,o);e.container.innerHTML=`
    ${n.length?`
      <div class="section">Summary</div>
      <div class="form-section">
        <div class="stat-row"><div class="stat-label">Entries</div><div class="stat-value">${n.length.toLocaleString()}</div></div>
        <div class="stat-row"><div class="stat-label">Range</div><div class="stat-value">${X(n[0].date)} \u2013 ${X(n[n.length-1].date)}</div></div>
        <div class="stat-row"><div class="stat-label">Average mood</div><div class="stat-value">${Fe(un(n))}</div></div>
      </div>

      <div class="section">Mood vs. training</div>
      <div class="form-section">
        <div class="stat-row"><div class="stat-label">On workout days</div><div class="stat-value">${i.onWorkout!=null?Fe(i.onWorkout)+` (${i.onCount})`:"\u2014"}</div></div>
        <div class="stat-row"><div class="stat-label">On rest days</div><div class="stat-value">${i.offWorkout!=null?Fe(i.offWorkout)+` (${i.offCount})`:"\u2014"}</div></div>
        <div class="stat-row"><div class="stat-label">Difference</div><div class="stat-value">${i.delta!=null?(i.delta>=0?"+":"")+i.delta.toFixed(2):"\u2014"}</div></div>
      </div>

      <div class="section">Recent entries</div>
      <div class="list">${n.slice(-30).reverse().map(an).join("")}</div>
    `:us("","No mood entries","Tap \uFF0B to log how you're feeling.")}
  `,e.container.scrollTop=0;for(let r of e.container.querySelectorAll("[data-edit-som]")){let a=n.find(c=>c.id===r.dataset.editSom);a&&r.addEventListener("click",()=>as(s,a))}}function an(e){let t=e.kind==="dailyMood",s=e.labels.length?e.labels.join(", "):t?"Daily mood":"Momentary emotion",n=[...e.labels.length?[t?"Daily mood":"Moment"]:[],X(e.date),rn(e.date),...e.associations.length?[e.associations.join(", ")]:[]].join(" \xB7 ");return`
    <button class="list-row" data-edit-som="${E(e.id)}">
      <div class="row-main">
        <div class="row-title">${E(s)}</div>
        <div class="row-subtitle">${E(n)}</div>
      </div>
      <div class="row-trailing">${Fe(e.valence)}</div>
      <div class="chevron">\u203A</div>
    </button>`}async function pt(e,t){let s=()=>pt(e,t);e.setTitle("Medications"),e.setBack(t),e.setAction({html:ls,onClick:()=>cs(s)});let{medications:n}=await dt();e.container.innerHTML=n.length?`
    <div class="section">Daily</div>
    ${is(n.filter(i=>i.hasSchedule))}
    ${is(n.filter(i=>!i.hasSchedule),"As needed")}
    <div class="section-footer">Tap a medication to edit its name, form, or amount.</div>
  `:us("\u{1F48A}","No medications","Tap \uFF0B to add the medications you take."),e.container.scrollTop=0;let o=new Map(n.map(i=>[i.id,i]));for(let i of e.container.querySelectorAll("[data-edit-med]")){let r=o.get(i.dataset.editMed);r&&i.addEventListener("click",()=>cs(s,r))}}function is(e,t){return e.length===0?"":`
    ${t?`<div class="section">${E(t)}</div>`:""}
    <div class="list">${e.map(cn).join("")}</div>`}function cn(e){let t=ln(e);return`
    <button class="list-row" data-edit-med="${E(e.id)}">
      <div class="row-main">
        <div class="row-title">${E(e.nickname||e.concept.displayText)}</div>
        ${t?`<div class="row-subtitle">${E(t)}</div>`:""}
      </div>
      <div class="chevron">\u203A</div>
    </button>`}function ln(e){let t=ds(e),s=(e.concept?.form||"").trim(),n=(e.doseUnit||"").trim();if(s&&t>1&&n&&s.toLowerCase().includes(n.toLowerCase()))return`${ps(t)} \xD7 ${s}`;if(s&&t===1)return s;let o=dn(t,n);return s?`${o} \xB7 ${s}`:o}var ds=e=>Number(e?.doseAmount)>0?Number(e.doseAmount):1;function dn(e,t){let s=(t||"").trim()||"dose",n=e===1||/^(mg|mcg|ml|cc|g|kg|l|oz|iu)$/i.test(s)||s.endsWith("s")?s:`${s}s`;return`${ps(e)} ${n}`}function us(e,t,s){return`
    <div class="empty-state" style="padding: 48px 24px; min-height: auto;">
      ${e?`<div class="empty-icon">${e}</div>`:""}
      <h2>${E(t)}</h2>
      <p>${E(s)}</p>
    </div>`}function un(e){return e.reduce((t,s)=>t+s.valence,0)/e.length}var ps=e=>Number.isInteger(e)?String(e):String(Number(e.toFixed(3)));function fs(e){return e>=.7?["Very pleasant","#2ba758"]:e>=.4?["Pleasant","#54a85a"]:e>=.1?["Slightly pleasant","#9cad46"]:e>-.1?["Neutral","#8a8a8e"]:e>-.4?["Slightly unpleasant","#d99a3c"]:e>-.7?["Unpleasant","#e07a4e"]:["Very unpleasant","#e0574f"]}function Fe(e){let[t,s]=fs(e);return`<span class="hz-pill" style="--pc: ${s};">${E(t)}</span>`}function ms(e){let t=new Date(e),s=n=>String(n).padStart(2,"0");return`${t.getFullYear()}-${s(t.getMonth()+1)}-${s(t.getDate())}T${s(t.getHours())}:${s(t.getMinutes())}`}var pn=()=>ms(Date.now());function fn(e){let t=e?new Date(e).getTime():NaN;return isFinite(t)?t:Date.now()}var mn=e=>Math.max(-3,Math.min(3,Math.round(e*3)));function rs(e,t=[]){return e.map(s=>`<button type="button" class="chip${t.includes(s)?" active":""}" data-chip="${E(s)}">${E(s)}</button>`).join("")}function Ne(e,t,s={}){for(let n of e.querySelectorAll(`${t} .chip`))n.addEventListener("click",()=>{s.single&&e.querySelectorAll(`${t} .chip`).forEach(o=>o.classList.remove("active")),n.classList.toggle("active",s.single?!0:!n.classList.contains("active"))})}var je=(e,t)=>[...e.querySelectorAll(`${t} .chip.active`)].map(s=>s.dataset.chip);function as(e,t=null){let s=!!t,n=s&&t.kind==="dailyMood",o=s?mn(t.valence):1,i=s?t.valence:o/3,r=N({html:`
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
        <div class="chip-row" id="som-emotions" style="flex-wrap: wrap;">${rs(es,s?t.labels:[])}</div>
        <div class="section">What's affecting you? (optional)</div>
        <div class="chip-row" id="som-assoc" style="flex-wrap: wrap;">${rs(ts,s?t.associations:[])}</div>
        <div class="section">When</div>
        <div class="form-section">
          <div class="form-row"><input type="datetime-local" id="som-date" value="${s?ms(t.date):pn()}" style="text-align: left;" /></div>
        </div>
        ${s?`
        <div style="height: 8px;"></div>
        <div class="form-section">
          <button class="list-row button destructive" id="som-delete"><div class="row-main"><div class="row-title" style="color: var(--red);">Delete Entry</div></div></button>
        </div>`:""}
        <div style="height: 16px;"></div>
      </div>
    `,onMount(a){let c=a.querySelector("#som-val"),p=a.querySelector("#som-val-label"),b=()=>{p.textContent=fs(Number(c.value)/3)[0]};b(),c.addEventListener("input",()=>{i=Number(c.value)/3,b()}),Ne(a,"#som-kind",{single:!0}),Ne(a,"#som-emotions"),Ne(a,"#som-assoc"),a.querySelector("#som-cancel").addEventListener("click",()=>r()),a.querySelector("#som-save").addEventListener("click",async()=>{await ss({id:t?.id,kind:je(a,"#som-kind")[0]||"momentaryEmotion",valence:i,labels:je(a,"#som-emotions"),associations:je(a,"#som-assoc"),date:fn(a.querySelector("#som-date").value)}),r(),W(s?"Entry updated":"Logged State of Mind"),e?.()}),a.querySelector("#som-delete")?.addEventListener("click",async()=>{confirm("Delete this entry?")&&(await lt("stateOfMind",t.id),r(),W("Entry deleted"),e?.())})}})}function cs(e,t=null){let s=!!t,n=s?!!t.hasSchedule:!0,o=N({html:`
      <div class="sheet-header">
        <button class="btn-text" id="med-cancel">Cancel</button>
        <div class="title">${s?"Edit Medication":"Add Medication"}</div>
        <button class="btn-text primary" id="med-save"${s?"":" disabled"}>Save</button>
      </div>
      <div class="sheet-content">
        <div class="section">Name</div>
        <div class="form-section">
          <div class="form-row"><input id="med-name" placeholder="e.g. Sertraline" value="${s?E(t.nickname||t.concept.displayText):""}" style="text-align: left;" /></div>
        </div>
        <div class="section">Form (optional)</div>
        <div class="form-section">
          <div class="form-row"><input id="med-form" placeholder="e.g. tablet, 50 mg" value="${s?E(t.concept?.form||""):""}" style="text-align: left;" /></div>
        </div>
        <div class="section">Amount per dose</div>
        <div class="form-section">
          <div class="form-row"><input type="number" id="med-amount" inputmode="decimal" min="0" step="0.25" value="${s?E(String(ds(t))):"1"}" style="text-align: left;" /></div>
          <div class="form-row"><input id="med-unit" placeholder="unit \u2014 e.g. capsule, tablet, mg" value="${s?E(t.doseUnit||""):""}" style="text-align: left;" /></div>
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
    `,onMount(i){let r=i.querySelector("#med-name"),a=i.querySelector("#med-save");r.addEventListener("input",()=>{a.disabled=r.value.trim().length===0}),Ne(i,"#med-type",{single:!0}),i.querySelector("#med-cancel").addEventListener("click",()=>o()),a.addEventListener("click",async()=>{r.value.trim()&&(await ns({id:t?.id,nickname:r.value,form:i.querySelector("#med-form").value,hasSchedule:(je(i,"#med-type")[0]||"daily")==="daily",doseAmount:i.querySelector("#med-amount").value,doseUnit:i.querySelector("#med-unit").value}),o(),W(s?"Medication updated":"Medication added"),e?.())}),i.querySelector("#med-delete")?.addEventListener("click",async()=>{confirm("Delete this medication?")&&(await lt("medications",t.id),o(),W("Medication deleted"),e?.())}),s||setTimeout(()=>r.focus(),50)}})}var xe=[{key:"1W",tick:"1W",days:7},{key:"1M",tick:"1M",days:30},{key:"3M",tick:"3M",days:90},{key:"1Y",tick:"1Y",days:365},{key:"All",tick:"All",all:!0}];function vn(e){let t=new Map;for(let s of e){let n=new Date(s.date),o=`${n.getFullYear()}-${n.getMonth()}-${n.getDate()}`,i=t.get(o)||{date:s.date,total:0,count:0};i.total+=s.value,i.count+=1,i.date=Math.min(i.date,s.date),t.set(o,i)}return[...t.values()].map(s=>({date:s.date,value:s.total/s.count})).sort((s,n)=>s.date-n.date)}function ke(e,t,s={}){let n=t.length>0&&t[0].points!==void 0,o=(n?t:[{points:t}]).map(g=>({label:g.label??"",color:g.color||"var(--accent)",dashed:!!g.dashed,points:vn(g.points)})).filter(g=>g.points.length>0),i=s.defaultPeriod||"All",r=Math.max(0,xe.findIndex(g=>g.key===i)),a=xe.length-1,c=s.isolated==null?-1:o.findIndex(g=>g.label===s.isolated);c===-1&&(c=null);let p=()=>s.onStateChange?.({period:xe[r].key,isolated:c===null?null:o[c].label});function b(){let g=xe[r],w=o.map((L,q)=>c===null||q===c?L.points:[]);if(g.all)return w;let S=Date.now()-g.days*864e5,T=w.map(L=>L.filter(q=>q.date>=S));return T.every(L=>L.length===0)?w.map(L=>L.slice(-1)):T}let D=n&&o.some(g=>g.label)?`<div class="chart-legend">${o.map((g,w)=>`<button class="legend-item${g.dashed?" legend-dashed":""}${c!==null&&w!==c?" dimmed":""}" data-i="${w}" style="--dcolor: ${g.color};" aria-pressed="${c===w}">${g.label}</button>`).join("")}</div>`:"";e.innerHTML=`
    <div class="chart-scrub-readout" data-role="scrub"></div>
    ${D}
    <div class="chart-container" data-role="chart"></div>
    <div class="chart-daterange" data-role="range"></div>
    <div class="chart-slider">
      <input type="range" class="chart-range" min="0" max="${a}" step="1"
             value="${r}" aria-label="Time range" />
      <div class="chart-slider-ticks">
        ${xe.map((g,w)=>`<span data-i="${w}">${g.tick}</span>`).join("")}
      </div>
    </div>
  `;let d=e.querySelector('[data-role="scrub"]'),l=e.querySelector('[data-role="chart"]'),A=e.querySelector('[data-role="range"]'),y=e.querySelector(".chart-range"),v=[...e.querySelectorAll(".chart-slider-ticks span")],u=s.unit||"lbs",h=s.format?{value:s.format,axis:s.axisFormat||s.format}:{value:g=>`${Math.round(g).toLocaleString()} ${u}`,axis:g=>Math.round(g).toLocaleString()},k=null;function m(){let g=b(),w=hn(g,o,h,c!==null);l.innerHTML=w.html,k=w.geom;let S=g.flat();if(S.length>=2){let T=Math.min(...S.map(q=>q.date)),L=Math.max(...S.map(q=>q.date));A.innerHTML=`<span>${ft(T)}</span><span>${ft(L)}</span>`}else A.innerHTML="";v.forEach((T,L)=>T.classList.toggle("active",L===r))}y.addEventListener("input",()=>{r=Number(y.value),x(),m(),p()});let C=[...e.querySelectorAll(".chart-legend .legend-item")];for(let g of C)g.addEventListener("click",()=>{let w=Number(g.dataset.i);c=c===w?null:w,C.forEach((S,T)=>{S.classList.toggle("dimmed",c!==null&&T!==c),S.setAttribute("aria-pressed",String(c===T))}),x(),m(),p()});function I(g){if(!k||k.pts.length<2)return;let w=l.querySelector("svg"),S=w?.getScreenCTM();if(!S)return;let T=new DOMPoint(g,0).matrixTransform(S.inverse()).x,L=0,q=1/0;k.pts.forEach((O,U)=>{let ee=Math.abs(O.x-T);ee<q&&(q=ee,L=U)});let f=k.pts[L],M=w.querySelector(".chart-scrub-line"),B=w.querySelector(".chart-scrub-dot");M&&(M.setAttribute("x1",f.x),M.setAttribute("x2",f.x),M.removeAttribute("visibility")),B&&(B.setAttribute("cx",f.x),B.setAttribute("cy",f.y),B.style.fill=f.color,B.removeAttribute("visibility"));let H=f.label?` \xB7 ${f.label}`:"";d.textContent=`${ft(f.date)}${H} \xB7 ${h.value(f.value)}`}function x(){d.textContent="";let g=l.querySelector("svg");g?.querySelector(".chart-scrub-line")?.setAttribute("visibility","hidden"),g?.querySelector(".chart-scrub-dot")?.setAttribute("visibility","hidden")}let $=!1;l.addEventListener("pointerdown",g=>{$=!0,l.setPointerCapture?.(g.pointerId),I(g.clientX)}),l.addEventListener("pointermove",g=>{$&&I(g.clientX)});for(let g of["pointerup","pointercancel"])l.addEventListener(g,()=>{$=!1,x()});m()}function ft(e){return new Date(e).toLocaleDateString(void 0,{month:"short",day:"numeric",year:"numeric"})}function hn(e,t,s,n){let r={top:16,right:14,bottom:14,left:52},a=400-r.left-r.right,c=200-r.top-r.bottom,p=e.flat();if(p.length===0)return{html:`<svg viewBox="0 0 400 200"><text x="${400/2}" y="${200/2}" text-anchor="middle" class="chart-axis-label">No data in range</text></svg>`,geom:null};if(p.length===1){let S=p[0],T=t[e.findIndex(f=>f.length>0)]?.color||"var(--accent)",L=r.left+a/2,q=r.top+c/2;return{html:`<svg viewBox="0 0 400 200"><circle cx="${L}" cy="${q}" r="4" class="chart-point" style="fill: ${T};"/><text x="${L}" y="${q-10}" text-anchor="middle" class="chart-axis-label">${s.value(S.value)}</text></svg>`,geom:null}}let b=p.map(S=>S.date),D=p.map(S=>S.value),d=Math.min(...b),l=Math.max(...b),A=Math.max(...D),y=Math.min(...D),v=Math.max(A-y,1),u=y>=0?Math.max(0,y-v*.12):y-v*.12,h=A+v*.12,k=S=>r.left+(S-d)/Math.max(l-d,1)*a,m=S=>r.top+c-(S-u)/(h-u)*c,C=4,I=Array.from({length:C+1},(S,T)=>{let L=u+(h-u)*T/C,q=m(L);return`<text x="${r.left-6}" y="${q+3}" text-anchor="end" class="chart-axis-label">${s.axis(L,h-u)}</text>`}).join(""),x=Array.from({length:C+1},(S,T)=>{let L=r.top+c*T/C;return`<line x1="${r.left}" x2="${400-r.right}" y1="${L}" y2="${L}" class="chart-axis-line"/>`}).join(""),$=[],g=e.map((S,T)=>{let L=t[T],q=S.map(M=>({x:k(M.date),y:m(M.value)}));if(S.forEach((M,B)=>$.push({...q[B],date:M.date,value:M.value,label:L.label,color:L.color})),q.length===0)return"";if(q.length===1)return`<circle cx="${q[0].x}" cy="${q[0].y}" r="3.5" class="chart-point" style="fill: ${L.color};"/>`;let f=L.dashed&&!n?" chart-line-dashed":"";return`<path d="${gn(q)}" class="chart-line${f}" style="stroke: ${L.color};"/>`}).join("");return{html:`
    <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet">
      ${x}
      ${I}
      ${g}
      <line class="chart-scrub-line" y1="${r.top}" y2="${r.top+c}" x1="0" x2="0" visibility="hidden"/>
      <circle class="chart-scrub-dot" r="4.5" visibility="hidden"/>
    </svg>
  `,geom:{pts:$}}}function gn(e){if(e.length<2)return"";let t=`M ${e[0].x.toFixed(1)} ${e[0].y.toFixed(1)}`;for(let s=0;s<e.length-1;s++){let n=e[s===0?0:s-1],o=e[s],i=e[s+1],r=e[s+2]||i,a=o.x+(i.x-n.x)/6,c=o.y+(i.y-n.y)/6,p=i.x-(r.x-o.x)/6,b=i.y-(r.y-o.y)/6;t+=` C ${a.toFixed(1)} ${c.toFixed(1)}, ${p.toFixed(1)} ${b.toFixed(1)}, ${i.x.toFixed(1)} ${i.y.toFixed(1)}`}return t}var J=null,mt={volume:{chip:"Volume",title:"Workout Volume",key:"volumeSeries",opts:{unit:"lbs"}},strength:{chip:"Strength %",title:"Strength Change",key:"strengthSeries",opts:{format:wn,axisFormat:yn}}},K={mode:"volume",period:"All",isolated:null};function wn(e){return gs(Math.abs(e)<10?Math.round(e*10)/10:Math.round(e))}function yn(e,t){return gs(t<8?Math.round(e*10)/10:Math.round(e))}function gs(e){return`${e>0?"+":""}${e}%`}function ws(e){let t=!0;return ys().then(s=>{t&&(J=s,Se(e))}).catch(s=>{t&&(e.container.innerHTML=oe(s))}),()=>{t=!1}}async function ys(){let[e,t,s]=await Promise.all([ne(),P("sets"),P("exercises")]),n=new Map(s.map(u=>[u.id,u])),o=new Map;for(let u of se(t))o.has(u.workoutId)||o.set(u.workoutId,[]),o.get(u.workoutId).push(u);let i=0,r=0,a=new Map,c=new Map,p=new Map,b=new Map,D=Ot(e,o,n);for(let u of e){let h=o.get(u.id)||[],k=h.reduce((m,C)=>m+C.weight*C.reps,0);if(i+=k,r+=h.length,k>0){let m=D.get(u.id);a.has(m)||a.set(m,[]),a.get(m).push({date:u.startedAt,value:k})}for(let m of h){let C=n.get(m.exerciseId);if(!C)continue;let I=p.get(m.exerciseId)||{id:m.exerciseId,exercise:C,count:0};if(I.count+=1,p.set(m.exerciseId,I),m.weight>0&&m.reps>0){let x=b.get(m.exerciseId);(!x||m.weight>x.weight||m.weight===x.weight&&m.reps>x.reps)&&b.set(m.exerciseId,{id:m.exerciseId,weight:m.weight,reps:m.reps,date:u.startedAt,name:Q(C)})}}}let d=new Map;for(let u=e.length-1;u>=0;u--){let h=e[u],k=xn(o.get(h.id)||[]),m=[];for(let[I,x]of k){let $=d.get(I);$===void 0?d.set(I,x):m.push((x/$-1)*100)}if(m.length===0)continue;let C=D.get(h.id);c.has(C)||c.set(C,[]),c.get(C).push({date:h.startedAt,value:m.reduce((I,x)=>I+x,0)/m.length})}let l=Array.from(p.entries()).sort((u,h)=>h[1].count-u[1].count).map(([,u])=>u),A=Array.from(b.values()).sort((u,h)=>h.weight-u.weight),y=vs(a),v=vs(c);return{workouts:e,allSets:t,allExercises:s,exMap:n,setsByWorkout:o,totalVolume:i,totalSets:r,volumeSeries:y,strengthSeries:v,topExercises:l,prs:A}}function bn(e,t){return e*(1+t/30)}function xn(e){let t=new Map;for(let s of e){if(s.weight<=0||s.reps<=0||(s.setType||"working")==="warmup")continue;let n=bn(s.weight,s.reps);n>(t.get(s.exerciseId)??0)&&t.set(s.exerciseId,n)}return t}function vs(e){let t=V.filter(o=>e.has(o)).map(o=>({label:Oe[o].short,color:We(o),points:e.get(o)}));if(t.length===0)return t;let s=[...e.values()].flat().sort((o,i)=>o.date-i.date),n=Math.min(V.length,s.length);return t.push({label:"Avg",color:"var(--day-avg)",dashed:!0,points:s.slice(n-1).map((o,i)=>{let r=s.slice(i,i+n);return{date:o.date,value:r.reduce((a,c)=>a+c.value,0)/n}})}),t}function Se(e){e.setTitle("Progress"),e.setBack(null),e.setAction({label:"Backup and restore",html:Ct(),onClick:()=>Qt()}),e.container.scrollTop=0;let t=`
    <button class="list-row" data-page="meds">
      <div class="row-main"><div class="row-title">Medications</div></div>
      <div class="chevron">\u203A</div>
    </button>`;if(!J||J.workouts.length===0){e.container.innerHTML=`
      <div class="empty-state" style="padding: 48px 24px; min-height: auto;">
        <h2>No data yet</h2>
        <p>Finish a workout and your stats and trends will show up here.</p>
      </div>
      <div class="list">${t}</div>
    `,hs(e);return}let{workouts:s,totalVolume:n,totalSets:o,volumeSeries:i,topExercises:r,prs:a}=J,c=mt[K.mode];e.container.innerHTML=`
    <div class="section">Totals</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Total Volume</div><div class="stat-value">${fe(n)}</div></div>
      <div class="stat-row"><div class="stat-label">Total Sets</div><div class="stat-value">${o.toLocaleString()}</div></div>
    </div>

    ${i.length>0?`
      <div class="section" data-role="chart-title">${c.title}</div>
      <div class="chip-row chart-mode-row">
        ${Object.entries(mt).map(([b,D])=>`<button type="button" class="chip${b===K.mode?" active":""}" data-mode="${b}">${D.chip}</button>`).join("")}
      </div>
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
  `;let p=e.container.querySelector(".volume-chart-mount");if(p&&i.length>0){let b=e.container.querySelector('[data-role="chart-title"]'),D=[...e.container.querySelectorAll(".chart-mode-row .chip")],d=()=>{let l=mt[K.mode],A=J[l.key];if(b.textContent=l.title,D.forEach(y=>y.classList.toggle("active",y.dataset.mode===K.mode)),A.length===0){p.innerHTML=`<p class="chart-empty">Log an exercise a second time to see how it's changed.</p>`;return}ke(p,A,{...l.opts,defaultPeriod:K.period,isolated:K.isolated,onStateChange:({period:y,isolated:v})=>{K.period=y,K.isolated=v}})};for(let l of D)l.addEventListener("click",()=>{l.dataset.mode!==K.mode&&(K.mode=l.dataset.mode,d())});d()}hs(e)}function hs(e){for(let t of e.container.querySelectorAll("[data-page]"))t.addEventListener("click",()=>{let s=t.dataset.page;s==="trained"?kn(e):s==="prs"?Sn(e):s==="history"?bs(e):s==="meds"&&pt(e,()=>Se(e))})}function kn(e){e.setTitle("Most-Trained"),e.setBack(()=>Se(e)),e.setAction(null);let{topExercises:t}=J;e.container.innerHTML=`
    <div class="list" style="margin-top: 16px;">
      ${t.map(s=>`
        <button class="list-row" data-exercise-id="${E(s.id)}">
          ${ae(s.exercise)}
          <div class="row-trailing trailing-stack">${ce(s.count)}</div>
          <div class="chevron">\u203A</div>
        </button>
      `).join("")}
    </div>
  `,e.container.scrollTop=0,vt(e)}function Sn(e){e.setTitle("Personal Records"),e.setBack(()=>Se(e)),e.setAction(null);let{prs:t}=J;e.container.innerHTML=`
    <div class="section-footer" style="margin-top: 16px;">Heaviest set ever recorded per exercise.</div>
    <div class="list">
      ${t.map(s=>`
        <button class="list-row" data-exercise-id="${E(s.id)}" style="align-items: flex-start;">
          <div class="row-main">
            <div class="row-title">${E(s.name)}</div>
            <div class="row-subtitle">${X(s.date)}</div>
          </div>
          <div class="row-trailing" style="text-align: right;">
            <div style="font-weight: 600; color: var(--text);">${ye(s.weight)} lbs</div>
            <div style="font-size: 12px; color: var(--text-tertiary);">${s.reps} rep${s.reps===1?"":"s"}</div>
          </div>
          <div class="chevron">\u203A</div>
        </button>
      `).join("")}
    </div>
  `,e.container.scrollTop=0,vt(e)}function vt(e){for(let t of e.container.querySelectorAll("[data-exercise-id]"))t.addEventListener("click",()=>{ze(t.dataset.exerciseId)})}function bs(e){e.setTitle("Workout History"),e.setBack(()=>Se(e)),e.setAction(null);let{workouts:t,setsByWorkout:s,exMap:n}=J;e.container.innerHTML=`
    <div class="list" style="margin-top: 16px;">
      ${t.map(o=>$n(o,s.get(o.id)||[],n)).join("")}
    </div>
  `,e.container.scrollTop=0;for(let o of e.container.querySelectorAll("[data-workout-id]"))o.addEventListener("click",()=>{let i=o.dataset.workoutId;Mn(e,i).catch(r=>{e.container.innerHTML=oe(r)})})}function $n(e,t,s){let n=t,o=n.reduce((c,p)=>c+p.weight*p.reps,0),i=(e.endedAt-e.startedAt)/1e3,r=[],a=new Set;for(let c of t){if(a.has(c.exerciseId))continue;a.add(c.exerciseId);let p=s.get(c.exerciseId);if(p&&r.push(p.name),r.length>=3)break}return`
    <button class="list-row" data-workout-id="${e.id}">
      <div class="row-main">
        <div class="row-title" style="font-weight: 600;">${E(e.name)}</div>
        <div class="row-subtitle" style="margin-top: 4px;">
          ${X(e.startedAt)} \xB7 ${Xe(i)} \xB7 ${n.length} sets \xB7 ${fe(o)}
        </div>
        ${r.length>0?`<div class="row-subtitle" style="margin-top: 4px;">${E(r.join(" \xB7 "))}${a.size>3?" \u2026":""}</div>`:""}
      </div>
      <div class="chevron">\u203A</div>
    </button>
  `}async function xs(e){let[t,s,n]=await Promise.all([te("workouts",e),P("exercises"),bt(e)]);if(!t)return null;let o=new Map(s.map(d=>[d.id,d])),i=new Map,r=[];for(let d of n)i.has(d.exerciseId)||(i.set(d.exerciseId,[]),r.push(d.exerciseId)),i.get(d.exerciseId).push(d);let a=se(n),c=a.reduce((d,l)=>d+l.weight*l.reps,0),p=a.length,b=(t.endedAt-t.startedAt)/1e3,D=`
    <div class="section">Summary</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Date</div><div class="stat-value">${Bt(t.startedAt)}</div></div>
      <div class="stat-row"><div class="stat-label">Duration</div><div class="stat-value">${Xe(b)}</div></div>
      <div class="stat-row"><div class="stat-label">Total Volume</div><div class="stat-value">${fe(c)}</div></div>
      <div class="stat-row"><div class="stat-label">Completed Sets</div><div class="stat-value">${p}</div></div>
    </div>

    ${r.map(d=>{let l=o.get(d),A=i.get(d),y=0,v=0;return`
        ${l?`<button class="section section-link" data-exercise-id="${E(d)}">${E(Q(l))}<span class="name-chevron">\u203A</span></button>`:'<div class="section">Unknown exercise</div>'}
        <div class="form-section">
          ${A.map(h=>{let m=(h.setType||"working")==="warmup"?`W${++v}`:String(++y);return`
              <div class="stat-row">
                <div class="stat-label">Set ${m}</div>
                <div class="stat-value hist-edit">
                  <input class="hist-input" type="number" inputmode="decimal" step="0.5" aria-label="Weight in pounds for set ${m}"
                         data-set-id="${h.id}" data-field="weight" value="${h.weight>0?h.weight:""}" placeholder="0" />
                  <span>lbs \xD7</span>
                  <input class="hist-input" type="number" inputmode="numeric" step="1" aria-label="Repetitions for set ${m}"
                         data-set-id="${h.id}" data-field="reps" value="${h.reps>0?h.reps:""}" placeholder="0" />
                </div>
              </div>
            `}).join("")}
        </div>
      `}).join("")}
  `;return{workout:t,html:D,sets:n}}function ks(e,t){for(let s of e.querySelectorAll("input.hist-input[data-set-id]"))s.addEventListener("input",async()=>{let n=t.find(o=>o.id===s.dataset.setId);n&&(s.dataset.field==="weight"?n.weight=parseFloat(s.value)||0:n.reps=parseInt(s.value,10)||0,await R("sets",{...n}))})}async function Mn(e,t){e.setBack(async()=>{J=await ys(),bs(e)}),e.setAction({label:"Delete workout",html:qe(),onClick:async()=>{confirm("Delete this workout?")&&(await Ie(t),F("data:changed"))}});let s=await xs(t);if(!s){e.container.innerHTML=oe({message:"Workout not found."});return}e.setTitle(s.workout.name),e.container.innerHTML=s.html,e.container.scrollTop=0,vt(e),ks(e.container,s.sets)}async function Ss(e){let t=await xs(e);if(!t)return;let s=N({html:`
      <div class="sheet-header">
        <button class="btn-text" id="wd-close">Done</button>
        <div class="title">${E(t.workout.name)}</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">${t.html}</div>
    `,onMount(n){n.querySelector("#wd-close").addEventListener("click",()=>s());for(let o of n.querySelectorAll("[data-exercise-id]"))o.addEventListener("click",()=>ze(o.dataset.exerciseId));ks(n,t.sets)}})}function $s(e){let t=!0;return Ms(e).catch(s=>{t&&(e.container.innerHTML=oe(s))}),()=>{t=!1}}async function Ms(e){e.setTitle("Exercises"),e.setBack(null),e.setAction({label:"Add exercise",html:'<span style="font-size: 24px;">+</span>',onClick:()=>{$e(null)}});let[t,s]=await Promise.all([P("exercises"),P("sets")]),n=t.sort((d,l)=>d.name.localeCompare(l.name)),o=new Map;for(let d of s)o.set(d.exerciseId,(o.get(d.exerciseId)??0)+1);let i="",r=null;e.container.innerHTML=`
    <div class="search-bar">
      <input class="search-input" id="ex-search" placeholder="Search exercises" />
    </div>
    <div class="chip-row" id="ex-chips"></div>
    <div class="list" id="ex-list"></div>
  `,e.container.scrollTop=0;let a=e.container.querySelector("#ex-list"),c=e.container.querySelector("#ex-chips"),p=e.container.querySelector("#ex-search");function b(){c.innerHTML=He(n,r);for(let d of c.querySelectorAll(".chip"))d.addEventListener("click",()=>{let l=d.dataset.cat;r=l==="All"?null:l,b(),D()})}function D(){let d=n.filter(l=>!r||j(l)===r).filter(l=>!i||l.name.toLowerCase().includes(i.toLowerCase()));if(d.length===0){a.innerHTML='<div class="list-row"><div class="row-main" style="color: var(--text-secondary);">No matches</div></div>';return}a.innerHTML=d.map(l=>`
        <button class="list-row" data-id="${l.id}">
          ${ae(l)}
          <div class="row-trailing trailing-stack">${ce(o.get(l.id)??0)}</div>
          <div class="chevron">\u203A</div>
        </button>
      `).join("");for(let l of a.querySelectorAll("[data-id]"))l.addEventListener("click",()=>{En(e,l.dataset.id).catch(A=>{e.container.innerHTML=oe(A)})})}p.addEventListener("input",()=>{i=p.value,D()}),b(),D()}function En(e,t){return Ve(e,t,()=>Ms(e))}async function Ve(e,t,s){e.setBack(s);let n=await Ls(t);if(!n){e.container.innerHTML=oe({message:"Exercise not found."});return}e.setTitle(Q(n.exercise)),e.setAction(n.exercise.isCustom?{label:"Delete exercise",html:qe(),onClick:async()=>{if(n.completed.length>0){alert(`Can't delete \u2014 this exercise has ${n.completed.length} logged set${n.completed.length===1?"":"s"}.`);return}confirm("Delete this custom exercise?")&&(await ue("exercises",t),F("data:changed"))}}:null),e.container.innerHTML=n.html,e.container.scrollTop=0,e.container.querySelector("#exd-edit")?.addEventListener("click",()=>{$e(n.exercise,()=>Ve(e,t,s))}),Es(e.container);let o=e.container.querySelector(".exercise-chart-mount");o&&n.chartData.length>0&&ke(o,n.chartData,{unit:"lbs"})}function Es(e){for(let t of e.querySelectorAll(".recent-set[data-workout-id]"))t.addEventListener("click",()=>Ss(t.dataset.workoutId))}async function ze(e){let t=await Ls(e);if(!t)return;let s=N({html:`
      <div class="sheet-header">
        <button class="btn-text" id="exd-close">Done</button>
        <div class="title">${E(Q(t.exercise))}</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">${t.html}</div>
    `,onMount(n){n.querySelector("#exd-close").addEventListener("click",()=>s()),n.querySelector("#exd-edit")?.addEventListener("click",()=>{$e(t.exercise,()=>{s(),F("data:changed"),ze(e)})}),Es(n);let o=n.querySelector(".exercise-chart-mount");o&&t.chartData.length>0&&ke(o,t.chartData,{unit:"lbs"})}})}async function Ls(e){let[t,s,n,o]=await Promise.all([te("exercises",e),P("sets"),P("workouts"),pe()]);if(!t)return null;let i=new Map(n.map(d=>[d.id,d])),r=se(s).filter(d=>d.exerciseId===e&&d.workoutId!==o?.id&&i.has(d.workoutId)).map(d=>({...d,workout:i.get(d.workoutId)})).sort((d,l)=>d.workout.startedAt-l.workout.startedAt),a=r.reduce((d,l)=>d+l.weight*l.reps,0),c=r.reduce((d,l)=>!d||l.weight>d.weight||l.weight===d.weight&&l.reps>d.reps?l:d,null),p=new Map;for(let d of r){if(d.weight<=0||d.reps<=0||(d.setType||"working")==="warmup")continue;let l=p.get(d.workoutId)||{date:d.workout.startedAt,total:0,count:0};l.total+=d.weight*d.reps,l.count+=1,p.set(d.workoutId,l)}let b=Array.from(p.values()).map(({date:d,total:l,count:A})=>({date:d,value:l/A})).sort((d,l)=>d.date-l.date),D=`
    <div class="section">Details</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Equipment</div><div class="stat-value">${E(t.equipment)}</div></div>
      <div class="stat-row"><div class="stat-label">Muscle</div><div class="stat-value">${E(j(t))}</div></div>
      <button class="list-row button" id="exd-edit">
        <div class="row-main"><div class="row-title" style="color: var(--accent);">Edit Name, Muscle & Equipment</div></div>
      </button>
    </div>

    ${r.length>0?`
      <div class="section">Stats</div>
      <div class="form-section">
        <div class="stat-row"><div class="stat-label">Total Sets</div><div class="stat-value">${r.length.toLocaleString()}</div></div>
        <div class="stat-row"><div class="stat-label">Total Volume</div><div class="stat-value">${fe(a)}</div></div>
        ${c?`<div class="stat-row"><div class="stat-label">Best Set</div><div class="stat-value">${ye(c.weight)} \xD7 ${c.reps}</div></div>`:""}
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
          <button class="stat-row recent-set" data-workout-id="${E(d.workoutId)}">
            <div class="stat-label" style="font-size: 13px; color: var(--text-secondary);">${X(d.workout.startedAt)}</div>
            <div class="stat-value" style="color: var(--text);">${ye(d.weight)} \xD7 ${d.reps} <span class="name-chevron">\u203A</span></div>
          </button>
        `).join("")}
      </div>
    `:`
      <div class="empty-state" style="padding: 32px 24px;">
        <p style="color: var(--text-secondary);">No completed sets yet.</p>
      </div>
    `}
  `;return{exercise:t,completed:r,chartData:b,html:D}}function Cs(e){let t=!0,s=null;return e.container.innerHTML="",pe().then(n=>{t&&(n?s=Bn(e,n):Ln(e))}).catch(n=>{t&&(e.container.innerHTML=`<div class="empty-state"><div class="empty-icon">!</div><h2>Couldn't load</h2><p>${E(n.message)}</p></div>`)}),()=>{t=!1,typeof s=="function"&&s()}}async function Ln(e){e.setTitle("Workout");let t=await ne(),s=t[0],n=et(t),o=n?Re(n.normalized):V[0],r=n&&Ds(n.startedAt)==="today"?"Tomorrow":"Today",a=s?`<div class="last-workout-hint">Last: <strong>${E(s.name)}</strong> \xB7 ${Ds(s.startedAt)}</div>`:"",c=`<div class="next-workout-hint">${r}: <strong>${E(o)}</strong></div>`;e.container.innerHTML=`
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
  `,e.container.querySelector("#start-btn").addEventListener("click",()=>Dn(o,r));for(let p of e.container.querySelectorAll("[data-nav]"))p.addEventListener("click",()=>ut(e,()=>e.refresh()))}function Ds(e){let t=new Date,s=new Date(e),n=i=>new Date(i.getFullYear(),i.getMonth(),i.getDate()).getTime(),o=Math.round((n(t)-n(s))/(1440*60*1e3));return o===0?"today":o===1?"yesterday":o<7?`${o} days ago`:o<14?"a week ago":`${Math.round(o/7)} weeks ago`}function Dn(e,t="Today"){An(e,async s=>{let n={id:_(),name:s,startedAt:Date.now(),endedAt:null,notes:""};await R("workouts",n),F("workout:changed")},t)}function An(e,t,s="Today"){let o=N({html:`
      <div class="sheet-header">
        <button class="btn-text" id="wt-cancel">Cancel</button>
        <div class="title">New Workout</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">
        <div class="section">Pick a type</div>
        <div class="form-section">
          ${V.map(i=>{let a=i===e?` <span class="badge">${E(s)}</span>`:"";return`
              <button class="list-row button" data-name="${E(i)}">
                <div class="row-main"><div class="row-title" style="color: ${We(i)}; font-weight: 600;">${E(i)}${a}</div></div>
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
    `,onMount(i){i.querySelector("#wt-cancel").addEventListener("click",()=>o());for(let c of i.querySelectorAll(".list-row.button[data-name]"))c.addEventListener("click",()=>{let p=c.dataset.name;o(),t(p)});let r=i.querySelector("#wt-custom"),a=i.querySelector("#wt-go");r.addEventListener("input",()=>{a.disabled=r.value.trim().length===0}),a.addEventListener("click",()=>{let c=r.value.trim();c&&(o(),t(c))}),setTimeout(()=>r.focus(),50)}})}function Bn(e,t){let s=[],n=[],o=new Map,i=new Map,r=null;e.container.innerHTML=`
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
  `,e.container.querySelector("#calc-fab").addEventListener("click",Rn);let a=()=>{e.setTitle(At((Date.now()-t.startedAt)/1e3))};a(),r=setInterval(a,1e3);let c=e.container.querySelector("#wname");c.addEventListener("input",async()=>{t.name=c.value,await R("workouts",{...t}),le()});let p=new Map;e.container.querySelector("#add-exercise-btn").addEventListener("click",()=>{On(s,i,async v=>{await qn(t,n,v),await b()})}),e.container.querySelector("#finish-btn").addEventListener("click",async()=>{if(confirm("Finish this workout?")){await Hn(t,n);try{let{filename:v}=await ct();W(`Saved \xB7 backup: ${v}`)}catch(v){W(`Saved \xB7 backup failed: ${v.message}`)}F("workout:changed")}}),e.container.querySelector("#discard-btn").addEventListener("click",async()=>{confirm("Discard this workout? This cannot be undone.")&&(await Ie(t.id),F("workout:changed"))});async function b(){let[v,u,h]=await Promise.all([P("sets"),P("workouts"),P("exercises")]);s=h,n=v.filter(k=>k.workoutId===t.id).sort((k,m)=>k.order-m.order),o=kt(v,u,t.id),p=l(v,h,t.id),i=new Map;for(let k of v)i.set(k.exerciseId,(i.get(k.exerciseId)??0)+1);y(),D()}function D(){let v=new Map(s.map(S=>[S.id,S])),u=[],h=new Map;for(let S of n){let T=v.get(S.exerciseId);if(!T)continue;let L=j(T);if(u.includes(L)||u.push(L),!S.completed)continue;let q=(S.weight||0)*(S.reps||0);q<=0||h.set(L,(h.get(L)??0)+q)}let k=[...h.values()].reduce((S,T)=>S+T,0),m=e.container.querySelector("#workout-progress");if(!m)return;if(u.length===0){m.innerHTML="";return}let C=u.map(S=>{let T=p.get(S)??0,L=h.get(S)??0;return{muscle:S,record:T,cur:L,span:Math.max(T,L)}}),I=Math.max(...C.map(S=>S.span)),x=I>0?I*.12:1;C=C.map(S=>({...S,span:Math.max(S.span,x)}));let $=Math.max(...C.map(S=>S.span)),g=C.map(({muscle:S,record:T,cur:L,span:q})=>{let f=q/$*100,M=L>0?Math.min(100,L/q*100):0,B=T>0?`${Math.round(L/T*100)}%`:"new",H=T>0?`${G(L)} / ${G(T)} \xB7 ${B}`:`${G(L)} \xB7 ${B}`,O=Ht(S);return`
        <div class="vol-muscle" style="width: ${f.toFixed(2)}%; --mcolor: ${O}; --mtext: ${Wt(O)};" title="${E(S)}: ${G(L)} / record ${G(T)} lbs">
          <div class="vol-fill" style="width: ${M.toFixed(2)}%;"></div>
          <div class="vol-info${M>55?" on-fill":""}">
            <span class="seg-name">${E(S)}</span>
            <span class="seg-vol">${H}</span>
          </div>
        </div>
      `}).join(""),w=`<strong>${G(k)} lbs</strong> total`;m.innerHTML=`
      <div class="vol-bars">${g}</div>
      <div class="vol-label">${w}</div>
    `,requestAnimationFrame(()=>{for(let S of m.querySelectorAll(".vol-muscle"))d(S)})}function d(v){let u=v.querySelector(".seg-name"),h=v.querySelector(".seg-vol"),k=v.clientWidth-4;if(k<=0)return;if(h){let C=10;for(h.style.fontSize=`${C}px`;h.scrollWidth>k&&C>6;)C-=.5,h.style.fontSize=`${C}px`}if(!u)return;u.style.display="";let m=11;for(u.style.fontSize=`${m}px`;u.scrollWidth>k&&m>5;)m-=.5,u.style.fontSize=`${m}px`}function l(v,u,h){let k=new Map(u.map(I=>[I.id,I])),m=new Map,C=new Map;for(let I of se(v)){if(I.workoutId===h)continue;let x=k.get(I.exerciseId);if(!x)continue;let $=(I.weight||0)*(I.reps||0);if($<=0)continue;let g=j(x),w=C.get(I.workoutId);w||C.set(I.workoutId,w=new Map),w.set(g,(w.get(g)??0)+$)}for(let I of C.values())for(let[x,$]of I)$>(m.get(x)??0)&&m.set(x,$);return m}async function A(v){if(!v.completed||(v.setType||"working")==="warmup"||!(v.weight>0)||!(v.reps>0))return;let u=s.find($=>$.id===v.exerciseId);if(!u)return;let h=await P("sets"),k=se(h).filter($=>$.exerciseId===v.exerciseId&&$.id!==v.id&&($.setType||"working")!=="warmup"&&$.weight>0&&$.reps>0);if(k.length===0)return;let m=[],C=k.reduce(($,g)=>Math.max($,g.weight),0);v.weight>C&&m.push(`Heaviest weight ever: ${we(v.weight)} lbs`);let I=v.weight*v.reps,x=k.reduce(($,g)=>Math.max($,g.weight*g.reps),0);if(I>x&&m.push(`Most volume in a set: ${we(v.weight)}\xD7${v.reps} = ${G(I)} lbs`),m.length>0){let $=m.length>1?"New records":"New record";W(`${Q(u)} \u2014 ${$}!
${m.join(`
`)}`,0,{persistUntilClick:!0})}}function y(){let v=new Map(s.map(x=>[x.id,x])),u=[],h=new Map;for(let x of n)h.has(x.exerciseId)||(h.set(x.exerciseId,[]),u.push(x.exerciseId)),h.get(x.exerciseId).push(x);for(let[,x]of h)x.sort(($,g)=>$.order-g.order);let k=e.container.querySelector("#exercise-sections");if(u.length===0){k.innerHTML=`
        <div class="empty-state" style="padding: 40px 24px; min-height: auto;">
          <p style="color: var(--text-secondary);">Add an exercise to start logging sets.</p>
        </div>`;return}k.innerHTML=u.map(x=>{let $=v.get(x),g=h.get(x),w=o.get(x)??new Map;return Cn($,g,w,i.get(x)??0)}).join("");function m(x){delete x.bumpedBy,delete x.preBumpWeight,delete x.preBumpReps}function C(x){let $=n.filter(L=>L.exerciseId===x.exerciseId).sort((L,q)=>L.order-q.order),g=x.setType||"working",w=0,S=0;for(let L of $)if(S+=1,(L.setType||"working")===g&&(w+=1),L.id===x.id)break;let T=Me(g,w,o.get(x.exerciseId),S);return T&&T.weight>0&&T.reps>0?{weight:T.weight,reps:T.reps}:null}async function I(x){await Bs(x.id,n),x.completed&&await As(x,n,C);for(let $ of n){if($.exerciseId!==x.exerciseId)continue;let g=k.querySelector(`.set-row[data-set-id="${$.id}"]`);if(!g)continue;let w=g.querySelector(".weight-input"),S=g.querySelector(".reps-input");w&&document.activeElement!==w&&(w.value=$.weight>0?String($.weight):""),S&&document.activeElement!==S&&(S.value=$.reps>0?String($.reps):"")}}for(let x of k.querySelectorAll(".set-row-wrap")){let $=x.querySelector(".set-row"),g=$.dataset.setId,w=n.find(B=>B.id===g);if(!w)continue;let S=$.querySelector(".weight-input"),T=$.querySelector(".reps-input"),L=$.querySelector(".complete-btn");In(x,async()=>{await ue("sets",w.id),await b()});let q=Qe(async()=>{await I(w),w.completed&&D()},200);S.addEventListener("input",()=>{w.weight=parseFloat(S.value)||0,m(w),R("sets",{...w}).catch(B=>console.error("Set save failed",B)),q()});let f=Qe(async()=>{await I(w),w.completed&&D()},200);T.addEventListener("input",()=>{w.reps=parseInt(T.value,10)||0,m(w),R("sets",{...w}).catch(B=>console.error("Set save failed",B)),f()}),L.addEventListener("click",async()=>{let B=w.completed;w.completed=!w.completed,w.completed&&m(w),await R("sets",w),$.classList.toggle("completed",w.completed),L.innerHTML=Ts(w.completed);let H=$.querySelector(".set-number")?.textContent?.trim()||"";L.setAttribute("aria-label",`${w.completed?"Mark incomplete":"Mark complete"} set ${H}`),D(),!B&&w.completed?(await As(w,n,C)&&y(),await A(w)):B&&!w.completed&&await Bs(w.id,n)&&y()});let M=$.querySelector(".set-number");M&&M.addEventListener("click",async()=>{let H=(w.setType||"working")==="warmup"?"working":"warmup";if(w.setType=H,!w.completed){let O=n.filter(de=>de.exerciseId===w.exerciseId).sort((de,Ps)=>de.order-Ps.order),U=0,ee=0;for(let de of O)if(ee+=1,(de.setType||"working")===H&&(U+=1),de.id===w.id)break;let ve=Me(H,U,o.get(w.exerciseId),ee);ve&&ve.weight>0&&ve.reps>0&&(w.weight=ve.weight,w.reps=ve.reps)}await R("sets",w),y()})}for(let x of k.querySelectorAll(".add-set-btn"))x.addEventListener("click",async()=>{let $=x.dataset.exerciseId;await Pn(t,n,$,o.get($)??new Map),await b()});for(let x of k.querySelectorAll(".exercise-menu"))x.addEventListener("click",async()=>{let $=x.dataset.exerciseId;confirm("Remove this exercise from the workout?")&&(await Ke("sets",n.filter(g=>g.exerciseId===$).map(g=>g.id)),await b())});for(let x of k.querySelectorAll(".exercise-name-btn"))x.addEventListener("click",()=>{r&&(clearInterval(r),r=null),Ve(e,x.dataset.exerciseId,()=>e.refresh())})}return b(),()=>{r&&clearInterval(r)}}function Cn(e,t,s=new Map,n=0){let o=0,i=0,r=t.map((a,c)=>{let p=a.setType||"working",b,D;p==="warmup"?(i+=1,D=i,b=`W${i}`):(o+=1,D=o,b=String(o));let d=Me(p,D,s,c+1);return Tn(a,b,d)}).join("");return`
    <div class="exercise-section">
      <div class="exercise-section-header">
        <button class="exercise-name-btn" data-exercise-id="${e?.id}">${ae(e)}</button>
        <div class="row-trailing trailing-stack">${ce(n)}</div>
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
  `}function Me(e,t,s,n=null){if(!s||typeof s.get!="function")return null;let o=s.get(`${e}#${t}`);return o||(n!=null?s.get(`any#${n}`)??null:null)}function Tn(e,t,s){let n=e.setType||"working",o=s&&s.weight>0&&s.reps>0?`${we(s.weight)} \xD7 ${s.reps}`:"\u2014";return`
    <div class="set-row-wrap" data-set-id="${e.id}">
      <button class="set-swipe-delete" data-set-id="${e.id}" aria-label="Delete set ${t}">Delete</button>
      <div class="set-row type-${n}${e.completed?" completed":""}" data-set-id="${e.id}">
        <button class="set-number" aria-label="Set ${t}, tap to mark as ${n==="warmup"?"working":"warmup"}">${t}</button>
        <div class="prev" aria-label="Previous">${o}</div>
        <input class="weight-input" type="number" inputmode="decimal" step="0.5" aria-label="Weight in pounds for set ${t}"
               placeholder="0" value="${e.weight>0?e.weight:""}" />
        <input class="reps-input" type="number" inputmode="numeric" step="1" aria-label="Repetitions for set ${t}"
               placeholder="0" value="${e.reps>0?e.reps:""}" />
        <button class="complete-btn" aria-label="${e.completed?"Mark incomplete":"Mark complete"} set ${t}">${Ts(e.completed)}</button>
      </div>
    </div>
  `}function In(e,t){let s=e.querySelector(".set-row"),n=e.querySelector(".set-swipe-delete");if(!s||!n)return;let o=88,i=0,r=0,a=0,c=0,p=!1,b=!1,D=!1,d=!1,l=()=>Math.max(140,i*.5);function A(k,m){s.style.transition=m?"transform 0.18s ease":"none",s.style.transform=`translateX(${k}px)`,n.style.width=`${Math.max(o,-k)}px`,e.classList.toggle("will-delete",k<=-l())}function y(k=!0){D=!1,A(0,k),e.classList.remove("swiped-open")}function v(k=!0){document.querySelectorAll(".set-row-wrap.swiped-open").forEach(m=>{if(m!==e){let C=m.querySelector(".set-row");C&&(C.style.transition="transform 0.18s ease",C.style.transform="translateX(0)");let I=m.querySelector(".set-swipe-delete");I&&(I.style.width=""),m.classList.remove("swiped-open","will-delete")}}),D=!0,A(-o,k),e.classList.add("swiped-open")}function u(){s.style.transition="transform 0.16s ease-out",s.style.transform=`translateX(${-i}px)`,n.style.width=`${i}px`,setTimeout(t,150)}s.addEventListener("touchstart",k=>{i=e.clientWidth||s.clientWidth,r=k.touches[0].clientX,a=k.touches[0].clientY,c=D?-o:0,p=!0,b=!1,d=!!k.target.closest("input, button, select, textarea")},{passive:!0}),s.addEventListener("touchmove",k=>{if(!p)return;let m=k.touches[0].clientX-r,C=k.touches[0].clientY-a;if(!b){if(Math.abs(C)>Math.abs(m)+4){p=!1;return}Math.abs(m)>8&&(b=!0,d&&document.activeElement?.blur&&document.activeElement.blur())}if(!b)return;k.cancelable&&k.preventDefault();let I=D?-o:0;c=Math.min(0,Math.max(-i,I+m)),A(c,!1)},{passive:!1});function h(){p&&(p=!1,b&&(c<=-l()?u():c<-o/2?v():y()))}s.addEventListener("touchend",h),s.addEventListener("touchcancel",h),n.addEventListener("click",k=>{k.stopPropagation(),t()})}function Ts(e){return e?'<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>':'<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>'}async function qn(e,t,s){let n=t.reduce((o,i)=>Math.max(o,i.order),-1)+1;for(let o of s){let i=(await xt(o,e.id)).filter(c=>(c.weight||0)>0&&(c.reps||0)>0),a=(i.length>0?i:[{weight:0,reps:0,setType:"working"}]).map(c=>({id:_(),workoutId:e.id,exerciseId:o,weight:c.weight??0,reps:c.reps??0,setType:c.setType||"working",completed:!1,order:n++,createdAt:Date.now()}));await re("sets",a)}}async function As(e,t,s){let n=e.weight||0,o=n*(e.reps||0);if(o<=0)return!1;let i=!1;for(let r of t){if(r.exerciseId!==e.exerciseId||r.id===e.id||(r.order??0)<=(e.order??0)||r.completed)continue;if((r.weight||0)*(r.reps||0)<o||(r.weight||0)<n){if(r.bumpedBy==null){let c=s?.(r);r.preBumpWeight=c?c.weight:r.weight,r.preBumpReps=c?c.reps:r.reps}r.bumpedBy=e.id,r.weight=e.weight,r.reps=e.reps,await R("sets",r),i=!0}}return i}async function Bs(e,t){let s=!1;for(let n of t)n.bumpedBy===e&&(n.completed||(n.preBumpWeight!=null&&(n.weight=n.preBumpWeight),n.preBumpReps!=null&&(n.reps=n.preBumpReps)),delete n.bumpedBy,delete n.preBumpWeight,delete n.preBumpReps,await R("sets",n),s=!0);return s}async function Pn(e,t,s,n=new Map){let o=t.filter(y=>y.exerciseId===s),i=o[o.length-1],r=y=>(y?.weight||0)*(y?.reps||0),a=o.filter(y=>(y.setType||"working")!=="warmup"),c=a.length+1,p=Me("working",c,n,o.length+1),b=a.filter(y=>y.weight>0&&y.reps>0).reduce((y,v)=>!y||r(v)>r(y)?v:y,null),D=a.some((y,v)=>{let u=Me("working",v+1,n);return u&&u.weight>0&&u.reps>0&&r(y)>r(u)}),d=i?.weight??0,l=i?.reps??0;b&&(!p||D)&&(d=b.weight,l=b.reps);let A={id:_(),workoutId:e.id,exerciseId:s,weight:d,reps:l,completed:!1,order:(i?.order??-1)+1,createdAt:Date.now()};await R("sets",A)}async function Hn(e,t){await Ke("sets",t.filter(s=>!s.completed&&((s.weight||0)===0||(s.reps||0)===0)).map(s=>s.id)),e.endedAt=Date.now(),await R("workouts",e)}function On(e,t,s){let n=new Set,o="",i=null,r=N({html:`
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
    `,onMount(a){let c=a.querySelector("#picker-list"),p=a.querySelector("#picker-add"),b=a.querySelector("#picker-cancel"),D=a.querySelector("#picker-custom"),d=a.querySelector("#picker-search"),l=a.querySelector("#picker-chips");function A(){l.innerHTML=He(e,i);for(let v of l.querySelectorAll(".chip"))v.addEventListener("click",()=>{let u=v.dataset.cat;i=u==="All"?null:u,A(),y()})}function y(){let v=e.filter(u=>!i||j(u)===i).filter(u=>!o||u.name.toLowerCase().includes(o.toLowerCase())).sort((u,h)=>{let k=t.get(u.id)??0,m=t.get(h.id)??0;return k!==m?m-k:u.name.localeCompare(h.name)});c.innerHTML=v.length===0?'<div class="list-row"><div class="row-main" style="color:var(--text-secondary)">No matches</div></div>':v.map(u=>`
                <button class="list-row" data-id="${u.id}">
                  ${ae(u)}
                  <div class="row-trailing trailing-stack">
                    ${ce(t.get(u.id)??0)}
                    ${n.has(u.id)?Wn():""}
                  </div>
                </button>
              `).join("");for(let u of c.querySelectorAll(".list-row[data-id]"))u.addEventListener("click",()=>{let h=u.dataset.id;n.has(h)?n.delete(h):n.add(h),p.disabled=n.size===0,p.textContent=n.size===0?"Add":`Add (${n.size})`,y()})}d.addEventListener("input",()=>{o=d.value,y()}),b.addEventListener("click",()=>r()),p.addEventListener("click",()=>{s(Array.from(n)),r()}),D.addEventListener("click",()=>{$e(null,async v=>{e.push(v),n.add(v.id),A(),y(),p.disabled=!1,p.textContent=`Add (${n.size})`})}),A(),y()}})}function Wn(){return'<svg viewBox="0 0 24 24" width="22" height="22" fill="var(--green)"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'}function $e(e,t){let s=!!e,n=s?j(e):null,o=!n||be.includes(n)?be:[n,...be],i=e?.equipment,r=!i||Pe.includes(i)?Pe:[i,...Pe],a=N({html:`
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
            <select id="ce-cat">${o.map(c=>`<option${c===n?" selected":""}>${E(c)}</option>`).join("")}</select>
          </div>
        </div>
        <div class="section">Equipment</div>
        <div class="form-section">
          <div class="form-row">
            <label for="ce-eq">Equipment</label>
            <select id="ce-eq">${r.map(c=>`<option${c===i?" selected":""}>${E(c)}</option>`).join("")}</select>
          </div>
        </div>
      </div>
    `,onMount(c){let p=c.querySelector("#ce-name"),b=c.querySelector("#ce-save");p.addEventListener("input",()=>{b.disabled=p.value.trim().length===0}),c.querySelector("#ce-cancel").addEventListener("click",()=>a()),b.addEventListener("click",async()=>{let D=p.value.trim();if(!D)return;let d=c.querySelector("#ce-cat").value,l=c.querySelector("#ce-eq").value,A=s?{...e,name:D,muscle:d,equipment:l}:{id:_(),name:D,muscle:d,category:d,equipment:l,notes:"",isCustom:!0,createdAt:Date.now()};await R("exercises",A),a(),t?.(A),s||F("data:changed")}),s||setTimeout(()=>p.focus(),50)}})}function Rn(){let t=[["(","open","paren"],[")","close","paren"],["AC","clear","fn"],["\xB1","sign","fn"],["\u232B","back","fn"],["\xF7","op","op"],["7","digit"],["8","digit"],["9","digit"],["\xD7","op","op"],["4","digit"],["5","digit"],["6","digit"],["\u2212","op","op"],["1","digit"],["2","digit"],["3","digit"],["+","op","op"],["0","digit","zero"],[".","dot"],["=","equals","op"]].map(([s,n,o])=>`<button class="calc-key${o?` calc-${o}`:""}" data-action="${n}" data-key="${E(s)}">${E(s)}</button>`).join("");N({html:`
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
    `,onMount(s,n){let o=s.querySelector("#calc-expr"),i=s.querySelector("#calc-result"),r={"+":(f,M)=>f+M,"\u2212":(f,M)=>f-M,"\xD7":(f,M)=>f*M,"\xF7":(f,M)=>M===0?NaN:f/M},a={"+":1,"\u2212":1,"\xD7":2,"\xF7":2},c=f=>f==="+"||f==="\u2212"||f==="\xD7"||f==="\xF7",p=f=>f!=null&&!c(f)&&f!=="(";function b(f){let M=[],B=[];for(let O of f)if(O==="(")B.push(O);else if(O===")"){for(;B.length&&B[B.length-1]!=="(";)M.push(B.pop());if(!B.length)return NaN;B.pop()}else if(c(O)){for(;B.length&&c(B[B.length-1])&&a[B[B.length-1]]>=a[O];)M.push(B.pop());B.push(O)}else{let U=parseFloat(O);if(!isFinite(U))return NaN;M.push(U)}for(;B.length;){let O=B.pop();if(O==="(")return NaN;M.push(O)}let H=[];for(let O of M){if(typeof O=="number"){H.push(O);continue}let U=H.pop(),ee=H.pop();if(ee===void 0||U===void 0)return NaN;H.push(r[O](ee,U))}return H.length===1?H[0]:NaN}let D=f=>f.reduce((M,B,H)=>H===0?B:M+(f[H-1]==="("||B===")"?"":" ")+B,""),d=f=>{if(!isFinite(f))return"Error";let M=parseFloat(f.toFixed(8)).toString();return M.replace("-","").replace(".","").length>12&&(M=f.toPrecision(10).replace(/\.?0+$/,"")),M},l=["0"],A=!1,y=!1,v="",u=()=>l[l.length-1];function h(){o.textContent=y?"":v,i.textContent=y?"Error":D(l);let f=!y&&c(u())?u():null;for(let M of s.querySelectorAll(".calc-op"))M.classList.toggle("selected",M.dataset.key===f)}function k(f){if(y&&(l=["0"],y=!1),A)return l=[f],A=!1,h();u()===")"?l.push("\xD7",f):c(u())||u()==="("?l.push(f):l[l.length-1]=u()==="0"?f:u()+f,h()}function m(){if(y&&(l=["0"],y=!1),A)return l=["0."],A=!1,h();u()===")"?l.push("\xD7","0."):c(u())||u()==="("?l.push("0."):u().includes(".")||(l[l.length-1]=u()+"."),h()}function C(f){y||(A=!1,u()!=="("&&(c(u())?l[l.length-1]=f:l.push(f),h()))}let I=()=>l.filter(f=>f==="(").length-l.filter(f=>f===")").length;function x(){if(y&&(l=["0"],y=!1),A)return l=["("],A=!1,h();l.length===1&&u()==="0"?l=["("]:p(u())?l.push("\xD7","("):l.push("("),h()}function $(){y||A||I()<=0||!p(u())||(l.push(")"),h())}function g(){l=["0"],A=!1,y=!1,h()}function w(){if(y||c(u())||u()==="("||u()===")")return;let f=u();l[l.length-1]=f.startsWith("-")?f.slice(1):f==="0"?"0":"-"+f,h()}function S(){if(y)return g();if(A=!1,c(u())||u()==="("||u()===")")return l.pop(),l.length===0&&(l=["0"]),h();let f=u().slice(0,-1);f===""||f==="-"?l.length>1?l.pop():l=["0"]:l[l.length-1]=f,h()}function T(){if(y)return;let f=l.slice();for(;f.length&&(c(f[f.length-1])||f[f.length-1]==="(");)f.pop();if(!f.some(c))return;for(let B=f.filter(H=>H==="(").length-f.filter(H=>H===")").length;B>0;B--)f.push(")");let M=b(f);if(!isFinite(M))return y=!0,h();v=`${D(f)} =`,l=[d(M)],A=!0,h()}function L(f){let{action:M,key:B}=f.dataset;M!=="equals"&&(v=""),M==="digit"?k(B):M==="open"?x():M==="close"?$():M==="dot"?m():M==="clear"?g():M==="sign"?w():M==="back"?S():M==="op"?C(B):M==="equals"&&T()}let q=null;for(let f of s.querySelectorAll(".calc-key"))f.addEventListener("pointerdown",M=>{M.preventDefault(),q=f,f.classList.add("pressed")}),f.addEventListener("pointerup",M=>{M.preventDefault(),f.classList.remove("pressed"),q===f&&L(f),q=null}),f.addEventListener("pointercancel",()=>{f.classList.remove("pressed"),q=null}),f.addEventListener("pointerleave",()=>f.classList.remove("pressed"));s.querySelector("#calc-done").addEventListener("click",()=>n())}})}function De(){let e=window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===!0,t;e?t=Math.max(window.innerHeight||0,window.visualViewport?.height||0,window.screen?.height||0):t=window.visualViewport?.height||window.innerHeight,document.documentElement.style.setProperty("--app-height",`${t}px`)}De();window.addEventListener("resize",De);window.addEventListener("orientationchange",De);window.addEventListener("pageshow",De);window.visualViewport?.addEventListener("resize",De);var Is={workout:{title:"Workout",render:Cs},exercises:{title:"Exercises",render:$s},progress:{title:"Progress",render:ws}},Ee=document.getElementById("view-content"),Fn=document.getElementById("nav-title"),qs=document.getElementById("nav-back"),Z=document.getElementById("nav-action"),Le="workout",ht=null,_e=null,Ye=null,Ue={container:Ee,setTitle(e){Fn.textContent=e},setAction(e){if(!e){Z.hidden=!0,Z.innerHTML="",Z.removeAttribute("aria-label"),_e=null;return}Z.hidden=!1,e.label?Z.setAttribute("aria-label",e.label):Z.removeAttribute("aria-label"),e.html?Z.innerHTML=e.html:Z.textContent=e.label??"",_e=e.onClick},setBack(e){ht=e,qs.hidden=!e},refresh(){Ae(Le)},toast(e){W(e)}};function Nn(){if(typeof Ye=="function")try{Ye()}catch(e){console.error(e)}Ye=null}function Ae(e){Le=e,Pt(e),document.querySelectorAll(".tab").forEach(t=>{t.setAttribute("aria-selected",String(t.dataset.tab===e))}),Nn(),Ue.setTitle(Is[e].title),Ue.setAction(null),Ue.setBack(null),Ee.innerHTML="",Ee.scrollTop=0;try{Ye=Is[e].render(Ue)}catch(t){console.error("Render failed",t),Ee.innerHTML=`<div class="empty-state"><div class="empty-icon">!</div><h2>Render error</h2><p>${E(t.message)}</p></div>`}}document.querySelectorAll(".tab").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll(".sheet-backdrop").forEach(t=>t.dismissSheet?.()),Ae(e.dataset.tab)})});qs.addEventListener("click",()=>{ht&&ht()});Z.addEventListener("click",()=>{_e&&_e()});(function(){let t='button, [role="button"], a[href]',s=null,n=0,o=0,i=()=>{s&&(s.classList.remove("pressed"),s=null)};document.addEventListener("pointerdown",r=>{let a=r.target.closest?.(t);s&&s!==a&&i(),!(!a||a.disabled||a.classList.contains("calc-key"))&&(s=a,n=r.clientX,o=r.clientY,a.classList.add("pressed"))},{passive:!0}),document.addEventListener("pointermove",r=>{s&&(Math.abs(r.clientX-n)>8||Math.abs(r.clientY-o)>8)&&i()},{passive:!0}),document.addEventListener("pointerup",i,{passive:!0}),document.addEventListener("pointercancel",i,{passive:!0}),window.addEventListener("scroll",i,{passive:!0,capture:!0})})();Je("data:changed",()=>{le(),Ae(Le)});Je("workout:changed",()=>{le(),Le==="workout"&&Ae(Le)});document.addEventListener("visibilitychange",()=>{document.visibilityState==="visible"&&le()});async function jn(){try{await Y(),await Ut().catch(t=>console.warn("Passphrase check failed:",t));let e=await It();e>0&&console.info(`Seeded ${e} exercises.`),await Nt(),Ae("workout"),le()}catch(e){console.error("Init failed:",e),Ee.innerHTML=`
      <div class="empty-state">
        <div class="empty-icon">!</div>
        <h2>Storage unavailable</h2>
        <p>${E(e.message??String(e))}</p>
        <p>If you are running this from a <code>file://</code> URL, serve it through a local web server instead.</p>
      </div>`}}jn();
