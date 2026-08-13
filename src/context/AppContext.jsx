/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useRef, createContext, useContext } from "react";
import { flushSync } from "react-dom";
import { supabase } from "../supabase";
import { parseDate } from "../lib/utils";

export const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

export function AppProvider({ children, setToast }) {
  const [dark, setDark] = useState(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark-mode", prefersDark);
    document.documentElement.classList.toggle("dark", prefersDark);
    return prefersDark;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark-mode", dark);
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const [session, setSession] = useState(undefined);
  const [role, setRole] = useState(null);
  const [roleLoaded, setRoleLoaded] = useState(false);
  const [editors, setEditors] = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  const [loadingDeliverables, setLoadingDeliverables] = useState(true);
  const lastSeenUpdatedRef = useRef(null);
  const [activeFilter, setActiveFilter] = useState({ type: "", team: null });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session ?? null);
      if (window.location.hash || window.location.search.includes('code=')) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!session) { setRole(null); setRoleLoaded(false); return; }
    supabase.from("user_roles").select("role").eq("user_id", session.user.id).maybeSingle()
      .then(({ data }) => { setRole(data?.role || "visitor"); setRoleLoaded(true); });
    supabase.rpc("get_users_with_roles").then(({ data }) => {
      const editorList = (data || []).filter(u => u.role === "editor" || u.role === "super_admin");
      setEditors(editorList.map(u => u.full_name || u.email || u.user_id));
    });
    if (lastSeenUpdatedRef.current !== session.user.id) {
      lastSeenUpdatedRef.current = session.user.id;
      supabase.auth.updateUser({ data: { last_seen_at: new Date().toISOString() } });
    }
  }, [session]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => setDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const apiFetch = (url, options = {}) => {
    const token = session?.access_token;
    const headers = { ...(options.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    return fetch(url, { ...options, headers });
  };

  useEffect(() => {
    if (!session) return;
    apiFetch("/api/deliverables")
      .then(r => r.json())
      .then(saved => {
        const sorted = [...saved].sort((a, b) => parseDate(b.date) - parseDate(a.date));
        setDeliverables(sorted);
        setLoadingDeliverables(false);
      })
      .catch(() => setLoadingDeliverables(false));
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  const toastTimerRef = useRef(null);
  const showToast = (msg, type = "success") => {
    clearTimeout(toastTimerRef.current);
    setToast({ msg, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 4000);
  };

  const sortByDate = (arr) => [...arr].sort((a, b) => parseDate(b.date) - parseDate(a.date));

  const handleAdd = (item) => {
    setDeliverables(prev => prev.some(d => d.id === item.id) ? prev : sortByDate([item, ...prev]));
    apiFetch("/api/deliverables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    }).catch(() => {});
  };

  const handleDelete = (id) => {
    setDeliverables(prev => prev.filter(d => d.id !== id));
    apiFetch(`/api/deliverables/${id}`, { method: "DELETE" }).catch(() => {});
  };

  const handleUpdate = (item) => {
    flushSync(() => setDeliverables(prev => sortByDate(prev.map(d => d.id === item.id ? item : d))));
    apiFetch(`/api/deliverables/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    }).catch(() => {});
  };

  const isSuperAdmin = role === "super_admin";
  const isEditor = role === "editor" || isSuperAdmin;

  const value = {
    dark, setDark,
    session,
    role, roleLoaded,
    editors,
    deliverables, loadingDeliverables,
    activeFilter, setActiveFilter,
    showToast,
    handleAdd, handleDelete, handleUpdate,
    isEditor, isSuperAdmin,
    apiFetch,
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
