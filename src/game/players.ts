/*
 * players.ts — save-slot handling: the PLAYER bar (slots, sound toggle, MAP
 * button) and the slot-scoped localStorage keys the rest of the app saves under.
 */
import { ambience } from "../audio/ambience.ts";

// --- Multiple players: each save slot keeps its own game + map in localStorage.
// Player "1" keeps the legacy (unslotted) keys so existing saves are preserved.
export const SLOT = localStorage.getItem("zork1:slot") || "1";
export const SAVE_KEY = SLOT === "1" ? "zork1:quetzal" : `zork1:quetzal:${SLOT}`;
export const MAP_KEY = SLOT === "1" ? "zork1:map" : `zork1:map:${SLOT}`;
export function buildPlayers() {
  const host = document.getElementById("players"); if (!host) return;
  const slots: string[] = JSON.parse(localStorage.getItem("zork1:slots") || '["1"]');
  host.innerHTML = `<span class="pl-label">PLAYER</span>`;
  for (const s of slots) {
    const b = document.createElement("button");
    b.className = "pl-btn" + (s === SLOT ? " on" : ""); b.textContent = s;
    b.onclick = () => { if (s !== SLOT) { localStorage.setItem("zork1:slot", s); location.reload(); } };
    host.appendChild(b);
  }
  const add = document.createElement("button");
  add.className = "pl-btn pl-add"; add.textContent = "+"; add.title = "new player";
  add.onclick = () => {
    const next = String(Math.max(0, ...slots.map(Number)) + 1);
    slots.push(next); localStorage.setItem("zork1:slots", JSON.stringify(slots));
    localStorage.setItem("zork1:slot", next); location.reload();
  };
  host.appendChild(add);
  // ambient sound toggle — ON by default (any first gesture unlocks the audio)
  const snd = document.createElement("button");
  const SND_KEY = SLOT === "1" ? "zork1:sound" : `zork1:sound:${SLOT}`;
  const on = localStorage.getItem(SND_KEY) !== "0";
  snd.className = "pl-btn pl-snd" + (on ? " on" : ""); snd.title = "ambient sound";
  const paint = (v: boolean) => { snd.classList.toggle("on", v); snd.textContent = v ? "♪ ON" : "♪ OFF"; };
  paint(on);
  snd.onclick = () => {
    const now = !ambience.enabled;
    ambience.toggle(now); paint(now);
    try { localStorage.setItem(SND_KEY, now ? "1" : "0"); } catch { /* quota */ }
  };
  host.appendChild(snd);
  // MAP toggle — small screens only (CSS hides it on desktop, where the map is docked)
  const map = document.createElement("button");
  map.className = "pl-btn pl-map"; map.textContent = "MAP"; map.title = "toggle map";
  map.onclick = (e) => {
    e.stopPropagation(); // don't let the global click handler summon the keyboard
    const open = document.body.classList.toggle("map-open");
    map.textContent = open ? "CLOSE" : "MAP";
  };
  host.appendChild(map);
  if (on) { // arm on the first gesture of the session (browser autoplay rules)
    const arm = () => { ambience.toggle(true); paint(true); window.removeEventListener("pointerdown", arm); window.removeEventListener("keydown", arm); };
    window.addEventListener("pointerdown", arm); window.addEventListener("keydown", arm);
  }
}

// Per-room interactive states, persisted per player (survives death/restart).
export const ROOMS_KEY = SLOT === "1" ? "zork1:rooms" : `zork1:rooms:${SLOT}`;
