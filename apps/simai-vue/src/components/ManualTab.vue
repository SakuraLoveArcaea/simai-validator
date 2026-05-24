<template>
  <div class="manual">
    <!-- 🔍 搜尋列 -->
    <div class="search-bar">
      <span class="search-icon">🔍</span>
      <input 
        v-model="searchQuery" 
        type="text" 
        class="search-input" 
        placeholder="搜尋語法、型別、形狀或關鍵字 (例如: slide, break, ex, touch)..." 
      />
      <button v-if="searchQuery" class="clear-btn" @click="searchQuery = ''">✕</button>
    </div>

    <!-- 📚 說明書區塊 -->
    <div class="sections-container">
      
      <!-- ⏱ 基本結構 -->
      <section v-show="showSection('基本結構', ['bpm', 'subdivision', '分音', '時間步', '結束', 'E', 'delim', '逗號'])" class="section">
        <h2 class="section-title">⏱ 基本結構</h2>
        <p class="desc">譜面由 <b>BPM</b>、<b>分音</b>、<b>音符</b>、<b>時間步</b> 組成，以 <code>E</code> 結尾。</p>
        <ExampleBlock label="basic_format.txt">
          <span class="c-bpm">(150)</span><span class="c-subdiv">{4}</span>  <span class="c-comment">|| BPM 150，每格 4 分音符</span>
          <span class="c-tap">1</span>,<span class="c-tap">2</span>,<span class="c-tap">3</span>,<span class="c-tap">4</span>,  <span class="c-comment">|| 四個單擊，逗號分隔時間步</span>
          <span class="c-keyword">E</span>           <span class="c-comment">|| 譜面結束</span>
        </ExampleBlock>
        <SimpleTable :head="['語法','說明','例子']" :rows="[
          ['(BPM)',  '設定流速',          '(150)  (180)'],
          ['{n}',   '分音（幾分音符）',   '{4}  {8}  {16}'],
          ['{#秒}', '以秒數設定分音',     '{#0.5}'],
          [',',     '時間步分隔符',       '1,2,3,'],
          ['E',     '譜面結束標記',       'E'],
        ]" />
      </section>

      <!-- 👆 單擊 -->
      <section v-show="showSection('單擊 (Tap)', ['tap', '單擊', '按鍵', 'b', 'break', 'x', 'ex', 'h', 'hold'])" class="section">
        <h2 class="section-title">👆 單擊 (Tap)</h2>
        <p class="desc">按鍵 <code class="c-tap">1</code>–<code class="c-tap">8</code> 代表圓形按鍵盤上的位置（順時針）。</p>
        <ExampleBlock label="tap_example.txt">
          <span class="c-tap">1</span>,<span class="c-tap">5</span>,  <span class="c-comment">|| 按鍵 1 和 5，各一拍</span>
          <span class="c-tap">1</span><span class="c-tap">5</span>,    <span class="c-comment">|| 雙擊簡寫（同時按 1 和 5）</span>
        </ExampleBlock>
        <SimpleTable :head="['修飾符','意義','範例']" :rows="[
          ['b', 'break', '1b,'],
          ['x', 'EX（加強判定）','1x,'],
          ['h', 'Hold（長條）',  '1h[4:1],'],
        ]" />
      </section>

      <!-- 🔀 同時音符 -->
      <section v-show="showSection('同時音符 (Both / Each)', ['both', 'each', '同時', '雙擊', '多擊', '分隔符', '/', '`', '反單引號', '黃色', '分色'])" class="section">
        <h2 class="section-title">🔀 同時音符 (Both / Each)</h2>
        <p class="desc">用 <code class="c-each">/</code> 或 <code class="c-each">`</code> 分隔同一時間點的多個音符。<b>斜線 <code>/</code> 與反單引號 <code>`</code> 邏輯與功能完全相同</b>，皆指代「同時按下」。
        <br />在「遊戲物件分色」下，不論使用哪種分隔符，只要同時間點剛好為<b>雙擊（兩個音符）</b>，編輯器便會將左側（首個）音符標為亮黃色、右側（次個）音符標為深黃色以供視覺區隔。</p>
        <ExampleBlock label="both_example.txt">
          <span class="c-each-tap">1</span><span class="c-each">/</span><span class="c-each-tap">5</span>,          <span class="c-comment">|| 1 和 5 同時</span>
          <span class="c-each-tap">1</span><span class="c-break">b</span><span class="c-each">/</span><span class="c-each-tap">5</span>,        <span class="c-comment">|| Break 1 和 5 同時</span>
          <span class="c-each-tap">1</span><span class="c-slide">-5</span><span class="c-dur">[4:1]</span><span class="c-each">/</span><span class="c-each-tap">3</span><span class="c-hold">h</span><span class="c-dur">[4:1]</span>,  <span class="c-comment">|| Slide + Hold 同時</span>
          <span class="c-each-tap">3</span><span class="c-ex">x</span><span class="c-hold">h</span><span class="c-dur">[4:1]</span><span class="c-each">/</span><span class="c-each-tap">7</span><span class="c-slide">V53</span><span class="c-dur">[4:3]</span>,  <span class="c-comment">|| EX Hold + V-slide 同時</span>
        </ExampleBlock>
        <div class="note">⚠ 同一時間點，兩個音符的<b>起始位置不可相同</b>（例如 <code>1/1</code> 是錯誤的）。</div>
      </section>

      <!-- 🫳 長條 -->
      <section v-show="showSection('長條 (Hold)', ['hold', '長條', 'h', 'duration', '持續時間', 'break hold'])" class="section">
        <h2 class="section-title">🫳 長條 (Hold)</h2>
        <p class="desc">在按鍵後加 <code class="c-hold">h</code> 修飾符，並在 <code class="c-dur">[...]</code> 中指定持續時間。</p>
        <ExampleBlock label="hold_example.txt">
          <span class="c-tap">1</span><span class="c-hold">h</span><span class="c-dur">[4:1]</span>,   <span class="c-comment">|| Hold，4 分音符 1 拍</span>
          <span class="c-tap">5</span><span class="c-hold">h</span><span class="c-dur">[8:3]</span>,   <span class="c-comment">|| Hold，8 分音符 3 拍</span>
          <span class="c-tap">3</span><span class="c-break">b</span><span class="c-hold">h</span><span class="c-dur">[4:2]</span>, <span class="c-comment">|| Break Hold</span>
        </ExampleBlock>
      </section>

      <!-- ⏳ 持續時間 -->
      <section v-show="showSection('持續時間格式 [...]', ['duration', '持續時間', '時間格式', 'n:m', '#', '##', '秒數', 'bpm', '等待'])" class="section">
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
      <section v-show="showSection('Slide 形狀', ['slide', '形狀', '運算子', '直線', '弧線', 'v', 'V', 'p', 'q', 'pp', 'qq', 's', 'z', 'w', '頂點', '終點', '中繼點'])" class="section">
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
      <section v-show="showSection('Slide 連接與多段 Slide', ['slide', '連接', '多段', '*', 'combo', '連鎖'])" class="section">
        <h2 class="section-title">🔗 Slide 連接與多段 Slide</h2>
        <p class="desc">用 <code class="c-joiner">*</code> 連接多個 Slide，各段可有獨立的時間設定。</p>
        <ExampleBlock label="combo_calculation.txt">
          <span class="c-tap">1</span><span class="c-slide">-5</span><span class="c-dur">[4:1]</span>,          <span class="c-comment">|| 1 Tap + 1 Slide = 2 combo</span>
          <span class="c-tap">1</span><span class="c-slide">-5</span><span class="c-dur">[4:1]</span><span class="c-joiner">*</span><span class="c-slide">^2</span><span class="c-dur">[4:1]</span>,  <span class="c-comment">|| 1 Tap + 2 Slides = 3 combo</span>
        </ExampleBlock>
        <ExampleBlock label="complex_chain.txt">
          <span class="c-tap">1</span><span class="c-slide">&gt;8</span><span class="c-dur">[90#8:7]</span><span class="c-joiner">*</span><span class="c-slide">&gt;7</span><span class="c-dur">[90#4:3]</span><span class="c-joiner">*</span><span class="c-slide">&gt;6</span><span class="c-dur">[90#8:5]</span><span class="c-joiner">*</span>
          <span class="c-slide">&gt;5</span><span class="c-dur">[90#2:1]</span><span class="c-joiner">*</span><span class="c-slide">^4</span><span class="c-dur">[90#8:3]</span><span class="c-joiner">*</span><span class="c-slide">^3</span><span class="c-dur">[90#4:1]</span>,
          <span class="c-comment">|| 1 Tap + 6 Slides = 7 combo</span>
        </ExampleBlock>
      </section>

      <!-- ✋ 觸控 -->
      <section v-show="showSection('觸控 (Touch) 與煙火效果 (Fireworks)', ['touch', '觸控', '感應', 'A', 'B', 'C', 'D', 'E', 'f', 'fireworks', '煙火', 'TouchHold'])" class="section">
        <h2 class="section-title">✋ 觸控 (Touch) 與煙火效果 (Fireworks)</h2>
        <p class="desc">感應區域分為 <code class="c-touch">A</code>–<code class="c-touch">E</code> 圈，後接數字 <code class="c-touch">1</code>–<code class="c-touch">8</code>（<code class="c-touch">C</code> 為中心）。
        <br />觸控音符（Touch 或 TouchHold）可附加修飾符 <code class="c-keyword">f</code> 來觸發虹色放射狀的「煙火特效 (花火エフェクト)」。</p>
        <ExampleBlock label="touch_fireworks.txt">
          <span class="c-touch">A1</span>,       <span class="c-comment">|| A 圈第 1 位置 Touch</span>
          <span class="c-touch">C</span>,        <span class="c-comment">|| 中心 Touch</span>
          <span class="c-touch">B3</span><span class="c-hold">h</span><span class="c-dur">[4:1]</span>,  <span class="c-comment">|| 觸控長條 TouchHold</span>
          <span class="c-touch">B7</span><span class="c-keyword">f</span>,      <span class="c-comment">|| 帶煙火效果的 Touch</span>
          <span class="c-touch">C</span><span class="c-hold">h</span><span class="c-keyword">f</span><span class="c-dur">[1:2]</span>,  <span class="c-comment">|| 帶煙火效果的 TouchHold (hf 與 fh 順序皆可)</span>
        </ExampleBlock>
        <SimpleTable :head="['修飾符','意義','範例']" :rows="[
          ['h', 'TouchHold（觸控長條）', 'C1h[4:1],'],
          ['f', '煙火效果 (Fireworks)', 'B7f,'],
          ['hf / fh', '帶煙火的觸控長條（順序不拘）', 'Chf[4:1], / Cfh[4:1],'],
        ]" />
      </section>

      <!-- ✅ 驗證規則 -->
      <section v-show="showSection('驗證規則', ['validation', 'rules', '驗證', '規則', '錯誤', '重複', 'E', '簡寫', '分音', '分隔符'])" class="section">
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
      <section v-show="showSection('完整譜面範例', ['example', '譜面', '範例', '註釋', 'demo', '完整', '測試'])" class="section">
        <h2 class="section-title">📝 完整譜面範例（含詳細註釋）</h2>
        <p class="desc">此範例融合了所有常見的音符型別與修飾符，可直接複製到編輯器中測試與參考：</p>
        <ExampleBlock label="full_chart_demo.txt">
          <span class="c-bpm">(150)</span><span class="c-subdiv">{4}</span>
          <span class="c-comment">|| ─── 1. 單擊與長條 (Tap & Hold) ───</span>
          <span class="c-tap">1</span>,          <span class="c-comment">|| 一般 Tap (粉紅色)</span>
          <span class="c-tap">2</span><span class="c-ex">x</span>,         <span class="c-comment">|| EX Tap (粉紅色 + 粗斜體)</span>
          <span class="c-tap">3</span><span class="c-break">b</span>,         <span class="c-comment">|| Break Tap (黃色)</span>
          <span class="c-tap">4</span><span class="c-break">b</span><span class="c-ex">x</span>,        <span class="c-comment">|| Break EX Tap (黃色 + 粗斜體)</span>
          <span class="c-tap">5</span><span class="c-hold">h</span><span class="c-dur">[4:1]</span>,    <span class="c-comment">|| Hold 長條 (粉紅色，時間亮綠色)</span>
          <span class="c-tap">6</span><span class="c-hold">h</span><span class="c-ex">x</span><span class="c-dur">[4:1]</span>,   <span class="c-comment">|| EX Hold 長條 (粉紅色 + 粗斜體)</span>
          <span class="c-tap">7</span><span class="c-break">b</span><span class="c-hold">h</span><span class="c-dur">[4:1]</span>,   <span class="c-comment">|| Break Hold 長條 (黃色)</span>
          <span class="c-tap">8</span><span class="c-break">b</span><span class="c-hold">h</span><span class="c-ex">x</span><span class="c-dur">[4:1]</span>,  <span class="c-comment">|| Break EX Hold 長條 (黃色 + 粗斜體)</span>

          <span class="c-comment">|| ─── 2. 觸控與觸控長條 (Touch & TouchHold) ───</span>
          <span class="c-touch">A1</span>,         <span class="c-comment">|| Touch 觸控 (青藍色)</span>
          <span class="c-touch">B2</span><span class="c-ex">x</span>,        <span class="c-comment">|| EX Touch 觸控 (青藍色 + 粗斜體)</span>
          <span class="c-touch">C</span>,          <span class="c-comment">|| 中心 Touch 觸控 (青藍色)</span>
          <span class="c-touch">D5</span><span class="c-hold">h</span><span class="c-dur">[4:1]</span>,   <span class="c-comment">|| TouchHold 觸控長條 (彩虹漸變色)</span>
          <span class="c-touch">E5</span><span class="c-hold">h</span><span class="c-ex">x</span><span class="c-dur">[4:1]</span>,  <span class="c-comment">|| EX TouchHold (彩虹漸變色 + 粗斜體)</span>

          <span class="c-comment">|| ─── 3. 單段與多段 slide (Slide & Multi-segment) ───</span>
          <span class="c-tap">1</span><span class="c-slide">-5</span><span class="c-dur">[8:1]</span>,   <span class="c-comment">|| 直線 Slide (藍色)</span>
          <span class="c-tap">2</span><span class="c-slide">&gt;6</span><span class="c-dur">[8:1]</span>,   <span class="c-comment">|| 順時針弧線 Slide (藍色)</span>
          <span class="c-tap">3</span><span class="c-slide">&lt;7</span><span class="c-dur">[8:1]</span>,   <span class="c-comment">|| 逆時針弧線 Slide (藍色)</span>
          <span class="c-tap">4</span><span class="c-slide">^8</span><span class="c-dur">[8:1]</span>,   <span class="c-comment">|| 短弧線 Slide (藍色)</span>
          <span class="c-tap">5</span><span class="c-slide">v1</span><span class="c-dur">[8:1]</span>,   <span class="c-comment">|| 小 V 字 Slide (藍色)</span>
          <span class="c-tap">6</span><span class="c-slide">V42</span><span class="c-dur">[8:2]</span>,  <span class="c-comment">|| 大 V 字 Slide (藍色，含中繼點 4)</span>
          <span class="c-tap">7</span><span class="c-slide">pp3</span><span class="c-dur">[8:1]</span>,  <span class="c-comment">|| 彎曲弧 Slide (藍色)</span>
          <span class="c-tap">8</span><span class="c-slide">s4</span><span class="c-dur">[8:1]</span>,   <span class="c-comment">|| 閃電形 Slide (藍色)</span>
          <span class="c-tap">1</span><span class="c-slide">w5</span><span class="c-dur">[8:1]</span>,   <span class="c-comment">|| 扇形 Slide (藍色)</span>
          <span class="c-tap">2</span><span class="c-slide">-6</span><span class="c-dur">[8:1]</span><span class="c-joiner">*</span><span class="c-slide">^3</span><span class="c-dur">[8:1]</span>, <span class="c-comment">|| 連接 Slide (多段不同形狀與時間)</span>

          <span class="c-comment">|| ─── 4. slide 的特殊變化 (EX & Break Slides) ───</span>
          <span class="c-tap">3</span><span class="c-ex">x</span><span class="c-slide">-7</span><span class="c-dur">[4:1]</span>,  <span class="c-comment">|| EX Slide (藍色 + 粗斜體)</span>
          <span class="c-tap">4</span><span class="c-break">b</span><span class="c-slide">-8</span><span class="c-dur">[4:1]</span>,  <span class="c-comment">|| 帶有 Break 起點的 Slide (黃色起點 + 藍色軌跡)</span>
          <span class="c-tap">5</span><span class="c-slide">-1</span><span class="c-dur">[4:1]</span><span class="c-break">b</span>,  <span class="c-comment">|| Break Slide (整個 Slide 為 Break，黃色)</span>
          <span class="c-tap">6</span><span class="c-ex">x</span><span class="c-slide">-2</span><span class="c-dur">[4:1]</span><span class="c-break">b</span>, <span class="c-comment">|| EX Break Slide (整個為 Break + 粗斜體，黃色)</span>

          <span class="c-comment">|| ─── 5. 同時按鍵 (Both/Each) ───</span>
          <span class="c-each-tap">1</span><span class="c-each">/</span><span class="c-each-tap">5</span>,        <span class="c-comment">|| 雙擊 (兩音符黃色，且左側亮黃、右側深黃)</span>
          <span class="c-touch">A1</span><span class="c-each">/</span><span class="c-touch">C</span>,       <span class="c-comment">|| 觸控雙擊 (兩音符黃色，且左側亮黃、右側深黃)</span>
          <span class="c-each-tap">2</span><span class="c-each">/</span><span class="c-each-tap">6</span><span class="c-each">/</span><span class="c-each-tap">8</span>,      <span class="c-comment">|| 三擊 (三個音符均為黃色，不分左右)</span>
          <span class="c-each-tap">3</span><span class="c-each">/</span><span class="c-each-tap">7</span><span class="c-ex">x</span><span class="c-each">/</span><span class="c-touch">E5</span><span class="c-break">b</span><span class="c-hold">h</span><span class="c-dur">[4:1]</span>, <span class="c-comment">|| 混合多擊 (Tap + EX Tap + Break TouchHold，均為黃色)</span>

          <span class="c-keyword">E</span>
        </ExampleBlock>
      </section>

      <!-- 🔎 查無結果 -->
      <div v-show="hasNoResults" class="no-results">
        <span class="no-results-icon">🔎</span>
        <span class="no-results-title">無搜尋結果</span>
        <span class="no-results-desc">請嘗試其他關鍵字（例如：slide, break, EX），或清除搜尋內容。</span>
        <button class="clear-search-btn" @click="searchQuery = ''">清除搜尋</button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineComponent, h } from 'vue'

const searchQuery = ref('')

// Simple keyword search check
const showSection = (title, keywords = []) => {
  if (!searchQuery.value) return true;
  const q = searchQuery.value.toLowerCase().trim();
  if (title.toLowerCase().includes(q)) return true;
  return keywords.some(k => k.toLowerCase().includes(q));
}

// Compute if search matches no categories
const hasNoResults = computed(() => {
  if (!searchQuery.value) return false;
  
  const sections = [
    { title: '基本結構', kw: ['bpm', 'subdivision', '分音', '時間步', '結束', 'E', 'delim', '逗號'] },
    { title: '單擊 (Tap)', kw: ['tap', '單擊', '按鍵', 'b', 'break', 'x', 'ex', 'h', 'hold'] },
    { title: '同時音符 (Both / Each)', kw: ['both', 'each', '同時', '雙擊', '多擊', '分隔符', '/', '`', '反單引號', '黃色', '分色'] },
    { title: '長條 (Hold)', kw: ['hold', '長條', 'h', 'duration', '持續時間', 'break hold'] },
    { title: '持續時間格式 [...]', kw: ['duration', '持續時間', '時間格式', 'n:m', '#', '##', '秒數', 'bpm', '等待'] },
    { title: 'Slide 形狀', kw: ['slide', '形狀', '運算子', '直線', '弧線', 'v', 'V', 'p', 'q', 'pp', 'qq', 's', 'z', 'w', '頂點', '終點', '中繼點'] },
    { title: 'Slide 連接與多段 Slide', kw: ['slide', '連接', '多段', '*', 'combo', '連鎖'] },
    { title: '觸控 (Touch) 與煙火效果 (Fireworks)', kw: ['touch', '觸控', '感應', 'A', 'B', 'C', 'D', 'E', 'f', 'fireworks', '煙火', 'TouchHold'] },
    { title: '驗證規則', kw: ['validation', 'rules', '驗證', '規則', '錯誤', '重複', 'E', '簡寫', '分音', '分隔符'] },
    { title: '完整譜面範例', kw: ['example', '譜面', '範例', '註釋', 'demo', '完整', '測試'] }
  ];

  return !sections.some(s => showSection(s.title, s.kw));
});

// ExampleBlock — renders a macOS terminal mockup window
const ExampleBlock = defineComponent({
  props: { label: String },
  setup(props, { slots }) {
    return () => h('div', { class: 'terminal-window' }, [
      h('div', { class: 'terminal-header' }, [
        h('div', { class: 'terminal-dots' }, [
          h('span', { class: 't-dot t-red' }),
          h('span', { class: 't-dot t-yellow' }),
          h('span', { class: 't-dot t-green' }),
        ]),
        h('div', { class: 'terminal-title' }, props.label),
      ]),
      h('pre', { class: 'code-block' }, slots.default?.()),
    ])
  }
})

// SimpleTable — renders an enhanced grid data table
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
          row.map((cell, idx) => {
            if (idx === 2) {
              return h('span', null, [
                h('code', { class: 'code-tag-cell' }, cell)
              ]);
            }
            return h('span', null, cell);
          })
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
  gap: 1.5rem;
}

// ─── Search Bar ──────────────────────────────────────────────
.search-bar {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 0.65rem 1.1rem;
  gap: 0.6rem;
  position: sticky;
  top: -1.5rem; // stick right at the top boundary of panel-body
  z-index: 10;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

  &:focus-within {
    border-color: rgba(124, 77, 255, 0.4);
    box-shadow: 0 8px 36px rgba(124, 77, 255, 0.22);
    background: rgba(255, 255, 255, 0.05);
  }
}

.search-icon {
  font-size: 0.95rem;
  color: $text-secondary;
  opacity: 0.7;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  color: $text-primary;
  font-size: 0.9rem;
  outline: none;
  font-family: $font-ui;

  &::placeholder {
    color: $text-secondary;
    opacity: 0.4;
  }
}

.clear-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: $text-secondary;
  font-size: 0.75rem;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    color: $text-primary;
  }
}

// ─── Sections ─────────────────────────────────────────────────
.sections-container {
  display: flex;
  flex-direction: column;
  gap: 1.8rem;
}

.section {
  background: rgba(255, 255, 255, 0.015);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 1.4rem 1.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(124, 77, 255, 0.25);
    background: rgba(255, 255, 255, 0.025);
    box-shadow: 0 12px 32px rgba(124, 77, 255, 0.08), 0 4px 16px rgba(0, 0, 0, 0.15);
  }
}

.section-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: $text-primary;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-bottom: 0.6rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: linear-gradient(90deg, $text-primary 0%, rgba($text-primary, 0.75) 100%);
  -webkit-background-clip: text;
  background-clip: text;
}

.desc {
  font-size: 0.87rem;
  color: $text-secondary;
  line-height: 1.65;

  code {
    font-family: $font-code;
    font-size: 0.85em;
    background: rgba(255, 255, 255, 0.07);
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.03);
    color: var(--accent);
  }
}

.note {
  font-size: 0.83rem;
  color: #ffcc80;
  background: rgba(255, 167, 38, 0.06);
  border-left: 3.5px solid #ffb74d;
  padding: 0.6rem 1rem;
  border-radius: 0 8px 8px 0;
  line-height: 1.6;

  code {
    font-family: $font-code;
    font-size: 0.85em;
    background: rgba(255, 255, 255, 0.07);
    padding: 2px 5px;
    border-radius: 4px;
    color: #ffcc80;
  }
}

// ─── Terminal Window Example Block ────────────────────────────
.terminal-window {
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
  background: #0b0e14;
}

.terminal-header {
  display: flex;
  align-items: center;
  padding: 0.65rem 1rem;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  position: relative;
}

.terminal-dots {
  display: flex;
  gap: 6px;
  align-items: center;
}

.t-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  display: inline-block;

  &.t-red { background: #ff5f56; }
  &.t-yellow { background: #ffbd2e; }
  &.t-green { background: #27c93f; }
}

.terminal-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-family: $font-code;
  font-size: 0.72rem;
  color: $text-secondary;
  opacity: 0.8;
  font-weight: 600;
  letter-spacing: 0.5px;
  pointer-events: none;
}

.code-block {
  margin: 0;
  padding: 1.1rem 1.3rem;
  background: transparent;
  border: none;
  font-family: $font-code;
  font-size: 0.86rem;
  line-height: 1.9;
  overflow-x: auto;
  color: #e3e8f0;
  white-space: pre-wrap;
  word-break: break-all;
}

// ─── Simple Table ─────────────────────────────────────────────
.simple-table {
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  overflow: hidden;
  font-size: 0.85rem;
  background: rgba(255, 255, 255, 0.01);
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.02);
}

.tbl-row {
  display: grid;
  grid-template-columns: 1.2fr 2fr 1.8fr;
  padding: 0.65rem 1rem;
  gap: 0.6rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  align-items: center;
  transition: all 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover:not(.tbl-head) {
    background: rgba(255, 255, 255, 0.03);
  }

  span {
    word-break: break-word;
  }
}

.tbl-head {
  background: rgba(255, 255, 255, 0.04);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: $text-secondary;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.tbl-err {
  border-left: 3.5px solid #ff1744;
  background: rgba(255, 23, 68, 0.01);

  &:hover {
    background: rgba(255, 23, 68, 0.025);
  }

  .code-tag-cell {
    color: #ff5252 !important;
    background: rgba(255, 23, 68, 0.1) !important;
    border-color: rgba(255, 23, 68, 0.2) !important;
  }
}

.code-tag-cell {
  font-family: $font-code;
  font-size: 0.82rem;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 5px;
  color: var(--accent);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

// ─── No Results State ─────────────────────────────────────────
.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  background: rgba(255, 255, 255, 0.015);
  border: 1px dashed rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  margin-top: 1rem;
}

.no-results-icon {
  font-size: 2.5rem;
  margin-bottom: 0.8rem;
  opacity: 0.6;
}

.no-results-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: 0.3rem;
}

.no-results-desc {
  font-size: 0.85rem;
  color: $text-secondary;
  margin-bottom: 1.2rem;
  line-height: 1.5;
}

.clear-search-btn {
  background: rgba(124, 77, 255, 0.12);
  border: 1px solid rgba(124, 77, 255, 0.25);
  color: var(--accent);
  padding: 0.45rem 1.4rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(124, 77, 255, 0.22);
    border-color: rgba(124, 77, 255, 0.45);
  }
}

// ─── Syntax Highlight Spans (from Editor Monarch theme) ──────
.c-bpm      { color: #00e5ff; font-weight: 600; }
.c-subdiv   { color: #a7ffeb; font-weight: 600; }
.c-tap      { color: #ff2e93; font-weight: 700; }
.c-each-tap { color: #ffd600; font-weight: 700; }
.c-each     { color: #ffd600; font-weight: 700; }
.c-break    { color: #ff9100; font-weight: 700; } // updated to neon break orange
.c-ex       { font-style: italic; font-weight: 700; color: #ff9100; text-shadow: 0 0 2px rgba(255,255,255,0.4); } // glowing ex whiteish
.c-hold     { color: #ff2e93; font-weight: 700; }
.c-slide    { color: #29b6f6; font-weight: 700; }
.c-touch    { color: #00bcd4; font-weight: 700; }
.c-dur      { color: #b2ff59; font-style: italic; }
.c-joiner   { color: #ea80fc; font-weight: 700; }
.c-keyword  { color: #ff1744; font-weight: 700; }
.c-comment  { color: #546e7a; font-style: italic; }
</style>
