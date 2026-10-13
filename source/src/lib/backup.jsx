// ══════════════════════════════════════════════════════════
// SAUVEGARDE COMPLÈTE EN UN SEUL FICHIER (.zip)
// ══════════════════════════════════════════════════════════
// Un seul fichier contient tout : collection, réglages, Parade ET toutes les photos
// (en vraies images .jpg, donc plus légères qu'en texte). La restauration accepte aussi
// les anciens fichiers de l'app (.json de sauvegarde, de photos par faction, de Parade).
import { dehydrate, rehydrate, photoData } from './photoStore.jsx';

// ── CRC32 (contrôle d'intégrité exigé par le format zip) ──
const CRC_TABLE = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (u8) => { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC_TABLE[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };

const utf8 = (s) => new TextEncoder().encode(s);
function dataUrlToBytes(d) {
  const b64 = d.slice(d.indexOf(",") + 1); const bin = atob(b64);
  const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8;
}
function bytesToDataUrl(u8, mime) {
  let s = ""; const CH = 0x8000;
  for (let i = 0; i < u8.length; i += CH) s += String.fromCharCode.apply(null, u8.subarray(i, i + CH));
  return `data:${mime};base64,${btoa(s)}`;
}
const extOf = (d) => d.startsWith("data:image/png") ? "png" : d.startsWith("data:image/webp") ? "webp" : "jpg";
const mimeOf = (name) => name.endsWith(".png") ? "image/png" : name.endsWith(".webp") ? "image/webp" : "image/jpeg";

// Zip « stocké » (sans compression : les photos sont déjà compressées)
function makeZip(files /* [{ name, data: Uint8Array }] */) {
  const parts = [], central = []; let offset = 0;
  for (const f of files) {
    const name = utf8(f.name), crc = crc32(f.data), size = f.data.length;
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); // UTF-8
    h.setUint16(8, 0, true); h.setUint32(14, crc, true); h.setUint32(18, size, true); h.setUint32(22, size, true);
    h.setUint16(26, name.length, true);
    parts.push(h.buffer, name, f.data);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
    c.setUint32(16, crc, true); c.setUint32(20, size, true); c.setUint32(24, size, true); c.setUint16(28, name.length, true);
    c.setUint32(42, offset, true);
    central.push(c.buffer, name);
    offset += 30 + name.length + size;
  }
  const cdSize = central.reduce((s, p) => s + (p.byteLength ?? p.length), 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
  end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, end.buffer], { type: "application/zip" });
}

function readZip(buf) {
  const dv = new DataView(buf), u8 = new Uint8Array(buf);
  let e = buf.byteLength - 22; while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--;
  if (e < 0) throw new Error("zip");
  const count = dv.getUint16(e + 10, true); let p = dv.getUint32(e + 16, true);
  const out = {}; const dec = new TextDecoder();
  for (let i = 0; i < count; i++) {
    const method = dv.getUint16(p + 10, true), size = dv.getUint32(p + 20, true);
    const nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), lo = dv.getUint32(p + 42, true);
    const name = dec.decode(u8.subarray(p + 46, p + 46 + nl));
    if (method !== 0) throw new Error("compression");
    const start = lo + 30 + dv.getUint16(lo + 26, true) + dv.getUint16(lo + 28, true);
    out[name] = u8.subarray(start, start + size);
    p += 46 + nl + xl + cl;
  }
  return out;
}

// Construit le fichier de sauvegarde. Renvoie { blob, name, photos }
export function buildBackup(state) {
  const { state: light, ids } = dehydrate(state);
  const files = [];
  const meta = { format: "reliquaire-backup", version: 1, createdAt: new Date().toISOString(), photos: ids.size };
  files.push({ name: "reliquaire.json", data: utf8(JSON.stringify({ ...meta, data: light })) });
  ids.forEach(id => { const d = photoData(id); if (d) files.push({ name: `photos/${id}.${extOf(d)}`, data: dataUrlToBytes(d) }); });
  const day = new Date(); const pad = (n) => String(n).padStart(2, "0");
  return { blob: makeZip(files), name: `reliquaire-${day.getFullYear()}-${pad(day.getMonth()+1)}-${pad(day.getDate())}.zip`, photos: ids.size };
}

// Lit n'importe quel fichier de sauvegarde de l'app (nouveau ou ancien format).
// Renvoie { kind:"full", state } | { kind:"photos", faction, photos:[{id, photo}] } | { kind:"parade", items }
export async function readBackup(file) {
  const buf = await file.arrayBuffer();
  const head = new Uint8Array(buf, 0, Math.min(4, buf.byteLength));
  if (head[0] === 0x50 && head[1] === 0x4B) { // « PK » : un zip
    const entries = readZip(buf);
    const main = entries["reliquaire.json"];
    if (!main) throw new Error("contenu");
    const parsed = JSON.parse(new TextDecoder().decode(main));
    const photos = new Map();
    for (const [name, bytes] of Object.entries(entries)) {
      const m = name.match(/^photos\/([^./]+)\.(jpg|png|webp)$/);
      if (m) photos.set(m[1], bytesToDataUrl(bytes, mimeOf(name)));
    }
    const { state, missing } = rehydrate(parsed.data, photos);
    return { kind: "full", state, missing: missing.length };
  }
  const parsed = JSON.parse(new TextDecoder().decode(buf));
  if (parsed.type === "photos" && Array.isArray(parsed.photos)) return { kind: "photos", faction: parsed.faction, photos: parsed.photos };
  if (parsed.type === "parade" && Array.isArray(parsed.photos)) return { kind: "parade", items: parsed.photos };
  if (parsed.inventory) {
    // Une référence de photo sans l'image correspondante devient « pas de photo »
    const { state, missing } = rehydrate(parsed, new Map());
    return { kind: "full", state, missing: missing.length };
  }
  throw new Error("inconnu");
}
