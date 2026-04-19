import React, { useState } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function DetectPage() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleDetect() {
    if (!file) return alert("Select file first.");
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await axios.post(`${API_URL}/detect`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
    setLoading(false);
  }

  return (
    <div className="page">
      <h2>Check Similarity</h2>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button className="action-btn" onClick={handleDetect} disabled={!file || loading}>
        {loading ? "Analyzing..." : "Check Now"}
      </button>
      {error && <p>{error}</p>}
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
