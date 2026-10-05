#!/usr/bin/env node
// No-op stand-in for tsgo (typescript-go) on FreeBSD.
// Every workspace this port builds resolves its cross-package imports
// straight from TypeScript source via package.json `exports` (verified for
// @actual-app/crdt and @actual-app/core), so tsgo's job here — emitting
// .d.ts declarations — has no consumer in this port's vite-driven build
// path. tsgo itself has no FreeBSD binary published (win32/darwin/linux
// optionalDependencies only), so this replaces it with a silent success
// instead of the unconditional crash the real bin/tsgo.js throws.
console.log(
  "[tsgo-shim] tsgo has no FreeBSD binary; skipping (declaration output unused by this port's vite builds).",
);
process.exit(0);
