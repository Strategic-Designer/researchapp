import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import ConfirmModal from "./ConfirmModal";
import { Spinner } from "./Spinner";
import { uploadToCloudinary, deleteFromCloudinary } from "../lib/utils";
import { useApp } from "../context/AppContext";

export default function CloudinaryPickerModal({ onSelect, onClose }) {
  const { session } = useApp();
  const token = session?.access_token;
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null); // { public_id, url }
  const [deleting, setDeleting] = useState(false);

  const fetchList = () => {
    setLoading(true);
    fetch("/api/cloudinary/list", { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json())
      .then(data => { setResources(data.resources || []); setLoading(false); })
      .catch(() => { setError("No se pudo cargar la librería."); setLoading(false); });
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchList(); }, []);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      onSelect(url);
    } catch { setError("Error al subir imagen."); }
    setUploading(false);
    e.target.value = "";
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteFromCloudinary(confirmDelete.url, token);
      setResources(r => r.filter(i => i.public_id !== confirmDelete.public_id));
    } catch (e) { console.error(e); }
    setDeleting(false);
    setConfirmDelete(null);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
        <div onClick={e => e.stopPropagation()} className="w-[640px] max-h-[80vh] rounded-2xl flex flex-col shadow-2xl bg-surface border">
          <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
            <h2 className="font-semibold text-base text-primary">Librería de imágenes</h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-hover text-tertiary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div className="px-5 py-3 border-b flex-shrink-0">
            <Button color="secondary" size="sm" className="flex items-center gap-2 relative" isDisabled={uploading}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
              {uploading ? "Subiendo..." : "Subir imagen"}
              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleUpload} />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            {loading ? (
              <div className="flex justify-center py-12"><Spinner size="lg" /></div>
            ) : error ? (
              <p className="text-sm text-center py-12 text-red-500">{error}</p>
            ) : resources.length === 0 ? (
              <p className="text-sm text-center py-12 text-muted">No hay imágenes en la librería.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {resources.map(img => (
                  <div key={img.public_id} className="relative group rounded-xl overflow-hidden border aspect-square">
                    <img
                      src={img.url}
                      alt=""
                      onClick={() => onSelect(img.url)}
                      className="w-full h-full object-cover cursor-pointer"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(img)}
                      className="absolute bottom-2 right-2 w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 pointer-events-auto"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {confirmDelete && (
        <ConfirmModal
          title="Eliminar imagen"
          message="¿Estás seguro de que quieres eliminar esta imagen de la librería? Esta acción no se puede deshacer."
          confirmLabel={deleting ? "Eliminando..." : "Sí, eliminar"}
          danger
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </>
  );
}
