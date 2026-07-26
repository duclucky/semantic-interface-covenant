import { spawn } from "node:child_process";
import readline from "node:readline";

const command =
  process.platform === "win32" ? process.env.ComSpec ?? "cmd.exe" : "npx";
const args =
  process.platform === "win32"
    ? ["/d", "/s", "/c", "npx -y genlayer-mcp@2.2.0"]
    : ["-y", "genlayer-mcp@2.2.0"];
const child = spawn(command, args, {
  stdio: ["pipe", "pipe", "pipe"],
  windowsHide: true,
});

const timeout = setTimeout(() => {
  child.kill();
  console.error("Timed out waiting for GenLayer MCP.");
  process.exitCode = 1;
}, 30_000);

let initialized = false;
const rl = readline.createInterface({ input: child.stdout });

function send(message) {
  child.stdin.write(`${JSON.stringify(message)}\n`);
}

rl.on("line", (line) => {
  let message;
  try {
    message = JSON.parse(line);
  } catch {
    return;
  }

  if (message.id === 1 && !initialized) {
    initialized = true;
    send({
      jsonrpc: "2.0",
      method: "notifications/initialized",
      params: {},
    });
    send({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
    return;
  }

  if (message.id === 2) {
    clearTimeout(timeout);
    const tools = message.result?.tools ?? [];
    console.log(`GenLayer MCP ready: ${tools.length} tools`);
    for (const tool of tools) {
      console.log(`- ${tool.name}`);
    }
    child.kill();
  }
});

child.stderr.on("data", (chunk) => {
  const value = chunk.toString().trim();
  if (value) {
    console.error(value);
  }
});

child.on("error", (error) => {
  clearTimeout(timeout);
  console.error(error);
  process.exitCode = 1;
});

send({
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "genlayer-workspace-check", version: "1.0.0" },
  },
});
