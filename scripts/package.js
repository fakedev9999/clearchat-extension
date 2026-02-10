/**
 * Package script for ClearChat extension.
 * Creates a zip archive from the dist/extension directory for store upload.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const DIST = path.join(__dirname, "..", "dist", "extension");
const OUTPUT = path.join(__dirname, "..", "dist", "clearchat-extension.zip");

// Ensure the dist directory exists before packaging.
if (!fs.existsSync(DIST)) {
  console.error("Error: dist/extension/ not found. Run 'npm run build' first.");
  process.exit(1);
}

// Remove old zip if it exists.
if (fs.existsSync(OUTPUT)) {
  fs.unlinkSync(OUTPUT);
}

execSync(`cd "${DIST}" && zip -r "${OUTPUT}" .`, { stdio: "pipe" });

const sizeKB = (fs.statSync(OUTPUT).size / 1024).toFixed(1);
console.log(`Package created: dist/clearchat-extension.zip (${sizeKB} KB)`);
