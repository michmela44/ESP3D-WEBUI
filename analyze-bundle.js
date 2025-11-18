const fs = require('fs');
const path = require('path');

const stats = JSON.parse(fs.readFileSync('bundle-stats-CNC-FluidNC.json', 'utf8'));

// Get module sizes
const modules = {};
stats.chunks[0].modules.forEach(m => {
  const name = m.name.replace(/^\.\//, '');
  modules[name] = m.size || 0;
});

// Sort by size
const sorted = Object.entries(modules)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 40);

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║          TOP 40 LARGEST MODULES IN BUNDLE                     ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

let total = 0;
sorted.forEach(([name, size], idx) => {
  const kb = (size / 1024).toFixed(2);
  const percent = ((size / stats.chunks[0].size) * 100).toFixed(1);
  console.log(`${String(idx + 1).padStart(2)}. ${kb.padStart(7)} KB (${percent.padStart(5)}%)  ${name}`);
  total += size;
});

const bundleSize = stats.chunks[0].size / 1024;
const jsSize = stats.chunks[0].sizes.javascript / 1024;
const cssSize = stats.chunks[0].sizes['css/mini-extract'] / 1024;

console.log(`\n${'─'.repeat(64)}`);
console.log(`Top 40 total:              ${(total / 1024).toFixed(2)} KB`);
console.log(`Overall bundle size:       ${bundleSize.toFixed(2)} KB`);
console.log(`  - JavaScript:            ${jsSize.toFixed(2)} KB`);
console.log(`  - CSS:                   ${cssSize.toFixed(2)} KB`);
console.log(`  - Runtime:               ${(stats.chunks[0].sizes.runtime / 1024).toFixed(2)} KB`);

// Category breakdown
const categories = {
  'node_modules/preact': 0,
  'node_modules/spectre': 0,
  'node_modules/smoothie': 0,
  'src/style': 0,
  'src/pages': 0,
  'src/tabs': 0,
  'src/components': 0,
  'src/targets': 0,
  'Services': 0,
};

Object.entries(modules).forEach(([name, size]) => {
  Object.keys(categories).forEach(cat => {
    if (name.includes(cat)) {
      categories[cat] += size;
    }
  });
});

console.log(`\n${'─'.repeat(64)}`);
console.log('BREAKDOWN BY CATEGORY:\n');

Object.entries(categories)
  .filter(([_, size]) => size > 0)
  .sort((a, b) => b[1] - a[1])
  .forEach(([cat, size]) => {
    const kb = (size / 1024).toFixed(2);
    const percent = ((size / stats.chunks[0].size) * 100).toFixed(1);
    console.log(`${kb.padStart(7)} KB (${percent.padStart(5)}%)  ${cat}`);
  });

console.log(`\n${'─'.repeat(64)}`);
console.log(`\nHTML output:  bundle-report-CNC-FluidNC.html`);
console.log(`Open this file in a browser to see an interactive visualization!\n`);
