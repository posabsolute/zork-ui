import "./style.css";
import { bootZork } from "./engine/zvm.ts";
import { RoomState } from "./engine/roomState.ts";
import { Viewport } from "./render/viewport.ts";

const output = document.getElementById("output") as HTMLElement;
const input = document.getElementById("input") as HTMLInputElement;
const canvas = document.getElementById("gl") as HTMLCanvasElement;

async function start() {
  const viewport = new Viewport(canvas);
  const rooms = new RoomState();
  await rooms.load();

  let latestStatus = "";

  rooms.onChange((change) => {
    console.log(
      `[room] ${change.room.id} (${change.room.name}) region=${change.room.region}` +
        ` dark=${change.isDark} via=${change.enteredFrom ?? "?"}`
    );
    viewport.showRoom(change.room, change.enteredFrom);
  });

  const game = await bootZork({
    storyUrl: "./zork1.z3",
    output,
    input,
    hooks: {
      onStatus(left) {
        latestStatus = left;
      },
      onCommand(line) {
        rooms.noteCommand(line);
      },
      onInputReady() {
        rooms.update(latestStatus);
      },
    },
  });

  rooms.attach(game.vm);
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
