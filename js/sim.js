// ---------- traffic ----------
function updateTraffic(){
  const h=S.t/60,g=globalTraffic(h),ab=absNow();
  for(const e of edges){
    const nd=(demand(nodes[e.a].d,h)+demand(nodes[e.b].d,h))/2;
    e.noise=clamp(e.noise+(rnd()-.5)*.1,0,1);
    let m=1+g*(e.main?1.15:.7)*(.5+nd)+e.noise*.25+(e.bridge?g*.6:0);
    if(e.works>ab)m*=2.8;
    e.mult=m;
  }
}
function maybeRoadworks(dt){
  if(rnd()<.0016*dt){const e=pick(edges);if(e.works<absNow()){e.works=absNow()+300+rnd()*1200;updateTraffic();toast('Roadworks near '+esc(D[nodes[e.a].d].name)+'.','');log('Roadworks started in <b>'+D[nodes[e.a].d].name+'</b>.')}}
}

// ---------- customers ----------
function pickDest(from,h){
  const night=h>=21||h<9;
  const ks=Object.keys(D);const ws=ks.map(k=>demand(k,h+.5)*.7+D[k].home*(night?.9:.25));
  for(let tries=0;tries<12;tries++){
    let r=rnd()*ws.reduce((a,b)=>a+b,0),k=ks[0];for(let i=0;i<ks.length;i++){r-=ws[i];if(r<=0){k=ks[i];break}}
    const n=pick(nodes.filter(x=>x.d===k)).id;
    if(n!==from&&Math.hypot(nodes[n].x-nodes[from].x,nodes[n].y-nodes[from].y)>SP*1.6)return n;
  }
  return nodes[(from+37)%nodes.length].id;
}
function spawn(dt){
  const h=S.t/60,rf=.7+S.rep/166;
  for(const k in D){
    if(rnd()<.052*demand(k,h)*rf*dt){
      const rk=RANKS.find(r=>r.d===k);let node,type='street',rankId=null;
      if(rk&&rnd()<.4){node=rk.node;type='rank';rankId=rk.id}else node=pick(nodesBy[k]);
      S.customers.push({id:uid(),node,dest:pickDest(node,h),type,rankId,t0:absNow(),patience:type==='rank'?50:30,claimedBy:null,off:rnd()});
    }
  }
  if(S.operator&&tod()>=420&&tod()<1380){
    const p=(.024*(.6+S.rep/100)*globalTraffic(h)+S.regulars*.0015)*dt;
    if(rnd()<p){
      const ks=Object.keys(D);const k=pick(ks.filter(x=>D[x].home>.2||rnd()<.5));
      const node=pick(nodesBy[k]);const at=S.t+25+rnd()*50;const atm=((at%1440)+1440)%1440;
      const cover=S.drivers.filter(d=>d.cabId!=null&&inShift(d.shift,atm)&&S.cabs.some(c=>c.id===d.cabId)).length;
      if(!cover||S.customers.filter(c=>c.type==='booked'&&!c.claimedBy).length>=cover)return; // operator turns away jobs the rota can't cover
      const regular=S.regulars>0&&rnd()<Math.min(.5,S.regulars*.05);
      S.customers.push({id:uid(),node,dest:pickDest(node,at/60),type:'booked',pickupAt:at,t0:absNow(),claimedBy:null,regular,off:rnd()});
      toast('New booking for '+hhmm(at)+' in '+esc(D[k].name)+(regular?' (a regular)':'')+'.','');
    }
  }
}
function expire(){
  const ab=absNow();
  for(const c of [...S.customers]){
    if(c.type==='booked'){
      if(S.t>c.pickupAt+20&&!(c.claimedBy&&S.t<c.pickupAt+35)){removeCust(c,true);rep(-2);S.today.lost++;log('Missed a booking at <b>'+hhmm(c.pickupAt)+'</b>. Reputation down.');toast('Missed booking. Reputation down.','bad')}
    }else{
      const limit=c.patience+(c.claimedBy?25:0);
      if(ab-c.t0>limit){removeCust(c,true);S.today.lost++}
    }
  }
}
function removeCust(c,release){
  S.customers=S.customers.filter(x=>x!==c);
  if(release&&c.claimedBy){const cab=S.cabs.find(x=>x.id===c.claimedBy);if(cab&&cab.job&&cab.job.cust===c){cab.job=null;cab.state=cab.route?'moving':'idle';cab.targetRank=null}}
  for(const cab of S.cabs)if(cab.next===c)cab.next=null;
}
function releaseNext(cab){if(cab.next){if(S.customers.includes(cab.next))cab.next.claimedBy=null;cab.next=null}}

// ---------- cab movement ----------
const cabF=c=>c.driver&&c.driver.skill?1.06-c.driver.skill*.02:1;
function setRoute(cab,dest){
  let p;
  if(cab.route&&cab.seg<cab.route.length-1){
    const a=cab.route[cab.seg],b=cab.route[cab.seg+1];
    const rest=route(b,dest,tt)||[b];p=[a,...rest];cab.route=p;cab.seg=0;
  }else{
    p=route(cab.node,dest,tt);if(!p)return false;cab.route=p;cab.seg=0;cab.prog=0;
    cab.segDur=p.length>1?tt(edges[edgeOf(p[0],p[1])])*cabF(cab):0;
  }
  cab.rankId=null;return true;
}
function sendTo(cab,node,rank){cab.state='moving';cab.targetRank=rank||null;cab.job=null;setRoute(cab,node)}
function goPickup(cab,c){c.claimedBy=cab.id;cab.job={cust:c};cab.state='toPickup';cab.targetRank=null;setRoute(cab,c.node)}
function moveCab(cab,dt){
  if(!cab.route)return;
  while(dt>0){
    if(cab.seg>=cab.route.length-1){const r=cab.route;cab.route=null;cab.node=r[r.length-1];cab.prog=0;arrive(cab);return}
    const rem=(1-cab.prog)*cab.segDur;
    if(dt<rem){cab.prog+=dt/cab.segDur;dt=0}
    else{
      dt-=rem;const e=edges[edgeOf(cab.route[cab.seg],cab.route[cab.seg+1])];
      cab.seg++;cab.prog=0;cab.node=cab.route[cab.seg];
      driveKm(cab,e.len/KM);if(cab.state==='broken')return;
      if(cab.seg<cab.route.length-1)cab.segDur=tt(edges[edgeOf(cab.route[cab.seg],cab.route[cab.seg+1])])*cabF(cab);
    }
  }
}
function driveKm(cab,km){
  if(cab.firm!=='you')return;
  const fuel=km*.12;S.cash-=fuel;S.today.fuel+=fuel;
  cab.wear=clamp(cab.wear+km*(S.mechanic?.0005:.0009),0,1);
  if(rnd()<(.0001+cab.wear*cab.wear*.01)*km)breakdown(cab);
}
function breakdown(cab){
  const cost=S.mechanic?60:150;S.cash-=cost;S.today.repairs+=cost;
  if(cab.job){const c=cab.job.cust;if(cab.state==='onFare'){rep(-1);S.today.lost++}else if(S.customers.includes(c))c.claimedBy=null;cab.job=null}
  releaseNext(cab);
  if(isPlayerCab(cab))S.chat=null,renderChat();
  cab.route=null;cab.state='broken';cab.brokenUntil=absNow()+(S.mechanic?120:240);cab.wear=.12;
  const who=isPlayerCab(cab)?'Your cab':'Cab '+cab.no;
  log(who+' broke down in <b>'+D[nodes[cab.node].d].name+'</b>. Repair '+money0(cost)+'.');toast(who+' broke down. Off the road for '+(S.mechanic?2:4)+' hours.','bad');
}
function arrive(cab){
  if(cab.state==='moving'){cab.state='idle';if(cab.targetRank){cab.rankId=cab.targetRank;cab.rankSince=absNow();cab.targetRank=null}return}
  if(cab.state==='toPickup'){
    const c=cab.job&&cab.job.cust;
    if(!c||!S.customers.includes(c)){cab.job=null;cab.state='idle';return}
    if(c.type==='booked'&&S.t<c.pickupAt){cab.state='waiting';return}
    pickup(cab);return;
  }
  if(cab.state==='onFare'){completeFare(cab);return}
  cab.state='idle';
}
function pickup(cab){
  const c=cab.job.cust;S.customers=S.customers.filter(x=>x!==c);
  const short=route(c.node,c.dest,byLen)||[c.node,c.dest];const km=pathStats(short).km;
  const quick=route(c.node,c.dest,tt);
  cab.job.fare=fareFor(km)*(c.type==='booked'?1.2:1);cab.job.km=km;cab.job.quick=pathStats(quick).min;cab.job.start=absNow();cab.job.tip=0;
  if(c.regular){cab.job.fare*=1.0}
  if(isPlayerCab(cab)){
    const opts=[];const add=(label,p,col)=>{if(!p)return;const k=p.join(',');const ex=opts.find(o=>o.key===k);if(ex){ex.label+=' + '+label.toLowerCase();return}opts.push({label,path:p,key:k,col,...pathStats(p)})};
    add('Quickest',quick,'#f5b82e');add('Shortest',short,'#63c3d8');
    const qs=new Set();for(let i=0;i<quick.length-1;i++)qs.add(edgeOf(quick[i],quick[i+1]));
    add('Alternative',route(c.node,c.dest,e=>tt(e)*(qs.has(e.id)?1.9:1)),'#e889a8');
    cab.state='choosing';S.choosing={cab,cust:c,opts};S.hoverRoute=-1;renderOverlay();render(true);
  }else{
    startFare(cab,quick);
  }
}
function startFare(cab,path){
  cab.state='onFare';cab.route=path;cab.seg=0;cab.prog=0;cab.segDur=path.length>1?tt(edges[edgeOf(path[0],path[1])])*cabF(cab):0;cab.rankId=null;
  if(isPlayerCab(cab)&&rnd()<.55)cab.job.chatAt=absNow()+Math.max(1.5,cab.job.quick*.25);
}
function completeFare(cab){
  const j=cab.job;const fare=j.fare;let tip=j.tip||0;
  const late=absNow()-j.start>j.quick*1.5+4;
  if(cab.firm==='you'){
    if(isPlayerCab(cab)){S.cash+=fare+tip;S.today.fares+=fare;S.today.tips+=tip}
    else{const comm=fare*COSTS.commission;S.cash+=fare-comm;S.today.fares+=fare;S.today.comm+=comm;const sk=cab.driver.skill;if(rnd()<sk*.06)rep(.5);if(rnd()<sk*.02){S.regulars++;log('<b>'+esc(cab.driver.name)+'</b> won the firm a regular.')}if(sk<=1&&rnd()<.25)rep(-1)}
    S.today.jobs++;if(late)rep(-1);
    float(cab.x,cab.y,'+'+money(fare+tip),C.cab);
    if(isPlayerCab(cab)){S.chat=null;renderChat()}
  }else{S.rival.today+=fare;S.rival.total+=fare}
  cab.job=null;cab.state='idle';
  if(cab.next){const nx=cab.next;cab.next=null;if(S.customers.includes(nx)&&cab.driver){goPickup(cab,nx);return}}
  if(cab.mode==='hold'&&cab.holdNode!=null&&cab.holdNode!==cab.node)sendTo(cab,cab.holdNode,rankByNode.has(cab.holdNode)?rankByNode.get(cab.holdNode).id:null);
}

// ---------- drivers' own decisions ----------
function freeForWork(c){return c.driver&&!c.job&&(c.state==='idle'||c.state==='moving')&&!(isPlayerCab(c))}
function nearestHail(cab,maxD){let best=null,bd=maxD;for(const c of S.customers){if(c.type!=='street'||c.claimedBy)continue;const d=Math.hypot(nodes[c.node].x-cab.x,nodes[c.node].y-cab.y);if(d<bd){bd=d;best=c}}return best}
function autoDecide(){
  const h=S.t/60;
  for(const cab of S.cabs){
    if(!freeForWork(cab))continue;
    if(cab.firm==='you'&&cab.mode==='hold'){
      const c=nearestHail(cab,170);if(c){goPickup(cab,c);continue}
      if(cab.state==='idle'&&cab.holdNode!=null&&cab.node!==cab.holdNode)sendTo(cab,cab.holdNode,rankByNode.has(cab.holdNode)?rankByNode.get(cab.holdNode).id:null);
      continue;
    }
    const range=cab.rankId?200:(cab.state==='moving'?260:380);
    const c=nearestHail(cab,range);if(c){goPickup(cab,c);continue}
    if(cab.state==='idle'&&!cab.rankId){
      let best=null,bs=Infinity;
      for(const rk of RANKS){const q=S.cabs.filter(x=>x.rankId===rk.id||x.targetRank===rk.id).length;const dm=demand(rk.d,h);const s=(q+1)/(.3+dm)+Math.hypot(nodes[rk.node].x-cab.x,nodes[rk.node].y-cab.y)/300+rnd()*.8;if(s<bs){bs=s;best=rk}}
      if(best)sendTo(cab,best.node,best.id);
    }
  }
  if(S.bookingsAuto&&S.operator){
    for(const c of S.customers){
      if(c.type!=='booked'||c.claimedBy||c.pickupAt-S.t>30)continue;
      const pn=nodes[c.node];
      let best=null,bd=Infinity;for(const cab of ourCabs()){if(!freeForWork(cab)||(isPlayerCab(cab)&&!S.opUsesYou))continue;const d=Math.hypot(pn.x-cab.x,pn.y-cab.y);if(d<bd){bd=d;best=cab}}
      if(best){goPickup(best,c);log('Operator sent <b>'+esc(isPlayerCab(best)?'you':best.driver.name)+'</b> to the '+hhmm(c.pickupAt)+' booking.');if(isPlayerCab(best))toast('The operator has put you on the '+hhmm(c.pickupAt)+' booking.');continue}
      if(c.pickupAt-S.t>20)continue;
      for(const cab of ourCabs()){if(!cab.driver||cab.next||cab.state!=='onFare'||!cab.job||(isPlayerCab(cab)&&!S.opUsesYou))continue;const dn=nodes[cab.job.cust.dest];const d=Math.hypot(pn.x-dn.x,pn.y-dn.y);if(d<bd){bd=d;best=cab}}
      if(best){best.next=c;c.claimedBy=best.id;log('Operator queued the '+hhmm(c.pickupAt)+' booking for <b>'+esc(isPlayerCab(best)?'you':best.driver.name)+'</b> after their current fare.')}
    }
  }
}
function rankMatch(){
  for(const rk of RANKS){
    const q=S.customers.filter(c=>c.rankId===rk.id&&!c.claimedBy).sort((a,b)=>a.t0-b.t0);if(!q.length)continue;
    const cabs=S.cabs.filter(c=>c.rankId===rk.id&&c.state==='idle'&&!c.route&&c.driver&&!c.job).sort((a,b)=>a.rankSince-b.rankSince);
    while(q.length&&cabs.length){
      const c=q.shift(),cab=cabs.shift();if(isPlayerCab(cab)&&S.choosing)continue;
      c.claimedBy=cab.id;cab.job={cust:c};cab.state='toPickup';cab.rankId=null;pickup(cab);
      if(S.choosing)return;
    }
  }
}

// ---------- shifts ----------
function rosterUpdate(){
  const m=tod();
  for(const cab of ourCabs()){
    const want=S.drivers.find(d=>d.cabId===cab.id&&inShift(d.shift,m)&&!S.cabs.some(o=>o!==cab&&o.driver===d))||null;
    if(cab.driver===want||cab.job||cab.state==='choosing')continue;
    const was=cab.driver;cab.driver=want;cab.mode='auto';cab.holdNode=null;if(!want)releaseNext(cab);
    if(want){
      if(want.isPlayer){S.selected=cab.id;toast('Your shift has started. You\'re in cab '+cab.no+'.','good')}
      else log('<b>'+esc(want.name)+'</b> started a shift in cab '+cab.no+'.');
      if(cab.state==='moving'&&!cab.route)cab.state='idle';
    }else{
      if(was&&was.isPlayer){toast('Your shift is over. Business decisions are all open.');if(S.chat){S.chat=null;renderChat()}}
      if(S.office&&cab.state!=='broken'&&cab.state!=='service'&&cab.node!==OFFICE)sendTo(cab,OFFICE);
    }
  }
}
function zoomState(){
  const ours=ourCabs();if(ours.some(c=>c.driver||c.job))return null;
  const rota=S.drivers.filter(d=>d.shift!=='off'&&d.cabId!=null&&S.cabs.some(c=>c.id===d.cabId));
  if(!rota.length)return{none:true};
  const m=tod();let best=Infinity,next=null;
  for(const d of rota){const dd=(SHIFTS[d.shift].s-m+1440)%1440;if(dd<best){best=dd;next=d}}
  return{next,at:SHIFTS[next.shift].s};
}
let lastZoom='';
function renderZoom(){
  const z=S.modal||S.choosing?null:zoomState();if(!z)S.zoomHold=false;
  let h='';
  if(z&&z.none)h='<span>Nobody is on the rota. Put yourself or a driver on a shift in the Firm tab.</span>';
  else if(z){const who=z.next.isPlayer?'you':esc(z.next.name);
    h=S.zoomHold?'<span>Nobody on shift until '+hhmm(z.at)+'.</span><button class="btn" data-act="zoomgo">Fast-forward</button>':'<span><b>Fast-forwarding</b> to '+hhmm(z.at)+', when '+who+' '+(z.next.isPlayer?'start':'starts')+'.</span><button class="btn" data-act="zoomstop">Stop</button>'}
  if(h!==lastZoom){$('zoom').innerHTML=h;lastZoom=h}
}

// ---------- the clock ----------
function tick(dt){
  S.t+=dt;const ab=absNow();
  trafficTimer+=dt;if(trafficTimer>=5){trafficTimer=0;updateTraffic()}
  spawn(dt);maybeRoadworks(dt);rosterUpdate();
  for(const cab of S.cabs){
    if(cab.state==='broken'&&ab>=cab.brokenUntil){cab.state='idle';if(cab.firm==='you')toast((isPlayerCab(cab)?'Your cab':'Cab '+cab.no)+' is back on the road.','good')}
    if(cab.state==='service'&&ab>=cab.brokenUntil){cab.state='idle'}
    if(cab.state==='waiting'&&cab.job&&S.t>=cab.job.cust.pickupAt){if(S.customers.includes(cab.job.cust))pickup(cab);else{cab.job=null;cab.state='idle'}}
    if(S.choosing)break;
    moveCab(cab,dt);
    if(S.choosing)break;
  }
  if(S.choosing)return;
  rankMatch();if(S.choosing)return;
  autoTimer+=dt;if(autoTimer>=.5){autoTimer=0;autoDecide()}
  expire();
  const pc=playerCab();
  if(pc&&pc.job&&pc.job.chatAt&&ab>=pc.job.chatAt&&pc.state==='onFare'){
    pc.job.chatAt=null;const ch=pick(CHATS);const replies=[['good',ch.good],['ok',ch.ok],['bad',ch.bad]].sort(()=>rnd()-.5);
    S.chat={q:ch.q,replies,start:ab,until:ab+14,result:null};renderChat();
  }
  if(S.chat&&!S.chat.result&&ab>S.chat.until){S.chat=null;renderChat()}
  if(S.t>=1800)endDay();
}
function endDay(){
  const ours=ourCabs();const leased=ours.filter(c=>!c.owned).length,owned=ours.filter(c=>c.owned).length;
  const fixed={lease:leased*COSTS.lease,upkeep:owned*COSTS.upkeep,rent:S.office?COSTS.rent:0,operator:S.operator?COSTS.operator:0,mechanic:S.mechanic?COSTS.mechanic:0};
  const fixedTotal=Object.values(fixed).reduce((a,b)=>a+b,0);S.cash-=fixedTotal;
  const d=S.today;const net=d.fares+d.tips-d.comm-d.fuel-d.repairs-d.service-fixedTotal;
  S.history.unshift({day:S.day,...d,fixed:fixedTotal,net,rival:S.rival.today});
  if(S.cash<0)S.negDays++;else S.negDays=0;
  const rivals=S.cabs.filter(c=>c.firm==='rival');
  let rivalNews='';
  if(S.rival.today>rivals.length*260&&rivals.length<5&&S.day%2===0){const rc=makeCab('rival',RIVAL_DEPOT);rc.driver={name:'Castle driver',skill:3};S.cabs.push(rc);rivalNews='Castle Cars put another cab on the road. They now run '+(rivals.length+1)+'.'}
  const done=S.day;
  S.t-=1440;S.day++;
  for(const c of S.customers)if(c.type==='booked')c.pickupAt-=1440;
  for(const cab of S.cabs){const c=cab.job&&cab.job.cust;if(c&&c.type==='booked'&&!S.customers.includes(c))c.pickupAt-=1440}
  S.today=blankDay();S.rival.today=0;genCandidates();genMarket();
  S.modal={type:S.negDays>=3?'over':'day',day:done,fixed,fixedTotal,net,rivalNews};
  renderOverlay();render(true);save();
}
function startNextDay(){
  S.modal=null;log('Day '+S.day+' under way.');renderOverlay();render(true);
}

