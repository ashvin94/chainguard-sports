import { useEffect, useState } from "react";
import toast from "react-hot-toast";

/**
 * ServerWaker - A background component that pings the Render backend on load.
 * This ensures that if the server was sleeping, it starts waking up 
 * as soon as the user opens the landing page.
 */
export default function ServerWaker() {
  const [isWaking, setIsWaking] = useState(false);

  useEffect(() => {
    const wakeServer = async () => {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      
      // We set a timeout for the first ping. If it takes > 2 seconds, 
      // the server is likely sleeping.
      const controller = new AbortController();
      const id = setTimeout(() => {
        setIsWaking(true);
      }, 2000);

      try {
        await fetch(`${API_URL}/test`, { signal: controller.signal });
        clearTimeout(id);
        if (isWaking) {
          toast.success("AI Shield Engine is warm and ready!", { icon: "🔥", duration: 4000 });
          setIsWaking(false);
        }
      } catch (err) {
        console.log("Server waking up...");
      }
    };

    wakeServer();
  }, [isWaking]);

  if (!isWaking) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex items-center gap-3 rounded-full bg-slate-900/90 border border-cyan-500/30 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-cyan-400 shadow-2xl backdrop-blur-md">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500"></span>
        </span>
        🤖 AI Shield Engine Warming Up...
      </div>
    </div>
  );
}
