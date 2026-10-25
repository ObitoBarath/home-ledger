// Constants and helpers shared across the app
export const CATS=["Land & Approvals","Foundation","Cement & Steel","Bricks & Masonry","Plumbing","Electrical","Flooring & Tiles","Doors & Windows","Painting","Labour","Interiors","Other"];
export const PRESETS=[["all","All time"],["month","This month"],["3m","Last 3 months"],["6m","Last 6 months"],["year","This year"],["custom","Custom range"]];
export const inr=n=>"₹"+Math.round(n).toLocaleString("en-IN");
export const short=n=>n>=1e7?(n/1e7).toFixed(1)+"Cr":n>=1e5?(n/1e5).toFixed(1)+"L":n>=1e3?Math.round(n/1e3)+"k":String(Math.round(n));
export const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
export const mLabel=k=>{const[y,m]=k.split("-");return new Date(+y,+m-1,1).toLocaleString("en-IN",{month:"short"})+" ’"+y.slice(2)};
export const dLabel=s=>{const[y,m,d]=s.split("-");return new Date(+y,+m-1,+d).toLocaleString("en-IN",{day:"numeric",month:"short"})};
export function startOf(p){const n=new Date(),y=n.getFullYear(),m=n.getMonth();
  if(p==="month")return iso(new Date(y,m,1));if(p==="3m")return iso(new Date(y,m-2,1));
  if(p==="6m")return iso(new Date(y,m-5,1));if(p==="year")return iso(new Date(y,0,1));return "";}


export const tier=a=>a>=50000?["t3","🤯","50k"]:a>=20000?["t2","😮","20k"]:a>=10000?["t1","😅","10k"]:null;
export function compress(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const c=document.createElement("canvas");let s=Math.min(1,1600/Math.max(im.width,im.height));const draw=()=>{c.width=im.width*s;c.height=im.height*s;c.getContext("2d").drawImage(im,0,0,c.width,c.height);return c.toDataURL("image/jpeg",.7)};let out=draw();while(out.length>900000&&s>.2){s*=.75;out=draw()}res(out)};im.onerror=rej;im.src=r.result};r.onerror=rej;r.readAsDataURL(file)})}

// Page numbers with ellipses, e.g. [1, "…", 4, 5, 6, "…", 12]
export function pageList(cur, n) {
  if (n <= 7) return Array.from({ length: n }, (_, i) => i + 1);
  const a = [...new Set([1, n, cur - 1, cur, cur + 1])].filter(p => p >= 1 && p <= n).sort((x, y) => x - y);
  const out = [];
  a.forEach((p, i) => { if (i && p - a[i - 1] > 1) out.push("…"); out.push(p); });
  return out;
}
