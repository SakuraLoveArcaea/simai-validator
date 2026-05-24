<template>
  <div class="app-container">
    <!-- Header -->
    <AppHeader
      :settings-open="settingsOpen"
      @load-valid="editorRef?.loadValid()"
      @load-invalid="editorRef?.loadInvalid()"
      @toggle-settings="settingsOpen = !settingsOpen"
    />

    <!-- Main Layout -->
    <main class="main-content">
      <div class="top-layout">
        <!-- Left: Monaco Editor -->
        <section class="editor-section">
          <MonacoEditor ref="editorRef" />
        </section>

        <!-- Right: Sidebar -->
        <section class="sidebar-section">
          <DiagnosticsPanel />
        </section>
      </div>

      <!-- Bottom: Stats Panel -->
      <section class="stats-section">
        <StatsPanel />
      </section>
    </main>

    <!-- Settings Modal -->
    <SettingsOverlay v-model="settingsOpen" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AppHeader       from '@/components/AppHeader.vue'
import MonacoEditor    from '@/components/MonacoEditor.vue'
import DiagnosticsPanel from '@/components/DiagnosticsPanel.vue'
import StatsPanel      from '@/components/StatsPanel.vue'
import SettingsOverlay from '@/components/SettingsOverlay.vue'

const settingsOpen = ref(false)
const editorRef    = ref(null)
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 1.5rem;
  gap: 1.5rem;
  overflow: hidden;
}

.main-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 1.5rem;
  min-height: 0;
}

.top-layout {
  display: grid;
  grid-template-columns: 1fr 380px;
  flex: 1;
  gap: 1.5rem;
  min-height: 0;
}

.editor-section {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  min-height: 0;

  :deep(.diagnostics-card) { flex: 1; min-height: 0; }
}

.stats-section {
  display: flex;
  min-height: 0;
  flex-shrink: 0;
}
</style>
