<script setup lang="ts">
import { ref } from "vue";
import PluginSelector from "./components/PluginSelector.vue";
import ConfigGenerator from "./components/ConfigGenerator.vue";
import ConfigDisplay from "./components/ConfigDisplay.vue";
import type { PluginName } from "./types";

const selectedPlugins = ref<PluginName[]>([]);
const enableTypeAware = ref(false);
const useRecommended = ref(true);
const generatedConfig = ref<string>("");

const handlePluginChange = (plugins: PluginName[]) => {
  selectedPlugins.value = plugins;
};

const handleGenerate = (config: string) => {
  generatedConfig.value = config;
};
</script>

<template>
  <div>
    <header>
      <h1>Oxlint Config Generator</h1>
      <p>Generate a custom Oxlint configuration file for your project.</p>
    </header>

    <main>
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

      <ConfigGenerator
        :selected-plugins="selectedPlugins"
        :enable-type-aware="enableTypeAware"
        :use-recommended="useRecommended"
        @generate="handleGenerate"
      />

      <ConfigDisplay v-if="generatedConfig" :config="generatedConfig" />
    </main>

    <footer>
      <p>
        Learn more about Oxlint at
        <a href="https://oxc.rs" target="_blank" rel="noopener noreferrer"
          >oxc.rs</a
        >
      </p>
    </footer>
  </div>
</template>

<style scoped>
header {
  text-align: center;
  margin-bottom: 3rem;
}

footer {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #444;
  text-align: center;
  opacity: 0.7;
}

footer a {
  color: #646cff;
  text-decoration: none;
}

footer a:hover {
  text-decoration: underline;
}

@media (prefers-color-scheme: light) {
  footer {
    border-top-color: #e0e0e0;
  }
}
</style>
