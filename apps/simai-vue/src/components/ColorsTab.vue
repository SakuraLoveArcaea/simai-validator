<template>
  <div class="colors-tab">
    <p class="desc">此處說明兩種著色模式下的高亮顏色規則。模式切換請使用頂部導覽列（Navbar）的切換按鈕。</p>
    
    <div class="legend-container">
      <!-- Column 1: Token Mode -->
      <div class="legend-column">
        <h3 class="column-title">🎨 Token 分色模式說明</h3>
        <p class="column-desc">根據語法標記與符號種類單獨著色，利於編譯結構識別。</p>
        
        <div class="palette-grid">
          <div
            v-for="item in tokenItems"
            :key="item.label"
            class="color-row"
          >
            <span
              class="color-indicator"
              :style="{ backgroundColor: item.indicatorColor }"
            />
            <label class="color-label">{{ item.label }}</label>
            <span
              class="color-preview"
              :class="item.previewClass"
              :style="{ color: item.previewColor }"
            >
              {{ item.preview }}
            </span>
            <span class="color-hint">{{ item.hint }}</span>
          </div>
        </div>
      </div>

      <!-- Column 2: Object Mode -->
      <div class="legend-column">
        <h3 class="column-title">🎮 遊戲物件分色模式說明</h3>
        <p class="column-desc">根據音符最終的遊戲物件型別進行整體著色，利於讀譜實操。</p>
        
        <div class="palette-grid">
          <div
            v-for="item in objectItems"
            :key="item.label"
            class="color-row"
          >
            <span
              class="color-indicator"
              :class="item.indicatorClass"
              :style="item.indicatorColor ? { backgroundColor: item.indicatorColor } : {}"
            />
            <label class="color-label">{{ item.label }}</label>
            <span
              class="color-preview"
              :class="item.previewClass"
              :style="item.previewColor ? { color: item.previewColor } : {}"
            >
              {{ item.preview }}
            </span>
            <span class="color-hint">{{ item.hint }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useSimaiEditor } from '@/composables/useSimaiEditor'

const { colors } = useSimaiEditor()

// Helper to darken a color reactively
function getDarkenedColor(hex, percent) {
  if (!hex) return ''
  hex = hex.replace(/^\s*#|\s*$/g, '')
  if (hex.length === 3) hex = hex.replace(/(.)/g, '$1$1')
  let r = parseInt(hex.substring(0, 2), 16)
  let g = parseInt(hex.substring(2, 4), 16)
  let b = parseInt(hex.substring(4, 6), 16)
  r = Math.max(0, Math.floor(r * (1 - percent)))
  g = Math.max(0, Math.floor(g * (1 - percent)))
  b = Math.max(0, Math.floor(b * (1 - percent)))
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`
}

const eachRightColor = computed(() => getDarkenedColor(colors.each, 0.25))

const tokenItems = computed(() => [
  { label: '按鍵位置 (1-8)',    preview: '1',     indicatorColor: colors.tap,       previewColor: colors.tap,       hint: '單擊按鍵位置（粉紅色）' },
  { label: '長條標記 (h)',      preview: 'h',     indicatorColor: colors.hold,      previewColor: colors.hold,      hint: 'Hold 修飾符（粉紅色）' },
  { label: 'slide 標記 (-, >, <)', preview: '-5',    indicatorColor: colors.slide,     previewColor: colors.slide,     hint: 'slide 移動軌跡（藍色）' },
  { label: '觸控感應 (A-E)',    preview: 'A1',    indicatorColor: colors.touch,     previewColor: colors.touch,     hint: 'Touch 觸控區域（青藍色）' },
  { label: '觸控長條 (Ch)',     preview: 'Ch',    indicatorColor: colors.touchHold, previewColor: colors.touchHold, hint: 'TouchHold 語法標記（洋紅色）' },
  { label: 'break 標記 (b)',    preview: 'b',     indicatorColor: colors.break,     previewColor: colors.break,     hint: 'break 修飾符（霓虹橘色）' },
  { label: '同時按鍵 (/, `)',    preview: '/',     indicatorColor: getDarkenedColor(colors.each, 0.4), previewColor: getDarkenedColor(colors.each, 0.4), hint: '同時音符分隔符（/ 與 ` 邏輯與功能完全相同，皆高亮為深黃色）' },
  { label: '時間步逗號 (,)',    preview: ',',     indicatorColor: '#546e7a',        previewColor: '#546e7a',        hint: '時間步分隔符（暗灰色）' },
  { label: '煙火標記 (f)',      preview: 'f',     indicatorColor: '#d500f9',        previewColor: '#d500f9',        hint: '煙火效果修飾符（霓虹紫色，粗體）' },
  { label: 'EX 修飾 (x)',       preview: 'x',     indicatorColor: '#ffffff',        previewColor: '#ffffff',        previewClass: 'ex-style', hint: 'EX 判定修飾符（白色，帶輕微白邊效果，粗斜體）' },
  { label: '持續時間 ([...])',  preview: '[4:1]', indicatorColor: colors.dur,       previewColor: colors.dur,       previewClass: 'dur-style', hint: 'Hold/Slide 時間（亮綠色，斜體）' },
])

const objectItems = computed(() => [
  { label: '單擊 (Tap)',        preview: '1',     indicatorColor: colors.tap,       previewColor: colors.tap,       hint: '一般單擊音符（粉紅色）' },
  { label: '長條 (Hold)',       preview: '1h',    indicatorColor: colors.hold,      previewColor: colors.hold,      hint: '一般長條音符（粉紅色）' },
  { label: 'slide',             preview: '1-5',   indicatorColor: colors.slide,     previewColor: colors.slide,     hint: 'slide 音符整體（藍色）' },
  { label: '觸控 (Touch)',      preview: 'A1',    indicatorColor: colors.touch,     previewColor: colors.touch,     hint: '一般觸控音符（可附加 f 煙火，如 B7f，藍綠色）' },
  { label: '觸控長條 (TouchHold)',preview: 'Ch',    indicatorClass: 'gradient-indicator', previewClass: 'gradient-text', hint: '觸控長條（可並記 f 煙火，如 Chf/Cfh，彩虹漸變色）' },
  { label: 'break',             preview: '1b',    indicatorColor: colors.break,     previewColor: colors.break,     hint: 'break 音符（橘色）' },
  { label: '雙擊 - 左側 (Both-L)', preview: '1/',    indicatorColor: colors.each,      previewColor: colors.each,      hint: '雙擊組左側音符（不論用 / 或 ` 連接，雙擊首音符高亮為亮黃色）' },
  { label: '雙擊 - 右側 (Both-R)', preview: '/5',    indicatorColor: eachRightColor.value, previewColor: eachRightColor.value, hint: '雙擊組右側音符（不論用 / 或 ` 連接，雙擊次音符高亮為深黃色/橘黃色）' },
  { label: 'EX 修飾 (EX Note)',  preview: '1x',    indicatorColor: colors.tap,       previewColor: colors.tap,       previewClass: 'ex-style', hint: 'EX 判定（保留原音符色，帶輕微白邊效果，呈粗斜體）' },
  { label: '持續時間 ([...])',  preview: '[4:1]', indicatorColor: colors.dur,       previewColor: colors.dur,       previewClass: 'dur-style', hint: '持續時間（亮綠色，斜體）' },
])
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.colors-tab {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.desc {
  font-size: 0.87rem;
  color: $text-secondary;
  line-height: 1.5;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  padding-bottom: 0.8rem;
}

.legend-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.6rem;
}

.legend-column {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.column-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--accent);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.column-desc {
  font-size: 0.8rem;
  color: $text-secondary;
  line-height: 1.4;
  opacity: 0.8;
  margin-bottom: 0.2rem;
}

.palette-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.color-row {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  background: rgba(255,255,255,0.02);
  border: 1px solid $border;
  border-radius: 8px;
  padding: 0.5rem 0.8rem;
  transition: border-color 0.2s ease, background 0.2s ease;

  &:hover {
    border-color: rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04);
  }
}

.color-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1px solid rgba(255,255,255,0.15);

  &.gradient-indicator {
    background: linear-gradient(90deg, #ff2e93 0%, #ffd600 35%, #00e676 70%, #29b6f6 100%) !important;
  }
}

.color-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: $text-primary;
  min-width: 120px;
}

.color-preview {
  font-family: $font-code;
  font-size: 0.9rem;
  font-weight: 700;
  min-width: 45px;
  text-align: center;
  flex-shrink: 0;

  &.ex-style {
    font-style: italic !important;
    font-weight: bold !important;
    text-shadow: 
      0 0 1px #fff,
      0 0 2px #fff,
      0 0 3px rgba(255, 255, 255, 0.8) !important;
  }

  &.dur-style {
    font-style: italic !important;
  }
}

.gradient-text {
  background: linear-gradient(90deg, #ff2e93 0%, #ffd600 35%, #00e676 70%, #29b6f6 100%) !important;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  background-clip: text !important;
  display: inline-block;
}

.color-hint {
  font-size: 0.76rem;
  color: $text-secondary;
  flex: 1;
  line-height: 1.3;
}
</style>
