#!/usr/bin/env node
/*
 * One-command release.
 *
 * Set the target version in package.json, commit your work, then run this. It:
 *   1. refuses a dirty tree or an already-existing tag
 *   2. runs the full CI gate (build, typecheck, lint, test)
 *   3. generates the CHANGELOG with gitmoji-changelog
 *   4. verifies the exact tarball npm would publish
 *   5. asks for an explicit "yes", then commits ":bookmark: Release vX.Y.Z",
 *      tags it, publishes to npm, and pushes the branch + tag
 *
 * The 2FA one-time password is asked LAST, right before `npm publish`, so a
 * time-based code is still valid. Nothing is committed, published or pushed
 * without confirmation.
 *
 *   node scripts/release.js            # full release
 *   node scripts/release.js --dry-run  # gates + changelog + pack, then revert; no writes
 *   node scripts/release.js --no-push  # release but leave pushing to you
 *   node scripts/release.js --yes --otp=123456   # non-interactive (CI)
 */
"use strict";

const { execSync } = require("child_process");
const readline = require("readline");
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const cliOtp = (args.find((a) => a.startsWith("--otp=")) || "").split("=")[1];
const skipConfirm = args.includes("--yes");
const dryRunOnly = args.includes("--dry-run");
const noPush = args.includes("--no-push");

const root = path.join(__dirname, "..");

function run(cmd) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd: root });
}
function capture(cmd) {
  return execSync(cmd, { encoding: "utf8", cwd: root });
}
function fail(msg) {
  console.error(`\n✖ ${msg}`);
  process.exit(1);
}
function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}
function tagExists(tag) {
  try {
    capture(`git rev-parse --verify --quiet refs/tags/${tag}`);
    return true;
  } catch (_) {
    return false;
  }
}
function revertChangelog() {
  try {
    run("git checkout -- CHANGELOG.md");
  } catch (_) {
    /* nothing to revert */
  }
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const version = pkg.version;
const tag = `v${version}`;
const branch = capture("git rev-parse --abbrev-ref HEAD").trim();

console.log(`→ Releasing ${pkg.name}@${version} (tag ${tag}, branch ${branch})`);

// 1. Preconditions.
if (capture("git status --porcelain").trim()) {
  fail("Working tree is not clean — commit or stash your changes first.");
}
if (tagExists(tag)) {
  fail(`Tag ${tag} already exists — bump the version in package.json first.`);
}

// 2. Full CI gate.
run("npm run build");
run("npm run typecheck");
run("npm run lint");
run("npm test");

// 3. Changelog (reads the version from package.json), then assert it is sane so
//    we never publish an empty or mis-versioned changelog.
run("npx gitmoji-changelog");
const changelogDiff = capture("git diff -- CHANGELOG.md");
if (!changelogDiff.trim()) {
  fail("gitmoji-changelog produced no changes to CHANGELOG.md.");
}
if (
  !changelogDiff.includes(`name="${version}"`) &&
  !changelogDiff.includes(`## ${version} `)
) {
  revertChangelog();
  fail(`CHANGELOG.md has no section for ${version} after generation.`);
}
const MIN_CHANGELOG_ENTRIES = 1;
const changelogEntries = (changelogDiff.match(/^\+- /gm) || []).length;
if (changelogEntries < MIN_CHANGELOG_ENTRIES) {
  revertChangelog();
  fail(
    `CHANGELOG.md has ${changelogEntries} entr${changelogEntries === 1 ? "y" : "ies"} for ${version}, expected at least ${MIN_CHANGELOG_ENTRIES}.`,
  );
}
console.log(
  `✔ CHANGELOG ${version}: ${changelogEntries} entr${changelogEntries === 1 ? "y" : "ies"}`,
);

// 4. Verify the tarball contents (fresh dist was just built above).
const meta = JSON.parse(capture("npm pack --dry-run --json"))[0];
const paths = meta.files.map((f) => f.path);
const required = [
  "dist/index.js",
  "dist/index.d.ts",
  "dist/main.js",
  "dist/screenshot.js",
  "dist/models/Screenshot.js",
];
const missing = required.filter((r) => !paths.includes(r));
if (missing.length) fail(`Tarball is missing required files: ${missing.join(", ")}`);
const leaked = paths.filter(
  (p) => p.startsWith("src/") || p.includes(".spec.") || p.endsWith(".tsbuildinfo"),
);
if (leaked.length) fail(`Tarball would publish files it should not: ${leaked.join(", ")}`);
console.log(
  `\n✔ Package looks correct: ${meta.entryCount} files, ${(meta.size / 1024).toFixed(1)} kB packed`,
);

if (dryRunOnly) {
  revertChangelog();
  console.log("\n--dry-run: reverted CHANGELOG.md. Nothing committed, published or pushed.");
  process.exit(0);
}

async function main() {
  // 5. Confirm the whole irreversible sequence.
  if (!skipConfirm) {
    console.log("\nAbout to:");
    console.log(`  1. commit ":bookmark: Release ${tag}" (CHANGELOG.md)`);
    console.log(`  2. tag ${tag}`);
    console.log(`  3. npm publish ${pkg.name}@${version}`);
    console.log(noPush ? "  4. (push skipped: --no-push)" : `  4. push ${branch} and ${tag} to origin`);
    const answer = await prompt(`\nProceed? Type "yes" to confirm: `);
    if (answer.toLowerCase() !== "yes") {
      revertChangelog();
      console.log("Aborted. CHANGELOG.md reverted, nothing published.");
      process.exit(0);
    }
  }

  // 6. Commit + tag locally (still reversible if publish fails).
  run("git add CHANGELOG.md package.json");
  run(`git commit -m ":bookmark: Release ${tag}"`);
  run(`git tag ${tag}`);

  // 7. OTP asked here, as the very last step, so the code does not expire.
  let otp = cliOtp;
  if (!otp && !skipConfirm) {
    otp = await prompt(
      "Enter your npm one-time password (2FA), or leave empty if 2FA is off: ",
    );
  }
  run(`npm publish${otp ? ` --otp=${otp}` : ""}`);

  // 8. Push only after a successful publish.
  if (!noPush) {
    run(`git push origin ${branch}`);
    run(`git push origin ${tag}`);
  }

  console.log(`\n✅ Released ${pkg.name}@${version}`);
  if (noPush) console.log(`   Remember to push: git push origin ${branch} && git push origin ${tag}`);
}

main();
