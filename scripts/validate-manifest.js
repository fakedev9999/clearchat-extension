/**
 * Validate the Chrome extension manifest.json for required fields and correct schema.
 */

const fs = require("fs");
const path = require("path");

const manifestPath = path.join(__dirname, "..", "src", "manifest.json");

try {
  const raw = fs.readFileSync(manifestPath, "utf-8");
  const manifest = JSON.parse(raw);

  const errors = [];

  // Check all required fields exist.
  const required = ["manifest_version", "name", "version", "description"];
  required.forEach((field) => {
    if (!manifest[field]) errors.push(`Missing required field: ${field}`);
  });

  // Validate manifest version is 3.
  if (manifest.manifest_version !== 3) {
    errors.push(`manifest_version must be 3, got ${manifest.manifest_version}`);
  }

  // Validate version format matches semver pattern.
  if (manifest.version && !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
    errors.push(`Invalid version format: ${manifest.version} (expected x.y.z)`);
  }

  // Validate content scripts target correct domains.
  if (manifest.content_scripts) {
    const matches = manifest.content_scripts.flatMap((cs) => cs.matches || []);
    const hasChatGPT = matches.some(
      (m) => m.includes("chat.openai.com") || m.includes("chatgpt.com")
    );
    if (!hasChatGPT) {
      errors.push("content_scripts must match chat.openai.com or chatgpt.com");
    }
  }

  if (errors.length > 0) {
    console.error("Manifest validation FAILED:");
    errors.forEach((e) => console.error(`  ✕ ${e}`));
    process.exit(1);
  }

  console.log("Manifest validation passed.");
} catch (e) {
  console.error(`Failed to read manifest.json: ${e.message}`);
  process.exit(1);
}
