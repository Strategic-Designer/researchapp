import { useState } from "react";
import { Button } from "./ui/button";
import CloudinaryPickerModal from "./CloudinaryPickerModal";
import ConfirmModal from "./ConfirmModal";
import { deleteFromCloudinary } from "../lib/utils";
import { useApp } from "../context/AppContext";

export default function PersonaImageUploader({ images = [], onChange, uploading, onUpload }) {
  const { session } = useApp();
  const [dragging, setDragging] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const image = images[0] || null;

  const handleFiles = (files) => {
    const arr = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (arr.length) onUpload([arr[0]]);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteFromCloudinary(image, session?.access_token); } catch (e) { console.error(e); }
    onChange([]);
    setDeleting(false);
    setConfirmDelete(false);
  };

  return (
    <>
      {showPicker && (
        <CloudinaryPickerModal
          onClose={() => setShowPicker(false)}
          onSelect={url => { onChange([url]); setShowPicker(false); }}
        />
      )}
      {confirmDelete && (
        <ConfirmModal
          title="Eliminar imagen"
          message="¿Estás seguro de que quieres eliminar esta imagen? Esta acción no se puede deshacer."
          confirmLabel={deleting ? "Eliminando..." : "Sí, eliminar"}
          danger
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

      {image ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button type="button" color="secondary" size="sm" onClick={() => setShowPicker(true)} className="flex-1 flex items-center justify-center gap-1.5" isDisabled={uploading || deleting}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              Cambiar imagen
            </Button>
            <Button type="button" color="secondary" size="sm" onClick={() => setConfirmDelete(true)} className="flex items-center justify-center gap-1.5 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300" isDisabled={deleting || uploading}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              Eliminar
            </Button>
          </div>
          <div className="rounded-xl overflow-hidden border">
            <img src={image} alt="" className="w-full object-contain max-h-[480px] bg-muted" />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Button type="button" color="secondary" size="sm" onClick={() => setShowPicker(true)} className="w-full flex items-center justify-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
            Seleccionar de la librería
          </Button>
          <label
            className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors ${uploading ? "opacity-50 pointer-events-none" : dragging ? "border-green-400 bg-green-50/10" : "hover:border-green-400"}`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
          >
            <svg className={`w-6 h-6 transition-colors ${dragging ? "text-green-500" : "text-muted"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            <span className="text-sm font-medium text-tertiary">{uploading ? "Subiendo..." : dragging ? "Suelta aquí" : "Subir imagen"}</span>
            <span className="text-xs text-muted">PNG, JPG, WebP · arrastra o haz clic</span>
            <input type="file" accept="image/*" className="hidden" onChange={e => handleFiles(e.target.files)} />
          </label>
        </div>
      )}
    </>
  );
}
