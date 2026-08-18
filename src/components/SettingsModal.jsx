import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { Button } from "./ui/button";
import { Spinner } from "./Spinner";
import { version as APP_VERSION } from "../../package.json";

function fmtDate(str) {
  const d = new Date(str);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

export default function SettingsModal({ onClose, dark }) {
  const d = dark;
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [pendingRoles, setPendingRoles] = useState({});
  const [rolesSaving, setRolesSaving] = useState({});
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      supabase.rpc("get_users_with_roles").then(({ data }) => {
        const list = (data || [])
          .filter(u => ["@prestamype.com", "@cambioseguro.com", "@tandia.com"].some(d => u.email?.endsWith(d)))
          .sort((a, b) => (a.user_id === user?.id ? -1 : b.user_id === user?.id ? 1 : 0));
        setUsers(list);
        setUsersLoading(false);
      });
    });
    supabase.from('access_logs').select('email, accessed_at').order('accessed_at', { ascending: false }).limit(30)
      .then(({ data }) => { setLogs(data || []); setLogsLoading(false); });
  }, []);

  const handleRoleChange = async (userId) => {
    const newRole = pendingRoles[userId];
    if (!newRole) return;
    setRolesSaving(s => ({ ...s, [userId]: true }));
    await supabase.rpc("set_user_role", { target_user_id: userId, new_role: newRole });
    setUsers(u => u.map(x => x.user_id === userId ? { ...x, role: newRole } : x));
    setPendingRoles(p => { const n = { ...p }; delete n[userId]; return n; });
    setRolesSaving(s => ({ ...s, [userId]: false }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="w-full max-w-xl rounded-2xl shadow-2xl bg-surface border overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-subtle sticky top-0 bg-surface z-10">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3" strokeWidth={2}/></svg>
            <h2 className="text-lg font-bold text-primary">Configuración</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted">v{APP_VERSION}</span>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-tertiary hover:bg-hover">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        {/* Roles */}
        <div className="px-6 py-5">
          <p className="text-sm font-bold mb-4 text-primary">Roles de usuario</p>
          {usersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {users.map(u => {
                const isSelf = u.role === "super_admin";
                const currentRole = pendingRoles[u.user_id] ?? u.role;
                const changed = pendingRoles[u.user_id] !== undefined && pendingRoles[u.user_id] !== u.role;
                return (
                  <div key={u.user_id} className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl border bg-muted">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ backgroundColor: "#00B369" }}>
                        {(u.full_name || u.email || "?")[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold truncate text-primary">{u.full_name || "—"}</p>
                          {isSelf && <span className={`text-sm px-2 py-0.5 rounded-full font-semibold ${d ? "bg-green-900/50 text-green-400" : "bg-green-50 text-green-700"}`}>Tú</span>}
                        </div>
                        <p className="text-sm truncate text-tertiary">{u.email}</p>
                        {u.last_seen_at && <p className="text-sm text-muted">Último acceso: {fmtDate(u.last_seen_at)}</p>}
                      </div>
                    </div>
                    {isSelf ? (
                      <span className="text-sm font-semibold px-3 py-1 rounded-lg bg-active text-tertiary">Super Admin</span>
                    ) : (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <select value={currentRole ?? ""} onChange={e => setPendingRoles(p => ({ ...p, [u.user_id]: e.target.value }))} className="sel-arrow text-sm font-semibold px-2 py-1.5 rounded-lg border-strong focus:outline-none focus:ring-2 focus:ring-green-400 bg-active text-primary">
                          {!u.role && <option value="" disabled>Sin acceso</option>}
                          <option value="visitor">Visitante</option>
                          <option value="editor">Editor</option>
                        </select>
                        <button onClick={() => handleRoleChange(u.user_id)} disabled={!changed || rolesSaving[u.user_id]} className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${changed ? "bg-green-500 text-white hover:bg-green-600" : "bg-muted text-tertiary cursor-not-allowed"}`}>
                          {rolesSaving[u.user_id] ? "..." : "Cambiar"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Logs de acceso */}
        <div className="px-6 py-5 border-t border-subtle">
          <p className="text-sm font-bold mb-4 text-primary">Logs de acceso</p>
          {logsLoading ? (
            <div className="flex items-center justify-center py-8"><Spinner size="lg" /></div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted text-center py-4">Sin registros</p>
          ) : (
            <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1">
              {logs.map((log, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-muted">
                  <p className="text-sm text-primary truncate">{log.email}</p>
                  <p className="text-sm text-muted flex-shrink-0 ml-4">{fmtDate(log.accessed_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end px-6 py-4 border-t border-subtle">
          <Button color="secondary" onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    </div>
  );
}
