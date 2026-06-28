/*
 * Boots the authentic Z-machine: loads the real Zork I story file and runs it
 * through ifvms' ZVM, driven by the genuine GlkApi and our custom WebGlkOte.
 * Nothing here reimplements game logic — it is the original game, skinned.
 */
import ZVM from "ifvms/dist/zvm.js";
import { WebGlkOte, type WebGlkOteHooks } from "./glkoteWeb.ts";
import { LocalDialog } from "./dialog.ts";

// glkapi.js is loaded as a classic <script> (see index.html) and exposes window.Glk.
const Glk: any = (globalThis as any).Glk;
if (!Glk) throw new Error("GlkApi (window.Glk) not loaded — check vendor/glkapi.js script tag");

export interface BootedGame {
  vm: any;
  glk: any;
  glkote: WebGlkOte;
  dialog: LocalDialog;
}

export async function bootZork(opts: {
  storyUrl: string;
  output: HTMLElement;
  input: HTMLInputElement;
  hooks?: WebGlkOteHooks;
}): Promise<BootedGame> {
  const resp = await fetch(opts.storyUrl);
  if (!resp.ok) throw new Error(`Failed to load story file: ${resp.status}`);
  const storyBytes = new Uint8Array(await resp.arrayBuffer());

  const vm = new ZVM();
  const dialog = new LocalDialog();
  const glkote = new WebGlkOte({
    output: opts.output,
    input: opts.input,
    hooks: opts.hooks,
  });

  const options = {
    vm,
    Glk,
    GlkOte: glkote,
    Dialog: dialog,
  };

  // Same handshake as the reference ifvms driver:
  // prepare() loads the story, Glk.init() boots the display and calls vm.init().
  vm.prepare(storyBytes, options);
  Glk.init(options);

  return { vm, glk: Glk, glkote, dialog };
}
