#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";

const sky = path.join(import.meta.dirname, "sky_linux_x64");
const tools = [
  tool("computer_screenshot", "Capture the Linux desktop", {}),
  tool("computer_click", "Click at desktop coordinates", {
    x: number(), y: number(), mouse_button: string(["left", "middle", "right"]), click_count: number(),
  }, ["x", "y"]),
  tool("computer_drag", "Drag between desktop coordinates", {
    from_x: number(), from_y: number(), to_x: number(), to_y: number(),
  }, ["from_x", "from_y", "to_x", "to_y"]),
  tool("computer_move", "Move the pointer", { x: number(), y: number() }, ["x", "y"]),
  tool("computer_press_key", "Press a keyboard key or chord", { key: string() }, ["key"]),
  tool("computer_scroll", "Scroll the desktop", {
    direction: string(["up", "down", "left", "right"]), pixels: number(),
  }, ["direction", "pixels"]),
  tool("computer_type_text", "Type text through the desktop input service", { text: string() }, ["text"]),
];

let inputBuffer = "";
let requestChain = Promise.resolve();
let finishInput;
const inputComplete = new Promise((resolve) => { finishInput = resolve; });
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  inputBuffer += chunk;
  for (;;) {
    const newline = inputBuffer.indexOf("\n");
    if (newline < 0) break;
    const line = inputBuffer.slice(0, newline).replace(/\r$/, "");
    inputBuffer = inputBuffer.slice(newline + 1);
    if (line.trim()) requestChain = requestChain.then(() => handleLine(line));
  }
});
process.stdin.on("end", async () => {
  const trailing = inputBuffer.replace(/\r$/, "").trim();
  if (trailing) requestChain = requestChain.then(() => handleLine(trailing));
  await requestChain;
  finishInput();
});
process.stdin.resume();

async function handleLine(line) {
  let request;
  try {
    request = JSON.parse(line);
    const response = await dispatch(request);
    if (response !== undefined && request.id !== undefined) write({ jsonrpc: "2.0", id: request.id, result: response });
  } catch (error) {
    if (request?.id !== undefined) {
      write({ jsonrpc: "2.0", id: request.id, error: { code: -32603, message: errorMessage(error) } });
    }
  }
}

async function dispatch(request) {
  if (request.method === "initialize") {
    return {
      protocolVersion: request.params?.protocolVersion ?? "2025-03-26",
      capabilities: { tools: {} },
      serverInfo: { name: "chatgpt-linux-computer-use", version: "0.1.0" },
    };
  }
  if (request.method === "notifications/initialized" || request.method === "ping") return {};
  if (request.method === "tools/list") return { tools };
  if (request.method === "tools/call") {
    const name = request.params?.name;
    const definition = tools.find((candidate) => candidate.name === name);
    if (!definition) throw new Error(`Unknown computer-use tool: ${name}`);
    const command = name.replace("computer_", "");
    const result = await runSky(command, request.params?.arguments ?? {});
    if (command === "screenshot" || command === "get_screenshot") return screenshotContent(result);
    return { content: [{ type: "text", text: typeof result === "string" ? result : JSON.stringify(result) }] };
  }
  throw new Error(`Unsupported MCP method: ${request.method}`);
}

function runSky(command, input) {
  if (process.env.WAYLAND_DISPLAY && commandAvailable("grim")) return runWayland(command, input);
  const skyCommand = command === "screenshot" ? "get_screenshot" : command;
  return new Promise((resolve, reject) => {
    const child = spawn(sky, [skyCommand], { env: process.env, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) return reject(new Error(stderr.trim() || `sky exited with ${code}`));
      const text = stdout.trim();
      try { resolve(JSON.parse(text)); } catch { resolve(text || "ok"); }
    });
    child.stdin.end(`${JSON.stringify(input)}\n`);
  });
}

async function runWayland(command, input) {
  if (command === "screenshot") {
    const png = await runCommand("grim", ["-"] , null, false);
    return { data: png.toString("base64"), mime_type: "image/png" };
  }
  if (!commandAvailable("ydotool")) {
    throw new Error(
      "Wayland input requires ydotool and a user-authorized ydotoold service; screenshots only require grim",
    );
  }
  switch (command) {
    case "click": {
      const button = { left: "0xC0", right: "0xC1", middle: "0xC2" }[input.mouse_button ?? "left"];
      await runCommand("ydotool", ["mousemove", "--absolute", "-x", String(input.x), "-y", String(input.y)]);
      await runCommand("ydotool", ["click", "--repeat", String(input.click_count ?? 1), button]);
      return "ok";
    }
    case "move":
      await runCommand("ydotool", ["mousemove", "--absolute", "-x", String(input.x), "-y", String(input.y)]);
      return "ok";
    case "drag":
      await runCommand("ydotool", ["mousemove", "--absolute", "-x", String(input.from_x), "-y", String(input.from_y)]);
      await runCommand("ydotool", ["click", "0x40"]);
      await runCommand("ydotool", ["mousemove", "--absolute", "-x", String(input.to_x), "-y", String(input.to_y)]);
      await runCommand("ydotool", ["click", "0x80"]);
      return "ok";
    case "type_text":
      await runCommand("ydotool", ["type", "--key-delay", "0", input.text]);
      return "ok";
    case "scroll": {
      const amount = Math.max(1, Math.round(input.pixels / 8));
      const [horizontal, vertical] = {
        up: [0, amount], down: [0, -amount], left: [amount, 0], right: [-amount, 0],
      }[input.direction];
      await runCommand("ydotool", ["mousemove", "--wheel", String(horizontal), String(vertical)]);
      return "ok";
    }
    case "press_key":
      await pressKey(input.key);
      return "ok";
    default:
      throw new Error(`Unsupported Wayland command: ${command}`);
  }
}

const keyCodes = {
  ALT: 56, BACKSPACE: 14, CTRL: 29, DELETE: 111, DOWN: 108, END: 107,
  ENTER: 28, ESC: 1, HOME: 102, LEFT: 105, META: 125, PAGEDOWN: 109,
  PAGEUP: 104, RIGHT: 106, SHIFT: 42, SPACE: 57, TAB: 15, UP: 103,
  A: 30, B: 48, C: 46, D: 32, E: 18, F: 33, G: 34, H: 35, I: 23,
  J: 36, K: 37, L: 38, M: 50, N: 49, O: 24, P: 25, Q: 16, R: 19,
  S: 31, T: 20, U: 22, V: 47, W: 17, X: 45, Y: 21, Z: 44,
};

async function pressKey(value) {
  const names = String(value).toUpperCase().replaceAll("CMD", "META").split(/[+\-]/).filter(Boolean);
  const codes = names.map((name) => keyCodes[name]);
  if (codes.some((code) => code == null)) throw new Error(`Unsupported Wayland key chord: ${value}`);
  const events = [...codes.map((code) => `${code}:1`), ...codes.reverse().map((code) => `${code}:0`)];
  await runCommand("ydotool", ["key", ...events]);
}

function runCommand(command, args, stdin = null, textOutput = true) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { env: process.env, stdio: ["pipe", "pipe", "pipe"] });
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      const error = Buffer.concat(stderr).toString("utf8").trim();
      if (code !== 0) return reject(new Error(error || `${command} exited with ${code}`));
      const output = Buffer.concat(stdout);
      resolve(textOutput ? output.toString("utf8").trim() : output);
    });
    child.stdin.end(stdin);
  });
}

function commandAvailable(command) {
  return spawnSync("sh", ["-c", `command -v "$1"`, "sh", command], { stdio: "ignore" }).status === 0;
}

function screenshotContent(result) {
  const candidates = Array.isArray(result) ? result : result?.screenshots ?? [result];
  const content = [];
  for (const item of candidates) {
    const data = item?.data ?? item?.base64 ?? item?.image_base64;
    if (typeof data === "string") content.push({ type: "image", data, mimeType: item?.mime_type ?? "image/png" });
  }
  if (content.length === 0) content.push({ type: "text", text: JSON.stringify(result) });
  return { content };
}

function tool(name, description, properties, required = []) {
  return { name, description, inputSchema: { type: "object", properties, required, additionalProperties: false } };
}
function number() { return { type: "number" }; }
function string(values) { return values ? { type: "string", enum: values } : { type: "string" }; }
function write(value) { process.stdout.write(`${JSON.stringify(value)}\n`); }
function errorMessage(error) { return error instanceof Error ? error.message : String(error); }

if (!fs.existsSync(sky)) throw new Error(`Linux computer-use binary is missing: ${sky}`);
await inputComplete;
