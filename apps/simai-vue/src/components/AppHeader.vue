<template>
  <header class="app-header">
    <div class="logo">
      <span class="logo-glow">simai</span>
      <span class="logo-sub">驗證器</span>
    </div>
    <div class="actions">
      <!-- Mode Switch -->
      <div class="mode-switch-nav">
        <button
          class="mode-btn"
          :class="{ active: colorMode === 'token' }"
          @click="setColorMode('token')"
        >Token 分色</button>
        <button
          class="mode-btn"
          :class="{ active: colorMode === 'object' }"
          @click="setColorMode('object')"
        >遊戲物件分色</button>
      </div>

      <button class="btn" id="btn-import-file" @click="filePicker.click()">匯入檔案</button>
      <input ref="filePicker" type="file" accept=".txt" style="display:none" @change="onFileImport" />
      <button class="btn" @click="$emit('load-valid')">載入正確範例</button>
      <button class="btn" @click="$emit('load-invalid')">載入錯誤範例</button>
      <button
        class="btn btn--settings"
        :class="{ active: settingsOpen }"
        @click="$emit('toggle-settings')"
      >⚙ 設定</button>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue'
import { useSimaiEditor } from '@/composables/useSimaiEditor'

defineProps({ settingsOpen: Boolean })
defineEmits(['load-valid', 'load-invalid', 'toggle-settings'])

const { setEditorValue, tabs, activeTabId, colorMode, setColorMode } = useSimaiEditor()
const filePicker = ref(null)

function onFileImport(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    setEditorValue(ev.target.result)
    const activeTab = tabs.find(t => t.id === activeTabId.value)
    if (activeTab) activeTab.name = file.name
  }
  reader.readAsText(file)
  e.target.value = ''
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  @include card;
  padding: 1rem 1.5rem;
  flex-shrink: 0;
}

.logo {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: 1px;
}

.logo-glow {
  color: $color-tap;
  text-shadow: 0 0 10px rgba(255, 46, 147, 0.4);
}

.logo-sub {
  color: $text-primary;
  font-weight: 300;
}

.actions {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.mode-switch-nav {
  display: flex;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid $border;
  border-radius: $radius-sm;
  padding: 2px;
  margin-right: 0.4rem;
}

.mode-btn {
  background: transparent;
  border: none;
  color: $text-secondary;
  padding: 0.35rem 0.8rem;
  font-size: 0.82rem;
  font-family: $font-ui;
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
  transition: $transition-base;

  &:hover {
    color: $text-primary;
  }

  &.active {
    background: rgba(124, 77, 255, 0.15);
    color: var(--accent);
    box-shadow: inset 0 0 4px rgba(124, 77, 255, 0.1);
  }
}

.btn {
  background: transparent;
  border: 1px solid $border;
  color: $text-primary;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  font-family: $font-ui;
  font-weight: 500;
  border-radius: $radius-sm;
  cursor: pointer;
  transition: $transition-base;

  &:hover {
    background: rgba(255,255,255,0.05);
    border-color: rgba(255,255,255,0.2);
  }

  &--settings {
    background: rgba(124,77,255,0.12);
    border-color: rgba(124,77,255,0.35);
    color: var(--accent);
    font-weight: 600;

    &:hover {
      background: rgba(124,77,255,0.25);
      border-color: rgba(124,77,255,0.6);
      color: #fff;
    }

    &.active {
      background: var(--accent);
      color: #fff;
      box-shadow: 0 4px 16px rgba(124,77,255,0.4);
    }
  }
}
</style>
