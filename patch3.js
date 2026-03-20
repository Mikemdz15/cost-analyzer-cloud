const fs = require('fs');
let code = fs.readFileSync('inject-supabase-html.js', 'utf8');

// The issue is that `HistoryManager.load = () => { return preloadedHistory; }`
// returns the SAME array reference. When `OriginalApp` does `setHistory(HistoryManager.load())`,
// React bails out of rendering because `oldHistory === newHistory`.
// We need to mutate the `preloadedHistory` reference when `updateMonth` is called.

const updateMonthRegex = /const result = window\.originalUpdateMonth\(monthIndex, year, updates\);/g;
if (code.match(updateMonthRegex)) {
    code = code.replace(updateMonthRegex, `const result = window.originalUpdateMonth(monthIndex, year, updates);\n                       preloadedHistory = [...preloadedHistory];`);
}

fs.writeFileSync('inject-supabase-html.js', code);
console.log('Patch 3 (React Array Reference Bypass) applied successfully!');
