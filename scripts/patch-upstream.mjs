#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const appDir = path.resolve(process.argv[2] ?? "");
if (!appDir || !fs.existsSync(path.join(appDir, "package.json"))) {
  throw new Error("usage: patch-upstream.mjs <extracted-asar-directory>");
}

function replaceExactly(file, before, after, expected = 1) {
  const source = fs.readFileSync(file, "utf8");
  const matches = source.split(before).length - 1;
  if (matches !== expected) {
    throw new Error(`${path.basename(file)}: expected ${expected} matches, found ${matches}`);
  }
  fs.writeFileSync(file, source.replaceAll(before, after));
}

const buildDir = path.join(appDir, ".vite", "build");
const bootstrap = fs.readdirSync(buildDir).find((name) => name.startsWith("bootstrap-") && name.endsWith(".js"));
const main = fs.readdirSync(buildDir).find((name) => name.startsWith("main-") && name.endsWith(".js"));
if (!bootstrap || !main) throw new Error("upstream build layout changed: bootstrap/main bundle not found");

// The upstream bootstrap explicitly quits on every platform except macOS and
// Windows. Keep the patch narrow and fail closed when minification changes.
replaceExactly(
  path.join(buildDir, bootstrap),
  "process.platform!==`darwin`&&process.platform!==`win32`",
  "process.platform!==`darwin`&&process.platform!==`win32`&&process.platform!==`linux`",
);

// Upstream feature payloads do not advertise Computer Use on Linux yet. Keep
// the override explicit and limited to our standalone MCP backend; do not claim
// the unavailable node_repl/native-pipe integration.
replaceExactly(
  path.join(buildDir, main),
  "let a=r===`win32`&&e.computerUse===!0?{...e,computerUseNodeRepl:!0}:e,o=r===`win32`&&n.CODEX_ELECTRON_ENABLE_WINDOWS_COMPUTER_USE===`1`?{...a,computerUse:!0,computerUseNodeRepl:!0}:a,s=t===i.a.Dev?Ze(n):null;return s==null?{...o,deviceAttestation:be({platform:r})}:{...o,...s,deviceAttestation:be({platform:r})}",
  "let a=r===`win32`&&e.computerUse===!0?{...e,computerUseNodeRepl:!0}:e,o=r===`win32`&&n.CODEX_ELECTRON_ENABLE_WINDOWS_COMPUTER_USE===`1`?{...a,computerUse:!0,computerUseNodeRepl:!0}:a,c=r===`linux`&&n.CODEX_ELECTRON_ENABLE_LINUX_COMPUTER_USE===`1`?{...o,computerUse:!0,computerUseNodeRepl:!1}:o,s=t===i.a.Dev?Ze(n):null;return s==null?{...c,deviceAttestation:be({platform:r})}:{...c,...s,deviceAttestation:be({platform:r})}",
);

// Add a Linux-specific descriptor. Unlike the macOS/Windows descriptors this
// one is immediately installable because selecting this port is the explicit
// opt-in; the packaged helper is replaced by our Linux MCP adapter.
replaceExactly(
  path.join(buildDir, main),
  "{autoInstallOptOutKey:n.js(n.ws),installWhenMissing:!0,installWhenMissingRequiresOptIn:!0,name:n.ws,isAvailable:({features:e,platform:t})=>t===`darwin`&&e.computerUse,migrate:Ko},{autoInstallOptOutKey:n.js(n.ws),installWhenMissing:!0,installWhenMissingRequiresOptIn:!0,name:n.ws,isAvailable:({features:e,platform:t})=>t===`win32`&&e.computerUse}",
  "{autoInstallOptOutKey:n.js(n.ws),installWhenMissing:!0,installWhenMissingRequiresOptIn:!0,name:n.ws,isAvailable:({features:e,platform:t})=>t===`darwin`&&e.computerUse,migrate:Ko},{installWhenMissing:!0,name:n.ws,isAvailable:({features:e,platform:t})=>t===`linux`&&e.computerUse},{autoInstallOptOutKey:n.js(n.ws),installWhenMissing:!0,installWhenMissingRequiresOptIn:!0,name:n.ws,isAvailable:({features:e,platform:t})=>t===`win32`&&e.computerUse}",
);

replaceExactly(
  path.join(buildDir, main),
  "function Ml(e){if(!(e.platform!==`darwin`||!e.marketplacePluginNames.includes(`computer-use`)))return e.desktopFeatureAvailability.computerUseNodeRepl?`node-repl`:`legacy-mcp`}",
  "function Ml(e){if(!((e.platform===`darwin`||e.platform===`linux`)&&e.marketplacePluginNames.includes(`computer-use`)))return;return e.desktopFeatureAvailability.computerUseNodeRepl?`node-repl`:`legacy-mcp`}",
);

const metadataPath = path.join(appDir, "package.json");
const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
metadata.productName = "ChatGPT";
metadata.codexLinuxPort = {
  patchSchema: 1,
  upstreamVersion: metadata.version,
};
fs.writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);

console.log(`Patched unified ChatGPT ${metadata.version} for Linux.`);
