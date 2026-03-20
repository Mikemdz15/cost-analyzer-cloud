const fs = require('fs');
let code = fs.readFileSync('inject-supabase-html.js', 'utf8');

// Inject the ultimate console log to see exactly what we are asking Supabase to match
code = code.replace(
    /\.update\(\{ summary_jsonb: updatedRow \}\)\s*\.match\(\{ company_id: activeCompanyId, year: year, month_index: monthIndex \}\)/g,
    `
     .update({ summary_jsonb: updatedRow })
     .match({ company_id: activeCompanyId, year: year, month_index: monthIndex })
     `.replace(/\s+/g, ' ') // Strip spaces for easy replacement
);

// Actually regex replacement above is risky if spacing is off. We will just globally replace the target line.
code = fs.readFileSync('inject-supabase-html.js', 'utf8');

const targetStr = `.update({ summary_jsonb: updatedRow })
                                    .match({ company_id: activeCompanyId, year: year, month_index: monthIndex })`;
const replacementStr = `
                                 console.log("INTENTANDO ACTUALIZAR CON ESTAS LLAVES EXACTAS:", { company_id: activeCompanyId, year: year, month_index: monthIndex });
                                 window.supabase.from('monthly_history')
                                    .update({ summary_jsonb: updatedRow })
                                    .match({ company_id: activeCompanyId, year: year, month_index: monthIndex })`;

code = code.replace(/window\.supabase\.from\('monthly_history'\)\s*\.update\(\{ summary_jsonb: updatedRow \}\)\s*\.match\(\{ company_id: activeCompanyId, year: year, month_index: monthIndex \}\)/g, replacementStr);

fs.writeFileSync('inject-supabase-html.js', code);
console.log('Patch 9 (Match Params Echo) applied!');
