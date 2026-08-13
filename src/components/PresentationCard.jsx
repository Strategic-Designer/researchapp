import { useState, useEffect, useRef } from "react";
import { getPresentationInfo } from "../lib/utils";
import { useApp } from "../context/AppContext";

function DriveIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
      <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
      <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
      <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
      <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
      <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 27h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
    </svg>
  );
}

function FigmaIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" viewBox="0 0 38 57" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 28.5A9.5 9.5 0 1 1 28.5 19 9.5 9.5 0 0 1 19 28.5z" fill="#1ABCFE"/>
      <path d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z" fill="#0ACF83"/>
      <path d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19z" fill="#FF7262"/>
      <path d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z" fill="#F24E1E"/>
      <path d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z" fill="#A259FF"/>
    </svg>
  );
}

export default function PresentationCard({ item, dark: d }) {
  const { session } = useApp();
  const token = session?.access_token || '';
  const pres = getPresentationInfo(item.archivoUrl || "", token);
  const isFigma = pres?.type === "figma";
  const isSlides = pres?.type === "slides";
  const isDocs = pres?.type === "docs";
  const isFigmaSlides = isFigma && /figma\.com\/(slides|deck)\//.test(item.archivoUrl || "");
  const label = isFigmaSlides ? "Presentación en Figma" : isFigma ? "Figma" : isSlides ? "Presentación en Drive" : isDocs ? "Documento en Drive" : "En Drive";
  const [figmaMeta, setFigmaMeta] = useState(null);
  const [thumbFailed, setThumbFailed] = useState(false);
  const [iframeVisible, setIframeVisible] = useState(false);
  const containerRef = useRef(null);

  // Lazy-load iframe only when card enters viewport
  useEffect(() => {
    if (!isFigmaSlides && !isDocs && !isSlides) return;
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIframeVisible(true); observer.disconnect(); } },
      { rootMargin: "100px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isFigmaSlides, isDocs, isSlides]);

  useEffect(() => {
    if (!isFigma || isFigmaSlides || !item.archivoUrl) return;
    fetch(`/api/figma-thumb?url=${encodeURIComponent(item.archivoUrl)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then(r => r.json()).then(data => setFigmaMeta(data)).catch(() => {});
  }, [item.archivoUrl, isFigma, isFigmaSlides]);

  const tokenParam = token ? `&token=${encodeURIComponent(token)}` : '';
  const thumbUrl = isFigma
    ? (item.archivoUrl ? `/api/figma-img?url=${encodeURIComponent(item.archivoUrl)}${tokenParam}` : null)
    : (!isFigma && !isDocs ? (pres?.thumbUrl || null) : null);
  const displayName = isFigma
    ? (figmaMeta?.title || label)
    : (isDocs || isSlides) ? label
    : (item.archivo || label);

  if (!pres) return null;

  return (
    <div className="rounded-xl overflow-hidden bg-surface border shadow-xs" style={{boxShadow:"0 1px 4px rgba(0,0,0,0.08)"}}>
      {thumbUrl && !thumbFailed ? (
        <div ref={containerRef} className="w-full overflow-hidden" style={{height:180}}>
          <img src={thumbUrl} alt="" className="w-full h-full object-cover object-top"
            onError={() => setThumbFailed(true)} />
        </div>
      ) : isSlides && thumbFailed && pres?.embedUrl ? (
        <div ref={containerRef} className="w-full overflow-hidden relative" style={{aspectRatio:"16/9", background:"#f8f9fa"}}>
          {iframeVisible && (
            <iframe
              src={pres.embedUrl}
              title="Google Slides preview"
              loading="lazy"
              style={{
                position:"absolute", top:0, left:0,
                width:"100%",
                height:"100%",
                border:"none",
                pointerEvents:"auto",
              }}
            />
          )}
        </div>
      ) : isFigmaSlides && pres?.embedUrl ? (
        <div ref={containerRef} className="w-full overflow-hidden" style={{height:180, background:"#1e1e1e", position:"relative"}}>
          {iframeVisible && (
            <iframe
              src={pres.embedUrl}
              title="Figma Slides preview"
              loading="lazy"
              style={{
                position:"absolute", top:0, left:0,
                width:"200%", height:"200%",
                border:"none",
                transform:"scale(0.5)", transformOrigin:"top left",
                pointerEvents:"auto",
              }}
            />
          )}
        </div>
      ) : isFigma ? (
        <div className="w-full flex items-center justify-center" style={{height:180, background:"linear-gradient(135deg,#1e1e2e 0%,#2d2b55 100%)"}}>
          <svg viewBox="0 0 38 57" fill="none" className="w-10 h-10 opacity-60" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 28.5A9.5 9.5 0 1 1 28.5 19 9.5 9.5 0 0 1 19 28.5z" fill="#1ABCFE"/>
            <path d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z" fill="#0ACF83"/>
            <path d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19z" fill="#FF7262"/>
            <path d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z" fill="#F24E1E"/>
            <path d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z" fill="#A259FF"/>
          </svg>
        </div>
      ) : isDocs && pres?.embedUrl ? (
        <div ref={containerRef} className="w-full overflow-hidden relative" style={{height:180, background:"#f8f9fa"}}>
          {iframeVisible && (
            <iframe
              src={pres.embedUrl}
              title="Google Docs preview"
              loading="lazy"
              style={{
                position:"absolute", top:0, left:0,
                width:"200%", height:"200%",
                border:"none",
                transform:"scale(0.5)", transformOrigin:"top left",
                pointerEvents:"auto",
              }}
            />
          )}
        </div>
      ) : (
        <div className="w-full flex items-center justify-center gap-3" style={{height:120, background: isSlides ? "linear-gradient(135deg,#fbf3e8 0%,#fde9d3 100%)" : isDocs ? "linear-gradient(135deg,#e8f5e9 0%,#c8e6c9 100%)" : "linear-gradient(135deg,#e8f0fe 0%,#d2e3fc 100%)"}}>
          <DriveIcon />
          <span className="text-sm font-semibold text-gray-500">{isSlides ? "Google Slides" : isDocs ? "Google Docs" : "Google Drive"}</span>
        </div>
      )}

      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          {isFigma ? <FigmaIcon /> : <DriveIcon />}
          <p className="text-sm font-semibold text-primary">{displayName}</p>
        </div>
        <a href={item.archivoUrl} target="_blank" rel="noreferrer"
          className={`ml-2 flex-shrink-0 text-sm font-semibold px-3 py-1 rounded-lg border border-strong hover:bg-hover ${d ? "text-green-400" : "text-green-600"}`}>
          Abrir
        </a>
      </div>
    </div>
  );
}
