import { useState, useEffect } from "react";
import { html } from "../html.js";
import { backend } from "../lib/storage.js";
import { CATS, iso, compress } from "../lib/format.js";

export function ExpenseForm({init,onClose}){
  const [f,setF]=useState(init||{amount:"",date:iso(new Date()),category:CATS[0],note:"",worker:"",task:"",bill:""});
  const [err,setErr]=useState("");
  const set=k=>e=>setF({...f,[k]:e.target.value});
  useEffect(()=>{const h=e=>e.key==="Escape"&&onClose();window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h)},[]);
  const submit=async e=>{e.preventDefault();const amount=parseFloat(f.amount);
    if(!(amount>0))return setErr("Enter an amount greater than zero.");
    if(!f.date)return setErr("Pick a date.");
    const labour=f.category==="Labour";
    if(labour&&!(f.worker||"").trim())return setErr("Enter the worker’s name.");
    const rec={id:f.id||Date.now().toString(36)+Math.random().toString(36).slice(2,6),amount,date:f.date,category:f.category,note:f.note.trim(),worker:labour?f.worker.trim():"",task:labour?(f.task||"").trim():"",bill:f.bill||""};
    try{await backend.save(rec);onClose()}catch(x){setErr("Couldn’t save. Try again.")}};
  return html`<div class="overlay" onMouseDown=${e=>e.target===e.currentTarget&&onClose()}>
    <form class="modal" onSubmit=${submit}>
      <h2>${f.id?"Edit expense":"New expense"}</h2>
      <div class="two">
        <label>Amount (₹)<input class="inp sq" type="number" inputmode="decimal" min="0" step="any" autofocus value=${f.amount} onChange=${set("amount")} onInput=${set("amount")}/></label>
        <label>Date<input class="inp sq" type="date" value=${f.date} onChange=${set("date")}/></label>
      </div>
      <label>Category<select class="inp sq" value=${f.category} onChange=${set("category")}>${CATS.map(c=>html`<option key=${c}>${c}</option>`)}</select></label>
      ${f.category==="Labour"&&html`<div class="two">
        <label>Worker name<input class="inp sq" placeholder="Who worked" value=${f.worker||""} onInput=${set("worker")}/></label>
        <label>Work done that day<input class="inp sq" placeholder="e.g. Plastering, 2nd floor" value=${f.task||""} onInput=${set("task")}/></label>
      </div>`}
      <label>Note<input class="inp sq" placeholder="Vendor or what it was for" value=${f.note} onInput=${set("note")}/></label>
      <label>Bill photo<input class="inp sq" type="file" accept="image/*" onChange=${async e=>{const x=e.target.files[0];if(x){try{const b=await compress(x);setF(p=>({...p,bill:b}))}catch(_){setErr("Couldn’t read that image.")}}}}/></label>
      ${f.bill&&html`<div class="thumb"><img src=${f.bill} alt="Bill preview"/><button type="button" class="lnk del" onClick=${()=>setF({...f,bill:""})}>Remove bill</button></div>`}
      ${err&&html`<p class="err">${err}</p>`}
      <div class="foot"><button type="button" class="btn ghost" onClick=${onClose}>Cancel</button><button class="btn">${f.id?"Save changes":"Save expense"}</button></div>
    </form></div>`;
}
