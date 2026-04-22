import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";
import logoImg from "../assets/img/logo.jpg";

const links = [
  { label: "Home", to: "/" },
  { label: "Upload", to: "/upload" },
  { label: "My NFTs", to: "/my-nfts" },
  { label: "Check", to: "/check" },
];

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { walletAddress, connecting, isWrongNetwork, connectWallet, disconnectWallet, switchNetwork } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    disconnectWallet();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const handleWalletConnect = async () => {
    if (isWrongNetwork) {
      await switchNetwork();
      return;
    }
    if (walletAddress) {
      disconnectWallet();
      toast("Wallet disconnected", { icon: "🔌" });
      return;
    }
    const addr = await connectWallet();
    if (addr) toast.success(`Wallet connected: ${addr.slice(0, 6)}...${addr.slice(-4)}`);
  };

  const shortAddr = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : null;

  return (
    <header className="sticky top-0 z-50 border-b border-blue-900/40 bg-[#020617]/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 md:px-8">
        {/* Logo + Brand */}
        <Link to="/" className="flex items-center gap-3 group shrink-0">
          <img
            src={logoImg}
            alt="SportShield AI Logo"
            className="h-9 w-9 md:h-10 md:w-10 object-contain transition-transform duration-300 group-hover:scale-110 rounded-lg mix-blend-screen"
          />
          <div className="flex flex-col leading-tight">
            <span className="brand-font text-sm md:text-base font-bold text-white tracking-wide">
              SPORT<span className="text-cyan-400">SHIELD</span>
              <span className="text-blue-400 text-[10px] md:text-xs ml-1">AI</span>
            </span>
            <span className="hidden md:block text-[8px] md:text-[10px] text-slate-400 tracking-widest uppercase">
              Protecting Sports Media
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                location.pathname === link.to
                  ? "bg-blue-900/40 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={handleWalletConnect}
            disabled={connecting}
            className={`flex items-center gap-2 rounded-xl px-3 py-1.5 md:px-4 md:py-2 text-[10px] font-bold transition-all md:text-sm ${
              isWrongNetwork 
                ? "bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_15px_rgba(225,29,72,0.4)]"
                : walletAddress
                ? "bg-emerald-900/30 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-900/50"
                : "wallet-btn text-white"
            }`}
          >
            {connecting ? (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : isWrongNetwork ? (
              "⚠️ Network"
            ) : walletAddress ? (
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">{shortAddr}</span>
                <span className="sm:hidden font-mono">{walletAddress.slice(-4)}</span>
              </div>
            ) : (
              "🦊 Connect"
            )}
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-white/5 text-white md:hidden"
          >
            <span className="sr-only">Toggle menu</span>
            {isMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 top-[61px] z-40 bg-[#020617]/95 backdrop-blur-2xl md:hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <nav className="flex flex-col gap-2 p-6">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsMenuOpen(false)}
                className={`rounded-xl p-4 text-lg font-bold transition-all ${
                  location.pathname === link.to
                    ? "bg-blue-900/40 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                    : "text-slate-300 hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
            
            <div className="mt-6 border-t border-slate-800 pt-6">
              {user ? (
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-slate-400 px-4">Logged in as {user.email}</p>
                  <button
                    onClick={handleLogout}
                    className="w-full rounded-xl bg-red-900/20 border border-red-500/40 p-4 text-center font-bold text-red-300"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="block w-full rounded-xl bg-blue-600 p-4 text-center font-bold text-white"
                >
                  Login to Creator Dashboard
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export default Navbar;
