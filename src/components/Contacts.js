import { useState } from "react";
import { html } from "../html.js";
import { backend } from "../lib/storage.js";

export function Contacts({list}){
  const [f,setF]=useState(null),[err,setErr]=useState(""),[cf,setCf]=useState(null),[q,setQ]=useState("");
  const set=k=>e=>setF({...f,[k]:e.target.value});
  const submit=async e=>{e.preventDefault();if(!f.name.trim())return setErr("Enter a name.");
    try{await backend.save({id:f.id||"c"+Date.now().toString(36)+Math.random().toString(36).slice(2,5),kind:"contact",name:f.name.trim(),trade:f.trade||"",phone:f.phone||"",place:f.place||"",note:f.note||""});setF(null);setErr("")}catch(x){setErr("Couldn’t save. Try again.")}};
  const shown=list.filter(c=>(c.name+c.trade+c.phone+c.note+c.place).toLowerCase().includes(q.toLowerCase())).sort((a,b)=>a.name.localeCompare(b.name));
  return html`<div>
    <div class="tools"><input class="sel" placeholder="Search contacts" value=${q} onInput=${e=>setQ(e.target.value)}/><button class="btn" onClick=${()=>{setErr("");setF({name:"",trade:"",phone:"",place:"",note:""})}}>Add contact</button></div>
    <div class="cgrid">${shown.map(c=>html`<div class="card" key=${c.id}><div class="note" style=${{cursor:"default"}}>${c.name}</div>${c.trade&&html`<span class="chip">${c.trade}</span>`}${c.phone&&html`<p class="sub"><a href=${"tel:"+c.phone} style=${{color:"inherit"}}>${c.phone}</a></p>`}${c.place&&html`<p class="sub">${c.place}</p>`}${c.note&&html`<p class="sub">${c.note}</p>`}
      <div class="acts" style=${{marginTop:10}}><button class="lnk" onClick=${()=>{setErr("");setF(c)}}>Edit</button><button class="lnk del" onClick=${()=>{if(cf!==c.id)return setCf(c.id);setCf(null);backend.remove(c.id)}} onBlur=${()=>setCf(null)}>${cf===c.id?"Confirm delete":"Delete"}</button></div></div>`)}</div>
    ${!shown.length&&html`<p class="empty">${list.length?"No contacts match your search.":"No contacts yet. Add the dealers and contractors you work with."}</p>`}
    ${f&&html`<div class="overlay" onMouseDown=${e=>e.target===e.currentTarget&&setF(null)}><form class="modal" onSubmit=${submit}>
      <h2>${f.id?"Edit contact":"New contact"}</h2>
      <label>Name<input class="inp sq" autofocus value=${f.name} onInput=${set("name")}/></label>
      <div class="two"><label>Trade<input class="inp sq" placeholder="Cement, plumbing…" value=${f.trade} onInput=${set("trade")}/></label><label>Phone<input class="inp sq" type="tel" value=${f.phone} onInput=${set("phone")}/></label></div>
      <label>Shop or address<input class="inp sq" value=${f.place} onInput=${set("place")}/></label>
      <label>Notes<input class="inp sq" placeholder="Rates, delivery time…" value=${f.note} onInput=${set("note")}/></label>
      ${err&&html`<p class="err">${err}</p>`}
      <div class="foot"><button type="button" class="btn ghost" onClick=${()=>setF(null)}>Cancel</button><button class="btn">Save contact</button></div>
    </form></div>`}
  </div>`;
}
