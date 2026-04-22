import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import FeatureCard from "../components/FeatureCard";
import { useWallet } from "../context/WalletContext";
import logoImg from "../assets/img/logo.jpg";

const cards = [
  {
    title: "🛡️ Upload & Shield",
    description:
      "Upload your sports photo, video, audio, or document. AI analyzes authenticity and registers ownership on-chain via NFT.",
    cta: "Shield My Content",
    to: "/upload",
  },
  {
    title: "🖼️ My Protected Assets",
    description:
      "View all your registered sports media with on-chain proof. Your wallet address is the true owner — no middleman.",
    cta: "View Collection",
    to: "/my-nfts",
  },
  {
    title: "🔍 Detect Piracy",
    description:
      "Upload any sports file to instantly check if it is original or a copied/manipulated version using AI + fingerprinting.",
    cta: "Run AI Check",
    to: "/check",
  },
];

const stats = [
  { label: "Blockchain", value: "Polygon Amoy", icon: "⛓️" },
  { label: "AI Engine", value: "Google Gemini", icon: "🤖" },
  { label: "Storage", value: "IPFS / Pinata", icon: "☁️" },
  { label: "Media Types", value: "Image · Video · Audio · Doc", icon: "📁" },
];

function HomePage() {
  const { walletAddress, connectWallet } = useWallet();

  return (
    <div className="space-y-10">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass-card relative overflow-hidden rounded-3xl p-8 text-center md:p-14 sport-glow"
      >
        {/* Background pitch lines decoration */}
        <div className="pointer-events-none absolute inset-0 opacity-5">
          <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-white" />
          <div className="absolute left-1/4 top-0 h-full w-0.5 bg-white opacity-50" />
          <div className="absolute right-1/4 top-0 h-full w-0.5 bg-white opacity-50" />
          <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white" />
        </div>

        <div className="relative">
          <img
            src={logoImg}
            alt="SportShield AI"
            className="mx-auto mb-5 h-32 w-32 object-contain drop-shadow-[0_0_20px_rgba(29,78,216,0.8)]"
            style={{ animation: "shield-pulse 3s ease-in-out infinite" }}
          />
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-semibold">
            AI · Web3 · NFT
          </p>
          <h1 className="brand-font mx-auto mt-3 max-w-4xl text-3xl font-black leading-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
            SPORT<span className="text-cyan-400">SHIELD</span>{" "}
            <span className="text-blue-400">AI</span>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-300 sm:text-base md:text-lg">
            <span className="font-semibold text-cyan-300">
              Protecting the Integrity of Digital Sports Media
            </span>{" "}
            using Artificial Intelligence &amp; Blockchain
          </p>

          {!walletAddress && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              onClick={connectWallet}
              className="wallet-btn mt-6 inline-flex items-center gap-2 rounded-xl px-8 py-3 text-base font-bold text-white"
            >
              🦊 Connect MetaMask to Start
            </motion.button>
          )}

          {walletAddress && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-900/20 px-6 py-2.5 text-sm font-medium text-emerald-300"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Wallet connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </motion.div>
          )}
        </div>
      </motion.section>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i + 0.3 }}
            className="glass-card rounded-xl p-4 text-center"
          >
            <div className="text-2xl mb-1">{s.icon}</div>
            <p className="text-xs text-slate-400 uppercase tracking-wider">{s.label}</p>
            <p className="mt-0.5 text-sm font-semibold text-white">{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Feature Cards */}
      <section className="grid gap-5 md:grid-cols-3">
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.12 + 0.5 }}
          >
            <FeatureCard {...card} />
          </motion.div>
        ))}
      </section>

      {/* Problem Statement Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="ai-box rounded-2xl p-6 text-center"
      >
        <p className="text-xs uppercase tracking-widest text-cyan-500 mb-2">Research Problem</p>
        <p className="text-slate-200 text-sm leading-relaxed max-w-3xl mx-auto">
          Digital sports content — match footage, athlete photos, live clips — is frequently stolen, manipulated, and re-published without consent.
          <span className="text-cyan-300 font-semibold"> SportShield AI</span> uses cryptographic fingerprinting, Google Gemini AI analysis, and on-chain NFT registration to ensure every piece of sports media has a verifiable, tamper-proof digital identity.
        </p>
      </motion.div>
    </div>
  );
}

export default HomePage;
