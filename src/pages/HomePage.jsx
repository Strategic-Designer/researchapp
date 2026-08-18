import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import HeroGrid from "../components/HeroGrid";
import ProductCard from "../components/ProductCard";
import ProductCardSkeleton from "../components/ProductCardSkeleton";
import { PRODUCTS, PRODUCT_COLORS } from "../lib/constants";
import { toSlug, formatDate, loadAllProductCoverUrls, getBadgeColor } from "../lib/utils";
import { Badge as UIBadge } from "../components/ui/badges";

export default function HomePage() {
  const navigate = useNavigate();
  const { dark: d, deliverables, loadingDeliverables, setActiveFilter, session } = useApp();
  const [search, setSearch] = useState("");
  const [productCovers, setProductCovers] = useState({});

  useEffect(() => {
    if (!session) return;
    loadAllProductCoverUrls(session.access_token).then(setProductCovers);
  }, [session]);

  const doSearch = () => {
    if (!search.trim()) return;
    const term = search.trim();
    const matchedProduct = PRODUCTS.find(p => p.toLowerCase() === term.toLowerCase());
    if (matchedProduct) {
      setActiveFilter({ type: "Tipo de entregable", team: null, search: "", product: matchedProduct });
    } else {
      setActiveFilter({ type: "Tipo de entregable", team: null, search: term, product: null });
    }
    navigate("/research");
  };

  const handleSearch = (e) => { if (e.key === "Enter") doSearch(); };

  const recent = useMemo(() => deliverables.slice(0, 6), [deliverables]);

  return (
    <div className="flex-1 overflow-y-auto">

      {/* Hero */}
      <div className="relative overflow-hidden" style={{
        background: d
          ? "linear-gradient(160deg,#040C16 0%,#040C16 40%,#061410 70%,#040C16 100%)"
          : "linear-gradient(160deg,#e8f5ee 0%,#f0fdf4 35%,#d6f5e8 65%,#e8f5ee 100%)",
        borderBottom: `1px solid ${d ? "#1a2535" : "#b6e8cc"}`
      }}>
        <HeroGrid dark={d} />

        <div className="relative w-full mx-auto px-4 md:px-8 pt-12 pb-10 md:pt-20 md:pb-16 text-center" style={{ maxWidth: 800 }}>
          <div className="inline-flex items-center text-sm font-semibold mb-4" style={{ color: "#00B369" }}>
            Strategic Design
          </div>
          <h1 className="text-3xl md:text-5xl font-semibold mb-4 leading-tight text-primary">
            Repositorio de <span style={{ color: "#00B369" }}>research</span>
          </h1>
          <p className="text-lg mb-8 text-tertiary">
            Encuentra las investigaciones realizadas por los researchers del equipo.
          </p>
          <div className="relative max-w-lg mx-auto">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text" value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Busca un research o producto..."
              className={`w-full pl-12 pr-4 sm:pr-28 py-4 text-sm rounded-2xl border focus:outline-none focus:ring-1 focus:ring-green-400 focus:border-green-400 bg-surface text-primary placeholder:text-muted ${d ? "shadow-[0_4px_24px_rgba(0,0,0,0.3)]" : "shadow-[0_4px_24px_rgba(0,0,0,0.08)]"}`}
            />
            <button
              onClick={doSearch}
              className={`hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-1 px-2.5 py-1.5 text-sm font-medium rounded-lg transition-colors ${search.trim() ?"bg-muted text-secondary hover:bg-active" :"bg-muted border text-muted cursor-default"}`}
            >
              Enter ↵
            </button>
          </div>
        </div>
      </div>

      <div className="w-full mx-auto px-4 md:px-8 py-8 md:py-10 pb-16" style={{ maxWidth: 1200, backgroundColor: d ? "var(--color-bg-page)" : undefined }}>

        {/* Crear solicitud banner */}
        <div className={`rounded-2xl p-4 md:p-6 mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 md:gap-6 border shadow-xs ${d ? "bg-[#111827] border-[#1f2937]" : "bg-surface"}`}
          style={{ boxShadow: d ? "0 2px 16px rgba(0,0,0,0.4)" : "0 2px 12px rgba(0,0,0,0.06)" }}>
          <div className="flex items-center gap-4">
            <div>
              <p className="font-bold text-base text-primary">¿Necesitas un research?</p>
              <p className="text-sm text-tertiary">Crea una solicitud directamente en Jira y el equipo la tendrá en el radar.</p>
            </div>
          </div>
          <a href="https://prestamype.atlassian.net/secure/CreateIssue!default.jspa" target="_blank" rel="noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#00B369,#00a560)" }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            Crear ticket
          </a>
        </div>

        {/* Por producto */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold mb-4 text-primary">Productos</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {loadingDeliverables
              ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : PRODUCTS.map(p => (
                  <ProductCard key={p} product={p} deliverables={deliverables} coverUrl={productCovers[p]} dark={d}
                    onClick={() => navigate(`/producto/${toSlug(p)}`)} />
                ))
            }
          </div>
        </div>

        {/* Recientes */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-primary">Recientes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {loadingDeliverables
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-xl p-4 animate-pulse bg-surface border shadow-xs">
                    <div className="h-4 w-3/4 rounded mb-2 bg-active" />
                    <div className="flex gap-2">
                      <div className="h-3 w-16 rounded-full bg-active" />
                      <div className="h-3 w-20 rounded-full bg-active" />
                    </div>
                  </div>
                ))
              : recent.map(item => {
              const productTag = item.tags && item.tags.find(t => PRODUCTS.includes(t));
              const pc = productTag ? (PRODUCT_COLORS[productTag] || "#00B369") : null;
              return (
                <button key={item.id} onClick={() => navigate(`/research/${toSlug(item.title)}`, { state: { fromLabel: "Inicio" } })}
                  className={`text-left rounded-xl p-4 flex flex-col transition-all group border hover:border-green-400 shadow-xs ${d ? "bg-[#111827] border-[#1f2937]" : "bg-surface"}`}>
                  <div className="min-w-0 w-full">
                    <p className="font-semibold text-sm leading-snug mb-1.5 truncate text-primary">{item.title}</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <UIBadge color={getBadgeColor(item.typeColor)}>{item.type}</UIBadge>
                      {productTag && pc && (
                        <span className="text-sm px-2 py-0.5 rounded-full flex items-center gap-1 border text-secondary">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: pc }} />
                          {productTag}
                        </span>
                      )}
                      <span className="text-sm text-muted">{formatDate(item.date)}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
