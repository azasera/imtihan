#!/usr/bin/env node

import { randomBytes } from "node:crypto"
import { spawnSync } from "node:child_process"
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import process from "node:process"
import readline from "node:readline/promises"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const appDir = path.join(root, "apps")
const localEnvPath = path.join(appDir, ".env.local")
const sampleEnvPath = path.join(appDir, ".env.sample")
const gitCommand = process.platform === "win32" ? "git.exe" : "git"
const checkOnly = process.argv.includes("--check")
const npmRunner = process.env.npm_execpath
  ? { command: process.execPath, prefix: [process.env.npm_execpath] }
  : { command: "npm", prefix: [] }

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? root,
    encoding: options.input === undefined ? undefined : "utf8",
    input: options.input,
    stdio: options.input === undefined ? "inherit" : ["pipe", "inherit", "inherit"],
  })
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed.`)
  }
}

function commandAvailable(command, args = ["--version"]) {
  return spawnSync(command, args, { cwd: root, stdio: "ignore" }).status === 0
}

function runNpm(args, options = {}) {
  run(npmRunner.command, [...npmRunner.prefix, ...args], options)
}

function runNpmForConvexConfiguration(args) {
  return spawnSync(npmRunner.command, [...npmRunner.prefix, ...args], {
    cwd: root,
    stdio: "inherit",
  })
}

function findPython() {
  return ["python", "python3"].find((command) => commandAvailable(command))
}

function readEnv(file) {
  if (!existsSync(file)) return {}
  const values = {}
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/)
    if (match) values[match[1]] = match[2]
  }
  return values
}

function updateEnv(file, updates) {
  const original = existsSync(file) ? readFileSync(file, "utf8") : ""
  const lines = original.split(/\r?\n/)
  const remaining = new Map(Object.entries(updates))
  const updated = lines.map((line) => {
    const match = line.match(/^([A-Z][A-Z0-9_]*)=/)
    if (!match || !remaining.has(match[1])) return line
    const value = remaining.get(match[1])
    remaining.delete(match[1])
    return `${match[1]}=${value}`
  })
  if (updated.length && updated.at(-1) !== "") updated.push("")
  for (const [key, value] of remaining) updated.push(`${key}=${value}`)
  updated.push("")
  writeFileSync(file, updated.join("\n"), "utf8")
}

function setConvexEnv(name, value) {
  runNpm(["--prefix", "apps", "exec", "--", "convex", "env", "set", name], {
    input: `${value}\n`,
  })
}

function setConvexEnvInteractively(name) {
  console.log(`\nConvex will securely prompt for ${name}.`)
  runNpm(["--prefix", "apps", "exec", "--", "convex", "env", "set", name])
}

function printCheck() {
  const checks = [
    ["Node.js 20.9+", Number(process.versions.node.split(".")[0]) >= 20],
    ["npm", commandAvailable(npmRunner.command, [...npmRunner.prefix, "--version"])],
    ["Git", commandAvailable(gitCommand)],
    ["Python 3", Boolean(findPython())],
    ["apps/package-lock.json", existsSync(path.join(appDir, "package-lock.json"))],
    ["apps/.env.sample", existsSync(sampleEnvPath)],
    ["apps/.env.local", existsSync(localEnvPath)],
  ]
  for (const [label, passed] of checks) {
    console.log(`${passed ? "✓" : "○"} ${label}`)
  }
  return checks.slice(0, 6).every(([, passed]) => passed)
}

async function main() {
  console.log("\nPlanora guided setup\n")
  if (checkOnly) {
    process.exitCode = printCheck() ? 0 : 1
    return
  }

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error("Guided setup requires an interactive terminal. Run `npm run setup` directly in a terminal window.")
  }
  if (!printCheck()) {
    throw new Error("Install the missing prerequisites, then run `npm run setup` again. See docs/01-prerequisites.md.")
  }

  const prompt = readline.createInterface({ input: process.stdin, output: process.stdout })
  try {
    const gitState = spawnSync(gitCommand, ["rev-parse", "--is-inside-work-tree"], {
      cwd: root,
      stdio: "ignore",
    })
    if (gitState.status !== 0) {
      const initializeGit = await prompt.question("Initialize a Git repository here? [Y/n] ")
      if (!/^n/i.test(initializeGit.trim())) run(gitCommand, ["init"])
    }

    console.log("\nInstalling application dependencies with npm ci...")
    runNpm(["--prefix", "apps", "ci"])

    if (!existsSync(localEnvPath)) {
      copyFileSync(sampleEnvPath, localEnvPath)
      console.log("Created apps/.env.local from the safe sample.")
    } else {
      console.log("Preserving the existing apps/.env.local file.")
    }

    console.log("\nChoose authentication methods:")
    console.log("  1. Google + email/password (recommended)")
    console.log("  2. Google only")
    console.log("  3. Email/password only")
    const authChoice = (await prompt.question("Selection [1]: ")).trim() || "1"
    if (!["1", "2", "3"].includes(authChoice)) throw new Error("Authentication selection must be 1, 2, or 3.")
    const googleEnabled = authChoice !== "3"
    const emailEnabled = authChoice !== "2"

    updateEnv(localEnvPath, {
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      NEXT_PUBLIC_GOOGLE_AUTH_ENABLED: String(googleEnabled),
      NEXT_PUBLIC_EMAIL_PASSWORD_AUTH_ENABLED: String(emailEnabled),
      E2E_EMAIL_PASSWORD_AUTH_ENABLED: "false",
    })

    const configureConvex = await prompt.question("\nCreate or select a Convex development project now? [Y/n] ")
    if (/^n/i.test(configureConvex.trim())) {
      console.log("Skipped Convex configuration. Resume later with `npm run convex:init` and docs/03-convex.md.")
      return
    }

    console.log("\nConvex will create or select a development project and attempt its first sync.")
    const configurationResult = runNpmForConvexConfiguration([
      "--prefix",
      "apps",
      "run",
      "convex:init",
    ])
    const configured = readEnv(localEnvPath)
    if (!configured.CONVEX_DEPLOYMENT || !configured.NEXT_PUBLIC_CONVEX_URL) {
      throw new Error(
        "Convex did not write a development deployment to apps/.env.local. Complete the CLI login or project selection, then rerun setup."
      )
    }
    if (configurationResult.status !== 0) {
      console.log(
        "The initial sync did not finish. This is expected when the new deployment still needs authentication environment variables; setup will configure them now."
      )
    }
    const deployment = configured.CONVEX_DEPLOYMENT || "personal development deployment"
    const convexUrl = configured.NEXT_PUBLIC_CONVEX_URL || ""
    let convexSiteUrl = convexUrl.endsWith(".convex.cloud")
      ? convexUrl.replace(/\.convex\.cloud$/, ".convex.site")
      : configured.NEXT_PUBLIC_CONVEX_SITE_URL || ""
    if (!convexSiteUrl) {
      convexSiteUrl = (
        await prompt.question("Convex HTTP Actions URL (usually ends in .convex.site): ")
      ).trim()
    }
    if (!convexSiteUrl) throw new Error("NEXT_PUBLIC_CONVEX_SITE_URL is required.")
    updateEnv(localEnvPath, { NEXT_PUBLIC_CONVEX_SITE_URL: convexSiteUrl })
    console.log(`\nTarget: development (${deployment}).`)

    const secret = randomBytes(32).toString("base64url")
    setConvexEnv("BETTER_AUTH_SECRET", secret)
    setConvexEnv("SITE_URL", "http://localhost:3000")
    setConvexEnv("GOOGLE_AUTH_ENABLED", String(googleEnabled))
    setConvexEnv("EMAIL_PASSWORD_AUTH_ENABLED", String(emailEnabled))
    setConvexEnv("E2E_EMAIL_PASSWORD_AUTH_ENABLED", "false")

    if (googleEnabled) {
      console.log("\nGoogle OAuth is recommended and selected.")
      console.log("Create a Web OAuth client using the redirect URI documented in docs/04-authentication.md.")
      const clientId = (await prompt.question("Google Client ID: ")).trim()
      if (!clientId) throw new Error("Google Client ID is required for the selected authentication mode.")
      setConvexEnv("GOOGLE_CLIENT_ID", clientId)
      setConvexEnvInteractively("GOOGLE_CLIENT_SECRET")
    }

    const pushNow = await prompt.question("\nPush the starter functions to this development deployment now? [Y/n] ")
    if (!/^n/i.test(pushNow.trim())) {
      console.log(`Target: development (${deployment}). Running convex dev --once.`)
      runNpm(["--prefix", "apps", "exec", "--", "convex", "dev", "--once"])
    }

    console.log("\nSetup complete.")
    console.log("Run `npm run dev`, then open http://localhost:3000.")
    console.log("Start product planning with `/planora-product-kit`.")
  } finally {
    prompt.close()
  }
}

main().catch((error) => {
  console.error(`\nSetup stopped: ${error.message}`)
  process.exitCode = 1
})
