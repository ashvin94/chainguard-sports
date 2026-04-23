import { useState } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import FileUpload from "../components/FileUpload";
import Spinner from "../components/Spinner";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";


function GeminiBox({ analysis }) {
  if (!analysis) return null;
  return (
    <div className="ai-box rounded-xl p-4 space-y-4 text-sm mt-3 border border-cyan-900/30">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-cyan-900/30 pb-2 gap-2">
        <p className="text-xs uppercase tracking-widest text-cyan-400 font-bold">
          🤖 Gemini AI Analysis
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
          <ul className="grid grid-cols-1 gap-y-1">
            {analysis.manipulationClues.map((clue, i) => (
              <li key={i} className="text-rose-200/70 text-xs flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-rose-500/50" />
                {clue}
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
      </div>
    </div>
  );
}

function UploadPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploaded, setUploaded] = useState(null);
  const [step, setStep] = useState("");
  const [timeTaken, setTimeTaken] = useState(null); // Time in seconds
  const { user } = useAuth();
  const { walletAddress, connectWallet, isWrongNetwork, switchNetwork } = useWallet();

  const handleRegister = async () => {
    if (!file) { toast.error("Please select a sports media file"); return; }
    if (!walletAddress) {
      toast.error("Please connect your MetaMask wallet first!");
      await connectWallet();
      return;
    }
    if (isWrongNetwork) {
      toast.error("Wrong network! Switching to Polygon Amoy...");
      await switchNetwork();
      return;
    }

    try {
      setLoading(true);
      setTimeTaken(null);
      const startTime = Date.now();
      setStep("🤖 Sending to Gemini AI for sports content analysis...");
      toast.loading("Registering on SportShield AI...", { id: "reg" });

      // 2. Call backend — pass wallet address as owner
      const formData = new FormData();
      formData.append("file", file);
      formData.append("authorName", user?.email || "Sports Creator");
      formData.append("walletAddress", walletAddress); // Real owner!

      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${API_URL}/register`, { method: "POST", body: formData });
      const result = await response.json();
      toast.dismiss("reg");

      if (result.status === "SUCCESS") {
        const endTime = Date.now();
        setTimeTaken(((endTime - startTime) / 1000).toFixed(1));
        setStep("✅ Registration complete!");
        setUploaded(result);
        toast.success("Sports media shielded successfully!");
        setFile(null);
      } else if (result.status === "ALREADY_REGISTERED") {
        toast.error(`Already registered by: ${result.originalOwner}`);
      } else {
        throw new Error(result.error || "Registration failed");
      }
    } catch (err) {
      toast.error(err.message || "Upload failed");
    } finally {
      setLoading(false);
      setStep("");
    }
  };

  if (loading) return (
    <div className="space-y-4">
      <Spinner label={step || "Processing..."} />
      {step && (
        <div className="glass-card rounded-xl p-4 text-center text-sm text-cyan-300 animate-pulse">
          {step}
        </div>
      )}
    </div>
  );

  return (
    <section className="space-y-6">
      <div>
        <h2 className="brand-font text-2xl sm:text-3xl font-black text-white">
          🛡️ Shield Your <span className="text-cyan-400">Sports Media</span>
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Upload sports content to register ownership. Gemini AI analyzes authenticity, Pinata IPFS stores the proof, and Polygon blockchain mints your NFT.
        </p>
      </div>

      {/* Wallet connection status */}
      {!walletAddress && (
        <div className="badge-suspicious rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-1 min-w-0">
            <p className="text-sm font-bold text-rose-300">⚠️ Wallet Not Connected</p>
            <p className="text-xs text-rose-200/70">Connect your MetaMask wallet to claim ownership. **Note:** Registration is gas-less for creators; SportShield AI covers all blockchain fees.</p>
          </div>
          <button onClick={connectWallet} className="wallet-btn rounded-lg px-4 py-2 text-sm font-bold text-white whitespace-nowrap shrink-0 w-full sm:w-auto text-center">
            🦊 Connect Wallet
          </button>
        </div>
      )}

      {walletAddress && (
        <div className="badge-original rounded-xl p-3 flex items-center gap-2 text-sm overflow-hidden">
          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 animate-pulse" />
          <span className="truncate">Owner wallet: <span className="font-mono text-white">{walletAddress}</span></span>
        </div>
      )}

      <FileUpload file={file} onFileChange={setFile} />

      <button
        type="button"
        onClick={handleRegister}
        className="wallet-btn w-full rounded-xl py-3 text-base font-bold text-white transition-all"
      >
        🛡️ Analyze with AI &amp; Register on Chain
      </button>

      {/* Success Result with Gemini output */}
      {uploaded && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card space-y-4 rounded-2xl p-5"
        >
          <p className="text-lg font-bold text-emerald-400">✅ Sports Media Registered &amp; Protected</p>
          {timeTaken && (
            <p className="text-xs text-slate-400 italic">
              ✨ Total Shielding Time: <span className="text-cyan-400 font-bold">{timeTaken} seconds</span>
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="glass-card rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">SHA-256 Hash</p>
              <p className="font-mono text-[10px] text-slate-200 break-all leading-tight">{uploaded.sha256?.slice(0, 32)}...</p>
            </div>
            <div className="glass-card rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Category</p>
              <p className="font-semibold text-cyan-300 capitalize">{uploaded.category}</p>
            </div>
          </div>

          {/* Gemini AI Output */}
          <GeminiBox analysis={uploaded.geminiAnalysis} />

          {/* NFT Info */}
          {uploaded.nft?.txHash ? (
            <div className="ai-box rounded-xl p-3 text-sm space-y-2">
              <div>
                <p className="text-xs text-cyan-400 mb-1 uppercase tracking-wider">⛓️ NFT Minted on Polygon Amoy</p>
                <p className="text-xs text-slate-400 break-all">Owner: <span className="text-white font-mono">{walletAddress}</span></p>
                <a
                  href={`https://amoy.polygonscan.com/tx/${uploaded.nft.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block break-all font-mono text-xs text-amber-300 hover:text-amber-200 transition-colors"
                >
                  Tx: {uploaded.nft.txHash}
                </a>
              </div>
              
              <div className="pt-2 border-t border-cyan-500/20">
                <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider">☁️ IPFS Storage Proof</p>
                <p className="text-[10px] text-slate-500 font-mono truncate">CID: {uploaded.ipfsUri}</p>
                <a
                  href={uploaded.ipfsUri?.replace("ipfs://", "https://ipfs.io/ipfs/")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-xs text-cyan-400 hover:text-cyan-300 underline"
                >
                  View Original File on IPFS ↗
                </a>
              </div>
            </div>
          ) : uploaded.nft?.error ? (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm">
              <p className="text-xs font-bold text-rose-400 uppercase tracking-wider">⚠️ Blockchain Minting Delayed</p>
              <p className="text-xs text-rose-200/70">Database registration succeeded, but the NFT minting failed: {uploaded.nft.error}</p>
            </div>
          ) : null}
        </motion.div>
      )}
    </section>
  );
}

export default UploadPage;


