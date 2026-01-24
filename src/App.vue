<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import PluginSelector from "./components/PluginSelector.vue";
import RuleSelector from "./components/RuleSelector.vue";
import ConfigDisplay from "./components/ConfigDisplay.vue";
import { generateOxlintConfig, countEnabledRules } from "./utils/config-generator";
import type { PluginName, RuleOverride } from "./types";
import packageJson from "../package.json";

const selectedPlugins = ref<PluginName[]>(["eslint", "oxc", "typescript"]);
const enableTypeAware = ref(false);
const useRecommended = ref(true);
const ruleOverrides = ref<Record<string, RuleOverride>>({});
const showFullRulesList = ref(false);

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

// Theme toggle: persisted to localStorage and applied as a data-theme on <html>
const savedTheme = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
const prefersDark =
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;
const isDark = ref<boolean>(savedTheme ? savedTheme === "dark" : prefersDark);

const applyTheme = () => {
  document.documentElement.setAttribute("data-theme", isDark.value ? "dark" : "light");
};

onMounted(() => {
  applyTheme();
});

watch(isDark, (v) => {
  localStorage.setItem("theme", v ? "dark" : "light");
  applyTheme();
});

const toggleTheme = () => {
  isDark.value = !isDark.value;
};

const oxlintVersion = computed(() => {
  return (
    (packageJson.devDependencies as Record<string, string>)?.oxlint?.replace("^", "") || "unknown"
  );
});
</script>

<template>
  <div class="app-container">
    <header>
      <h1>Oxlint Config Generator</h1>
      <p>Easily create a <code>.oxlintrc.json</code> file for your project.</p>
      <button
        class="theme-toggle"
        @click="toggleTheme"
        :aria-pressed="isDark"
        :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
      >
        {{ isDark ? "🌙 Dark" : "☀️ Light" }}
      </button>
    </header>

    <div class="top-cards">
      <div class="section plugins-card">
        <PluginSelector
          :selected-plugins="selectedPlugins"
          @update:selected-plugins="handlePluginChange"
        />
      </div>

      <aside class="section config-card">
        <ConfigDisplay :config="generatedConfig" />
      </aside>
    </div>

    <div class="main-layout">
      <div class="rules-column">
        <RuleSelector
          :selected-plugins="selectedPlugins"
          :enable-type-aware="enableTypeAware"
          :use-recommended="useRecommended"
          :rule-overrides="ruleOverrides"
          :enabled-rule-count="enabledRuleCount"
          :show-full-rules-list="showFullRulesList"
          @update:rule-overrides="handleRuleOverridesChange"
          @update:show-full-rules-list="(val) => (showFullRulesList = val)"
        />
      </div>

      <div class="section options-column">
        <h2>Options</h2>
        <div class="checkbox-group">
          <label>
            <input v-model="useRecommended" type="checkbox" />
            <span>Use recommended rulesets for each plugin</span>
          </label>
          <p class="option-help">
            Enables rules that are marked as recommended in the original ESLint plugins (e.g.
            eslint-plugin-react, @typescript-eslint/eslint-plugin).
          </p>
          <label>
            <input v-model="enableTypeAware" type="checkbox" />
            <span>Enable type-aware rules</span>
          </label>
          <p class="option-help">
            Type-aware rules require
            <a
              href="https://www.npmjs.com/package/oxlint-tsgolint"
              target="_blank"
              rel="noopener noreferrer"
              >oxlint-tsgolint</a
            >
            to be installed.
          </p>
        </div>
      </div>
    </div>

    <footer>
      <p>
        Learn more about Oxlint at
        <a href="https://oxc.rs" target="_blank" rel="noopener noreferrer">oxc.rs</a>
        ·
        <a
          href="https://github.com/connorshea/oxlint-config-generator"
          target="_blank"
          rel="noopener noreferrer"
          >Source Code</a
        >
        · Made with 💜 in Denver, Colorado · Ruleset based on Oxlint v{{ oxlintVersion }}
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
  position: relative;
}

.theme-toggle {
  position: absolute;
  right: 0;
  top: 0;
  transform: translateY(6px);
  padding: 0.5rem 0.75rem;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.theme-toggle:hover {
  color: var(--color-text);
  background: var(--color-bg-hover);
  border-color: var(--color-border-hover);
}

header code {
  background-color: var(--color-primary-muted);
  color: var(--color-primary);
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-family: "SF Mono", "Fira Code", Menlo, Monaco, Consolas, monospace;
  font-size: 0.9em;
}

.top-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.plugins-card,
.config-card {
  margin-bottom: 0;
}

.options-column {
  position: sticky;
  top: 1.5rem;
  height: fit-content;
}

.main-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 1.5rem;
  flex: 1;
  align-items: start;
}

.rules-column {
  min-width: 0;
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
  .top-cards {
    grid-template-columns: 1fr;
  }

  .main-layout {
    grid-template-columns: 1fr;
  }

  .options-column {
    position: static;
  }
}

@media (max-width: 768px) {
  .top-cards {
    grid-template-columns: 1fr;
  }

  .main-layout {
    grid-template-columns: 1fr;
  }
}

.option-help {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  margin: 0.25rem 0 0.75rem 2.25rem;
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
