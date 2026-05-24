<template>
  <div class="stats-bar">
    <div class="stats-header">
      <span class="stats-title-icon">📊</span>
      <span class="stats-title-text">數據統計</span>
    </div>
    <div class="stats-items">

      <!-- Total -->
      <div class="stat-item stat-item--total">
        <span class="stat-label">總計 (Total)</span>
        <div class="stat-value-container">
          <span class="stat-value">{{ fmt(stats.total) }}</span>
          <span
            v-if="stats.breaks > 0"
            class="stat-break"
          >
            Break {{ stats.breaks }}
          </span>
        </div>
      </div>

      <!-- Per-type items -->
      <div
        v-for="item in statItems"
        :key="item.key"
        class="stat-item"
        :class="{ 'has-break': item.breakKey && stats[item.breakKey] > 0 }"
      >
        <span class="stat-label">{{ item.label }}</span>
        <div class="stat-value-container">
          <span class="stat-value">{{ fmt(stats[item.key]) }}</span>
          <span
            v-if="item.breakKey && stats[item.breakKey] > 0"
            class="stat-break"
          >
            Break {{ stats[item.breakKey] }}
          </span>
        </div>
      </div>

      <!-- EX -->
      <div class="stat-item">
        <span class="stat-label">EX 音符</span>
        <div class="stat-value-container">
          <span class="stat-value">{{ fmt(stats.ex) }}</span>
        </div>
      </div>

      <!-- Break -->
      <div class="stat-item stat-item--break">
        <span class="stat-label">Break 音符</span>
        <div class="stat-value-container">
          <span class="stat-value">{{ fmt(stats.breaks) }}</span>
        </div>
      </div>

      <!-- no-ex-Break -->
      <div class="stat-item stat-item--no-ex-break">
        <span class="stat-label">no-ex-Break</span>
        <div class="stat-value-container">
          <span class="stat-value">{{ fmt(stats.noExBreaks) }}</span>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { useSimaiEditor } from '@/composables/useSimaiEditor'

const { stats } = useSimaiEditor()

const statItems = [
  { label: '單擊 (Tap)',          key: 'taps',       breakKey: 'breakTaps'       },
  { label: '長條 (Hold)',         key: 'holds',      breakKey: 'breakHolds'      },
  { label: '滑條 (Slide)',        key: 'slides',     breakKey: 'breakSlides'     },
  { label: '觸控 (Touch)',        key: 'touches',    breakKey: 'breakTouches'    },
  { label: '觸控長條 (TouchHold)',key: 'touchHolds', breakKey: 'breakTouchHolds' },
]

function fmt(n) { return n > 0 ? n : '-' }
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.stats-bar {
  @include card;
  display: flex;
  align-items: center;
  padding: 0.5rem 1.2rem;
  gap: 1.2rem;
  width: 100%;
  flex-shrink: 0;
}

.stats-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  padding-right: 1.2rem;
  flex-shrink: 0;
}

.stats-title-icon {
  font-size: 1.1rem;
}

.stats-title-text {
  font-size: 0.85rem;
  font-weight: 600;
  color: $text-secondary;
  letter-spacing: 0.5px;
}

.stats-items {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  overflow-x: auto;
  padding-bottom: 4px;

  &::-webkit-scrollbar { height: 4px; }
  &::-webkit-scrollbar-track { background: rgba(0,0,0,0.05); border-radius: 2px; }
  &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
  &::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
}

.stat-item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 0.35rem 0.75rem;
  min-width: 105px;
  flex-shrink: 0;
  transition: all 0.15s ease;

  &:hover {
    border-color: rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.02);
  }

  &.has-break {
    border-color: rgba(255, 145, 0, 0.15);
  }

  &--total {
    background: rgba(124, 77, 255, 0.08);
    border-color: rgba(124, 77, 255, 0.22);
    min-width: 120px;

    .stat-label {
      color: #b39ddb;
    }

    .stat-value {
      color: var(--accent);
      font-size: 1.1rem;
    }
  }

  &--break {
    background: rgba(255, 145, 0, 0.08);
    border-color: rgba(255, 145, 0, 0.22);
    min-width: 120px;

    .stat-label {
      color: #ffb74d;
    }

    .stat-value {
      color: var(--color-break, #ff9100);
      font-size: 1.1rem;
    }
  }

  &--no-ex-break {
    background: rgba(255, 109, 0, 0.08);
    border-color: rgba(255, 109, 0, 0.22);
    min-width: 120px;

    .stat-label {
      color: #ff9e80;
    }

    .stat-value {
      color: #ff6d00;
      font-size: 1.1rem;
    }
  }
}

.stat-label {
  font-size: 0.68rem;
  color: $text-secondary;
  font-weight: 500;
  margin-bottom: 0.15rem;
  letter-spacing: 0.2px;
}

.stat-value-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.stat-value {
  font-size: 0.95rem;
  font-weight: 700;
  color: #fff;
}

.stat-break {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--color-break, #ff9100);
  background: rgba(255, 145, 0, 0.08);
  border: 1px solid rgba(255, 145, 0, 0.2);
  border-radius: 4px;
  padding: 1px 4px;
  letter-spacing: 0.2px;
}
</style>
