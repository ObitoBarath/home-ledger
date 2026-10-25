import { html } from "../html.js";
import { mLabel, short } from "../lib/format.js";

export function MonthChart({data,limit}){
  if(!data.length)return html`<p class="empty">No data in this range.</p>`;
  const W=560,H=210,pad=26,max=Math.max(...data.map(d=>d[1]),1),bw=Math.min(44,(W/data.length)*.6);
  return html`<svg class="chart" viewBox=${"0 0 "+W+" "+H} role="img" aria-label="Monthly expenses">
    ${data.map((d,i)=>{const x=(W/data.length)*(i+.5),h=(H-pad-24)*d[1]/max;
      return html`<g key=${d[0]}>
        <rect x=${x-bw/2} y=${H-pad-h} width=${bw} height=${Math.max(h,2)} rx="6" fill=${limit&&d[1]>limit?"var(--danger)":"var(--accent)"} opacity=${i===data.length-1?1:.55}/>
        <text class="v" x=${x} y=${H-pad-h-7} text-anchor="middle">${short(d[1])}</text>
        <text x=${x} y=${H-6} text-anchor="middle">${mLabel(d[0])}</text></g>`})}
  </svg>`;
}
