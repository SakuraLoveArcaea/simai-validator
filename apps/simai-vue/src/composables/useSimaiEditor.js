/**
 * useSimaiEditor — Central state & logic composable (Singleton)
 *
 * Two color modes:
 *   'token'  — Monarch tokenizer; each syntax token type gets its own color
 *   'object' — Monaco Decorations; each character colored by the game note it belongs to
 *
 * Duration `[...]` always uses its own color in BOTH modes.
 */
import { reactive, ref } from 'vue'
import { validateSimaiFile, Tokenizer, TokenType } from 'simai-core'

// ─── Default palette ─────────────────────────────────────────────
export const DEFAULT_COLORS = {
  tap:       '#ff2e93',
  hold:      '#ff2e93',
  slide:     '#29b6f6',
  touch:     '#00bcd4',
  touchHold: '#e040fb',
  break:     '#ff9100',
  ex:        '#00e5ff',
  each:      '#ffd600',
  dur:       '#b2ff59',
}

// ─── Singleton state ─────────────────────────────────────────────
const colors      = reactive({ ...DEFAULT_COLORS })
const colorMode   = ref('object')   // 'token' | 'object'
const superComma  = ref(false)
const bothSlide   = ref(false)
const tabs        = reactive([])
const activeTabId = ref(null)
const diagnostics = reactive([])

const stats = reactive({
  total: 0,
  taps: 0,        breakTaps: 0,
  holds: 0,       breakHolds: 0,
  slides: 0,      breakSlides: 0,
  touches: 0,     breakTouches: 0,
  touchHolds: 0,  breakTouchHolds: 0,
  ex: 0,
  breaks: 0,
  noExBreaks: 0,
  bpms: 0,
})

let editorInstance  = null
let monacoRef       = null
let decorCollection = null   // monaco.editor.IDecorationsCollection

// ─── Helpers ─────────────────────────────────────────────────────
function darkenColor(hex, percent) {
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

// ─── Token walker (shared by stats + object coloring) ────────────
function consumeNote(tokens, startIndex) {
  let idx = startIndex
  const firstToken = tokens[idx]

  let isHold = false, isSlide = false
  let isBreakTap = false
  let isEx = false, isTouch = false
  let slideNoteCount = 0, breakSlideNoteCount = 0

  if (firstToken.type === TokenType.Location) {
    idx++
    isTouch = firstToken.value.length > 1 || firstToken.value === 'C'
    while (idx < tokens.length && tokens[idx].type === TokenType.Decorator) {
      const v = tokens[idx].value
      if (v === 'h') isHold = true
      if (v === 'b') isBreakTap = true
      if (v === 'x') isEx = true
      idx++
    }
    if (isHold && idx < tokens.length && tokens[idx].type === TokenType.Duration) idx++
  }

  if (idx < tokens.length && tokens[idx].type === TokenType.Slide) {
    isSlide = true
    slideNoteCount = 1
    let currentSlideHasBreak = false

    while (idx < tokens.length) {
      if (tokens[idx].type === TokenType.Slide) {
        idx++
        while (idx < tokens.length && tokens[idx].type === TokenType.Location) idx++
        while (idx < tokens.length) {
          const t = tokens[idx].type
          if (t === TokenType.Duration) { idx++; continue }
          if (t === TokenType.Decorator) {
            if (tokens[idx].value === 'b') currentSlideHasBreak = true
            if (tokens[idx].value === 'x') isEx = true
            idx++; continue
          }
          break
        }
      } else if (tokens[idx].type === TokenType.SlideJoiner) {
        if (currentSlideHasBreak) breakSlideNoteCount++
        slideNoteCount++
        currentSlideHasBreak = false
        idx++
      } else {
        break
      }
    }
    if (currentSlideHasBreak) breakSlideNoteCount++
  }

  return {
    nextIndex: idx,
    startToken: firstToken,
    consumed: tokens.slice(startIndex, idx),
    hasStartLocation: firstToken.type === TokenType.Location,
    isHold, isSlide, isTouch,
    isBreakTap,
    breakSlideNoteCount,
    slideNoteCount,
    isEx,
  }
}

// ─── Statistics ───────────────────────────────────────────────────
function computeStats(tokens) {
  let taps = 0, breakTaps = 0, holds = 0, breakHolds = 0
  let slides = 0, breakSlides = 0, touches = 0, breakTouches = 0
  let touchHolds = 0, breakTouchHolds = 0, ex = 0, noExBreaks = 0, bpms = 0

  let i = 0
  while (i < tokens.length) {
    const tok = tokens[i]
    if (tok.type === TokenType.Tempo) { bpms++; i++; continue }
    if (tok.type === TokenType.Location || tok.type === TokenType.Slide) {
      const note = consumeNote(tokens, i)
      i = note.nextIndex

      if (note.isEx) ex++

      if (note.isSlide) {
        slides      += note.slideNoteCount
        breakSlides += note.breakSlideNoteCount
        if (note.hasStartLocation) {
          if (note.isBreakTap) {
            breakTaps++
            if (!note.isEx) noExBreaks++
          } else {
            taps++
          }
        }
      } else if (note.isHold && note.isTouch) {
        if (note.isBreakTap) { breakTouchHolds++ } else { touchHolds++ }
      } else if (note.isHold) {
        if (note.isBreakTap) {
          breakHolds++
          if (!note.isEx) noExBreaks++
        } else {
          holds++
        }
      } else if (note.isTouch) {
        if (note.isBreakTap) { breakTouches++ } else { touches++ }
      } else {
        if (note.isBreakTap) {
          breakTaps++
          if (!note.isEx) noExBreaks++
        } else {
          taps++
        }
      }
      continue
    }
    i++
  }

  const total = taps + breakTaps + holds + breakHolds +
                slides + touches + breakTouches +
                touchHolds + breakTouchHolds
  const breaks = breakTaps + breakHolds + breakSlides + breakTouches + breakTouchHolds

  Object.assign(stats, {
    total, taps, breakTaps, holds, breakHolds,
    slides, breakSlides, touches, breakTouches,
    touchHolds, breakTouchHolds, ex, breaks, noExBreaks, bpms,
  })
}

// ─── Game Object Decoration pass ─────────────────────────────────
/**
 * Map each token in a note's consumed list to a CSS class name.
 * Duration is ALWAYS 'deco-dur' regardless of note type.
 * The "each" dividers within a timestep get 'deco-each'.
 */
function noteClass(note) {
  if (note.isBreakTap)                return 'deco-break'
  if (note.isHold && note.isTouch)    return 'deco-touch-hold'
  if (note.isHold)                    return 'deco-hold'
  if (note.isTouch)                   return 'deco-touch'
  return 'deco-tap'
}

function buildDecorations(tokens) {
  if (!monacoRef) return []
  const decos = []

  function makeRange(tok) {
    return new monacoRef.Range(
      tok.line, tok.col,
      tok.line, tok.col + tok.value.length
    )
  }
  function push(tok, cls) {
    decos.push({ range: makeRange(tok), options: { inlineClassName: cls } })
  }

  // Partition tokens into timesteps
  const timesteps = []
  let currentTimestepTokens = []
  for (const tok of tokens) {
    if (tok.type === TokenType.TimeStep) {
      timesteps.push({ tokens: currentTimestepTokens, commaToken: tok })
      currentTimestepTokens = []
    } else {
      currentTimestepTokens.push(tok)
    }
  }
  if (currentTimestepTokens.length > 0) {
    timesteps.push({ tokens: currentTimestepTokens, commaToken: null })
  }

  const isObjectMode = colorMode.value === 'object'

  for (const ts of timesteps) {
    const tsTokens = ts.tokens
    
    if (isObjectMode) {
      // Parse notes in this timestep
      const notesInTs = []
      let i = 0
      while (i < tsTokens.length) {
        const tok = tsTokens[i]
        if (tok.type === TokenType.Location || tok.type === TokenType.Slide) {
          const note = consumeNote(tsTokens, i)
          notesInTs.push(note)
          i = note.nextIndex
        } else {
          // Non-note token (Tempo, Subdivision, SlideJoiner, EachDivider, EndOfFile, etc.)
          if (tok.type === TokenType.Tempo)       { push(tok, 'deco-bpm'); }
          else if (tok.type === TokenType.Subdivision) { push(tok, 'deco-subdiv'); }
          else if (tok.type === TokenType.SlideJoiner) { push(tok, 'deco-joiner'); }
          else if (tok.type === TokenType.EachDivider) { push(tok, 'deco-each'); }
          else if (tok.type === TokenType.EndOfFile)   { push(tok, 'deco-end'); }
          else if (tok.type === TokenType.Duration)    { push(tok, 'deco-dur'); }
          i++
        }
      }

      // If there is a comma, push it
      if (ts.commaToken) {
        push(ts.commaToken, superComma.value ? 'deco-comma-super' : 'deco-comma')
      }

      // Decorate the notes in this timestep
      const numNotes = notesInTs.length
      
      let totalSlidesInTs = 0
      for (const n of notesInTs) {
        if (n.isSlide) {
          totalSlidesInTs += n.slideNoteCount
        }
      }

      for (let noteIdx = 0; noteIdx < numNotes; noteIdx++) {
        const note = notesInTs[noteIdx]
        
        // Determine base class for this note
        let baseClass = ''
        if (numNotes === 2) {
          baseClass = noteIdx === 0 ? 'deco-each-left' : 'deco-each-right'
        } else if (numNotes > 2) {
          baseClass = 'deco-each'
        } else {
          baseClass = noteClass(note)
        }

        const exClass = note.isEx ? ' deco-ex' : ''

        // Determine bothslide highlight class
        let bothSlideClass = ''
        if (bothSlide.value && totalSlidesInTs >= 2) {
          if (numNotes === 2) {
            bothSlideClass = noteIdx === 0 ? 'deco-each-left' : 'deco-each-right'
          } else {
            bothSlideClass = 'deco-each'
          }
        }

        // Pre-scan segments to check which ones are break segments
        const segments = []
        let currentSegment = null
        for (const t of note.consumed) {
          if (t.type === TokenType.Slide) {
            if (currentSegment) segments.push(currentSegment)
            currentSegment = { tokens: [t], isBreak: false }
          } else if (t.type === TokenType.SlideJoiner) {
            if (currentSegment) {
              segments.push(currentSegment)
              currentSegment = null
            }
          } else {
            if (currentSegment) {
              currentSegment.tokens.push(t)
              if (t.type === TokenType.Decorator && t.value === 'b') {
                currentSegment.isBreak = true
              }
            }
          }
        }
        if (currentSegment) segments.push(currentSegment)

        const isBreakSegmentToken = new Map()
        for (const seg of segments) {
          for (const t of seg.tokens) {
            isBreakSegmentToken.set(t, seg.isBreak)
          }
        }
        
        // Decorate note's consumed tokens
        let inSlide = false
        for (const t of note.consumed) {
          if (t.type === TokenType.Duration) {
            push(t, 'deco-dur')
            continue
          }
          if (t.type === TokenType.SlideJoiner) {
            push(t, 'deco-joiner')
            continue
          }
          if (t.type === TokenType.Slide) {
            inSlide = true
            const isBreak = isBreakSegmentToken.get(t) || false
            if (isBreak) {
              push(t, 'deco-break')
            } else if (bothSlideClass) {
              push(t, bothSlideClass)
            } else {
              push(t, 'deco-slide')
            }
            continue
          }
          if (inSlide && t.type === TokenType.Location) {
            const isBreak = isBreakSegmentToken.get(t) || false
            if (isBreak) {
              push(t, 'deco-break')
            } else if (bothSlideClass) {
              push(t, bothSlideClass)
            } else {
              push(t, 'deco-slide')
            }
            continue
          }
          if (inSlide && t.type === TokenType.Decorator) {
            const isBreak = isBreakSegmentToken.get(t) || false
            const checkBreak = t.value === 'b' || isBreak
            if (checkBreak) {
              push(t, 'deco-break')
            } else if (bothSlideClass) {
              push(t, bothSlideClass)
            } else {
              push(t, 'deco-slide')
            }
            continue
          }
          push(t, baseClass + exClass)
        }
      }
    } else {
      // Token Mode: identify tokens belonging to EX notes (start keypress only) to apply white glow decoration
      const exTokens = new Set()
      let i = 0
      while (i < tsTokens.length) {
        const tok = tsTokens[i]
        if (tok.type === TokenType.Location || tok.type === TokenType.Slide) {
          const note = consumeNote(tsTokens, i)
          i = note.nextIndex
          if (note.isEx) {
            let inSlide = false
            for (const t of note.consumed) {
              if (t.type === TokenType.Slide) {
                inSlide = true
              }
              if (!inSlide) {
                if (t.type !== TokenType.Duration && t.type !== TokenType.SlideJoiner) {
                  exTokens.add(t)
                }
              }
            }
          }
        } else {
          i++
        }
      }

      // Push decorations
      for (const tok of tsTokens) {
        if (exTokens.has(tok) || (tok.type === TokenType.Decorator && tok.value === 'x')) {
          push(tok, 'deco-ex')
        }
      }

      if (superComma.value && ts.commaToken) {
        push(ts.commaToken, 'deco-comma-super')
      }
    }
  }

  return decos
}

function applyDecorations(tokens) {
  if (!monacoRef || !editorInstance) return
  const decos = buildDecorations(tokens)
  if (!decorCollection) {
    decorCollection = editorInstance.createDecorationsCollection(decos)
  } else {
    decorCollection.set(decos)
  }
}

function clearDecorations() {
  decorCollection?.clear()
}

// ─── Monaco Monarch theme (used in 'token' mode) ──────────────────
function applyMonacoTheme() {
  if (!monacoRef) return
  const c = colors
  const darkerTap       = darkenColor(c.tap,       0.35)
  const darkerTouch     = darkenColor(c.touch,     0.35)
  const darkerEach      = darkenColor(c.each,      0.40)
  const darkerEachBoth  = darkenColor(c.each,      0.20)
  const eachRightColor  = darkenColor(c.each,      0.25)

  // Sync CSS custom properties
  const root = document.documentElement.style
  root.setProperty('--color-tap',        c.tap)
  root.setProperty('--color-hold',       c.hold)
  root.setProperty('--color-slide',      c.slide)
  root.setProperty('--color-touch',      c.touch)
  root.setProperty('--color-touch-hold', c.touchHold)
  root.setProperty('--color-break',      c.break)
  root.setProperty('--color-ex',         c.ex)
  root.setProperty('--color-each',       c.each)
  root.setProperty('--color-each-right', eachRightColor)
  root.setProperty('--color-dur',        c.dur)

  monacoRef.editor.defineTheme('simai-dark', {
    base: 'vs-dark', inherit: true,
    rules: [
      { token: 'keyword.meta.key',       foreground: '4fc3f7', fontStyle: 'bold' },
      { token: 'delimiter',              foreground: 'f5f5f5' },
      { token: 'string.meta.val',        foreground: 'a5d6a7' },
      { token: 'comment',                foreground: '78909c', fontStyle: 'italic' },
      { token: 'number.bpm',             foreground: '00e5ff', fontStyle: 'bold' },
      { token: 'number.subdiv',          foreground: 'a7ffeb' },
      // Duration always its own color in token mode too
      { token: 'string.duration',        foreground: c.dur.substring(1), fontStyle: 'italic' },
      { token: 'operator.joiner',        foreground: 'ea80fc', fontStyle: 'bold' },
      { token: 'delimiter.group',        foreground: darkerEach.substring(1), fontStyle: 'bold' },
      { token: 'delimiter.comma',        foreground: '546e7a',               fontStyle: 'bold' },
      { token: 'operator.shape',         foreground: c.slide.substring(1),   fontStyle: 'bold' },
      { token: 'keyword.modifier',       foreground: '78909c', fontStyle: 'bold' },
      { token: 'keyword.modifier.break', foreground: 'ff9100',               fontStyle: 'bold' },
      { token: 'keyword.modifier.ex',    foreground: 'ffffff',               fontStyle: 'italic bold' },
      { token: 'keyword.modifier.fireworks', foreground: 'd500f9',          fontStyle: 'bold' },
      { token: 'keyword.modifier.hold',  foreground: c.hold.substring(1),    fontStyle: 'bold' },
      { token: 'keyword.end',            foreground: 'ff1744', fontStyle: 'bold' },
      { token: 'number.button',          foreground: c.tap.substring(1),     fontStyle: 'bold' },
      { token: 'number.sensor',          foreground: c.touch.substring(1),   fontStyle: 'bold' },
    ],
    colors: {
      'editor.background':                '#161c2d',
      'editor.foreground':                '#f5f7fa',
      'editor.lineHighlightBackground':   '#1d243a',
      'editorLineNumber.foreground':      '#4f5b66',
      'editorLineNumber.activeForeground':'#a7ffeb',
    },
  })
  monacoRef.editor.setTheme('simai-dark')
}

// ─── Validation + coloring ────────────────────────────────────────
function validate() {
  if (!editorInstance) return
  const text = editorInstance.getValue()

  // Tokenize once — shared by stats, validation, and decorations
  const tokenizer = new Tokenizer(text)
  const { tokens } = tokenizer.tokenize()

  computeStats(tokens)

  const diags = validateSimaiFile(text)
  diagnostics.splice(0, diagnostics.length, ...diags)

  if (monacoRef) {
    const markers = diags.map(d => ({
      severity: d.severity === 'Error'
        ? monacoRef.MarkerSeverity.Error
        : monacoRef.MarkerSeverity.Warning,
      message: d.message,
      startLineNumber: d.line, startColumn: d.col,
      endLineNumber:   d.line, endColumn: d.col + (d.snippet?.length ?? 1),
    }))
    monacoRef.editor.setModelMarkers(editorInstance.getModel(), 'simai-chart', markers)

    applyDecorations(tokens)
  }
}

// ─── Color mode ───────────────────────────────────────────────────
function setColorMode(mode) {
  colorMode.value = mode
  validate()
}

function toggleSuperComma() {
  superComma.value = !superComma.value
  validate()
}

function toggleBothSlide() {
  bothSlide.value = !bothSlide.value
  validate()
}

// ─── Tab management ───────────────────────────────────────────────
let tabCounter = 1

function createTab(name = null, content = '') {
  if (!monacoRef) return
  const id      = `tab_${Date.now()}`
  const tabName = name || `譜面 ${tabCounter++}.txt`
  const model   = monacoRef.editor.createModel(content, 'simai-chart')
  model.onDidChangeContent(() => { if (activeTabId.value === id) validate() })
  tabs.push({ id, name: tabName, model })
  selectTab(id)
}

function selectTab(id) {
  activeTabId.value = id
  const tab = tabs.find(t => t.id === id)
  if (tab && editorInstance) editorInstance.setModel(tab.model)
  validate()
}

function closeTab(id) {
  if (tabs.length <= 1) return
  const idx = tabs.findIndex(t => t.id === id)
  if (idx === -1) return
  tabs[idx].model.dispose()
  tabs.splice(idx, 1)
  if (activeTabId.value === id) selectTab(tabs[Math.max(0, idx - 1)].id)
}

function renameTab(id, newName) {
  const tab = tabs.find(t => t.id === id)
  if (tab && newName?.trim()) tab.name = newName.trim()
}

// ─── Color management ─────────────────────────────────────────────
function setColor(key, value) {
  colors[key] = value
  applyMonacoTheme()
  if (colorMode.value === 'object') validate()
}

function resetColors() {
  Object.assign(colors, DEFAULT_COLORS)
  applyMonacoTheme()
  if (colorMode.value === 'object') validate()
}

// ─── Monaco lifecycle ─────────────────────────────────────────────
function setMonacoInstance(monaco, editor) {
  monacoRef      = monaco
  editorInstance = editor
  applyMonacoTheme()
  validate()
}

function focusPosition(line, col) {
  if (!editorInstance) return
  editorInstance.focus()
  editorInstance.setPosition({ lineNumber: line, column: col })
  editorInstance.revealPositionInCenter({ lineNumber: line, column: col })
}

function getEditorValue()  { return editorInstance?.getValue() ?? '' }
function setEditorValue(t) { editorInstance?.setValue(t) }

// ─── Public API ───────────────────────────────────────────────────
export function useSimaiEditor() {
  return {
    colors, colorMode, superComma, bothSlide, tabs, activeTabId, diagnostics, stats,
    createTab, selectTab, closeTab, renameTab,
    setColor, resetColors, setColorMode, toggleSuperComma, toggleBothSlide,
    setMonacoInstance, applyMonacoTheme,
    focusPosition, getEditorValue, setEditorValue, validate,
  }
}
