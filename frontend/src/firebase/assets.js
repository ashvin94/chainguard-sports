import { addDoc, collection, getDocs, orderBy, query, where } from "firebase/firestore";
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

export async function uploadAndCreateNftRecord(file, user) {
  const { hash, pHash } = await buildAssetFingerprints(file);

  const docRef = await addDoc(collection(db, "nfts"), {
    ownerUid: user.uid,
    ownerEmail: user.email || "unknown",
    title: file.name,
    fileName: file.name,
    fileType: file.type || "unknown",
    fileSize: file.size,
    hash,
    pHash,
    tokenId: `NFT-${Math.floor(Date.now() / 1000)}`,
    imageUrl: null,
    fileUrl: null,
    status: "minted",
    createdAt: Date.now(),
  });

  return { id: docRef.id, hash, pHash };
}

export async function getMyNfts(ownerUid) {
  const q = query(
    collection(db, "nfts"),
    where("ownerUid", "==", ownerUid),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function getAllNfts() {
  const q = query(collection(db, "nfts"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

