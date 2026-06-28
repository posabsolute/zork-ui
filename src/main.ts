import "./style.css";
import { bootZork } from "./engine/zvm.ts";
import { RoomState } from "./engine/roomState.ts";
import { Viewport } from "./render/viewport.ts";
import { Compass } from "./ui/compass.ts";
import { startTitleScene } from "./ui/titleScene.ts";
import { Scene2D } from "./ui/scene2d.ts";
import { getRoomScene } from "./ui/roomScenes.ts";

const output = document.getElementById("output") as HTMLElement;
const input = document.getElementById("input") as HTMLInputElement;
const canvas = document.getElementById("gl") as HTMLCanvasElement;
const SAVE_KEY = "zork1:quetzal";

// The viewport/compass come up immediately behind the welcome screen; the actual
// Z-machine does NOT boot until the player presses ENTER on the title — so the
// game never auto-starts.
const viewport = new Viewport(canvas);
const scene2d = new Scene2D(document.getElementById("scene2d") as HTMLCanvasElement);
const compass = new Compass(document.getElementById("viewport") as HTMLElement);
const rooms = new RoomState();
const roomsLoaded = rooms.load();

let latestStatus = "";
let gameRef: any = null;

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
  compass.update(change.room);
  // Rooms with a hand-composed 2D scene use the canvas overlay; the rest use 3D.
  const scene = getRoomScene(change.room.id);
  if (scene) {
    scene2d.show(scene);
  } else {
    scene2d.hide();
    viewport.showRoom(change.room, change.enteredFrom);
  }
});

async function startGame() {
  await roomsLoaded;

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
        viewport.pulse(1);
      },
      onInputReady() {
        rooms.update(latestStatus);
        autosave();
      },
    },
  });

  gameRef = game;
  rooms.attach(game.vm);

  // Restore a saved game, if present.
  const saved = localStorage.getItem(SAVE_KEY);
  if (saved) {
    try {
      const u8 = Uint8Array.from(JSON.parse(saved));
      if (game.vm.restore_file(u8, 1)) {
        output.replaceChildren();
        input.value = "look";
        input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      }
    } catch (e) {
      console.warn("restore failed", e);
      localStorage.removeItem(SAVE_KEY);
    }
  }

  setTimeout(() => rooms.update(latestStatus), 0);
  (window as any).__zork = { viewport, rooms, game };
}

// --- Title screen: only a REAL Enter/click begins the game -----------------
const welcome = document.getElementById("welcome");
const titleCanvas = document.getElementById("welcome-canvas") as HTMLCanvasElement | null;
const stopTitle = titleCanvas ? startTitleScene(titleCanvas) : () => {};
let begun = false;
function begin() {
  if (begun) return;
  begun = true;
  stopTitle();
  welcome?.classList.add("hidden");
  setTimeout(() => welcome?.remove(), 1100);
  input.focus();
  startGame().catch((err) => {
    console.error(err);
    output.appendChild(document.createTextNode("\n[boot error] " + err.message));
  });
}

window.addEventListener("keydown", (e) => {
  // isTrusted guards against synthetic events (e.g. the restore "look") starting it.
  if (!begun && e.isTrusted && (e.key === "Enter" || e.key === " ")) {
    e.preventDefault();
    begin();
  }
});
welcome?.addEventListener("click", begin);

document.addEventListener("click", () => {
  if (begun) input.focus();
});

if (!welcome) begin(); // no title screen present — start directly
