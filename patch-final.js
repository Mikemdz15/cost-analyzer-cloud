const fs = require('fs');
let code = fs.readFileSync('inject-supabase-html.js', 'utf8');

// FIX 1: HistoryManager.updateMonth signature interceptor
const updateMonthBlock = `// --- OVERRIDE UPDATE MONTH FOR COMMENTS ---
               if (!window.originalUpdateMonth) {
                   window.originalUpdateMonth = HistoryManager.updateMonth;
                   HistoryManager.updateMonth = (compOrMonth, yearOrMonth, monthOrUpdates, updatesObj) => {
                       if (profileRole === 'viewer') return null;
                       
                       let company, year, monthIndex, updates;
                       if (typeof compOrMonth === 'string' && typeof yearOrMonth === 'number') {
                           company = compOrMonth;
                           year = yearOrMonth;
                           monthIndex = monthOrUpdates;
                           updates = updatesObj;
                       } else {
                           monthIndex = compOrMonth;
                           year = yearOrMonth;
                           updates = monthOrUpdates;
                           const obj = CompanyManager.getActiveCompany();
                           company = obj ? obj.name : 'default';
                       }
                       
                       // OriginalApp bug fix: pass only the 3 arguments it famously expects
                       const result = window.originalUpdateMonth(monthIndex, year, updates);
                       if (result) {
                           const updatedRow = HistoryManager.load().find(h => h.year === year && h.monthIndex === monthIndex);
                           if (updatedRow) {
                               window.supabase.from('monthly_history')
                                  .update({ data_payload: updatedRow })
                                  .match({ company_id: activeCompanyId, year: year, month_index: monthIndex })
                                  .then(({error}) => { if(error) console.error('Error syncing:', error); });
                           }
                       }
                       return result;
                   };
               }`;

// Replace whatever is currently under "// --- OVERRIDE UPDATE MONTH FOR COMMENTS ---" up to the Admin Button
const updateMonthRegex = /\/\/ --- OVERRIDE UPDATE MONTH FOR COMMENTS ---[\s\S]*?(?=\/\/ --- ADMIN DELETE COMPANY BUTTON ---)/;
code = code.replace(updateMonthRegex, updateMonthBlock + "\n\n               ");

// FIX 2: Admin API JWT Token
const fetchRegex = /const res = await fetch\('\/api\/admin\/role', {[\s\S]*?body: JSON.stringify\({ userId: id, role }\)\s*}\);/g;
const newFetch = `const { data: { session: currentSession } } = await window.supabase.auth.getSession();
                      const res = await fetch('/api/admin/role', {
                          method: 'POST',
                          headers: { 
                              'Content-Type': 'application/json',
                              'Authorization': 'Bearer ' + (currentSession ? currentSession.access_token : '')
                          },
                          body: JSON.stringify({ userId: id, role })
                      });`;

code = code.replace(fetchRegex, newFetch);


// FIX 3: "Volver a Inicio" Button navigation issue
const oldBtn = `<button onclick="sessionStorage.removeItem('cost_analyzer_in_app'); window.location.reload();"`;
const newBtn = `<button onclick="sessionStorage.removeItem('cost_analyzer_in_app'); window.location.href = window.location.pathname;"`;
code = code.replace(oldBtn, newBtn);

fs.writeFileSync('inject-supabase-html.js', code);
console.log("FINAL PATCH WRITTEN SUCCESSFULLY");
