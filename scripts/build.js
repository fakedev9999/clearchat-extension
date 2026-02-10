/**
 * Build script for ClearChat extension.
 * Copies source files to the dist directory and injects pattern config version.
 */

const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..", "src");
const DIST = path.join(__dirname, "..", "dist", "extension");

// Clean and recreate the dist directory.
if (fs.existsSync(DIST)) {
  fs.rmSync(DIST, { recursive: true });
}
fs.mkdirSync(DIST, { recursive: true });
fs.mkdirSync(path.join(DIST, "icons"), { recursive: true });

// Define the files to copy from source to distribution.
const FILES = [
  "manifest.json",
  "content.js",
  "content.css",
  "background.js",
  "popup.html",
  "popup.js",
];

const ICONS = ["icon16.png", "icon48.png", "icon128.png"];

// Copy each source file to the dist directory.
FILES.forEach((file) => {
  const src = path.join(SRC, file);
  const dest = path.join(DIST, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`  Copied: ${file}`);
  } else {
    console.warn(`  Warning: ${file} not found in src/`);
  }
});

// Copy icon files to the dist/icons directory.
ICONS.forEach((icon) => {
  const src = path.join(SRC, "icons", icon);
  const dest = path.join(DIST, "icons", icon);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`  Copied: icons/${icon}`);
  }
});

// Copy the pattern config for bundling.
const patternsrc = path.join(SRC, "patterns", "ad-patterns.json");
if (fs.existsSync(patternsrc)) {
  fs.copyFileSync(patternsrc, path.join(DIST, "ad-patterns.json"));
  console.log("  Copied: ad-patterns.json");
}

console.log("\nBuild complete. Output: dist/extension/");
