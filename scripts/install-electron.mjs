#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { downloadArtifact } = require("@electron/get");
const root = path.resolve(import.meta.dirname, "..");
const version = require(path.join(root, "node_modules", "electron", "package.json")).version;
const destination = path.join(root, "node_modules", "electron", "dist");
const archive = await downloadArtifact({ version, artifactName: "electron", platform: "linux", arch: "x64" });

fs.rmSync(destination, { force: true, recursive: true });
fs.mkdirSync(destination, { recursive: true });
const result = spawnSync("unzip", ["-q", "-o", archive, "-d", destination], { stdio: "inherit" });
if (result.status !== 0) throw new Error(`unzip exited with ${result.status}`);
fs.writeFileSync(path.join(root, "node_modules", "electron", "path.txt"), "electron\n");
console.log(`Installed Electron ${version} for linux-x64.`);
