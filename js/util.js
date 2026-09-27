// ---------- utilities ----------
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const MR=mulberry32(20260927);
const rnd=Math.random;
const gauss=(x,m,s)=>Math.exp(-((x-m)**2)/(2*s*s));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const pick=a=>a[Math.floor(rnd()*a.length)];
const money=v=>(v<0?'-':'')+'£'+Math.abs(v).toLocaleString('en-GB',{minimumFractionDigits:2,maximumFractionDigits:2});
const money0=v=>(v<0?'-':'')+'£'+Math.round(Math.abs(v)).toLocaleString('en-GB');
const hhmm=t=>{const m=Math.floor(t)%1440;return String(Math.floor(m/60)%24).padStart(2,'0')+':'+String(m%60).padStart(2,'0')};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

// ---------- colours ----------
const C={cell:'#141a23',casing:'#080b10',river:'#15304a',riverEdge:'#27507a',text:'#e8e3d6',muted:'#7d8594',cab:'#f5b82e',rival:'#a784e8',good:'#4fa06b',warn:'#d89b36',bad:'#cf5341',cust:'#f1ede3',booked:'#63c3d8'};

