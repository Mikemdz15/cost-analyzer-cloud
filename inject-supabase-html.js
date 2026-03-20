const fs = require('fs');
const path = require('path');

const srcFile = path.join('c:', 'Users', 'MIGUEL MENDEZ', '.gemini', 'antigravity', 'playground', 'deep-plasma', 'cost-analyzer', 'index.html');
const destFile = path.join('c:', 'Users', 'MIGUEL MENDEZ', '.gemini', 'antigravity', 'playground', 'deep-plasma', 'cost-analyzer-cloud', 'public', 'index.html');
const envFile = path.join('c:', 'Users', 'MIGUEL MENDEZ', '.gemini', 'antigravity', 'playground', 'deep-plasma', 'cost-analyzer-cloud', '.env.local');

// 1. Read Env Keys
let supabaseUrl = 'YOUR_SUPABASE_URL';
let supabaseKey = 'YOUR_SUPABASE_KEY';
if (fs.existsSync(envFile)) {
    const envContent = fs.readFileSync(envFile, 'utf8');
    const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
    const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
    if (urlMatch) supabaseUrl = urlMatch[1].trim();
    if (keyMatch) supabaseKey = keyMatch[1].trim();
}

// 2. Read Original HTML
let html = fs.readFileSync(srcFile, 'utf8');

// 3. Inject Supabase JS & Auth logic
const headInjection = `
    <!-- SUPABASE INTEGRATION -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script>
        window.SUPABASE_URL = "${supabaseUrl}";
        window.SUPABASE_KEY = "${supabaseKey}";
        window.supabase = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY);
        window.currentUser = null;
    </script>
`;
html = html.replace('</head>', headInjection + '\n</head>');

// 4. Inject Login UI and Auth State into React
// We need to override the ReactDOM.render section.
// The original file ends with:
// const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(<App />);
// </script>

const reactAppReplacement = `
        const OriginalApp = App;
        
        
          const CompanySelect = ({ profile, availableCompanies, onChange }) => {
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
                           <input type="checkbox" id={"checkbox-all-" + profile.id} name="company_all"
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
                                   <input type="checkbox" id={"checkbox-" + profile.id + "-" + c.id} name={"company_" + c.id}
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
          };

          const AdminPanelModal = ({ onClose }) => {
              const [profiles, setProfiles] = useState([]);
              const [loading, setLoading] = useState(true);
              const [actionLoading, setActionLoading] = useState({});
              const allComps = CompanyManager.getCompanies().filter(c => c.id !== 'none');

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
                      const { data: { session: currentSession } } = await window.supabase.auth.getSession();
                      const res = await fetch('/api/admin/role', {
                          method: 'POST',
                          headers: { 
                              'Content-Type': 'application/json',
                              'Authorization': 'Bearer ' + (currentSession ? currentSession.access_token : '')
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

          const SecureApp = () => {
            const [session, setSession] = useState(null);
            const [profile, setProfile] = useState(null);
            const [localLoading, setLocalLoading] = useState(true);
            const [email, setEmail] = useState('');
            const [password, setPassword] = useState('');
            const [authError, setAuthError] = useState('');
            const [showAdminModal, setShowAdminModal] = useState(false);

            const loadProfile = async (user) => {
                let { data: prof, error } = await window.supabase.from('profiles').select('role, email, allowed_companies').eq('id', user.id).single();
                if (!prof) {
                    await window.supabase.from('profiles').insert({ id: user.id, email: user.email, role: 'pending' });
                    prof = { role: 'pending', email: user.email };
                } else if (!prof.email && user.email) {
                    await window.supabase.from('profiles').update({ email: user.email }).eq('id', user.id);
                    prof.email = user.email;
                }
                window.authProfile = prof; setProfile(prof); if (prof) window.overrideHistoryManager(prof.role);
            };

            useEffect(() => {
                window.supabase.auth.getSession().then(({ data: { session } }) => {
                    if (session) {
                        window.currentUser = session.user;
                        loadProfile(session.user).then(() => {
                            window.loadHistoryFromCloud().then(() => {
                                setSession(session);
                                setLocalLoading(false);
                            });
                        });
                    } else {
                        setSession(null);
                        setLocalLoading(false);
                    }
                });

                const {
                    data: { subscription },
                } = window.supabase.auth.onAuthStateChange((_event, session) => {
                    if (session) {
                        window.currentUser = session.user;
                        loadProfile(session.user).then(() => {
                            window.loadHistoryFromCloud().then(() => {
                                setSession(session);
                            });
                        });
                    } else {
                        setSession(null);
                        setProfile(null);
                    }
                });

                return () => subscription.unsubscribe();
            }, []);

            const [isRegistering, setIsRegistering] = useState(false);

            const handleAuth = async (e) => {
                e.preventDefault();
                setLocalLoading(true);
                setAuthError('');
                
                if (isRegistering) {
                    const { data, error } = await window.supabase.auth.signUp({ email, password });
                    if (error) {
                        setAuthError(error.message || 'Error al registrar usuario');
                    } else {
                        // Sincronizar el correo inmediatamente después de registrar
                        if (data?.user?.id) {
                            await window.supabase.from('profiles').update({ email }).eq('id', data.user.id);
                        }
                        setAuthError('¡Registro exitoso! Por favor inicia sesión ahora.');
                        setIsRegistering(false);
                    }
                    setLocalLoading(false);
                } else {
                    const { error } = await window.supabase.auth.signInWithPassword({ email, password });
                    if (error) setAuthError('Credenciales inválidas');
                    setLocalLoading(false);
                }
            };

            const handleLogout = async () => {
                await window.supabase.auth.signOut();
                window.location.reload();
            };

            // Register global logout for the rest of the app to use
            window.appLogout = handleLogout;

            if (localLoading) {
                return (
                    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                        <div className="animate-pulse flex flex-col items-center">
                            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="mt-4 text-slate-500 font-bold">Verificando accesos seguros...</p>
                        </div>
                    </div>
                );
            }

            if (!session) {
                return (
                    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
                        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in">
                            <div className="bg-[#0f172a] p-8 text-center">
                                <h1 className="text-2xl font-black text-white tracking-widest uppercase">Cost<span className="text-blue-500">Analyzer</span></h1>
                                <p className="text-blue-200 text-sm mt-2">Nube Segura de Grupo Alphalab</p>
                            </div>
                            <div className="p-8">
                                <form onSubmit={handleAuth} className="space-y-6">
                                    {authError && <div className={"p-3 rounded-lg text-sm font-bold text-center border " + (authError.includes('éxito') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200')}>{authError}</div>}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
                                        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="usuario@alphalab.com" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
                                        <input type="password" required value={password} onChange={e => setPassword(e.target.value)} minLength={6} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="••••••••" />
                                    </div>
                                    <button type="submit" disabled={localLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors">
                                        {localLoading ? 'Procesando...' : (isRegistering ? 'Crear Cuenta' : 'Ingresar al Sistema')}
                                    </button>
                                    
                                    <div className="text-center mt-4">
                                        <button type="button" onClick={() => { setIsRegistering(!isRegistering); setAuthError(''); }} className="text-sm text-blue-600 hover:text-blue-800 font-semibold hover:underline bg-transparent border-0 cursor-pointer p-2">
                                            {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Solícita acceso (Registro)'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                );
            }

            if (profile?.role === 'pending') {
                return (
                    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden text-center p-10 border border-slate-200">
                            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">Acceso Pendiente</h2>
                            <p className="text-slate-600 mb-6">Tu cuenta ha sido registrada exitosamente, pero está esperando la autorización del Administrador.</p>
                            <p className="text-sm border p-4 rounded-lg bg-slate-50 text-slate-500 font-medium">Por favor contacta a Miguel Mendez para que habilite tu acceso al visor de costos.</p>
                            <div className="mt-8">
                                <button onClick={handleLogout} className="text-blue-600 font-semibold hover:underline bg-transparent border-0 cursor-pointer">← Regresar e Iniciar con otra cuenta</button>
                            </div>
                        </div>
                    </div>
                );
            }

            return (
                <div className="relative">
                    {profile?.role === 'admin' && (
                        <div className="fixed bottom-6 right-6 z-50">
                            <button onClick={() => setShowAdminModal(true)} className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2 text-sm transition-all hover:scale-105 border border-slate-700 cursor-pointer">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                                Gestión de Usuarios
                            </button>
                        </div>
                    )}
                    {showAdminModal && <AdminPanelModal onClose={() => setShowAdminModal(false)} />}
                    <OriginalApp />
                </div>
            );
        };

        // Inject the Supabase Backend into HistoryManager dynamically
        window.overrideHistoryManager = (profileRole) => {
               // Global helper functions
               window.returnToHome = () => {
                   try { sessionStorage.removeItem('cost_analyzer_in_app'); } catch(e){ console.error(e); }
                   window.location.href = window.location.pathname;
               };
               window.appLogout = async () => {
                   await window.supabase.auth.signOut();
                   window.location.href = window.location.pathname; // triggers login view
               };

             const activeCompanyObj = CompanyManager.getActiveCompany() || {id: 'default', name: 'Grupo Alphalab de M'};
               const activeCompany = activeCompanyObj.name;
               const activeCompanyId = activeCompanyObj.id;
             
             // Inject the Auth Pill via MutationObserver so it survives React renders
             const observer = new MutationObserver(() => {
                 const buttons = Array.from(document.querySelectorAll('button'));
                 const loadButton = buttons.find(b => b.textContent && b.textContent.includes('Cargar / Analizar'));
                 
                 // Role Restrictions logic: Hide Cargar for Viewer
                 if (profileRole === 'viewer') {
                     if (loadButton && loadButton.style.display !== 'none') {
                         loadButton.style.display = 'none'; // Escondemos la pestaña completamente
                         const historyBtn = buttons.find(b => b.textContent && b.textContent.includes('Historial'));
                         if (historyBtn && !window.forcedViewerJump) {
                             window.forcedViewerJump = true;
                             setTimeout(() => historyBtn.click(), 100); // Forzamos ir a Historial
                         }
                     }
                     
                     // Hide "+ Create Company" button for viewers
                     const newCompBtn = buttons.find(b => b.textContent && b.textContent.includes('Nueva Empresa'));
                     if (newCompBtn) newCompBtn.style.display = 'none';
                 }

                 // Only inject when we actually know the role to avoid the 'ADMIN' default state race condition
                 if (loadButton && !document.getElementById('auth-pill-injected') && profileRole) {
                     const pill = document.createElement('div');
                     pill.id = 'auth-pill-injected';
                     pill.className = 'flex items-center gap-3 bg-blue-50/50 w-fit px-4 py-1.5 rounded-full border border-blue-200/60 shadow-sm mr-4';
                     pill.innerHTML = \`
                        <span class="text-xs font-bold text-slate-700 flex items-center gap-2 tracking-wide">
                           <div class="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div> 
                           \${window.currentUser ? window.currentUser.email : 'Logueado'} 
                           <span class="text-[9px] bg-blue-600 text-white px-2 py-0.5 rounded ml-1 tracking-widest font-black uppercase\">\${profileRole === 'viewer' ? 'LECTOR' : (profileRole === 'operator' ? 'OPERADOR' : 'ADMIN')}</span>
                        </span>
                        <button type="button" onclick="window.returnToHome()" class="text-[10px] text-slate-700 font-bold hover:bg-slate-200 px-3 py-1 rounded-full transition-colors ml-4 uppercase tracking-widest">Volver a Inicio</button><button type="button" onclick="window.appLogout()" class="text-[10px] text-red-600 font-bold hover:bg-red-100 px-3 py-1 rounded-full transition-colors ml-4 border border-red-200 uppercase tracking-widest">Cerrar Sesión</button>
                     \`;
                     loadButton.parentNode.insertBefore(pill, loadButton);
                 }
             });
             observer.observe(document.body, { childList: true, subtree: true });
             
                            // --- COMPANY MANAGER OVERRIDE ---
               const originalGetCompanies = CompanyManager.getCompanies;
               CompanyManager.getCompanies = () => {
                    let comps = originalGetCompanies();
                    const prof = window.authProfile;
                    if (prof && prof.allowed_companies && prof.allowed_companies !== 'ALL') {
                         const allowed = prof.allowed_companies.split(',').map(s=>s.trim());
                         comps = comps.filter(c => allowed.includes(c.name));
                         if (comps.length === 0) comps = [{id: 'none', name: 'ACCESO RESTRINGIDO - Contacta a Miguel'}];
                    }
                    return comps;
               };

               // --- OVERRIDE UPDATE MONTH FOR COMMENTS ---
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
                       preloadedHistory = [...preloadedHistory];
                       if (result) {
                           const updatedRow = HistoryManager.load().find(h => h.year === year && h.monthIndex === monthIndex);
                           if (updatedRow) {
                               
                                 console.log("INTENTANDO ACTUALIZAR CON ESTAS LLAVES EXACTAS:", { company_id: activeCompanyId, year: year, month_index: monthIndex });
                                 window.supabase.from('monthly_history')
                                    .update({ summary_jsonb: updatedRow })
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
     });
                           }
                       }
                       return result;
                   };
               }

               // --- ADMIN DELETE COMPANY BUTTON ---
               if (profileRole === 'admin') {
                   const observerAdmin = new MutationObserver(() => {
                        const selectBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Nueva Empresa'));
                        if (selectBtn && !document.getElementById('delete-company-btn')) {
                             const delBtn = document.createElement('button');
                             delBtn.id = 'delete-company-btn';
                             delBtn.className = 'w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 transition-colors flex items-center gap-2 font-bold text-xs mt-2 border-t border-red-100';
                             delBtn.innerHTML = '??? Eliminar Empresa Actual';
                             delBtn.onclick = async () => {
                                 if(confirm('�Est�s seguro de eliminar ' + activeCompany + ' de forma permanente?')) {
                                     await window.supabase.from('monthly_history').delete().eq('company_id', activeCompanyId);
                                     await window.supabase.from('production_runs').delete().eq('company_id', activeCompanyId);
                                     let comps = CompanyManager.getCompanies().filter(c => c.name !== activeCompany);
                                     if (comps.length === 0) comps.push({ id: 'default', name: 'Grupo Alphalab de M�xico' });
                                     localStorage.setItem(CompanyManager.STORAGE_KEY, JSON.stringify(comps));
                                     localStorage.setItem(CompanyManager.CURRENT_KEY, comps[0].id);
                                     window.location.reload();
                                 }
                             };
                             selectBtn.parentNode.appendChild(delBtn);
                        }
                   });
                   observerAdmin.observe(document.body, { childList: true, subtree: true });
               }

               // WE PRELOAD THE HISTORY SO THE SYNCHRONOUS APP DOESN'T BREAK!
             let preloadedHistory = window._globalPreloadedHistory || [];
             
             // Replace load function
             HistoryManager.load = () => {
                 return preloadedHistory;
             };
             
             // This function must be called on mount to fetch data from Supabase DB
             window.loadHistoryFromCloud = async () => {
                 const {data, error} = await window.supabase.from('monthly_history').select('*').eq('company_id', activeCompanyId).order('year', {ascending: true}).order('month_index', {ascending: true});
                 if (error) {
                     console.error("Cloud DB Error", error);
                     return;
                 }
                 
                 const historyIds = data.map(r => r.id);
                 let allRuns = [];
                 if (historyIds.length > 0) {
                     // Fetch runs per month with pagination to avoid the 1000 rows limit
                     for (let hid of historyIds) {
                         let fromIndex = 0;
                         let step = 1000;
                         while (true) {
                             const {data: runsData, error: runsError} = await window.supabase
                                 .from('production_runs')
                                 .select('history_id, run_data')
                                 .eq('history_id', hid)
                                 .range(fromIndex, fromIndex + step - 1);
                             
                             if (!runsError && runsData && runsData.length > 0) {
                                 allRuns.push(...runsData);
                                 if (runsData.length < step) break; // Finished this month
                                 fromIndex += step;
                             } else {
                                 break;
                             }
                         }
                     }
                 }

                 preloadedHistory = data.map(row => {
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
             };
                 window._globalPreloadedHistory = preloadedHistory;
             };

             HistoryManager.saveMonth = async (data) => {
                 // 1. Save to monthly_history (WITHOUT runs, to keep summary JSONB small)
                 const historyPayload = {
                     company_id: activeCompanyId, company_name: activeCompany,
                     month_index: data.monthIndex,
                     year: data.year || new Date().getFullYear(),
                     summary_jsonb: {
                         summary: data.summary,
                         details: data.details,
                         skuDetails: data.skuDetails,
                         boms: data.boms,
                         comments: data.comments || {}
                         // NOTICE: runs are EXCLUDED here to match the schema
                     }
                 };
                 
                 const { data: historyRow, error: historyError } = await window.supabase
                     .from('monthly_history')
                     .insert(historyPayload)
                     .select()
                     .single();

                 if (historyError) {
                     if (historyError.code === '23505' || historyError.message.includes('duplicate key')) {
                         alert("Error: Este mes ya existe en la Nube. Borra el mes anterior primero desde tu panel de gráficas.");
                     } else {
                         alert("Error guardando historial general en Supabase: " + historyError.message);
                     }
                     return false;
                 }

                 // 2. Save runs to production_runs
                 if (data.runs && data.runs.length > 0) {
                     const productionRuns = data.runs.map(r => ({
                         history_id: historyRow.id,
                         sku: r.sku,
                         run_data: r
                     }));

                     const chunkSize = 1000;
                     for (let i = 0; i < productionRuns.length; i += chunkSize) {
                         const chunk = productionRuns.slice(i, i + chunkSize);
                         const { error: runsError } = await window.supabase.from('production_runs').insert(chunk);
                         if (runsError) {
                             console.error("Error validando chunk de runs", runsError);
                             alert("Error cargando el detalle completo de producción. La información básica sí se guardó.");
                             return false;
                         }
                     }
                 }
                 
                 alert("¡Carga masiva exitosa a la Nube Segura (Producción + Runs)!");
                 window.location.reload(); // Recarga la página para destruir el "MODO VISTA PREVIA"
                 return true;
             };
             
             HistoryManager.deleteMonth = async (monthIndex, year) => {
                  try {
                      // Because of ON DELETE CASCADE, deleting the history deletes the production_runs!
                      const { error } = await window.supabase.from('monthly_history').delete()
                            .eq('company_name', activeCompany)
                            .eq('month_index', monthIndex)
                            .eq('year', year || new Date().getFullYear());
                      
                      if (error) console.error(error);
                      await window.loadHistoryFromCloud();
                      window.location.reload();
                  } catch(e) {}
                  return null;
             };
        };

        // Now start the React App
        const root = ReactDOM.createRoot(document.getElementById('root'));
        
        // Wrapper Component to handle the asynchronous pre-loading of data before rendering OriginalApp
        const AsyncCloudBootstrapper = () => {
            const [ready, setReady] = useState(false);
            useEffect(() => {
                window.overrideHistoryManager();
                window.loadHistoryFromCloud().then(() => setReady(true));
            }, []);
            
            if (!ready) return <div className="p-10 text-center text-blue-600 font-bold animate-pulse text-lg">Sincronizando con Supabase Cloud...</div>;
            return <SecureApp />;
        };

        root.render(<AsyncCloudBootstrapper />);
`;

// Replace the ReactDOM render call
html = html.replace(/const root = ReactDOM.createRoot\(document.getElementById\('root'\)\);[\s\S]*?root.render\(<App \/>\);/, reactAppReplacement);


// FORCE DEEP CLONE RENDER OVERRIDE IN THE VANILLA REACT APP
html = html.replace(/setHistory\(HistoryManager\.load\(\)\);/g, "setHistory(JSON.parse(JSON.stringify(HistoryManager.load())));");

fs.writeFileSync(destFile, html);
        
console.log('Successfully injected Supabase and Auth into the monolith HTML!');





