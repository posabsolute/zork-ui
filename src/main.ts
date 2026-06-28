import "./style.css";
import { bootZork } from "./engine/zvm.ts";
import { RoomState } from "./engine/roomState.ts";
import { Viewport } from "./render/viewport.ts";
import { Compass } from "./ui/compass.ts";

const output = document.getElementById("output") as HTMLElement;
const input = document.getElementById("input") as HTMLInputElement;
const canvas = document.getElementById("gl") as HTMLCanvasElement;

async function start() {
  const viewport = new Viewport(canvas);
  const compass = new Compass(document.getElementById("viewport") as HTMLElement);
  const rooms = new RoomState();
  await rooms.load();

  const SAVE_KEY = "zork1:quetzal";
  let latestStatus = "";
  let gameRef: any = null; // assigned after boot; first onInputReady fires during boot

  // Silent autosave: a low-level Quetzal snapshot of RAM/stack/PC to localStorage.
  function autosave() {
    if (!gameRef) return;
    try {
      const buf = gameRef.vm.save_file(gameRef.vm.pc, 1);
      const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
      localStorage.setItem(SAVE_KEY, JSON.stringify(Array.from(u8)));
    } catch (e) {
      console.warn("autosave failed", e);
    }
  }

  rooms.onChange((change) => {
    console.log(
      `[room] ${change.room.id} (${change.room.name}) region=${change.room.region}` +
        ` dark=${change.isDark} via=${change.enteredFrom ?? "?"}`
    );
    viewport.showRoom(change.room, change.enteredFrom);
    compass.update(change.room);
  });

  const game = await bootZork({
    storyUrl: "./zork1.z3",
    output,
    input,
    hooks: {
      onStatus(left) {
        latestStatus = left;
      },
      intercept(line, print) {
        const cmd = line.trim().toLowerCase();
        if (cmd === "help" || cmd === "?" || cmd === "commands" || cmd === "exits") {
          print(rooms.helpText());
          return true;
        }
        return false;
      },
      onCommand(line) {
        rooms.noteCommand(line);
        // Every action ripples the world — the scene reacts to you.
        viewport.pulse(1);
      },
      onInputReady() {
        rooms.update(latestStatus);
        autosave(); // persist after each settled turn (no-op until boot finishes)
      },
    },
  });

  gameRef = game;
  rooms.attach(game.vm);

  // Restore a saved game, if present. The VM is now suspended at the opening
  // prompt (a read instruction); swapping in the saved RAM/stack/PC and issuing
  // a free "look" resumes exactly where the player left off.
  const saved = localStorage.getItem(SAVE_KEY);
  if (saved) {
    try {
      const u8 = Uint8Array.from(JSON.parse(saved));
      if (game.vm.restore_file(u8, 1)) {
        output.replaceChildren(); // clear the fresh-game intro
        input.value = "look";
        input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      }
    } catch (e) {
      console.warn("restore failed", e);
      localStorage.removeItem(SAVE_KEY);
    }
  }

  // Resolve the opening room once the first prompt is ready.
  setTimeout(() => rooms.update(latestStatus), 0);

  // Debug handles for manual inspection.
  (window as any).__zork = { viewport, rooms, game };
}

start().catch((err) => {
  console.error(err);
  output.appendChild(document.createTextNode("\n[boot error] " + err.message));
});

document.addEventListener("click", () => input.focus());
input.focus();
