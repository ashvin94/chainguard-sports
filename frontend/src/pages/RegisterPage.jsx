import React, { useState } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function RegisterPage() {
  const [file, setFile] = useState(null);
  const [authorName, setAuthorName] = useState("");
  const [result, setResult] = useState(null);
  const [step, setStep] = useState(null);
  const [error, setError] = useState(null);

  async function handleRegister() {
    if (!file) return alert("Please select a file first!");
    // No wallet needed anymore! ✅

    setError(null);
    setResult(null);

    try {
      setStep("🔍 Analyzing with AI...");
      const formData = new FormData();
      formData.append("file", file);
      if (authorName) formData.append("authorName", authorName);

      const response = await axios.post(
        `${API_URL}/register`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setResult(response.data);
      setStep(null);

    } catch (err) {
      setStep(null);
      setError(err.response?.data?.error || err.message);
    }
  }

  return (
    <div className="page">
      <h2>Upload & Protect</h2>
      <input type="text" placeholder="Enter your name (optional)" value={authorName} onChange={(e) => setAuthorName(e.target.value)} style={{marginBottom: "10px", padding: "8px", width: "100%"}} />
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button
        className="action-btn blue-btn"
        onClick={handleRegister}
        disabled={!file || !!step}
      >
        {step || "🔐 Upload & Protect"}
      </button>
      {error && <p>{error}</p>}
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
