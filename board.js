"use strict";
const $ = id => document.getElementById(id);
const code = (new URLSearchParams(location.search).get("room") || "").trim().toUpperCase();
const configOK = typeof SUPABASE_URL === "string" && typeof SUPABASE_PUBLISHABLE_KEY === "string" && !SUPABASE_URL.includes("YOUR_PROJECT_REF") && !SUPABASE_PUBLISHABLE_KEY.includes("YOUR_SUPABASE_PUBLISHABLE_KEY");
const client = configOK && window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY) : null;
const spaces = [
  ["Entrance","🎟️","#f6d69d"],["Ring Toss","⭕","#cce5ff"],["Challenge","🃏","#d9d2fa"],
  ["Duck Pond","🦆","#ccefd5"],["Mystery","🎪","#ffdfba"],["Balloon Pop","🎈","#cce5ff"],
  ["Challenge","🃏","#d9d2fa"],["Prize Booth","🏆","#ffe6a0"],["High Striker","🔨","#ccefd5"],
  ["Mystery","🎪","#ffdfba"],["Lucky Cups","🥤","#ccefd5"],["Challenge","🃏","#d9d2fa"]
];
const order = [0,1,2,3,11,null,null,4,10,null,null,5,9,8,7,6];
let busy = false, refreshing = false, latest = null;
function status(message){$("status").textContent = message;}
function drawBoard(){
  $("board").replaceChildren();
  order.forEach(index => {
    const el = document.createElement("div");
    if(index === null){$("board").append(el);return;}
    const [name, emoji, color] = spaces[index];
    el.className = "space"; el.style.setProperty("--bg", color);
    const num = document.createElement("span");num.className="num";num.textContent=index+1;
    const icon = document.createElement("span");icon.className="emoji";icon.textContent=emoji;
    const label = document.createElement("span");label.className="name";label.textContent=name;
    const pawns = document.createElement("div");pawns.className="pawns";pawns.id=`pawns-${index}`;
    el.append(num,icon,label,pawns);$("board").append(el);
  });
}
async function rpc(name,args){const {data,error}=await client.rpc(name,args);if(error)throw error;return data;}
async function signIn(){
  const {data,error}=await client.auth.getSession();if(error)throw error;
  if(!data.session){const result=await client.auth.signInAnonymously();if(result.error)throw result.error;}
}
function render(state){
  latest=state;$("room-code").textContent=state.code;
  $("players").replaceChildren();
  state.players.forEach(p=>{
    const li=document.createElement("li"),dot=document.createElement("span");dot.className="dot";dot.style.backgroundColor=p.color;
    li.append(dot,document.createTextNode(`${p.name}${p.seat===state.my_seat?' (you)':''}`));$("players").append(li);
  });
  document.querySelectorAll(".pawns").forEach(el=>el.replaceChildren());
  if(state.ready && Array.isArray(state.positions))state.players.forEach(p=>{
    const pos=state.positions[p.seat-1];const target=$( `pawns-${pos}` );if(!target)return;
    const pawn=document.createElement("div");pawn.className="pawn";pawn.style.backgroundColor=p.color;pawn.title=p.name;target.append(pawn);
  });
  $("init").hidden=!state.is_host || state.ready || state.status!=="playing";
  const active=state.players.find(p=>p.seat===state.current_seat);
  $("turn").textContent=state.ready?`Current turn: ${active?.name||'Unknown'}`:"Waiting for the host to initialize the board.";
  $("roll").disabled=busy || !state.ready || state.status!=="playing" || state.my_seat!==state.current_seat;
  $("last-roll").textContent=state.last_roll===null?"No rolls yet.":`Last move: Player ${state.last_seat} rolled ${state.last_roll}.`;
  $("moves").textContent=state.ready?`Movement turns tested: ${state.move_count}`:"";
  status(state.status!=="playing"?"Room has not started yet.":state.ready?"Board synchronized across players.":"Host: initialize the board to begin movement testing.");
}
async function refresh(){
  if(!client||!code||refreshing||busy)return;
  refreshing=true;
  try{render(await rpc("get_carnival_board",{p_code:code}));}
  catch(e){console.error(e);status(e.message||"Unable to load board.");}
  finally{refreshing=false;}
}
async function act(fn){
  if(busy)return;busy=true;$("roll").disabled=true;$("init").disabled=true;
  try{await fn();busy=false;await refresh();}
  catch(e){console.error(e);status(e.message||"Action failed.");busy=false;}
  finally{$("init").disabled=false;}
}
$("init").addEventListener("click",()=>act(()=>rpc("initialize_carnival_board",{p_code:code})));
$("roll").addEventListener("click",()=>act(()=>rpc("roll_carnival_movement",{p_code:code})));
drawBoard();
(async()=>{
  if(!/^[A-Z0-9]{6}$/.test(code)){status("Missing room code. Return to the lobby.");return;}
  if(!client){status("Configure Supabase in supabase-config.js.");return;}
  try{await signIn();await refresh();setInterval(refresh,1500);}
  catch(e){console.error(e);status(e.message||"Connection failed.");}
})();
