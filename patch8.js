const fs = require('fs');
let code = fs.readFileSync('inject-supabase-html.js', 'utf8');

// Modify the update chain to invoke .select() so we can definitively see if RLS blocks it (returning 0 rows)
code = code.replace(
    /\.update\(\{ summary_jsonb: updatedRow \}\)\s*\.match\(\{ company_id: activeCompanyId, year: year, month_index: monthIndex \}\)\s*\.then\(\(\{[^}]+\}\) => \{[^\}]+\}\);/g,
    `.update({ summary_jsonb: updatedRow })
     .match({ company_id: activeCompanyId, year: year, month_index: monthIndex })
     .select()
     .then(({data, error}) => { 
         if(error) console.error('Error syncing:', error); 
         else {
             console.log('SUPABASE SAVE RESULT:', data);
             if (data && data.length === 0) {
                 console.error('CRITICAL: Supabase accepted the request but updated ZERO rows! This means Row Level Security (RLS) is blocking you, or the company_id/year/month match failed!');
             }
         }
     });`
);

fs.writeFileSync('inject-supabase-html.js', code);
console.log('Patch 8 (RLS Echo) applied!');
