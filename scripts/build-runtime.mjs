#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);
const asar = require("@electron/asar");
const projectRoot = path.resolve(import.meta.dirname, "..");
const contents = path.resolve(process.argv[2] ?? "");
const output = path.resolve(process.argv[3] ?? path.join(projectRoot, "build", "runtime"));
const resources = path.join(contents, "Resources");

if (!fs.existsSync(path.join(resources, "app.asar"))) {
  throw new Error("usage: build-runtime.mjs <ChatGPT.app/Contents> [runtime-output]");
}

const codexPackage = path.join(
  path.dirname(fs.realpathSync(process.env.CODEX_JS ?? findExecutable("codex"))),
  "..",
  "node_modules",
  "@openai",
  "codex-linux-x64",
  "vendor",
  "x86_64-unknown-linux-musl",
);
const codexVendor = fs.realpathSync(codexPackage);
const electronDist = path.join(projectRoot, "node_modules", "electron", "dist");
const staging = fs.mkdtempSync(path.join(os.tmpdir(), "chatgpt-linux-runtime-"));
const extractedAsar = path.join(staging, "asar");
const linuxNode = resolveLinuxNode();

try {
  fs.rmSync(output, { force: true, recursive: true });
  fs.cpSync(electronDist, output, { recursive: true });
  fs.renameSync(path.join(output, "electron"), path.join(output, "chatgpt"));
  const outputResources = path.join(output, "resources");
  fs.rmSync(path.join(outputResources, "default_app.asar"), { force: true });

  fs.cpSync(resources, outputResources, {
    recursive: true,
    filter(source) {
      const relative = path.relative(resources, source);
      return relative !== "app.asar";
    },
  });

  // These helpers are Apple-specific (Sparkle, LaunchServices, macOS input
  // monitoring, and Chronicle). Their call sites are platform-gated upstream;
  // retaining non-executable Mach-O payloads in an Arch package is misleading.
  fs.rmSync(path.join(outputResources, "native"), { force: true, recursive: true });
  fs.rmSync(path.join(outputResources, "codex_chronicle"), { force: true });

  asar.extractAll(path.join(resources, "app.asar"), extractedAsar);
  run(process.execPath, [path.join(projectRoot, "scripts", "patch-upstream.mjs"), extractedAsar]);
  await asar.createPackageWithOptions(extractedAsar, path.join(outputResources, "app.asar"), {
    unpackDir: "**/{better-sqlite3,node-pty,node-hid}",
  });

  copyExecutable(path.join(codexVendor, "bin", "codex"), path.join(outputResources, "codex"));
  copyExecutable(
    path.join(codexVendor, "bin", "codex-code-mode-host"),
    path.join(outputResources, "codex-code-mode-host"),
  );
  copyExecutable(path.join(codexVendor, "codex-path", "rg"), path.join(outputResources, "rg"));
  fs.cpSync(
    path.join(codexVendor, "codex-resources"),
    path.join(outputResources, "codex-resources"),
    { recursive: true },
  );

  // The CUA bundle in the macOS package contains portable JavaScript but a
  // Mach-O Node executable and Darwin native addons. Use the same Node version
  // from OpenAI's downloaded Linux primary runtime (or an explicit override),
  // then replace the native addons with their Linux builds.
  copyExecutable(linuxNode, path.join(outputResources, "cua_node", "bin", "node"));
  copyPackage(
    path.join(projectRoot, "node_modules", "@img", "sharp-linux-x64"),
    path.join(outputResources, "cua_node", "lib", "node_modules", "@img", "sharp-linux-x64"),
  );
  copyPackage(
    path.join(projectRoot, "node_modules", "@img", "sharp-libvips-linux-x64"),
    path.join(outputResources, "cua_node", "lib", "node_modules", "@img", "sharp-libvips-linux-x64"),
  );
  copyPackage(
    path.join(projectRoot, "node_modules", "@napi-rs", "canvas-linux-x64-gnu"),
    path.join(outputResources, "cua_node", "lib", "node_modules", "@napi-rs", "canvas-linux-x64-gnu"),
  );
  const cuaManifestPath = path.join(outputResources, "cua_node", "manifest.json");
  const cuaManifest = JSON.parse(fs.readFileSync(cuaManifestPath, "utf8"));
  cuaManifest.platform = "linux";
  cuaManifest.arch = "x64";
  cuaManifest.target = "linux-x64";
  cuaManifest.node_archive_path = null;
  // There is no public Linux node_repl build as of this upstream release.
  // Never execute the packaged Mach-O host. An audited compatible host can be
  // supplied without changing this assembler.
  if (process.env.CHATGPT_LINUX_NODE_REPL) {
    copyExecutable(process.env.CHATGPT_LINUX_NODE_REPL, path.join(outputResources, "cua_node", "bin", "node_repl"));
    cuaManifest.node_repl_archive_path = null;
  } else {
    fs.rmSync(path.join(outputResources, "cua_node", "bin", "node_repl"), { force: true });
    cuaManifest.node_repl_path = null;
    cuaManifest.node_repl_archive_path = null;
  }
  fs.writeFileSync(cuaManifestPath, `${JSON.stringify(cuaManifest, null, 2)}\n`);

  const unpacked = path.join(outputResources, "app.asar.unpacked", "node_modules");
  fs.copyFileSync(
    path.join(projectRoot, "node_modules", "better-sqlite3", "build", "Release", "better_sqlite3.node"),
    path.join(unpacked, "better-sqlite3", "build", "Release", "better_sqlite3.node"),
  );
  const computerUseSkillPath = path.join(
    outputResources,
    "plugins",
    "openai-bundled",
    "plugins",
    "computer-use",
    "skills",
    "computer-use",
    "SKILL.md",
  );
  const computerUseSkill = fs.readFileSync(computerUseSkillPath, "utf8")
    .replace("Control local Mac apps", "Control local Linux apps")
    .replace("local Mac apps", "local Linux apps");
  fs.writeFileSync(computerUseSkillPath, computerUseSkill);
  for (const name of ["pty.node", "spawn-helper"]) {
    const source = path.join(projectRoot, "node_modules", "node-pty", "build", "Release", name);
    if (fs.existsSync(source)) copyExecutable(source, path.join(unpacked, "node-pty", "build", "Release", name));
  }

  const upstreamHid = path.join(
    unpacked,
    "@worklouder",
    "device-kit-oai",
    "node_modules",
    "@worklouder",
    "wl-device-kit",
    "node_modules",
    "node-hid",
  );
  fs.mkdirSync(path.join(upstreamHid, "bin", "linux-x64-146"), { recursive: true });
  fs.copyFileSync(
    path.join(projectRoot, "node_modules", "node-hid", "build", "Release", "HID_hidraw.node"),
    path.join(upstreamHid, "bin", "linux-x64-146", "node-hid.node"),
  );

  const linuxComputerUse = path.join(
    outputResources,
    "plugins",
    "openai-bundled",
    "plugins",
    "computer-use",
    "linux",
  );
  fs.mkdirSync(linuxComputerUse, { recursive: true });
  fs.copyFileSync(
    path.join(projectRoot, "integrations", "computer-use", "sky-mcp.mjs"),
    path.join(linuxComputerUse, "sky-mcp.mjs"),
  );
  copyExecutable(
    path.join(outputResources, "cua_node", "lib", "node_modules", "@oai", "sky", "bin", "linux", "sky_linux_x64"),
    path.join(linuxComputerUse, "sky_linux_x64"),
  );
  fs.copyFileSync(
    path.join(projectRoot, "integrations", "computer-use", "plugin.linux.json"),
    path.join(
      outputResources,
      "plugins",
      "openai-bundled",
      "plugins",
      "computer-use",
      ".codex-plugin",
      "plugin.json",
    ),
  );
  fs.copyFileSync(
    path.join(projectRoot, "integrations", "computer-use", "mcp.linux.json"),
    path.join(
      outputResources,
      "plugins",
      "openai-bundled",
      "plugins",
      "computer-use",
      ".mcp.json",
    ),
  );

  fs.chmodSync(path.join(output, "chatgpt"), 0o755);
  fs.chmodSync(path.join(output, "chrome-sandbox"), 0o755);
  console.log(`Runtime assembled at ${output}`);
} finally {
  fs.rmSync(staging, { force: true, recursive: true });
}

function copyExecutable(source, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
  fs.chmodSync(destination, 0o755);
}

function copyPackage(source, destination) {
  if (!fs.existsSync(path.join(source, "package.json"))) {
    throw new Error(`Linux runtime package is missing: ${source}`);
  }
  fs.rmSync(destination, { force: true, recursive: true });
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, { recursive: true });
}

function resolveLinuxNode() {
  const candidates = [
    process.env.CHATGPT_LINUX_NODE,
    path.join(os.homedir(), ".cache", "codex-runtimes", "codex-primary-runtime", "dependencies", "node", "bin", "node"),
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue;
    const result = spawnSync(candidate, ["--version"], { encoding: "utf8" });
    if (result.status === 0 && result.stdout.trim() === "v24.14.0") return candidate;
  }
  throw new Error(
    "A Linux Node v24.14.0 executable is required. Let ChatGPT install its primary runtime or set CHATGPT_LINUX_NODE.",
  );
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) throw new Error(`${command} exited with ${result.status}`);
}

function findExecutable(name) {
  const pathEntries = (process.env.PATH ?? "").split(path.delimiter);
  for (const entry of pathEntries) {
    const candidate = path.join(entry, name);
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error(`${name} was not found on PATH`);
}
