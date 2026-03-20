const fs = require('fs');
let code = fs.readFileSync('inject-supabase-html.js', 'utf8');

// 1. FIX UPDATEMONTH
code = code.replace(
    /HistoryManager.updateMonth = \(company, year, monthIndex, updates\) => \{/g,
    `HistoryManager.updateMonth = (monthIndex, year, updates) => {`
);
code = code.replace(
    /const result = window.originalUpdateMonth\(company, year, monthIndex, updates\);/g,
    `const result = window.originalUpdateMonth(monthIndex, year, updates);`
);

// 2. FIX SECUREAPP LOADING LOOP
const oldSessionCheck = `loadProfile(session.user).then(() => {
                              window.loadHistoryFromCloud().then(() => {
                                  setCloudLoading(false);
                              });
                          });`;
const newSessionCheck = `loadProfile(session.user).then(() => {
                              if (!sessionStorage.getItem('cost_analyzer_in_app')) {
                                   setCloudLoading(false);
                              } else {
                                   window.loadHistoryFromCloud().then(() => { setCloudLoading(false); });
                              }
                          });`;
if (code.includes(oldSessionCheck)) {
    code = code.replace(oldSessionCheck, newSessionCheck);
} else {
    // try looser matching
    code = code.replace(/loadProfile\(session\.user\)\.then\(\(\) => \{\s*window\.loadHistoryFromCloud\(\)\.then\(\(\) => \{\s*setCloudLoading\(false\);\s*\}\);\s*\}\);/g, newSessionCheck);
}

// 3. OVERHAUL ADMIN PANEL FOR MULTI-SELECT
const startStr = "const AdminPanelModal = ({ onClose }) => {";
const endStr = "const SecureApp = () => {";
const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
    const newAdminPanel = `
          const CompanySelect = ({ profile, availableCompanies, onChange }) => {
              const [isAll, setIsAll] = useState(profile.allowed_companies === 'ALL' || !profile.allowed_companies);
              const currentList = isAll ? [] : (profile.allowed_companies || '').split(',').map(s=>s.trim()).filter(Boolean);
              
              const updateDB = (val) => {
                  window.supabase.from('profiles').update({allowed_companies: val}).eq('id', profile.id);
                  onChange(val);
              };

              return (
                  <div className="flex flex-col gap-2 mt-3 text-[11px] text-slate-700 bg-white p-3 rounded-lg border border-slate-200 w-full shadow-sm">
                       <label className="font-bold flex items-center gap-2 cursor-pointer text-blue-800 bg-blue-50/50 p-2 rounded hover:bg-blue-50 transition-colors">
                           <input type="checkbox" checked={isAll} onChange={(e) => {
                               setIsAll(true);
                               updateDB('ALL');
                           }} className="rounded text-blue-600 w-4 h-4" /> Acceso a TODAS las empresas (ALL)
                       </label>
                       {!isAll && (
                           <div className="flex flex-wrap gap-2 mt-2 pl-2 border-l-2 border-slate-100">
                               {availableCompanies.map(c => (
                                   <label key={c.id} className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-200 transition-colors border border-slate-200 shadow-sm font-semibold">
                                       <input type="checkbox" checked={currentList.includes(c.name)} onChange={(e) => {
                                            let newList = [...currentList];
                                            if (e.target.checked && !newList.includes(c.name)) newList.push(c.name);
                                            else newList = newList.filter(n => n !== c.name);
                                            if (newList.length === 0) { setIsAll(true); updateDB('ALL'); } 
                                            else updateDB(newList.join(', '));
                                       }} className="rounded text-blue-600 w-3.5 h-3.5" /> {c.name}
                                   </label>
                               ))}
                           </div>
                       )}
                  </div>
              );
          };

          const AdminPanelModal = ({ onClose }) => {
              const [profiles, setProfiles] = useState([]);
              const [loading, setLoading] = useState(true);
              const [actionLoading, setActionLoading] = useState({});
              const allComps = CompanyManager.getCompanies().filter(c => c.id !== 'none' && c.id !== 'default');

              const loadProfiles = async () => {
                  setLoading(true);
                  const { data } = await window.supabase.from('profiles').select('*').order('created_at', { ascending: false });
                  if (data) setProfiles(data);
                  setLoading(false);
              };

              useEffect(() => { loadProfiles(); }, []);

              const handleAction = async (id, role) => {
                  setActionLoading(prev => ({ ...prev, [id]: true }));
                  try {
                      const res = await fetch('/api/admin/role', {
                          method: 'POST',
                          headers: { 
                              'Content-Type': 'application/json',
                              'Authorization': 'Bearer ' + (window.currentUser ? window.currentUser.id : '')
                          },
                          body: JSON.stringify({ userId: id, role })
                      });
                      if (res.ok) {
                          setProfiles(prev => prev.map(p => p.id === id ? { ...p, role } : p));
                      } else {
                          const err = await res.json();
                          alert('Error: ' + err.error);
                      }
                  } catch (e) {
                      alert('Error: ' + e.message);
                  }
                  setActionLoading(prev => ({ ...prev, [id]: false }));
              };

              const pending = profiles.filter(p => p.role === 'pending');
              const approved = profiles.filter(p => p.role === 'viewer' || p.role === 'operator');

              return (
                  <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in-up">
                          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                                  Gestión de Accesos
                              </h2>
                              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-slate-200/50 hover:bg-slate-200 rounded-full p-2 transition-colors cursor-pointer">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                              </button>
                          </div>
                          <div className="p-6 overflow-y-auto flex-1 bg-white">
                              {loading ? (
                                  <div className="flex justify-center py-10">
                                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                  </div>
                              ) : (
                                  <div className="space-y-8">
                                      {pending.length > 0 && (
                                          <div>
                                              <h3 className="text-sm font-bold text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                                  Esperando Aprobación ({pending.length})
                                              </h3>
                                              <div className="flex flex-col gap-3">
                                                  {pending.map(p => (
                                                      <div key={p.id} className="border border-amber-200 bg-amber-50/50 rounded-xl flex flex-col items-start justify-between">
                                                          <div className="p-4 flex flex-col sm:flex-row justify-between w-full items-start sm:items-center gap-4">
                                                              <div>
                                                                  <div className="font-bold text-slate-800">{p.email || p.id}</div>
                                                                  <div className="text-xs text-slate-500 font-mono mt-1">ID: {p.id.split('-')[0]}...</div>
                                                              </div>
                                                              <div className="flex gap-2 w-full sm:w-auto">
                                                                  <button disabled={actionLoading[p.id]} onClick={() => handleAction(p.id, 'viewer')} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-2 rounded-lg text-[11px] font-bold shadow-sm transition-colors cursor-pointer uppercase tracking-wider">
                                                                      {actionLoading[p.id] ? '...' : '+ Lector'}
                                                                  </button>
                                                                  <button disabled={actionLoading[p.id]} onClick={() => handleAction(p.id, 'operator')} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-[11px] font-bold shadow-sm transition-colors cursor-pointer uppercase tracking-wider">
                                                                      {actionLoading[p.id] ? '...' : '+ Operador'}
                                                                  </button>
                                                              </div>
                                                          </div>
                                                          <div className="w-full px-4 pb-4 border-t border-amber-100 pt-3">
                                                              <CompanySelect profile={p} availableCompanies={allComps} onChange={(val) => { p.allowed_companies = val; setProfiles([...profiles]); }} />
                                                          </div>
                                                      </div>
                                                  ))}
                                              </div>
                                          </div>
                                      )}

                                      {approved.length > 0 && (
                                          <div>
                                              <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                                  Usuarios Activos
                                              </h3>
                                              <div className="border border-slate-100 rounded-xl overflow-hidden">
                                                  {approved.map(p => (
                                                      <div key={p.id} className="flex flex-col p-4 hover:bg-slate-50 border-b border-slate-100 last:border-0 gap-4">
                                                          <div className="flex justify-between items-center">
                                                              <div>
                                                                  <div className="font-semibold text-slate-600">{p.email || p.id}</div>
                                                                  <div className="text-[10px] font-bold text-emerald-600 uppercase mt-0.5 tracking-widest">{p.role === 'viewer' ? 'Lector (Viewer)' : 'Operador (Puede Cargar)'}</div>
                                                              </div>
                                                              <button disabled={actionLoading[p.id]} onClick={() => handleAction(p.id, 'pending')} className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors cursor-pointer">
                                                                  Revocar Acceso
                                                              </button>
                                                          </div>
                                                          <div className="w-full border-t border-slate-100 pt-2">
                                                              <CompanySelect profile={p} availableCompanies={allComps} onChange={(val) => { p.allowed_companies = val; setProfiles([...profiles]); }} />
                                                          </div>
                                                      </div>
                                                  ))}
                                              </div>
                                          </div>
                                      )}
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              );
          };

          `;
    code = code.substring(0, startIndex) + newAdminPanel + code.substring(endIndex);
}

fs.writeFileSync('inject-supabase-html.js', code);
console.log('Patch complete!');
