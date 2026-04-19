// ============================================================
// server.js — Main Backend Server (UPDATED with Audio + Docs)
// ============================================================

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import { generateSHA256, generatePHash, comparePHashes, generateVideoPHash } from "./hash.js";
import { analyzeWithGemini, analyzeTextWithGemini } from "./gemini.js";
import { generateAudioFingerprint, compareAudioFingerprints } from "./audio.js";
import { analyzeDocument, compareDocumentFingerprints } from "./document.js";
import { saveAsset, checkSHAExists, getAllHashes, saveAlert } from "./firebase.js";
import { mintNFTFromBackend } from "./blockchain.js";
import { uploadToIPFS } from "./ipfs.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/jpeg","image/png","image/gif","image/webp",
      "video/mp4","video/mpeg","video/quicktime","video/webm",
      "audio/mpeg","audio/wav","audio/ogg","audio/mp4","audio/aac",
      "application/pdf","text/plain",
    ];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error(`File type ${file.mimetype} not supported`));
  },
});

function deleteTempFile(filePath) {
  try { if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) {}
}

function getFileCategory(mimeType) {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf" || mimeType === "text/plain") return "document";
  return "unknown";
}

app.get("/test", (req, res) => {
  res.json({
    message: "✅ ChainGuard Sports Server is running!",
    geminiKey: process.env.GEMINI_API_KEY ? "✅ Found" : "❌ Missing",
    firebase: process.env.FIREBASE_PROJECT_ID ? "✅ Found" : "❌ Missing",
    blockchain: process.env.DEPLOYER_PRIVATE_KEY ? "✅ Found" : "❌ Missing",
    supportedTypes: ["image", "video", "audio", "document"],
  });
});

app.post("/register", upload.single("file"), async (req, res) => {
  const filePath = req.file?.path;
  const tempDir = filePath ? filePath + "_temp" : null;
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const { originalname, mimetype, size } = req.file;
    const category = getFileCategory(mimetype);
    console.log(`\n📁 Registering: ${originalname} (${category})`);

    const sha256 = generateSHA256(filePath);
    const existingAsset = await checkSHAExists(sha256);
    if (existingAsset) {
      deleteTempFile(filePath);
      return res.status(409).json({ status: "ALREADY_REGISTERED", message: "⚠️ Already registered!", originalOwner: existingAsset.owner, registeredAt: existingAsset.timestamp });
    }

    let similarityHash = null;
    let documentData = null;

    if (category === "image") {
      similarityHash = await generatePHash(filePath);
    } else if (category === "video") {
      if (tempDir) fs.mkdirSync(tempDir, { recursive: true });
      similarityHash = await generateVideoPHash(filePath, tempDir);
    } else if (category === "audio") {
      similarityHash = await generateAudioFingerprint(filePath);
    } else if (category === "document") {
      documentData = await analyzeDocument(filePath, mimetype);
      if (documentData.success) similarityHash = documentData.fingerprint?.fingerprintStr;
    }

    const geminiResult = category === "document" && documentData?.textPreview
      ? await analyzeTextWithGemini(documentData.textPreview)
      : await analyzeWithGemini(filePath, mimetype, "register");

    // 3. Upload to IPFS (If Pinata keys exist)
    console.log("☁️ Uploading to IPFS...");
    const contentCID = await uploadToIPFS(filePath);

    const nftResult = await mintNFTFromBackend(sha256, contentCID, originalname, category, geminiResult.description || `${category} content`);

    const assetData = {
      fileName: originalname, category, mimeType: mimetype, fileSize: size,
      sha256, similarityHash: similarityHash || null, documentFingerprint: documentData?.fingerprint || null,
      geminiAnalysis: geminiResult, owner: req.body.authorName || req.body.walletAddress || "0x9c824C93fB406Ba66FCab00d2CC80Bb7a2A42965",
      nftTxHash: nftResult.success ? nftResult.txHash : null,
      timestamp: new Date().toISOString(), status: "registered",
    };

    const docId = await saveAsset(assetData);
    deleteTempFile(filePath);
    if (tempDir && fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });

    console.log(`✅ Registration complete!\n`);
    res.json({ status: "SUCCESS", message: "✅ Content registered!", docId, sha256, category, geminiAnalysis: geminiResult, nft: nftResult.success ? { txHash: nftResult.txHash } : { error: nftResult.error } });

  } catch (error) {
    deleteTempFile(filePath);
    console.error("❌ Register error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/detect", upload.single("file"), async (req, res) => {
  const filePath = req.file?.path;
  const tempDir = filePath ? filePath + "_temp" : null;
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const { originalname, mimetype } = req.file;
    const category = getFileCategory(mimetype);
    console.log(`\n🔍 Detecting: ${originalname} (${category})`);

    const sha256 = generateSHA256(filePath);
    const exactMatch = await checkSHAExists(sha256);
    if (exactMatch) {
      deleteTempFile(filePath);
      return res.json({ status: "EXACT_COPY", verdict: "🚨 Exact Copy Detected!", similarity: 100, category, originalOwner: exactMatch.owner, registeredAt: exactMatch.timestamp, method: "SHA256" });
    }

    let similarityResult = null;
    let documentData = null;
    const allAssets = await getAllHashes();

    if (category === "image") {
      const suspiciousPHash = await generatePHash(filePath);
      for (const asset of allAssets) {
        if (asset.category === "image" && asset.similarityHash) {
          const { similarity, verdict } = comparePHashes(suspiciousPHash, asset.similarityHash);
          if (!similarityResult || similarity > similarityResult.similarity) similarityResult = { ...asset, similarity, verdict };
        }
      }
    } else if (category === "video") {
      if (tempDir) fs.mkdirSync(tempDir, { recursive: true });
      const videoHash = await generateVideoPHash(filePath, tempDir);
      for (const asset of allAssets) {
        if (asset.category === "video" && asset.similarityHash) {
          const { similarity, verdict } = comparePHashes(videoHash, asset.similarityHash);
          if (!similarityResult || similarity > similarityResult.similarity) similarityResult = { ...asset, similarity, verdict };
        }
      }
    } else if (category === "audio") {
      const audioFP = await generateAudioFingerprint(filePath);
      for (const asset of allAssets) {
        if (asset.category === "audio" && asset.similarityHash) {
          const { similarity, verdict } = compareAudioFingerprints(audioFP, asset.similarityHash);
          if (!similarityResult || similarity > similarityResult.similarity) similarityResult = { ...asset, similarity, verdict };
        }
      }
    } else if (category === "document") {
      documentData = await analyzeDocument(filePath, mimetype);
      if (documentData.success) {
        for (const asset of allAssets) {
          if (asset.category === "document" && asset.documentFingerprint) {
            const { similarity, verdict } = compareDocumentFingerprints(documentData.fingerprint, asset.documentFingerprint);
            if (!similarityResult || similarity > similarityResult.similarity) similarityResult = { ...asset, similarity, verdict };
          }
        }
      }
    }

    const geminiResult = category === "document" && documentData?.textPreview
      ? await analyzeTextWithGemini(documentData.textPreview)
      : await analyzeWithGemini(filePath, mimetype, "detect");

    const topSimilarity = similarityResult?.similarity || 0;
    let finalStatus = "AUTHENTIC";
    let finalMessage = "✅ Content appears original";

    if (geminiResult.verdict === "MANIPULATED") { finalStatus = "MANIPULATED"; finalMessage = "🎭 AI manipulation detected!"; }
    else if (topSimilarity >= 99) { finalStatus = "EXACT_COPY"; finalMessage = "🚨 Exact copy!"; }
    else if (topSimilarity >= 90) { finalStatus = "PIRACY"; finalMessage = "🚨 Highly similar — likely pirated!"; }
    else if (topSimilarity >= 75) { finalStatus = "SUSPICIOUS"; finalMessage = "⚠️ Suspicious similarity found"; }

    if (finalStatus !== "AUTHENTIC") await saveAlert({ fileName: originalname, category, status: finalStatus, similarity: topSimilarity, timestamp: new Date().toISOString() });

    deleteTempFile(filePath);
    if (tempDir && fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });

    console.log(`✅ Detection: ${finalStatus}\n`);
    res.json({ status: finalStatus, verdict: finalMessage, category, similarity: topSimilarity, geminiAnalysis: geminiResult, similarContent: similarityResult && topSimilarity > 50 ? { owner: similarityResult.owner, fileName: similarityResult.fileName, registeredAt: similarityResult.timestamp, similarity: topSimilarity } : null });

  } catch (error) {
    deleteTempFile(filePath);
    console.error("❌ Detect error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 ChainGuard Sports Server`);
  console.log(`📡 Running on: http://localhost:${PORT}`);
  console.log(`🔑 Gemini: ${process.env.GEMINI_API_KEY ? "✅" : "❌"}`);
  console.log(`🔥 Firebase: ${process.env.FIREBASE_PROJECT_ID ? "✅" : "❌"}`);
  console.log(`⛓️  Blockchain: ${process.env.DEPLOYER_PRIVATE_KEY ? "✅" : "❌"}`);
  console.log(`📁 Supports: Image ✅ Video ✅ Audio ✅ Document ✅\n`);
});
