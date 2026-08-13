// ── UTILS ──
import { supabase } from "../supabase";
import { PRODUCTS } from "./constants";

const ES_MONTHS = { ene:0,feb:1,mar:2,abr:3,may:4,jun:5,jul:6,ago:7,sep:8,set:8,oct:9,nov:10,dic:11 };

export const toSlug = (title) =>
  title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const parseDate = (str) => {
  if (!str) return new Date(0);
  let d = new Date(str);
  if (isNaN(d)) {
    const m = str.toLowerCase().replace(/\./g, "").match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/);
    if (m && ES_MONTHS[m[2]] !== undefined) d = new Date(+m[3], ES_MONTHS[m[2]], +m[1]);
  }
  return isNaN(d) ? new Date(0) : d;
};

export const formatDate = (str) => {
  if (!str) return "";
  const d = parseDate(str);
  if (+d === 0) return str;
  return d.toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" }).replace(/\./g, "");
};

export const stripHtml = (html) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

export const getBadgeColor = (c) => ({ amber: "warning", violet: "indigo", green: "success" }[c] || c);

export const getPresentationInfo = (url = "", token = "") => {
  if (!url) return null;
  const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
  if (url.includes("figma.com")) {
    const m = url.match(/figma\.com\/(?:file|proto|design|slides|deck)\/([^/?#]+)/);
    const embedUrl = `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(url)}&hide-ui=1`;
    return { type: "figma", key: m?.[1] || null, embedUrl };
  }
  if (url.includes("google.com")) {
    const id = getDriveId(url);
    const isSlides = url.includes("/presentation/");
    const isDocs = url.includes("/document/");
    const thumbUrl = id ? `/api/drive-thumb/${id}${tokenParam}` : null;
    const embedUrl = isSlides && id
      ? `https://docs.google.com/presentation/d/${id}/embed?start=false&loop=false&rm=minimal`
      : isDocs && id
        ? `https://docs.google.com/document/d/${id}/preview`
        : null;
    return { type: isSlides ? "slides" : isDocs ? "docs" : "drive", id, thumbUrl, embedUrl };
  }
  return { type: "other" };
};

export function getDriveId(url = "") {
  const m = url.match(/\/d\/([^/?#]+)/);
  if (m) return m[1];
  const m2 = url.match(/[?&]id=([^&#]+)/);
  return m2 ? m2[1] : null;
}

export function getProductCoverUrl(fileName) {
  const { data } = supabase.storage.from('product-covers').getPublicUrl(fileName);
  return data?.publicUrl || null;
}

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function loadProductCovers(token) {
  const res = await fetch('/api/config?key=product_covers', { headers: authHeaders(token) });
  if (!res.ok) return {};
  const { value } = await res.json();
  return value || {};
}

export async function loadAllProductCoverUrls(token) {
  const map = await loadProductCovers(token);
  return Object.fromEntries(
    PRODUCTS.map(p => {
      const val = map[toSlug(p)];
      if (!val) return [p, null];
      const url = val.startsWith('http') ? val : getProductCoverUrl(val);
      return [p, url];
    })
  );
}

export async function saveProductCoverRef(product, url, token) {
  const current = await loadProductCovers(token);
  const updated = { ...current, [toSlug(product)]: url };
  const res = await fetch('/api/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ key: 'product_covers', value: updated }),
  });
  if (!res.ok) console.error("[saveProductCoverRef] Error:", await res.text());
  return updated;
}

export async function uploadProductCover(product, file, token) {
  const fileName = toSlug(product);
  const { error } = await supabase.storage.from('product-covers').upload(fileName, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  await saveProductCoverRef(product, fileName, token);
  return getProductCoverUrl(fileName);
}

export function resizeToSquareJpg(file, size = 500) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext("2d");
      const min = Math.min(img.width, img.height);
      const sx = (img.width - min) / 2, sy = (img.height - min) / 2;
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
      URL.revokeObjectURL(url);
      canvas.toBlob(resolve, "image/jpeg", 0.9);
    };
    img.src = url;
  });
}

export async function uploadPersonaPhoto(file) {
  const blob = await resizeToSquareJpg(file);
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
  const { error } = await supabase.storage.from("profile-pic-users").upload(fileName, blob, { contentType: "image/jpeg" });
  if (error) throw error;
  const { data } = supabase.storage.from("profile-pic-users").getPublicUrl(fileName);
  return data?.publicUrl;
}

export function cloudinaryPublicId(url) {
  const m = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/);
  return m ? m[1] : null;
}

export async function deleteFromCloudinary(url, token) {
  const public_id = cloudinaryPublicId(url);
  if (!public_id) throw new Error("No se pudo extraer el public_id");
  const res = await fetch("/api/cloudinary/delete", { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders(token) }, body: JSON.stringify({ public_id }) });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Error ${res.status} al eliminar de Cloudinary`);
  }
}

export async function uploadToCloudinary(file) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", "Subida img");
  const res = await fetch("https://api.cloudinary.com/v1_1/dswxl3d4l/image/upload", { method: "POST", body: fd });
  if (!res.ok) throw new Error("Error al subir imagen a Cloudinary");
  const data = await res.json();
  return data.secure_url;
}

export async function downloadImage(url, filename = "image.jpg") {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(url, "_blank");
  }
}


const ALLOWED = new Set(["B","STRONG","I","EM","U","UL","OL","LI","H1","H2","H3","H4","H5","H6","P","BR","BLOCKQUOTE"]);
const BLOCK_TAGS = new Set(["P","H1","H2","H3","H4","H5","H6","LI","BLOCKQUOTE"]);

const sanitizeNode = (node) => {
  if (node.nodeType !== 1) return;
  const tag = node.tagName;
  const align = node.style?.textAlign;
  Array.from(node.attributes).forEach(a => node.removeAttribute(a.name));
  if (align && BLOCK_TAGS.has(tag)) node.style.textAlign = align;
  if (!ALLOWED.has(node.tagName)) {
    const isBlock = ["DIV","SECTION","ARTICLE","HEADER","FOOTER","TABLE","TR","TD","TH","TBODY"].includes(node.tagName);
    const frag = document.createDocumentFragment();
    Array.from(node.childNodes).forEach(c => frag.appendChild(c.cloneNode(true)));
    if (isBlock) {
      const p = document.createElement("p");
      p.appendChild(frag);
      node.replaceWith(p);
      Array.from(p.childNodes).forEach(sanitizeNode);
      return;
    }
    node.replaceWith(frag);
    return;
  }
  Array.from(node.childNodes).forEach(sanitizeNode);
};

export const sanitizeHtml = (html) => {
  const div = document.createElement("div");
  div.innerHTML = html;
  Array.from(div.childNodes).forEach(sanitizeNode);
  return div.innerHTML;
};
