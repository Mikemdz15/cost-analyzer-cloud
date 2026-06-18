const fs = require('fs');
let fileStr = fs.readFileSync('inject-supabase-html.js', 'utf8');

fileStr = fileStr.replace(
    /return \{\s*id: row\.id,\s*year: row\.year,/g,
    "return {\n                         id: row.id,\n                         created_at: row.created_at,\n                         timestamp: row.created_at,\n                         year: row.year,"
);

fs.writeFileSync('inject-supabase-html.js', fileStr);
console.log(fileStr.includes('created_at: row.created_at') ? "Patch Success" : "Patch Failed");
