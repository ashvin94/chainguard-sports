import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const links = [
  { label: "Home", to: "/" },
  { label: "Upload", to: "/upload" },
  { label: "My NFTs", to: "/my-nfts" },
  { label: "Check", to: "/check" },
];

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-blue-300/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 md:px-8">
        <Link to="/" className="text-lg font-semibold text-blue-200">
          Digital Asset Protection
        </Link>
        <nav className="flex items-center gap-2 md:gap-4">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`rounded-md px-3 py-1.5 text-sm transition ${
                location.pathname === link.to
                  ? "bg-blue-500/25 text-blue-100"
                  : "text-slate-300 hover:bg-blue-500/10 hover:text-blue-100"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md border border-blue-300/30 px-3 py-1.5 text-sm text-blue-100 hover:bg-blue-500/20"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className="rounded-md border border-blue-300/30 px-3 py-1.5 text-sm text-blue-100 hover:bg-blue-500/20"
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
