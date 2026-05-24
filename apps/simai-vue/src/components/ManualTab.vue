<template>
  <div class="manual">

    <!-- ⏱ 基本結構 -->
    <section class="section">
      <h2 class="section-title">⏱ 基本結構</h2>
      <p class="desc">譜面由 <b>BPM</b>、<b>分音</b>、<b>音符</b>、<b>時間步</b> 組成，以 <code>E</code> 結尾。</p>
      <ExampleBlock label="基本格式">
        <span class="c-bpm">(150)</span><span class="c-subdiv">{4}</span>  <span class="c-comment">|| BPM 150，每格 4 分音符</span>
&#10;<span class="c-tap">1</span>,<span class="c-tap">2</span>,<span class="c-tap">3</span>,<span class="c-tap">4</span>,  <span class="c-comment">|| 四個單擊，逗號分隔時間步</span>
&#10;<span class="c-keyword">E</span>           <span class="c-comment">|| 譜面結束</span>
      </ExampleBlock>
      <SimpleTable :head="['語法','說明','例子']" :rows="[
        ['(BPM)',  '設定流速',          '(150)  (180)'],
        ['{n}',   '分音（幾分音符）',   '{4}  {8}  {16}'],
        ['{#秒}', '以秒數設定分音',     '{#0.5}'],
        [',',     '時間步分隔符',       '1,2,3,'],
        ['E',     '譜面結束標記',       'E'],
      ]" :colors="[null, null, ['c-bpm','c-subdiv','c-subdiv','','c-keyword']]" />
    </section>

    <!-- 👆 單擊 -->
    <section class="section">
      <h2 class="section-title">👆 單擊 (Tap)</h2>
      <p class="desc">按鍵 <code class="c-tap">1</code>–<code class="c-tap">8</code> 代表圓形按鍵盤上的位置（順時針）。</p>
      <ExampleBlock label="範例">
        <span class="c-tap">1</span>,<span class="c-tap">5</span>,  <span class="c-comment">|| 按鍵 1 和 5，各一拍</span>
&#10;<span class="c-tap">1</span><span class="c-tap">5</span>,    <span class="c-comment">|| 雙擊簡寫（同時按 1 和 5）</span>
      </ExampleBlock>
      <SimpleTable :head="['修飾符','意義','範例']" :rows="[
        ['b', 'break', '1b,'],
        ['x', 'EX（加強判定）','1x,'],
        ['h', 'Hold（長條）',  '1h[4:1],'],
      ]" />
    </section>

    <!-- 🔀 同時音符 -->
    <section class="section">
      <h2 class="section-title">🔀 同時音符 (Both / Each)</h2>
      <p class="desc">用 <code class="c-each">/</code> 或 <code class="c-each">`</code> 分隔同一時間點的多個音符。<b>斜線 <code>/</code> 與反單引號 <code>`</code> 邏輯與功能完全相同</b>，皆指代「同時按下」。
      <br />在「遊戲物件分色」下，不論使用哪種分隔符，只要同時間點剛好為<b>雙擊（兩個音符）</b>，編輯器便會將左側（首個）音符標為亮黃色、右側（次個）音符標為深黃色以供視覺區隔。</p>
      <ExampleBlock label="範例">
        <span class="c-each-tap">1</span><span class="c-each">/</span><span class="c-each-tap">5</span>,          <span class="c-comment">|| 1 和 5 同時</span>
&#10;<span class="c-each-tap">1</span><span class="c-each">b</span><span class="c-each">/</span><span class="c-each-tap">5</span>,        <span class="c-comment">|| Break 1 和 5 同時</span>
&#10;<span class="c-each-tap">1</span><span class="c-slide">-5</span><span class="c-dur">[4:1]</span><span class="c-each">/</span><span class="c-each-tap">3</span><span class="c-hold">h</span><span class="c-dur">[4:1]</span>,  <span class="c-comment">|| Slide + Hold 同時</span>
&#10;<span class="c-each-tap">3</span><span class="c-ex">x</span><span class="c-hold">h</span><span class="c-dur">[4:1]</span><span class="c-each">/</span><span class="c-each-tap">7</span><span class="c-slide">V53</span><span class="c-dur">[4:3]</span>,  <span class="c-comment">|| EX Hold + V-slide 同時</span>
      </ExampleBlock>
      <div class="note">⚠ 同一時間點，兩個音符的<b>起始位置不可相同</b>（例如 <code>1/1</code> 是錯誤的）。</div>
    </section>

    <!-- 🫳 長條 -->
    <section class="section">
      <h2 class="section-title">🫳 長條 (Hold)</h2>
      <p class="desc">在按鍵後加 <code class="c-hold">h</code> 修飾符，並在 <code class="c-dur">[...]</code> 中指定持續時間。</p>
      <ExampleBlock label="範例">
        <span class="c-tap">1</span><span class="c-hold">h</span><span class="c-dur">[4:1]</span>,   <span class="c-comment">|| Hold，4 分音符 1 拍</span>
&#10;<span class="c-tap">5</span><span class="c-hold">h</span><span class="c-dur">[8:3]</span>,   <span class="c-comment">|| Hold，8 分音符 3 拍</span>
&#10;<span class="c-tap">3</span><span class="c-break">b</span><span class="c-hold">h</span><span class="c-dur">[4:2]</span>, <span class="c-comment">|| Break Hold</span>
      </ExampleBlock>
    </section>

    <!-- ⏳ 持續時間 -->
    <section class="section">
      <h2 class="section-title">⏳ 持續時間格式 [...]</h2>
      <p class="desc">用於 Hold 和 Slide 的持續時間標記，支援多種格式。</p>
      <SimpleTable :head="['格式','說明','範例']" :rows="[
        ['[n:m]',          'n 分音符 m 拍（必須有冒號）', '[4:1]  [8:3]'],
        ['[#秒]',          '絕對秒數',                    '[#1.5]'],
        ['[BPM#n:m]',     '指定 BPM 的 n 分 m 拍',       '[160#8:3]'],
        ['[BPM#秒]',      '指定 BPM 的秒數',              '[160#2]'],
        ['[等待##秒]',    '等待後以秒數移動',              '[3##1.5]'],
        ['[等待##n:m]',   '等待後以拍數移動',              '[3##8:3]'],
        ['[等待##BPM#n:m]','等待後指定 BPM 的拍數',        '[3##160#8:3]'],
      ]" />
      <div class="note">❌ <code>[2]</code> 格式無效，必須有冒號（<code>[2:1]</code>）或秒數（<code>[#1.5]</code>）。</div>
    </section>

    <!-- 〽️ Slide 形狀 -->
    <section class="section">
      <h2 class="section-title">〽️ Slide 形狀</h2>
      <p class="desc">格式：<code><span class="c-tap">起點</span><span class="c-slide">運算子終點</span><span class="c-dur">[時間]</span></code></p>
      <SimpleTable :head="['運算子','形狀','範例']" :rows="[
        ['-',    '直線',                '1-5[4:1],'],
        ['>',    '順時針弧線',          '1>3[4:1],'],
        ['<',    '逆時針弧線',          '1<7[4:1],'],
        ['^',    '短弧（自動方向）',    '1^5[4:1],'],
        ['v',    '小 V 字（過中心）',  '1v5[4:1],'],
        ['V',    '大 V 字（中繼+終點）','6V42[4:3],'],
        ['p / q','左右彎曲弧',          '3p7[4:1],'],
        ['pp / qq','大彎曲弧',          '1pp5[4:1],'],
        ['s / z','閃電形',              '1s5[4:1],'],
        ['w',    '扇形（Fan）',         '1w5[4:1],'],
      ]" />
      <div class="note">⚠ 大 <code class="c-slide">V</code> 必須指定<b>兩個</b>頂點（中繼點 + 終點），例如 <code>6V42</code>。</div>
    </section>

    <!-- 🔗 Slide 連接 -->
    <section class="section">
      <h2 class="section-title">🔗 Slide 連接與多段 Slide</h2>
      <p class="desc">用 <code class="c-joiner">*</code> 連接多個 Slide，各段可有獨立的時間設定。</p>
      <ExampleBlock label="Combo 計算">
        <span class="c-tap">1</span><span class="c-slide">-5</span><span class="c-dur">[4:1]</span>,          <span class="c-comment">|| 1 Tap + 1 Slide = 2 combo</span>
&#10;<span class="c-tap">1</span><span class="c-slide">-5</span><span class="c-dur">[4:1]</span><span class="c-joiner">*</span><span class="c-slide">^2</span><span class="c-dur">[4:1]</span>,  <span class="c-comment">|| 1 Tap + 2 Slides = 3 combo</span>
      </ExampleBlock>
      <ExampleBlock label="複雜連鎖">
        <span class="c-tap">1</span><span class="c-slide">&gt;8</span><span class="c-dur">[90#8:7]</span><span class="c-joiner">*</span><span class="c-slide">&gt;7</span><span class="c-dur">[90#4:3]</span><span class="c-joiner">*</span><span class="c-slide">&gt;6</span><span class="c-dur">[90#8:5]</span><span class="c-joiner">*</span>
&#10;<span class="c-slide">&gt;5</span><span class="c-dur">[90#2:1]</span><span class="c-joiner">*</span><span class="c-slide">^4</span><span class="c-dur">[90#8:3]</span><span class="c-joiner">*</span><span class="c-slide">^3</span><span class="c-dur">[90#4:1]</span>,
&#10;<span class="c-comment">|| 1 Tap + 6 Slides = 7 combo</span>
      </ExampleBlock>
    </section>

    <!-- ✋ 觸控 -->
    <section class="section">
      <h2 class="section-title">✋ 觸控 (Touch) 與煙火效果 (Fireworks)</h2>
      <p class="desc">感應區域分為 <code class="c-touch">A</code>–<code class="c-touch">E</code> 圈，後接數字 <code class="c-touch">1</code>–<code class="c-touch">8</code>（<code class="c-touch">C</code> 為中心）。
      <br />觸控音符（Touch 或 TouchHold）可附加修飾符 <code class="c-keyword">f</code> 來觸發虹色放射狀的「煙火特效 (花火エフェクト)」。</p>
      <ExampleBlock label="範例">
        <span class="c-touch">A1</span>,       <span class="c-comment">|| A 圈第 1 位置 Touch</span>
&#10;<span class="c-touch">C</span>,        <span class="c-comment">|| 中心 Touch</span>
&#10;<span class="c-touch">B3</span><span class="c-hold">h</span><span class="c-dur">[4:1]</span>,  <span class="c-comment">|| 觸控長條 TouchHold</span>
&#10;<span class="c-touch">B7</span><span class="c-keyword">f</span>,      <span class="c-comment">|| 帶煙火效果的 Touch</span>
&#10;<span class="c-touch">C</span><span class="c-hold">h</span><span class="c-keyword">f</span><span class="c-dur">[1:2]</span>,  <span class="c-comment">|| 帶煙火效果的 TouchHold (hf 與 fh 順序皆可)</span>
      </ExampleBlock>
      <SimpleTable :head="['修飾符','意義','範例']" :rows="[
        ['h', 'TouchHold（觸控長條）', 'C1h[4:1],'],
        ['f', '煙火效果 (Fireworks)', 'B7f,'],
        ['hf / fh', '帶煙火的觸控長條（順序不拘）', 'Chf[4:1], / Cfh[4:1],'],
      ]" />
    </section>

    <!-- ✅ 驗證規則 -->
    <section class="section">
      <h2 class="section-title">✅ 驗證規則</h2>
      <SimpleTable :head="['規則','說明','錯誤範例']" :rows="[
        ['缺少 E',        '譜面必須以 E 結尾',              '1,2,(缺少E)'],
        ['重複起始位置',  '同一時間點 Tap 起點不能重複',   '1/1,'],
        ['連續三個以上數字','簡寫雙擊最多兩位',             '123,'],
        ['[2] 格式',      '持續時間必須有冒號或秒數',       '1h[2],'],
        ['V-slide 缺頂點','V 形 Slide 必須兩個頂點',        '1V5,'],
        ['Slide 缺終點',  'Slide 運算子後必須有目的地',     '1-,'],
        ['缺少分隔符',    '非簡單 Tap 必須用 / 或 ` 分隔', '31-4[4:1],'],
      ]" is-error />
    </section>

    <!-- 📝 完整譜面範例（含詳細註釋） -->
    <section class="section">
      <h2 class="section-title">📝 完整譜面範例（含詳細註釋）</h2>
      <p class="desc">此範例融合了所有常見的音符型別與修飾符，可直接複製到編輯器中測試與參考：</p>
      <pre class="code-block" style="line-height: 1.6; font-size: 0.82rem;">(150){4}
|| ─── 1. 單擊與長條 (Tap & Hold) ───
1,          || 一般 Tap (粉紅色)
2x,         || EX Tap (粉紅色 + 粗斜體)
3b,         || Break Tap (黃色)
4bx,        || Break EX Tap (黃色 + 粗斜體)
5h[4:1],    || Hold 長條 (粉紅色，時間亮綠色)
6hx[4:1],   || EX Hold 長條 (粉紅色 + 粗斜體)
7bh[4:1],   || Break Hold 長條 (黃色)
8bhx[4:1],  || Break EX Hold 長條 (黃色 + 粗斜體)

|| ─── 2. 觸控與觸控長條 (Touch & TouchHold) ───
A1,         || Touch 觸控 (青藍色)
B2x,        || EX Touch 觸控 (青藍色 + 粗斜體)
C,          || 中心 Touch 觸控 (青藍色)
D5h[4:1],   || TouchHold 觸控長條 (彩虹漸變色)
E5hx[4:1],  || EX TouchHold (彩虹漸變色 + 粗斜體)

|| ─── 3. 單段與多段 slide (Slide & Multi-segment) ───
1-5[8:1],   || 直線 Slide (藍色)
2&gt;6[8:1],   || 順時針弧線 Slide (藍色)
3&lt;7[8:1],   || 逆時針弧線 Slide (藍色)
4^8[8:1],   || 短弧線 Slide (藍色)
5v1[8:1],   || 小 V 字 Slide (藍色)
6V42[8:2],  || 大 V 字 Slide (藍色，含中繼點 4)
7pp3[8:1],  || 彎曲弧 Slide (藍色)
8s4[8:1],   || 閃電形 Slide (藍色)
1w5[8:1],   || 扇形 Slide (藍色)
2-6[8:1]*^3[8:1], || 連接 Slide (多段不同形狀與時間)

|| ─── 4. slide 的特殊變化 (EX & Break Slides) ───
3x-7[4:1],  || EX Slide (藍色 + 粗斜體)
4b-8[4:1],  || 帶有 Break 起點的 Slide (黃色起點 + 藍色軌跡)
5-1[4:1]b,  || Break Slide (整個 Slide 為 Break，黃色)
6x-2[4:1]b, || EX Break Slide (整個為 Break + 粗斜體，黃色)

|| ─── 5. 同時按鍵 (Both/Each) ───
1/5,        || 雙擊 (兩音符黃色，且左側亮黃、右側深黃)
A1/C,       || 觸控雙擊 (兩音符黃色，且左側亮黃、右側深黃)
2/6/8,      || 三擊 (三個音符均為黃色，不分左右)
3/7x/E5bh[4:1], || 混合多擊 (Tap + EX Tap + Break TouchHold，均為黃色)

E</pre>
    </section>

  </div>
</template>

<script setup>
// Sub-components defined inline for simplicity
import { defineComponent, h } from 'vue'

// ExampleBlock — renders a labeled code block
const ExampleBlock = defineComponent({
  props: { label: String },
  setup(props, { slots }) {
    return () => h('div', { class: 'example-wrap' }, [
      h('div', { class: 'example-label' }, props.label),
      h('pre', { class: 'code-block' }, slots.default?.()),
    ])
  }
})

// SimpleTable — renders a data table
const SimpleTable = defineComponent({
  props: {
    head: Array,
    rows: Array,
    isError: Boolean,
  },
  setup(props) {
    return () => h('div', { class: 'simple-table' }, [
      h('div', { class: 'tbl-row tbl-head' },
        props.head.map(h_cell => h('span', h_cell))
      ),
      ...props.rows.map(row =>
        h('div', { class: ['tbl-row', props.isError ? 'tbl-err' : ''] },
          row.map(cell => h('span', null, cell))
        )
      ),
    ])
  }
})
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.manual {
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
}

.section {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 10px;
  padding: 1.1rem 1.3rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 700;
  color: $text-primary;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  padding-bottom: 0.5rem;
}

.desc {
  font-size: 0.87rem;
  color: $text-secondary;
  line-height: 1.6;

  code {
    font-family: $font-code;
    font-size: 0.85em;
    background: rgba(255,255,255,0.07);
    padding: 1px 5px;
    border-radius: 4px;
  }
}

.note {
  font-size: 0.83rem;
  color: #ffcc80;
  background: rgba(255,167,38,0.08);
  border-left: 3px solid $color-hold;
  padding: 0.5rem 0.8rem;
  border-radius: 0 6px 6px 0;
  line-height: 1.5;

  code {
    font-family: $font-code;
    font-size: 0.85em;
    background: rgba(255,255,255,0.07);
    padding: 1px 5px;
    border-radius: 4px;
  }
}

// Code block
.example-wrap { display: flex; flex-direction: column; gap: 0.3rem; }
.example-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: $text-secondary;
}

.code-block {
  background: #0d1117;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
  padding: 0.9rem 1.1rem;
  font-family: $font-code;
  font-size: 0.88rem;
  line-height: 1.9;
  overflow-x: auto;
  white-space: pre;
}

// Table
.simple-table {
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 8px;
  overflow: hidden;
  font-size: 0.85rem;
}

.tbl-row {
  display: grid;
  grid-template-columns: 1fr 1.6fr 1.4fr;
  padding: 0.5rem 0.8rem;
  gap: 0.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  align-items: center;
  line-height: 1.4;

  &:last-child { border-bottom: none; }

  span { word-break: break-word; }
}

.tbl-head {
  background: rgba(255,255,255,0.05);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: $text-secondary;
}

.tbl-err { border-left: 3px solid rgba(255,23,68,0.5); }

// Syntax color tokens used inside <template> spans
.c-bpm     { color: #00e5ff; }
.c-subdiv  { color: #a7ffeb; }
.c-tap     { color: #ff2e93; font-weight: 700; }
.c-each-tap{ color: #ffd600; font-weight: 700; }
.c-each    { color: #ffd600; font-weight: 700; }
.c-break   { color: #ffd600; font-weight: 700; }
.c-ex      { font-style: italic; font-weight: 700; color: #78909c; }
.c-hold    { color: #ff2e93; font-weight: 700; }
.c-slide   { color: #29b6f6; font-weight: 700; }
.c-touch   { color: #00bcd4; font-weight: 700; }
.c-dur     { color: #b2ff59; font-style: italic; }
.c-joiner  { color: #ea80fc; font-weight: 700; }
.c-keyword { color: #ff1744; font-weight: 700; }
.c-comment { color: #546e7a; }
</style>
