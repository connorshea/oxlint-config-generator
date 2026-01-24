<script setup lang="ts">
import { computed, ref } from "vue";
import type { PluginName, OxlintRule, RuleOverride } from "../types";
import rulesData from "../../data/rules.json";
import ruleDescriptions from "../../data/rule-descriptions.json";
import { isRuleRecommended, isRuleDeprecated, scopeToPluginMap } from "../utils/config-generator";

const props = defineProps<{
  selectedPlugins: PluginName[];
  enableTypeAware: boolean;
  useRecommended: boolean;
  ruleOverrides: Record<string, RuleOverride>;
  enabledRuleCount: number;
  showFullRulesList: boolean;
}>();

const searchQuery = ref("");
const filterFixable = ref<"all" | "fixable" | "non-fixable">("all");

// ...
const isRuleEnabled = (rule: OxlintRule): boolean => {
  const override = getRuleStatus(rule);
  if (override !== null) {
    return override !== "off";
  }
  // No explicit override: consider recommended only if the global toggle is enabled
  return props.useRecommended ? isRuleRecommended(rule) : false;
};

const emit = defineEmits<{
  "update:ruleOverrides": [overrides: Record<string, RuleOverride>];
  "update:showFullRulesList": [value: boolean];
}>();

const allRules = rulesData as OxlintRule[];

const filteredRules = computed(() => {
  return allRules.filter((rule) => {
    // Exclude nursery rules
    if (rule.category === "nursery") {
      return false;
    }

    // Exclude rules that were deprecated in the original plugins.
    if (isRuleDeprecated(rule)) {
      return false;
    }

    // Include eslint core rules only when the 'eslint' plugin is selected
    if (rule.scope === "eslint") {
      if (!props.selectedPlugins.includes("eslint")) return false;
    } else {
      // Check if the plugin is selected
      const pluginName = scopeToPluginMap[rule.scope];
      if (!pluginName || !props.selectedPlugins.includes(pluginName)) {
        return false;
      }
    }

    // Filter out type-aware rules if not enabled
    if (!props.enableTypeAware && rule.type_aware) {
      return false;
    }

    // Apply search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      const ruleId = getRuleId(rule).toLowerCase();
      const description = getRuleDescription(rule).toLowerCase();
      if (!ruleId.includes(query) && !description.includes(query)) {
        return false;
      }
    }

    // Apply fixable filter
    if (filterFixable.value === "fixable" && rule.fix === "none") {
      return false;
    }
    if (filterFixable.value === "non-fixable" && rule.fix !== "none") {
      return false;
    }

    return true;
  });
});

const groupedRules = computed(() => {
  if (props.showFullRulesList) {
    // In full rules list mode, return all filtered rules in a single group
    return [["all", filteredRules.value] as [string, OxlintRule[]]];
  }

  const groups: Record<string, OxlintRule[]> = {};

  for (const rule of filteredRules.value) {
    const groupName = rule.scope === "eslint" ? "eslint" : rule.scope;
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(rule);
  }

  // Sort groups: eslint first, then alphabetically
  const sortedEntries = Object.entries(groups).sort(([a], [b]) => {
    if (a === "eslint") return -1;
    if (b === "eslint") return 1;
    return a.localeCompare(b);
  });

  return sortedEntries;
});

const getRuleId = (rule: OxlintRule): string => {
  // Always include the scope (convert underscores to hyphens)
  return `${rule.scope.replace("_", "-")}/${rule.value}`;
};

// Try to find a description from the generated descriptions JSON.
// We handle a few possible key formats to be resilient to differences between
// the site's folder names and the rule scope naming (underscores vs hyphens).
const descriptions = ruleDescriptions as Record<string, Record<string, string>>;

const getRuleDescription = (rule: OxlintRule): string => {
  // ESLint core rules live under the 'eslint' key
  const scopeKeyCandidates = [] as string[];
  if (rule.scope === "eslint") {
    scopeKeyCandidates.push("eslint");
  } else {
    // prefer mapping from scope to plugin name (e.g. react_perf -> react-perf)
    const mapped = scopeToPluginMap[rule.scope];
    if (mapped) scopeKeyCandidates.push(mapped);
    // also try raw scope, and a hyphenated variant
    scopeKeyCandidates.push(rule.scope);
    scopeKeyCandidates.push(rule.scope.replace(/_/g, "-"));
  }

  for (const key of scopeKeyCandidates) {
    const group = descriptions[key];
    if (group) {
      const desc = group[rule.value];
      if (desc && desc.trim().length > 0) return desc.trim();
    }
  }

  return "";
};

const parseMarkdownInDescription = (description: string): string => {
  // Parse inline code blocks (backticks) into <code> tags
  return description.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
};

const getEnabledCountForGroup = (rules: OxlintRule[]): number => {
  return rules.filter((rule) => isRuleEnabled(rule)).length;
};

const getRuleStatus = (rule: OxlintRule): RuleOverride => {
  const ruleId = getRuleId(rule);
  return props.ruleOverrides[ruleId] ?? null;
};

const onRuleChange = (e: Event, rule: OxlintRule) => {
  const checked = (e.target as HTMLInputElement).checked;
  const ruleId = getRuleId(rule);
  const newOverrides = { ...props.ruleOverrides };

  if (checked) {
    newOverrides[ruleId] = "error";
  } else {
    newOverrides[ruleId] = "off";
  }

  emit("update:ruleOverrides", newOverrides);
};

const getCategoryClass = (category: string): string => {
  const classes: Record<string, string> = {
    correctness: "category-correctness",
    suspicious: "category-suspicious",
    pedantic: "category-pedantic",
    style: "category-style",
    restriction: "category-restriction",
    nursery: "category-nursery",
    perf: "category-perf",
  };
  return classes[category] || "";
};

const getCategoryTooltip = (category: string): string => {
  const tooltips: Record<string, string> = {
    correctness: "Code that is outright wrong or useless",
    suspicious: "Code that is most likely wrong or useless",
    pedantic: "Lints which are rather strict or have occasional false positives",
    style: "Code that should be written in a more idiomatic way",
    restriction: "Lints which prevent the use of language or library features",
    nursery: "New lints that are still under development",
    perf: "Performance-related code improvements",
  };
  return tooltips[category] || category;
};

const formatGroupName = (scope: string): string => {
  const names: Record<string, string> = {
    eslint: "ESLint",
    oxc: "oxc",
    typescript: "TypeScript",
    react: "React",
    react_perf: "React Perf",
    jsx_a11y: "JSX A11y",
    vue: "Vue",
    unicorn: "Unicorn",
    import: "Import",
    jsdoc: "JSDoc",
    jest: "Jest",
    vitest: "Vitest",
    nextjs: "Next.js",
    promise: "Promise",
    node: "Node.js",
  };
  return names[scope] || scope;
};

interface GroupSourceInfo {
  text: string;
  url: string;
}

const getGroupSource = (scope: string): GroupSourceInfo => {
  const sources: Record<string, GroupSourceInfo> = {
    eslint: {
      text: "ESLint",
      url: "https://github.com/eslint/eslint",
    },
    oxc: {
      text: "oxc",
      url: "https://github.com/oxc-project/oxc",
    },
    typescript: {
      text: "@typescript-eslint/eslint-plugin",
      url: "https://github.com/typescript-eslint/typescript-eslint",
    },
    react: {
      text: "eslint-plugin-react",
      url: "https://github.com/jsx-eslint/eslint-plugin-react",
    },
    react_perf: {
      text: "eslint-plugin-react-perf",
      url: "https://github.com/cvazac/eslint-plugin-react-perf",
    },
    jsx_a11y: {
      text: "eslint-plugin-jsx-a11y",
      url: "https://github.com/jsx-eslint/eslint-plugin-jsx-a11y",
    },
    vue: {
      text: "eslint-plugin-vue",
      url: "https://github.com/vuejs/eslint-plugin-vue",
    },
    unicorn: {
      text: "eslint-plugin-unicorn",
      url: "https://github.com/sindresorhus/eslint-plugin-unicorn",
    },
    import: {
      text: "eslint-plugin-import",
      url: "https://github.com/import-js/eslint-plugin-import",
    },
    jsdoc: {
      text: "eslint-plugin-jsdoc",
      url: "https://github.com/gajus/eslint-plugin-jsdoc",
    },
    jest: {
      text: "eslint-plugin-jest",
      url: "https://github.com/jest-community/eslint-plugin-jest",
    },
    vitest: {
      text: "eslint-plugin-vitest",
      url: "https://github.com/vitest-dev/eslint-plugin-vitest",
    },
    nextjs: {
      text: "@next/eslint-plugin-next",
      url: "https://github.com/vercel/next.js/tree/canary/packages/eslint-plugin-next",
    },
    promise: {
      text: "eslint-plugin-promise",
      url: "https://github.com/eslint-community/eslint-plugin-promise",
    },
    node: {
      text: "eslint-plugin-n",
      url: "https://github.com/eslint-community/eslint-plugin-n",
    },
  };
  return sources[scope] || { text: "", url: "" };
};
</script>

<template>
  <div class="section rule-selector">
    <div class="rule-header">
      <h2>Rules</h2>
      <span class="rule-count">{{ enabledRuleCount }} rules enabled</span>
    </div>

    <div class="rule-controls">
      <label class="view-toggle">
        <input
          type="checkbox"
          :checked="showFullRulesList"
          @change="emit('update:showFullRulesList', !showFullRulesList)"
        />
        <span>Show full rules list</span>
      </label>

      <div class="search-bar">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search rules..."
          class="search-input"
        />
      </div>

      <div class="filter-group">
        <label class="filter-label">Show:</label>
        <div class="filter-buttons">
          <button
            :class="['filter-button', { active: filterFixable === 'all' }]"
            @click="filterFixable = 'all'"
          >
            All
          </button>
          <button
            :class="['filter-button', { active: filterFixable === 'fixable' }]"
            @click="filterFixable = 'fixable'"
          >
            Autofixable
          </button>
          <button
            :class="['filter-button', { active: filterFixable === 'non-fixable' }]"
            @click="filterFixable = 'non-fixable'"
          >
            Non-fixable
          </button>
        </div>
      </div>
    </div>

    <div class="rule-groups">
      <details
        v-for="[scope, rules] in groupedRules"
        :key="scope"
        :open="showFullRulesList"
        class="rule-group"
      >
        <summary v-if="!showFullRulesList" class="group-summary">
          <span class="group-name">{{ formatGroupName(scope) }}</span>
          <span class="group-count">
            <span class="enabled-count">{{ getEnabledCountForGroup(rules) }}</span>
            <span class="count-separator">/</span>
            <span>{{ rules.length }} rules</span>
          </span>
        </summary>

        <p v-if="!showFullRulesList" class="group-source">
          Rules from
          <a :href="getGroupSource(scope).url" target="_blank" rel="noopener noreferrer">
            {{ getGroupSource(scope).text }}
          </a>
        </p>

        <div class="rule-list">
          <div v-for="rule in rules" :key="getRuleId(rule)" class="rule-item">
            <label class="rule-toggle">
              <input
                type="checkbox"
                :checked="isRuleEnabled(rule)"
                @change="onRuleChange($event, rule)"
              />
              <div class="rule-content">
                <div class="rule-head">
                  <span class="rule-name">{{ rule.value }}</span>
                  <a
                    v-if="rule.docs_url"
                    :href="rule.docs_url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="rule-doc-link"
                    title="Open docs in new tab"
                    >(docs)</a
                  >
                </div>

                <p
                  v-if="getRuleDescription(rule)"
                  class="rule-desc"
                  :title="getRuleDescription(rule)"
                  v-html="parseMarkdownInDescription(getRuleDescription(rule))"
                ></p>
              </div>
            </label>

            <div class="rule-meta">
              <span
                :class="['category-badge', getCategoryClass(rule.category)]"
                :title="getCategoryTooltip(rule.category)"
              >
                {{ rule.category }}
              </span>
              <span
                v-if="isRuleRecommended(rule)"
                class="recommended-badge"
                title="This rule is recommended in the original ESLint plugin"
              >
                recommended
              </span>
              <span
                v-if="rule.type_aware"
                class="type-aware-badge"
                title="This rule requires type information from TypeScript"
              >
                type-aware
              </span>
              <span
                v-if="rule.fix !== 'none'"
                class="fixable-badge"
                title="This rule supports automatic fixing"
              >
                autofixable
              </span>
            </div>
          </div>
        </div>
      </details>
    </div>
  </div>
</template>

<style scoped>
.rule-selector {
  max-height: none;
}

.rule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.rule-header h2 {
  margin: 0;
}

.rule-count {
  font-size: 0.875rem;
  color: var(--color-primary);
  font-weight: 500;
}

.rule-groups {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.rule-group {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
}

.group-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  cursor: pointer;
  background: var(--color-bg-hover);
  user-select: none;
}

.group-summary:hover {
  background: var(--color-border);
}

.group-name {
  font-weight: 600;
  font-size: 0.9375rem;
}

.group-count {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.enabled-count {
  color: var(--color-primary);
  font-weight: 600;
}

.count-separator {
  margin: 0 0.125rem;
  opacity: 0.5;
}

.group-source {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin: 0;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--color-border);

  a {
    color: var(--color-primary);
    text-decoration: none;
  }
}

.rule-list {
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-height: 400px;
  overflow-y: auto;
}

.rule-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  gap: 0.75rem;
}

.rule-item:hover {
  background: var(--color-bg-hover);
}

.rule-toggle {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  cursor: pointer;
  flex: 1;
  min-width: 0;
}

.rule-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.rule-head {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  min-width: 0;
}

.rule-name {
  font-family: "SF Mono", "Fira Code", Menlo, Monaco, Consolas, monospace;
  font-size: 0.8125rem;
  color: var(--color-text);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
}

.rule-doc-link {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  text-decoration: none;
}

.rule-doc-link:hover {
  color: var(--color-primary);
  text-decoration: underline;
}

.rule-toggle input[type="checkbox"] {
  appearance: none;
  -webkit-appearance: none;
  width: 1rem;
  height: 1rem;
  border: 2px solid var(--color-border-hover);
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
  position: relative;
}

.rule-toggle input[type="checkbox"]:checked {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}

.rule-toggle input[type="checkbox"]:checked::after {
  content: "";
  position: absolute;
  left: 4px;
  top: 1px;
  width: 4px;
  height: 7px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.rule-desc {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  margin: 0.25rem 0 0 0;
  line-height: 1.3;
  max-width: 48ch;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rule-meta {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-shrink: 0;
}

.category-badge {
  font-size: 0.6875rem;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-weight: 500;
  text-transform: lowercase;
}

.category-correctness {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.category-suspicious {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.category-pedantic {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.category-perf {
  background: rgba(14, 165, 233, 0.12);
  color: #0ea5e9;
}

.category-style {
  background: rgba(139, 92, 246, 0.15);
  color: #8b5cf6;
}

.category-restriction {
  background: rgba(107, 114, 128, 0.15);
  color: #6b7280;
}

.category-nursery {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.recommended-badge {
  font-size: 0.6875rem;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
  font-weight: 500;
}

.type-aware-badge {
  font-size: 0.6875rem;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
  font-weight: 500;
}

.fixable-badge {
  font-size: 0.6875rem;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  background: rgba(168, 85, 247, 0.15);
  color: #a855f7;
  font-weight: 500;
}

.rule-controls {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: var(--color-bg-hover);
  border-radius: 8px;
}

.view-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
}

.view-toggle input[type="checkbox"] {
  appearance: none;
  -webkit-appearance: none;
  width: 1rem;
  height: 1rem;
  border: 2px solid var(--color-border-hover);
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
  position: relative;
}

.view-toggle input[type="checkbox"]:checked {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}

.view-toggle input[type="checkbox"]:checked::after {
  content: "";
  position: absolute;
  left: 3px;
  top: 0px;
  width: 4px;
  height: 7px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.search-bar {
  display: flex;
  gap: 0.5rem;
}

.search-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg-elevated);
  color: var(--color-text);
  font-size: 0.875rem;
  font-family: inherit;
  transition: all 0.15s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-muted);
}

.search-input::placeholder {
  color: var(--color-text-muted);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.filter-label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.filter-buttons {
  display: flex;
  gap: 0.375rem;
}

.filter-button {
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-elevated);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-button:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

.filter-button.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

:deep(.inline-code) {
  background-color: var(--color-code-bg);
  color: var(--color-primary);
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  font-family: "SF Mono", "Fira Code", Menlo, Monaco, Consolas, monospace;
  font-size: 0.8em;
  border: 1px solid var(--color-border);
}
</style>
