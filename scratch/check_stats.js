import { Tokenizer, TokenType } from '../packages/simai-core/src/index.js'

// Copy the stats logic from useSimaiEditor.js
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

function computeStats(tokens) {
  let taps = 0, breakTaps = 0, holds = 0, breakHolds = 0
  let slides = 0, breakSlides = 0, touches = 0, breakTouches = 0
  let touchHolds = 0, breakTouchHolds = 0, ex = 0, bpms = 0

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
          if (note.isBreakTap) breakTaps++
          else                  taps++
        }
      } else if (note.isHold && note.isTouch) {
        if (note.isBreakTap) { breakTouchHolds++ } else { touchHolds++ }
      } else if (note.isHold) {
        if (note.isBreakTap) { breakHolds++ } else { holds++ }
      } else if (note.isTouch) {
        if (note.isBreakTap) { breakTouches++ } else { touches++ }
      } else {
        if (note.isBreakTap) breakTaps++
        else                  taps++
      }
      continue
    }
    i++
  }

  const total = taps + breakTaps + holds + breakHolds +
                slides + touches + breakTouches +
                touchHolds + breakTouchHolds

  return {
    total, taps, breakTaps, holds, breakHolds,
    slides, breakSlides, touches, breakTouches,
    touchHolds, breakTouchHolds, ex, bpms,
  }
}

const testInputs = [
  { chart: "1b,", expected: "1 break tap" },
  { chart: "2bx,", expected: "1 ex break tap" },
  { chart: "7w3b[8:1],", expected: "1 tap, 1 break slide" },
  { chart: "7bxw3[8:1],", expected: "1 break ex tap, 1 slide" },
  { chart: "7bxw3[8:1]b,", expected: "1 break ex tap, 1 break slide" },
  { chart: "8-2-5[2:1],", expected: "1 tap, 1 slide" },
  { chart: "8b-2-5[2:1],", expected: "1 break tap, 1 slide" },
  { chart: "8-2-5[2:1]b,", expected: "1 tap, 1 break slide" },
  { chart: "8b-2-5[2:1]b,", expected: "1 break tap, 1 break slide" },
]

for (const t of testInputs) {
  const tokenizer = new Tokenizer(t.chart)
  const { tokens } = tokenizer.tokenize()
  const result = computeStats(tokens)
  console.log(`Chart: ${t.chart} (${t.expected})`)
  console.log(JSON.stringify(result, null, 2))
  console.log('---')
}
