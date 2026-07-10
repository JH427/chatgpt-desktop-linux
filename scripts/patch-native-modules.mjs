#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const sqliteRoot = path.join(root, "node_modules", "better-sqlite3", "src");

function replaceExactlyOnce(file, before, after) {
  const source = fs.readFileSync(file, "utf8");
  const matches = source.split(before).length - 1;
  if (matches === 0 && source.includes(after)) return;
  if (matches !== 1) {
    throw new Error(`${path.relative(root, file)}: expected one compatibility target, found ${matches}`);
  }
  fs.writeFileSync(file, source.replace(before, after));
}

replaceExactlyOnce(
  path.join(sqliteRoot, "util", "macros.cpp"),
  "#define OnlyAddon static_cast<Addon*>(info.Data().As<v8::External>()->Value())",
  `#if defined(NODE_MODULE_VERSION) && NODE_MODULE_VERSION >= 146
#define EXTERNAL_VALUE(external) ((external)->Value(v8::kExternalPointerTypeTagDefault))
#else
#define EXTERNAL_VALUE(external) ((external)->Value())
#endif
#define OnlyAddon static_cast<Addon*>(EXTERNAL_VALUE(info.Data().As<v8::External>()))`,
);

replaceExactlyOnce(
  path.join(sqliteRoot, "util", "helpers.cpp"),
  "\t\tfunc,\n\t\t0,\n\t\tdata",
  "\t\tfunc,\n\t\tnullptr,\n\t\tdata",
);

replaceExactlyOnce(
  path.join(sqliteRoot, "better_sqlite3.cpp"),
  "\tv8::Local<v8::External> data = v8::External::New(isolate, addon);",
  `\t#if defined(NODE_MODULE_VERSION) && NODE_MODULE_VERSION >= 146
\tv8::Local<v8::External> data = v8::External::New(isolate, addon, v8::kExternalPointerTypeTagDefault);
\t#else
\tv8::Local<v8::External> data = v8::External::New(isolate, addon);
\t#endif`,
);

console.log("Native module sources are compatible with Electron 42 / module ABI 146.");
