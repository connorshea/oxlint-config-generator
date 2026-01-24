<script setup lang="ts">
import { ref, computed } from "vue";
import PluginSelector from "./components/PluginSelector.vue";
import RuleSelector from "./components/RuleSelector.vue";
import ConfigDisplay from "./components/ConfigDisplay.vue";
import { generateOxlintConfig, countEnabledRules } from "./utils/config-generator";
import type { PluginName, RuleOverride } from "./types";

const selectedPlugins = ref<PluginName[]>(["oxc", "unicorn", "typescript"]);
const enableTypeAware = ref(false);
const useRecommended = ref(true);
const ruleOverrides = ref<Record<string, RuleOverride>>({});

const handlePluginChange = (plugins: PluginName[]) => {
  selectedPlugins.value = plugins;
};

const handleRuleOverridesChange = (overrides: Record<string, RuleOverride>) => {
  ruleOverrides.value = overrides;
};

const enabledRuleCount = computed(() => {
  return countEnabledRules(
    selectedPlugins.value,
    enableTypeAware.value,
    useRecommended.value,
    ruleOverrides.value,
  );
});

const generatedConfig = computed(() => {
  return generateOxlintConfig(
    selectedPlugins.value,
    enableTypeAware.value,
    useRecommended.value,
    ruleOverrides.value,
  );
});
</script>

<template>
  <div class="app-container">
    <header>
      <h1>Oxlint Config Generator</h1>
      <p>Easily create an <code>.oxlintrc.json</code> file for your project.</p>
    </header>

    <div class="main-layout">
      <div class="settings-column">
        <PluginSelector
          :selected-plugins="selectedPlugins"
          @update:selected-plugins="handlePluginChange"
        />

        <div class="section">
          <h2>Options</h2>
          <div class="checkbox-group">
            <label>
              <input v-model="enableTypeAware" type="checkbox" />
              <span>Enable type-aware rules</span>
            </label>
            <p class="option-help">
              Type-aware rules require
              <a
                href="https://www.npmjs.com/package/oxlint-typescript-go"
                target="_blank"
                rel="noopener noreferrer"
                >oxlint-typescript-go</a
              >
              to be installed.
            </p>
            <label>
              <input v-model="useRecommended" type="checkbox" />
              <span>Use recommended rulesets from original ESLint plugins</span>
            </label>
            <p class="option-help">
              Enables rules that are marked as recommended in the original ESLint plugins (e.g.
              eslint-plugin-react, @typescript-eslint/eslint-plugin).
            </p>
          </div>
        </div>
      </div>

      <div class="rules-column">
        <RuleSelector
          :selected-plugins="selectedPlugins"
          :enable-type-aware="enableTypeAware"
          :rule-overrides="ruleOverrides"
          :enabled-rule-count="enabledRuleCount"
          @update:rule-overrides="handleRuleOverridesChange"
        />
      </div>

      <aside class="config-column">
        <ConfigDisplay :config="generatedConfig" />
      </aside>
    </div>

    <footer>
      <p>
        Learn more about Oxlint at
        <a href="https://oxc.rs" target="_blank" rel="noopener noreferrer">oxc.rs</a>
      </p>
    </footer>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  text-align: center;
  margin-bottom: 2rem;
}

header code {
  background-color: var(--color-primary-muted);
  color: var(--color-primary);
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-family: "SF Mono", "Fira Code", Menlo, Monaco, Consolas, monospace;
  font-size: 0.9em;
}

.main-layout {
  display: grid;
  grid-template-columns: 300px 1fr 400px;
  gap: 1.5rem;
  flex: 1;
  align-items: start;
}

.settings-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.rules-column {
  min-width: 0;
}

.config-column {
  position: sticky;
  top: 1.5rem;
}

footer {
  margin-top: 3rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
  text-align: center;
}

footer p {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

footer a {
  color: var(--color-primary);
  text-decoration: none;
}

footer a:hover {
  text-decoration: underline;
}

@media (max-width: 1200px) {
  .main-layout {
    grid-template-columns: 1fr 1fr;
  }

  .settings-column {
    grid-column: 1;
  }

  .rules-column {
    grid-column: 2;
  }

  .config-column {
    grid-column: 1 / -1;
    position: static;
  }
}

@media (max-width: 768px) {
  .main-layout {
    grid-template-columns: 1fr;
  }

  .settings-column,
  .rules-column,
  .config-column {
    grid-column: 1;
  }
}

.option-help {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  margin: -0.25rem 0 0.75rem 2rem;
  line-height: 1.4;
}

.option-help a {
  color: var(--color-primary);
  text-decoration: none;
}

.option-help a:hover {
  text-decoration: underline;
}
</style>
