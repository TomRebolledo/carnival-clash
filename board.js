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
const cards = {
  1:["Double Ring Toss","Roll twice; both rolls must be 4 or higher. Win 4 tickets."],
  2:["Balloon Pop","Roll 4, 5, or 6 to win 2 tickets."],
  3:["High Striker Pro","Roll a 6 to win 5 tickets."],
  4:["Lucky Duck","Predict odd or even. Correct guess wins 2 tickets."],
  5:["Lucky Cups","Predict 1–3 or 4–6. Correct guess wins 2 tickets."],
  6:["Double Duck Pond","Roll twice; both rolls must be even. Win 4 tickets."],
  7:["Golden Ring Toss","Roll 5 or 6 to win 3 tickets."],
  8:["Balloon Battle","Choose an opponent. Higher roll wins 3 tickets; ties award nothing."],
  9:["Ring Toss Rivalry","Choose an opponent. Higher roll wins 3 tickets; ties award nothing."],
  10:["Carnival Showdown","Everyone rolls. Unique highest roll wins 3 tickets; tied highest awards nothing."]
};
let busy=false, refreshing=false, latest=null;
function status(message){$("status").textContent=message;}
function drawBoard(){
  $("board").replaceChildren();
  order.forEach(index=>{
    const el=document.createElement("div");
    if(index===null){$("board").append(el);return;}
    const [name,emoji,color]=spaces[index];
    el.className="space";el.style.setProperty("--bg",color);
    const num=document.createElement("span");num.className="num";num.textContent=index+1;
    const icon=document.createElement("span");icon.className="emoji";icon.textContent=emoji;
    const label=document.createElement("span");label.className="name";label.textContent=name;
    const pawns=document.createElement("div");pawns.className="pawns";pawns.id=`pawns-${index}`;
    el.append(num,icon,label,pawns);$("board").append(el);
  });
}
async function rpc(name,args){const {data,error}=await client.rpc(name,args);if(error)throw error;return data;}
async function signIn(){
  const {data,error}=await client.auth.getSession();if(error)throw error;
  if(!data.session){const result=await client.auth.signInAnonymously();if(result.error)throw result.error;}
}
function addButton(label,fn){
  const b=document.createElement("button");b.textContent=label;b.disabled=busy;
  b.addEventListener("click",()=>act(fn));$("actions").append(b);
}
function makeActions(s){
  $("actions").replaceChildren();
  if(!s.ready||s.status!=="playing")return;
  if(s.phase==="finished")return;
  if(s.phase==="tie"){
    if(s.tiebreak_seats.includes(s.my_seat)) addButton("Roll Tiebreak (Tied Players)",()=>rpc("carnival_game_action",{p_code:code,p_action:"tiebreak"}));
    return;
  }
  if(s.my_seat!==s.current_seat)return;
  if(s.phase==="resolved"){
    addButton("End Turn",()=>rpc("carnival_game_action",{p_code:code,p_action:"end"}));
    return;
  }
  if(s.phase!=="action")return;
  const kind=s.pending_kind,card=s.pending_card;
  if(kind==="challenge"){
    const [name,description]=cards[card]||["Unknown card","Contact the host."];
    const h=document.createElement("h3");h.textContent=`Challenge: ${name}`;
    const p=document.createElement("p");p.textContent=description;$("actions").append(h,p);
  }
  const resolve=(choice=null,target=null)=>rpc("carnival_game_action",{p_code:code,p_action:"resolve",p_choice:choice,p_target:target});
  if(kind==="parity"||(kind==="challenge"&&card===4)){
    addButton("Guess Odd",()=>resolve("odd"));addButton("Guess Even",()=>resolve("even"));
  }else if(kind==="challenge"&&card===5){
    addButton("Guess 1–3",()=>resolve("low"));addButton("Guess 4–6",()=>resolve("high"));
  }else if(kind==="challenge"&&(card===8||card===9)){
    s.players.filter(p=>p.seat!==s.my_seat).forEach(p=>addButton(`Challenge ${p.name}`,()=>resolve(null,p.seat)));
  }else if(kind==="challenge"&&card===10){
    addButton("Roll for Everyone",()=>resolve());
  }else{
    addButton(kind==="challenge"?"Attempt Challenge":"Roll for Tickets",()=>resolve());
  }
}
function render(s){
  latest=s;$("room-code").textContent=s.code;
  $("players").replaceChildren();
  s.players.forEach(p=>{
    const li=document.createElement("li"),dot=document.createElement("span");dot.className="dot";dot.style.backgroundColor=p.color;
    const points=s.ready&&Array.isArray(s.tickets)?s.tickets[p.seat-1]:0;
    li.append(dot,document.createTextNode(`${p.name}${p.seat===s.my_seat?" (you)":""}: ${points} 🎟️`));
    if(s.ready&&s.phase!=="finished"&&p.seat===s.current_seat)li.classList.add("is-active");
    if(p.seat===s.my_seat)li.classList.add("is-me");
    $("players").append(li);
  });
  document.querySelectorAll(".pawns").forEach(el=>el.replaceChildren());
  if(s.ready&&Array.isArray(s.positions))s.players.forEach(p=>{
    const target=$(`pawns-${s.positions[p.seat-1]}`);if(!target)return;
    const pawn=document.createElement("div");pawn.className="pawn";pawn.style.backgroundColor=p.color;pawn.title=p.name;target.append(pawn);
  });
  $("init").hidden=!s.is_host||s.ready||s.status!=="playing";
  $("round").textContent=s.ready?`Round ${Math.min(s.round_number,s.max_rounds)} of ${s.max_rounds}`:"";
  const active=s.players.find(p=>p.seat===s.current_seat);
  $("turn").textContent=s.ready?(s.phase==="finished"?`Winner: ${s.players.find(p=>p.seat===s.winner_seat)?.name||"Unknown"}`:s.phase==="tie"?"Tie for first! Tiebreak required.":`Current turn: ${active?.name||"Unknown"} (${s.phase})`):"Waiting for the host to initialize the board.";
  $("event").textContent=s.ready?(s.last_event||""):"";
  $("roll").disabled=busy||!s.ready||s.status!=="playing"||s.phase!=="move"||s.my_seat!==s.current_seat;
  makeActions(s);
  status(s.status!=="playing"?"Room has not started.":s.ready?"Game synchronized across players.":"Host: initialize the board to begin.");
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
  document.querySelectorAll("#actions button").forEach(b=>b.disabled=true);
  try{await fn();busy=false;await refresh();}
  catch(e){console.error(e);status(e.message||"Action failed.");busy=false;await refresh();}
  finally{$("init").disabled=false;}
}
$("init").addEventListener("click",()=>act(()=>rpc("initialize_carnival_board",{p_code:code})));
$("roll").addEventListener("click",()=>act(()=>rpc("carnival_game_action",{p_code:code,p_action:"move"})));
$("results-link").href = `results.html?room=${encodeURIComponent(code)}`;
drawBoard();
(async()=>{
  if(!/^[A-Z0-9]{6}$/.test(code)){status("Missing room code. Return to the lobby.");return;}
  if(!client){status("Configure Supabase in supabase-config.js.");return;}
  try{await signIn();await refresh();setInterval(refresh,1500);}
  catch(e){console.error(e);status(e.message||"Connection failed.");}
})();
