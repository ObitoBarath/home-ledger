import { useState, useEffect, useMemo } from "react";
import { html } from "./html.js";
import { CATS, PRESETS, inr, iso, mLabel, dLabel, startOf, pageList } from "./lib/format.js";
import { backend, connect } from "./lib/storage.js";
import { saveFile } from "./lib/download.js";
import { buildXlsx, buildPdf } from "./lib/export.js";
import { Amt } from "./components/Amount.js";
import { MonthChart } from "./components/MonthChart.js";
import { Contacts } from "./components/Contacts.js";
import { Calendar } from "./components/Calendar.js";
import { ExpenseForm } from "./components/ExpenseForm.js";

export function App(){
  const [raw,setAll]=useState(null);
  const all=raw&&raw.filter(e=>!e.kind),contacts=(raw||[]).filter(e=>e.kind==="contact"),limit=((raw||[]).find(e=>e.kind==="settings")||{}).limit||0;
  const [preset,setPreset]=useState("all"),[from,setFrom]=useState(""),[to,setTo]=useState(""),[cat,setCat]=useState("All");
  const [q,setQ]=useState(""),[minA,setMinA]=useState(""),[maxA,setMaxA]=useState(""),[day,setDay]=useState(""),[page,setPage]=useState(1),[pageSize,setPageSize]=useState(10);
  const [form,setForm]=useState(null),[confirm,setConfirm]=useState(null);
  const [tab,setTab]=useState("home"),[view,setView]=useState(null),[limOpen,setLimOpen]=useState(false),[lim,setLim]=useState(""),[popup,setPopup]=useState(false),[seen,setSeen]=useState(""),[toast,setToast]=useState("");
  const mk=iso(new Date()).slice(0,7),spent=(all||[]).filter(e=>e.date.startsWith(mk)).reduce((s,e)=>s+e.amount,0);
  useEffect(()=>{if(limit&&spent>limit&&seen!==mk+limit){setPopup(true);setSeen(mk+limit)}},[spent,limit]);
  useEffect(()=>{connect(setAll)},[]);
  const rows=useMemo(()=>{
    const a=day||(preset==="custom"?from:startOf(preset)),b=day||(preset==="custom"?to:""),needle=q.trim().toLowerCase(),lo=parseFloat(minA),hi=parseFloat(maxA);
    return (all||[]).filter(e=>(!a||e.date>=a)&&(!b||e.date<=b)&&(cat==="All"||e.category===cat)&&(isNaN(lo)||e.amount>=lo)&&(isNaN(hi)||e.amount<=hi)&&(!needle||[e.note,e.worker,e.task,e.category,String(e.amount)].join(" ").toLowerCase().includes(needle))).sort((x,y)=>y.date.localeCompare(x.date));
  },[all,preset,from,to,cat,q,minA,maxA,day]);
  const total=rows.reduce((s,e)=>s+e.amount,0);
  const pages=Math.max(1,Math.ceil(rows.length/pageSize)),cur=Math.min(page,pages),shown=rows.slice((cur-1)*pageSize,cur*pageSize);
  useEffect(()=>{setPage(1)},[preset,from,to,cat,q,minA,maxA,day,pageSize]);
  const months=useMemo(()=>{
    const m={};rows.forEach(e=>{const k=e.date.slice(0,7);m[k]=(m[k]||0)+e.amount});
    const keys=Object.keys(m).sort();if(!keys.length)return[];
    const out=[];let[y,mo]=keys[0].split("-").map(Number);const[ey,em]=keys[keys.length-1].split("-").map(Number);
    while(y<ey||(y===ey&&mo<=em)){const k=y+"-"+String(mo).padStart(2,"0");out.push([k,m[k]||0]);mo++;if(mo>12){mo=1;y++}}
    return out.slice(-12)},[rows]);
  const cats=useMemo(()=>{const m={};rows.forEach(e=>m[e.category]=(m[e.category]||0)+e.amount);return Object.entries(m).sort((a,b)=>b[1]-a[1])},[rows]);
  const label=(PRESETS.find(p=>p[0]===preset)||[])[1];
  const active=q||minA||maxA||day||cat!=="All"||preset!=="all";
  const clearAll=()=>{setQ("");setMinA("");setMaxA("");setDay("");setCat("All");setPreset("all");setFrom("");setTo("")};
  const del=async id=>{if(confirm!==id)return setConfirm(id);setConfirm(null);try{await backend.remove(id)}catch(e){}};
  const dl=async(name,data)=>{const m=await saveFile(name,data);setToast(m);setTimeout(()=>setToast(""),3500)};
  const toX=()=>dl("house-expenses.xlsx",buildXlsx(rows));
  const toP=()=>dl("house-expenses.pdf",buildPdf(rows,total,label+(cat!=="All"?" - "+cat:"")));
  const shut=fn=>e=>e.target===e.currentTarget&&fn();
  const head=html`<header><h1>Barath's Home build ledger</h1><nav class="tabs"><button class=${"tab"+(tab==="home"?" on":"")} onClick=${()=>setTab("home")}>Overview</button><button class=${"tab"+(tab==="calendar"?" on":"")} onClick=${()=>setTab("calendar")}>Calendar</button><button class=${"tab"+(tab==="contacts"?" on":"")} onClick=${()=>setTab("contacts")}>Contacts</button></nav>${tab!=="contacts"?html`<button class="btn" onClick=${()=>setForm({})}>Add expense</button>`:html`<span/>`}</header>`;
  const modals=html`<div>
    ${toast&&html`<div class="toast">${toast}</div>`}
    ${view&&html`<div class="overlay" onMouseDown=${shut(()=>setView(null))}><div class="modal wide"><h2><${Amt} v=${view.amount}/></h2><p class="sub" style=${{marginBottom:16}}>${dLabel(view.date)} · ${view.category}${view.worker?" · "+view.worker:""}${view.task?" · "+view.task:""}${view.note?" · "+view.note:""}</p>${view.bill?html`<img class="bill" src=${view.bill} alt="Bill"/>`:html`<p class="empty">No bill attached. Edit this expense to add a photo.</p>`}<div class="foot"><button class="btn ghost" onClick=${()=>{setForm(view);setView(null)}}>Edit</button><button class="btn" onClick=${()=>setView(null)}>Close</button></div></div></div>`}
    ${limOpen&&html`<div class="overlay" onMouseDown=${shut(()=>setLimOpen(false))}><form class="modal" onSubmit=${async e=>{e.preventDefault();try{await backend.save({id:"settings",kind:"settings",limit:parseFloat(lim)||0});setSeen("");setLimOpen(false)}catch(x){}}}><h2>Monthly limit</h2><label>Limit per month (₹)<input class="inp sq" type="number" min="0" step="any" autofocus value=${lim} onInput=${e=>setLim(e.target.value)}/></label><p class="sub" style=${{margin:"0 0 14px",fontSize:13}}>A pop-up appears when a month’s spending goes past this. Leave it empty to turn the limit off.</p><div class="foot"><button type="button" class="btn ghost" onClick=${()=>setLimOpen(false)}>Cancel</button><button class="btn">Save limit</button></div></form></div>`}
    ${popup&&limit>0&&html`<div class="overlay" onMouseDown=${shut(()=>setPopup(false))}><div class="modal"><p class="big">🚨</p><h2>Monthly limit crossed</h2><p class="sub" style=${{marginBottom:18}}>You’ve spent ${inr(spent)} in ${mLabel(mk)}, which is ${inr(spent-limit)} over your ${inr(limit)} limit.</p><div class="foot"><button class="btn ghost" onClick=${()=>{setPopup(false);setLim(String(limit));setLimOpen(true)}}>Change limit</button><button class="btn" onClick=${()=>setPopup(false)}>Got it</button></div></div></div>`}
  </div>`;
  const formModal=form&&html`<${ExpenseForm} init=${form.id?{...form,amount:String(form.amount)}:null} onClose=${()=>setForm(null)}/>`;
  if(tab==="contacts")return html`<div class="wrap">${head}<${Contacts} list=${contacts}/>${modals}</div>`;
  if(tab==="calendar")return html`<div class="wrap">${head}${all===null?html`<p class="empty">Loading…</p>`:html`<${Calendar} expenses=${all} onOpen=${setView}/>`}${modals}${formModal}</div>`;
  return html`<div class="wrap">
    ${head}
    <section class="hero">
      <p class="total">${inr(total)}</p>
      <p class="sub">${rows.length} ${rows.length===1?"expense":"expenses"} · ${day?dLabel(day):label.toLowerCase()}${cat!=="All"?" · "+cat:""}</p>
      <div class="lim"><div class="row"><span class=${limit&&spent>limit?"over":""}>${mLabel(mk)} · ${inr(spent)}${limit?" of "+inr(limit):" spent"}</span><button class="lnk" onClick=${()=>{setLim(limit?String(limit):"");setLimOpen(true)}}>${limit?"Change limit":"Set monthly limit"}</button></div>${limit>0&&html`<div class="track"><div class="fill" style=${{width:Math.min(100,spent/limit*100)+"%",background:spent>limit?"var(--danger)":"var(--accent)"}}></div></div>`}</div>
    </section>
    <div class="filters">
      <select class="sel" aria-label="Duration" disabled=${!!day} value=${preset} onChange=${e=>setPreset(e.target.value)}>${PRESETS.map(p=>html`<option key=${p[0]} value=${p[0]}>${p[1]}</option>`)}</select>
      ${preset==="custom"&&html`<input class="sel" type="date" aria-label="From" value=${from} onChange=${e=>setFrom(e.target.value)}/><input class="sel" type="date" aria-label="To" value=${to} onChange=${e=>setTo(e.target.value)}/>`}
      <select class="sel" aria-label="Category" value=${cat} onChange=${e=>setCat(e.target.value)}><option value="All">All categories</option>${CATS.map(c=>html`<option key=${c}>${c}</option>`)}</select>
      <input class="sel grow" type="search" placeholder="Search note, worker, task, amount…" aria-label="Search text" value=${q} onInput=${e=>setQ(e.target.value)}/>
      <input class="sel num" type="number" inputmode="decimal" min="0" placeholder="Min ₹" aria-label="Minimum amount" value=${minA} onInput=${e=>setMinA(e.target.value)}/>
      <input class="sel num" type="number" inputmode="decimal" min="0" placeholder="Max ₹" aria-label="Maximum amount" value=${maxA} onInput=${e=>setMaxA(e.target.value)}/>
      <label class="sel dayl">Single day<input type="date" aria-label="Single date" value=${day} onChange=${e=>setDay(e.target.value)}/></label>
      ${active&&html`<button class="lnk" onClick=${clearAll}>Clear filters</button>`}
    </div>
    ${all===null?html`<p class="empty">Loading…</p>`:html`
    <div class="grid">
      <div class="card"><h2>Monthly spend</h2><${MonthChart} data=${months} limit=${limit}/></div>
      <div class="card"><h2>By category</h2>
        ${cats.length?cats.map(([c,v])=>html`<div class="cat" key=${c}><div class="row"><span>${c}</span><span>${inr(v)} · ${Math.round(v/total*100)}%</span></div><div class="track"><div class="fill" style=${{width:(v/cats[0][1]*100)+"%"}}></div></div></div>`):html`<p class="empty">Nothing to show yet.</p>`}
      </div>
    </div>
    <div class="card list"><div class="lh"><h2>Expenses</h2><div class="acts"><button class="lnk" onClick=${toX} disabled=${!rows.length}>Download Excel</button><button class="lnk" onClick=${toP} disabled=${!rows.length}>Download PDF</button></div></div>
      ${shown.length?shown.map(e=>html`<div class="item" key=${e.id}>
        <span class="date">${dLabel(e.date)}</span>
        <div><div class="note" tabindex="0" role="button" onClick=${()=>setView(e)} onKeyDown=${k=>k.key==="Enter"&&setView(e)}>${e.bill?"🧾 ":""}${e.worker||e.note||e.category}</div><span class="chip">${e.category}</span>${e.task&&html`<span class="task">${e.task}</span>`}</div>
        <span class="amt"><${Amt} v=${e.amount}/></span>
        <div class="acts"><button class="lnk" onClick=${()=>setForm(e)}>Edit</button><button class="lnk del" onClick=${()=>del(e.id)} onBlur=${()=>setConfirm(null)}>${confirm===e.id?"Confirm delete":"Delete"}</button></div>
      </div>`):html`<p class="empty">${all.length?"No expenses match these filters.":"No expenses yet. Add your first one to start tracking."}</p>`}
      ${rows.length>0&&html`<div class="pager"><span class="sub">${(cur-1)*pageSize+1}–${Math.min(cur*pageSize,rows.length)} of ${rows.length}</span>
        <div class="pgs"><button class="lnk" disabled=${cur===1} onClick=${()=>setPage(cur-1)}>Prev</button>${pageList(cur,pages).map((p,i)=>p==="…"?html`<span class="dots" key=${"d"+i}>…</span>`:html`<button key=${p} class=${"pg"+(p===cur?" on":"")} onClick=${()=>setPage(p)}>${p}</button>`)}<button class="lnk" disabled=${cur===pages} onClick=${()=>setPage(cur+1)}>Next</button></div>
        <select class="sel sm" aria-label="Rows per page" value=${pageSize} onChange=${e=>setPageSize(+e.target.value)}><option value="10">10 / page</option><option value="15">15 / page</option></select></div>`}
    </div>
    <p class="sub" style=${{marginTop:20,fontSize:13}}>😅 10k+ · 😮 20k+ · 🤯 50k+ · ${backend.mode==="offline"?"Can’t reach the server. Start it with npm run dev.":"Synced through the server (db.json)."}</p>`}
    ${modals}${formModal}
  </div>`;
}
