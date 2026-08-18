import { useState, useEffect } from "react";
import { AppCtx, AppProvider, useApp } from "./context/AppContext";
import Layout from "./layout/Layout";
import { supabase } from "./supabase";

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await new Promise((resolve, reject) => {
        window.grecaptcha.ready(() => {
          window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'login' }).then(resolve).catch(reject);
        });
      });
      const res = await fetch('/api/recaptcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const { success, score } = await res.json();
      if (!success || score < 0.5) {
        setError('Verificación de seguridad fallida. Intenta de nuevo.');
        setLoading(false);
        return;
      }
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
    } catch {
      setError('Error al verificar. Intenta de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-page">
      <div className="w-full max-w-sm rounded-2xl p-10 flex flex-col items-center gap-6 bg-surface border shadow-sm">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#00B369" }}>
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M11.9995 12.0001H12.0095M15.535 15.5357C10.8488 20.222 5.46685 22.438 3.51423 20.4854C1.56161 18.5328 3.77769 13.1509 8.46398 8.46461C13.1503 3.77832 18.5322 1.56224 20.4848 3.51486C22.4374 5.46748 20.2213 10.8494 15.535 15.5357ZM15.535 8.46443C20.2213 13.1507 22.4374 18.5326 20.4848 20.4852C18.5321 22.4379 13.1502 20.2218 8.46394 15.5355C3.77765 10.8492 1.56157 5.4673 3.51419 3.51468C5.46681 1.56206 10.8487 3.77814 15.535 8.46443ZM12.4995 12.0001C12.4995 12.2763 12.2757 12.5001 11.9995 12.5001C11.7234 12.5001 11.4995 12.2763 11.4995 12.0001C11.4995 11.724 11.7234 11.5001 11.9995 11.5001C12.2757 11.5001 12.4995 11.724 12.4995 12.0001Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-center text-primary">Repositorio de Strategic Research</h1>
          <p className="text-sm text-muted">Inicia sesión para continuar</p>
        </div>
        <button onClick={handleGoogle} disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border font-medium text-sm transition-all bg-surface text-primary hover:bg-hover shadow-sm disabled:opacity-50">
          <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          {loading ? "Redirigiendo..." : "Continuar con Google"}
        </button>
        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
      </div>
    </div>
  );
}

function AppGate({ toast }) {
  const { session, role, roleLoaded } = useApp();

  if (session === undefined) return null;

  if (!session) return <LoginPage />;

  const allowedDomains = ["@prestamype.com", "@cambioseguro.com", "@tandia.com"];
  if (!allowedDomains.some(d => session.user.email?.endsWith(d))) return (
    <div className="min-h-screen flex items-center justify-center bg-page">
      <div className="w-full max-w-sm rounded-2xl border p-10 flex flex-col items-center gap-4 text-center bg-surface shadow-sm">
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-100">
          <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <h2 className="text-lg font-bold text-primary">Acceso restringido</h2>
        <p className="text-sm text-secondary">Debes ingresar con tu <span className="font-semibold">correo corporativo</span> para acceder a este portal.</p>
        <button onClick={() => supabase.auth.signOut()} className="mt-2 text-sm font-semibold text-red-500 hover:text-red-700">Cerrar sesión</button>
      </div>
    </div>
  );

  if (roleLoaded && !role) return (
    <div className="min-h-screen flex items-center justify-center bg-page">
      <div className="w-full max-w-sm rounded-2xl border p-10 flex flex-col items-center gap-4 text-center bg-surface shadow-sm">
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-100">
          <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <h2 className="text-lg font-bold text-primary">Sin acceso</h2>
        <p className="text-sm text-secondary">Tu cuenta no tiene permisos para acceder a este portal. Contacta al administrador.</p>
        <button onClick={() => supabase.auth.signOut()} className="mt-2 text-sm font-semibold text-red-500 hover:text-red-700">Cerrar sesión</button>
      </div>
    </div>
  );

  return <Layout toast={toast} user={session?.user} />;
}

export default function App() {
  const [toast, setToast] = useState(null);

  return (
    <AppProvider setToast={setToast}>
      <AppGate toast={toast} />
    </AppProvider>
  );
}
