/**
 * Release script for ClearChat extension.
 * Usage: node scripts/release.js [patch|minor|major]
 *
 * This script bumps the version in both package.json and manifest.json,
 * commits the change, creates a git tag, and pushes to trigger the CI/CD deploy.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const bumpType = process.argv[2] || "patch";
if (!["patch", "minor", "major"].includes(bumpType)) {
  console.error("Usage: node scripts/release.js [patch|minor|major]");
  process.exit(1);
}

// Read and parse the current version from package.json.
const pkgPath = path.join(__dirname, "..", "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
const [major, minor, patch] = pkg.version.split(".").map(Number);

// Calculate the new version based on the bump type.
let newVersion;
switch (bumpType) {
  case "major":
    newVersion = `${major + 1}.0.0`;
    break;
  case "minor":
    newVersion = `${major}.${minor + 1}.0`;
    break;
  case "patch":
    newVersion = `${major}.${minor}.${patch + 1}`;
    break;
}

console.log(`Bumping version: ${pkg.version} → ${newVersion} (${bumpType})`);

// Update the version in package.json.
pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

// Update the version in manifest.json to keep them synchronized.
const manifestPath = path.join(__dirname, "..", "src", "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
manifest.version = newVersion;
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

console.log("Updated package.json and manifest.json.");

// Run the build and package steps before releasing.
console.log("Building and packaging...");
execSync("npm run build && npm run package", { stdio: "inherit" });

// Create the git commit and tag for the release.
console.log("Creating git commit and tag...");
execSync(`git add -A`, { stdio: "inherit" });
execSync(`git commit -m "release: v${newVersion}"`, { stdio: "inherit" });
execSync(`git tag v${newVersion}`, { stdio: "inherit" });

console.log(`\nRelease v${newVersion} ready.`);
console.log("Run the following command to push and trigger deployment:");
console.log(`  git push origin main --tags`);
