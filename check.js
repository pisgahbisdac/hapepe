const fs = require('fs');
const code = fs.readFileSync('index.html', 'utf8');

// Extract babel script
const match = code.match(/<script type="text\/babel"[^>]*>([\s\S]*?)<\/script>/);
if (!match) {
  console.log("No babel script found");
  process.exit(1);
}
const jsxCode = match[1];

const babel = require('@babel/standalone');
try {
  babel.transform(jsxCode, {presets: ['react']});
  console.log('Syntax OK');
} catch(e) {
  console.error('Syntax Error', e.message);
  console.error('Line:', e.loc?.line);
}
