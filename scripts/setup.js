#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => rl.question(prompt, resolve));
}

function run(cmd, options = {}) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: "inherit", ...options });
}

function tryRun(cmd) {
  try {
    execSync(cmd, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function getOutput(cmd) {
  try {
    return execSync(cmd, { encoding: "utf-8" }).trim();
  } catch {
    return null;
  }
}

function findContainerOnPort(port) {
  // Get all running containers with their port mappings
  const output = getOutput(`docker ps --format "{{.Names}}:{{.Ports}}"`);
  if (!output) return null;

  for (const line of output.split("\n")) {
    if (line.includes(`:${port}->`)) {
      return line.split(":")[0];
    }
  }
  return null;
}

async function main() {
  console.log("\n🚀 BoilerpAIte Setup\n");

  const cwd = process.cwd();

  // 1. Install dependencies first
  console.log("📦 Installing dependencies...\n");
  run("pnpm install");

  // 2. Get project name
  const defaultName = path.basename(cwd).toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const projectName = (await question(`\nProject name (${defaultName}): `)) || defaultName;

  const dbName = projectName.replace(/-/g, "_");
  const containerName = `${projectName}-db`;

  console.log(`\n⚙️  Setting up "${projectName}"...\n`);

  // 3. Update package.json
  const pkgPath = path.join(cwd, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  pkg.name = projectName;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  console.log("✅ Updated package.json");

  // 4. Handle .env - reuse existing password if available
  const envExamplePath = path.join(cwd, ".env.example");
  const envPath = path.join(cwd, ".env");

  let dbPassword;
  let authSecret;

  // Check if .env already exists with a password
  if (fs.existsSync(envPath)) {
    const existingEnv = fs.readFileSync(envPath, "utf-8");
    const pwMatch = existingEnv.match(/DATABASE_URL=postgresql:\/\/[^:]+:([^@]+)@/);
    const secretMatch = existingEnv.match(/BETTER_AUTH_SECRET=(.+)/);
    if (pwMatch) dbPassword = pwMatch[1];
    if (secretMatch) authSecret = secretMatch[1];
    console.log("✅ Reusing existing .env credentials");
  }

  // Generate new ones if needed
  if (!dbPassword) dbPassword = crypto.randomBytes(16).toString("hex");
  if (!authSecret) authSecret = crypto.randomBytes(32).toString("hex");

  let envContent = fs.readFileSync(envExamplePath, "utf-8");
  envContent = envContent.replace(
    /DATABASE_URL=.*/,
    `DATABASE_URL=postgresql://postgres:${dbPassword}@localhost:5432/${dbName}`
  );
  envContent = envContent.replace(
    /BETTER_AUTH_SECRET=.*/,
    `BETTER_AUTH_SECRET=${authSecret}`
  );
  envContent = envContent.replace(
    /MINIO_BUCKET=.*/,
    `MINIO_BUCKET=${dbName}`
  );

  fs.writeFileSync(envPath, envContent);
  console.log("✅ Created .env");

  // 5. Update CLAUDE.md
  const claudePath = path.join(cwd, "CLAUDE.md");
  if (fs.existsSync(claudePath)) {
    let content = fs.readFileSync(claudePath, "utf-8");
    content = content.replace(/\*\*BoilerpAIte\*\*/, `**${projectName}**`);
    fs.writeFileSync(claudePath, content);
    console.log("✅ Updated CLAUDE.md");
  }

  // 6. Remove .git and reinitialize
  const gitDir = path.join(cwd, ".git");
  if (fs.existsSync(gitDir)) {
    fs.rmSync(gitDir, { recursive: true });
  }
  run("git init");
  console.log("✅ Initialized fresh git repo");

  // 7. Check if Docker is running
  if (!tryRun("docker info")) {
    console.error("\n❌ Docker is not running. Please start Docker and run: pnpm spinup:db\n");
    rl.close();
    return;
  }

  // 8. Handle PostgreSQL container
  console.log("\n🐘 Starting PostgreSQL...\n");

  const containerExists = tryRun(`docker inspect ${containerName}`);

  if (containerExists) {
    // Container exists - just start it
    console.log(`Container "${containerName}" exists, starting...`);
    run(`docker start ${containerName}`);
  } else {
    // Check if default port 5432 is in use
    let dbPort = 5432;
    const blockingContainer = findContainerOnPort(5432);

    if (blockingContainer || tryRun("lsof -i :5432")) {
      const usedBy = blockingContainer ? `container "${blockingContainer}"` : "another process";
      console.log(`\n⚠️  Port 5432 is in use by ${usedBy}`);
      const altPort = await question("Enter alternative port (e.g., 5433): ");

      if (!altPort || !/^\d+$/.test(altPort)) {
        console.error("❌ Invalid port number.");
        rl.close();
        process.exit(1);
      }

      dbPort = parseInt(altPort, 10);

      // Check if alternative port is also in use
      if (findContainerOnPort(dbPort) || tryRun(`lsof -i :${dbPort}`)) {
        console.error(`❌ Port ${dbPort} is also in use.`);
        rl.close();
        process.exit(1);
      }

      // Update .env with the new port
      let envContent = fs.readFileSync(envPath, "utf-8");
      envContent = envContent.replace(/:5432\//, `:${dbPort}/`);
      fs.writeFileSync(envPath, envContent);
      console.log(`✅ Updated .env to use port ${dbPort}`);
    }

    // Create new container
    run(`docker run -d --name ${containerName} -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=${dbPassword} -e POSTGRES_DB=${dbName} -p ${dbPort}:5432 postgres:16`);
  }

  // 9. Wait for PostgreSQL to be ready
  console.log("\n⏳ Waiting for PostgreSQL...");
  let attempts = 0;
  while (attempts < 30) {
    if (tryRun(`docker exec ${containerName} pg_isready -U postgres`)) {
      break;
    }
    attempts++;
    await new Promise((r) => setTimeout(r, 1000));
  }

  if (attempts >= 30) {
    console.error("❌ PostgreSQL failed to start");
    rl.close();
    process.exit(1);
  }

  console.log("✅ PostgreSQL is ready");

  // 10. Generate and run migrations
  console.log("\n📊 Setting up database...\n");
  run("pnpm db:generate");
  run("pnpm db:migrate");

  console.log("\n✅ Setup complete!\n");
  console.log("Next steps:\n");
  console.log("  pnpm dev              # Start dev server");
  console.log("  npx shadcn@latest add button card  # Add UI components\n");
  console.log(`Database: docker start/stop ${containerName}\n`);

  rl.close();
}

main().catch((err) => {
  console.error(err);
  rl.close();
  process.exit(1);
});
