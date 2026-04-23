import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import ServerWaker from "./components/ServerWaker";
import ProtectedRoute from "./routes/ProtectedRoute";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import UploadPage from "./pages/UploadPage";
import MyNFTsPage from "./pages/MyNFTsPage";
import CheckPage from "./pages/CheckPage";

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      <ServerWaker />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.2),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(30,64,175,0.2),_transparent_35%)]" />
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 pb-10 pt-6 md:px-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <UploadPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-nfts"
            element={
              <ProtectedRoute>
                <MyNFTsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/check" element={<CheckPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
