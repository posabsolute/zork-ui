/*
 * WebGlkOte — a browser display layer implementing the GlkOte<->GlkApi protocol.
 *
 * GlkApi (the real, correct Glk implementation from glkote-term) drives all the
 * hard Z-machine I/O semantics (windows, streams, line/char events, save/restore
 * filerefs). It talks to a "GlkOte" display object through a small JSON protocol:
 *   - GlkApi calls  glkote.init(iface) / glkote.update(data)
 *   - the display calls iface.accept(response) to deliver input/init events back
 *
 * We implement that display here against our own CRT DOM, instead of pulling in
 * the full GlkOte web widget, so we keep total control of the look and the layout.
 */

type GlkContentRun = string | { text: string; style?: string };

interface GlkWindow {
  id: number;
  type: "buffer" | "grid" | "graphics";
  gridwidth?: number;
  gridheight?: number;
}

export interface WebGlkOteHooks {
  /** Latest left-hand status-line text (v3 = current room name). */
  onStatus?: (left: string, right: string) => void;
  /** Called after each batch of buffer text is appended. */
  onOutput?: (text: string) => void;
  /** Fired when the engine starts waiting for a line of input. */
  onInputReady?: () => void;
  /** Fired with each line command the player submits. */
  onCommand?: (line: string) => void;
  /**
   * Chance to handle a command in the UI layer before it reaches the game.
   * Return true to consume it (the game does not see it and no turn is taken).
   * `print` writes a system message to the terminal.
   */
  intercept?: (line: string, print: (text: string) => void) => boolean;
}

export class WebGlkOte {
  private iface: any = null;
  private generation = 0;
  private disabled = false;

  private bufferWin: GlkWindow | null = null;
  private gridWin: GlkWindow | null = null;
  private gridLines: string[] = [];

  private currentInput: { window: number; type: "line" | "char" } | null = null;

  private outputEl: HTMLElement;
  private inputEl: HTMLInputElement;
  private hooks: WebGlkOteHooks;

  constructor(opts: {
    output: HTMLElement;
    input: HTMLInputElement;
    hooks?: WebGlkOteHooks;
  }) {
    this.outputEl = opts.output;
    this.inputEl = opts.input;
    this.hooks = opts.hooks ?? {};
    this.wireInput();
  }

  // ---- GlkApi-facing interface ---------------------------------------------

  init(iface: any) {
    if (!iface || !iface.accept) {
      throw new Error("WebGlkOte: interface object with accept() required");
    }
    this.iface = iface;
    // Sending the init response triggers VM.init() inside GlkApi.
    this.sendResponse("init", null, this.measureWindow());
  }

  update(data: any) {
    if (data.type === "error") throw new Error(data.message);
    if (data.type === "pass") return;
    if (data.type !== "update" && data.type !== "exit") return;
    if (data.gen <= this.generation) return;
    this.generation = data.gen;

    if (this.disabled) this.disable(false);

    if (data.input != null) this.cancelInputs(data.input);
    if (data.windows != null) this.updateWindows(data.windows);
    if (data.content != null && data.content.length) this.updateContent(data.content);
    if (data.input != null) this.updateInputs(data.input);

    this.disabled = false;
    if (data.disabled || data.specialinput) this.disable(true);
    if (data.specialinput != null) this.acceptSpecialInput(data.specialinput);
    if (data.type === "exit") this.exit();
  }

  // GlkApi may call these:
  error(message: string) {
    throw new Error("Glk error: " + message);
  }
  log(_msg: string) {}
  warning(_msg: string) {}
  save_allstate() {
    return null;
  }
  getinterface() {
    return this.iface;
  }

  // ---- Protocol handlers ----------------------------------------------------

  private updateWindows(windows: GlkWindow[]) {
    for (const win of windows) {
      if (win.type === "buffer") this.bufferWin = win;
      if (win.type === "grid") {
        this.gridWin = win;
        const w = win.gridwidth ?? 0;
        const h = win.gridheight ?? 0;
        this.gridLines = Array.from({ length: h }, () => " ".repeat(w));
      }
    }
  }

  private updateContent(content: any[]) {
    for (const win of content) {
      if (this.gridWin && win.id === this.gridWin.id) {
        this.renderGrid(win);
      } else {
        this.renderBuffer(win);
      }
    }
  }

  private renderGrid(win: any) {
    if (win.lines) {
      for (const ln of win.lines) {
        const text = runsToText(ln.content);
        if (typeof ln.line === "number") this.gridLines[ln.line] = text;
      }
    }
    const left = (this.gridLines[0] ?? "").trimEnd();
    // v3 status line: room name on the left, score/moves on the right.
    const leftName = left.replace(/\s{2,}.*$/, "").trim();
    const right = left.slice(leftName.length).trim();
    this.hooks.onStatus?.(leftName, right);
  }

  private renderBuffer(win: any) {
    if (win.clear) this.outputEl.replaceChildren();
    if (!win.text) return;
    let appended = "";
    for (const line of win.text) {
      if (!line.append) {
        this.outputEl.appendChild(document.createElement("br"));
      }
      if (!line.content) continue;
      const runs = normalizeRuns(line.content);
      for (const run of runs) {
        const span = document.createElement("span");
        span.textContent = run.text;
        if (run.style) span.className = "glk-" + run.style;
        this.outputEl.appendChild(span);
        appended += run.text;
      }
    }
    if (appended) this.hooks.onOutput?.(appended);
    this.outputEl.scrollTop = this.outputEl.scrollHeight;
  }

  private updateInputs(inputs: any[]) {
    for (const inp of inputs) {
      if (inp.type === "line" || inp.type === "char") {
        this.currentInput = { window: inp.id, type: inp.type };
      }
    }
    if (this.currentInput) {
      this.inputEl.disabled = false;
      this.inputEl.focus();
      if (this.currentInput.type === "line") this.hooks.onInputReady?.();
    }
  }

  private cancelInputs(inputs: any[]) {
    if (!inputs || inputs.length === 0) {
      this.currentInput = null;
    }
  }

  private disable(d: boolean) {
    this.disabled = d;
    this.inputEl.disabled = d;
  }

  private acceptSpecialInput(data: any) {
    if (data.type === "fileref_prompt") {
      // Single fixed save slot per game — SAVE/RESTORE "just work".
      const ext = data.filetype === "transcript" ? "txt" : "glksave";
      const ref = { filename: `zork1.${ext}`, usage: data.filetype };
      this.sendResponse("specialresponse", null, "fileref_prompt", ref);
    } else {
      this.error("Unknown special input: " + data.type);
    }
  }

  private exit() {
    this.inputEl.disabled = true;
  }

  // ---- Input handling -------------------------------------------------------

  private wireInput() {
    const history: string[] = [];
    let histIdx = -1;

    this.inputEl.addEventListener("keydown", (e) => {
      if (!this.currentInput) return;

      if (this.currentInput.type === "char") {
        e.preventDefault();
        const key = keyToGlk(e);
        this.currentInput = null;
        this.sendResponse("char", { id: this.gridOrBuffer() }, key);
        return;
      }

      // line input
      if (e.key === "Enter") {
        const line = this.inputEl.value;
        this.echoInput(line);
        this.inputEl.value = "";
        if (line.trim()) {
          history.push(line);
          histIdx = history.length;
        }
        // UI-layer commands (e.g. HELP) are handled here and never reach the
        // game engine, so they don't consume a turn.
        if (this.hooks.intercept?.(line, (t) => this.printSystem(t))) {
          return; // keep waiting for the next line; the game hasn't moved
        }
        this.hooks.onCommand?.(line);
        const win = this.currentInput.window;
        this.currentInput = null;
        this.sendResponse("line", { id: win }, line);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (histIdx > 0) this.inputEl.value = history[--histIdx];
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (histIdx < history.length - 1) this.inputEl.value = history[++histIdx];
        else {
          histIdx = history.length;
          this.inputEl.value = "";
        }
      }
    });
  }

  private gridOrBuffer(): number {
    return this.bufferWin?.id ?? this.gridWin?.id ?? 0;
  }

  /** Write a UI/system message (e.g. HELP output) to the terminal. */
  printSystem(text: string) {
    const block = document.createElement("div");
    block.className = "sys";
    block.textContent = text;
    this.outputEl.appendChild(block);
    this.outputEl.appendChild(document.createElement("br"));
    this.outputEl.scrollTop = this.outputEl.scrollHeight;
  }

  private echoInput(line: string) {
    const span = document.createElement("span");
    span.className = "echo";
    span.textContent = line;
    this.outputEl.appendChild(span);
    this.outputEl.appendChild(document.createElement("br"));
    this.outputEl.scrollTop = this.outputEl.scrollHeight;
  }

  // ---- Helpers --------------------------------------------------------------

  private sendResponse(type: string, win: any, val: any, val2?: any) {
    const res: any = { type, gen: this.generation };
    if (win) res.window = win.id;
    if (type === "init" || type === "arrange") res.metrics = val;
    if (type === "init") res.support = [];
    if (type === "char" || type === "line") res.value = val;
    if (type === "specialresponse") {
      res.response = val;
      res.value = val2;
    }
    this.iface.accept(res);
  }

  private measureWindow() {
    const { charW, charH } = measureChar(this.outputEl);
    const rect = this.outputEl.getBoundingClientRect();
    const width = Math.max(40, Math.floor(rect.width / charW) || 80);
    const height = Math.max(20, Math.floor(rect.height / charH) || 25);
    return {
      buffercharheight: charH,
      buffercharwidth: charW,
      buffermarginx: 0,
      buffermarginy: 0,
      graphicsmarginx: 0,
      graphicsmarginy: 0,
      gridcharheight: charH,
      gridcharwidth: charW,
      gridmarginx: 0,
      gridmarginy: 0,
      height: height * charH,
      width: width * charW,
      inspacingx: 0,
      inspacingy: 0,
      outspacingx: 0,
      outspacingy: 0,
    };
  }
}

// Normalize the GlkOte content-run format into {text, style} objects.
function normalizeRuns(content: GlkContentRun[]): { text: string; style?: string }[] {
  const out: { text: string; style?: string }[] = [];
  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    if (typeof c === "string") {
      // [style, text, style, text, ...]
      const text = content[++i];
      out.push({ text: typeof text === "string" ? text : "", style: c });
    } else if (c && typeof c === "object") {
      out.push({ text: c.text ?? "", style: c.style });
    }
  }
  return out;
}

function runsToText(content: GlkContentRun[]): string {
  return normalizeRuns(content)
    .map((r) => r.text)
    .join("");
}

function keyToGlk(e: KeyboardEvent): string {
  switch (e.key) {
    case "Enter":
      return "return";
    case "Backspace":
      return "delete";
    case "Escape":
      return "escape";
    case "ArrowUp":
      return "up";
    case "ArrowDown":
      return "down";
    case "ArrowLeft":
      return "left";
    case "ArrowRight":
      return "right";
    case " ":
      return " ";
    default:
      return e.key.length === 1 ? e.key : "return";
  }
}

function measureChar(el: HTMLElement): { charW: number; charH: number } {
  const probe = document.createElement("span");
  probe.textContent = "0".repeat(10);
  probe.style.cssText =
    "position:absolute;visibility:hidden;white-space:pre;font:inherit;";
  el.appendChild(probe);
  const rect = probe.getBoundingClientRect();
  el.removeChild(probe);
  const charW = rect.width / 10 || 9;
  const charH = rect.height || 18;
  return { charW, charH };
}
