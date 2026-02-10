/**
 * Package script for ClearChat extension.
 * Creates a zip archive from the dist/extension directory for store upload.
 */

const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

const DIST = path.join(__dirname, "..", "dist", "extension");
const OUTPUT = path.join(__dirname, "..", "dist", "clearchat-extension.zip");

// Ensure the dist directory exists before packaging.
if (!fs.existsSync(DIST)) {
  console.error("Error: dist/extension/ not found. Run 'npm run build' first.");
  process.exit(1);
}

const output = fs.createWriteStream(OUTPUT);
const archive = archiver("zip", { zlib: { level: 9 } });

output.on("close", () => {
  const sizeKB = (archive.pointer() / 1024).toFixed(1);
  console.log(`Package created: dist/clearchat-extension.zip (${sizeKB} KB)`);
});

archive.on("error", (err) => {
  throw err;
});

archive.pipe(output);
archive.directory(DIST, false);
archive.finalize();
