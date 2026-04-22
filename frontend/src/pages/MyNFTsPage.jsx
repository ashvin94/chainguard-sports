import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Spinner from "../components/Spinner";
import { useAuth } from "../context/AuthContext";
import { getMyNfts } from "../firebase/assets";

function MyNFTsPage() {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadNfts = async () => {
      try {
        setLoading(true);
        const records = await getMyNfts(user.uid);
        setNfts(records);
      } catch (error) {
        toast.error(error.message || "Could not load NFTs");
      } finally {
        setLoading(false);
      }
    };

    loadNfts();
  }, [user.uid]);

  if (loading) return <Spinner label="Loading your NFTs..." />;

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold">My NFTs</h2>
        <p className="mt-2 text-slate-300">Your protected assets and on-chain proofs.</p>
      </div>

      {nfts.length === 0 ? (
        <div className="glass-card rounded-2xl p-6 text-slate-300">
          No NFT records found yet. Upload an asset to create your first one.
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {nfts.map((nft) => (
          <article key={nft.id} className="glass-card overflow-hidden rounded-2xl">
            <img
              src={
                nft.imageUrl ||
                "https://images.unsplash.com/photo-1618005198919-d3d4b5a92eee?auto=format&fit=crop&w=800&q=80"
              }
              alt={nft.title}
              className="h-40 w-full object-cover"
            />
            <div className="space-y-2 p-4">
              <h3 className="text-lg font-semibold">{nft.title}</h3>
              <p className="text-xs text-slate-300">Hash: {nft.hash?.slice(0, 20)}...</p>
              <p className="text-xs text-slate-300">
                pHash: {nft.pHash ? `${nft.pHash.slice(0, 20)}...` : "N/A"}
              </p>
              <p className="text-xs text-slate-300">Owner: {nft.ownerEmail}</p>
              <p className="text-xs text-slate-400">Token: {nft.tokenId}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default MyNFTsPage;
