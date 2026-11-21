"use strict";
const $=id=>document.getElementById(id);
const code=(new URLSearchParams(location.search).get("room")||"").trim().toUpperCase();
const validConfig=typeof SUPABASE_URL==="string"&&typeof SUPABASE_PUBLISHABLE_KEY==="string"&&!SUPABASE_URL.includes("YOUR_PROJECT_REF")&&!SUPABASE_PUBLISHABLE_KEY.includes("YOUR_SUPABASE_PUBLISHABLE_KEY");
const client=validConfig&&window.supabase?window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY):null;
const names=["Entrance","Ring Toss","Challenge Booth","Duck Pond","Mystery Tent","Balloon Pop","Challenge Booth","Prize Booth","High Striker","Mystery Tent","Lucky Cups","Challenge Booth"];
const challengeNames={1:"Double Ring Toss",2:"Balloon Pop",3:"High Striker Pro",4:"Lucky Duck",5:"Lucky Cups",6:"Double Duck Pond",7:"Golden Ring Toss",8:"Balloon Battle",9:"Ring Toss Rivalry",10:"Carnival Showdown"};
function node(tag,content){const e=document.createElement(tag);if(content!==undefined)e.textContent=String(content);return e;}
function duration(ms){if(ms===null||!Number.isFinite(ms)||ms<0)return "—";const sec=Math.floor(ms/1000);return `${Math.floor(sec/60)}:${String(sec%60).padStart(2,"0")}`;}
function render(data){
 $("room-code").textContent=data.code;
 const complete=data.phase==="finished";
 const start=data.started_at?Date.parse(data.started_at):NaN;
 const end=data.finished_at?Date.parse(data.finished_at):Date.now();
 const elapsed=Number.isFinite(start)?Math.max(0,end-start):null;
 $("duration").textContent=duration(elapsed);
 $("players-count").textContent=data.players.length;
 $("rounds").textContent=data.max_rounds;
 $("target").textContent=!complete?"Pending":elapsed===null?"Unknown":elapsed>=300000&&elapsed<=600000?"Met":"Outside";
 $("status").textContent=complete?"Game finished. Results recorded.":"Game in progress. Results are provisional and elapsed time is still increasing.";
 const scores=$("scores");scores.replaceChildren();
 const max=Math.max(1,...data.scores);
 data.players.forEach(p=>{
  const score=data.scores[p.seat-1]??0;
  const wrapper=node("div");wrapper.className="score";
  const label=node("div");label.className="score-label";
  label.append(node("span",`${p.name}${p.seat===data.winner_seat?" 🏆":""}`),node("strong",`${score} tickets`));
  const bar=node("div");bar.className="bar";const fill=node("div");fill.style.width=`${score/max*100}%`;bar.append(fill);wrapper.append(label,bar);scores.append(wrapper);
 });
 const activities=new Map();
 for(const e of data.events){
  if(!["attraction","challenge","mystery"].includes(e.type))continue;
  const label=e.type==="challenge"?(challengeNames[e.card]||"Challenge Card"):e.type==="mystery"?"Mystery Cards":names[e.space]||"Attraction";
  const item=activities.get(label)||{attempts:0,successes:0,awarded:0};
  const gain=(e.changes||[]).reduce((sum,n)=>sum+Math.max(0,n),0);
  item.attempts++;if(gain>0)item.successes++;item.awarded+=gain;activities.set(label,item);
 }
 const tbody=$("activities");tbody.replaceChildren();
 for(const [name,a] of [...activities.entries()].sort((a,b)=>a[0].localeCompare(b[0]))){
  const tr=node("tr");[name,a.attempts,a.successes,a.awarded].forEach(v=>tr.append(node("td",v)));tbody.append(tr);
 }
 if(!activities.size){const tr=node("tr"),td=node("td","No resolved actions recorded yet.");td.colSpan=4;tr.append(td);tbody.append(tr);}
 const changeBox=$("ticket-changes");changeBox.replaceChildren();
 data.players.forEach(p=>{
  let gains=0,losses=0;
  for(const e of data.events){const n=e.changes?.[p.seat-1]||0;if(n>0)gains+=n;else losses-=n;}
  changeBox.append(node("p",`${p.name}: +${gains} earned, −${losses} lost (actual score changes)`));
 });
 const history=$("history");history.replaceChildren();
 [...data.events].reverse().forEach(e=>{
  const item=node("div");item.className="history-item";
  const when=new Date(e.at).toLocaleTimeString([], {hour:"numeric",minute:"2-digit",second:"2-digit"});
  item.append(node("small",`Round ${e.round} · ${e.type} · ${when}`),node("div",e.description));history.append(item);
 });
 if(!data.events.length)history.append(node("p","No gameplay events recorded yet."));
}
async function load(){
 try{const {data,error}=await client.rpc("get_carnival_playtest",{p_code:code});if(error)throw error;render(data);}
 catch(e){console.error(e);$("status").textContent=e.message||"Could not load results.";}
}
(async()=>{
 $("back").href=`board.html?room=${encodeURIComponent(code)}`;
 if(!/^[A-Z0-9]{6}$/.test(code)){ $("status").textContent="Missing room code.";return;}
 if(!client){$("status").textContent="Check supabase-config.js.";return;}
 try{const {data,error}=await client.auth.getSession();if(error)throw error;
  if(!data.session){const r=await client.auth.signInAnonymously();if(r.error)throw r.error;}
  await load();setInterval(load,5000);
 }catch(e){$("status").textContent=e.message||"Connection failed.";}
})();
