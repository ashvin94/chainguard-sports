import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

let db;
let memory = {
  assets: [],
  alerts: [],
};
let useMemory = false;

function initFirebase() {
  if (admin.apps.length > 0) {
    db = admin.firestore();
    return;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !privateKey || !clientEmail) {
    useMemory = true;
    return;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        privateKey,
        clientEmail,
      }),
    });
    db = admin.firestore();
  } catch (error) {
    useMemory = true;
  }
}

initFirebase();

export async function saveAsset(assetData) {
  if (useMemory) {
    const id = String(memory.assets.length + 1);
    memory.assets.push({ id, ...assetData });
    return id;
  }
  const docRef = await db.collection("assets").add(assetData);
  return docRef.id;
}

export async function checkSHAExists(sha256) {
  if (useMemory) {
    return memory.assets.find((a) => a.sha256 === sha256) || null;
  }
  const snapshot = await db
    .collection("assets")
    .where("sha256", "==", sha256)
    .limit(1)
    .get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}

export async function getAllHashes() {
  if (useMemory) {
    return memory.assets.map((a) => ({ ...a }));
  }
  const snapshot = await db
    .collection("assets")
    .select(
      "sha256",
      "pHash",
      "similarityHash",
      "audioFingerprint",
      "docFingerprint",
      "documentFingerprint",
      "category",
      "fileType",
      "owner",
      "fileName",
      "timestamp",
      "nftId",
      "nftTxHash"
    )
    .get();
  const hashes = [];
  snapshot.forEach((doc) => hashes.push({ id: doc.id, ...doc.data() }));
  return hashes;
}

export async function updateAsset(docId, updateData) {
  if (useMemory) {
    const index = memory.assets.findIndex((a) => a.id === docId);
    if (index === -1) return false;
    memory.assets[index] = { ...memory.assets[index], ...updateData };
    return true;
  }
  await db.collection("assets").doc(docId).update(updateData);
  return true;
}

export async function saveAlert(alertData) {
  if (useMemory) {
    const id = String(memory.alerts.length + 1);
    memory.alerts.push({ id, ...alertData });
    return id;
  }
  const docRef = await db.collection("alerts").add(alertData);
  return docRef.id;
}
