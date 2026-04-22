import { motion } from "framer-motion";
import { Link } from "react-router-dom";

function FeatureCard({ title, description, icon, cta, to }) {
  return (
    <motion.div
      whileHover={{ scale: 1.04, rotateX: -4, rotateY: 4 }}
      transition={{ type: "spring", stiffness: 220, damping: 15 }}
      className="glass-card group relative rounded-2xl p-6"
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute inset-0 rounded-2xl bg-blue-500/10 blur-xl" />
      </div>
      <div className="relative space-y-4">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 text-2xl">
          {icon}
        </span>
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-sm text-slate-300">{description}</p>
        <Link
          to={to}
          className="inline-block rounded-lg border border-blue-300/30 bg-blue-500/20 px-4 py-2 text-sm font-medium text-blue-100 transition hover:bg-blue-500/40"
        >
          {cta}
        </Link>
      </div>
    </motion.div>
  );
}

export default FeatureCard;
