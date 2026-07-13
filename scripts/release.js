#!/usr/bin/env node
/*
 * One-command release.
 *
 * Set the target version in package.json, commit your work, then run this. It:
 *   1. refuses a dirty tree, an existing tag, or a missing npm login
 *   2. runs the full CI gate (build, typecheck, lint, test)
 *   3. generates the CHANGELOG with gitmoji-changelog and checks it is sane
 *   4. verifies the exact tarball npm would publish
 *   5. after an explicit "yes": commits ":bookmark: Release vX.Y.Z", tags it,
 *      publishes to npm, pushes the branch + tag, and creates a GitHub release
 *      whose notes are that version's changelog section
 *
 * npm login is checked BEFORE anything is committed, so an auth problem can no
 * longer leave a release commit/tag behind. If `npm publish` still fails, the
 * commit and tag are rolled back automatically. The 2FA one-time password is
 * asked LAST, right before publishing, so a time-based code stays valid.
 *
 *   node scripts/release.js               # full release
 *   node scripts/release.js --dry-run     # gates + changelog + pack, then revert
 *   node scripts/release.js --no-push     # release but leave pushing to you
 *   node scripts/release.js --no-github-release
 *   node scripts/release.js --yes --otp=123456   # non-interactive (CI)
 */
"use strict";

const { execSync } = require("child_process");
const readline = require("readline");
const fs = require("fs");
const os = require("os");
const path = require("path");

const args = process.argv.slice(2);
const cliOtp = (args.find((a) => a.startsWith("--otp=")) || "").split("=")[1];
const skipConfirm = args.includes("--yes");
const dryRunOnly = args.includes("--dry-run");
const noPush = args.includes("--no-push");
const noGithubRelease = args.includes("--no-github-release");

const root = path.join(__dirname, "..");

function run(cmd) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd: root });
}
function capture(cmd) {
  return execSync(cmd, { encoding: "utf8", cwd: root, stdio: ["pipe", "pipe", "ignore"] });
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
// The changelog section for one version, used as the GitHub release notes.
function changelogSection(version) {
  const cl = fs.readFileSync(path.join(root, "CHANGELOG.md"), "utf8");
  const anchor = `<a name="${version}"></a>`;
  const start = cl.indexOf(anchor);
  if (start === -1) return null;
  const rest = cl.slice(start + anchor.length);
  const next = rest.indexOf('<a name="');
  return (next === -1 ? rest : rest.slice(0, next)).trim();
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const version = pkg.version;
const tag = `v${version}`;
const branch = capture("git rev-parse --abbrev-ref HEAD").trim();

console.log(`→ Releasing ${pkg.name}@${version} (tag ${tag}, branch ${branch})`);

// 1. Preconditions — everything that could block the publish is checked BEFORE
//    any git mutation, so a failure never leaves a half-made release behind.
if (capture("git status --porcelain").trim()) {
  fail("Working tree is not clean — commit or stash your changes first.");
}
if (tagExists(tag)) {
  fail(`Tag ${tag} already exists — bump the version in package.json first.`);
}
if (!dryRunOnly) {
  try {
    capture("npm whoami");
  } catch (_) {
    fail("Not logged in to npm — run `npm login` first.");
  }
}

// GitHub release capability is optional: warn and skip if gh is missing.
let canGithubRelease = false;
if (!noGithubRelease && !dryRunOnly) {
  try {
    capture("gh auth status");
    canGithubRelease = true;
  } catch (_) {
    console.log("⚠ gh CLI missing or not authenticated — GitHub release will be skipped.");
  }
}

// 2. Full CI gate.
run("npm run build");
run("npm run typecheck");
run("npm run lint");
run("npm test");

// 3. Changelog, then assert it is sane so we never publish an empty or
//    mis-versioned changelog.
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
    console.log(canGithubRelease ? `  5. create GitHub release ${tag}` : "  5. (GitHub release skipped)");
    const answer = await prompt(`\nProceed? Type "yes" to confirm: `);
    if (answer.toLowerCase() !== "yes") {
      revertChangelog();
      console.log("Aborted. CHANGELOG.md reverted, nothing published.");
      process.exit(0);
    }
  }

  // 6. Commit + tag locally.
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

  // 8. Publish. If it fails, undo the commit + tag so the tree is clean to retry.
  try {
    run(`npm publish${otp ? ` --otp=${otp}` : ""}`);
  } catch (_) {
    console.error("\n✖ npm publish failed — rolling back the local commit and tag.");
    try {
      run(`git tag -d ${tag}`);
      run("git reset --hard HEAD~1");
    } catch (_e) {
      /* leave it for manual inspection */
    }
    process.exit(1);
  }

  // 9. Push only after a successful publish.
  if (!noPush) {
    run(`git push origin ${branch}`);
    run(`git push origin ${tag}`);
  }

  // 10. GitHub release, notes = this version's changelog section.
  if (canGithubRelease && !noPush) {
    const notes = changelogSection(version);
    if (notes) {
      const notesPath = path.join(os.tmpdir(), `release-notes-${version}.md`);
      fs.writeFileSync(notesPath, notes);
      run(`gh release create ${tag} --title ${tag} --notes-file "${notesPath}"`);
      fs.unlinkSync(notesPath);
    } else {
      console.log("⚠ Could not extract the changelog section — skipping GitHub release.");
    }
  } else if (canGithubRelease && noPush) {
    console.log("ℹ GitHub release skipped because --no-push (the tag was not pushed).");
  }

  console.log(`\n✅ Released ${pkg.name}@${version}`);
  if (noPush) console.log(`   Remember to push: git push origin ${branch} && git push origin ${tag}`);
}

main();
