<template>
  <!-- Backdrop -->
  <Transition name="overlay">
    <div v-if="modelValue" class="overlay" @click.self="$emit('update:modelValue', false)">
      <div class="panel">

        <!-- Panel Header -->
        <div class="panel-header">
          <div class="tabs">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              class="tab-btn"
              :class="{ active: activeTab === tab.id }"
              @click="activeTab = tab.id"
            >{{ tab.label }}</button>
          </div>
          <button class="close-btn" @click="$emit('update:modelValue', false)">✕</button>
        </div>

        <!-- Panel Body -->
        <div class="panel-body">
          <ColorsTab v-if="activeTab === 'colors'" />
          <ManualTab v-else-if="activeTab === 'manual'" />
        </div>

      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import ColorsTab from './ColorsTab.vue'
import ManualTab from './ManualTab.vue'

defineProps({ modelValue: Boolean })

const activeTab = ref('colors')

const tabs = [
  { id: 'colors', label: '🎨 著色說明' },
  { id: 'manual', label: '📖 語法說明書' },
]

const emit = defineEmits(['update:modelValue'])

// Close on Escape
function onKeydown(e) {
  if (e.key === 'Escape') emit('update:modelValue', false)
}
onMounted(()    => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.panel {
  background: #111826;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: $radius-xl;
  width: min(820px, 95vw);
  max-height: 82vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 80px rgba(0,0,0,0.6);
  overflow: hidden;
}

// ─── Header ───────────────────────────────────────────────────
.panel-header {
  display: flex;
  align-items: center;
  padding: 0 1.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  background: rgba(0,0,0,0.25);
  min-height: 52px;
  gap: 0.5rem;
  flex-shrink: 0;
}

.tabs {
  display: flex;
  gap: 4px;
  flex: 1;
}

.tab-btn {
  background: transparent;
  border: none;
  color: $text-secondary;
  font-family: $font-ui;
  font-size: 0.92rem;
  font-weight: 600;
  padding: 0.5rem 1.1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: $transition-base;

  &:hover { background: rgba(255,255,255,0.06); color: $text-primary; }
  &.active { background: rgba(124,77,255,0.18); color: var(--accent); }
}

.close-btn {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.1);
  color: $text-secondary;
  font-size: 1rem;
  width: 32px; height: 32px;
  border-radius: 8px;
  cursor: pointer;
  @include flex-center;
  transition: $transition-base;
  flex-shrink: 0;

  &:hover {
    background: rgba(255,80,80,0.15);
    border-color: rgba(255,80,80,0.4);
    color: #ff5f56;
  }
}

// ─── Body ─────────────────────────────────────────────────────
.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  @include scrollbar;
}

// ─── Vue Transitions ──────────────────────────────────────────
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.25s ease;

  .panel {
    transition: transform 0.25s ease;
  }
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;

  .panel { transform: translateY(20px) scale(0.97); }
}
</style>
