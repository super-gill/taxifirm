// ---------- the town (data) ----------
const COLS=11,ROWS=9,SP=80,M=60,KM=160,BASE=80; // 160 map units = 1 km, free flow 80 units per game minute (30 km/h)
const W=M*2+(COLS-1)*SP,H=M*2+(ROWS-1)*SP;
const D={
  station:{name:'Station Quarter',tint:'#5b8fc9',home:.3,dem:h=>.25+.95*gauss(h,8,1.1)+.9*gauss(h,17.8,1.3)+.2*gauss(h,23,1)},
  centre:{name:'Town Centre',tint:'#c99a5b',home:.2,dem:h=>.25+.45*gauss(h,13,2.5)+.95*gauss(h,23.5,1.8)},
  hospital:{name:'Hospital Hill',tint:'#6bb8a8',home:.3,dem:h=>.32+.3*gauss(h,11,3)+.2*gauss(h,19,2)},
  riverside:{name:'Riverside',tint:'#8b7fd1',home:.7,dem:h=>.15+.75*gauss(h,20.5,2.2)},
  southfield:{name:'Southfield',tint:'#9fae6a',home:1,dem:h=>.2+.7*gauss(h,7.5,1)+.4*gauss(h,15.3,.8)},
  kilnworth:{name:'Kilnworth Industrial',tint:'#b07a6a',home:.1,dem:h=>.12+.8*gauss(h,6.6,.7)+.6*gauss(h,14.1,.7)+.45*gauss(h,22.1,.7)}
};
function districtOf(c,r){if(r<=4){if(c<=3)return'station';if(c<=7)return'centre';return'hospital'}if(c>=7)return'kilnworth';if(c>=3&&r<=6)return'riverside';return'southfield'}
const idx=(c,r)=>r*COLS+c;
const nodes=[];
for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
  const straight=(c===2||c===8)&&(r===4||r===5);
  nodes.push({id:idx(c,r),c,r,x:M+c*SP+(straight?0:(MR()-.5)*22),y:M+r*SP+(straight?0:(MR()-.5)*22),d:districtOf(c,r)});
}
const isMain=(a,b)=>{const A=nodes[a],B=nodes[b];if(A.r===B.r)return A.r===2||A.r===7;return A.c===2||A.c===8};
const pairs=[];
for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
  if(c<COLS-1)pairs.push([idx(c,r),idx(c+1,r)]);
  if(r<ROWS-1&&(r!==4||c===2||c===8))pairs.push([idx(c,r),idx(c,r+1)]);
}
const removed=new Set();
const key=(a,b)=>a<b?a+'_'+b:b+'_'+a;
function connected(){const adjT=nodes.map(()=>[]);for(const [a,b] of pairs){if(removed.has(key(a,b)))continue;adjT[a].push(b);adjT[b].push(a)}const seen=new Set([0]),q=[0];while(q.length){const u=q.pop();for(const v of adjT[u])if(!seen.has(v)){seen.add(v);q.push(v)}}return seen.size===nodes.length}
const minor=pairs.filter(([a,b])=>!isMain(a,b));
for(let i=minor.length-1;i>0;i--){const j=Math.floor(MR()*(i+1));[minor[i],minor[j]]=[minor[j],minor[i]]}
for(const [a,b] of minor){if(MR()<.17){removed.add(key(a,b));if(!connected())removed.delete(key(a,b))}}
const edges=[],adj=nodes.map(()=>[]),eKey=new Map();
for(const [a,b] of pairs){if(removed.has(key(a,b)))continue;const A=nodes[a],B=nodes[b];const e={id:edges.length,a,b,len:Math.hypot(A.x-B.x,A.y-B.y),main:isMain(a,b),bridge:A.r===4&&B.r===5,works:0,noise:MR(),mult:1};edges.push(e);adj[a].push({to:b,e:e.id});adj[b].push({to:a,e:e.id});eKey.set(key(a,b),e.id)}
const edgeOf=(a,b)=>eKey.get(key(a,b));
const RANKS=[
  {id:'station',node:idx(1,1),name:'Station rank',d:'station'},
  {id:'centre',node:idx(5,2),name:'Market Square rank',d:'centre'},
  {id:'hospital',node:idx(9,2),name:'Hospital rank',d:'hospital'}
];
const rankByNode=new Map(RANKS.map(r=>[r.node,r]));
const OFFICE=idx(6,3),RIVAL_DEPOT=idx(3,7);
const nodesBy={};for(const k in D)nodesBy[k]=nodes.filter(n=>n.d===k&&!rankByNode.has(n.id)).map(n=>n.id);
const centroid={};for(const k in D){const ns=nodes.filter(n=>n.d===k);centroid[k]={x:ns.reduce((s,n)=>s+n.x,0)/ns.length,y:ns.reduce((s,n)=>s+n.y,0)/ns.length}}
const SHIFTS={long:{name:'Long day',s:360,e:1080},early:{name:'Early',s:360,e:840},day:{name:'Day',s:600,e:1080},late:{name:'Late',s:900,e:1380},night:{name:'Night',s:1260,e:300},off:{name:'Off the rota',s:0,e:0}};
const inShift=(k,m)=>{if(k==='off'||!SHIFTS[k])return false;const {s,e}=SHIFTS[k];return s<e?m>=s&&m<e:m>=s||m<e};
const overlaps=(a,b)=>{if(a==='off'||b==='off')return false;for(let m=0;m<1440;m+=30)if(inShift(a,m)&&inShift(b,m))return true;return false};
const demand=(k,h)=>D[k].dem(h)*(1-.82*gauss(h,28.6,1.5));
const MODELS=['Skoda Octavia','Toyota Prius','Ford Galaxy','Kia Niro','VW Passat','Toyota Auris','Hyundai Ioniq'];
const placeName=n=>rankByNode.has(n)?rankByNode.get(n).name:n===OFFICE&&S.office?'the office':D[nodes[n].d].name;

// ---------- pathing ----------
const globalTraffic=h=>.25+.8*Math.max(gauss(h,8.2,.9),gauss(h,17.6,1.1))+.25*gauss(h,13,2)+.2*gauss(h,23.5,1.2);
const tt=e=>e.len/(BASE*(e.main?1.3:1))*e.mult;
const byLen=e=>e.len;
function route(src,dst,cost){
  const n=nodes.length,dist=new Float64Array(n).fill(Infinity),prev=new Int32Array(n).fill(-1),done=new Uint8Array(n);dist[src]=0;
  for(;;){let u=-1,b=Infinity;for(let i=0;i<n;i++)if(!done[i]&&dist[i]<b){b=dist[i];u=i}if(u<0||u===dst)break;done[u]=1;
    for(const {to,e} of adj[u]){const nd=dist[u]+cost(edges[e]);if(nd<dist[to]){dist[to]=nd;prev[to]=u}}}
  if(dist[dst]===Infinity)return null;const p=[];for(let v=dst;v!==-1;v=prev[v])p.unshift(v);return p;
}
function pathStats(p){let km=0,min=0,heavy=0;for(let i=0;i<p.length-1;i++){const e=edges[edgeOf(p[i],p[i+1])];km+=e.len/KM;min+=tt(e);if(e.mult>2.1)heavy++}return{km,min,heavy}}

// ---------- content ----------
const NAMES=['Dave Pryor','Sandra Kaur','Mick Hollis','Priya Nair','Gaz Whitmore','Tom Okafor','Julie Barnes','Lee Chen','Ron Fletcher','Aisha Begum','Kev Doyle','Marta Nowak','Carl Benson','Denise Moyo','Stu Hargreaves','Ola Adeyemi','Phil Stanton','Bev Crossley','Imran Shah','Nicky Rowe'];
const CHATS=[
  {q:'Busy night for you?',good:'Steady, can\'t complain. How about you?',ok:'Mm, not bad.',bad:'I\'d rather concentrate on the road.'},
  {q:'Know anywhere decent to eat round here?',good:'The Thai place on Riverside is good. Tell them the cabbie sent you.',ok:'Not really, sorry.',bad:'I don\'t eat out. Waste of money.'},
  {q:'Could you turn the radio down a bit?',good:'Course, sorry about that.',ok:'Sure.',bad:'It\'s my cab, mate.'},
  {q:'I\'m running late. Can you hurry?',good:'I\'ll take the quick way. Hang on.',ok:'I\'ll do what I can.',bad:'Should\'ve left earlier then.'},
  {q:'First time in Wexmoor. Anything worth seeing?',good:'Walk along the river by the old mill. Lovely in the evening.',ok:'Not a lot, to be honest.',bad:'Nope. It\'s a dump.'},
  {q:'Rough day at work.',good:'Sorry to hear it. Sit back, I\'ll get you there.',ok:'Happens to us all.',bad:'Join the club.'},
  {q:'Do you take card?',good:'Yep, tap whenever you\'re ready.',ok:'Card\'s fine.',bad:'Cash would be better, if I\'m honest.'},
  {q:'Is the traffic always this bad by the bridges?',good:'Rush hour, yeah. I know a couple of ways round.',ok:'Most days.',bad:'Blame the council, not me.'},
  {q:'You do airport runs as well?',good:'We can sort it. Book through the office and ask for me.',ok:'Sometimes.',bad:'Too far. Not worth it.'}
];

