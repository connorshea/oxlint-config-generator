import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const RULES_URL =
  "https://raw.githubusercontent.com/oxc-project/website/main/.vitepress/data/rules.json";

async function fetchRules() {
  console.log("Fetching rules.json from oxc/website repository...");

  try {
    const response = await fetch(RULES_URL);

    if (!response.ok) {
      throw new Error(`Failed to fetch rules: ${response.statusText}`);
    }

    const rules = await response.json();

    // Sort rules alphabetically by scope, then by value (rule name)
    rules.sort((a: { scope: string; value: string }, b: { scope: string; value: string }) => {
      const scopeCompare = a.scope.localeCompare(b.scope);
      if (scopeCompare !== 0) return scopeCompare;
      return a.value.localeCompare(b.value);
    });

    // Ensure data directory exists
    const dataDir = join(__dirname, "..", "data");
    mkdirSync(dataDir, { recursive: true });

    // Write rules to file
    const outputPath = join(dataDir, "rules.json");
    writeFileSync(outputPath, JSON.stringify(rules, null, 2));

    console.log(`✓ Rules saved to ${outputPath}`);
    console.log(`  Total rules: ${rules.length}`);
  } catch (error) {
    console.error("Error fetching rules:", error);
    throw error;
  }
}

fetchRules();
