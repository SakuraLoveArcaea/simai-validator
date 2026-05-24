<template>
  <div class="editor-card">
    <!-- Card Header -->
    <div class="card-header">
      <span class="header-dot red" />
      <span class="header-dot yellow" />
      <span class="header-dot green" />
      <span class="card-title">編輯器 — 純譜面數據</span>
      <div class="editor-actions">
        <button
          class="action-btn toggle-btn toggle-btn--comma"
          :class="{ active: superComma }"
          @click="toggleSuperComma"
        >
          逗號超級高亮：{{ superComma ? '開啟' : '關閉' }}
        </button>
        <button
          class="action-btn toggle-btn toggle-btn--bothslide"
          :class="{ active: bothSlide }"
          @click="toggleBothSlide"
        >
          雙滑條黃色高亮：{{ bothSlide ? '開啟' : '關閉' }}
        </button>
        <button class="action-btn" id="btn-copy" @click="handleCopy">📋 複製</button>
        <button class="action-btn" @click="handleClear">🧹 清空</button>
      </div>
    </div>

    <!-- Tab Bar -->
    <div class="tab-bar">
      <div class="tabs-scroll">
        <div
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-item"
          :class="{ active: tab.id === activeTabId }"
          @click="selectTab(tab.id)"
        >
          <span class="tab-title" title="雙擊重新命名" @dblclick="onRenameTab(tab)">
            {{ tab.name }}
          </span>
          <span
            v-if="tabs.length > 1"
            class="tab-close"
            title="關閉分頁"
            @click.stop="closeTab(tab.id)"
          >×</span>
        </div>
      </div>
      <button class="add-tab-btn" title="新增分頁" @click="createTab()">+</button>
    </div>

    <!-- Monaco Mount Target -->
    <div class="editor-viewport">
      <div ref="editorEl" class="editor-mount" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, markRaw } from 'vue'
import { useSimaiEditor } from '@/composables/useSimaiEditor'

// ─── Composable API ────────────────────────────────────────────
const editor = useSimaiEditor()
const { tabs, activeTabId, selectTab, closeTab, createTab, renameTab,
        superComma, toggleSuperComma,
        bothSlide, toggleBothSlide,
        setMonacoInstance, getEditorValue, setEditorValue, validate } = editor

const editorEl = ref(null)
let monacoEditor = null

// ─── Presets ───────────────────────────────────────────────────
const PRESET_VALID = `&title=Test Valid Song
&artist=Antigravity
&bpm=150
&first=0.5
&inote_master=
(150){4}1,2,3,4,
(150){8}1/2,3/4,5/6,7/8,
{16}1-5[8:1],2<6[8:1],
3pp7[8:1],4qq8[8:1],
1h[4:1],5bh[4:1],
A1h[4:1],Ch[4:1],
1-5*-8[8:1],
6V42[4:3],
1>8[90#8:7]*>7[90#4:3]*>6[90#8:5],
E`

const PRESET_INVALID = `&title=Test Invalid Song
&artist=Antigravity
&bpm=INVALID_BPM
&first=0.5
&inote_master=
(150{4}1,2,3,4,
(150){8}1/2,3/4,5/6,9,
{16}1-[8:1],2<[8:1],
3pp7[8:1,4qq8[8:1],
A,Ch[4],
1-5* ,
E
1,2,3`

function chartOnly(preset) {
  const lines = preset.split('\n')
  const idx = lines.findIndex(l => l.startsWith('&inote_'))
  return idx !== -1 ? lines.slice(idx + 1).join('\n') : preset
}

// ─── Exposed to parent ─────────────────────────────────────────
function loadValid()   { setEditorValue(chartOnly(PRESET_VALID)) }
function loadInvalid() { setEditorValue(chartOnly(PRESET_INVALID)) }
defineExpose({ loadValid, loadInvalid })

// ─── Tab rename ────────────────────────────────────────────────
function onRenameTab(tab) {
  const name = prompt('請輸入新的分頁名稱：', tab.name)
  if (name) renameTab(tab.id, name)
}

// ─── Copy / Clear ──────────────────────────────────────────────
async function handleCopy() {
  await navigator.clipboard.writeText(getEditorValue())
  const btn = document.getElementById('btn-copy')
  const orig = btn.textContent
  btn.textContent = '✓ 已複製！'
  btn.style.color = '#4caf50'
  btn.style.borderColor = '#4caf50'
  setTimeout(() => { btn.textContent = orig; btn.style.color = ''; btn.style.borderColor = '' }, 1500)
}
function handleClear() { setEditorValue('') }

// ─── Monaco initialization ─────────────────────────────────────
onMounted(() => {
  window.require.config({
    paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs' }
  })

  window.require(['vs/editor/editor.main'], (monaco) => {
    // Register languages
    monaco.languages.register({ id: 'simai-chart' })
    monaco.languages.register({ id: 'simai-file' })

    // Build regex note rules inline (no serialization needed — same JS context as AMD)
    const noteRules = [
      [/[\/`]/, 'delimiter.group'],
      [/\([\d.]+\)/, 'number.bpm'],
      [/\{[^}]+\}/, 'number.subdiv'],
      [/\[(?:[^\]]*##[^\]]*|[^\]]*#[^\]]*|[^\]]*:[^\]]*)\]/, 'string.duration'],
      [/\*/, 'operator.joiner'],
      [/,/, 'delimiter.comma'],
      [/V(?:[1-8]|[A-E][1-8]?){2}/, 'operator.shape'],
      [/(?:pp|qq|[><^vpqszVw-])(?:[1-8]|[A-E][1-8]?)/, 'operator.shape'],
      [/[><^vpqszVw-]|pp|qq/, 'operator.shape'],
      [/b/, 'keyword.modifier.break'],
      [/x/, 'keyword.modifier.ex'],
      [/h/, 'keyword.modifier.hold'],
      [/f/, 'keyword.modifier.fireworks'],
      [/[m!?@$]/, 'keyword.modifier'],
      [/\bE\b/, 'keyword.end'],
      [/[1-8]/, 'number.button'],
      [/[A-E][1-8]?/, 'number.sensor'],
      [/\|\|.*/, 'comment'],
    ]

    monaco.languages.setMonarchTokensProvider('simai-chart', {
      defaultToken: '',
      tokenizer: { root: [...noteRules, [/^[ \t\r\n]+/, 'white']] }
    })

    monaco.languages.setMonarchTokensProvider('simai-file', {
      defaultToken: '',
      tokenizer: {
        root: [
          [/^(&inote_\w+)(=)(.*)$/, ['keyword.meta.key', 'delimiter', { token: 'string.meta.val', next: '@chart' }]],
          [/^(&\w+)(=)(.*)$/, ['keyword.meta.key', 'delimiter', 'string.meta.val']],
          [/^[^&].*$/, 'string.meta.val'],
          [/^[ \t\r\n]+/, 'white'],
        ],
        chart: [
          [/^&\w+/, { token: 'keyword.meta.key', next: '@pop' }],
          ...noteRules,
          [/^[ \t\r\n]+/, 'white'],
        ]
      }
    })

    // Completion provider
    const completionProvider = {
      provideCompletionItems() {
        return { suggestions: [
          { label: 'BPM 變更',    kind: monaco.languages.CompletionItemKind.Snippet, insertText: '(${1:150})',         insertTextRules: monaco.languages.CompletionItemRules.InsertAsSnippet, documentation: '插入 BPM 變更' },
          { label: '分音 {4}',   kind: monaco.languages.CompletionItemKind.Snippet, insertText: '{4}',               documentation: '四分音符' },
          { label: '分音 {8}',   kind: monaco.languages.CompletionItemKind.Snippet, insertText: '{8}',               documentation: '八分音符' },
          { label: '分音 {16}',  kind: monaco.languages.CompletionItemKind.Snippet, insertText: '{16}',              documentation: '十六分音符' },
          { label: '直線 Slide', kind: monaco.languages.CompletionItemKind.Snippet, insertText: '-${1:5}[${2:8:1}]', insertTextRules: monaco.languages.CompletionItemRules.InsertAsSnippet, documentation: '直線滑鍵' },
          { label: '順時針弧線', kind: monaco.languages.CompletionItemKind.Snippet, insertText: '>${1:5}[${2:8:1}]', insertTextRules: monaco.languages.CompletionItemRules.InsertAsSnippet, documentation: '順時針弧線' },
          { label: '逆時針弧線', kind: monaco.languages.CompletionItemKind.Snippet, insertText: '<${1:5}[${2:8:1}]', insertTextRules: monaco.languages.CompletionItemRules.InsertAsSnippet, documentation: '逆時針弧線' },
          { label: '結束標記 E', kind: monaco.languages.CompletionItemKind.Keyword,  insertText: 'E',                documentation: '譜面結束標記' },
        ]}
      }
    }
    monaco.languages.registerCompletionItemProvider('simai-chart', completionProvider)
    monaco.languages.registerCompletionItemProvider('simai-file',  completionProvider)

    // Create initial model & tab
    const defaultContent = chartOnly(PRESET_VALID)
    const firstTabId = 'tab_default'
    const firstModel = markRaw(monaco.editor.createModel(defaultContent, 'simai-chart'))
    tabs.push({ id: firstTabId, name: '譜面 1.txt', model: firstModel })
    activeTabId.value = firstTabId

    firstModel.onDidChangeContent(() => {
      if (activeTabId.value === firstTabId) validate()
    })

    // Create editor instance
    monacoEditor = monaco.editor.create(editorEl.value, {
      model: firstModel,
      theme: 'simai-dark',
      fontSize: 14,
      fontFamily: "'Fira Code', monospace",
      lineHeight: 22,
      minimap: { enabled: false },
      automaticLayout: true,
      wordWrap: 'on',
      tabSize: 4,
    })

    // Hand off to the composable (triggers theme application + first validate)
    setMonacoInstance(monaco, monacoEditor)
  })
})

onBeforeUnmount(() => { monacoEditor?.dispose() })
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.editor-card {
  @include card;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.card-header {
  display: flex;
  align-items: center;
  padding: 0.8rem 1.2rem;
  border-bottom: 1px solid $border;
  gap: 0.5rem;
  flex-shrink: 0;
}

.header-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  &.red    { background: #ff5f56; }
  &.yellow { background: #ffbd2e; }
  &.green  { background: #27c93f; }
}

.card-title {
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: $text-secondary;
  margin-left: 0.25rem;
}

.editor-actions {
  margin-left: auto;
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  background: rgba(255,255,255,0.03);
  border: 1px solid $border;
  color: $text-secondary;
  padding: 3px 10px;
  font-size: 0.8rem;
  font-weight: 600;
  font-family: $font-ui;
  border-radius: $radius-sm;
  cursor: pointer;
  transition: $transition-base;

  &:hover {
    background: rgba(255,255,255,0.08);
    color: $text-primary;
    border-color: rgba(255,255,255,0.2);
    transform: translateY(-1px);
  }
  &:active { transform: translateY(0); }

  &.toggle-btn {
    &.active {
      background: rgba(255, 23, 68, 0.15) !important;
      border-color: rgba(255, 23, 68, 0.4) !important;
      color: #ff5f56 !important;
      box-shadow: 0 0 8px rgba(255, 23, 68, 0.2);
    }

    &.toggle-btn--comma.active {
      background: rgba(0, 255, 102, 0.12) !important;
      border-color: rgba(0, 255, 102, 0.35) !important;
      color: #00ff66 !important;
      box-shadow: 0 0 8px rgba(0, 255, 102, 0.15);
    }

    &.toggle-btn--bothslide.active {
      background: rgba(255, 214, 0, 0.12) !important;
      border-color: rgba(255, 214, 0, 0.35) !important;
      color: #ffd600 !important;
      box-shadow: 0 0 8px rgba(255, 214, 0, 0.15);
    }
  }
}

.tab-bar {
  display: flex;
  align-items: center;
  background: rgba(0,0,0,0.25);
  border-bottom: 1px solid $border;
  padding: 0 0.5rem;
  height: 38px;
  gap: 0.5rem;
  flex-shrink: 0;
}

.tabs-scroll {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  flex: 1;
  height: 100%;
  align-items: flex-end;
  &::-webkit-scrollbar { display: none; }
}

.tab-item {
  display: flex;
  align-items: center;
  background: rgba(255,255,255,0.03);
  border: 1px solid $border;
  border-bottom: none;
  border-top-left-radius: $radius-sm;
  border-top-right-radius: $radius-sm;
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
  color: $text-secondary;
  cursor: pointer;
  transition: $transition-base;
  height: 30px;
  gap: 0.5rem;
  min-width: 80px;
  max-width: 150px;
  user-select: none;

  &:hover { background: rgba(255,255,255,0.08); color: $text-primary; }
  &.active {
    background: $bg-editor;
    color: var(--accent);
    border-top: 2px solid var(--accent);
    font-weight: 600;
  }
}

.tab-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.tab-close {
  font-size: 0.85rem;
  width: 14px; height: 14px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: $transition-fast;
  flex-shrink: 0;
  &:hover { background: rgba(255,255,255,0.15); color: #ff1744; }
}

.add-tab-btn {
  background: transparent;
  border: none;
  color: $text-secondary;
  font-size: 1.2rem;
  width: 28px; height: 28px;
  border-radius: $radius-sm;
  cursor: pointer;
  @include flex-center;
  transition: $transition-base;
  flex-shrink: 0;
  &:hover { background: rgba(255,255,255,0.08); color: $text-primary; }
}

.editor-viewport {
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
  background: $bg-editor;
  border-bottom-left-radius: $radius-lg;
  border-bottom-right-radius: $radius-lg;
}

.editor-mount {
  width: 100%; height: 100%;
  position: absolute;
  inset: 0;
}
</style>
