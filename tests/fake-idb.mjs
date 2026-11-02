// Small deterministic IndexedDB test double. Not a browser or iOS storage test.
export const rows = Object.fromEntries(['exercises','workouts','sets','appMeta'].map(n=>[n,new Map()]));
let failStore = null;
let failAfter = 0;
/** Make the nth getAll of a store from now on throw (n=1 is the next one). */
export function failNextGetAll(store,n=1){failStore=store;failAfter=n;}
export function reset(data={}){for(const [name,m] of Object.entries(rows)){m.clear();for(const row of data[name]??[])m.set(row.id??row.key,structuredClone(row));}}
const later = fn=>setImmediate(fn);
class Tx {
  constructor(names,mode){this.names=[names].flat();this.mode=mode;this.pending=0;this.aborted=false;this.stage=Object.fromEntries(this.names.map(n=>[n,new Map(rows[n])]));later(()=>this.finish());}
  objectStore(name){const m=this.stage[name];const key=name==='appMeta'?'key':'id';const req=fn=>{const r={};this.pending++;later(()=>{if(this.aborted)return;try{r.result=fn();r.onsuccess?.();}catch(e){r.error=e;r.onerror?.();this.error=e;this.abort();}this.pending--;later(()=>this.finish());});return r;};return {getAll:()=>req(()=>{if(failStore===name&&--failAfter===0){failStore=null;throw Error('simulated read failure.');}return structuredClone([...m.values()]);}),get:id=>req(()=>structuredClone(m.get(id))),put:v=>{if(v?.[key]===undefined)throw Error('DataError');const copy=structuredClone(v);return req(()=>{m.set(copy[key],copy);return copy[key];});},delete:id=>req(()=>m.delete(id)),clear:()=>req(()=>m.clear()),index:field=>({getAll:value=>req(()=>structuredClone([...m.values()].filter(r=>r[field]===value)))})};}
  finish(){if(this.pending||this.done||this.aborted)return;this.done=true;if(this.mode==='readwrite')for(const n of this.names)rows[n]=this.stage[n];this.oncomplete?.();}
  abort(){this.aborted=true;later(()=>this.onabort?.());}
}
globalThis.indexedDB={open:()=>{let r={};later(()=>{r.result={transaction:(n,m)=>new Tx(n,m)};r.onsuccess?.();});return r;}};
