const fs = require('fs');
let code = fs.readFileSync('inject-supabase-html.js', 'utf8');

// Fix the incorrect column name 'data_payload' to 'summary_jsonb'
code = code.replace(
    /\.update\(\{ data_payload: updatedRow \}\)/g,
    ".update({ summary_jsonb: updatedRow })"
);

fs.writeFileSync('inject-supabase-html.js', code);
console.log('Patch 7 (Column Name Fix) applied!');
