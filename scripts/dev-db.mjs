#!/usr/bin/env node
/**
 * Local PostgreSQL helper for development.
 *
 * The project uses a portable PostgreSQL build instead of a system service, so
 * nothing is installed globally and the cluster lives inside .devdb/ (ignored
 * by git). On the production VPS you use the real PostgreSQL service and these
 * commands are not needed.
 *
 * Usage:
 *   node scripts/dev-db.mjs init     # create cluster + database, then start
 *   node scripts/dev-db.mjs start
 *   node scripts/dev-db.mjs stop
 *   node scripts/dev-db.mjs status
 *
 * Environment:
 *   PG_BIN   directory containing pg_ctl / initdb / psql / createdb
 *   PGPORT   defaults to 5433
 *   PGDATABASE defaults to ceylon_dev
 */
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(root, ".devdb", "data");
const logFile = path.join(root, ".devdb", "postgres.log");
const port = process.env.PGPORT ?? "5433";
const database = process.env.PGDATABASE ?? "ceylon_dev";
const user = process.env.PGUSER ?? "postgres";

const exe = process.platform === "win32" ? ".exe" : "";

function resolveBinDir() {
  const candidates = [
    process.env.PG_BIN,
    process.platform === "win32"
      ? path.join(homedir(), "AppData", "Local", "pg17", "pgsql", "bin")
      : null,
    "/usr/lib/postgresql/17/bin",
    "/usr/local/opt/postgresql@17/bin",
    "/opt/homebrew/opt/postgresql@17/bin",
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (existsSync(path.join(candidate, `pg_ctl${exe}`))) return candidate;
  }

  // Fall back to PATH.
  const probe = spawnSync(`pg_ctl${exe}`, ["--version"], { encoding: "utf8" });
  if (probe.status === 0) return null;

  console.error(
    "Could not find PostgreSQL binaries.\n" +
      "Set PG_BIN to the folder containing pg_ctl, e.g.\n" +
      "  PG_BIN=/usr/lib/postgresql/17/bin npm run db:status",
  );
  process.exit(1);
}

const binDir = resolveBinDir();
const tool = (name) => (binDir ? path.join(binDir, `${name}${exe}`) : name);

function run(name, args, options = {}) {
  return spawnSync(tool(name), args, {
    stdio: options.quiet ? "pipe" : "inherit",
    encoding: "utf8",
    ...options,
  });
}

function isRunning() {
  const result = spawnSync(tool("pg_ctl"), ["-D", dataDir, "status"], {
    encoding: "utf8",
  });
  return result.status === 0;
}

function start() {
  if (!existsSync(dataDir)) {
    console.error(
      "No local cluster found at .devdb/data.\n" +
        "Run `npm run db:setup` first (creates it with initdb).",
    );
    process.exit(1);
  }

  if (isRunning()) {
    console.log(`PostgreSQL is already running on port ${port}.`);
    return;
  }

  const result = run("pg_ctl", [
    "-D",
    dataDir,
    "-o",
    `-p ${port}`,
    "-l",
    logFile,
    "-w",
    "start",
  ]);

  if (result.status !== 0) {
    console.error(`Failed to start PostgreSQL. See ${logFile}`);
    process.exit(result.status ?? 1);
  }

  console.log(`PostgreSQL started on port ${port}.`);
}

function stop() {
  if (!isRunning()) {
    console.log("PostgreSQL is not running.");
    return;
  }

  const result = run("pg_ctl", ["-D", dataDir, "-m", "fast", "-w", "stop"]);
  if (result.status !== 0) process.exit(result.status ?? 1);
  console.log("PostgreSQL stopped.");
}

function status() {
  if (isRunning()) {
    console.log(`PostgreSQL is running on port ${port} (data: .devdb/data).`);
  } else {
    console.log("PostgreSQL is not running.");
    process.exitCode = 1;
  }
}

function init() {
  if (!existsSync(dataDir)) {
    console.log("Creating local PostgreSQL cluster in .devdb/data…");
    const result = run("initdb", [
      "-D",
      dataDir,
      "-U",
      user,
      "-A",
      "trust",
      "-E",
      "UTF8",
      "--locale=C",
    ]);

    if (result.status !== 0) {
      console.error("initdb failed.");
      process.exit(result.status ?? 1);
    }
  } else {
    console.log("Cluster already exists — reusing .devdb/data.");
  }

  start();

  const exists = run(
    "psql",
    [
      "-p",
      port,
      "-U",
      user,
      "-d",
      "postgres",
      "-tAc",
      `SELECT 1 FROM pg_database WHERE datname = '${database}'`,
    ],
    { quiet: true },
  );

  if (exists.stdout?.trim() !== "1") {
    const created = run("createdb", ["-p", port, "-U", user, database]);
    if (created.status !== 0) process.exit(created.status ?? 1);
    console.log(`Database "${database}" created.`);
  } else {
    console.log(`Database "${database}" already exists.`);
  }

  console.log(
    `\nDATABASE_URL="postgresql://${user}@localhost:${port}/${database}?schema=public"`,
  );
}

const command = process.argv[2] ?? "status";

switch (command) {
  case "init":
    init();
    break;
  case "start":
    start();
    break;
  case "stop":
    stop();
    break;
  case "status":
    status();
    break;
  default:
    console.error(`Unknown command: ${command}`);
    console.error("Use one of: init, start, stop, status");
    process.exit(1);
}
