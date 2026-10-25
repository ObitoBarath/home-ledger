import { html } from "../html.js";
import { tier, inr } from "../lib/format.js";

export function Amt({v}){const t=tier(v);return t?html`<span class=${"pill "+t[0]} title=${"Over ₹"+t[2]}>${t[1]} ${inr(v)}</span>`:inr(v)}
