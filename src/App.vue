<script setup lang="ts">
import { ref, computed } from "vue";
import PluginSelector from "./components/PluginSelector.vue";
import ConfigDisplay from "./components/ConfigDisplay.vue";
import { generateOxlintConfig } from "./utils/config-generator";
import type { PluginName } from "./types";

const selectedPlugins = ref<PluginName[]>(["oxc", "unicorn", "typescript"]);
const enableTypeAware = ref(false);
const useRecommended = ref(true);

const handlePluginChange = (plugins: PluginName[]) => {
  selectedPlugins.value = plugins;
};

const generatedConfig = computed(() => {
  return generateOxlintConfig(selectedPlugins.value, enableTypeAware.value, useRecommended.value);
});
</script>

<template>
  <div class="app-container">
    <header>
      <h1>Oxlint Config Generator</h1>
      <p>Easily create an <code>.oxlintrc.json</code> file for your project.</p>
    </header>

    <div class="main-layout">
      <main class="settings-panel">
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
            <label>
              <input v-model="useRecommended" type="checkbox" />
              <span>Use recommended rulesets from original ESLint plugins</span>
            </label>
          </div>
        </div>
      </main>

      <aside class="config-panel">
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

.main-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  flex: 1;
  align-items: start;
}

.settings-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.config-panel {
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

@media (max-width: 900px) {
  .main-layout {
    grid-template-columns: 1fr;
  }

  .config-panel {
    position: static;
  }
}
</style>
