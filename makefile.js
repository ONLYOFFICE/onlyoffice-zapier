#!/usr/bin/env node

// @ts-check
/**
 * @typedef {import("node:readline").Interface} Interface
 */

const { execSync } = require("node:child_process")
const { log, warn, error } = require("node:console")
const { writeFile, readFile, rm, copyFile } = require("node:fs/promises")
const { existsSync } = require("node:fs")
const { join } = require("node:path")
const { createInterface } = require("node:readline")
const { argv, chdir, env, exit, stdin, stdout } = require("node:process")
const { build } = require("esbuild")
const sade = require("sade")
const pack = require("./package.json")

const root = __dirname
const dist = join(root, "dist")
const app = sade("./makefile.js")

/**
 * @typedef {Object} Version
 * @property {string} Version
 * @property {string} Deployment
 */

/**
 * @param {string} command
 * @returns {string}
 */
function exec(command) {
  return execSync(command, { encoding: "utf-8", stdio: "inherit" })
}

/**
 * @param {Interface} line
 * @param {string} message
 * @returns {Promise<string>}
 */
function question(line, message) {
  return new Promise(resolve => {
    line.question(message, resolve)
  })
}

/**
 * @param {string} directory
 * @returns {Promise<void>}
 */
async function clearDirectory(directory) {
  if (existsSync(directory)) {
    await rm(directory, { recursive: true, force: true })
  }
}

/**
 * @param {string} input
 * @param {string} output
 * @returns {Promise<void>}
 */
async function buildEntry(input, output) {
  const entry = join(input, "index.js")
  await build({
    bundle: true,
    entryPoints: [entry],
    external: ["zapier-platform-core"],
    minify: true,
    outdir: output,
    platform: "node",
    target: "node18"
  })
}

/**
 * @param {typeof pack} pack
 * @param {string} directory
 * @returns {Promise<void>}
 */
async function buildPackage(pack, directory) {
  const object = {
    name: pack.name,
    version: pack.version,
    type: pack.type,
    main: pack.main,
    dependencies: {
      "zapier-platform-core": pack.dependencies["zapier-platform-core"]
    }
  }
  const content = JSON.stringify(object, undefined, 2)
  const file = join(directory, "package.json")
  await writeFile(file, content)
}

/**
 * @param {string} directory
 * @returns {Promise<void>}
 */
async function loadEnvironment(directory) {
  const variables = [
    "DOC_SPACE_BASE_URL",
    "DOC_SPACE_USERNAME",
    "DOC_SPACE_PASSWORD",
    "ZAPIER_DEPLOY_KEY"
  ]

  const file = join(directory, ".env")
  if (!existsSync(file)) {
    log("info: loading environment variables from the process")
    variables.forEach((key) => {
      const value = env[key]
      if (!value) {
        warn(`warn: the ${key} isn't set or has an empty value`)
        return
      }
    })
    return
  }

  log("info: loading environment variables from the dot file")
  const content = await readFile(file, { encoding: "utf-8" })
  variables.forEach((key) => {
    const pattern = new RegExp(`^${key}=([\\S\\s]*?)$`, "m")
    const result = content.match(pattern)
    if (!result) {
      warn(`warn: the ${key} isn't set or has an empty value`)
      return
    }
    const [, value] = result
    if (!value) {
      warn(`warn: the ${key} isn't set or has an empty value`)
      return
    }
    env[key] = value
  })
}

/**
 * @param {string} directory
 * @returns {Promise<string>}
 */
async function generateNotes(directory) {
  const file = join(directory, "CHANGELOG.md")
  const content = await readFile(file, { encoding: "utf-8" })
  const version = pack.version.replace(/\./g, "\\.")
  const pattern = new RegExp(`^## ${version} \\(\\d{4}-\\d{2}-\\d{2}\\)([\\S\\s](?!(?:##)))*$`, "m")
  const result = content.match(pattern)
  if (!result) {
    return ""
  }
  const [notes] = result
  if (!notes) {
    return ""
  }
  return notes
}

/**
 * @param {string} input
 * @param {string} output
 * @returns {Promise<void>}
 */
async function copyMeta(input, output) {
  const from = join(input, ".zapierapprc")
  const to = join(output, ".zapierapprc")
  await copyFile(from, to)
}

app
  .command("all")
  .describe("Run an audit of the app and then build it")
  .action(() => {
    exec("pnpm check")
    exec("pnpm lint")
    exec("pnpm tt")
    exec("pnpm build")
  })

app
  .command("build")
  .describe("Build the app")
  .action(async () => {
    await clearDirectory(dist)
    await buildEntry(root, dist)
    await buildPackage(pack, dist)
    await copyMeta(root, dist)
    chdir(dist)
    // We don't use the `--frozen-lockfile` option here because we assume that
    // all dependencies, except for the `zapier-platform-core`, have already
    // been bundled.
    exec("pnpm install --prod")
    exec("zapier build")
  })

app
  .command("install-lefthook")
  .describe("Install Lefthook locally using pnpm")
  .action(() => {
    exec("pnpm lefthook install")
  })

app
  .command("install-zapier")
  .describe("Install Zapier CLI globally using pnpm")
  .action(() => {
    const version = pack.dependencies["zapier-platform-core"]
    exec(`pnpm install --global "zapier-platform-cli@${version}"`)
  })

app
  .command("promote")
  .describe("Promote the current version of the app")
  .action(() => {
    exec(`zapier promote ${pack.version} --yes`)
  })

app
  .command("release")
  .describe("Release the current version of the app")
  .action(async () => {
    const notes = await generateNotes(root)
    exec(`gh release create "${pack.version}" --notes "${notes}"`)

    const build = join(dist, "build/build.zip")
    const source = join(dist, "build/source.zip")
    exec(`gh release upload "${pack.version}" "${build}" "${source}"`)
  })

app
  .command("setup-env")
  .describe("Setup environment dot file")
  .action(async () => {
    const line = createInterface({
      input: stdin,
      output: stdout
    })
    /* eslint-disable @stylistic/max-len */
    const DOC_SPACE_BASE_URL = await question(line, "The base URL of DocSpace for testing purposes (DOC_SPACE_BASE_URL): ")
    const DOC_SPACE_USERNAME = await question(line, "The username of DocSpace user for testing purposes (DOC_SPACE_USERNAME): ")
    const DOC_SPACE_PASSWORD = await question(line, "The password of DocSpace user for testing purposes (DOC_SPACE_PASSWORD): ")
    const ZAPIER_DEPLOY_KEY = await question(line, "The deploy key from developer.zapier.com for testing purposes (ZAPIER_DEPLOY_KEY): ")
    /* eslint-enable @stylistic/max-len */
    line.close()
    const file = join(root, ".env")
    const content =
      `DOC_SPACE_BASE_URL=${DOC_SPACE_BASE_URL}\n` +
      `DOC_SPACE_USERNAME=${DOC_SPACE_USERNAME}\n` +
      `DOC_SPACE_PASSWORD=${DOC_SPACE_PASSWORD}\n` +
      `ZAPIER_DEPLOY_KEY=${ZAPIER_DEPLOY_KEY}`
    await writeFile(file, content)
  })

app
  .command("tt")
  .describe("Run validation with tests")
  .action(async () => {
    await loadEnvironment(root)
    exec("zapier test")
  })

app
  .command("upload")
  .describe("Upload the current version of the app")
  .option("--force")
  .action((options) => {
    if (!options.force) {
      const rawVersions = execSync("zapier versions --format json", { encoding: "utf-8" })
      /** @type {Version[]} */
      const versions = JSON.parse(rawVersions)
      const current = versions.find((version) => (
        version.Version === pack.version
      ))
      if (current) {
        warn(`warn: the app version ${pack.version} has already been uploaded`)
        if (current.Deployment !== "non-production") {
          error(`error: the app version ${pack.version} has already been promoted`)
          exit(1)
        }
      }
    }

    chdir(dist)
    exec("zapier upload")
  })

app.parse(argv)
