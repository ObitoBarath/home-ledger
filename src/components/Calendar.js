import { useState } from "react";
import { html } from "../html.js";
import { short, iso, dLabel, tier } from "../lib/format.js";
import { inr } from "../lib/format.js";
import { Amt } from "./Amount.js";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function Calendar({ expenses, onOpen }) {
  const today = iso(new Date());
  const [m, setM] = useState(today.slice(0, 7));
  const [sel, setSel] = useState(today);
  const [y, mo] = m.split("-").map(Number);
  const first = new Date(y, mo - 1, 1).getDay();
  const days = new Date(y, mo, 0).getDate();

  const byDay = {};
  expenses.forEach(e => { if (e.date.startsWith(m)) (byDay[e.date] = byDay[e.date] || []).push(e); });
  const tot = d => (byDay[d] || []).reduce((s, e) => s + e.amount, 0);
  const monthTotal = Object.keys(byDay).reduce((s, d) => s + tot(d), 0);
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => m + "-" + String(i + 1).padStart(2, "0"))];
  const move = n => setM(iso(new Date(y, mo - 1 + n, 1)).slice(0, 7));
  const dayRows = (byDay[sel] || []).slice().sort((a, b) => b.amount - a.amount);
  const title = new Date(y, mo - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });

  return html`<div style=${{ marginTop: 28 }}>
    <div class="card">
      <div class="calhead">
        <div class="acts">
          <button class="lnk" aria-label="Previous month" onClick=${() => move(-1)}>‹ Prev</button>
          <button class="lnk" onClick=${() => { setM(today.slice(0, 7)); setSel(today); }}>Today</button>
          <button class="lnk" aria-label="Next month" onClick=${() => move(1)}>Next ›</button>
        </div>
        <h2 style=${{ margin: 0 }}>${title}</h2>
        <span class="sub" style=${{ margin: 0 }}>Month total ${inr(monthTotal)}</span>
      </div>
      <div class="cal">
        ${DOW.map(d => html`<div class="dow" key=${d}>${d}</div>`)}
        ${cells.map((d, i) => {
          if (!d) return html`<div class="day blank" key=${"b" + i}></div>`;
          const t = tot(d), tr = t > 0 ? tier(t) : null;
          return html`<button key=${d} class=${"day" + (tr ? " " + tr[0] : "") + (d === sel ? " sel" : "") + (d === today ? " today" : "")} onClick=${() => setSel(d)} aria-label=${dLabel(d) + (t ? ", " + inr(t) : "")}>
            <span class="dn">${Number(d.slice(8))}</span>
            ${t > 0 && html`<span class="da">${tr ? tr[1] + " " : ""}<span class="full">${inr(t)}</span><span class="sh">${short(t)}</span></span>`}
          </button>`;
        })}
      </div>
      <p class="sub" style=${{ marginTop: 14, fontSize: 13 }}>😅 10k+ · 😮 20k+ · 🤯 50k+ per day</p>
    </div>
    <div class="card list">
      <div class="lh"><h2>${dLabel(sel)}</h2><span class="sub" style=${{ margin: 0 }}>${dayRows.length ? inr(tot(sel)) : "No spending"}</span></div>
      ${dayRows.length ? dayRows.map(e => html`<div class="item slim" key=${e.id}>
        <div><div class="note" tabindex="0" role="button" onClick=${() => onOpen(e)} onKeyDown=${k => k.key === "Enter" && onOpen(e)}>${e.bill ? "🧾 " : ""}${e.worker || e.note || e.category}</div><span class="chip">${e.category}</span>${e.task && html`<span class="task">${e.task}</span>`}</div>
        <span class="amt"><${Amt} v=${e.amount}/></span>
      </div>`) : html`<p class="empty">Nothing recorded on this day.</p>`}
    </div>
  </div>`;
}
