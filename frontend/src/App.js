import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import RegisterPage from "./pages/RegisterPage";
import DetectPage from "./pages/DetectPage";
import MyNFTsPage from "./pages/MyNFTsPage";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="header">
          <div className="header-left">
            <span className="logo">ChainGuard Sports</span>
            <nav className="nav">
              <Link to="/">Upload & Protect</Link>
              <Link to="/detect">Check Similarity</Link>
              <Link to="/mynfts">My NFTs</Link>
            </nav>
          </div>
        </header>

        <main className="main">
          <Routes>
            <Route path="/" element={<RegisterPage />} />
            <Route path="/detect" element={<DetectPage />} />
            <Route path="/mynfts" element={<MyNFTsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
