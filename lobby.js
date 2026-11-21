"use strict";

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const initialCode = (params.get("room") || "").trim().toUpperCase();
$("room-code").value = initialCode;
$("room-code").addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 6);
});

const configured = !SUPABASE_URL.includes("YOUR_PROJECT_REF") &&
  !SUPABASE_PUBLISHABLE_KEY.includes("YOUR_SUPABASE_PUBLISHABLE_KEY");
const client = configured && window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
  : null;
let roomCode = null;
let busy = false;
let refreshTimer = null;
let refreshing = false;

function message(text, good = false) {
  $("message").textContent = text;
  $("message").classList.toggle("ok", good);
}
function setBusy(value) {
  busy = value;
  ["create-room", "join-room", "start-game"].forEach(id => {
    $(id).disabled = value;
  });
}
function getName() {
  const name = $("player-name").value.trim();
  if (!name || name.length > 24) throw new Error("Enter a player name (1–24 characters).");
  return name;
}
async function ensureSignIn() {
  if (!client) throw new Error("Configure supabase-config.js and reload the page.");
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  if (!data.session) {
    const result = await client.auth.signInAnonymously();
    if (result.error) throw result.error;
  }
}
async function rpc(name, args) {
  const { data, error } = await client.rpc(name, args);
  if (error) throw error;
  return data;
}
async function perform(action) {
  if (busy) return;
  setBusy(true);
  message("");
  try {
    await ensureSignIn();
    await action();
  } catch (err) {
    console.error(err);
    message(err.message || "Something went wrong.");
  } finally {
    setBusy(false);
  }
}
async function createRoom() {
  await perform(async () => {
    const code = await rpc("create_carnival_room", { p_name: getName() });
    await enterLobby(code);
  });
}
async function joinRoom() {
  await perform(async () => {
    const name = getName();
    const code = $("room-code").value.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(code)) throw new Error("Enter a valid six-character room code.");
    await rpc("join_carnival_room", { p_code: code, p_name: name });
    await enterLobby(code);
  });
}
async function enterLobby(code) {
  roomCode = code;
  $("setup").hidden = true;
  $("lobby").hidden = false;
  $("display-code").textContent = code;
  const url = new URL(location.href);
  url.searchParams.set("room", code);
  history.replaceState({}, "", url);
  await refreshLobby();
  clearInterval(refreshTimer);
  refreshTimer = setInterval(refreshLobby, 2500);
}
async function refreshLobby() {
  if (!roomCode || refreshing || !client) return;
  refreshing = true;
  try {
    const lobby = await rpc("get_carnival_lobby", { p_code: roomCode });
    $("room-status").textContent = lobby.status === "waiting" ? "Waiting" : lobby.status;
    $("player-count").textContent = `${lobby.players.length} / ${lobby.max_players}`;
    const list = $("players-list");
    list.replaceChildren();
    for (const player of lobby.players) {
      const item = document.createElement("li");
      const dot = document.createElement("span");
      dot.className = "dot";
      dot.style.backgroundColor = player.color;
      const name = document.createElement("span");
      name.textContent = `${player.name}${player.order === 1 ? " (Host)" : ""}${player.order === lobby.my_order ? " — You" : ""}`;
      item.append(dot, name);
      list.appendChild(item);
    }
    const waiting = lobby.status === "waiting";
    $("start-game").hidden = !waiting || !lobby.is_host;
    $("start-game").disabled = busy || lobby.players.length < 2;
    $("host-message").textContent = waiting
      ? (lobby.is_host
          ? "You are the host. Start when at least two players have joined."
          : "Waiting for the host to start the game…")
      : "The host has started this room.";
    $("started-message").hidden = waiting;
    if (!waiting) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  } catch (err) {
    console.error(err);
    message(err.message || "Unable to refresh the lobby.");
  } finally {
    refreshing = false;
  }
}
async function startRoom() {
  await perform(async () => {
    await rpc("start_carnival_room", { p_code: roomCode });
    await refreshLobby();
  });
}
async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
    message("Copied!", true);
  } catch {
    message("Copy failed. Select and copy the room code or URL manually.");
  }
}
$("create-room").addEventListener("click", createRoom);
$("join-room").addEventListener("click", joinRoom);
$("start-game").addEventListener("click", startRoom);
$("copy-code").addEventListener("click", () => copyText(roomCode));
$("copy-link").addEventListener("click", () => {
  const url = new URL(location.href);
  url.searchParams.set("room", roomCode);
  copyText(url.href);
});
$("leave-view").addEventListener("click", () => {
  clearInterval(refreshTimer);
  refreshTimer = null;
  roomCode = null;
  $("lobby").hidden = true;
  $("setup").hidden = false;
  $("room-code").value = "";
  const url = new URL(location.href);
  url.searchParams.delete("room");
  history.replaceState({}, "", url);
  message("This returns to the home screen; your room seat remains reserved.");
});
if (!client) {
  message("Add your Supabase URL and publishable key to supabase-config.js, then refresh.");
}
