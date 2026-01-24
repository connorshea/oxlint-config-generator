import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface PluginConfig {
  name: string;
  packageName: string;
  configName?: string;
}

const plugins: PluginConfig[] = [
  { name: "react", packageName: "eslint-plugin-react" },
  { name: "react-perf", packageName: "eslint-plugin-react-perf" },
  { name: "jsx-a11y", packageName: "eslint-plugin-jsx-a11y" },
  { name: "import", packageName: "eslint-plugin-import" },
  { name: "jsdoc", packageName: "eslint-plugin-jsdoc" },
  { name: "jest", packageName: "eslint-plugin-jest" },
  { name: "vitest", packageName: "eslint-plugin-vitest" },
  { name: "unicorn", packageName: "eslint-plugin-unicorn" },
  { name: "typescript", packageName: "@typescript-eslint/eslint-plugin" },
  { name: "vue", packageName: "eslint-plugin-vue" },
  { name: "next", packageName: "@next/eslint-plugin-next" },
  { name: "promise", packageName: "eslint-plugin-promise" },
  { name: "node", packageName: "eslint-plugin-n" },
];

async function generatePluginData() {
  console.log("Generating ESLint plugin data...");

  const dataDir = join(__dirname, "..", "data", "plugins");
  mkdirSync(dataDir, { recursive: true });

  for (const plugin of plugins) {
    try {
      console.log(`Processing ${plugin.name}...`);

      // Dynamic import of the plugin
      const pluginModule = await import(plugin.packageName);
      const pluginExport = pluginModule.default || pluginModule;

      const pluginData: {
        name: string;
        rules: Record<string, { recommended: boolean; fixable: boolean }>;
        recommendedConfig?: Record<string, unknown>;
      } = {
        name: plugin.name,
        rules: {},
      };

      // Get plugin rules
      const rules = pluginExport.rules || {};

      // Try to get recommended config first
      const configs = pluginExport.configs || {};
      let recommendedRules: Record<string, unknown> = {};

      // Check various config formats
      if (configs.recommended?.rules) {
        recommendedRules = configs.recommended.rules;
      } else if (configs["flat/recommended"]?.rules) {
        recommendedRules = configs["flat/recommended"].rules;
      } else if (Array.isArray(configs["flat/recommended"])) {
        // Some plugins use array format for flat config
        for (const configItem of configs["flat/recommended"]) {
          if (configItem?.rules) {
            recommendedRules = { ...recommendedRules, ...configItem.rules };
          }
        }
      } else if (configs.recommended && typeof configs.recommended === "object") {
        // Handle legacy format where rules might be at top level
        recommendedRules = configs.recommended;
      }

      // Normalize rule names (remove plugin prefix if present)
      const normalizedRecommendedRules = new Set<string>();
      for (const ruleName of Object.keys(recommendedRules)) {
        // Rule might be "import/no-unresolved" or just "no-unresolved"
        const shortName = ruleName.includes("/") ? ruleName.split("/")[1] : ruleName;
        normalizedRecommendedRules.add(shortName);
        normalizedRecommendedRules.add(ruleName);
      }

      // Process each rule
      for (const [ruleName, ruleConfig] of Object.entries(rules)) {
        const rule = ruleConfig as {
          meta?: {
            docs?: { recommended?: boolean };
            fixable?: string | boolean;
          };
        };

        // Check if recommended via meta.docs.recommended OR if it's in the recommended config
        const isRecommendedViaMeta = rule.meta?.docs?.recommended === true;
        const isRecommendedViaConfig =
          normalizedRecommendedRules.has(ruleName) ||
          normalizedRecommendedRules.has(`${plugin.name}/${ruleName}`);

        pluginData.rules[ruleName] = {
          recommended: isRecommendedViaMeta || isRecommendedViaConfig,
          fixable: Boolean(rule.meta?.fixable),
        };
      }

      pluginData.recommendedConfig = recommendedRules;

      // Write to file
      const outputPath = join(dataDir, `${plugin.name}.json`);
      writeFileSync(outputPath, JSON.stringify(pluginData, null, 2));

      const recommendedCount = Object.values(pluginData.rules).filter((r) => r.recommended).length;
      console.log(
        `  ✓ ${plugin.name}: ${Object.keys(pluginData.rules).length} rules (${recommendedCount} recommended)`,
      );
    } catch (error) {
      console.error(`  ✗ Error processing ${plugin.name}:`, error);
      // Continue with next plugin
    }
  }

  console.log("\n✓ Plugin data generation complete!");
}

generatePluginData();
