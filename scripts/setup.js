#!/usr/bin/env node

import { execSync, spawn } from "child_process";
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
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: "inherit", ...options });
}

async function main() {
  console.log("\n🚀 Webapp Shell Setup\n");

  // Get project name
  const cwd = process.cwd();
  const defaultName = path.basename(cwd).toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const projectName = (await question(`Project name (${defaultName}): `)) || defaultName;

  const dbName = projectName.replace(/-/g, "_");
  const containerName = `${projectName}-db`;

  console.log(`\n📦 Setting up "${projectName}"...\n`);

  // Update package.json
  const pkgPath = path.join(cwd, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  pkg.name = projectName;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  console.log("✅ Updated package.json");

  // Generate .env
  const envExamplePath = path.join(cwd, ".env.example");
  const envPath = path.join(cwd, ".env");

  const dbPassword = crypto.randomBytes(16).toString("hex");
  const authSecret = crypto.randomBytes(32).toString("hex");

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
  console.log("✅ Created .env with generated secrets");

  // Update CLAUDE.md
  const claudePath = path.join(cwd, "CLAUDE.md");
  if (fs.existsSync(claudePath)) {
    let content = fs.readFileSync(claudePath, "utf-8");
    content = content.replace(/\*\*Webapp Shell\*\*/, `**${projectName}**`);
    fs.writeFileSync(claudePath, content);
    console.log("✅ Updated CLAUDE.md");
  }

  // Remove .git and reinitialize
  const gitDir = path.join(cwd, ".git");
  if (fs.existsSync(gitDir)) {
    fs.rmSync(gitDir, { recursive: true });
    console.log("✅ Removed old .git");
  }
  run("git init");
  console.log("✅ Initialized fresh git repo");

  // Check if Docker is running
  try {
    execSync("docker info", { stdio: "ignore" });
  } catch {
    console.error("\n❌ Docker is not running. Please start Docker and run: pnpm spinup:db\n");
    rl.close();
    return;
  }

  // Spin up PostgreSQL
  console.log("\n🐘 Starting PostgreSQL...\n");

  // Check if container already exists
  try {
    execSync(`docker inspect ${containerName}`, { stdio: "ignore" });
    console.log(`Container "${containerName}" already exists, starting it...`);
    run(`docker start ${containerName}`);
  } catch {
    // Container doesn't exist, create it
    run(`docker run -d \\
      --name ${containerName} \\
      -e POSTGRES_USER=postgres \\
      -e POSTGRES_PASSWORD=${dbPassword} \\
      -e POSTGRES_DB=${dbName} \\
      -p 5432:5432 \\
      postgres:16`);
  }

  // Wait for PostgreSQL to be ready
  console.log("\n⏳ Waiting for PostgreSQL to be ready...");
  let attempts = 0;
  while (attempts < 30) {
    try {
      execSync(
        `docker exec ${containerName} pg_isready -U postgres`,
        { stdio: "ignore" }
      );
      break;
    } catch {
      attempts++;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  if (attempts >= 30) {
    console.error("❌ PostgreSQL failed to start");
    rl.close();
    process.exit(1);
  }

  console.log("✅ PostgreSQL is ready");

  // Generate and run migrations
  console.log("\n📊 Setting up database...\n");
  run("pnpm db:generate");
  run("pnpm db:migrate");

  console.log("\n✅ Setup complete!\n");
  console.log("Next steps:\n");
  console.log("  pnpm dev              # Start dev server");
  console.log("  npx shadcn@latest add button card  # Add UI components\n");
  console.log(`Database container: ${containerName}`);
  console.log(`  Start: docker start ${containerName}`);
  console.log(`  Stop:  docker stop ${containerName}\n`);

  rl.close();
}

main().catch((err) => {
  console.error(err);
  rl.close();
  process.exit(1);
});
