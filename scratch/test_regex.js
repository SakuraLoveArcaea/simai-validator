const testCases = [
  "1,2,3,4,",
  "1/2,",
  "12,",
  "1/2/3,",
  "1,2/3,4,",
  "A1/B2,",
  "C,A1,"
];

// We define our rules as pairs of [regex, token(s)]
const rules = [
  // Both buttons (lookahead or group match)
  { regex: /[1-8](?=[\/`])/, tokens: ['number.button.both'] },
  { regex: /([\/`])([1-8])/, tokens: ['delimiter.group', 'number.button.both'] },
  { regex: /([1-8])([1-8])/, tokens: ['number.button.both', 'number.button.both'] },
  
  // Both sensors
  { regex: /[A-E][1-8]?(?=[\/`])/, tokens: ['number.sensor.both'] },
  { regex: /([\/`])([A-E][1-8]?)/, tokens: ['delimiter.group', 'number.sensor.both'] },

  // Base types
  { regex: /[\/`]/, tokens: ['delimiter.group'] },
  { regex: /,/, tokens: ['delimiter.comma'] },
  { regex: /[1-8]/, tokens: ['number.button'] },
  { regex: /[A-E][1-8]?/, tokens: ['number.sensor'] },
];

testCases.forEach(str => {
  console.log(`\nInput: "${str}"`);
  let currentStr = str;
  while (currentStr.length > 0) {
    let matched = false;
    for (const r of rules) {
      const anchored = new RegExp("^" + r.regex.source);
      const m = anchored.exec(currentStr);
      if (m) {
        if (Array.isArray(r.tokens)) {
          // If regex has capture groups
          if (m.length > 1) {
            for (let g = 1; g < m.length; g++) {
              console.log(`  Token: "${m[g]}" -> ${r.tokens[g - 1]}`);
            }
          } else {
            console.log(`  Token: "${m[0]}" -> ${r.tokens[0]}`);
          }
        } else {
          console.log(`  Token: "${m[0]}" -> ${r.tokens}`);
        }
        currentStr = currentStr.substring(m[0].length);
        matched = true;
        break;
      }
    }
    if (!matched) {
      currentStr = currentStr.substring(1);
    }
  }
});
