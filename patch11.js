const fs = require('fs');
let code = fs.readFileSync('inject-supabase-html.js', 'utf8');

// Replace the shallow copy with a deep clone to shatter React's object memoization equality checks!
code = code.replace(
    /setHistory\(\[\.\.\.HistoryManager\.load\(\)\]\);/g,
    `setHistory(JSON.parse(JSON.stringify(HistoryManager.load())));`
);

fs.writeFileSync('inject-supabase-html.js', code);
console.log('Patch 11 (Deep Clone Render Override) applied!');
