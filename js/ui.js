// ---------- panel ----------
const $=id=>document.getElementById(id);
function objective(){
  if(S.act1)return'<b>Act 1 complete.</b> The firm runs without you. Keep growing, or put yourself back on the rota.';
  if(!S.office)return'<b>Next:</b> take fares and rent an office (£500 deposit). Park at a rank or click a waiting customer.';
  if(!hired().length)return'<b>Next:</b> hire a driver to work your cab while you\'re off shift.';
  if(!S.operator)return'<b>Next:</b> hire an operator so bookings start coming in.';
  if(ourCabs().length<2)return'<b>Next:</b> get a second cab. Lease one, or buy used from the car market.';
  if(ourCabs().length<3)return'<b>Next:</b> grow to three cabs and keep them rostered.';
  return'<b>Next:</b> take yourself off the rota when the firm can run without you.';
}
function stateText(cab){
  const where=placeName(cab.node);
  switch(cab.state){
    case 'idle':return cab.rankId?'Waiting at '+rankByNode.get(cab.node).name+(queuePos(cab)?' ('+queuePos(cab)+' in the queue)':''):'Parked in '+where;
    case 'moving':return 'Driving to '+(cab.targetRank?RANKS.find(r=>r.id===cab.targetRank).name:placeName(cab.route?cab.route[cab.route.length-1]:cab.node));
    case 'toPickup':return 'Heading to a pickup in '+D[nodes[cab.job.cust.node].d].name;
    case 'waiting':return 'Waiting for the '+hhmm(cab.job.cust.pickupAt)+' booking';
    case 'choosing':return 'Picking a route';
    case 'onFare':return 'Carrying a fare to '+D[nodes[cab.job.cust.dest].d].name;
    case 'broken':return 'Broken down until '+hhmm((cab.brokenUntil)%1440);
    case 'service':return 'In for a service until '+hhmm(cab.brokenUntil%1440);
  }return cab.state;
}
function queuePos(cab){const q=S.cabs.filter(c=>c.rankId===cab.rankId&&c.state==='idle').sort((a,b)=>a.rankSince-b.rankSince);return q.indexOf(cab)+1}
function statePill(cab){const m={idle:['Free',''],moving:['Driving',''],toPickup:['Pickup','book'],waiting:['Booked','book'],choosing:['Fare','cab'],onFare:['Fare','cab'],broken:['Broken','bad'],service:['Service','warn']};const [t,k]=m[cab.state]||[cab.state,''];return'<span class="pill '+k+'">'+t+'</span>'}
function wearBar(w){const col=w<.4?'var(--good)':w<.7?'var(--warn)':'var(--bad)';return'<span class="wear" title="Wear '+Math.round(w*100)+'%"><i style="width:'+Math.round(w*100)+'%;background:'+col+'"></i></span>'}
function B(a,label,opts={}){const attrs=Object.entries(opts.data||{}).map(([k,v])=>' data-'+k+'="'+esc(v)+'"').join('');return'<button class="btn '+(opts.cls||'')+'" data-act="'+a+'"'+attrs+(opts.dis?' disabled':'')+'>'+label+'</button>'}

function shiftOptions(dr){return Object.keys(SHIFTS).map(k=>{const clash=dr.cabId!=null&&S.drivers.some(o=>o!==dr&&o.cabId===dr.cabId&&overlaps(o.shift,k));return'<option value="'+k+'"'+(dr.shift===k?' selected':'')+(clash?' disabled':'')+'>'+shiftLabel(k)+(clash?' (clash)':'')+'</option>'}).join('')}
function paneCab(){
  const pc=playerCab(),me=S.drivers.find(x=>x.isPlayer);let h='';
  const myShift='<div class="row small"><span class="muted">Your shift</span><select class="sel-in" data-act="shift" data-id="'+me.id+'" aria-label="Your shift">'+shiftOptions(me)+'</select></div>';
  if(!pc){
    const off=me.shift==='off';
    h+='<div class="card"><h3>'+(off?'You\'re off the rota, running the firm':'You\'re off shift')+'</h3><p class="muted">'+(off?'Your drivers are working. Select a cab on the map or in the Firm tab to send it somewhere.':'Your next shift starts at '+hhmm(SHIFTS[me.shift].s)+(me.cabId==null?', but you have no cab. Pick one in the Firm tab rota.':'.')+' Hiring, buying and renting are all open while you\'re off.')+'</p>'+myShift+'</div>';
  }else{
    h+='<div class="card"><div class="row spread"><h3>'+esc(stateText(pc))+'</h3>'+statePill(pc)+'</div>';
    if(pc.job&&pc.job.cust){const c=pc.job.cust;h+='<p class="small muted">'+esc(D[nodes[c.node].d].name)+' to '+esc(D[nodes[c.dest].d].name)+(pc.job.fare?' · metered <span class="num">'+money(pc.job.fare)+'</span>'+(pc.job.tip?' + tip <span class="num">'+money(pc.job.tip)+'</span>':''):'')+(c.type==='booked'?' · booking':'')+'</p>'}
    h+='<div class="row">';
    if(!pc.job&&pc.state!=='broken'&&pc.state!=='service')h+=B('nearest','Take nearest fare',{cls:'primary'});
    if(pc.job)h+=B('bail','Bail out',{cls:'danger'});
    if(!pc.job&&pc.state!=='broken'&&pc.state!=='service'&&pc.wear>.15)h+=B('service','Service cab ('+(S.mechanic?'£15':'£40')+')',{data:{id:pc.id}});
    h+='</div>';
    h+='<div class="row small muted"><span>Cab '+pc.no+' wear</span>'+wearBar(pc.wear)+'<span>'+esc(pc.model||(pc.owned?'Owned':'Leased'))+'</span></div>'+myShift+'</div>';
    if(locked())h+='<div class="lock"><b>On a job.</b> Hiring, leasing, buying and renting wait until you drop off. You can still send your drivers around the map.</div>';
  }
  const d=S.today;
  h+='<div class="card"><h2>Today</h2><table><tr><td>Jobs done</td><td class="r num">'+d.jobs+'</td></tr><tr><td>Fares taken</td><td class="r num">'+money(d.fares)+'</td></tr><tr><td>Tips</td><td class="r num">'+money(d.tips)+'</td></tr><tr><td>Fuel</td><td class="r num">'+money(-d.fuel)+'</td></tr><tr><td>Regulars</td><td class="r num">'+S.regulars+'</td></tr><tr><td>Castle Cars took</td><td class="r num">'+money0(S.rival.today)+'</td></tr></table>'+(S.regulars&&!S.operator?'<p class="small muted">Regulars book through an operator. Hire one to hear from them.</p>':'')+'</div>';
  h+='<div class="card"><h2>How to drive</h2><ul class="small muted" style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:4px"><li>Click anywhere on the map to drive there. Click a <b>RANK</b> to join its queue.</li><li>Click a waiting customer to go for them. The ring shows how long they\'ll wait.</li><li>A yellow ring means your firm has claimed them, purple means Castle Cars got there first.</li><li>On a fare you pick the route. Quick drops mean more jobs.</li><li>You only drive during your shift. When nobody is on shift the clock fast-forwards.</li></ul>'+legend()+'</div>';
  return h;
}
function legend(){return'<div class="legend"><span><i style="background:var(--good)"></i>Clear</span><span><i style="background:var(--warn)"></i>Busy</span><span><i style="background:var(--bad)"></i>Jammed</span><span><i style="background:#ff8a1f"></i>Roadworks</span><span><i style="background:var(--cab)"></i>Starline</span><span><i style="background:var(--rival)"></i>Castle Cars</span><span><i style="background:var(--booked)"></i>Booking</span></div>'}
const ROTA_COLS=['#63c3d8','#8fd08a','#e889a8','#c9a0ff','#f09a5e'];
function strip(cab){
  let segs='';const ds=S.drivers.filter(d=>d.cabId===cab.id&&d.shift!=='off');
  const colOf=d=>d.isPlayer?'var(--cab)':ROTA_COLS[S.drivers.indexOf(d)%ROTA_COLS.length];
  ds.forEach(d=>{const {s,e}=SHIFTS[d.shift];const col=colOf(d);const blk=(a,b)=>'<i style="left:'+(a/14.4).toFixed(2)+'%;width:'+((b-a)/14.4).toFixed(2)+'%;background:'+col+'"></i>';segs+=s<e?blk(s,e):blk(s,1440)+blk(0,e)});
  const who=ds.length?ds.map(d=>'<span style="color:'+colOf(d)+'">'+esc(d.isPlayer?'You':d.name.split(' ')[0])+'</span> '+hhmm(SHIFTS[d.shift].s)+'–'+hhmm(SHIFTS[d.shift].e)).join(' · '):'<span class="muted">Nobody rostered</span>';
  return'<div class="strip" title="24-hour rota">'+segs+'<b style="left:'+(tod()/14.4).toFixed(1)+'%"></b></div><div class="strip-l"><span>00</span><span>06</span><span>12</span><span>18</span><span>24</span></div><div class="small">'+who+'</div>';
}
function paneFirm(){
  const L=locked(),n=ourCabs().length,hasH=hired().length>0,slot=freeSlot();
  const steps=[
    {t:'Rent an office',d:'£500 deposit, then £60 a day. Lets you hire drivers and get more cabs.',done:S.office,avail:true,btn:B('rent','Rent office',{cls:'primary',dis:L||S.cash<500})},
    {t:'Hire a driver for your cab',d:'They work your cab while you\'re off shift, so it earns round the clock. Drivers keep 40% of their fares.',done:hasH,avail:S.office,hint:'Pick someone in the rota section below.'},
    {t:'Hire an operator',d:'£80 a day. Bookings start coming in, and regulars can call.',done:S.operator,avail:S.office,btn:B('operator','Hire operator',{cls:'primary',dis:L})},
    {t:'Get a second cab',d:'Lease one for £35 a day, or buy a used one from the car market below.',done:n>=2,avail:S.office,hint:'See the car market below.'},
    {t:'Grow to three cabs',d:'Each cab can carry two or three drivers across the day.',done:n>=3,avail:n>=2,hint:'See the car market below.',lockText:'Needs two cabs.'},
    {t:'Hire a mechanic',d:'£90 a day. Slower wear, repairs £60 instead of £150, quicker services.',done:S.mechanic,avail:n>=3,btn:B('mechanic','Hire mechanic',{cls:'primary',dis:L}),lockText:'Needs three cabs.'},
    {t:'Take yourself off the rota',d:'Set your shift to "Off the rota". This ends Act 1.',done:S.act1,avail:hasH,hint:'Change your shift in the rota below.',lockText:'Needs at least one hired driver.'}
  ];
  const nextI=steps.findIndex(s=>!s.done);
  let h='';if(L)h+='<div class="lock"><b>On a job.</b> Business decisions unlock when you drop off. The rota can still be changed.</div>';
  h+='<h2>Growing the firm</h2><ol class="ladder">';
  steps.forEach((s,i)=>{
    h+='<li class="step '+(s.done?'done':i===nextI?'next':'')+'"><span class="k">'+(s.done?'✓':i+1)+'</span><div class="body"><b>'+s.t+'</b><span class="small muted">'+s.d+'</span>';
    if(!s.done&&s.avail&&s.btn)h+='<div class="row">'+s.btn+'</div>';
    else if(!s.done&&s.avail&&s.hint&&i===nextI)h+='<span class="small" style="color:var(--cab)">'+s.hint+'</span>';
    else if(!s.done&&!s.avail)h+='<span class="small muted">'+(s.lockText||'Locked until the step above is done.')+'</span>';
    h+='</div></li>';
  });
  h+='</ol>';
  h+='<h2>Rota</h2><p class="small muted">Everyone works a shift on one cab. Shifts on the same cab can\'t overlap. Changes apply straight away, or after the current job.</p><div class="fleet">';
  for(const dr of S.drivers){
    const active=S.cabs.find(c=>c.driver===dr);
    const cabOpts='<option value=""'+(dr.cabId==null?' selected':'')+'>No cab</option>'+ourCabs().map(c=>{const clash=S.drivers.some(o=>o!==dr&&o.cabId===c.id&&overlaps(o.shift,dr.shift));return'<option value="'+c.id+'"'+(dr.cabId===c.id?' selected':'')+(clash?' disabled':'')+'>Cab '+c.no+(clash?' (clash)':'')+'</option>'}).join('');
    h+='<div class="card" style="gap:6px"><div class="row spread"><b>'+(dr.isPlayer?'You':esc(dr.name)+' <span class="muted small">'+'★'.repeat(dr.skill)+'</span>')+'</b>'+(active?'<span class="pill good">On shift</span>':'<span class="pill">Off</span>')+'</div><div class="row"><select class="sel-in" data-act="setcab" data-id="'+dr.id+'" aria-label="Cab for '+esc(dr.name)+'">'+cabOpts+'</select><select class="sel-in" data-act="shift" data-id="'+dr.id+'" aria-label="Shift for '+esc(dr.name)+'">'+shiftOptions(dr)+'</select></div>'+(dr.isPlayer?'':'<div class="row">'+B('dismiss','Let go',{data:{id:dr.id},cls:'danger',dis:L})+'</div>')+'</div>';
  }
  h+='</div>';
  if(S.office){
    h+='<div class="card"><b>Looking for work today</b>';
    if(S.candidates.length){for(const c of S.candidates)h+='<div class="row spread"><span>'+esc(c.name)+' <span class="muted">'+'★'.repeat(c.skill)+'<span style="opacity:.3">'+'★'.repeat(5-c.skill)+'</span></span></span>'+B('hire','Hire',{data:{id:c.id},dis:L||!slot})+'</div>';
      h+='<span class="small muted">'+(slot?'Next hire goes on cab '+slot.cab.no+', '+shiftLabel(slot.sh)+'.':'Every cab is fully rostered. Get another cab first.')+'</span>'}
    else h+='<span class="small muted">No one else is looking today. New drivers turn up tomorrow.</span>';
    h+='</div>';
  }
  h+='<h2>Fleet</h2><div class="fleet">';
  for(const cab of ourCabs()){
    const dn=cab.driver?(cab.driver.isPlayer?'You':cab.driver.name):null;
    h+='<div class="card" style="gap:6px"><div class="row spread"><b>Cab '+cab.no+' <span class="muted small">'+esc(cab.model||(cab.owned?'owned':'leased'))+'</span></b>'+statePill(cab)+'</div><div class="small">'+(dn?esc(dn)+' · ':'')+'<span class="muted">'+esc(cab.driver?stateText(cab):cab.route?'Heading back to the office':'Parked, nobody on shift')+'</span></div>'+strip(cab)+'<div class="row small muted">Wear '+wearBar(cab.wear)+'<span>'+(cab.owned?'Owned':'Leased £35/day')+'</span></div><div class="row">';
    if(cab.driver)h+=B('select',S.selected===cab.id?'Selected':'Select on map',{data:{id:cab.id},dis:S.selected===cab.id});
    if(cab.driver&&!cab.driver.isPlayer)h+=B('mode',cab.mode==='auto'?'Mode: find work':'Mode: hold position',{data:{id:cab.id}});
    if(!cab.job&&cab.state!=='broken'&&cab.state!=='service'&&cab.wear>.15)h+=B('service','Service',{data:{id:cab.id},dis:L});
    if(!cab.driver&&!cab.owned&&n>1)h+=B('endlease','Hand back lease',{data:{id:cab.id},dis:L});
    if(!cab.driver&&cab.owned&&n>1)h+=B('sell','Sell ('+money0(sellValue(cab))+')',{data:{id:cab.id},dis:L});
    h+='</div></div>';
  }
  h+='</div>';
  h+='<h2>Car market</h2>';
  if(!S.office)h+='<p class="small muted">You need an office before you can take on more cabs.</p>';
  else{
    const full=n>=6;
    h+='<div class="card" style="gap:8px"><div class="row spread"><span>Lease a Skoda Octavia <span class="muted small">£35 a day, hand back any time</span></span>'+B('lease','Lease',{dis:L||full})+'</div><div class="row spread"><span>New Toyota Corolla <span class="muted small">no wear, £8 a day upkeep</span></span>'+B('buy','Buy £4,500',{dis:L||full||S.cash<4500})+'</div></div>';
    if(S.market.length){for(const m of S.market)h+='<div class="card" style="gap:6px"><div class="row spread"><b>Used '+esc(m.model)+'</b><span class="num">'+money0(m.price)+'</span></div><div class="row small muted"><span>'+m.miles+'k miles</span>Wear '+wearBar(m.wear)+'<span>£8 a day upkeep</span></div><div class="row">'+B('buyused','Buy',{data:{id:m.id},dis:L||full||S.cash<m.price})+'</div></div>'}
    else h+='<p class="small muted">Nothing else on the forecourt today. New stock tomorrow.</p>';
    if(full)h+='<p class="small muted">The office holds six cabs at most.</p>';
  }
  const leased=ourCabs().filter(c=>!c.owned).length,owned=n-leased;
  const daily=leased*35+owned*8+(S.office?60:0)+(S.operator?80:0)+(S.mechanic?90:0);
  h+='<p class="small muted">Daily running costs, charged at 06:00: <span class="num" style="color:var(--text)">'+money0(daily)+'</span></p>';
  return h;
}
function paneBook(){
  if(!S.operator)return'<div class="card"><h3>No operator, no bookings</h3><p class="muted">Right now you only get street fares from ranks and people flagging you down. Rent an office and hire an operator to start taking booked jobs. They pay 20% more.</p></div>';
  const list=S.customers.filter(c=>c.type==='booked').sort((a,b)=>a.pickupAt-b.pickupAt);
  let h='<div class="row spread"><h2>Bookings</h2>'+B('autodispatch',S.bookingsAuto?'Operator dispatch: on':'Operator dispatch: off')+'</div><p class="small muted">With dispatch on, your operator sends the nearest free driver 20 minutes before pickup. You only get a booking if you take it yourself. Missed bookings cost reputation.</p>';
  if(!list.length)h+='<p class="muted">No bookings waiting. More come in with better reputation and more regulars.</p>';
  for(const c of list){
    const cab=c.claimedBy&&S.cabs.find(x=>x.id===c.claimedBy);
    const fare=(3+1.6*pathStats(route(c.node,c.dest,byLen)).km)*1.2;
    h+='<div class="card" style="gap:6px"><div class="row spread"><b class="num">'+hhmm(c.pickupAt)+'</b>'+(cab?'<span class="pill book">'+esc(isPlayerCab(cab)?'You':cab.driver.name)+'</span>':'<span class="pill warn">Unassigned</span>')+'</div><div class="small">'+esc(D[nodes[c.node].d].name)+' to '+esc(D[nodes[c.dest].d].name)+' · about <span class="num">'+money(fare)+'</span>'+(c.regular?' · <span class="muted">regular</span>':'')+'</div>';
    if(!cab){const free=ourCabs().filter(x=>isPlayerCab(x)?freeCab(x):freeForWork(x));h+='<div class="row">'+(free.length?free.map(x=>B('assign',isPlayerCab(x)?'Take it myself':'Send '+esc(x.driver.name.split(' ')[0]),{data:{cust:c.id,cab:x.id}})).join(''):'<span class="small muted">No free cabs right now.</span>')+'</div>'}
    h+='</div>';
  }
  return h;
}
function paneLedger(){
  const d=S.today;let h='<h2>Today so far</h2><table><tr><td>Fares</td><td class="r num">'+money(d.fares)+'</td></tr><tr><td>Tips</td><td class="r num">'+money(d.tips)+'</td></tr><tr><td>Driver commission</td><td class="r num">'+money(-d.comm)+'</td></tr><tr><td>Fuel</td><td class="r num">'+money(-d.fuel)+'</td></tr><tr><td>Repairs and services</td><td class="r num">'+money(-(d.repairs+d.service))+'</td></tr><tr><td>Customers lost</td><td class="r num">'+d.lost+'</td></tr></table>';
  if(S.history.length){h+='<h2>Previous days</h2><div style="overflow-x:auto"><table><tr><th>Day</th><th class="r">Jobs</th><th class="r">Fares</th><th class="r">Costs</th><th class="r">Net</th><th class="r">Castle</th></tr>';for(const r of S.history.slice(0,10))h+='<tr><td>'+r.day+'</td><td class="r num">'+r.jobs+'</td><td class="r num">'+money0(r.fares+r.tips)+'</td><td class="r num">'+money0(r.comm+r.fuel+r.repairs+r.service+r.fixed)+'</td><td class="r num" style="color:'+(r.net>=0?'var(--good)':'var(--bad)')+'">'+money0(r.net)+'</td><td class="r num">'+money0(r.rival)+'</td></tr>';h+='</table></div>'}
  h+='<div class="card"><h2>Save</h2><p class="small muted">The game saves itself in this browser every few seconds and survives refreshes and updates. Prototype v'+VERSION+'.</p><div class="row">'+(confirmNew?'<span class="small">Wipe this save and start again?</span>'+B('restart','Yes, start again',{cls:'danger'})+B('newcancel','Cancel'):B('newask','Start a new game'))+'</div></div>';
  h+='<h2>Log</h2><div class="log">'+S.log.slice(0,40).map(l=>'<span><span class="num">D'+l.day+' '+hhmm(l.t)+'</span> '+l.html+'</span>').join('')+'</div>';
  return h;
}
let lastHtml='';
function render(force){
  const now=performance.now();if(!force&&now-lastRender<300)return;lastRender=now;
  document.querySelectorAll('.tabs button').forEach(b=>b.setAttribute('aria-selected',b.dataset.tab===tab));
  const nb=S.operator?S.customers.filter(c=>c.type==='booked'&&!c.claimedBy).length:0;
  $('tab-book').innerHTML='Bookings'+(nb?'<span class="n">'+nb+'</span>':'');
  const html=tab==='cab'?paneCab():tab==='firm'?paneFirm():tab==='book'?paneBook():paneLedger();
  const ae=document.activeElement;if(html!==lastHtml&&!(ae&&ae.tagName==='SELECT'&&$('pane').contains(ae))){const pane=$('pane');const st=pane.scrollTop;pane.innerHTML=html;pane.scrollTop=st;lastHtml=html}
  $('objective').innerHTML=objective();
  const sel=S.cabs.find(c=>c.id===S.selected);
  $('sel').innerHTML=sel&&sel.driver?'Selected: <b>'+(isPlayerCab(sel)?'You':'Cab '+sel.no+' · '+esc(sel.driver.name))+'</b>. Click the map to send '+(isPlayerCab(sel)?'yourself':'them')+'.':'Click one of your cabs to select it.';
}
function renderTop(){
  $('mDay').textContent=S.day;$('mTime').textContent=hhmm(S.t);$('mCash').textContent=money0(S.cash);$('mCash').style.color=S.cash<0?'var(--bad)':'';$('mRep').textContent=Math.round(S.rep);
}
function renderChat(){
  const box=$('chatBox');
  if(!S.chat){box.innerHTML='';return}
  const c=S.chat;
  box.innerHTML='<div class="chat"><div class="sheet"><div class="eyebrow">Your passenger says</div><q>'+esc(c.q)+'</q>'+(c.result?'<p class="small muted">'+esc(c.result)+'</p>':c.replies.map(([k,t])=>'<button class="reply" data-act="chat" data-kind="'+k+'">'+esc(t)+'</button>').join('')+'<div class="bar"><i id="chatBar"></i></div><p class="small muted">Or ignore them and drive.</p>')+'</div></div>';
}
function renderOverlay(){
  const ov=$('overlay');
  if(S.choosing){
    const ch=S.choosing,c=ch.cust,j=ch.cab.job;
    ov.className='overlay';ov.innerHTML='<div class="sheet" role="dialog" aria-label="Choose a route"><div class="eyebrow">Fare picked up'+(c.type==='booked'?' · booking':c.type==='rank'?' · from the rank':'')+'</div><h3>'+esc(D[nodes[c.node].d].name)+' to '+esc(D[nodes[c.dest].d].name)+'</h3><p class="small muted">Metered fare <span class="num" style="color:var(--text)">'+money(j.fare)+'</span>. The meter charges the shortest distance, so a longer route costs you time and fuel. The clock is stopped until you pick.</p><div class="opts">'+
      ch.opts.map((o,i)=>'<button class="opt" style="--c:'+o.col+'" data-act="route" data-i="'+i+'" data-hover="'+i+'"><span class="lab">'+esc(o.label)+'</span><span class="big">'+Math.round(o.min)+' min</span><span class="small muted">'+o.km.toFixed(1)+' km'+(o.heavy?' · '+o.heavy+' jammed '+(o.heavy>1?'roads':'road'):' · clear')+'</span></button>').join('')+'</div></div>';
    return;
  }
  if(S.modal){
    const m=S.modal;ov.className='overlay center';
    if(m.type==='act1'){ov.innerHTML='<div class="sheet" role="dialog"><div class="eyebrow">Act 1 complete</div><h3>Starline Cabs runs without you</h3><p class="muted">You started with one leased cab and a rival who owned the ranks. Now you\'ve got drivers on the road and an office taking bookings. In the full game this is where the tutorial ends and the rest of the map opens up.</p><div class="row">'+B('continue','Keep playing',{cls:'primary'})+'</div></div>';return}
    const last=S.history[0];
    if(m.type==='over'){ov.innerHTML='<div class="sheet" role="dialog"><div class="eyebrow">Day '+S.day+'</div><h3>Starline Cabs has gone under</h3><p class="muted">Three nights in a row in the red. The leasing company took the cabs back and Castle Cars has the town to itself.</p><div class="row">'+B('restart','Start again',{cls:'primary'})+'</div></div>';return}
    const f=m.fixed;
    ov.innerHTML='<div class="sheet" role="dialog"><div class="eyebrow">06:00 · end of day '+m.day+'</div><h3>'+(m.net>=0?'Up '+money0(m.net)+' on the day':'Down '+money0(-m.net)+' on the day')+'</h3><table><tr><td>Fares and tips ('+last.jobs+' jobs)</td><td class="r num">'+money(last.fares+last.tips)+'</td></tr><tr><td>Driver commission</td><td class="r num">'+money(-last.comm)+'</td></tr><tr><td>Fuel</td><td class="r num">'+money(-last.fuel)+'</td></tr><tr><td>Repairs and services</td><td class="r num">'+money(-(last.repairs+last.service))+'</td></tr>'+
      (f.lease?'<tr><td>Leases</td><td class="r num">'+money(-f.lease)+'</td></tr>':'')+(f.upkeep?'<tr><td>Owned cab upkeep</td><td class="r num">'+money(-f.upkeep)+'</td></tr>':'')+(f.rent?'<tr><td>Office rent</td><td class="r num">'+money(-f.rent)+'</td></tr>':'')+(f.operator?'<tr><td>Operator</td><td class="r num">'+money(-f.operator)+'</td></tr>':'')+(f.mechanic?'<tr><td>Mechanic</td><td class="r num">'+money(-f.mechanic)+'</td></tr>':'')+
      '<tr><td><b>Cash in hand</b></td><td class="r num"><b>'+money0(S.cash)+'</b></td></tr></table><p class="small muted">Castle Cars took '+money0(last.rival)+' today. '+esc(m.rivalNews||'')+(S.negDays?' <span style="color:var(--bad)">You\'re in the red. Three nights running and the firm folds.</span>':'')+'</p><div class="row">'+B('continue','Carry on into day '+S.day,{cls:'primary'})+'</div></div>';
    return;
  }
  ov.className='';ov.innerHTML='';
}

// ---------- speed ----------
function setSpeed(v){if(S.modal||S.choosing)return;if(v===0){S.paused=true}else{S.paused=false;S.speed=v}syncSpeed()}
function syncSpeed(){for(const v of [0,1,2,4,8])$('sp'+v).setAttribute('aria-pressed',v===0?String(S.paused):String(!S.paused&&S.speed===v))}

// ---------- events ----------
function handle(e){const el=e.target.closest('[data-act],[data-speed],[data-tab]');if(!el)return;if(el.disabled||el.tagName==='SELECT')return;
  if(el.dataset.speed!==undefined)return setSpeed(+el.dataset.speed);
  if(el.dataset.tab&&!el.dataset.act){tab=el.dataset.tab;return render(true)}
  act(el.dataset.act,el)}
document.addEventListener('pointerdown',e=>{if(e.button!==0||e.target===cv)return;handle(e)});
document.addEventListener('click',e=>{if(e.detail===0)handle(e)});
document.addEventListener('change',e=>{const el=e.target.closest('select[data-act]');if(el)act(el.dataset.act,el)});
document.addEventListener('pointerover',e=>{const o=e.target.closest('[data-hover]');if(S&&S.choosing)S.hoverRoute=o?+o.dataset.hover:-1});
document.addEventListener('keydown',e=>{if(e.target.closest('input,textarea'))return;if(e.code==='Space'){e.preventDefault();setSpeed(S.paused?S.speed:0)}if(e.key==='1')setSpeed(1);if(e.key==='2')setSpeed(2);if(e.key==='3')setSpeed(4);if(e.key==='4')setSpeed(8)});

