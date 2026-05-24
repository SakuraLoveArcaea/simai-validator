<template>
  <div class="diagnostics-card sidebar-card">
    <div class="card-header">
      <span class="card-title">語法診斷與錯誤</span>
      <span class="badge" :class="badgeClass">{{ badgeText }}</span>
    </div>
    <div class="diagnostics-list">
      <div v-if="diagnostics.length === 0" class="empty-state">
        <span class="empty-icon">✓</span>
        <span class="empty-text">未檢測到任何語法錯誤！</span>
      </div>
      <div
        v-for="(diag, i) in diagnostics"
        :key="i"
        class="diag-item"
        :class="{ warning: diag.severity === 'Warning' }"
        @click="focusPosition(diag.line, diag.col)"
      >
        <div class="diag-header">
          <span class="diag-severity">{{ diag.severity === 'Warning' ? '警告' : '錯誤' }}</span>
          <span class="diag-location">行 {{ diag.line }}, 列 {{ diag.col }}</span>
        </div>
        <div class="diag-msg">{{ diag.message }}</div>
        <div v-if="diag.snippet" class="diag-snippet">{{ diag.snippet }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useSimaiEditor } from '@/composables/useSimaiEditor'

const { diagnostics, focusPosition } = useSimaiEditor()

const errorCount   = computed(() => diagnostics.filter(d => d.severity === 'Error').length)
const warningCount = computed(() => diagnostics.length - errorCount.value)

const badgeText = computed(() => {
  if (diagnostics.length === 0) return '0 個問題'
  return `${errorCount.value} 錯誤 / ${warningCount.value} 警告`
})

const badgeClass = computed(() => ({
  'badge--ok':      diagnostics.length === 0,
  'badge--error':   errorCount.value > 0,
  'badge--warning': errorCount.value === 0 && warningCount.value > 0,
}))
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.sidebar-card {
  @include card;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  align-items: center;
  padding: 0.8rem 1.2rem;
  border-bottom: 1px solid $border;
  flex-shrink: 0;
}

.card-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: $text-secondary;
}

.badge {
  margin-left: auto;
  background: rgba(255,255,255,0.06);
  border: 1px solid $border;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 0.8rem;
  color: $text-secondary;
  transition: $transition-base;

  &--ok      { background: rgba(76,175,80,0.15);  color: #4caf50; border-color: #4caf50; }
  &--error   { background: rgba(255,23,68,0.15);  color: #ff1744; border-color: #ff1744; }
  &--warning { background: rgba(255,167,38,0.15); color: #ffa726; border-color: #ffa726; }
}

.diagnostics-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  @include scrollbar;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: $text-secondary;
  gap: 0.5rem;

  .empty-icon { font-size: 2rem; color: #4caf50; }
  .empty-text { font-size: 0.9rem; }
}

.diag-item {
  background: rgba(0,0,0,0.2);
  border-left: 4px solid $color-error;
  border-radius: 4px;
  padding: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 0.85rem;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover { transform: translateX(4px); }
  &.warning { border-left-color: $color-hold; }
}

.diag-header {
  display: flex;
  justify-content: space-between;
  font-weight: 600;
}

.diag-severity { color: $color-error; }
.diag-item.warning .diag-severity { color: $color-hold; }
.diag-location { color: $text-secondary; }
.diag-msg      { color: $text-primary; }

.diag-snippet {
  font-family: $font-code;
  background: rgba(255,255,255,0.05);
  padding: 3px 6px;
  border-radius: 4px;
  word-break: break-all;
  width: fit-content;
}
</style>
