import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import Spinner from "../components/Spinner";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";
import { getMyNfts, getAllNfts } from "../firebase/assets";

const categoryEmoji = { image: "🖼️", video: "🎬", audio: "🎵", document: "📄" };

function NFTCard({ nft, index }) {
  const ipfsGateway = nft.ipfsUri
    ? nft.ipfsUri.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/")
    : null;

  const isImage = nft.category === "image" || nft.mimeType?.startsWith("image/");

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="glass-card nft-card overflow-hidden rounded-2xl"
    >
      {/* Media Preview */}
      <div className="relative h-44 w-full bg-slate-900/80 overflow-hidden">
        {isImage && ipfsGateway ? (
          <img
            src={ipfsGateway}
            alt={nft.fileName || "Sports Media"}
            className="h-full w-full object-cover"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl">
            {categoryEmoji[nft.category] || "🏆"}
          </div>
        )}
        {/* Category badge */}
        <span className="absolute top-2 right-2 rounded-full bg-blue-900/80 px-2.5 py-0.5 text-xs font-semibold text-cyan-300 border border-cyan-500/30 capitalize backdrop-blur-sm">
          {categoryEmoji[nft.category]} {nft.category}
        </span>
        {/* Status badge */}
        <span className="absolute top-2 left-2 rounded-full bg-emerald-900/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-500/30 backdrop-blur-sm">
          ✅ Protected
        </span>
      </div>

      <div className="p-4 space-y-2.5">
        <h3 className="text-sm font-semibold text-white truncate" title={nft.fileName}>
          {nft.fileName || nft.title || "Untitled Asset"}
        </h3>

        {/* Owner */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400">Owner:</span>
          <span className="font-mono text-cyan-300 truncate" title={nft.owner}>
            {nft.owner?.length > 20
              ? `${nft.owner.slice(0, 8)}...${nft.owner.slice(-6)}`
              : nft.owner || nft.ownerEmail || "Unknown"}
          </span>
        </div>

        {/* Hash */}
        <div className="text-xs">
          <span className="text-slate-400">SHA-256: </span>
          <span className="font-mono text-slate-300">
            {(nft.sha256 || nft.hash)?.slice(0, 18)}...
          </span>
        </div>

        {/* AI Verdict */}
        {nft.geminiAnalysis?.verdict && (
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            nft.geminiAnalysis.verdict === "AUTHENTIC" ? "badge-original"
            : nft.geminiAnalysis.verdict === "MANIPULATED" ? "badge-duplicate"
            : "badge-suspicious"
          }`}>
            🤖 AI: {nft.geminiAnalysis.verdict}
          </span>
        )}

        {/* Blockchain TX */}
        {nft.nftTxHash && (
          <a
            href={`https://amoy.polygonscan.com/tx/${nft.nftTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs text-amber-400 hover:text-amber-300 truncate transition-colors"
            title={`Tx: ${nft.nftTxHash}`}
          >
            ⛓️ View on PolygonScan ↗
          </a>
        )}

        {/* Date */}
        {nft.timestamp && (
          <p className="text-xs text-slate-500">
            📅 {new Date(nft.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        )}
      </div>
    </motion.article>
  );
}

function MyNFTsPage() {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewAll, setViewAll] = useState(false);
  const { user } = useAuth();
  const { walletAddress } = useWallet();

  useEffect(() => {
    const loadNfts = async () => {
      try {
        setLoading(true);
        let records;
        if (viewAll) {
          records = await getAllNfts();
        } else {
          // Try wallet address first, fallback to email
          const ownerId = walletAddress || user?.email || user?.uid;
          records = await getMyNfts(ownerId);
          // If wallet-based returns nothing, try email
          if (records.length === 0 && walletAddress && user?.email) {
            records = await getMyNfts(user.email);
          }
        }
        setNfts(records);
      } catch (err) {
        toast.error(err.message || "Could not load NFTs");
      } finally {
        setLoading(false);
      }
    };

    if (user) loadNfts();
  }, [user, walletAddress, viewAll]);

  if (loading) return <Spinner label="Loading your protected sports media..." />;

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="brand-font text-3xl font-black text-white">
            🏆 My <span className="text-cyan-400">Protected Media</span>
          </h2>
          <p className="mt-1 text-slate-400">
            Your sports content registered on-chain with NFT proof of ownership.
          </p>
          {walletAddress && (
            <p className="mt-1 text-xs text-emerald-400">
              🦊 Wallet: <span className="font-mono">{walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}</span>
            </p>
          )}
        </div>
        <button
          onClick={() => setViewAll(!viewAll)}
          className="rounded-lg border border-blue-700/50 px-4 py-2 text-sm text-blue-300 hover:bg-blue-900/30 transition-all"
        >
          {viewAll ? "👤 My Assets" : "🌐 All Registered"}
        </button>
      </div>

      {nfts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card rounded-2xl p-12 text-center space-y-3"
        >
          <div className="text-5xl">🏟️</div>
          <p className="text-slate-300 font-semibold">No protected sports media found.</p>
          <p className="text-slate-500 text-sm">
            {walletAddress
              ? "Upload and register a sports file to see it appear here."
              : "Connect your MetaMask wallet, then upload a sports file to protect it."}
          </p>
        </motion.div>
      ) : (
        <>
          <p className="text-sm text-slate-500">{nfts.length} asset{nfts.length !== 1 ? "s" : ""} registered</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {nfts.map((nft, i) => (
              <NFTCard key={nft.id} nft={nft} index={i} />
            ))}
          </div>
        </>
      )}

      {/* Debug Section (Hidden in production, useful for dev) */}
      <div className="mt-20 border-t border-slate-800 pt-10 opacity-30 hover:opacity-100 transition-opacity">
        <h4 className="text-xs uppercase tracking-widest text-slate-500 mb-4">🛠️ Database Debug (Raw)</h4>
        <div className="bg-black/50 rounded-lg p-4 font-mono text-[10px] overflow-auto max-h-60 text-slate-400">
          <p className="mb-2 text-cyan-400">Owner Identifier being checked: {walletAddress || user?.email || "none"}</p>
          {nfts.length > 0 ? (
            <pre>{JSON.stringify(nfts, null, 2)}</pre>
          ) : (
            <p>No NFTs found in current view. Try "All Registered" button above.</p>
          )}
        </div>
      </div>
    </section>
  );
}

export default MyNFTsPage;


