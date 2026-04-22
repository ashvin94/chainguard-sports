import { motion } from "framer-motion";

function Spinner({ label = "Loading..." }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
      <motion.div
        className="h-12 w-12 rounded-full border-4 border-blue-200/30 border-t-blue-400"
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      />
      <p className="text-sm text-slate-300">{label}</p>
    </div>
  );
}

export default Spinner;
