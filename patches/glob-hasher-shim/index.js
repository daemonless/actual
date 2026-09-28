'use strict';
/*
 * Pure-JS stand-in for glob-hasher's NAPI addon on FreeBSD: no napi
 * optionalDependency covers freebsd-x64, and no source build is published
 * either (see .porting/cookbook.md). lage (this port's only consumer, via
 * its internal FileHasher/TargetHasher modules) requires('glob-hasher')
 * unconditionally at module load, so a native-binding load failure crashes
 * the whole build before a single task runs — unrelated to anything this
 * port actually ships.
 *
 * This only needs to satisfy lage's TASK-SCHEDULING use of these functions,
 * not caching correctness: every Containerfile build starts from an empty
 * local cache (lage.config.js: cacheOptions.provider: 'local'), so any
 * deterministic-but-approximate hash still causes a cache MISS and lage runs
 * the task normally — exactly what a one-shot image build needs anyway.
 * Function signatures match the real package's index.d.ts (NAPI-RS
 * generated) so lage's call sites see the same shapes back.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function resolveGlobs(globs, options) {
  const cwd = (options && options.cwd) || process.cwd();
  const patterns = Array.isArray(globs) ? globs : [globs];
  const matches = fs.globSync(patterns, { cwd });
  return matches.map(p => p.split(path.sep).join('/'));
}

function readAndHash(cwd, relPath) {
  const data = fs.readFileSync(path.resolve(cwd, relPath));
  return crypto.createHash('sha1').update(data).digest('hex');
}

function glob(globs, options) {
  try {
    return resolveGlobs(globs, options);
  } catch {
    return null;
  }
}

function hash(files, options) {
  const cwd = (options && options.cwd) || process.cwd();
  const result = {};
  for (const f of files) {
    try {
      result[f] = readAndHash(cwd, f);
    } catch {
      result[f] = null;
    }
  }
  return result;
}

function hashGlobXxhash(globs, options) {
  const cwd = (options && options.cwd) || process.cwd();
  const files = resolveGlobs(globs, options);
  const result = {};
  for (const f of files) {
    try {
      result[f] = BigInt('0x' + readAndHash(cwd, f).slice(0, 16));
    } catch {
      result[f] = null;
    }
  }
  return result;
}

function hashGlobGit(globs, options) {
  const cwd = (options && options.cwd) || process.cwd();
  const files = resolveGlobs(globs, options);
  const result = {};
  for (const f of files) {
    try {
      result[f] = readAndHash(cwd, f);
    } catch {
      result[f] = null;
    }
  }
  return result;
}

function stat(files, options) {
  const cwd = (options && options.cwd) || process.cwd();
  const result = {};
  for (const f of files) {
    try {
      const st = fs.statSync(path.resolve(cwd, f));
      result[f] = { mtime: BigInt(Math.floor(st.mtimeMs)), size: st.size };
    } catch {
      // omit missing files, matching the native addon's behaviour
    }
  }
  return result;
}

module.exports = { hashGlobXxhash, hashGlobGit, hash, glob, stat };
