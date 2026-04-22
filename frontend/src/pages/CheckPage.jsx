import { useState } from "react";
import toast from "react-hot-toast";
import FileUpload from "../components/FileUpload";
import Spinner from "../components/Spinner";
import { buildAssetFingerprints, getAllNfts } from "../firebase/assets";

function CheckPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [details, setDetails] = useState(null);

  const scoreFromPHash = (incoming, existing) => {
    if (!incoming || !existing) return 0;
    let distance = 0;
    const length = Math.min(incoming.length, existing.length);
    for (let i = 0; i < length; i += 1) {
      if (incoming[i] !== existing[i]) distance += 1;
    }
    const similarity = Math.max(0, 100 - Math.floor((distance / length) * 100));
    return similarity;
  };

  const runSimilarityCheck = async () => {
    if (!file) {
      toast.error("Please upload a file to check");
      return;
    }

    try {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const records = await getAllNfts();
      const incoming = await buildAssetFingerprints(file);

      if (records.length === 0) {
        setResult({ status: "Original", similarity: 8 });
        setDetails({
          matchedFile: "No existing records",
          method: "SHA-256 + pHash",
          confidence: "Low",
          recommendation: "Register this asset first for stronger checks.",
        });
        return;
      }

      const exact = records.find((nft) => nft.hash && nft.hash === incoming.hash);
      if (exact) {
        setResult({ status: "Duplicate", similarity: 100 });
        setDetails({
          matchedFile: exact.fileName || exact.title,
          matchedOwner: exact.ownerEmail || "Unknown",
          matchedHash: exact.hash?.slice(0, 22),
          method: "Exact SHA-256 match",
          confidence: "High",
          recommendation: "Exact duplicate detected. Treat as already protected content.",
        });
        return;
      }

      let best = null;
      for (const nft of records) {
        const similarity = scoreFromPHash(incoming.pHash, nft.pHash);
        if (!best || similarity > best.similarity) {
          best = { nft, similarity };
        }
      }

      const status = best && best.similarity > 75 ? "Duplicate" : "Original";
      const score = best?.similarity ?? 0;
      setResult({ status, similarity: score });
      setDetails({
        matchedFile: best?.nft.fileName || best?.nft.title || "No pHash candidate",
        matchedOwner: best?.nft.ownerEmail || "Unknown",
        matchedHash: best?.nft.hash?.slice(0, 22),
        method: incoming.pHash ? "Image pHash similarity" : "SHA-256 only (non-image file)",
        confidence: score > 90 ? "High" : score > 70 ? "Medium" : "Low",
        recommendation:
          status === "Duplicate"
            ? "Potential conflict detected. Verify ownership and minting history."
            : "No high-risk match found. You can proceed to upload and protect.",
      });
    } catch (error) {
      toast.error(error.message || "Check failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-3xl font-semibold">Check Similarity</h2>
        <p className="mt-2 text-slate-300">Public AI check for originality and match score.</p>
      </div>

      <FileUpload file={file} onFileChange={setFile} />

      <button
        type="button"
        onClick={runSimilarityCheck}
        className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium transition hover:bg-blue-500"
      >
        Check File
      </button>

      {loading ? <Spinner label="Comparing fingerprints..." /> : null}

      {result ? (
        <div className="glass-card space-y-2 rounded-xl p-4">
          <p className="text-lg">
            Result:{" "}
            <span
              className={
                result.status === "Original" ? "text-emerald-300" : "text-rose-300"
              }
            >
              {result.status}
            </span>
          </p>
          <p className="mt-1 text-slate-300">Similarity: {result.similarity ?? 0}%</p>
          {details ? (
            <>
              <p className="text-sm text-slate-300">Matched record: {details.matchedFile}</p>
              <p className="text-sm text-slate-300">Matched owner: {details.matchedOwner || "N/A"}</p>
              <p className="text-sm text-slate-300">Matched hash: {details.matchedHash || "N/A"}</p>
              <p className="text-sm text-slate-300">Method: {details.method}</p>
              <p className="text-sm text-slate-300">Confidence: {details.confidence}</p>
              <p className="text-sm text-blue-200">Recommendation: {details.recommendation}</p>
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export default CheckPage;
