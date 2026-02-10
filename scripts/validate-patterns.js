/**
 * Validate the ad detection pattern configuration file format.
 */

const fs = require("fs");
const path = require("path");

const patternsPath = path.join(
  __dirname, "..", "src", "patterns", "ad-patterns.json"
);

try {
  const raw = fs.readFileSync(patternsPath, "utf-8");
  const patterns = JSON.parse(raw);

  const errors = [];

  // Verify required top-level fields are present.
  const required = ["version", "text_indicators", "selector_patterns"];
  required.forEach((field) => {
    if (!patterns[field]) errors.push(`Missing required field: ${field}`);
  });

  // Verify text indicators is a non-empty array of strings.
  if (Array.isArray(patterns.text_indicators)) {
    if (patterns.text_indicators.length === 0) {
      errors.push("text_indicators must not be empty");
    }
    patterns.text_indicators.forEach((t, i) => {
      if (typeof t !== "string") {
        errors.push(`text_indicators[${i}] must be a string`);
      }
    });
  }

  // Verify each selector pattern is a valid CSS-like selector string.
  if (Array.isArray(patterns.selector_patterns)) {
    patterns.selector_patterns.forEach((s, i) => {
      if (typeof s !== "string") {
        errors.push(`selector_patterns[${i}] must be a string`);
      }
      if (!s.startsWith("[") && !s.startsWith(".") && !s.startsWith("#")) {
        errors.push(
          `selector_patterns[${i}] looks invalid: "${s}" (expected CSS selector)`
        );
      }
    });
  }

  if (errors.length > 0) {
    console.error("Pattern validation FAILED:");
    errors.forEach((e) => console.error(`  ✕ ${e}`));
    process.exit(1);
  }

  console.log("Pattern validation passed.");
} catch (e) {
  console.error(`Failed to read patterns config: ${e.message}`);
  process.exit(1);
}
