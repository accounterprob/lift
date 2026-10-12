var Rs="lift";var wt=["exercises","workouts","sets","stateOfMind","medications"],Ce=null;function U(){return Ce?Promise.resolve(Ce):new Promise((e,t)=>{let s=indexedDB.open(Rs,6);s.onerror=()=>t(s.error),s.onsuccess=()=>{Ce=s.result,e(Ce)},s.onupgradeneeded=()=>{let n=s.result;if(!n.objectStoreNames.contains("exercises")){let o=n.createObjectStore("exercises",{keyPath:"id"});o.createIndex("name","name",{unique:!1}),o.createIndex("category","category",{unique:!1})}if(n.objectStoreNames.contains("workouts")||n.createObjectStore("workouts",{keyPath:"id"}).createIndex("startedAt","startedAt",{unique:!1}),!n.objectStoreNames.contains("sets")){let o=n.createObjectStore("sets",{keyPath:"id"});o.createIndex("workoutId","workoutId",{unique:!1}),o.createIndex("exerciseId","exerciseId",{unique:!1})}n.objectStoreNames.contains("stateOfMind")||n.createObjectStore("stateOfMind",{keyPath:"id"}).createIndex("date","date",{unique:!1}),n.objectStoreNames.contains("medications")||n.createObjectStore("medications",{keyPath:"id"}),n.objectStoreNames.contains("appMeta")||n.createObjectStore("appMeta",{keyPath:"key"}),n.objectStoreNames.contains("doseEvents")&&n.deleteObjectStore("doseEvents")}})}function ve(e){return new Promise((t,s)=>{e.onsuccess=()=>t(e.result),e.onerror=()=>s(e.error)})}async function ge(e,t="readonly"){return(await U()).transaction(e,t).objectStore(e)}function se(e,t,s){return new Promise((n,o)=>{let i=e.transaction(t,"readwrite"),r;try{r=s(i)}catch(a){try{i.abort()}catch{}o(a);return}i.oncomplete=()=>n(r),i.onerror=()=>o(i.error),i.onabort=()=>o(i.error)})}async function P(e){return ve((await ge(e)).getAll())}async function ne(e,t){return ve((await ge(e)).get(t))}async function W(e,t){return await ve((await ge(e,"readwrite")).put(t)),t}async function re(e,t){let s=await U();return se(s,e,n=>{let o=n.objectStore(e);for(let i of t)o.put(i)})}async function Te(e,t){return ve((await ge(e,"readwrite")).delete(t))}async function Ke(e,t){if(t.length===0)return;let s=await U();return se(s,e,n=>{let o=n.objectStore(e);for(let i of t)o.delete(i)})}async function yt(e){let t=await ne("appMeta",e);return t?t.value:null}async function Ie(e,t){return await W("appMeta",{key:e,value:t}),t}async function pe(e,t,s){let n=await ge(e);return ve(n.index(t).getAll(s))}async function bt(e){let t=await U();return se(t,wt,s=>{for(let n of wt){let o=s.objectStore(n);o.clear();for(let i of e[n]??[])o.put(i)}})}function G(e){let t=new Set;for(let s of e)s.completed&&t.add(s.workoutId);return e.filter(s=>s.completed||!t.has(s.workoutId))}async function ae(){return(await P("workouts")).find(t=>!t.endedAt)??null}async function oe(){return(await P("workouts")).filter(t=>t.endedAt).sort((t,s)=>s.startedAt-t.startedAt)}async function xt(e){return(await pe("sets","workoutId",e)).sort((s,n)=>s.order-n.order)}async function Ge(e){return await pe("sets","exerciseId",e)}async function kt(e,t=null){let s=await Ge(e),n=new Map;for(let a of s)t&&a.workoutId===t||(n.has(a.workoutId)||n.set(a.workoutId,[]),n.get(a.workoutId).push(a));if(n.size===0)return[];let i=(await Promise.all(Array.from(n.keys()).map(a=>ne("workouts",a)))).filter(Boolean).sort((a,c)=>(c.startedAt??0)-(a.startedAt??0)),r=(a,c)=>a.order-c.order;for(let a of i){let c=n.get(a.id);if(c.some(w=>w.completed))return c.filter(w=>w.completed).sort(r);if(!(await pe("sets","workoutId",a.id)).some(w=>w.completed))return c.sort(r)}return[]}function St(e,t,s=null){let n=new Map(t.map(r=>[r.id,r.startedAt??0])),o=new Map;for(let r of G(e)){if(r.workoutId===s||!n.has(r.workoutId)||(r.weight||0)<=0||(r.reps||0)<=0)continue;let a=o.get(r.exerciseId);a||o.set(r.exerciseId,a=new Map);let c=a.get(r.workoutId);c||a.set(r.workoutId,c=[]),c.push(r)}let i=new Map;for(let[r,a]of o){let c=[...a.keys()].sort((w,D)=>n.get(D)-n.get(w)),p=new Map;for(let w of c){let D=a.get(w).sort((b,h)=>b.order-h.order),d=D.every(b=>b.setType==null),l=0,A=0;D.forEach((b,h)=>{if(d){let m=`any#${h+1}`;p.has(m)||p.set(m,b);return}let u=b.setType||"working",v=u==="warmup"?A+=1:l+=1,k=`${u}#${v}`;p.has(k)||p.set(k,b)})}i.set(r,p)}return i}var Ws={barbell:"Barbell",dumbbell:"Dumbbell",machine:"Machine",cable:"Cable",bodyweight:"Bodyweight",kettlebell:"Kettlebell",band:"Bands",bands:"Bands"},Fs=/\s*\((barbell|dumbbell|machine|cable|bodyweight|kettlebell|bands?)\)$|\s+(Machine|Barbell|Dumbbell|Cable|Kettlebell)$/i;async function Ns(e,t){let s=await U(),n=await pe("sets","exerciseId",e);return se(s,["sets","exercises"],o=>{let i=o.objectStore("sets");for(let r of n)i.put({...r,exerciseId:t});return o.objectStore("exercises").delete(e),n.length})}async function $t(){let e=await P("exercises"),t=e.filter(i=>/butterfly/i.test(i.name||""));if(t.length===0)return 0;let s=e.filter(i=>/chest fly/i.test(i.name||"")&&!t.some(r=>r.id===i.id)),n=s.find(i=>(i.equipment||"")==="Machine")||s[0],o=0;for(let i of t)n?o+=await Ns(i.id,n.id):await W("exercises",{...i,name:"Chest Fly",equipment:"Machine"});return o}async function Mt(){let e=await P("exercises"),t=[];for(let s of e){let n=(s.name||"").match(Fs);if(!n)continue;let o=s.name.slice(0,n.index).trim();if(!o||/smith$/i.test(o))continue;let i=(n[1]||n[2]).toLowerCase();t.push({...s,name:o,equipment:Ws[i]||s.equipment})}return t.length>0&&await re("exercises",t),t.length}async function Et(){let[e,t,s]=await Promise.all([P("exercises"),P("sets"),P("workouts")]),n=new Set(e.filter(p=>p.category==="Cardio").map(p=>p.id));if(n.size===0)return{exercises:0,sets:0,workouts:0};let o=t.filter(p=>n.has(p.exerciseId)),i=new Map;for(let p of t)n.has(p.exerciseId)||i.set(p.workoutId,(i.get(p.workoutId)||0)+1);let r=new Set(o.map(p=>p.workoutId)),a=s.filter(p=>r.has(p.id)&&!i.get(p.id)),c=await U();return await se(c,["exercises","sets","workouts"],p=>{let w=p.objectStore("exercises"),D=p.objectStore("sets"),d=p.objectStore("workouts");for(let l of n)w.delete(l);for(let l of o)D.delete(l.id);for(let l of a)d.delete(l.id)}),{exercises:n.size,sets:o.length,workouts:a.length}}async function Lt(e){let[t,s,n]=await Promise.all([P("exercises"),P("sets"),P("workouts")]),o=t.filter(d=>d.category==="Other");if(o.length===0)return{recategorized:0,deleted:0,workouts:0};let i=[],r=new Set;for(let d of o){let l=e(d.name);l==="Cardio"?r.add(d.id):i.push({...d,category:l&&l!=="Other"?l:"Full Body"})}let a=s.filter(d=>r.has(d.exerciseId)),c=new Map;for(let d of s)r.has(d.exerciseId)||c.set(d.workoutId,(c.get(d.workoutId)||0)+1);let p=new Set(a.map(d=>d.workoutId)),w=n.filter(d=>p.has(d.id)&&!c.get(d.id)),D=await U();return await se(D,["exercises","sets","workouts"],d=>{let l=d.objectStore("exercises"),A=d.objectStore("sets"),b=d.objectStore("workouts");for(let h of i)l.put(h);for(let h of r)l.delete(h);for(let h of a)A.delete(h.id);for(let h of w)b.delete(h.id)}),{recategorized:i.length,deleted:r.size,workouts:w.length}}async function Dt(){let e=await P("medications"),t=[];for(let s of e){if(s.doseAmount!=null)continue;let n=s.nickname||s.concept?.displayText||"";if(!/creatine/i.test(n))continue;let o=(s.concept?.form||"").replace(/\s*\(4\s*[×x]\s*\/?\s*day\)\s*/i,"").trim();t.push({...s,doseAmount:4,doseUnit:"capsule",concept:{...s.concept,form:o}})}return t.length>0&&await re("medications",t),t.length}var js=[[/\b(barbell|landmine|ez[- ]?bar|smith)\b/i,"Barbell"],[/\b(dumbbell|db)\b/i,"Dumbbell"],[/\b(cable|pulley|rope)\b/i,"Cable"],[/\b(plate[- ]?loaded|hammer strength)\b/i,"Machine Plates"],[/\b(machine|sled|press)\b/i,"Machine"]];async function At(){let t=(await P("exercises")).filter(n=>(n.equipment||"")==="Other");if(t.length===0)return[];let s=t.map(n=>{let o=js.find(([i])=>i.test(n.name||""));return{...n,equipment:o?o[1]:"Bodyweight"}});return await re("exercises",s),s.map(n=>`${n.name} \u2192 ${n.equipment}`)}async function Bt(e){let t=await U(),s=await pe("sets","exerciseId",e);return se(t,["exercises","sets"],n=>{n.objectStore("exercises").delete(e);let o=n.objectStore("sets");for(let i of s)o.delete(i.id)})}async function we(e){let t=await U(),s=await pe("sets","workoutId",e);return se(t,["workouts","sets"],n=>{n.objectStore("workouts").delete(e);let o=n.objectStore("sets");for(let i of s)o.delete(i.id)})}var _=()=>crypto&&crypto.randomUUID?crypto.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,e=>{let t=Math.random()*16|0;return(e==="x"?t:t&3|8).toString(16)});function ye(e){return e==null?"0":Math.abs(e-Math.round(e))<.001?String(Math.round(e)):e.toFixed(1)}function be(e){return`${ye(e)} lbs`}function Ct(e){let t=Math.max(0,Math.floor(e)),s=Math.floor(t/3600),n=Math.floor(t%3600/60),o=t%60;return s>0?`${s}:${String(n).padStart(2,"0")}:${String(o).padStart(2,"0")}`:`${n}:${String(o).padStart(2,"0")}`}function Qe(e){let t=Math.max(0,Math.floor(e)),s=Math.floor(t/3600),n=Math.floor(t%3600/60);return s>0?`${s}h ${n}m`:`${n}m`}function X(e){return Math.round(e).toLocaleString()}function fe(e){return`${X(e)} lbs`}function Q(e){return(e instanceof Date?e:new Date(e)).toLocaleDateString(void 0,{month:"numeric",day:"numeric",year:"2-digit"})}function Tt(e){return(e instanceof Date?e:new Date(e)).toLocaleDateString(void 0,{weekday:"short",month:"short",day:"numeric",year:"numeric"})}function Je(e,t=200){let s=null;return(...n)=>{clearTimeout(s),s=setTimeout(()=>e(...n),t)}}function $(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function R(e,t=1800,s={}){let n=document.querySelector(".toast");n&&n.remove();let o=document.createElement("div");o.className="toast",o.textContent=e,s.persistUntilClick?(o.classList.add("toast-clickable"),o.addEventListener("click",()=>o.remove())):setTimeout(()=>o.remove(),t),document.body.appendChild(o)}var Xe=new EventTarget;function F(e,t){Xe.dispatchEvent(new CustomEvent(e,{detail:t}))}function Ze(e,t){return Xe.addEventListener(e,t),()=>Xe.removeEventListener(e,t)}function N({html:e,onMount:t}){let s=document.createElement("div");s.className="sheet-backdrop",s.innerHTML='<div class="sheet"></div>';let n=s.querySelector(".sheet");n.innerHTML=e;let o=zs();document.body.appendChild(s);function i(){let c=window.visualViewport;if(!c){n.style.maxHeight=`${window.innerHeight-o-10}px`;return}let p=Math.max(window.innerHeight,document.documentElement.clientHeight),w=Math.max(0,p-c.height-c.offsetTop);w>0?(n.style.paddingBottom=`${w}px`,n.style.maxHeight=`${c.height-o-10+w}px`):(n.style.paddingBottom="",n.style.maxHeight=`${c.height-o-10}px`)}i();let r=window.visualViewport;r?.addEventListener("resize",i),r?.addEventListener("scroll",i);function a(){s.remove(),r?.removeEventListener("resize",i),r?.removeEventListener("scroll",i)}return s.dismissSheet=a,s.addEventListener("click",c=>{c.target===s&&a()}),t?.(n,a),a}function zs(){let e=document.createElement("div");e.style.cssText="position:fixed;top:0;left:0;width:0;height:env(safe-area-inset-top);",document.body.appendChild(e);let t=e.offsetHeight||0;return e.remove(),t}function qe(){return'<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" style="color: var(--red);"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>'}function It(){return'<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M16 5l-1.42 1.42-1.59-1.59V16h-2V4.83L9.41 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z"/></svg>'}function ie(e){return`<div class="empty-state"><div class="empty-icon">!</div><h2>Couldn't load</h2><p>${$(e.message||String(e))}</p></div>`}var xe=["Pectorals","Anterior Deltoid","Lateral Deltoid","Posterior Deltoid","Triceps","Biceps","Forearms","Lats","Upper Back","Lower Back","Traps","Quadriceps","Hamstrings","Glutes","Adductors","Abductors","Calves","Abs","Obliques"];function Vs(e){let t=new Map(xe.map((s,n)=>[s,n]));return[...e].sort((s,n)=>(t.get(s)??999)-(t.get(n)??999)||s.localeCompare(n))}var Pe=["Barbell","Dumbbell","Machine","Machine Plates","Cable","Bodyweight"];function J(e){let t=e?.equipment,s=e?.name??"";return t&&t!=="Other"?`${s} (${t})`:s}function ce(e){let t=e?[e.equipment,j(e)].filter(Boolean).join(" \xB7 "):"";return`
    <div class="row-main">
      <div class="row-title">${$(e?.name??"Unknown exercise")}</div>
      ${t?`<div class="row-subtitle">${$(t)}</div>`:""}
    </div>
  `}function le(e){return e?`<div class="exercise-count">${e} ${e===1?"set":"sets"}</div>`:""}function He(e,t){return["All",...Vs(new Set(e.map(n=>j(n))))].map(n=>`<button class="chip${n==="All"&&!t||n===t?" active":""}" data-cat="${$(n)}">${$(n)}</button>`).join("")}var Us=[["Bench Press (Barbell)","Chest","Barbell"],["Bench Press (Dumbbell)","Chest","Dumbbell"],["Incline Bench Press (Barbell)","Chest","Barbell"],["Incline Bench Press (Dumbbell)","Chest","Dumbbell"],["Decline Bench Press (Barbell)","Chest","Barbell"],["Chest Fly (Dumbbell)","Chest","Dumbbell"],["Chest Fly (Machine)","Chest","Machine"],["Cable Crossover","Chest","Cable"],["Push-Up","Chest","Bodyweight"],["Dip (Chest)","Chest","Bodyweight"],["Deadlift (Conventional)","Back","Barbell"],["Deadlift (Sumo)","Back","Barbell"],["Romanian Deadlift","Back","Barbell"],["Bent-Over Row (Barbell)","Back","Barbell"],["Pendlay Row","Back","Barbell"],["Row (Dumbbell)","Back","Dumbbell"],["T-Bar Row","Back","Barbell"],["Seated Cable Row","Back","Cable"],["Lat Pulldown","Back","Cable"],["Pull-Up","Back","Bodyweight"],["Chin-Up","Back","Bodyweight"],["Face Pull","Back","Cable"],["Shrug (Barbell)","Back","Barbell"],["Shrug (Dumbbell)","Back","Dumbbell"],["Overhead Press (Barbell)","Shoulders","Barbell"],["Overhead Press (Dumbbell)","Shoulders","Dumbbell"],["Seated Shoulder Press (Machine)","Shoulders","Machine"],["Arnold Press","Shoulders","Dumbbell"],["Lateral Raise (Dumbbell)","Shoulders","Dumbbell"],["Lateral Raise (Cable)","Shoulders","Cable"],["Front Raise (Dumbbell)","Shoulders","Dumbbell"],["Rear Delt Fly (Dumbbell)","Shoulders","Dumbbell"],["Reverse Pec Deck","Shoulders","Machine"],["Upright Row","Shoulders","Barbell"],["Barbell Curl","Biceps","Barbell"],["Dumbbell Curl","Biceps","Dumbbell"],["Hammer Curl","Biceps","Dumbbell"],["Preacher Curl","Biceps","Barbell"],["Incline Dumbbell Curl","Biceps","Dumbbell"],["Cable Curl","Biceps","Cable"],["Concentration Curl","Biceps","Dumbbell"],["Close-Grip Bench Press","Triceps","Barbell"],["Tricep Pushdown (Cable)","Triceps","Cable"],["Overhead Tricep Extension (Dumbbell)","Triceps","Dumbbell"],["Overhead Tricep Extension (Cable)","Triceps","Cable"],["Skull Crusher","Triceps","Barbell"],["Dip (Tricep)","Triceps","Bodyweight"],["Tricep Kickback","Triceps","Dumbbell"],["Back Squat","Legs","Barbell"],["Front Squat","Legs","Barbell"],["Goblet Squat","Legs","Dumbbell"],["Bulgarian Split Squat","Legs","Dumbbell"],["Lunge","Legs","Dumbbell"],["Leg Press","Legs","Machine"],["Leg Extension","Legs","Machine"],["Leg Curl (Seated)","Legs","Machine"],["Leg Curl (Lying)","Legs","Machine"],["Hip Thrust (Barbell)","Glutes","Barbell"],["Glute Bridge","Glutes","Bodyweight"],["Cable Kickback","Glutes","Cable"],["Hip Abduction (Machine)","Glutes","Machine"],["Standing Calf Raise","Calves","Machine"],["Seated Calf Raise","Calves","Machine"],["Plank","Core","Bodyweight"],["Hanging Leg Raise","Core","Bodyweight"],["Cable Crunch","Core","Cable"],["Russian Twist","Core","Bodyweight"],["Ab Wheel Rollout","Core","Bodyweight"],["Wrist Curl","Forearms","Dumbbell"],["Reverse Wrist Curl","Forearms","Dumbbell"],["Farmer's Carry","Forearms","Dumbbell"]];function j(e){if(e?.muscle)return e.muscle;let t=(e?.name||"").toLowerCase();return t?/romanian deadlift|\brdl\b|stiff.?leg|good morning|nordic|hamstring/.test(t)||/leg curl/.test(t)?"Hamstrings":/leg extension|sissy squat/.test(t)?"Quadriceps":/calf|tib raise|tibialis/.test(t)?"Calves":/hip adduction|adductor|inner thigh|copenhagen/.test(t)?"Adductors":/hip abduction|abductor|outer thigh|clamshell/.test(t)?"Abductors":/hip thrust|glute|cable kickback|donkey kick|rear kick|frog pump/.test(t)?"Glutes":/squat|leg press|lunge|step.?up/.test(t)?"Quadriceps":/back extension|hyperextension|superman/.test(t)||/deadlift|rack pull/.test(t)?"Lower Back":/lateral raise|side raise|side delt|\blat raise\b|upright row/.test(t)?"Lateral Deltoid":/rear delt|reverse fly|reverse flye|face pull|reverse pec deck/.test(t)?"Posterior Deltoid":/front raise|shoulder press|overhead press|arnold|military press|landmine press|push press|viking press/.test(t)?"Anterior Deltoid":/pulldown|pull.?down|pull.?up|chin.?up|pullover|straight.?arm/.test(t)?"Lats":/shrug/.test(t)?"Traps":/tricep|pushdown|skull ?crusher|close.?grip bench|jm press|french press|bench dip/.test(t)?"Triceps":/wrist curl|reverse curl|forearm|farmer|gripper|dead hang/.test(t)?"Forearms":/bicep|\bcurl\b/.test(t)?"Biceps":/\brow\b|rear pull|high pull/.test(t)?"Upper Back":/bench|chest|\bpec\b|pec deck|crossover|butterfly|push.?up|floor press|squeeze press|\bfly\b|\bflye\b/.test(t)?"Pectorals":/russian twist|woodchop|wood chop|side plank|side bend|oblique|pallof|rotation/.test(t)?"Obliques":/crunch|sit.?up|plank|leg raise|knee raise|ab wheel|ab roll|hanging|toes.?to.?bar|v.?up|dead bug|mountain climber/.test(t)?"Abs":/\bdip\b/.test(t)?"Triceps":e.category||"Other":e?.category||"Other"}var Ys=/\b(bike|biking|treadmill|run|running|cardio|step.?mill|elliptical|stair.?master|stair.?climber|jog|jogging|cycling|spinning|spin class|rowing machine|row machine|\berg\b|sprints?|jump.?rope|skipping rope|swim|swimming|hike|hiking)\b/,_s={Quadriceps:"Legs",Hamstrings:"Legs",Adductors:"Legs",Abductors:"Legs",Glutes:"Glutes",Calves:"Calves",Pectorals:"Chest","Anterior Deltoid":"Shoulders","Lateral Deltoid":"Shoulders","Posterior Deltoid":"Shoulders",Lats:"Back","Upper Back":"Back",Traps:"Back","Lower Back":"Back",Biceps:"Biceps",Triceps:"Triceps",Forearms:"Forearms",Abs:"Core",Obliques:"Core"};function qt(e){let t=(e||"").toLowerCase().trim();if(!t)return"Full Body";if(Ys.test(t))return"Cardio";let s=j({name:t,category:""});return _s[s]||"Full Body"}async function Pt(){if((await P("exercises")).length>0)return 0;let t=Date.now(),s=Us.map(([n,o,i])=>({id:_(),name:n,category:o,equipment:i,notes:"",isCustom:!1,createdAt:t}));return await re("exercises",s),s.length}var Ht="workout";function Ot(e){Ht!==e&&(Ht=e,F("tab:changed",e))}var V=["Chest Day","Leg Day","Back/Bi Day"],Oe={"Chest Day":{key:"chest",short:"Chest",cssVar:"--day-chest"},"Leg Day":{key:"leg",short:"Legs",cssVar:"--day-leg"},"Back/Bi Day":{key:"back",short:"Back/Bi",cssVar:"--day-back"}};function Re(e){let t=Oe[e];return t?`var(${t.cssVar})`:"var(--text-tertiary)"}function et(e){if(!e)return null;let t=e.toLowerCase();return t.includes("chest")?"Chest Day":t.includes("leg")&&!t.includes("curl")&&!t.includes("extension")?"Leg Day":t.includes("back")||t.includes("pull")?"Back/Bi Day":t.includes("push")?"Chest Day":null}function tt(e){for(let t of e){let s=et(t.name);if(s)return{name:t.name,normalized:s,startedAt:t.startedAt}}return null}function We(e){let t=V.indexOf(e);return t===-1?V[0]:V[(t+1)%V.length]}var Ks={Pectorals:"#ec4899",Triceps:"#be185d","Anterior Deltoid":"#831843","Lateral Deltoid":"#f9a8d4",Quadriceps:"#facc15",Hamstrings:"#b45309",Glutes:"#f59e0b",Calves:"#fde68a",Adductors:"#bdb76b",Abductors:"#78350f",Lats:"#2563eb","Upper Back":"#38bdf8",Biceps:"#1e40af","Posterior Deltoid":"#bfdbfe",Traps:"#0891b2","Lower Back":"#475569",Forearms:"#22c55e",Abs:"#ef4444",Obliques:"#14b8a6",Other:"#6b7280"};function Rt(e){return Ks[e]??"#6b7280"}var Gs={Pectorals:"Chest Day",Triceps:"Chest Day","Anterior Deltoid":"Chest Day","Lateral Deltoid":"Chest Day",Quadriceps:"Leg Day",Hamstrings:"Leg Day",Glutes:"Leg Day",Calves:"Leg Day",Adductors:"Leg Day",Abductors:"Leg Day",Lats:"Back/Bi Day","Upper Back":"Back/Bi Day",Biceps:"Back/Bi Day","Posterior Deltoid":"Back/Bi Day",Traps:"Back/Bi Day","Lower Back":"Back/Bi Day",Forearms:"Back/Bi Day"};function Xs(e){return Gs[e]??null}function Qs(e,t,s){let n=et(e);if(n)return n;let o=new Map;for(let a of t){let c=s.get(a.exerciseId);if(!c)continue;let p=Xs(j(c));if(!p)continue;let w=(a.weight||0)*(a.reps||0);w<=0||o.set(p,(o.get(p)??0)+w)}let i=null,r=0;for(let[a,c]of o)c>r&&(i=a,r=c);return i}function Wt(e,t,s){let n=[...e].sort((r,a)=>r.startedAt-a.startedAt),o=new Map,i=null;for(let r of n){let a=Qs(r.name,t.get(r.id)??[],s);a||(i?Nt(i.startedAt,r.startedAt)?a=i.day:a=We(i.day):a=V[0]),o.set(r.id,a),i={day:a,startedAt:r.startedAt}}return o}function Ft(e){let t=parseInt(e.slice(1),16);return((t>>16&255)*299+(t>>8&255)*587+(t&255)*114)/1e3>=150?"#1c1c1e":"#ffffff"}function Nt(e,t){let s=new Date(e),n=new Date(t);return s.getFullYear()===n.getFullYear()&&s.getMonth()===n.getMonth()&&s.getDate()===n.getDate()}function Js(e,t){let s=et(t?.name);if(s)return s;let n=tt(e);return n?Nt(n.startedAt,Date.now())?n.normalized:We(n.normalized):V[0]}var Zs="lift-today-day";async function de(){try{let[e,t]=await Promise.all([oe(),ae()]),s=Js(e,t),n=Oe[s].key;document.documentElement.dataset.day!==n&&(document.documentElement.dataset.day=n);try{localStorage.setItem(Zs,n)}catch{}return s}catch{return null}}var jt="lift-migrations-done-v3";async function st(){let e=await Et();e.exercises>0&&console.info(`Removed ${e.exercises} cardio exercise(s), ${e.sets} set(s), ${e.workouts} cardio-only workout(s).`);let t=await Lt(qt);if(t.recategorized>0||t.deleted>0){console.info(`Reorganized "Other": recategorized ${t.recategorized}, removed ${t.deleted} cardio, dropped ${t.workouts} empty workout(s).`);let r=[];t.recategorized>0&&r.push(`sorted ${t.recategorized} exercise${t.recategorized===1?"":"s"}`),t.deleted>0&&r.push(`removed ${t.deleted} cardio`),R(`Cleaned up \u201COther\u201D: ${r.join(", ")}.`)}let s=await Mt();s>0&&console.info(`Stripped equipment from ${s} exercise name(s).`);let n=await $t();n>0&&R(`Merged Butterfly into Chest Fly (${n} sets moved).`);let o=await Dt();o>0&&console.info(`Set a per-dose amount on ${o} medication(s).`);let i=await At();i.length>0&&(console.info(`Moved ${i.length} exercise(s) off "Other" equipment:
  ${i.join(`
  `)}`),R(`Sorted ${i.length} exercise${i.length===1?"":"s"} out of \u201COther\u201D equipment.`))}async function zt(){try{if(localStorage.getItem(jt))return}catch{}await st();try{localStorage.setItem(jt,String(Date.now()))}catch{}}var me="lift-backup-passphrase",Ut=25e4,Vt="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";function nt(e){let t=new Uint8Array(e),s="",n=32768;for(let o=0;o<t.length;o+=n)s+=String.fromCharCode.apply(null,t.subarray(o,o+n));return btoa(s)}var ot=e=>Uint8Array.from(atob(e),t=>t.charCodeAt(0));function Yt(){let t=[...crypto.getRandomValues(new Uint8Array(20))].map(s=>Vt[s%Vt.length]);return[0,5,10,15].map(s=>t.slice(s,s+5).join("")).join("-")}var z=null,it=()=>{try{return localStorage.getItem(me)}catch{return null}},rt=e=>{try{localStorage.setItem(me,e)}catch{}};async function _t(){if(z)return z;let e=it(),t=null;try{t=await yt(me)}catch{}if(z=e||t||Yt(),z!==e&&rt(z),z!==t)try{await Ie(me,z)}catch{}return z}function at(){if(z)return z;let e=it();return e||(e=Yt(),rt(e)),z=e,Ie(me,e).catch(()=>{}),e}function Kt(){return z||it()}function Gt(e){z=e,rt(e),Ie(me,e).catch(()=>{})}async function Xt(e,t){let s=await crypto.subtle.importKey("raw",new TextEncoder().encode(e),"PBKDF2",!1,["deriveKey"]);return crypto.subtle.deriveKey({name:"PBKDF2",hash:"SHA-256",salt:t,iterations:Ut},s,{name:"AES-GCM",length:256},!1,["encrypt","decrypt"])}function Qt(e){return!!e&&e.lift==="encrypted-backup"&&typeof e.data=="string"}async function Jt(e,t){let s=crypto.getRandomValues(new Uint8Array(16)),n=crypto.getRandomValues(new Uint8Array(12)),o=await Xt(t,s),i=new TextEncoder().encode(JSON.stringify(e)),r=await crypto.subtle.encrypt({name:"AES-GCM",iv:n},o,i);return{lift:"encrypted-backup",v:1,exportedAt:new Date().toISOString(),kdf:{name:"PBKDF2",hash:"SHA-256",iterations:Ut,salt:nt(s)},cipher:"AES-GCM",iv:nt(n),data:nt(r)}}async function ct(e,t){let s=ot(e.kdf.salt),n=ot(e.iv),o=await Xt(t,s),i;try{i=await crypto.subtle.decrypt({name:"AES-GCM",iv:n},o,ot(e.data))}catch{throw new Error("Wrong backup password (or the file is damaged).")}return JSON.parse(new TextDecoder().decode(i))}async function en(){let[e,t,s,n,o]=await Promise.all([P("exercises"),P("workouts"),P("sets"),P("stateOfMind"),P("medications")]);return{version:3,exportedAt:new Date().toISOString(),exercises:e,workouts:t,sets:s,stateOfMind:n,medications:o}}function tn(){let e=new Date,t=s=>String(s).padStart(2,"0");return`lift-backup-${e.getFullYear()}${t(e.getMonth()+1)}${t(e.getDate())}-${t(e.getHours())}${t(e.getMinutes())}${t(e.getSeconds())}.json`}async function lt(){let e=await en(),t=at(),s=await Jt(e,t),n=JSON.stringify(s),o=new Blob([n],{type:"application/json"}),i=URL.createObjectURL(o),r=tn(),a=document.createElement("a");return a.href=i,a.download=r,a.style.display="none",document.body.appendChild(a),a.click(),setTimeout(()=>{document.body.removeChild(a),URL.revokeObjectURL(i)},1e3),{filename:r,bytes:o.size,snapshot:e}}async function sn(e){let t=Kt();if(t)try{return await ct(e,t)}catch{}for(let s=0;s<3;s++){let n=prompt("Enter your backup password (saved in your Passwords app):");if(n==null)throw new Error("Restore cancelled.");try{let o=await ct(e,n.trim());return Gt(n.trim()),o}catch(o){if(s===2)throw o;alert("Wrong password \u2014 try again.")}}}async function nn(e){let t=JSON.parse(await e.text()),s=Qt(t)?await sn(t):t;if(!s||!Array.isArray(s.exercises)||!Array.isArray(s.workouts)||!Array.isArray(s.sets))throw new Error("File doesn't look like a Lift backup.");return await bt({exercises:s.exercises,workouts:s.workouts,sets:s.sets,stateOfMind:s.stateOfMind??[],medications:s.medications??[]}),await st(),{exercises:s.exercises.length,workouts:s.workouts.length,sets:s.sets.length,stateOfMind:(s.stateOfMind??[]).length}}function Zt(){let e=at();N({html:`
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
            <div class="stat-value" id="bk-pass" style="font-variant-numeric: tabular-nums; letter-spacing: 0.5px; color: var(--text); -webkit-user-select: all; user-select: all;">${$(e)}</div>
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
    `,onMount(t,s){t.querySelector("#bk-close").addEventListener("click",()=>s()),t.querySelector("#bk-copy").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(e),R("Password copied \u2014 save it in your Passwords app")}catch{R("Copy failed \u2014 long-press the password to select it")}}),t.querySelector("#bk-export").addEventListener("click",async()=>{try{let{filename:o,bytes:i}=await lt();R(`Exported ${o} (${on(i)})`)}catch(o){R(`Export failed: ${o.message}`)}});let n=t.querySelector("#bk-file");t.querySelector("#bk-import").addEventListener("click",()=>{n.value="",n.click()}),n.addEventListener("change",async o=>{let i=o.target.files?.[0];if(i&&confirm("Replace all current data with this backup? This cannot be undone."))try{let r=await nn(i);s(),R(`Restored ${r.workouts} workouts, ${r.exercises} exercises`),F("data:changed")}catch(r){R(`Restore failed: ${r.message}`)}})}})}function on(e){return e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/(1024*1024)).toFixed(1)} MB`}var ss=["Amazed","Excited","Happy","Joyful","Content","Calm","Relieved","Grateful","Hopeful","Confident","Proud","Surprised","Indifferent","Anxious","Stressed","Overwhelmed","Frustrated","Angry","Irritated","Sad","Lonely","Discouraged","Drained","Worried","Embarrassed"],ns=["Health","Fitness","Self-Care","Hobbies","Identity","Community","Family","Friends","Partner","Work","Education","Money","Weather","Tasks"];function rn(e){let t=Number(e);return isFinite(t)?Math.max(-1,Math.min(1,t)):0}async function os({id:e,kind:t,valence:s,labels:n,associations:o,date:i}){let r={id:e||_(),kind:t==="dailyMood"?"dailyMood":"momentaryEmotion",date:i||Date.now(),valence:rn(s),labels:n||[],associations:o||[]};return await W("stateOfMind",r),r}async function is({id:e,nickname:t,form:s,hasSchedule:n,doseAmount:o,doseUnit:i}){let r=(t||"").trim()||"Medication",a=e?await ne("medications",e):null,c=Number(o),p={id:e||_(),nickname:r,isArchived:a?!!a.isArchived:!1,hasSchedule:!!n,doseAmount:c>0?c:1,doseUnit:(i||"").trim(),concept:{identifier:a?.concept?.identifier||"",displayText:a?.concept?.displayText||r,form:(s||"").trim(),rxnorm:a?.concept?.rxnorm||[]}};return await W("medications",p),p}async function dt(e,t){await Te(e,t)}async function ut(){let[e,t]=await Promise.all([P("stateOfMind"),P("medications")]);return e.sort((s,n)=>s.date-n.date),t.sort((s,n)=>(s.nickname||"").localeCompare(n.nickname||"")),{stateOfMind:e,medications:t}}var es=e=>{let t=new Date(e);return`${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`},ts=e=>e.length?e.reduce((t,s)=>t+s,0)/e.length:null;function rs(e,t){let s=new Set(t.map(a=>es(a.startedAt))),n=[],o=[];for(let a of e)(s.has(es(a.date))?n:o).push(a.valence);let i=ts(n),r=ts(o);return{onWorkout:i,offWorkout:r,delta:i!=null&&r!=null?i-r:null,onCount:n.length,offCount:o.length}}var an=e=>new Date(e).toLocaleTimeString(void 0,{hour:"numeric",minute:"2-digit"}),us='<span style="font-size: 24px;">+</span>';async function pt(e,t){let s=()=>pt(e,t);e.setTitle("State of Mind"),e.setBack(t),e.setAction({html:us,onClick:()=>ls(s)});let[{stateOfMind:n},o]=await Promise.all([ut(),oe()]),i=rs(n,o);e.container.innerHTML=`
    ${n.length?`
      <div class="section">Summary</div>
      <div class="form-section">
        <div class="stat-row"><div class="stat-label">Entries</div><div class="stat-value">${n.length.toLocaleString()}</div></div>
        <div class="stat-row"><div class="stat-label">Range</div><div class="stat-value">${Q(n[0].date)} \u2013 ${Q(n[n.length-1].date)}</div></div>
        <div class="stat-row"><div class="stat-label">Average mood</div><div class="stat-value">${Fe(pn(n))}</div></div>
      </div>

      <div class="section">Mood vs. training</div>
      <div class="form-section">
        <div class="stat-row"><div class="stat-label">On workout days</div><div class="stat-value">${i.onWorkout!=null?Fe(i.onWorkout)+` (${i.onCount})`:"\u2014"}</div></div>
        <div class="stat-row"><div class="stat-label">On rest days</div><div class="stat-value">${i.offWorkout!=null?Fe(i.offWorkout)+` (${i.offCount})`:"\u2014"}</div></div>
        <div class="stat-row"><div class="stat-label">Difference</div><div class="stat-value">${i.delta!=null?(i.delta>=0?"+":"")+i.delta.toFixed(2):"\u2014"}</div></div>
      </div>

      <div class="section">Recent entries</div>
      <div class="list">${n.slice(-30).reverse().map(cn).join("")}</div>
    `:fs("","No mood entries","Tap \uFF0B to log how you're feeling.")}
  `,e.container.scrollTop=0;for(let r of e.container.querySelectorAll("[data-edit-som]")){let a=n.find(c=>c.id===r.dataset.editSom);a&&r.addEventListener("click",()=>ls(s,a))}}function cn(e){let t=e.kind==="dailyMood",s=e.labels.length?e.labels.join(", "):t?"Daily mood":"Momentary emotion",n=[...e.labels.length?[t?"Daily mood":"Moment"]:[],Q(e.date),an(e.date),...e.associations.length?[e.associations.join(", ")]:[]].join(" \xB7 ");return`
    <button class="list-row" data-edit-som="${$(e.id)}">
      <div class="row-main">
        <div class="row-title">${$(s)}</div>
        <div class="row-subtitle">${$(n)}</div>
      </div>
      <div class="row-trailing">${Fe(e.valence)}</div>
      <div class="chevron">\u203A</div>
    </button>`}async function ft(e,t){let s=()=>ft(e,t);e.setTitle("Medications"),e.setBack(t),e.setAction({html:us,onClick:()=>ds(s)});let{medications:n}=await ut();e.container.innerHTML=n.length?`
    <div class="section">Daily</div>
    ${as(n.filter(i=>i.hasSchedule))}
    ${as(n.filter(i=>!i.hasSchedule),"As needed")}
    <div class="section-footer">Tap a medication to edit its name, form, or amount.</div>
  `:fs("\u{1F48A}","No medications","Tap \uFF0B to add the medications you take."),e.container.scrollTop=0;let o=new Map(n.map(i=>[i.id,i]));for(let i of e.container.querySelectorAll("[data-edit-med]")){let r=o.get(i.dataset.editMed);r&&i.addEventListener("click",()=>ds(s,r))}}function as(e,t){return e.length===0?"":`
    ${t?`<div class="section">${$(t)}</div>`:""}
    <div class="list">${e.map(ln).join("")}</div>`}function ln(e){let t=dn(e);return`
    <button class="list-row" data-edit-med="${$(e.id)}">
      <div class="row-main">
        <div class="row-title">${$(e.nickname||e.concept.displayText)}</div>
        ${t?`<div class="row-subtitle">${$(t)}</div>`:""}
      </div>
      <div class="chevron">\u203A</div>
    </button>`}function dn(e){let t=ps(e),s=(e.concept?.form||"").trim(),n=(e.doseUnit||"").trim();if(s&&t>1&&n&&s.toLowerCase().includes(n.toLowerCase()))return`${ms(t)} \xD7 ${s}`;if(s&&t===1)return s;let o=un(t,n);return s?`${o} \xB7 ${s}`:o}var ps=e=>Number(e?.doseAmount)>0?Number(e.doseAmount):1;function un(e,t){let s=(t||"").trim()||"dose",n=e===1||/^(mg|mcg|ml|cc|g|kg|l|oz|iu)$/i.test(s)||s.endsWith("s")?s:`${s}s`;return`${ms(e)} ${n}`}function fs(e,t,s){return`
    <div class="empty-state" style="padding: 48px 24px; min-height: auto;">
      ${e?`<div class="empty-icon">${e}</div>`:""}
      <h2>${$(t)}</h2>
      <p>${$(s)}</p>
    </div>`}function pn(e){return e.reduce((t,s)=>t+s.valence,0)/e.length}var ms=e=>Number.isInteger(e)?String(e):String(Number(e.toFixed(3)));function hs(e){return e>=.7?["Very pleasant","#2ba758"]:e>=.4?["Pleasant","#54a85a"]:e>=.1?["Slightly pleasant","#9cad46"]:e>-.1?["Neutral","#8a8a8e"]:e>-.4?["Slightly unpleasant","#d99a3c"]:e>-.7?["Unpleasant","#e07a4e"]:["Very unpleasant","#e0574f"]}function Fe(e){let[t,s]=hs(e);return`<span class="hz-pill" style="--pc: ${s};">${$(t)}</span>`}function vs(e){let t=new Date(e),s=n=>String(n).padStart(2,"0");return`${t.getFullYear()}-${s(t.getMonth()+1)}-${s(t.getDate())}T${s(t.getHours())}:${s(t.getMinutes())}`}var fn=()=>vs(Date.now());function mn(e){let t=e?new Date(e).getTime():NaN;return isFinite(t)?t:Date.now()}var hn=e=>Math.max(-3,Math.min(3,Math.round(e*3)));function cs(e,t=[]){return e.map(s=>`<button type="button" class="chip${t.includes(s)?" active":""}" data-chip="${$(s)}">${$(s)}</button>`).join("")}function Ne(e,t,s={}){for(let n of e.querySelectorAll(`${t} .chip`))n.addEventListener("click",()=>{s.single&&e.querySelectorAll(`${t} .chip`).forEach(o=>o.classList.remove("active")),n.classList.toggle("active",s.single?!0:!n.classList.contains("active"))})}var je=(e,t)=>[...e.querySelectorAll(`${t} .chip.active`)].map(s=>s.dataset.chip);function ls(e,t=null){let s=!!t,n=s&&t.kind==="dailyMood",o=s?hn(t.valence):1,i=s?t.valence:o/3,r=N({html:`
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
        <div class="chip-row" id="som-emotions" style="flex-wrap: wrap;">${cs(ss,s?t.labels:[])}</div>
        <div class="section">What's affecting you? (optional)</div>
        <div class="chip-row" id="som-assoc" style="flex-wrap: wrap;">${cs(ns,s?t.associations:[])}</div>
        <div class="section">When</div>
        <div class="form-section">
          <div class="form-row"><input type="datetime-local" id="som-date" value="${s?vs(t.date):fn()}" style="text-align: left;" /></div>
        </div>
        ${s?`
        <div style="height: 8px;"></div>
        <div class="form-section">
          <button class="list-row button destructive" id="som-delete"><div class="row-main"><div class="row-title" style="color: var(--red);">Delete Entry</div></div></button>
        </div>`:""}
        <div style="height: 16px;"></div>
      </div>
    `,onMount(a){let c=a.querySelector("#som-val"),p=a.querySelector("#som-val-label"),w=()=>{p.textContent=hs(Number(c.value)/3)[0]};w(),c.addEventListener("input",()=>{i=Number(c.value)/3,w()}),Ne(a,"#som-kind",{single:!0}),Ne(a,"#som-emotions"),Ne(a,"#som-assoc"),a.querySelector("#som-cancel").addEventListener("click",()=>r()),a.querySelector("#som-save").addEventListener("click",async()=>{await os({id:t?.id,kind:je(a,"#som-kind")[0]||"momentaryEmotion",valence:i,labels:je(a,"#som-emotions"),associations:je(a,"#som-assoc"),date:mn(a.querySelector("#som-date").value)}),r(),R(s?"Entry updated":"Logged State of Mind"),e?.()}),a.querySelector("#som-delete")?.addEventListener("click",async()=>{confirm("Delete this entry?")&&(await dt("stateOfMind",t.id),r(),R("Entry deleted"),e?.())})}})}function ds(e,t=null){let s=!!t,n=s?!!t.hasSchedule:!0,o=N({html:`
      <div class="sheet-header">
        <button class="btn-text" id="med-cancel">Cancel</button>
        <div class="title">${s?"Edit Medication":"Add Medication"}</div>
        <button class="btn-text primary" id="med-save"${s?"":" disabled"}>Save</button>
      </div>
      <div class="sheet-content">
        <div class="section">Name</div>
        <div class="form-section">
          <div class="form-row"><input id="med-name" placeholder="e.g. Sertraline" value="${s?$(t.nickname||t.concept.displayText):""}" style="text-align: left;" /></div>
        </div>
        <div class="section">Form (optional)</div>
        <div class="form-section">
          <div class="form-row"><input id="med-form" placeholder="e.g. tablet, 50 mg" value="${s?$(t.concept?.form||""):""}" style="text-align: left;" /></div>
        </div>
        <div class="section">Amount per dose</div>
        <div class="form-section">
          <div class="form-row"><input type="number" id="med-amount" inputmode="decimal" min="0" step="0.25" value="${s?$(String(ps(t))):"1"}" style="text-align: left;" /></div>
          <div class="form-row"><input id="med-unit" placeholder="unit \u2014 e.g. capsule, tablet, mg" value="${s?$(t.doseUnit||""):""}" style="text-align: left;" /></div>
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
    `,onMount(i){let r=i.querySelector("#med-name"),a=i.querySelector("#med-save");r.addEventListener("input",()=>{a.disabled=r.value.trim().length===0}),Ne(i,"#med-type",{single:!0}),i.querySelector("#med-cancel").addEventListener("click",()=>o()),a.addEventListener("click",async()=>{r.value.trim()&&(await is({id:t?.id,nickname:r.value,form:i.querySelector("#med-form").value,hasSchedule:(je(i,"#med-type")[0]||"daily")==="daily",doseAmount:i.querySelector("#med-amount").value,doseUnit:i.querySelector("#med-unit").value}),o(),R(s?"Medication updated":"Medication added"),e?.())}),i.querySelector("#med-delete")?.addEventListener("click",async()=>{confirm("Delete this medication?")&&(await dt("medications",t.id),o(),R("Medication deleted"),e?.())}),s||setTimeout(()=>r.focus(),50)}})}var ke=[{key:"1W",tick:"1W",days:7},{key:"1M",tick:"1M",days:30},{key:"3M",tick:"3M",days:90},{key:"1Y",tick:"1Y",days:365},{key:"All",tick:"All",all:!0}];function vn(e){let t=new Map;for(let s of e){let n=new Date(s.date),o=`${n.getFullYear()}-${n.getMonth()}-${n.getDate()}`,i=t.get(o)||{date:s.date,total:0,count:0};i.total+=s.value,i.count+=1,i.date=Math.min(i.date,s.date),t.set(o,i)}return[...t.values()].map(s=>({date:s.date,value:s.total/s.count})).sort((s,n)=>s.date-n.date)}function Se(e,t,s={}){let n=t.length>0&&t[0].points!==void 0,o=(n?t:[{points:t}]).map(g=>({label:g.label??"",color:g.color||"var(--accent)",dashed:!!g.dashed,points:vn(g.points)})).filter(g=>g.points.length>0),i=s.defaultPeriod||"All",r=Math.max(0,ke.findIndex(g=>g.key===i)),a=ke.length-1,c=s.isolated==null?-1:o.findIndex(g=>g.label===s.isolated);c===-1&&(c=null);let p=()=>s.onStateChange?.({period:ke[r].key,isolated:c===null?null:o[c].label});function w(){let g=ke[r],y=o.map((L,q)=>c===null||q===c?L.points:[]);if(g.all)return y;let S=Date.now()-g.days*864e5,T=y.map(L=>L.filter(q=>q.date>=S));return T.every(L=>L.length===0)?y.map(L=>L.slice(-1)):T}let D=n&&o.some(g=>g.label)?`<div class="chart-legend">${o.map((g,y)=>`<button class="legend-item${g.dashed?" legend-dashed":""}${c!==null&&y!==c?" dimmed":""}" data-i="${y}" style="--dcolor: ${g.color};" aria-pressed="${c===y}">${g.label}</button>`).join("")}</div>`:"";e.innerHTML=`
    <div class="chart-scrub-readout" data-role="scrub"></div>
    ${D}
    <div class="chart-container" data-role="chart"></div>
    <div class="chart-daterange" data-role="range"></div>
    <div class="chart-slider">
      <input type="range" class="chart-range" min="0" max="${a}" step="1"
             value="${r}" aria-label="Time range" />
      <div class="chart-slider-ticks">
        ${ke.map((g,y)=>`<span data-i="${y}">${g.tick}</span>`).join("")}
      </div>
    </div>
  `;let d=e.querySelector('[data-role="scrub"]'),l=e.querySelector('[data-role="chart"]'),A=e.querySelector('[data-role="range"]'),b=e.querySelector(".chart-range"),h=[...e.querySelectorAll(".chart-slider-ticks span")],u=s.unit||"lbs",v=s.format?{value:s.format,axis:s.axisFormat||s.format}:{value:g=>`${Math.round(g).toLocaleString()} ${u}`,axis:g=>Math.round(g).toLocaleString()},k=null;function m(){let g=w(),y=gn(g,o,v,c!==null);l.innerHTML=y.html,k=y.geom;let S=g.flat();if(S.length>=2){let T=Math.min(...S.map(q=>q.date)),L=Math.max(...S.map(q=>q.date));A.innerHTML=`<span>${mt(T)}</span><span>${mt(L)}</span>`}else A.innerHTML="";h.forEach((T,L)=>T.classList.toggle("active",L===r))}b.addEventListener("input",()=>{r=Number(b.value),x(),m(),p()});let C=[...e.querySelectorAll(".chart-legend .legend-item")];for(let g of C)g.addEventListener("click",()=>{let y=Number(g.dataset.i);c=c===y?null:y,C.forEach((S,T)=>{S.classList.toggle("dimmed",c!==null&&T!==c),S.setAttribute("aria-pressed",String(c===T))}),x(),m(),p()});function I(g){if(!k||k.pts.length<2)return;let y=l.querySelector("svg"),S=y?.getScreenCTM();if(!S)return;let T=new DOMPoint(g,0).matrixTransform(S.inverse()).x,L=0,q=1/0;k.pts.forEach((O,Y)=>{let te=Math.abs(O.x-T);te<q&&(q=te,L=Y)});let f=k.pts[L],E=y.querySelector(".chart-scrub-line"),B=y.querySelector(".chart-scrub-dot");E&&(E.setAttribute("x1",f.x),E.setAttribute("x2",f.x),E.removeAttribute("visibility")),B&&(B.setAttribute("cx",f.x),B.setAttribute("cy",f.y),B.style.fill=f.color,B.removeAttribute("visibility"));let H=f.label?` \xB7 ${f.label}`:"";d.textContent=`${mt(f.date)}${H} \xB7 ${v.value(f.value)}`}function x(){d.textContent="";let g=l.querySelector("svg");g?.querySelector(".chart-scrub-line")?.setAttribute("visibility","hidden"),g?.querySelector(".chart-scrub-dot")?.setAttribute("visibility","hidden")}let M=!1;l.addEventListener("pointerdown",g=>{M=!0,l.setPointerCapture?.(g.pointerId),I(g.clientX)}),l.addEventListener("pointermove",g=>{M&&I(g.clientX)});for(let g of["pointerup","pointercancel"])l.addEventListener(g,()=>{M=!1,x()});m()}function mt(e){return new Date(e).toLocaleDateString(void 0,{month:"short",day:"numeric",year:"numeric"})}function gn(e,t,s,n){let r={top:16,right:14,bottom:14,left:52},a=400-r.left-r.right,c=200-r.top-r.bottom,p=e.flat();if(p.length===0)return{html:`<svg viewBox="0 0 400 200"><text x="${400/2}" y="${200/2}" text-anchor="middle" class="chart-axis-label">No data in range</text></svg>`,geom:null};if(p.length===1){let S=p[0],T=t[e.findIndex(f=>f.length>0)]?.color||"var(--accent)",L=r.left+a/2,q=r.top+c/2;return{html:`<svg viewBox="0 0 400 200"><circle cx="${L}" cy="${q}" r="4" class="chart-point" style="fill: ${T};"/><text x="${L}" y="${q-10}" text-anchor="middle" class="chart-axis-label">${s.value(S.value)}</text></svg>`,geom:null}}let w=p.map(S=>S.date),D=p.map(S=>S.value),d=Math.min(...w),l=Math.max(...w),A=Math.max(...D),b=Math.min(...D),h=Math.max(A-b,1),u=b>=0?Math.max(0,b-h*.12):b-h*.12,v=A+h*.12,k=S=>r.left+(S-d)/Math.max(l-d,1)*a,m=S=>r.top+c-(S-u)/(v-u)*c,C=4,I=Array.from({length:C+1},(S,T)=>{let L=u+(v-u)*T/C,q=m(L);return`<text x="${r.left-6}" y="${q+3}" text-anchor="end" class="chart-axis-label">${s.axis(L,v-u)}</text>`}).join(""),x=Array.from({length:C+1},(S,T)=>{let L=r.top+c*T/C;return`<line x1="${r.left}" x2="${400-r.right}" y1="${L}" y2="${L}" class="chart-axis-line"/>`}).join(""),M=[],g=e.map((S,T)=>{let L=t[T],q=S.map(E=>({x:k(E.date),y:m(E.value)}));if(S.forEach((E,B)=>M.push({...q[B],date:E.date,value:E.value,label:L.label,color:L.color})),q.length===0)return"";if(q.length===1)return`<circle cx="${q[0].x}" cy="${q[0].y}" r="3.5" class="chart-point" style="fill: ${L.color};"/>`;let f=L.dashed&&!n?" chart-line-dashed":"";return`<path d="${wn(q)}" class="chart-line${f}" style="stroke: ${L.color};"/>`}).join("");return{html:`
    <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet">
      ${x}
      ${I}
      ${g}
      <line class="chart-scrub-line" y1="${r.top}" y2="${r.top+c}" x1="0" x2="0" visibility="hidden"/>
      <circle class="chart-scrub-dot" r="4.5" visibility="hidden"/>
    </svg>
  `,geom:{pts:M}}}function wn(e){if(e.length<2)return"";let t=`M ${e[0].x.toFixed(1)} ${e[0].y.toFixed(1)}`;for(let s=0;s<e.length-1;s++){let n=e[s===0?0:s-1],o=e[s],i=e[s+1],r=e[s+2]||i,a=o.x+(i.x-n.x)/6,c=o.y+(i.y-n.y)/6,p=i.x-(r.x-o.x)/6,w=i.y-(r.y-o.y)/6;t+=` C ${a.toFixed(1)} ${c.toFixed(1)}, ${p.toFixed(1)} ${w.toFixed(1)}, ${i.x.toFixed(1)} ${i.y.toFixed(1)}`}return t}var Z=null,ht={volume:{chip:"Volume",title:"Workout Volume",key:"volumeSeries",opts:{unit:"lbs"}},strength:{chip:"Strength %",title:"Strength Change",key:"strengthSeries",opts:{format:yn,axisFormat:bn}}},K={mode:"strength",period:"All",isolated:"Avg"};function yn(e){return ys(Math.abs(e)<10?Math.round(e*10)/10:Math.round(e))}function bn(e,t){return ys(t<8?Math.round(e*10)/10:Math.round(e))}function ys(e){return`${e>0?"+":""}${e}%`}function bs(e){let t=!0;return xs().then(s=>{t&&(Z=s,$e(e))}).catch(s=>{t&&(e.container.innerHTML=ie(s))}),()=>{t=!1}}async function xs(){let[e,t,s]=await Promise.all([oe(),P("sets"),P("exercises")]),n=new Map(s.map(u=>[u.id,u])),o=new Map;for(let u of G(t))o.has(u.workoutId)||o.set(u.workoutId,[]),o.get(u.workoutId).push(u);let i=0,r=0,a=new Map,c=new Map,p=new Map,w=new Map,D=Wt(e,o,n);for(let u of e){let v=o.get(u.id)||[],k=v.reduce((m,C)=>m+C.weight*C.reps,0);if(i+=k,r+=v.length,k>0){let m=D.get(u.id);a.has(m)||a.set(m,[]),a.get(m).push({date:u.startedAt,value:k})}for(let m of v){let C=n.get(m.exerciseId);if(!C)continue;let I=p.get(m.exerciseId)||{id:m.exerciseId,exercise:C,count:0};if(I.count+=1,p.set(m.exerciseId,I),m.weight>0&&m.reps>0){let x=w.get(m.exerciseId);(!x||m.weight>x.weight||m.weight===x.weight&&m.reps>x.reps)&&w.set(m.exerciseId,{id:m.exerciseId,weight:m.weight,reps:m.reps,date:u.startedAt,name:J(C)})}}}let d=new Map;for(let u=e.length-1;u>=0;u--){let v=e[u],k=kn(o.get(v.id)||[]),m=[];for(let[I,x]of k){let M=d.get(I);M===void 0?d.set(I,x):m.push((x/M-1)*100)}if(m.length===0)continue;let C=D.get(v.id);c.has(C)||c.set(C,[]),c.get(C).push({date:v.startedAt,value:m.reduce((I,x)=>I+x,0)/m.length})}let l=Array.from(p.entries()).sort((u,v)=>v[1].count-u[1].count).map(([,u])=>u),A=Array.from(w.values()).sort((u,v)=>v.weight-u.weight),b=gs(a),h=gs(c);return{workouts:e,allSets:t,allExercises:s,exMap:n,setsByWorkout:o,totalVolume:i,totalSets:r,volumeSeries:b,strengthSeries:h,topExercises:l,prs:A}}function xn(e,t){return e*(1+t/30)}function kn(e){let t=new Map;for(let s of e){if(s.weight<=0||s.reps<=0||(s.setType||"working")==="warmup")continue;let n=xn(s.weight,s.reps);n>(t.get(s.exerciseId)??0)&&t.set(s.exerciseId,n)}return t}function gs(e){let t=V.filter(o=>e.has(o)).map(o=>({label:Oe[o].short,color:Re(o),points:e.get(o)}));if(t.length===0)return t;let s=[...e.values()].flat().sort((o,i)=>o.date-i.date),n=Math.min(V.length,s.length);return t.push({label:"Avg",color:"var(--day-avg)",dashed:!0,points:s.slice(n-1).map((o,i)=>{let r=s.slice(i,i+n);return{date:o.date,value:r.reduce((a,c)=>a+c.value,0)/n}})}),t}function $e(e){e.setTitle("Progress"),e.setBack(null),e.setAction({label:"Backup and restore",html:It(),onClick:()=>Zt()}),e.container.scrollTop=0;let t=`
    <button class="list-row" data-page="meds">
      <div class="row-main"><div class="row-title">Medications</div></div>
      <div class="chevron">\u203A</div>
    </button>`;if(!Z||Z.workouts.length===0){e.container.innerHTML=`
      <div class="empty-state" style="padding: 48px 24px; min-height: auto;">
        <h2>No data yet</h2>
        <p>Finish a workout and your stats and trends will show up here.</p>
      </div>
      <div class="list">${t}</div>
    `,ws(e);return}let{workouts:s,totalVolume:n,totalSets:o,volumeSeries:i,topExercises:r,prs:a}=Z,c=ht[K.mode];e.container.innerHTML=`
    <div class="section">Totals</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Total Volume</div><div class="stat-value">${fe(n)}</div></div>
      <div class="stat-row"><div class="stat-label">Total Sets</div><div class="stat-value">${o.toLocaleString()}</div></div>
    </div>

    ${i.length>0?`
      <div class="section" data-role="chart-title">${c.title}</div>
      <div class="chip-row chart-mode-row">
        ${Object.entries(ht).map(([w,D])=>`<button type="button" class="chip${w===K.mode?" active":""}" data-mode="${w}">${D.chip}</button>`).join("")}
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
  `;let p=e.container.querySelector(".volume-chart-mount");if(p&&i.length>0){let w=e.container.querySelector('[data-role="chart-title"]'),D=[...e.container.querySelectorAll(".chart-mode-row .chip")],d=()=>{let l=ht[K.mode],A=Z[l.key];if(w.textContent=l.title,D.forEach(b=>b.classList.toggle("active",b.dataset.mode===K.mode)),A.length===0){p.innerHTML=`<p class="chart-empty">Log an exercise a second time to see how it's changed.</p>`;return}Se(p,A,{...l.opts,defaultPeriod:K.period,isolated:K.isolated,onStateChange:({period:b,isolated:h})=>{K.period=b,K.isolated=h}})};for(let l of D)l.addEventListener("click",()=>{l.dataset.mode!==K.mode&&(K.mode=l.dataset.mode,d())});d()}ws(e)}function ws(e){for(let t of e.container.querySelectorAll("[data-page]"))t.addEventListener("click",()=>{let s=t.dataset.page;s==="trained"?Sn(e):s==="prs"?$n(e):s==="history"?ks(e):s==="meds"&&ft(e,()=>$e(e))})}function Sn(e){e.setTitle("Most-Trained"),e.setBack(()=>$e(e)),e.setAction(null);let{topExercises:t}=Z;e.container.innerHTML=`
    <div class="list" style="margin-top: 16px;">
      ${t.map(s=>`
        <button class="list-row" data-exercise-id="${$(s.id)}">
          ${ce(s.exercise)}
          <div class="row-trailing trailing-stack">${le(s.count)}</div>
          <div class="chevron">\u203A</div>
        </button>
      `).join("")}
    </div>
  `,e.container.scrollTop=0,vt(e)}function $n(e){e.setTitle("Personal Records"),e.setBack(()=>$e(e)),e.setAction(null);let{prs:t}=Z;e.container.innerHTML=`
    <div class="section-footer" style="margin-top: 16px;">Heaviest set ever recorded per exercise.</div>
    <div class="list">
      ${t.map(s=>`
        <button class="list-row" data-exercise-id="${$(s.id)}" style="align-items: flex-start;">
          <div class="row-main">
            <div class="row-title">${$(s.name)}</div>
            <div class="row-subtitle">${Q(s.date)}</div>
          </div>
          <div class="row-trailing" style="text-align: right;">
            <div style="font-weight: 600; color: var(--text);">${be(s.weight)}</div>
            <div style="font-size: 12px; color: var(--text-tertiary);">${s.reps} rep${s.reps===1?"":"s"}</div>
          </div>
          <div class="chevron">\u203A</div>
        </button>
      `).join("")}
    </div>
  `,e.container.scrollTop=0,vt(e)}function vt(e){for(let t of e.container.querySelectorAll("[data-exercise-id]"))t.addEventListener("click",()=>{ze(t.dataset.exerciseId)})}function ks(e){e.setTitle("Workout History"),e.setBack(()=>$e(e)),e.setAction(null);let{workouts:t,setsByWorkout:s,exMap:n}=Z;e.container.innerHTML=`
    <div class="list" style="margin-top: 16px;">
      ${t.map(o=>Mn(o,s.get(o.id)||[],n)).join("")}
    </div>
  `,e.container.scrollTop=0;for(let o of e.container.querySelectorAll("[data-workout-id]"))o.addEventListener("click",()=>{let i=o.dataset.workoutId;En(e,i).catch(r=>{e.container.innerHTML=ie(r)})})}function Mn(e,t,s){let n=t,o=n.reduce((c,p)=>c+p.weight*p.reps,0),i=(e.endedAt-e.startedAt)/1e3,r=[],a=new Set;for(let c of t){if(a.has(c.exerciseId))continue;a.add(c.exerciseId);let p=s.get(c.exerciseId);if(p&&r.push(p.name),r.length>=3)break}return`
    <button class="list-row" data-workout-id="${e.id}">
      <div class="row-main">
        <div class="row-title" style="font-weight: 600;">${$(e.name)}</div>
        <div class="row-subtitle" style="margin-top: 4px;">
          ${Q(e.startedAt)} \xB7 ${Qe(i)} \xB7 ${n.length} sets \xB7 ${fe(o)}
        </div>
        ${r.length>0?`<div class="row-subtitle" style="margin-top: 4px;">${$(r.join(" \xB7 "))}${a.size>3?" \u2026":""}</div>`:""}
      </div>
      <div class="chevron">\u203A</div>
    </button>
  `}async function Ss(e){let[t,s,n]=await Promise.all([ne("workouts",e),P("exercises"),xt(e)]);if(!t)return null;let o=new Map(s.map(d=>[d.id,d])),i=new Map,r=[];for(let d of n)i.has(d.exerciseId)||(i.set(d.exerciseId,[]),r.push(d.exerciseId)),i.get(d.exerciseId).push(d);let a=G(n),c=a.reduce((d,l)=>d+l.weight*l.reps,0),p=a.length,w=(t.endedAt-t.startedAt)/1e3,D=`
    <div class="section">Summary</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Date</div><div class="stat-value">${Tt(t.startedAt)}</div></div>
      <div class="stat-row"><div class="stat-label">Duration</div><div class="stat-value">${Qe(w)}</div></div>
      <div class="stat-row"><div class="stat-label">Total Volume</div><div class="stat-value">${fe(c)}</div></div>
      <div class="stat-row"><div class="stat-label">Completed Sets</div><div class="stat-value">${p}</div></div>
    </div>

    ${r.map(d=>{let l=o.get(d),A=i.get(d),b=0,h=0;return`
        ${l?`<button class="section section-link" data-exercise-id="${$(d)}">${$(J(l))}<span class="name-chevron">\u203A</span></button>`:'<div class="section">Unknown exercise</div>'}
        <div class="form-section">
          ${A.map(v=>{let m=(v.setType||"working")==="warmup"?`W${++h}`:String(++b);return`
              <div class="stat-row">
                <div class="stat-label">Set ${m}</div>
                <div class="stat-value hist-edit">
                  <input class="hist-input" type="number" inputmode="decimal" step="0.5" aria-label="Weight in pounds for set ${m}"
                         data-set-id="${v.id}" data-field="weight" value="${v.weight>0?v.weight:""}" placeholder="0" />
                  <span>lbs \xD7</span>
                  <input class="hist-input" type="number" inputmode="numeric" step="1" aria-label="Repetitions for set ${m}"
                         data-set-id="${v.id}" data-field="reps" value="${v.reps>0?v.reps:""}" placeholder="0" />
                </div>
              </div>
            `}).join("")}
        </div>
      `}).join("")}
  `;return{workout:t,html:D,sets:n}}function $s(e,t){for(let s of e.querySelectorAll("input.hist-input[data-set-id]"))s.addEventListener("input",async()=>{let n=t.find(o=>o.id===s.dataset.setId);n&&(s.dataset.field==="weight"?n.weight=parseFloat(s.value)||0:n.reps=parseInt(s.value,10)||0,await W("sets",{...n}))})}async function En(e,t){e.setBack(async()=>{Z=await xs(),ks(e)}),e.setAction({label:"Delete workout",html:qe(),onClick:async()=>{confirm("Delete this workout?")&&(await we(t),F("data:changed"))}});let s=await Ss(t);if(!s){e.container.innerHTML=ie({message:"Workout not found."});return}e.setTitle(s.workout.name),e.container.innerHTML=s.html,e.container.scrollTop=0,vt(e),$s(e.container,s.sets)}async function Ms(e){let t=await Ss(e);if(!t)return;let s=N({html:`
      <div class="sheet-header">
        <button class="btn-text" id="wd-close">Done</button>
        <div class="title">${$(t.workout.name)}</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">${t.html}</div>
    `,onMount(n){n.querySelector("#wd-close").addEventListener("click",()=>s());for(let o of n.querySelectorAll("[data-exercise-id]"))o.addEventListener("click",()=>ze(o.dataset.exerciseId));$s(n,t.sets)}})}function Es(e){let t=!0;return Ls(e).catch(s=>{t&&(e.container.innerHTML=ie(s))}),()=>{t=!1}}async function Ls(e){e.setTitle("Exercises"),e.setBack(null),e.setAction({label:"Add exercise",html:'<span style="font-size: 24px;">+</span>',onClick:()=>{Me(null)}});let[t,s]=await Promise.all([P("exercises"),P("sets")]),n=t.sort((d,l)=>d.name.localeCompare(l.name)),o=new Map;for(let d of s)o.set(d.exerciseId,(o.get(d.exerciseId)??0)+1);let i="",r=null;e.container.innerHTML=`
    <div class="search-bar">
      <input class="search-input" id="ex-search" placeholder="Search exercises" />
    </div>
    <div class="chip-row" id="ex-chips"></div>
    <div class="list" id="ex-list"></div>
  `,e.container.scrollTop=0;let a=e.container.querySelector("#ex-list"),c=e.container.querySelector("#ex-chips"),p=e.container.querySelector("#ex-search");function w(){c.innerHTML=He(n,r);for(let d of c.querySelectorAll(".chip"))d.addEventListener("click",()=>{let l=d.dataset.cat;r=l==="All"?null:l,w(),D()})}function D(){let d=n.filter(l=>!r||j(l)===r).filter(l=>!i||l.name.toLowerCase().includes(i.toLowerCase()));if(d.length===0){a.innerHTML='<div class="list-row"><div class="row-main" style="color: var(--text-secondary);">No matches</div></div>';return}a.innerHTML=d.map(l=>`
        <button class="list-row" data-id="${l.id}">
          ${ce(l)}
          <div class="row-trailing trailing-stack">${le(o.get(l.id)??0)}</div>
          <div class="chevron">\u203A</div>
        </button>
      `).join("");for(let l of a.querySelectorAll("[data-id]"))l.addEventListener("click",()=>{Ln(e,l.dataset.id).catch(A=>{e.container.innerHTML=ie(A)})})}p.addEventListener("input",()=>{i=p.value,D()}),w(),D()}function Ln(e,t){return Ve(e,t,()=>Ls(e))}async function Ve(e,t,s){e.setBack(s);let n=await As(t);if(!n){e.container.innerHTML=ie({message:"Exercise not found."});return}e.setTitle(J(n.exercise)),e.setAction(n.exercise.isCustom?{label:"Delete exercise",html:qe(),onClick:async()=>{if(n.completed.length>0){alert(`Can't delete \u2014 this exercise has ${n.completed.length} logged set${n.completed.length===1?"":"s"}.`);return}let i=await ae(),r=await Ge(t);if(i&&r.some(a=>a.workoutId===i.id)){alert("This exercise is in your current workout. Remove it there first.");return}confirm("Delete this custom exercise?")&&(await Bt(t),F("data:changed"))}}:null),e.container.innerHTML=n.html,e.container.scrollTop=0,e.container.querySelector("#exd-edit")?.addEventListener("click",()=>{Me(n.exercise,()=>Ve(e,t,s))}),Ds(e.container);let o=e.container.querySelector(".exercise-chart-mount");o&&n.chartData.length>0&&Se(o,n.chartData,{unit:"lbs"})}function Ds(e){for(let t of e.querySelectorAll(".recent-set[data-workout-id]"))t.addEventListener("click",()=>Ms(t.dataset.workoutId))}async function ze(e){let t=await As(e);if(!t)return;let s=N({html:`
      <div class="sheet-header">
        <button class="btn-text" id="exd-close">Done</button>
        <div class="title">${$(J(t.exercise))}</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">${t.html}</div>
    `,onMount(n){n.querySelector("#exd-close").addEventListener("click",()=>s()),n.querySelector("#exd-edit")?.addEventListener("click",()=>{Me(t.exercise,()=>{s(),F("data:changed"),ze(e)})}),Ds(n);let o=n.querySelector(".exercise-chart-mount");o&&t.chartData.length>0&&Se(o,t.chartData,{unit:"lbs"})}})}async function As(e){let[t,s,n,o]=await Promise.all([ne("exercises",e),P("sets"),P("workouts"),ae()]);if(!t)return null;let i=new Map(n.map(d=>[d.id,d])),r=G(s).filter(d=>d.exerciseId===e&&d.workoutId!==o?.id&&i.has(d.workoutId)).map(d=>({...d,workout:i.get(d.workoutId)})).sort((d,l)=>d.workout.startedAt-l.workout.startedAt),a=r.reduce((d,l)=>d+l.weight*l.reps,0),c=r.reduce((d,l)=>!d||l.weight>d.weight||l.weight===d.weight&&l.reps>d.reps?l:d,null),p=new Map;for(let d of r){if(d.weight<=0||d.reps<=0||(d.setType||"working")==="warmup")continue;let l=p.get(d.workoutId)||{date:d.workout.startedAt,total:0,count:0};l.total+=d.weight*d.reps,l.count+=1,p.set(d.workoutId,l)}let w=Array.from(p.values()).map(({date:d,total:l,count:A})=>({date:d,value:l/A})).sort((d,l)=>d.date-l.date),D=`
    <div class="section">Details</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Equipment</div><div class="stat-value">${$(t.equipment)}</div></div>
      <div class="stat-row"><div class="stat-label">Muscle</div><div class="stat-value">${$(j(t))}</div></div>
      <button class="list-row button" id="exd-edit">
        <div class="row-main"><div class="row-title" style="color: var(--accent);">Edit Name, Muscle & Equipment</div></div>
      </button>
    </div>

    ${r.length>0?`
      <div class="section">Stats</div>
      <div class="form-section">
        <div class="stat-row"><div class="stat-label">Total Sets</div><div class="stat-value">${r.length.toLocaleString()}</div></div>
        <div class="stat-row"><div class="stat-label">Total Volume</div><div class="stat-value">${fe(a)}</div></div>
        ${c?`<div class="stat-row"><div class="stat-label">Best Set</div><div class="stat-value">${be(c.weight)} \xD7 ${c.reps}</div></div>`:""}
      </div>
    `:""}

    ${w.length>0?`
      <div class="section">Avg working-set volume per workout</div>
      <div class="exercise-chart-mount"></div>
    `:""}

    ${r.length>0?`
      <div class="section">Recent Sets \xB7 tap to view that workout</div>
      <div class="form-section">
        ${r.slice(-30).reverse().map(d=>`
          <button class="stat-row recent-set" data-workout-id="${$(d.workoutId)}">
            <div class="stat-label" style="font-size: 13px; color: var(--text-secondary);">${Q(d.workout.startedAt)}</div>
            <div class="stat-value" style="color: var(--text);">${be(d.weight)} \xD7 ${d.reps} <span class="name-chevron">\u203A</span></div>
          </button>
        `).join("")}
      </div>
    `:`
      <div class="empty-state" style="padding: 32px 24px;">
        <p style="color: var(--text-secondary);">No completed sets yet.</p>
      </div>
    `}
  `;return{exercise:t,completed:r,chartData:w,html:D}}function Is(e){let t=!0,s=null;return e.container.innerHTML="",ae().then(n=>{t&&(n?s=Cn(e,n):Dn(e))}).catch(n=>{t&&(e.container.innerHTML=`<div class="empty-state"><div class="empty-icon">!</div><h2>Couldn't load</h2><p>${$(n.message)}</p></div>`)}),()=>{t=!1,typeof s=="function"&&s()}}async function Dn(e){e.setTitle("Workout");let t=await oe(),s=t[0],n=tt(t),o=n?We(n.normalized):V[0],r=n&&Bs(n.startedAt)==="today"?"Tomorrow":"Today",a=s?`<div class="last-workout-hint">Last: <strong>${$(s.name)}</strong> \xB7 ${Bs(s.startedAt)}</div>`:"",c=`<div class="next-workout-hint">${r}: <strong>${$(o)}</strong></div>`;e.container.innerHTML=`
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
  `,e.container.querySelector("#start-btn").addEventListener("click",()=>An(o,r));for(let p of e.container.querySelectorAll("[data-nav]"))p.addEventListener("click",()=>pt(e,()=>e.refresh()))}function Bs(e){let t=new Date,s=new Date(e),n=i=>new Date(i.getFullYear(),i.getMonth(),i.getDate()).getTime(),o=Math.round((n(t)-n(s))/(1440*60*1e3));return o===0?"today":o===1?"yesterday":o<7?`${o} days ago`:o<14?"a week ago":`${Math.round(o/7)} weeks ago`}function An(e,t="Today"){Bn(e,async s=>{let n={id:_(),name:s,startedAt:Date.now(),endedAt:null,notes:""};await W("workouts",n),F("workout:changed")},t)}function Bn(e,t,s="Today"){let o=N({html:`
      <div class="sheet-header">
        <button class="btn-text" id="wt-cancel">Cancel</button>
        <div class="title">New Workout</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">
        <div class="section">Pick a type</div>
        <div class="form-section">
          ${V.map(i=>{let a=i===e?` <span class="badge">${$(s)}</span>`:"";return`
              <button class="list-row button" data-name="${$(i)}">
                <div class="row-main"><div class="row-title" style="color: ${Re(i)}; font-weight: 600;">${$(i)}${a}</div></div>
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
    `,onMount(i){i.querySelector("#wt-cancel").addEventListener("click",()=>o());for(let c of i.querySelectorAll(".list-row.button[data-name]"))c.addEventListener("click",()=>{let p=c.dataset.name;o(),t(p)});let r=i.querySelector("#wt-custom"),a=i.querySelector("#wt-go");r.addEventListener("input",()=>{a.disabled=r.value.trim().length===0}),a.addEventListener("click",()=>{let c=r.value.trim();c&&(o(),t(c))}),setTimeout(()=>r.focus(),50)}})}function Cn(e,t){let s=[],n=[],o=new Map,i=new Map,r=null;e.container.innerHTML=`
    <div class="active-workout">
      <div class="workout-header">
        <input class="workout-name-input" id="wname" value="${$(t.name)}" placeholder="Workout name" />
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
  `,e.container.querySelector("#calc-fab").addEventListener("click",Fn);let a=()=>{e.setTitle(Ct((Date.now()-t.startedAt)/1e3))};a(),r=setInterval(a,1e3);let c=e.container.querySelector("#wname");c.addEventListener("input",async()=>{t.name=c.value,await W("workouts",{...t}),de()});let p=new Map;e.container.querySelector("#add-exercise-btn").addEventListener("click",()=>{Rn(s,i,async h=>{await Pn(t,n,h),await w()})}),e.container.querySelector("#finish-btn").addEventListener("click",async()=>{let h=n.filter(u=>(u.weight||0)>0&&(u.reps||0)>0);if(!n.some(u=>u.completed)&&h.length===0){if(!confirm("Nothing logged yet. Discard this workout?"))return;await we(t.id),F("workout:changed");return}if(n.some(u=>u.completed)){if(!confirm("Finish this workout?"))return}else{let u=h.length;if(!confirm(`No sets are checked off. Finish anyway and count all ${u} filled-in set${u===1?"":"s"} as done?`))return}await On(t,n);try{let{filename:u}=await lt();R(`Saved \xB7 backup: ${u}`)}catch(u){R(`Saved \xB7 backup failed: ${u.message}`)}F("workout:changed")}),e.container.querySelector("#discard-btn").addEventListener("click",async()=>{confirm("Discard this workout? This cannot be undone.")&&(await we(t.id),F("workout:changed"))});async function w(){let[h,u,v]=await Promise.all([P("sets"),P("workouts"),P("exercises")]);s=v,n=h.filter(k=>k.workoutId===t.id).sort((k,m)=>k.order-m.order),o=St(h,u,t.id),p=l(h,v,t.id),i=new Map;for(let k of h)i.set(k.exerciseId,(i.get(k.exerciseId)??0)+1);b(),D()}function D(){let h=new Map(s.map(S=>[S.id,S])),u=[],v=new Map;for(let S of n){let T=h.get(S.exerciseId);if(!T)continue;let L=j(T);if(u.includes(L)||u.push(L),!S.completed)continue;let q=(S.weight||0)*(S.reps||0);q<=0||v.set(L,(v.get(L)??0)+q)}let k=[...v.values()].reduce((S,T)=>S+T,0),m=e.container.querySelector("#workout-progress");if(!m)return;if(u.length===0){m.innerHTML="";return}let C=u.map(S=>{let T=p.get(S)??0,L=v.get(S)??0;return{muscle:S,record:T,cur:L,span:Math.max(T,L)}}),I=Math.max(...C.map(S=>S.span)),x=I>0?I*.12:1;C=C.map(S=>({...S,span:Math.max(S.span,x)}));let M=Math.max(...C.map(S=>S.span)),g=C.map(({muscle:S,record:T,cur:L,span:q})=>{let f=q/M*100,E=L>0?Math.min(100,L/q*100):0,B=T>0?`${Math.round(L/T*100)}%`:"new",H=T>0?`${X(L)} / ${X(T)} \xB7 ${B}`:`${X(L)} \xB7 ${B}`,O=Rt(S);return`
        <div class="vol-muscle" style="width: ${f.toFixed(2)}%; --mcolor: ${O}; --mtext: ${Ft(O)};" title="${$(S)}: ${X(L)} / record ${X(T)} lbs">
          <div class="vol-fill" style="width: ${E.toFixed(2)}%;"></div>
          <div class="vol-info${E>55?" on-fill":""}">
            <span class="seg-name">${$(S)}</span>
            <span class="seg-vol">${H}</span>
          </div>
        </div>
      `}).join(""),y=`<strong>${X(k)} lbs</strong> total`;m.innerHTML=`
      <div class="vol-bars">${g}</div>
      <div class="vol-label">${y}</div>
    `,requestAnimationFrame(()=>{for(let S of m.querySelectorAll(".vol-muscle"))d(S)})}function d(h){let u=h.querySelector(".seg-name"),v=h.querySelector(".seg-vol"),k=h.clientWidth-4;if(k<=0)return;if(v){let C=10;for(v.style.fontSize=`${C}px`;v.scrollWidth>k&&C>6;)C-=.5,v.style.fontSize=`${C}px`}if(!u)return;u.style.display="";let m=11;for(u.style.fontSize=`${m}px`;u.scrollWidth>k&&m>5;)m-=.5,u.style.fontSize=`${m}px`}function l(h,u,v){let k=new Map(u.map(I=>[I.id,I])),m=new Map,C=new Map;for(let I of G(h)){if(I.workoutId===v)continue;let x=k.get(I.exerciseId);if(!x)continue;let M=(I.weight||0)*(I.reps||0);if(M<=0)continue;let g=j(x),y=C.get(I.workoutId);y||C.set(I.workoutId,y=new Map),y.set(g,(y.get(g)??0)+M)}for(let I of C.values())for(let[x,M]of I)M>(m.get(x)??0)&&m.set(x,M);return m}async function A(h){if(!h.completed||(h.setType||"working")==="warmup"||!(h.weight>0)||!(h.reps>0))return;let u=s.find(M=>M.id===h.exerciseId);if(!u)return;let v=await P("sets"),k=G(v).filter(M=>M.exerciseId===h.exerciseId&&M.id!==h.id&&(M.setType||"working")!=="warmup"&&M.weight>0&&M.reps>0);if(k.length===0)return;let m=[],C=k.reduce((M,g)=>Math.max(M,g.weight),0);h.weight>C&&m.push(`Heaviest weight ever: ${ye(h.weight)} lbs`);let I=h.weight*h.reps,x=k.reduce((M,g)=>Math.max(M,g.weight*g.reps),0);if(I>x&&m.push(`Most volume in a set: ${ye(h.weight)}\xD7${h.reps} = ${X(I)} lbs`),m.length>0){let M=m.length>1?"New records":"New record";R(`${J(u)} \u2014 ${M}!
${m.join(`
`)}`,0,{persistUntilClick:!0})}}function b(){let h=new Map(s.map(x=>[x.id,x])),u=[],v=new Map;for(let x of n)v.has(x.exerciseId)||(v.set(x.exerciseId,[]),u.push(x.exerciseId)),v.get(x.exerciseId).push(x);for(let[,x]of v)x.sort((M,g)=>M.order-g.order);let k=e.container.querySelector("#exercise-sections");if(u.length===0){k.innerHTML=`
        <div class="empty-state" style="padding: 40px 24px; min-height: auto;">
          <p style="color: var(--text-secondary);">Add an exercise to start logging sets.</p>
        </div>`;return}k.innerHTML=u.map(x=>{let M=h.get(x),g=v.get(x),y=o.get(x)??new Map;return Tn(x,M,g,y,i.get(x)??0)}).join("");function m(x){delete x.bumpedBy,delete x.preBumpWeight,delete x.preBumpReps}function C(x){let M=n.filter(L=>L.exerciseId===x.exerciseId).sort((L,q)=>L.order-q.order),g=x.setType||"working",y=0,S=0;for(let L of M)if(S+=1,(L.setType||"working")===g&&(y+=1),L.id===x.id)break;let T=Ee(g,y,o.get(x.exerciseId),S);return T&&T.weight>0&&T.reps>0?{weight:T.weight,reps:T.reps}:null}async function I(x){await Ts(x.id,n),x.completed&&await Cs(x,n,C);for(let M of n){if(M.exerciseId!==x.exerciseId)continue;let g=k.querySelector(`.set-row[data-set-id="${M.id}"]`);if(!g)continue;let y=g.querySelector(".weight-input"),S=g.querySelector(".reps-input");y&&document.activeElement!==y&&(y.value=M.weight>0?String(M.weight):""),S&&document.activeElement!==S&&(S.value=M.reps>0?String(M.reps):"")}}for(let x of k.querySelectorAll(".set-row-wrap")){let M=x.querySelector(".set-row"),g=M.dataset.setId,y=n.find(B=>B.id===g);if(!y)continue;let S=M.querySelector(".weight-input"),T=M.querySelector(".reps-input"),L=M.querySelector(".complete-btn");qn(x,async()=>{await Te("sets",y.id),await w()});let q=Je(async()=>{await I(y),y.completed&&D()},200);S.addEventListener("input",()=>{y.weight=parseFloat(S.value)||0,m(y),W("sets",{...y}).catch(B=>console.error("Set save failed",B)),q()});let f=Je(async()=>{await I(y),y.completed&&D()},200);T.addEventListener("input",()=>{y.reps=parseInt(T.value,10)||0,m(y),W("sets",{...y}).catch(B=>console.error("Set save failed",B)),f()}),L.addEventListener("click",async()=>{let B=y.completed;y.completed=!y.completed,y.completed&&m(y),await W("sets",y),M.classList.toggle("completed",y.completed),L.innerHTML=qs(y.completed);let H=M.querySelector(".set-number")?.textContent?.trim()||"";L.setAttribute("aria-label",`${y.completed?"Mark incomplete":"Mark complete"} set ${H}`),D(),!B&&y.completed?(await Cs(y,n,C)&&b(),await A(y)):B&&!y.completed&&await Ts(y.id,n)&&b()});let E=M.querySelector(".set-number");E&&E.addEventListener("click",async()=>{let H=(y.setType||"working")==="warmup"?"working":"warmup";if(y.setType=H,!y.completed){let O=n.filter(ue=>ue.exerciseId===y.exerciseId).sort((ue,Os)=>ue.order-Os.order),Y=0,te=0;for(let ue of O)if(te+=1,(ue.setType||"working")===H&&(Y+=1),ue.id===y.id)break;let he=Ee(H,Y,o.get(y.exerciseId),te);he&&he.weight>0&&he.reps>0&&(y.weight=he.weight,y.reps=he.reps)}await W("sets",y),b()})}for(let x of k.querySelectorAll(".add-set-btn"))x.addEventListener("click",async()=>{let M=x.dataset.exerciseId;await Hn(t,n,M,o.get(M)??new Map),await w()});for(let x of k.querySelectorAll(".exercise-menu"))x.addEventListener("click",async()=>{let M=x.dataset.exerciseId;confirm("Remove this exercise from the workout?")&&(await Ke("sets",n.filter(g=>g.exerciseId===M).map(g=>g.id)),await w())});for(let x of k.querySelectorAll(".exercise-name-btn"))x.addEventListener("click",()=>{r&&(clearInterval(r),r=null),Ve(e,x.dataset.exerciseId,()=>e.refresh())})}return w(),()=>{r&&clearInterval(r)}}function Tn(e,t,s,n=new Map,o=0){let i=0,r=0,a=s.map((c,p)=>{let w=c.setType||"working",D,d;w==="warmup"?(r+=1,d=r,D=`W${r}`):(i+=1,d=i,D=String(i));let l=Ee(w,d,n,p+1);return In(c,D,l)}).join("");return`
    <div class="exercise-section">
      <div class="exercise-section-header">
        <button class="exercise-name-btn" data-exercise-id="${$(e)}">${ce(t)}</button>
        <div class="row-trailing trailing-stack">${le(o)}</div>
        <button class="menu exercise-menu" data-exercise-id="${$(e)}" aria-label="Remove ${$(J(t))} from workout">\xD7</button>
      </div>
      <div class="set-table-header">
        <div class="col-set">SET</div>
        <div>PREV</div>
        <div>LBS</div>
        <div>REPS</div>
        <div></div>
      </div>
      ${a}
      <button class="add-set-btn" data-exercise-id="${$(e)}">+ Add Set</button>
    </div>
  `}function Ee(e,t,s,n=null){if(!s||typeof s.get!="function")return null;let o=s.get(`${e}#${t}`);return o||(n!=null?s.get(`any#${n}`)??null:null)}function In(e,t,s){let n=e.setType||"working",o=s&&s.weight>0&&s.reps>0?`${ye(s.weight)} \xD7 ${s.reps}`:"\u2014";return`
    <div class="set-row-wrap" data-set-id="${e.id}">
      <button class="set-swipe-delete" data-set-id="${e.id}" aria-label="Delete set ${t}">Delete</button>
      <div class="set-row type-${n}${e.completed?" completed":""}" data-set-id="${e.id}">
        <button class="set-number" aria-label="Set ${t}, tap to mark as ${n==="warmup"?"working":"warmup"}">${t}</button>
        <div class="prev" aria-label="Previous">${o}</div>
        <input class="weight-input" type="number" inputmode="decimal" step="0.5" aria-label="Weight in pounds for set ${t}"
               placeholder="0" value="${e.weight>0?e.weight:""}" />
        <input class="reps-input" type="number" inputmode="numeric" step="1" aria-label="Repetitions for set ${t}"
               placeholder="0" value="${e.reps>0?e.reps:""}" />
        <button class="complete-btn" aria-label="${e.completed?"Mark incomplete":"Mark complete"} set ${t}">${qs(e.completed)}</button>
      </div>
    </div>
  `}function qn(e,t){let s=e.querySelector(".set-row"),n=e.querySelector(".set-swipe-delete");if(!s||!n)return;let o=88,i=0,r=0,a=0,c=0,p=!1,w=!1,D=!1,d=!1,l=()=>Math.max(140,i*.5);function A(k,m){s.style.transition=m?"transform 0.18s ease":"none",s.style.transform=`translateX(${k}px)`,n.style.width=`${Math.max(o,-k)}px`,e.classList.toggle("will-delete",k<=-l())}function b(k=!0){D=!1,A(0,k),e.classList.remove("swiped-open")}function h(k=!0){document.querySelectorAll(".set-row-wrap.swiped-open").forEach(m=>{if(m!==e){let C=m.querySelector(".set-row");C&&(C.style.transition="transform 0.18s ease",C.style.transform="translateX(0)");let I=m.querySelector(".set-swipe-delete");I&&(I.style.width=""),m.classList.remove("swiped-open","will-delete")}}),D=!0,A(-o,k),e.classList.add("swiped-open")}function u(){s.style.transition="transform 0.16s ease-out",s.style.transform=`translateX(${-i}px)`,n.style.width=`${i}px`,setTimeout(t,150)}s.addEventListener("touchstart",k=>{i=e.clientWidth||s.clientWidth,r=k.touches[0].clientX,a=k.touches[0].clientY,c=D?-o:0,p=!0,w=!1,d=!!k.target.closest("input, button, select, textarea")},{passive:!0}),s.addEventListener("touchmove",k=>{if(!p)return;let m=k.touches[0].clientX-r,C=k.touches[0].clientY-a;if(!w){if(Math.abs(C)>Math.abs(m)+4){p=!1;return}Math.abs(m)>8&&(w=!0,d&&document.activeElement?.blur&&document.activeElement.blur())}if(!w)return;k.cancelable&&k.preventDefault();let I=D?-o:0;c=Math.min(0,Math.max(-i,I+m)),A(c,!1)},{passive:!1});function v(){p&&(p=!1,w&&(c<=-l()?u():c<-o/2?h():b()))}s.addEventListener("touchend",v),s.addEventListener("touchcancel",v),n.addEventListener("click",k=>{k.stopPropagation(),t()})}function qs(e){return e?'<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>':'<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>'}async function Pn(e,t,s){let n=t.reduce((o,i)=>Math.max(o,i.order),-1)+1;for(let o of s){let i=(await kt(o,e.id)).filter(c=>(c.weight||0)>0&&(c.reps||0)>0),a=(i.length>0?i:[{weight:0,reps:0,setType:"working"}]).map(c=>({id:_(),workoutId:e.id,exerciseId:o,weight:c.weight??0,reps:c.reps??0,setType:c.setType||"working",completed:!1,order:n++,createdAt:Date.now()}));await re("sets",a)}}async function Cs(e,t,s){let n=e.weight||0,o=n*(e.reps||0);if(o<=0)return!1;let i=!1;for(let r of t){if(r.exerciseId!==e.exerciseId||r.id===e.id||(r.order??0)<=(e.order??0)||r.completed)continue;if((r.weight||0)*(r.reps||0)<o||(r.weight||0)<n){if(r.bumpedBy==null){let c=s?.(r);r.preBumpWeight=c?c.weight:r.weight,r.preBumpReps=c?c.reps:r.reps}r.bumpedBy=e.id,r.weight=e.weight,r.reps=e.reps,await W("sets",r),i=!0}}return i}async function Ts(e,t){let s=!1;for(let n of t)n.bumpedBy===e&&(n.completed||(n.preBumpWeight!=null&&(n.weight=n.preBumpWeight),n.preBumpReps!=null&&(n.reps=n.preBumpReps)),delete n.bumpedBy,delete n.preBumpWeight,delete n.preBumpReps,await W("sets",n),s=!0);return s}async function Hn(e,t,s,n=new Map){let o=t.filter(b=>b.exerciseId===s),i=o[o.length-1],r=b=>(b?.weight||0)*(b?.reps||0),a=o.filter(b=>(b.setType||"working")!=="warmup"),c=a.length+1,p=Ee("working",c,n,o.length+1),w=a.filter(b=>b.weight>0&&b.reps>0).reduce((b,h)=>!b||r(h)>r(b)?h:b,null),D=a.some((b,h)=>{let u=Ee("working",h+1,n);return u&&u.weight>0&&u.reps>0&&r(b)>r(u)}),d=i?.weight??0,l=i?.reps??0;w&&(!p||D)&&(d=w.weight,l=w.reps);let A={id:_(),workoutId:e.id,exerciseId:s,weight:d,reps:l,completed:!1,order:(i?.order??-1)+1,createdAt:Date.now()};await W("sets",A)}async function On(e,t){await Ke("sets",t.filter(s=>!s.completed&&((s.weight||0)===0||(s.reps||0)===0)).map(s=>s.id)),e.endedAt=Date.now(),await W("workouts",e)}function Rn(e,t,s){let n=new Set,o="",i=null,r=N({html:`
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
    `,onMount(a){let c=a.querySelector("#picker-list"),p=a.querySelector("#picker-add"),w=a.querySelector("#picker-cancel"),D=a.querySelector("#picker-custom"),d=a.querySelector("#picker-search"),l=a.querySelector("#picker-chips");function A(){l.innerHTML=He(e,i);for(let h of l.querySelectorAll(".chip"))h.addEventListener("click",()=>{let u=h.dataset.cat;i=u==="All"?null:u,A(),b()})}function b(){let h=e.filter(u=>!i||j(u)===i).filter(u=>!o||u.name.toLowerCase().includes(o.toLowerCase())).sort((u,v)=>{let k=t.get(u.id)??0,m=t.get(v.id)??0;return k!==m?m-k:u.name.localeCompare(v.name)});c.innerHTML=h.length===0?'<div class="list-row"><div class="row-main" style="color:var(--text-secondary)">No matches</div></div>':h.map(u=>`
                <button class="list-row" data-id="${u.id}">
                  ${ce(u)}
                  <div class="row-trailing trailing-stack">
                    ${le(t.get(u.id)??0)}
                    ${n.has(u.id)?Wn():""}
                  </div>
                </button>
              `).join("");for(let u of c.querySelectorAll(".list-row[data-id]"))u.addEventListener("click",()=>{let v=u.dataset.id;n.has(v)?n.delete(v):n.add(v),p.disabled=n.size===0,p.textContent=n.size===0?"Add":`Add (${n.size})`,b()})}d.addEventListener("input",()=>{o=d.value,b()}),w.addEventListener("click",()=>r()),p.addEventListener("click",()=>{s(Array.from(n)),r()}),D.addEventListener("click",()=>{Me(null,async h=>{e.push(h),n.add(h.id),A(),b(),p.disabled=!1,p.textContent=`Add (${n.size})`})}),A(),b()}})}function Wn(){return'<svg viewBox="0 0 24 24" width="22" height="22" fill="var(--green)"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'}function Me(e,t){let s=!!e,n=s?j(e):null,o=!n||xe.includes(n)?xe:[n,...xe],i=e?.equipment,r=!i||Pe.includes(i)?Pe:[i,...Pe],a=N({html:`
      <div class="sheet-header">
        <button class="btn-text" id="ce-cancel">Cancel</button>
        <div class="title">${s?"Edit Exercise":"New Exercise"}</div>
        <button class="btn-text primary" id="ce-save" ${s?"":"disabled"}>Save</button>
      </div>
      <div class="sheet-content">
        <div class="section">Name</div>
        <div class="form-section">
          <div class="form-row">
            <input id="ce-name" placeholder="e.g. Cable Lateral Raise" style="text-align: left;" value="${$(e?.name??"")}" />
          </div>
        </div>
        <div class="section">Muscle</div>
        <div class="form-section">
          <div class="form-row">
            <label for="ce-cat">Muscle</label>
            <select id="ce-cat">${o.map(c=>`<option${c===n?" selected":""}>${$(c)}</option>`).join("")}</select>
          </div>
        </div>
        <div class="section">Equipment</div>
        <div class="form-section">
          <div class="form-row">
            <label for="ce-eq">Equipment</label>
            <select id="ce-eq">${r.map(c=>`<option${c===i?" selected":""}>${$(c)}</option>`).join("")}</select>
          </div>
        </div>
      </div>
    `,onMount(c){let p=c.querySelector("#ce-name"),w=c.querySelector("#ce-save");p.addEventListener("input",()=>{w.disabled=p.value.trim().length===0}),c.querySelector("#ce-cancel").addEventListener("click",()=>a()),w.addEventListener("click",async()=>{let D=p.value.trim();if(!D)return;let d=c.querySelector("#ce-cat").value,l=c.querySelector("#ce-eq").value,A=s?{...e,name:D,muscle:d,equipment:l}:{id:_(),name:D,muscle:d,category:d,equipment:l,notes:"",isCustom:!0,createdAt:Date.now()};await W("exercises",A),a(),t?.(A),s||F("data:changed")}),s||setTimeout(()=>p.focus(),50)}})}function Fn(){let t=[["(","open","paren"],[")","close","paren"],["AC","clear","fn"],["\xB1","sign","fn"],["\u232B","back","fn"],["\xF7","op","op"],["7","digit"],["8","digit"],["9","digit"],["\xD7","op","op"],["4","digit"],["5","digit"],["6","digit"],["\u2212","op","op"],["1","digit"],["2","digit"],["3","digit"],["+","op","op"],["0","digit","zero"],[".","dot"],["=","equals","op"]].map(([s,n,o])=>`<button class="calc-key${o?` calc-${o}`:""}" data-action="${n}" data-key="${$(s)}">${$(s)}</button>`).join("");N({html:`
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
    `,onMount(s,n){let o=s.querySelector("#calc-expr"),i=s.querySelector("#calc-result"),r={"+":(f,E)=>f+E,"\u2212":(f,E)=>f-E,"\xD7":(f,E)=>f*E,"\xF7":(f,E)=>E===0?NaN:f/E},a={"+":1,"\u2212":1,"\xD7":2,"\xF7":2},c=f=>f==="+"||f==="\u2212"||f==="\xD7"||f==="\xF7",p=f=>f!=null&&!c(f)&&f!=="(";function w(f){let E=[],B=[];for(let O of f)if(O==="(")B.push(O);else if(O===")"){for(;B.length&&B[B.length-1]!=="(";)E.push(B.pop());if(!B.length)return NaN;B.pop()}else if(c(O)){for(;B.length&&c(B[B.length-1])&&a[B[B.length-1]]>=a[O];)E.push(B.pop());B.push(O)}else{let Y=parseFloat(O);if(!isFinite(Y))return NaN;E.push(Y)}for(;B.length;){let O=B.pop();if(O==="(")return NaN;E.push(O)}let H=[];for(let O of E){if(typeof O=="number"){H.push(O);continue}let Y=H.pop(),te=H.pop();if(te===void 0||Y===void 0)return NaN;H.push(r[O](te,Y))}return H.length===1?H[0]:NaN}let D=f=>f.reduce((E,B,H)=>H===0?B:E+(f[H-1]==="("||B===")"?"":" ")+B,""),d=f=>{if(!isFinite(f))return"Error";let E=parseFloat(f.toFixed(8)).toString();return E.replace("-","").replace(".","").length>12&&(E=f.toPrecision(10).replace(/\.?0+$/,"")),E},l=["0"],A=!1,b=!1,h="",u=()=>l[l.length-1];function v(){o.textContent=b?"":h,i.textContent=b?"Error":D(l);let f=!b&&c(u())?u():null;for(let E of s.querySelectorAll(".calc-op"))E.classList.toggle("selected",E.dataset.key===f)}function k(f){if(b&&(l=["0"],b=!1),A)return l=[f],A=!1,v();u()===")"?l.push("\xD7",f):c(u())||u()==="("?l.push(f):l[l.length-1]=u()==="0"?f:u()+f,v()}function m(){if(b&&(l=["0"],b=!1),A)return l=["0."],A=!1,v();u()===")"?l.push("\xD7","0."):c(u())||u()==="("?l.push("0."):u().includes(".")||(l[l.length-1]=u()+"."),v()}function C(f){b||(A=!1,u()!=="("&&(c(u())?l[l.length-1]=f:l.push(f),v()))}let I=()=>l.filter(f=>f==="(").length-l.filter(f=>f===")").length;function x(){if(b&&(l=["0"],b=!1),A)return l=["("],A=!1,v();l.length===1&&u()==="0"?l=["("]:p(u())?l.push("\xD7","("):l.push("("),v()}function M(){b||A||I()<=0||!p(u())||(l.push(")"),v())}function g(){l=["0"],A=!1,b=!1,v()}function y(){if(b||c(u())||u()==="("||u()===")")return;let f=u();l[l.length-1]=f.startsWith("-")?f.slice(1):f==="0"?"0":"-"+f,v()}function S(){if(b)return g();if(A=!1,c(u())||u()==="("||u()===")")return l.pop(),l.length===0&&(l=["0"]),v();let f=u().slice(0,-1);f===""||f==="-"?l.length>1?l.pop():l=["0"]:l[l.length-1]=f,v()}function T(){if(b)return;let f=l.slice();for(;f.length&&(c(f[f.length-1])||f[f.length-1]==="(");)f.pop();if(!f.some(c))return;for(let B=f.filter(H=>H==="(").length-f.filter(H=>H===")").length;B>0;B--)f.push(")");let E=w(f);if(!isFinite(E))return b=!0,v();h=`${D(f)} =`,l=[d(E)],A=!0,v()}function L(f){let{action:E,key:B}=f.dataset;E!=="equals"&&(h=""),E==="digit"?k(B):E==="open"?x():E==="close"?M():E==="dot"?m():E==="clear"?g():E==="sign"?y():E==="back"?S():E==="op"?C(B):E==="equals"&&T()}let q=null;for(let f of s.querySelectorAll(".calc-key"))f.addEventListener("pointerdown",E=>{E.preventDefault(),q=f,f.classList.add("pressed")}),f.addEventListener("pointerup",E=>{E.preventDefault(),f.classList.remove("pressed"),q===f&&L(f),q=null}),f.addEventListener("pointercancel",()=>{f.classList.remove("pressed"),q=null}),f.addEventListener("pointerleave",()=>f.classList.remove("pressed"));s.querySelector("#calc-done").addEventListener("click",()=>n())}})}function Ae(){let e=window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===!0,t;e?t=Math.max(window.innerHeight||0,window.visualViewport?.height||0,window.screen?.height||0):t=window.visualViewport?.height||window.innerHeight,document.documentElement.style.setProperty("--app-height",`${t}px`)}Ae();window.addEventListener("resize",Ae);window.addEventListener("orientationchange",Ae);window.addEventListener("pageshow",Ae);window.visualViewport?.addEventListener("resize",Ae);var Ps={workout:{title:"Workout",render:Is},exercises:{title:"Exercises",render:Es},progress:{title:"Progress",render:bs}},Le=document.getElementById("view-content"),Nn=document.getElementById("nav-title"),Hs=document.getElementById("nav-back"),ee=document.getElementById("nav-action"),De="workout",gt=null,_e=null,Ye=null,Ue={container:Le,setTitle(e){Nn.textContent=e},setAction(e){if(!e){ee.hidden=!0,ee.innerHTML="",ee.removeAttribute("aria-label"),_e=null;return}ee.hidden=!1,e.label?ee.setAttribute("aria-label",e.label):ee.removeAttribute("aria-label"),e.html?ee.innerHTML=e.html:ee.textContent=e.label??"",_e=e.onClick},setBack(e){gt=e,Hs.hidden=!e},refresh(){Be(De)},toast(e){R(e)}};function jn(){if(typeof Ye=="function")try{Ye()}catch(e){console.error(e)}Ye=null}function Be(e){De=e,Ot(e),document.querySelectorAll(".tab").forEach(t=>{t.setAttribute("aria-selected",String(t.dataset.tab===e))}),jn(),Ue.setTitle(Ps[e].title),Ue.setAction(null),Ue.setBack(null),Le.innerHTML="",Le.scrollTop=0;try{Ye=Ps[e].render(Ue)}catch(t){console.error("Render failed",t),Le.innerHTML=`<div class="empty-state"><div class="empty-icon">!</div><h2>Render error</h2><p>${$(t.message)}</p></div>`}}document.querySelectorAll(".tab").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll(".sheet-backdrop").forEach(t=>t.dismissSheet?.()),Be(e.dataset.tab)})});Hs.addEventListener("click",()=>{gt&&gt()});ee.addEventListener("click",()=>{_e&&_e()});(function(){let t='button, [role="button"], a[href]',s=null,n=0,o=0,i=()=>{s&&(s.classList.remove("pressed"),s=null)};document.addEventListener("pointerdown",r=>{let a=r.target.closest?.(t);s&&s!==a&&i(),!(!a||a.disabled||a.classList.contains("calc-key"))&&(s=a,n=r.clientX,o=r.clientY,a.classList.add("pressed"))},{passive:!0}),document.addEventListener("pointermove",r=>{s&&(Math.abs(r.clientX-n)>8||Math.abs(r.clientY-o)>8)&&i()},{passive:!0}),document.addEventListener("pointerup",i,{passive:!0}),document.addEventListener("pointercancel",i,{passive:!0}),window.addEventListener("scroll",i,{passive:!0,capture:!0})})();Ze("data:changed",()=>{de(),Be(De)});Ze("workout:changed",()=>{de(),De==="workout"&&Be(De)});document.addEventListener("visibilitychange",()=>{document.visibilityState==="visible"&&de()});async function zn(){try{await U(),await _t().catch(t=>console.warn("Passphrase check failed:",t));let e=await Pt();e>0&&console.info(`Seeded ${e} exercises.`),await zt(),Be("workout"),de()}catch(e){console.error("Init failed:",e),Le.innerHTML=`
      <div class="empty-state">
        <div class="empty-icon">!</div>
        <h2>Storage unavailable</h2>
        <p>${$(e.message??String(e))}</p>
        <p>If you are running this from a <code>file://</code> URL, serve it through a local web server instead.</p>
      </div>`}}zn();
