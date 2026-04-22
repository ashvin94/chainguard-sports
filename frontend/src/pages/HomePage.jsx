import { motion } from "framer-motion";
import FeatureCard from "../components/FeatureCard";

const cards = [
  {
    title: "Upload & Protect",
    description: "Upload your media asset and secure ownership with AI + NFT minting.",
    icon: "🛡️",
    cta: "Start Upload",
    to: "/upload",
  },
  {
    title: "My NFTs",
    description: "Track protected assets and ownership metadata in one dashboard.",
    icon: "🖼️",
    cta: "View Collection",
    to: "/my-nfts",
  },
  {
    title: "Check Similarity",
    description: "Run instant originality checks against known digital fingerprints.",
    icon: "🔍",
    cta: "Run Check",
    to: "/check",
  },
];

function HomePage() {
  return (
    <div className="space-y-10">
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-8 text-center md:p-12"
      >
        <p className="text-sm uppercase tracking-[0.2em] text-blue-300/80">
          AI + Web3 Security
        </p>
        <h1 className="mx-auto mt-4 max-w-4xl text-3xl font-bold leading-tight md:text-5xl">
          Protect Your Digital Assets using AI + Web3
        </h1>
      </motion.section>

      <section className="grid gap-6 md:grid-cols-3">
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.12 }}
          >
            <FeatureCard {...card} />
          </motion.div>
        ))}
      </section>
    </div>
  );
}

export default HomePage;
