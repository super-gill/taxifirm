// ---------- state ----------
const SAVE_KEY='wexmoor-cabs-save-v2',VERSION='0.4.0';let confirmNew=false;
let S,nextId=1,trafficTimer=0,autoTimer=0,lastRender=0,tab='cab';
const uid=()=>nextId++;
const absNow=()=>(S.day-1)*1440+S.t;
const tod=()=>((S.t%1440)+1440)%1440;
const shiftLabel=k=>k==='off'?'Off the rota':SHIFTS[k].name+' '+hhmm(SHIFTS[k].s)+'–'+hhmm(SHIFTS[k].e);
function genMarket(){S.market=[];for(let i=0;i<3;i++){const w=.28+rnd()*.34;S.market.push({id:uid(),model:pick(MODELS),wear:w,price:Math.round((2700-w*2500+rnd()*300)/50)*50,miles:Math.round(60+w*180)})}}
function freeSlot(){for(const cab of ourCabs()){const ds=S.drivers.filter(d=>d.cabId===cab.id);for(const sh of ['long','early','day','late','night'])if(ds.every(d=>!overlaps(d.shift,sh)))return{cab,sh}}return null}
const sellValue=c=>Math.round(2600*Math.pow(1-c.wear,1.5)/50)*50;
function makeCab(firm,node,owned=false){return{id:uid(),firm,node,x:nodes[node].x,y:nodes[node].y,angle:0,route:null,seg:0,prog:0,segDur:1,state:'idle',job:null,mode:'auto',holdNode:null,rankId:rankByNode.has(node)?rankByNode.get(node).id:null,rankSince:0,targetRank:null,wear:.08+ (firm==='you'?0:rnd()*.2),owned,driver:null,brokenUntil:0,no:0,model:''}}
function genCandidates(){const used=new Set(S.drivers.map(d=>d.name));const pool=NAMES.filter(n=>!used.has(n));S.candidates=[];for(let i=0;i<3&&pool.length;i++){const n=pool.splice(Math.floor(rnd()*pool.length),1)[0];const sk=clamp(Math.round(1+rnd()*2.2+rnd()*1.8),1,5);S.candidates.push({id:uid(),name:n,skill:sk})}}
function newGame(){
  nextId=1;
  S={v:2,zoomHold:false,market:[],opUsesYou:false,t:6*60-20,day:1,cash:1500,rep:50,regulars:0,office:false,operator:false,mechanic:false,cabs:[],drivers:[],customers:[],candidates:[],bookingsAuto:true,
    today:blankDay(),history:[],log:[],speed:1,paused:false,choosing:null,chat:null,steppedOut:false,act1:false,rival:{today:0,total:0},negDays:0,over:false,modal:null,selected:null,floaters:[],hoverRoute:-1,cabNo:1};
  const c=makeCab('you',idx(6,2));c.no=S.cabNo++;c.model='Leased Skoda Octavia';
  const you={id:uid(),name:'You',skill:3,isPlayer:true,cabId:c.id,shift:'long'};S.drivers.push(you);c.driver=you;S.cabs.push(c);S.selected=c.id;
  const rivalStarts=[RANKS[0].node,RANKS[2].node,RANKS[1].node];
  for(const n of rivalStarts){const rc=makeCab('rival',n);rc.driver={name:'Castle driver',skill:3};rc.rankSince=rnd()*-5;S.cabs.push(rc)}
  genCandidates();genMarket();updateTraffic();
  // warm the town up so the first view is alive
  warming=true;for(let i=0;i<40;i++)tick(.5);warming=false;
  S.t=360;S.today=blankDay();S.rival.today=0;S.log=[];rosterUpdate();
  log('Day 1. You have one leased cab, <b>£1,500</b>, and a rival: <b>Castle Cars</b>.');
  tab='cab';render(true);renderOverlay();
}
function blankDay(){return{fares:0,tips:0,comm:0,fuel:0,repairs:0,service:0,jobs:0,lost:0}}
const playerCab=()=>S.cabs.find(c=>c.driver&&c.driver.isPlayer);
const isPlayerCab=c=>!!(c&&c.driver&&c.driver.isPlayer);
const ourCabs=()=>S.cabs.filter(c=>c.firm==='you');
const hired=()=>S.drivers.filter(d=>!d.isPlayer);
const ACT1_CABS=4;
const COSTS={lease:30,leaseDeposit:200,upkeep:8,officeDeposit:500,rent:40,operator:55,mechanic:60,commission:.35};
const FARE_FLAG=3.5,FARE_KM=2.0;const fareFor=km=>FARE_FLAG+FARE_KM*km;
const staffed=c=>S.drivers.some(d=>d.cabId===c.id&&d.shift!=='off'&&!d.isPlayer);
const staffedCount=()=>ourCabs().filter(staffed).length;
const act1Ready=()=>ourCabs().length>=ACT1_CABS&&staffedCount()>=ACT1_CABS;
const locked=()=>{const pc=playerCab();return !!(pc&&(pc.job||S.choosing&&S.choosing.cab===pc))};
function log(html){S.log.unshift({t:S.t,day:S.day,html});S.log.length=Math.min(S.log.length,60)}
let warming=false;
function toast(text,kind=''){if(warming)return;const el=document.createElement('div');el.className='toast '+kind;el.innerHTML=text;const box=document.getElementById('toasts');box.prepend(el);while(box.children.length>4)box.lastChild.remove();setTimeout(()=>el.remove(),5200)}
function float(x,y,text,col){S.floaters.push({x,y,text,col,born:performance.now()})}
function rep(d){S.rep=clamp(S.rep+d,0,100)}

