import { collection, getDocs, query } from "firebase/firestore";
import { db } from "./config";

async function computeFileHash(file) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function toHexFromBits(bits) {
  let hex = "";
  for (let i = 0; i < bits.length; i += 4) {
    const nibble = bits.slice(i, i + 4).padEnd(4, "0");
    hex += parseInt(nibble, 2).toString(16);
  }
  return hex;
}

async function computeImagePHash(file) {
  if (!file.type.startsWith("image/")) return null;

  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = 8;
  canvas.height = 8;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, 8, 8);

  const imageData = ctx.getImageData(0, 0, 8, 8).data;
  const grayscale = [];
  for (let i = 0; i < imageData.length; i += 4) {
    const r = imageData[i];
    const g = imageData[i + 1];
    const b = imageData[i + 2];
    grayscale.push(Math.round((r + g + b) / 3));
  }

  const avg = grayscale.reduce((sum, value) => sum + value, 0) / grayscale.length;
  const bits = grayscale.map((value) => (value >= avg ? "1" : "0")).join("");
  return toHexFromBits(bits);
}

export async function buildAssetFingerprints(file) {
  const hash = await computeFileHash(file);
  const pHash = await computeImagePHash(file);
  return { hash, pHash };
}

// Sort helper
function sortByDate(docs) {
  if (!docs) return [];
  return docs.sort((a, b) => {
    let ta = 0;
    let tb = 0;
    
    if (a.timestamp) ta = new Date(a.timestamp).getTime();
    else if (a.createdAt) ta = typeof a.createdAt === 'number' ? a.createdAt : new Date(a.createdAt).getTime();
    
    if (b.timestamp) tb = new Date(b.timestamp).getTime();
    else if (b.createdAt) tb = typeof b.createdAt === 'number' ? b.createdAt : new Date(b.createdAt).getTime();
    
    // Fallback if Date is invalid (NaN)
    if (isNaN(ta)) ta = 0;
    if (isNaN(tb)) tb = 0;
    
    return tb - ta;
  });
}

// Global debug helper
if (typeof window !== 'undefined') {
  window.debugAssets = async () => {
    try {
      const a = await getDocs(collection(db, "assets"));
      const n = await getDocs(collection(db, "nfts"));
      console.log("Raw 'assets':", a.docs.map(d => d.data()));
      console.log("Raw 'nfts':", n.docs.map(d => d.data()));
      return { assets: a.size, nfts: n.size };
    } catch (e) { console.error(e); }
  };
}

// Fetch all assets and filter client-side — avoids Firestore composite index requirement
export async function getMyNfts(ownerIdentifier) {
  try {
    const id = ownerIdentifier?.toLowerCase();
    console.log("Fetching NFTs for:", id);
    
    // Check both collections for backward compatibility
    const [assetsSnap, nftsSnap] = await Promise.all([
      getDocs(query(collection(db, "assets"))),
      getDocs(query(collection(db, "nfts")))
    ]);

    const all = [
      ...assetsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      ...nftsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    ];
    
    console.log("Total assets found across collections:", all.length);

    const mine = all.filter((a) => {
      const owner = (a.owner || a.ownerEmail || a.ownerUid)?.toLowerCase();
      return owner === id;
    });

    console.log("Found matching assets for", id, ":", mine.length);
    return sortByDate(mine);
  } catch (err) {
    console.error("getMyNfts error:", err);
    return [];
  }
}

export async function getAllNfts() {
  try {
    const [assetsSnap, nftsSnap] = await Promise.all([
      getDocs(query(collection(db, "assets"))),
      getDocs(query(collection(db, "nfts")))
    ]);

    const all = [
      ...assetsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      ...nftsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    ];
    
    console.log("getAllNfts total found:", all.length);
    return sortByDate(all);
  } catch (err) {
    console.error("getAllNfts error:", err);
    return [];
  }
}
