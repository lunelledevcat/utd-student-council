/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS on purpose: preloaded with node --require */
// Windows only, build-time only: OpenNext symlinks traced packages; Windows refuses symlinks without Developer Mode
// (EPERM). Directory symlinks become junctions (no privilege needed), file symlinks become copies.
// Loaded with NODE_OPTIONS=--require by scripts/cf.mjs. Linux/macOS/CI never load it.
const fs = require("node:fs");
const path = require("node:path");
const orig = fs.symlinkSync;
fs.symlinkSync = function (target, p, type) {
  try {
    return orig.call(fs, target, p, type);
  } catch (e) {
    if (e.code !== "EPERM") throw e;
    const abs = path.resolve(path.dirname(p), String(target));
    if (fs.statSync(abs).isDirectory()) return orig.call(fs, abs, p, "junction");
    return fs.copyFileSync(abs, p);
  }
};
