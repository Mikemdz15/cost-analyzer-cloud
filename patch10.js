const fs = require('fs');
let code = fs.readFileSync('inject-supabase-html.js', 'utf8');

// Forcing a deep copy on the setHistory state array to prevent React from bailing out on rendering the updated comment
code = code.replace(
    /setHistory\(HistoryManager\.load\(\)\);/g,
    `setHistory([...HistoryManager.load()]);`
);

fs.writeFileSync('inject-supabase-html.js', code);
console.log('Patch 10 (Force React Rerender) applied!');
