const fs = require('fs');
let fileStr = fs.readFileSync('inject-supabase-html.js', 'utf8');

const t1 = "             let preloadedHistory = [];";
const r1 = "             let preloadedHistory = window._globalPreloadedHistory || [];";

const t2 = "                 preloadedHistory = data.map(row => {";
const r2 = `                 preloadedHistory = data.map(row => {
                     const monthRuns = allRuns.filter(r => r.history_id === row.id).map(r => r.run_data);
                     return {
                         id: row.id,
                         created_at: row.created_at,
                         timestamp: row.created_at,
                         year: row.year,
                         monthIndex: row.month_index,
                         monthName: new Date(row.year, row.month_index - 1, 1).toLocaleString('es-MX', { month: 'long' }),
                         summary: row.summary_jsonb.summary,
                         details: row.summary_jsonb.details || [],
                         skuDetails: row.summary_jsonb.skuDetails || [],
                         runs: monthRuns,
                         boms: row.summary_jsonb.boms || {},
                         comments: row.summary_jsonb.comments || {}
                     };
                 });
                 window._globalPreloadedHistory = preloadedHistory;
             }; // End of loadHistoryFromCloud
             
             // --- REMOVE THIS EXTRA BLOCK IF IT EXISTS ---
             /*`;

const t3 = `                         comments: row.summary_jsonb.comments || {}
                     };
                 });
             };`;

const r3 = ``;

// Just manual replace string logic
fileStr = fileStr.split(t1).join(r1);

// We replace the entire mapping block to be absolute sure we don't mess up braces
const blockStart = "                 preloadedHistory = data.map(row => {";
const blockEnd = "                 });\r\n             };";
const blockEndLF = "                 });\n             };";

const startIndex = fileStr.indexOf(blockStart);

// find the exact line
if (startIndex !== -1) {
    let endIndex = fileStr.indexOf(blockEnd, startIndex);
    let endLen = blockEnd.length;
    if (endIndex === -1) {
        endIndex = fileStr.indexOf(blockEndLF, startIndex);
        endLen = blockEndLF.length;
    }
    
    if (endIndex !== -1) {
        const exactReplacement = `                 preloadedHistory = data.map(row => {
                     const monthRuns = allRuns.filter(r => r.history_id === row.id).map(r => r.run_data);
                     return {
                         id: row.id,
                         created_at: row.created_at,
                         timestamp: row.created_at,
                         year: row.year,
                         monthIndex: row.month_index,
                         monthName: new Date(row.year, row.month_index - 1, 1).toLocaleString('es-MX', { month: 'long' }),
                         summary: row.summary_jsonb.summary,
                         details: row.summary_jsonb.details || [],
                         skuDetails: row.summary_jsonb.skuDetails || [],
                         runs: monthRuns,
                         boms: row.summary_jsonb.boms || {},
                         comments: row.summary_jsonb.comments || {}
                     };
                 });
                 window._globalPreloadedHistory = preloadedHistory;
             };`;
             
             fileStr = fileStr.substring(0, startIndex) + exactReplacement + fileStr.substring(endIndex + endLen);
    }
}

fs.writeFileSync('inject-supabase-html.js', fileStr);
console.log(fileStr.includes('window._globalPreloadedHistory') && fileStr.includes('timestamp: row.created_at') ? "Patch Success" : "Patch Failed");
