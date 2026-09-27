// ---------- map interaction ----------
const cv=document.getElementById('map'),ctx=cv.getContext('2d');let view={s:1,ox:0,oy:0,w:0,h:0};
function resize(){const r=cv.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);cv.width=Math.max(1,r.width*dpr);cv.height=Math.max(1,r.height*dpr);const s=Math.min(r.width/W,r.height/H);view={s,ox:(r.width-W*s)/2,oy:(r.height-H*s)/2,w:r.width,h:r.height,dpr}}
new ResizeObserver(resize).observe(cv);
function toWorld(e){const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left-view.ox)/view.s,y:(e.clientY-r.top-view.oy)/view.s}}
cv.addEventListener('pointerdown',e=>{
  if(S.choosing||S.modal||S.over)return;
  const p=toWorld(e);const near=(x,y,r)=>Math.hypot(x-p.x,y-p.y)<r/Math.max(.6,view.s);
  // our cab?
  for(const cab of ourCabs()){if(cab.driver&&near(cab.x,cab.y,18)){S.selected=cab.id;render(true);return}}
  const cab=S.cabs.find(c=>c.id===S.selected);
  if(!cab||!cab.driver){toast('Pick one of your cabs first.');return}
  const free=isPlayerCab(cab)?freeCab(cab):freeForWork(cab);
  if(!free){toast(isPlayerCab(cab)?'You\'re busy. Finish this job or bail out.':esc(cab.driver.name)+' is busy right now.');return}
  // a waiting customer?
  const cust=S.customers.find(c=>c.type==='street'&&!c.claimedBy&&near(nodes[c.node].x,nodes[c.node].y,16));
  if(cust){goPickup(cab,cust);toast((isPlayerCab(cab)?'You\'re':esc(cab.driver.name)+' is')+' heading for that fare.');render(true);return}
  // nearest node
  let best=null,bd=40/Math.max(.6,view.s);for(const n of nodes){const d=Math.hypot(n.x-p.x,n.y-p.y);if(d<bd){bd=d;best=n}}
  if(!best)return;
  const rk=rankByNode.get(best.id);
  sendTo(cab,best.id,rk?rk.id:null);
  if(!isPlayerCab(cab)){cab.mode='hold';cab.holdNode=best.id}
  toast((isPlayerCab(cab)?'Driving to ':'Sent '+esc(cab.driver.name)+' to ')+esc(rk?rk.name:D[best.d].name)+(rk?' to join the queue.':'.'));
  render(true);
});

// ---------- drawing ----------
function drawMap(now){
  const {s,ox,oy,dpr}=view;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#0b1016';ctx.fillRect(0,0,view.w,view.h);
  ctx.setTransform(dpr*s,0,0,dpr*s,dpr*ox,dpr*oy);
  const h=S.t/60;
  // districts
  for(const n of nodes){ctx.fillStyle=D[n.d].tint;ctx.globalAlpha=.07;ctx.fillRect(M+n.c*SP-SP/2,M+n.r*SP-SP/2,SP,SP)}
  ctx.globalAlpha=1;
  // hotspots
  const pulse=.85+.15*Math.sin(now/600);
  for(const k in D){const dm=demand(k,h);const c=centroid[k];const r=(50+dm*110)*pulse;const g=ctx.createRadialGradient(c.x,c.y,0,c.x,c.y,r);g.addColorStop(0,'rgba(245,184,46,'+(dm*.16).toFixed(3)+')');g.addColorStop(1,'rgba(245,184,46,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(c.x,c.y,r,0,7);ctx.fill()}
  // river
  ctx.lineCap='round';ctx.lineJoin='round';
  const ry=M+4.5*SP;ctx.beginPath();for(let x=-20;x<=W+20;x+=10){const y=ry+Math.sin(x/95)*9+Math.sin(x/37)*3;x===-20?ctx.moveTo(x,y):ctx.lineTo(x,y)}
  ctx.strokeStyle=C.riverEdge;ctx.lineWidth=40;ctx.stroke();ctx.strokeStyle=C.river;ctx.lineWidth=34;ctx.stroke();
  ctx.fillStyle='#4f7ea6';ctx.font='italic 500 12px "IBM Plex Sans",sans-serif';ctx.textAlign='left';ctx.fillText('River Tove',W-110,ry+Math.sin((W-110)/95)*9+4);
  // roads
  for(const e of edges){const A=nodes[e.a],B=nodes[e.b];ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);ctx.strokeStyle=e.bridge?'#39414d':C.casing;ctx.lineWidth=e.bridge?15:e.main?11:7;ctx.stroke()}
  for(const e of edges){const A=nodes[e.a],B=nodes[e.b];ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);const col=e.mult<1.45?C.good:e.mult<2.1?C.warn:C.bad;ctx.strokeStyle=col;ctx.globalAlpha=e.main?.9:.6;ctx.lineWidth=e.main?5:3;ctx.stroke();ctx.globalAlpha=1;
    if(e.works>absNow()){ctx.save();ctx.setLineDash([4,4]);ctx.strokeStyle='#ff8a1f';ctx.lineWidth=e.main?9:6;ctx.globalAlpha=.8;ctx.stroke();ctx.restore();const mx=(A.x+B.x)/2,my=(A.y+B.y)/2;ctx.fillStyle='#ff8a1f';ctx.beginPath();ctx.moveTo(mx,my-7);ctx.lineTo(mx+5,my+4);ctx.lineTo(mx-5,my+4);ctx.closePath();ctx.fill()}}
  // district labels
  ctx.textAlign='center';ctx.font='600 13px "Barlow Condensed",sans-serif';
  const LBL={station:[1.5,3.5],centre:[5.5,1.5],hospital:[9.5,3.5],riverside:[4.5,5.5],southfield:[1,6.5],kilnworth:[8.5,5.5]};for(const k in D){const [lc,lr]=LBL[k];ctx.fillStyle='rgba(232,227,214,.34)';label(D[k].name.toUpperCase(),M+lc*SP,M+lr*SP+4,2)}
  // landmarks
  building(nodes[idx(1,1)].x-28,nodes[idx(1,1)].y-34,'STATION','#5b8fc9');
  building(nodes[idx(9,1)].x+6,nodes[idx(9,1)].y-34,'HOSPITAL','#6bb8a8');
  building(nodes[RIVAL_DEPOT].x+8,nodes[RIVAL_DEPOT].y+10,'CASTLE CARS',C.rival);
  if(S.office)building(nodes[OFFICE].x+8,nodes[OFFICE].y+10,'STARLINE',C.cab);
  // ranks
  for(const rk of RANKS){const n=nodes[rk.node];const q=S.customers.filter(c=>c.rankId===rk.id).length;ctx.fillStyle='#e8e3d6';rr(n.x-13,n.y+9,26,15,3);ctx.fill();ctx.fillStyle='#10151c';ctx.font='700 11px "Barlow Condensed",sans-serif';ctx.textAlign='center';ctx.fillText('RANK',n.x,n.y+20);
    if(q){ctx.fillStyle=C.cust;ctx.beginPath();ctx.arc(n.x+17,n.y+9,8,0,7);ctx.fill();ctx.fillStyle='#10151c';ctx.font='700 11px "JetBrains Mono",monospace';ctx.fillText(q,n.x+17,n.y+13)}}
  // selected route
  const sel=S.cabs.find(c=>c.id===S.selected);
  if(sel&&sel.route&&!S.choosing){ctx.save();ctx.setLineDash([6,5]);ctx.strokeStyle=sel.state==='onFare'?C.cab:'#e8e3d6';ctx.globalAlpha=.75;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(sel.x,sel.y);for(let i=sel.seg+1;i<sel.route.length;i++)ctx.lineTo(nodes[sel.route[i]].x,nodes[sel.route[i]].y);ctx.stroke();ctx.restore()}
  if(sel&&sel.job&&sel.state==='onFare'){const dn=nodes[sel.job.cust.dest];flag(dn.x,dn.y,C.cab)}
  if(sel&&sel.job&&(sel.state==='toPickup'||sel.state==='waiting')){const dn=nodes[sel.job.cust.node];ctx.strokeStyle='#e8e3d6';ctx.lineWidth=2;ctx.beginPath();ctx.arc(dn.x,dn.y,13,0,7);ctx.stroke()}
  // route choice
  if(S.choosing){S.choosing.opts.forEach((o,i)=>{const on=S.hoverRoute===-1||S.hoverRoute===i;ctx.beginPath();o.path.forEach((n,j)=>j?ctx.lineTo(nodes[n].x,nodes[n].y):ctx.moveTo(nodes[n].x,nodes[n].y));ctx.strokeStyle=o.col;ctx.globalAlpha=on?.95:.18;ctx.lineWidth=S.hoverRoute===i?7:4.5;ctx.stroke();ctx.globalAlpha=1});const dn=nodes[S.choosing.cust.dest];flag(dn.x,dn.y,C.cab)}
  // customers
  const ab=absNow();const perNode={};
  for(const c of S.customers){
    if(c.type==='rank')continue;if(c.type==='booked'&&c.pickupAt-S.t>25)continue;
    const n=nodes[c.node];const k=perNode[c.node]=(perNode[c.node]||0)+1;const x=n.x+(k-1)*9-4+ (c.off-.5)*6,y=n.y-12-(k-1)*2;
    const col=c.type==='booked'?C.booked:C.cust;
    if(c.claimedBy){const cb=S.cabs.find(q=>q.id===c.claimedBy);ctx.strokeStyle=cb&&cb.firm==='rival'?C.rival:C.cab;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,9,0,7);ctx.stroke()}
    ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,y-3,3,0,7);ctx.fill();ctx.beginPath();ctx.moveTo(x-4,y+5);ctx.quadraticCurveTo(x,y-3,x+4,y+5);ctx.closePath();ctx.fill();
    if(c.type!=='booked'){const left=1-(ab-c.t0)/c.patience;ctx.strokeStyle=left>.4?'rgba(241,237,227,.55)':C.bad;ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(x,y,6.5,-Math.PI/2,-Math.PI/2+Math.PI*2*clamp(left,0,1));ctx.stroke()}
    else{ctx.fillStyle=C.booked;ctx.font='600 10px "JetBrains Mono",monospace';ctx.textAlign='center';ctx.fillText(hhmm(c.pickupAt),x,y-10)}
  }
  // cabs
  const parked={};
  for(const cab of S.cabs){
    let x,y;
    if(cab.route&&cab.seg<cab.route.length-1){const A=nodes[cab.route[cab.seg]],B=nodes[cab.route[cab.seg+1]];x=A.x+(B.x-A.x)*cab.prog;y=A.y+(B.y-A.y)*cab.prog;cab.angle=Math.atan2(B.y-A.y,B.x-A.x)}
    else{const n=nodes[cab.node];const k=parked[cab.node]=(parked[cab.node]||0)+1;x=n.x-14+k*14-7*0;y=n.y-2+(k>3?12:0);if(k===1){x=n.x;}else{x=n.x+((k-1)%3)*15*(k%2?1:-1);}}
    cab.x=x;cab.y=y;
  }
  for(const cab of S.cabs){
    const you=cab.firm==='you';const col=you?C.cab:C.rival;const dim=you&&!cab.driver;
    ctx.save();ctx.translate(cab.x,cab.y);
    if(cab.id===S.selected){ctx.strokeStyle='#fff';ctx.globalAlpha=.8;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,15+Math.sin(now/200),0,7);ctx.stroke();ctx.globalAlpha=1}
    ctx.rotate(cab.angle);ctx.globalAlpha=dim?.35:1;ctx.fillStyle='#07090c';rr(-10,-6.5,20,13,3);ctx.fill();ctx.fillStyle=col;rr(-9,-5.5,18,11,2.5);ctx.fill();
    ctx.fillStyle='rgba(10,12,16,.55)';ctx.fillRect(1,-4,4,8);
    if(cab.state==='onFare'||cab.state==='choosing'){ctx.fillStyle='#fff';ctx.fillRect(-4,-2,3,4)}
    ctx.restore();
    ctx.textAlign='center';
    if(isPlayerCab(cab)){ctx.font='700 11px "Barlow Condensed",sans-serif';ctx.fillStyle='#07090c';rr(cab.x-12,cab.y-22,24,12,2);ctx.fill();ctx.fillStyle=C.cab;ctx.fillText('YOU',cab.x,cab.y-13)}
    else if(you&&cab.driver){ctx.font='700 11px "JetBrains Mono",monospace';ctx.fillStyle=C.cab;ctx.fillText(cab.no,cab.x,cab.y-10)}
    if(cab.state==='broken'){ctx.strokeStyle=C.bad;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(cab.x-6,cab.y-6);ctx.lineTo(cab.x+6,cab.y+6);ctx.moveTo(cab.x+6,cab.y-6);ctx.lineTo(cab.x-6,cab.y+6);ctx.stroke()}
    if(cab.state==='service'){ctx.fillStyle=C.warn;ctx.font='700 10px "Barlow Condensed",sans-serif';ctx.fillText('SERVICE',cab.x,cab.y+17)}
  }
  // floaters
  S.floaters=S.floaters.filter(f=>now-f.born<1600);
  for(const f of S.floaters){const a=(now-f.born)/1600;ctx.globalAlpha=1-a;ctx.fillStyle=f.col;ctx.font='700 13px "JetBrains Mono",monospace';ctx.textAlign='center';ctx.fillText(f.text,f.x,f.y-18-a*22)}
  ctx.globalAlpha=1;
  // night tint
  const dark=clamp((h-20)/3,0,1)*.28+clamp((7-h)/1.5,0,1)*.2;if(dark>0){ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='rgba(4,8,20,'+dark.toFixed(3)+')';ctx.fillRect(0,0,view.w,view.h)}
}
function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function label(t,x,y,sp){let w=0;for(const ch of t)w+=ctx.measureText(ch).width+sp;let cx=x-w/2;ctx.textAlign='left';for(const ch of t){ctx.fillText(ch,cx,y);cx+=ctx.measureText(ch).width+sp}ctx.textAlign='center'}
function building(x,y,t,col){ctx.font='700 10px "Barlow Condensed",sans-serif';const w=ctx.measureText(t).width+14;ctx.fillStyle='#1b222c';ctx.strokeStyle=col;ctx.lineWidth=1.2;rr(x,y,w,17,2);ctx.fill();ctx.stroke();ctx.fillStyle=col;ctx.textAlign='left';ctx.fillText(t,x+7,y+12.5);ctx.textAlign='center'}
function flag(x,y,col){ctx.strokeStyle=col;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-22);ctx.stroke();ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(x,y-22);ctx.lineTo(x+12,y-18);ctx.lineTo(x,y-14);ctx.closePath();ctx.fill()}

