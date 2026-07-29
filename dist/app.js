var Ts="lift";var vt=["exercises","workouts","sets","stateOfMind","medications"],Ee=null;function j(){return Ee?Promise.resolve(Ee):new Promise((e,t)=>{let s=indexedDB.open(Ts,6);s.onerror=()=>t(s.error),s.onsuccess=()=>{Ee=s.result,e(Ee)},s.onupgradeneeded=()=>{let o=s.result;if(!o.objectStoreNames.contains("exercises")){let i=o.createObjectStore("exercises",{keyPath:"id"});i.createIndex("name","name",{unique:!1}),i.createIndex("category","category",{unique:!1})}if(o.objectStoreNames.contains("workouts")||o.createObjectStore("workouts",{keyPath:"id"}).createIndex("startedAt","startedAt",{unique:!1}),!o.objectStoreNames.contains("sets")){let i=o.createObjectStore("sets",{keyPath:"id"});i.createIndex("workoutId","workoutId",{unique:!1}),i.createIndex("exerciseId","exerciseId",{unique:!1})}o.objectStoreNames.contains("stateOfMind")||o.createObjectStore("stateOfMind",{keyPath:"id"}).createIndex("date","date",{unique:!1}),o.objectStoreNames.contains("medications")||o.createObjectStore("medications",{keyPath:"id"}),o.objectStoreNames.contains("appMeta")||o.createObjectStore("appMeta",{keyPath:"key"}),o.objectStoreNames.contains("doseEvents")&&o.deleteObjectStore("doseEvents")}})}function me(e){return new Promise((t,s)=>{e.onsuccess=()=>t(e.result),e.onerror=()=>s(e.error)})}async function ve(e,t="readonly"){return(await j()).transaction(e,t).objectStore(e)}function se(e,t,s){return new Promise((o,i)=>{let n=e.transaction(t,"readwrite"),r;try{r=s(n)}catch(a){try{n.abort()}catch{}i(a);return}n.oncomplete=()=>o(r),n.onerror=()=>i(n.error),n.onabort=()=>i(n.error)})}async function A(e){return me((await ve(e)).getAll())}async function Q(e,t){return me((await ve(e)).get(t))}async function q(e,t){return await me((await ve(e,"readwrite")).put(t)),t}async function ae(e,t){let s=await j();return se(s,e,o=>{let i=o.objectStore(e);for(let n of t)i.put(n)})}async function ce(e,t){return me((await ve(e,"readwrite")).delete(t))}async function Ye(e,t){if(t.length===0)return;let s=await j();return se(s,e,o=>{let i=o.objectStore(e);for(let n of t)i.delete(n)})}async function ht(e){let t=await Q("appMeta",e);return t?t.value:null}async function De(e,t){return await q("appMeta",{key:e,value:t}),t}async function Ae(e,t,s){let o=await ve(e);return me(o.index(t).getAll(s))}async function yt(e){let t=await j();return se(t,vt,s=>{for(let o of vt){let i=s.objectStore(o);i.clear();for(let n of e[o]??[])i.put(n)}})}function J(e){let t=new Set;for(let s of e)s.completed&&t.add(s.workoutId);return e.filter(s=>s.completed||!t.has(s.workoutId))}async function le(){return(await A("workouts")).find(t=>!t.endedAt)??null}async function Z(){return(await A("workouts")).filter(t=>t.endedAt).sort((t,s)=>s.startedAt-t.startedAt)}async function wt(e){return(await Ae("sets","workoutId",e)).sort((s,o)=>s.order-o.order)}async function Cs(e){return await Ae("sets","exerciseId",e)}async function gt(e,t=null){let s=await Cs(e),o=new Map;for(let r of s)t&&r.workoutId===t||(o.has(r.workoutId)||o.set(r.workoutId,[]),o.get(r.workoutId).push(r));if(o.size===0)return[];let n=(await Promise.all(Array.from(o.keys()).map(r=>Q("workouts",r)))).filter(Boolean).sort((r,a)=>(a.startedAt??0)-(r.startedAt??0));return n.length===0?[]:o.get(n[0].id).sort((r,a)=>r.order-a.order)}function bt(e,t,s=null){let o=new Map(t.map(r=>[r.id,r.startedAt??0])),i=new Map;for(let r of e){if(r.workoutId===s||!o.has(r.workoutId)||(r.weight||0)<=0||(r.reps||0)<=0)continue;let a=i.get(r.exerciseId);a||i.set(r.exerciseId,a=new Map);let u=a.get(r.workoutId);u||a.set(r.workoutId,u=[]),u.push(r)}let n=new Map;for(let[r,a]of i){let u=[...a.keys()].sort((w,S)=>o.get(S)-o.get(w)),d=new Map;for(let w of u){let S=a.get(w).sort((L,v)=>L.order-v.order),l=S.every(L=>L.setType==null),f=0,b=0;S.forEach((L,v)=>{if(l){let k=`any#${v+1}`;d.has(k)||d.set(k,L);return}let m=L.setType||"working",$=m==="warmup"?b+=1:f+=1,x=`${m}#${$}`;d.has(x)||d.set(x,L)})}n.set(r,d)}return n}var Is={barbell:"Barbell",dumbbell:"Dumbbell",machine:"Machine",cable:"Cable",bodyweight:"Bodyweight",kettlebell:"Kettlebell",band:"Bands",bands:"Bands"},qs=/\s*\((barbell|dumbbell|machine|cable|bodyweight|kettlebell|bands?)\)$|\s+(Machine|Barbell|Dumbbell|Cable|Kettlebell)$/i;async function Ps(e,t){let s=await j(),o=await Ae("sets","exerciseId",e);return se(s,["sets","exercises"],i=>{let n=i.objectStore("sets");for(let r of o)n.put({...r,exerciseId:t});return i.objectStore("exercises").delete(e),o.length})}async function xt(){let e=await A("exercises"),t=e.filter(n=>/butterfly/i.test(n.name||""));if(t.length===0)return 0;let s=e.filter(n=>/chest fly/i.test(n.name||"")&&!t.some(r=>r.id===n.id)),o=s.find(n=>(n.equipment||"")==="Machine")||s[0],i=0;for(let n of t)o?i+=await Ps(n.id,o.id):await q("exercises",{...n,name:"Chest Fly",equipment:"Machine"});return i}async function kt(){let e=await A("exercises"),t=[];for(let s of e){let o=(s.name||"").match(qs);if(!o)continue;let i=s.name.slice(0,o.index).trim();if(!i||/smith$/i.test(i))continue;let n=(o[1]||o[2]).toLowerCase();t.push({...s,name:i,equipment:Is[n]||s.equipment})}return t.length>0&&await ae("exercises",t),t.length}async function St(){let[e,t,s]=await Promise.all([A("exercises"),A("sets"),A("workouts")]),o=new Set(e.filter(d=>d.category==="Cardio").map(d=>d.id));if(o.size===0)return{exercises:0,sets:0,workouts:0};let i=t.filter(d=>o.has(d.exerciseId)),n=new Map;for(let d of t)o.has(d.exerciseId)||n.set(d.workoutId,(n.get(d.workoutId)||0)+1);let r=new Set(i.map(d=>d.workoutId)),a=s.filter(d=>r.has(d.id)&&!n.get(d.id)),u=await j();return await se(u,["exercises","sets","workouts"],d=>{let w=d.objectStore("exercises"),S=d.objectStore("sets"),l=d.objectStore("workouts");for(let f of o)w.delete(f);for(let f of i)S.delete(f.id);for(let f of a)l.delete(f.id)}),{exercises:o.size,sets:i.length,workouts:a.length}}async function $t(e){let[t,s,o]=await Promise.all([A("exercises"),A("sets"),A("workouts")]),i=t.filter(l=>l.category==="Other");if(i.length===0)return{recategorized:0,deleted:0,workouts:0};let n=[],r=new Set;for(let l of i){let f=e(l.name);f==="Cardio"?r.add(l.id):n.push({...l,category:f&&f!=="Other"?f:"Full Body"})}let a=s.filter(l=>r.has(l.exerciseId)),u=new Map;for(let l of s)r.has(l.exerciseId)||u.set(l.workoutId,(u.get(l.workoutId)||0)+1);let d=new Set(a.map(l=>l.workoutId)),w=o.filter(l=>d.has(l.id)&&!u.get(l.id)),S=await j();return await se(S,["exercises","sets","workouts"],l=>{let f=l.objectStore("exercises"),b=l.objectStore("sets"),L=l.objectStore("workouts");for(let v of n)f.put(v);for(let v of r)f.delete(v);for(let v of a)b.delete(v.id);for(let v of w)L.delete(v.id)}),{recategorized:n.length,deleted:r.size,workouts:w.length}}async function Mt(){let e=await A("medications"),t=[];for(let s of e){if(s.doseAmount!=null)continue;let o=s.nickname||s.concept?.displayText||"";if(!/creatine/i.test(o))continue;let i=(s.concept?.form||"").replace(/\s*\(4\s*[×x]\s*\/?\s*day\)\s*/i,"").trim();t.push({...s,doseAmount:4,doseUnit:"capsule",concept:{...s.concept,form:i}})}return t.length>0&&await ae("medications",t),t.length}async function Be(e){let t=await j(),s=await Ae("sets","workoutId",e);return se(t,["workouts","sets"],o=>{o.objectStore("workouts").delete(e);let i=o.objectStore("sets");for(let n of s)i.delete(n.id)})}var z=()=>crypto&&crypto.randomUUID?crypto.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,e=>{let t=Math.random()*16|0;return(e==="x"?t:t&3|8).toString(16)});function he(e){return e==null?"0":Math.abs(e-Math.round(e))<.001?String(Math.round(e)):e.toFixed(1)}function ye(e){return`${he(e)} lbs`}function Lt(e){let t=Math.max(0,Math.floor(e)),s=Math.floor(t/3600),o=Math.floor(t%3600/60),i=t%60;return s>0?`${s}:${String(o).padStart(2,"0")}:${String(i).padStart(2,"0")}`:`${o}:${String(i).padStart(2,"0")}`}function Ke(e){let t=Math.max(0,Math.floor(e)),s=Math.floor(t/3600),o=Math.floor(t%3600/60);return s>0?`${s}h ${o}m`:`${o}m`}function _(e){return Math.round(e).toLocaleString()}function de(e){return`${_(e)} lbs`}function K(e){return(e instanceof Date?e:new Date(e)).toLocaleDateString(void 0,{month:"numeric",day:"numeric",year:"2-digit"})}function Et(e){return(e instanceof Date?e:new Date(e)).toLocaleDateString(void 0,{weekday:"short",month:"short",day:"numeric",year:"numeric"})}function Ge(e,t=200){let s=null;return(...o)=>{clearTimeout(s),s=setTimeout(()=>e(...o),t)}}function M(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function I(e,t=1800,s={}){let o=document.querySelector(".toast");o&&o.remove();let i=document.createElement("div");i.className="toast",i.textContent=e,s.persistUntilClick?(i.classList.add("toast-clickable"),i.addEventListener("click",()=>i.remove())):setTimeout(()=>i.remove(),t),document.body.appendChild(i)}var _e=new EventTarget;function H(e,t){_e.dispatchEvent(new CustomEvent(e,{detail:t}))}function Xe(e,t){return _e.addEventListener(e,t),()=>_e.removeEventListener(e,t)}function F({html:e,onMount:t}){let s=document.createElement("div");s.className="sheet-backdrop",s.innerHTML='<div class="sheet"></div>';let o=s.querySelector(".sheet");o.innerHTML=e;let i=Ws();document.body.appendChild(s);function n(){let u=window.visualViewport;if(!u){o.style.maxHeight=`${window.innerHeight-i-10}px`;return}let d=Math.max(window.innerHeight,document.documentElement.clientHeight),w=Math.max(0,d-u.height-u.offsetTop);w>0?(o.style.paddingBottom=`${w}px`,o.style.maxHeight=`${u.height-i-10+w}px`):(o.style.paddingBottom="",o.style.maxHeight=`${u.height-i-10}px`)}n();let r=window.visualViewport;r?.addEventListener("resize",n),r?.addEventListener("scroll",n);function a(){s.remove(),r?.removeEventListener("resize",n),r?.removeEventListener("scroll",n)}return s.dismissSheet=a,s.addEventListener("click",u=>{u.target===s&&a()}),t?.(o,a),a}function Ws(){let e=document.createElement("div");e.style.cssText="position:fixed;top:0;left:0;width:0;height:env(safe-area-inset-top);",document.body.appendChild(e);let t=e.offsetHeight||0;return e.remove(),t}function Te(){return'<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" style="color: var(--red);"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>'}function Dt(){return'<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M16 5l-1.42 1.42-1.59-1.59V16h-2V4.83L9.41 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z"/></svg>'}function ee(e){return`<div class="empty-state"><div class="empty-icon">!</div><h2>Couldn't load</h2><p>${M(e.message||String(e))}</p></div>`}var we=["Pectorals","Anterior Deltoid","Lateral Deltoid","Posterior Deltoid","Triceps","Biceps","Forearms","Lats","Upper Back","Lower Back","Traps","Quadriceps","Hamstrings","Glutes","Adductors","Abductors","Calves","Abs","Obliques"];function Hs(e){let t=new Map(we.map((s,o)=>[s,o]));return[...e].sort((s,o)=>(t.get(s)??999)-(t.get(o)??999)||s.localeCompare(o))}var Ce=["Barbell","Dumbbell","Machine","Cable","Bodyweight","Other"];function G(e){let t=e?.equipment,s=e?.name??"";return t&&t!=="Other"?`${s} (${t})`:s}function oe(e){let t=e?[e.equipment,R(e)].filter(Boolean).join(" \xB7 "):"";return`
    <div class="row-main">
      <div class="row-title">${M(e?.name??"Unknown exercise")}</div>
      ${t?`<div class="row-subtitle">${M(t)}</div>`:""}
    </div>
  `}function ne(e){return e?`<div class="exercise-count">${e} ${e===1?"set":"sets"}</div>`:""}function Ie(e,t){return["All",...Hs(new Set(e.map(o=>R(o))))].map(o=>`<button class="chip${o==="All"&&!t||o===t?" active":""}" data-cat="${M(o)}">${M(o)}</button>`).join("")}var Fs=[["Bench Press (Barbell)","Chest","Barbell"],["Bench Press (Dumbbell)","Chest","Dumbbell"],["Incline Bench Press (Barbell)","Chest","Barbell"],["Incline Bench Press (Dumbbell)","Chest","Dumbbell"],["Decline Bench Press (Barbell)","Chest","Barbell"],["Chest Fly (Dumbbell)","Chest","Dumbbell"],["Chest Fly (Machine)","Chest","Machine"],["Cable Crossover","Chest","Cable"],["Push-Up","Chest","Bodyweight"],["Dip (Chest)","Chest","Bodyweight"],["Deadlift (Conventional)","Back","Barbell"],["Deadlift (Sumo)","Back","Barbell"],["Romanian Deadlift","Back","Barbell"],["Bent-Over Row (Barbell)","Back","Barbell"],["Pendlay Row","Back","Barbell"],["Row (Dumbbell)","Back","Dumbbell"],["T-Bar Row","Back","Barbell"],["Seated Cable Row","Back","Cable"],["Lat Pulldown","Back","Cable"],["Pull-Up","Back","Bodyweight"],["Chin-Up","Back","Bodyweight"],["Face Pull","Back","Cable"],["Shrug (Barbell)","Back","Barbell"],["Shrug (Dumbbell)","Back","Dumbbell"],["Overhead Press (Barbell)","Shoulders","Barbell"],["Overhead Press (Dumbbell)","Shoulders","Dumbbell"],["Seated Shoulder Press (Machine)","Shoulders","Machine"],["Arnold Press","Shoulders","Dumbbell"],["Lateral Raise (Dumbbell)","Shoulders","Dumbbell"],["Lateral Raise (Cable)","Shoulders","Cable"],["Front Raise (Dumbbell)","Shoulders","Dumbbell"],["Rear Delt Fly (Dumbbell)","Shoulders","Dumbbell"],["Reverse Pec Deck","Shoulders","Machine"],["Upright Row","Shoulders","Barbell"],["Barbell Curl","Biceps","Barbell"],["Dumbbell Curl","Biceps","Dumbbell"],["Hammer Curl","Biceps","Dumbbell"],["Preacher Curl","Biceps","Barbell"],["Incline Dumbbell Curl","Biceps","Dumbbell"],["Cable Curl","Biceps","Cable"],["Concentration Curl","Biceps","Dumbbell"],["Close-Grip Bench Press","Triceps","Barbell"],["Tricep Pushdown (Cable)","Triceps","Cable"],["Overhead Tricep Extension (Dumbbell)","Triceps","Dumbbell"],["Overhead Tricep Extension (Cable)","Triceps","Cable"],["Skull Crusher","Triceps","Barbell"],["Dip (Tricep)","Triceps","Bodyweight"],["Tricep Kickback","Triceps","Dumbbell"],["Back Squat","Legs","Barbell"],["Front Squat","Legs","Barbell"],["Goblet Squat","Legs","Dumbbell"],["Bulgarian Split Squat","Legs","Dumbbell"],["Lunge","Legs","Dumbbell"],["Leg Press","Legs","Machine"],["Leg Extension","Legs","Machine"],["Leg Curl (Seated)","Legs","Machine"],["Leg Curl (Lying)","Legs","Machine"],["Hip Thrust (Barbell)","Glutes","Barbell"],["Glute Bridge","Glutes","Bodyweight"],["Cable Kickback","Glutes","Cable"],["Hip Abduction (Machine)","Glutes","Machine"],["Standing Calf Raise","Calves","Machine"],["Seated Calf Raise","Calves","Machine"],["Plank","Core","Bodyweight"],["Hanging Leg Raise","Core","Bodyweight"],["Cable Crunch","Core","Cable"],["Russian Twist","Core","Bodyweight"],["Ab Wheel Rollout","Core","Other"],["Wrist Curl","Forearms","Dumbbell"],["Reverse Wrist Curl","Forearms","Dumbbell"],["Farmer's Carry","Forearms","Dumbbell"]];function R(e){if(e?.muscle)return e.muscle;let t=(e?.name||"").toLowerCase();return t?/romanian deadlift|\brdl\b|stiff.?leg|good morning|nordic|hamstring/.test(t)||/leg curl/.test(t)?"Hamstrings":/leg extension|sissy squat/.test(t)?"Quadriceps":/calf|tib raise|tibialis/.test(t)?"Calves":/hip adduction|adductor|inner thigh|copenhagen/.test(t)?"Adductors":/hip abduction|abductor|outer thigh|clamshell/.test(t)?"Abductors":/hip thrust|glute|cable kickback|donkey kick|rear kick|frog pump/.test(t)?"Glutes":/squat|leg press|lunge|step.?up/.test(t)?"Quadriceps":/back extension|hyperextension|superman/.test(t)||/deadlift|rack pull/.test(t)?"Lower Back":/lateral raise|side raise|side delt|\blat raise\b|upright row/.test(t)?"Lateral Deltoid":/rear delt|reverse fly|reverse flye|face pull|reverse pec deck/.test(t)?"Posterior Deltoid":/front raise|shoulder press|overhead press|arnold|military press|landmine press|push press|viking press/.test(t)?"Anterior Deltoid":/pulldown|pull.?down|pull.?up|chin.?up|pullover|straight.?arm/.test(t)?"Lats":/shrug/.test(t)?"Traps":/tricep|pushdown|skull ?crusher|close.?grip bench|jm press|french press|bench dip/.test(t)?"Triceps":/wrist curl|reverse curl|forearm|farmer|gripper|dead hang/.test(t)?"Forearms":/bicep|\bcurl\b/.test(t)?"Biceps":/\brow\b|rear pull|high pull/.test(t)?"Upper Back":/bench|chest|\bpec\b|pec deck|crossover|butterfly|push.?up|floor press|squeeze press|\bfly\b|\bflye\b/.test(t)?"Pectorals":/russian twist|woodchop|wood chop|side plank|side bend|oblique|pallof|rotation/.test(t)?"Obliques":/crunch|sit.?up|plank|leg raise|knee raise|ab wheel|ab roll|hanging|toes.?to.?bar|v.?up|dead bug|mountain climber/.test(t)?"Abs":/\bdip\b/.test(t)?"Triceps":e.category||"Other":e?.category||"Other"}var Rs=/\b(bike|biking|treadmill|run|running|cardio|step.?mill|elliptical|stair.?master|stair.?climber|jog|jogging|cycling|spinning|spin class|rowing machine|row machine|\berg\b|sprints?|jump.?rope|skipping rope|swim|swimming|hike|hiking)\b/,Os={Quadriceps:"Legs",Hamstrings:"Legs",Adductors:"Legs",Abductors:"Legs",Glutes:"Glutes",Calves:"Calves",Pectorals:"Chest","Anterior Deltoid":"Shoulders","Lateral Deltoid":"Shoulders","Posterior Deltoid":"Shoulders",Lats:"Back","Upper Back":"Back",Traps:"Back","Lower Back":"Back",Biceps:"Biceps",Triceps:"Triceps",Forearms:"Forearms",Abs:"Core",Obliques:"Core"};function At(e){let t=(e||"").toLowerCase().trim();if(!t)return"Full Body";if(Rs.test(t))return"Cardio";let s=R({name:t,category:""});return Os[s]||"Full Body"}async function Bt(){if((await A("exercises")).length>0)return 0;let t=Date.now(),s=Fs.map(([o,i,n])=>({id:z(),name:o,category:i,equipment:n,notes:"",isCustom:!1,createdAt:t}));return await ae("exercises",s),s.length}var Tt="workout";function Ct(e){Tt!==e&&(Tt=e,H("tab:changed",e))}var N=["Chest Day","Leg Day","Back/Bi Day"],qe={"Chest Day":{key:"chest",short:"Chest",cssVar:"--day-chest"},"Leg Day":{key:"leg",short:"Legs",cssVar:"--day-leg"},"Back/Bi Day":{key:"back",short:"Back/Bi",cssVar:"--day-back"}};function Pe(e){let t=qe[e];return t?`var(${t.cssVar})`:"var(--text-tertiary)"}function Qe(e){if(!e)return null;let t=e.toLowerCase();return t.includes("chest")?"Chest Day":t.includes("leg")&&!t.includes("curl")&&!t.includes("extension")?"Leg Day":t.includes("back")||t.includes("pull")?"Back/Bi Day":t.includes("push")?"Chest Day":null}function Je(e){for(let t of e){let s=Qe(t.name);if(s)return{name:t.name,normalized:s,startedAt:t.startedAt}}return null}function We(e){let t=N.indexOf(e);return t===-1?N[0]:N[(t+1)%N.length]}var Ns={Pectorals:"#ec4899",Triceps:"#be185d","Anterior Deltoid":"#831843","Lateral Deltoid":"#f9a8d4",Quadriceps:"#facc15",Hamstrings:"#b45309",Glutes:"#f59e0b",Calves:"#fde68a",Adductors:"#bdb76b",Abductors:"#78350f",Lats:"#2563eb","Upper Back":"#38bdf8",Biceps:"#1e40af","Posterior Deltoid":"#bfdbfe",Traps:"#0891b2","Lower Back":"#475569",Forearms:"#22c55e",Abs:"#ef4444",Obliques:"#14b8a6",Other:"#6b7280"};function It(e){return Ns[e]??"#6b7280"}var js={Pectorals:"Chest Day",Triceps:"Chest Day","Anterior Deltoid":"Chest Day","Lateral Deltoid":"Chest Day",Quadriceps:"Leg Day",Hamstrings:"Leg Day",Glutes:"Leg Day",Calves:"Leg Day",Adductors:"Leg Day",Abductors:"Leg Day",Lats:"Back/Bi Day","Upper Back":"Back/Bi Day",Biceps:"Back/Bi Day","Posterior Deltoid":"Back/Bi Day",Traps:"Back/Bi Day","Lower Back":"Back/Bi Day",Forearms:"Back/Bi Day"};function zs(e){return js[e]??null}function Vs(e,t,s){let o=Qe(e);if(o)return o;let i=new Map;for(let a of t){let u=s.get(a.exerciseId);if(!u)continue;let d=zs(R(u));if(!d)continue;let w=(a.weight||0)*(a.reps||0);w<=0||i.set(d,(i.get(d)??0)+w)}let n=null,r=0;for(let[a,u]of i)u>r&&(n=a,r=u);return n}function qt(e,t,s){let o=[...e].sort((r,a)=>r.startedAt-a.startedAt),i=new Map,n=null;for(let r of o){let a=Vs(r.name,t.get(r.id)??[],s);a||(n?Wt(n.startedAt,r.startedAt)?a=n.day:a=We(n.day):a=N[0]),i.set(r.id,a),n={day:a,startedAt:r.startedAt}}return i}function Pt(e){let t=parseInt(e.slice(1),16);return((t>>16&255)*299+(t>>8&255)*587+(t&255)*114)/1e3>=150?"#1c1c1e":"#ffffff"}function Wt(e,t){let s=new Date(e),o=new Date(t);return s.getFullYear()===o.getFullYear()&&s.getMonth()===o.getMonth()&&s.getDate()===o.getDate()}function Us(e,t){let s=Qe(t?.name);if(s)return s;let o=Je(e);return o?Wt(o.startedAt,Date.now())?o.normalized:We(o.normalized):N[0]}var Ys="lift-today-day";async function ie(){try{let[e,t]=await Promise.all([Z(),le()]),s=Us(e,t),o=qe[s].key;document.documentElement.dataset.day!==o&&(document.documentElement.dataset.day=o);try{localStorage.setItem(Ys,o)}catch{}return s}catch{return null}}var Ht="lift-migrations-done-v2";async function Ze(){let e=await St();e.exercises>0&&console.info(`Removed ${e.exercises} cardio exercise(s), ${e.sets} set(s), ${e.workouts} cardio-only workout(s).`);let t=await $t(At);if(t.recategorized>0||t.deleted>0){console.info(`Reorganized "Other": recategorized ${t.recategorized}, removed ${t.deleted} cardio, dropped ${t.workouts} empty workout(s).`);let n=[];t.recategorized>0&&n.push(`sorted ${t.recategorized} exercise${t.recategorized===1?"":"s"}`),t.deleted>0&&n.push(`removed ${t.deleted} cardio`),I(`Cleaned up \u201COther\u201D: ${n.join(", ")}.`)}let s=await kt();s>0&&console.info(`Stripped equipment from ${s} exercise name(s).`);let o=await xt();o>0&&I(`Merged Butterfly into Chest Fly (${o} sets moved).`);let i=await Mt();i>0&&console.info(`Set a per-dose amount on ${i} medication(s).`)}async function Ft(){try{if(localStorage.getItem(Ht))return}catch{}await Ze();try{localStorage.setItem(Ht,String(Date.now()))}catch{}}var ue="lift-backup-passphrase",Ot=25e4,Rt="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";function et(e){let t=new Uint8Array(e),s="",o=32768;for(let i=0;i<t.length;i+=o)s+=String.fromCharCode.apply(null,t.subarray(i,i+o));return btoa(s)}var tt=e=>Uint8Array.from(atob(e),t=>t.charCodeAt(0));function Nt(){let t=[...crypto.getRandomValues(new Uint8Array(20))].map(s=>Rt[s%Rt.length]);return[0,5,10,15].map(s=>t.slice(s,s+5).join("")).join("-")}var O=null,st=()=>{try{return localStorage.getItem(ue)}catch{return null}},ot=e=>{try{localStorage.setItem(ue,e)}catch{}};async function jt(){if(O)return O;let e=st(),t=null;try{t=await ht(ue)}catch{}if(O=e||t||Nt(),O!==e&&ot(O),O!==t)try{await De(ue,O)}catch{}return O}function nt(){if(O)return O;let e=st();return e||(e=Nt(),ot(e)),O=e,De(ue,e).catch(()=>{}),e}function zt(){return O||st()}function Vt(e){O=e,ot(e),De(ue,e).catch(()=>{})}async function Ut(e,t){let s=await crypto.subtle.importKey("raw",new TextEncoder().encode(e),"PBKDF2",!1,["deriveKey"]);return crypto.subtle.deriveKey({name:"PBKDF2",hash:"SHA-256",salt:t,iterations:Ot},s,{name:"AES-GCM",length:256},!1,["encrypt","decrypt"])}function Yt(e){return!!e&&e.lift==="encrypted-backup"&&typeof e.data=="string"}async function _t(e,t){let s=crypto.getRandomValues(new Uint8Array(16)),o=crypto.getRandomValues(new Uint8Array(12)),i=await Ut(t,s),n=new TextEncoder().encode(JSON.stringify(e)),r=await crypto.subtle.encrypt({name:"AES-GCM",iv:o},i,n);return{lift:"encrypted-backup",v:1,exportedAt:new Date().toISOString(),kdf:{name:"PBKDF2",hash:"SHA-256",iterations:Ot,salt:et(s)},cipher:"AES-GCM",iv:et(o),data:et(r)}}async function it(e,t){let s=tt(e.kdf.salt),o=tt(e.iv),i=await Ut(t,s),n;try{n=await crypto.subtle.decrypt({name:"AES-GCM",iv:o},i,tt(e.data))}catch{throw new Error("Wrong backup password (or the file is damaged).")}return JSON.parse(new TextDecoder().decode(n))}async function _s(){let[e,t,s,o,i]=await Promise.all([A("exercises"),A("workouts"),A("sets"),A("stateOfMind"),A("medications")]);return{version:3,exportedAt:new Date().toISOString(),exercises:e,workouts:t,sets:s,stateOfMind:o,medications:i}}function Ks(){let e=new Date,t=s=>String(s).padStart(2,"0");return`lift-backup-${e.getFullYear()}${t(e.getMonth()+1)}${t(e.getDate())}-${t(e.getHours())}${t(e.getMinutes())}${t(e.getSeconds())}.json`}async function rt(){let e=await _s(),t=nt(),s=await _t(e,t),o=JSON.stringify(s),i=new Blob([o],{type:"application/json"}),n=URL.createObjectURL(i),r=Ks(),a=document.createElement("a");return a.href=n,a.download=r,a.style.display="none",document.body.appendChild(a),a.click(),setTimeout(()=>{document.body.removeChild(a),URL.revokeObjectURL(n)},1e3),{filename:r,bytes:i.size,snapshot:e}}async function Gs(e){let t=zt();if(t)try{return await it(e,t)}catch{}for(let s=0;s<3;s++){let o=prompt("Enter your backup password (saved in your Passwords app):");if(o==null)throw new Error("Restore cancelled.");try{let i=await it(e,o.trim());return Vt(o.trim()),i}catch(i){if(s===2)throw i;alert("Wrong password \u2014 try again.")}}}async function Xs(e){let t=JSON.parse(await e.text()),s=Yt(t)?await Gs(t):t;if(!s||!Array.isArray(s.exercises)||!Array.isArray(s.workouts)||!Array.isArray(s.sets))throw new Error("File doesn't look like a Lift backup.");return await yt({exercises:s.exercises,workouts:s.workouts,sets:s.sets,stateOfMind:s.stateOfMind??[],medications:s.medications??[]}),await Ze(),{exercises:s.exercises.length,workouts:s.workouts.length,sets:s.sets.length,stateOfMind:(s.stateOfMind??[]).length}}function Kt(){let e=nt();F({html:`
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
            <div class="stat-value" id="bk-pass" style="font-variant-numeric: tabular-nums; letter-spacing: 0.5px; color: var(--text); -webkit-user-select: all; user-select: all;">${M(e)}</div>
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
    `,onMount(t,s){t.querySelector("#bk-close").addEventListener("click",()=>s()),t.querySelector("#bk-copy").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(e),I("Password copied \u2014 save it in your Passwords app")}catch{I("Copy failed \u2014 long-press the password to select it")}}),t.querySelector("#bk-export").addEventListener("click",async()=>{try{let{filename:i,bytes:n}=await rt();I(`Exported ${i} (${Qs(n)})`)}catch(i){I(`Export failed: ${i.message}`)}});let o=t.querySelector("#bk-file");t.querySelector("#bk-import").addEventListener("click",()=>{o.value="",o.click()}),o.addEventListener("change",async i=>{let n=i.target.files?.[0];if(n&&confirm("Replace all current data with this backup? This cannot be undone."))try{let r=await Xs(n);s(),I(`Restored ${r.workouts} workouts, ${r.exercises} exercises`),H("data:changed")}catch(r){I(`Restore failed: ${r.message}`)}})}})}function Qs(e){return e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/(1024*1024)).toFixed(1)} MB`}var Qt=["Amazed","Excited","Happy","Joyful","Content","Calm","Relieved","Grateful","Hopeful","Confident","Proud","Surprised","Indifferent","Anxious","Stressed","Overwhelmed","Frustrated","Angry","Irritated","Sad","Lonely","Discouraged","Drained","Worried","Embarrassed"],Jt=["Health","Fitness","Self-Care","Hobbies","Identity","Community","Family","Friends","Partner","Work","Education","Money","Weather","Tasks"];function Js(e){let t=Number(e);return isFinite(t)?Math.max(-1,Math.min(1,t)):0}async function Zt({id:e,kind:t,valence:s,labels:o,associations:i,date:n}){let r={id:e||z(),kind:t==="dailyMood"?"dailyMood":"momentaryEmotion",date:n||Date.now(),valence:Js(s),labels:o||[],associations:i||[]};return await q("stateOfMind",r),r}async function es({id:e,nickname:t,form:s,hasSchedule:o,doseAmount:i,doseUnit:n}){let r=(t||"").trim()||"Medication",a=e?await Q("medications",e):null,u=Number(i),d={id:e||z(),nickname:r,isArchived:a?!!a.isArchived:!1,hasSchedule:!!o,doseAmount:u>0?u:1,doseUnit:(n||"").trim(),concept:{identifier:a?.concept?.identifier||"",displayText:a?.concept?.displayText||r,form:(s||"").trim(),rxnorm:a?.concept?.rxnorm||[]}};return await q("medications",d),d}async function at(e,t){await ce(e,t)}async function ct(){let[e,t]=await Promise.all([A("stateOfMind"),A("medications")]);return e.sort((s,o)=>s.date-o.date),t.sort((s,o)=>(s.nickname||"").localeCompare(o.nickname||"")),{stateOfMind:e,medications:t}}var Gt=e=>{let t=new Date(e);return`${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`},Xt=e=>e.length?e.reduce((t,s)=>t+s,0)/e.length:null;function ts(e,t){let s=new Set(t.map(a=>Gt(a.startedAt))),o=[],i=[];for(let a of e)(s.has(Gt(a.date))?o:i).push(a.valence);let n=Xt(o),r=Xt(i);return{onWorkout:n,offWorkout:r,delta:n!=null&&r!=null?n-r:null,onCount:o.length,offCount:i.length}}var Zs=e=>new Date(e).toLocaleTimeString(void 0,{hour:"numeric",minute:"2-digit"}),rs='<span style="font-size: 24px;">+</span>';async function lt(e,t){let s=()=>lt(e,t);e.setTitle("State of Mind"),e.setBack(t),e.setAction({html:rs,onClick:()=>ns(s)});let[{stateOfMind:o},i]=await Promise.all([ct(),Z()]),n=ts(o,i);e.container.innerHTML=`
    ${o.length?`
      <div class="section">Summary</div>
      <div class="form-section">
        <div class="stat-row"><div class="stat-label">Entries</div><div class="stat-value">${o.length.toLocaleString()}</div></div>
        <div class="stat-row"><div class="stat-label">Range</div><div class="stat-value">${K(o[0].date)} \u2013 ${K(o[o.length-1].date)}</div></div>
        <div class="stat-row"><div class="stat-label">Average mood</div><div class="stat-value">${He(no(o))}</div></div>
      </div>

      <div class="section">Mood vs. training</div>
      <div class="form-section">
        <div class="stat-row"><div class="stat-label">On workout days</div><div class="stat-value">${n.onWorkout!=null?He(n.onWorkout)+` (${n.onCount})`:"\u2014"}</div></div>
        <div class="stat-row"><div class="stat-label">On rest days</div><div class="stat-value">${n.offWorkout!=null?He(n.offWorkout)+` (${n.offCount})`:"\u2014"}</div></div>
        <div class="stat-row"><div class="stat-label">Difference</div><div class="stat-value">${n.delta!=null?(n.delta>=0?"+":"")+n.delta.toFixed(2):"\u2014"}</div></div>
      </div>

      <div class="section">Recent entries</div>
      <div class="list">${o.slice(-30).reverse().map(eo).join("")}</div>
    `:cs("\u{1F9E0}","No mood entries","Tap \uFF0B to log how you're feeling.")}
  `,e.container.scrollTop=0;for(let r of e.container.querySelectorAll("[data-edit-som]")){let a=o.find(u=>u.id===r.dataset.editSom);a&&r.addEventListener("click",()=>ns(s,a))}}function eo(e){let t=e.kind==="dailyMood",s=e.labels.length?e.labels.join(", "):t?"Daily mood":"Momentary emotion",o=[...e.labels.length?[t?"Daily mood":"Moment"]:[],K(e.date),Zs(e.date),...e.associations.length?[e.associations.join(", ")]:[]].join(" \xB7 ");return`
    <button class="list-row" data-edit-som="${M(e.id)}">
      <div class="row-main">
        <div class="row-title">${M(s)}</div>
        <div class="row-subtitle">${M(o)}</div>
      </div>
      <div class="row-trailing">${He(e.valence)}</div>
      <div class="chevron">\u203A</div>
    </button>`}async function dt(e,t){let s=()=>dt(e,t);e.setTitle("Medications"),e.setBack(t),e.setAction({html:rs,onClick:()=>is(s)});let{medications:o}=await ct();e.container.innerHTML=o.length?`
    <div class="section">Daily</div>
    ${ss(o.filter(n=>n.hasSchedule))}
    ${ss(o.filter(n=>!n.hasSchedule),"As needed")}
    <div class="section-footer">Tap a medication to edit its name, form, or amount.</div>
  `:cs("\u{1F48A}","No medications","Tap \uFF0B to add the medications you take."),e.container.scrollTop=0;let i=new Map(o.map(n=>[n.id,n]));for(let n of e.container.querySelectorAll("[data-edit-med]")){let r=i.get(n.dataset.editMed);r&&n.addEventListener("click",()=>is(s,r))}}function ss(e,t){return e.length===0?"":`
    ${t?`<div class="section">${M(t)}</div>`:""}
    <div class="list">${e.map(to).join("")}</div>`}function to(e){let t=so(e);return`
    <button class="list-row" data-edit-med="${M(e.id)}">
      <div class="row-main">
        <div class="row-title">${M(e.nickname||e.concept.displayText)}</div>
        ${t?`<div class="row-subtitle">${M(t)}</div>`:""}
      </div>
      <div class="chevron">\u203A</div>
    </button>`}function so(e){let t=as(e),s=(e.concept?.form||"").trim(),o=(e.doseUnit||"").trim();if(s&&t>1&&o&&s.toLowerCase().includes(o.toLowerCase()))return`${ls(t)} \xD7 ${s}`;if(s&&t===1)return s;let i=oo(t,o);return s?`${i} \xB7 ${s}`:i}var as=e=>Number(e?.doseAmount)>0?Number(e.doseAmount):1;function oo(e,t){let s=(t||"").trim()||"dose",o=e===1||/^(mg|mcg|ml|cc|g|kg|l|oz|iu)$/i.test(s)||s.endsWith("s")?s:`${s}s`;return`${ls(e)} ${o}`}function cs(e,t,s){return`
    <div class="empty-state" style="padding: 48px 24px; min-height: auto;">
      <div class="empty-icon">${e}</div>
      <h2>${M(t)}</h2>
      <p>${M(s)}</p>
    </div>`}function no(e){return e.reduce((t,s)=>t+s.valence,0)/e.length}var ls=e=>Number.isInteger(e)?String(e):String(Number(e.toFixed(3)));function ds(e){return e>=.7?["Very pleasant","#2ba758"]:e>=.4?["Pleasant","#54a85a"]:e>=.1?["Slightly pleasant","#9cad46"]:e>-.1?["Neutral","#8a8a8e"]:e>-.4?["Slightly unpleasant","#d99a3c"]:e>-.7?["Unpleasant","#e07a4e"]:["Very unpleasant","#e0574f"]}function He(e){let[t,s]=ds(e);return`<span class="hz-pill" style="--pc: ${s};">${M(t)}</span>`}function us(e){let t=new Date(e),s=o=>String(o).padStart(2,"0");return`${t.getFullYear()}-${s(t.getMonth()+1)}-${s(t.getDate())}T${s(t.getHours())}:${s(t.getMinutes())}`}var io=()=>us(Date.now());function ro(e){let t=e?new Date(e).getTime():NaN;return isFinite(t)?t:Date.now()}var ao=e=>Math.max(-3,Math.min(3,Math.round(e*3)));function os(e,t=[]){return e.map(s=>`<button type="button" class="chip${t.includes(s)?" active":""}" data-chip="${M(s)}">${M(s)}</button>`).join("")}function Fe(e,t,s={}){for(let o of e.querySelectorAll(`${t} .chip`))o.addEventListener("click",()=>{s.single&&e.querySelectorAll(`${t} .chip`).forEach(i=>i.classList.remove("active")),o.classList.toggle("active",s.single?!0:!o.classList.contains("active"))})}var Re=(e,t)=>[...e.querySelectorAll(`${t} .chip.active`)].map(s=>s.dataset.chip);function ns(e,t=null){let s=!!t,o=s&&t.kind==="dailyMood",i=s?ao(t.valence):1,n=s?t.valence:i/3,r=F({html:`
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
          <input type="range" class="mood-slider" id="som-val" min="-3" max="3" step="1" value="${i}" />
        </div>
        <div class="section">Emotions (optional)</div>
        <div class="chip-row" id="som-emotions" style="flex-wrap: wrap;">${os(Qt,s?t.labels:[])}</div>
        <div class="section">What's affecting you? (optional)</div>
        <div class="chip-row" id="som-assoc" style="flex-wrap: wrap;">${os(Jt,s?t.associations:[])}</div>
        <div class="section">When</div>
        <div class="form-section">
          <div class="form-row"><input type="datetime-local" id="som-date" value="${s?us(t.date):io()}" style="text-align: left;" /></div>
        </div>
        ${s?`
        <div style="height: 8px;"></div>
        <div class="form-section">
          <button class="list-row button destructive" id="som-delete"><div class="row-main"><div class="row-title" style="color: var(--red);">Delete Entry</div></div></button>
        </div>`:""}
        <div style="height: 16px;"></div>
      </div>
    `,onMount(a){let u=a.querySelector("#som-val"),d=a.querySelector("#som-val-label"),w=()=>{d.textContent=ds(Number(u.value)/3)[0]};w(),u.addEventListener("input",()=>{n=Number(u.value)/3,w()}),Fe(a,"#som-kind",{single:!0}),Fe(a,"#som-emotions"),Fe(a,"#som-assoc"),a.querySelector("#som-cancel").addEventListener("click",()=>r()),a.querySelector("#som-save").addEventListener("click",async()=>{await Zt({id:t?.id,kind:Re(a,"#som-kind")[0]||"momentaryEmotion",valence:n,labels:Re(a,"#som-emotions"),associations:Re(a,"#som-assoc"),date:ro(a.querySelector("#som-date").value)}),r(),I(s?"Entry updated":"Logged State of Mind"),e?.()}),a.querySelector("#som-delete")?.addEventListener("click",async()=>{confirm("Delete this entry?")&&(await at("stateOfMind",t.id),r(),I("Entry deleted"),e?.())})}})}function is(e,t=null){let s=!!t,o=s?!!t.hasSchedule:!0,i=F({html:`
      <div class="sheet-header">
        <button class="btn-text" id="med-cancel">Cancel</button>
        <div class="title">${s?"Edit Medication":"Add Medication"}</div>
        <button class="btn-text primary" id="med-save"${s?"":" disabled"}>Save</button>
      </div>
      <div class="sheet-content">
        <div class="section">Name</div>
        <div class="form-section">
          <div class="form-row"><input id="med-name" placeholder="e.g. Sertraline" value="${s?M(t.nickname||t.concept.displayText):""}" style="text-align: left;" /></div>
        </div>
        <div class="section">Form (optional)</div>
        <div class="form-section">
          <div class="form-row"><input id="med-form" placeholder="e.g. tablet, 50 mg" value="${s?M(t.concept?.form||""):""}" style="text-align: left;" /></div>
        </div>
        <div class="section">Amount per dose</div>
        <div class="form-section">
          <div class="form-row"><input type="number" id="med-amount" inputmode="decimal" min="0" step="0.25" value="${s?M(String(as(t))):"1"}" style="text-align: left;" /></div>
          <div class="form-row"><input id="med-unit" placeholder="unit \u2014 e.g. capsule, tablet, mg" value="${s?M(t.doseUnit||""):""}" style="text-align: left;" /></div>
        </div>
        <div class="section-footer">How many you take at once \u2014 4 capsules, 1 tablet, 10 mg.</div>
        <div class="section">Type</div>
        <div class="chip-row" id="med-type">
          <button type="button" class="chip${o?" active":""}" data-chip="daily">Daily</button>
          <button type="button" class="chip${o?"":" active"}" data-chip="asneeded">As needed</button>
        </div>
        <div class="section-footer">Daily medications are listed first; as-needed ones are grouped separately.</div>
        ${s?`
        <div class="form-section">
          <button class="list-row button destructive" id="med-delete"><div class="row-main"><div class="row-title" style="color: var(--red);">Delete Medication</div></div></button>
        </div>`:""}
        <div style="height: 16px;"></div>
      </div>
    `,onMount(n){let r=n.querySelector("#med-name"),a=n.querySelector("#med-save");r.addEventListener("input",()=>{a.disabled=r.value.trim().length===0}),Fe(n,"#med-type",{single:!0}),n.querySelector("#med-cancel").addEventListener("click",()=>i()),a.addEventListener("click",async()=>{r.value.trim()&&(await es({id:t?.id,nickname:r.value,form:n.querySelector("#med-form").value,hasSchedule:(Re(n,"#med-type")[0]||"daily")==="daily",doseAmount:n.querySelector("#med-amount").value,doseUnit:n.querySelector("#med-unit").value}),i(),I(s?"Medication updated":"Medication added"),e?.())}),n.querySelector("#med-delete")?.addEventListener("click",async()=>{confirm("Delete this medication?")&&(await at("medications",t.id),i(),I("Medication deleted"),e?.())}),s||setTimeout(()=>r.focus(),50)}})}var Oe=[{key:"1W",tick:"1W",days:7},{key:"1M",tick:"1M",days:30},{key:"3M",tick:"3M",days:90},{key:"1Y",tick:"1Y",days:365},{key:"All",tick:"All",all:!0}];function co(e){let t=new Map;for(let s of e){let o=new Date(s.date),i=`${o.getFullYear()}-${o.getMonth()}-${o.getDate()}`,n=t.get(i)||{date:s.date,total:0,count:0};n.total+=s.value,n.count+=1,n.date=Math.min(n.date,s.date),t.set(i,n)}return[...t.values()].map(s=>({date:s.date,value:s.total/s.count})).sort((s,o)=>s.date-o.date)}function ge(e,t,s={}){let o=t.length>0&&t[0].points!==void 0,i=(o?t:[{points:t}]).map(p=>({label:p.label??"",color:p.color||"var(--accent)",points:co(p.points)})).filter(p=>p.points.length>0),n=s.defaultPeriod||"All",r=Math.max(0,Oe.findIndex(p=>p.key===n)),a=Oe.length-1,u=null;function d(){let p=Oe[r],c=i.map((g,D)=>u===null||D===u?g.points:[]);if(p.all)return c;let h=Date.now()-p.days*864e5,y=c.map(g=>g.filter(D=>D.date>=h));return y.every(g=>g.length===0)?c.map(g=>g.slice(-1)):y}let w=o&&i.some(p=>p.label)?`<div class="chart-legend">${i.map((p,c)=>`<button class="legend-item" data-i="${c}" style="--dcolor: ${p.color};" aria-pressed="false">${p.label}</button>`).join("")}</div>`:"";e.innerHTML=`
    <div class="chart-scrub-readout" data-role="scrub"></div>
    ${w}
    <div class="chart-container" data-role="chart"></div>
    <div class="chart-daterange" data-role="range"></div>
    <div class="chart-slider">
      <input type="range" class="chart-range" min="0" max="${a}" step="1"
             value="${r}" aria-label="Time range" />
      <div class="chart-slider-ticks">
        ${Oe.map((p,c)=>`<span data-i="${c}">${p.tick}</span>`).join("")}
      </div>
    </div>
  `;let S=e.querySelector('[data-role="scrub"]'),l=e.querySelector('[data-role="chart"]'),f=e.querySelector('[data-role="range"]'),b=e.querySelector(".chart-range"),L=[...e.querySelectorAll(".chart-slider-ticks span")],v=s.unit||"lbs",m=null;function $(){let p=d(),c=lo(p,i,v);l.innerHTML=c.html,m=c.geom;let h=p.flat();if(h.length>=2){let y=Math.min(...h.map(D=>D.date)),g=Math.max(...h.map(D=>D.date));f.innerHTML=`<span>${ut(y)}</span><span>${ut(g)}</span>`}else f.innerHTML="";L.forEach((y,g)=>y.classList.toggle("active",g===r))}b.addEventListener("input",()=>{r=Number(b.value),B(),$()});let x=[...e.querySelectorAll(".chart-legend .legend-item")];for(let p of x)p.addEventListener("click",()=>{let c=Number(p.dataset.i);u=u===c?null:c,x.forEach((h,y)=>{h.classList.toggle("dimmed",u!==null&&y!==u),h.setAttribute("aria-pressed",String(u===y))}),B(),$()});function k(p){if(!m||m.pts.length<2)return;let c=l.querySelector("svg"),h=c?.getScreenCTM();if(!h)return;let y=new DOMPoint(p,0).matrixTransform(h.inverse()).x,g=0,D=1/0;m.pts.forEach((W,U)=>{let Y=Math.abs(W.x-y);Y<D&&(D=Y,g=U)});let E=m.pts[g],C=c.querySelector(".chart-scrub-line"),P=c.querySelector(".chart-scrub-dot");C&&(C.setAttribute("x1",E.x),C.setAttribute("x2",E.x),C.removeAttribute("visibility")),P&&(P.setAttribute("cx",E.x),P.setAttribute("cy",E.y),P.style.fill=E.color,P.removeAttribute("visibility"));let V=E.label?` \xB7 ${E.label}`:"";S.textContent=`${ut(E.date)}${V} \xB7 ${Math.round(E.value).toLocaleString()} ${v}`}function B(){S.textContent="";let p=l.querySelector("svg");p?.querySelector(".chart-scrub-line")?.setAttribute("visibility","hidden"),p?.querySelector(".chart-scrub-dot")?.setAttribute("visibility","hidden")}let T=!1;l.addEventListener("pointerdown",p=>{T=!0,l.setPointerCapture?.(p.pointerId),k(p.clientX)}),l.addEventListener("pointermove",p=>{T&&k(p.clientX)});for(let p of["pointerup","pointercancel"])l.addEventListener(p,()=>{T=!1,B()});$()}function ut(e){return new Date(e).toLocaleDateString(void 0,{month:"short",day:"numeric",year:"numeric"})}function lo(e,t,s){let n={top:16,right:14,bottom:14,left:52},r=400-n.left-n.right,a=200-n.top-n.bottom,u=e.flat();if(u.length===0)return{html:`<svg viewBox="0 0 400 200"><text x="${400/2}" y="${200/2}" text-anchor="middle" class="chart-axis-label">No data in range</text></svg>`,geom:null};if(u.length===1){let g=u[0],D=t[e.findIndex(P=>P.length>0)]?.color||"var(--accent)",E=n.left+r/2,C=n.top+a/2;return{html:`<svg viewBox="0 0 400 200"><circle cx="${E}" cy="${C}" r="4" class="chart-point" style="fill: ${D};"/><text x="${E}" y="${C-10}" text-anchor="middle" class="chart-axis-label">${Math.round(g.value).toLocaleString()} ${s}</text></svg>`,geom:null}}let d=u.map(g=>g.date),w=u.map(g=>g.value),S=Math.min(...d),l=Math.max(...d),f=Math.max(...w),b=Math.min(...w),L=Math.max(f-b,1),v=Math.max(0,b-L*.12),m=f+L*.12,$=g=>n.left+(g-S)/Math.max(l-S,1)*r,x=g=>n.top+a-(g-v)/(m-v)*a,k=4,B=g=>Math.round(g).toLocaleString(),T=Array.from({length:k+1},(g,D)=>{let E=v+(m-v)*D/k,C=x(E);return`<text x="${n.left-6}" y="${C+3}" text-anchor="end" class="chart-axis-label">${B(E)}</text>`}).join(""),p=Array.from({length:k+1},(g,D)=>{let E=n.top+a*D/k;return`<line x1="${n.left}" x2="${400-n.right}" y1="${E}" y2="${E}" class="chart-axis-line"/>`}).join(""),c=[],h=e.map((g,D)=>{let E=t[D],C=g.map(P=>({x:$(P.date),y:x(P.value)}));return g.forEach((P,V)=>c.push({...C[V],date:P.date,value:P.value,label:E.label,color:E.color})),C.length===0?"":C.length===1?`<circle cx="${C[0].x}" cy="${C[0].y}" r="3.5" class="chart-point" style="fill: ${E.color};"/>`:`<path d="${uo(C)}" class="chart-line" style="stroke: ${E.color};"/>`}).join("");return{html:`
    <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet">
      ${p}
      ${T}
      ${h}
      <line class="chart-scrub-line" y1="${n.top}" y2="${n.top+a}" x1="0" x2="0" visibility="hidden"/>
      <circle class="chart-scrub-dot" r="4.5" visibility="hidden"/>
    </svg>
  `,geom:{pts:c}}}function uo(e){if(e.length<2)return"";let t=`M ${e[0].x.toFixed(1)} ${e[0].y.toFixed(1)}`;for(let s=0;s<e.length-1;s++){let o=e[s===0?0:s-1],i=e[s],n=e[s+1],r=e[s+2]||n,a=i.x+(n.x-o.x)/6,u=i.y+(n.y-o.y)/6,d=n.x-(r.x-i.x)/6,w=n.y-(r.y-i.y)/6;t+=` C ${a.toFixed(1)} ${u.toFixed(1)}, ${d.toFixed(1)} ${w.toFixed(1)}, ${n.x.toFixed(1)} ${n.y.toFixed(1)}`}return t}var te=null;function fs(e){let t=!0;return ms().then(s=>{t&&(te=s,be(e))}).catch(s=>{t&&(e.container.innerHTML=ee(s))}),()=>{t=!1}}async function ms(){let[e,t,s]=await Promise.all([Z(),A("sets"),A("exercises")]),o=new Map(s.map(b=>[b.id,b])),i=new Map;for(let b of J(t))i.has(b.workoutId)||i.set(b.workoutId,[]),i.get(b.workoutId).push(b);let n=0,r=0,a=new Map,u=new Map,d=new Map,w=qt(e,i,o);for(let b of e){let L=i.get(b.id)||[],v=L.reduce((m,$)=>m+$.weight*$.reps,0);if(n+=v,r+=L.length,v>0){let m=w.get(b.id);a.has(m)||a.set(m,[]),a.get(m).push({date:b.startedAt,value:v})}for(let m of L){let $=o.get(m.exerciseId);if(!$)continue;let x=u.get(m.exerciseId)||{id:m.exerciseId,exercise:$,count:0};if(x.count+=1,u.set(m.exerciseId,x),m.weight>0&&m.reps>0){let k=d.get(m.exerciseId);(!k||m.weight>k.weight||m.weight===k.weight&&m.reps>k.reps)&&d.set(m.exerciseId,{id:m.exerciseId,weight:m.weight,reps:m.reps,date:b.startedAt,name:G($)})}}}let S=Array.from(u.entries()).sort((b,L)=>L[1].count-b[1].count).map(([,b])=>b),l=Array.from(d.values()).sort((b,L)=>L.weight-b.weight),f=N.filter(b=>a.has(b)).map(b=>({label:qe[b].short,color:Pe(b),points:a.get(b)}));return{workouts:e,allSets:t,allExercises:s,exMap:o,setsByWorkout:i,totalVolume:n,totalSets:r,volumeSeries:f,topExercises:S,prs:l}}function be(e){e.setTitle("Progress"),e.setBack(null),e.setAction({label:"Backup and restore",html:Dt(),onClick:()=>Kt()}),e.container.scrollTop=0;let t=`
    <button class="list-row" data-page="meds">
      <div class="row-main"><div class="row-title">Medications</div></div>
      <div class="chevron">\u203A</div>
    </button>`;if(!te||te.workouts.length===0){e.container.innerHTML=`
      <div class="empty-state" style="padding: 48px 24px; min-height: auto;">
        <div class="empty-icon">\u{1F4C8}</div>
        <h2>No data yet</h2>
        <p>Finish a workout and your stats and trends will show up here.</p>
      </div>
      <div class="list">${t}</div>
    `,ps(e);return}let{workouts:s,totalVolume:o,totalSets:i,volumeSeries:n,topExercises:r,prs:a}=te;e.container.innerHTML=`
    <div class="section">Totals</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Total Volume</div><div class="stat-value">${de(o)}</div></div>
      <div class="stat-row"><div class="stat-label">Total Sets</div><div class="stat-value">${i.toLocaleString()}</div></div>
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
  `;let u=e.container.querySelector(".volume-chart-mount");u&&n.length>0&&ge(u,n,{unit:"lbs"}),ps(e)}function ps(e){for(let t of e.container.querySelectorAll("[data-page]"))t.addEventListener("click",()=>{let s=t.dataset.page;s==="trained"?po(e):s==="prs"?fo(e):s==="history"?vs(e):s==="meds"&&dt(e,()=>be(e))})}function po(e){e.setTitle("Most-Trained"),e.setBack(()=>be(e)),e.setAction(null);let{topExercises:t}=te;e.container.innerHTML=`
    <div class="list" style="margin-top: 16px;">
      ${t.map(s=>`
        <button class="list-row" data-exercise-id="${M(s.id)}">
          ${oe(s.exercise)}
          <div class="row-trailing trailing-stack">${ne(s.count)}</div>
          <div class="chevron">\u203A</div>
        </button>
      `).join("")}
    </div>
  `,e.container.scrollTop=0,pt(e)}function fo(e){e.setTitle("Personal Records"),e.setBack(()=>be(e)),e.setAction(null);let{prs:t}=te;e.container.innerHTML=`
    <div class="section-footer" style="margin-top: 16px;">Heaviest set ever recorded per exercise.</div>
    <div class="list">
      ${t.map(s=>`
        <button class="list-row" data-exercise-id="${M(s.id)}" style="align-items: flex-start;">
          <div class="row-main">
            <div class="row-title">${M(s.name)}</div>
            <div class="row-subtitle">${K(s.date)}</div>
          </div>
          <div class="row-trailing" style="text-align: right;">
            <div style="font-weight: 600; color: var(--text);">${ye(s.weight)} lbs</div>
            <div style="font-size: 12px; color: var(--text-tertiary);">${s.reps} rep${s.reps===1?"":"s"}</div>
          </div>
          <div class="chevron">\u203A</div>
        </button>
      `).join("")}
    </div>
  `,e.container.scrollTop=0,pt(e)}function pt(e){for(let t of e.container.querySelectorAll("[data-exercise-id]"))t.addEventListener("click",()=>{Ne(t.dataset.exerciseId)})}function vs(e){e.setTitle("Workout History"),e.setBack(()=>be(e)),e.setAction(null);let{workouts:t,setsByWorkout:s,exMap:o}=te;e.container.innerHTML=`
    <div class="list" style="margin-top: 16px;">
      ${t.map(i=>mo(i,s.get(i.id)||[],o)).join("")}
    </div>
  `,e.container.scrollTop=0;for(let i of e.container.querySelectorAll("[data-workout-id]"))i.addEventListener("click",()=>{let n=i.dataset.workoutId;vo(e,n).catch(r=>{e.container.innerHTML=ee(r)})})}function mo(e,t,s){let o=t,i=o.reduce((u,d)=>u+d.weight*d.reps,0),n=(e.endedAt-e.startedAt)/1e3,r=[],a=new Set;for(let u of t){if(a.has(u.exerciseId))continue;a.add(u.exerciseId);let d=s.get(u.exerciseId);if(d&&r.push(d.name),r.length>=3)break}return`
    <button class="list-row" data-workout-id="${e.id}">
      <div class="row-main">
        <div class="row-title" style="font-weight: 600;">${M(e.name)}</div>
        <div class="row-subtitle" style="margin-top: 4px;">
          ${K(e.startedAt)} \xB7 ${Ke(n)} \xB7 ${o.length} sets \xB7 ${de(i)}
        </div>
        ${r.length>0?`<div class="row-subtitle" style="margin-top: 4px;">${M(r.join(" \xB7 "))}${a.size>3?" \u2026":""}</div>`:""}
      </div>
      <div class="chevron">\u203A</div>
    </button>
  `}async function hs(e){let[t,s,o]=await Promise.all([Q("workouts",e),A("exercises"),wt(e)]);if(!t)return null;let i=new Map(s.map(l=>[l.id,l])),n=new Map,r=[];for(let l of o)n.has(l.exerciseId)||(n.set(l.exerciseId,[]),r.push(l.exerciseId)),n.get(l.exerciseId).push(l);let a=J(o),u=a.reduce((l,f)=>l+f.weight*f.reps,0),d=a.length,w=(t.endedAt-t.startedAt)/1e3,S=`
    <div class="section">Summary</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Date</div><div class="stat-value">${Et(t.startedAt)}</div></div>
      <div class="stat-row"><div class="stat-label">Duration</div><div class="stat-value">${Ke(w)}</div></div>
      <div class="stat-row"><div class="stat-label">Total Volume</div><div class="stat-value">${de(u)}</div></div>
      <div class="stat-row"><div class="stat-label">Completed Sets</div><div class="stat-value">${d}</div></div>
    </div>

    ${r.map(l=>{let f=i.get(l),b=n.get(l),L=0,v=0;return`
        ${f?`<button class="section section-link" data-exercise-id="${M(l)}">${M(G(f))}<span class="name-chevron">\u203A</span></button>`:'<div class="section">Unknown exercise</div>'}
        <div class="form-section">
          ${b.map($=>{let k=($.setType||"working")==="warmup"?`W${++v}`:String(++L);return`
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
  `;return{workout:t,html:S,sets:o}}function ys(e,t){for(let s of e.querySelectorAll("input.hist-input[data-set-id]"))s.addEventListener("input",async()=>{let o=t.find(i=>i.id===s.dataset.setId);o&&(s.dataset.field==="weight"?o.weight=parseFloat(s.value)||0:o.reps=parseInt(s.value,10)||0,await q("sets",{...o}))})}async function vo(e,t){e.setBack(async()=>{te=await ms(),vs(e)}),e.setAction({label:"Delete workout",html:Te(),onClick:async()=>{confirm("Delete this workout?")&&(await Be(t),H("data:changed"))}});let s=await hs(t);if(!s){e.container.innerHTML=ee({message:"Workout not found."});return}e.setTitle(s.workout.name),e.container.innerHTML=s.html,e.container.scrollTop=0,pt(e),ys(e.container,s.sets)}async function ws(e){let t=await hs(e);if(!t)return;let s=F({html:`
      <div class="sheet-header">
        <button class="btn-text" id="wd-close">Done</button>
        <div class="title">${M(t.workout.name)}</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">${t.html}</div>
    `,onMount(o){o.querySelector("#wd-close").addEventListener("click",()=>s());for(let i of o.querySelectorAll("[data-exercise-id]"))i.addEventListener("click",()=>Ne(i.dataset.exerciseId));ys(o,t.sets)}})}function gs(e){let t=!0;return bs(e).catch(s=>{t&&(e.container.innerHTML=ee(s))}),()=>{t=!1}}async function bs(e){e.setTitle("Exercises"),e.setBack(null),e.setAction({label:"Add exercise",html:'<span style="font-size: 24px;">+</span>',onClick:()=>{xe(null)}});let[t,s]=await Promise.all([A("exercises"),A("sets")]),o=t.sort((l,f)=>l.name.localeCompare(f.name)),i=new Map;for(let l of s)i.set(l.exerciseId,(i.get(l.exerciseId)??0)+1);let n="",r=null;e.container.innerHTML=`
    <div class="search-bar">
      <input class="search-input" id="ex-search" placeholder="Search exercises" />
    </div>
    <div class="chip-row" id="ex-chips"></div>
    <div class="list" id="ex-list"></div>
  `,e.container.scrollTop=0;let a=e.container.querySelector("#ex-list"),u=e.container.querySelector("#ex-chips"),d=e.container.querySelector("#ex-search");function w(){u.innerHTML=Ie(o,r);for(let l of u.querySelectorAll(".chip"))l.addEventListener("click",()=>{let f=l.dataset.cat;r=f==="All"?null:f,w(),S()})}function S(){let l=o.filter(f=>!r||R(f)===r).filter(f=>!n||f.name.toLowerCase().includes(n.toLowerCase()));if(l.length===0){a.innerHTML='<div class="list-row"><div class="row-main" style="color: var(--text-secondary);">No matches</div></div>';return}a.innerHTML=l.map(f=>`
        <button class="list-row" data-id="${f.id}">
          ${oe(f)}
          <div class="row-trailing trailing-stack">${ne(i.get(f.id)??0)}</div>
          <div class="chevron">\u203A</div>
        </button>
      `).join("");for(let f of a.querySelectorAll("[data-id]"))f.addEventListener("click",()=>{ho(e,f.dataset.id).catch(b=>{e.container.innerHTML=ee(b)})})}d.addEventListener("input",()=>{n=d.value,S()}),w(),S()}function ho(e,t){return je(e,t,()=>bs(e))}async function je(e,t,s){e.setBack(s);let o=await ks(t);if(!o){e.container.innerHTML=ee({message:"Exercise not found."});return}e.setTitle(G(o.exercise)),e.setAction(o.exercise.isCustom?{label:"Delete exercise",html:Te(),onClick:async()=>{if(o.completed.length>0){alert(`Can't delete \u2014 this exercise has ${o.completed.length} logged set${o.completed.length===1?"":"s"}.`);return}confirm("Delete this custom exercise?")&&(await ce("exercises",t),H("data:changed"))}}:null),e.container.innerHTML=o.html,e.container.scrollTop=0,e.container.querySelector("#exd-edit")?.addEventListener("click",()=>{xe(o.exercise,()=>je(e,t,s))}),xs(e.container);let i=e.container.querySelector(".exercise-chart-mount");i&&o.chartData.length>0&&ge(i,o.chartData,{unit:"lbs"})}function xs(e){for(let t of e.querySelectorAll(".recent-set[data-workout-id]"))t.addEventListener("click",()=>ws(t.dataset.workoutId))}async function Ne(e){let t=await ks(e);if(!t)return;let s=F({html:`
      <div class="sheet-header">
        <button class="btn-text" id="exd-close">Done</button>
        <div class="title">${M(G(t.exercise))}</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">${t.html}</div>
    `,onMount(o){o.querySelector("#exd-close").addEventListener("click",()=>s()),o.querySelector("#exd-edit")?.addEventListener("click",()=>{xe(t.exercise,()=>{s(),H("data:changed"),Ne(e)})}),xs(o);let i=o.querySelector(".exercise-chart-mount");i&&t.chartData.length>0&&ge(i,t.chartData,{unit:"lbs"})}})}async function ks(e){let[t,s,o,i]=await Promise.all([Q("exercises",e),A("sets"),A("workouts"),le()]);if(!t)return null;let n=new Map(o.map(l=>[l.id,l])),r=J(s).filter(l=>l.exerciseId===e&&l.workoutId!==i?.id&&n.has(l.workoutId)).map(l=>({...l,workout:n.get(l.workoutId)})).sort((l,f)=>l.workout.startedAt-f.workout.startedAt),a=r.reduce((l,f)=>l+f.weight*f.reps,0),u=r.reduce((l,f)=>!l||f.weight>l.weight||f.weight===l.weight&&f.reps>l.reps?f:l,null),d=new Map;for(let l of r){if(l.weight<=0||l.reps<=0||(l.setType||"working")==="warmup")continue;let f=d.get(l.workoutId)||{date:l.workout.startedAt,total:0,count:0};f.total+=l.weight*l.reps,f.count+=1,d.set(l.workoutId,f)}let w=Array.from(d.values()).map(({date:l,total:f,count:b})=>({date:l,value:f/b})).sort((l,f)=>l.date-f.date),S=`
    <div class="section">Details</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Equipment</div><div class="stat-value">${M(t.equipment)}</div></div>
      <div class="stat-row"><div class="stat-label">Muscle</div><div class="stat-value">${M(R(t))}</div></div>
      <button class="list-row button" id="exd-edit">
        <div class="row-main"><div class="row-title" style="color: var(--accent);">Edit Name, Muscle & Equipment</div></div>
      </button>
    </div>

    ${r.length>0?`
      <div class="section">Stats</div>
      <div class="form-section">
        <div class="stat-row"><div class="stat-label">Total Sets</div><div class="stat-value">${r.length.toLocaleString()}</div></div>
        <div class="stat-row"><div class="stat-label">Total Volume</div><div class="stat-value">${de(a)}</div></div>
        ${u?`<div class="stat-row"><div class="stat-label">Best Set</div><div class="stat-value">${ye(u.weight)} \xD7 ${u.reps}</div></div>`:""}
      </div>
    `:""}

    ${w.length>0?`
      <div class="section">Avg working-set volume per workout</div>
      <div class="exercise-chart-mount"></div>
    `:""}

    ${r.length>0?`
      <div class="section">Recent Sets \xB7 tap to view that workout</div>
      <div class="form-section">
        ${r.slice(-30).reverse().map(l=>`
          <button class="stat-row recent-set" data-workout-id="${M(l.workoutId)}">
            <div class="stat-label" style="font-size: 13px; color: var(--text-secondary);">${K(l.workout.startedAt)}</div>
            <div class="stat-value" style="color: var(--text);">${ye(l.weight)} \xD7 ${l.reps} <span class="name-chevron">\u203A</span></div>
          </button>
        `).join("")}
      </div>
    `:`
      <div class="empty-state" style="padding: 32px 24px;">
        <p style="color: var(--text-secondary);">No completed sets yet.</p>
      </div>
    `}
  `;return{exercise:t,completed:r,chartData:w,html:S}}function Ls(e){let t=!0,s=null;return e.container.innerHTML="",le().then(o=>{t&&(o?s=bo(e,o):yo(e))}).catch(o=>{t&&(e.container.innerHTML=`<div class="empty-state"><div class="empty-icon">!</div><h2>Couldn't load</h2><p>${M(o.message)}</p></div>`)}),()=>{t=!1,typeof s=="function"&&s()}}async function yo(e){e.setTitle("Workout");let t=await Z(),s=t[0],o=Je(t),i=o?We(o.normalized):N[0],r=o&&Ss(o.startedAt)==="today"?"Tomorrow":"Today",a=s?`<div class="last-workout-hint">Last: <strong>${M(s.name)}</strong> \xB7 ${Ss(s.startedAt)}</div>`:"",u=`<div class="next-workout-hint">${r}: <strong>${M(i)}</strong></div>`;e.container.innerHTML=`
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
    </div>
  `,e.container.querySelector("#start-btn").addEventListener("click",()=>wo(i,r));for(let d of e.container.querySelectorAll("[data-nav]"))d.addEventListener("click",()=>lt(e,()=>e.refresh()))}function Ss(e){let t=new Date,s=new Date(e),o=n=>new Date(n.getFullYear(),n.getMonth(),n.getDate()).getTime(),i=Math.round((o(t)-o(s))/(1440*60*1e3));return i===0?"today":i===1?"yesterday":i<7?`${i} days ago`:i<14?"a week ago":`${Math.round(i/7)} weeks ago`}function wo(e,t="Today"){go(e,async s=>{let o={id:z(),name:s,startedAt:Date.now(),endedAt:null,notes:""};await q("workouts",o),H("workout:changed")},t)}function go(e,t,s="Today"){let i=F({html:`
      <div class="sheet-header">
        <button class="btn-text" id="wt-cancel">Cancel</button>
        <div class="title">New Workout</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">
        <div class="section">Pick a type</div>
        <div class="form-section">
          ${N.map(n=>{let a=n===e?` <span class="badge">${M(s)}</span>`:"";return`
              <button class="list-row button" data-name="${M(n)}">
                <div class="row-main"><div class="row-title" style="color: ${Pe(n)}; font-weight: 600;">${M(n)}${a}</div></div>
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
    `,onMount(n){n.querySelector("#wt-cancel").addEventListener("click",()=>i());for(let u of n.querySelectorAll(".list-row.button[data-name]"))u.addEventListener("click",()=>{let d=u.dataset.name;i(),t(d)});let r=n.querySelector("#wt-custom"),a=n.querySelector("#wt-go");r.addEventListener("input",()=>{a.disabled=r.value.trim().length===0}),a.addEventListener("click",()=>{let u=r.value.trim();u&&(i(),t(u))}),setTimeout(()=>r.focus(),50)}})}function bo(e,t){let s=[],o=[],i=new Map,n=new Map,r=null;e.container.innerHTML=`
    <div class="active-workout">
      <div class="workout-header">
        <input class="workout-name-input" id="wname" value="${M(t.name)}" placeholder="Workout name" />
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
  `,e.container.querySelector("#calc-fab").addEventListener("click",Ao);let a=()=>{e.setTitle(Lt((Date.now()-t.startedAt)/1e3))};a(),r=setInterval(a,1e3);let u=e.container.querySelector("#wname");u.addEventListener("input",async()=>{t.name=u.value,await q("workouts",{...t}),ie()});let d=new Map;e.container.querySelector("#add-exercise-btn").addEventListener("click",()=>{Eo(s,n,async v=>{await $o(t,o,v),await w()})}),e.container.querySelector("#finish-btn").addEventListener("click",async()=>{if(confirm("Finish this workout?")){await Lo(t,o);try{let{filename:v}=await rt();I(`Saved \xB7 backup: ${v}`)}catch(v){I(`Saved \xB7 backup failed: ${v.message}`)}H("workout:changed")}}),e.container.querySelector("#discard-btn").addEventListener("click",async()=>{confirm("Discard this workout? This cannot be undone.")&&(await Be(t.id),H("workout:changed"))});async function w(){let[v,m,$]=await Promise.all([A("sets"),A("workouts"),A("exercises")]);s=$,o=v.filter(x=>x.workoutId===t.id).sort((x,k)=>x.order-k.order),i=bt(v,m,t.id),d=f(v,$,t.id),n=new Map;for(let x of v)n.set(x.exerciseId,(n.get(x.exerciseId)??0)+1);L(),S()}function S(){let v=new Map(s.map(g=>[g.id,g])),m=[],$=new Map;for(let g of o){let D=v.get(g.exerciseId);if(!D)continue;let E=R(D);if(m.includes(E)||m.push(E),!g.completed)continue;let C=(g.weight||0)*(g.reps||0);C<=0||$.set(E,($.get(E)??0)+C)}let x=[...$.values()].reduce((g,D)=>g+D,0),k=e.container.querySelector("#workout-progress");if(!k)return;if(m.length===0){k.innerHTML="";return}let B=m.map(g=>{let D=d.get(g)??0,E=$.get(g)??0;return{muscle:g,record:D,cur:E,span:Math.max(D,E)}}),T=Math.max(...B.map(g=>g.span)),p=T>0?T*.12:1;B=B.map(g=>({...g,span:Math.max(g.span,p)}));let c=Math.max(...B.map(g=>g.span)),h=B.map(({muscle:g,record:D,cur:E,span:C})=>{let P=C/c*100,V=E>0?Math.min(100,E/C*100):0,W;if(D>0){let pe=Math.round(E/D*100);W=E>D?`${pe}% \u{1F525}`:`${pe}%`}else W=E>0?"new \u{1F525}":"new";let U=D>0?`${_(E)} / ${_(D)} \xB7 ${W}`:`${_(E)} \xB7 ${W}`,Y=It(g);return`
        <div class="vol-muscle" style="width: ${P.toFixed(2)}%; --mcolor: ${Y}; --mtext: ${Pt(Y)};" title="${M(g)}: ${_(E)} / record ${_(D)} lbs">
          <div class="vol-fill" style="width: ${V.toFixed(2)}%;"></div>
          <div class="vol-info${V>55?" on-fill":""}">
            <span class="seg-name">${M(g)}</span>
            <span class="seg-vol">${U}</span>
          </div>
        </div>
      `}).join(""),y=`<strong>${_(x)} lbs</strong> total`;k.innerHTML=`
      <div class="vol-bars">${h}</div>
      <div class="vol-label">${y}</div>
    `,requestAnimationFrame(()=>{for(let g of k.querySelectorAll(".vol-muscle"))l(g)})}function l(v){let m=v.querySelector(".seg-name"),$=v.querySelector(".seg-vol"),x=v.clientWidth-4;if(x<=0)return;if($){let B=10;for($.style.fontSize=`${B}px`;$.scrollWidth>x&&B>6;)B-=.5,$.style.fontSize=`${B}px`}if(!m)return;m.style.display="";let k=11;for(m.style.fontSize=`${k}px`;m.scrollWidth>x&&k>5;)k-=.5,m.style.fontSize=`${k}px`}function f(v,m,$){let x=new Map(m.map(T=>[T.id,T])),k=new Map,B=new Map;for(let T of J(v)){if(T.workoutId===$)continue;let p=x.get(T.exerciseId);if(!p)continue;let c=(T.weight||0)*(T.reps||0);if(c<=0)continue;let h=R(p),y=B.get(T.workoutId);y||B.set(T.workoutId,y=new Map),y.set(h,(y.get(h)??0)+c)}for(let T of B.values())for(let[p,c]of T)c>(k.get(p)??0)&&k.set(p,c);return k}async function b(v){if(!v.completed||(v.setType||"working")==="warmup"||!(v.weight>0)||!(v.reps>0))return;let m=s.find(c=>c.id===v.exerciseId);if(!m)return;let $=await A("sets"),x=J($).filter(c=>c.exerciseId===v.exerciseId&&c.id!==v.id&&(c.setType||"working")!=="warmup"&&c.weight>0&&c.reps>0);if(x.length===0)return;let k=[],B=x.reduce((c,h)=>Math.max(c,h.weight),0);v.weight>B&&k.push(`Heaviest weight ever: ${he(v.weight)} lbs`);let T=v.weight*v.reps,p=x.reduce((c,h)=>Math.max(c,h.weight*h.reps),0);if(T>p&&k.push(`Most volume in a set: ${he(v.weight)}\xD7${v.reps} = ${_(T)} lbs`),k.length>0){let c=k.length>1?"New records":"New record";I(`\u{1F3C6} ${G(m)} \u2014 ${c}!
${k.join(`
`)}`,0,{persistUntilClick:!0})}}function L(){let v=new Map(s.map(p=>[p.id,p])),m=[],$=new Map;for(let p of o)$.has(p.exerciseId)||($.set(p.exerciseId,[]),m.push(p.exerciseId)),$.get(p.exerciseId).push(p);for(let[,p]of $)p.sort((c,h)=>c.order-h.order);let x=e.container.querySelector("#exercise-sections");if(m.length===0){x.innerHTML=`
        <div class="empty-state" style="padding: 40px 24px; min-height: auto;">
          <p style="color: var(--text-secondary);">Add an exercise to start logging sets.</p>
        </div>`;return}x.innerHTML=m.map(p=>{let c=v.get(p),h=$.get(p),y=i.get(p)??new Map;return xo(c,h,y,n.get(p)??0)}).join("");function k(p){delete p.bumpedBy,delete p.preBumpWeight,delete p.preBumpReps}function B(p){let c=o.filter(E=>E.exerciseId===p.exerciseId).sort((E,C)=>E.order-C.order),h=p.setType||"working",y=0,g=0;for(let E of c)if(g+=1,(E.setType||"working")===h&&(y+=1),E.id===p.id)break;let D=ke(h,y,i.get(p.exerciseId),g);return D&&D.weight>0&&D.reps>0?{weight:D.weight,reps:D.reps}:null}async function T(p){await Ms(p.id,o),p.completed&&await $s(p,o,B);for(let c of o){if(c.exerciseId!==p.exerciseId)continue;let h=x.querySelector(`.set-row[data-set-id="${c.id}"]`);if(!h)continue;let y=h.querySelector(".weight-input"),g=h.querySelector(".reps-input");y&&document.activeElement!==y&&(y.value=c.weight>0?String(c.weight):""),g&&document.activeElement!==g&&(g.value=c.reps>0?String(c.reps):"")}}for(let p of x.querySelectorAll(".set-row-wrap")){let c=p.querySelector(".set-row"),h=c.dataset.setId,y=o.find(W=>W.id===h);if(!y)continue;let g=c.querySelector(".weight-input"),D=c.querySelector(".reps-input"),E=c.querySelector(".complete-btn");So(p,async()=>{await ce("sets",y.id),await w()});let C=Ge(async()=>{await T(y),y.completed&&S()},200);g.addEventListener("input",()=>{y.weight=parseFloat(g.value)||0,k(y),q("sets",{...y}).catch(W=>console.error("Set save failed",W)),C()});let P=Ge(async()=>{await T(y),y.completed&&S()},200);D.addEventListener("input",()=>{y.reps=parseInt(D.value,10)||0,k(y),q("sets",{...y}).catch(W=>console.error("Set save failed",W)),P()}),E.addEventListener("click",async()=>{let W=y.completed;y.completed=!y.completed,y.completed&&k(y),await q("sets",y),c.classList.toggle("completed",y.completed),E.innerHTML=Es(y.completed);let U=c.querySelector(".set-number")?.textContent?.trim()||"";E.setAttribute("aria-label",`${y.completed?"Mark incomplete":"Mark complete"} set ${U}`),S(),!W&&y.completed?(await $s(y,o,B)&&L(),await b(y)):W&&!y.completed&&await Ms(y.id,o)&&L()});let V=c.querySelector(".set-number");V&&V.addEventListener("click",async()=>{let U=(y.setType||"working")==="warmup"?"working":"warmup";if(y.setType=U,!y.completed){let Y=o.filter(re=>re.exerciseId===y.exerciseId).sort((re,Bs)=>re.order-Bs.order),pe=0,mt=0;for(let re of Y)if(mt+=1,(re.setType||"working")===U&&(pe+=1),re.id===y.id)break;let fe=ke(U,pe,i.get(y.exerciseId),mt);fe&&fe.weight>0&&fe.reps>0&&(y.weight=fe.weight,y.reps=fe.reps)}await q("sets",y),L()})}for(let p of x.querySelectorAll(".add-set-btn"))p.addEventListener("click",async()=>{let c=p.dataset.exerciseId;await Mo(t,o,c,i.get(c)??new Map),await w()});for(let p of x.querySelectorAll(".exercise-menu"))p.addEventListener("click",async()=>{let c=p.dataset.exerciseId;confirm("Remove this exercise from the workout?")&&(await Ye("sets",o.filter(h=>h.exerciseId===c).map(h=>h.id)),await w())});for(let p of x.querySelectorAll(".exercise-name-btn"))p.addEventListener("click",()=>{r&&(clearInterval(r),r=null),je(e,p.dataset.exerciseId,()=>e.refresh())})}return w(),()=>{r&&clearInterval(r)}}function xo(e,t,s=new Map,o=0){let i=0,n=0,r=t.map((a,u)=>{let d=a.setType||"working",w,S;d==="warmup"?(n+=1,S=n,w=`W${n}`):(i+=1,S=i,w=String(i));let l=ke(d,S,s,u+1);return ko(a,w,l)}).join("");return`
    <div class="exercise-section">
      <div class="exercise-section-header">
        <button class="exercise-name-btn" data-exercise-id="${e?.id}">${oe(e)}</button>
        <div class="row-trailing trailing-stack">${ne(o)}</div>
        <button class="menu exercise-menu" data-exercise-id="${e?.id}" aria-label="Remove ${M(G(e))} from workout">\xD7</button>
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
  `}function ke(e,t,s,o=null){if(!s||typeof s.get!="function")return null;let i=s.get(`${e}#${t}`);return i||(o!=null?s.get(`any#${o}`)??null:null)}function ko(e,t,s){let o=e.setType||"working",i=s&&s.weight>0&&s.reps>0?`${he(s.weight)} \xD7 ${s.reps}`:"\u2014";return`
    <div class="set-row-wrap" data-set-id="${e.id}">
      <button class="set-swipe-delete" data-set-id="${e.id}" aria-label="Delete set ${t}">Delete</button>
      <div class="set-row type-${o}${e.completed?" completed":""}" data-set-id="${e.id}">
        <button class="set-number" aria-label="Set ${t}, tap to mark as ${o==="warmup"?"working":"warmup"}">${t}</button>
        <div class="prev" aria-label="Previous">${i}</div>
        <input class="weight-input" type="number" inputmode="decimal" step="0.5" aria-label="Weight in pounds for set ${t}"
               placeholder="0" value="${e.weight>0?e.weight:""}" />
        <input class="reps-input" type="number" inputmode="numeric" step="1" aria-label="Repetitions for set ${t}"
               placeholder="0" value="${e.reps>0?e.reps:""}" />
        <button class="complete-btn" aria-label="${e.completed?"Mark incomplete":"Mark complete"} set ${t}">${Es(e.completed)}</button>
      </div>
    </div>
  `}function So(e,t){let s=e.querySelector(".set-row"),o=e.querySelector(".set-swipe-delete");if(!s||!o)return;let i=88,n=0,r=0,a=0,u=0,d=!1,w=!1,S=!1,l=!1,f=()=>Math.max(140,n*.5);function b(x,k){s.style.transition=k?"transform 0.18s ease":"none",s.style.transform=`translateX(${x}px)`,o.style.width=`${Math.max(i,-x)}px`,e.classList.toggle("will-delete",x<=-f())}function L(x=!0){S=!1,b(0,x),e.classList.remove("swiped-open")}function v(x=!0){document.querySelectorAll(".set-row-wrap.swiped-open").forEach(k=>{if(k!==e){let B=k.querySelector(".set-row");B&&(B.style.transition="transform 0.18s ease",B.style.transform="translateX(0)");let T=k.querySelector(".set-swipe-delete");T&&(T.style.width=""),k.classList.remove("swiped-open","will-delete")}}),S=!0,b(-i,x),e.classList.add("swiped-open")}function m(){s.style.transition="transform 0.16s ease-out",s.style.transform=`translateX(${-n}px)`,o.style.width=`${n}px`,setTimeout(t,150)}s.addEventListener("touchstart",x=>{n=e.clientWidth||s.clientWidth,r=x.touches[0].clientX,a=x.touches[0].clientY,u=S?-i:0,d=!0,w=!1,l=!!x.target.closest("input, button, select, textarea")},{passive:!0}),s.addEventListener("touchmove",x=>{if(!d)return;let k=x.touches[0].clientX-r,B=x.touches[0].clientY-a;if(!w){if(Math.abs(B)>Math.abs(k)+4){d=!1;return}Math.abs(k)>8&&(w=!0,l&&document.activeElement?.blur&&document.activeElement.blur())}if(!w)return;x.cancelable&&x.preventDefault();let T=S?-i:0;u=Math.min(0,Math.max(-n,T+k)),b(u,!1)},{passive:!1});function $(){d&&(d=!1,w&&(u<=-f()?m():u<-i/2?v():L()))}s.addEventListener("touchend",$),s.addEventListener("touchcancel",$),o.addEventListener("click",x=>{x.stopPropagation(),t()})}function Es(e){return e?'<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>':'<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>'}async function $o(e,t,s){let o=t.reduce((i,n)=>Math.max(i,n.order),-1)+1;for(let i of s){let n=(await gt(i,e.id)).filter(u=>(u.weight||0)>0&&(u.reps||0)>0),a=(n.length>0?n:[{weight:0,reps:0,setType:"working"}]).map(u=>({id:z(),workoutId:e.id,exerciseId:i,weight:u.weight??0,reps:u.reps??0,setType:u.setType||"working",completed:!1,order:o++,createdAt:Date.now()}));await ae("sets",a)}}async function $s(e,t,s){let o=(e.weight||0)*(e.reps||0);if(o<=0)return!1;let i=!1;for(let n of t)if(n.exerciseId===e.exerciseId&&n.id!==e.id&&!((n.order??0)<=(e.order??0))&&!n.completed&&(n.weight||0)*(n.reps||0)<o){if(n.bumpedBy==null){let r=s?.(n);n.preBumpWeight=r?r.weight:n.weight,n.preBumpReps=r?r.reps:n.reps}n.bumpedBy=e.id,n.weight=e.weight,n.reps=e.reps,await q("sets",n),i=!0}return i}async function Ms(e,t){let s=!1;for(let o of t)o.bumpedBy===e&&(o.completed||(o.preBumpWeight!=null&&(o.weight=o.preBumpWeight),o.preBumpReps!=null&&(o.reps=o.preBumpReps)),delete o.bumpedBy,delete o.preBumpWeight,delete o.preBumpReps,await q("sets",o),s=!0);return s}async function Mo(e,t,s,o=new Map){let i=t.filter(L=>L.exerciseId===s),n=i[i.length-1],r=L=>(L?.weight||0)*(L?.reps||0),a=i.filter(L=>(L.setType||"working")!=="warmup"),u=a.length+1,d=ke("working",u,o,i.length+1),w=a.filter(L=>L.weight>0&&L.reps>0).reduce((L,v)=>!L||r(v)>r(L)?v:L,null),S=a.some((L,v)=>{let m=ke("working",v+1,o);return m&&m.weight>0&&m.reps>0&&r(L)>r(m)}),l=n?.weight??0,f=n?.reps??0;w&&(!d||S)&&(l=w.weight,f=w.reps);let b={id:z(),workoutId:e.id,exerciseId:s,weight:l,reps:f,completed:!1,order:(n?.order??-1)+1,createdAt:Date.now()};await q("sets",b)}async function Lo(e,t){await Ye("sets",t.filter(s=>!s.completed&&((s.weight||0)===0||(s.reps||0)===0)).map(s=>s.id)),e.endedAt=Date.now(),await q("workouts",e)}function Eo(e,t,s){let o=new Set,i="",n=null,r=F({html:`
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
    `,onMount(a){let u=a.querySelector("#picker-list"),d=a.querySelector("#picker-add"),w=a.querySelector("#picker-cancel"),S=a.querySelector("#picker-custom"),l=a.querySelector("#picker-search"),f=a.querySelector("#picker-chips");function b(){f.innerHTML=Ie(e,n);for(let v of f.querySelectorAll(".chip"))v.addEventListener("click",()=>{let m=v.dataset.cat;n=m==="All"?null:m,b(),L()})}function L(){let v=e.filter(m=>!n||R(m)===n).filter(m=>!i||m.name.toLowerCase().includes(i.toLowerCase())).sort((m,$)=>{let x=t.get(m.id)??0,k=t.get($.id)??0;return x!==k?k-x:m.name.localeCompare($.name)});u.innerHTML=v.length===0?'<div class="list-row"><div class="row-main" style="color:var(--text-secondary)">No matches</div></div>':v.map(m=>`
                <button class="list-row" data-id="${m.id}">
                  ${oe(m)}
                  <div class="row-trailing trailing-stack">
                    ${ne(t.get(m.id)??0)}
                    ${o.has(m.id)?Do():""}
                  </div>
                </button>
              `).join("");for(let m of u.querySelectorAll(".list-row[data-id]"))m.addEventListener("click",()=>{let $=m.dataset.id;o.has($)?o.delete($):o.add($),d.disabled=o.size===0,d.textContent=o.size===0?"Add":`Add (${o.size})`,L()})}l.addEventListener("input",()=>{i=l.value,L()}),w.addEventListener("click",()=>r()),d.addEventListener("click",()=>{s(Array.from(o)),r()}),S.addEventListener("click",()=>{xe(null,async v=>{e.push(v),o.add(v.id),b(),L(),d.disabled=!1,d.textContent=`Add (${o.size})`})}),b(),L()}})}function Do(){return'<svg viewBox="0 0 24 24" width="22" height="22" fill="var(--green)"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'}function xe(e,t){let s=!!e,o=s?R(e):null,i=!o||we.includes(o)?we:[o,...we],n=e?.equipment,r=!n||Ce.includes(n)?Ce:[n,...Ce],a=F({html:`
      <div class="sheet-header">
        <button class="btn-text" id="ce-cancel">Cancel</button>
        <div class="title">${s?"Edit Exercise":"New Exercise"}</div>
        <button class="btn-text primary" id="ce-save" ${s?"":"disabled"}>Save</button>
      </div>
      <div class="sheet-content">
        <div class="section">Name</div>
        <div class="form-section">
          <div class="form-row">
            <input id="ce-name" placeholder="e.g. Cable Lateral Raise" style="text-align: left;" value="${M(e?.name??"")}" />
          </div>
        </div>
        <div class="section">Muscle</div>
        <div class="form-section">
          <div class="form-row">
            <label for="ce-cat">Muscle</label>
            <select id="ce-cat">${i.map(u=>`<option${u===o?" selected":""}>${M(u)}</option>`).join("")}</select>
          </div>
        </div>
        <div class="section">Equipment</div>
        <div class="form-section">
          <div class="form-row">
            <label for="ce-eq">Equipment</label>
            <select id="ce-eq">${r.map(u=>`<option${u===n?" selected":""}>${M(u)}</option>`).join("")}</select>
          </div>
        </div>
      </div>
    `,onMount(u){let d=u.querySelector("#ce-name"),w=u.querySelector("#ce-save");d.addEventListener("input",()=>{w.disabled=d.value.trim().length===0}),u.querySelector("#ce-cancel").addEventListener("click",()=>a()),w.addEventListener("click",async()=>{let S=d.value.trim();if(!S)return;let l=u.querySelector("#ce-cat").value,f=u.querySelector("#ce-eq").value,b=s?{...e,name:S,muscle:l,equipment:f}:{id:z(),name:S,muscle:l,category:l,equipment:f,notes:"",isCustom:!0,createdAt:Date.now()};await q("exercises",b),a(),t?.(b),s||H("data:changed")}),s||setTimeout(()=>d.focus(),50)}})}function Ao(){let t=[["AC","clear","fn"],["\xB1","sign","fn"],["\u232B","back","fn"],["\xF7","op","op"],["7","digit"],["8","digit"],["9","digit"],["\xD7","op","op"],["4","digit"],["5","digit"],["6","digit"],["\u2212","op","op"],["1","digit"],["2","digit"],["3","digit"],["+","op","op"],["0","digit","zero"],[".","dot"],["=","equals","op"]].map(([s,o,i])=>`<button class="calc-key${i?` calc-${i}`:""}" data-action="${o}" data-key="${M(s)}">${M(s)}</button>`).join("");F({html:`
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
    `,onMount(s,o){let i=s.querySelector("#calc-expr"),n=s.querySelector("#calc-result"),r={"+":(c,h)=>c+h,"\u2212":(c,h)=>c-h,"\xD7":(c,h)=>c*h,"\xF7":(c,h)=>h===0?NaN:c/h},a=c=>c==="+"||c==="\u2212"||c==="\xD7"||c==="\xF7",u=c=>{if(!isFinite(c))return"Error";let h=parseFloat(c.toFixed(8)).toString();return h.replace("-","").replace(".","").length>12&&(h=c.toPrecision(10).replace(/\.?0+$/,"")),h},d=["0"],w=!1,S=!1,l="",f=()=>d[d.length-1];function b(){i.textContent=S?"":l,n.textContent=S?"Error":d.join(" ");let c=!S&&a(f())?f():null;for(let h of s.querySelectorAll(".calc-op"))h.classList.toggle("selected",h.dataset.key===c)}function L(c){if(S&&(d=["0"],S=!1),w)return d=[c],w=!1,b();a(f())?d.push(c):d[d.length-1]=f()==="0"?c:f()+c,b()}function v(){if(S&&(d=["0"],S=!1),w)return d=["0."],w=!1,b();a(f())?d.push("0."):f().includes(".")||(d[d.length-1]=f()+"."),b()}function m(c){S||(w=!1,a(f())?d[d.length-1]=c:d.push(c),b())}function $(){d=["0"],w=!1,S=!1,b()}function x(){if(S||a(f()))return;let c=f();d[d.length-1]=c.startsWith("-")?c.slice(1):c==="0"?"0":"-"+c,b()}function k(){if(S)return $();if(w=!1,a(f()))return d.pop(),b();let c=f().slice(0,-1);c===""||c==="-"?d.length>1?d.pop():d=["0"]:d[d.length-1]=c,b()}function B(){if(S)return;let c=d.slice();if(a(c[c.length-1])&&c.pop(),c.length<3)return;let h=parseFloat(c[0]);for(let y=1;y<c.length;y+=2)if(h=r[c[y]](h,parseFloat(c[y+1])),!isFinite(h))return S=!0,b();l=`${c.join(" ")} =`,d=[u(h)],w=!0,b()}function T(c){let{action:h,key:y}=c.dataset;h!=="equals"&&(l=""),h==="digit"?L(y):h==="dot"?v():h==="clear"?$():h==="sign"?x():h==="back"?k():h==="op"?m(y):h==="equals"&&B()}let p=null;for(let c of s.querySelectorAll(".calc-key"))c.addEventListener("pointerdown",h=>{h.preventDefault(),p=c,c.classList.add("pressed")}),c.addEventListener("pointerup",h=>{h.preventDefault(),c.classList.remove("pressed"),p===c&&T(c),p=null}),c.addEventListener("pointercancel",()=>{c.classList.remove("pressed"),p=null}),c.addEventListener("pointerleave",()=>c.classList.remove("pressed"));s.querySelector("#calc-done").addEventListener("click",()=>o())}})}function Me(){let e=window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===!0,t;e?t=Math.max(window.innerHeight||0,window.visualViewport?.height||0,window.screen?.height||0):t=window.visualViewport?.height||window.innerHeight,document.documentElement.style.setProperty("--app-height",`${t}px`)}Me();window.addEventListener("resize",Me);window.addEventListener("orientationchange",Me);window.addEventListener("pageshow",Me);window.visualViewport?.addEventListener("resize",Me);var Ds={workout:{title:"Workout",render:Ls},exercises:{title:"Exercises",render:gs},progress:{title:"Progress",render:fs}},Se=document.getElementById("view-content"),Bo=document.getElementById("nav-title"),As=document.getElementById("nav-back"),X=document.getElementById("nav-action"),$e="workout",ft=null,Ue=null,Ve=null,ze={container:Se,setTitle(e){Bo.textContent=e},setAction(e){if(!e){X.hidden=!0,X.innerHTML="",X.removeAttribute("aria-label"),Ue=null;return}X.hidden=!1,e.label?X.setAttribute("aria-label",e.label):X.removeAttribute("aria-label"),e.html?X.innerHTML=e.html:X.textContent=e.label??"",Ue=e.onClick},setBack(e){ft=e,As.hidden=!e},refresh(){Le($e)},toast(e){I(e)}};function To(){if(typeof Ve=="function")try{Ve()}catch(e){console.error(e)}Ve=null}function Le(e){$e=e,Ct(e),document.querySelectorAll(".tab").forEach(t=>{t.setAttribute("aria-selected",String(t.dataset.tab===e))}),To(),ze.setTitle(Ds[e].title),ze.setAction(null),ze.setBack(null),Se.innerHTML="",Se.scrollTop=0;try{Ve=Ds[e].render(ze)}catch(t){console.error("Render failed",t),Se.innerHTML=`<div class="empty-state"><div class="empty-icon">!</div><h2>Render error</h2><p>${M(t.message)}</p></div>`}}document.querySelectorAll(".tab").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll(".sheet-backdrop").forEach(t=>t.dismissSheet?.()),Le(e.dataset.tab)})});As.addEventListener("click",()=>{ft&&ft()});X.addEventListener("click",()=>{Ue&&Ue()});(function(){let t='button, [role="button"], a[href]',s=null,o=0,i=0,n=()=>{s&&(s.classList.remove("pressed"),s=null)};document.addEventListener("pointerdown",r=>{let a=r.target.closest?.(t);s&&s!==a&&n(),!(!a||a.disabled||a.classList.contains("calc-key"))&&(s=a,o=r.clientX,i=r.clientY,a.classList.add("pressed"))},{passive:!0}),document.addEventListener("pointermove",r=>{s&&(Math.abs(r.clientX-o)>8||Math.abs(r.clientY-i)>8)&&n()},{passive:!0}),document.addEventListener("pointerup",n,{passive:!0}),document.addEventListener("pointercancel",n,{passive:!0}),window.addEventListener("scroll",n,{passive:!0,capture:!0})})();Xe("data:changed",()=>{ie(),Le($e)});Xe("workout:changed",()=>{ie(),$e==="workout"&&Le($e)});document.addEventListener("visibilitychange",()=>{document.visibilityState==="visible"&&ie()});async function Co(){try{await j(),await jt().catch(t=>console.warn("Passphrase check failed:",t));let e=await Bt();e>0&&console.info(`Seeded ${e} exercises.`),await Ft(),Le("workout"),ie()}catch(e){console.error("Init failed:",e),Se.innerHTML=`
      <div class="empty-state">
        <div class="empty-icon">!</div>
        <h2>Storage unavailable</h2>
        <p>${M(e.message??String(e))}</p>
        <p>If you are running this from a <code>file://</code> URL, serve it through a local web server instead.</p>
      </div>`}}Co();
