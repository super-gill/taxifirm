// ---------- loop ----------
let last=performance.now();
function frame(now){
  const realDt=Math.min(100,now-last);last=now;
  if(!S.paused&&!S.choosing&&!S.modal){const z=S.zoomHold?null:zoomState();let dt=realDt/1000*(z&&!z.none?45:S.speed);while(dt>0&&!S.choosing&&!S.modal){const step=Math.min(dt,.25);tick(step);dt-=step}}
  if(view.w)drawMap(now);
  renderTop();render(false);renderZoom();
  if(S.chat&&!S.chat.result){const b=document.getElementById('chatBar');if(b)b.style.width=Math.max(0,100*(1-(absNow()-S.chat.start)/(S.chat.until-S.chat.start)))+'%'}
  requestAnimationFrame(frame);
}
function serialize(){
  const drv=d=>!d?null:(S.drivers.includes(d)?{ref:d.id}:{...d});
  const data={...S,floaters:[],hoverRoute:-1,
    cabs:S.cabs.map(c=>({...c,driver:drv(c.driver),job:c.job?{...c.job,cust:c.job.cust?{...c.job.cust}:null}:null})),
    choosing:S.choosing?{cabId:S.choosing.cab.id,opts:S.choosing.opts}:null,
    _edges:edges.map(e=>[e.works,e.noise]),_nextId:nextId,_timers:[trafficTimer,autoTimer],_tab:tab};
  return JSON.stringify(data);
}
function save(){if(!S)return;try{localStorage.setItem(SAVE_KEY,serialize())}catch(e){}}
function restore(snap){
  let raw=snap;
  if(!raw){try{raw=localStorage.getItem(SAVE_KEY)}catch(e){raw=null}}
  if(!raw)return false;
  try{
    const d=JSON.parse(raw);if(!d||d.v!==2||!Array.isArray(d.cabs))return false;
    const ch=d.choosing,ed=d._edges||[];nextId=d._nextId||1000;[trafficTimer,autoTimer]=d._timers||[0,0];tab=d._tab||'cab';
    delete d._edges;delete d._nextId;delete d._timers;delete d._tab;
    S=d;S.floaters=[];S.hoverRoute=-1;
    for(const c of S.cabs){
      if(c.driver&&c.driver.ref!=null)c.driver=S.drivers.find(x=>x.id===c.driver.ref)||null;
      if(c.job&&c.job.cust){const live=S.customers.find(x=>x.id===c.job.cust.id);if(live)c.job.cust=live}
      if(c.next){c.next=S.customers.find(x=>x.id===c.next.id)||null}
    }
    S.choosing=null;
    if(ch){const cab=S.cabs.find(x=>x.id===ch.cabId);if(cab&&cab.job&&cab.job.cust)S.choosing={cab,cust:cab.job.cust,opts:ch.opts};else if(cab){cab.job=null;cab.state='idle'}}
    ed.forEach((v,i)=>{if(edges[i]){edges[i].works=v[0];edges[i].noise=v[1]}});
    updateTraffic();
    return true;
  }catch(e){return false}
}
function boot(data){
  const snap=data&&typeof data==='object'&&typeof data.save==='string'?data.save:null;
  if(restore(snap)){log('Welcome back. Picked up where you left off.')}else newGame();
  syncSpeed();renderOverlay();renderChat();render(true);resize();save();
  requestAnimationFrame(frame);
}
setInterval(save,3000);
addEventListener('pagehide',save);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')save()});
try{window.claude?.hot?.snapshot?.(()=>({save:serialize()}))}catch(e){}
const hot=window.claude&&window.claude.hot;
if(hot&&typeof hot.ready==='function')hot.ready(boot);else boot(hot&&hot.data);
