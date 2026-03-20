const fs = require('fs');
let code = fs.readFileSync('inject-supabase-html.js', 'utf8');

// FIX 1: Add type="button" to injected buttons to block form submission overrides
code = code.replace(
    /onclick="sessionStorage.removeItem\('cost_analyzer_in_app'\); window.location.href = window.location.pathname;" class=/g,
    `type="button" onclick="sessionStorage.removeItem('cost_analyzer_in_app'); window.location.href = window.location.pathname;" class=`
);
code = code.replace(
    /onclick="window.appLogout\(\)" class=/g,
    `type="button" onclick="window.appLogout()" class=`
);

// FIX 2: Completely revamp CompanySelect to ALWAYS show companies, and not filter out the default company!
const companySelectRegex = /const CompanySelect = \(\{ profile, availableCompanies, onChange \}\) => \{[\s\S]*?return \([\s\S]*?\s+?\);\s+?\};/g;
const newCompanySelect = `const CompanySelect = ({ profile, availableCompanies, onChange }) => {
              const currentList = (!profile.allowed_companies || profile.allowed_companies === 'ALL') ? availableCompanies.map(c=>c.name) : profile.allowed_companies.split(',').map(s=>s.trim()).filter(Boolean);
              
              const isAllSelected = currentList.length === availableCompanies.length;

              const updateDB = (newList) => {
                  const val = newList.length === availableCompanies.length ? 'ALL' : newList.join(', ');
                  window.supabase.from('profiles').update({allowed_companies: val}).eq('id', profile.id);
                  onChange(val);
              };

              return (
                  <div className="flex flex-col gap-2 mt-3 text-[11px] text-slate-700 bg-white p-3 rounded-lg border border-slate-200 w-full shadow-sm">
                       <label className="font-bold flex items-center gap-2 cursor-pointer text-blue-800 bg-blue-50/50 p-2 rounded hover:bg-blue-50 transition-colors">
                           <input type="checkbox" 
                               checked={isAllSelected} 
                               onChange={(e) => {
                                   if (e.target.checked) updateDB(availableCompanies.map(c=>c.name));
                                   else updateDB([]);
                               }} 
                               className="rounded text-blue-600 w-4 h-4" /> 
                           Acceso a TODAS las empresas
                       </label>
                       <div className="flex flex-col gap-2 mt-2 pl-2 border-l-2 border-slate-100 max-h-32 overflow-y-auto">
                           {availableCompanies.map(c => (
                               <label key={c.id} className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-200 border border-slate-200 font-semibold transition-colors">
                                   <input type="checkbox" 
                                       checked={currentList.includes(c.name)} 
                                       onChange={(e) => {
                                            let newList = [...currentList];
                                            if (e.target.checked && !newList.includes(c.name)) newList.push(c.name);
                                            else newList = newList.filter(n => n !== c.name);
                                            updateDB(newList);
                                       }} 
                                       className="rounded text-blue-600 w-3.5 h-3.5" /> 
                                   {c.name}
                               </label>
                           ))}
                       </div>
                  </div>
              );
          };`;

if (code.match(companySelectRegex)) {
    code = code.replace(companySelectRegex, newCompanySelect);
}

// Ensure allComps doesn't filter out default company!
code = code.replace(
    /const allComps = CompanyManager.getCompanies\(\)\.filter\(c => c\.id !== 'none' && c\.id !== 'default'\);/g,
    `const allComps = CompanyManager.getCompanies().filter(c => c.id !== 'none');`
);

fs.writeFileSync('inject-supabase-html.js', code);
console.log('Patch 4 (Form Submit Fix & Always Visible Multiselect) applied successfully!');
