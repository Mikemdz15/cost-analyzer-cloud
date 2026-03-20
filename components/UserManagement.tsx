'use client'
import { useState } from 'react'
import { setRole } from '@/app/actions/users'

export function UserManagement({ profiles }: { profiles: any[] }) {
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

    const handleAction = async (id: string, role: string) => {
        setLoadingMap(prev => ({ ...prev, [id]: true }));
        await setRole(id, role);
        setLoadingMap(prev => ({ ...prev, [id]: false }));
    };

    if (!profiles || profiles.length === 0) return null;

    const pendingProfiles = profiles.filter(p => p.role === 'pending');
    
    // Si no es admin y no hay pendientes pero queremos mostrar la lista de aprobados:
    const approvedProfiles = profiles.filter(p => p.role === 'viewer');

    if (pendingProfiles.length === 0 && approvedProfiles.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl shadow border border-slate-200 p-6 mt-8">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                Gestión de Usuarios
                {pendingProfiles.length > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingProfiles.length} Pendiente(s)</span>}
            </h2>

            {pendingProfiles.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Esperando Aprobación</h3>
                    <div className="grid gap-3">
                        {pendingProfiles.map(p => (
                            <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 border border-amber-200 rounded-lg">
                                <div>
                                    <span className="font-semibold text-slate-700">{p.email || p.id}</span>
                                    <span className="ml-2 text-xs bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded">Pendiente</span>
                                </div>
                                <div className="flex gap-2">
                                    <button disabled={loadingMap[p.id]} onClick={() => handleAction(p.id, 'viewer')} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm font-semibold shadow-sm disabled:opacity-50">
                                        Otorgar Acceso
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {approvedProfiles.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Usuarios Aprobados</h3>
                    <div className="grid gap-2">
                        {approvedProfiles.map(p => (
                            <div key={p.id} className="flex items-center justify-between p-2 hover:bg-slate-50 border-b border-slate-100 last:border-0 rounded-lg">
                                <div className="text-slate-600 text-sm font-medium">{p.email || p.id}</div>
                                <div className="flex gap-2">
                                    <button disabled={loadingMap[p.id]} onClick={() => handleAction(p.id, 'pending')} className="text-xs text-red-500 hover:text-red-700 hover:underline px-2 py-1">
                                        Revocar Acceso
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
