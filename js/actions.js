// ---------- player actions ----------
function act(a,el){
  const d=el?el.dataset:{};const pc=playerCab();
  const needFree=()=>{if(locked()){toast('You\'re on a job. Business decisions wait until you drop off.','bad');return false}return true};
  const cabById=id=>S.cabs.find(c=>c.id===+id);
  const unassign=cab=>{for(const x of S.drivers)if(x.cabId===cab.id)x.cabId=null};
  switch(a){
    case 'nearest':{if(!pc||!freeCab(pc))return;const c=nearestHail(pc,1e9);if(c){goPickup(pc,c);toast('Heading for a fare in '+esc(D[nodes[c.node].d].name)+'.')}else toast('No one\'s flagging right now. Try a rank.');break}
    case 'bail':{if(!pc||!pc.job)return;const c=pc.job.cust;
      if(pc.state==='onFare'||pc.state==='choosing'){rep(-4);S.today.lost++;log('You dumped a fare. Reputation down.');toast('Fare abandoned. Reputation down.','bad')}
      else{if(S.customers.includes(c))c.claimedBy=null;rep(-1)}
      pc.job=null;S.chat=null;renderChat();if(S.choosing){S.choosing=null;renderOverlay()}
      if(pc.route&&pc.seg<pc.route.length-1){pc.route=[pc.route[pc.seg],pc.route[pc.seg+1]];pc.seg=0;pc.state='moving';pc.targetRank=null}else{pc.route=null;pc.state='idle'}
      break}
    case 'route':{const ch=S.choosing;if(!ch)return;const o=ch.opts[+d.i];S.choosing=null;S.hoverRoute=-1;startFare(ch.cab,o.path);renderOverlay();render(true);break}
    case 'chat':{if(!S.chat||S.chat.result)return;const kind=d.kind;const j=pc&&pc.job;let msg;
      if(kind==='good'&&j){const tip=Math.round(j.fare*(.1+rnd()*.15)*100)/100;j.tip=(j.tip||0)+tip;rep(1);msg='They\'re warming to you. Tip on the way: '+money(tip)+'.';if(rnd()<.3){S.regulars++;msg+=' They took the firm\'s number.';log('A passenger became a <b>regular</b>.')}}
      else if(kind==='bad'){rep(-2);msg='They went quiet and looked at their phone.'}
      else msg='They nod and look out of the window.';
      S.chat.result=msg;renderChat();setTimeout(()=>{if(S.chat&&S.chat.result===msg){S.chat=null;renderChat()}},2600);break}
    case 'rent':if(!needFree())return;if(S.cash<500)return toast('You need £500 for the deposit.','bad');S.cash-=500;S.office=true;log('Rented an office on <b>Market Street</b>.');toast('Office rented. You can hire drivers and get more cabs now.','good');break;
    case 'operator':if(!needFree())return;S.operator=true;log('Hired an operator. Bookings will start coming in.');toast('Operator hired. Watch the Bookings tab.','good');break;
    case 'lease':{if(!needFree())return;if(!S.office||ourCabs().length>=6)return;const c=makeCab('you',OFFICE);c.no=S.cabNo++;c.wear=.05;c.model='Leased Skoda Octavia';S.cabs.push(c);log('Leased cab '+c.no+'.');toast('Cab '+c.no+' leased. Put a driver on it in the rota.','good');break}
    case 'buy':{if(!needFree())return;if(S.cash<4500)return toast('A new cab costs £4,500.','bad');if(!S.office||ourCabs().length>=6)return;S.cash-=4500;const c=makeCab('you',OFFICE,true);c.no=S.cabNo++;c.wear=0;c.model='New Toyota Corolla';S.cabs.push(c);log('Bought cab '+c.no+' new.');toast('Cab '+c.no+' bought. Put a driver on it in the rota.','good');break}
    case 'buyused':{if(!needFree())return;const m=S.market.find(x=>x.id===+d.id);if(!m||!S.office||ourCabs().length>=6)return;if(S.cash<m.price)return toast('You need '+money0(m.price)+' for that one.','bad');S.cash-=m.price;const c=makeCab('you',OFFICE,true);c.no=S.cabNo++;c.wear=m.wear;c.model=m.model;S.cabs.push(c);S.market=S.market.filter(x=>x!==m);log('Bought a used '+esc(m.model)+' for '+money0(m.price)+'. It\'s cab '+c.no+'.');toast('Used '+esc(m.model)+' bought. It\'s cab '+c.no+'.','good');break}
    case 'hire':{if(!needFree())return;const cand=S.candidates.find(x=>x.id===+d.id);const slot=freeSlot();if(!cand||!slot||!S.office)return;
      const dr={id:uid(),name:cand.name,skill:cand.skill,isPlayer:false,cabId:slot.cab.id,shift:slot.sh};S.drivers.push(dr);S.candidates=S.candidates.filter(x=>x!==cand);
      log('Hired <b>'+esc(dr.name)+'</b> for cab '+slot.cab.no+', '+shiftLabel(slot.sh)+'.');toast(esc(dr.name)+' hired: cab '+slot.cab.no+', '+shiftLabel(slot.sh)+'. Change it in the rota.','good');break}
    case 'mechanic':if(!needFree())return;S.mechanic=true;log('Hired a mechanic.');toast('Mechanic hired. Repairs and services are cheaper and quicker.','good');break;
    case 'dismiss':{if(!needFree())return;const dr=S.drivers.find(x=>x.id===+d.id);if(!dr||dr.isPlayer)return;const cab=S.cabs.find(c=>c.driver===dr);if(cab&&cab.job)return toast(esc(dr.name)+' is on a job. Try again when they drop off.');if(cab){cab.driver=null;cab.state=cab.route?'moving':'idle'}S.drivers=S.drivers.filter(x=>x!==dr);log('Let <b>'+esc(dr.name)+'</b> go.');break}
    case 'endlease':{if(!needFree())return;const cab=cabById(d.id);if(!cab||cab.driver||cab.owned)return;unassign(cab);S.cabs=S.cabs.filter(c=>c!==cab);log('Handed back cab '+cab.no+'.');break}
    case 'sell':{if(!needFree())return;const cab=cabById(d.id);if(!cab||cab.driver||!cab.owned)return;const v=sellValue(cab);S.cash+=v;unassign(cab);S.cabs=S.cabs.filter(c=>c!==cab);log('Sold cab '+cab.no+' for '+money0(v)+'.');break}
    case 'service':{if(!needFree())return;const cab=cabById(d.id);if(!cab||cab.job||cab.state==='broken')return;const cost=S.mechanic?15:40;S.cash-=cost;S.today.service+=cost;cab.wear=.04;cab.route=null;cab.state='service';cab.brokenUntil=absNow()+(S.mechanic?60:90);cab.rankId=null;toast('Cab '+cab.no+' in for a service.');break}
    case 'mode':{const cab=cabById(d.id);if(!cab)return;cab.mode=cab.mode==='auto'?'hold':'auto';if(cab.mode==='hold')cab.holdNode=cab.node;break}
    case 'select':S.selected=+d.id;break;
    case 'shift':{const dr=S.drivers.find(x=>x.id===+d.id);if(!dr)return;const v=el.value;el.blur();
      if(dr.cabId!=null&&S.drivers.some(o=>o!==dr&&o.cabId===dr.cabId&&overlaps(o.shift,v))){toast('That shift clashes with someone else on the same cab.','bad');break}
      dr.shift=v;log((dr.isPlayer?'You':'<b>'+esc(dr.name)+'</b>')+' moved to '+shiftLabel(v)+'.');
      if(dr.isPlayer&&v==='off'&&hired().length&&!S.act1){S.act1=true;S.modal={type:'act1'};renderOverlay()}
      break}
    case 'setcab':{const dr=S.drivers.find(x=>x.id===+d.id);if(!dr)return;const v=el.value;el.blur();const id=v===''?null:+v;
      if(id!=null&&S.drivers.some(o=>o!==dr&&o.cabId===id&&overlaps(o.shift,dr.shift))){toast('Someone else on that cab already covers those hours.','bad');break}
      const active=S.cabs.find(c=>c.driver===dr);if(active&&active.job){toast((dr.isPlayer?'Finish':esc(dr.name)+' has to finish')+' the current job first.','bad');break}
      if(active){active.driver=null;active.state=active.route?'moving':'idle'}dr.cabId=id;break}
    case 'autodispatch':S.bookingsAuto=!S.bookingsAuto;break;
    case 'zoomstop':S.zoomHold=true;lastZoom='';break;
    case 'zoomgo':S.zoomHold=false;lastZoom='';break;
    case 'continue':if(S.modal&&S.modal.type==='act1'){S.modal=null;renderOverlay()}else startNextDay();break;
    case 'restart':confirmNew=false;S.modal=null;try{localStorage.removeItem(SAVE_KEY)}catch(e){}newGame();syncSpeed();save();return;
    case 'newask':confirmNew=true;break;
    case 'newcancel':confirmNew=false;break;
  }
  render(true);save();
}
const freeCab=c=>c&&c.driver&&!c.job&&(c.state==='idle'||c.state==='moving');

