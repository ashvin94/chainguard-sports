import { useState } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import FileUpload from "../components/FileUpload";
import Spinner from "../components/Spinner";
import { buildAssetFingerprints, getAllNfts } from "../firebase/assets";

function GeminiBox({ analysis }) {
  if (!analysis) return null;
  return (
    <div className="ai-box rounded-xl p-4 space-y-4 text-sm mt-3 border border-cyan-900/30">
      <div className="flex items-center justify-between border-b border-cyan-900/30 pb-2">
        <p className="text-xs uppercase tracking-widest text-cyan-400 font-bold">
          🤖 Gemini AI Deep Analysis
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 uppercase">Verdict:</span>
          <span
            className={`rounded-full px-3 py-0.5 text-[10px] font-black tracking-wider ${
              analysis.verdict === "AUTHENTIC"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : analysis.verdict === "MANIPULATED"
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
            }`}
          >
            {analysis.verdict}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {analysis.sport && (
          <div className="space-y-0.5">
            <p className="text-[10px] text-slate-500 uppercase font-bold">Sport</p>
            <p className="text-slate-200 capitalize">{analysis.sport}</p>
          </div>
        )}
        {analysis.contentType && (
          <div className="space-y-0.5">
            <p className="text-[10px] text-slate-500 uppercase font-bold">Type</p>
            <p className="text-slate-200 capitalize">{analysis.contentType}</p>
          </div>
        )}
      </div>

      {analysis.description && (
        <div className="space-y-1">
          <p className="text-[10px] text-slate-500 uppercase font-bold">AI Observation</p>
          <p className="text-slate-300 leading-relaxed text-xs italic">
            "{analysis.description}"
          </p>
        </div>
      )}

      {analysis.manipulationClues && analysis.manipulationClues.length > 0 && (
        <div className="rounded-lg bg-rose-900/10 p-3 border border-rose-500/10">
          <p className="text-rose-300 text-[10px] mb-2 font-black uppercase tracking-widest flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
            Manipulation Indicators
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
            {analysis.manipulationClues.map((clue, i) => (
              <li key={i} className="text-rose-200/70 text-xs flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-rose-500/50" />
                {clue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.deepfakeIndicators && analysis.deepfakeIndicators.length > 0 && (
        <div className="rounded-lg bg-amber-900/10 p-3 border border-amber-500/10">
          <p className="text-amber-300 text-[10px] mb-2 font-black uppercase tracking-widest flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            Deepfake / AI Signals
          </p>
          <ul className="space-y-1">
            {analysis.deepfakeIndicators.map((signal, i) => (
              <li key={i} className="text-amber-200/70 text-xs flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500/50" />
                {signal}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-cyan-900/20">
        {analysis.confidence && (
          <p className="text-[10px] text-slate-500 uppercase">
            Confidence: <span className="text-cyan-400 font-bold ml-1">{analysis.confidence || analysis.authenticityScore + "%"}</span>
          </p>
        )}
        {analysis.recommendation && (
          <p className="text-[10px] text-amber-400 font-bold italic">
            👉 {analysis.recommendation}
          </p>
        )}
      </div>
    </div>
  );
}

function SimilarityMeter({ score }) {
  const color = score >= 90 ? "#ef4444" : score >= 75 ? "#f59e0b" : "#10b981";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">Similarity Score</span>
        <span className="font-bold" style={{ color }}>{score}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-800">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

function CheckPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [details, setDetails] = useState(null);
  const [backendResult, setBackendResult] = useState(null);
  const [useBackend, setUseBackend] = useState(false);

  const scoreFromPHash = (a, b) => {
    if (!a || !b) return 0;
    let d = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) if (a[i] !== b[i]) d++;
    return Math.max(0, 100 - Math.floor((d / len) * 100));
  };

  // Quick frontend-only check (uses Firebase fingerprints)
  const runFrontendCheck = async () => {
    if (!file) { toast.error("Please upload a sports file to check"); return; }
    try {
      setLoading(true);
      setBackendResult(null);
      const records = await getAllNfts();
      const incoming = await buildAssetFingerprints(file);

      if (records.length === 0) {
        setResult({ status: "Original", similarity: 0 });
        setDetails({ matchedFile: "No records in database", method: "SHA-256", confidence: "Low", recommendation: "No registered assets to compare against. Register your content first." });
        return;
      }

      const exact = records.find((n) => (n.sha256 || n.hash) === incoming.hash);
      if (exact) {
        setResult({ status: "Duplicate", similarity: 100 });
        setDetails({ matchedFile: exact.fileName, matchedOwner: exact.owner || exact.ownerEmail, matchedHash: (exact.sha256 || exact.hash)?.slice(0, 22), method: "Exact SHA-256", confidence: "High", recommendation: "⛔ Exact duplicate detected. This file is already registered." });
        return;
      }

      let best = null;
      for (const nft of records) {
        const ph = nft.similarityHash || nft.pHash;
        const sim = scoreFromPHash(incoming.pHash, ph);
        if (!best || sim > best.similarity) best = { nft, similarity: sim };
      }

      const status = best?.similarity > 75 ? "Duplicate" : "Original";
      setResult({ status, similarity: best?.similarity ?? 0 });
      setDetails({
        matchedFile: best?.nft?.fileName || "N/A",
        matchedOwner: best?.nft?.owner || best?.nft?.ownerEmail || "N/A",
        matchedHash: (best?.nft?.sha256 || best?.nft?.hash)?.slice(0, 22) || "N/A",
        method: incoming.pHash ? "Image pHash similarity" : "SHA-256 only",
        confidence: (best?.similarity ?? 0) > 90 ? "High" : (best?.similarity ?? 0) > 70 ? "Medium" : "Low",
        recommendation: status === "Duplicate"
          ? "⚠️ Potential conflict detected. Verify ownership and minting history."
          : "✅ No high-risk match found. You may proceed to register this asset.",
      });
    } catch (err) {
      toast.error(err.message || "Check failed");
    } finally {
      setLoading(false);
    }
  };

  // Deep AI check via backend (uses Gemini + full fingerprinting)
  const runBackendCheck = async () => {
    if (!file) { toast.error("Please upload a sports file to check"); return; }
    try {
      setLoading(true);
      setResult(null);
      toast.loading("Running Gemini AI deep scan...", { id: "scan" });
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("http://localhost:5000/detect", { method: "POST", body: formData });
      const data = await res.json();
      toast.dismiss("scan");
      setBackendResult(data);
      setUseBackend(true);
    } catch (err) {
      toast.error(err.message || "AI check failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h2 className="brand-font text-3xl font-black text-white">
          🔍 Detect <span className="text-cyan-400">Sports Piracy</span>
        </h2>
        <p className="mt-2 text-slate-400">
          Upload any sports content to check if it is original or a manipulated/pirated copy. Choose quick check or full AI scan.
        </p>
      </div>

      <FileUpload file={file} onFileChange={(f) => { setFile(f); setResult(null); setBackendResult(null); }} />

      <div className="flex gap-3 flex-wrap">
        <button
          type="button"
          onClick={runFrontendCheck}
          className="flex-1 rounded-xl border border-blue-600/50 bg-blue-900/30 py-3 text-sm font-bold text-blue-200 hover:bg-blue-800/40 transition-all"
        >
          ⚡ Quick Fingerprint Check
        </button>
        <button
          type="button"
          onClick={runBackendCheck}
          className="flex-1 wallet-btn rounded-xl py-3 text-sm font-bold text-white"
        >
          🤖 Full Gemini AI Scan
        </button>
      </div>

      {loading && <Spinner label="Analyzing sports content..." />}

      {/* Frontend result */}
      {result && !useBackend && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <p className="text-lg font-bold text-white">Analysis Result</p>
            <span className={`rounded-full px-4 py-1 text-sm font-bold ${result.status === "Original" ? "badge-original" : "badge-duplicate"}`}>
              {result.status === "Original" ? "✅ Original" : "🚨 Duplicate"}
            </span>
          </div>
          <SimilarityMeter score={result.similarity ?? 0} />
          {details && (
            <div className="space-y-2 text-sm">
              <p className="text-slate-300">📄 Matched: <span className="text-white">{details.matchedFile}</span></p>
              <p className="text-slate-300">👤 Owner: <span className="text-white font-mono">{details.matchedOwner}</span></p>
              <p className="text-slate-300">🔗 Hash: <span className="font-mono text-slate-400">{details.matchedHash}</span></p>
              <p className="text-slate-300">⚙️ Method: <span className="text-cyan-300">{details.method}</span></p>
              <p className="text-slate-300">🎯 Confidence: <span className="text-white">{details.confidence}</span></p>
              <div className={`rounded-lg p-3 text-sm ${result.status === "Original" ? "badge-original" : "badge-duplicate"}`}>
                {details.recommendation}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Backend AI result */}
      {backendResult && useBackend && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-5 space-y-4"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-lg font-bold text-white shrink-0">🤖 AI Detection Result</p>
            <span className={`rounded-full px-4 py-1.5 text-[10px] sm:text-xs font-black tracking-widest uppercase shadow-lg text-center ${
              backendResult.status === "AUTHENTIC" ? "bg-emerald-600 text-white shadow-emerald-900/40"
              : backendResult.status === "MANIPULATED" ? "bg-rose-600 text-white shadow-rose-900/40 animate-pulse"
              : backendResult.status === "PIRACY" || backendResult.status === "EXACT_COPY" ? "bg-amber-600 text-white shadow-amber-900/40"
              : "bg-slate-600 text-white shadow-slate-900/40"
            }`}>
              {backendResult.status === "MANIPULATED" ? "🚨 EDITED / MANIPULATED" 
               : backendResult.status === "AUTHENTIC" ? "✅ AUTHENTIC ORIGINAL"
               : backendResult.status === "PIRACY" ? "🚩 PIRATED CONTENT"
               : backendResult.status === "EXACT_COPY" ? "🚫 DUPLICATE"
               : backendResult.verdict}
            </span>
          </div>

          <SimilarityMeter score={backendResult.similarity ?? 0} />

          {backendResult.similarContent && (
            <div className="text-sm space-y-1">
              <p className="text-slate-300">📄 Original Owner: <span className="text-white font-mono">{backendResult.similarContent.owner}</span></p>
              <p className="text-slate-300">📁 Original File: <span className="text-white">{backendResult.similarContent.fileName}</span></p>
              <p className="text-slate-300">📅 Registered: <span className="text-slate-400">{new Date(backendResult.similarContent.registeredAt).toLocaleDateString()}</span></p>
            </div>
          )}

          <GeminiBox analysis={backendResult.geminiAnalysis} />
        </motion.div>
      )}
    </section>
  );
}

export default CheckPage;


