<script setup lang="ts">
import { computed } from "vue";
import type { PluginName, OxlintRule, RuleOverride } from "../types";
import rulesData from "../../data/rules.json";
import { isRuleRecommended, scopeToPluginMap } from "../utils/config-generator";

const props = defineProps<{
  selectedPlugins: PluginName[];
  enableTypeAware: boolean;
  ruleOverrides: Record<string, RuleOverride>;
  enabledRuleCount: number;
}>();

const emit = defineEmits<{
  "update:ruleOverrides": [overrides: Record<string, RuleOverride>];
}>();

const allRules = rulesData as OxlintRule[];

const filteredRules = computed(() => {
  return allRules.filter((rule) => {
    // Exclude nursery rules
    if (rule.category === "nursery") {
      return false;
    }

    // Always include eslint core rules
    if (rule.scope === "eslint") {
      return true;
    }

    // Check if the plugin is selected
    const pluginName = scopeToPluginMap[rule.scope];
    if (!pluginName || !props.selectedPlugins.includes(pluginName)) {
      return false;
    }

    // Filter out type-aware rules if not enabled
    if (!props.enableTypeAware && rule.type_aware) {
      return false;
    }

    return true;
  });
});

const groupedRules = computed(() => {
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
  return rule.scope === "eslint" ? rule.value : `${rule.scope.replace("_", "-")}/${rule.value}`;
};

const getRuleStatus = (rule: OxlintRule): RuleOverride => {
  const ruleId = getRuleId(rule);
  return props.ruleOverrides[ruleId] ?? null;
};

const isRuleEnabled = (rule: OxlintRule): boolean => {
  const override = getRuleStatus(rule);
  if (override !== null) {
    return override !== "off";
  }
  // Default: use recommended status
  return isRuleRecommended(rule);
};

const toggleRule = (rule: OxlintRule) => {
  const ruleId = getRuleId(rule);
  const isCurrentlyEnabled = isRuleEnabled(rule);

  const newOverrides = { ...props.ruleOverrides };

  if (isCurrentlyEnabled) {
    // Turn it off
    newOverrides[ruleId] = "off";
  } else {
    // Turn it on
    newOverrides[ruleId] = "error";
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
    n: "Node.js",
  };
  return names[scope] || scope;
};
</script>

<template>
  <div class="section rule-selector">
    <div class="rule-header">
      <h2>Rules</h2>
      <span class="rule-count">{{ enabledRuleCount }} rules enabled</span>
    </div>

    <div class="rule-groups">
      <details v-for="[scope, rules] in groupedRules" :key="scope" class="rule-group">
        <summary class="group-summary">
          <span class="group-name">{{ formatGroupName(scope) }}</span>
          <span class="group-count">{{ rules.length }} rules</span>
        </summary>

        <div class="rule-list">
          <div v-for="rule in rules" :key="getRuleId(rule)" class="rule-item">
            <label class="rule-toggle">
              <input type="checkbox" :checked="isRuleEnabled(rule)" @change="toggleRule(rule)" />
              <span class="rule-name">{{ rule.value }}</span>
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
              <a :href="rule.docs_url" target="_blank" rel="noopener noreferrer" class="docs-link">
                docs
              </a>
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
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  flex: 1;
  min-width: 0;
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

.rule-name {
  font-family: "SF Mono", "Fira Code", Menlo, Monaco, Consolas, monospace;
  font-size: 0.8125rem;
  color: var(--color-text);
  white-space: nowrap;
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

.docs-link {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-decoration: none;
}

.docs-link:hover {
  color: var(--color-primary);
  text-decoration: underline;
}
</style>
