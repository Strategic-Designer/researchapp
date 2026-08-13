import { useState } from "react";
import { Button } from "../../components/ui/button";
import ConfirmModal from "../../components/ConfirmModal";
import { Spinner } from "../../components/Spinner";
import { deleteFromCloudinary } from "../../lib/utils";
import { useApp } from "../../context/AppContext";

export default function ImagePickerModal({ deliverables, onSelect, onUpload, onDelete, onClose }) {
  const { session } = useApp();
  const [images, setImages] = useState(() => {
    const seen = new Set();
    const imgs = [];
    (deliverables || []).forEach(item => {
      (item.imagenes || []).forEach(url => { if (!seen.has(url)) { seen.add(url); imgs.push(url); } });
    });
    return imgs;
  });
  const [deleting, setDeleting] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const handleDelete = async (url) => {
    setDeleting(url);
    try {
      await deleteFromCloudinary(url, session?.access_token);
      await onDelete(url);
      setImages(imgs => imgs.filter(u => u !== url));
    } catch (err) {
      alert(err.message);
    }
    setDeleting(null);
  };

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-[560px] max-h-[80vh] rounded-2xl flex flex-col shadow-2xl bg-surface border">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold text-base text-primary">Imágenes adjuntas</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-hover text-tertiary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="px-6 py-3 border-b">
          <Button color="secondary" onClick={onUpload} className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
            Subir nueva imagen
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {images.length === 0 ? (
            <p className="text-sm text-center py-8 text-muted">No hay imágenes subidas aún.</p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {images.map((url, i) => (
                <div key={i} className="relative group">
                  <button onClick={() => onSelect(url)}
                    className={`w-full rounded-xl overflow-hidden transition-all hover:border-green-500 aspect-video border ${deleting === url ?"opacity-40" :""}`}>
                    {deleting === url
                      ? <div className="w-full h-full flex items-center justify-center"><Spinner size="md" /></div>
                      : <img src={url} alt="" className="w-full h-full object-cover" />}
                  </button>
                  {deleting !== url && (
                    <button onClick={() => setConfirmTarget(url)}
                      className="absolute top-1.5 right-1.5 flex items-center justify-center w-6 h-6 flex-shrink-0 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    {confirmTarget && (
      <ConfirmModal
        title="Eliminar imagen"
        message="¿Estás seguro de que quieres eliminar esta imagen? Se quitará de todos los research."
        confirmLabel="Sí, eliminar"
        danger
        onConfirm={async () => { await handleDelete(confirmTarget); setConfirmTarget(null); }}
        onCancel={() => setConfirmTarget(null)}
      />
    )}
    </>
  );
}
