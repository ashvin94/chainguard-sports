import { collection, getDocs } from "firebase/firestore";
import { db } from "./config";

export async function debugListAllAssets() {
  const snap = await getDocs(collection(db, "assets"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
