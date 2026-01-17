#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const cwd = process.cwd();
const envPath = path.join(cwd, ".env");

if (!fs.existsSync(envPath)) {
  console.error("❌ .env file not found. Run `pnpm setup` first.");
  process.exit(1);
}

// Parse DATABASE_URL from .env
const envContent = fs.readFileSync(envPath, "utf-8");
const dbUrlMatch = envContent.match(/DATABASE_URL=postgresql:\/\/([^:]+):([^@]+)@[^:]+:(\d+)\/(\w+)/);

if (!dbUrlMatch) {
  console.error("❌ Could not parse DATABASE_URL from .env");
  process.exit(1);
}

const [, user, password, port, dbName] = dbUrlMatch;
const pkgPath = path.join(cwd, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
const containerName = `${pkg.name}-db`;

// Check if Docker is running
try {
  execSync("docker info", { stdio: "ignore" });
} catch {
  console.error("❌ Docker is not running. Please start Docker first.");
  process.exit(1);
}

// Check if container exists
try {
  execSync(`docker inspect ${containerName}`, { stdio: "ignore" });
  console.log(`Starting existing container "${containerName}"...`);
  execSync(`docker start ${containerName}`, { stdio: "inherit" });
} catch {
  console.log(`Creating new container "${containerName}"...`);
  execSync(
    `docker run -d --name ${containerName} -e POSTGRES_USER=${user} -e POSTGRES_PASSWORD=${password} -e POSTGRES_DB=${dbName} -p ${port}:5432 postgres:16`,
    { stdio: "inherit" }
  );
}

// Wait for ready
console.log("Waiting for PostgreSQL...");
let attempts = 0;
while (attempts < 30) {
  try {
    execSync(`docker exec ${containerName} pg_isready -U ${user}`, { stdio: "ignore" });
    console.log("✅ PostgreSQL is ready");
    process.exit(0);
  } catch {
    attempts++;
    execSync("sleep 1");
  }
}

console.error("❌ PostgreSQL failed to start");
process.exit(1);
