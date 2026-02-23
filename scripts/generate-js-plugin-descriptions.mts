import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { jsPluginConfigs } from "../src/shared/js-plugin-configs.mts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generateJSPluginDescriptions() {
  console.log("Generating JS Plugin rule descriptions...");

  const descriptions: Record<string, Record<string, string>> = {};

  for (const plugin of jsPluginConfigs) {
    try {
      console.log(`Processing ${plugin.name}...`);

      // Dynamic import of the plugin
      const pluginModule = await import(plugin.packageName);
      const pluginExport = pluginModule.default || pluginModule;

      // Get plugin rules
      const rules = pluginExport.rules || {};

      const pluginDescriptions: Record<string, string> = {};

      // Process each rule
      for (const [ruleName, ruleConfig] of Object.entries(rules)) {
        const rule = ruleConfig as {
          meta?: {
            docs?: { description?: string };
          };
        };

        const description = rule.meta?.docs?.description;
        if (description && typeof description === "string" && description.trim().length > 0) {
          pluginDescriptions[ruleName] = description.trim();
        }
      }

      if (Object.keys(pluginDescriptions).length > 0) {
        descriptions[plugin.rulePrefix] = pluginDescriptions;
      }

      const descCount = Object.keys(pluginDescriptions).length;
      const totalRules = Object.keys(rules).length;
      console.log(`  ✓ ${plugin.name}: ${descCount}/${totalRules} rules have descriptions`);
    } catch (error) {
      console.error(`  ✗ Error processing ${plugin.name}:`, error);
    }
  }

  // Sort plugins and rules within each plugin alphabetically
  const sortedDescriptions: Record<string, Record<string, string>> = {};
  for (const key of Object.keys(descriptions).sort((a, b) => a.localeCompare(b))) {
    sortedDescriptions[key] = Object.fromEntries(
      Object.entries(descriptions[key]).sort(([a], [b]) => a.localeCompare(b)),
    );
  }

  // Write to file
  const outputDir = join(__dirname, "..", "data");
  const outputPath = join(outputDir, "js-plugin-descriptions.json");
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(outputPath, JSON.stringify(sortedDescriptions, null, 2));

  console.log(`\n✓ JS Plugin descriptions saved to ${outputPath}`);
  console.log(`  Total plugins: ${Object.keys(descriptions).length}`);
}

await generateJSPluginDescriptions();
