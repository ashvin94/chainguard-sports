import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

let db;

function initFirebase() {
  if (admin.apps.length > 0) {
    db = admin.firestore();
    return;
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });

  db = admin.firestore();
}

initFirebase();

export async function saveAsset(assetData) {
  const docRef = await db.collection("assets").add(assetData);
  return docRef.id;
}

export async function checkSHAExists(sha256) {
  const snapshot = await db.collection("assets").where("sha256", "==", sha256).limit(1).get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}

export async function getAllHashes() {
  const snapshot = await db
    .collection("assets")
    .select(
      "sha256", "pHash", "similarityHash", "audioFingerprint",
      "docFingerprint", "documentFingerprint", "category", "fileType",
      "owner", "fileName", "timestamp", "nftId", "nftTxHash"
    )
    .get();
  const hashes = [];
  snapshot.forEach((doc) => hashes.push({ id: doc.id, ...doc.data() }));
  return hashes;
}

export async function updateAsset(docId, updateData) {
  await db.collection("assets").doc(docId).update(updateData);
  return true;
}

export async function saveAlert(alertData) {
  const docRef = await db.collection("alerts").add(alertData);
  return docRef.id;
}
