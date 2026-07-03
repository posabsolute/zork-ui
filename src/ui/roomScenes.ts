// roomScenes.ts — compatibility shim. The scenes moved to src/scenes/ (state,
// kit, one file per region, index with the registry); this forwards the old
// import path so callers don't care.
export * from "../scenes/index.ts";
