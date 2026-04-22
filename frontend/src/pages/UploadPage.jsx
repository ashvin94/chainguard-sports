import { useState } from "react";
import toast from "react-hot-toast";
import FileUpload from "../components/FileUpload";
import Spinner from "../components/Spinner";
import { useAuth } from "../context/AuthContext";
import { uploadAndCreateNftRecord } from "../firebase/assets";

function UploadPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploaded, setUploaded] = useState(null);
  const { user } = useAuth();

  const handleAnalyze = async () => {
    if (!file) {
      toast.error("Please upload a file first");
      return;
    }

    try {
      setLoading(true);
      const result = await uploadAndCreateNftRecord(file, user);
      setUploaded(result);
      toast.success("Upload complete and NFT record created");
      setFile(null);
    } catch (error) {
      toast.error(error.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spinner label="Analyzing and minting..." />;

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-3xl font-semibold">Upload & Protect</h2>
        <p className="mt-2 text-slate-300">
          Generate SHA-256 and pHash fingerprints, then store only lightweight NFT metadata.
        </p>
      </div>

      <FileUpload file={file} onFileChange={setFile} />

      <button
        type="button"
        onClick={handleAnalyze}
        className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium transition hover:bg-blue-500"
      >
        Generate Hash & Mint Record
      </button>

      {uploaded ? (
        <div className="glass-card space-y-2 rounded-xl p-4 text-sm text-slate-200">
          <p className="font-semibold text-emerald-300">Fingerprint Record Created</p>
          <p>
            Record ID: <span className="text-slate-300">{uploaded.id}</span>
          </p>
          <p>
            Hash: <span className="text-slate-300">{uploaded.hash.slice(0, 24)}...</span>
          </p>
          {uploaded.pHash ? (
            <p>
              pHash: <span className="text-slate-300">{uploaded.pHash.slice(0, 24)}...</span>
            </p>
          ) : (
            <p className="text-slate-400">pHash: N/A (non-image file)</p>
          )}
        </div>
      ) : null}
    </section>
  );
}

export default UploadPage;
