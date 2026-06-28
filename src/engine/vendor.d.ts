// Minimal type shims for the untyped IF libraries we depend on.
// We import ifvms' self-contained UMD build directly. glkapi.js is loaded as a
// classic <script> (see index.html) and read off the global as window.Glk.
declare module "ifvms/dist/zvm.js" {
  const ZVM: any;
  export default ZVM;
}

interface Window {
  Glk: any;
}
