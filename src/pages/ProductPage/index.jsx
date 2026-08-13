import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { Button } from "../../components/ui/button";
import Card from "../../components/Card";
import CloudinaryPickerModal from "../../components/CloudinaryPickerModal";
import Lightbox from "../../components/Lightbox";
import { PRODUCTS, PRODUCT_COLORS } from "../../lib/constants";
import { Spinner } from "../../components/Spinner";
import { toSlug, formatDate, parseDate, loadAllProductCoverUrls, saveProductCoverRef } from "../../lib/utils";

export default function ProductPage() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const product = PRODUCTS.find(p => toSlug(p) === slug) || slug;
  const { dark: d, deliverables, isEditor, setActiveFilter, session } = useApp();
  const token = session?.access_token;
  const [coverUrl, setCoverUrl] = useState(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  useEffect(() => {
    loadAllProductCoverUrls(token).then(urls => {
      setCoverUrl(urls[product] || null);
    });
  }, [product]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCoverSelect = async (url) => {
    setShowCoverPicker(false);
    setCoverUrl(url);
    setCoverUploading(true);
    try {
      await saveProductCoverRef(product, url, token);
    } catch (err) {
      console.error("Error setting cover:", err?.message || err);
    } finally {
      setCoverUploading(false);
    }
  };

  const scrollRef = useRef(null);
  useEffect(() => { scrollRef.current?.scrollTo({ top: 0 }); }, [slug]);

  const color = PRODUCT_COLORS[product] || "#00B369";

  const productDeliverables = useMemo(
    () => deliverables.filter(item => item.tags.includes(product)),
    [deliverables, product]
  );

  const [ppLightbox, setPpLightbox] = useState(null);

  const { latestBuyerItem, latestUserItem } = useMemo(() => {
    const published = productDeliverables.filter(i => i.status === "Publicado");
    const sorted = [...published].sort((a, b) => parseDate(b.date) - parseDate(a.date));

    const latestBuyerItem = sorted.find(i => {
      const buyers = i.buyers?.length ? i.buyers : (i.personas?.length ? i.personas : []);
      return buyers.some(p => p.images?.length > 0);
    }) || null;

    const latestUserItem = sorted.find(i => {
      return (i.users || []).some(p => p.images?.length > 0);
    }) || null;

    return { latestBuyerItem, latestUserItem };
  }, [productDeliverables]);

  return (
    <>
    <div ref={scrollRef} className="flex-1 overflow-y-auto">
      {showCoverPicker && (
        <CloudinaryPickerModal
          onClose={() => setShowCoverPicker(false)}
          onSelect={handleCoverSelect}
        />
      )}
      {/* Banner */}
      {(coverUrl || isEditor) && (
        <div className="relative flex-shrink-0 group/cover overflow-hidden" style={{ height: 200, backgroundColor: "var(--color-bg-muted)" }}>
          {coverUrl && <img src={coverUrl} alt="" className="w-full h-full object-cover" />}
          {isEditor && (
            <button
              onClick={() => !coverUploading && setShowCoverPicker(true)}
              className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-black/40 text-white opacity-0 group-hover/cover:opacity-100 transition-opacity hover:bg-black/60 disabled:cursor-not-allowed"
              disabled={coverUploading}
            >
              {coverUploading ? <Spinner size="xs" /> : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              )}
              {coverUploading ? "Subiendo..." : "Cambiar portada"}
            </button>
          )}
        </div>
      )}

      {/* Nav bar */}
      <div className="border-b px-4 md:px-8 py-4 sticky top-0 z-10 flex items-center bg-surface">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm font-semibold text-tertiary hover:text-primary transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Volver al inicio
        </button>
      </div>

      <div className="w-full mx-auto px-4 md:px-8 py-6 md:py-8 pb-16" style={{ maxWidth: "1600px" }}>
        {/* Product header */}
        <div className="flex items-center justify-between gap-3 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex-shrink-0 overflow-hidden" style={{ backgroundColor: color }}>
              {coverUrl && <img src={coverUrl} alt="" className="w-full h-full object-cover object-center" />}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary leading-tight">{product}</h1>
              <p className="text-sm text-muted">{productDeliverables.filter(i => i.status === "Publicado").length} entregables publicados</p>
            </div>
          </div>
          {isEditor && (
            <Button color="primary" onClick={() => navigate("/añadir-research", { state: { product } })} className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Añadir research</span>
              <span className="sm:hidden">Añadir</span>
            </Button>
          )}
        </div>
        {/* Persona sections */}
        {(latestBuyerItem || latestUserItem) && (
          <div className="mb-10">
            <div className="space-y-8">
              {[
                { item: latestBuyerItem, getPersonas: i => i.buyers?.length ? i.buyers : (i.personas?.length ? i.personas : []), label: "Buyer Persona", color: "#2563EB", isBuyer: true },
                { item: latestUserItem,  getPersonas: i => i.users || [],                                                          label: "User Persona",  color: "#00B369", isBuyer: false },
              ].filter(({ item }) => item).map(({ item: inv, getPersonas, label, color: bc, isBuyer }) => {
                const personas = getPersonas(inv).filter(p => p.images?.length > 0);
                return (
                  <div key={label} className="rounded-2xl overflow-hidden border bg-surface">
                    {/* Header */}
                    <div className="px-5 py-3 flex items-center gap-3" style={{ backgroundColor: bc }}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                        {isBuyer
                          ? <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0z"/>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 20.25a8.25 8.25 0 0 1 10.5-7.93"/>
                              <circle cx="18.5" cy="17.5" r="3.5" fill="rgba(255,255,255,0.25)" strokeWidth={1.5}/>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.5 15.75v.5m0 2.5v.5m-1.25-2.75c0-.69.56-1.25 1.25-1.25s1.25.56 1.25 1.25-.56 1.25-1.25 1.25-1.25.56-1.25 1.25.56 1.25 1.25 1.25 1.25-.56 1.25-1.25"/>
                            </svg>
                          : <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                        }
                      </div>
                      <p className="text-base font-bold text-white">{label}</p>
                    </div>
                    <div className={`w-full px-5 py-4 border-b flex items-center justify-between gap-4 ${d ? "bg-gray-800/50" : "bg-gray-50"}`}>
                      <div className="min-w-0">
                        <p className="text-base font-bold text-primary truncate">{inv.title}</p>
                        <p className="text-sm text-muted mt-0.5">{formatDate(inv.date)}</p>
                      </div>
                      <button onClick={() => navigate(`/research/${toSlug(inv.title)}`)}
                        className="flex-shrink-0 text-sm font-semibold px-4 py-2 rounded-lg border border-strong hover:bg-hover text-primary transition-colors">
                        Ver research
                      </button>
                    </div>
                    {/* Grid: 1 col mobile, 2 sm, 3 lg */}
                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {personas.map((p, i) => (
                        <div key={i} className="space-y-2">
                          <p className="text-sm font-semibold text-tertiary">Persona {i + 1}</p>
                          <button onClick={() => setPpLightbox({ images: personas.flatMap(x => x.images || []), index: personas.slice(0,i).reduce((s,x)=>s+(x.images||[]).length,0) })}
                            className="relative w-full block rounded-xl overflow-hidden cursor-zoom-in border group" style={{ aspectRatio: "5/6" }}>
                            <img src={p.images[0]} alt={`Persona ${i+1}`} className="w-full h-full object-contain bg-white" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                              <div className={`w-10 h-10 flex items-center justify-center shadow-md ${d ? "bg-gray-800 text-gray-100" : "bg-white text-gray-800"}`} style={{ borderRadius: 12 }}>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607zM10.5 7.5v6m3-3h-6"/></svg>
                              </div>
                            </div>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Research */}
        {(() => {
          const published = [...productDeliverables].filter(i => i.status === "Publicado");
          const byType = {};
          [...published].sort((a, b) => parseDate(b.date) - parseDate(a.date))
            .forEach(i => { if (!byType[i.type]) byType[i.type] = i; });
          const recentResearch = Object.values(byType)
            .sort((a, b) => parseDate(b.date) - parseDate(a.date))
            .slice(0, 3);
          return (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold text-primary">Research de {product}</h2>
                <Button color="secondary" onClick={() => { setActiveFilter({ type: "", team: null, search: "", product }); navigate("/research"); }}>Ver todos</Button>
              </div>
              {recentResearch.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentResearch.map(item => <Card key={item.id} item={item} fromLabel={product} />)}
                </div>
              ) : (
                <p className="text-sm text-muted">Sin research publicados aún.</p>
              )}
            </div>
          );
        })()}

        {/* Otros productos */}
        <div>
          <h2 className="text-base font-semibold mb-4 text-tertiary">Otros productos</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {PRODUCTS.filter(p => p !== product).map(p => {
              const pc = PRODUCT_COLORS[p] || "#00B369";
              const all = deliverables.filter(i => i.tags.includes(p));
              return (
                <button key={p} onClick={() => navigate(`/producto/${toSlug(p)}`)}
                  className="text-left rounded-xl p-4 transition-all group bg-surface border hover:border-strong shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: pc }} />
                      <span className="font-semibold text-base text-primary">{p}</span>
                    </div>
                    <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                  </div>
                  <p className="text-sm text-muted">{all.length} entregable{all.length !== 1 ? "s" : ""}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

    </div>

    {ppLightbox && (
      <Lightbox
        images={ppLightbox.images}
        index={ppLightbox.index}
        onClose={() => setPpLightbox(null)}
        onNavigate={i => setPpLightbox(lb => ({ ...lb, index: i }))}
        showDownload
      />
    )}
    </>
  );
}
